import { describe, it, expect } from "vitest";
import { T } from "../design/tokens";
import {
  normalizeNote,
  buildSceneGroups,
  flattenSceneGroups,
  estimateDuration,
  formatDuration,
  DEFAULT_DURATION_CONFIG,
  countWords,
  estimatePages,
} from "./screenplay";

// Helper para no repetir uid() + shape de bloque en cada test.
let _id = 0;
const block = (type, text = "", extra = {}) => ({ id: `b${_id++}`, type, text, ...extra });

describe("normalizeNote", () => {
  it("devuelve el default cuando la nota es null/undefined", () => {
    expect(normalizeNote(null)).toEqual({ text: "", category: "general", onScreen: true });
    expect(normalizeNote(undefined)).toEqual({ text: "", category: "general", onScreen: true });
  });

  it("acepta el formato viejo: un string simple", () => {
    expect(normalizeNote("revisar este tono")).toEqual({
      text: "revisar este tono", category: "general", onScreen: true,
    });
  });

  it("acepta el string vacío como nota vacía (no como 'sin nota')", () => {
    // "" es falsy en JS, así que cae en la rama !note — igual que null.
    expect(normalizeNote("")).toEqual({ text: "", category: "general", onScreen: true });
  });

  it("acepta un objeto nuevo completo tal cual", () => {
    const note = { text: "chequear raccord", category: "camera", onScreen: false };
    expect(normalizeNote(note)).toEqual(note);
  });

  it("completa campos faltantes de un objeto parcial con los defaults", () => {
    expect(normalizeNote({ text: "algo" })).toEqual({
      text: "algo", category: "general", onScreen: true,
    });
  });

  it("onScreen solo es false si se pasó explícitamente false (no undefined)", () => {
    expect(normalizeNote({ text: "x", onScreen: undefined }).onScreen).toBe(true);
    expect(normalizeNote({ text: "x", onScreen: false }).onScreen).toBe(false);
  });
});

describe("buildSceneGroups / flattenSceneGroups", () => {
  it("agrupa bloques bajo el heading de escena más cercano hacia arriba", () => {
    const blocks = [
      block(T.SCENE, "INT. COCINA - DÍA"),
      block(T.ACTION, "Juan entra."),
      block(T.CHARACTER, "JUAN"),
      block(T.DIALOGUE, "Hola."),
      block(T.SCENE, "EXT. CALLE - NOCHE"),
      block(T.ACTION, "Llueve."),
    ];
    const { preamble, groups } = buildSceneGroups(blocks);

    expect(preamble).toEqual([]);
    expect(groups).toHaveLength(2);
    expect(groups[0].heading.text).toBe("INT. COCINA - DÍA");
    expect(groups[0].content).toHaveLength(3);
    expect(groups[1].heading.text).toBe("EXT. CALLE - NOCHE");
    expect(groups[1].content).toHaveLength(1);
  });

  it("los bloques antes de la primera escena van al preámbulo, no a un grupo", () => {
    const blocks = [
      block(T.ACTION, "Suena un teléfono en la oscuridad."),
      block(T.SCENE, "INT. OFICINA - DÍA"),
      block(T.ACTION, "Se enciende la luz."),
    ];
    const { preamble, groups } = buildSceneGroups(blocks);

    expect(preamble).toHaveLength(1);
    expect(preamble[0].text).toBe("Suena un teléfono en la oscuridad.");
    expect(groups).toHaveLength(1);
    expect(groups[0].content).toHaveLength(1);
  });

  it("un guion sin ninguna escena todavía deja todo en el preámbulo", () => {
    const blocks = [block(T.ACTION, "Solo acción, sin encabezados todavía.")];
    const { preamble, groups } = buildSceneGroups(blocks);
    expect(preamble).toHaveLength(1);
    expect(groups).toHaveLength(0);
  });

  it("flattenSceneGroups reconstruye exactamente el array original", () => {
    const blocks = [
      block(T.ACTION, "Preámbulo."),
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.CHARACTER, "ANA"),
      block(T.DIALOGUE, "Buen día."),
      block(T.SCENE, "INT. CASA - NOCHE"),
      block(T.ACTION, "Se hace de noche."),
    ];
    const { preamble, groups } = buildSceneGroups(blocks);
    expect(flattenSceneGroups(preamble, groups)).toEqual(blocks);
  });

  it("flattenSceneGroups respeta un reordenamiento de escenas (drag & drop)", () => {
    const blocks = [
      block(T.SCENE, "ESCENA A"),
      block(T.ACTION, "contenido A"),
      block(T.SCENE, "ESCENA B"),
      block(T.ACTION, "contenido B"),
    ];
    const { preamble, groups } = buildSceneGroups(blocks);
    const reordered = [groups[1], groups[0]]; // se invierte el orden, como haría el corkboard
    const flat = flattenSceneGroups(preamble, reordered);
    expect(flat.map(b => b.text)).toEqual(["ESCENA B", "contenido B", "ESCENA A", "contenido A"]);
  });
});

