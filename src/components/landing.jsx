import { useState } from "react";
import { C, RADIUS } from "../design/tokens";
import { Icons } from "../lib/icons";
import { Btn } from "./common";
import { supabase } from "../lib/supabase";

export function WelcomeScreen({ onNew, onImport, isDark }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:C.bgEditor, padding:"40px 24px",
    }}>
      {/* Logo grande */}
      <svg width="90" height="69" viewBox="0 0 52 40" fill="none" style={{marginBottom:28}}>
        <rect width="52" height="40" rx="7"
          fill={isDark?"#080808":"#EBE4D8"}
          stroke={isDark?"#2A2520":"#C4B898"} strokeWidth="0.75"/>
        <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
        <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace"
          fontSize="13" fontWeight="700" fill={isDark?"#E8E0D0":"#1A1510"}
          textAnchor="middle" letterSpacing="2">PLANO</text>
        <rect x="10" y="28" width="30" height="1.5" rx="0.75"
          fill={isDark?"#C0A060":"#8B6820"} opacity="0.9"/>
        <rect x="38.5" y="14" width="2" height="14" rx="1"
          fill={isDark?"#C0A060":"#8B6820"}>
          <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
        </rect>
      </svg>

      <h1 style={{fontFamily:"'Courier Prime',monospace", fontSize:22, fontWeight:700,
        color:C.textPrimary, margin:"0 0 8px", textAlign:"center", letterSpacing:-.3}}>
        Bienvenido a Plano
      </h1>
      <p style={{fontSize:14, color:C.textMuted, margin:"0 0 36px", textAlign:"center",
        maxWidth:340, lineHeight:1.6}}>
        Tu espacio para escribir guiones profesionales.<br/>
        Cada historia empieza con una primera línea.
      </p>

      <div style={{display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:280}}>
        <button onClick={onNew} style={{
          padding:"14px 20px", borderRadius:RADIUS.md, border:"none",
          background:C.accent, color:"#fff", fontSize:14, fontWeight:600,
          cursor:"pointer", fontFamily:"'Courier Prime',monospace",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          boxShadow:`0 4px 16px rgba(91,141,239,0.3)`,
          transition:"opacity .15s",
        }}
          onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          <Icons.Plus style={{width:18,height:18}}/> Nuevo guion
        </button>
        <button onClick={onImport} style={{
          padding:"13px 20px", borderRadius:RADIUS.md, border:`1.5px solid ${C.borderBright}`,
          background:"none", color:C.textSec, fontSize:13, fontWeight:500,
          cursor:"pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          transition:"border-color .15s, color .15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderBright;e.currentTarget.style.color=C.textSec}}>
          <Icons.Import/> Importar .fountain
        </button>
      </div>

      <p style={{marginTop:32, fontSize:11, color:C.textFaint, textAlign:"center"}}>
        1 página = ~1 minuto de película
      </p>
    </div>
  );
}

export function LandingFeature({ icon, title, desc, isDark }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        padding:"22px 20px", borderRadius:RADIUS.lg,
        background:C.bgCard, border:`1px solid ${hover?C.accent+"50":C.border}`,
        transition:"border-color .2s cubic-bezier(.16,1,.3,1), transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease",
        transform:hover?"translateY(-3px)":"none",
        boxShadow:hover?`0 12px 28px ${C.shadow}`:"none",
      }}>
      <div style={{width:34, height:34, borderRadius:RADIUS.sm, background:C.accentGlow,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:C.accent, marginBottom:14}}>
        {icon}
      </div>
      <div style={{fontSize:14, fontWeight:700, color:C.textPrimary, marginBottom:6,
        fontFamily:"'Courier Prime',monospace"}}>{title}</div>
      <div style={{fontSize:12.5, color:C.textMuted, lineHeight:1.6}}>{desc}</div>
    </div>
  );
}

