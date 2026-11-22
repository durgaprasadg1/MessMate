#!/usr/bin/env node
/**
 * Creates the FIRST admin account. There is no public endpoint or page that
 * can create admins any more (POST /api/create-admin needs an admin session).
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='A-long-Strong-Passw0rd!' \
 *   ADMIN_NAME="Your Name" ADMIN_PHONE=9876543210 ADMIN_ADDRESS="City" \
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:admin
 *
 * The password is read from the environment (never from argv / shell history
 * files) and is NOT printed. Change it after the first login.
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { validatePasswordStrength } from "../lib/passwordRules.js";

const need = (k) => {
  if (!process.env[k]) {
    console.error(`Missing required environment variable ${k}`);
    process.exit(1);
  }
  return process.env[k];
};

const email = need("ADMIN_EMAIL").trim().toLowerCase();
const password = need("ADMIN_PASSWORD");
const name = process.env.ADMIN_NAME?.trim() || "Administrator";
const phone = process.env.ADMIN_PHONE?.trim() || "0000000000";
const address = process.env.ADMIN_ADDRESS?.trim() || "N/A";

const problems = validatePasswordStrength(password);
if (problems.length) {
  console.error(`ADMIN_PASSWORD must contain ${problems.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  need("SUPABASE_URL"),
  need("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: { persistSession: false },
  },
);

for (const table of ["admin", "owner", "consumer"]) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    console.error(`Lookup failed on ${table}: ${error.message}`);
    process.exit(1);
  }
  if (data) {
    console.error(
      `An account with this e-mail already exists in "${table}". Nothing was changed.`,
    );
    process.exit(1);
  }
}

const { error } = await supabase.from("admin").insert({
  name,
  email,
  phone_number: phone,
  address,
  password: await bcrypt.hash(password, Number(process.env.BCRYPT_COST) || 12),
});
if (error) {
  console.error(`Could not create the admin: ${error.message}`);
  process.exit(1);
}
console.log(
  `Admin created for ${email} and pass : ${password}. Log in and enable two-step verification from your profile.`,
);
