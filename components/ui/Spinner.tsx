export function Spinner({ text = "טוען..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div
        className="w-5 h-5 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(156,144,120,0.25)", borderTopColor: "rgba(156,144,120,0.75)" }}
      />
      <p className="text-sm font-light text-t-3">{text}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-2xl opacity-30">🌧</p>
      <p className="text-sm font-light text-t-2">משהו השתבש</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium px-4 py-2 rounded-xl transition-all"
          style={{ background: "rgba(156,144,120,0.12)", color: "#3E4640" }}
        >
          נסי שוב
        </button>
      )}
    </div>
  );
}
