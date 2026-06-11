import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — F1 TELEMETRY · ENGINEERING DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#050506", card:"#0A0B0E", card2:"#12141A", card3:"#1A1D24",
  accent:"#00E5FF", // Neon Cyan (Telemetry standard)
  accentDim:"rgba(0, 229, 255, 0.12)", 
  navy:"#0A0B0E", navyBright:"#12141A",
  text:"#E2E8F0", muted:"#64748B", border:"#1F242F", inputBg:"#050506",
  green:"#39FF14", red:"#FF007F", blue:"#3B82F6",
  purple:"#B026FF", orange:"#FFD700", teal:"#14B8A6", pink:"#EC4899",
  shadow:"0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
  pickerBg:"#050506", font:"'DM Mono', monospace, system-ui",
};
const LIGHT = { // Fallback, though telemetry is meant for dark mode
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

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA & WHOOP LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const PLANS = {
  Hipertrofia:{ Lun:"Pecho + Tríceps", Mar:"Espalda + Bíceps", Mié:"Piernas + Glúteos", Jue:"Hombros + Core",       Vie:"Upper Compuesto",       Sáb:"Piernas + Cardio", Dom:"🔋 Descanso" },
  Fuerza:     { Lun:"Squat Heavy",     Mar:"Press Banca Heavy", Mié:"Descanso activo",   Jue:"Peso Muerto",             Vie:"OHP + Accesorios",      Sáb:"Cardio LISS",      Dom:"🔋 Descanso" },
  Definición: { Lun:"Full Body A",     Mar:"HIIT 30min",        Mié:"Full Body B",       Jue:"LISS 45min",              Vie:"Full Body C + Cardio",  Sáb:"HIIT 30min",       Dom:"🔋 Descanso" },
  Power:      { Lun:"Potencia Sup.",   Mar:"Potencia Inf.",     Mié:"🔋 Descanso",       Jue:"Olímpicos + Fuerza",  Vie:"Pliometría + Velocidad", Sáb:"LISS",            Dom:"🔋 Descanso" },
};
const PLAN_KEYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL_ES = { Lun:"LUNES", Mar:"MARTES", Mié:"MIÉRCOLES", Jue:"JUEVES", Vie:"VIERNES", Sáb:"SÁBADO", Dom:"DOMINGO" };
const EXERCISE_LIB = {
  "🫁 Pecho":   ["Press Banca","Press Inclinado","Press Declinado","Aperturas c/ Mancuernas","Fondos en Paralelas","Crossover en Polea"],
  "🔙 Espalda": ["Peso Muerto","Dominadas","Remo con Barra","Remo en Polea","Jalón al Pecho","Pull-over","Face Pull"],
  "🦵 Piernas": ["Sentadilla","Prensa de Pierna","Leg Extension","Femoral Tumbado","Zancadas","Hip Thrust","Peso Muerto Rumano","Sentadilla Búlgara"],
  "💪 Brazos":  ["Curl con Barra","Curl Martillo","Curl Scott","Extensión de Tríceps","Press Francés","Pushdown en Polea"],
  "🏔 Hombros": ["Press Militar","Press Arnold","Elevaciones Laterales","Elevaciones Frontales","Encogimientos"],
  "⚡ Core":    ["Plancha","Crunch","Russian Twist","Leg Raise","Dragon Flag","Ab Wheel"],
  "🏃 Cardio":  ["Caminata Inclinada","Carrera en Cinta","Bicicleta Estacionaria","HIIT","Saltar la Cuerda","Escaladora"],
};
const getLocalYYYYMMDD = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};
const TODAY = getLocalYYYYMMDD();
const DEFAULT_GOALS = { cal:2400, p:180, c:280, g:60 };

// Lógica para calcular Recovery tipo Whoop
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

const getRecoveryColor = (score, T) => {
  if (!score) return T.muted;
  if (score >= 67) return T.green;
  if (score >= 34) return T.orange;
  return T.red;
};

