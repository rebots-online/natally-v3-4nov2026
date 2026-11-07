// §12.4: streamed text in, whole sentences out. The only cut that is not a sentence end is the 400-character rule.
const MAX_CHARS = 400;
const NO_END = new Set(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'St', 'Mt', 'vs', 'etc', 'e.g', 'i.e', 'a.m', 'p.m', 'No', 'approx',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec']);
/** These end a sentence when the next word starts a new capitalised one. */
const END_IF_CAPITAL = new Set(['etc', 'a.m', 'p.m']);
const TERMINATORS = new Set(['.', '!', '?', '…']);
const CLOSERS = new Set(['"', '”', "'", '’', ')', ']']);
const OPENING_QUOTES = new Set(['"', '“', "'", '‘']);
const isSpace = (c: string): boolean => /\s/.test(c);
const isUpper = (c: string): boolean => /\p{Lu}/u.test(c);
const BULLET = /^[ \t]*(?:[-–—•+]|\d+[.)])[ \t]+/gm;

type Scan = { kind: 'end'; end: number; rest: number } | { kind: 'wait' } | { kind: 'none' };

function updateQuote(open: boolean, c: string): boolean {
  if (c === '"') return !open;
  if (c === '“') return true;
  if (c === '”') return false;
  return open;
}

/** Why a lone `.` followed by whitespace is not an end: 'no' never, 'capital' only before a capital, 'yes' it is an end. */
function dotRule(before: string): 'no' | 'capital' | 'yes' {
  const token = /[^\s("“‘'[]*$/.exec(before)?.[0] ?? '';
  if (END_IF_CAPITAL.has(token)) return 'capital';
  if (NO_END.has(token)) return 'no';
  if (/(?:^|\.)\p{Lu}$/u.test(token)) return 'no'; // Initials: J. K.
  if (/(?:^|\n)[ \t]*\d+$/.test(before)) return 'no'; // A numbered list marker: stripped on the way out.
  return 'yes';
}

function nextNonSpace(text: string, from: number): string | null {
  for (let i = from; i < text.length; i += 1) if (!isSpace(text[i]!)) return text[i]!;
  return null;
}

function scan(text: string, quoteAtStart: boolean, final: boolean): Scan {
  let quote = quoteAtStart;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!;
    if (c === '\n') {
      const blank = /^\n[ \t\r]*\n/.exec(text.slice(i));
      if (blank) return { kind: 'end', end: i, rest: i + blank[0].length };
      continue;
    }
    if (!TERMINATORS.has(c)) {
      quote = updateQuote(quote, c);
      continue;
    }
    let runEnd = i;
    while (runEnd < text.length && TERMINATORS.has(text[runEnd]!)) runEnd += 1;
    const run = text.slice(i, runEnd);
    let after = runEnd;
    let quoteAfter = quote;
    while (after < text.length && CLOSERS.has(text[after]!)) {
      quoteAfter = updateQuote(quoteAfter, text[after]!);
      after += 1;
    }
    if (after >= text.length) {
      if (final) return { kind: 'end', end: after, rest: after };
      return { kind: 'wait' };
    }
    if (!isSpace(text[after]!) || quoteAfter) {
      i = runEnd - 1;
      continue;
    }
    const isEllipsis = run.includes('…') || /^\.{3,}$/.test(run);
    const rule = isEllipsis ? 'ellipsis' : run === '.' ? dotRule(text.slice(0, i)) : 'yes';
    if (rule === 'no') {
      i = runEnd - 1;
      continue;
    }
    if (rule === 'yes') return { kind: 'end', end: after, rest: after };
    const next = nextNonSpace(text, after);
    if (next === null) {
      if (final) return { kind: 'end', end: after, rest: after };
      return { kind: 'wait' };
    }
    if (isUpper(next) || (rule === 'ellipsis' && OPENING_QUOTES.has(next))) return { kind: 'end', end: after, rest: after };
    i = runEnd - 1;
  }
  return { kind: 'none' };
}

/** The last allowed cut at or before MAX_CHARS: `;`, `:` or `,` before a space, else the last space. */
function longCut(text: string): number {
  const head = text.slice(0, MAX_CHARS + 1);
  let space = -1;
  for (let i = head.length - 1; i > 0; i -= 1) {
    if (!isSpace(head[i]!)) continue;
    if (space < 0) space = i;
    if (/[;:,]/.test(head[i - 1]!)) return i;
  }
  return space > 0 ? space : MAX_CHARS;
}

const tidy = (raw: string): string => raw.replace(BULLET, '').replace(/\s+/g, ' ').trim();
const wordCount = (s: string): number => s.split(' ').filter(Boolean).length;

export class SentenceSegmenter {
  private buffer = '';
  private quoteOpen = false;
  private fragment = '';

  push(text: string): string[] {
    this.buffer += text.replace(/[*_#]/g, '');
    return this.drain(false);
  }

  flush(): string[] {
    const out = this.drain(true);
    const rest = tidy(this.buffer);
    this.buffer = '';
    this.quoteOpen = false;
    const last = [this.fragment, rest].filter(Boolean).join(' ');
    this.fragment = '';
    if (last) out.push(last);
    return out;
  }

  private drain(final: boolean): string[] {
    const out: string[] = [];
    for (;;) {
      this.buffer = this.buffer.replace(/^\s+/, '');
      if (!this.buffer) return out;
      const found = scan(this.buffer, this.quoteOpen, final);
      if (found.kind === 'end' && found.end <= MAX_CHARS) {
        this.emit(this.buffer.slice(0, found.end), out);
        this.buffer = this.buffer.slice(found.rest);
        this.quoteOpen = false;
        continue;
      }
      if (this.buffer.length <= MAX_CHARS) return out;
      const cut = longCut(this.buffer);
      const head = this.buffer.slice(0, cut);
      for (const c of head) this.quoteOpen = updateQuote(this.quoteOpen, c);
      this.emit(head, out);
      this.buffer = this.buffer.slice(cut);
    }
  }

  private emit(raw: string, out: string[]): void {
    const clean = tidy(raw);
    if (!clean) return;
    const joined = this.fragment ? `${this.fragment} ${clean}` : clean;
    if (wordCount(joined) < 2) {
      this.fragment = joined;
      return;
    }
    this.fragment = '';
    out.push(joined);
  }
}
