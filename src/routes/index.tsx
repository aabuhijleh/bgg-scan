import { createFileRoute } from "@tanstack/react-router";
import { Plus, ScanBarcode, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { parseInput } from "~/features/scan-results/parse-input";
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
  const {
    processScan,
    retrySearch,
    addManualEntries,
    cancelBatch,
    isBatchActive,
  } = useScanPipeline({
    results,
    addResult,
    updateResult,
    removeResult,
  });
  const [manualInput, setManualInput] = useState("");
  const parsedNames = parseInput(manualInput);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualAdd = () => {
    if (parsedNames.length === 0) {
      toast.warning("Enter at least one game name");
      return;
    }
    addManualEntries(manualInput);
    setManualInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setManualInput((prev) => (prev ? `${prev}\n${text}` : text));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-8 md:max-w-4xl">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ScanBarcode className="size-8 shrink-0" />
            <h1 className="font-bold text-3xl tracking-tight">BGG Scan</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-muted-foreground text-sm">
          Scan board game barcodes and identify them on BoardGameGeek.
        </p>
      </header>

      <ScannerPanel onBarcodeDetected={processScan} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs">or add manually</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <InputGroup>
        <InputGroupTextarea
          placeholder={"Catan; Wingspan; Azul\nor one game per line"}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="font-mono"
        />
        <InputGroupAddon align="block-end" className="border-t">
          <InputGroupText>
            {parsedNames.length > 0
              ? `${parsedNames.length} game${parsedNames.length === 1 ? "" : "s"}`
              : ""}
          </InputGroupText>
          <InputGroupButton
            size="sm"
            className="ml-auto"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            Upload CSV
          </InputGroupButton>
          <InputGroupButton
            size="sm"
            variant="default"
            onClick={handleManualAdd}
          >
            <Plus /> Add
          </InputGroupButton>
        </InputGroupAddon>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
      </InputGroup>

      {results.length > 0 && (
        <ScanResultsTable
          results={results}
          onResolve={resolveAmbiguity}
          onSkip={skipResult}
          onRetry={retrySearch}
          onDelete={removeResult}
          isBatchActive={isBatchActive}
          onCancelBatch={cancelBatch}
        />
      )}

      <footer className="mt-auto p-2 text-center">
        <Button
          variant="link"
          asChild
          className="font-normal text-muted-foreground active:not-aria-[haspopup]:translate-y-0"
        >
          <a
            href="https://github.com/aabuhijleh/bgg-scan"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </Button>
      </footer>
    </div>
  );
}
