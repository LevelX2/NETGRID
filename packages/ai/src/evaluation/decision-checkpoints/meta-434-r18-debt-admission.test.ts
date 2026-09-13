import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  [6, 372],
  [23, 685],
])(
  "rejects financing when its projected parent cannot convert: game %i decision %i",
  (game, decision) => {
    const { input, runtime } = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r18-g${game}-d${decision}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    const selected = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(selected).toBeDefined();
    expect(selected.source).not.toContain("loan-from-chiba");
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: selected.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  },
);

it.each(["runner.grip", "runner.heap"])(
  "counts only the Engine-bound hand installation as hand consumption: %s",
  (zone) => {
    const { input } = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r18-g6-d372.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { input: AiDecisionInputWithDeckCapabilities };
    const action = input.legalActions.find(
      (a) => a.type === "install_card" && a.source.includes("loan-from-chiba"),
    )!;
    action.targetRequirements[0]!.zoneScope = [zone];
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        input.playerView.own.gripOrHq.map((c) => [
          c.instanceId,
          c.definitionId!,
        ]),
      ),
    });
    expect(candidate!.economyProjection).toMatchObject({
      cardsConsumed: zone === "runner.grip" ? 1 : 0,
      netHandDelta: zone === "runner.grip" ? -1 : 0,
    });
  },
);
