const fs = require('fs');
let code = fs.readFileSync('src/components/PembayaranSiswaView.tsx', 'utf-8');

// Manual repair of the corrupted section
const brokenBlock = `                {editProofOfPayment && (
                  <div className="space-y-1 mt-2">
                    <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                      <img 
                      src={reviewingVerification.proofOfPayment.includes("|") ? reviewingVerification.proofOfPayment.split("|")[1] : reviewingVerification.proofOfPayment} 
                      alt="Bukti Pembayaran" 
                      referrerPolicy="no-referrer"
                      className="max-h-96 object-contain w-full"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs italic font-mono text-center p-4">
                      Tidak ada gambar bukti yang diunggah. <br/> (Simulasi Transfer / Cash Kantor)
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons controls */}
              <div className="pt-4 flex flex-col sm:flex-row gap-2 border-t mt-4">`;

const fixedBlock = `                {editProofOfPayment && (
                  <div className="space-y-1 mt-2">
                    <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                      <img 
                        src={editProofOfPayment.includes("|") ? editProofOfPayment.split("|")[1] : editProofOfPayment} 
                        alt="Bukti Scan" 
                        referrerPolicy="no-referrer"
                        className="max-h-48 object-contain w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-500 truncate block max-w-[80%] font-mono">
                        File: {editProofOfPayment.includes("|") ? editProofOfPayment.split("|")[0] : "bukti.jpg"}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setEditProofOfPayment("")} 
                        className="text-[9px] text-red-600 hover:underline font-bold"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-4 shrink-0">
                <button type="button" onClick={() => setShowEditPaymentModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4.4 REVIEW VERIFICATION POPUP (ADMIN ONLY) */}
      {reviewingVerification && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col text-left animate-fade-in my-auto">
            <div className="p-5 border-b bg-[#003566] text-white flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Review Bukti Pembayaran</h3>
              <button onClick={() => setReviewingVerification(null)} className="text-white/70 hover:text-white font-bold text-lg">×</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1.5 text-xs text-slate-700 border-b pb-3">
                <p>Nama Siswa: <strong>{reviewingVerification.studentName}</strong></p>
                <p>Kategori: <strong>{reviewingVerification.category}</strong></p>
                <p>Nominal: <strong className="text-indigo-850 font-mono text-sm">Rp {reviewingVerification.amount.toLocaleString("id-ID")}</strong></p>
                <p>Metode: <strong>{reviewingVerification.paymentMethod}</strong></p>
                {reviewingVerification.senderBank && (
                  <>
                    <p>Bank Pengirim: <strong>{reviewingVerification.senderBank}</strong></p>
                    <p>Atas Nama Pengirim: <strong>{reviewingVerification.senderAccountName}</strong></p>
                  </>
                )}
              </div>

              {/* Review Image display */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Lampiran Bukti Transfer</span>
                <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden min-h-[160px] flex items-center justify-center relative">
                  {reviewingVerification.proofOfPayment ? (
                    <img 
                      src={reviewingVerification.proofOfPayment.includes("|") ? reviewingVerification.proofOfPayment.split("|")[1] : reviewingVerification.proofOfPayment} 
                      alt="Bukti Pembayaran" 
                      referrerPolicy="no-referrer"
                      className="max-h-72 object-contain w-full"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs italic font-mono text-center p-4">
                      Tidak ada gambar bukti yang diunggah. <br/> (Simulasi Transfer / Cash Kantor)
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons controls */}
              <div className="pt-4 flex flex-col sm:flex-row gap-2 border-t mt-4">`;

if (code.includes(brokenBlock)) {
  code = code.replace(brokenBlock, fixedBlock);
  fs.writeFileSync('src/components/PembayaranSiswaView.tsx', code);
  console.log("Repaired");
} else {
  console.log("Not found");
}

