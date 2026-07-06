import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import { coverageSearchActionFit } from "./tactical-plan-coverage-search-fit";

type TestVisibleCardOverrides = Omit<Partial<VisibleCard>, "type"> & {
  type?: string;
};

describe("coverageSearchActionFit", () => {
  it("uses structured recovery targets and ignores label-only recovery text", () => {
    const plan = createTacticalPlan({
      planId: "runner.obtain_breaker_coverage:remote_1",
      side: "runner",
      type: "runner.obtain_breaker_coverage",
      status: "active",
      priority: 900,
      horizonTurns: 1,
      currentStep: createPlanStep({
        stepId: "search_for_answer:remote_1",
        kind: "search_for_answer",
        desiredActionSemantics: ["search_for_answer"],
        requiredCapabilities: [
          {
            capabilityId: "coverage:breaker_wall",
            kind: "breaker_wall",
            side: "runner",
            evidence: ["test"],
          },
        ],
      }),
      stateVersion: 1,
    });
    const labelOnly = action({
      actionId: "label-only-recovery",
      label: "Junkyard BBS recovery from heap",
    });
    const structured = action({
      actionId: "structured-recovery",
      label: "Use ability",
      payload: { targetCardDefinitionId: "onr_v1_021_dwarf" },
    });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(labelOnly),
        labelOnly,
        input([labelOnly]),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      recoveredCardPlanFit: "none",
    });
    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(structured),
        structured,
        input([structured]),
        false,
      ),
    ).toMatchObject({
      answerRole: "recovery_answer",
      recoveredCardId: "onr_v1_021_dwarf",
      recoveredCardPlanFit: "high",
    });
  });

  it("ignores substring-only coverage roles from visible source cards", () => {
    const plan = coveragePlan("breaker_wall");
    const researchAction = action({
      actionId: "research-action",
      source: "research-source",
    });
    const microEconomyAction = action({
      actionId: "microeconomy-action",
      source: "microeconomy-source",
    });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(researchAction),
        researchAction,
        input(
          [researchAction],
          [
            visibleCard({
              instanceId: "research-source",
              definitionId: "test_lab",
              type: "research",
            }),
          ],
        ),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      supportsDrawOrSearchNeed: false,
      recoveredCardRole: "research",
    });
    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(microEconomyAction),
        microEconomyAction,
        input(
          [microEconomyAction],
          [
            visibleCard({
              instanceId: "microeconomy-source",
              definitionId: "test_market",
              type: "microeconomy",
            }),
          ],
        ),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsCreditNeed: false,
      recoveryLoopRisk: "low",
      recoveredCardRole: "microeconomy",
    });
  });

  it("ignores substring-only coverage roles from structured recovery targets", () => {
    const plan = coveragePlan("breaker_wall");
    const recoveryAction = action({
      actionId: "recover-research",
      source: "recovery-source",
      payload: { targetCardId: "research-target" },
    });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(recoveryAction),
        recoveryAction,
        input(
          [recoveryAction],
          [
            visibleCard({
              instanceId: "recovery-source",
              definitionId: "junkyard_source",
              title: "Junkyard BBS",
              type: "resource",
            }),
            visibleCard({
              instanceId: "research-target",
              definitionId: "test_lab_target",
              type: "research",
              known: true,
            }),
          ],
        ),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      supportsDrawOrSearchNeed: false,
      recoveredCardRole: "research",
      recoveredCardPlanFit: "none",
    });
  });

  it("ignores recovery source text without a structured target", () => {
    const plan = coveragePlan("breaker_wall");
    const sourceOnlyRecovery = action({
      actionId: "source-only-recovery",
      source: "recovery-source",
    });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(sourceOnlyRecovery),
        sourceOnlyRecovery,
        input(
          [sourceOnlyRecovery],
          [
            visibleCard({
              instanceId: "recovery-source",
              definitionId: "junkyard_source",
              title: "Junkyard BBS",
              type: "resource",
            }),
          ],
        ),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      recoveredCardPlanFit: "none",
    });
  });

  it("matches explicit program search candidate signals by bounded terms", () => {
    const plan = coveragePlan("breaker_wall");
    const searchAction = action({ actionId: "program-search" });
    const noiseAction = action({ actionId: "program-search-noise" });

    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(searchAction, {
          actionTacticSignals: ["setup.program_search"],
        }),
        searchAction,
        input([searchAction]),
        false,
      ),
    ).toMatchObject({
      answerRole: "program_search",
      supportsActiveCapabilityNeed: true,
      supportsDrawOrSearchNeed: true,
    });
    expect(
      coverageSearchActionFit(
        plan,
        plan.currentStep,
        candidate(noiseAction, {
          actionTacticSignals: ["setup.program_searchish_noise"],
        }),
        noiseAction,
        input([noiseAction]),
        false,
      ),
    ).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
    });
  });

  it("rejects further program search when a visible hand breaker covers the active need", () => {
    const plan = coveragePlan("breaker_ap");
    const searchAction = action({
      actionId: "program-search",
      source: "search-source",
    });

    const fit = coverageSearchActionFit(
      plan,
      plan.currentStep,
      candidate(searchAction),
      searchAction,
      input(
        [searchAction],
        [
          visibleCard({
            instanceId: "search-source",
            definitionId: "search-source",
            title: "Search Source",
            type: "program",
            rulesText: "Search your stack for a program.",
          }),
        ],
        [
          visibleCard({
            instanceId: "ap-breaker",
            definitionId: "ap-breaker",
            title: "AP Breaker",
            type: "program",
            subtypes: ["Icebreaker", "AP"],
          }),
        ],
      ),
      false,
    );

    expect(fit).toMatchObject({
      answerRole: "not_coverage_answer",
      supportsActiveCapabilityNeed: false,
      supportsDrawOrSearchNeed: false,
      recoveryLoopRisk: "high",
    });
    expect(fit?.evidence).toContain(
      "rejectedFalseMatches:coverage_search_saturated_by_hand_answer",
    );
  });
});

