import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MobileDashboardView from "./MobileDashboardView";
import { makeMockSystemState, makeMockUser, noopAsync, noop } from "../test/mockData";

// This is the exact bug class that shipped to production: 8 mobile subpage
// components (MobileEbenkyouSubpage, MobilePembayaranSubpage, MobilePetaSubpage,
// MobileGaleriSubpage, MobileNotifikasiSubpage, MobileCvSubpage,
// MobilePilihKelasSubpage, MobileAfiliasiSubpage) were rendered without an
// `activeSubpage === "..."` guard, so every one of them rendered
// simultaneously on every tab, stacked on the page (~11,000px tall). Users
// saw the last/most-visually-dominant one (LMS E-Benkyou) no matter which
// menu tile they tapped - reported as "VVIP masuknya lms, kalender masuknya
// lms". This test clicks each menu tile from the real home screen (exactly
// how a user would) and asserts only that tile's content appears in the
// subpage content pane (the persistent bottom nav lists every subpage name,
// so leak-checks are scoped to exclude it).
const currentUser = makeMockUser("VVIP");
const systemState = makeMockSystemState();

async function renderAndOpenBeranda() {
  const user = userEvent.setup();
  const { container } = render(
    <MobileDashboardView
      currentUser={currentUser}
      systemState={systemState}
      onOpenLogin={noop}
      onLogout={noop}
      handleRegisterSubmit={noopAsync}
      handleUpdateState={noopAsync}
      activeTab="dashboard"
      setActiveTab={noop}
      onLoginSuccess={noop}
      onOpenPrivacy={noop}
      onLoginAs={noop}
      onOpenDownloadModal={noop}
    />,
  );
  return { user, container };
}

const TILES: Record<string, { label: string; marker: string }> = {
  kalender: { label: "Jadwal LPK", marker: "Kalender Kegiatan" },
  ebenkyou: { label: "LMS E-Benkyou", marker: "PILIH KELAS E-BENKYOU" },
  pembayaran: { label: "Pembayaran", marker: "AKUMULASI DIKASIR PEMBAYARAN LPK" },
  peta: { label: "Peta Peny", marker: "PETA ALUMNI DI JEPANG" },
  galeri: { label: "Galeri", marker: "Galeri Foto LPK" },
  cv: { label: "CV & Biod", marker: "CV & BIODATA JEPANG" },
  pilih_kelas: { label: "Pilih Kelas", marker: "Akses Executive VVIP Monitoring" },
  afiliasi: { label: "Menu Afil", marker: "Program Afiliasi SCI" },
};

describe("MobileDashboardView: subpage isolation smoke test", () => {
  for (const [key, { label, marker }] of Object.entries(TILES)) {
    it(`tapping "${label}" tile shows only that subpage, not others stacked below`, async () => {
      const { user, container } = await renderAndOpenBeranda();

      // Several matches can exist for a given label (the MENU UTAMA tile,
      // duplicate entries in the collapsed admin/VVIP panels, ticker text
      // that happens to contain the same substring). Only real menu tiles
      // are short text nodes inside a <button>; the first such match in DOM
      // order is the top MENU UTAMA tile.
      const tileMatches = screen
        .getAllByText(label, { exact: false })
        .filter((el) => el.closest("button") && (el.textContent || "").trim().length < 30);
      expect(tileMatches.length).toBeGreaterThan(0);
      await user.click(tileMatches[0]);

      // The subpage content pane (excludes the persistent header/bottom-nav
      // chrome, which lists every subpage's name and would otherwise cause
      // false-positive "leaks"). Some subpages are lazy-loaded (e.g.
      // CalendarView), so wait/retry for the pane to appear.
      const getPane = () => container.querySelector(".animate-fade-only") as HTMLElement | null;
      await waitFor(() => expect(getPane()).not.toBeNull());
      const pane = getPane()!;

      await waitFor(() =>
        expect(within(pane).queryAllByText(marker, { exact: false }).length).toBeGreaterThan(0),
      );

      // The bug manifested as the page becoming >11,000px tall because every
      // subpage rendered at once. A healthy single subpage is nowhere near
      // that tall even with generous mock content.
      expect(document.body.scrollHeight).toBeLessThan(6000);

      // None of the OTHER previously-broken subpages' markers should leak
      // into this pane.
      for (const [otherKey, other] of Object.entries(TILES)) {
        if (otherKey === key) continue;
        expect(within(pane).queryAllByText(other.marker, { exact: false }).length).toBe(0);
      }
    });
  }
});
