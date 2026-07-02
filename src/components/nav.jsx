import { useState } from "react";
import { C, T, RADIUS, FONT_DISPLAY, hexToRgb } from "../design/tokens";
import { Icons } from "../lib/icons";
import { Btn } from "./common";
import { grainStyle } from "../styles/globalStyles";

export function NavSidebar({ tab, onTab, saving, saveError, isDark, onToggleTheme, onSignOut, userEmail, onHelp, onOnboarding }) {
  const items = [
    {id:"editor",    Icon:Icons.Editor,     label:"Editor"},
    {id:"corkboard", Icon:Icons.Board,      label:"Tablero"},
    {id:"scenes",    Icon:Icons.Scenes,     label:"Escenas"},
    {id:"characters",Icon:Icons.Characters, label:"Personas"},
    {id:"notes",     Icon:Icons.Notes,      label:"Notas"},
    {id:"stats",     Icon:Icons.Stats,      label:"Stats"},
    {id:"search",    Icon:Icons.Search,     label:"Buscar"},
    {id:"projects",  Icon:Icons.Projects,   label:"Guiones"},
  ];
  return (
    <div style={{
      width:64, background:C.bgSidebar, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"12px 6px", gap:2, flexShrink:0, height:"100dvh",
      transition:"background .25s,border-color .25s",
      ...grainStyle(isDark),
    }}>
      {/* Logo — tira de película + cursor */}
      <div className="flicker" style={{marginBottom:8, flexShrink:0, cursor:"default"}} title="PLANO Screenwriting">
        <svg width="52" height="40" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Fondo */}
          <rect width="52" height="40" rx="7"
            fill={isDark ? "#080808" : "#EBE4D8"}
            stroke={isDark ? "#2A2520" : "#C4B898"} strokeWidth="0.75"/>
          {/* Perforaciones izquierda */}
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          {/* Perforaciones derecha */}
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          {/* Texto PLANO */}
          <text x="26" y="24"
            fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700"
            fill={isDark ? "#E4E8F0" : "#1A1F2E"}
            textAnchor="middle" letterSpacing="2">PLANO</text>
          {/* Línea de cursor */}
          <rect x="10" y="28" width="30" height="1.5" rx="0.75"
            fill={isDark ? "#C0A060" : "#8B6820"} opacity="0.9"/>
          {/* Cursor parpadeante */}
          <rect x="38.5" y="14" width="2" height="14" rx="1"
            fill={isDark ? "#C0A060" : "#8B6820"}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
      </div>

      {items.map(it => (
        <button key={it.id} className={`icon-nav-btn${tab===it.id?" active":""}`}
          onClick={() => onTab(it.id)} title={it.label}>
          <it.Icon/>
          <span style={{fontSize:8.5}}>{it.label}</span>
        </button>
      ))}

      <div style={{flex:1}}/>

      {/* Ayuda */}
      <button onClick={onHelp} title="Guía de elementos del guion"
        style={{padding:"8px", borderRadius:RADIUS.sm, border:"none", background:"none",
          color:C.textMuted, cursor:"pointer", transition:"color .15s, background .15s",
          display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentGlow}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        <Icons.Help/>
      </button>

      {/* Tour */}
      <button onClick={onOnboarding} title="Ver introducción"
        style={{padding:"6px", borderRadius:RADIUS.sm, border:"none", background:"none",
          color:C.textFaint, cursor:"pointer", transition:"color .15s, background .15s",
          display:"flex", alignItems:"center", justifyContent:"center", width:"100%",
          fontSize:13}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background=C.bgCard}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textFaint;e.currentTarget.style.background="none"}}>
        ✦
      </button>

      {/* Theme toggle */}
      <button onClick={onToggleTheme} title={isDark ? "Modo día" : "Modo noche"}
        style={{padding:"8px", borderRadius:RADIUS.sm, border:"none", background:"none",
          color:C.textMuted, cursor:"pointer", transition:"color .15s, background .15s",
          display:"flex", alignItems:"center", justifyContent:"center", width:"100%"}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.textSec;e.currentTarget.style.background=C.bgCard}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        {isDark ? <Icons.Sun/> : <Icons.Moon/>}
      </button>

      {/* User avatar + sign out */}
      <button onClick={onSignOut} title={`Cerrar sesión (${userEmail})`}
        style={{padding:"7px", borderRadius:RADIUS.sm, border:"none", background:"none",
          cursor:"pointer", transition:"background .15s", width:"100%",
          display:"flex", alignItems:"center", justifyContent:"center"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(240,96,96,.1)"}
        onMouseLeave={e=>e.currentTarget.style.background="none"}>
        <div style={{
          width:26, height:26, borderRadius:"50%",
          background:`rgba(${hexToRgb(C.accent)},.18)`,
          border:`1px solid rgba(${hexToRgb(C.accent)},.3)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:700, color:C.accent, letterSpacing:0,
        }}>
          {(userEmail||"?")[0].toUpperCase()}
        </div>
      </button>

      {saveError && <div title="Sin conexión — tus cambios están a salvo localmente y se sincronizarán solos" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"4px 0", color:C.red}}>
        <Icons.Saving/>
      </div>}
      {!saveError && saving && <div className="saving" style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"4px 0", color:C.textMuted}}>
        <Icons.Saving/>
      </div>}
    </div>
  );
}

export function MobileBottomNav({ tab, onTab, saving, isDark, onToggleTheme, onHelp }) {
  const items = [
    {id:"editor",    Icon:Icons.Editor,     label:"Editor"},
    {id:"corkboard", Icon:Icons.Board,      label:"Tablero"},
    {id:"scenes",    Icon:Icons.Scenes,     label:"Escenas"},
    {id:"characters",Icon:Icons.Characters, label:"Personas"},
    {id:"notes",     Icon:Icons.Notes,      label:"Notas"},
    {id:"projects",  Icon:Icons.Projects,   label:"Guiones"},
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
          <it.Icon style={{width:20,height:20}}/>
          <span style={{fontSize:8.5}}>{it.label}</span>
        </button>
      ))}
      <button onClick={onHelp} className="mobile-nav-btn" title="Guía">
        <Icons.Help style={{width:20,height:20}}/>
        <span style={{fontSize:8.5}}>Guía</span>
      </button>
      <button onClick={onToggleTheme} className="mobile-nav-btn" title={isDark?"Modo día":"Modo noche"}>
        {isDark ? <Icons.Sun style={{width:20,height:20}}/> : <Icons.Moon style={{width:20,height:20}}/>}
        <span style={{fontSize:8.5}}>{isDark?"Día":"Noche"}</span>
      </button>
    </div>
  );
}

export function MobileEditorHeader({ projectName, words, pages, scenes, saving,
  activeType, onTypeChange, canUndo, canRedo, onUndo, onRedo,
  onExport, onExportFountain, focusMode, onFocusMode }) {
  const types = [
    {type:T.SCENE,      short:"ESC", color:C.accentWarm},
    {type:T.ACTION,     short:"ACC", color:C.textSec},
    {type:T.CHARACTER,  short:"PER", color:C.green},
    {type:T.PAREN,      short:"ACO", color:"#C0A060"},
    {type:T.DIALOGUE,   short:"DIA", color:C.accent},
    {type:T.TRANSITION, short:"TRA", color:C.purple},
  ];
  const [showExport, setShowExport] = useState(false);

  return (
    <div style={{flexShrink:0, background:C.bgPanel, borderBottom:`1px solid ${C.border}`,
      paddingTop:"env(safe-area-inset-top, 0px)"}}>

      {/* Top row: project name + actions */}
      <div style={{display:"flex", alignItems:"center", padding:"10px 14px 6px", gap:8}}>
        {/* Logo mini móvil */}
        <svg width="32" height="25" viewBox="0 0 52 40" fill="none" style={{flexShrink:0}}>
          <rect width="52" height="40" rx="7" fill={C.bgSidebar} stroke={C.border} strokeWidth="0.75"/>
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700" fill={C.textPrimary} textAnchor="middle" letterSpacing="2">PLANO</text>
          <rect x="10" y="28" width="30" height="1.5" rx="0.75" fill={C.accent} opacity="0.9"/>
          <rect x="38.5" y="14" width="2" height="14" rx="1" fill={C.accent}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:17, fontWeight:600, color:C.textPrimary,
            fontFamily:FONT_DISPLAY, overflow:"hidden",
            textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{projectName}</div>
          <div style={{fontSize:10, color:C.textMuted, marginTop:1}}>
            {words} palabras · ~{pages} pág · {scenes} escenas
            {saving && <span className="saving" style={{marginLeft:6}}>· Guardando…</span>}
          </div>
        </div>
        <Btn onClick={onUndo} disabled={!canUndo} style={{padding:"6px 8px"}}><Icons.Undo/></Btn>
        <Btn onClick={onRedo} disabled={!canRedo} style={{padding:"6px 8px"}}><Icons.Redo/></Btn>
        <button onClick={onFocusMode} style={{background:"none",border:"none",
          color:focusMode?C.accent:C.textMuted,cursor:"pointer",padding:"4px 6px",display:"flex",alignItems:"center"}}>
          <Icons.Focus/>
        </button>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowExport(v=>!v)} style={{background:"none",border:`1px solid ${C.borderBright}`,
            borderRadius:RADIUS.sm,color:C.textSec,cursor:"pointer",padding:"6px 8px",display:"flex",alignItems:"center"}}>
            <Icons.Export/>
          </button>
          {showExport && (
            <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:C.bgPanel,
              border:`1px solid ${C.borderBright}`,borderRadius:RADIUS.sm,padding:6,
              zIndex:300,minWidth:180,boxShadow:`0 12px 32px ${C.shadow}`}}>
              {[
                {label:"PDF",Icon:Icons.PDF,fn:()=>{onExport();setShowExport(false);}},
                {label:"Fountain",Icon:Icons.Fountain,fn:()=>{onExportFountain();setShowExport(false);}},
              ].map(item=>(
                <button key={item.label} onClick={item.fn} style={{
                  display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",
                  background:"none",border:"none",color:C.textSec,fontSize:13,
                  textAlign:"left",cursor:"pointer",borderRadius:RADIUS.sm,fontFamily:"inherit"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <item.Icon/>{item.label}
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
              style={{padding:"6px 12px", borderRadius:RADIUS.pill, fontSize:11, fontWeight:on?700:500,
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
