import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — BENTO BOX · BOLD MINIMALIST · ORANGE FIRE
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080808", card:"#101010", card2:"#181818", card3:"#222222",
  accent:"#FF4D1A", accentDim:"rgba(255,77,26,0.13)",
  navy:"#181818", navyBright:"#222222",
  text:"#EFEFEF", muted:"#525252", border:"#242424", inputBg:"#0C0C0C",
  green:"#4ADE80", red:"#F87171", blue:"#60A5FA",
  purple:"#C084FC", orange:"#FB923C", teal:"#34D399", pink:"#F472B6",
  shadow:"0 0 0 1px #242424, 0 20px 60px rgba(0,0,0,0.7)",
  pickerBg:"#080808",
};
const LIGHT = {
  bg:"#DEDEDE", card:"#FFFFFF", card2:"#F3F3F3", card3:"#E8E8E8",
  accent:"#FF4D1A", accentDim:"rgba(255,77,26,0.09)",
  navy:"#0C0C0C", navyBright:"#181818",
  text:"#0A0A0A", muted:"#909090", border:"#DCDCDC", inputBg:"#FAFAFA",
  green:"#16A34A", red:"#DC2626", blue:"#2563EB",
  purple:"#9333EA", orange:"#EA580C", teal:"#0D9488", pink:"#DB2777",
  shadow:"0 2px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
  pickerBg:"#0A0A0A",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",       Vie:"Upper Compuesto",       Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  Fuerza:     { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",           Vie:"OHP + Accesorios",      Sáb:"Cardio LISS",      Dom:"🔋 Descanso" },
  Definición: { Lun:"Full Body A",     Mar:"HIIT 30min",        Mié:"Full Body B",       Jue:"LISS 45min",            Vie:"Full Body C + Cardio",  Sáb:"HIIT 30min",       Dom:"🔋 Descanso" },
  Power:      { Lun:"Potencia Sup.",   Mar:"Potencia Inf.",     Mié:"🔋 Descanso",       Jue:"Olímpicos + Fuerza",  Vie:"Pliometría + Velocidad", Sáb:"LISS",             Dom:"🔋 Descanso" },
};
const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL_ES = { Lun:"LUNES", Mar:"MARTES", Mié:"MIÉRCOLES", Jue:"JUEVES", Vie:"VIERNES", Sáb:"SÁBADO", Dom:"DOMINGO" };
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
const TODAY         = new Date().toISOString().split("T")[0];
// Metas personalizadas de Rafa
const DEFAULT_GOALS = { cal:2400, p:180, c:280, g:60 };
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
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const LS = "aristeia_v7_";
function lsGet(key, fallback) {
  try { const r=localStorage.getItem(LS+key); return r===null?fallback:JSON.parse(r); }
  catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(LS+key, JSON.stringify(val)); } catch {} }
