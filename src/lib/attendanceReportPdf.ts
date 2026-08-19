import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PRINTED_ON_LABEL = () =>
  `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

function addReportHeader(doc: jsPDF, title: string, periodLabel: string): number {
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 15, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Periode: ${periodLabel}`, 15, 27);
  doc.text(PRINTED_ON_LABEL(), 15, 32);
  return 38;
}

export interface HrAttendanceReportRow {
  name: string;
  role: string;
  hadir: number;
  tidakHadir: number;
  punctuality: number | null;
}

export function downloadHrAttendanceSummaryPdf(rows: HrAttendanceReportRow[], periodLabel: string): void {
  const doc = new jsPDF();
  const startY = addReportHeader(doc, "Laporan Kehadiran (Absensi) Pengajar & Staf", periodLabel);

  autoTable(doc, {
    startY,
    head: [["Nama", "Role", "Hadir", "Tidak Hadir", "Ketepatan Waktu"]],
    body: rows.map((r) => [
      r.name,
      r.role,
      `${r.hadir} Hari`,
      `${r.tidakHadir} Hari`,
      r.punctuality !== null ? `${r.punctuality}%` : "Belum ada",
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`Laporan_Absensi_HR_${periodLabel.replace(/\s+/g, "_")}.pdf`);
}

export interface StaffAttendanceLogRow {
  dateLabel: string;
  timeLabel: string;
  status: string;
  description: string;
  location: string;
}

export function downloadStaffAttendanceDetailPdf(
  staffName: string,
  staffUsername: string,
  periodLabel: string,
  logs: StaffAttendanceLogRow[],
): void {
  const doc = new jsPDF();
  const startY = addReportHeader(doc, `Detail Kehadiran: ${staffName}`, periodLabel);
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`@${staffUsername} · ${logs.length} Log Presensi`, 15, startY - 3);

  autoTable(doc, {
    startY: startY + 4,
    head: [["Tanggal", "Jam", "Status", "Keterangan", "Lokasi"]],
    body: logs.map((l) => [l.dateLabel, l.timeLabel, l.status, l.description, l.location]),
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: { 3: { cellWidth: 55 }, 4: { cellWidth: 45 } },
  });

  doc.save(`Detail_Absensi_${staffName.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.pdf`);
}
