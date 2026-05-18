import { nanoid } from "nanoid";
import { toast } from "sonner";
import { fetchBggGameDetails, searchBgg } from "~/features/bgg/bgg.api";
import { lookupBarcode } from "~/features/lookup/lookup.api";
import type { ScanResult } from "~/features/scanner/scanner.types";
import type { ScannedGame } from "./scan-results.types";

interface UseScanPipelineOptions {
  results: ScannedGame[];
  addResult: (game: ScannedGame) => void;
  updateResult: (id: string, patch: Partial<ScannedGame>) => void;
}

export function useScanPipeline({
  results,
  addResult,
  updateResult,
}: UseScanPipelineOptions) {
  const searchByName = async (id: string, name: string) => {
    try {
      const match = await searchBgg({ data: name });

      if (match.status === "found") {
        const details = await fetchBggGameDetails({ data: [match.id] });
        const detail = details[0];
        updateResult(id, {
          status: "found",
          bggId: match.id,
          bggName: match.name,
          yearPublished: detail?.yearPublished ?? null,
          thumbnail: detail?.thumbnail,
        });
      } else if (match.status === "ambiguous") {
        const details = await fetchBggGameDetails({
          data: match.candidateIds,
        });
        updateResult(id, {
          status: "ambiguous",
          candidates: details,
        });
      } else {
        updateResult(id, { status: "not_found" });
      }
    } catch (err) {
      updateResult(id, {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const processScan = async (scan: ScanResult) => {
    const existing = results.find((r) => r.barcode === scan.rawValue);
    if (existing) {
      toast.info("Barcode already scanned", {
        description: existing.productTitle ?? existing.barcode,
      });
      return;
    }

    const id = nanoid();

    addResult({
      id,
      barcode: scan.rawValue,
      barcodeFormat: scan.format,
      status: "looking_up",
    });

    try {
      const product = await lookupBarcode({ data: scan.rawValue });

      updateResult(id, {
        status: "searching_bgg",
        productTitle: product.title,
      });

      await searchByName(id, product.title);
    } catch (err) {
      updateResult(id, {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const retrySearch = async (id: string, name: string) => {
    updateResult(id, {
      status: "searching_bgg",
      productTitle: name,
      error: undefined,
      candidates: undefined,
    });
    await searchByName(id, name);
  };

  const addManualEntry = async (name: string) => {
    const id = nanoid();

    addResult({
      id,
      barcode: "",
      barcodeFormat: "manual",
      status: "searching_bgg",
      productTitle: name,
    });

    await searchByName(id, name);
  };

  const addManualEntries = (input: string) => {
    const names = input
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const name of names) {
      addManualEntry(name);
    }
  };

  return { processScan, retrySearch, addManualEntries };
}
