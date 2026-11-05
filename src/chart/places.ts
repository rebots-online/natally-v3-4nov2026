// searchPlaces (§5.8). The place list loads on first use and stays in memory. Built by tools/build-cities.mjs.
import type { BirthPlace } from '../types';

type CityRow = [label: string, latitude: number, longitude: number, timeZone: string, population: number];
interface City { row: CityRow; search: string; }

let cities: Promise<City[]> | null = null;

/** Lower case with accents removed, so "montreal" finds "Montréal". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

function loadCities(): Promise<City[]> {
  cities ??= fetch('/geo/cities.json')
    .then((response) => {
      if (!response.ok) throw new Error(`cities.json: HTTP ${response.status}`);
      return response.json() as Promise<CityRow[]>;
    })
    .then((rows) => rows.map((row) => ({ row, search: fold(row[0]) })))
    .catch((error: unknown) => {
      cities = null;
      throw error;
    });
  return cities;
}

/** Places whose label starts with the query come first, then those with a word that starts with it. The list is already by population. */
export async function searchPlaces(query: string, limit: number): Promise<BirthPlace[]> {
  const wanted = fold(query);
  if (!wanted) return [];
  const all = await loadCities();
  const startsLabel: City[] = [];
  const startsWord: City[] = [];
  for (const city of all) {
    if (city.search.startsWith(wanted)) startsLabel.push(city);
    else if (city.search.includes(` ${wanted}`)) startsWord.push(city);
    if (startsLabel.length >= limit) break;
  }
  return [...startsLabel, ...startsWord].slice(0, limit).map(({ row: [label, latitude, longitude, timeZone] }) => ({ label, latitude, longitude, timeZone }));
}
