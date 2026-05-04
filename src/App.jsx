import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080808", card:"#111111", card2:"#191919", card3:"#222222",
  accent:"#FFD700", accentDim:"rgba(255,215,0,0.09)",
  navy:"#001F3F", navyLt:"rgba(0,31,63,0.12)",
  text:"#EDEDED", muted:"#5A5A5A", border:"#222222", inputBg:"#141414",
  green:"#34D399", red:"#F87171", blue:"#60A5FA",
  purple:"#C084FC", orange:"#FB923C", teal:"#2DD4BF",
  shadow:"0 0 0 1px #222",
};
const LIGHT = {
  bg:"#F5F6F8", card:"#FFFFFF", card2:"#F0F2F5", card3:"#E6E9EE",
  accent:"#C8960C", accentDim:"rgba(200,150,12,0.09)",
  navy:"#001F3F", navyLt:"rgba(0,31,63,0.07)",
  text:"#0D0D0D", muted:"#8A8F98", border:"#E2E6EC", inputBg:"#FFFFFF",
  green:"#059669", red:"#DC2626", blue:"#2563EB",
  purple:"#7C3AED", orange:"#EA580C", teal:"#0D9488",
  shadow:"0 1px 4px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps",  Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",      Vie:"Upper Compuesto",      Sáb:"Piernas + Cardio",Dom:"🔋 Descanso" },
  Fuerza:     { Lun:"Squat Heavy",      Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",          Vie:"OHP + Accesorios",     Sáb:"Cardio LISS",     Dom:"🔋 Descanso" },
  Definición: { Lun:"Full Body A",      Mar:"HIIT 30min",        Mié:"Full Body B",        Jue:"LISS 45min",           Vie:"Full Body C + Cardio", Sáb:"HIIT 30min",      Dom:"🔋 Descanso" },
  Power:      { Lun:"Potencia Sup.",    Mar:"Potencia Inf.",      Mié:"🔋 Descanso",       Jue:"Olímpicos + Fuerza",  Vie:"Pliometría + Velocidad",Sáb:"LISS",            Dom:"🔋 Descanso" },
};
const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TODAY_DOW = PLAN_KEYS[new Date().getDay()===0 ? 6 : new Date().getDay()-1];
const EXERCISE_LIB = {
  "🫁 Pecho":   ["Press Banca","Press Inclinado","Press Declinado","Aperturas c/ Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "🔙 Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "🦵 Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "💪 Brazos":  ["Curl con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea"],
  "🏔 Hombros": ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Encogimientos"],
  "⚡ Core":    ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel"],
  "🏃 Cardio":  ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Escaladora"],
};
const TODAY          = new Date().toISOString().split("T")[0];
const DEFAULT_GOALS  = { cal:2200, p:180, c:280, g:60 };
const SEED_HEALTH    = [
  { date:"2026-04-27", calOut:2895, calIn:2171, p:181, c:241, g:57, sleep:7.57, score:81, steps:4141,  goals:{...DEFAULT_GOALS} },
  { date:"2026-04-28", calOut:3117, calIn:2576, p:191, c:272, g:72, sleep:6.37, score:92, steps:4680,  goals:{...DEFAULT_GOALS} },
  { date:"2026-04-29", calOut:3457, calIn:2567, p:214, c:277, g:69, sleep:6.56, score:94, steps:13899, goals:{...DEFAULT_GOALS} },
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
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LS = "aristeia_v6_";
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(LS + key, JSON.stringify(value)); } catch {}
}
function lsClear() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid      = () => Date.now() + Math.random();
const r1       = n  => Math.round(n * 10) / 10;
const fmt      = (n, d=1) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(d);
const clamp100 = (v, g)   => Math.min(Math.round((v / g) * 100), 100);
const calcPace = (km, t)  => {
  if (!km || !t) return "--:--";
  const p = t.split(":").map(Number);
  const s = p.length === 3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps = s / km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg, cm) => cm ? r1(kg / ((cm/100)**2)) : null;

// ─────────────────────────────────────────────────────────────────────────────
// STYLE FACTORY  (pure function — safe to call in render, stable object refs
//                 don't matter since they're only used as inline styles)
// ─────────────────────────────────────────────────────────────────────────────
const SVG_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

function mkS(T) {
  return {
    card:  { background:T.card, borderRadius:20, padding:20, color:T.text, boxShadow:T.shadow, fontFamily:"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" },
    card2: { background:T.card2, borderRadius:14, padding:14, color:T.text },
    lbl:   { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:4, display:"block", fontWeight:700 },
    inp:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", transition:"border-color 0.15s" },
    sel:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 34px 9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", appearance:"none", WebkitAppearance:"none", backgroundImage:SVG_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:   { background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"system-ui", width:"100%" },
    btnSm: { background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"7px 16px",  fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap" },
    ghost: (a) => ({ background:a?T.navy:"transparent", color:a?"#fff":T.navy, border:`1.5px solid ${T.navy}`, borderRadius:999, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap", transition:"all 0.15s" }),
    icon:  (c) => ({ background:"none", border:"none", cursor:"pointer", color:c||T.muted, padding:"3px 6px", borderRadius:6, fontSize:14, lineHeight:1, display:"inline-flex", alignItems:"center", transition:"opacity 0.1s" }),
    g2:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS  — defined outside App so React never unmounts them between keystrokes
// ─────────────────────────────────────────────────────────────────────────────

/** Recharts custom tooltip */
function ChartTip({ active, payload, T }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 12px", boxShadow:T.shadow, fontSize:12 }}>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontFamily:"system-ui" }}>{p.name}: <b>{fmt(p.value)}</b></div>
      ))}
    </div>
  );
}

/** Section header row */
function SH({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
      {right}
    </div>
  );
}

/** Animated progress bar */
function ProgBar({ value, max, color, h=4 }) {
  const w = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height:h, borderRadius:h, overflow:"hidden", background:"rgba(128,128,128,0.13)", marginTop:5 }}>
      <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:h, transition:"width 0.45s ease" }}/>
    </div>
  );
}

/**
 * Inline row editor — used in every CRUD table.
 * Defined outside App ✓ — never re-mounted on parent re-render.
 */
