import { instantiatePlanProposal } from "../plans/plan-instance";
import type { PlanInstance, PlanModuleId } from "../plans/plan-kernel-types";
import { syntheticCardDefinitionId } from "@netgrid/engine/test-fixtures/synthetic-card-definition-id";
import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
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
import { aiInput, legalAction, safeRuntimeRunTarget } from "../semantic-ai-runtime-cutover.test-support";
import { runnerRezOrTrashPreparationBeatsImmediateRun } from "../run-analysis/runner-run-preparation";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
} from "../plans/resident-plan-portfolio-memory";
import { runnerGenericDevelopmentMayOwnAction } from "../runner/run-window/runner-targeted-bypass-plan";
import {
  isRunnerTargetedIceTrashChoice,
  selectedRunnerTargetedIceTrashChoiceOptionId,
} from "../runner/run-window/runner-targeted-ice-trash-choice";
import {
  runnerActionRequiresTargetedIceTrashPlan,
  runnerTargetedIceTrashPlanCommitment,
  runnerUnrezzedIceTrashRouteOpeningPayoff,
  type RunnerTargetedIceTrashCommitment,
  type RunnerTargetedIceTrashChoiceContinuation,
} from "./runner-targeted-ice-trash-plan";
import { runnerActionDispositions } from "./plan-first-live-runtime";
import { bindSelectedRunnerTargetedPreparationChoiceContinuation } from "../run-analysis/runner-run-preparation-choice-binding";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";
import { centralPressureModule } from "../runner/central-pressure/central-pressure-plan-module";

afterEach(() => {
  resetResidentPlanPortfolioMemory();
});

