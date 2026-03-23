// app/admin/products/page.jsx
"use client";
import Sidebar from "@/components/sideBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { FaBox } from "react-icons/fa";
import { productService } from "@/services/productService";

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
  active:   "Activo",
  inactive: "Inactivo",
  draft:    "Borrador",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    productService.getAll()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex items-center gap-3 px-8 py-4 bg-white border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-gray-50 transition"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm transition">
            <FiFilter />
            Filtros
          </button>
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
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-16 text-gray-400 text-sm">
                      Cargando...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-16 text-red-400 text-sm">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <FaBox className="text-5xl mb-3" />
                        <p className="text-sm font-medium text-gray-400">Sin productos aún</p>
                        <p className="text-xs text-gray-300 mt-1">Agrega tu primer producto con el botón de arriba</p>
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
                      {/* Image */}
                      <td className="px-5 py-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                          <FaBox className="text-gray-300 text-lg" />
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5 font-semibold text-gray-700">{product.name}</td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                          {product.categories?.name ?? "—"}
                        </span>
                      </td>

                      {/* Sale price */}
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{fmt(product.sale_price)}</td>

                      {/* Purchase price */}
                      <td className="px-5 py-3.5 text-gray-500">{fmt(product.purchase_price)}</td>

                      {/* Profit */}
                      <td className="px-5 py-3.5">
                        <span className="text-emerald-600 font-semibold">{fmt(product.profit)}</span>
                      </td>

                      {/* Status */}
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