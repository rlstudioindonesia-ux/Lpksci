import React from "react";
import { Activity, BarChart3, CheckSquare, ChevronLeft, ChevronRight, PieChart as LucidePieChart, Receipt, Search, TrendingUp, Users, Wallet } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AdminGajiSegmentProps {
  currentUser: any;
  editingSalId: any;
  hrFilterMonth: any;
  ledgerCategoryFilter: any;
  ledgerPage: any;
  ledgerSearch: any;
  onUpdateState: any;
  quickPayAmount: any;
  quickPayNotes: any;
  salAmount: any;
  salMonth: any;
  salNotes: any;
  salPaymentDate: any;
  salRole: any;
  salStaffName: any;
  salStatus: any;
  salarySubTab: any;
  selectedStaffForQuickPay: any;
  setEditingLedger: any;
  setEditingLedgerCategory: any;
  setEditingLedgerIsStudent: any;
  setEditingLedgerStudentName: any;
  setEditingSalId: any;
  setHrFilterMonth: any;
  setLedgerCategoryFilter: any;
  setLedgerPage: any;
  setLedgerSearch: any;
  setQuickPayAmount: any;
  setQuickPayNotes: any;
  setSalAmount: any;
  setSalMonth: any;
  setSalNotes: any;
  setSalPaymentDate: any;
  setSalRole: any;
  setSalStaffName: any;
  setSalStatus: any;
  setSalarySubTab: any;
  setSelectedStaffForQuickPay: any;
  systemState: any;
}

