import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";

describe("engine runtime internal domains", () => {
  it("do not import public facades or become dependencies of deep game modules", () => {
    const sources = [
      "./choice-hidden-zone-runtime.ts",
      "./lifecycle-runtime.ts",
      "./turn-corp-runtime.ts",
      "./runtime-shared.ts",
    ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

    for (const source of sources) {
      expect(source).not.toContain('from "../index"');
      expect(source).not.toContain("from '../index'");
      expect(source).not.toContain('from "../../index"');
      expect(source).not.toContain("from '../../index'");
      expect(source).not.toContain('from "../engine-runtime"');
      expect(source).not.toContain('from "./runtime-implementation"');
    }
  });

  it("exposes the staged domain factories", () => {
    expect(typeof createChoiceHiddenZoneRuntime({}).pendingChoiceResolutionHost)
      .toBe("function");
    expect(typeof createLifecycleRuntime({}).trashRunnerInstalledCardToHeap)
      .toBe("function");
    expect(typeof createTurnCorpRuntime({}).advancementDistributionOptions)
      .toBe("function");
  });
});
