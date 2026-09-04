import { NextRequest, NextResponse } from 'next/server';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getMetaAppId() {
  return env('META_APP_ID') ?? env('FACEBOOK_APP_ID') ?? env('APP_ID');
}

function getMetaAppSecret() {
  return (
    env('META_APP_SECRET') ??
    env('FACEBOOK_APP_SECRET') ??
    env('APP_SECRET') ??
    env('WHATSAPP_APP_SECRET')
  );
}

function getGraphApiVersion() {
  return env('WHATSAPP_GRAPH_API_VERSION') ?? 'v25.0';
}

function getSetupKey(request: NextRequest) {
  return request.headers.get('x-whatsapp-setup-key')?.trim() ?? null;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function graphRequest(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
) {
  const graphApiVersion = getGraphApiVersion();
  const url = `https://graph.facebook.com/${graphApiVersion}/${path.replace(/^\/+/, '')}`;
  const headers = new Headers(options.headers);

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: unknown = text;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload,
    };
  }

  return {
    ok: true,
    status: response.status,
    payload,
  };
}

export async function POST(request: NextRequest) {
  try {
    const setupKey = env('WHATSAPP_SETUP_KEY');

    if (!setupKey || getSetupKey(request) !== setupKey) {
      return NextResponse.json(
        { ok: false, error: 'Not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    const appId = getMetaAppId();
    const appSecret = getMetaAppSecret();

    if (!appId || !appSecret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Missing META_APP_ID and META_APP_SECRET. Add them to Vercel and redeploy.',
        },
        { status: 503, headers: CACHE_HEADERS }
      );
    }

    const body = getRecord(await readJson(request));
    const code = getString(body?.code);
    const session = getRecord(body?.session);
    const sessionData = getRecord(session?.data);
    const wabaId = getString(sessionData?.waba_id);
    const phoneNumberId = getString(sessionData?.phone_number_id);
    const businessId = getString(sessionData?.business_id);

    if (!code) {
      return NextResponse.json(
        { ok: false, error: 'Missing Embedded Signup code' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      code,
    });

    const tokenResponse = await graphRequest(`oauth/access_token?${params}`);

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Meta token exchange failed',
          meta: tokenResponse,
        },
        { status: 502, headers: CACHE_HEADERS }
      );
    }

    const tokenPayload = getRecord(tokenResponse.payload);
    const accessToken = getString(tokenPayload?.access_token);

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Meta token exchange did not return access_token',
          meta: tokenResponse.payload,
        },
        { status: 502, headers: CACHE_HEADERS }
      );
    }

    let subscribeResult: unknown = null;

    if (wabaId) {
      subscribeResult = await graphRequest(`${wabaId}/subscribed_apps`, {
        method: 'POST',
        accessToken,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        accessToken,
        tokenType: getString(tokenPayload?.token_type),
        expiresIn:
          typeof tokenPayload?.expires_in === 'number'
            ? tokenPayload.expires_in
            : null,
        wabaId,
        phoneNumberId,
        businessId,
        subscribeResult,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[WhatsApp Embedded Signup] Unexpected error:', error);
    return NextResponse.json(
      { ok: false, error: 'Unexpected Embedded Signup error' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
