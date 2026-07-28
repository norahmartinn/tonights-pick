import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { AppShell } from "@/components/AppShell";
import { User, Heart, Clock, Calendar, Check, LogOut, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AVATARS, isAvatarUnlocked, type UserProgress } from "@/lib/avatars";
import { AvatarBubble } from "@/components/AvatarBubble";
import mascotWaving from "@/assets/mascot-waving.png";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Tonight" },
      { name: "description", content: "Manage your Tonight profile and see your activity." },
    ],
  }),
  component: ProfilePage,
});

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function ProfilePage() {
  const getFn = useServerFn(getProfile);
  const updFn = useServerFn(updateProfile);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getFn(),
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.display_name ?? "");
      setAvatar(data.profile.avatar_url ?? "");
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { display_name: name.trim(), avatar_url: avatar.trim() } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  return (
    <AppShell>
      <div className="pt-7 pb-6 flex items-start gap-3">
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-[2rem] sm:text-[2.5rem] leading-[1.02] font-display text-balance">
            <span className="italic text-primary">Profile.</span>
          </h1>
        </div>
        <img src={mascotWaving} alt="" width={80} height={80} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 -mt-1" />
      </div>

      {isLoading && <p className="text-muted-foreground py-8 text-center animate-pulse italic">Opening your journal…</p>}

      {!isLoading && data && (
        <div className="space-y-4">
          <div className="bg-card rounded-3xl elegant-border p-5 flex items-center gap-4 shadow-sm">
            <AvatarBubble avatarId={avatar} name={name} size={80} className="border-[3px] border-ink/10" />
            <div className="min-w-0">
              <p className="font-display text-2xl truncate">{name || "No name"}</p>
              {data.email && <p className="text-sm text-muted-foreground truncate">{data.email}</p>}
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Calendar size={12} /> Joined {formatDate(data.profile?.created_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl elegant-border p-4 text-center shadow-sm">
              <Heart className="mx-auto text-curtain" fill="currentColor" size={20} />
              <p className="font-display text-2xl mt-1.5">{data.favoritesCount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">In collection</p>
            </div>
            <div className="bg-card rounded-2xl elegant-border p-4 text-center shadow-sm">
              <Clock className="mx-auto" size={20} />
              <p className="font-display text-2xl mt-1.5">{data.historyCount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Screenings</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              save.mutate();
            }}
            className="mt-2 bg-card rounded-3xl elegant-border p-4 space-y-4 shadow-sm"
          >
            <h2 className="font-display text-xl">Edit profile</h2>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full bg-input elegant-border-sm rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-curtain/30"
                placeholder="Your name"
              />
            </label>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Choose an avatar</span>
              <p className="text-xs text-muted-foreground mt-1.5 italic">One character, many nights. Pick a version of Tonight.</p>
              {(() => {
                const progress: UserProgress = {
                  favorites: data.favoritesCount,
                  recommendations: data.historyCount,
                };
                return (
                  <div className="mt-4">
                    <div className="grid grid-cols-4 gap-3">
                      {AVATARS.map((a) => {
                        const selected = avatar === a.id;
                        const unlocked = isAvatarUnlocked(a, progress) || selected;
                        return (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              if (unlocked) {
                                setAvatar(a.id);
                              } else {
                                toast.info(`${a.label} is locked`, {
                                  description: `Unlock it by completing: ${a.unlockLabel}.`,
                                  duration: 4000,
                                });
                              }
                            }}
                            title={unlocked ? a.label : `${a.label} — ${a.unlockLabel}`}
                            aria-label={unlocked ? a.label : `${a.label}, locked. ${a.unlockLabel}`}
                            aria-pressed={selected}
                            className={`group relative aspect-square rounded-2xl overflow-hidden bg-cream elegant-border-sm transition btn-lift ${
                              selected
                                ? "ring-2 ring-curtain ring-offset-2 ring-offset-card"
                                : unlocked
                                  ? "hover:brightness-105"
                                    : "hover:brightness-100"
                            }`}
                          >
                            <img
                              src={a.src}
                              alt=""
                              loading="lazy"
                              className={`w-full h-full object-contain p-1 transition ${
                                unlocked ? "" : "grayscale opacity-40"
                              }`}
                            />
                            {selected && (
                              <span className="absolute top-1 right-1 bg-curtain text-secondary-foreground rounded-full p-0.5 shadow-sm">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                            {!unlocked && (
                              <span className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
                                <span className="bg-ink/80 text-cream rounded-full p-1.5">
                                  <Lock size={12} strokeWidth={3} />
                                </span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic mt-4">
                      Locked versions unlock as you use Tonight more.
                    </p>
                  </div>
                );
              })()}
            </div>
            <button
              type="submit"
              disabled={save.isPending || !name.trim()}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl elegant-border-sm disabled:opacity-50 hover:brightness-105 btn-glow"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>

          <button
            type="button"
            onClick={signOut}
            className="group w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-destructive/90 hover:text-destructive hover:bg-destructive/5 rounded-2xl transition btn-lift"
          >
            <LogOut size={16} className="btn-icon" /> Sign out
          </button>
        </div>
      )}
    </AppShell>
  );
}
