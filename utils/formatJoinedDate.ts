export function formatJoinedDate(
  createdAt: string | undefined,
  lang: string,
): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const locale = lang === "ur" ? "ur-PK" : "en-US";
  const month = date.toLocaleString(locale, { month: "short" });
  return `${month}, ${date.getFullYear()}`;
}
