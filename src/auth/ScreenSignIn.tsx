// Port of the frozen `sign-in` screen (LIBS/UI/STITCH/screens/sign-in/index.html): same ids, classes and text.
// Added to the frozen markup: the message line #signin-message and the reCAPTCHA host #signin-recaptcha (§9.2), both empty by default.
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { config } from '../config';
import { getPlatform } from '../platform';
import { confirmPhoneCode, releasePhoneVerifier, sendPhoneCode, SignInFailure, signInGoogle, signInWithEmail, signUpWithEmail } from './signIn';
import { useSession } from './session';
import { strings, type StringKey } from './strings';

type Mode = 'login' | 'signup' | 'phone';
type Message = { tone: 'error' | 'info'; key: StringKey };

const TAB_ON = 'bg-[#2a1d3d] text-[#c9a24a] font-mono text-[11px] font-bold py-1.5 px-2 rounded-[7px] text-center border border-[rgba(201,162,74,0.3)] transition-colors';
const TAB_OFF = 'text-[#a698b5] hover:text-[#f1e8d8] font-mono text-[11px] py-1.5 px-2 rounded-[7px] text-center transition-colors';

/** Only an in-app path may be followed after sign-in; anything else becomes the default. */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/pick';
}

export default function ScreenSignIn() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const session = useSession();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  // The session store is the one source of "signed in": every method, and a visit by someone already signed in, ends here.
  useEffect(() => {
    if (session.status === 'signed_in') navigate(next, { replace: true });
  }, [session.status, next, navigate]);

  useEffect(() => releasePhoneVerifier, []);

  const choose = (m: Mode) => {
    if ((m === 'phone') !== (mode === 'phone')) setEmail(''); // an address is not a number
    setMode(m);
    setMessage(null);
    setPassword('');
    setCodeSent(false);
    confirmation.current = null;
    if (m !== 'phone') releasePhoneVerifier();
  };

  const attempt = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      if (!(error instanceof SignInFailure)) throw error;
      setMessage({ tone: 'error', key: error.messageKey });
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (mode === 'login') return void attempt(() => signInWithEmail(email, password));
    if (mode === 'signup') return void attempt(() => signUpWithEmail(email, password));
    if (!codeSent || !confirmation.current) {
      return void attempt(async () => {
        confirmation.current = await sendPhoneCode(email, 'signin-recaptcha');
        setCodeSent(true);
        setPassword('');
        setMessage({ tone: 'info', key: 'auth.codeSent' });
      });
    }
    const pending = confirmation.current;
    void attempt(() => confirmPhoneCode(pending, password));
  };

  const open = (url: string) => (event: MouseEvent) => {
    event.preventDefault();
    void getPlatform().openExternal(url);
  };

  const phone = mode === 'phone';
  const emailLabel = phone ? strings['auth.phoneLabel'] : strings['signin.emailLabel'];
  const passwordLabel = phone ? strings['auth.codeLabel'] : strings['signin.passwordLabel'];

  return (
    <div className="bg-[#0b0712] text-[#f1e8d8] font-nunito antialiased p-4 sm:p-6 min-h-screen w-full flex flex-col items-center justify-center relative box-border">
      {/* Sign In Card */}
      <main id="signin-card" className="w-full max-w-[380px] bg-[#140d1f] border border-[rgba(201,162,74,0.35)] rounded-[20px] p-[20px] flex flex-col my-8">
        {/* 1. Header Row */}
        <header className="flex items-center gap-3.5">
          <div className="w-[68px] h-[68px] rounded-[24%] border border-[#c9a24a] overflow-hidden flex-shrink-0 bg-[#1a1226]">
            <img src="/brand/192x192.png" alt={strings['signin.botAlt']} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-cinzel text-[#c9a24a] font-bold text-sm tracking-[0.2em] leading-snug">{strings['signin.brand']}</h1>
          </div>
        </header>

        {/* 2. Hairline divider */}
        <div className="h-[1px] bg-[#3a2d50] w-full my-4"></div>

        {/* 3. First Cream Paragraph */}
        <p className="font-nunito text-[#f1e8d8] text-[17px] leading-relaxed mb-3">{strings['signin.lead']}</p>

        {/* 4. Second Cream Paragraph */}
        <p className="font-nunito text-[#f1e8d8] text-sm leading-relaxed mb-2.5">{strings['signin.free']}</p>

        {/* 5. Muted Paragraph */}
        <p className="font-nunito text-[#a698b5] text-xs leading-normal mb-2">{strings['signin.purchases']}</p>

        {/* 6. Legal / Links Paragraph */}
        <p className="font-nunito text-[#a698b5] text-xs leading-normal mb-4">
          {strings['signin.readOur']}{' '}
          <a href={config.links.terms} id="signin-terms-link" onClick={open(config.links.terms)} className="underline text-[#a698b5] hover:text-[#f1e8d8]">
            {strings['signin.terms']}
          </a>{' '}
          {strings['signin.and']}{' '}
          <a href={config.links.privacy} id="signin-privacy-link" onClick={open(config.links.privacy)} className="underline text-[#a698b5] hover:text-[#f1e8d8]">
            {strings['signin.privacy']}
          </a>
          .
        </p>

        {/* 7. Google Button */}
        <button
          id="signin-google-button"
          type="button"
          disabled={busy}
          onClick={() => void attempt(signInGoogle)}
          className="w-full h-[48px] rounded-[14px] bg-[#2a1d3d] border border-[#3a2d50] hover:border-[#c9a24a] flex items-center justify-center gap-3 px-4 transition-colors mb-4 disabled:opacity-60"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span className="font-mono font-bold text-xs tracking-wider text-[#f1e8d8]">{strings['signin.google']}</span>
        </button>

        {/* 8. Divider with Chip */}
        <div className="relative flex items-center justify-center my-3">
          <div className="w-full h-[1px] bg-[#3a2d50] absolute"></div>
          <div className="relative bg-[#2a1d3d] px-2.5 py-1 rounded-[6px] border border-[#3a2d50]">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#a698b5] font-semibold">{strings['signin.divider']}</span>
          </div>
        </div>

        {/* 9. Segmented Control */}
        <div id="signin-mode-tabs" role="tablist" className="grid grid-cols-3 bg-[#1a1226] border border-[#3a2d50] rounded-[10px] p-1 gap-1 my-3">
          <button type="button" role="tab" aria-selected={mode === 'login'} id="signin-tab-login" onClick={() => choose('login')} className={mode === 'login' ? TAB_ON : TAB_OFF}>
            {strings['signin.tabLogin']}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} id="signin-tab-signup" onClick={() => choose('signup')} className={mode === 'signup' ? TAB_ON : TAB_OFF}>
            {strings['signin.tabSignup']}
          </button>
          <button type="button" role="tab" aria-selected={phone} id="signin-tab-phone" onClick={() => choose('phone')} className={phone ? TAB_ON : TAB_OFF}>
            {strings['signin.tabPhone']}
          </button>
        </div>

        <form className="flex flex-col" noValidate onSubmit={submit}>
          {/* 10. Email Field (the phone number in phone mode) */}
          <div className="flex flex-col gap-1.5 mb-3">
            <label htmlFor="signin-email-input" className="font-mono text-[10px] uppercase tracking-widest text-[#a698b5]">
              {emailLabel}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#a698b5] flex items-center justify-center pointer-events-none">
                {phone ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                )}
              </span>
              <input
                id="signin-email-input"
                type={phone ? 'tel' : 'email'}
                autoComplete={phone ? 'tel' : 'email'}
                placeholder={phone ? '+1 416 555 0100' : strings['signin.emailPlaceholder']}
                value={email}
                disabled={busy || (phone && codeSent)}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1226] border border-[#3a2d50] focus:border-[#c9a24a] rounded-[10px] pl-9 pr-3 py-2.5 font-mono text-xs text-[#f1e8d8] placeholder-[#a698b5]/50 outline-none transition-colors"
              />
            </div>
          </div>

          {/* 11. Password Field (the SMS code in phone mode, shown once the code is sent) */}
          {(!phone || codeSent) && (
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="signin-password-input" className="font-mono text-[10px] uppercase tracking-widest text-[#a698b5]">
                {passwordLabel}
              </label>
              <input
                id="signin-password-input"
                type={phone ? 'text' : 'password'}
                inputMode={phone ? 'numeric' : undefined}
                autoComplete={phone ? 'one-time-code' : mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1226] border border-[#3a2d50] focus:border-[#c9a24a] rounded-[10px] px-3 py-2.5 font-mono text-xs text-[#f1e8d8] tracking-widest outline-none transition-colors"
              />
            </div>
          )}

          {message && (
            <p id="signin-message" role={message.tone === 'error' ? 'alert' : 'status'} className={`font-nunito text-xs leading-normal mb-4 ${message.tone === 'error' ? 'text-[#f2a38c]' : 'text-[#a698b5]'}`}>
              {strings[message.key]}
            </p>
          )}

          {phone && <div id="signin-recaptcha"></div>}

          {/* 12. Submit Button */}
          <button
            id="signin-submit-button"
            type="submit"
            disabled={busy}
            className="w-full h-[48px] rounded-[14px] bg-[#c9a24a] hover:bg-[#d6b059] active:bg-[#ba943e] flex items-center justify-center gap-2 px-4 transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4 text-[#0b0712]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span className="font-mono font-bold text-xs tracking-wider text-[#0b0712]">{mode === 'signup' ? strings['signin.submitSignup'] : strings['signin.submitLogin']}</span>
          </button>
        </form>
      </main>

      {/* Fixed Version Badge */}
      <aside className="fixed bottom-3 right-3 font-mono text-[11px] text-[#f2ca50] bg-[#0b0712] px-2 py-0.5 pointer-events-none select-none z-50">v{config.version}</aside>
    </div>
  );
}
