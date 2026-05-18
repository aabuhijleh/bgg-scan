import { nanoid } from "nanoid";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { fetchBggGameDetails, searchBgg } from "~/features/bgg/bgg.api";
import { delay } from "~/features/bgg/bgg-api";
import { lookupBarcode } from "~/features/lookup/lookup.api";
import type { ScanResult } from "~/features/scanner/scanner.types";
import { parseInput } from "./parse-input";
import type { ScannedGame } from "./scan-results.types";

interface UseScanPipelineOptions {
  results: ScannedGame[];
  addResult: (game: ScannedGame) => void;
  updateResult: (id: string, patch: Partial<ScannedGame>) => void;
  removeResult: (id: string) => void;
}

export function useScanPipeline({
  results,
  addResult,
  updateResult,
  removeResult,
}: UseScanPipelineOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const isDuplicateBggId = (id: string, bggId: number) => {
    const existing = results.find((r) => r.bggId === bggId && r.id !== id);
    if (existing) {
      removeResult(id);
      toast.info("Game already in results", {
        description: existing.bggName ?? existing.productTitle,
      });
      return true;
    }
    return false;
  };

  const searchByName = async (
    id: string,
    name: string,
  ): Promise<{ rateLimited: boolean }> => {
    const maxRetries = 3;
    let rateLimited = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const match = await searchBgg({ data: name });

        if (match.status === "found") {
          if (isDuplicateBggId(id, match.id)) return { rateLimited };
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
        return { rateLimited };
      } catch (err) {
        rateLimited = true;
        if (attempt < maxRetries) {
          const backoffMs = 10_000 * 2 ** attempt;
          updateResult(id, {
            status: "searching_bgg",
            error: `Rate limited — retrying in ${Math.round(backoffMs / 1000)}s...`,
          });
          await delay(backoffMs);
          updateResult(id, { status: "searching_bgg", error: undefined });
        } else {
          updateResult(id, {
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }
    return { rateLimited };
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

  const [isBatchActive, setIsBatchActive] = useState(false);

  const addManualEntries = async (input: string) => {
    const names = parseInput(input);
    if (names.length === 0) return;

    const entries = names.map((name) => ({ id: nanoid(), name }));

    for (const entry of entries) {
      addResult({
        id: entry.id,
        barcode: "",
        barcodeFormat: "manual",
        status: "searching_bgg",
        productTitle: entry.name,
      });
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsBatchActive(true);

    try {
      for (let i = 0; i < entries.length; i++) {
        if (controller.signal.aborted) break;

        const { rateLimited } = await searchByName(
          entries[i].id,
          entries[i].name,
        );

        if (controller.signal.aborted) break;
        if (i < entries.length - 1) {
          await delay(rateLimited ? 15_000 : 2_000);
        }
      }
    } finally {
      abortControllerRef.current = null;
      setIsBatchActive(false);
    }
  };

  const cancelBatch = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsBatchActive(false);

    for (const r of results) {
      if (r.status === "searching_bgg") {
        updateResult(r.id, { status: "skipped" });
      }
    }

    toast.info("Batch search cancelled");
  };

  return {
    processScan,
    retrySearch,
    addManualEntries,
    cancelBatch,
    isBatchActive,
  };
}
