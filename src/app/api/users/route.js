import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email, password, name, role, type } = await req.json();
    console.log("Creando usuario:", { email, name, role, type });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    console.log("Auth error:", authError);
    console.log("Auth data:", authData);

    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .insert([{ id: authData.user.id, name, role, type }]);

    console.log("DB error:", dbError);
    if (dbError) throw dbError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ERROR COMPLETO:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
export async function GET() {
  try {
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING");

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}