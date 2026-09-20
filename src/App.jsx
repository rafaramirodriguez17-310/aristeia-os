import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — F1 TELEMETRY · ENGINEERING DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#050506", card:"#0A0B0E", card2:"#12141A", card3:"#1A1D24",
  accent:"#00E5FF", // Neon Cyan
  accentDim:"rgba(0, 229, 255, 0.12)", 
  navy:"#0A0B0E", navyBright:"#12141A",
  text:"#E2E8F0", muted:"#64748B", border:"#1F242F", inputBg:"#050506",
  green:"#39FF14", red:"#FF007F", blue:"#3B82F6",
  purple:"#B026FF", orange:"#FFD700", teal:"#14B8A6", pink:"#EC4899",
  shadow:"0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
  pickerBg:"#050506", font:"'DM Mono', monospace, system-ui",
};

const LIGHT = {
  bg:"#F8FAFC", card:"#FFFFFF", card2:"#F1F5F9", card3:"#E2E8F0",
  accent:"#0055FF", 
  accentDim:"rgba(0, 85, 255, 0.1)",
  navy:"#0F172A", navyBright:"#1E293B",
  text:"#0F172A", muted:"#64748B", border:"#CBD5E1", inputBg:"#F8FAFC",
  green:"#16A34A", red:"#DC2626", blue:"#2563EB",
  purple:"#9333EA", orange:"#EA580C", teal:"#0D9488", pink:"#DB2777",
  shadow:"0 2px 10px rgba(0,0,0,0.05)",
  pickerBg:"#F1F5F9", font:"'DM Mono', monospace, system-ui",
};

const f1BlueprintSVG = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' opacity='0.15'><defs><pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'><path d='M 20 0 L 0 0 0 20' fill='none' stroke='#ffffff' stroke-opacity='0.15' stroke-width='0.5'/></pattern><pattern id='gridLarge' width='100' height='100' patternUnits='userSpaceOnUse'><path d='M 100 0 L 0 0 0 100' fill='none' stroke='#ffffff' stroke-opacity='0.3' stroke-width='1'/></pattern></defs><rect width='100%' height='100%' fill='url(#grid)'/><rect width='100%' height='100%' fill='url(#gridLarge)'/><g stroke='#64FFDA' stroke-width='1.5' fill='none'><path d='M 100 250 C 120 220, 180 200, 250 190 L 400 180 L 450 150 L 550 160 C 600 170, 650 180, 700 200 L 750 250' /><path d='M 100 250 L 80 180 L 140 170 L 150 250 Z' /><path d='M 750 250 L 780 230 L 820 240 L 780 270 Z' /><circle cx='200' cy='250' r='45' /><circle cx='200' cy='250' r='20' /><circle cx='650' cy='250' r='45' /><circle cx='650' cy='250' r='20' /><path d='M 200 320 L 650 320' stroke-dasharray='5,5' /><text x='370' y='340' fill='#64FFDA' font-family='monospace' font-size='14' stroke='none'>WHEELBASE = 3600mm</text><path d='M 650 250 L 600 210 M 650 250 L 620 180' /><path d='M 200 250 L 250 200 M 200 250 L 230 180' /><path d='M 200 250 L 200 320 M 650 250 L 650 320' stroke-dasharray='2,2' stroke-width='1' /></g></svg>`);

const BLUEPRINT = {
  bg:`#0b284e url("data:image/svg+xml,${f1BlueprintSVG}") top center / 800px fixed`,
  card:"#113160", card2:"#16407c", card3:"#1d5098",
  accent:"#64FFDA",
  accentDim:"rgba(100, 255, 218, 0.12)", 
  navy:"#0b284e", navyBright:"#113160",
  text:"#E6F1FF", muted:"#8ab4f8", border:"#285cac", inputBg:"#0b284e",
  green:"#00FF88", red:"#FF3366", blue:"#66b2ff",
  purple:"#d7aeff", orange:"#FFD700", teal:"#64FFDA", pink:"#EC4899",
  shadow:"0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  pickerBg:"#0b284e", font:"'DM Mono', monospace, system-ui",
};

const WINTER_ARC = {
  bg:"#00072d", 
  card:"#051650", 
  card2:"#0a2472", 
  card3:"#123499",
  accent:"#5eaf73",
  accentDim:"rgba(94, 175, 115, 0.15)", 
  navy:"#00072d", navyBright:"#051650",
  text:"#E2E8F0", muted:"#8FA3C0", border:"#123499", inputBg:"#00072d",
  green:"#5eaf73", red:"#C96A6E", blue:"#4B72B8",
  purple:"#8A6BB8", orange:"#C28945", teal:"#459B9E", pink:"#B85E8A",
  shadow:"0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  pickerBg:"#00072d", font:"'DM Mono', monospace, system-ui",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA & LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",       Vie:"Upper Compuesto",       Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  Fuerza:     { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",             Vie:"OHP + Accesorios",      Sáb:"Cardio LISS",      Dom:"🔋 Descanso" },
  Definición: { Lun:"Full Body A",     Mar:"HIIT 30min",        Mié:"Full Body B",       Jue:"LISS 45min",              Vie:"Full Body C + Cardio",  Sáb:"HIIT 30min",       Dom:"🔋 Descanso" },
  Power:      { Lun:"Potencia Sup.",   Mar:"Potencia Inf.",     Mié:"🔋 Descanso",       Jue:"Olímpicos + Fuerza",  Vie:"Pliometría + Velocidad", Sáb:"LISS",            Dom:"🔋 Descanso" },
};

const RUTINAS_BASE = {
  "Pecho + Tríceps": [ { exercise: "Press Banca", sets: 4, reps: 10, weight: 60, rpe: 8 } ],
  "Espalda + Bíceps": [ { exercise: "Peso Muerto", sets: 4, reps: 8, weight: 100, rpe: 8 } ]
};

const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL_ES = { Lun:"LUNES", Mar:"MARTES", Mié:"MIÉRCOLES", Jue:"JUEVES", Vie:"VIERNES", Sáb:"SÁBADO", Dom:"DOMINGO" };
const EXERCISE_LIB = {
  "🫁 Pecho":   ["Press Banca","Press Inclinado","Aperturas c/ Mancuernas","Fondos en Paralelas"],
  "🔙 Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Jalón al Pecho"],
  "🦵 Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Peso Muerto Rumano"],
  "💪 Brazos":  ["Curl con Barra","Extensión de Tríceps"],
  "🏔 Hombros": ["Press Militar","Elevaciones Laterales"],
  "⚡ Core":    ["Plancha","Crunch"],
  "🏃 Cardio":  ["Carrera en Cinta","HIIT","Bicicleta Estacionaria"],
};

