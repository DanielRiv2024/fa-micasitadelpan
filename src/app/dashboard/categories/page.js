"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sideBar";
import { categoryService } from "@/services/categoryService";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTag } from "react-icons/fi";

const EMPTY_FORM = { name: "", description: "", seller_profit: "" };

export default function CategoriesPage() {
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null); // null = crear, objeto = editar
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---------- fetch ---------- */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  /* ---------- modal helpers ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? "", seller_profit: cat.seller_profit });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        seller_profit: Number(form.seller_profit) || 0,
      };
      if (editing) {
        const updated = await categoryService.update(editing.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await categoryService.create(payload);
        setCategories((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoryService.remove(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);

  /* ---------- render ---------- */
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Categorías</h1>
            <p className="text-xs text-gray-400 mt-0.5">Administrá las categorías de productos</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
          >
            <FiPlus className="text-base" />
            Nueva Categoría
          </button>
        </header>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Nombre", "Descripción", "Ganancia Vendedor % ", "Acciones"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">Cargando...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-red-400 text-sm">{error}</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <FiTag className="text-5xl mb-3" />
                        <p className="text-sm font-medium text-gray-400">Sin categorías aún</p>
                        <p className="text-xs text-gray-300 mt-1">Creá la primera con el botón de arriba</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-700">{cat.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{cat.description || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-emerald-600 font-semibold">{cat.seller_profit}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1447E6] transition"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ---- Edit / Create Modal ---- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {editing ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <FiX />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Bebidas"
                  className="text-blue-500 mt-1.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción opcional..."
                  rows={3}
                  className="text-blue-500 mt-1.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ganancia Vendedor %</label>
                <input
                  type="number"
                  value={form.seller_profit}
                  onChange={(e) => setForm({ ...form, seller_profit: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="text-blue-500 mt-1.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1447E6] text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 active:scale-95"
              >
                {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Categoría"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirm Modal ---- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-2">¿Eliminar categoría?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Estás por eliminar <span className="font-semibold text-gray-700">"{deleteTarget.name}"</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}