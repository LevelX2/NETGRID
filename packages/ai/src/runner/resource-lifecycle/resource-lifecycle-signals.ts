import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { runnerVoluntarySelfTrashLifecycleProfile } from "../../runtime/runner-canonical-card-facts";
import { corpDefinitionHasTraceSource } from "../../runtime/corp-canonical-card-facts";
import type {
  RunnerResourceLifecycleSignal,
  ResourceLifecycleFundingSearch,
} from "./resource-lifecycle-types";

export function runnerResourceLifecycleSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  findFundingRoute: ResourceLifecycleFundingSearch,
): RunnerResourceLifecycleSignal[] {
  const leavePlayPaymentActions = candidates.filter((candidate) =>
    runnerCandidateIsLeavePlayPaymentLifecycleAction(input, candidate),
  );
  const voluntarySelfTrashSignals = candidates.flatMap((candidate) => {
    const sourceCardInstanceId = candidate.sourceCardInstanceId;
    const definitionId = candidate.sourceDefinitionId;
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    const profile = runnerVoluntarySelfTrashLifecycleProfile(definitionId);
    const visibleSource = sourceCardInstanceId
      ? (input.playerView.own.rig ?? []).find(
          (card) => card.instanceId === sourceCardInstanceId,
        )
      : undefined;
    const visibleTraceThreat = input.playerView.servers.some((server) =>
      [...server.ice, ...server.root].some(
        (card) =>
          card.known === true &&
          corpDefinitionHasTraceSource(card.definitionId),
      ),
    );
    if (
      !sourceCardInstanceId ||
      !definitionId ||
      !profile ||
      !visibleSource ||
      visibleSource.definitionId !== definitionId ||
      action?.side !== "runner" ||
      action.type !== "activated_card_ability" ||
      action.source !== sourceCardInstanceId ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      action.payload?.cardId !== sourceCardInstanceId ||
      action.payload?.cardImplementationCapabilityBindingKind !==
        "card_spec_capability_key" ||
      action.payload?.cardImplementationAbilityKey !== "trash_source_action" ||
      action.payload?.cardImplementationTrashesSource !== true ||
      (profile.exposesRunnerToAutomaticTraceSuccess && visibleTraceThreat)
    ) {
      return [];
    }
    return [
      {
        lifecycleId: `voluntary-self-trash:${definitionId}:${sourceCardInstanceId}`,
        sourceCardInstanceId,
        definitionId,
        phase: "retain" as const,
        actionIds: [],
        rejectedActionIds: [candidate.actionId],
        priorityClass: "P5" as const,
        value: 0,
        evidenceCodes: [
          "runner_resource_self_trash_deferred_without_visible_hazard",
          `runner_resource_retained_start_turn_credit_gain:${profile.turnStartCreditGain}`,
          `runner_resource_avoided_leave_play_credit_loss:${profile.leavePlayCreditLoss}`,
        ],
      },
    ];
  });
  const visibleRemainingRunnerTurnCeiling = input.playerView.opponent.deckCount;
  const actionsBySourceInstance = new Map<string, ActionSemanticCandidate[]>();
  for (const candidate of leavePlayPaymentActions) {
    const sourceCardInstanceId = candidate.sourceCardInstanceId;
    if (sourceCardInstanceId === undefined) continue;
    const actions = actionsBySourceInstance.get(sourceCardInstanceId) ?? [];
    actions.push(candidate);
    actionsBySourceInstance.set(sourceCardInstanceId, actions);
  }
  const leavePlayPaymentSignals = [...actionsBySourceInstance.entries()]
    .map(([sourceCardInstanceId, actions]) => {
      const definitionId = actions[0]?.sourceDefinitionId;
      if (
        definitionId === undefined ||
        actions.some(
          (candidate) => candidate.sourceDefinitionId !== definitionId,
        )
      ) {
        return undefined;
      }
      const lifecycleId = `${definitionId}:${sourceCardInstanceId}`;
      const quote = runnerLifecycleLeavePlayPaymentQuote(
        input,
        sourceCardInstanceId,
        actions,
      );
      const leavePlayEconomicallyProductive =
        quote !== undefined && visibleRemainingRunnerTurnCeiling > quote.amount;
      const marginalValue = leavePlayEconomicallyProductive
        ? visibleRemainingRunnerTurnCeiling - quote.amount
        : 0;
      const capacitySpent = input.playerView.own.clicks === 0;
      const supportNeedId = `resource-lifecycle-support:${sourceCardInstanceId}`;
      const fundingGap =
        quote?.status === "unpayable"
          ? Math.max(0, quote.amount - input.playerView.own.credits)
          : 0;
      const fundingRoute =
        quote?.status === "unpayable" &&
        leavePlayEconomicallyProductive &&
        !capacitySpent &&
        fundingGap > 0
          ? findFundingRoute({
              demandId: supportNeedId,
              sourcePlanId: planInstanceIdForProposal({
                moduleId: "runner.resource_lifecycle",
                dedupeKey: lifecycleId,
              }),
              purpose: "foreground_plan",
              priority: "current_foreground_plan",
              hardness: "hard",
              deadline: "end_of_current_turn",
              targetCredits: quote.amount,
              remainingClicks: input.playerView.own.clicks,
              evidence: [
                `runner_resource_lifecycle_source:${sourceCardInstanceId}`,
                `runner_resource_lifecycle_exact_payment_amount:${quote.amount}`,
              ],
            })
          : undefined;
      const fullFundingRouteExists =
        fundingRoute?.routeAssessment.status === "covered_guaranteed" &&
        fundingRoute.routeAssessment.reliability === "guaranteed" &&
        fundingRoute.routeAssessment.horizon === "same_turn" &&
        fundingRoute.routeAssessment.projectedGap === 0 &&
        fundingRoute.routeActionIds.length > 0;
      const leavePlayNow =
        quote?.status === "payable" &&
        capacitySpent &&
        leavePlayEconomicallyProductive;
      const evidenceCode =
        quote === undefined
          ? "runner_resource_leave_payment_quote_unknown"
          : !leavePlayEconomicallyProductive
            ? `runner_resource_leave_cost_not_recovered_within_visible_horizon:${visibleRemainingRunnerTurnCeiling}`
            : quote.status === "payable"
              ? capacitySpent
                ? `runner_resource_leave_avoids_visible_long_horizon_liability:${visibleRemainingRunnerTurnCeiling}`
                : "runner_resource_leave_deferred_until_capacity_spent"
              : capacitySpent
                ? "runner_resource_leave_unpayable_without_action_capacity"
                : fullFundingRouteExists
                  ? "runner_resource_waiting_for_exact_funding_support"
                  : "runner_resource_exact_funding_route_unavailable";
      return {
        lifecycleId,
        sourceCardInstanceId,
        definitionId,
        phase: leavePlayNow ? "leave_play" : "retain",
        actionIds: leavePlayNow
          ? actions.map((candidate) => candidate.actionId)
          : [],
        ...(!leavePlayNow
          ? {
              rejectedActionIds: actions.map((candidate) => candidate.actionId),
            }
          : {}),
        ...(fullFundingRouteExists && fundingRoute && quote
          ? {
              supportNeedId,
              marginalValue,
              leavePlayPaymentAmount: quote.amount,
              fundingGap,
              fundingRouteActionIds: fundingRoute.routeActionIds,
              fundingRouteAssessment: fundingRoute.routeAssessment,
            }
          : {}),
        priorityClass: "P5",
        value: leavePlayNow || fullFundingRouteExists ? marginalValue : 0,
        evidenceCodes: [
          evidenceCode,
          ...(quote
            ? [
                `runner_resource_leave_play_payment_amount:${quote.amount}`,
                `runner_resource_leave_play_payment_status:${quote.status}`,
              ]
            : []),
        ],
      };
    })
    .filter(
      (signal): signal is RunnerResourceLifecycleSignal => signal !== undefined,
    );
  return uniqueBy(
    [...leavePlayPaymentSignals, ...voluntarySelfTrashSignals],
    (signal) => signal.lifecycleId,
  );
}

