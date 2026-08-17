"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Link2, Link2Off, Check } from "lucide-react";

export function GoogleCalendarSync() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/google/status")
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false));
  }, []);

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      setConnected(false);
    } finally {
      setDisconnecting(false);
    }
  }

  if (connected === null) {
    return (
      <div className="calm-card rounded-2xl p-4 flex items-center gap-3">
        <RefreshCw size={16} className="text-t-4 animate-spin" />
        <span className="text-sm text-t-3">בודק חיבור...</span>
      </div>
    );
  }

  return (
    <div className="calm-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Google Calendar icon */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(66,133,244,0.10)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#4285F4" strokeWidth="1.5"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="7" y="13" width="4" height="4" rx="0.5" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-t-1">Google Calendar</p>
            {connected ? (
              <p className="text-[11px] text-t-4 flex items-center gap-1">
                <Check size={10} className="text-green-500" /> מחובר · סנכרון אוטומטי פעיל
              </p>
            ) : (
              <p className="text-[11px] text-t-4">אירועים ומשימות מסונכרנים דו-כיוונית</p>
            )}
          </div>
        </div>

        {connected ? (
          <button onClick={disconnect} disabled={disconnecting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-40"
            style={{ color: "#9C8B7A", background: "rgba(181,154,127,0.10)" }}>
            <Link2Off size={13} />
            {disconnecting ? "מנתק..." : "ניתוק"}
          </button>
        ) : (
          <a href="/api/auth/google/connect"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition"
            style={{ color: "#4285F4", background: "rgba(66,133,244,0.10)" }}>
            <Link2 size={13} />
            חיבור
          </a>
        )}
      </div>

      {connected && (
        <p className="text-[11px] text-t-4 leading-relaxed">
          אירועים מגוגל קלנדר מוצגים בלוח בתג כחול. פריטים שיצרת כאן מועברים אוטומטית לגוגל.
        </p>
      )}
    </div>
  );
}
