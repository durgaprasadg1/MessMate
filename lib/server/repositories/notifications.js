import supabase from "../../supabaseClient.js";

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const COLUMNS = "id, recipient_id, recipient_model, type, title, message, order_id, mess_id, is_read, metadata, created_at";

export const notificationRepository = {
  async listFor(userId, limit = 50) {
    return (
      check(
        await supabase.from("notification").select(COLUMNS).eq("recipient_id", userId).order("created_at", { ascending: false }).limit(limit),
      ) || []
    );
  },
  async unreadCount(userId) {
    const { count, error } = await supabase
      .from("notification")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  },
  /** Scoped to the recipient in the query itself (no read-then-check race). */
  async markRead(id, userId) {
    return check(
      await supabase.from("notification").update({ is_read: true }).eq("id", id).eq("recipient_id", userId).select(COLUMNS).maybeSingle(),
    );
  },
  async markAllRead(userId) {
    const { error } = await supabase.from("notification").update({ is_read: true }).eq("recipient_id", userId).eq("is_read", false);
    if (error) throw error;
  },
  async deleteAll(userId) {
    const { error } = await supabase.from("notification").delete().eq("recipient_id", userId);
    if (error) throw error;
  },
};
