import { supabase } from "../app/lib/supabase";

export const salesService = {

  // ✅ Obtener todas las ventas (simple)
  async getAll() {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });

    if (error) throw error;
    return data;
  },

  // ✅ Obtener venta con items y producto
  async getById(id) {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        sale_items (
          id,
          quantity,
          price_snapshot,
          total,
          product_id,
          products (
            id,
            name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // ✅ Crear venta completa
  async create({ items, discount = 0 }) {
    // items: [{ product_id, quantity, price }]

    // 1. calcular total
    const total = items.reduce(
      (acc, i) => acc + i.quantity * i.price,
      0
    );

    const finalTotal = total - discount;

    // 2. crear venta
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          total: finalTotal,
          discount,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // 3. crear items
    const saleItems = items.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price_snapshot: i.price,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) throw itemsError;

    return sale;
  },

  // ✅ Editar venta (reemplaza items)
  async update(id, { items, discount = 0 }) {

    // 1. recalcular total
    const total = items.reduce(
      (acc, i) => acc + i.quantity * i.price,
      0
    );

    const finalTotal = total - discount;

    // 2. actualizar venta
    const { data, error } = await supabase
      .from("sales")
      .update({
        total: finalTotal,
        discount,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // 3. eliminar items anteriores
    const { error: deleteError } = await supabase
      .from("sale_items")
      .delete()
      .eq("sale_id", id);

    if (deleteError) throw deleteError;

    // 4. insertar nuevos items
    const saleItems = items.map((i) => ({
      sale_id: id,
      product_id: i.product_id,
      quantity: i.quantity,
      price_snapshot: i.price,
    }));

    const { error: insertError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (insertError) throw insertError;

    return data;
  },

  // ✅ Eliminar venta (cascade borra items)
  async remove(id) {
    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

};