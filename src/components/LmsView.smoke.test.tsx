import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LmsView from "./LmsView";
import { makeMockSystemState, makeMockUser, noopAsync } from "../test/mockData";

// Same guard-drop bug class as VvipView: assert each activeSubTab renders
// only its own content, since a missing `{activeSubTab === "x" && ...}`
// would stack every tab's content together.
const MARKERS: Record<string, string> = {
  bab: "Daftar Pelajaran",
  absen: "Presensi Kelas oleh Sensei",
  dokumen: "Akun Registrasi Belum Terhubung",
  progress: "Evaluasi Bab & Pelajaran",
};

const currentUser = makeMockUser("Pengajar", { assignedClass: "Kelas Test" });
const systemState = makeMockSystemState({
  lmsClasses: [{ id: "kelas-test", name: "Kelas Test", isActive: true }],
});

describe("LmsView: tab isolation smoke test", () => {
  for (const tab of Object.keys(MARKERS)) {
    it(`initialSubTab="${tab}" shows only its own content, not other tabs'`, () => {
      render(
        <LmsView
          currentUser={currentUser}
          systemState={systemState}
          attendanceRecords={[]}
          activeStudents={[]}
          lmsLessons={[]}
          onAddAttendance={noopAsync}
          onUpdateState={noopAsync}
          initialSubTab={tab as any}
        />,
      );

      const expectedMarker = MARKERS[tab];
      expect(screen.queryByText(expectedMarker, { exact: false })).not.toBeNull();

      for (const [otherTab, otherMarker] of Object.entries(MARKERS)) {
        if (otherTab === tab) continue;
        expect(screen.queryByText(otherMarker, { exact: false })).toBeNull();
      }
    });
  }
});
