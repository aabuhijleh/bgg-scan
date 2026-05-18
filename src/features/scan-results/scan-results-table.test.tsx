/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScannedGame } from "./scan-results.types";
import { ScanResultsTable } from "./scan-results-table";

const gameNames = [
  "7 Wonders",
  "Azul",
  "Brass: Birmingham",
  "Carcassonne",
  "Codenames",
  "Cosmic Encounter",
  "Dominion",
  "Dune: Imperium",
  "Everdell",
  "Hanabi",
  "Inis",
  "Kemet",
  "Lost Ruins of Arnak",
  "Nemesis",
  "Oath",
  "Pandemic",
  "Patchwork",
  "Root",
  "Scythe",
  "Spirit Island",
];

const statuses: ScannedGame["status"][] = [
  "found",
  "not_found",
  "ambiguous",
  "skipped",
];

function makeResults(count: number): ScannedGame[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    barcode: `0000000${String(i).padStart(5, "0")}`,
    barcodeFormat: "ean_13",
    status: statuses[i % statuses.length],
    productTitle: gameNames[i % gameNames.length],
    ...(i % statuses.length === 0
      ? {
          bggId: 100000 + i,
          bggName: gameNames[i % gameNames.length],
          yearPublished: 2020,
          thumbnail: `https://example.com/${i}.jpg`,
        }
      : {}),
  }));
}

describe("ScanResultsTable", () => {
  afterEach(() => cleanup());

  const defaultProps = {
    onResolve: vi.fn(),
    onSkip: vi.fn(),
    onRetry: vi.fn(),
    onDelete: vi.fn(),
  };

  describe("pagination stability on data updates", () => {
    it("stays on page 2 when a row status updates", async () => {
      const user = userEvent.setup();
      const results = makeResults(60);
      const { rerender } = render(
        <ScanResultsTable {...defaultProps} results={results} />,
      );

      expect(screen.getByText(/Page 1 of 3/)).toBeDefined();
      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();

      const updated = results.map((r, i) =>
        i === 30
          ? {
              ...r,
              status: "found" as const,
              bggId: 99999,
              bggName: "Updated Game",
              yearPublished: 2023,
              thumbnail: "https://example.com/updated.jpg",
            }
          : r,
      );
      rerender(<ScanResultsTable {...defaultProps} results={updated} />);

      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();
    });

    it("stays on page 2 across multiple rapid status updates", async () => {
      const user = userEvent.setup();
      const results = makeResults(60);
      const { rerender } = render(
        <ScanResultsTable {...defaultProps} results={results} />,
      );

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();

      for (let update = 0; update < 5; update++) {
        const updated = results.map((r, i) =>
          i === update
            ? {
                ...r,
                status: "found" as const,
                bggId: 90000 + update,
                bggName: `Game ${update}`,
                yearPublished: 2020,
                thumbnail: `https://example.com/${update}.jpg`,
              }
            : r,
        );
        rerender(<ScanResultsTable {...defaultProps} results={updated} />);
      }

      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();
    });
  });

  describe("pagination resets on filter/search changes", () => {
    it("resets to page 1 when typing in the search box", async () => {
      const user = userEvent.setup();
      const results = makeResults(60);
      render(<ScanResultsTable {...defaultProps} results={results} />);

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();

      const searchInput = screen.getByPlaceholderText(
        "Search barcodes, titles, BGG names...",
      );
      await user.type(searchInput, "Azul");

      const pageText = screen.queryByText(/Page 2/);
      expect(pageText).toBeNull();
    });

    it("resets to page 1 when changing the status filter", async () => {
      const user = userEvent.setup();
      const results = makeResults(60);
      render(<ScanResultsTable {...defaultProps} results={results} />);

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await user.click(nextButton);
      expect(screen.getByText(/Page 2 of 3/)).toBeDefined();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);
      const foundOption = screen.getByRole("option", { name: "Found" });
      await user.click(foundOption);

      const pageText = screen.queryByText(/Page 2/);
      expect(pageText).toBeNull();
    });
  });
});
