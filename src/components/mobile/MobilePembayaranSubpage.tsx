import React from "react";
import { Image as ImageIcon, Lock } from "lucide-react";
import { getStudentPayments } from "../PembayaranSiswaView";
import { TeacherDashboardPanel } from "../TeacherDashboardPanel";
import { isAdminOrVvip } from "../../lib/permissions";

interface MobilePembayaranSubpageProps {
  currentUser: any;
  handleUpdateState: any;
  onOpenLogin: any;
  selectedStudent: any;
  setActivePaymentDetail: any;
  setActiveSubpage: any;
  setSelectedStudent: any;
  systemState: any;
}

export default function MobilePembayaranSubpage({ currentUser, handleUpdateState, onOpenLogin, selectedStudent, setActivePaymentDetail, setActiveSubpage, setSelectedStudent, systemState }: MobilePembayaranSubpageProps) {
  return (
    <div className="p-4 space-y-4 text-left">
                  <h3 className="font-sans font-black text-slate-900 border-b pb-2 text-md">
                    {currentUser && isAdminOrVvip(currentUser.role)
                      ? "Pembayaran Siswa"
                      : currentUser && currentUser.role === "Pengajar"
                      ? "HR & Personalia"
                      : "Pembayaran & Booking Online"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser && (isAdminOrVvip(currentUser.role) || currentUser.role === "Pengajar")
                      ? "Kelola kehadiran, gaji, cuti, dan rekapitulasi data staff LPK."
                      : "Pantau riwayat pembayaran dan tagihan Anda untuk program pelatihan di LPK."}
                  </p>
    
                  {!currentUser ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-4 text-center space-y-3">
                      <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-50">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">
                          Login Diperlukan
                        </h4>
                        <p className="text-[10px] text-slate-600">
                          Untuk melihat riwayat pembayaran asli Anda, silakan login
                          terlebih dahulu sebagai Siswa.
                        </p>
                      </div>
                      <button
                        onClick={onOpenLogin}
                        className="w-full mt-2 py-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition"
                      >
                        Buka Portal Login
                      </button>
                    </div>
                  ) : isAdminOrVvip(currentUser.role) ? (
                    /* ADMIN & VVIP WORKFLOW: STATS & STUDENT REKAP FILTER */
                    <div className="space-y-4 animate-fade-in text-xs font-sans">
                      {(() => {
                        const allStudentNames = Array.from(
                          new Set([
                            ...(systemState.activeStudents || []).map(
                              (s) => s.name,
                            ),
                            ...(systemState.registeredStudents || []).map(
                              (s) => s.name,
                            ),
                          ]),
                        )
                          .filter(Boolean)
                          .sort();
    
                        let totalLunasGross = 0;
                        let totalTunggakanGross = 0;
    
                        allStudentNames.forEach((name) => {
                          const studentPays = getStudentPayments(
                            name,
                            systemState.payments || [],
                            systemState.costConfig,
                            systemState.activeStudents,
                            systemState.registeredStudents,
                            systemState.customization,
                          );
                          studentPays.forEach((p) => {
                            if (p.status === "Lunas") totalLunasGross += p.amount;
                            else totalTunggakanGross += p.amount;
                          });
                        });
    
                        const grandTotalExpected =
                          totalLunasGross + totalTunggakanGross;
                        const lunasPercentage =
                          grandTotalExpected > 0
                            ? (totalLunasGross / grandTotalExpected) * 100
                            : 0;
    
                        return (
                          <div className="space-y-3">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-3.5 space-y-2">
                              <p className="font-extrabold text-[10px] text-indigo-950 tracking-wide uppercase font-mono">
                                📊 AKUMULASI DIKASIR PEMBAYARAN LPK
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-slate-900">
                                <div>
                                  <span className="text-[9px] text-slate-400 block">
                                    TOTAL LUNAS
                                  </span>
                                  <strong className="text-xs font-mono font-black text-emerald-700">
                                    Rp {totalLunasGross.toLocaleString("id-ID")}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block">
                                    BELUM LUNAS
                                  </span>
                                  <strong className="text-xs font-mono font-black text-red-650">
                                    Rp {totalTunggakanGross.toLocaleString("id-ID")}
                                  </strong>
                                </div>
                              </div>
    
                              {/* Graphical bar */}
                              <div className="w-full h-3 bg-slate-200 rounded-lg overflow-hidden flex mt-1">
                                <div
                                  style={{ width: `${lunasPercentage}%` }}
                                  className="bg-emerald-500 h-full"
                                />
                                <div
                                  style={{ width: `${100 - lunasPercentage}%` }}
                                  className="bg-amber-400 h-full"
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                                <span>Lunas: {lunasPercentage.toFixed(1)}%</span>
                                <span>
                                  Tunggakan: {(100 - lunasPercentage).toFixed(1)}%
                                </span>
                              </div>
                            </div>
    
                            {/* Search select per Student */}
                            <div className="bg-white border rounded-[24px] p-3 space-y-3">
                              <p className="font-extrabold text-[10px] text-slate-800">
                                🔍 HISTORI REKAP PER ALUMNI
                              </p>
    
                              <select
                                value={selectedStudent || allStudentNames[0] || ""}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full p-2 border border-slate-100/80 bg-slate-50 rounded-xl text-xs outline-hidden font-medium"
                              >
                                <option value="">-- Pilih Siswa --</option>
                                {allStudentNames.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
                              </select>
    
                              {/* Student detail bills list */}
                              {(() => {
                                const activeStud =
                                  selectedStudent || allStudentNames[0];
                                if (!activeStud) return null;
    
                                const listPays = getStudentPayments(
                                  activeStud,
                                  systemState.payments || [],
                                  systemState.costConfig,
                                  systemState.activeStudents,
                                  systemState.registeredStudents,
                                  systemState.customization,
                                );
                                const totalSiswaPaid = listPays
                                  .filter((p) => p.status === "Lunas")
                                  .reduce((s, c) => s + c.amount, 0);
                                const totalSiswaExpected = listPays.reduce(
                                  (s, c) => s + c.amount,
                                  0,
                                );
    
                                return (
                                  <div className="mt-2 space-y-2 border-t pt-2">
                                    <p className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wide">
                                      Buku Kas: {activeStud}
                                    </p>
                                    <div className="space-y-1.5">
                                      {listPays.map((p, index) => (
                                        <div
                                          key={p.id}
                                          className="p-2 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center justify-between gap-1 text-[10px]"
                                        >
                                          <span className="truncate max-w-[60%] font-semibold block text-slate-850">
                                            {index + 1}. {p.category}
                                          </span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <span className="font-mono text-slate-500 whitespace-nowrap">
                                              Rp {p.amount.toLocaleString("id-ID")}
                                            </span>
                                            <span
                                              className={`px-1.5 rounded font-bold uppercase text-[8px] ${
                                                p.status === "Lunas"
                                                  ? "bg-emerald-100 text-emerald-800"
                                                  : "bg-amber-100 text-amber-800"
                                              }`}
                                            >
                                              {p.status}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-xl text-[10px] font-mono font-bold text-indigo-950">
                                      <span>Total Setoran:</span>
                                      <span>
                                        Rp {totalSiswaPaid.toLocaleString("id-ID")}{" "}
                                        / Rp{" "}
                                        {totalSiswaExpected.toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : currentUser.role === "Pengajar" ? (
                    /* TEACHER PERSONAL WORKFLOW: ATTENDANCE, SALARY, CUTI */
                    <TeacherDashboardPanel
                      currentUser={currentUser}
                      systemState={systemState}
                      onUpdateState={handleUpdateState}
                      setActiveTab={(tab) => setActiveSubpage(tab === "kalender" ? "kalender" : tab)}
                    />
                  ) : (
                    /* CLIENT/STUDENT VIEW: CHOOSE AND CHECKOUT SINGLE-VIEW LIST */
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-3 text-[10.5px] leading-relaxed text-amber-900">
                        <p className="font-bold">💡 Petunjuk Pembayaran:</p>
                        <p className="opacity-90">
                          Siswa dapat melakukan pembayaran menggunakan{" "}
                          <strong>Cash</strong>, <strong>Transfer Rekening</strong>,
                          atau <strong>Virtual Account (Online VA / QRIS)</strong>{" "}
                          dengan mengklik salah satu tagihan Anda di bawah.
                        </p>
                      </div>
    
                      {getStudentPayments(
                        currentUser.name,
                        systemState.payments || [],
                        systemState.costConfig,
                        systemState.activeStudents,
                        systemState.registeredStudents,
                        systemState.customization,
                      ).map((payment, i) => {
                        const isPaid = payment.status === "Lunas";
                        return (
                          <div
                            key={i}
                            onClick={() => setActivePaymentDetail(payment)}
                            className="bg-slate-50 p-4 rounded-[24px] border border-slate-100/80 space-y-3 cursor-pointer hover:border-indigo-500 hover:shadow-xs transition-all duration-150 text-left"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate max-w-[65%]">
                                {payment.category}
                              </h4>
                              <span
                                className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded shrink-0 border ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : payment.status === "Pending"
                                      ? "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse"
                                      : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {payment.status === "Pending"
                                  ? "Menunggu Verifikasi"
                                  : payment.status}
                              </span>
                            </div>
    
                            <p className="text-[10px] text-slate-400 font-medium">
                              Metode: {payment.paymentMethod || "-"} • Tanggal:{" "}
                              {payment.date}
                            </p>
                            {payment.proofOfPayment && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                                <ImageIcon className="w-3 h-3" /> Ada Lampiran Bukti
                              </div>
                            )}
    
                            <div className="border-t border-slate-250/20 pt-2 flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-400">Total Tagihan:</span>
                              <strong className="text-slate-900">
                                Rp {payment.amount.toLocaleString("id-ID")}
                              </strong>
                            </div>
    
                            {!isPaid && payment.status !== "Pending" && (
                              <div className="mt-2 text-center text-[10px] font-black text-indigo-750 bg-indigo-55/40 p-1.5 rounded-lg border border-indigo-200 animate-pulse">
                                Klik untuk Bayar Sekarang
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
  );
}
