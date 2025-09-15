export type ApiOptions = { timeoutMs?: number };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function apiGet<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), opts.timeoutMs ?? 6000);
  try {
    const r = await fetch(`${BASE}${path}`, { signal: c.signal, credentials: "include" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function apiPost<T>(path: string, body: unknown, opts: ApiOptions = {}): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), opts.timeoutMs ?? 8000);
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: c.signal, credentials: "include"
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function apiPatch<T>(path: string, body: unknown, opts: ApiOptions = {}): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), opts.timeoutMs ?? 8000);
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: c.signal, credentials: "include"
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function isPreviewDemo(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEW_DEMO === "1" && process.env.NODE_ENV !== "production";
}