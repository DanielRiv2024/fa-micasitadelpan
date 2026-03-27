"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import {
  FaUsers, FaClock, FaRoute, FaChartLine, FaBox,
  FaWarehouse, FaShoppingCart, FaTasks, FaUser,
  FaCalendarWeek, FaSignOutAlt, FaArchive
} from "react-icons/fa";
import { MdPointOfSale } from "react-icons/md";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Sidebar() {
  const [role, setRole] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(Number(storedRole));
  }, []);
useEffect(() => {
  setMounted(true);
}, []);


useEffect(() => {
  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();

    // ❌ NO hay sesión
    if (!data.session) {
      localStorage.clear();
      router.push("/");
      return;
    }

    const userId = data.session.user.id;

    // 🔥 validar role REAL desde DB
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const localRole = Number(localStorage.getItem("role"));

    // ❌ role manipulado
    if (!userData || userData.role !== localRole) {
      localStorage.clear();
      router.push("/");
      return;
    }
  };

  checkAuth();
}, []);



if (!mounted) return null;
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const dashboardMenu = [
    { name: "Analisis", path: "/dashboard/analytics", icon: <FaChartLine /> },
    { name: "Empleados", path: "/dashboard/employees", icon: <FaUsers /> },
    { name: "Horarios", path: "/dashboard/schedules", icon: <FaClock /> },
    // { name: "Rutas",       path: "/dashboard/routes",       icon: <FaRoute /> },
    { name: "Venta Movil", path: "/dashboard/seller-trips", icon: <MdPointOfSale /> },
    { name: "Productos", path: "/dashboard/products", icon: <FaBox /> },
    { name: "Categorias", path: "/dashboard/categories", icon: <FaArchive /> },
    { name: "Inventario", path: "/dashboard/inventory", icon: <FaWarehouse /> },
    { name: "Venta", path: "/dashboard/sales", icon: <FaShoppingCart /> },
    // { name: "Tareas",      path: "/dashboard/tasks",        icon: <FaTasks /> },
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
    <div
      className="relative h-screen flex flex-col bg-white border-r border-gray-100 shadow-xl flex-shrink-0 transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? "72px" : "256px" }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-6 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-[#1447E6] hover:border-[#1447E6] transition-all duration-200"
      >
        {collapsed ? <FiChevronRight className="text-sm" /> : <FiChevronLeft className="text-sm" />}
      </button>

      {/* Header */}
      <div className="px-4 py-6 bg-[#1447E6] overflow-hidden">
        <div className="flex items-center gap-3">
       <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
  <img
    src="https://riverasolutons.netlify.app/_next/image?url=%2Fimages%2FRiveraSolutionsLeonLogo.png&w=128&q=75"
    alt="Logo"
    className="w-6 h-6 object-contain"
  />
</div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h2 className="text-lg font-bold text-white leading-none">P002 AP</h2>
              <p className="text-blue-200 text-xs mt-0.5">
                {role === 0 ? "Administrador" : "Empleado"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menu label */}
      {!collapsed && (
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Menú
          </span>
        </div>
      )}
      {collapsed && <div className="pt-4" />}

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden">
        {menu.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={index}
              href={item.path}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-[#1447E6] text-white shadow-md shadow-blue-200"
                  : "text-gray-500 hover:bg-[#1447E6] hover:text-white"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <span className="text-base flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-gray-100" />

      {/* Logout */}
      <div className="p-2 pb-3">
        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white bg-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group ${collapsed ? "justify-center" : ""}`}
        >
          <FaSignOutAlt className="text-base flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </div>
  );
}