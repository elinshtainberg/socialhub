"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("נשלח אימייל אימות — בדקי את תיבת הדואר שלך ✨");
      setTimeout(() => router.push("/login"), 3000);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-sm text-t-1 placeholder-t-muted focus:border-brand transition calm-input";

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm calm-card rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-t-1 mb-1">הצטרפי</h1>
        <p className="text-sm text-t-3 mb-6">יצירת חשבון חדש</p>
        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
          <input
            type="password"
            placeholder="סיסמה (לפחות 6 תווים)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-brand to-brand-light text-white py-3 text-sm font-medium hover:opacity-90 transition shadow-glow"
          >
            {loading ? "יוצר חשבון..." : "הרשמה"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-t-3">
          כבר יש לך חשבון?{" "}
          <Link href="/login" className="text-brand hover:underline">
            כניסה
          </Link>
        </p>
        {message && (
          <p className="mt-4 text-xs text-center" style={{ color: message.includes("✨") ? "#16A34A" : "#F87171" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
