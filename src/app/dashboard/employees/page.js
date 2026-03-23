"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sideBar";
import { userService } from "@/services/userService";
import { FiPlus, FiX, FiUsers, FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";

const ROLE_LABELS = { 0: "Administrador", 1: "Empleado" };
const TYPE_LABELS = { 0: "Panadero", 1: "Vendedor", 2: "Vendedor Vehículo" };
const ROLE_STYLES = {
  0: "bg-blue-50 text-blue-600 border border-blue-200",
  1: "bg-gray-50 text-gray-600 border border-gray-200",
};
const TYPE_STYLES = {
  0: "bg-orange-50 text-orange-600 border border-orange-200",
  1: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  2: "bg-purple-50 text-purple-600 border border-purple-200",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: 1, type: 0 };

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function EmployeesPage() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
const router = useRouter();
  useEffect(() => { fetchUsers(); }, []);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                   e.name = "El nombre es requerido";
    if (!form.email.trim())                  e.email = "El email es requerido";
    if (!form.password || form.password < 6) e.password = "Mínimo 6 caracteres";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      setSaving(true);
      await userService.create({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        role:     Number(form.role),
        type:     Number(form.type),
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || String(u.type) === typeFilter;
    return matchSearch && matchType;
  });

  const inputClass = (field) =>
    `px-4 py-2.5 rounded-xl border text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition
    ${errors[field] ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`;

  const TYPE_FILTERS = [
    { value: "all", label: "Todos" },
    { value: "0",   label: "Panaderos" },
    { value: "1",   label: "Vendedores" },
    { value: "2",   label: "Vendedores Vehículo" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Empleados</h1>
            <p className="text-xs text-gray-400 mt-0.5">Administrá los usuarios del sistema</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
          >
            <FiPlus />
            Nuevo Empleado
          </button>
        </header>

        {/* Search + filters */}
        <div className="flex items-center gap-3 px-8 py-4 bg-white border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-blue-500 placeholder:text-gray-300 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-gray-50 transition"
            />
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                  ${typeFilter === f.value
                    ? "bg-[#1447E6] text-white border-[#1447E6]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Nombre", "Rol", "Tipo", "Fecha de Creación"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-16 text-gray-400 text-sm">Cargando...</td></tr>
                ) : error ? (
                  <tr><td colSpan={4} className="text-center py-16 text-red-400 text-sm">{error}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <FiUsers className="text-5xl mb-3" />
                        <p className="text-sm font-medium text-gray-400">Sin resultados</p>
                        <p className="text-xs text-gray-300 mt-1">Intentá con otro filtro o nombre</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} 
                    onClick={() => router.push(`/dashboard/employees/${user.id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {user.name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold text-gray-700">{user.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_STYLES[user.role] ?? "bg-gray-50 text-gray-500"}`}>
                          {ROLE_LABELS[user.role] ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_STYLES[user.type] ?? "bg-gray-50 text-gray-500"}`}>
                          {TYPE_LABELS[user.type] ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString("es-CR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Nuevo Empleado</h2>
              <button onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); setErrors({}); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <FiX />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <Field label="Nombre completo *" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={inputClass("name")}
                />
              </Field>

              <Field label="Email *" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={inputClass("email")}
                />
              </Field>

              <Field label="Contraseña *" error={errors.password}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={inputClass("password")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Rol">
                  <select
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white"
                  >
                    <option value={1}>Empleado</option>
                    <option value={0}>Administrador</option>
                  </select>
                </Field>

                <Field label="Tipo">
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white"
                  >
                    <option value={0}>Panadero</option>
                    <option value={1}>Vendedor</option>
                    <option value={2}>Vendedor Vehículo</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); setErrors({}); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1447E6] text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-200 active:scale-95"
              >
                {saving ? "Creando..." : "Crear Empleado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}