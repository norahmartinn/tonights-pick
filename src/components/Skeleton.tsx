import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-muted/60 animate-skeleton", className)} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 mt-2 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-card/60 rounded-2xl elegant-border-sm p-3 flex gap-4 items-start">
          <Skeleton className="w-20 h-[7.5rem] rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 pt-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
