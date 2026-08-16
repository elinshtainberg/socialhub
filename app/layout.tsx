import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "היום שלי",
  description: "ניהול לקוחות ולימודים - אישי ומהיר",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen  text-t-1 antialiased">
        {children}
      </body>
    </html>
  );
}
