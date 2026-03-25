// app/admin/products/page.jsx
"use client";
import Sidebar from "@/components/sideBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
import { FaBox } from "react-icons/fa";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";

const COLUMNS = [
  { key: "image",          label: "Imagen" },
  { key: "name",           label: "Nombre" },
  { key: "category",       label: "Categoría" },
  { key: "sale_price",     label: "Precio Venta" },
  { key: "purchase_price", label: "Precio Compra" },
  { key: "profit",         label: "Ganancia" },
  { key: "status",         label: "Estado" },
];

const STATUS_STYLES = {
  active:   "bg-emerald-50 text-emerald-600 border border-emerald-200",
  inactive: "bg-red-50 text-red-500 border border-red-200",
  draft:    "bg-yellow-50 text-yellow-600 border border-yellow-200",
};
const STATUS_LABELS = {
  active: "Activo", inactive: "Inactivo", draft: "Borrador",
};

const STATUS_FILTERS = [
  { value: "all",      label: "Todos" },
  { value: "active",   label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "draft",    label: "Borrador" },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      productService.getAll(),
      categoryService.getAll(),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter   === "all" || p.status === statusFilter;
    const matchCategory = categoryFilter === "all" || String(p.category_id) === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const hasFilters = statusFilter !== "all" || categoryFilter !== "all" || search !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const fmt = (n) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Productos</h1>
            <p className="text-xs text-gray-400 mt-0.5">Gestiona tu catálogo de productos</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/products/new")}
            className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
          >
            <FiPlus className="text-base" />
            Agregar Producto
          </button>
        </header>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 px-8 py-4 bg-white border-b border-gray-100">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-blue-500 placeholder:text-gray-300 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-gray-50 transition"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-white transition"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                  ${statusFilter === f.value
                    ? f.value === "active"   ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : f.value === "inactive" ? "bg-red-50 text-red-500 border-red-200"
                    : f.value === "draft"    ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                    :                         "bg-[#1447E6] text-white border-[#1447E6]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition"
            >
              <FiX className="text-xs" /> Limpiar
            </button>
          )}

          {/* Results count */}
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLUMNS.length} className="text-center py-16 text-gray-400 text-sm">Cargando...</td></tr>
                ) : error ? (
                  <tr><td colSpan={COLUMNS.length} className="text-center py-16 text-red-400 text-sm">{error}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <FaBox className="text-5xl mb-3" />
                        <p className="text-sm font-medium text-gray-400">Sin resultados</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {hasFilters ? "Intentá con otros filtros" : "Agrega tu primer producto con el botón de arriba"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors duration-150"
                    >
                      <td className="px-5 py-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                          <FaBox className="text-gray-300 text-lg" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-700">{product.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                          {product.categories?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(product.sale_price)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{fmt(product.purchase_price)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-emerald-600 font-semibold">{fmt(product.profit)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[product.status] ?? ""}`}>
                          {STATUS_LABELS[product.status] ?? product.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}