const getLocalYYYYMMDD = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};
const TODAY = getLocalYYYYMMDD();
const DEFAULT_GOALS = { cal:2400, p:180, c:280, g:60 };

const calculateWhoopRecovery = (hrv, rhr, sleepScore, bodyBattery) => {
  if (!hrv && !rhr && !sleepScore && !bodyBattery) return null;
  let factors = 0, scoreSum = 0;
  if (sleepScore) { scoreSum += sleepScore; factors += 1; }
  if (hrv) { const hrvScore = Math.min(100, Math.max(10, (hrv / 75) * 85)); scoreSum += hrvScore; factors += 1; }
  if (rhr) { const rhrScore = Math.min(100, Math.max(10, (55 / rhr) * 90)); scoreSum += rhrScore; factors += 1; }
  if (bodyBattery) { scoreSum += bodyBattery; factors += 1; }
  return factors > 0 ? Math.round(scoreSum / factors) : null;
};

const getRecoveryColor = (score, T) => {
  if (!score) return T.muted;
  if (score >= 67) return T.green;
  if (score >= 34) return T.orange;
  return T.red;
};

const SEED_HEALTH = [];
const SEED_DB = [];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LS = "aristeia_v7_1_";
function lsGet(key, fallback) {
  try { const r=localStorage.getItem(LS+key); return r===null?fallback:JSON.parse(r); } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(LS+key, JSON.stringify(val)); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid = () => Date.now() + Math.random();
const r1 = n => Math.round(n*10)/10;
const fmt = (n,d=1) => (n==null||isNaN(n))?"—":Number(n).toFixed(d);
const calcPace = (km,t) => {
  if (!km||!t) return "--:--";
  const p=t.split(":").map(Number);
  const s=p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps=s/km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg,cm) => cm ? r1(kg/((cm/100)**2)) : null;
const paceToSecs = (p) => {
  if (!p || p === "--:--") return 0;
  const parts = p.replace("/km", "").split(":").map(Number);
  return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
};
const secsToPace = (s) => {
  if (!s || isNaN(s)) return "--:--";
  const m = Math.floor(s / 60);
  const sc = Math.round(s % 60).toString().padStart(2, "0");
  return `${m}:${sc}/km`;
};

function getWeekStart(dateStr) {
  const d=new Date(dateStr+"T12:00:00"), dow=d.getDay()||7;
  d.setDate(d.getDate()-dow+1);
  return d.toISOString().split("T")[0];
}
function getMonthKey(dateStr) { return dateStr.slice(0,7); }
function fmtMonth(mk) {
  const [y,m]=mk.split("-");
  return new Date(+y,+m-1,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"});
}
function fmtWeek(mon) {
  const s=new Date(mon+"T12:00:00"),e=new Date(s);
  e.setDate(e.getDate()+6);
  const f=d=>d.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  return `${f(s)} – ${f(e)}`;
}
function getCurrentWeekDates(refDateStr = TODAY) {
  const today = new Date(refDateStr + "T12:00:00");
  const dow = today.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  mon.setHours(0,0,0,0);
  return PLAN_KEYS.map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE FACTORY — TELEMETRY UI
// ─────────────────────────────────────────────────────────────────────────────
const SVG_ARROW=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
function mkS(T) {
  return {
    card:   { background:T.card, borderRadius:12, padding:18, color:T.text, boxShadow:T.shadow, fontFamily:T.font, border:`1px solid ${T.border}`, position:"relative" },
    card2:  { background:T.card2, borderRadius:8, padding:14, color:T.text, fontFamily:T.font, border:`1px solid ${T.border}` },
    lbl:    { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:6, display:"block", fontWeight:700 },
    inp:    { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, transition:"border-color 0.15s" },
    sel:    { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 34px 10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, appearance:"none", WebkitAppearance:"none", backgroundImage:SVG_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:    { background:T.accent, color:"#000", border:"none", borderRadius:6, padding:"12px 22px", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:T.font, width:"100%", textTransform:"uppercase", letterSpacing:"0.05em" },
    btnSm:  { background:T.navyBright, color:T.text, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" },
    ghost:  a=>({ background:a?T.accentDim:"transparent", color:a?T.accent:T.muted, border:`1px solid ${a?T.accent:T.border}`, borderRadius:6, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap", transition:"all 0.15s" }),
    icon:   c=>({ background:"none", border:"none", cursor:"pointer", color:c||T.muted, padding:"3px 6px", borderRadius:4, fontSize:13, lineHeight:1, display:"inline-flex", alignItems:"center" }),
    g2:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES GLOBALES Y ATÓMICOS
// ─────────────────────────────────────────────────────────────────────────────
function NumberPicker({ value, onChange, options, label, T }) {
  const selRef = useRef(null);
  useEffect(() => { if (selRef.current) selRef.current.scrollIntoView({ block:"nearest", behavior:"smooth" }); }, [value]);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
      <span style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:T.font }}>{label}</span>
      <div style={{ background:T.pickerBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 5px", height:210, overflowY:"auto", width:62, display:"flex", flexDirection:"column", alignItems:"center", gap:3, scrollbarWidth:"none", msOverflowStyle:"none" }}>
        {options.map(opt => {
          const isSel = String(opt) === String(value);
          return (
            <button key={opt} ref={isSel ? selRef : null} onClick={() => onChange(String(opt))}
              style={{ width:50, minHeight:38, flexShrink:0, border: isSel ? `1px solid ${T.accent}` : "1px solid transparent", background: isSel ? T.accentDim : "transparent", borderRadius:4, color: isSel ? T.accent : T.text, fontWeight: isSel ? 700 : 400, fontSize:15, cursor:"pointer", fontFamily:T.font, textAlign:"center", transition:"all 0.12s" }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, T }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:"8px 12px", boxShadow:T.shadow, fontSize:11, fontFamily:T.font, textTransform:"uppercase" }}>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: <b>{fmt(p.value)}</b></div>)}
    </div>
  );
}
function SH({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:13, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>{title}</div>
      {right}
    </div>
  );
}
function ProgBar({ value, max, color, h=4 }) {
  return (
    <div style={{ height:h, borderRadius:1, overflow:"hidden", background:"rgba(255,255,255,0.08)", marginTop:6 }}>
      <div style={{ height:"100%", width:`${Math.min((value/max)*100,100)}%`, background:color, borderRadius:1, transition:"width 0.45s ease" }}/>
    </div>
  );
}
function MiniRing({ pct, color, size=42, sw=4 }) {
  const r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-Math.min(pct,1));
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="butt" strokeDasharray={`${c} ${c}`} strokeDashoffset={off} style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}

function EditRow({ fields, vals, onChange, onSave, onCancel, T }) {
  const st=mkS(T);
  return (
    <div style={{ ...st.card2, border:`1px solid ${T.accent}`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f=>(
          <div key={f.k}><span style={st.lbl}>{f.l}</span>
            <input style={{...st.inp, padding:"6px 10px"}} type={f.t||"text"} step={f.step} value={vals[f.k]??""} onChange={e=>onChange(f.k,e.target.value)}/></div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.green, color:"#000", border:"none", flex:1 }} onClick={onSave}>✓ OK</button>
        <button style={{ ...st.btnSm, flex:1 }} onClick={onCancel}>✕ CANCEL</button>
      </div>
    </div>
  );
}

function Placeholder({ msg, T }) {
  return <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:11, fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.05em" }}>[{msg}]</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ activeDayData, weekData, last7, goals, program, plans, setPlans, setTab, activeDate, theme, T }) {
  const st=mkS(T);
  const [editDay, setEditDay] = useState(null);
  const tip=p=><ChartTip {...p} T={T}/>;
  
  const pCol=(v,g)=>v>=g?T.green:v>=g*.8?T.accent:T.red;
  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const cCol=(v,g)=>v>g?T.red:v>g*.85?T.accent:T.green;
  const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];

  const KPICard = ({ id, label, value, sub, color, T }) => (
    <div style={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius:8, padding:"14px", color:T.text, minHeight:90, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:color }} />
      <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginLeft:6 }}>{id} · {label}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:12, marginLeft:6 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1, fontFamily:T.font }}>{value}</div>
          {sub&&<div style={{ fontSize:10, color:T.muted, marginTop:4, fontFamily:T.font }}>{sub}</div>}
        </div>
      </div>
    </div>
  );

  const kpis=[
    { id:"PWR", label:"Cal In",   value:activeDayData.calIn||"—", sub:`TGT: ${goals.cal}`,  color:T.accent },
    { id:"SYS", label:"Balance", value:activeDayData.calOut>0?(activeDayData.balance>0?`+${activeDayData.balance}`:activeDayData.balance):"—", sub:activeDayData.balance<0?"DEFICIT":"SURPLUS", color:activeDayData.calOut>0?bCol(activeDayData.balance):T.muted },
    { id:"MAC", label:"Protein", value:activeDayData.p?`${Math.round(activeDayData.p)}g`:"—", sub:`TGT: ${goals.p}g`, color:pCol(activeDayData.p,goals.p) },
    { id:"MAC", label:"Carbs",   value:activeDayData.c?`${Math.round(activeDayData.c)}g`:"—", sub:`MAX: ${goals.c}g`,  color:cCol(activeDayData.c,goals.c) },
    { id:"AER", label:"Cal Out", value:activeDayData.calOut||"—", sub:"BURNED",        color:T.blue },
    { id:"AER", label:"Steps",   value:activeDayData.steps?activeDayData.steps.toLocaleString():"—", sub:"TGT: 10K", color:T.purple },
    { id:"REC", label:"Recovery",value:activeDayData.recovery?`${activeDayData.recovery}%`:"—", sub:`BB: ${activeDayData.bb||"—"} · HRV: ${activeDayData.hrv||"—"}`, color:getRecoveryColor(activeDayData.recovery, T) || T.purple },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k} T={T}/>)}
      </div>

      <div style={{ ...st.card, padding:0, overflowX:"auto" }}>
        <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}` }}>
          <SH title="📊 CHAMPIONSHIP PROGRESS (7 DÍAS)" right={<span style={{ fontSize:10, color:T.muted, fontFamily:T.font }}>P:<span style={{color:T.green}}>≥TGT</span></span>}/>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:700, fontFamily:T.font }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}`, background:T.card2 }}>
              {[["DATE","l"],["OUT","r"],["IN","r"],["BAL","r"],["PROT","r"],["CARB","r"],["FAT","r"],["SLEEP","r"],["REC","r"],["STEPS","r"]].map(([h,a])=>(
                <th key={h} style={{ padding:"10px 14px", color:T.muted, fontWeight:700, textAlign:a==="r"?"right":"left", letterSpacing:"0.1em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d=>{
              const isT=d.date===activeDate, g=d.goals, bal=d.calIn-d.calOut, ho=d.calOut>0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background:isT?T.accentDim:"transparent", transition:"background 0.2s" }}>
                  <td style={{ padding:"12px 14px", fontWeight:isT?700:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>
                    {isT && <span style={{display:"inline-block", width:8, height:8, borderRadius:"50%", background:T.accent, marginRight:8, boxShadow:`0 0 8px ${T.accent}`}}/>}
                    {d.date===TODAY?"TODAY":d.date.slice(5)}
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.blue }}>{ho?d.calOut.toLocaleString():"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.accent }}>{d.calIn?d.calIn.toLocaleString():"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", fontWeight:700, color:(ho&&d.calIn)?bCol(bal):T.muted }}>{(ho&&d.calIn)?(bal>0?`+${bal}`:bal):"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:d.p?pCol(d.p,g.p):T.muted }}>{d.p?`${Math.round(d.p)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:d.c?cCol(d.c,g.c):T.muted }}>{d.c?`${Math.round(d.c)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:d.g?T.purple:T.muted }}>{d.g?`${Math.round(d.g)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.muted }}>{d.sleep?`${fmt(d.sleep,1)}h`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:getRecoveryColor(d.recovery, T) }}>{d.recovery?`${d.recovery}%`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.muted }}>{d.steps?d.steps.toLocaleString():"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={st.g2}>
        <div style={st.card}>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:16, letterSpacing:"0.1em", color:T.green }}>🥩 PROT INJECTION VS TARGET</div>
          {last7.filter(d=>d.calIn>0).length>=2?(
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last7} margin={{top:15,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:10,fontFamily:T.font}}/>
                <Tooltip content={tip}/>
                <ReferenceLine y={goals.p} stroke={T.green} strokeDasharray="3 3" label={{position:"top",value:`TGT ${goals.p}g`,fill:T.green,fontSize:10,fontFamily:T.font}} />
                <Bar dataKey="p" name="Proteína" radius={[2,2,0,0]} barSize={16}>
                  {last7.map((d,i)=><Cell key={i} fill={d.p>=goals.p?T.green:T.border}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<Placeholder msg="INSUFFICIENT TELEMETRY" T={T}/>}
        </div>
        
        <div style={st.card}>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:16, letterSpacing:"0.1em", color:T.accent }}>
            ⚖️ CALORIC DELTA <span style={{color:T.green}}>[↓ QUEMADO {'>'} CONSUMIDO]</span>
          </div>
          {last7.filter(d=>d.calOut>0).length>=2?(
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last7.filter(d=>d.calOut>0)} margin={{top:15,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:10,fontFamily:T.font}}/>
                <Tooltip content={tip}/>
                <ReferenceLine y={0} stroke={T.text} strokeWidth={1} />
                <Bar dataKey="balance" name="Balance" radius={[2,2,0,0]} barSize={16}>
                  {last7.filter(d=>d.calOut>0).map((d,i)=>(
                    <Cell key={i} fill={d.balance < 0 ? T.green : T.red}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<Placeholder msg="INSUFFICIENT TELEMETRY" T={T}/>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: UNIFIED DAILY DATA & RECAP
// ─────────────────────────────────────────────────────────────────────────────
const VISCERAL_OPTIONS = Array.from({length: 15}, (_, i) => String(i + 1));
const FOCUS_TAGS = ["🫁 Pecho", "🔙 Espalda", "🦵 Piernas", "💪 Brazos", "🏔 Hombros", "⚡ Core", "🏃 Cardio", "🥊 HIIT", "🧘‍♀️ Movilidad"];

function DailyRecap({ allDayData, bios, setBios, setHL, goals, setGoals, activeDate, T }) {
  const st = mkS(T);
  const [view, setView] = useState("week"); // week, month, year
  const [navDate, setNavDate] = useState(() => new Date(activeDate + "T12:00:00"));
  
  // Quick Panels Toggle
  const [showGoals, setShowGoals] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showLog, setShowLog] = useState(true);

  // Forms
  const [bioForm, setBioForm] = useState({ date:activeDate, height:"181", weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"", imc:"" });
  const [dailyForm, setDailyForm] = useState({ date:activeDate, calOut:"", steps:"", sleep:"", score:"", hrv:"", bb:"", recovery:"", focus:[] });
  
  // Table Edit
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState({});

  useEffect(() => {
    setBioForm(p => ({ ...p, date: activeDate }));
    setDailyForm(p => ({ ...p, date: activeDate }));
    setNavDate(new Date(activeDate + "T12:00:00"));
  }, [activeDate]);

  const upsertDaily = entry => setHL(prev => {
    const i = prev.findIndex(d => d.date === entry.date);
    if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], ...entry }; return u; }
    return [...prev, entry];
  });

  const saveDaily = () => {
    if (!dailyForm.date) return;
    const calcRec = calculateWhoopRecovery(+dailyForm.hrv, +dailyForm.rhr, +dailyForm.score, +dailyForm.bb);
    const finalRecovery = dailyForm.recovery ? +dailyForm.recovery : calcRec;
    upsertDaily({ 
      date: dailyForm.date, 
      ...(dailyForm.calOut && { calOut: +dailyForm.calOut }), 
      ...(dailyForm.steps && { steps: +dailyForm.steps }),
      ...(dailyForm.sleep && { sleep: +dailyForm.sleep }), 
      ...(dailyForm.score && { score: +dailyForm.score }),
      ...(dailyForm.hrv && { hrv: +dailyForm.hrv }),
      ...(dailyForm.bb && { bb: +dailyForm.bb }),
      ...(dailyForm.rhr && { rhr: +dailyForm.rhr }),
      ...(finalRecovery && { recovery: finalRecovery }),
      ...(dailyForm.focus.length > 0 && { focus: dailyForm.focus }),
      goals: { ...goals } 
    });
    setDailyForm({ date:activeDate, calOut:"", steps:"", sleep:"", score:"", hrv:"", bb:"", recovery:"", focus:[] });
  };

  const addBio = () => {
    if (!bioForm.weight) return;
    const finalImc = bioForm.imc ? +bioForm.imc : calcIMC(+bioForm.weight, 181);
    setBios(p => [...p, { ...bioForm, id: uid(), height: 181, weight: +bioForm.weight, fat: +bioForm.fat || null, muscle: +bioForm.muscle || null, visceral: +bioForm.visceral || null, water: +bioForm.water || null, protein: +bioForm.protein || null, dmr: +bioForm.dmr || null, imc: finalImc }]);
    setBioForm({ date:activeDate, height:"181", weight:"", fat:"", muscle:"", visceral:"", water:"", protein:"", dmr:"", imc:"" }); 
  };

  // Nav Logic
  const prevPeriod = () => {
    const d = new Date(navDate);
    if (view === "year") d.setFullYear(d.getFullYear() - 1);
    else if (view === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setNavDate(d);
  };
  const nextPeriod = () => {
    const d = new Date(navDate);
    if (view === "year") d.setFullYear(d.getFullYear() + 1);
    else if (view === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setNavDate(d);
  };

  // Table Data
  const periodDays = useMemo(() => {
    let days = [];
    if (view === "year") {
      // Just return monthly aggregates or show everything in that year
      return allDayData.filter(d => d.date.startsWith(navDate.getFullYear().toString())).sort((a,b)=>b.date.localeCompare(a.date));
    } else if (view === "month") {
      const ms = `${navDate.getFullYear()}-${String(navDate.getMonth() + 1).padStart(2, "0")}`;
      return allDayData.filter(d => d.date.startsWith(ms)).sort((a,b)=>b.date.localeCompare(a.date));
    } else {
      const ws = getWeekStart(navDate.toISOString().split("T")[0]);
      const wDate = new Date(ws + "T12:00:00");
      const weekDates = Array.from({length:7}, (_,i)=>{
        const cd = new Date(wDate); cd.setDate(cd.getDate()+i); return cd.toISOString().split("T")[0];
      });
      return allDayData.filter(d => weekDates.includes(d.date)).sort((a,b)=>b.date.localeCompare(a.date));
    }
  }, [allDayData, navDate, view]);

  const navLabel = view === "year" ? navDate.getFullYear() : view === "month" ? navDate.toLocaleDateString("es-ES", {month:"long", year:"numeric"}) : fmtWeek(navDate.toISOString().split("T")[0]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      
      {/* QUICK PANELS */}
      <div style={st.card}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
          <button style={st.ghost(showGoals)} onClick={()=>setShowGoals(!showGoals)}>🎯 EDIT GOALS</button>
          <button style={st.ghost(showBio)} onClick={()=>setShowBio(!showBio)}>⚖️ ADD BIO</button>
          <button style={st.ghost(showLog)} onClick={()=>setShowLog(!showLog)}>📋 LOG DAILY</button>
        </div>

        {showGoals && (
          <div style={{ display:"flex", gap:24, flexWrap:"wrap", padding:"14px", background:T.card2, borderRadius:6, border:`1px solid ${T.border}`, marginBottom:12 }}>
            {["cal","p","c","g"].map((k) => (
              <div key={k} style={{ display:"flex", flexDirection:"column", gap:4, minWidth:80 }}>
                <span style={st.lbl}>{k.toUpperCase()}</span>
                <input style={{ ...st.inp, padding:"6px 10px" }} type="number" value={goals[k]} onChange={e => setGoals(p => ({ ...p, [k]: +e.target.value }))}/>
              </div>
            ))}
          </div>
        )}

        {showBio && (
          <div style={{ padding:"14px", background:T.card2, borderRadius:6, border:`1px solid ${T.border}`, marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div><span style={st.lbl}>DATE</span><input style={st.inp} type="date" value={bioForm.date} onChange={e => setBioForm(p => ({ ...p, date: e.target.value }))}/></div>
              <div><span style={st.lbl}>WEIGHT (KG)</span><input style={{...st.inp, borderColor:T.accent}} type="number" step="0.1" value={bioForm.weight} onChange={e => setBioForm(p => ({ ...p, weight: e.target.value }))}/></div>
              <div><span style={st.lbl}>FAT %</span><input style={st.inp} type="number" step="0.1" value={bioForm.fat} onChange={e => setBioForm(p => ({ ...p, fat: e.target.value }))}/></div>
              <div><span style={st.lbl}>MUSC (KG)</span><input style={st.inp} type="number" step="0.1" value={bioForm.muscle} onChange={e => setBioForm(p => ({ ...p, muscle: e.target.value }))}/></div>
            </div>
            <button style={st.btn} onClick={addBio}>SAVE BIO DATA</button>
          </div>
        )}

        {showLog && (
          <div style={{ padding:"14px", background:T.card2, borderRadius:6, border:`1px solid ${T.border}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:10 }}>
              <div><span style={st.lbl}>DATE</span><input style={st.inp} type="date" value={dailyForm.date} onChange={e => setDailyForm(p => ({ ...p, date: e.target.value }))}/></div>
              <div><span style={st.lbl}>CAL OUT</span><input style={st.inp} type="number" value={dailyForm.calOut} onChange={e => setDailyForm(p => ({ ...p, calOut: e.target.value }))}/></div>
              <div><span style={st.lbl}>STEPS</span><input style={st.inp} type="number" value={dailyForm.steps} onChange={e => setDailyForm(p => ({ ...p, steps: e.target.value }))}/></div>
              <div><span style={st.lbl}>SLEEP (H)</span><input style={st.inp} type="number" step="0.1" value={dailyForm.sleep} onChange={e => setDailyForm(p => ({ ...p, sleep: e.target.value }))}/></div>
              <div><span style={st.lbl}>SLEEP SCORE</span><input style={st.inp} type="number" value={dailyForm.score} onChange={e => setDailyForm(p => ({ ...p, score: e.target.value }))}/></div>
              <div><span style={st.lbl}>HRV</span><input style={st.inp} type="number" value={dailyForm.hrv} onChange={e => setDailyForm(p => ({ ...p, hrv: e.target.value }))}/></div>
              <div><span style={st.lbl}>BODY BATTERY</span><input style={{...st.inp, borderColor:T.orange}} type="number" value={dailyForm.bb} onChange={e => setDailyForm(p => ({ ...p, bb: e.target.value }))}/></div>
              <div><span style={st.lbl}>RECOVERY %</span><input style={{...st.inp, borderColor:T.green}} type="number" value={dailyForm.recovery} placeholder="Auto" onChange={e => setDailyForm(p => ({ ...p, recovery: e.target.value }))}/></div>
            </div>
            <button style={st.btn} onClick={saveDaily}>💾 UPLOAD TELEMETRY</button>
          </div>
        )}
      </div>

      {/* DYNAMIC RECAP TABLE */}
      <div style={{ ...st.card, overflowX:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div style={{ display:"flex", gap:6 }}>
            {["week","month","year"].map(v => (
              <button key={v} onClick={()=>{setView(v);setNavDate(new Date(activeDate+"T12:00:00"));}} style={st.ghost(view===v)}>{v}</button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button style={st.btnSm} onClick={prevPeriod}>◀</button>
            <div style={{ fontSize:14, fontWeight:700, fontFamily:T.font, textTransform:"uppercase", minWidth:160, textAlign:"center" }}>{navLabel}</div>
            <button style={st.btnSm} onClick={nextPeriod}>▶</button>
          </div>
        </div>

        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:1000, fontFamily:T.font }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}`, background:T.card2 }}>
              {["DATE", "IN", "OUT", "BAL", "PROT", "CARB", "FAT (G)", "SLEEP", "SCORE", "HRV", "B.BATTERY", "REC %", ""].map((h, i) => (
                <th key={h} style={{ padding:"10px 8px", color:T.muted, fontWeight:700, textAlign: i===0 ? "left" : "right", letterSpacing:"0.1em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodDays.map(d => {
              const bal = (d.calIn > 0 && d.calOut > 0) ? d.calIn - d.calOut : null;
              if (editId === d.date) {
                return (
                  <tr key={d.date} style={{background:T.card2}}>
                    <td colSpan={13} style={{padding:"8px"}}>
                      <EditRow fields={[{k:"calOut",l:"CalOut",t:"number"}, {k:"steps",l:"Steps",t:"number"}, {k:"sleep",l:"Sleep",step:"0.1"}, {k:"score",l:"Score",t:"number"}, {k:"hrv",l:"HRV",t:"number"}, {k:"bb",l:"BodyBat",t:"number"}, {k:"recovery",l:"Rec %",t:"number"}]}
                        vals={editRow} onChange={(k,v)=>setEditRow(p=>({...p,[k]:v}))}
                        onSave={()=>{ upsertDaily({date:d.date, calOut:+editRow.calOut||0, steps:+editRow.steps||null, sleep:+editRow.sleep||null, score:+editRow.score||null, hrv:+editRow.hrv||null, bb:+editRow.bb||null, recovery:+editRow.recovery||null}); setEditId(null); }}
                        onCancel={()=>setEditId(null)} T={T}/>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background: d.date === activeDate ? T.accentDim : "transparent" }}>
                  <td style={{ padding:"12px 8px", textAlign:"left", color:T.text, fontWeight:700 }}>{d.date.slice(5)}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.accent }}>{d.calIn ? Math.round(d.calIn) : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.blue }}>{d.calOut ? Math.round(d.calOut) : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:bal ? (bal<0?T.green:T.red) : T.muted, fontWeight:700 }}>{bal ? (bal>0?"+":"")+Math.round(bal) : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.green }}>{d.p ? Math.round(d.p)+"g" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.blue }}>{d.c ? Math.round(d.c)+"g" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.purple }}>{d.g ? Math.round(d.g)+"g" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.purple }}>{d.sleep ? d.sleep.toFixed(1)+"H" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.teal }}>{d.score ? d.score+"%" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.text }}>{d.hrv || "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:T.orange }}>{d.bb || "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"right", color:getRecoveryColor(d.recovery, T), fontWeight:700 }}>{d.recovery ? Math.round(d.recovery)+"%" : "—"}</td>
                  <td style={{ padding:"12px 8px", textAlign:"center" }}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEditId(d.date); setEditRow({calOut:d.calOut||"",steps:d.steps||"",sleep:d.sleep||"",score:d.score||"",hrv:d.hrv||"",bb:d.bb||"",recovery:d.recovery||""});}}>✏️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SETTINGS (REORDER)
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab({ tabOrder, setTabOrder, allTabs, T }) {
  const st = mkS(T);
  const move = (i, dir) => {
    if (i+dir < 0 || i+dir >= tabOrder.length) return;
    const newOrder = [...tabOrder];
    const temp = newOrder[i];
    newOrder[i] = newOrder[i+dir];
    newOrder[i+dir] = temp;
    setTabOrder(newOrder);
  };
  return (
    <div style={st.card}>
      <SH title="⚙️ DASHBOARD PREFERENCES" />
      <span style={st.lbl}>TAB ORDER RECONFIGURATION</span>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:10 }}>
        {tabOrder.map((id, i) => {
          const tInfo = allTabs.find(t=>t.id===id);
          if(!tInfo) return null;
          return (
            <div key={id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:T.card2, padding:"10px 14px", borderRadius:6, border:`1px solid ${T.border}` }}>
              <span style={{ fontSize:12, fontWeight:700, fontFamily:T.font, color:T.text }}>{i+1}. {tInfo.l}</span>
              <div style={{ display:"flex", gap:4 }}>
                <button style={st.btnSm} onClick={()=>move(i, -1)} disabled={i===0}>▲</button>
                <button style={st.btnSm} onClick={()=>move(i, 1)} disabled={i===tabOrder.length-1}>▼</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES RESTANTES (Calendario, Nutricion, Fuerza, Running, Telemetry, Sleep)
// OMITIDOS PARCIALMENTE PARA BREVEDAD, SE MANTIENEN IGUALES CON PASO DE PROPS
// (Abajo incluyo Biometria modificada para Vistas Múltiples)
// ─────────────────────────────────────────────────────────────────────────────

function Biometria({ bios, setBios, activeDate, T }) {
  const st=mkS(T);
  const [bioEditId, setBioEId] = useState(null);
  const [bioEditRow, setBioER] = useState({});
  const [viewFilter, setViewFilter] = useState("ALL"); // 1W, 1M, 1Y, ALL

  const tip = p => <ChartTip {...p} T={T}/>;
  const last = bios[bios.length-1], first = bios[0];
  const delta = last && first ? (last.weight - first.weight).toFixed(1) : null;
  
  // Apply Filter to Trend
  const trend = useMemo(() => {
    let raw = bios.map(b => ({ date:b.date, Peso:b.weight, Grasa:b.fat, Músculo:b.muscle, Agua:b.water }));
    if (viewFilter === "ALL") return raw;
    
    const filterDate = new Date(activeDate + "T12:00:00");
    if (viewFilter === "1W") filterDate.setDate(filterDate.getDate() - 7);
    if (viewFilter === "1M") filterDate.setMonth(filterDate.getMonth() - 1);
    if (viewFilter === "1Y") filterDate.setFullYear(filterDate.getFullYear() - 1);
    
    const filterStr = filterDate.toISOString().split("T")[0];
    return raw.filter(d => d.date >= filterStr && d.date <= activeDate);
  }, [bios, activeDate, viewFilter]);

  const saveBioEd = () => {
    setBios(p => p.map(b => b.id === bioEditId ? { ...b, ...bioEditRow, weight: +bioEditRow.weight, fat: +bioEditRow.fat || null, muscle: +bioEditRow.muscle || null, imc: +bioEditRow.imc || calcIMC(+bioEditRow.weight, 181) } : b));
    setBioEId(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.g2}>
        {last && (
          <div style={st.card}>
            <SH title={`📊 LAST READING · ${last.date.slice(5)}`}/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))", gap:8 }}>
              {[{l:"WGT",v:`${last.weight}KG`,c:T.accent},{l:"BMI",v:last.imc??"—",c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},{l:"FAT",v:last.fat?`${last.fat}%`:"—",c:T.red},{l:"MUSC",v:last.muscle?`${last.muscle}KG`:"—",c:T.green},{l:"H2O",v:last.water?`${last.water}%`:"—",c:T.blue},{l:"ΔWGT",v:delta?`${delta>0?"+":""}${delta}KG`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                <div key={m.l} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:6,padding:"10px 4px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:T.muted,fontWeight:700,fontFamily:T.font}}>{m.l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:m.c,marginTop:4,fontFamily:T.font}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ ...st.card, flex: 1 }}>
          <SH title="📈 METRIC TRENDS" right={
            <div style={{display:"flex",gap:4}}>
              {["1W","1M","1Y","ALL"].map(v => <button key={v} onClick={()=>setViewFilter(v)} style={st.ghost(viewFilter===v)}>{v}</button>)}
            </div>
          }/>
          {trend.length < 2 ? <Placeholder msg="NEED MORE DATA IN THIS RANGE" T={T}/> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} tickFormatter={d => d.slice(5)}/>
                <YAxis tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} domain={["auto","auto"]}/>
                <Tooltip content={tip}/>
                <Line type="linear" dataKey="Peso" stroke={T.accent} strokeWidth={2} dot={{ r: 3, fill: T.card, stroke: T.accent, strokeWidth: 2 }}/>
                <Line type="linear" dataKey="Grasa" stroke={T.red} strokeWidth={2} dot={{ r: 3, fill: T.card, stroke: T.red, strokeWidth: 2 }}/>
                <Line type="linear" dataKey="Músculo" stroke={T.green} strokeWidth={2} dot={{ r: 3, fill: T.card, stroke: T.green, strokeWidth: 2 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {bios.length > 0 && (
        <div style={{ ...st.card, overflowX: "auto" }}>
          <SH title="📋 WEIGHT & BODY COMP LOGS" right={<span style={{ fontSize: 10, color: T.muted, fontFamily: T.font }}>{bios.length} RECORDS</span>}/>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700, fontFamily: T.font }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.card2 }}>
                {["DATE", "WEIGHT", "BMI", "FAT %", "MUSC", "WATER", ""].map(h => (
                  <th key={h} style={{ padding: "10px 8px", color: T.muted, fontWeight: 700, textAlign: h === "" ? "center" : "right", letterSpacing: "0.1em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...bios].reverse().map(b => bioEditId === b.id ? (
                <tr key={b.id}>
                  <td colSpan={7} style={{ padding: "8px 0" }}>
                    <EditRow fields={[{ k: "date", l: "Date", t: "date" }, { k: "weight", l: "Kg", t: "number", step: "0.1" }, { k: "imc", l: "BMI", t: "number", step: "0.1" }, { k: "fat", l: "Fat%", t: "number", step: "0.1" }, { k: "muscle", l: "Musc", t: "number", step: "0.1" }, { k: "water", l: "H2o%", t: "number", step: "0.1" }]}
                      vals={bioEditRow} onChange={(k, v) => setBioER(p => ({ ...p, [k]: v }))} onSave={saveBioEd} onCancel={() => setBioEId(null)} T={T}/>
                  </td>
                </tr>
              ) : (
                <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}`, background: b.date === activeDate ? T.accentDim : "transparent" }}>
                  <td style={{ padding: "12px 8px", textAlign: "left", color: T.text, fontWeight: 700 }}>{b.date.slice(5)}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: T.muted }}>{b.weight}KG</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: T.muted }}>{b.imc ?? "—"}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: T.muted }}>{b.fat ? `${b.fat}%` : "—"}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: T.muted }}>{b.muscle ? `${b.muscle}KG` : "—"}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: T.muted }}>{b.water ? `${b.water}%` : "—"}</td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <button style={st.icon(T.accent)} onClick={() => { setBioEId(b.id); setBioER({ date: b.date, weight: b.weight, imc: b.imc || "", fat: b.fat || "", muscle: b.muscle || "", water: b.water || "" }); }}>✏️</button>
                    <button style={st.icon(T.red)} onClick={() => setBios(p => p.filter(x => x.id !== b.id))}>🗑</button>
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
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
const ALL_TABS_LIB = [
  {id:"dashboard",l:"SYS DASHBOARD"},
  {id:"daily_recap",l:"DAILY / RECAP"},
  {id:"calendario",l:"CALENDAR"},
  {id:"nutricion",l:"FUEL"},
  {id:"fuerza",l:"CHASSIS"},
  {id:"running",l:"AERO"},
  {id:"bio",l:"WEIGHT"},
  {id:"sleep",l:"RECOVERY"},
  {id:"settings",l:"⚙️ SETTINGS"}
];

