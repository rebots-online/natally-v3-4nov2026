// Inline SVG for every icon the frozen screens show (§3.2 rule 7: no icon font). Strokes use currentColor, so the caller's text colour paints them.
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Pixel size of the square icon. Default 16. */
  size?: number;
}

function make(name: string, draw: ReactNode, stroke = 2) {
  const Icon = ({ size = 16, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {draw}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

export const IconChevronRight = make('IconChevronRight', <path d="M9 5l7 7-7 7" />);
export const IconChevronDown = make('IconChevronDown', <path d="M19 9l-7 7-7-7" />);
export const IconArrowBack = make('IconArrowBack', <path d="M19 12H5m6-7-7 7 7 7" />);
export const IconArrowRight = make('IconArrowRight', <path d="M14 5l7 7m0 0l-7 7m7-7H3" />);
export const IconClose = make('IconClose', <path d="M6 6l12 12M18 6L6 18" />);
export const IconCheck = make('IconCheck', <path d="M5 12.5l4.5 4.5L19 7.5" />, 2.4);
export const IconSound = make(
  'IconSound',
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </>,
);
export const IconSoundWaves = make(
  'IconSoundWaves',
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </>,
);
export const IconSoundOff = make(
  'IconSoundOff',
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M23 9l-6 6M17 9l6 6" />
  </>,
);
export const IconSliders = make(
  'IconSliders',
  <>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
  </>,
);
export const IconDownload = make('IconDownload', <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />);
export const IconShare = make(
  'IconShare',
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </>,
);
export const IconUser = make(
  'IconUser',
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
);
export const IconLock = make(
  'IconLock',
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);
export const IconMail = make(
  'IconMail',
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>,
);
export const IconMapPin = make(
  'IconMapPin',
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>,
);
export const IconLink = make(
  'IconLink',
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>,
);
export const IconImage = make(
  'IconImage',
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>,
);
export const IconFilePdf = make(
  'IconFilePdf',
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <path d="M14 2v6h6M9 13v4M12 13v4M15 13v4" />
  </>,
);
export const IconLogIn = make(
  'IconLogIn',
  <>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </>,
  2.2,
);

/** Three vertical dots: the grip on a draggable panel. Drawn, because no bundled font carries the braille dots the frozen screens used. */
export const IconGrip = ({ size = 12, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
    <circle cx="5" cy="2.5" r="1.1" />
    <circle cx="5" cy="6" r="1.1" />
    <circle cx="5" cy="9.5" r="1.1" />
  </svg>
);

/** Modality icons (frozen: pick-a-modality). */
export const IconChartWheel = make(
  'IconChartWheel',
  <>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2.5v19M2.5 12h19M5.28 5.28l13.44 13.44M5.28 18.72L18.72 5.28" />
  </>,
  1.5,
);
export const IconTarot = make(
  'IconTarot',
  <>
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <path d="M12 8.5v7M8.5 12h7M9.8 9.8l4.4 4.4M9.8 14.2l4.4-4.4" />
  </>,
  1.5,
);
export const IconIChing = make(
  'IconIChing',
  <>
    <path d="M5 4.5h14" />
    <path d="M5 7.5h5.5M13.5 7.5H19" />
    <path d="M5 10.5h14" />
    <path d="M5 13.5h5.5M13.5 13.5H19" />
    <path d="M5 16.5h5.5M13.5 16.5H19" />
    <path d="M5 19.5h14" />
  </>,
  1.75,
);

/** Brand-coloured Google "G" for the sign-in button; the four colours are the provider's, not ours. */
export const IconGoogle = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

/** A quarter ring that turns: the busy mark on a button. Reduced motion stops the turning (tokens.css). */
export const IconSpinner = ({ size = 18, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className="nat-spin" {...rest}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