function runnerCandidateIsLeavePlayPaymentLifecycleAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType !== "turn_flow.end_turn" ||
    candidate.sourceKind !== "card" ||
    candidate.sourceCardInstanceId === undefined ||
    candidate.sourceDefinitionId === undefined
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  return (
    action?.side === "runner" &&
    action.type === "end_turn" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.source === candidate.sourceCardInstanceId &&
    action.payload?.cardId === candidate.sourceCardInstanceId &&
    action.payload?.cardImplementationLifecycleAction === "end_of_runner_turn"
  );
}

function runnerLifecycleLeavePlayPaymentQuote(
  input: AiDecisionInput,
  sourceCardInstanceId: string,
  candidates: readonly ActionSemanticCandidate[],
): { amount: number; status: "payable" | "unpayable" } | undefined {
  const quotes = candidates.map((candidate) => {
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    const amount =
      action?.payload?.cardImplementationLifecycleLeavePlayPaymentAmount;
    const status =
      action?.payload?.cardImplementationLifecycleLeavePlayPaymentStatus;
    if (
      !action ||
      action.source !== sourceCardInstanceId ||
      action.payload?.cardId !== sourceCardInstanceId ||
      action.payload?.cardImplementationLifecycleAction !==
        "end_of_runner_turn" ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      (status !== "payable" && status !== "unpayable") ||
      (input.playerView.own.credits >= amount
        ? status !== "payable"
        : status !== "unpayable")
    ) {
      return undefined;
    }
    return { amount, status };
  });
  const [first] = quotes;
  if (
    !first ||
    quotes.some(
      (quote) =>
        !quote ||
        quote.amount !== first.amount ||
        quote.status !== first.status,
    )
  ) {
    return undefined;
  }
  return first;
}

function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}
