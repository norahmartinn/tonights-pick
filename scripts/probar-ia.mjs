// Banco de pruebas de la IA de recomendación.
//
// Lanza peticiones con restricciones duras (idioma, década, duración, tipo,
// número de episodios) y verifica CADA respuesta contra TMDB, que es la fuente
// de verdad. Detecta títulos inventados, restricciones incumplidas y
// plataformas que no coinciden con dónde se puede ver de verdad.
//
//   node scripts/probar-ia.mjs
//
// Necesita un .env con SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y TMDB_API_TOKEN.
// Crea una cuenta de prueba desechable en cada ejecución.
//
// Ojo: el plan gratuito de Groq tiene límite de peticiones. Si empiezan a salir
// "Too many requests", espera un par de minutos y vuelve a lanzarlo.
import { readFileSync } from "fs";

const APP = "https://tonights-pick.norahmartinn.workers.dev";
const FN = "b77b03e41685c4a6227fa3945a57c56a18f0bcd2aced03c571752bab093d0ca5";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.trim().startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; })
);
const SUPA = env.SUPABASE_URL, KEY = env.SUPABASE_PUBLISHABLE_KEY, TMDB = env.TMDB_API_TOKEN;

const EMAIL = `qa.stress.${Date.now()}@gmail.com`;
const PASS = "TestOnly-9f2b!x";

async function token() {
  await fetch(`${SUPA}/auth/v1/signup`, { method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }) });
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }) });
  return (await r.json()).access_token;
}

// TanStack Start no manda JSON plano: serializa con seroval.
// t:1 cadena · t:9 array · t:10 objeto · i = índice en orden de aparición.
function seroval(valor) {
  let i = 0;
  const enc = (v) => {
    if (typeof v === "string") return { t: 1, s: v };
    if (typeof v === "number") return { t: 0, s: v };
    if (Array.isArray(v)) { const idx = i++; return { t: 9, i: idx, a: v.map(enc), o: 0 }; }
    if (v && typeof v === "object") {
      const idx = i++, k = Object.keys(v);
      return { t: 10, i: idx, p: { k, v: k.map((x) => enc(v[x])) }, o: 0 };
    }
    return { t: 1, s: String(v) };
  };
  return JSON.stringify({ t: enc(valor), f: 63, m: [] });
}

// y responde también en seroval: hay que deshacer el árbol
function desSeroval(nodo) {
  if (nodo == null || typeof nodo !== "object") return nodo;
  if (nodo.t === 1 || nodo.t === 0) return nodo.s;
  if (nodo.t === 9) return (nodo.a ?? []).map(desSeroval);
  if (nodo.t === 10 && nodo.p) {
    const o = {};
    nodo.p.k.forEach((k, idx) => { o[k] = desSeroval(nodo.p.v[idx]); });
    return o;
  }
  if (nodo.t !== undefined && nodo.s !== undefined) return nodo.s;
  return nodo;
}

async function recomienda(tok, data) {
  const r = await fetch(`${APP}/_serverFn/${FN}`, { method: "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/json",
      "x-tsr-serverfn": "true",
      Accept: "application/x-tss-framed, application/x-ndjson, application/json",
    },
    body: seroval({ data }) });
  const txt = await r.text();
  if (!r.ok) return { _error: `HTTP ${r.status}: ${txt.slice(0, 160)}` };
  try {
    // puede venir en varias líneas (ndjson); nos quedamos con la que trae el objeto
    for (const linea of txt.split("\n").filter(Boolean)) {
      const j = JSON.parse(linea);
      // la respuesta ES el nodo raíz: j.t es el tipo (un número), no un subárbol
      const v = desSeroval(j);
      if (v && typeof v === "object" && v.title) return v;
      if (v && typeof v === "object" && v.result?.title) return v.result;
    }
    return { _error: `sin título en la respuesta: ${txt.slice(0, 200)}` };
  } catch (e) { return { _error: `no parseable: ${txt.slice(0, 160)}` }; }
}

