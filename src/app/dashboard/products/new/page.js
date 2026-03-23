// app/admin/products/new/page.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sideBar";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { FiArrowLeft, FiUpload, FiX, FiPackage } from "react-icons/fi";

const EMPTY_FORM = {
  name: "",
  description: "",
  category_id: "",
  purchase_price: "",
  sale_price: "",
  stock: "",
  min_stock: "",
  status: "active",
};

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, hasError, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-4 py-2.5 rounded-xl border text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition
        ${hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
      {...props}
    />
  );
}

export default function NewProductPage() {
  const router  = useRouter();


  const [form, setForm]             = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(console.error);
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                  e.name = "El nombre es requerido";
    if (!form.category_id)                                  e.category_id = "Seleccioná una categoría";
    if (!form.purchase_price || isNaN(form.purchase_price)) e.purchase_price = "Precio inválido";
    if (!form.sale_price     || isNaN(form.sale_price))     e.sale_price = "Precio inválido";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
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
      await productService.create(payload);
      router.push("/dashboard/products");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const profit = (Number(form.sale_price) || 0) - (Number(form.purchase_price) || 0);

  const fmt = (n) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-4 px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Nuevo Producto</h1>
            <p className="text-xs text-blue-500 mt-0.5">Completá los datos para agregar un producto</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="flex flex-col gap-4">

              {/* Image */}
              {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Imagen</p>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-red-500 transition"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-48 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-[#1447E6] hover:text-[#1447E6] transition"
                  >
                    <FiUpload className="text-2xl" />
                    <span className="text-xs font-medium">Subir imagen</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                {!imagePreview && (
                  <p className="text-[10px] text-blue-500 text-center mt-2">PNG, JPG hasta 5MB</p>
                )}
              </div> */}

              {/* Status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Estado</p>
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
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-span-2 flex flex-col gap-4">

              {/* General */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-blue-500">Información General</p>

                <Field label="Nombre *" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Ej: Agua Purificada 500ml"
                    hasError={!!errors.name}
                  />
                </Field>

                <Field label="Descripción">
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Descripción del producto..."
                    rows={3}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-blue-500 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition resize-none"
                  />
                </Field>

                <Field label="Categoría *" error={errors.category_id}>
                  <select
                    value={form.category_id}
                    onChange={(e) => set("category_id", e.target.value)}
                    className={`px-4 py-2.5 rounded-xl border text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition bg-white
                      ${errors.category_id ? "border-red-300" : "border-gray-200"}`}
                  >
                    <option value="" className="text-gray-300">Seleccionar categoría...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-blue-500">Precios</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Precio Compra (₡) *" error={errors.purchase_price}>
                    <Input
                      value={form.purchase_price}
                      onChange={(e) => set("purchase_price", e.target.value)}
                      type="number"
                      placeholder="0"
                      min="0"
                      hasError={!!errors.purchase_price}
                    />
                  </Field>
                  <Field label="Precio Venta (₡) *" error={errors.sale_price}>
                    <Input
                      value={form.sale_price}
                      onChange={(e) => set("sale_price", e.target.value)}
                      type="number"
                      placeholder="0"
                      min="0"
                      hasError={!!errors.sale_price}
                    />
                  </Field>
                </div>

                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border
                  ${profit > 0 ? "bg-emerald-50 border-emerald-100" : profit < 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Ganancia estimada</span>
                  <span className={`text-base font-bold ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-gray-400"}`}>
                    {fmt(profit)}
                  </span>
                </div>
              </div>

              {/* Stock */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <p className="text-sm font-bold text-blue-500">Inventario</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stock inicial">
                    <Input
                      value={form.stock}
                      onChange={(e) => set("stock", e.target.value)}
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </Field>
                  <Field label="Stock mínimo">
                    <Input
                      value={form.min_stock}
                      onChange={(e) => set("min_stock", e.target.value)}
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </Field>
                </div>
                <p className="text-xs text-blue-500">El stock mínimo genera una alerta cuando el inventario baje de ese nivel.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1447E6] text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-200 active:scale-95"
                >
                  <FiPackage />
                  {saving ? "Guardando..." : "Crear Producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}