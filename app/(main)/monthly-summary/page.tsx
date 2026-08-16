"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { fetchClients } from "@/lib/queries/clients";
import { fetchInvoicesForMonth, upsertInvoice } from "@/lib/queries/invoices";
import { cacheGet } from "@/lib/queryCache";
import type { Client, Invoice, InvoiceStatus } from "@/lib/supabase/types";
import { ChevronLeft, ChevronRight, Pencil, Download, Search } from "lucide-react";

const statusLabel: Record<InvoiceStatus, string> = { not_issued: "לא הוצאה", sent: "נשלחה", paid: "שולם" };
const statusColors: Record<InvoiceStatus, string> = {
  not_issued: "text-[#B45309] bg-[#F59E0B]/12",
  sent:       "text-[#1D4ED8] bg-[#1D4ED8]/10",
  paid:       "text-[#16A34A] bg-[#16A34A]/10",
};

function monthString(y: number, m: number) { return `${y}-${String(m + 1).padStart(2, "0")}`; }

type Row = Invoice & { _virtual?: boolean };

export default function MonthlySummaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const monthStr = monthString(year, month);

  const load = useCallback(async () => {
    const hasCached = cacheGet("clients") !== null && cacheGet(`invoices:${monthStr}`) !== null;
    if (!hasCached) setLoading(true);
    try {
      const [c, inv] = await Promise.all([fetchClients(), fetchInvoicesForMonth(monthStr)]);
      setClients(c); setInvoices(inv);
    } catch (e) {
      console.error("monthly-summary load error", e);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => { load(); }, [load]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const rows: Row[] = useMemo(() => {
    const relevant = clients.filter((c) => c.client_type === "ongoing" || (c.client_type === "one_time" && c.project_date?.startsWith(monthStr)));
    return relevant.map((c) => {
      const existing = invoices.find((i) => i.client_id === c.id);
      if (existing) return existing;
      return { id: `virtual-${c.id}`, user_id: "mock-user", client_id: c.id, month: monthStr, description: c.content_summary ?? "", amount: c.monthly_retainer ?? null, tax_id: c.company_id ?? null, status: "not_issued" as InvoiceStatus, notes: null, _virtual: true };
    });
  }, [clients, invoices, monthStr]);

  const clientFor = (r: Row) => clients.find((c) => c.id === r.client_id);
  const totalAmount = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const monthLabel = new Date(year, month).toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  function exportToPDF() {
    const tableRows = rows.map(r => {
      const client = clientFor(r);
      const taxId = r.tax_id ?? client?.company_id ?? "";
      return `<tr>
        <td>${client?.client_type === "one_time" ? "חד פעמי" : "קבוע"}</td>
        <td>${client?.name ?? "—"}</td>
        <td>${client?.billing_name ?? client?.business_name ?? ""}</td>
        <td>${r.description ?? ""}</td>
        <td>${taxId}</td>
        <td>${r.amount ? `₪${r.amount.toLocaleString()} + מע״מ` : ""}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"/>
      <title>חשבוניות ${monthLabel}</title>
      <style>
        @page { margin: 0; size: A4; }
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { font-size: 13px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f3f4f6; text-align: right; padding: 8px 10px; border: 1px solid #e5e7eb; }
        td { padding: 7px 10px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #fafafa; }
        .total { margin-top: 16px; font-size: 15px; font-weight: bold; }
      </style>
    </head><body>
      <h1>חשבוניות — ${monthLabel}</h1>
      <table>
        <thead><tr><th>סוג</th><th>שם לקוח</th><th>שם לחיוב</th><th>תיאור</th><th>ח״פ</th><th>סכום</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="total">
        <p style="font-weight:normal;font-size:13px;color:#555;margin-bottom:4px">סה״כ לפני מע״מ: ₪${totalAmount.toLocaleString()}</p>
        <p style="font-weight:normal;font-size:13px;color:#555;margin-bottom:4px">מע״מ 18%: ₪${Math.round(totalAmount * 0.18).toLocaleString()}</p>
        <p style="margin:0">סה״כ כולל מע״מ: ₪${Math.round(totalAmount * 1.18).toLocaleString()}</p>
      </div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  async function handleSave(updated: Row) {
    await upsertInvoice({ id: updated.id, client_id: updated.client_id, month: updated.month, description: updated.description, amount: updated.amount, tax_id: updated.tax_id, status: updated.status, notes: updated.notes });
    setEditingRow(null); load();
  }

  const stat = (n: number, label: string, color: string) => (
    <div className="calm-card rounded-2xl p-5">
      <p className="text-xs text-t-3 mb-1">{label}</p>
      <p className="text-2xl font-semibold" style={{ color }}>{n}</p>
    </div>
  );

  return (
    <div>
      <PageHeader title="חשבוניות" subtitle={
        <div className="flex items-center gap-1 mt-1">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:calm-card-hover rounded-lg text-t-3 hover:text-t-1 transition"><ChevronRight size={15} /></button>
          <span className="text-sm text-t-2 min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} disabled={year === now.getFullYear() && month === now.getMonth()} className="p-1 hover:calm-card-hover rounded-lg text-t-3 hover:text-t-1 transition disabled:opacity-30"><ChevronLeft size={15} /></button>
          {(year !== now.getFullYear() || month !== now.getMonth()) && (
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              className="mr-1 text-[11px] text-accent hover:opacity-75 transition">חזרה להיום</button>
          )}
        </div>
      }
        action={<button onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-t-3 hover:text-accent hover:calm-card-hover transition">
            <Download size={14} />
            ייצוא PDF
          </button>}
      />
      {loading ? <Spinner /> : (
        <>
          <div className="mb-6 space-y-3">
            <div className="calm-card border border-brand/30 rounded-2xl p-5">
              <p className="text-xs text-t-3 mb-1">סה״כ לפני מע״מ</p>
              <p className="text-2xl font-semibold" style={{ color: "#16A34A" }}>₪{totalAmount.toLocaleString()}</p>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(156,144,120,0.15)" }}>
                <span className="text-xs text-t-3">מע״מ 18%: ₪{Math.round(totalAmount * 0.18).toLocaleString()}</span>
                <span className="text-sm font-semibold text-t-1">סה״כ כולל מע״מ: ₪{Math.round(totalAmount * 1.18).toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stat(rows.filter((r) => r.status === "not_issued").length, "לא הוצאו", "#F59E0B")}
              {stat(rows.filter((r) => r.status === "sent").length, "נשלחו", "#1D4ED8")}
              {stat(rows.filter((r) => r.status === "paid").length, "שולמו", "#16A34A")}
            </div>
          </div>
          {rows.length === 0 ? <p className="text-sm text-t-3 text-center py-10">אין לקוחות לחיוב בחודש הזה</p> : (
            <>
              <div className="relative mb-4">
                <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-4 pointer-events-none" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לקוח..."
                  className="w-full calm-card rounded-xl pr-9 pl-4 py-2.5 text-sm text-t-1 placeholder-t-muted focus:outline-none transition"
                />
              </div>
            <div className="calm-card rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {[
                      { label: "שם לקוח", cls: "" },
                      { label: "סוג", cls: "hidden sm:table-cell" },
                      { label: "סכום", cls: "" },
                      { label: "סטטוס", cls: "hidden sm:table-cell" },
                      { label: "", cls: "" },
                    ].map((h, i) => (
                      <th key={i} className={`text-right text-xs font-medium text-t-3 px-3 py-3 ${h.cls}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.filter(row => {
                    const client = clientFor(row);
                    return (client?.name ?? "").toLowerCase().includes(search.toLowerCase());
                  }).map((row) => {
                    const client = clientFor(row);
                    return (
                      <tr key={row.id} className="border-t hover:calm-card-hover transition">
                        <td className="px-3 py-3">
                          <p className="font-medium text-t-1">{client?.name ?? "—"}</p>
                          {row.description && <p className="text-[11px] text-t-4 truncate max-w-[160px]">{row.description}</p>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={client?.client_type === "one_time"
                              ? { background: "rgba(139,92,246,0.10)", color: "#6D28D9" }
                              : { background: "rgba(29,78,216,0.10)", color: "#1D4ED8" }}>
                            {client?.client_type === "one_time" ? "חד פעמי" : "קבוע"}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium text-t-1 whitespace-nowrap">
                          {row.amount ? <span>₪{row.amount.toLocaleString()} <span className="text-[11px] text-t-4 font-normal">+ מע״מ</span></span> : <span className="text-t-4 text-xs">לא הוגדר</span>}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[row.status]}`}>{statusLabel[row.status]}</span>
                        </td>
                        <td className="px-2 py-3">
                          <button onClick={() => setEditingRow(row)} className="p-1.5 rounded-lg hover:bg-[#4A7A96]/15 text-t-3 hover:text-accent transition"><Pencil size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </>
      )}
      {editingRow && <EditModal row={editingRow} client={clientFor(editingRow) ?? null} onClose={() => setEditingRow(null)} onSave={handleSave} />}
    </div>
  );
}

function EditModal({ row, client, onClose, onSave }: { row: Row; client: Client | null; onClose: () => void; onSave: (r: Row) => void; }) {
  const [description, setDescription] = useState(row.description);
  const [amount, setAmount] = useState(row.amount?.toString() ?? "");
  const [taxId, setTaxId] = useState(row.tax_id ?? client?.company_id ?? "");
  const [status, setStatus] = useState<InvoiceStatus>(row.status);
  const [notes, setNotes] = useState(row.notes ?? "");
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-t-1 focus:border-brand transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { onSave({ ...row, description, amount: amount ? Number(amount) : null, tax_id: taxId || null, status, notes: notes || null }); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose}>
      <h2 className="text-lg font-semibold text-t-1 mb-1">{client?.name ?? row.client_id}</h2>
      {client?.billing_name && client.billing_name !== client.name && (
        <p className="text-xs text-t-4 -mt-0.5 mb-1">{client.billing_name}</p>
      )}
      <p className="text-xs text-t-3 mb-4">{row.month}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} placeholder="תיאור עבודה" className={inputCls} />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="סכום (₪)" className={inputCls} />
        <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="ח״פ / עוסק מורשה" className={inputCls} />
        <div>
          <p className="text-xs text-t-3 mb-1.5">סטטוס חשבונית</p>
          <div className="flex gap-1   rounded-xl p-1">
            {(Object.keys(statusLabel) as InvoiceStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${status === s ? "calm-card text-t-1" : "text-t-3"}`}>
                {statusLabel[s]}
              </button>
            ))}
          </div>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות" className={`${inputCls} resize-none h-16`} />
        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="flex-1">{saving ? "שומר..." : "שמירה"}</Button>
          <button type="button" onClick={onClose} className="text-sm text-t-3 px-4 hover:text-t-1 transition">ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