function coveragePlan(requiredCoverage: "breaker_wall" | "breaker_ap") {
  return createTacticalPlan({
    planId: "runner.obtain_breaker_coverage:remote_1",
    side: "runner",
    type: "runner.obtain_breaker_coverage",
    status: "active",
    priority: 900,
    horizonTurns: 1,
    currentStep: createPlanStep({
      stepId: "search_for_answer:remote_1",
      kind: "search_for_answer",
      desiredActionSemantics: ["search_for_answer"],
      requiredCapabilities: [
        {
          capabilityId: `coverage:${requiredCoverage}`,
          kind: requiredCoverage,
          side: "runner",
          evidence: ["test"],
        },
      ],
    }),
    stateVersion: 1,
  });
}

function input(
  legalActions: LegalAction[],
  visibleCards: VisibleCard[] = [],
  handCards: VisibleCard[] = [],
): AiDecisionInput {
  const playerView = {
    side: "runner",
    own: {
      rig: visibleCards,
      gripOrHq: handCards,
      heapOrArchives: [],
      scoreArea: [],
    },
    servers: [],
  } as unknown as PlayerView;
  return {
    side: "runner",
    legalActions,
    playerView,
  } as unknown as AiDecisionInput;
}

function visibleCard(overrides: TestVisibleCardOverrides): VisibleCard {
  return {
    instanceId: "card",
    definitionId: "card",
    title: "Card",
    owner: "runner",
    controller: "runner",
    type: "resource",
    known: true,
    subtypes: [],
    ...overrides,
  } as unknown as VisibleCard;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Use ability",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}

function candidate(
  action: LegalAction,
  overrides: Partial<ActionSemanticCandidate> = {},
): ActionSemanticCandidate {
  return {
    actionId: action.actionId,
    actionType: action.type,
    actorSide: "runner",
    visibilityScope: "public",
    legalActionRef: {
      actionId: action.actionId,
      actionType: action.type,
      originalPayloadKeys: Object.keys(action.payload ?? {}),
    },
    sourceKind: "card",
    abilityBindingMethod: "unbound",
    semanticActionType: "card_ability.unknown",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { clickCost: 1, creditCost: 0, additionalCosts: [] },
    timingProfile: { timingPoint: "runner_action.main", window: "main_action" },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "medium",
    primaryProjectionStatus: "partial",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
    ...overrides,
  } as unknown as ActionSemanticCandidate;
}
