"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ContentCard } from "@/components/clients/ContentCard";
import { createContentItem, deleteContentItem, fetchContentItems, updateContentStatus } from "@/lib/queries/content";
import type { ContentItem, ContentStatus, ContentType, SocialPlatform } from "@/lib/supabase/types";
import { Plus } from "lucide-react";

const types: { value: ContentType; label: string }[] = [
  { value: "post", label: "פוסט" },
  { value: "reel", label: "ריל" },
  { value: "story", label: "סטורי" },
];

const platforms: { value: SocialPlatform; label: string; color: string }[] = [
  { value: "instagram", label: "Instagram", color: "bg-[#E1306C]/15 text-[#E1306C]" },
  { value: "tiktok",    label: "TikTok",    color: "bg-[#010101]/10 text-[#555]" },
  { value: "facebook",  label: "Facebook",  color: "bg-[#1877F2]/15 text-[#1877F2]" },
  { value: "general",   label: "כללי",      color: "bg-[#9CA3AF]/15 text-[#9CA3AF]" },
];

const columns: { status: ContentStatus; label: string; accent: string }[] = [
  { status: "idea",        label: "רעיון",         accent: "rgba(156,163,175,0.3)" },
  { status: "in_progress", label: "בעריכה",        accent: "rgba(167,139,250,0.4)" },
  { status: "future",      label: "מוכן לפרסום",   accent: "rgba(96,165,250,0.4)" },
  { status: "done",        label: "פורסם",         accent: "rgba(52,211,153,0.4)" },
];

export function ContentTab({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("post");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const data = await fetchContentItems(clientId);
    setItems(data);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createContentItem({ client_id: clientId, title: title.trim(), type, platform });
    setTitle("");
    load();
    inputRef.current?.focus();
  }

  async function handleStatusChange(id: string, status: ContentStatus) {
    await updateContentStatus(id, status);
    load();
  }

  async function handleDelete(id: string) {
    await deleteContentItem(id);
    load();
  }

  if (loading) return <p className="text-sm text-t-3">טוען...</p>;

  const filtered = filterPlatform === "all" ? items : items.filter(i => i.platform === filterPlatform);

  return (
    <div className="space-y-4">
      {/* Add new */}
      {open ? (
        <form onSubmit={submit} className="calm-card rounded-xl p-3 flex flex-wrap items-center gap-2">
          <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="רעיון לתוכן..." autoFocus
            className="flex-1 min-w-[160px] rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-1">
            {types.map((t) => (
              <button type="button" key={t.value} onClick={() => setType(t.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${type === t.value ? "bg-[#9C9078]/15 text-accent" : "text-t-3"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {platforms.map((p) => (
              <button type="button" key={p.value} onClick={() => setPlatform(p.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${platform === p.value ? p.color : "text-t-3"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="submit" className="bg-accent text-white rounded-lg px-3 py-2 text-xs font-medium">הוספה</button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-t-3 px-2">ביטול</button>
        </form>
      ) : (
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-t-3 py-3 text-sm font-medium hover:border-soft-purpleDark hover:text-accent transition">
          <Plus size={16} /> רעיון תוכן חדש
        </button>
      )}

      {/* Platform filter */}
      {items.length > 0 && (
        <div className="flex gap-1">
          <button onClick={() => setFilterPlatform("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterPlatform === "all" ? "bg-[#9C9078]/15 text-accent" : "text-t-3 hover:text-t-1"}`}>
            הכל ({items.length})
          </button>
          {platforms.map((p) => {
            const count = items.filter(i => i.platform === p.value).length;
            if (count === 0) return null;
            return (
              <button key={p.value} onClick={() => setFilterPlatform(p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterPlatform === p.value ? p.color : "text-t-3 hover:text-t-1"}`}>
                {p.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Kanban board */}
      {filtered.length === 0 ? (
        <p className="text-sm text-t-3 text-center py-8">{items.length === 0 ? "עדיין אין רעיונות תוכן" : "אין פריטים בפלטפורמה זו"}</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {columns.map((col) => {
            const colItems = filtered.filter(i => i.status === col.status);
            return (
              <div key={col.status} className="flex flex-col gap-2">
                {/* Column header */}
                <div className="flex items-center gap-2 pb-2 mb-1" style={{ borderBottom: `2px solid ${col.accent}` }}>
                  <span className="text-xs font-semibold text-t-2">{col.label}</span>
                  {colItems.length > 0 && (
                    <span className="text-[10px] text-t-4 bg-border/40 px-1.5 py-0.5 rounded-full">{colItems.length}</span>
                  )}
                </div>
                {/* Cards */}
                {colItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/40 py-6 text-center">
                    <p className="text-[11px] text-t-4">ריק</p>
                  </div>
                ) : (
                  colItems.map((item) => (
                    <ContentCard key={item.id} item={item}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      columns={columns}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
