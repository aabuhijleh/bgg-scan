import { z } from "zod";

export const productInfoSchema = z.object({
  title: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  image: z.string().nullable().optional(),
  asin: z.string().optional(),
});
export type ProductInfo = z.infer<typeof productInfoSchema>;
