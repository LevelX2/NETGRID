import {
  type AiDecisionInput,
  type CorpPunishRouteQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { immediateCorpLiquidCreditGain } from "../../plans/corp-core-plan-modules";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { corpCandidateIsAmbushInstall } from "../../runtime/corp-ambush-plan-signals";
import { buildBoundedCorpPunishRouteRequests } from "./punish-route-quote-input";
import { type CorpScorelineFeasibility } from "../../runtime/corp-scoreline-feasibility";
import {
  actionIsCurrentlyAffordable,
  candidateIsVisibleCorpAgendaInstall,
  candidateIsVisibleCorpIceInstall,
  candidateTargetIds,
  currentLegalActionResourceCost,
  visibleOwnDefinitionIds,
} from "../../runtime/visible-action-facts";
import { getStructuredTagPunishProfileForCard } from "../../tag-punish-ontology-consumer";
import {
  corpDefinitionIsTraceSource,
  corpDefinitionIsTraceSupport,
  corpFortTraceSupportPlacementIsPreferred,
  corpInstallTargetProfileHasPurpose,
  corpProtectedEmptyRemoteTagSourcePlacementIsPreferred,
  corpStrategicFundingPhaseBlocksPreparation,
  corpTraceSupportTargetHasVisibleTraceSource,
  visibleTagPayoffConversionIsAffordable,
} from "./punish-preparation";
import { type CorpPunishCampaignSignal } from "./punish-types";

export function punishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
  previous: ResidentPlanPortfolio | undefined,
): CorpPunishCampaignSignal[] {
  const quoted = quotedPunishSignals(input, candidates, previous);
  const legacyRoots = mergeStableLegacyPunishRoots(
    legacyPunishSignals(input, candidates, scorelineFeasibility).filter(
      (signal) =>
        signal.phase === "prepare" ||
        signal.evidenceCode.startsWith(
          "corp_tagged_runner_visible_resource_trash",
        ) ||
        signal.evidenceCode.startsWith(
          "corp_tagged_runner_visible_credit_bank_trash",
        ),
    ),
  );
  return [...quoted, ...legacyRoots];
}

export function mergeStableLegacyPunishRoots(
  signals: readonly CorpPunishCampaignSignal[],
): CorpPunishCampaignSignal[] {
  const merged = new Map<string, CorpPunishCampaignSignal>();
  for (const signal of signals) {
    const current = merged.get(signal.campaignId);
    if (!current) {
      merged.set(signal.campaignId, structuredClone(signal));
      continue;
    }
    const semanticActionTypes = new Set(
      [
        current.initiatingSemanticActionType,
        signal.initiatingSemanticActionType,
      ].filter((value): value is string => value !== undefined),
    );
    const {
      initiatingSemanticActionType: _currentSemanticActionType,
      ...currentWithoutSemanticActionType
    } = current;
    merged.set(signal.campaignId, {
      ...currentWithoutSemanticActionType,
      sourceDefinitionIds: [
        ...new Set([
          ...current.sourceDefinitionIds,
          ...signal.sourceDefinitionIds,
        ]),
      ],
      actionIds: [
        ...new Set([...(current.actionIds ?? []), ...(signal.actionIds ?? [])]),
      ],
      ...(semanticActionTypes.size === 1
        ? { initiatingSemanticActionType: [...semanticActionTypes][0]! }
        : {}),
      feasible: current.feasible || signal.feasible,
      value: Math.max(current.value, signal.value),
      evidenceCodes: [
        ...new Set([
          ...(current.evidenceCodes ?? [current.evidenceCode]),
          ...(signal.evidenceCodes ?? [signal.evidenceCode]),
        ]),
      ],
    });
  }
  return [...merged.values()].sort((left, right) =>
    left.campaignId.localeCompare(right.campaignId),
  );
}

