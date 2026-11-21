/** Shared membership rules (previously copy-pasted in four route files). */

export const isMembershipPaymentComplete = (registration = {}) => {
  const mode = (registration.payment_mode || "").toLowerCase();
  if (mode === "cash") return true;
  return registration.payment_verified === true || registration.payment_status === "paid";
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function remainingDays(registration, totalDuration = 30, now = new Date()) {
  const joining = new Date(registration.joining_date);
  const passed = Math.floor((now - joining) / DAY_MS);
  return Math.max(Number(totalDuration || 30) - passed, 0);
}
