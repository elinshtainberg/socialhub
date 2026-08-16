import React from "react";

export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-10">
      <div>
        <h1 className="text-[32px] font-light tracking-tight leading-none mb-1.5" style={{ color: "#111110" }}>{title}</h1>
        {subtitle && <div className="text-sm font-light" style={{ color: "#9A9A98" }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
