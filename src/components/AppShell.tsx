import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Sparkles, Clock, BarChart2, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { getProfile } from "@/lib/profile.functions";
import { AvatarBubble } from "@/components/AvatarBubble";
import { useTheme } from "@/hooks/use-theme";

const NAV = [
  { to: "/", label: "Home", Icon: Sparkles },
  { to: "/favorites", label: "Favorites", Icon: Heart },
  { to: "/history", label: "History", Icon: Clock },
  { to: "/taste", label: "Taste", Icon: BarChart2 },
];

/**
 * Ancho del contenido. `focus` es la columna estrecha para leer o decidir una
 * sola cosa (pedir la recomendación, editar el perfil); `wide` es para las
 * pantallas que son listas y en escritorio pueden ir en rejilla.
 * La cabecera mantiene siempre el ancho grande para que el logo no salte
 * de sitio al navegar entre secciones.
 */
type Width = "focus" | "feature" | "wide";
const MAIN_WIDTH: Record<Width, string> = {
  focus: "max-w-lg",
  feature: "max-w-3xl",
  wide: "max-w-5xl",
};

export function AppShell({
  children,
  width = "focus",
}: {
  children: ReactNode;
  width?: Width;
}) {
  const queryClient = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const avatarId = data?.profile?.avatar_url;
  const name = data?.profile?.display_name;
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 backdrop-blur bg-background/85 border-b border-ink/8">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display tracking-tight pressable">
            Tonight<span className="text-curtain">.</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors btn-lift"
                activeProps={{ className: "group p-2.5 rounded-2xl bg-muted text-primary btn-lift" }}
                activeOptions={{ exact: true }}
                aria-label={label}
                title={label}
              >
                <Icon size={18} strokeWidth={2.5} className="btn-icon" />
              </Link>
            ))}
            <button
              type="button"
              onClick={toggle}
              className="group p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors btn-lift"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to night mode"}
              title={theme === "dark" ? "Light mode" : "Night mode"}
            >
              {theme === "dark" ? <Sun size={18} strokeWidth={2.5} className="btn-icon" /> : <Moon size={18} strokeWidth={2.5} className="btn-icon" />}
            </button>
            <Link
              to="/profile"
              className="p-1.5 rounded-full hover:bg-muted/70 transition-colors ml-0.5 btn-lift"
              activeProps={{ className: "p-1.5 rounded-full bg-muted ring-2 ring-ink/10 btn-lift" }}
              aria-label="Profile"
              title="Profile"
            >
              <AvatarBubble avatarId={avatarId} name={name} size={28} />
            </Link>
          </nav>
        </div>
      </header>
      <main className={`${MAIN_WIDTH[width]} mx-auto px-5 pb-16`}>{children}</main>
    </div>
  );
}
