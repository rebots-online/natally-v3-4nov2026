// Port of the frozen `about` screen (LIBS/UI/STITCH/screens/about/index.html): same ids, classes and text, colours as tokens.
// "Her voice" gains `about.machineSpeech`, which the voice licence requires (§9.2, §17.4).
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { getPlatform } from '../platform';
import { Chevron, CARD, SECTION_CAPTION, openLink, useCloseScreen } from './Chrome';
import { fill, strings } from './strings';

const LICENCE_ROW = 'w-full h-[52px] px-5 flex items-center justify-between text-left bg-transparent border-0 cursor-pointer hover:bg-elevated/50 transition-colors';
const LINK = 'font-nunito text-xs text-muted underline underline-offset-4 hover:text-cream transition-colors';
const ARTICLE_TITLE = 'font-fraunces text-[20px] text-cream font-normal tracking-tight m-0 mb-2';
const ARTICLE_BODY = 'font-nunito text-[15px] leading-relaxed text-cream m-0';

const LICENCES = [
  { id: 'about-licence-swisseph', doc: 'licence-swisseph', label: 'about.licenceSwisseph' },
  { id: 'about-licence-voice', doc: 'licence-voice', label: 'about.licenceVoice' },
  { id: 'about-licence-fonts', doc: 'licence-fonts', label: 'about.licenceFonts' },
  { id: 'about-licence-notices', doc: 'licence-notices', label: 'about.licenceNotices' },
] as const;

export default function ScreenAbout() {
  const navigate = useNavigate();
  const close = useCloseScreen();
  const app = { app: config.appName };

  const open = (target: string) => (event: MouseEvent) => {
    event.preventDefault();
    openLink(target, navigate, (url) => getPlatform().openExternal(url));
  };

  return (
    <div className="min-h-screen flex justify-center">
      {/* Mobile Screen Container */}
      <main className="w-full max-w-[430px] min-h-screen px-[20px] pt-6 pb-10 flex flex-col justify-between box-border">
        <div className="flex flex-col gap-6">
          {/* 1. Header row */}
          <header className="flex items-center justify-between h-[44px]">
            <h1 className="font-fraunces text-[28px] leading-tight text-cream font-normal tracking-tight m-0">{strings['about.title']}</h1>
            <button
              id="about-close-button"
              type="button"
              onClick={close}
              className="font-cinzel text-xs font-semibold tracking-[0.2em] text-cream hover:text-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-end px-2 bg-transparent border-0 cursor-pointer"
            >
              {strings['about.close']}
            </button>
          </header>

          {/* 2. Centred block */}
          <section className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-[88px] h-[88px] rounded-[24%] border border-gold overflow-hidden bg-panel flex items-center justify-center shadow-none mb-3">
              <img src="/brand/192x192.png" alt={fill(strings['about.avatarAlt'], app)} className="w-full h-full object-cover" />
            </div>
            <div className="font-cinzel text-base font-bold tracking-[0.2em] text-gold uppercase mb-1">{config.appName}</div>
            <div id="about-version" className="font-mono text-xs text-goldLight tracking-wide mb-1">v{config.version}</div>
            <div className="font-nunito text-xs text-muted tracking-normal">{fill(strings['about.tagline'], app)}</div>
          </section>

          {/* 3. Card: How your chart is calculated */}
          <article className={`${CARD} p-5`}>
            <h2 className={ARTICLE_TITLE}>{strings['about.chartTitle']}</h2>
            <p className={ARTICLE_BODY}>{strings['about.chartBody']}</p>
          </article>

          {/* 4. Card: Her voice */}
          <article className={`${CARD} p-5`}>
            <h2 className={ARTICLE_TITLE}>{strings['about.voiceTitle']}</h2>
            <p className={ARTICLE_BODY}>
              {fill(strings['about.voiceBody'], app)} {strings['about.machineSpeech']}
            </p>
          </article>

          {/* 5. Licences */}
          <section className="flex flex-col gap-2">
            <div className={`${SECTION_CAPTION} px-1`}>{strings['about.licences']}</div>
            <div className={`${CARD} overflow-hidden flex flex-col`}>
              {LICENCES.map((row, index) => (
                <button
                  key={row.id}
                  id={row.id}
                  type="button"
                  onClick={() => navigate(`/legal/${row.doc}`)}
                  className={`${LICENCE_ROW}${index < LICENCES.length - 1 ? ' border-b border-hairline' : ''}`}
                >
                  <span className="font-nunito text-[15px] text-cream">{strings[row.label]}</span>
                  <Chevron stroke={1.5} />
                </button>
              ))}
            </div>
          </section>

          {/* 6. Row of three underlined ghost links */}
          <nav aria-label={strings['about.navLabel']} className="flex items-center justify-between px-6 pt-2 pb-1">
            <a id="about-terms-link" href={config.links.terms} onClick={open(config.links.terms)} className={LINK}>
              {strings['about.terms']}
            </a>
            <a id="about-privacy-link" href={config.links.privacy} onClick={open(config.links.privacy)} className={LINK}>
              {strings['about.privacy']}
            </a>
            <a id="about-contact-link" href={config.links.contact} onClick={open(config.links.contact)} className={LINK}>
              {strings['about.contact']}
            </a>
          </nav>
        </div>

        {/* 7. Centred small muted footer line */}
        <footer className="pt-8 text-center">
          <p className="font-nunito text-xs text-muted m-0">{config.legalEntity}</p>
        </footer>
      </main>
    </div>
  );
}
