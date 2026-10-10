import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS GLOBALES & CSS VARIABLES (ENGINEERING & WHOOP VIBE)
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    
    :root {
      --bg: #0C1730; --side: #09122A; --card: #132244; --hero: #182B56;
      --tx: #EAF0FB; --mu: #9FB0D0; --track: #26386A;
      --ok: #5DBFA0; --mid: #D8AA5A; --bad: #D87474;
      --btn: #5DBFA0; --btnt: #06201A; --sel: #1B2F5C;
    }
    
    .theme-light {
      --bg: #F3F5FA; --side: #FFFFFF; --card: #FFFFFF; --hero: #FFFFFF;
      --tx: #14213D; --mu: #56658A; --track: #E1E7F3;
      --ok: #2F9E80; --mid: #B9822A; --bad: #C2514F;
      --btn: #14213D; --btnt: #FFFFFF; --sel: #E8EEF9;
    }

    body {
      background-color: var(--bg);
      color: var(--tx);
      font-family: 'DM Sans', sans-serif;
      margin: 0;
      padding: 0;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    * { box-sizing: border-box; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--track); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--mu); }
  `}</style>
);

const T = {
  bg: "var(--bg)", card: "var(--card)", card2: "var(--side)", card3: "var(--hero)",
  text: "var(--tx)", muted: "var(--mu)", border: "var(--track)", inputBg: "var(--bg)",
  ok: "var(--ok)", mid: "var(--mid)", bad: "var(--bad)",
  btn: "var(--btn)", btnt: "var(--btnt)", sel: "var(--sel)", font: "'DM Sans', sans-serif"
};

// ─────────────────────────────────────────────────────────────────────────────
// ICONS (Minimalist SVG - Lucide Style)
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Moon: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Heart: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>,
  Battery: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line></svg>,
  Activity: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Flame: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>,
  Food: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>,
  Plus: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Sun: ({ size=16, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Edit: ({ size=14, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Delete: ({ size=14, color }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
};

// ─────────────────────────────────────────────────────────────────────────────
// COLORES SEMÁNTICOS (SOLO PARA MÉTRICAS ESPECÍFICAS)
// ─────────────────────────────────────────────────────────────────────────────
const getSleepColor = (hrs) => hrs >= 7 ? T.ok : hrs >= 5.5 ? T.mid : T.bad;
const getRecoveryColor = (score) => {
  if (!score) return T.muted;
  if (score >= 67) return T.ok;
  if (score >= 34) return T.mid;
  return T.bad;
};
const getStepsColor = (steps) => steps >= 10000 ? T.ok : steps >= 6000 ? T.mid : T.bad;

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA & WHOOP LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",       Vie:"Upper Compuesto",       Sáb:"Piernas + Cardio", Dom:"Descanso" },
  Fuerza:     { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",             Vie:"OHP + Accesorios",      Sáb:"Cardio LISS",      Dom:"Descanso" },
  Definición: { Lun:"Full Body A",     Mar:"HIIT 30min",        Mié:"Full Body B",       Jue:"LISS 45min",              Vie:"Full Body C + Cardio",  Sáb:"HIIT 30min",       Dom:"Descanso" },
  Power:      { Lun:"Potencia Sup.",   Mar:"Potencia Inf.",     Mié:"Descanso",          Jue:"Olímpicos + Fuerza",  Vie:"Pliometría + Velocidad", Sáb:"LISS",            Dom:"Descanso" },
};

const RUTINAS_BASE = {
  "Pecho + Tríceps": [
    { exercise: "Press Banca", sets: 4, reps: 10, weight: 60, rpe: 8 },
    { exercise: "Aperturas Inclinadas", sets: 3, reps: 12, weight: 14, rpe: 8 },
    { exercise: "Pushdown en Polea", sets: 3, reps: 15, weight: 25, rpe: 8 },
    { exercise: "Fondos en Paralelas", sets: 3, reps: 10, weight: 0, rpe: 8 }
  ],
  "Espalda + Bíceps": [
    { exercise: "Peso Muerto", sets: 4, reps: 8, weight: 100, rpe: 8 },
    { exercise: "Jalón al Pecho", sets: 3, reps: 12, weight: 50, rpe: 8 },
    { exercise: "Remo en Polea", sets: 3, reps: 12, weight: 45, rpe: 8 },
    { exercise: "Curl con Barra", sets: 3, reps: 12, weight: 20, rpe: 8 }
  ],
  "Piernas + Glúteos": [
    { exercise: "Sentadilla", sets: 4, reps: 10, weight: 100, rpe: 8 },
    { exercise: "Prensa de Pierna", sets: 3, reps: 12, weight: 150, rpe: 8 },
    { exercise: "Leg Extension", sets: 3, reps: 15, weight: 50, rpe: 9 }
  ],
  "Hombros + Core": [
    { exercise: "Press Militar", sets: 4, reps: 10, weight: 40, rpe: 8 },
    { exercise: "Elevaciones Laterales", sets: 4, reps: 15, weight: 10, rpe: 9 },
    { exercise: "Plancha", sets: 3, reps: 1, weight: 0, rpe: 8 }
  ],
  "Upper Compuesto": [
    { exercise: "Press Banca", sets: 4, reps: 8, weight: 65, rpe: 8 },
    { exercise: "Dominadas", sets: 4, reps: 8, weight: 0, rpe: 8 },
    { exercise: "Remo con Barra", sets: 3, reps: 10, weight: 50, rpe: 8 }
  ],
  "Piernas + Cardio": [
    { exercise: "Sentadilla", sets: 4, reps: 10, weight: 100, rpe: 8 },
    { exercise: "Carrera en Cinta", sets: 1, reps: 1, weight: 0, rpe: 7 }
  ]
};

const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL_ES = { Lun:"Lunes", Mar:"Martes", Mié:"Miércoles", Jue:"Jueves", Vie:"Viernes", Sáb:"Sábado", Dom:"Domingo" };
const EXERCISE_LIB = {
  "Pecho":   ["Press Banca","Press Inclinado","Press Declinado","Aperturas c/ Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "Brazos":  ["Curl con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea"],
  "Hombros": ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Encogimientos"],
  "Core":    ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel"],
  "Cardio":  ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Escaladora"],
};

const getLocalYYYYMMDD = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};
const TODAY = getLocalYYYYMMDD();
const DEFAULT_GOALS = { cal:2400, p:180, c:280, g:60 };

const calculateWhoopRecovery = (hrv, rhr, sleepScore) => {
  if (!hrv && !rhr && !sleepScore) return null;
  let factors = 0;
  let scoreSum = 0;
  
  if (sleepScore) { scoreSum += sleepScore; factors += 1; }
  if (hrv) { 
    const hrvScore = Math.min(100, Math.max(10, (hrv / 75) * 85)); 
    scoreSum += hrvScore; factors += 1; 
  }
  if (rhr) { 
    const rhrScore = Math.min(100, Math.max(10, (55 / rhr) * 90)); 
    scoreSum += rhrScore; factors += 1; 
  }
  return factors > 0 ? Math.round(scoreSum / factors) : null;
};

const SEED_HEALTH   = [];
const SEED_DB = [];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LS = "aristeia_v8_";
function lsGet(key, fallback) {
  try { const r=localStorage.getItem(LS+key); return r===null?fallback:JSON.parse(r); }
  catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(LS+key, JSON.stringify(val)); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid      = () => Date.now() + Math.random();
const r1       = n => Math.round(n*10)/10;
const fmt      = (n,d=1) => (n==null||isNaN(n))?"—":Number(n).toFixed(d);
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
    card:   { background:T.card, borderRadius:12, padding:18, color:T.text, border:`1px solid ${T.border}`, position:"relative" },
    card2:  { background:T.card2, borderRadius:8, padding:14, color:T.text, fontFamily:T.font, border:`1px solid ${T.border}` },
    lbl:    { fontSize:12, color:T.muted, marginBottom:6, display:"block", fontWeight:500 },
    num:    { fontVariantNumeric:"tabular-nums", fontWeight:600 },
    inp:    { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 14px", color:T.text, fontSize:14, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, transition:"border-color 0.15s" },
    sel:    { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 34px 10px 14px", color:T.text, fontSize:14, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, appearance:"none", WebkitAppearance:"none", backgroundImage:SVG_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:    { background:T.btn, color:T.btnt, border:"none", borderRadius:6, padding:"12px 22px", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:T.font, width:"100%", display:"flex", justifyContent:"center", gap:8, alignItems:"center" },
    btnSm:  { background:T.card, color:T.text, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 18px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" },
    ghost:  a=>({ background:a?T.sel:"transparent", color:T.text, border:`1px solid ${a?T.border:"transparent"}`, borderRadius:6, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap", transition:"all 0.15s" }),
    icon:   ()=>({ background:"none", border:"none", cursor:"pointer", padding:"6px", borderRadius:4, display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }),
    g2:     { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES GLOBALES Y ATÓMICOS
// ─────────────────────────────────────────────────────────────────────────────
function NumberPicker({ value, onChange, options, label, T }) {
  const selRef = useRef(null);
  useEffect(() => {
    if (selRef.current) selRef.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [value]);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
      <span style={{ fontSize:11, color:T.muted, fontWeight:600, fontFamily:T.font }}>{label}</span>
      <div style={{
        background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 5px",
        height:210, overflowY:"auto", width:62,
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        scrollbarWidth:"none", msOverflowStyle:"none",
      }}>
        {options.map(opt => {
          const isSel = String(opt) === String(value);
          return (
            <button key={opt} ref={isSel ? selRef : null}
              onClick={() => onChange(String(opt))}
              style={{
                width:50, minHeight:38, flexShrink:0,
                border: isSel ? `1px solid ${T.border}` : "1px solid transparent",
                background: isSel ? T.sel : "transparent",
                borderRadius:4,
                color: T.text,
                fontWeight: isSel ? 600 : 400, fontSize:15,
                cursor:"pointer", fontFamily:T.font, textAlign:"center",
                transition:"all 0.12s",
                fontVariantNumeric: "tabular-nums"
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyStrView({ strLog, plans, program, activeDate, onInject, T }) {
  const st = mkS(T);
  const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];
  const [expanded, setExpanded] = useState(() => new Set([actDayDow]));
  const [checked, setChecked] = useState({});
  const weekDates = getCurrentWeekDates(activeDate);

  useEffect(() => { setExpanded(new Set([actDayDow])); }, [activeDate, actDayDow]);

  const toggle = day => setExpanded(prev => {
    const s = new Set(prev); s.has(day) ? s.delete(day) : s.add(day); return s;
  });
  const toggleCheck = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ ...st.card, padding:0, overflow:"hidden" }}>
      {PLAN_KEYS.map((dayKey, idx) => {
        const dateStr = weekDates[idx];
        const dayExs = strLog.filter(s => s.date === dateStr);
        const planned = plans[program]?.[dayKey];
        const isSelectedDay = dateStr === activeDate;
        const isOpen = expanded.has(dayKey);
        const isRest = planned?.includes("Descanso");
        const fmtDate = new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { month:"short", day:"numeric" });

        return (
          <div key={dayKey} style={{ borderBottom:`1px solid ${T.border}` }}>
            <button onClick={() => toggle(dayKey)} style={{
              width:"100%", background:isSelectedDay ? T.sel : "transparent",
              border:"none", cursor:"pointer", padding:"16px 20px",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              textAlign:"left", fontFamily:T.font, transition:"background 0.15s"
            }}>
              <div>
                <div style={{ fontSize:22, fontWeight:600, color: isSelectedDay ? T.text : isRest ? T.muted : T.text }}>
                  {DAY_FULL_ES[dayKey]}
                </div>
                <div style={{ fontSize:12, color:T.muted, marginTop:4, display:"flex", gap:10, alignItems:"center" }}>
                  <span>{fmtDate}</span>
                  {dateStr === TODAY && <span style={{ background:T.card3, border:`1px solid ${T.border}`, color:T.text, borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:600 }}>Hoy</span>}
                  {isSelectedDay && dateStr !== TODAY && <span style={{ background:T.text, color:T.bg, borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:600 }}>Activo</span>}
                  {planned && <span style={{ color:isRest?T.muted:T.text, fontWeight:500 }}>{planned}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {dayExs.length > 0 && (
                  <span style={{ background:isSelectedDay?T.text:T.card3, color:isSelectedDay?T.bg:T.text, borderRadius:4, padding:"3px 8px", fontSize:13, fontWeight:600 }}>
                    {dayExs.filter(e => checked[e.id]).length}/{dayExs.length}
                  </span>
                )}
                <span style={{ color:T.muted, fontSize:16, fontWeight:600 }}>{isOpen ? "−" : "+"}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${T.border}` }}>
                {dayExs.length === 0 ? (
                  <div style={{ color:T.muted, fontSize:13, padding:"14px 0", display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isRest ? "Día de descanso" : "Sin registro de entrenamiento"}
                    </div>
                    {!isRest && RUTINAS_BASE[planned] && (
                      <button style={{ ...st.ghost(true), alignSelf: "flex-start", marginTop: 4, display:"flex", alignItems:"center", gap:6 }} onClick={() => onInject(dateStr, RUTINAS_BASE[planned])}>
                        <Icons.Activity color={T.text} size={14}/> Cargar plantilla: {planned}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                    {dayExs.map(ex => {
                      const done = checked[ex.id];
                      return (
                        <div key={ex.id} onClick={() => toggleCheck(ex.id)} style={{
                          display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:6, cursor:"pointer",
                          background: done ? T.sel : T.card2, border:`1px solid ${done ? T.border : T.border}`, transition:"all 0.15s"
                        }}>
                          <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`1px solid ${done ? T.text : T.muted}`, background: done ? T.text : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                            {done && <span style={{ color:T.bg, fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:600, color: done ? T.text : T.text, textDecoration: done ? "line-through" : "none" }}>
                              {ex.exercise}
                            </div>
                            <div style={{ fontSize:12, color:T.muted, marginTop:2, display:"flex", gap:10, fontFamily:T.font, ...st.num }}>
                              {ex.sets && ex.reps && <span>{ex.sets}x{ex.reps}</span>}
                              {ex.weight > 0 && <span style={{ color:T.text }}>{ex.weight}kg</span>}
                              {ex.rpe > 0 && <span>RPE {ex.rpe}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChartTip({ active, payload, T }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:"8px 12px", boxShadow:"0 4px 12px rgba(0,0,0,0.1)", fontSize:12, fontFamily:T.font }}>
      {payload.map((p,i)=><div key={i} style={{color:p.color, fontWeight:600}}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  );
}
function SH({ title, right, icon }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:15, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
        {icon} {title}
      </div>
      {right}
    </div>
  );
}
function ProgBar({ value, max, color, h=4 }) {
  return (
    <div style={{ height:h, borderRadius:2, overflow:"hidden", background:"var(--track)", marginTop:6 }}>
      <div style={{ height:"100%", width:`${Math.min((value/max)*100,100)}%`, background:color, borderRadius:2, transition:"width 0.45s ease" }}/>
    </div>
  );
}
function MiniRing({ pct, color, size=42, sw=4 }) {
  const r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-Math.min(pct,1));
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--track)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={off}
        style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}

function PaceRing({ currentPaceSecs, targetPaceSecs, theme, T }) {
  const size=200, sw=18, r=(size-sw)/2, circ=2*Math.PI*r;
  const basePace = targetPaceSecs + 180; 
  let rawPct = 0;
  if (currentPaceSecs > 0) {
    const progress = basePace - currentPaceSecs;
    const totalRange = basePace - targetPaceSecs;
    rawPct = Math.max(0, progress / totalRange);
  }
  const pct = Math.min(rawPct, 1);
  const off = circ*(1-pct);
  const done = currentPaceSecs > 0 && currentPaceSecs <= targetPaceSecs;
  
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ display:"block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--track)" strokeWidth={sw}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        {pct>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={done?T.ok:T.text}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:"stroke-dashoffset 0.8s ease" }}/>}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
        <div style={{ fontSize:11, color:T.muted, fontWeight:600 }}>RITMO ACTUAL</div>
        <div style={{ fontSize:32, fontWeight:600, color:done?T.ok:T.text, lineHeight:1, fontFamily:T.font, fontVariantNumeric:"tabular-nums" }}>{currentPaceSecs > 0 ? secsToPace(currentPaceSecs) : "--:--"}</div>
        <div style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>Meta {secsToPace(targetPaceSecs)}</div>
      </div>
    </div>
  );
}

function EditRow({ fields, vals, onChange, onSave, onCancel, T }) {
  const st=mkS(T);
  return (
    <div style={{ ...st.card2, border:`1px solid ${T.text}`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f=>(
          <div key={f.k}><span style={st.lbl}>{f.l}</span>
            <input style={{...st.inp, padding:"6px 10px"}} type={f.t||"text"} step={f.step} value={vals[f.k]??""} onChange={e=>onChange(f.k,e.target.value)}/></div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.text, color:T.bg, border:"none", flex:1 }} onClick={onSave}>Guardar</button>
        <button style={{ ...st.btnSm, flex:1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function FoodEditRow({ entry, onSave, onCancel, T }) {
  const st=mkS(T);
  const hasUnit=!!entry.unitCal;
  const [qty,setQty]=useState(entry.qty||1);
  const [raw,setRaw]=useState({ name:entry.name, cal:entry.cal, p:entry.p, c:entry.c, g:entry.g });
  const preview=hasUnit?{ cal:Math.round(entry.unitCal*qty), p:r1(entry.unitP*qty), c:r1(entry.unitC*qty), g:r1(entry.unitG*qty) }:null;
  const doSave=()=>onSave(hasUnit?{ ...entry, qty, ...preview }:{ ...entry, ...raw, cal:+raw.cal, p:+raw.p||0, c:+raw.c||0, g:+raw.g||0 });
  if (hasUnit) return (
    <div style={{ ...st.card2, border:`1px solid ${T.text}`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:14, fontWeight:600 }}>{entry.name}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
          <input style={{...st.inp, padding:"6px 10px"}} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
        <div style={{ fontSize:13, color:T.muted, paddingTop:16, fontFamily:T.font }}>× {entry.unit}</div>
      </div>
      {preview&&<div style={{ fontSize:12, color:T.muted, fontFamily:T.font, ...st.num }}>= {preview.cal.toLocaleString('es-ES')} KCAL · {preview.p}P · {preview.c}C · {preview.g}G</div>}
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.text, color:T.bg, border:"none", flex:1 }} onClick={doSave}>Guardar</button>
        <button style={{ ...st.btnSm, flex:1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
  return <EditRow fields={[{k:"name",l:"Descripción"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
    vals={raw} onChange={(k,v)=>setRaw(p=>({...p,[k]:v}))} onSave={doSave} onCancel={onCancel} T={T}/>;
}

function KPICard({ icon, label, value, sub, color, T }) {
  const st = mkS(T);
  return (
    <div style={{
      background: T.card2, border: `1px solid ${T.border}`,
      borderRadius:8, padding:"16px",
      color:T.text, minHeight:100, display:"flex", flexDirection:"column", justifyContent:"space-between",
      position:"relative", overflow:"hidden"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.muted, fontWeight:600 }}>
        {icon} {label}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:12 }}>
        <div>
          <div style={{ fontSize:28, fontWeight:600, color, lineHeight:1, fontFamily:T.font, ...st.num }}>{value}</div>
          {sub&&<div style={{ fontSize:12, color:T.muted, marginTop:6, fontFamily:T.font }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ msg, T }) {
  return <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:13, fontFamily:T.font, fontWeight:500 }}>{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ activeDayData, weekData, last7, goals, program, plans, setPlans, setTab, activeDate, theme, T }) {
  const st=mkS(T);
  const [editDay, setEditDay] = useState(null);
  const tip=p=><ChartTip {...p} T={T}/>;

  const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];

  const kpis=[
    { icon:<Icons.Food size={14} color={T.muted}/>, label:"Cal In",   value:activeDayData.calIn ? activeDayData.calIn.toLocaleString('es-ES') : "—", sub:activeDayData.calIn ? `Meta: ${goals.cal.toLocaleString('es-ES')}` : "Sin registrar",  color:T.text },
    { icon:<Icons.Activity size={14} color={T.muted}/>, label:"Balance", value:activeDayData.calIn > 0 && activeDayData.calOut > 0 ? (activeDayData.balance > 0 ? `+${activeDayData.balance.toLocaleString('es-ES')}` : activeDayData.balance.toLocaleString('es-ES')) : "—", sub:activeDayData.calIn > 0 && activeDayData.calOut > 0 ? (activeDayData.balance < 0 ? "Déficit" : "Superávit") : "Sin registrar", color: T.text },
    { icon:<Icons.Food size={14} color={T.muted}/>, label:"Proteína", value:activeDayData.calIn > 0 ? `${Math.round(activeDayData.p)}g` : "—", sub:`Meta: ${goals.p}g`, color: T.text },
    { icon:<Icons.Flame size={14} color={T.muted}/>, label:"Cal Out", value:activeDayData.calOut ? activeDayData.calOut.toLocaleString('es-ES') : "—", sub:"Quemadas", color:T.text },
    { icon:<Icons.Activity size={14} color={T.muted}/>, label:"Pasos",   value:activeDayData.steps ? activeDayData.steps.toLocaleString('es-ES') : "—", sub:"Meta: 10,000", color: activeDayData.steps ? getStepsColor(activeDayData.steps, T) : T.text },
    { icon:<Icons.Heart size={14} color={T.muted}/>, label:"Recuperación", value:activeDayData.recovery ? `${activeDayData.recovery}%` : "—", sub:`Sueño: ${activeDayData.sleep||"—"}h`, color:getRecoveryColor(activeDayData.recovery, T) },
    { icon:<Icons.Battery size={14} color={T.muted}/>, label:"Batería", value:activeDayData.bodyBattery ? `${activeDayData.bodyBattery}%` : "—", sub:"Energía", color:T.text },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
        {kpis.map(k=><KPICard key={k.label} {...k} T={T}/>)}
      </div>

      <div style={{ ...st.card, padding:0, overflowX:"auto" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
          <SH title="Progreso de 7 días" icon={<Icons.Activity size={18} color={T.text}/>} right={<span style={{ fontSize:12, color:T.muted, fontFamily:T.font }}>Desempeño reciente</span>}/>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:700, fontFamily:T.font }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}`, background:T.card2 }}>
              {[["Fecha","l"],["Out","r"],["In","r"],["Balance","r"],["Prot","r"],["Carb","r"],["Grasa","r"],["Sueño","r"],["Recup","r"],["Bat","r"],["Pasos","r"]].map(([h,a])=>(
                <th key={h} style={{ padding:"12px 14px", color:T.muted, fontWeight:600, textAlign:a==="r"?"right":"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d=>{
              const isT=d.date===activeDate, g=d.goals, bal=d.calIn-d.calOut, hasIn=d.calIn>0, hasOut=d.calOut>0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background:isT?T.sel:"transparent", transition:"background 0.2s", ...st.num }}>
                  <td style={{ padding:"12px 14px", fontWeight:isT?600:400, color:isT?T.text:T.text, whiteSpace:"nowrap" }}>
                    {isT && <span style={{display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.text, marginRight:8}}/>}
                    {d.date===TODAY?"Hoy":d.date.slice(5)}
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.text }}>{hasOut?d.calOut.toLocaleString('es-ES'):"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.text }}>{hasIn?d.calIn.toLocaleString('es-ES'):"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", fontWeight:600, color:T.text }}>{(hasOut&&hasIn)?(bal>0?`+${bal.toLocaleString('es-ES')}`:bal.toLocaleString('es-ES')):"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:hasIn?T.text:T.muted }}>{hasIn?`${Math.round(d.p)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:hasIn?T.text:T.muted }}>{hasIn?`${Math.round(d.c)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:hasIn?T.text:T.muted }}>{hasIn?`${Math.round(d.g)}g`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:d.sleep ? getSleepColor(d.sleep, T) : T.muted }}>{d.sleep?`${fmt(d.sleep,1)}h`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:getRecoveryColor(d.recovery, T) }}>{d.recovery?`${d.recovery}%`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:T.text }}>{d.bodyBattery?`${d.bodyBattery}%`:"—"}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right", color:d.steps ? getStepsColor(d.steps, T) : T.muted }}>{d.steps?d.steps.toLocaleString('es-ES'):"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={st.g2}>
        <div style={st.card}>
          <SH title="Proteína vs Meta" icon={<Icons.Food size={18} color={T.text}/>} />
          {last7.filter(d=>d.calIn>0).length>=2?(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7} margin={{top:15,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--track)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:11,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:11,fontFamily:T.font}}/>
                <Tooltip content={tip}/>
                <ReferenceLine y={goals.p} stroke={T.text} strokeDasharray="3 3" label={{position:"top",value:`Meta ${goals.p}g`,fill:T.text,fontSize:11,fontFamily:T.font}} />
                <Bar dataKey="p" name="Proteína" radius={[2,2,0,0]} barSize={16}>
                  {last7.map((d,i)=><Cell key={i} fill={d.p>=goals.p?T.text:T.muted}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<Placeholder msg="Datos insuficientes" T={T}/>}
        </div>
        
        <div style={st.card}>
          <SH title="Déficit / Superávit" icon={<Icons.Flame size={18} color={T.text}/>} />
          {last7.filter(d=>d.calOut>0 && d.calIn>0).length>=2?(
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7.filter(d=>d.calOut>0 && d.calIn>0)} margin={{top:15,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--track)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:11,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:11,fontFamily:T.font}}/>
                <Tooltip content={tip}/>
                <ReferenceLine y={0} stroke={T.text} strokeWidth={1} />
                <Bar dataKey="balance" name="Balance" radius={[2,2,0,0]} barSize={16}>
                  {last7.filter(d=>d.calOut>0 && d.calIn>0).map((d,i)=>(
                    <Cell key={i} fill={d.balance < 0 ? T.ok : T.bad}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<Placeholder msg="Datos insuficientes" T={T}/>}
        </div>
      </div>

      <div style={st.card}>
        <SH title="Plan semanal" icon={<Icons.Activity size={18} color={T.text}/>} right={<span style={{fontSize:12, color:T.muted, fontFamily:T.font}}>{program}</span>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day=>{
            const label=plans[program]?.[day]||"—", isT=day===actDayDow, isR=label.includes("Descanso");
            return (
              <div key={day} onClick={() => setEditDay(day)} style={{ background:isT?T.sel:T.card2, border:`1px solid ${isT?T.border:T.border}`, borderRadius:6, padding:"12px 10px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:11, fontWeight:600, color:isT?T.text:T.muted, marginBottom:8, fontFamily:T.font }}>{DAY_FULL_ES[day]}</div>
                {editDay === day ? (
                  <input autoFocus value={plans[program]?.[day] || ""}
                    onChange={e => setPlans(p => ({...p, [program]: {...p[program], [day]: e.target.value}}))}
                    onBlur={() => setEditDay(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditDay(null)}
                    style={{ background:"transparent", border:"none", outline:"none", fontSize:12, textAlign:"center", color:T.text, width:"100%", fontFamily:T.font }} />
                ) : (
                  <div style={{ fontSize:13, fontWeight:600, color:isR?T.muted:T.text, lineHeight:1.4 }}>{label}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: RECAP (WEEKLY AGGREGATES & DAILY LOGS)
// ─────────────────────────────────────────────────────────────────────────────
function Recap({ allDayData, bios, setHL, setBios, T }) {
  const st = mkS(T);
  const [expanded, setExpanded] = useState(new Set());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [editDate, setEditDate] = useState(null);
  const [editForm, setEditForm] = useState({});

  const toggle = wk => setExpanded(prev => {
    const s = new Set(prev);
    s.has(wk) ? s.delete(wk) : s.add(wk);
    return s;
  });
  
  const weeklyStats = useMemo(() => {
    const combined = {};
    
    allDayData.forEach(d => { combined[d.date] = { ...d }; });
    
    bios.forEach(b => {
      if (!combined[b.date]) combined[b.date] = { date: b.date };
      combined[b.date].weight = b.weight;
      combined[b.date].fat = b.fat;
      combined[b.date].muscle = b.muscle;
    });

    const groups = {};
    
    Object.values(combined).forEach(d => {
      const wk = getWeekStart(d.date);
      if (!groups[wk]) {
        groups[wk] = { 
          week: wk, 
          days: [],
          calInSum: 0, calInDays: 0,
          calOutSum: 0, calOutDays: 0,
          pSum: 0, cSum: 0, gSum: 0, macroDays: 0,
          recSum: 0, recDays: 0,
          bbSum: 0, bbDays: 0,
          sleepSum: 0, sleepDays: 0,
          weightSum: 0, weightDays: 0,
          fatSum: 0, fatDays: 0,
          muscleSum: 0, muscleDays: 0
        };
      }
      
      groups[wk].days.push(d);

      if (d.calIn > 0) {
        groups[wk].calInSum += d.calIn; groups[wk].calInDays++;
        groups[wk].pSum += d.p || 0; 
        groups[wk].cSum += d.c || 0; 
        groups[wk].gSum += d.g || 0; 
        groups[wk].macroDays++;
      }
      if (d.calOut > 0) { groups[wk].calOutSum += d.calOut; groups[wk].calOutDays++; }
      if (d.recovery > 0) { groups[wk].recSum += d.recovery; groups[wk].recDays++; }
      if (d.bodyBattery > 0) { groups[wk].bbSum += d.bodyBattery; groups[wk].bbDays++; }
      if (d.sleep > 0) { groups[wk].sleepSum += d.sleep; groups[wk].sleepDays++; }
      if (d.weight > 0) { groups[wk].weightSum += d.weight; groups[wk].weightDays++; }
      if (d.fat > 0) { groups[wk].fatSum += d.fat; groups[wk].fatDays++; }
      if (d.muscle > 0) { groups[wk].muscleSum += d.muscle; groups[wk].muscleDays++; }
    });

    return Object.values(groups).sort((a,b) => b.week.localeCompare(a.week)).map(g => {
      const avgCalIn = g.calInDays ? g.calInSum / g.calInDays : 0;
      const avgCalOut = g.calOutDays ? g.calOutSum / g.calOutDays : 0;
      return {
        week: g.week,
        days: g.days.sort((a,b) => b.date.localeCompare(a.date)),
        weight: g.weightDays ? g.weightSum / g.weightDays : null,
        fat: g.fatDays ? g.fatSum / g.fatDays : null,
        muscle: g.muscleDays ? g.muscleSum / g.muscleDays : null,
        sleep: g.sleepDays ? g.sleepSum / g.sleepDays : null,
        recovery: g.recDays ? g.recSum / g.recDays : null,
        bodyBattery: g.bbDays ? g.bbSum / g.bbDays : null,
        calIn: avgCalIn,
        calOut: avgCalOut,
        balance: (avgCalIn > 0 && avgCalOut > 0) ? avgCalIn - avgCalOut : null,
        p: g.macroDays ? g.pSum / g.macroDays : 0,
        c: g.macroDays ? g.cSum / g.macroDays : 0,
        g: g.macroDays ? g.gSum / g.macroDays : 0,
      };
    });
  }, [allDayData, bios]);

  const availableMonths = useMemo(() => {
    const m = new Set(weeklyStats.map(w => w.week.slice(0, 7)));
    return [...m].sort().reverse();
  }, [weeklyStats]);

  const filteredStats = useMemo(() => {
    if (selectedMonth === "all") return weeklyStats;
    return weeklyStats.filter(w => w.week.startsWith(selectedMonth));
  }, [weeklyStats, selectedMonth]);

  const handleSaveEdit = () => {
    setHL(prev => {
      const i = prev.findIndex(x => x.date === editDate);
      const existing = i >= 0 ? prev[i] : { date: editDate };
      const entry = {
        ...existing,
        sleep: +editForm.sleep || null,
        score: +editForm.score || null,
        recovery: +editForm.recovery || null,
        bodyBattery: +editForm.bodyBattery || null,
        calOut: +editForm.calOut || 0,
        calIn: +editForm.calIn || 0,
        steps: +editForm.steps || null
      };
      if (i >= 0) { const u = [...prev]; u[i] = entry; return u; }
      return [...prev, entry];
    });

    if (editForm.weight || editForm.fat || editForm.muscle) {
      setBios(prev => {
        const i = prev.findIndex(x => x.date === editDate);
        const existing = i >= 0 ? prev[i] : { date: editDate, id: uid(), height: 181 };
        const entry = {
          ...existing,
          weight: +editForm.weight || null,
          fat: +editForm.fat || null,
          muscle: +editForm.muscle || null
        };
        entry.imc = entry.weight ? calcIMC(entry.weight, entry.height || 181) : null;
        if (i >= 0) { const u = [...prev]; u[i] = entry; return u; }
        return [...prev, entry];
      });
    }
    setEditDate(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ ...st.card, overflowX:"auto", padding:0 }}>
        <div style={{ padding:"16px 20px" }}>
          <SH title="Resumen semanal" icon={<Icons.Activity size={18} color={T.text}/>} right={<span style={{fontSize:12,color:T.muted}}>{filteredStats.length} Semanas</span>}/>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            <button onClick={() => setSelectedMonth("all")} style={st.ghost(selectedMonth === "all")}>Todos</button>
            {availableMonths.map(m => (
              <button key={m} onClick={() => setSelectedMonth(m)} style={st.ghost(selectedMonth === m)}>
                {fmtMonth(m)}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:1000, fontFamily:T.font }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}`, background:T.card2 }}>
              {["Semana / Día", "Enfoque", "Peso", "Grasa", "Músculo", "Sueño", "Recup", "Batería", "In", "Out", "Balance", "Prot", "Carb", "Grasa", ""].map((h, i) => (
                <th key={h} style={{ padding:"12px 14px", color:T.muted, fontWeight:600, textAlign: (i<=1 || h==="") ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((w) => {
              const isOpen = expanded.has(w.week);
              return (
                <React.Fragment key={w.week}>
                  <tr onClick={() => toggle(w.week)} style={{ borderBottom:`1px solid ${T.border}`, background: isOpen ? T.sel : "transparent", cursor: "pointer", transition: "background 0.2s", ...st.num }}>
                    <td style={{ padding:"14px", textAlign:"left", fontWeight:600, color:T.text }}>{isOpen ? "▼" : "▶"} {fmtWeek(w.week)}</td>
                    <td style={{ padding:"14px", textAlign:"left", color:T.muted }}>—</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text, fontWeight:600 }}>{w.weight ? `${w.weight.toFixed(1)}kg` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.fat ? `${w.fat.toFixed(1)}%` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.muscle ? `${w.muscle.toFixed(1)}kg` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:w.sleep ? getSleepColor(w.sleep, T) : T.text }}>{w.sleep ? `${w.sleep.toFixed(1)}h` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:getRecoveryColor(w.recovery, T) }}>{w.recovery ? `${Math.round(w.recovery)}%` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.bodyBattery ? `${Math.round(w.bodyBattery)}%` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.calIn ? Math.round(w.calIn).toLocaleString('es-ES') : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.calOut ? Math.round(w.calOut).toLocaleString('es-ES') : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text, fontWeight:600 }}>{w.balance ? (w.balance > 0 ? "+" : "") + Math.round(w.balance).toLocaleString('es-ES') : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.p ? `${Math.round(w.p)}g` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.c ? `${Math.round(w.c)}g` : "—"}</td>
                    <td style={{ padding:"14px", textAlign:"right", color:T.text }}>{w.g ? `${Math.round(w.g)}g` : "—"}</td>
                    <td></td>
                  </tr>
                  
                  {isOpen && w.days.map(d => {
                    const hasIn = d.calIn > 0;
                    const dBal = (hasIn && d.calOut > 0) ? d.calIn - d.calOut : null;
                    
                    if (editDate === d.date) {
                      return (
                        <tr key={`${d.date}-edit`}>
                          <td colSpan={15} style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
                            <EditRow 
                              fields={[
                                { k:"weight", l:"Peso (Kg)", t:"number", step:"0.1" },
                                { k:"fat", l:"Grasa %", t:"number", step:"0.1" },
                                { k:"muscle", l:"Musc (Kg)", t:"number", step:"0.1" },
                                { k:"sleep", l:"Sueño (h)", step:"0.01", t:"number" },
                                { k:"score", l:"Score %", t:"number" },
                                { k:"recovery", l:"Recup %", t:"number" },
                                { k:"bodyBattery", l:"Bat %", t:"number" },
                                { k:"calIn", l:"Cal In", t:"number" },
                                { k:"calOut", l:"Cal Out", t:"number" },
                                { k:"steps", l:"Pasos", t:"number" }
                              ]}
                              vals={editForm}
                              onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))}
                              onSave={handleSaveEdit}
                              onCancel={() => setEditDate(null)}
                              T={T}
                            />
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background: T.card2, ...st.num }}>
                        <td style={{ padding:"10px 14px 10px 30px", textAlign:"left", color:T.text, fontSize:12 }}>{d.date}</td>
                        <td style={{ padding:"10px 14px", textAlign:"left", color:T.text, fontSize:12 }}>
                          {d.focus && d.focus.length > 0 ? d.focus.join(", ") : "—"}
                        </td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{d.weight ? d.weight.toFixed(1) : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{d.fat ? `${d.fat.toFixed(1)}%` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{d.muscle ? d.muscle.toFixed(1) : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:d.sleep ? getSleepColor(d.sleep, T) : T.text, fontSize:12 }}>{d.sleep ? `${d.sleep.toFixed(1)}h` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:getRecoveryColor(d.recovery, T), fontSize:12 }}>{d.recovery ? `${Math.round(d.recovery)}%` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{d.bodyBattery ? `${Math.round(d.bodyBattery)}%` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{hasIn ? Math.round(d.calIn).toLocaleString('es-ES') : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:T.text, fontSize:12 }}>{d.calOut ? Math.round(d.calOut).toLocaleString('es-ES') : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:dBal ? (dBal<0?T.ok:T.bad) : T.muted, fontSize:12, fontWeight:600 }}>{dBal ? (dBal > 0 ? "+" : "") + Math.round(dBal).toLocaleString('es-ES') : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:hasIn?T.text:T.muted, fontSize:12 }}>{hasIn ? `${Math.round(d.p)}g` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:hasIn?T.text:T.muted, fontSize:12 }}>{hasIn ? `${Math.round(d.c)}g` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"right", color:hasIn?T.text:T.muted, fontSize:12 }}>{hasIn ? `${Math.round(d.g)}g` : "—"}</td>
                        <td style={{ padding:"10px 14px", textAlign:"center" }}>
                          <div style={{ display:"flex", gap:4 }}>
                            <button style={st.icon()} onClick={(e) => {
                              e.stopPropagation();
                              setEditDate(d.date);
                              setEditForm({
                                weight: d.weight || "", fat: d.fat || "", muscle: d.muscle || "",
                                sleep: d.sleep || "", score: d.score || "", recovery: d.recovery || "",
                                bodyBattery: d.bodyBattery || "", calIn: d.calIn || "", calOut: d.calOut || "", steps: d.steps || ""
                              });
                            }}>
                              <EditIcon color={T.text} />
                            </button>
                            <button style={st.icon()} onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("¿Eliminar registro de este día?")) {
                                setHL(p => p.filter(x => x.date !== d.date));
                                setBios(p => p.filter(x => x.date !== d.date));
                              }
                            }}>
                              <DeleteIcon color={T.bad} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CALENDARIO 
// ─────────────────────────────────────────────────────────────────────────────
function Calendario({ allDayData, bios, activeDate, setActiveDate, theme, T }) {
  const st = mkS(T);
  const [view, setView] = useState("month"); 
  
  const [navDate, setNavDate] = useState(() => {
    const d = new Date(activeDate + "T12:00:00");
    d.setDate(1); 
    return d;
  });

  useEffect(() => {
    const d = new Date(activeDate + "T12:00:00");
    if (d.getMonth() !== navDate.getMonth() || d.getFullYear() !== navDate.getFullYear()) {
      const newNav = new Date(d);
      newNav.setDate(1);
      setNavDate(newNav);
    }
  }, [activeDate]); 

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const prevPeriod = () => {
    const d = new Date(navDate);
    if (view === "year") d.setFullYear(year - 1);
    else d.setMonth(month - 1);
    setNavDate(d);
  };
  const nextPeriod = () => {
    const d = new Date(navDate);
    if (view === "year") d.setFullYear(year + 1);
    else d.setMonth(month + 1);
    setNavDate(d);
  };

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthData = allDayData.filter(d => d.date.startsWith(monthStr));

  const avgCalIn = monthData.filter(d => d.calIn > 0).reduce((s, d) => s + d.calIn, 0) / (monthData.filter(d => d.calIn > 0).length || 1);
  const avgCalOut = monthData.filter(d => d.calOut > 0).reduce((s, d) => s + d.calOut, 0) / (monthData.filter(d => d.calOut > 0).length || 1);
  const avgSleep = monthData.filter(d => d.sleep > 0).reduce((s, d) => s + d.sleep, 0) / (monthData.filter(d => d.sleep > 0).length || 1);
  const avgScore = monthData.filter(d => d.score > 0).reduce((s, d) => s + d.score, 0) / (monthData.filter(d => d.score > 0).length || 1);
  const selectedDayData = monthData.find(d => d.date === activeDate) || { calIn: 0, calOut: 0, p: 0, c: 0, sleep: 0, score: 0, recovery: 0, hrv: 0, rhr: 0 };
  const isSelectedDayInMonth = activeDate.startsWith(monthStr);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startPad = firstDay === 0 ? 6 : firstDay - 1; 
  const daysGrid = Array.from({ length: startPad + daysInMonth }, (_, i) => {
    if (i < startPad) return null;
    const d = i - startPad + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const data = monthData.find(x => x.date === dateStr);
    return { d, dateStr, data };
  });

  const weekDates = getCurrentWeekDates(activeDate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", background: T.card2, borderRadius: 6, padding: 4, border:`1px solid ${T.border}` }}>
          {["Semana", "Mes", "Año"].map(v => {
            const val = v === "Semana" ? "week" : v === "Mes" ? "month" : "year";
            return (
              <button key={v} onClick={() => setView(val)}
                style={{
                  background: view === val ? T.card : "transparent",
                  color: view === val ? T.text : T.muted,
                  borderRadius: 4, padding: "6px 16px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  fontFamily: T.font, transition: "all 0.2s"
                }}>
                {v}
              </button>
            )
          })}
        </div>

        {(view === "month" || view === "year") && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ ...st.icon(), background: T.card, padding: "8px 14px", border:`1px solid ${T.border}` }} onClick={prevPeriod}>◀</button>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, minWidth: 120, textAlign: "center", fontFamily:T.font }}>
              {view === "year" ? year : new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </div>
            <button style={{ ...st.icon(), background: T.card, padding: "8px 14px", border:`1px solid ${T.border}` }} onClick={nextPeriod}>▶</button>
          </div>
        )}
      </div>

      <div style={st.g2}>
        <div style={{ ...st.card, padding: "24px 20px" }}>
          
          {view === "year" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const mDate = new Date(year, i, 1);
                const isCurrentMonth = mDate.getMonth() === new Date().getMonth() && mDate.getFullYear() === new Date().getFullYear();
                return (
                  <button key={i} onClick={() => { setNavDate(mDate); setView("month"); }}
                    style={{
                      background: isCurrentMonth ? T.sel : T.card2,
                      border: `1px solid ${isCurrentMonth ? T.border : T.border}`,
                      borderRadius: 6, padding: "20px 10px",
                      color: isCurrentMonth ? T.text : T.text,
                      fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily:T.font, transition: "all 0.15s"
                    }}>
                    {mDate.toLocaleDateString("es-ES", { month: "short" })}
                  </button>
                )
              })}
            </div>
          )}

          {view === "month" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
              {["L", "M", "X", "J", "V", "S", "D"].map(d => (
                <div key={d} style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 8, fontFamily:T.font }}>{d}</div>
              ))}
              {daysGrid.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const isToday = day.dateStr === TODAY;
                const isSelected = day.dateStr === activeDate;
                const hasData = day.data && (day.data.calIn > 0 || day.data.calOut > 0 || day.data.sleep > 0);
                const recoveryColor = day.data?.recovery ? getRecoveryColor(day.data.recovery, T) : null;

                return (
                  <button key={day.dateStr} 
                    onClick={() => setActiveDate(day.dateStr)}
                    style={{
                      background: isSelected ? T.text : recoveryColor ? `${recoveryColor}18` : hasData ? T.card2 : "transparent",
                      border: `1px solid ${isSelected ? T.text : recoveryColor ? recoveryColor : isToday ? T.muted : "transparent"}`,
                      borderRadius: 6, aspectRatio: "1/1", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: isSelected ? T.bg : recoveryColor ? recoveryColor : T.text, fontFamily:T.font, transition: "all 0.15s", padding: 0
                    }}>
                    <span style={{ fontSize: 14, fontWeight: isToday || isSelected ? 600 : 400, ...st.num }}>{day.d}</span>
                  </button>
                );
              })}
            </div>
          )}

          {view === "week" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               {weekDates.map(dateStr => {
                 const mDate = new Date(dateStr + "T12:00:00");
                 const isSelected = dateStr === activeDate;
                 const isToday = dateStr === TODAY;
                 return (
                   <button key={dateStr} onClick={() => setActiveDate(dateStr)}
                    style={{
                      flex: 1, margin: "0 4px", padding: "16px 0",
                      background: isSelected ? T.text : T.card2,
                      border: `1px solid ${isSelected ? T.text : isToday ? T.muted : T.border}`,
                      borderRadius: 6, display: "flex", flexDirection: "column",
                      alignItems: "center", cursor: "pointer", color: isSelected ? T.bg : T.text,
                      fontFamily:T.font, transition: "all 0.15s"
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                        {mDate.toLocaleDateString("es-ES", { weekday: "short" })}
                      </span>
                      <span style={{ fontSize: 24, fontWeight: 600, marginTop: 4, ...st.num }}>
                        {mDate.getDate()}
                      </span>
                   </button>
                 );
               })}
            </div>
          )}

        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {(isSelectedDayInMonth || view === "week") && (
            <div style={{ ...st.card2, border: `1px solid ${T.sel}`, padding: 20 }}>
              <SH title={`Registro: ${activeDate === TODAY ? "Hoy" : activeDate}`} icon={<Icons.Activity size={18} color={T.text}/>}/>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily:T.font }}>Cal Quemadas</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>
                    {selectedDayData.calOut ? selectedDayData.calOut.toLocaleString('es-ES') : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily:T.font }}>Cal Ingeridas</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>
                    {selectedDayData.calIn > 0 ? selectedDayData.calIn.toLocaleString('es-ES') : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily:T.font }}>Recuperación</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: getRecoveryColor(selectedDayData.recovery, T), fontFamily:T.font, ...st.num }}>
                    {selectedDayData.recovery ? `${selectedDayData.recovery}%` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily:T.font }}>Sueño</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: selectedDayData.sleep ? getSleepColor(selectedDayData.sleep, T) : T.text, fontFamily:T.font, ...st.num }}>
                    {selectedDayData.sleep ? `${selectedDayData.sleep}h` : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ ...st.card, padding: 20, flex: 1 }}>
            <SH title={`Promedios: ${new Date(year, month, 1).toLocaleDateString("es-ES", { month: "short" })}`} icon={<Icons.Activity size={18} color={T.text}/>} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <span style={st.lbl}>In Promedio</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>{Math.round(avgCalIn).toLocaleString('es-ES')}</div>
              </div>
              <div>
                <span style={st.lbl}>Out Promedio</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>{Math.round(avgCalOut).toLocaleString('es-ES')}</div>
              </div>
              <div>
                <span style={st.lbl}>Sueño Prom.</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: avgSleep ? getSleepColor(avgSleep, T) : T.text, fontFamily:T.font, ...st.num }}>{avgSleep > 0 ? avgSleep.toFixed(1) : "—"}<span style={{fontSize:14, color:T.muted}}>h</span></div>
              </div>
              <div>
                <span style={st.lbl}>Score Prom.</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>{avgScore > 0 ? Math.round(avgScore) : "—"}<span style={{fontSize:14, color:T.muted}}>%</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: NUTRICIÓN
