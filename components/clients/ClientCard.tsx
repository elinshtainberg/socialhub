"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Client } from "@/lib/supabase/types";
import { formatDateHe } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { colorHex } from "@/lib/clientColors";

function getNextAction(clientId: string) {
  try { return localStorage.getItem(`next-action-${clientId}`) ?? ""; } catch { return ""; }
}

function getLastContact(clientId: string): number | null {
  try {
    const raw = localStorage.getItem(`contact-log-${clientId}`);
    if (!raw) return null;
    const entries: { date: string }[] = JSON.parse(raw);
    if (!entries.length) return null;
    const latest = entries.map(e => new Date(e.date).getTime()).sort((a, b) => b - a)[0];
    return Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

type HealthStatus = "good" | "warn" | "alert";

function getHealth(clientId: string, nextAction: string): { status: HealthStatus; tip: string } {
  if (!nextAction) return { status: "alert", tip: "אין צעד הבא מוגדר" };
  const daysSince = getLastContact(clientId);
  if (daysSince !== null && daysSince > 14) return { status: "warn", tip: `לא היה קשר ${daysSince} ימים` };
  return { status: "good", tip: "הכל מסודר" };
}

const healthDot: Record<HealthStatus, string> = {
  good:  "bg-[#22C55E]",
  warn:  "bg-[#F59E0B]",
  alert: "bg-[#EF4444]",
};

export function ClientCard({ client, onDelete, shootLabel }: { client: Client; onDelete: (id: string) => void; shootLabel?: string | null }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nextAction, setNextAction] = useState("");
  const [health, setHealth] = useState<{ status: HealthStatus; tip: string } | null>(null);
  const isOneTime = client.client_type === "one_time";

  useEffect(() => {
    const na = getNextAction(client.id);
    setNextAction(na);
    setHealth(getHealth(client.id, na));
  }, [client.id]);

  return (
    <>
      <div className="group calm-card transition-all relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: colorHex(client.color) }} />
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmOpen(true); }}
          className="absolute left-3 top-3 p-1.5 rounded-lg text-t-4 hover:bg-[#C24A1A]/10 hover:text-[#C24A1A] opacity-0 group-hover:opacity-100 transition">
          <Trash2 size={13} />
        </button>
        <Link href={`/clients/${client.id}`} className="block p-5 pt-6">
          <div className="flex items-center justify-between mb-2 pl-7">
            <div className="flex items-center gap-2">
              {health && (
                <span title={health.tip} className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: colorHex(client.color), opacity: health.status === "good" ? 1 : health.status === "warn" ? 0.6 : 0.35 }} />
              )}
              <h3 className="text-[15px] font-semibold text-t-1">{client.name}</h3>
            </div>
            {client.monthly_retainer && (
              <span className="text-[13px] text-t-1 font-semibold">₪{client.monthly_retainer.toLocaleString()}</span>
            )}
          </div>
          {client.business_name && <p className="text-xs text-t-4 mb-1">{client.business_name}</p>}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {isOneTime && <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.07] text-t-3 font-medium">חד פעמי</span>}
            {isOneTime && client.project_date && <span className="text-xs text-t-4">{formatDateHe(client.project_date)}</span>}
          </div>
          {client.content_summary && <p className="text-xs text-t-3 line-clamp-2">{client.content_summary}</p>}
          {nextAction ? (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#1D4ED8" }} />
              <p className="text-xs font-semibold truncate" style={{ color: "#1D4ED8" }}>{nextAction}</p>
            </div>
          ) : shootLabel ? (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#C24A1A" }} />
              <p className="text-xs font-medium truncate" style={{ color: "#C24A1A" }}>{shootLabel}</p>
            </div>
          ) : null}
        </Link>
      </div>
      <ConfirmDialog open={confirmOpen} message="למחוק את הלקוח?" onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { onDelete(client.id); setConfirmOpen(false); }} />
    </>
  );
}
