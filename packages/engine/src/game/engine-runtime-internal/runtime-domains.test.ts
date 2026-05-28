import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createTurnCorpRuntime } from "./turn-corp-runtime";

describe("engine runtime internal domains", () => {
  it("do not import public facades or become dependencies of deep game modules", () => {
    const sources = [
      "./choice-hidden-zone-runtime.ts",
      "./action-runtime-hosts.ts",
      "./card-runtime-hosts.ts",
      "./flow-runtime-hosts.ts",
      "./lifecycle-runtime.ts",
      "./state-runtime-services.ts",
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
    expect(typeof createActionRuntimeHosts({}).scoredAgendaFlowHost).toBe(
      "function",
    );
    expect(typeof createCardRuntimeHosts({}).installCardHost).toBe("function");
    expect(typeof createFlowRuntimeHosts({}).runMovementHostForState).toBe(
      "function",
    );
    expect(typeof createStateRuntimeServices({}).canHostProgramOnDaemon).toBe(
      "function",
    );
  });
});
