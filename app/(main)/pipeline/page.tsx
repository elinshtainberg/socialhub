"use client";
import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { fetchAllContentItems, createContentItem, updateContentStatus, deleteContentItem } from "@/lib/queries/content";
import { fetchClients } from "@/lib/queries/clients";
import { cacheGet } from "@/lib/queryCache";
import type { ContentItem, ContentStatus, ContentType, Client, SocialPlatform } from "@/lib/supabase/types";
import { Plus, Trash2, X, Lightbulb, ArrowLeft } from "lucide-react";

const COLUMNS: { status: ContentStatus; label: string; color: string; titleColor: string }[] = [
  { status: "idea",        label: "רעיון",        color: "#8B5CF6", titleColor: "#6D28D9" },
  { status: "in_progress", label: "בעריכה",       color: "#F59E0B", titleColor: "#B45309" },
  { status: "future",      label: "מוכן לפרסום",  color: "#22C55E", titleColor: "#16A34A" },
  { status: "done",        label: "פורסם",         color: "#9CA3AF", titleColor: "#6B7280" },
];

const PLATFORM_LABELS: Record<SocialPlatform | "all", string> = {
  all: "הכל", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", general: "כללי",
};
const PLATFORM_FILTERS = ["all", "instagram", "tiktok", "facebook"] as const;
const TYPE_LABELS: Record<ContentType, string> = { post: "פוסט", reel: "ריל", story: "סטורי" };
const PLATFORMS: SocialPlatform[] = ["instagram", "tiktok", "facebook", "general"];
const TYPES: ContentType[] = ["post", "reel", "story"];

const platformColor: Record<string, string> = {
  instagram: "rgba(193,53,132,0.10)", tiktok: "rgba(1,1,1,0.07)",
  facebook: "rgba(24,119,242,0.10)", general: "rgba(156,163,175,0.12)",
};
const platformText: Record<string, string> = {
  instagram: "#C13584", tiktok: "#010101", facebook: "#1877F2", general: "#9CA3AF",
};

