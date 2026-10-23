import type { Request, Response } from "express";
import { syncEntityToFirestore, syncEntityToFirestoreAsync, deleteEntityFromFirestore, touchSyncMeta } from "../../src/db/firebase-adapter.ts";
import { uniqueIdSuffix } from "../../src/lib/idGenerator.ts";
import { findRecordIndex } from "../../src/lib/recordMatching.ts";
import { planLedgerSyncForPayment } from "../../src/lib/paymentLedger.ts";

// Keeps the auto-created Buku Kas income entry (code === payment.id) in step with
// its payment (see src/lib/paymentLedger.ts).
function syncLedgerForPayment(state: any, payment: any) {
  if (!state.cashLedger) state.cashLedger = [];
  const plan = planLedgerSyncForPayment(state.cashLedger, payment);
  if (plan.kind === "add") {
    const newLedger = {
      id: `CAS-${uniqueIdSuffix()}`,
      code: payment.id,
      date: new Date().toISOString().split("T")[0],
      description: `Pembayaran ${payment.category} - ${payment.studentName}`,
      inAmount: plan.inAmount,
      outAmount: 0
    };
    state.cashLedger.push(newLedger);
    syncEntityToFirestore("cashLedger", newLedger.id, newLedger);
  } else if (plan.kind === "update") {
    state.cashLedger[plan.index] = { ...state.cashLedger[plan.index], inAmount: plan.inAmount };
    syncEntityToFirestore("cashLedger", state.cashLedger[plan.index].id, state.cashLedger[plan.index]);
  } else if (plan.kind === "remove") {
    const [removed] = state.cashLedger.splice(plan.index, 1);
    if (removed?.id) deleteEntityFromFirestore("cashLedger", removed.id);
  }
}

