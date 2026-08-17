"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, FileSpreadsheet, Kanban, LogOut, Search, Settings, User, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchClients } from "@/lib/queries/clients";
import { fetchAllContentItems } from "@/lib/queries/content";
import { fetchTasks } from "@/lib/queries/tasks";
import { createClient } from "@/lib/supabase/client";
import type { Client, ContentItem, Task } from "@/lib/supabase/types";

const calendarHrefs = ["/today", "/week", "/month"];

type NavItem = { href: string; label: string; icon: React.ElementType; calendarGroup: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "יומן",
    items: [{ href:"/today", label:"היומן שלי", icon:Calendar, calendarGroup:true }],
  },
  {
    label: "עבודה",
    items: [
      { href:"/clients",         label:"לקוחות",   icon:Users,           calendarGroup:false },
      { href:"/pipeline",        label:"פייפליין",  icon:Kanban,          calendarGroup:false },
      { href:"/monthly-summary", label:"חשבוניות",  icon:FileSpreadsheet, calendarGroup:false },
    ],
  },
  {
    label: "אישי",
    items: [
      { href:"/personal",  label:"אישי",    icon:User,     calendarGroup:false },
      { href:"/settings",  label:"הגדרות",  icon:Settings, calendarGroup:false },
    ],
  },
];

type ResultType = "client" | "content" | "task";
type SearchResult = { type: ResultType; label: string; sub: string; href: string };

const TYPE_HE: Record<ResultType, string> = {
  client: "לקוח", content: "תוכן", task: "משימה",
};
const TYPE_COLOR: Record<ResultType, string> = {
  client:  "bg-[#111110]/10 text-[#111110]",
  content: "bg-[#1D4ED8]/10 text-[#1D4ED8]",
  task:    "bg-[#C24A1A]/10 text-[#C24A1A]",
};

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([fetchClients(), fetchAllContentItems(), fetchTasks({ excludeDone: false })])
      .then(([c, ct, t]) => { setClients(c); setContent(ct); setTasks(t); });
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();

    const categoryKeywords: { keywords: string[]; fn: () => SearchResult[] }[] = [
      { keywords: ["לקוח","client"], fn: () => clients.map(c=>({type:"client" as ResultType,label:c.name,sub:c.business_name??"לקוח",href:`/clients/${c.id}`})) },
      { keywords: ["תוכן","content","פייפליין"], fn: () => content.map(ct=>({type:"content" as ResultType,label:ct.title,sub:clients.find(c=>c.id===ct.client_id)?.name??"",href:`/clients/${ct.client_id}?tab=content`})) },
      { keywords: ["משימה","משימות","task"], fn: () => tasks.map(t=>({type:"task" as ResultType,label:t.title,sub:t.due_date??"משימה",href:"/today"})) },
    ];

    const matched = categoryKeywords.find(cat => cat.keywords.some(kw => kw.includes(q) || q.includes(kw)));
    if (matched) { setResults(matched.fn().slice(0,10)); return; }

    const all: SearchResult[] = [
      ...clients.filter(c=>c.name.toLowerCase().includes(q)||(c.business_name??"").toLowerCase().includes(q)).map(c=>({type:"client" as ResultType,label:c.name,sub:c.business_name??"לקוח",href:`/clients/${c.id}`})),
      ...content.filter(ct=>ct.title.toLowerCase().includes(q)).map(ct=>({type:"content" as ResultType,label:ct.title,sub:clients.find(c=>c.id===ct.client_id)?.name??"",href:`/clients/${ct.client_id}?tab=content`})),
      ...tasks.filter(t=>t.title.toLowerCase().includes(q)).map(t=>({type:"task" as ResultType,label:t.title,sub:t.due_date??"משימה",href:"/today"})),
    ];
    setResults(all.slice(0,10));
  }, [query, clients, content, tasks]);

  function activate() { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }
  function close() { setOpen(false); setQuery(""); setResults([]); }
  function go(href: string) { router.push(href); close(); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); activate(); }
      if (e.key==="Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button onClick={activate}
        className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-right text-[13px] font-light mb-1 transition-all"
        style={{ color: "rgba(235,228,218,0.45)", background: "rgba(255,255,255,0.06)" }}>
        <Search size={13} className="opacity-60 shrink-0" />
        <span>חיפוש</span>
        <span className="text-[10px] mr-auto opacity-40">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
          onClick={close}>
          <div className="w-full max-w-md mx-4 overflow-hidden"
            style={{ background: "#FEFDFB", borderRadius: 20, border: "1px solid rgba(30,20,10,0.08)", boxShadow: "0 12px 60px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.10)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(28,18,8,0.07)" }}>
              <Search size={15} className="text-t-4 shrink-0" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="חפשי לקוח, תוכן, משימה..."
                className="flex-1 text-sm text-t-1 bg-transparent focus:outline-none placeholder:text-t-4" />
              <button onClick={close} className="text-[11px] text-t-4 hover:text-t-2 transition px-2 py-0.5 rounded bg-black/[0.05]">esc</button>
            </div>
            {results.length > 0 && (
              <div className="py-1.5 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <button key={i} onClick={() => go(r.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.04] transition text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TYPE_COLOR[r.type]}`}>{TYPE_HE[r.type]}</span>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[13px] font-medium text-t-1 truncate">{r.label}</p>
                      <p className="text-[11px] text-t-4 truncate">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query && results.length === 0 && <p className="text-sm text-t-4 text-center py-8">לא נמצאו תוצאות</p>}
          </div>
        </div>
      )}
    </>
  );
}

