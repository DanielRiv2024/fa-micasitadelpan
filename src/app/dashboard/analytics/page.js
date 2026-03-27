"use client";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/sideBar";
import {
  FiTrendingUp, FiClock, FiDollarSign, FiUsers,
  FiChevronLeft, FiChevronRight, FiBarChart2,
  FiArrowUp, FiArrowDown, FiMinus
} from "react-icons/fi";
import { supabase } from "@/app/lib/supabase";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────
const BRANCH_LABELS = { 0: "Alajuela", 1: "Desamparados" };
const COLORS_EMP = [
  "#3b82f6","#10b981","#8b5cf6","#f97316",
  "#f43f5e","#06b6d4","#f59e0b","#ec4899",
];

const fmt = (n, decimals = 0) =>
  Number(n ?? 0).toLocaleString("es-CR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const fmtCRC = (n) => `₡${fmt(n, 0)}`;

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const toDateStr = (d) => d.toISOString().split("T")[0];

const diffHours = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh + em / 60) - (sh + sm / 60));
};

const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ─── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, delta, color = "blue" }) {
  const colors = {
    blue:   { ring: "ring-blue-100",   bg: "bg-blue-50",   icon: "text-[#1447E6]",   badge: "bg-blue-100 text-blue-700" },
    green:  { ring: "ring-emerald-100",bg: "bg-emerald-50",icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
    violet: { ring: "ring-violet-100", bg: "bg-violet-50", icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700" },
    amber:  { ring: "ring-amber-100",  bg: "bg-amber-50",  icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700" },
  };
  const c = colors[color];
  const DeltaIcon = delta > 0 ? FiArrowUp : delta < 0 ? FiArrowDown : FiMinus;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ring-1 ${c.ring} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`text-lg ${c.icon}`} />
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            delta > 0 ? "bg-emerald-50 text-emerald-600" :
            delta < 0 ? "bg-red-50 text-red-500" :
            "bg-gray-100 text-gray-400"
          }`}>
            <DeltaIcon className="text-[10px]" />
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
      {sub && <p className="text-xs text-blue-500 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{prefix}{fmt(p.value, prefix ? 0 : 1)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-bold text-gray-700 tracking-tight">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(getWeekStart(today));
  const [branch, setBranch]       = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers]         = useState([]);
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }), [weekStart]);

  const weekLabel = () => {
    const from = weekDays[0].toLocaleDateString("es-CR", { day: "numeric", month: "short" });
    const to   = weekDays[6].toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
    return `${from} — ${to}`;
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchData(); }, [weekStart, branch]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("id, name, hourly_rate");
    setUsers(data ?? []);
  };

  const fetchData = async () => {
    setLoading(true);
    const from = toDateStr(weekDays[0]);
    const to   = toDateStr(weekDays[6]);

    const [{ data: schData }, { data: salesData }] = await Promise.all([
      supabase
        .from("schedules")
        .select("*, users(name)")
        .gte("date", from)
        .lte("date", to)
        .eq("branch", branch),
      supabase
        .from("sales")
        .select("*, sale_items(quantity, price_snapshot, total, products(name))")
        .gte("sale_date", from)
        .lte("sale_date", to),
    ]);

    setSchedules(schData ?? []);
    setSales(salesData ?? []);
    setLoading(false);
  };

  // ── derived data ────────────────────────────────────────────────────────
  const employeeStats = useMemo(() => {
    return users.map((u, i) => {
      const mySchedules = schedules.filter((s) => s.user_id === u.id);
      const totalHours  = mySchedules.reduce((acc, s) => acc + diffHours(s.start_time?.slice(0,5), s.end_time?.slice(0,5)), 0);
      const daysWorked  = mySchedules.length;
      const hourlyRate  = u.hourly_rate ?? 0;
      const laborCost   = totalHours * hourlyRate;
      return { ...u, totalHours, daysWorked, laborCost, color: COLORS_EMP[i % COLORS_EMP.length] };
    }).filter(e => e.totalHours > 0 || e.daysWorked > 0);
  }, [users, schedules]);

  const totals = useMemo(() => {
    const totalHours   = employeeStats.reduce((a, e) => a + e.totalHours, 0);
    const totalCost    = employeeStats.reduce((a, e) => a + e.laborCost, 0);
    const totalSales   = sales.reduce((a, s) => a + (s.total ?? 0), 0);
    const activeEmployees = employeeStats.filter(e => e.daysWorked > 0).length;
    return { totalHours, totalCost, totalSales, activeEmployees };
  }, [employeeStats, sales]);

  // Hours per day (bar chart)
  const hoursPerDay = useMemo(() => weekDays.map((d, i) => {
    const ds = toDateStr(d);
    const daySchedules = schedules.filter(s => s.date === ds);
    const hours = daySchedules.reduce((a, s) => a + diffHours(s.start_time?.slice(0,5), s.end_time?.slice(0,5)), 0);
    return { name: DAYS_SHORT[d.getDay()], hours: parseFloat(hours.toFixed(1)) };
  }), [weekDays, schedules]);

  // Sales per day (line chart)
  const salesPerDay = useMemo(() => weekDays.map((d) => {
    const ds = toDateStr(d);
    const daySales = sales.filter(s => (s.sale_date ?? "").startsWith(ds));
    const total = daySales.reduce((a, s) => a + (s.total ?? 0), 0);
    return { name: DAYS_SHORT[d.getDay()], ventas: Math.round(total) };
  }), [weekDays, sales]);

  // Hours per employee (bar chart)
  const hoursPerEmp = useMemo(() =>
    employeeStats.map(e => ({ name: e.name?.split(" ")[0] ?? "—", horas: parseFloat(e.totalHours.toFixed(1)) })),
    [employeeStats]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Analytics</h1>
            <p className="text-xs text-blue-500 mt-0.5">Resumen de horas y costos de nómina</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Branch */}
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">

            {/* Week nav */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2">
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

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                icon={FiUsers}
                label="Empleados activos"
                value={loading ? "—" : totals.activeEmployees}
                color="blue"
              />
              <KpiCard
                icon={FiClock}
                label="Horas totales"
                value={loading ? "—" : `${fmt(totals.totalHours, 1)} h`}
                sub={`${fmt(totals.totalHours / 7, 1)} h/día promedio`}
                color="violet"
              />
              <KpiCard
                icon={FiDollarSign}
                label="Costo de nómina"
                value={loading ? "—" : fmtCRC(totals.totalCost)}
                color="amber"
              />
              <KpiCard
                icon={FiTrendingUp}
                label="Ventas semana"
                value={loading ? "—" : fmtCRC(totals.totalSales)}
                color="green"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Hours per day */}
              <Section title="Horas trabajadas por día">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hoursPerDay} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit=" h" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="hours" name="Horas" fill="#1447E6" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              {/* Sales per day */}
              <Section title="Ventas por día">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip prefix="₡" />} />
                    <Line
                      dataKey="ventas" name="Ventas" stroke="#10b981"
                      strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Hours per employee bar */}
            {hoursPerEmp.length > 0 && (
              <Section title="Horas por empleado esta semana">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={hoursPerEmp} layout="vertical" barSize={18} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit=" h" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="horas" name="Horas" radius={[0,6,6,0]}>
                      {hoursPerEmp.map((_, i) => (
                        <rect key={i} fill={COLORS_EMP[i % COLORS_EMP.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Detail table */}
            <Section title="Detalle por empleado">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-8">Cargando datos...</p>
              ) : employeeStats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin turnos asignados esta semana</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Empleado","Días","Horas totales","Costo estimado"].map(h => (
                          <th key={h} className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide pr-6 last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {employeeStats.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 pr-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: e.color }}
                              >
                                {e.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-700">{e.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-6">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                              {e.daysWorked} día{e.daysWorked !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="py-3 pr-6">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[120px] bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (e.totalHours / Math.max(...employeeStats.map(x => x.totalHours), 1)) * 100)}%`,
                                    background: e.color,
                                  }}
                                />
                              </div>
                              <span className="font-semibold text-gray-700 tabular-nums">
                                {fmt(e.totalHours, 1)} h
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            {e.hourly_rate ? (
                              <span className="font-bold text-gray-800">{fmtCRC(e.laborCost)}</span>
                            ) : (
                              <span className="text-xs text-gray-300 italic">Sin tarifa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot>
                      <tr className="border-t-2 border-gray-100">
                        <td className="pt-4 font-bold text-gray-700 text-sm">Total</td>
                        <td className="pt-4" />
                        <td className="pt-4 font-bold text-gray-800 tabular-nums">{fmt(totals.totalHours, 1)} h</td>
                        <td className="pt-4 text-right font-bold text-[#1447E6] text-sm">{fmtCRC(totals.totalCost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Section>

          </div>
        </div>
      </main>
    </div>
  );
}