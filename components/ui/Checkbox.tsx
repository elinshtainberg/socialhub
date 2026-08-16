import { Check } from "lucide-react";
export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} aria-label="toggle"
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
      style={checked
        ? { background:"linear-gradient(135deg,#9C9078,#B59A7F)", boxShadow:"0 0 12px rgba(156,144,120,0.35)" }
        : { background:"rgba(255,252,248,0.5)", border:"1px solid rgba(181,154,127,0.14)" }}>
      {checked && <Check size={12} color="white" strokeWidth={3} />}
    </button>
  );
}
