"use client";
import Sidebar from "@/components/sideBar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { FiPlus } from "react-icons/fi";

const fmt = (n) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const paymentLabel = (p) => {
  if (p === 1) return "SINPE";
  if (p === 2) return "Tarjeta";
  return "Efectivo";
};

export default function SalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Cargar ventas de HOY
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            id,
            quantity,
            price_snapshot,
            total,
            products (
              name
            )
          )
        `)
        .eq("sale_date", today)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // mapear cantidad total de productos
      const mapped = data.map((s) => ({
        ...s,
        itemsCount: s.sale_items.reduce((acc, i) => acc + i.quantity, 0),
      }));

      setSales(mapped);
      setLoading(false);
    };

    load();
  }, []);

  // 🔥 Totales
  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  const totalItems = sales.reduce((acc, s) => acc + s.itemsCount, 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Ventas del día
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Registro diario de ventas
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/sales/new")}
            className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
          >
            <FiPlus />
            Nueva Venta
          </button>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto px-8 py-6 space-y-6">

          {/* RESUMEN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Total vendido
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {fmt(totalSales)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Ventas realizadas
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {sales.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Productos vendidos
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {totalItems}
              </p>
            </div>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Hora</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Productos</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Total</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">Pago</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400">
                      Cargando...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400">
                      No hay ventas hoy
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(sale.created_at).toLocaleTimeString("es-CR")}
                      </td>

                      <td className="px-5 py-3 text-blue-600 font-semibold">
                        {sale.itemsCount}
                      </td>

                      <td className="px-5 py-3 font-semibold text-gray-800">
                        {fmt(sale.total)}
                      </td>

                      <td className="px-5 py-3 text-gray-600 text-xs font-semibold">
                        {paymentLabel(sale.payment_method)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DESGLOSE */}
          {selectedSale && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-700">
                  Desglose de venta
                </h2>
                <span className="text-xs text-gray-400">
                  {fmt(selectedSale.total)}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-2 text-left text-xs text-gray-400">Producto</th>
                    <th className="px-5 py-2 text-left text-xs text-gray-400">Cantidad</th>
                    <th className="px-5 py-2 text-left text-xs text-gray-400">Precio</th>
                    <th className="px-5 py-2 text-left text-xs text-gray-400">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedSale.sale_items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-blue-700">
                        {item.products?.name}
                      </td>
                      <td className="px-5 py-3  text-blue-700">{item.quantity}</td>
                      <td className="px-5 py-3  text-blue-700">{fmt(item.price_snapshot)}</td>
                      <td className="px-5 py-3  text-blue-700 font-semibold">
                        {fmt(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}