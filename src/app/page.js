"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert("Credenciales incorrectas");
      return;
    }

    const userId = data.user.id;

    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (roleError || !userData) {
      alert("Error obteniendo rol");
      return;
    }

    const role = userData.role;

    localStorage.setItem("role", role);

    router.push("/dashboard/leading");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="flex items-center justify-center flex-1 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <img
              src="https://riverasolutons.netlify.app/_next/image?url=%2Fimages%2FRiveraSolutionsLeonLogo.png&w=128&q=75"
              alt="Logo"
              className="w-24 mb-3"
            />
            <h1 className="text-xl font-semibold text-gray-700">
              P007 AP
            </h1>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              className="text-blue-500 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1447E6]/40 placeholder-gray-400"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="text-blue-500 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1447E6]/40 placeholder-gray-400"
            />
          </div>

          <button
            onClick={handleLogin}
            className="w-full mt-6 py-3 rounded-xl bg-[#1447E6] text-white font-medium hover:bg-[#0f3cc9] transition-all duration-300 shadow-md"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
      <div className="text-center text-sm font-bold text-gray-500 pb-4">
        Rivera Solutions 2025
      </div>
    </div>
  );
}