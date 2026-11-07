// The two legal pages whose text is not ours to retype: the licence file of each font family, and the package list the build wrote.
import { useEffect, useState } from 'react';
import { CARD } from './Chrome';
import { fill, strings } from './strings';

type Loaded<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; value: T };

/** One GET of a file in the app's own folder. A host that answers an unknown path with the app shell counts as a failure. */
function useOwnFile<T>(path: string, read: (response: Response) => Promise<T>): Loaded<T> {
  const [loaded, setLoaded] = useState<Loaded<T>>({ state: 'loading' });
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const response = await fetch(path);
        if (!response.ok || (response.headers.get('content-type') ?? '').includes('text/html')) throw new Error('unavailable');
        const value = await read(response);
        if (live) setLoaded({ state: 'ready', value });
      } catch {
        if (live) setLoaded({ state: 'failed' });
      }
    })();
    return () => {
      live = false;
    };
    // `read` is a module-level function at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return loaded;
}

const readText = (response: Response) => response.text();
const readRows = (response: Response) => response.json() as Promise<{ name: string; version: string; license: string }[]>;

function Status({ loaded }: { loaded: Loaded<unknown> }) {
  if (loaded.state === 'ready') return null;
  return (
    <p role={loaded.state === 'failed' ? 'alert' : 'status'} className="font-nunito text-[15px] leading-relaxed text-muted m-0">
      {loaded.state === 'failed' ? strings['legal.loadFailed'] : strings['legal.loading']}
    </p>
  );
}

// Each file ships in public/fonts with the family it covers.
const FONT_LICENCES = [
  { family: 'Fraunces', file: 'OFL-Fraunces.txt' },
  { family: 'Cinzel', file: 'OFL-Cinzel.txt' },
  { family: 'Nunito Sans', file: 'OFL-NunitoSans.txt' },
  { family: 'JetBrains Mono', file: 'OFL-JetBrainsMono.txt' },
  { family: 'Noto Sans Symbols', file: 'OFL-NotoSansSymbols.txt' },
] as const;

function FontLicence({ family, file }: { family: string; file: string }) {
  const loaded = useOwnFile(`/fonts/${file}`, readText);
  return (
    <article id={`legal-font-${file.replace(/^OFL-|\.txt$/g, '').toLowerCase()}`} className={`${CARD} p-5`}>
      <h2 className="font-fraunces text-[20px] text-cream font-normal tracking-tight m-0 mb-2">{family}</h2>
      <Status loaded={loaded} />
      {loaded.state === 'ready' ? (
        <pre aria-label={fill(strings['legal.fontsFile'], { family })} className="font-mono text-[11px] leading-[16px] text-cream/90 whitespace-pre-wrap break-words m-0">
          {loaded.value}
        </pre>
      ) : null}
    </article>
  );
}

export function FontLicences() {
  return (
    <>
      {FONT_LICENCES.map((font) => (
        <FontLicence key={font.file} {...font} />
      ))}
    </>
  );
}

export function PackageList() {
  const loaded = useOwnFile('/third-party.json', readRows);
  return (
    <article id="legal-packages" className={`${CARD} p-5`}>
      <h2 className="font-fraunces text-[20px] text-cream font-normal tracking-tight m-0 mb-2">{strings['legal.noticesPackages']}</h2>
      <Status loaded={loaded} />
      {loaded.state === 'ready' ? (
        <>
          <p className="font-nunito text-xs text-muted m-0 mb-3">{fill(strings['legal.noticesCount'], { n: String(loaded.value.length) })}</p>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {loaded.value.map((row) => (
              <li key={`${row.name}@${row.version}`} className="flex items-baseline justify-between gap-3 font-mono text-[11px] leading-[16px]">
                <span className="text-cream break-all">
                  {row.name} <span className="text-muted">{row.version}</span>
                </span>
                <span className="text-goldLight shrink-0 text-right">{row.license}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}
