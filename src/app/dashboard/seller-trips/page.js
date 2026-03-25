"use client";
import Sidebar from "@/components/sideBar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiSearch, FiX, FiClock, FiCheckCircle } from "react-icons/fi";
import { FaRoute } from "react-icons/fa";
import { sellerTripService } from "@/services/sellerTripService";

const STATUS_STYLES = {
    pending: "bg-yellow-50 text-yellow-600 border border-yellow-200",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
};
const STATUS_LABELS = { pending: "En calle", completed: "Completado" };
const STATUS_ICONS = { pending: FiClock, completed: FiCheckCircle };

const STATUS_FILTERS = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "En calle" },
    { value: "completed", label: "Completado" },
];

const fmt = (n) =>
    new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });

export default function SellerTripsPage() {
    const router = useRouter();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        sellerTripService.getAll()
            .then(setTrips)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = trips.filter((t) => {
        const matchSearch = t.users?.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const hasFilters = statusFilter !== "all" || search !== "";
    const clearFilters = () => { setSearch(""); setStatusFilter("all"); };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Viajes de Vendedores</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Registra salidas y retornos de productos</p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/seller-trips/new")}
                        className="flex items-center gap-2 bg-[#1447E6] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
                    >
                        <FiPlus className="text-base" />
                        Nuevo Viaje
                    </button>
                </header>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 px-8 py-4 bg-white border-b border-gray-100">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Buscar vendedor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm text-blue-500 placeholder:text-gray-300 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] bg-gray-50 transition"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                  ${statusFilter === f.value
                                        ? f.value === "pending" ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                            : f.value === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : "bg-[#1447E6] text-white border-[#1447E6]"
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition"
                        >
                            <FiX className="text-xs" /> Limpiar
                        </button>
                    )}

                    <span className="text-xs text-gray-400 ml-auto">
                        {filtered.length} viaje{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto px-8 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["Vendedor", "Fecha", "Productos", "Total Vendido", "Comisión", "Estado"].map((col) => (
                                        <th key={col} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">Cargando...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="text-center py-16 text-red-400 text-sm">{error}</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                                <FaRoute className="text-5xl mb-3" />
                                                <p className="text-sm font-medium text-gray-400">Sin viajes registrados</p>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    {hasFilters ? "Intentá con otros filtros" : "Registrá el primer viaje con el botón de arriba"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((trip) => {
                                        const { totalSold, totalCommission } = sellerTripService.calcTotals(trip.seller_trip_items ?? []);
                                        const StatusIcon = STATUS_ICONS[trip.status] ?? FiClock;
                                        return (
                                            <tr
                                                key={trip.id}
                                                onClick={() => router.push(`/dashboard/seller-trips/${trip.id}`)}
                                                className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors duration-150"
                                            >
                                                <td className="px-5 py-3.5 font-semibold text-gray-700">
                                                    {trip.users?.name ?? "—"}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500">{fmtDate(trip.trip_date)}</td>
                                                <td className="px-5 py-3.5 text-gray-500">
                                                    {trip.seller_trip_items?.length ?? 0} productos
                                                </td>
                                                <td className="px-5 py-3.5 font-medium text-gray-700">{fmt(totalSold)}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-emerald-600 font-semibold">{fmt(totalCommission)}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[trip.status] ?? ""}`}>
                                                        <StatusIcon className="text-xs" />
                                                        {STATUS_LABELS[trip.status] ?? trip.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}