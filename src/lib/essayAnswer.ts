/**
 * Automatic essay check for CBT quizzes (also used by the Sensei correction
 * modal to pre-fill points).
 *
 * 23-10-2026 (owner: "perlu diperketat"): an answer that merely CONTAINED the
 * key used to count as correct, so "いいえ、はいではありません" matched the key
 * "はい" and writing several candidate words was always right. Now the answer
 * must equal the key or one of its variants (separated by , ; / | or new
 * lines), ignoring case, spaces and punctuation; long answers (>= 5 chars)
 * still tolerate a single-character typo.
 * Without a key the answer cannot be checked automatically and is accepted
 * (non-empty) - the Sensei reviews it in the correction modal.
 */
const cleanPunctuation = (s: string) => s.trim().toLowerCase().replace(/[.,!?:;'"~`\s。、？！「」]/g, "");

function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let diff = 0;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] !== b[j]) {
      diff++;
      if (diff > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    } else {
      i++;
      j++;
    }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}

export function checkEssayAnswer(studentAns?: string, correctKey?: string): boolean {
  if (!studentAns || typeof studentAns !== "string" || !studentAns.trim()) return false;
  if (!correctKey || typeof correctKey !== "string" || !correctKey.trim()) return true;

  const cleanStudent = cleanPunctuation(studentAns);
  if (!cleanStudent) return false;
  if (cleanStudent === cleanPunctuation(correctKey)) return true;

  const variants = correctKey
    .split(/[,;\n\/|]+/)
    .map((k) => cleanPunctuation(k))
    .filter(Boolean);

  return variants.some(
    (variant) => cleanStudent === variant || (variant.length >= 5 && withinOneEdit(cleanStudent, variant)),
  );
}
