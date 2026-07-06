// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE BLOQUE
// ═══════════════════════════════════════════════════════════════════════════════

export const T = {
  SCENE: "scene_heading",
  ACTION: "action",
  CHARACTER: "character",
  PAREN: "parenthetical",
  DIALOGUE: "dialogue",
  TRANSITION: "transition",
};

// Paleta de personajes — antes eran 10 tonos dorado/marrón muy parecidos entre
// sí (misma familia de color, solo cambiaba el brillo), lo que hacía difícil
// distinguir personajes a simple vista. Ahora son 10 matices bien separados en
// la rueda de color (dorado, rojo, verde, violeta, naranja, azul, verde-azulado,
// magenta, cian, oliva), con la misma saturación/luminosidad que el resto de la
// paleta noir para que no rompan la estética. Igual que accent/green/purple/
// red/yellow más abajo, hay una versión clara (fondo oscuro) y una oscura y
// saturada (fondo claro) para mantener buen contraste en los dos temas.
export const CHARACTER_PALETTE_DARK = [
  "#C0A060", // dorado
  "#D67070", // rojo
  "#7CAE6E", // verde
  "#A88CB0", // violeta
  "#D08850", // naranja
  "#7A96D0", // azul
  "#5FA8A0", // verde azulado
  "#C87CA8", // magenta
  "#6FC0D0", // cian
  "#A8A050", // oliva
];
export const CHARACTER_PALETTE_LIGHT = [
  "#8B6820", // dorado
  "#803030", // rojo
  "#4A6830", // verde
  "#604858", // violeta
  "#8A5020", // naranja
  "#3C5080", // azul
  "#2C6058", // verde azulado
  "#78355C", // magenta
  "#2C6878", // cian
  "#6B6020", // oliva
];

export const RADIUS = { xs:4, sm:8, md:12, lg:16, pill:20 };

// Escala tipográfica — usar estos valores en vez de números sueltos (8.5, 9, 11, 13...)
// para que el tamaño de cada texto responda a una jerarquía consistente en toda la app.
export const FONT_SIZE = {
  xs: 10,      // labels de nav, badges de tipo de bloque
  sm: 11,      // metadata, contadores, tooltips
  base: 13,    // texto de UI por defecto (botones, items de lista)
  md: 14,      // cuerpo de párrafo, texto de bloque de guion
  lg: 17,      // títulos de tarjeta / nombre de proyecto en toolbar
  xl: 24,      // títulos de modal / sección
  display: 40, // headlines grandes (landing, estados vacíos)
};

// Sombras con tinte cálido (marrón oscuro) en vez de negro puro — sobre un fondo
// ya casi negro, una sombra 100% negra no se distingue; el tinte da sensación de
// profundidad ambiental en vez de "hueco".
export const shadowLayer = (a1, a2, tint = "18,12,4") =>
  `0 1px 2px rgba(${tint},${a1}), 0 6px 16px rgba(${tint},${a2})`;
export const SHADOW = {
  card:  () => shadowLayer(0.32, 0.22),
  raised:() => shadowLayer(0.36, 0.28),
  modal: (base) => `0 24px 60px ${base}`,
};
export const FONT_DISPLAY = "'Cormorant Garamond',serif";

// ── NOIR OSCURO — negro total, dorado ────────────────────────────────────────
export const DARK = {
  bgApp:        "#0A0909",
  bgSidebar:    "#070706",
  bgEditor:     "#0D0B0A",
  bgPanel:      "#0A0909",
  bgCard:       "#241E14",   // antes #141210 — ahora se distingue del fondo
  bgCardHover:  "#342B1D",   // antes #1C1916
  bgActive:     "#453927",   // antes #1E1A14 (era igual a "border")
  border:       "#554630",   // antes #1E1A14 — ya no coincide con bgActive
  borderBright: "#7C6646",   // antes #2A2520 — ahora visible como borde real
  accent:       "#C0A060",   // dorado
  accentGlow:   "rgba(192,160,96,0.12)",
  accentWarm:   "#D4B870",   // dorado claro
  green:        "#8AAE6E",   // verde oliva, aclarado para contraste
  purple:       "#A88CB0",   // violeta apagado, aclarado para contraste
  yellow:       "#D4B060",   // ámbar
  red:          "#D67070",   // antes #A04040 (contraste 3.13 → ahora 6.07)
  textPrimary:  "#E8E0D0",   // crema cálido
  textSec:      "#A69C8B",   // antes #8A8070, un poco más claro
  textMuted:    "#7F7563",   // antes #4A4438 (contraste 2.06 → ahora 4.38)
  textFaint:    "#4A4438",   // antes #252018 (contraste 1.23 → ahora 2.06)
  white:        "#F0E8D8",
  shadow:       "rgba(18,12,4,0.88)",   // tinte cálido, no negro puro
};

// ── NOIR DÍA — papel, tinta, dorado oscuro ───────────────────────────────────
export const LIGHT = {
  bgApp:        "#F2EDE4",   // papel envejecido
  bgSidebar:    "#EBE4D8",
  bgEditor:     "#F8F4EC",   // página en blanco cálida
  bgPanel:      "#EDE6DA",
  bgCard:       "#FAF8F4",   // antes #F8F4EC — casi blanca, "hoja elevada"
  bgCardHover:  "#F5F1E8",
  bgActive:     "#DCD3BC",   // antes #EDE0C8 (contraste 1.12 → 1.28)
  border:       "#C8B893",   // antes #D8CEB8 (contraste 1.34 → 1.68)
  borderBright: "#947F4C",   // antes #C4B898 (contraste 1.69 → 3.34)
  accent:       "#8B6820",   // dorado oscuro sobre claro
  accentGlow:   "rgba(139,104,32,0.10)",
  accentWarm:   "#A07828",
  green:        "#4A6830",
  purple:       "#604858",
  yellow:       "#987020",
  red:          "#803030",
  textPrimary:  "#1A1510",   // tinta casi negra
  textSec:      "#4A4030",   // tinta media
  textMuted:    "#8A7860",   // tinta suave
  textFaint:    "#C8B898",   // muy suave
  white:        "#F8F4EC",
  shadow:       "rgba(60,45,20,0.18)",  // tinte cálido, no negro puro
};

// El tema ya no vive en un objeto mutable acá. Los componentes leen el tema
// activo (DARK o LIGHT) a través de useTheme(), definido en
// ../contexts/ThemeContext.jsx, que envuelve la app con un <ThemeProvider>.
// Esto garantiza que TODO componente que lo consuma se vuelva a renderizar
// en el instante en que cambia el tema — sin depender de mutar un objeto
// compartido y esperar que algo más dispare un re-render.

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
