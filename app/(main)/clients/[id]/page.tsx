"use client";
import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClientHeader } from "@/components/clients/ClientHeader";
import { WorkTab } from "@/components/clients/tabs/WorkTab";
import { ContentTab } from "@/components/clients/tabs/ContentTab";
import { NotesTab } from "@/components/clients/tabs/NotesTab";
import { StatsTab } from "@/components/clients/tabs/StatsTab";
import { ContactLogTab } from "@/components/clients/tabs/ContactLogTab";
import { RecurringTab } from "@/components/clients/tabs/RecurringTab";
import { BrandTab } from "@/components/clients/tabs/BrandTab";
import { InspirationTab } from "@/components/clients/tabs/InspirationTab";
import { CollabTab } from "@/components/clients/tabs/CollabTab";
import { fetchClient } from "@/lib/queries/clients";
import type { Client } from "@/lib/supabase/types";

type PrimaryTab = "manage" | "brand";

const manageTabs = [
  { key: "work",      label: "לוח" },
  { key: "content",   label: "תוכן" },
  { key: "stats",     label: "ביצועים" },
  { key: "log",       label: "לוג קשר" },
  { key: "recurring", label: "תוכן קבוע" },
] as const;

const brandTabs = [
  { key: "brand",       label: "מותג" },
  { key: "inspiration", label: "השראה" },
  { key: "collab",      label: "שיתופי פעולה" },
  { key: "notes",       label: "הערות" },
] as const;

type ManageTabKey = (typeof manageTabs)[number]["key"];
type BrandTabKey  = (typeof brandTabs)[number]["key"];
type SubTabKey    = ManageTabKey | BrandTabKey;

const manageKeys = manageTabs.map(t => t.key) as string[];

export default function ClientHubPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const subTab = (searchParams.get("tab") as SubTabKey) || "work";

  const primaryTab: PrimaryTab = manageKeys.includes(subTab) ? "manage" : "brand";
  const defaultBrandSub: BrandTabKey = "brand";
  const defaultManageSub: ManageTabKey = "work";

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setClient(await fetchClient(clientId));
    setLoading(false);
  }, [clientId]);
  useEffect(() => { load(); }, [load]);

  function setPrimary(p: PrimaryTab) {
    const sub = p === "manage" ? defaultManageSub : defaultBrandSub;
    router.push(`/clients/${clientId}?tab=${sub}`);
  }

  function setSub(key: SubTabKey) {
    router.push(`/clients/${clientId}?tab=${key}`);
  }

  if (loading || !client) return <Spinner />;

  const primaryBtnCls = (active: boolean) =>
    `px-5 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-accent text-white shadow-sm" : "text-t-3 hover:text-t-1"}`;

  const subBtnCls = (active: boolean) =>
    `px-4 py-1.5 rounded-lg text-sm font-medium transition ${active ? "calm-card text-t-1 shadow-sm" : "text-t-3 hover:text-t-1"}`;

  return (
    <div>
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-t-3 hover:text-accent mb-4 transition">
        <ArrowRight size={15} /> חזרה לכל הלקוחות
      </Link>
      <ClientHeader client={client} onUpdated={(updates) => setClient((prev) => prev ? { ...prev, ...updates } : prev)} />

      {/* Primary tabs */}
      <div className="flex gap-1 mb-4">
        <button onClick={() => setPrimary("manage")} className={primaryBtnCls(primaryTab === "manage")}>ניהול</button>
        <button onClick={() => setPrimary("brand")}  className={primaryBtnCls(primaryTab === "brand")}>מותג</button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6">
        {primaryTab === "manage"
          ? manageTabs.map(t => (
              <button key={t.key} onClick={() => setSub(t.key)} className={subBtnCls(subTab === t.key)}>
                {t.label}
              </button>
            ))
          : brandTabs.map(t => (
              <button key={t.key} onClick={() => setSub(t.key)} className={subBtnCls(subTab === t.key)}>
                {t.label}
              </button>
            ))
        }
      </div>

      {subTab === "work"        && <WorkTab clientId={clientId} />}
      {subTab === "content"     && <ContentTab clientId={clientId} />}
      {subTab === "stats"       && <StatsTab clientId={clientId} client={client} />}
      {subTab === "log"         && <ContactLogTab clientId={clientId} />}
      {subTab === "recurring"   && <RecurringTab clientId={clientId} />}
      {subTab === "brand"       && <BrandTab clientId={clientId} />}
      {subTab === "inspiration" && <InspirationTab clientId={clientId} />}
      {subTab === "collab"      && <CollabTab clientId={clientId} />}
      {subTab === "notes"       && <NotesTab clientId={clientId} />}
    </div>
  );
}
