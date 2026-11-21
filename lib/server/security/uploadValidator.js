/**
 * Server-side upload validation. The browser's `accept=` attribute and
 * client-side compression are UX only; this is the real gate.
 *
 *  - size cap
 *  - MIME allow-list (declared type must agree with the real bytes)
 *  - magic-byte sniffing (JPEG / PNG / WebP / PDF)
 *  - random file name (never trust the client's file name)
 */
import crypto from "node:crypto";
import { badRequest, payloadTooLarge } from "../errors/httpErrors.js";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

const SIGNATURES = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  { mime: "application/pdf", ext: "pdf", test: (b) => b.length > 5 && b.subarray(0, 5).toString("ascii") === "%PDF-" },
];

export function detectFileType(buffer) {
  const sig = SIGNATURES.find((s) => s.test(buffer));
  return sig ? { mime: sig.mime, ext: sig.ext } : null;
}

/**
 * @param {File|Blob} file value taken from FormData
 * @param {{ allowed: string[], maxBytes?: number, label?: string }} rules
 * @returns {Promise<{ buffer: Buffer, mime: string, ext: string, safeName: string, size: number }>}
 */
export async function validateUpload(file, { allowed, maxBytes = MAX_UPLOAD_BYTES, label = "file" }) {
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    throw badRequest(`${label} is required`);
  }
  if (file.size > maxBytes) {
    throw payloadTooLarge(`${label} must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }
  if (file.size === 0) throw badRequest(`${label} is empty`);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw payloadTooLarge(`${label} must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }

  const detected = detectFileType(buffer);
  if (!detected || !allowed.includes(detected.mime)) {
    throw badRequest(`${label} must be one of: ${allowed.map((m) => m.split("/")[1]).join(", ")}`);
  }
  // Declared MIME (if present) must agree with the real content.
  if (file.type && file.type !== detected.mime && !(file.type === "image/jpg" && detected.mime === "image/jpeg")) {
    throw badRequest(`${label} content does not match its declared type`);
  }

  return {
    buffer,
    mime: detected.mime,
    ext: detected.ext,
    size: buffer.length,
    safeName: `${crypto.randomBytes(16).toString("hex")}.${detected.ext}`,
  };
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const CERTIFICATE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
