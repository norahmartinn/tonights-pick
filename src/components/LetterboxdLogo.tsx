/** Los tres puntos de Letterboxd, para marcar de dónde viene la nota. */
export function LetterboxdLogo({ height = 10 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 26 10"
      height={height}
      width={height * 2.6}
      role="img"
      aria-label="Letterboxd"
      className="shrink-0"
    >
      <title>Letterboxd</title>
      <circle cx="5" cy="5" r="5" fill="#FF8000" />
      <circle cx="21" cy="5" r="5" fill="#40BCF4" />
      <circle cx="13" cy="5" r="5" fill="#00E054" />
      <path d="M9 2a5 5 0 0 1 0 6a5 5 0 0 1 0-6zM17 2a5 5 0 0 1 0 6a5 5 0 0 1 0-6z" fill="#fff" />
    </svg>
  );
}
