const map: Record<string, string> = {
  purple:"calm-pill", blue:"calm-pill", green:"calm-pill", orange:"calm-pill",
  red:"calm-pill", pink:"calm-pill", gray:"calm-pill", urgent:"accent-pill",
};
export function Badge({ children, color="gray" }: { children: React.ReactNode; color?: string }) {
  return <span className={map[color] ?? "calm-pill"}>{children}</span>;
}
