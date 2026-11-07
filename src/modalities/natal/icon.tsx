// The frozen icon of the natal card.
export default function Icon() {
  return (
    <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2.5v19M2.5 12h19M5.28 5.28l13.44 13.44M5.28 18.72L18.72 5.28" strokeLinecap="round" />
    </svg>
  );
}
