import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { createAiHintsByCard, type AiCardHint } from "../ai-hints";
import type {
  EvaluateRunnerRunTargetsParams,
  RunActionProjection,
  RunnerRunActionSourceKind,
  RunnerRunActionStructure,
  RunnerRunTargetKind,
} from "../runner-run-target-evaluation";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type InternalRunActionProjection = RunActionProjection & {
  action: LegalAction;
};

export function projectRunnerRunActions(
  params: EvaluateRunnerRunTargetsParams,
): RunActionProjection[] {
  return projectInternalRunnerRunActions(params).map((projection) =>
    publicRunActionProjection(projection),
  );
}

export function projectInternalRunnerRunActions(
  params: EvaluateRunnerRunTargetsParams,
): InternalRunActionProjection[] {
  const candidatesByActionId = new Map(
    (params.actionCandidates ?? []).map((candidate) => [
      candidate.actionId,
      candidate,
    ]),
  );
  const projections: InternalRunActionProjection[] = [];
  for (const action of params.input.legalActions) {
    if (action.side !== "runner") continue;
    const candidate = candidatesByActionId.get(action.actionId);
    const sourceCardId = sourceCardIdForRunAction(
      params.input,
      action,
      candidate,
    );
    const hint = sourceCardId ? AI_HINTS_BY_CARD.get(sourceCardId) : undefined;
    const signals = runActionSignals(action, candidate, hint);
    if (!runActionRelevant(action, signals)) continue;
    const sourceKind = runActionSourceKind(
      params.input,
      action,
      candidate,
      sourceCardId,
      hint,
    );
    const structure = runActionStructure(action, signals);
    const targetServerIds = targetServerIdsForRunAction(
      params.input,
      action,
      candidate,
      signals,
    );
    const spendLimit = runSpendLimitForAction(action);
    const baseProjection = {
      action,
      actionId: action.actionId,
      actionType: action.type,
      sourceKind,
      ...(sourceCardId ? { sourceCardId } : {}),
      structure,
      accessPayoffSignals: accessPayoffSignalsForRunAction(
        action,
        candidate,
        hint,
        signals,
      ),
      constraintSignals: constraintSignalsForRunAction(action, candidate, signals),
      riskSignals: riskSignalsForRunAction(candidate, hint),
      ...(spendLimit !== undefined ? { spendLimit } : {}),
      noNoisyBreakers: noNoisyBreakersForRunAction(action, signals),
      bypassFirstIce: bypassFirstIceForRunAction(action, signals),
    } satisfies Omit<
      InternalRunActionProjection,
      "targetServerId" | "targetKind" | "projectionStatus" | "evidence"
    >;
    const baseEvidence = runActionProjectionEvidence(baseProjection);
    if (targetServerIds.length === 0) {
      projections.push({
        ...baseProjection,
        projectionStatus: "missing_target_options",
        evidence: [
          ...baseEvidence,
          "run_action_projection_missing_target_options:true",
        ],
      });
      continue;
    }
    for (const targetServerId of targetServerIds) {
      const targetKind = targetKindForServerId(targetServerId);
      if (!targetKind) continue;
      const accessServerId = accessServerIdForRunAction(
        action,
        signals,
        targetServerId,
      );
      const accessKind = accessServerId
        ? targetKindForServerId(accessServerId)
        : undefined;
      const accessOverride =
        accessServerId !== undefined &&
        accessKind !== undefined &&
        accessServerId !== targetServerId
          ? { serverId: accessServerId, kind: accessKind }
          : undefined;
      projections.push({
        ...baseProjection,
        targetServerId,
        targetKind,
        ...(accessOverride ? { accessServerId: accessOverride.serverId } : {}),
        projectionStatus: "concrete_target",
        evidence: [
          ...baseEvidence,
          `run_action_projection_target:${targetServerId}`,
          `run_action_projection_target_kind:${targetKind}`,
          ...(accessOverride
            ? [
                `run_action_projection_access_server:${accessOverride.serverId}`,
                `run_action_projection_access_target_kind:${accessOverride.kind}`,
              ]
            : []),
        ],
      });
    }
  }
  return dedupeRunActionProjections(projections);
}

