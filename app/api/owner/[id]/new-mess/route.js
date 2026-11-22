import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { badRequest, notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { newMessFieldsSchema } from "@/lib/server/validation/messSchemas";
import { validateUpload, IMAGE_TYPES, CERTIFICATE_TYPES } from "@/lib/server/security/uploadValidator";
import { uploadBanner, uploadCertificate, destroyAsset } from "@/lib/server/services/cloudinaryService";
import { getPasswordService } from "@/lib/server/auth/passwordService";
import { ownerRepository } from "@/lib/server/repositories/accounts";
import { messRepository } from "@/lib/server/repositories/messes";
import { requireSelf } from "@/lib/server/auth/guards";
import { sendMailSafe } from "@/lib/server/mail/mailer";
import { verificationReceivedMail } from "@/lib/server/mail/templates";
import { deleteCacheKeys } from "@/lib/redis";
import { cacheKeys } from "@/lib/server/cache/cacheKeys";
import { audit, AuditEvent } from "@/lib/server/logging/audit";

export const runtime = "nodejs";

export const POST = createRoute(
  { name: "owner.new-mess", auth: "owner", uuid: ["id"], bodyType: "formData", rateLimit: { ...Limits.upload, by: "user" } },
  async ({ params, session, body: form, log }) => {
    requireSelf(session, params.id);

    const parsed = newMessFieldsSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      // location errors are written for the owner; others are prefixed with the field name
      const userFacing = ["lat", "lon"].includes(first?.path?.[0]);
      throw badRequest(
        first?.message && first.path.length && !userFacing ? `${first.path.join(".")}: ${first.message}` : first?.message || "Invalid input",
      );
    }
    const f = parsed.data;

    if (!(await ownerRepository.findById(params.id, "id"))) throw notFound("Failed to get Mess Owner");

    // Real validation happens HERE (size, magic bytes, allow-list, random names).
    let banner, cert;
    try {
      banner = await validateUpload(form.get("image"), { allowed: IMAGE_TYPES, label: "Banner image" });
      cert = await validateUpload(form.get("certificate"), { allowed: CERTIFICATE_TYPES, label: "Certificate" });
    } catch (err) {
      audit(AuditEvent.UPLOAD_REJECTED, { actorId: session.user.id, reason: err.message }, log);
      throw err;
    }

    const bannerUp = await uploadBanner(banner.buffer, banner.safeName);
    let certUp;
    try {
      certUp = await uploadCertificate(cert.buffer, cert.safeName);
    } catch (err) {
      await destroyAsset(bannerUp.public_id);
      throw err;
    }

    let created;
    try {
      created = await messRepository.create({
        name: f.name,
        email: f.email,
        upi: f.upi,
        description: f.description,
        address: f.address,
        category: f.category,
        is_limited: f.limits === "true",
        owner_name: f.ownerName,
        adhar_number: await getPasswordService().hash(f.adharNumber),
        phone_number: f.phoneNumber,
        lat: f.lat,
        lon: f.lon,
        image_url: bannerUp.secure_url,
        image_filename: banner.safeName,
        image_public_id: bannerUp.public_id,
        certificate_url: certUp.secure_url,
        certificate_filename: cert.safeName,
        certificate_public_id: certUp.public_id,
        veg_menu: [],
        non_veg_menu: [],
        veg_menu_ref_id: null,
        non_veg_menu_ref_id: null,
        owner_id: params.id,
        monthly_mess_fee: f.monthlyMessFee,
        monthly_mess_duration: f.monthlyMessDuration,
      });
    } catch (err) {
      await destroyAsset(bannerUp.public_id);
      await destroyAsset(certUp.public_id, { type: "authenticated" });
      throw err;
    }

    await deleteCacheKeys([cacheKeys.messList(), cacheKeys.messPending(), cacheKeys.ownerMesses(params.id), cacheKeys.adminMesses()]);
    audit(AuditEvent.MESS_CREATED, { actorId: session.user.id, targetId: created.id }, log);
    await sendMailSafe({ to: f.email, ...verificationReceivedMail({ ownerName: f.ownerName }) }, log);

    return json({ id: created.id }, 201);
  },
);
