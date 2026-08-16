"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const views = [
  { href: "/today", label: "היום שלי" },
  { href: "/week",  label: "השבוע שלי" },
  { href: "/month", label: "החודש שלי" },
];

export function CalendarViewSwitcher() {
  const path = usePathname();
  return (
    <div className="flex gap-0.5 rounded-xl p-1 w-fit mb-8"
      style={{ background: "rgba(0,0,0,0.06)" }}>
      {views.map(({ href, label }) => {
        const active = path === href;
        return (
          <Link key={href} href={href}
            className={`px-4 py-1.5 rounded-lg text-[13px] transition-all duration-150 ${
              active
                ? "font-medium text-t-1"
                : "font-light text-t-4 hover:text-t-2"
            }`}
            style={active ? {
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10), 0 1px 1px rgba(0,0,0,0.06)",
            } : {}}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
