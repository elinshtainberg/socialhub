// Recurring content schedule — stored in localStorage per client.
// Each rule defines: which platform, what content type, which days of week.
// The Today page reads all clients' rules and surfaces what's due today.

import type { SocialPlatform, ContentType } from "@/lib/supabase/types";

export type RecurringRule = {
  id: string;
  platform: SocialPlatform | "all";
  contentType: ContentType;
  days: number[]; // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  label: string;  // free text, e.g. "סטורי יומי"
};

export type RecurringItem = RecurringRule & { clientId: string; clientName: string };

const key = (clientId: string) => `recurring-${clientId}`;

export function loadRules(clientId: string): RecurringRule[] {
  try { return JSON.parse(localStorage.getItem(key(clientId)) ?? "[]"); } catch { return []; }
}

export function saveRules(clientId: string, rules: RecurringRule[]) {
  localStorage.setItem(key(clientId), JSON.stringify(rules));
}

// Returns all recurring items due on the given day-of-week (0=Sun)
export function getDueToday(
  clients: { id: string; name: string }[],
  dayOfWeek: number
): RecurringItem[] {
  const items: RecurringItem[] = [];
  for (const c of clients) {
    for (const rule of loadRules(c.id)) {
      if (rule.days.includes(dayOfWeek)) {
        items.push({ ...rule, clientId: c.id, clientName: c.name });
      }
    }
  }
  return items;
}

// Mark a recurring item as done for a specific date (YYYY-MM-DD)
const doneKey = (ruleId: string, date: string) => `rec-done-${ruleId}-${date}`;
export function markDone(ruleId: string, date: string) {
  localStorage.setItem(doneKey(ruleId, date), "1");
}
export function unmarkDone(ruleId: string, date: string) {
  localStorage.removeItem(doneKey(ruleId, date));
}
export function isDone(ruleId: string, date: string): boolean {
  try { return localStorage.getItem(doneKey(ruleId, date)) === "1"; } catch { return false; }
}