export function publicRunActionProjection(
  projection: InternalRunActionProjection,
): RunActionProjection {
  const { action: _action, ...publicProjection } = projection;
  return publicProjection;
}

function dedupeRunActionProjections(
  projections: readonly InternalRunActionProjection[],
): InternalRunActionProjection[] {
  const byKey = new Map<string, InternalRunActionProjection>();
  for (const projection of projections) {
    const key = [
      projection.actionId,
      projection.targetServerId ?? "missing",
      projection.accessServerId ?? projection.targetServerId ?? "missing",
    ].join(":");
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, projection);
      continue;
    }
    byKey.set(key, {
      ...existing,
      evidence: uniqueStrings([...existing.evidence, ...projection.evidence]),
      accessPayoffSignals: uniqueStrings([
        ...existing.accessPayoffSignals,
        ...projection.accessPayoffSignals,
      ]),
      constraintSignals: uniqueStrings([
        ...existing.constraintSignals,
        ...projection.constraintSignals,
      ]),
      riskSignals: uniqueStrings([
        ...existing.riskSignals,
        ...projection.riskSignals,
      ]),
    });
  }
  return [...byKey.values()];
}

function runActionProjectionEvidence(
  projection: Omit<
    InternalRunActionProjection,
    "targetServerId" | "targetKind" | "projectionStatus" | "evidence"
  >,
): string[] {
  return [
    "run_action_projection:side_safe",
    `run_action_projection_action_type:${projection.actionType}`,
    `run_action_projection_source_kind:${projection.sourceKind}`,
    `run_action_projection_structure:${projection.structure}`,
    ...(projection.sourceCardId
      ? [`run_action_projection_source_card:${projection.sourceCardId}`]
      : []),
    ...(projection.spendLimit !== undefined
      ? [`run_action_projection_spend_limit:${projection.spendLimit}`]
      : []),
    `run_action_projection_no_noisy_breakers:${projection.noNoisyBreakers}`,
    `run_action_projection_bypass_first_ice:${projection.bypassFirstIce}`,
    ...projection.accessPayoffSignals
      .slice(0, 8)
      .map((signal) => `run_action_projection_access_signal:${signal}`),
    ...projection.constraintSignals
      .slice(0, 6)
      .map((signal) => `run_action_projection_constraint:${signal}`),
    ...projection.riskSignals
      .slice(0, 4)
      .map((signal) => `run_action_projection_risk:${signal}`),
  ];
}

function runActionRelevant(action: LegalAction, signals: readonly string[]): boolean {
  if (action.type === "start_run") return true;
  const text = runActionSearchText(action, signals);
  if (runActionHasStructuredSignal(signals, ["path blocked", "path_blocked"]))
    return false;
  const explicitRunSignals = runActionHasStructuredSignal(signals, [
    "start_run",
    "make_run",
    "make a run",
    "bonus_run",
    "followup_run",
    "follow-up run",
    "multi_run_sequence",
    "run_event",
    "run_action",
    "extra_run",
    "gain_run_only_action",
    "server_specific_hq",
    "server_specific_rnd",
    "server_specific_rd",
    "server_specific_archives",
    "server_specific_remote",
    "future_run_effect",
  ]);
  if (concretePayloadServerId(action) && explicitRunSignals) return true;
  if (explicitRunSignals) return true;
  if (
    runActionHasStructuredSignal(signals, ["run"]) &&
    runActionHasStructuredSignal(signals, [
      "scope:archives",
      "scope:hq",
      "scope:rd",
      "scope:rnd",
      "scope:remote",
      "target:hq_via_archives",
    ])
  ) {
    return true;
  }
  return (
    runActionHasStructuredSignal(signals, ["run_pressure"]) &&
    runActionHasBoundedSignalTerm(signals, [
      "multiaccess",
      "access_replacement",
    ])
  );
}

function runActionHasStructuredSignal(
  signals: readonly string[],
  needles: readonly string[],
): boolean {
  const normalizedNeedles = new Set(
    needles.map((needle) => needle.toLocaleLowerCase("en-US")),
  );
  return signals.some((signal) =>
    normalizedNeedles.has(signal.toLocaleLowerCase("en-US")),
  );
}

