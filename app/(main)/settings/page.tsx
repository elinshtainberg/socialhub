"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { GoogleCalendarSync } from "@/components/settings/GoogleCalendarSync";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  return (
    <div className="space-y-6 max-w-md">
      <PageHeader title="הגדרות" />
      <Card>
        <h2 className="text-sm font-semibold mb-2">חשבון</h2>
        <p className="text-sm text-t-2">{email}</p>
      </Card>
      <div>
        <p className="text-xs font-medium text-t-4 uppercase tracking-wide mb-2">אינטגרציות</p>
        <GoogleCalendarSync />
      </div>
    </div>
  );
}