describe("Runner targeted ICE disruption plan", () => {
  it.each([
    [
      "rezzed removal",
      targetedTrashCandidate,
      "Remove the preflighted rezzed ICE target from rd.",
    ],
    [
      "unrezzed removal",
      targetedUnrezzedTrashCandidate,
      "Remove the preflighted unrezzed ICE target from rd.",
    ],
    [
      "rez or trash",
      canonicalForgedCandidate,
      "Make the Corp rez or trash the preflighted ICE target on rd.",
    ],
  ] as const)(
    "describes the committed target for %s",
    (kind, buildCandidate, purpose) => {
      const candidate = buildCandidate();
      const input =
        kind === "rezzed removal"
          ? planningInput()
          : planningInput({
              credits: 20,
              ice: [
                blockingIce("rd-wall", "wall", 1),
                unrezzedIce("rd-hidden"),
              ],
            });
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
      expect(commitment).toBeDefined();
      const [instance] = pressurePortfolio(commitment!).instances;
      instance!.moduleState = {
        kind: "central_pressure",
        signal: {
          routePreparation: "targeted_ice_trash",
          serverId: commitment!.serverId,
          marginalValue: 1_000,
          preparationActionIds: [commitment!.sourceActionId],
          sourceDefinitionIds: [commitment!.sourceDefinitionId],
          targetedIceTrashCommitment: commitment,
        },
      };
      const pressure = centralPressureModule();
      const materialized = pressure.materialize(instance!, {} as never, {
        input,
        actionCandidates: [candidate],
        turnKey: "runner:turn:1",
      });
      expect(materialized?.step.purpose).toBe(purpose);
      expect(materialized?.step.stepId).toBe(
        `${instance!.instanceId}:pressure:rd`,
      );
      expect(
        materialized?.candidates.map(({ candidate }) => candidate.actionId),
      ).toEqual([commitment!.sourceActionId]);
    },
  );
  it.each([
    ["rezzed removal", targetedTrashCandidate],
    ["unrezzed removal", targetedUnrezzedTrashCandidate],
    ["rez-or-trash", canonicalForgedCandidate],
  ])(
    "gives unbound %s an explicit pressure-owner disposition without overriding a bound route",
    (_label, buildCandidate) => {
      const candidate = { ...canonicalForgedCandidate(), ...buildCandidate() };
      const input = aiInput("runner", []);
      const domain = {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      };
      const dispositions = (overrides = {}) =>
        runnerActionDispositions(
          input,
          [candidate],
          { ...domain, ...overrides } as never,
          [],
          [],
          () => undefined,
        );
      expect(dispositions()).toEqual([
        {
          actionId: candidate.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.pressure_central",
          evidenceCode: "runner_no_bound_targeted_ice_trash_route",
        },
      ]);
      for (const owner of ["centralPressure", "remoteContests"]) {
        expect(
          dispositions({
            [owner]: [
              {
                preparationActionIds: [candidate.actionId],
                runActionAssessments: {},
              },
            ],
          }),
        ).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ actionId: candidate.actionId }),
          ]),
        );
      }
    },
  );

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
      typeof bindSelectedRunnerTargetedPreparationChoiceContinuation
    >[1];

    bindSelectedRunnerTargetedPreparationChoiceContinuation(input, result, [
      candidate,
    ]);
    expect(candidate.actionId).toBe("runner.play.jettison-1");
    expect(portfolio.executorInstanceId).toBe("pa90fufw9vc5bkshp96ztlryxl");
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
        choiceInput.legalActions[0]!,
        choiceDependencies(),
      ),
    ).toEqual({
      choiceId: "trash-rezzed-ice-11",
      selectedOptionIds: ["card_rd-sentry"],
    });

    // Selection at version 8, bank support at 9, resumed event at 10.
    continuation.plannedAtStateVersion = 8;
    continuation.selectedAtStateVersion = 8;
    continuation.engineContinuationAtStateVersion = 10;
    const resolvePaidChoice = () =>
      selectedRunnerTargetedIceTrashChoiceOptionId(
        choiceInput,
        resolveChoiceAction(),
        choice,
        choice.options,
        portfolio,
      );
    expect(resolvePaidChoice()).toBe("card_rd-sentry");
    continuation.engineContinuationAtStateVersion = 9;
    expect(resolvePaidChoice).toThrow(/window_origin_missing/);
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
      typeof bindSelectedRunnerTargetedPreparationChoiceContinuation
    >[1];
    bindSelectedRunnerTargetedPreparationChoiceContinuation(input, result, [
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

  it("only compares preparation against an actually executable alternative run", () => {
    const action = legalAction("run-other", "runner", "start_run", "Run HQ", { credits: 0, clicks: 1 });
    const input = aiInput("runner", [action]);
    input.playerView.opponent.credits = 8;
    const target = safeRuntimeRunTarget(action.actionId, "hq") as unknown as RunnerRunTargetEvaluation;
    const compare = (overrides: Partial<RunnerRunTargetEvaluation>) =>
      runnerRezOrTrashPreparationBeatsImmediateRun({
        input,
        targetIceState: "rez_or_trash",
        serverId: "rd",
        payoffValue: 500,
        runTargets: [{ ...target, score: 800, ...overrides }],
      });
    expect(compare({ pathPassability: "blocked_unpayable", recommendation: "gain_credits_first" })).toBe(true);
    expect(compare({ pathPassability: "reachable", recommendation: "run_now" })).toBe(false);
    expect(compare({ actionId: "stale-run", pathPassability: "reachable", recommendation: "run_now" })).toBe(true);
  });

  it("requires the current Trace profile before quoting removal that leaves a Trace ICE", () => {
    const ice = withEffectiveRunQuote(blockingIce("trace-wall", "wall", 1), {
      effectiveStrength: 3,
      subroutines: [{
        id: "trace",
        type: "initiate_trace",
        sourceDefinitionId: 444,
        sourceTitle: "Trace wall",
        traceLimit: 2,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      }],
    });
    const input = planningInput({ ice: [ice, unrezzedIce("hidden")] });
    expect(() => runnerUnrezzedIceTrashRouteOpeningPayoff(input, "rd"))
      .toThrowError("invalid_player_view_card_projection");
    input.playerView.traceRulesProfile = "modern_open";
    expect(() => runnerUnrezzedIceTrashRouteOpeningPayoff(input, "rd")).not.toThrow();
  });

  it("recognizes the canonical unrezzed-ICE capability and values the route it opens", () => {
    const action = {
      actionId:
        "rh.worm-1.worm-1.onr_v1_109_security-code-worm-chip:abilities_on_play_trash_unrezzed_ice",
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
          405,
      },
      payload: {
        cardId: "worm-1",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: "abilities_on_play_trash_unrezzed_ice",
        cardImplementationAbilityId:
          405,
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
      typeof bindSelectedRunnerTargetedPreparationChoiceContinuation
    >[1];
    bindSelectedRunnerTargetedPreparationChoiceContinuation(input, result, [
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
      executorInstanceId: "p85e2anuqvf9fdg1movaib1a81",
      instances: [
        {
          instanceId: "p85e2anuqvf9fdg1movaib1a81",
          moduleId: "runner.develop_board_and_hand",
          executionState: "executor",
          moduleState: { kind: "development" },
        },
      ],
      completionHistory: [],
      transitions: [],
    } as unknown as ResidentPlanPortfolio;
    expect(() =>
      bindSelectedRunnerTargetedPreparationChoiceContinuation(
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
          typeof bindSelectedRunnerTargetedPreparationChoiceContinuation
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
    sourceDefinitionId: syntheticCardDefinitionId("runner-targeted-ice-trash-event"),
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
    sourceDefinitionId: syntheticCardDefinitionId("runner-targeted-unrezzed-ice-trash-event"),
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
      "rh.forged-1.forged-1.onr_v1_086_forged-activation-orders:abilities_on_play_corp_choice_rez_or_trash_ice",
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
        382,
    },
    payload: {
      cardId: "forged-1",
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityKey:
        "abilities_on_play_corp_choice_rez_or_trash_ice",
      cardImplementationAbilityId:
        382,
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
        ? 444
        : syntheticCardDefinitionId("test-targeted-trash-sentry"),
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
    definitionId: 259,
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
  const instance = currentTargetedPlanInstance(
    "runner.pressure_central",
    "central:rd",
    {
      kind: "central_pressure",
      signal: { targetedIceTrashCommitment: commitment },
    },
    10,
  );
  return {
    schemaVersion: "resident-plan-portfolio-v2",
    side: "runner",
    stateVersion: 10,
    rootForegroundInstanceId: instance.instanceId,
    executorInstanceId: instance.instanceId,
    instances: [instance],
    completionHistory: [],
    transitions: [],
  };
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
    legalActions: [
      {
        ...resolveChoiceAction(),
        source: "game_rule",
        choiceRequirements: [
          {
            choiceId: "trash-rezzed-ice-11",
            minSelections: 1,
            maxSelections: 1,
            optionIds: options.map((option) => option.id),
          },
        ],
      },
    ],
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
    timingPoint: "runner_action.main",
    expiresAtStateVersion: 11,
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

function currentTargetedPlanInstance(
  moduleId: PlanModuleId,
  dedupeKey: string,
  moduleState: unknown,
  stateVersion: number,
): PlanInstance {
  return {
    ...instantiatePlanProposal(
      {
        moduleId,
        moduleVersion: "1",
        dedupeKey,
        side: "runner",
        strategyLineIds: [],
        executionClass: "bounded_sequence",
        initialViability: "ready",
        persistencePolicy: "locked_sequence",
        retentionPolicy: {
          blockedStateVersionTtl: 2,
          dormantStateVersionTtl: 2,
          completedHistoryStateVersionTtl: 4,
          abandonWhenTargetMissing: true,
          protectedWhileNeedOpen: true,
          protectedWhileCommitted: true,
        },
        phase: "targeted_preparation",
        milestone: "choice_bound",
        moduleState,
        blockers: [],
        resumeConditions: [],
        completionConditions: [],
        abandonmentConditions: [],
        evidenceRefs: [],
      },
      stateVersion,
    ),
    executionState: "executor",
    portfolioRole: "foreground",
  };
}
