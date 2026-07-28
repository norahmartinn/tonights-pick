import { useEffect, useState } from "react";
import { translate, type Key, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "tonight-lang";

function getInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "es" || stored === "en") return stored;
  // Si el navegador está en español, empezamos ahí; si no, inglés.
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

/**
 * Idioma de la interfaz. Mismo patrón que use-theme: se guarda en
 * localStorage y se refleja en el atributo lang del documento, que es lo que
 * usan los lectores de pantalla y el corrector del navegador.
 *
 * Se emite un evento propio para que todos los componentes montados cambien a
 * la vez: sin esto, cada uno mantendría su propio estado y la cabecera se
 * traduciría mientras el contenido no.
 */
export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const inicial = getInitial();
    setLangState(inicial);
    document.documentElement.lang = inicial;

    const alCambiar = (e: Event) => setLangState((e as CustomEvent<Lang>).detail);
    window.addEventListener("tonight-lang-change", alCambiar);
    return () => window.removeEventListener("tonight-lang-change", alCambiar);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    window.dispatchEvent(new CustomEvent("tonight-lang-change", { detail: l }));
  };

  const toggle = () => setLang(lang === "es" ? "en" : "es");
  const t = (key: Key) => translate(lang, key);

  return { lang, setLang, toggle, t };
}
