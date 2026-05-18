export function parseInput(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const semicolons = (trimmed.match(/;/g) || []).length;
  const newlines = (trimmed.match(/\n/g) || []).length;
  const commas = (trimmed.match(/,/g) || []).length;

  let delimiter: string;
  if (semicolons >= newlines && semicolons >= commas) {
    delimiter = ";";
  } else if (newlines >= commas) {
    delimiter = "\n";
  } else {
    delimiter = ",";
  }

  const items = trimmed
    .split(delimiter)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  return [...new Set(items)];
}
