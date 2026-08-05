import React from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Penyimpanan",
  message = "Apakah Anda yakin ingin menyimpan perubahan ini?",
  confirmLabel,
  cancelLabel = "Batal"
}: ConfirmModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      // Lock body scroll to prevent under-modal scrolling on mobile
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const titleLower = title.toLowerCase();
  const isDestructive = titleLower.includes("hapus") || titleLower.includes("tolak") || titleLower.includes("delete") || titleLower.includes("reset");
  const defaultConfirmLabel = isDestructive ? (titleLower.includes("tolak") ? "Ya, Tolak" : "Ya, Hapus") : "Ya, Lanjutkan";
  const finalConfirmLabel = confirmLabel || defaultConfirmLabel;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center max-h-[90vh] overflow-y-auto">
          <div className="mb-6 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isDestructive 
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" 
                : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
            }`}>
              {isDestructive ? <Trash2 className="w-8 h-8" /> : <Check className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-[260px] mx-auto">{message}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center order-2 sm:order-1 cursor-pointer text-xs"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full sm:flex-1 px-4 py-3 text-white rounded-2xl font-black transition-all flex items-center justify-center shadow-md cursor-pointer text-xs ${
                isDestructive 
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
              }`}
            >
              {finalConfirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
