import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { env } from "~/env";
import type { BggGameDetail, MatchResult } from "./bgg.types";
import {
  fetchGameDetails,
  fetchSearchResults,
  findBestMatch,
  parseSearchXml,
  parseThingXml,
} from "./bgg-api";

export const searchBgg = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: name }): Promise<MatchResult> => {
    const xml = await fetchSearchResults(name, env.BGG_XML_API_BEARER_TOKEN);
    const items = parseSearchXml(xml);
    return findBestMatch(name, items);
  });

export const fetchBggGameDetails = createServerFn({ method: "GET" })
  .inputValidator(z.array(z.number()))
  .handler(async ({ data: ids }): Promise<BggGameDetail[]> => {
    const xml = await fetchGameDetails(ids, env.BGG_XML_API_BEARER_TOKEN);
    const details = parseThingXml(xml);
    return details.sort((a, b) => b.totalVotes - a.totalVotes);
  });
