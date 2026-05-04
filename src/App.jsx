import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#0A0A0A", card:"#141414", card2:"#1C1C1C", card3:"#242424",
  accent:"#FFD700", accentDim:"rgba(255,215,0,0.10)",
  navy:"#001F3F",
  text:"#F2F2F2", muted:"#666", border:"#252525", inputBg:"#181818",
  green:"#34D399", red:"#F87171", blue:"#60A5FA",
  purple:"#C084FC", orange:"#FB923C", teal:"#2DD4BF",
  shadow:"0 0 0 1px #252525",
};
const LIGHT = {
  bg:"#F7F8FA", card:"#FFFFFF", card2:"#F2F4F7", card3:"#E8ECF0",
  accent:"#D4A017", accentDim:"rgba(212,160,23,0.10)",
  navy:"#001F3F",
  text:"#0D0D0D", muted:"#8A8F98", border:"#E4E7EC", inputBg:"#FFFFFF",
  green:"#059669", red:"#DC2626", blue:"#2563EB",
  purple:"#7C3AED", orange:"#EA580C", teal:"#0D9488",
  shadow:"0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",    Vie:"Upper Compuesto",       Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  Fuerza:     { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",       Vie:"OHP + Accesorios",      Sáb:"Cardio LISS",      Dom:"🔋 Descanso" },
  Definición: { Lun:"Full Body A",     Mar:"HIIT 30min",        Mié:"Full Body B",        Jue:"LISS 45min",        Vie:"Full Body C + Cardio",  Sáb:"HIIT 30min",       Dom:"🔋 Descanso" },
  Power:      { Lun:"Potencia Sup.",   Mar:"Potencia Inf.",      Mié:"🔋 Descanso",       Jue:"Olímpicos+Fuerza", Vie:"Pliometría+Velocidad",  Sáb:"LISS",             Dom:"🔋 Descanso" },
};
const PLAN_KEYS  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TODAY_DOW  = PLAN_KEYS[new Date().getDay()===0 ? 6 : new Date().getDay()-1];
const EXERCISE_LIBRARY = {
  "🫁 Pecho":   ["Press Banca","Press Inclinado","Press Declinado","Aperturas con Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "🔙 Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "🦵 Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "💪 Brazos":  ["Curl de Bíceps con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea"],
  "🏔 Hombros": ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Encogimientos"],
  "⚡ Core":    ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel"],
  "🏃 Cardio":  ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Escaladora"],
};
const TODAY         = new Date().toISOString().split("T")[0];
const DEFAULT_GOALS = { cal:2200, p:180, c:280, g:60 };
const GOAL_G        = 60; // grasas meta diaria
const SEED_HEALTH   = [
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
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid      = () => Date.now() + Math.random();
const r1       = n  => Math.round(n*10)/10;
const fmt      = (n,d=1) => (n==null||isNaN(n)) ? "—" : Number(n).toFixed(d);
const clamp    = (v,g)   => Math.min(Math.round((v/g)*100),100);
const calcPace = (km,t)  => {
  if (!km||!t) return "--:--";
  const p = t.split(":").map(Number);
  const s = p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps = s/km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg,cm) => cm ? r1(kg/((cm/100)**2)) : null;

// ─────────────────────────────────────────────────────────────────────────────
// STYLE FACTORY
// ─────────────────────────────────────────────────────────────────────────────
function S(T) {
  const svgArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
  return {
    card:    { background:T.card,  borderRadius:20, padding:20, color:T.text, boxShadow:T.shadow, fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif" },
    card2:   { background:T.card2, borderRadius:14, padding:14, color:T.text, fontFamily:"system-ui" },
    lbl:     { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, display:"block", fontWeight:600 },
    inp:     { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", transition:"border-color 0.15s" },
    sel:     { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 34px 9px 13px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", appearance:"none", WebkitAppearance:"none", backgroundImage:svgArrow, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:     { background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"system-ui", width:"100%" },
    btnSm:   { background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"7px 16px", fontWeight:600, fontSize:12, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap" },
    ghost:   (a) => ({ background:a?T.navy:"transparent", color:a?"#fff":T.navy, border:`1.5px solid ${T.navy}`, borderRadius:999, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap", transition:"all 0.15s" }),
    iconBtn: (c) => ({ background:"none", border:"none", cursor:"pointer", color:c||T.muted, padding:"3px 6px", borderRadius:6, fontSize:13, lineHeight:1, display:"inline-flex", alignItems:"center" }),
    grid2:   { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
    mono:    { fontFamily:"'DM Mono','SF Mono',monospace" },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, T }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 12px", boxShadow:T.shadow, fontSize:12, fontFamily:"system-ui" }}>
      {payload.map((p,i)=>(
        <div key={i} style={{ color:p.color }}>{p.name}: <b>{fmt(p.value)}</b></div>
      ))}
    </div>
  );
}

function SH({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:14, fontWeight:700 }}>{title}</div>
      {right}
    </div>
  );
}

function ProgBar({ value, max, color, height=4 }) {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{ height, borderRadius:height, overflow:"hidden", background:"rgba(128,128,128,0.15)", marginTop:5 }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:height, transition:"width 0.4s" }}/>
    </div>
  );
}

function MacroCard({ label, value, goal, color, T }) {
  const st = S(T);
  const over = goal && value > goal;
  return (
    <div style={{ background:T.card2, borderRadius:12, padding:10, textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:800, color }}>{Math.round(value)}</div>
      <div style={{ fontSize:10, color:T.muted }}>{label}{goal?` /${goal}g`:"g"}</div>
      {goal && <ProgBar value={value} max={goal} color={over?T.red:color}/>}
    </div>
  );
}

function EditRow({ fields, values, onChange, onSave, onCancel, T }) {
  const st = S(T);
  return (
    <div style={{ ...st.card2, border:`1.5px solid ${T.accent}40`, gap:8, display:"flex", flexDirection:"column", padding:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f=>(
          <div key={f.key}>
            <span style={st.lbl}>{f.label}</span>
            <input style={st.inp} type={f.type||"text"} step={f.step} value={values[f.key]??""} onChange={e=>onChange(f.key,e.target.value)}/>
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

// ─────────────────────────────────────────────────────────────────────────────
// RUNNING TRACK SVG
// ─────────────────────────────────────────────────────────────────────────────
function AthleticsTrack({ totalKM, goalKM=21.1, T }) {
  const pct     = Math.min(totalKM / goalKM, 1);
  const W=520, H=180, rx=68, ry=62, cx=260, cy=90;
  // Track path: two straights + two semicircles, approximated as an ellipse-like oval
  const trackW = W - 60, trackH = H - 30;
  const tx=30, ty=15, trx=(trackW-2*ry)/2, outerRx=trx+ry, outerRy=trackH/2;
  // Perimeter of oval ≈ 2*π*sqrt((a²+b²)/2) for ellipse — we use a fixed oval
  // Represent track as path around a rectangle with rounded corners
  // Inner oval: rx=trx, ry=ry; center=(cx,cy)
  const laneW   = 14;
  // Runner position on a simplified circular path
  const angle   = pct * 2 * Math.PI - Math.PI/2; // start top
  const runnerX = cx + (trx + laneW/2) * Math.cos(angle);
  const runnerY = cy + (outerRy - laneW/2) * Math.sin(angle);

  const lanes = [0,1,2];
  const milestones = [
    { km:5,  label:"5K"  },
    { km:10, label:"10K" },
    { km:15, label:"15K" },
    { km:21.1, label:"🏁" },
  ];

  return (
    <div style={{ position:"relative", width:"100%", maxWidth:520 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", overflow:"visible" }}>
        <defs>
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={T.card3}/>
            <stop offset="100%" stopColor={T.card2}/>
          </linearGradient>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={T.green}/>
            <stop offset="60%" stopColor={T.accent}/>
            <stop offset="100%" stopColor={T.orange}/>
          </linearGradient>
          {/* Glow filter for runner */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Track surface */}
        {lanes.map((l,i)=>{
          const rxi = trx + (l+0.5)*laneW;
          const ryi = outerRy - (l+0.5)*laneW + (l+0.5)*laneW;
          return null; // we draw as nested ellipses below
        })}

        {/* Outer track */}
        <ellipse cx={cx} cy={cy} rx={trx+3*laneW} ry={outerRy} fill="url(#trackGrad)" stroke={T.border} strokeWidth={1.5}/>
        {/* Lane lines */}
        {[1,2].map(l=>(
          <ellipse key={l} cx={cx} cy={cy} rx={trx+(3-l)*laneW} ry={outerRy-l*laneW+l*laneW*0.3} fill="none" stroke={T.border} strokeWidth={0.8} strokeDasharray="4 4"/>
        ))}
        {/* Inner field */}
        <ellipse cx={cx} cy={cy} rx={trx} ry={outerRy - 3*laneW} fill={T.card} stroke={T.border} strokeWidth={1}/>

        {/* Inner field label */}
        <text x={cx} y={cy-8} textAnchor="middle" fill={T.muted} fontSize={10} fontFamily="system-ui" fontWeight={600}>
          HALF MARATHON
        </text>
        <text x={cx} y={cy+10} textAnchor="middle" fill={T.accent} fontSize={20} fontFamily="system-ui" fontWeight={800}>
          {totalKM.toFixed(1)}
        </text>
        <text x={cx} y={cy+26} textAnchor="middle" fill={T.muted} fontSize={10} fontFamily="system-ui">
          / {goalKM} km
        </text>

        {/* Milestone dots */}
        {milestones.map(m=>{
          const a = (m.km/goalKM)*2*Math.PI - Math.PI/2;
          const mx = cx + (trx+1.5*laneW)*Math.cos(a);
          const my = cy + (outerRy-1.5*laneW+1.5*laneW*0.3)*Math.sin(a);
          return (
            <g key={m.km}>
              <circle cx={mx} cy={my} r={5} fill={T.navy} stroke={T.accent} strokeWidth={1.5}/>
              <text x={mx} y={my-9} textAnchor="middle" fill={T.muted} fontSize={8} fontFamily="system-ui">{m.label}</text>
            </g>
          );
        })}

        {/* Progress arc — draw partial ellipse using stroke-dasharray */}
        <ellipse
          cx={cx} cy={cy}
          rx={trx+1.5*laneW} ry={outerRy-1.5*laneW+1.5*laneW*0.3}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth={laneW}
          strokeDasharray={`${pct * 2 * Math.PI * Math.max(trx+1.5*laneW, 1)} 9999`}
          strokeDashoffset={Math.PI/2 * Math.max(trx+1.5*laneW, 1)}
          strokeLinecap="round"
          opacity={0.75}
        />

        {/* Runner emoji */}
        {pct > 0 && (
          <text
            x={runnerX} y={runnerY+6}
            textAnchor="middle"
            fontSize={20}
            filter="url(#glow)"
            style={{ userSelect:"none" }}
          >
            🏃
          </text>
        )}

        {/* Start/Finish flag */}
        <text x={cx} y={cy - outerRy + 6} textAnchor="middle" fontSize={14}>🚦</text>
      </svg>

      {/* Progress label below */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4, fontSize:11, color:T.muted, fontFamily:"system-ui" }}>
        <span>Inicio</span>
        <span style={{ color:T.accent, fontWeight:700, fontSize:13 }}>{Math.round(pct*100)}% completado</span>
        <span>🏁 {goalKM}km</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ today, weekData, last7, goals, program, plans, setTab, T }) {
  const st  = S(T);
  const tip = props => <ChartTip {...props} T={T}/>;
  const pCol = (v,g) => v>=g ? T.green : v>=g*.8 ? T.accent : T.red;
  const cCol = (v,g) => v>g  ? T.red   : v>g*.85 ? T.accent : T.green;
  const bCol = b => b<0 ? T.green : b<300 ? T.accent : T.red;
  const sCol = s => s>=7 ? T.green : s>=6 ? T.accent : T.red;
  const scCol= s => s>=85? T.green : s>=70? T.accent : T.red;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(115px,1fr))", gap:10 }}>
        {[
          { l:"Cal In",   v:today.calIn||"—",  s:"kcal",        c:T.accent },
          { l:"Cal Out",  v:today.calOut||"—", s:"kcal quem.",  c:T.blue   },
          { l:"Balance",  v:today.calOut>0?(today.balance>0?`+${today.balance}`:today.balance):"—",
                          s:today.balance<0?"déficit ✓":"superávit",
                          c:today.calOut>0?bCol(today.balance):T.muted },
          { l:"Proteína", v:today.p?`${Math.round(today.p)}g`:"—", s:`meta ${goals.p}g`, c:today.p?pCol(today.p,goals.p):T.muted },
          { l:"Sueño",    v:today.sleep?`${fmt(today.sleep,2)}h`:"—", s:`score ${today.score||"—"}%`, c:today.sleep?sCol(today.sleep):T.muted },
          { l:"Pasos",    v:today.steps?today.steps.toLocaleString():"—", s:"hoy", c:T.purple },
        ].map(m=>(
          <div key={m.l} style={{ ...st.card, padding:14 }}>
            <div style={{ fontSize:9, color:T.muted, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>{m.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:m.c, lineHeight:1.2, margin:"4px 0 2px" }}>{m.v}</div>
            <div style={{ fontSize:10, color:T.muted }}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* 7-day table */}
      <div style={{ ...st.card, overflowX:"auto" }}>
        <SH title="📅 Historial · 7 días"
          right={<div style={{ display:"flex", gap:14, fontSize:9, color:T.muted }}>
            <span>P:<span style={{color:T.green}}> ≥meta ✓</span></span>
            <span>Bal:<span style={{color:T.green}}> déficit ✓</span></span>
          </div>}/>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"system-ui", minWidth:660 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {[["Fecha","l"],["Out","r"],["In","r"],["Bal","r"],["P","r"],["C","r"],["G","r"],["😴","r"],["Score","r"],["Pasos","r"]].map(([h,a])=>(
                <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:600, textAlign:a==="r"?"right":"left", fontSize:9, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d=>{
              const isT=d.date===TODAY, g=d.goals, bal=d.calIn-d.calOut, ho=d.calOut>0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background:isT?T.accentDim:"transparent" }}>
                  <td style={{ padding:"9px 8px", fontWeight:isT?700:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>{isT&&<span style={{marginRight:4}}>●</span>}{d.date.slice(5)}</td>
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
      <div style={st.grid2}>
        <div style={st.card}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📈 Proteína · 7 días</div>
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
          ) : <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra más días</div>}
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
                  {last7.filter(d=>d.calOut>0).map((d,i)=><Cell key={i} fill={d.balance<0?T.green:d.balance<300?T.accent:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra Cal Out en Daily Log</div>}
        </div>
      </div>

      {/* Plan widget */}
      <div style={st.card}>
        <SH title={<>🗓️ Plan Semanal · <span style={{color:T.accent}}>{program}</span></>}
          right={<button style={st.btnSm} onClick={()=>setTab("fuerza")}>⚙️ Editar →</button>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day=>{
            const label=plans[program]?.[day]||"—", isT=day===TODAY_DOW, isR=label.includes("Descanso");
            return (
              <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:700, color:isT?T.accent:T.muted, letterSpacing:"0.08em", marginBottom:6 }}>{day.toUpperCase()}</div>
                <div style={{ fontSize:11, fontWeight:600, color:isR?T.muted:T.text, lineHeight:1.4 }}>{label}</div>
                {isT&&<div style={{ marginTop:6, fontSize:9, background:T.navy, color:"#fff", borderRadius:999, padding:"2px 8px", display:"inline-block", fontWeight:700 }}>HOY</div>}
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
function DailyLog({ weekData, setHL, goals, setGoals, T }) {
  const st = S(T);
  const [form,setForm]     = useState({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  const [editG,setEditG]   = useState(false);
  const [editId,setEditId] = useState(null);
  const [editRow,setEditRow]= useState({});

  const bCol = b => b<0?T.green:b<300?T.accent:T.red;
  const sCol = s => s>=7?T.green:s>=6?T.accent:T.red;
  const scCol= s => s>=85?T.green:s>=70?T.accent:T.red;

  const upsert = entry => setHL(prev=>{
    const i=prev.findIndex(d=>d.date===entry.date);
    if(i>=0){const u=[...prev];u[i]={...u[i],...entry};return u;}
    return [...prev,entry];
  });
  const save = () => {
    if(!form.date) return;
    upsert({ date:form.date, ...(form.calOut&&{calOut:+form.calOut}), ...(form.steps&&{steps:+form.steps}),
      ...(form.sleep&&{sleep:+form.sleep}), ...(form.score&&{score:+form.score}), goals:{...goals} });
    setForm({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  };
  const rows = weekData.filter(d=>d.calOut>0||d.sleep||d.steps);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.card}>
        <SH title="🎯 Objetivos de Macros" right={<button style={st.btnSm} onClick={()=>setEditG(o=>!o)}>{editG?"✓ Listo":"✏️ Editar"}</button>}/>
        {editG ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
            {[["Cal Meta","cal"],["Proteína g","p"],["Carbos máx","c"],["Grasas g","g"]].map(([l,k])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" value={goals[k]} onChange={e=>setGoals(p=>({...p,[k]:+e.target.value}))}/>
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

      <div style={st.grid2}>
        <div style={st.card}>
          <SH title="📋 Registrar Día"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Fecha</span><input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            {[["Cal Quemadas (Out)","calOut","number","2895"],["Pasos","steps","number","8000"],["Horas de Sueño","sleep","number","7.57"],["Sleep Score %","score","number","81"]].map(([l,k,t,ph])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type={t} step={k==="sleep"?"0.01":"1"} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <button style={st.btn} onClick={save}>💾 Guardar</button>
        </div>

        <div style={st.card}>
          <SH title="🗂 Registros Recientes" right={<span style={{fontSize:11,color:T.muted}}>{rows.length} entradas</span>}/>
          <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:440, overflowY:"auto" }}>
            {rows.length===0 ? <div style={{color:T.muted,fontSize:12}}>Sin registros</div>
            : rows.map(d=>(
              <div key={d.date}>
                {editId===d.date ? (
                  <EditRow fields={[{key:"calOut",label:"Cal Out",type:"number"},{key:"steps",label:"Pasos",type:"number"},{key:"sleep",label:"Sueño h",type:"number",step:"0.01"},{key:"score",label:"Score %",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))}
                    onSave={()=>{ upsert({date:d.date,calOut:+editRow.calOut||0,steps:+editRow.steps||null,sleep:+editRow.sleep||null,score:+editRow.score||null}); setEditId(null); }}
                    onCancel={()=>setEditId(null)} T={T}/>
                ) : (
                  <div style={{ ...st.card2, borderLeft:`3px solid ${d.date===TODAY?T.accent:T.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:d.date===TODAY?T.accent:T.text }}>{d.date===TODAY?"● Hoy":d.date.slice(5)}</div>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {d.sleep&&<span style={{fontSize:11,color:sCol(d.sleep)}}>😴{fmt(d.sleep,2)}h</span>}
                        {d.score&&<span style={{fontSize:11,color:scCol(d.score),marginLeft:4}}>💤{d.score}%</span>}
                        <button style={st.iconBtn(T.accent)} onClick={()=>{setEditId(d.date);setEditRow({calOut:d.calOut||"",steps:d.steps||"",sleep:d.sleep||"",score:d.score||""});}}>✏️</button>
                        <button style={st.iconBtn(T.red)}    onClick={()=>setHL(p=>p.filter(x=>x.date!==d.date))}>🗑</button>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                      {[{l:"Out",v:d.calOut?`${d.calOut}`:"—",c:T.blue},{l:"In",v:d.calIn?`${d.calIn}`:"—",c:T.accent},{l:"Pasos",v:d.steps?d.steps.toLocaleString():"—",c:T.purple},{l:"Bal",v:(d.calOut&&d.calIn)?(d.balance>0?`+${d.balance}`:d.balance):"—",c:(d.calOut&&d.calIn)?bCol(d.balance):T.muted}].map(m=>(
                        <div key={m.l}><div style={{fontSize:9,color:T.muted,fontWeight:600}}>{m.l}</div><div style={{fontSize:13,fontWeight:700,color:m.c}}>{m.v}</div></div>
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
// NUTRICIÓN  — full-height DB list + fat progress bar
// ─────────────────────────────────────────────────────────────────────────────
function Nutricion({ today, todayFood, setFL, db, setDb, goals, T }) {
  const st = S(T);
  const [mode,setMode]       = useState("search");
  const [search,setSrch]     = useState("");
  const [selFood,setSel]     = useState(null);
  const [qty,setQty]         = useState(1);
  const [manForm,setMF]      = useState({ name:"",cal:"",p:"",c:"",g:"" });
  const [adbForm,setAdb]     = useState({ name:"",unit:"",cal:"",p:"",c:"",g:"" });
  const [dbEId,setDbEId]     = useState(null);
  const [dbER,setDbER]       = useState({});
  const [logEId,setLogEId]   = useState(null);
  const [logER,setLogER]     = useState({});

  const pCol = (v,g) => v>=g?T.green:v>=g*.8?T.accent:T.red;
  const cCol = (v,g) => v>g?T.red:v>g*.85?T.accent:T.green;
  const gMax = goals.g || GOAL_G;

  const filtered = db.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  const macros   = [{name:"Proteína",v:Math.round(today.p*4),c:T.green},{name:"Carbos",v:Math.round(today.c*4),c:T.blue},{name:"Grasas",v:Math.round(today.g*9),c:T.purple}].filter(d=>d.v>0);

  const addFromDB = () => { if(!selFood) return; setFL(p=>[...p,{date:TODAY,id:uid(),name:selFood.name,qty,cal:Math.round(selFood.cal*qty),p:r1(selFood.p*qty),c:r1(selFood.c*qty),g:r1(selFood.g*qty)}]); setSel(null);setQty(1);setSrch(""); };
  const addManual = () => { if(!manForm.cal) return; setFL(p=>[...p,{date:TODAY,id:uid(),name:manForm.name||"Log manual",qty:1,cal:+manForm.cal,p:+manForm.p||0,c:+manForm.c||0,g:+manForm.g||0}]); setMF({name:"",cal:"",p:"",c:"",g:""}); };
  const saveToDb  = () => { if(!adbForm.name||!adbForm.cal) return; setDb(p=>[...p,{id:uid(),name:adbForm.name,unit:adbForm.unit||"Porción",cal:+adbForm.cal,p:+adbForm.p||0,c:+adbForm.c||0,g:+adbForm.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEd  = () => { setDb(p=>p.map(f=>f.id===dbEId?{...f,...dbER,cal:+dbER.cal,p:+dbER.p,c:+dbER.c,g:+dbER.g}:f)); setDbEId(null); };
  const saveLogEd = () => { setFL(p=>p.map(f=>f.id===logEId?{...f,...logER,cal:+logER.cal,p:+logER.p||0,c:+logER.c||0,g:+logER.g||0}:f)); setLogEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","🔍 DB"],["manual","✏️ Manual"],["adddb","➕ Añadir"],["editdb","🛠 Editar DB"]].map(([id,label])=>(
          <button key={id} style={st.ghost(mode===id)} onClick={()=>{setMode(id);setDbEId(null);}}>{label}</button>
        ))}
      </div>

      {/* Two-column layout — left: input, right: summary + log */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,1.1fr) minmax(260px,1fr)", gap:16, alignItems:"start" }}>

        {/* LEFT — input panel full height */}
        <div style={{ ...st.card, display:"flex", flexDirection:"column", minHeight:480 }}>

          {/* Search mode */}
          {mode==="search" && (<>
            <SH title={`🔍 Base de Datos (${db.length})`}/>
            <input style={{ ...st.inp, marginBottom:10 }} placeholder="Buscar alimento…" value={search} onChange={e=>{setSrch(e.target.value);setSel(null);}}/>
            {/* Full-height scrollable list */}
            <div style={{ flex:1, overflowY:"auto", marginBottom:10, minHeight:0 }}>
              {filtered.map(f=>(
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"9px 12px", borderRadius:10, cursor:"pointer", marginBottom:4,
                  border:`1.5px solid ${selFood?.id===f.id?T.navy+"70":"transparent"}`,
                  background:selFood?.id===f.id?T.accentDim:"transparent", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
            {selFood && (
              <div style={{ ...st.card2, marginTop:"auto" }}>
                <div style={{ fontSize:12, color:T.accent, fontWeight:600, marginBottom:10 }}>{selFood.name}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
                    <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
                  <div style={{ fontSize:12, color:T.muted, paddingTop:16 }}>× {selFood.unit}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>
                  {Math.round(selFood.cal*qty)} kcal · {r1(selFood.p*qty)}P · {r1(selFood.c*qty)}C · {r1(selFood.g*qty)}G
                </div>
                <button style={st.btn} onClick={addFromDB}>+ Agregar al Log</button>
              </div>
            )}
          </>)}

          {/* Manual */}
          {mode==="manual" && (<>
            <SH title="✏️ Entrada Manual"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Descripción</span>
                <input style={st.inp} placeholder="Cena fuera · pollo y arroz…" value={manForm.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/></div>
              {[["Calorías *","cal","800"],["Proteína","p","40"],["Carbos","c","60"],["Grasas","g","20"]].map(([l,k,ph])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder={ph} value={manForm[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            {manForm.cal&&<div style={{fontSize:11,color:T.muted,marginBottom:10}}>Preview: {manForm.cal} kcal · {manForm.p||0}P · {manForm.c||0}C · {manForm.g||0}G</div>}
            <button style={st.btn} onClick={addManual}>+ Añadir al Log</button>
          </>)}

          {/* Add to DB */}
          {mode==="adddb" && (<>
            <SH title="➕ Nuevo Alimento"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Nombre</span>
                <input style={st.inp} placeholder="Yogurt Griego Fage…" value={adbForm.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/></div>
              <div><span style={st.lbl}>Unidad</span>
                <input style={st.inp} placeholder="Taza / Scoop…" value={adbForm.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/></div>
              {[["Calorías","cal","100"],["Proteína","p","10"],["Carbos","c","10"],["Grasas","g","5"]].map(([l,k,ph])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder={ph} value={adbForm[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            <button style={st.btn} onClick={saveToDb}>💾 Guardar en DB</button>
          </>)}

          {/* Edit DB */}
          {mode==="editdb" && (<>
            <SH title={`🛠 Editar DB (${db.length})`}/>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f=> dbEId===f.id ? (
                <EditRow key={f.id}
                  fields={[{key:"name",label:"Nombre"},{key:"unit",label:"Unidad"},{key:"cal",label:"Kcal",type:"number"},{key:"p",label:"P",type:"number"},{key:"c",label:"C",type:"number"},{key:"g",label:"G",type:"number"}]}
                  values={dbER} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))} onSave={saveDbEd} onCancel={()=>setDbEId(null)} T={T}/>
              ) : (
                <div key={f.id} style={{ ...st.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{f.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div></div>
                  <div style={{display:"flex",gap:4}}>
                    <button style={st.iconBtn(T.accent)} onClick={()=>{setDbEId(f.id);setDbER({...f});}}>✏️</button>
                    <button style={st.iconBtn(T.red)}    onClick={()=>setDb(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        {/* RIGHT — macro summary + today's log */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Macro summary */}
          <div style={st.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <span style={st.lbl}>Calorías hoy</span>
                <div style={{ fontSize:42, fontWeight:800, color:T.accent, lineHeight:1 }}>{today.calIn}</div>
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
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              <MacroCard label="Proteína" value={today.p} goal={goals.p} color={pCol(today.p,goals.p)} T={T}/>
              <MacroCard label="Carbos"   value={today.c} goal={goals.c} color={cCol(today.c,goals.c)} T={T}/>
              {/* Grasas with purple progress bar — previously missing */}
              <MacroCard label="Grasas"   value={today.g} goal={gMax}    color={today.g>gMax?T.red:T.purple} T={T}/>
            </div>
          </div>

          {/* Today's food log */}
          <div style={{ ...st.card, flex:1 }}>
            <SH title="📋 Log de Hoy" right={<span style={{fontSize:11,color:T.muted}}>{todayFood.length} entradas</span>}/>
            {todayFood.length===0 ? (
              <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:16}}>Sin entradas — usa los modos arriba</div>
            ) : (
              <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {todayFood.map(f=> logEId===f.id ? (
                  <EditRow key={f.id}
                    fields={[{key:"name",label:"Descripción"},{key:"cal",label:"Kcal",type:"number"},{key:"p",label:"P",type:"number"},{key:"c",label:"C",type:"number"},{key:"g",label:"G",type:"number"}]}
                    values={logER} onChange={(k,v)=>setLogER(p=>({...p,[k]:v}))} onSave={saveLogEd} onCancel={()=>setLogEId(null)} T={T}/>
                ) : (
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:16, fontWeight:800, color:T.accent }}>{f.cal}</span>
                      <button style={st.iconBtn(T.accent)} onClick={()=>{setLogEId(f.id);setLogER({name:f.name,cal:f.cal,p:f.p,c:f.c,g:f.g});}}>✏️</button>
                      <button style={st.iconBtn(T.red)}    onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
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
  const st = S(T);
  const [exSel,setExSel]     = useState("");
  const [exCustom,setExCust] = useState("");
  const [form,setForm]       = useState({ weight:"", reps:"", sets:"", rpe:"" });
  const [planOpen,setPlanO]  = useState(false);
  const [editId,setEditId]   = useState(null);
  const [editRow,setEditRow] = useState({});
  const isCustom = exSel==="__custom__";

  const addSet = () => {
    const name=isCustom?exCustom:exSel; if(!name) return;
    setStr(p=>[...p,{...form,exercise:name,date:TODAY,program,id:uid(),weight:+form.weight||0,reps:+form.reps||0,sets:+form.sets||0,rpe:+form.rpe||0}]);
    setExSel(""); setExCust(""); setForm({weight:"",reps:"",sets:"",rpe:""});
  };
  const saveEd = () => { setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEditId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.card}>
        <SH title={<>🗓 Programa · <span style={{color:T.accent}}>{program}</span></>}
          right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.keys(PLANS).map(p=><button key={p} style={st.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>)}</div>}/>
        <button onClick={()=>setPlanO(o=>!o)} style={{ ...st.ghost(planOpen), marginBottom:planOpen?14:0 }}>
          {planOpen?"✕ Cerrar Editor":"⚙️ Configurar Plan"}
        </button>
        {planOpen && (
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{fontSize:12,color:T.muted}}>Los cambios se reflejan en el Dashboard al instante.</div>
              <button onClick={()=>setPlans(p=>({...p,[program]:{...PLANS[program]}}))} style={{...st.ghost(false),fontSize:11,padding:"4px 12px"}}>↺ Restaurar</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day=>{
                const isT=day===TODAY_DOW;
                return (
                  <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:14, padding:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{fontSize:9,fontWeight:700,color:isT?T.accent:T.muted,letterSpacing:"0.08em"}}>{day.toUpperCase()}</span>
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

      <div style={st.grid2}>
        <div style={st.card}>
          <SH title="🏋️ Registrar Set"/>
          <div style={{marginBottom:10}}><span style={st.lbl}>Ejercicio</span>
            <select value={exSel} onChange={e=>setExSel(e.target.value)} style={st.sel}>
              <option value="" disabled>— Selecciona un ejercicio —</option>
              {Object.entries(EXERCISE_LIBRARY).map(([cat,exs])=>(
                <optgroup key={cat} label={cat}>{exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}</optgroup>
              ))}
              <option value="__custom__">✏️ Otro / Personalizado</option>
            </select>
          </div>
          {isCustom&&<div style={{marginBottom:10}}><span style={st.lbl}>Nombre</span>
            <input style={{...st.inp,borderColor:T.navy+"60"}} placeholder="Escribe el ejercicio…" value={exCustom} onChange={e=>setExCust(e.target.value)}/></div>}
          {(exSel&&!isCustom)&&<div style={{background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:8,padding:"6px 12px",marginBottom:10,fontSize:12,color:T.accent}}>✓ {exSel}</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Peso (kg)","weight","80"],["RPE","rpe","8"],["Reps","reps","10"],["Series","sets","4"]].map(([l,k,ph])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
          </div>
          <button style={{...st.btn,opacity:(exSel&&!(isCustom&&!exCustom))?1:0.4,cursor:(exSel&&!(isCustom&&!exCustom))?"pointer":"not-allowed"}} onClick={addSet}>+ Registrar Set</button>
        </div>

        <div style={st.card}>
          <SH title="📊 Historial" right={<span style={{fontSize:11,color:T.muted}}>{strLog.length} sets</span>}/>
          {strLog.length===0 ? <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:30}}>Sin registros</div> : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:9, color:T.muted, fontWeight:600 }}>
              {["EJERCICIO","KG","REPS","SER","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:380, overflowY:"auto" }}>
              {[...strLog].reverse().map(l=> editId===l.id ? (
                <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <EditRow fields={[{key:"exercise",label:"Ejercicio"},{key:"weight",label:"Peso kg",type:"number"},{key:"reps",label:"Reps",type:"number"},{key:"sets",label:"Series",type:"number"},{key:"rpe",label:"RPE",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEditId(null)} T={T}/>
                </div>
              ) : (
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"9px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, alignItems:"center", background:l.date===TODAY?T.accentDim:"transparent" }}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600,color:l.date===TODAY?T.accent:T.text}}>{l.exercise}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{l.weight}</span>
                  <span>{l.reps}</span><span>{l.sets}</span>
                  <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.iconBtn(T.accent)} onClick={()=>{setEditId(l.id);setEditRow({exercise:l.exercise,weight:l.weight,reps:l.reps,sets:l.sets,rpe:l.rpe});}}>✏️</button>
                    <button style={st.iconBtn(T.red)}    onClick={()=>setStr(p=>p.filter(x=>x.id!==l.id))}>🗑</button>
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
// RUNNING  — SVG Athletics Track
// ─────────────────────────────────────────────────────────────────────────────
function Running({ runs, setRuns, T }) {
  const st = S(T);
  const [form,setForm]     = useState({ date:TODAY, km:"", time:"", lpm:"", ppm:"" });
  const [editId,setEditId] = useState(null);
  const [editRow,setEditRow]= useState({});
  const tip = props => <ChartTip {...props} T={T}/>;
  const total = runs.reduce((s,r)=>s+r.km,0);

  const add = () => {
    if(!form.km||!form.time) return;
    setRuns(p=>[...p,{...form,km:+form.km,pace:calcPace(+form.km,form.time),id:uid()}]);
    setForm({date:TODAY,km:"",time:"",lpm:"",ppm:""});
  };
  const saveEd = () => { setRuns(p=>p.map(r=>r.id===editId?{...r,...editRow,km:+editRow.km,pace:calcPace(+editRow.km,editRow.time)}:r)); setEditId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Athletics Track */}
      <div style={{ ...st.card, display:"flex", flexDirection:"column", alignItems:"center" }}>
        <SH title="🏟 Pista de Atletismo · Half Marathon de la Prensa"
          right={<span style={{fontSize:11,color:T.muted}}>{total.toFixed(1)} / 21.1 km</span>}/>
        <AthleticsTrack totalKM={total} goalKM={21.1} T={T}/>
      </div>

      <div style={st.grid2}>
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

        {/* Chart + history */}
        <div style={st.card}>
          <SH title="📈 Progresión" right={<span style={{fontSize:11,color:T.muted}}>{runs.length} carreras</span>}/>
          {runs.length<2 ? (
            <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>Registra carreras para la gráfica</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={runs} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Area type="monotone" dataKey="km" stroke={T.accent} fill="url(#rg)" strokeWidth={2} dot={{fill:T.accent,r:4}} name="KM"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
          {runs.length>0 && (
            <div style={{ maxHeight:200, overflowY:"auto", marginTop:10 }}>
              {[...runs].reverse().map(r=> editId===r.id ? (
                <div key={r.id} style={{marginBottom:8}}>
                  <EditRow fields={[{key:"date",label:"Fecha",type:"date"},{key:"km",label:"KM",type:"number",step:"0.1"},{key:"time",label:"Tiempo"},{key:"lpm",label:"LPM",type:"number"},{key:"ppm",label:"PPM",type:"number"}]}
                    values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEditId(null)} T={T}/>
                </div>
              ) : (
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, fontSize:11, alignItems:"center" }}>
                  <span style={{color:T.muted,minWidth:40}}>{r.date.slice(5)}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{r.km}km</span>
                  <span style={{color:T.muted}}>{r.time}</span>
                  <span style={{color:T.teal,fontWeight:600}}>{r.pace}</span>
                  <span style={{color:T.muted}}>{r.lpm?`${r.lpm}lpm`:"—"}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.iconBtn(T.accent)} onClick={()=>{setEditId(r.id);setEditRow({date:r.date,km:r.km,time:r.time,lpm:r.lpm||"",ppm:r.ppm||""});}}>✏️</button>
                    <button style={st.iconBtn(T.red)}    onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
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
// BIOMETRÍA — gradient charts + CRUD records list
// ─────────────────────────────────────────────────────────────────────────────
function Biometria({ bios, setBios, T }) {
  const st = S(T);
  const [form,setForm]     = useState({ date:TODAY, height:"", weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" });
  const [editId,setEditId] = useState(null);
  const [editRow,setEditRow]= useState({});
  const tip = props => <ChartTip {...props} T={T}/>;

  const last  = bios[bios.length-1];
  const first = bios[0];
  const delta = (last&&first) ? (last.weight-first.weight).toFixed(1) : null;
  const trend = bios.map(b=>({ date:b.date, Peso:b.weight, Grasa:b.fat, Músculo:b.muscle, Agua:b.water }));

  const add = () => {
    if(!form.weight) return;
    setBios(p=>[...p,{ ...form, id:uid(), weight:+form.weight, fat:+form.fat||null, muscle:+form.muscle||null,
      visceral:+form.visceral||null, water:+form.water||null, protein:+form.protein||null, dmr:+form.dmr||null,
      imc: form.height ? calcIMC(+form.weight,+form.height) : null }]);
    setForm(p=>({ date:TODAY, height:p.height, weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"" }));
  };
  const saveEd = () => {
    setBios(p=>p.map(b=>b.id===editId?{ ...b,...editRow, weight:+editRow.weight, fat:+editRow.fat||null, muscle:+editRow.muscle||null, visceral:+editRow.visceral||null, water:+editRow.water||null, protein:+editRow.protein||null, dmr:+editRow.dmr||null, imc:editRow.height?calcIMC(+editRow.weight,+editRow.height):b.imc }:b));
    setEditId(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.grid2}>
        {/* Form */}
        <div style={st.card}>
          <SH title="⚖️ Registro Steren"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div><span style={st.lbl}>Fecha</span><input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><span style={st.lbl}>Estatura (cm)</span><input style={st.inp} type="number" placeholder="175" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/></div>
            {[["Peso (kg) *","weight","75.5",T.accent],["% Grasa","fat","18.5",T.red],["Masa Muscular kg","muscle","58.2",T.green],["Grasa Visceral","visceral","6",T.orange],["Agua %","water","55.3",T.blue],["Proteína %","protein","17.5",T.purple],["DMR/TMB kcal","dmr","1850",T.muted]].map(([l,k,ph,c])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={{...st.inp,borderColor:`${c}60`}} type="number" step="0.1" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div><span style={st.lbl}>IMC (auto)</span>
              <div style={{...st.inp,color:(form.height&&form.weight)?T.accent:T.muted,fontWeight:700,pointerEvents:"none"}}>
                {(form.height&&form.weight)?calcIMC(+form.weight,+form.height):"—"}
              </div>
            </div>
          </div>
          <button style={st.btn} onClick={add}>+ Registrar Medición</button>
        </div>

        {/* Latest snapshot */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {last && (
            <div style={st.card}>
              <SH title={`📊 Última · ${last.date.slice(5)}`}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(88px,1fr))", gap:8 }}>
                {[{l:"Peso",v:`${last.weight}kg`,c:T.accent},{l:"IMC",v:last.imc??"—",c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},{l:"% Grasa",v:last.fat?`${last.fat}%`:"—",c:T.red},{l:"Músculo",v:last.muscle?`${last.muscle}kg`:"—",c:T.green},{l:"Visceral",v:last.visceral?`Nv${last.visceral}`:"—",c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted},{l:"Agua",v:last.water?`${last.water}%`:"—",c:T.blue},{l:"Proteína",v:last.protein?`${last.protein}%`:"—",c:T.purple},{l:"DMR/TMB",v:last.dmr||"—",c:T.orange},{l:"Δ Peso",v:delta?`${delta>0?"+":""}${delta}kg`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                  <div key={m.l} style={{background:T.card2,borderRadius:12,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,fontWeight:600,letterSpacing:"0.06em"}}>{m.l.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:800,color:m.c,marginTop:3}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gradient evolution chart */}
          <div style={{ ...st.card, flex:1 }}>
            <SH title="📈 Evolución"/>
            {bios.length<2 ? (
              <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:30}}>Registra 2+ mediciones</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{top:4,right:4,bottom:0,left:-22}}>
                  <defs>
                    {[["wg",T.accent],["gg",T.red],["mg",T.green],["ag",T.blue]].map(([id,c])=>(
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c} stopOpacity={0.25}/>
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

      {/* CRUD records list */}
      {bios.length>0 && (
        <div style={st.card}>
          <SH title="📋 Historial Biométrico" right={<span style={{fontSize:11,color:T.muted}}>{bios.length} registros</span>}/>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"system-ui", minWidth:700 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {["Fecha","Peso","IMC","% Grasa","Músculo","Visceral","Agua %","Prot %","DMR",""].map(h=>(
                    <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:600, fontSize:9, textAlign:h===""?"center":"right", letterSpacing:"0.06em" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...bios].reverse().map(b=> editId===b.id ? (
                  <tr key={b.id}><td colSpan={10} style={{padding:"8px 0"}}>
                    <EditRow fields={[{key:"date",label:"Fecha",type:"date"},{key:"weight",label:"Peso kg",type:"number",step:"0.1"},{key:"fat",label:"% Grasa",type:"number",step:"0.1"},{key:"muscle",label:"Músculo kg",type:"number",step:"0.1"},{key:"visceral",label:"Visceral",type:"number"},{key:"water",label:"Agua %",type:"number",step:"0.1"},{key:"protein",label:"Prot %",type:"number",step:"0.1"},{key:"dmr",label:"DMR kcal",type:"number"}]}
                      values={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEditId(null)} T={T}/>
                  </td></tr>
                ) : (
                  <tr key={b.id} style={{ borderBottom:`1px solid ${T.border}`, background:b.date===TODAY?T.accentDim:"transparent" }}>
                    {[b.date.slice(5),`${b.weight}kg`,b.imc??"—",b.fat?`${b.fat}%`:"—",b.muscle?`${b.muscle}kg`:"—",b.visceral?`Nv${b.visceral}`:"—",b.water?`${b.water}%`:"—",b.protein?`${b.protein}%`:"—",b.dmr||"—"].map((v,i)=>(
                      <td key={i} style={{ padding:"9px 8px", textAlign:i===0?"left":"right", color:i===0?T.text:T.muted, fontWeight:i===0?600:400 }}>{v}</td>
                    ))}
                    <td style={{ padding:"9px 8px", textAlign:"center" }}>
                      <button style={st.iconBtn(T.accent)} onClick={()=>{setEditId(b.id);setEditRow({date:b.date,weight:b.weight,fat:b.fat||"",muscle:b.muscle||"",visceral:b.visceral||"",water:b.water||"",protein:b.protein||"",dmr:b.dmr||""});}}>✏️</button>
                      <button style={st.iconBtn(T.red)}    onClick={()=>setBios(p=>p.filter(x=>x.id!==b.id))}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HÁBITOS
// ─────────────────────────────────────────────────────────────────────────────
function Habitos({ habits, setHab, T }) {
  const st   = S(T);
  const done  = Object.values(habits).filter(Boolean).length;
  const total = Object.keys(habits).length;
  return (
    <div style={st.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:700 }}>✅ Hábitos Diarios</div>
        <div style={{ fontSize:30, fontWeight:800, color:done===total?T.accent:T.text }}>{done}/{total}</div>
      </div>
      <ProgBar value={done} max={total} color={T.navy} height={5}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginTop:18 }}>
        {Object.entries(habits).map(([h,v])=>(
          <button key={h} onClick={()=>setHab(p=>({...p,[h]:!p[h]}))}
            style={{ background:v?T.accentDim:T.card2, border:`1.5px solid ${v?T.accent:T.border}`, borderRadius:16, padding:"16px 14px", cursor:"pointer", textAlign:"left", transition:"all 0.2s", fontFamily:"system-ui", color:T.text }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{v?"✅":"⭕"}</div>
            <div style={{ fontSize:13, fontWeight:600, color:v?T.accent:T.text }}>{h}</div>
          </button>
        ))}
      </div>
      {done===total&&<div style={{ marginTop:18, textAlign:"center", background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:14, padding:14, fontWeight:700, color:T.accent, fontSize:14 }}>🎉 ¡Día perfecto!</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap";
    l.rel  = "stylesheet";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(_){} };
  }, []);

  const [isDark, setDark]   = useState(true);
  const T = isDark ? DARK : LIGHT;

  // ── State ──────────────────────────────────────────────────────────────────
  const [tab,       setTab]  = useState("dashboard");
  const [healthLog, setHL]   = useState(SEED_HEALTH);
  const [foodLog,   setFL]   = useState([]);
  const [db,        setDb]   = useState(SEED_DB);
  const [strLog,    setStr]  = useState([]);
  const [runs,      setRuns] = useState([]);
  const [bios,      setBios] = useState([]);
  const [habits,    setHab]  = useState({ "💧 Agua (3L)":false,"😴 Sueño (8h)":false,"🥩 Proteína meta":false,"🏃 Cardio":false,"🧘 Meditación":false,"🤸 Stretching":false });
  const [goals,     setGoals]= useState({...DEFAULT_GOALS});
  const [program,   setProg] = useState("Hipertrofia");
  const [plans,     setPlans]= useState(()=>Object.fromEntries(Object.entries(PLANS).map(([k,v])=>[k,{...v}])));

  // ── Import JSON ────────────────────────────────────────────────────────────
  const importRef = useRef(null);
  const handleImport = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const d = JSON.parse(evt.target.result);
        if (d.healthLog)    setHL(d.healthLog);
        if (d.foodLog)      setFL(d.foodLog);
        if (d.nutritionDB)  setDb(d.nutritionDB);
        if (d.strengthLog)  setStr(d.strengthLog);
        if (d.runs)         setRuns(d.runs);
        if (d.biometrics)   setBios(d.biometrics);
        if (d.habits)       setHab(d.habits);
        if (d.goals)        setGoals(d.goals);
        if (d.program)      setProg(d.program);
        if (d.weeklyPlans)  setPlans(d.weeklyPlans);
        alert("✅ Importación exitosa");
      } catch { alert("❌ Archivo JSON inválido"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Export JSON ────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const data = { healthLog, foodLog, nutritionDB:db, strengthLog:strLog, runs, biometrics:bios, habits, goals, program, weeklyPlans:plans, exportedAt:new Date().toISOString() };
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download = `IN_v5_${TODAY}.json`; a.click();
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const getDayData = useCallback((date) => {
    const h   = healthLog.find(d=>d.date===date)||{};
    const fs  = foodLog.filter(f=>f.date===date);
    const hasF = fs.length>0;
    const calIn = hasF ? fs.reduce((s,f)=>s+f.cal,0) : (h.calIn||0);
    const p = hasF ? r1(fs.reduce((s,f)=>s+f.p,0)) : (h.p||0);
    const c = hasF ? r1(fs.reduce((s,f)=>s+f.c,0)) : (h.c||0);
    const g = hasF ? r1(fs.reduce((s,f)=>s+f.g,0)) : (h.g||0);
    return { date, calOut:h.calOut||0, calIn, p, c, g,
      sleep:h.sleep||null, score:h.score||null, steps:h.steps||null,
      balance:calIn-(h.calOut||0), goals:h.goals||{...DEFAULT_GOALS} };
  }, [healthLog, foodLog]);

  const allDates  = useMemo(()=>{ const s=new Set([...healthLog.map(h=>h.date),...foodLog.map(f=>f.date),TODAY]); return [...s].sort().reverse().slice(0,14); }, [healthLog,foodLog]);
  const weekData  = useMemo(()=>allDates.map(d=>getDayData(d)), [allDates,getDayData]);
  const last7     = useMemo(()=>weekData.slice(0,7).reverse(),  [weekData]);
  const today     = useMemo(()=>getDayData(TODAY),              [getDayData]);
  const todayFood = useMemo(()=>foodLog.filter(f=>f.date===TODAY), [foodLog]);

  const st    = S(T);
  const bCol  = b => b<0?T.green:b<300?T.accent:T.red;
  const TABS  = [
    {id:"dashboard",l:"📊 Dashboard"},{id:"dailylog",l:"📋 Daily Log"},
    {id:"nutricion",l:"🥗 Nutrición"},{id:"fuerza",l:"🏋️ Fuerza"},
    {id:"running",l:"🏃 Running"},{id:"bio",l:"⚖️ Biometría"},{id:"habits",l:"✅ Hábitos"},
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", color:T.text, padding:"16px 18px", transition:"background 0.3s" }}>
      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display:"none" }}/>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:800, color:isDark?T.accent:T.navy, letterSpacing:"-1px", lineHeight:1 }}>
            ☎️ IN <span style={{ color:T.muted, fontSize:11, fontWeight:600 }}>v5</span>
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{TODAY} · {program}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {today.calIn>0 && <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, color:T.accent, fontWeight:700, boxShadow:T.shadow }}>{today.calIn} kcal in</div>}
          {today.calOut>0 && <div style={{ background:T.card, borderRadius:999, padding:"6px 14px", fontSize:12, fontWeight:700, color:bCol(today.balance), boxShadow:T.shadow }}>{today.balance>0?"+":""}{today.balance} bal</div>}
          {/* Theme */}
          <button onClick={()=>setDark(d=>!d)} style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"7px 16px", cursor:"pointer", fontSize:12, color:T.text, fontWeight:600 }}>
            {isDark?"☀️ Light":"🌙 Dark"}
          </button>
          {/* Import */}
          <button onClick={()=>importRef.current?.click()} style={{ background:T.card2, color:T.text, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ↑ Importar
          </button>
          {/* Export */}
          <button onClick={exportJSON} style={{ background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ↓ JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?T.navy:T.card, color:tab===t.id?"#fff":T.text,
            border:`1.5px solid ${tab===t.id?T.navy:T.border}`,
            borderRadius:999, padding:"8px 16px", fontWeight:600, fontSize:12, cursor:"pointer",
            transition:"all 0.2s", boxShadow:tab===t.id?"none":T.shadow,
          }}>{t.l}</button>
        ))}
      </div>

      {/* Stable component tree */}
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