// Browser-API helpers shared by the three adapters: clipboard, file download or share, external link.
import { strings } from './strings';
import type { SaveFileRequest, SaveOutcome } from '../types';

const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);

export function checkedExternalUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url, location.href);
  } catch {
    throw new Error(strings['platform.linkRefused']);
  }
  if (!SAFE_PROTOCOLS.has(parsed.protocol)) throw new Error(strings['platform.linkRefused']);
  return parsed.href;
}

/** Selected, off-screen text field: the path when the async clipboard is absent (insecure context) or refuses. */
function copyThroughField(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.setAttribute('aria-hidden', 'true');
  field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, text.length);
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

export async function copyTextBrowser(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Permission or focus refusal: the selected-field path below still works inside a user gesture.
    }
  }
  if (!copyThroughField(text)) throw new Error(strings['platform.copyFailed']);
}

const blobOf = (req: SaveFileRequest): Blob => new Blob([req.bytes as Uint8Array<ArrayBuffer>], { type: req.mimeType });

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The download has been handed to the browser by the time this fires.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Touch-first devices get the system share sheet when it accepts files; everything else gets a download. */
export async function saveFileBrowser(req: SaveFileRequest): Promise<SaveOutcome> {
  const blob = blobOf(req);
  const file = new File([blob], req.fileName, { type: req.mimeType });
  const touchFirst = window.matchMedia('(pointer: coarse)').matches;
  if (touchFirst && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: req.fileName });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // NotAllowedError (gesture spent) or an unsupported target: fall through to the download.
    }
  }
  downloadBlob(blob, req.fileName);
  return 'saved';
}
