import supabase from "../../supabaseClient.js";

const LIST_COLUMNS =
  "id,name,owner_name,owner_id,phone_number,category,is_open,image_url,is_verified,is_blocked,is_limited,lat,lon";

const PUBLIC_DETAIL_COLUMNS = [
  "id,name,description,monthly_mess_fee,monthly_mess_duration,address,meal_time",
  "veg_menu,non_veg_menu,veg_price,non_veg_price,owner_id,category,is_open,owner_name",
  "phone_number,lat,lon,is_limited,is_verified,created_at,image_url,is_blocked",
  "alerts:message(id,message,to_mess_id)",
  "vegMenuRef:veg_menu_ref_id(id,menutype,meal_time,dishes)",
  "nonVegMenuRef:non_veg_menu_ref_id(id,menutype,meal_time,dishes)",
  "reviews:review(id,rating,feedback,created_at,author:author_id(id,username))",
].join(",");

const MANAGEMENT_COLUMNS =
  "id,name,owner_name,owner_id,phone_number,category,is_open,is_verified,is_blocked,is_limited,adhar_number,lat,lon,veg_menu,non_veg_menu,veg_price,non_veg_price,image_url,certificate_url,certificate_public_id,certificate_filename,created_at";

const PENDING_COLUMNS =
  "id,name,owner_name,phone_number,category,adhar_number,is_limited,is_verified,created_at,image_url,certificate_url,certificate_public_id,certificate_filename,lat,lon";

const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const messRepository = {
  async listPublic() {
    return check(await supabase.from("mess").select(LIST_COLUMNS)) || [];
  },

  async listForAdmin() {
    return check(await supabase.from("mess").select(MANAGEMENT_COLUMNS)) || [];
  },

  async listPending() {
    return check(await supabase.from("mess").select(PENDING_COLUMNS).eq("is_verified", false)) || [];
  },

  async listByOwner(ownerId) {
    return (
      check(await supabase.from("mess").select(MANAGEMENT_COLUMNS).eq("owner_id", ownerId)) || []
    );
  },

  async idsByOwner(ownerId) {
    return (check(await supabase.from("mess").select("id").eq("owner_id", ownerId)) || []).map((m) => m.id);
  },

  async getPublicDetail(id) {
    return check(await supabase.from("mess").select(PUBLIC_DETAIL_COLUMNS).eq("id", id).maybeSingle());
  },

  /** Minimal row used by authorisation checks. */
  async getOwnership(id) {
    return check(
      await supabase.from("mess").select("id, owner_id, name, is_open, is_blocked").eq("id", id).maybeSingle(),
    );
  },

  /** Row needed for bookings / pricing (no personal data). */
  async getForBooking(id) {
    return check(
      await supabase
        .from("mess")
        .select(
          "id, name, owner_id, category, is_blocked, is_open, veg_menu, non_veg_menu, veg_price, non_veg_price, veg_menu_ref_id, non_veg_menu_ref_id, monthly_mess_fee, monthly_mess_duration",
        )
        .eq("id", id)
        .maybeSingle(),
    );
  },

  /** Row needed to e-mail the owner about verification. */
  async getForVerification(id) {
    return check(
      await supabase.from("mess").select("id, name, email, owner_name, owner_id, is_verified").eq("id", id).maybeSingle(),
    );
  },

  async getWithOwner(id) {
    return check(
      await supabase.from("mess").select("id, name, owner_id, owner:owner_id(id, email)").eq("id", id).maybeSingle(),
    );
  },

  async countAll() {
    const { count, error } = await supabase.from("mess").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async countPending() {
    const { count, error } = await supabase
      .from("mess")
      .select("id", { count: "exact", head: true })
      .eq("is_verified", false);
    if (error) throw error;
    return count ?? 0;
  },

  async recentPending(limit = 5) {
    return (
      check(
        await supabase
          .from("mess")
          .select("id, name, created_at")
          .eq("is_verified", false)
          .order("created_at", { ascending: false })
          .limit(limit),
      ) || []
    );
  },

  async setOpen(id, isOpen) {
    return check(
      await supabase.from("mess").update({ is_open: isOpen }).eq("id", id).select("id, is_open, is_blocked").single(),
    );
  },

  async setBlocked(id, blocked) {
    return check(
      await supabase.from("mess").update({ is_blocked: blocked }).eq("id", id).select("id, is_blocked").single(),
    );
  },

  async setVerified(id) {
    const { error } = await supabase.from("mess").update({ is_verified: true }).eq("id", id);
    if (error) throw error;
  },

  async updateInfo(id, fields) {
    return check(await supabase.from("mess").update(fields).eq("id", id).select("id, owner_id").maybeSingle());
  },

  async delete(id) {
    return check(await supabase.from("mess").delete().eq("id", id).select("id, name, email, owner_name").maybeSingle());
  },

  async create(row) {
    return check(await supabase.from("mess").insert(row).select("id").single());
  },

  async updateMenuColumns(id, fields) {
    const { error } = await supabase.from("mess").update(fields).eq("id", id);
    if (error) throw error;
  },
};

export const menuRepository = {
  async getById(id) {
    return check(await supabase.from("menu").select("id, mess_id, menutype, meal_time, dishes").eq("id", id).maybeSingle());
  },
  async getByMess(messId, menutype) {
    let q = supabase.from("menu").select("id, mess_id, menutype, meal_time, dishes, created_at").eq("mess_id", messId);
    if (menutype) q = q.eq("menutype", menutype);
    return check(await (menutype ? q.maybeSingle() : q)) ?? (menutype ? null : []);
  },
  async upsertForMess(messId, menutype, payload) {
    const existing = check(
      await supabase.from("menu").select("id").eq("mess_id", messId).eq("menutype", menutype).maybeSingle(),
    );
    if (existing) {
      return check(await supabase.from("menu").update(payload).eq("id", existing.id).select("id").single());
    }
    return check(await supabase.from("menu").insert(payload).select("id").single());
  },
};

export const messageRepository = {
  async create(messId, message) {
    const { error } = await supabase.from("message").insert({ message, to_mess_id: messId });
    if (error) throw error;
  },
  async getById(id) {
    return check(await supabase.from("message").select("id, message, to_mess_id").eq("id", id).maybeSingle());
  },
  async listForMess(messId) {
    return check(await supabase.from("message").select("id, message, to_mess_id").eq("to_mess_id", messId)) || [];
  },
  async delete(id) {
    const { error } = await supabase.from("message").delete().eq("id", id);
    if (error) throw error;
  },
};

export const reviewRepository = {
  async getById(id) {
    return check(await supabase.from("review").select("id, author_id, mess_id").eq("id", id).maybeSingle());
  },
  async create({ rating, feedback, authorId, messId }) {
    return check(
      await supabase
        .from("review")
        .insert({ rating, feedback, author_id: authorId, mess_id: messId })
        .select("id, rating, feedback, created_at, mess_id")
        .single(),
    );
  },
  async delete(id) {
    return check(await supabase.from("review").delete().eq("id", id).select("id").maybeSingle());
  },
};
