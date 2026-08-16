import bcrypt from "bcryptjs";

// Bcrypt hashes always start with $2a$/$2b$/$2y$ followed by the cost factor.
export function isHashedPassword(pw: unknown): pw is string {
  return typeof pw === "string" && /^\$2[aby]\$\d{2}\$/.test(pw);
}

export function hashPassword(plain: string): string {
  if (!plain) return "";
  return bcrypt.hashSync(plain, 10);
}

// Accepts legacy plaintext passwords for existing accounts so nobody gets locked out;
// a successful legacy match is immediately re-hashed by the caller.
export function verifyPassword(plain: string, stored: unknown): boolean {
  if (!plain || !stored || typeof stored !== "string") return false;
  if (isHashedPassword(stored)) {
    return bcrypt.compareSync(plain, stored);
  }
  return plain === stored;
}

export function stripPassword<T extends { password?: unknown }>(obj: T): Omit<T, "password"> {
  const { password, ...rest } = obj;
  return rest;
}
