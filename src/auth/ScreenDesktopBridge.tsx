// Route /auth/desktop (§1.4): the page the desktop shell opens in the system browser. It has no frozen screen, so it reuses the
// sign-in card's look. The customer signs in with Google here, and the page hands the Google credential to the shell's loopback
// listener at http://127.0.0.1:<port>/cb. The shell completes sign-in itself; this browser session is not kept.
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { config } from '../config';
import { auth } from './firebase';
import { strings } from './strings';

type Phase = 'ready' | 'signing' | 'failed';

/** The shell binds an ephemeral port on 127.0.0.1; anything else in the address is not ours to follow. */
function readHandoff(params: URLSearchParams): { port: number; state: string } | null {
  const port = Number(params.get('port'));
  const state = params.get('state') ?? '';
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  if (!/^[A-Za-z0-9._~-]{8,256}$/.test(state)) return null;
  return { port, state };
}

export default function ScreenDesktopBridge() {
  const [params] = useSearchParams();
  const handoff = readHandoff(params);
  const [phase, setPhase] = useState<Phase>(handoff ? 'ready' : 'failed');

  const start = async () => {
    if (!handoff) return;
    setPhase('signing');
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.idToken) throw new Error('no_id_token');
      await signOut(auth);
      const target = new URL(`http://127.0.0.1:${handoff.port}/cb`);
      target.searchParams.set('state', handoff.state);
      target.searchParams.set('id_token', credential.idToken);
      if (credential.accessToken) target.searchParams.set('access_token', credential.accessToken);
      location.assign(target.toString());
    } catch {
      setPhase('failed');
    }
  };

  return (
    <div className="bg-[#0b0712] text-[#f1e8d8] font-nunito antialiased p-4 sm:p-6 min-h-screen w-full flex flex-col items-center justify-center">
      <main id="bridge-card" className="w-full max-w-[380px] bg-[#140d1f] border border-[rgba(201,162,74,0.35)] rounded-[20px] p-[20px] flex flex-col gap-4">
        <h1 className="font-cinzel text-[#c9a24a] font-bold text-sm tracking-[0.2em] leading-snug">{config.appName.toUpperCase()}</h1>
        <div className="h-[1px] bg-[#3a2d50] w-full"></div>
        {phase === 'ready' && (
          <button
            id="bridge-google-button"
            type="button"
            onClick={() => void start()}
            className="w-full h-[48px] rounded-[14px] bg-[#2a1d3d] border border-[#3a2d50] hover:border-[#c9a24a] flex items-center justify-center gap-3 px-4 transition-colors"
          >
            <span className="font-mono font-bold text-xs tracking-wider text-[#f1e8d8]">{strings['signin.google']}</span>
          </button>
        )}
        {phase === 'signing' && (
          <p id="bridge-status" role="status" className="font-nunito text-[#f1e8d8] text-[17px] leading-relaxed">
            {strings['bridge.signing']}
          </p>
        )}
        {phase === 'failed' && (
          <p id="bridge-status" role="alert" className="font-nunito text-[#f2a38c] text-[17px] leading-relaxed">
            {strings['bridge.failed']}
          </p>
        )}
      </main>
    </div>
  );
}
