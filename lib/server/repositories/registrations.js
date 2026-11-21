import supabase from "../../supabaseClient.js";

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const REG_COLUMNS =
  "id, mess_id, consumer_id, duration, phone, payment_mode, name, address, gender, college, joining_date, food_preference, emergency_contact, is_allowed, razorpay_order_id, payment_verified, total_amount, payment_status, customers";

export const registrationRepository = {
  async findById(id, columns = `${REG_COLUMNS}, mess:mess_id(id, name, owner_id)`) {
    return check(await supabase.from("new_mess_customer").select(columns).eq("id", id).maybeSingle());
  },

  async findByRazorpayOrderId(rzpOrderId) {
    return check(
      await supabase.from("new_mess_customer").select(REG_COLUMNS).eq("razorpay_order_id", rzpOrderId).maybeSingle(),
    );
  },

  async listForConsumer(consumerId, withMess = "mess:mess_id(name, category, monthly_mess_duration)") {
    return (
      check(
        await supabase.from("new_mess_customer").select(`${REG_COLUMNS}, ${withMess}`).eq("consumer_id", consumerId),
      ) || []
    );
  },

  /** Monthly-mess screen: registration + mess summary + the member's own profile (no secrets). */
  async listDetailedForConsumer(consumerId) {
    return (
      check(
        await supabase
          .from("new_mess_customer")
          .select(
            `${REG_COLUMNS}, mess:mess_id(id, name, category, address, lat, lon, monthly_mess_duration, monthly_mess_fee, phone_number, owner_name), consumer:consumer_id(id, username, email, phone, address)`,
          )
          .eq("consumer_id", consumerId),
      ) || []
    );
  },

  async listForMess(messId) {
    return (
      check(await supabase.from("new_mess_customer").select(REG_COLUMNS).eq("mess_id", messId)) || []
    );
  },

  async create(row) {
    return check(await supabase.from("new_mess_customer").insert(row).select(REG_COLUMNS).single());
  },

  async update(id, fields) {
    return check(await supabase.from("new_mess_customer").update(fields).eq("id", id).select(REG_COLUMNS).single());
  },

  async delete(id) {
    const { error } = await supabase.from("new_mess_customer").delete().eq("id", id);
    if (error) throw error;
  },

  async markPaidIfPending(id, { paymentId, signature }) {
    const { data, error } = await supabase
      .from("new_mess_customer")
      .update({ payment_status: "paid", razorpay_payment_id: paymentId, razorpay_signature: signature ?? null, payment_verified: true })
      .eq("id", id)
      .neq("payment_verified", true)
      .select("id");
    if (error) throw error;
    return (data || []).length > 0;
  },

  async markFailed(id) {
    const { error } = await supabase
      .from("new_mess_customer")
      .update({ payment_status: "failed" })
      .eq("id", id)
      .neq("payment_verified", true);
    if (error) throw error;
  },
};