describe("estimateDuration", () => {
  it("con velocidades por defecto, calcula segundos = (palabras/wpm)*60", () => {
    // 150 wpm dialogue → 25 palabras = 10s. 100 wpm action → 20 palabras = 12s.
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.CHARACTER, "ANA"),
      block(T.DIALOGUE, "una dos tres cuatro cinco seis siete ocho nueve diez " +
        "once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte " +
        "veintiuno veintidos veintitres veinticuatro veinticinco"),
      block(T.ACTION, "una dos tres cuatro cinco seis siete ocho nueve diez " +
        "once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte"),
    ];
    const { scenes, total } = estimateDuration(blocks);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].dialogueSeconds).toBeCloseTo(10, 5);
    expect(scenes[0].actionSeconds).toBeCloseTo(12, 5);
    expect(scenes[0].pauseSeconds).toBe(0);
    expect(scenes[0].totalSeconds).toBeCloseTo(22, 5);
    expect(total.totalSeconds).toBeCloseTo(22, 5);
  });

  it("acotaciones (PAREN) cuentan como diálogo, no como acción", () => {
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.PAREN, "uno dos tres"), // 3 palabras → a 150wpm = 1.2s
    ];
    const { total } = estimateDuration(blocks);
    expect(total.dialogueSeconds).toBeCloseTo(1.2, 5);
    expect(total.actionSeconds).toBe(0);
  });

  it("encabezado de escena y transición no suman tiempo propio", () => {
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA, PALABRAS DE MÁS EN EL ENCABEZADO"),
      block(T.TRANSITION, "CORTE A ALGUN LADO"),
    ];
    const { total } = estimateDuration(blocks);
    expect(total.dialogueSeconds).toBe(0);
    expect(total.actionSeconds).toBe(0);
    expect(total.totalSeconds).toBe(0);
  });

  it("respeta una config parcial, mergeada sobre los defaults", () => {
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.DIALOGUE, "una dos tres"), // 3 palabras
    ];
    const rapido = estimateDuration(blocks, { wordsPerMinuteDialogue: 300 });
    const lento = estimateDuration(blocks, { wordsPerMinuteDialogue: 60 });
    expect(rapido.total.dialogueSeconds).toBeCloseTo((3/300)*60, 5); // 0.6s
    expect(lento.total.dialogueSeconds).toBeCloseTo((3/60)*60, 5);  // 3s
    // wordsPerMinuteAction no se tocó: sigue en el default.
    expect(rapido.config.wordsPerMinuteAction).toBe(DEFAULT_DURATION_CONFIG.wordsPerMinuteAction);
  });

  it("suma pauseSeconds manuales de cualquier bloque, incluso sin texto", () => {
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.ACTION, "", { pauseSeconds: 8 }), // plano contemplativo, sin texto
      block(T.DIALOGUE, "hola", { pauseSeconds: 2 }),
    ];
    const { scenes, total } = estimateDuration(blocks);
    expect(scenes[0].pauseSeconds).toBe(10);
    expect(total.pauseSeconds).toBe(10);
  });

  it("ignora pauseSeconds inválidos (negativos, cero, no numéricos)", () => {
    const blocks = [
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.ACTION, "x", { pauseSeconds: -5 }),
      block(T.ACTION, "x", { pauseSeconds: 0 }),
      block(T.ACTION, "x", { pauseSeconds: "10" }), // string, no number
    ];
    const { total } = estimateDuration(blocks);
    expect(total.pauseSeconds).toBe(0);
  });

  it("bloques sueltos antes de la primera escena (preámbulo) suman al total", () => {
    const blocks = [
      block(T.DIALOGUE, "uno dos tres"), // preámbulo, sin escena todavía
      block(T.SCENE, "INT. CASA - DÍA"),
      block(T.DIALOGUE, "cuatro cinco seis"),
    ];
    const { scenes, total } = estimateDuration(blocks);
    // El preámbulo no aparece como "tarjeta" de escena...
    expect(scenes).toHaveLength(1);
    // ...pero sí se cuenta en el total (6 palabras a 150wpm = 2.4s).
    expect(total.dialogueSeconds).toBeCloseTo((6/150)*60, 5);
  });

  it("un guion vacío no rompe nada", () => {
    const { scenes, total } = estimateDuration([]);
    expect(scenes).toEqual([]);
    expect(total).toEqual({ dialogueSeconds: 0, actionSeconds: 0, pauseSeconds: 0, totalSeconds: 0 });
  });

  it("una escena sin encabezado de texto usa 'Sin título'", () => {
    const blocks = [block(T.SCENE, ""), block(T.ACTION, "algo")];
    const { scenes } = estimateDuration(blocks);
    expect(scenes[0].heading).toBe("Sin título");
  });
});

describe("formatDuration", () => {
  it("formatea segundos como m:ss con padding de dos dígitos", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("redondea en vez de truncar", () => {
    expect(formatDuration(59.6)).toBe("1:00");
    expect(formatDuration(59.4)).toBe("0:59");
  });

  it("nunca devuelve segundos negativos", () => {
    expect(formatDuration(-30)).toBe("0:00");
  });
});

// Bonus barato: otras funciones puras del mismo archivo, ya que estamos.
describe("countWords / estimatePages", () => {
  it("countWords suma palabras de todos los bloques, ignorando espacios de más", () => {
    const blocks = [block(T.ACTION, "  hola   mundo  "), block(T.DIALOGUE, "una palabra")];
    expect(countWords(blocks)).toBe(4);
  });

  it("estimatePages nunca da menos de 1 página, incluso vacío", () => {
    expect(estimatePages([])).toBe(1);
    expect(estimatePages([block(T.ACTION, "x")])).toBe(1);
  });
});
