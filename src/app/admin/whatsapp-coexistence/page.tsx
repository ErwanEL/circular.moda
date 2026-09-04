import { notFound } from 'next/navigation';
import WhatsappCoexistenceClient from './whatsapp-coexistence-client';

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getMetaAppId() {
  return env('META_APP_ID') ?? env('FACEBOOK_APP_ID') ?? env('APP_ID');
}

function getGraphApiVersion() {
  return env('WHATSAPP_GRAPH_API_VERSION') ?? 'v25.0';
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParam(
  params: Record<string, string | string[] | undefined>,
  name: string
) {
  const value = params[name];
  return Array.isArray(value) ? value[0] : value;
}

export default async function WhatsappCoexistencePage({
  searchParams,
}: PageProps) {
  const params = (await searchParams) ?? {};
  const setupKey = env('WHATSAPP_SETUP_KEY');
  const requestSetupKey = getSearchParam(params, 'setup_key');
  const authCode = getSearchParam(params, 'code') ?? null;
  const authError = getSearchParam(params, 'error_description') ?? null;

  if (!setupKey || requestSetupKey !== setupKey) {
    notFound();
  }

  const appId = getMetaAppId();
  const configId = env('META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID');
  const graphApiVersion = getGraphApiVersion();

  return (
    <WhatsappCoexistenceClient
      appId={appId}
      configId={configId}
      graphApiVersion={graphApiVersion}
      setupKey={setupKey}
      authCode={authCode}
      authError={authError}
    />
  );
}
