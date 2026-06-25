// ─── PLANO SCREENWRITING — v6 ────────────────────────────────────────────────
// Celtx-inspired · Mobile-first · Undo/Redo · Búsqueda · Modo foco
// Índice de escenas · Notas · Auto-completar · Modo día/noche · Auth Supabase

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE — configuración
// Crear un archivo .env en la raíz del proyecto con:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
// ═══════════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
// ÍCONOS SVG — integrados para mejor coherencia visual
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
  Editor: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  Scenes: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  ),
  Characters: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Notes: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Stats: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Search: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Projects: (props) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Sun: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Focus: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  Undo: (props) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
    </svg>
  ),
  Redo: (props) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
    </svg>
  ),
  Export: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  PDF: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Fountain: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5M5 12l7-7 7 7"/><path d="M8 16s1-1 4-1 4 1 4 1"/>
    </svg>
  ),
  Pen: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
  Trash: (props) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Back: (props) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Plus: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Close: (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Saving: (props) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Help: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const T = {
  SCENE: "scene_heading",
  ACTION: "action",
  CHARACTER: "character",
  PAREN: "parenthetical",
  DIALOGUE: "dialogue",
  TRANSITION: "transition",
};

const CHARACTER_PALETTE = [
  "#60A5FA","#34D399","#FBBF24","#A78BFA","#F87171",
  "#38BDF8","#FB923C","#E879F9","#4ADE80","#F472B6",
];

const DARK = {
  bgApp:        "#12141A",
  bgSidebar:    "#0E1015",
  bgEditor:     "#181A22",
  bgPanel:      "#14161D",
  bgCard:       "#1C1F2B",
  bgCardHover:  "#232640",
  bgActive:     "#252840",
  border:       "#252840",
  borderBright: "#353A55",
  accent:       "#5B8DEF",
  accentGlow:   "rgba(91,141,239,0.15)",
  accentWarm:   "#E8834A",
  green:        "#3FCA8C",
  purple:       "#9B72F0",
  yellow:       "#F5C842",
  red:          "#F06060",
  textPrimary:  "#E4E8F0",
  textSec:      "#8A95B0",
  textMuted:    "#5A6480",
  textFaint:    "#2D3250",
  white:        "#FFFFFF",
  shadow:       "rgba(0,0,0,0.6)",
};

const LIGHT = {
  bgApp:        "#F0F2F7",
  bgSidebar:    "#E8EAF0",
  bgEditor:     "#FAFBFD",
  bgPanel:      "#EDF0F7",
  bgCard:       "#FFFFFF",
  bgCardHover:  "#F5F7FC",
  bgActive:     "#EBF0FD",
  border:       "#DDE1EC",
  borderBright: "#C4CBDE",
  accent:       "#4A7DE8",
  accentGlow:   "rgba(74,125,232,0.12)",
  accentWarm:   "#D4703A",
  green:        "#27A870",
  purple:       "#7C5CC4",
  yellow:       "#D4A80E",
  red:          "#D94F4F",
  textPrimary:  "#1A1F2E",
  textSec:      "#4A5270",
  textMuted:    "#8A92A8",
  textFaint:    "#C0C6D8",
  white:        "#FFFFFF",
  shadow:       "rgba(0,0,0,0.12)",
};

// C es un proxy mutable — se actualiza con setTheme
let C = { ...DARK };

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function nextType(type) {
  return {
    [T.SCENE]:T.ACTION, [T.ACTION]:T.ACTION, [T.CHARACTER]:T.DIALOGUE,
    [T.PAREN]:T.DIALOGUE, [T.DIALOGUE]:T.CHARACTER, [T.TRANSITION]:T.SCENE
  }[type] || T.ACTION;
}

function getPlaceholder(type) {
  return {
    [T.SCENE]:"INT. LUGAR — DÍA", [T.ACTION]:"Descripción de la acción...",
    [T.CHARACTER]:"NOMBRE DEL PERSONAJE", [T.PAREN]:"(emoción o acotación)",
    [T.DIALOGUE]:"Línea de diálogo...", [T.TRANSITION]:"CORTE A:"
  }[type] || "";
}

function typeLabel(type) {
  return { [T.SCENE]:"ESC",[T.ACTION]:"ACC",[T.CHARACTER]:"PER",
           [T.PAREN]:"ACO",[T.DIALOGUE]:"DIA",[T.TRANSITION]:"TRA" }[type] || "?";
}

function typeName(type) {
  return { [T.SCENE]:"Encabezado de escena", [T.ACTION]:"Acción",
           [T.CHARACTER]:"Personaje", [T.PAREN]:"Acotación",
           [T.DIALOGUE]:"Diálogo", [T.TRANSITION]:"Transición" }[type] || "";
}

function typeTooltip(type) {
  return {
    [T.SCENE]:     "Dónde y cuándo ocurre la escena.\nEj: INT. COCINA - DÍA",
    [T.ACTION]:    "Lo que se ve en pantalla: movimiento,\nambiente, descripción física.",
    [T.CHARACTER]: "Nombre del personaje que habla,\nsiempre en mayúsculas.",
    [T.PAREN]:     "Indicación breve sobre cómo se dice\nel diálogo o qué hace el personaje.\nEj: (susurrando)",
    [T.DIALOGUE]:  "Las palabras que dice el personaje.",
    [T.TRANSITION]:"Cambio de escena.\nEj: CORTE A: / FUNDIDO A NEGRO.",
  }[type] || "";
}

function typeColor(type) {
  return { [T.SCENE]:C.accentWarm,[T.ACTION]:C.textSec,[T.CHARACTER]:C.green,
           [T.PAREN]:"#F4A96D",[T.DIALOGUE]:C.accent,[T.TRANSITION]:C.purple }[type] || C.textSec;
}

function extractCharacters(blocks) {
  const map = {}; let ci = 0;
  blocks.forEach(b => {
    if (b.type === T.CHARACTER && b.text.trim()) {
      const n = b.text.trim().toUpperCase();
      if (!map[n]) { map[n] = { color: CHARACTER_PALETTE[ci++ % CHARACTER_PALETTE.length], lines: 0 }; }
      map[n].lines++;
    }
  });
  return map;
}

function extractScenes(blocks) {
  return blocks.map((b,i) => b.type===T.SCENE ? {index:i, id:b.id, text:b.text||"Sin título"} : null).filter(Boolean);
}

function countWords(blocks) {
  return blocks.reduce((a,b) => a + (b.text?.trim().split(/\s+/).filter(Boolean).length||0), 0);
}

function estimatePages(blocks) {
  return Math.max(1, Math.ceil(blocks.reduce((a,b) => a + (b.text?.length||0), 0) / 1500));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE AYUDA — guía de elementos del guion
// ═══════════════════════════════════════════════════════════════════════════════

const GUIDE_ELEMENTS = [
  {
    type: T.SCENE,
    name: "Encabezado de escena",
    color: "#5B8DEF",
    example: "INT. COCINA DE MARIO - DÍA",
    desc: "Indica dónde y cuándo ocurre la escena. Siempre en mayúsculas. Empieza con INT. (interior) o EXT. (exterior), seguido del lugar y el momento del día.",
    tip: "Cada vez que cambia el lugar o el tiempo, es una nueva escena.",
  },
  {
    type: T.ACTION,
    name: "Acción",
    color: "#E4E8F0",
    example: "Mario entra a la cocina y abre la heladera. Encuentra una nota pegada en la puerta.",
    desc: "Describe lo que se ve en pantalla: movimientos, ambientes, objetos importantes, reacciones físicas. Se escribe en presente y en tercera persona.",
    tip: "Sé visual y conciso. Si no se puede filmar, no va acá.",
  },
  {
    type: T.CHARACTER,
    name: "Personaje",
    color: "#3FCA8C",
    example: "MARIO",
    desc: "El nombre del personaje que va a hablar, siempre en mayúsculas y centrado. Puede incluir una aclaración entre paréntesis, como (V.O.) para voz en off o (O.S.) para fuera de campo.",
    tip: "Solo aparece inmediatamente antes del diálogo.",
  },
  {
    type: T.PAREN,
    name: "Acotación",
    color: "#F4A96D",
    example: "(susurrando, sin mirarlo)",
    desc: "Una indicación breve entre paréntesis sobre cómo se dice el diálogo o qué hace el personaje mientras habla. Va entre el nombre del personaje y el diálogo.",
    tip: "Usala con moderación — si el diálogo es bueno, no debería necesitar instrucciones.",
  },
  {
    type: T.DIALOGUE,
    name: "Diálogo",
    color: "#5B8DEF",
    example: "No sé quién dejó esto, pero alguien estuvo acá.",
    desc: "Las palabras exactas que dice el personaje. Va centrado y con márgenes más angostos que la acción, para diferenciarse visualmente en la página.",
    tip: "El diálogo debe sonar natural al leerlo en voz alta.",
  },
  {
    type: T.TRANSITION,
    name: "Transición",
    color: "#9B72F0",
    example: "CORTE A:",
    desc: "Indica cómo se pasa de una escena a la siguiente. Los más comunes son CORTE A:, FUNDIDO A NEGRO., y FUNDIDO DESDE NEGRO. Van alineados a la derecha.",
    tip: "En el cine moderno se usan poco — el corte directo es el default.",
  },
];

function HelpModal({ onClose, isDark }) {
  const [active, setActive] = useState(0);
  const el = GUIDE_ELEMENTS[active];

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:18, width:"100%", maxWidth:580,
        boxShadow:`0 32px 80px ${C.shadow}`,
        display:"flex", flexDirection:"column", maxHeight:"90dvh", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{padding:"22px 24px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:17, color:C.textPrimary}}>
              Guía de elementos
            </div>
            <div style={{fontSize:12, color:C.textMuted, marginTop:3}}>
              Cómo funciona un guion profesional
            </div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", borderRadius:6, display:"flex", marginTop:2}}>
            <Icons.Close/>
          </button>
        </div>

        {/* Tab selector */}
        <div style={{display:"flex", gap:4, padding:"16px 24px 0", overflowX:"auto",
          scrollbarWidth:"none", WebkitOverflowScrolling:"touch"}}>
          {GUIDE_ELEMENTS.map((g, i) => (
            <button key={g.type} onClick={()=>setActive(i)} style={{
              padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer",
              fontSize:11, fontWeight:600, whiteSpace:"nowrap", transition:"all .15s",
              background: active===i ? g.color : C.bgCard,
              color: active===i ? (isDark?"#12141A":"#fff") : C.textMuted,
              fontFamily:"inherit",
            }}>
              {g.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:"20px 24px 24px", overflowY:"auto", flex:1}}>
          {/* Example box */}
          <div style={{
            background:C.bgEditor, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"20px 24px", marginBottom:20,
            fontFamily:"'Courier Prime',monospace", fontSize:13,
          }}>
            <div style={{fontSize:10, fontWeight:600, color:C.textMuted,
              letterSpacing:.8, textTransform:"uppercase", marginBottom:12}}>
              Así se ve en la página
            </div>
            {/* Mini screenplay preview */}
            <div style={{color:C.textMuted, fontSize:12, marginBottom:4}}>INT. LUGAR - DÍA</div>
            <div style={{color:C.textSec, fontSize:12, marginBottom:8}}>Una descripción de la escena.</div>
            {/* Highlighted element */}
            <div style={{
              background:`rgba(${hexToRgb(el.color)},.12)`,
              border:`1.5px solid rgba(${hexToRgb(el.color)},.35)`,
              borderRadius:7, padding:"8px 12px", marginBottom:4,
              color:el.color, fontSize:12, fontWeight:700,
              textAlign: el.type===T.CHARACTER||el.type===T.PAREN||el.type===T.DIALOGUE ? "center" : 
                         el.type===T.TRANSITION ? "right" : "left",
            }}>
              {el.example}
            </div>
            {(el.type===T.CHARACTER) && (
              <div style={{color:C.textSec, fontSize:12, textAlign:"center"}}>El diálogo va acá.</div>
            )}
          </div>

          {/* Description */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:14, fontWeight:600, color:C.textPrimary, marginBottom:8}}>
              {el.name}
            </div>
            <p style={{fontSize:13, color:C.textSec, lineHeight:1.65, margin:0}}>
              {el.desc}
            </p>
          </div>

          {/* Tip */}
          <div style={{
            background:`rgba(${hexToRgb(C.yellow)},.08)`,
            border:`1px solid rgba(${hexToRgb(C.yellow)},.2)`,
            borderRadius:9, padding:"11px 14px",
            display:"flex", gap:10, alignItems:"flex-start",
          }}>
            <span style={{fontSize:14, flexShrink:0}}>💡</span>
            <p style={{fontSize:12, color:C.textSec, lineHeight:1.6, margin:0}}>
              <strong style={{color:C.yellow}}>Consejo: </strong>{el.tip}
            </p>
          </div>

          {/* Navigation */}
          <div style={{display:"flex", justifyContent:"space-between", marginTop:20, gap:8}}>
            <Btn onClick={()=>setActive(v=>Math.max(0,v-1))} disabled={active===0}
              style={{fontSize:12, padding:"7px 14px"}}>
              ← Anterior
            </Btn>
            <span style={{fontSize:11, color:C.textMuted, alignSelf:"center"}}>
              {active+1} / {GUIDE_ELEMENTS.length}
            </span>
            <Btn onClick={()=>setActive(v=>Math.min(GUIDE_ELEMENTS.length-1,v+1))}
              disabled={active===GUIDE_ELEMENTS.length-1}
              variant={active===GUIDE_ELEMENTS.length-1?"outline":"primary"}
              style={{fontSize:12, padding:"7px 14px"}}>
              Siguiente →
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}



function ExportPDFModal({ blocks, projectName, onClose, isDark }) {
  const [format, setFormat]         = useState("hollywood");
  const [author, setAuthor]         = useState("");
  const [sceneNumbers, setSceneNumbers] = useState(false);
  const [generating, setGenerating] = useState(false);

  const inputStyle = {
    width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
    borderRadius:9, padding:"10px 14px", color:C.textPrimary, fontSize:13,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
    transition:"border-color .15s",
  };

  const radioStyle = (active) => ({
    display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px",
    borderRadius:10, border:`1.5px solid ${active ? C.accent : C.borderBright}`,
    background: active ? C.accentGlow : "none",
    cursor:"pointer", transition:"all .15s",
  });

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      exportToPDFPro(blocks, projectName, { format, author, sceneNumbers });
      setGenerating(false);
      onClose();
    }, 100);
  };

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.6)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:16, padding:"28px 24px", width:"100%", maxWidth:420,
        boxShadow:`0 24px 60px ${C.shadow}`,
      }}>
        {/* Header */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:16, color:C.textPrimary}}>
              Exportar PDF
            </div>
            <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>Formato profesional de guion</div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", borderRadius:6, display:"flex"}}>
            <Icons.Close/>
          </button>
        </div>

        {/* Formato */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:10}}>Formato</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <div style={radioStyle(format==="hollywood")} onClick={()=>setFormat("hollywood")}>
              <div style={{width:16, height:16, borderRadius:"50%", border:`2px solid ${format==="hollywood"?C.accent:C.borderBright}`,
                background:format==="hollywood"?C.accent:"none", flexShrink:0, marginTop:1,
                display:"flex", alignItems:"center", justifyContent:"center"}}>
                {format==="hollywood" && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:C.textPrimary}}>Hollywood (estándar)</div>
                <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
                  Página Letter · márgenes WGA · Courier 12pt · personaje a 3.7"
                </div>
              </div>
            </div>
            <div style={radioStyle(format==="european")} onClick={()=>setFormat("european")}>
              <div style={{width:16, height:16, borderRadius:"50%", border:`2px solid ${format==="european"?C.accent:C.borderBright}`,
                background:format==="european"?C.accent:"none", flexShrink:0, marginTop:1,
                display:"flex", alignItems:"center", justifyContent:"center"}}>
                {format==="european" && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:C.textPrimary}}>Europeo / Español</div>
                <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
                  Página A4 · márgenes europeos · etiquetas en español
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autor */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:8}}>Autor / Guionista</div>
          <input
            type="text" value={author} placeholder="Tu nombre"
            onChange={e=>setAuthor(e.target.value)} style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.accent}
            onBlur={e=>e.target.style.borderColor=C.borderBright}
          />
        </div>

        {/* Opciones */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:10}}>Opciones</div>
          <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer"}}>
            <div onClick={()=>setSceneNumbers(v=>!v)} style={{
              width:18, height:18, borderRadius:5, border:`2px solid ${sceneNumbers?C.accent:C.borderBright}`,
              background:sceneNumbers?C.accent:"none", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
            }}>
              {sceneNumbers && <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <div>
              <div style={{fontSize:13, color:C.textPrimary}}>Numeración de escenas</div>
              <div style={{fontSize:11, color:C.textMuted}}>Agrega número al inicio de cada encabezado</div>
            </div>
          </label>
        </div>

        {/* Botón */}
        <button onClick={generate} disabled={generating} style={{
          width:"100%", padding:"13px", borderRadius:10, border:"none",
          background:C.accent, color:"#fff", fontSize:14, fontWeight:600,
          cursor:generating?"wait":"pointer", opacity:generating?.7:1,
          fontFamily:"'Courier Prime',monospace", letterSpacing:.5,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          <Icons.PDF style={{width:15,height:15}}/> {generating ? "Generando…" : "Generar PDF"}
        </button>
      </div>
    </div>
  );
}

function exportToPDFPro(blocks, projectName, { format, author, sceneNumbers }) {
  const isHollywood = format === "hollywood";

  // ── Métricas de página ────────────────────────────────────────────────────
  // Todas las medidas en puntos (1in = 72pt)
  const page = isHollywood
    ? { w:612, h:792, mt:72, mb:72, ml:108, mr:72 }   // Letter, 1.5" left, 1" resto
    : { w:595, h:842, mt:72, mb:72, ml:85,  mr:57  };  // A4, ~1.18" left, ~0.8" right

  const textW = page.w - page.ml - page.mr; // ancho del área de texto

  // ── Posiciones horizontales (en puntos desde margen izquierdo) ────────────
  const pos = isHollywood ? {
    scene:      0,
    action:     0,
    character:  page.ml + 144,  // 3.7" desde borde = ml + 2" desde margen
    paren:      page.ml + 90,   // 2.9" desde borde
    dialogue:   page.ml + 72,   // 2.5" desde borde — ancho máx 3.5"
    transition: page.w - page.mr - 120,
    dialogueW:  252,
    parenW:     216,
  } : {
    scene:      0,
    action:     0,
    character:  page.ml + 100,
    paren:      page.ml + 60,
    dialogue:   page.ml + 50,
    transition: page.w - page.mr - 100,
    dialogueW:  300,
    parenW:     240,
  };

  // ── Helpers de texto ─────────────────────────────────────────────────────
  const CHAR_W = 7.2; // ancho aprox de un char en Courier 12pt
  const wrapText = (text, maxChars) => {
    const words = text.split(" ");
    const lines = []; let line = "";
    for (const w of words) {
      if ((line + w).length <= maxChars) { line += (line ? " " : "") + w; }
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const actionMaxChars  = Math.floor(textW / CHAR_W);
  const dialogueMaxChars = Math.floor(pos.dialogueW / CHAR_W);
  const parenMaxChars   = Math.floor(pos.parenW / CHAR_W);

  // ── Generación de contenido ───────────────────────────────────────────────
  let sceneCount = 0;

  const elements = []; // {type, lines, raw}

  blocks.forEach(b => {
    if (!b.text.trim()) return;
    const t = b.type;
    if (t === T.SCENE) {
      sceneCount++;
      const label = sceneNumbers ? `${sceneCount}. ${b.text.toUpperCase()}` : b.text.toUpperCase();
      elements.push({ type:"scene", lines:[label] });
    } else if (t === T.ACTION) {
      elements.push({ type:"action", lines: wrapText(b.text, actionMaxChars) });
    } else if (t === T.CHARACTER) {
      elements.push({ type:"character", lines:[b.text.toUpperCase()] });
    } else if (t === T.PAREN) {
      const txt = b.text.startsWith("(") ? b.text : `(${b.text})`;
      elements.push({ type:"paren", lines: wrapText(txt, parenMaxChars) });
    } else if (t === T.DIALOGUE) {
      elements.push({ type:"dialogue", lines: wrapText(b.text, dialogueMaxChars) });
    } else if (t === T.TRANSITION) {
      elements.push({ type:"transition", lines:[b.text.toUpperCase()] });
    }
  });

  // ── Espaciado vertical por tipo (en puntos) ───────────────────────────────
  const LINE_H  = 14.4; // 12pt * 1.2
  const spacing = {
    scene:      { before:24, after:12 },
    action:     { before:0,  after:12 },
    character:  { before:12, after:0  },
    paren:      { before:0,  after:0  },
    dialogue:   { before:0,  after:12 },
    transition: { before:12, after:12 },
  };

  // ── Paginación ────────────────────────────────────────────────────────────
  const pages = []; // array de arrays de renderItems
  let currentPage = [];
  let y = page.mt; // cursor vertical
  const usableH = page.h - page.mt - page.mb;

  const newPage = () => {
    pages.push(currentPage);
    currentPage = [];
    y = page.mt;
  };

  elements.forEach(el => {
    const sp = spacing[el.type];
    const blockH = sp.before + el.lines.length * LINE_H + sp.after;
    if (y + blockH > page.h - page.mb && currentPage.length > 0) newPage();
    currentPage.push({ ...el, y: y + sp.before });
    y += blockH;
  });
  if (currentPage.length > 0) pages.push(currentPage);
  const totalPages = pages.length;

  // ── Render HTML ───────────────────────────────────────────────────────────
  const px = v => `${v}px`; // SVG usa px, pero usaremos pt directamente con transform

  // Renderizamos cada página como un div con position absolute children
  // para máximo control tipográfico
  const renderPage = (items, pageNum) => {
    const W = page.w, H = page.h;
    const ml = page.ml, mr = page.mr;

    const renderItem = (el) => {
      let html = "";
      if (el.type === "scene") {
        html = `<div style="position:absolute;top:${el.y}pt;left:${ml}pt;right:${mr}pt;
          font-weight:bold;text-decoration:underline;">${el.lines[0]}</div>`;
      } else if (el.type === "action") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*LINE_H}pt;left:${ml}pt;right:${mr}pt;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "character") {
        html = `<div style="position:absolute;top:${el.y}pt;left:${pos.character}pt;">${el.lines[0]}</div>`;
      } else if (el.type === "paren") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*LINE_H}pt;left:${pos.paren}pt;width:${pos.parenW}pt;font-style:italic;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "dialogue") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*LINE_H}pt;left:${pos.dialogue}pt;width:${pos.dialogueW}pt;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "transition") {
        html = `<div style="position:absolute;top:${el.y}pt;right:${mr}pt;font-weight:bold;">${el.lines[0]}</div>`;
      }
      return html;
    };

    const pageNumHtml = pageNum > 1
      ? `<div style="position:absolute;top:${page.mt/2}pt;right:${mr}pt;">${pageNum}.</div>`
      : "";

    return `
      <div class="screenplay-page" style="position:relative;width:${W}pt;height:${H}pt;
        page-break-after:always;overflow:hidden;">
        ${pageNumHtml}
        ${items.map(renderItem).join("")}
      </div>`;
  };

  // ── Portada ───────────────────────────────────────────────────────────────
  const coverHtml = `
    <div class="screenplay-page" style="position:relative;width:${page.w}pt;height:${page.h}pt;
      page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:18pt;font-weight:bold;margin-bottom:24pt;">${projectName}</div>
        ${author ? `<div style="font-size:12pt;margin-bottom:6pt;">Escrito por</div>
        <div style="font-size:14pt;font-weight:bold;">${author}</div>` : ""}
        <div style="margin-top:48pt;font-size:10pt;color:#666;">Generado con PLANO Screenwriting</div>
      </div>
    </div>`;

  // ── HTML final ────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${projectName}</title>
  <style>
    @page { size: ${isHollywood ? "letter" : "A4"}; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; }
    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1.2;
      color: #000;
    }
    .screenplay-page { background: #fff; }
    @media screen {
      body { background: #888; padding: 20px; display:flex; flex-direction:column; align-items:center; gap:20px; }
      .screenplay-page { box-shadow: 0 4px 20px rgba(0,0,0,.4); }
    }
    @media print {
      body { background: #fff; padding: 0; gap: 0; }
      .screenplay-page { box-shadow: none; page-break-after: always; }
    }
  </style>
</head>
<body>
  ${coverHtml}
  ${pages.map((items, i) => renderPage(items, i + 1)).join("\n")}
  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 600));
  </script>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

function exportToFountain(blocks, projectName) {
  let out = `Title: ${projectName}\nCredit: Escrito con PLANO\n\n`;
  blocks.forEach(b => {
    if (!b.text.trim()) return;
    if (b.type===T.SCENE) out += `\n${b.text.toUpperCase()}\n\n`;
    else if (b.type===T.ACTION) out += `${b.text}\n\n`;
    else if (b.type===T.CHARACTER) out += `\n${b.text.toUpperCase()}\n`;
    else if (b.type===T.PAREN) out += `${b.text}\n`;
    else if (b.type===T.DIALOGUE) out += `${b.text}\n\n`;
    else if (b.type===T.TRANSITION) out += `\n${b.text.toUpperCase()}\n\n`;
  });
  const blob = new Blob([out], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${projectName}.fountain`;
  a.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════

function makeGlobalCss(C) { return `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;background:${C.bgApp};color:${C.textPrimary};font-family:'Inter',system-ui,sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${C.borderBright};border-radius:3px}
  textarea:focus,input:focus{outline:none}
  button{cursor:pointer;font-family:inherit}
  input{font-family:inherit}
  mark{background:rgba(91,141,239,0.35);color:${C.textPrimary};border-radius:2px;padding:0 1px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
  .fade-in{animation:fadeIn .15s ease}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .saving{animation:pulse 1.2s infinite}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .slide-up{animation:slideUp .25s cubic-bezier(.16,1,.3,1)}
  @keyframes overlay-in{from{opacity:0}to{opacity:1}}
  .overlay-in{animation:overlay-in .15s ease}
  @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
  .slide-right{animation:slideInRight .25s cubic-bezier(.16,1,.3,1)}
  .icon-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;
    border:none;background:none;color:${C.textMuted};font-size:9px;font-weight:600;
    letter-spacing:.5px;text-transform:uppercase;transition:color .15s,background .15s;
    border-radius:8px;width:100%;cursor:pointer}
  .icon-nav-btn:hover{color:${C.textSec};background:${C.bgCard}}
  .icon-nav-btn.active{color:${C.accent};background:${C.accentGlow}}
  /* bottom nav mobile */
  .mobile-nav-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    flex:1;padding:6px 2px 8px;border:none;background:none;cursor:pointer;transition:color .15s;
    font-size:9px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;
    color:${C.textMuted};min-height:52px}
  .mobile-nav-btn.active{color:${C.accent}}
  .mobile-nav-btn:active{opacity:.7}
  /* Tap highlight off on mobile */
  button{-webkit-tap-highlight-color:transparent}
  textarea{-webkit-tap-highlight-color:transparent}
`; }

function InjectStyles({ theme }) {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "plano-global-styles";
    el.textContent = makeGlobalCss(C);
    document.head.appendChild(el);

    // Título de la pestaña
    document.title = "Plano";

    // Favicon SVG minimalista: tira de película
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill="#12141A"/>
      <rect x="2" y="4" width="4" height="5" rx="1" fill="#252840"/>
      <rect x="2" y="14" width="4" height="5" rx="1" fill="#252840"/>
      <rect x="2" y="23" width="4" height="5" rx="1" fill="#252840"/>
      <rect x="26" y="4" width="4" height="5" rx="1" fill="#252840"/>
      <rect x="26" y="14" width="4" height="5" rx="1" fill="#252840"/>
      <rect x="26" y="23" width="4" height="5" rx="1" fill="#252840"/>
      <text x="16" y="20" font-family="'Courier New',monospace" font-size="10" font-weight="700"
        fill="#E4E8F0" text-anchor="middle" letter-spacing="0.5">P</text>
      <rect x="8" y="22" width="16" height="1.5" rx="0.75" fill="#5B8DEF"/>
    </svg>`;
    const faviconUrl = "data:image/svg+xml," + encodeURIComponent(faviconSvg);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = faviconUrl;

    return () => document.head.removeChild(el);
  }, []);
  useEffect(() => {
    const el = document.getElementById("plano-global-styles");
    if (el) el.textContent = makeGlobalCss(C);
  }, [theme]);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: UNDO / REDO
