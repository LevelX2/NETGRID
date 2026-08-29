import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
import { afterEach, describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
} from "../plans/resident-plan-portfolio-memory";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  isRunnerTargetedBypassHideChoice,
  selectedRunnerTargetedBypassChoiceOptionId,
  selectedRunnerTargetedBypassHideChoiceOptionId,
} from "./runner-targeted-bypass-choice";
import {
  runnerActionRequiresTargetedBypassPlan,
  runnerDefinitionRequiresTargetedBypassPlan,
  runnerGenericDevelopmentMayOwnAction,
  runnerTargetedBypassPlanCommitment,
  type RunnerTargetedBypassChoiceContinuation,
} from "./runner-targeted-bypass-plan";
import { socialEngineeringCorpGuessAmount } from "./bid-choice-option";
import { bindSelectedRunnerTargetedBypassChoiceContinuation } from "./plan-first-live-runtime";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
});

describe("Runner targeted-bypass plan admission", () => {
  it("keeps Social Engineering out of generic development, including definition-only funding states", () => {
    const candidate = socialEngineeringCandidate(1);

    expect(runnerActionRequiresTargetedBypassPlan(candidate)).toBe(true);
    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
    expect(
      runnerDefinitionRequiresTargetedBypassPlan(
        "onr_v1_111_social-engineering",
      ),
    ).toBe(true);
  });

  it("keeps concrete runner-event runs out of generic development ownership", () => {
    const candidate = {
      actionId: "runner.play.lucidrine-rd",
      actionType: "play_event",
      actorSide: "runner",
      semanticActionType: "play.runner_event",
      runProjectionSummary: {
        serverId: "rd",
        serverKind: "rd",
        source: "legal_action_payload",
        evidence: [],
      },
      functionalEffects: [
        {
          kind: "future_run_effect",
          timing: "action",
          scope: "server",
          target: "make_run",
        },
      ],
    } as unknown as ActionSemanticCandidate;

    expect(runnerActionRequiresTargetedBypassPlan(candidate)).toBe(false);
    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
  });

  it("keeps tag-removal events with incidental draw in defense ownership", () => {
    const candidate = {
      actionId: "runner.play.meat-upgrade",
      actionType: "play_event",
      actorSide: "runner",
      semanticActionType: "tag.remove",
      tagEffectProfile: { acuteTagRemoval: true },
    } as unknown as ActionSemanticCandidate;

    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
  });

  it("admits only a material payoff whose exact bypass turns a proven blocked path into access", () => {
    const commitment = runnerTargetedBypassPlanCommitment({
      input: planningInput({
        ice: [blockingWall("hq-wall")],
        rig: [],
      }),
      candidate: socialEngineeringCandidate(1),
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:hq",
          serverId: "hq",
          payoffValue: 120,
        },
      ],
    });

    expect(commitment).toMatchObject({
      ownerModuleId: "runner.pressure_central",
      ownerDedupeKey: "central:hq",
      serverId: "hq",
      icePosition: 0,
      visibleIceInstanceId: "hq-wall",
      intendedHiddenAmount: 2,
      expectedCorpGuessAmount: 3,
    });
  });

  it("rejects unknown cost, weak payoff, a guaranteed guess, and an already reachable basic route", () => {
    const blockedInput = planningInput({
      ice: [blockingWall("hq-wall")],
      rig: [],
    });
    const target = {
      ownerModuleId: "runner.pressure_central" as const,
      ownerDedupeKey: "central:hq",
      serverId: "hq",
      payoffValue: 120,
    };

    expect(
      runnerTargetedBypassPlanCommitment({
        input: blockedInput,
        candidate: socialEngineeringCandidate(undefined),
        planTargets: [target],
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedBypassPlanCommitment({
        input: blockedInput,
        candidate: socialEngineeringCandidate(1),
        planTargets: [{ ...target, payoffValue: 1 }],
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedBypassPlanCommitment({
        input: planningInput({
          credits: 3,
          ice: [blockingWall("hq-wall")],
          rig: [],
        }),
        candidate: socialEngineeringCandidate(1),
        planTargets: [target],
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedBypassPlanCommitment({
        input: planningInput({
          ice: [blockingWall("hq-wall")],
          rig: [pileDriver("runner-fracter")],
        }),
        candidate: socialEngineeringCandidate(1),
        planTargets: [target],
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedBypassPlanCommitment({
        input: planningInput({
          ice: [
            {
              ...blockingWall("hq-wall"),
              known: false,
              rezzed: false,
            },
          ],
          rig: [],
        }),
        candidate: socialEngineeringCandidate(1),
        planTargets: [target],
      }),
    ).toBeUndefined();
  });
});

describe("Runner targeted-bypass resident continuation", () => {
  it("uses the shared Corp-guess policy and materializes the exact planned hide and ICE choices", () => {
    expect(socialEngineeringCorpGuessAmount("easy", 4)).toBe(2);
    expect(socialEngineeringCorpGuessAmount("normal", 4)).toBe(3);
    expect(socialEngineeringCorpGuessAmount("hard", 4)).toBe(4);

    const continuation = targetedContinuation();
    rememberContinuation(continuation);
    const hideInput = choiceInput(11, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:social-1:11",
      kind: "bid_amount",
      options: [
        { id: "hide_2", label: "2", value: 2 },
        { id: "hide_3", label: "3", value: 3 },
      ],
    });
    const hideChoice = hideInput.playerView.pendingChoice!;
    expect(isRunnerTargetedBypassHideChoice(hideChoice)).toBe(true);
    expect(
      selectedRunnerTargetedBypassHideChoiceOptionId(
        hideInput,
        resolveChoiceAction(11),
        hideChoice,
        hideChoice.options,
      ),
    ).toBe("hide_2");
    expect(
      selectedChoicesForDecision(
        hideInput,
        resolveChoiceAction(11),
        choiceDependencies(),
      ),
    ).toEqual({
      choiceId: "choice-11",
      selectedOptionIds: ["hide_2"],
    });

    const targetInput = choiceInput(13, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:social-1:13",
      kind: "select_cards",
      options: [
        {
          id: "ice_hq-outer",
          label: "HQ ICE 1",
          value: "hq|hq-outer",
        },
        {
          id: "ice_hq-wall",
          label: "HQ ICE 2",
          value: "hq|hq-wall",
        },
      ],
    });
    const targetChoice = targetInput.playerView.pendingChoice!;
    expect(
      selectedRunnerTargetedBypassChoiceOptionId(
        targetInput,
        resolveChoiceAction(13),
        targetChoice,
        targetChoice.options,
      ),
    ).toBe("ice_hq-wall");
  });

  it("preserves the exact targeted-bypass origin across an intervening payment-support window", () => {
    rememberContinuation(targetedContinuation(), 12, true);
    const hideInput = choiceInput(13, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:social-1:13",
      kind: "bid_amount",
      options: [
        { id: "hide_2", label: "2", value: 2 },
        { id: "hide_3", label: "3", value: 3 },
      ],
    });
    hideInput.eventTail = paymentSupportEventTail();
    const hideChoice = hideInput.playerView.pendingChoice!;

    expect(
      selectedRunnerTargetedBypassHideChoiceOptionId(
        hideInput,
        resolveChoiceAction(13),
        hideChoice,
        hideChoice.options,
      ),
    ).toBe("hide_2");

    hideInput.eventTail = paymentSupportEventTail().map((event, index) =>
      index === 0
        ? {
            ...event,
            publicPayload: {
              ...event.publicPayload,
              runnerCostPenaltySupportOriginalActionId: "runner.play.other",
            },
          }
        : event,
    );
    expect(() =>
      selectedRunnerTargetedBypassHideChoiceOptionId(
        hideInput,
        resolveChoiceAction(13),
        hideChoice,
        hideChoice.options,
      ),
    ).toThrowError("window_origin_missing");
  });

  it("fails closed for a missing exact option or stale executor continuation", () => {
    rememberContinuation(targetedContinuation());
    const missingOptionInput = choiceInput(13, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:social-1:13",
      kind: "select_cards",
      options: [
        {
          id: "ice_other",
          label: "HQ ICE 1",
          value: "hq|other",
        },
      ],
    });
    expect(() =>
      selectedRunnerTargetedBypassChoiceOptionId(
        missingOptionInput,
        resolveChoiceAction(13),
        missingOptionInput.playerView.pendingChoice!,
        missingOptionInput.playerView.pendingChoice!.options,
      ),
    ).toThrowError("window_origin_missing");

    resetResidentPlanPortfolioMemory();
    rememberContinuation({
      ...targetedContinuation(),
      selectedAtStateVersion: 9,
      plannedAtStateVersion: 9,
    });
    const staleInput = choiceInput(11, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:social-1:11",
      kind: "bid_amount",
      options: [{ id: "hide_2", label: "2", value: 2 }],
    });
    expect(() =>
      selectedRunnerTargetedBypassHideChoiceOptionId(
        staleInput,
        resolveChoiceAction(11),
        staleInput.playerView.pendingChoice!,
        staleInput.playerView.pendingChoice!.options,
      ),
    ).toThrowError("window_origin_missing");

    resetResidentPlanPortfolioMemory();
    const missingInstanceBinding = {
      ...targetedContinuation(),
    } as Partial<RunnerTargetedBypassChoiceContinuation>;
    delete missingInstanceBinding.visibleIceInstanceId;
    rememberContinuation(
      missingInstanceBinding as RunnerTargetedBypassChoiceContinuation,
    );
    const restoredTargetInput = choiceInput(13, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:social-1:13",
      kind: "select_cards",
      options: [
        {
          id: "ice_hq-outer",
          label: "HQ ICE 1",
          value: "hq|hq-outer",
        },
        {
          id: "ice_hq-wall",
          label: "HQ ICE 2",
          value: "hq|hq-wall",
        },
      ],
    });
    expect(() =>
      selectedRunnerTargetedBypassChoiceOptionId(
        restoredTargetInput,
        resolveChoiceAction(13),
        restoredTargetInput.playerView.pendingChoice!,
        restoredTargetInput.playerView.pendingChoice!.options,
      ),
    ).toThrowError("window_origin_missing");

    resetResidentPlanPortfolioMemory();
    rememberContinuation({
      ...targetedContinuation(),
      sourceDefinitionId: "wrong-definition",
    } as unknown as RunnerTargetedBypassChoiceContinuation);
    const wrongDefinitionInput = choiceInput(11, {
      source:
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:social-1:11",
      kind: "bid_amount",
      options: [{ id: "hide_2", label: "2", value: 2 }],
    });
    expect(() =>
      selectedRunnerTargetedBypassHideChoiceOptionId(
        wrongDefinitionInput,
        resolveChoiceAction(11),
        wrongDefinitionInput.playerView.pendingChoice!,
        wrongDefinitionInput.playerView.pendingChoice!.options,
      ),
    ).toThrowError("window_origin_missing");
  });

  it("fails immediately when a selected Social Engineering action lacks its pressure commitment", () => {
    const input = planningInput({
      ice: [blockingWall("hq-wall")],
      rig: [],
    });
    const candidate = socialEngineeringCandidate(1);
    expect(() =>
      bindSelectedRunnerTargetedBypassChoiceContinuation(
        input,
        {
          lane: "plan",
          route: {
            planInstanceId: "plan:runner.develop_board_and_hand:social",
            step: {},
            head: {
              planInstanceId:
                "plan:runner.develop_board_and_hand:social",
              stepId: "play-social",
              actionId: candidate.actionId,
              actionType: candidate.actionType,
              semanticActionType: candidate.semanticActionType,
              stateVersion: 10,
            },
          },
          portfolio: {
            schemaVersion: "resident-plan-portfolio-v2",
            side: "runner",
            stateVersion: 10,
            executorInstanceId:
              "plan:runner.develop_board_and_hand:social",
            instances: [
              {
                instanceId:
                  "plan:runner.develop_board_and_hand:social",
                moduleId: "runner.develop_board_and_hand",
                executionState: "executor",
                moduleState: { kind: "development" },
              },
            ],
            completionHistory: [],
            transitions: [],
          },
          diagnostics: [],
        } as unknown as Parameters<
          typeof bindSelectedRunnerTargetedBypassChoiceContinuation
        >[1],
        [candidate],
      ),
    ).toThrowError("window_origin_missing");
  });
});

