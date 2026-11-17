import { describe, expect, it } from "vitest";
import { referencesDefaultDeckCard } from "./compact-card-reference.test-support";

import rdInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ec735a96-01-rd-ice-with-unbound-credit-pool-d23.json";
import hqRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ec735a96-02-rez-filter-with-unbound-credit-pool-d28.json";
import currentRdInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-940ee843-01-rd-shock-central-allocation-d24.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("match EC735A96 Corp central-defense credit-pool decision checkpoints", () => {
  it("keeps the unbound credit pool known while rejecting Shock.r without a following R&D encounter", () => {
    expectKnownDefenseSearch(fixture(rdInstallJson));
  });

  it("rezzes affordable ETR ICE on HQ instead of declining because of an unbound credit pool", () => {
    expectCheckpointToPass(fixture(hqRezJson));
  });

  it("retains known central allocation and searches for effective protection in the follow-up match", () => {
    expectKnownDefenseSearch(fixture(currentRdInstallJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}

function expectKnownDefenseSearch(checkpoint: AiDecisionCheckpointV1): void {
  const noEffectInstallations = checkpoint.expectation.acceptableActions;
  expect(noEffectInstallations).toBeDefined();
  checkpoint.expectation = {
    acceptableActions: [{ actionId: "corp.draw_card" }],
    forbiddenActions: noEffectInstallations!,
    planExecution: {
      acceptablePlanKinds: ["corp.defend_servers"],
      acceptableCapabilities: ["develop_score_protection"],
      requiredAssessmentEvidence: [
        "score_plan_requires_effective_ice_draw:agenda:c2hx:new_remote:new_remote",
      ],
    },
  };
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  const defense = residentPlanPortfolioSnapshot(result.input)!.instances.find(
    (instance) => instance.moduleId === "corp.defend_servers",
  )!;
  expect(defense.moduleState).toMatchObject({
    centralAllocation: { status: "known", selectedServerId: "rd" },
  });
  expect(
    result.input.playerView.servers.find((server) => server.id === "rd")!.ice,
  ).toHaveLength(0);
  const shockInstallIds = new Set(
    result.input.legalActions
      .filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.serverId === "rd" &&
          referencesDefaultDeckCard(action.source, 480),
      )
      .map((action) => action.actionId),
  );
  const shockAlternatives = result.decision?.decisionDebug?.actionAlternatives?.filter(
    (action) => shockInstallIds.has(action.actionId),
  );
  expect(shockAlternatives).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        excluded: true,
        whyNot: expect.arrayContaining([
          "explicitly_nonproductive:corp.defend_servers:corp_ice_install_has_no_executable_funded_or_project_bound_defense_route",
        ]),
      }),
    ]),
  );
}
