import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { corpScoreFundingMilestone } from "../../corp/score/corp-score-funding";
function original(kind = "bank-noncredit-score-blocker") {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta563-" +
          kind +
          "-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
beforeEach(resetResidentPlanPortfolioMemory);
it.each([
  ["winning-score-install", "corp.score_agenda"],
  ["fire-defense-install", "corp.defend_servers"],
])("preserves the actual %s route", (kind, owner) => {
  const f = original(kind),
    input = f.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).toBe(false);
  expect(d.actionId).toBe(f.observedActionId);
  expect(d.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId).toBe(
    owner,
  );
});
describe("Score funding requires a credit-solvable parent (SP-688)", () => {
  it("loads the already active bank before wasting a credit action on impossible current protection", () => {
    const f = original(),
      input = f.input;
    expect(Object.values(f.validation).every((x) => x === true)).toBe(true);
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      f.runtime,
    );
    const before = JSON.stringify(input),
      d = chooseAiAction(input),
      a = input.legalActions.find((a: any) => a.actionId === d.actionId);
    expect(JSON.stringify(input)).toBe(before);
    expect(d.fallbackUsed).toBe(false);
    expect(d.timeoutUsed).toBe(false);
    expect(a.type).toBe("activated_card_ability");
    expect(a.payload.cardImplementationAddsHostedCredits).toBe(true);
  });
  it.each([
    "known_impossible",
    "unknown",
    "missing_need",
    "known_satisfying",
    "known_credit_gap",
    "immediate_closeout",
    "different_project",
    "different_route",
    "already_funded",
    "actual_route_gap",
    "continuation_reserve",
  ])("distinguishes %s", (change) => {
    const p = original().observedDiscovery.scoreProject;
    if (change === "unknown") p.protectionNeed.baseline.knowledge = "unknown";
    if (change === "missing_need") delete p.protectionNeed;
    if (change === "known_satisfying") {
      p.protectionNeed.baseline.minimumSatisfyingRezCost = 0;
      p.protectionNeed.baseline.minimumAdditionalCreditsToSatisfy = 1;
    }
    if (change === "known_credit_gap")
      p.protectionNeed.baseline.minimumAdditionalCreditsToSatisfy = 2;
    if (change === "immediate_closeout") p.sameTurnCloseout = true;
    if (change === "different_project")
      p.protectionNeed.parentProjectId = "other-project";
    if (change === "different_route")
      p.routeAssessment = "corp_score_protection_funding_gap";
    if (change === "already_funded") p.conversion.remainingScoreCredits = 3;
    if (change === "actual_route_gap") p.fundingGap = 2;
    if (change === "continuation_reserve")
      p.continuationReserve = { requiredCreditsBeforeNextCorpTurn: 5 };
    const before = JSON.stringify(p),
      m = corpScoreFundingMilestone(p, 3);
    expect(JSON.stringify(p)).toBe(before);
    if (change === "known_impossible") expect(m).toBeUndefined();
    else expect(m).toBeDefined();
  });
});
