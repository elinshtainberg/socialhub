"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { fetchClients } from "@/lib/queries/clients";
import type { Client } from "@/lib/supabase/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type NextActionRow = {
  client: Client;
  action: string;
  daysSinceContact: number | null;
};

function getNextAction(id: string) {
  try { return localStorage.getItem(`next-action-${id}`) ?? ""; } catch { return ""; }
}

function getDaysSinceContact(id: string): number | null {
  try {
    const raw = localStorage.getItem(`contact-log-${id}`);
    if (!raw) return null;
    const entries: { date: string }[] = JSON.parse(raw);
    if (!entries.length) return null;
    const latest = entries.map(e => new Date(e.date).getTime()).sort((a, b) => b - a)[0];
    return Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

export default function InboxPage() {
  const [rows, setRows] = useState<NextActionRow[]>([]);
  const [noAction, setNoAction] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients().then(clients => {
      const withAction: NextActionRow[] = [];
      const without: Client[] = [];
      clients.forEach(c => {
        const action = getNextAction(c.id);
        if (action) {
          withAction.push({ client: c, action, daysSinceContact: getDaysSinceContact(c.id) });
        } else {
          without.push(c);
        }
      });
      setRows(withAction);
      setNoAction(without);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-t-1">צעדים הבאים</h1>
        <p className="text-sm text-t-3 mt-0.5">מבט מרוכז על כל מה שממתין לך עם לקוחות</p>
      </div>

      {rows.length === 0 && noAction.length === 0 && (
        <p className="text-sm text-t-3 text-center py-16">אין לקוחות עדיין</p>
      )}

      {rows.length > 0 && (
        <div className="space-y-2 mb-8">
          {rows.map(({ client, action, daysSinceContact }) => (
            <Link key={client.id} href={`/clients/${client.id}`}
              className="group flex items-center gap-4 calm-card rounded-2xl px-5 py-4 hover:bg-[rgba(181,154,127,0.04)] transition">
              <span className="w-2 h-2 rounded-full bg-accent/70 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-t-1 truncate">{action}</p>
                <p className="text-xs text-t-4 mt-0.5">{client.name}
                  {daysSinceContact !== null && (
                    <span className={`mr-2 ${daysSinceContact > 14 ? "text-[#FBBF24]" : ""}`}>
                      · קשר לפני {daysSinceContact} ימים
                    </span>
                  )}
                </p>
              </div>
              <ArrowLeft size={14} className="text-t-4 opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
      )}

      {noAction.length > 0 && (
        <div>
          <p className="section-label mb-3">ללא צעד הבא מוגדר</p>
          <div className="space-y-1.5">
            {noAction.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="group flex items-center gap-3 px-5 py-3 rounded-xl hover:calm-card transition">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]/60 shrink-0" />
                <span className="text-sm text-t-2 flex-1">{c.name}</span>
                <span className="text-xs text-t-4 opacity-0 group-hover:opacity-100 transition">הגדרי צעד הבא ←</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
