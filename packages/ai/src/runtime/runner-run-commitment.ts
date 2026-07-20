import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { actionCreditCost } from "./action-cost";
import type {
  RunnerRunCommitment,
  RunnerRunDecisionFingerprint,
  RunnerRunPathQuote,
  RunnerRunPlan,
} from "./runner-run-plan-types";

export function createRunnerRunCommitment(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  selectedAction: LegalAction;
  evaluation?: RunnerRunTargetEvaluation;
}): RunnerRunCommitment {
  const route = routeCommitment(params.plan.pathQuote, params.evaluation);
  const runnerAgendaPoints = visibleAgendaPoints(params.input, "runner");
  const agendaPointsToWin = Math.max(
    1,
    Math.floor(params.input.playerView.agendaPointsToWin),
  );
  const pointsNeeded = Math.max(0, agendaPointsToWin - runnerAgendaPoints);
  const accessReserve = Math.max(
    0,
    params.plan.accessIntent?.reserveForStealOrTrash ?? 0,
    params.plan.reserve.preserveStealOrTrashCredits,
    params.plan.budget.reservedCreditsForSteal,
    params.plan.budget.reservedCreditsForTrash,
  );
  const acceptedRisks =
    route.reachability === "conditional_access"
      ? route.conditionalReasons.map((reason) => `conditional:${reason}`)
      : [];
  const commitment: Omit<RunnerRunCommitment, "decisionFingerprint"> = {
    targetServer: params.plan.targetServer.id,
    goal: params.plan.objective.kind,
    route,
    costs: {
      runAction: actionCreditCost(params.selectedAction),
      path: route.guaranteedKnownCost,
      access: accessReserve,
    },
    reserves: {
      creditsAfterRun: Math.max(
        0,
        params.plan.reserve.minimumCreditsAfterRun,
        params.plan.budget.reservedCreditsAfterRun,
      ),
      gripAfterRun: Math.max(
        0,
        params.plan.reserve.minimumGripAfterRun,
        params.plan.budget.damageSafetyReserve.minimumGripAfterRun,
      ),
      stealOrTrash: accessReserve,
    },
    acceptedRisks,
    expectedUtility: Math.max(0, params.evaluation?.score ?? 0),
    terminalConditions: {
      runnerAgendaPoints,
      agendaPointsToWin,
      pointsNeeded,
      objectiveCanEndGame:
        pointsNeeded > 0 &&
        (params.plan.objective.kind === "contest_remote_agenda" ||
          params.evaluation?.accessPayoff === "agenda"),
    },
    evidence: [
      `run_commitment_target:${params.plan.targetServer.id}`,
      `run_commitment_goal:${params.plan.objective.kind}`,
      `run_commitment_route:${route.reachability}`,
      `run_commitment_path_cost:${route.guaranteedKnownCost}`,
      `run_commitment_access_cost:${accessReserve}`,
      `run_commitment_unknown_ice:${route.unknownIceCount}`,
      ...acceptedRisks.map((risk) => `run_commitment_risk:${risk}`),
    ],
  };
  return {
    ...commitment,
    decisionFingerprint: createRunnerRunDecisionFingerprint(
      params.input,
      params.plan,
    ),
  };
}

export function rebaseRunnerRunCommitment(params: {
  input: AiDecisionInput;
  plan: RunnerRunPlan;
  pathQuote: RunnerRunPathQuote;
}): RunnerRunCommitment | undefined {
  const previous = params.plan.commitment;
  if (!previous) return undefined;
  const route = routeCommitment(params.pathQuote);
  return {
    ...previous,
    targetServer: params.plan.targetServer.id,
    goal: params.plan.objective.kind,
    route,
    costs: {
      ...previous.costs,
      path: route.guaranteedKnownCost,
    },
    decisionFingerprint: createRunnerRunDecisionFingerprint(
      params.input,
      params.plan,
    ),
    evidence: [
      ...previous.evidence,
      `run_commitment_rebased_route:${route.reachability}`,
      `run_commitment_rebased_path_cost:${route.guaranteedKnownCost}`,
    ],
  };
}

