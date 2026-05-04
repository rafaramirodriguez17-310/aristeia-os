import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

// ── Themes ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#0F0F0F", card:"#1A1A1A", card2:"#222222", card3:"#2A2A2A",
  accent:"#FFD700", accentDim:"#FFD70020",
  text:"#F0EDE4", muted:"#666", mutedLt:"#444",
  border:"#2A2A2A", inputBg:"#1E1E1E",
  green:"#4ADE80", red:"#F87171", blue:"#60A5FA", purple:"#C084FC", orange:"#FB923C",
  shadow:"0 0 0 1px #2A2A2A",
};
const LIGHT = {
  bg:"#F0EDE4", card:"#FFFFFF", card2:"#F8F6F1", card3:"#EDE9E0",
  accent:"#B89300", accentDim:"#B8930015",
  text:"#111111", muted:"#888", mutedLt:"#CCC",
  border:"#E5E1D6", inputBg:"#F5F2EA",
  green:"#16A34A", red:"#DC2626", blue:"#1D4ED8", purple:"#7C3AED", orange:"#EA580C",
  shadow:"0 1px 4px rgba(0,0,0,0.08)",
};

// ── Training Plans ────────────────────────────────────────────────────────────
const PLANS = {
  "Hipertrofia": { Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core", Vie:"Upper (Compuesto)", Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  "Fuerza":      { Lun:"Squat Heavy", Mar:"Press Banca Heavy", Mié:"Descanso activo", Jue:"Peso Muerto", Vie:"OHP + Accesorios", Sáb:"Cardio LISS", Dom:"🔋 Descanso" },
  "Definición":  { Lun:"Full Body A + Cardio", Mar:"HIIT 30min", Mié:"Full Body B", Jue:"LISS 45min", Vie:"Full Body C + Cardio", Sáb:"HIIT 30min", Dom:"🔋 Descanso" },
  "Power":       { Lun:"Potencia Superior", Mar:"Potencia Inferior", Mié:"🔋 Descanso", Jue:"Olímpicos + Fuerza", Vie:"Pliometría + Velocidad", Sáb:"LISS", Dom:"🔋 Descanso" },
};
const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TODAY_DOW = PLAN_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// ── Exercise Library (categorized) ───────────────────────────────────────────
const EXERCISE_LIBRARY = {
  "🫁 Pecho":    ["Press Banca","Press Inclinado","Press Declinado","Aperturas con Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "🔙 Espalda":  ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "🦵 Piernas":  ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "💪 Brazos":   ["Curl de Bíceps con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea","Fondos Tríceps"],
  "🏔 Hombros":  ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Face Pull","Encogimientos"],
  "⚡ Core":     ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel","Pallof Press"],
  "🏃 Cardio":   ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Remo en Máquina","Escaladora"],
};

// ── Seed ─────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];
const DEFAULT_GOALS = { cal:2200, p:180, c:280, g:60 };
const SEED_LOG = [
  { date:"2026-04-27", calOut:2895, calIn:2171, p:181, c:241, g:57, sleep:7.57, score:81, steps:4141,  goals:{ ...DEFAULT_GOALS } },
  { date:"2026-04-28", calOut:3117, calIn:2576, p:191, c:272, g:72, sleep:6.37, score:92, steps:4680,  goals:{ ...DEFAULT_GOALS } },
  { date:"2026-04-29", calOut:3457, calIn:2567, p:214, c:277, g:69, sleep:6.56, score:94, steps:13899, goals:{ ...DEFAULT_GOALS } },
];
const SEED_DB = [
  { id:1, name:"Leche Descremada Sula", unit:"Taza",    cal:95,  p:9.7,  c:14.0, g:0.2 },
  { id:2, name:"Huevo Bonovo",          unit:"Unidad",  cal:70,  p:6.0,  c:1.0,  g:5.0 },
  { id:3, name:"Europa Top Butter",     unit:"Porción", cal:80,  p:2.5,  c:14.5, g:1.2 },
  { id:4, name:"Avena Molida Quaker",   unit:"Taza",    cal:467, p:20.3, c:79.5, g:8.3 },
  { id:5, name:"Atún Calvo Agua",       unit:"Porción", cal:21,  p:4.8,  c:0.0,  g:0.2 },
  { id:6, name:"Nutrex Whey Protein",   unit:"Scoop",   cal:130, p:25.0, c:3.0,  g:2.0 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n, d=1) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(d);
const r1    = n => Math.round(n * 10) / 10;
const pct   = (v, g) => Math.min(Math.round((v / g) * 100), 100);
const calcPace = (km, t) => {
  if (!km || !t) return "--:--";
  const p = t.split(":").map(Number);
  const s = p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps = s / km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg, cm) => cm ? r1(kg / ((cm/100)**2)) : null;

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(_){} };
  }, []);

  // ── Theme ────────────────────────────────────────────────────────────────────
  const [isDark, setDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  // ── Core data ────────────────────────────────────────────────────────────────
  const [healthLog,   setHL]   = useState(SEED_LOG);
  const [foodLog,     setFL]   = useState([]);
  const [db,          setDb]   = useState(SEED_DB);
  const [strLog,      setStr]  = useState([]);
  const [runs,        setRuns] = useState([]);
  const [bios,        setBios] = useState([]);
  const [program,     setProg] = useState("Hipertrofia");
  // Mutable weekly plans — each program has its own editable schedule
  const [plans, setPlans] = useState(() =>
    Object.fromEntries(Object.entries(PLANS).map(([k,v]) => [k,{...v}]))
  );
  const updatePlanDay = (prog, day, val) =>
    setPlans(prev => ({ ...prev, [prog]: { ...prev[prog], [day]: val } }));
  const resetPlan = (prog) =>
    setPlans(prev => ({ ...prev, [prog]: { ...PLANS[prog] } }));
  const [habits,      setHab]  = useState({
    "💧 Agua (3L)":false,"😴 Sueño (8h)":false,"🥩 Proteína meta":false,
    "🏃 Cardio":false,"🧘 Meditación":false,"🤸 Stretching":false,
  });

  // ── Goals (editable, snapshotted on save) ─────────────────────────────────
  const [goals, setGoals] = useState({ ...DEFAULT_GOALS });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [tab,       setTab]   = useState("dashboard");
  const [editGoals, setEG]    = useState(false);

  // ── Forms ────────────────────────────────────────────────────────────────────
  const [dlForm,   setDlF] = useState({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  const [nutriMode,setNM]  = useState("search");
  const [search,   setSrch]= useState("");
  const [selFood,  setSel] = useState(null);
  const [qty,      setQty] = useState(1);
  const [manForm,  setMF]  = useState({ name:"", cal:"", p:"", c:"", g:"" });
  const [adbForm,  setAdb] = useState({ name:"", unit:"", cal:"", p:"", c:"", g:"" });
  const [editId,   setEId] = useState(null);   // for editing DB items
  const [editRow,  setER]  = useState({});
  const [exForm,   setEF]  = useState({ exercise:"", weight:"", reps:"", sets:"", rpe:"" });
  const [exSel,    setExSel]  = useState("");      // dropdown selected value
  const [exCustom, setExCust] = useState("");      // custom text when "otro" chosen
  const [planOpen, setPlanOpen] = useState(false); // plan editor toggle
  const [runForm,  setRF]  = useState({ date:TODAY, km:"", time:"", lpm:"", ppm:"" });
  const [bioForm,  setBF]  = useState({
    date:TODAY, height:"", weight:"", fat:"", muscle:"",
    visceral:"", water:"", protein:"", dmr:""
  });

  // ── Computed ──────────────────────────────────────────────────────────────────
  const getDayData = (date) => {
    const h  = healthLog.find(d => d.date === date) || {};
    const fs = foodLog.filter(f => f.date === date);
    const calIn = fs.length ? fs.reduce((s,f)=>s+f.cal,0) : (h.calIn||0);
    const p  = fs.length ? r1(fs.reduce((s,f)=>s+f.p,0)) : (h.p||0);
    const c  = fs.length ? r1(fs.reduce((s,f)=>s+f.c,0)) : (h.c||0);
    const g  = fs.length ? r1(fs.reduce((s,f)=>s+f.g,0)) : (h.g||0);
    return {
      date, calOut:h.calOut||0, calIn, p, c, g,
      sleep:h.sleep||null, score:h.score||null, steps:h.steps||null,
      balance: calIn - (h.calOut||0),
      goals: h.goals || { ...DEFAULT_GOALS },
    };
  };
  const allDates = useMemo(() => {
    const s = new Set([...healthLog.map(h=>h.date), ...foodLog.map(f=>f.date), TODAY]);
    return [...s].sort().reverse().slice(0,14);
  }, [healthLog, foodLog]);
  const weekData  = allDates.map(d => getDayData(d));
  const last7     = weekData.slice(0,7).reverse();
  const today     = getDayData(TODAY);
  const todayFood = foodLog.filter(f => f.date === TODAY);

  // ── Color helpers (depend on T) ───────────────────────────────────────────────
  const pColor  = (v, g) => v >= g ? T.green : v >= g*0.8 ? T.accent : T.red;
  const cColor  = (v, g) => v > g  ? T.red   : v > g*0.85 ? T.accent : T.green;
  const balCol  = b => b < 0 ? T.green : b < 300 ? T.accent : T.red;
  const sleepC  = s => s >= 7 ? T.green : s >= 6 ? T.accent : T.red;
  const scoreC  = s => s >= 85 ? T.green : s >= 70 ? T.accent : T.red;

  // ── Style factories ───────────────────────────────────────────────────────────
  const S = {
    card:  { background:T.card,  borderRadius:"22px", padding:"20px", color:T.text, boxShadow:T.shadow },
    card2: { background:T.card2, borderRadius:"16px", padding:"14px", color:T.text },
    lbl:   { fontSize:"10px", color:T.muted, fontFamily:"'DM Mono', monospace", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"5px", display:"block" },
    inp:   { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"9px 12px", color:T.text, fontSize:"13px", width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"'DM Mono', monospace" },
    btn:   { background:T.accent, color:isDark?"#111":T.card, border:"none", borderRadius:"10px", padding:"10px 18px", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"'Syne', sans-serif", width:"100%" },
    ghost: (a) => ({ background: a ? T.accent : "transparent", color: a ? (isDark?"#111":T.card) : T.accent, border:`1px solid ${T.accent}`, borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:600, cursor:"pointer", fontFamily:"'Syne', sans-serif", whiteSpace:"nowrap" }),
    mono:  { fontFamily:"'DM Mono', monospace" },
  };
  const grid2 = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(290px, 1fr))", gap:"16px" };
  const tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"8px 12px" }}>
      {payload.map((p,i) => <div key={i} style={{ fontSize:"12px", color:p.color, fontFamily:"'DM Mono',monospace" }}>{p.name}: <b>{fmt(p.value)}</b></div>)}
    </div>;
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const upsertHL = (entry) => setHL(prev => {
    const i = prev.findIndex(d => d.date === entry.date);
    if (i >= 0) { const u=[...prev]; u[i]={...u[i],...entry}; return u; }
    return [...prev, entry];
  });

  const saveDailyLog = () => {
    if (!dlForm.date) return;
    upsertHL({
      date: dlForm.date,
      ...(dlForm.calOut && { calOut:+dlForm.calOut }),
      ...(dlForm.steps  && { steps:+dlForm.steps }),
      ...(dlForm.sleep  && { sleep:+dlForm.sleep }),
      ...(dlForm.score  && { score:+dlForm.score }),
      goals: { ...goals },  // snapshot goals at time of save
    });
    setDlF({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  };

  const addFromDB = () => {
    if (!selFood) return;
    setFL(p=>[...p,{ date:TODAY, id:Date.now(), name:selFood.name, qty,
      cal:Math.round(selFood.cal*qty), p:r1(selFood.p*qty), c:r1(selFood.c*qty), g:r1(selFood.g*qty) }]);
    setSel(null); setQty(1); setSrch("");
  };

  const addManual = () => {
    if (!manForm.cal) return;
    setFL(p=>[...p,{ date:TODAY, id:Date.now(), name:manForm.name||"Log manual", qty:1,
      cal:+manForm.cal, p:+manForm.p||0, c:+manForm.c||0, g:+manForm.g||0 }]);
    setMF({ name:"", cal:"", p:"", c:"", g:"" });
  };

  const saveToDb = () => {
    if (!adbForm.name||!adbForm.cal) return;
    setDb(p=>[...p,{ id:Date.now(), name:adbForm.name, unit:adbForm.unit||"Porción",
      cal:+adbForm.cal, p:+adbForm.p||0, c:+adbForm.c||0, g:+adbForm.g||0 }]);
    setAdb({ name:"", unit:"", cal:"", p:"", c:"", g:"" });
    setNM("search");
  };

  const saveEdit = () => {
    setDb(p => p.map(f => f.id === editId ? { ...f, ...editRow,
      cal:+editRow.cal, p:+editRow.p, c:+editRow.c, g:+editRow.g } : f));
    setEId(null); setER({});
  };

  const addEx = () => {
    const name = exSel === "__custom__" ? exCustom : exSel;
    if (!name) return;
    setStr(p=>[...p,{ ...exForm, exercise:name, date:TODAY, program, id:Date.now() }]);
    setEF({ exercise:"", weight:"", reps:"", sets:"", rpe:"" });
    setExSel(""); setExCust("");
  };
  const addRun = () => { if (!runForm.km||!runForm.time) return; setRuns(p=>[...p,{...runForm,km:+runForm.km,pace:calcPace(+runForm.km,runForm.time),id:Date.now()}]); setRF({ date:TODAY, km:"", time:"", lpm:"", ppm:"" }); };
  const addBio = () => {
    if (!bioForm.weight) return;
    const imc = bioForm.height ? calcIMC(+bioForm.weight, +bioForm.height) : null;
    setBios(p=>[...p,{ ...bioForm, id:Date.now(), weight:+bioForm.weight, fat:+bioForm.fat||null,
      muscle:+bioForm.muscle||null, visceral:+bioForm.visceral||null, water:+bioForm.water||null,
      protein:+bioForm.protein||null, dmr:+bioForm.dmr||null, imc }]);
    setBF({ date:TODAY, height:bioForm.height, weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" });
  };

  const exportJSON = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ healthLog, foodLog, nutritionDB:db, strengthLog:strLog, runs, biometrics:bios, habits, goals, program, weeklyPlans:plans, exportedAt:new Date().toISOString() },null,2)],{type:"application/json"}));
    a.download = `IN_v3_${TODAY}.json`; a.click();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  const Dashboard = () => {
    const tg   = today.goals;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
        {/* KPI Strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:"10px" }}>
          {[
            { l:"Cal In",   v: today.calIn||"—",   s:"kcal",      c:T.accent  },
            { l:"Cal Out",  v: today.calOut||"—",  s:"kcal quem", c:T.blue    },
            { l:"Balance",  v: today.calOut>0 ? (today.balance>0?`+${today.balance}`:today.balance) : "—",
                            s: today.balance<0?"déficit ✓":"superávit",
                            c: today.calOut>0 ? balCol(today.balance) : T.muted },
            { l:"Proteína", v: today.p ? `${Math.round(today.p)}g` : "—", s:`meta ${goals.p}g`, c: today.p ? pColor(today.p,goals.p) : T.muted },
            { l:"Sueño",    v: today.sleep ? `${fmt(today.sleep,2)}h` : "—", s:`score ${today.score||"—"}%`, c: today.sleep ? sleepC(today.sleep) : T.muted },
            { l:"Pasos",    v: today.steps ? today.steps.toLocaleString() : "—", s:"hoy", c:T.purple },
          ].map(m => (
            <div key={m.l} style={{ ...S.card, padding:"14px" }}>
              <div style={{ ...S.mono, fontSize:"9px", color:T.muted, letterSpacing:"1px" }}>{m.l.toUpperCase()}</div>
              <div style={{ fontSize:"22px", fontWeight:800, color:m.c, lineHeight:1.15, margin:"4px 0 2px", ...S.mono }}>{m.v}</div>
              <div style={{ fontSize:"10px", color:T.muted, ...S.mono }}>{m.s}</div>
            </div>
          ))}
        </div>

        {/* 7-day table */}
        <div style={{ ...S.card, overflowX:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={{ fontSize:"14px", fontWeight:700 }}>📅 Historial · 7 días</div>
            <div style={{ display:"flex", gap:"12px", fontSize:"9px", ...S.mono, color:T.muted, flexWrap:"wrap" }}>
              <span>P: <span style={{color:T.green}}>≥meta ✓</span> <span style={{color:T.red}}>&lt;80% ✗</span></span>
              <span>C: <span style={{color:T.red}}>&gt;meta ✗</span></span>
              <span>Balance: <span style={{color:T.green}}>déficit ✓</span></span>
            </div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px", ...S.mono, minWidth:"680px" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {[["Fecha","left"],["Out","right"],["In","right"],["Bal","right"],["P%","right"],["C%","right"],["G","right"],["😴","right"],["Score","right"],["Pasos","right"]].map(([h,a]) => (
                  <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:500, textAlign:a, fontSize:"9px", letterSpacing:"0.8px", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekData.slice(0,7).map(d => {
                const isT = d.date === TODAY;
                const g   = d.goals;
                const bal = d.calIn - d.calOut;
                const hasOut = d.calOut > 0;
                return (
                  <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background: isT ? T.accentDim : "transparent" }}>
                    <td style={{ padding:"9px 8px", fontWeight:isT?700:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>
                      {isT && <span style={{ marginRight:4 }}>●</span>}{d.date.slice(5)}
                    </td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:T.blue }}>{hasOut ? d.calOut.toLocaleString() : "—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:T.accent }}>{d.calIn ? d.calIn.toLocaleString() : "—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:700, color:(hasOut&&d.calIn)?balCol(bal):T.muted }}>
                      {(hasOut&&d.calIn) ? (bal>0?`+${bal}`:bal) : "—"}
                    </td>
                    <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:d.p?pColor(d.p,g.p):T.muted }}>
                      {d.p ? `${Math.round(d.p)}g` : "—"}
                    </td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:d.c?cColor(d.c,g.c):T.muted }}>{d.c || "—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:T.text }}>{d.g || "—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:d.sleep?sleepC(d.sleep):T.muted }}>{d.sleep ? `${fmt(d.sleep,2)}h` : "—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:d.score?700:400, color:d.score?scoreC(d.score):T.muted }}>{d.score?`${d.score}%`:"—"}</td>
                    <td style={{ padding:"9px 8px", textAlign:"right", color:T.purple }}>{d.steps?d.steps.toLocaleString():"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Charts row */}
        <div style={grid2}>
          {/* Protein area */}
          <div style={S.card}>
            <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"12px" }}>📈 Proteína (últimos 7 días)</div>
            {last7.filter(d=>d.p>0).length >= 2 ? (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={last7} margin={{ top:4, right:4, bottom:0, left:-22 }}>
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.green} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,...S.mono}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:9,...S.mono}}/>
                  <Tooltip content={tip}/>
                  <Area type="monotone" dataKey="p" stroke={T.green} fill="url(#pg)" strokeWidth={2} dot={{fill:T.green,r:4}} name="Proteína (g)"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height:150, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:"12px" }}>Registra más días</div>}
          </div>

          {/* Balance bar */}
          <div style={S.card}>
            <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"12px" }}>⚖️ Balance Calórico</div>
            {last7.filter(d=>d.calOut>0).length >= 2 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={last7.filter(d=>d.calOut>0)} margin={{ top:4, right:4, bottom:0, left:-22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9,...S.mono}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:9,...S.mono}}/>
                  <Tooltip content={tip}/>
                  <Bar dataKey="balance" name="Balance" radius={[4,4,0,0]}>
                    {last7.filter(d=>d.calOut>0).map((d,i)=><Cell key={i} fill={balCol(d.balance)}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height:150, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:"12px" }}>Registra Cal Out en Daily Log</div>}
          </div>
        </div>

        {/* Weekly Training Plan — reads from mutable plans state */}
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"8px" }}>
            <div style={{ fontSize:"14px", fontWeight:700 }}>🗓️ Plan Semanal · <span style={{color:T.accent}}>{program}</span></div>
            <button onClick={()=>setTab("fuerza")} style={{ ...S.ghost(false), fontSize:"11px", padding:"5px 12px" }}>
              ⚙️ Editar en Fuerza →
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px,1fr))", gap:"8px" }}>
            {PLAN_KEYS.map(day => {
              const label   = plans[program]?.[day] || "—";
              const isToday = day === TODAY_DOW;
              const isRest  = label.includes("Descanso");
              return (
                <div key={day} style={{ background: isToday ? T.accentDim : T.card2,
                  border:`1.5px solid ${isToday ? T.accent : T.border}`,
                  borderRadius:"14px", padding:"12px 10px", textAlign:"center",
                  transition:"border-color 0.2s" }}>
                  <div style={{ fontSize:"9px", fontWeight:700, color: isToday ? T.accent : T.muted,
                    ...S.mono, letterSpacing:"1px", marginBottom:"6px" }}>{day.toUpperCase()}</div>
                  <div style={{ fontSize:"11px", fontWeight:600, color: isRest ? T.muted : T.text, lineHeight:1.4 }}>
                    {label}
                  </div>
                  {isToday && <div style={{ marginTop:"6px", fontSize:"9px", background:T.accent,
                    color:"#111", borderRadius:"8px", padding:"2px 6px", display:"inline-block", fontWeight:700 }}>HOY</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: DAILY LOG
  // ════════════════════════════════════════════════════════════════════════════
  const DailyLog = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Goal editor */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: editGoals?"14px":"0" }}>
          <div style={{ fontSize:"14px", fontWeight:700 }}>🎯 Objetivos de Macros</div>
          <div style={{ display:"flex", gap:"8px" }}>
            {!editGoals && (
              <div style={{ display:"flex", gap:"12px" }}>
                {[["Cal",goals.cal,"kcal",T.accent],["P",goals.p,"g",T.green],["C",goals.c,"g",T.blue],["G",goals.g,"g",T.purple]].map(([l,v,u,c])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"9px", color:T.muted, ...S.mono }}>{l}</div>
                    <div style={{ fontSize:"18px", fontWeight:800, color:c, ...S.mono }}>{v}<span style={{fontSize:"11px"}}>{u}</span></div>
                  </div>
                ))}
              </div>
            )}
            <button style={S.ghost(editGoals)} onClick={()=>setEG(!editGoals)}>{editGoals?"✓ Guardar":"✏️ Editar"}</button>
          </div>
        </div>
        {editGoals && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
            {[["Cal Meta (kcal)","cal",T.accent],["Proteína (g)","p",T.green],["Carbos máx (g)","c",T.blue],["Grasas (g)","g",T.purple]].map(([label,k,c])=>(
              <div key={k}>
                <span style={S.lbl}>{label}</span>
                <input style={{ ...S.inp, borderColor: c+"60" }} type="number" value={goals[k]}
                  onChange={e=>setGoals(prev=>({...prev,[k]:+e.target.value}))}/>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:"10px", fontSize:"11px", color:T.muted, ...S.mono }}>
          ⚠ Cada registro diario guarda una fotografía de estos objetivos. Cambiarlos no altera el historial.
        </div>
      </div>

      <div style={grid2}>
        {/* Form */}
        <div style={S.card}>
          <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>📋 Registrar Día</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
            <div style={{ gridColumn:"span 2" }}>
              <span style={S.lbl}>Fecha</span>
              <input style={S.inp} type="date" value={dlForm.date} onChange={e=>setDlF(p=>({...p,date:e.target.value}))}/>
            </div>
            {[["Cal Quemadas (Out)","calOut","number","2895"],["Pasos","steps","number","8000"],["Horas de Sueño","sleep","number","7.57"],["Sleep Score (%)","score","number","81"]].map(([label,k,type,ph])=>(
              <div key={k}>
                <span style={S.lbl}>{label}</span>
                <input style={S.inp} type={type} step={k==="sleep"?"0.01":"1"} placeholder={ph}
                  value={dlForm[k]} onChange={e=>setDlF(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <button style={S.btn} onClick={saveDailyLog}>💾 Guardar (snapshot de objetivos)</button>
          <div style={{ marginTop:"8px", fontSize:"11px", color:T.muted, ...S.mono }}>
            Cal In se toma automáticamente del log de Nutrición.
          </div>
        </div>

        {/* Recent entries */}
        <div style={S.card}>
          <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>🗂 Registros Recientes</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxHeight:"420px", overflowY:"auto" }}>
            {weekData.filter(d=>d.calOut>0||d.sleep||d.steps).length===0 ? (
              <div style={{ color:T.muted, fontSize:"12px" }}>Sin registros</div>
            ) : weekData.filter(d=>d.calOut>0||d.sleep||d.steps).map(d => {
              const g = d.goals;
              return (
              <div key={d.date} style={{ ...S.card2, borderLeft:`3px solid ${d.date===TODAY?T.accent:T.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ fontWeight:700, fontSize:"13px", color:d.date===TODAY?T.accent:T.text }}>
                    {d.date===TODAY?"● Hoy":d.date.slice(5)}
                  </div>
                  <div style={{ display:"flex", gap:"8px", fontSize:"11px", ...S.mono }}>
                    {d.sleep && <span style={{color:sleepC(d.sleep)}}>😴 {fmt(d.sleep,2)}h</span>}
                    {d.score && <span style={{color:scoreC(d.score)}}>💤 {d.score}%</span>}
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
                  {[
                    { l:"Out",  v:d.calOut?`${d.calOut}`:null, c:T.blue   },
                    { l:"In",   v:d.calIn ?`${d.calIn}` :null, c:T.accent },
                    { l:`P/${g.p}g`, v:d.p?`${Math.round(d.p)}g`:null, c:pColor(d.p,g.p) },
                    { l:`C/${g.c}g`, v:d.c?`${Math.round(d.c)}g`:null, c:cColor(d.c,g.c) },
                    { l:"Pasos", v:d.steps?d.steps.toLocaleString():null, c:T.purple },
                  ].map(m=>(
                    <div key={m.l}>
                      <div style={{ fontSize:"8px", color:T.muted, ...S.mono }}>{m.l}</div>
                      <div style={{ fontSize:"13px", fontWeight:700, color:m.v?m.c:T.muted, ...S.mono }}>{m.v||"—"}</div>
                    </div>
                  ))}
                </div>
                {(d.calOut>0 && d.calIn>0) && (
                  <div style={{ marginTop:"8px", fontSize:"11px", ...S.mono, fontWeight:700,
                    color:balCol(d.balance) }}>
                    Balance: {d.balance>0?"+":""}{d.balance} kcal
                  </div>
                )}
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: NUTRICIÓN
  // ════════════════════════════════════════════════════════════════════════════
  const Nutricion = () => {
    const filtered = db.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
    const macros = [
      { name:"Proteína", v:Math.round(today.p*4), c:T.green  },
      { name:"Carbos",   v:Math.round(today.c*4), c:T.blue   },
      { name:"Grasas",   v:Math.round(today.g*9), c:T.purple },
    ].filter(d=>d.v>0);

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {[["search","🔍 Buscar DB"],["manual","✏️ Log Manual"],["adddb","➕ Añadir a DB"],["editdb","🛠 Editar DB"]].map(([id,label])=>(
            <button key={id} style={S.ghost(nutriMode===id)} onClick={()=>{ setNM(id); setEId(null); }}>{label}</button>
          ))}
        </div>

        <div style={grid2}>
          <div style={S.card}>
            {/* Search mode */}
            {nutriMode==="search" && (<>
              <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"12px" }}>🔍 Base de Datos ({db.length})</div>
              <input style={{ ...S.inp, marginBottom:"10px" }} placeholder="Buscar alimento..."
                value={search} onChange={e=>{ setSrch(e.target.value); setSel(null); }}/>
              <div style={{ maxHeight:"220px", overflowY:"auto", marginBottom:"10px" }}>
                {filtered.map(f=>(
                  <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"9px 12px", borderRadius:"10px",
                    cursor:"pointer", marginBottom:"4px", border:`1px solid ${selFood?.id===f.id?T.accent+"60":"transparent"}`,
                    background:selFood?.id===f.id?T.accentDim:"transparent", transition:"all 0.15s" }}>
                    <div style={{ fontWeight:600, fontSize:"13px" }}>{f.name}</div>
                    <div style={{ fontSize:"11px", color:T.muted, ...S.mono }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                  </div>
                ))}
              </div>
              {selFood && (
                <div style={{ ...S.card2, marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", color:T.accent, ...S.mono, marginBottom:"10px", fontWeight:600 }}>{selFood.name}</div>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"10px" }}>
                    <div style={{ flex:1 }}>
                      <span style={S.lbl}>Cantidad</span>
                      <input style={S.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/>
                    </div>
                    <div style={{ fontSize:"12px", color:T.muted, paddingTop:"16px" }}>× {selFood.unit}</div>
                  </div>
                  <div style={{ fontSize:"11px", color:T.muted, ...S.mono, marginBottom:"10px" }}>
                    Total: {Math.round(selFood.cal*qty)} kcal · {r1(selFood.p*qty)}P · {r1(selFood.c*qty)}C · {r1(selFood.g*qty)}G
                  </div>
                  <button style={S.btn} onClick={addFromDB}>+ Agregar al Log</button>
                </div>
              )}
            </>)}

            {/* Manual mode */}
            {nutriMode==="manual" && (<>
              <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>✏️ Entrada Manual</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                <div style={{ gridColumn:"span 2" }}>
                  <span style={S.lbl}>Descripción</span>
                  <input style={S.inp} placeholder="Cena fuera · pollo y arroz..." value={manForm.name}
                    onChange={e=>setMF(p=>({...p,name:e.target.value}))}/>
                </div>
                {[["Calorías *","cal","800"],["Proteína (g)","p","40"],["Carbos (g)","c","60"],["Grasas (g)","g","20"]].map(([l,k,ph])=>(
                  <div key={k}>
                    <span style={S.lbl}>{l}</span>
                    <input style={S.inp} type="number" placeholder={ph} value={manForm[k]}
                      onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              {manForm.cal && <div style={{ fontSize:"11px", color:T.muted, ...S.mono, marginBottom:"10px" }}>
                Preview: {manForm.cal} kcal · {manForm.p||0}P · {manForm.c||0}C · {manForm.g||0}G
              </div>}
              <button style={S.btn} onClick={addManual}>+ Añadir al Log de Hoy</button>
            </>)}

            {/* Add to DB mode */}
            {nutriMode==="adddb" && (<>
              <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>➕ Nuevo Alimento en DB</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                <div style={{ gridColumn:"span 2" }}>
                  <span style={S.lbl}>Nombre</span>
                  <input style={S.inp} placeholder="Yogurt Griego Fage..." value={adbForm.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/>
                </div>
                <div>
                  <span style={S.lbl}>Unidad</span>
                  <input style={S.inp} placeholder="Taza / Scoop / Unidad" value={adbForm.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/>
                </div>
                {[["Calorías","cal","100"],["Proteína (g)","p","10"],["Carbos (g)","c","10"],["Grasas (g)","g","5"]].map(([l,k,ph])=>(
                  <div key={k}>
                    <span style={S.lbl}>{l}</span>
                    <input style={S.inp} type="number" placeholder={ph} value={adbForm[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <button style={S.btn} onClick={saveToDb}>💾 Guardar en Base de Datos</button>
            </>)}

            {/* Edit DB mode */}
            {nutriMode==="editdb" && (<>
              <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"12px" }}>🛠 Editar Base de Datos</div>
              <div style={{ maxHeight:"400px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"8px" }}>
                {db.map(f => editId===f.id ? (
                  <div key={f.id} style={{ ...S.card2, border:`1px solid ${T.accent}60` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"8px" }}>
                      <div style={{ gridColumn:"span 2" }}>
                        <span style={S.lbl}>Nombre</span>
                        <input style={S.inp} value={editRow.name} onChange={e=>setER(p=>({...p,name:e.target.value}))}/>
                      </div>
                      <div>
                        <span style={S.lbl}>Unidad</span>
                        <input style={S.inp} value={editRow.unit} onChange={e=>setER(p=>({...p,unit:e.target.value}))}/>
                      </div>
                      {[["Kcal","cal"],["P","p"],["C","c"],["G","g"]].map(([l,k])=>(
                        <div key={k}>
                          <span style={S.lbl}>{l}</span>
                          <input style={S.inp} type="number" value={editRow[k]} onChange={e=>setER(p=>({...p,[k]:e.target.value}))}/>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <button style={{ ...S.btn, background:T.green, color:"#111" }} onClick={saveEdit}>✓ Guardar</button>
                      <button style={{ ...S.btn, background:T.card3 }} onClick={()=>setEId(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div key={f.id} style={{ ...S.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:"13px" }}>{f.name}</div>
                      <div style={{ fontSize:"11px", color:T.muted, ...S.mono }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                    </div>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={()=>{ setEId(f.id); setER({...f}); }}
                        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:"8px",
                          padding:"5px 10px", cursor:"pointer", fontSize:"11px", color:T.accent }}>✏️</button>
                      <button onClick={()=>setDb(p=>p.filter(x=>x.id!==f.id))}
                        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:"8px",
                          padding:"5px 10px", cursor:"pointer", fontSize:"11px", color:T.red }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>)}
          </div>

          {/* Right panel: macros + log */}
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <span style={S.lbl}>Calorías hoy</span>
                  <div style={{ fontSize:"42px", fontWeight:800, color:T.accent, lineHeight:1, ...S.mono }}>{today.calIn}</div>
                  {today.calOut>0 && <div style={{ fontSize:"12px", color:balCol(today.balance), ...S.mono, marginTop:"4px", fontWeight:700 }}>
                    Balance: {today.balance>0?"+":""}{today.balance} kcal
                  </div>}
                </div>
                {macros.length>0 && (
                  <div style={{ width:80, height:80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={macros} cx="50%" cy="50%" innerRadius={22} outerRadius={36}
                        dataKey="v" strokeWidth={0} paddingAngle={2}>
                        {macros.map((e,i)=><Cell key={i} fill={e.c}/>)}
                      </Pie></PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginTop:"14px" }}>
                {[{n:"Proteína",k:"p",v:today.p,g:goals.p,c:pColor(today.p,goals.p)},{n:"Carbos",k:"c",v:today.c,g:goals.c,c:cColor(today.c,goals.c)},{n:"Grasas",k:"g",v:today.g,g:null,c:T.purple}].map(m=>(
                  <div key={m.k} style={{ background:T.card2, borderRadius:"12px", padding:"10px", textAlign:"center" }}>
                    <div style={{ fontSize:"22px", fontWeight:800, color:m.c }}>{Math.round(m.v)}</div>
                    <div style={{ fontSize:"10px", color:T.muted, ...S.mono }}>{m.n}{m.g?` /${m.g}g`:"g"}</div>
                    {m.g && <div style={{ height:"3px", background:T.border, borderRadius:"2px", overflow:"hidden", marginTop:"5px" }}>
                      <div style={{ height:"100%", width:`${pct(m.v,m.g)}%`, background:m.c, borderRadius:"2px" }}/>
                    </div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...S.card, flex:1 }}>
              <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"12px" }}>📋 Log de Hoy</div>
              {todayFood.length===0 ? (
                <div style={{ color:T.muted, fontSize:"12px", textAlign:"center", padding:"16px" }}>Sin entradas — usa los modos arriba</div>
              ) : (
                <div style={{ maxHeight:"250px", overflowY:"auto" }}>
                  {todayFood.map(f=>(
                    <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"12px", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                        <div style={{ fontSize:"10px", color:T.muted, ...S.mono }}>{f.p}P · {f.c}C · {f.g}G</div>
                      </div>
                      <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                        <span style={{ fontSize:"16px", fontWeight:800, color:T.accent, ...S.mono }}>{f.cal}</span>
                        <button onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}
                          style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:"18px" }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: FUERZA
  // ════════════════════════════════════════════════════════════════════════════
  const Fuerza = () => {
    const activePlan = plans[program];
    const selStyle = {
      ...S.inp, appearance:"none", WebkitAppearance:"none", cursor:"pointer",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:"32px",
    };
    const isCustom = exSel === "__custom__";
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

        {/* ── Program selector + Plan Editor ─────────────────────────────── */}
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"8px" }}>
            <div style={{ fontSize:"14px", fontWeight:700 }}>🗓 Programa · <span style={{color:T.accent}}>{program}</span></div>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {Object.keys(PLANS).map(p=>(
                <button key={p} style={S.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>
              ))}
            </div>
          </div>

          {/* Toggle plan editor */}
          <button onClick={()=>setPlanOpen(o=>!o)} style={{ ...S.ghost(planOpen), marginBottom: planOpen?"14px":"0", width:"auto" }}>
            {planOpen ? "✕ Cerrar Editor" : "⚙️ Configurar Plan Semanal"}
          </button>

          {planOpen && (
            <div style={{ marginTop:"14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ fontSize:"12px", color:T.muted, ...S.mono }}>
                  Edita qué entrenas cada día. Los cambios se reflejan en el Dashboard al instante.
                </div>
                <button onClick={()=>resetPlan(program)}
                  style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:"8px",
                    padding:"5px 12px", cursor:"pointer", fontSize:"11px", color:T.muted,
                    fontFamily:"'Syne',sans-serif", whiteSpace:"nowrap" }}>
                  ↺ Restaurar
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:"8px" }}>
                {PLAN_KEYS.map(day => {
                  const isToday = day === TODAY_DOW;
                  const isRest  = activePlan[day]?.includes("Descanso");
                  return (
                    <div key={day} style={{ background: isToday ? T.accentDim : T.card2,
                      border:`1.5px solid ${isToday ? T.accent : T.border}`, borderRadius:"14px", padding:"10px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                        <span style={{ fontSize:"10px", fontWeight:700, color: isToday ? T.accent : T.muted, ...S.mono, letterSpacing:"1px" }}>
                          {day.toUpperCase()}
                        </span>
                        {isToday && <span style={{ fontSize:"8px", background:T.accent, color:"#111", borderRadius:"6px", padding:"2px 6px", fontWeight:700 }}>HOY</span>}
                      </div>
                      <input
                        value={activePlan[day] || ""}
                        onChange={e => updatePlanDay(program, day, e.target.value)}
                        style={{ ...S.inp, fontSize:"12px", padding:"7px 10px",
                          borderColor: isRest ? T.border : T.accent+"40",
                          color: isRest ? T.muted : T.text }}
                        placeholder="Ej: Pecho + Tríceps"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Log form + History ─────────────────────────────────────────── */}
        <div style={grid2}>
          <div style={S.card}>
            <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>🏋️ Registrar Set</div>

            {/* Exercise dropdown with optgroups */}
            <div style={{ marginBottom:"10px" }}>
              <span style={S.lbl}>Ejercicio</span>
              <select value={exSel} onChange={e=>setExSel(e.target.value)} style={selStyle}>
                <option value="" disabled>— Selecciona un ejercicio —</option>
                {Object.entries(EXERCISE_LIBRARY).map(([cat, exs]) => (
                  <optgroup key={cat} label={cat}>
                    {exs.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </optgroup>
                ))}
                <option value="__custom__">✏️ Otro / Personalizado</option>
              </select>
            </div>

            {/* Custom input revealed when "Otro" is selected */}
            {isCustom && (
              <div style={{ marginBottom:"10px" }}>
                <span style={S.lbl}>Nombre del ejercicio</span>
                <input style={{ ...S.inp, borderColor:T.accent+"60" }}
                  placeholder="Escribe el ejercicio..." value={exCustom}
                  onChange={e=>setExCust(e.target.value)} autoFocus />
              </div>
            )}

            {/* Selected exercise preview pill */}
            {(exSel && !isCustom) && (
              <div style={{ background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:"8px",
                padding:"6px 12px", marginBottom:"10px", fontSize:"12px", color:T.accent, ...S.mono }}>
                ✓ {exSel}
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
              {[["Peso (kg)","weight","80"],["RPE (1–10)","rpe","8"],["Reps","reps","10"],["Series","sets","4"]].map(([l,k,ph])=>(
                <div key={k}><span style={S.lbl}>{l}</span>
                  <input style={S.inp} type="number" placeholder={ph} value={exForm[k]}
                    onChange={e=>setEF(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <button style={{
              ...S.btn,
              opacity: (exSel && !(isCustom && !exCustom)) ? 1 : 0.4,
              cursor:  (exSel && !(isCustom && !exCustom)) ? "pointer" : "not-allowed",
            }} onClick={addEx}>+ Registrar Set</button>
          </div>

          {/* History */}
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ fontSize:"14px", fontWeight:700 }}>📊 Historial</div>
              <span style={{ fontSize:"11px", color:T.muted, ...S.mono }}>{strLog.length} sets</span>
            </div>
            {strLog.length===0 ? (
              <div style={{ color:T.muted, fontSize:"12px", textAlign:"center", padding:"30px" }}>
                <div style={{ fontSize:"28px", marginBottom:"8px", opacity:0.2 }}>🏋️</div>
                Sin registros aún
              </div>
            ) : (<>
              <div style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr", gap:"4px",
                padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:"9px", color:T.muted, ...S.mono }}>
                {["EJERCICIO","KG","REPS","SER","RPE"].map(h=><span key={h}>{h}</span>)}
              </div>
              <div style={{ maxHeight:"340px", overflowY:"auto" }}>
                {[...strLog].reverse().map(l=>{
                  const isToday = l.date === TODAY;
                  return (
                    <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2.5fr 1fr 1fr 1fr 1fr", gap:"4px",
                      padding:"9px 0", borderBottom:`1px solid ${T.border}`, fontSize:"12px", ...S.mono,
                      background: isToday ? T.accentDim : "transparent" }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        fontWeight:600, color: isToday ? T.accent : T.text }}>{l.exercise}</span>
                      <span style={{color:T.accent,fontWeight:700}}>{l.weight}</span>
                      <span>{l.reps}</span><span>{l.sets}</span>
                      <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe}</span>
                    </div>
                  );
                })}
              </div>
            </>)}
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: RUNNING
  // ════════════════════════════════════════════════════════════════════════════
  const Running = () => {
    const totalKM = runs.reduce((s,r)=>s+r.km,0);
    return (
      <div style={grid2}>
        <div style={S.card}>
          <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>🏃 Half Marathon de la Prensa</div>
          <div style={{ background:T.accentDim, border:`1px solid ${T.accent}30`, borderRadius:"14px", padding:"12px 16px", marginBottom:"16px" }}>
            <div style={{ fontSize:"10px", color:T.accent, ...S.mono }}>OBJETIVO</div>
            <div style={{ fontSize:"15px", fontWeight:700 }}>21.1 km · Sub 2:00:00</div>
            <div style={{ display:"flex", justifyContent:"space-between", margin:"6px 0 4px", fontSize:"11px", color:T.muted, ...S.mono }}>
              <span>{totalKM.toFixed(1)} km acumulados</span>
              <span>{((totalKM/21.1)*100).toFixed(1)}%</span>
            </div>
            <div style={{ height:"4px", background:T.card3, borderRadius:"2px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min((totalKM/21.1)*100,100)}%`, background:T.accent }}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"10px" }}>
            {[["Fecha","date","date",TODAY],["Distancia (km)","km","number","10.0"],["Tiempo (hh:mm:ss)","time","text","1:00:00"],["LPM (FC media)","lpm","number","150"],["PPM (Cadencia)","ppm","number","170"]].map(([l,k,type,ph])=>(
              <div key={k}><span style={S.lbl}>{l}</span>
                <input style={S.inp} type={type} placeholder={ph} step={k==="km"?"0.1":undefined}
                  value={runForm[k]} onChange={e=>setRF(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
            <div><span style={S.lbl}>Pace calculado</span>
              <div style={{ fontSize:"24px", fontWeight:800, color:T.accent, ...S.mono, paddingTop:"8px" }}>
                {calcPace(+runForm.km, runForm.time)}
              </div>
            </div>
          </div>
          <button style={S.btn} onClick={addRun}>+ Registrar Carrera</button>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"12px" }}>📈 Progresión</div>
          {runs.length < 2 ? <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:"12px" }}>Registra carreras para la gráfica</div> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={runs} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/><Tooltip content={tip}/>
                <Area type="monotone" dataKey="km" stroke={T.accent} fill="url(#rg)" strokeWidth={2} dot={{fill:T.accent,r:4}} name="KM"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
          {runs.length>0 && <div style={{ maxHeight:"160px", overflowY:"auto", marginTop:"10px" }}>
            {[...runs].reverse().map(r=>(
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, fontSize:"11px", ...S.mono }}>
                <span style={{color:T.muted}}>{r.date.slice(5)}</span>
                <span style={{color:T.accent,fontWeight:700}}>{r.km}km</span>
                <span>{r.time}</span>
                <span style={{color:T.blue}}>{r.pace}</span>
                <span style={{color:T.muted}}>{r.lpm?`${r.lpm}lpm`:"—"}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: BIOMETRÍA (Steren Expanded)
  // ════════════════════════════════════════════════════════════════════════════
  const Biometria = () => {
    const last  = bios[bios.length-1];
    const first = bios[0];
    const delta = last && first ? (last.weight-first.weight).toFixed(1) : null;
    const bioTrend = bios.map(b=>({ date:b.date, weight:b.weight, fat:b.fat, muscle:b.muscle, water:b.water }));

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
        <div style={grid2}>
          <div style={S.card}>
            <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"14px" }}>⚖️ Registro Steren</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
              <div>
                <span style={S.lbl}>Fecha</span>
                <input style={S.inp} type="date" value={bioForm.date} onChange={e=>setBF(p=>({...p,date:e.target.value}))}/>
              </div>
              <div>
                <span style={S.lbl}>Estatura (cm) — para IMC</span>
                <input style={S.inp} type="number" placeholder="175" value={bioForm.height} onChange={e=>setBF(p=>({...p,height:e.target.value}))}/>
              </div>
              {[
                ["Peso (kg) *","weight","75.5",T.accent],
                ["% Grasa Corporal","fat","18.5",T.red],
                ["Masa Muscular (kg)","muscle","58.2",T.green],
                ["Grasa Visceral (nivel)","visceral","6",T.orange],
                ["Agua (%)","water","55.3",T.blue],
                ["Tasa de Proteína (%)","protein","17.5",T.purple],
                ["DMR / TMB (kcal)","dmr","1850",T.muted],
              ].map(([l,k,ph,c])=>(
                <div key={k}>
                  <span style={S.lbl}>{l}</span>
                  <input style={{ ...S.inp, borderColor:c+"50" }} type="number" step="0.1" placeholder={ph}
                    value={bioForm[k]} onChange={e=>setBF(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <span style={S.lbl}>IMC (auto)</span>
                <div style={{ ...S.inp, color: bioForm.height && bioForm.weight ? T.accent : T.muted, fontWeight:700 }}>
                  {bioForm.height && bioForm.weight ? calcIMC(+bioForm.weight, +bioForm.height) : "—"}
                </div>
              </div>
            </div>
            <button style={S.btn} onClick={addBio}>+ Registrar Medición</button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {/* Latest metrics */}
            {last && (
              <div style={S.card}>
                <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"12px" }}>📊 Última Medición · {last.date.slice(5)}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(90px,1fr))", gap:"8px" }}>
                  {[
                    { l:"Peso",     v:`${last.weight}kg`,     c:T.accent },
                    { l:"IMC",      v:last.imc?last.imc:"—",  c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted },
                    { l:"% Grasa",  v:last.fat?`${last.fat}%`:"—",  c:T.red    },
                    { l:"Músculo",  v:last.muscle?`${last.muscle}kg`:"—", c:T.green  },
                    { l:"Visceral", v:last.visceral?`Nv ${last.visceral}`:"—", c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted },
                    { l:"Agua",     v:last.water?`${last.water}%`:"—",  c:T.blue   },
                    { l:"Proteína", v:last.protein?`${last.protein}%`:"—", c:T.purple },
                    { l:"DMR/TMB",  v:last.dmr?`${last.dmr}`:"—",   c:T.orange },
                    { l:"Δ Peso",   v:delta?`${delta>0?"+":""}${delta}kg`:"—",
                      c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted },
                  ].map(m=>(
                    <div key={m.l} style={{ background:T.card2, borderRadius:"12px", padding:"10px", textAlign:"center" }}>
                      <div style={{ fontSize:"9px", color:T.muted, ...S.mono, letterSpacing:"0.8px" }}>{m.l.toUpperCase()}</div>
                      <div style={{ fontSize:"16px", fontWeight:800, color:m.c, marginTop:"3px", ...S.mono }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart */}
            <div style={{ ...S.card, flex:1 }}>
              <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"12px" }}>📈 Evolución</div>
              {bios.length < 2 ? <div style={{ color:T.muted, fontSize:"12px", textAlign:"center", padding:"30px" }}>Registra al menos 2 mediciones</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={bioTrend} margin={{top:4,right:4,bottom:0,left:-22}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                    <YAxis tick={{fill:T.muted,fontSize:9}} domain={["auto","auto"]}/>
                    <Tooltip content={tip}/>
                    <Line type="monotone" dataKey="weight"  stroke={T.accent} strokeWidth={2.5} dot={{fill:T.accent, r:4}} name="Peso (kg)"/>
                    <Line type="monotone" dataKey="fat"     stroke={T.red}    strokeWidth={2}   dot={{fill:T.red,    r:4}} name="% Grasa"/>
                    <Line type="monotone" dataKey="muscle"  stroke={T.green}  strokeWidth={2}   dot={{fill:T.green,  r:4}} name="Músculo (kg)"/>
                    <Line type="monotone" dataKey="water"   stroke={T.blue}   strokeWidth={2}   dot={{fill:T.blue,   r:4}} name="Agua (%)"/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // TAB: HÁBITOS
  // ════════════════════════════════════════════════════════════════════════════
  const Habitos = () => {
    const done  = Object.values(habits).filter(Boolean).length;
    const total = Object.keys(habits).length;
    return (
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
          <div style={{ fontSize:"14px", fontWeight:700 }}>✅ Hábitos Diarios</div>
          <div style={{ fontSize:"30px", fontWeight:800, color:done===total?T.accent:T.text, ...S.mono }}>{done}/{total}</div>
        </div>
        <div style={{ height:"5px", background:T.card2, borderRadius:"3px", overflow:"hidden", marginBottom:"22px" }}>
          <div style={{ height:"100%", width:`${(done/total)*100}%`, background:T.accent, borderRadius:"3px", transition:"width 0.4s" }}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:"10px" }}>
          {Object.entries(habits).map(([h,v])=>(
            <button key={h} onClick={()=>setHab(p=>({...p,[h]:!p[h]}))}
              style={{ background:v?T.accentDim:T.card2, border:`1.5px solid ${v?T.accent:T.border}`,
                borderRadius:"16px", padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
              <div style={{ fontSize:"22px", marginBottom:"8px" }}>{v?"✅":"⭕"}</div>
              <div style={{ fontSize:"13px", fontWeight:600, color:v?T.accent:T.text, fontFamily:"'Syne',sans-serif" }}>{h}</div>
            </button>
          ))}
        </div>
        {done===total && <div style={{ marginTop:"18px", textAlign:"center", background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:"14px", padding:"14px", fontWeight:700, color:T.accent, fontSize:"14px" }}>🎉 ¡Día perfecto!</div>}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SHELL
  // ════════════════════════════════════════════════════════════════════════════
  const TABS = [
    { id:"dashboard", l:"📊 Dashboard"  },
    { id:"dailylog",  l:"📋 Daily Log"  },
    { id:"nutricion", l:"🥗 Nutrición"  },
    { id:"fuerza",    l:"🏋️ Fuerza"    },
    { id:"running",   l:"🏃 Running"    },
    { id:"bio",       l:"⚖️ Biometría"  },
    { id:"habits",    l:"✅ Hábitos"    },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Syne',sans-serif", padding:"16px 18px", transition:"background 0.3s" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <div style={{ fontSize:"26px", fontWeight:800, color:isDark?T.accent:T.text, letterSpacing:"-1.5px", lineHeight:1 }}>☎️ IN</div>
          <div style={{ fontSize:"10px", color:T.muted, ...S.mono, marginTop:"2px" }}>{TODAY} · {program}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
          {today.calIn>0 && <div style={{ background:T.card, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", ...S.mono, color:T.accent }}>{today.calIn} kcal</div>}
          {today.calOut>0 && <div style={{ background:T.card, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", ...S.mono, color:balCol(today.balance), fontWeight:700 }}>
            {today.balance>0?"+":""}{today.balance} bal
          </div>}
          {/* Theme toggle */}
          <button onClick={()=>setDark(!isDark)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"20px", padding:"7px 16px", cursor:"pointer", fontSize:"13px", color:T.text, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>
            {isDark?"☀️ Light":"🌙 Dark"}
          </button>
          <button onClick={exportJSON} style={{ background:T.accent, color:isDark?"#111":T.card, border:"none", borderRadius:"20px", padding:"8px 18px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px", cursor:"pointer" }}>
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:tab===t.id?T.accent:T.card,
            color:tab===t.id?(isDark?"#111":T.card):T.text, border:"none", borderRadius:"20px",
            padding:"8px 16px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px",
            cursor:"pointer", transition:"all 0.2s" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab==="dashboard" && <Dashboard/>}
      {tab==="dailylog"  && <DailyLog/>}
      {tab==="nutricion" && <Nutricion/>}
      {tab==="fuerza"    && <Fuerza/>}
      {tab==="running"   && <Running/>}
      {tab==="bio"       && <Biometria/>}
      {tab==="habits"    && <Habitos/>}
    </div>
  );
}