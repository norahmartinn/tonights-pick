import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface EmptyStateProps {
  mascotSrc: string;
  title: string;
  subtitle: string;
  action?: { to: string; label: string };
  children?: ReactNode;
}

export function EmptyState({ mascotSrc, title, subtitle, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center pt-4 pb-8 animate-fade-in-up">
      <img src={mascotSrc} alt="" width={144} height={144} loading="lazy" className="w-36 h-36 -mb-2" />
      <h2 className="font-display text-2xl leading-tight max-w-[16ch]">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[26ch]">{subtitle}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full elegant-border-sm btn-glow"
        >
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
