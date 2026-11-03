import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { scoreQuotedResourceCost } from "./score-quoted-resource-cost";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
it("converts the existing agenda instead of generating capacity for another exposed agenda", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta587-generated-score.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const snapshot = JSON.stringify(input),
    decision = chooseAiAction(input);
  const layoff = input.legalActions.find(
    (a: { type: string; source: string }) =>
      a.type === "play_operation" && a.source?.includes("systematic-layoffs"),
  );
  expect(decision.actionId).toBe(layoff.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const p = decision.decisionDebug!.planFirstDecision!;
  expect(p.selectedPlan!.moduleId).toBe("corp.score_agenda");
  expect(p.rootPlanInstanceId).toBe(
    "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_008_project-zurich_1%3Aremote_1",
  );
  expect(p.selectedStep!.stepId).toContain(":convert_agenda");
  expect(p.route).toMatchObject({
    actionId: layoff.actionId,
    stateVersion: 234,
    planInstanceId: p.leafExecutorInstanceId,
  });
  const port = residentPlanPortfolioSnapshot(input)!;
  const other = port.instances.find(
    (x) =>
      x.instanceId ===
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_206_marine-arcology_2%3Anew_remote",
  )!;
  const signal = (other.moduleState as { signal: CorpScoreProjectSignal })
    .signal;
  expect(signal.sameTurnConversionResourceCost).toBeUndefined();
  expect(signal.sameTurnConversionGeneratedActionCost).toEqual({
    stateVersion: 234,
    credits: 10,
    clicksSpent: 4,
    clicksGenerated: 2,
  });
  expect(scoreQuotedResourceCost(signal, input)).toEqual({
    credits: 10,
    clicks: 2,
    stateVersion: 234,
  });
  expect(JSON.stringify(input)).toBe(snapshot);
});

it.each([
  { stateVersion: 233, credits: 10, clicksSpent: 4, clicksGenerated: 2 },
  { stateVersion: 234, credits: 10, clicksSpent: -1, clicksGenerated: 2 },
  { stateVersion: 234, credits: 10, clicksSpent: 4, clicksGenerated: 0 },
])("rejects malformed generated-action comparison cost %j", (cost) => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta587-generated-score.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const signal = {
    projectId: "current-native-parent",
    agendaPoints: 2,
    phase: "convert_agenda",
    sameTurnCloseout: true,
    terminalScore: false,
    feasible: true,
    evidenceCode: "test",
    sameTurnConversionProof: "engine_quoted_path",
    sameTurnConversionGeneratedActionCost: cost,
  } as CorpScoreProjectSignal;
  expect(() => scoreQuotedResourceCost(signal, cp.input)).toThrow(
    "invalid_support_graph",
  );
});
