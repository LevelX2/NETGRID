import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type { RunnerHandDevelopmentEvaluation } from "../../runner-hand-development";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerEffectsProvideTopTrashRecovery } from "../../runner-canonical-hint-semantics";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "../../actions/risk-action-projection";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";
import type {
  RunnerDefenseSignals,
  RunnerDiscardChoiceBinding,
} from "./defense-types";
import type { CreateSideCreditDemandParams } from "../../plans/credit-demand";
import type { RunnerFundingRouteContract } from "../../plans/runner-funding-contracts";
import { uniqueBy } from "../../runtime/collection";
export type RunnerDefenseServices = {
  findFundingRoute: (
    request: Pick<
      CreateSideCreditDemandParams,
      | "demandId"
      | "sourcePlanId"
      | "purpose"
      | "priority"
      | "hardness"
      | "deadline"
      | "targetCredits"
      | "evidence"
    > & { remainingClicks: number; allowIncrementalProgress: boolean },
  ) => RunnerFundingRouteContract;
  runCanConvertNow: (target: RunnerRunTargetEvaluation) => boolean;
};
export function runnerDefenseSupportSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
) {
  const defenseSupportEvaluations = handDevelopment.filter(
    (evaluation) => evaluation.developmentRole === "defense_support",
  );
  const defenseSupportInstallEvaluationActionIds = new Set(
    defenseSupportEvaluations.flatMap((evaluation) => {
      if (evaluation.legalActionId === undefined) return [];
      const candidate = candidates.find(
        (entry) => entry.actionId === evaluation.legalActionId,
      );
      return candidate?.actionType === "install_card" &&
        candidate.semanticActionType === "install.card"
        ? [evaluation.legalActionId]
        : [];
    }),
  );
  const defenseSupportAllInstallActionIds = uniqueBy(
    defenseSupportEvaluations
      .map((evaluation) => evaluation.legalActionId)
      .filter(
        (actionId): actionId is string =>
          actionId !== undefined &&
          defenseSupportInstallEvaluationActionIds.has(actionId),
      ),
    (actionId) => actionId,
  );
  const defenseSupportInstallActionIds = defenseSupportEvaluations
    .filter(
      (evaluation) =>
        evaluation.legalActionId !== undefined &&
        defenseSupportInstallEvaluationActionIds.has(
          evaluation.legalActionId,
        ) &&
        evaluation.availability === "legal_now" &&
        evaluation.currentNeed !== "none" &&
        evaluation.deferReason === "none",
    )
    .map((evaluation) => evaluation.legalActionId!);
  const defenseSupportInstallActionIdSet = new Set(
    defenseSupportInstallActionIds,
  );
  const defenseSupportRejectedInstallActionIds =
    defenseSupportAllInstallActionIds.filter(
      (actionId) => !defenseSupportInstallActionIdSet.has(actionId),
    );
  const defenseSupportInstallValues = Object.fromEntries(
    defenseSupportEvaluations.flatMap((evaluation) =>
      evaluation.legalActionId &&
      defenseSupportInstallActionIdSet.has(evaluation.legalActionId)
        ? [
            [
              evaluation.legalActionId,
              evaluation.definitionId !== undefined &&
              runnerDefinitionProvidesTraceDefense(evaluation.definitionId)
                ? runnerTraceDefenseInstallValue(input, evaluation)
                : Math.max(1, 40 + evaluation.priority),
            ],
          ]
        : [],
    ),
  );
  return {
    defenseSupportAllInstallActionIds,
    defenseSupportInstallActionIds,
    defenseSupportRejectedInstallActionIds,
    defenseSupportInstallValues,
  };
}
export function runnerDefenseHandBufferFacts(
  input: AiDecisionInput,
  runTargets: readonly RunnerRunTargetEvaluation[],
) {
  const handSize = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(0, input.playerView.own.maxHandSize ?? 5);
  const damageThreat = runnerDamageThreatAssessment(input);
  const riskAdjustedHandBuffer =
    runnerRiskAdjustedHandBufferForAttractiveRuns(runTargets);
  const volatileBreakerFailureDamage = Math.max(
    0,
    ...(input.playerView.own.rig ?? []).map(
      (card) =>
        randomBreakOrDamageRiskProfileForDefinitionId(card.definitionId)
          ?.maxSingleFailureDamage ?? 0,
    ),
  );
  const volatileBreakerHandFloor =
    volatileBreakerFailureDamage > 0 ? volatileBreakerFailureDamage + 1 : 0;
  const minimumHandBuffer = Math.max(
    riskAdjustedHandBuffer.minimumHandBuffer,
    damageThreat.flatlineRisk.recommendedHandFloor,
    volatileBreakerHandFloor,
  );
  return {
    handSize,
    maxHandSize,
    damageThreat,
    riskAdjustedHandBuffer,
    volatileBreakerHandFloor,
    minimumHandBuffer,
  };
}
export function buildRunnerDefenseSignals(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  runTargets: readonly RunnerRunTargetEvaluation[];
  strategicIntent: RunnerStrategicIntentProfile;
  handBuffer: ReturnType<typeof runnerDefenseHandBufferFacts>;
  support: ReturnType<typeof runnerDefenseSupportSignals>;
  exactCoverageRecoveryActionIds: ReadonlySet<string>;
  forgoTerminalDeckPressureCapacity: boolean;
  discardChoiceBinding: RunnerDiscardChoiceBinding | undefined;
  services: RunnerDefenseServices;
}) {
  const {
    input,
    candidates,
    runTargets,
    strategicIntent,
    exactCoverageRecoveryActionIds,
    forgoTerminalDeckPressureCapacity,
    discardChoiceBinding,
    services,
  } = params;
  const {
    handSize,
    maxHandSize,
    damageThreat,
    riskAdjustedHandBuffer,
    volatileBreakerHandFloor,
    minimumHandBuffer,
  } = params.handBuffer;
  const {
    defenseSupportInstallActionIds,
    defenseSupportRejectedInstallActionIds,
    defenseSupportInstallValues,
  } = params.support;
  const currentCredits = input.playerView.own.credits;
  const riskAdjustedHandBufferOpen = handSize < minimumHandBuffer;
  const damageBufferForecast =
    damageThreat.flatlineRisk.level === "critical" ||
    damageThreat.flatlineRisk.level === "confirmed" ||
    runTargets.some(
      (evaluation) =>
        evaluation.recommendation === "draw_for_damage_buffer" ||
        evaluation.pathPassability ===
          "blocked_by_random_break_damage_hand_buffer" ||
        evaluation.pathPassability ===
          "blocked_by_visible_damage_hand_buffer" ||
        (evaluation.riskyUniversalCoverage && handSize < 3) ||
        evaluation.randomBreakOrDamageRiskAssessment?.blockedByHandBuffer ===
          true ||
        evaluation.randomBreakOrDamageRiskAssessment?.riskSeverity === "high" ||
        evaluation.randomBreakOrDamageRiskAssessment?.riskSeverity === "lethal",
    ) ||
    (handSize < 3 &&
      input.playerView.servers.some((server) =>
        server.ice.some(
          (ice) =>
            ice.rezzed === true &&
            ((strategicIntent.riskProfile ?? []).includes(
              "runner.risky_universal_breaker_pressure",
            ) ||
              rolesForDeckDoctrineCard(ice.definitionId ?? "").includes(
                "sentry_ice",
              )),
        ),
      ));
  const productiveLegalActions = input.legalActions.filter(
    (action) => action.type !== "end_turn",
  );
  const runOnlyActionCapacity =
    productiveLegalActions.length > 0 &&
    productiveLegalActions.every((action) => action.type === "start_run") &&
    (input.playerView.own.clicks === 0 ||
      productiveLegalActions.every(
        (action) =>
          action.source !== "basic_action" &&
          action.costs.reduce(
            (total, cost) => total + Math.max(0, cost.clicks ?? 0),
            0,
          ) === 0,
      ));
  const visibleImmediatePayoffRunAvailable = runTargets.some(
    (evaluation) =>
      evaluation.pathPassability === "reachable" &&
      evaluation.recommendation === "run_now" &&
      ["agenda", "score_threat", "trash_affordable", "fresh"].includes(
        evaluation.accessPayoff,
      ),
  );
  const directlyConvertibleBypassEventRunAvailable = runTargets.some(
    (evaluation) =>
      evaluation.runActionProjection?.sourceKind === "event" &&
      evaluation.runActionProjection?.bypassFirstIce === true &&
      evaluation.bypassedFirstIce === true &&
      evaluation.recommendation === "run_now" &&
      services.runCanConvertNow(evaluation),
  );
  const visiblySafePositiveRunAvailable = runTargets.some((evaluation) => {
    const visibleServer = input.playerView.servers.find(
      (server) => server.id === evaluation.targetServerId,
    );
    const noUnrezzedIceVisible =
      visibleServer !== undefined &&
      visibleServer.ice.every((ice) => ice.rezzed === true);
    return (
      evaluation.pathPassability === "reachable" &&
      evaluation.score > 0 &&
      (evaluation.recommendation === "run_now" ||
        evaluation.recommendation === "run_if_free") &&
      noUnrezzedIceVisible &&
      (evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
      evaluation.visibleTraceTagHazardUnavoidable !== true &&
      evaluation.randomBreakOrDamageRiskAssessment?.blockedByHandBuffer !==
        true &&
      evaluation.randomBreakOrDamageRiskAssessment?.riskSeverity !== "high" &&
      evaluation.randomBreakOrDamageRiskAssessment?.riskSeverity !== "lethal"
    );
  });
  const forgoUnsafeRunCapacity =
    runOnlyActionCapacity &&
    riskAdjustedHandBufferOpen &&
    !visiblySafePositiveRunAvailable &&
    !visibleImmediatePayoffRunAvailable;
  const forgoExhaustedStandardCapacity =
    input.playerView.own.clicks > 0 &&
    input.playerView.own.stackOrRdCount === 0;
  const tagClearTargetCredits = 2;
  const tagClearFundingActionIds = services.findFundingRoute({
    demandId: "runner-defense-tag-clear-funding",
    sourcePlanId: "runner.defense_and_recovery:runner",
    purpose: "foreground_plan",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits: tagClearTargetCredits,
    remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
    allowIncrementalProgress: true,
    evidence: ["runner_visible_tag_punish_requires_clear_funding"],
  }).routeActionIds;
  const directTagClearAvailable = candidates.some(
    (candidate) => candidate.semanticActionType === "tag.remove",
  );
  const tagClearFundingOpen =
    input.playerView.own.tags > 0 &&
    !directTagClearAvailable &&
    input.playerView.own.credits < tagClearTargetCredits &&
    input.playerView.own.clicks > 1 &&
    tagClearFundingActionIds.length > 0;
  const tagClearFundingNeed: RunnerDefenseSignals["tagClearFundingNeed"] =
    tagClearFundingOpen
      ? {
          needId: "runner-defense-tag-clear-funding",
          parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          targetCredits: tagClearTargetCredits,
          currentCreditsAtRevalidation: currentCredits,
          gap: Math.max(0, tagClearTargetCredits - currentCredits),
          actionIds: tagClearFundingActionIds,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "defense_parent_open",
          },
          evidenceCode: "runner_visible_tag_punish_requires_clear_funding",
        }
      : undefined;
  const reactionReserveTargetCredits = 10;
  const reactionReserveActionIds = services.findFundingRoute({
    demandId: "runner-defense-reaction-reserve",
    sourcePlanId: "runner.defense_and_recovery:runner",
    purpose: "tactical_reserve",
    priority: "tactical_reserve",
    hardness: "soft",
    deadline: "end_of_current_turn",
    targetCredits: reactionReserveTargetCredits,
    remainingClicks: input.playerView.own.clicks,
    allowIncrementalProgress: true,
    evidence: ["runner_damage_locked_hand_reaction_reserve"],
  }).routeActionIds;
  const criticalDamageAtHandFloor =
    damageThreat.flatlineRisk.level === "critical" &&
    damageThreat.flatlineRisk.handCount <=
      damageThreat.flatlineRisk.recommendedHandFloor;
  const confirmedDamageAtLockedHand =
    (damageThreat.flatlineRisk.level === "confirmed" ||
      damageThreat.flatlineRisk.level === "critical") &&
    damageThreat.flatlineRisk.effectiveMaxHandSize <=
      damageThreat.flatlineRisk.recommendedHandFloor &&
    damageThreat.flatlineRisk.handCount >=
      damageThreat.flatlineRisk.effectiveMaxHandSize &&
    damageThreat.flatlineRisk.handBufferHeadroom === 0;
  const reactionReserveOpen =
    damageThreat.deckBelief.level === "confirmed" &&
    (criticalDamageAtHandFloor || confirmedDamageAtLockedHand) &&
    input.playerView.own.clicks > 0 &&
    input.playerView.own.credits < 10 &&
    !visibleImmediatePayoffRunAvailable &&
    !directlyConvertibleBypassEventRunAvailable &&
    reactionReserveActionIds.length > 0;
  const reactionReserveNeed: RunnerDefenseSignals["reactionReserveNeed"] =
    reactionReserveOpen
      ? {
          needId: "runner-defense-reaction-reserve",
          parentPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          targetCredits: reactionReserveTargetCredits,
          currentCreditsAtRevalidation: currentCredits,
          gap: Math.max(0, reactionReserveTargetCredits - currentCredits),
          actionIds: reactionReserveActionIds,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "defense_parent_open",
          },
          evidenceCode: "runner_damage_locked_hand_reaction_reserve",
        }
      : undefined;
  const confirmedDamageTaxedDrawActionIds =
    damageThreat.flatlineRisk.level === "confirmed" ||
    damageThreat.flatlineRisk.level === "critical"
      ? candidates
          .filter((candidate) => {
            const legalAction = input.legalActions.find(
              (action) => action.actionId === candidate.actionId,
            );
            return (
              legalAction !== undefined &&
              runnerDrawTaxLiabilityProjection(input, legalAction, candidate)
                .projectedTagsAdded > 0
            );
          })
          .map((candidate) => candidate.actionId)
      : [];
  const confirmedDamageTaxedDrawActionIdSet = new Set(
    confirmedDamageTaxedDrawActionIds,
  );
  const defense: RunnerDefenseSignals = {
    activeTags: input.playerView.own.tags,
    visibleTagPunish: input.playerView.own.tags > 0,
    persistentHazardCounterRemovalAvailable: candidates.some(
      (candidate) =>
        candidate.semanticActionType === "counter.remove_trace_tag" ||
        candidate.semanticActionType === "counter.remove_runner_hazard",
    ),
    pendingDamage: visiblePendingDamage(candidates),
    damagePreventionNeeded: candidates.some(
      (candidate) =>
        candidate.semanticActionType.startsWith("damage.prevent") ||
        candidate.actionTacticSignals.includes("damage_prevention"),
    ),
    handSize,
    minimumHandBuffer,
    drawAllowed:
      input.playerView.own.stackOrRdCount > 0 &&
      candidates.some(
        (candidate) =>
          candidate.semanticActionType === "draw.card" &&
          handSize < maxHandSize,
      ),
    handBufferActionIds: candidates
      .filter((candidate) => {
        return (
          handSize < maxHandSize &&
          handSize < minimumHandBuffer &&
          !exactCoverageRecoveryActionIds.has(candidate.actionId) &&
          !confirmedDamageTaxedDrawActionIdSet.has(candidate.actionId) &&
          ((input.playerView.own.stackOrRdCount > 0 &&
            (candidate.semanticActionType === "draw.card" ||
              ((candidate.economyProjection?.netHandDelta ?? 0) > 0 &&
                candidate.economyProjection?.timing === "immediate" &&
                candidate.semanticActionType !== "install.card"))) ||
            ((candidate.actionType === "activated_card_ability" ||
              candidate.actionType === "trigger_ability") &&
              runnerEffectsProvideTopTrashRecovery(
                candidate.functionalEffects,
              )))
        );
      })
      .map((candidate) => candidate.actionId),
    confirmedDamageTaxedDrawActionIds,
    forgoUnsafeRunCapacity,
    forgoExhaustedStandardCapacity,
    forgoTerminalDeckPressureCapacity,
    ...(discardChoiceBinding ? { discardChoiceBinding } : {}),
    ...(tagClearFundingNeed ? { tagClearFundingNeed } : {}),
    ...(reactionReserveNeed ? { reactionReserveNeed } : {}),
    defenseSupportInstallActionIds,
    defenseSupportRejectedInstallActionIds,
    defenseSupportInstallValues,
    handBufferPriorityClass:
      riskAdjustedHandBufferOpen && riskAdjustedHandBuffer.minimumHandBuffer > 3
        ? "P3"
        : (damageThreat.flatlineRisk.level === "critical" ||
              damageThreat.flatlineRisk.criticalRunSuppression) &&
            handSize < damageThreat.flatlineRisk.recommendedHandFloor
          ? "P3"
          : volatileBreakerHandFloor > 0 && handSize < volatileBreakerHandFloor
            ? "P4"
            : "P5",
    evidenceCodes: [
      ...(candidates.some(
        (candidate) =>
          candidate.semanticActionType === "counter.remove_trace_tag" ||
          candidate.semanticActionType === "counter.remove_runner_hazard",
      )
        ? ["runner_persistent_trace_counter_removal_available"]
        : []),
      ...(forgoUnsafeRunCapacity
        ? ["runner_restricted_run_capacity_below_hand_buffer"]
        : []),
      ...(forgoTerminalDeckPressureCapacity
        ? ["runner_match_point_favorable_deck_race_wait_available"]
        : []),
      ...(reactionReserveNeed
        ? ["runner_damage_locked_hand_reaction_reserve"]
        : []),
      ...(tagClearFundingNeed
        ? ["runner_visible_tag_punish_requires_clear_funding"]
        : []),
      ...(defenseSupportInstallActionIds.length > 0
        ? ["runner_defense_support_current_need"]
        : ["runner_no_defense_support_current_need"]),
      ...(discardChoiceBinding?.evidenceCodes ?? []),
      ...(riskAdjustedHandBufferOpen
        ? [
            volatileBreakerHandFloor === minimumHandBuffer
              ? `runner_volatile_breaker_hand_buffer:${minimumHandBuffer}`
              : minimumHandBuffer > riskAdjustedHandBuffer.minimumHandBuffer
                ? `runner_damage_threat_hand_buffer:${minimumHandBuffer}`
                : riskAdjustedHandBuffer.evidenceCode,
          ]
        : []),
      ...(damageBufferForecast
        ? [
            damageThreat.flatlineRisk.level === "critical" ||
            damageThreat.flatlineRisk.level === "confirmed"
              ? `runner_flatline_risk:${damageThreat.flatlineRisk.level}`
              : "runner_run_target_requires_damage_buffer",
          ]
        : ["runner_visible_defense_state"]),
    ],
  };

  return {
    defense,
    forgoUnsafeRunCapacity,
    runOnlyActionCapacity,
    confirmedDamageTaxedDrawActionIdSet,
  };
}
function runnerDefinitionProvidesTraceDefense(definitionId: string): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.functionSignals?.includes("defense.trace_defense") === true ||
    hint?.effects?.some(
      (effect) =>
        effect.timing === "trace_window" &&
        (effect.kind === "base_link" || effect.kind === "link"),
    ) === true
  );
}

