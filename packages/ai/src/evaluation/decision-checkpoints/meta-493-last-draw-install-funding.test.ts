import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";
import { scoreProjectForCandidate } from "../../corp/score/score-project-signals";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r4-g11-d370.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function decide(cp: ReturnType<typeof checkpoint>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(cp.input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: result.actionId,
      expiresAtStateVersion: cp.input.playerView.stateVersion,
    }),
  );
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  return result;
}
function currentProjects(input: AiDecisionInputWithDeckCapabilities) {
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
  return candidates
    .filter((c) => c.actionType === "install_card")
    .flatMap((candidate) =>
      scoreProjectForCandidate(
        input,
        candidate,
        corpScorelineFeasibilityForDecisionInput(input),
        undefined,
        false,
        false,
      ),
    );
}
it("chooses a financeable terminal last-draw install instead of the click-only five-advance route", () => {
  const cp = checkpoint();
  expect(cp.input.playerView.own).toMatchObject({
    credits: 1,
    clicks: 3,
    agendaPoints: 6,
    stackOrRdCount: 1,
  });
  const result = decide(cp),
    plan = result.decisionDebug!.planFirstDecision!;
  expect(result.actionId).toContain("project-babylon");
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(plan.priority?.effectiveClass).toBe("P2");
  expect(plan.rootPlanInstanceId).toBe(plan.selectedPlan?.instanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  const projects = currentProjects(cp.input);
  expect(
    projects
      .filter((p) => p.agendaDefinitionId?.includes("corporate-coup"))
      .every((p) => p.lastDrawScoreSurvival !== true),
  ).toBe(true);
  expect(
    projects.some(
      (p) =>
        p.agendaDefinitionId?.includes("project-babylon") &&
        p.lastDrawScoreSurvival === true,
    ),
  ).toBe(true);
});
it("retains the five-advance terminal admission once its whole credit reserve is present", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 5;
  expect(
    currentProjects(cp.input).some(
      (p) =>
        p.agendaDefinitionId?.includes("corporate-coup") &&
        p.lastDrawScoreSurvival === true,
    ),
  ).toBe(true);
});
it.each([
  "zero_bank",
  "stale_quote",
  "missing_basic_credit",
  "nonexact_basic_credit",
  "short_next_turn",
] as const)(
  "does not publish a last-draw installation survival proof with %s",
  (variant) => {
    const cp = checkpoint();
    if (variant === "zero_bank") cp.input.playerView.own.credits = 0;
    if (variant === "missing_basic_credit")
      cp.input.legalActions = cp.input.legalActions.filter(
        (a) => a.type !== "gain_credit",
      );
    if (variant === "nonexact_basic_credit")
      cp.input.legalActions.find((a) => a.type === "gain_credit")!.costs = [
        { clicks: 2 },
      ];
    for (const action of cp.input.legalActions) {
      if (action.type !== "install_card" || !action.payload) continue;
      if (variant === "stale_quote")
        action.payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion =
          cp.input.playerView.stateVersion - 1;
      if (variant === "short_next_turn")
        action.payload.agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks = 1;
    }
    if (variant === "stale_quote") {
      expect(() => currentProjects(cp.input)).toThrow(
        "invalid_player_view_card_projection",
      );
    } else {
      expect(
        currentProjects(cp.input).some((p) => p.lastDrawScoreSurvival === true),
      ).toBe(false);
    }
  },
);
