import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
it.each(["g8d11", "g10d105"])(
  "declines native optional bonus run %s into a sole public damage ambush",
  (name) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta573-r2-${name}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      validation: Record<string, boolean>;
    };
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    const input = cp.input;
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = JSON.stringify(input);
    const result = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(result).toMatchObject({
      actionId: "runner.trigger_ability.decline_optional_bonus_run",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)
        ?.expiresAtStateVersion,
    ).toBe(input.playerView.stateVersion);
  },
);
