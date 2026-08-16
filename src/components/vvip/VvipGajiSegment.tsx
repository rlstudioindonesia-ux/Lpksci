import React from "react";
import { Activity, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";

interface VvipGajiSegmentProps {
  financialMetrics: any;
  handleDeletePayment: any;
  isReadOnly: any;
  monthlyExpenseBreakdown: any;
  paidPayments: any;
  renderGajiSection: any;
  setEditingPayment: any;
}

export default function VvipGajiSegment({ financialMetrics, handleDeletePayment, isReadOnly, monthlyExpenseBreakdown, paidPayments, renderGajiSection, setEditingPayment }: VvipGajiSegmentProps) {
  return (
    <div className="space-y-8 mt-8 animate-fade-in text-left">
              {/* Executive KPI Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total Omset Lunas</span>
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    Rp {financialMetrics.totalLunas.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Akumulasi seluruh pembayaran siswa terverifikasi</p>
                </div>
    
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Piutang / Cicilan</span>
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    Rp {financialMetrics.totalCicilan.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Pembayaran cicilan aktif dalam proses bimbingan</p>
                </div>
    
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 p-6 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Pengeluaran & Gaji</span>
                    <TrendingDown className="h-5 w-5 text-rose-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    Rp {financialMetrics.totalOutLedger.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gaji: Rp {financialMetrics.totalGaji.toLocaleString("id-ID")} | Ops: Rp {financialMetrics.totalOperasional.toLocaleString("id-ID")}
                  </p>
                </div>
    
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Saldo Kas Bersih</span>
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    Rp {financialMetrics.sisaSaldo.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Total surplus kas berjalan LPK SCI</p>
                </div>
              </div>
    
              {/* Section: Siswa yang Sudah Membayar */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
                  <div>
                    <h4 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      Rincian Siswa yang Sudah Membayar
                    </h4>
                    <p className="text-[11px] text-slate-500">Daftar lengkap transaksi pembayaran program dari siswa bimbingan LPK SCI</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600 font-mono">
                    {paidPayments.length} Pembayaran
                  </span>
                </div>
    
                {paidPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs md:text-sm border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Nama Siswa</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Kategori Program / Tagihan</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Tanggal Bayar</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Metode</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-right">Nominal (IDR)</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-center">Status</th>
                          <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paidPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/40 transition">
                            <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                            <td className="p-3 text-slate-700">{p.category}</td>
                            <td className="p-3 text-slate-500">{p.date}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {p.paymentMethod || "Bank Transfer"}
                              {p.senderBank && ` (${p.senderBank})`}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">
                              Rp {p.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="p-3 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === "Lunas"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {!isReadOnly && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingPayment(p);
                                      }}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] uppercase rounded-lg transition"
                                    >
                                      Edit
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Pembayaran"
                                      confirmMessage="Apakah Anda yakin ingin menghapus pembayaran ini?"
                                      onConfirmClick={() => handleDeletePayment(p.id)}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] uppercase rounded-lg transition"
                                    >
                                      Hapus
                                    </ConfirmButton>
                                  </>
                                )}
                                {isReadOnly && (
                                  <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">Pantau</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Belum ada rincian data pembayaran siswa yang terekam di sistem.
                  </div>
                )}
              </div>
    
              {/* Section: Pengeluaran Bulanan & Penggajian (Breakdown) */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h4 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                    Rincian Pengeluaran Bulanan & Gaji LPK
                  </h4>
                  <p className="text-[11px] text-slate-500">Breakdown bulanan operasional, gaji guru, staf, serta pemeliharaan asrama bimbingan</p>
                </div>
    
                {Object.keys(monthlyExpenseBreakdown).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.keys(monthlyExpenseBreakdown).map((monthKey) => {
                      const data = monthlyExpenseBreakdown[monthKey];
                      return (
                        <div key={monthKey} className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="font-black text-slate-800 text-xs sm:text-sm">{monthKey}</span>
                            <span className="font-mono font-extrabold text-rose-600 text-xs sm:text-sm">
                              Rp {data.total.toLocaleString("id-ID")}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Gaji Karyawan</p>
                              <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                                Rp {data.gaji.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operational LPK</p>
                              <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                                Rp {data.operasional.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
    
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Uraian Transaksi Out</p>
                            {data.list.map((item: any) => {
                              const getCodeLabel = (code: string) => {
                                switch (code) {
                                  case "P1": return "GAJI KARYAWAN";
                                  case "P2": return "OPERASIONAL";
                                  case "P3": return "DINAS";
                                  case "P4": return "KONSUMSI";
                                  case "P5": return "INVENTARIS";
                                  case "P6": return "PEMELIHARAAN";
                                  case "P7": return "TEKNOLOGI/LMS";
                                  default: return "LAINNYA";
                                }
                              };
    
                              return (
                                <div key={item.id} className="flex justify-between items-start text-[11px] bg-white p-2 rounded-lg border border-slate-100 gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[8px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded uppercase font-mono">
                                        {getCodeLabel(item.code)}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-mono">{item.date}</span>
                                    </div>
                                    <p className="font-semibold text-slate-800 leading-tight">{item.description}</p>
                                  </div>
                                  <span className="font-mono font-bold text-rose-600 shrink-0">
                                    Rp {item.outAmount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Belum ada rincian data pengeluaran bulanan dan gaji guru/staf yang tercatat.
                  </div>
                )}
              </div>
              {renderGajiSection()}
            </div>
  );
}