export function LandingPage({ isDark, onToggleTheme, onEnter }) {
  return (
    <div style={{minHeight:"100dvh", background:C.bgApp, position:"relative", overflow:"hidden"}}>

      {/* Viñeta + grano, igual que el login */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:isDark
          ? "radial-gradient(ellipse at top, rgba(192,160,96,.05) 0%, transparent 45%), radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,.5) 100%)"
          : "radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(40,30,15,.07) 100%)",
      }}/>
      <svg style={{position:"absolute", inset:0, width:"100%", height:"100%",
        pointerEvents:"none", opacity:isDark?.05:.025, mixBlendMode:isDark?"screen":"multiply"}}>
        <filter id="landingGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#landingGrain)"/>
      </svg>

      {/* Header */}
      <div style={{position:"relative", zIndex:2, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"22px 28px", maxWidth:1100, margin:"0 auto"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <svg width="38" height="29" viewBox="0 0 52 40" fill="none">
            <rect width="52" height="40" rx="7" fill={isDark?"#080808":"#EBE4D8"} stroke={isDark?"#2A2520":"#C4B898"} strokeWidth="0.75"/>
            <rect x="3" y="5" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <rect x="44" y="5" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
            <text x="26" y="24" fontFamily="'Courier Prime',monospace" fontSize="13" fontWeight="700"
              fill={isDark?"#E8E0D0":"#1A1510"} textAnchor="middle" letterSpacing="2">PLANO</text>
            <rect x="10" y="28" width="30" height="1.5" rx="0.75" fill={isDark?"#C0A060":"#8B6820"} opacity="0.9"/>
          </svg>
          <span style={{fontFamily:"'Courier Prime',monospace", fontWeight:700, fontSize:14,
            color:C.textPrimary, letterSpacing:1}}>PLANO</span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <button onClick={onToggleTheme} title={isDark?"Modo día":"Modo noche"}
            style={{background:"none", border:"none", color:C.textMuted, cursor:"pointer",
              padding:8, borderRadius:RADIUS.sm, display:"flex", alignItems:"center",
              transition:"color .18s ease, background .18s ease"}}
            onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentGlow}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
            {isDark ? <Icons.Sun/> : <Icons.Moon/>}
          </button>
          <button onClick={onEnter} style={{
            background:"none", border:`1px solid ${C.borderBright}`, borderRadius:RADIUS.sm,
            color:C.textSec, fontSize:12.5, fontWeight:600, padding:"8px 16px",
            cursor:"pointer", fontFamily:"inherit",
            transition:"border-color .18s ease, color .18s ease"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderBright;e.currentTarget.style.color=C.textSec}}>
            Entrar
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="fade-in" style={{position:"relative", zIndex:2, textAlign:"center",
        padding:"64px 24px 56px", maxWidth:680, margin:"0 auto"}}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:6,
          background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:RADIUS.pill,
          padding:"5px 14px", fontSize:11, color:C.textMuted, marginBottom:24,
        }}>
          <div style={{width:5, height:5, borderRadius:"50%", background:C.accent}}/>
          Para escritores que filman sus ideas
        </div>

        <h1 style={{
          fontFamily:"'Courier Prime',monospace", fontWeight:700,
          fontSize:"clamp(28px, 5vw, 44px)", lineHeight:1.25,
          color:C.textPrimary, margin:"0 0 18px", letterSpacing:-.5,
        }}>
          Cada gran película<br/>
          empieza con <span style={{color:C.accent}}>FADE IN:</span>
        </h1>

        <p style={{fontSize:15, color:C.textMuted, lineHeight:1.7, margin:"0 auto 32px", maxWidth:480}}>
          Plano es tu sala de escritura. Formato profesional, guardado automático
          en la nube y todo lo necesario para llevar tu historia de la primera
          escena a la última página.
        </p>

        <div style={{display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap"}}>
          <button onClick={onEnter} style={{
            padding:"13px 28px", borderRadius:RADIUS.md, border:"none",
            background:C.accent, color:"#fff", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"'Courier Prime',monospace", letterSpacing:.3,
            display:"flex", alignItems:"center", gap:8,
            boxShadow:`0 4px 20px ${C.accent}35`,
            transition:"transform .15s ease, box-shadow .2s ease",
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px ${C.accent}50`}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 4px 20px ${C.accent}35`}}>
            Empezar a escribir <Icons.Plus style={{width:14,height:14}}/>
          </button>
        </div>
      </div>

      {/* Mockup de editor */}
      <div className="fade-in" style={{position:"relative", zIndex:2, maxWidth:680, margin:"0 auto 64px", padding:"0 24px"}}>
        <div style={{
          background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:RADIUS.md,
          padding:"28px 36px 36px", boxShadow:`0 24px 60px ${C.shadow}`,
        }}>
          <div style={{fontFamily:"'Courier Prime',monospace", fontSize:12.5, lineHeight:1.75}}>
            <div style={{color:C.accent, fontWeight:700, marginBottom:8}}>INT. CAFÉ — NOCHE</div>
            <div style={{color:C.textMuted, marginBottom:8}}>
              El café está casi vacío. Una lámpara parpadeante ilumina la barra de madera desgastada.
            </div>
            <div style={{color:C.accentWarm, textAlign:"center", marginBottom:2}}>SOFÍA</div>
            <div style={{color:C.textSec, textAlign:"center", marginBottom:8}}>¿Cuánto tiempo llevas esperando?</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{position:"relative", zIndex:2, maxWidth:900, margin:"0 auto", padding:"0 24px 72px"}}>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",
          gap:14,
        }}>
          <LandingFeature isDark={isDark}
            icon={<Icons.Editor style={{width:17,height:17}}/>}
            title="Formato profesional"
            desc="Hollywood o europeo, con márgenes y tipografía exactos al estándar de la industria."/>
          <LandingFeature isDark={isDark}
            icon={<Icons.Saving style={{width:17,height:17}}/>}
            title="Nunca se pierde"
            desc="Guardado automático en la nube. Cambiá de compu, de celular, da igual."/>
          <LandingFeature isDark={isDark}
            icon={<Icons.History style={{width:17,height:17}}/>}
            title="Historial de versiones"
            desc="Volvé a cómo estaba tu guion hace una semana con un solo click."/>
          <LandingFeature isDark={isDark}
            icon={<Icons.PDF style={{width:17,height:17}}/>}
            title="Exportá cuando quieras"
            desc="PDF listo para imprimir o .fountain compatible con cualquier app."/>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:"relative", zIndex:2, textAlign:"center", padding:"0 24px 40px"}}>
        <p style={{fontSize:11, color:C.textFaint}}>
          Plano Screenwriting · hecho para contar historias
        </p>
      </div>
    </div>
  );
}

