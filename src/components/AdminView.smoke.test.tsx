import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import AdminView from "./AdminView";
import { makeMockSystemState, makeMockUser, noopAsync } from "../test/mockData";

// Same guard-drop bug class as VvipView/LmsView: assert each activeSegment
// renders only its own content in the main content pane. Only covers
// segments that were extracted into src/components/admin/*.tsx (where a
// dropped guard is possible) - "pembayaran", "kalender", and "manajemen"
// stay inline in AdminView.tsx.
const MARKERS: Record<string, string> = {
  siswa: "tabel-siswa-section", // matched by element id, not text
  gaji: "Penggajian Terpadu",
  kelas: "Manajemen & Status Kelas",
  kustomisasi: "Logo & Tema Dasar",
  alumnivip: "Manajemen Kelas Alumni",
  dataCV: "Data CV & Biodata Jepang",
  galeri: "Daftar Foto Galeri",
  afiliasi: "Data Afiliasi & Rekomendasi Alumni",
  pajak: "Pelaporan Pajak LPK",
  inventaris: "Rekap Keseluruhan Inventaris",
  informasi: "BROADCAST INFORMASI LPK",
  petasebaran: "DATA PETA SEBARAN ALUMNI LPK",
  joborders: "Manajemen Job Order & Rekomendasi Kerja Jepang",
};

const currentUser = makeMockUser("Admin Super");
const systemState = makeMockSystemState();

function hasMarker(mainContent: HTMLElement, marker: string): boolean {
  if (marker === "tabel-siswa-section") {
    return !!mainContent.querySelector(`#${marker}`);
  }
  return within(mainContent).queryAllByText(marker, { exact: false }).length > 0;
}

describe("AdminView: segment isolation smoke test", () => {
  for (const segment of Object.keys(MARKERS)) {
    it(`initialSegment="${segment}" shows only its own content, not other segments'`, () => {
      const { container } = render(
        <AdminView
          currentUser={currentUser}
          systemState={systemState}
          onUpdateState={noopAsync}
          initialSegment={segment as any}
        />,
      );

      const mainContent = container.querySelector(".flex-1.min-w-0") as HTMLElement;
      expect(mainContent).not.toBeNull();

      expect(hasMarker(mainContent, MARKERS[segment])).toBe(true);

      for (const [otherSegment, otherMarker] of Object.entries(MARKERS)) {
        if (otherSegment === segment) continue;
        expect(hasMarker(mainContent, otherMarker)).toBe(false);
      }
    });
  }
});
