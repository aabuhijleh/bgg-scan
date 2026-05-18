import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScanResultsTable } from "~/features/scan-results/scan-results-table";
import { useScanPipeline } from "~/features/scan-results/use-scan-pipeline";
import { useScanResults } from "~/features/scan-results/use-scan-results";
import { ScannerPanel } from "~/features/scanner/scanner-panel";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const {
    results,
    addResult,
    updateResult,
    resolveAmbiguity,
    skipResult,
    removeResult,
  } = useScanResults();
  const { processScan, retrySearch, addManualEntries } = useScanPipeline({
    results,
    addResult,
    updateResult,
    removeResult,
  });
  const [manualInput, setManualInput] = useState("");

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;
    addManualEntries(manualInput);
    setManualInput("");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 md:max-w-4xl">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">BGG Scan</h1>
        <ThemeToggle />
      </header>

      <ScannerPanel onBarcodeDetected={processScan} />

      <div className="flex gap-2">
        <Input
          placeholder="Add games (use ; for multiple)"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleManualAdd();
          }}
          className="min-w-0 flex-1"
        />
        <Button
          onClick={handleManualAdd}
          disabled={!manualInput.trim()}
          className="shrink-0"
        >
          <Plus />
          Add
        </Button>
      </div>

      {results.length > 0 && (
        <ScanResultsTable
          results={results}
          onResolve={resolveAmbiguity}
          onSkip={skipResult}
          onRetry={retrySearch}
          onDelete={removeResult}
        />
      )}
    </div>
  );
}