const btnCls = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-xs font-medium transition ${active ? "bg-accent text-white" : "calm-card text-t-3 hover:text-t-1"}`;

function AddForm({ status, clients, onAdd, onClose }: {
  status: ContentStatus; clients: Client[];
  onAdd: (item: ContentItem) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [type, setType] = useState<ContentType>("post");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !clientId) return;
    setSaving(true);
    try {
      const item = await createContentItem({ client_id: clientId, title: title.trim(), type, platform });
      if (status !== "idea") await updateContentStatus(item.id, status);
      onAdd({ ...item, status });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="calm-card rounded-2xl p-3 space-y-2.5 border border-accent/20">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
        placeholder="כותרת הפריט..."
        className="w-full text-sm text-t-1 bg-transparent focus:outline-none placeholder:text-t-4" />

      <div>
        <p className="text-[10px] text-t-4 mb-1">לקוח</p>
        <select value={clientId} onChange={e => setClientId(e.target.value)}
          className="w-full text-xs text-t-1 bg-transparent calm-card rounded-lg px-2 py-1 focus:outline-none">
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <p className="text-[10px] text-t-4 mb-1">פלטפורמה</p>
        <div className="flex gap-1 flex-wrap">
          {PLATFORMS.map(p => (
            <button key={p} type="button" onClick={() => setPlatform(p)} className={btnCls(platform === p)}>
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-t-4 mb-1">סוג</p>
        <div className="flex gap-1">
          {TYPES.map(t => (
            <button key={t} type="button" onClick={() => setType(t)} className={btnCls(type === t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={saving || !title.trim()}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
          {saving ? "..." : "הוספה"}
        </button>
        <button onClick={onClose} className="text-xs text-t-3 hover:text-t-1 transition px-2">ביטול</button>
      </div>
    </div>
  );
}

type IdeaEntry = { id: string; text: string; platform: SocialPlatform | ""; createdAt: string };

function loadIdeas(): IdeaEntry[] {
  try { return JSON.parse(localStorage.getItem("idea-vault") ?? "[]"); } catch { return []; }
}
function saveIdeas(ideas: IdeaEntry[]) {
  try { localStorage.setItem("idea-vault", JSON.stringify(ideas)); } catch {}
}

export default function PipelinePage() {
  const [items, setItems]     = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<"all" | SocialPlatform>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [addingInCol, setAddingInCol] = useState<ContentStatus | null>(null);
  const [mobileCol, setMobileCol] = useState<ContentStatus>("idea");
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [ideaPlatform, setIdeaPlatform] = useState<SocialPlatform | "">("");
  const [activeView, setActiveView] = useState<"pipeline" | "ideas">("pipeline");

  const load = useCallback(async () => {
    const hasCached = cacheGet("content:all") !== null && cacheGet("clients") !== null;
    if (!hasCached) setLoading(true);
    try {
      const [allItems, allClients] = await Promise.all([fetchAllContentItems(), fetchClients()]);
      setItems(allItems);
      setClients(allClients);
    } catch (e) {
      console.error("pipeline load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setIdeas(loadIdeas()); }, []);

  function addIdea() {
    if (!newIdea.trim()) return;
    const next = [{ id: `idea-${Date.now()}`, text: newIdea.trim(), platform: ideaPlatform, createdAt: new Date().toISOString() }, ...ideas];
    setIdeas(next); saveIdeas(next);
    setNewIdea(""); setIdeaPlatform("");
  }

  function removeIdea(id: string) {
    const next = ideas.filter(i => i.id !== id);
    setIdeas(next); saveIdeas(next);
  }

  function promoteIdea(idea: IdeaEntry) {
    // Move idea to pipeline by opening the add form — for now just scroll up
    setNewIdea(""); removeIdea(idea.id);
  }

  async function moveItem(id: string, newStatus: ContentStatus) {
    await updateContentStatus(id, newStatus);
    if (newStatus === "done") {
      try { localStorage.setItem(`published-at-${id}`, new Date().toISOString()); } catch {}
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  }

  function isPublishedThisMonth(itemId: string): boolean {
    try {
      const val = localStorage.getItem(`published-at-${itemId}`);
      if (!val) return true; // legacy items without date — show them
      const d = new Date(val);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch { return true; }
  }

  async function removeItem(id: string) {
    await deleteContentItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleAdded(item: ContentItem) {
    setItems(prev => [item, ...prev]);
  }

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? "";

  const filtered = items.filter(i =>
    (platform === "all" || i.platform === platform) &&
    (clientFilter === "all" || i.client_id === clientFilter)
  );

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-t-1">פייפליין</h1>
          <p className="text-sm text-t-3 mt-0.5">{items.length} פריטי תוכן · {ideas.length} רעיונות</p>
        </div>
        <div className="flex gap-1 calm-card rounded-xl p-1">
          <button onClick={() => setActiveView("pipeline")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeView === "pipeline" ? "bg-white shadow-sm text-t-1" : "text-t-3 hover:text-t-1"}`}
            style={activeView === "pipeline" ? { background: "rgba(255,252,248,0.9)" } : {}}>
            תוכן
          </button>
          <button onClick={() => setActiveView("ideas")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${activeView === "ideas" ? "bg-white shadow-sm text-t-1" : "text-t-3 hover:text-t-1"}`}
            style={activeView === "ideas" ? { background: "rgba(255,252,248,0.9)" } : {}}>
            <Lightbulb size={13} />
            רעיונות
            {ideas.length > 0 && <span className="text-[10px] bg-accent/20 text-accent px-1.5 rounded-full">{ideas.length}</span>}
          </button>
        </div>
      </div>

      {activeView === "ideas" ? (
        /* ── Idea Vault ─────────────────────────────── */
        <div className="max-w-2xl">
          <div className="flex gap-2 mb-6">
            <input value={newIdea} onChange={e => setNewIdea(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addIdea(); }}
              placeholder="רעיון חדש... (Enter להוספה)"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-t-1 calm-card focus:outline-none focus:ring-1 focus:ring-[#4A7A96]/40 placeholder:text-t-4" />
            <div className="flex gap-1">
              {(["instagram","tiktok","facebook"] as SocialPlatform[]).map(p => {
                const isActive = ideaPlatform === p;
                const ps: Record<string, { color: string; bg: string; activeBg: string; border: string }> = {
                  instagram: { color: "#C13584", bg: "rgba(193,53,132,0.08)", activeBg: "rgba(193,53,132,0.18)", border: "1.5px solid rgba(193,53,132,0.35)" },
                  tiktok:    { color: "#010101", bg: "rgba(1,1,1,0.06)",      activeBg: "rgba(1,1,1,0.14)",       border: "1.5px solid rgba(1,1,1,0.25)" },
                  facebook:  { color: "#1877F2", bg: "rgba(24,119,242,0.08)", activeBg: "rgba(24,119,242,0.18)", border: "1.5px solid rgba(24,119,242,0.35)" },
                };
                const s = ps[p];
                return (
                  <button key={p} onClick={() => setIdeaPlatform(ideaPlatform === p ? "" : p)}
                    className="px-2.5 py-1 rounded-xl text-xs font-medium transition"
                    style={{ color: s.color, background: isActive ? s.activeBg : s.bg, border: s.border, fontWeight: isActive ? 600 : 500 }}>
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              })}
            </div>
            <button onClick={addIdea} disabled={!newIdea.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition">
              <Plus size={15} />
            </button>
          </div>

          {ideas.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-3 opacity-30">💡</p>
              <p className="text-sm text-t-3">זרקי רעיונות לכאן · אין צורך לשייך ללקוח עדיין</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ideas.map(idea => (
                <div key={idea.id} className="group calm-card rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-t-1">{idea.text}</p>
                    {idea.platform && (
                      <span className="text-[10px] text-t-4 mt-0.5 block">{PLATFORM_LABELS[idea.platform as SocialPlatform]}</span>
                    )}
                  </div>
                  <button onClick={() => removeIdea(idea.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-t-4 hover:text-[#F87171] transition shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <>
      {/* Filters */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-t-4 w-16 text-left shrink-0">פלטפורמה</span>
          <div className="flex gap-1">
            {PLATFORM_FILTERS.map(p => {
              const isActive = platform === p;
              const platformStyles: Record<string, { color: string; bg: string; activeBg: string; border: string }> = {
                instagram: { color: "#C13584", bg: "rgba(193,53,132,0.08)", activeBg: "rgba(193,53,132,0.18)", border: "1.5px solid rgba(193,53,132,0.35)" },
                tiktok:    { color: "#010101", bg: "rgba(1,1,1,0.06)",      activeBg: "rgba(1,1,1,0.14)",       border: "1.5px solid rgba(1,1,1,0.25)" },
                facebook:  { color: "#1877F2", bg: "rgba(24,119,242,0.08)", activeBg: "rgba(24,119,242,0.18)", border: "1.5px solid rgba(24,119,242,0.35)" },
              };
              const s = platformStyles[p];
              if (!s) {
                return (
                  <button key={p} onClick={() => setPlatform(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                    style={isActive ? { background: "#100F0C", color: "#FEFDFB" } : { background: "#FEFDFB", color: "#98948C", border: "1px solid rgba(30,20,10,0.08)" }}>
                    {PLATFORM_LABELS[p]}
                  </button>
                );
              }
              return (
                <button key={p} onClick={() => setPlatform(p)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
                  style={{ color: s.color, background: isActive ? s.activeBg : s.bg, border: s.border, fontWeight: isActive ? 600 : 500 }}>
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-t-4 w-16 text-left shrink-0">לקוח</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setClientFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${clientFilter === "all" ? "calm-card text-t-1 shadow-sm" : "text-t-3 hover:text-t-1"}`}>
              הכל
            </button>
            {clients.map(c => (
              <button key={c.id} onClick={() => setClientFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${clientFilter === c.id ? "calm-card text-t-1 shadow-sm" : "text-t-3 hover:text-t-1"}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile column tabs */}
      <div className="md:hidden flex gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {COLUMNS.map(col => (
          <button key={col.status} onClick={() => setMobileCol(col.status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${mobileCol === col.status ? "text-white" : "calm-card text-t-3"}`}
            style={mobileCol === col.status ? { background: col.color } : {}}>
            {col.label}
          </button>
        ))}
      </div>

      {/* Kanban — desktop: horizontal scroll, mobile: single column */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
        {COLUMNS.map((col, colIdx) => {
          const colItems = filtered.filter(i =>
            i.status === col.status &&
            (col.status !== "done" || isPublishedThisMonth(i.id))
          );
          const isAdding = addingInCol === col.status;
          return (
            <div key={col.status} className="flex flex-col gap-2 min-w-[240px] flex-1">
              <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: col.color }}>
                <span className="text-sm font-semibold" style={{ color: col.titleColor }}>
                  {col.label}
                  {col.status === "done" && (
                    <span className="text-[10px] font-normal text-t-4 mr-1">
                      · {new Date().toLocaleDateString("he-IL", { month: "long" })}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-t-4">{colItems.length}</span>
                  <button onClick={() => setAddingInCol(isAdding ? null : col.status)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition ${isAdding ? "bg-accent/10 text-accent" : "text-t-4 hover:text-accent hover:bg-accent/8"}`}>
                    {isAdding ? <X size={12} /> : <Plus size={12} />}
                    {!isAdding && "הוספה"}
                  </button>
                </div>
              </div>

              {isAdding && clients.length > 0 && (
                <AddForm
                  status={col.status}
                  clients={clients}
                  onAdd={handleAdded}
                  onClose={() => setAddingInCol(null)}
                />
              )}

              {colItems.length === 0 && !isAdding && (
                <div className="rounded-2xl border-2 border-dashed border-border/30 h-20 flex items-center justify-center">
                  <span className="text-xs text-t-4">ריק</span>
                </div>
              )}

              {colItems.map(item => (
                <div key={item.id} className="group calm-card rounded-2xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium text-t-1 leading-snug flex-1">{item.title}</p>
                    <button onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-t-4 hover:text-[#F87171] transition shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: platformColor[item.platform], color: platformText[item.platform] }}>
                      {PLATFORM_LABELS[item.platform as SocialPlatform]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium calm-pill text-t-3">
                      {TYPE_LABELS[item.type as ContentType] ?? item.type}
                    </span>
                    <span className="text-[10px] text-t-4 font-medium">{clientName(item.client_id)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      {colIdx > 0 && (
                        <button onClick={() => moveItem(item.id, COLUMNS[colIdx - 1].status)}
                          className="text-[10px] text-t-3 hover:text-accent transition px-2 py-0.5 rounded-lg calm-card">
                          ◄ {COLUMNS[colIdx - 1].label}
                        </button>
                      )}
                      {colIdx < COLUMNS.length - 2 && (
                        <button onClick={() => moveItem(item.id, COLUMNS[colIdx + 1].status)}
                          className="text-[10px] text-t-3 hover:text-accent transition px-2 py-0.5 rounded-lg calm-card">
                          {COLUMNS[colIdx + 1].label} ►
                        </button>
                      )}
                    </div>
                    {col.status !== "done" && (
                      <button onClick={() => moveItem(item.id, "done")}
                        className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg transition"
                        style={{ background: "rgba(156,163,175,0.15)", color: "#6B7280" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,0.15)"; e.currentTarget.style.color = "#4A6B50"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(156,163,175,0.15)"; e.currentTarget.style.color = "#6B7280"; }}>
                        פורסם ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Mobile: single column view */}
      <div className="md:hidden flex flex-col gap-2">
        {COLUMNS.filter(col => col.status === mobileCol).map((col, colIdx) => {
          const colItems = filtered.filter(i =>
            i.status === col.status &&
            (col.status !== "done" || isPublishedThisMonth(i.id))
          );
          const isAdding = addingInCol === col.status;
          return (
            <div key={col.status} className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b-2" style={{ borderColor: col.color }}>
                <span className="text-sm font-semibold" style={{ color: col.titleColor }}>{col.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-t-4">{colItems.length}</span>
                  <button onClick={() => setAddingInCol(isAdding ? null : col.status)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition ${isAdding ? "bg-accent/10 text-accent" : "text-t-4 hover:text-accent"}`}>
                    {isAdding ? <X size={12} /> : <Plus size={12} />}
                    {!isAdding && "הוספה"}
                  </button>
                </div>
              </div>
              {colItems.length === 0 && !isAdding && (
                <p className="text-xs text-t-4 text-center py-6">ריק</p>
              )}
              {colItems.map(item => {
                const client = clients.find(c => c.id === item.client_id);
                return (
                  <div key={item.id} className="calm-card rounded-xl p-3 relative group">
                    <p className="text-sm font-medium text-t-1 leading-snug ml-5">{item.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {client && <span className="text-[11px] text-t-3">{client.name}</span>}
                      {item.type && <span className="text-[11px] px-2 py-0.5 rounded-full calm-card text-t-3">{TYPE_LABELS[item.type]}</span>}
                      {item.platform && item.platform !== "general" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: platformColor[item.platform], color: platformText[item.platform] }}>{PLATFORM_LABELS[item.platform]}</span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="absolute left-2 top-2 p-1 text-t-4 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
