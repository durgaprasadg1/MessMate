import { z } from "zod";
import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import { badRequest, notFound } from "@/lib/server/errors/httpErrors";
import { Limits } from "@/lib/server/security/rateLimiter";
import { emailSchema, phoneSchema, upiSchema } from "@/lib/server/validation/schemas";
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

const blankToUndefined = (v) => (v === "" || v === null || v === undefined ? undefined : v);
const optionalNumber = (schema) => z.preprocess(blankToUndefined, schema);

const fieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  upi: upiSchema,
  email: emailSchema,
  description: z.string().trim().max(1000).default(""),
  address: z.string().trim().max(300).default(""),
  category: z.string().trim().min(1).max(30),
  limits: z.enum(["true", "false"]).default("true"),
  ownerName: z.string().trim().max(100).default(""),
  adharNumber: z.string().trim().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),
  phoneNumber: phoneSchema,
  monthlyMessFee: optionalNumber(z.coerce.number().min(0).max(100000).default(0)),
  // "0" is the UI placeholder ("Select Duration"): fall back to the 30 day default
  monthlyMessDuration: z.preprocess((v) => (Number(v) > 0 ? v : undefined), z.coerce.number().int().min(1).max(366).default(30)),
  lat: optionalNumber(z.coerce.number().min(-90).max(90).default(0)),
  lon: optionalNumber(z.coerce.number().min(-180).max(180).default(0)),
});

export const POST = createRoute(
  { name: "owner.new-mess", auth: "owner", uuid: ["id"], bodyType: "formData", rateLimit: { ...Limits.upload, by: "user" } },
  async ({ params, session, body: form, log }) => {
    requireSelf(session, params.id);

    const parsed = fieldsSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw badRequest(first?.message && first.path.length ? `${first.path.join(".")}: ${first.message}` : "Invalid input");
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
