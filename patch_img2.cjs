const fs = require('fs');
let code = fs.readFileSync('src/components/PembayaranSiswaView.tsx', 'utf-8');

// I replaced editProofOfPayment with reviewingVerification by mistake. Let's fix that block.
const badBlock = `                      <img \n                      src={reviewingVerification.proofOfPayment.includes("|") ? reviewingVerification.proofOfPayment.split("|")[1] : reviewingVerification.proofOfPayment} \n                      alt="Bukti Pembayaran" \n                      referrerPolicy="no-referrer"\n                      className="max-h-96 object-contain w-full"\n                    />                  ) : (\n                    <div className="text-slate-400 text-xs italic font-mono text-center p-4">\n                      Tidak ada gambar bukti yang diunggah. <br/> (Simulasi Transfer / Cash Kantor)\n                    </div>\n                  )}\n                </div>`;

// Wait, the regex replace was: 
// /<img[\s\S]*?src=\{reviewingVerification\.proofOfPayment[\s\S]*?\/>/
// And it matched from the first img tag to the reviewingVerification img tag!

// Let's manually replace the broken block by doing a regex from "editProofOfPayment && (" to the end of the img tag.

