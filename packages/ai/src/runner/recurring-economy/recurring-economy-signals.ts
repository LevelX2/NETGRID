import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerHandDevelopmentEvaluation } from "../../runner-hand-development";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../run-analysis/runner-run-target-types";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { rolesHaveBreakerRole } from "../../runtime/breaker-role-match";
import { rolesMatch } from "../../runtime/role-match";
import { nonNegativeActionCreditCost as legalActionCreditCost } from "../../runtime/action-cost";
import {
  runnerNoRunRecurringEconomyProfile,
  runnerRestrictedRunCreditProfile,
} from "../../runtime/runner-canonical-card-facts";
import {
  assessRunnerRecurringEconomyRunHorizon,
  assessRunnerRestrictedRunEconomyInvestment,
} from "./recurring-economy-investment";
import type { RunnerRecurringEconomySignal } from "./recurring-economy-types";

export function runnerRecurringEconomySignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  strategicIntent: RunnerStrategicIntentProfile,
  hasExactRunUrgency: (target: RunnerRunTargetEvaluation) => boolean,
): RunnerRecurringEconomySignal[] {
  const installedSources = (input.playerView.own.rig ?? []).filter((card) =>
    hasNoRunRecurringEconomyCommitment(card.definitionId),
  );
  const installedSignals =
    installedSources.flatMap<RunnerRecurringEconomySignal>((card) => {
      const definitionId = card.definitionId;
      if (!definitionId) return [];
      const profile = runnerNoRunRecurringEconomyProfile(definitionId);
      if (!profile) return [];
      const installedThisTurn = runnerRecurringEconomyInstalledInCurrentTurn(
        input,
        definitionId,
      );
      const realization = recurringEconomyRealization(input, definitionId);
      const runDecision = runnerRecurringEconomyRunDecision(
        input,
        runTargets,
        profile.installCost,
        profile.turnStartCredits,
        realization.value,
        installedThisTurn || realization.payoutCount === 0,
      );
      // The investment owns only the decision to defer a run. It must not
      // become a second authority for otherwise independent development or
      // economy actions during the waiting turn.
      const holdActionIds: string[] = [];
      const futureValueAtRisk = profile.turnStartCredits;
      return [
        {
          commitmentId: card.instanceId,
          definitionId,
          commitmentActive: true,
          phase: "hold" as const,
          actionIds: holdActionIds,
          priorityClass:
            runDecision.decision === "wait" ? ("P3" as const) : ("P4" as const),
          value: futureValueAtRisk * 350,
          investmentHorizon: {
            installCost: profile.installCost,
            earliestPayout: profile.earliestPayout,
            projectedHoldTurns: runDecision.decision === "wait" ? 1 : 0,
            invalidatingActionType: profile.invalidatingActionType,
            realizedPayoutCount: realization.payoutCount,
            realizedValue: realization.value,
            futureValueAtRisk,
            bestVisibleRunPayoff: runDecision.bestVisibleRunPayoff,
            decision: runDecision.decision,
          },
          evidenceCodes: [
            `runner_recurring_economy_investment_decision:${runDecision.decision}`,
            `runner_recurring_economy_install_cost:${profile.installCost}`,
            `runner_recurring_economy_earliest_payout:${profile.earliestPayout}`,
            `runner_recurring_economy_projected_hold_turns:${runDecision.decision === "wait" ? 1 : 0}`,
            `runner_recurring_economy_invalidating_action:${profile.invalidatingActionType}`,
            `runner_recurring_economy_realized_payout_count:${realization.payoutCount}`,
            `runner_recurring_economy_realized_value:${realization.value}`,
            `runner_recurring_economy_future_value_at_risk:${futureValueAtRisk}`,
            `runner_recurring_economy_best_visible_run_payoff:${runDecision.bestVisibleRunPayoff}`,
            ...runDecision.evidenceCodes,
            "runner_recurring_economy_hold_defers_runs_only",
          ],
        },
      ];
    });
  const installSignals = candidates.flatMap<RunnerRecurringEconomySignal>(
    (candidate) => {
      if (
        candidate.semanticActionType !== "install.card" ||
        !candidate.sourceDefinitionId ||
        !hasNoRunRecurringEconomyCommitment(candidate.sourceDefinitionId)
      )
        return [];
      const profile = runnerNoRunRecurringEconomyProfile(
        candidate.sourceDefinitionId,
      );
      if (!profile) return [];
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      if (!action) return [];
      const runDecision = runnerRecurringEconomyRunDecision(
        input,
        runTargets,
        profile.installCost,
        profile.turnStartCredits,
        0,
        true,
      );
      const productiveSetupAlternative = input.legalActions.some(
        (action) =>
          action.actionId !== candidate.actionId &&
          action.type !== "start_run" &&
          action.type !== "end_turn",
      );
      const investmentCost = legalActionCreditCost(action);
      const firstPayoutJustifiesInvestment =
        profile.turnStartCredits > investmentCost;
      const rebuildWindow =
        economy.buildEconomyBeforePressure ||
        economy.recommendation === "build_economy" ||
        runDecision.bestVisibleRunPayoff <= 0;
      const setupWindow =
        input.playerView.own.clicks >= 2 &&
        firstPayoutJustifiesInvestment &&
        runDecision.decision === "wait" &&
        (productiveSetupAlternative || rebuildWindow);
      return [
        {
          commitmentId:
            candidate.sourceCardInstanceId ??
            candidate.sourceCardId ??
            candidate.sourceDefinitionId,
          definitionId: candidate.sourceDefinitionId,
          commitmentActive: false,
          phase: setupWindow ? ("install" as const) : ("hold" as const),
          actionIds: setupWindow ? [candidate.actionId] : [],
          priorityClass: setupWindow ? ("P4" as const) : ("P5" as const),
          value: setupWindow ? profile.turnStartCredits * 150 : 0,
          investmentHorizon: {
            installCost: investmentCost,
            earliestPayout: profile.earliestPayout,
            projectedHoldTurns: setupWindow ? 1 : 0,
            invalidatingActionType: profile.invalidatingActionType,
            realizedPayoutCount: 0,
            realizedValue: 0,
            futureValueAtRisk: profile.turnStartCredits,
            bestVisibleRunPayoff: runDecision.bestVisibleRunPayoff,
            decision: setupWindow ? "install" : runDecision.decision,
          },
          evidenceCodes: [
            setupWindow
              ? "runner_recurring_economy_install_ready"
              : "runner_recurring_economy_install_deferred_no_setup_window",
            `runner_recurring_economy_investment_decision:${setupWindow ? "install" : runDecision.decision}`,
            `runner_recurring_economy_install_cost:${investmentCost}`,
            `runner_recurring_economy_earliest_payout:${profile.earliestPayout}`,
            `runner_recurring_economy_projected_hold_turns:${setupWindow ? 1 : 0}`,
            `runner_recurring_economy_invalidating_action:${profile.invalidatingActionType}`,
            `runner_recurring_economy_future_value_at_risk:${profile.turnStartCredits}`,
            `runner_recurring_economy_best_visible_run_payoff:${runDecision.bestVisibleRunPayoff}`,
            ...runDecision.evidenceCodes,
          ],
        },
      ];
    },
  );
  const recurringBreakerEngineActive =
    strategicIntent.engineLineIds?.includes(
      "runner.engine.compatible_recurring_economy",
    ) === true;
  const recurringBreakerProviderIds = new Set(
    (strategicIntent.engineProviders ?? [])
      .filter((provider) =>
        provider.capabilities.includes("runner.economy.recurring_breaker"),
      )
      .map((provider) => provider.cardId),
  );
  const restrictedRunCreditInstallSignals =
    candidates.flatMap<RunnerRecurringEconomySignal>((candidate) => {
      if (
        candidate.semanticActionType !== "install.card" ||
        !candidate.sourceDefinitionId ||
        hasNoRunRecurringEconomyCommitment(candidate.sourceDefinitionId)
      ) {
        return [];
      }
      const profile = runnerRestrictedRunCreditProfile(
        candidate.sourceDefinitionId,
      );
      if (
        !profile ||
        !recurringBreakerEngineActive ||
        !recurringBreakerProviderIds.has(candidate.sourceDefinitionId)
      ) {
        return [];
      }
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      const handEvaluation = handDevelopment.find(
        (evaluation) =>
          evaluation.definitionId === candidate.sourceDefinitionId &&
          evaluation.cardInstanceId === candidate.sourceCardInstanceId &&
          evaluation.legalActionId === candidate.actionId,
      );
      if (!action || !handEvaluation) return [];
      const installedCompatibleBreakerCount =
        runnerInstalledCompatibleRestrictedCreditBreakerCount(
          input,
          profile.uses,
        );
      const urgentRunAvailable = runTargets.some(
        (evaluation) =>
          evaluation.pathPassability === "reachable" &&
          hasExactRunUrgency(evaluation),
      );
      const productiveCentralRunAvailable = runTargets.some(
        (evaluation) =>
          evaluation.pathPassability === "reachable" &&
          evaluation.recommendation === "run_now" &&
          evaluation.score >= 180 &&
          evaluation.targetKind !== "remote",
      );
      const investment = assessRunnerRestrictedRunEconomyInvestment({
        engineLineActive: recurringBreakerEngineActive,
        providerMatches: recurringBreakerProviderIds.has(
          candidate.sourceDefinitionId,
        ),
        installedCompatibleBreakerCount,
        installCost: legalActionCreditCost(action),
        recurringCredits: profile.capacity,
        clicksRemaining: input.playerView.own.clicks,
        runnerDeckCount: input.playerView.own.stackOrRdCount,
        urgentRunAvailable,
        productiveCentralRunAvailable,
      });
      const handRouteReady =
        handEvaluation.availability === "legal_now" &&
        (handEvaluation.deferReason === "none" ||
          handEvaluation.deferReason === "no_current_need") &&
        handEvaluation.persistentInstallEvaluation?.duplicateRole !==
          "redundant_duplicate";
      const installReady = investment.decision === "install" && handRouteReady;
      return [
        {
          commitmentId:
            candidate.sourceCardInstanceId ??
            candidate.sourceCardId ??
            candidate.sourceDefinitionId,
          definitionId: candidate.sourceDefinitionId,
          commitmentActive: false,
          phase: installReady ? ("install" as const) : ("hold" as const),
          actionIds: installReady ? [candidate.actionId] : [],
          priorityClass: installReady
            ? investment.priorityClass
            : ("P5" as const),
          value: installReady ? investment.value : 0,
          investmentHorizon: {
            installCost: legalActionCreditCost(action),
            earliestPayout: "next_compatible_icebreaker_use" as const,
            projectedHoldTurns: 0,
            invalidatingActionType: "none" as const,
            realizedPayoutCount: 0,
            realizedValue: 0,
            futureValueAtRisk: profile.capacity,
            bestVisibleRunPayoff: Math.max(
              0,
              ...runTargets.map((evaluation) => evaluation.score),
            ),
            decision: installReady ? ("install" as const) : ("wait" as const),
          },
          evidenceCodes: [
            ...(handRouteReady
              ? []
              : ["runner_restricted_run_economy_hand_route_deferred"]),
            ...investment.evidenceCodes,
            `runner_restricted_run_economy_hand_route_ready:${handRouteReady}`,
            `runner_restricted_run_economy_uses:${profile.uses.join("|")}`,
          ],
        },
      ];
    });
  return uniqueBy(
    [
      ...installedSignals,
      ...installSignals,
      ...restrictedRunCreditInstallSignals,
    ],
    (signal) => signal.commitmentId,
  );
}