const SEED_HEALTH   = [];
const SEED_DB = [];

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
    card:  { background:T.card, borderRadius:12, padding:18, color:T.text, boxShadow:T.shadow, fontFamily:T.font, border:`1px solid ${T.border}`, position:"relative" },
    card2: { background:T.card2, borderRadius:8, padding:14, color:T.text, fontFamily:T.font, border:`1px solid ${T.border}` },
    lbl:   { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:6, display:"block", fontWeight:700 },
    inp:   { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, transition:"border-color 0.15s" },
    sel:   { background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 34px 10px 14px", color:T.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:T.font, appearance:"none", WebkitAppearance:"none", backgroundImage:SVG_ARROW, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", cursor:"pointer" },
    btn:   { background:T.accent, color:"#000", border:"none", borderRadius:6, padding:"12px 22px", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:T.font, width:"100%", textTransform:"uppercase", letterSpacing:"0.05em" },
    btnSm: { background:T.navyBright, color:T.text, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 18px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" },
    ghost: a=>({ background:a?T.accentDim:"transparent", color:a?T.accent:T.muted, border:`1px solid ${a?T.accent:T.border}`, borderRadius:6, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap", transition:"all 0.15s" }),
    icon:  c=>({ background:"none", border:"none", cursor:"pointer", color:c||T.muted, padding:"3px 6px", borderRadius:4, fontSize:13, lineHeight:1, display:"inline-flex", alignItems:"center" }),
    g2:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:16 },
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
      <span style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:T.font }}>{label}</span>
      <div style={{
        background:T.pickerBg, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 5px",
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
                border: isSel ? `1px solid ${T.accent}` : "1px solid transparent",
                background: isSel ? T.accentDim : "transparent",
                borderRadius:4,
                color: isSel ? T.accent : T.text,
                fontWeight: isSel ? 700 : 400, fontSize:15,
                cursor:"pointer", fontFamily:T.font, textAlign:"center",
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

function WeeklyStrView({ strLog, plans, program, activeDate, T }) {
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
              width:"100%", background:isSelectedDay ? T.accentDim : "transparent",
              border:"none", cursor:"pointer", padding:"16px 20px",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              textAlign:"left", fontFamily:T.font, transition:"background 0.15s"
            }}>
              <div>
                <div style={{
                  fontSize:28, fontWeight:700, letterSpacing:"-1px", lineHeight:1,
                  color: isSelectedDay ? T.accent : isRest ? T.muted : T.text, textTransform:"uppercase"
                }}>
                  {DAY_FULL_ES[dayKey]}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginTop:6, display:"flex", gap:10, alignItems:"center" }}>
                  <span>{fmtDate}</span>
                  {dateStr === TODAY && <span style={{ background:T.card3, border:`1px solid ${T.border}`, color:T.text, borderRadius:4, padding:"2px 6px", fontSize:9, fontWeight:800 }}>HOY</span>}
                  {isSelectedDay && dateStr !== TODAY && <span style={{ background:T.accent, color:"#000", borderRadius:4, padding:"2px 6px", fontSize:9, fontWeight:800 }}>ACTIVO</span>}
                  {planned && <span style={{ color:isRest?T.muted:T.accent, fontWeight:600 }}>{planned}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {dayExs.length > 0 && (
                  <span style={{ background:isSelectedDay?T.accent:T.card3, color:isSelectedDay?"#000":T.text, borderRadius:4, padding:"3px 8px", fontSize:12, fontWeight:700 }}>
                    {dayExs.filter(e => checked[e.id]).length}/{dayExs.length}
                  </span>
                )}
                <span style={{ color:T.muted, fontSize:16, fontWeight:700 }}>{isOpen ? "−" : "+"}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${T.border}` }}>
                {dayExs.length === 0 ? (
                  <div style={{ color:T.muted, fontSize:12, padding:"14px 0", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ opacity:0.4 }}>[ ]</span>
                    {isRest ? "SISTEMA EN REPOSO 🔋" : "SIN TELEMETRÍA DE ENTRENAMIENTO"}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                    {dayExs.map(ex => {
                      const done = checked[ex.id];
                      return (
                        <div key={ex.id} onClick={() => toggleCheck(ex.id)} style={{
                          display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:6, cursor:"pointer",
                          background: done ? T.accentDim : T.card2, border:`1px solid ${done ? T.accent : T.border}`, transition:"all 0.15s"
                        }}>
                          <div style={{ width:16, height:16, borderRadius:2, flexShrink:0, border:`1px solid ${done ? T.accent : T.muted}`, background: done ? T.accent : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                            {done && <span style={{ color:"#000", fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color: done ? T.accent : T.text, textDecoration: done ? "line-through" : "none", textTransform:"uppercase" }}>
                              {ex.exercise}
                            </div>
                            <div style={{ fontSize:11, color:T.muted, marginTop:4, display:"flex", gap:10, fontFamily:T.font }}>
                              {ex.sets && ex.reps && <span>{ex.sets}x{ex.reps}</span>}
                              {ex.weight > 0 && <span style={{ color:T.text }}>{ex.weight}kg</span>}
                              {ex.rpe > 0 && <span style={{ color:T.orange }}>RPE {ex.rpe}</span>}
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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="butt" strokeDasharray={`${c} ${c}`} strokeDashoffset={off}
        style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
}

function PaceRing({ currentPaceSecs, targetPaceSecs, isDark, T }) {
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
  
  const trackClr=isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)";
  
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ display:"block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackClr} strokeWidth={sw}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        {pct>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={done?T.green:T.accent}
          strokeWidth={sw} strokeLinecap="butt"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:"stroke-dashoffset 0.8s ease" }}/>}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2 }}>
        <div style={{ fontSize:9, color:T.muted, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase" }}>LIVE PACE</div>
        <div style={{ fontSize:32, fontWeight:700, color:done?T.green:T.accent, lineHeight:1, fontFamily:T.font }}>{currentPaceSecs > 0 ? secsToPace(currentPaceSecs) : "--:--"}</div>
        <div style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>TGT {secsToPace(targetPaceSecs)}</div>
      </div>
    </div>
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
function FoodEditRow({ entry, onSave, onCancel, T }) {
  const st=mkS(T);
  const hasUnit=!!entry.unitCal;
  const [qty,setQty]=useState(entry.qty||1);
  const [raw,setRaw]=useState({ name:entry.name, cal:entry.cal, p:entry.p, c:entry.c, g:entry.g });
  const preview=hasUnit?{ cal:Math.round(entry.unitCal*qty), p:r1(entry.unitP*qty), c:r1(entry.unitC*qty), g:r1(entry.unitG*qty) }:null;
  const doSave=()=>onSave(hasUnit?{ ...entry, qty, ...preview }:{ ...entry, ...raw, cal:+raw.cal, p:+raw.p||0, c:+raw.c||0, g:+raw.g||0 });
  if (hasUnit) return (
    <div style={{ ...st.card2, border:`1px solid ${T.accent}`, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase" }}>{entry.name}</div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1 }}><span style={st.lbl}>CANTIDAD</span>
          <input style={{...st.inp, padding:"6px 10px"}} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
        <div style={{ fontSize:11, color:T.muted, paddingTop:16, fontFamily:T.font }}>× {entry.unit}</div>
      </div>
      {preview&&<div style={{ fontSize:10, color:T.muted, fontFamily:T.font }}>= {preview.cal} KCAL · {preview.p}P · {preview.c}C · {preview.g}G</div>}
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ ...st.btnSm, background:T.green, color:"#000", border:"none", flex:1 }} onClick={doSave}>✓ OK</button>
        <button style={{ ...st.btnSm, flex:1 }} onClick={onCancel}>✕ CANCEL</button>
      </div>
    </div>
  );
  return <EditRow fields={[{k:"name",l:"Descripción"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
    vals={raw} onChange={(k,v)=>setRaw(p=>({...p,[k]:v}))} onSave={doSave} onCancel={onCancel} T={T}/>;
}

function KPICard({ id, label, value, sub, color, pct, isDark, T }) {
  return (
    <div style={{
      background: T.card2, border: `1px solid ${T.border}`,
      borderRadius:8, padding:"14px",
      color:T.text, minHeight:90, display:"flex", flexDirection:"column", justifyContent:"space-between",
      position:"relative", overflow:"hidden"
    }}>
      <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:color }} />
      <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginLeft:6 }}>
        {id} · {label}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:12, marginLeft:6 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1, fontFamily:T.font }}>{value}</div>
          {sub&&<div style={{ fontSize:10, color:T.muted, marginTop:4, fontFamily:T.font }}>{sub}</div>}
        </div>
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
function Dashboard({ activeDayData, weekData, last7, goals, program, plans, setPlans, setTab, activeDate, isDark, T }) {
  const st=mkS(T);
  const [editDay, setEditDay] = useState(null);
  const tip=p=><ChartTip {...p} T={T}/>;
  
  const pCol=(v,g)=>v>=g?T.green:v>=g*.8?T.accent:T.red;
  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const cCol=(v,g)=>v>g?T.red:v>g*.85?T.accent:T.green;

  const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];

  const kpis=[
    { id:"PWR", label:"Cal In",  value:activeDayData.calIn||"—", sub:`TGT: ${goals.cal}`,  color:T.accent },
    { id:"SYS", label:"Balance", value:activeDayData.calOut>0?(activeDayData.balance>0?`+${activeDayData.balance}`:activeDayData.balance):"—", sub:activeDayData.balance<0?"DEFICIT":"SURPLUS", color:activeDayData.calOut>0?bCol(activeDayData.balance):T.muted },
    { id:"MAC", label:"Protein", value:activeDayData.p?`${Math.round(activeDayData.p)}g`:"—", sub:`TGT: ${goals.p}g`, color:pCol(activeDayData.p,goals.p) },
    { id:"MAC", label:"Carbs",   value:activeDayData.c?`${Math.round(activeDayData.c)}g`:"—", sub:`MAX: ${goals.c}g`,  color:cCol(activeDayData.c,goals.c) },
    { id:"AER", label:"Cal Out", value:activeDayData.calOut||"—", sub:"BURNED",        color:T.blue },
    { id:"AER", label:"Steps",   value:activeDayData.steps?activeDayData.steps.toLocaleString():"—", sub:"TGT: 10K", color:T.purple },
    { id:"REC", label:"Recovery",value:activeDayData.recovery?`${activeDayData.recovery}%`:"—", sub:`Zz: ${activeDayData.sleep||"—"}h · SCR: ${activeDayData.score||"—"}%`, color:getRecoveryColor(activeDayData.recovery, T) || T.purple },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
        {kpis.map(k=><KPICard key={k.label} {...k} isDark={isDark} T={T}/>)}
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

      <div style={st.card}>
        <SH title={<>🗓️ WEEKLY SETUP · <span style={{color:T.accent}}>{program}</span></>}
          right={<span style={{fontSize:10, color:T.muted, fontFamily:T.font}}>CLICK TO EDIT</span>}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8 }}>
          {PLAN_KEYS.map(day=>{
            const label=plans[program]?.[day]||"—", isT=day===actDayDow, isR=label.includes("Descanso");
            return (
              <div key={day} onClick={() => setEditDay(day)} style={{ background:isT?T.accentDim:T.card2, border:`1px solid ${isT?T.accent:T.border}`, borderRadius:6, padding:"12px 10px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:10, fontWeight:700, color:isT?T.accent:T.muted, letterSpacing:"0.15em", marginBottom:8, fontFamily:T.font }}>{day.toUpperCase()}</div>
                {editDay === day ? (
                  <input autoFocus value={plans[program]?.[day] || ""}
                    onChange={e => setPlans(p => ({...p, [program]: {...p[program], [day]: e.target.value}}))}
                    onBlur={() => setEditDay(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditDay(null)}
                    style={{ background:"transparent", border:"none", outline:"none", fontSize:11, textAlign:"center", color:T.text, width:"100%", fontFamily:T.font, textTransform:"uppercase" }} />
                ) : (
                  <div style={{ fontSize:11, fontWeight:700, color:isR?T.muted:T.text, lineHeight:1.4, textTransform:"uppercase" }}>{label}</div>
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
// TAB: CALENDARIO 
// ─────────────────────────────────────────────────────────────────────────────
function Calendario({ allDayData, bios, activeDate, setActiveDate, isDark, T }) {
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
          {["semana", "mes", "año"].map(v => {
            const val = v === "semana" ? "week" : v === "mes" ? "month" : "year";
            return (
              <button key={v} onClick={() => setView(val)}
                style={{
                  background: view === val ? T.card : "transparent",
                  color: view === val ? T.accent : T.muted,
                  borderRadius: 4, padding: "6px 16px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                  fontFamily: T.font, textTransform:"uppercase", transition: "all 0.2s"
                }}>
                {v}
              </button>
            )
          })}
        </div>

        {(view === "month" || view === "year") && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ ...st.icon(T.text), background: T.card, padding: "8px 14px", border:`1px solid ${T.border}`, transition: "all 0.15s" }} onClick={prevPeriod}>◀</button>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: T.text, minWidth: 120, textAlign: "center", fontFamily:T.font }}>
              {view === "year" ? year : new Date(year, month, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </div>
            <button style={{ ...st.icon(T.text), background: T.card, padding: "8px 14px", border:`1px solid ${T.border}`, transition: "all 0.15s" }} onClick={nextPeriod}>▶</button>
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
                      background: isCurrentMonth ? T.accentDim : T.card2,
                      border: `1px solid ${isCurrentMonth ? T.accent : T.border}`,
                      borderRadius: 6, padding: "20px 10px",
                      color: isCurrentMonth ? T.accent : T.text,
                      fontWeight: 700, fontSize: 12, textTransform: "uppercase", cursor: "pointer", fontFamily:T.font, transition: "all 0.15s"
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
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8, fontFamily:T.font }}>{d}</div>
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
                      background: isSelected ? T.accent : recoveryColor ? `${recoveryColor}18` : hasData ? T.card2 : "transparent",
                      border: `1px solid ${isSelected ? T.accent : recoveryColor ? recoveryColor : isToday ? T.muted : "transparent"}`,
                      borderRadius: 6, aspectRatio: "1/1", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: isSelected ? "#000" : recoveryColor ? recoveryColor : T.text, fontFamily:T.font, transition: "all 0.15s", padding: 0
                    }}>
                    <span style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400 }}>{day.d}</span>
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
                      background: isSelected ? T.accent : T.card2,
                      border: `1px solid ${isSelected ? T.accent : isToday ? T.muted : T.border}`,
                      borderRadius: 6, display: "flex", flexDirection: "column",
                      alignItems: "center", cursor: "pointer", color: isSelected ? "#000" : T.text,
                      fontFamily:T.font, transition: "all 0.15s"
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, textTransform: "uppercase" }}>
                        {mDate.toLocaleDateString("es-ES", { weekday: "short" })}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
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
            <div style={{ ...st.card2, border: `1px solid ${T.accentDim}`, padding: 20 }}>
              <SH title={`📌 TELEMETRY: ${activeDate === TODAY ? "TODAY" : activeDate}`} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>CAL OUT</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.blue, fontFamily:T.font }}>
                    {selectedDayData.calOut ? `${selectedDayData.calOut}` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>CAL IN</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent, fontFamily:T.font }}>
                    {selectedDayData.calIn ? `${selectedDayData.calIn}` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>RECOVERY</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: getRecoveryColor(selectedDayData.recovery, T), fontFamily:T.font }}>
                    {selectedDayData.recovery ? `${selectedDayData.recovery}%` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>HRV / RHR</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, paddingTop: 2, fontFamily:T.font }}>
                    {selectedDayData.hrv ? `${selectedDayData.hrv}` : "—"} / {selectedDayData.rhr ? `${selectedDayData.rhr}` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>SLEEP</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.purple, fontFamily:T.font }}>
                    {selectedDayData.sleep ? `${selectedDayData.sleep}h` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing:"0.1em", fontFamily:T.font }}>SCORE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily:T.font }}>
                    {selectedDayData.score ? `${selectedDayData.score}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ ...st.card, padding: 20, flex: 1 }}>
            <SH title={`📊 RECAP: ${new Date(year, month, 1).toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}`} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <span style={st.lbl}>AVG CAL IN</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, fontFamily:T.font }}>{Math.round(avgCalIn)}</div>
              </div>
              <div>
                <span style={st.lbl}>AVG CAL OUT</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.blue, fontFamily:T.font }}>{Math.round(avgCalOut)}</div>
              </div>
              <div>
                <span style={st.lbl}>AVG SLEEP</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.purple, fontFamily:T.font }}>{avgSleep > 0 ? avgSleep.toFixed(1) : "—"}<span style={{fontSize:12, color:T.muted}}>h</span></div>
              </div>
              <div>
                <span style={st.lbl}>AVG SCORE</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.teal, fontFamily:T.font }}>{avgScore > 0 ? Math.round(avgScore) : "—"}<span style={{fontSize:12, color:T.muted}}>%</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DAILY LOG
