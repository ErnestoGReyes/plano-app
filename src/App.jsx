// ─── PLANO SCREENWRITING — v2 ────────────────────────────────────────────────
// Estética nocturna, índice de escenas, notas por escena, exportar PDF
// Dependencias: react, jspdf (npm install jspdf)

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES Y TIPOS
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
  "#7EB8F7", // azul cielo
  "#79E2B0", // verde menta
  "#F4A96D", // naranja cálido
  "#C77DFF", // violeta
  "#F76C6C", // coral
  "#FBD44B", // amarillo
  "#56CFE1", // cyan
  "#FF9EBC", // rosa
  "#A8E063", // lima
  "#FF8C61", // durazno
];

const ACCENT = "#7EB8F7";
const BG_DEEP = "#0A0E17";
const BG_PANEL = "#0F1420";
const BG_EDITOR = "#111827";
const BG_CARD = "#161D2E";
const BORDER = "#1E2A42";
const BORDER_BRIGHT = "#2A3A5C";
const TEXT_PRIMARY = "#E8EDF5";
const TEXT_SECONDARY = "#8899BB";
const TEXT_MUTED = "#3D4F6E";

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

function nextType(type) {
  const map = {
    [T.SCENE]: T.ACTION,
    [T.ACTION]: T.ACTION,
    [T.CHARACTER]: T.DIALOGUE,
    [T.PAREN]: T.DIALOGUE,
    [T.DIALOGUE]: T.CHARACTER,
    [T.TRANSITION]: T.SCENE,
  };
  return map[type] || T.ACTION;
}