function runActionHasBoundedSignalTerm(
  signals: readonly string[],
  terms: readonly string[],
): boolean {
  return signals.some((signal) =>
    terms.some((term) => runActionSignalHasTerm(signal, term)),
  );
}

function runActionSignalHasTerm(signal: string, term: string): boolean {
  const normalizedTerm = term.toLocaleLowerCase("en-US");
  const tokens = signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const termTokens = normalizedTerm
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (termTokens.length <= 1) {
    const tokenSet = new Set(tokens);
    return tokenSet.has(normalizedTerm);
  }
  return tokens.some((token, index) =>
    token === termTokens[0] &&
    termTokens.every(
      (termToken, offset) => tokens[index + offset] === termToken,
    ),
  );
}

function runActionSignals(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  hint: AiCardHint | undefined,
): string[] {
  const payloadSignals = payloadStringArray(action, [
    "tacticSignals",
    "actionTacticSignals",
    "cardContextSignals",
    "runActionSignals",
    "runSignals",
    "accessPayoffSignals",
  ]);
  const effectSignals = (hint?.effects ?? []).flatMap((effect) => {
    const target = effectTarget(effect);
    return uniqueStrings([
      `effect:${effect.kind}`,
      ...(effect.scope ? [`scope:${effect.scope}`] : []),
      ...(effect.timing ? [`timing:${effect.timing}`] : []),
      ...(target ? [`target:${target}`] : []),
      ...accessSignalsForHintEffect(effect),
    ]);
  });
  return uniqueStrings([
    action.type,
    action.source ?? "",
    ...payloadSignals,
    ...(candidate?.cardContextSignals ?? []),
    ...(candidate?.actionTacticSignals ?? []),
    candidate?.semanticActionType ?? "",
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...effectSignals,
  ]).filter((signal) => signal.length > 0);
}

function effectTarget(
  effect: NonNullable<AiCardHint["effects"]>[number],
): string | undefined {
  const target = (effect as Record<string, unknown>).target;
  return typeof target === "string" ? target : undefined;
}

function runActionSourceKind(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  sourceCardId: string | undefined,
  hint: AiCardHint | undefined,
): RunnerRunActionSourceKind {
  if (action.type === "start_run" && action.source === "basic_action") {
    return "basic_action";
  }
  const actionType = action.type as string;
  if (action.type === "play_event") return "event";
  if (action.type === "resolve_choice") return "choice";
  if (actionType === "extra_action") return "extra_action";
  const sourceType = sourceCardType(input, sourceCardId, candidate, hint);
  if (sourceType === "resource") return "resource_ability";
  if (sourceType === "program") return "program_ability";
  if (sourceType === "hardware") return "hardware_ability";
  if (sourceType === "identity") return "identity_ability";
  if (candidate?.sourceKind === "card") return "card_ability";
  if (action.type === "trigger_ability") return "card_ability";
  return "unknown";
}

function runActionStructure(
  action: LegalAction,
  signals: readonly string[],
): RunnerRunActionStructure {
  if (action.type === "start_run") return "direct_start_run";
  if (runActionHasStructuredSignal(signals, ["multi_run_sequence"]))
    return "multi_run_sequence";
  if (
    runActionHasStructuredSignal(signals, ["followup_run", "follow-up run"])
  ) {
    return "followup_run";
  }
  if (
    booleanPayloadValue(action, "bonusRunNoClick") ||
    runActionHasStructuredSignal(signals, ["bonus_run"])
  ) {
    return "bonus_run";
  }
  if (
    runActionHasStructuredSignal(signals, [
      "gain_run_only_action",
      "extra_run",
      "extra action",
    ])
  ) {
    return "extra_run";
  }
  if (action.type === "play_event") return "event_run";
  if (action.type === "resolve_choice") return "target_choice";
  return "run_enabler";
}

function runActionSearchText(
  action: LegalAction,
  signals: readonly string[],
): string {
  return `${action.type} ${payloadSearchText(action)} ${signals.join(" ")}`.toLowerCase();
}

