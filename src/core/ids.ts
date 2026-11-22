/**
 * Client-generated, lexicographically sortable ids (time-prefixed + random suffix).
 * Sortable ids keep inserts ordered and make future cloud sync merge-friendly.
 */
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function newId(epochMs: number = Date.now()): string {
  // 9 base-36 chars of epoch ms covers dates far beyond this app's lifetime.
  const time = epochMs.toString(36).padStart(9, '0');
  return `${time}${randomChars(10)}`;
}
