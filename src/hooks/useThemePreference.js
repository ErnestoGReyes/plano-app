import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_THEME_ID } from "../design/tokens";

const LS_MODE = "plano-theme";       // clave ya existente — se mantiene para no perder la preferencia de usuarios actuales
const LS_THEME_ID = "plano-theme-id"; // clave nueva, para la paleta elegida

// Maneja la preferencia de tema completa: el modo día/noche (que ya existía) y
// la paleta elegida (nueva). Siempre se guarda en localStorage primero — así
// funciona sin sesión (landing/login) y offline. Cuando hay sesión activa,
// además:
//   1. Al loguearse, se trae la preferencia guardada en Supabase (si existe) y
//      pisa lo que había en localStorage — el server manda, para que el tema
//      viaje entre dispositivos.
//   2. Cada cambio posterior (elegir otro tema, tocar el sol/luna) se guarda
//      en Supabase con un pequeño debounce, para no golpear la base en cada
//      click si el usuario prueba varios temas seguidos.
export function useThemePreference(session) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(LS_MODE) !== "light"; } catch { return true; }
  });
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem(LS_THEME_ID) || DEFAULT_THEME_ID; } catch { return DEFAULT_THEME_ID; }
  });

  // Para qué usuario ya hicimos la carga inicial desde Supabase — evita volver
  // a pisar la elección del usuario si el componente se re-renderiza de más,
  // y evita guardar de vuelta antes de haber terminado de cargar.
  const loadedForUser = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(LS_MODE, isDark ? "dark" : "light"); } catch {}
  }, [isDark]);
  useEffect(() => {
    try { localStorage.setItem(LS_THEME_ID, themeId); } catch {}
  }, [themeId]);

  // Cargar preferencia guardada en Supabase al iniciar sesión
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || loadedForUser.current === userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("theme_id, is_dark")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      loadedForUser.current = userId;
      if (!error && data) {
        if (data.theme_id) setThemeId(data.theme_id);
        if (typeof data.is_dark === "boolean") setIsDark(data.is_dark);
      }
      // Si no hay fila todavía (usuario nuevo) no hacemos nada acá — se crea
      // sola la primera vez que cambie algo, vía el efecto de guardado de abajo.
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Guardar en Supabase cuando cambia (con debounce), solo si ya terminamos de
  // cargar la preferencia inicial de ESTE usuario — si no, guardaríamos el
  // valor por defecto pisando lo que la persona ya tenía guardado, en la
  // fracción de segundo antes de que llegue la respuesta de carga.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || loadedForUser.current !== userId) return;
    const timer = setTimeout(() => {
      supabase.from("user_preferences")
        .upsert(
          { user_id: userId, theme_id: themeId, is_dark: isDark, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        .then(({ error }) => {
          if (error) console.error("No se pudo guardar la preferencia de tema:", error);
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [themeId, isDark, session?.user?.id]);

  const toggleTheme = useCallback(() => setIsDark(v => !v), []);

  return { isDark, setIsDark, themeId, setThemeId, toggleTheme };
}
