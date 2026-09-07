import { expect, it } from "vitest";
import before from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-prepared-run-continuity-d151.json";
import after from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-405-prepared-run-continuity-d152.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it.each([
  ["rd", before, "code_gate"],
  ["remote_1", after, "wall"],
] as const)(
  "SP-295 does not prepare a %s information run rejected by its own parent policy",
  (server, checkpoint, subtype) => {
    const { input, runtime } = structuredClone(checkpoint) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const prepare = input.legalActions.find(
      (a) =>
        a.type === "trigger_ability" && a.payload?.selectedSubtype === subtype,
    )!;
    expect(prepare.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    const decision = chooseAiAction(input);
    expect(decision.actionId).not.toBe(prepare.actionId);
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions,
    ).toContainEqual(
      expect.objectContaining({
        actionId: prepare.actionId,
        disposition: "explicitly_nonproductive",
      }),
    );
  },
);
