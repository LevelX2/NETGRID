import { expect, it } from "vitest";
import advanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-score-continuity-known-426-d137.json";
import installJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-score-continuity-known-427-d412.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  [
    "426 D137 before the D138 hand-management interruption",
    advanceJson,
    "score.advance_card",
  ],
  [
    "427 D412 before the D413 sibling protection draw",
    installJson,
    "install.card",
  ],
] as const)(
  "revalidates unfinished score work at %s",
  (_label, json, semanticActionType) => {
    const capture = structuredClone(json) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const decision = chooseAiAction(capture.input);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      capture.input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toBe(plan?.leafExecutorInstanceId);
    const line = plan?.turnPlanning?.selectedLine;
    expect(line?.phases).toHaveLength(1);
    expect(line?.phases[0]).toMatchObject({
      rootModuleId: "corp.score_agenda",
      transitionKind: "observation_boundary",
      nodes: [
        expect.objectContaining({
          semanticActionType,
          boundaryAfter: "projection_not_supported",
        }),
      ],
    });
  },
);
