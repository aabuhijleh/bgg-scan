import { createFileRoute } from "@tanstack/react-router";
import { env } from "~/env";
import {
  fetchSearchResults,
  findBestMatch,
  parseSearchXml,
} from "~/features/bgg/bgg-api";

export const Route = createFileRoute("/api/bgg/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get("name");
        if (!name) {
          return Response.json(
            { error: "name query parameter is required" },
            { status: 400 },
          );
        }
        const xml = await fetchSearchResults(
          name,
          env.BGG_XML_API_BEARER_TOKEN,
        );
        const items = parseSearchXml(xml);
        const result = findBestMatch(name, items);
        return Response.json(result);
      },
    },
  },
});
