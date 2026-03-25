"use client";
import Sidebar from "@/components/sideBar";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiChevronLeft, FiCheckCircle, FiClock } from "react-icons/fi";
import { sellerTripService } from "@/services/sellerTripService";

const fmt = (n) =>
  new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });

export default function SellerTripDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [trip, setTrip]         = useState(null);
  const [returned, setReturned] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    sellerTripService.getById(id)
      .then((data) => {
        setTrip(data);
        const init = data.seller_trip_items.reduce(
          (acc, item) => ({ ...acc, [item.id]: item.quantity_returned }),
          {}
        );
        setReturned(init);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const setQty = (itemId, value, max) => {
    const n = Math.min(max, Math.max(0, parseInt(value) || 0));
    setReturned((prev) => ({ ...prev, [itemId]: n }));
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = trip.seller_trip_items.map((item) => ({
        id: item.id,
        quantity_returned: returned[item.id] ?? 0,
      }));
      await sellerTripService.completeTrip(trip.id, updates);
      router.push("/dashboard/seller-trips");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-gray-50"><Sidebar />
      <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">Cargando...</main>
    </div>
  );
  if (!trip) return null;

  const isPending = trip.status === "pending";

  // Items con retorno en tiempo real
  const liveItems = trip.seller_trip_items.map((item) => ({
    ...item,
    quantity_returned: returned[item.id] ?? item.quantity_returned,
  }));

  // Separar en categorías CON y SIN comisión
  const withCommission    = {};
  const withoutCommission = {};

  liveItems.forEach((item) => {
    const catName   = item.products?.categories?.name ?? "Sin categoría";
    const catProfit = Number(item.products?.categories?.seller_profit ?? 0);
    const target    = catProfit > 0 ? withCommission : withoutCommission;
    if (!target[catName]) target[catName] = { profit: catProfit, items: [] };
    target[catName].items.push(item);
  });

  // Salario total = suma de comisiones solo de categorías con profit > 0
  const totalSalary = Object.values(withCommission).reduce((acc, { items }) =>
    acc + sellerTripService.calcTotals(items).totalCommission, 0);

  const totalSold = sellerTripService.calcTotals(liveItems).totalSold;

  const renderCategoryTable = (catName, { profit, items }) => {
    const catTotals = sellerTripService.calcTotals(items);
    return (
      <div key={catName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-800 text-sm">{catName}</span>
            {profit > 0 ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">
                {profit}% comisión
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold border border-gray-200">
                Sin comisión
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Vendido: <strong className="text-gray-700">{fmt(catTotals.totalSold)}</strong></span>
            {profit > 0 && (
              <span>Salario aportado: <strong className="text-emerald-600">{fmt(catTotals.totalCommission)}</strong></span>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Llevó</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Regresó</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendido</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total venta</th>
              {profit > 0 && (
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">Salario</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const sold       = item.quantity_taken - item.quantity_returned;
              const totalVenta = sold * item.sale_price_snapshot;
              const unitProfit = item.sale_price_snapshot - item.purchase_price_snapshot;
              const salary     = sold * unitProfit * (item.seller_profit_pct_snapshot / 100);

              return (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-700">{item.products?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{fmt(item.sale_price_snapshot)}</td>
                  <td className="px-5 py-3 text-gray-700 font-semibold">{item.quantity_taken}</td>
                  <td className="px-5 py-3">
                    {isPending ? (
                      <input
                        type="number"
                        min={0}
                        max={item.quantity_taken}
                        value={returned[item.id] || ""}
                        onChange={(e) => setQty(item.id, e.target.value, item.quantity_taken)}
                        className="w-20 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-center text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
                      />
                    ) : (
                      <span className="text-gray-700 font-semibold">{item.quantity_returned}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${sold > 0 ? "text-blue-600" : "text-gray-300"}`}>{sold}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-700">{fmt(totalVenta)}</td>
                  {profit > 0 && (
                    <td className="px-5 py-3">
                      <span className="text-emerald-600 font-semibold">{fmt(salary)}</span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <FiChevronLeft className="text-lg" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                  Viaje — {trip.users?.name ?? "—"}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  isPending
                    ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}>
                  {isPending ? <FiClock /> : <FiCheckCircle />}
                  {isPending ? "En calle" : "Completado"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(trip.trip_date)}</p>
            </div>
          </div>

          {isPending && (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-200 active:scale-95"
            >
              <FiCheckCircle />
              {saving ? "Guardando..." : "Cerrar Viaje"}
            </button>
          )}
        </header>

        <div className="flex-1 overflow-auto px-8 py-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(totalSold)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Salario del Vendedor</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(totalSalary)}</p>
              <p className="text-xs text-gray-400 mt-1">Solo de categorías con comisión</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Líneas de producto</p>
              <p className="text-2xl font-bold text-blue-600">{trip.seller_trip_items.length}</p>
            </div>
          </div>

          {/* Sección CON comisión */}
          {Object.keys(withCommission).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-gray-700 whitespace-nowrap">Con comisión</h2>
                <div className="h-px flex-1 bg-emerald-100" />
                <span className="text-xs text-emerald-500 font-semibold whitespace-nowrap">Aporta al salario</span>
              </div>
              {Object.entries(withCommission).map(([catName, data]) => renderCategoryTable(catName, data))}
            </div>
          )}

          {/* Sección SIN comisión */}
          {Object.keys(withoutCommission).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-gray-700 whitespace-nowrap">Sin comisión</h2>
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">No aporta al salario</span>
              </div>
              {Object.entries(withoutCommission).map(([catName, data]) => renderCategoryTable(catName, data))}
            </div>
          )}

          {trip.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-gray-600">{trip.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}