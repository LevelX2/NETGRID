import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEngineKernel } from "./engine-kernel";

describe("engine-kernel", () => {
  it("groups state services without importing index or owning mutable state", () => {
    const source = readFileSync(
      new URL("./engine-kernel.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("let ");

    const kernel = createEngineKernel();
    expect(kernel.lookup.definitionFor).toBeTypeOf("function");
    expect(kernel.zones.removeFromAllZones).toBeTypeOf("function");
    expect(kernel.economy.spendCredits).toBeTypeOf("function");
    expect(kernel.drawRandom.shuffleStateIds).toBeTypeOf("function");
    expect(kernel.counters.ensureRunnerTurnFlags).toBeTypeOf("function");
    expect(kernel.turnFlags.ensureCorpTurnFlags).toBeTypeOf("function");
  });
});
