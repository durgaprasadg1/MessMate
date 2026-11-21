/**
 * Browser-side upload checks. These only give instant feedback (UX): the
 * server re-validates size, type and file signature and is the real gate.
 */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // keep in sync with the server (2 MB)

const RULES = {
  image: {
    mimes: ["image/jpeg", "image/png"],
    exts: ["jpg", "jpeg", "png"],
    label: "JPG or PNG image",
  },
  certificate: {
    mimes: ["image/jpeg", "image/png", "application/pdf"],
    exts: ["jpg", "jpeg", "png", "pdf"],
    label: "JPG, PNG or PDF file",
  },
};

/** @returns {string|null} an error message, or null when the file looks fine */
export function checkUpload(file, kind = "image", maxBytes = MAX_UPLOAD_BYTES) {
  const rule = RULES[kind];
  if (!file) return null;
  const ext = String(file.name || "")
    .split(".")
    .pop()
    .toLowerCase();
  if (
    !rule.exts.includes(ext) ||
    (file.type && !rule.mimes.includes(file.type))
  ) {
    return `Please choose a ${rule.label}.`;
  }
  if (file.size > maxBytes) {
    return `File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  }
  return null;
}
