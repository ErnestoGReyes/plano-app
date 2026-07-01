import { T } from "../design/tokens";
import { uid } from "./screenplay";

export function parseFountain(text) {
  const blocks = [];
  const lines = text.split("\n");
  let i = 0;

  const push = (type, text) => {
    if (text.trim()) blocks.push({ id: uid(), type, text: text.trim(), note: "" });
  };

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const next = lines[i + 1]?.trimEnd() ?? "";
    const prev = lines[i - 1]?.trimEnd() ?? "";

    // Ignorar metadatos al inicio (Title:, Author:, etc.)
    if (i === 0 && /^[A-Za-z ]+:/.test(line)) { i++; continue; }

    // Línea vacía
    if (!line.trim()) { i++; continue; }

    // Encabezado de escena: INT. / EXT. / INT./EXT. o forzado con .
    if (/^(INT|EXT|INT\.\/EXT|I\/E)[.\s]/i.test(line) || /^\.[A-Z]/.test(line)) {
      push(T.SCENE, line.startsWith(".") ? line.slice(1) : line);
      i++; continue;
    }

    // Transición: termina en "TO:" o es FADE IN/OUT etc., línea anterior vacía
    if (/^(FADE|CUT|SMASH|MATCH|DISSOLVE|WIPE)/.test(line) && prev === "") {
      push(T.TRANSITION, line);
      i++; continue;
    }

    // Personaje: mayúsculas, línea anterior vacía, línea siguiente no vacía
    if (line === line.toUpperCase() && line.trim().length > 0
        && /[A-Z]/.test(line) && prev === "" && next.trim() !== ""
        && !/^(INT|EXT)/.test(line) && !line.startsWith("!")) {
      push(T.CHARACTER, line.replace(/\s*\(.*\)\s*$/, "").trim());
      i++;
      // Acotación después del personaje
      if (lines[i]?.trim().startsWith("(")) {
        push(T.PAREN, lines[i].trim());
        i++;
      }
      // Diálogo
      while (i < lines.length && lines[i].trim() !== "") {
        if (lines[i].trim().startsWith("(")) push(T.PAREN, lines[i].trim());
        else push(T.DIALOGUE, lines[i].trim());
        i++;
      }
      continue;
    }

    // Acción
    push(T.ACTION, line.startsWith("!") ? line.slice(1) : line);
    i++;
  }

  return blocks.length > 0 ? blocks : [{ id: uid(), type: T.SCENE, text: "", note: "" }];
}

export function exportToFountain(blocks, projectName) {
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
