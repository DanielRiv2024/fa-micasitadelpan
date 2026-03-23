// app/admin/products/[id]/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/sideBar";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiSave, FiX, FiPackage
} from "react-icons/fi";

const STATUS_STYLES = {
  active:   "bg-emerald-50 text-emerald-600 border border-emerald-200",
  inactive: "bg-red-50 text-red-500 border border-red-200",
  draft:    "bg-yellow-50 text-yellow-600 border border-yellow-200",
};
const STATUS_LABELS = {
  active: "Activo", inactive: "Inactivo", draft: "Borrador",
};

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function EditInput({ value, onChange, type = "text", placeholder, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white"
      {...props}
    />
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
console.log(id)
  const [product, setProduct]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm]             = useState({});

  useEffect(() => {
    Promise.all([
      productService.getById(id),
      categoryService.getAll(),
    ]).then(([prod, cats]) => {
      setProduct(prod);
      setCategories(cats);
      setForm({
        name:           prod.name,
        description:    prod.description ?? "",
        category_id:    prod.category_id,
        purchase_price: prod.purchase_price,
        sale_price:     prod.sale_price,
        stock:          prod.stock,
        min_stock:      prod.min_stock,
        status:         prod.status,
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name:           form.name.trim(),
        description:    form.description.trim(),
        category_id:    Number(form.category_id),
        purchase_price: Number(form.purchase_price),
        sale_price:     Number(form.sale_price),
        stock:          Number(form.stock)     || 0,
        min_stock:      Number(form.min_stock) || 0,
        status:         form.status,
      };
      const updated = await productService.update(id, payload);
      setProduct(updated);
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
      await productService.remove(id);
      router.push("/dashboard/products");
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      name:           product.name,
      description:    product.description ?? "",
      category_id:    product.category_id,
      purchase_price: product.purchase_price,
      sale_price:     product.sale_price,
      stock:          product.stock,
      min_stock:      product.min_stock,
      status:         product.status,
    });
    setEditing(false);
  };

  const fmt = (n) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);

  const profit = editing
    ? (Number(form.sale_price) || 0) - (Number(form.purchase_price) || 0)
    : product?.profit ?? 0;

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando...</main>
    </div>
  );

  if (!product) return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">Producto no encontrado.</main>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                {editing ? "Editando producto" : product.name}
              </h1>
              <p className="text-xs text-blue-500 mt-0.5">
                {editing ? "Modificá los campos y guardá los cambios" : "Detalle del producto"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                >
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
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                >
                  <FiEdit2 /> Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition"
                >
                  <FiTrash2 /> Eliminar
                </button>
              </>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="flex flex-col gap-4">

              {/* Icon placeholder */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
                <div className="w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <FiPackage className="text-4xl text-blue-300" />
                </div>
                <p className="text-xs text-gray-400">Sin imagen</p>
              </div>

              {/* Status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Estado</p>
                {editing ? (
                  <div className="flex flex-col gap-2">
                    {[
                      { value: "active",   label: "Activo" },
                      { value: "inactive", label: "Inactivo" },
                      { value: "draft",    label: "Borrador" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => set("status", opt.value)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition
                          ${form.status === opt.value
                            ? opt.value === "active"   ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : opt.value === "inactive" ? "border-red-300 bg-red-50 text-red-600"
                            :                           "border-yellow-300 bg-yellow-50 text-yellow-700"
                            : "border-gray-200 text-gray-400 hover:bg-gray-50"}`}
                      >
                        <span className={`w-2 h-2 rounded-full
                          ${form.status === opt.value
                            ? opt.value === "active"   ? "bg-emerald-500"
                            : opt.value === "inactive" ? "bg-red-400"
                            :                           "bg-yellow-400"
                            : "bg-gray-300"}`}
                        />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${STATUS_STYLES[product.status]}`}>
                    {STATUS_LABELS[product.status]}
                  </span>
                )}
              </div>

              {/* Stock info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Inventario</p>
                {editing ? (
                  <div className="flex flex-col gap-3">
                    <Field label="Stock actual">
                      <EditInput
                        value={form.stock}
                        onChange={(e) => set("stock", e.target.value)}
                        type="number" min="0" placeholder="0"
                      />
                    </Field>
                    <Field label="Stock mínimo">
                      <EditInput
                        value={form.min_stock}
                        onChange={(e) => set("min_stock", e.target.value)}
                        type="number" min="0" placeholder="0"
                      />
                    </Field>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Stock actual</span>
                      <span className={`text-sm font-bold ${product.stock <= product.min_stock ? "text-red-500" : "text-gray-700"}`}>
                        {product.stock} uds
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Stock mínimo</span>
                      <span className="text-sm font-medium text-gray-500">{product.min_stock} uds</span>
                    </div>
                    {product.stock <= product.min_stock && (
                      <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-500 font-medium">
                        ⚠️ Stock bajo el mínimo
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-span-2 flex flex-col gap-4">

              {/* General */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-blue-500">Información General</p>

                {editing ? (
                  <>
                    <Field label="Nombre *">
                      <EditInput
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Nombre del producto"
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        rows={3}
                        placeholder="Descripción del producto..."
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition resize-none"
                      />
                    </Field>
                    <Field label="Categoría">
                      <select
                        value={form.category_id}
                        onChange={(e) => set("category_id", e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white"
                      >
                        <option value="">Sin categoría</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nombre</p>
                      <p className="text-base font-semibold text-gray-800">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Descripción</p>
                      <p className="text-sm text-gray-600">{product.description || "Sin descripción"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Categoría</p>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                        {product.categories?.name ?? "Sin categoría"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-blue-500">Precios</p>

                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Precio Compra (₡)">
                      <EditInput
                        value={form.purchase_price}
                        onChange={(e) => set("purchase_price", e.target.value)}
                        type="number" min="0" placeholder="0"
                      />
                    </Field>
                    <Field label="Precio Venta (₡)">
                      <EditInput
                        value={form.sale_price}
                        onChange={(e) => set("sale_price", e.target.value)}
                        type="number" min="0" placeholder="0"
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Precio Compra</p>
                      <p className="text-base font-bold text-gray-700">{fmt(product.purchase_price)}</p>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Precio Venta</p>
                      <p className="text-base font-bold text-gray-700">{fmt(product.sale_price)}</p>
                    </div>
                  </div>
                )}

                {/* Profit */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border
                  ${profit > 0 ? "bg-emerald-50 border-emerald-100" : profit < 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Ganancia</span>
                  <span className={`text-base font-bold ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-gray-400"}`}>
                    {fmt(profit)}
                  </span>
                </div>
              </div>

              {/* Meta */}
              {!editing && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Creado</p>
                    <p className="text-sm text-gray-600">
                      {new Date(product.created_at).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Última actualización</p>
                    <p className="text-sm text-gray-600">
                      {new Date(product.updated_at).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-2">¿Eliminar producto?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Estás por eliminar <span className="font-semibold text-gray-700">"{product.name}"</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
              >
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