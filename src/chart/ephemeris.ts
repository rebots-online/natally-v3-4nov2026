// The only file that touches Swiss Ephemeris. The package and its WASM load on first use, so no screen pays for them until
// a chart is asked for. A failed load is forgotten, so the next attempt fetches again (§11.1: `birth.chartFailed`, button again).
// The built-in Moshier ephemeris runs offline with no data files (§2).
import wasmUrl from '@swisseph/browser/dist/swisseph.wasm?url';
import type { PlanetKey } from '../types';

export interface BodyPosition { longitude: number; speed: number; }
export interface HouseAngles { placidusCusps: number[]; ascendant: number; midheaven: number; }

export interface Ephemeris {
  julianDayUt(at: Date): number;
  position(julianDayUt: number, key: PlanetKey): BodyPosition;
  /** Placidus cusps 1 to 12 and the angles. Inside the polar circles the cusps are not to be used: Placidus is undefined there. */
  houses(julianDayUt: number, latitude: number, longitude: number): HouseAngles;
}

let loading: Promise<Ephemeris> | null = null;

async function load(): Promise<Ephemeris> {
  const { SwissEphemeris, Planet, LunarPoint, HouseSystem } = await import('@swisseph/browser');
  const swe = new SwissEphemeris();
  await swe.init(wasmUrl);

  const bodies = {
    sun: Planet.Sun,
    moon: Planet.Moon,
    mercury: Planet.Mercury,
    venus: Planet.Venus,
    mars: Planet.Mars,
    jupiter: Planet.Jupiter,
    saturn: Planet.Saturn,
    uranus: Planet.Uranus,
    neptune: Planet.Neptune,
    pluto: Planet.Pluto,
    north_node: LunarPoint.TrueNode,
  } satisfies Record<PlanetKey, unknown>;

  return {
    julianDayUt: (at) =>
      swe.julianDay(
        at.getUTCFullYear(),
        at.getUTCMonth() + 1,
        at.getUTCDate(),
        at.getUTCHours() + at.getUTCMinutes() / 60 + (at.getUTCSeconds() + at.getUTCMilliseconds() / 1000) / 3600,
      ),
    position: (julianDayUt, key) => {
      const { longitude, longitudeSpeed } = swe.calculatePosition(julianDayUt, bodies[key]);
      return { longitude, speed: longitudeSpeed };
    },
    houses: (julianDayUt, latitude, longitude) => {
      const { cusps, ascendant, mc } = swe.calculateHouses(julianDayUt, latitude, longitude, HouseSystem.Placidus);
      return { placidusCusps: cusps.slice(1, 13), ascendant, midheaven: mc };
    },
  };
}

export function loadEphemeris(): Promise<Ephemeris> {
  loading ??= load().catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}