function runnerInstalledCompatibleRestrictedCreditBreakerCount(
  input: AiDecisionInput,
  uses: readonly (
    | "using_icebreaker_during_run_non_noisy"
    | "using_killer_during_run"
  )[],
): number {
  const supportsNonNoisy = uses.includes(
    "using_icebreaker_during_run_non_noisy",
  );
  const supportsKiller = uses.includes("using_killer_during_run");
  return (input.playerView.own.rig ?? []).filter((card) => {
    const roles = rolesForDeckDoctrineCard(card.definitionId ?? "");
    const subtypes = new Set(
      (card.subtypes ?? []).map((subtype) =>
        subtype.trim().toLocaleLowerCase("en-US"),
      ),
    );
    const breaker =
      rolesHaveBreakerRole(roles) ||
      ["icebreaker", "fracter", "decoder", "killer", "worm"].some((subtype) =>
        subtypes.has(subtype),
      );
    if (!breaker) return false;
    return (
      (supportsNonNoisy && !subtypes.has("noisy")) ||
      (supportsKiller &&
        (rolesMatch(roles, ["breaker_killer"]) || subtypes.has("killer")))
    );
  }).length;
}

function runnerRecurringEconomyRunDecision(
  input: AiDecisionInput,
  runTargets: readonly RunnerRunTargetEvaluation[],
  installCost: number,
  futureValueAtRisk: number,
  realizedValue: number,
  payoutStillUnrealized: boolean,
): {
  decision: "wait" | "allow_run" | "preempt_for_urgent_run";
  bestVisibleRunPayoff: number;
  evidenceCodes: string[];
} {
  return assessRunnerRecurringEconomyRunHorizon({
    runTargets,
    legalRunActionIds: new Set(
      input.legalActions
        .filter((action) => action.type === "start_run")
        .map((action) => action.actionId),
    ),
    runnerAgendaPoints: input.playerView.own.agendaPoints,
    opponentAgendaPoints: input.playerView.opponent.agendaPoints,
    agendaPointsToWin: input.playerView.agendaPointsToWin,
    installCost,
    futureValueAtRisk,
    realizedValue,
    payoutStillUnrealized,
  });
}

