import { describe, expect, it } from "vitest";
import { generateCsv } from "./export";

const makeGame = (
  overrides: Partial<{
    barcode: string;
    productTitle: string;
    bggId: number;
    bggName: string;
    yearPublished: number | null;
  }> = {},
) => ({
  barcode: "0123456789",
  productTitle: "Catan",
  bggId: 13,
  bggName: "Catan",
  yearPublished: 1995 as number | null,
  ...overrides,
});

describe("generateCsv", () => {
  it("generates CSV with correct headers", () => {
    const csv = generateCsv([]);
    expect(csv).toBe(
      "Barcode,Product Title,BGG ID,BGG Name,Year Published,BGG URL",
    );
  });

  it("handles empty array (headers only)", () => {
    const lines = generateCsv([]).split("\n");
    expect(lines).toHaveLength(1);
  });

  it("generates rows with all fields populated", () => {
    const csv = generateCsv([makeGame()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      "0123456789,Catan,13,Catan,1995,https://boardgamegeek.com/boardgame/13",
    );
  });

  it("handles null yearPublished (empty field)", () => {
    const csv = generateCsv([makeGame({ yearPublished: null })]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe(
      "0123456789,Catan,13,Catan,,https://boardgamegeek.com/boardgame/13",
    );
  });

  it("escapes fields containing commas", () => {
    const csv = generateCsv([
      makeGame({ productTitle: "Ticket to Ride, Europe" }),
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Ticket to Ride, Europe"');
  });

  it("escapes fields containing double quotes (doubles them)", () => {
    const csv = generateCsv([makeGame({ bggName: 'Say "Hello"' })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Say ""Hello"""');
  });

  it("escapes fields containing newlines", () => {
    const csv = generateCsv([makeGame({ productTitle: "Line1\nLine2" })]);
    const lines = csv.split("\n");
    const joined = lines.slice(1).join("\n");
    expect(joined).toContain('"Line1\nLine2"');
  });

  it("generates correct BGG URL from bggId", () => {
    const csv = generateCsv([makeGame({ bggId: 42 })]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain("https://boardgamegeek.com/boardgame/42");
  });

  it("handles multiple games", () => {
    const csv = generateCsv([
      makeGame({ barcode: "111", bggId: 1 }),
      makeGame({ barcode: "222", bggId: 2 }),
      makeGame({ barcode: "333", bggId: 3 }),
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain("111");
    expect(lines[2]).toContain("222");
    expect(lines[3]).toContain("333");
  });
});
