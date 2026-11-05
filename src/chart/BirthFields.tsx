// The fields of a birth form (§5.8), ported from the two frozen forms: `#birth-form` (idPrefix "birth") and `#synastry-sheet`
// (idPrefix "synastry"). They share behaviour and differ in markup, so each has its own layout. The caller owns the <form> or sheet,
// the submit button, and the error: pass parseBirthFields' result as `error` and it appears under its field.
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import type { BirthPlace } from '../types';
import { IconMapPin, ListRow } from '../ui';
import { daysInMonth, type BirthFieldErrors, type BirthFieldStrings, type BirthFieldValues } from './fields';
import { searchPlaces } from './places';
import './birth-fields.css';
import { MONTH_NAMES } from './strings';

const SUGGESTION_LIMIT = 8;
const SEARCH_DELAY_MS = 200;
const FIRST_YEAR = 1900;

interface BirthFieldsProps {
  idPrefix: 'birth' | 'synastry';
  value: BirthFieldValues;
  onChange(v: BirthFieldValues): void;
  strings: BirthFieldStrings;
  error?: keyof BirthFieldErrors | null;
}

const setTyping = (active: boolean) => window.dispatchEvent(new CustomEvent('natally:typing', { detail: active }));

function usePlaceSearch(value: BirthFieldValues, onChange: (v: BirthFieldValues) => void) {
  const [suggestions, setSuggestions] = useState<BirthPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const latest = useRef(0);
  const query = value.place ? '' : value.placeText;

  useEffect(() => {
    const search = (latest.current += 1);
    if (!query.trim()) {
      setSuggestions([]);
      setNoMatch(false);
      return;
    }
    const timer = setTimeout(() => {
      searchPlaces(query, SUGGESTION_LIMIT)
        .catch((): BirthPlace[] => [])
        .then((found) => {
          if (search !== latest.current) return;
          setSuggestions(found);
          setNoMatch(found.length === 0);
        });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return {
    suggestions: open && !value.place ? suggestions : [],
    noMatch: open && !value.place && noMatch,
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    pick(place: BirthPlace) {
      setOpen(false);
      onChange({ ...value, place, placeText: place.label });
    },
  };
}

function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} role="alert" className="font-body text-[12px] text-[var(--color-error)] leading-snug mt-1.5">
      {text}
    </p>
  );
}

export default function BirthFields({ idPrefix, value, onChange, strings, error = null }: BirthFieldsProps) {
  const places = usePlaceSearch(value, onChange);
  const set = (patch: Partial<BirthFieldValues>) => onChange({ ...value, ...patch });

  const dayCount = daysInMonth(value.month, value.year);
  const setDate = (patch: Partial<BirthFieldValues>) => {
    const next = { ...value, ...patch };
    // A day this month does not have is cleared, never moved: the customer picks again.
    if (Number(next.day) > daysInMonth(next.month, next.year)) next.day = '';
    onChange(next);
  };

  const dayOptions = Array.from({ length: dayCount }, (_, i) => String(i + 1));
  const lastYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => String(lastYear - i));
  // Nothing chosen yet shows as an empty box: a default date could quietly become a wrong chart.
  const blank = <option value="" hidden />;

  const selects = {
    day: (className: string) => (
      <select id={`${idPrefix}-day-select`} className={className} value={value.day} onChange={(e) => setDate({ day: e.target.value })}>
        {blank}
        {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    ),
    month: (className: string) => (
      <select id={`${idPrefix}-month-select`} className={className} value={value.month} onChange={(e) => setDate({ month: e.target.value })}>
        {blank}
        {MONTH_NAMES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    ),
    year: (className: string) => (
      <select id={`${idPrefix}-year-select`} className={className} value={value.year} onChange={(e) => setDate({ year: e.target.value })}>
        {blank}
        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    ),
  };

  const text = (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setTyping(true);
    setter(e.target.value);
  };
  const stopTyping = () => setTyping(false);
  const onPlaceChange = text((placeText) => set({ placeText, place: null }));

  const errorFor = (key: keyof BirthFieldErrors, slot: string): ReactNode =>
    error === key ? <FieldError id={`${idPrefix}-${slot}-error`} text={strings.errors[key]} /> : null;

  const suggestionList =
    places.suggestions.length > 0 || places.noMatch ? (
      // Pressing a row must not blur the field first, or the list would close before the press lands.
      <div
        id={`${idPrefix}-place-suggestions`}
        className="absolute left-0 right-0 top-full mt-1 z-40 bg-[#1a1226] border border-[#3a2d50] rounded-[12px] overflow-hidden"
        onMouseDown={(e) => e.preventDefault()}
      >
        {places.noMatch ? (
          <p className="font-body text-[14px] text-[#a698b5] px-4 py-3">{strings.noPlaces}</p>
        ) : (
          places.suggestions.map((place, i) => (
            <ListRow key={place.label} id={`${idPrefix}-place-option-${i}`} label={place.label} onClick={() => places.pick(place)} />
          ))
        )}
      </div>
    ) : null;

  if (idPrefix === 'synastry') {
    return (
      <>
        <div className="field-group">
          <label className="field-label" htmlFor="synastry-name-input">{strings.nameLabel}</label>
          <input type="text" className="input-field" id="synastry-name-input" placeholder={strings.namePlaceholder} value={value.name} onChange={text((name) => set({ name }))} onBlur={stopTyping} />
          {errorFor('nameRequired', 'name')}
        </div>
        <div className="field-group">
          <label className="field-label">{strings.dateLabel}</label>
          <div className="date-row">
            {selects.day('select-field')}
            {selects.month('select-field')}
            {selects.year('select-field')}
          </div>
          {errorFor('dateInvalid', 'date')}
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="synastry-time-input">{strings.timeLabel}</label>
          <input type="text" className="input-field disabled:opacity-50" id="synastry-time-input" placeholder={strings.timePlaceholder} disabled={value.timeUnknown} value={value.time} onChange={text((time) => set({ time }))} onBlur={stopTyping} />
          <label className="checkbox-row" htmlFor="synastry-time-unknown-checkbox">
            <input type="checkbox" className="custom-checkbox" id="synastry-time-unknown-checkbox" checked={value.timeUnknown} onChange={(e) => set({ timeUnknown: e.target.checked })} />
            <span className="checkbox-label">{strings.timeUnknownLabel}</span>
          </label>
          {errorFor('timeInvalid', 'time')}
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="synastry-place-input">{strings.placeLabel}</label>
          <div className="search-input-wrapper">
            <IconMapPin size={18} />
            <input type="text" className="input-field search-input" id="synastry-place-input" placeholder={strings.placePlaceholder} autoComplete="off" value={value.placeText} onChange={onPlaceChange} onFocus={places.onFocus} onBlur={() => { places.onBlur(); stopTyping(); }} />
            {suggestionList}
          </div>
          {errorFor('placeRequired', 'place')}
        </div>
      </>
    );
  }

  const selectClass = 'w-full h-[48px] bg-[#1a1226] border border-[#3a2d50] rounded-[12px] px-3 text-[#f1e8d8] font-body text-[15px] cursor-pointer';
  const labelClass = 'font-mono text-[13px] text-[#a698b5] mb-2';
  return (
    <>
      <div className="flex flex-col">
        <label htmlFor="birth-name-input" className={labelClass}>{strings.nameLabel}</label>
        <input
          type="text"
          id="birth-name-input"
          value={value.name}
          onChange={text((name) => set({ name }))}
          onBlur={stopTyping}
          className="h-[48px] bg-[#1a1226] border border-[#3a2d50] rounded-[12px] px-4 text-[#f1e8d8] font-body text-[15px] transition-colors"
        />
        {errorFor('nameRequired', 'name')}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>{strings.dateLabel}</label>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">{selects.day(selectClass)}</div>
          <div className="col-span-5">{selects.month(selectClass)}</div>
          <div className="col-span-4">{selects.year(selectClass)}</div>
        </div>
        {errorFor('dateInvalid', 'date')}
      </div>

      <div className="flex flex-col">
        <label htmlFor="birth-time-input" className={labelClass}>{strings.timeLabel}</label>
        <input
          type="text"
          id="birth-time-input"
          disabled={value.timeUnknown}
          value={value.time}
          onChange={text((time) => set({ time }))}
          onBlur={stopTyping}
          className="h-[48px] bg-[#1a1226] border border-[#3a2d50] rounded-[12px] px-4 text-[#f1e8d8] font-body text-[15px] mb-3 transition-colors disabled:opacity-50"
        />
        <div className="flex items-center gap-2.5 mb-1.5">
          <input
            type="checkbox"
            id="birth-time-unknown-checkbox"
            className="custom-checkbox"
            checked={value.timeUnknown}
            onChange={(e) => set({ timeUnknown: e.target.checked })}
          />
          <label htmlFor="birth-time-unknown-checkbox" className="font-body text-[14px] text-[#f1e8d8] cursor-pointer select-none">
            {strings.timeUnknownLabel}
          </label>
        </div>
        {strings.timeNote ? <p className="font-body text-[12px] text-[#a698b5] leading-snug">{strings.timeNote}</p> : null}
        {errorFor('timeInvalid', 'time')}
      </div>

      <div className="flex flex-col">
        <label htmlFor="birth-place-input" className={labelClass}>{strings.placeLabel}</label>
        <div className="relative flex items-center">
          <IconMapPin size={18} className="absolute left-3.5 text-[#a698b5] pointer-events-none" />
          <input
            type="text"
            id="birth-place-input"
            autoComplete="off"
            value={value.placeText}
            onChange={onPlaceChange}
            onFocus={places.onFocus}
            onBlur={() => {
              places.onBlur();
              stopTyping();
            }}
            className="w-full h-[48px] bg-[#1a1226] border border-[#3a2d50] rounded-[12px] pl-10 pr-4 text-[#f1e8d8] font-body text-[15px] transition-colors"
          />
          {suggestionList}
        </div>
        {errorFor('placeRequired', 'place')}
      </div>
    </>
  );
}
