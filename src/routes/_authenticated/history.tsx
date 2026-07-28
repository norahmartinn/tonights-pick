import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHistory, deleteHistory } from "@/lib/history.functions";
import { listFeedback, submitFeedback, type Reaction } from "@/lib/feedback.functions";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { Clock, Film, Trash2 } from "lucide-react";
import { toast } from "sonner";
import mascotSleepy from "@/assets/mascot-sleepy.png";
import mascotSad from "@/assets/mascot-sad.png";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Your history — Tonight" },
      { name: "description", content: "Every recommendation Tonight has made for you." },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const REACTIONS: { reaction: Reaction; emoji: string; label: string }[] = [
  { reaction: "love_it", emoji: "❤️", label: "Love it" },
  { reaction: "like_it", emoji: "👍", label: "Like it" },
  { reaction: "not_for_me", emoji: "👎", label: "Not for me" },
];

function HistoryPage() {
  const listFn = useServerFn(listHistory);
  const delFn = useServerFn(deleteHistory);
  const listFeedbackFn = useServerFn(listFeedback);
  const submitFn = useServerFn(submitFeedback);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => listFn(),
  });

  const { data: feedbackList } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => listFeedbackFn(),
  });

  const feedbackMap = new Map(
    (feedbackList ?? []).map((f) => [f.history_id, f.reaction as Reaction])
  );

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Removed");
    },
  });

  const react = useMutation({
    mutationFn: ({ historyId, title, genre, year, reaction }: { historyId: string; title: string; genre?: string | null; year?: string | null; reaction: Reaction }) =>
      submitFn({ data: { historyId, title, genre: genre ?? undefined, year: year ?? undefined, reaction } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["tasteStats"] });
    },
    onError: () => toast.error("Couldn't save feedback"),
  });

  return (
    <AppShell width="wide">
      <div className="pt-7 pb-6 flex items-start gap-3 max-w-lg">
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-[2rem] sm:text-[2.5rem] leading-[1.02] font-display text-balance">
            <span className="italic text-primary">Archive.</span>
          </h1>
        </div>
        <img src={mascotSleepy} alt="" width={80} height={80} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 -mt-1" />
      </div>

      {isLoading && <ListSkeleton rows={3} />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          mascotSrc={mascotSad}
          title="The archive is quiet."
          subtitle="Once the projector rolls, every screening will be catalogued here."
          action={{ to: "/", label: "Open tonight's screening" }}
        />
      )}

      <ul className="mt-2 grid gap-3 lg:grid-cols-2">
        {data?.map((h) => {
          const currentReaction = feedbackMap.get(h.id) ?? null;
          return (
            <li key={h.id} className="bg-card rounded-2xl elegant-border p-3 flex gap-4 items-start shadow-sm">
              <div className="w-20 h-[7.5rem] rounded-xl bg-curtain text-secondary-foreground flex items-center justify-center shrink-0 overflow-hidden elegant-border-sm">
                {h.poster_url ? (
                  <img src={h.poster_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <h3 className="font-display text-lg leading-tight pr-8 relative">
                  {h.title}
                  <button
                    onClick={() => del.mutate(h.id)}
                    className="group absolute right-0 top-0 p-3 -mt-1.5 -mr-1.5 sm:p-1.5 sm:mt-0 sm:mr-0 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition btn-lift"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} className="btn-icon" />
                  </button>
                </h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  {formatDate(h.created_at)}
                </p>
                {h.prompt && (
                  <p className="text-sm mt-1.5 italic text-muted-foreground line-clamp-1">
                    "{h.prompt}"
                  </p>
                )}
                <div className="inline-flex gap-1 mt-3 bg-background rounded-full p-1 elegant-border-sm">
                  {REACTIONS.map(({ reaction, emoji, label }) => {
                    const active = currentReaction === reaction;
                    return (
                      <button
                        key={reaction}
                        onClick={() =>
                          react.mutate({ historyId: h.id, title: h.title, genre: h.genre, year: h.year, reaction })
                        }
                        title={label}
                        aria-label={label}
                        className={`group text-base px-3.5 py-2.5 sm:px-2.5 sm:py-1 rounded-full transition btn-lift ${
                          active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span className="transition-transform duration-200 group-hover:scale-110 inline-block">{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
