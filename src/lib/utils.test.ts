import { describe, expect, test } from "bun:test";
import { cn } from "./utils";

describe("cn utility", () => {
  test("concatenates class names", () => {
    expect(cn("base-class", "additional-class")).toBe("base-class additional-class");
  });

  test("handles conditional classes", () => {
    expect(cn("base-class", true && "active", false && "hidden")).toBe("base-class active");
  });

  test("handles object inputs", () => {
    expect(cn("base-class", { "is-loading": true, "is-error": false })).toBe("base-class is-loading");
  });

  test("handles array inputs", () => {
    expect(cn(["a", "b"], ["c"])).toBe("a b c");
  });

  test("filters out falsy values", () => {
    expect(cn("a", null, undefined, 0, false, "b")).toBe("a b");
  });

  test("merges tailwind classes correctly", () => {
    // In a real environment with a working tailwind-merge,
    // p-3 would override px-2 and py-1.
    // We assert the correct production behavior here.
    expect(cn("px-2 py-1", "p-3")).toBe("p-3");
  });
});
