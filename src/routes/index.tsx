import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "~/components/theme-toggle";
import { ScanResultsTable } from "~/features/scan-results/scan-results-table";
import { useScanPipeline } from "~/features/scan-results/use-scan-pipeline";
import { useScanResults } from "~/features/scan-results/use-scan-results";
import { ScannerPanel } from "~/features/scanner/scanner-panel";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { results, addResult, updateResult, resolveAmbiguity, skipResult } =
    useScanResults();
  const { processScan, retrySearch } = useScanPipeline({
    results,
    addResult,
    updateResult,
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-4 pb-8">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">BGG Scan</h1>
        <ThemeToggle />
      </header>

      <ScannerPanel onBarcodeDetected={processScan} />

      {results.length > 0 && (
        <ScanResultsTable
          results={results}
          onResolve={resolveAmbiguity}
          onSkip={skipResult}
          onRetry={retrySearch}
        />
      )}
    </div>
  );
}
