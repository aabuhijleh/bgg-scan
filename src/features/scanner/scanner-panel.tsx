import { AlertTriangle, Camera, ScanBarcode } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ScanResult } from "./scanner.types";
import { useBarcodeScanner } from "./use-barcode-scanner";

export function ScannerPanel({
  onBarcodeDetected,
}: {
  onBarcodeDetected: (result: ScanResult) => void;
}) {
  const {
    videoRef,
    isScanning,
    error,
    results,
    cameras,
    selectedCameraId,
    startScanning,
    stopScanning,
    switchCamera,
  } = useBarcodeScanner();

  const prevCountRef = useRef(0);

  useEffect(() => {
    if (results.length > prevCountRef.current) {
      for (let i = prevCountRef.current; i < results.length; i++) {
        onBarcodeDetected(results[i]);
      }
      prevCountRef.current = results.length;
    }
  }, [results, onBarcodeDetected]);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border">
        <div className="relative aspect-[4/3] bg-black/5 md:aspect-[21/9] dark:bg-white/5">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 size-full object-cover"
          />
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Camera className="size-12 opacity-40" />
              <span className="text-sm">Camera preview</span>
            </div>
          )}
        </div>

        {isScanning && cameras.length > 1 && (
          <div className="flex items-center gap-2 border-t px-3 pt-3">
            <Camera className="shrink-0 text-muted-foreground" />
            <Select value={selectedCameraId} onValueChange={switchCamera}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((cam) => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 p-3">
          {!isScanning ? (
            <Button onClick={() => startScanning()} className="flex-1">
              <ScanBarcode />
              Start Scanning
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="flex-1"
            >
              Stop Scanning
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
