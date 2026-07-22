import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import {
  semanticRuntimeActionExclusion,
  type SemanticRuntimeActionExclusionDependencies,
} from "./semantic-runtime-action-exclusion";

describe("semanticRuntimeActionExclusion", () => {
  it("hard-excludes an immediate non-profitable refill of a paid advancement counter", () => {
    const action = corpAdvanceAction();
    const exclusion = semanticRuntimeActionExclusion(
      corpCounterEconomyInput(action),
      action,
      undefined,
      dependencies(undefined),
    );

    expect(exclusion).toMatchObject({
      key: "corp_advancement_counter_refill_after_credit_payout_cycle",
    });
    expect(exclusion?.reason).toContain("credits_gained:1");
    expect(exclusion?.reason).toContain("refill_credit_cost:1");
  });

  it("does not suppress agendas or profitable counter conversions", () => {
    const action = corpAdvanceAction();
    const agendaInput = corpCounterEconomyInput(action, {
      targetType: "agenda",
    });
    const profitableInput = corpCounterEconomyInput(action, {
      gainedCredits: 2,
    });

    expect(
      semanticRuntimeActionExclusion(
        agendaInput,
        action,
        undefined,
        dependencies(undefined),
      ),
    ).toBeUndefined();
    expect(
      semanticRuntimeActionExclusion(
        profitableInput,
        action,
        undefined,
        dependencies(undefined),
      ),
    ).toBeUndefined();
  });

  it("fails closed when a structured immediate run has no target evaluation", () => {
    const action = {
      ...runEventAction(),
      type: "activated_card_ability",
      payload: {
        cardImplementationEffectKind: "make_run",
        runActionKind: "make_run",
        serverId: "rd",
      },
    } as LegalAction;

    const exclusion = semanticRuntimeActionExclusion(
      runnerInput(action),
      action,
      undefined,
      dependencies(undefined),
    );

    expect(exclusion).toMatchObject({ key: "runner_run_projection_missing" });
  });

  it("hard-excludes no-access routes before any plan bonus can rank them", () => {
    const action = runEventAction();
    const evaluation = {
      ...reachableBypassEvaluation(action),
      recommendation: "run_now",
      accessPayoff: "access_bonus",
      routeQuote: {
        reachability: "no_access",
        knownCost: 4,
        guaranteedKnownCost: 5,
        availableCredits: 4,
        fundingGap: 1,
        unknownIceCount: 0,
        effects: [],
        conditionalReasons: [],
        evidence: [],
      },
    } as RunnerRunTargetEvaluation;
    const exclusion = semanticRuntimeActionExclusion(
      runnerInput(action),
      action,
      undefined,
      {
        planMemoryActionExclusion: () => undefined,
        corpAdvancementCounterPlacementAssessment: () => undefined,
        runnerSelfDamageSurvivalExclusion: () => undefined,
        runnerEncounterActionExclusion: () => undefined,
        runnerProgramSacrificeExclusion: () => undefined,
        runnerMultiRunEventExclusion: () => undefined,
        runnerRunTargetEvaluationForAction: () => evaluation,
        runnerBlinkRunExclusion: () => undefined,
        knownCentralPayoffExclusion: () => undefined,
        runnerArchivesExclusion: () => undefined,
        runnerEmptyRemoteExclusion: () => undefined,
        isRemoteServerTarget: (serverId) =>
          serverId?.startsWith("remote_") === true,
        knownIcePathReason: () => "not_reached",
      },
    );

    expect(exclusion).toMatchObject({
      key: "runner_run_release_blocked",
    });
    expect(exclusion?.reason).toContain("release_reason:route_no_access");
  });

  it("keeps a projected reachable bypass action despite a generically blocked ICE path", () => {
    const action = runEventAction();
    const exclusion = semanticRuntimeActionExclusion(
      runnerInput(action),
      action,
      undefined,
      {
        planMemoryActionExclusion: () => undefined,
        corpAdvancementCounterPlacementAssessment: () => undefined,
        runnerSelfDamageSurvivalExclusion: () => undefined,
        runnerEncounterActionExclusion: () => undefined,
        runnerProgramSacrificeExclusion: () => undefined,
        runnerMultiRunEventExclusion: () => undefined,
        runnerRunTargetEvaluationForAction: () =>
          reachableBypassEvaluation(action),
        runnerBlinkRunExclusion: () => undefined,
        knownCentralPayoffExclusion: () => undefined,
        runnerArchivesExclusion: () => undefined,
        runnerEmptyRemoteExclusion: () => undefined,
        isRemoteServerTarget: (serverId) =>
          serverId?.startsWith("remote_") === true,
        knownIcePathReason: () => "generic_path_should_not_override_projection",
      },
    );

    expect(exclusion).toBeUndefined();
  });
});

