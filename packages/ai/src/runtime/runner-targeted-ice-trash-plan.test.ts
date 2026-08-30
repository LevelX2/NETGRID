import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { afterEach, describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
} from "../plans/resident-plan-portfolio-memory";
import { runnerGenericDevelopmentMayOwnAction } from "./runner-targeted-bypass-plan";
import {
  isRunnerTargetedIceTrashChoice,
  selectedRunnerTargetedIceTrashChoiceOptionId,
} from "./runner-targeted-ice-trash-choice";
import {
  runnerActionRequiresTargetedIceTrashPlan,
  runnerTargetedIceTrashPlanCommitment,
  runnerUnrezzedIceTrashRouteOpeningPayoff,
  type RunnerTargetedIceTrashCommitment,
  type RunnerTargetedIceTrashChoiceContinuation,
} from "./runner-targeted-ice-trash-plan";
import { bindSelectedRunnerTargetedIceTrashChoiceContinuation } from "./plan-first-live-runtime";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
});

describe("Runner targeted rezzed-ICE trash plan", () => {
  it("keeps the effect family out of generic development and binds the exact ICE whose removal opens the path", () => {
    const candidate = targetedTrashCandidate();
    const commitment = runnerTargetedIceTrashPlanCommitment({
      input: planningInput(),
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:rd",
          serverId: "rd",
          payoffValue: 240,
        },
      ],
    });

    expect(runnerActionRequiresTargetedIceTrashPlan(candidate)).toBe(true);
    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
    expect(commitment).toMatchObject({
      ownerModuleId: "runner.pressure_central",
      ownerDedupeKey: "central:rd",
      serverId: "rd",
      targetIceInstanceId: "rd-sentry",
      targetRezCost: 1,
    });
  });

  it("rejects an unaffordable target and removal that does not make the visible route productive", () => {
    const target = {
      ownerModuleId: "runner.pressure_central" as const,
      ownerDedupeKey: "central:rd",
      serverId: "rd",
      payoffValue: 240,
    };
    expect(
      runnerTargetedIceTrashPlanCommitment({
        input: planningInput({
          credits: 0,
          ice: [blockingIce("rd-sentry", "sentry", 1)],
          rig: [],
        }),
        candidate: targetedTrashCandidate(),
        planTargets: [target],
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedIceTrashPlanCommitment({
        input: planningInput({
          ice: [
            blockingIce("rd-sentry-a", "sentry", 1),
            blockingIce("rd-sentry-b", "sentry", 1),
          ],
          rig: [],
        }),
        candidate: targetedTrashCandidate(),
        planTargets: [target],
      }),
    ).toBeUndefined();
  });

  it("preserves the pressure executor and resolves only its preflighted target", () => {
    const input = planningInput();
    const candidate = targetedTrashCandidate();
    const commitment = runnerTargetedIceTrashPlanCommitment({
      input,
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:rd",
          serverId: "rd",
          payoffValue: 240,
        },
      ],
    })!;
    const portfolio = pressurePortfolio(commitment);
    const result = {
      lane: "plan",
      route: {
        planInstanceId: portfolio.executorInstanceId,
        step: {},
        head: {
          planInstanceId: portfolio.executorInstanceId,
          stepId: "trash-blocking-ice",
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          stateVersion: 10,
        },
      },
      portfolio,
      diagnostics: [],
    } as unknown as Parameters<
      typeof bindSelectedRunnerTargetedIceTrashChoiceContinuation
    >[1];

    bindSelectedRunnerTargetedIceTrashChoiceContinuation(input, result, [
      candidate,
    ]);
    expect(candidate.actionId).toBe("runner.play.jettison-1");
    expect(portfolio.executorInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ard",
    );
    const continuation = (
      portfolio.instances[0]!.moduleState as {
        choiceContinuation: RunnerTargetedIceTrashChoiceContinuation;
      }
    ).choiceContinuation;
    expect(continuation).toMatchObject({
      family: "runner_targeted_ice_trash",
      selectedActionId: candidate.actionId,
      targetIceInstanceId: "rd-sentry",
    });

    rememberResidentPlanPortfolio(input, portfolio);
    const choiceInput = targetedChoiceInput();
    const choice = choiceInput.playerView.pendingChoice!;
    expect(isRunnerTargetedIceTrashChoice(choice)).toBe(true);
    expect(
      selectedRunnerTargetedIceTrashChoiceOptionId(
        choiceInput,
        resolveChoiceAction(),
        choice,
        choice.options,
      ),
    ).toBe("card_rd-sentry");
    expect(
      selectedChoicesForDecision(
        choiceInput,
        resolveChoiceAction(),
        choiceDependencies(),
      ),
    ).toEqual({
      choiceId: "trash-rezzed-ice-11",
      selectedOptionIds: ["card_rd-sentry"],
    });
  });

  it("binds an unrezzed ICE effect to the outermost side-safe slot of a material central target", () => {
    const input = planningInput({
      ice: [
        blockingIce("rd-rezzed", "sentry", 1),
        unrezzedIce("rd-hidden-inner"),
        unrezzedIce("rd-hidden-outer"),
      ],
    });
    const candidate = targetedUnrezzedTrashCandidate();
    const commitment = runnerTargetedIceTrashPlanCommitment({
      input,
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:rd",
          serverId: "rd",
          payoffValue: 1_000,
        },
      ],
    });

    expect(runnerActionRequiresTargetedIceTrashPlan(candidate)).toBe(true);
    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
    expect(commitment).toMatchObject({
      kind: "targeted_ice_trash",
      targetIceState: "unrezzed",
      serverId: "rd",
      targetIcePosition: 2,
      targetIceInstanceId: "rd-hidden-outer",
    });

    const portfolio = pressurePortfolio(commitment!);
    const result = {
      lane: "plan",
      route: {
        planInstanceId: portfolio.executorInstanceId,
        step: {},
        head: {
          planInstanceId: portfolio.executorInstanceId,
          stepId: "trash-unrezzed-ice",
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          stateVersion: 10,
        },
      },
      portfolio,
      diagnostics: [],
    } as unknown as Parameters<
      typeof bindSelectedRunnerTargetedIceTrashChoiceContinuation
    >[1];
    bindSelectedRunnerTargetedIceTrashChoiceContinuation(input, result, [
      candidate,
    ]);
    rememberResidentPlanPortfolio(input, portfolio);
    const choiceInput = targetedUnrezzedChoiceInput();
    expect(
      selectedRunnerTargetedIceTrashChoiceOptionId(
        choiceInput,
        resolveChoiceAction(),
        choiceInput.playerView.pendingChoice!,
        choiceInput.playerView.pendingChoice!.options,
      ),
    ).toBe("ice_3");
  });

  it("recognizes the canonical unrezzed-ICE capability and values the route it opens", () => {
    const action = {
      actionId:
        "runner.play_event.worm-1.worm-1.onr_v1_109_security-code-worm-chip:abilities_on_play_trash_unrezzed_ice",
      type: "play_event",
      side: "runner",
      label: "Security Code WORM Chip spielen",
      source: "worm-1",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1, credits: 0 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 10,
      abilityRef: {
        sourceCardInstanceId: "worm-1",
        sourceAbilityId:
          "onr_v1_109_security-code-worm-chip:abilities_on_play_trash_unrezzed_ice",
      },
      payload: {
        cardId: "worm-1",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: "abilities_on_play_trash_unrezzed_ice",
        cardImplementationAbilityId:
          "onr_v1_109_security-code-worm-chip:abilities_on_play_trash_unrezzed_ice",
      },
    } satisfies LegalAction;
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: 10,
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const input = planningInput({
      credits: 6,
      ice: [blockingIce("rd-wall", "wall", 1), unrezzedIce("rd-hidden-outer")],
    });

    expect(candidate?.abilityKey).toBe("abilities_on_play_trash_unrezzed_ice");
    expect(runnerActionRequiresTargetedIceTrashPlan(candidate!)).toBe(true);
    expect(runnerUnrezzedIceTrashRouteOpeningPayoff(input, "rd")).toBe(120);
    expect(
      runnerTargetedIceTrashPlanCommitment({
        input,
        candidate: candidate!,
        planTargets: [
          {
            ownerModuleId: "runner.pressure_central",
            ownerDedupeKey: "central:rd",
            serverId: "rd",
            payoffValue: runnerUnrezzedIceTrashRouteOpeningPayoff(input, "rd"),
          },
        ],
      }),
    ).toMatchObject({
      ownerModuleId: "runner.pressure_central",
      serverId: "rd",
      targetIceState: "unrezzed",
      targetIcePosition: 1,
    });
  });

  it("binds a Corp rez-or-trash event to an unrezzed ICE on the current pressure server and values low Corp credits", () => {
    const input = planningInput({
      ice: [
        blockingIce("rd-wall", "wall", 1),
        unrezzedIce("rd-hidden-inner"),
        unrezzedIce("rd-hidden-outer"),
      ],
    });
    input.playerView.opponent.credits = 1;
    const candidate = canonicalForgedCandidate();
    const commitment = runnerTargetedIceTrashPlanCommitment({
      input,
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:rd",
          serverId: "rd",
          payoffValue: 120,
        },
      ],
    });

    expect(runnerActionRequiresTargetedIceTrashPlan(candidate)).toBe(true);
    expect(runnerGenericDevelopmentMayOwnAction(candidate)).toBe(false);
    expect(commitment).toMatchObject({
      ownerModuleId: "runner.pressure_central",
      ownerDedupeKey: "central:rd",
      serverId: "rd",
      targetIceState: "rez_or_trash",
      targetIceInstanceId: "rd-hidden-outer",
      targetIcePosition: 2,
      evidenceCodes: expect.arrayContaining([
        "runner_targeted_ice_trash_corp_credits:1",
        "runner_targeted_ice_trash_corp_credit_pressure_value:80",
      ]),
    });

    const portfolio = pressurePortfolio(commitment!);
    const result = {
      lane: "plan",
      route: {
        planInstanceId: portfolio.executorInstanceId,
        step: {},
        head: {
          planInstanceId: portfolio.executorInstanceId,
          stepId: "force-rez-or-trash",
          actionId: candidate.actionId,
          actionType: candidate.actionType,
          semanticActionType: candidate.semanticActionType,
          stateVersion: 10,
        },
      },
      portfolio,
      diagnostics: [],
    } as unknown as Parameters<
      typeof bindSelectedRunnerTargetedIceTrashChoiceContinuation
    >[1];
    bindSelectedRunnerTargetedIceTrashChoiceContinuation(input, result, [
      candidate,
    ]);
    rememberResidentPlanPortfolio(input, portfolio);
    const choiceInput = targetedRezOrTrashChoiceInput();

    expect(
      selectedRunnerTargetedIceTrashChoiceOptionId(
        choiceInput,
        resolveChoiceAction(),
        choiceInput.playerView.pendingChoice!,
        choiceInput.playerView.pendingChoice!.options,
      ),
    ).toBe("ice_3");
  });

  it("fails closed when generic development selects the targeted action or the planned ICE is absent", () => {
    const input = planningInput();
    const candidate = targetedTrashCandidate();
    const genericPortfolio = {
      schemaVersion: "resident-plan-portfolio-v2",
      side: "runner",
      stateVersion: 10,
      executorInstanceId: "plan:runner.develop_board_and_hand:jettison",
      instances: [
        {
          instanceId: "plan:runner.develop_board_and_hand:jettison",
          moduleId: "runner.develop_board_and_hand",
          executionState: "executor",
          moduleState: { kind: "development" },
        },
      ],
      completionHistory: [],
      transitions: [],
    } as unknown as ResidentPlanPortfolio;
    expect(() =>
      bindSelectedRunnerTargetedIceTrashChoiceContinuation(
        input,
        {
          lane: "plan",
          route: {
            planInstanceId: genericPortfolio.executorInstanceId,
            step: {},
            head: {
              planInstanceId: genericPortfolio.executorInstanceId,
              stepId: "play-event",
              actionId: candidate.actionId,
              actionType: candidate.actionType,
              semanticActionType: candidate.semanticActionType,
              stateVersion: 10,
            },
          },
          portfolio: genericPortfolio,
          diagnostics: [],
        } as unknown as Parameters<
          typeof bindSelectedRunnerTargetedIceTrashChoiceContinuation
        >[1],
        [candidate],
      ),
    ).toThrowError("window_origin_missing");

    const commitment = runnerTargetedIceTrashPlanCommitment({
      input,
      candidate,
      planTargets: [
        {
          ownerModuleId: "runner.pressure_central",
          ownerDedupeKey: "central:rd",
          serverId: "rd",
          payoffValue: 240,
        },
      ],
    })!;
    const portfolio = pressurePortfolio(commitment);
    (
      portfolio.instances[0]!.moduleState as {
        choiceContinuation?: RunnerTargetedIceTrashChoiceContinuation;
      }
    ).choiceContinuation = {
      ...commitment,
      family: "runner_targeted_ice_trash",
      selectedActionId: candidate.actionId,
      selectedAtStateVersion: 10,
    };
    rememberResidentPlanPortfolio(input, portfolio);
    const missing = targetedChoiceInput([
      { id: "card_other", label: "Other", value: "other" },
    ]);
    expect(() =>
      selectedRunnerTargetedIceTrashChoiceOptionId(
        missing,
        resolveChoiceAction(),
        missing.playerView.pendingChoice!,
        missing.playerView.pendingChoice!.options,
      ),
    ).toThrowError("window_origin_missing");
  });
});

