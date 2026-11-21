/**
 * Account repositories for the three principals (admin / owner / consumer).
 *
 * One factory, three instances (Open/Closed + Liskov: they are substitutable
 * wherever an "account store" is needed, e.g. login and password reset).
 * Columns are listed explicitly - `select("*")` is never used, so password
 * hashes and MFA secrets are only read by the methods that need them.
 */
import supabase from "../../supabaseClient.js";
import logger from "../logging/logger.js";

const log = logger.child({ module: "accounts-repo" });
const UNDEFINED_COLUMN = "42703"; // Postgres: undefined_column (migration not applied yet)

function createAccountRepository({ table, publicColumns, loginColumns, nameColumn }) {
  const mfaColumns = "mfa_enabled, mfa_secret, mfa_recovery_codes";
  const hasMfa = table === "admin" || table === "owner";

  return {
    table,
    nameColumn,

    async findById(id, columns = publicColumns) {
      const { data, error } = await supabase.from(table).select(columns).eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async findByEmail(email, columns = publicColumns) {
      const { data, error } = await supabase.from(table).select(columns).eq("email", email).maybeSingle();
      if (error) throw error;
      return data;
    },

    async emailExists(email) {
      const { data, error } = await supabase.from(table).select("id").eq("email", email).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },

    /** Includes the password hash (+ MFA fields when the migration is applied). */
    async findForLogin(email) {
      const run = (cols) => supabase.from(table).select(cols).eq("email", email).maybeSingle();
      let { data, error } = await run(hasMfa ? `${loginColumns}, ${mfaColumns}` : loginColumns);
      if (error?.code === UNDEFINED_COLUMN && hasMfa) {
        log.warn("MFA columns missing - run supabase/migrations/001_security_hardening.sql", { table });
        ({ data, error } = await run(loginColumns));
      }
      if (error) throw error;
      return data;
    },

    async updatePassword(id, passwordHash) {
      const { error } = await supabase.from(table).update({ password: passwordHash }).eq("id", id);
      if (error) throw error;
    },

    ...(hasMfa
      ? {
          async getMfa(id) {
            const { data, error } = await supabase
              .from(table)
              .select(`id, email, ${mfaColumns}`)
              .eq("id", id)
              .maybeSingle();
            if (error) throw error;
            return data;
          },
          async setMfa(id, { enabled, secretEncrypted, recoveryHashes }) {
            const { error } = await supabase
              .from(table)
              .update({
                mfa_enabled: enabled,
                mfa_secret: secretEncrypted ?? null,
                mfa_recovery_codes: recoveryHashes ?? null,
              })
              .eq("id", id);
            if (error) throw error;
          },
          async setRecoveryCodes(id, recoveryHashes) {
            const { error } = await supabase.from(table).update({ mfa_recovery_codes: recoveryHashes }).eq("id", id);
            if (error) throw error;
          },
        }
      : {}),
  };
}

export const adminRepository = createAccountRepository({
  table: "admin",
  publicColumns: "id, name, email, phone_number, address",
  loginColumns: "id, name, email, password",
  nameColumn: "name",
});

export const ownerRepository = createAccountRepository({
  table: "owner",
  publicColumns: "id, name, email, upi, phone_number, address",
  loginColumns: "id, name, email, password",
  nameColumn: "name",
});

export const consumerRepository = {
  ...createAccountRepository({
    table: "consumer",
    publicColumns: "id, username, email, address, phone, is_blocked, have_monthly_mess",
    loginColumns: "id, username, email, password, is_blocked",
    nameColumn: "username",
  }),

  async listForAdmin() {
    const { data, error } = await supabase
      .from("consumer")
      .select("id, username, email, address, phone, is_blocked, have_monthly_mess, reviews:review(id, rating)")
      .order("username", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async listRecent(limit = 200) {
    const { data, error } = await supabase
      .from("consumer")
      .select("id, username, email")
      .order("id", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async count() {
    const { count, error } = await supabase.from("consumer").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async create({ username, email, phone, address, passwordHash }) {
    const { data, error } = await supabase
      .from("consumer")
      .insert({ username, email, phone, address, password: passwordHash, have_monthly_mess: false })
      .select("id, username")
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id, { username, address, phone }) {
    const { data, error } = await supabase
      .from("consumer")
      .update({ username, address, phone })
      .eq("id", id)
      .select("id, username, email, address, phone, is_blocked, have_monthly_mess")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async setBlocked(id, blocked) {
    const { data, error } = await supabase
      .from("consumer")
      .update({ is_blocked: blocked })
      .eq("id", id)
      .select("id, username, email, is_blocked")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async markHasMonthlyMess(id) {
    const { error } = await supabase.from("consumer").update({ have_monthly_mess: true }).eq("id", id);
    if (error) throw error;
  },

  /** Stores the SHA-256 of the reset token (never the raw token). */
  async setResetToken(id, tokenHash, expiresAtIso) {
    const { error } = await supabase
      .from("consumer")
      .update({ reset_token: tokenHash, reset_token_expiry: expiresAtIso })
      .eq("id", id);
    if (error) throw error;
  },

  async findByResetTokenHash(tokenHash) {
    const { data, error } = await supabase
      .from("consumer")
      .select("id, email, username")
      .eq("reset_token", tokenHash)
      .gt("reset_token_expiry", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async resetPassword(id, passwordHash) {
    const { error } = await supabase
      .from("consumer")
      .update({ password: passwordHash, reset_token: null, reset_token_expiry: null })
      .eq("id", id);
    if (error) throw error;
  },
};

export const accountRepositories = { admin: adminRepository, owner: ownerRepository, consumer: consumerRepository };
