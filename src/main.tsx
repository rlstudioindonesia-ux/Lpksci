import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDynamicImport = 
        this.state.error?.message?.includes('dynamically imported module') || 
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {isDynamicImport ? 'Pembaruan Modul Sistem' : 'Terjadi Kendala Tampilan'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isDynamicImport 
                ? 'Modul aplikasi baru saja diperbarui atau koneksi ke server sedang disinkronkan ulang. Silakan klik muat ulang untuk melanjutkan.'
                : 'Aplikasi mendeteksi kendala sementara pada antarmuka. Anda dapat memuat ulang halaman secara aman tanpa kehilangan data.'}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('lpk_cached_system_state');
                  } catch (e) {
                    console.warn(e);
                  }
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Coba Buka Kembali (Reset Cache)
              </button>
            </div>
            {this.state.error?.message && (
              <details open className="text-left text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3">
                <summary className="cursor-pointer font-bold text-slate-700 select-none">Detail Teknis Error</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[10px] text-rose-700 bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register PWA service worker for Chrome WebView & Add to Home Screen support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (import.meta as any)?.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('Service Worker registration skipped or failed:', err);
    });
  });
}