function socialEngineeringCandidate(
  creditCost: number | undefined,
): ActionSemanticCandidate {
  return {
    actionId: "runner.play.social-1",
    actionType: "play_event",
    actorSide: "runner",
    semanticActionType: "play.runner_event",
    sourceDefinitionId: "onr_v1_111_social-engineering",
    sourceCardInstanceId: "social-1",
    costProfile: { creditCost },
  } as ActionSemanticCandidate;
}

function planningInput(params: {
  credits?: number;
  ice: VisibleCard[];
  rig: VisibleCard[];
}): AiDecisionInput {
  return {
    side: "runner",
    difficulty: "normal",
    decisionId: "targeted-bypass:10",
    seed: "targeted-bypass",
    profileId: "test",
    actionNumber: 10,
    eventTail: [],
    legalActions: [],
    playerView: {
      stateVersion: 10,
      timingPoint: "runner_action.main",
      winner: null,
      own: {
        credits: params.credits ?? 5,
        rig: params.rig,
      },
      servers: [
        { id: "hq", ice: params.ice, root: [] },
      ],
    },
  } as unknown as AiDecisionInput;
}

function blockingWall(instanceId: string): VisibleCard {
  const ice: VisibleCard = {
    instanceId,
    definitionId: "onr_v1_232_crystal-wall",
    title: "Crystal Wall",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 3,
  };
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 3,
    subroutines: [
      {
        id: `${instanceId}-end-the-run`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_232_crystal-wall",
        sourceTitle: "Crystal Wall",
      },
    ],
  });
}

