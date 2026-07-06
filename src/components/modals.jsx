import { useState, useEffect, useRef } from "react";
import { T, RADIUS, SHADOW, hexToRgb } from "../design/tokens";
import { useTheme } from "../contexts/ThemeContext";
import { Icons } from "../lib/icons";
import { Btn, Modal } from "./common";
import { uid, NOTE_CATEGORIES, noteCategoryColor } from "../utils/screenplay";
import { parseFountain } from "../utils/fountain";
import { exportToPDFPro } from "../utils/pdfExport";
import { supabase } from "../lib/supabase";

export function ImportFountainModal({ onImport, onClose, isDark }) {
  const C = useTheme();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const handleFile = file => {
    if (!file || !file.name.endsWith(".fountain")) return;
    setFileName(file.name.replace(".fountain", ""));
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const blocks = parseFountain(text);
      setParsed(blocks);
      const scenes = blocks.filter(b => b.type === T.SCENE).length;
      const chars = [...new Set(blocks.filter(b => b.type === T.CHARACTER).map(b => b.text))].length;
      setPreview({ scenes, chars, blocks: blocks.length });
    };
    reader.readAsText(file);
  };

  const inputStyle = {
    width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
    borderRadius:RADIUS.sm, padding:"10px 14px", color:C.textPrimary, fontSize:13,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  };

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, width:"100%", maxWidth:420,
        boxShadow:`0 24px 60px ${C.shadow}`, padding:"24px",
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:16, color:C.textPrimary}}>
              Importar Fountain
            </div>
            <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
              Compatible con Final Draft, Highland, Celtx
            </div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", display:"flex"}}><Icons.Close/></button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}
          onClick={()=>fileRef.current?.click()}
          style={{
            border:`2px dashed ${dragging?C.accent:C.borderBright}`,
            borderRadius:RADIUS.md, padding:"32px 20px", textAlign:"center",
            background:dragging?C.accentGlow:"transparent",
            cursor:"pointer", transition:"all .15s", marginBottom:16,
          }}>
          <Icons.Import style={{width:28,height:28,color:C.textMuted,margin:"0 auto 10px"}}/>
          <div style={{fontSize:13, color:C.textSec, fontWeight:500}}>
            {preview ? `✓ ${fileName}.fountain` : "Arrastrá tu archivo .fountain acá"}
          </div>
          <div style={{fontSize:11, color:C.textMuted, marginTop:4}}>
            {preview ? `${preview.scenes} escenas · ${preview.chars} personajes · ${preview.blocks} bloques`
              : "o hacé click para seleccionar"}
          </div>
          <input ref={fileRef} type="file" accept=".fountain" style={{display:"none"}}
            onChange={e=>handleFile(e.target.files[0])}/>
        </div>

        {preview && (
          <>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, fontWeight:600, color:C.textMuted,
                letterSpacing:.5, textTransform:"uppercase", marginBottom:8}}>Nombre del guion</div>
              <input value={fileName} onChange={e=>setFileName(e.target.value)}
                style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.accent}
                onBlur={e=>e.target.style.borderColor=C.borderBright}/>
            </div>
            <button onClick={()=>onImport(parsed, fileName||"Guion importado")} style={{
              width:"100%", padding:"12px", borderRadius:RADIUS.md, border:"none",
              background:C.accent, color:"#fff", fontSize:14, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <Icons.Import/> Importar guion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function HistoryModal({ scriptId, projectName, onRestore, onClose }) {
  const C = useTheme();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("script_versions")
        .select("id, created_at, blocks")
        .eq("script_id", scriptId)
        .order("created_at", { ascending: false })
        .limit(20);
      setVersions(data || []);
      setLoading(false);
    }
    load();
  }, [scriptId]);

  const fmt = dt => {
    const d = new Date(dt);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return "Ahora mismo";
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)}h`;
    return d.toLocaleDateString("es-UY", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
  };

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, width:"100%", maxWidth:400,
        boxShadow:`0 24px 60px ${C.shadow}`,
        maxHeight:"80dvh", display:"flex", flexDirection:"column",
      }}>
        <div style={{padding:"20px 20px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:16, color:C.textPrimary}}>
              Historial
            </div>
            <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
              {projectName} · últimas {versions.length} versiones
            </div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", display:"flex"}}><Icons.Close/></button>
        </div>

        <div style={{padding:"14px 20px 20px", overflowY:"auto", flex:1}}>
          {loading ? (
            <div style={{textAlign:"center", padding:"32px 0", color:C.textMuted, fontSize:13}}>
              Cargando historial…
            </div>
          ) : versions.length === 0 ? (
            <div style={{textAlign:"center", padding:"32px 0", color:C.textMuted}}>
              <Icons.History style={{width:28,height:28,marginBottom:10,opacity:.4}}/>
              <p style={{fontSize:13}}>Todavía no hay versiones guardadas.</p>
              <p style={{fontSize:11, marginTop:6}}>Se guarda una versión cada 5 minutos mientras escribís.</p>
            </div>
          ) : versions.map(v => {
            const scenes = v.blocks.filter(b=>b.type===T.SCENE).length;
            const words = v.blocks.map(b=>b.text).join(" ").split(/\s+/).filter(Boolean).length;
            return (
              <div key={v.id} style={{
                display:"flex", alignItems:"center", gap:10, padding:"11px 12px",
                borderRadius:RADIUS.md, marginBottom:6, background:C.bgCard,
                border:`1px solid ${C.border}`,
              }}>
                <Icons.History style={{width:14,height:14,flexShrink:0,color:C.textMuted}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, color:C.textSec, fontWeight:500}}>{fmt(v.created_at)}</div>
                  <div style={{fontSize:10, color:C.textMuted, marginTop:2}}>
                    {scenes} escenas · {words} palabras
                  </div>
                </div>
                <Btn onClick={async()=>{
                  if(!confirm("¿Restaurar esta versión? Se reemplazará el contenido actual.")) return;
                  setRestoring(v.id);
                  await onRestore(v.blocks);
                  setRestoring(null);
                  onClose();
                }} style={{padding:"5px 10px", fontSize:11, gap:4,
                  opacity:restoring===v.id?.6:1}}>
                  <Icons.Restore/>{restoring===v.id?"…":"Restaurar"}
                </Btn>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OnboardingModal({ onClose, isDark }) {
  const C = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <svg width="40" height="31" viewBox="0 0 52 40" fill="none">
        <rect width="52" height="40" rx="7" fill={isDark?"#080808":"#EBE4D8"} stroke={isDark?"#2A2520":"#C4B898"} strokeWidth="0.75"/>
        <rect x="3" y="5" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="5" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace" fontSize="13" fontWeight="700" fill={isDark?"#E8E0D0":"#1A1510"} textAnchor="middle" letterSpacing="2">PLANO</text>
        <rect x="10" y="28" width="30" height="1.5" rx="0.75" fill={isDark?"#C0A060":"#8B6820"} opacity="0.9"/>
      </svg>,
      title: "Bienvenido a Plano",
      desc: "Tu herramienta para escribir guiones profesionales. Guardado automático en la nube, exportación en formato Hollywood y europeo, y todo lo que necesitás para llevar tu historia a la pantalla.",
      tip: null,
    },
    {
      icon: <Icons.Editor style={{width:36,height:36,color:C.accent}}/>,
      title: "El editor de guion",
      desc: "Cada línea del guion es un bloque con un tipo específico: escena, acción, personaje, acotación, diálogo o transición. Usá Tab para cambiar el tipo y Enter para crear el siguiente bloque.",
      tip: "El tipo se sugiere automáticamente según el contexto.",
    },
    {
      icon: <Icons.Scenes style={{width:36,height:36,color:C.accentWarm}}/>,
      title: "Índice de escenas",
      desc: "En la pestaña Escenas ves todas las escenas del guion ordenadas. Podés hacer click en cualquiera para ir directo a ella. También podés reordenarlas arrastrando.",
      tip: "Una escena empieza con INT. o EXT. seguido del lugar.",
    },
    {
      icon: <Icons.Notes style={{width:36,height:36,color:C.green}}/>,
      title: "Notas por bloque",
      desc: "Cada bloque del guion puede tener una nota privada. Son invisibles en el PDF final — sirven para recordatorios, referencias, ideas alternativas o preguntas que querés resolver después.",
      tip: "Las notas aparecen en la pestaña Notas del panel lateral.",
    },
    {
      icon: <Icons.PDF style={{width:36,height:36,color:C.purple}}/>,
      title: "Exportar el guion",
      desc: "Cuando terminés, podés exportar a PDF en formato Hollywood (estándar WGA) o Europeo/Español. El PDF incluye portada con tu nombre, numeración de páginas y el posicionamiento tipográfico exacto.",
      tip: "También podés exportar a .fountain, el formato estándar de la industria.",
    },
  ];

  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.7)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:600, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, width:"100%", maxWidth:440,
        boxShadow:`0 32px 80px ${C.shadow}`,
        overflow:"hidden",
      }}>
        {/* Progress bar */}
        <div style={{height:3, background:C.border}}>
          <div style={{height:"100%", background:C.accent, borderRadius:RADIUS.xs,
            width:`${((step+1)/steps.length)*100}%`, transition:"width .3s ease"}}/>
        </div>

        <div style={{padding:"32px 28px 28px"}}>
          {/* Icon */}
          <div style={{display:"flex", justifyContent:"center", marginBottom:24}}>
            {s.icon}
          </div>

          {/* Text */}
          <h2 style={{fontFamily:"'Courier Prime',monospace", fontSize:20, fontWeight:700,
            color:C.textPrimary, margin:"0 0 12px", textAlign:"center"}}>
            {s.title}
          </h2>
          <p style={{fontSize:13, color:C.textSec, lineHeight:1.7, margin:"0 0 20px", textAlign:"center"}}>
            {s.desc}
          </p>

          {/* Tip */}
          {s.tip && (
            <div style={{background:C.bgCard, border:`1px solid ${C.border}`,
              borderRadius:RADIUS.md, padding:"10px 14px", marginBottom:20,
              display:"flex", gap:8, alignItems:"flex-start"}}>
              <span style={{fontSize:13, flexShrink:0}}>💡</span>
              <p style={{fontSize:12, color:C.textMuted, margin:0, lineHeight:1.6}}>{s.tip}</p>
            </div>
          )}

          {/* Step dots */}
          <div style={{display:"flex", justifyContent:"center", gap:6, marginBottom:24}}>
            {steps.map((_,i) => (
              <div key={i} onClick={()=>setStep(i)} style={{
                width:i===step?20:6, height:6, borderRadius:RADIUS.xs,
                background:i===step?C.accent:C.border,
                cursor:"pointer", transition:"all .25s",
              }}/>
            ))}
          </div>

          {/* Buttons */}
          <div style={{display:"flex", gap:8}}>
            {step > 0 && (
              <Btn onClick={()=>setStep(v=>v-1)}
                style={{flex:1, padding:"11px", fontSize:13, justifyContent:"center"}}>
                ← Anterior
              </Btn>
            )}
            <button onClick={isLast ? onClose : ()=>setStep(v=>v+1)} style={{
              flex:2, padding:"11px", borderRadius:RADIUS.md, border:"none",
              background:isLast?C.green:C.accent, color:"#fff",
              fontSize:14, fontWeight:600, cursor:"pointer",
              fontFamily:"inherit", transition:"opacity .15s",
            }}>
              {isLast ? "¡Empezar a escribir! 🎬" : "Siguiente →"}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button onClick={onClose} style={{
              display:"block", width:"100%", marginTop:10, background:"none",
              border:"none", color:C.textFaint, fontSize:11, cursor:"pointer",
              fontFamily:"inherit", padding:"4px",
            }}>
              Saltar introducción
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TrashModal({ trashedProjects, onRestore, onDeleteForever, onClose }) {
  const C = useTheme();
  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, width:"100%", maxWidth:420,
        boxShadow:`0 24px 60px ${C.shadow}`,
        maxHeight:"80dvh", display:"flex", flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{padding:"20px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:16, color:C.textPrimary}}>
              Papelera
            </div>
            <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
              Máximo 10 guiones · se borran definitivamente a los 30 días
            </div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", borderRadius:RADIUS.sm, display:"flex"}}>
            <Icons.Close/>
          </button>
        </div>

        {/* List */}
        <div style={{padding:"16px 20px 20px", overflowY:"auto", flex:1}}>
          {trashedProjects.length === 0 ? (
            <div style={{textAlign:"center", padding:"32px 0", color:C.textMuted}}>
              <Icons.Bin style={{width:28,height:28,marginBottom:10,opacity:.4}}/>
              <p style={{fontSize:13}}>La papelera está vacía.</p>
            </div>
          ) : trashedProjects.map(p => {
            const daysAgo = Math.floor((Date.now() - new Date(p.deleted_at)) / 86400000);
            const daysLeft = 30 - daysAgo;
            return (
              <div key={p.id} style={{
                display:"flex", alignItems:"center", gap:10, padding:"11px 12px",
                borderRadius:RADIUS.md, marginBottom:6, background:C.bgCard,
                border:`1px solid ${C.border}`,
              }}>
                <Icons.Projects style={{width:16,height:16,flexShrink:0,color:C.textMuted}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, color:C.textSec, fontWeight:500,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {p.name}
                  </div>
                  <div style={{fontSize:10, color:C.textMuted, marginTop:2}}>
                    Se elimina en {daysLeft} día{daysLeft!==1?"s":""}
                  </div>
                </div>
                <div style={{display:"flex", gap:4, flexShrink:0}}>
                  <Btn onClick={()=>onRestore(p.id)} title="Restaurar"
                    style={{padding:"5px 8px", gap:4, fontSize:11, color:C.green}}>
                    <Icons.Restore/> Restaurar
                  </Btn>
                  <Btn onClick={()=>onDeleteForever(p.id)} title="Eliminar definitivamente"
                    style={{padding:"5px 7px", color:C.red}}>
                    <Icons.Trash/>
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const GUIDE_ELEMENTS = [
  {
    type: T.SCENE,
    name: "Encabezado de escena",
    color: "#C0A060",
    example: "INT. COCINA DE MARIO - DÍA",
    desc: "Indica dónde y cuándo ocurre la escena. Siempre en mayúsculas. Empieza con INT. (interior) o EXT. (exterior), seguido del lugar y el momento del día.",
    tip: "Cada vez que cambia el lugar o el tiempo, es una nueva escena.",
  },
  {
    type: T.ACTION,
    name: "Acción",
    color: "#E8E0D0",
    example: "Mario entra a la cocina y abre la heladera. Encuentra una nota pegada en la puerta.",
    desc: "Describe lo que se ve en pantalla: movimientos, ambientes, objetos importantes, reacciones físicas. Se escribe en presente y en tercera persona.",
    tip: "Sé visual y conciso. Si no se puede filmar, no va acá.",
  },
  {
    type: T.CHARACTER,
    name: "Personaje",
    color: "#7A9A60",
    example: "MARIO",
    desc: "El nombre del personaje que va a hablar, siempre en mayúsculas y centrado. Puede incluir una aclaración entre paréntesis, como (V.O.) para voz en off o (O.S.) para fuera de campo.",
    tip: "Solo aparece inmediatamente antes del diálogo.",
  },
  {
    type: T.PAREN,
    name: "Acotación",
    color: "#C0A060",
    example: "(susurrando, sin mirarlo)",
    desc: "Una indicación breve entre paréntesis sobre cómo se dice el diálogo o qué hace el personaje mientras habla. Va entre el nombre del personaje y el diálogo.",
    tip: "Usala con moderación — si el diálogo es bueno, no debería necesitar instrucciones.",
  },
  {
    type: T.DIALOGUE,
    name: "Diálogo",
    color: "#C0A060",
    example: "No sé quién dejó esto, pero alguien estuvo acá.",
    desc: "Las palabras exactas que dice el personaje. Va centrado y con márgenes más angostos que la acción, para diferenciarse visualmente en la página.",
    tip: "El diálogo debe sonar natural al leerlo en voz alta.",
  },
  {
    type: T.TRANSITION,
    name: "Transición",
    color: "#8A7090",
    example: "CORTE A:",
    desc: "Indica cómo se pasa de una escena a la siguiente. Los más comunes son CORTE A:, FUNDIDO A NEGRO., y FUNDIDO DESDE NEGRO. Van alineados a la derecha.",
    tip: "En el cine moderno se usan poco — el corte directo es el default.",
  },
];


export function HelpModal({ onClose, isDark }) {
  const C = useTheme();
  const [active, setActive] = useState(0);
  const el = GUIDE_ELEMENTS[active];

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, width:"100%", maxWidth:580,
        boxShadow:`0 32px 80px ${C.shadow}`,
        display:"flex", flexDirection:"column", maxHeight:"90dvh", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{padding:"22px 24px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:17, color:C.textPrimary}}>
              Guía de elementos
            </div>
            <div style={{fontSize:12, color:C.textMuted, marginTop:3}}>
              Cómo funciona un guion profesional
            </div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", borderRadius:RADIUS.sm, display:"flex", marginTop:2}}>
            <Icons.Close/>
          </button>
        </div>

        {/* Tab selector */}
        <div style={{display:"flex", gap:4, padding:"16px 24px 0", overflowX:"auto",
          scrollbarWidth:"none", WebkitOverflowScrolling:"touch"}}>
          {GUIDE_ELEMENTS.map((g, i) => (
            <button key={g.type} onClick={()=>setActive(i)} style={{
              padding:"6px 12px", borderRadius:RADIUS.pill, border:"none", cursor:"pointer",
              fontSize:11, fontWeight:600, whiteSpace:"nowrap", transition:"all .15s",
              background: active===i ? g.color : C.bgCard,
              color: active===i ? (isDark?"#0A0909":"#fff") : C.textMuted,
              fontFamily:"inherit",
            }}>
              {g.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:"20px 24px 24px", overflowY:"auto", flex:1}}>
          {/* Example box */}
          <div style={{
            background:C.bgEditor, border:`1px solid ${C.border}`,
            borderRadius:RADIUS.md, padding:"20px 24px", marginBottom:20,
            fontFamily:"'Courier Prime',monospace", fontSize:13,
          }}>
            <div style={{fontSize:10, fontWeight:600, color:C.textMuted,
              letterSpacing:.8, textTransform:"uppercase", marginBottom:12}}>
              Así se ve en la página
            </div>
            {/* Mini screenplay preview */}
            <div style={{color:C.textMuted, fontSize:12, marginBottom:4}}>INT. LUGAR - DÍA</div>
            <div style={{color:C.textSec, fontSize:12, marginBottom:8}}>Una descripción de la escena.</div>
            {/* Highlighted element */}
            <div style={{
              background:`rgba(${hexToRgb(el.color)},.12)`,
              border:`1.5px solid rgba(${hexToRgb(el.color)},.35)`,
              borderRadius:RADIUS.sm, padding:"8px 12px", marginBottom:4,
              color:el.color, fontSize:12, fontWeight:700,
              textAlign: el.type===T.CHARACTER||el.type===T.PAREN||el.type===T.DIALOGUE ? "center" : 
                         el.type===T.TRANSITION ? "right" : "left",
            }}>
              {el.example}
            </div>
            {(el.type===T.CHARACTER) && (
              <div style={{color:C.textSec, fontSize:12, textAlign:"center"}}>El diálogo va acá.</div>
            )}
          </div>

          {/* Description */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:14, fontWeight:600, color:C.textPrimary, marginBottom:8}}>
              {el.name}
            </div>
            <p style={{fontSize:13, color:C.textSec, lineHeight:1.65, margin:0}}>
              {el.desc}
            </p>
          </div>

          {/* Tip */}
          <div style={{
            background:`rgba(${hexToRgb(C.yellow)},.08)`,
            border:`1px solid rgba(${hexToRgb(C.yellow)},.2)`,
            borderRadius:RADIUS.sm, padding:"11px 14px",
            display:"flex", gap:10, alignItems:"flex-start",
          }}>
            <span style={{fontSize:14, flexShrink:0}}>💡</span>
            <p style={{fontSize:12, color:C.textSec, lineHeight:1.6, margin:0}}>
              <strong style={{color:C.yellow}}>Consejo: </strong>{el.tip}
            </p>
          </div>

          {/* Navigation */}
          <div style={{display:"flex", justifyContent:"space-between", marginTop:20, gap:8}}>
            <Btn onClick={()=>setActive(v=>Math.max(0,v-1))} disabled={active===0}
              style={{fontSize:12, padding:"7px 14px"}}>
              ← Anterior
            </Btn>
            <span style={{fontSize:11, color:C.textMuted, alignSelf:"center"}}>
              {active+1} / {GUIDE_ELEMENTS.length}
            </span>
            <Btn onClick={()=>setActive(v=>Math.min(GUIDE_ELEMENTS.length-1,v+1))}
              disabled={active===GUIDE_ELEMENTS.length-1}
              variant={active===GUIDE_ELEMENTS.length-1?"outline":"primary"}
              style={{fontSize:12, padding:"7px 14px"}}>
              Siguiente →
            </Btn>
          </div>

          {/* Atajos de teclado */}
          <div style={{marginTop:22, paddingTop:18, borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:10, fontWeight:600, color:C.textMuted,
              letterSpacing:.8, textTransform:"uppercase", marginBottom:10}}>
              Atajos de teclado
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px"}}>
              {[
                ["Tab / Shift+Tab", "Cambiar tipo de bloque"],
                ["Enter", "Nuevo bloque"],
                ["Ctrl/⌘ + Z", "Deshacer"],
                ["Ctrl/⌘ + Shift+Z", "Rehacer"],
                ["Ctrl/⌘ + F", "Buscar"],
                ["Ctrl/⌘ + S", "Guardar ahora"],
                ["Ctrl/⌘ + N", "Nuevo guion"],
              ].map(([key, label]) => (
                <div key={key} style={{display:"flex", alignItems:"center", gap:8, fontSize:11.5}}>
                  <kbd style={{
                    background:C.bgCard, border:`1px solid ${C.borderBright}`,
                    borderRadius:RADIUS.xs, padding:"2px 7px", fontSize:10.5,
                    fontFamily:"'Courier Prime',monospace", color:C.textSec, whiteSpace:"nowrap",
                  }}>{key}</kbd>
                  <span style={{color:C.textMuted}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExportPDFModal({ blocks, projectName, onClose, isDark }) {
  const C = useTheme();
  const [format, setFormat]         = useState("hollywood");
  const [author, setAuthor]         = useState("");
  const [sceneNumbers, setSceneNumbers] = useState(false);
  const [noteCategories, setNoteCategories] = useState([]); // vacío = no incluir ninguna nota
  const [generating, setGenerating] = useState(false);

  const toggleNoteCategory = (id) => {
    setNoteCategories(prev => prev.includes(id) ? prev.filter(c=>c!==id) : [...prev, id]);
  };

  const inputStyle = {
    width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
    borderRadius:RADIUS.sm, padding:"10px 14px", color:C.textPrimary, fontSize:13,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
    transition:"border-color .15s",
  };

  const radioStyle = (active) => ({
    display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px",
    borderRadius:RADIUS.md, border:`1.5px solid ${active ? C.accent : C.borderBright}`,
    background: active ? C.accentGlow : "none",
    cursor:"pointer", transition:"all .15s",
  });
  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      exportToPDFPro(blocks, projectName, { format, author, sceneNumbers, noteCategories });
      setGenerating(false);
      onClose();
    }, 100);
  };

  return (
    <div className="overlay-in" onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.6)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:500, padding:16,
    }}>
      <div className="modal-in" onClick={e=>e.stopPropagation()} style={{
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, padding:"28px 24px", width:"100%", maxWidth:420,
        boxShadow:`0 24px 60px ${C.shadow}`,
      }}>
        {/* Header */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22}}>
          <div>
            <div style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:16, color:C.textPrimary}}>
              Exportar PDF
            </div>
            <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>Formato profesional de guion</div>
          </div>
          <button onClick={onClose} style={{background:"none", border:"none", color:C.textMuted,
            cursor:"pointer", padding:"4px 6px", borderRadius:RADIUS.sm, display:"flex"}}>
            <Icons.Close/>
          </button>
        </div>

        {/* Mini preview de portada */}
        <div style={{
          display:"flex", justifyContent:"center", marginBottom:20,
        }}>
          <div style={{
            width:format==="hollywood"?92:88,
            height:format==="hollywood"?119:124,
            background:isDark?"#1A1812":"#FAF8F2",
            border:`1px solid ${C.borderBright}`,
            borderRadius:RADIUS.xs,
            boxShadow:`0 8px 24px ${C.shadow}, 0 1px 0 ${C.borderBright}`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            padding:"10px 8px", textAlign:"center", transition:"all .25s cubic-bezier(.16,1,.3,1)",
            position:"relative", overflow:"hidden",
          }}>
            {/* Línea sutil de "página" */}
            <div style={{position:"absolute", top:6, left:6, right:6, height:1, background:C.borderBright, opacity:.3}}/>
            <div style={{
              fontFamily:"'Courier Prime',monospace", fontWeight:700,
              fontSize:7, color:isDark?"#D8CCAA":"#1A1510",
              lineHeight:1.3, marginBottom:6, wordBreak:"break-word",
            }}>
              {(projectName||"GUION").toUpperCase().slice(0,28)}
            </div>
            {author && (
              <>
                <div style={{fontSize:4.5, color:isDark?"#8A8070":"#8A7860", marginBottom:2}}>Escrito por</div>
                <div style={{fontSize:5.5, fontWeight:700, color:isDark?"#C0A060":"#8B6820", marginBottom:6}}>
                  {author.slice(0,22)}
                </div>
              </>
            )}
            <div style={{
              position:"absolute", bottom:8, fontSize:4, color:C.textFaint,
              letterSpacing:.3,
            }}>
              {format==="hollywood" ? "LETTER · WGA" : "A4 · EUROPEO"}
            </div>
          </div>
        </div>

        {/* Formato */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:10}}>Formato</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <div style={radioStyle(format==="hollywood")} onClick={()=>setFormat("hollywood")}>
              <div style={{width:16, height:16, borderRadius:"50%", border:`2px solid ${format==="hollywood"?C.accent:C.borderBright}`,
                background:format==="hollywood"?C.accent:"none", flexShrink:0, marginTop:1,
                display:"flex", alignItems:"center", justifyContent:"center"}}>
                {format==="hollywood" && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:C.textPrimary}}>Hollywood (estándar)</div>
                <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
                  Página Letter · márgenes WGA · Courier 12pt · personaje a 3.7"
                </div>
              </div>
            </div>
            <div style={radioStyle(format==="european")} onClick={()=>setFormat("european")}>
              <div style={{width:16, height:16, borderRadius:"50%", border:`2px solid ${format==="european"?C.accent:C.borderBright}`,
                background:format==="european"?C.accent:"none", flexShrink:0, marginTop:1,
                display:"flex", alignItems:"center", justifyContent:"center"}}>
                {format==="european" && <div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:C.textPrimary}}>Europeo / Español</div>
                <div style={{fontSize:11, color:C.textMuted, marginTop:2}}>
                  Página A4 · márgenes europeos · etiquetas en español
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autor */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:8}}>Autor / Guionista</div>
          <input
            type="text" value={author} placeholder="Tu nombre"
            onChange={e=>setAuthor(e.target.value)} style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.accent}
            onBlur={e=>e.target.style.borderColor=C.borderBright}
          />
        </div>

        {/* Opciones */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:10}}>Opciones</div>
          <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer"}}>
            <div onClick={()=>setSceneNumbers(v=>!v)} style={{
              width:18, height:18, borderRadius:RADIUS.xs, border:`2px solid ${sceneNumbers?C.accent:C.borderBright}`,
              background:sceneNumbers?C.accent:"none", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s",
            }}>
              {sceneNumbers && <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </div>
            <div>
              <div style={{fontSize:13, color:C.textPrimary}}>Numeración de escenas</div>
              <div style={{fontSize:11, color:C.textMuted}}>Agrega número al inicio de cada encabezado</div>
            </div>
          </label>
        </div>

        {/* Notas de dirección */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:4}}>Notas de dirección en el PDF</div>
          <div style={{fontSize:11, color:C.textMuted, marginBottom:10}}>
            El guion se exporta siempre limpio. Elegí qué categorías de notas querés incluir además del texto.
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {NOTE_CATEGORIES.map(cat => {
              const on = noteCategories.includes(cat.id);
              const c2 = noteCategoryColor(cat.id, C);
              return (
                <button key={cat.id} onClick={()=>toggleNoteCategory(cat.id)} type="button"
                  style={{padding:"6px 11px", borderRadius:RADIUS.pill, fontSize:12,
                    background:on?`rgba(${hexToRgb(c2)},.16)`:"none",
                    border:`1.5px solid ${on?c2:C.borderBright}`,
                    color:on?c2:C.textMuted, cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:5, transition:"all .15s"}}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón */}
        <button onClick={generate} disabled={generating} style={{
          width:"100%", padding:"13px", borderRadius:RADIUS.md, border:"none",
          background:C.accent, color:"#fff", fontSize:14, fontWeight:600,
          cursor:generating?"wait":"pointer", opacity:generating?.7:1,
          fontFamily:"'Courier Prime',monospace", letterSpacing:.5,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          <Icons.PDF style={{width:15,height:15}}/> {generating ? "Generando…" : "Generar PDF"}
        </button>
      </div>
    </div>
  );
}
