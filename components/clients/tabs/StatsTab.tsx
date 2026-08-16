"use client";
import { useState, useEffect, useRef } from "react";
import type { Client, SocialPlatform } from "@/lib/supabase/types";

type PlatformStats = {
  followers: string;
  postsThisMonth: string;
  reach: string;        // חשיפה (impressions/reach)
  engagement: "high" | "medium" | "low" | "";
  topPost: string;
  notes: string;
  // TikTok-specific
  likes: string;
  comments: string;
  shares: string;
  profileVisits: string;
};

const defaultStats = (): PlatformStats => ({
  followers: "", postsThisMonth: "", reach: "", engagement: "", topPost: "", notes: "",
  likes: "", comments: "", shares: "", profileVisits: "",
});

const platformConfig: { value: SocialPlatform; label: string; color: string; urlKey: keyof Client }[] = [
  { value: "instagram", label: "Instagram", color: "#E1306C", urlKey: "instagram_url" },
  { value: "tiktok",    label: "TikTok",    color: "#555",    urlKey: "tiktok_url" },
  { value: "facebook",  label: "Facebook",  color: "#1877F2", urlKey: "facebook_url" },
];

const engagementLabels = { high: "גבוה 🔥", medium: "בינוני", low: "נמוך" };

function monthKey(clientId: string, month: string) { return `stats-${clientId}-${month}`; }