function pileDriver(instanceId: string): VisibleCard {
  return {
    instanceId,
    definitionId: "onr_v1_047_pile-driver",
    title: "Pile Driver",
    type: "program",
    subtypes: ["icebreaker", "fracter", "noisy"],
    known: true,
    strength: 7,
  };
}

function targetedContinuation(): RunnerTargetedBypassChoiceContinuation {
  return {
    family: "runner_targeted_bypass",
    kind: "targeted_bypass_run",
    sourceActionId: "runner.play.social-1",
    selectedActionId: "runner.play.social-1",
    sourceCardInstanceId: "social-1",
    sourceDefinitionId: "onr_v1_111_social-engineering",
    plannedAtStateVersion: 10,
    selectedAtStateVersion: 10,
    ownerModuleId: "runner.pressure_central",
    ownerDedupeKey: "central:hq",
    serverId: "hq",
    icePosition: 1,
    visibleIceInstanceId: "hq-wall",
    intendedHiddenAmount: 2,
    expectedCorpGuessAmount: 3,
    evidenceCodes: ["runner_targeted_bypass_preflight:complete"],
  };
}

function rememberContinuation(
  continuation: RunnerTargetedBypassChoiceContinuation,
  portfolioStateVersion = 10,
  paymentSupportPreempted = false,
): void {
  const input = choiceInput(portfolioStateVersion);
  const ownerId = "plan:runner.pressure_central:central%3Ahq";
  const economyId = "plan:runner.economy:runner-portfolio-credit-reserve";
  rememberResidentPlanPortfolio(input, {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: portfolioStateVersion,
    rootForegroundInstanceId: paymentSupportPreempted ? economyId : ownerId,
    executorInstanceId: paymentSupportPreempted ? economyId : ownerId,
    instances: [
      {
        instanceId: ownerId,
        moduleId: "runner.pressure_central",
        dedupeKey: "central:hq",
        executionState: paymentSupportPreempted ? "preempted" : "executor",
        moduleState: {
          kind: "central_pressure",
          choiceContinuation: continuation,
        },
      },
      ...(paymentSupportPreempted
        ? [
            {
              instanceId: economyId,
              moduleId: "runner.economy",
              dedupeKey: "runner-portfolio-credit-reserve",
              executionState: "executor",
              moduleState: { kind: "economy" },
            },
          ]
        : []),
    ],
    completionHistory: [],
    transitions: [],
  } as unknown as ResidentPlanPortfolio);
}

