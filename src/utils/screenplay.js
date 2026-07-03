import { T, CHARACTER_PALETTE } from "../design/tokens";

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

export function nextType(type) {
  return {
    [T.SCENE]:T.ACTION, [T.ACTION]:T.ACTION, [T.CHARACTER]:T.DIALOGUE,
    [T.PAREN]:T.DIALOGUE, [T.DIALOGUE]:T.CHARACTER, [T.TRANSITION]:T.SCENE
  }[type] || T.ACTION;
}

export function getPlaceholder(type) {
  return {
    [T.SCENE]:"INT. LUGAR — DÍA", [T.ACTION]:"Descripción de la acción...",
    [T.CHARACTER]:"NOMBRE DEL PERSONAJE", [T.PAREN]:"(emoción o acotación)",
    [T.DIALOGUE]:"Línea de diálogo...", [T.TRANSITION]:"CORTE A:"
  }[type] || "";
}

export function typeLabel(type) {
  return { [T.SCENE]:"ESC",[T.ACTION]:"ACC",[T.CHARACTER]:"PER",
           [T.PAREN]:"ACO",[T.DIALOGUE]:"DIA",[T.TRANSITION]:"TRA" }[type] || "?";
}

export function typeName(type) {
  return { [T.SCENE]:"Encabezado de escena", [T.ACTION]:"Acción",
           [T.CHARACTER]:"Personaje", [T.PAREN]:"Acotación",
           [T.DIALOGUE]:"Diálogo", [T.TRANSITION]:"Transición" }[type] || "";
}

export function typeTooltip(type) {
  return {
    [T.SCENE]:     "Dónde y cuándo ocurre la escena.\nEj: INT. COCINA - DÍA",
    [T.ACTION]:    "Lo que se ve en pantalla: movimiento,\nambiente, descripción física.",
    [T.CHARACTER]: "Nombre del personaje que habla,\nsiempre en mayúsculas.",
    [T.PAREN]:     "Indicación breve sobre cómo se dice\nel diálogo o qué hace el personaje.\nEj: (susurrando)",
    [T.DIALOGUE]:  "Las palabras que dice el personaje.",
    [T.TRANSITION]:"Cambio de escena.\nEj: CORTE A: / FUNDIDO A NEGRO.",
  }[type] || "";
}

export function typeColor(type, C) {
  return { [T.SCENE]:C.accentWarm,[T.ACTION]:C.textSec,[T.CHARACTER]:C.green,
           [T.PAREN]:"#C0A060",[T.DIALOGUE]:C.accent,[T.TRANSITION]:C.purple }[type] || C.textSec;
}

export function extractCharacters(blocks) {
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

export function extractScenes(blocks) {
  return blocks.map((b,i) => b.type===T.SCENE ? {index:i, id:b.id, text:b.text||"Sin título"} : null).filter(Boolean);
}

// Agrupa los bloques en "escenas" (heading + contenido hasta la próxima heading).
// Los bloques antes de la primera heading quedan en un "preámbulo" fijo, no draggable.
export function buildSceneGroups(blocks) {
  const preamble = [];
  const groups = [];
  let current = null;
  blocks.forEach(b => {
    if (b.type === T.SCENE) {
      current = { id: b.id, heading: b, content: [] };
      groups.push(current);
    } else if (current) {
      current.content.push(b);
    } else {
      preamble.push(b);
    }
  });
  return { preamble, groups };
}

// Reconstruye el array plano de bloques a partir del preámbulo + grupos (en su orden actual)
export function flattenSceneGroups(preamble, groups) {
  return [...preamble, ...groups.flatMap(g => [g.heading, ...g.content])];
}

// Lee INT/EXT y DÍA/NOCHE de un heading tipo "INT. CASA - DÍA" para colorear tarjetas
export function parseSceneHeading(text="") {
  const t = text.toUpperCase();
  const isInt = /^INT/.test(t);
  const isExt = /^EXT/.test(t);
  const isNight = /NOCHE|NIGHT/.test(t);
  const isDay = /D[IÍ]A|DAY/.test(t);
  return {
    intExt: isInt && isExt ? "INT/EXT" : isInt ? "INT" : isExt ? "EXT" : null,
    time: isNight ? "NOCHE" : isDay ? "DÍA" : null,
  };
}

// Personajes (CHARACTER blocks) que aparecen dentro de una escena
export function charactersInScene(group) {
  const names = new Set();
  group.content.forEach(b => { if (b.type===T.CHARACTER && b.text?.trim()) names.add(b.text.trim().toUpperCase()); });
  return [...names];
}

export function countWords(blocks) {
  return blocks.reduce((a,b) => a + (b.text?.trim().split(/\s+/).filter(Boolean).length||0), 0);
}

export function estimatePages(blocks) {
  return Math.max(1, Math.ceil(blocks.reduce((a,b) => a + (b.text?.length||0), 0) / 1500));
}