function runnerTraceDefenseInstallValue(
  input: AiDecisionInput,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const hint = evaluation.definitionId
    ? AI_HINTS_BY_CARD.get(evaluation.definitionId)
    : undefined;
  const installedBaseLink = Math.max(
    0,
    ...(
      input.playerView.own.runnerTraceSupportQuote?.baseLinkOptions ?? []
    ).map((option) => option.baseLink),
  );
  const efficiencies = (hint?.actionCapabilitySemantics ?? []).flatMap(
    (capability) => {
      const activationCost = Math.max(1, capability.costProfile?.credits ?? 0);
      return (capability.effects ?? []).flatMap((effect) => {
        if (effect.timing !== "trace_window") return [];
        if (effect.kind === "base_link") {
          return [
            Math.max(0, (effect.amount ?? 0) - installedBaseLink) /
              activationCost,
          ];
        }
        if (effect.kind === "link") {
          return [Math.max(0, effect.amount ?? 0) / activationCost];
        }
        return [];
      });
    },
  );
  const bestEfficiency = Math.max(0, ...efficiencies);
  const card = input.playerView.own.gripOrHq.find(
    (entry) => entry.instanceId === evaluation.cardInstanceId,
  );
  const installCost = Math.max(0, card?.installCost ?? card?.cost ?? 0);
  const memoryCost = Math.max(0, card?.memoryCost ?? 0);
  const establishesHigherBaseLink = (hint?.effects ?? []).some(
    (effect) =>
      effect.kind === "base_link" && (effect.amount ?? 0) > installedBaseLink,
  );
  return Math.max(
    1,
    Math.round(
      40 +
        bestEfficiency * 30 +
        (establishesHigherBaseLink ? 10 : 0) -
        installCost * 5 -
        memoryCost * 5,
    ),
  );
}

