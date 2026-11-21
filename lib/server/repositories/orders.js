import supabase from "../../supabaseClient.js";

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const ORDER_COLUMNS =
  "id, consumer_id, mess_id, total_price, razorpay_order_id, status, payment_verified, no_of_plate, selected_dish_name, selected_dish_price, mess_name, done, is_taken, is_cancelled, refund_initiated, created_at";

export const orderRepository = {
  async create(row) {
    return check(await supabase.from("order").insert(row).select(ORDER_COLUMNS).single());
  },

  async findById(id) {
    return check(await supabase.from("order").select(ORDER_COLUMNS).eq("id", id).maybeSingle());
  },

  async findByRazorpayOrderId(rzpOrderId) {
    return check(
      await supabase.from("order").select(ORDER_COLUMNS).eq("razorpay_order_id", rzpOrderId).maybeSingle(),
    );
  },

  async listForConsumer(consumerId) {
    return (
      check(
        await supabase
          .from("order")
          .select(
            "id, mess_id, consumer_id, no_of_plate, selected_dish_name, selected_dish_price, total_price, status, is_taken, refund_initiated, done, is_cancelled, created_at, mess:mess_id(id,name)",
          )
          .eq("consumer_id", consumerId)
          .order("created_at", { ascending: false }),
      ) || []
    );
  },

  async listForMess(messId) {
    return (
      check(
        await supabase
          .from("order")
          .select(`${ORDER_COLUMNS}, consumer:consumer_id(id, username, email)`)
          .eq("mess_id", messId)
          .order("created_at", { ascending: false }),
      ) || []
    );
  },

  async idsClearableForConsumer(consumerId) {
    return (
      check(
        await supabase
          .from("order")
          .select("id")
          .eq("consumer_id", consumerId)
          .or("done.eq.true,is_cancelled.eq.true,status.in.(refunded,failed,completed)"),
      ) || []
    ).map((o) => o.id);
  },

  async idsClearableForMess(messId) {
    return (
      check(
        await supabase
          .from("order")
          .select("id")
          .eq("mess_id", messId)
          .or("done.eq.true,status.eq.failed,status.eq.refunded"),
      ) || []
    ).map((o) => o.id);
  },

  async deleteMany(ids) {
    const { error } = await supabase.from("order").delete().in("id", ids);
    if (error) throw error;
  },

  async deleteOne(id) {
    const { error } = await supabase.from("order").delete().eq("id", id);
    if (error) throw error;
  },

  async update(id, fields) {
    const { error } = await supabase.from("order").update(fields).eq("id", id);
    if (error) throw error;
  },

  /**
   * Marks an order paid ONLY if it is not paid yet (idempotent; used by both
   * the browser verification call and the Razorpay webhook).
   * @returns {Promise<boolean>} true when this call performed the transition
   */
  async markPaidIfPending(id, { paymentId, signature }) {
    const { data, error } = await supabase
      .from("order")
      .update({ status: "paid", razorpay_payment_id: paymentId, razorpay_signature: signature ?? null, payment_verified: true })
      .eq("id", id)
      .neq("payment_verified", true)
      .select("id");
    if (error) throw error;
    return (data || []).length > 0;
  },

  async markFailed(id) {
    const { error } = await supabase.from("order").update({ status: "failed" }).eq("id", id).neq("payment_verified", true);
    if (error) throw error;
  },

  // ---- owner analytics ------------------------------------------------------
  async paidSince(messId, sinceIso, columns) {
    return (
      check(await supabase.from("order").select(columns).eq("mess_id", messId).eq("status", "paid").gte("created_at", sinceIso)) ||
      []
    );
  },
  async countSince(messId, sinceIso, { cancelledOnly = false } = {}) {
    let q = supabase.from("order").select("id", { count: "exact", head: true }).eq("mess_id", messId).gte("created_at", sinceIso);
    if (cancelledOnly) q = q.eq("is_cancelled", true);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  },
  async allSince(messId, sinceIso, columns) {
    return check(await supabase.from("order").select(columns).eq("mess_id", messId).gte("created_at", sinceIso)) || [];
  },
  async paidWithDish(messId) {
    return (
      check(
        await supabase
          .from("order")
          .select("selected_dish_name, selected_dish_price, no_of_plate")
          .eq("mess_id", messId)
          .eq("status", "paid")
          .not("selected_dish_name", "is", null),
      ) || []
    );
  },
};
