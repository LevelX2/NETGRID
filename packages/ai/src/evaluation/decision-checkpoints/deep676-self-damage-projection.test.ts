import { readFileSync } from "node:fs";
import { CURRENT_RULES_BASELINE, type AiDecisionInput } from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  applyCertifiedTurnProjectionDelta,
  boundCurrentStepProjection,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
} from "../../plans/turn-projection";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

const fixture = JSON.parse(
  readFileSync(
    new URL("fixtures/deep676-d337-self-damage.json", import.meta.url),
    "utf8",
  ),
);
const actionId =
  "runner.play_event.runner_onr_classic_036_do-the-drine_1.runner_onr_classic_036_do-the-drine_1.4";
function scenario(amount = 4) {
  expect(Object.values(fixture.validation).every(Boolean)).toBe(true);
  expect(Object.values(fixture.actualAfter.validation).every(Boolean)).toBe(
    true,
  );
  const input: AiDecisionInput = {
    ...structuredClone(fixture.input),
    ...buildAiDecisionInputDto(structuredClone(fixture.input)),
  };
  const action = input.legalActions.find(
    (a) => a.actionId === actionId.replace(/\.4$/, `.${amount}`),
  )!;
  expect(action).toBeDefined();
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [action.source!]: "onr_classic_036_do-the-drine",
    },
  });
  return { input, action, candidate: candidate! };
}

afterEach(resetResidentPlanPortfolioMemory);
describe("native deep676 current self-damage projection", () => {
  it("already carries the exact self-damage separately from source-card consumption", () => {
    const { candidate } = scenario();
    expect(candidate.costProfile.selfDamage).toMatchObject([
      { type: "core", amount: 4 },
    ]);
    // Funding consumers already subtract this damage separately.
    expect(candidate.economyProjection?.netHandDelta).toBe(-1);
    expect(fixture.actualAfter).toMatchObject({
      credits: 26,
      clicks: 1,
      handCount: 0,
      maxHandSize: 1,
      coreDamage: 4,
    });
  });

  it("binds the current unavoidable hand loss and capacity loss before re-observation", () => {
    const { input, candidate } = scenario();
    expect(boundCurrentStepProjection(input, candidate)).toMatchObject({
      liquidCreditCost: 0,
      boundaryKind: "private_observation",
      selfDamageOutcome: {
        handCountDelta: -5,
        handCapacityDelta: -4,
        forgetHandIdentities: true,
      },
    });
  });

  it.each([1, 2, 3, 4])(
    "projects %i native Core costs once and releases unknown hand identities",
    (amount) => {
      const { input, candidate } = scenario(amount);
      const current = boundCurrentStepProjection(input, candidate);
      expect(current).toBeDefined();
      const frame = buildProjectedDecisionFrame({
        input,
        rulesContext: buildPlanningRulesContext({
          rulesBaseline: CURRENT_RULES_BASELINE,
          formatProfileId: fixture.input.ownDeckSnapshot.formatProfileId,
          cardPoolSnapshotId: fixture.input.ownDeckSnapshot.cardPoolSnapshotId,
        }),
        stateIdentity: buildPlanningStateIdentity(input),
        turnKey: "deep676:self-damage",
      });
      const next = applyCertifiedTurnProjectionDelta(
        frame,
        certifiedTurnProjectionDeltaFromCandidate({
          frame,
          candidate,
          currentStepProjection: current,
        }),
      );
      expect(candidate.economyProjection?.netHandDelta).toBe(-1);
      expect(next.ownCredits).toEqual({
        minimum: 10 + amount * 4,
        maximum: 10 + amount * 4,
      });
      expect(next.ownHand.count).toEqual({
        minimum: 4 - amount,
        maximum: 4 - amount,
      });
      expect(next.ownHand.capacity).toBe(5 - amount);
      expect(next.ownHand.knownInstanceIds).toEqual([]);
      expect(next.ownHand.dispositions).toEqual([]);
    },
  );

  it.each([
    "missing_prevention_fact",
    "preventable",
    "stale",
    "wrong_source",
    "wrong_x",
  ])("does not certify a current self-damage outcome with %s", (kind) => {
    const { input, action, candidate } = scenario();
    if (kind === "missing_prevention_fact")
      delete action.payload!.damageCannotBePrevented;
    if (kind === "preventable") action.payload!.preventableDamage = true;
    if (kind === "stale") action.expiresAtStateVersion--;
    if (kind === "wrong_source")
      candidate.sourceCardInstanceId = "other-source";
    if (kind === "wrong_x") action.payload!.xValue = 3;
    expect(boundCurrentStepProjection(input, candidate)).toBeUndefined();
  });

  it("reports the actual zero-card result in the selected bound funding line", () => {
    const { input } = scenario();
    restoreAiRuntimeCheckpoint(
      input,
      fixture.input.ownDeckSnapshot.deckSnapshotId,
      fixture.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(actionId);
    expect(decision.fallbackUsed).toBe(false);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toBe(
      "plan:runner.contest_remote:remote%3Aremote_1",
    );
    expect(plan?.leafExecutorInstanceId).toBe(
      "plan:runner.economy:run-support%3Aremote%3Aremote_1",
    );
    const lines = plan?.turnPlanning?.consideredLines?.filter(
      (line) => line.firstActionId === actionId,
    );
    expect(lines?.length).toBeGreaterThan(0);
    for (const line of lines ?? []) {
      expect(line.projectedEndState).toMatchObject({
        creditMinimum: 26,
        creditMaximum: 26,
        handMinimum: 0,
        handMaximum: 0,
      });
    }
  });
});
