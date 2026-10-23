import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import {
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterGuaranteedFunding,
} from "../../runner-run-target-evaluation";
import { runnerTerminalRemoteLastChanceKnownPathFundingGap } from "../../runner/remote-contest/remote-contest-admission";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const parentId = "plan:runner.contest_remote:remote%3Aremote_1";
const needId = "run-support:remote:remote_1";

function capture() {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta550-known-path-bank.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}

function facts(input: AiDecisionInputWithDeckCapabilities) {
  const deckCapabilities = buildDeckCapabilityProfileFromInput(input);
  const target = evaluateRunnerRunTargets({ input, deckCapabilities }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  const banks = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  }).filter((c) => c.economyProjection?.payoutMode === "all_available");
  const quote = () =>
    banks[0] &&
    quoteRunnerRunAfterGuaranteedFunding({
      input,
      deckCapabilities,
      fundingCandidate: banks[0],
      runActionId: target.actionId,
      targetServerId: target.targetServerId,
    });
  return { target, banks, quote };
}

function engineHash(input: AiDecisionInputWithDeckCapabilities) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        view: input.playerView,
        actions: input.legalActions,
        events: input.eventTail,
      }),
    )
    .digest("hex");
}

describe("terminal known-path bank support", () => {
  beforeEach(resetResidentPlanPortfolioMemory);

  it("re-quotes the complete path even when current liquidity makes the payoff uncontestable", () => {
    const { input, validation } = capture();
    expect(Object.values(validation).every(Boolean)).toBe(true);
    const { target, banks, quote } = facts(input);
    expect(input.playerView.own.credits).toBe(4);
    expect(target).toMatchObject({
      pathPassability: "blocked_unpayable",
      accessPayoffContestable: false,
      routeQuote: { fundingGap: 2, unknownIceCount: 0 },
    });
    expect(
      runnerTerminalRemoteLastChanceKnownPathFundingGap(input, target),
    ).toBe(2);
    expect(banks[0]!.economyProjection?.storedCreditsTaken).toBe(6);
    expect(quote()).toMatchObject({
      pathPassability: "reachable",
      accessPayoffContestable: true,
      creditsAfterRun: 1,
      routeQuote: {
        reachability: "guaranteed_access",
        fundingGap: 0,
        unknownIceCount: 0,
      },
      prerunReserveQuote: { status: "not_required" },
    });
  });

  it("executes the exact cashout under the current Remote parent without mutating Engine facts", () => {
    const { input, runtime } = capture();
    const before = engineHash(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(action.payload?.hostedCreditTakeAmount).toBe(6);
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: parentId,
      leafExecutorInstanceId: `plan:runner.credit_bank:${action.source}`,
      selectedStep: { parentInstanceId: parentId, needId },
      route: {
        actionId: action.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
    const providers = residentPlanPortfolioSnapshot(input)!.instances.filter(
      (p) => p.parentNeedId === needId && p.moduleId === "runner.credit_bank",
    );
    expect(providers).toHaveLength(1);
    expect(providers[0]!.moduleState).toMatchObject({
      signal: {
        runFunding: {
          gap: 5,
          routeAssessment: { status: "covered_guaranteed" },
        },
      },
    });
    expect(engineHash(input)).toBe(before);
  });

  // Explicit boundary variants of the native state; these are not new Engine captures.
  it.each([
    "no_run_click",
    "missing_cashout",
    "insufficient_liquidity",
  ] as const)("does not bind an incomplete cashout route: %s", (boundary) => {
    const { input, runtime } = capture();
    if (boundary === "no_run_click") input.playerView.own.clicks = 1;
    if (boundary === "missing_cashout")
      input.legalActions = input.legalActions.filter(
        (a) => !a.actionId.includes("withdraw_credits"),
      );
    if (boundary === "insufficient_liquidity") input.playerView.own.credits = 0;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    expect(
      residentPlanPortfolioSnapshot(input)!.instances.filter(
        (p) => p.parentNeedId === needId && p.moduleId === "runner.credit_bank",
      ),
    ).toHaveLength(0);
  });

  it("keeps unknown ICE, visible hazards, dead payoff and nonterminal targets outside this admission", () => {
    const { input } = capture();
    const { target } = facts(input);
    for (const changed of [
      { ...target, routeQuote: { ...target.routeQuote!, unknownIceCount: 1 } },
      { ...target, unavoidableVisibleIceHazardCount: 1 },
      { ...target, visibleTraceTagHazardUnavoidable: true },
      { ...target, knownAccessState: "known_no_current_payoff" as const },
    ])
      expect(
        runnerTerminalRemoteLastChanceKnownPathFundingGap(input, changed),
      ).toBeUndefined();
    input.playerView.opponent.agendaPoints = 0;
    expect(
      runnerTerminalRemoteLastChanceKnownPathFundingGap(input, {
        ...target,
        scoreThreat: false,
      }),
    ).toBeUndefined();
  });
});
