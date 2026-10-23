/**
 * Whether an actual payment record's free-text category should be treated
 * as fulfilling a given default billing category (e.g. "Administrasi
 * Pendaftaran", "Pelunasan Biaya Belajar (Max 1 Bulan)"). Payment
 * categories are free text typed by staff, so this uses a fuzzy
 * substring match plus a handful of known synonyms per category.
 */
export type PaymentCategoryBucket =
  | "Administrasi Pendaftaran"
  | "Biaya Belajar Tahap 1"
  | "Biaya Belajar Tahap 2"
  | "Biaya Belajar Tahap 3 (N4)"
  | "Manajemen Fee"
  | null;

export function categorizePaymentBucket(paymentCategory: string | null | undefined): PaymentCategoryBucket {
  const pCatLower = (paymentCategory || "").toLowerCase().trim();
  if (!pCatLower) return null;
  // Specific stages first
  if (pCatLower.includes("tahap 3") || pCatLower.includes("tahap-3") || pCatLower.includes("n4") || pCatLower.includes("level 3")) {
    return "Biaya Belajar Tahap 3 (N4)";
  }
  if (pCatLower.includes("tahap 2") || pCatLower.includes("tahap-2") || pCatLower.includes("pelunasan") || pCatLower.includes("cicilan ke-2") || pCatLower.includes("bayar satu kali")) {
    return "Biaya Belajar Tahap 2";
  }
  if (pCatLower.includes("pendaftaran") || pCatLower.includes("administrasi") || pCatLower.includes("registrasi")) {
    return "Administrasi Pendaftaran";
  }
  if (pCatLower.includes("dp") || pCatLower.includes("tahap 1") || pCatLower.includes("tahap-1") || pCatLower.includes("awal") || pCatLower.includes("pelatihan") || pCatLower.includes("asrama")) {
    return "Biaya Belajar Tahap 1";
  }
  if (pCatLower.includes("manajemen") || pCatLower.includes("management")) {
    return "Manajemen Fee";
  }
  return null;
}

export function matchesPaymentCategory(
  paymentCategory: string | null | undefined,
  defaultCategoryLabel: string,
): boolean {
  if (!paymentCategory || !defaultCategoryLabel) return false;
  const pCatLower = paymentCategory.toLowerCase().trim();
  const catLower = defaultCategoryLabel.toLowerCase().trim();

  // If exact or normalized match
  if (pCatLower === catLower) return true;

  // Check bucket categorization
  const bucketA = categorizePaymentBucket(paymentCategory);
  const bucketB = categorizePaymentBucket(defaultCategoryLabel);

  if (bucketA && bucketB) {
    return bucketA === bucketB;
  }

  return (
    pCatLower.includes(catLower) ||
    catLower.includes(pCatLower)
  );
}
