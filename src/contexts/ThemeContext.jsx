import { createContext, useContext, useMemo } from "react";
import { DARK, LIGHT } from "../design/tokens";

const ThemeContext = createContext(DARK);

// Antes el tema se aplicaba mutando un objeto global (`Object.assign(C, ...)`),
// lo que dependía de que cada componente afectado se volviera a renderizar por
// otra razón para "enterarse" del cambio — algunos lo hacían, otros (el sidebar,
// la toolbar) se quedaban pegados en el tema anterior según el orden de render.
// Con Context, React garantiza que TODO componente que consuma useTheme() se
// vuelva a renderizar apenas cambia el valor del Provider. No hay forma de que
// quede una superficie "trabada" en el tema viejo.
export function ThemeProvider({ isDark, children }) {
  const theme = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