function choiceInput(
  stateVersion: number,
  choice?: {
    source: string;
    kind: "bid_amount" | "select_cards";
    options: Array<{
      id: string;
      label: string;
      value: string | number;
    }>;
  },
): AiDecisionInput {
  return {
    side: "runner",
    difficulty: "normal",
    decisionId: `targeted-bypass:${stateVersion}`,
    seed: "targeted-bypass",
    profileId: "test",
    actionNumber: stateVersion,
    eventTail: [],
    legalActions: choice ? [resolveChoiceAction(stateVersion)] : [],
    playerView: {
      stateVersion,
      timingPoint: choice
        ? "choice.resolve"
        : "runner_action.main",
      winner: null,
      own: { credits: 4 },
      servers: [],
      ...(choice
        ? {
            pendingChoice: {
              choiceId: `choice-${stateVersion}`,
              side: "runner",
              source: choice.source,
              prompt: "Choose",
              kind: choice.kind,
              options: choice.options,
              minSelections: 1,
              maxSelections: 1,
              stateVersion,
              visibility: "hidden_info_barrier",
            },
          }
        : {}),
    },
  } as unknown as AiDecisionInput;
}

function resolveChoiceAction(stateVersion: number): LegalAction {
  return {
    actionId: `runner.resolve-choice.${stateVersion}`,
    type: "resolve_choice",
    side: "runner",
  } as LegalAction;
}

