import { describe, it, expect } from "vitest";
import { matchesPaymentCategory, categorizePaymentBucket } from "./paymentCategoryMatching";

describe("matchesPaymentCategory", () => {
  it("matches an exact category name case-insensitively", () => {
    expect(matchesPaymentCategory("Administrasi Pendaftaran", "Administrasi Pendaftaran")).toBe(true);
  });

  it("matches Pendaftaran synonyms", () => {
    expect(matchesPaymentCategory("Biaya Pendaftaran Awal", "Administrasi Pendaftaran")).toBe(true);
  });

  it("matches DP Biaya Belajar synonyms (pelatihan/asrama/dp)", () => {
    expect(matchesPaymentCategory("DP Pelatihan", "DP Biaya Belajar (Persiapan Awal)")).toBe(true);
    expect(matchesPaymentCategory("Biaya Asrama Awal", "DP Biaya Belajar (Persiapan Awal)")).toBe(true);
  });

  it("matches Pelunasan synonyms", () => {
    expect(matchesPaymentCategory("Pelunasan Bulan Ke-2", "Pelunasan Biaya Belajar (Max 1 Bulan)")).toBe(true);
  });

  it("matches Manajemen synonyms", () => {
    expect(matchesPaymentCategory("Biaya Manajemen", "Pembayaran Manajemen Fee")).toBe(true);
  });

  it("does not match an unrelated category", () => {
    expect(matchesPaymentCategory("Uang Saku Bulanan", "Administrasi Pendaftaran")).toBe(false);
  });
});

describe("categorizePaymentBucket", () => {
  it("buckets Administrasi Pendaftaran", () => {
    expect(categorizePaymentBucket("Administrasi Pendaftaran")).toBe("Administrasi Pendaftaran");
    expect(categorizePaymentBucket("Biaya Pendaftaran")).toBe("Administrasi Pendaftaran");
  });

  it("buckets DP Biaya Belajar", () => {
    expect(categorizePaymentBucket("DP Biaya Belajar (Persiapan Awal)")).toBe("DP Biaya Belajar");
    expect(categorizePaymentBucket("Setoran Awal")).toBe("DP Biaya Belajar");
  });

  it("buckets Pelunasan Biaya Belajar", () => {
    expect(categorizePaymentBucket("Pelunasan Biaya Belajar (Max 1 Bulan)")).toBe("Pelunasan Biaya Belajar");
    expect(categorizePaymentBucket("Cicilan Ke-2")).toBe("Pelunasan Biaya Belajar");
    expect(categorizePaymentBucket("Bayar Satu Kali")).toBe("Pelunasan Biaya Belajar");
  });

  it("buckets Manajemen Fee", () => {
    expect(categorizePaymentBucket("Pembayaran Manajemen Fee")).toBe("Manajemen Fee");
    expect(categorizePaymentBucket("Management Service")).toBe("Manajemen Fee");
  });

  it("does not miscategorize an unrelated category that merely contains the digit 1", () => {
    // Regression test for the fixed bug: pCatLower.includes("1") used to
    // catch any category with a "1" in it (e.g. "Termin 1", "Bulan 11")
    // and dump it into the Pelunasan bucket regardless of its real meaning.
    expect(categorizePaymentBucket("Uang Masuk Termin 1")).toBe(null);
    expect(categorizePaymentBucket("Setoran Bulan 11")).toBe(null);
  });

  it("returns null for a category matching no bucket", () => {
    expect(categorizePaymentBucket("Sumbangan Sukarela")).toBe(null);
  });

  it("handles a missing category safely", () => {
    expect(categorizePaymentBucket(undefined)).toBe(null);
    expect(categorizePaymentBucket(null)).toBe(null);
  });
});
