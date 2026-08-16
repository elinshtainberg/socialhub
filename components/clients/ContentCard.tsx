"use client";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ContentItem, ContentStatus, SocialPlatform } from "@/lib/supabase/types";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const typeLabel: Record<string, string> = { post: "פוסט", reel: "ריל", story: "סטורי" };
const platformLabel: Record<SocialPlatform, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", general: "כללי" };
const platformColor: Record<SocialPlatform, string> = {
  instagram: "bg-[#E1306C]/15 text-[#E1306C]",
  tiktok:    "bg-[#010101]/10 text-[#555]",
  facebook:  "bg-[#1877F2]/15 text-[#1877F2]",
  general:   "bg-[#9CA3AF]/15 text-[#9CA3AF]",
};

type Column = { status: ContentStatus; label: string; accent: string };

export function ContentCard({ item, onStatusChange, onDelete, columns }: {
  item: ContentItem;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
  columns: Column[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const colIdx = columns.findIndex(c => c.status === item.status);
  const canBack    = colIdx > 0;
  const canForward = colIdx < columns.length - 1;

  return (
    <>
      <div className="calm-card rounded-xl p-3 group">
        {/* Platform + type badges */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${platformColor[item.platform]}`}>
            {platformLabel[item.platform]}
          </span>
          <span className="text-[10px] font-medium text-[#9C9078] bg-[#9C9078]/15 px-1.5 py-0.5 rounded-full">
            {typeLabel[item.type]}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-t-1 leading-snug mb-3">{item.title}</p>

        {/* Move between columns + delete */}
        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-0.5">
            <button
              onClick={() => canBack && onStatusChange(item.id, columns[colIdx - 1].status)}
              disabled={!canBack}
              className="p-1 rounded text-t-3 hover:text-t-1 disabled:opacity-20 transition"
              title={canBack ? columns[colIdx - 1].label : ""}
            >
              <ChevronRight size={13} />
            </button>
            <button
              onClick={() => canForward && onStatusChange(item.id, columns[colIdx + 1].status)}
              disabled={!canForward}
              className="p-1 rounded text-t-3 hover:text-accent disabled:opacity-20 transition"
              title={canForward ? columns[colIdx + 1].label : ""}
            >
              <ChevronLeft size={13} />
            </button>
          </div>
          <button onClick={() => setConfirmOpen(true)} className="p-1 text-t-4 hover:text-[#F87171] transition">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <ConfirmDialog open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={() => { onDelete(item.id); setConfirmOpen(false); }} />
    </>
  );
}
