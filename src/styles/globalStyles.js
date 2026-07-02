import { useEffect } from "react";
import { DARK, LIGHT, C } from "../design/tokens";

export function makeGlobalCss(C) { return `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;background:${C.bgApp};color:${C.textPrimary};font-family:'Inter',system-ui,sans-serif}

  /* ── Scrollbars noir ── */
  ::-webkit-scrollbar{width:7px;height:7px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${C.borderBright};border-radius:4px;border:1.5px solid ${C.bgApp};background-clip:padding-box}
  ::-webkit-scrollbar-thumb:hover{background:${C.accent};background-clip:padding-box}
  * { scrollbar-width: thin; scrollbar-color: ${C.borderBright} transparent; }

  textarea:focus,input:focus{outline:none}
  /* :focus-visible = solo se ve navegando con teclado (Tab), no al clickear con mouse */
  textarea:focus-visible,input:focus-visible,button:focus-visible,a:focus-visible,[tabindex]:focus-visible{
    outline:2px solid ${C.accent};
    outline-offset:2px;
    border-radius:4px;
  }
  button{cursor:pointer;font-family:inherit}
  input{font-family:inherit}
  mark{background:${C.accentGlow};color:${C.accent};border-radius:2px;padding:0 1px}

  /* ── Animaciones ── */
  @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  .fade-in{animation:fadeIn .22s cubic-bezier(.16,1,.3,1)}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes savePulse{0%{transform:scale(1.6);opacity:0}60%{opacity:1}100%{transform:scale(1);opacity:1}}
  .save-pulse{animation:savePulse .4s cubic-bezier(.34,1.56,.64,1)}
  .saving{animation:pulse 1.2s infinite}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .slide-up{animation:slideUp .3s cubic-bezier(.16,1,.3,1)}
  @keyframes overlay-in{from{opacity:0}to{opacity:1}}
  .overlay-in{animation:overlay-in .18s ease}
  @keyframes modalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
  .modal-in{animation:modalIn .22s cubic-bezier(.16,1,.3,1)}
  @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
  .slide-right{animation:slideInRight .28s cubic-bezier(.16,1,.3,1)}
  @keyframes flicker{0%,100%{opacity:1}45%{opacity:.85}55%{opacity:1}}
  .flicker{animation:flicker 4s ease-in-out infinite}
  @keyframes grain{0%,100%{transform:translate(0,0)}10%{transform:translate(-1%,-2%)}20%{transform:translate(2%,1%)}30%{transform:translate(-1%,2%)}40%{transform:translate(1%,-1%)}50%{transform:translate(-2%,1%)}60%{transform:translate(2%,-2%)}70%{transform:translate(-1%,1%)}80%{transform:translate(1%,2%)}90%{transform:translate(-2%,-1%)}}

  /* ── Estados vacíos ── */
  @keyframes emptyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .empty-float{animation:emptyFloat 3.5s ease-in-out infinite}

  /* ── Nav buttons ── */
  .icon-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;
    border:none;background:none;color:${C.textMuted};font-size:9px;font-weight:600;
    letter-spacing:.5px;text-transform:uppercase;transition:color .18s cubic-bezier(.16,1,.3,1),background .18s cubic-bezier(.16,1,.3,1),transform .15s ease;
    border-radius:8px;width:100%;cursor:pointer}
  .icon-nav-btn:hover{color:${C.textSec};background:${C.bgCard};transform:translateY(-1px)}
  .icon-nav-btn.active{color:${C.accent};background:${C.accentGlow};box-shadow:inset 0 0 0 1px ${C.accent}30}
  .icon-nav-btn:active{transform:translateY(0) scale(.96)}

  /* bottom nav mobile */
  .mobile-nav-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    flex:1;padding:6px 2px 8px;border:none;background:none;cursor:pointer;transition:color .18s ease,transform .12s ease;
    font-size:9px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;
    color:${C.textMuted};min-height:52px}
  .mobile-nav-btn.active{color:${C.accent}}
  .mobile-nav-btn:active{opacity:.7;transform:scale(.94)}

  /* Tap highlight off on mobile */
  button{-webkit-tap-highlight-color:transparent}
  textarea{-webkit-tap-highlight-color:transparent}

  /* ── Transiciones suaves globales ── */
  button, input, textarea, a { transition: background-color .18s cubic-bezier(.16,1,.3,1), border-color .18s cubic-bezier(.16,1,.3,1), color .18s cubic-bezier(.16,1,.3,1), opacity .18s ease, box-shadow .2s ease, transform .12s ease; }
`; }

export function InjectStyles({ theme }) {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "plano-global-styles";
    el.textContent = makeGlobalCss(C);
    document.head.appendChild(el);

    // Título de la pestaña
    document.title = "Plano";

    // Favicon SVG minimalista: tira de película
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill="#0A0909"/>
      <rect x="2" y="4" width="4" height="5" rx="1" fill="#2A2520"/>
      <rect x="2" y="14" width="4" height="5" rx="1" fill="#2A2520"/>
      <rect x="2" y="23" width="4" height="5" rx="1" fill="#2A2520"/>
      <rect x="26" y="4" width="4" height="5" rx="1" fill="#2A2520"/>
      <rect x="26" y="14" width="4" height="5" rx="1" fill="#2A2520"/>
      <rect x="26" y="23" width="4" height="5" rx="1" fill="#2A2520"/>
      <text x="16" y="20" font-family="'Courier New',monospace" font-size="10" font-weight="700"
        fill="#E8E0D0" text-anchor="middle" letter-spacing="0.5">P</text>
      <rect x="8" y="22" width="16" height="1.5" rx="0.75" fill="#C0A060"/>
    </svg>`;
    const faviconUrl = "data:image/svg+xml," + encodeURIComponent(faviconSvg);
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = faviconUrl;

    return () => document.head.removeChild(el);
  }, []);
  useEffect(() => {
    const el = document.getElementById("plano-global-styles");
    if (el) el.textContent = makeGlobalCss(C);
  }, [theme]);
  return null;
}