export function quotedPunishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): CorpPunishCampaignSignal[] {
  const quoteSet = input.playerView.corpPunishRouteQuoteSet;
  if (
    quoteSet?.complete !== true ||
    quoteSet.side !== "corp" ||
    quoteSet.stateVersion !== input.playerView.stateVersion ||
    quoteSet.timingPoint !== input.playerView.timingPoint
  ) {
    return retainedUnknownPunishSignals(
      input,
      previous,
      quoteSet?.incompleteReasons,
    );
  }
  const routesByCampaign = new Map<string, CorpPunishRouteQuote[]>();
  for (const route of quoteSet.routes) {
    if (
      !route.complete ||
      route.stateVersion !== input.playerView.stateVersion ||
      route.campaignIdOrigin !== "request_binding" ||
      route.steps.length === 0
    ) {
      continue;
    }
    const current = routesByCampaign.get(route.campaignId) ?? [];
    current.push(route);
    routesByCampaign.set(route.campaignId, current);
  }
  return [...routesByCampaign.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([campaignId, routes]) => {
      const signal = selectQuotedPunishSignal(
        input,
        candidates,
        campaignId,
        routes,
      );
      return signal ? [signal] : [];
    });
}

export function retainedUnknownPunishSignals(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio | undefined,
  incompleteReasons: readonly string[] | undefined,
): CorpPunishCampaignSignal[] {
  if (!previous) return [];
  const reason =
    incompleteReasons && incompleteReasons.length > 0
      ? incompleteReasons.join(",")
      : "route_quote_unavailable";
  return previous.instances.flatMap((instance) => {
    if (instance.moduleId !== "corp.punish_campaign") return [];
    const previousState = instance.moduleState as
      | { kind?: unknown; signal?: CorpPunishCampaignSignal }
      | undefined;
    const previousSignal = previousState?.signal;
    const previousRoute = previousSignal?.routeContract;
    if (!previousSignal || !previousRoute) return [];
    const {
      terminalCondition: _previousTerminalCondition,
      actionIds: _previousActionIds,
      initiatingSemanticActionType: _previousSemanticActionType,
      ...retainedSignal
    } = previousSignal;
    const {
      currentHeadStepId: _previousHeadStepId,
      currentHeadActionId: _previousHeadActionId,
      ...retainedRoute
    } = previousRoute;
    return [
      {
        ...structuredClone(retainedSignal),
        phase: "watch_window" as const,
        actionIds: [],
        feasible: false,
        guarantee: "speculative" as const,
        visibleTerminalProjection: false,
        value: 0,
        evidenceCode: `corp_punish_route_quote_unknown:${reason}`,
        evidenceCodes: [
          `corp_punish_route_quote_state_version:${input.playerView.stateVersion}`,
          `corp_punish_route_quote_unknown:${reason}`,
        ],
        routeContract: {
          ...structuredClone(retainedRoute),
          quoteStatus: "unknown" as const,
          quoteStateVersion: input.playerView.stateVersion,
          fundingGap: 0,
          fundingActionIds: [],
          horizon: "wait" as const,
        },
      },
    ];
  });
}

export function selectQuotedPunishSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  campaignId: string,
  routes: readonly CorpPunishRouteQuote[],
): CorpPunishCampaignSignal | undefined {
  return routes
    .map((route) => ({
      route,
      signal: quotedPunishSignal(input, candidates, campaignId, route),
    }))
    .sort((left, right) => {
      const readinessOrder =
        quotedPunishSignalReadinessRank(left.signal) -
        quotedPunishSignalReadinessRank(right.signal);
      if (readinessOrder !== 0) return readinessOrder;
      const horizonOrder =
        quotedPunishHorizonRank(left.signal.routeContract?.horizon) -
        quotedPunishHorizonRank(right.signal.routeContract?.horizon);
      return horizonOrder !== 0
        ? horizonOrder
        : compareQuotedPunishRoutes(left.route, right.route);
    })[0]?.signal;
}

export function quotedPunishSignalReadinessRank(
  signal: CorpPunishCampaignSignal,
): number {
  if (signal.visibleTerminalProjection) return 0;
  return signal.feasible ? 1 : 2;
}

