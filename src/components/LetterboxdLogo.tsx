import dots from "@/assets/letterboxd-dots.png";
import icon from "@/assets/letterboxd-icon.png";

/**
 * Logo de Letterboxd, para marcar de dónde viene la nota. En claro van los
 * tres puntos sueltos; en oscuro, el icono con su fondo, que es donde se lee.
 */
export function LetterboxdLogo({ height = 10 }: { height?: number }) {
  return (
    <>
      <img
        src={dots}
        alt="Letterboxd"
        title="Letterboxd"
        style={{ height, width: "auto" }}
        className="shrink-0 dark:hidden"
      />
      <img
        src={icon}
        alt="Letterboxd"
        title="Letterboxd"
        style={{ height: height * 1.6, width: "auto" }}
        className="shrink-0 hidden dark:block"
      />
    </>
  );
}
