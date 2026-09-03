'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiArrowPath,
  HiCheck,
  HiClipboardDocument,
  HiExclamationTriangle,
  HiMagnifyingGlass,
  HiTrash,
} from 'react-icons/hi2';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  INTRODUCTION_STATUSES,
  INTRODUCTION_STATUS_LABELS,
  type IntroductionStatus,
  buildBuyerIntroductionMessage,
  buildGroupIntroductionMessage,
  buildSellerIntroductionMessage,
  buildWhatsappUrl,
} from '@/app/lib/product-interest';

type IntroductionRequest = {
  id: number;
  code: string;
  product_id: number | null;
  product_sku: string;
  product_slug: string | null;
  product_name: string | null;
  product_size: string | null;
  product_color: string | null;
  seller_id: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_consent_at?: string | null;
  seller_whatsapp?: string | null;
  seller_notified_at?: string | null;
  seller_notification_message_id?: string | null;
  seller_notification_error?: string | null;
  last_whatsapp_status?: string | null;
  status: IntroductionStatus;
  availability_confirmed: boolean;
  source: string;
  whatsapp_message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  seller: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
};

type IntroductionsResponse = {
  requests?: IntroductionRequest[];
  error?: string;
};

const statusFilters = [
  { value: 'all', label: 'Tous' },
  ...INTRODUCTION_STATUSES.map((status) => ({
    value: status,
    label: INTRODUCTION_STATUS_LABELS[status],
  })),
];

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusClasses(status: IntroductionStatus) {
  if (status === 'new') return 'bg-blue-50 text-blue-700';
  if (status === 'cancelled') return 'bg-red-50 text-red-700';
  if (status === 'sale_coordinated') return 'bg-emerald-50 text-emerald-700';
  if (status === 'group_created') return 'bg-purple-50 text-purple-700';
  return 'bg-amber-50 text-amber-700';
}

