'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    FB?: {
      init: (options: {
        appId: string;
        autoLogAppEvents: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  };
  status?: string;
};

type EmbeddedSignupSession = {
  type?: string;
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
    current_step?: string;
    error_message?: string;
    error_code?: string;
    session_id?: string;
  };
};

type ExchangeResult = {
  ok: boolean;
  error?: string;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  wabaId?: string | null;
  phoneNumberId?: string | null;
  businessId?: string | null;
  subscribeResult?: unknown;
};

type Props = {
  appId: string | null;
  configId: string | null;
  graphApiVersion: string;
  setupKey: string;
};

const buttonClass =
  'rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50';

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function WhatsappCoexistenceClient({
  appId,
  configId,
  graphApiVersion,
  setupKey,
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState('En attente du SDK Meta.');
  const [session, setSession] = useState<EmbeddedSignupSession | null>(null);
  const [result, setResult] = useState<ExchangeResult | null>(null);
  const [rawLoginResponse, setRawLoginResponse] =
    useState<FacebookLoginResponse | null>(null);
  const sessionRef = useRef<EmbeddedSignupSession | null>(null);

  const isConfigured = Boolean(appId && configId);
  const currentRedirectUri =
    typeof window === 'undefined'
      ? null
      : window.location.href.split('#')[0];

  const initializeFacebook = useCallback(() => {
    if (!appId || !window.FB) return;
    window.FB.init({
      appId,
      autoLogAppEvents: true,
      xfbml: true,
      version: graphApiVersion,
    });
    setSdkReady(true);
    setStatus('SDK Meta prêt.');
  }, [appId, graphApiVersion]);

  useEffect(() => {
    window.fbAsyncInit = () => {
      initializeFacebook();
    };
  }, [initializeFacebook]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;

      try {
        const data = JSON.parse(String(event.data)) as EmbeddedSignupSession;
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          sessionRef.current = data;
          setSession(data);
        }
      } catch {
        // Meta can send non-JSON messages through the same channel.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function waitForSession() {
    if (sessionRef.current) return sessionRef.current;

    const startedAt = Date.now();
    while (!sessionRef.current && Date.now() - startedAt < 2500) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }

    return sessionRef.current;
  }

  async function exchangeCode(
    code: string,
    redirectUri: string,
    sessionInfo: EmbeddedSignupSession | null
  ) {
    setStatus('Code reçu. Échange serveur en cours.');
    setResult(null);

    const response = await fetch('/api/admin/whatsapp-embedded-signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-setup-key': setupKey,
      },
      body: JSON.stringify({
        code,
        redirectUri,
        session: sessionInfo,
      }),
    });

    const payload = (await response.json()) as ExchangeResult;
    setResult(payload);
    setStatus(response.ok ? 'Échange terminé.' : 'Échange échoué.');
  }

  function launchSignup() {
    if (!window.FB || !configId) {
      setStatus('SDK Meta non prêt ou config ID manquant.');
      return;
    }

    const redirectUri = window.location.href.split('#')[0];

    setResult(null);
    setRawLoginResponse(null);
    setStatus('Ouverture du flow Coexistence Meta.');

    window.FB.login(
      (response) => {
        setRawLoginResponse(response);
        const code = response.authResponse?.code;

        if (!code) {
          setStatus('Meta n’a pas retourné de code.');
          return;
        }

        void waitForSession().then((sessionInfo) => {
          void exchangeCode(code, redirectUri, sessionInfo);
        });
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        redirect_uri: redirectUri,
        extras: {
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
          setup: {},
        },
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-[#211f1d]">
      <Script
        async
        defer
        crossOrigin="anonymous"
        onReady={initializeFacebook}
        src="https://connect.facebook.net/en_US/sdk.js"
      />

      <section className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#7a3128]">
            Circular Moda
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            WhatsApp Business App Coexistence
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#5d5650]">
            Lance Embedded Signup pour connecter le numéro WhatsApp Business
            actuel à l’API sans passer par le flow standard d’enregistrement de
            numéro.
          </p>
        </div>

        {!isConfigured && (
          <div className="rounded-md border border-[#d9a441] bg-[#fff7df] p-4 text-sm text-[#5d4630]">
            Configuration incomplète. Ajoute `META_APP_ID` et
            `META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID` dans Vercel Production,
            puis redéploie.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-[#ded7ce] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#7a6f65]">
              App ID
            </p>
            <p className="mt-2 break-all text-sm">{appId ?? 'Manquant'}</p>
          </div>
          <div className="rounded-md border border-[#ded7ce] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#7a6f65]">
              Config ID
            </p>
            <p className="mt-2 break-all text-sm">{configId ?? 'Manquant'}</p>
          </div>
          <div className="rounded-md border border-[#ded7ce] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#7a6f65]">
              Graph API
            </p>
            <p className="mt-2 text-sm">{graphApiVersion}</p>
          </div>
        </div>

        <div className="rounded-md border border-[#ded7ce] bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[#7a6f65]">
            Redirect URI utilisée
          </p>
          <p className="mt-2 break-all text-sm">
            {currentRedirectUri ?? 'Chargement navigateur...'}
          </p>
        </div>

        <div className="rounded-md border border-[#ded7ce] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Onboarding</h2>
              <p className="mt-1 text-sm text-[#6a625b]">{status}</p>
            </div>
            <button
              className={buttonClass}
              disabled={!isConfigured || !sdkReady}
              onClick={launchSignup}
              type="button"
            >
              Connecter le WhatsApp actuel
            </button>
          </div>
        </div>

        {result?.ok && (
          <div className="rounded-md border border-[#92c7a3] bg-[#f1fbf4] p-5">
            <h2 className="text-lg font-semibold">Variables à mettre dans Vercel</h2>
            <pre className="mt-3 overflow-auto rounded-md bg-[#122117] p-4 text-xs text-[#dcfce7]">
{`WHATSAPP_ACCESS_TOKEN=${result.accessToken ?? ''}
WHATSAPP_BUSINESS_ACCOUNT_ID=${result.wabaId ?? ''}
WHATSAPP_PHONE_NUMBER_ID=${result.phoneNumberId ?? ''}
WHATSAPP_AUTOMATION_ENABLED=false`}
            </pre>
          </div>
        )}

        {result && !result.ok && (
          <div className="rounded-md border border-[#d68c8c] bg-[#fff2f2] p-5">
            <h2 className="text-lg font-semibold">Erreur</h2>
            <pre className="mt-3 overflow-auto rounded-md bg-white p-4 text-xs">
              {formatJson(result)}
            </pre>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-[#ded7ce] bg-white p-5">
            <h2 className="text-lg font-semibold">Session Meta</h2>
            <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-[#f5f1ea] p-4 text-xs">
              {session ? formatJson(session) : 'Aucune session reçue.'}
            </pre>
          </div>
          <div className="rounded-md border border-[#ded7ce] bg-white p-5">
            <h2 className="text-lg font-semibold">Login response</h2>
            <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-[#f5f1ea] p-4 text-xs">
              {rawLoginResponse
                ? formatJson(rawLoginResponse)
                : 'Aucune réponse reçue.'}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
