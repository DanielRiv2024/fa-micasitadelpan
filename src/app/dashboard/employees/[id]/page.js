"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/sideBar";
import { FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";
import { FiUsers } from "react-icons/fi";

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

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function EditInput({ value, onChange, type = "text", placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white"
    />
  );
}

export default function EmployeeDetailPage() {
  const router    = useRouter();
  const { id }    = useParams();

  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm]             = useState({});

 useEffect(() => {
  fetch(`/api/users/${id}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      setUser(data);
      setForm({ name: data.name, role: data.role, type: data.type });
    })
    .catch((e) => {
      console.error("Error cargando usuario:", e);
    })
    .finally(() => setLoading(false));
}, [id]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

const handleSave = async () => {
  try {
    setSaving(true);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        role: Number(form.role),
        type: Number(form.type),
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const updated = { ...user, ...data };
    setUser(updated);
    setForm({ name: updated.name, role: updated.role, type: updated.type });
    setEditing(false);
  } catch (e) {
    alert(e.message);
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/dashboard/employees");
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setForm({ name: user.name, role: user.role, type: user.type });
    setEditing(false);
  };

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando...</main>
    </div>
  );

  if (!user) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">Empleado no encontrado.</main>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                {editing ? "Editando empleado" : user.name}
              </h1>
              <p className="text-xs text-blue-500 mt-0.5">
                {editing ? "Modificá los campos y guardá los cambios" : "Detalle del empleado"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                  <FiX /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1447E6] text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-200 active:scale-95"
                >
                  <FiSave />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  <FiEdit2 /> Editar
                </button>
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition">
                  <FiTrash2 /> Eliminar
                </button>
              </>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">

            {/* Avatar + info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{user.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_STYLES[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_STYLES[user.type]}`}>
                    {TYPE_LABELS[user.type]}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit form / Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <p className="text-sm font-bold text-blue-500">Información del Empleado</p>

              {editing ? (
                <>
                  <Field label="Nombre completo">
                    <EditInput
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Nombre completo"
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
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Nombre</p>
                    <p className="text-sm font-semibold text-gray-700">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Rol</p>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_STYLES[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tipo</p>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_STYLES[user.type]}`}>
                      {TYPE_LABELS[user.type]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Miembro desde</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString("es-CR", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-2">¿Eliminar empleado?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Estás por eliminar a <span className="font-semibold text-gray-700">"{user.name}"</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition active:scale-95"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}