// ---- verificación contra TMDB ----
async function tmdb(ruta, params = {}) {
  const q = new URLSearchParams(params);
  const r = await fetch(`https://api.themoviedb.org/3${ruta}?${q}`, {
    headers: { Authorization: `Bearer ${TMDB}`, Accept: "application/json" } });
  return r.json();
}

async function buscar(titulo, año, kind) {
  const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // El año como PARÁMETRO de búsqueda desambigua mucho mejor que filtrar después:
  // hay muchas fichas con el mismo título.
  const intentos = [];
  if (kind === "tv" || !kind) intentos.push(["/search/tv", año ? { query: titulo, first_air_date_year: año } : { query: titulo }, "tv"]);
  if (kind === "movie" || !kind) intentos.push(["/search/movie", año ? { query: titulo, primary_release_year: año } : { query: titulo }, "movie"]);
  intentos.push(["/search/multi", { query: titulo }, null]);

  for (const [ruta, params, tipo] of intentos) {
    const d = await tmdb(ruta, params);
    let hits = (d.results ?? []).filter(h => (h.media_type ?? tipo) === "movie" || (h.media_type ?? tipo) === "tv");
    if (tipo) hits = hits.map(h => ({ ...h, media_type: h.media_type ?? tipo }));
    if (!hits.length) continue;
    const exacto = hits.find(h => norm(h.title || h.name) === norm(titulo));
    if (exacto) return exacto;
    if (ruta !== "/search/multi") return hits[0];
    return hits[0];
  }
  return null;
}

async function detalle(hit) {
  const d = await tmdb(`/${hit.media_type}/${hit.id}`, {});
  return {
    id: hit.id, tipo: hit.media_type,
    titulo: d.title || d.name,
    año: (d.release_date || d.first_air_date || "").slice(0, 4),
    idioma: d.original_language,
    paises: d.origin_country ?? (d.production_countries ?? []).map(p => p.iso_3166_1),
    duracion: d.runtime ?? (d.episode_run_time ?? [])[0] ?? null,
    temporadas: d.number_of_seasons ?? null,
    episodios: d.number_of_episodes ?? null,
    generos: (d.genres ?? []).map(g => g.name),
  };
}

// ---- casos ----
const CASOS = [
  { n: "Serie española reciente", data: { prompt: "Una serie española estrenada en los últimos cinco años", kind: "tv" },
    check: d => [ d.tipo === "tv" || "no es una serie", d.idioma === "es" || `idioma ${d.idioma}, no español`, (+d.año >= 2020) || `de ${d.año}, no reciente` ] },

  { n: "Anime anterior a 2000", data: { prompt: "Una película de animación japonesa anterior al año 2000", kind: "movie" },
    check: d => [ d.tipo === "movie" || "no es película", d.idioma === "ja" || `idioma ${d.idioma}, no japonés`, (+d.año < 2000) || `de ${d.año}, no anterior a 2000`, d.generos.includes("Animation") || `géneros ${d.generos}, sin animación` ] },

  { n: "Película muy corta", data: { prompt: "Una película que dure menos de 90 minutos", kind: "movie" },
    check: d => [ d.tipo === "movie" || "no es película", (d.duracion && d.duracion < 90) || `dura ${d.duracion} min` ] },

  { n: "Cine francés de los 60", data: { prompt: "Una película francesa de la década de 1960", kind: "movie" },
    check: d => [ d.idioma === "fr" || `idioma ${d.idioma}, no francés`, (+d.año >= 1960 && +d.año <= 1969) || `de ${d.año}, fuera de los 60` ] },

  { n: "Serie coreana de terror", data: { prompt: "Una serie coreana de terror", kind: "tv" },
    check: d => [ d.tipo === "tv" || "no es serie", d.idioma === "ko" || `idioma ${d.idioma}, no coreano` ] },

  { n: "Documental musical", data: { prompt: "Un documental sobre música, que no sea un biopic dramatizado" },
    check: d => [ d.generos.includes("Documentary") || `géneros ${d.generos}, sin documental` ] },

  { n: "Miniserie corta", data: { prompt: "Una miniserie de menos de diez episodios en total", kind: "tv" },
    check: d => [ d.tipo === "tv" || "no es serie", (d.episodios && d.episodios < 10) || `${d.episodios} episodios` ] },

  { n: "Cine italiano años 70", data: { prompt: "Un giallo italiano de los años setenta", kind: "movie" },
    check: d => [ d.idioma === "it" || `idioma ${d.idioma}, no italiano`, (+d.año >= 1970 && +d.año <= 1979) || `de ${d.año}, fuera de los 70` ] },

  { n: "Serie muy reciente", data: { prompt: "Una serie estrenada en 2024 o despues", kind: "tv" },
    check: d => [ d.tipo === "tv" || "no es serie", (+d.año >= 2024) || `de ${d.año}, anterior a 2024` ] },

  { n: "Peli de los ultimos 3 anos", data: { prompt: "Una pelicula estrenada en los ultimos tres anos", kind: "movie" },
    check: d => [ (+d.año >= 2023) || `de ${d.año}, no es de los ultimos 3 anos` ] },
];

