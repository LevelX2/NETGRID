import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Central information-action ownership", () => {
  it("routes an exact productive R&D Protocol run through Central pressure instead of disposing it as preparation", () => {
    resetResidentPlanPortfolioMemory();
    const protocol = visibleCard(
      "rd-protocol",
      "runner",
      "hardware",
      {
        definitionId: "onr_v1_050_r-and-d-protocol-files",
        title: "R&D Protocol Files",
      },
    );
    const protocolRun = legalAction(
      "run-rd-with-protocol",
      "runner",
      "activated_card_ability",
      "Run R&D with R&D Protocol Files",
      { credits: 0, clicks: 1 },
      {
        source: protocol.instanceId,
        payload: {
          cardId: protocol.instanceId,
          serverId: "rd",
          effectKind: "make_run",
          runActionKind: "make_run",
          runServerId: "rd",
          successfulRunAccessReplacement: "private_look_top_rd",
          successfulRunPrivateLookCount: 5,
        },
      },
    );
    const input = aiInput("runner", [protocolRun]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 5;
    input.playerView.own.rig = [protocol];
    input.playerView.opponent.deckCount = 20;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const target = {
      ...safeRuntimeRunTarget(protocolRun.actionId, "rd"),
      score: 320,
      recommendation: "run_now" as const,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: protocolRun.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("does not materialize a known-no-payoff R&D Protocol variant beside an executable direct R&D run", () => {
    resetResidentPlanPortfolioMemory();
    const protocol = visibleCard(
      "rd-protocol",
      "runner",
      "hardware",
      {
        definitionId: "onr_v1_050_r-and-d-protocol-files",
        title: "R&D Protocol Files",
      },
    );
    const protocolRun = legalAction(
      "aaa-protocol-rd",
      "runner",
      "activated_card_ability",
      "Run R&D with R&D Protocol Files",
      { credits: 0, clicks: 1 },
      {
        source: protocol.instanceId,
        payload: {
          cardId: protocol.instanceId,
          serverId: "rd",
          runActionKind: "make_run",
          successfulRunAccessReplacement: "private_look_top_rd",
          successfulRunPrivateLookCount: 5,
        },
      },
    );
    const directRun = legalAction(
      "zzz-direct-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [protocolRun, directRun]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 5;
    input.playerView.own.rig = [protocol];
    input.playerView.opponent.deckCount = 20;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const productiveDirect = safeRuntimeRunTarget(directRun.actionId, "rd");
    const exhaustedProtocol = {
      ...safeRuntimeRunTarget(protocolRun.actionId, "rd"),
      accessPayoff: "known_low_value" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: 0,
      runActionProjection: {
        ...safeRuntimeRunTarget(protocolRun.actionId, "rd").runActionProjection,
        actionType: "activated_card_ability" as const,
        accessReplacement: "private_look_top_rd",
        accessReplacementLookCount: 5,
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [exhaustedProtocol, productiveDirect],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: directRun.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("keeps an underreserved private-look run blocked in its Central parent", () => {
    resetResidentPlanPortfolioMemory();
    const protocolRun = legalAction(
      "underreserved-protocol-rd",
      "runner",
      "activated_card_ability",
      "Run R&D with R&D Protocol Files",
      { credits: 0, clicks: 1 },
      {
        source: "rd-protocol",
        payload: {
          cardId: "rd-protocol",
          serverId: "rd",
          runActionKind: "make_run",
          successfulRunAccessReplacement: "private_look_top_rd",
          successfulRunPrivateLookCount: 5,
        },
      },
    );
    const credit = legalAction(
      "gain-reserve-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [protocolRun, credit]);
    input.playerView.own.credits = 10;
    const target = {
      ...safeRuntimeRunTarget(protocolRun.actionId, "rd"),
      accessPayoff: "access_bonus" as const,
      knownAccessState: "known_payoff" as const,
      pathCost: 10,
      creditsAfterRun: 0,
      recommendation: "run_now" as const,
      score: 320,
      prerunReserveQuote: {
        purpose: "information" as const,
        status: "blocked" as const,
        riskTolerance: "standard" as const,
        knownPathCost: 10,
        creditsAfterKnownPath: 0,
        unknownIceCount: 1,
        unknownIcePositions: [0],
        corpRezCredits: 12,
        visibleCoverage: "typed_only" as const,
        requiredCredits: 3,
        creditGap: 3,
        requiredHandBuffer: 3,
        handBufferGap: 0,
        evidence: ["prerun_reserve_status:blocked"],
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_portfolio_blocked:plan:runner.pressure_central:central%3Ard",
      ]),
    );
  });
});

function liveContext(overrides: Record<string, unknown> = {}) {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      fundingNeed: false,
      evidence: ["test_central_information_route"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
