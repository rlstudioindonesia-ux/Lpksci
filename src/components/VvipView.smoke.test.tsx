import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VvipView from "./VvipView";
import { makeMockSystemState, makeMockUser, noopAsync } from "../test/mockData";

// Text markers unique to each currentViewMode's rendered content. Used to
// assert each mode renders ONLY its own content - this is the exact class of
// bug found in production: a missing `{mode === "x" && ...}` guard causes
// every mode's content to render simultaneously, stacked on the page.
const MARKERS: Record<string, string> = {
  full: "Laporan Strategis",
  kalender: "Manajemen Jadwal LPK",
  afiliasi: "Sistem Monitoring Afiliasi",
  security: "Manajemen Keamanan Akun",
  gaji: "Total Omset Lunas",
};

const currentUser = makeMockUser("VVIP");
const systemState = makeMockSystemState();

describe("VvipView: mode isolation smoke test", () => {
  for (const mode of Object.keys(MARKERS)) {
    it(`viewMode="${mode}" shows only its own content, not other modes'`, () => {
      render(
        <VvipView
          currentUser={currentUser}
          systemState={systemState}
          onUpdateState={noopAsync}
          viewMode={mode as any}
        />,
      );

      const expectedMarker = MARKERS[mode];
      expect(screen.queryByText(expectedMarker, { exact: false })).not.toBeNull();

      for (const [otherMode, otherMarker] of Object.entries(MARKERS)) {
        if (otherMode === mode) continue;
        // "full" mode legitimately shares some sections with other modes
        // (it's the combined dashboard), so only check strict isolation
        // for the non-"full" modes against each other.
        if (mode === "full" || otherMode === "full") continue;
        expect(screen.queryByText(otherMarker, { exact: false })).toBeNull();
      }
    });
  }
});
