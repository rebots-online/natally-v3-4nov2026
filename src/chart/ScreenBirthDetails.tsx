// /birth (§9.1, §10 `birth-details`, §11.1): ported from the frozen screen. Saves the chart, then goes on to `next` or the voice step.
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../account';
import { track } from '../analytics';
import { useSession } from '../auth';
import { config } from '../config';
import type { BirthDetails } from '../types';
import { IconArrowBack } from '../ui';
import BirthFields from './BirthFields';
import { EMPTY_BIRTH_FIELDS, parseBirthFields, type BirthFieldErrors, type BirthFieldStrings, type BirthFieldValues } from './fields';
import { strings, MONTH_NAMES } from './strings';
import { saveBirth } from './useChart';

const FIELD_STRINGS: BirthFieldStrings = {
  nameLabel: strings['birth.nameLabel'],
  dateLabel: strings['birth.dateLabel'],
  timeLabel: strings['birth.timeLabel'],
  timeUnknownLabel: strings['birth.timeUnknownLabel'],
  timeNote: strings['birth.timeNote'],
  placeLabel: strings['birth.placeLabel'],
  noPlaces: strings['birth.noPlaces'],
  errors: {
    nameRequired: strings['birth.nameRequired'],
    dateInvalid: strings['birth.dateInvalid'],
    timeInvalid: strings['birth.timeInvalid'],
    placeRequired: strings['birth.placeRequired'],
  },
};

function valuesFromBirth(birth: BirthDetails): BirthFieldValues {
  const minute = String(birth.minute ?? 0).padStart(2, '0');
  return {
    name: birth.name,
    day: String(birth.day),
    month: MONTH_NAMES[birth.month - 1] ?? '',
    year: String(birth.year),
    time: birth.hour === null ? '' : `${birth.hour}:${minute}`,
    timeUnknown: birth.timeUnknown,
    placeText: birth.place.label,
    place: birth.place,
  };
}

/** Only a path inside this app: `next` comes from the address bar. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/voice');

export default function ScreenBirthDetails() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useSession();
  const { profile } = useProfile();
  const [values, setValues] = useState<BirthFieldValues>(EMPTY_BIRTH_FIELDS);
  const [fieldError, setFieldError] = useState<keyof BirthFieldErrors | null>(null);
  const [computing, setComputing] = useState(false);
  const [chartFailed, setChartFailed] = useState(false);

  // What is already known fills the form once, as it arrives; anything typed by then stays.
  const touched = useRef(false);
  const savedBirth = profile?.birth ?? null;
  const displayName = session.displayName;
  useEffect(() => {
    if (touched.current) return;
    if (savedBirth) setValues(valuesFromBirth(savedBirth));
    else if (displayName) setValues({ ...EMPTY_BIRTH_FIELDS, name: displayName });
  }, [savedBirth, displayName]);

  const onChange = (next: BirthFieldValues) => {
    touched.current = true;
    setFieldError(null);
    setValues(next);
  };

  const onBack = (e: MouseEvent) => {
    e.preventDefault();
    // React Router numbers its history entries. "/" sends shells and the installed app on to /pick.
    if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1);
    else navigate('/');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (computing) return;
    setChartFailed(false);
    const parsed = parseBirthFields(values);
    if ('error' in parsed) {
      setFieldError(parsed.error);
      return;
    }
    setFieldError(null);
    setComputing(true);
    track('birth_details_submit', { time_known: !parsed.birth.timeUnknown });
    try {
      await saveBirth(parsed.birth);
      navigate(safeNext(params.get('next')), { replace: true });
    } catch {
      setChartFailed(true);
      setComputing(false);
    }
  };

  return (
    <div className="bg-[#120c1c] text-[#f1e8d8] font-body min-h-screen relative flex flex-col justify-between selection:bg-[#c9a24a] selection:text-[#120c1c]">
      <main className="w-full max-w-[430px] mx-auto px-4 pt-5 pb-16 flex flex-col">
        <div className="w-full flex items-center justify-start mb-6">
          <a href="/" id="birth-back-link" onClick={onBack} className="inline-flex items-center gap-1.5 text-[#a698b5] hover:text-[#f1e8d8] font-body text-sm font-semibold transition-colors duration-150">
            <IconArrowBack size={18} />
            {strings['birth.back']}
          </a>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-[96px] h-[96px] rounded-full border border-[#c9a24a] overflow-hidden bg-[#1a1226] flex items-center justify-center shrink-0">
            <img src="/brand/natally-still.webp" alt={strings['birth.cameoAlt']} className="w-full h-full object-cover object-center" style={{ transform: 'scale(1.6) translateY(2px)' }} />
          </div>
        </div>

        <h1 className="font-fraunces text-[28px] leading-[1.2] text-[#f1e8d8] font-bold text-center mb-2">{strings['birth.heading']}</h1>
        <p className="font-body text-[14px] text-[#a698b5] text-center mb-7">{strings['birth.subheading']}</p>

        <form id="birth-form" className="flex flex-col gap-5 w-full" noValidate onSubmit={onSubmit}>
          <BirthFields idPrefix="birth" value={values} onChange={onChange} strings={FIELD_STRINGS} error={fieldError} />
          <div className="pt-2">
            <button
              type="submit"
              id="birth-submit-button"
              disabled={computing}
              className="w-full h-[52px] bg-[#c9a24a] hover:bg-[#d8b056] active:scale-[0.99] text-[#120c1c] font-cinzel font-bold text-[15px] tracking-wide rounded-[12px] flex items-center justify-center transition-all duration-150 cursor-pointer shadow-none"
            >
              {computing ? strings['birth.computing'] : strings['birth.submit']}
            </button>
            {chartFailed ? (
              <p id="birth-chart-error" role="alert" className="font-body text-[12px] text-[var(--color-error)] leading-snug text-center mt-2">
                {strings['birth.chartFailed']}
              </p>
            ) : null}
          </div>
        </form>
      </main>
      <div className="fixed bottom-2 right-2 z-50 bg-[#0b0712] border border-[#3a2d50]/60 rounded px-1.5 py-0.5 pointer-events-none select-none">
        <span className="font-mono text-[10px] text-[#f2ca50] tracking-wider leading-none block">v{config.version}</span>
      </div>
    </div>
  );
}
