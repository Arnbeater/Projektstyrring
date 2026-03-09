import { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";

// ============================================================
// 🔧 FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDZhUQuARhX5Aa5vnoBDm04d_gVAOp1utg",
  authDomain: "phonic-realm-428209-k4.firebaseapp.com",
  projectId: "phonic-realm-428209-k4",
  storageBucket: "phonic-realm-428209-k4.firebasestorage.app",
  messagingSenderId: "804310335735",
  appId: "1:804310335735:web:6e5d1b3125d1f83cd7d3f2",
  measurementId: "G-0RJ085P851"
};

// ============================================================
// Firebase init
// ============================================================
const fb = initializeApp(firebaseConfig);
const fbAuth = getAuth(fb);
const fbDb = getFirestore(fb);

// ============================================================
// Constants
// ============================================================
const TC = ["#FF6B35","#4B8BF5","#34C77B","#F5C542","#A47BF5","#35D0BA","#F54B5E","#FF8FA3","#5EEAD4","#FBBF24"];
const STS = ["Ikke startet","I gang","Til review","Afsluttet"];
const SS = {
  "Ikke startet": { bg:"rgba(107,112,137,0.15)", c:"#6B7089", s:"Ny" },
  "I gang": { bg:"rgba(75,139,245,0.15)", c:"#4B8BF5", s:"Aktiv" },
  "Til review": { bg:"rgba(245,197,66,0.15)", c:"#F5C542", s:"Review" },
  "Afsluttet": { bg:"rgba(52,199,123,0.15)", c:"#34C77B", s:"✓" }
};
const PRI = ["Lav","Normal","Høj","Kritisk"];
const PC = { Lav:"#6B7089", Normal:"#4B8BF5", Høj:"#FF6B35", Kritisk:"#F54B5E" };
const DK = ["søn","man","tir","ons","tor","fre","lør"];
const MK = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

// Helpers
const toD = s => s ? new Date(s+"T00:00:00") : null;
const toS = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";
const td = () => toS(new Date());
const addD = (s,n) => { const d=toD(s); d.setDate(d.getDate()+n); return toS(d); };
const fmtD = s => { if(!s) return "—"; const d=toD(s); return `${d.getDate()}. ${MK[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDs = s => { if(!s) return ""; const d=toD(s); return `${d.getDate()} ${MK[d.getMonth()]}`; };
const isWe = s => { if(!s) return false; const d=toD(s).getDay(); return d===0||d===6; };
const weDays = (s,e) => { if(!s||!e) return 0; let c=s,n=0; while(c<=e){if(isWe(c))n++;c=addD(c,1)} return n; };

// ============================================================
// STYLES
// ============================================================
const css = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap');

:root {
  --bg:#0F1117; --surface:#181B25; --surface2:#1F2330; --surface3:#272B38;
  --border:#2A2E3D; --border-light:#353A4C;
  --text:#E8E9ED; --text-muted:#6B7089; --text-dim:#484D63;
  --accent:#FF6B35; --accent-soft:rgba(255,107,53,0.12); --accent-hover:#FF8255;
  --blue:#4B8BF5; --green:#34C77B; --yellow:#F5C542; --red:#F54B5E;
  --font-display:'Sora',system-ui,sans-serif;
  --font-mono:'JetBrains Mono',monospace;
}
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:var(--font-display); background:var(--bg); color:var(--text); }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-thumb { background:var(--border-light); border-radius:3px; }

.btn { font-family:var(--font-display); border:none; cursor:pointer; font-size:12px; font-weight:500; border-radius:6px; transition:all 0.12s; padding:7px 14px; white-space:nowrap; }
.btn-dark { background:var(--surface3); color:var(--text-muted); border:1px solid var(--border); }
.btn-dark:hover { color:var(--text); border-color:var(--border-light); }
.btn-dark.active { background:var(--accent-soft); color:var(--accent); border-color:var(--accent); }
.btn-accent { background:var(--accent); color:#FFF; border:none; }
.btn-accent:hover { background:var(--accent-hover); }
.btn-sm { padding:4px 10px; font-size:11px; }
.btn-danger { background:rgba(245,75,94,0.12); color:var(--red); border:none; }

.fl-input, .fl-select, .fl-textarea {
  width:100%; background:var(--surface2); border:1px solid var(--border);
  border-radius:6px; padding:9px 11px; font-size:13px; color:var(--text);
  font-family:var(--font-display); outline:none; transition:border-color 0.12s;
}
.fl-input:focus, .fl-select:focus, .fl-textarea:focus { border-color:var(--accent); }
.fl-textarea { resize:vertical; min-height:80px; }

input[type=range] { -webkit-appearance:none; width:100%; height:6px; background:var(--surface3); border-radius:3px; outline:none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:var(--accent); cursor:pointer; border:2px solid var(--bg); }

@keyframes slideIn { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
`;

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, error, loading }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>
      <div style={{ width:400, maxWidth:"90vw" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:64, height:64, borderRadius:16,
            background:"var(--accent-soft)", marginBottom:16,
            fontSize:24, fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)"
          }}>PM</div>
          <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.02em", color:"var(--text)" }}>Projektstyring</h1>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginTop:6 }}>Log ind for at se dine projekter</p>
        </div>
        
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24 }}>
          {error && (
            <div style={{
              background:"rgba(245,75,94,0.1)", border:"1px solid rgba(245,75,94,0.2)",
              borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--red)"
            }}>{error}</div>
          )}
          
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Email</label>
            <input className="fl-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="din@email.dk"
              onKeyDown={e => e.key === "Enter" && onLogin(email, pass)} />
          </div>
          
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>Adgangskode</label>
            <input className="fl-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && onLogin(email, pass)} />
          </div>
          
          <button className="btn btn-accent" style={{ width:"100%", padding:"10px 14px", fontSize:14 }}
            onClick={() => onLogin(email, pass)} disabled={loading}>
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </div>
        
        <p style={{ textAlign:"center", fontSize:11, color:"var(--text-dim)", marginTop:16 }}>
          Kontakt din administrator for at få en konto
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DEMO / OFFLINE MODE (when Firebase not configured)
// ============================================================
function useDemoMode() {
  const isDemo = firebaseConfig.apiKey === "DIN_API_KEY";
  return isDemo;
}

