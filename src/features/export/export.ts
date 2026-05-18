interface ExportableGame {
  barcode: string;
  productTitle: string;
  bggId: number;
  bggName: string;
  yearPublished: number | null;
}

function escapeField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCsv(games: ExportableGame[]): string {
  const headers = [
    "Barcode",
    "Product Title",
    "BGG ID",
    "BGG Name",
    "Year Published",
    "BGG URL",
  ];
  const rows = games.map((g) => [
    g.barcode,
    g.productTitle,
    String(g.bggId),
    g.bggName,
    g.yearPublished != null ? String(g.yearPublished) : "",
    `https://boardgamegeek.com/boardgame/${g.bggId}`,
  ]);
  return [headers, ...rows]
    .map((row) => row.map(escapeField).join(","))
    .join("\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
