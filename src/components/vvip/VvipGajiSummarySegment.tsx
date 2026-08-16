import React from "react";
import { Activity, Map, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VvipGajiSummarySegmentProps {
  COLORS: any;
  STATUS_COLORS: any;
  activeStudents: any;
  currentViewMode: any;
  financialData: any;
  prefectureDataForChart: any;
  studentStatusDataForChart: any;
}

export default function VvipGajiSummarySegment({ COLORS, STATUS_COLORS, activeStudents, currentViewMode, financialData, prefectureDataForChart, studentStatusDataForChart }: VvipGajiSummarySegmentProps) {
  return (
    <>
              <section className="grid gap-6 md:grid-cols-5">
                {/* Chart A: Monthly Financial liquidity (Recharts AreaChart) */}
                <div className={`bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 ${currentViewMode === "gaji" ? "md:col-span-5" : "md:col-span-3"}`}>
              <div>
                <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                  Arus Likuiditas Finansial LPK & Pajak Badan
                </h4>
                <p className="text-[11px] text-slate-500">
                  Menyajikan komparasi omzet terbayar, pembelanjaan operasional,
                  biaya PPN 11% dan sisa keuntungan bersih LPK.
                </p>
              </div>
    
              <div className="h-[280px]">
                {financialData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={financialData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip
                        formatter={(value: any) =>
                          `Rp ${Number(value).toLocaleString("id-ID")}`
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area
                        type="monotone"
                        dataKey="Pendapatan"
                        stroke="#2563eb"
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="KeuntunganBersih"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        strokeWidth={2}
                        name="Margin Bersih"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Belum ada rincian data masa pajak bulanan
                  </div>
                )}
              </div>
            </div>
    
            {/* Chart B: Alumnus Distribution Pie Chart */}
            {currentViewMode !== "gaji" && (
            <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
              <div>
                <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <Map className="h-4.5 w-4.5 text-emerald-600" />
                  Destinasi Penempatan Prefektur Alumni
                </h4>
                <p className="text-[11px] text-slate-500">
                  Proporsi persebaran alumni sukses yang sedang terikat kontrak
                  kerja di Jepang.
                </p>
              </div>
    
              <div className="h-[220px] flex items-center justify-center relative">
                {prefectureDataForChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prefectureDataForChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {prefectureDataForChart.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} Siswa`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Belum ada alumni penempatan luar negeri
                  </div>
                )}
    
                {/* Overlay total sum details */}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Total
                  </span>
                  <span className="text-xl font-mono font-bold text-slate-900">
                    {activeStudents.filter(s => s.status === "Di Jepang").length}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Prefektur
                  </span>
                </div>
              </div>
    
              {/* Color list legend */}
              <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 font-semibold font-mono border-t pt-3">
                {prefectureDataForChart.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></span>
                    <span>
                      {entry.name}: {entry.value} S
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}
    
            {/* Chart C: Student Status Strategic Distribution */}
            {currentViewMode !== "gaji" && (
            <div className="md:col-span-5 bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
                <div>
                  <h4 className="font-display font-black text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
                    Pemantauan Status & Alur Belajar Siswa Strategis
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Distribusi real-time tahapan bimbingan belajar, progress wawancara kerja (Job SO), pelatihan asrama diklat, hingga status keberangkatan di Jepang.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 px-3.5 py-1.5 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-wider self-start sm:self-center">
                  Total: {activeStudents.length} Total Peserta
                </div>
              </div>
    
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Donut Chart */}
                <div className="lg:col-span-5 h-[230px] flex items-center justify-center relative">
                  {studentStatusDataForChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentStatusDataForChart}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {studentStatusDataForChart.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} Siswa`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Belum ada data status siswa aktif
                    </div>
                  )}
    
                  {/* Center count info overlay */}
                  <div className="absolute text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Peserta
                    </span>
                    <span className="text-2xl font-mono font-black text-slate-900">
                      {activeStudents.length}
                    </span>
                    <span className="text-[9px] text-slate-500 block font-semibold">
                      LPK SCI
                    </span>
                  </div>
                </div>
    
                {/* Right: Detailed metrics cards with custom progress bars */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "🇮🇩 1. BELAJAR", statusKey: "Belajar", desc: "Siswa sedang menempuh diklat bahasa Jepang dasar di LPK.", colorClass: "bg-red-500", textClass: "text-red-700", bgClass: "bg-red-50/70 border-red-100" },
                    { label: "💼 2. ON PROGRES JOB", statusKey: "On Proges Job", desc: "Siswa sedang dalam proses matching, seleksi, atau interview wawancara SO Jepang.", colorClass: "bg-orange-500", textClass: "text-orange-700", bgClass: "bg-orange-50/70 border-orange-100" },
                    { label: "📋 3. ON PROGRES JFT/JLPT/SSW", statusKey: "On Progres JFT/JLPT/SSW", desc: "Siswa mempersiapkan diri dan mengikuti ujian kemampuan JFT-Basic/JLPT & SSW.", colorClass: "bg-yellow-500", textClass: "text-yellow-700", bgClass: "bg-yellow-50/70 border-yellow-100" },
                    { label: "📘 4. DIKLAT SO", statusKey: "Diklat SO", desc: "Siswa telah lulus wawancara job dan mengikuti diklat pra-pemberangkatan khusus SO.", colorClass: "bg-cyan-500", textClass: "text-cyan-700", bgClass: "bg-cyan-50/70 border-cyan-100" },
                    { label: "🎓 5. LULUS", statusKey: "Lulus", desc: "Siswa telah menyelesaikan seluruh tahapan pelatihan dan bersiap berangkat.", colorClass: "bg-violet-500", textClass: "text-violet-700", bgClass: "bg-violet-50/70 border-violet-100" },
                    { label: "🇯🇵 6. DI JEPANG", statusKey: "Di Jepang", desc: "Alumni sukses yang telah bermigrasi dan bekerja aktif di prefektur Jepang.", colorClass: "bg-emerald-500", textClass: "text-emerald-700", bgClass: "bg-emerald-50/70 border-emerald-100" }
                  ].map((item) => {
                    const count = activeStudents.filter(s => item.statusKey === "Belajar" ? !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW"].includes(s.status || "") : s.status === item.statusKey).length;
                    const percentage = activeStudents.length > 0 ? Math.round((count / activeStudents.length) * 100) : 0;
                    return (
                      <div key={item.label} className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 ${item.bgClass}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-800 tracking-tight">{item.label}</span>
                          <span className={`text-[10px] font-mono font-extrabold ${item.textClass}`}>{count} Sis ({percentage}%)</span>
                        </div>
                        <p className="text-[9.5px] text-slate-550 leading-normal font-medium">{item.desc}</p>
                        <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden mt-1">
                          <div className={`h-full ${item.colorClass} rounded-full`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </section>
            </>
  );
}