function targetServerIdsForRunAction(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  signals: readonly string[],
): string[] {
  const directTargets = [
    candidate?.runProjectionSummary?.serverId,
    concretePayloadServerId(action),
    ...payloadStringValues(action, [
      "targetServerId",
      "runServerId",
      "attackedServerId",
      "selectedServerId",
      "server",
    ]),
    ...candidateServerTargets(candidate),
  ];
  const targetIds = directTargets
    .map((targetId) => normalizeServerId(targetId))
    .filter((targetId): targetId is string => targetId !== undefined);
  const signalTargets = targetServerIdsFromSignals(input, signals);
  let resolvedTargets = uniqueStrings([...targetIds, ...signalTargets]);
  if (
    targetIds.length === 0 &&
    resolvedTargets.includes("archives") &&
    runActionHasStructuredSignal(signals, [
      "target:hq_via_archives",
      "access.hq_via_archives",
      "hq_via_archives",
    ])
  ) {
    resolvedTargets = resolvedTargets.filter((targetId) => targetId !== "hq");
  }
  return resolvedTargets.filter(
    (targetId) => targetKindForServerId(targetId) !== undefined,
  );
}

function accessServerIdForRunAction(
  action: LegalAction,
  signals: readonly string[],
  targetServerId: string,
): string | undefined {
  const direct = payloadStringValues(action, [
    "accessServerId",
    "accessServerOverride",
    "effectiveAccessServerId",
    "breachServerId",
  ])
    .map((value) => normalizeServerId(value))
    .find((value): value is string => value !== undefined);
  if (direct) return direct;

  if (
    targetServerId === "archives" &&
    runActionHasStructuredSignal(signals, [
      "target:hq_via_archives",
      "access.hq_via_archives",
      "hq_via_archives",
    ])
  ) {
    return "hq";
  }
  return undefined;
}

function concretePayloadServerId(action: LegalAction): string | undefined {
  return normalizeServerId(actionServerId(action));
}

function targetKindForServerId(serverId: string): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function candidateServerTargets(
  candidate: ActionSemanticCandidate | undefined,
): string[] {
  if (!candidate?.targetContext) return [];
  const selectedTargets = candidate.targetContext.selectedTargets
    .filter((target) => target.targetKind === "server")
    .map((target) => target.targetId);
  const availableTargets = (candidate.targetContext.availableTargets ?? [])
    .filter((target) => target.targetKind === "server")
    .map((target) => target.targetId);
  return [...selectedTargets, ...availableTargets];
}

function targetServerIdsFromSignals(
  input: AiDecisionInput,
  signals: readonly string[],
): string[] {
  const tokens = signals.map((signal) => signal.toLowerCase());
  const tokenSet = new Set(tokens);
  const targetIds: string[] = [];
  if (
    signalTokensInclude(tokens, "server_specific_hq") ||
    tokenSet.has("scope:hq")
  ) {
    targetIds.push("hq");
  }
  if (
    signalTokensInclude(tokens, "server_specific_rnd") ||
    signalTokensInclude(tokens, "server_specific_rd") ||
    tokenSet.has("scope:rnd") ||
    tokenSet.has("scope:rd")
  ) {
    targetIds.push("rd");
  }
  if (
    signalTokensInclude(tokens, "server_specific_archives") ||
    tokenSet.has("scope:archives")
  ) {
    targetIds.push("archives");
  }
  if (
    signalTokensInclude(tokens, "server_specific_remote") ||
    tokenSet.has("scope:remote")
  ) {
    const remoteServers = input.playerView.servers.filter((server) =>
      server.id.startsWith("remote_"),
    );
    const remoteServer = remoteServers[0];
    if (remoteServers.length === 1 && remoteServer) {
      targetIds.push(remoteServer.id);
    }
  }
  return uniqueStrings(targetIds);
}

function signalTokensInclude(tokens: readonly string[], value: string): boolean {
  return tokens.some(
    (token) =>
      token === value ||
      token === `target:${value}` ||
      token === `run.${value}`,
  );
}