const tok = await token();
console.log("cuenta:", EMAIL, "\n");

let fallos = 0;
let primero = true;
for (const c of CASOS) {
  // el plan gratuito de Groq limita por minuto: sin pausa saltan los 429
  if (!primero) await new Promise((r) => setTimeout(r, 8000));
  primero = false;
  const rec = await recomienda(tok, c.data);
  if (rec._error) { console.log(`✗ ${c.n}: ${rec._error}\n`); fallos++; continue; }

  const hit = await buscar(rec.title, rec.year, c.data.kind);
  if (!hit) {
    console.log(`✗ ${c.n}\n   pidió: "${c.data.prompt}"\n   devolvió: ${rec.title} (${rec.year})\n   ⚠️  NO EXISTE en TMDB — título inventado\n`);
    fallos++; continue;
  }
  const d = await detalle(hit);
  // ¿la plataforma que muestra la app coincide con la que dice TMDB para España?
  const wp = await tmdb(`/${d.tipo}/${d.id}/watch/providers`, {});
  const es = wp.results?.ES ?? {};
  const reales = [...(es.flatrate ?? []), ...(es.free ?? []), ...(es.ads ?? [])]
    .map(x => x.provider_name);
  const dicha = (rec.platform || "").trim();
  let veredicto;
  if (!dicha) veredicto = reales.length ? `⚠️ vacía, pero TMDB dice: ${reales.join(", ")}` : "✓ vacía y TMDB tampoco tiene datos";
  else if (reales.some(r => r.toLowerCase() === dicha.toLowerCase())) veredicto = `✓ "${dicha}" confirmada por TMDB`;
  else veredicto = `⚠️ dice "${dicha}" pero TMDB (ES) tiene: ${reales.join(", ") || "ninguna"}`;
  console.log(`   PLATAFORMA: ${veredicto}`);

  const problemas = c.check(d).filter(x => x !== true);
  const ok = problemas.length === 0;
  if (!ok) fallos++;
  console.log(`${ok ? "✓" : "✗"} ${c.n}`);
  console.log(`   pidió:    "${c.data.prompt}"${c.data.kind ? ` [kind=${c.data.kind}]` : ""}`);
  console.log(`   devolvió: ${rec.title} (${rec.year}) · tipo app: ${rec.media_type ?? "—"} · plataforma: ${rec.platform}`);
  console.log(`   TMDB:     ${d.titulo} (${d.año}) · ${d.tipo} · ${d.idioma} · ${d.duracion ?? "?"}min · ${d.episodios ?? "—"}ep · ${d.generos.join(", ")}`);
  if (!ok) console.log(`   ⚠️  ${problemas.join(" | ")}`);
  console.log();
}
console.log(`━━━ ${CASOS.length - fallos}/${CASOS.length} correctos, ${fallos} fallos ━━━`);
