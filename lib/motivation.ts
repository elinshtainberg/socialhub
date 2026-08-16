const motivationSentences = [
  "לא חייב מושלם, חייב להופיע.",
  "עוד אימון קטן בונה אותך קדימה.",
  "הגוף זוכר עקביות.",
  "היום עושים משהו בשביל עצמך.",
  "גם 30 דקות נחשבות.",
  "התנועה היא חגיגה של מה שהגוף שלך מסוגל לעשות.",
  "אין ימים מושלמים לאימון, יש רק ימים שבהם מתאמנים.",
];

// Picks a sentence based on the current local day — changes automatically
// once a day, no backend/automation needed.
export function getDailyMotivation(date: Date = new Date()): string {
  const index = date.getDate() % motivationSentences.length;
  return motivationSentences[index];
}
