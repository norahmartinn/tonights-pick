import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mascotHero from "@/assets/mascot-hero-cool.png";
import { useLang } from "@/hooks/use-lang";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Tonight" },
      { name: "description", content: "Sign in to Tonight to save your favorite movie picks." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, toggle: cambiarIdioma } = useLang();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const returnTo = safeNext || "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = returnTo;
    });
  }, [returnTo]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + returnTo,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success(t("welcomeToast"));
        window.location.href = returnTo;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        window.location.href = returnTo;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("authFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    // Supabase OAuth nativo. Requiere activar el provider Google en el panel de
    // Supabase (Authentication → Providers). Al tener éxito, Supabase redirige el
    // navegador automáticamente.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + returnTo },
    });
    if (error) {
      toast.error(t("googleFailed"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      {/* Antes de entrar también hay que poder elegir idioma: esta es la
          primera pantalla que ve cualquiera. */}
      <button
        type="button"
        onClick={cambiarIdioma}
        className="absolute top-5 right-5 px-3 py-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors text-xs font-bold tracking-wide btn-lift"
        aria-label={lang === "es" ? t("switchToEn") : t("switchToEs")}
        title={lang === "es" ? t("switchToEn") : t("switchToEs")}
      >
        {lang === "es" ? "EN" : "ES"}
      </button>
      <div className="w-full max-w-md">
        <Link to="/auth" className="block text-center mb-20 sm:mb-24">
          <h1 className="text-[2.5rem] sm:text-5xl font-display tracking-tight text-balance">
            Tonight's pick<span className="text-curtain">.</span>
          </h1>
        </Link>

        <div className="relative">
          <img
            src={mascotHero}
            alt=""
            width={160}
            height={160}
            className="absolute right-6 top-0 -translate-y-[86.3%] h-24 sm:h-28 w-auto pointer-events-none select-none z-10"
          />
        <div className="bg-card text-card-foreground rounded-3xl p-8 elegant-border relative shadow-sm">
          <h2 className="text-2xl font-display mb-1">
            {mode === "signin" ? t("welcomeBack") : t("joinTonight")}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {mode === "signin"
              ? t("signInToSave")
              : t("createToSave")}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-3 bg-card text-foreground py-3 rounded-full elegant-border-sm font-semibold hover:bg-muted transition disabled:opacity-50 pressable"
          >
            <GoogleIcon /> {t("continueGoogle")}
          </button>

          <div className="flex items-center gap-3 my-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <div className="flex-1 h-px bg-border opacity-30" />
            {t("or")}
            <div className="flex-1 h-px bg-border opacity-30" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder={t("yourName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-input text-foreground placeholder:text-muted-foreground/70 elegant-border-sm focus:outline-none focus:ring-2 focus:ring-curtain/30"
              />
            )}
            <input
              type="email"
              required
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-input text-foreground placeholder:text-muted-foreground/70 elegant-border-sm focus:outline-none focus:ring-2 focus:ring-curtain/30"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-input text-foreground placeholder:text-muted-foreground/70 elegant-border-sm focus:outline-none focus:ring-2 focus:ring-curtain/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full elegant-border-sm font-bold text-lg hover:brightness-105 transition disabled:opacity-50 pressable"
            >
              {loading ? "..." : mode === "signin" ? t("signIn") : t("createAccount")}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{mode === "signin" ? t("newHere") : t("alreadyAccount")}</span>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-foreground underline-offset-2 hover:underline py-2.5 px-1"
            >
              {mode === "signin" ? t("createAccount") : t("signIn")}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 11v3.2h5.06c-.22 1.18-1.6 3.46-5.06 3.46-3.05 0-5.54-2.52-5.54-5.66S8.95 6.34 12 6.34c1.74 0 2.9.74 3.56 1.38l2.43-2.34C16.46 3.92 14.43 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.64-3.66 8.64-8.8 0-.6-.07-1.06-.16-1.5H12z"/>
    </svg>
  );
}
