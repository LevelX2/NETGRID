import { afterEach, expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-731-r1-g11-d63.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = capture as unknown as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

afterEach(resetResidentPlanPortfolioMemory);

function decide(adjust?: (input: AiDecisionInputWithDeckCapabilities) => void) {
  const input = structuredClone(checkpoint.input);
  adjust?.(input);
  if (!input.ownDeckSnapshot)
    throw new Error("Deck snapshot missing from checkpoint");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  return { input, decision: chooseAiAction(input) };
}

it("binds the real taxed draw to Defense while the existing damage exposure cannot be removed", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const { input, decision } = decide();
  const draw = input.legalActions.find(
    (action) => action.actionId === "runner.draw_card",
  )!;
  expect(runnerDrawTaxLiabilityProjection(input, draw)).toMatchObject({
    drawCount: 1,
    sourceCount: 2,
    projectedTagsAdded: 2,
  });
  expect(runnerDamageThreatAssessment(input).flatlineRisk).toMatchObject({
    level: "critical",
    handCount: 0,
    recommendedHandFloor: 4,
    activeDamageSourceCount: 0,
  });
  expect(decision).toMatchObject({
    actionId: draw.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
        leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
        route: {
          actionId: draw.actionId,
          stateVersion: input.playerView.stateVersion,
          capabilityId: "build_required_hand_buffer",
        },
      },
    },
  });
});

it.each([
  [
    "first tags",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.own.tags = 0;
    },
  ],
  [
    "fully removable tag",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.own.tags = 1;
    },
  ],
  [
    "known damage payoff",
    (input: AiDecisionInputWithDeckCapabilities) => {
      const root = input.playerView.servers.find(
        (server) => server.id === "remote_2",
      )!.root;
      root.push({
        ...root[0]!,
        instanceId: "visible-corp-damage-payoff",
        definitionId: "onr_v1_327_i-got-a-rock",
        title: "I Got a Rock",
        rulesText:
          "A, 3 agenda points: Do 15 meat damage to Runner. Use this ability only if Runner has two or more tags.",
      });
    },
  ],
  [
    "unreachable buffer",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.own.clicks = 3;
    },
  ],
] as const)(
  "keeps the current-rule tax restriction with %s",
  (_label, adjust) => {
    const { decision } = decide(adjust);
    expect(decision.actionId).not.toBe("runner.draw_card");
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions,
    ).toContainEqual(
      expect.objectContaining({
        actionId: "runner.draw_card",
        ownerModuleId: "runner.defense_and_recovery",
        evidenceCode: "runner_confirmed_damage_draw_tax_tag_unsafe",
      }),
    );
  },
);
