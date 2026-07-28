import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTasteStats, getCharacterTwin } from "@/lib/feedback.functions";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { BarChart2, Wand2, Sparkles } from "lucide-react";
import mascotExcited from "@/assets/mascot-excited.png";

export const Route = createFileRoute("/_authenticated/taste")({
  head: () => ({
    meta: [
      { title: "Your taste profile — Tonight" },
      { name: "description", content: "See what Tonight has learned about your viewing taste." },
    ],
  }),
  component: TastePage,
});

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl elegant-border p-4 flex flex-col shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{label}</p>
      <p className="text-4xl font-display leading-none mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm font-semibold">
        <span className="truncate pr-4">{label}</span>
        <span className="text-muted-foreground shrink-0">{count}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden elegant-border-sm">
        <div
          className="h-full gradient-bar rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TastePage() {
  const getStatsFn = useServerFn(getTasteStats);
  const getTwinFn = useServerFn(getCharacterTwin);
  const { data, isLoading } = useQuery({
    queryKey: ["tasteStats"],
    queryFn: () => getStatsFn(),
  });
  const { data: twin, isLoading: twinLoading } = useQuery({
    queryKey: ["characterTwin"],
    queryFn: () => getTwinFn(),
    staleTime: 5 * 60_000,
  });

  const isEmpty =
    !isLoading &&
    data &&
    data.feedbackCounts.total === 0 &&
    data.topGenres.length === 0;

  return (
    <AppShell width="wide">
      <div className="pt-7 pb-6 flex items-center gap-[0.3em] text-[2rem] sm:text-[2.75rem]">
        <h1 className="text-[1em] leading-[1.02] font-display text-balance min-w-0">
          Your <span className="italic text-primary">taste.</span>
        </h1>
        <img src={mascotExcited} alt="" width={112} height={112} loading="lazy" className="h-[1.75em] w-auto shrink-0" />
      </div>

      {isLoading && (
        <div className="space-y-3 mt-2 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
          </div>
          <div className="h-40 bg-muted rounded-2xl" />
        </div>
      )}

      {isEmpty && (
        <EmptyState
          mascotSrc={mascotExcited}
          title="The notebook is still blank."
          subtitle="Rate a screening or two and the projectionist will start keeping notes."
          action={{ to: "/", label: "Book tonight's screening" }}
        />
      )}

      {data && !isEmpty && (
        <div className="mt-2 space-y-5 lg:space-y-0 lg:columns-2 lg:gap-5 [&>*]:lg:mb-5 [&>*]:lg:break-inside-avoid">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Match accuracy"
              value={`${data.accuracy}%`}
              sub={`${data.feedbackCounts.total} ratings`}
            />
            <StatCard
              label="Loved"
              value={data.feedbackCounts.love_it}
              sub={`${data.feedbackCounts.like_it} liked · ${data.feedbackCounts.not_for_me} skipped`}
            />
          </div>

          {data.feedbackCounts.total > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Your reactions
              </p>
              <div className="flex gap-2">
                {[
                  { icon: <span className="text-xl">❤️</span>, label: "Love it", count: data.feedbackCounts.love_it },
                  { icon: <span className="text-xl">👍</span>, label: "Like it", count: data.feedbackCounts.like_it },
                  { icon: <span className="text-xl">👎</span>, label: "Not for me", count: data.feedbackCounts.not_for_me },
                ].map(({ icon, label, count }) => (
                  <div
                    key={label}
                    className="flex-1 bg-background rounded-xl elegant-border-sm p-3 flex flex-col items-center gap-1"
                  >
                    {icon}
                    <p className="text-2xl font-display leading-none">{count}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider text-center leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.topGenres.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Favorite genres
              </p>
              <div className="space-y-3">
                {data.topGenres.slice(0, 5).map(({ genre, count }) => (
                  <BarRow
                    key={genre}
                    label={genre}
                    count={count}
                    max={data.topGenres[0].count}
                  />
                ))}
              </div>
            </div>
          )}

          {data.releasePeriods.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Preferred era
              </p>
              <div className="space-y-3">
                {data.releasePeriods.slice(0, 5).map(({ period, count }) => (
                  <BarRow
                    key={period}
                    label={period}
                    count={count}
                    max={data.releasePeriods[0].count}
                  />
                ))}
              </div>
            </div>
          )}

          {data.mostLiked.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Most liked picks
              </p>
              <ul className="space-y-2">
                {data.mostLiked.slice(0, 5).map(({ title, genre, reaction }) => (
                  <li
                    key={title}
                    className="flex items-center gap-3 bg-background rounded-xl elegant-border-sm px-3 py-2.5"
                  >
                    <span className="text-xl shrink-0">{reaction === "love_it" ? "❤️" : "👍"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{title}</p>
                      {genre && (
                        <p className="text-xs text-muted-foreground truncate">{genre}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-secondary text-secondary-foreground rounded-2xl elegant-border p-5 space-y-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
              <Wand2 size={14} /> Your character twin
            </p>
            {twinLoading && <p className="text-sm opacity-80 italic">Leafing through the archive…</p>}
            {!twinLoading && !twin && (
              <p className="text-sm opacity-80">Rate a few more screenings and this page will fill in.</p>
            )}
            {twin && (
              <>
                <p className="text-3xl font-display leading-tight">{twin.name}</p>
                {twin.source && <p className="text-sm font-semibold opacity-80">from {twin.source}</p>}
                {twin.why && <p className="text-sm mt-1 leading-snug">{twin.why}</p>}

                {twin.shared.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-current/15 space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">
                      They'd watch these with you
                    </p>
                    {twin.shared.map((s) => (
                      <div key={s.title}>
                        <p className="text-sm font-display font-semibold">{s.title}</p>
                        <p className="text-sm opacity-80 leading-snug">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {data.topMoods.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Preferred moods
              </p>
              <div className="flex flex-wrap gap-2">
                {data.topMoods.slice(0, 8).map(({ mood, count }) => (
                  <span
                    key={mood}
                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground elegant-border-sm text-sm font-semibold capitalize"
                  >
                    {mood} <span className="opacity-70">· {count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.topDirectors.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Favorite directors
              </p>
              <ul className="space-y-1.5">
                {data.topDirectors.slice(0, 5).map(({ name, count }) => (
                  <li key={name} className="flex justify-between text-sm font-semibold">
                    <span>{name}</span>
                    <span className="text-muted-foreground">×{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.topActors.length > 0 && (
            <div className="bg-card rounded-2xl elegant-border p-4 space-y-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                Favorite actors
              </p>
              <div className="flex flex-wrap gap-2">
                {data.topActors.slice(0, 8).map(({ name, count }) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 rounded-full bg-background elegant-border-sm text-sm font-semibold"
                  >
                    {name} <span className="text-muted-foreground">· {count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
