import { useState, useEffect, useRef, useMemo } from "react";
import { RADIUS, SHADOW, hexToRgb } from "../design/tokens";
import { useTheme } from "../contexts/ThemeContext";
import { Icons } from "../lib/icons";
import { Btn } from "./common";
import { buildSceneGroups, parseSceneHeading, charactersInScene, typeLabel, typeColor, normalizeNote, NOTE_CATEGORIES, noteCategoryMeta, noteCategoryColor, formatDuration } from "../utils/screenplay";

export function RightPanel({ tab, projects, selectedId, onSelectProject, onNewProject, onDeleteProject,
  onRenameProject, onReorderProjects, onOpenTrash,
  scenes, characters, activeBlock, blocks, onNoteChange, stats,
  onSceneClick, searchQuery, onSearchQuery, searchResults, isMobile }) {
  const C = useTheme();

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
          onReorderProjects={onReorderProjects} onOpenTrash={onOpenTrash}
          scenes={scenes} characters={characters} activeBlock={activeBlock}
          blocks={blocks} onNoteChange={onNoteChange} stats={stats}
          onSceneClick={onSceneClick} searchQuery={searchQuery}
          onSearchQuery={onSearchQuery} searchResults={searchResults}
          isMobile={false}/>
      </div>
    </div>
  );
}

export function MobilePanel({ tab, projects, selectedId, onSelectProject, onNewProject, onDeleteProject,
  onRenameProject, scenes, characters, characterColors, activeBlock, blocks, onNoteChange, stats,
  onSceneClick, onReorderScenes, isDark, searchQuery, onSearchQuery, searchResults, onBack }) {
  const C = useTheme();

  const panelTitle = {
    projects:"Guiones", scenes:"Escenas", corkboard:"Tablero", characters:"Personajes",
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
          color:C.textSec,cursor:"pointer",padding:"2px 4px",lineHeight:1,display:"flex",alignItems:"center"}}>
          <Icons.Back/>
        </button>
        <span style={{fontWeight:700, color:C.textPrimary, fontSize:16}}>{panelTitle}</span>
      </div>

      <div style={{flex:1, overflowY:"auto", padding: tab==="corkboard" ? 0 : "14px 16px"}}>
        <PanelContent tab={tab} projects={projects} selectedId={selectedId}
          onSelectProject={p=>{onSelectProject(p);onBack();}}
          onNewProject={onNewProject}
          onDeleteProject={onDeleteProject} onRenameProject={onRenameProject}
          scenes={scenes} characters={characters} characterColors={characterColors}
          activeBlock={activeBlock}
          blocks={blocks} onNoteChange={onNoteChange} stats={stats}
          onSceneClick={i=>{onSceneClick(i);onBack();}} onReorderScenes={onReorderScenes} isDark={isDark}
          searchQuery={searchQuery}
          onSearchQuery={onSearchQuery}
          searchResults={searchResults}
          onResultClick={i=>{onSceneClick(i);onBack();}}
          isMobile={true}/>
      </div>
    </div>
  );
}

