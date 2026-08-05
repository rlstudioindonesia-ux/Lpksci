import React from "react";
import { X } from "lucide-react";
import PrivacyPolicyView from "./PrivacyPolicyView";

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header wrapper to allow closing */}
        <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Kebijakan Privasi Portal Dokumen</span>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            id="close-privacy-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          <PrivacyPolicyView />
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] uppercase rounded-xl transition cursor-pointer shadow-md"
            id="privacy-close-confirm-btn"
          >
            Saya Mengerti & Setuju
          </button>
        </div>

      </div>
    </div>
  );
}

