// The example chart on the landing page (§5.16): a fixed, anonymous person. The chart itself is computed live from these constants.
import { useEffect, useState } from 'react';
import { computeChart, listChartElements } from '../chart';
import type { BirthDetails, Chart, ChartElementView } from '../types';

export const EXAMPLE_CITY = 'Toronto';
export const EXAMPLE_BIRTH: BirthDetails = {
  name: 'Aurelia',
  year: 1997, month: 11, day: 8,
  hour: 19, minute: 5,
  timeUnknown: false,
  place: { label: 'Toronto, Ontario, Canada', latitude: 43.6532, longitude: -79.3832, timeZone: 'America/Toronto' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "8 Nov 1997, 7:05 PM, Toronto" */
export function exampleBornLabel(b: BirthDetails = EXAMPLE_BIRTH, city = EXAMPLE_CITY): string {
  const hour = b.hour ?? 0;
  const clock = `${hour % 12 === 0 ? 12 : hour % 12}:${String(b.minute ?? 0).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  return `${b.day} ${MONTHS[b.month - 1]} ${b.year}, ${clock}, ${city}`;
}

let pending: Promise<Chart> | null = null;

/** The example chart, once the ephemeris has computed it. Both layouts share one computation. */
export function useExampleChart(): { chart: Chart | null; elements: ChartElementView[] } {
  const [chart, setChart] = useState<Chart | null>(null);
  useEffect(() => {
    let live = true;
    pending ??= computeChart(EXAMPLE_BIRTH);
    pending.then(
      (c) => live && setChart(c),
      () => { pending = null; },
    );
    return () => { live = false; };
  }, []);
  return { chart, elements: chart ? listChartElements(chart) : [] };
}
