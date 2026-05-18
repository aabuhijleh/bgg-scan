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
  Trash2,
  X,
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
  showHint?: boolean;
}

function RetryInput({ defaultValue, onRetry, showHint }: RetryInputProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-1">
      {showHint && (
        <p className="text-muted-foreground text-xs">
          No BGG match found. Edit the name below and retry.
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onRetry(value.trim());
          }}
          className="h-7 min-w-0 flex-1 text-xs"
          placeholder="Edit game name and retry"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2"
          disabled={!value.trim()}
          onClick={() => onRetry(value.trim())}
        >
          <RotateCcw className="size-3" />
          Retry
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status];
  if (!config) return null;
  const isProcessing = status === "looking_up" || status === "searching_bgg";
  return (
    <Badge variant={config.variant}>
      {isProcessing && <Loader2 className="size-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}

interface ScanResultCardProps {
  game: ScannedGame;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onResolve: ScanResultsTableProps["onResolve"];
  onSkip: ScanResultsTableProps["onSkip"];
  onRetry: ScanResultsTableProps["onRetry"];
  onDelete: ScanResultsTableProps["onDelete"];
}

function ScanResultCard({
  game,
  isExpanded,
  onToggleExpand,
  onResolve,
  onSkip,
  onRetry,
  onDelete,
}: ScanResultCardProps) {
  const isAmbiguous = game.status === "ambiguous";
  const showRetry = game.status === "not_found" || game.status === "error";

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        {game.thumbnail && (
          <img
            src={game.thumbnail}
            alt={game.bggName ?? game.productTitle ?? ""}
            className="size-16 shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <StatusBadge status={game.status} />
              {game.status === "searching_bgg" && game.error && (
                <p className="text-muted-foreground text-xs">{game.error}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {game.yearPublished && (
                <span className="text-muted-foreground text-xs">
                  {game.yearPublished}
                </span>
              )}
              {isAmbiguous && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={onToggleExpand}
                  aria-expanded={isExpanded}
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                  <span className="sr-only">Toggle candidates</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(game.id)}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>

          <p className="font-medium text-sm leading-snug">
            {game.productTitle ?? game.barcode}
          </p>

          {game.bggName && game.bggId && (
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:underline"
            >
              {game.bggName}
              <ExternalLink className="size-3" />
            </a>
          )}

          {isAmbiguous && !isExpanded && game.candidates && (
            <p className="text-muted-foreground text-xs">
              {game.candidates.length} matches — tap to expand
            </p>
          )}

          {showRetry && (
            <RetryInput
              defaultValue={game.productTitle ?? game.barcode}
              onRetry={(name) => onRetry(game.id, name)}
              showHint
            />
          )}
        </div>
      </CardContent>

      {isAmbiguous && isExpanded && game.candidates && (
        <CardContent>
          <DisambiguationRow
            candidates={game.candidates}
            searchName={game.productTitle ?? game.barcode}
            onSelect={(bggId, bggName, yearPublished, thumbnail) => {
              onResolve(game.id, bggId, bggName, yearPublished, thumbnail);
              onToggleExpand();
            }}
            onSkip={() => {
              onSkip(game.id);
              onToggleExpand();
            }}
          />
        </CardContent>
      )}
    </Card>
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
  onDelete: (id: string) => void;
  isBatchActive?: boolean;
  onCancelBatch?: () => void;
}

export function ScanResultsTable({
  results,
  onResolve,
  onSkip,
  onRetry,
  onDelete,
  isBatchActive,
  onCancelBatch,
}: ScanResultsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

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
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge status={row.original.status} />
          {row.original.status === "searching_bgg" && row.original.error && (
            <p className="text-muted-foreground text-xs">
              {row.original.error}
            </p>
          )}
        </div>
      ),
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.original.status === filterValue;
      },
    },
    {
      accessorKey: "productTitle",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex max-w-xs items-center gap-2">
          {row.original.thumbnail && (
            <img
              src={row.original.thumbnail}
              alt=""
              className="size-8 shrink-0 rounded object-cover"
              loading="lazy"
            />
          )}
          <span className="line-clamp-2 break-words">
            {row.original.productTitle ?? row.original.barcode}
          </span>
        </div>
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
    {
      id: "actions",
      size: 40,
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(row.original.id)}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      ),
    },
  ];

  const resetPagination = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const table = useReactTable({
    data: results,
    columns,
    state: { expanded, columnFilters, globalFilter, pagination },
    onExpandedChange: setExpanded,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      resetPagination();
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      resetPagination();
    },
    onPaginationChange: setPagination,
    globalFilterFn: searchFilterFn,
    getRowCanExpand: (row) => row.original.status === "ambiguous",
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
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

  const paginatedRows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="flex items-center gap-1.5">
        <Badge variant="default" className="tabular-nums">
          {totalScanned} scanned
        </Badge>
        {foundCount > 0 && (
          <Badge variant="success" className="tabular-nums">
            {foundCount} found
          </Badge>
        )}
        {ambiguousCount > 0 && (
          <Badge variant="default" className="tabular-nums">
            {ambiguousCount} ambiguous
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            <Loader2 className="size-3 animate-spin" />
            {pendingCount} pending
          </Badge>
        )}
        {failedCount > 0 && (
          <Badge variant="destructive" className="tabular-nums">
            {failedCount} failed
          </Badge>
        )}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="flex-1" />
          {isBatchActive && onCancelBatch && (
            <Button variant="outline" size="sm" onClick={onCancelBatch}>
              <X />
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search barcodes, titles, BGG names..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <div className="flex gap-2">
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
            <SelectTrigger className="w-28 shrink-0">
              <SelectValue placeholder="Filter" />
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
              onClick={handleExportCsv}
              disabled={exportableGames.length === 0}
            >
              <Download />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyClipboard}
              disabled={exportableGames.length === 0}
            >
              <ClipboardCopy />
              Copy
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: Card list */}
      <div className="flex flex-col gap-2 md:hidden">
        {paginatedRows.length > 0 ? (
          paginatedRows.map((row) => (
            <ScanResultCard
              key={row.id}
              game={row.original}
              isExpanded={row.getIsExpanded()}
              onToggleExpand={() => row.toggleExpanded()}
              onResolve={onResolve}
              onSkip={onSkip}
              onRetry={onRetry}
              onDelete={onDelete}
            />
          ))
        ) : (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No results.
          </p>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden rounded-md border md:block">
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
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
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

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-3.5" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-3.5" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-3.5" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-3.5" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
