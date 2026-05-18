import type { BggGameDetail, BggSearchItem, MatchResult } from "./bgg.types";

const BGG_API_BASE = "https://boardgamegeek.com/xmlapi2";

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = tag.match(re);
  return match ? decodeXmlEntities(match[1]) : null;
}

function getTextContent(xml: string, tagName: string): string {
  const re = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i");
  const match = xml.match(re);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

export function parseSearchXml(xml: string): BggSearchItem[] {
  const itemRegex = /<item\s[^>]*type="boardgame[^"]*"[^>]*>[\s\S]*?<\/item>/gi;
  const matches = [...xml.matchAll(itemRegex)];
  return matches.flatMap((m) => {
    const itemTag = m[0];
    const idMatch = itemTag.match(/id="(\d+)"/);
    if (!idMatch) return [];
    const id = Number(idMatch[1]);
    const nameValue = getAttr(itemTag.match(/<name[^>]*>/)?.[0] ?? "", "value");
    const yearValue = getAttr(
      itemTag.match(/<yearpublished[^>]*\/?>/)?.[0] ?? "",
      "value",
    );
    return [
      {
        id,
        name: nameValue ?? "",
        yearPublished: yearValue ? Number(yearValue) : null,
      },
    ];
  });
}

export function parseThingXml(xml: string): BggGameDetail[] {
  const itemRegex = /<item\s[^>]*type="boardgame[^"]*"[^>]*>[\s\S]*?<\/item>/gi;
  const matches = [...xml.matchAll(itemRegex)];
  return matches.flatMap((m) => {
    const itemTag = m[0];
    const idMatch = itemTag.match(/id="(\d+)"/);
    if (!idMatch) return [];
    const id = Number(idMatch[1]);

    const primaryNameMatch = itemTag.match(/<name\s[^>]*type="primary"[^>]*>/i);
    const name = primaryNameMatch
      ? (getAttr(primaryNameMatch[0], "value") ?? "")
      : "";

    const thumbnail = getTextContent(itemTag, "thumbnail");

    const yearMatch = itemTag.match(/<yearpublished[^>]*\/?>/i);
    const yearValue = yearMatch ? getAttr(yearMatch[0], "value") : null;
    const yearPublished = yearValue ? Number(yearValue) : null;

    const altNameRegex = /<name\s[^>]*type="alternate"[^>]*>/gi;
    const altMatches = [...itemTag.matchAll(altNameRegex)];
    const alternateNames = altMatches
      .map((am) => getAttr(am[0], "value"))
      .filter((v): v is string => v != null);

    const pollMatch = itemTag.match(
      /<poll\s[^>]*name="suggested_numplayers"[^>]*>/i,
    );
    const totalVotes = pollMatch
      ? Number(getAttr(pollMatch[0], "totalvotes") ?? "0")
      : 0;

    return [{ id, name, thumbnail, yearPublished, alternateNames, totalVotes }];
  });
}

export function findBestMatch(
  searchName: string,
  items: BggSearchItem[],
): MatchResult {
  if (items.length === 0) return { status: "not_found" };
  if (items.length === 1)
    return { status: "found", id: items[0].id, name: items[0].name };

  const exactMatches = items.filter(
    (i) => i.name.toLowerCase() === searchName.toLowerCase(),
  );
  if (exactMatches.length === 1)
    return {
      status: "found",
      id: exactMatches[0].id,
      name: exactMatches[0].name,
    };

  const candidateIds =
    exactMatches.length > 0
      ? exactMatches.map((i) => i.id)
      : items.slice(0, 20).map((i) => i.id);
  return { status: "ambiguous", candidateIds };
}

export class RateLimitError extends Error {
  constructor() {
    super("Rate limited by BGG API (429)");
    this.name = "RateLimitError";
  }
}

export async function fetchSearchResults(
  query: string,
  token: string,
): Promise<string> {
  const params = new URLSearchParams({ query, type: "boardgame" });
  const response = await fetch(`${BGG_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok)
    throw new Error(`BGG API error: ${response.status} ${response.statusText}`);
  return response.text();
}

export async function fetchGameDetails(
  ids: number[],
  token: string,
): Promise<string> {
  const params = new URLSearchParams({
    id: ids.join(","),
    type: "boardgame",
  });
  const response = await fetch(`${BGG_API_BASE}/thing?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok)
    throw new Error(`BGG API error: ${response.status} ${response.statusText}`);
  return response.text();
}
