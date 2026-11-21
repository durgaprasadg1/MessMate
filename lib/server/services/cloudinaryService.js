/**
 * Cloudinary access behind a thin service.
 *
 *  - banners are public (they are shown on the explore page)
 *  - certificates contain personal documents: uploaded as `authenticated`
 *    assets (no public URL works) and only ever handed out as SIGNED urls to
 *    admins reviewing a verification request.
 */
import cloudinary from "../../cloudinary.js";

export function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (err, res) => (err ? reject(err) : resolve(res))).end(buffer);
  });
}

export const uploadBanner = (buffer, publicId) =>
  uploadBuffer(buffer, { folder: "MessImage", public_id: publicId.replace(/\.[^.]+$/, ""), resource_type: "image", type: "upload" });

export const uploadCertificate = (buffer, publicId) =>
  uploadBuffer(buffer, {
    folder: "Mess_certificate",
    public_id: publicId.replace(/\.[^.]+$/, ""),
    resource_type: "image", // images and PDFs are both "image" resources in Cloudinary
    type: "authenticated",
  });

export async function destroyAsset(publicId, { type = "upload", resourceType = "image" } = {}) {
  try {
    await cloudinary.uploader.destroy(publicId, { type, resource_type: resourceType, invalidate: true });
  } catch {
    /* best effort clean-up */
  }
}

const AUTHENTICATED = /\/(image|raw|video)\/authenticated\//;

/** Returns a signed URL for authenticated assets; legacy public URLs pass through unchanged. */
export function certificateViewUrl(row) {
  const url = row?.certificate_url;
  if (!url) return null;
  if (!AUTHENTICATED.test(url) || !row.certificate_public_id) return url;
  const format = (row.certificate_filename || "").split(".").pop() || undefined;
  return cloudinary.url(row.certificate_public_id, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    format,
  });
}
