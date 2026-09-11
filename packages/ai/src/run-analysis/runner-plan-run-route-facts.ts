import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunRiskContractSignal,
} from "../plans/runner-tactical-plan-contracts";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
export function accessCommitmentForEvaluation(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): RunnerRunAccessCommitmentSignal {
  const facts = evaluation.accessFacts;
  if (
    !facts ||
    !Array.isArray(facts.knownTargetDefinitionIds) ||
    !facts.knownTargetDefinitionIds.every(
      (id) => typeof id === "string" && id.length > 0,
    ) ||
    !(
      facts.trashBudget === "unknown" ||
      facts.trashBudget === "not_applicable" ||
      (typeof facts.trashBudget === "number" &&
        Number.isFinite(facts.trashBudget) &&
        facts.trashBudget >= 0)
    ) ||
    (evaluation.accessPayoff === "trash_affordable" &&
      (typeof facts.trashBudget !== "number" ||
        facts.knownTargetDefinitionIds.length === 0))
  ) {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [evaluation.actionId],
      owner: "plan_module",
      removalCondition:
        "Runner access payoff must publish typed target identities and a known nonnegative general-credit budget before binding a trash commitment.",
    });
  }
  const intendedAction =
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat"
      ? "steal"
      : evaluation.accessPayoff === "trash_affordable"
        ? "trash"
        : evaluation.accessPayoff === "trash_unaffordable" ||
            evaluation.accessPayoff === "known_low_value"
          ? "decline"
          : "access";
  return {
    payoff: evaluation.accessPayoff,
    intendedAction,
    knownTargetDefinitionIds: [
      ...new Set(facts.knownTargetDefinitionIds),
    ].sort(),
    trashBudget: facts.trashBudget,
    evidenceCode: `access_payoff:${evaluation.accessPayoff}`,
  };
}

export function runRiskContractForEvaluation(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): RunnerRunRiskContractSignal | undefined {
  const reserveQuote = evaluation.prerunReserveQuote;
  if (!reserveQuote) return undefined;
  return {
    schemaVersion: "runner-run-risk-contract-v1",
    serverId: evaluation.targetServerId,
    observedAtStateVersion: input.playerView.stateVersion,
    runCommitment: evaluation.runCommitment,
    unrezzedIceRisk: Math.max(0, evaluation.unrezzedIceRisk ?? 0),
    runnerCreditsAtEntry: Math.max(0, input.playerView.own.credits),
    runnerHandCountAtEntry: input.playerView.own.gripOrHq.length,
    visibleDuringRunRezSupport: evaluation.visibleDuringRunRezSupport === true,
    reserveQuote: structuredClone(reserveQuote),
    evidenceCodes: [
      "runner_run_risk_contract_bound",
      `runner_run_risk_contract_server:${evaluation.targetServerId}`,
      `runner_run_risk_contract_commitment:${evaluation.runCommitment}`,
      `runner_run_risk_contract_reserve_status:${reserveQuote.status}`,
    ],
  };
}

export function planSafeRunExclusionEvidence(
  evidence: readonly string[],
): string[] {
  const allowedPrefixes = [
    "access_payoff:",
    "known_access_state:",
    "path:",
    "recommendation:",
    "visible_ice_hazard:",
    "visible_ice_trace_base:",
    "visible_trace_",
    "unavoidable_visible_ice_hazard_count:",
    "hq_run_suppressed_",
    "rd_run_suppressed_",
    "prerun_reserve_",
    "semantic_excluded:",
  ];
  return evidence.filter((entry) =>
    allowedPrefixes.some((prefix) => entry.startsWith(prefix)),
  );
}

function witnessedRunRouteExists(
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): boolean {
  const serverEvaluations = evaluations.filter(
    (evaluation) => evaluation.targetServerId === serverId,
  );
  if (serverEvaluations.length > 0) {
    return serverEvaluations.some(
      (evaluation) => evaluation.pathPassability === "reachable",
    );
  }
  return candidates.some(
    (candidate) =>
      candidate.semanticActionType === "run.start" &&
      candidate.runProjectionSummary?.serverId === serverId,
  );
}

