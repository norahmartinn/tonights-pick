/**
 * Nota media de Letterboxd y enlace a la ficha, a partir del id de TMDB.
 *
 * Letterboxd no tiene API abierta, pero `/tmdb/{id}/` redirige a la ficha y la
 * ficha lleva la nota en su JSON-LD. Solo vale para películas: con el id de
 * una serie la redirección cae en la película que tenga ese mismo número.
 *
 * Devuelve la nota vacía si no hay o si Letterboxd no responde a tiempo; quien
 * llama se queda entonces con la de TMDB.
 */
export async function letterboxdFilm(tmdbId: number): Promise<{ rating: string; url: string }> {
  const nada = { rating: "", url: "" };
  try {
    const res = await fetch(`https://letterboxd.com/tmdb/${tmdbId}/`, {
      headers: {
        "User-Agent": "tonights-pick/1.0 (+https://tonights-pick.norahmartinn.workers.dev)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return nada;
    const html = await res.text();
    const m = html.match(/"aggregateRating":\{[^}]*?"ratingValue":([\d.]+)/);
    const nota = m ? parseFloat(m[1]) : NaN;
    if (!Number.isFinite(nota) || nota <= 0) return nada;
    // Tras la redirección, res.url ya es la ficha (/film/…).
    const url = /^https:\/\/letterboxd\.com\/film\//.test(res.url) ? res.url : "";
    return { rating: `${nota.toFixed(1)}/5`, url };
  } catch {
    return nada;
  }
}
