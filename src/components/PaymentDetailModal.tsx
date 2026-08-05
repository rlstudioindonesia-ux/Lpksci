import React, { useState } from "react";
import { createPortal } from "react-dom";
import { PaymentRecord, SystemState, UserAccount } from "../types";
import { Download, Upload, Check, X, Building, AlertCircle, Phone, Lock, CreditCard, Loader2 } from "lucide-react";
import { uploadFileToFirebase } from "../lib/storageHelper";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentDetailModalProps {
  payment: PaymentRecord;
  currentUser: UserAccount;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onClose: () => void;
}

export default function PaymentDetailModal({ payment, currentUser, systemState, onUpdateState, onClose }: PaymentDetailModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("Cash");
  const [senderBank, setSenderBank] = useState("");
  const [senderAccountName, setSenderAccountName] = useState("");
  const [proofFile, setProofFile] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Calculate billing parts: sisa tagihan & sudah dibayar
  const totalAmount = payment.amount;
  const initialSisa = payment.status === "Lunas" 
    ? 0 
    : payment.status === "Cicilan" 
      ? Math.max(payment.amount - 5000000, 3000000) 
      : payment.amount;
  const alreadyPaid = totalAmount - initialSisa;

  const [payAmountInput, setPayAmountInput] = useState<string>(initialSisa.toString());

  const handleProcessPayment = async () => {
    const nominalToPay = Number(payAmountInput) || initialSisa;

    if (selectedMethod === "Transfer" && (!senderBank || !senderAccountName || !proofFile)) {
      alert("Harap lengkapi bank pengirim, nama rekening, dan bukti transfer.");
      return;
    }
    
    if (selectedMethod === "Midtrans") {
      alert(`Memproses Rp ${nominalToPay.toLocaleString("id-ID")} ke Midtrans Checkout... (Simulasi sukses)`);
      const finalStatus = nominalToPay >= initialSisa ? "Lunas" : "Cicilan";
      await onUpdateState("payments", "update_payment", {
        id: payment.id,
        studentName: payment.studentName,
        category: payment.category,
        amount: payment.amount,
        paymentMethod: "Midtrans Virtual Account",
        status: finalStatus,
        isSigned: true,
        signatureDate: new Date().toLocaleDateString("id-ID")
      });
      alert(`Pembayaran Rp ${nominalToPay.toLocaleString("id-ID")} dengan Midtrans berhasil & lunas otomatis!`);
      onClose();
      return;
    }

    const finalStatus = nominalToPay >= initialSisa ? "Pending" : "Pending";
    await onUpdateState("payments", "update_payment", {
      id: payment.id,
      studentName: payment.studentName,
      category: payment.category,
      amount: payment.amount,
      paymentMethod: selectedMethod === "Transfer" ? `Transfer Mandiri` : "Cash",
      senderBank: selectedMethod === "Transfer" ? senderBank : undefined,
      senderAccountName: selectedMethod === "Transfer" ? senderAccountName : undefined,
      proofOfPayment: proofFile || undefined,
      status: "Pending"
    });
    alert(`Berhasil memproses pembayaran Rp ${nominalToPay.toLocaleString("id-ID")}. Menunggu verifikasi TTD admin.`);
    onClose();
  };

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadFileToFirebase(file, "payments");
        setProofFile(`${file.name}|${downloadUrl}`);
      } catch (err: any) {
        console.error(err);
        alert(`Gagal mengunggah bukti pembayaran: ${err.message || err}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePrintCashInvoice = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const isLunas = payment.status === "Lunas";
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text("INVOICE", pageWidth - 15, 20, { align: "right" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`# ${payment.id.slice(0, 12)}`, pageWidth - 15, 28, { align: "right" });

    // Logo / Company Name
    let currentY = 20;
    const logoUrl = systemState?.customization?.logoUrl;
    if (logoUrl) {
      try {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          const ratio = img.width / img.height;
          const height = 12;
          const width = height * ratio;
          doc.addImage(dataUrl, "PNG", 15, 12, width, height);
          currentY = 30;
        } else {
           doc.setFontSize(18);
           doc.setTextColor(30, 64, 175);
           doc.text(systemState?.customization?.logoText || "LPK SCI PATI", 15, 20);
        }
      } catch (e) {
        doc.setFontSize(18);
        doc.setTextColor(30, 64, 175);
        doc.text(systemState?.customization?.logoText || "LPK SCI PATI", 15, 20);
      }
    } else {
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(systemState?.customization?.logoText || "LPK SCI PATI", 15, 20);
    }
    
    // Address
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Jalan Raya Bongsri, Muktiharjo Kec Tlogowungu", 15, currentY + 8);
    doc.text("Kab Pati Kode pos 59163, Jawa Tengah", 15, currentY + 13);
    
    // Dates
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Tanggal Invoice:", pageWidth - 70, 45);
    doc.setFont("helvetica", "bold");
    doc.text(payment.date || new Date().toISOString().split("T")[0], pageWidth - 15, 45, { align: "right" });
    doc.setFont("helvetica", "normal");
    
    // Student Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Tagihan Ditujukan Kepada:", 15, 50);
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(payment.studentName, 15, 56);
    doc.setFont("helvetica", "normal");
    
    // Status Tagihan Banner Box
    if (isLunas) {
      doc.setFillColor(220, 252, 231);
      doc.setDrawColor(34, 197, 94);
      doc.rect(pageWidth - 85, 52, 70, 12, "FD");
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61);
      doc.setFont("helvetica", "bold");
      doc.text("STATUS: LUNAS", pageWidth - 50, 59, { align: "center" });
    } else {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.rect(pageWidth - 85, 52, 70, 12, "FD");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.setFont("helvetica", "bold");
      doc.text(`STATUS: ${payment.status.toUpperCase()} (BELUM LUNAS)`, pageWidth - 50, 59, { align: "center" });
    }
    doc.setFont("helvetica", "normal");

    // Table
    const tableData = [
      [
        payment.category, 
        payment.paymentMethod || "Metode Tunai / Transfer", 
        payment.status, 
        `Rp ${payment.amount.toLocaleString("id-ID")}`
      ]
    ];

    autoTable(doc, {
      startY: 75,
      head: [['Keterangan Tagihan', 'Metode Bayar', 'Status', 'Nominal Tagihan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' }
      },
      foot: [['', '', 'Total Nominal:', `Rp ${payment.amount.toLocaleString("id-ID")}`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' }
    });

    // Footer Ketentuan
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Catatan Ketentuan & Legalisasi:", 15, finalY + 15);
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    if (isLunas) {
      doc.text("1. Dokumen ini merupakan bukti pembayaran SAH dan LUNAS yang diterbitkan oleh LPK SCI.", 15, finalY + 22);
      doc.text("2. Seluruh setoran kas telah divalidasi oleh Admin Keuangan Siswa LPK SCI.", 15, finalY + 28);
    } else {
      doc.text("1. Dokumen ini merupakan Rincian Tagihan Resmi (Invoice Belum Lunas) dari LPK SCI.", 15, finalY + 22);
      doc.text("2. Silakan lakukan konfirmasi pelunasan melalui portal pembayaran atau kantor administrasi.", 15, finalY + 28);
    }

    // Stamp / TTD Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - 75, finalY + 15, 60, 28, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Pengesahan LPK SCI Pati", pageWidth - 45, finalY + 22, { align: "center" });
    if (isLunas) {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.text("[ SAH & TERVERIFIKASI ]", pageWidth - 45, finalY + 31, { align: "center" });
    } else {
      doc.setTextColor(217, 119, 6);
      doc.setFont("helvetica", "bold");
      doc.text("[ TERTUNDA / UNPAID ]", pageWidth - 45, finalY + 31, { align: "center" });
    }

    doc.save(`Invoice_${isLunas ? "LUNAS" : "TAGIHAN"}_${payment.studentName.replace(/\s+/g, "_")}_${payment.id.slice(0, 8)}.pdf`);

    // Notify Student if triggered by Admin
    if (currentUser.role !== "Siswa" && currentUser.role !== "Alumni") {
      const studentUser = systemState.users?.find(u => u.name === payment.studentName);
      if (studentUser && studentUser.username !== currentUser.username) {
        await onUpdateState("messages", "send", {
          senderId: currentUser.username,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          receiverId: studentUser.username,
          text: `Invoice PDF untuk ${payment.category} (${payment.status}) telah diunduh oleh Admin. Silakan periksa rincian di portal Anda.`,
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white max-w-lg w-full max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fade-in">
        <div className="bg-indigo-900 p-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-white text-sm">Form & Detail Pembayaran</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-white/50 hover:text-white bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-205 text-left space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-black text-slate-450 font-mono tracking-wider">{payment.category}</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                payment.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>{payment.status}</span>
            </div>

            <div className="space-y-1.5 pt-1 text-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span>Total Tagihan:</span>
                <span className="font-extrabold font-mono text-slate-900">Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>
              
              {payment.status === "Cicilan" && (
                <div className="flex justify-between items-center text-xs text-emerald-650">
                  <span>Sudah Dibayar Mandiri:</span>
                  <span className="font-mono font-bold">Rp {alreadyPaid.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1.5 mt-1.5 text-slate-900">
                <span className="font-extrabold">Sisa Tagihan / Sisa Tertagih:</span>
                <span className="font-mono font-black text-rose-600 text-sm">Rp {initialSisa.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {(payment.status === "Belum Bayar" || payment.status === "Pending" || payment.status === "Cicilan") && (
            <div className="space-y-4">
              
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-200 text-left space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-700 tracking-wide font-mono block">Jumlah nominal bayar sekarang (Rp):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-xs text-slate-500">Rp</span>
                  <input
                    type="number"
                    max={initialSisa}
                    value={payAmountInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Number(val) > initialSisa) {
                        setPayAmountInput(initialSisa.toString());
                      } else {
                        setPayAmountInput(val);
                      }
                    }}
                    className="w-full text-xs font-bold font-mono pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-blue-500"
                    placeholder="Masukkan nominal bayar"
                  />
                </div>
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    onClick={() => setPayAmountInput(initialSisa.toString())}
                    className="px-2 py-1 text-[8.5px] font-bold bg-blue-105 hover:bg-blue-200 text-blue-700 rounded-lg cursor-pointer bg-blue-100"
                  >
                    Bayar Lunas Semua
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPayAmountInput(Math.min(initialSisa, 2500000).toString())}
                    className="px-2 py-1 text-[8.5px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                  >
                    Atur Angsuran (Rp 2.5jt)
                  </button>
                </div>
              </div>

              <h5 className="text-xs font-bold text-slate-900 border-b pb-2 text-left">Pilih Metode Pembayaran</h5>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  onClick={() => setSelectedMethod("Cash")}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 ${
                    selectedMethod === "Cash" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building className="w-5 h-5" />
                  Bayar Cash
                </button>
                <button
                  onClick={() => setSelectedMethod("Transfer")}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 ${
                    selectedMethod === "Transfer" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Transfer Bank
                </button>
                <button
                  onClick={() => setSelectedMethod("Midtrans")}
                  className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 ${
                    selectedMethod === "Midtrans" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  } col-span-2`}
                >
                  <Lock className="w-4 h-4 hidden" />
                  Bayar via Virtual Account / Midtrans
                </button>
              </div>

              {selectedMethod === "Cash" && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-4 text-left">
                  <div>
                    <p className="font-bold text-slate-800">Pembayaran Cash / Tunai</p>
                    <p className="mt-1">Silakan datang ke kantor LPK SCI Pati dan bayar langsung di bagian admin keuangan siswa. Invoice akan ditandatangani admin saat pembayaran diterima.</p>
                  </div>

                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <label className="text-[10px] font-bold text-slate-700">Upload Bukti Pembayaran (Opsional)</label>
                    <input type="file" accept="image/*,application/pdf" disabled={isUploading} onChange={handleProofChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50" />
                    {isUploading && (
                      <p className="text-blue-600 font-bold text-[9px] flex items-center gap-1 mt-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Mengunggah bukti pembayaran...</span>
                      </p>
                    )}
                    {proofFile && !isUploading && (
                      <div className="space-y-1 mt-2">
                        <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                          <img 
                            src={proofFile.includes("|") ? proofFile.split("|")[1] : proofFile} 
                            alt="Preview Bukti Scan" 
                            referrerPolicy="no-referrer"
                            className="max-h-48 object-contain w-full"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600 font-bold text-[9px] block max-w-[80%] truncate">
                            ✓ Terpilih: {proofFile.includes("|") ? proofFile.split("|")[0] : "bukti.jpg"}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setProofFile("")} 
                            className="text-[9px] text-red-600 hover:underline font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleProcessPayment} className="w-full mt-2 py-2.5 bg-indigo-900 text-white rounded-lg font-bold cursor-pointer">
                    Pilih & Proses Cash (Rp {(Number(payAmountInput) || initialSisa).toLocaleString("id-ID")})
                  </button>
                </div>
              )}

              {selectedMethod === "Midtrans" && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-800 space-y-2 text-left">
                  <p className="font-bold">Pembayaran Virtual Account Midtrans (Tahap Pengembangan)</p>
                  <p>Fitur integrasi pembayaran otomatis menggunakan Midtrans saat ini masih dalam masa pengembangan. Silakan gunakan metode Transfer atau Cash.</p>
                  <button disabled className="w-full mt-2 py-2.5 bg-blue-300 text-white rounded-lg font-bold cursor-not-allowed opacity-70">
                    Belum Tersedia
                  </button>
                </div>
              )}

              {selectedMethod === "Transfer" && (
                <div className="space-y-3 text-left">
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[10px] text-amber-800 space-y-2">
                    <p className="font-bold">Rekening PT SCI Resmi:</p>
                    {systemState.customization?.paymentAccounts?.map((acc, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-amber-100 flex justify-between items-center">
                        <div>
                          <strong className="block">{acc.bankName}</strong>
                          <span>{acc.accountNumber}</span>
                          <span className="block text-[8px]">a.n {acc.holderName}</span>
                        </div>
                        <button onClick={() => alert("Tersalin!")} className="px-2 py-1 bg-amber-100 rounded text-amber-800 font-bold">Kopi</button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700">Bank Pengirim</label>
                    <input type="text" value={senderBank} onChange={e => setSenderBank(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 outline-none" placeholder="Misal: BCA, BRI, Mandiri" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700">Nama Pemilik Rekening Pengirim</label>
                    <input type="text" value={senderAccountName} onChange={e => setSenderAccountName(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 outline-none" placeholder="Nama sesuai buku tabungan" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700">Upload Bukti Transfer</label>
                    <input type="file" accept="image/*,application/pdf" disabled={isUploading} onChange={handleProofChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-50" />
                    {isUploading && (
                      <p className="text-blue-600 font-bold text-[9px] flex items-center gap-1 mt-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Mengunggah bukti transfer...</span>
                      </p>
                    )}
                    {proofFile && !isUploading && (
                      <div className="space-y-1 mt-2">
                        <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                          <img 
                            src={proofFile.includes("|") ? proofFile.split("|")[1] : proofFile} 
                            alt="Preview Bukti Scan" 
                            referrerPolicy="no-referrer"
                            className="max-h-48 object-contain w-full"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600 font-bold text-[9px] block max-w-[80%] truncate">
                            ✓ Terpilih: {proofFile.includes("|") ? proofFile.split("|")[0] : "bukti.jpg"}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setProofFile("")} 
                            className="text-[9px] text-red-600 hover:underline font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={handleProcessPayment} className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-lg font-bold cursor-pointer">
                    Kirim Bukti Pembayaran (Rp {(Number(payAmountInput) || initialSisa).toLocaleString("id-ID")})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ALWAYS VISIBLE INVOICE & PDF DOWNLOAD SECTION (LUNAS & BELUM LUNAS) */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-[10px] font-sans printable-invoice text-left space-y-0">
            <div className="p-3 bg-indigo-900 text-white flex justify-between items-center">
              <h4 className="font-extrabold tracking-wider uppercase flex items-center gap-1.5 text-xs">
                <CreditCard className="w-3.5 h-3.5"/> INVOICE RESMI LPK SCI
              </h4>
              <div className="font-mono text-[9px] opacity-80">{payment.id}</div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500 font-medium">Status Pembayaran</span>
                <span className={`font-black px-2 py-0.5 rounded text-[9px] uppercase ${
                  payment.status === "Lunas" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                  payment.status === "Cicilan" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                  payment.status === "Pending" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                  "bg-rose-100 text-rose-800 border border-rose-200"
                }`}>
                  {payment.status === "Lunas" ? "✓ LUNAS" : `⚠️ BELUM LUNAS (${payment.status})`}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Metode Transaksi</span>
                <strong className="text-slate-900">{payment.paymentMethod || "Metode Belum Dipilih / Tunai / Transfer"}</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Tanggal Record</span>
                <strong className="text-slate-900">{payment.date}</strong>
              </div>
              {payment.senderBank && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Info Pengirim</span>
                  <strong className="text-slate-900 text-right">{payment.senderBank} <br/><span className="font-normal">{payment.senderAccountName}</span></strong>
                </div>
              )}
              
              {payment.proofOfPayment && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Lampiran Bukti Transfer:</span>
                  <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                    <img 
                      src={payment.proofOfPayment.includes("|") ? payment.proofOfPayment.split("|")[1] : payment.proofOfPayment} 
                      alt="Bukti Pembayaran" 
                      referrerPolicy="no-referrer"
                      className="max-h-48 object-contain w-full"
                    />
                  </div>
                  <span className="text-[8px] text-slate-500 block text-center truncate">
                    File: {payment.proofOfPayment.includes("|") ? payment.proofOfPayment.split("|")[0] : "bukti_pembayaran.jpg"}
                  </span>
                </div>
              )}
              
              {payment.paymentMethod === "Cash" && (
                <div className="mt-3 border-2 border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2 bg-white">
                  <p className="font-bold text-slate-700">Pengesahan TTD Admin Keuangan SCI</p>
                  {payment.isSigned ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-mono text-xs font-bold -rotate-1">
                        DISAHKAN & LUNAS
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1">Oleh Admin - {payment.signatureDate}</span>
                    </div>
                  ) : (
                    <div className="opacity-60 space-y-1">
                      <div className="h-5 mx-auto w-24 border-b border-slate-400"></div>
                      <span className="text-[8px] text-slate-400">Belum Ditandatangani Admin</span>
                    </div>
                  )}
                </div>
              )}
              
              <button 
                type="button"
                onClick={handlePrintCashInvoice} 
                className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition active:scale-98 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" /> Unduh Invoice PDF ({payment.status === "Lunas" ? "Lunas" : "Belum Lunas"})
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  , document.body);
}