export function quotedPunishHorizonRank(
  horizon: "execute" | "fund" | "wait" | undefined,
): number {
  return horizon === "execute" ? 0 : horizon === "fund" ? 1 : 2;
}

export type QuotedPunishOpportunityAssessment = {
  disposition: "opportunity" | "watch";
  priorityClass: "P1" | "P3" | "P4" | "P5";
  value: number;
  visibleTerminalProjection: boolean;
  evidenceCode: string;
};

export const QUOTED_PUNISH_PRIORITY_RANK = {
  P1: 1,
  P3: 3,
  P4: 4,
  P5: 5,
} as const;

/**
 * Rates the strategic outcome of an Engine-certified route without turning
 * non-terminal damage into a binary rejection. The bounded value is only a
 * within-class comparison: priority remains the scheduler's cross-plan
 * authority.
 */
function assessQuotedPunishOpportunity(
  route: CorpPunishRouteQuote,
): QuotedPunishOpportunityAssessment {
  const minimumDamage = route.damageEnvelope.effectiveDamage.minimum;
  const runnerHandCount = route.damageEnvelope.runnerHandCount;
  const hasDamageStep = route.steps.some(
    (step) =>
      step.kind === "meat_damage" ||
      step.kind === "net_damage" ||
      step.kind === "core_damage",
  );
  if (!hasDamageStep) {
    if (route.guarantee === "unknown") {
      return {
        disposition: "watch",
        priorityClass: "P5",
        value: 0,
        visibleTerminalProjection: false,
        evidenceCode: "corp_punish_opportunity_watch:guarantee_unknown",
      };
    }
    const positiveRunnerCreditLoss =
      (route.nonDamageEnvelope?.runnerCreditLoss.minimum ?? 0) > 0;
    const positiveHardwareTrash = route.steps.some(
      (step) =>
        step.hardwareTrashProjection !== undefined &&
        step.hardwareTrashProjection.eligibleTargetCount > 0,
    );
    const expiringDirectTag =
      route.tagTrigger.kind === "direct_tag_step" &&
      route.tagTrigger.status === "projected";
    const additionalTagPressure =
      (route.tagTrigger.kind === "existing_tag" &&
        (route.tagOutcomeEnvelope?.addedTags.maximum ?? 0) > 0) ||
      (route.tagTrigger.kind === "trace_tag_step" &&
        (route.tagOutcomeEnvelope?.addedTags.minimum ?? 0) >= 2 &&
        (route.tagOutcomeEnvelope?.addedTags.minimum ?? 0) >=
          route.responsePaymentEnvelope.totalCorpCredits.maximum);
    if (expiringDirectTag) {
      return {
        disposition: "opportunity",
        priorityClass: "P3",
        value: Math.max(
          1,
          Math.min(
            120,
            105 -
              Math.min(20, route.totalClicks * 5) -
              Math.min(
                20,
                route.responsePaymentEnvelope.totalCorpCredits.maximum * 3,
              ),
          ),
        ),
        visibleTerminalProjection: false,
        evidenceCode: "corp_punish_opportunity:expiring_direct_tag_pressure",
      };
    }
    if (additionalTagPressure) {
      const minimumAddedTags = route.tagOutcomeEnvelope!.addedTags.minimum;
      const maximumAddedTags = route.tagOutcomeEnvelope!.addedTags.maximum;
      const currentRunnerTags = route.tagOutcomeEnvelope!.currentRunnerTags;
      const guaranteeFactor = minimumAddedTags > 0 ? 1 : 0.75;
      return {
        disposition: "opportunity",
        priorityClass: currentRunnerTags <= 1 ? "P4" : "P5",
        value: Math.max(
          1,
          Math.min(
            120,
            Math.round(
              (108 + minimumAddedTags * 20 + maximumAddedTags * 6) *
                guaranteeFactor -
                Math.min(36, currentRunnerTags * 18) -
                Math.min(18, route.totalClicks * 5) -
                Math.min(
                  18,
                  route.responsePaymentEnvelope.totalCorpCredits.maximum * 4,
                ),
            ),
          ),
        ),
        visibleTerminalProjection: false,
        evidenceCode: "corp_punish_opportunity:additional_tag_pressure",
      };
    }
    if (!positiveRunnerCreditLoss && !positiveHardwareTrash) {
      return {
        disposition: "watch",
        priorityClass: "P5",
        value: 0,
        visibleTerminalProjection: false,
        evidenceCode:
          "corp_punish_opportunity_watch:no_positive_non_damage_payoff",
      };
    }
    return {
      disposition: "opportunity",
      priorityClass: "P4",
      value: Math.max(
        1,
        Math.min(
          120,
          Math.round(
            120 -
              Math.min(18, route.totalClicks * 4) -
              Math.min(
                18,
                route.responsePaymentEnvelope.totalCorpCredits.maximum / 2,
              ),
          ),
        ),
      ),
      visibleTerminalProjection: false,
      evidenceCode: "corp_punish_opportunity:non_damage_payoff",
    };
  }
  if (minimumDamage <= 0 || route.guarantee === "unknown") {
    return {
      disposition: "watch",
      priorityClass: "P5",
      value: 0,
      visibleTerminalProjection: false,
      evidenceCode:
        minimumDamage <= 0
          ? "corp_punish_opportunity_watch:no_positive_minimum_damage"
          : "corp_punish_opportunity_watch:guarantee_unknown",
    };
  }

  const visibleTerminalProjection = minimumDamage > runnerHandCount;
  const safelyDestroyedCards = Math.min(minimumDamage, runnerHandCount);
  const destroyedHandShare =
    runnerHandCount === 0 ? 1 : safelyDestroyedCards / runnerHandCount;
  const remainingHandCount = Math.max(0, runnerHandCount - minimumDamage);
  const materialHandDestruction =
    destroyedHandShare >= 0.5 || remainingHandCount <= 1;
  const priorityClass = visibleTerminalProjection
    ? ("P1" as const)
    : materialHandDestruction
      ? ("P4" as const)
      : ("P5" as const);
  const outcomeValue = visibleTerminalProjection
    ? 220
    : materialHandDestruction
      ? 125 + destroyedHandShare * 75 + (remainingHandCount <= 1 ? 10 : 0)
      : 12 + destroyedHandShare * 40 + Math.min(10, safelyDestroyedCards * 2);
  const guaranteeFactor =
    route.guarantee === "guaranteed"
      ? 1
      : route.guarantee === "conditional_on_runner_response"
        ? 0.94
        : 0.88;
  const responseKnowledgeFactor =
    route.responseKnowledge === "public_exact"
      ? 1
      : route.responseKnowledge === "public_bounded"
        ? 0.95
        : 0.9;
  const clickLoad = Math.min(18, route.totalClicks * 4);
  const creditLoad = Math.min(
    18,
    route.responsePaymentEnvelope.totalCorpCredits.maximum / 2,
  );
  const boundedValue = Math.max(
    1,
    Math.min(
      200,
      Math.round(
        outcomeValue * guaranteeFactor * responseKnowledgeFactor -
          clickLoad -
          creditLoad,
      ),
    ),
  );
  return {
    disposition: "opportunity",
    priorityClass,
    value: boundedValue,
    visibleTerminalProjection,
    evidenceCode: visibleTerminalProjection
      ? "corp_punish_opportunity:terminal_flatline"
      : materialHandDestruction
        ? "corp_punish_opportunity:material_hand_destruction"
        : "corp_punish_opportunity:chip_damage",
  };
}

