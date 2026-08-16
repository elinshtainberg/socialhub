import { HTMLAttributes } from "react";
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`calm-card p-5 ${className}`} {...props} />;
}