function normalizeServerId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase().replace(/^server[:.]/, "");
  if (trimmed === "hq") return "hq";
  if (trimmed === "rd") return "rd";
  if (trimmed === "archives") return "archives";
  if (trimmed.startsWith("remote_")) return trimmed;
  return undefined;
}

function sourceCardIdForRunAction(
  input: AiDecisionInput,
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
): string | undefined {
  for (const id of payloadStringValues(action, [
    "sourceDefinitionId",
    "sourceCardDefinitionId",
    "cardDefinitionId",
    "definitionId",
    "sourceId",
    "cardId",
  ])) {
    if (AI_HINTS_BY_CARD.has(id)) return id;
  }
  if (candidate?.sourceCardId && AI_HINTS_BY_CARD.has(candidate.sourceCardId)) {
    return candidate.sourceCardId;
  }
  for (const id of payloadStringValues(action, [
    "sourceCardInstanceId",
    "sourceInstanceId",
    "cardInstanceId",
    "instanceId",
    "sourceCardId",
    "cardId",
  ])) {
    const card = visibleOwnCardById(input, id);
    if (card?.definitionId) return card.definitionId;
  }
  if (candidate?.sourceCardId) {
    const card = visibleOwnCardById(input, candidate.sourceCardId);
    if (card?.definitionId) return card.definitionId;
  }
  if (typeof action.source === "string") {
    if (AI_HINTS_BY_CARD.has(action.source)) return action.source;
    const sourceCard = visibleOwnCardById(input, action.source);
    if (sourceCard?.definitionId) return sourceCard.definitionId;
  }
  return undefined;
}

function visibleOwnCardById(
  input: AiDecisionInput,
  id: string,
): VisibleOwnCardLike | undefined {
  return visibleOwnCards(input).find(
    (card) => card.instanceId === id || card.definitionId === id,
  );
}

type VisibleOwnCardLike = {
  instanceId?: string;
  definitionId?: string;
  type?: string;
  known?: boolean;
};

function visibleOwnCards(input: AiDecisionInput): VisibleOwnCardLike[] {
  return [
    input.playerView.own.identity,
    ...(input.playerView.own.rig ?? []),
    ...(input.playerView.own.gripOrHq ?? []),
    ...(input.playerView.own.heapOrArchives ?? []),
    ...(input.playerView.own.scoreArea ?? []),
  ].filter((card) => card.known !== false);
}

function sourceCardType(
  input: AiDecisionInput,
  sourceCardId: string | undefined,
  candidate: ActionSemanticCandidate | undefined,
  hint: AiCardHint | undefined,
): string | undefined {
  if (hint?.cardType) return hint.cardType;
  if (!sourceCardId) return undefined;
  const visible = visibleOwnCardById(input, sourceCardId);
  if (visible?.type) return visible.type;
  return candidate?.sourceKind === "card" ? "card" : undefined;
}

function accessPayoffSignalsForRunAction(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  hint: AiCardHint | undefined,
  signals: readonly string[],
): string[] {
  const directSignals = payloadStringArray(action, [
    "accessPayoffSignals",
    "runPayoffSignals",
    "payoffSignals",
  ]);
  const semanticSignals = signals.filter(signalShowsRunAccessPayoff);
  const candidateSignals = [
    ...(candidate?.cardContextSignals ?? []),
    ...(candidate?.actionTacticSignals ?? []),
  ].filter(signalShowsRunAccessPayoff);
  const effectSignals = (hint?.effects ?? []).flatMap(accessSignalsForHintEffect);
  return uniqueStrings([
    ...directSignals,
    ...semanticSignals,
    ...candidateSignals,
    ...effectSignals,
  ]);
}

