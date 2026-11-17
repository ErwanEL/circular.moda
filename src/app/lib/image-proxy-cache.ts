type ImagePayload = { body: Buffer; contentType: string };

/** Only the variants used by cards, galleries and thumbnails can trigger Sharp. */
export function parseImageSize(w: string | null, h: string | null) {
  if (w === null && h === null) return {};
  if (w === '300' && h === null) return { w: 300 };
  if (w === null && h === '800') return { h: 800 };
  if (w === '80' && h === '80') return { w: 80, h: 80 };
  return null;
}

/** Bounded binary cache; concurrent requests for a variant share one conversion. */
export class ImageMemoryCache {
  private entries = new Map<string, { value: ImagePayload; expires: number }>();
  private pending = new Map<string, Promise<ImagePayload>>();
  private bytes = 0;
  private active = 0;
  private waiting: Array<() => void> = [];

  private maxBytes: number;
  private ttl: number;

  constructor(maxBytes: number, ttl: number) {
    this.maxBytes = maxBytes;
    this.ttl = ttl;
  }

  async get(
    key: string,
    fetchImage: () => Promise<ImagePayload>
  ): Promise<ImagePayload> {
    const cached = this.entries.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    if (cached) this.remove(key);
    const pending = this.pending.get(key);
    if (pending) return pending;
    // Bound concurrent Sharp jobs as well as retained memory.
    if (this.pending.size >= 200)
      throw new Error('Image processing capacity reached');
    const task = Promise.resolve()
      .then(async () => {
        if (this.active >= 4) {
          await new Promise<void>((resolve) => this.waiting.push(resolve));
        } else {
          this.active++;
        }
        try {
          return await fetchImage();
        } finally {
          const next = this.waiting.shift();
          if (next) next();
          else this.active--;
        }
      })
      .then((value) => {
        if (value.body.length <= this.maxBytes) {
          while (
            this.bytes + value.body.length > this.maxBytes ||
            this.entries.size >= 200
          ) {
            const oldest = this.entries.keys().next().value;
            if (oldest === undefined) break;
            this.remove(oldest);
          }
          this.entries.set(key, { value, expires: Date.now() + this.ttl });
          this.bytes += value.body.length;
        }
        return value;
      })
      .finally(() => {
        this.pending.delete(key);
      });
    this.pending.set(key, task);
    return task;
  }

  private remove(key: string) {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.value.body.length;
    this.entries.delete(key);
  }
}