function getProductUrl(request: IntroductionRequest) {
  if (!request.product_slug) return null;
  if (typeof window === 'undefined') return `/products/${request.product_slug}`;
  return new URL(`/products/${request.product_slug}`, window.location.origin)
    .href;
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function AdminIntroductionsPage() {
  const [requests, setRequests] = useState<IntroductionRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') {
        query.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/introductions?${query}`, {
        cache: 'no-store',
      });
      const data = (await response.json()) as IntroductionsResponse;

      if (!response.ok) {
        throw new Error(
          data.error ?? 'Impossible de charger les demandes de contact.'
        );
      }

      const nextRequests = data.requests ?? [];
      setRequests(nextRequests);
      setSelectedId((current) => {
        if (current && nextRequests.some((item) => item.id === current)) {
          return current;
        }
        return nextRequests[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Impossible de charger les demandes de contact.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? null,
    [requests, selectedId]
  );

  useEffect(() => {
    setBuyerName(selectedRequest?.buyer_name ?? '');
    setBuyerPhone(selectedRequest?.buyer_phone ?? '');
    setNotes(selectedRequest?.notes ?? '');
    setAvailabilityConfirmed(
      selectedRequest?.availability_confirmed ?? false
    );
  }, [selectedRequest]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return requests;

    return requests.filter((request) => {
      const haystack = [
        request.code,
        request.product_sku,
        request.product_name,
        request.buyer_name,
        request.buyer_phone,
        request.seller?.name,
        request.seller?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [requests, searchTerm]);

  const productSnapshot = useMemo(() => {
    if (!selectedRequest) return null;

    return {
      sku: selectedRequest.product_sku,
      name: selectedRequest.product_name,
      size: selectedRequest.product_size,
      color: selectedRequest.product_color,
      url: getProductUrl(selectedRequest),
    };
  }, [selectedRequest]);

  const templates = useMemo(() => {
    if (!selectedRequest || !productSnapshot) return null;

    const input = {
      code: selectedRequest.code,
      product: productSnapshot,
      sellerName: selectedRequest.seller?.name,
      buyerName,
      availabilityConfirmed,
    };

    return {
      seller: buildSellerIntroductionMessage(input),
      buyer: buildBuyerIntroductionMessage(input),
      group: buildGroupIntroductionMessage(input),
    };
  }, [availabilityConfirmed, buyerName, productSnapshot, selectedRequest]);

  async function updateRequest(
    id: number,
    payload: Record<string, unknown>,
    options: { silent?: boolean } = {}
  ) {
    setSaving(true);
    if (!options.silent) setError(null);

    try {
      const response = await fetch(`/api/admin/introductions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        request?: Partial<IntroductionRequest>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Mise à jour impossible.');
      }

      if (data.request) {
        setRequests((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...data.request } : item
          )
        );
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Mise à jour impossible.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    if (!selectedRequest) return;
    await updateRequest(selectedRequest.id, {
      buyerName,
      buyerPhone,
      notes,
      availabilityConfirmed,
    });
  }

  async function setStatus(status: IntroductionStatus) {
    if (!selectedRequest) return;
    await updateRequest(selectedRequest.id, { status }, { silent: true });
  }

  async function deleteSelectedRequest() {
    if (!selectedRequest || deleting) return;

    const confirmed = window.confirm(
      `Supprimer définitivement la demande ${selectedRequest.code} ?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/introductions/${selectedRequest.id}`,
        {
          method: 'DELETE',
        }
      );
      const data = (await response.json()) as {
        deletedId?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Suppression impossible.');
      }

      setRequests((current) => {
        const nextRequests = current.filter(
          (item) => item.id !== selectedRequest.id
        );
        setSelectedId(nextRequests[0]?.id ?? null);
        return nextRequests;
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Suppression impossible.'
      );
    } finally {
      setDeleting(false);
    }
  }

  async function copyTemplate(label: string, text: string) {
    try {
      await copyToClipboard(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError(
        'Copie impossible depuis ce navigateur. Le texte reste sélectionnable.'
      );
    }
  }

  async function openWhatsapp(
    phone: string | null | undefined,
    message: string,
    nextStatus?: IntroductionStatus
  ) {
    const url = buildWhatsappUrl(phone, message);
    if (!url) {
      setError('Numéro WhatsApp manquant ou invalide.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');

    if (selectedRequest && nextStatus) {
      await updateRequest(
        selectedRequest.id,
        {
          buyerName,
          buyerPhone,
          notes,
          availabilityConfirmed,
          status: nextStatus,
        },
        { silent: true }
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-800">
              Back-office
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Mise en relation WhatsApp
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Retrouve les demandes entrantes, complète l&apos;acheteuse, puis
              ouvre les messages prêts à envoyer à la vendeuse et à
              l&apos;acheteuse.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRequests()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            disabled={loading}
          >
            <HiArrowPath className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Actualiser
          </button>
        </header>

        {error && (
          <div
            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            <HiExclamationTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="relative">
                <HiMagnifyingGlass className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher code, SKU, vendeuse..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 outline-none focus:border-primary-700 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      statusFilter === filter.value
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <p className="p-5 text-sm text-gray-500">Chargement...</p>
              ) : filteredRequests.length === 0 ? (
                <p className="p-5 text-sm text-gray-500">
                  Aucune demande trouvée.
                </p>
              ) : (
                filteredRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`block w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/70 ${
                      selectedId === request.id
                        ? 'bg-primary-50 dark:bg-primary-950/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold">
                          {request.code}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {request.product_sku}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}
                      >
                        {INTRODUCTION_STATUS_LABELS[request.status]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                      {request.product_name ?? 'Produit sans nom'}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Vendeuse : {request.seller?.name ?? 'Non renseignée'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Acheteuse : {request.buyer_name ?? 'À compléter'}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(request.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {!selectedRequest || !templates || !productSnapshot ? (
              <p className="text-sm text-gray-500">
                Sélectionne une demande pour préparer la mise en relation.
              </p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 dark:border-gray-800 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-primary-800">
                      {selectedRequest.code}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">
                      {selectedRequest.product_name ??
                        selectedRequest.product_sku}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      SKU {selectedRequest.product_sku} · Talla{' '}
                      {selectedRequest.product_size ?? 'Desconocido'} · Color{' '}
                      {selectedRequest.product_color ?? 'Desconocido'}
                    </p>
                    {selectedRequest.product_slug && (
                      <a
                        href={`/products/${selectedRequest.product_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-primary-800 hover:underline"
                      >
                        Ouvrir la fiche produit
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedRequest.status}
                      onChange={(event) =>
                        void setStatus(event.target.value as IntroductionStatus)
                      }
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950"
                    >
                      {INTRODUCTION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {INTRODUCTION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => void deleteSelectedRequest()}
                      disabled={deleting}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <HiTrash className="h-4 w-4" />
                      {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="text-sm font-bold">Vendeuse</h3>
                    <p className="mt-2 text-sm">
                      {selectedRequest.seller?.name ?? 'Nom non renseigné'}
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-400">
                      {selectedRequest.seller?.phone ?? 'WhatsApp manquant'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="text-sm font-bold">Acheteuse</h3>
                    <div className="mt-3 space-y-3">
                      <input
                        value={buyerName}
                        onChange={(event) => setBuyerName(event.target.value)}
                        placeholder="Nom, ex: Romy"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                      />
                      <input
                        value={buyerPhone}
                        onChange={(event) => setBuyerPhone(event.target.value)}
                        placeholder="WhatsApp, ex: +54 9 11..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <h3 className="text-sm font-bold">
                    Automatisation WhatsApp
                  </h3>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Notification vendeuse
                      </p>
                      <p className="mt-1">
                        {selectedRequest.seller_notified_at
                          ? formatDate(selectedRequest.seller_notified_at)
                          : 'Pas encore envoyée'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Dernier statut Meta
                      </p>
                      <p className="mt-1">
                        {selectedRequest.last_whatsapp_status ?? 'Non reçu'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-gray-500">
                        Message ID
                      </p>
                      <p className="mt-1 break-all font-mono text-xs">
                        {selectedRequest.seller_notification_message_id ??
                          'Non disponible'}
                      </p>
                    </div>
                    {selectedRequest.seller_notification_error && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-red-600">
                          Erreur
                        </p>
                        <p className="mt-1 text-red-700">
                          {selectedRequest.seller_notification_error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={availabilityConfirmed}
                        onChange={(event) =>
                          setAvailabilityConfirmed(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Disponibilité confirmée par la vendeuse
                    </label>

                    <button
                      type="button"
                      onClick={() => void saveDraft()}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
                    >
                      <HiCheck className="h-4 w-4" />
                      Enregistrer
                    </button>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Notes internes : relance, disponibilité, prix négocié..."
                    className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  />
                </div>

                {selectedRequest.whatsapp_message && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="text-sm font-bold">
                      Message entrant attendu côté Circular
                    </h3>
                    <pre className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs leading-5 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
                      {selectedRequest.whatsapp_message}
                    </pre>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold">Templates prêts</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    WhatsApp ne permet pas de créer le groupe automatiquement :
                    crée le groupe, puis colle le message de groupe.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <TemplateBlock
                      title="1. Message à la vendeuse"
                      text={templates.seller}
                      copied={copied === 'seller'}
                      onCopy={() => void copyTemplate('seller', templates.seller)}
                      onWhatsapp={() =>
                        void openWhatsapp(
                          selectedRequest.seller?.phone,
                          templates.seller,
                          'seller_contacted'
                        )
                      }
                      whatsappDisabled={!selectedRequest.seller?.phone}
                    />

                    <TemplateBlock
                      title="2. Message à l'acheteuse"
                      text={templates.buyer}
                      copied={copied === 'buyer'}
                      onCopy={() => void copyTemplate('buyer', templates.buyer)}
                      onWhatsapp={() =>
                        void openWhatsapp(
                          buyerPhone,
                          templates.buyer,
                          'buyer_contacted'
                        )
                      }
                      whatsappDisabled={!buyerPhone.trim()}
                    />

                    <TemplateBlock
                      title="3. Message pour le groupe"
                      text={templates.group}
                      copied={copied === 'group'}
                      onCopy={() => void copyTemplate('group', templates.group)}
                      secondaryAction={{
                        label: 'Marquer groupe créé',
                        onClick: () => void setStatus('group_created'),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function TemplateBlock({
  title,
  text,
  copied,
  onCopy,
  onWhatsapp,
  whatsappDisabled = false,
  secondaryAction,
}: {
  title: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
  onWhatsapp?: () => void;
  whatsappDisabled?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h4 className="text-sm font-bold">{title}</h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {copied ? (
              <HiCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <HiClipboardDocument className="h-4 w-4" />
            )}
            {copied ? 'Copié' : 'Copier'}
          </button>

          {onWhatsapp && (
            <button
              type="button"
              onClick={onWhatsapp}
              disabled={whatsappDisabled}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaWhatsapp className="h-4 w-4" />
              Ouvrir WhatsApp
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>

      <textarea
        readOnly
        value={text}
        rows={5}
        className="mt-3 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
      />
    </div>
  );
}