function accessSignalsForHintEffect(
  effect: NonNullable<AiCardHint["effects"]>[number],
): string[] {
  const target = effectTarget(effect);
  if (effect.kind === "multiaccess") {
    if (effect.scope === "hq") return ["access.hq_multiaccess"];
    if (effect.scope === "rnd") return ["access.rnd_multiaccess"];
    if (effect.scope === "archives") return ["access.archives_multiaccess"];
    if (effect.scope === "remote") return ["access.remote_multiaccess"];
    return ["access.multiaccess"];
  }
  if (effect.kind === "access_replacement") {
    if (target === "hq_via_archives") {
      return ["access.replacement", "access.hq_via_archives"];
    }
    return ["access.replacement"];
  }
  if (effect.kind === "hq_info") return ["access.hq_info"];
  if (effect.kind === "topdeck_info") return ["access.rnd_topdeck_info"];
  if (
    effect.kind === "persistent_counter_effect" &&
    (effect.timing === "on_access" || effect.timing === "successful_run") &&
    (target === "free_trash" ||
      target === "trash_untrashable" ||
      target === "access_trash_pressure")
  ) {
    return ["access.free_trash"];
  }
  if (effect.kind === "future_run_effect") return ["run.future_payoff"];
  return [];
}

function constraintSignalsForRunAction(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
  signals: readonly string[],
): string[] {
  return uniqueStrings([
    ...(runSpendLimitForAction(action) !== undefined ? ["spend_limit"] : []),
    ...(noNoisyBreakersForRunAction(action, signals) ? ["no_noisy_breakers"] : []),
    ...(bypassFirstIceForRunAction(action, signals) ? ["bypass_first_ice"] : []),
    ...(candidate?.constraints ?? []).map(
      (constraint) => `${constraint.kind}:${constraint.status}`,
    ),
  ]);
}

function signalShowsRunAccessPayoff(signal: string): boolean {
  const tokens = signalTokens(signal);
  return (
    tokensIncludeAny(tokens, [
      "access",
      "multiaccess",
      "topdeck",
      "trash",
      "bypass",
    ]) ||
    tokensIncludePhrase(tokens, ["hq", "info"]) ||
    tokensIncludePhrase(tokens, ["free", "trash"])
  );
}

function signalTokens(signal: string): string[] {
  return signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
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

function riskSignalsForRunAction(
  candidate: ActionSemanticCandidate | undefined,
  hint: AiCardHint | undefined,
): string[] {
  const riskTags = (hint as { riskTags?: string[] } | undefined)?.riskTags ?? [];
  return uniqueStrings([
    ...riskTags,
    ...(candidate?.risks ?? []).map((risk) => `${risk.kind}:${risk.severity}`),
  ]);
}

function runSpendLimitForAction(action: LegalAction): number | undefined {
  return numberPayloadValue(action, [
    "runSpendingCap",
    "runSpendLimit",
    "spendingCap",
    "runCreditLimit",
  ]);
}

function noNoisyBreakersForRunAction(
  action: LegalAction,
  signals: readonly string[],
): boolean {
  if (booleanPayloadValue(action, "noNoisyBreakers")) return true;
  return runActionHasBoundedSignalTerm(signals, [
    "no_noisy",
    "no noisy",
    "noisy_breaker_restriction",
  ]);
}

function bypassFirstIceForRunAction(
  action: LegalAction,
  signals: readonly string[],
): boolean {
  if (booleanPayloadValue(action, "bypassFirstIce")) return true;
  return runActionHasStructuredSignal(signals, [
    "bypass_first_ice",
    "bypass first ice",
    "inside_job",
  ]);
}


function payloadRecord(action: LegalAction): Record<string, unknown> {
  return action.payload ?? {};
}

function payloadStringValues(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  const payload = payloadRecord(action);
  return keys.flatMap((key) => {
    const value = payload[key];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  });
}

function payloadStringArray(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  return payloadStringValues(action, keys).map((value) =>
    value.trim().toLowerCase(),
  );
}

function payloadSearchText(action: LegalAction): string {
  const payload = payloadRecord(action);
  return Object.values(payload)
    .flatMap((value) => {
      if (typeof value === "string") return [value];
      if (typeof value === "number" || typeof value === "boolean") {
        return [String(value)];
      }
      if (Array.isArray(value)) {
        return value
          .filter((entry) => typeof entry === "string" || typeof entry === "number")
          .map(String);
      }
      return [];
    })
    .join(" ")
    .toLowerCase();
}

function booleanPayloadValue(action: LegalAction, key: string): boolean {
  return payloadRecord(action)[key] === true;
}

function numberPayloadValue(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = payloadRecord(action)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
