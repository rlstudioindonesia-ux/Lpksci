const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarView.tsx', 'utf8');

const oldRender = `            <div className="space-y-3">
              {filteredEventsForMe.length === 0 ? (
                <div className="py-6 text-center text-slate-450 border border-dashed rounded-2xl space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Notifikasi Kosong</p>
                  <p className="text-[9.5px] text-slate-450">Belum ada agenda spesifik baru untuk tipe akun Anda.</p>
                </div>
              ) : (
                filteredEventsForMe.map((n) => {`;

const newRender = `            <div className="mb-3">
              <div className="flex gap-2">
                <button 
                  onClick={() => { setShowPastInbox(false); setInboxPage(1); }}
                  className={\`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition \${!showPastInbox ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'}\`}
                >
                  Jadwal Mendatang
                </button>
                <button 
                  onClick={() => { setShowPastInbox(true); setInboxPage(1); }}
                  className={\`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition \${showPastInbox ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'}\`}
                >
                  Jadwal Lampau
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentInboxEvents.length === 0 ? (
                <div className="py-6 text-center text-slate-450 border border-dashed rounded-2xl space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Notifikasi Kosong</p>
                  <p className="text-[9.5px] text-slate-450">Belum ada agenda spesifik baru untuk tipe akun Anda.</p>
                </div>
              ) : (
                currentInboxEvents.map((n) => {`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/components/CalendarView.tsx', code);
