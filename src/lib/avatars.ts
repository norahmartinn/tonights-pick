import shades from "@/assets/avatars-v3/shades.png";
import headphones from "@/assets/avatars-v3/headphones.png";
import beanieCoffee from "@/assets/avatars-v3/beanie_coffee.png";
import beret from "@/assets/avatars-v3/beret.png";
import hoodie from "@/assets/avatars-v3/hoodie.png";
import reader from "@/assets/avatars-v3/reader.png";
import photographer from "@/assets/avatars-v3/photographer.png";
import runner from "@/assets/avatars-v3/runner.png";
import threeD from "@/assets/avatars-v3/three_d.png";
import skater from "@/assets/avatars-v3/skater.png";
import bowtie from "@/assets/avatars-v3/bowtie.png";
import sleepy from "@/assets/avatars-v3/sleepy.png";

export type AvatarCategory = "default" | "cozy" | "cinema" | "film-lover" | "special";

export type UnlockRule =
  | { type: "default" }
  | { type: "favorites"; count: number }
  | { type: "recommendations"; count: number }
  | { type: "ratings"; count: number }
  | { type: "nights"; count: number }
  | { type: "challenge"; id: string };

export type Avatar = {
  id: string;
  label: string;
  src: string;
  category: AvatarCategory;
  emoji: string;
  unlock: UnlockRule;
  unlockLabel: string;
};

export const AVATARS: Avatar[] = [
  // DEFAULT — unlocked from day one
  { id: "shades", label: "The Regular", src: shades, category: "default", emoji: "🍿",
    unlock: { type: "default" }, unlockLabel: "Available from day one" },

  // CINEMA — earned by watching
  { id: "three_d", label: "3D Night", src: threeD, category: "cinema", emoji: "🥤",
    unlock: { type: "recommendations", count: 10 }, unlockLabel: "Complete 10 screenings" },
  { id: "reader", label: "The Scholar", src: reader, category: "cinema", emoji: "📚",
    unlock: { type: "favorites", count: 10 }, unlockLabel: "Save 10 favorites to your collection" },
  { id: "photographer", label: "The Photographer", src: photographer, category: "cinema", emoji: "📷",
    unlock: { type: "recommendations", count: 50 }, unlockLabel: "Complete 50 screenings" },

  // COZY — earned by returning
  { id: "headphones", label: "Lo-fi Night", src: headphones, category: "cozy", emoji: "🎧",
    unlock: { type: "nights", count: 7 }, unlockLabel: "Use Tonight for 7 nights" },
  { id: "beanie_coffee", label: "Winter Session", src: beanieCoffee, category: "cozy", emoji: "☕",
    unlock: { type: "nights", count: 20 }, unlockLabel: "Use Tonight for 20 nights" },
  { id: "sleepy", label: "Late Show", src: sleepy, category: "cozy", emoji: "😴",
    unlock: { type: "nights", count: 30 }, unlockLabel: "Use Tonight for 30 nights" },
  { id: "hoodie", label: "Midnight Mode", src: hoodie, category: "cozy", emoji: "🌙",
    unlock: { type: "recommendations", count: 25 }, unlockLabel: "Complete 25 screenings" },

  // FILM LOVER — earned by taste
  { id: "beret", label: "The Cinephile", src: beret, category: "film-lover", emoji: "🎭",
    unlock: { type: "ratings", count: 25 }, unlockLabel: "Rate 25 titles" },
  { id: "bowtie", label: "The Critic", src: bowtie, category: "film-lover", emoji: "🎀",
    unlock: { type: "ratings", count: 100 }, unlockLabel: "Rate 100 titles" },

  // SPECIAL — big milestones
  { id: "skater", label: "The Regular Regular", src: skater, category: "special", emoji: "🛹",
    unlock: { type: "recommendations", count: 200 }, unlockLabel: "Complete 200 screenings" },
  { id: "runner", label: "The Marathoner", src: runner, category: "special", emoji: "🏃",
    unlock: { type: "recommendations", count: 500 }, unlockLabel: "Complete 500 screenings" },
];

export const AVATAR_CATEGORIES: { id: AvatarCategory; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "cozy", label: "Cozy" },
  { id: "cinema", label: "Cinema" },
  { id: "film-lover", label: "Film Lover" },
  { id: "special", label: "Special" },
];

export function getAvatar(id?: string | null): Avatar | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id) ?? null;
}

export const AVATAR_IDS = AVATARS.map((a) => a.id);

// Stats consumed by the unlock system. Wire these up when achievements land.
export type UserProgress = {
  favorites?: number;
  recommendations?: number;
  ratings?: number;
  nights?: number;
  completedChallenges?: string[];
};

export function isAvatarUnlocked(avatar: Avatar, p: UserProgress = {}): boolean {
  const r = avatar.unlock;
  switch (r.type) {
    case "default": return true;
    case "favorites": return (p.favorites ?? 0) >= r.count;
    case "recommendations": return (p.recommendations ?? 0) >= r.count;
    case "ratings": return (p.ratings ?? 0) >= r.count;
    case "nights": return (p.nights ?? 0) >= r.count;
    case "challenge": return (p.completedChallenges ?? []).includes(r.id);
  }
}