export function compareQuotedPunishRoutes(
  left: CorpPunishRouteQuote,
  right: CorpPunishRouteQuote,
): number {
  const leftAssessment = assessQuotedPunishOpportunity(left);
  const rightAssessment = assessQuotedPunishOpportunity(right);
  const priorityOrder =
    QUOTED_PUNISH_PRIORITY_RANK[leftAssessment.priorityClass] -
    QUOTED_PUNISH_PRIORITY_RANK[rightAssessment.priorityClass];
  if (priorityOrder !== 0) return priorityOrder;
  const valueOrder = rightAssessment.value - leftAssessment.value;
  if (valueOrder !== 0) return valueOrder;
  const clickOrder = left.totalClicks - right.totalClicks;
  if (clickOrder !== 0) return clickOrder;
  const creditOrder =
    left.responsePaymentEnvelope.totalCorpCredits.maximum -
    right.responsePaymentEnvelope.totalCorpCredits.maximum;
  if (creditOrder !== 0) return creditOrder;
  const minimumDamageOrder =
    right.damageEnvelope.effectiveDamage.minimum -
    left.damageEnvelope.effectiveDamage.minimum;
  if (minimumDamageOrder !== 0) return minimumDamageOrder;
  return left.routeId.localeCompare(right.routeId);
}

