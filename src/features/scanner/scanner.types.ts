import { z } from "zod";

export const scanResultSchema = z.object({
  format: z.string(),
  rawValue: z.string(),
});
export type ScanResult = z.infer<typeof scanResultSchema>;

export const cameraDeviceSchema = z.object({
  deviceId: z.string(),
  label: z.string(),
});
export type CameraDevice = z.infer<typeof cameraDeviceSchema>;