function targetedTrashCandidate(): ActionSemanticCandidate {
  return {
    actionId: "runner.play.jettison-1",
    actionType: "play_event",
    actorSide: "runner",
    semanticActionType: "play.runner_event",
    sourceDefinitionId: "runner-targeted-ice-trash-event",
    sourceCardInstanceId: "jettison-1",
    effectTargets: ["pay_rez_cost_to_trash_rezzed_ice"],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      costKnownStatus: "known",
      additionalCosts: [],
    },
  } as unknown as ActionSemanticCandidate;
}

function targetedUnrezzedTrashCandidate(): ActionSemanticCandidate {
  return {
    ...targetedTrashCandidate(),
    actionId: "runner.play.worm-1",
    sourceDefinitionId: "runner-targeted-unrezzed-ice-trash-event",
    sourceCardInstanceId: "worm-1",
    effectTargets: [],
    targetContext: {
      targetProfileMatches: [
        {
          targetProfileId: "use_target:installed_ice:unrezzed_ice_trash",
          status: "unknown",
          issues: [],
          evidence: ["test_unrezzed_ice_target_profile"],
        },
      ],
    },
  } as unknown as ActionSemanticCandidate;
}

function canonicalForgedCandidate(): ActionSemanticCandidate {
  const action = {
    actionId:
      "runner.play_event.forged-1.forged-1.onr_v1_086_forged-activation-orders:abilities_on_play_corp_choice_rez_or_trash_ice",
    type: "play_event",
    side: "runner",
    label: "Forged Activation Orders spielen",
    source: "forged-1",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 10,
    abilityRef: {
      sourceCardInstanceId: "forged-1",
      sourceAbilityId:
        "onr_v1_086_forged-activation-orders:abilities_on_play_corp_choice_rez_or_trash_ice",
    },
    payload: {
      cardId: "forged-1",
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityKey:
        "abilities_on_play_corp_choice_rez_or_trash_ice",
      cardImplementationAbilityId:
        "onr_v1_086_forged-activation-orders:abilities_on_play_corp_choice_rez_or_trash_ice",
    },
  } satisfies LegalAction;
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: 10,
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  if (!candidate) throw new Error("Missing canonical Forged candidate");
  return candidate;
}