// ═══════════════════════════════════════════════════════════════════════════════

function useUndoable(initial) {
  const [history, setHistory] = useState({past:[], present:initial, future:[]});
  const set = useCallback(val => {
    setHistory(h => ({
      past: [...h.past.slice(-49), h.present],
      present: typeof val==="function" ? val(h.present) : val,
      future: []
    }));
  }, []);
  const undo = useCallback(() => {
    setHistory(h => {
      if (!h.past.length) return h;
      const prev = h.past[h.past.length-1];
      return { past: h.past.slice(0,-1), present: prev, future: [h.present, ...h.future] };
    });
  }, []);
  const redo = useCallback(() => {
    setHistory(h => {
      if (!h.future.length) return h;
      const [next, ...rest] = h.future;
      return { past: [...h.past, h.present], present: next, future: rest };
    });
  }, []);
  return [history.present, set, undo, redo, history.past.length>0, history.future.length>0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════════════════════

function Btn({ onClick, children, style={}, title, variant="ghost", disabled=false }) {
  const base = {
    border:"none", borderRadius:7, fontSize:12, fontWeight:600,
    display:"flex", alignItems:"center", gap:5, transition:"all .14s",
    opacity:disabled?.5:1, cursor:disabled?"not-allowed":"pointer", ...style,
  };
  const variants = {
    ghost:   { background:"none", color:C.textSec, padding:"5px 8px" },
    primary: { background:C.accent, color:C.white, padding:"6px 14px" },
    outline: { background:"none", border:`1px solid ${C.borderBright}`, color:C.textSec, padding:"5px 12px" },
    danger:  { background:"rgba(240,96,96,.12)", color:C.red, padding:"5px 10px", border:`1px solid rgba(240,96,96,.25)` },
    warm:    { background:`rgba(${hexToRgb(C.accentWarm)},.15)`, color:C.accentWarm, padding:"6px 14px" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} title={title} disabled={disabled}
      style={{...base, ...variants[variant]}}
      onMouseEnter={e=>{if(!disabled){
        if(variant==="ghost"){e.currentTarget.style.color=C.textPrimary;e.currentTarget.style.background=C.bgCard}
        else if(variant==="primary"){e.currentTarget.style.opacity=".85"}
        else if(variant==="outline"){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}
      }}}
      onMouseLeave={e=>{if(!disabled){
        if(variant==="ghost"){e.currentTarget.style.color=C.textSec;e.currentTarget.style.background="none"}
        else if(variant==="primary"){e.currentTarget.style.opacity="1"}
        else if(variant==="outline"){e.currentTarget.style.borderColor=C.borderBright;e.currentTarget.style.color=C.textSec}
      }}}
    >{children}</button>
  );
}

function Modal({ open, onClose, title, children, width=420 }) {
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`, borderRadius:14,
        width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 24px 60px rgba(0,0,0,.7)",
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 20px", borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontWeight:700, fontSize:15, color:C.textPrimary}}>{title}</span>
          <Btn onClick={onClose} style={{padding:"5px 7px", color:C.textMuted}}><Icons.Close/></Btn>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV SIDEBAR — DESKTOP
// ═══════════════════════════════════════════════════════════════════════════════

function NavSidebar({ tab, onTab, saving, isDark, onToggleTheme, onSignOut, userEmail, onHelp }) {
  const items = [
    {id:"editor",    Icon:Icons.Editor,     label:"Editor"},
    {id:"scenes",    Icon:Icons.Scenes,     label:"Escenas"},
    {id:"characters",Icon:Icons.Characters, label:"Personas"},
    {id:"notes",     Icon:Icons.Notes,      label:"Notas"},
    {id:"stats",     Icon:Icons.Stats,      label:"Stats"},
    {id:"search",    Icon:Icons.Search,     label:"Buscar"},
    {id:"projects",  Icon:Icons.Projects,   label:"Guiones"},
  ];
  return (
    <div style={{
      width:64, background:C.bgSidebar, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"12px 6px", gap:2, flexShrink:0, height:"100dvh",
      transition:"background .25s,border-color .25s",
    }}>
      {/* Logo — tira de película + cursor */}
      <div style={{marginBottom:8, flexShrink:0, cursor:"default"}} title="PLANO Screenwriting">
        <svg width="52" height="40" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo */}
          <rect width="52" height="40" rx="7"
            fill={isDark ? "#0E1015" : "#E8EAF0"}
            stroke={isDark ? "#252840" : "#C4CBDE"} strokeWidth="0.75"/>
          {/* Perforaciones izquierda */}
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          {/* Perforaciones derecha */}
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          {/* Texto PLANO */}
          <text x="26" y="24"
            fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700"
            fill={isDark ? "#E4E8F0" : "#1A1F2E"}
            textAnchor="middle" letterSpacing="2">PLANO</text>
          {/* Línea de cursor */}
          <rect x="10" y="28" width="30" height="1.5" rx="0.75"
            fill={isDark ? "#5B8DEF" : "#4A7DE8"} opacity="0.9"/>
          {/* Cursor parpadeante */}
          <rect x="38.5" y="14" width="2" height="14" rx="1"
            fill={isDark ? "#5B8DEF" : "#4A7DE8"}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
      </div>

      {items.map(it => (
        <button key={it.id} className={`icon-nav-btn${tab===it.id?" active":""}`}
          onClick={() => onTab(it.id)} title={it.label}>
          <it.Icon/>
          <span style={{fontSize:8.5}}>{it.label}</span>
        </button>
      ))}

      <div style={{flex:1}}/>

      {/* Ayuda */}
      <button onClick={onHelp} title="Guía de elementos del guion"
        style={{padding:"8px", borderRadius:8, border:"none", background:"none",
          color:C.textMuted, cursor:"pointer", transition:"color .15s, background .15s",
          display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentGlow}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        <Icons.Help/>
      </button>

      {/* Theme toggle */}
      <button onClick={onToggleTheme} title={isDark ? "Modo día" : "Modo noche"}
        style={{padding:"8px", borderRadius:8, border:"none", background:"none",
          color:C.textMuted, cursor:"pointer", transition:"color .15s, background .15s",
          display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.textSec;e.currentTarget.style.background=C.bgCard}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        {isDark ? <Icons.Sun/> : <Icons.Moon/>}
      </button>

      {/* User avatar + sign out */}
      <button onClick={onSignOut} title={`Cerrar sesión (${userEmail})`}
        style={{padding:"7px", borderRadius:8, border:"none", background:"none",
          cursor:"pointer", transition:"background .15s", width:"100%",
          display:"flex", alignItems:"center", justifyContent:"center"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(240,96,96,.1)"}
        onMouseLeave={e=>e.currentTarget.style.background="none"}>
        <div style={{
          width:26, height:26, borderRadius:"50%",
          background:`rgba(${hexToRgb(C.accent)},.18)`,
          border:`1px solid rgba(${hexToRgb(C.accent)},.3)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:700, color:C.accent, letterSpacing:0,
        }}>
          {(userEmail||"?")[0].toUpperCase()}
        </div>
      </button>

      {saving && <div className="saving" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"4px 0", color:C.textMuted}}>
        <Icons.Saving/>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV — MOBILE