export function witnessedRunActionIds(
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): string[] {
  const serverEvaluations = evaluations.filter(
    (evaluation) => evaluation.targetServerId === serverId,
  );
  if (serverEvaluations.length > 0) {
    return serverEvaluations
      .filter(
        (evaluation) =>
          evaluation.pathPassability === "reachable" &&
          (evaluation.recommendation === "run_now" ||
            evaluation.recommendation === "run_if_free") &&
          evaluation.score > 0 &&
          evaluation.knownAccessState !== "known_no_current_payoff",
      )
      .map((evaluation) => evaluation.actionId);
  }
  return candidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "run.start" &&
        candidate.runProjectionSummary?.serverId === serverId,
    )
    .map((candidate) => candidate.actionId);
}

export function witnessedReachableRunActionIds(
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): string[] {
  const candidateActionIds = new Set(
    candidates
      .filter(
        (candidate) =>
          candidate.runProjectionSummary?.serverId === serverId &&
          (candidate.semanticActionType === "run.start" ||
            candidate.semanticActionType === "play.runner_event"),
      )
      .map((candidate) => candidate.actionId),
  );
  return evaluations
    .filter(
      (evaluation) =>
        evaluation.targetServerId === serverId &&
        evaluation.pathPassability === "reachable" &&
        candidateActionIds.has(evaluation.actionId),
    )
    .map((evaluation) => evaluation.actionId);
}

export function witnessedKnownAgendaRunEvaluations(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluations: readonly RunnerRunTargetEvaluation[],
  serverId: string,
): RunnerRunTargetEvaluation[] {
  return evaluations
    .filter((evaluation) =>
      runnerKnownAgendaRunEvaluationIsCertified(
        input,
        candidates,
        evaluation,
        serverId,
      ),
    )
    .sort((left, right) => left.actionId.localeCompare(right.actionId));
}

export function runnerKnownAgendaRunEvaluationIsCertified(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  serverId: string,
): boolean {
  const candidate = candidates.find(
    (entry) =>
      entry.actionId === evaluation.actionId &&
      entry.runProjectionSummary?.serverId === serverId &&
      (entry.semanticActionType === "run.start" ||
        entry.semanticActionType === "play.runner_event"),
  );
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  const exactVisibleIceQuotes =
    server !== undefined &&
    server.ice.every(
      (ice) =>
        ice.known !== false &&
        ice.rezzed === true &&
        ice.effectiveRunQuote !== undefined &&
        ice.effectiveRunQuote.iceInstanceId === ice.instanceId &&
        Number.isFinite(ice.effectiveRunQuote.effectiveStrength),
    );
  const quote = evaluation.routeQuote;
  return (
    candidate !== undefined &&
    exactVisibleIceQuotes &&
    evaluation.targetServerId === serverId &&
    evaluation.accessServerId === serverId &&
    evaluation.targetKind === "remote" &&
    evaluation.accessTargetKind === "remote" &&
    evaluation.accessPayoff === "agenda" &&
    evaluation.knownAccessState === "known_payoff" &&
    evaluation.pathPassability === "reachable" &&
    (evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free") &&
    quote !== undefined &&
    quote.reachability === "guaranteed_access" &&
    Number.isFinite(quote.knownCost) &&
    Number.isFinite(quote.guaranteedKnownCost) &&
    Number.isFinite(quote.availableCredits) &&
    Number.isFinite(quote.fundingGap) &&
    quote.fundingGap === 0 &&
    quote.unknownIceCount === 0 &&
    Number.isFinite(evaluation.creditsAfterRun) &&
    evaluation.creditsAfterRun >= 0
  );
}

export function sourceDefinitionForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
  candidates: readonly ActionSemanticCandidate[],
): string | undefined {
  return candidates.find(
    (candidate) => candidate.actionId === evaluation.actionId,
  )?.sourceDefinitionId;
}
