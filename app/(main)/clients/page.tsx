"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientCard } from "@/components/clients/ClientCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClientRecord, deleteClient, fetchClients, fetchNextShootsForClients } from "@/lib/queries/clients";
import { cacheGet } from "@/lib/queryCache";
import type { Client, ClientType } from "@/lib/supabase/types";
import { Plus, Search } from "lucide-react";
import { CLIENT_COLORS } from "@/lib/clientColors";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ongoing" | "one_time">("ongoing");
  const [name, setName] = useState(""); const [businessName, setBusinessName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("ongoing");
  const [retainer, setRetainer] = useState(""); const [projectDate, setProjectDate] = useState("");
  const [summary, setSummary] = useState("");
  const [billingName, setBillingName] = useState(""); const [companyId, setCompanyId] = useState("");
  const [driveUrl, setDriveUrl] = useState(""); const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState(""); const [facebookUrl, setFacebookUrl] = useState("");
  const [color, setColor] = useState("indigo");
  const [saving, setSaving] = useState(false);
  const [nextShoots, setNextShoots] = useState<Record<string, string>>({});

  async function load() {
    const hasCached = cacheGet("clients") !== null && cacheGet("clients:next-shoots") !== null;
    if (!hasCached) setLoading(true);
    try {
      const [c, shoots] = await Promise.all([fetchClients(), fetchNextShootsForClients()]);
      setClients(c);
      setNextShoots(shoots);
    }
    catch (e) { console.error("fetchClients error", e); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function resetForm() { setName(""); setBusinessName(""); setClientType("ongoing"); setRetainer(""); setProjectDate(""); setSummary(""); setBillingName(""); setCompanyId(""); setDriveUrl(""); setInstagramUrl(""); setTiktokUrl(""); setFacebookUrl(""); setColor("indigo"); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (clientType === "one_time" && !retainer)) return;
    setSaving(true);
    try { await createClientRecord({ name: name.trim(), business_name: businessName || null, client_type: clientType, monthly_retainer: retainer ? Number(retainer) : null, project_date: clientType === "one_time" && projectDate ? projectDate : null, content_summary: summary || null, billing_name: billingName || null, company_id: companyId || null, drive_url: driveUrl || null, instagram_url: instagramUrl || null, tiktok_url: tiktokUrl || null, facebook_url: facebookUrl || null, color }); resetForm(); setOpen(false); load(); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) { setClients((p) => p.filter((c) => c.id !== id)); await deleteClient(id); }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-t-1 placeholder-t-muted transition-all duration-200 focus:outline-none";
  const tabCls = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? "calm-card text-t-1" : "text-t-3 hover:text-t-1"}`;

  return (
    <div>
      <PageHeader title="לקוחות" subtitle={`${clients.length} לקוחות פעילים`}
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> לקוח חדש</Button>} />
      {/* Tabs */}
      <div className="flex gap-1 mb-5 calm-card rounded-xl p-1 w-fit">
        {([["ongoing", "קבועים"], ["one_time", "חד-פעמיים"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === val ? "bg-white/60 text-t-1 shadow-sm" : "text-t-3 hover:text-t-1"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="relative mb-5">
        <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-4 pointer-events-none" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לקוח..."
          className="w-full calm-card rounded-xl pr-9 pl-4 py-2.5 text-sm text-t-1 placeholder-t-muted focus:outline-none transition"
        />
      </div>
      {loading ? <Spinner /> :
        clients.length === 0 ? <p className="text-sm text-t-3 text-center py-10">עדיין אין לקוחות ✨</p> :
        (() => {
          const filtered = clients.filter(c =>
            c.client_type === tab &&
            (c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.business_name ?? "").toLowerCase().includes(search.toLowerCase()))
          );
          if (filtered.length === 0) return <p className="text-sm text-t-3 text-center py-10">לא נמצאו לקוחות</p>;
          return (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => <ClientCard key={c.id} client={c} onDelete={handleDelete} shootLabel={nextShoots[c.id] ?? null} />)}
              </div>
            </div>
          );
        })()
      }
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-t-1 mb-4">לקוח חדש</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input autoFocus placeholder="שם הלקוח" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          <div>
            <p className="text-[11px] text-t-4 mb-2">צבע הלקוח</p>
            <div className="flex gap-2 flex-wrap">
              {CLIENT_COLORS.map(c => (
                <button key={c.name} type="button" onClick={() => setColor(c.name)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c.hex, outline: color === c.name ? `3px solid ${c.hex}` : "none", outlineOffset: "2px", opacity: color === c.name ? 1 : 0.5 }}
                  title={c.name} />
              ))}
            </div>
          </div>
          <input placeholder="שם העסק (אופציונלי)" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
          <div className="flex gap-1   rounded-xl p-1 w-fit">
            <button type="button" onClick={() => setClientType("ongoing")} className={tabCls(clientType === "ongoing")}>לקוח קבוע</button>
            <button type="button" onClick={() => setClientType("one_time")} className={tabCls(clientType === "one_time")}>לקוח חד פעמי</button>
          </div>
          {clientType === "ongoing" ? (
            <input type="number" placeholder="ריטיינר חודשי (₪)" value={retainer} onChange={(e) => setRetainer(e.target.value)} className={inputCls} />
          ) : (
            <>
              <input type="number" placeholder="מחיר פרויקט (₪)" value={retainer} onChange={(e) => setRetainer(e.target.value)} className={inputCls} required />
              <input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} className={inputCls} />
            </>
          )}
          <textarea placeholder="דגשים / אופי עבודה (אופציונלי, טקסט חופשי)" value={summary} onChange={(e) => setSummary(e.target.value)} className={`${inputCls} resize-none h-20`} />
          <div className="pt-2 border-t" style={{ borderColor: "rgba(181,154,127,0.1)" }}>
            <p className="text-[11px] text-t-4 mb-2">פרטי חיוב</p>
            <input placeholder="שם לחשבונית" value={billingName} onChange={(e) => setBillingName(e.target.value)} className={`${inputCls} mb-2`} />
            <input placeholder="ח.פ / עוסק מורשה" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls} />
          </div>
          <div className="pt-2 border-t" style={{ borderColor: "rgba(181,154,127,0.1)" }}>
            <p className="text-[11px] text-t-4 mb-2">קישורים (אופציונלי)</p>
            <input placeholder="Google Drive URL" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} className={`${inputCls} mb-2`} />
            <input placeholder="Instagram URL" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={`${inputCls} mb-2`} />
            <input placeholder="TikTok URL" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className={`${inputCls} mb-2`} />
            <input placeholder="Facebook URL" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={inputCls} />
          </div>
          <Button type="submit" disabled={saving || !name.trim() || (clientType === "one_time" && !retainer)} className="w-full">
            {saving ? "שומר..." : "יצירת לקוח"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
