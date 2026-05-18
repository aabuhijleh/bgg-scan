const FILLER_SUFFIX =
  /[\s\-–—:,]+(?:the\s+)?(?:board|card|dice|party|strategy|family|tabletop|classic)?\s*game\b[\s\-–—:,]*$/i;

const STANDALONE_BOARD = /[\s\-–—:,]+board\s*$/i;

function stripFillerSuffix(title: string): string {
  let cleaned = title;
  // Iteratively strip — handles "SKULL Board Game - Card Game" edge cases
  for (let i = 0; i < 3; i++) {
    const next = cleaned
      .replace(FILLER_SUFFIX, "")
      .replace(STANDALONE_BOARD, "")
      .trim();
    if (next === cleaned || next.length === 0) break;
    cleaned = next;
  }
  return cleaned;
}

export function getCleanTitle(item: {
  title: string;
  offers?: { title: string }[];
}): string {
  const offerTitles =
    item.offers?.map((o) => o.title.trim()).filter(Boolean) ?? [];
  const freq = new Map<string, { count: number; original: string }>();
  for (const t of offerTitles) {
    const key = t.toLowerCase();
    const entry = freq.get(key);
    if (entry) entry.count++;
    else freq.set(key, { count: 1, original: t });
  }
  const best = [...freq.values()].sort((a, b) => b.count - a.count)[0];
  const raw = best
    ? best.original
    : item.title
        .replace(/\s*\(B[A-Z0-9]+\)\s*$/, "")
        .replace(/\s*\|.*$/, "")
        .trim();
  return stripFillerSuffix(raw);
}
