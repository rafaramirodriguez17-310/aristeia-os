import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg: "#0A0A0A", card: "#141414", card2: "#1C1C1C", card3: "#242424",
  accent: "#FFD700", accentDim: "rgba(255,215,0,0.1)",
  navy: "#001F3F", navyHover: "#003070",
  text: "#F2F2F2", muted: "#666", border: "#252525", inputBg: "#181818",
  green: "#34D399", red: "#F87171", blue: "#60A5FA",
  purple: "#C084FC", orange: "#FB923C", teal: "#2DD4BF",
  shadow: "0 0 0 1px #252525",
  btnText: "#FFFFFF",
};
const LIGHT = {
  bg: "#F7F8FA", card: "#FFFFFF", card2: "#F2F4F7", card3: "#E8ECF0",
  accent: "#D4A017", accentDim: "rgba(212,160,23,0.1)",
  navy: "#001F3F", navyHover: "#003070",
  text: "#0D0D0D", muted: "#8A8F98", border: "#E4E7EC", inputBg: "#FFFFFF",
  green: "#059669", red: "#DC2626", blue: "#2563EB",
  purple: "#7C3AED", orange: "#EA580C", teal: "#0D9488",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  btnText: "#FFFFFF",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia: { Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core", Vie:"Upper (Compuesto)", Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  Fuerza:      { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",    Vie:"OHP + Accesorios", Sáb:"Cardio LISS",     Dom:"🔋 Descanso" },
  Definición:  { Lun:"Full Body A + Cardio", Mar:"HIIT 30min",  Mié:"Full Body B",        Jue:"LISS 45min",     Vie:"Full Body C + Cardio", Sáb:"HIIT 30min",  Dom:"🔋 Descanso" },
  Power:       { Lun:"Potencia Superior",Mar:"Potencia Inferior",Mié:"🔋 Descanso",       Jue:"Olímpicos + Fuerza", Vie:"Pliometría + Velocidad", Sáb:"LISS",  Dom:"🔋 Descanso" },
};
const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TODAY_DOW = PLAN_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
const EXERCISE_LIBRARY = {
  "🫁 Pecho":   ["Press Banca","Press Inclinado","Press Declinado","Aperturas con Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "🔙 Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "🦵 Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "💪 Brazos":  ["Curl de Bíceps con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea","Fondos Tríceps"],
  "🏔 Hombros": ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Encogimientos"],
  "⚡ Core":    ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel","Pallof Press"],
  "🏃 Cardio":  ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Remo en Máquina","Escaladora"],
};
const TODAY          = new Date().toISOString().split("T")[0];
const DEFAULT_GOALS  = { cal:2200, p:180, c:280, g:60 };
const SEED_HEALTH    = [
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

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid  = () => Date.now() + Math.random();
const r1   = n  => Math.round(n * 10) / 10;
const fmt  = (n, d=1) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(d);
const clamp = (v, g) => Math.min(Math.round((v / g) * 100), 100);
const calcPace = (km, t) => {
  if (!km || !t) return "--:--";
  const p = t.split(":").map(Number);
  const s = p.length === 3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps = s / km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg, cm) => cm ? r1(kg / ((cm/100)**2)) : null;

// ─────────────────────────────────────────────────────────────────────────────
// STYLE FACTORIES  (called at top of each component with current theme)
// ─────────────────────────────────────────────────────────────────────────────
function makeStyles(T, isDark) {
  return {
    card:  { background:T.card,  borderRadius:20, padding:20, color:T.text, boxShadow:T.shadow, fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif" },
    card2: { background:T.card2, borderRadius:14, padding:14, color:T.text },
    lbl:   { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, display:"block", fontWeight:600, fontFamily:"system-ui" },
    inp:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui,-apple-system,sans-serif", transition:"border-color 0.15s" },
    sel:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 34px 9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui,-apple-system,sans-serif", appearance:"none", WebkitAppearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:   { background:T.navy,  color:"#fff", border:"none", borderRadius:999, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"system-ui", transition:"background 0.15s", width:"100%" },
    btnSm: { background:T.navy,  color:"#fff", border:"none", borderRadius:999, padding:"7px 16px",  fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"system-ui", transition:"background 0.15s", whiteSpace:"nowrap" },
    ghost: (a) => ({ background: a ? T.navy : "transparent", color: a ? "#fff" : T.navy, border:`1.5px solid ${T.navy}`, borderRadius:999, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap", transition:"all 0.15s" }),
    accentBtn: { background:T.accent, color:"#111", border:"none", borderRadius:999, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"system-ui" },
    iconBtn: (c="#666") => ({ background:"none", border:"none", cursor:"pointer", color:c, padding:"4px 6px", borderRadius:6, fontSize:14, lineHeight:1, display:"flex", alignItems:"center" }),
    mono:  { fontFamily:"'DM Mono','SF Mono','Fira Code',monospace" },
    grid2: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, T }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 12px", boxShadow:T.shadow }}>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color, fontFamily:"system-ui" }}>
          {p.name}: <b>{fmt(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

function Pill({ label, value, sub, color, T }) {
  const S = makeStyles(T, false);
  return (
    <div style={{ ...S.card, padding:14 }}>
      <div style={{ fontSize:9, color:T.muted, letterSpacing:"0.08em", fontWeight:600, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1.2, margin:"4px 0 2px", fontFamily:"system-ui" }}>{value}</div>
      <div style={{ fontSize:10, color:T.muted }}>{sub}</div>
    </div>
  );
}

function SectionHead({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE ROW EDITOR  (generic)
// ─────────────────────────────────────────────────────────────────────────────
function EditableRow({ fields, values, onChange, onSave, onCancel, T }) {
  const S = makeStyles(T, false);
  return (
    <div style={{ ...S.card2, border:`1.5px solid ${T.accent}40`, display:"flex", flexDirection:"column", gap:8, padding:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f => (
          <div key={f.key}>
            <span style={S.lbl}>{f.label}</span>
            <input
              style={S.inp}
              type={f.type || "text"}
              step={f.step}
              value={values[f.key] ?? ""}
              onChange={e => onChange(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...S.btnSm, background:T.green, flex:1 }} onClick={onSave}>✓ Guardar</button>
        <button style={{ ...S.btnSm, background:T.card3, color:T.text, flex:1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ today, weekData, last7, goals, program, plans, setTab, T }) {
  const S   = makeStyles(T, false);
  const tip = (props) => <ChartTip {...props} T={T} />;

  const pColor = (v,g) => v >= g ? T.green : v >= g*0.8 ? T.accent : T.red;
  const cColor = (v,g) => v > g  ? T.red   : v > g*0.85 ? T.accent : T.green;
  const balCol = b => b < 0 ? T.green : b < 300 ? T.accent : T.red;
  const slpCol = s => s >= 7 ? T.green : s >= 6 ? T.accent : T.red;
  const scrCol = s => s >= 85 ? T.green : s >= 70 ? T.accent : T.red;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
        <Pill label="Cal In"   value={today.calIn  || "—"} sub="kcal"       color={T.accent} T={T}/>
        <Pill label="Cal Out"  value={today.calOut || "—"} sub="kcal quem." color={T.blue}   T={T}/>
        <Pill label="Balance"
          value={today.calOut > 0 ? (today.balance > 0 ? `+${today.balance}` : today.balance) : "—"}
          sub={today.balance < 0 ? "déficit ✓" : "superávit"}
          color={today.calOut > 0 ? balCol(today.balance) : T.muted} T={T}/>
        <Pill label="Proteína"
          value={today.p ? `${Math.round(today.p)}g` : "—"}
          sub={`meta ${goals.p}g`}
          color={today.p ? pColor(today.p, goals.p) : T.muted} T={T}/>
        <Pill label="Sueño"
          value={today.sleep ? `${fmt(today.sleep,2)}h` : "—"}
          sub={`score ${today.score || "—"}%`}
          color={today.sleep ? slpCol(today.sleep) : T.muted} T={T}/>
        <Pill label="Pasos"
          value={today.steps ? today.steps.toLocaleString() : "—"}
          sub="hoy" color={T.purple} T={T}/>
      </div>

      {/* 7-day table */}
      <div style={{ ...S.card, overflowX:"auto" }}>
        <SectionHead title="📅 Historial · 7 días"
          right={<div style={{ display:"flex", gap:14, fontSize:9, color:T.muted, flexWrap:"wrap" }}>
            <span>P: <span style={{color:T.green}}>≥meta ✓</span> <span style={{color:T.red}}>&lt;80% ✗</span></span>
            <span>Balance: <span style={{color:T.green}}>déficit ✓</span></span>
          </div>}/>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"system-ui", minWidth:680 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {[["Fecha","left"],["Out","right"],["In","right"],["Bal","right"],["P","right"],["C","right"],["G","right"],["😴","right"],["Score","right"],["Pasos","right"]].map(([h,a])=>(
                <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:600, textAlign:a, fontSize:10, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d => {
              const isT = d.date === TODAY;
              const g   = d.goals;
              const bal = d.calIn - d.calOut;
              const ho  = d.calOut > 0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background: isT ? T.accentDim : "transparent" }}>
                  <td style={{ padding:"9px 8px", fontWeight:isT?700:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>
                    {isT && <span style={{ marginRight:4 }}>●</span>}{d.date.slice(5)}
                  </td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.blue }}>{ho ? d.calOut.toLocaleString() : "—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.accent }}>{d.calIn ? d.calIn.toLocaleString() : "—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:700, color:(ho&&d.calIn)?balCol(bal):T.muted }}>{(ho&&d.calIn)?(bal>0?`+${bal}`:bal):"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:d.p?pColor(d.p,g.p):T.muted }}>{d.p?`${Math.round(d.p)}g`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.c?cColor(d.c,g.c):T.muted }}>{d.c||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.text }}>{d.g||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.sleep?slpCol(d.sleep):T.muted }}>{d.sleep?`${fmt(d.sleep,2)}h`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:d.score?700:400, color:d.score?scrCol(d.score):T.muted }}>{d.score?`${d.score}%`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.purple }}>{d.steps?d.steps.toLocaleString():"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📈 Proteína · 7 días</div>
          {last7.filter(d=>d.p>0).length >= 2 ? (
            <ResponsiveContainer width="100%" height={145}>
              <AreaChart data={last7} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.green} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Area type="monotone" dataKey="p" stroke={T.green} fill="url(#pg)" strokeWidth={2} dot={{fill:T.green,r:4}} name="Proteína (g)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height:145, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra más días</div>}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>⚖️ Balance Calórico</div>
          {last7.filter(d=>d.calOut>0).length >= 2 ? (
            <ResponsiveContainer width="100%" height={145}>
              <BarChart data={last7.filter(d=>d.calOut>0)} margin={{top:4,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Bar dataKey="balance" name="Balance" radius={[4,4,0,0]}>
                  {last7.filter(d=>d.calOut>0).map((d,i)=><Cell key={i} fill={balCol(d.balance)}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height:145, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra Cal Out en Daily Log</div>}
        </div>
      </div>

      {/* Plan widget */}
      <div style={S.card}>
        <SectionHead
          title={<>🗓️ Plan Semanal · <span style={{color:T.accent}}>{program}</span></>}
          right={<button style={S.btnSm} onClick={()=>setTab("fuerza")}>⚙️ Editar →</button>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day => {
            const label  = plans[program]?.[day] || "—";
            const isT    = day === TODAY_DOW;
            const isRest = label.includes("Descanso");
            return (
              <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:700, color:isT?T.accent:T.muted, letterSpacing:"0.08em", marginBottom:6 }}>{day.toUpperCase()}</div>
                <div style={{ fontSize:11, fontWeight:600, color:isRest?T.muted:T.text, lineHeight:1.4 }}>{label}</div>
                {isT && <div style={{ marginTop:6, fontSize:9, background:T.navy, color:"#fff", borderRadius:999, padding:"2px 8px", display:"inline-block", fontWeight:700 }}>HOY</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOG
// ─────────────────────────────────────────────────────────────────────────────
function DailyLog({ weekData, healthLog, setHL, goals, setGoals, T }) {
  const S = makeStyles(T, false);
  const [form,      setForm]     = useState({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  const [editGoals, setEditGoals]= useState(false);
  const [editId,    setEditId]   = useState(null);
  const [editRow,   setEditRow]  = useState({});

  const balCol = b => b < 0 ? T.green : b < 300 ? T.accent : T.red;
  const slpCol = s => s >= 7 ? T.green : s >= 6 ? T.accent : T.red;
  const scrCol = s => s >= 85 ? T.green : s >= 70 ? T.accent : T.red;

  const upsert = (entry) => setHL(prev => {
    const i = prev.findIndex(d => d.date === entry.date);
    if (i >= 0) { const u=[...prev]; u[i]={...u[i],...entry}; return u; }
    return [...prev, entry];
  });

  const save = () => {
    if (!form.date) return;
    upsert({
      date: form.date,
      ...(form.calOut && { calOut:+form.calOut }),
      ...(form.steps  && { steps:+form.steps  }),
      ...(form.sleep  && { sleep:+form.sleep  }),
      ...(form.score  && { score:+form.score  }),
      goals: { ...goals },
    });
    setForm({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  };

  const startEdit = (d) => {
    setEditId(d.date);
    setEditRow({ calOut:d.calOut||"", steps:d.steps||"", sleep:d.sleep||"", score:d.score||"" });
  };
  const saveEdit = (date) => {
    upsert({ date, calOut:+editRow.calOut||0, steps:+editRow.steps||null, sleep:+editRow.sleep||null, score:+editRow.score||null });
    setEditId(null);
  };
  const deleteEntry = (date) => setHL(prev => prev.filter(d => d.date !== date));

  const rows = weekData.filter(d => d.calOut > 0 || d.sleep || d.steps);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Goals editor */}
      <div style={S.card}>
        <SectionHead title="🎯 Objetivos de Macros"
          right={<button style={S.btnSm} onClick={()=>setEditGoals(o=>!o)}>{editGoals?"✓ Listo":"✏️ Editar"}</button>}/>
        {editGoals ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
            {[["Cal Meta (kcal)","cal"],["Proteína (g)","p"],["Carbos máx (g)","c"],["Grasas (g)","g"]].map(([label,k])=>(
              <div key={k}>
                <span style={S.lbl}>{label}</span>
                <input style={S.inp} type="number" value={goals[k]} onChange={e=>setGoals(prev=>({...prev,[k]:+e.target.value}))}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {[["Cal",goals.cal,"kcal",T.accent],["P",goals.p,"g",T.green],["C",goals.c,"g",T.blue],["G",goals.g,"g",T.purple]].map(([l,v,u,c])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:T.muted, fontWeight:600, letterSpacing:"0.06em" }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}<span style={{fontSize:11}}>{u}</span></div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:10, fontSize:11, color:T.muted }}>Cada registro guarda un snapshot de estos objetivos.</div>
      </div>

      <div style={S.grid2}>
        {/* Form */}
        <div style={S.card}>
          <SectionHead title="📋 Registrar Día"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{ gridColumn:"span 2" }}>
              <span style={S.lbl}>Fecha</span>
              <input style={S.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
            </div>
            {[["Cal Quemadas (Out)","calOut","number","2895"],["Pasos","steps","number","8000"],["Horas de Sueño","sleep","number","7.57"],["Sleep Score (%)","score","number","81"]].map(([label,k,type,ph])=>(
              <div key={k}>
                <span style={S.lbl}>{label}</span>
                <input style={S.inp} type={type} step={k==="sleep"?"0.01":"1"} placeholder={ph}
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <button style={S.btn} onClick={save}>💾 Guardar</button>
          <div style={{ marginTop:8, fontSize:11, color:T.muted }}>Cal In viene del log de Nutrición.</div>
        </div>

        {/* Recent */}
        <div style={S.card}>
          <SectionHead title="🗂 Registros Recientes" right={<span style={{fontSize:11,color:T.muted}}>{rows.length} entradas</span>}/>
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:440, overflowY:"auto" }}>
            {rows.length===0 ? <div style={{ color:T.muted, fontSize:12 }}>Sin registros</div>
            : rows.map(d => (
              <div key={d.date}>
                {editId === d.date ? (
                  <EditableRow
                    fields={[{key:"calOut",label:"Cal Out",type:"number"},{key:"steps",label:"Pasos",type:"number"},{key:"sleep",label:"Sueño h",type:"number",step:"0.01"},{key:"score",label:"Score %",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))}
                    onSave={()=>saveEdit(d.date)} onCancel={()=>setEditId(null)} T={T}/>
                ) : (
                  <div style={{ ...S.card2, borderLeft:`3px solid ${d.date===TODAY?T.accent:T.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:d.date===TODAY?T.accent:T.text }}>
                        {d.date===TODAY?"● Hoy":d.date.slice(5)}
                      </div>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {d.sleep && <span style={{ fontSize:11, color:slpCol(d.sleep) }}>😴 {fmt(d.sleep,2)}h</span>}
                        {d.score && <span style={{ fontSize:11, color:scrCol(d.score), marginLeft:6 }}>💤 {d.score}%</span>}
                        <button style={S.iconBtn(T.accent)} onClick={()=>startEdit(d)} title="Editar">✏️</button>
                        <button style={S.iconBtn(T.red)}    onClick={()=>deleteEntry(d.date)} title="Eliminar">🗑</button>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                      {[{l:"Out",v:d.calOut?`${d.calOut}`:"—",c:T.blue},{l:"In",v:d.calIn?`${d.calIn}`:"—",c:T.accent},{l:"Pasos",v:d.steps?d.steps.toLocaleString():"—",c:T.purple},{l:"Bal",v:(d.calOut&&d.calIn)?(d.balance>0?`+${d.balance}`:d.balance):"—",c:(d.calOut&&d.calIn)?balCol(d.balance):T.muted}].map(m=>(
                        <div key={m.l}>
                          <div style={{ fontSize:9, color:T.muted, fontWeight:600 }}>{m.l}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:m.c }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUTRICIÓN
// ─────────────────────────────────────────────────────────────────────────────
function Nutricion({ today, todayFood, foodLog, setFL, db, setDb, goals, T }) {
  const S = makeStyles(T, false);
  const [mode,     setMode]   = useState("search");
  const [search,   setSrch]   = useState("");
  const [selFood,  setSel]    = useState(null);
  const [qty,      setQty]    = useState(1);
  const [manForm,  setMF]     = useState({ name:"", cal:"", p:"", c:"", g:"" });
  const [adbForm,  setAdb]    = useState({ name:"", unit:"", cal:"", p:"", c:"", g:"" });
  const [dbEditId, setDbEId]  = useState(null);
  const [dbEditRow,setDbER]   = useState({});
  const [logEditId,setLEId]   = useState(null);
  const [logEditRow,setLER]   = useState({});

  const pColor = (v,g) => v >= g ? T.green : v >= g*0.8 ? T.accent : T.red;
  const cColor = (v,g) => v > g  ? T.red   : v > g*0.85 ? T.accent : T.green;

  const filtered = db.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const macros   = [{name:"Proteína",v:Math.round(today.p*4),c:T.green},{name:"Carbos",v:Math.round(today.c*4),c:T.blue},{name:"Grasas",v:Math.round(today.g*9),c:T.purple}].filter(d=>d.v>0);

  const addFromDB = () => {
    if (!selFood) return;
    setFL(p=>[...p,{ date:TODAY,id:uid(),name:selFood.name,qty,cal:Math.round(selFood.cal*qty),p:r1(selFood.p*qty),c:r1(selFood.c*qty),g:r1(selFood.g*qty) }]);
    setSel(null); setQty(1); setSrch("");
  };
  const addManual = () => {
    if (!manForm.cal) return;
    setFL(p=>[...p,{ date:TODAY,id:uid(),name:manForm.name||"Log manual",qty:1,cal:+manForm.cal,p:+manForm.p||0,c:+manForm.c||0,g:+manForm.g||0 }]);
    setMF({ name:"",cal:"",p:"",c:"",g:"" });
  };
  const saveToDb  = () => { if (!adbForm.name||!adbForm.cal) return; setDb(p=>[...p,{id:uid(),name:adbForm.name,unit:adbForm.unit||"Porción",cal:+adbForm.cal,p:+adbForm.p||0,c:+adbForm.c||0,g:+adbForm.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEdit = () => { setDb(p=>p.map(f=>f.id===dbEditId?{...f,...dbEditRow,cal:+dbEditRow.cal,p:+dbEditRow.p,c:+dbEditRow.c,g:+dbEditRow.g}:f)); setDbEId(null); };
  const saveLogEdit = () => { setFL(p=>p.map(f=>f.id===logEditId?{...f,...logEditRow,cal:+logEditRow.cal,p:+logEditRow.p||0,c:+logEditRow.c||0,g:+logEditRow.g||0}:f)); setLEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","🔍 Buscar DB"],["manual","✏️ Log Manual"],["adddb","➕ Añadir a DB"],["editdb","🛠 Editar DB"]].map(([id,label])=>(
          <button key={id} style={S.ghost(mode===id)} onClick={()=>{ setMode(id); setDbEId(null); }}>{label}</button>
        ))}
      </div>

      <div style={S.grid2}>
        {/* Left: input panel */}
        <div style={S.card}>
          {mode==="search" && (<>
            <SectionHead title={`🔍 Base de Datos (${db.length})`}/>
            <input style={{ ...S.inp, marginBottom:10 }} placeholder="Buscar alimento..."
              value={search} onChange={e=>{ setSrch(e.target.value); setSel(null); }}/>
            <div style={{ maxHeight:220, overflowY:"auto", marginBottom:10 }}>
              {filtered.map(f=>(
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"9px 12px", borderRadius:10, cursor:"pointer", marginBottom:4,
                  border:`1.5px solid ${selFood?.id===f.id?T.navy+"80":"transparent"}`,
                  background:selFood?.id===f.id?T.accentDim:"transparent", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
            {selFood && (
              <div style={{ ...S.card2, marginBottom:8 }}>
                <div style={{ fontSize:12, color:T.accent, fontWeight:600, marginBottom:10 }}>{selFood.name}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <span style={S.lbl}>Cantidad</span>
                    <input style={S.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/>
                  </div>
                  <div style={{ fontSize:12, color:T.muted, paddingTop:16 }}>× {selFood.unit}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>
                  Total: {Math.round(selFood.cal*qty)} kcal · {r1(selFood.p*qty)}P · {r1(selFood.c*qty)}C · {r1(selFood.g*qty)}G
                </div>
                <button style={S.btn} onClick={addFromDB}>+ Agregar al Log</button>
              </div>
            )}
          </>)}

          {mode==="manual" && (<>
            <SectionHead title="✏️ Entrada Manual"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{ gridColumn:"span 2" }}>
                <span style={S.lbl}>Descripción</span>
                <input style={S.inp} placeholder='Cena fuera · pollo y arroz…' value={manForm.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/>
              </div>
              {[["Calorías *","cal","800"],["Proteína (g)","p","40"],["Carbos (g)","c","60"],["Grasas (g)","g","20"]].map(([l,k,ph])=>(
                <div key={k}>
                  <span style={S.lbl}>{l}</span>
                  <input style={S.inp} type="number" placeholder={ph} value={manForm[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
            {manForm.cal && <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>Preview: {manForm.cal} kcal · {manForm.p||0}P · {manForm.c||0}C · {manForm.g||0}G</div>}
            <button style={S.btn} onClick={addManual}>+ Añadir al Log de Hoy</button>
          </>)}

          {mode==="adddb" && (<>
            <SectionHead title="➕ Nuevo Alimento en DB"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{ gridColumn:"span 2" }}>
                <span style={S.lbl}>Nombre</span>
                <input style={S.inp} placeholder="Yogurt Griego Fage…" value={adbForm.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/>
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
            <button style={S.btn} onClick={saveToDb}>💾 Guardar en DB</button>
          </>)}

          {mode==="editdb" && (<>
            <SectionHead title={`🛠 Editar DB (${db.length})`}/>
            <div style={{ maxHeight:420, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f => dbEditId===f.id ? (
                <EditableRow key={f.id}
                  fields={[{key:"name",label:"Nombre"},{key:"unit",label:"Unidad"},{key:"cal",label:"Kcal",type:"number"},{key:"p",label:"P",type:"number"},{key:"c",label:"C",type:"number"},{key:"g",label:"G",type:"number"}]}
                  values={dbEditRow} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))}
                  onSave={saveDbEdit} onCancel={()=>setDbEId(null)} T={T}/>
              ) : (
                <div key={f.id} style={{ ...S.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{f.name}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={S.iconBtn(T.accent)} onClick={()=>{ setDbEId(f.id); setDbER({...f}); }}>✏️</button>
                    <button style={S.iconBtn(T.red)}    onClick={()=>setDb(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        {/* Right: macro summary + log */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <span style={S.lbl}>Calorías hoy</span>
                <div style={{ fontSize:42, fontWeight:800, color:T.accent, lineHeight:1 }}>{today.calIn}</div>
              </div>
              {macros.length > 0 && (
                <div style={{ width:78, height:78 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={macros} cx="50%" cy="50%" innerRadius={20} outerRadius={34} dataKey="v" strokeWidth={0} paddingAngle={2}>
                      {macros.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              {[{n:"Proteína",k:"p",v:today.p,g:goals.p,c:pColor(today.p,goals.p)},{n:"Carbos",k:"c",v:today.c,g:goals.c,c:cColor(today.c,goals.c)},{n:"Grasas",k:"g",v:today.g,g:null,c:T.purple}].map(m=>(
                <div key={m.k} style={{ background:T.card2, borderRadius:12, padding:10, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:m.c }}>{Math.round(m.v)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{m.n}{m.g?` /${m.g}g`:"g"}</div>
                  {m.g && <div style={{ height:3, background:T.border, borderRadius:2, overflow:"hidden", marginTop:5 }}>
                    <div style={{ height:"100%", width:`${clamp(m.v,m.g)}%`, background:m.c }}/>
                  </div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, flex:1 }}>
            <SectionHead title="📋 Log de Hoy" right={<span style={{fontSize:11,color:T.muted}}>{todayFood.length} entradas</span>}/>
            {todayFood.length===0 ? (
              <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:16 }}>Sin entradas — usa los modos arriba</div>
            ) : (
              <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {todayFood.map(f => logEditId===f.id ? (
                  <EditableRow key={f.id}
                    fields={[{key:"name",label:"Descripción"},{key:"cal",label:"Kcal",type:"number"},{key:"p",label:"P",type:"number"},{key:"c",label:"C",type:"number"},{key:"g",label:"G",type:"number"}]}
                    values={logEditRow} onChange={(k,v)=>setLER(p=>({...p,[k]:v}))}
                    onSave={saveLogEdit} onCancel={()=>setLEId(null)} T={T}/>
                ) : (
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:16, fontWeight:800, color:T.accent }}>{f.cal}</span>
                      <button style={S.iconBtn(T.accent)} onClick={()=>{ setLEId(f.id); setLER({name:f.name,cal:f.cal,p:f.p,c:f.c,g:f.g}); }}>✏️</button>
                      <button style={S.iconBtn(T.red)}    onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
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
}

// ─────────────────────────────────────────────────────────────────────────────
// FUERZA
// ─────────────────────────────────────────────────────────────────────────────
function Fuerza({ strLog, setStr, program, setProg, plans, setPlans, T }) {
  const S = makeStyles(T, false);
  const [exSel,    setExSel]  = useState("");
  const [exCustom, setExCust] = useState("");
  const [form,     setForm]   = useState({ weight:"", reps:"", sets:"", rpe:"" });
  const [planOpen, setPlanOpen]= useState(false);
  const [editId,   setEditId] = useState(null);
  const [editRow,  setEditRow] = useState({});

  const isCustom = exSel === "__custom__";
  const activePlan = plans[program];

  const resetPlan = () =>
    setPlans(prev => ({ ...prev, [program]: { ...PLANS[program] } }));
  const updateDay = (day, val) =>
    setPlans(prev => ({ ...prev, [program]: { ...prev[program], [day]: val } }));

  const addSet = () => {
    const name = isCustom ? exCustom : exSel;
    if (!name) return;
    setStr(p=>[...p,{ ...form, exercise:name, date:TODAY, program, id:uid(),
      weight:+form.weight||0, reps:+form.reps||0, sets:+form.sets||0, rpe:+form.rpe||0 }]);
    setExSel(""); setExCust(""); setForm({ weight:"", reps:"", sets:"", rpe:"" });
  };
  const startEdit = (l) => { setEditId(l.id); setEditRow({ exercise:l.exercise, weight:l.weight, reps:l.reps, sets:l.sets, rpe:l.rpe }); };
  const saveEdit  = () => { setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEditId(null); };

  const selStyle = { ...S.sel };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Program + plan editor */}
      <div style={S.card}>
        <SectionHead
          title={<>🗓 Programa · <span style={{color:T.accent}}>{program}</span></>}
          right={
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.keys(PLANS).map(p=>(
                <button key={p} style={S.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>
              ))}
            </div>
          }/>
        <button onClick={()=>setPlanOpen(o=>!o)} style={{ ...S.ghost(planOpen), marginBottom: planOpen?14:0 }}>
          {planOpen?"✕ Cerrar Editor":"⚙️ Configurar Plan Semanal"}
        </button>
        {planOpen && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:12, color:T.muted }}>Los cambios se reflejan en el Dashboard al instante.</div>
              <button onClick={resetPlan} style={{ ...S.ghost(false), fontSize:11, padding:"4px 12px" }}>↺ Restaurar</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day => {
                const isT = day === TODAY_DOW;
                return (
                  <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:9, fontWeight:700, color:isT?T.accent:T.muted, letterSpacing:"0.08em" }}>{day.toUpperCase()}</span>
                      {isT && <span style={{ fontSize:8, background:T.navy, color:"#fff", borderRadius:999, padding:"2px 7px", fontWeight:700 }}>HOY</span>}
                    </div>
                    <input value={activePlan[day]||""} onChange={e=>updateDay(day,e.target.value)}
                      style={{ ...S.inp, fontSize:12, padding:"7px 10px" }} placeholder="Ej: Pecho + Tríceps"/>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={S.grid2}>
        {/* Log form */}
        <div style={S.card}>
          <SectionHead title="🏋️ Registrar Set"/>
          <div style={{ marginBottom:10 }}>
            <span style={S.lbl}>Ejercicio</span>
            <select value={exSel} onChange={e=>setExSel(e.target.value)} style={selStyle}>
              <option value="" disabled>— Selecciona un ejercicio —</option>
              {Object.entries(EXERCISE_LIBRARY).map(([cat,exs])=>(
                <optgroup key={cat} label={cat}>
                  {exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}
                </optgroup>
              ))}
              <option value="__custom__">✏️ Otro / Personalizado</option>
            </select>
          </div>
          {isCustom && (
            <div style={{ marginBottom:10 }}>
              <span style={S.lbl}>Nombre del ejercicio</span>
              <input style={{ ...S.inp, borderColor:T.navy+"80" }} placeholder="Escribe el ejercicio…"
                value={exCustom} onChange={e=>setExCust(e.target.value)}/>
            </div>
          )}
          {(exSel && !isCustom) && (
            <div style={{ background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:8, padding:"6px 12px", marginBottom:10, fontSize:12, color:T.accent }}>
              ✓ {exSel}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Peso (kg)","weight","80"],["RPE (1–10)","rpe","8"],["Reps","reps","10"],["Series","sets","4"]].map(([l,k,ph])=>(
              <div key={k}>
                <span style={S.lbl}>{l}</span>
                <input style={S.inp} type="number" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn, opacity:(exSel&&!(isCustom&&!exCustom))?1:0.4, cursor:(exSel&&!(isCustom&&!exCustom))?"pointer":"not-allowed" }}
            onClick={addSet}>+ Registrar Set</button>
        </div>

        {/* History */}
        <div style={S.card}>
          <SectionHead title="📊 Historial" right={<span style={{fontSize:11,color:T.muted}}>{strLog.length} sets</span>}/>
          {strLog.length===0 ? (
            <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:30 }}>Sin registros</div>
          ) : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:9, color:T.muted, fontWeight:600, letterSpacing:"0.06em" }}>
              {["EJERCICIO","KG","REPS","SER","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:360, overflowY:"auto" }}>
              {[...strLog].reverse().map(l => editId===l.id ? (
                <div key={l.id} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                  <EditableRow
                    fields={[{key:"exercise",label:"Ejercicio"},{key:"weight",label:"Peso kg",type:"number"},{key:"reps",label:"Reps",type:"number"},{key:"sets",label:"Series",type:"number"},{key:"rpe",label:"RPE",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))}
                    onSave={saveEdit} onCancel={()=>setEditId(null)} T={T}/>
                </div>
              ) : (
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4,
                  padding:"9px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, alignItems:"center",
                  background: l.date===TODAY ? T.accentDim : "transparent" }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600,
                    color: l.date===TODAY ? T.accent : T.text }}>{l.exercise}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{l.weight}</span>
                  <span>{l.reps}</span><span>{l.sets}</span>
                  <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe}</span>
                  <div style={{ display:"flex", gap:2 }}>
                    <button style={S.iconBtn(T.accent)} onClick={()=>startEdit(l)}>✏️</button>
                    <button style={S.iconBtn(T.red)}    onClick={()=>setStr(p=>p.filter(x=>x.id!==l.id))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNING
// ─────────────────────────────────────────────────────────────────────────────
function Running({ runs, setRuns, T }) {
  const S = makeStyles(T, false);
  const [form,    setForm]   = useState({ date:TODAY, km:"", time:"", lpm:"", ppm:"" });
  const [editId,  setEditId] = useState(null);
  const [editRow, setEditRow]= useState({});

  const total = runs.reduce((s,r)=>s+r.km,0);
  const tip   = (props) => <ChartTip {...props} T={T}/>;

  const add = () => {
    if (!form.km || !form.time) return;
    setRuns(p=>[...p,{ ...form, km:+form.km, pace:calcPace(+form.km,form.time), id:uid() }]);
    setForm({ date:TODAY, km:"", time:"", lpm:"", ppm:"" });
  };
  const saveEdit = () => {
    setRuns(p=>p.map(r=>r.id===editId?{...r,...editRow,km:+editRow.km,pace:calcPace(+editRow.km,editRow.time)}:r));
    setEditId(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={S.grid2}>
        <div style={S.card}>
          <SectionHead title="🏃 Half Marathon de la Prensa"/>
          <div style={{ background:T.accentDim, border:`1px solid ${T.accent}30`, borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:10, color:T.accent, fontWeight:700, letterSpacing:"0.08em" }}>OBJETIVO</div>
            <div style={{ fontSize:15, fontWeight:700 }}>21.1 km · Sub 2:00:00</div>
            <div style={{ display:"flex", justifyContent:"space-between", margin:"6px 0 4px", fontSize:11, color:T.muted }}>
              <span>{total.toFixed(1)} km acumulados</span><span>{((total/21.1)*100).toFixed(1)}%</span>
            </div>
            <div style={{ height:4, background:T.card3, borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min((total/21.1)*100,100)}%`, background:T.accent }}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[["Fecha","date","date",TODAY],["Distancia (km)","km","number","10.0"],["Tiempo (hh:mm:ss)","time","text","1:00:00"],["LPM (FC media)","lpm","number","150"],["PPM (Cadencia)","ppm","number","170"]].map(([l,k,type,ph])=>(
              <div key={k}>
                <span style={S.lbl}>{l}</span>
                <input style={S.inp} type={type} placeholder={ph} step={k==="km"?"0.1":undefined}
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <span style={S.lbl}>Pace calculado</span>
              <div style={{ fontSize:24, fontWeight:800, color:T.accent, paddingTop:8 }}>{calcPace(+form.km,form.time)}</div>
            </div>
          </div>
          <button style={S.btn} onClick={add}>+ Registrar Carrera</button>
        </div>

        <div style={S.card}>
          <SectionHead title="📈 Progresión" right={<span style={{fontSize:11,color:T.muted}}>{runs.length} carreras</span>}/>
          {runs.length < 2 ? (
            <div style={{ height:170, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra carreras para la gráfica</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
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
          {runs.length>0 && (
            <div style={{ maxHeight:200, overflowY:"auto", marginTop:10 }}>
              {[...runs].reverse().map(r => editId===r.id ? (
                <div key={r.id} style={{ marginBottom:8 }}>
                  <EditableRow
                    fields={[{key:"date",label:"Fecha",type:"date"},{key:"km",label:"KM",type:"number",step:"0.1"},{key:"time",label:"Tiempo"},{key:"lpm",label:"LPM",type:"number"},{key:"ppm",label:"PPM",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))}
                    onSave={saveEdit} onCancel={()=>setEditId(null)} T={T}/>
                </div>
              ) : (
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0",
                  borderBottom:`1px solid ${T.border}`, fontSize:11, alignItems:"center" }}>
                  <span style={{color:T.muted}}>{r.date.slice(5)}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{r.km}km</span>
                  <span>{r.time}</span>
                  <span style={{color:T.teal}}>{r.pace}</span>
                  <span style={{color:T.muted}}>{r.lpm?`${r.lpm}lpm`:"—"}</span>
                  <div style={{ display:"flex", gap:2 }}>
                    <button style={S.iconBtn(T.accent)} onClick={()=>{ setEditId(r.id); setEditRow({date:r.date,km:r.km,time:r.time,lpm:r.lpm||"",ppm:r.ppm||""}); }}>✏️</button>
                    <button style={S.iconBtn(T.red)}    onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BIOMETRÍA
// ─────────────────────────────────────────────────────────────────────────────
function Biometria({ bios, setBios, T }) {
  const S    = makeStyles(T, false);
  const [form, setForm] = useState({ date:TODAY, height:"", weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" });
  const tip  = (props) => <ChartTip {...props} T={T}/>;
  const last  = bios[bios.length-1];
  const first = bios[0];
  const delta = (last && first) ? (last.weight - first.weight).toFixed(1) : null;
  const trend = bios.map(b => ({ date:b.date, weight:b.weight, fat:b.fat, muscle:b.muscle, water:b.water }));

  const add = () => {
    if (!form.weight) return;
    const imc = form.height ? calcIMC(+form.weight,+form.height) : null;
    setBios(p=>[...p,{ ...form, id:uid(), weight:+form.weight, fat:+form.fat||null, muscle:+form.muscle||null,
      visceral:+form.visceral||null, water:+form.water||null, protein:+form.protein||null, dmr:+form.dmr||null, imc }]);
    setForm({ date:TODAY, height:form.height, weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={S.grid2}>
        <div style={S.card}>
          <SectionHead title="⚖️ Registro Steren"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div><span style={S.lbl}>Fecha</span><input style={S.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><span style={S.lbl}>Estatura (cm)</span><input style={S.inp} type="number" placeholder="175" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/></div>
            {[["Peso (kg) *","weight","75.5",T.accent],["% Grasa Corporal","fat","18.5",T.red],["Masa Muscular (kg)","muscle","58.2",T.green],["Grasa Visceral (nivel)","visceral","6",T.orange],["Agua (%)","water","55.3",T.blue],["Tasa de Proteína (%)","protein","17.5",T.purple],["DMR / TMB (kcal)","dmr","1850",T.muted]].map(([l,k,ph,c])=>(
              <div key={k}><span style={S.lbl}>{l}</span>
                <input style={{ ...S.inp, borderColor:`${c}60` }} type="number" step="0.1" placeholder={ph}
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
            <div><span style={S.lbl}>IMC (auto)</span>
              <div style={{ ...S.inp, color:(form.height&&form.weight)?T.accent:T.muted, fontWeight:700, pointerEvents:"none" }}>
                {(form.height&&form.weight)?calcIMC(+form.weight,+form.height):"—"}
              </div>
            </div>
          </div>
          <button style={S.btn} onClick={add}>+ Registrar Medición</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {last && (
            <div style={S.card}>
              <SectionHead title={`📊 Última Medición · ${last.date.slice(5)}`}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(88px,1fr))", gap:8 }}>
                {[{l:"Peso",v:`${last.weight}kg`,c:T.accent},{l:"IMC",v:last.imc??last.imc,c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},{l:"% Grasa",v:last.fat?`${last.fat}%`:"—",c:T.red},{l:"Músculo",v:last.muscle?`${last.muscle}kg`:"—",c:T.green},{l:"Visceral",v:last.visceral?`Nv ${last.visceral}`:"—",c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted},{l:"Agua",v:last.water?`${last.water}%`:"—",c:T.blue},{l:"Proteína",v:last.protein?`${last.protein}%`:"—",c:T.purple},{l:"DMR/TMB",v:last.dmr||"—",c:T.orange},{l:"Δ Peso",v:delta?`${delta>0?"+":""}${delta}kg`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                  <div key={m.l} style={{ background:T.card2, borderRadius:12, padding:"10px", textAlign:"center" }}>
                    <div style={{ fontSize:9, color:T.muted, fontWeight:600, letterSpacing:"0.06em" }}>{m.l.toUpperCase()}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:m.c, marginTop:3 }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ ...S.card, flex:1 }}>
            <SectionHead title="📈 Evolución"/>
            {bios.length < 2 ? <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:30 }}>Registra 2+ mediciones</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{top:4,right:4,bottom:0,left:-22}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:9}} domain={["auto","auto"]}/>
                  <Tooltip content={tip}/>
                  <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2.5} dot={{fill:T.accent,r:4}} name="Peso (kg)"/>
                  <Line type="monotone" dataKey="fat"    stroke={T.red}    strokeWidth={2}   dot={{fill:T.red,r:4}}    name="% Grasa"/>
                  <Line type="monotone" dataKey="muscle" stroke={T.green}  strokeWidth={2}   dot={{fill:T.green,r:4}}  name="Músculo (kg)"/>
                  <Line type="monotone" dataKey="water"  stroke={T.blue}   strokeWidth={2}   dot={{fill:T.blue,r:4}}   name="Agua (%)"/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HÁBITOS
// ─────────────────────────────────────────────────────────────────────────────
function Habitos({ habits, setHab, T }) {
  const S    = makeStyles(T, false);
  const done  = Object.values(habits).filter(Boolean).length;
  const total = Object.keys(habits).length;
  return (
    <div style={S.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:700 }}>✅ Hábitos Diarios</div>
        <div style={{ fontSize:30, fontWeight:800, color:done===total?T.accent:T.text }}>{done}/{total}</div>
      </div>
      <div style={{ height:5, background:T.card2, borderRadius:3, overflow:"hidden", marginBottom:22 }}>
        <div style={{ height:"100%", width:`${(done/total)*100}%`, background:T.navy, borderRadius:3, transition:"width 0.4s" }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 }}>
        {Object.entries(habits).map(([h,v])=>(
          <button key={h} onClick={()=>setHab(p=>({...p,[h]:!p[h]}))}
            style={{ background:v?T.accentDim:T.card2, border:`1.5px solid ${v?T.accent:T.border}`,
              borderRadius:16, padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.2s",
              fontFamily:"system-ui", color:T.text }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{v?"✅":"⭕"}</div>
            <div style={{ fontSize:13, fontWeight:600, color:v?T.accent:T.text }}>{h}</div>
          </button>
        ))}
      </div>
      {done===total && <div style={{ marginTop:18, textAlign:"center", background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:14, padding:14, fontWeight:700, color:T.accent, fontSize:14 }}>🎉 ¡Día perfecto!</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP  (state only — no sub-component definitions inside)
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // Font
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap";
    l.rel  = "stylesheet";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(_){} };
  }, []);

  // Theme
  const [isDark, setDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  // Core state
  const [tab,       setTab]   = useState("dashboard");
  const [healthLog, setHL]    = useState(SEED_HEALTH);
  const [foodLog,   setFL]    = useState([]);
  const [db,        setDb]    = useState(SEED_DB);
  const [strLog,    setStr]   = useState([]);
  const [runs,      setRuns]  = useState([]);
  const [bios,      setBios]  = useState([]);
  const [habits,    setHab]   = useState({ "💧 Agua (3L)":false,"😴 Sueño (8h)":false,"🥩 Proteína meta":false,"🏃 Cardio":false,"🧘 Meditación":false,"🤸 Stretching":false });
  const [goals,     setGoals] = useState({ ...DEFAULT_GOALS });
  const [program,   setProg]  = useState("Hipertrofia");
  const [plans,     setPlans] = useState(() =>
    Object.fromEntries(Object.entries(PLANS).map(([k,v])=>[k,{...v}]))
  );

  // Computed
  const getDayData = useCallback((date) => {
    const h   = healthLog.find(d => d.date === date) || {};
    const fs  = foodLog.filter(f => f.date === date);
    const hasF = fs.length > 0;
    const calIn = hasF ? fs.reduce((s,f)=>s+f.cal,0) : (h.calIn||0);
    const p  = hasF ? r1(fs.reduce((s,f)=>s+f.p,0)) : (h.p||0);
    const c  = hasF ? r1(fs.reduce((s,f)=>s+f.c,0)) : (h.c||0);
    const g  = hasF ? r1(fs.reduce((s,f)=>s+f.g,0)) : (h.g||0);
    return { date, calOut:h.calOut||0, calIn, p, c, g,
      sleep:h.sleep||null, score:h.score||null, steps:h.steps||null,
      balance: calIn - (h.calOut||0), goals: h.goals || { ...DEFAULT_GOALS } };
  }, [healthLog, foodLog]);

  const allDates = useMemo(() => {
    const s = new Set([...healthLog.map(h=>h.date), ...foodLog.map(f=>f.date), TODAY]);
    return [...s].sort().reverse().slice(0,14);
  }, [healthLog, foodLog]);

  const weekData  = useMemo(()=>allDates.map(d=>getDayData(d)), [allDates, getDayData]);
  const last7     = useMemo(()=>weekData.slice(0,7).reverse(),  [weekData]);
  const today     = useMemo(()=>getDayData(TODAY),              [getDayData]);
  const todayFood = useMemo(()=>foodLog.filter(f=>f.date===TODAY), [foodLog]);

  // Export
  const exportJSON = () => {
    const data = { healthLog, foodLog, nutritionDB:db, strengthLog:strLog, runs, biometrics:bios, habits, goals, program, weeklyPlans:plans, exportedAt:new Date().toISOString() };
    const a = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download = `IN_v4_${TODAY}.json`;
    a.click();
  };

  // Nav & header
  const TABS = [
    {id:"dashboard",l:"📊 Dashboard"},{id:"dailylog",l:"📋 Daily Log"},
    {id:"nutricion",l:"🥗 Nutrición"},{id:"fuerza",l:"🏋️ Fuerza"},
    {id:"running",l:"🏃 Running"},{id:"bio",l:"⚖️ Biometría"},{id:"habits",l:"✅ Hábitos"},
  ];

  const balCol = b => b < 0 ? T.green : b < 300 ? T.accent : T.red;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", color:T.text, padding:"16px 18px", transition:"background 0.3s" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:T.navy, letterSpacing:"-1px", lineHeight:1 }}>
            ☎️ IN <span style={{ color:T.accent, fontSize:12, fontWeight:600 }}>v4</span>
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{TODAY} · {program}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {today.calIn > 0 && (
            <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, color:T.accent, fontWeight:700, boxShadow:T.shadow }}>
              {today.calIn} kcal in
            </div>
          )}
          {today.calOut > 0 && (
            <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, fontWeight:700, color:balCol(today.balance), boxShadow:T.shadow }}>
              {today.balance > 0 ? "+" : ""}{today.balance} bal
            </div>
          )}
          <button onClick={()=>setDark(d=>!d)} style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"7px 16px", cursor:"pointer", fontSize:12, color:T.text, fontWeight:600 }}>
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={exportJSON} style={{ background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background: tab===t.id ? T.navy : T.card,
            color:      tab===t.id ? "#fff" : T.text,
            border:`1.5px solid ${tab===t.id ? T.navy : T.border}`,
            borderRadius:999, padding:"8px 16px", fontWeight:600, fontSize:12,
            cursor:"pointer", transition:"all 0.2s", boxShadow: tab===t.id ? "none" : T.shadow,
          }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Stable component tree — no inline definitions */}
      {tab==="dashboard" && <Dashboard today={today} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setTab={setTab} T={T}/>}
      {tab==="dailylog"  && <DailyLog  weekData={weekData} healthLog={healthLog} setHL={setHL} goals={goals} setGoals={setGoals} T={T}/>}
      {tab==="nutricion" && <Nutricion today={today} todayFood={todayFood} foodLog={foodLog} setFL={setFL} db={db} setDb={setDb} goals={goals} T={T}/>}
      {tab==="fuerza"    && <Fuerza    strLog={strLog} setStr={setStr} program={program} setProg={setProg} plans={plans} setPlans={setPlans} T={T}/>}
      {tab==="running"   && <Running   runs={runs} setRuns={setRuns} T={T}/>}
      {tab==="bio"       && <Biometria bios={bios} setBios={setBios} T={T}/>}
      {tab==="habits"    && <Habitos   habits={habits} setHab={setHab} T={T}/>}
    </div>
  );
}