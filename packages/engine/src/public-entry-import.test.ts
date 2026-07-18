import { describe, expect, it } from "vitest";

describe("engine public entry", () => {
  it("loads without an ESM runtime-delegate initialization cycle", async () => {
    const engine = await import("./index");

    expect(typeof engine.applyAction).toBe("function");
    expect(typeof engine.getLegalActions).toBe("function");
  });
});
