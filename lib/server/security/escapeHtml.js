/**
 * HTML escaping for values interpolated into e-mail templates.
 * (Stored XSS in HTML mail is still XSS in the recipient's mail client.)
 */
const MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (ch) => MAP[ch]);
}

/** Tagged template: html`<b>${userValue}</b>` escapes every interpolation. */
export function html(strings, ...values) {
  return strings.reduce(
    (out, str, i) => out + str + (i < values.length ? escapeHtml(values[i]) : ""),
    "",
  );
}

/** Only allow http(s) URLs inside href attributes. */
export function safeUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "#";
  } catch {
    return "#";
  }
}