function dependencies(
  evaluation: RunnerRunTargetEvaluation | undefined,
): SemanticRuntimeActionExclusionDependencies {
  return {
    planMemoryActionExclusion: () => undefined,
    corpAdvancementCounterPlacementAssessment: () => undefined,
    runnerSelfDamageSurvivalExclusion: () => undefined,
    runnerEncounterActionExclusion: () => undefined,
    runnerProgramSacrificeExclusion: () => undefined,
    runnerMultiRunEventExclusion: () => undefined,
    runnerRunTargetEvaluationForAction: () => evaluation,
    runnerBlinkRunExclusion: () => undefined,
    knownCentralPayoffExclusion: () => undefined,
    runnerArchivesExclusion: () => undefined,
    runnerEmptyRemoteExclusion: () => undefined,
    isRemoteServerTarget: (serverId: string | undefined) =>
      serverId?.startsWith("remote_") === true,
    knownIcePathReason: () => "not_reached",
  };
}

function runEventAction(): LegalAction {
  return {
    actionId: "inside-job-remote-1",
    side: "runner",
    type: "start_run",
    label: "Inside Job on Remote 1",
    source: "inside-job",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, { credits: 2 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: { serverId: "remote_1" },
  } as LegalAction;
}

function corpAdvanceAction(): LegalAction {
  return {
    actionId: "advance-counter-economy",
    side: "corp",
    type: "advance_card",
    label: "Counter Economy advancen",
    source: "counter-economy-card",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { cardId: "counter-economy-card" },
  } as LegalAction;
}

function corpCounterEconomyInput(
  action: LegalAction,
  options: {
    targetType?: "agenda" | "asset";
    gainedCredits?: number;
  } = {},
): AiDecisionInput {
  const payoutEvent = {
    eventId: "counter-payout",
    type: "activated_card_ability",
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "counter-payout-hash",
    publicPayload: {
      actor: "corp",
      actionType: "activated_card_ability",
      sourceDefinitionId: "counter-economy-definition",
      cardImplementationAdvancementCounterCost: 1,
      gainedCredits: options.gainedCredits ?? 1,
    },
  };
  return {
    side: "corp",
    legalActions: [action],
    profileId: "test-corp",
    difficulty: "normal",
    eventTail: [payoutEvent],
    seed: "counter-economy-exclusion",
    decisionId: "counter-economy-exclusion.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 2,
      own: { credits: 5, clicks: 3 },
      opponent: { credits: 5, identity: { counterDisplays: [] } },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: [
            {
              instanceId: "counter-economy-card",
              definitionId: "counter-economy-definition",
              title: "Counter Economy",
              type: options.targetType ?? "asset",
              known: true,
              rezzed: true,
              advancementCounters: 0,
            },
          ],
        },
      ],
      publicEvents: [payoutEvent],
    },
  } as unknown as AiDecisionInput;
}

function runnerInput(action: LegalAction): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    profileId: "test-runner",
    difficulty: "normal",
    eventTail: [],
    seed: "reachable-bypass-exclusion",
    decisionId: "reachable-bypass-exclusion.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 1,
      own: { credits: 4, rig: [] },
      opponent: { credits: 5, identity: { counterDisplays: [] } },
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [codeGateIce()],
          root: [{ known: false, instanceId: "hidden-root-card" }],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function codeGateIce(): VisibleCard {
  return {
    instanceId: "remote-code-gate",
    definitionId: "simple_code_gate_ice",
    title: "Simple Code Gate ICE",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 2,
  };
}

function reachableBypassEvaluation(
  action: LegalAction,
): RunnerRunTargetEvaluation {
  return {
    actionId: action.actionId,
    targetServerId: "remote_1",
    accessServerId: "remote_1",
    pathPassability: "reachable",
    bypassedFirstIce: true,
    runActionProjection: { structure: "event_run" },
    runActionPayoff: { scoreBonus: 0 },
  } as unknown as RunnerRunTargetEvaluation;
}
