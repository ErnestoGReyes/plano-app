import { useState, useEffect, useRef, useCallback, useMemo, Component } from "react";
import { T, DARK, LIGHT, FONT_DISPLAY, RADIUS, hexToRgb } from "./design/tokens";
import { useTheme, ThemeProvider } from "./contexts/ThemeContext";
import { Icons } from "./lib/icons";
import { supabase } from "./lib/supabase";
import { uid, extractCharacters, extractScenes, countWords, estimatePages, nextType, buildSceneGroups, flattenSceneGroups, normalizeNote } from "./utils/screenplay";
import { exportToFountain } from "./utils/fountain";
import { InjectStyles } from "./styles/globalStyles";
import { useUndoable } from "./hooks/useUndoable";
import { useAuth } from "./hooks/useAuth";
import { Btn, Modal } from "./components/common";
import {
  ImportFountainModal, HistoryModal, OnboardingModal, TrashModal, HelpModal, ExportPDFModal,
} from "./components/modals";
import { LandingPage, AuthScreen, WelcomeScreen } from "./components/landing";
import { NavSidebar, MobileBottomNav, MobileEditorHeader } from "./components/nav";
import { RightPanel, MobilePanel, CorkboardView, PanelContent } from "./components/panels";
import { Toolbar, ScriptBlock } from "./components/editor";

// Referencia estable — evita pasar un array [] nuevo en cada render a los bloques
// inactivos, lo que rompería la memoización de ScriptBlock (ver editor.jsx).
const EMPTY_SUGGESTIONS = [];

