import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { runnerRunFundingSupport } from "../../run-analysis/runner-plan-run-funding";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const remote = "plan:runner.contest_remote:remote%3Aremote_1";
function fixture(name = "first-prefix") {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta568-terminal-debt-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
function facts(input: AiDecisionInputWithDeckCapabilities) {
  const deckCapabilities = buildDeckCapabilityProfileFromInput(input);
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
  const targets = evaluateRunnerRunTargets({ input, deckCapabilities });
  const target = targets.find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  const economy = buildRunnerEconomyPosture({ input, deckCapabilities });
  return {
    target,
    support: runnerRunFundingSupport(
      input,
      economy,
      target,
      targets,
      candidates,
    ),
  };
}
function choose(f: ReturnType<typeof fixture>) {
  const { input, runtime } = f;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(selected).toBeDefined();
  return { selected, result };
}
afterEach(resetResidentPlanPortfolioMemory);

it("does not certify the first affordable prefix as the whole terminal funding route (SP442)", () => {
  const { input, validation } = fixture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  const before = JSON.stringify(input),
    { target, support } = facts(input);
  expect(target.routeQuote).toMatchObject({
    knownCost: 16,
    fundingGap: 2,
    reachability: "no_access",
  });
  expect(support?.routeActionIds).not.toContain("runner.gain_credit");
  expect(JSON.stringify(input)).toBe(before);
});

it.each(["first-prefix", "last-actions"])(
  "funds the complete last-chance contest from the native %s state (SP704)",
  (name) => {
    const f = fixture(name);
    expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
    const { selected, result } = choose(f);
    expect(selected).toMatchObject({
      type: "install_card",
      source: "runner_onr_v1_168_loan-from-chiba_1",
      payload: { gainCreditsAmount: 12 },
    });
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: remote,
      selectedPlan: { moduleId: "runner.economy" },
      selectedStep: { parentInstanceId: remote },
      route: {
        actionId: selected.actionId,
        stateVersion: f.input.playerView.stateVersion,
      },
    });
    expect(facts(f.input).support?.routeAssessment.evidenceCodes).toContain(
      "runner_funding_complete_known_path_required",
    );
  },
);

it.each([
  "insufficient_full_budget",
  "no_run_action_left",
  "nonterminal",
] as const)("keeps debt excluded in the %s countercase", (kind) => {
  const f = fixture();
  if (kind === "insufficient_full_budget") {
    f.input.playerView.own.credits = 13;
    // One funding action plus the run: Loan gives 25, short of the full 26.
    // With a third click, Loan plus a basic credit legitimately covers it.
    f.input.playerView.own.clicks = 2;
  }
  if (kind === "no_run_action_left") f.input.playerView.own.clicks = 1;
  if (kind === "nonterminal") f.input.playerView.opponent.agendaPoints = 0;
  expect(choose(f).selected.source).not.toContain("loan-from-chiba");
});

it("includes a basic credit after debt when only the complete route covers the known cost", () => {
  const f = fixture();
  f.input.playerView.own.credits = 13;
  f.input.playerView.own.clicks = 3;
  expect(choose(f).selected.source).toBe("runner_onr_v1_168_loan-from-chiba_1");
  expect(facts(f.input).support?.routeAssessment).toMatchObject({
    status: "covered_guaranteed",
    totalClickCost: 2,
    projectedGap: 0,
  });
});

it("uses the already funded run without taking a loan", () => {
  const f = fixture();
  f.input.playerView.own.credits = 26;
  expect(choose(f).selected).toMatchObject({
    type: "start_run",
    payload: { serverId: "remote_1" },
  });
});

it("keeps an already sufficient Broker payout ahead of debt", () => {
  const f = fixture();
  f.input.playerView.own.credits = 20;
  expect(choose(f).selected).toMatchObject({
    type: "activated_card_ability",
    payload: {
      cardImplementationAbilityKey: "withdraw_credits",
      gainCreditsAmount: 6,
    },
  });
});

it("requires the same current run binding before certifying any terminal funding", () => {
  const { input } = fixture();
  input.legalActions.find((a) => a.actionId === "runner.start_run.remote_1")!
    .expiresAtStateVersion--;
  expect(facts(input).support?.routeActionIds ?? []).toEqual([]);
});
