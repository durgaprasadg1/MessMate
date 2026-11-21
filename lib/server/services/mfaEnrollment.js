import { adminRepository, ownerRepository } from "../repositories/accounts.js";
import { badRequest } from "../errors/httpErrors.js";
import {
  generateSecret, buildOtpAuthUri, encryptSecret, decryptSecret, verifyTotp,
  generateRecoveryCodes, consumeRecoveryCode,
} from "../auth/mfaService.js";

/** MFA is offered to the privileged roles first (admin, owner). */
export const mfaRepoFor = (session) => (session.user.isAdmin ? adminRepository : ownerRepository);

export async function getStatus(session) {
  const repo = mfaRepoFor(session);
  try {
    const row = await repo.getMfa(session.user.id);
    return { enabled: Boolean(row?.mfa_enabled), recoveryCodesLeft: row?.mfa_recovery_codes?.length ?? 0 };
  } catch (err) {
    if (err?.code === "42703") return { enabled: false, recoveryCodesLeft: 0, unavailable: true };
    throw err;
  }
}

export async function beginSetup(session) {
  const repo = mfaRepoFor(session);
  const row = await repo.getMfa(session.user.id);
  if (row?.mfa_enabled) throw badRequest("MFA is already enabled");
  const secret = generateSecret();
  await repo.setMfa(session.user.id, { enabled: false, secretEncrypted: encryptSecret(secret), recoveryHashes: null });
  return { secret, otpauthUri: buildOtpAuthUri({ secret, account: row.email }) };
}

export async function confirmSetup(session, code) {
  const repo = mfaRepoFor(session);
  const row = await repo.getMfa(session.user.id);
  if (!row?.mfa_secret) throw badRequest("Start the setup first");
  if (row.mfa_enabled) throw badRequest("MFA is already enabled");
  if (!verifyTotp(decryptSecret(row.mfa_secret), code)) throw badRequest("Invalid code");
  const { codes, hashes } = generateRecoveryCodes();
  await repo.setMfa(session.user.id, { enabled: true, secretEncrypted: row.mfa_secret, recoveryHashes: hashes });
  return codes; // shown ONCE
}

export async function disable(session, code) {
  const repo = mfaRepoFor(session);
  const row = await repo.getMfa(session.user.id);
  if (!row?.mfa_enabled) throw badRequest("MFA is not enabled");
  const ok = verifyTotp(decryptSecret(row.mfa_secret), code) || consumeRecoveryCode(row.mfa_recovery_codes || [], code).valid;
  if (!ok) throw badRequest("Invalid code");
  await repo.setMfa(session.user.id, { enabled: false, secretEncrypted: null, recoveryHashes: null });
}