// ═══════════════════════════════════════════════════════════════════════════════

function MobileBottomNav({ tab, onTab, saving, isDark, onToggleTheme, onHelp }) {
  const items = [
    {id:"editor",    Icon:Icons.Editor,     label:"Editor"},
    {id:"scenes",    Icon:Icons.Scenes,     label:"Escenas"},
    {id:"characters",Icon:Icons.Characters, label:"Personas"},
    {id:"notes",     Icon:Icons.Notes,      label:"Notas"},
    {id:"projects",  Icon:Icons.Projects,   label:"Guiones"},
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0,
      background:C.bgSidebar, borderTop:`1px solid ${C.border}`,
      display:"flex", zIndex:100,
      paddingBottom:"env(safe-area-inset-bottom, 0px)",
    }}>
      {items.map(it => (
        <button key={it.id} className={`mobile-nav-btn${tab===it.id?" active":""}`}
          onClick={() => onTab(it.id)}>
          <it.Icon style={{width:20,height:20}}/>
          <span style={{fontSize:8.5}}>{it.label}</span>
        </button>
      ))}
      <button onClick={onHelp} className="mobile-nav-btn" title="Guía">
        <Icons.Help style={{width:20,height:20}}/>
        <span style={{fontSize:8.5}}>Guía</span>
      </button>
      <button onClick={onToggleTheme} className="mobile-nav-btn" title={isDark?"Modo día":"Modo noche"}>
        {isDark ? <Icons.Sun style={{width:20,height:20}}/> : <Icons.Moon style={{width:20,height:20}}/>}
        <span style={{fontSize:8.5}}>{isDark?"Día":"Noche"}</span>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DERECHO — DESKTOP