function planningInput(
  overrides: {
    credits?: number;
    ice?: VisibleCard[];
    rig?: VisibleCard[];
  } = {},
): AiDecisionInput {
  return {
    side: "runner",
    difficulty: "hard",
    decisionId: "targeted-ice-trash:10",
    seed: "targeted-ice-trash",
    profileId: "test",
    actionNumber: 10,
    eventTail: [],
    legalActions: [],
    playerView: {
      stateVersion: 10,
      timingPoint: "runner_action.main",
      winner: null,
      own: {
        credits: overrides.credits ?? 8,
        rig: overrides.rig ?? [fracter("runner-fracter")],
      },
      opponent: { credits: 8 },
      servers: [
        {
          id: "rd",
          ice: overrides.ice ?? [
            blockingIce("rd-sentry", "sentry", 1),
            blockingIce("rd-wall", "wall", 2),
          ],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function blockingIce(
  instanceId: string,
  subtype: "wall" | "sentry",
  rezCost: number,
): VisibleCard {
  const ice: VisibleCard = {
    instanceId,
    definitionId:
      subtype === "wall"
        ? "onr_v1_232_crystal-wall"
        : "test-targeted-trash-sentry",
    title: subtype === "wall" ? "Crystal Wall" : "Blocking Sentry",
    type: "ice",
    subtypes: [subtype],
    known: true,
    rezzed: true,
    rezCost,
    strength: 3,
  };
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 3,
    subroutines: [
      {
        id: `${instanceId}-end-the-run`,
        type: "end_the_run",
        sourceDefinitionId: ice.definitionId!,
        sourceTitle: ice.title!,
      },
    ],
  });
}

function fracter(instanceId: string): VisibleCard {
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

function unrezzedIce(instanceId: string): VisibleCard {
  return {
    instanceId,
    title: "Unrezzed ICE",
    type: "ice",
    subtypes: [],
    known: false,
    rezzed: false,
  };
}

function pressurePortfolio(
  commitment: RunnerTargetedIceTrashCommitment,
): ResidentPlanPortfolio {
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: 10,
    rootForegroundInstanceId: "plan:runner.pressure_central:central%3Ard",
    executorInstanceId: "plan:runner.pressure_central:central%3Ard",
    instances: [
      {
        instanceId: "plan:runner.pressure_central:central%3Ard",
        moduleId: "runner.pressure_central",
        dedupeKey: "central:rd",
        executionState: "executor",
        moduleState: {
          kind: "central_pressure",
          signal: {
            targetedIceTrashCommitment: commitment,
          },
        },
      },
    ],
    completionHistory: [],
    transitions: [],
  } as unknown as ResidentPlanPortfolio;
}

function targetedChoiceInput(
  options: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"] = [
    { id: "card_rd-wall", label: "Crystal Wall", value: "rd-wall" },
    {
      id: "card_rd-sentry",
      label: "Blocking Sentry",
      value: "rd-sentry",
    },
  ],
): AiDecisionInput {
  return {
    side: "runner",
    difficulty: "hard",
    decisionId: "targeted-ice-trash:11",
    seed: "targeted-ice-trash",
    profileId: "test",
    actionNumber: 11,
    eventTail: [],
    legalActions: [resolveChoiceAction()],
    playerView: {
      stateVersion: 11,
      timingPoint: "runner_action.main",
      winner: null,
      own: { credits: 7 },
      opponent: { credits: 8 },
      servers: [],
      pendingChoice: {
        choiceId: "trash-rezzed-ice-11",
        side: "runner",
        source:
          "card_implementation.pay_rez_cost_trash_rezzed_ice:jettison-1:11",
        prompt: "Trash rezzed ICE",
        kind: "select_cards",
        options,
        minSelections: 1,
        maxSelections: 1,
        stateVersion: 11,
        visibility: "public",
      },
    },
  } as unknown as AiDecisionInput;
}

function targetedUnrezzedChoiceInput(): AiDecisionInput {
  const input = targetedChoiceInput([
    {
      id: "ice_1",
      label: "ICE 1 in R&D",
      metadata: { targetServerId: "rd", targetIcePosition: 0 },
    },
    {
      id: "ice_2",
      label: "ICE 2 in R&D",
      metadata: { targetServerId: "rd", targetIcePosition: 1 },
    },
    {
      id: "ice_3",
      label: "ICE 3 in R&D",
      metadata: { targetServerId: "rd", targetIcePosition: 2 },
    },
  ]);
  input.playerView.pendingChoice = {
    ...input.playerView.pendingChoice!,
    choiceId: "trash-unrezzed-ice-11",
    source: "card_implementation.trash_unrezzed_ice:worm-1:11",
  };
  return input;
}

function targetedRezOrTrashChoiceInput(): AiDecisionInput {
  const input = targetedUnrezzedChoiceInput();
  input.playerView.pendingChoice = {
    ...input.playerView.pendingChoice!,
    source:
      "card_implementation.corp_choice_rez_or_trash_ice_target:forged-1:11",
  };
  return input;
}

function resolveChoiceAction(): LegalAction {
  return {
    actionId: "runner.resolve-choice.11",
    type: "resolve_choice",
    side: "runner",
  } as LegalAction;
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
