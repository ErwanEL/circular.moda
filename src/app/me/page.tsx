'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import {
  Card,
  Alert,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'flowbite-react';
import Button from '../ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ProfileForm from './ui/profile-form';

interface UserProfile {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Product {
  id: number;
  name: string;
  public_id: string;
  images: string[];
  price: number | null;
  category: string | null;
  size: string | null;
  created_at: string;
}

export default function MePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle auth callback code exchange
    const handleAuthCallback = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth error:', error);
      }
    };
    handleAuthCallback();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.push('/login');
        return;
      }

      setEmail(user.email);

      // Try to fetch from API
      const response = await fetch('/api/me');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Error loading profile');
      }

      const data = await response.json();
      setUserProfile(data.user);
      setProducts(data.products || []);
      setName(data.user?.name || '');
      setPhone(phoneFromDb(data.user?.phone || ''));
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phoneForDb(phone);
    if (!fullPhone) {
      setMessage({
        type: 'error',
        text: 'Ingresa tu número de WhatsApp (solo números después de +54)',
      });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: fullPhone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error');
      }

      setUserProfile(data.user);
      setMessage({ type: 'success', text: 'Perfil actualizado' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error',
      });
    } finally {
      setSaving(false);
    }
  };

  /** Strip Argentina country code for display in the local-number input */
  function phoneFromDb(dbPhone: string): string {
    if (!dbPhone) return '';
    const trimmed = dbPhone.trim();
    if (trimmed.startsWith('+54'))
      return trimmed.slice(3).replace(/\s/g, ' ').trim();
    if (trimmed.startsWith('54') && /^\d{2,}/.test(trimmed.slice(2)))
      return trimmed.slice(2).replace(/\s/g, ' ').trim();
    return trimmed;
  }

  /** Build full E.164-style number for DB (Argentina +54 + digits) */
  function phoneForDb(localPart: string): string {
    const digits = localPart.replace(/\D/g, '');
    return digits ? '+54' + digits : '';
  }

  const getProductSlug = (product: Product) => {
    const nameSlug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${nameSlug}-${product.public_id}`;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consultar precio';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/me/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
      setMessage({ type: 'success', text: 'Prenda eliminada correctamente.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al eliminar',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          ¡Bienvenido{userProfile?.name ? `, ${userProfile.name}` : ''}!
        </h1>

        {message && (
          <Alert
            color={message.type === 'success' ? 'success' : 'failure'}
            className="mb-6"
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {userProfile && !userProfile.phone && (
          <Alert color="warning" className="mb-6">
            <div>
              <h3 className="font-semibold">¡WhatsApp requerido!</h3>
              <p className="mt-1 text-sm">
                Agrega tu número de WhatsApp para que podamos contactarte.
              </p>
            </div>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileForm
              email={email}
              name={name}
              phone={phone}
              saving={saving}
              onSubmit={handleSubmit}
              setName={setName}
              setPhone={setPhone}
            />

            <Card>
              <h3 className="mb-4 text-lg font-semibold">
                Publicar nueva prenda
              </h3>
              <Button
                href="/me/product/add"
                variant="primary"
                solid
                className="w-full"
              >
                Agregar prenda
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Mis Prendas</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {products.length} prenda{products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {products.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-gray-500">
                    Aún no has publicado ninguna prenda
                  </p>
                  <Button href="/me/product/add" variant="primary" solid>
                    Publicar mi primera prenda
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => {
                    const slug = getProductSlug(product);
                    const firstImage =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : null;

                    return (
                      <div key={product.id} className="group block">
                        <Card className="h-full transition-shadow hover:shadow-lg">
                          <Link href={`/products/${slug}`}>
                            <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-200">
                              {firstImage ? (
                                <Image
                                  src={firstImage}
                                  alt={product.name}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                  Sin imagen
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
                                {product.name}
                              </h3>
                              {product.category && (
                                <p className="mb-2 text-sm text-gray-600">
                                  {product.category}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <p className="text-xl font-bold">
                                  {formatPrice(product.price)}
                                </p>
                                {product.size && (
                                  <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                                    Talle: {product.size}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div className="flex gap-2 border-t border-gray-200 p-3">
                            <Button
                              href={`/me/product/${product.id}/edit`}
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                            >
                              Editar
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setProductToDelete(product);
                              }}
                              className="flex-1 rounded-full border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                            >
                              Eliminar
                            </button>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Modal
        show={!!productToDelete}
        onClose={() => !deleting && setProductToDelete(null)}
        size="md"
      >
        <ModalHeader>Eliminar prenda</ModalHeader>
        <ModalBody>
          <p className="text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que querés eliminar
            {productToDelete ? (
              <span className="font-semibold"> «{productToDelete.name}»</span>
            ) : null}
            ? Esta acción no se puede deshacer.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setProductToDelete(null)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </ModalFooter>
      </Modal>
    </main>
  );
}
