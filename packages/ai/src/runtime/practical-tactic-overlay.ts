import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";

// Opt-in comparator/benchmark overlay only. It may report a practical tactic
// candidate, but it must not replace the normal Semantic Runtime action.
type PracticalTacticCandidate = {
  action: LegalAction;
  reasonCode: string;
  explanation: string;
  priority: number;
  evidence: string[];
};

export function applyPracticalTacticOverlay(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
  options: AiDecisionRuntimeOptions,
): AiDecision {
  if (options.practicalTacticOverlay?.enabled !== true) return runtimeDecision;
  const candidate = bestPracticalTacticCandidate(input, runtimeDecision);
  if (!candidate) return runtimeDecision;
  return {
    ...runtimeDecision,
    evidence: [
      ...(runtimeDecision.evidence ?? []),
      ...candidate.evidence,
      "practical_tactic_overlay_compare:true",
      "practical_tactic_overlay_actual_override:false",
      `practical_tactic_overlay_candidate:${candidate.reasonCode}`,
      `practical_tactic_runtime_reference:${runtimeDecision.actionId}`,
    ],
    decisionDebug: {
      ...(runtimeDecision.decisionDebug ?? {
        schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
        aiLevel: 1,
        fallbackUsed: runtimeDecision.fallbackUsed,
      }),
      detailSections: [
        ...(runtimeDecision.decisionDebug?.detailSections ?? []),
        {
          id: "practical_tactic_overlay",
          title: "Practical Tactic Overlay",
          items: [
            `candidate:${candidate.action.actionId}`,
            `priority:${candidate.priority}`,
            `runtime_reference:${runtimeDecision.actionId}`,
            "actual_override:false",
          ],
        },
      ],
    },
  };
}

function bestPracticalTacticCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalTacticCandidate | undefined {
  const candidates = [
    runnerStealAgendaCandidate(input),
    corpSafeScoreCandidate(input),
    runnerTrashValueCandidate(input),
    runnerOpenAccessCardCandidate(input),
    runnerInstallCoverageCandidate(input),
    corpRealPunishCandidate(input),
    corpAbandonStalePunishCandidate(input),
    runnerContinueReachableRunCandidate(input),
    runnerHighPayoffRunCandidate(input),
    runnerAvoidStaleRunCandidate(input, runtimeDecision),
  ].filter(
    (candidate): candidate is PracticalTacticCandidate => candidate !== undefined,
  );
  return candidates.sort(
    (left, right) =>
      right.priority - left.priority ||
      left.action.actionId.localeCompare(right.action.actionId),
  )[0];
}

function runnerStealAgendaCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const action = input.legalActions.find((candidate) => candidate.type === "steal_agenda");
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.steal_agenda", 1000, [
    "practical_tactic:runner_steal_agenda",
  ]);
}

function corpSafeScoreCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "corp") return undefined;
  const action = input.legalActions.find(
    (candidate) => candidate.type === "score_agenda" && corpScoreLooksSafe(candidate),
  );
  if (!action) return undefined;
  return tacticCandidate(action, "corp.practical_tactic.safe_score", 950, [
    "practical_tactic:corp_safe_score",
  ]);
}

function runnerTrashValueCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "trash_accessed_card" &&
      actionCreditCost(candidate) <= input.playerView.own.credits,
  );
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.trash_value", 900, [
    "practical_tactic:runner_trash_value",
  ]);
}

function runnerOpenAccessCardCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const action = input.legalActions.find((candidate) => candidate.type === "access_card");
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.open_access_card", 880, [
    "practical_tactic:runner_open_access_card",
  ]);
}

function runnerInstallCoverageCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  if (!hasBlockedVisibleIcePath(input)) return undefined;
  const action = input.legalActions.find((candidate) => {
    if (candidate.type !== "install_card") return false;
    const source = visibleSourceCard(input, candidate);
    return source ? looksLikeBreaker(source) : false;
  });
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.install_coverage", 850, [
    "practical_tactic:runner_install_coverage",
  ]);
}

function corpRealPunishCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "corp" || input.playerView.opponent.tags <= 0) return undefined;
  const action = input.legalActions.find((candidate) => corpActionLooksLikePunish(candidate));
  if (!action) return undefined;
  return tacticCandidate(action, "corp.practical_tactic.real_punish", 800, [
    "practical_tactic:corp_real_punish",
  ]);
}

function corpAbandonStalePunishCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "corp" || input.playerView.opponent.tags > 0) return undefined;
  const stalePunish = input.legalActions.find(corpActionLooksLikePunish);
  if (!stalePunish) return undefined;
  const action = input.legalActions.find(
    (candidate) =>
      candidate.actionId !== stalePunish.actionId &&
      (candidate.type === "score_agenda" || candidate.type === "advance_card"),
  );
  if (!action) return undefined;
  return tacticCandidate(action, "corp.practical_tactic.abandon_stale_punish", 760, [
    "practical_tactic:corp_abandon_stale_punish",
    `stale_punish:${stalePunish.actionId}`,
  ]);
}

function runnerContinueReachableRunCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  if (input.playerView.run?.successful !== true) return undefined;
  const action = input.legalActions.find((candidate) => candidate.type === "continue_run");
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.continue_reachable_run", 740, [
    "practical_tactic:runner_continue_reachable_run",
  ]);
}

function runnerHighPayoffRunCandidate(
  input: AiDecisionInput,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "start_run" &&
      candidate.payload?.knownNoCurrentPayoff !== true &&
      runnerRunLooksHighPayoff(candidate),
  );
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.high_payoff_run", 720, [
    "practical_tactic:runner_high_payoff_run",
  ]);
}

function runnerAvoidStaleRunCandidate(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
): PracticalTacticCandidate | undefined {
  if (input.side !== "runner") return undefined;
  const runtimeAction = input.legalActions.find(
    (action) => action.actionId === runtimeDecision.actionId,
  );
  const staleRun = input.legalActions.find(
    (action) =>
      action.type === "start_run" &&
      action.payload?.knownNoCurrentPayoff === true,
  );
  if (!staleRun || runtimeAction?.actionId !== staleRun.actionId) return undefined;
  const action = input.legalActions.find(
    (candidate) =>
      candidate.actionId !== staleRun.actionId &&
      (candidate.type === "install_card" || candidate.type === "draw_card"),
  );
  if (!action) return undefined;
  return tacticCandidate(action, "runner.practical_tactic.avoid_stale_run", 700, [
    "practical_tactic:runner_avoid_stale_run",
    `stale_run:${staleRun.actionId}`,
  ]);
}

function tacticCandidate(
  action: LegalAction,
  reasonCode: string,
  priority: number,
  evidence: string[],
): PracticalTacticCandidate {
  return {
    action,
    reasonCode,
    priority,
    explanation: "Ein begrenzter praktischer Taktik-Entscheider wählt diese legale Aktion.",
    evidence,
  };
}

function hasBlockedVisibleIcePath(input: AiDecisionInput): boolean {
  return input.playerView.servers.some((server) =>
    server.ice.some(
      (ice) =>
        ice.known &&
        ice.rezzed === true &&
        visibleIceTokensShowBlocker(cardTokens(ice)),
    ),
  );
}

function visibleSourceCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const source = String(action.source ?? "");
  return [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.heapOrArchives,
  ].find(
    (card) =>
      card.known &&
      (card.instanceId === source ||
        (card.definitionId !== undefined && card.definitionId === source)),
  );
}

function looksLikeBreaker(card: VisibleCard): boolean {
  return cardTokensShowBreaker(cardTokens(card));
}

function corpActionLooksLikePunish(action: LegalAction): boolean {
  return action.payload?.tagPunishAction === true;
}

function corpScoreLooksSafe(action: LegalAction): boolean {
  return (
    action.payload?.safeScoreWindow === true ||
    action.payload?.protectedRemoteReady === true
  );
}

function runnerRunLooksHighPayoff(action: LegalAction): boolean {
  return payoffTokensShowHighValue(
    textTokens([action.payload?.accessPayoff]),
  );
}

function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function cardTokens(card: VisibleCard): string[] {
  return textTokens([
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ]);
}

function textTokens(values: readonly unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    );
}

function visibleIceTokensShowBlocker(tokens: readonly string[]): boolean {
  return (
    tokensIncludeAny(tokens, ["barrier", "wall", "codegate", "sentry"]) ||
    tokensIncludePhrase(tokens, ["code", "gate"])
  );
}

function cardTokensShowBreaker(tokens: readonly string[]): boolean {
  return (
    tokensIncludeAny(tokens, [
      "breaker",
      "icebreaker",
      "fracter",
      "decoder",
      "killer",
    ]) || tokensIncludePhrase(tokens, ["ice", "breaker"])
  );
}

function payoffTokensShowHighValue(tokens: readonly string[]): boolean {
  return (
    tokensIncludeAny(tokens, ["agenda", "fresh"]) ||
    tokensIncludePhrase(tokens, ["score", "threat"]) ||
    tokensIncludePhrase(tokens, ["trash", "affordable"]) ||
    tokensIncludePhrase(tokens, ["access", "bonus"])
  );
}

function tokensIncludeAny(
  tokens: readonly string[],
  accepted: readonly string[],
): boolean {
  const acceptedSet = new Set(accepted);
  return tokens.some((token) => acceptedSet.has(token));
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((token, index) =>
    phrase.every((phraseToken, offset) => tokens[index + offset] === phraseToken),
  );
}