function lsClear() {
  try { Object.keys(localStorage).filter(k=>k.startsWith(LS)).forEach(k=>localStorage.removeItem(k)); }
  catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const uid      = () => Date.now() + Math.random();
const r1       = n => Math.round(n*10)/10;
const fmt      = (n,d=1) => (n==null||isNaN(n))?"—":Number(n).toFixed(d);
const clamp1   = (v,g) => Math.min(v/g, 1);
const calcPace = (km,t) => {
  if (!km||!t) return "--:--";
  const p=t.split(":").map(Number);
  const s=p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+(p[1]||0);
  if (!s) return "--:--";
  const ps=s/km;
  return `${Math.floor(ps/60)}:${Math.round(ps%60).toString().padStart(2,"0")}/km`;
};
const calcIMC = (kg,cm) => cm ? r1(kg/((cm/100)**2)) : null;

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
function getCurrentWeekDates() {
  const today=new Date();
  const dow=today.getDay();
  const diffToMon=dow===0?-6:1-dow;
  const mon=new Date(today);
  mon.setDate(today.getDate()+diffToMon);
  mon.setHours(0,0,0,0);
  return PLAN_KEYS.map((_,i)=>{
    const d=new Date(mon);
    d.setDate(mon.getDate()+i);
    return d.toISOString().split("T")[0];
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE FACTORY
// ─────────────────────────────────────────────────────────────────────────────
const SVG_ARROW=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
function mkS(T) {
  return {
    card:  { background:T.card, borderRadius:26, padding:22, color:T.text, boxShadow:T.shadow, fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", position:"relative" },
    card2: { background:T.card2, borderRadius:18, padding:14, color:T.text },
    lbl:   { fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:5, display:"block", fontWeight:800 },
    inp:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:16, padding:"10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", transition:"border-color 0.15s" },
    sel:   { background:T.inputBg, border:`1.5px solid ${T.border}`, borderRadius:16, padding:"10px 34px 10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"system-ui", appearance:"none", WebkitAppearance:"none", backgroundImage:SVG_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:   { background:T.accent, color:"#fff", border:"none", borderRadius:999, padding:"12px 22px", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"system-ui", width:"100%", letterSpacing:"0.02em" },
    btnSm: { background:T.navy, color:"#fff", border:"none", borderRadius:999, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap" },
    ghost: a=>({ background:a?T.navy:"transparent", color:a?"#fff":T.muted, border:`1.5px solid ${a?T.navy:T.border}`, borderRadius:999, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"system-ui", whiteSpace:"nowrap", transition:"all 0.15s" }),
    icon:  c=>({ background:"none", border:"none", cursor:"pointer", color:c||T.muted, padding:"3px 6px", borderRadius:6, fontSize:13, lineHeight:1, display:"inline-flex", alignItems:"center" }),
    g2:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES GLOBALES Y ATÓMICOS
// ─────────────────────────────────────────────────────────────────────────────

// Reloj dinámico de fondo
function DayProgressArc({ T }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setPct((d.getHours() * 60 + d.getMinutes()) / 1440);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  const size = 320, sw = 16, r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - pct);
  return (
    <div style={{ position:"absolute", top:-120, right:-50, zIndex:0, opacity:0.1, pointerEvents:"none" }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.text} strokeWidth={sw} strokeDasharray="4 12" strokeLinecap="round"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.accent} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={off} style={{transition: "stroke-dashoffset 1s ease"}}/>
      </svg>
    </div>
  );
}

// UI de Numeros (Pill oscuro + border naranja)
function NumberPicker({ value, onChange, options, label, T }) {
  const selRef = useRef(null);
  useEffect(() => {
    if (selRef.current) selRef.current.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [value]);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
      <span style={{ fontSize:9, color:T.muted, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>{label}</span>
      <div style={{
        background:T.pickerBg, borderRadius:999, padding:"8px 5px",
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
                border: isSel ? `2px solid ${T.accent}` : "2px solid transparent",
                borderRadius:999, background:"transparent",
                color: isSel ? T.accent : "#4A4A4A",
                fontWeight: isSel ? 900 : 400, fontSize:17,
                cursor:"pointer", fontFamily:"system-ui", textAlign:"center",
                transition:"all 0.12s",
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyStrView({ strLog, plans, program, T }) {
  const st = mkS(T);
  const [expanded, setExpanded] = useState(() => new Set([TODAY_DOW]));
  const [checked, setChecked] = useState({});
  const weekDates = getCurrentWeekDates();

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
        const isToday = dayKey === TODAY_DOW;
        const isOpen = expanded.has(dayKey);
        const isRest = planned?.includes("Descanso");
        const fmtDate = new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", { month:"short", day:"numeric" });

        return (
          <div key={dayKey} style={{ borderBottom:`1px solid ${T.border}` }}>
            <button onClick={() => toggle(dayKey)} style={{
              width:"100%", background:isToday ? T.accentDim : "transparent",
              border:"none", cursor:"pointer", padding:"18px 24px",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              textAlign:"left", fontFamily:"system-ui", transition:"background 0.15s"
            }}>
              <div>
                <div style={{
                  fontSize:38, fontWeight:900, letterSpacing:"-1.5px", lineHeight:1,
                  color: isToday ? T.accent : isRest ? T.muted : T.text,
                }}>
                  {DAY_FULL_ES[dayKey]}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginTop:3, display:"flex", gap:10, alignItems:"center" }}>
                  <span>{fmtDate}</span>
                  {isToday && <span style={{ background:T.accent, color:"#fff", borderRadius:999, padding:"1px 9px", fontSize:9, fontWeight:800 }}>HOY</span>}
                  {planned && <span style={{ color:isRest?T.muted:T.muted }}>{planned}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {dayExs.length > 0 && (
                  <span style={{ background:isToday?T.accent:T.card3, color:isToday?"#fff":T.muted, borderRadius:999, padding:"3px 11px", fontSize:12, fontWeight:800 }}>
                    {dayExs.filter(e => checked[e.id]).length}/{dayExs.length}
                  </span>
                )}
                <span style={{ color:T.muted, fontSize:16, fontWeight:700 }}>{isOpen ? "−" : "+"}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding:"0 24px 20px", borderTop:`1px solid ${T.border}` }}>
                {planned && !isRest && (
                  <div style={{ margin:"14px 0 10px", background:T.accentDim, border:`1px solid ${T.accent}30`, borderRadius:12, padding:"8px 14px", fontSize:12, color:T.accent, fontWeight:700, display:"inline-flex", gap:6 }}>
                    📋 {planned}
                  </div>
                )}
                {dayExs.length === 0 ? (
                  <div style={{ color:T.muted, fontSize:13, padding:"14px 0", fontStyle:"italic", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ opacity:0.4 }}>□</span>
                    {isRest ? "Día de descanso — recupérate bien 🔋" : "Sin ejercicios registrados para este día"}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:10 }}>
                    {dayExs.map(ex => {
                      const done = checked[ex.id];
                      return (
                        <div key={ex.id} onClick={() => toggleCheck(ex.id)} style={{
                          display:"flex", alignItems:"center", gap:14, padding:"11px 16px", borderRadius:16, cursor:"pointer",
                          background: done ? T.accentDim : T.card2, border:`1.5px solid ${done ? T.accent+"40" : "transparent"}`, transition:"all 0.18s"
                        }}>
                          <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, border:`2px solid ${done ? T.accent : T.border}`, background: done ? T.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s" }}>
                            {done && <span style={{ color:"#fff", fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:700, color: done ? T.muted : T.text, textDecoration: done ? "line-through" : "none", letterSpacing:"-0.2px" }}>
                              {ex.exercise}
                            </div>
                            <div style={{ fontSize:11, color:T.muted, marginTop:2, display:"flex", gap:8 }}>
                              {ex.sets && ex.reps && <span style={{ background:T.card3, borderRadius:999, padding:"1px 8px" }}>{ex.sets}×{ex.reps}</span>}
                              {ex.weight > 0 && <span style={{ color:T.accent, fontWeight:700 }}>{ex.weight}kg</span>}
                              {ex.rpe > 0 && <span>RPE {ex.rpe}</span>}
                            </div>
                          </div>
                          {done && <span style={{ fontSize:18 }}>✅</span>}
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
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"8px 12px", boxShadow:T.shadow, fontSize:12 }}>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: <b>{fmt(p.value)}</b></div>)}
    </div>
  );
}
function SH({ title, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:14, fontWeight:800, letterSpacing:"-0.3px" }}>{title}</div>
      {right}
    </div>
  );
}
function ProgBar({ value, max, color, h=4 }) {
  return (
    <div style={{ height:h, borderRadius:h, overflow:"hidden", background:"rgba(128,128,128,0.13)", marginTop:5 }}>
      <div style={{ height:"100%", width:`${Math.min((value/max)*100,100)}%`, background:color, borderRadius:h, transition:"width 0.45s ease" }}/>
    </div>
  );
}
function MiniRing({ pct, color, size=42, sw=5 }) {
  const r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-Math.min(pct,1));
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(128,128,128,0.14)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={off}
        style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}
function RunRing({ value, max, isDark, T }) {
  const size=230, sw=26, r=(size-sw)/2, circ=2*Math.PI*r;
  const pct=Math.min(value/max,1), off=circ*(1-pct);
  const done=pct>=1;
  const gradA=done?T.green:T.accent, gradB=done?T.teal:T.orange;
  const trackClr=isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)";
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ display:"block" }}>
        <defs>
          <linearGradient id="rring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradA}/><stop offset="100%" stopColor={gradB}/>
          </linearGradient>
          <filter id="rGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackClr} strokeWidth={sw}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        {pct>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rring)"
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          filter="url(#rGlow)"
          style={{ transition:"stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
        <div style={{ fontSize:9, color:T.muted, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase" }}>DISTANCIA</div>
        <div style={{ fontSize:52, fontWeight:900, color:done?T.green:gradA, lineHeight:1 }}>{value.toFixed(1)}</div>
        <div style={{ fontSize:12, color:T.muted }}>/ {max} km meta</div>
        <div style={{ fontSize:12, fontWeight:700, color:done?T.green:T.muted, marginTop:2 }}>
          {Math.round(pct*100)}%{done?" 🎉 META LOGRADA":""}
        </div>
      </div>
    </div>
  );
}
function RunMilestones({ value, max, T }) {
  const milestones=[{km:5,l:"5K"},{km:10,l:"10K"},{km:15,l:"15K"},{km:max,l:"🏁"}];
  const pct=Math.min(value/max,1);
  return (
    <div style={{ width:"100%", maxWidth:420, padding:"0 8px" }}>
      <div style={{ position:"relative", height:8, background:T.card2, borderRadius:999, marginBottom:30, marginTop:8 }}>
        <div style={{ position:"absolute", inset:0, width:`${pct*100}%`, borderRadius:999, transition:"width 0.8s ease",
          background:`linear-gradient(to right, ${T.accent}, ${T.orange}, ${T.green})` }}/>
        {milestones.map(m=>{
          const mp=Math.min(m.km/max,1)*100, reached=value>=m.km;
          return (
            <div key={m.km} style={{ position:"absolute", left:`${mp}%`, top:"50%", transform:"translate(-50%,-50%)", zIndex:2 }}>
              <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${reached?T.green:T.border}`,
                background:reached?T.green:T.card3, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s" }}>
                {reached&&<div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
              </div>
              <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)", fontSize:9,
                color:reached?T.green:T.muted, whiteSpace:"nowrap", fontWeight:reached?700:400 }}>{m.l}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function EditRow({ fields, vals, onChange, onSave, onCancel, T }) {
  const st=mkS(T);
  return (
    <div style={{ ...st.card2, border:`1.5px solid ${T.accent}40`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
        {fields.map(f=>(
          <div key={f.k}><span style={st.lbl}>{f.l}</span>
            <input style={st.inp} type={f.t||"text"} step={f.step} value={vals[f.k]??""} onChange={e=>onChange(f.k,e.target.value)}/></div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.green, flex:1 }} onClick={onSave}>✓ Guardar</button>
        <button style={{ ...st.btnSm, background:T.card3, color:T.text, flex:1 }} onClick={onCancel}>Cancelar</button>
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
    <div style={{ ...st.card2, border:`1.5px solid ${T.accent}40`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:12, fontWeight:600 }}>{entry.name}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
          <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
        <div style={{ fontSize:12, color:T.muted, paddingTop:16 }}>× {entry.unit}</div>
      </div>
      {preview&&<div style={{ fontSize:11, color:T.muted }}>= {preview.cal} kcal · {preview.p}P · {preview.c}C · {preview.g}G</div>}
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.green, flex:1 }} onClick={doSave}>✓ Guardar</button>
        <button style={{ ...st.btnSm, background:T.card3, color:T.text, flex:1 }} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
  return <EditRow fields={[{k:"name",l:"Descripción"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
    vals={raw} onChange={(k,v)=>setRaw(p=>({...p,[k]:v}))} onSave={doSave} onCancel={onCancel} T={T}/>;
}

function KPICard({ icon, label, value, sub, color, pct, goalLabel, isDark, T }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${color}15 0%, ${T.card} 60%)`,
      borderRadius:22, padding:"16px 18px",
      boxShadow: isDark
        ? `0 0 0 1px ${T.border}, 0 8px 32px ${color}20`
        : `0 2px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)`,
      color:T.text, minHeight:116, display:"flex", flexDirection:"column", justifyContent:"space-between",
    }}>
      <div style={{ fontSize:9, color:T.muted, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>
        {icon}&nbsp;{label}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"8px 0" }}>
        <div>
          <div style={{ fontSize:32, fontWeight:900, color, lineHeight:1, letterSpacing:"-1px" }}>{value}</div>
          {sub&&<div style={{ fontSize:10, color:T.muted, marginTop:3 }}>{sub}</div>}
        </div>
        {pct!=null&&<MiniRing pct={pct} color={color} size={46} sw={5}/>}
      </div>
      {goalLabel&&pct!=null&&(
        <div>
          <ProgBar value={pct*100} max={100} color={color} h={3}/>
          <div style={{ fontSize:9, color:T.muted, marginTop:3 }}>{goalLabel}</div>
        </div>
      )}
    </div>
  );
}
function Placeholder({ msg, T }) {
  return <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:12 }}>{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ today, weekData, last7, goals, program, plans, setPlans, setTab, isDark, T }) {
  const st=mkS(T);
  const [editDay, setEditDay] = useState(null);
  const tip=p=><ChartTip {...p} T={T}/>;
  const pCol=(v,g)=>v>=g?T.green:v>=g*.8?T.accent:T.red;
  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const sCol=s=>s>=7?T.green:s>=6?T.accent:T.red;
  const scCol=s=>s>=85?T.green:s>=70?T.accent:T.red;
  const cCol=(v,g)=>v>g?T.red:v>g*.85?T.accent:T.green;

  const kpis=[
    { icon:"🔥",label:"Cal In",  value:today.calIn||"—",  sub:`de ${goals.cal} kcal`,  color:T.accent, pct:today.calIn?clamp1(today.calIn,goals.cal):null, goalLabel:`${today.calIn||0} / ${goals.cal} kcal` },
    { icon:"💨",label:"Cal Out", value:today.calOut||"—", sub:"kcal quemadas",        color:T.blue,   pct:null },
    { icon:"⚖️",label:"Balance", value:today.calOut>0?(today.balance>0?`+${today.balance}`:today.balance):"—",
      sub:today.balance<0?"déficit ✓":"superávit", color:today.calOut>0?bCol(today.balance):T.muted, pct:null },
    { icon:"🥩",label:"Proteína",value:today.p?`${Math.round(today.p)}g`:"—", sub:`meta ${goals.p}g`, color:pCol(today.p,goals.p), pct:today.p?clamp1(today.p,goals.p):null, goalLabel:`${Math.round(today.p||0)}/${goals.p}g` },
    { icon:"🍞",label:"Carbos",  value:today.c?`${Math.round(today.c)}g`:"—", sub:`máx ${goals.c}g`,  color:cCol(today.c,goals.c), pct:today.c?clamp1(today.c,goals.c):null, goalLabel:`${Math.round(today.c||0)}/${goals.c}g` },
    { icon:"😴",label:"Sueño",   value:today.sleep?`${fmt(today.sleep,1)}h`:"—", sub:"horas",          color:sCol(today.sleep), pct:today.sleep?clamp1(today.sleep,8):null, goalLabel:"meta 8h" },
    { icon:"💤",label:"Score",   value:today.score?`${today.score}%`:"—", sub:"sleep score",          color:scCol(today.score), pct:today.score?clamp1(today.score,100):null, goalLabel:"meta 85%" },
    { icon:"👟",label:"Pasos",   value:today.steps?today.steps.toLocaleString():"—", sub:"pasos hoy",  color:T.purple, pct:today.steps?clamp1(today.steps,10000):null, goalLabel:"meta 10,000" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))", gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k} isDark={isDark} T={T}/>)}
      </div>

      <div style={{ ...st.card, overflowX:"auto" }}>
        <SH title="📅 Historial — 7 días"
          right={<span style={{ fontSize:9, color:T.muted }}>P:<span style={{color:T.green}}> ≥meta</span> · Bal:<span style={{color:T.green}}> déficit ✓</span></span>}/>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:660, fontFamily:"system-ui" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {[["Fecha","l"],["Out","r"],["In","r"],["Bal","r"],["P","r"],["C","r"],["G","r"],["😴","r"],["Score","r"],["Pasos","r"]].map(([h,a])=>(
                <th key={h} style={{ padding:"7px 8px", color:T.muted, fontWeight:800, textAlign:a==="r"?"right":"left", fontSize:9, letterSpacing:"0.07em" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekData.slice(0,7).map(d=>{
              const isT=d.date===TODAY, g=d.goals, bal=d.calIn-d.calOut, ho=d.calOut>0;
              return (
                <tr key={d.date} style={{ borderBottom:`1px solid ${T.border}`, background:isT?T.accentDim:"transparent" }}>
                  <td style={{ padding:"9px 8px", fontWeight:isT?800:400, color:isT?T.accent:T.text, whiteSpace:"nowrap" }}>{isT&&"● "}{d.date.slice(5)}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.blue }}>{ho?d.calOut.toLocaleString():"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.accent }}>{d.calIn?d.calIn.toLocaleString():"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:700, color:(ho&&d.calIn)?bCol(bal):T.muted }}>{(ho&&d.calIn)?(bal>0?`+${bal}`:bal):"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:600, color:d.p?pCol(d.p,g.p):T.muted }}>{d.p?`${Math.round(d.p)}g`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.c?cCol(d.c,g.c):T.muted }}>{d.c||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right" }}>{d.g||"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:d.sleep?sCol(d.sleep):T.muted }}>{d.sleep?`${fmt(d.sleep,2)}h`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", fontWeight:d.score?700:400, color:d.score?scCol(d.score):T.muted }}>{d.score?`${d.score}%`:"—"}</td>
                  <td style={{ padding:"9px 8px", textAlign:"right", color:T.purple }}>{d.steps?d.steps.toLocaleString():"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={st.g2}>
        <div style={st.card}>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:12 }}>📈 Proteína — 7 días</div>
          {last7.filter(d=>d.p>0).length>=2?(
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={last7} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.green} stopOpacity={0.35}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/>
                <Tooltip content={tip}/>
                <Area type="monotone" dataKey="p" stroke={T.green} fill="url(#pg)" strokeWidth={2.5} dot={{fill:T.green,r:4}} name="Proteína (g)"/>
              </AreaChart>
            </ResponsiveContainer>
          ):<Placeholder msg="Registra más días" T={T}/>}
        </div>
        <div style={st.card}>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:12 }}>⚖️ Balance Calórico</div>
          {last7.filter(d=>d.calOut>0).length>=2?(
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={last7.filter(d=>d.calOut>0)} margin={{top:4,right:4,bottom:0,left:-22}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/><Tooltip content={tip}/>
                <Bar dataKey="balance" name="Balance" radius={[6,6,0,0]}>
                  {last7.filter(d=>d.calOut>0).map((d,i)=><Cell key={i} fill={d.balance<0?T.green:d.balance<300?T.accent:T.red}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):<Placeholder msg="Registra Cal Out en Daily Log" T={T}/>}
        </div>
      </div>

      <div style={st.card}>
        <SH title={<>🗓️ Plan Semanal · <span style={{color:T.accent}}>{program}</span></>}
          right={<span style={{fontSize:11, color:T.muted}}>Click para editar</span>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day=>{
            const label=plans[program]?.[day]||"—", isT=day===TODAY_DOW, isR=label.includes("Descanso");
            return (
              <div key={day} onClick={() => setEditDay(day)} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:18, padding:"14px 10px", textAlign:"center", cursor:"pointer",
                boxShadow:isT?`0 0 0 1px ${T.accent}40,0 4px 20px ${T.accent}15`:"none" }}>
                <div style={{ fontSize:9, fontWeight:800, color:isT?T.accent:T.muted, letterSpacing:"0.1em", marginBottom:6 }}>{day.toUpperCase()}</div>
                {editDay === day ? (
                  <input autoFocus value={plans[program]?.[day] || ""}
                    onChange={e => setPlans(p => ({...p, [program]: {...p[program], [day]: e.target.value}}))}
                    onBlur={() => setEditDay(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditDay(null)}
                    style={{ background:"transparent", border:"none", outline:"none", fontSize:11, textAlign:"center", color:T.text, width:"100%", fontFamily:"system-ui", fontWeight:600 }} />
                ) : (
                  <div style={{ fontSize:11, fontWeight:700, color:isR?T.muted:T.text, lineHeight:1.4 }}>{label}</div>
                )}
                {isT&&<div style={{ marginTop:8, fontSize:9, background:T.accent, color:"#fff", borderRadius:999, padding:"2px 10px", display:"inline-block", fontWeight:800 }}>HOY</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DAILY LOG (Cards unificadas para Macros + Salud)
// ─────────────────────────────────────────────────────────────────────────────
function DailyLog({ allDayData, setHL, goals, setGoals, projects, setProjects, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  const [editG,setEG]=useState(false);
  const [editId,setEId]=useState(null);
  const [editRow,setER]=useState({});
  const [editProjKey,setEPK]=useState(null);
  const [projTemp,setProjTemp]=useState("");
  const [openMonths,setOM]=useState(()=>new Set([getMonthKey(TODAY)]));
  const [openWeeks,setOW]=useState(()=>new Set([getWeekStart(TODAY)]));

  const upsert=entry=>setHL(prev=>{
    const i=prev.findIndex(d=>d.date===entry.date);
    if(i>=0){const u=[...prev];u[i]={...u[i],...entry};return u;}
    return [...prev,entry];
  });
  const save=()=>{
    if(!form.date) return;
    upsert({ date:form.date, ...(form.calOut&&{calOut:+form.calOut}), ...(form.steps&&{steps:+form.steps}),
      ...(form.sleep&&{sleep:+form.sleep}), ...(form.score&&{score:+form.score}), goals:{...goals} });
    setForm({ date:TODAY, calOut:"", steps:"", sleep:"", score:"" });
  };

  const rows=allDayData.filter(d=>d.calOut>0||d.sleep||d.steps||d.calIn>0);
  const grouped=useMemo(()=>{
    const byMonth={};
    rows.forEach(d=>{
      const mk=getMonthKey(d.date), wk=getWeekStart(d.date);
      if(!byMonth[mk]) byMonth[mk]={};
      if(!byMonth[mk][wk]) byMonth[mk][wk]=[];
      byMonth[mk][wk].push(d);
    });
    return Object.entries(byMonth).sort(([a],[b])=>b.localeCompare(a)).map(([mk,weeks])=>({
      mk, weeks:Object.entries(weeks).sort(([a],[b])=>b.localeCompare(a)).map(([wk,days])=>({wk,days}))
    }));
  },[rows.length]);

  const toggleMonth=mk=>setOM(prev=>{const s=new Set(prev);s.has(mk)?s.delete(mk):s.add(mk);return s;});
  const toggleWeek=wk=>setOW(prev=>{const s=new Set(prev);s.has(wk)?s.delete(wk):s.add(wk);return s;});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ ...st.card, padding:"14px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
            {[["🔥","Cal",goals.cal,"kcal",T.accent],["🥩","P",goals.p,"g",T.green],["🍞","C",goals.c,"g",T.blue],["🧈","G",goals.g,"g",T.purple]].map(([ico,l,v,u,c])=>(
              editG?(
                <div key={l} style={{ display:"flex", flexDirection:"column", gap:2, minWidth:80 }}>
                  <span style={st.lbl}>{ico} {l}</span>
                  <input style={{ ...st.inp, padding:"5px 8px", fontSize:12 }} type="number" value={v}
                    onChange={e=>setGoals(p=>({...p,[l.toLowerCase().replace("cal","cal")]:+e.target.value}))}/>
                </div>
              ):(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.muted, fontWeight:800 }}>{ico} {l}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:c, letterSpacing:"-0.5px" }}>{v}<span style={{fontSize:10}}>{u}</span></div>
                </div>
              )
            ))}
          </div>
          <button style={st.btnSm} onClick={()=>setEG(o=>!o)}>{editG?"✓ Listo":"✏️ Objetivos"}</button>
        </div>
        {editG&&<div style={{ fontSize:10, color:T.muted, marginTop:8 }}>Los cambios de objetivos no alteran el historial pasado.</div>}
      </div>

      <div style={st.g2}>
        <div style={st.card}>
          <SH title="📋 Registrar Día"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Fecha</span>
              <input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            {[["Cal Quemadas","calOut"],["Pasos","steps"],["Horas de Sueño","sleep"],["Sleep Score %","score"]].map(([l,k])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" step={k==="sleep"?"0.01":"1"} placeholder=""
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
          </div>
          <button style={st.btn} onClick={save}>💾 Guardar Registro</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {grouped.length===0&&<div style={{ ...st.card2, color:T.muted, fontSize:12 }}>Sin registros aún.</div>}
          {grouped.map(({ mk, weeks })=>(
            <div key={mk} style={st.card}>
              <button onClick={()=>toggleMonth(mk)} style={{ background:"none", border:"none", cursor:"pointer", width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:0, color:T.text }}>
                <div style={{ fontSize:14, fontWeight:800, textTransform:"capitalize" }}>{fmtMonth(mk)}</div>
                <div style={{ fontSize:11, color:T.muted }}>{openMonths.has(mk)?"▲":"▼"} {weeks.reduce((s,w)=>s+w.days.length,0)} días</div>
              </button>
              {openMonths.has(mk)&&weeks.map(({ wk, days })=>{
                const projName=projects[wk];
                return (
                  <div key={wk} style={{ marginTop:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <button onClick={()=>toggleWeek(wk)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0, color:T.text }}>
                        <span style={{ fontSize:11, fontWeight:700, color:T.muted }}>{openWeeks.has(wk)?"▼":"▶"}</span>
                        <span style={{ fontSize:12, fontWeight:700 }}>{fmtWeek(wk)}</span>
                      </button>
                      {editProjKey===wk?(
                        <input autoFocus style={{ ...st.inp, width:160, padding:"5px 10px", fontSize:11 }}
                          value={projTemp}
                          onChange={e=>setProjTemp(e.target.value)}
                          onBlur={()=>{ setProjects(p=>({...p,[wk]:projTemp||undefined})); setEPK(null); }}
                          onKeyDown={e=>{ if(e.key==="Enter")e.target.blur(); if(e.key==="Escape")setEPK(null); }}
                          placeholder=""/>
                      ):(
                        <button onClick={()=>{ setEPK(wk); setProjTemp(projects[wk]||""); }}
                          style={{ background:projName?T.accentDim:"transparent", border:`1px dashed ${projName?T.accent:T.border}`,
                            borderRadius:999, padding:"3px 12px", fontSize:11, color:projName?T.accent:T.muted,
                            cursor:"pointer", fontWeight:projName?700:400, whiteSpace:"nowrap" }}>
                          {projName||"+ Proyecto"}
                        </button>
                      )}
                    </div>
                    {openWeeks.has(wk)&&(
                      <div style={{ display:"flex", flexDirection:"column", gap:8, paddingLeft:16 }}>
                        {days.map(d=>{
                          // Construcción de tarjetas unificadas
                          const dayMetrics = [
                            { l:"OUT", v:d.calOut||"—", c:T.blue },
                            { l:"IN", v:d.calIn||"—", c:T.accent },
                            { l:"PROT", v:d.p?`${Math.round(d.p)}g`:"—", c:T.green },
                            { l:"CARB", v:d.c?`${Math.round(d.c)}g`:"—", c:T.blue },
                            { l:"BAL", v:(d.calOut&&d.calIn)?(d.balance>0?`+${d.balance}`:d.balance):"—", c:(d.calOut&&d.calIn)?(d.balance<0?T.green:d.balance<300?T.accent:T.red):T.muted },
                            ...(d.sleep ? [{ l:"SUEÑO", v:`${d.sleep}h`, c:d.sleep>=7?T.green:d.sleep>=6?T.accent:T.red }] : []),
                            ...(d.score ? [{ l:"SCORE", v:`${d.score}%`, c:d.score>=85?T.green:d.score>=70?T.accent:T.red }] : []),
                            ...(d.steps ? [{ l:"PASOS", v:d.steps, c:T.purple }] : [])
                          ];

                          return (
                            <div key={d.date}>
                              {editId===d.date?(
                                <EditRow fields={[{k:"calOut",l:"Cal Out",t:"number"},{k:"steps",l:"Pasos",t:"number"},{k:"sleep",l:"Sueño h",t:"number",step:"0.01"},{k:"score",l:"Score %",t:"number"}]}
                                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))}
                                  onSave={()=>{ upsert({date:d.date,calOut:+editRow.calOut||0,steps:+editRow.steps||null,sleep:+editRow.sleep||null,score:+editRow.score||null}); setEId(null); }}
                                  onCancel={()=>setEId(null)} T={T}/>
                              ):(
                                <div style={{ ...st.card2, padding:"12px 14px", borderLeft:`3px solid ${d.date===TODAY?T.accent:T.border}`, borderRadius:16 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                    <span style={{ fontWeight:800, fontSize:13, color:d.date===TODAY?T.accent:T.text }}>
                                      {d.date===TODAY?"● Hoy":d.date.slice(5)}
                                    </span>
                                    <div style={{ display:"flex", gap:4 }}>
                                      <button style={st.icon(T.accent)} onClick={()=>{setEId(d.date);setER({calOut:d.calOut||"",steps:d.steps||"",sleep:d.sleep||"",score:d.score||""});}}>✏️</button>
                                      <button style={st.icon(T.red)} onClick={()=>setHL(p=>p.filter(x=>x.date!==d.date))}>🗑</button>
                                    </div>
                                  </div>
                                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(60px,1fr))", gap:8, marginTop:10 }}>
                                    {dayMetrics.map(m => (
                                      <div key={m.l} style={{ background:T.card, padding:"8px 6px", borderRadius:12, textAlign:"center", boxShadow:T.shadow }}>
                                        <div style={{ fontSize:9, color:T.muted, fontWeight:800, marginBottom:4, letterSpacing:"0.05em" }}>{m.l}</div>
                                        <div style={{ fontSize:14, fontWeight:900, color:m.c }}>{m.v}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: NUTRICIÓN (Panel de selección arriba de los resultados)
// ─────────────────────────────────────────────────────────────────────────────
function Nutricion({ today, todayFood, setFL, db, setDb, goals, T }) {
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

  const pCol=(v,g)=>v>=g?T.green:v>=g*.8?T.accent:T.red;
  const cCol=(v,g)=>v>g?T.red:v>g*.85?T.accent:T.green;
  const gGoal=goals.g||60;
  const filtered=db.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  const macros=[{name:"Proteína",v:Math.round(today.p*4),c:T.green},{name:"Carbos",v:Math.round(today.c*4),c:T.blue},{name:"Grasas",v:Math.round(today.g*9),c:T.purple}].filter(d=>d.v>0);

  const addDB=()=>{ if(!sel) return; setFL(p=>[...p,{
    date:TODAY, id:uid(), name:sel.name, qty, unit:sel.unit,
    cal:Math.round(sel.cal*qty), p:r1(sel.p*qty), c:r1(sel.c*qty), g:r1(sel.g*qty),
    unitCal:sel.cal, unitP:sel.p, unitC:sel.c, unitG:sel.g,
  }]); setSel(null);setQty(1);setSrch(""); };
  const addMan=()=>{ if(!mf.cal) return; setFL(p=>[...p,{date:TODAY,id:uid(),name:mf.name||"Log manual",qty:1,cal:+mf.cal,p:+mf.p||0,c:+mf.c||0,g:+mf.g||0}]); setMF({name:"",cal:"",p:"",c:"",g:""}); };
  const addToDb=()=>{ if(!adb.name||!adb.cal) return; setDb(p=>[...p,{id:uid(),name:adb.name,unit:adb.unit||"Porción",cal:+adb.cal,p:+adb.p||0,c:+adb.c||0,g:+adb.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEd=()=>{ setDb(p=>p.map(f=>f.id===dbEId?{...f,...dbER,cal:+dbER.cal,p:+dbER.p,c:+dbER.c,g:+dbER.g}:f)); setDbEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","🔍 Buscar DB"],["manual","✏️ Manual"],["adddb","➕ Añadir"],["editdb","🛠 Editar DB"]].map(([id,label])=>(
          <button key={id} style={st.ghost(mode===id)} onClick={()=>{setMode(id);setDbEId(null);}}>{label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,1.15fr) minmax(260px,1fr)", gap:16, alignItems:"start" }}>
        <div style={{ ...st.card, display:"flex", flexDirection:"column", minHeight:460 }}>
          {mode==="search"&&(<>
            <SH title={`🔍 Base de Datos (${db.length})`}/>
            <input style={{ ...st.inp, marginBottom:12 }} placeholder="" value={search} onChange={e=>{setSrch(e.target.value);setSel(null);}}/>
            
            {/* Panel pegajoso en la parte superior del listado */}
            {sel&&(
              <div style={{ ...st.card2, marginBottom:16, border:`1.5px solid ${T.accent}`, position:"sticky", top:0, zIndex:10, boxShadow:`0 4px 16px ${T.accent}30` }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:13, fontWeight:900, color:T.accent, marginBottom:10 }}>{sel.name}</div>
                  <button onClick={()=>setSel(null)} style={{background:"none", border:"none", color:T.muted, cursor:"pointer"}}>✕</button>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}><span style={st.lbl}>Cantidad</span>
                    <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
                  <div style={{ fontSize:12, color:T.muted, paddingTop:16 }}>× {sel.unit}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10, fontWeight:700 }}>{Math.round(sel.cal*qty)} kcal · {r1(sel.p*qty)}P · {r1(sel.c*qty)}C · {r1(sel.g*qty)}G</div>
                <button style={st.btn} onClick={addDB}>+ Agregar al Log</button>
              </div>
            )}

            <div style={{ flex:1, overflowY:"auto", marginBottom:10, minHeight:0 }}>
              {filtered.map(f=>(
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"10px 14px", borderRadius:16, cursor:"pointer", marginBottom:6,
                  border:`1.5px solid ${sel?.id===f.id?T.accent+"60":"transparent"}`,
                  background:sel?.id===f.id?T.accentDim:"transparent", transition:"all 0.12s" }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{f.cal} kcal · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
          </>)}
          {mode==="manual"&&(<>
            <SH title="✏️ Entrada Manual"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Descripción</span>
                <input style={st.inp} placeholder="" value={mf.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/></div>
              {[["Calorías *","cal"],["Proteína","p"],["Carbos","c"],["Grasas","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={mf[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            {mf.cal&&<div style={{fontSize:11,color:T.muted,marginBottom:10}}>Preview: {mf.cal} kcal · {mf.p||0}P · {mf.c||0}C · {mf.g||0}G</div>}
            <button style={st.btn} onClick={addMan}>+ Añadir al Log</button>
          </>)}
          {mode==="adddb"&&(<>
            <SH title="➕ Nuevo Alimento"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>Nombre</span>
                <input style={st.inp} placeholder="" value={adb.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/></div>
              <div><span style={st.lbl}>Unidad</span><input style={st.inp} placeholder="" value={adb.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/></div>
              {[["Kcal","cal"],["Proteína","p"],["Carbos","c"],["Grasas","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={adb[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            <button style={st.btn} onClick={addToDb}>💾 Guardar en DB</button>
          </>)}
          {mode==="editdb"&&(<>
            <SH title={`🛠 Editar DB (${db.length})`}/>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f=>dbEId===f.id?(
                <EditRow key={f.id}
                  fields={[{k:"name",l:"Nombre"},{k:"unit",l:"Unidad"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
                  vals={dbER} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))} onSave={saveDbEd} onCancel={()=>setDbEId(null)} T={T}/>
              ):(
                <div key={f.id} style={{ ...st.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{f.name}</div>
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

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={st.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <span style={st.lbl}>Calorías hoy</span>
                <div style={{ fontSize:48, fontWeight:900, color:T.accent, lineHeight:1, letterSpacing:"-2px" }}>{today.calIn}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>meta: {goals.cal} kcal</div>
                <ProgBar value={today.calIn} max={goals.cal} color={today.calIn>goals.cal?T.red:T.accent} h={4}/>
              </div>
              {macros.length>0&&(
                <div style={{width:72,height:72}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={macros} cx="50%" cy="50%" innerRadius={18} outerRadius={32} dataKey="v" strokeWidth={0} paddingAngle={2}>
                      {macros.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
              {[{n:"Proteína",v:today.p,g:goals.p,c:pCol(today.p,goals.p)},{n:"Carbos",v:today.c,g:goals.c,c:cCol(today.c,goals.c)},{n:"Grasas",v:today.g,g:gGoal,c:T.purple}].map(m=>(
                <div key={m.n} style={{ background:T.card2, borderRadius:16, padding:10, textAlign:"center" }}>
                  <div style={{ fontSize:26, fontWeight:900, color:m.c, letterSpacing:"-0.5px" }}>{Math.round(m.v)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{m.n} / {m.g}g</div>
                  <ProgBar value={m.v} max={m.g} color={m.c} h={3}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...st.card, flex:1 }}>
            <SH title="📋 Log de Hoy" right={<span style={{fontSize:11,color:T.muted}}>{todayFood.length} entradas</span>}/>
            {todayFood.length===0?(
              <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:16}}>Sin entradas</div>
            ):(
              <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {todayFood.map(f=>lgEId===f.id?(
                  <FoodEditRow key={f.id} entry={f}
                    onSave={saved=>{setFL(p=>p.map(x=>x.id===f.id?saved:x));setLgEId(null);}}
                    onCancel={()=>setLgEId(null)} T={T}/>
                ):(
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {f.name}{f.unit?` (${f.qty} × ${f.unit})`:""}
                      </div>
                      <div style={{ fontSize:10, color:T.muted }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:18, fontWeight:900, color:T.accent }}>{f.cal}</span>
                      <button style={st.icon(T.accent)} onClick={()=>setLgEId(f.id)}>✏️</button>
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
const REPS_OPTIONS  = ["","1","2","3","4","5","6","7","8","9","10","11","12","15","20","25","30"];
const SETS_OPTIONS  = ["","1","2","3","4","5","6","7","8"];
const RPE_OPTIONS   = ["","6","6.5","7","7.5","8","8.5","9","9.5","10"];

function Fuerza({ strLog, setStr, program, setProg, plans, setPlans, T }) {
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
    setStr(p=>[...p,{ ...form, exercise:n, date:TODAY, program, id:uid(),
      weight:+form.weight||0, reps:+form.reps||0, sets:+form.sets||0, rpe:+form.rpe||0 }]);
    setExSel(""); setExCust(""); setForm({ weight:"", reps:"", sets:"", rpe:"" });
  };

  const parseAndLoad = () => {
    if (!quickLoad) return;
    const lines = quickLoad.split("\n");
    const newSets = [];
    lines.forEach(line => {
      const m = line.match(/(.+?)\s+(\d+)\s*[xX]\s*(\d+)/);
      if (m) newSets.push({ id:uid(), exercise:m[1].trim(), sets:+m[2], reps:+m[3], weight:0, rpe:0, date:TODAY, program });
    });
    if (newSets.length > 0) { setStr(p=>[...p,...newSets]); setQuickLoad(""); alert(`✅ ${newSets.length} ejercicios cargados.`); }
    else alert("❌ Formato inválido. Usa: Ejercicio 4x10");
  };

  const saveEd=()=>{ setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEId(null); };

  const tabStyle = (id) => ({
    background: strView===id ? T.accent : T.card2,
    color: strView===id ? "#fff" : T.muted,
    border:"none", borderRadius:999, padding:"9px 20px",
    fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"system-ui",
    transition:"all 0.15s", letterSpacing:"0.02em"
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.card}>
        <SH title={<>🗓 Programa · <span style={{color:T.accent,fontWeight:900}}>{program}</span></>}
          right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.keys(PLANS).map(p=><button key={p} style={st.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>)}</div>}/>
        <button onClick={()=>setPlanO(o=>!o)} style={{ ...st.ghost(planOpen), marginBottom:planOpen?14:0 }}>
          {planOpen?"✕ Cerrar Editor":"⚙️ Configurar Plan Semanal"}
        </button>
        {planOpen&&(
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{fontSize:12,color:T.muted}}>Los cambios se reflejan en el Dashboard.</div>
              <button onClick={()=>setPlans(p=>({...p,[program]:{...PLANS[program]}}))} style={{...st.ghost(false),fontSize:11,padding:"4px 12px"}}>↺ Restaurar</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day=>{ const isT=day===TODAY_DOW; return (
                <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1.5px solid ${isT?T.accent:T.border}`, borderRadius:18, padding:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{fontSize:9,fontWeight:800,color:isT?T.accent:T.muted,letterSpacing:"0.1em"}}>{day.toUpperCase()}</span>
                    {isT&&<span style={{fontSize:8,background:T.accent,color:"#fff",borderRadius:999,padding:"2px 7px",fontWeight:800}}>HOY</span>}
                  </div>
                  <input value={plans[program]?.[day]||""} onChange={e=>setPlans(p=>({...p,[program]:{...p[program],[day]:e.target.value}}))}
                    style={{...st.inp,fontSize:12,padding:"7px 10px"}} placeholder=""/>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button style={tabStyle("weekly")} onClick={()=>setStrView("weekly")}>📅 Vista Semanal</button>
        <button style={tabStyle("register")} onClick={()=>setStrView("register")}>🏋️ Registrar Set</button>
        <button style={tabStyle("history")} onClick={()=>setStrView("history")}>📊 Historial ({strLog.length})</button>
      </div>

      {strView==="weekly" && (
        <WeeklyStrView strLog={strLog} plans={plans} program={program} T={T}/>
      )}

      {strView==="register" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={st.g2}>
            <div style={st.card}>
              <SH title="🏋️ Registrar Set"/>
              <div style={{marginBottom:10}}>
                <span style={st.lbl}>Ejercicio</span>
                <select value={exSel} onChange={e=>setExSel(e.target.value)} style={st.sel}>
                  <option value="" disabled>— Selecciona un ejercicio —</option>
                  {Object.entries(EXERCISE_LIB).map(([cat,exs])=>(
                    <optgroup key={cat} label={cat}>{exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}</optgroup>
                  ))}
                  <option value="__custom__">✏️ Otro / Personalizado</option>
                </select>
              </div>
              {isCustom&&<div style={{marginBottom:10}}><span style={st.lbl}>Nombre</span>
                <input style={{...st.inp,borderColor:T.accent+"60"}} placeholder="" value={exCust} onChange={e=>setExCust(e.target.value)}/></div>}
              {(exSel&&!isCustom)&&<div style={{background:T.accentDim,border:`1px solid ${T.accent}40`,borderRadius:12,padding:"8px 14px",marginBottom:12,fontSize:12,color:T.accent,fontWeight:700}}>✓ {exSel}</div>}

              <div style={{marginBottom:18}}>
                <span style={st.lbl}>Peso (kg)</span>
                <input style={st.inp} type="number" placeholder="" step="0.5"
                  value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))}/>
              </div>

              <div style={{
                display:"flex", gap:12, justifyContent:"center",
                background:T.card2, borderRadius:20, padding:"18px 12px", marginBottom:16
              }}>
                <NumberPicker value={form.sets} onChange={v=>setForm(p=>({...p,sets:v}))}
                  options={SETS_OPTIONS} label="SERIES" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.reps} onChange={v=>setForm(p=>({...p,reps:v}))}
                  options={REPS_OPTIONS} label="REPS" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.rpe} onChange={v=>setForm(p=>({...p,rpe:v}))}
                  options={RPE_OPTIONS} label="RPE" T={T}/>
              </div>

              {(form.sets && form.reps) && (
                <div style={{ background:T.accentDim, borderRadius:12, padding:"8px 14px", marginBottom:12, fontSize:12, color:T.accent, fontWeight:700, textAlign:"center" }}>
                  {form.sets}×{form.reps}{form.weight?` @ ${form.weight}kg`:""}{form.rpe?` · RPE ${form.rpe}`:""}
                </div>
              )}

              <button style={{...st.btn, opacity:(exSel&&!(isCustom&&!exCust))?1:0.4}}
                onClick={addSet}>+ Registrar Set</button>
            </div>

            <div style={st.card}>
              <SH title="⚡ Carga Rápida (Copiar & Pegar)"/>
              <span style={st.lbl}>Pega tu rutina aquí</span>
              <textarea
                style={{ ...st.inp, minHeight:140, resize:"vertical", marginBottom:12, lineHeight:1.6 }}
                placeholder=""
                value={quickLoad}
                onChange={e=>setQuickLoad(e.target.value)}
              />
              <button style={st.btn} onClick={parseAndLoad}>⚡ Cargar Ejercicios</button>
              <div style={{ fontSize:11, color:T.muted, marginTop:10, lineHeight:1.5 }}>
                Extraerá nombre, series y repeticiones. Luego edita peso y RPE en el historial.
              </div>
            </div>
          </div>
        </div>
      )}

      {strView==="history" && (
        <div style={st.card}>
          <SH title="📊 Historial" right={<span style={{fontSize:11,color:T.muted}}>{strLog.length} sets</span>}/>
          {strLog.length===0 ? (
            <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:30}}>Sin registros</div>
          ) : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:9, color:T.muted, fontWeight:800, letterSpacing:"0.07em" }}>
              {["EJERCICIO","KG","REPS","SER","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:420, overflowY:"auto" }}>
              {[...strLog].reverse().map(l=>editId===l.id?(
                <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <EditRow fields={[{k:"exercise",l:"Ejercicio"},{k:"weight",l:"Peso kg",t:"number"},{k:"reps",l:"Reps",t:"number"},{k:"sets",l:"Series",t:"number"},{k:"rpe",l:"RPE",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ):(
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"10px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, alignItems:"center", background:l.date===TODAY?T.accentDim:"transparent" }}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:700,color:l.date===TODAY?T.accent:T.text}}>{l.exercise}</span>
                  <span style={{color:T.accent,fontWeight:800}}>{l.weight}</span>
                  <span>{l.reps}</span><span>{l.sets}</span>
                  <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEId(l.id);setER({exercise:l.exercise,weight:l.weight,reps:l.reps,sets:l.sets,rpe:l.rpe});}}>✏️</button>
                    <button style={st.icon(T.red)} onClick={()=>setStr(p=>p.filter(x=>x.id!==l.id))}>🗑</button>
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
function Running({ runs, setRuns, runGoal, setRunGoal, isDark, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:TODAY,km:"",time:"",lpm:"",ppm:"" });
  const [editId,setEId]=useState(null), [editRow,setER]=useState({});
  const tip=p=><ChartTip {...p} T={T}/>;
  const total=runs.reduce((s,r)=>s+r.km,0);
  const add=()=>{ if(!form.km||!form.time) return;
    setRuns(p=>[...p,{...form,km:+form.km,pace:calcPace(+form.km,form.time),id:uid()}]);
    setForm({date:TODAY,km:"",time:"",lpm:"",ppm:""}); };
  const saveEd=()=>{ setRuns(p=>p.map(r=>r.id===editId?{...r,...editRow,km:+editRow.km,pace:calcPace(+editRow.km,editRow.time)}:r)); setEId(null); };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ ...st.card, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
        <SH title="🏃 Progreso de Carrera"
          right={
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={st.lbl}>Meta (km):</span>
              <input style={{ ...st.inp, width:88, padding:"6px 10px", fontSize:13 }} type="number" step="0.1"
                value={runGoal} onChange={e=>setRunGoal(+e.target.value||21.1)}/>
            </div>
          }/>
        <RunRing value={total} max={runGoal} isDark={isDark} T={T}/>
        <RunMilestones value={total} max={runGoal} T={T}/>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
          {[{l:"Total KM",v:total.toFixed(1),c:T.accent},{l:"Faltan",v:Math.max(runGoal-total,0).toFixed(1)+"km",c:T.muted},{l:"Carreras",v:runs.length,c:T.blue},{l:"Mejor pace",v:runs.length?[...runs].sort((a,b)=>a.pace?.localeCompare(b.pace))[0]?.pace||"—":"—",c:T.green}].map(m=>(
            <div key={m.l} style={{ textAlign:"center" }}>
              <div style={{fontSize:9,color:T.muted,fontWeight:800,letterSpacing:"0.09em"}}>{m.l.toUpperCase()}</div>
              <div style={{fontSize:22,fontWeight:900,color:m.c,letterSpacing:"-0.5px"}}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={st.g2}>
        <div style={st.card}>
          <SH title="➕ Registrar Carrera"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[["Fecha","date","date"],["Distancia (km)","km","number"],["Tiempo (hh:mm:ss)","time","text"],["LPM (FC media)","lpm","number"],["PPM (Cadencia)","ppm","number"]].map(([l,k,t])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type={t} placeholder="" step={k==="km"?"0.1":undefined} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div><span style={st.lbl}>Pace calculado</span>
              <div style={{ fontSize:26, fontWeight:900, color:T.accent, paddingTop:6, letterSpacing:"-0.5px" }}>{calcPace(+form.km,form.time)}</div></div>
          </div>
          <button style={st.btn} onClick={add}>+ Registrar Carrera</button>
        </div>
        <div style={st.card}>
          <SH title="📈 Km por sesión" right={<span style={{fontSize:11,color:T.muted}}>{runs.length} carreras</span>}/>
          {runs.length<2?<Placeholder msg="Registra carreras para la gráfica" T={T}/>:(
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={runs} margin={{top:4,right:4,bottom:0,left:-22}}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.accent} stopOpacity={0.3}/><stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fill:T.muted,fontSize:9}}/><Tooltip content={tip}/>
                <Area type="monotone" dataKey="km" stroke={T.accent} fill="url(#rg)" strokeWidth={2.5} dot={{fill:T.accent,r:4}} name="KM"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
          {runs.length>0&&(
            <div style={{ maxHeight:190, overflowY:"auto", marginTop:10 }}>
              {[...runs].reverse().map(r=>editId===r.id?(
                <div key={r.id} style={{marginBottom:8}}>
                  <EditRow fields={[{k:"date",l:"Fecha",t:"date"},{k:"km",l:"KM",t:"number",step:"0.1"},{k:"time",l:"Tiempo"},{k:"lpm",l:"LPM",t:"number"},{k:"ppm",l:"PPM",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ):(
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:11, alignItems:"center" }}>
                  <span style={{color:T.muted,minWidth:38}}>{r.date.slice(5)}</span>
                  <span style={{color:T.accent,fontWeight:800}}>{r.km}km</span>
                  <span style={{color:T.muted}}>{r.time}</span>
                  <span style={{color:T.teal,fontWeight:700}}>{r.pace}</span>
                  <span style={{color:T.muted}}>{r.lpm?`${r.lpm}lpm`:"—"}</span>
                  <div style={{display:"flex",gap:2}}>
                    <button style={st.icon(T.accent)} onClick={()=>{setEId(r.id);setER({date:r.date,km:r.km,time:r.time,lpm:r.lpm||"",ppm:r.ppm||""});}}>✏️</button>
                    <button style={st.icon(T.red)} onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
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
// TAB: BIOMETRÍA (Integrando el NumberPicker de Fuerza para campos cerrados)
// ─────────────────────────────────────────────────────────────────────────────
const VISCERAL_OPTIONS = Array.from({length: 15}, (_, i) => String(i + 1));

function Biometria({ bios, setBios, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:TODAY,height:"",weight:"",fat:"",muscle:"",visceral:"",water:"",protein:"",dmr:"" });
  const [editId,setEId]=useState(null), [editRow,setER]=useState({});
  const tip=p=><ChartTip {...p} T={T}/>;
  const last=bios[bios.length-1], first=bios[0];
  const delta=last&&first?(last.weight-first.weight).toFixed(1):null;
  const trend=bios.map(b=>({ date:b.date, Peso:b.weight, Grasa:b.fat, Músculo:b.muscle, Agua:b.water }));
  
  const add=()=>{ if(!form.weight) return;
    setBios(p=>[...p,{ ...form, id:uid(), weight:+form.weight, fat:+form.fat||null, muscle:+form.muscle||null,
      visceral:+form.visceral||null, water:+form.water||null, protein:+form.protein||null, dmr:+form.dmr||null,
      imc:form.height?calcIMC(+form.weight,+form.height):null }]);
    setForm(p=>({date:TODAY,height:p.height,weight:"",fat:"",muscle:"",visceral:"",water:"",protein:"",dmr:""})); };
  const saveEd=()=>{ setBios(p=>p.map(b=>b.id===editId?{...b,...editRow,weight:+editRow.weight,fat:+editRow.fat||null,muscle:+editRow.muscle||null,visceral:+editRow.visceral||null,water:+editRow.water||null,protein:+editRow.protein||null,dmr:+editRow.dmr||null,imc:editRow.height?calcIMC(+editRow.weight,+editRow.height):b.imc}:b)); setEId(null); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.g2}>
        <div style={st.card}>
          <SH title="⚖️ Registro Steren"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div><span style={st.lbl}>Fecha</span><input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><span style={st.lbl}>Estatura (cm)</span><input style={st.inp} type="number" placeholder="" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/></div>
            {[["Peso (kg) *","weight",T.accent],["% Grasa","fat",T.red],["Masa Muscular kg","muscle",T.green],["Agua %","water",T.blue],["Proteína %","protein",T.purple],["DMR/TMB kcal","dmr",T.muted]].map(([l,k,c])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={{...st.inp,borderColor:`${c}55`}} type="number" step="0.1" placeholder="" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div>
              <span style={st.lbl}>IMC (auto)</span>
              <div style={{...st.inp,color:(form.height&&form.weight)?T.accent:T.muted,fontWeight:800,pointerEvents:"none"}}>
                {(form.height&&form.weight)?calcIMC(+form.weight,+form.height):"—"}
              </div>
            </div>
          </div>
          
          {/* Reutilizando NumberPicker para Grasa Visceral (Escala 1-15) */}
          <div style={{ background:T.card2, borderRadius:20, padding:"16px 12px", marginBottom:16, display:"flex", justifyContent:"center" }}>
            <NumberPicker value={form.visceral} onChange={v=>setForm(p=>({...p,visceral:v}))} options={VISCERAL_OPTIONS} label="NIVEL VISCERAL" T={T}/>
          </div>

          <button style={st.btn} onClick={add}>+ Registrar Medición</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {last&&(
            <div style={st.card}>
              <SH title={`📊 Última · ${last.date.slice(5)}`}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(88px,1fr))", gap:8 }}>
                {[{l:"Peso",v:`${last.weight}kg`,c:T.accent},{l:"IMC",v:last.imc??"—",c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},{l:"% Grasa",v:last.fat?`${last.fat}%`:"—",c:T.red},{l:"Músculo",v:last.muscle?`${last.muscle}kg`:"—",c:T.green},{l:"Visceral",v:last.visceral?`Nv${last.visceral}`:"—",c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted},{l:"Agua",v:last.water?`${last.water}%`:"—",c:T.blue},{l:"Proteína",v:last.protein?`${last.protein}%`:"—",c:T.purple},{l:"DMR/TMB",v:last.dmr||"—",c:T.orange},{l:"Δ Peso",v:delta?`${delta>0?"+":""}${delta}kg`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                  <div key={m.l} style={{background:T.card2,borderRadius:14,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,fontWeight:800}}>{m.l.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:900,color:m.c,marginTop:3,letterSpacing:"-0.3px"}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{...st.card,flex:1}}>
            <SH title="📈 Evolución"/>
            {bios.length<2?<Placeholder msg="Registra 2+ mediciones" T={T}/>:(
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{top:4,right:4,bottom:0,left:-22}}>
                  <defs>{[["wg",T.accent],["gg",T.red],["mg",T.green],["ag",T.blue]].map(([id,c])=>(
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.28}/><stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}</defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:9}} domain={["auto","auto"]}/><Tooltip content={tip}/>
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
      {bios.length>0&&(
        <div style={{...st.card,overflowX:"auto"}}>
          <SH title="📋 Historial Biométrico" right={<span style={{fontSize:11,color:T.muted}}>{bios.length} registros</span>}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:700 }}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["Fecha","Peso","IMC","% Grasa","Músculo","Visceral","Agua %","Prot %","DMR",""].map(h=>(
                <th key={h} style={{padding:"7px 8px",color:T.muted,fontWeight:800,fontSize:9,textAlign:h===""?"center":"right",letterSpacing:"0.07em"}}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>{[...bios].reverse().map(b=>editId===b.id?(
              <tr key={b.id}><td colSpan={10} style={{padding:"8px 0"}}>
                <EditRow fields={[{k:"date",l:"Fecha",t:"date"},{k:"weight",l:"Peso",t:"number",step:"0.1"},{k:"fat",l:"Grasa %",t:"number",step:"0.1"},{k:"muscle",l:"Músculo",t:"number",step:"0.1"},{k:"visceral",l:"Visceral",t:"number"},{k:"water",l:"Agua %",t:"number",step:"0.1"},{k:"protein",l:"Prot %",t:"number",step:"0.1"},{k:"dmr",l:"DMR",t:"number"}]}
                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
              </td></tr>
            ):(
              <tr key={b.id} style={{borderBottom:`1px solid ${T.border}`,background:b.date===TODAY?T.accentDim:"transparent"}}>
                {[b.date.slice(5),`${b.weight}kg`,b.imc??"—",b.fat?`${b.fat}%`:"—",b.muscle?`${b.muscle}kg`:"—",b.visceral?`Nv${b.visceral}`:"—",b.water?`${b.water}%`:"—",b.protein?`${b.protein}%`:"—",b.dmr||"—"].map((v,i)=>(
                  <td key={i} style={{padding:"9px 8px",textAlign:i===0?"left":"right",color:i===0?T.text:T.muted,fontWeight:i===0?700:400}}>{v}</td>
                ))}
                <td style={{padding:"9px 8px",textAlign:"center"}}>
                  <button style={st.icon(T.accent)} onClick={()=>{setEId(b.id);setER({date:b.date,weight:b.weight,fat:b.fat||"",muscle:b.muscle||"",visceral:b.visceral||"",water:b.water||"",protein:b.protein||"",dmr:b.dmr||""});}}>✏️</button>
                  <button style={st.icon(T.red)}    onClick={()=>setBios(p=>p.filter(x=>x.id!==b.id))}>🗑</button>
                </td>
              </tr>
            ))}</tbody>
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
  const st=mkS(T);
  const done=Object.values(habits).filter(Boolean).length, total=Object.keys(habits).length;
  return (
    <div style={st.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:14, fontWeight:800 }}>✅ Hábitos Diarios</div>
        <div style={{ fontSize:36, fontWeight:900, color:done===total?T.accent:T.text, letterSpacing:"-1px" }}>{done}/{total}</div>
      </div>
      <ProgBar value={done} max={total} color={T.accent} h={5}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:10, marginTop:18 }}>
        {Object.entries(habits).map(([h,v])=>(
          <button key={h} onClick={()=>setHab(p=>({...p,[h]:!p[h]}))}
            style={{
              background:v?T.accentDim:T.card2, border:`1.5px solid ${v?T.accent:T.border}`,
              borderRadius:20, padding:"18px 14px", cursor:"pointer", textAlign:"left",
              transition:"all 0.2s", fontFamily:"system-ui", color:T.text,
              boxShadow:v?`0 0 0 1px ${T.accent}30,0 4px 20px ${T.accent}15`:"none"
            }}>
            <div style={{ fontSize:24, marginBottom:10 }}>{v?"✅":"⭕"}</div>
            <div style={{ fontSize:13, fontWeight:700, color:v?T.accent:T.text }}>{h}</div>
          </button>
        ))}
      </div>
      {done===total&&<div style={{ marginTop:18, textAlign:"center", background:T.accentDim, border:`1px solid ${T.accent}40`, borderRadius:18, padding:16, fontWeight:800, color:T.accent, fontSize:14 }}>🎉 ¡Día perfecto! Todos los hábitos completados</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(()=>{
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
    return()=>{try{document.head.removeChild(l);}catch(_){}};
  },[]);

  const [isDark,setDark]=useState(()=>lsGet("dark",true));
  const T=isDark?DARK:LIGHT;

  const [tab,      setTab]  =useState("dashboard");
  const [healthLog,setHL]   =useState(()=>lsGet("hl",  SEED_HEALTH));
  const [foodLog,  setFL]   =useState(()=>lsGet("fl",  []));
  const [db,       setDb]   =useState(()=>lsGet("db",  SEED_DB));
  const [strLog,   setStr]  =useState(()=>lsGet("str", []));
  const [runs,     setRuns] =useState(()=>lsGet("runs",[]));
  const [bios,     setBios] =useState(()=>lsGet("bios",[]));
  const [habits,   setHab]  =useState(()=>lsGet("hab", {"💧 Agua (3L)":false,"😴 Sueño (8h)":false,"🥩 Proteína meta":false,"🏃 Cardio":false,"🧘 Meditación":false,"🤸 Stretching":false}));
  const [goals,    setGoals]=useState(()=>lsGet("goals",{...DEFAULT_GOALS}));
  const [program,  setProg] =useState(()=>lsGet("prog","Hipertrofia"));
  const [plans,    setPlans]=useState(()=>lsGet("plans",Object.fromEntries(Object.entries(PLANS).map(([k,v])=>[k,{...v}]))));
  const [projects, setProjs]=useState(()=>lsGet("projs",{}));
  const [runGoal,  setRunGoal]=useState(()=>lsGet("runGoal",21.1));

  useEffect(()=>{lsSet("dark",isDark);},[isDark]);
  useEffect(()=>{lsSet("hl",healthLog);},[healthLog]);
  useEffect(()=>{lsSet("fl",foodLog);},[foodLog]);
  useEffect(()=>{lsSet("db",db);},[db]);
  useEffect(()=>{lsSet("str",strLog);},[strLog]);
  useEffect(()=>{lsSet("runs",runs);},[runs]);
  useEffect(()=>{lsSet("bios",bios);},[bios]);
  useEffect(()=>{lsSet("hab",habits);},[habits]);
  useEffect(()=>{lsSet("goals",goals);},[goals]);
  useEffect(()=>{lsSet("prog",program);},[program]);
  useEffect(()=>{lsSet("plans",plans);},[plans]);
  useEffect(()=>{lsSet("projs",projects);},[projects]);
  useEffect(()=>{lsSet("runGoal",runGoal);},[runGoal]);

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
        if(d.habits&&typeof d.habits==="object")      setHab(d.habits);
        if(d.goals&&typeof d.goals==="object")        setGoals(d.goals);
        if(typeof d.program==="string")               setProg(d.program);
        if(d.weeklyPlans&&typeof d.weeklyPlans==="object") setPlans(d.weeklyPlans);
        if(d.projects&&typeof d.projects==="object")  setProjs(d.projects);
        if(typeof d.runGoal==="number")               setRunGoal(d.runGoal);
        alert("✅ Importación exitosa");
      } catch(err){alert("❌ JSON inválido: "+err.message);}
    };
    reader.readAsText(file); e.target.value="";
  },[]);

  const exportJSON=useCallback(()=>{
    const data={healthLog,foodLog,nutritionDB:db,strengthLog:strLog,runs,biometrics:bios,habits,goals,program,weeklyPlans:plans,projects,runGoal,exportedAt:new Date().toISOString()};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download=`aristeia_v7_${TODAY}.json`; a.click();
  },[healthLog,foodLog,db,strLog,runs,bios,habits,goals,program,plans,projects,runGoal]);

  const getDayData=useCallback((date)=>{
    const h=healthLog.find(d=>d.date===date)||{};
    const fs=foodLog.filter(f=>f.date===date), hasF=fs.length>0;
    const calIn=hasF?fs.reduce((s,f)=>s+f.cal,0):(h.calIn||0);
    const p=hasF?r1(fs.reduce((s,f)=>s+f.p,0)):(h.p||0);
    const c=hasF?r1(fs.reduce((s,f)=>s+f.c,0)):(h.c||0);
    const g=hasF?r1(fs.reduce((s,f)=>s+f.g,0)):(h.g||0);
    return{date,calOut:h.calOut||0,calIn,p,c,g,sleep:h.sleep||null,score:h.score||null,steps:h.steps||null,balance:calIn-(h.calOut||0),goals:h.goals||{...DEFAULT_GOALS}};
  },[healthLog,foodLog]);

  const allDates=useMemo(()=>{
    const s=new Set([...healthLog.map(h=>h.date),...foodLog.map(f=>f.date),TODAY]);
    return [...s].sort().reverse();
  },[healthLog,foodLog]);

  const weekData  =useMemo(()=>allDates.slice(0,14).map(d=>getDayData(d)),[allDates,getDayData]);
  const last7     =useMemo(()=>weekData.slice(0,7).reverse(),[weekData]);
  const today     =useMemo(()=>getDayData(TODAY),[getDayData]);
  const todayFood =useMemo(()=>foodLog.filter(f=>f.date===TODAY),[foodLog]);
  const allDayData=useMemo(()=>allDates.map(d=>getDayData(d)),[allDates,getDayData]);

  const st=mkS(T);
  const TABS=[
    {id:"dashboard",l:"📊 Dashboard"},{id:"dailylog",l:"📋 Daily Log"},
    {id:"nutricion",l:"🥗 Nutrición"},{id:"fuerza",l:"🏋️ Fuerza"},
    {id:"running",l:"🏃 Running"},{id:"bio",l:"⚖️ Biometría"},{id:"habits",l:"✅ Hábitos"},
  ];

  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const currentHour=new Date().getHours();
  const greeting=currentHour<12?"Buenos días":currentHour<18?"Buenas tardes":"Buenas noches";
  const rawDate=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  const formattedDate=rawDate.charAt(0).toUpperCase()+rawDate.slice(1);

  return (
    <div style={{
      background:T.bg, minHeight:"100vh", position: "relative", overflow: "hidden",
      fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",
      color:T.text, padding:"16px 18px",
      transition:"background 0.3s,color 0.3s"
    }}>
      <DayProgressArc T={T} />
      <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10, position:"relative", zIndex:1 }}>
        <div>
          <div style={{
            fontSize:24, fontWeight:900, letterSpacing:"-0.8px", lineHeight:1.1,
            color:T.text
          }}>
            {greeting}, <span style={{color:T.accent}}>Rafa</span> 👊
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4, fontWeight:500 }}>{formattedDate}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {today.calIn>0&&<div style={{ background:T.card, borderRadius:999, padding:"7px 16px", fontSize:12, color:T.accent, fontWeight:800, boxShadow:T.shadow }}>{today.calIn} kcal in</div>}
          {today.calOut>0&&<div style={{ background:T.card, borderRadius:999, padding:"7px 16px", fontSize:12, fontWeight:800, color:bCol(today.balance), boxShadow:T.shadow }}>{today.balance>0?"+":""}{today.balance} bal</div>}
          <button onClick={()=>setDark(d=>!d)} style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"8px 16px", cursor:"pointer", fontSize:12, color:T.text, fontWeight:700 }}>{isDark?"☀️ Light":"🌙 Dark"}</button>
          <button onClick={()=>importRef.current?.click()} style={{ background:T.card2, color:T.text, border:`1.5px solid ${T.border}`, borderRadius:999, padding:"8px 16px", fontWeight:700, fontSize:12, cursor:"pointer" }}>↑ Importar</button>
          <button onClick={exportJSON} style={{ background:T.accent, color:"#fff", border:"none", borderRadius:999, padding:"9px 20px", fontWeight:800, fontSize:12, cursor:"pointer" }}>↓ JSON</button>
          <button onClick={()=>{if(window.confirm("¿Borrar TODOS los datos?")){lsClear();window.location.reload();}}} style={{ background:"none", color:T.red, border:`1px solid ${T.red}40`, borderRadius:999, padding:"7px 12px", fontSize:11, cursor:"pointer", fontWeight:700 }}>🗑</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", position:"relative", zIndex:1 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?T.accent:T.card,
            color:tab===t.id?"#fff":T.muted,
            border:`1.5px solid ${tab===t.id?T.accent:T.border}`,
            borderRadius:999, padding:"9px 18px", fontWeight:700, fontSize:12,
            cursor:"pointer", transition:"all 0.2s",
            boxShadow:tab===t.id?`0 4px 16px ${T.accent}40`:T.shadow
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ position:"relative", zIndex:1 }}>
        {tab==="dashboard" && <Dashboard today={today} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setPlans={setPlans} setTab={setTab} isDark={isDark} T={T}/>}
        {tab==="dailylog"  && <DailyLog  allDayData={allDayData} setHL={setHL} goals={goals} setGoals={setGoals} projects={projects} setProjects={setProjs} T={T}/>}
        {tab==="nutricion" && <Nutricion today={today} todayFood={todayFood} setFL={setFL} db={db} setDb={setDb} goals={goals} T={T}/>}
        {tab==="fuerza"    && <Fuerza    strLog={strLog} setStr={setStr} program={program} setProg={setProg} plans={plans} setPlans={setPlans} T={T}/>}
        {tab==="running"   && <Running   runs={runs} setRuns={setRuns} runGoal={runGoal} setRunGoal={setRunGoal} isDark={isDark} T={T}/>}
        {tab==="bio"       && <Biometria bios={bios} setBios={setBios} T={T}/>}
        {tab==="habits"    && <Habitos   habits={habits} setHab={setHab} T={T}/>}
      </div>
    </div>
  );
}