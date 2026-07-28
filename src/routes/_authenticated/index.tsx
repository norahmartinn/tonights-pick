import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Heart, RefreshCw, Film, Tv, Shuffle, Dice5 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecommendationCard } from "@/components/RecommendationCard";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { ProjectorLoader } from "@/components/ProjectorLoader";
import { recommend, type Recommendation } from "@/lib/recommend.functions";
import { saveFavorite } from "@/lib/favorites.functions";
import mascotHappy from "@/assets/mascot-happy.png";
import mascotThinking from "@/assets/mascot-thinking.png";
import mascotHeroCool from "@/assets/mascot-hero-cool.png";
import { pickSuggestions } from "@/lib/suggestions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tonight — what should I watch?" },
      { name: "description", content: "Tell Tonight your mood and get one perfect movie or show pick." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [shown, setShown] = useState<string[]>([]);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [kind, setKind] = useState<"any" | "movie" | "tv">("any");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestKey, setSuggestKey] = useState(0);

  useEffect(() => {
    setSuggestions(pickSuggestions());
  }, []);

  function refreshSuggestions() {
    setSuggestions((prev) => pickSuggestions(prev));
    setSuggestKey((k) => k + 1);
  }

  const recommendFn = useServerFn(recommend);
  const saveFn = useServerFn(saveFavorite);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: (p: { prompt: string; exclude: string[]; kind: "any" | "movie" | "tv" }) =>
      recommendFn({ data: p }),
    onSuccess: (r) => {
      setRec(r);
      setShown((prev) => [...prev, r.title]);
      setSavedTitle(null);
      qc.invalidateQueries({ queryKey: ["history"] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Try again"),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!rec) throw new Error("No pick");
      return saveFn({
        data: {
          title: rec.title,
          genre: rec.genre,
          platform: rec.platform,
          rating: rec.rating,
          description: rec.description,
          reason: rec.reason,
          poster_url: rec.poster_url ?? "",
          prompt,
        },
      });
    },
    onSuccess: () => {
      setSavedTitle(rec?.title ?? null);
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Saved to favorites");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  function submit(value: string) {
    const p = value.trim();
    if (!p) return;
    setPrompt(p);
    m.mutate({ prompt: p, exclude: shown, kind });
  }

  function another() {
    if (!prompt) return;
    m.mutate({ prompt, exclude: shown, kind });
  }

  return (
    <AppShell width="feature">
      <ProjectorLoader open={m.isPending} />
      <section className="pt-7 pb-8">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-[2rem] sm:text-[2.5rem] leading-[1.25] font-display text-balance">
              What are you in the{" "}
              <span className="italic bg-primary text-primary-foreground box-decoration-clone px-0">mood for?</span>
            </h1>
          </div>
          <img
            src={m.isPending ? mascotThinking : mascotHeroCool}
            alt=""
            width={512}
            height={512}
            className={`w-28 h-28 sm:w-36 sm:h-36 shrink-0 -my-2 -mr-2 object-contain transition-transform ${
              m.isPending ? "animate-pulse" : "hover:-rotate-3"
            }`}
          />
        </div>

        {rec ? (
          <div className="space-y-5 animate-fade-in-up">
            <section className="space-y-4">
              <div className="flex items-center gap-3 pt-2">
                <span className="h-px flex-1 bg-ink/15" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-curtain font-bold">
                  Now Showing
                </p>
                <span className="h-px flex-1 bg-ink/15" />
              </div>
              <RecommendationCard rec={rec} />

              {rec.history_id && (
                <FeedbackButtons
                  historyId={rec.history_id}
                  title={rec.title}
                  genre={rec.genre}
                  year={rec.year}
                />
              )}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || savedTitle === rec.title}
                  className="group bg-card text-card-foreground font-bold py-3 sm:py-3.5 px-3 rounded-full elegant-border-sm flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap disabled:opacity-60 hover:bg-muted btn-lift"
                >
                  <Heart size={16} fill={savedTitle === rec.title ? "currentColor" : "none"} className="btn-icon shrink-0" />
                  <span className="truncate">{savedTitle === rec.title ? "In collection" : "Save"}</span>
                </button>
                <button
                  onClick={another}
                  disabled={m.isPending}
                  className="group bg-secondary text-secondary-foreground font-bold py-3 sm:py-3.5 px-3 rounded-full elegant-border-sm flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap disabled:opacity-50 hover:brightness-105 btn-lift"
                >
                  <RefreshCw size={16} className={`btn-icon shrink-0 ${m.isPending ? "animate-spin" : ""}`} />
                  <span className="truncate">Another one</span>
                </button>
              </div>
            </section>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(prompt);
              }}
              className="bg-card rounded-3xl elegant-border p-2.5 shadow-sm"
            >
              <p className="px-3.5 pt-2 pb-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Ask for something else
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Something darker, a documentary, a show like this but funnier…"
                rows={2}
                maxLength={280}
                className="w-full bg-transparent resize-none px-3.5 py-2 text-base placeholder:text-muted-foreground/80 focus:outline-none"
              />
              <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                {([
                  { k: "any", label: "Any", Icon: Shuffle },
                  { k: "movie", label: "Movie", Icon: Film },
                  { k: "tv", label: "TV show", Icon: Tv },
                ] as const).map(({ k, label, Icon }) => {
                  const active = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`group flex items-center justify-center gap-1.5 py-3 sm:py-2 rounded-xl text-sm font-bold elegant-border-sm transition-all btn-lift ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted text-foreground"
                      }`}
                      aria-pressed={active}
                    >
                      <Icon size={14} strokeWidth={2.5} className="btn-icon" /> {label}
                    </button>
                  );
                })}
              </div>
              <button
                type="submit"
                disabled={m.isPending || !prompt.trim()}
                className="group w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl elegant-border-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-105 btn-glow"
              >
                {m.isPending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Preparing your screening…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="btn-icon" /> Screen something for me
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(prompt);
              }}
              className="mt-2"
            >
              <div className="bg-card rounded-3xl elegant-border p-2.5 shadow-sm">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A feel-good movie for a rainy Sunday, a smart comedy, something like Harry Potter…"
                  rows={3}
                  maxLength={280}
                  className="w-full bg-transparent resize-none px-3.5 py-3 text-base placeholder:text-muted-foreground/80 focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                  {([
                    { k: "any", label: "Any", Icon: Shuffle },
                    { k: "movie", label: "Movie", Icon: Film },
                    { k: "tv", label: "TV show", Icon: Tv },
                  ] as const).map(({ k, label, Icon }) => {
                    const active = kind === k;
                    return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`group flex items-center justify-center gap-1.5 py-3 sm:py-2.5 rounded-xl text-sm font-bold elegant-border-sm transition-all btn-lift ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted text-foreground"
                      }`}
                      aria-pressed={active}
                    >
                      <Icon size={14} strokeWidth={2.5} className="btn-icon" /> {label}
                    </button>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={m.isPending || !prompt.trim()}
                  className="group w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl elegant-border-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-105 btn-glow"
                >
                  {m.isPending ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Preparing your screening…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="btn-icon" /> Screen something for me
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                  Try one of these
                </p>
                <button
                  type="button"
                  onClick={refreshSuggestions}
                  className="group p-3 sm:p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition btn-lift"
                  aria-label="Shuffle the notes"
                  title="A different set of notes"
                >
                  <Dice5 size={18} className="btn-icon" />
                </button>
              </div>
              <div key={suggestKey} className="flex flex-col gap-2">
                {suggestions.map((ex, i) => (
                  <button
                    key={`${suggestKey}-${ex}`}
                    type="button"
                    onClick={() => submit(ex)}
                    style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
                    className="text-left bg-card elegant-border-sm rounded-2xl px-4 py-3.5 font-semibold hover:bg-primary hover:text-primary-foreground transition animate-fade-in btn-lift"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
