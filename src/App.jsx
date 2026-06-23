// ─── PLANO SCREENWRITING — v3 ────────────────────────────────────────────────
// Estética Celtx · Optimizado para celular · Undo/Redo · Búsqueda · Modo foco
// Drag & drop de escenas · Notas globales · Auto-completar personajes

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

// Celtx-inspired palette: más cálida y profesional
const C = {
  bgApp:        "#1A1C23",
  bgSidebar:    "#13151B",
  bgEditor:     "#1E2028",
  bgPanel:      "#16181F",
  bgCard:       "#1F2230",
  bgCardHover:  "#252840",
  bgActive:     "#2A2D3E",
  border:       "#2A2D3E",
  borderBright: "#3A3F58",
  accent:       "#5B8DEF",   // azul Celtx
  accentGlow:   "rgba(91,141,239,0.15)",
  accentWarm:   "#E8834A",   // naranja para escenas
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
  return { [T.SCENE]:T.ACTION,[T.ACTION]:T.ACTION,[T.CHARACTER]:T.DIALOGUE,
           [T.PAREN]:T.DIALOGUE,[T.DIALOGUE]:T.CHARACTER,[T.TRANSITION]:T.SCENE }[type] || T.ACTION;
}

function getPlaceholder(type) {
  return { [T.SCENE]:"INT. LUGAR — DÍA",[T.ACTION]:"Descripción de la escena...",[T.CHARACTER]:"NOMBRE",
           [T.PAREN]:"(emoción)",[T.DIALOGUE]:"Línea de diálogo...",[T.TRANSITION]:"CORTE A:" }[type] || "";
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
  return blocks.map((b,i) => b.type===T.SCENE ? {index:i,id:b.id,text:b.text||"Sin título"} : null).filter(Boolean);
}

function countWords(blocks) {
  return blocks.reduce((a,b)=>a+(b.text?.trim().split(/\s+/).filter(Boolean).length||0),0);
}

