import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { env } from "~/env";
import { getCleanTitle } from "./get-clean-title";
import type { ProductInfo } from "./lookup.types";

export { getCleanTitle } from "./get-clean-title";

export const lookupBarcode = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: code }): Promise<ProductInfo> => {
    const apiKey = env.UPC_ITEM_DB_API_KEY;
    const url = apiKey
      ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${encodeURIComponent(code)}`
      : `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`;
    const headers: Record<string, string> = apiKey
      ? { user_key: apiKey, key_type: "3scale" }
      : {};

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`UPC API error: ${res.status}`);

    const data = await res.json();
    if (data.code !== "OK" || !data.items?.length)
      throw new Error("Product not found");

    const item = data.items[0];
    const images: string[] = item.images ?? [];
    const httpsImage =
      images.find((u: string) => u.startsWith("https://")) ?? images[0] ?? null;

    return {
      title: getCleanTitle(item),
      brand: item.brand || undefined,
      category: item.category || undefined,
      description: item.description || undefined,
      image: httpsImage,
      asin: item.asin || undefined,
    };
  });
