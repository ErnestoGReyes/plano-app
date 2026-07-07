import { T, CHARACTER_PALETTE_DARK, CHARACTER_PALETTE_LIGHT } from "../design/tokens";

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

export function extractCharacters(blocks, isDark = true) {
  const palette = isDark ? CHARACTER_PALETTE_DARK : CHARACTER_PALETTE_LIGHT;
  const map = {}; let ci = 0;
  blocks.forEach(b => {
    if (b.type === T.CHARACTER && b.text.trim()) {
      const n = b.text.trim().toUpperCase();
      if (!map[n]) { map[n] = { color: palette[ci++ % palette.length], lines: 0 }; }
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

// ═══════════════════════════════════════════════════════════════════════════
// NOTAS DE DIRECCIÓN
// ═══════════════════════════════════════════════════════════════════════════
// El campo `note` de un bloque empezó como un string simple (sinopsis en el
// corkboard, texto libre en el panel "Notas"). Ahora es un objeto:
//   { text, category, onScreen }
// normalizeNote() acepta strings viejos (proyectos guardados antes de este
// cambio) y objetos nuevos, así ningún dato existente se rompe.

export const NOTE_CATEGORIES = [
  { id:"general",  emoji:"📌", label:"General" },
  { id:"camera",   emoji:"🎥", label:"Cámara" },
  { id:"lighting", emoji:"💡", label:"Iluminación" },
  { id:"sound",    emoji:"🔊", label:"Sonido" },
  { id:"acting",   emoji:"🎭", label:"Actuación" },
  { id:"editing",  emoji:"🎬", label:"Montaje" },
];

export function noteCategoryMeta(id) {
  return NOTE_CATEGORIES.find(c => c.id === id) || NOTE_CATEGORIES[0];
}

// Reusa colores que ya existen en el theme (no hace falta sumar tokens nuevos)
export function noteCategoryColor(id, C) {
  return {
    general:C.textMuted, camera:C.purple, lighting:C.yellow,
    sound:C.accent, acting:C.green, editing:C.red,
  }[id] || C.textMuted;
}

export function normalizeNote(note) {
  if (!note) return { text:"", category:"general", onScreen:true };
  if (typeof note === "string") return { text:note, category:"general", onScreen:true };
  return { text:note.text||"", category:note.category||"general", onScreen: note.onScreen !== false };
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTIMACIÓN DE DURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
// A propósito, separado de estimatePages(): el paginado tradicional ("1 página
// ≈ 1 minuto") sigue siendo la referencia que usa la industria para presupuestar
// y programar rodajes. Esto es otro cálculo, basado en CONTENIDO real de cada
// escena (cuánto se habla, cuánta acción hay, cuántas pausas marcó el usuario) —
// pensado como un punto de partida EDITABLE, nunca como un número "verdad
// absoluta": ningún algoritmo puede saber cuánto dura en pantalla "Sofía entra
// lentamente" sin ver cómo se filma.

export const DEFAULT_DURATION_CONFIG = {
  wordsPerMinuteDialogue: 150, // qué tan rápido "habla" el diálogo — ajustable por proyecto/idioma
  wordsPerMinuteAction: 100,   // qué tan rápido se "lee" la acción como tiempo de pantalla
};

// Segundos de pausa manual en un bloque. Todavía no hay UI para cargar esto
// (eso es Fase 2) pero el campo ya existe en la estructura de datos —
// b.pauseSeconds, numérico — para no tener que romper nada cuando se agregue
// el input. Cualquier tipo de bloque puede tenerlo (un plano contemplativo
// suele marcarse sobre una ACTION, pero no lo restringimos).
function blockPauseSeconds(block) {
  const s = block?.pauseSeconds;
  return typeof s === "number" && s > 0 ? s : 0;
}

function wordsIn(block) {
  return block.text?.trim().split(/\s+/).filter(Boolean).length || 0;
}

// Suma tiempo de un conjunto de bloques (sin agrupar por escena) según su tipo:
// diálogo y acotación cuentan como habla; acción cuenta como tiempo visual.
// Encabezado de escena y transición ("CORTE A:") no suman tiempo propio — son
// instrucciones de montaje, no algo que ocurra en pantalla — pero sí pueden
// traer una pausa manual adjunta.
function estimateBlocksDuration(blocks, config) {
  let dialogueSeconds = 0, actionSeconds = 0, pauseSeconds = 0;
  blocks.forEach(b => {
    pauseSeconds += blockPauseSeconds(b);
    const words = wordsIn(b);
    if (words === 0) return;
    if (b.type === T.DIALOGUE || b.type === T.PAREN) {
      dialogueSeconds += (words / config.wordsPerMinuteDialogue) * 60;
    } else if (b.type === T.ACTION) {
      actionSeconds += (words / config.wordsPerMinuteAction) * 60;
    }
  });
  return { dialogueSeconds, actionSeconds, pauseSeconds };
}

// Desglose de duración por escena + total del guion. `config` es opcional y
// se mergea sobre DEFAULT_DURATION_CONFIG, así el caller solo pisa lo que
// quiere ajustar (ej. solo wordsPerMinuteDialogue si el proyecto es de diálogo
// muy rápido).
export function estimateDuration(blocks, config = {}) {
  const cfg = { ...DEFAULT_DURATION_CONFIG, ...config };
  const { preamble, groups } = buildSceneGroups(blocks);

  const scenes = groups.map(g => {
    const t = estimateBlocksDuration(g.content, cfg);
    return {
      id: g.id,
      heading: g.heading.text || "Sin título",
      dialogueSeconds: t.dialogueSeconds,
      actionSeconds: t.actionSeconds,
      pauseSeconds: t.pauseSeconds,
      totalSeconds: t.dialogueSeconds + t.actionSeconds + t.pauseSeconds,
    };
  });

  // Bloques sueltos antes de la primera escena (si los hay) también suman al
  // total, aunque no aparezcan como una "tarjeta" de escena en el desglose.
  const preambleTiming = estimateBlocksDuration(preamble, cfg);
  const base = {
    dialogueSeconds: preambleTiming.dialogueSeconds,
    actionSeconds: preambleTiming.actionSeconds,
    pauseSeconds: preambleTiming.pauseSeconds,
    totalSeconds: preambleTiming.dialogueSeconds + preambleTiming.actionSeconds + preambleTiming.pauseSeconds,
  };

  const total = scenes.reduce((acc, s) => ({
    dialogueSeconds: acc.dialogueSeconds + s.dialogueSeconds,
    actionSeconds: acc.actionSeconds + s.actionSeconds,
    pauseSeconds: acc.pauseSeconds + s.pauseSeconds,
    totalSeconds: acc.totalSeconds + s.totalSeconds,
  }), base);

  return { scenes, total, config: cfg };
}

// Formatea segundos como "1:23" / "12:04" — para no repetir el padding en
// cada componente que quiera mostrar esto (ej. el tab Stats).
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2,"0")}`;
}
