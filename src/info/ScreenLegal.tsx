// `/legal/:doc` (§9.1): a text page in About's layout. `doc` is `terms`, `privacy` or `licence-<key>`.
import { Fragment, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { config } from '../config';
import { getPlatform } from '../platform';
import { CARD, useCloseScreen } from './Chrome';
import { FontLicences, PackageList } from './LegalLive';
import { fontLicences, openSourceNotices, supertonicVoice, swissEphemeris } from './legal/licences';
import { privacy } from './legal/privacy';
import { terms } from './legal/terms';
import type { LegalBlock, LegalDocument, LegalParty } from './legal/types';
import { fill, strings } from './strings';

const LINK = 'text-cream underline underline-offset-4 hover:text-goldLight transition-colors break-all';
const BODY = 'font-nunito text-[15px] leading-relaxed text-cream m-0';

/** Addresses in the text become links that open the way every external link does (§1.3). */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+[^\s.,;:)])/).map((part, index) =>
        index % 2 === 1 ? (
          <a key={index} href={part} className={LINK} onClick={(event) => { event.preventDefault(); void getPlatform().openExternal(part); }}>
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p className={BODY}><Linked text={block} /></p>;
  return (
    <ul className={`${BODY} list-disc pl-5 flex flex-col gap-2`}>
      {block.map((item) => (
        <li key={item}><Linked text={item} /></li>
      ))}
    </ul>
  );
}

function DocumentView({ doc, after }: { doc: LegalDocument; after?: ReactNode }) {
  return (
    <>
      {doc.effective ? <p className="font-nunito text-xs text-muted m-0 -mt-3">{fill(strings['legal.updated'], { date: doc.effective })}</p> : null}
      {doc.sections.map((section) => (
        <article key={section.heading} className={`${CARD} p-5 flex flex-col gap-3`}>
          <h2 className="font-fraunces text-[20px] text-cream font-normal tracking-tight m-0">{section.heading}</h2>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </article>
      ))}
      {after}
    </>
  );
}

function modelCardLink(url: string): ReactNode {
  return (
    <p className={`${BODY} px-1`}>
      <a id="legal-voice-model-link" href={url} className={LINK} onClick={(event) => { event.preventDefault(); void getPlatform().openExternal(url); }}>
        {strings['legal.modelCard']}
      </a>
    </p>
  );
}

export default function ScreenLegal() {
  const { doc } = useParams();
  const close = useCloseScreen('/about');
  const party: LegalParty = {
    app: config.appName,
    entity: config.legalEntity,
    email: config.supportEmail,
    voiceModelUrl: `${config.voice.baseUrl.replace(/\/+$/, '')}/${config.voice.repo}`,
  };

  let title: string = strings['legal.notFoundTitle'];
  let body: ReactNode = (
    <article className={`${CARD} p-5`}>
      <p className={BODY}>{strings['legal.notFoundBody']}</p>
    </article>
  );
  const show = (document: LegalDocument, after?: ReactNode) => {
    title = document.title;
    body = <DocumentView doc={document} after={after} />;
  };
  if (doc === 'terms') show(terms(party));
  else if (doc === 'privacy') show(privacy(party));
  else if (doc === 'licence-swisseph') show(swissEphemeris(party));
  else if (doc === 'licence-voice') show(supertonicVoice(party), modelCardLink(party.voiceModelUrl));
  else if (doc === 'licence-fonts') show(fontLicences(party), <FontLicences />);
  else if (doc === 'licence-notices') show(openSourceNotices(party), <PackageList />);

  return (
    <div className="min-h-screen flex justify-center">
      <main id="legal-page" className="w-full max-w-[430px] min-h-screen px-[20px] pt-6 pb-16 flex flex-col gap-6 box-border">
        <header className="flex items-center justify-between h-[44px]">
          <h1 className="font-fraunces text-[28px] leading-tight text-cream font-normal tracking-tight m-0">{title}</h1>
          <button
            id="legal-close-button"
            type="button"
            onClick={close}
            className="font-cinzel text-xs font-semibold tracking-[0.2em] text-cream hover:text-gold transition-colors min-h-[44px] min-w-[44px] flex items-center justify-end px-2 bg-transparent border-0 cursor-pointer"
          >
            {strings['legal.close']}
          </button>
        </header>
        {body}
      </main>
    </div>
  );
}
