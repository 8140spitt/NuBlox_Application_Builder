import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Keep v1 for compatibility (hex "salt:hash")
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}
export function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const test = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, test);
}

// v2: buffers to fit credentials.{credential_value_hash VARBINARY, salt VARBINARY}
export function hashPasswordV2(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return { salt, hash, saltHex: salt.toString('hex'), hashHex: hash.toString('hex') };
}
export function verifyPasswordV2(password: string, salt: Buffer | string, hash: Buffer | string) {
  const s = typeof salt === 'string' ? Buffer.from(salt, 'hex') : salt;
  const h = typeof hash === 'string' ? Buffer.from(hash, 'hex') : hash;
  const test = scryptSync(password, s, 64);
  return timingSafeEqual(h, test);
}
