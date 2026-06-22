import { useState, useEffect, useRef, useCallback } from "react";

// ─── Tipos de elementos del guion ───────────────────────────────────────────
const ELEMENT_TYPES = {
  SCENE_HEADING: "scene_heading",
  ACTION: "action",
  CHARACTER: "character",
  PARENTHETICAL: "parenthetical",
  DIALOGUE: "dialogue",
  TRANSITION: "transition",
  TITLE_PAGE: "title_page",
};

const ELEMENT_LABELS = {
  scene_heading: "Encabezado de escena",
  action: "Acción",
  character: "Personaje",
  parenthetical: "Paréntesis",
  dialogue: "Diálogo",
  transition: "Transición",
  title_page: "Portada",
};

// Colores por personaje (se asignan automáticamente)
const CHARACTER_COLORS = [
  "#E8A87C", "#85C1E9", "#82E0AA", "#F1948A",
  "#BB8FCE", "#F7DC6F", "#76D7C4", "#F0B27A",
  "#AED6F1", "#A9DFBF",
];

function getCharacterColor(name, characterMap) {
  if (!characterMap[name]) return "#E8A87C";
  return characterMap[name].color;
}

// ─── Utilidades de formato ───────────────────────────────────────────────────
function formatElement(type, text) {
  switch (type) {
    case ELEMENT_TYPES.SCENE_HEADING:
      return text.toUpperCase();
    case ELEMENT_TYPES.CHARACTER:
      return text.toUpperCase();
    case ELEMENT_TYPES.TRANSITION:
      return text.toUpperCase();
    default:
      return text;
  }
}

function getNextType(type) {
  switch (type) {
    case ELEMENT_TYPES.SCENE_HEADING: return ELEMENT_TYPES.ACTION;
    case ELEMENT_TYPES.ACTION: return ELEMENT_TYPES.ACTION;
    case ELEMENT_TYPES.CHARACTER: return ELEMENT_TYPES.DIALOGUE;
    case ELEMENT_TYPES.PARENTHETICAL: return ELEMENT_TYPES.DIALOGUE;
    case ELEMENT_TYPES.DIALOGUE: return ELEMENT_TYPES.CHARACTER;
    case ELEMENT_TYPES.TRANSITION: return ELEMENT_TYPES.SCENE_HEADING;
    default: return ELEMENT_TYPES.ACTION;
  }
}

function detectType(text, prevType) {
  const upper = text.toUpperCase().trim();
  if (upper.startsWith("INT.") || upper.startsWith("EXT.") || upper.startsWith("INT/EXT") || upper.startsWith("I/E"))
    return ELEMENT_TYPES.SCENE_HEADING;
  if (upper.endsWith("CORTE A:") || upper.endsWith("FUNDIDO A:") || upper.endsWith("DISUELVE A:") || upper.endsWith("CUT TO:") || upper.endsWith("FADE TO:"))
    return ELEMENT_TYPES.TRANSITION;
  if (text.startsWith("(") && text.endsWith(")"))
    return ELEMENT_TYPES.PARENTHETICAL;
  return prevType || ELEMENT_TYPES.ACTION;
}

// ─── Componente: Icono de tipo ───────────────────────────────────────────────
function TypeBadge({ type }) {
  const labels = {
    scene_heading: { label: "ESC", bg: "#2D3748", color: "#90CDF4" },
    action: { label: "ACC", bg: "#1A202C", color: "#A0AEC0" },
    character: { label: "PER", bg: "#2D3748", color: "#68D391" },
    parenthetical: { label: "()", bg: "#1A202C", color: "#F6AD55" },
    dialogue: { label: "DLG", bg: "#1A202C", color: "#FC8181" },
    transition: { label: "TRANS", bg: "#2D3748", color: "#B794F4" },
    title_page: { label: "TIT", bg: "#2D3748", color: "#FBD38D" },
  };
  const t = labels[type] || labels.action;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1,
      padding: "2px 5px", borderRadius: 3,
      background: t.bg, color: t.color,
      fontFamily: "monospace", flexShrink: 0,
    }}>{t.label}</span>
  );
}