export function quotedPunishSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  campaignId: string,
  route: CorpPunishRouteQuote,
): CorpPunishCampaignSignal {
  const head = route.steps[0]!;
  const opportunity = assessQuotedPunishOpportunity(route);
  const actionable = opportunity.disposition === "opportunity";
  const headActionId = head.currentLegalAction?.actionId;
  const headCandidate = headActionId
    ? candidates.find(
        (candidate) =>
          candidate.actionId === headActionId &&
          candidate.sourceCardInstanceId === head.sourceCardInstanceId &&
          candidate.sourceDefinitionId === head.sourceCardDefinitionId,
      )
    : undefined;
  const exactHeadAction = headActionId
    ? input.legalActions.find(
        (action) =>
          action.actionId === headActionId &&
          action.source === head.sourceCardInstanceId &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      )
    : undefined;
  const currentHeadAvailable =
    headCandidate !== undefined && exactHeadAction !== undefined;
  const fundingGap = actionable
    ? Math.max(
        0,
        route.responsePaymentEnvelope.totalCorpCredits.maximum -
          input.playerView.own.credits,
      )
    : 0;
  const fundingActions =
    actionable && fundingGap > 0
      ? candidates.filter((candidate) => {
          const gain = immediateCorpLiquidCreditGain(candidate);
          if (gain < fundingGap) return false;
          const action = input.legalActions.find(
            (legalAction) => legalAction.actionId === candidate.actionId,
          );
          const clicks = action
            ? currentLegalActionResourceCost(action, "clicks")
            : undefined;
          return (
            clicks !== undefined &&
            clicks > 0 &&
            route.totalClicks + clicks <= input.playerView.own.clicks
          );
        })
      : [];
  const horizon: "execute" | "fund" | "wait" =
    actionable &&
    fundingGap === 0 &&
    route.totalClicks <= input.playerView.own.clicks &&
    currentHeadAvailable
      ? "execute"
      : fundingGap > 0 && fundingActions.length > 0
        ? "fund"
        : "wait";
  const terminalGuarantee =
    route.guarantee === "guaranteed" ||
    route.guarantee === "conditional_on_runner_response";
  const terminal =
    opportunity.visibleTerminalProjection &&
    terminalGuarantee &&
    horizon !== "wait";
  const phase =
    horizon === "fund"
      ? ("fund" as const)
      : horizon === "wait"
        ? ("watch_window" as const)
        : punishPhaseForQuotedHead(head.kind);
  const executionNeedId = `punish-execution:${campaignId}:${route.routeId}`;
  const fundingNeedId = `punish-funding:${campaignId}:${route.routeId}`;
  const evidenceCodes = [
    `corp_punish_route_quote_state_version:${route.stateVersion}`,
    `corp_punish_route_selected:${route.routeId}`,
    `corp_punish_route_horizon:${horizon}`,
    opportunity.evidenceCode,
  ];
  const secondaryLiquidGain = headCandidate
    ? immediateCorpLiquidCreditGain(headCandidate)
    : 0;
  return {
    campaignId,
    phase,
    sourceDefinitionIds: [
      ...new Set(route.steps.map((step) => step.sourceCardDefinitionId)),
    ],
    ...(actionable && currentHeadAvailable
      ? { actionIds: [headActionId!] }
      : {}),
    ...(actionable && headCandidate
      ? { initiatingSemanticActionType: headCandidate.semanticActionType }
      : {}),
    feasible: horizon === "execute" || horizon === "fund",
    guarantee:
      route.guarantee === "guaranteed"
        ? "visible_state_forced"
        : route.guarantee === "conditional_on_runner_response"
          ? "robust_but_reactive"
          : route.guarantee === "not_guaranteed"
            ? "belief_supported"
            : "speculative",
    ...(opportunity.priorityClass === "P4" || opportunity.priorityClass === "P5"
      ? { priorityClass: opportunity.priorityClass }
      : {}),
    ...(terminal ? { terminalCondition: "runner_flatline" as const } : {}),
    visibleTerminalProjection: terminal,
    value: Math.min(200, opportunity.value + secondaryLiquidGain * 6),
    evidenceCode: `corp_punish_route_selected:${route.routeId}`,
    evidenceCodes,
    routeContract: {
      contractVersion: "corp_punish_route_signal_v1",
      quoteStatus: "complete",
      quoteStateVersion: route.stateVersion,
      routeId: route.routeId,
      totalClicks: route.totalClicks,
      totalActionCredits: route.totalActionCredits,
      corpResponseCredits:
        route.responsePaymentEnvelope.corpResponseCredits.maximum,
      totalCorpCredits: route.responsePaymentEnvelope.totalCorpCredits.maximum,
      fundingGap,
      fundingActionIds: fundingActions.map((candidate) => candidate.actionId),
      horizon,
      executionNeedId,
      fundingNeedId,
      currentHeadStepId: head.stepId,
      ...(head.kind === "trace_tag" && currentHeadAvailable
        ? {
            traceBidBinding: {
              sourceCardInstanceId: head.sourceCardInstanceId,
              sourceDefinitionId: head.sourceCardDefinitionId,
              quotedAtStateVersion: route.stateVersion,
              amount: route.responsePaymentEnvelope.corpResponseCredits.maximum,
            },
          }
        : {}),
      ...(currentHeadAvailable ? { currentHeadActionId: headActionId! } : {}),
    },
  };
}

