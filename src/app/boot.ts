// §1.5: runs before React mounts. Returns true when the page is leaving for the canonical origin.
const GUARD = 'natally.secureRedirect';

function guardSet(): boolean {
  try {
    if (sessionStorage.getItem(GUARD) !== null) return true;
    sessionStorage.setItem(GUARD, '1');
    return false;
  } catch {
    return true; // Without storage there is no loop guard, so do not redirect.
  }
}

export function applySecureOriginRule(canonicalOrigin: string): boolean {
  if (window.isSecureContext) return false;
  if (!canonicalOrigin.startsWith('https://') || canonicalOrigin === location.origin) return false;
  if (guardSet()) return false;
  location.replace(canonicalOrigin + location.pathname + location.search + location.hash);
  return true;
}
