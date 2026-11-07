// Pieces both screens share: the 20 px page frame, the gold section caption, the chevron and the close-button rule (§10: `navigate(-1)` or `/atelier`).
import { useLocation, useNavigate } from 'react-router-dom';
import { IconChevronRight } from '../ui';

export const SECTION_CAPTION = 'font-cinzel text-xs font-semibold tracking-[0.2em] text-gold uppercase';
export const CARD = 'bg-panel border border-hairline rounded-[16px]';

/** Back where the customer came from; straight to the atelier when the screen was opened cold. */
export function useCloseScreen(fallback = '/atelier'): () => void {
  const navigate = useNavigate();
  const location = useLocation();
  return () => (location.key !== 'default' ? navigate(-1) : navigate(fallback));
}

export const Chevron = ({ stroke = 2 }: { stroke?: number }) => <IconChevronRight className="w-4 h-4 text-muted shrink-0" size={16} strokeWidth={stroke} />;

/** Opens a configured link: a path stays in the app, a mail link goes to the mail client, anything else to the system browser. */
export function openLink(target: string, go: (path: string) => void, external: (url: string) => Promise<void>): void {
  if (target.startsWith('/')) go(target);
  else if (target.startsWith('mailto:')) window.location.href = target;
  else void external(target);
}