function loadMonth(clientId: string, month: string): Record<SocialPlatform, PlatformStats> {
  const empty = { instagram: defaultStats(), tiktok: defaultStats(), facebook: defaultStats(), general: defaultStats() };
  try {
    const raw = localStorage.getItem(monthKey(clientId, month));
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch { return empty; }
}

function saveMonth(clientId: string, month: string, data: Record<SocialPlatform, PlatformStats>) {
  localStorage.setItem(monthKey(clientId, month), JSON.stringify(data));
}

function prevMonth(m: string) {
  const d = new Date(m + "-01");
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: string) {
  const v = parseInt(n);
  return isNaN(v) ? "—" : v.toLocaleString("he-IL");
}

function delta(curr: string, prev: string) {
  const c = parseInt(curr), p = parseInt(prev);
  if (isNaN(c) || isNaN(p) || p === 0) return null;
  const d = c - p;
  const pct = Math.round((d / p) * 100);
  return { d, pct, up: d >= 0 };
}

function Delta({ curr, prev }: { curr: string; prev: string }) {
  const r = delta(curr, prev);
  if (!r) return null;
  return (
    <span className={`text-[10px] font-medium ms-1 ${r.up ? "text-[#4A6B50]" : "text-[#F87171]"}`}>
      {r.up ? "▲" : "▼"} {Math.abs(r.pct)}%
    </span>
  );
}

export function StatsTab({ clientId, client }: { clientId: string; client: Client }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = prevMonth(currentMonth);
  const [month, setMonth] = useState(lastMonth);
  const [stats, setStats] = useState<Record<SocialPlatform, PlatformStats>>(() => loadMonth(clientId, currentMonth));
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  async function exportPDF() {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const el = previewRef.current;
      const w = el.offsetWidth;

      // clone off-screen with no size constraints
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = `
        position: fixed; top: 0; left: -9999px;
        width: ${w}px; max-height: none; overflow: visible;
        background: #ffffff;
        border-radius: 24px; z-index: -1;
      `;
      document.body.appendChild(clone);
      await new Promise(r => setTimeout(r, 80));

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(clone, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff",
        width: w, height: clone.scrollHeight,
        windowWidth: w, windowHeight: clone.scrollHeight,
        x: 0, y: 0,
      });
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      // scale to fit one page — shrink if too tall, center if shorter
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pdfW - imgW) / 2;
      const y = (pdfH - imgH) / 2;
      pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
      pdf.save(`סיכום-${client.name}-${monthLabel}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => { setStats(loadMonth(clientId, month)); }, [clientId, month]);

  const prevStats = loadMonth(clientId, prevMonth(month));

  function update(platform: SocialPlatform, field: keyof PlatformStats, value: string) {
    setStats(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }));
  }

  function handleSave() {
    saveMonth(clientId, month, stats);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function changeMonth(delta: number) {
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() + delta);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthLabel = new Date(month + "-01").toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const activePlatforms = platformConfig.filter(p => client[p.urlKey]);
  const displayPlatforms = activePlatforms.length > 0 ? activePlatforms : platformConfig;

  // Totals for summary bar
  const totalReach = displayPlatforms.reduce((s, p) => s + (parseInt(stats[p.value]?.reach) || 0), 0);
  const totalPosts = displayPlatforms.reduce((s, p) => s + (parseInt(stats[p.value]?.postsThisMonth) || 0), 0);
  const prevTotalReach = displayPlatforms.reduce((s, p) => s + (parseInt(prevStats[p.value]?.reach) || 0), 0);
  const reachDelta = prevTotalReach > 0 ? Math.round(((totalReach - prevTotalReach) / prevTotalReach) * 100) : null;

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm text-t-1 focus:outline-none focus:ring-1 focus:ring-[#9C9078]/40 calm-card transition";

  function generateReport() {
    const rows = displayPlatforms.map(({ value: pl, label, color }) => {
      const s = stats[pl];
      const p = prevStats[pl];
      const followersDelta = delta(s.followers, p.followers);
      const reachDelta = delta(s.reach, p.reach);
      const tikTokExtra = pl === "tiktok" && (s.likes || s.comments || s.shares || s.profileVisits) ? `
        <div class="divider-h"></div>
        <div class="stats">
          ${s.likes ? `<div class="s"><div class="s-lbl">לייקים</div><div class="s-val">${fmt(s.likes)}</div></div>` : ""}
          ${s.comments ? `<div class="s"><div class="s-lbl">תגובות</div><div class="s-val">${fmt(s.comments)}</div></div>` : ""}
          ${s.shares ? `<div class="s"><div class="s-lbl">שיתופים</div><div class="s-val">${fmt(s.shares)}</div></div>` : ""}
          ${s.profileVisits ? `<div class="s"><div class="s-lbl">כניסות לעמוד</div><div class="s-val">${fmt(s.profileVisits)}</div></div>` : ""}
        </div>` : "";
      return `
        <div class="card">
          <div class="card-head">
            <span class="dot" style="background:${color}"></span>
            <strong>${label}</strong>
          </div>
          <div class="card-body">
            <div class="stats">
              <div class="s"><div class="s-lbl">עוקבים</div><div class="s-val">${fmt(s.followers)}${followersDelta ? `<span class="delta ${followersDelta.up ? "up" : "down"}">${followersDelta.up ? "▲" : "▼"}${Math.abs(followersDelta.pct)}%</span>` : ""}</div></div>
              <div class="s"><div class="s-lbl">פוסטים</div><div class="s-val">${fmt(s.postsThisMonth)}</div></div>
              <div class="s"><div class="s-lbl">חשיפה</div><div class="s-val">${fmt(s.reach)}${reachDelta ? `<span class="delta ${reachDelta.up ? "up" : "down"}">${reachDelta.up ? "▲" : "▼"}${Math.abs(reachDelta.pct)}%</span>` : ""}</div></div>
              <div class="s"><div class="s-lbl">אינגייג׳מנט</div><div class="s-val">${s.engagement ? engagementLabels[s.engagement] : "—"}</div></div>
            </div>
            ${tikTokExtra}
            ${s.topPost || s.notes ? `<div class="divider-h"></div>` : ""}
            ${s.topPost ? `<div class="top-post"><strong>הפוסט הכי טוב:</strong> ${s.topPost}</div>` : ""}
            ${s.notes ? `<div class="note">${s.notes}</div>` : ""}
          </div>
        </div>`;
    }).join("");

    const reachDelta = prevTotalReach > 0 ? Math.round(((totalReach - prevTotalReach) / prevTotalReach) * 100) : null;

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<title>סיכום חודשי · ${client.name} · ${monthLabel}</title>
<style>
  @page { margin: 0; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1A1210; direction: rtl; width: 210mm; min-height: 297mm; padding: 28px 36px 24px; }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .client-name { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .month-badge { font-size: 11px; font-weight: 600; color: #fff; background: #8B6F5E; border-radius: 20px; padding: 3px 12px; }
  .divider { height: 2px; background: linear-gradient(to left, #8B6F5E, #C4AEDA, #8B6F5E); margin-bottom: 16px; border-radius: 2px; }

  /* TOTALS */
  .totals { display: flex; gap: 12px; margin-bottom: 18px; }
  .total-box { flex: 1; border-radius: 10px; padding: 12px 16px; background: #F7F4F2; border: 1px solid #EAE0DB; }
  .total-box .lbl { font-size: 9px; color: #8B6F5E; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  .total-box .val { font-size: 24px; font-weight: 800; color: #1A1210; }
  .total-box .sub { font-size: 9px; color: #9C9078; margin-top: 2px; font-weight: 600; }

  /* PLATFORM CARDS */
  .platforms { display: flex; flex-direction: column; gap: 10px; }
  .card { border-radius: 10px; border: 1px solid #EAE0DB; overflow: hidden; }
  .card-head { display: flex; align-items: center; gap: 8px; padding: 9px 14px; background: #F7F4F2; border-bottom: 1px solid #EAE0DB; }
  .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .card-head strong { font-size: 13px; font-weight: 700; }
  .card-body { padding: 10px 14px; }
  .stats { display: flex; gap: 8px; margin-bottom: 8px; }
  .s { flex: 1; }
  .s-lbl { font-size: 8.5px; color: #8B6F5E; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
  .s-val { font-size: 16px; font-weight: 700; color: #1A1210; }
  .delta { font-size: 9.5px; font-weight: 700; margin-right: 2px; }
  .up { color: #16A34A; } .down { color: #DC2626; }
  .divider-h { height: 1px; background: #EAE0DB; margin: 7px 0; }
  .note { font-size: 10px; color: #5C3D2E; border-right: 2px solid #C4AEDA; padding-right: 10px; line-height: 1.65; }
  .top-post { font-size: 10px; color: #5C3D2E; margin-bottom: 5px; }
  .top-post strong { font-weight: 700; }

  /* FOOTER */
  .footer { margin-top: 16px; display: flex; justify-content: space-between; font-size: 8.5px; color: #B09080; border-top: 1px solid #EAE0DB; padding-top: 8px; }
</style>
</head>
<body>
<div class="header">
  <div class="client-name">${client.name}</div>
  <div class="month-badge">${monthLabel}</div>
</div>
<div class="divider"></div>

${totalReach > 0 || totalPosts > 0 ? `
<div class="totals">
  ${totalReach > 0 ? `<div class="total-box"><div class="lbl">חשיפה כוללת</div><div class="val">${totalReach.toLocaleString("he-IL")}</div>${reachDelta !== null ? `<div class="sub">${reachDelta >= 0 ? "▲" : "▼"} ${Math.abs(reachDelta)}% מהחודש שעבר</div>` : ""}</div>` : ""}
  ${totalPosts > 0 ? `<div class="total-box"><div class="lbl">סה״כ פוסטים</div><div class="val">${totalPosts}</div><div class="sub">${displayPlatforms.length} פלטפורמות</div></div>` : ""}
</div>` : ""}

<div class="platforms">
${rows}
</div>

<div class="footer">
  <span>${client.name}</span>
  <span>סיכום חודשי · ${monthLabel}</span>
</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-t-1">ביצועים חודשיים</p>
          <p className="text-xs text-t-4 mt-0.5">מעודכן ידנית · בעתיד ניתן לחבר ל-Meta Business Suite</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(true)}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-[#9C9078]/30 text-accent hover:bg-[#9C9078]/10 transition">
            תצוגה לשליחה
          </button>
          <button onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition ${saved ? "bg-[#4A6B50]/20 text-[#4A6B50]" : "bg-accent text-white hover:opacity-90"}`}>
            {saved ? "נשמר ✓" : "שמירה"}
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg text-t-3 hover:text-t-1 hover:calm-card transition">‹</button>
        <span className="text-sm font-medium text-t-1 min-w-[110px] text-center">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} disabled={month >= currentMonth}
          className="p-1.5 rounded-lg text-t-3 hover:text-t-1 hover:calm-card transition disabled:opacity-30">›</button>
      </div>

      {/* Summary totals */}
      {(totalReach > 0 || totalPosts > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="calm-card rounded-2xl p-4">
            <p className="text-[11px] text-t-4 mb-1">סה״כ חשיפה חודשית</p>
            <p className="text-2xl font-semibold text-t-1">{totalReach.toLocaleString("he-IL")}</p>
            {prevTotalReach > 0 && <Delta curr={String(totalReach)} prev={String(prevTotalReach)} />}
          </div>
          <div className="calm-card rounded-2xl p-4">
            <p className="text-[11px] text-t-4 mb-1">סה״כ פוסטים</p>
            <p className="text-2xl font-semibold text-t-1">{totalPosts}</p>
            <p className="text-[11px] text-t-4 mt-0.5">{displayPlatforms.length} פלטפורמות</p>
          </div>
        </div>
      )}

      {/* Per-platform */}
      {displayPlatforms.map(({ value: platform, label, color, urlKey }) => {
        const s = stats[platform];
        const p = prevStats[platform];
        const profileUrl = client[urlKey] as string | null;
        return (
          <div key={platform} className="calm-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-sm font-semibold text-t-1">{label}</span>
              </div>
              {profileUrl && (
                <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-t-4 hover:text-accent transition">← לפרופיל</a>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[11px] text-t-4 block mb-1">עוקבים</label>
                <input value={s.followers} onChange={e => update(platform, "followers", e.target.value)}
                  placeholder="0" className={inputCls} />
                {p.followers && s.followers && <Delta curr={s.followers} prev={p.followers} />}
              </div>
              <div>
                <label className="text-[11px] text-t-4 block mb-1">פוסטים החודש</label>
                <input value={s.postsThisMonth} onChange={e => update(platform, "postsThisMonth", e.target.value)}
                  placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] text-t-4 block mb-1">חשיפה</label>
                <input value={s.reach} onChange={e => update(platform, "reach", e.target.value)}
                  placeholder="0" className={inputCls} />
                {p.reach && s.reach && <Delta curr={s.reach} prev={p.reach} />}
              </div>
            </div>

            {/* TikTok-specific metrics */}
            {platform === "tiktok" && (
              <div className="grid grid-cols-4 gap-3 mb-4 pt-3 border-t" style={{ borderColor: "rgba(181,154,127,0.08)" }}>
                <div>
                  <label className="text-[11px] text-t-4 block mb-1">לייקים</label>
                  <input value={s.likes} onChange={e => update(platform, "likes", e.target.value)}
                    placeholder="0" className={inputCls} />
                  {p.likes && s.likes && <Delta curr={s.likes} prev={p.likes} />}
                </div>
                <div>
                  <label className="text-[11px] text-t-4 block mb-1">תגובות</label>
                  <input value={s.comments} onChange={e => update(platform, "comments", e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] text-t-4 block mb-1">שיתופים</label>
                  <input value={s.shares} onChange={e => update(platform, "shares", e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] text-t-4 block mb-1">כניסות לעמוד</label>
                  <input value={s.profileVisits} onChange={e => update(platform, "profileVisits", e.target.value)}
                    placeholder="0" className={inputCls} />
                  {p.profileVisits && s.profileVisits && <Delta curr={s.profileVisits} prev={p.profileVisits} />}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="text-[11px] text-t-4 block mb-1.5">אינגייג׳מנט כללי</label>
              <div className="flex gap-1.5">
                {(["high", "medium", "low"] as const).map(eng => (
                  <button key={eng} type="button" onClick={() => update(platform, "engagement", s.engagement === eng ? "" : eng)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${s.engagement === eng
                      ? eng === "high" ? "bg-[#4A6B50]/20 text-[#4A6B50]" : eng === "medium" ? "bg-[#9C9078]/20 text-[#9C9078]" : "bg-[#F87171]/20 text-[#F87171]"
                      : "text-t-3 calm-card hover:text-t-1"}`}>
                    {engagementLabels[eng]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-t-4 block mb-1">הפוסט הכי טוב החודש</label>
                <input value={s.topPost} onChange={e => update(platform, "topPost", e.target.value)}
                  placeholder="תיאור / URL" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] text-t-4 block mb-1">הערות</label>
                <textarea value={s.notes} onChange={e => update(platform, "notes", e.target.value)}
                  placeholder="מה עבד? מה לשפר? מה לנסות בחודש הבא?" rows={2}
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          {/* action buttons outside the captured card */}
          <div className="absolute left-8 top-8 flex items-center gap-2 z-20">
            <button onClick={exportPDF} disabled={exporting}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              {exporting ? "מייצא..." : "הורד PDF"}
            </button>
            <button onClick={() => setPreview(false)} className="text-white/60 hover:text-white transition text-lg">✕</button>
          </div>

          <div ref={previewRef} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ background: "#ffffff", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>

            {/* Header */}
            <div className="px-8 pt-8 pb-5" style={{ borderBottom: "1px solid #f0f0f0" }}>
              <p className="text-[10px] font-semibold tracking-widest mb-1" style={{ color: "#9C9078" }}>סיכום חודשי</p>
              <div className="flex items-end justify-between">
                <h2 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{client.name}</h2>
                <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: "#F2EDE6", color: "#9C9078" }}>{monthLabel}</span>
              </div>
            </div>

            {/* Totals */}
            {(totalReach > 0 || totalPosts > 0) && (
              <div className="grid grid-cols-2 gap-3 px-8 py-5" style={{ borderBottom: "1px solid #f0f0f0" }}>
                {totalReach > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest mb-1 font-medium" style={{ color: "#aaa" }}>חשיפה כוללת</p>
                    <p className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{totalReach.toLocaleString("he-IL")}</p>
                    {reachDelta !== null && <p className="text-xs mt-1" style={{ color: reachDelta >= 0 ? "#16a34a" : "#dc2626" }}>{reachDelta >= 0 ? "▲" : "▼"} {Math.abs(reachDelta)}% מהחודש שעבר</p>}
                  </div>
                )}
                {totalPosts > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest mb-1 font-medium" style={{ color: "#aaa" }}>פוסטים</p>
                    <p className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{totalPosts}</p>
                    <p className="text-xs mt-1" style={{ color: "#aaa" }}>{displayPlatforms.length} פלטפורמות</p>
                  </div>
                )}
              </div>
            )}

            {/* Platforms */}
            <div className="px-8 py-5 space-y-4">
              {displayPlatforms.map(({ value: pl, label, color }) => {
                const s = stats[pl];
                const p2 = prevStats[pl];
                return (
                  <div key={pl} className="rounded-2xl p-5" style={{ background: "#f9f7fc", border: "1px solid #ede8f5" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-bold" style={{ color: "#1a1a1a" }}>{label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { lbl: "עוקבים", val: s.followers, prev: p2.followers },
                        { lbl: "פוסטים", val: s.postsThisMonth, prev: "" },
                        { lbl: "חשיפה", val: s.reach, prev: p2.reach },
                        { lbl: "אינגייג׳", val: s.engagement ? engagementLabels[s.engagement as keyof typeof engagementLabels] : "—", prev: "" },
                      ].map(({ lbl, val, prev: pv }) => (
                        <div key={lbl} className="rounded-xl p-2.5" style={{ background: "#fff", border: "1px solid #ede8f5" }}>
                          <p className="text-[9px] tracking-widest mb-1 font-medium" style={{ color: "#bbb" }}>{lbl}</p>
                          <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>{val ? (isNaN(Number(val)) ? val : Number(val).toLocaleString("he-IL")) : "—"}</p>
                          {pv && val && !isNaN(Number(val)) && !isNaN(Number(pv)) && Number(pv) > 0 && (() => {
                            const d = Math.round(((Number(val) - Number(pv)) / Number(pv)) * 100);
                            return <p className="text-[9px] mt-0.5" style={{ color: d >= 0 ? "#16a34a" : "#dc2626" }}>{d >= 0 ? "▲" : "▼"}{Math.abs(d)}%</p>;
                          })()}
                        </div>
                      ))}
                    </div>
                    {pl === "tiktok" && (s.likes || s.comments || s.shares || s.profileVisits) && (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[["לייקים", s.likes], ["תגובות", s.comments], ["שיתופים", s.shares], ["כניסות", s.profileVisits]].filter(([, v]) => v).map(([l, v]) => (
                          <div key={l as string} className="rounded-xl p-2.5" style={{ background: "#fff", border: "1px solid #ede8f5" }}>
                            <p className="text-[9px] tracking-widest mb-1 font-medium" style={{ color: "#bbb" }}>{l}</p>
                            <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>{Number(v).toLocaleString("he-IL")}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {s.notes && <p className="text-xs leading-relaxed mt-2" style={{ color: "#666", borderRight: "2px solid #9C9078", paddingRight: "10px" }}>{s.notes}</p>}
                  </div>
                );
              })}
            </div>

            <div className="px-8 pb-6 text-center">
              <p className="text-[10px]" style={{ color: "#ccc" }}>{client.name} · {monthLabel}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