// Cash ledger, payments, taxes, and program cost config
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export async function handleFinanceState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "cashLedger" && action === "add") {
      if (!state.cashLedger) state.cashLedger = [];
      const newLedger = {
        id: `CAS-${uniqueIdSuffix()}`,
        code: payload.code || "",
        date: payload.date || new Date().toISOString().split("T")[0],
        description: payload.description || "",
        inAmount: Number(payload.inAmount) || 0,
        outAmount: Number(payload.outAmount) || 0,
        createdAt: payload.createdAt || new Date().toISOString()
      };
      state.cashLedger.push(newLedger);
      syncEntityToFirestore("cashLedger", newLedger.id, newLedger);
      return res.json({ success: true, item: newLedger });
    }


    if (dataType === "cashLedger" && action === "edit") {
      const { id, code, date, description, inAmount, outAmount } = payload;
      const idx = state.cashLedger.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        state.cashLedger[idx] = {
          ...state.cashLedger[idx],
          code, date, description,
          inAmount: Number(inAmount) || 0,
          outAmount: Number(outAmount) || 0
        };
        syncEntityToFirestore("cashLedger", id, state.cashLedger[idx]);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Not found" });
    }


    if (dataType === "cashLedger" && action === "delete") {
      const { id } = payload;
      state.cashLedger = state.cashLedger.filter((c: any) => c.id !== id);
      if (id) deleteEntityFromFirestore("cashLedger", id);
      return res.json({ success: true, id });
    }


    if (dataType === "payments" && action === "add") {
      const payId = payload.id || `PAY-${uniqueIdSuffix()}`;
      const newPay = {
        id: payId,
        studentName: payload.studentName || "",
        category: payload.category || "",
        amount: payload.amount !== undefined ? Number(payload.amount) : 0,
        date: payload.date || new Date().toISOString().split("T")[0],
        status: payload.status || "Belum Bayar",
        ...payload
      };
      const existingIdx = state.payments.findIndex(p => p.id === payId);
      if (existingIdx !== -1) {
        state.payments[existingIdx] = { ...state.payments[existingIdx], ...newPay };
      } else {
        state.payments.unshift(newPay);
      }
      syncEntityToFirestore("payments", payId, existingIdx !== -1 ? state.payments[existingIdx] : newPay);
      return res.json({ success: true, item: newPay });
    }


    if (dataType === "payments" && action === "status") {
      const payId = payload.id;
      const index = state.payments.findIndex(p => p.id === payId);
      if (index !== -1) {
        state.payments[index].status = payload.status;
        
        // Synchronize corresponding manual payment state inside registeredStudents if name matches
        const pName = state.payments[index].studentName;
        // Only when the name identifies exactly one registration (shared names
        // used to mark the wrong applicant as paid).
        const regMatchIdx = findRecordIndex(state.registeredStudents, { name: pName });
        const regMatch = regMatchIdx !== -1 ? state.registeredStudents[regMatchIdx] : undefined;
        if (regMatch) {
          regMatch.paymentStatus = payload.status;
          syncEntityToFirestore("registeredStudents", regMatch.id, regMatch);
        }
        
        syncLedgerForPayment(state, state.payments[index]);

        syncEntityToFirestore("payments", state.payments[index].id, state.payments[index]);
        return res.json({ success: true, item: state.payments[index] });
      }
    }


    if (dataType === "payments" && action === "update_payment") {
      const { id, studentName, category, amount, paymentMethod, senderBank, senderAccountName, proofOfPayment, status, isSigned, signatureDate } = payload;
      let index = state.payments.findIndex(p => p.id === id);
      if (index === -1) {
        const newPay = {
          id: id || `PAY-${uniqueIdSuffix()}`,
          studentName: studentName || "Siswa LPK",
          category: category || "Pelatihan & Asrama",
          amount: amount ? Number(amount) : 5000000,
          date: new Date().toISOString().split("T")[0],
          status: "Belum Bayar" as any
        };
        state.payments.unshift(newPay);
        index = 0;
      }

      if (index !== -1) {
        if (paymentMethod !== undefined) state.payments[index].paymentMethod = paymentMethod;
        if (senderBank !== undefined) state.payments[index].senderBank = senderBank;
        if (senderAccountName !== undefined) state.payments[index].senderAccountName = senderAccountName;
        if (proofOfPayment !== undefined) state.payments[index].proofOfPayment = proofOfPayment;
        if (status !== undefined) state.payments[index].status = status;
        if (isSigned !== undefined) state.payments[index].isSigned = isSigned;
        if (signatureDate !== undefined) state.payments[index].signatureDate = signatureDate;
        syncLedgerForPayment(state, state.payments[index]);
        syncEntityToFirestore("payments", state.payments[index].id, state.payments[index]);
        return res.json({ success: true, item: state.payments[index] });
      }
    }


    if (dataType === "payments" && action === "sign_payment") {
      const { id, isSigned, signatureDate } = payload;
      const index = state.payments.findIndex(p => p.id === id);
      if (index !== -1) {
        state.payments[index].isSigned = isSigned;
        state.payments[index].signatureDate = signatureDate;
        syncEntityToFirestore("payments", state.payments[index].id, state.payments[index]);
        return res.json({ success: true, item: state.payments[index] });
      }
    }


    if (dataType === "taxes" && action === "report") {
      const taxId = payload.id;
      const monthString = payload.monthString;
      let index = state.taxes.findIndex((t: any) => t.id === taxId || (monthString && t.monthString === monthString));
      if (index !== -1) {
        state.taxes[index].status = "Final/Dilaporkan";
        if (payload.sptFile !== undefined) state.taxes[index].sptFile = payload.sptFile;
        if (payload.financialReportFile !== undefined) state.taxes[index].financialReportFile = payload.financialReportFile;
        if (payload.notes !== undefined) state.taxes[index].notes = payload.notes;
        syncEntityToFirestore("taxes", state.taxes[index].id, state.taxes[index]);
        return res.json({ success: true, item: state.taxes[index] });
      } else {
        const newTax = {
          id: taxId || `TAX-${Date.now()}`,
          monthString: monthString || "Umum",
          totalRevenue: Number(payload.totalRevenue) || 0,
          totalExpenses: Number(payload.totalExpenses) || 0,
          taxRate: 0.11,
          taxAmount: Math.round(Number(payload.totalRevenue || 0) * 0.11),
          status: "Final/Dilaporkan" as const,
          sptFile: payload.sptFile || "",
          financialReportFile: payload.financialReportFile || "",
          notes: payload.notes || ""
        };
        state.taxes.push(newTax);
        syncEntityToFirestore("taxes", newTax.id, newTax);
        return res.json({ success: true, item: newTax });
      }
    }


    if (dataType === "taxes" && action === "add") {
      const newTax = {
        id: payload.id || `TAX-${Date.now()}`,
        monthString: payload.monthString,
        totalRevenue: Number(payload.totalRevenue),
        totalExpenses: Number(payload.totalExpenses),
        taxRate: Number(payload.taxRate) || 0.11,
        taxAmount: Math.round(Number(payload.totalRevenue) * (Number(payload.taxRate) || 0.11)),
        status: payload.status || "Draft",
        sptFile: payload.sptFile || "",
        financialReportFile: payload.financialReportFile || "",
        notes: payload.notes || ""
      };
      state.taxes.push(newTax);
      syncEntityToFirestore("taxes", newTax.id, newTax);
      return res.json({ success: true, item: newTax });
    }


    if (dataType === "taxes" && action === "edit") {
      const index = state.taxes.findIndex((t: any) => t.id === payload.id);
      if (index !== -1) {
        state.taxes[index] = {
          ...state.taxes[index],
          ...payload,
          totalRevenue: payload.totalRevenue !== undefined ? Number(payload.totalRevenue) : state.taxes[index].totalRevenue,
          totalExpenses: payload.totalExpenses !== undefined ? Number(payload.totalExpenses) : state.taxes[index].totalExpenses,
          taxRate: payload.taxRate !== undefined ? Number(payload.taxRate) : state.taxes[index].taxRate,
          taxAmount: Math.round(
            (payload.totalRevenue !== undefined ? Number(payload.totalRevenue) : state.taxes[index].totalRevenue) *
            (payload.taxRate !== undefined ? Number(payload.taxRate) : state.taxes[index].taxRate)
          )
        };
        syncEntityToFirestore("taxes", state.taxes[index].id, state.taxes[index]);
        return res.json({ success: true, item: state.taxes[index] });
      }
      return res.status(404).json({ error: "Tax record not found" });
    }


    if (dataType === "taxes" && action === "delete") {
      const { id } = payload;
      state.taxes = state.taxes.filter((t: any) => t.id !== id);
      if (id) deleteEntityFromFirestore("taxes", id);
      return res.json({ success: true, id });
    }


    
    if (dataType === "costConfig" && action === "update") {
      state.costConfig = {
        ...(state.costConfig || {}),
        ...payload
      };
      await syncEntityToFirestoreAsync("system", "costConfig", state.costConfig);
      await touchSyncMeta({
        dataType: "costConfig",
        action: "update",
        source: "backend"
      });
      return res.json({ success: true, costConfig: state.costConfig });
    }

    
    if (dataType === "payments" && action === "delete") {
      const { id, studentName, category } = payload;
      if (id) {
        state.payments = state.payments.filter(p => p.id !== id);
        deleteEntityFromFirestore("payments", id);
        syncLedgerForPayment(state, { id, status: "Dihapus" });
      }
      if (studentName && category) {
        const matching = state.payments.filter(p => 
          (p.studentName || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
          (p.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()
        );
        for (const m of matching) {
          deleteEntityFromFirestore("payments", m.id);
        }
        state.payments = state.payments.filter(p => !matching.some(m => m.id === p.id));
      }
      return res.json({ success: true, id });
    }


    if (dataType === "payments" && (action === "edit" || action === "update")) {
      const { id, studentName, amount, date, category, status } = payload;
      const targetId = id || payload.id;
      let idx = state.payments.findIndex(p => p.id === targetId);
      if (idx === -1 && studentName && category) {
        idx = state.payments.findIndex(p => 
          (p.studentName || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
          (p.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()
        );
      }

      if (idx !== -1) {
        state.payments[idx] = {
          ...state.payments[idx],
          ...payload,
          amount: amount !== undefined ? Number(amount) : state.payments[idx].amount,
          date: date || state.payments[idx].date,
          category: category || state.payments[idx].category,
          status: status || state.payments[idx].status,
        };
        
        syncLedgerForPayment(state, state.payments[idx]);

        syncEntityToFirestore("payments", state.payments[idx].id, state.payments[idx]);
        return res.json({ success: true, updated: state.payments[idx], item: state.payments[idx] });
      } else {
        const newPay = {
          id: targetId || `PAY-MAN-${uniqueIdSuffix()}`,
          studentName: studentName || "Siswa LPK",
          category: category || "Pembayaran Pendidikan",
          amount: amount !== undefined ? Number(amount) : 500000,
          date: date || new Date().toISOString().split("T")[0],
          status: status || "Belum Bayar",
          paymentMethod: "Manual",
          ...payload
        };
        state.payments.unshift(newPay);

        syncLedgerForPayment(state, newPay);

        syncEntityToFirestore("payments", newPay.id, newPay);
        return res.json({ success: true, updated: newPay, item: newPay });
      }
    }
  return false;
}
