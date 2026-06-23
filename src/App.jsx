// ─── PLANO SCREENWRITING — v4 ────────────────────────────────────────────────
// Celtx-inspired · Mobile-first · Undo/Redo · Búsqueda · Modo foco
// Índice de escenas · Notas · Auto-completar · Cronómetro · Revisión ortográfica

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

const C = {
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
  textMuted:    "#454D6A",
  textFaint:    "#2D3250",
  white:        "#FFFFFF",
};

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
           [T.PAREN]:"PAR",[T.DIALOGUE]:"DIA",[T.TRANSITION]:"TRA" }[type] || "?";
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

function exportToPDF(blocks, projectName) {
  const lines = [];
  blocks.forEach(b => {
    if (!b.text.trim()) return;
    const t = b.type;
    if (t===T.SCENE)      lines.push(`<p class="scene">${b.text.toUpperCase()}</p>`);
    else if (t===T.ACTION) lines.push(`<p class="action">${b.text}</p>`);
    else if (t===T.CHARACTER) lines.push(`<p class="character">${b.text.toUpperCase()}</p>`);
    else if (t===T.PAREN)   lines.push(`<p class="paren">${b.text}</p>`);
    else if (t===T.DIALOGUE) lines.push(`<p class="dialogue">${b.text}</p>`);
    else if (t===T.TRANSITION) lines.push(`<p class="transition">${b.text.toUpperCase()}</p>`);
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${projectName}</title><style>
  @page{size:Letter;margin:1in 1in 1in 1.5in}
  body{font-family:'Courier New',monospace;font-size:12pt;line-height:1.7;color:#000;background:#fff}
  p{margin:0}.scene{font-weight:bold;margin-top:24pt;margin-bottom:6pt}
  .action{margin-bottom:12pt}.character{margin-left:2.5in;margin-top:12pt;font-weight:bold}
  .paren{margin-left:1.8in;margin-right:1.8in;font-style:italic}
  .dialogue{margin-left:1.5in;margin-right:1.5in;margin-bottom:12pt}
  .transition{text-align:right;margin-top:12pt;margin-bottom:12pt;font-weight:bold}
  h1{text-align:center;margin-bottom:6pt;font-size:14pt}.byline{text-align:center;margin-bottom:48pt}
  </style></head><body>
  <h1>${projectName}</h1><p class="byline">Escrito con PLANO Screenwriting</p>
  ${lines.join("\n")}</body></html>`;
  const w = window.open("","_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
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

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;background:${C.bgApp};color:${C.textPrimary};font-family:'Inter',system-ui,sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${C.borderBright};border-radius:3px}
  textarea:focus,input:focus{outline:none}
  button{cursor:pointer;font-family:inherit}
  input{font-family:inherit}
  mark{background:rgba(91,141,239,0.35);color:${C.white};border-radius:2px;padding:0 1px}
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
    border-radius:6px;width:100%;cursor:pointer}
  .icon-nav-btn:hover{color:${C.textSec};background:${C.bgCard}}
  .icon-nav-btn.active{color:${C.accent};background:${C.accentGlow}}
  /* bottom nav mobile */
  .mobile-nav-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
    flex:1;padding:6px 2px 8px;border:none;background:none;cursor:pointer;transition:color .15s;
    font-size:9px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;
    color:${C.textMuted};min-height:52px}
  .mobile-nav-btn.active{color:${C.accent}}
  .mobile-nav-btn:active{opacity:.7}
  /* Tap highlight off on mobile */
  button{-webkit-tap-highlight-color:transparent}
  textarea{-webkit-tap-highlight-color:transparent}
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
          <Btn onClick={onClose} style={{fontSize:18, padding:"2px 6px", color:C.textMuted}}>✕</Btn>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV SIDEBAR — DESKTOP
// ═══════════════════════════════════════════════════════════════════════════════

function NavSidebar({ tab, onTab, saving }) {
  const items = [
    {id:"editor",   icon:"✍️",  label:"Editor"},
    {id:"scenes",   icon:"🎬",  label:"Escenas"},
    {id:"characters",icon:"👤", label:"Personajes"},
    {id:"notes",    icon:"📝",  label:"Notas"},
    {id:"stats",    icon:"📊",  label:"Stats"},
    {id:"search",   icon:"🔍",  label:"Buscar"},
    {id:"projects", icon:"📁",  label:"Guiones"},
  ];
  return (
    <div style={{
      width:64, background:C.bgSidebar, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"12px 6px", gap:2, flexShrink:0, height:"100dvh",
    }}>
      <div style={{width:38, height:38, borderRadius:10, marginBottom:8, flexShrink:0,
        background:`linear-gradient(135deg,${C.accent},#3B6CC5)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, fontWeight:900, color:C.white, letterSpacing:-1}}>P</div>
      {items.map(it => (
        <button key={it.id} className={`icon-nav-btn${tab===it.id?" active":""}`}
          onClick={() => onTab(it.id)} title={it.label}>
          <span style={{fontSize:18}}>{it.icon}</span>
          {it.label}
        </button>
      ))}
      <div style={{flex:1}}/>
      {saving && <div className="saving" style={{fontSize:9, color:C.textMuted, textAlign:"center", letterSpacing:.5}}>
        Guardando
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV — MOBILE
// ═══════════════════════════════════════════════════════════════════════════════

function MobileBottomNav({ tab, onTab, saving }) {
  const items = [
    {id:"editor",    icon:"✍️",  label:"Editor"},
    {id:"scenes",    icon:"🎬",  label:"Escenas"},
    {id:"characters",icon:"👤",  label:"Personas"},
    {id:"notes",     icon:"📝",  label:"Notas"},
    {id:"projects",  icon:"📁",  label:"Guiones"},
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
          <span style={{fontSize:20}}>{it.icon}</span>
          {it.label}
        </button>
      ))}
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
          color:C.textSec,fontSize:22,cursor:"pointer",padding:"2px 4px",lineHeight:1}}>‹</button>
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
        <Btn onClick={onNew} variant="primary" style={{padding:"8px 12px", fontSize:18, borderRadius:8}}>+</Btn>
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
      <span style={{fontSize:18, flexShrink:0}}>🎬</span>
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
          <Btn onClick={()=>setEditing(true)} style={{padding:"3px 5px", fontSize:12}}>✏️</Btn>
          <Btn onClick={onDelete} style={{padding:"3px 5px", fontSize:12}}>🗑</Btn>
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
          <div style={{fontSize:28, marginBottom:8}}>🎬</div>
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
          <div style={{fontSize:28, marginBottom:8}}>👤</div>
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
    {type:T.PAREN,      label:"(paren)",   short:"PAR", color:"#F4A96D"},
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
      {saving && <span className="saving" style={{fontSize:10, color:C.textMuted, marginRight:4}}>Guardando…</span>}

      <Btn onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)" style={{padding:"4px 7px", fontSize:14}}>↩</Btn>
      <Btn onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)" style={{padding:"4px 7px", fontSize:14}}>↪</Btn>

      <Btn onClick={onFocusMode} title="Modo foco"
        style={{padding:"4px 7px", fontSize:14, color:focusMode?C.accent:C.textMuted}}>⊙</Btn>

      <div style={{position:"relative"}}>
        <Btn onClick={()=>setShowExport(v=>!v)} variant="outline"
          style={{gap:4, padding:"4px 10px", fontSize:12}}>
          ↓ Exportar
        </Btn>
        {showExport && (
          <div style={{position:"absolute", right:0, top:"calc(100% + 6px)", background:C.bgPanel,
            border:`1px solid ${C.borderBright}`, borderRadius:9, padding:6,
            zIndex:300, minWidth:170, boxShadow:"0 12px 32px rgba(0,0,0,.5)"}}>
            {[
              {label:"📄 PDF (impresión)", fn:()=>{onExport();setShowExport(false);}},
              {label:"✏️ Fountain (.fountain)", fn:()=>{onExportFountain();setShowExport(false);}},
            ].map(item => (
              <button key={item.label} onClick={item.fn} style={{
                display:"block", width:"100%", padding:"8px 12px", background:"none", border:"none",
                color:C.textSec, fontSize:12, textAlign:"left", cursor:"pointer",
                borderRadius:6, fontFamily:"inherit"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                {item.label}
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
    {type:T.PAREN,      short:"PAR", color:"#F4A96D"},
    {type:T.DIALOGUE,   short:"DIA", color:C.accent},
    {type:T.TRANSITION, short:"TRA", color:C.purple},
  ];
  const [showExport, setShowExport] = useState(false);

  return (
    <div style={{flexShrink:0, background:C.bgPanel, borderBottom:`1px solid ${C.border}`,
      paddingTop:"env(safe-area-inset-top, 0px)"}}>

      {/* Top row: project name + actions */}
      <div style={{display:"flex", alignItems:"center", padding:"10px 14px 6px", gap:8}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:700, color:C.accent,
            fontFamily:"'Courier Prime',monospace", overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{projectName}</div>
          <div style={{fontSize:10, color:C.textMuted, marginTop:1}}>
            {words} palabras · ~{pages} pág · {scenes} escenas
            {saving && <span className="saving" style={{marginLeft:6}}>· Guardando…</span>}
          </div>
        </div>
        <Btn onClick={onUndo} disabled={!canUndo} style={{padding:"6px 8px", fontSize:16}}>↩</Btn>
        <Btn onClick={onRedo} disabled={!canRedo} style={{padding:"6px 8px", fontSize:16}}>↪</Btn>
        <button onClick={onFocusMode} style={{background:"none",border:"none",
          color:focusMode?C.accent:C.textMuted,fontSize:18,cursor:"pointer",padding:"4px 6px"}}>⊙</button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowExport(v=>!v)} style={{background:"none",border:`1px solid ${C.borderBright}`,
            borderRadius:7,color:C.textSec,fontSize:12,cursor:"pointer",padding:"6px 10px",fontWeight:600}}>↓</button>
          {showExport && (
            <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.bgPanel,
              border:`1px solid ${C.borderBright}`,borderRadius:9,padding:6,
              zIndex:300,minWidth:180,boxShadow:"0 12px 32px rgba(0,0,0,.7)"}}>
              {[
                {label:"📄 PDF",fn:()=>{onExport();setShowExport(false);}},
                {label:"✏️ Fountain",fn:()=>{onExportFountain();setShowExport(false);}},
              ].map(item=>(
                <button key={item.label} onClick={item.fn} style={{
                  display:"block",width:"100%",padding:"10px 14px",background:"none",border:"none",
                  color:C.textSec,fontSize:13,textAlign:"left",cursor:"pointer",
                  borderRadius:6,fontFamily:"inherit"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  {item.label}
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

      {/* Type badge — desktop only, left gutter */}
      {isActive && !isMobile && (
        <div style={{position:"absolute", left:-48, top:0, fontSize:8, fontWeight:700,
          color:col, letterSpacing:.5, textTransform:"uppercase",
          background:`rgba(${hexToRgb(col)},.1)`, padding:"2px 5px", borderRadius:3,
          border:`1px solid rgba(${hexToRgb(col)},.2)`}}>
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
                borderRadius:5,padding:"2px 8px",fontSize:10,color:C.red,
                cursor:"pointer",fontFamily:"inherit"}}>
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS POR DEFECTO
// ═══════════════════════════════════════════════════════════════════════════════

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
  // ── Proyectos ──────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState(() => {
    try { const s=localStorage.getItem("plano-v4"); if(s) return JSON.parse(s); } catch{}
    return [DEFAULT_PROJECT()];
  });
  const [selectedId, setSelectedId] = useState(() => projects[0]?.id);
  const project = projects.find(p=>p.id===selectedId) || projects[0];

  // ── Bloques con undo/redo ──────────────────────────────────────────────────
  const [blocks, setBlocksRaw, undo, redo, canUndo, canRedo] = useUndoable(project?.blocks||[]);

  const lastProjectId = useRef(selectedId);
  useEffect(() => {
    if (selectedId !== lastProjectId.current) {
      lastProjectId.current = selectedId;
      setBlocksRaw(project?.blocks||[]);
    }
  }, [selectedId]);

  const updateBlocks = useCallback(nb => {
    setBlocksRaw(nb);
    setProjects(prev => prev.map(p => p.id===selectedId ? {...p, blocks:nb} : p));
  }, [selectedId, setBlocksRaw]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const [navTab, setNavTab] = useState("editor");  // desktop left nav
  const [mobileTab, setMobileTab] = useState("editor"); // mobile bottom nav
  const [saving, setSaving] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const inputRefs = useRef({});
  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  // ── Mobile detection ───────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Autosave ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem("plano-v4", JSON.stringify(projects)); } catch{}
      setSaving(false);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [projects]);

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

  // Proyectos
  const createProject = () => {
    if (!newProjectName.trim()) return;
    const p = {id:uid(), name:newProjectName.trim(), createdAt:Date.now(),
      blocks:[{id:uid(), type:T.SCENE, text:"", note:""}]};
    setProjects(prev => [...prev, p]);
    setSelectedId(p.id);
    setNewProjectName("");
    setNewProjectModal(false);
  };

  const deleteProject = id => {
    if (projects.length===1) return;
    if (!confirm("¿Eliminar este guion?")) return;
    const updated = projects.filter(p=>p.id!==id);
    setProjects(updated);
    if (selectedId===id) setSelectedId(updated[0].id);
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id===id ? {...p, name} : p));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeTab = isMobile ? mobileTab : navTab;
  const showEditor = activeTab==="editor" || !isMobile;

  const editorContent = (
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

  return (
    <>
      <InjectStyles/>
      <div style={{display:"flex", height:"100dvh", overflow:"hidden", background:C.bgApp}}>

        {/* ── DESKTOP ── */}
        {!isMobile && (
          <>
            {/* Left icon nav */}
            {!focusMode && (
              <NavSidebar tab={navTab} onTab={t=>{setNavTab(t);}} saving={saving}/>
            )}

            {/* Center column */}
            <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
              {!focusMode && (
                <>
                  <Toolbar
                    activeType={blocks[activeIndex]?.type||T.ACTION}
                    onTypeChange={changeType}
                    onExport={()=>exportToPDF(blocks, project?.name||"Guion")}
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
                    style={{fontSize:11, padding:"5px 12px"}}>Salir del foco ✕</Btn>
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
                onExport={()=>exportToPDF(blocks, project?.name||"Guion")}
                onExportFountain={()=>exportToFountain(blocks, project?.name||"Guion")}
                focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}/>
            )}

            {/* Focus mode exit */}
            {focusMode && (
              <div style={{position:"fixed", top:14, right:14, zIndex:500}}>
                <Btn onClick={()=>setFocusMode(false)} variant="outline"
                  style={{fontSize:12, padding:"6px 14px"}}>Salir ✕</Btn>
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
              }} saving={saving}/>
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