export function punishPhaseForQuotedHead(
  kind: CorpPunishRouteQuote["steps"][number]["kind"],
): CorpPunishCampaignSignal["phase"] {
  if (kind === "trace_tag") return "trace";
  if (kind === "tag") return "tag";
  if (
    kind === "meat_damage" ||
    kind === "net_damage" ||
    kind === "core_damage"
  ) {
    return "damage";
  }
  return "kill";
}

export function legacyPunishSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
): CorpPunishCampaignSignal[] {
  return candidates.flatMap((candidate): CorpPunishCampaignSignal[] => {
    if (corpCandidateIsAmbushInstall(candidate)) return [];
    const legalAction = input.legalActions.find(
      (action) => action.actionId === candidate.actionId,
    );
    if (
      candidate.semanticActionType === "tag.trash_runner_resource" &&
      input.playerView.opponent.tags > 0 &&
      legalAction &&
      actionIsCurrentlyAffordable(input, legalAction)
    ) {
      const targetId =
        candidateTargetIds(candidate)[0] ??
        (typeof legalAction.payload?.targetCardId === "string"
          ? legalAction.payload.targetCardId
          : undefined);
      if (!targetId) return [];
      const target = input.playerView.opponent.rig?.find(
        (card) => card.instanceId === targetId,
      );
      if (!target) return [];
      const storedValue = target
        ? Object.values(target.counters ?? {}).reduce(
            (sum, amount) => sum + Math.max(0, amount),
            0,
          )
        : 0;
      return [
        {
          campaignId: `punish:resource-trash:${targetId}`,
          phase: "damage",
          sourceDefinitionIds: [],
          actionIds: [candidate.actionId],
          initiatingSemanticActionType: candidate.semanticActionType,
          feasible: true,
          guarantee: "visible_state_forced",
          visibleTerminalProjection: false,
          value: 400 + storedValue * 20,
          evidenceCode:
            storedValue > 0
              ? "corp_tagged_runner_visible_credit_bank_trash"
              : "corp_tagged_runner_visible_resource_trash",
        },
      ];
    }
    const profile = getStructuredTagPunishProfileForCard(
      candidate.sourceDefinitionId,
    );
    const tagPunishPayoff =
      profile?.payoff === true && profile.requiresRunnerTagged;
    const traceSupport = corpDefinitionIsTraceSupport(
      candidate.sourceDefinitionId,
    );
    const runnerTagged = input.playerView.opponent.tags > 0;
    const visibleDefinitions = visibleOwnDefinitionIds(input);
    const visibleTagSource = [...visibleDefinitions].some(
      (definitionId) =>
        getStructuredTagPunishProfileForCard(definitionId)?.tagSource ===
          true || corpDefinitionIsTraceSource(definitionId),
    );
    const visiblePayoff = [...visibleDefinitions].some((definitionId) => {
      const visibleProfile = getStructuredTagPunishProfileForCard(definitionId);
      return (
        visibleProfile?.payoff === true && visibleProfile.requiresRunnerTagged
      );
    });
    if (!legalAction || !actionIsCurrentlyAffordable(input, legalAction))
      return [];
    if (
      corpInstallTargetProfileHasPurpose(
        candidate,
        "establish_tag_source_in_protected_empty_remote",
      ) &&
      candidate.semanticActionType === "install.card" &&
      !corpProtectedEmptyRemoteTagSourcePlacementIsPreferred(input, candidate)
    ) {
      return [];
    }
    if (!corpPunishCandidateHasVisibleEffect(input, candidate)) return [];
    if (
      candidateIsVisibleCorpIceInstall(input, candidate) ||
      candidateIsVisibleCorpAgendaInstall(input, candidate) ||
      legalAction.type === "rez_ice" ||
      candidate.semanticActionType === "score.advance_card"
    )
      return [];
    const immediatePayoffConversion =
      profile?.tagSource === true &&
      visibleTagPayoffConversionIsAffordable(input, legalAction);
    const startsImmediateTagSequence =
      profile?.tagSource === true &&
      candidate.semanticActionType !== "install.card" &&
      candidate.semanticActionType !== "corp_window.rez";
    if (startsImmediateTagSequence && !immediatePayoffConversion) return [];
    const preparationAction =
      candidate.semanticActionType === "install.card" ||
      candidate.semanticActionType === "corp_window.rez" ||
      candidate.semanticActionType === "score.advance_card";
    const targetBoundTraceSupport =
      traceSupport &&
      corpTraceSupportTargetHasVisibleTraceSource(input, candidate);
    if (
      targetBoundTraceSupport &&
      corpInstallTargetProfileHasPurpose(
        candidate,
        "establish_fort_trace_support",
      ) &&
      candidate.semanticActionType === "install.card" &&
      !corpFortTraceSupportPlacementIsPreferred(input, candidate)
    ) {
      return [];
    }
    const profilePhase: CorpPunishCampaignSignal["phase"] | undefined =
      preparationAction &&
      (profile?.tagSource ||
        tagPunishPayoff ||
        (targetBoundTraceSupport && visibleTagSource))
        ? "prepare"
        : tagPunishPayoff && runnerTagged
          ? "damage"
          : profile?.tagSource && visiblePayoff
            ? profile.traceTagSource
              ? "trace"
              : "tag"
            : undefined;
    const phase =
      profilePhase ??
      (candidate.semanticActionType.startsWith("trace.")
        ? "trace"
        : candidate.semanticActionType.startsWith("tag.")
          ? "tag"
          : candidate.semanticActionType.startsWith("damage.") && runnerTagged
            ? "damage"
            : undefined);
    if (!phase) return [];
    if (
      phase === "prepare" &&
      corpStrategicFundingPhaseBlocksPreparation(input, candidate, legalAction)
    ) {
      return [];
    }
    if (tagPunishPayoff && !runnerTagged) return [];
    if (profile?.tagSource && !visiblePayoff && !preparationAction) return [];
    if (tagPunishPayoff && !visibleTagSource && !runnerTagged) return [];
    if (
      phase === "prepare" &&
      profile?.requiresScoredAgenda &&
      input.playerView.own.scoreArea.length === 0
    )
      return [];
    if (
      phase === "prepare" &&
      profile?.requiresScoredAgenda &&
      scorelineFeasibility?.remainingMandatoryDraws === 0
    )
      return [];
    if (
      phase === "prepare" &&
      scorelineFeasibility?.feasible === true &&
      scorelineFeasibility.currentAgendaPoints >=
        scorelineFeasibility.pointsToWin - 1
    )
      return [];
    if (phase !== "prepare") return [];
    const stableSourceId =
      candidate.sourceCardInstanceId ?? candidate.sourceDefinitionId;
    const stablePurpose = profile?.tagSource
      ? "tag-source"
      : tagPunishPayoff
        ? "tag-payoff"
        : targetBoundTraceSupport
          ? "trace-support"
          : undefined;
    if (!stableSourceId || !stablePurpose) return [];
    const value = profile?.requiresScoredAgenda
      ? 180
      : scorelineFeasibility?.deadline === "current_turn_only"
        ? 220
        : 150;
    return [
      {
        campaignId: `punish:prepare:${stableSourceId}:${stablePurpose}`,
        phase,
        sourceDefinitionIds: candidate.sourceDefinitionId
          ? [candidate.sourceDefinitionId]
          : [],
        actionIds: [candidate.actionId],
        initiatingSemanticActionType: candidate.semanticActionType,
        feasible: true,
        guarantee: "robust_but_reactive",
        visibleTerminalProjection: false,
        ...(profile === undefined ? { priorityClass: "P5" as const } : {}),
        value,
        evidenceCode: profile
          ? `tag_punish_ontology_${phase}:${candidate.sourceDefinitionId}`
          : `visible_${phase}_action`,
      },
    ];
  });
}

