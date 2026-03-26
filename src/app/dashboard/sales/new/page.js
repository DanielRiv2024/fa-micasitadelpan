"use client";
import Sidebar from "@/components/sideBar";
import { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { salesService } from "@/services/salesService";

import {
FiChevronDown,FiTrash2,FiShoppingCart,FiTag,FiCreditCard,FiPackage,FiPlus,FiMinus} from "react-icons/fi";

const fmt = (n) =>
new Intl.NumberFormat("es-CR", {
style: "currency",
currency: "CRC",
maximumFractionDigits: 0,
}).format(n ?? 0);

const PAYMENT_LABELS = {
0: { label: "Efectivo", icon: "💵" },
1: { label: "SINPE", icon: "📲" },
2: { label: "Tarjeta", icon: "💳" },
};

export default function SalesCreatePage() {
const [categories, setCategories] = useState([]);
const [products, setProducts] = useState([]);
const [openCat, setOpenCat] = useState(null);
const [cart, setCart] = useState([]);
const [discount, setDiscount] = useState("");
const [payment, setPayment] = useState(0);
const [saving, setSaving] = useState(false);
const [added, setAdded] = useState(null); // feedback visual al agregar

useEffect(() => {
const load = async () => {
const cats = await categoryService.getAll();
const prods = await productService.getAll();
setCategories(cats);
setProducts(prods);
};
load();
}, []);

const addProduct = (p) => {
setCart((prev) => {
const exist = prev.find((i) => i.product_id === p.id);
if (exist) {
return prev.map((i) =>
i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i
);
}
return [...prev, { product_id: p.id, name: p.name, price: p.sale_price, quantity: 1 }];
});
// Feedback visual
setAdded(p.id);
setTimeout(() => setAdded(null), 600);
};

const updateQty = (id, qty) => {
setCart((prev) =>
prev.map((i) =>
i.product_id === id ? { i, quantity: Math.max(1, qty) } : i
)
);
};

const removeItem = (id) => {
setCart((prev) => prev.filter((i) => i.product_id !== id));
};

const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
const discountNum = Number(discount) || 0;
const finalTotal = total - discountNum;

const handleSave = async () => {
if (cart.length === 0) return;
setSaving(true);
try {
await salesService.create({ items: cart, discount: discountNum, payment_method: payment });
setCart([]);
setDiscount("");
} finally {
setSaving(false);
}
};

return (
<div className="flex h-screen bg-gray-50 font-sans">
<Sidebar />


  <main className="flex-1 flex overflow-hidden">

    {/* ── IZQUIERDA · Productos ── */}
    <div className="flex-1 overflow-auto px-8 py-6 space-y-3">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Nueva Venta</h1>
        <p className="text-xs text-gray-400 mt-0.5">Seleccioná los productos para agregar al carrito</p>
      </div>

      {/* Categorías */}
      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const isOpen = openCat === cat.id;
        const inCartCount = cart
          .filter((i) => catProducts.some((p) => p.id === i.product_id))
          .reduce((s, i) => s + i.quantity, 0);

        return (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Header categoría */}
            <button
              onClick={() => setOpenCat(isOpen ? null : cat.id)}
              className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700 text-sm">{cat.name}</span>
                <span className="text-xs text-blue-400 font-medium">
                  {catProducts.length} producto{catProducts.length !== 1 ? "s" : ""}
                </span>
                {inCartCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-gray-500 text-xs font-bold border border-blue-100">
                    {inCartCount} en carrito
                  </span>
                )}
              </div>
              <FiChevronDown
                className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Grid de productos */}
            {isOpen && (
              <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
                {catProducts.length === 0 ? (
                  <p className="col-span-2 text-xs text-gray-400 py-2">Sin productos en esta categoría</p>
                ) : (
                  catProducts.map((p) => {
                    const inCart = cart.find((i) => i.product_id === p.id);
                    const justAdded = added === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className={`
                          relative text-left rounded-xl p-4 border transition-all duration-200 active:scale-95
                          ${justAdded
                            ? "bg-blue-50 border-[#1447E6] shadow-sm shadow-blue-100"
                            : inCart
                            ? "bg-white border-blue-100 shadow-sm"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</p>
                          {inCart && (
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1447E6] text-white text-[10px] font-bold flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-blue-700 mt-1.5">{fmt(p.sale_price)}</p>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* ── DERECHA · Carrito ── */}
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col shadow-sm">

      {/* Header carrito */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShoppingCart className="text-gray-600" />
            <h2 className="font-bold text-gray-800 text-sm">Carrito</h2>
          </div>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1447E6] text-white text-[10px] font-bold flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
      </div>

      {/* Items del carrito */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <FiPackage className="text-gray-400 text-lg" />
            </div>
            <p className="text-sm font-medium text-gray-400">Carrito vacío</p>
            <p className="text-xs text-gray-300 mt-1">Tocá un producto para agregar</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product_id}
              className="bg-gray-50 rounded-xl p-3 border border-gray-100"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <span className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</span>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                {/* Cantidad +/- */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
                  >
                    <FiMinus className="text-xs" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
                  >
                    <FiPlus className="text-xs" />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer: Descuento + Pago + Total + Botón */}
      <div className="p-4 border-t border-gray-100 space-y-3">

        {/* Subtotal si hay descuento */}
        {discountNum > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal</span>
            <span>{fmt(total)}</span>
          </div>
        )}

        {/* Descuento */}
        <div className="relative">
          <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none" />
          <input
            type="number"
            placeholder="Descuento (₡)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
          />
        </div>

        {/* Método de pago */}
        <div className="relative">
          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none" />
          <select
            value={payment}
            onChange={(e) => setPayment(Number(e.target.value))}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1447E6] transition"
          >
            {Object.entries(PAYMENT_LABELS).map(([val, { label, icon }]) => (
              <option key={val} value={val}>{icon} {label}</option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none" />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <span className="text-sm font-semibold text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-800">{fmt(finalTotal)}</span>
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving || cart.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-[#1447E6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-blue-200 active:scale-95"
        >
          <FiShoppingCart className="text-sm" />
          {saving ? "Guardando..." : "Guardar Venta"}
        </button>

      </div>
    </div>

  </main>
</div>


);
}