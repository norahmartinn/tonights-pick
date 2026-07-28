// Handcrafted prompt bank for the Home suggestion chips.
// Expand freely — the picker is category-based and scales to hundreds of prompts.

export type SuggestionCategory =
  | "mood"
  | "trope"
  | "similar"
  | "situation"
  | "vibe"
  | "genre"
  | "wildcard";

export const SUGGESTION_PROMPTS: Record<SuggestionCategory, string[]> = {
  mood: [
    "Surprise me tonight",
    "I need a comfort movie",
    "I just want to laugh",
    "I want a good cry",
    "I'm feeling nostalgic tonight",
    "I'm completely exhausted",
    "I can't stop thinking",
    "I need to escape reality",
    "Cheer me up",
    "Make me feel something",
    "I want butterflies",
    "Give me goosebumps",
    "Blow my mind",
    "I don't want to think",
    "Pick something for me",
    "Recommend my next obsession",
    "I want a happy ending",
    "I need some hope",
    "Something emotionally devastating",
    "I want to feel inspired",
  ],
  similar: [
    "Something like Harry Potter",
    "Something like Interstellar",
    "Something like La La Land",
    "Something like Dune",
    "Something like Knives Out",
    "Something like The Bear",
    "Something like Fleabag",
    "Something like Severance",
    "Something like Shrek",
    "Something like Everything Everywhere",
    "Something like Spirited Away",
    "Something like The Office",
    "Something like Succession",
    "Something like Gilmore Girls",
    "Something like Howl's Moving Castle",
  ],
  trope: [
    "An enemies-to-lovers romance",
    "A friends-to-lovers story",
    "The only one bed trope",
    "A fake dating romance",
    "A slow burn love story",
    "A second chance romance",
    "A found family story",
    "Grumpy meets sunshine",
    "Opposites attract",
    "Forbidden love",
    "A messy love triangle",
    "Marriage of convenience",
    "Soulmates finding each other",
    "Morally grey characters",
    "An unforgettable antihero",
    "A strong female lead",
    "A time loop story",
    "A mind-bending time travel movie",
    "Parallel universe chaos",
    "A coming-of-age story",
    "An unforgettable road trip",
    "A classic whodunnit mystery",
    "An unreliable narrator",
    "A heist that goes wrong",
    "Small town charm",
  ],
  situation: [
    "Something to watch on a first date",
    "A movie night with friends",
    "Something to watch with my parents",
    "A movie the whole family will enjoy",
    "Something for a rainy Sunday",
    "A cozy movie before bed",
    "A late-night binge",
    "Something for a lazy afternoon",
    "A movie for a long flight",
    "A weekend binge-worthy series",
    "A perfect solo movie night",
    "Something everyone will love",
    "A movie for a quiet evening",
    "An easy Sunday watch",
    "A comfort watch after work",
  ],
  vibe: [
    "Cozy autumn vibes",
    "A perfect summer romance",
    "A winter comfort movie",
    "Dark academia aesthetic",
    "Cottagecore vibes",
    "Main character energy",
    "A brain-off movie night",
    "Dreamy cinematography",
    "Neon city vibes",
    "Pure serotonin",
    "Beautiful visuals",
    "An unforgettable soundtrack",
    "Peak cinema",
    "Zero thoughts, just vibes",
    "Something beautifully shot",
  ],
  genre: [
    "A mind-bending sci-fi movie",
    "A psychological thriller",
    "A smart comedy",
    "An epic fantasy adventure",
    "A romantic comedy",
    "A murder mystery",
    "A gripping crime drama",
    "An animated masterpiece",
    "A horror movie tonight",
    "An action-packed adventure",
    "An underrated documentary",
    "A fantasy adventure",
    "A courtroom drama",
    "A space adventure",
    "A zombie apocalypse movie",
  ],
  wildcard: [
    "Something worth the hype",
    "An underrated hidden gem",
    "An Oscar-worthy performance",
    "A cult classic",
    "A movie I'll never forget",
    "The perfect first episode",
    "Just one more episode",
    "What did I just watch?",
    "A movie that stays with you",
    "Something with A24 vibes",
    "Studio Ghibli vibes",
    "Christopher Nolan vibes",
    "Wes Anderson aesthetics",
    "Black Mirror energy",
    "Something that will break me",
    "A movie with a crazy ending",
    "No superheroes tonight",
    "No romance please",
    "No horror tonight",
    "An easy watch for tonight",
  ],
};