// ═══════════════════════════════════════════════════════════════════════════════

function RightPanel({ tab, projects, selectedId, onSelectProject, onNewProject, onDeleteProject,
  onRenameProject, scenes, characters, activeBlock, blocks, onNoteChange, stats,
  onSceneClick, searchQuery, onSearchQuery, searchResults, isMobile }) {

  const panelTitle = {
    projects:"Guiones", scenes:"Escenas", characters:"Personajes",
    notes:"Notas", stats:"Estadísticas", search:"Búsqueda",
  }[tab] || "Panel";

  if (isMobile) return null; // mobile usa tabs directamente

  return (
    <div style={{
      width:248, background:C.bgPanel, borderLeft:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", height:"100dvh", flexShrink:0,
    }}>
      <div style={{padding:"12px 14px 8px", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
        <span style={{fontSize:10, fontWeight:700, color:C.textMuted,
          textTransform:"uppercase", letterSpacing:1.5}}>{panelTitle}</span>
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"12px 12px"}}>
        <PanelContent tab={tab} projects={projects} selectedId={selectedId}
          onSelectProject={onSelectProject} onNewProject={onNewProject}
          onDeleteProject={onDeleteProject} onRenameProject={onRenameProject}
          scenes={scenes} characters={characters} activeBlock={activeBlock}
          blocks={blocks} onNoteChange={onNoteChange} stats={stats}
          onSceneClick={onSceneClick} searchQuery={searchQuery}
          onSearchQuery={onSearchQuery} searchResults={searchResults}
          isMobile={false}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE PANEL (pantalla completa al seleccionar tab no-editor)
// ═══════════════════════════════════════════════════════════════════════════════

function MobilePanel({ tab, projects, selectedId, onSelectProject, onNewProject, onDeleteProject,
  onRenameProject, scenes, characters, activeBlock, blocks, onNoteChange, stats,
  onSceneClick, searchQuery, onSearchQuery, searchResults, onBack }) {

  const panelTitle = {
    projects:"Guiones", scenes:"Escenas", characters:"Personajes",
    notes:"Notas", stats:"Estadísticas", search:"Búsqueda",
  }[tab] || "Panel";

  return (
    <div className="slide-right" style={{
      position:"fixed", inset:0,
      background:C.bgPanel, zIndex:80,
      display:"flex", flexDirection:"column",
      paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 56px)",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"14px 16px", borderBottom:`1px solid ${C.border}`, flexShrink:0,
        paddingTop:"calc(14px + env(safe-area-inset-top, 0px))",
      }}>
        <button onClick={onBack} style={{background:"none",border:"none",
          color:C.textSec,cursor:"pointer",padding:"2px 4px",lineHeight:1,display:"flex",alignItems:"center"}}>
          <Icons.Back/>
        </button>
        <span style={{fontWeight:700, color:C.textPrimary, fontSize:16}}>{panelTitle}</span>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"14px 16px"}}>
        <PanelContent tab={tab} projects={projects} selectedId={selectedId}
          onSelectProject={p=>{onSelectProject(p);onBack();}}
          onNewProject={onNewProject}
          onDeleteProject={onDeleteProject} onRenameProject={onRenameProject}
          scenes={scenes} characters={characters} activeBlock={activeBlock}
          blocks={blocks} onNoteChange={onNoteChange} stats={stats}
          onSceneClick={i=>{onSceneClick(i);onBack();}} searchQuery={searchQuery}
          onSearchQuery={onSearchQuery}
          searchResults={searchResults}
          onResultClick={i=>{onSceneClick(i);onBack();}}
          isMobile={true}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL CONTENT — shared between desktop panel and mobile panel
// ═══════════════════════════════════════════════════════════════════════════════

function PanelContent({ tab, projects, selectedId, onSelectProject, onNewProject,
  onDeleteProject, onRenameProject, scenes, characters, activeBlock, blocks,
  onNoteChange, stats, onSceneClick, searchQuery, onSearchQuery, searchResults,
  onResultClick, isMobile }) {
  return (
    <>
      {tab==="projects" && (
        <ProjectsPanel projects={projects} selectedId={selectedId}
          onSelect={onSelectProject} onNew={onNewProject}
          onDelete={onDeleteProject} onRename={onRenameProject}/>
      )}
      {tab==="scenes" && (
        <ScenesPanel scenes={scenes} onSceneClick={onSceneClick}/>
      )}
      {tab==="characters" && <CharactersPanel characters={characters}/>}
      {tab==="notes" && (
        <NotesPanel activeBlock={activeBlock} blocks={blocks} onNoteChange={onNoteChange}/>
      )}
      {tab==="stats" && <StatsPanel stats={stats}/>}
      {tab==="search" && (
        <SearchPanel query={searchQuery} onQuery={onSearchQuery} results={searchResults}
          onResultClick={onResultClick || onSceneClick} isMobile={isMobile}/>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-PANELES
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectsPanel({ projects, selectedId, onSelect, onNew, onDelete, onRename }) {
  const [search, setSearch] = useState("");
  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{display:"flex", gap:6, marginBottom:12}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar guion..."
          style={{flex:1, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"8px 10px", color:C.textSec, fontSize:13, outline:"none"}}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.border}/>
        <Btn onClick={onNew} variant="primary" style={{padding:"7px 10px", borderRadius:8}}><Icons.Plus/></Btn>
      </div>
      {filtered.map(p => (
        <ProjectItem key={p.id} project={p} isActive={p.id===selectedId}
          onSelect={()=>onSelect(p.id)} onDelete={()=>onDelete(p.id)}
          onRename={n=>onRename(p.id,n)}/>
      ))}
    </div>
  );
}

function ProjectItem({ project, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [hover, setHover] = useState(false);
  const commit = () => { if (name.trim()) onRename(name.trim()); else setName(project.name); setEditing(false); };
  return (
    <div onClick={onSelect} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{padding:"10px 12px", borderRadius:9, marginBottom:4, cursor:"pointer",
        background:isActive?C.bgActive:hover?C.bgCard:"transparent",
        border:isActive?`1px solid ${C.borderBright}`:"1px solid transparent",
        transition:"all .12s", display:"flex", alignItems:"center", gap:8}}>
      <Icons.Projects style={{width:18,height:18,flexShrink:0,color:isActive?C.accent:C.textMuted}}/>
      {editing ? (
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onBlur={commit} onClick={e=>e.stopPropagation()}
          onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setName(project.name);setEditing(false);}}}
          style={{flex:1, background:C.bgApp, border:`1px solid ${C.accent}`, borderRadius:5,
            padding:"2px 6px", color:C.textPrimary, fontSize:13, outline:"none"}}/>
      ) : (
        <span style={{flex:1, fontSize:13, color:isActive?C.textPrimary:C.textSec,
          fontWeight:isActive?600:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
          {project.name}
        </span>
      )}
      {(hover||isActive) && !editing && (
        <div style={{display:"flex", gap:2}} onClick={e=>e.stopPropagation()}>
          <Btn onClick={()=>setEditing(true)} style={{padding:"4px 6px"}} title="Renombrar"><Icons.Pen/></Btn>
          <Btn onClick={onDelete} style={{padding:"4px 6px"}} title="Eliminar"><Icons.Trash/></Btn>
        </div>
      )}
    </div>
  );
}

function ScenesPanel({ scenes, onSceneClick }) {
  return (
    <div>
      <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:1.5,
        fontWeight:700, marginBottom:10}}>{scenes.length} escenas</p>
      {scenes.length===0 && (
        <div style={{textAlign:"center", padding:"32px 16px", color:C.textMuted}}>
          <div style={{marginBottom:10, color:C.textMuted}}><Icons.Scenes style={{width:28,height:28}}/></div>
          <p style={{fontSize:13}}>Escribí INT. o EXT. para crear una escena.</p>
        </div>
      )}
      {scenes.map((s,i) => (
        <div key={s.id} onClick={()=>onSceneClick(s.index)}
          style={{padding:"10px 12px", marginBottom:4, borderRadius:8,
            background:C.bgCard, border:`1px solid ${C.border}`,
            cursor:"pointer", transition:"border-color .14s,background .14s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.bgCardHover}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard}}>
          <div style={{display:"flex", alignItems:"center", gap:7}}>
            <span style={{fontSize:10, fontWeight:700, color:C.accentWarm,
              background:"rgba(232,131,74,.12)", padding:"2px 7px", borderRadius:4,
              flexShrink:0, minWidth:26, textAlign:"center"}}>{i+1}</span>
            <span style={{fontSize:12, color:C.textSec, overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Courier Prime',monospace"}}>
              {s.text||"Sin título"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CharactersPanel({ characters }) {
  const entries = Object.entries(characters);
  const maxLines = Math.max(1, ...entries.map(([,i])=>i.lines));
  return (
    <div>
      <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:1.5,
        fontWeight:700, marginBottom:10}}>{entries.length} personajes</p>
      {entries.length===0 && (
        <div style={{textAlign:"center", padding:"32px 16px", color:C.textMuted}}>
          <div style={{marginBottom:10, color:C.textMuted}}><Icons.Characters style={{width:28,height:28}}/></div>
          <p style={{fontSize:13}}>Los personajes aparecen al escribir diálogos.</p>
        </div>
      )}
      {entries.sort((a,b)=>b[1].lines-a[1].lines).map(([name,info]) => (
        <div key={name} style={{padding:"10px 12px", marginBottom:6, borderRadius:9,
          background:C.bgCard, border:`1px solid ${C.border}`}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:7}}>
            <div style={{width:10, height:10, borderRadius:"50%", background:info.color,
              flexShrink:0, boxShadow:`0 0 6px ${info.color}70`}}/>
            <span style={{fontSize:13, color:info.color, fontWeight:700,
              fontFamily:"'Courier Prime',monospace", letterSpacing:.5, flex:1}}>{name}</span>
            <span style={{fontSize:11, color:C.textMuted}}>{info.lines} líneas</span>
          </div>
          <div style={{height:3, borderRadius:2, background:C.border}}>
            <div style={{height:"100%", borderRadius:2, background:info.color,
              width:`${Math.round(info.lines/maxLines*100)}%`, transition:"width .3s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPanel({ activeBlock, blocks, onNoteChange }) {
  const block = blocks[activeBlock];
  const withNotes = blocks.map((b,i)=>({...b,index:i})).filter(b=>b.note?.trim());
  return (
    <div>
      {block ? (
        <>
          <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase",
            letterSpacing:1.5, fontWeight:700, marginBottom:8}}>Nota del bloque activo</p>
          <div style={{padding:"12px", borderRadius:9, background:C.bgCard,
            border:`1px solid ${C.borderBright}`, marginBottom:16}}>
            <p style={{fontSize:10, color:C.textMuted, marginBottom:6}}>
              <span style={{color:typeColor(block.type)}}>[{typeLabel(block.type)}]</span>{" "}
              {block.text?.slice(0,40)||(
                <span style={{fontStyle:"italic"}}>(vacío)</span>
              )}
            </p>
            <textarea value={block.note||""} onChange={e=>onNoteChange(activeBlock,e.target.value)}
              placeholder="Anotá ideas, referencias, preguntas..."
              rows={4} style={{width:"100%", background:"transparent", border:"none",
                color:C.textSec, fontSize:13, resize:"vertical", outline:"none",
                lineHeight:1.65, fontFamily:"inherit"}}/>
          </div>
        </>
      ) : (
        <p style={{fontSize:13, color:C.textMuted, fontStyle:"italic", marginBottom:16}}>
          Seleccioná un bloque para agregar una nota.
        </p>
      )}
      {withNotes.length>0 && (
        <>
          <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase",
            letterSpacing:1.5, fontWeight:700, marginBottom:8}}>
            Todas las notas · {withNotes.length}
          </p>
          {withNotes.map(b => (
            <div key={b.id} style={{padding:"10px 12px", marginBottom:5, borderRadius:8,
              background:C.bgCard, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${C.yellow}`}}>
              <p style={{fontSize:10, color:C.yellow, marginBottom:4, fontFamily:"monospace"}}>
                {b.text?.slice(0,32)||"(vacío)"}
              </p>
              <p style={{fontSize:12, color:C.textSec, lineHeight:1.55}}>{b.note}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function StatsPanel({ stats }) {
  const items = [
    ["Palabras", stats.words],
    ["Páginas aprox.", stats.pages],
    ["Escenas", stats.scenes],
    ["Personajes", stats.characters],
    ["Diálogos", stats.dialogues],
    ["Bloques", stats.blocks],
  ];
  return (
    <div>
      {items.map(([label,val]) => (
        <div key={label} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"10px 12px", marginBottom:4, borderRadius:8,
          background:C.bgCard, border:`1px solid ${C.border}`}}>
          <span style={{fontSize:13, color:C.textSec}}>{label}</span>
          <span style={{fontSize:16, color:C.textPrimary, fontWeight:700}}>{val}</span>
        </div>
      ))}
      <div style={{marginTop:12, padding:"14px 16px", borderRadius:10,
        background:`rgba(${hexToRgb(C.accent)},.08)`, border:`1px solid rgba(${hexToRgb(C.accent)},.25)`}}>
        <p style={{fontSize:10, color:C.accent, marginBottom:4, fontWeight:700,
          textTransform:"uppercase", letterSpacing:.5}}>Duración estimada</p>
        <p style={{fontSize:28, color:C.textPrimary, fontWeight:800, lineHeight:1}}>
          ~{stats.pages}<span style={{fontSize:14, fontWeight:400, marginLeft:4}}>min</span>
        </p>
        <p style={{fontSize:11, color:C.textMuted, marginTop:4}}>1 página ≈ 1 minuto en pantalla</p>
      </div>
    </div>
  );
}

function SearchPanel({ query, onQuery, results, onResultClick, isMobile }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (isMobile) setTimeout(() => inputRef.current?.focus(), 200);
  }, []);
  return (
    <div>
      <input ref={inputRef} value={query} onChange={e=>onQuery(e.target.value)}
        placeholder="Buscar en el guion..."
        style={{width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
          borderRadius:9, padding:"11px 14px", color:C.textPrimary, fontSize:14,
          outline:"none", marginBottom:12, transition:"border-color .14s"}}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>e.target.style.borderColor=C.borderBright}/>
      {query.length>1 && (
        <p style={{fontSize:11, color:C.textMuted, marginBottom:8}}>
          {results.length} resultado{results.length!==1?"s":""}
        </p>
      )}
      {results.map(r => (
        <div key={r.id} onClick={()=>onResultClick(r.index)}
          style={{padding:"10px 12px", marginBottom:4, borderRadius:8,
            background:C.bgCard, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .13s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border}}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
            <span style={{fontSize:9, fontWeight:700, color:typeColor(r.type),
              background:`rgba(${hexToRgb(typeColor(r.type))},.1)`, padding:"1px 5px", borderRadius:3}}>
              {typeLabel(r.type)}
            </span>
          </div>
          <p style={{fontSize:12, color:C.textSec, lineHeight:1.5,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical"}}
            dangerouslySetInnerHTML={{__html:r.highlighted}}/>
        </div>
      ))}
      {query.length>1 && results.length===0 && (
        <p style={{fontSize:13, color:C.textMuted, fontStyle:"italic", textAlign:"center", marginTop:16}}>
          Sin resultados para "{query}"
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBAR SUPERIOR — DESKTOP
// ═══════════════════════════════════════════════════════════════════════════════

function Toolbar({ activeType, onTypeChange, onExport, onExportFountain, projectName,
  saving, canUndo, canRedo, onUndo, onRedo, focusMode, onFocusMode, isMobile }) {
  const types = [
    {type:T.SCENE,      label:"Escena",    short:"ESC", color:C.accentWarm},
    {type:T.ACTION,     label:"Acción",    short:"ACC", color:C.textSec},
    {type:T.CHARACTER,  label:"Personaje", short:"PER", color:C.green},
    {type:T.PAREN,      label:"Acotación",   short:"ACO", color:"#F4A96D"},
    {type:T.DIALOGUE,   label:"Diálogo",   short:"DIA", color:C.accent},
    {type:T.TRANSITION, label:"Transición",short:"TRA", color:C.purple},
  ];
  const [showExport, setShowExport] = useState(false);

  if (isMobile) return null; // mobile tiene su propio header

  return (
    <div style={{background:C.bgPanel, borderBottom:`1px solid ${C.border}`,
      padding:"0 12px", display:"flex", alignItems:"center", gap:4, flexShrink:0, height:46}}>

      {/* Tipos de bloque */}
      <div style={{display:"flex", gap:2, flexWrap:"nowrap", overflowX:"auto",
        scrollbarWidth:"none", msOverflowStyle:"none"}}>
        {types.map(t => {
          const on = activeType===t.type;
          return (
            <button key={t.type} onClick={()=>onTypeChange(t.type)}
              title={`${t.label} (Tab)`}
              style={{padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:on?700:400,
                background:on?`rgba(${hexToRgb(t.color)},.14)`:"transparent",
                border:on?`1px solid rgba(${hexToRgb(t.color)},.4)`:"1px solid transparent",
                color:on?t.color:C.textMuted, transition:"all .12s", whiteSpace:"nowrap",
                fontFamily:"inherit", cursor:"pointer"}}
              onMouseEnter={e=>{if(!on){e.currentTarget.style.color=C.textSec;e.currentTarget.style.background=C.bgCard}}}
              onMouseLeave={e=>{if(!on){e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="transparent"}}}
            >{t.label}</button>
          );
        })}
      </div>

      <div style={{flex:1}}/>

      {/* Saving indicator */}
      {saving && <span className="saving" style={{display:"flex",alignItems:"center",gap:4,fontSize:10, color:C.textMuted, marginRight:4}}><Icons.Saving/> Guardando</span>}

      <Btn onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)" style={{padding:"5px 7px"}}><Icons.Undo/></Btn>
      <Btn onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)" style={{padding:"5px 7px"}}><Icons.Redo/></Btn>

      <Btn onClick={onFocusMode} title="Modo foco"
        style={{padding:"5px 7px", color:focusMode?C.accent:C.textMuted}}><Icons.Focus/></Btn>

      <div style={{position:"relative"}}>
        <Btn onClick={()=>setShowExport(v=>!v)} variant="outline"
          style={{gap:5, padding:"4px 10px", fontSize:12}}>
          <Icons.Export/> Exportar
        </Btn>
        {showExport && (
          <div style={{position:"absolute", right:0, top:"calc(100% + 6px)", background:C.bgPanel,
            border:`1px solid ${C.borderBright}`, borderRadius:9, padding:6,
            zIndex:300, minWidth:180, boxShadow:`0 12px 32px ${C.shadow}`}}>
            {[
              {label:"PDF (impresión)", Icon:Icons.PDF, fn:()=>{onExport();setShowExport(false);}},
              {label:"Fountain (.fountain)", Icon:Icons.Fountain, fn:()=>{onExportFountain();setShowExport(false);}},
            ].map(item => (
              <button key={item.label} onClick={item.fn} style={{
                display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px",
                background:"none", border:"none", color:C.textSec, fontSize:12,
                textAlign:"left", cursor:"pointer", borderRadius:6, fontFamily:"inherit"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <item.Icon/>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EDITOR HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function MobileEditorHeader({ projectName, words, pages, scenes, saving,
  activeType, onTypeChange, canUndo, canRedo, onUndo, onRedo,
  onExport, onExportFountain, focusMode, onFocusMode }) {
  const types = [
    {type:T.SCENE,      short:"ESC", color:C.accentWarm},
    {type:T.ACTION,     short:"ACC", color:C.textSec},
    {type:T.CHARACTER,  short:"PER", color:C.green},
    {type:T.PAREN,      short:"ACO", color:"#F4A96D"},
    {type:T.DIALOGUE,   short:"DIA", color:C.accent},
    {type:T.TRANSITION, short:"TRA", color:C.purple},
  ];
  const [showExport, setShowExport] = useState(false);

  return (
    <div style={{flexShrink:0, background:C.bgPanel, borderBottom:`1px solid ${C.border}`,
      paddingTop:"env(safe-area-inset-top, 0px)"}}>

      {/* Top row: project name + actions */}
      <div style={{display:"flex", alignItems:"center", padding:"10px 14px 6px", gap:8}}>
        {/* Logo mini móvil */}
        <svg width="32" height="25" viewBox="0 0 52 40" fill="none" style={{flexShrink:0}}>
          <rect width="52" height="40" rx="7" fill={C.bgSidebar} stroke={C.border} strokeWidth="0.75"/>
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700" fill={C.textPrimary} textAnchor="middle" letterSpacing="2">PLANO</text>
          <rect x="10" y="28" width="30" height="1.5" rx="0.75" fill={C.accent} opacity="0.9"/>
          <rect x="38.5" y="14" width="2" height="14" rx="1" fill={C.accent}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:700, color:C.accent,
            fontFamily:"'Courier Prime',monospace", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{projectName}</div>
          <div style={{fontSize:10, color:C.textMuted, marginTop:1}}>
            {words} palabras · ~{pages} pág · {scenes} escenas
            {saving && <span className="saving" style={{marginLeft:6}}>· Guardando…</span>}
          </div>
        </div>
        <Btn onClick={onUndo} disabled={!canUndo} style={{padding:"6px 8px"}}><Icons.Undo/></Btn>
        <Btn onClick={onRedo} disabled={!canRedo} style={{padding:"6px 8px"}}><Icons.Redo/></Btn>
        <button onClick={onFocusMode} style={{background:"none",border:"none",
          color:focusMode?C.accent:C.textMuted,cursor:"pointer",padding:"4px 6px",display:"flex",alignItems:"center"}}>
          <Icons.Focus/>
        </button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowExport(v=>!v)} style={{background:"none",border:`1px solid ${C.borderBright}`,
            borderRadius:7,color:C.textSec,cursor:"pointer",padding:"6px 8px",display:"flex",alignItems:"center"}}>
            <Icons.Export/>
          </button>
          {showExport && (
            <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.bgPanel,
              border:`1px solid ${C.borderBright}`,borderRadius:9,padding:6,
              zIndex:300,minWidth:180,boxShadow:`0 12px 32px ${C.shadow}`}}>
              {[
                {label:"PDF",Icon:Icons.PDF,fn:()=>{onExport();setShowExport(false);}},
                {label:"Fountain",Icon:Icons.Fountain,fn:()=>{onExportFountain();setShowExport(false);}},
              ].map(item=>(
                <button key={item.label} onClick={item.fn} style={{
                  display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",
                  background:"none",border:"none",color:C.textSec,fontSize:13,
                  textAlign:"left",cursor:"pointer",borderRadius:6,fontFamily:"inherit"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <item.Icon/>{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Type pills row — scrollable */}
      <div style={{display:"flex", gap:4, padding:"0 14px 10px",
        overflowX:"auto", scrollbarWidth:"none", msOverflowStyle:"none"}}>
        {types.map(t => {
          const on = activeType===t.type;
          return (
            <button key={t.type} onClick={()=>onTypeChange(t.type)}
              style={{padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:on?700:500,
                background:on?`rgba(${hexToRgb(t.color)},.18)`:"transparent",
                border:on?`1px solid rgba(${hexToRgb(t.color)},.5)`:`1px solid ${C.border}`,
                color:on?t.color:C.textMuted, whiteSpace:"nowrap", fontFamily:"inherit",
                cursor:"pointer", flexShrink:0, transition:"all .12s"}}>
              {t.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOQUE DE GUION
// ═══════════════════════════════════════════════════════════════════════════════

function ScriptBlock({ block, index, isActive, characterColors, onUpdate, onFocus,
  onKeyDown, inputRef, charSuggestions, onAcceptSuggestion, isMobile,
  onAddBlockAfter, onDeleteBlock }) {
  const color = characterColors[block.text?.trim()?.toUpperCase()] || C.green;
  const [showSug, setShowSug] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const base = {
    width:"100%", border:"none", outline:"none", background:"transparent",
    resize:"none", fontFamily:"'Courier Prime','Courier New',monospace",
    fontSize:isMobile?16:14, lineHeight:"1.8", caretColor:C.accent,
    overflow:"hidden", minHeight:isMobile?28:26, boxSizing:"border-box",
    display:"block", padding:0,
  };

  const styles = {
    [T.SCENE]:      {...base, fontWeight:700, color:C.accentWarm, textTransform:"uppercase", letterSpacing:.5},
    [T.ACTION]:     {...base, color:"#C5D0E6"},
    [T.CHARACTER]:  {...base, textAlign:"center", fontWeight:700, textTransform:"uppercase", color},
    [T.PAREN]:      {...base, paddingLeft:isMobile?"18%":"26%", paddingRight:isMobile?"18%":"26%", color:"#F4A96D", fontStyle:"italic"},
    [T.DIALOGUE]:   {...base, paddingLeft:isMobile?"10%":"18%", paddingRight:isMobile?"10%":"18%", color:C.textPrimary},
    [T.TRANSITION]: {...base, textAlign:"right", fontWeight:700, textTransform:"uppercase", color:C.purple},
  };

  const wrappers = {
    [T.SCENE]:      {marginTop:isMobile?24:32, paddingTop:14, borderTop:`1px solid ${C.border}`},
    [T.CHARACTER]:  {marginTop:isMobile?14:20},
    [T.TRANSITION]: {marginTop:isMobile?14:20},
    [T.PAREN]:      {},
    [T.DIALOGUE]:   {},
    [T.ACTION]:     {},
  };

  const hasNote = !!block.note?.trim();
  const col = typeColor(block.type);

  const handleChange = e => {
    onUpdate(index, e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    if (block.type===T.CHARACTER && charSuggestions.length>0) setShowSug(true);
  };

  return (
    <div style={{position:"relative", ...(wrappers[block.type]||{}),
      background:isActive?"rgba(91,141,239,0.03)":"transparent",
      borderLeft:isActive?`2px solid rgba(91,141,239,.4)`:"2px solid transparent",
      paddingLeft:8, paddingRight:0, borderRadius:4, transition:"background .1s"}}
      onClick={()=>onFocus(index)}>

      {/* Type badge — desktop only, left gutter, with tooltip */}
      {isActive && !isMobile && (
        <div style={{position:"absolute", left:-48, top:0, fontSize:8, fontWeight:700,
          color:col, letterSpacing:.5, textTransform:"uppercase",
          background:`rgba(${hexToRgb(col)},.1)`, padding:"2px 5px", borderRadius:3,
          border:`1px solid rgba(${hexToRgb(col)},.2)`, cursor:"help",
          userSelect:"none"}}
          title={`${typeName(block.type)}\n\n${typeTooltip(block.type)}`}>
          {typeLabel(block.type)}
        </div>
      )}

      {/* Note indicator */}
      {hasNote && (
        <div title={block.note} style={{position:"absolute", right:4, top:6,
          width:7, height:7, borderRadius:"50%", background:C.yellow,
          boxShadow:`0 0 6px ${C.yellow}80`}}/>
      )}

      <textarea ref={inputRef} value={block.text}
        onChange={handleChange}
        onFocus={()=>{onFocus(index);if(block.type===T.CHARACTER&&charSuggestions.length>0)setShowSug(true);}}
        onBlur={()=>setTimeout(()=>setShowSug(false),150)}
        onKeyDown={e=>{
          if (showSug && e.key==="ArrowDown" && charSuggestions.length>0) {
            e.preventDefault(); onAcceptSuggestion(charSuggestions[0]); setShowSug(false); return;
          }
          if (showSug && e.key==="Escape") { setShowSug(false); return; }
          onKeyDown(e, index);
        }}
        rows={1} style={styles[block.type]||base}
        placeholder={isActive ? getPlaceholder(block.type) : ""}
        spellCheck autoCorrect="on" autoCapitalize="sentences"/>

      {/* Autocomplete dropdown */}
      {showSug && block.type===T.CHARACTER && charSuggestions.length>0 && block.text.trim() && (
        <div style={{position:"absolute", left:"30%", top:"100%", zIndex:100,
          background:C.bgPanel, border:`1px solid ${C.borderBright}`, borderRadius:8,
          boxShadow:"0 8px 24px rgba(0,0,0,.5)", overflow:"hidden", minWidth:160}}>
          {charSuggestions.slice(0,5).map(name => (
            <div key={name} onClick={()=>{onAcceptSuggestion(name);setShowSug(false);}}
              style={{padding:"10px 14px", fontSize:13, color:characterColors[name]||C.green,
                fontFamily:"'Courier Prime',monospace", fontWeight:600, cursor:"pointer", transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {name}
            </div>
          ))}
        </div>
      )}

      {/* Mobile: long-press context menu (quick add below) */}
      {isMobile && isActive && (
        <div style={{display:"flex", gap:4, marginTop:2, justifyContent:"flex-end"}}>
          <button onClick={e=>{e.stopPropagation();onAddBlockAfter(index);}}
            style={{background:"none",border:`1px solid ${C.border}`,
              borderRadius:5,padding:"2px 8px",fontSize:10,color:C.textMuted,
              cursor:"pointer",fontFamily:"inherit"}}>
            + bloque
          </button>
          {block.text==="" && (
            <button onClick={e=>{e.stopPropagation();onDeleteBlock(index);}}
              style={{background:"none",border:`1px solid rgba(240,96,96,.25)`,
                borderRadius:5,padding:"3px 7px",color:C.red,
                cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center"}}>
              <Icons.Close style={{width:10,height:10}}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: SESIÓN DE USUARIO
// ═══════════════════════════════════════════════════════════════════════════════

function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  return session;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANTALLA DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

function AuthScreen({ isDark, onToggleTheme }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  const handleSubmit = async () => {
    if (!email.trim() || (!password.trim() && mode !== "forgot")) return;
    setLoading(true); reset();
    try {
      if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError(e.message);
      } else if (mode === "register") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else setSuccess("Revisá tu email para confirmar la cuenta.");
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email);
        if (e) setError(e.message);
        else setSuccess("Te enviamos un link para restablecer tu contraseña.");
      }
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
    borderRadius:10, padding:"13px 16px", color:C.textPrimary, fontSize:15,
    outline:"none", transition:"border-color .15s", fontFamily:"inherit",
    boxSizing:"border-box",
  };

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:C.bgApp, padding:"24px 16px",
    }}>
      {/* Theme toggle top-right */}
      <button onClick={onToggleTheme} title={isDark?"Modo día":"Modo noche"}
        style={{position:"fixed", top:16, right:16, background:"none", border:"none",
          color:C.textMuted, cursor:"pointer", padding:8, borderRadius:8,
          display:"flex", alignItems:"center"}}
        onMouseEnter={e=>e.currentTarget.style.color=C.textSec}
        onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
        {isDark ? <Icons.Sun/> : <Icons.Moon/>}
      </button>

      {/* Logo */}
      <div style={{marginBottom:32}}>
        <svg width="80" height="62" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="52" height="40" rx="7"
            fill={isDark ? "#0E1015" : "#E8EAF0"}
            stroke={isDark ? "#252840" : "#C4CBDE"} strokeWidth="0.75"/>
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E2235":"#C4CBDE"}/>
          <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700" fill={isDark?"#E4E8F0":"#1A1F2E"}
            textAnchor="middle" letterSpacing="2">PLANO</text>
          <rect x="10" y="28" width="30" height="1.5" rx="0.75"
            fill={isDark?"#5B8DEF":"#4A7DE8"} opacity="0.9"/>
          <rect x="38.5" y="14" width="2" height="14" rx="1" fill={isDark?"#5B8DEF":"#4A7DE8"}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
      </div>

      {/* Card */}
      <div style={{
        width:"100%", maxWidth:400,
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:16, padding:"32px 28px",
        boxShadow:`0 24px 60px ${C.shadow}`,
      }}>
        <h1 style={{
          fontFamily:"'Courier Prime',monospace", fontSize:22, fontWeight:700,
          color:C.textPrimary, margin:"0 0 4px", letterSpacing:-.3,
        }}>
          {mode==="login" ? "Bienvenido" : mode==="register" ? "Crear cuenta" : "Restablecer contraseña"}
        </h1>
        <p style={{fontSize:13, color:C.textMuted, margin:"0 0 28px"}}>
          {mode==="login" ? "Ingresá a tu cuenta de Plano." :
           mode==="register" ? "Tus guiones guardados en la nube." :
           "Te enviamos un link a tu email."}
        </p>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <input
            type="email" value={email} onChange={e=>{setEmail(e.target.value);reset();}}
            placeholder="tu@email.com" autoComplete="email"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.accent}
            onBlur={e=>e.target.style.borderColor=C.borderBright}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          />
          {mode !== "forgot" && (
            <input
              type="password" value={password} onChange={e=>{setPassword(e.target.value);reset();}}
              placeholder="Contraseña" autoComplete={mode==="register"?"new-password":"current-password"}
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=C.accent}
              onBlur={e=>e.target.style.borderColor=C.borderBright}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
            />
          )}

          {error && (
            <p style={{fontSize:12, color:C.red, margin:0, padding:"10px 14px",
              background:`rgba(240,96,96,.08)`, borderRadius:8,
              border:`1px solid rgba(240,96,96,.2)`}}>{error}</p>
          )}
          {success && (
            <p style={{fontSize:12, color:C.green, margin:0, padding:"10px 14px",
              background:`rgba(63,202,140,.08)`, borderRadius:8,
              border:`1px solid rgba(63,202,140,.2)`}}>{success}</p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width:"100%", padding:"13px", borderRadius:10, border:"none",
              background:C.accent, color:"#fff", fontSize:15, fontWeight:600,
              cursor:loading?"wait":"pointer", transition:"opacity .15s",
              opacity:loading?.65:1, fontFamily:"inherit", marginTop:4,
            }}>
            {loading ? "Un momento..." :
             mode==="login" ? "Entrar" :
             mode==="register" ? "Crear cuenta" : "Enviar link"}
          </button>
        </div>

        {/* Links inferiores */}
        <div style={{marginTop:22, display:"flex", flexDirection:"column", gap:8, alignItems:"center"}}>
          {mode==="login" && (<>
            <button onClick={()=>{setMode("forgot");reset();}} style={{
              background:"none", border:"none", color:C.textMuted, fontSize:12,
              cursor:"pointer", padding:0, fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.textSec}
              onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
              ¿Olvidaste tu contraseña?
            </button>
            <p style={{fontSize:13, color:C.textMuted, margin:0}}>
              ¿No tenés cuenta?{" "}
              <button onClick={()=>{setMode("register");reset();}} style={{
                background:"none", border:"none", color:C.accent, fontSize:13,
                cursor:"pointer", padding:0, fontWeight:600, fontFamily:"inherit"}}>
                Registrate
              </button>
            </p>
          </>)}
          {mode==="register" && (
            <p style={{fontSize:13, color:C.textMuted, margin:0}}>
              ¿Ya tenés cuenta?{" "}
              <button onClick={()=>{setMode("login");reset();}} style={{
                background:"none", border:"none", color:C.accent, fontSize:13,
                cursor:"pointer", padding:0, fontWeight:600, fontFamily:"inherit"}}>
                Iniciá sesión
              </button>
            </p>
          )}
          {mode==="forgot" && (
            <button onClick={()=>{setMode("login");reset();}} style={{
              background:"none", border:"none", color:C.textMuted, fontSize:12,
              cursor:"pointer", padding:0, fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.textSec}
              onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
              ← Volver al login
            </button>
          )}
        </div>
      </div>

      <p style={{marginTop:20, fontSize:11, color:C.textFaint, textAlign:"center"}}>
        Plano Screenwriting · tus guiones siempre disponibles
      </p>
    </div>
  );
}



const DEFAULT_PROJECT = () => ({
  id: uid(), name: "Mi Primer Guion", createdAt: Date.now(),
  blocks: [
    {id:uid(), type:T.SCENE,      text:"INT. CAFÉ — NOCHE", note:""},
    {id:uid(), type:T.ACTION,     text:"El café está casi vacío. Una lámpara parpadeante ilumina la barra de madera desgastada.", note:""},
    {id:uid(), type:T.CHARACTER,  text:"SOFÍA", note:""},
    {id:uid(), type:T.DIALOGUE,   text:"¿Cuánto tiempo llevas esperando?", note:""},
    {id:uid(), type:T.CHARACTER,  text:"RODRIGO", note:""},
    {id:uid(), type:T.PAREN,      text:"(sin levantar la vista)", note:""},
    {id:uid(), type:T.DIALOGUE,   text:"Lo suficiente como para saber que no ibas a venir.", note:""},
    {id:uid(), type:T.TRANSITION, text:"CORTE A:", note:""},
    {id:uid(), type:T.SCENE,      text:"EXT. CALLE MOJADA — NOCHE CONTINUA", note:""},
    {id:uid(), type:T.ACTION,     text:"Sofía camina rápido bajo la lluvia. Sus pasos resuenan en el asfalto vacío.", note:""},
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const session = useAuth();

  // ── Tema día/noche ─────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("plano-theme") !== "light"; } catch { return true; }
  });
  useEffect(() => {
    Object.assign(C, isDark ? DARK : LIGHT);
    try { localStorage.setItem("plano-theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);
  const toggleTheme = useCallback(() => setIsDark(v => !v), []);

  // ── Cargando sesión ────────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{minHeight:"100dvh", display:"flex", alignItems:"center",
        justifyContent:"center", background:C.bgApp}}>
        <div style={{color:C.textMuted, fontSize:13, fontFamily:"'Courier Prime',monospace",
          letterSpacing:2}}>PLANO</div>
      </div>
    );
  }

  // ── Sin sesión → pantalla de login ────────────────────────────────────────
  if (!session) {
    return (
      <>
        <InjectStyles theme={isDark?"dark":"light"}/>
        <AuthScreen isDark={isDark} onToggleTheme={toggleTheme}/>
      </>
    );
  }

  // ── Con sesión → app completa ──────────────────────────────────────────────
  return <PlanoApp session={session} isDark={isDark} toggleTheme={toggleTheme}/>;
}

function PlanoApp({ session, isDark, toggleTheme }) {
  // ── Proyectos ──────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const project = projects.find(p=>p.id===selectedId) || projects[0];

  // Cargar guiones del usuario desde Supabase
  useEffect(() => {
    async function load() {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from("scripts")
        .select("id, name, blocks, updated_at")
        .order("updated_at", { ascending: false });
      if (!error && data) {
        if (data.length === 0) {
          // Primer uso: crear guion de ejemplo
          const def = DEFAULT_PROJECT();
          const { data: created } = await supabase
            .from("scripts")
            .insert({ name: def.name, blocks: def.blocks })
            .select()
            .single();
          if (created) { setProjects([created]); setSelectedId(created.id); }
        } else {
          setProjects(data);
          setSelectedId(data[0].id);
        }
      }
      setLoadingProjects(false);
    }
    load();
  }, []);

  // ── Bloques con undo/redo ──────────────────────────────────────────────────
  const [blocks, setBlocksRaw, undo, redo, canUndo, canRedo] = useUndoable(project?.blocks||[]);

  const lastProjectId = useRef(selectedId);
  useEffect(() => {
    if (selectedId !== lastProjectId.current) {
      lastProjectId.current = selectedId;
      setBlocksRaw(project?.blocks||[]);
    }
  }, [selectedId]);

  const saveTimer = useRef(null);

  const updateBlocks = useCallback(nb => {
    setBlocksRaw(nb);
    setProjects(prev => prev.map(p => p.id===selectedId ? {...p, blocks:nb} : p));
  }, [selectedId, setBlocksRaw]);

  // ── Autosave a Supabase ────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!selectedId || loadingProjects) return;
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const p = projects.find(x=>x.id===selectedId);
      if (p) {
        await supabase
          .from("scripts")
          .update({ blocks: p.blocks, updated_at: new Date().toISOString() })
          .eq("id", selectedId);
      }
      setSaving(false);
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [projects, selectedId]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const [navTab, setNavTab] = useState("editor");
  const [mobileTab, setMobileTab] = useState("editor");
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const inputRefs = useRef({});
  const editorRef = useRef(null);

  // ── Mobile detection ───────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);


  // ── Auto-resize on project change ──────────────────────────────────────────
  useEffect(() => {
    setActiveIndex(0);
    setTimeout(() => {
      Object.values(inputRefs.current).forEach(r => {
        if (r) { r.style.height="auto"; r.style.height=r.scrollHeight+"px"; }
      });
    }, 40);
  }, [selectedId]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if ((e.ctrlKey||e.metaKey) && e.key==="z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && (e.key==="y"||(e.key==="z"&&e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey||e.metaKey) && e.key==="f") {
        e.preventDefault();
        if (isMobile) setMobileTab("search");
        else setNavTab("search");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, isMobile]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const characters = useMemo(() => extractCharacters(blocks), [blocks]);
  const scenes = useMemo(() => extractScenes(blocks), [blocks]);
  const words = useMemo(() => countWords(blocks), [blocks]);
  const pages = useMemo(() => estimatePages(blocks), [blocks]);
  const characterColors = useMemo(() => {
    const m = {}; Object.entries(characters).forEach(([n,i])=>{ m[n]=i.color; }); return m;
  }, [characters]);
  const stats = {
    words, pages, scenes:scenes.length, characters:Object.keys(characters).length,
    dialogues:blocks.filter(b=>b.type===T.DIALOGUE).length, blocks:blocks.length
  };

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (searchQuery.length<2) return [];
    const q = searchQuery.toLowerCase();
    return blocks.map((b,i)=>({...b,index:i})).filter(b=>b.text?.toLowerCase().includes(q)).map(b => {
      const esc = searchQuery.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const re = new RegExp(`(${esc})`,"gi");
      const highlighted = (b.text||"").replace(re,"<mark>$1</mark>");
      return {...b, highlighted};
    });
  }, [blocks, searchQuery]);

  // ── Autocomplete personajes ────────────────────────────────────────────────
  const charSuggestions = useMemo(() => {
    const b = blocks[activeIndex];
    if (!b || b.type!==T.CHARACTER || !b.text.trim()) return [];
    const q = b.text.trim().toUpperCase();
    return Object.keys(characters).filter(n => n.startsWith(q) && n!==q);
  }, [blocks, activeIndex, characters]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const updateBlock = useCallback((index, text) => {
    updateBlocks(blocks.map((b,i) => i===index ? {...b, text} : b));
  }, [blocks, updateBlocks]);

  const updateNote = useCallback((index, note) => {
    updateBlocks(blocks.map((b,i) => i===index ? {...b, note} : b));
  }, [blocks, updateBlocks]);

  const handleKeyDown = useCallback((e, index) => {
    const block = blocks[index];
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      const nb = {id:uid(), type:nextType(block.type), text:"", note:""};
      const updated = [...blocks]; updated.splice(index+1, 0, nb);
      updateBlocks(updated);
      setTimeout(() => { inputRefs.current[index+1]?.focus(); setActiveIndex(index+1); }, 10);
    }
    if (e.key==="Backspace" && block.text==="" && blocks.length>1) {
      e.preventDefault();
      updateBlocks(blocks.filter((_,i) => i!==index));
      const prev = Math.max(0, index-1);
      setTimeout(() => { inputRefs.current[prev]?.focus(); setActiveIndex(prev); }, 10);
    }
    if (e.key==="Tab") {
      e.preventDefault();
      const order = [T.SCENE, T.ACTION, T.CHARACTER, T.PAREN, T.DIALOGUE, T.TRANSITION];
      const cur = order.indexOf(block.type);
      const nxt = e.shiftKey ? order[(cur-1+order.length)%order.length] : order[(cur+1)%order.length];
      updateBlocks(blocks.map((b,i) => i===index ? {...b, type:nxt} : b));
    }
    if (e.key==="ArrowUp" && index>0) { e.preventDefault(); inputRefs.current[index-1]?.focus(); setActiveIndex(index-1); }
    if (e.key==="ArrowDown" && index<blocks.length-1) { e.preventDefault(); inputRefs.current[index+1]?.focus(); setActiveIndex(index+1); }
  }, [blocks, updateBlocks]);

  const changeType = useCallback(type => {
    updateBlocks(blocks.map((b,i) => i===activeIndex ? {...b, type} : b));
  }, [activeIndex, blocks, updateBlocks]);

  const scrollToBlock = useCallback(index => {
    setActiveIndex(index);
    // switch to editor on mobile
    if (isMobile) setMobileTab("editor");
    setTimeout(() => {
      inputRefs.current[index]?.scrollIntoView({behavior:"smooth", block:"center"});
      inputRefs.current[index]?.focus();
    }, 50);
  }, [isMobile]);

  const addBlockAfter = useCallback(index => {
    const nb = {id:uid(), type:nextType(blocks[index]?.type||T.ACTION), text:"", note:""};
    const updated = [...blocks]; updated.splice(index+1, 0, nb);
    updateBlocks(updated);
    setTimeout(() => { inputRefs.current[index+1]?.focus(); setActiveIndex(index+1); }, 10);
  }, [blocks, updateBlocks]);

  const deleteBlock = useCallback(index => {
    if (blocks.length<=1) return;
    updateBlocks(blocks.filter((_,i)=>i!==index));
    const prev = Math.max(0, index-1);
    setTimeout(() => { inputRefs.current[prev]?.focus(); setActiveIndex(prev); }, 10);
  }, [blocks, updateBlocks]);

  // ── Proyectos CRUD ─────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const { data, error } = await supabase
      .from("scripts")
      .insert({ name: newProjectName.trim(), blocks: [{id:uid(), type:T.SCENE, text:"", note:""}] })
      .select()
      .single();
    if (!error && data) {
      setProjects(prev => [data, ...prev]);
      setSelectedId(data.id);
    }
    setNewProjectName("");
    setNewProjectModal(false);
  };

  const deleteProject = async id => {
    if (projects.length===1) return;
    if (!confirm("¿Eliminar este guion? Esta acción no se puede deshacer.")) return;
    await supabase.from("scripts").delete().eq("id", id);
    const updated = projects.filter(p=>p.id!==id);
    setProjects(updated);
    if (selectedId===id) setSelectedId(updated[0].id);
  };

  const renameProject = async (id, name) => {
    setProjects(prev => prev.map(p => p.id===id ? {...p, name} : p));
    await supabase.from("scripts").update({ name }).eq("id", id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeTab = isMobile ? mobileTab : navTab;
  const showEditor = activeTab==="editor" || !isMobile;

  const editorContent = loadingProjects ? (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bgEditor, color:C.textMuted, fontSize:13,
      fontFamily:"'Courier Prime',monospace", letterSpacing:2}}>
      Cargando guiones…
    </div>
  ) : (
    <div ref={editorRef} style={{
      flex:1, overflowY:"auto",
      padding:focusMode
        ? "40px 20px 80px"
        : isMobile
          ? "16px 14px calc(env(safe-area-inset-bottom, 0px) + 80px)"
          : "28px 48px 80px",
      background:focusMode ? C.bgApp : C.bgEditor,
      transition:"background .3s",
    }}>
      <div style={{maxWidth:focusMode?580:680, margin:"0 auto",
        paddingLeft:isMobile?0:50}}>
        {blocks.map((block, index) => (
          <ScriptBlock key={block.id} block={block} index={index}
            isActive={index===activeIndex} characterColors={characterColors}
            onUpdate={updateBlock} onFocus={setActiveIndex}
            onKeyDown={handleKeyDown} isMobile={isMobile}
            charSuggestions={index===activeIndex ? charSuggestions : []}
            onAcceptSuggestion={name=>updateBlock(index,name)}
            onAddBlockAfter={addBlockAfter}
            onDeleteBlock={deleteBlock}
            inputRef={el=>{
              if(el) inputRefs.current[index]=el;
              else delete inputRefs.current[index];
            }}/>
        ))}

        {/* Add at end */}
        <div onClick={()=>{
            const nb = {id:uid(), type:T.ACTION, text:"", note:""};
            const updated = [...blocks, nb];
            updateBlocks(updated);
            setTimeout(() => {
              const i = updated.length-1;
              inputRefs.current[i]?.focus(); setActiveIndex(i);
            }, 10);
          }}
          style={{marginTop:isMobile?24:32, paddingTop:14,
            borderTop:`1px dashed ${C.border}`,
            textAlign:"center", color:C.textFaint, fontSize:13, cursor:"pointer",
            transition:"color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.color=C.textMuted}
          onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
          + agregar elemento
        </div>
      </div>
    </div>
  );

  const commonPanelProps = {
    projects, selectedId,
    onSelectProject: id=>{setSelectedId(id);},
    onNewProject: ()=>setNewProjectModal(true),
    onDeleteProject: deleteProject,
    onRenameProject: renameProject,
    scenes, characters, activeBlock:activeIndex, blocks,
    onNoteChange: updateNote, stats,
    onSceneClick: scrollToBlock,
    searchQuery, onSearchQuery: setSearchQuery, searchResults,
  };

  // ── Actualizar C sincrónicamente antes del render ──────────────────────────
  // Esto evita el glitch donde componentes internos leen valores viejos de C
  Object.assign(C, isDark ? DARK : LIGHT);

  return (
    <>
      <InjectStyles theme={isDark?"dark":"light"}/>

      {/* Modal de exportación PDF */}
      {showExportModal && (
        <ExportPDFModal
          blocks={blocks}
          projectName={project?.name||"Guion"}
          isDark={isDark}
          onClose={()=>setShowExportModal(false)}
        />
      )}

      {/* Modal de ayuda */}
      {showHelpModal && (
        <HelpModal isDark={isDark} onClose={()=>setShowHelpModal(false)}/>
      )}

      <div style={{display:"flex", height:"100dvh", overflow:"hidden", background:C.bgApp, transition:"background .2s"}}>

        {/* ── DESKTOP ── */}
        {!isMobile && (
          <>
            {/* Left icon nav */}
            {!focusMode && (
              <NavSidebar tab={navTab} onTab={t=>{setNavTab(t);}} saving={saving} isDark={isDark} onToggleTheme={toggleTheme} onSignOut={signOut} userEmail={session.user.email} onHelp={()=>setShowHelpModal(true)}/>
            )}

            {/* Center column */}
            <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
              {!focusMode && (
                <>
                  <Toolbar
                    activeType={blocks[activeIndex]?.type||T.ACTION}
                    onTypeChange={changeType}
                    onExport={()=>setShowExportModal(true)}
                    onExportFountain={()=>exportToFountain(blocks, project?.name||"Guion")}
                    projectName={project?.name} saving={saving}
                    canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
                    focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}
                    isMobile={false}/>
                  {/* Script header */}
                  <div style={{padding:"7px 24px", background:C.bgPanel,
                    borderBottom:`1px solid ${C.border}`,
                    display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", minHeight:36}}>
                    <h1 style={{margin:0, fontSize:14, fontWeight:700, color:C.accent,
                      fontFamily:"'Courier Prime',monospace", letterSpacing:-.2,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:280}}>
                      {project?.name}
                    </h1>
                    <span style={{fontSize:11, color:C.textMuted}}>
                      {words} palabras · ~{pages} pág · {scenes.length} esc
                    </span>
                    <span style={{fontSize:11, color:C.textFaint, marginLeft:"auto"}}>
                      Tab = tipo · Enter = siguiente · Ctrl+Z = deshacer · Ctrl+F = buscar
                    </span>
                  </div>
                </>
              )}

              {/* Focus mode exit */}
              {focusMode && (
                <div style={{position:"fixed", top:14, right:14, zIndex:500}}>
                  <Btn onClick={()=>setFocusMode(false)} variant="outline"
                    style={{fontSize:11, padding:"5px 12px", gap:6}}><Icons.Close style={{width:11,height:11}}/>Salir del foco</Btn>
                </div>
              )}

              {editorContent}
            </div>

            {/* Right panel */}
            {!focusMode && navTab!=="editor" && (
              <RightPanel tab={navTab} {...commonPanelProps} isMobile={false}/>
            )}
          </>
        )}

        {/* ── MOBILE ── */}
        {isMobile && (
          <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>

            {/* Mobile header — only when in editor tab */}
            {mobileTab==="editor" && !focusMode && (
              <MobileEditorHeader
                projectName={project?.name}
                words={words} pages={pages} scenes={scenes.length}
                saving={saving}
                activeType={blocks[activeIndex]?.type||T.ACTION}
                onTypeChange={changeType}
                canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
                onExport={()=>setShowExportModal(true)}
                onExportFountain={()=>exportToFountain(blocks, project?.name||"Guion")}
                focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}/>
            )}

            {/* Focus mode exit */}
            {focusMode && (
              <div style={{position:"fixed", top:14, right:14, zIndex:500}}>
                <Btn onClick={()=>setFocusMode(false)} variant="outline"
                  style={{fontSize:12, padding:"6px 14px", gap:6}}><Icons.Close style={{width:11,height:11}}/>Salir</Btn>
              </div>
            )}

            {/* Editor */}
            {mobileTab==="editor" && editorContent}

            {/* Other tabs = full-screen panel */}
            {mobileTab!=="editor" && (
              <MobilePanel tab={mobileTab}
                {...commonPanelProps}
                onBack={()=>setMobileTab("editor")}/>
            )}

            {/* Bottom nav */}
            {!focusMode && (
              <MobileBottomNav tab={mobileTab} onTab={t=>{
                setMobileTab(t);
                if (t==="editor") {
                  setTimeout(()=>inputRefs.current[activeIndex]?.focus(), 100);
                }
              }} saving={saving} isDark={isDark} onToggleTheme={toggleTheme} onHelp={()=>setShowHelpModal(true)}/>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo guion */}
      <Modal open={newProjectModal} onClose={()=>setNewProjectModal(false)} title="Nuevo guion" width={380}>
        <p style={{fontSize:13, color:C.textSec, marginBottom:12}}>Dale un nombre a tu guion:</p>
        <input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)}
          placeholder="Ej: El último café" autoFocus
          onKeyDown={e=>{if(e.key==="Enter")createProject();}}
          style={{width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
            borderRadius:9, padding:"11px 14px", color:C.textPrimary, fontSize:14,
            outline:"none", marginBottom:16, transition:"border-color .14s"}}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.borderBright}/>
        <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
          <Btn onClick={()=>setNewProjectModal(false)} variant="outline">Cancelar</Btn>
          <Btn onClick={createProject} variant="primary" disabled={!newProjectName.trim()}>Crear guion</Btn>
        </div>
      </Modal>
    </>
  );
}
