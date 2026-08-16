import React from "react";
import { TaxRecord } from "../../types";
import { AlertCircle, Edit, Eye, Plus, Receipt, Trash2, Upload } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";

interface AdminPajakSegmentProps {
  handleTaxDelete: any;
  handleTaxReportAction: any;
  resetTaxForm: any;
  setEditingTaxId: any;
  setIsCreateTaxModalOpen: any;
  setIsEditTaxModalOpen: any;
  setTaxExp: any;
  setTaxFinancialReportFile: any;
  setTaxMonth: any;
  setTaxNotes: any;
  setTaxRate: any;
  setTaxRev: any;
  setTaxSptFile: any;
  setTaxStatus: any;
  systemState: any;
  triggerPreview: any;
}

export default function AdminPajakSegment({ handleTaxDelete, handleTaxReportAction, resetTaxForm, setEditingTaxId, setIsCreateTaxModalOpen, setIsEditTaxModalOpen, setTaxExp, setTaxFinancialReportFile, setTaxMonth, setTaxNotes, setTaxRate, setTaxRev, setTaxSptFile, setTaxStatus, systemState, triggerPreview }: AdminPajakSegmentProps) {
  return (
    (() => {
              const taxes = systemState.taxes || [];
    
              // Compute months with transactions from cashLedger and payments that are not yet saved
              const recommendedMonths = (() => {
                const monthlyData: { [key: string]: { in: number; out: number } } = {};
                const months = [
                  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                ];
    
                const ledger = systemState.cashLedger || [];
                ledger.forEach((entry) => {
                  if (!entry.date) return;
                  const dateParts = entry.date.split("-");
                  if (dateParts.length < 2) return;
                  const year = dateParts[0];
                  const monthIndex = parseInt(dateParts[1], 10) - 1;
                  const monthName = months[monthIndex] || "Januari";
                  const key = `${monthName} ${year}`;
    
                  if (!monthlyData[key]) {
                    monthlyData[key] = { in: 0, out: 0 };
                  }
                  monthlyData[key].in += entry.inAmount || 0;
                  monthlyData[key].out += entry.outAmount || 0;
                });
    
                const payments = systemState.payments || [];
                payments.forEach((p) => {
                  if (!p.date || (p.status !== "Lunas" && p.status !== "Cicilan")) return;
                  const dateParts = p.date.split("-");
                  if (dateParts.length < 2) return;
                  const year = dateParts[0];
                  const monthIndex = parseInt(dateParts[1], 10) - 1;
                  const monthName = months[monthIndex] || "Januari";
                  const key = `${monthName} ${year}`;
    
                  if (!monthlyData[key]) {
                    monthlyData[key] = { in: 0, out: 0 };
                  }
                  const inLedgerExists = ledger.some(
                    (l) => l.inAmount === p.amount && l.date === p.date
                  );
                  if (!inLedgerExists) {
                    monthlyData[key].in += p.amount || 0;
                  }
                });
    
                const savedTaxMonths = taxes.map((t: any) => t.monthString);
                
                return Object.keys(monthlyData)
                  .filter(m => !savedTaxMonths.includes(m))
                  .map(key => ({
                    monthString: key,
                    totalRevenue: monthlyData[key].in,
                    totalExpenses: monthlyData[key].out
                  }));
              })();
    
              const handleQuickImport = (rec: { monthString: string; totalRevenue: number; totalExpenses: number }) => {
                setTaxMonth(rec.monthString);
                setTaxRev(String(rec.totalRevenue));
                setTaxExp(String(rec.totalExpenses));
                setTaxRate("0.11");
                setTaxStatus("Draft");
                setTaxNotes(`Diimpor otomatis dari buku kas bulan ${rec.monthString}`);
                setIsCreateTaxModalOpen(true);
              };
    
              const downloadFile = (base64Data: string, filename: string) => {
                const link = document.createElement("a");
                link.href = base64Data;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };
    
              const handleTriggerEdit = (tax: TaxRecord) => {
                setEditingTaxId(tax.id);
                setTaxMonth(tax.monthString);
                setTaxRev(String(tax.totalRevenue));
                setTaxExp(String(tax.totalExpenses));
                setTaxRate(String(tax.taxRate || 0.11));
                setTaxStatus(tax.status);
                setTaxNotes(tax.notes || "");
                setTaxSptFile(tax.sptFile || "");
                setTaxFinancialReportFile(tax.financialReportFile || "");
                setIsEditTaxModalOpen(true);
              };
    
              return (
                <div className="space-y-6">
                  {/* Header section with buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                        Pelaporan Pajak LPK & Keuangan Corporate
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        Kelola pelaporan SPT Badan, Pajak PPN 11%, upload laporan keuangan bulanan, serta unggah dokumen bukti lapor resmi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetTaxForm();
                        setIsCreateTaxModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Tambah Rekor Pajak Baru
                    </button>
                  </div>
    
                  {/* Quick Import Suggestions from Cash Ledger & Student Payments */}
                  {recommendedMonths.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4.5 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>💡 REKOMENDASI IMPOR BULAN (Terdeteksi dari Kas & Invoice)</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-amber-700 leading-relaxed">
                        Kami mendeteksi aktivitas keuangan pada bulan-bulan berikut di buku kas, namun rekor pajaknya belum dibuat. Klik untuk otomatis mengisi form:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recommendedMonths.map((rec) => (
                          <button
                            key={rec.monthString}
                            onClick={() => handleQuickImport(rec)}
                            className="bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold px-2.5 py-1 rounded-lg text-[10.5px] transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="h-3 w-3" /> {rec.monthString} (Omset: Rp {rec.totalRevenue.toLocaleString("id-ID")})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
    
                  {/* Tax ledger list */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Buku Kas & Pajak Terdaftar ({taxes.length} Rekor)
                      </span>
                    </div>
    
                    {taxes.length === 0 ? (
                      <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-10 text-center space-y-2">
                        <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">Belum Ada Rekor Pelaporan Pajak</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Gunakan tombol "Tambah Rekor Pajak Baru" atau klik rekomendasi di atas untuk mencatat SPT dan PPN badan usaha.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table - Hidden on Mobile */}
                        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs">
                          <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                                <th className="p-3 uppercase text-slate-600 font-black">MASA PAJAK</th>
                                <th className="p-3 uppercase text-slate-600 font-black">OMSET / OPERASIONAL</th>
                                <th className="p-3 uppercase text-slate-600 font-black">TARIF PAJAK & TOTAL</th>
                                <th className="p-3 uppercase text-slate-600 font-black">DOKUMEN KEUANGAN</th>
                                <th className="p-3 uppercase text-slate-600 font-black">BUKTI SPT</th>
                                <th className="p-3 uppercase text-slate-600 font-black">STATUS</th>
                                <th className="p-3 uppercase text-slate-600 font-black text-right">AKSI</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {taxes.map((item) => {
                                const ratePercent = (item.taxRate || 0.11) * 100;
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-bold text-slate-900">
                                      <div>{item.monthString}</div>
                                      {item.notes && (
                                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 italic max-w-[150px] truncate" title={item.notes}>
                                          "{item.notes}"
                                        </div>
                                        )}
                                    </td>
                                    <td className="p-3 space-y-0.5">
                                      <div className="font-mono text-emerald-700 font-medium">
                                        In: Rp {item.totalRevenue.toLocaleString("id-ID")}
                                      </div>
                                      <div className="font-mono text-rose-700 text-[11px]">
                                        Out: Rp {item.totalExpenses.toLocaleString("id-ID")}
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono">
                                      <div className="text-slate-500 text-[10px]">{ratePercent}% Tarif PPN</div>
                                      <div className="font-bold text-blue-800">
                                        Rp {item.taxAmount.toLocaleString("id-ID")}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {item.financialReportFile ? (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => triggerPreview(item.financialReportFile!, `Lap_Keu_${item.monthString.replace(/\s+/g, '_')}`)}
                                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1"
                                          >
                                            <Eye className="h-3 w-3" /> Preview
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => downloadFile(item.financialReportFile!, `Lap_Keu_${item.monthString.replace(/\s+/g, '_')}.pdf`)}
                                            className="text-slate-400 hover:text-slate-600 p-1"
                                            title="Download"
                                          >
                                            <Upload className="h-3 w-3 rotate-180" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic text-[10px]">Belum unggah</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                      {item.sptFile ? (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => triggerPreview(item.sptFile!, `Bukti_SPT_${item.monthString.replace(/\s+/g, '_')}`)}
                                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1"
                                          >
                                            <Eye className="h-3 w-3" /> Preview
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => downloadFile(item.sptFile!, `Bukti_SPT_${item.monthString.replace(/\s+/g, '_')}.pdf`)}
                                            className="text-slate-400 hover:text-slate-600 p-1"
                                            title="Download"
                                          >
                                            <Upload className="h-3 w-3 rotate-180" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic text-[10px]">Belum unggah</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                      {item.status === "Final/Dilaporkan" ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[9px] uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                                          ✓ Telah Lapor
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[9px] uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                                          Draft/Belum
                                        </span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {item.status !== "Final/Dilaporkan" && (
                                          <button
                                            type="button"
                                            onClick={() => handleTaxReportAction(item)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition cursor-pointer"
                                          >
                                            Lapor (e-SPT)
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleTriggerEdit(item)}
                                          className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50/50 rounded-md hover:bg-blue-50 transition cursor-pointer"
                                          title="Edit Rekor"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <ConfirmButton
                                          confirmTitle="Hapus Rekor Pajak"
                                          confirmMessage={`Hapus rekor pelaporan keuangan pajak untuk ${item.monthString}?`}
                                          onConfirmClick={() => handleTaxDelete(item)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </ConfirmButton>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
    
                        {/* Mobile Cards - Shown on Mobile */}
                        <div className="block md:hidden space-y-2.5">
                          {taxes.map((item) => {
                            const ratePercent = (item.taxRate || 0.11) * 100;
                            return (
                              <div
                                key={item.id}
                                className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative"
                              >
                                <div className="flex items-center justify-between border-b pb-1.5">
                                  <div>
                                    <span className="font-bold text-xs text-slate-900">{item.monthString}</span>
                                    {item.notes && <p className="text-[9px] text-slate-400 italic mt-0.5">"{item.notes}"</p>}
                                  </div>
                                  {item.status === "Final/Dilaporkan" ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[8.5px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                      ✓ Telah Lapor
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleTaxReportAction(item)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wide transition cursor-pointer"
                                    >
                                      Lapor
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1 leading-snug">
                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Omset Masuk</span>
                                    <strong className="text-emerald-700 text-[10px] font-mono font-semibold">
                                      Rp {item.totalRevenue.toLocaleString("id-ID")}
                                    </strong>
                                  </div>
                                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Operasional</span>
                                    <strong className="text-rose-700 text-[10px] font-mono font-semibold">
                                      Rp {item.totalExpenses.toLocaleString("id-ID")}
                                    </strong>
                                  </div>
                                </div>
    
                                <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg text-xs font-mono border">
                                  <span className="text-slate-500 text-[8.5px] font-bold">ESTIMASI TARIF {ratePercent}%</span>
                                  <strong className="text-indigo-900">
                                    Rp {item.taxAmount.toLocaleString("id-ID")}
                                  </strong>
                                </div>
    
                                {/* Mobile Document Accessors */}
                                <div className="flex flex-wrap gap-2 pt-1 border-t">
                                  {item.financialReportFile ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerPreview(item.financialReportFile!, `Lap_Keu_${item.monthString}`)}
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition"
                                    >
                                      📄 Lap. Keuangan
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic">No Lap. Keu</span>
                                  )}
    
                                  {item.sptFile ? (
                                    <button
                                      type="button"
                                      onClick={() => triggerPreview(item.sptFile!, `SPT_${item.monthString}`)}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition"
                                    >
                                      📥 Bukti SPT
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic">No Bukti SPT</span>
                                  )}
                                </div>
    
                                {/* Mobile action row */}
                                <div className="flex justify-end gap-2 pt-1.5 border-t">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerEdit(item)}
                                    className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50/50 rounded-md text-[10px] font-bold flex items-center gap-1"
                                  >
                                    <Edit className="h-3 w-3" /> Edit
                                  </button>
                                  <ConfirmButton
                                    confirmTitle="Hapus Pajak"
                                    confirmMessage={`Hapus rekor pajak ${item.monthString}?`}
                                    onConfirmClick={() => handleTaxDelete(item)}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition flex items-center gap-1 text-[10px]"
                                  >
                                    <Trash2 className="h-3 w-3" /> Hapus
                                  </ConfirmButton>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()
  );
}
