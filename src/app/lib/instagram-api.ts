export type InstagramPublishingLimit = {
  quota_usage?: number;
  config?: {
    quota_total?: number;
    quota_duration?: number;
  };
};

export type InstagramMediaContainerStatus =
  | 'EXPIRED'
  | 'ERROR'
  | 'FINISHED'
  | 'IN_PROGRESS'
  | 'PUBLISHED';

type InstagramGraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function getInstagramGraphApiVersion(): string {
  return process.env.INSTAGRAM_GRAPH_API_VERSION || 'v26.0';
}

function getInstagramAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is not configured.');
  }
  return token;
}

function buildGraphUrl(path: string): URL {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(
    `https://graph.facebook.com/${getInstagramGraphApiVersion()}/${normalizedPath}`
  );
}

async function instagramGraphFetch<T>(
  path: string,
  init: RequestInit & {
    form?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = buildGraphUrl(path);
  url.searchParams.set('access_token', getInstagramAccessToken());

  for (const [key, value] of Object.entries(init.searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const body = init.form ? new URLSearchParams(init.form) : init.body;

  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.form
        ? { 'content-type': 'application/x-www-form-urlencoded' }
        : {}),
      ...init.headers,
    },
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & InstagramGraphError)
    | null;

  if (!response.ok) {
    const graphError = payload?.error;
    const details = graphError
      ? `${graphError.message ?? 'Unknown Graph API error'} (${graphError.type ?? 'GraphError'} ${graphError.code ?? response.status})`
      : `Graph API request failed with status ${response.status}`;
    throw new Error(details);
  }

  if (!payload) {
    throw new Error('Graph API returned an empty response.');
  }

  return payload as T;
}

export async function getInstagramContentPublishingLimit(
  igUserId: string
): Promise<{ data: InstagramPublishingLimit[] }> {
  return instagramGraphFetch(`/${igUserId}/content_publishing_limit`);
}

export async function createInstagramImageMediaContainer(input: {
  igUserId: string;
  imageUrl: string;
  caption: string;
}): Promise<{ id: string }> {
  return instagramGraphFetch(`/${input.igUserId}/media`, {
    method: 'POST',
    form: {
      image_url: input.imageUrl,
      caption: input.caption,
    },
  });
}

export async function getInstagramMediaContainerStatus(
  containerId: string
): Promise<{
  id: string;
  status_code: InstagramMediaContainerStatus;
  status?: string;
}> {
  return instagramGraphFetch(`/${containerId}`, {
    searchParams: {
      fields: 'id,status_code,status',
    },
  });
}

export async function publishInstagramMediaContainer(input: {
  igUserId: string;
  creationId: string;
}): Promise<{ id: string }> {
  return instagramGraphFetch(`/${input.igUserId}/media_publish`, {
    method: 'POST',
    form: {
      creation_id: input.creationId,
    },
  });
}

export async function getInstagramPublishedMedia(
  mediaId: string
): Promise<{ id: string; permalink?: string }> {
  return instagramGraphFetch(`/${mediaId}`, {
    searchParams: {
      fields: 'id,permalink',
    },
  });
}
