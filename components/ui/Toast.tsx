"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Toast({
  message,
  undoLabel = "ביטול",
  onUndo,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderRadius: 14,
        background: "rgba(51,41,31,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#F7F1EA",
        fontSize: 13,
        fontWeight: 300,
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        direction: "rtl",
        whiteSpace: "nowrap",
      }}
    >
      <span>{message}</span>
      {onUndo && (
        <button
          onClick={onUndo}
          style={{
            color: "#C67D4E",
            fontWeight: 500,
            fontSize: 13,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {undoLabel}
        </button>
      )}
    </div>,
    document.body
  );
}
