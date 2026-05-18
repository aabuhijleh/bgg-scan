import { useState } from "react";
import { toast } from "sonner";
import type { ScannedGame } from "./scan-results.types";

export function useScanResults() {
  const [results, setResults] = useState<ScannedGame[]>([]);

  const addResult = (game: ScannedGame) => {
    setResults((prev) => [...prev, game]);
  };

  const updateResult = (id: string, patch: Partial<ScannedGame>) => {
    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const resolveAmbiguity = (
    id: string,
    bggId: number,
    bggName: string,
    yearPublished: number | null,
    thumbnail: string,
  ) => {
    setResults((prev) => {
      const duplicate = prev.find((r) => r.bggId === bggId && r.id !== id);
      if (duplicate) {
        toast.info("Game already in results", {
          description: duplicate.bggName ?? duplicate.productTitle,
        });
        return prev.filter((r) => r.id !== id);
      }
      return prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "found" as const,
              bggId,
              bggName,
              yearPublished,
              thumbnail,
              candidates: undefined,
            }
          : r,
      );
    });
  };

  const skipResult = (id: string) => {
    updateResult(id, { status: "skipped", candidates: undefined });
  };

  const removeResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const clearResults = () => {
    setResults([]);
  };

  return {
    results,
    addResult,
    updateResult,
    resolveAmbiguity,
    skipResult,
    removeResult,
    clearResults,
  };
}
