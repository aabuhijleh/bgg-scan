import { describe, expect, it } from "vitest";
import { findBestMatch, parseSearchXml, parseThingXml } from "./bgg-api";

describe("parseSearchXml", () => {
  it("returns empty array for empty XML", () => {
    const xml =
      '<?xml version="1.0" encoding="utf-8"?><items total="0" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse"></items>';
    expect(parseSearchXml(xml)).toEqual([]);
  });

  it("parses a single search result", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items total="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse"><item type="boardgame" id="13"><name type="primary" value="Catan"/><yearpublished value="1995"/></item></items>`;
    expect(parseSearchXml(xml)).toEqual([
      { id: 13, name: "Catan", yearPublished: 1995 },
    ]);
  });

  it("parses multiple search results", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items total="2" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse"><item type="boardgame" id="13"><name type="primary" value="Catan"/><yearpublished value="1995"/></item><item type="boardgame" id="278"><name type="primary" value="Catan: Seafarers"/><yearpublished value="1997"/></item></items>`;
    const results = parseSearchXml(xml);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: 13, name: "Catan", yearPublished: 1995 });
    expect(results[1]).toEqual({
      id: 278,
      name: "Catan: Seafarers",
      yearPublished: 1997,
    });
  });

  it("handles XML entities in names", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items total="1"><item type="boardgame" id="99"><name type="primary" value="Rock &amp; Roll"/><yearpublished value="2000"/></item></items>`;
    const results = parseSearchXml(xml);
    expect(results[0].name).toBe("Rock & Roll");
  });

  it("returns null yearPublished when year is missing", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items total="1"><item type="boardgame" id="50"><name type="primary" value="Mystery Game"/></item></items>`;
    const results = parseSearchXml(xml);
    expect(results[0].yearPublished).toBeNull();
  });

  it("ignores non-boardgame items", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items total="2"><item type="boardgame" id="13"><name type="primary" value="Catan"/><yearpublished value="1995"/></item><item type="rpgitem" id="500"><name type="primary" value="D&amp;D"/><yearpublished value="1974"/></item></items>`;
    const results = parseSearchXml(xml);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(13);
  });
});

describe("parseThingXml", () => {
  it("parses a single item with all fields", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items><item type="boardgame" id="13"><thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail><name type="primary" value="Catan"/><name type="alternate" value="Settlers of Catan"/><yearpublished value="1995"/><poll name="suggested_numplayers" totalvotes="2345"></poll></item></items>`;
    const results = parseThingXml(xml);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 13,
      name: "Catan",
      thumbnail: "https://cf.geekdo-images.com/thumb.jpg",
      yearPublished: 1995,
      alternateNames: ["Settlers of Catan"],
      totalVotes: 2345,
    });
  });

  it("extracts multiple alternate names", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items><item type="boardgame" id="13"><thumbnail>https://example.com/img.jpg</thumbnail><name type="primary" value="Catan"/><name type="alternate" value="Settlers of Catan"/><name type="alternate" value="Die Siedler von Catan"/><yearpublished value="1995"/><poll name="suggested_numplayers" totalvotes="100"></poll></item></items>`;
    const results = parseThingXml(xml);
    expect(results[0].alternateNames).toEqual([
      "Settlers of Catan",
      "Die Siedler von Catan",
    ]);
  });

  it("extracts totalVotes from suggested_numplayers poll", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items><item type="boardgame" id="7"><thumbnail>https://example.com/img.jpg</thumbnail><name type="primary" value="Ticket to Ride"/><yearpublished value="2004"/><poll name="suggested_numplayers" totalvotes="987"></poll></item></items>`;
    const results = parseThingXml(xml);
    expect(results[0].totalVotes).toBe(987);
  });

  it("handles missing thumbnail", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items><item type="boardgame" id="99"><name type="primary" value="Obscure Game"/><yearpublished value="2020"/><poll name="suggested_numplayers" totalvotes="5"></poll></item></items>`;
    const results = parseThingXml(xml);
    expect(results[0].thumbnail).toBe("");
  });

  it("defaults totalVotes to 0 when poll is missing", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><items><item type="boardgame" id="99"><thumbnail>https://example.com/img.jpg</thumbnail><name type="primary" value="No Poll Game"/><yearpublished value="2020"/></item></items>`;
    const results = parseThingXml(xml);
    expect(results[0].totalVotes).toBe(0);
  });
});

describe("findBestMatch", () => {
  it("returns not_found when no items", () => {
    expect(findBestMatch("Catan", [])).toEqual({ status: "not_found" });
  });

  it("returns found when exactly one item", () => {
    const items = [{ id: 13, name: "Catan", yearPublished: 1995 }];
    expect(findBestMatch("Catan", items)).toEqual({
      status: "found",
      id: 13,
      name: "Catan",
    });
  });

  it("returns found for single exact match among many", () => {
    const items = [
      { id: 13, name: "Catan", yearPublished: 1995 },
      { id: 278, name: "Catan: Seafarers", yearPublished: 1997 },
      { id: 999, name: "Catan: Cities & Knights", yearPublished: 1998 },
    ];
    expect(findBestMatch("Catan", items)).toEqual({
      status: "found",
      id: 13,
      name: "Catan",
    });
  });

  it("is case-insensitive for exact matching", () => {
    const items = [
      { id: 13, name: "Catan", yearPublished: 1995 },
      { id: 278, name: "Catan: Seafarers", yearPublished: 1997 },
    ];
    expect(findBestMatch("catan", items)).toEqual({
      status: "found",
      id: 13,
      name: "Catan",
    });
  });

  it("returns ambiguous when no exact match exists", () => {
    const items = [
      { id: 278, name: "Catan: Seafarers", yearPublished: 1997 },
      { id: 999, name: "Catan: Cities & Knights", yearPublished: 1998 },
    ];
    const result = findBestMatch("Catan", items);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.candidateIds).toEqual([278, 999]);
    }
  });

  it("returns ambiguous with multiple exact matches", () => {
    const items = [
      { id: 13, name: "Catan", yearPublished: 1995 },
      { id: 50, name: "Catan", yearPublished: 2015 },
    ];
    const result = findBestMatch("Catan", items);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.candidateIds).toEqual([13, 50]);
    }
  });

  it("limits candidate IDs to 20 when no exact matches", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `Game Variant ${i + 1}`,
      yearPublished: 2000 + i,
    }));
    const result = findBestMatch("Game", items);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.candidateIds).toHaveLength(20);
      expect(result.candidateIds).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      );
    }
  });
});