function paymentSupportEventTail(): AiDecisionInput["eventTail"] {
  return [
    {
      eventId: "evt_11",
      type: "play_event",
      stateVersionBefore: 10,
      stateVersionAfter: 11,
      stateHashAfter: "fnv1a:test-11",
      publicPayload: {
        actor: "runner",
        actionType: "play_event",
        runnerCostPenaltySupportWindowOpened: true,
        runnerCostPenaltySupportWindowId: "runner_cost_penalty_support.11",
        runnerCostPenaltySupportOriginalActionId: "runner.play.social-1",
      },
    },
    {
      eventId: "evt_12",
      type: "activated_card_ability",
      stateVersionBefore: 11,
      stateVersionAfter: 12,
      stateHashAfter: "fnv1a:test-12",
      publicPayload: {
        actor: "runner",
        actionType: "activated_card_ability",
        sourceDefinitionId: "onr_proteus_133_chiba-bank-account",
      },
    },
    {
      eventId: "evt_13",
      type: "play_event",
      stateVersionBefore: 12,
      stateVersionAfter: 13,
      stateHashAfter: "fnv1a:test-13",
      publicPayload: {
        actor: "runner",
        actionType: "play_event",
        sourceCardInstanceId: "social-1",
        sourceDefinitionId: "onr_v1_111_social-engineering",
        abilityId: "secret_spend_guess_then_targeted_bypass_run",
      },
    },
  ];
}

function choiceDependencies(): Parameters<
  typeof selectedChoicesForDecision
>[2] {
  return {
    evaluateCorpOpeningHand: () => ({ decision: "keep" }),
    evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
    discardKeepScore: () => ({ total: 0 }),
    selectedRunnerProgramInstallTrashOptionIds: () => [],
    selectedRunnerForcedProgramTrashOptionIds: () => [],
    selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
    extractAiFeatures: () => ({
      credits: 0,
      memoryRemaining: 4,
      hasInstalledNonNoisyIcebreaker: false,
      rigRoles: new Set(),
      rigDefinitionIds: new Set(),
    }),
    rolesForCardId: () => [],
    effectsForCardId: () => [],
  };
}
