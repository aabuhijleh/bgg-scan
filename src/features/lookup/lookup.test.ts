import { describe, expect, it } from "vitest";
import { getCleanTitle } from "./get-clean-title";

describe("getCleanTitle", () => {
  it("returns most frequent offer title when offers exist", () => {
    const result = getCleanTitle({
      title: "Fallback Title",
      offers: [
        { title: "Common Title" },
        { title: "Common Title" },
        { title: "Rare Title" },
      ],
    });
    expect(result).toBe("Common Title");
  });

  it("preserves original casing of most frequent offer", () => {
    const result = getCleanTitle({
      title: "Fallback",
      offers: [
        { title: "My Product NAME" },
        { title: "my product name" },
        { title: "My Product NAME" },
      ],
    });
    expect(result).toBe("My Product NAME");
  });

  it("falls back to item.title when no offers", () => {
    const result = getCleanTitle({ title: "Just a Product" });
    expect(result).toBe("Just a Product");
  });

  it("strips trailing (B00XXXXX) pattern from fallback title", () => {
    const result = getCleanTitle({ title: "Cool Widget (B00ABC123)" });
    expect(result).toBe("Cool Widget");
  });

  it("strips pipe-delimited suffixes from fallback title", () => {
    const result = getCleanTitle({ title: "Cool Widget | Extra Info | More" });
    expect(result).toBe("Cool Widget");
  });

  it("handles empty offers array", () => {
    const result = getCleanTitle({ title: "Fallback Title", offers: [] });
    expect(result).toBe("Fallback Title");
  });

  it("handles offers with only whitespace titles", () => {
    const result = getCleanTitle({
      title: "Fallback Title",
      offers: [{ title: "   " }, { title: "" }, { title: "  " }],
    });
    expect(result).toBe("Fallback Title");
  });

  it("strips trailing 'Board Game' from title", () => {
    expect(getCleanTitle({ title: "SKULL Board Game" })).toBe("SKULL");
  });

  it("strips trailing 'Card Game' from title", () => {
    expect(getCleanTitle({ title: "Exploding Kittens Card Game" })).toBe(
      "Exploding Kittens",
    );
  });

  it("strips trailing 'The Board Game' from title", () => {
    expect(getCleanTitle({ title: "Dune The Board Game" })).toBe("Dune");
  });

  it("strips trailing 'game' standalone", () => {
    expect(getCleanTitle({ title: "Catan - Game" })).toBe("Catan");
  });

  it("strips 'Board Game' from offer titles too", () => {
    const result = getCleanTitle({
      title: "Fallback",
      offers: [{ title: "Azul Board Game" }, { title: "Azul Board Game" }],
    });
    expect(result).toBe("Azul");
  });

  it("does not strip when it would empty the title", () => {
    expect(getCleanTitle({ title: "Game" })).toBe("Game");
  });

  it("does not strip 'game' from the middle of a title", () => {
    expect(getCleanTitle({ title: "Game of Thrones" })).toBe("Game of Thrones");
  });

  it("strips trailing 'board' standalone", () => {
    expect(getCleanTitle({ title: "Catan - Board" })).toBe("Catan");
  });

  it("preserves 'board' inside a word", () => {
    expect(getCleanTitle({ title: "Boardwalk Empire" })).toBe(
      "Boardwalk Empire",
    );
  });
});