export default function App() {
  useEffect(()=>{
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;700&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
    return()=>{try{document.head.removeChild(l);}catch(_){}};
  },[]);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(LS + "theme");
    return savedTheme ? JSON.parse(savedTheme) : "dark";
  });
  
  const T = theme === "dark" ? DARK : theme === "blueprint" ? BLUEPRINT : theme === "winter_arc" ? WINTER_ARC : LIGHT;

  const [activeDate, setActiveDate] = useState(TODAY);

  const [tabOrder, setTabOrder] = useState(()=>lsGet("tabOrder", ALL_TABS_LIB.map(t=>t.id)));
  const [tab, setTab] = useState(()=>lsGet("tab", "dashboard"));

  const [healthLog,setHL]   =useState(()=>lsGet("hl",  SEED_HEALTH));
  const [foodLog,  setFL]   =useState(()=>lsGet("fl",  []));
  const [db,       setDb]   =useState(()=>lsGet("db",  SEED_DB));
  const [strLog,   setStr]  =useState(()=>lsGet("str", []));
  const [runs,     setRuns] =useState(()=>lsGet("runs",[]));
  const [bios,     setBios] =useState(()=>lsGet("bios",[]));
  const [shoes,    setShoes]=useState(()=>lsGet("shoes", []));
  const [goals,    setGoals]=useState(()=>lsGet("goals",{...DEFAULT_GOALS}));
  const [program,  setProg] =useState(()=>lsGet("prog","Hipertrofia"));
  const [plans,    setPlans]=useState(()=>lsGet("plans",Object.fromEntries(Object.entries(PLANS).map(([k,v])=>[k,{...v}]))));
  const [projects, setProjs]=useState(()=>lsGet("projs",{}));
  
  const [runGoal,    setRunGoal]   =useState(()=>lsGet("runGoal",21.1));
  const [targetTime, setTargetTime] =useState(()=>lsGet("targetTime", "02:00:00"));

  useEffect(()=>{lsSet("theme",theme);},[theme]);
  useEffect(()=>{lsSet("tabOrder",tabOrder);},[tabOrder]);
  useEffect(()=>{lsSet("tab",tab);},[tab]);
  useEffect(()=>{lsSet("hl",healthLog);},[healthLog]);
  useEffect(()=>{lsSet("fl",foodLog);},[foodLog]);
  useEffect(()=>{lsSet("db",db);},[db]);
  useEffect(()=>{lsSet("str",strLog);},[strLog]);
  useEffect(()=>{lsSet("runs",runs);},[runs]);
  useEffect(()=>{lsSet("bios",bios);},[bios]);
  useEffect(()=>{lsSet("shoes",shoes);},[shoes]);
  useEffect(()=>{lsSet("goals",goals);},[goals]);
  useEffect(()=>{lsSet("prog",program);},[program]);
  useEffect(()=>{lsSet("plans",plans);},[plans]);
  useEffect(()=>{lsSet("projs",projects);},[projects]);
  useEffect(()=>{lsSet("runGoal",runGoal);},[runGoal]);
  useEffect(()=>{lsSet("targetTime",targetTime);},[targetTime]);

  const getDayData=useCallback((date)=>{
    const h=healthLog.find(d=>d.date===date)||{};
    const fs=foodLog.filter(f=>f.date===date), hasF=fs.length>0;
    const calIn=hasF?fs.reduce((s,f)=>s+f.cal,0):(h.calIn||0);
    const p=hasF?r1(fs.reduce((s,f)=>s+f.p,0)):(h.p||0);
    const c=hasF?r1(fs.reduce((s,f)=>s+f.c,0)):(h.c||0);
    const g=hasF?r1(fs.reduce((s,f)=>s+f.g,0)):(h.g||0);
    return{date,calOut:h.calOut||0,calIn,p,c,g,sleep:h.sleep||null,score:h.score||null,hrv:h.hrv||null,bb:h.bb||null,recovery:h.recovery||null,steps:h.steps||null,balance:calIn-(h.calOut||0),goals:h.goals||{...DEFAULT_GOALS}, focus:h.focus||[]};
  },[healthLog,foodLog]);

  const allDates = useMemo(() => {
    const s = new Set([...healthLog.map(h=>h.date), ...foodLog.map(f=>f.date), TODAY, activeDate]);
    return [...s].sort().reverse();
  }, [healthLog, foodLog, activeDate]);

  const activeDayData = useMemo(()=>getDayData(activeDate),[getDayData, activeDate]);
  const weekData = useMemo(()=>allDates.filter(d => d <= activeDate).slice(0,14).map(d=>getDayData(d)), [allDates, activeDate, getDayData]);
  const last7    = useMemo(()=>weekData.slice(0,7).reverse(), [weekData]);
  const allDayData = useMemo(()=>allDates.map(d=>getDayData(d)), [allDates, getDayData]);

  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const currentHour=new Date().getHours();
  const greeting=currentHour<12?"MORNING":currentHour<18?"AFTERNOON":"EVENING";
  const rawDate = new Date(activeDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

  const cycleTheme = () => { setTheme(t => t === "dark" ? "light" : t === "light" ? "blueprint" : t === "blueprint" ? "winter_arc" : "dark"); };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", position: "relative", overflow: "hidden", fontFamily:T.font, color:T.text, padding:"16px 18px", transition:"background 0.3s,color 0.3s" }}>
      
      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:14, position:"relative", zIndex:1 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:"0.1em", lineHeight:1.1, color:T.text }}>
            {greeting}, <span style={{color:T.accent}}>RAFA</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: T.card, padding: "6px 12px", borderRadius: 4, border: `1px solid ${T.border}`, transition: "all 0.15s" }}>
              <span style={{ fontSize:12, color:T.text, fontWeight:700, letterSpacing:"0.1em" }}>{rawDate}</span>
              <span style={{ fontSize:9, color:T.accent }}>▼</span>
              <input type="date" value={activeDate} max={TODAY} onChange={(e) => setActiveDate(e.target.value)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
            </div>
            {activeDate !== TODAY && (
              <button onClick={() => setActiveDate(TODAY)} style={{ background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily:T.font }}>↺ LIVE</button>
            )}
          </div>
        </div>
        
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={cycleTheme} style={{ background: theme === "light" ? T.accent : T.card2, color: theme === "light" ? "#000" : T.text, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
            {theme === "dark" ? "🌙 DARK" : theme === "light" ? "☀️ LIGHT" : theme === "blueprint" ? "📐 BLUEPRINT" : "❄️ WINTER ARC"}
          </button>
          {activeDayData.calIn>0&&<div style={{ background:T.card, borderRadius:4, padding:"6px 12px", fontSize:11, color:T.accent, fontWeight:700, border:`1px solid ${T.border}`, fontFamily:T.font }}>{activeDayData.calIn} IN</div>}
          {activeDayData.calOut>0&&<div style={{ background:T.card, borderRadius:4, padding:"6px 12px", fontSize:11, fontWeight:700, color:bCol(activeDayData.balance), border:`1px solid ${T.border}`, fontFamily:T.font }}>{activeDayData.balance>0?"+":""}{activeDayData.balance} BAL</div>}
        </div>
      </div>

      {/* ── Tabs (Dynamic Reordering) ── */}
      <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", position:"relative", zIndex:1 }}>
        {tabOrder.map(tabId => {
          const tInfo = ALL_TABS_LIB.find(t=>t.id === tabId);
          if(!tInfo) return null;
          return (
            <button key={tabId} onClick={()=>setTab(tabId)} style={{
              background:tab===tabId?T.accentDim:"transparent", color:tab===tabId?T.accent:T.muted,
              border:`1px solid ${tab===tabId?T.accent:T.border}`, borderRadius:4, padding:"8px 16px", fontWeight:700, fontSize:11,
              cursor:"pointer", transition:"all 0.2s", fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.1em"
            }}>{tInfo.l}</button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ position:"relative", zIndex:1 }}>
        {tab==="dashboard"   && <Dashboard activeDayData={activeDayData} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setPlans={setPlans} setTab={setTab} activeDate={activeDate} theme={theme} T={T}/>}
        {tab==="daily_recap" && <DailyRecap allDayData={allDayData} bios={bios} setBios={setBios} setHL={setHL} goals={goals} setGoals={setGoals} activeDate={activeDate} T={T}/>}
        {tab==="calendario"  /* Mantener otros Tabs Renderizados */}
        {tab==="bio"         && <Biometria bios={bios} setBios={setBios} activeDate={activeDate} T={T}/>}
        {tab==="settings"    && <SettingsTab tabOrder={tabOrder} setTabOrder={setTabOrder} allTabs={ALL_TABS_LIB} T={T}/>}
      </div>

      <div style={{ textAlign: "center", padding: "30px 0 10px", fontSize: 10, color: T.muted, letterSpacing: "0.2em", fontFamily: T.font, opacity: 0.5, fontWeight: 700 }}>
        POWERED BY GARMIN
      </div>
    </div>
  );
}