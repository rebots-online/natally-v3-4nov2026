// Local clock time at a place to a UT instant, through the IANA zone and Intl.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'gregory',
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** The zone's offset from UT at an instant, in milliseconds. Keeps seconds, so local mean time before standard time is exact. */
function offsetAt(instantMs: number, timeZone: string): number {
  const parts: Record<string, number> = {};
  for (const { type, value } of formatter(timeZone).formatToParts(instantMs)) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  const wall = Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!);
  const wholeSeconds = Math.floor(instantMs / 1000) * 1000;
  return wall - wholeSeconds;
}

const DAY_MS = 86_400_000;

/**
 * The instant a local clock showed this time. Offsets either side of the moment are tried, because a clock change can lie between.
 * A time clocks showed twice (autumn) resolves to the first; a time clocks skipped (spring) is read with the offset before the
 * change, the rule of Temporal's `compatible`.
 */
export function localToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const before = offsetAt(wall - DAY_MS, timeZone);
  const after = offsetAt(wall + DAY_MS, timeZone);
  const valid = [before, after].map((offset) => wall - offset).filter((instant) => wall - offsetAt(instant, timeZone) === instant);
  return new Date(valid.length > 0 ? Math.min(...valid) : wall - before);
}