export function PanelContent({ tab, projects, selectedId, onSelectProject, onNewProject,
  onDeleteProject, onRenameProject, onReorderProjects, onOpenTrash,
  scenes, characters, characterColors, activeBlock, blocks,
  onNoteChange, stats, onSceneClick, searchQuery, onSearchQuery, searchResults,
  onResultClick, onReorderScenes, isDark, isMobile }) {
  return (
    <>
      {tab==="projects" && (
        <ProjectsPanel projects={projects} selectedId={selectedId}
          onSelect={onSelectProject} onNew={onNewProject}
          onDelete={onDeleteProject} onRename={onRenameProject}
          onReorder={onReorderProjects} onOpenTrash={onOpenTrash}/>
      )}
      {tab==="scenes" && (
        <ScenesPanel scenes={scenes} onSceneClick={onSceneClick} activeBlock={activeBlock}/>
      )}
      {tab==="corkboard" && (
        <CorkboardView blocks={blocks} characterColors={characterColors}
          onReorder={onReorderScenes} onCardClick={onSceneClick}
          onNoteChange={onNoteChange} isMobile={isMobile} isDark={isDark}/>
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

export function ProjectsPanel({ projects, selectedId, onSelect, onNew, onDelete, onRename, onReorder, onOpenTrash }) {
  const C = useTheme();
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(null);
  const dragSrc = useRef(null);
  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleDragStart = (e, id) => {
    dragSrc.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragSrc.current) setDragOver(id);
  };
  const handleDrop = (e, id) => {
    e.preventDefault();
    if (dragSrc.current && id !== dragSrc.current) onReorder(dragSrc.current, id);
    setDragOver(null); dragSrc.current = null;
  };

  return (
    <div>
      <div style={{display:"flex", gap:6, marginBottom:12}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar guion..."
          style={{flex:1, background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:RADIUS.sm,
            padding:"8px 10px", color:C.textSec, fontSize:13, outline:"none"}}
          onFocus={e=>e.target.style.borderColor=C.accent}
          onBlur={e=>e.target.style.borderColor=C.border}/>
        <Btn onClick={onNew} variant="primary" style={{padding:"7px 10px", borderRadius:RADIUS.sm}}><Icons.Plus/></Btn>
      </div>
      {filtered.map(p => (
        <ProjectItem key={p.id} project={p} isActive={p.id===selectedId}
          onSelect={()=>onSelect(p.id)} onDelete={()=>onDelete(p.id)}
          onRename={n=>onRename(p.id,n)}
          isDragOver={dragOver===p.id}
          onDragStart={e=>handleDragStart(e,p.id)}
          onDragOver={e=>handleDragOver(e,p.id)}
          onDrop={e=>handleDrop(e,p.id)}
          onDragEnd={()=>{setDragOver(null);dragSrc.current=null;}}
        />
      ))}
      {/* Papelera */}
      <button onClick={onOpenTrash} style={{
        display:"flex", alignItems:"center", gap:7, width:"100%",
        marginTop:10, padding:"8px 10px", borderRadius:RADIUS.sm, border:"none",
        background:"none", color:C.textMuted, fontSize:12, cursor:"pointer",
        fontFamily:"inherit", transition:"color .15s, background .15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background=`rgba(240,96,96,.07)`}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        <Icons.Bin style={{width:14,height:14}}/> Papelera
      </button>
    </div>
  );
}

export function ProjectItem({ project, isActive, onSelect, onDelete, onRename, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const C = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [hover, setHover] = useState(false);
  const commit = () => { if (name.trim()) onRename(name.trim()); else setName(project.name); setEditing(false); };
  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      onClick={onSelect} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{padding:"10px 12px", borderRadius:RADIUS.sm, marginBottom:4, cursor:"pointer",
        background:isActive?C.bgActive:hover?C.bgCard:"transparent",
        border:isDragOver?`1.5px dashed ${C.accent}`:isActive?`1px solid ${C.borderBright}`:"1px solid transparent",
        transition:"all .12s", display:"flex", alignItems:"center", gap:8,
        opacity:isDragOver?.7:1}}>
      {/* Drag handle */}
      <div style={{color:C.textFaint, cursor:"grab", flexShrink:0, display:hover||isActive?"flex":"none",
        alignItems:"center"}} onMouseDown={e=>e.stopPropagation()}>
        <Icons.Drag/>
      </div>
      <Icons.Projects style={{width:16,height:16,flexShrink:0,color:isActive?C.accent:C.textMuted}}/>
      {editing ? (
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onBlur={commit} onClick={e=>e.stopPropagation()}
          onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setName(project.name);setEditing(false);}}}
          style={{flex:1, background:C.bgApp, border:`1px solid ${C.accent}`, borderRadius:RADIUS.xs,
            padding:"2px 6px", color:C.textPrimary, fontSize:13, outline:"none"}}/>
      ) : (
        <span style={{flex:1, fontSize:13, color:isActive?C.textPrimary:C.textSec,
          fontWeight:isActive?600:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
          {project.name}
        </span>
      )}
      {(hover||isActive) && !editing && (
        <div style={{display:"flex", gap:2}} onClick={e=>e.stopPropagation()}>
          <Btn onClick={()=>setEditing(true)} style={{padding:"4px 6px"}} title="Renombrar"><Icons.Pen/></Btn>
          <Btn onClick={onDelete} style={{padding:"4px 6px"}} title="Mover a papelera"><Icons.Trash/></Btn>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, desc }) {
  const C = useTheme();
  return (
    <div className="fade-in" style={{textAlign:"center", padding:"40px 16px 20px"}}>
      <div className="empty-float" style={{
        width:52, height:52, borderRadius:"50%", margin:"0 auto 16px",
        background:C.bgCard, border:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:C.accent, opacity:.7,
      }}>
        {icon}
      </div>
      <p style={{fontSize:13, color:C.textSec, fontWeight:600, marginBottom:4}}>{title}</p>
      {desc && <p style={{fontSize:11.5, color:C.textMuted, lineHeight:1.6, maxWidth:200, margin:"0 auto"}}>{desc}</p>}
    </div>
  );
}

export function ScenesPanel({ scenes, onSceneClick, activeBlock }) {
  const C = useTheme();
  // La escena "actual" es la última cuyo encabezado quedó en o antes del
  // cursor — no solo cuando el cursor está literalmente sobre esa línea,
  // sino en cualquier bloque (acción, diálogo, etc.) dentro de esa escena.
  let currentSceneIdx = -1;
  if (typeof activeBlock === "number") {
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].index <= activeBlock) currentSceneIdx = i;
      else break;
    }
  }

  return (
    <div>
      <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:1.5,
        fontWeight:700, marginBottom:10}}>{scenes.length} escenas</p>
      {scenes.length===0 && (
        <EmptyState icon={<Icons.Scenes style={{width:22,height:22}}/>}
          title="Sin escenas todavía"
          desc="Escribí INT. o EXT. para crear la primera."/>
      )}
      {scenes.map((s,i) => {
        const isCurrent = i === currentSceneIdx;
        return (
          <div key={s.id} onClick={()=>onSceneClick(s.index)}
            style={{padding:"10px 12px", marginBottom:4, borderRadius:RADIUS.sm,
              background:isCurrent ? `rgba(${hexToRgb(C.accentWarm)},.16)` : C.bgCard,
              border:`1px solid ${isCurrent ? C.accentWarm : C.border}`,
              cursor:"pointer", transition:"border-color .14s,background .14s"}}
            onMouseEnter={e=>{if(!isCurrent){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.bgCardHover}}}
            onMouseLeave={e=>{if(!isCurrent){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bgCard}}}>
            <div style={{display:"flex", alignItems:"center", gap:7}}>
              <span style={{fontSize:11, fontWeight:700,
                color:isCurrent ? C.bgApp : C.accentWarm,
                background:isCurrent ? C.accentWarm : `rgba(${hexToRgb(C.accentWarm)},.18)`,
                border:`1px solid rgba(${hexToRgb(C.accentWarm)},.35)`,
                padding:"3px 10px", borderRadius:RADIUS.pill,
                flexShrink:0, minWidth:30, textAlign:"center"}}>{i+1}</span>
              <span style={{fontSize:12, color:isCurrent ? C.textPrimary : C.textSec,
                fontWeight:isCurrent ? 700 : 400,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                fontFamily:"'Courier Prime',monospace"}}>
                {s.text||"Sin título"}
              </span>
            </div>
            <div style={{fontSize:9.5, color:isCurrent ? C.accentWarm : C.textFaint,
              marginTop:3, paddingLeft:1}}>
              Esc. {i+1} · p.{Math.ceil((s.index+1)/2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CorkboardView({ blocks, characterColors, onReorder, onCardClick, onNoteChange, isMobile, isDark }) {
  const C = useTheme();
  const { preamble, groups } = useMemo(() => buildSceneGroups(blocks), [blocks]);
  const [dragOverId, setDragOverId] = useState(null);
  const dragSrc = useRef(null);

  const handleDragStart = (e, id) => {
    dragSrc.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== dragSrc.current) setDragOverId(id);
  };
  const handleDrop = (e, id) => {
    e.preventDefault();
    if (dragSrc.current && id !== dragSrc.current) onReorder(dragSrc.current, id);
    setDragOverId(null); dragSrc.current = null;
  };

  if (groups.length === 0) {
    return (
      <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24}}>
        <div className="fade-in" style={{textAlign:"center", maxWidth:280}}>
          <div className="empty-float" style={{color:C.textFaint, marginBottom:10, opacity:.6}}>
            <Icons.Board style={{width:30,height:30}}/>
          </div>
          <div style={{color:C.textSec, fontSize:13, fontWeight:600, marginBottom:6}}>
            Tablero vacío
          </div>
          <div style={{color:C.textFaint, fontSize:11.5, lineHeight:1.6}}>
            Escribí INT. o EXT. en el editor para crear tu primera escena — va a aparecer acá como tarjeta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex:1, overflowY:"auto", padding: isMobile ? "14px 14px 90px" : "26px 28px 60px",
      background: isDark ? "radial-gradient(ellipse at top, #15120E, #0A0909 70%)" : C.bgEditor,
    }}>
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
        gap: isMobile ? 12 : 16,
      }}>
        {groups.map((g, i) => {
          const meta = parseSceneHeading(g.heading.text);
          const chars = charactersInScene(g);
          const wordCount = g.content.reduce((a,b) => a + (b.text?.trim().split(/\s+/).filter(Boolean).length||0), 0);
          const isOver = dragOverId === g.id;
          return (
            <div key={g.id}
              draggable
              onDragStart={e=>handleDragStart(e,g.id)}
              onDragOver={e=>handleDragOver(e,g.id)}
              onDrop={e=>handleDrop(e,g.id)}
              onDragEnd={()=>{setDragOverId(null);dragSrc.current=null;}}
              onClick={()=>onCardClick(blocks.indexOf(g.heading))}
              className="fade-in"
              style={{
                background:C.bgCard, border:`1px solid ${isOver?C.accent:C.border}`,
                borderRadius:RADIUS.md, padding:"12px 13px 11px", cursor:"pointer",
                boxShadow:SHADOW.card(),
                transition:"border-color .12s, transform .12s, opacity .12s",
                opacity:isOver?.6:1,
                display:"flex", flexDirection:"column", gap:8, minHeight:130,
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent}}
              onMouseLeave={e=>{if(!isOver)e.currentTarget.style.borderColor=C.border}}>

              {/* Header: número + pin de drag + INT/EXT · DÍA/NOCHE */}
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:9.5, fontWeight:700, color:C.accentWarm,
                  background:"rgba(232,131,74,.12)", padding:"2px 6px", borderRadius:RADIUS.xs,
                  flexShrink:0}}>{i+1}</span>
                {meta.intExt && (
                  <span style={{fontSize:8.5, fontWeight:700, letterSpacing:.5, color:C.green,
                    background:`rgba(${hexToRgb(C.green)},.12)`, padding:"2px 6px", borderRadius:RADIUS.xs}}>
                    {meta.intExt}
                  </span>
                )}
                {meta.time && (
                  <span style={{fontSize:8.5, fontWeight:700, letterSpacing:.5,
                    color:meta.time==="NOCHE"?C.purple:C.yellow,
                    background:`rgba(${hexToRgb(meta.time==="NOCHE"?C.purple:C.yellow)},.12)`,
                    padding:"2px 6px", borderRadius:RADIUS.xs}}>
                    {meta.time}
                  </span>
                )}
                <div style={{marginLeft:"auto", color:C.textFaint, cursor:"grab"}}
                  onMouseDown={e=>e.stopPropagation()} title="Arrastrá para reordenar">
                  <Icons.Drag/>
                </div>
              </div>

              {/* Heading */}
              <div style={{fontSize:11.5, fontFamily:"'Courier Prime',monospace",
                fontWeight:700, color:C.textPrimary, letterSpacing:.2, lineHeight:1.4,
                overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical"}}>
                {g.heading.text || "Sin título"}
              </div>

              {/* Synopsis — editable, usa la nota del heading */}
              <textarea
                value={normalizeNote(g.heading.note).text}
                onClick={e=>e.stopPropagation()}
                onChange={e=>onNoteChange(blocks.indexOf(g.heading), e.target.value)}
                placeholder="Sinopsis breve de la escena..."
                rows={3}
                style={{
                  flex:1, width:"100%", background:"transparent", border:"none", resize:"none",
                  outline:"none", color:C.textSec, fontSize:11.5, lineHeight:1.55,
                  fontFamily:"inherit", padding:0,
                }}/>

              {/* Footer: personajes + palabras */}
              <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
                paddingTop:7, borderTop:`1px solid ${C.border}`}}>
                {chars.slice(0,3).map(name => (
                  <span key={name} style={{
                    fontSize:8.5, fontWeight:600, color:characterColors[name]||C.green,
                    background:`rgba(${hexToRgb(characterColors[name]||C.green)},.12)`,
                    padding:"2px 6px", borderRadius:RADIUS.sm, whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis", maxWidth:80,
                  }}>{name}</span>
                ))}
                {chars.length>3 && (
                  <span style={{fontSize:8.5, color:C.textFaint}}>+{chars.length-3}</span>
                )}
                <span style={{fontSize:8.5, color:C.textFaint, marginLeft:"auto", flexShrink:0}}>
                  {wordCount}p
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CharactersPanel({ characters }) {
  const C = useTheme();
  const entries = Object.entries(characters);
  const maxLines = Math.max(1, ...entries.map(([,i])=>i.lines));
  return (
    <div>
      <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase", letterSpacing:1.5,
        fontWeight:700, marginBottom:10}}>{entries.length} personajes</p>
      {entries.length===0 && (
        <EmptyState icon={<Icons.Characters style={{width:22,height:22}}/>}
          title="Reparto vacío"
          desc="Los personajes aparecen automáticamente al escribir sus diálogos."/>
      )}
      {entries.sort((a,b)=>b[1].lines-a[1].lines).map(([name,info]) => (
        <div key={name} style={{padding:"10px 12px", marginBottom:6, borderRadius:RADIUS.sm,
          background:C.bgCard, border:`1px solid ${C.border}`}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:7}}>
            <div style={{width:10, height:10, borderRadius:"50%", background:info.color,
              flexShrink:0, boxShadow:`0 0 6px ${info.color}70`}}/>
            <span style={{fontSize:13, color:info.color, fontWeight:700,
              fontFamily:"'Courier Prime',monospace", letterSpacing:.5, flex:1}}>{name}</span>
            <span style={{fontSize:11, color:C.textMuted}}>{info.lines} líneas</span>
          </div>
          <div style={{height:3, borderRadius:RADIUS.xs, background:C.border}}>
            <div style={{height:"100%", borderRadius:RADIUS.xs, background:info.color,
              width:`${Math.round(info.lines/maxLines*100)}%`, transition:"width .3s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesPanel({ activeBlock, blocks, onNoteChange }) {
  const C = useTheme();
  const block = blocks[activeBlock];
  const activeNote = block ? normalizeNote(block.note) : null;
  const withNotes = blocks
    .map((b,i)=>({...b, index:i, note:normalizeNote(b.note)}))
    .filter(b=>b.note.text.trim());

  return (
    <div>
      {block ? (
        <>
          <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase",
            letterSpacing:1.5, fontWeight:700, marginBottom:8}}>Nota del bloque activo</p>
          <div style={{padding:"12px", borderRadius:RADIUS.sm, background:C.bgCard,
            border:`1px solid ${C.borderBright}`, marginBottom:16}}>
            <p style={{fontSize:10, color:C.textMuted, marginBottom:8}}>
              <span style={{color:typeColor(block.type, C)}}>[{typeLabel(block.type)}]</span>{" "}
              {block.text?.slice(0,40)||(
                <span style={{fontStyle:"italic"}}>(vacío)</span>
              )}
            </p>
            <div style={{display:"flex", gap:4, marginBottom:8, flexWrap:"wrap"}}>
              {NOTE_CATEGORIES.map(cat => {
                const on = activeNote.category===cat.id;
                const c2 = noteCategoryColor(cat.id, C);
                return (
                  <button key={cat.id} onClick={()=>onNoteChange(activeBlock,{category:cat.id})}
                    title={cat.label}
                    style={{padding:"2px 7px", borderRadius:RADIUS.pill, fontSize:10.5,
                      background:on?`rgba(${hexToRgb(c2)},.18)`:"transparent",
                      border:on?`1px solid rgba(${hexToRgb(c2)},.5)`:`1px solid ${C.border}`,
                      color:on?c2:C.textMuted, cursor:"pointer", fontFamily:"inherit"}}>
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
            <textarea value={activeNote.text} onChange={e=>onNoteChange(activeBlock,{text:e.target.value})}
              placeholder="Anotá ideas, referencias, preguntas..."
              rows={4} style={{width:"100%", background:"transparent", border:"none",
                color:C.textSec, fontSize:13, resize:"vertical", outline:"none",
                lineHeight:1.65, fontFamily:"inherit"}}/>
            <button onClick={()=>onNoteChange(activeBlock,{onScreen:!activeNote.onScreen})}
              style={{display:"flex", alignItems:"center", gap:5, background:"none", border:"none",
                color:C.textMuted, fontSize:11, cursor:"pointer", fontFamily:"inherit", marginTop:6, padding:0}}>
              {activeNote.onScreen ? "👁 Visible en el guion" : "🚫 Oculta en el guion"}
            </button>
          </div>
        </>
      ) : (
        <p style={{fontSize:13, color:C.textMuted, fontStyle:"italic", marginBottom:16}}>
          Seleccioná un bloque para agregar una nota.
        </p>
      )}
      {withNotes.length>0 ? (
        <>
          <p style={{fontSize:10, color:C.textMuted, textTransform:"uppercase",
            letterSpacing:1.5, fontWeight:700, marginBottom:8}}>
            Todas las notas · {withNotes.length}
          </p>
          {withNotes.map(b => {
            const meta = noteCategoryMeta(b.note.category);
            const c2 = noteCategoryColor(b.note.category, C);
            return (
              <div key={b.id} style={{padding:"10px 12px", marginBottom:5, borderRadius:RADIUS.sm,
                background:C.bgCard, border:`1px solid ${C.border}`,
                borderLeft:`3px solid ${c2}`, opacity:b.note.onScreen?1:.6}}>
                <p style={{fontSize:10, color:c2, marginBottom:4, fontFamily:"monospace",
                  display:"flex", alignItems:"center", gap:5}}>
                  <span>{meta.emoji} {b.text?.slice(0,28)||"(vacío)"}</span>
                  {!b.note.onScreen && <span style={{color:C.textFaint, fontStyle:"italic"}}>· oculta</span>}
                </p>
                <p style={{fontSize:12, color:C.textSec, lineHeight:1.55}}>{b.note.text}</p>
              </div>
            );
          })}
        </>
      ) : (
        <EmptyState icon={<Icons.Notes style={{width:22,height:22}}/>}
          title="Sin notas aún"
          desc="Seleccioná un bloque del guion y anotá ideas, referencias o preguntas."/>
      )}
    </div>
  );
}

export function StatsPanel({ stats }) {
  const C = useTheme();
  const items = [
    ["Palabras", stats.words],
    ["Páginas aprox.", stats.pages],
    ["Escenas", stats.scenes],
    ["Personajes", stats.characters],
    ["Diálogos", stats.dialogues],
    ["Bloques", stats.blocks],
  ];
  const duration = stats.duration; // { scenes:[...], total:{...}, config } — ver estimateDuration()
  return (
    <div>
      {items.map(([label,val]) => (
        <div key={label} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"10px 12px", marginBottom:4, borderRadius:RADIUS.sm,
          background:C.bgCard, border:`1px solid ${C.border}`}}>
          <span style={{fontSize:13, color:C.textSec}}>{label}</span>
          <span style={{fontSize:16, color:C.textPrimary, fontWeight:700}}>{val}</span>
        </div>
      ))}
      <div style={{marginTop:12, padding:"14px 16px", borderRadius:RADIUS.md,
        background:`rgba(${hexToRgb(C.accent)},.08)`, border:`1px solid rgba(${hexToRgb(C.accent)},.25)`}}>
        <p style={{fontSize:10, color:C.accent, marginBottom:4, fontWeight:700,
          textTransform:"uppercase", letterSpacing:.5}}>Duración por paginado</p>
        <p style={{fontSize:28, color:C.textPrimary, fontWeight:800, lineHeight:1}}>
          ~{stats.pages}<span style={{fontSize:14, fontWeight:400, marginLeft:4}}>min</span>
        </p>
        <p style={{fontSize:11, color:C.textMuted, marginTop:4}}>1 página ≈ 1 minuto en pantalla — la referencia que usa la industria para presupuestar</p>
      </div>

      {duration && <SceneDurationBreakdown duration={duration}/>}
    </div>
  );
}

// Desglose de duración basado en CONTENIDO real (diálogo/acción/pausas), no en
// paginado. Es un punto de partida editable: la pausa manual de cada bloque
// (ver editor.jsx) es la forma de ajustar lo que el algoritmo no puede inferir
// del texto solo.
function SceneDurationBreakdown({ duration }) {
  const C = useTheme();
  const { scenes, total } = duration;
  const legend = [
    { key:"dialogueSeconds", label:"Diálogo", color:C.accent },
    { key:"actionSeconds",   label:"Acción",  color:C.textSec },
    { key:"pauseSeconds",    label:"Pausas",  color:C.accentWarm },
  ];

  return (
    <div style={{marginTop:12, padding:"14px 16px", borderRadius:RADIUS.md,
      background:C.bgCard, border:`1px solid ${C.border}`}}>
      <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:2}}>
        <p style={{fontSize:10, color:C.textMuted, fontWeight:700,
          textTransform:"uppercase", letterSpacing:.5}}>Duración por contenido</p>
        <span style={{fontSize:20, color:C.textPrimary, fontWeight:800}}>
          {formatDuration(total.totalSeconds)}
        </span>
      </div>
      <p style={{fontSize:11, color:C.textMuted, marginBottom:12}}>
        Estimado según lo que se lee en cada bloque — un punto de partida, no una medición exacta.
      </p>

      {/* Leyenda de colores */}
      <div style={{display:"flex", gap:12, marginBottom:12, flexWrap:"wrap"}}>
        {legend.map(l => (
          <div key={l.key} style={{display:"flex", alignItems:"center", gap:5}}>
            <div style={{width:8, height:8, borderRadius:2, background:l.color}}/>
            <span style={{fontSize:10.5, color:C.textMuted}}>{l.label}</span>
          </div>
        ))}
      </div>

      {scenes.length === 0 ? (
        <p style={{fontSize:12, color:C.textFaint, fontStyle:"italic"}}>
          Agregá encabezados de escena para ver el desglose por escena.
        </p>
      ) : (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {scenes.map((s, i) => (
            <div key={s.id}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3}}>
                <span style={{fontSize:11, color:C.textSec, overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap", maxWidth:"70%"}}>
                  {i+1}. {s.heading}
                </span>
                <span style={{fontSize:10.5, color:C.textMuted, fontVariantNumeric:"tabular-nums"}}>
                  {formatDuration(s.totalSeconds)}
                </span>
              </div>
              <DurationBar scene={s} legend={legend}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Barra apilada proporcional a diálogo/acción/pausas de una escena. Si la
// escena todavía no tiene texto (totalSeconds===0), muestra una línea vacía
// en vez de nada, para que la lista no "salte" de tamaño.
function DurationBar({ scene, legend }) {
  const C = useTheme();
  const total = scene.totalSeconds || 0;
  return (
    <div style={{display:"flex", height:6, borderRadius:3, overflow:"hidden",
      background:C.bgActive, width:"100%"}}>
      {total > 0 ? legend.map(l => {
        const pct = (scene[l.key] / total) * 100;
        return pct > 0 ? (
          <div key={l.key} style={{width:`${pct}%`, background:l.color, height:"100%"}}/>
        ) : null;
      }) : null}
    </div>
  );
}

export function SearchPanel({ query, onQuery, results, onResultClick, isMobile }) {
  const C = useTheme();
  const inputRef = useRef(null);
  useEffect(() => {
    if (isMobile) setTimeout(() => inputRef.current?.focus(), 200);
  }, []);
  return (
    <div>
      <input ref={inputRef} value={query} onChange={e=>onQuery(e.target.value)}
        placeholder="Buscar en el guion..."
        style={{width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
          borderRadius:RADIUS.sm, padding:"11px 14px", color:C.textPrimary, fontSize:14,
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
          style={{padding:"10px 12px", marginBottom:4, borderRadius:RADIUS.sm,
            background:C.bgCard, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .13s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border}}>
          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
            <span style={{fontSize:9, fontWeight:700, color:typeColor(r.type, C),
              background:`rgba(${hexToRgb(typeColor(r.type, C))},.1)`, padding:"1px 5px", borderRadius:RADIUS.xs}}>
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