export function AuthScreen({ isDark, onToggleTheme }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  const handleSubmit = async () => {
    if (!email.trim() || (!password.trim() && mode !== "forgot")) return;
    setLoading(true); reset();
    try {
      if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError(e.message);
      } else if (mode === "register") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else setSuccess("Revisá tu email para confirmar la cuenta.");
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(email);
        if (e) setError(e.message);
        else setSuccess("Te enviamos un link para restablecer tu contraseña.");
      }
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", background:C.bgCard, border:`1px solid ${C.borderBright}`,
    borderRadius:RADIUS.md, padding:"13px 16px", color:C.textPrimary, fontSize:15,
    outline:"none", transition:"border-color .15s", fontFamily:"inherit",
    boxSizing:"border-box",
  };

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:C.bgApp, padding:"24px 16px",
      position:"relative", overflow:"hidden",
    }}>
      {/* Viñeta cinematográfica */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:isDark
          ? "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,.55) 100%)"
          : "radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(40,30,15,.08) 100%)",
      }}/>

      {/* Grano de película sutil */}
      <svg style={{position:"absolute", inset:0, width:"100%", height:"100%",
        pointerEvents:"none", opacity:isDark?.05:.025, mixBlendMode:isDark?"screen":"multiply"}}>
        <filter id="filmGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#filmGrain)"/>
      </svg>

      {/* Theme toggle top-right */}
      <button onClick={onToggleTheme} title={isDark?"Modo día":"Modo noche"}
        style={{position:"fixed", top:16, right:16, background:"none", border:"none",
          color:C.textMuted, cursor:"pointer", padding:8, borderRadius:RADIUS.sm,
          display:"flex", alignItems:"center", zIndex:2,
          transition:"color .18s ease, background .18s ease"}}
        onMouseEnter={e=>{e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentGlow}}
        onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted;e.currentTarget.style.background="none"}}>
        {isDark ? <Icons.Sun/> : <Icons.Moon/>}
      </button>

      {/* Logo */}
      <div className="fade-in" style={{marginBottom:32, position:"relative", zIndex:2}}>
        <svg width="80" height="62" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="52" height="40" rx="7"
            fill={isDark ? "#080808" : "#EBE4D8"}
            stroke={isDark ? "#2A2520" : "#C4B898"} strokeWidth="0.75"/>
          <rect x="3" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="44" y="5"  width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={isDark?"#1E1A14":"#C4B898"}/>
          <text x="26" y="24" fontFamily="'Courier Prime','Courier New',monospace"
            fontSize="13" fontWeight="700" fill={isDark?"#E8E0D0":"#1A1510"}
            textAnchor="middle" letterSpacing="2">PLANO</text>
          <rect x="10" y="28" width="30" height="1.5" rx="0.75"
            fill={isDark?"#C0A060":"#8B6820"} opacity="0.9"/>
          <rect x="38.5" y="14" width="2" height="14" rx="1" fill={isDark?"#C0A060":"#8B6820"}>
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
          </rect>
        </svg>
      </div>

      {/* Card */}
      <div className="modal-in" style={{
        width:"100%", maxWidth:400, position:"relative", zIndex:2,
        background:C.bgPanel, border:`1px solid ${C.borderBright}`,
        borderRadius:RADIUS.lg, padding:"32px 28px",
        boxShadow:`0 24px 60px ${C.shadow}, 0 0 0 1px ${C.accent}08`,
      }}>
        <h1 style={{
          fontFamily:"'Courier Prime',monospace", fontSize:22, fontWeight:700,
          color:C.textPrimary, margin:"0 0 4px", letterSpacing:-.3,
        }}>
          {mode==="login" ? "Bienvenido" : mode==="register" ? "Crear cuenta" : "Restablecer contraseña"}
        </h1>
        <p style={{fontSize:13, color:C.textMuted, margin:"0 0 28px"}}>
          {mode==="login" ? "Ingresá a tu cuenta de Plano." :
           mode==="register" ? "Tus guiones guardados en la nube." :
           "Te enviamos un link a tu email."}
        </p>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <input
            type="email" value={email} onChange={e=>{setEmail(e.target.value);reset();}}
            placeholder="tu@email.com" autoComplete="email"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor=C.accent}
            onBlur={e=>e.target.style.borderColor=C.borderBright}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          />
          {mode !== "forgot" && (
            <input
              type="password" value={password} onChange={e=>{setPassword(e.target.value);reset();}}
              placeholder="Contraseña" autoComplete={mode==="register"?"new-password":"current-password"}
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=C.accent}
              onBlur={e=>e.target.style.borderColor=C.borderBright}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
            />
          )}

          {error && (
            <p style={{fontSize:12, color:C.red, margin:0, padding:"10px 14px",
              background:`rgba(240,96,96,.08)`, borderRadius:RADIUS.sm,
              border:`1px solid rgba(240,96,96,.2)`}}>{error}</p>
          )}
          {success && (
            <p style={{fontSize:12, color:C.green, margin:0, padding:"10px 14px",
              background:`rgba(63,202,140,.08)`, borderRadius:RADIUS.sm,
              border:`1px solid rgba(63,202,140,.2)`}}>{success}</p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width:"100%", padding:"13px", borderRadius:RADIUS.md, border:"none",
              background:C.accent, color:"#fff", fontSize:15, fontWeight:600,
              cursor:loading?"wait":"pointer", transition:"opacity .15s",
              opacity:loading?.65:1, fontFamily:"inherit", marginTop:4,
            }}>
            {loading ? "Un momento..." :
             mode==="login" ? "Entrar" :
             mode==="register" ? "Crear cuenta" : "Enviar link"}
          </button>
        </div>

        {/* Links inferiores */}
        <div style={{marginTop:22, display:"flex", flexDirection:"column", gap:8, alignItems:"center"}}>
          {mode==="login" && (<>
            <button onClick={()=>{setMode("forgot");reset();}} style={{
              background:"none", border:"none", color:C.textMuted, fontSize:12,
              cursor:"pointer", padding:0, fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.textSec}
              onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
              ¿Olvidaste tu contraseña?
            </button>
            <p style={{fontSize:13, color:C.textMuted, margin:0}}>
              ¿No tenés cuenta?{" "}
              <button onClick={()=>{setMode("register");reset();}} style={{
                background:"none", border:"none", color:C.accent, fontSize:13,
                cursor:"pointer", padding:0, fontWeight:600, fontFamily:"inherit"}}>
                Registrate
              </button>
            </p>
          </>)}
          {mode==="register" && (
            <p style={{fontSize:13, color:C.textMuted, margin:0}}>
              ¿Ya tenés cuenta?{" "}
              <button onClick={()=>{setMode("login");reset();}} style={{
                background:"none", border:"none", color:C.accent, fontSize:13,
                cursor:"pointer", padding:0, fontWeight:600, fontFamily:"inherit"}}>
                Iniciá sesión
              </button>
            </p>
          )}
          {mode==="forgot" && (
            <button onClick={()=>{setMode("login");reset();}} style={{
              background:"none", border:"none", color:C.textMuted, fontSize:12,
              cursor:"pointer", padding:0, fontFamily:"inherit"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.textSec}
              onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
              ← Volver al login
            </button>
          )}
        </div>
      </div>

      <p style={{marginTop:20, fontSize:11, color:C.textFaint, textAlign:"center", position:"relative", zIndex:2}}>
        Plano Screenwriting · tus guiones siempre disponibles
      </p>
    </div>
  );
}