function estimatePages(blocks) {
  return Math.max(1,Math.ceil(blocks.reduce((a,b)=>a+(b.text?.length||0),0)/1500));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR PDF
// ═══════════════════════════════════════════════════════════════════════════════

function exportToPDF(blocks, projectName) {
  const lines = [];
  blocks.forEach(b => {
    if (!b.text.trim()) return;
    const t = b.type;
    if (t===T.SCENE) lines.push(`<p class="scene">${b.text.toUpperCase()}</p>`);
    else if (t===T.ACTION) lines.push(`<p class="action">${b.text}</p>`);
    else if (t===T.CHARACTER) lines.push(`<p class="character">${b.text.toUpperCase()}</p>`);
    else if (t===T.PAREN) lines.push(`<p class="paren">${b.text}</p>`);
    else if (t===T.DIALOGUE) lines.push(`<p class="dialogue">${b.text}</p>`);
    else if (t===T.TRANSITION) lines.push(`<p class="transition">${b.text.toUpperCase()}</p>`);
  });
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${projectName}</title><style>
  @page{size:Letter;margin:1in 1in 1in 1.5in}
  body{font-family:'Courier New',monospace;font-size:12pt;line-height:1.7;color:#000;background:#fff}
  p{margin:0}.scene{font-weight:bold;text-transform:uppercase;margin-top:24pt;margin-bottom:6pt}
  .action{margin-bottom:12pt}.character{margin-left:2.5in;margin-top:12pt;font-weight:bold;text-transform:uppercase}
  .paren{margin-left:1.8in;margin-right:1.8in;font-style:italic}
  .dialogue{margin-left:1.5in;margin-right:1.5in;margin-bottom:12pt}
  .transition{text-align:right;margin-top:12pt;margin-bottom:12pt;font-weight:bold}
  h1{text-align:center;margin-bottom:6pt;font-size:14pt}.byline{text-align:center;margin-bottom:48pt}
  </style></head><body>
  <h1>${projectName}</h1><p class="byline">Escrito con PLANO Screenwriting</p>
  ${lines.join("\n")}</body></html>`;
  const w=window.open("","_blank"); w.document.write(html); w.document.close();
  setTimeout(()=>w.print(),400);
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
  const blob=new Blob([out],{type:"text/plain"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=`${projectName}.fountain`; a.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;background:${C.bgApp};color:${C.textPrimary};font-family:'Inter',system-ui,sans-serif}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${C.borderBright};border-radius:3px}
  textarea:focus,input:focus{outline:none}
  button{cursor:pointer;font-family:inherit}
  input{font-family:inherit}
  .blk:hover .blk-actions{opacity:1!important}
  @keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
  .fade-in{animation:fadeIn .15s ease}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .saving{animation:pulse 1.2s infinite}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .slide-up{animation:slideUp .22s cubic-bezier(.16,1,.3,1)}
  @keyframes overlay-in{from{opacity:0}to{opacity:1}}
  .overlay-in{animation:overlay-in .15s ease}
  /* highlight de búsqueda */
  mark{background:rgba(91,141,239,0.35);color:${C.white};border-radius:2px;padding:0 1px}
  /* Estilo tipo Celtx: barra lateral izquierda angosta con iconos */
  .icon-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;
    border:none;background:none;color:${C.textMuted};font-size:9px;font-weight:600;
    letter-spacing:.5px;text-transform:uppercase;transition:color .15s,background .15s;
    border-radius:6px;width:100%;cursor:pointer}
  .icon-nav-btn:hover{color:${C.textSec};background:${C.bgCard}}
  .icon-nav-btn.active{color:${C.accent};background:${C.accentGlow}}
  /* mobile */
  @media(max-width:768px){
    .desktop-only{display:none!important}
    .mobile-only{display:flex!important}
  }
  @media(min-width:769px){
    .mobile-only{display:none!important}
  }
`;

function InjectStyles() {
  useEffect(()=>{
    const el=document.createElement("style"); el.textContent=GLOBAL_CSS;
    document.head.appendChild(el); return()=>document.head.removeChild(el);
  },[]);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: UNDO / REDO
// ═══════════════════════════════════════════════════════════════════════════════

function useUndoable(initial) {
  const [history,setHistory]=useState({past:[],present:initial,future:[]});
  const set=useCallback(val=>{
    setHistory(h=>({past:[...h.past.slice(-49),h.present],present:typeof val==="function"?val(h.present):val,future:[]}));
  },[]);
  const undo=useCallback(()=>{
    setHistory(h=>{
      if(!h.past.length)return h;
      const [prev,...rest]=h.past.slice().reverse(); const past=h.past.slice(0,-1);
      return{past,present:prev,future:[h.present,...h.future]};
    });
  },[]);
  const redo=useCallback(()=>{
    setHistory(h=>{
      if(!h.future.length)return h;
      const [next,...rest]=h.future;
      return{past:[...h.past,h.present],present:next,future:rest};
    });
  },[]);
  return[history.present,set,undo,redo,history.past.length>0,history.future.length>0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════════════════════

function Btn({ onClick,children,style={},title,variant="ghost",disabled=false }) {
  const base={
    border:"none",borderRadius:7,fontSize:12,fontWeight:600,
    display:"flex",alignItems:"center",gap:5,transition:"all .14s",
    opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer",
    ...style,
  };
  const variants={
    ghost:{background:"none",color:C.textSec,padding:"5px 8px"},
    primary:{background:C.accent,color:C.white,padding:"6px 14px"},
    outline:{background:"none",border:`1px solid ${C.borderBright}`,color:C.textSec,padding:"5px 12px"},
    danger:{background:"rgba(240,96,96,.12)",color:C.red,padding:"5px 10px",border:`1px solid rgba(240,96,96,.25)`},
  };
  return(
    <button onClick={disabled?undefined:onClick} title={title} disabled={disabled}
      style={{...base,...variants[variant]}}
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

// Modal genérico
function Modal({ open,onClose,title,children,width=420 }) {
  useEffect(()=>{
    if(!open)return;
    const handler=e=>{ if(e.key==="Escape")onClose(); };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[open,onClose]);
  if(!open)return null;
  return(
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.6)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel,border:`1px solid ${C.borderBright}`,borderRadius:12,
        width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 24px 60px rgba(0,0,0,.6)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontWeight:700,fontSize:15,color:C.textPrimary}}>{title}</span>
          <Btn onClick={onClose} style={{fontSize:18,padding:"2px 6px",color:C.textMuted}}>✕</Btn>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BARRA LATERAL IZQUIERDA — NAVEGACIÓN CELTX
// ═══════════════════════════════════════════════════════════════════════════════

function NavSidebar({ tab,onTab,onNewProject,saving,isMobile }) {
  const items=[
    {id:"projects",icon:"📁",label:"Guiones"},
    {id:"scenes",icon:"🎬",label:"Escenas"},
    {id:"characters",icon:"👤",label:"Personajes"},
    {id:"notes",icon:"📝",label:"Notas"},
    {id:"stats",icon:"📊",label:"Stats"},
    {id:"search",icon:"🔍",label:"Buscar"},
  ];
  if(isMobile)return null;
  return(
    <div style={{
      width:64,background:C.bgSidebar,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",alignItems:"center",
      padding:"12px 6px",gap:4,flexShrink:0,height:"100vh",
    }}>
      {/* Logo */}
      <div style={{width:38,height:38,borderRadius:10,marginBottom:8,flexShrink:0,
        background:`linear-gradient(135deg,${C.accent},#3B6CC5)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:18,fontWeight:900,color:C.white,letterSpacing:-1}}>P</div>
      {items.map(it=>(
        <button key={it.id} className={`icon-nav-btn${tab===it.id?" active":""}`}
          onClick={()=>onTab(it.id)} title={it.label}>
          <span style={{fontSize:18}}>{it.icon}</span>
          {it.label}
        </button>
      ))}
      <div style={{flex:1}}/>
      {saving&&<div className="saving" style={{fontSize:9,color:C.textMuted,textAlign:"center",letterSpacing:.5}}>
        Guardando
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DERECHO: contenido según tab
// ═══════════════════════════════════════════════════════════════════════════════

function RightPanel({
  tab,projects,selectedId,onSelectProject,onNewProject,onDeleteProject,onRenameProject,
  scenes,characters,activeBlock,blocks,onNoteChange,stats,onSceneClick,
  searchQuery,onSearchQuery,searchResults,isMobile,onClose,
}) {
  const panelTitle={
    projects:"Guiones",scenes:"Escenas",characters:"Personajes",
    notes:"Notas",stats:"Estadísticas",search:"Búsqueda",
  }[tab]||"Panel";

  const inner=(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {isMobile&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <span style={{fontWeight:700,color:C.textPrimary,fontSize:15}}>{panelTitle}</span>
          <Btn onClick={onClose} style={{fontSize:18,color:C.textMuted}}>✕</Btn>
        </div>
      )}
      {!isMobile&&(
        <div style={{padding:"12px 14px 8px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <span style={{fontSize:11,fontWeight:700,color:C.textMuted,
            textTransform:"uppercase",letterSpacing:1.5}}>{panelTitle}</span>
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"12px 12px"}}>
        {tab==="projects"&&(
          <ProjectsPanel projects={projects} selectedId={selectedId}
            onSelect={onSelectProject} onNew={onNewProject}
            onDelete={onDeleteProject} onRename={onRenameProject}/>
        )}
        {tab==="scenes"&&(
          <ScenesPanel scenes={scenes} onSceneClick={i=>{onSceneClick(i);if(isMobile)onClose();}}/>
        )}
        {tab==="characters"&&<CharactersPanel characters={characters}/>}
        {tab==="notes"&&(
          <NotesPanel activeBlock={activeBlock} blocks={blocks} onNoteChange={onNoteChange}/>
        )}
        {tab==="stats"&&<StatsPanel stats={stats}/>}
        {tab==="search"&&(
          <SearchPanel query={searchQuery} onQuery={onSearchQuery} results={searchResults}
            onResultClick={i=>{onSceneClick(i);if(isMobile)onClose();}}/>
        )}
      </div>
    </div>
  );

  if(isMobile) return(
    <>
      <div className="overlay-in" onClick={onClose} style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,
      }}/>
      <div className="slide-up" style={{
        position:"fixed",bottom:0,left:0,right:0,zIndex:201,
        background:C.bgPanel,borderTop:`1px solid ${C.borderBright}`,
        borderRadius:"14px 14px 0 0",maxHeight:"70vh",display:"flex",flexDirection:"column",
        boxShadow:"0 -12px 40px rgba(0,0,0,.5)",
      }}>{inner}</div>
    </>
  );

  return(
    <div style={{
      width:240,background:C.bgPanel,borderLeft:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",height:"100vh",flexShrink:0,
    }}>{inner}</div>
  );
}

// ──── SUB-PANELES ────────────────────────────────────────────────────────────

function ProjectsPanel({projects,selectedId,onSelect,onNew,onDelete,onRename}){
  const[search,setSearch]=useState("");
  const filtered=projects.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar..." style={{
            flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,
            padding:"7px 10px",color:C.textSec,fontSize:12,outline:"none",
          }}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.border}/>
        <Btn onClick={onNew} variant="primary" style={{padding:"7px 10px",fontSize:16,borderRadius:7}}>+</Btn>
      </div>
      {filtered.map(p=>(
        <ProjectItem key={p.id} project={p} isActive={p.id===selectedId}
          onSelect={()=>onSelect(p.id)} onDelete={()=>onDelete(p.id)}
          onRename={n=>onRename(p.id,n)}/>
      ))}
    </div>
  );
}

function ProjectItem({project,isActive,onSelect,onDelete,onRename}){
  const[editing,setEditing]=useState(false);
  const[name,setName]=useState(project.name);
  const[hover,setHover]=useState(false);
  const commit=()=>{ if(name.trim())onRename(name.trim()); else setName(project.name); setEditing(false); };
  return(
    <div onClick={onSelect} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{padding:"8px 10px",borderRadius:8,marginBottom:3,cursor:"pointer",
        background:isActive?C.bgActive:hover?C.bgCard:"transparent",
        border:isActive?`1px solid ${C.borderBright}`:"1px solid transparent",
        transition:"all .12s",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:16,flexShrink:0}}>🎬</span>
      {editing?(
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onBlur={commit} onClick={e=>e.stopPropagation()}
          onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setName(project.name);setEditing(false);}}}
          style={{flex:1,background:C.bgApp,border:`1px solid ${C.accent}`,borderRadius:5,
            padding:"2px 6px",color:C.textPrimary,fontSize:12,outline:"none"}}/>
      ):(
        <span style={{flex:1,fontSize:12,color:isActive?C.textPrimary:C.textSec,fontWeight:isActive?600:400,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</span>
      )}
      {(hover||isActive)&&!editing&&(
        <div style={{display:"flex",gap:2}} onClick={e=>e.stopPropagation()}>
          <Btn onClick={()=>setEditing(true)} style={{padding:"2px 4px",fontSize:11}}>✏️</Btn>
          <Btn onClick={onDelete} style={{padding:"2px 4px",fontSize:11}}>🗑</Btn>
        </div>
      )}
    </div>
  );
}

function ScenesPanel({scenes,onSceneClick}){
  return(
    <div>
      <p style={{fontSize:10,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5,
        fontWeight:700,marginBottom:10}}>{scenes.length} escenas</p>
      {scenes.length===0&&(
        <p style={{fontSize:12,color:C.textMuted,fontStyle:"italic"}}>
          Escribí un encabezado INT./EXT. para que aparezca aquí.
        </p>
      )}
      {scenes.map((s,i)=>(
        <div key={s.id} onClick={()=>onSceneClick(s.index)}
          style={{padding:"8px 10px",marginBottom:4,borderRadius:7,
            background:C.bgCard,border:`1px solid ${C.border}`,
            cursor:"pointer",transition:"border-color .14s,background .14s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.bgCardHover}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:10,fontWeight:700,color:C.accentWarm,
              background:"rgba(232,131,74,.1)",padding:"2px 6px",borderRadius:4,
              flexShrink:0,minWidth:24,textAlign:"center"}}>{i+1}</span>
            <span style={{fontSize:11,color:C.textSec,overflow:"hidden",
              textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace"}}>{s.text||"Sin título"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CharactersPanel({characters}){
  const entries=Object.entries(characters);
  const maxLines=Math.max(1,...entries.map(([,i])=>i.lines));
  return(
    <div>
      <p style={{fontSize:10,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:10}}>
        {entries.length} personajes
      </p>
      {entries.length===0&&(
        <p style={{fontSize:12,color:C.textMuted,fontStyle:"italic"}}>Los personajes aparecen al escribir diálogos.</p>
      )}
      {entries.sort((a,b)=>b[1].lines-a[1].lines).map(([name,info])=>(
        <div key={name} style={{padding:"10px",marginBottom:6,borderRadius:8,
          background:C.bgCard,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:info.color,
              flexShrink:0,boxShadow:`0 0 6px ${info.color}70`}}/>
            <span style={{fontSize:12,color:info.color,fontWeight:700,
              fontFamily:"monospace",letterSpacing:.5,flex:1}}>{name}</span>
            <span style={{fontSize:10,color:C.textMuted}}>{info.lines}</span>
          </div>
          {/* barra de líneas */}
          <div style={{height:3,borderRadius:2,background:C.border}}>
            <div style={{height:"100%",borderRadius:2,background:info.color,
              width:`${Math.round(info.lines/maxLines*100)}%`,transition:"width .3s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPanel({activeBlock,blocks,onNoteChange}){
  const block=blocks[activeBlock];
  const withNotes=blocks.map((b,i)=>({...b,index:i})).filter(b=>b.note?.trim());
  return(
    <div>
      {block?(
        <>
          <p style={{fontSize:10,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:8}}>
            Nota del bloque activo
          </p>
          <div style={{padding:"10px",borderRadius:8,background:C.bgCard,
            border:`1px solid ${C.borderBright}`,marginBottom:16}}>
            <p style={{fontSize:10,color:C.textMuted,marginBottom:6}}>
              <span style={{color:typeColor(block.type)}}>[{typeLabel(block.type)}]</span>{" "}
              {block.text?.slice(0,35)||(
                <span style={{fontStyle:"italic"}}>(vacío)</span>
              )}
            </p>
            <textarea value={block.note||""} onChange={e=>onNoteChange(activeBlock,e.target.value)}
              placeholder="Anotá ideas, referencias, preguntas..."
              rows={4} style={{width:"100%",background:"transparent",border:"none",
                color:C.textSec,fontSize:12,resize:"vertical",outline:"none",
                lineHeight:1.65,fontFamily:"inherit"}}/>
          </div>
        </>
      ):(
        <p style={{fontSize:12,color:C.textMuted,fontStyle:"italic",marginBottom:16}}>
          Seleccioná un bloque para agregar una nota.
        </p>
      )}
      {withNotes.length>0&&(
        <>
          <p style={{fontSize:10,color:C.textMuted,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:8}}>
            Todas las notas · {withNotes.length}
          </p>
          {withNotes.map(b=>(
            <div key={b.id} style={{padding:"9px 10px",marginBottom:5,borderRadius:7,
              background:C.bgCard,border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${C.yellow}`}}>
              <p style={{fontSize:10,color:C.yellow,marginBottom:4,fontFamily:"monospace"}}>
                {b.text?.slice(0,28)||"(vacío)"}
              </p>
              <p style={{fontSize:11,color:C.textSec,lineHeight:1.55}}>{b.note}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function StatsPanel({stats}){
  const items=[["Palabras",stats.words],["Páginas aprox.",stats.pages],["Escenas",stats.scenes],
    ["Personajes",stats.characters],["Diálogos",stats.dialogues],["Bloques",stats.blocks]];
  return(
    <div>
      {items.map(([label,val])=>(
        <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"9px 10px",marginBottom:4,borderRadius:7,background:C.bgCard,border:`1px solid ${C.border}`}}>
          <span style={{fontSize:12,color:C.textSec}}>{label}</span>
          <span style={{fontSize:15,color:C.textPrimary,fontWeight:700}}>{val}</span>
        </div>
      ))}
      <div style={{marginTop:12,padding:"12px 14px",borderRadius:9,
        background:`rgba(${hexToRgb(C.accent)},.08)`,border:`1px solid rgba(${hexToRgb(C.accent)},.25)`}}>
        <p style={{fontSize:10,color:C.accent,marginBottom:4,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>
          Duración estimada
        </p>
        <p style={{fontSize:26,color:C.textPrimary,fontWeight:800,lineHeight:1}}>~{stats.pages}<span style={{fontSize:13,fontWeight:400,marginLeft:4}}>min</span></p>
        <p style={{fontSize:10,color:C.textMuted,marginTop:4}}>1 página ≈ 1 minuto en pantalla</p>
      </div>
    </div>
  );
}

function SearchPanel({query,onQuery,results,onResultClick}){
  return(
    <div>
      <input value={query} onChange={e=>onQuery(e.target.value)}
        placeholder="Buscar en el guion..." autoFocus
        style={{width:"100%",background:C.bgCard,border:`1px solid ${C.borderBright}`,
          borderRadius:8,padding:"9px 12px",color:C.textPrimary,fontSize:13,
          outline:"none",marginBottom:12,transition:"border-color .14s"}}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>e.target.style.borderColor=C.borderBright}/>
      {query.length>1&&(
        <p style={{fontSize:10,color:C.textMuted,marginBottom:8}}>
          {results.length} resultado{results.length!==1?"s":""}
        </p>
      )}
      {results.map(r=>(
        <div key={r.id} onClick={()=>onResultClick(r.index)}
          style={{padding:"9px 10px",marginBottom:4,borderRadius:7,
            background:C.bgCard,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all .13s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <span style={{fontSize:9,fontWeight:700,color:typeColor(r.type),
              background:`rgba(${hexToRgb(typeColor(r.type))},.1)`,padding:"1px 5px",borderRadius:3}}>
              {typeLabel(r.type)}
            </span>
          </div>
          <p style={{fontSize:11,color:C.textSec,lineHeight:1.5,
            overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}
            dangerouslySetInnerHTML={{__html:r.highlighted}}/>
        </div>
      ))}
      {query.length>1&&results.length===0&&(
        <p style={{fontSize:12,color:C.textMuted,fontStyle:"italic",textAlign:"center",marginTop:16}}>
          Sin resultados para "{query}"
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBAR SUPERIOR
// ═══════════════════════════════════════════════════════════════════════════════

function Toolbar({activeType,onTypeChange,onExport,onExportFountain,projectName,saving,canUndo,canRedo,onUndo,onRedo,focusMode,onFocusMode,isMobile,onMobileMenu,mobileTab}){
  const types=[
    {type:T.SCENE,label:"Escena",short:"ESC",color:C.accentWarm},
    {type:T.ACTION,label:"Acción",short:"ACC",color:C.textSec},
    {type:T.CHARACTER,label:"Personaje",short:"PER",color:C.green},
    {type:T.PAREN,label:"(paren)",short:"PAR",color:"#F4A96D"},
    {type:T.DIALOGUE,label:"Diálogo",short:"DIA",color:C.accent},
    {type:T.TRANSITION,label:"Transición",short:"TRA",color:C.purple},
  ];
  const[showExport,setShowExport]=useState(false);

  return(
    <div style={{background:C.bgPanel,borderBottom:`1px solid ${C.border}`,
      padding:"0 12px",display:"flex",alignItems:"center",gap:4,flexShrink:0,height:46}}>

      {/* Mobile: hamburger + tab name */}
      {isMobile&&(
        <>
          <button onClick={onMobileMenu} style={{background:"none",border:"none",
            color:C.textSec,fontSize:20,padding:"4px 6px",cursor:"pointer"}}>☰</button>
          <span style={{fontSize:12,color:C.textSec,fontWeight:600,flex:1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projectName}</span>
        </>
      )}

      {/* Tipos de bloque */}
      <div style={{display:"flex",gap:2,flexWrap:"nowrap",overflowX:"auto",
        scrollbarWidth:"none",msOverflowStyle:"none"}} className="desktop-only">
        {types.map(t=>{
          const on=activeType===t.type;
          return(
            <button key={t.type} onClick={()=>onTypeChange(t.type)}
              title={`${t.label} (Tab)`}
              style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:on?700:400,
                background:on?`rgba(${hexToRgb(t.color)},.14)`:"transparent",
                border:on?`1px solid rgba(${hexToRgb(t.color)},.4)`:"1px solid transparent",
                color:on?t.color:C.textMuted,transition:"all .12s",whiteSpace:"nowrap",
                fontFamily:"inherit",cursor:"pointer",
              }}
              onMouseEnter={e=>{if(!on){e.currentTarget.style.color=C.textSec;e.currentTarget.style.background=C.bgCard}}}
              onMouseLeave={e=>{if(!on){e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="transparent"}}}
            >{isMobile?t.short:t.label}</button>
          );
        })}
      </div>

      {/* Tipos mobile (scroll horizontal compacto) */}
      <div className="mobile-only" style={{display:"flex",gap:2,overflowX:"auto",flex:1,
        scrollbarWidth:"none",msOverflowStyle:"none",paddingRight:4}}>
        {types.map(t=>{
          const on=activeType===t.type;
          return(
            <button key={t.type} onClick={()=>onTypeChange(t.type)}
              style={{padding:"4px 8px",borderRadius:5,fontSize:10,fontWeight:on?700:400,
                background:on?`rgba(${hexToRgb(t.color)},.15)`:"transparent",
                border:on?`1px solid rgba(${hexToRgb(t.color)},.4)`:"1px solid transparent",
                color:on?t.color:C.textMuted,whiteSpace:"nowrap",fontFamily:"inherit",cursor:"pointer",flexShrink:0,
              }}
            >{t.short}</button>
          );
        })}
      </div>

      <div style={{flex:1}} className="desktop-only"/>

      {/* Undo/redo */}
      <Btn onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)" style={{padding:"4px 7px",fontSize:14}}>↩</Btn>
      <Btn onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)" style={{padding:"4px 7px",fontSize:14}}>↪</Btn>

      {/* Modo foco */}
      <Btn onClick={onFocusMode} title="Modo foco"
        style={{padding:"4px 7px",fontSize:14,color:focusMode?C.accent:C.textMuted}}>⊙</Btn>

      {/* Exportar */}
      <div style={{position:"relative"}}>
        <Btn onClick={()=>setShowExport(v=>!v)} variant="outline"
          style={{gap:4,padding:"4px 10px",fontSize:12}}>
          ↓ <span className="desktop-only" style={{display:"inline"}}>Exportar</span>
        </Btn>
        {showExport&&(
          <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.bgPanel,
            border:`1px solid ${C.borderBright}`,borderRadius:9,padding:6,
            zIndex:300,minWidth:160,boxShadow:"0 12px 32px rgba(0,0,0,.5)"}}>
            <button onClick={()=>{onExport();setShowExport(false);}} style={{
              display:"block",width:"100%",padding:"8px 12px",background:"none",border:"none",
              color:C.textSec,fontSize:12,textAlign:"left",cursor:"pointer",borderRadius:6,fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              📄 PDF (para impresión)
            </button>
            <button onClick={()=>{onExportFountain();setShowExport(false);}} style={{
              display:"block",width:"100%",padding:"8px 12px",background:"none",border:"none",
              color:C.textSec,fontSize:12,textAlign:"left",cursor:"pointer",borderRadius:6,fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              ✏️ Fountain (.fountain)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOQUE DE GUION
// ═══════════════════════════════════════════════════════════════════════════════

function ScriptBlock({block,index,isActive,characterColors,onUpdate,onFocus,onKeyDown,inputRef,charSuggestions,onAcceptSuggestion,isMobile}){
  const color=characterColors[block.text?.trim()?.toUpperCase()]||C.green;
  const[showSug,setShowSug]=useState(false);

  const base={width:"100%",border:"none",outline:"none",background:"transparent",
    resize:"none",fontFamily:"'Courier Prime','Courier New',monospace",
    fontSize:isMobile?15:14,lineHeight:"1.8",caretColor:C.accent,
    overflow:"hidden",minHeight:26,boxSizing:"border-box",display:"block",padding:0};

  const styles={
    [T.SCENE]:{...base,fontWeight:700,color:C.accentWarm,textTransform:"uppercase",letterSpacing:.5},
    [T.ACTION]:{...base,color:"#C5D0E6"},
    [T.CHARACTER]:{...base,textAlign:"center",fontWeight:700,textTransform:"uppercase",color},
    [T.PAREN]:{...base,paddingLeft:isMobile?"20%":"26%",paddingRight:isMobile?"20%":"26%",color:"#F4A96D",fontStyle:"italic"},
    [T.DIALOGUE]:{...base,paddingLeft:isMobile?"12%":"18%",paddingRight:isMobile?"12%":"18%",color:C.textPrimary},
    [T.TRANSITION]:{...base,textAlign:"right",fontWeight:700,textTransform:"uppercase",color:C.purple},
  };

  const wrappers={
    [T.SCENE]:{marginTop:32,paddingTop:14,borderTop:`1px solid ${C.border}`},
    [T.CHARACTER]:{marginTop:20},[T.TRANSITION]:{marginTop:20},
    [T.PAREN]:{},[T.DIALOGUE]:{},[T.ACTION]:{},
  };

  const hasNote=!!block.note?.trim();
  const col=typeColor(block.type);

  // Autocomplete personajes
  const handleChange=e=>{
    onUpdate(index,e.target.value);
    e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px";
    if(block.type===T.CHARACTER&&charSuggestions.length>0) setShowSug(true);
  };

  return(
    <div className="blk" style={{position:"relative",...(wrappers[block.type]||{}),
      background:isActive?"rgba(91,141,239,0.03)":"transparent",
      borderLeft:isActive?`2px solid rgba(91,141,239,.4)`:"2px solid transparent",
      paddingLeft:8,paddingRight:hasNote?20:0,borderRadius:4,transition:"background .1s"}}
      onClick={()=>onFocus(index)}>

      {/* Tipo badge cuando activo */}
      {isActive&&!isMobile&&(
        <div style={{position:"absolute",left:-48,top:0,fontSize:8,fontWeight:700,
          color:col,letterSpacing:.5,textTransform:"uppercase",
          background:`rgba(${hexToRgb(col)},.1)`,padding:"2px 5px",borderRadius:3,
          border:`1px solid rgba(${hexToRgb(col)},.2)`}}>
          {typeLabel(block.type)}
        </div>
      )}

      {hasNote&&(
        <div title={block.note} style={{position:"absolute",right:0,top:6,
          width:8,height:8,borderRadius:"50%",background:C.yellow,
          boxShadow:`0 0 6px ${C.yellow}80`}}/>
      )}

      <textarea ref={inputRef} value={block.text}
        onChange={handleChange}
        onFocus={()=>{onFocus(index);if(block.type===T.CHARACTER&&charSuggestions.length>0)setShowSug(true);}}
        onBlur={()=>setTimeout(()=>setShowSug(false),150)}
        onKeyDown={e=>{
          if(showSug&&e.key==="ArrowDown"&&charSuggestions.length>0){
            e.preventDefault(); onAcceptSuggestion(charSuggestions[0]);setShowSug(false); return;
          }
          if(showSug&&e.key==="Escape"){setShowSug(false);return;}
          onKeyDown(e,index);
        }}
        rows={1} style={styles[block.type]||base}
        placeholder={isActive?getPlaceholder(block.type):""}
        spellCheck/>

      {/* Autocomplete dropdown */}
      {showSug&&block.type===T.CHARACTER&&charSuggestions.length>0&&block.text.trim()&&(
        <div style={{position:"absolute",left:"30%",top:"100%",zIndex:100,
          background:C.bgPanel,border:`1px solid ${C.borderBright}`,borderRadius:7,
          boxShadow:"0 8px 24px rgba(0,0,0,.5)",overflow:"hidden",minWidth:160}}>
          {charSuggestions.slice(0,5).map(name=>(
            <div key={name} onClick={()=>{onAcceptSuggestion(name);setShowSug(false);}}
              style={{padding:"8px 12px",fontSize:12,color:characterColors[name]||C.green,
                fontFamily:"monospace",fontWeight:600,cursor:"pointer",transition:"background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS POR DEFECTO
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PROJECT=()=>({
  id:uid(),name:"Mi Primer Guion",createdAt:Date.now(),
  blocks:[
    {id:uid(),type:T.SCENE,text:"INT. CAFÉ — NOCHE",note:""},
    {id:uid(),type:T.ACTION,text:"El café está casi vacío. Una lámpara parpadeante ilumina la barra de madera desgastada.",note:""},
    {id:uid(),type:T.CHARACTER,text:"SOFÍA",note:""},
    {id:uid(),type:T.DIALOGUE,text:"¿Cuánto tiempo llevas esperando?",note:""},
    {id:uid(),type:T.CHARACTER,text:"RODRIGO",note:""},
    {id:uid(),type:T.PAREN,text:"(sin levantar la vista)",note:""},
    {id:uid(),type:T.DIALOGUE,text:"Lo suficiente como para saber que no ibas a venir.",note:""},
    {id:uid(),type:T.TRANSITION,text:"CORTE A:",note:""},
    {id:uid(),type:T.SCENE,text:"EXT. CALLE MOJADA — NOCHE CONTINUA",note:""},
    {id:uid(),type:T.ACTION,text:"Sofía camina rápido bajo la lluvia. Sus pasos resuenan en el asfalto vacío.",note:""},
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function App(){
  // Proyectos
  const[projects,setProjects]=useState(()=>{
    try{ const s=localStorage.getItem("plano-v4"); if(s)return JSON.parse(s); }catch{}
    return[DEFAULT_PROJECT()];
  });
  const[selectedId,setSelectedId]=useState(()=>projects[0]?.id);
  const project=projects.find(p=>p.id===selectedId)||projects[0];

  // Bloques con undo/redo por proyecto
  const[blocks,setBlocksRaw,undo,redo,canUndo,canRedo]=useUndoable(project?.blocks||[]);

  // Sincronizar blocks cuando cambia proyecto
  const lastProjectId=useRef(selectedId);
  useEffect(()=>{
    if(selectedId!==lastProjectId.current){
      lastProjectId.current=selectedId;
      setBlocksRaw(project?.blocks||[]);
    }
  },[selectedId]);

  // Propagar cambios de blocks al proyecto
  const blocksRef=useRef(blocks);
  blocksRef.current=blocks;
  const updateBlocks=useCallback(nb=>{
    setBlocksRaw(nb);
    setProjects(prev=>prev.map(p=>p.id===selectedId?{...p,blocks:nb}:p));
  },[selectedId,setBlocksRaw]);

  // UI state
  const[activeIndex,setActiveIndex]=useState(0);
  const[navTab,setNavTab]=useState("scenes");
  const[saving,setSaving]=useState(false);
  const[focusMode,setFocusMode]=useState(false);
  const[searchQuery,setSearchQuery]=useState("");
  const[mobilePanel,setMobilePanel]=useState(false);
  const[mobilePanelTab,setMobilePanelTab]=useState("projects");
  const[newProjectModal,setNewProjectModal]=useState(false);
  const[newProjectName,setNewProjectName]=useState("");

  const inputRefs=useRef({});
  const editorRef=useRef(null);
  const saveTimer=useRef(null);

  // Detectar mobile
  const[isMobile,setIsMobile]=useState(()=>window.innerWidth<=768);
  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);

  // Autosave
  useEffect(()=>{
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      try{localStorage.setItem("plano-v4",JSON.stringify(projects));}catch{}
      setSaving(false);
    },800);
    return()=>clearTimeout(saveTimer.current);
  },[projects]);

  // Auto-resize al cambiar proyecto
  useEffect(()=>{
    setActiveIndex(0);
    setTimeout(()=>{
      Object.values(inputRefs.current).forEach(r=>{
        if(r){r.style.height="auto";r.style.height=r.scrollHeight+"px";}
      });
    },40);
  },[selectedId]);

  // Keyboard shortcuts globales
  useEffect(()=>{
    const handler=e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){e.preventDefault();undo();}
      if((e.ctrlKey||e.metaKey)&&(e.key==="y"||(e.key==="z"&&e.shiftKey))){e.preventDefault();redo();}
      if((e.ctrlKey||e.metaKey)&&e.key==="f"){e.preventDefault();
        if(isMobile){setMobilePanelTab("search");setMobilePanel(true);}
        else setNavTab("search");}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[undo,redo,isMobile]);

  // Personajes para autocomplete
  const characters=useMemo(()=>extractCharacters(blocks),[blocks]);
  const scenes=useMemo(()=>extractScenes(blocks),[blocks]);
  const words=useMemo(()=>countWords(blocks),[blocks]);
  const pages=useMemo(()=>estimatePages(blocks),[blocks]);
  const characterColors=useMemo(()=>{
    const m={}; Object.entries(characters).forEach(([n,i])=>{m[n]=i.color;}); return m;
  },[characters]);

  const stats={words,pages,scenes:scenes.length,characters:Object.keys(characters).length,
    dialogues:blocks.filter(b=>b.type===T.DIALOGUE).length,blocks:blocks.length};

  // Búsqueda
  const searchResults=useMemo(()=>{
    if(searchQuery.length<2)return[];
    const q=searchQuery.toLowerCase();
    return blocks.map((b,i)=>({...b,index:i})).filter(b=>b.text?.toLowerCase().includes(q)).map(b=>{
      const esc=searchQuery.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const re=new RegExp(`(${esc})`,"gi");
      const highlighted=(b.text||"").replace(re,"<mark>$1</mark>");
      return{...b,highlighted};
    });
  },[blocks,searchQuery]);

  // Autocomplete para personajes
  const charSuggestions=useMemo(()=>{
    const b=blocks[activeIndex];
    if(!b||b.type!==T.CHARACTER||!b.text.trim())return[];
    const q=b.text.trim().toUpperCase();
    return Object.keys(characters).filter(n=>n.startsWith(q)&&n!==q);
  },[blocks,activeIndex,characters]);

  // Handlers de bloques
  const updateBlock=useCallback((index,text)=>{
    updateBlocks(blocks.map((b,i)=>i===index?{...b,text}:b));
  },[blocks,updateBlocks]);

  const updateNote=useCallback((index,note)=>{
    updateBlocks(blocks.map((b,i)=>i===index?{...b,note}:b));
  },[blocks,updateBlocks]);

  const handleKeyDown=useCallback((e,index)=>{
    const block=blocks[index];
    if(e.key==="Enter"&&!e.shiftKey){
      e.preventDefault();
      const nb={id:uid(),type:nextType(block.type),text:"",note:""};
      const updated=[...blocks]; updated.splice(index+1,0,nb);
      updateBlocks(updated);
      setTimeout(()=>{inputRefs.current[index+1]?.focus();setActiveIndex(index+1);},10);
    }
    if(e.key==="Backspace"&&block.text===""&&blocks.length>1){
      e.preventDefault();
      updateBlocks(blocks.filter((_,i)=>i!==index));
      const prev=Math.max(0,index-1);
      setTimeout(()=>{inputRefs.current[prev]?.focus();setActiveIndex(prev);},10);
    }
    if(e.key==="Tab"){
      e.preventDefault();
      const order=[T.SCENE,T.ACTION,T.CHARACTER,T.PAREN,T.DIALOGUE,T.TRANSITION];
      const cur=order.indexOf(block.type);
      const nxt=e.shiftKey?order[(cur-1+order.length)%order.length]:order[(cur+1)%order.length];
      updateBlocks(blocks.map((b,i)=>i===index?{...b,type:nxt}:b));
    }
    if(e.key==="ArrowUp"&&index>0){e.preventDefault();inputRefs.current[index-1]?.focus();setActiveIndex(index-1);}
    if(e.key==="ArrowDown"&&index<blocks.length-1){e.preventDefault();inputRefs.current[index+1]?.focus();setActiveIndex(index+1);}
  },[blocks,updateBlocks]);

  const changeType=useCallback(type=>{
    updateBlocks(blocks.map((b,i)=>i===activeIndex?{...b,type}:b));
  },[activeIndex,blocks,updateBlocks]);

  const scrollToBlock=useCallback(index=>{
    setActiveIndex(index);
    setTimeout(()=>{
      inputRefs.current[index]?.scrollIntoView({behavior:"smooth",block:"center"});
      inputRefs.current[index]?.focus();
    },50);
  },[]);

  // Proyectos
  const createProject=()=>{
    if(!newProjectName.trim())return;
    const p={id:uid(),name:newProjectName.trim(),createdAt:Date.now(),
      blocks:[{id:uid(),type:T.SCENE,text:"",note:""}]};
    setProjects(prev=>[...prev,p]);
    setSelectedId(p.id);
    setNewProjectName(""); setNewProjectModal(false);
  };

  const deleteProject=id=>{
    if(projects.length===1)return;
    if(!confirm("¿Eliminar este guion?"))return;
    const updated=projects.filter(p=>p.id!==id);
    setProjects(updated);
    if(selectedId===id)setSelectedId(updated[0].id);
  };

  const renameProject=(id,name)=>{
    setProjects(prev=>prev.map(p=>p.id===id?{...p,name}:p));
  };

  const openMobilePanel=tab=>{
    setMobilePanelTab(tab);
    setMobilePanel(true);
  };

  // Render del panel derecho (desktop o mobile bottom sheet)
  const panelProps={
    tab:isMobile?mobilePanelTab:navTab,
    projects,selectedId,
    onSelectProject:id=>{setSelectedId(id);if(isMobile)setMobilePanel(false);},
    onNewProject:()=>setNewProjectModal(true),
    onDeleteProject:deleteProject,onRenameProject:renameProject,
    scenes,characters,activeBlock:activeIndex,blocks,onNoteChange:updateNote,
    stats,onSceneClick:scrollToBlock,
    searchQuery,onSearchQuery:setSearchQuery,searchResults,
    isMobile,onClose:()=>setMobilePanel(false),
  };

  return(
    <>
      <InjectStyles/>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:C.bgApp}}>

        {/* Nav lateral (solo desktop) */}
        {!isMobile&&!focusMode&&(
          <NavSidebar tab={navTab} onTab={setNavTab} saving={saving}/>
        )}

        {/* Centro */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

          {/* Toolbar */}
          {!focusMode&&(
            <Toolbar
              activeType={blocks[activeIndex]?.type||T.ACTION}
              onTypeChange={changeType}
              onExport={()=>exportToPDF(blocks,project?.name||"Guion")}
              onExportFountain={()=>exportToFountain(blocks,project?.name||"Guion")}
              projectName={project?.name} saving={saving}
              canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
              focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}
              isMobile={isMobile}
              onMobileMenu={()=>openMobilePanel("projects")}
              mobileTab={mobilePanelTab}/>
          )}

          {/* Header del guion */}
          {!focusMode&&(
            <div style={{padding:"7px 24px 7px",background:C.bgPanel,
              borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,
              flexWrap:"wrap",minHeight:36}}>
              <h1 style={{margin:0,fontSize:14,fontWeight:700,color:C.accent,
                fontFamily:"'Courier Prime',monospace",letterSpacing:-.2,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:isMobile?180:300}}>
                {project?.name}
              </h1>
              <span style={{fontSize:11,color:C.textMuted}}>
                {words} palabras · ~{pages} pág · {scenes.length} esc
              </span>
              {!isMobile&&<span style={{fontSize:11,color:C.textFaint,marginLeft:"auto"}}>
                Tab = cambiar tipo · Enter = siguiente · Ctrl+Z = deshacer · Ctrl+F = buscar
              </span>}
              {/* Botones mobile rápidos */}
              {isMobile&&(
                <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                  {[{id:"scenes",icon:"🎬"},{id:"characters",icon:"👤"},{id:"search",icon:"🔍"},{id:"notes",icon:"📝"}].map(it=>(
                    <button key={it.id} onClick={()=>openMobilePanel(it.id)}
                      style={{background:C.bgCard,border:`1px solid ${C.border}`,
                        borderRadius:6,padding:"4px 7px",fontSize:14,cursor:"pointer"}}>
                      {it.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modo foco: botón salir */}
          {focusMode&&(
            <div style={{position:"fixed",top:14,right:14,zIndex:500}}>
              <Btn onClick={()=>setFocusMode(false)} variant="outline"
                style={{fontSize:11,padding:"5px 12px"}}>Salir del foco ✕</Btn>
            </div>
          )}

          {/* Editor */}
          <div ref={editorRef} style={{
            flex:1,overflowY:"auto",
            padding:focusMode?"40px 20px 80px":isMobile?"20px 16px 100px":"28px 48px 80px",
            background:focusMode?C.bgApp:C.bgEditor,transition:"background .3s",
          }}>
            <div style={{maxWidth:focusMode?600:700,margin:"0 auto",
              paddingLeft:isMobile?0:50}}>
              {blocks.map((block,index)=>(
                <ScriptBlock key={block.id} block={block} index={index}
                  isActive={index===activeIndex} characterColors={characterColors}
                  onUpdate={updateBlock} onFocus={setActiveIndex}
                  onKeyDown={handleKeyDown} isMobile={isMobile}
                  charSuggestions={index===activeIndex?charSuggestions:[]}
                  onAcceptSuggestion={name=>updateBlock(index,name)}
                  inputRef={el=>{
                    if(el)inputRefs.current[index]=el;
                    else delete inputRefs.current[index];
                  }}/>
              ))}

              {/* Añadir al final */}
              <div onClick={()=>{
                  const nb={id:uid(),type:T.ACTION,text:"",note:""};
                  const updated=[...blocks,nb];
                  updateBlocks(updated);
                  setTimeout(()=>{
                    const i=updated.length-1;
                    inputRefs.current[i]?.focus();setActiveIndex(i);
                  },10);
                }}
                style={{marginTop:32,paddingTop:16,borderTop:`1px dashed ${C.border}`,
                  textAlign:"center",color:C.textFaint,fontSize:12,cursor:"pointer",
                  transition:"color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.color=C.textMuted}
                onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
                + agregar elemento
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho — solo desktop */}
        {!isMobile&&!focusMode&&<RightPanel {...panelProps}/>}

        {/* Mobile bottom sheet */}
        {isMobile&&mobilePanel&&<RightPanel {...panelProps}/>}
      </div>

      {/* Modal nuevo proyecto */}
      <Modal open={newProjectModal} onClose={()=>setNewProjectModal(false)} title="Nuevo guion" width={360}>
        <p style={{fontSize:13,color:C.textSec,marginBottom:12}}>Dale un nombre a tu guion:</p>
        <input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)}
          placeholder="Ej: El último café"
          autoFocus
          onKeyDown={e=>{if(e.key==="Enter")createProject();}}
          style={{width:"100%",background:C.bgCard,border:`1px solid ${C.borderBright}`,
            borderRadius:8,padding:"10px 14px",color:C.textPrimary,fontSize:14,
            outline:"none",marginBottom:16,transition:"border-color .14s"}}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.borderBright}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn onClick={()=>setNewProjectModal(false)} variant="outline">Cancelar</Btn>
          <Btn onClick={createProject} variant="primary" disabled={!newProjectName.trim()}>Crear guion</Btn>
        </div>
      </Modal>
    </>
  );
}
