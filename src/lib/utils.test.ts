import { expect, test } from "vitest";
import { cn } from "~/lib/utils";

test("cn merges class names", () => {
  expect(cn("px-2", "py-1")).toBe("px-2 py-1");
});

test("cn deduplicates conflicting tailwind classes", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("cn handles conditional classes", () => {
  expect(cn("base", false && "hidden", "visible")).toBe("base visible");
});
