import { z } from "zod";

export const scanStatusSchema = z.enum([
  "looking_up",
  "searching_bgg",
  "ambiguous",
  "found",
  "not_found",
  "skipped",
  "error",
]);
export type ScanStatus = z.infer<typeof scanStatusSchema>;

export const bggGameDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  thumbnail: z.string(),
  yearPublished: z.number().nullable(),
  alternateNames: z.array(z.string()),
  totalVotes: z.number(),
});

export const scannedGameSchema = z.object({
  id: z.string(),
  barcode: z.string(),
  barcodeFormat: z.string(),
  status: scanStatusSchema,
  productTitle: z.string().optional(),
  bggId: z.number().optional(),
  bggName: z.string().optional(),
  yearPublished: z.number().nullable().optional(),
  thumbnail: z.string().optional(),
  candidates: z.array(bggGameDetailSchema).optional(),
  error: z.string().optional(),
});
export type ScannedGame = z.infer<typeof scannedGameSchema>;
