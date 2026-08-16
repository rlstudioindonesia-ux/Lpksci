/**
 * Whether an actual payment record's free-text category should be treated
 * as fulfilling a given default billing category (e.g. "Administrasi
 * Pendaftaran", "Pelunasan Biaya Belajar (Max 1 Bulan)"). Payment
 * categories are free text typed by staff, so this uses a fuzzy
 * substring match plus a handful of known synonyms per category.
 */
export function matchesPaymentCategory(
  paymentCategory: string | null | undefined,
  defaultCategoryLabel: string,
): boolean {
  const pCatLower = (paymentCategory || "").toLowerCase();
  const catLower = defaultCategoryLabel.toLowerCase();

  return (
    pCatLower.includes(catLower) ||
    catLower.includes(pCatLower) ||
    (defaultCategoryLabel.includes("Pendaftaran") && pCatLower.includes("pendaftaran")) ||
    (defaultCategoryLabel.includes("DP Biaya Belajar") &&
      (pCatLower.includes("pelatihan") || pCatLower.includes("asrama") || pCatLower.includes("dp"))) ||
    (defaultCategoryLabel.includes("Pelunasan") && pCatLower.includes("pelunasan")) ||
    (defaultCategoryLabel.includes("Manajemen") && pCatLower.includes("manajemen"))
  );
}

export type PaymentCategoryBucket =
  | "Administrasi Pendaftaran"
  | "DP Biaya Belajar"
  | "Pelunasan Biaya Belajar"
  | "Manajemen Fee"
  | null;

/**
 * Buckets a payment's free-text category into one of the 4 billing report
 * groups, for revenue-by-category rollups. Returns null when nothing
 * matches (the payment is excluded from every bucket, same as before).
 *
 * Deliberately does NOT match on a bare "1" for the Pelunasan bucket -
 * that check used to match ANY category containing the digit 1 anywhere
 * (e.g. a typo'd amount, a date, "Termin 1"), silently miscategorizing
 * unrelated payments. It was also dead weight for the one legitimate case
 * it was meant to catch ("Pelunasan Biaya Belajar (Max 1 Bulan)"), since
 * that already matches on "pelunasan" first.
 */
export function categorizePaymentBucket(paymentCategory: string | null | undefined): PaymentCategoryBucket {
  const pCatLower = (paymentCategory || "").toLowerCase();
  if (pCatLower.includes("pendaftaran") || pCatLower.includes("administrasi")) return "Administrasi Pendaftaran";
  if (pCatLower.includes("dp") || pCatLower.includes("awal")) return "DP Biaya Belajar";
  if (pCatLower.includes("pelunasan") || pCatLower.includes("cicilan") || pCatLower.includes("satu")) return "Pelunasan Biaya Belajar";
  if (pCatLower.includes("manajemen") || pCatLower.includes("management") || pCatLower.includes("fee")) return "Manajemen Fee";
  return null;
}