function getPlaceholder(type) {
  return {
    [T.SCENE]: "INT. LUGAR — DÍA",
    [T.ACTION]: "Descripción de la escena...",
    [T.CHARACTER]: "NOMBRE DEL PERSONAJE",
    [T.PAREN]: "(emoción o indicación)",
    [T.DIALOGUE]: "Línea de diálogo...",
    [T.TRANSITION]: "CORTE A:",
  }[type] || "";
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function extractCharacters(blocks) {
  const map = {};
  let colorIdx = 0;
  blocks.forEach((b) => {
    if (b.type === T.CHARACTER && b.text.trim()) {
      const name = b.text.trim().toUpperCase();
      if (!map[name]) {
        map[name] = {
          color: CHARACTER_PALETTE[colorIdx % CHARACTER_PALETTE.length],
          lines: 0,
          bio: "",
        };
        colorIdx++;
      }
      map[name].lines++;
    }
  });
  return map;
}

function extractScenes(blocks) {
  return blocks
    .map((b, i) => (b.type === T.SCENE ? { index: i, id: b.id, text: b.text || "Sin título" } : null))
    .filter(Boolean);
}

function countWords(blocks) {
  return blocks.reduce((acc, b) => acc + (b.text?.trim().split(/\s+/).filter(Boolean).length || 0), 0);
}

function estimatePages(blocks) {
  const chars = blocks.reduce((a, b) => a + (b.text?.length || 0), 0);
  return Math.max(1, Math.ceil(chars / 1500));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF (usa print nativo del navegador con estilos inline)
// ═══════════════════════════════════════════════════════════════════════════════

function exportToPDF(blocks, projectName) {
  const lines = [];

  blocks.forEach((b) => {
    if (!b.text.trim()) return;
    switch (b.type) {
      case T.SCENE:
        lines.push(`<p class="scene">${b.text.toUpperCase()}</p>`);
        break;
      case T.ACTION:
        lines.push(`<p class="action">${b.text}</p>`);
        break;
      case T.CHARACTER:
        lines.push(`<p class="character">${b.text.toUpperCase()}</p>`);
        break;
      case T.PAREN:
        lines.push(`<p class="paren">${b.text}</p>`);
        break;
      case T.DIALOGUE:
        lines.push(`<p class="dialogue">${b.text}</p>`);
        break;
      case T.TRANSITION:
        lines.push(`<p class="transition">${b.text.toUpperCase()}</p>`);
        break;
    }
    if (b.note?.trim()) {
      lines.push(`<!-- NOTA: ${b.note} -->`);
    }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${projectName}</title>
<style>
  @page { size: Letter; margin: 1in 1in 1in 1.5in; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.7; color: #000; background: #fff; }
  p { margin: 0 0 0 0; }
  .scene { font-weight: bold; text-transform: uppercase; margin-top: 24pt; margin-bottom: 6pt; }
  .action { margin-bottom: 12pt; }
  .character { margin-left: 2.5in; margin-top: 12pt; margin-bottom: 0; font-weight: bold; text-transform: uppercase; }
  .paren { margin-left: 1.8in; margin-right: 1.8in; font-style: italic; }
  .dialogue { margin-left: 1.5in; margin-right: 1.5in; margin-bottom: 12pt; }
  .transition { text-align: right; margin-top: 12pt; margin-bottom: 12pt; font-weight: bold; }
  h1 { text-align: center; margin-bottom: 6pt; font-size: 14pt; }
  .byline { text-align: center; margin-bottom: 48pt; font-size: 11pt; }
</style>
</head>
<body>
<h1>${projectName}</h1>
<p class="byline">Escrito con PLANO Screenwriting</p>
${lines.join("\n")}
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS GLOBALES (inyectados una vez)
// ═══════════════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: ${BG_DEEP};
    color: ${TEXT_PRIMARY};
    font-family: 'Inter', system-ui, sans-serif;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${BORDER_BRIGHT}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #3A5070; }

  textarea:focus { outline: none; }
  button { cursor: pointer; font-family: inherit; }
  input { font-family: inherit; }

  .block-row:hover .block-actions { opacity: 1 !important; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.18s ease; }

  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
  .saving { animation: pulse 1.2s infinite; }
`;

function InjectStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES UI BASE
// ═══════════════════════════════════════════════════════════════════════════════

function IconBtn({ onClick, title, children, style = {} }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none", border: "none", color: TEXT_SECONDARY,
        fontSize: 14, padding: "4px 6px", borderRadius: 5,
        transition: "color 0.15s, background 0.15s",
        display: "flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = TEXT_PRIMARY; e.currentTarget.style.background = BG_CARD; }}
      onMouseLeave={e => { e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.background = "none"; }}
    >{children}</button>
  );
}

function Tooltip({ text }) {
  return (
    <span style={{
      position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
      transform: "translateX(-50%)", background: "#1E2A42",
      color: TEXT_PRIMARY, fontSize: 11, padding: "4px 8px",
      borderRadius: 5, whiteSpace: "nowrap", pointerEvents: "none",
      border: `1px solid ${BORDER_BRIGHT}`, zIndex: 100,
    }}>{text}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR — PROYECTOS
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectSidebar({ projects, selectedId, onSelect, onCreate, onDelete, onRename }) {
  const [search, setSearch] = useState("");
  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      width: 220, background: BG_PANEL, borderRight: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${ACCENT}, #4A6FA5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: -1,
            flexShrink: 0,
          }}>P</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: 1 }}>PLANO</div>
            <div style={{ fontSize: 9, color: TEXT_MUTED, letterSpacing: 2 }}>SCREENWRITING</div>
          </div>
        </div>
      </div>

      {/* Header proyectos */}
      <div style={{ padding: "10px 10px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: TEXT_MUTED, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
            Guiones
          </span>
          <button
            onClick={onCreate}
            style={{
              background: ACCENT, border: "none", borderRadius: 5,
              width: 22, height: 22, fontSize: 16, fontWeight: 700,
              color: BG_DEEP, display: "flex", alignItems: "center",
              justifyContent: "center", lineHeight: 1,
              transition: "opacity 0.15s",
            }}
            title="Nuevo guion"
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >+</button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar guion..."
          style={{
            width: "100%", background: BG_DEEP, border: `1px solid ${BORDER}`,
            borderRadius: 6, padding: "5px 9px", color: TEXT_SECONDARY,
            fontSize: 12, outline: "none", transition: "border 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = ACCENT}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px" }}>
        {filtered.length === 0 && (
          <p style={{ fontSize: 12, color: TEXT_MUTED, padding: "8px 6px", fontStyle: "italic" }}>Sin resultados</p>
        )}
        {filtered.map(p => (
          <ProjectItem key={p.id} project={p} isActive={p.id === selectedId}
            onSelect={() => onSelect(p.id)}
            onDelete={() => onDelete(p.id)}
            onRename={name => onRename(p.id, name)} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 10, color: TEXT_MUTED, textAlign: "center" }}>
          {projects.length} {projects.length === 1 ? "guion" : "guiones"} · guardado automático
        </p>
      </div>
    </div>
  );
}

function ProjectItem({ project, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [hover, setHover] = useState(false);

  const commit = () => {
    if (name.trim()) onRename(name.trim());
    else setName(project.name);
    setEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "7px 8px", borderRadius: 7, marginBottom: 2,
        background: isActive ? BG_CARD : hover ? "rgba(30,42,66,0.5)" : "transparent",
        border: isActive ? `1px solid ${BORDER_BRIGHT}` : "1px solid transparent",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
        transition: "all 0.12s",
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>🎬</span>
      {editing ? (
        <input
          autoFocus value={name}
          onChange={e => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setName(project.name); setEditing(false); } }}
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, background: BG_DEEP, border: `1px solid ${ACCENT}`,
            borderRadius: 4, padding: "2px 5px", color: TEXT_PRIMARY,
            fontSize: 12, outline: "none",
          }}
        />
      ) : (
        <span style={{
          flex: 1, fontSize: 12, color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
          fontWeight: isActive ? 600 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{project.name}</span>
      )}
      {(hover || isActive) && !editing && (
        <div style={{ display: "flex", gap: 1 }} onClick={e => e.stopPropagation()}>
          <IconBtn onClick={() => setEditing(true)} title="Renombrar" style={{ fontSize: 12, padding: "2px 4px" }}>✏️</IconBtn>
          <IconBtn onClick={onDelete} title="Eliminar" style={{ fontSize: 12, padding: "2px 4px" }}>🗑</IconBtn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DERECHO — ESCENAS + PERSONAJES + NOTAS
// ═══════════════════════════════════════════════════════════════════════════════

function RightPanel({ scenes, characters, activeTab, onTabChange, onSceneClick, stats, activeBlock, blocks, onNoteChange }) {
  const tabs = [
    { id: "scenes", label: "Escenas", emoji: "🎬" },
    { id: "characters", label: "Personajes", emoji: "👤" },
    { id: "notes", label: "Notas", emoji: "📝" },
    { id: "stats", label: "Stats", emoji: "📊" },
  ];

  return (
    <div style={{
      width: 230, background: BG_PANEL, borderLeft: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0,
    }}>
      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${BORDER}`,
        padding: "6px 6px 0", gap: 2,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              flex: 1, padding: "6px 0", fontSize: 10, fontWeight: 600,
              color: activeTab === t.id ? ACCENT : TEXT_MUTED,
              background: activeTab === t.id ? "rgba(126,184,247,0.08)" : "transparent",
              border: "none", borderBottom: activeTab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
              borderRadius: "4px 4px 0 0", transition: "all 0.12s",
              textTransform: "uppercase", letterSpacing: 0.5,
            }}
            title={t.label}
          >{t.emoji}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        {activeTab === "scenes" && (
          <ScenesTab scenes={scenes} onSceneClick={onSceneClick} />
        )}
        {activeTab === "characters" && (
          <CharactersTab characters={characters} />
        )}
        {activeTab === "notes" && (
          <NotesTab activeBlock={activeBlock} blocks={blocks} onNoteChange={onNoteChange} />
        )}
        {activeTab === "stats" && (
          <StatsTab stats={stats} />
        )}
      </div>

      {/* Atajos */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "10px" }}>
        <p style={{ fontSize: 9, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>Atajos</p>
        {[["Enter", "Siguiente"], ["Tab", "Cambiar tipo"], ["↑↓", "Navegar"]].map(([k, d]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontFamily: "monospace", background: BG_DEEP,
              border: `1px solid ${BORDER_BRIGHT}`, borderRadius: 3,
              padding: "1px 5px", color: ACCENT,
            }}>{k}</span>
            <span style={{ fontSize: 10, color: TEXT_MUTED }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenesTab({ scenes, onSceneClick }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        Índice · {scenes.length} escenas
      </p>
      {scenes.length === 0 && (
        <p style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>
          Escribí un encabezado de escena (INT./EXT.) para que aparezca aquí.
        </p>
      )}
      {scenes.map((s, i) => (
        <div
          key={s.id}
          onClick={() => onSceneClick(s.index)}
          style={{
            padding: "7px 9px", marginBottom: 4, borderRadius: 6,
            background: BG_CARD, border: `1px solid ${BORDER}`,
            cursor: "pointer", transition: "border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
          onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: ACCENT,
              background: "rgba(126,184,247,0.1)", padding: "1px 5px",
              borderRadius: 3, flexShrink: 0, minWidth: 22, textAlign: "center",
            }}>{i + 1}</span>
            <span style={{
              fontSize: 11, color: TEXT_SECONDARY, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace",
            }}>{s.text || "Sin título"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CharactersTab({ characters }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        {Object.keys(characters).length} personajes
      </p>
      {Object.keys(characters).length === 0 && (
        <p style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>
          Los personajes aparecen al escribir diálogos.
        </p>
      )}
      {Object.entries(characters).map(([name, info]) => (
        <div key={name} style={{
          padding: "8px 9px", marginBottom: 5, borderRadius: 7,
          background: BG_CARD, border: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: info.color, flexShrink: 0, boxShadow: `0 0 6px ${info.color}60`,
            }} />
            <span style={{
              fontSize: 11, color: info.color, fontWeight: 700,
              fontFamily: "monospace", letterSpacing: 0.5,
            }}>{name}</span>
          </div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, paddingLeft: 18 }}>
            {info.lines} {info.lines === 1 ? "aparición" : "apariciones"}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesTab({ activeBlock, blocks, onNoteChange }) {
  const block = blocks[activeBlock];

  if (!block) return (
    <p style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>
      Seleccioná un bloque en el editor para agregar una nota.
    </p>
  );

  const blocksWithNotes = blocks
    .map((b, i) => ({ ...b, index: i }))
    .filter(b => b.note?.trim());

  return (
    <div>
      <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
        Nota para bloque activo
      </p>
      <div style={{
        padding: "6px 8px", marginBottom: 10, borderRadius: 6,
        background: BG_DEEP, border: `1px solid ${BORDER_BRIGHT}`,
      }}>
        <p style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 4 }}>
          Bloque: <span style={{ color: ACCENT, fontFamily: "monospace" }}>
            {block.text?.slice(0, 30) || "(vacío)"}
          </span>
        </p>
        <textarea
          value={block.note || ""}
          onChange={e => onNoteChange(activeBlock, e.target.value)}
          placeholder="Escribí una nota para este bloque..."
          rows={4}
          style={{
            width: "100%", background: "transparent", border: "none",
            color: TEXT_SECONDARY, fontSize: 12, resize: "vertical",
            outline: "none", lineHeight: 1.6, fontFamily: "inherit",
          }}
        />
      </div>

      {blocksWithNotes.length > 0 && (
        <>
          <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
            Todas las notas ({blocksWithNotes.length})
          </p>
          {blocksWithNotes.map(b => (
            <div key={b.id} style={{
              padding: "7px 9px", marginBottom: 5, borderRadius: 6,
              background: BG_CARD, border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${ACCENT}`,
            }}>
              <p style={{ fontSize: 10, color: ACCENT, marginBottom: 3, fontFamily: "monospace" }}>
                {b.text?.slice(0, 25) || "(vacío)"}
              </p>
              <p style={{ fontSize: 11, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{b.note}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function StatsTab({ stats }) {
  const items = [
    ["Palabras", stats.words],
    ["Páginas aprox.", stats.pages],
    ["Escenas", stats.scenes],
    ["Personajes", stats.characters],
    ["Diálogos", stats.dialogues],
    ["Bloques totales", stats.blocks],
  ];
  return (
    <div>
      <p style={{ fontSize: 10, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        Estadísticas
      </p>
      {items.map(([label, val]) => (
        <div key={label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "7px 9px", marginBottom: 4, borderRadius: 6,
          background: BG_CARD, border: `1px solid ${BORDER}`,
        }}>
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{label}</span>
          <span style={{ fontSize: 14, color: TEXT_PRIMARY, fontWeight: 600 }}>{val}</span>
        </div>
      ))}
      <div style={{
        marginTop: 12, padding: "10px", borderRadius: 8,
        background: "rgba(126,184,247,0.06)", border: `1px solid rgba(126,184,247,0.2)`,
      }}>
        <p style={{ fontSize: 10, color: ACCENT, marginBottom: 4, fontWeight: 600 }}>Duración estimada</p>
        <p style={{ fontSize: 20, color: TEXT_PRIMARY, fontWeight: 700 }}>
          ~{stats.pages} min
        </p>
        <p style={{ fontSize: 10, color: TEXT_MUTED }}>1 página ≈ 1 minuto en pantalla</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBAR
// ═══════════════════════════════════════════════════════════════════════════════

function Toolbar({ activeType, onTypeChange, onExport, projectName, saving }) {
  const types = [
    { type: T.SCENE, label: "Escena", shortcut: "1", color: "#7EB8F7" },
    { type: T.ACTION, label: "Acción", shortcut: "2", color: "#8899BB" },
    { type: T.CHARACTER, label: "Personaje", shortcut: "3", color: "#79E2B0" },
    { type: T.PAREN, label: "(paren)", shortcut: "4", color: "#F4A96D" },
    { type: T.DIALOGUE, label: "Diálogo", shortcut: "5", color: "#C77DFF" },
    { type: T.TRANSITION, label: "Transición", shortcut: "6", color: "#F76C6C" },
  ];

  return (
    <div style={{
      background: BG_PANEL, borderBottom: `1px solid ${BORDER}`,
      padding: "6px 16px", display: "flex", alignItems: "center",
      gap: 4, flexShrink: 0, flexWrap: "wrap",
    }}>
      {types.map(t => {
        const isActive = activeType === t.type;
        return (
          <button
            key={t.type}
            onClick={() => onTypeChange(t.type)}
            style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? `rgba(${hexToRgb(t.color)},0.12)` : "transparent",
              border: isActive ? `1px solid rgba(${hexToRgb(t.color)},0.4)` : "1px solid transparent",
              color: isActive ? t.color : TEXT_MUTED,
              transition: "all 0.12s", fontFamily: "inherit",
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = TEXT_SECONDARY; e.currentTarget.style.background = BG_CARD; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = TEXT_MUTED; e.currentTarget.style.background = "transparent"; } }}
          >{t.label}</button>
        );
      })}

      <div style={{ flex: 1 }} />

      {saving && (
        <span className="saving" style={{ fontSize: 11, color: TEXT_MUTED }}>Guardando...</span>
      )}

      <button
        onClick={onExport}
        style={{
          background: "rgba(126,184,247,0.1)", border: `1px solid rgba(126,184,247,0.3)`,
          borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 600,
          color: ACCENT, transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(126,184,247,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(126,184,247,0.1)"; }}
      >↓ Exportar PDF</button>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOQUE DE GUION
// ═══════════════════════════════════════════════════════════════════════════════

function ScriptBlock({ block, index, isActive, characterColors, onUpdate, onFocus, onKeyDown, inputRef }) {
  const color = characterColors[block.text?.trim()?.toUpperCase()] || "#79E2B0";

  const baseStyle = {
    width: "100%", border: "none", outline: "none",
    background: "transparent", resize: "none",
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: 14, lineHeight: "1.75",
    caretColor: ACCENT, overflow: "hidden",
    minHeight: 24, boxSizing: "border-box", display: "block",
    padding: 0,
  };

  const styles = {
    [T.SCENE]: { ...baseStyle, fontWeight: 700, color: "#7EB8F7", textTransform: "uppercase", letterSpacing: 0.5 },
    [T.ACTION]: { ...baseStyle, color: "#C8D5E8" },
    [T.CHARACTER]: { ...baseStyle, textAlign: "center", fontWeight: 700, textTransform: "uppercase", color },
    [T.PAREN]: { ...baseStyle, paddingLeft: "26%", paddingRight: "26%", color: "#F4A96D", fontStyle: "italic" },
    [T.DIALOGUE]: { ...baseStyle, paddingLeft: "18%", paddingRight: "18%", color: TEXT_PRIMARY },
    [T.TRANSITION]: { ...baseStyle, textAlign: "right", fontWeight: 700, textTransform: "uppercase", color: "#C77DFF" },
  };

  const wrappers = {
    [T.SCENE]: { marginTop: 28, paddingTop: 12, borderTop: `1px solid ${BORDER}` },
    [T.CHARACTER]: { marginTop: 18 },
    [T.TRANSITION]: { marginTop: 18 },
    [T.PAREN]: {},
    [T.DIALOGUE]: {},
    [T.ACTION]: {},
  };

  const hasNote = !!block.note?.trim();

  return (
    <div
      className="block-row"
      style={{
        position: "relative",
        ...(wrappers[block.type] || {}),
        background: isActive ? "rgba(126,184,247,0.025)" : "transparent",
        borderLeft: isActive ? `2px solid rgba(126,184,247,0.35)` : "2px solid transparent",
        paddingLeft: 10, paddingRight: hasNote ? 24 : 0,
        borderRadius: 4, transition: "background 0.1s",
      }}
      onClick={() => onFocus(index)}
    >
      {hasNote && (
        <div
          title={block.note}
          style={{
            position: "absolute", right: 0, top: 4,
            width: 8, height: 8, borderRadius: "50%",
            background: "#FBD44B", boxShadow: "0 0 6px #FBD44B80",
          }}
        />
      )}
      <textarea
        ref={inputRef}
        value={block.text}
        onChange={e => {
          onUpdate(index, e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onFocus={() => onFocus(index)}
        onKeyDown={e => onKeyDown(e, index)}
        rows={1}
        style={styles[block.type] || baseStyle}
        placeholder={isActive ? getPlaceholder(block.type) : ""}
        spellCheck
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PROJECT = () => ({
  id: uid(),
  name: "Mi Primer Guion",
  createdAt: Date.now(),
  blocks: [
    { id: uid(), type: T.SCENE, text: "INT. CAFÉ — NOCHE", note: "" },
    { id: uid(), type: T.ACTION, text: "El café está casi vacío. Una lámpara parpadeante ilumina la barra de madera desgastada.", note: "" },
    { id: uid(), type: T.CHARACTER, text: "SOFÍA", note: "" },
    { id: uid(), type: T.DIALOGUE, text: "¿Cuánto tiempo llevas esperando?", note: "" },
    { id: uid(), type: T.CHARACTER, text: "RODRIGO", note: "" },
    { id: uid(), type: T.PAREN, text: "(sin levantar la vista)", note: "" },
    { id: uid(), type: T.DIALOGUE, text: "Lo suficiente como para saber que no ibas a venir.", note: "" },
    { id: uid(), type: T.TRANSITION, text: "CORTE A:", note: "" },
    { id: uid(), type: T.SCENE, text: "EXT. CALLE MOJADA — NOCHE CONTINUA", note: "" },
    { id: uid(), type: T.ACTION, text: "Sofía camina rápido bajo la lluvia. Sus pasos resuenan en el asfalto vacío.", note: "" },
  ],
});

export default function App() {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("plano-v3");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [DEFAULT_PROJECT()];
  });

  const [selectedId, setSelectedId] = useState(() => {
    try {
      const saved = localStorage.getItem("plano-v3");
      if (saved) return JSON.parse(saved)[0]?.id;
    } catch { }
    return projects[0]?.id;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [rightTab, setRightTab] = useState("scenes");
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef({});
  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  const project = projects.find(p => p.id === selectedId) || projects[0];
  const blocks = project?.blocks || [];

  // Guardar con debounce
  useEffect(() => {
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem("plano-v3", JSON.stringify(projects)); } catch { }
      setSaving(false);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [projects]);

  // Auto-resize al cambiar proyecto
  useEffect(() => {
    setActiveIndex(0);
    setTimeout(() => {
      Object.values(inputRefs.current).forEach(r => {
        if (r) { r.style.height = "auto"; r.style.height = r.scrollHeight + "px"; }
      });
    }, 30);
  }, [selectedId]);

  const updateBlocks = useCallback((newBlocks) => {
    setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, blocks: newBlocks } : p));
  }, [selectedId]);

  const updateBlock = useCallback((index, text) => {
    updateBlocks(blocks.map((b, i) => i === index ? { ...b, text } : b));
  }, [blocks, updateBlocks]);

  const updateNote = useCallback((index, note) => {
    updateBlocks(blocks.map((b, i) => i === index ? { ...b, note } : b));
  }, [blocks, updateBlocks]);

  const handleKeyDown = useCallback((e, index) => {
    const block = blocks[index];

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newBlock = { id: uid(), type: nextType(block.type), text: "", note: "" };
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      updateBlocks(updated);
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }, 10);
    }

    if (e.key === "Backspace" && block.text === "" && blocks.length > 1) {
      e.preventDefault();
      updateBlocks(blocks.filter((_, i) => i !== index));
      const prev = Math.max(0, index - 1);
      setTimeout(() => {
        inputRefs.current[prev]?.focus();
        setActiveIndex(prev);
      }, 10);
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const order = [T.SCENE, T.ACTION, T.CHARACTER, T.PAREN, T.DIALOGUE, T.TRANSITION];
      const cur = order.indexOf(block.type);
      const nxt = e.shiftKey ? order[(cur - 1 + order.length) % order.length] : order[(cur + 1) % order.length];
      updateBlocks(blocks.map((b, i) => i === index ? { ...b, type: nxt } : b));
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
    if (e.key === "ArrowDown" && index < blocks.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  }, [blocks, updateBlocks]);

  const changeType = useCallback((type) => {
    updateBlocks(blocks.map((b, i) => i === activeIndex ? { ...b, type } : b));
  }, [activeIndex, blocks, updateBlocks]);

  const scrollToBlock = useCallback((index) => {
    setActiveIndex(index);
    setTimeout(() => {
      inputRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRefs.current[index]?.focus();
    }, 50);
  }, []);

  const createProject = () => {
    const name = prompt("Nombre del nuevo guion:");
    if (!name?.trim()) return;
    const p = { id: uid(), name: name.trim(), createdAt: Date.now(), blocks: [{ id: uid(), type: T.SCENE, text: "", note: "" }] };
    setProjects(prev => [...prev, p]);
    setSelectedId(p.id);
  };

  const deleteProject = (id) => {
    if (projects.length === 1) return alert("Debe haber al menos un guion.");
    if (!confirm("¿Eliminar este guion? No se puede deshacer.")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (selectedId === id) setSelectedId(updated[0].id);
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  // Datos derivados
  const characters = extractCharacters(blocks);
  const scenes = extractScenes(blocks);
  const words = countWords(blocks);
  const pages = estimatePages(blocks);
  const characterColors = {};
  Object.entries(characters).forEach(([name, info]) => { characterColors[name] = info.color; });

  const stats = {
    words, pages,
    scenes: scenes.length,
    characters: Object.keys(characters).length,
    dialogues: blocks.filter(b => b.type === T.DIALOGUE).length,
    blocks: blocks.length,
  };

  return (
    <>
      <InjectStyles />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: BG_DEEP }}>

        {/* Sidebar izquierdo */}
        <ProjectSidebar
          projects={projects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={createProject}
          onDelete={deleteProject}
          onRename={renameProject}
        />

        {/* Centro */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Toolbar */}
          <Toolbar
            activeType={blocks[activeIndex]?.type || T.ACTION}
            onTypeChange={changeType}
            onExport={() => exportToPDF(blocks, project?.name || "Guion")}
            projectName={project?.name}
            saving={saving}
          />

          {/* Header del guion */}
          <div style={{
            padding: "8px 40px 7px", background: BG_PANEL,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <h1 style={{
              margin: 0, fontSize: 15, fontWeight: 700,
              color: ACCENT, fontFamily: "'Courier Prime', monospace",
              letterSpacing: -0.2,
            }}>{project?.name}</h1>
            <span style={{ fontSize: 11, color: TEXT_MUTED }}>
              {words} palabras · ~{pages} pág · {scenes.length} escenas
            </span>
            <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: "auto" }}>
              Tab = cambiar tipo · Enter = siguiente · ↑↓ = navegar
            </span>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            style={{
              flex: 1, overflowY: "auto",
              padding: "28px 48px 80px",
              background: BG_EDITOR,
            }}
          >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {blocks.map((block, index) => (
                <ScriptBlock
                  key={block.id}
                  block={block}
                  index={index}
                  isActive={index === activeIndex}
                  characterColors={characterColors}
                  onUpdate={updateBlock}
                  onFocus={setActiveIndex}
                  onKeyDown={handleKeyDown}
                  inputRef={el => {
                    if (el) inputRefs.current[index] = el;
                    else delete inputRefs.current[index];
                  }}
                />
              ))}

              {/* Agregar al final */}
              <div
                onClick={() => {
                  const nb = { id: uid(), type: T.ACTION, text: "", note: "" };
                  const updated = [...blocks, nb];
                  updateBlocks(updated);
                  setTimeout(() => {
                    const i = updated.length - 1;
                    inputRefs.current[i]?.focus();
                    setActiveIndex(i);
                  }, 10);
                }}
                style={{
                  marginTop: 30, paddingTop: 16,
                  borderTop: `1px dashed ${BORDER}`,
                  textAlign: "center", color: TEXT_MUTED,
                  fontSize: 12, cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = TEXT_SECONDARY}
                onMouseLeave={e => e.currentTarget.style.color = TEXT_MUTED}
              >+ agregar elemento</div>
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <RightPanel
          scenes={scenes}
          characters={characters}
          activeTab={rightTab}
          onTabChange={setRightTab}
          onSceneClick={scrollToBlock}
          stats={stats}
          activeBlock={activeIndex}
          blocks={blocks}
          onNoteChange={updateNote}
        />
      </div>
    </>
  );
}
