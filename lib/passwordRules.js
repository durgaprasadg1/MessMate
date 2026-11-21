/**
 * Password rules shared by the browser (instant feedback) and the server
 * (authoritative enforcement in lib/server/auth/passwordPolicy.js).
 * Pure functions, no dependencies.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128; // bcrypt only uses the first 72 bytes; cap abuse

const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "qwerty123",
  "123456789012",
  "iloveyou123",
  "admin123456",
  "welcome12345",
  "letmein12345",
]);

/** @returns {string[]} what is still missing (empty array = acceptable) */
export function validatePasswordStrength(password) {
  const problems = [];

  if (typeof password !== "string") return ["Password is required"];
  if (password.length < PASSWORD_MIN_LENGTH)
    problems.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (password.length > PASSWORD_MAX_LENGTH)
    problems.push(`at most ${PASSWORD_MAX_LENGTH} characters`);
  if (!/[a-z]/.test(password)) problems.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) problems.push("an uppercase letter");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("a special character");
  if (COMMON.has(password.toLowerCase()))
    problems.push("to not be a commonly used password");

  return problems;
}

/** 0 (empty) .. 4 (strong) - for the strength meter only. */
export function scorePassword(password = "") {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  if (validatePasswordStrength(password).length > 0) score = Math.min(score, 2);
  return score;
}
