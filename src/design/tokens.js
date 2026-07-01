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

export const CHARACTER_PALETTE = [
  "#C0A060","#A07850","#D4B870","#8B6A40","#E8C880",
  "#B89050","#F0D890","#9A7840","#C8A860","#7A5830",
];

export const RADIUS = { xs:4, sm:8, md:12, lg:16, pill:20 };
export const shadowLayer = (a1,a2) => `0 1px 2px rgba(0,0,0,${a1}), 0 6px 16px rgba(0,0,0,${a2})`;
export const SHADOW = {
  card:  () => shadowLayer(0.28, 0.18),
  raised:() => shadowLayer(0.32, 0.24),
  modal: (base) => `0 24px 60px ${base}`,
};
export const FONT_DISPLAY = "'Cormorant Garamond',serif";

// ── NOIR OSCURO — negro total, dorado ────────────────────────────────────────
export const DARK = {
  bgApp:        "#0A0909",
  bgSidebar:    "#080808",
  bgEditor:     "#0E0D0C",
  bgPanel:      "#0A0909",
  bgCard:       "#141210",
  bgCardHover:  "#1C1916",
  bgActive:     "#1E1A14",
  border:       "#1E1A14",
  borderBright: "#2A2520",
  accent:       "#C0A060",   // dorado
  accentGlow:   "rgba(192,160,96,0.12)",
  accentWarm:   "#D4B870",   // dorado claro
  green:        "#7A9A60",   // verde oliva
  purple:       "#8A7090",   // violeta apagado
  yellow:       "#D4B060",   // ámbar
  red:          "#A04040",   // rojo oscuro
  textPrimary:  "#E8E0D0",   // crema cálido
  textSec:      "#8A8070",   // gris cálido
  textMuted:    "#4A4438",   // muted cálido
  textFaint:    "#252018",   // casi negro cálido
  white:        "#F0E8D8",
  shadow:       "rgba(0,0,0,0.85)",
};

// ── NOIR DÍA — papel, tinta, dorado oscuro ───────────────────────────────────
export const LIGHT = {
  bgApp:        "#F2EDE4",   // papel envejecido
  bgSidebar:    "#EBE4D8",
  bgEditor:     "#F8F4EC",   // página en blanco cálida
  bgPanel:      "#EDE6DA",
  bgCard:       "#F8F4EC",
  bgCardHover:  "#F2EDE4",
  bgActive:     "#EDE0C8",
  border:       "#D8CEB8",
  borderBright: "#C4B898",
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
  shadow:       "rgba(0,0,0,0.15)",
};

// C es un objeto mutable: PlanoApp hace Object.assign(C, isDark ? DARK : LIGHT)
// antes de cada render para que todos los componentes lean el tema activo
// sin tener que pasarlo por props en cada nivel.
export let C = { ...DARK };

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
