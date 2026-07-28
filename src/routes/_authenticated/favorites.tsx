import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFavorites, deleteFavorite } from "@/lib/favorites.functions";
import { AppShell } from "@/components/AppShell";
import { useLang } from "@/hooks/use-lang";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { Trash2, Heart, Film, Star } from "lucide-react";
import { toast } from "sonner";
import mascotExcited from "@/assets/mascot-excited.png";
import mascotSad from "@/assets/mascot-sad.png";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "Your favorites — Tonight" },
      { name: "description", content: "Movies and shows you saved for later on Tonight." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useLang();
  const listFn = useServerFn(listFavorites);
  const delFn = useServerFn(deleteFavorite);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFn(),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(t("removed"));
    },
  });

  return (
    <AppShell width="wide">
      <div className="pt-7 pb-6 flex items-center gap-[0.3em] text-[2rem] sm:text-[2.75rem]">
        <h1 className="text-[1em] leading-[1.02] font-display text-balance min-w-0">
          {t("yourCollection")} <span className="italic text-primary">{t("yourCollectionEm")}</span>
        </h1>
        <img src={mascotExcited} alt="" width={112} height={112} loading="lazy" className="h-[1.75em] w-auto shrink-0" />
      </div>

      {isLoading && <ListSkeleton rows={3} />}

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          mascotSrc={mascotSad}
          title={t("favEmptyTitle")}
          subtitle={t("favEmptySub")}
          action={{ to: "/", label: t("bookScreening") }}
        />
      )}

      <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((f) => (
          <li
            key={f.id}
            className="bg-card rounded-2xl elegant-border p-3 flex gap-4 items-start shadow-sm pressable"
          >
            <div className="w-20 h-[7.5rem] rounded-xl bg-curtain text-secondary-foreground flex items-center justify-center shrink-0 overflow-hidden elegant-border-sm">
              {f.poster_url ? (
                <img src={f.poster_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film size={22} />
              )}
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h3 className="font-display text-lg leading-tight pr-8 relative">
                {f.title}
                <button
                  onClick={() => del.mutate(f.id)}
                  className="group absolute right-0 top-0 p-3 -mt-1.5 -mr-1.5 sm:p-1.5 sm:mt-0 sm:mr-0 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition btn-lift"
                  aria-label={t("remove")}
                >
                  <Trash2 size={16} className="btn-icon" />
                </button>
              </h3>
              <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                {f.genre}
                {f.rating ? ` · ${f.rating}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {f.platform && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full elegant-border-sm">
                    {f.platform}
                  </span>
                )}
                {f.rating && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted inline-flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> {f.rating}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
