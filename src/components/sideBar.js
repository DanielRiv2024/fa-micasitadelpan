"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUsers,
  FaClock,
  FaRoute,
  FaChartLine,
  FaBox,
  FaWarehouse,
  FaShoppingCart,
  FaTasks,
  FaUser,
  FaCalendarWeek,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdPointOfSale } from "react-icons/md";

export default function Sidebar() {
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(Number(storedRole));
  }, []);

  const handleLogout = () => {
    localStorage.setItem("role", "3");
    router.push("/");
  };

  const dashboardMenu = [
    { name: "Empleados", path: "/dashboard/employees", icon: <FaUsers /> },
    { name: "Horarios", path: "/dashboard/schedules", icon: <FaClock /> },
    { name: "Rutas", path: "/dashboard/routes", icon: <FaRoute /> },
    { name: "Venta Movil", path: "/dashboard/seller-trips", icon: <MdPointOfSale /> },
    { name: "Analisis", path: "/dashboard/analytics", icon: <FaChartLine /> },
    { name: "Productos", path: "/dashboard/products", icon: <FaBox /> },
    { name: "Categorias", path: "/dashboard/categories", icon: <FaBox /> },
    { name: "Inventario", path: "/dashboard/inventory", icon: <FaWarehouse /> },
    { name: "Venta", path: "/dashboard/sales", icon: <FaShoppingCart /> },
    { name: "Tareas", path: "/dashboard/tasks", icon: <FaTasks /> },
  ];

  const employeeMenu = [
    { name: "Venta Movil", path: "/employee/mobile-sales", icon: <MdPointOfSale /> },
    { name: "Panel Tareas", path: "/employee/tasks", icon: <FaTasks /> },
    { name: "Venta", path: "/employee/sales", icon: <FaShoppingCart /> },
    { name: "Tu Semana", path: "/employee/week", icon: <FaCalendarWeek /> },
    { name: "Perfil", path: "/employee/profile", icon: <FaUser /> },
  ];

  const menu = role === 0 ? dashboardMenu : employeeMenu;

  return (
    <div className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 shadow-xl">

      {/* Header */}
      <div className="px-6 py-6 bg-[#1447E6]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <MdPointOfSale className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">P007 AP</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {role === 0 ? "dashboardistrador" : "Empleado"}
            </p>
          </div>
        </div>
      </div>

      {/* Menu label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
          Menú
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {menu.map((item, index) => (
          <Link
            key={index}
            href={item.path}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-[#1447E6] hover:text-white transition-all duration-200 group"
          >
            <span className="text-base group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </span>
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100" />

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <FaSignOutAlt className="text-base group-hover:scale-110 transition-transform duration-200" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>

    </div>
  );
}