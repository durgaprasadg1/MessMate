import bcrypt from "bcryptjs";
import { getEnv } from "../config/env.js";

/**
 * Password hashing behind a tiny interface (DIP): callers depend on
 * `hash/verify/needsRehash`, not on bcrypt.
 *
 * - new hashes use BCRYPT_COST (default 12)
 * - `needsRehash` lets login transparently upgrade old cost-10 hashes
 */
export class PasswordService {
  constructor({ cost = getEnv().BCRYPT_COST, lib = bcrypt } = {}) {
    this.cost = cost;
    this.lib = lib;
  }

  hash(plain) {
    return this.lib.hash(plain, this.cost);
  }

  async verify(plain, hashed) {
    if (typeof plain !== "string" || typeof hashed !== "string" || !hashed) return false;
    try {
      return await this.lib.compare(plain, hashed);
    } catch {
      return false;
    }
  }

  needsRehash(hashed) {
    const m = /^\$2[aby]\$(\d{2})\$/.exec(hashed || "");
    return !m || Number(m[1]) < this.cost;
  }
}

let dummyHashPromise = null;

/**
 * A real bcrypt hash, created lazily once, used to equalise response time when
 * the account does not exist (prevents user enumeration through timing).
 */
export function getDummyHash(service = getPasswordService()) {
  dummyHashPromise ??= service.hash("messmate-timing-equaliser");
  return dummyHashPromise;
}

let instance = null;
export const getPasswordService = () => (instance ??= new PasswordService());
export const setPasswordService = (svc) => {
  instance = svc;
};