// ============================================================
// MAIN APP — Multi-project wrapper
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const isDemo = useDemoMode();

  // Multi-project state
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // Init auth
  useEffect(() => {
    if (isDemo) {
      setUser({ email: "demo@lokal", displayName: "Demo (lokal)" });
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(fbAuth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Load projects list
  useEffect(() => {
    if (!user || isDemo) return;
    const q = query(collection(fbDb, "projects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(list);
    });
    return () => unsub();
  }, [user, isDemo]);

  // Demo mode: load from localStorage
  useEffect(() => {
    if (isDemo && user) {
      try {
        const d = JSON.parse(localStorage.getItem("pm5_projects"));
        if (d) setProjects(d);
      } catch(e) {}
    }
  }, [isDemo, user]);

  useEffect(() => {
    if (isDemo && user && projects.length > 0) {
      try { localStorage.setItem("pm5_projects", JSON.stringify(projects)); } catch(e) {}
    }
  }, [projects, isDemo, user]);

  async function handleLogin(email, pass) {
    if (isDemo) { setUser({ email, displayName: email }); return; }
    setLoginLoading(true); setAuthError("");
    try {
      await signInWithEmailAndPassword(fbAuth, email, pass);
    } catch(e) {
      const msgs = {
        "auth/user-not-found": "Bruger ikke fundet",
        "auth/wrong-password": "Forkert adgangskode",
        "auth/invalid-email": "Ugyldig email",
        "auth/invalid-credential": "Forkert email eller adgangskode",
        "auth/too-many-requests": "For mange forsøg, prøv igen senere"
      };
      setAuthError(msgs[e.code] || `Fejl: ${e.message}`);
    }
    setLoginLoading(false);
  }

  async function handleLogout() {
    if (isDemo) { setUser(null); setActiveProjectId(null); return; }
    await signOut(fbAuth);
    setActiveProjectId(null);
  }

  async function createProject(name) {
    const proj = {
      projectName: name || "Nyt Projekt",
      tasks: [],
      milestones: [],
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "",
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || ""
    };
    if (isDemo) {
      const id = "p" + Date.now();
      setProjects(prev => [{ id, ...proj }, ...prev]);
      setActiveProjectId(id);
    } else {
      const ref = await addDoc(collection(fbDb, "projects"), proj);
      setActiveProjectId(ref.id);
    }
    setShowNewProject(false);
  }

  async function deleteProject(id) {
    if (isDemo) {
      setProjects(prev => prev.filter(p => p.id !== id));
    } else {
      await deleteDoc(doc(fbDb, "projects", id));
    }
    if (activeProjectId === id) setActiveProjectId(null);
  }

  // Loading
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#0F1117", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{css}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:32, fontFamily:"var(--font-mono)", fontWeight:700, color:"#FF6B35", animation:"pulse 1.5s infinite" }}>PM</div>
        <div style={{ fontSize:12, color:"#6B7089", marginTop:8 }}>Indlæser...</div>
      </div>
    </div>
  );

  // Login
  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} loading={loginLoading} />;

  // Project view
  if (activeProjectId) {
    return <ProjectView
      projectId={activeProjectId}
      user={user}
      isDemo={isDemo}
      projects={projects}
      setProjects={setProjects}
      onBack={() => { setActiveProjectId(null); }}
      onLogout={handleLogout}
    />;
  }

  // Project list
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>Projektstyring</div>
            <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:"-0.02em" }}>Dine projekter</h1>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ width:28, height:28, borderRadius:6, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"var(--accent)" }}>
              {(user.email || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>{user.email}</span>
            <button className="btn btn-dark btn-sm" onClick={handleLogout}>Log ud</button>
          </div>
        </div>

        {isDemo && (
          <div style={{ marginBottom:20, padding:"8px 14px", background:"rgba(245,197,66,0.1)", border:"1px solid rgba(245,197,66,0.2)", borderRadius:8, fontSize:11, color:"var(--yellow)" }}>
            ⚠ Demo-tilstand: Data gemmes kun lokalt.
          </div>
        )}

        {/* New project button */}
        <button className="btn btn-accent" style={{ marginBottom:24, padding:"10px 20px", fontSize:14 }} onClick={() => setShowNewProject(true)}>
          + Nyt projekt
        </button>

        {/* Project cards */}
        {projects.length === 0 ? (
          <Empty icon="📁" title="Ingen projekter endnu" sub="Opret dit første projekt for at komme i gang" />
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
            {projects.map(p => {
              const taskCount = (p.tasks || []).length;
              const doneCount = (p.tasks || []).filter(t => t.status === "Afsluttet").length;
              const msCount = (p.milestones || []).length;
              const pct = taskCount > 0 ? Math.round(doneCount / taskCount * 100) : 0;
              return (
                <div key={p.id} onClick={() => setActiveProjectId(p.id)}
                  style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:20, cursor:"pointer", transition:"all 0.15s", position:"relative" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-light)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{p.projectName || "Uden navn"}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:12 }}>
                    {taskCount} opgave{taskCount !== 1 ? "r" : ""} · {msCount} milepæl{msCount !== 1 ? "e" : ""}
                    {p.createdBy && <> · af {p.createdBy}</>}
                  </div>
                  {taskCount > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <div style={{ flex:1, height:4, background:"var(--surface3)", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:"var(--accent)", borderRadius:2, transition:"width 0.3s" }} />
                      </div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", fontWeight:600 }}>{pct}%</span>
                    </div>
                  )}
                  <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>
                    Opdateret {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("da-DK") : "—"}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); if(confirm("Slet dette projekt?")) deleteProject(p.id); }}
                    style={{ position:"absolute", top:12, right:12, fontSize:10, padding:"2px 8px" }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New project modal */}
      {showNewProject && <NewProjectModal onCreate={createProject} onClose={() => setShowNewProject(false)} />}
    </div>
  );
}

