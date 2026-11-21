import { adminRepository, ownerRepository, consumerRepository } from "../repositories/accounts.js";

/**
 * Login looks accounts up in admin -> owner -> consumer order, so an e-mail
 * must be unique across ALL three tables or one account could shadow another.
 */
export async function isEmailTaken(email) {
  const checks = await Promise.all([
    adminRepository.emailExists(email),
    ownerRepository.emailExists(email),
    consumerRepository.emailExists(email),
  ]);
  return checks.some(Boolean);
}
