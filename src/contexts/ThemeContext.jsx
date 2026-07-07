import { createContext, useContext, useMemo } from "react";
import { getPalette, DEFAULT_THEME_ID } from "../design/tokens";

const ThemeContext = createContext(null);

// Antes el tema se aplicaba mutando un objeto global (`Object.assign(C, ...)`),
// lo que dependía de que cada componente afectado se volviera a renderizar por
// otra razón para "enterarse" del cambio — algunos lo hacían, otros (el sidebar,
// la toolbar) se quedaban pegados en el tema anterior según el orden de render.
// Con Context, React garantiza que TODO componente que consuma useTheme() se
// vuelva a renderizar apenas cambia el valor del Provider. No hay forma de que
// quede una superficie "trabada" en el tema viejo.
//
// `themeId` es NUEVO: identifica cuál de las paletas del registro THEMES (ver
// design/tokens.js) está activa — "noir", "vintage", "neon", etc. `isDark` sigue
// siendo el interruptor día/noche de siempre. Ambos son ortogonales: cualquier
// combinación de las 7 paletas × 2 modos es válida. Si no se pasa `themeId`
// (código viejo que todavía no lo conoce), se usa el tema por defecto ("noir"),
// así que ningún componente existente se rompe por no pasar la nueva prop.
export function ThemeProvider({ isDark, themeId = DEFAULT_THEME_ID, children }) {
  const theme = useMemo(() => getPalette(themeId, isDark), [themeId, isDark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Fallback defensivo: si por algún motivo se llama fuera de un <ThemeProvider>
  // (no debería pasar en la app real), devolvemos el tema noir oscuro en vez de
  // explotar con `undefined.algunaPropiedad` en cada componente.
  return ctx || getPalette(DEFAULT_THEME_ID, true);
}