export function createRunnerRunDecisionFingerprint(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): RunnerRunDecisionFingerprint {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === plan.targetServer.id,
  );
  const visibleFacts = {
    server: plan.targetServer.id,
    ice: (server?.ice ?? [])
      .map(sideSafeOpponentCardFingerprint)
      .sort(compareFingerprintValue),
    root: (server?.root ?? [])
      .map(sideSafeOpponentCardFingerprint)
      .sort(compareFingerprintValue),
    runner: {
      credits: normalizeNumber(input.playerView.own.credits),
      runOnlyCredits: normalizeNumber(
        input.playerView.run?.badPublicityCredits ?? 0,
      ),
      tags: normalizeNumber(input.playerView.own.tags),
      grip: (input.playerView.own.gripOrHq ?? [])
        .map(ownCardFingerprint)
        .sort(compareFingerprintValue),
      rig: (input.playerView.own.rig ?? [])
        .map(ownCardFingerprint)
        .sort(compareFingerprintValue),
      identity: ownCardFingerprint(input.playerView.own.identity),
      agendaPoints: visibleAgendaPoints(input, "runner"),
    },
    corp: {
      credits: normalizeNumber(input.playerView.opponent.credits),
      agendaPoints: visibleAgendaPoints(input, "corp"),
    },
    agendaPointsToWin: normalizeNumber(input.playerView.agendaPointsToWin),
    access: {
      goal: plan.objective.kind,
      expectedAccessCount: plan.accessIntent?.expectedAccessCount ?? 0,
      stealPolicy: plan.accessIntent?.stealAgendaPolicy ?? "none",
      trashPolicy: plan.accessIntent?.trashPolicy ?? "none",
      reserve: plan.accessIntent?.reserveForStealOrTrash ?? 0,
    },
  };
  return {
    schemaVersion: 1,
    value: `v1:${stableFingerprintHash(JSON.stringify(visibleFacts))}`,
    evidence: [
      `fingerprint_server:${plan.targetServer.id}`,
      `fingerprint_ice_count:${visibleFacts.ice.length}`,
      `fingerprint_root_count:${visibleFacts.root.length}`,
      `fingerprint_runner_credits:${visibleFacts.runner.credits}`,
      `fingerprint_corp_credits:${visibleFacts.corp.credits}`,
      `fingerprint_runner_grip:${visibleFacts.runner.grip.length}`,
      `fingerprint_runner_rig:${visibleFacts.runner.rig.length}`,
      `fingerprint_goal:${visibleFacts.access.goal}`,
      "fingerprint_excludes_state_version:true",
      "fingerprint_excludes_run_phase:true",
    ],
  };
}

function routeCommitment(
  pathQuote: RunnerRunPathQuote,
  evaluation?: RunnerRunTargetEvaluation,
): RunnerRunCommitment["route"] {
  const evaluationRoute = evaluation?.routeQuote;
  return {
    reachability:
      evaluationRoute?.reachability ??
      pathQuote.accessStatus ??
      (pathQuote.canReachAccess ? "guaranteed_access" : "no_access"),
    knownCost: evaluationRoute?.knownCost ?? pathQuote.totalKnownCost,
    guaranteedKnownCost:
      evaluationRoute?.guaranteedKnownCost ??
      pathQuote.guaranteedKnownCost ??
      pathQuote.totalKnownCost,
    unknownIceCount:
      evaluationRoute?.unknownIceCount ??
      (pathQuote.quoteStatus === "partially_known" ? 1 : 0),
    conditionalReasons:
      evaluationRoute?.conditionalReasons ?? pathQuote.conditionalReasons ?? [],
  };
}

function sideSafeOpponentCardFingerprint(card: VisibleCard): string {
  return JSON.stringify({
    instanceId: card.instanceId,
    known: card.known,
    rezzed: card.rezzed === true,
    ...(card.known
      ? {
          definitionId: card.definitionId ?? "known_without_definition",
          type: card.type ?? "unknown_type",
          strength: card.strength ?? null,
          effectiveStrength: card.effectiveRunQuote?.effectiveStrength ?? null,
          subroutineCount: card.effectiveRunQuote?.subroutines.length ?? null,
          trashCost: card.trashCost ?? null,
          advancementCounters: card.advancementCounters ?? null,
        }
      : {}),
  });
}

function ownCardFingerprint(card: VisibleCard): string {
  return JSON.stringify({
    instanceId: card.instanceId,
    definitionId: card.definitionId ?? "unknown",
    type: card.type ?? "unknown",
    strength: card.strength ?? null,
    baseLink: card.baseLink ?? null,
    counters: (card.counterDisplays ?? [])
      .map((counter) => ({
        id: counter.id,
        amount: normalizeNumber(counter.amount),
        uses: [...(counter.creditPool?.uses ?? [])].sort(),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}

function visibleAgendaPoints(
  input: AiDecisionInput,
  side: "runner" | "corp",
): number {
  const player =
    side === input.side ? input.playerView.own : input.playerView.opponent;
  const value = (player as { agendaPoints?: unknown }).agendaPoints;
  if (typeof value === "number") return normalizeNumber(value);
  return (player.scoreArea ?? []).reduce(
    (sum, card) => sum + normalizeNumber(card.agendaPoints ?? 0),
    0,
  );
}

function compareFingerprintValue(left: string, right: string): number {
  return left.localeCompare(right);
}

function normalizeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function stableFingerprintHash(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b1;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return [first, second]
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");
}
