// Global error capture (§15.1): a short category and a 32-bit hash of the message. The message itself is never sent.
const MAX_DISTINCT = 10;

/** FNV-1a over UTF-16 code units, as 8 hex digits. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

const describe = (value: unknown): string => (value instanceof Error ? `${value.name}: ${value.message}` : typeof value === 'string' ? value : typeof value);

function resourceSite(target: Element): string {
  const raw = target.getAttribute('src') ?? target.getAttribute('href') ?? '';
  try {
    return `${target.tagName}:${new URL(raw, location.href).pathname}`;
  } catch {
    return target.tagName;
  }
}

export function installErrorCapture(report: (kind: string, hash: string) => void): void {
  const seen = new Set<string>();
  const once = (kind: string, text: string) => {
    const hash = fingerprint(text);
    if (seen.has(hash) || seen.size >= MAX_DISTINCT) return;
    seen.add(hash);
    report(kind, hash);
  };
  // Capture phase, so failed <script> and <link> loads (which do not bubble) are seen as well.
  window.addEventListener(
    'error',
    (event) => {
      if (event.target instanceof Element) once('resource', resourceSite(event.target));
      else once('error', event.error !== undefined && event.error !== null ? describe(event.error) : event.message);
    },
    true,
  );
  window.addEventListener('unhandledrejection', (event) => once('unhandledrejection', describe(event.reason)));
}
