import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Sparkles, Clock, BarChart2, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { getProfile } from "@/lib/profile.functions";
import { AvatarBubble } from "@/components/AvatarBubble";
import { useTheme } from "@/hooks/use-theme";
import { useLang } from "@/hooks/use-lang";

const NAV = [
  { to: "/", key: "navHome", Icon: Sparkles },
  { to: "/favorites", key: "navFavorites", Icon: Heart },
  { to: "/history", key: "navHistory", Icon: Clock },
  { to: "/taste", key: "navTaste", Icon: BarChart2 },
] as const;

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
  const { lang, toggle: cambiarIdioma, t } = useLang();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 backdrop-blur bg-background/85 border-b border-ink/8">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display tracking-tight pressable py-1">
            Tonight's pick<span className="text-curtain">.</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {/* En móvil estos cuatro viven en la barra inferior: metidos aquí
                no caben (a 320px la cabecera se desbordaba). */}
            {NAV.map(({ to, key, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group hidden sm:block p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors btn-lift"
                activeProps={{ className: "group hidden sm:block p-2.5 rounded-2xl bg-muted text-primary btn-lift" }}
                activeOptions={{ exact: true }}
                aria-label={t(key)}
                title={t(key)}
              >
                <Icon size={18} strokeWidth={2.5} className="btn-icon" />
              </Link>
            ))}
            {/* Dos letras en vez de una bandera: un idioma no es un país. */}
            <button
              type="button"
              onClick={cambiarIdioma}
              className="group px-2.5 py-3 sm:py-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors btn-lift text-xs font-bold tracking-wide"
              aria-label={lang === "es" ? t("switchToEn") : t("switchToEs")}
              title={lang === "es" ? t("switchToEn") : t("switchToEs")}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              type="button"
              onClick={toggle}
              className="group p-3 sm:p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors btn-lift"
              aria-label={theme === "dark" ? t("toLight") : t("toDark")}
              title={theme === "dark" ? t("toLight") : t("toDark")}
            >
              {theme === "dark" ? <Sun size={18} strokeWidth={2.5} className="btn-icon" /> : <Moon size={18} strokeWidth={2.5} className="btn-icon" />}
            </button>
            <Link
              to="/profile"
              className="p-2 sm:p-1.5 rounded-full hover:bg-muted/70 transition-colors ml-0.5 btn-lift"
              activeProps={{ className: "p-2 sm:p-1.5 rounded-full bg-muted ring-2 ring-ink/10 btn-lift" }}
              aria-label={t("navProfile")}
              title={t("navProfile")}
            >
              <AvatarBubble avatarId={avatarId} name={name} size={28} />
            </Link>
          </nav>
        </div>
      </header>
      {/* pb extra en móvil para que la barra inferior no tape el contenido */}
      <main className={`${MAIN_WIDTH[width]} mx-auto px-5 pb-28 sm:pb-16`}>{children}</main>

      {/* Barra inferior: patrón nativo en móvil y al alcance del pulgar.
          pb-[env(safe-area-inset-bottom)] la separa del indicador del iPhone. */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-20 border-t border-ink/10 bg-background/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Main"
      >
        <div className="flex items-stretch justify-around">
          {NAV.map(({ to, key, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[3.25rem] text-muted-foreground transition-colors"
              activeProps={{ className: "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[3.25rem] text-primary transition-colors" }}
              activeOptions={{ exact: true }}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-semibold tracking-wide">{t(key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
