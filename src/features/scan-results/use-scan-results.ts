import { useState } from "react";
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
    updateResult(id, {
      status: "found",
      bggId,
      bggName,
      yearPublished,
      thumbnail,
      candidates: undefined,
    });
  };

  const skipResult = (id: string) => {
    updateResult(id, { status: "skipped", candidates: undefined });
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
    clearResults,
  };
}
