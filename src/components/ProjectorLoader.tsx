import { useEffect, useMemo, useState } from "react";
import mascotThinking from "@/assets/mascot-thinking.png";

const MESSAGES = [
  "Preparing tonight's screening…",
  "Looking through the archive…",
  "Threading the film reel…",
  "Dimming the house lights…",
  "Warming up the projector…",
  "Choosing tonight's feature…",
  "Almost ready…",
  "Good films deserve a proper introduction.",
  "Cueing the opening frame…",
  "Polishing the projector lens…",
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ProjectorLoader({ open }: { open: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const order = useMemo(() => shuffled(MESSAGES), [open]);

  useEffect(() => {
    if (!open) return;
    setMsgIdx(0);
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % order.length), 2600);
    return () => clearInterval(id);
  }, [open, order.length]);

  // Deterministic-ish dust motes per open cycle
  const motes = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        left: `${8 + (i * 9) % 84}%`,
        top: `${55 + ((i * 13) % 30)}%`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (10 + (i * 7) % 40)}px`,
        dy: `-${40 + (i * 11) % 60}px`,
        delay: `${(i * 350) % 4200}ms`,
        size: 3 + (i % 3),
      })),
    [open]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background/80 backdrop-blur-md animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Preparing tonight's screening"
    >
      <div className="relative bg-card text-card-foreground rounded-3xl elegant-border px-8 pt-10 pb-8 mx-6 max-w-xs w-full flex flex-col items-center text-center overflow-hidden shadow-sm">
        {/* Warm projector glow behind the mascot */}
        <div
          className="absolute inset-x-0 top-6 mx-auto w-56 h-56 rounded-full pointer-events-none beam-glow"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--gold) 55%, transparent) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Slow-turning reel, high up-right */}
        <svg
          viewBox="0 0 200 200"
          className="absolute -top-8 -right-8 w-40 h-40 opacity-[0.08] pointer-events-none"
          style={{ animation: "projector-reel-spin 8s linear infinite" }}
          aria-hidden="true"
        >
          <g fill="currentColor">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="6" />
            <circle cx="100" cy="100" r="14" />
            <circle cx="100" cy="30" r="10" />
            <circle cx="100" cy="170" r="10" />
            <circle cx="30" cy="100" r="10" />
            <circle cx="170" cy="100" r="10" />
            <circle cx="50" cy="50" r="8" />
            <circle cx="150" cy="50" r="8" />
            <circle cx="50" cy="150" r="8" />
            <circle cx="150" cy="150" r="8" />
          </g>
        </svg>

        {/* Dust motes floating up through the light */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {motes.map((m, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-gold/70 dust-mote"
              style={{
                left: m.left,
                top: m.top,
                width: m.size,
                height: m.size,
                animationDelay: m.delay,
                // @ts-expect-error CSS custom props
                "--dx": m.dx,
                "--dy": m.dy,
              }}
            />
          ))}
        </div>

        <img
          src={mascotThinking}
          alt=""
          width={120}
          height={120}
          className="w-28 h-28 relative animate-[projector-mascot-bob_2.4s_ease-in-out_infinite]"
        />

        <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
          Tonight's projectionist
        </p>
        <p
          key={msgIdx}
          className="mt-2 text-lg font-display italic text-foreground animate-fade-in min-h-[3.25rem] leading-snug"
        >
          {order[msgIdx]}
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary projector-dot"
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}