// ─── Componente: Editor de un bloque ────────────────────────────────────────
function BlockEditor({ block, index, isActive, characterColors, allBlocks, onUpdate, onFocus, onKeyDown, onDelete, onTypeChange, inputRef }) {
  const isChar = block.type === ELEMENT_TYPES.CHARACTER;
  const isDlg = block.type === ELEMENT_TYPES.DIALOGUE;
  const isScene = block.type === ELEMENT_TYPES.SCENE_HEADING;
  const isParen = block.type === ELEMENT_TYPES.PARENTHETICAL;
  const isTrans = block.type === ELEMENT_TYPES.TRANSITION;

  let style = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    resize: "none",
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    fontSize: 14,
    lineHeight: "1.7",
    caretColor: "#F6AD55",
    color: "#E2E8F0",
    padding: 0,
    overflow: "hidden",
    minHeight: 24,
  };

  // Estilos por tipo
  if (isScene) {
    style = { ...style, fontWeight: 700, color: "#90CDF4", letterSpacing: 0.5, textTransform: "uppercase" };
  } else if (isChar) {
    style = { ...style, textAlign: "center", fontWeight: 700, color: "#68D391", textTransform: "uppercase",
      color: characterColors[block.text?.trim()] || "#68D391" };
  } else if (isDlg) {
    style = { ...style, paddingLeft: 80, paddingRight: 80, color: "#E2E8F0" };
  } else if (isParen) {
    style = { ...style, paddingLeft: 120, paddingRight: 120, color: "#F6AD55", fontStyle: "italic" };
  } else if (isTrans) {
    style = { ...style, textAlign: "right", fontWeight: 700, color: "#B794F4", textTransform: "uppercase" };
  }

  const handleInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    onUpdate(index, e.target.value);
  };

  const wrapStyle = {
    position: "relative",
    padding: isScene ? "10px 0 6px" : isDlg || isParen ? "2px 0" : "3px 0",
    borderTop: isScene ? "1px solid #2D3748" : "none",
    marginTop: isScene ? 8 : 0,
  };

  return (
    <div style={wrapStyle} onClick={() => onFocus(index)}>
      <textarea
        ref={inputRef}
        value={block.type === ELEMENT_TYPES.CHARACTER || block.type === ELEMENT_TYPES.SCENE_HEADING || block.type === ELEMENT_TYPES.TRANSITION
          ? block.text : block.text}
        onChange={handleInput}
        onFocus={() => onFocus(index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        rows={1}
        style={{ ...style, display: "block", width: "100%", boxSizing: "border-box" }}
        placeholder={isActive ? getPlaceholder(block.type) : ""}
        spellCheck={true}
      />
    </div>
  );
}

function getPlaceholder(type) {
  switch (type) {
    case ELEMENT_TYPES.SCENE_HEADING: return "INT. LUGAR - DÍA";
    case ELEMENT_TYPES.ACTION: return "Acción / descripción...";
    case ELEMENT_TYPES.CHARACTER: return "NOMBRE DEL PERSONAJE";
    case ELEMENT_TYPES.PARENTHETICAL: return "(emoción o dirección)";
    case ELEMENT_TYPES.DIALOGUE: return "Línea de diálogo...";
    case ELEMENT_TYPES.TRANSITION: return "CORTE A:";
    default: return "";
  }
}

// ─── Componente: Panel de personajes ─────────────────────────────────────────
function CharactersPanel({ characters, onSelectCharacter }) {
  return (
    <div style={{ padding: "0 12px" }}>
      <p style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px", fontWeight: 600 }}>
        Personajes
      </p>
      {Object.entries(characters).length === 0 && (
        <p style={{ fontSize: 12, color: "#4A5568", fontStyle: "italic" }}>
          Los personajes aparecen automáticamente al escribir diálogos.
        </p>
      )}
      {Object.entries(characters).map(([name, info]) => (
        <div
          key={name}
          onClick={() => onSelectCharacter(name)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 8px", borderRadius: 6, marginBottom: 4,
            cursor: "pointer", background: "#1A202C",
            border: "1px solid #2D3748",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#2D3748"}
          onMouseLeave={e => e.currentTarget.style.background = "#1A202C"}
        >
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: info.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: "#CBD5E0", fontFamily: "monospace", fontWeight: 600 }}>
            {name}
          </span>
          <span style={{ fontSize: 11, color: "#4A5568", marginLeft: "auto" }}>
            {info.count} líneas
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente: Sidebar ─────────────────────────────────────────────────────
function Sidebar({ projects, selectedId, characters, onSelect, onCreate, onDelete, onRename }) {
  const [search, setSearch] = useState("");

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: 240, background: "#0D1117", borderRight: "1px solid #21262D",
      display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #21262D" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: "#F6AD55",
            borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 900,
            color: "#1A202C", flexShrink: 0,
          }}>P</div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#E2E8F0", letterSpacing: -0.3 }}>PLANO</p>
            <p style={{ margin: 0, fontSize: 10, color: "#4A5568", letterSpacing: 1 }}>SCREENWRITING</p>
          </div>
        </div>
      </div>

      {/* Proyectos */}
      <div style={{ padding: "12px 12px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Proyectos
          </span>
          <button
            onClick={onCreate}
            style={{
              background: "#F6AD55", border: "none", borderRadius: 4,
              width: 20, height: 20, cursor: "pointer", color: "#1A202C",
              fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center",
              justifyContent: "center", padding: 0, lineHeight: 1,
            }}
            title="Nuevo proyecto"
          >+</button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          style={{
            width: "100%", boxSizing: "border-box", background: "#161B22",
            border: "1px solid #21262D", borderRadius: 5, padding: "5px 8px",
            color: "#A0AEC0", fontSize: 12, outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {filtered.map(p => (
          <ProjectItem
            key={p.id}
            project={p}
            isActive={p.id === selectedId}
            onSelect={() => onSelect(p.id)}
            onDelete={() => onDelete(p.id)}
            onRename={(name) => onRename(p.id, name)}
          />
        ))}
      </div>

      {/* Panel de personajes */}
      <div style={{ borderTop: "1px solid #21262D", paddingTop: 12, paddingBottom: 16, maxHeight: 240, overflowY: "auto" }}>
        <CharactersPanel characters={characters} onSelectCharacter={() => {}} />
      </div>
    </div>
  );
}

function ProjectItem({ project, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);

  const handleRename = () => {
    if (name.trim()) onRename(name.trim());
    setEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "7px 8px", borderRadius: 6, marginBottom: 2,
        background: isActive ? "#1A202C" : "transparent",
        border: isActive ? "1px solid #2D3748" : "1px solid transparent",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#161B22"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 13, color: "#718096", flexShrink: 0 }}>🎬</span>
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, background: "#2D3748", border: "1px solid #4A5568",
            borderRadius: 4, padding: "2px 5px", color: "#E2E8F0", fontSize: 12,
            outline: "none",
          }}
        />
      ) : (
        <span style={{
          flex: 1, fontSize: 12, color: isActive ? "#E2E8F0" : "#A0AEC0",
          fontWeight: isActive ? 600 : 400, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{project.name}</span>
      )}
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setEditing(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#4A5568", fontSize: 12, padding: "2px", borderRadius: 3 }}
          title="Renombrar"
        >✏️</button>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#4A5568", fontSize: 12, padding: "2px", borderRadius: 3 }}
          title="Eliminar"
        >🗑</button>
      </div>
    </div>
  );
}

// ─── Componente: Toolbar ──────────────────────────────────────────────────────
function Toolbar({ activeType, onTypeChange, onExport, projectName, wordCount }) {
  const types = [
    { type: ELEMENT_TYPES.SCENE_HEADING, label: "Escena", key: "1" },
    { type: ELEMENT_TYPES.ACTION, label: "Acción", key: "2" },
    { type: ELEMENT_TYPES.CHARACTER, label: "Personaje", key: "3" },
    { type: ELEMENT_TYPES.PARENTHETICAL, label: "()", key: "4" },
    { type: ELEMENT_TYPES.DIALOGUE, label: "Diálogo", key: "5" },
    { type: ELEMENT_TYPES.TRANSITION, label: "Transición", key: "6" },
  ];

  return (
    <div style={{
      background: "#0D1117", borderBottom: "1px solid #21262D",
      padding: "8px 20px", display: "flex", alignItems: "center",
      gap: 12, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, flexWrap: "wrap" }}>
        {types.map(t => (
          <button
            key={t.type}
            onClick={() => onTypeChange(t.type)}
            title={`${t.label} (Tab para cambiar)`}
            style={{
              padding: "4px 10px", borderRadius: 5, fontSize: 12,
              fontWeight: activeType === t.type ? 700 : 400,
              background: activeType === t.type ? "#2D3748" : "transparent",
              border: activeType === t.type ? "1px solid #4A5568" : "1px solid transparent",
              color: activeType === t.type ? "#F6AD55" : "#718096",
              cursor: "pointer", transition: "all 0.12s",
              fontFamily: "inherit",
            }}
          >{t.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#4A5568" }}>{wordCount} palabras</span>
        <button
          onClick={onExport}
          style={{
            background: "#F6AD55", border: "none", borderRadius: 5,
            padding: "5px 12px", fontSize: 12, fontWeight: 700,
            color: "#1A202C", cursor: "pointer",
          }}
        >Exportar PDF</button>
      </div>
    </div>
  );
}

// ─── Componente: Editor principal ─────────────────────────────────────────────
function ScriptEditor({ project, onUpdate }) {
  const [blocks, setBlocks] = useState(() => {
    if (project.blocks && project.blocks.length > 0) return project.blocks;
    return [{ id: Date.now(), type: ELEMENT_TYPES.SCENE_HEADING, text: "" }];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef({});

  // Sincroniza cuando cambia el proyecto
  useEffect(() => {
    if (project.blocks && project.blocks.length > 0) {
      setBlocks(project.blocks);
    } else {
      setBlocks([{ id: Date.now(), type: ELEMENT_TYPES.SCENE_HEADING, text: "" }]);
    }
    setActiveIndex(0);
  }, [project.id]);

  // Persiste cambios
  useEffect(() => {
    onUpdate(blocks);
  }, [blocks]);

  // Auto-resize todos los textareas
  useEffect(() => {
    Object.values(inputRefs.current).forEach(ref => {
      if (ref) {
        ref.style.height = "auto";
        ref.style.height = ref.scrollHeight + "px";
      }
    });
  }, [blocks]);

  const updateBlock = useCallback((index, text) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, text } : b));
  }, []);

  const handleKeyDown = useCallback((e, index) => {
    const block = blocks[index];

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const nextType = getNextType(block.type);
      const newBlock = { id: Date.now(), type: nextType, text: "" };
      setBlocks(prev => {
        const updated = [...prev];
        updated.splice(index + 1, 0, newBlock);
        return updated;
      });
      setTimeout(() => {
        const ref = inputRefs.current[index + 1];
        if (ref) ref.focus();
        setActiveIndex(index + 1);
      }, 0);
    }

    if (e.key === "Backspace" && block.text === "" && blocks.length > 1) {
      e.preventDefault();
      setBlocks(prev => prev.filter((_, i) => i !== index));
      const prevIndex = Math.max(0, index - 1);
      setTimeout(() => {
        const ref = inputRefs.current[prevIndex];
        if (ref) { ref.focus(); setActiveIndex(prevIndex); }
      }, 0);
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const types = Object.values(ELEMENT_TYPES).filter(t => t !== ELEMENT_TYPES.TITLE_PAGE);
      const current = types.indexOf(block.type);
      const next = e.shiftKey
        ? types[(current - 1 + types.length) % types.length]
        : types[(current + 1) % types.length];
      setBlocks(prev => prev.map((b, i) => i === index ? { ...b, type: next } : b));
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      const ref = inputRefs.current[index - 1];
      if (ref) { ref.focus(); setActiveIndex(index - 1); }
    }

    if (e.key === "ArrowDown" && index < blocks.length - 1) {
      e.preventDefault();
      const ref = inputRefs.current[index + 1];
      if (ref) { ref.focus(); setActiveIndex(index + 1); }
    }
  }, [blocks]);

  const changeType = useCallback((index, type) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, type } : b));
  }, []);

  // Extraer personajes
  const characterMap = {};
  let colorIndex = 0;
  blocks.forEach(b => {
    if (b.type === ELEMENT_TYPES.CHARACTER && b.text.trim()) {
      const name = b.text.trim().toUpperCase();
      if (!characterMap[name]) {
        characterMap[name] = { color: CHARACTER_COLORS[colorIndex % CHARACTER_COLORS.length], count: 0 };
        colorIndex++;
      }
      characterMap[name].count++;
    }
  });

  return { blocks, activeIndex, setActiveIndex, inputRefs, updateBlock, handleKeyDown, changeType, characterMap };
}

// ─── Exportar a formato fountain/texto ──────────────────────────────────────
function exportToText(blocks, projectName) {
  let text = `${projectName.toUpperCase()}\n\nEscrito con PLANO Screenwriting\n${"─".repeat(40)}\n\n`;
  blocks.forEach(b => {
    if (!b.text.trim()) return;
    switch (b.type) {
      case ELEMENT_TYPES.SCENE_HEADING:
        text += `\n${b.text.toUpperCase()}\n\n`; break;
      case ELEMENT_TYPES.ACTION:
        text += `${b.text}\n\n`; break;
      case ELEMENT_TYPES.CHARACTER:
        text += `\n${" ".repeat(35)}${b.text.toUpperCase()}\n`; break;
      case ELEMENT_TYPES.PARENTHETICAL:
        text += `${" ".repeat(28)}${b.text}\n`; break;
      case ELEMENT_TYPES.DIALOGUE:
        text += `${" ".repeat(20)}${b.text}\n`; break;
      case ELEMENT_TYPES.TRANSITION:
        text += `\n${" ".repeat(50)}${b.text.toUpperCase()}\n\n`; break;
    }
  });
  return text;
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("plano-projects-v2");
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [{
      id: 1,
      name: "Mi Primer Guion",
      blocks: [
        { id: 1, type: ELEMENT_TYPES.SCENE_HEADING, text: "INT. SALA DE ESTAR - DÍA" },
        { id: 2, type: ELEMENT_TYPES.ACTION, text: "La sala está vacía. El sol entra por las persianas dibujando rayas en el suelo de madera." },
        { id: 3, type: ELEMENT_TYPES.CHARACTER, text: "ELENA" },
        { id: 4, type: ELEMENT_TYPES.DIALOGUE, text: "No puedo creer que esto esté pasando." },
        { id: 5, type: ELEMENT_TYPES.CHARACTER, text: "MARCOS" },
        { id: 6, type: ELEMENT_TYPES.PARENTHETICAL, text: "(mirando por la ventana)" },
        { id: 7, type: ELEMENT_TYPES.DIALOGUE, text: "Siempre pasa. Solo que nunca lo vemos venir." },
        { id: 8, type: ELEMENT_TYPES.TRANSITION, text: "CORTE A:" },
      ],
      createdAt: Date.now(),
    }];
  });

  const [selectedId, setSelectedId] = useState(() => {
    const saved = localStorage.getItem("plano-projects-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[0]?.id || 1;
      } catch { }
    }
    return 1;
  });

  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const inputRefs = useRef({});
  const editorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("plano-projects-v2", JSON.stringify(projects));
  }, [projects]);

  const selectedProject = projects.find(p => p.id === selectedId) || projects[0];
  const blocks = selectedProject?.blocks || [];

  const updateBlocks = useCallback((newBlocks) => {
    setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, blocks: newBlocks } : p));
  }, [selectedId]);

  const updateBlock = useCallback((index, text) => {
    updateBlocks(blocks.map((b, i) => i === index ? { ...b, text } : b));
  }, [blocks, updateBlocks]);

  const handleKeyDown = useCallback((e, index) => {
    const block = blocks[index];
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const nextType = getNextType(block.type);
      const newBlock = { id: Date.now(), type: nextType, text: "" };
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      updateBlocks(updated);
      setTimeout(() => {
        const ref = inputRefs.current[index + 1];
        if (ref) ref.focus();
        setActiveBlockIndex(index + 1);
      }, 10);
    }
    if (e.key === "Backspace" && block.text === "" && blocks.length > 1) {
      e.preventDefault();
      updateBlocks(blocks.filter((_, i) => i !== index));
      const prev = Math.max(0, index - 1);
      setTimeout(() => {
        const ref = inputRefs.current[prev];
        if (ref) { ref.focus(); setActiveBlockIndex(prev); }
      }, 10);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const types = [
        ELEMENT_TYPES.SCENE_HEADING, ELEMENT_TYPES.ACTION,
        ELEMENT_TYPES.CHARACTER, ELEMENT_TYPES.PARENTHETICAL,
        ELEMENT_TYPES.DIALOGUE, ELEMENT_TYPES.TRANSITION,
      ];
      const current = types.indexOf(block.type);
      const next = e.shiftKey
        ? types[(current - 1 + types.length) % types.length]
        : types[(current + 1) % types.length];
      updateBlocks(blocks.map((b, i) => i === index ? { ...b, type: next } : b));
    }
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      const ref = inputRefs.current[index - 1];
      if (ref) { ref.focus(); setActiveBlockIndex(index - 1); }
    }
    if (e.key === "ArrowDown" && index < blocks.length - 1) {
      e.preventDefault();
      const ref = inputRefs.current[index + 1];
      if (ref) { ref.focus(); setActiveBlockIndex(index + 1); }
    }
  }, [blocks, updateBlocks]);

  const changeType = useCallback((type) => {
    updateBlocks(blocks.map((b, i) => i === activeBlockIndex ? { ...b, type } : b));
  }, [activeBlockIndex, blocks, updateBlocks]);

  // Extraer personajes
  const characterMap = {};
  let colorIdx = 0;
  blocks.forEach(b => {
    if (b.type === ELEMENT_TYPES.CHARACTER && b.text.trim()) {
      const name = b.text.trim().toUpperCase();
      if (!characterMap[name]) {
        characterMap[name] = {
          color: CHARACTER_COLORS[colorIdx % CHARACTER_COLORS.length],
          count: 0
        };
        colorIdx++;
      }
      characterMap[name].count++;
    }
  });

  // Auto-resize textareas
  useEffect(() => {
    Object.values(inputRefs.current).forEach(ref => {
      if (ref) { ref.style.height = "auto"; ref.style.height = ref.scrollHeight + "px"; }
    });
  }, [blocks]);

  const createProject = () => {
    const name = prompt("Nombre del nuevo guion:");
    if (!name?.trim()) return;
    const newProject = {
      id: Date.now(),
      name: name.trim(),
      blocks: [{ id: Date.now(), type: ELEMENT_TYPES.SCENE_HEADING, text: "" }],
      createdAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedId(newProject.id);
  };

  const deleteProject = (id) => {
    if (projects.length === 1) { alert("Debes tener al menos un proyecto."); return; }
    if (!confirm("¿Eliminar este guion? Esta acción no se puede deshacer.")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (selectedId === id) setSelectedId(updated[0].id);
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const wordCount = blocks.reduce((acc, b) => {
    return acc + (b.text?.trim().split(/\s+/).filter(Boolean).length || 0);
  }, 0);

  const handleExport = () => {
    const text = exportToText(blocks, selectedProject.name);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProject.name.replace(/\s+/g, "_")}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBlockStyle = (block, index) => {
    const isActive = index === activeBlockIndex;
    const base = {
      position: "relative",
      padding: "0",
      marginBottom: 0,
    };
    switch (block.type) {
      case ELEMENT_TYPES.SCENE_HEADING:
        return { ...base, marginTop: 24, paddingTop: 10, borderTop: "1px solid #21262D" };
      case ELEMENT_TYPES.CHARACTER:
        return { ...base, marginTop: 16 };
      case ELEMENT_TYPES.TRANSITION:
        return { ...base, marginTop: 16 };
      default:
        return base;
    }
  };

  const getTextStyle = (block, index) => {
    const isActive = index === activeBlockIndex;
    const base = {
      width: "100%", border: "none", outline: "none",
      background: "transparent", resize: "none",
      fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
      fontSize: 14, lineHeight: "1.75", caretColor: "#F6AD55",
      color: "#E2E8F0", overflow: "hidden", minHeight: 24,
      boxSizing: "border-box",
    };
    switch (block.type) {
      case ELEMENT_TYPES.SCENE_HEADING:
        return { ...base, fontWeight: 700, color: "#90CDF4", textTransform: "uppercase", letterSpacing: 0.3 };
      case ELEMENT_TYPES.CHARACTER:
        return {
          ...base, textAlign: "center", fontWeight: 700,
          textTransform: "uppercase",
          color: characterMap[block.text?.trim()?.toUpperCase()]?.color || "#68D391",
        };
      case ELEMENT_TYPES.DIALOGUE:
        return { ...base, paddingLeft: "20%", paddingRight: "20%", color: "#E2E8F0" };
      case ELEMENT_TYPES.PARENTHETICAL:
        return { ...base, paddingLeft: "28%", paddingRight: "28%", color: "#F6AD55", fontStyle: "italic" };
      case ELEMENT_TYPES.TRANSITION:
        return { ...base, textAlign: "right", fontWeight: 700, textTransform: "uppercase", color: "#B794F4" };
      case ELEMENT_TYPES.ACTION:
        return { ...base, color: "#CBD5E0" };
      default:
        return base;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0D1117", color: "#E2E8F0", fontFamily: "system-ui, sans-serif" }}>

      {/* Sidebar */}
      <Sidebar
        projects={projects}
        selectedId={selectedId}
        characters={characterMap}
        onSelect={setSelectedId}
        onCreate={createProject}
        onDelete={deleteProject}
        onRename={renameProject}
      />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <Toolbar
          activeType={blocks[activeBlockIndex]?.type || ELEMENT_TYPES.ACTION}
          onTypeChange={changeType}
          onExport={handleExport}
          projectName={selectedProject?.name}
          wordCount={wordCount}
        />

        {/* Header */}
        <div style={{
          padding: "10px 60px 8px", background: "#0D1117",
          borderBottom: "1px solid #21262D",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <h1 style={{
            margin: 0, fontSize: 16, fontWeight: 700, color: "#F6AD55",
            fontFamily: "'Courier Prime', monospace", letterSpacing: -0.3,
          }}>
            {selectedProject?.name || "Sin título"}
          </h1>
          <span style={{ fontSize: 12, color: "#4A5568" }}>
            {blocks.length} elementos · Tab para cambiar tipo · Enter para nuevo
          </span>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          style={{
            flex: 1, overflowY: "auto", padding: "24px 60px 80px",
            background: "#111827",
          }}
        >
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {blocks.map((block, index) => (
              <div
                key={block.id}
                style={{
                  ...getBlockStyle(block, index),
                  background: index === activeBlockIndex ? "rgba(246,173,85,0.03)" : "transparent",
                  borderRadius: 4,
                  borderLeft: index === activeBlockIndex ? "2px solid rgba(246,173,85,0.4)" : "2px solid transparent",
                  paddingLeft: index === activeBlockIndex ? 8 : 8,
                  transition: "all 0.1s",
                }}
              >
                <textarea
                  ref={el => {
                    if (el) { inputRefs.current[index] = el; }
                    else { delete inputRefs.current[index]; }
                  }}
                  value={block.text}
                  onChange={e => {
                    updateBlock(index, e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onFocus={() => setActiveBlockIndex(index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  rows={1}
                  style={getTextStyle(block, index)}
                  placeholder={index === activeBlockIndex ? getPlaceholder(block.type) : ""}
                  spellCheck
                />
              </div>
            ))}

            {/* Botón añadir al final */}
            <div
              onClick={() => {
                const newBlock = { id: Date.now(), type: ELEMENT_TYPES.ACTION, text: "" };
                const newBlocks = [...blocks, newBlock];
                updateBlocks(newBlocks);
                setTimeout(() => {
                  const ref = inputRefs.current[newBlocks.length - 1];
                  if (ref) { ref.focus(); setActiveBlockIndex(newBlocks.length - 1); }
                }, 10);
              }}
              style={{
                marginTop: 24, padding: "10px 0", textAlign: "center",
                color: "#4A5568", fontSize: 13, cursor: "pointer",
                borderTop: "1px dashed #21262D",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#718096"}
              onMouseLeave={e => e.currentTarget.style.color = "#4A5568"}
            >
              + añadir elemento
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: atajos */}
      <div style={{
        width: 180, background: "#0D1117", borderLeft: "1px solid #21262D",
        padding: "16px 12px", flexShrink: 0, overflowY: "auto",
      }}>
        <p style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px", fontWeight: 600 }}>
          Atajos
        </p>
        {[
          ["Enter", "Siguiente elemento"],
          ["Tab", "Cambiar tipo"],
          ["Shift+Tab", "Tipo anterior"],
          ["↑ / ↓", "Navegar bloques"],
          ["Backspace", "Borrar vacío"],
        ].map(([key, desc]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{
              display: "inline-block", background: "#1A202C", border: "1px solid #2D3748",
              borderRadius: 4, padding: "2px 6px", fontSize: 11,
              fontFamily: "monospace", color: "#F6AD55", marginBottom: 3,
            }}>{key}</div>
            <p style={{ margin: 0, fontSize: 11, color: "#4A5568", lineHeight: 1.4 }}>{desc}</p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #21262D", marginTop: 16, paddingTop: 12 }}>
          <p style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px", fontWeight: 600 }}>
            Tipos
          </p>
          {[
            ["ESC", "Encabezado escena", "#90CDF4"],
            ["ACC", "Acción", "#A0AEC0"],
            ["PER", "Personaje", "#68D391"],
            ["()", "Paréntesis", "#F6AD55"],
            ["DLG", "Diálogo", "#FC8181"],
            ["TRANS", "Transición", "#B794F4"],
          ].map(([abbr, name, color]) => (
            <div key={abbr} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{
                fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                color, background: "#1A202C", padding: "1px 4px",
                borderRadius: 3, minWidth: 32, textAlign: "center",
              }}>{abbr}</span>
              <span style={{ fontSize: 11, color: "#4A5568" }}>{name}</span>
            </div>
          ))}
        </div>

        {/* Estadísticas */}
        <div style={{ borderTop: "1px solid #21262D", marginTop: 16, paddingTop: 12 }}>
          <p style={{ fontSize: 11, color: "#718096", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px", fontWeight: 600 }}>
            Estadísticas
          </p>
          {[
            ["Escenas", blocks.filter(b => b.type === ELEMENT_TYPES.SCENE_HEADING).length],
            ["Personajes", Object.keys(characterMap).length],
            ["Diálogos", blocks.filter(b => b.type === ELEMENT_TYPES.DIALOGUE).length],
            ["~Páginas", Math.ceil(blocks.reduce((a, b) => a + (b.text?.length || 0), 0) / 1200)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#4A5568" }}>{label}</span>
              <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
