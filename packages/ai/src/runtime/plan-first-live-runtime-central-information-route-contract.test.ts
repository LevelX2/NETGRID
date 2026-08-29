import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
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
  it("keeps a newly legal accumulated-pressure conversion on the resident Central plan", () => {
    resetResidentPlanPortfolioMemory();
    const pipeline = visibleCard("viral-pipeline", "runner", "program", {
      definitionId: "onr_proteus_099_viral-pipeline",
      title: "Viral Pipeline",
    });
    const firstRun = legalAction(
      "run-hq-before-conversion",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [firstRun]);
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 8;
    input.playerView.own.rig = [pipeline];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(firstRun.actionId, "hq"),
          score: 240,
          recommendation: "run_now" as const,
        },
      ],
    });

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: firstRun.actionId,
      reasonCode: "plan_first.runner.pressure_central",
    });

    const conversion = legalAction(
      "convert-complete-socket-set",
      "runner",
      "activated_card_ability",
      "Convert complete Socket set",
      { credits: 0, clicks: 0 },
      {
        source: pipeline.instanceId,
        payload: {
          cardId: pipeline.instanceId,
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_proteus_099_viral-pipeline:convert_socket_set_to_pipe_counter",
          cardImplementationAbilityKey: "convert_socket_set_to_pipe_counter",
          cardImplementationAbilityTiming: "runner_paid",
        },
      },
    );
    const nextRun = legalAction(
      "run-hq-after-conversion",
      "runner",
      "start_run",
      "Run HQ again",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    input.playerView.stateVersion += 1;
    input.playerView.own.clicks = 3;
    conversion.expiresAtStateVersion = input.playerView.stateVersion;
    nextRun.expiresAtStateVersion = input.playerView.stateVersion;
    input.legalActions = [conversion, nextRun];
    expect(
      buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
        visibleSourceDefinitionsByInstanceId: {
          [pipeline.instanceId]: pipeline.definitionId!,
        },
        cardSemanticProfilesByDefinitionId:
          buildActionCardSemanticProfilesByDefinitionId(),
      }).find((candidate) => candidate.actionId === conversion.actionId),
    ).toMatchObject({
      actionType: "activated_card_ability",
      abilityBindingMethod: "canonical_capability_id",
      sourceCardInstanceId: pipeline.instanceId,
      sourceDefinitionId: pipeline.definitionId,
      functionalEffects: expect.arrayContaining([
        expect.objectContaining({
          target: "virus.corp_action_denial",
        }),
      ]),
    });
    const nextContext = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(nextRun.actionId, "hq"),
          score: 240,
          recommendation: "run_now" as const,
        },
      ],
    });

    const decision = nextContext.chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: conversion.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:runner.pressure_central:central%3Ahq",
        "plan_step_capability:central_pressure_convert_accumulated_pressure",
        "plan_priority_class:P3",
      ]),
    );

    resetResidentPlanPortfolioMemory();
    input.decisionId = "fresh-pressure-conversion:runner:2";
    const freshDecision = nextContext.chooseSemanticRuntimeAction(input, {});
    expect(freshDecision).toMatchObject({
      actionId: conversion.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    input.decisionId = "exhausted-central-pressure-conversion:runner:2";
    const exhaustedContext = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(nextRun.actionId, "hq"),
          accessPayoff: "known_low_value" as const,
          knownAccessState: "known_no_current_payoff" as const,
          score: 0,
          recommendation: "do_not_run_now" as const,
        },
      ],
    });
    expect(
      exhaustedContext.chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: conversion.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("routes an exact productive R&D Protocol run through Central pressure instead of disposing it as preparation", () => {
    resetResidentPlanPortfolioMemory();
    const protocol = visibleCard("rd-protocol", "runner", "hardware", {
      definitionId: "onr_v1_050_r-and-d-protocol-files",
      title: "R&D Protocol Files",
    });
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
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
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

  it("keeps an information-owned R&D Protocol install out of rejected Central campaign-copy dispositions", () => {
    resetResidentPlanPortfolioMemory();
    const firstProtocol = visibleCard(
      "rd-protocol-first",
      "runner",
      "hardware",
      {
        definitionId: "onr_v1_050_r-and-d-protocol-files",
        title: "R&D Protocol Files",
      },
    );
    const secondProtocol = visibleCard(
      "rd-protocol-second",
      "runner",
      "hardware",
      {
        definitionId: "onr_v1_050_r-and-d-protocol-files",
        title: "R&D Protocol Files",
      },
    );
    const install = (cardId: string) =>
      legalAction(
        `install-${cardId}`,
        "runner",
        "install_card",
        "R&D Protocol Files installieren",
        { credits: 2, clicks: 1 },
        {
          source: cardId,
          payload: {
            cardId,
            sourceDefinitionId: "onr_v1_050_r-and-d-protocol-files",
          },
        },
      );
    const firstInstall = install(firstProtocol.instanceId);
    const secondInstall = install(secondProtocol.instanceId);
    const directRun = legalAction(
      "future-rd-run",
      "runner",
      "start_run",
      "Run auf R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [firstInstall, secondInstall, directRun]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 8;
    input.playerView.own.gripOrHq = [firstProtocol, secondProtocol];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        {
          instanceId: "unknown-rd-ice",
          owner: "corp",
          controller: "corp",
          type: "ice",
          known: false,
          rezzed: false,
          advancementCounters: 0,
        },
      ]),
      server("archives"),
    ];
    const target = {
      ...safeRuntimeRunTarget(directRun.actionId, "rd"),
      score: 260,
      recommendation: "run_now" as const,
    };
    const evaluation = (
      cardInstanceId: string,
      legalActionId: string,
      priority: number,
    ) =>
      ({
        schemaVersion: "runner-hand-development-evaluation-v4",
        cardInstanceId,
        definitionId: "onr_v1_050_r-and-d-protocol-files",
        cardType: "hardware",
        availability: "legal_now",
        developmentRole: "access_payoff",
        strategicFit: "strong",
        currentNeed: "useful_now",
        activationPrerequisites: [],
        priority,
        deferReason: "none",
        legalActionId,
        persistentInstallEvaluation: {
          installCost: 2,
        },
        evidence: [],
      }) as never;

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
      evaluateRunnerHandDevelopment: () => [
        evaluation(firstProtocol.instanceId, firstInstall.actionId, 900),
        evaluation(secondProtocol.instanceId, secondInstall.actionId, 800),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: secondInstall.actionId,
      reasonCode: "plan_first.runner.expose_information",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          route: { actionId: secondInstall.actionId },
          dispositions: expect.not.arrayContaining([
            expect.objectContaining({ actionId: firstInstall.actionId }),
            expect.objectContaining({ actionId: secondInstall.actionId }),
          ]),
        },
      },
    });
  });

  it("does not materialize a known-no-payoff R&D Protocol variant beside an executable direct R&D run", () => {
    resetResidentPlanPortfolioMemory();
    const protocol = visibleCard("rd-protocol", "runner", "hardware", {
      definitionId: "onr_v1_050_r-and-d-protocol-files",
      title: "R&D Protocol Files",
    });
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
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
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
    const protocol = visibleCard("rd-protocol", "runner", "hardware", {
      definitionId: "onr_v1_050_r-and-d-protocol-files",
      title: "R&D Protocol Files",
    });
    const protocolRun = legalAction(
      "underreserved-protocol-rd",
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
    const credit = legalAction(
      "gain-reserve-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [protocolRun, credit]);
    input.playerView.own.credits = 12;
    input.playerView.own.clicks = 2;
    input.playerView.own.rig = [protocol];
    input.playerView.opponent.deckCount = 20;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const target = {
      ...safeRuntimeRunTarget(protocolRun.actionId, "rd"),
      accessPayoff: "access_bonus" as const,
      knownAccessState: "known_payoff" as const,
      pathCost: 10,
      creditsAfterRun: 2,
      recommendation: "gain_credits_first" as const,
      score: 320,
      prerunReserveQuote: {
        purpose: "information" as const,
        status: "blocked" as const,
        riskTolerance: "standard" as const,
        knownPathCost: 10,
        creditsAfterKnownPath: 2,
        unknownIceCount: 1,
        unknownIcePositions: [0],
        corpRezCredits: 12,
        visibleCoverage: "typed_only" as const,
        requiredCredits: 3,
        creditGap: 1,
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
        "plan_priority_delegated_from:plan:runner.pressure_central:central%3Ard",
      ]),
    );
  });

  it("keeps a high-value probe-only Central run information-owned and preserves its encounter budget", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd-probe",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [run]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 2;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      accessPayoff: "unknown" as const,
      knownAccessState: "unknown" as const,
      recommendation: "run_now" as const,
      runCommitment: "probe_only" as const,
      unknownUnrezzedIceCount: 2,
      pathCost: 0,
      score: 180,
      prerunReserveQuote: {
        purpose: "information" as const,
        status: "satisfied" as const,
        riskTolerance: "standard" as const,
        knownPathCost: 0,
        creditsAfterKnownPath: 4,
        unknownIceCount: 2,
        unknownIcePositions: [1, 3],
        corpRezCredits: 7,
        visibleCoverage: "typed_only" as const,
        requiredCredits: 1,
        creditGap: 0,
        requiredHandBuffer: 3,
        handBufferGap: 0,
        evidence: ["prerun_reserve_purpose:information"],
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) =>
          instance.instanceId === "plan:runner.pressure_central:central%3Ard",
      ),
    ).toMatchObject({
      moduleId: "runner.pressure_central",
      moduleState: {
        signal: {
          purpose: "information",
          encounterCreditSpendLimit: 0,
          runRiskContract: {
            runCommitment: "probe_only",
            reserveQuote: { purpose: "information" },
          },
        },
      },
    });
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
    runnerProgramInstallTrashAssessmentForAction: () => undefined,
    runnerProgramInstallTrashAssessmentForCard: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}
