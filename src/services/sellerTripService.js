import { supabase } from "../app/lib/supabase";

export const sellerTripService = {

  async getAll() {
    const { data, error } = await supabase
      .from("seller_trips")
      .select(`
        *,
        users (id, name),
        seller_trip_items (
          *,
          products (
            id, name, category_id,
            categories (id, name, seller_profit)
          )
        )
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("seller_trips")
      .select(`
        *,
        users (id, name),
        seller_trip_items (
          *,
          products (
            id, name, category_id,
            categories (id, name, seller_profit)
          )
        )
      `)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  // Crea el viaje con sus items en una sola operación
  async create({ userId, notes, items }) {
    // 1. Crear cabecera
    const { data: trip, error: tripError } = await supabase
      .from("seller_trips")
      .insert([{ user_id: userId, notes, status: "pending" }])
      .select()
      .single();
    if (tripError) throw tripError;

    // 2. Crear items
    const tripItems = items.map((item) => ({
      trip_id: trip.id,
      product_id: item.product_id,
      quantity_taken: item.quantity_taken,
      quantity_returned: 0,
      sale_price_snapshot: item.sale_price,
      purchase_price_snapshot: item.purchase_price,
      seller_profit_pct_snapshot: item.seller_profit_pct,
    }));

    const { error: itemsError } = await supabase
      .from("seller_trip_items")
      .insert(tripItems);
    if (itemsError) throw itemsError;

    return trip;
  },

  // Actualiza cantidades retornadas al cerrar el viaje
  async completeTrip(tripId, returnedItems) {
    // returnedItems: [{ id: tripItemId, quantity_returned: n }]
    const updates = returnedItems.map(({ id, quantity_returned }) =>
      supabase
        .from("seller_trip_items")
        .update({ quantity_returned })
        .eq("id", id)
    );
    await Promise.all(updates);

    const { data, error } = await supabase
      .from("seller_trips")
      .update({ status: "completed" })
      .eq("id", tripId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from("seller_trips")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // Calcula totales y comisión de un viaje
  calcTotals(tripItems) {
    return tripItems.reduce(
      (acc, item) => {
        const sold = item.quantity_taken - item.quantity_returned;
        const totalSold = sold * item.sale_price_snapshot;
        const profit = item.sale_price_snapshot - item.purchase_price_snapshot;
        const commission = sold * profit * (item.seller_profit_pct_snapshot / 100);
        return {
          totalSold: acc.totalSold + totalSold,
          totalCommission: acc.totalCommission + commission,
        };
      },
      { totalSold: 0, totalCommission: 0 }
    );
  },
};