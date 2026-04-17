import { describe, expect, it } from "vitest";
import { cn } from "../../src/lib/utils";

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    const result = cn("p-2", "text-sm", "p-4", "font-medium");

    expect(result).toContain("p-4");
    expect(result).not.toContain("p-2");
    expect(result).toContain("text-sm");
    expect(result).toContain("font-medium");
  });

  it("ignores falsy values", () => {
    const result = cn("base", false && "hidden", undefined, null, "active");

    expect(result).toBe("base active");
  });
});
