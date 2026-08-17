"use client";
import { useState } from "react";
import type { Client, ClientType } from "@/lib/supabase/types";
import { updateClient } from "@/lib/queries/clients";
import { CLIENT_COLORS } from "@/lib/clientColors";
import { formatDateHe } from "@/lib/utils";

const socialStyles: Record<string, { color: string; bg: string; hoverBg: string }> = {
  Instagram: { color: "#C13584", bg: "rgba(193,53,132,0.08)", hoverBg: "rgba(193,53,132,0.14)" },
  TikTok:    { color: "#010101", bg: "rgba(1,1,1,0.07)",      hoverBg: "rgba(1,1,1,0.13)" },
  Facebook:  { color: "#1877F2", bg: "rgba(24,119,242,0.08)", hoverBg: "rgba(24,119,242,0.14)" },
  Drive:     { color: "#1A6636", bg: "rgba(26,102,54,0.08)",  hoverBg: "rgba(26,102,54,0.14)" },
  LinkedIn:  { color: "#0A66C2", bg: "rgba(10,102,194,0.08)", hoverBg: "rgba(10,102,194,0.14)" },
};

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const s = socialStyles[label] ?? { color: "#5C5A54", bg: "rgba(92,90,84,0.08)", hoverBg: "rgba(92,90,84,0.13)" };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-medium"
      style={{ color: s.color, background: s.bg }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = s.hoverBg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = s.bg}>
      {children}
      <span>{label}</span>
    </a>
  );
}

const TikTokIconColored = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z" fill="#010101"/>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z" fill="#69C9D0" opacity="0.5"/>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z" fill="#EE1D52" opacity="0.3"/>
  </svg>
);

const DriveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.433 22l4-6.928H22l-4 6.928H4.433zM2 17.928L6 11l4 6.928H2zM9 3h6l7 12.124h-6L9 3z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const TikTokIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export function ClientHeader({ client, onUpdated }: { client: Client; onUpdated: (u: Partial<Client>) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [businessName, setBusinessName] = useState(client.business_name ?? "");
  const [clientType, setClientType] = useState<ClientType>(client.client_type);
  const [retainer, setRetainer] = useState(client.monthly_retainer?.toString() ?? "");
  const [projectDate, setProjectDate] = useState(client.project_date ?? "");
  const [summary, setSummary] = useState(client.content_summary ?? "");
  const [billingName, setBillingName] = useState(client.billing_name ?? "");
  const [taxId, setTaxId] = useState(client.company_id ?? "");
  const [nextAction, setNextAction] = useState(client.next_action ?? "");
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [driveUrl, setDriveUrl] = useState(client.drive_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(client.instagram_url ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(client.tiktok_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(client.facebook_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(client.linkedin_url ?? "");
  const [clientColor, setClientColor] = useState(client.color ?? "indigo");
  const [saving, setSaving] = useState(false);
  const isOneTime = client.client_type === "one_time";

  const inputCls = "w-full rounded-xl px-3 py-2 text-sm text-t-1 focus:border-brand transition";

  async function save() {
    if (!name.trim()) return;
    if (clientType === "one_time" && !retainer) return;
    setSaving(true);
    const updates: Partial<Client> = {
      name: name.trim(), business_name: businessName.trim() || null, client_type: clientType,
      monthly_retainer: retainer ? Number(retainer) : null,
      project_date: clientType === "one_time" && projectDate ? projectDate : null,
      content_summary: summary || null,
      color: clientColor,
      billing_name: billingName.trim() || null,
      company_id: taxId.trim() || null,
      drive_url: driveUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      tiktok_url: tiktokUrl.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    };
    try {
      await updateClient(client.id, updates);
      onUpdated(updates);
      setEditing(false);
    } catch (e) {
      console.error("updateClient error:", e);
      alert("שגיאה בשמירה: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setName(client.name); setBusinessName(client.business_name ?? ""); setClientType(client.client_type);
    setRetainer(client.monthly_retainer?.toString() ?? ""); setProjectDate(client.project_date ?? "");
    setSummary(client.content_summary ?? ""); setBillingName(client.billing_name ?? "");
    setTaxId(client.company_id ?? "");
    setDriveUrl(client.drive_url ?? ""); setInstagramUrl(client.instagram_url ?? "");
    setTiktokUrl(client.tiktok_url ?? ""); setFacebookUrl(client.facebook_url ?? "");
    setLinkedinUrl(client.linkedin_url ?? "");
    setEditing(false);
  }

  const tabCls = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? "calm-card text-t-1" : "text-t-3 hover:text-t-1"}`;

  return (
    <div className="  rounded-2xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2 max-w-sm">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הלקוח" className={inputCls} autoFocus />
              <div>
                <p className="text-[11px] text-t-4 mb-2">צבע</p>
                <div className="flex gap-2 flex-wrap">
                  {CLIENT_COLORS.map(c => (
                    <button key={c.name} type="button" onClick={() => setClientColor(c.name)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{ background: c.hex, outline: clientColor === c.name ? `3px solid ${c.hex}` : "none", outlineOffset: "2px", opacity: clientColor === c.name ? 1 : 0.45 }} />
                  ))}
                </div>
              </div>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="שם העסק" className={inputCls} />
              <div className="flex gap-1 rounded-xl p-1 w-fit">
                <button type="button" onClick={() => setClientType("ongoing")} className={tabCls(clientType === "ongoing")}>לקוח קבוע</button>
                <button type="button" onClick={() => setClientType("one_time")} className={tabCls(clientType === "one_time")}>לקוח חד פעמי</button>
              </div>
              {clientType === "ongoing" ? (
                <input type="number" value={retainer} onChange={(e) => setRetainer(e.target.value)} placeholder="ריטיינר חודשי (₪)" className={inputCls} />
              ) : (
                <>
                  <input type="number" value={retainer} onChange={(e) => setRetainer(e.target.value)} placeholder="מחיר פרויקט (₪)" className={inputCls} required />
                  <input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} className={inputCls} />
                </>
              )}
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="דגשים / אופי עבודה" className={`${inputCls} resize-none h-16`} />
              <div className="pt-1 border-t border-border/40">
                <p className="text-[11px] text-t-4 mb-1.5">פרטי חיוב (לחשבוניות)</p>
                <input value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="שם לחשבונית" className={inputCls} />
                <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="ח״פ / עוסק מורשה" className={`${inputCls} mt-2`} />
              </div>
              <div className="pt-1 border-t border-border/40">
                <p className="text-[11px] text-t-4 mb-1.5">קישורים</p>
                <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="Google Drive URL" className={inputCls} />
                <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Instagram URL" className={`${inputCls} mt-2`} />
                <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="TikTok URL" className={`${inputCls} mt-2`} />
                <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="Facebook URL" className={`${inputCls} mt-2`} />
                <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" className={`${inputCls} mt-2`} />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || !name.trim() || (clientType === "one_time" && !retainer)}
                  className="text-xs bg-gradient-to-br from-brand to-brand-light text-white rounded-lg px-3 py-1.5 disabled:opacity-40">
                  {saving ? "שומר..." : "שמירה"}
                </button>
                <button onClick={cancel} className="text-xs text-t-3 hover:text-t-1 px-3 py-1.5 transition">ביטול</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-t-1">{client.name}</h1>
                {isOneTime && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#60655D]/15 text-[#60655D] font-medium">חד פעמי</span>}
              </div>
              {client.business_name && <p className="text-sm text-t-3 mt-0.5">{client.business_name}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm text-t-3 flex-wrap">
                {!isOneTime && client.monthly_retainer && <span className="font-semibold text-[15px]" style={{ color: "#16A34A" }}>₪{client.monthly_retainer.toLocaleString()}<span className="text-xs font-normal text-t-4 mr-1">/ חודש</span></span>}
                {isOneTime && client.monthly_retainer && <span className="font-semibold text-[15px]" style={{ color: "#16A34A" }}>₪{client.monthly_retainer.toLocaleString()}<span className="text-xs font-normal text-t-4 mr-1">פרויקט</span></span>}
                {isOneTime && client.project_date && <span>תאריך: {formatDateHe(client.project_date)}</span>}
                {client.content_summary && <span>· {client.content_summary}</span>}
              </div>
              {(client.billing_name || client.company_id) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-t-4">
                  {client.billing_name && <span>{client.billing_name}</span>}
                  {client.billing_name && client.company_id && <span>·</span>}
                  {client.company_id && <span>ח״פ {client.company_id}</span>}
                </div>
              )}
              {/* Next action */}
              <div className="mt-3">
                {editingNextAction ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nextAction}
                      onChange={e => setNextAction(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          updateClient(client.id, { next_action: nextAction || null });
                          setEditingNextAction(false);
                        }
                        if (e.key === "Escape") setEditingNextAction(false);
                      }}
                      onBlur={() => {
                        updateClient(client.id, { next_action: nextAction || null });
                        setEditingNextAction(false);
                      }}
                      placeholder="מה הצעד הבא?"
                      className="flex-1 text-sm rounded-lg px-3 py-1.5 text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card"
                    />
                  </div>
                ) : nextAction ? (
                  <button onClick={() => setEditingNextAction(true)}
                    className="flex items-center gap-1.5 group hover:opacity-80 transition">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#1D4ED8" }} />
                    <span className="text-sm font-semibold" style={{ color: "#1D4ED8" }}>{nextAction}</span>
                    <span className="text-[11px] text-t-4 opacity-0 group-hover:opacity-100">עריכה</span>
                  </button>
                ) : (
                  <button onClick={() => setEditingNextAction(true)}
                    className="text-[11px] text-t-4 hover:text-accent transition">
                    + הוספת צעד הבא
                  </button>
                )}
              </div>

              {(client.drive_url || client.instagram_url || client.tiktok_url || client.facebook_url || client.linkedin_url) && (
                <div className="mt-4 pt-4 border-t flex items-center gap-1 flex-wrap" style={{ borderColor: "rgba(181,154,127,0.08)" }}>
                  {client.instagram_url && <SocialIcon href={client.instagram_url} label="Instagram"><InstagramIcon /></SocialIcon>}
                  {client.tiktok_url && <SocialIcon href={client.tiktok_url} label="TikTok"><TikTokIconColored /></SocialIcon>}
                  {client.facebook_url && <SocialIcon href={client.facebook_url} label="Facebook"><FacebookIcon /></SocialIcon>}
                  {client.linkedin_url && <SocialIcon href={client.linkedin_url} label="LinkedIn"><LinkedInIcon /></SocialIcon>}
                  {client.drive_url && <SocialIcon href={client.drive_url} label="Drive"><DriveIcon /></SocialIcon>}
                </div>
              )}
            </>
          )}
        </div>
        {!editing && <button onClick={() => setEditing(true)} className="text-xs text-accent hover:text-accent transition">עריכה</button>}
      </div>
    </div>
  );
}