function runnerRiskAdjustedHandBufferForAttractiveRuns(
  runTargets: readonly RunnerRunTargetEvaluation[],
): { minimumHandBuffer: number; evidenceCode: string } {
  let minimumHandBuffer = 3;
  let evidenceCode = "runner_base_hand_buffer:3";
  let strongestRisk = -1;

  for (const evaluation of runTargets) {
    if (
      evaluation.pathPassability !== "reachable" ||
      !["run_now", "run_if_free"].includes(evaluation.recommendation) ||
      evaluation.score <= 0
    )
      continue;
    const unknownIce = evaluation.unknownUnrezzedIceCount ?? 0;
    const risk = evaluation.unrezzedIceRisk ?? 0;
    if (unknownIce < 2 || risk < 0.75) continue;

    const requiredBuffer =
      evaluation.multiaccessAvailable || unknownIce >= 3 ? 5 : 4;
    if (
      requiredBuffer < minimumHandBuffer ||
      (requiredBuffer === minimumHandBuffer && risk <= strongestRisk)
    )
      continue;

    minimumHandBuffer = requiredBuffer;
    strongestRisk = risk;
    evidenceCode = [
      `runner_high_risk_run_hand_buffer:${requiredBuffer}`,
      `unknown_unrezzed_ice:${unknownIce}`,
      `unrezzed_ice_risk:${risk}`,
      `multiaccess:${evaluation.multiaccessAvailable}`,
      `server:${evaluation.targetServerId}`,
    ].join("|");
  }

  return { minimumHandBuffer, evidenceCode };
}

function visiblePendingDamage(
  candidates: readonly ActionSemanticCandidate[],
): number {
  return candidates.some(
    (candidate) =>
      candidate.semanticActionType.startsWith("damage.prevent") ||
      candidate.actionTacticSignals.includes("damage_prevention"),
  )
    ? 1
    : 0;
}