export const DEFAULT_PROJECT = () => ({
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

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — evita pantallas en blanco ante errores inesperados de render
// ═══════════════════════════════════════════════════════════════════════════════
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Acá podrías mandar el error a un servicio de logging (Sentry, etc.)
    console.error("Plano — error no controlado:", error, info);
  }
  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      const isDark = true;
      const theme = DARK;
      return (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: theme.bgApp,
          color: theme.textPrimary, padding: 24, textAlign: "center", gap: 14,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            fontFamily: "'Courier Prime',monospace", fontSize: 13,
            letterSpacing: 2, color: theme.textMuted, marginBottom: 4,
          }}>PLANO</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Algo salió mal</div>
          <div style={{ fontSize: 13, color: theme.textSec, maxWidth: 360, lineHeight: 1.6 }}>
            Encontramos un error inesperado. Tus guiones están a salvo — el
            autoguardado los respaldó. Recargá la página para continuar.
          </div>
          <button onClick={this.handleReload} style={{
            marginTop: 8, background: theme.accent, color: "#1A1510", border: "none",
            borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>Recargar página</button>
          {this.state.error && (
            <details style={{ marginTop: 16, fontSize: 11, color: theme.textFaint, maxWidth: 420 }}>
              <summary style={{ cursor: "pointer" }}>Detalles técnicos</summary>
              <pre style={{ whiteSpace: "pre-wrap", textAlign: "left", marginTop: 8 }}>
                {String(this.state.error?.message || this.state.error)}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppInner() {
  const session = useAuth();

  // ── Tema día/noche ─────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("plano-theme") !== "light"; } catch { return true; }
  });
  // C ya no se muta acá: se deriva directamente de isDark para lo que AppInner
  // necesita antes de que exista el ThemeProvider (ver más abajo), y el resto
  // del árbol lo consume vía useTheme() dentro del Provider.
  const C = isDark ? DARK : LIGHT;
  useEffect(() => {
    try { localStorage.setItem("plano-theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);
  const toggleTheme = useCallback(() => setIsDark(v => !v), []);

  // ── Sin sesión → landing o login ───────────────────────────────────────────
  // (declarado ANTES de cualquier return condicional, para no violar las reglas de los hooks)
  const [showLanding, setShowLanding] = useState(() => {
    try { return sessionStorage.getItem("plano-skip-landing") !== "1"; } catch { return true; }
  });

  // ── Cargando sesión ────────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{minHeight:"100dvh", display:"flex", flexDirection:"column", gap:16,
        alignItems:"center", justifyContent:"center", background:C.bgApp}}>
        <svg className="spinner" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={C.border} strokeWidth="2.5"/>
          <path d="M21 12a9 9 0 0 0-9-9" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <div style={{color:C.textMuted, fontSize:13, fontFamily:"'Courier Prime',monospace",
          letterSpacing:2}}>PLANO</div>
      </div>
    );
  }

  if (!session) {
    if (showLanding) {
      return (
        <ThemeProvider isDark={isDark}>
          <InjectStyles/>
          <LandingPage isDark={isDark} onToggleTheme={toggleTheme}
            onEnter={()=>{
              try { sessionStorage.setItem("plano-skip-landing","1"); } catch {}
              setShowLanding(false);
            }}/>
        </ThemeProvider>
      );
    }
    return (
      <ThemeProvider isDark={isDark}>
        <InjectStyles/>
        <AuthScreen isDark={isDark} onToggleTheme={toggleTheme}/>
      </ThemeProvider>
    );
  }

  // ── Con sesión → app completa ──────────────────────────────────────────────
  return (
    <ThemeProvider isDark={isDark}>
      <PlanoApp session={session} isDark={isDark} toggleTheme={toggleTheme}/>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner/>
    </ErrorBoundary>
  );
}

export function PlanoApp({ session, isDark, toggleTheme }) {
  const C = useTheme();
  // ── Proyectos ──────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const project = projects.find(p=>p.id===selectedId) || projects[0];

  // Cargar guiones del usuario desde Supabase
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("id, name, blocks, updated_at")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      if (data.length === 0) {
        // Sin guiones → mostrar pantalla de bienvenida
        setProjects([]);
      } else {
        setProjects(data);
        setSelectedId(prev => prev && data.some(p=>p.id===prev) ? prev : data[0].id);
      }
    } catch (err) {
      console.error("Error cargando guiones:", err);
      setLoadError(
        navigator.onLine === false
          ? "Sin conexión a internet. Revisá tu red e intentá de nuevo."
          : "No pudimos cargar tus guiones. Intentá de nuevo."
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Bloques con undo/redo ──────────────────────────────────────────────────
  const [blocks, setBlocksRaw, undo, redo, canUndo, canRedo] = useUndoable(project?.blocks||[]);

  const lastProjectId = useRef(selectedId);
  useEffect(() => {
    if (selectedId !== lastProjectId.current) {
      lastProjectId.current = selectedId;
      setBlocksRaw(project?.blocks||[]);
    }
  }, [selectedId]);

  const saveTimer = useRef(null);

  const updateBlocks = useCallback(nb => {
    setBlocksRaw(nb);
    setProjects(prev => prev.map(p => p.id===selectedId ? {...p, blocks:nb} : p));
  }, [selectedId, setBlocksRaw]);

  // ── Autosave a Supabase (con respaldo offline) ─────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const lastVersionSave = useRef(0);
  const PENDING_KEY = "plano-pending-saves";

  const readPending = () => {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "{}"); } catch { return {}; }
  };
  const writePending = obj => {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(obj)); } catch {}
  };

  const persistScript = useCallback(async (scriptId, blocksToSave) => {
    // Respaldo local inmediato — si se corta la conexión, no se pierde nada
    const pending = readPending();
    pending[scriptId] = { blocks: blocksToSave, updated_at: new Date().toISOString() };
    writePending(pending);

    try {
      const { error } = await supabase
        .from("scripts")
        .update({ blocks: blocksToSave, updated_at: new Date().toISOString() })
        .eq("id", scriptId);
      if (error) throw error;

      // Guardado con éxito → limpiar respaldo local de este guion
      const stillPending = readPending();
      delete stillPending[scriptId];
      writePending(stillPending);
      setSaveError(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);

      // Guardar versión cada 5 minutos
      const now = Date.now();
      if (now - lastVersionSave.current > 5 * 60 * 1000) {
        lastVersionSave.current = now;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("script_versions").insert({
            script_id: scriptId,
            user_id: user.id,
            blocks: blocksToSave,
          });
          // Mantener solo las últimas 20 versiones por guion
          const { data: old } = await supabase
            .from("script_versions")
            .select("id, created_at")
            .eq("script_id", scriptId)
            .order("created_at", { ascending: false })
            .range(20, 100);
          if (old?.length) {
            await supabase.from("script_versions")
              .delete().in("id", old.map(v=>v.id));
          }
        }
      }
      return true;
    } catch (err) {
      console.error("Error al guardar (queda respaldado localmente):", err);
      setSaveError(true);
      return false;
    }
  }, []);

  // Solo los bloques del proyecto activo — así el autoguardado no se reinicia
  // cuando cambia otra cosa del array `projects` (rename, reorder, etc.)
  const activeProjectBlocks = useMemo(
    () => projects.find(x=>x.id===selectedId)?.blocks,
    [projects, selectedId]
  );

  useEffect(() => {
    if (!selectedId || loadingProjects || !activeProjectBlocks) return;
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await persistScript(selectedId, activeProjectBlocks);
      setSaving(false);
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [activeProjectBlocks, selectedId, loadingProjects, persistScript]);

  // Al recuperar conexión, reintentar cualquier guardado pendiente
  useEffect(() => {
    const flushPending = async () => {
      const pending = readPending();
      const ids = Object.keys(pending);
      if (!ids.length) return;
      setSaving(true);
      for (const id of ids) {
        await persistScript(id, pending[id].blocks);
      }
      setSaving(false);
    };
    flushPending(); // por si quedó algo pendiente de una sesión anterior
    window.addEventListener("online", flushPending);
    return () => window.removeEventListener("online", flushPending);
  }, [persistScript]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const [navTab, setNavTab] = useState("editor");
  const [mobileTab, setMobileTab] = useState("editor");
  const [focusMode, setFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [trashedProjects, setTrashedProjects] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("plano-onboarding-done"); } catch { return true; }
  });

  const closeOnboarding = () => {
    try { localStorage.setItem("plano-onboarding-done", "1"); } catch {}
    setShowOnboarding(false);
  };

  const inputRefs = useRef({});
  const editorRef = useRef(null);

  // ── Mobile detection ───────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);


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
      if ((e.ctrlKey||e.metaKey) && e.key==="s") {
        // El autoguardado ya corre solo; esto solo fuerza el guardado inmediato
        e.preventDefault();
        clearTimeout(saveTimer.current);
        const p = projects.find(x=>x.id===selectedId);
        if (p) { setSaving(true); persistScript(p.id, p.blocks).finally(()=>setSaving(false)); }
      }
      if ((e.ctrlKey||e.metaKey) && e.key==="n" && !e.shiftKey) {
        e.preventDefault();
        setNewProjectModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, isMobile, projects, selectedId, persistScript]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const characters = useMemo(() => extractCharacters(blocks, isDark), [blocks, isDark]);
  const scenes = useMemo(() => extractScenes(blocks), [blocks]);
  // Escena "actual" = la última cuyo encabezado quedó en o antes del cursor,
  // no solo cuando el cursor está literalmente sobre esa línea de encabezado.
  const currentSceneIdx = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].index <= activeIndex) idx = i; else break;
    }
    return idx;
  }, [scenes, activeIndex]);
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
    updateBlocks(blocks.map((b,i) => {
      if (i!==index) return b;
      // Los llamadores viejos (corkboard, panel de notas) pasan un string y
      // solo tocan el texto; los nuevos (categoría, mostrar/ocultar) pasan un
      // objeto parcial. Cualquiera de los dos se fusiona sobre la nota actual.
      const current = normalizeNote(b.note);
      const patch = typeof note === "string" ? { text: note } : note;
      return { ...b, note: { ...current, ...patch } };
    }));
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

  // ── Proyectos CRUD ─────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("scripts")
      .insert({
        name: newProjectName.trim(),
        blocks: [{id:uid(), type:T.SCENE, text:"", note:""}],
        user_id: user.id,
      })
      .select()
      .single();
    if (!error && data) {
      setProjects(prev => [data, ...prev]);
      setSelectedId(data.id);
      setNewProjectName("");
      setNewProjectModal(false);
    } else {
      console.error("Error al crear el guion:", error);
      alert("No se pudo crear el guion. Probá de nuevo.");
    }
  };

  const deleteProject = async id => {
    if (!confirm("¿Mover este guion a la papelera?")) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("scripts").update({ deleted_at: now }).eq("id", id);
    if (error) {
      console.error("Error al mover a la papelera:", error);
      alert("No se pudo mover el guion a la papelera. Probá de nuevo.");
      return;
    }
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    if (updated.length === 0) setSelectedId(null);
    else if (selectedId === id) setSelectedId(updated[0]?.id);
  };

  const loadTrash = async () => {
    const { data } = await supabase
      .from("scripts")
      .select("id, name, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(10);
    setTrashedProjects(data || []);
  };

  const openTrash = async () => {
    await loadTrash();
    setShowTrashModal(true);
  };

  const restoreProject = async id => {
    const { error: restoreError } = await supabase.from("scripts").update({ deleted_at: null }).eq("id", id);
    if (restoreError) {
      console.error("Error al restaurar el guion:", restoreError);
      alert("No se pudo restaurar el guion. Probá de nuevo.");
      return;
    }
    const { data, error } = await supabase.from("scripts").select("id, name, blocks, updated_at").eq("id", id).single();
    if (error) {
      console.error("Error al recargar el guion restaurado:", error);
      alert("El guion se restauró, pero no se pudo recargar. Refrescá la página.");
      return;
    }
    if (data) setProjects(prev => [data, ...prev]);
    setTrashedProjects(prev => prev.filter(p => p.id !== id));
  };

  const deleteForever = async id => {
    if (!confirm("¿Eliminar definitivamente? No se puede recuperar.")) return;
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar definitivamente:", error);
      alert("No se pudo eliminar el guion. Probá de nuevo.");
      return;
    }
    setTrashedProjects(prev => prev.filter(p => p.id !== id));
  };

  const reorderProjects = (srcId, dstId) => {
    setProjects(prev => {
      const arr = [...prev];
      const srcIdx = arr.findIndex(p => p.id === srcId);
      const dstIdx = arr.findIndex(p => p.id === dstId);
      if (srcIdx < 0 || dstIdx < 0) return prev;
      const [item] = arr.splice(srcIdx, 1);
      arr.splice(dstIdx, 0, item);
      return arr;
    });
  };

  // Reordena escenas completas (heading + contenido) arrastrando tarjetas del tablero
  const reorderScenes = useCallback((srcId, dstId) => {
    const { preamble, groups } = buildSceneGroups(blocks);
    const srcIdx = groups.findIndex(g => g.id === srcId);
    const dstIdx = groups.findIndex(g => g.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const newGroups = [...groups];
    const [item] = newGroups.splice(srcIdx, 1);
    newGroups.splice(dstIdx, 0, item);
    updateBlocks(flattenSceneGroups(preamble, newGroups));
  }, [blocks, updateBlocks]);

  const renameProject = async (id, name) => {
    const previous = projects.find(p => p.id===id)?.name;
    setProjects(prev => prev.map(p => p.id===id ? {...p, name} : p));
    const { error } = await supabase.from("scripts").update({ name }).eq("id", id);
    if (error) {
      console.error("Error al renombrar el guion:", error);
      alert("No se pudo renombrar el guion. Se restauró el nombre anterior.");
      setProjects(prev => prev.map(p => p.id===id ? {...p, name: previous} : p));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const importProject = async (blocks, name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("scripts")
      .insert({ name, blocks, user_id: user.id })
      .select().single();
    if (!error && data) {
      setProjects(prev => [data, ...prev]);
      setSelectedId(data.id);
      setShowImportModal(false);
    } else {
      console.error("Error al importar el guion:", error);
      alert("No se pudo importar el guion. Probá de nuevo.");
    }
  };

  const restoreVersion = async (blocks) => {
    updateBlocks(blocks);
    setProjects(prev => prev.map(p =>
      p.id===selectedId ? {...p, blocks} : p
    ));
    // Reutiliza persistScript: ya maneja el respaldo local si falla el guardado
    const ok = await persistScript(selectedId, blocks);
    if (!ok) alert("La versión se restauró localmente, pero no se pudo guardar en el servidor todavía. Se reintentará.");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeTab = isMobile ? mobileTab : navTab;
  const showEditor = activeTab==="editor" || !isMobile;

  // Compensar el desbalance visual entre el sidebar de íconos (64px) y el panel
  // derecho de Escenas (200px) / panel auxiliar izquierdo (240px), para que el
  // guion se vea centrado en la pantalla completa y no solo en el espacio que le queda.
  const leftPanelsWidth = focusMode ? 0 : 64 + (navTab!=="editor" && navTab!=="corkboard" ? 240 : 0);
  const rightPanelsWidth = focusMode || navTab==="corkboard" ? 0 : 200;
  const editorCenterOffset = isMobile || focusMode ? 0 : (rightPanelsWidth - leftPanelsWidth) / 2;

  const editorContent = loadError ? (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bgEditor, padding:24}}>
      <div className="fade-in" style={{textAlign:"center", maxWidth:300}}>
        <div style={{color:C.red, marginBottom:10, opacity:.8}}>
          <Icons.Help style={{width:28,height:28}}/>
        </div>
        <div style={{color:C.textSec, fontSize:13, lineHeight:1.6, marginBottom:16}}>
          {loadError}
        </div>
        <Btn onClick={loadProjects} variant="primary" style={{margin:"0 auto"}}>
          Reintentar
        </Btn>
      </div>
    </div>
  ) : loadingProjects ? (
    <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      background:C.bgEditor, color:C.textMuted, fontSize:13,
      fontFamily:"'Courier Prime',monospace", letterSpacing:2}}>
      <div style={{textAlign:"center"}}>
        <svg width="52" height="40" viewBox="0 0 52 40" fill="none" style={{marginBottom:16,opacity:.5}}>
          <rect width="52" height="40" rx="7" fill={C.bgCard} stroke={C.border} strokeWidth="0.75"/>
          <rect x="3" y="5" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="3" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="5" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="17" width="5" height="7" rx="1.5" fill={C.bgActive}/>
          <rect x="44" y="29" width="5" height="7" rx="1.5" fill={C.bgActive}/>
        </svg>
        <div style={{letterSpacing:3}}>CARGANDO</div>
      </div>
    </div>
  ) : projects.length === 0 ? (
    <WelcomeScreen isDark={isDark}
      onNew={()=>setNewProjectModal(true)}
      onImport={()=>setShowImportModal(true)}/>
  ) : (
    <div ref={editorRef} style={{
      flex:1, overflowY:"auto",
      padding:focusMode
        ? "40px 20px 80px"
        : isMobile
          ? "16px 14px calc(env(safe-area-inset-bottom, 0px) + 80px)"
          : "24px 20px 60px",
      background:focusMode ? C.bgApp : C.bgEditor,
      transition:"background .3s",
      display:isMobile||focusMode ? "block" : "flex",
      justifyContent:isMobile||focusMode ? "flex-start" : "center",
      alignItems:isMobile||focusMode ? undefined : "flex-start",
    }}>
      <div style={isMobile||focusMode ? {maxWidth:focusMode?580:"100%", margin:"0 auto"} : {
        width:"100%", maxWidth:880, position:"relative",
        background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:2,
        padding:"36px 64px 48px",
        boxShadow:`4px 4px 0 ${C.bgEditor}, 4px 4px 0 1px ${C.border}, `+
                  `8px 8px 0 ${C.bgEditor}, 8px 8px 0 1px ${C.border}, 0 8px 32px ${C.shadow}`,
        marginLeft:editorCenterOffset, transition:"margin-left .2s",
      }}>
        {!isMobile && !focusMode && (
          <div style={{position:"absolute", top:16, right:20, fontSize:10.5,
            color:C.textFaint, fontFamily:"'Courier Prime','Courier New',monospace",
            letterSpacing:.5, userSelect:"none"}}>
            {pages} {pages===1?"pág.":"págs."}
          </div>
        )}
        {!isMobile && !focusMode && (
          <div style={{position:"relative", marginLeft:-64}}>
            {blocks.map((block, index) => (
              <ScriptBlock key={block.id} block={block} index={index}
                isActive={index===activeIndex} characterColors={characterColors}
                onUpdate={updateBlock} onFocus={setActiveIndex}
                onNoteChange={updateNote}
                onKeyDown={handleKeyDown} isMobile={isMobile}
                charSuggestions={index===activeIndex ? charSuggestions : EMPTY_SUGGESTIONS}
                onAcceptSuggestion={updateBlock}
                onAddBlockAfter={addBlockAfter}
                onDeleteBlock={deleteBlock}
                inputRef={el=>{
                  if(el) inputRefs.current[index]=el;
                  else delete inputRefs.current[index];
                }}/>
            ))}
          </div>
        )}
        {(isMobile || focusMode) && blocks.map((block, index) => (
          <ScriptBlock key={block.id} block={block} index={index}
            isActive={index===activeIndex} characterColors={characterColors}
            onUpdate={updateBlock} onFocus={setActiveIndex}
            onNoteChange={updateNote}
            onKeyDown={handleKeyDown} isMobile={isMobile}
            charSuggestions={index===activeIndex ? charSuggestions : EMPTY_SUGGESTIONS}
            onAcceptSuggestion={updateBlock}
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
            marginLeft:!isMobile&&!focusMode?0:0,
            borderTop:`1px dashed ${C.border}`,
            textAlign:"center", color:C.textFaint, fontSize:13, cursor:"pointer",
            transition:"color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.color=C.textMuted}
          onMouseLeave={e=>e.currentTarget.style.color=C.textFaint}>
          + agregar elemento
        </div>

        {!isMobile && !focusMode && (
          <div style={{marginTop:40, paddingTop:16, borderTop:`1px solid ${C.border}`,
            textAlign:"center", fontSize:10, letterSpacing:1.5, textTransform:"uppercase",
            color:C.textFaint, fontFamily:"'Courier Prime','Courier New',monospace"}}>
            {(project?.name||"Guion").toUpperCase()} · {pages} {pages===1?"página":"páginas"}
          </div>
        )}
      </div>
    </div>
  );

  const commonPanelProps = {
    projects, selectedId,
    onSelectProject: id=>{setSelectedId(id);},
    onNewProject: ()=>setNewProjectModal(true),
    onDeleteProject: deleteProject,
    onRenameProject: renameProject,
    onReorderProjects: reorderProjects,
    onOpenTrash: openTrash,
    scenes, characters, characterColors, activeBlock:activeIndex, blocks,
    onNoteChange: updateNote, stats,
    onSceneClick: scrollToBlock,
    onReorderScenes: reorderScenes, isDark,
    searchQuery, onSearchQuery: setSearchQuery, searchResults,
  };

  return (
    <>
      <InjectStyles/>

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingModal isDark={isDark} onClose={closeOnboarding}/>
      )}

      {/* Modal de exportación PDF */}
      {showExportModal && (
        <ExportPDFModal blocks={blocks} projectName={project?.name||"Guion"}
          isDark={isDark} onClose={()=>setShowExportModal(false)}/>
      )}

      {/* Modal de ayuda */}
      {showHelpModal && (
        <HelpModal isDark={isDark} onClose={()=>setShowHelpModal(false)}/>
      )}

      {/* Papelera */}
      {showTrashModal && (
        <TrashModal trashedProjects={trashedProjects}
          onRestore={restoreProject} onDeleteForever={deleteForever}
          onClose={()=>setShowTrashModal(false)}/>
      )}

      {/* Importar Fountain */}
      {showImportModal && (
        <ImportFountainModal isDark={isDark}
          onImport={importProject}
          onClose={()=>setShowImportModal(false)}/>
      )}

      {/* Historial de versiones */}
      {showHistoryModal && (
        <HistoryModal
          scriptId={selectedId}
          projectName={project?.name||"Guion"}
          onRestore={restoreVersion}
          onClose={()=>setShowHistoryModal(false)}/>
      )}

      <div style={{display:"flex", height:"100dvh", overflow:"hidden", background:C.bgApp, transition:"background .2s"}}>

        {/* ── DESKTOP ── */}
        {!isMobile && (
          <>
            {/* Left icon nav */}
            {!focusMode && (
              <NavSidebar tab={navTab} onTab={t=>{setNavTab(t);}} saving={saving} saveError={saveError} isDark={isDark} onToggleTheme={toggleTheme} onSignOut={signOut} userEmail={session.user.email} onHelp={()=>setShowHelpModal(true)} onOnboarding={()=>setShowOnboarding(true)}/>
            )}

            {/* Panel secundario izquierdo — guiones/personajes/notas/stats/búsqueda */}
            {!focusMode && navTab!=="editor" && navTab!=="corkboard" && (
              <div style={{
                width:240, background:C.bgPanel, borderRight:`1px solid ${C.border}`,
                display:"flex", flexDirection:"column", height:"100dvh", flexShrink:0,
              }}>
                <div style={{padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
                  <span style={{fontSize:9, fontWeight:700, color:C.textMuted,
                    textTransform:"uppercase", letterSpacing:1.5}}>
                    {{projects:"Guiones",characters:"Personajes",notes:"Notas",
                      stats:"Estadísticas",search:"Búsqueda"}[navTab]||"Panel"}
                  </span>
                </div>
                <div style={{flex:1, overflowY:"auto", padding:"10px 10px"}}>
                  <PanelContent tab={navTab} {...commonPanelProps} isMobile={false}/>
                </div>
              </div>
            )}

            {/* Center column */}
            <div style={{flex:1, display:"flex", flexDirection:"column", minWidth:0}}>
              {!focusMode && (
                <>
                  <Toolbar
                    activeType={blocks[activeIndex]?.type||T.ACTION}
                    onTypeChange={changeType}
                    onExport={()=>setShowExportModal(true)}
                    onExportFountain={()=>exportToFountain(blocks, project?.name||"Guion")}
                    onImport={()=>setShowImportModal(true)}
                    onHistory={()=>setShowHistoryModal(true)}
                    projectName={project?.name} saving={saving}
                    canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
                    focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}
                    isMobile={false}/>
                  {/* Script header */}
                  <div style={{padding:"8px 24px", background:C.bgApp,
                    borderBottom:`1px solid ${C.border}`,
                    display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", minHeight:36}}>
                    <h1 style={{margin:0, fontSize:18, fontWeight:600, color:C.textPrimary,
                      fontFamily:FONT_DISPLAY, letterSpacing:.2,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:320}}>
                      {project?.name}
                    </h1>
                    <span style={{fontSize:10, color:C.textMuted}}>
                      {words} palabras · ~{pages} pág · {scenes.length} esc
                    </span>
                    <div style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:6}}>
                      {saveError
                        ? <span title="Tus cambios están a salvo en este dispositivo y se sincronizarán al recuperar conexión"
                            style={{fontSize:9, color:C.red, display:"flex", alignItems:"center", gap:4, cursor:"default"}}>
                            <Icons.Saving/>Sin conexión · cambios guardados localmente
                          </span>
                        : saving
                        ? <span className="saving" style={{fontSize:9, color:C.textMuted, display:"flex", alignItems:"center", gap:4}}><Icons.Saving/>Guardando</span>
                        : <span className={justSaved ? "save-pulse" : undefined}
                            style={{fontSize:9, color:C.textFaint, display:"flex", alignItems:"center", gap:4}}>
                            <div style={{width:5, height:5, borderRadius:"50%",
                              background:justSaved?C.green:C.accent, opacity:justSaved?1:.5,
                              transition:"all .3s"}}/>Guardado
                          </span>
                      }
                    </div>
                  </div>
                </>
              )}

              {/* Focus mode exit */}
              {focusMode && (
                <div style={{position:"fixed", top:14, right:14, zIndex:500}}>
                  <Btn onClick={()=>setFocusMode(false)} variant="outline"
                    style={{fontSize:11, padding:"5px 12px", gap:6}}><Icons.Close style={{width:11,height:11}}/>Salir del foco</Btn>
                </div>
              )}

              {navTab==="corkboard" && !focusMode ? (
                <CorkboardView blocks={blocks} characterColors={characterColors}
                  onReorder={reorderScenes} onCardClick={i=>{scrollToBlock(i);setNavTab("editor");}}
                  onNoteChange={updateNote} isMobile={false} isDark={isDark}/>
              ) : editorContent}
            </div>

            {/* Panel derecho — ESCENAS siempre visible en desktop */}
            {!focusMode && navTab!=="corkboard" && (
              <div style={{
                width:200, background:C.bgPanel, borderLeft:`1px solid ${C.border}`,
                display:"flex", flexDirection:"column", height:"100dvh", flexShrink:0,
              }}>
                <div style={{padding:"14px 14px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0}}>
                  <span style={{fontSize:9, fontWeight:700, color:C.textMuted,
                    textTransform:"uppercase", letterSpacing:1.5}}>Escenas</span>
                </div>
                <div style={{flex:1, overflowY:"auto", padding:"8px 0"}}>
                  {scenes.length === 0 ? (
                    <div className="fade-in" style={{padding:"32px 14px", textAlign:"center"}}>
                      <div className="empty-float" style={{color:C.textFaint, marginBottom:8, opacity:.6}}>
                        <Icons.Scenes style={{width:20,height:20}}/>
                      </div>
                      <div style={{color:C.textFaint, fontSize:10.5, lineHeight:1.6}}>
                        Sin escenas aún
                      </div>
                    </div>
                  ) : scenes.map((s, i) => {
                    const isCurrent = i === currentSceneIdx;
                    return (
                    <div key={s.id} onClick={()=>scrollToBlock(s.index)}
                      style={{
                        padding:"7px 10px 7px 12px", margin:"0 6px 2px",
                        borderRadius:RADIUS.xs,
                        borderLeft:`2px solid ${isCurrent?C.accent:"transparent"}`,
                        background:isCurrent?`rgba(${hexToRgb(C.accent)},.14)`:"transparent",
                        cursor:"pointer", transition:"all .12s",
                      }}
                      onMouseEnter={e=>{if(!isCurrent)e.currentTarget.style.background=C.bgCard}}
                      onMouseLeave={e=>{if(!isCurrent)e.currentTarget.style.background="transparent"}}>
                      <div style={{fontSize:9, fontFamily:"'Courier Prime',monospace",
                        color:isCurrent?C.accent:C.textMuted,
                        fontWeight:isCurrent?700:400,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        paddingRight:10, letterSpacing:.3}}>
                        {s.text||"Sin título"}
                      </div>
                      <div style={{fontSize:8, color:isCurrent?C.accentWarm:C.textFaint, marginTop:2}}>
                        Esc. {i+1} · p.{Math.ceil((s.index+1)/2)}
                      </div>
                    </div>
                  );})}
                </div>
              </div>
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
                onExport={()=>setShowExportModal(true)}
                onExportFountain={()=>exportToFountain(blocks, project?.name||"Guion")}
                focusMode={focusMode} onFocusMode={()=>setFocusMode(v=>!v)}/>
            )}

            {/* Focus mode exit */}
            {focusMode && (
              <div style={{position:"fixed", top:14, right:14, zIndex:500}}>
                <Btn onClick={()=>setFocusMode(false)} variant="outline"
                  style={{fontSize:12, padding:"6px 14px", gap:6}}><Icons.Close style={{width:11,height:11}}/>Salir</Btn>
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
              }} saving={saving} isDark={isDark} onToggleTheme={toggleTheme} onHelp={()=>setShowHelpModal(true)}/>
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