// Versión en español. No son traducciones literales: se busca que suenen como
// las escribiría alguien aquí, porque son ejemplos de lo que la usuaria teclearía.
export const SUGGESTION_PROMPTS_ES: Record<SuggestionCategory, string[]> = {
  mood: [
    "Sorpréndeme esta noche",
    "Necesito una peli reconfortante",
    "Solo quiero reírme",
    "Quiero llorar a gusto",
    "Estoy de nostalgia",
    "Vengo reventada",
    "No puedo dejar de darle vueltas",
    "Necesito evadirme",
    "Anímame",
    "Quiero que algo me remueva",
    "Quiero mariposas en el estómago",
    "Ponme los pelos de punta",
    "Vuélame la cabeza",
    "No quiero pensar",
    "Elige tú por mí",
    "Recomiéndame mi próxima obsesión",
    "Quiero un final feliz",
    "Necesito algo de esperanza",
    "Algo que me destroce por dentro",
    "Quiero salir inspirada",
  ],
  similar: [
    "Algo como Harry Potter",
    "Algo como Interstellar",
    "Algo como La La Land",
    "Algo como Dune",
    "Algo como Puñales por la espalda",
    "Algo como The Bear",
    "Algo como Fleabag",
    "Algo como Severance",
    "Algo como Shrek",
    "Algo como Todo a la vez en todas partes",
    "Algo como El viaje de Chihiro",
    "Algo como The Office",
    "Algo como Succession",
    "Algo como Las chicas Gilmore",
    "Algo como El castillo ambulante",
  ],
  trope: [
    "De enemigos a amantes",
    "De amigos a algo más",
    "Solo queda una cama",
    "Una pareja que finge salir",
    "Un amor que va muy poco a poco",
    "Una segunda oportunidad",
    "Una familia elegida",
    "El gruñón y la alegre",
    "Los polos opuestos se atraen",
    "Un amor prohibido",
    "Un triángulo amoroso complicado",
    "Un matrimonio de conveniencia",
    "Almas gemelas que se encuentran",
    "Personajes moralmente ambiguos",
    "Un antihéroe inolvidable",
    "Una protagonista con carácter",
    "Un bucle temporal",
    "Viajes en el tiempo que descolocan",
    "Caos de universos paralelos",
    "Una historia de crecer de golpe",
    "Un viaje por carretera inolvidable",
    "Un misterio de quién lo hizo",
    "Un narrador poco fiable",
    "Un atraco que sale mal",
    "Encanto de pueblo pequeño",
  ],
  situation: [
    "Algo para una primera cita",
    "Noche de peli con amigas",
    "Algo para ver con mis padres",
    "Una peli que guste a toda la familia",
    "Algo para un domingo de lluvia",
    "Una peli tranquila antes de dormir",
    "Un maratón de madrugada",
    "Algo para una tarde de vaguear",
    "Una peli para un vuelo largo",
    "Una serie para ventilarme el finde",
    "La peli perfecta para ver sola",
    "Algo que le guste a todo el mundo",
    "Una peli para una noche tranquila",
    "Algo fácil para un domingo",
    "Algo reconfortante al salir de trabajar",
  ],
  vibe: [
    "Rollo otoño y manta",
    "Un romance de verano perfecto",
    "Una peli de invierno para acurrucarse",
    "Estética dark academia",
    "Rollo cottagecore",
    "Energía de protagonista",
    "Una peli para desconectar el cerebro",
    "Fotografía de ensueño",
    "Ciudad de noche y neones",
    "Serotonina pura",
    "Imágenes preciosas",
    "Una banda sonora inolvidable",
    "Cine con mayúsculas",
    "Cero pensamientos, solo vibras",
    "Algo rodado con mucho gusto",
  ],
  genre: [
    "Ciencia ficción que descoloque",
    "Un thriller psicológico",
    "Una comedia inteligente",
    "Una aventura épica de fantasía",
    "Una comedia romántica",
    "Un misterio con asesinato",
    "Un drama criminal que enganche",
    "Una obra maestra de animación",
    "Una de terror para esta noche",
    "Una aventura de acción sin tregua",
    "Un documental infravalorado",
    "Una aventura fantástica",
    "Un drama de juicios",
    "Una aventura espacial",
    "Una de apocalipsis zombi",
  ],
  wildcard: [
    "Algo que merezca el hype",
    "Una joya escondida",
    "Una interpretación de Óscar",
    "Una película de culto",
    "Una peli que no olvidaré",
    "El primer episodio perfecto",
    "Solo un episodio más",
    "¿Qué acabo de ver?",
    "Una peli que se te queda dentro",
    "Algo con rollo A24",
    "Rollo Studio Ghibli",
    "Rollo Christopher Nolan",
    "Estética Wes Anderson",
    "Energía Black Mirror",
    "Algo que me deje tocada",
    "Una peli con un final de locos",
    "Nada de superhéroes esta noche",
    "Sin romance, por favor",
    "Nada de terror esta noche",
    "Algo ligerito para hoy",
  ],
};

function pickRandom<T>(arr: T[], exclude: Set<string>): T | null {
  const pool = arr.filter((v) => !exclude.has(String(v)));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick 4 balanced, non-duplicate suggestion chips.
 * Slots: 1 mood, 1 trope, 1 similar, 1 from {situation, genre, vibe, wildcard}.
 * `exclude` lets the refresh button avoid repeating currently-visible prompts.
 */
export function pickSuggestions(exclude: string[] = [], lang: "en" | "es" = "en"): string[] {
  const BANCO = lang === "es" ? SUGGESTION_PROMPTS_ES : SUGGESTION_PROMPTS;
  const used = new Set(exclude);
  const result: string[] = [];

  const slots: SuggestionCategory[][] = [
    ["mood"],
    ["trope"],
    ["similar"],
    // Last slot rotates across the "flavor" buckets, shuffled each call.
    shuffle(["situation", "genre", "vibe", "wildcard"] as SuggestionCategory[]),
  ];

  const allCats: SuggestionCategory[] = [
    "mood",
    "trope",
    "similar",
    "situation",
    "genre",
    "vibe",
    "wildcard",
  ];

  for (const preferences of slots) {
    let pick: string | null = null;
    for (const cat of preferences) {
      pick = pickRandom(BANCO[cat], used);
      if (pick) break;
    }
    // Fallback: any category with something left.
    if (!pick) {
      for (const cat of shuffle(allCats)) {
        pick = pickRandom(BANCO[cat], used);
        if (pick) break;
      }
    }
    if (pick) {
      result.push(pick);
      used.add(pick);
    }
  }

  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}