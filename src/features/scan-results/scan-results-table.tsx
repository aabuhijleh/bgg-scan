import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCopy,
  Download,
  ExternalLink,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  copyToClipboard,
  downloadCsv,
  generateCsv,
} from "~/features/export/export";
import { DisambiguationRow } from "./disambiguation-row";
import type { ScannedGame } from "./scan-results.types";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "secondary" | "destructive" | "outline";
  }
> = {
  looking_up: { label: "Looking up...", variant: "secondary" },
  searching_bgg: { label: "Searching...", variant: "secondary" },
  found: { label: "Found", variant: "success" },
  ambiguous: { label: "Ambiguous", variant: "default" },
  not_found: { label: "Not Found", variant: "destructive" },
  skipped: { label: "Skipped", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
};

function searchFilterFn(
  row: { original: ScannedGame },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.toLowerCase();
  return (
    (row.original.productTitle?.toLowerCase().includes(query) ?? false) ||
    (row.original.bggName?.toLowerCase().includes(query) ?? false) ||
    row.original.barcode.includes(query)
  );
}

interface RetryInputProps {
  defaultValue: string;
  onRetry: (name: string) => void;
}

function RetryInput({ defaultValue, onRetry }: RetryInputProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onRetry(value.trim());
        }}
        className="h-7 min-w-0 flex-1 text-xs"
      />
      <Button
        variant="outline"
        size="icon"
        className="size-7 shrink-0"
        disabled={!value.trim()}
        onClick={() => onRetry(value.trim())}
      >
        <RotateCcw className="size-3" />
        <span className="sr-only">Retry search</span>
      </Button>
    </div>
  );
}

interface ScanResultsTableProps {
  results: ScannedGame[];
  onResolve: (
    id: string,
    bggId: number,
    bggName: string,
    yearPublished: number | null,
    thumbnail: string,
  ) => void;
  onSkip: (id: string) => void;
  onRetry: (id: string, name: string) => void;
}

export function ScanResultsTable({
  results,
  onResolve,
  onSkip,
  onRetry,
}: ScanResultsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<ScannedGame>[] = [
    {
      id: "expander",
      size: 40,
      header: () => null,
      cell: ({ row }) => {
        if (row.original.status !== "ambiguous") return null;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => row.toggleExpanded()}
            aria-expanded={row.getIsExpanded()}
          >
            <ChevronDown
              className={`size-4 transition-transform ${row.getIsExpanded() ? "rotate-180" : ""}`}
            />
            <span className="sr-only">Toggle candidates</span>
          </Button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status];
        if (!config) return null;
        const isProcessing =
          row.original.status === "looking_up" ||
          row.original.status === "searching_bgg";
        return (
          <Badge variant={config.variant}>
            {isProcessing && <Loader2 className="size-3 animate-spin" />}
            {config.label}
          </Badge>
        );
      },
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.original.status === filterValue;
      },
    },
    {
      accessorKey: "productTitle",
      header: "Product",
      cell: ({ row }) => (
        <span className="max-w-48 truncate">
          {row.original.productTitle ?? row.original.barcode}
        </span>
      ),
    },
    {
      accessorKey: "bggName",
      header: "BGG Match",
      cell: ({ row }) => {
        const { status, bggName, bggId, productTitle, barcode, id } =
          row.original;
        if (status === "not_found" || status === "error") {
          return (
            <RetryInput
              defaultValue={productTitle ?? barcode}
              onRetry={(name) => onRetry(id, name)}
            />
          );
        }
        if (!bggName || !bggId) return null;
        return (
          <a
            href={`https://boardgamegeek.com/boardgame/${bggId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm hover:underline"
          >
            {bggName}
            <ExternalLink className="size-3" />
          </a>
        );
      },
    },
    {
      accessorKey: "yearPublished",
      header: "Year",
      cell: ({ row }) => row.original.yearPublished ?? "",
    },
  ];

  const table = useReactTable({
    data: results,
    columns,
    state: { expanded, columnFilters, globalFilter },
    onExpandedChange: setExpanded,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilterFn,
    getRowCanExpand: (row) => row.original.status === "ambiguous",
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalScanned = results.length;
  const foundCount = results.filter((r) => r.status === "found").length;
  const ambiguousCount = results.filter((r) => r.status === "ambiguous").length;
  const pendingCount = results.filter(
    (r) => r.status === "looking_up" || r.status === "searching_bgg",
  ).length;
  const failedCount = results.filter(
    (r) =>
      r.status === "not_found" ||
      r.status === "error" ||
      r.status === "skipped",
  ).length;
  const progress =
    totalScanned > 0 ? ((totalScanned - pendingCount) / totalScanned) * 100 : 0;

  const exportableGames = results
    .filter(
      (r): r is ScannedGame & { bggId: number } =>
        r.status === "found" && r.bggId != null,
    )
    .map((r) => ({
      barcode: r.barcode,
      productTitle: r.productTitle ?? "",
      bggId: r.bggId,
      bggName: r.bggName ?? "",
      yearPublished: r.yearPublished ?? null,
    }));

  const handleExportCsv = () => {
    const csv = generateCsv(exportableGames);
    downloadCsv(csv, "bgg-scan-results.csv");
  };

  const handleCopyClipboard = async () => {
    const csv = generateCsv(exportableGames);
    await copyToClipboard(csv);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
        <span>
          Scanned: <strong className="text-foreground">{totalScanned}</strong>
        </span>
        <span>
          Found: <strong className="text-foreground">{foundCount}</strong>
        </span>
        <span>
          Ambiguous:{" "}
          <strong className="text-foreground">{ambiguousCount}</strong>
        </span>
        <span>
          Pending: <strong className="text-foreground">{pendingCount}</strong>
        </span>
        <span>
          Failed: <strong className="text-foreground">{failedCount}</strong>
        </span>
      </div>

      {pendingCount > 0 && <Progress value={progress} />}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search barcodes, titles, BGG names..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="found">Found</SelectItem>
            <SelectItem value="ambiguous">Ambiguous</SelectItem>
            <SelectItem value="not_found">Not Found</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exportableGames.length === 0}
          >
            <Download />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyClipboard}
            disabled={exportableGames.length === 0}
          >
            <ClipboardCopy />
            Copy
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    aria-expanded={row.getIsExpanded() ? "true" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && row.original.candidates && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <DisambiguationRow
                          candidates={row.original.candidates}
                          searchName={
                            row.original.productTitle ?? row.original.barcode
                          }
                          onSelect={(
                            bggId,
                            bggName,
                            yearPublished,
                            thumbnail,
                          ) => {
                            onResolve(
                              row.original.id,
                              bggId,
                              bggName,
                              yearPublished,
                              thumbnail,
                            );
                            row.toggleExpanded();
                          }}
                          onSkip={() => {
                            onSkip(row.original.id);
                            row.toggleExpanded();
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
