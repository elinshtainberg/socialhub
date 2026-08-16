import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/auth";
import type { Invoice } from "@/lib/supabase/types";
import { cachedFetch, cacheInvalidate } from "@/lib/queryCache";
import { USE_MOCK_DATA, mockInvoices } from "@/lib/mockData";

export async function fetchInvoicesForMonth(month: string) {
  if (USE_MOCK_DATA) return mockInvoices.filter((i) => i.month === month);

  return cachedFetch(`invoices:${month}`, async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("invoices").select("*").eq("month", month);
    if (error) throw error;
    return data as Invoice[];
  });
}

// Creates a new invoice row if `id` isn't a real existing one (or is a "virtual-" id
// generated client-side for a client that doesn't have an invoice row yet),
// otherwise updates the existing row.
export async function upsertInvoice(input: {
  id: string;
  client_id: string;
  month: string;
  description: string;
  amount: number | null;
  tax_id: string | null;
  status: Invoice["status"];
  notes: string | null;
}) {
  if (USE_MOCK_DATA) {
    const isVirtual = input.id.startsWith("virtual-");
    if (!isVirtual) {
      const existing = mockInvoices.find((i) => i.id === input.id);
      if (existing) {
        Object.assign(existing, input);
        return existing;
      }
    }
    const newInvoice: Invoice = {
      ...input,
      id: `invoice-${Date.now()}`,
      user_id: "mock-user",
    };
    mockInvoices.push(newInvoice);
    return newInvoice;
  }

  const supabase = createClient();
  const isVirtual = input.id.startsWith("virtual-");
  if (!isVirtual) {
    const { data, error } = await supabase
      .from("invoices")
      .update(input)
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...input, id: undefined, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  cacheInvalidate("invoices:");
  return data as Invoice;
}
