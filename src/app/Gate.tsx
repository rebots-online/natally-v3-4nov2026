// §9.1: the three route gates, checked in the order A, B, V. Each gate is its own component so its hook is always called;
// a gate that is not asked for is never mounted. A gate that is still finding out renders nothing.
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../auth';
import { useChart } from '../chart';
import { getVoiceProfile, isVoiceSupported } from '../voice';

type GateKey = 'A' | 'B' | 'V';
const ORDER: GateKey[] = ['A', 'B', 'V'];
const VOICE_SKIPPED = 'natally.voice.skipped';

/** A: signed in, else the sign-in screen with the way back. */
function SignedIn({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (session.status === 'loading') return null;
  if (session.status === 'signed_out') {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/** B: the chart is ready, else birth details. */
function ChartReady({ children }: { children: ReactNode }) {
  const { status } = useChart();
  if (status === 'loading') return null;
  if (status === 'absent') return <Navigate to="/birth" replace />;
  return <>{children}</>;
}

function voiceStepSettled(): boolean {
  if (getVoiceProfile() !== null) return true;
  try {
    return localStorage.getItem(VOICE_SKIPPED) !== null;
  } catch {
    return false;
  }
}

/** V: the voice step is done: a stored profile, the skip flag, or a device that cannot speak. */
function VoiceStepDone({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'done' | 'needed'>(() => (voiceStepSettled() ? 'done' : 'checking'));
  useEffect(() => {
    if (state !== 'checking') return;
    let live = true;
    isVoiceSupported().then(
      (supported) => live && setState(supported ? 'needed' : 'done'),
      () => live && setState('done'), // a support check that cannot run means no voice here
    );
    return () => {
      live = false;
    };
  }, [state]);
  if (state === 'checking') return null;
  if (state === 'needed') return <Navigate to="/voice" replace />;
  return <>{children}</>;
}

const GATE_COMPONENTS: Record<GateKey, (props: { children: ReactNode }) => ReactNode> = {
  A: SignedIn,
  B: ChartReady,
  V: VoiceStepDone,
};

export default function Gate({ gates, children }: { gates: GateKey[]; children: ReactNode }) {
  const wanted = ORDER.filter((key) => gates.includes(key));
  return wanted.reduceRight<ReactNode>((inner, key) => {
    const Check = GATE_COMPONENTS[key];
    return <Check>{inner}</Check>;
  }, children);
}
