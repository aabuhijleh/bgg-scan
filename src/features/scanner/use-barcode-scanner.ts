import { BarcodeDetector } from "barcode-detector/pure";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraDevice, ScanResult } from "./scanner.types";

export function useBarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<InstanceType<typeof BarcodeDetector> | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<number>(0);
  const scanFrameRef = useRef<() => void>(() => {});

  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Map<string, ScanResult>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoDevices = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setCameras(videoDevices);
    });
  }, []);

  const stopScanning = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, []);

  useEffect(() => {
    scanFrameRef.current = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector) return;

      rafRef.current = requestAnimationFrame(async () => {
        const now = performance.now();
        if (now - lastScanRef.current < 200) {
          scanFrameRef.current();
          return;
        }
        lastScanRef.current = now;

        if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              setResults((prev) => {
                const next = new Map(prev);
                for (const b of barcodes) {
                  if (!next.has(b.rawValue)) {
                    next.set(b.rawValue, {
                      format: b.format,
                      rawValue: b.rawValue,
                    });
                  }
                }
                return next.size === prev.size ? prev : next;
              });
            }
          } catch {
            // transient frame errors are expected with video streams
          }
        }
        scanFrameRef.current();
      });
    };
  });

  const startScanning = useCallback(
    async (cameraId?: string) => {
      setError(null);
      try {
        detectorRef.current = new BarcodeDetector();
        const constraints: MediaStreamConstraints = {
          video: cameraId
            ? { deviceId: { exact: cameraId } }
            : { facingMode: "environment" },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));
        setCameras(videoDevices);

        const activeDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
        setSelectedCameraId(activeDeviceId);

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
        setIsScanning(true);
        scanFrameRef.current();
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access and try again."
            : "Failed to start camera. Make sure no other app is using it.";
        setError(message);
        stopScanning();
      }
    },
    [stopScanning],
  );

  const switchCamera = useCallback(
    async (cameraId: string) => {
      stopScanning();
      await startScanning(cameraId);
    },
    [stopScanning, startScanning],
  );

  const clearResults = useCallback(() => {
    setResults(new Map());
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    };
  }, []);

  return {
    videoRef,
    isScanning,
    error,
    results: Array.from(results.values()),
    cameras,
    selectedCameraId,
    startScanning: () => startScanning(),
    stopScanning,
    switchCamera,
    clearResults,
  };
}
