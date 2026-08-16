import React from "react";
import { Camera, Download, Maximize2 } from "lucide-react";

interface MobileGaleriSubpageProps {
  setSelectedGalleryImage: any;
  systemState: any;
}

export default function MobileGaleriSubpage({ setSelectedGalleryImage, systemState }: MobileGaleriSubpageProps) {
  return (
    <div className="p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-sans font-black text-slate-900 text-md flex items-center gap-2">
                      <Camera className="w-4 h-4 text-pink-600" />
                      <span>Galeri Foto LPK</span>
                    </h3>
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                      Klik foto untuk Perbesar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Mengabadikan momen-momen penting dari asrama LPK Pati hingga touchdown di berbagai kota besar Jepang.
                  </p>
    
                  {(systemState.galleries || []).length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed rounded-2xl">
                      Belum ada foto galeri.
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(systemState.galleries || []).map((item: any, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedGalleryImage({
                          image: item.image || item.img,
                          title: item.title,
                          tag: item.tag || "GALERI LPK",
                          description: item.description || ""
                        })}
                        className="group bg-slate-50 p-2 rounded-[20px] border border-slate-200 overflow-hidden space-y-1.5 shadow-xs hover:shadow-md hover:border-pink-300 transition cursor-pointer flex flex-col justify-between active:scale-95"
                      >
                        <div className="relative rounded-xl overflow-hidden h-28 bg-slate-900">
                          <img
                            src={item.image || item.img}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='14' text-anchor='middle' dy='.3em'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <div className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-lg backdrop-blur-xs">
                            <Maximize2 className="w-3 h-3 text-pink-300" />
                          </div>
                        </div>
                        <div className="px-1 py-0.5">
                          <p className="text-[10.5px] font-black text-slate-900 truncate leading-tight">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-pink-600 font-bold mt-1">
                            <span>Perbesar</span>
                            <Download className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
  );
}
