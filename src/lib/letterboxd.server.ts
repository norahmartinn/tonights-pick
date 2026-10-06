/**
 * Nota media de Letterboxd para una película, a partir de su id de TMDB.
 *
 * Letterboxd no tiene API abierta, pero `/tmdb/{id}/` redirige a la ficha y la
 * ficha lleva la nota en su JSON-LD. Solo vale para películas: con el id de
 * una serie la redirección cae en la película que tenga ese mismo número.
 *
 * Devuelve "" si no hay nota o si Letterboxd no responde a tiempo; quien llama
 * se queda entonces con la de TMDB.
 */
export async function letterboxdRating(tmdbId: number): Promise<string> {
  try {
    const res = await fetch(`https://letterboxd.com/tmdb/${tmdbId}/`, {
      headers: {
        "User-Agent": "tonights-pick/1.0 (+https://tonights-pick.norahmartinn.workers.dev)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const m = html.match(/"aggregateRating":\{[^}]*?"ratingValue":([\d.]+)/);
    const nota = m ? parseFloat(m[1]) : NaN;
    return Number.isFinite(nota) && nota > 0 ? `${nota.toFixed(1)}/5` : "";
  } catch {
    return "";
  }
}
