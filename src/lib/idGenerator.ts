/**
 * Suffix for new record ids (CAS-, PAY-, ATT-, SAL-, EV-, INV-, REG-, L-, Q-...).
 *
 * Ids used to be built from the last 4 digits of Date.now(), which repeat
 * every 10 seconds. Firestore writes use the id as the document key, so two
 * Buku Kas / payment / attendance entries that happened to get the same 4
 * digits silently overwrote each other (one entry vanished after the next
 * server restart). The full timestamp plus a random part makes a collision
 * practically impossible while keeping the existing prefixes.
 */
let sequence = 0;

export function uniqueIdSuffix(): string {
  // Counter: unique within this server process; random part: across instances.
  sequence = (sequence + 1) % 10000;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `${Date.now()}${String(sequence).padStart(4, "0")}${rand}`;
}
