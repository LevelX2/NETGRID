import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-539-r1-g18-d268-action-capacity-prerequisite.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { sameTurnScoreConversionProjectsForCandidate } from "../../corp/score/score-project-signals";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

it("resolves the native shared-conversion state with complete, conflict-free action coverage", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.own).toMatchObject({ credits: 10, clicks: 1 });
  const decision = chooseAiAction(input);
  const selected = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(selected).toBeDefined();
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.turnPlanning?.coverage,
  ).toMatchObject({
    status: "pass",
    coveragePercent: 100,
    missingActionCount: 0,
    conflictingActionCount: 0,
  });
});

it("publishes every agenda bound to the same actual action-capacity action", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const first = candidates.find(
    (c) =>
      c.actionId ===
      "corp.play_operation.corp_onr_v1_297_overtime-incentives_1.corp_onr_v1_297_overtime-incentives_1",
  )!;
  const expected = [
    ...new Set(
      corpSameTurnScoreConversionPaths(input, candidates)
        .filter((p) => p.steps[0]?.actionId === first.actionId)
        .map((p) => p.agendaCardId),
    ),
  ].sort();
  expect(expected.length).toBeGreaterThan(1);
  expect(expected).toContain("corp_onr_proteus_008_project-zurich_1");
  const projects = sameTurnScoreConversionProjectsForCandidate(
    input,
    first,
    [],
    candidates,
  );
  expect([...new Set(projects.map((p) => p.agendaInstanceId))].sort()).toEqual(
    expected,
  );
  expect(
    projects.every(
      (p) =>
        p.actionIds?.length === 1 &&
        p.actionIds[0] === first.actionId &&
        p.sameTurnConversionProof === "engine_quoted_path",
    ),
  ).toBe(true);
});
