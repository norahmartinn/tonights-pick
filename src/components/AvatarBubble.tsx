import { getAvatar } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarBubble({
  avatarId,
  name,
  size = 40,
  className,
}: {
  avatarId?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const avatar = getAvatar(avatarId);
  const initial = (name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className={cn(
        "rounded-full bg-primary text-primary-foreground overflow-hidden flex items-center justify-center font-display shrink-0 border-2 border-ink/10",
        className,
      )}
      aria-label={avatar ? avatar.label : initial}
    >
      {avatar ? (
        <img src={avatar.src} alt="" className="w-full h-full object-cover bg-cream" />
      ) : (
        initial
      )}
    </div>
  );
}
