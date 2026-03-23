import { supabase } from "../app/lib/supabase";

export const categoryService = {

  async getAll() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(category) {
    const { data, error } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, category) {
    const { data, error } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};