const bottomNavItems = [
  { href: "/today",          label: "יומן",     icon: Calendar },
  { href: "/clients",        label: "לקוחות",   icon: Users },
  { href: "/monthly-summary",label: "חשבוניות", icon: FileSpreadsheet },
  { href: "/personal",       label: "אישי",     icon: User },
  { href: "/pipeline",       label: "פייפליין", icon: Kanban },
];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop — dark warm charcoal sidebar, three material layers */}
      <aside className="hidden md:flex w-[220px] shrink-0 h-screen sticky top-0 flex-col px-4 py-8"
        style={{
          background: "rgba(28,24,20,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}>

        <div className="mb-8 px-2">
          <h1 className="text-sm font-medium tracking-wide mb-0.5" style={{ color: "rgba(235,228,218,0.90)" }}>היום שלי</h1>
          <p className="text-[11px] font-light tracking-widest" style={{ color: "rgba(235,228,218,0.35)" }}>לוח בקרה</p>
        </div>

        <div className="mb-3">
          <GlobalSearch />
        </div>

        <nav className="flex flex-col flex-1 gap-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              <p className="px-3 mb-1 text-[10px] font-medium tracking-widest uppercase"
                style={{ color: "rgba(235,228,218,0.28)" }}>
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, icon: Icon, calendarGroup }) => {
                  const active = calendarGroup
                    ? calendarHrefs.some(h => path === h || path.startsWith(h+"/"))
                    : path === href || path.startsWith(href+"/");
                  return (
                    <Link key={href} href={href}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-all duration-150"
                      style={{
                        background: active ? "rgba(255,255,255,0.12)" : "transparent",
                        color: active ? "rgba(235,228,218,0.95)" : "rgba(235,228,218,0.45)",
                        fontWeight: active ? 500 : 300,
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(235,228,218,0.75)"; }}
                      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(235,228,218,0.45)"; } }}>
                      <Icon size={14} className="shrink-0" style={{ opacity: active ? 0.90 : 0.45 }} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg w-full text-right text-[12px] font-light mb-1 transition-all"
          style={{ color: "rgba(235,228,218,0.35)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(235,228,218,0.65)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(235,228,218,0.35)"; }}>
          <LogOut size={13} className="opacity-60 shrink-0" />
          <span>יציאה</span>
        </button>
        <p className="px-2 text-[10px] font-light tracking-widest" style={{ color: "rgba(235,228,218,0.20)" }}>v1.0</p>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-2 py-2"
        style={{ background: "rgba(28,24,20,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href+"/");
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <Icon size={20} style={{ color: active ? "rgba(235,228,218,0.95)" : "rgba(235,228,218,0.35)" }} />
              <span className="text-[10px]" style={{ color: active ? "rgba(235,228,218,0.80)" : "rgba(235,228,218,0.35)" }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