export default function AdminGajiSegment({ currentUser, editingSalId, hrFilterMonth, ledgerCategoryFilter, ledgerPage, ledgerSearch, onUpdateState, quickPayAmount, quickPayNotes, salAmount, salMonth, salNotes, salPaymentDate, salRole, salStaffName, salStatus, salarySubTab, selectedStaffForQuickPay, setEditingLedger, setEditingLedgerCategory, setEditingLedgerIsStudent, setEditingLedgerStudentName, setEditingSalId, setHrFilterMonth, setLedgerCategoryFilter, setLedgerPage, setLedgerSearch, setQuickPayAmount, setQuickPayNotes, setSalAmount, setSalMonth, setSalNotes, setSalPaymentDate, setSalRole, setSalStaffName, setSalStatus, setSalarySubTab, setSelectedStaffForQuickPay, systemState }: AdminGajiSegmentProps) {
  return (
    <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                  <div className="space-y-1 text-left">
                    <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span className="text-base">💼</span> Pengelolaan Buku Kas &
                      Penggajian Terpadu
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">
                      {currentUser?.role === "Admin Biasa" 
                        ? "Kelola absensi harian dan rekapitulasi presensi pengajar/staf."
                        : "Catat arus kas (in/out) LPK serta kelola penggajian staff/sensei secara transparan dan akurat."}
                    </p>
                  </div>
                  {currentUser?.role !== "Admin Biasa" && (
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
                      <button
                        onClick={() => setSalarySubTab("buku_kas")}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                          salarySubTab === "buku_kas"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Buku Kas (Ledger)
                      </button>
                      <button
                        onClick={() => setSalarySubTab("penggajian")}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                          salarySubTab === "penggajian"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Penggajian Staff
                      </button>
                      <button
                        onClick={() => setSalarySubTab("hr")}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                          salarySubTab === "hr"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        HR & Personalia
                      </button>
                      <button
                        onClick={() => setSalarySubTab("grafik_cashflow")}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                          salarySubTab === "grafik_cashflow"
                            ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-md scale-[1.02]"
                            : "bg-white/80 text-purple-700 hover:bg-white hover:text-purple-900 border border-purple-200/60"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Grafik Cashflow LPK</span>
                        <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-tight">SUPER & VVIP</span>
                      </button>
                    </div>
                  )}
                </div>
    
                {salarySubTab === "buku_kas" && currentUser?.role !== "Admin Biasa" && (() => {
                  const rawLedger = systemState.cashLedger || [];
                  const ledgerAsc = [...rawLedger].sort((a, b) => {
                    const dateA = a.date || "";
                    const dateB = b.date || "";
                    if (dateA !== dateB) return dateA.localeCompare(dateB);
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    if (timeA && timeB && timeA !== timeB) return timeA - timeB;
                    return (a.id || "").toString().localeCompare((b.id || "").toString());
                  });
                  let runningSaldo = 0;
                  const ledgerWithSaldoAsc = ledgerAsc.map((entry) => {
                    runningSaldo += entry.inAmount - entry.outAmount;
                    return { ...entry, saldo: runningSaldo };
                  });
                  const ledgerWithSaldoDesc = [...ledgerWithSaldoAsc].reverse();
                  const knownCodes = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9A", "P9B"];
                  const filteredLedger = ledgerWithSaldoDesc.filter(entry => {
                    const code = (entry.code || "DLL").toUpperCase();
                    const matchesCategory = ledgerCategoryFilter === "ALL" || code === ledgerCategoryFilter.toUpperCase() || (ledgerCategoryFilter === "DLL" && !knownCodes.includes(code));
                    return matchesCategory && (entry.description.toLowerCase().includes(ledgerSearch.toLowerCase()) || code.toLowerCase().includes(ledgerSearch.toLowerCase()));
                  });
                  const itemsPerPage = 10;
                  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage) || 1;
                  const currentPage = Math.min(Math.max(1, ledgerPage), totalPages);
                  const paginatedLedger = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
                  return (
                    <div className="space-y-6 animate-fade-in text-left">
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
                          <CheckSquare className="h-4 w-4" /> Input Jurnal Kas /
                          Penggajian
                        </h4>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
    
                            const pInAmount = fd.get("inAmount")?.toString() || "0";
                            const pOutAmount = fd.get("outAmount")?.toString() || "0";
                            const isExpense = pInAmount === "0" && pOutAmount !== "0";
    
                            onUpdateState("cashLedger", "add", {
                              code: fd.get("code"),
                              date: fd.get("date"),
                              description: fd.get("description"),
                              inAmount: isExpense ? 0 : Number(pInAmount),
                              outAmount: isExpense ? Number(pOutAmount) : 0,
                              createdAt: new Date().toISOString(),
                            });
    
                            e.currentTarget.reset();
                          }}
                          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Tanggal
                            </label>
                            <input
                              name="date"
                              type="date"
                              required
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                              defaultValue={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Kode Transaksi
                            </label>
                            <select
                              name="code"
                              required
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="P1">P1 - GAJI KARYAWAN</option>
                              <option value="P2">P2 - BIAYA OPERASIONAL</option>
                              <option value="P3">P3 - BIAYA PERJALANAN DINAS</option>
                              <option value="P4">P4 - BIAYA KONSUMSI</option>
                              <option value="P5">P5 - BIAYA INVENTARIS</option>
                              <option value="P6">P6 - BIAYA PERAWATAN GUDANG</option>
                              <option value="P7">P7 - BIAYA PENYUSUTAN</option>
                              <option value="P8">P8 - BIAYA LAINNYA</option>
                              <option value="P9A">P9A - PEMBAYARAN ONJOB</option>
                              <option value="P9B">P9B - PEMBAYARAN SISWA BARU</option>
                              <option value="DLL">DLL - LAINNYA</option>
                            </select>
                          </div>
                          <div className="space-y-1 lg:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Uraian / Keterangan
                            </label>
                            <input
                              name="description"
                              type="text"
                              required
                              placeholder="Cth: Gaji Satria Herlambang / Listrik Asrama"
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                            <label className="text-[10px] font-bold text-emerald-600 uppercase">
                              Pemasukan (IN)
                            </label>
                            <input
                              name="inAmount"
                              type="number"
                              defaultValue="0"
                              min="0"
                              placeholder="Rp"
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                            <label className="text-[10px] font-bold text-rose-600 uppercase">
                              Pengeluaran (OUT)
                            </label>
                            <input
                              name="outAmount"
                              type="number"
                              defaultValue="0"
                              min="0"
                              placeholder="Rp"
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2">
                            <button
                              type="submit"
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 text-xs rounded-lg transition"
                            >
                              Catat Buku Kas
                            </button>
                          </div>
                        </form>
                      </div>
                      <div className="flex flex-col gap-3 mt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <h4 className="text-sm font-bold text-slate-800">Daftar Transaksi</h4>
                          <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Cari uraian/kode..." value={ledgerSearch} onChange={(e) => { setLedgerSearch(e.target.value); setLedgerPage(1); }} className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                          </div>
                        </div>
                        
                        {/* Category Filter Buttons */}
                        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                          {[
                            { code: 'ALL', label: 'Semua Kategori' },
                            { code: 'P1', label: 'Gaji Karyawan' },
                            { code: 'P2', label: 'Operasional' },
                            { code: 'P3', label: 'Perjalanan Dinas' },
                            { code: 'P4', label: 'Konsumsi' },
                            { code: 'P5', label: 'Inventaris' },
                            { code: 'P6', label: 'Perawatan Gudang' },
                            { code: 'P7', label: 'Penyusutan' },
                            { code: 'P8', label: 'Biaya Lainnya' },
                            { code: 'P9A', label: 'OnJob' },
                            { code: 'P9B', label: 'Siswa Baru' },
                            { code: 'DLL', label: 'Lainnya' }
                          ].map(cat => (
                            <button
                              key={cat.code}
                              onClick={() => { setLedgerCategoryFilter(cat.code); setLedgerPage(1); }}
                              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${
                                ledgerCategoryFilter === cat.code 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-3">
                        <table className="w-full text-left text-xs md:text-sm">
                          <thead className="bg-[#a3e635]/20 border-b-2 border-[#166534] text-[#166534]">
                            <tr>
                              <th className="p-3 font-bold uppercase text-center w-12">No</th>
                              <th className="p-3 font-bold uppercase w-16 text-center">Kode</th>
                              <th className="p-3 font-bold uppercase">Kategori</th>
                              <th className="p-3 font-bold uppercase">Tanggal</th>
                              <th className="p-3 font-bold uppercase">Uraian Transaksi</th>
                              <th className="p-3 font-bold uppercase text-right">In (Rp)</th>
                              <th className="p-3 font-bold uppercase text-right">Out (Rp)</th>
                              <th className="p-3 font-bold uppercase text-right">Saldo (Rp)</th>
                              <th className="p-3 font-bold uppercase text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {paginatedLedger.map((entry, index) => {
                              const getCategoryName = (code: string) => {
                                switch(code) {
                                  case "P1": return "GAJI KARYAWAN";
                                  case "P2": return "BIAYA OPERASIONAL";
                                  case "P3": return "BIAYA PERJALANAN DINAS";
                                  case "P4": return "BIAYA KONSUMSI";
                                  case "P5": return "BIAYA INVENTARIS";
                                  case "P6": return "BIAYA PERAWATAN GUDANG";
                                  case "P7": return "BIAYA PENYUSUTAN";
                                  case "P8": return "BIAYA LAINNYA";
                                  case "P9A": return "PEMBAYARAN ONJOB";
                                  case "P9B": return "PEMBAYARAN SISWA BARU";
                                  case "DLL": return "LAINNYA";
                                  default: return "LAINNYA";
                                }
                              };
                              
                              return (
                              <tr key={entry.id} className="hover:bg-slate-50 transition even:bg-slate-50/50">
                                <td className="p-2 text-center text-slate-500 font-mono">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="p-2 text-center"><span className="font-bold text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">{entry.code || "DLL"}</span></td>
                                <td className="p-2"><span className="font-bold text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{getCategoryName(entry.code || "DLL")}</span></td>
                                <td className="p-2 text-slate-700 whitespace-nowrap">{entry.date}</td>
                                <td className="p-2 font-semibold text-slate-900">{entry.description}</td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-600">{entry.inAmount > 0 ? entry.inAmount.toLocaleString("id-ID") : "-"}</td>
                                <td className="p-2 text-right font-mono font-bold text-rose-600">{entry.outAmount > 0 ? entry.outAmount.toLocaleString("id-ID") : "-"}</td>
                                <td className={`p-2 text-right font-mono font-bold ${entry.saldo < 0 ? "text-rose-600" : "text-slate-900"}`}>{entry.saldo.toLocaleString("id-ID")}</td>
                                <td className="p-2 text-center flex items-center justify-center gap-1">
                                  <button onClick={() => {
                                    setEditingLedger(entry);
                                    setEditingLedgerIsStudent(false);
                                    setEditingLedgerStudentName("");
                                    setEditingLedgerCategory("");
                                  }} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition">Edit</button>
                                  <ConfirmButton 
                                    confirmTitle="Hapus Buku Kas"
                                    confirmMessage="Yakin hapus data transaksi ini?"
                                    onConfirmClick={() => onUpdateState('cashLedger', 'delete', { id: entry.id })}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition"
                                  >
                                    Hapus
                                  </ConfirmButton>
                                </td>
                              </tr>
                            ); })}
                            {paginatedLedger.length === 0 && (
                              <tr><td colSpan={9} className="p-8 text-center text-slate-400 italic text-xs">Buku Kas masih kosong.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <button onClick={() => setLedgerPage(Math.max(1, ledgerPage - 1))} disabled={ledgerPage === 1} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-xs font-bold text-slate-500">Hal {ledgerPage} dari {totalPages}</span>
                          <button onClick={() => setLedgerPage(Math.min(totalPages, ledgerPage + 1))} disabled={ledgerPage === totalPages} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      )}
    
                    </div>
                  );
                })()}
    
                {salarySubTab === "penggajian" && currentUser?.role !== "Admin Biasa" && (
                  <div className="space-y-6 animate-fade-in text-left">
                    <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
                        <Receipt className="h-4 w-4" /> Input Penggajian Staff
                      </h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const payload = {
                            staffName: salStaffName,
                            role: salRole,
                            amount: Number(salAmount),
                            monthString: salMonth,
                            status: salStatus,
                            paymentDate: salPaymentDate,
                            notes: salNotes,
                          };
                          if (editingSalId) {
                            onUpdateState("salaries", "edit", { id: editingSalId, ...payload });
                            setEditingSalId(null);
                          } else {
                            onUpdateState("salaries", "add", payload);
                          }
                          setSalStaffName("");
                          setSalRole("Pengajar");
                          setSalAmount("");
                          setSalMonth("");
                          setSalStatus("Pending");
                          setSalPaymentDate("");
                          setSalNotes("");
                        }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Staff</label>
                          <input
                            required
                            type="text"
                            value={salStaffName}
                            onChange={(e) => setSalStaffName(e.target.value)}
                            placeholder="Nama Lengkap"
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                          <select
                            required
                            value={salRole}
                            onChange={(e) => setSalRole(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          >
                            <option value="Pengajar">Pengajar (Sensei)</option>
                            <option value="Admin">Admin Keuangan</option>
                            <option value="Admin Biasa">Admin Biasa</option>
                            <option value="Umum">Umum / Lainnya</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan & Tahun</label>
                          <input
                            required
                            type="month"
                            value={salMonth}
                            onChange={(e) => setSalMonth(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nominal Gaji (Rp)</label>
                          <input
                            required
                            type="number"
                            min="0"
                            value={salAmount}
                            onChange={(e) => setSalAmount(e.target.value)}
                            placeholder="Misal: 4500000"
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Bayar</label>
                          <input
                            type="date"
                            value={salPaymentDate}
                            onChange={(e) => setSalPaymentDate(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Status Pembayaran</label>
                          <select
                            required
                            value={salStatus}
                            onChange={(e) => setSalStatus(e.target.value as any)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none font-bold"
                          >
                            <option value="Pending">Pending (Belum Lunas)</option>
                            <option value="Lunas">Lunas (Telah Dibayarkan)</option>
                          </select>
                        </div>
                        <div className="space-y-1 lg:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Tambahan</label>
                          <input
                            type="text"
                            value={salNotes}
                            onChange={(e) => setSalNotes(e.target.value)}
                            placeholder="Contoh: Pembayaran Gaji Pokok + Transport"
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1 text-right lg:col-span-1">
                          {editingSalId && (
                             <button
                               type="button"
                               onClick={() => {
                                 setEditingSalId(null);
                                 setSalStaffName("");
                                 setSalRole("Pengajar");
                                 setSalAmount("");
                                 setSalMonth("");
                                 setSalStatus("Pending");
                                 setSalPaymentDate("");
                                 setSalNotes("");
                               }}
                               className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold p-2 text-xs rounded-lg transition mr-2"
                             >
                               Batal
                             </button>
                          )}
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-4 text-xs rounded-lg transition"
                          >
                            {editingSalId ? "Simpan Perubahan" : "Simpan Data Gaji"}
                          </button>
                        </div>
                      </form>
                    </div>
    
                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-6">
                      <table className="w-full text-left text-xs md:text-sm">
                        <thead className="bg-indigo-50 border-b-2 border-indigo-200 text-indigo-900">
                          <tr>
                            <th className="p-3 font-bold uppercase w-12 text-center">No</th>
                            <th className="p-3 font-bold uppercase">Nama / Jabatan</th>
                            <th className="p-3 font-bold uppercase text-center">Bulan</th>
                            <th className="p-3 font-bold uppercase text-right">Gaji (Rp)</th>
                            <th className="p-3 font-bold uppercase text-center">Status</th>
                            <th className="p-3 font-bold uppercase text-center">Tgl Bayar</th>
                            <th className="p-3 font-bold uppercase text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...(systemState.salaries || [])].sort((a, b) => {
                            const dateA = a.paymentDate || a.monthString || "";
                            const dateB = b.paymentDate || b.monthString || "";
                            if (dateA !== dateB) return dateB.localeCompare(dateA);
                            return (b.createdAt || b.id || "").toString().localeCompare((a.createdAt || a.id || "").toString());
                          }).map((sal, idx) => (
                            <tr key={sal.id} className="hover:bg-slate-50 transition">
                              <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                              <td className="p-2">
                                <div className="font-bold text-slate-800">{sal.staffName}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{sal.role}</div>
                              </td>
                              <td className="p-2 text-center font-bold text-slate-700">
                                {sal.monthString}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-600">
                                {sal.amount.toLocaleString("id-ID")}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sal.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                  {sal.status}
                                </span>
                              </td>
                              <td className="p-2 text-center text-[10px] text-slate-500 font-mono">
                                {sal.paymentDate || "-"}
                              </td>
                              <td className="p-2 text-center flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSalId(sal.id);
                                    setSalStaffName(sal.staffName);
                                    setSalRole(sal.role);
                                    setSalAmount(sal.amount.toString());
                                    setSalMonth(sal.monthString);
                                    setSalStatus(sal.status);
                                    setSalPaymentDate(sal.paymentDate || "");
                                    setSalNotes(sal.notes || "");
                                    setSalarySubTab("penggajian");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition"
                                >
                                  Edit
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Data Gaji"
                                  confirmMessage="Yakin hapus data gaji ini?"
                                  onConfirmClick={() => onUpdateState("salaries", "delete", { id: sal.id })}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition"
                                >
                                  Hapus
                                </ConfirmButton>
                              </td>
                            </tr>
                          ))}
                          {(!systemState.salaries || systemState.salaries.length === 0) && (
                             <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic text-xs">Data penggajian masih kosong.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
    
                {salarySubTab === "hr" && (
                  <div className="space-y-8 animate-fade-in text-slate-800 text-left">
                    {/* 1. Monthly Filter & Header */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📅</span> Filter Rekapitulasi & Gaji Bulanan
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Pilih bulan untuk melihat statistik presensi, ketepatan waktu, dan melakukan pembayaran gaji terintegrasi.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Bulan:</label>
                        <input
                          type="month"
                          value={hrFilterMonth}
                          onChange={(e) => setHrFilterMonth(e.target.value)}
                          className="text-xs p-2 bg-white border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 font-bold cursor-pointer"
                        />
                      </div>
                    </div>
    
                    {/* 2. Bento Grid Rekapitulasi Bulanan */}
                    {(() => {
                      const indonesianMonths = [
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ];
                      const [yr, mn] = hrFilterMonth.split("-");
                      const monthIndex = parseInt(mn) - 1;
                      const indMonthName = indonesianMonths[monthIndex] || "";
                      const formattedMonthStr = `${indMonthName} ${yr}`;
    
                      const totalStaff = (systemState.users || []).filter(u => u.role === "Pengajar" || u.role === "Admin").length;
                      const totalMonthLogs = (systemState.logs || []).filter(l => 
                        l.type === "PRESENSI_PENGAJAR" && 
                        ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))
                      ).length;
    
                      const totalPaidSalary = (systemState.salaries || [])
                        .filter(sal => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Lunas")
                        .reduce((sum, sal) => sum + sal.amount, 0);
    
                      const totalPendingSalary = (systemState.salaries || [])
                        .filter(sal => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Pending")
                        .reduce((sum, sal) => sum + sal.amount, 0);
    
                      let allOnTime = 0;
                      let allTotal = 0;
                      (systemState.logs || []).filter(l => l.type === "PRESENSI_PENGAJAR" && ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))).forEach(log => {
                        if (log.description.includes("MASUK")) {
                          allTotal++;
                          const match = log.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                          let isLate = false;
                          if (match) {
                            const hrVal = parseInt(match[1]);
                            const minVal = parseInt(match[2]);
                            if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                              isLate = true;
                            }
                          } else {
                            const d = new Date(log.timestamp);
                            const hrVal = d.getHours();
                            const minVal = d.getMinutes();
                            if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                              isLate = true;
                            }
                          }
                          if (!isLate) {
                            allOnTime++;
                          }
                        }
                      });
                      const avgPunctuality = allTotal > 0 ? Math.round((allOnTime / allTotal) * 100) : 100;
    
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Total Staff */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">Total Staff / Pengajar</span>
                                <span className="text-xl">👥</span>
                              </div>
                              <div className="mt-3">
                                <h3 className="text-2xl font-black text-slate-900">{totalStaff} Orang</h3>
                                <p className="text-[9px] text-slate-500 mt-1 font-medium">Aktif mengajar & mengelola LPK</p>
                              </div>
                            </div>
    
                            {/* Card 2: Total Absensi */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">Kehadiran Staff ({indMonthName})</span>
                                <span className="text-xl">📝</span>
                              </div>
                              <div className="mt-3">
                                <h3 className="text-2xl font-black text-slate-900">{totalMonthLogs} Log</h3>
                                <p className="text-[9px] text-slate-500 mt-1 font-medium">Total tap/scan presensi masuk & pulang</p>
                              </div>
                            </div>
    
                            {/* Card 3: Ketepatan Waktu */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">Ketepatan Waktu ({indMonthName})</span>
                                <span className="text-xl">⏱️</span>
                              </div>
                              <div className="mt-3 text-left">
                                <h3 className={`text-2xl font-black ${avgPunctuality >= 85 ? "text-emerald-600" : avgPunctuality >= 70 ? "text-indigo-600" : "text-amber-600"}`}>
                                  {avgPunctuality}%
                                </h3>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                  <div 
                                    className={`h-1.5 rounded-full ${avgPunctuality >= 85 ? "bg-emerald-500" : avgPunctuality >= 70 ? "bg-indigo-500" : "bg-amber-500"}`}
                                    style={{ width: `${avgPunctuality}%` }}
                                  />
                                </div>
                              </div>
                            </div>
    
                            {/* Card 4: Gaji Terbayar */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">Gaji Terbayar ({indMonthName})</span>
                                <span className="text-xl">💵</span>
                              </div>
                              <div className="mt-3">
                                <h3 className="text-xl font-black text-emerald-600">Rp {totalPaidSalary.toLocaleString("id-ID")}</h3>
                                {totalPendingSalary > 0 && (
                                  <p className="text-[9px] text-rose-500 mt-1 font-bold">
                                    ⚠️ Rp {totalPendingSalary.toLocaleString("id-ID")} Belum Lunas
                                  </p>
                                )}
                                {totalPendingSalary === 0 && (
                                  <p className="text-[9px] text-emerald-600 mt-1 font-medium">
                                    ✓ Seluruh input gaji bulan ini lunas
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
    
                          {/* 3. Main Attendance & Salary Sync Table */}
                          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 text-left">
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                                  💵 SINKRONISASI ABSENSI & PEMBAYARAN GAJI STAFF
                                </h4>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Rekapitulasi ketepatan waktu & pembayaran gaji otomatis disinkronkan ke Buku Kas (Buku Kas Ledger).
                                </p>
                              </div>
                              <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full self-start">
                                Bulan: {formattedMonthStr}
                              </span>
                            </div>
    
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                                  <tr>
                                    <th className="p-3 w-12 text-center">No</th>
                                    <th className="p-3">Nama Staff / Role</th>
                                    <th className="p-3 text-center">Absen Masuk ({indMonthName})</th>
                                    <th className="p-3 text-center">Ketepatan Waktu</th>
                                    <th className="p-3">Info Rekening</th>
                                    <th className="p-3">Status Gaji ({indMonthName})</th>
                                    <th className="p-3 text-center">Aksi Sinkronisasi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(systemState.users || [])
                                    .filter(u => u.role === "Pengajar" || u.role === "Admin")
                                    .map((u, idx) => {
                                      // Calculate staff logs
                                      const staffLogs = (systemState.logs || []).filter(l => 
                                        l.type === "PRESENSI_PENGAJAR" && 
                                        (l.user === u.name || l.user === u.username) && 
                                        ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))
                                      );
                                      
                                      let checkIns = 0;
                                      let onTime = 0;
                                      let late = 0;
                                      
                                      staffLogs.forEach(l => {
                                        if (l.description.includes("MASUK")) {
                                          checkIns++;
                                          const match = l.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                                          let isLate = false;
                                          if (match) {
                                            const hrVal = parseInt(match[1]);
                                            const minVal = parseInt(match[2]);
                                            if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                                              isLate = true;
                                            }
                                          } else {
                                            const d = new Date(l.timestamp);
                                            const hrVal = d.getHours();
                                            const minVal = d.getMinutes();
                                            if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                                              isLate = true;
                                            }
                                          }
                                          if (isLate) {
                                            late++;
                                          } else {
                                            onTime++;
                                          }
                                        }
                                      });
    
                                      const punctualityRate = checkIns > 0 ? Math.round((onTime / checkIns) * 100) : 100;
    
                                      // Find salary record
                                      const salRecord = (systemState.salaries || []).find(sal => 
                                        sal.staffName === u.name && 
                                        (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr)
                                      );
    
                                      return (
                                        <React.Fragment key={u.username}>
                                          <tr className="hover:bg-slate-50 transition">
                                            <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                            <td className="p-3">
                                              <div className="font-bold text-slate-800">{u.name}</div>
                                              <div className="text-[10px] text-indigo-600 font-extrabold uppercase mt-0.5">{u.role}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                              <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                {checkIns} Hari Kerja
                                              </span>
                                            </td>
                                            <td className="p-3">
                                              {checkIns > 0 ? (
                                                <div className="flex flex-col items-center">
                                                  <span className={`text-[11px] font-black ${punctualityRate >= 85 ? "text-emerald-600 bg-emerald-50 border border-emerald-100" : punctualityRate >= 70 ? "text-indigo-600 bg-indigo-50 border border-indigo-100" : "text-amber-600 bg-amber-50 border border-amber-100"} px-2 py-0.5 rounded-md`}>
                                                    {punctualityRate}% Tepat Waktu
                                                  </span>
                                                  <span className="text-[9px] text-slate-400 mt-1">
                                                    ({onTime} Tepat, {late} Terlambat)
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-slate-400 italic text-[10px]">Belum ada absen</span>
                                              )}
                                            </td>
                                            <td className="p-3 font-mono text-[11px] text-slate-600">
                                              {u.bankAccount || "-"}
                                            </td>
                                            <td className="p-3">
                                              {salRecord ? (
                                                <div className="space-y-1">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${salRecord.status === "Lunas" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                                                      {salRecord.status}
                                                    </span>
                                                    <span className="font-bold text-slate-800">
                                                      Rp {salRecord.amount.toLocaleString("id-ID")}
                                                    </span>
                                                  </div>
                                                  {salRecord.paymentDate && (
                                                    <div className="text-[9px] text-slate-400 font-mono">Paid: {salRecord.paymentDate}</div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
                                                  Belum Diinput
                                                </span>
                                              )}
                                            </td>
                                            <td className="p-3 text-center">
                                              {salRecord?.status === "Lunas" ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                  <span className="text-emerald-600 font-black text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                                                    ✓ Sinkron Buku Kas
                                                  </span>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setSelectedStaffForQuickPay(selectedStaffForQuickPay === u.username ? null : u.username);
                                                    setQuickPayAmount(salRecord ? salRecord.amount.toString() : "4500000");
                                                    setQuickPayNotes("");
                                                  }}
                                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                                                >
                                                  <span>💵</span> {salRecord ? "Lunasi & Sinkron" : "Bayar Gaji"}
                                                </button>
                                              )}
                                            </td>
                                          </tr>
    
                                          {/* Quick Pay Inline Block */}
                                          {selectedStaffForQuickPay === u.username && (
                                            <tr>
                                              <td colSpan={7} className="bg-slate-50 p-4 border border-indigo-100/50">
                                                <div className="max-w-xl bg-white p-5 rounded-2xl border border-indigo-100 shadow-md space-y-4 text-left">
                                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                    <h5 className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                                                      <span>💸</span> Form Pembayaran Gaji Terintegrasi Buku Kas
                                                    </h5>
                                                    <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold">
                                                      Bulan: {formattedMonthStr}
                                                    </span>
                                                  </div>
    
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                    <div>
                                                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama Penerima</label>
                                                      <input 
                                                        type="text" 
                                                        disabled 
                                                        value={u.name} 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold outline-none"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nominal Pembayaran (Rp)</label>
                                                      <input 
                                                        type="number" 
                                                        value={quickPayAmount} 
                                                        onChange={(e) => setQuickPayAmount(e.target.value)}
                                                        placeholder="Cth: 4500000"
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-500"
                                                      />
                                                    </div>
                                                  </div>
    
                                                  <div>
                                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Catatan Pengeluaran Kas (Uraian)</label>
                                                    <input 
                                                      type="text" 
                                                      value={quickPayNotes} 
                                                      onChange={(e) => setQuickPayNotes(e.target.value)}
                                                      placeholder={`Cth: Pembayaran Gaji ${u.name} - ${formattedMonthStr}`}
                                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-indigo-500"
                                                    />
                                                  </div>
    
                                                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[10px] text-amber-800 font-medium leading-relaxed">
                                                    ⚠️ <strong>Informasi Sinkronisasi:</strong> Menekan tombol konfirmasi akan langsung:
                                                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                                                      <li>Mencatat penggajian lunas di database riwayat gaji staff.</li>
                                                      <li>Memasukkan pengeluaran otomatis (OUT) di <strong>Buku Kas (Ledger)</strong> dengan nominal Rp {Number(quickPayAmount || 0).toLocaleString("id-ID")} (Kode P1 - Gaji Karyawan).</li>
                                                    </ul>
                                                  </div>
    
                                                  <div className="flex justify-end gap-2.5 pt-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => setSelectedStaffForQuickPay(null)}
                                                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                                    >
                                                      Batal
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        const amt = Number(quickPayAmount);
                                                        if (!amt || amt <= 0) {
                                                          alert("Harap masukkan nominal gaji yang valid!");
                                                          return;
                                                        }
                                                        
                                                        const notesVal = quickPayNotes || `Gaji Staff: ${u.name} (${formattedMonthStr})`;
                                                        
                                                        // Perform integrated save
                                                        const salPayload = {
                                                          staffName: u.name,
                                                          role: u.role,
                                                          amount: amt,
                                                          monthString: hrFilterMonth,
                                                          status: "Lunas" as const,
                                                          paymentDate: new Date().toISOString().split("T")[0],
                                                          notes: notesVal
                                                        };
    
                                                        const salOk = await onUpdateState("salaries", "add", salPayload);
    
                                                        if (salOk) {
                                                          // Buku Kas Ledger (cashLedger)
                                                          await onUpdateState("cashLedger", "add", {
                                                            code: "P1", // Gaji Karyawan
                                                            date: new Date().toISOString().split("T")[0],
                                                            description: `Gaji Staff: ${u.name} (${formattedMonthStr})`,
                                                            inAmount: 0,
                                                            outAmount: amt
                                                          });
                                                          
                                                          alert(`Sukses! Gaji ${u.name} sebesar Rp ${amt.toLocaleString("id-ID")} telah lunas dibayarkan dan otomatis disinkronkan ke Buku Kas (Ledger).`);
                                                          setSelectedStaffForQuickPay(null);
                                                        } else {
                                                          alert("Terjadi kesalahan saat menyimpan data gaji.");
                                                        }
                                                      }}
                                                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-sm cursor-pointer"
                                                    >
                                                      Konfirmasi & Sinkronkan Kas
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()}
    
                    {/* 4. PENGAJUAN CUTI */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                        <span>🌴</span> Pengajuan Cuti Pengajar
                      </h3>
                      <div className="space-y-3">
                        {!(systemState.teacherLeaves?.length) && (
                          <p className="text-xs text-slate-500 italic text-left">Belum ada pengajuan cuti.</p>
                        )}
                        {(systemState.teacherLeaves || []).map(leave => (
                          <div key={leave.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                            <div className="text-left">
                              <p className="font-bold text-sm text-slate-800">{leave.teacherName}</p>
                              <p className="text-xs text-slate-500 mt-1">{leave.startDate} s/d {leave.endDate}</p>
                              <p className="text-[11px] text-slate-600 mt-2 p-2 bg-white rounded border border-slate-100">Alasan: {leave.reason}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${leave.status === "Disetujui" ? "bg-emerald-100 text-emerald-800" : leave.status === "Ditolak" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                                {leave.status}
                              </span>
                              {leave.status === "Pending" && (
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Disetujui" })} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer">Setujui</button>
                                  <button onClick={() => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Ditolak" })} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 cursor-pointer">Tolak</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
    
                    {/* 5. KONTRAK KERJA */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                        <span>📄</span> Kontrak Kerja LPK (Upload/Update)
                      </h3>
                      <div className="space-y-4">
                        {(systemState.users || []).filter(u => u.role === "Pengajar").map(u => {
                          const contract = (systemState.teacherContracts || []).find(c => c.teacherName === u.name);
                          return (
                            <div key={u.username} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-left">
                              <div>
                                <p className="font-bold text-xs text-slate-800">{u.name}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Status Kontrak: {contract ? contract.status : "Belum Ada"}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  const url = prompt("Masukkan Link Google Drive / File URL PDF Kontrak Kerja untuk " + u.name + ":");
                                  if (url) {
                                    if (contract) {
                                      onUpdateState("teacherContracts", "update", { id: contract.id, content: url, status: "Menunggu TTD" });
                                    } else {
                                      onUpdateState("teacherContracts", "add", { teacherName: u.name, content: url });
                                    }
                                  }
                                }} className="px-3 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded-lg hover:bg-sky-700 cursor-pointer">
                                  {contract ? "Update Kontrak" : "Upload Kontrak"}
                                </button>
                                {contract && contract.content && (
                                  <button onClick={() => window.open(contract.content, "_blank")} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 cursor-pointer">
                                    Lihat
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
    
                {salarySubTab === "grafik_cashflow" && (() => {
                  const ledger = systemState.cashLedger || [];
                  const months = [
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                  ];
    
                  let totalIn = 0;
                  let totalOut = 0;
                  const categoryBreakdown: Record<string, { name: string; amount: number; color: string }> = {
                    P1: { name: "Gaji & Insentif Staff/Sensei", amount: 0, color: "#8B5CF6" },
                    P2: { name: "Operasional, Listrik & Wifi", amount: 0, color: "#3B82F6" },
                    P3: { name: "Sewa Gedung & Fasilitas", amount: 0, color: "#EC4899" },
                    P4: { name: "Konsumsi, Asrama & Logistik", amount: 0, color: "#F59E0B" },
                    P5: { name: "Pajak, Legalitas & Lisensi", amount: 0, color: "#10B981" },
                    DLL: { name: "Lain-Lain / Insidental", amount: 0, color: "#64748B" },
                  };
    
                  const monthlyCashflowMap: Record<string, { in: number; out: number; net: number }> = {};
                  const salaryMap: Record<string, number> = {};
    
                  ledger.forEach((entry) => {
                    const inAmt = Number(entry.inAmount) || 0;
                    const outAmt = Number(entry.outAmount) || 0;
                    totalIn += inAmt;
                    totalOut += outAmt;
    
                    const rawCode = (entry.code || "DLL").toUpperCase();
                    let catKey = "DLL";
                    if (["P1", "P2", "P3", "P4", "P5"].includes(rawCode)) {
                      catKey = rawCode;
                    }
                    if (outAmt > 0) {
                      categoryBreakdown[catKey].amount += outAmt;
                    }
    
                    if ((rawCode === "P1" || entry.description.toLowerCase().includes("gaji")) && outAmt > 0) {
                      const staffName = entry.description.replace(/^gaji\s+/i, "").replace(/^p1\s+/i, "").trim() || "Staf / Sensei";
                      salaryMap[staffName] = (salaryMap[staffName] || 0) + outAmt;
                    }
    
                    if (entry.date) {
                      const dateParts = entry.date.split("-");
                      if (dateParts.length >= 2) {
                        const y = dateParts[0];
                        const mIdx = parseInt(dateParts[1], 10) - 1;
                        const mName = months[mIdx] || "Januari";
                        const key = `${mName} ${y}`;
                        if (!monthlyCashflowMap[key]) {
                          monthlyCashflowMap[key] = { in: 0, out: 0, net: 0 };
                        }
                        monthlyCashflowMap[key].in += inAmt;
                        monthlyCashflowMap[key].out += outAmt;
                        monthlyCashflowMap[key].net += (inAmt - outAmt);
                      }
                    }
                  });
    
                  const netSaldo = totalIn - totalOut;
    
                  const monthlyTrendData = Object.keys(monthlyCashflowMap).map((k) => ({
                    month: k,
                    Pemasukan: monthlyCashflowMap[k].in,
                    Pengeluaran: monthlyCashflowMap[k].out,
                    SurplusNetto: monthlyCashflowMap[k].net,
                  }));
    
                  const categoryPieData = Object.keys(categoryBreakdown)
                    .map(k => categoryBreakdown[k])
                    .filter(c => c.amount > 0);
    
                  const salaryListData = Object.keys(salaryMap)
                    .map(name => ({ name, total: salaryMap[name] }))
                    .sort((a, b) => b.total - a.total);
    
                  return (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* Banner */}
                      <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl border border-purple-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 z-10">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                              CASHFLOW & GAJI LPK
                            </span>
                            <span className="bg-purple-500/30 text-purple-200 text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-400/30">
                              Buku Kas Ledger Real-time
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-400" />
                            Grafik Analytics Cashflow & Penggajian LPK
                          </h3>
                          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                            Visualisasi arus kas masuk/keluar lembaga, alokasi pengeluaran per pos budget (Gaji P1, Operasional P2, dll), serta riwayat surplus/defisit bersih LPK PT SCI.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 z-10">
                          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
                            <div className="text-[9px] text-slate-300 font-mono uppercase font-bold">Saldo Kas Berjalan</div>
                            <div className={`text-base font-black font-mono ${netSaldo >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              Rp {netSaldo.toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                      </div>
    
                      {/* Summary Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Total Pemasukan Kas
                          </span>
                          <div className="text-lg font-black text-emerald-600 font-mono">
                            Rp {totalIn.toLocaleString("id-ID")}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">Akumulasi seluruh arus kas masuk</p>
                        </div>
    
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-rose-500" /> Total Pengeluaran Kas
                          </span>
                          <div className="text-lg font-black text-rose-600 font-mono">
                            Rp {totalOut.toLocaleString("id-ID")}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">Pengeluaran operasional & gaji</p>
                        </div>
    
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-purple-500" /> Surplus / Defisit Netto
                          </span>
                          <div className={`text-lg font-black font-mono ${netSaldo >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                            Rp {netSaldo.toLocaleString("id-ID")}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {netSaldo >= 0 ? "Surplus kas positif" : "Defisit kas sementara"}
                          </p>
                        </div>
    
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-amber-500" /> Total Alokasi Gaji (P1)
                          </span>
                          <div className="text-lg font-black text-amber-600 font-mono">
                            Rp {(categoryBreakdown.P1.amount).toLocaleString("id-ID")}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">Gaji staff & sensei terbayar</p>
                        </div>
                      </div>
    
                      {/* Chart Row 1: Area Trend Cashflow & Expense Breakdown Pie */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Area Chart: Tren Monthly Cashflow */}
                        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-purple-600" />
                              Tren Bulanan Pemasukan vs Pengeluaran Kas
                            </h4>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                              Grafik perbandingan arus kas bulanan berdasarkan catatan Buku Kas Ledger.
                            </p>
                          </div>
    
                          <div className="h-72 w-full pt-2">
                            {monthlyTrendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                                  <Tooltip
                                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, ""]}
                                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: "bold" }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                                  <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                                  <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                Belum ada entri ber-tanggal pada Buku Kas Ledger.
                              </div>
                            )}
                          </div>
                        </div>
    
                        {/* Donut Chart: Alokasi Pengeluaran per Pos SOP */}
                        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                              <LucidePieChart className="w-4 h-4 text-indigo-600" />
                              Distribusi Pengeluaran Per Pos Budget
                            </h4>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                              Persentase alokasi pengeluaran kas berdasarkan kode pos anggaran.
                            </p>
                          </div>
    
                          <div className="h-64 w-full flex flex-col items-center justify-center relative">
                            {categoryPieData.length > 0 ? (
                              <>
                                <ResponsiveContainer width="100%" height="100%">
                                  <RePieChart>
                                    <Pie
                                      data={categoryPieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={4}
                                      dataKey="amount"
                                    >
                                      {categoryPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Total Nominal"]}
                                      contentStyle={{ borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                                    />
                                  </RePieChart>
                                </ResponsiveContainer>
    
                                <div className="grid grid-cols-2 gap-1.5 w-full pt-1 max-h-24 overflow-y-auto">
                                  {categoryPieData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                      <span className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="truncate">{item.name}</span>
                                      </span>
                                      <span className="font-black font-mono text-slate-900 shrink-0">
                                        Rp {(item.amount / 1000000).toFixed(1)}M
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-slate-400 italic">Belum ada data pengeluaran terdaftar.</div>
                            )}
                          </div>
                        </div>
                      </div>
    
                      {/* Chart Row 2: Distribusi Penggajian Staf & Sensei */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            Akumulasi Penggajian Terbayar Per Staf / Sensei
                          </h4>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Rincian total nominal gaji yang telah dicairkan dan tercatat di Buku Kas.
                          </p>
                        </div>
    
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {salaryListData.map((s, idx) => (
                            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 text-xs block">{s.name}</span>
                                  <span className="text-[9px] text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                    Karyawan / Pengajar
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-900 text-xs font-mono block">
                                  Rp {s.total.toLocaleString("id-ID")}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">Total Dicairkan</span>
                              </div>
                            </div>
                          ))}
    
                          {salaryListData.length === 0 && (
                            <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                              Belum ada transaksi pengeluaran kategori Gaji (P1) yang dicatat di Buku Kas.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
  );
}
