import { supabase } from "@/app/lib/supabase";

export const productService = {

  async getAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(product) {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, product) {
    const { data, error } = await supabase
      .from("products")
      .update(product)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};