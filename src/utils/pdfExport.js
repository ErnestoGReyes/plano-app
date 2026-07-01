import { T } from "../design/tokens";

export function exportToPDFPro(blocks, projectName, { format, author, sceneNumbers }) {
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
