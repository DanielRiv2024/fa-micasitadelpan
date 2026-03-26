
"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/sideBar";
import { FiChevronLeft, FiChevronRight, FiX, FiCheck, FiClock, FiSearch, FiUser } from "react-icons/fi";
import { supabase } from "@/app/lib/supabase";

const DAYS_LABEL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const BRANCH_LABELS = { 0: "Alajuela", 1: "Desamparados" };
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const COLORS = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-orange-500",
  "bg-rose-500","bg-cyan-500","bg-amber-500","bg-pink-500",
];
const COLORS_LIGHT = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-violet-100 border-violet-300 text-violet-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-pink-100 border-pink-300 text-pink-800",
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateStr = (date) => date.toISOString().split("T")[0];

export default function SchedulesPage() {
  const today = new Date();
  const [weekStart, setWeekStart]   = useState(getWeekStart(today));
  const [branch, setBranch]         = useState(0);
  const [schedules, setSchedules]   = useState([]);
  const [users, setUsers]           = useState([]);
  const [dayModal, setDayModal]     = useState(null);
  const [employeeForms, setEmployeeForms] = useState({});
  const [saving, setSaving]         = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [filterUser, setFilterUser] = useState(null); // null = todos

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchSchedules(); }, [weekStart, branch]);

  const fetchSchedules = async () => {
    const from = toDateStr(weekDays[0]);
    const to   = toDateStr(weekDays[6]);
    const { data } = await supabase
      .from("schedules")
      .select("*, users(name)")
      .gte("date", from)
      .lte("date", to)
      .eq("branch", branch);
    setSchedules(data ?? []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("id, name");
    setUsers(data ?? []);
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const schedulesForDate = (dateStr) => {
    let s = schedules.filter((s) => s.date === dateStr);
    if (filterUser) s = s.filter((s) => s.user_id === filterUser);
    return s;
  };

  const userColorIdx = (userId) => {
    const idx = users.findIndex((u) => u.id === userId);
    return idx >= 0 ? idx % COLORS.length : 0;
  };

  const openDayModal = (dayIdx) => {
    const dateStr = toDateStr(weekDays[dayIdx]);
    const daySchedules = schedules.filter((s) => s.date === dateStr);
    const forms = {};
    users.forEach((u) => {
      const existing = daySchedules.find((s) => s.user_id === u.id);
      forms[u.id] = {
        enabled:    !!existing,
        start_time: existing?.start_time?.slice(0, 5) ?? "08:00",
        end_time:   existing?.end_time?.slice(0, 5)   ?? "17:00",
        scheduleId: existing?.id ?? null,
      };
    });
    setEmployeeForms(forms);
    setModalSearch("");
    setDayModal(dayIdx);
  };

  const setEmpField = (userId, key, val) =>
    setEmployeeForms((p) => ({ ...p, [userId]: { ...p[userId], [key]: val } }));

  const handleSaveDay = async () => {
    try {
      setSaving(true);
      const dateStr = toDateStr(weekDays[dayModal]);
      for (const user of users) {
        const f = employeeForms[user.id];
        if (!f) continue;
        if (f.enabled) {
          const payload = { user_id: user.id, date: dateStr, start_time: f.start_time, end_time: f.end_time, branch };
          if (f.scheduleId) {
            await supabase.from("schedules").update(payload).eq("id", f.scheduleId);
          } else {
            await supabase.from("schedules").insert([payload]);
          }
        } else if (f.scheduleId) {
          await supabase.from("schedules").delete().eq("id", f.scheduleId);
        }
      }
      await fetchSchedules();
      setDayModal(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const todayStr = toDateStr(today);

  const weekLabel = () => {
    const from = weekDays[0].toLocaleDateString("es-CR", { day: "numeric", month: "short" });
    const to   = weekDays[6].toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
    return `${from} — ${to}`;
  };

  const filteredModalUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const selectedUser = filterUser ? users.find((u) => u.id === filterUser) : null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Horarios</h1>
            <p className="text-xs text-blue-500 mt-0.5">Tocá un día para asignar turnos</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Branch selector */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {[0, 1].map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition
                    ${branch === b ? "bg-[#1447E6] text-white shadow-md shadow-blue-200" : "text-gray-500 hover:bg-gray-200"}`}
                >
                  {BRANCH_LABELS[b]}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
          <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 flex-1 overflow-hidden">

            {/* Week nav + employee filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2 flex-1">
                <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition">
                  <FiChevronLeft />
                </button>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{weekLabel()}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{BRANCH_LABELS[branch]}</p>
                </div>
                <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition">
                  <FiChevronRight />
                </button>
              </div>

              {/* Employee filter dropdown */}
              <div className="relative">
                <select
                  value={filterUser ?? ""}
                  onChange={(e) => setFilterUser(e.target.value || null)}
                  className="appearance-none pl-9 pr-8 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition shadow-sm cursor-pointer min-w-[180px]"
                >
                  <option value="">Todos los empleados</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              </div>
            </div>

            {/* Active filter badge */}
            {filterUser && selectedUser && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-fit ${COLORS_LIGHT[userColorIdx(filterUser)]}`}>
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${COLORS[userColorIdx(filterUser)]}`}>
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold">{selectedUser.name}</span>
                <button onClick={() => setFilterUser(null)} className="ml-1 opacity-60 hover:opacity-100 transition">
                  <FiX className="text-xs" />
                </button>
              </div>
            )}

            {/* Weekly grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">

              {/* Day headers */}
              <div className="grid grid-cols-8 border-b border-gray-100 shrink-0">
                <div className="py-3 px-3 text-xs text-gray-300 font-medium">Hora</div>
                {weekDays.map((d, i) => {
                  const ds = toDateStr(d);
                  const isToday = ds === todayStr;
                  const count = schedulesForDate(ds).length;
                  return (
                    <button
                      key={i}
                      onClick={() => openDayModal(i)}
                      className="py-3 px-2 flex flex-col items-center gap-0.5 border-l border-gray-100 hover:bg-blue-50/50 transition cursor-pointer"
                    >
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">{DAYS_SHORT[d.getDay()]}</span>
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                        ${isToday ? "bg-[#1447E6] text-white" : "text-gray-700"}`}>
                        {d.getDate()}
                      </span>
                      <span className="text-[10px] text-blue-400 font-medium h-3">
                        {count > 0 ? `${count} turno${count > 1 ? "s" : ""}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable time grid */}
              <div className="overflow-y-auto flex-1">
                <div className="flex" style={{ height: `${24 * 48}px` }}>

                  {/* Hour labels */}
                  <div className="flex flex-col shrink-0 w-14 border-r border-gray-100">
                    {HOURS.map((h) => (
                      <div key={h} className="h-12 flex items-start justify-end pr-2 pt-1 shrink-0">
                        <span className="text-[10px] text-gray-300 font-medium">{h}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((d, i) => {
                    const ds = toDateStr(d);
                    const daySchedules = schedulesForDate(ds);
                    return (
                      <div
                        key={i}
                        onClick={() => openDayModal(i)}
                        className="flex-1 relative border-l border-gray-100 cursor-pointer hover:bg-blue-50/20 transition"
                      >
                        {HOURS.map((h) => (
                          <div key={h} className="absolute w-full border-t border-gray-50" style={{ top: h * 48 }} />
                        ))}






{daySchedules.map((s) => {
  const colorIdx = userColorIdx(s.user_id);

  const [sh, sm] = (s.start_time ?? "00:00").split(":").map(Number);
  const [eh, em] = (s.end_time ?? "00:00").split(":").map(Number);

  const start = sh + sm / 60;
  const end   = eh + em / 60;

  const top    = start * 48;
  const height = Math.max((end - start) * 48, 20);

  // 🔥 SOLO agrupar si empiezan exactamente igual
  const sameStart = daySchedules.filter(
    (x) => x.start_time === s.start_time
  );

  const index = sameStart.findIndex((x) => x.id === s.id);
  const total = sameStart.length;

  const width = total > 1 ? 100 / total : 100;
  const left  = total > 1 ? index * width : 0;

  // 🔥 zIndex basado en hora de inicio
  const zIndex = Math.floor(start * 100); 
  // más tarde = más arriba

  return (
    <div
      key={s.id}
      className={`absolute rounded-lg border px-1.5 py-1 overflow-hidden ${COLORS_LIGHT[colorIdx]}`}
      style={{
        top,
        height,
        width: `${width}%`,
        left: `${left}%`,
        zIndex,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-bold truncate leading-tight">
        {s.users?.name ?? "—"}
      </p>
      <p className="text-[9px] opacity-70 leading-tight">
        {fmt12(s.start_time?.slice(0,5))} - {fmt12(s.end_time?.slice(0,5))}
      </p>
    </div>
  );
})}








                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            {users.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 shrink-0">
                {users.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => setFilterUser(filterUser === u.id ? null : u.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition
                      ${filterUser === u.id ? COLORS_LIGHT[i % COLORS_LIGHT.length] : "border-transparent hover:bg-gray-50"}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
                    <span className="text-xs text-gray-500 font-medium">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Day modal */}
      {dayModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {DAYS_LABEL[weekDays[dayModal].getDay()]} {weekDays[dayModal].getDate()} — {BRANCH_LABELS[branch]}
                </h2>
                <p className="text-xs text-blue-500 mt-0.5">Asigná el turno de cada empleado</p>
              </div>
              <button onClick={() => setDayModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <FiX />
              </button>
            </div>

            {/* Search inside modal */}
            <div className="px-6 pt-4 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
              {filteredModalUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
              ) : (
                filteredModalUsers.map((u) => {
                  const i = users.findIndex((x) => x.id === u.id);
                  const f = employeeForms[u.id] ?? {};
                  return (
                    <div key={u.id} className={`rounded-2xl border transition-all ${f.enabled ? COLORS_LIGHT[i % COLORS_LIGHT.length] : "border-gray-100 bg-gray-50"}`}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${COLORS[i % COLORS.length]}`}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{u.name}</span>
                        </div>
                        <button
                          onClick={() => setEmpField(u.id, "enabled", !f.enabled)}
                          className={`w-11 h-6 rounded-full transition-all relative ${f.enabled ? "bg-[#1447E6]" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${f.enabled ? "left-6" : "left-1"}`} />
                        </button>
                      </div>

                      {f.enabled && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-current/10 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Entrada">
                              <input
                                type="time"
                                value={f.start_time}
                                onChange={(e) => setEmpField(u.id, "start_time", e.target.value)}
                                className="px-3 py-2 rounded-xl border border-current/20 bg-white/70 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                              />
                            </Field>
                            <Field label="Salida">
                              <input
                                type="time"
                                value={f.end_time}
                                onChange={(e) => setEmpField(u.id, "end_time", e.target.value)}
                                className="px-3 py-2 rounded-xl border border-current/20 bg-white/70 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                              />
                            </Field>
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-60">
                            <FiClock className="text-[11px]" />
                            {fmt12(f.start_time)} — {fmt12(f.end_time)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button onClick={() => setDayModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveDay}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1447E6] text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-200 active:scale-95"
              >
                <FiCheck />
                {saving ? "Guardando..." : "Guardar Turnos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}