function recurringEconomyCommitmentValue(definitionId: string): number {
  const profile = runnerNoRunRecurringEconomyProfile(definitionId);
  if (!profile)
    throw new Error(
      `runner_no_run_recurring_economy_profile_missing:${definitionId}`,
    );
  return profile.turnStartCredits;
}

function hasNoRunRecurringEconomyCommitment(
  definitionId: string | undefined,
): boolean {
  return runnerNoRunRecurringEconomyProfile(definitionId) !== undefined;
}

function runnerRecurringEconomyInstalledInCurrentTurn(
  input: AiDecisionInput,
  definitionId: string,
): boolean {
  const turnSerial = input.playerView.turnSerial;
  if (turnSerial === undefined) return false;
  const events = uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  );
  return events.some(
    (event) =>
      event.turnSerial === turnSerial &&
      event.publicPayload?.actor === "runner" &&
      event.publicPayload.actionType === "install_card" &&
      event.publicPayload.cardDefinitionId === definitionId,
  );
}

function recurringEconomyRealization(
  input: AiDecisionInput,
  definitionId: string,
): { payoutCount: number; value: number } {
  const events = uniqueBy(
    [...input.playerView.publicEvents, ...input.eventTail],
    (event) => event.eventId,
  );
  let payoutCount = 0;
  let value = 0;
  for (const event of events) {
    const effects = event.publicPayload?.resolvedEffects;
    if (!Array.isArray(effects)) continue;
    for (const effect of effects) {
      const resolved = effect as Record<string, unknown>;
      if (
        resolved.sourceDefinitionId === definitionId &&
        resolved.kind === "gain_credits" &&
        resolved.reason === "start_of_turn" &&
        typeof resolved.amount === "number" &&
        resolved.amount > 0
      ) {
        payoutCount += 1;
        value += resolved.amount;
      }
    }
  }
  return { payoutCount, value: Math.max(0, Math.floor(value)) };
}

function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}
