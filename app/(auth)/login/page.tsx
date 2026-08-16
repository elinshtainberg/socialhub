"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else { router.push("/today"); router.refresh(); }
  }

  async function handleMagicLink() {
    if (!email) { setMessage("יש להזין אימייל קודם"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    setMessage(error ? error.message : "נשלח קישור לאימייל שלך ✨");
  }

  const inputCls = "w-full   rounded-xl px-4 py-3 text-sm text-t-1 placeholder-t-muted focus:border-brand transition";

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm calm-card  rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-t-1 mb-1">היום שלי</h1>
        <p className="text-sm text-t-3 mb-6">כניסה לחשבון שלך</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-brand to-brand-light text-white py-3 text-sm font-medium hover:opacity-90 transition shadow-glow">
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
        <button onClick={handleMagicLink} disabled={loading}
          className="w-full mt-3 rounded-xl  text-t-2 py-3 text-sm font-medium hover:calm-card-hover transition">
          שלח לי קישור כניסה
        </button>
        <p className="mt-4 text-center text-sm text-t-3">
          עוד אין לך חשבון?{" "}
          <Link href="/signup" className="text-brand hover:underline">הרשמה</Link>
        </p>
        {message && <p className="mt-4 text-xs text-center text-[#F87171]">{message}</p>}
      </div>
    </div>
  );
}