export function corpDefinitionSupportsPunishPlan(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    getStructuredTagPunishProfileForCard(definitionId) !== undefined ||
    hint?.lineSupport?.includes("corp.tag_trace_punish") === true ||
    hint?.strategyAnchors?.includes("corp.tag_trace_punish") === true
  );
}

export function corpConditionalPunishTagSourceHasNoVisiblePayoff(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const exactTagSource = candidate.functionalEffects?.some(
    (effect) => effect.kind === "tag_source" && effect.scope === "runner",
  );
  if (exactTagSource !== true) return false;
  return ![...visibleOwnDefinitionIds(input)].some((definitionId) => {
    const profile = getStructuredTagPunishProfileForCard(definitionId);
    return profile?.payoff === true && profile.requiresRunnerTagged;
  });
}

export function corpPunishQuoteRequestExists(input: AiDecisionInput): boolean {
  return buildBoundedCorpPunishRouteRequests(input).length > 0;
}

export function corpPunishCandidateHasVisibleEffect(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (!candidate.sourceDefinitionId) return true;
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const runnerCreditPunish = hint?.effects?.some(
    (effect) =>
      effect.scope === "runner" &&
      effect.resource === "credits" &&
      (effect.kind === "counter_economy" ||
        effect.kind === "tag_punish_payoff"),
  );
  if (!runnerCreditPunish) return true;
  const hasIndependentVisiblePayoff = hint?.effects?.some(
    (effect) =>
      !(
        effect.scope === "runner" &&
        effect.resource === "credits" &&
        (effect.kind === "counter_economy" ||
          effect.kind === "tag_punish_payoff")
      ),
  );
  return (
    input.playerView.opponent.credits > 0 ||
    hasIndependentVisiblePayoff === true
  );
}
