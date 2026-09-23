import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../input-dto";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { icebreakerAbilitiesForDefinition } from "@netgrid/engine";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  runnerRigAfterEncounter,
  runnerRigWithPlannedPump,
} from "./runner-rig-after-encounter";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r4-g25-d318.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  return { cp, input };
}

describe("planned pump strength at the encounter boundary", () => {
  it.each([
    ["onr_classic_030_psychic-friend", 5],
    ["onr_v1_039_krash", 2],
  ])(
    "uses the real duration for %s and preserves strength already retained",
    (definitionId, expected) => {
      const { input } = checkpoint();
      const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
      const original = input.playerView.own.rig!.find(
        (c) => c.instanceId === action.source,
      )!;
      const ability = icebreakerAbilitiesForDefinition(
        CARD_DEFINITIONS_BY_ID[definitionId]!,
      ).find((a) => a.type === "pump_strength")!;
      expect(ability).toBeDefined();
      const card = {
        ...original,
        definitionId,
        strength: 4,
        strengthAfterEncounter: 2,
      };
      const boundAction = {
        ...action,
        abilityRef: {
          sourceCardInstanceId: card.instanceId,
          sourceAbilityId: ability.id,
        },
      };
      const projected = runnerRigWithPlannedPump([card], boundAction, 3);
      expect(projected[0]?.strength).toBe(7);
      expect(runnerRigAfterEncounter(projected)[0]?.strength).toBe(expected);
      expect(card.strength).toBe(4);
      expect(() =>
        runnerRigWithPlannedPump(
          [card],
          { ...boundAction, abilityRef: undefined },
          3,
        ),
      ).toThrow("runner_pump_projection_binding_missing");
    },
  );
  it("selects the bound Psychic Friend pump when nine credits fund all three ICE", () => {
    const { cp, input } = checkpoint();
    expect(input.playerView.own.credits).toBe(9);
    const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
    expect(pump).toBeDefined();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(pump.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toContain(
      "plan_module:runner.convert_run_window",
    );
    expect(decision.evidence?.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
    expect(
      decision.evidence?.some((e) => e.startsWith("plan_scheduler:route:")),
    ).toBe(true);
  });

  it("still rejects the same ETR-only investment when its complete path is one credit short", () => {
    const { cp, input } = checkpoint();
    input.playerView.own.credits = 8;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("continue_run");
    expect(decision.fallbackUsed).toBe(false);
    const pump = decision.decisionDebug?.actionAlternatives?.find(
      (a) => a.actionType === "pump_breaker",
    );
    expect(pump?.whyNot).toContain("pump_future_path_blocked_after_cost:true");
  });
});
