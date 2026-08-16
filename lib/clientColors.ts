export const CLIENT_COLORS: { name: string; hex: string }[] = [
  { name: "rose",    hex: "#F43F5E" },
  { name: "orange",  hex: "#F97316" },
  { name: "amber",   hex: "#F59E0B" },
  { name: "green",   hex: "#22C55E" },
  { name: "teal",    hex: "#14B8A6" },
  { name: "blue",    hex: "#3B82F6" },
  { name: "indigo",  hex: "#6366F1" },
  { name: "purple",  hex: "#A855F7" },
  { name: "pink",    hex: "#EC4899" },
  { name: "stone",   hex: "#78716C" },
];

export function colorHex(name: string): string {
  return CLIENT_COLORS.find(c => c.name === name)?.hex ?? "#6366F1";
}
