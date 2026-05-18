import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { env } from "~/env";
import { fetchGameDetails, parseThingXml } from "~/features/bgg/bgg-api";

const idsSchema = z
  .string()
  .transform((s) => s.split(",").map(Number))
  .pipe(z.array(z.number().int().positive()).min(1));

export const Route = createFileRoute("/api/bgg/details")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = url.searchParams.get("ids");
        const parsed = idsSchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            {
              error:
                "ids query parameter is required (comma-separated integers)",
            },
            { status: 400 },
          );
        }
        const xml = await fetchGameDetails(
          parsed.data,
          env.BGG_XML_API_BEARER_TOKEN,
        );
        const details = parseThingXml(xml);
        return Response.json(
          details.sort((a, b) => b.totalVotes - a.totalVotes),
        );
      },
    },
  },
});
