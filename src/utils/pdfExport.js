import { T } from "../design/tokens";
import { normalizeNote, noteCategoryMeta } from "./screenplay";

// ── Fuente usada para el guion ────────────────────────────────────────────
// Se declara una sola vez para que la MISMA cadena se use tanto para medir
// el ancho real del texto (canvas) como para renderizarlo (CSS). Si en algún
// momento cambia la fuente, alcanza con tocarla acá.
const FONT_STACK = `'Courier Prime', 'Courier New', Courier, monospace`;
const GOOGLE_FONT_HREF = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital@0;1&display=swap";

export async function exportToPDFPro(blocks, projectName, { format, author, sceneNumbers, noteCategories = [] }) {
  const isHollywood = format === "hollywood";
  const includeNotes = new Set(noteCategories);

  // Abrimos la ventana YA, de forma síncrona, para no chocar con el bloqueador
  // de pop-ups (los navegadores solo permiten window.open sin bloqueo dentro
  // del mismo gesto de click que disparó el export). El contenido real se
  // escribe más abajo, una vez terminado el cálculo async.
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <link rel="stylesheet" href="${GOOGLE_FONT_HREF}"/>
      <style>body{font-family:${FONT_STACK};font-size:13px;color:#666;
        display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f4f4f4}</style>
      </head><body>Generando PDF…</body></html>`);
    w.document.close();
  }

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

  // ── Medición real de texto (en vez de aproximar por cantidad de chars) ───
  // Antes se estimaba el ancho como cantidad_de_chars * 7.2pt asumiendo
  // Courier a 12pt. Eso rompía apenas la fuente real usada en pantalla no
  // coincidía exactamente con esa métrica (fuente no cargada, cursiva en
  // paréntesis/notas, tamaño distinto en notas, etc.), y las líneas
  // terminaban más largas de lo previsto, superponiéndose con el texto
  // vecino. Ahora medimos con un <canvas>, usando la MISMA fuente, tamaño
  // y estilo (normal/cursiva) con la que luego se va a imprimir.
  await ensureFontsLoaded();
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const PT_TO_PX = 96 / 72; // canvas trabaja en px, el layout está en pt

  const setFont = (sizePt, italic) => {
    ctx.font = `${italic ? "italic " : ""}${sizePt * PT_TO_PX}px ${FONT_STACK}`;
  };
  const measure = (text, sizePt, italic) => {
    setFont(sizePt, italic);
    return ctx.measureText(text).width / PT_TO_PX; // de vuelta a pt
  };

  // Corta el texto en líneas que efectivamente entran en maxWidth (pt),
  // midiendo el ancho real en vez de contar caracteres.
  const wrapText = (text, maxWidth, sizePt = 12, italic = false) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const wd of words) {
      const candidate = line ? `${line} ${wd}` : wd;
      if (measure(candidate, sizePt, italic) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // Palabra suelta más ancha que la columna: la dejamos en su propia
        // línea en vez de entrar en un loop infinito. Es un caso borde raro
        // (palabra muy larga) pero así no rompe la paginación.
        line = measure(wd, sizePt, italic) <= maxWidth ? wd : wd;
        if (measure(wd, sizePt, italic) > maxWidth) { lines.push(wd); line = ""; }
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

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
      elements.push({ type:"action", lines: wrapText(b.text, textW, 12, false) });
    } else if (t === T.CHARACTER) {
      elements.push({ type:"character", lines:[b.text.toUpperCase()] });
    } else if (t === T.PAREN) {
      const txt = b.text.startsWith("(") ? b.text : `(${b.text})`;
      elements.push({ type:"paren", lines: wrapText(txt, pos.parenW, 12, true) });
    } else if (t === T.DIALOGUE) {
      elements.push({ type:"dialogue", lines: wrapText(b.text, pos.dialogueW, 12, false) });
    } else if (t === T.TRANSITION) {
      elements.push({ type:"transition", lines:[b.text.toUpperCase()] });
    }

    // Nota de dirección — solo si su categoría fue elegida al exportar
    const note = normalizeNote(b.note);
    if (note.text.trim() && includeNotes.has(note.category)) {
      const meta = noteCategoryMeta(note.category);
      const label = `${meta.emoji} ${meta.label.toUpperCase()}: `;
      elements.push({ type:"note", lines: wrapText(label + note.text, textW, 9.5, true) });
    }
  });

  // ── Espaciado vertical por tipo (en puntos) ───────────────────────────────
  const LINE_H  = 14.4; // 12pt * 1.2
  const NOTE_LINE_H = 11.4; // 9.5pt * 1.2
  const spacing = {
    scene:      { before:24, after:12, lineH:LINE_H },
    action:     { before:0,  after:12, lineH:LINE_H },
    character:  { before:12, after:0,  lineH:LINE_H },
    paren:      { before:0,  after:0,  lineH:LINE_H },
    dialogue:   { before:0,  after:12, lineH:LINE_H },
    transition: { before:12, after:12, lineH:LINE_H },
    note:       { before:2,  after:10, lineH:NOTE_LINE_H },
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
    const blockH = sp.before + el.lines.length * sp.lineH + sp.after;
    if (y + blockH > page.h - page.mb && currentPage.length > 0) newPage();
    currentPage.push({ ...el, y: y + sp.before });
    y += blockH;
  });
  if (currentPage.length > 0) pages.push(currentPage);
  const totalPages = pages.length;

  // ── Render HTML ───────────────────────────────────────────────────────────
  // Renderizamos cada página como un div con position absolute children
  // para máximo control tipográfico
  const renderPage = (items, pageNum) => {
    const mr = page.mr;

    const renderItem = (el) => {
      const lineH = spacing[el.type].lineH;
      let html = "";
      if (el.type === "scene") {
        html = `<div style="position:absolute;top:${el.y}pt;left:${page.ml}pt;right:${mr}pt;
          font-weight:bold;text-decoration:underline;">${el.lines[0]}</div>`;
      } else if (el.type === "action") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*lineH}pt;left:${page.ml}pt;right:${mr}pt;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "character") {
        html = `<div style="position:absolute;top:${el.y}pt;left:${pos.character}pt;">${el.lines[0]}</div>`;
      } else if (el.type === "paren") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*lineH}pt;left:${pos.paren}pt;width:${pos.parenW}pt;font-style:italic;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "dialogue") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*lineH}pt;left:${pos.dialogue}pt;width:${pos.dialogueW}pt;">${ln || "&nbsp;"}</div>`
        ).join("");
      } else if (el.type === "transition") {
        html = `<div style="position:absolute;top:${el.y}pt;right:${mr}pt;font-weight:bold;">${el.lines[0]}</div>`;
      } else if (el.type === "note") {
        html = el.lines.map((ln, i) =>
          `<div style="position:absolute;top:${el.y + i*lineH}pt;left:${page.ml+14}pt;right:${mr}pt;
            font-style:italic;font-size:9.5pt;color:#555;border-left:2px solid #999;padding-left:6pt;">${ln || "&nbsp;"}</div>`
        ).join("");
      }
      return html;
    };

    const pageNumHtml = pageNum > 1
      ? `<div style="position:absolute;top:${page.mt/2}pt;right:${mr}pt;">${pageNum}.</div>`
      : "";

    return `
      <div class="screenplay-page" style="position:relative;width:${page.w}pt;height:${page.h}pt;
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
  <link rel="stylesheet" href="${GOOGLE_FONT_HREF}"/>
  <style>
    @page { size: ${isHollywood ? "letter" : "A4"}; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; }
    body {
      font-family: ${FONT_STACK};
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
    // Esperamos a que la fuente termine de cargar (no un timeout fijo) antes
    // de imprimir, para que el resultado impreso use la misma fuente con la
    // que se midieron y ubicaron las líneas.
    (function () {
      function go() { window.print(); }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(go).catch(go);
        // Salvavidas por si "ready" tarda demasiado o nunca resuelve
        setTimeout(go, 2500);
      } else {
        setTimeout(go, 600);
      }
    })();
  </script>
</body>
</html>`;

  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

// Espera a que 'Courier Prime' (normal y cursiva) esté disponible en el
// documento actual, que es donde vamos a medir el texto con canvas. Si la
// fuente no está declarada/cargada, esto no falla: simplemente el canvas
// medirá con el fallback (Courier New / monospace del sistema), que es
// igual de válido siempre que sea EL MISMO que se use al imprimir.
async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`12px 'Courier Prime'`),
      document.fonts.load(`italic 12px 'Courier Prime'`),
      document.fonts.load(`italic 9.5px 'Courier Prime'`),
    ]);
    await document.fonts.ready;
  } catch {
    // Sin bloquear el export si falla la carga de la fuente
  }
}