function EditRow({ fields, vals, onChange, onSave, onCancel, T }) {
  const st = mkS(T);
  return (
    <div style={{ ...st.card2, border:`1.5px solid ${T.accent}40`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f => (
          <div key={f.k}>
            <span style={st.lbl}>{f.l}</span>
            <input
              style={st.inp}
              type={f.t || "text"}
              step={f.step}
              value={vals[f.k] ?? ""}
              onChange={e => onChange(f.k, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.green, flex:1 }} onClick={onSave}>✓ Guardar</button>
        <button style={{ ...st.btnSm, background:T.card3, color:T.text, flex:1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/**
 * Macro summary card with progress bar.
 * Defined outside App ✓
 */
function MacroCard({ label, value, goal, overColor, baseColor, T }) {
  const over = goal != null && value > goal;
  const color = over ? overColor : baseColor;
  return (
    <div style={{ background:T.card2, borderRadius:12, padding:10, textAlign:"center" }}>
      <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{Math.round(value)}</div>
      <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{label}{goal ? ` / ${goal}g` : "g"}</div>
      {goal != null && <ProgBar value={value} max={goal} color={color}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATHLETICS TRACK SVG
// ─────────────────────────────────────────────────────────────────────────────
function AthleticsTrack({ totalKM, goalKM = 21.1, T }) {
  const pct = Math.min(totalKM / goalKM, 1);
  const W=520, H=190, cx=260, cy=95, rx=130, ry=72, laneW=15;

  // Runner position along oval perimeter (clockwise, starting top-center)
  const ang  = pct * 2 * Math.PI - Math.PI / 2;
  const runX = cx + (rx + laneW) * Math.cos(ang);
  const runY = cy + (ry + laneW) * Math.sin(ang);

  const milestones = [{km:5,l:"5K"},{km:10,l:"10K"},{km:15,l:"15K"},{km:21.1,l:"🏁"}];

  return (
    <div style={{ width:"100%", maxWidth:520 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", overflow:"visible" }}>
        <defs>
          <linearGradient id="trackFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={T.card3}/>
            <stop offset="100%" stopColor={T.card2}/>
          </linearGradient>
          <linearGradient id="runProg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={T.green}/>
            <stop offset="50%"  stopColor={T.accent}/>
            <stop offset="100%" stopColor={T.orange}/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Outer track body */}
        <ellipse cx={cx} cy={cy} rx={rx+3*laneW} ry={ry+3*laneW} fill="url(#trackFill)" stroke={T.border} strokeWidth={1.5}/>

        {/* Lane dividers */}
        {[1,2].map(i => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx+(3-i)*laneW} ry={ry+(3-i)*laneW}
            fill="none" stroke={T.border} strokeWidth={0.8} strokeDasharray="5 4"/>
        ))}

        {/* Inner grass */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={T.card} stroke={T.border} strokeWidth={1}/>

        {/* Inner field content */}
        <text x={cx} y={cy-18} textAnchor="middle" fill={T.muted} fontSize={9} fontFamily="system-ui" fontWeight={700} letterSpacing="2">HALF MARATHON</text>
        <text x={cx} y={cy+10} textAnchor="middle" fill={T.accent} fontSize={28} fontFamily="system-ui" fontWeight={800}>{totalKM.toFixed(1)}</text>
        <text x={cx} y={cy+28} textAnchor="middle" fill={T.muted} fontSize={11} fontFamily="system-ui">/ {goalKM} km</text>
        <text x={cx} y={cy+46} textAnchor="middle" fill={pct>=1?T.green:T.muted} fontSize={10} fontFamily="system-ui" fontWeight={600}>{Math.round(pct*100)}% completado</text>

        {/* Progress arc via stroke-dasharray on runner lane ellipse */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx + laneW*1.5} ry={ry + laneW*1.5}
          fill="none"
          stroke="url(#runProg)"
          strokeWidth={laneW}
          strokeDasharray={`${pct * 2 * Math.PI * (rx + laneW*1.5)} 99999`}
          strokeDashoffset={(Math.PI / 2) * (rx + laneW*1.5)}
          strokeLinecap="round"
          opacity={0.8}
        />

        {/* Milestone markers */}
        {milestones.map(m => {
          const a  = (m.km / goalKM) * 2 * Math.PI - Math.PI/2;
          const mx = cx + (rx + laneW*1.5) * Math.cos(a);
          const my = cy + (ry + laneW*1.5) * Math.sin(a);
          const done = totalKM >= m.km;
          return (
            <g key={m.km}>
              <circle cx={mx} cy={my} r={6} fill={done?T.green:T.navy} stroke={done?T.green:T.accent} strokeWidth={1.5}/>
              <text x={mx} y={my - 10} textAnchor="middle" fill={T.muted} fontSize={8} fontFamily="system-ui">{m.l}</text>
            </g>
          );
        })}

        {/* Start flag */}
        <text x={cx} y={cy - ry - laneW*3 + 10} textAnchor="middle" fontSize={16}>🚦</text>

        {/* Runner — only shown once started */}
        {pct > 0 && (
          <text x={runX} y={runY + 6} textAnchor="middle" fontSize={18} filter="url(#glow)" style={{ userSelect:"none" }}>🏃</text>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ today, weekData, last7, goals, program, plans, setTab, T }) {
  const st  = mkS(T);
  const tip = p => <ChartTip {...p} T={T}/>;

  const pCol = (v,g) => v>=g?T.green:v>=g*.8?T.accent:T.red;
  const bCol = b => b<0?T.green:b<300?T.accent:T.red;
  const sCol = s => s>=7?T.green:s>=6?T.accent:T.red;
  const scCol= s => s>=85?T.green:s>=70?T.accent:T.red;
  const cCol = (v,g) => v>g?T.red:v>g*.85?T.accent:T.green;

  const kpis = [
    { l:"Cal In",   v:today.calIn||"—",  s:"kcal consumidas", c:T.accent },
    { l:"Cal Out",  v:today.calOut||"—", s:"kcal quemadas",   c:T.blue   },
    { l:"Balance",
      v: today.calOut>0?(today.balance>0?`+${today.balance}`:today.balance):"—",
      s: today.balance<0?"déficit ✓":"superávit",
      c: today.calOut>0?bCol(today.balance):T.muted },
    { l:"Proteína", v:today.p?`${Math.round(today.p)}g`:"—", s:`meta ${goals.p}g`, c:today.p?pCol(today.p,goals.p):T.muted },
    { l:"Sueño",    v:today.sleep?`${fmt(today.sleep,2)}h`:"—", s:`score ${today.score||"—"}%`, c:today.sleep?sCol(today.sleep):T.muted },
    { l:"Pasos",    v:today.steps?today.steps.toLocaleString():"—", s:"hoy", c:T.purple },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))", gap:10 }}>
        {kpis.map(k => (
          <div key={k.l} style={{ ...st.card, padding:14 }}>
            <div style={{ fontSize:9, color:T.muted, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase" }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, lineHeight:1.2, margin:"4px 0 2px" }}>{k.v}</div>
            <div style={{ fontSize:10, color:T.muted }}>{k.s}</div>
          </div>
        ))}
      </div>

      {/* History table */}
      <div style={{ ...st.card, overflowX:"auto" }}>
        <SH title="📅 Historial — últimos 7 días"
          right={<span style={{ fontSize:9, color:T.muted }}>P:<span style={{color:T.green}}> ≥meta</span> · Bal:<span style={{color:T.green}}> déficit</span></span>}/>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:660 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {[["Fecha","l"],["Out","r"],["In","r"],["Bal","r"],["P","r"],["C","r"],["G","r"],["😴","r"],["Score","r"],["Pasos","r"]].map(([h,a])=>(
                <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:700, textAlign:a==="r"?"right":"left", fontSize:9, letterSpacing:"0.07em" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d => {
              const isT=d.date===TODAY, g=d.goals, bal=d.calIn-d.calOut, ho=d.calOut>0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background:isT?T.accentDim:"transparent" }}>
                  <td style={{ padding:"9px 8px", fontWeight:isT?700:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>{isT&&"● "}{d.date.slice(5)}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.blue }}>{ho?d.calOut.toLocaleString():"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.accent }}>{d.calIn?d.calIn.toLocaleString():"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:700, color:(ho&&d.calIn)?bCol(bal):T.muted }}>{(ho&&d.calIn)?(bal>0?`+${bal}`:bal):"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:d.p?pCol(d.p,g.p):T.muted }}>{d.p?`${Math.round(d.p)}g`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.c?cCol(d.c,g.c):T.muted }}>{d.c||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.text }}>{d.g||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.sleep?sCol(d.sleep):T.muted }}>{d.sleep?`${fmt(d.sleep,2)}h`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:d.score?700:400, color:d.score?scCol(d.score):T.muted }}>{d.score?`${d.score}%`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.purple }}>{d.steps?d.steps.toLocaleString():"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div style={st.g2}>
        <div style={st.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📈 Proteína — 7 días</div>
          {last7.filter(d=>d.p>0).length>=2 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={last7} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.green} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Area type="monotone" dataKey="p" stroke={T.green} fill="url(#pg)" strokeWidth={2} dot={{fill:T.green,r:4}} name="Proteína (g)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <Placeholder T={T} msg="Registra más días"/>}
        </div>
        <div style={st.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>⚖️ Balance Calórico</div>
          {last7.filter(d=>d.calOut>0).length>=2 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={last7.filter(d=>d.calOut>0)} margin={{top:4,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Bar dataKey="balance" name="Balance" radius={[4,4,0,0]}>
                  {last7.filter(d=>d.calOut>0).map((d,i) => (
                    <Cell key={i} fill={d.balance<0?T.green:d.balance<300?T.accent:T.red}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Placeholder T={T} msg="Registra Cal Out"/>}
        </div>
      </div>

      {/* Weekly plan */}
      <div style={st.card}>
        <SH title={<>🗓️ Plan Semanal · <span style={{color:T.accent}}>{program}</span></>}
          right={<button style={st.btnSm} onClick={()=>setTab("fuerza")}>⚙️ Editar →</button>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day => {
            const label=plans[program]?.[day]||"—", isT=day===TODAY_DOW, isR=label.includes("Descanso");
            return (
              <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:700, color:isT?T.accent:T.muted, letterSpacing:"0.09em", marginBottom:6 }}>{day.toUpperCase()}</div>
                <div style={{ fontSize:11, fontWeight:600, color:isR?T.muted:T.text, lineHeight:1.4 }}>{label}</div>
                {isT && <div style={{ marginTop:6, fontSize:9, background:T.navy, color:"#fff", borderRadius:999, padding:"2px 8px", display:"inline-block", fontWeight:700 }}>HOY</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Reusable empty-state placeholder
function Placeholder({ T, msg }) {
  return <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DAILY LOG
// ─────────────────────────────────────────────────────────────────────────────
function DailyLog({ weekData, setHL, goals, setGoals, T }) {
  const st = mkS(T);
  const [form,   setForm]  = useState({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  const [editG,  setEG]    = useState(false);
  const [editId, setEId]   = useState(null);
  const [editRow,setER]    = useState({});

  const bCol = b => b<0?T.green:b<300?T.accent:T.red;
  const sCol = s => s>=7?T.green:s>=6?T.accent:T.red;
  const scCol= s => s>=85?T.green:s>=70?T.accent:T.red;

  const upsert = entry => setHL(prev => {
    const i = prev.findIndex(d => d.date === entry.date);
    if (i >= 0) { const u=[...prev]; u[i]={...u[i],...entry}; return u; }
    return [...prev, entry];
  });

  const save = () => {
    if (!form.date) return;
    upsert({ date:form.date, ...(form.calOut&&{calOut:+form.calOut}), ...(form.steps&&{steps:+form.steps}),
      ...(form.sleep&&{sleep:+form.sleep}), ...(form.score&&{score:+form.score}), goals:{...goals} });
    setForm({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  };

  const rows = weekData.filter(d => d.calOut>0||d.sleep||d.steps);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Goals panel */}
      <div style={st.card}>
        <SH title="🎯 Objetivos de Macros" right={<button style={st.btnSm} onClick={()=>setEG(o=>!o)}>{editG?"✓ Listo":"✏️ Editar"}</button>}/>
        {editG ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
            {[["Cal Meta (kcal)","cal"],["Proteína (g)","p"],["Carbos máx (g)","c"],["Grasas (g)","g"]].map(([l,k])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" value={goals[k]} onChange={e=>setGoals(p=>({...p,[k]:+e.target.value}))}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
            {[["Cal",goals.cal,"kcal",T.accent],["P",goals.p,"g",T.green],["C",goals.c,"g",T.blue],["G",goals.g,"g",T.purple]].map(([l,v,u,c])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:T.muted, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}<span style={{fontSize:11}}>{u}</span></div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:10, fontSize:11, color:T.muted }}>Snapshot guardado con cada registro — el historial pasado no se altera.</div>
      </div>

      <div style={st.g2}>
        {/* Form */}
        <div style={st.card}>
          <SH title="📋 Registrar Día"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Fecha</span>
              <input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            {[["Cal Quemadas (Out)","calOut","2895"],["Pasos","steps","8000"],["Horas de Sueño","sleep","7.57"],["Sleep Score %","score","81"]].map(([l,k,ph])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" step={k==="sleep"?"0.01":"1"} placeholder={ph}
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
          </div>
          <button style={st.btn} onClick={save}>💾 Guardar Registro</button>
          <div style={{ marginTop:8, fontSize:11, color:T.muted }}>Cal In se calcula automáticamente desde Nutrición.</div>
        </div>

        {/* Recent entries */}
        <div style={st.card}>
          <SH title="🗂 Registros Recientes" right={<span style={{fontSize:11,color:T.muted}}>{rows.length} entradas</span>}/>
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:420, overflowY:"auto" }}>
            {rows.length===0 ? <div style={{color:T.muted,fontSize:12}}>Sin registros</div>
            : rows.map(d => (
              <div key={d.date}>
                {editId===d.date ? (
                  <EditRow
                    fields={[{k:"calOut",l:"Cal Out",t:"number"},{k:"steps",l:"Pasos",t:"number"},{k:"sleep",l:"Sueño h",t:"number",step:"0.01"},{k:"score",l:"Score %",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))}
                    onSave={()=>{ upsert({date:d.date,calOut:+editRow.calOut||0,steps:+editRow.steps||null,sleep:+editRow.sleep||null,score:+editRow.score||null}); setEId(null); }}
                    onCancel={()=>setEId(null)} T={T}/>
                ) : (
                  <div style={{ ...st.card2, borderLeft:`3px solid ${d.date===TODAY?T.accent:T.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:d.date===TODAY?T.accent:T.text }}>{d.date===TODAY?"● Hoy":d.date.slice(5)}</div>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {d.sleep&&<span style={{fontSize:11,color:sCol(d.sleep)}}>😴 {fmt(d.sleep,2)}h</span>}
                        {d.score&&<span style={{fontSize:11,color:scCol(d.score),marginLeft:4}}>💤 {d.score}%</span>}
                        <button style={st.icon(T.accent)} onClick={()=>{setEId(d.date);setER({calOut:d.calOut||"",steps:d.steps||"",sleep:d.sleep||"",score:d.score||""});}}>✏️</button>
                        <button style={st.icon(T.red)}    onClick={()=>setHL(p=>p.filter(x=>x.date!==d.date))}>🗑</button>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                      {[{l:"Out",v:d.calOut||"—",c:T.blue},{l:"In",v:d.calIn||"—",c:T.accent},
                        {l:"Pasos",v:d.steps?d.steps.toLocaleString():"—",c:T.purple},
                        {l:"Bal",v:(d.calOut&&d.calIn)?(d.balance>0?`+${d.balance}`:d.balance):"—",
                          c:(d.calOut&&d.calIn)?(d.balance<0?T.green:d.balance<300?T.accent:T.red):T.muted}].map(m=>(
                        <div key={m.l}><div style={{fontSize:9,color:T.muted,fontWeight:700}}>{m.l}</div>
                          <div style={{fontSize:13,fontWeight:700,color:m.c}}>{m.v}</div></div>
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
// TAB: NUTRICIÓN  — full-height DB list, fat progress bar
// ─────────────────────────────────────────────────────────────────────────────
function Nutricion({ today, todayFood, setFL, db, setDb, goals, T }) {
  const st = mkS(T);
  const [mode,   setMode]  = useState("search");
  const [search, setSrch]  = useState("");
  const [sel,    setSel]   = useState(null);
  const [qty,    setQty]   = useState(1);
  const [mf,     setMF]    = useState({ name:"",cal:"",p:"",c:"",g:"" });
  const [adb,    setAdb]   = useState({ name:"",unit:"",cal:"",p:"",c:"",g:"" });
  const [dbEId,  setDbEId] = useState(null);
  const [dbER,   setDbER]  = useState({});
  const [lgEId,  setLgEId] = useState(null);
  const [lgER,   setLgER]  = useState({});

  const pCol = (v,g) => v>=g?T.green:v>=g*.8?T.accent:T.red;
  const cCol = (v,g) => v>g?T.red:v>g*.85?T.accent:T.green;
  const gGoal = goals.g || 60;

  const filtered = db.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const macros   = [
    {name:"Proteína",v:Math.round(today.p*4),c:T.green},
    {name:"Carbos",  v:Math.round(today.c*4),c:T.blue},
    {name:"Grasas",  v:Math.round(today.g*9),c:T.purple},
  ].filter(d=>d.v>0);

  const addDB  = () => { if(!sel) return; setFL(p=>[...p,{date:TODAY,id:uid(),name:sel.name,qty,cal:Math.round(sel.cal*qty),p:r1(sel.p*qty),c:r1(sel.c*qty),g:r1(sel.g*qty)}]); setSel(null);setQty(1);setSrch(""); };
  const addMan = () => { if(!mf.cal) return; setFL(p=>[...p,{date:TODAY,id:uid(),name:mf.name||"Log manual",qty:1,cal:+mf.cal,p:+mf.p||0,c:+mf.c||0,g:+mf.g||0}]); setMF({name:"",cal:"",p:"",c:"",g:""}); };
  const addToDb= () => { if(!adb.name||!adb.cal) return; setDb(p=>[...p,{id:uid(),name:adb.name,unit:adb.unit||"Porción",cal:+adb.cal,p:+adb.p||0,c:+adb.c||0,g:+adb.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEd = () => { setDb(p=>p.map(f=>f.id===dbEId?{...f,...dbER,cal:+dbER.cal,p:+dbER.p,c:+dbER.c,g:+dbER.g}:f)); setDbEId(null); };
  const saveLgEd = () => { setFL(p=>p.map(f=>f.id===lgEId?{...f,...lgER,cal:+lgER.cal,p:+lgER.p||0,c:+lgER.c||0,g:+lgER.g||0}:f)); setLgEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Mode switcher */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","🔍 Buscar DB"],["manual","✏️ Log Manual"],["adddb","➕ Añadir"],["editdb","🛠 Editar DB"]].map(([id,label])=>(
          <button key={id} style={st.ghost(mode===id)} onClick={()=>{setMode(id);setDbEId(null);}}>{label}</button>
        ))}
      </div>

      {/* Two-column bento */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,1.15fr) minmax(260px,1fr)", gap:16, alignItems:"start" }}>

        {/* LEFT — full-height input panel */}
        <div style={{ ...st.card, display:"flex", flexDirection:"column", height:"100%", minHeight:460 }}>

          {/* SEARCH */}
          {mode==="search" && (<>
            <SH title={`🔍 Base de Datos (${db.length})`}/>
            <input style={{ ...st.inp, marginBottom:10 }} placeholder="Buscar alimento…"
              value={search} onChange={e=>{setSrch(e.target.value);setSel(null);}}/>
            {/* Flex-1 list — fills remaining height ✓ */}
            <div style={{ flex:1, overflowY:"auto", marginBottom:10, minHeight:0 }}>
              {filtered.map(f => (
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"9px 12px", borderRadius:10, cursor:"pointer", marginBottom:4,
                  border:`1.5px solid ${sel?.id===f.id?T.navy+"70":"transparent"}`,
                  background:sel?.id===f.id?T.accentDim:"transparent", transition:"all 0.12s" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
            {sel && (
              <div style={st.card2}>
                <div style={{ fontSize:12, color:T.accent, fontWeight:700, marginBottom:10 }}>{sel.name}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
                    <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
                  <div style={{ fontSize:12, color:T.muted, paddingTop:16 }}>× {sel.unit}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>
                  {Math.round(sel.cal*qty)} kcal · {r1(sel.p*qty)}P · {r1(sel.c*qty)}C · {r1(sel.g*qty)}G
                </div>
                <button style={st.btn} onClick={addDB}>+ Agregar al Log</button>
              </div>
            )}
          </>)}

          {/* MANUAL */}
          {mode==="manual" && (<>
            <SH title="✏️ Entrada Manual"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Descripción</span>
                <input style={st.inp} placeholder="Cena fuera · pollo y arroz…" value={mf.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/></div>
              {[["Calorías *","cal","800"],["Proteína (g)","p","40"],["Carbos (g)","c","60"],["Grasas (g)","g","20"]].map(([l,k,ph])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder={ph} value={mf[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            {mf.cal&&<div style={{fontSize:11,color:T.muted,marginBottom:10}}>Preview: {mf.cal} kcal · {mf.p||0}P · {mf.c||0}C · {mf.g||0}G</div>}
            <button style={st.btn} onClick={addMan}>+ Añadir al Log</button>
          </>)}

          {/* ADD DB */}
          {mode==="adddb" && (<>
            <SH title="➕ Nuevo Alimento"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Nombre</span>
                <input style={st.inp} placeholder="Yogurt Griego Fage…" value={adb.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/></div>
              <div><span style={st.lbl}>Unidad</span>
                <input style={st.inp} placeholder="Taza / Scoop…" value={adb.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/></div>
              {[["Kcal","cal","100"],["Proteína","p","10"],["Carbos","c","10"],["Grasas","g","5"]].map(([l,k,ph])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder={ph} value={adb[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            <button style={st.btn} onClick={addToDb}>💾 Guardar en DB</button>
          </>)}

          {/* EDIT DB */}
          {mode==="editdb" && (<>
            <SH title={`🛠 Editar DB (${db.length})`}/>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f => dbEId===f.id ? (
                <EditRow key={f.id}
                  fields={[{k:"name",l:"Nombre"},{k:"unit",l:"Unidad"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
                  vals={dbER} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))} onSave={saveDbEd} onCancel={()=>setDbEId(null)} T={T}/>
              ) : (
                <div key={f.id} style={{ ...st.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{f.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div></div>
                  <div style={{display:"flex",gap:4}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setDbEId(f.id);setDbER({...f});}}>✏️</button>
                    <button style={st.icon(T.red)}    onClick={()=>setDb(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        {/* RIGHT — macro summary + today's log */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={st.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <span style={st.lbl}>Calorías hoy</span>
                <div style={{ fontSize:44, fontWeight:800, color:T.accent, lineHeight:1 }}>{today.calIn}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>meta: {goals.cal} kcal</div>
                <ProgBar value={today.calIn} max={goals.cal} color={today.calIn>goals.cal?T.red:T.accent} h={5}/>
              </div>
              {macros.length>0 && (
                <div style={{ width:76, height:76 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={macros} cx="50%" cy="50%" innerRadius={20} outerRadius={34} dataKey="v" strokeWidth={0} paddingAngle={2}>
                      {macros.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {/* Three macro cards — including fat with purple bar ✓ */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              <MacroCard label="Proteína" value={today.p} goal={goals.p}  baseColor={pCol(today.p,goals.p)}  overColor={T.red}  T={T}/>
              <MacroCard label="Carbos"   value={today.c} goal={goals.c}  baseColor={cCol(today.c,goals.c)}  overColor={T.red}  T={T}/>
              <MacroCard label="Grasas"   value={today.g} goal={gGoal}    baseColor={T.purple}               overColor={T.red}  T={T}/>
            </div>
          </div>

          {/* Food log */}
          <div style={{ ...st.card, flex:1 }}>
            <SH title="📋 Log de Hoy" right={<span style={{fontSize:11,color:T.muted}}>{todayFood.length} entradas</span>}/>
            {todayFood.length===0 ? (
              <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:16}}>Sin entradas — usa los modos arriba</div>
            ) : (
              <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {todayFood.map(f => lgEId===f.id ? (
                  <EditRow key={f.id}
                    fields={[{k:"name",l:"Descripción"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
                    vals={lgER} onChange={(k,v)=>setLgER(p=>({...p,[k]:v}))} onSave={saveLgEd} onCancel={()=>setLgEId(null)} T={T}/>
                ) : (
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:16, fontWeight:800, color:T.accent }}>{f.cal}</span>
                      <button style={st.icon(T.accent)} onClick={()=>{setLgEId(f.id);setLgER({name:f.name,cal:f.cal,p:f.p,c:f.c,g:f.g});}}>✏️</button>
                      <button style={st.icon(T.red)}    onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
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
// TAB: FUERZA
// ─────────────────────────────────────────────────────────────────────────────
function Fuerza({ strLog, setStr, program, setProg, plans, setPlans, T }) {
  const st = mkS(T);
  const [exSel,   setExSel]  = useState("");
  const [exCust,  setExCust] = useState("");
  const [form,    setForm]   = useState({ weight:"", reps:"", sets:"", rpe:"" });
  const [planOpen,setPlanO]  = useState(false);
  const [editId,  setEId]    = useState(null);
  const [editRow, setER]     = useState({});
  const isCustom = exSel === "__custom__";

  const addSet = () => {
    const name = isCustom ? exCust : exSel; if (!name) return;
    setStr(p=>[...p,{ ...form, exercise:name, date:TODAY, program, id:uid(),
      weight:+form.weight||0, reps:+form.reps||0, sets:+form.sets||0, rpe:+form.rpe||0 }]);
    setExSel(""); setExCust(""); setForm({ weight:"", reps:"", sets:"", rpe:"" });
  };
  const saveEd = () => { setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Program + plan editor */}
      <div style={st.card}>
        <SH title={<>🗓 Programa · <span style={{color:T.accent}}>{program}</span></>}
          right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.keys(PLANS).map(p=><button key={p} style={st.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>)}
          </div>}/>
        <button onClick={()=>setPlanO(o=>!o)} style={{ ...st.ghost(planOpen), marginBottom:planOpen?14:0 }}>
          {planOpen?"✕ Cerrar Editor":"⚙️ Configurar Plan Semanal"}
        </button>
        {planOpen && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{fontSize:12,color:T.muted}}>Los cambios se reflejan en el Dashboard.</div>
              <button onClick={()=>setPlans(p=>({...p,[program]:{...PLANS[program]}}))} style={{...st.ghost(false),fontSize:11,padding:"4px 12px"}}>↺ Restaurar</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day => {
                const isT=day===TODAY_DOW;
                return (
                  <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{fontSize:9,fontWeight:700,color:isT?T.accent:T.muted,letterSpacing:"0.09em"}}>{day.toUpperCase()}</span>
                      {isT&&<span style={{fontSize:8,background:T.navy,color:"#fff",borderRadius:999,padding:"2px 7px",fontWeight:700}}>HOY</span>}
                    </div>
                    <input value={plans[program]?.[day]||""} onChange={e=>setPlans(p=>({...p,[program]:{...p[program],[day]:e.target.value}}))}
                      style={{...st.inp,fontSize:12,padding:"7px 10px"}} placeholder="Ej: Pecho + Tríceps"/>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={st.g2}>
        {/* Set logger */}
        <div style={st.card}>
          <SH title="🏋️ Registrar Set"/>
          <div style={{marginBottom:10}}><span style={st.lbl}>Ejercicio</span>
            <select value={exSel} onChange={e=>setExSel(e.target.value)} style={st.sel}>
              <option value="" disabled>— Selecciona un ejercicio —</option>
              {Object.entries(EXERCISE_LIB).map(([cat,exs])=>(
                <optgroup key={cat} label={cat}>{exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}</optgroup>
              ))}
              <option value="__custom__">✏️ Otro / Personalizado</option>
            </select>
          </div>
          {isCustom && <div style={{marginBottom:10}}><span style={st.lbl}>Nombre del ejercicio</span>
            <input style={{...st.inp,borderColor:T.navy+"60"}} placeholder="Escribe el ejercicio…" value={exCust} onChange={e=>setExCust(e.target.value)}/></div>}
          {(exSel&&!isCustom) && <div style={{background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:12,color:T.accent}}>✓ {exSel}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Peso (kg)","weight","80"],["RPE (1–10)","rpe","8"],["Reps","reps","10"],["Series","sets","4"]].map(([l,k,ph])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
          </div>
          <button style={{...st.btn,opacity:(exSel&&!(isCustom&&!exCust))?1:0.4,cursor:(exSel&&!(isCustom&&!exCust))?"pointer":"not-allowed"}} onClick={addSet}>+ Registrar Set</button>
        </div>

        {/* History */}
        <div style={st.card}>
          <SH title="📊 Historial" right={<span style={{fontSize:11,color:T.muted}}>{strLog.length} sets</span>}/>
          {strLog.length===0 ? <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:30}}>Sin registros</div> : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:9, color:T.muted, fontWeight:700 }}>
              {["EJERCICIO","KG","REPS","SER","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:380, overflowY:"auto" }}>
              {[...strLog].reverse().map(l => editId===l.id ? (
                <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <EditRow fields={[{k:"exercise",l:"Ejercicio"},{k:"weight",l:"Peso kg",t:"number"},{k:"reps",l:"Reps",t:"number"},{k:"sets",l:"Series",t:"number"},{k:"rpe",l:"RPE",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ) : (
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"9px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, alignItems:"center", background:l.date===TODAY?T.accentDim:"transparent" }}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600,color:l.date===TODAY?T.accent:T.text}}>{l.exercise}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{l.weight}</span>
                  <span>{l.reps}</span><span>{l.sets}</span>
                  <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEId(l.id);setER({exercise:l.exercise,weight:l.weight,reps:l.reps,sets:l.sets,rpe:l.rpe});}}>✏️</button>
                    <button style={st.icon(T.red)}    onClick={()=>setStr(p=>p.filter(x=>x.id!==l.id))}>🗑</button>
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
// TAB: RUNNING
// ─────────────────────────────────────────────────────────────────────────────
function Running({ runs, setRuns, T }) {
  const st = mkS(T);
  const [form,   setForm]  = useState({ date:TODAY, km:"", time:"", lpm:"", ppm:"" });
  const [editId, setEId]   = useState(null);
  const [editRow,setER]    = useState({});
  const tip   = p => <ChartTip {...p} T={T}/>;
  const total = runs.reduce((s,r)=>s+r.km,0);

  const add = () => {
    if (!form.km||!form.time) return;
    setRuns(p=>[...p,{...form,km:+form.km,pace:calcPace(+form.km,form.time),id:uid()}]);
    setForm({date:TODAY,km:"",time:"",lpm:"",ppm:""});
  };
  const saveEd = () => { setRuns(p=>p.map(r=>r.id===editId?{...r,...editRow,km:+editRow.km,pace:calcPace(+editRow.km,editRow.time)}:r)); setEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Track */}
      <div style={{ ...st.card, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <SH title="🏟 Pista Atletismo · Half Marathon de la Prensa"
          right={<span style={{fontSize:11,color:T.muted}}>{total.toFixed(1)} / 21.1 km</span>}/>
        <AthleticsTrack totalKM={total} goalKM={21.1} T={T}/>
      </div>

      <div style={st.g2}>
        {/* Form */}
        <div style={st.card}>
          <SH title="➕ Registrar Carrera"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[["Fecha","date","date",TODAY],["Distancia (km)","km","number","10.0"],["Tiempo (hh:mm:ss)","time","text","1:00:00"],["LPM (FC media)","lpm","number","150"],["PPM (Cadencia)","ppm","number","170"]].map(([l,k,t,ph])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type={t} placeholder={ph} step={k==="km"?"0.1":undefined} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div><span style={st.lbl}>Pace calculado</span>
              <div style={{ fontSize:24, fontWeight:800, color:T.accent, paddingTop:8 }}>{calcPace(+form.km,form.time)}</div>
            </div>
          </div>
          <button style={st.btn} onClick={add}>+ Registrar Carrera</button>
        </div>

        {/* Chart + list */}
        <div style={st.card}>
          <SH title="📈 Progresión" right={<span style={{fontSize:11,color:T.muted}}>{runs.length} carreras</span>}/>
          {runs.length<2 ? <Placeholder T={T} msg="Registra carreras para la gráfica"/>
          : (
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={runs} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <div key={r.id} style={{marginBottom:8}}>
                  <EditRow fields={[{k:"date",l:"Fecha",t:"date"},{k:"km",l:"KM",t:"number",step:"0.1"},{k:"time",l:"Tiempo"},{k:"lpm",l:"LPM",t:"number"},{k:"ppm",l:"PPM",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ) : (
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, fontSize:11, alignItems:"center" }}>
                  <span style={{color:T.muted,minWidth:38}}>{r.date.slice(5)}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{r.km}km</span>
                  <span style={{color:T.muted}}>{r.time}</span>
                  <span style={{color:T.teal,fontWeight:600}}>{r.pace}</span>
                  <span style={{color:T.muted}}>{r.lpm?`${r.lpm}lpm`:"—"}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEId(r.id);setER({date:r.date,km:r.km,time:r.time,lpm:r.lpm||"",ppm:r.ppm||""});}}>✏️</button>
                    <button style={st.icon(T.red)}    onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
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
// TAB: BIOMETRÍA  — gradient AreaChart + CRUD table
// ─────────────────────────────────────────────────────────────────────────────
function Biometria({ bios, setBios, T }) {
  const st = mkS(T);
  const [form,   setForm]  = useState({ date:TODAY, height:"", weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" });
  const [editId, setEId]   = useState(null);
  const [editRow,setER]    = useState({});
  const tip = p => <ChartTip {...p} T={T}/>;

  const last  = bios[bios.length-1];
  const first = bios[0];
  const delta = last&&first ? (last.weight-first.weight).toFixed(1) : null;
  const trend = bios.map(b=>({ date:b.date, Peso:b.weight, Grasa:b.fat, Músculo:b.muscle, Agua:b.water }));

  const add = () => {
    if (!form.weight) return;
    setBios(p=>[...p,{ ...form, id:uid(), weight:+form.weight, fat:+form.fat||null, muscle:+form.muscle||null,
      visceral:+form.visceral||null, water:+form.water||null, protein:+form.protein||null, dmr:+form.dmr||null,
      imc:form.height?calcIMC(+form.weight,+form.height):null }]);
    setForm(p=>({date:TODAY,height:p.height,weight:"",fat:"",muscle:"",visceral:"",water:"",protein:"",dmr:""}));
  };
  const saveEd = () => {
    setBios(p=>p.map(b=>b.id===editId?{...b,...editRow,weight:+editRow.weight,fat:+editRow.fat||null,
      muscle:+editRow.muscle||null,visceral:+editRow.visceral||null,water:+editRow.water||null,
      protein:+editRow.protein||null,dmr:+editRow.dmr||null,imc:editRow.height?calcIMC(+editRow.weight,+editRow.height):b.imc}:b));
    setEId(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.g2}>
        {/* Form */}
        <div style={st.card}>
          <SH title="⚖️ Registro Steren"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div><span style={st.lbl}>Fecha</span><input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><span style={st.lbl}>Estatura (cm)</span><input style={st.inp} type="number" placeholder="175" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/></div>
            {[["Peso (kg) *","weight","75.5",T.accent],["% Grasa","fat","18.5",T.red],["Masa Muscular kg","muscle","58.2",T.green],["Grasa Visceral","visceral","6",T.orange],["Agua %","water","55.3",T.blue],["Proteína %","protein","17.5",T.purple],["DMR/TMB kcal","dmr","1850",T.muted]].map(([l,k,ph,c])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={{...st.inp,borderColor:`${c}55`}} type="number" step="0.1" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div><span style={st.lbl}>IMC (auto)</span>
              <div style={{...st.inp,color:(form.height&&form.weight)?T.accent:T.muted,fontWeight:700,pointerEvents:"none"}}>
                {(form.height&&form.weight)?calcIMC(+form.weight,+form.height):"—"}
              </div>
            </div>
          </div>
          <button style={st.btn} onClick={add}>+ Registrar Medición</button>
        </div>

        {/* Latest + evolution chart */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {last && (
            <div style={st.card}>
              <SH title={`📊 Última · ${last.date.slice(5)}`}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(88px,1fr))", gap:8 }}>
                {[{l:"Peso",v:`${last.weight}kg`,c:T.accent},
                  {l:"IMC",v:last.imc??"—",c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},
                  {l:"% Grasa",v:last.fat?`${last.fat}%`:"—",c:T.red},
                  {l:"Músculo",v:last.muscle?`${last.muscle}kg`:"—",c:T.green},
                  {l:"Visceral",v:last.visceral?`Nv${last.visceral}`:"—",c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted},
                  {l:"Agua",v:last.water?`${last.water}%`:"—",c:T.blue},
                  {l:"Proteína",v:last.protein?`${last.protein}%`:"—",c:T.purple},
                  {l:"DMR/TMB",v:last.dmr||"—",c:T.orange},
                  {l:"Δ Peso",v:delta?`${delta>0?"+":""}${delta}kg`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                  <div key={m.l} style={{background:T.card2,borderRadius:12,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:"0.07em"}}>{m.l.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:800,color:m.c,marginTop:3}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gradient multi-series AreaChart ✓ */}
          <div style={{...st.card,flex:1}}>
            <SH title="📈 Evolución"/>
            {bios.length<2 ? <Placeholder T={T} msg="Registra 2+ mediciones"/> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{top:4,right:4,bottom:0,left:-22}}>
                  <defs>
                    {[["wg",T.accent],["gg",T.red],["mg",T.green],["ag",T.blue]].map(([id,c])=>(
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c} stopOpacity={0.28}/>
                        <stop offset="95%" stopColor={c} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:9}} domain={["auto","auto"]}/>
                  <Tooltip content={tip}/>
                  <Area type="monotone" dataKey="Peso"    stroke={T.accent} fill="url(#wg)" strokeWidth={2.5} dot={{fill:T.accent,r:4}}/>
                  <Area type="monotone" dataKey="Grasa"   stroke={T.red}    fill="url(#gg)" strokeWidth={2}   dot={{fill:T.red,   r:3}}/>
                  <Area type="monotone" dataKey="Músculo" stroke={T.green}  fill="url(#mg)" strokeWidth={2}   dot={{fill:T.green, r:3}}/>
                  <Area type="monotone" dataKey="Agua"    stroke={T.blue}   fill="url(#ag)" strokeWidth={2}   dot={{fill:T.blue,  r:3}}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CRUD history table */}
      {bios.length>0 && (
        <div style={{...st.card,overflowX:"auto"}}>
          <SH title="📋 Historial Biométrico" right={<span style={{fontSize:11,color:T.muted}}>{bios.length} registros</span>}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:700 }}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                {["Fecha","Peso","IMC","% Grasa","Músculo","Visceral","Agua %","Prot %","DMR",""].map(h=>(
                  <th key={h} style={{padding:"7px 8px",color:T.muted,fontWeight:700,fontSize:9,textAlign:h===""?"center":"right",letterSpacing:"0.07em"}}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...bios].reverse().map(b => editId===b.id ? (
                <tr key={b.id}><td colSpan={10} style={{padding:"8px 0"}}>
                  <EditRow
                    fields={[{k:"date",l:"Fecha",t:"date"},{k:"weight",l:"Peso kg",t:"number",step:"0.1"},{k:"fat",l:"% Grasa",t:"number",step:"0.1"},{k:"muscle",l:"Músculo kg",t:"number",step:"0.1"},{k:"visceral",l:"Visceral",t:"number"},{k:"water",l:"Agua %",t:"number",step:"0.1"},{k:"protein",l:"Prot %",t:"number",step:"0.1"},{k:"dmr",l:"DMR kcal",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </td></tr>
              ) : (
                <tr key={b.id} style={{borderBottom:`1px solid ${T.border}`,background:b.date===TODAY?T.accentDim:"transparent"}}>
                  {[b.date.slice(5),`${b.weight}kg`,b.imc??"—",b.fat?`${b.fat}%`:"—",b.muscle?`${b.muscle}kg`:"—",b.visceral?`Nv${b.visceral}`:"—",b.water?`${b.water}%`:"—",b.protein?`${b.protein}%`:"—",b.dmr||"—"].map((v,i)=>(
                    <td key={i} style={{padding:"9px 8px",textAlign:i===0?"left":"right",color:i===0?T.text:T.muted,fontWeight:i===0?600:400}}>{v}</td>
                  ))}
                  <td style={{padding:"9px 8px",textAlign:"center"}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEId(b.id);setER({date:b.date,weight:b.weight,fat:b.fat||"",muscle:b.muscle||"",visceral:b.visceral||"",water:b.water||"",protein:b.protein||"",dmr:b.dmr||""});}}>✏️</button>
                    <button style={st.icon(T.red)}    onClick={()=>setBios(p=>p.filter(x=>x.id!==b.id))}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: HÁBITOS
// ─────────────────────────────────────────────────────────────────────────────
function Habitos({ habits, setHab, T }) {
  const st   = mkS(T);
  const done  = Object.values(habits).filter(Boolean).length;
  const total = Object.keys(habits).length;
  return (
    <div style={st.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:700 }}>✅ Hábitos Diarios</div>
        <div style={{ fontSize:30, fontWeight:800, color:done===total?T.accent:T.text }}>{done}/{total}</div>
      </div>
      <ProgBar value={done} max={total} color={T.navy} h={5}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:10, marginTop:18 }}>
        {Object.entries(habits).map(([h,v])=>(
          <button key={h} onClick={()=>setHab(p=>({...p,[h]:!p[h]}))}
            style={{ background:v?T.accentDim:T.card2, border:`1.5px solid ${v?T.accent:T.border}`, borderRadius:16, padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.2s", fontFamily:"system-ui", color:T.text }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{v?"✅":"⭕"}</div>
            <div style={{ fontSize:13, fontWeight:600, color:v?T.accent:T.text }}>{h}</div>
          </button>
        ))}
      </div>
      {done===total&&<div style={{ marginTop:18, textAlign:"center", background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:14, padding:14, fontWeight:700, color:T.accent }}>🎉 ¡Día perfecto! Todos los hábitos completados</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP  — localStorage persistence + lazy init
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Google Font ────────────────────────────────────────────────────────────
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap";
    l.rel  = "stylesheet";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(_){} };
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setDark] = useState(() => lsGet("dark", true));
  const T = isDark ? DARK : LIGHT;

  // ── State — lazy init from localStorage, seed-data fallback ────────────────
  const [tab,       setTab]  = useState("dashboard");
  const [healthLog, setHL]   = useState(() => lsGet("hl",    SEED_HEALTH));
  const [foodLog,   setFL]   = useState(() => lsGet("fl",    []));
  const [db,        setDb]   = useState(() => lsGet("db",    SEED_DB));
  const [strLog,    setStr]  = useState(() => lsGet("str",   []));
  const [runs,      setRuns] = useState(() => lsGet("runs",  []));
  const [bios,      setBios] = useState(() => lsGet("bios",  []));
  const [habits,    setHab]  = useState(() => lsGet("hab",   { "💧 Agua (3L)":false,"😴 Sueño (8h)":false,"🥩 Proteína meta":false,"🏃 Cardio":false,"🧘 Meditación":false,"🤸 Stretching":false }));
  const [goals,     setGoals]= useState(() => lsGet("goals", {...DEFAULT_GOALS}));
  const [program,   setProg] = useState(() => lsGet("prog",  "Hipertrofia"));
  const [plans,     setPlans]= useState(() => lsGet("plans", Object.fromEntries(Object.entries(PLANS).map(([k,v])=>[k,{...v}]))));

  // ── Auto-save to localStorage on every state change ────────────────────────
  useEffect(() => { lsSet("dark",  isDark);    }, [isDark]);
  useEffect(() => { lsSet("hl",    healthLog);  }, [healthLog]);
  useEffect(() => { lsSet("fl",    foodLog);    }, [foodLog]);
  useEffect(() => { lsSet("db",    db);         }, [db]);
  useEffect(() => { lsSet("str",   strLog);     }, [strLog]);
  useEffect(() => { lsSet("runs",  runs);       }, [runs]);
  useEffect(() => { lsSet("bios",  bios);       }, [bios]);
  useEffect(() => { lsSet("hab",   habits);     }, [habits]);
  useEffect(() => { lsSet("goals", goals);      }, [goals]);
  useEffect(() => { lsSet("prog",  program);    }, [program]);
  useEffect(() => { lsSet("plans", plans);      }, [plans]);

  // ── Import JSON ────────────────────────────────────────────────────────────
  const importRef = useRef(null);
  const handleImport = useCallback(e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const d = JSON.parse(evt.target.result);
        // Apply all fields — each setter also triggers the auto-save effect above
        if (Array.isArray(d.healthLog))   setHL(d.healthLog);
        if (Array.isArray(d.foodLog))     setFL(d.foodLog);
        if (Array.isArray(d.nutritionDB)) setDb(d.nutritionDB);
        if (Array.isArray(d.strengthLog)) setStr(d.strengthLog);
        if (Array.isArray(d.runs))        setRuns(d.runs);
        if (Array.isArray(d.biometrics))  setBios(d.biometrics);
        if (d.habits && typeof d.habits==="object") setHab(d.habits);
        if (d.goals  && typeof d.goals==="object")  setGoals(d.goals);
        if (typeof d.program==="string")  setProg(d.program);
        if (d.weeklyPlans && typeof d.weeklyPlans==="object") setPlans(d.weeklyPlans);
        alert("✅ Importación exitosa — todos los datos cargados.");
      } catch(err) { alert("❌ Archivo inválido: " + err.message); }
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-import of same file
  }, []);

  // ── Export JSON ────────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const data = { healthLog, foodLog, nutritionDB:db, strengthLog:strLog, runs, biometrics:bios,
      habits, goals, program, weeklyPlans:plans, exportedAt:new Date().toISOString() };
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download = `aristeia_${TODAY}.json`;
    a.click();
  }, [healthLog, foodLog, db, strLog, runs, bios, habits, goals, program, plans]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const getDayData = useCallback((date) => {
    const h   = healthLog.find(d=>d.date===date) || {};
    const fs  = foodLog.filter(f=>f.date===date);
    const hasF = fs.length > 0;
    const calIn = hasF ? fs.reduce((s,f)=>s+f.cal,0) : (h.calIn||0);
    const p  = hasF ? r1(fs.reduce((s,f)=>s+f.p,0)) : (h.p||0);
    const c  = hasF ? r1(fs.reduce((s,f)=>s+f.c,0)) : (h.c||0);
    const g  = hasF ? r1(fs.reduce((s,f)=>s+f.g,0)) : (h.g||0);
    return { date, calOut:h.calOut||0, calIn, p, c, g,
      sleep:h.sleep||null, score:h.score||null, steps:h.steps||null,
      balance:calIn-(h.calOut||0), goals:h.goals||{...DEFAULT_GOALS} };
  }, [healthLog, foodLog]);

  const allDates  = useMemo(()=>{ const s=new Set([...healthLog.map(h=>h.date),...foodLog.map(f=>f.date),TODAY]); return [...s].sort().reverse().slice(0,14); }, [healthLog,foodLog]);
  const weekData  = useMemo(()=>allDates.map(d=>getDayData(d)),    [allDates,getDayData]);
  const last7     = useMemo(()=>weekData.slice(0,7).reverse(),     [weekData]);
  const today     = useMemo(()=>getDayData(TODAY),                 [getDayData]);
  const todayFood = useMemo(()=>foodLog.filter(f=>f.date===TODAY), [foodLog]);

  // ── Nav ────────────────────────────────────────────────────────────────────
  const st   = mkS(T);
  const TABS = [
    {id:"dashboard",l:"📊 Dashboard"},{id:"dailylog",l:"📋 Daily Log"},
    {id:"nutricion",l:"🥗 Nutrición"},{id:"fuerza",l:"🏋️ Fuerza"},
    {id:"running",l:"🏃 Running"},{id:"bio",l:"⚖️ Biometría"},{id:"habits",l:"✅ Hábitos"},
  ];
  const bCol = b => b<0?T.green:b<300?T.accent:T.red;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", color:T.text, padding:"16px 18px", transition:"background 0.3s, color 0.3s" }}>
      {/* Hidden file input — import */}
      <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display:"none" }}/>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:isDark?T.accent:T.navy, letterSpacing:"-1px", lineHeight:1 }}>
            ☎️ IN <span style={{ color:T.muted, fontSize:11, fontWeight:500 }}>v6</span>
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{TODAY} · {program}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {today.calIn>0 && (
            <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, color:T.accent, fontWeight:700, boxShadow:T.shadow }}>
              {today.calIn} kcal in
            </div>
          )}
          {today.calOut>0 && (
            <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, fontWeight:700, color:bCol(today.balance), boxShadow:T.shadow }}>
              {today.balance>0?"+":""}{today.balance} bal
            </div>
          )}
          <button onClick={()=>setDark(d=>!d)} style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"7px 16px", cursor:"pointer", fontSize:12, color:T.text, fontWeight:600, boxShadow:T.shadow }}>
            {isDark?"☀️ Light":"🌙 Dark"}
          </button>
          {/* Import — triggers hidden file input */}
          <button onClick={()=>importRef.current?.click()} style={{ background:T.card2, color:T.text, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ↑ Importar
          </button>
          {/* Export */}
          <button onClick={exportJSON} style={{ background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ↓ JSON
          </button>
          {/* Reset (dev helper) */}
          <button onClick={()=>{ if(confirm("¿Borrar TODOS los datos?")){ lsClear(); location.reload(); } }}
            style={{ background:"none", color:T.red, border:`1px solid ${T.red}40`, borderRadius:999, padding:"7px 14px", fontSize:11, cursor:"pointer", fontWeight:600 }}>
            🗑 Reset
          </button>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?T.navy:T.card, color:tab===t.id?"#fff":T.text,
            border:`1.5px solid ${tab===t.id?T.navy:T.border}`,
            borderRadius:999, padding:"8px 16px", fontWeight:600, fontSize:12,
            cursor:"pointer", transition:"all 0.2s", boxShadow:tab===t.id?"none":T.shadow,
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── CONTENT — stable component tree, no inline definitions ─────── */}
      {tab==="dashboard" && <Dashboard today={today} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setTab={setTab} T={T}/>}
      {tab==="dailylog"  && <DailyLog  weekData={weekData} setHL={setHL} goals={goals} setGoals={setGoals} T={T}/>}
      {tab==="nutricion" && <Nutricion today={today} todayFood={todayFood} setFL={setFL} db={db} setDb={setDb} goals={goals} T={T}/>}
      {tab==="fuerza"    && <Fuerza    strLog={strLog} setStr={setStr} program={program} setProg={setProg} plans={plans} setPlans={setPlans} T={T}/>}
      {tab==="running"   && <Running   runs={runs} setRuns={setRuns} T={T}/>}
      {tab==="bio"       && <Biometria bios={bios} setBios={setBios} T={T}/>}
      {tab==="habits"    && <Habitos   habits={habits} setHab={setHab} T={T}/>}
    </div>
  );
}