import { ButtonHTMLAttributes } from "react";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md";
}
export function Button({ variant="primary", size="md", className="", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 font-normal disabled:opacity-35 select-none transition-all duration-200";
  const v: Record<string,string> = {
    primary:"calm-btn-primary", secondary:"calm-btn-ghost",
    ghost:"rounded-xl text-t-2 hover:text-t-1 transition-colors duration-200",
  };
  const s: Record<string,string> = { sm:"px-3 py-1.5 text-xs rounded-xl", md:"px-5 py-2.5 text-sm" };
  return <button className={`${base} ${v[variant]} ${s[size]} ${className}`} {...props} />;
}
