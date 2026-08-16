import { X } from "lucide-react";
export function Modal({ open, onClose, children }: {
  open: boolean; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl flex flex-col max-h-[90vh]"
        style={{
          background: "#FEFDFB",
          border: "1px solid rgba(30,20,10,0.08)",
          boxShadow: "0 8px 48px rgba(28,18,8,0.16), 0 2px 8px rgba(28,18,8,0.08)",
        }}>
        <button onClick={onClose} className="absolute left-5 top-5 text-t-4 hover:text-t-2 transition-colors z-10 p-1 rounded-md hover:bg-black/5">
          <X size={16} />
        </button>
        <div className="overflow-y-auto p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