// ─────────────────────────────────────────────────────────────────────────────
function DailyLog({ allDayData, setHL, goals, setGoals, projects, setProjects, activeDate, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:activeDate, calOut:"", steps:"", sleep:"", score:"", hrv:"", rhr:"", recovery:"" });
  const [editG,setEG]=useState(false);
  const [editId,setEId]=useState(null);
  const [editRow,setER]=useState({});
  const [editProjKey,setEPK]=useState(null);
  const [projTemp,setProjTemp]=useState("");
  const [openMonths,setOM]=useState(()=>new Set([getMonthKey(activeDate)]));
  const [openWeeks,setOW]=useState(()=>new Set([getWeekStart(activeDate)]));

  useEffect(() => { setForm(p => ({ ...p, date: activeDate })); }, [activeDate]);

  const upsert=entry=>setHL(prev=>{
    const i=prev.findIndex(d=>d.date===entry.date);
    if(i>=0){const u=[...prev];u[i]={...u[i],...entry};return u;}
    return [...prev,entry];
  });
  
  const save=()=>{
    if(!form.date) return;
    const calcRec = calculateWhoopRecovery(+form.hrv, +form.rhr, +form.score);
    const finalRecovery = form.recovery ? +form.recovery : calcRec;

    upsert({ 
      date:form.date, 
      ...(form.calOut&&{calOut:+form.calOut}), 
      ...(form.steps&&{steps:+form.steps}),
      ...(form.sleep&&{sleep:+form.sleep}), 
      ...(form.score&&{score:+form.score}),
      ...(form.hrv&&{hrv:+form.hrv}),
      ...(form.rhr&&{rhr:+form.rhr}),
      ...(finalRecovery&&{recovery: finalRecovery}),
      goals:{...goals} 
    });
    setForm({ date:activeDate, calOut:"", steps:"", sleep:"", score:"", hrv:"", rhr:"", recovery:"" });
  };

  const rows=allDayData.filter(d=>d.calOut>0||d.sleep||d.steps||d.calIn>0||d.recovery>0);
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
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[["CAL",goals.cal,T.accent],["PROT",goals.p,T.green],["CARB",goals.c,T.blue],["FAT",goals.g,T.purple]].map(([l,v,c])=>(
              editG?(
                <div key={l} style={{ display:"flex", flexDirection:"column", gap:4, minWidth:80 }}>
                  <span style={st.lbl}>{l}</span>
                  <input style={{ ...st.inp, padding:"6px 10px", fontSize:12 }} type="number" value={v}
                    onChange={e=>setGoals(p=>({...p,[l.toLowerCase()]:+e.target.value}))}/>
                </div>
              ):(
                <div key={l} style={{ textAlign:"left" }}>
                  <div style={{ fontSize:10, color:T.muted, fontWeight:700, fontFamily:T.font }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:T.font }}>{v}</div>
                </div>
              )
            ))}
          </div>
          <button style={st.btnSm} onClick={()=>setEG(o=>!o)}>{editG?"✓ SAVE TGT":"✏️ EDIT TGT"}</button>
        </div>
      </div>

      <div style={st.g2}>
        <div style={st.card}>
          <SH title="📋 LOG BIOMETRICS"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            <div style={{gridColumn:"span 2"}}><span style={st.lbl}>DATE</span>
              <input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            
            <div style={{gridColumn:"span 2", borderBottom:`1px dashed ${T.border}`, paddingBottom:4, marginTop:4}}>
              <span style={{...st.lbl, color:T.accent}}>⚡ ERS & SLEEP</span>
            </div>
            
            {[["HRV (ms)","hrv"],["RHR (bpm)","rhr"],["SLEEP (hrs)","sleep"],["SCORE (%)","score"]].map(([l,k])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" step={k==="sleep"?"0.01":"1"} placeholder="—"
                  value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}

            <div style={{gridColumn:"span 2"}}><span style={st.lbl}>MANUAL RECOVERY % (AUTO IF EMPTY)</span>
              <input style={{...st.inp, borderColor:T.green+"50"}} type="number" max="100" placeholder="Ej: 85" value={form.recovery} onChange={e=>setForm(p=>({...p,recovery:e.target.value}))}/></div>

            <div style={{gridColumn:"span 2", borderBottom:`1px dashed ${T.border}`, paddingBottom:4, marginTop:8}}>
              <span style={{...st.lbl, color:T.blue}}>🏃 AERO & DYNAMICS</span>
            </div>

            {[["CAL OUT","calOut"],["STEPS","steps"]].map(([l,k])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type="number" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
          </div>
          <button style={st.btn} onClick={save}>💾 UPLOAD TELEMETRY</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {grouped.length===0&&<div style={{ ...st.card2, color:T.muted, fontSize:12, fontFamily:T.font }}>[NO RECORDS FOUND]</div>}
          {grouped.map(({ mk, weeks })=>(
            <div key={mk} style={st.card}>
              <button onClick={()=>toggleMonth(mk)} style={{ background:"none", border:"none", cursor:"pointer", width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:0, color:T.text }}>
                <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", fontFamily:T.font }}>{fmtMonth(mk)}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:T.font }}>{openMonths.has(mk)?"▲":"▼"} {weeks.reduce((s,w)=>s+w.days.length,0)} LOGS</div>
              </button>
              {openMonths.has(mk)&&weeks.map(({ wk, days })=>{
                const projName=projects[wk];
                return (
                  <div key={wk} style={{ marginTop:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <button onClick={()=>toggleWeek(wk)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0, color:T.text }}>
                        <span style={{ fontSize:11, fontWeight:700, color:T.muted }}>{openWeeks.has(wk)?"▼":"▶"}</span>
                        <span style={{ fontSize:12, fontWeight:700, fontFamily:T.font }}>{fmtWeek(wk)}</span>
                      </button>
                      {editProjKey===wk?(
                        <input autoFocus style={{ ...st.inp, width:140, padding:"4px 8px", fontSize:11 }}
                          value={projTemp}
                          onChange={e=>setProjTemp(e.target.value)}
                          onBlur={()=>{ setProjects(p=>({...p,[wk]:projTemp||undefined})); setEPK(null); }}
                          onKeyDown={e=>{ if(e.key==="Enter")e.target.blur(); if(e.key==="Escape")setEPK(null); }}
                          placeholder=""/>
                      ):(
                        <button onClick={()=>{ setEPK(wk); setProjTemp(projects[wk]||""); }}
                          style={{ background:projName?T.accentDim:"transparent", border:`1px dashed ${projName?T.accent:T.border}`,
                            borderRadius:4, padding:"2px 8px", fontSize:10, color:projName?T.accent:T.muted,
                            cursor:"pointer", fontWeight:projName?700:400, whiteSpace:"nowrap", fontFamily:T.font, textTransform:"uppercase" }}>
                          {projName||"+ TAG"}
                        </button>
                      )}
                    </div>
                    {openWeeks.has(wk)&&(
                      <div style={{ display:"flex", flexDirection:"column", gap:8, paddingLeft:16 }}>
                        {days.map(d=>{
                          const dayMetrics = [
                            { l:"IN", v:d.calIn||"—", c:T.accent },
                            { l:"OUT", v:d.calOut||"—", c:T.blue },
                            { l:"PROT", v:d.p?`${Math.round(d.p)}g`:"—", c:T.green },
                            { l:"PASOS", v:d.steps?d.steps.toLocaleString():"—", c:T.purple },
                            { l:"SUEÑO", v:d.sleep?`${d.sleep}h`:"—", c:T.purple },
                            { l:"SCORE", v:d.score?`${d.score}%`:"—", c:d.score>=85?T.green:d.score>=70?T.accent:T.red },
                            { l:"REC", v:d.recovery?`${d.recovery}%`:"—", c:getRecoveryColor(d.recovery, T) }
                          ];

                          return (
                            <div key={d.date}>
                              {editId===d.date?(
                                <EditRow fields={[{k:"recovery",l:"Rec %"},{k:"hrv",l:"HRV"},{k:"rhr",l:"RHR"},{k:"calOut",l:"Cal Out"},{k:"steps",l:"Steps",t:"number"},{k:"sleep",l:"Sleep h",step:"0.01"},{k:"score",l:"Score %"}]}
                                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))}
                                  onSave={()=>{ upsert({date:d.date,recovery:+editRow.recovery||null,hrv:+editRow.hrv||null,rhr:+editRow.rhr||null,calOut:+editRow.calOut||0,steps:+editRow.steps||null,sleep:+editRow.sleep||null,score:+editRow.score||null}); setEId(null); }}
                                  onCancel={()=>setEId(null)} T={T}/>
                              ):(
                                <div style={{ ...st.card2, padding:"10px 12px", borderLeft:`2px solid ${d.date===activeDate?T.accent:T.border}`, borderRadius:4 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                    <span style={{ fontWeight:700, fontSize:12, color:d.date===activeDate?T.accent:T.text, fontFamily:T.font }}>
                                      {d.date===TODAY?"> TODAY":d.date.slice(5)}
                                    </span>
                                    <div style={{ display:"flex", gap:4 }}>
                                      <button style={st.icon(T.accent)} onClick={()=>{setEId(d.date);setER({recovery:d.recovery||"",hrv:d.hrv||"",rhr:d.rhr||"",calOut:d.calOut||"",steps:d.steps||"",sleep:d.sleep||"",score:d.score||""});}}>✏️</button>
                                      <button style={st.icon(T.red)} onClick={()=>setHL(p=>p.filter(x=>x.date!==d.date))}>🗑</button>
                                    </div>
                                  </div>
                                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(50px,1fr))", gap:6, marginTop:8 }}>
                                    {dayMetrics.map(m => (
                                      <div key={m.l} style={{ background:T.card, padding:"6px 4px", borderRadius:4, textAlign:"center", border:`1px solid ${T.border}` }}>
                                        <div style={{ fontSize:9, color:T.muted, fontWeight:700, marginBottom:4, fontFamily:T.font }}>{m.l}</div>
                                        <div style={{ fontSize:11, fontWeight:700, color:m.c, fontFamily:T.font }}>{m.v}</div>
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

  const pCol=(v,g)=>v>=g?T.green:v>=g*.8?T.accent:T.red;
  const cCol=(v,g)=>v>g?T.red:v>g*.85?T.accent:T.green;
  const gGoal=goals.g||60;
  const filtered=db.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  const macros=[{name:"Proteína",v:Math.round(activeDayData.p*4),c:T.green},{name:"Carbos",v:Math.round(activeDayData.c*4),c:T.blue},{name:"Grasas",v:Math.round(activeDayData.g*9),c:T.purple}].filter(d=>d.v>0);

  const addDB=()=>{ if(!sel) return; setFL(p=>[...p,{
    date:activeDate, id:uid(), name:sel.name, qty, unit:sel.unit,
    cal:Math.round(sel.cal*qty), p:r1(sel.p*qty), c:r1(sel.c*qty), g:r1(sel.g*qty),
    unitCal:sel.cal, unitP:sel.p, unitC:sel.c, unitG:sel.g,
  }]); setSel(null);setQty(1);setSrch(""); };
  const addMan=()=>{ if(!mf.cal) return; setFL(p=>[...p,{date:activeDate,id:uid(),name:mf.name||"Log manual",qty:1,cal:+mf.cal,p:+mf.p||0,c:+mf.c||0,g:+mf.g||0}]); setMF({name:"",cal:"",p:"",c:"",g:""}); };
  const addToDb=()=>{ if(!adb.name||!adb.cal) return; setDb(p=>[...p,{id:uid(),name:adb.name,unit:adb.unit||"Porción",cal:+adb.cal,p:+adb.p||0,c:+adb.c||0,g:+adb.g||0}]); setAdb({name:"",unit:"",cal:"",p:"",c:"",g:""}); setMode("search"); };
  const saveDbEd=()=>{ setDb(p=>p.map(f=>f.id===dbEId?{...f,...dbER,cal:+dbER.cal,p:+dbER.p,c:+dbER.c,g:+dbER.g}:f)); setDbEId(null); };

  const isToday = activeDate === TODAY;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["search","🔍 SEARCH DB"],["manual","✏️ MANUAL IN"],["adddb","➕ ADD NEW"],["editdb","🛠 EDIT DB"]].map(([id,label])=>(
          <button key={id} style={st.ghost(mode===id)} onClick={()=>{setMode(id);setDbEId(null);}}>{label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(260px,1.15fr) minmax(260px,1fr)", gap:16, alignItems:"start" }}>
        <div style={{ ...st.card, display:"flex", flexDirection:"column", minHeight:460 }}>
          {mode==="search"&&(<>
            <SH title={`🔍 DB SEARCH (${db.length})`}/>
            <input style={{ ...st.inp, marginBottom:12 }} placeholder="Type to search..." value={search} onChange={e=>{setSrch(e.target.value);setSel(null);}}/>
            
            {sel&&(
              <div style={{ ...st.card2, marginBottom:16, border:`1px solid ${T.accent}`, position:"sticky", top:0, zIndex:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.accent, marginBottom:10, textTransform:"uppercase" }}>{sel.name}</div>
                  <button onClick={()=>setSel(null)} style={{background:"none", border:"none", color:T.muted, cursor:"pointer"}}>✕</button>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                  <div style={{ flex:1 }}><span style={st.lbl}>QTY</span>
                    <input style={st.inp} type="number" value={qty} min="0.25" step="0.25" onChange={e=>setQty(+e.target.value)}/></div>
                  <div style={{ fontSize:12, color:T.muted, paddingTop:16, fontFamily:T.font }}>× {sel.unit}</div>
                </div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:10, fontWeight:700, fontFamily:T.font }}>{Math.round(sel.cal*qty)} KCAL · {r1(sel.p*qty)}P · {r1(sel.c*qty)}C · {r1(sel.g*qty)}G</div>
                <button style={st.btn} onClick={addDB}>INJECT TO TANK</button>
              </div>
            )}

            <div style={{ flex:1, overflowY:"auto", marginBottom:10, minHeight:0 }}>
              {filtered.map(f=>(
                <div key={f.id} onClick={()=>setSel(f)} style={{ padding:"10px 14px", borderRadius:6, cursor:"pointer", marginBottom:6,
                  border:`1px solid ${sel?.id===f.id?T.accent+"60":"transparent"}`,
                  background:sel?.id===f.id?T.accentDim:"transparent", transition:"all 0.12s" }}>
                  <div style={{ fontWeight:700, fontSize:13, textTransform:"uppercase" }}>{f.name}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4, fontFamily:T.font }}>{f.cal} KCAL · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div>
                </div>
              ))}
            </div>
          </>)}
          {mode==="manual"&&(<>
            <SH title="✏️ MANUAL INJECTION"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>DESC</span>
                <input style={st.inp} placeholder="" value={mf.name} onChange={e=>setMF(p=>({...p,name:e.target.value}))}/></div>
              {[["KCAL *","cal"],["PROT (g)","p"],["CARB (g)","c"],["FAT (g)","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={mf[k]} onChange={e=>setMF(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            {mf.cal&&<div style={{fontSize:10,color:T.muted,marginBottom:10, fontFamily:T.font}}>PREVIEW: {mf.cal} KCAL · {mf.p||0}P · {mf.c||0}C · {mf.g||0}G</div>}
            <button style={st.btn} onClick={addMan}>INJECT TO TANK</button>
          </>)}
          {mode==="adddb"&&(<>
            <SH title="➕ NEW DB ENTRY"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{gridColumn:"span 2"}}><span style={st.lbl}>ITEM</span>
                <input style={st.inp} placeholder="" value={adb.name} onChange={e=>setAdb(p=>({...p,name:e.target.value}))}/></div>
              <div><span style={st.lbl}>UNIT</span><input style={st.inp} placeholder="" value={adb.unit} onChange={e=>setAdb(p=>({...p,unit:e.target.value}))}/></div>
              {[["KCAL","cal"],["PROT","p"],["CARB","c"],["FAT","g"]].map(([l,k])=>(
                <div key={k}><span style={st.lbl}>{l}</span>
                  <input style={st.inp} type="number" placeholder="" value={adb[k]} onChange={e=>setAdb(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
            </div>
            <button style={st.btn} onClick={addToDb}>💾 SAVE TO DB</button>
          </>)}
          {mode==="editdb"&&(<>
            <SH title={`🛠 EDIT DB (${db.length})`}/>
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
              {db.map(f=>dbEId===f.id?(
                <EditRow key={f.id}
                  fields={[{k:"name",l:"Name"},{k:"unit",l:"Unit"},{k:"cal",l:"Kcal",t:"number"},{k:"p",l:"P",t:"number"},{k:"c",l:"C",t:"number"},{k:"g",l:"G",t:"number"}]}
                  vals={dbER} onChange={(k,v)=>setDbER(p=>({...p,[k]:v}))} onSave={saveDbEd} onCancel={()=>setDbEId(null)} T={T}/>
              ):(
                <div key={f.id} style={{ ...st.card2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{fontWeight:700,fontSize:12,textTransform:"uppercase"}}>{f.name}</div>
                    <div style={{fontSize:10,color:T.muted, fontFamily:T.font, marginTop:4}}>{f.cal} KCAL · {f.p}P · {f.c}C · {f.g}G · /{f.unit}</div></div>
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
                <span style={st.lbl}>{isToday ? "LIVE INJECTION" : "INJECTION REC."}</span>
                <div style={{ fontSize:42, fontWeight:700, color:T.accent, lineHeight:1, fontFamily:T.font }}>{activeDayData.calIn}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:4, fontFamily:T.font }}>TGT: {goals.cal} KCAL</div>
                <ProgBar value={activeDayData.calIn} max={goals.cal} color={activeDayData.calIn>goals.cal?T.red:T.accent} h={4}/>
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
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16 }}>
              {[{n:"PROT",v:activeDayData.p,g:goals.p,c:pCol(activeDayData.p,goals.p)},{n:"CARB",v:activeDayData.c,g:goals.c,c:cCol(activeDayData.c,goals.c)},{n:"FAT",v:activeDayData.g,g:gGoal,c:T.purple}].map(m=>(
                <div key={m.n} style={{ background:T.card2, borderRadius:6, padding:10, textAlign:"center", border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:22, fontWeight:700, color:m.c, fontFamily:T.font }}>{Math.round(m.v)}</div>
                  <div style={{ fontSize:9, color:T.muted, fontFamily:T.font, marginTop:2 }}>{m.n} / {m.g}G</div>
                  <ProgBar value={m.v} max={m.g} color={m.c} h={2}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...st.card, flex:1 }}>
            <SH title={`📋 LOG (${isToday ? "TODAY" : activeDate})`} right={<span style={{fontSize:10,color:T.muted,fontFamily:T.font}}>{activeFood.length} ENTRIES</span>}/>
            {activeFood.length===0?(
              <div style={{color:T.muted,fontSize:11,textAlign:"center",padding:16,fontFamily:T.font}}>[NO FUEL LOADED]</div>
            ):(
              <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {activeFood.map(f=>lgEId===f.id?(
                  <FoodEditRow key={f.id} entry={f}
                    onSave={saved=>{setFL(p=>p.map(x=>x.id===f.id?saved:x));setLgEId(null);}}
                    onCancel={()=>setLgEId(null)} T={T}/>
                ):(
                  <div key={f.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", background:T.card2, borderRadius:4, border:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textTransform:"uppercase" }}>
                        {f.name}{f.unit?` (${f.qty} × ${f.unit})`:""}
                      </div>
                      <div style={{ fontSize:10, color:T.muted, fontFamily:T.font, marginTop:2 }}>{f.p}P · {f.c}C · {f.g}G</div>
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:T.accent, fontFamily:T.font }}>{f.cal}</span>
                      <div style={{ display:"flex", gap:2 }}>
                        <button style={st.icon(T.accent)} onClick={()=>setLgEId(f.id)}>✏️</button>
                        <button style={st.icon(T.red)}    onClick={()=>setFL(p=>p.filter(x=>x.id!==f.id))}>🗑</button>
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
      // Clean markdown bold (**), list formats like "- ", "* ", "1. "
      txt = txt.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
      if(!txt) return;

      const matchObj = { exercise: "", sets: "", reps: "", weight: "", rpe: "" };

      // Match sets and reps: "4x10" or "4 X 10" or " 4 x 10"
      const srMatch = txt.match(/\s+(\d+)\s*[xX]\s*(\d+)/);
      if (srMatch) {
          matchObj.sets = +srMatch[1];
          matchObj.reps = +srMatch[2];
          txt = txt.replace(srMatch[0], '');
      }

      // Match weight: "@ 60kg", "con 60", " @ 60.5"
      const wMatch = txt.match(/(?:@\s*|con\s*)?(\d*\.?\d+)\s*(?:kg|lbs)/i) || txt.match(/@\s*(\d*\.?\d+)/);
      if (wMatch) {
          matchObj.weight = +wMatch[1];
          txt = txt.replace(wMatch[0], '');
      }

      // Match RPE: "RPE 8", "rpe 8.5"
      const rpeMatch = txt.match(/(?:RPE|rpe)[:\s]*(\d*\.?\d+)/i);
      if (rpeMatch) {
          matchObj.rpe = +rpeMatch[1];
          txt = txt.replace(rpeMatch[0], '');
      }

      // Remaining is exercise name
      matchObj.exercise = txt.replace(/[-@]+$/, '').trim() || "EJERCICIO DESCONOCIDO";

      newSets.push({ id:uid(), ...matchObj, date:activeDate, program });
    });
    if (newSets.length > 0) { setStr(p=>[...p,...newSets]); setQuickLoad(""); alert(`✅ ${newSets.length} RECORDS INJECTED.`); }
  };

  const saveEd=()=>{ setStr(p=>p.map(l=>l.id===editId?{...l,...editRow,weight:+editRow.weight,reps:+editRow.reps,sets:+editRow.sets,rpe:+editRow.rpe}:l)); setEId(null); };

  const tabStyle = (id) => ({
    background: strView===id ? T.accent : T.card2,
    color: strView===id ? "#000" : T.muted,
    border:`1px solid ${strView===id ? T.accent : T.border}`, borderRadius:6, padding:"8px 16px",
    fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:T.font, textTransform:"uppercase",
    transition:"all 0.15s", letterSpacing:"0.05em"
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.card}>
        <SH title={<>🗓 CHASSIS PROGRAM · <span style={{color:T.accent,fontWeight:900}}>{program}</span></>}
          right={<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.keys(PLANS).map(p=><button key={p} style={st.ghost(program===p)} onClick={()=>setProg(p)}>{p}</button>)}</div>}/>
        <button onClick={()=>setPlanO(o=>!o)} style={{ ...st.ghost(planOpen), marginBottom:planOpen?14:0 }}>
          {planOpen?"✕ CLOSE EDITOR":"⚙️ CONFIG"}
        </button>
        {planOpen&&(
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{fontSize:11,color:T.muted, fontFamily:T.font}}>SYNCED WITH DASHBOARD.</div>
              <button onClick={()=>setPlans(p=>({...p,[program]:{...PLANS[program]}}))} style={{...st.ghost(false),fontSize:10,padding:"4px 12px"}}>↺ RESTORE</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8 }}>
              {PLAN_KEYS.map(day=>{ 
                const actDayDow = PLAN_KEYS[new Date(activeDate+"T12:00:00").getDay()===0 ? 6 : new Date(activeDate+"T12:00:00").getDay()-1];
                const isT=day===actDayDow; 
                return (
                <div key={day} style={{ background:isT?T.accentDim:T.card2, border:`1px solid ${isT?T.accent:T.border}`, borderRadius:6, padding:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{fontSize:9,fontWeight:700,color:isT?T.accent:T.muted,letterSpacing:"0.1em"}}>{day.toUpperCase()}</span>
                    {isT&&<span style={{fontSize:8,background:T.accent,color:"#000",borderRadius:2,padding:"2px 4px",fontWeight:800}}>ACT</span>}
                  </div>
                  <input value={plans[program]?.[day]||""} onChange={e=>setPlans(p=>({...p,[program]:{...p[program],[day]:e.target.value}}))}
                    style={{...st.inp,fontSize:11,padding:"6px 10px"}} placeholder=""/>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button style={tabStyle("weekly")} onClick={()=>setStrView("weekly")}>📅 WEEKLY VIEW</button>
        <button style={tabStyle("register")} onClick={()=>setStrView("register")}>🏋️ MANUAL IN</button>
        <button style={tabStyle("history")} onClick={()=>setStrView("history")}>📊 TELEMETRY ({strLog.length})</button>
      </div>

      {strView==="weekly" && (
        <WeeklyStrView strLog={strLog} plans={plans} program={program} activeDate={activeDate} T={T}/>
      )}

      {strView==="register" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={st.g2}>
            <div style={st.card}>
              <SH title={`🏋️ SINGLE LOG (${activeDate === TODAY ? "TODAY" : activeDate})`}/>
              <div style={{marginBottom:10}}>
                <span style={st.lbl}>EXERCISE</span>
                <select value={exSel} onChange={e=>setExSel(e.target.value)} style={st.sel}>
                  <option value="" disabled>— SELECT —</option>
                  {Object.entries(EXERCISE_LIB).map(([cat,exs])=>(
                    <optgroup key={cat} label={cat}>{exs.map(ex=><option key={ex} value={ex}>{ex}</option>)}</optgroup>
                  ))}
                  <option value="__custom__">✏️ CUSTOM</option>
                </select>
              </div>
              {isCustom&&<div style={{marginBottom:10}}><span style={st.lbl}>NAME</span>
                <input style={{...st.inp,borderColor:T.accent+"60"}} placeholder="" value={exCust} onChange={e=>setExCust(e.target.value)}/></div>}
              {(exSel&&!isCustom)&&<div style={{background:T.accentDim,border:`1px solid ${T.accent}`,borderRadius:6,padding:"8px 14px",marginBottom:12,fontSize:11,color:T.accent,fontWeight:700}}>✓ {exSel.toUpperCase()}</div>}

              <div style={{marginBottom:18}}>
                <span style={st.lbl}>WEIGHT (KG)</span>
                <input style={st.inp} type="number" placeholder="" step="0.5"
                  value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))}/>
              </div>

              <div style={{
                display:"flex", gap:12, justifyContent:"center",
                background:T.card2, borderRadius:8, border:`1px solid ${T.border}`, padding:"16px 12px", marginBottom:16
              }}>
                <NumberPicker value={form.sets} onChange={v=>setForm(p=>({...p,sets:v}))}
                  options={SETS_OPTIONS} label="SETS" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.reps} onChange={v=>setForm(p=>({...p,reps:v}))}
                  options={REPS_OPTIONS} label="REPS" T={T}/>
                <div style={{ width:1, background:T.border, alignSelf:"stretch" }}/>
                <NumberPicker value={form.rpe} onChange={v=>setForm(p=>({...p,rpe:v}))}
                  options={RPE_OPTIONS} label="RPE" T={T}/>
              </div>

              {(form.sets && form.reps) && (
                <div style={{ background:T.accentDim, border:`1px solid ${T.accent}`, borderRadius:6, padding:"8px 14px", marginBottom:12, fontSize:12, color:T.accent, fontWeight:700, textAlign:"center", fontFamily:T.font }}>
                  {form.sets}×{form.reps}{form.weight?` @ ${form.weight}kg`:""}{form.rpe?` · RPE ${form.rpe}`:""}
                </div>
              )}

              <button style={{...st.btn, opacity:(exSel&&!(isCustom&&!exCust))?1:0.4}}
                onClick={addSet}>INJECT SET</button>
            </div>

            <div style={st.card}>
              <SH title="⚡ FAST INJECTOR (AI PARSER)"/>
              <span style={st.lbl}>PASTE RAW TEXT (AI OUTPUT COMPATIBLE)</span>
              <textarea
                style={{ ...st.inp, minHeight:160, resize:"vertical", marginBottom:12, lineHeight:1.6 }}
                placeholder="Paste AI output directly:&#10;**1. Press Banca** 4x10 @ 60kg RPE 8&#10;- Sentadilla 4 x 10 con 100kg&#10;Curl Bicep 3x12"
                value={quickLoad}
                onChange={e=>setQuickLoad(e.target.value)}
              />
              <button style={st.btn} onClick={parseAndLoad}>⚡ PARSE & INJECT</button>
              <div style={{ fontSize:10, color:T.muted, marginTop:12, lineHeight:1.5, fontFamily:T.font }}>
                [SYS MSG: Engine optimized to clean markdown (**), bullet points (-), numbers (1.), and auto-detect SetsxReps, Weight (@ / con), and RPE].
              </div>
            </div>
          </div>
        </div>
      )}

      {strView==="history" && (
        <div style={st.card}>
          <SH title="📊 TELEMETRY DATA" right={<span style={{fontSize:10,color:T.muted,fontFamily:T.font}}>{strLog.length} SETS</span>}/>
          {strLog.length===0 ? (
            <div style={{color:T.muted,fontSize:11,textAlign:"center",padding:30,fontFamily:T.font}}>[NO RECORDS]</div>
          ) : (<>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.1em", fontFamily:T.font }}>
              {["EXERCISE","KG","REPS","SET","RPE",""].map((h,i)=><span key={i}>{h}</span>)}
            </div>
            <div style={{ maxHeight:420, overflowY:"auto" }}>
              {[...strLog].reverse().map(l=>editId===l.id?(
                <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <EditRow fields={[{k:"exercise",l:"Ex"},{k:"weight",l:"Kg",t:"number"},{k:"reps",l:"Reps",t:"number"},{k:"sets",l:"Sets",t:"number"},{k:"rpe",l:"RPE",t:"number"}]}
                    vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
                </div>
              ):(
                <div key={l.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:4, padding:"12px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, alignItems:"center", background:l.date===activeDate?T.accentDim:"transparent", fontFamily:T.font }}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:700,color:l.date===activeDate?T.accent:T.text,textTransform:"uppercase"}}>{l.exercise}</span>
                  <span style={{color:T.accent,fontWeight:700}}>{l.weight||"—"}</span>
                  <span>{l.reps||"—"}</span><span>{l.sets||"—"}</span>
                  <span style={{color:l.rpe>=9?T.red:l.rpe>=7?T.accent:T.green,fontWeight:700}}>{l.rpe||"—"}</span>
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
function Running({ runs, setRuns, runGoal, setRunGoal, targetTime, setTargetTime, shoes, setShoes, activeDate, isDark, T }) {
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
      
      <div style={{...st.card2, background: T.accentDim, border:`1px solid ${T.accent}`, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center"}}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 4, letterSpacing:"0.05em" }}>🏁 TGT: {runGoal} KM</div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily:T.font }}>[SYS] EVALUATING CURRENT PACE VS REQUIRED TO ACHIEVE {targetTime}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.accent, display: "block", marginBottom: 4, fontFamily:T.font }}>TGT TIME (HH:MM:SS)</span>
            <input style={{...st.inp, width: 120, padding: "6px 10px"}} type="text" value={targetTime} onChange={e=>setTargetTime(e.target.value)} />
          </div>
          <div style={{ background: T.card, border:`1px solid ${T.border}`, padding: "6px 14px", borderRadius: 6, textAlign: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, display: "block", fontFamily:T.font }}>REQ PACE</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: T.accent, fontFamily:T.font }}>{requiredPace}</span>
          </div>
        </div>
      </div>

      <div style={st.g2}>
        <div style={{ ...st.card, display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <SH title="🏃 PACE TELEMETRY"
            right={
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={st.lbl}>DIST TGT:</span>
                <input style={{ ...st.inp, width:70, padding:"4px 8px", fontSize:12 }} type="number" step="0.1"
                  value={runGoal} onChange={e=>setRunGoal(+e.target.value||21.1)}/>
              </div>
            }/>
          <PaceRing currentPaceSecs={avgPaceSecs} targetPaceSecs={reqSecs} isDark={isDark} T={T}/>
          
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center", marginTop: 12 }}>
            {[{l:"REQ",v:requiredPace,c:T.muted},{l:"AVG",v:avgPaceSecs?secsToPace(avgPaceSecs):"—",c:T.blue},{l:"BEST",v:bestPaceSecs?secsToPace(bestPaceSecs):"—",c:T.green}].map(m=>(
              <div key={m.l} style={{ textAlign:"center", background:T.card2, border:`1px solid ${T.border}`, padding:"6px 14px", borderRadius:4 }}>
                <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:"0.1em",fontFamily:T.font}}>{m.l}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.c,fontFamily:T.font}}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={st.card}>
          <SH title="➕ INJECT RUN LOG"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[["DATE","date","date"],["DIST (KM)","km","number"],["TIME (HH:MM:SS)","time","text"],["HR AVG","lpm","number"],["CADENCE","ppm","number"]].map(([l,k,t])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={st.inp} type={t} placeholder="" step={k==="km"?"0.1":undefined} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div>
              <span style={st.lbl}>SHOES</span>
              <select style={st.sel} value={form.shoe} onChange={handleShoeChange}>
                <option value="" disabled>-- SEL --</option>
                {shoes.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                <option value="__new__">+ ADD NEW</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2", marginTop: 8, background:T.card2, border:`1px solid ${T.border}`, padding:"10px", borderRadius:6 }}>
              <span style={st.lbl}>COMPUTED PACE</span>
              <div style={{ fontSize:22, fontWeight:700, color:T.accent, fontFamily:T.font }}>{calcPace(+form.km,form.time)}</div>
            </div>
          </div>
          <button style={st.btn} onClick={add}>SAVE RUN DATA</button>
        </div>
      </div>

      <div style={st.card}>
        <SH title="📈 DISTANCE EVOLUTION" right={<span style={{fontSize:10,color:T.muted,fontFamily:T.font}}>{runs.length} LOGS</span>}/>
        {runs.length<2?<Placeholder msg="NEED MORE DATA FOR TELEMETRY" T={T}/>:(
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={runs} margin={{top:10,right:10,bottom:0,left:-22}}>
              <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
              <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fill:T.muted,fontSize:10,fontFamily:T.font}}/>
              <Tooltip content={tip}/>
              <Line type="linear" dataKey="km" stroke={T.accent} strokeWidth={2} dot={{fill:T.card,stroke:T.accent,strokeWidth:2,r:4}} activeDot={{r:6,fill:T.accent}} name="KM"/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={st.card}>
        <SH title="📋 LOG HISTORY" />
        {runs.length===0?<Placeholder msg="[EMPTY LOG]" T={T}/>:(
          <div style={{ maxHeight:250, overflowY:"auto", paddingRight:10 }}>
            {[...runs].reverse().map(r=>editId===r.id?(
              <div key={r.id} style={{marginBottom:8}}>
                <EditRow fields={[{k:"date",l:"Date",t:"date"},{k:"km",l:"KM",t:"number",step:"0.1"},{k:"time",l:"Time"},{k:"shoe",l:"Shoe"},{k:"lpm",l:"HR",t:"number"},{k:"ppm",l:"Cad",t:"number"}]}
                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
              </div>
            ):(
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", padding:"12px 10px", borderBottom:`1px solid ${T.border}`, fontSize:11, alignItems:"center", background:r.date===activeDate?T.accentDim:"transparent", fontFamily:T.font }}>
                <span style={{color:T.text,minWidth:45}}>{r.date.slice(5)}</span>
                <span style={{color:T.accent,fontWeight:700,fontSize:13}}>{r.km} KM</span>
                <span style={{color:T.muted}}>{r.time}</span>
                <span style={{color:T.teal,fontWeight:700}}>{r.pace}</span>
                <span style={{color:T.purple}}>{r.shoe?.toUpperCase()||"—"}</span>
                <span style={{color:T.muted}}>{r.lpm?`${r.lpm} HR`:"—"}</span>
                <span style={{color:T.muted}}>{r.ppm?`${r.ppm} CAD`:"—"}</span>
                <div style={{display:"flex",gap:4}}>
                  <button style={st.icon(T.accent)} onClick={()=>{setEId(r.id);setER({date:r.date,km:r.km,time:r.time,shoe:r.shoe||"",lpm:r.lpm||"",ppm:r.ppm||""});}}>✏️</button>
                  <button style={st.icon(T.red)} onClick={()=>setRuns(p=>p.filter(x=>x.id!==r.id))}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: BIOMETRÍA
// ─────────────────────────────────────────────────────────────────────────────
const VISCERAL_OPTIONS = Array.from({length: 15}, (_, i) => String(i + 1));

function Biometria({ bios, setBios, activeDate, T }) {
  const st=mkS(T);
  const [form,setForm]=useState({ date:activeDate,height:"",weight:"",fat:"",muscle:"",visceral:"",water:"",protein:"",dmr:"",imc:"" });
  const [editId,setEId]=useState(null), [editRow,setER]=useState({});
  
  useEffect(() => { setForm(p => ({ ...p, date: activeDate })); }, [activeDate]);

  const tip=p=><ChartTip {...p} T={T}/>;
  const last=bios[bios.length-1], first=bios[0];
  const delta=last&&first?(last.weight-first.weight).toFixed(1):null;
  const trend=bios.map(b=>({ date:b.date, Peso:b.weight, Grasa:b.fat, Músculo:b.muscle, Agua:b.water }));
  
  const add=()=>{ if(!form.weight) return;
    const finalImc = form.imc ? +form.imc : ((form.height&&form.weight) ? calcIMC(+form.weight,+form.height) : null);
    setBios(p=>[...p,{ ...form, id:uid(), weight:+form.weight, fat:+form.fat||null, muscle:+form.muscle||null,
      visceral:+form.visceral||null, water:+form.water||null, protein:+form.protein||null, dmr:+form.dmr||null,
      imc:finalImc }]);
    setForm(p=>({date:activeDate,height:p.height,weight:"",fat:"",muscle:"",visceral:"",water:"",protein:"",dmr:"",imc:""})); 
  };
  const saveEd=()=>{ setBios(p=>p.map(b=>b.id===editId?{...b,...editRow,weight:+editRow.weight,fat:+editRow.fat||null,muscle:+editRow.muscle||null,visceral:+editRow.visceral||null,water:+editRow.water||null,protein:+editRow.protein||null,dmr:+editRow.dmr||null,imc:+editRow.imc||(editRow.height?calcIMC(+editRow.weight,+editRow.height):b.imc)}:b)); setEId(null); };

  const autoImc = (form.height && form.weight) ? calcIMC(+form.weight, +form.height) : "";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={st.g2}>
        <div style={st.card}>
          <SH title="⚖️ INPUT TELEMETRY"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            <div><span style={st.lbl}>DATE</span><input style={st.inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div><span style={st.lbl}>HEIGHT (CM)</span><input style={st.inp} type="number" placeholder="" value={form.height} onChange={e=>setForm(p=>({...p,height:e.target.value}))}/></div>
            {[["WEIGHT (KG) *","weight",T.accent],["FAT %","fat",T.red],["MUSCLE (KG)","muscle",T.green],["WATER %","water",T.blue],["PROT %","protein",T.purple],["BMR KCAL","dmr",T.muted]].map(([l,k,c])=>(
              <div key={k}><span style={st.lbl}>{l}</span>
                <input style={{...st.inp,borderColor:`${c}55`}} type="number" step="0.1" placeholder="" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div>
              <span style={st.lbl}>BMI (AUTO / MAN)</span>
              <input style={{...st.inp, color:form.imc ? T.text : T.accent, fontWeight:700}} type="number" step="0.1" placeholder={autoImc || "Auto..."} value={form.imc} onChange={e=>setForm(p=>({...p,imc:e.target.value}))}/>
            </div>
          </div>
          
          <div style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:6, padding:"16px 12px", marginBottom:16, display:"flex", justifyContent:"center" }}>
            <NumberPicker value={form.visceral} onChange={v=>setForm(p=>({...p,visceral:v}))} options={VISCERAL_OPTIONS} label="VISCERAL LEVEL" T={T}/>
          </div>

          <button style={st.btn} onClick={add}>SAVE BIO DATA</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {last&&(
            <div style={st.card}>
              <SH title={`📊 LAST READING · ${last.date.slice(5)}`}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))", gap:8 }}>
                {[{l:"WGT",v:`${last.weight}KG`,c:T.accent},{l:"BMI",v:last.imc??"—",c:last.imc?(last.imc<25?T.green:last.imc<30?T.accent:T.red):T.muted},{l:"FAT",v:last.fat?`${last.fat}%`:"—",c:T.red},{l:"MUSC",v:last.muscle?`${last.muscle}KG`:"—",c:T.green},{l:"VISC",v:last.visceral?`LV${last.visceral}`:"—",c:last.visceral?(last.visceral<=9?T.green:last.visceral<=14?T.accent:T.red):T.muted},{l:"H2O",v:last.water?`${last.water}%`:"—",c:T.blue},{l:"PROT",v:last.protein?`${last.protein}%`:"—",c:T.purple},{l:"BMR",v:last.dmr||"—",c:T.orange},{l:"ΔWGT",v:delta?`${delta>0?"+":""}${delta}KG`:"—",c:delta?(parseFloat(delta)<=0?T.green:T.red):T.muted}].map(m=>(
                  <div key={m.l} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:6,padding:"10px 4px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.muted,fontWeight:700,fontFamily:T.font}}>{m.l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:m.c,marginTop:4,fontFamily:T.font}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{...st.card,flex:1}}>
            <SH title="📈 METRIC TRENDS"/>
            {bios.length<2?<Placeholder msg="NEED 2+ RECORDS" T={T}/>:(
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{top:10,right:10,bottom:0,left:-22}}>
                  <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10,fontFamily:T.font}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fill:T.muted,fontSize:10,fontFamily:T.font}} domain={["auto","auto"]}/>
                  <Tooltip content={tip}/>
                  <Line type="linear" dataKey="Peso"    stroke={T.accent} strokeWidth={2} dot={{r:3,fill:T.card,stroke:T.accent,strokeWidth:2}} activeDot={{r:6}}/>
                  <Line type="linear" dataKey="Grasa"   stroke={T.red}    strokeWidth={2} dot={{r:3,fill:T.card,stroke:T.red,strokeWidth:2}}/>
                  <Line type="linear" dataKey="Músculo" stroke={T.green}  strokeWidth={2} dot={{r:3,fill:T.card,stroke:T.green,strokeWidth:2}}/>
                  <Line type="linear" dataKey="Agua"    stroke={T.blue}   strokeWidth={2} dot={{r:3,fill:T.card,stroke:T.blue,strokeWidth:2}}/>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      {bios.length>0&&(
        <div style={{...st.card,overflowX:"auto"}}>
          <SH title="📋 LOG HISTORY" right={<span style={{fontSize:10,color:T.muted,fontFamily:T.font}}>{bios.length} RECORDS</span>}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:700, fontFamily:T.font }}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`, background:T.card2}}>
              {["DATE","WEIGHT","BMI","FAT %","MUSC","VISC","WATER","PROT","BMR",""].map(h=>(
                <th key={h} style={{padding:"10px 8px",color:T.muted,fontWeight:700,textAlign:h===""?"center":"right",letterSpacing:"0.1em"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{[...bios].reverse().map(b=>editId===b.id?(
              <tr key={b.id}><td colSpan={10} style={{padding:"8px 0"}}>
                <EditRow fields={[{k:"date",l:"Date",t:"date"},{k:"weight",l:"Kg",t:"number",step:"0.1"},{k:"imc",l:"BMI",t:"number",step:"0.1"},{k:"fat",l:"Fat%",t:"number",step:"0.1"},{k:"muscle",l:"Musc",t:"number",step:"0.1"},{k:"visceral",l:"Visc",t:"number"},{k:"water",l:"H2o%",t:"number",step:"0.1"},{k:"protein",l:"Prot%",t:"number",step:"0.1"},{k:"dmr",l:"BMR",t:"number"}]}
                  vals={editRow} onChange={(k,v)=>setER(p=>({...p,[k]:v}))} onSave={saveEd} onCancel={()=>setEId(null)} T={T}/>
              </td></tr>
            ):(
              <tr key={b.id} style={{borderBottom:`1px solid ${T.border}`,background:b.date===activeDate?T.accentDim:"transparent"}}>
                {[b.date.slice(5),`${b.weight}KG`,b.imc??"—",b.fat?`${b.fat}%`:"—",b.muscle?`${b.muscle}KG`:"—",b.visceral?`LV${b.visceral}`:"—",b.water?`${b.water}%`:"—",b.protein?`${b.protein}%`:"—",b.dmr||"—"].map((v,i)=>(
                  <td key={i} style={{padding:"12px 8px",textAlign:i===0?"left":"right",color:i===0?T.text:T.muted,fontWeight:i===0?700:400}}>{v}</td>
                ))}
                <td style={{padding:"12px 8px",textAlign:"center"}}>
                  <button style={st.icon(T.accent)} onClick={()=>{setEId(b.id);setER({date:b.date,weight:b.weight,imc:b.imc||"",fat:b.fat||"",muscle:b.muscle||"",visceral:b.visceral||"",water:b.water||"",protein:b.protein||"",dmr:b.dmr||""});}}>✏️</button>
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
// TAB: SUEÑO 
// ─────────────────────────────────────────────────────────────────────────────
function Sueno({ healthLog, T }) {
  const st = mkS(T);
  const tip = p => <ChartTip {...p} T={T} />;
  const [filterType, setFilterType] = useState("week"); // "week", "month", "year"
  
  const sleepData = useMemo(() => {
    return healthLog.filter(d => d.sleep > 0 || d.score > 0 || d.recovery > 0).sort((a, b) => a.date.localeCompare(b.date));
  }, [healthLog]);

  const { grouped, groupKeys } = useMemo(() => {
    const groups = {};
    sleepData.forEach(d => {
      let key;
      if (filterType === "week") key = getWeekStart(d.date);
      else if (filterType === "month") key = getMonthKey(d.date);
      else key = d.date.substring(0, 4);

      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return { grouped: groups, groupKeys: Object.keys(groups).sort().reverse() };
  }, [sleepData, filterType]);

  const [selKey, setSelKey] = useState("");
  
  useEffect(() => {
    if (groupKeys.length > 0 && !grouped[selKey]) {
      setSelKey(groupKeys[0]);
    }
  }, [groupKeys, grouped, selKey]);

  const currentData = grouped[selKey] || [];
  const lastNight = sleepData[sleepData.length - 1];

  const calcAvg = (arr, key) => {
    const valid = arr.filter(x => x[key] > 0);
    return valid.length ? valid.reduce((s,x)=>s+x[key], 0) / valid.length : 0;
  };

  const avgSleep = calcAvg(currentData, 'sleep');
  const avgScore = calcAvg(currentData, 'score');
  const avgRec = calcAvg(currentData, 'recovery');

  const scCol = s => s >= 85 ? T.green : s >= 70 ? T.accent : T.red;

  const formatPeriod = (k, type) => {
    if (type === "week") return fmtWeek(k);
    if (type === "month") return fmtMonth(k).toUpperCase();
    return k;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {lastNight && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: T.card2, borderRadius: 8, padding: "16px 20px", border: `1px solid ${T.border}` }}>
          <MiniRing pct={lastNight.score/100} color={scCol(lastNight.score)} size={46} sw={4}/>
          <div>
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.15em", fontFamily:T.font }}>SLEEP PERFORMANCE (LAST)</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 4, fontFamily:T.font }}>
              SCORE: <span style={{ color: scCol(lastNight.score) }}>{lastNight.score}%</span> • {fmt(lastNight.sleep, 1)} HRS
            </div>
          </div>
        </div>
      )}

      {sleepData.length === 0 ? (
        <div style={st.card}>
          <Placeholder msg="NO SLEEP TELEMETRY FOUND" T={T} />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            {["week", "month", "year"].map(type => (
              <button key={type} onClick={() => { setFilterType(type); setSelKey(""); }}
                style={{
                  background: filterType === type ? T.accent : T.card2,
                  color: filterType === type ? "#000" : T.muted,
                  border: `1px solid ${filterType === type ? T.accent : T.border}`,
                  borderRadius: 6, padding: "6px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily:T.font, textTransform:"uppercase", transition: "all 0.2s"
                }}>
                {type}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
            <div style={{ ...st.card, flex: 1, minWidth: 260 }}>
              <SH title={`🗓 PERIOD SELECTOR`} />
              <select style={st.sel} value={selKey} onChange={e => setSelKey(e.target.value)}>
                {groupKeys.map(k => <option key={k} value={k}>{formatPeriod(k, filterType)}</option>)}
              </select>
            </div>
            
            <div style={{ ...st.card, flex: 2, minWidth: 260, display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.1em", fontFamily:T.font }}>AVG HOURS</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: avgSleep >= 7 ? T.green : avgSleep >= 6 ? T.accent : T.red, lineHeight: 1, marginTop: 6, fontFamily:T.font }}>
                  {avgSleep ? `${fmt(avgSleep, 1)}h` : "—"}
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.1em", fontFamily:T.font }}>AVG SCORE</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: avgScore >= 85 ? T.green : avgScore >= 70 ? T.accent : T.red, lineHeight: 1, marginTop: 6, fontFamily:T.font }}>
                  {avgScore ? `${Math.round(avgScore)}%` : "—"}
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.1em", fontFamily:T.font }}>AVG REC</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: getRecoveryColor(avgRec, T), lineHeight: 1, marginTop: 6, fontFamily:T.font }}>
                  {avgRec ? `${Math.round(avgRec)}%` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div style={st.g2}>
            <div style={st.card}>
              <SH title="⏱️ HOURS (TGT: 8H)" />
              {currentData.length < 2 ? <Placeholder msg="INSUFFICIENT DATA" T={T} /> : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={currentData} margin={{ top: 20, right: 15, bottom: 10, left: -15 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} domain={[4, 10]} />
                    <Tooltip content={tip} />
                    <ReferenceLine y={8} stroke={T.green} strokeDasharray="3 3" />
                    <Line type="step" dataKey="sleep" stroke={T.blue} strokeWidth={2} dot={{ fill: T.card, stroke: T.blue, strokeWidth: 2, r: 4 }} activeDot={{r:6,fill:T.blue}} name="Horas" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={st.card}>
              <SH title="🔋 SCORE (TGT: 85%)" />
              {currentData.length < 2 ? <Placeholder msg="INSUFFICIENT DATA" T={T} /> : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={currentData} margin={{ top: 20, right: 15, bottom: 10, left: -15 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.purple} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={T.purple} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} domain={[40, 100]} />
                    <Tooltip content={tip} />
                    <ReferenceLine y={85} stroke={T.green} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="score" stroke={T.purple} fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: T.card, stroke: T.purple, strokeWidth: 2, r: 4 }} activeDot={{r:6,fill:T.purple}} name="Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ ...st.card, gridColumn: "1 / -1" }}>
              <SH title="🔥 RECOVERY TREND" />
              {currentData.filter(d=>d.recovery>0).length < 2 ? <Placeholder msg="INSUFFICIENT DATA" T={T} /> : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={currentData.filter(d=>d.recovery>0)} margin={{ top: 20, right: 15, bottom: 10, left: -15 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: T.muted, fontSize: 14, fontWeight: 700, fontFamily:T.font }} domain={[0, 100]} />
                    <Tooltip content={tip} />
                    <Line type="linear" dataKey="recovery" stroke={T.green} strokeWidth={2} dot={{ fill: T.card, stroke: T.green, strokeWidth: 2, r: 4 }} activeDot={{r:6,fill:T.green}} name="Recovery %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(()=>{
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500;700&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
    return()=>{try{document.head.removeChild(l);}catch(_){}};
  },[]);

  // Siempre se fuerza el modo dark porque es el estándar para telemetría
  const [isDark,setDark]=useState(()=>lsGet("dark",true));
  const T=isDark?DARK:LIGHT;

  const [activeDate, setActiveDate] = useState(TODAY);

  const [tab,      setTab]  =useState("dashboard");
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

  useEffect(()=>{lsSet("dark",isDark);},[isDark]);
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
        if(d.projects&&typeof d.projects==="object")  setProjs(d.projects);
        if(typeof d.runGoal==="number")               setRunGoal(d.runGoal);
        if(typeof d.targetTime==="string")            setTargetTime(d.targetTime);
        alert("✅ Importación exitosa");
      } catch(err){alert("❌ JSON inválido: "+err.message);}
    };
    reader.readAsText(file); e.target.value="";
  },[]);

  const exportJSON=useCallback(()=>{
    const data={healthLog,foodLog,nutritionDB:db,strengthLog:strLog,runs,biometrics:bios,shoes,goals,program,weeklyPlans:plans,projects,runGoal,targetTime,exportedAt:new Date().toISOString()};
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    a.download=`aristeia_v7_${TODAY}.json`; a.click();
  },[healthLog,foodLog,db,strLog,runs,bios,shoes,goals,program,plans,projects,runGoal,targetTime]);

  const getDayData=useCallback((date)=>{
    const h=healthLog.find(d=>d.date===date)||{};
    const fs=foodLog.filter(f=>f.date===date), hasF=fs.length>0;
    const calIn=hasF?fs.reduce((s,f)=>s+f.cal,0):(h.calIn||0);
    const p=hasF?r1(fs.reduce((s,f)=>s+f.p,0)):(h.p||0);
    const c=hasF?r1(fs.reduce((s,f)=>s+f.c,0)):(h.c||0);
    const g=hasF?r1(fs.reduce((s,f)=>s+f.g,0)):(h.g||0);
    return{date,calOut:h.calOut||0,calIn,p,c,g,sleep:h.sleep||null,score:h.score||null,hrv:h.hrv||null,rhr:h.rhr||null,recovery:h.recovery||null,steps:h.steps||null,balance:calIn-(h.calOut||0),goals:h.goals||{...DEFAULT_GOALS}};
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
    {id:"dashboard",l:"SYS DASHBOARD"},
    {id:"calendario",l:"CALENDAR"},
    {id:"dailylog",l:"INPUT LOG"},
    {id:"nutricion",l:"FUEL"},
    {id:"fuerza",l:"CHASSIS"},
    {id:"running",l:"AERO"},
    {id:"bio",l:"WEIGHT"},
    {id:"sleep",l:"RECOVERY"},
  ];

  const bCol=b=>b<0?T.green:b<300?T.accent:T.red;
  const currentHour=new Date().getHours();
  const greeting=currentHour<12?"MORNING":currentHour<18?"AFTERNOON":"EVENING";
  const rawDate = new Date(activeDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

  return (
    <div style={{
      background:T.bg, minHeight:"100vh", position: "relative", overflow: "hidden",
      fontFamily:T.font,
      color:T.text, padding:"16px 18px",
      transition:"background 0.3s,color 0.3s"
    }}>
      <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:14, position:"relative", zIndex:1 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:"0.1em", lineHeight:1.1, color:T.text }}>
            {greeting}, <span style={{color:T.accent}}>RAFA</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ 
              position: "relative", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", 
              background: T.card, padding: "6px 12px", borderRadius: 4, border: `1px solid ${T.border}`,
              transition: "all 0.15s"
            }}>
              <span style={{ fontSize:12, color:T.text, fontWeight:700, letterSpacing:"0.1em" }}>{rawDate}</span>
              <span style={{ fontSize:9, color:T.accent }}>▼</span>
              <input 
                type="date" 
                value={activeDate} 
                max={TODAY} 
                onChange={(e) => setActiveDate(e.target.value)} 
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
            </div>

            {activeDate !== TODAY && (
              <button onClick={() => setActiveDate(TODAY)} style={{ background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 4, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily:T.font }}>
                ↺ LIVE
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {activeDayData.calIn>0&&<div style={{ background:T.card, borderRadius:4, padding:"6px 12px", fontSize:11, color:T.accent, fontWeight:700, border:`1px solid ${T.border}`, fontFamily:T.font }}>{activeDayData.calIn} IN</div>}
          {activeDayData.calOut>0&&<div style={{ background:T.card, borderRadius:4, padding:"6px 12px", fontSize:11, fontWeight:700, color:bCol(activeDayData.balance), border:`1px solid ${T.border}`, fontFamily:T.font }}>{activeDayData.balance>0?"+":""}{activeDayData.balance} BAL</div>}
          <button onClick={()=>importRef.current?.click()} style={{ background:T.card, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:"6px 12px", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:T.font }}>↑ IMP</button>
          <button onClick={exportJSON} style={{ background:T.card, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:"6px 12px", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:T.font }}>↓ EXP</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap", position:"relative", zIndex:1 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?T.accentDim:"transparent",
            color:tab===t.id?T.accent:T.muted,
            border:`1px solid ${tab===t.id?T.accent:T.border}`,
            borderRadius:4, padding:"8px 16px", fontWeight:700, fontSize:11,
            cursor:"pointer", transition:"all 0.2s", fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.1em"
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ position:"relative", zIndex:1 }}>
        {tab==="dashboard"  && <Dashboard activeDayData={activeDayData} weekData={weekData} last7={last7} goals={goals} program={program} plans={plans} setPlans={setPlans} setTab={setTab} activeDate={activeDate} isDark={isDark} T={T}/>}
        {tab==="calendario" && <Calendario allDayData={allDayData} bios={bios} activeDate={activeDate} setActiveDate={setActiveDate} isDark={isDark} T={T}/>}
        {tab==="dailylog"   && <DailyLog  allDayData={allDayData} setHL={setHL} goals={goals} setGoals={setGoals} projects={projects} setProjects={setProjs} activeDate={activeDate} T={T}/>}
        {tab==="nutricion"  && <Nutricion activeDayData={activeDayData} activeFood={activeFood} activeDate={activeDate} setFL={setFL} db={db} setDb={setDb} goals={goals} T={T}/>}
        {tab==="fuerza"     && <Fuerza    strLog={strLog} setStr={setStr} program={program} setProg={setProg} plans={plans} setPlans={setPlans} activeDate={activeDate} T={T}/>}
        {tab==="running"    && <Running   runs={runs} setRuns={setRuns} runGoal={runGoal} setRunGoal={setRunGoal} targetTime={targetTime} setTargetTime={setTargetTime} shoes={shoes} setShoes={setShoes} activeDate={activeDate} isDark={isDark} T={T}/>}
        {tab==="bio"        && <Biometria bios={bios} setBios={setBios} activeDate={activeDate} T={T}/>}
        {tab==="sleep"      && <Sueno     healthLog={healthLog} T={T}/>}
      </div>
    </div>
  );
}