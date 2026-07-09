import { describe, expect, it } from "vitest";

import {
  activeAiSupportReadinessContract,
  aiSupportReadinessForSet,
  aiSupportStageReady,
} from "./ai-support-readiness";

describe("AI support readiness contract", () => {
  it("separates Proteus technical eligibility from default pool readiness", () => {
    const contract = activeAiSupportReadinessContract();
    const proteus = aiSupportReadinessForSet("proteus");

    expect(contract.schemaVersion).toBe("netgrid.ai-support-readiness.v1");
    expect(proteus).toMatchObject({
      technicalEligibilityStatus: "ai_supported",
      highestApprovedStage: "selected_ai_playtest_ready",
      stages: {
        hint_ready: { ready: true },
        selected_ai_playtest_ready: { ready: true },
        default_pool_ready: { ready: false },
      },
    });
    expect(aiSupportStageReady("proteus", "selected_ai_playtest_ready")).toBe(
      true,
    );
    expect(aiSupportStageReady("proteus", "default_pool_ready")).toBe(false);
  });

  it("returns defensive copies of the active contract", () => {
    const first = activeAiSupportReadinessContract();
    first.sets[0]!.stages.hint_ready.ready = false;
    expect(
      activeAiSupportReadinessContract().sets[0]!.stages.hint_ready.ready,
    ).toBe(true);
  });
});
