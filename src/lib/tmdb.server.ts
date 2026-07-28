const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

function authHeaders() {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new Error("Missing TMDB_API_TOKEN");
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export type TmdbDetails = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  year: string;
  genre: string;
  rating: string;
  description: string;
  poster_url: string;
  director: string;
  cast_members: string;
};

type SearchHit = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
};

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

function yearOf(d?: string) {
  return d && /^\d{4}/.test(d) ? d.slice(0, 4) : "";
}

function scoreMatch(hit: SearchHit, wantTitle: string, wantYear?: string) {
  const name = (hit.title ?? hit.name ?? "").toLowerCase();
  const want = wantTitle.toLowerCase();
  let s = 0;
  if (name === want) s += 100;
  else if (name.startsWith(want) || want.startsWith(name)) s += 60;
  else if (name.includes(want) || want.includes(name)) s += 30;
  const y = yearOf(hit.release_date ?? hit.first_air_date);
  if (wantYear && y && Math.abs(parseInt(y, 10) - parseInt(wantYear, 10)) <= 1) s += 20;
  s += Math.min(hit.popularity ?? 0, 50) / 5;
  return s;
}

export async function findTitle(
  title: string,
  year?: string,
  kind?: "movie" | "tv" | "any",
): Promise<TmdbDetails | null> {
  try {
    const search = await tmdb<{ results: SearchHit[] }>("/search/multi", {
      query: title,
      include_adult: "false",
    });
    let hits = (search.results ?? []).filter(
      (h): h is SearchHit & { media_type: "movie" | "tv" } =>
        h.media_type === "movie" || h.media_type === "tv"
    );
    if (kind === "movie" || kind === "tv") {
      const filtered = hits.filter((h) => h.media_type === kind);
      if (filtered.length) hits = filtered;
    }
    if (!hits.length) return null;
    hits.sort((a, b) => scoreMatch(b, title, year) - scoreMatch(a, title, year));
    const best = hits[0];
    return await fetchDetails(best.id, best.media_type);
  } catch {
    return null;
  }
}

export async function fetchDetails(
  id: number,
  media_type: "movie" | "tv"
): Promise<TmdbDetails | null> {
  try {
    type Detail = {
      id: number;
      title?: string;
      name?: string;
      release_date?: string;
      first_air_date?: string;
      overview?: string;
      vote_average?: number;
      poster_path?: string | null;
      genres?: { id: number; name: string }[];
      credits?: {
        cast?: { name: string; order: number }[];
        crew?: { name: string; job: string; department: string }[];
      };
      created_by?: { name: string }[];
    };
    const d = await tmdb<Detail>(`/${media_type}/${id}`, { append_to_response: "credits" });
    const title = d.title ?? d.name ?? "";
    const cast = (d.credits?.cast ?? [])
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ");
    let director = "";
    if (media_type === "movie") {
      director =
        (d.credits?.crew ?? []).find((c) => c.job === "Director")?.name ?? "";
    } else {
      director = (d.created_by ?? []).map((c) => c.name).join(", ");
    }
    return {
      tmdb_id: d.id,
      media_type,
      title,
      year: yearOf(d.release_date ?? d.first_air_date),
      genre: (d.genres ?? []).map((g) => g.name).join(", "),
      rating: d.vote_average ? `${d.vote_average.toFixed(1)}/10` : "",
      description: d.overview ?? "",
      poster_url: d.poster_path ? `${IMG}${d.poster_path}` : "",
      director,
      cast_members: cast,
    };
  } catch {
    return null;
  }
}