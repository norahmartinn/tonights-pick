import type { Recommendation } from "@/lib/recommend.functions";
import { Star, Film, Tv } from "lucide-react";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <article className="bg-card text-card-foreground rounded-3xl elegant-border overflow-hidden shadow-sm animate-fade-in-up">
      <div className="flex items-center px-5 pt-4 pb-3 border-b border-ink/8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-curtain font-bold">
          Tonight's Feature
        </p>
      </div>
      <div className="relative aspect-[2/3] bg-curtain">
        {rec.poster_url ? (
          <img
            src={rec.poster_url}
            alt={`${rec.title} poster`}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-foreground p-6 text-center bg-gradient-to-br from-curtain to-burgundy">
            <Film size={56} className="mb-3 opacity-90" />
            <h2 className="text-3xl font-display leading-tight">{rec.title}</h2>
            {rec.year && <p className="opacity-80 mt-1">{rec.year}</p>}
          </div>
        )}

        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between">
          {rec.media_type ? (
            <span className="bg-card/95 text-card-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full elegant-border-sm inline-flex items-center gap-1">
              {rec.media_type === "tv" ? <Tv size={11} /> : <Film size={11} />}
              {rec.media_type === "tv" ? "TV show" : "Movie"}
            </span>
          ) : (
            <span />
          )}
          {rec.platform && (
            <span className="bg-primary/95 text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full elegant-border-sm truncate max-w-[140px]">
              {rec.platform}
            </span>
          )}
        </div>

        {rec.rating && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-card/95 text-card-foreground text-xs font-bold px-2.5 py-1 rounded-full elegant-border-sm inline-flex items-center gap-1">
              <Star size={12} fill="currentColor" className="text-gold" /> {rec.rating}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-[1.65rem] font-display leading-[1.1] text-balance">{rec.title}</h2>
          <p className="text-sm text-muted-foreground font-semibold mt-1.5">
            {rec.genre}
            {rec.year ? ` · ${rec.year}` : ""}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{rec.description}</p>

        <div className="bg-accent/40 text-accent-foreground rounded-2xl p-4 elegant-border-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 text-ink/70">Why tonight</p>
          <p className="text-sm leading-relaxed italic font-display">{rec.reason}</p>
        </div>
      </div>
    </article>
  );
}
