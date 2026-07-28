import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitFeedback, type Reaction } from "@/lib/feedback.functions";

type Props = {
  historyId: string;
  title: string;
  genre?: string;
  year?: string;
  initialReaction?: Reaction | null;
};

const OPTIONS: { reaction: Reaction; emoji: string; label: string }[] = [
  { reaction: "love_it", emoji: "❤️", label: "Love it" },
  { reaction: "like_it", emoji: "👍", label: "Like it" },
  { reaction: "not_for_me", emoji: "👎", label: "Not for me" },
];

export function FeedbackButtons({ historyId, title, genre, year, initialReaction }: Props) {
  const [reaction, setReaction] = useState<Reaction | null>(initialReaction ?? null);
  const submitFn = useServerFn(submitFeedback);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (r: Reaction) =>
      submitFn({ data: { historyId, title, genre, year, reaction: r } }),
    onSuccess: (_, r) => {
      setReaction(r);
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["tasteStats"] });
    },
    onError: () => toast.error("Couldn't save feedback"),
  });

  return (
    <div className="bg-card rounded-2xl chunky-border-sm p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">
        How does this land?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ reaction: r, emoji, label }) => {
          const active = reaction === r;
          return (
            <button
              key={r}
              onClick={() => mut.mutate(r)}
              disabled={mut.isPending}
              className={`group flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-sm transition chunky-border-sm btn-lift
                ${active
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-foreground"
                }`}
            >
              <span className="text-xl transition-transform duration-200 group-hover:scale-110">{emoji}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