// ============================================================
// NEW PROJECT MODAL
// ============================================================
function NewProjectModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:420, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Nyt projekt</div>
        <Field label="Projektnavn">
          <input ref={ref} className="fl-input" value={name} onChange={e => setName(e.target.value)} placeholder="Hvad hedder projektet?"
            onKeyDown={e => e.key === "Enter" && onCreate(name)} />
        </Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={() => onCreate(name)}>Opret</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROJECT VIEW — Single project (existing logic)
// ============================================================
function ProjectView({ projectId, user, isDemo, projects, setProjects, onBack, onLogout }) {
  const [projectName, setProjectName] = useState("Nyt Projekt");
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [view, setView] = useState("gantt");
  const [selTask, setSelTask] = useState(null);
  const [selMs, setSelMs] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMs, setShowAddMs] = useState(false);

  // Load project data
  useEffect(() => {
    if (isDemo) {
      const p = projects.find(x => x.id === projectId);
      if (p) {
        setProjectName(p.projectName || "Nyt Projekt");
        setTasks(p.tasks || []);
        setMilestones(p.milestones || []);
      }
      return;
    }
    const ref = doc(fbDb, "projects", projectId);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProjectName(data.projectName || "Nyt Projekt");
        setTasks(data.tasks || []);
        setMilestones(data.milestones || []);
      }
    });
    return () => unsub();
  }, [projectId]);

  // Save
  async function saveProject(newTasks, newMilestones, newName) {
    const data = {
      projectName: newName ?? projectName,
      tasks: newTasks ?? tasks,
      milestones: newMilestones ?? milestones,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || "unknown"
    };
    if (isDemo) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p));
    } else {
      const ref = doc(fbDb, "projects", projectId);
      await setDoc(ref, data, { merge: true });
    }
  }

  function updateTasks(fn) {
    setTasks(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      saveProject(next, null, null);
      return next;
    });
  }
  function updateMilestones(fn) {
    setMilestones(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      saveProject(null, next, null);
      return next;
    });
  }
  function updateProjectName(name) {
    setProjectName(name);
    saveProject(null, null, name);
  }

  function addTask(name, start, end, desc) {
    updateTasks(prev => [...prev, {
      id: Date.now(), name: name || "Ny opgave", start: start || td(), end: end || addD(td(),7),
      status: "Ikke startet", priority: "Normal", owner: "", desc: desc || "",
      progress: 0, color: TC[tasks.length % TC.length], createdBy: user?.email || ""
    }]);
    setShowAddTask(false);
  }
  function updTask(id, field, value) {
    updateTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  }
  function delTask(id) {
    updateTasks(prev => prev.filter(t => t.id !== id));
    setSelTask(null);
  }
  function addMilestone(name, date) {
    updateMilestones(prev => [...prev, {
      id: Date.now(), name: name || "Milepæl", date: date || td(), desc: "", color: "#F5C542"
    }]);
    setShowAddMs(false);
  }
  function updMs(id, field, value) {
    updateMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }
  function delMs(id) {
    updateMilestones(prev => prev.filter(m => m.id !== id));
    setSelMs(null);
  }

  // Drag
  const dragRef = useRef({ dragId:null, overId:null, pos:null });
  function handleDragStart(e, id) { dragRef.current.dragId = id; e.dataTransfer.effectAllowed = "move"; }
  function handleDragOver(e, id) {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    dragRef.current.overId = id;
    dragRef.current.pos = e.clientY < r.top + r.height/2 ? "top" : "bottom";
  }
  function handleDragEnd() {
    const { dragId, overId, pos } = dragRef.current;
    if (dragId != null && overId != null && dragId !== overId) {
      updateTasks(prev => {
        const arr = [...prev];
        const fi = arr.findIndex(t => t.id === dragId);
        const [task] = arr.splice(fi, 1);
        let ins = arr.findIndex(t => t.id === overId);
        if (pos === "bottom") ins++;
        arr.splice(ins, 0, task);
        return arr;
      });
    }
    dragRef.current = { dragId:null, overId:null, pos:null };
  }

  function ganttRange() {
    const a = [];
    tasks.forEach(t => { if(t.start) a.push(t.start); if(t.end) a.push(t.end); });
    milestones.forEach(m => { if(m.date) a.push(m.date); });
    if (!a.length) { const t = td(); return { s: addD(t,-3), e: addD(t,30) }; }
    a.sort();
    return { s: addD(a[0], -3), e: addD(a[a.length-1], 5) };
  }
  function daysArr(s, e) { const d = []; let c = s; while(c <= e) { d.push(c); c = addD(c,1); } return d; }

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") {
        if (showAddTask) setShowAddTask(false);
        else if (showAddMs) setShowAddMs(false);
        else { setSelTask(null); setSelMs(null); }
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [showAddTask, showAddMs]);

  const tk = td();
  const tot = tasks.length;
  const don = tasks.filter(t => t.status === "Afsluttet").length;
  const inp = tasks.filter(t => t.status === "I gang").length;
  const ov = tasks.filter(t => t.end < tk && t.status !== "Afsluttet").length;
  const selTaskObj = selTask != null ? tasks.find(t => t.id === selTask) : null;
  const selMsObj = selMs != null ? milestones.find(m => m.id === selMs) : null;
  const rng = ganttRange();
  const days = daysArr(rng.s, rng.e);
  const dw = 40;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", fontFamily:"var(--font-display)" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"12px 24px", flexShrink:0, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,107,53,0.04) 0%,transparent 50%,rgba(75,139,245,0.03) 100%)", pointerEvents:"none" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", zIndex:1, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button className="btn btn-dark btn-sm" onClick={onBack} style={{ padding:"5px 10px" }}>← Projekter</button>
            <input value={projectName} onChange={e => updateProjectName(e.target.value)} spellCheck={false}
              style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:20, fontWeight:600, letterSpacing:"-0.02em", outline:"none", fontFamily:"var(--font-display)", borderBottom:"1px dashed var(--border)", paddingBottom:2, width:280 }} />
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <button className={`btn btn-dark ${view==="gantt"?"active":""}`} onClick={()=>{setView("gantt");setSelTask(null);setSelMs(null)}}>◧ Gantt</button>
            <button className={`btn btn-dark ${view==="timeline"?"active":""}`} onClick={()=>{setView("timeline");setSelTask(null);setSelMs(null)}}>▤ Tidslinje</button>
            <button className={`btn btn-dark ${view==="list"?"active":""}`} onClick={()=>{setView("list");setSelTask(null);setSelMs(null)}}>☰ Opgaver</button>
            <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"var(--accent)" }}>
                {(user.email || "?")[0].toUpperCase()}
              </div>
              <span style={{ fontSize:11, color:"var(--text-muted)", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</span>
              <button className="btn btn-dark btn-sm" onClick={onLogout}>Log ud</button>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"8px 24px", display:"flex", gap:10, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
        <button className="btn btn-accent btn-sm" onClick={()=>setShowAddTask(true)}>+ Opgave</button>
        <button className="btn btn-dark btn-sm" onClick={()=>setShowAddMs(true)}>◆ Milepæl</button>
        <div style={{ width:1, height:24, background:"var(--border)", margin:"0 4px" }} />
        <Stat label="Opgaver" value={tot} />
        <Stat label="Afsluttet" value={don} color="var(--green)" />
        <Stat label="I gang" value={inp} color="var(--blue)" />
        {ov > 0 && <Stat label="Forsinket" value={ov} color="var(--red)" />}
        {tot > 0 && <div style={{ marginLeft:"auto", fontFamily:"var(--font-mono)", fontSize:11, padding:"4px 10px", borderRadius:4, background:"var(--surface3)" }}>
          <span style={{ color:"var(--text-muted)" }}>Fremgang </span>
          <span style={{ fontWeight:700, color:"var(--accent)" }}>{Math.round(don/tot*100)}%</span>
        </div>}
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"auto" }}>

          {/* GANTT VIEW */}
          {view === "gantt" && (
            tasks.length === 0 && milestones.length === 0 ? (
              <Empty icon="◧" title="Ingen opgaver endnu" sub="Tilføj din første opgave for at se Gantt-diagrammet" />
            ) : (
              <div style={{ display:"flex", minHeight:"100%" }}>
                {/* Sidebar */}
                <div style={{ width:300, minWidth:300, background:"var(--surface)", borderRight:"1px solid var(--border)", flexShrink:0, position:"sticky", left:0, zIndex:10 }}>
                  <div style={{ height:56, display:"flex", alignItems:"center", padding:"0 16px", borderBottom:"1px solid var(--border)", fontSize:11, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--text-muted)", background:"var(--surface2)", gap:6 }}>
                    Opgaver <span style={{ fontWeight:400, letterSpacing:0, textTransform:"none", color:"var(--text-dim)", fontSize:10 }}>· træk ⠿</span>
                  </div>
                  {tasks.map(t => {
                    const ss = SS[t.status];
                    return (
                      <div key={t.id} draggable onDragStart={e=>handleDragStart(e,t.id)} onDragEnd={handleDragEnd} onDragOver={e=>handleDragOver(e,t.id)}
                        onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                        style={{ height:44, display:"flex", alignItems:"center", padding:"0 8px 0 4px", gap:6, borderBottom:"1px solid var(--border)", cursor:"pointer", background:selTask===t.id?"var(--accent-soft)":"transparent", transition:"background 0.1s" }}>
                        <span style={{ cursor:"grab", color:"var(--text-dim)", fontSize:11, padding:"6px 3px", fontFamily:"var(--font-mono)" }}>⠿</span>
                        <div style={{ width:10, height:10, borderRadius:3, background:t.color, flexShrink:0 }} />
                        <div style={{ flex:1, fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</div>
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:3, background:ss.bg, color:ss.c, textTransform:"uppercase" }}>{ss.s}</div>
                      </div>
                    );
                  })}
                  {milestones.map(m => (
                    <div key={m.id} onClick={()=>{setSelMs(m.id);setSelTask(null)}}
                      style={{ height:36, display:"flex", alignItems:"center", padding:"0 12px 0 28px", gap:6, borderBottom:"1px solid var(--border)", fontSize:11, color:"var(--yellow)", fontWeight:500, cursor:"pointer" }}>
                      <span>◆</span>
                      <span style={{ flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.name}</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)" }}>{fmtDs(m.date)}</span>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div style={{ flex:1, position:"relative" }}>
                  {/* Day headers */}
                  <div style={{ height:56, display:"flex", borderBottom:"1px solid var(--border)", background:"var(--surface2)", position:"sticky", top:0, zIndex:5 }}>
                    {days.map((day,i) => {
                      const d = toD(day), dow = d.getDay(), we = dow===0||dow===6, isT = day===tk;
                      let ml = ""; if (i===0 || toD(days[i-1]).getMonth() !== d.getMonth()) ml = MK[d.getMonth()].toUpperCase();
                      return (
                        <div key={day} style={{ minWidth:dw, width:dw, height:56, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid var(--border)", fontSize:10, color:"var(--text-muted)", position:"relative", background: isT?"var(--accent-soft)":we?"rgba(255,255,255,0.015)":"transparent" }}>
                          {ml && <div style={{ position:"absolute", top:2, left:4, fontSize:8, fontWeight:700, color:"var(--accent)", letterSpacing:"0.1em" }}>{ml}</div>}
                          <div style={{ fontWeight:600, fontSize:12, color:"var(--text)" }}>{d.getDate()}</div>
                          <div style={{ fontSize:9, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase" }}>{DK[dow]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Body */}
                  <div style={{ position:"relative" }}>
                    {/* Today line */}
                    {days.indexOf(tk) >= 0 && (
                      <div style={{ position:"absolute", top:0, bottom:0, width:2, background:"var(--accent)", zIndex:4, pointerEvents:"none", left: days.indexOf(tk)*dw+dw/2 }}>
                        <div style={{ position:"absolute", top:-18, left:-14, fontSize:7, fontWeight:700, letterSpacing:"0.1em", color:"var(--accent)", fontFamily:"var(--font-mono)" }}>I DAG</div>
                      </div>
                    )}

                    {/* Task rows */}
                    {tasks.map(t => {
                      const si = days.indexOf(t.start), ei = days.indexOf(t.end);
                      return (
                        <div key={t.id} style={{ height:44, display:"flex", position:"relative", borderBottom:"1px solid var(--border)" }}>
                          {days.map(day => {
                            const d = toD(day), we = d.getDay()===0||d.getDay()===6;
                            return <div key={day} style={{ minWidth:dw, width:dw, height:44, borderRight:"1px solid rgba(42,46,61,0.5)", background:we?"rgba(255,255,255,0.01)":"transparent" }} />;
                          })}
                          {si >= 0 && ei >= 0 && (
                            <div onClick={()=>{setSelTask(t.id);setSelMs(null)}}
                              style={{ position:"absolute", height:24, top:10, left:si*dw+2, width:Math.max((ei-si+1)*dw-4,20), borderRadius:5, display:"flex", alignItems:"center", padding:"0 8px", fontSize:10, fontWeight:600, color:"#FFF", cursor:"pointer", background:t.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", zIndex:2, transition:"filter 0.12s" }}>
                              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${t.progress}%`, borderRadius:5, opacity:0.25, background:"#FFF" }} />
                              <span style={{ position:"relative", zIndex:1 }}>{t.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Milestone rows */}
                    {milestones.map(m => {
                      const mi = days.indexOf(m.date);
                      return (
                        <div key={m.id} style={{ height:36, display:"flex", position:"relative", borderBottom:"1px solid var(--border)" }}>
                          {days.map(day => <div key={day} style={{ minWidth:dw, width:dw, height:36, borderRight:"1px solid rgba(42,46,61,0.5)" }} />)}
                          {mi >= 0 && <div onClick={()=>{setSelMs(m.id);setSelTask(null)}} style={{ position:"absolute", top:9, left:mi*dw+dw/2-8, width:16, height:16, transform:"rotate(45deg)", borderRadius:3, background:m.color, zIndex:3, cursor:"pointer" }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}

          {/* TIMELINE VIEW */}
          {view === "timeline" && <TimelineView tasks={tasks} milestones={milestones} onSelTask={id=>{setSelTask(id);setSelMs(null)}} onSelMs={id=>{setSelMs(id);setSelTask(null)}} />}

          {/* LIST VIEW */}
          {view === "list" && <ListView tasks={tasks} tk={tk} onSelTask={id=>{setSelTask(id);setSelMs(null)}} />}
        </div>

        {/* DETAIL PANEL */}
        {selTaskObj && (
          <DetailTask task={selTaskObj} onUpdate={updTask} onDelete={delTask} onClose={()=>setSelTask(null)} />
        )}
        {selMsObj && (
          <DetailMs ms={selMsObj} onUpdate={updMs} onDelete={delMs} onClose={()=>setSelMs(null)} />
        )}
      </div>

      {/* MODALS */}
      {showAddTask && <AddTaskModal onAdd={addTask} onClose={()=>setShowAddTask(false)} />}
      {showAddMs && <AddMsModal onAdd={addMilestone} onClose={()=>setShowAddMs(false)} />}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function Stat({ label, value, color }) {
  return (
    <div style={{ fontFamily:"var(--font-mono)", fontSize:11, padding:"4px 10px", borderRadius:4, display:"flex", alignItems:"center", gap:5, background: color ? color.replace(")",",0.12)").replace("var(","rgba(").replace("--green","52,199,123").replace("--blue","75,139,245").replace("--red","245,75,94") : "var(--surface3)" }}>
      {color && <div style={{ width:6, height:6, borderRadius:"50%", background:color }} />}
      <span style={{ color: color || "var(--text-muted)" }}>{label} {value}</span>
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", color:"var(--text-dim)" }}>
      <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:18, fontWeight:600, color:"var(--text-muted)" }}>{title}</div>
      <div style={{ fontSize:13, marginTop:4 }}>{sub}</div>
    </div>
  );
}

function TimelineView({ tasks, milestones, onSelTask, onSelMs }) {
  const items = [
    ...tasks.map(t => ({ tp:"t", d:t.start, o:t })),
    ...milestones.map(m => ({ tp:"m", d:m.date, o:m }))
  ].sort((a,b) => (a.d||"").localeCompare(b.d||""));

  if (!items.length) return <Empty icon="▤" title="Tom tidslinje" sub="Tilføj opgaver og milepæle" />;

  return (
    <div style={{ padding:24, maxWidth:800 }}>
      <div style={{ fontSize:24, fontWeight:600, marginBottom:20, letterSpacing:"-0.02em" }}>Tidslinje</div>
      <div style={{ position:"relative", paddingLeft:32, borderLeft:"2px solid var(--border)", marginLeft:12 }}>
        {items.map((it, i) => {
          if (it.tp === "m") {
            const m = it.o, mwe = isWe(m.date);
            return (
              <div key={m.id} style={{ position:"relative", marginBottom:20 }}>
                <div style={{ position:"absolute", left:-39, top:4, width:14, height:14, borderRadius:"50%", border:"2px solid var(--bg)", background:m.color }} />
                <div onClick={()=>onSelMs(m.id)} style={{ background:"rgba(245,197,66,0.08)", border:"1px solid rgba(245,197,66,0.3)", borderRadius:8, padding:"14px 16px", cursor:"pointer" }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                    ◆ MILEPÆL · {fmtD(m.date)}{mwe && <span style={{ fontFamily:"var(--font-mono)", fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:"rgba(255,255,255,0.05)", color:"var(--text-dim)", marginLeft:4 }}>WEEKEND</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--yellow)" }}>{m.name}</div>
                  {m.desc && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6, paddingTop:6, borderTop:"1px solid var(--border)", whiteSpace:"pre-wrap" }}>{m.desc}</div>}
                </div>
              </div>
            );
          }
          const t = it.o, ss = SS[t.status], wd = weDays(t.start, t.end), swe = isWe(t.start), ewe = isWe(t.end);
          const dur = t.start && t.end ? Math.max(1, Math.round((toD(t.end)-toD(t.start))/86400000)+1) : 0;
          return (
            <div key={t.id} style={{ position:"relative", marginBottom:20 }}>
              <div style={{ position:"absolute", left:-39, top:4, width:14, height:14, borderRadius:"50%", border:"2px solid var(--bg)", background:t.color }} />
              <div onClick={()=>onSelTask(t.id)} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"14px 16px", cursor:"pointer", transition:"border-color 0.15s" }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", marginBottom:4 }}>
                  {fmtD(t.start)}{swe && <WeTag />} → {fmtD(t.end)}{ewe && <WeTag />}
                </div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{t.name}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ background:ss.bg, color:ss.c, padding:"2px 8px", borderRadius:3, fontSize:10, fontWeight:600 }}>{t.status}</span>
                  {t.owner && <span>· {t.owner}</span>}
                  <span>· {t.progress}%</span>
                </div>
                {wd > 0 && <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)", marginTop:6, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--text-dim)", opacity:0.5 }} />
                  Inkl. {wd} weekenddag{wd>1?"e":""} af {dur} dage total
                </div>}
                {t.desc && <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6, paddingTop:6, borderTop:"1px solid var(--border)", whiteSpace:"pre-wrap" }}>{t.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeTag() {
  return <span style={{ fontFamily:"var(--font-mono)", fontSize:8, fontWeight:600, padding:"1px 5px", borderRadius:3, background:"rgba(255,255,255,0.05)", color:"var(--text-dim)", marginLeft:4 }}>WEEKEND</span>;
}

function ListView({ tasks, tk, onSelTask }) {
  if (!tasks.length) return <Empty icon="☰" title="Ingen opgaver" sub="Klik &quot;+ Opgave&quot; for at komme i gang" />;
  return (
    <div style={{ padding:"20px 24px" }}>
      {STS.map(status => {
        const filtered = tasks.filter(t => t.status === status);
        if (!filtered.length) return null;
        const ss = SS[status];
        return (
          <div key={status} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:ss.c }} />
              <span style={{ fontSize:13, fontWeight:600, color:ss.c }}>{status}</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-dim)" }}>{filtered.length}</span>
            </div>
            {filtered.map(t => {
              const isOv = t.end < tk && t.status !== "Afsluttet";
              return (
                <div key={t.id} onClick={()=>onSelTask(t.id)}
                  style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 16px", marginBottom:6, display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"border-color 0.12s" }}>
                  <div style={{ width:4, height:32, borderRadius:2, background:t.color, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>{fmtDs(t.start)} → {fmtDs(t.end)}{t.owner && ` · ${t.owner}`}</div>
                    {t.desc && <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:300 }}>{t.desc}</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    {isOv && <span style={{ fontSize:9, fontWeight:700, color:"var(--red)", fontFamily:"var(--font-mono)" }}>FORSINKET</span>}
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:600, color:PC[t.priority] }}>{t.priority}</span>
                    <div style={{ width:48, height:6, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${t.progress}%`, height:"100%", background:t.color, borderRadius:3 }} />
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)" }}>{t.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DetailTask({ task: t, onUpdate, onDelete, onClose }) {
  const ss = SS[t.status];
  const wd = weDays(t.start, t.end);
  const dur = t.start && t.end ? Math.max(1, Math.round((toD(t.end)-toD(t.start))/86400000)+1) : 0;
  // Use local state for text fields to prevent cursor jumping
  const [name, setName] = useState(t.name);
  const [desc, setDesc] = useState(t.desc);
  const [owner, setOwner] = useState(t.owner);
  // Sync when a different task is selected
  useEffect(() => { setName(t.name); setDesc(t.desc); setOwner(t.owner); }, [t.id]);

  return (
    <div style={{ width:460, minWidth:460, background:"var(--surface)", borderLeft:"1px solid var(--border)", overflowY:"auto", flexShrink:0, animation:"slideIn 0.2s ease" }}>
      <div style={{ padding:20, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:t.color }} />
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)" }}>Rediger opgave</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn btn-danger btn-sm" onClick={()=>onDelete(t.id)}>Slet</button>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <Field label="Opgavenavn">
          <input className="fl-input" style={{ fontSize:15, fontWeight:600 }} value={name} onChange={e=>{setName(e.target.value);onUpdate(t.id,"name",e.target.value)}} />
        </Field>
        <Field label="Kort beskrivelse">
          <textarea className="fl-textarea" placeholder="Beskriv opgavens indhold, formål og leverancer..." value={desc} onChange={e=>{setDesc(e.target.value);onUpdate(t.id,"desc",e.target.value)}} />
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Status">
            <select className="fl-select" style={{ borderColor:ss.c, borderWidth:2 }} value={t.status} onChange={e=>onUpdate(t.id,"status",e.target.value)}>
              {STS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Prioritet">
            <select className="fl-select" style={{ borderColor:PC[t.priority], borderWidth:2 }} value={t.priority} onChange={e=>onUpdate(t.id,"priority",e.target.value)}>
              {PRI.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Startdato"><input type="date" className="fl-input" value={t.start} onChange={e=>onUpdate(t.id,"start",e.target.value)} /></Field>
          <Field label="Slutdato"><input type="date" className="fl-input" value={t.end} onChange={e=>onUpdate(t.id,"end",e.target.value)} /></Field>
        </div>
        <Field label="Ansvarlig">
          <input className="fl-input" value={owner} onChange={e=>{setOwner(e.target.value);onUpdate(t.id,"owner",e.target.value)}} placeholder="Hvem har opgaven?" />
        </Field>
        <Field label={<>Fremgang — <span style={{ color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{t.progress}%</span></>}>
          <input type="range" min={0} max={100} step={5} value={t.progress} style={{ accentColor:t.color }} onChange={e=>onUpdate(t.id,"progress",parseInt(e.target.value))} />
        </Field>
        <Field label="Farve">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {TC.map(c => <div key={c} onClick={()=>onUpdate(t.id,"color",c)} style={{ width:28, height:28, borderRadius:6, background:c, cursor:"pointer", border:`2px solid ${t.color===c?"#FFF":"transparent"}`, transition:"all 0.12s" }} />)}
          </div>
        </Field>
        <div style={{ marginTop:8, paddingTop:14, borderTop:"1px solid var(--border)", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-dim)" }}>
          Varighed: {dur} dage{wd > 0 && ` · heraf ${wd} weekenddag${wd>1?"e":""}`}
          {t.createdBy && <> · oprettet af {t.createdBy}</>}
        </div>
      </div>
    </div>
  );
}

function DetailMs({ ms: m, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState(m.name);
  const [desc, setDesc] = useState(m.desc);
  useEffect(() => { setName(m.name); setDesc(m.desc); }, [m.id]);

  return (
    <div style={{ width:460, minWidth:460, background:"var(--surface)", borderLeft:"1px solid var(--border)", overflowY:"auto", flexShrink:0, animation:"slideIn 0.2s ease" }}>
      <div style={{ padding:20, borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ color:"var(--yellow)", fontSize:14 }}>◆</span>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)" }}>Rediger milepæl</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn btn-danger btn-sm" onClick={()=>onDelete(m.id)}>Slet</button>
          <button className="btn btn-dark btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <Field label="Milepælsnavn">
          <input className="fl-input" style={{ fontSize:15, fontWeight:600 }} value={name} onChange={e=>{setName(e.target.value);onUpdate(m.id,"name",e.target.value)}} />
        </Field>
        <Field label="Dato">
          <input type="date" className="fl-input" value={m.date} onChange={e=>onUpdate(m.id,"date",e.target.value)} />
        </Field>
        <Field label="Beskrivelse">
          <textarea className="fl-textarea" placeholder="Beskriv milepælen..." value={desc} onChange={e=>{setDesc(e.target.value);onUpdate(m.id,"desc",e.target.value)}} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function AddTaskModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState(td());
  const [end, setEnd] = useState(addD(td(),7));
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:460, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Ny opgave</div>
        <Field label="Opgavenavn"><input ref={ref} className="fl-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Hvad skal laves?" onKeyDown={e=>e.key==="Enter"&&onAdd(name,start,end,desc)} /></Field>
        <Field label="Kort beskrivelse"><textarea className="fl-textarea" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Beskriv opgaven..." rows={2} /></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <Field label="Start"><input type="date" className="fl-input" value={start} onChange={e=>setStart(e.target.value)} /></Field>
          <Field label="Slut"><input type="date" className="fl-input" value={end} onChange={e=>setEnd(e.target.value)} /></Field>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={()=>onAdd(name,start,end,desc)}>Tilføj</button>
        </div>
      </div>
    </div>
  );
}

function AddMsModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(td());
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, width:460, maxWidth:"90vw", boxShadow:"0 4px 24px rgba(0,0,0,0.3)", animation:"slideUp 0.2s ease" }}>
        <div style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Ny milepæl</div>
        <Field label="Milepælsnavn"><input ref={ref} className="fl-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Hvad markerer denne milepæl?" onKeyDown={e=>e.key==="Enter"&&onAdd(name,date)} /></Field>
        <Field label="Dato"><input type="date" className="fl-input" value={date} onChange={e=>setDate(e.target.value)} /></Field>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button className="btn btn-dark" onClick={onClose}>Annuller</button>
          <button className="btn btn-accent" onClick={()=>onAdd(name,date)}>Tilføj</button>
        </div>
      </div>
    </div>
  );
}