// ─────────────────────────────────────────────────────────────────────────────
function Nutricion({ activeDayData, activeFood, activeDate, setFL, db, setDb, goals, T }) {
  const st=mkS(T);
  const [mode,setMode]=useState("search");
  const [search,setSrch]=useState("");
  const [sel,setSel]=useState(null);
  const [qty,setQty]=useState(1);
  const [mf,setMF]=useState({ name:"",cal:"",p:"",c:"",g:"" });
  const [adb,setAdb]=useState({ name:"",unit:"",cal:"",p:"",c:"",g:"" });
  const [dbEId,setDbEId]=useState(null);
  const [dbER,setDbER]=useState({});
  const [lgEId,setLgEId]=useState(null);

  const pCol=(v,g)=>v>=g?T.text:T.muted;
  const gGoal=goals.g||60;
  const filtered=db.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  const macros=[{name:"Proteína",v:Math.round(activeDayData.p*4),c:T.text},{name:"Carbos",v:Math.round(activeDayData.c*4),c:T.muted},{name:"Grasas",v:Math.round(activeDayData.g*9),c:T.border}].filter(d=>d.v>0);

  const addDB=()=>{ if(!sel) return; setFL(p=>[...p,{
    date:activeDate, id:uid(), name:sel.name, qty, unit:sel.unit,
    cal:Math.round(sel.cal*qty), p:r1(sel.p*qty), c:r1(sel.c*qty), g:r1(sel.g*qty),
    unitCal:sel.cal, unitP:sel.p, unitC:sel.c, unitG:sel.g,
  }]); setSel(null);setQty(1);setSrch(""); };
  const addMan=()=>{ if(!mf.cal) return; setFL(p=>[...p,{date:activeDate,id:uid(),name:mf.name||"Registro manual",qty:1,cal:+mf.cal,p:+mf.p||0,c:+mf.c||0,g:+mf.g||0}]); setMF({name:"",cal:"",p:"",c:"",g:""}); };
  const addToDb=()=>{ if(!adb.name||!adb.cal) return; setDb(p=>[...p,{id:uid(),name:adb.name,unit:adb.unit||"Porción",cal:+adb.cal,p:+adb.p||0,c:+adb.c||0,g:+adb.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEd=()=>{ setDb(p=>p.map(f=>f.id===dbEId?{...f,...dbER,cal:+dbER.cal,p:+dbER.p,c:+dbER.c,g:+dbER.g}:f)); setDbEId(null); };

  const isToday = activeDate === TODAY;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","Buscar BD"],["manual","Entrada manual"],["adddb","Agregar a BD"],["editdb","Editar BD"]].map(([id,label])=>(
          <button key={id} style={st.ghost(mode===id)} onClick={()=>{setMode(id);setDbEId(null);}}>{label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,1.15fr) minmax(260px,1fr)", gap:16, alignItems:"start" }}>
        <div style={{ ...st.card, display:"flex", flexDirection:"column", minHeight:460 }}>
          {mode==="search"&&(<>
            <SH title={`Búsqueda en BD (${db.length})`} icon={<Icons.Food size={18} color={T.text}/>}/>
            <input style={{ ...st.inp, marginBottom:12 }} placeholder="Buscar..." value={search} onChange={e=>{setSrch(e.target.value);setSel(null);}}/>
            
            {sel&&(
              <div style={{ ...st.card2, marginBottom:16, border:`1px solid ${T.text}`, position:"sticky", top:0, zIndex:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:10 }}>{sel.name}</div>
                  <button onClick={()=>setSel(null)} style={{background:"none", border:"none", color:T.muted, cursor:"pointer"}}>✕</button>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
                    <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
                  <div style={{ fontSize:13, color:T.muted, paddingTop:16, fontFamily:T.font }}>× {sel.unit}</div>
                </div>
                <div style={{ fontSize:12, color:T.muted, marginBottom:10, fontWeight:600, fontFamily:T.font, ...st.num }}>{Math.round(sel.cal*qty).toLocaleString('es-ES')} KCAL · {r1(sel.p*qty)}P · {r1(sel.c*qty)}C · {r1(sel.g*qty)}G</div>
                <button style={st.btn} onClick={addDB}>Registrar</button>
              </div>
            )}

            <div style={{ flex:1, overflowY:"auto", marginBottom:10, minHeight:0 }}>
              {filtered.map(f=>(
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"10px 14px", borderRadius:6, cursor:"pointer", marginBottom:6,
                  border:`1px solid ${sel?.id===f.id?T.border:"transparent"}`,
                  background:sel?.id===f.id?T.sel:"transparent", transition:"all 0.12s" }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{f.name}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:4, fontFamily:T.font, ...st.num }}>{f.cal.toLocaleString('es-ES')} KCAL · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
          </>)}
          {mode==="manual"&&(<>
            <SH title="Registro manual" icon={<Icons.Edit size={18} color={T.text}/>}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Descripción</span>
                <input style={st.inp} placeholder="" value={mf.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/></div>
              {[["Kcal *","cal"],["Prot (g)","p"],["Carb (g)","c"],["Grasa (g)","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={mf[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            {mf.cal&&<div style={{fontSize:12,color:T.muted,marginBottom:10, fontFamily:T.font, ...st.num}}>Vista previa: {Number(mf.cal).toLocaleString('es-ES')} KCAL · {mf.p||0}P · {mf.c||0}C · {mf.g||0}G</div>}
            <button style={st.btn} onClick={addMan}>Registrar</button>
          </>)}
          {mode==="adddb"&&(<>
            <SH title="Nueva entrada BD" icon={<Icons.Plus size={18} color={T.text}/>}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Item</span>
                <input style={st.inp} placeholder="" value={adb.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/></div>
              <div><span style={st.lbl}>Unidad</span><input style={st.inp} placeholder="" value={adb.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/></div>
              {[["Kcal","cal"],["Prot (g)","p"],["Carb (g)","c"],["Grasa (g)","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={adb[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            <button style={st.btn} onClick={addToDb}>Guardar en BD</button>
          </>)}
          {mode==="editdb"&&(<>
            <SH title={`Editar BD (${db.length})`} icon={<Icons.Edit size={18} color={T.text}/>}/>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f=>dbEId===f.id?(
                <EditRow key={f.id}
                  fields={[{k:"name",l:"Name"},{k:"unit",l:"Unit"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
                  vals={dbER} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))} onSave={saveDbEd} onCancel={()=>setDbEId(null)} T={T}/>
              ):(
                <div key={f.id} style={{ ...st.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{fontWeight:600,fontSize:14}}>{f.name}</div>
                    <div style={{fontSize:12,color:T.muted, fontFamily:T.font, marginTop:4, ...st.num}}>{f.cal.toLocaleString('es-ES')} KCAL · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div></div>
                  <div style={{display:"flex",gap:4}}>
                    <button style={st.icon()} onClick={()=>{setDbEId(f.id);setDbER({...f});}}>
                      <EditIcon color={T.text} />
                    </button>
                    <button style={st.icon()} onClick={()=>setDb(p=>p.filter(x=>x.id!==f.id))}>
                      <DeleteIcon color={T.bad} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={st.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <span style={st.lbl}>{isToday ? "Ingesta de hoy" : "Registro de ingesta"}</span>
                <div style={{ fontSize:42, fontWeight:600, color:T.text, lineHeight:1, fontFamily:T.font, ...st.num }}>{activeDayData.calIn > 0 ? activeDayData.calIn.toLocaleString('es-ES') : "0"}</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:6, fontFamily:T.font }}>Meta: {goals.cal.toLocaleString('es-ES')} KCAL</div>
                <ProgBar value={activeDayData.calIn} max={goals.cal} color={activeDayData.calIn>goals.cal?T.bad:T.text} h={6}/>
              </div>
              {macros.length>0&&(
                <div style={{width:64,height:64}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={macros} cx="50%" cy="50%" innerRadius={18} outerRadius={30} dataKey="v" strokeWidth={0} paddingAngle={2}>
                      {macros.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:24 }}>
              {[{n:"Prot",v:activeDayData.p,g:goals.p,c:pCol(activeDayData.p,goals.p)},{n:"Carb",v:activeDayData.c,g:goals.c,c:cCol(activeDayData.c,goals.c)},{n:"Grasa",v:activeDayData.g,g:gGoal,c:T.muted}].map(m=>(
                <div key={m.n} style={{ background:T.card2, borderRadius:6, padding:10, textAlign:"center", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:22, fontWeight:600, color:m.c, fontFamily:T.font, ...st.num }}>{Math.round(m.v)}</div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4 }}>{m.n} / {m.g}g</div>
                  <ProgBar value={m.v} max={m.g} color={m.c} h={4}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...st.card, flex:1 }}>
            <SH title={`Registro (${isToday ? "Hoy" : activeDate})`} icon={<Icons.Food size={18} color={T.text}/>} right={<span style={{fontSize:12,color:T.muted,fontFamily:T.font}}>{activeFood.length} Entradas</span>}/>
            {activeFood.length===0?(
              <div style={{color:T.muted,fontSize:13,textAlign:"center",padding:16,fontFamily:T.font}}>Aún sin registrar calorías</div>
            ):(
              <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {activeFood.map(f=>lgEId===f.id?(
                  <FoodEditRow key={f.id} entry={f}
                    onSave={saved=>{setFL(p=>p.map(x=>x.id===f.id?saved:x));setLgEId(null);}}
                    onCancel={()=>setLgEId(null)} T={T}/>
                ):(
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:T.card2, borderRadius:6, border:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {f.name}{f.unit?` (${f.qty} × ${f.unit})`:""}
                      </div>
                      <div style={{ fontSize:11, color:T.muted, fontFamily:T.font, marginTop:4, ...st.num }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                      <span style={{ fontSize:16, fontWeight:600, color:T.text, fontFamily:T.font, ...st.num }}>{f.cal.toLocaleString('es-ES')}</span>
                      <div style={{ display:"flex", gap:2 }}>
                        <button style={st.icon()} onClick={()=>setLgEId(f.id)}>
                          <EditIcon color={T.text} />
                        </button>
                        <button style={st.icon()} onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}>
                          <DeleteIcon color={T.bad} />
                        </button>
                      </div>
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
const REPS_OPTIONS  = ["","1","2","3","4","5","6","7","8","9","10","11","12","15","20","25","30"];
const SETS_OPTIONS  = ["","1","2","3","4","5","6","7","8"];
const RPE_OPTIONS   = ["","6","6.5","7","7.5","8","8.5","9","9.5","10"];

function Fuerza({ strLog, setStr, program, setProg, plans, setPlans, activeDate, T }) {
  const st=mkS(T);
  const [exSel,setExSel]=useState(""), [exCust,setExCust]=useState("");
  const [form,setForm]=useState({ weight:"", reps:"", sets:"", rpe:"" });
  const [planOpen,setPlanO]=useState(false);
  const [editId,setEId]=useState(null), [editRow,setER]=useState({});
  const [quickLoad, setQuickLoad] = useState("");
  const [strView, setStrView] = useState("weekly");

  const isCustom=exSel==="__custom__";

  const addSet=()=>{
    const n=isCustom?exCust:exSel; if(!n) return;
    setStr(p=>[...p,{ ...form, exercise:n, date:activeDate, program, id:uid(),
      weight:+form.weight||0, reps:+form.reps||0, sets:+form.sets||0, rpe:+form.rpe||0 }]);
    setExSel(""); setExCust(""); setForm({ weight:"", reps:"", sets:"", rpe:"" });
  };

  const parseAndLoad = () => {
    if (!quickLoad) return;
    const lines = quickLoad.split("\n");
    const newSets = [];
    lines.forEach(line => {
      let txt = line.trim();
      if(!txt) return;
      txt = txt.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
      if(!txt) return;

      const matchObj = { exercise: "", sets: "", reps: "", weight: "", rpe: "" };

      const srMatch = txt.match(/\s+(\d+)\s*[xX]\s*(\d+)/);
      if (srMatch) {
          matchObj.sets = +srMatch[1];
          matchObj.reps = +srMatch[2];
          txt = txt.replace(srMatch[0], '');
      }

      const wMatch = txt.match(/(?:@\s*|con\s*)?(\d*\.?\d+)\s*(?:kg|lbs)/i) || txt.match(/@\s*(\d*\.?\d+)/);
      if (wMatch) {
          matchObj.weight = +wMatch[1];
          txt = txt.replace(wMatch[0], '');
      }

      const rpeMatch = txt.match(/(?:RPE|rpe)[:\s]*(\d*\.?\d+)/i);
      if (rpeMatch) {
          matchObj.rpe = +rpeMatch[1];
          txt = txt.replace(rpeMatch[0], '');
      }

      matchObj.exercise = txt.replace(/[-@]+$/, '').trim() || "EJERCICIO DESCONOCIDO";

      newSets.push({ id:uid(), ...matchObj, date:activeDate, program });
    });
    if (newSets.length > 0) { setStr(p=>[...p,...newSets]); setQuickLoad(""); alert(`✅ ${newSets.length} registros insertados.`); }
  };

  const injectTemplate = (date, template) => {
    const newSets = template.map(t => ({
      id: uid(), exercise: t.exercise, sets: t.sets, reps: t.reps, weight: t.weight, rpe: t.rpe, date, program
    }));
    setStr(p => [...p, ...newSets]);
  };

  const saveEd=()=>{ setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.card}>
        <SH title={<>Plan actual · <span style={{color:T.text,fontWeight:700}}>{program}</span></>}
          right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.keys(PLANS).map(p=><button key={p} style={st.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>)}</div>}/>
        <button onClick={()=>setPlanO(o=>!o)} style={{ ...st.ghost(planOpen), marginBottom:planOpen?14:0 }}>
          {planOpen?"Cerrar editor":"Configurar plan"}
        </button>
        {planOpen&&(
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{fontSize:12,color:T.muted, fontFamily:T.font}}>Sincronizado con el Dashboard.</div>
              <button onClick={()=>setPlans(p=>({...p,[program]:{...PLANS[program]}}))} style={{...st.ghost(false),fontSize:11,padding:"4px 12px"}}>Restaurar por defecto</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day=>{ 
                const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];
                const isT=day===actDayDow; 
                return (
                <div key={day} style={{ background:isT?T.sel:T.card2, border:`1px solid ${isT?T.border:T.border}`, borderRadius:6, padding:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{fontSize:11,fontWeight:600,color:isT?T.text:T.muted}}>{DAY_FULL_ES[day]}</span>
                    {isT&&<span style={{fontSize:10,background:T.text,color:T.bg,borderRadius:4,padding:"2px 6px",fontWeight:600}}>Activo</span>}
                  </div>
                  <input value={plans[program]?.[day]||""} onChange={e=>setPlans(p=>({...p,[program]:{...p[program],[day]:e.target.value}}))}
                    style={{...st.inp,fontSize:13,padding:"6px 10px"}} placeholder=""/>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button style={st.ghost(strView==="weekly")} onClick={()=>setStrView("weekly")}>Vista Semanal</button>
        <button style={st.ghost(strView==="register")} onClick={()=>setStrView("register")}>Registro Manual</button>
        <button style={st.ghost(strView==="history")} onClick={()=>setStrView("history")}>Historial ({strLog.length})</button>
      </div>

      {strView==="weekly" && (
        <WeeklyStrView strLog={strLog} plans={plans} program={program} activeDate={activeDate} onInject={injectTemplate} T={T}/>
      )}

      {strView==="register" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={st.g2}>
            <div style={st.card}>
              <SH title={`Registro individual (${activeDate === TODAY ? "Hoy" : activeDate})`} icon={<Icons.Plus size={18} color={T.text}/>}/>
              <div style={{marginBottom:10}}>
                <span style={st.lbl}>Ejercicio</span>
                <select value={exSel} onChange={e=>setExSel(e.target.value)} style={st.sel}>
                  <option value="" disabled>— Seleccionar —</option>
                  {Object.entries(EXERCISE_LIB).map(([cat,exs])=>(
                    <optgroup key={cat} label={cat}>{exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}</optgroup>
                  ))}
                  <option value="__custom__">Personalizado</option>
                </select>
              </div>
              {isCustom&&<div style={{marginBottom:10}}><span style={st.lbl}>Nombre del ejercicio</span>
                <input style={{...st.inp,borderColor:T.border}} placeholder="" value={exCust} onChange={e=>setExCust(e.target.value)}/></div>}
              {(exSel&&!isCustom)&&<div style={{background:T.sel,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 14px",marginBottom:12,fontSize:13,color:T.text,fontWeight:600}}>✓ {exSel}</div>}

              <div style={{marginBottom:18}}>
                <span style={st.lbl}>Peso (KG)</span>
                <input style={st.inp} type="number" placeholder="" step="0.5"
                  value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))}/>
              </div>

              <div style={{
                display:"flex", gap:12, justifyContent:"center",
                background:T.card2, borderRadius:8, border:`1px solid ${T.border}`, padding:"16px 12px", marginBottom:16
              }}>
                <NumberPicker value={form.sets} onChange={v=>setForm(p=>({...p,sets:v}))}
                  options={SETS_OPTIONS} label="Sets" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.reps} onChange={v=>setForm(p=>({...p,reps:v}))}
                  options={REPS_OPTIONS} label="Reps" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.rpe} onChange={v=>setForm(p=>({...p,rpe:v}))}
                  options={RPE_OPTIONS} label="RPE" T={T}/>
              </div>

              {(form.sets && form.reps) && (
                <div style={{ background:T.sel, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 14px", marginBottom:12, fontSize:14, color:T.text, fontWeight:600, textAlign:"center", fontFamily:T.font }}>
                  {form.sets}×{form.reps}{form.weight?` @ ${form.weight}kg`:""}{form.rpe?` · RPE ${form.rpe}`:""}
                </div>
              )}

              <button style={{...st.btn, opacity:(exSel&&!(isCustom&&!exCust))?1:0.4}}
                onClick={addSet}>Registrar Serie</button>
            </div>

            <div style={st.card}>
              <SH title="Carga rápida por IA" icon={<Icons.Activity size={18} color={T.text}/>}/>
              <span style={st.lbl}>Pega texto directamente desde tu IA</span>
              <textarea
                style={{ ...st.inp, minHeight:160, resize:"vertical", marginBottom:12, lineHeight:1.6 }}
                placeholder="Pega el output directamente:&#10;**1. Press Banca** 4x10 @ 60kg RPE 8&#10;- Sentadilla 4 x 10 con 100kg&#10;Curl Bicep 3x12"
                value={quickLoad}
                onChange={e=>setQuickLoad(e.target.value)}
              />
              <button style={st.btn} onClick={parseAndLoad}>Analizar e Inyectar</button>
              <div style={{ fontSize:12, color:T.muted, marginTop:12, lineHeight:1.5, fontFamily:T.font }}>
                El sistema detectará automáticamente Ejercicio, SetsxReps, Peso y RPE.
              </div>
            </div>
          </div>
        </div>
      )}

      {strView==="history" && (
        <div style={st.card}>
          <SH title="Historial de fuerza" right={<span style={{fontSize:12,color:T.muted,fontFamily:T.font}}>{strLog.length} series registradas</span>}/>
          {strLog.length===0 ? (
            <div style={{color:T.muted,fontSize:13,textAlign:"center",padding:30,fontFamily:T.font}}>Aún sin registrar</div>
          ) : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.muted, fontWeight:600, fontFamily:T.font }}>
              {["Ejercicio","KG","Reps","Set","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:420, overflowY:"auto" }}>
              {[...strLog].reverse().map(l=>editId===l.id?(
                <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <EditRow fields={[{k:"exercise",l:"Ex"},{k:"weight",l:"Kg",t:"number"},{k:"reps",l:"Reps",t:"number"},{k:"sets",l:"Sets",t:"number"},{k:"rpe",l:"RPE",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ):(
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"12px 0", borderBottom:`1px solid ${T.border}`, fontSize:13, alignItems:"center", background:l.date===activeDate?T.sel:"transparent", fontFamily:T.font, ...st.num }}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600,color:l.date===activeDate?T.text:T.text}}>{l.exercise}</span>
                  <span style={{color:T.text,fontWeight:600}}>{l.weight||"—"}</span>
                  <span>{l.reps||"—"}</span><span>{l.sets||"—"}</span>
                  <span style={{color:T.text,fontWeight:600}}>{l.rpe||"—"}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.icon()} onClick={()=>{setEId(l.id);setER({exercise:l.exercise,weight:l.weight,reps:l.reps,sets:l.sets,rpe:l.rpe});}}>
                      <EditIcon color={T.text} />
                    </button>
                    <button style={st.icon()} onClick={()=>setStr(p=>p.filter(x=>x.id!==l.id))}>
                      <DeleteIcon color={T.bad} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: RUNNING
// ─────────────────────────────────────────────────────────────────────────────
function Running({ runs, setRuns, runGoal, setRunGoal, targetTime, setTargetTime, shoes, setShoes, activeDate, theme, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:activeDate,km:"",time:"",lpm:"",ppm:"",shoe:"" });
  const [editId,setEId]=useState(null), [editRow,setER]=useState({});
  
  const requiredPace = calcPace(runGoal, targetTime);
  const reqSecs = paceToSecs(requiredPace);
  
  useEffect(() => { setForm(p => ({ ...p, date: activeDate })); }, [activeDate]);

  const tip=p=><ChartTip {...p} T={T}/>;
  
  const validPaces = runs.map(r => paceToSecs(r.pace)).filter(s => s > 0);
  const bestPaceSecs = validPaces.length ? Math.min(...validPaces) : 0;
  const avgPaceSecs = validPaces.length ? validPaces.reduce((a,b)=>a+b,0) / validPaces.length : 0;
  
  const handleShoeChange = (e) => {
    const val = e.target.value;
    if (val === "__new__") {
      const newS = window.prompt("Nombre de los nuevos tenis:");
      if (newS && newS.trim()) {
        setShoes(p => [...p, newS.trim()]);
        setForm(p => ({ ...p, shoe: newS.trim() }));
      }
    } else {
      setForm(p => ({ ...p, shoe: val }));
    }
  };

  const add=()=>{ if(!form.km||!form.time) return;
    setRuns(p=>[...p,{...form,km:+form.km,pace:calcPace(+form.km,form.time),id:uid()}]);
    setForm({date:activeDate,km:"",time:"",lpm:"",ppm:"",shoe:""}); 
  };
  
  const saveEd=()=>{ setRuns(p=>p.map(r=>r.id===editId?{...r,...editRow,km:+editRow.km,pace:calcPace(+editRow.km,editRow.time)}:r)); setEId(null); };
  
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      
      <div style={{...st.card2, background: T.sel, border:`1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center"}}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Meta: {runGoal} KM</div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily:T.font }}>Evaluando ritmo actual vs requerido para {targetTime}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text, display: "block", marginBottom: 4, fontFamily:T.font }}>Tiempo Meta (HH:MM:SS)</span>
            <input style={{...st.inp, width: 120, padding: "6px 10px"}} type="text" value={targetTime} onChange={e=>setTargetTime(e.target.value)} />
          </div>
          <div style={{ background: T.card, border:`1px solid ${T.border}`, padding: "6px 14px", borderRadius: 6, textAlign: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "block", fontFamily:T.font }}>Ritmo req.</span>
            <span style={{ fontSize: 20, fontWeight: 600, color: T.text, fontFamily:T.font, ...st.num }}>{requiredPace}</span>
          </div>
        </div>
      </div>

      <div style={st.g2}>
        <div style={{ ...st.card, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <SH title="Ritmo actual" icon={<Icons.Activity size={18} color={T.text}/>}
            right={
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={st.lbl}>Distancia:</span>
                <input style={{ ...st.inp, width:80, padding:"6px 10px", fontSize:14 }} type="number" step="0.1"
                  value={runGoal} onChange={e=>setRunGoal(+e.target.value||21.1)}/>
              </div>
            }/>
          <PaceRing currentPaceSecs={avgPaceSecs} targetPaceSecs={reqSecs} theme={theme} T={T}/>
          
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", marginTop: 12 }}>
            {[{l:"REQUERIDO",v:requiredPace},{l:"PROMEDIO",v:avgPaceSecs?secsToPace(avgPaceSecs):"—"},{l:"MEJOR",v:bestPaceSecs?secsToPace(bestPaceSecs):"—"}].map(m=>(
              <div key={m.l} style={{ textAlign:"center", background:T.card2, border:`1px solid ${T.border}`, padding:"8px 16px", borderRadius:6 }}>
                <div style={{fontSize:11,color:T.muted,fontWeight:600,fontFamily:T.font}}>{m.l}</div>
                <div style={{fontSize:20,fontWeight:600,color:T.text,fontFamily:T.font, ...st.num}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={st.card}>
          <SH title="Registrar carrera" icon={<Icons.Plus size={18} color={T.text}/>}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[["Fecha","date","date"],["Distancia (KM)","km","number"],["Tiempo (HH:MM:SS)","time","text"],["HR Promedio","lpm","number"],["Cadencia","ppm","number"]].map(([l,k,t])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type={t} placeholder="" step={k==="km"?"0.1":undefined} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div>
              <span style={st.lbl}>Tenis</span>
              <select style={st.sel} value={form.shoe} onChange={handleShoeChange}>
                <option value="" disabled>-- Seleccionar --</option>
                {shoes.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__new__">+ Agregar nuevos</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2", marginTop: 8, background:T.card2, border:`1px solid ${T.border}`, padding:"12px", borderRadius:6 }}>
              <span style={st.lbl}>Ritmo calculado</span>
              <div style={{ fontSize:24, fontWeight:600, color:T.text, fontFamily:T.font, ...st.num }}>{calcPace(+form.km,form.time)}</div>
            </div>
          </div>
          <button style={st.btn} onClick={add}>Guardar Carrera</button>
        </div>
      </div>

      <div style={st.card}>
        <SH title="Evolución de distancia" right={<span style={{fontSize:12,color:T.muted,fontFamily:T.font}}>{runs.length} Registros</span>}/>
        {runs.length<2?<Placeholder msg="Datos insuficientes" T={T}/>:(
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={runs} margin={{top:10,right:10,bottom:0,left:-22}}>
              <CartesianGrid strokeDasharray="2 2" stroke="var(--track)" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:T.muted,fontSize:11,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fill:T.muted,fontSize:11,fontFamily:T.font}}/>
              <Tooltip content={tip}/>
              <Line type="linear" dataKey="km" stroke={T.text} strokeWidth={2} dot={{fill:T.card,stroke:T.text,strokeWidth:2,r:4}} activeDot={{r:6,fill:T.text}} name="KM"/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={st.card}>
        <SH title="Historial de carreras" />
        {runs.length===0?<Placeholder msg="Aún sin registrar" T={T}/>:(
          <div style={{ maxHeight:250, overflowY:"auto", paddingRight:10 }}>
            {[...runs].reverse().map(r=>editId===r.id?(
              <div key={r.id} style={{marginBottom:8}}>
                <EditRow fields={[{k:"date",l:"Date",t:"date"},{k:"km",l:"KM",t:"number",step:"0.1"},{k:"time",l:"Time"},{k:"shoe",l:"Shoe"},{k:"lpm",l:"HR",t:"number"},{k:"ppm",l:"Cad",t:"number"}]}
                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
              </div>
            ):(
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", borderBottom:`1px solid ${T.border}`, fontSize:13, alignItems:"center", background:r.date===activeDate?T.sel:"transparent", fontFamily:T.font, ...st.num }}>
                <span style={{color:T.text,minWidth:45}}>{r.date.slice(5)}</span>
                <span style={{color:T.text,fontWeight:600,fontSize:14}}>{r.km} KM</span>
                <span style={{color:T.muted}}>{r.time}</span>
                <span style={{color:T.text,fontWeight:600}}>{r.pace}</span>
                <span style={{color:T.text}}>{r.shoe ||"—"}</span>
                <span style={{color:T.muted}}>{r.lpm?`${r.lpm} HR`:"—"}</span>
                <span style={{color:T.muted}}>{r.ppm?`${r.ppm} CAD`:"—"}</span>
                <div style={{display:"flex",gap:4}}>
                  <button style={st.icon()} onClick={()=>{setEId(r.id);setER({date:r.date,km:r.km,time:r.time,shoe:r.shoe||"",lpm:r.lpm||"",ppm:r.ppm||""});}}>
                    <EditIcon color={T.text} />
                  </button>
                  <button style={st.icon()} onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>
                    <DeleteIcon color={T.bad} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(LS + "theme");
    if (savedTheme) return JSON.parse(savedTheme);
    return "dark";
  });
  
  const [activeDate, setActiveDate] = useState(TODAY);

  const [tab,        setTab]  =useState("dashboard");
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
  
  const [runGoal,    setRunGoal]   =useState(()=>lsGet("runGoal",21.1));
  const [targetTime, setTargetTime] =useState(()=>lsGet("targetTime", "02:00:00"));

  useEffect(()=>{lsSet("theme",theme);},[theme]);
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
  useEffect(()=>{lsSet("runGoal",runGoal);},[runGoal]);
  useEffect(()=>{lsSet("targetTime",targetTime);},[targetTime]);

  const importRef=useRef(null);
  const handleImport=useCallback(e=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=evt=>{
      try {
        const d=JSON.parse(evt.target.result);
        if(Array.isArray(d.healthLog))   setHL(d.healthLog);
        if(Array.isArray(d.foodLog))     setFL(d.foodLog);
        if(Array.isArray(d.nutritionDB)) setDb(d.nutritionDB);
        if(Array.isArray(d.strengthLog)) setStr(d.strengthLog);
        if(Array.isArray(d.runs))        setRuns(d.runs);
        if(Array.isArray(d.biometrics))  setBios(d.biometrics);
        if(Array.isArray(d.shoes))       setShoes(d.shoes);
        if(d.goals&&typeof d.goals==="object")        setGoals(d.goals);
        if(typeof d.program==="string")               setProg(d.program);
        if(d.weeklyPlans&&typeof d.weeklyPlans==="object") setPlans(d.weeklyPlans);
        if(typeof d.runGoal==="number")               setRunGoal(d.runGoal);
        if(typeof d.targetTime==="string")            setTargetTime(d.targetTime);
        alert("✅ Importación exitosa");
      } catch(err){alert("❌ JSON inválido: "+err.message);}
    };
    reader.readAsText(file); e.target.value="";
  },[]);

  const exportJSON=useCallback(()=>{
    const data={healthLog,foodLog,nutritionDB:db,strengthLog:strLog,runs,biometrics:bios,shoes,goals,program,weeklyPlans:plans,runGoal,targetTime,exportedAt:new Date().toISOString()};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download=`aristeia_v8_${TODAY}.json`; a.click();
  },[healthLog,foodLog,db,strLog,runs,bios,shoes,goals,program,plans,runGoal,targetTime]);

  const getDayData=useCallback((date)=>{
    const h=healthLog.find(d=>d.date===date)||{};
    const fs=foodLog.filter(f=>f.date===date), hasF=fs.length>0;
    const calIn=hasF?fs.reduce((s,f)=>s+f.cal,0):(h.calIn||0);
    const p=hasF?r1(fs.reduce((s,f)=>s+f.p,0)):(h.p||0);
    const c=hasF?r1(fs.reduce((s,f)=>s+f.c,0)):(h.c||0);
    const g=hasF?r1(fs.reduce((s,f)=>s+f.g,0)):(h.g||0);
    return{date,calOut:h.calOut||0,calIn,p,c,g,sleep:h.sleep||null,score:h.score||null,hrv:h.hrv||null,rhr:h.rhr||null,recovery:h.recovery||null,bodyBattery:h.bodyBattery||null,steps:h.steps||null,balance: (calIn > 0 && h.calOut > 0) ? calIn - h.calOut : null,goals:h.goals||{...DEFAULT_GOALS}, focus:h.focus||[]};
  },[healthLog,foodLog]);

  const allDates = useMemo(() => {
    const s = new Set([...healthLog.map(h=>h.date), ...foodLog.map(f=>f.date), TODAY, activeDate]);
    return [...s].sort().reverse();
  }, [healthLog, foodLog, activeDate]);

  const activeDayData = useMemo(()=>getDayData(activeDate),[getDayData, activeDate]);
  
  const weekData = useMemo(()=>allDates.filter(d => d <= activeDate).slice(0,14).map(d=>getDayData(d)), [allDates, activeDate, getDayData]);
  const last7    = useMemo(()=>weekData.slice(0,7).reverse(), [weekData]);
  const activeFood = useMemo(()=>foodLog.filter(f=>f.date===activeDate), [foodLog, activeDate]);
  const allDayData = useMemo(()=>allDates.map(d=>getDayData(d)), [allDates, getDayData]);

  const TABS=[
    {id:"dashboard",l:"Dashboard"},
    {id:"daily",l:"Datos diarios"},     
    {id:"recap",l:"Resumen"},
    {id:"calendario",l:"Calendario"},
    {id:"nutricion",l:"Alimentación"},
    {id:"fuerza",l:"Fuerza"},
    {id:"running",l:"Cardio"},
    {id:"bio",l:"Biometría"},           
    {id:"sleep",l:"Recuperación"},
  ];

  const currentHour=new Date().getHours();
  const greeting=currentHour<12?"Buenos días":currentHour<18?"Buenas tardes":"Buenas noches";
  const rawDate = new Date(activeDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className={`theme-${theme}`}>
      <GlobalStyles />
      <div style={{ padding:"16px 20px", minHeight: "100vh" }}>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>

        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:14, position:"relative", zIndex:1 }}>
          <div>
            <div style={{ fontSize:24, fontWeight:600, lineHeight:1.1, color:T.text }}>
              {greeting}, Rafa
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ 
                position: "relative", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", 
                background: T.card, padding: "8px 14px", borderRadius: 6, border: `1px solid ${T.border}`,
                transition: "all 0.15s"
              }}>
                <span style={{ fontSize:14, color:T.text, fontWeight:600, textTransform: "capitalize" }}>{rawDate}</span>
                <span style={{ fontSize:10, color:T.muted }}>▼</span>
                <input 
                  type="date" 
                  value={activeDate} 
                  max={TODAY} 
                  onChange={(e) => setActiveDate(e.target.value)} 
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
              </div>

              {activeDate !== TODAY && (
                <button onClick={() => setActiveDate(TODAY)} style={{ background: T.text, color: T.bg, border: `none`, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily:T.font }}>
                  Ir a Hoy
                </button>
              )}
            </div>
          </div>
          
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            
            {activeDayData.calIn > 0 ? (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ background:T.card, borderRadius:6, padding:"8px 14px", fontSize:14, color:T.text, border:`1px solid ${T.border}`, fontWeight:600, fontVariantNumeric:"tabular-nums" }}>
                  {activeDayData.calIn.toLocaleString('es-ES')} kcal consumidas
                </div>
                {activeDayData.calOut > 0 && (
                  <div style={{ background:T.card, borderRadius:6, padding:"8px 14px", fontSize:14, color: T.text, border:`1px solid ${T.border}`, fontWeight:600, fontVariantNumeric:"tabular-nums" }}>
                    Balance: {activeDayData.balance > 0 ? "+" : ""}{activeDayData.balance.toLocaleString('es-ES')} kcal
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>Aún sin registrar calorías</span>
                <button onClick={() => setTab("nutricion")} style={{ display: "flex", alignItems: "center", gap: 6, background: T.btn, color: T.btnt, border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <Icons.Food color={T.btnt} size={16} /> Registrar comida
                </button>
              </div>
            )}

            <button 
              onClick={toggleTheme} 
              style={{ 
                background: T.card2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 20, 
                padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", 
                fontFamily: T.font, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
              }}>
              {theme === "dark" ? <><Icons.Sun color={T.text} size={14}/> Modo claro</> : <><Icons.Moon color={T.text} size={14}/> Modo oscuro</>}
            </button>

            <button onClick={()=>importRef.current?.click()} style={{ background:T.card, color:T.text, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 12px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:T.font }}>Imp</button>
            <button onClick={exportJSON} style={{ background:T.card, color:T.text, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 12px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:T.font }}>Exp</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap", position:"relative", zIndex:1 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:tab===t.id?T.sel:"transparent",
              color:tab===t.id?T.text:T.muted,
              border:`1px solid ${tab===t.id?T.border:"transparent"}`,
              borderRadius:6, padding:"8px 16px", fontWeight:600, fontSize:13,
              cursor:"pointer", transition:"all 0.2s", fontFamily:T.font
            }}>{t.l}</button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ position:"relative", zIndex:1 }}>
          {tab==="dashboard"  && <Dashboard activeDayData={activeDayData} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setPlans={setPlans} setTab={setTab} activeDate={activeDate} theme={theme} T={T}/>}
          {tab==="daily"      && <DailyData setBios={setBios} setHL={setHL} goals={goals} setGoals={setGoals} activeDate={activeDate} T={T}/>}
          {tab==="recap"      && <Recap allDayData={allDayData} bios={bios} setHL={setHL} setBios={setBios} T={T}/>}
          {tab==="calendario" && <Calendario allDayData={allDayData} bios={bios} activeDate={activeDate} setActiveDate={setActiveDate} theme={theme} T={T}/>}
          {tab==="nutricion"  && <Nutricion activeDayData={activeDayData} activeFood={activeFood} activeDate={activeDate} setFL={setFL} db={db} setDb={setDb} goals={goals} T={T}/>}
          {tab==="fuerza"     && <Fuerza   strLog={strLog} setStr={setStr} program={program} setProg={setProg} plans={plans} setPlans={setPlans} activeDate={activeDate} T={T}/>}
          {tab==="running"    && <Running  runs={runs} setRuns={setRuns} runGoal={runGoal} setRunGoal={setRunGoal} targetTime={targetTime} setTargetTime={setTargetTime} shoes={shoes} setShoes={setShoes} activeDate={activeDate} theme={theme} T={T}/>}
          {tab==="bio"        && <Biometria bios={bios} setBios={setBios} activeDate={activeDate} T={T}/>}
          {tab==="sleep"      && <Sueno    healthLog={healthLog} T={T}/>}
        </div>
      </div>
    </div>
  );
}