import React from "react";
import { MapPin } from "lucide-react";

interface MobilePetaSubpageProps {
  mobileMapRef: any;
}

export default function MobilePetaSubpage({ mobileMapRef }: MobilePetaSubpageProps) {
  return (
    <div className="p-4 space-y-3 text-left">
                  <h3 className="font-sans font-black text-slate-900 border-b pb-2 text-md">
                    PETA ALUMNI DI JEPANG
                  </h3>
                  <p className="text-xs text-slate-500">
                    Peta interaktif real-time sebaran alumni LPK yang telah sukses
                    berangkat dan bekerja di berbagai kota besar Jepang.
                  </p>
    
                  <div
                    ref={mobileMapRef}
                    className="w-full h-[400px] rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden z-10 bg-slate-100"
                  />
    
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-800 flex items-start gap-1.5 leading-relaxed font-semibold">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-red-950 font-black mb-0.5">
                        💡 PETUNJUK INTERAKTIF:
                      </strong>
                      Klik pada pin/lingkaran merah di dalam peta untuk memunculkan
                      jumlah alumni yang berada di lokasi tersebut.
                    </div>
                  </div>
                </div>
  );
}
