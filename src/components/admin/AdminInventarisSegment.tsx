import React from "react";
import { Edit, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";

interface AdminInventarisSegmentProps {
  getAvailableInventoryAreas: any;
  handleInventoryDelete: any;
  inventoryAreaFilter: any;
  setEditInvAmount: any;
  setEditInvCondition: any;
  setEditInvLoc: any;
  setEditInvName: any;
  setEditingInventoryItem: any;
  setInventoryAreaFilter: any;
  setIsCreateInventoryModalOpen: any;
  setIsManageInventoryAreasModalOpen: any;
  systemState: any;
}

export default function AdminInventarisSegment({ getAvailableInventoryAreas, handleInventoryDelete, inventoryAreaFilter, setEditInvAmount, setEditInvCondition, setEditInvLoc, setEditInvName, setEditingInventoryItem, setInventoryAreaFilter, setIsCreateInventoryModalOpen, setIsManageInventoryAreasModalOpen, systemState }: AdminInventarisSegmentProps) {
  return (
    <div className="space-y-6">
                {/* Rekapitulasi Keseluruhan Inventaris */}
                {(() => {
                  const items = systemState.inventory || [];
                  const totalUnique = items.length;
                  const totalUnits = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  const baikCount = items.filter(i => i.condition === "Baik").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  const perluServisCount = items.filter(i => i.condition === "Perlu Servis").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  const rusakCount = items.filter(i => i.condition === "Rusak").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                  const uniqueLocations = new Set(items.map(i => i.location).filter(Boolean)).size;
    
                  return (
                    <div className="bg-indigo-900/5 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4 animate-fade-in text-left">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-900 text-white rounded-lg">
                          <Package className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-indigo-900">Rekap Keseluruhan Inventaris</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Informasi konsolidasi aset, logistik, dan kondisi fisik LPK secara real-time</p>
                        </div>
                      </div>
    
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                        {/* Card 1 */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aset Unik</span>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-800">{totalUnique}</span>
                            <span className="text-[10px] font-bold text-slate-500">Kategori</span>
                          </div>
                        </div>
    
                        {/* Card 2 */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kuantitas</span>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-blue-600">{totalUnits}</span>
                            <span className="text-[10px] font-bold text-slate-500">Unit (Pcs)</span>
                          </div>
                        </div>
    
                        {/* Card 3 */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Baik
                          </span>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-600">{baikCount}</span>
                            <span className="text-[10px] font-bold text-emerald-500">Pcs</span>
                          </div>
                        </div>
    
                        {/* Card 4 */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Perlu Servis
                          </span>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-amber-600">{perluServisCount}</span>
                            <span className="text-[10px] font-bold text-amber-500">Pcs</span>
                          </div>
                        </div>
    
                        {/* Card 5 */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left col-span-2 md:col-span-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            📍 Distribusi Area
                          </span>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-indigo-600">{uniqueLocations}</span>
                            <span className="text-[10px] font-bold text-slate-500">Lokasi</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
    
                <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateInventoryModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" /> Registrasi Inventaris Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManageInventoryAreasModalOpen(true)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <MapPin className="h-4 w-4 text-indigo-600" /> Edit & Tambah Area Penempatan
                    </button>
                  </div>
    
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">Filter Area:</span>
                    <select
                      value={inventoryAreaFilter}
                      onChange={(e) => setInventoryAreaFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">Semua Area ({systemState.inventory?.length || 0} barang)</option>
                      {getAvailableInventoryAreas().map(area => {
                        const count = (systemState.inventory || []).filter(i => i.location === area).length;
                        return (
                          <option key={area} value={area}>{area} ({count} barang)</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
    
                {/* Inventory checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Verifikasi Logistik & Inventaris LPK
                    </span>
                  </div>
    
                  {/* Desktop Table - Hidden on Mobile */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs">
                    <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                            KODE ASET
                          </th>
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                            NAMA BARANG
                          </th>
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">
                            JUMLAH
                          </th>
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                            LOKASI
                          </th>
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">
                            KONDISI
                          </th>
                          <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {systemState.inventory
                          .filter(item => inventoryAreaFilter === "ALL" || item.location === inventoryAreaFilter)
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="md:p-3 p-1.5 py-2 font-mono text-[9px] text-slate-400">
                                {item.code}
                              </td>
                              <td className="md:p-3 p-1.5 py-2 font-bold text-slate-900">
                                {item.itemName}
                              </td>
                              <td className="md:p-3 p-1.5 py-2 font-semibold text-slate-700 text-center">
                                {item.amount} Pcs
                              </td>
                              <td className="md:p-3 p-1.5 py-2 text-slate-600 font-medium">
                                📍 {item.location}
                              </td>
                              <td className="md:p-3 p-1.5 py-2 text-center">
                                <span
                                  className={`font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                                    item.condition === "Baik"
                                      ? "bg-emerald-50 text-emerald-800"
                                      : item.condition === "Perlu Servis"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {item.condition}
                                </span>
                              </td>
                              <td className="md:p-3 p-1.5 py-2 text-center flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingInventoryItem(item);
                                    setEditInvName(item.itemName);
                                    setEditInvAmount(String(item.amount));
                                    setEditInvCondition(item.condition);
                                    setEditInvLoc(item.location || "Kantor Utama Manajemen");
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Edit Inventaris"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Inventaris"
                                  confirmMessage={`Hapus barang ${item.itemName} dari daftar aset?`}
                                  onConfirmClick={() => handleInventoryDelete(item)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </ConfirmButton>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
    
                  {/* Mobile Cards - Shown on Mobile */}
                  <div className="block md:hidden space-y-2.5">
                    {systemState.inventory
                      .filter(item => inventoryAreaFilter === "ALL" || item.location === inventoryAreaFilter)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative"
                        >
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-mono text-[9px] text-indigo-900 bg-blue-50 font-bold px-1.5 py-0.5 rounded">
                              {item.code}
                            </span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-[8.5px] uppercase ${
                                item.condition === "Baik"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : item.condition === "Perlu Servis"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.condition}
                            </span>
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-xs text-slate-900">
                                {item.itemName}
                              </div>
                              <div className="text-slate-400 text-[10px] mt-0.5 font-medium">
                                📍 {item.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-slate-800 bg-blue-50/50 border px-2 py-0.5 rounded-lg">
                                {item.amount} Pcs
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-end items-center border-t pt-1.5 mt-1 gap-2">
                            <button
                              onClick={() => {
                                setEditingInventoryItem(item);
                                setEditInvName(item.itemName);
                                setEditInvAmount(String(item.amount));
                                setEditInvCondition(item.condition);
                                setEditInvLoc(item.location || "Kantor Utama Manajemen");
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              <Edit className="h-3 w-3" /> Edit
                            </button>
                            <ConfirmButton
                              confirmTitle="Hapus Inventaris"
                              confirmMessage={`Hapus barang ${item.itemName} dari daftar aset?`}
                              onConfirmClick={() => handleInventoryDelete(item)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                              <Trash2 className="h-3 w-3" /> Hapus
                            </ConfirmButton>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
  );
}
