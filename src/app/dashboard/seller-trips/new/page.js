"use client";
import Sidebar from "@/components/sideBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { sellerTripService } from "@/services/sellerTripService";
import { supabase } from "@/app/lib/supabase";

const fmt = (n) =>
  new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n ?? 0);

export default function NewSellerTripPage() {
  const router = useRouter();

  const [sellers, setSellers]           = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [productsByCategory, setProductsByCategory] = useState({});
  const [quantities, setQuantities]     = useState({});   // { productId: qty }
  const [collapsed, setCollapsed]       = useState({});   // { categoryName: bool }
  const [notes, setNotes]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Vendedores (type = 1 o role = 1, ajusta según tu lógica)
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name")
          .order("name");
        setSellers(usersData ?? []);

        // Productos activos con su categoría (join explícito para asegurar seller_profit)
        const { data: prodsData, error: prodsError } = await supabase
          .from("products")
          .select("*, categories(id, name, seller_profit)")
          .eq("status", "active")
          .order("name");
        if (prodsError) throw prodsError;

        // Agrupar por categoría
        const grouped = prodsData.reduce((acc, p) => {
          const catName   = p.categories?.name ?? "Sin categoría";
          const catProfit = Number(p.categories?.seller_profit ?? 0);
          if (!acc[catName]) acc[catName] = { profit: catProfit, products: [] };
          acc[catName].products.push(p);
          return acc;
        }, {});

        setProductsByCategory(grouped);

        // Inicializar cantidades en 0
        const initQty = prodsData.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
        setQuantities(initQty);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleCategory = (cat) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const setQty = (productId, value) => {
    const n = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: n }));
  };

  // Items que llevan cantidad > 0
  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId]) => {
      const pid = parseInt(productId);
      // Buscar producto en grouped
      let product = null;
      let sellerProfitPct = 0;
      for (const cat of Object.values(productsByCategory)) {
        const found = cat.products.find((p) => p.id === pid);
        if (found) { product = found; sellerProfitPct = cat.profit; break; }
      }
      return product ? {
        product_id: pid,
        quantity_taken: quantities[productId],
        sale_price: product.sale_price,
        purchase_price: product.purchase_price,
        seller_profit_pct: sellerProfitPct,
      } : null;
    })
    .filter(Boolean);

  const totalItems = selectedItems.reduce((s, i) => s + i.quantity_taken, 0);

  const handleSubmit = async () => {
    if (!selectedUser) return setError("Seleccioná un vendedor.");
    if (selectedItems.length === 0) return setError("Agregá al menos un producto.");
    setSaving(true);
    setError(null);
    try {
      await sellerTripService.create({ userId: selectedUser, notes, items: selectedItems });
      router.push("/admin/seller-trips");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <FiChevronLeft className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Nuevo Viaje</h1>
              <p className="text-xs text-gray-400 mt-0.5">Seleccioná vendedor y productos a llevar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
                {totalItems} unidades · {selectedItems.length} productos
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
            >
              {saving ? "Guardando..." : "Registrar Salida"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 py-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Vendedor y notas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Vendedor
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-white transition"
              >
                <option value="">— Seleccionar vendedor —</option>
                {sellers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones del viaje..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-white transition"
              />
            </div>
          </div>

          {/* Productos por categoría */}
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-12">Cargando productos...</p>
          ) : (
            Object.entries(productsByCategory).map(([catName, { profit, products }]) => (
              <div key={catName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Cabecera de categoría */}
                <button
                  onClick={() => toggleCategory(catName)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800 text-sm">{catName}</span>
                    {profit > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">
                        {profit}% comisión
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{products.length} productos</span>
                  </div>
                  {collapsed[catName]
                    ? <FiChevronDown className="text-gray-400" />
                    : <FiChevronUp className="text-gray-400" />
                  }
                </button>

                {/* Productos */}
                {!collapsed[catName] && (
                  <table className="w-full text-sm border-t border-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Llevar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr
                          key={p.id}
                          className={`border-b border-gray-50 transition-colors ${quantities[p.id] > 0 ? "bg-blue-50/30" : ""}`}
                        >
                          <td className="px-6 py-3 font-medium text-gray-700">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500">{fmt(p.sale_price)}</td>
                          <td className="px-4 py-3 text-gray-400">{p.stock}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={p.stock}
                              value={quantities[p.id] || ""}
                              onChange={(e) => setQty(p.id, e.target.value)}
                              className="w-24 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-center text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}