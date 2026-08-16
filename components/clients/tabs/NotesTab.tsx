"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { fetchNote, upsertNote } from "@/lib/queries/content";
import type { Note } from "@/lib/supabase/types";

export function NotesTab({ clientId }: { clientId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    const data = await fetchNote(clientId);
    setNote(data); setContent(data?.content ?? ""); setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  function handleChange(value: string) {
    setContent(value); setSaved(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => { await upsertNote(clientId, value, note?.id); setSaved(true); }, 700);
  }

  if (loading) return <p className="text-sm text-t-3">טוען...</p>;

  return (
    <div className="calm-card rounded-2xl p-4">
      <div className="flex justify-end mb-2">
        <span className="text-xs text-t-3">{saved ? "נשמר" : "שומר..."}</span>
      </div>
      <textarea value={content} onChange={(e) => handleChange(e.target.value)}
        placeholder="כתבי כאן כל מה שבא לך..."
        className="w-full h-80 resize-none text-sm leading-relaxed bg-transparent text-t-1 placeholder-t-muted" />
    </div>
  );
}
