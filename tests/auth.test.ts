import { describe, it, expect } from "vitest";
import { createNoteSchema, updateNoteSchema } from "../src/lib/types/notes";

describe("Validation Schemas", () => {
  it("applies default visibility on note creation", () => {
    const parsed = createNoteSchema.parse({
      title: "Test note",
      content: "Body",
    });

    expect(parsed.visibility).toBe("private");
  });

  it("rejects invalid visibility values", () => {
    expect(() =>
      createNoteSchema.parse({
        title: "Invalid visibility",
        visibility: "internal",
      }),
    ).toThrow();
  });

  it("allows partial updates", () => {
    const parsed = updateNoteSchema.parse({
      title: "Updated title",
    });

    expect(parsed.title).toBe("Updated title");
    expect(parsed.visibility).toBeUndefined();
  });
});
