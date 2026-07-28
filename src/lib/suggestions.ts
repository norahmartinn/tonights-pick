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
export function pickSuggestions(exclude: string[] = []): string[] {
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
      pick = pickRandom(SUGGESTION_PROMPTS[cat], used);
      if (pick) break;
    }
    // Fallback: any category with something left.
    if (!pick) {
      for (const cat of shuffle(allCats)) {
        pick = pickRandom(SUGGESTION_PROMPTS[cat], used);
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