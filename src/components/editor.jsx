import { useState } from "react";
import { C, T, hexToRgb } from "../design/tokens";
import { Icons } from "../lib/icons";
import { Btn } from "./common";
import { typeLabel, typeName, typeTooltip, typeColor, getPlaceholder } from "../utils/screenplay";

export function Toolbar({ activeType, onTypeChange, onExport, onExportFountain, onImport, onHistory,
  projectName, saving, canUndo, canRedo, onUndo, onRedo, focusMode, onFocusMode, isMobile }) {
  const types = [
    {type:T.SCENE,      label:"Escena",    short:"ESC", color:C.accentWarm},
    {type:T.ACTION,     label:"Acción",    short:"ACC", color:C.textSec},
    {type:T.CHARACTER,  label:"Personaje", short:"PER", color:C.green},
    {type:T.PAREN,      label:"Acotación", short:"ACO", color:"#C0A060"},
    {type:T.DIALOGUE,   label:"Diálogo",   short:"DIA", color:C.accent},
    {type:T.TRANSITION, label:"Transición",short:"TRA", color:C.purple},
  ];
  const [showExport, setShowExport] = useState(false);

  if (isMobile) return null;

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

      {saving && <span className="saving" style={{display:"flex",alignItems:"center",gap:4,fontSize:10, color:C.textMuted, marginRight:4}}><Icons.Saving/> Guardando</span>}

      <Btn onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)" style={{padding:"5px 7px"}}><Icons.Undo/></Btn>
      <Btn onClick={onRedo} disabled={!canRedo} title="Rehacer (Ctrl+Y)" style={{padding:"5px 7px"}}><Icons.Redo/></Btn>
      <Btn onClick={onFocusMode} title="Modo foco" style={{padding:"5px 7px", color:focusMode?C.accent:C.textMuted}}><Icons.Focus/></Btn>
      <Btn onClick={onHistory} title="Historial de versiones" style={{padding:"5px 7px", color:C.textMuted}}><Icons.History/></Btn>

      <div style={{position:"relative"}}>
        <Btn onClick={()=>setShowExport(v=>!v)} variant="outline"
          style={{gap:5, padding:"4px 10px", fontSize:12}}>
          <Icons.Export/> Exportar
        </Btn>
        {showExport && (
          <div style={{position:"absolute", right:0, top:"calc(100% + 6px)", background:C.bgPanel,
            border:`1px solid ${C.borderBright}`, borderRadius:9, padding:6,
            zIndex:300, minWidth:200, boxShadow:`0 12px 32px ${C.shadow}`}}>
            {[
              {label:"PDF (impresión)", Icon:Icons.PDF, fn:()=>{onExport();setShowExport(false);}},
              {label:"Fountain (.fountain)", Icon:Icons.Fountain, fn:()=>{onExportFountain();setShowExport(false);}},
              {label:"Importar .fountain", Icon:Icons.Import, fn:()=>{onImport();setShowExport(false);}},
            ].map(item => (
              <button key={item.label} onClick={item.fn} style={{
                display:"flex", alignItems:"center", gap:8, width:"100%", padding:"9px 12px",
                background:"none", border:"none", color:C.textSec, fontSize:12,
                textAlign:"left", cursor:"pointer", borderRadius:6, fontFamily:"inherit"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bgCard}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <item.Icon/>{item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScriptBlock({ block, index, isActive, characterColors, onUpdate, onFocus,
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
    [T.PAREN]:      {...base, paddingLeft:isMobile?"18%":"26%", paddingRight:isMobile?"18%":"26%", color:"#C0A060", fontStyle:"italic"},
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

      {/* Type badge — desktop only, left gutter, with tooltip */}
      {isActive && !isMobile && (
        <div style={{position:"absolute", left:-48, top:0, fontSize:8, fontWeight:700,
          color:col, letterSpacing:.5, textTransform:"uppercase",
          background:`rgba(${hexToRgb(col)},.1)`, padding:"2px 5px", borderRadius:3,
          border:`1px solid rgba(${hexToRgb(col)},.2)`, cursor:"help",
          userSelect:"none"}}
          title={`${typeName(block.type)}\n\n${typeTooltip(block.type)}`}>
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
                borderRadius:5,padding:"3px 7px",color:C.red,
                cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center"}}>
              <Icons.Close style={{width:10,height:10}}/>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
