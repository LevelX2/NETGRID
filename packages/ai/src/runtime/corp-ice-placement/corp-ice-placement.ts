import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { createAiHintsByCard, RUNTIME_CARDS } from "../../ai-hints";
import { rolesMatch } from "../role-match";

export type CorpIceCostFact =
  | {
      status: "known";
      amount: number;
      source:
        | "legal_action"
        | "candidate_projection"
        | "engine_post_install_rez_quote";
    }
  | {
      status: "unknown";
      reason:
        | "missing"
        | "incomplete"
        | "variable"
        | "non_finite"
        | "negative"
        | "non_integer"
        | "projection_drift"
        | "binding_drift"
        | "malformed"
        | "unsupported_mandatory_cost";
      source:
        | "legal_action"
        | "candidate_projection"
        | "engine_post_install_rez_quote";
    };

export type CorpIceCardFacts = {
  iceInstanceId?: string;
  iceDefinitionId?: string;
  title?: string;
  immediateStop: boolean;
  softStop: boolean;
  tax: boolean;
  damage: boolean;
  persistentDamageCounter: boolean;
  programTrash: boolean;
  multiProgramTrash: boolean;
  tagTrace: boolean;
  runLock: boolean;
  runRewind: boolean;
  nextIceModifier: boolean;
  futureIceModifier: boolean;
  outsideIceScaling: boolean;
  innerIceScaling: boolean;
  variableRez: boolean;
  modeChoice: boolean;
  mobileReposition: boolean;
  maintenanceOrBounceRisk: boolean;
  positionDependent: boolean;
  requiresOtherIceContext: boolean;
  evidence: string[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();
export function buildCorpIceCardFacts(
  card: VisibleCard | undefined,
): CorpIceCardFacts {
  const definitionId = card?.definitionId;
  const runtimeDefinition = definitionId
    ? RUNTIME_CARDS[definitionId]
    : undefined;
  const demoDefinition = definitionId
    ? (CARD_DEFINITIONS_BY_ID[definitionId] ??
      (runtimeDefinition?.engineCardId
        ? CARD_DEFINITIONS_BY_ID[runtimeDefinition.engineCardId]
        : undefined))
    : undefined;
  const hint = definitionId ? AI_HINTS_BY_CARD.get(definitionId) : undefined;
  const hintRoles = hintStringArray(hint, "roles");
  const hintPlanRoles = hintStringArray(hint, "planRoles");
  const hintRiskTags = hintStringArray(hint, "riskTags");
  const hintTacticSignals = hintStringArray(hint, "tacticSignals");
  const hintEffectKinds = hintEffectKindArray(hint);
  const targetProfileKinds = hintTargetProfileKindArray(hint);
  const structuredSubroutines = [
    ...(card?.effectiveRunQuote?.subroutines ?? []),
    ...demoSubroutines(demoDefinition),
  ];
  const serializedSubroutines = structuredSubroutines.map((subroutine) =>
    JSON.stringify(subroutine),
  );
  const text = [
    card?.title,
    card?.definitionId,
    ...(card?.subtypes ?? []),
    card?.rulesText,
    runtimeDefinition?.text,
    demoDefinition?.rulesText,
    ...hintRoles,
    ...hintPlanRoles,
    ...hintRiskTags,
    ...hintTacticSignals,
    ...hintEffectKinds,
    ...serializedSubroutines,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const tokens = corpIcePlacementTextTokens(text);
  const tokenSet = new Set(tokens);

  const immediateStop =
    structuredSubroutines.some(subroutineLooksLikeImmediateStop) ||
    rolesMatch(
      [...hintRoles, ...hintEffectKinds],
      ["etr_ice", "end_run", "etr"],
    ) ||
    tokensIncludePhrase(tokens, ["end", "the", "run"]);
  const softStop =
    structuredSubroutines.some(subroutineLooksLikeSoftStop) ||
    (tokenSet.has("unless") &&
      (tokenSet.has("pay") || tokenSet.has("pays") || tokenSet.has("trace")));
  const persistentDamageCounter = rolesMatch(
    [...hintTacticSignals, ...hintEffectKinds],
    ["damage.corp_persistent_damage_counter", "persistent_damage_counter"],
  );
  const damage =
    persistentDamageCounter ||
    structuredSubroutines.some(subroutineLooksLikeDamage) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["damage_ice", "damage"]) ||
    tokenSet.has("damage");
  const multiProgramTrash = rolesMatch(
    [...hintTacticSignals, ...hintEffectKinds],
    ["corp_ice.multi_program_trash", "multi_program_trash"],
  );
  const programTrash =
    multiProgramTrash ||
    structuredSubroutines.some(subroutineLooksLikeProgramTrash) ||
    rolesMatch(
      [...hintRoles, ...hintEffectKinds],
      ["program_trash", "program_trash_ice"],
    ) ||
    (tokenSet.has("trash") && tokenSet.has("program"));
  const runRewind = rolesMatch(
    [...hintTacticSignals, ...hintEffectKinds],
    ["run.corp_run_rewind", "corp_run_rewind"],
  );
  const tagTrace =
    structuredSubroutines.some(subroutineLooksLikeTraceOrTag) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["trace", "tag"]) ||
    tokenSet.has("trace") ||
    tokenSet.has("tag");
  const tax =
    runRewind ||
    structuredSubroutines.some(subroutineLooksLikeTax) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["tax", "run_tax"]) ||
    tokenSet.has("tax") ||
    (tokenSet.has("pay") && tokenSet.has("credits"));
  const runLock =
    rolesMatch([...hintRoles, ...hintEffectKinds], ["run_lock"]) ||
    tokensIncludePhrase(tokens, ["cannot", "jack", "out"]) ||
    tokensIncludePhrase(tokens, ["may", "not", "jack", "out"]);
  const nextIceModifier =
    rolesMatch(
      [...hintTacticSignals, ...hintEffectKinds],
      ["next_ice_lock", "future_encounter_effect"],
    ) ||
    tokensIncludePhrase(tokens, ["next", "ice"]) ||
    tokensIncludePhrase(tokens, ["next", "piece", "of", "ice"]);
  const futureIceModifier =
    rolesMatch(
      [...hintEffectKinds],
      ["future_run_effect", "future_encounter_effect"],
    ) ||
    structuredSubroutines.some(subroutineHasFutureRunEffect) ||
    tokensIncludePhrase(tokens, ["remainder", "of", "this", "run"]) ||
    tokensIncludePhrase(tokens, ["for", "the", "rest", "of", "the", "run"]);
  const outsideIceScaling =
    rolesMatch(
      [...hintRiskTags, ...hintTacticSignals],
      ["outer_ice_scaling", "outside_ice_scaling", "position_scaling"],
    ) ||
    (tokenSet.has("outside") && tokenSet.has("ice"));
  const innerIceScaling =
    rolesMatch(
      [...hintRiskTags, ...hintTacticSignals],
      ["inner_ice_scaling", "inside_ice_scaling"],
    ) ||
    tokenSet.has("inside") ||
    tokenSet.has("inner");
  const variableRez =
    tokenSet.has("x") ||
    rolesMatch([...hintRiskTags, ...hintTacticSignals], ["variable_rez"]);
  const modeChoice = rolesMatch(
    [...hintTacticSignals, ...targetProfileKinds],
    ["type_choice_or_mode_choice", "mode_choice"],
  );
  const mobileReposition =
    rolesMatch(
      [...hintRiskTags, ...hintTacticSignals, ...hintEffectKinds],
      [
        "same_fort_reposition",
        "mobile_position_change",
        "move_self_to_outermost_position_on_other_fort",
      ],
    ) ||
    (tokenSet.has("move") && tokenSet.has("ice")) ||
    tokenSet.has("reposition");
  const maintenanceOrBounceRisk =
    tokenSet.has("return") ||
    tokenSet.has("bounce") ||
    tokenSet.has("maintenance");
  const positionDependent =
    outsideIceScaling ||
    innerIceScaling ||
    runRewind ||
    nextIceModifier ||
    futureIceModifier ||
    mobileReposition ||
    rolesMatch(
      [...hintRiskTags, ...hintTacticSignals],
      ["position_dependent_ice", "position_scaling"],
    );
  const requiresOtherIceContext =
    outsideIceScaling ||
    innerIceScaling ||
    runRewind ||
    nextIceModifier ||
    futureIceModifier;
  const evidence = [
    ...(definitionId ? [`definition:${definitionId}`] : []),
    `immediate_stop:${immediateStop}`,
    `tax_or_damage:${tax || damage || programTrash || tagTrace}`,
    `persistent_damage_counter:${persistentDamageCounter}`,
    `multi_program_trash:${multiProgramTrash}`,
    `run_rewind:${runRewind}`,
    `position_dependent:${positionDependent}`,
    `requires_other_ice_context:${requiresOtherIceContext}`,
    "printed_rez_cost_consumed:false",
  ];
  return {
    ...(card?.instanceId ? { iceInstanceId: card.instanceId } : {}),
    ...(definitionId ? { iceDefinitionId: definitionId } : {}),
    ...(card?.title ? { title: card.title } : {}),
    immediateStop,
    softStop,
    tax,
    damage,
    persistentDamageCounter,
    programTrash,
    multiProgramTrash,
    tagTrace,
    runLock,
    runRewind,
    nextIceModifier,
    futureIceModifier,
    outsideIceScaling,
    innerIceScaling,
    variableRez,
    modeChoice,
    mobileReposition,
    maintenanceOrBounceRisk,
    positionDependent,
    requiresOtherIceContext,
    evidence,
  };
}

export function visibleSourceCardForCorpIcePlacement(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  if (action.source === "basic_action" || action.source === "game_rule") {
    return undefined;
  }
  return visibleCorpCardsForPlacement(input).find(
    (card) => card.instanceId === action.source,
  );
}

function corpIcePlacementServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

function visibleCorpCardsForPlacement(input: AiDecisionInput): VisibleCard[] {
  const view = input.playerView;
  const values: unknown[] = [
    view.own.identity,
    ...(view.own.gripOrHq ?? []),
    ...(view.own.heapOrArchives ?? []),
    ...(view.own.scoreArea ?? []),
    ...(view.own.rig ?? []),
    ...(view.servers ?? []).flatMap((server) => [
      ...(server.ice ?? []),
      ...(server.root ?? []),
    ]),
    ...(view.specialZones?.setAside ?? []),
    ...(view.specialZones?.removedFromGame ?? []),
  ];
  return values.filter(isVisibleCard);
}

function isVisibleCard(value: unknown): value is VisibleCard {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { instanceId?: unknown }).instanceId === "string"
  );
}

export function corpIcePlacementActionCreditCostFact(
  action: LegalAction,
): CorpIceCostFact {
  if (
    action.payload?.variableCostKind !== undefined ||
    action.payload?.variableInstallCost === true ||
    action.payload?.xValue !== undefined
  ) {
    return {
      status: "unknown",
      reason: "variable",
      source: "legal_action",
    };
  }
  if (!Array.isArray(action.costs)) {
    return {
      status: "unknown",
      reason: "missing",
      source: "legal_action",
    };
  }
  let amount = 0;
  for (const cost of action.costs) {
    if (cost.credits === undefined) continue;
    const fact = finiteNonNegativeIntegerCostFact(cost.credits, "legal_action");
    if (fact.status === "unknown") return fact;
    amount += fact.amount;
    if (!Number.isSafeInteger(amount)) {
      return {
        status: "unknown",
        reason: Number.isFinite(amount) ? "non_integer" : "non_finite",
        source: "legal_action",
      };
    }
  }
  return { status: "known", amount, source: "legal_action" };
}

export function corpIcePlacementActionCostAgreementFact(
  action: LegalAction,
  projectedActionCreditCost?: number | undefined,
): CorpIceCostFact {
  const legalActionFact = corpIcePlacementActionCreditCostFact(action);
  if (
    legalActionFact.status === "unknown" ||
    projectedActionCreditCost === undefined
  ) {
    return legalActionFact;
  }
  const projectedFact = finiteNonNegativeIntegerCostFact(
    projectedActionCreditCost,
    "candidate_projection",
  );
  if (projectedFact.status === "unknown") return projectedFact;
  if (projectedFact.amount !== legalActionFact.amount) {
    return {
      status: "unknown",
      reason: "projection_drift",
      source: "candidate_projection",
    };
  }
  return projectedFact;
}

export function corpIcePlacementPostInstallRezCostFact(
  input: AiDecisionInput,
  action: LegalAction,
): CorpIceCostFact {
  const source = "engine_post_install_rez_quote" as const;
  const canonicalActions = input.legalActions.filter(
    (candidate) => candidate.actionId === action.actionId,
  );
  if (canonicalActions.length !== 1 || canonicalActions[0] !== action) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  const canonicalAction = canonicalActions[0]!;
  if (
    input.side !== "corp" ||
    canonicalAction.side !== "corp" ||
    canonicalAction.type !== "install_card" ||
    canonicalAction.payload?.placement !== "ice"
  ) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  const sourceCard = visibleSourceCardForCorpIcePlacement(
    input,
    canonicalAction,
  );
  const targetServerId = corpIcePlacementServerId(canonicalAction);
  const payload = canonicalAction.payload;
  if (
    !sourceCard ||
    sourceCard.known !== true ||
    sourceCard.type !== "ice" ||
    sourceCard.owner !== "corp" ||
    sourceCard.controller !== "corp" ||
    canonicalAction.source !== sourceCard.instanceId ||
    payload.cardId !== sourceCard.instanceId ||
    (payload.sourceDefinitionId !== undefined &&
      payload.sourceDefinitionId !== sourceCard.definitionId) ||
    !targetServerId ||
    canonicalAction.timingPoint !== input.playerView.timingPoint ||
    canonicalAction.expiresAtStateVersion !== input.playerView.stateVersion ||
    payload.postInstallRezQuoteCardId !== sourceCard.instanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion
  ) {
    return { status: "unknown", reason: "binding_drift", source };
  }
  if (payload.postInstallRezQuoteComplete !== true) {
    return {
      status: "unknown",
      reason:
        payload.postInstallRezQuoteComplete === false
          ? "incomplete"
          : "missing",
      source,
    };
  }
  const projectedServerId = payload.postInstallRezQuoteProjectedServerId;
  const baseCredits = payload.postInstallRezQuoteBaseCredits;
  const finalCredits = payload.postInstallRezQuoteFinalCredits;
  const mandatoryAgendaPointCost =
    payload.postInstallRezQuoteMandatoryAgendaPointCost;
  const mandatoryKind = payload.postInstallRezQuoteMandatoryAdditionalCostKind;
  const reductionIds = canonicalCommaSeparatedDefinitionIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseIds = canonicalCommaSeparatedDefinitionIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (
    !validTargetProjectedServerBinding(targetServerId, projectedServerId) ||
    !nonNegativeSafeInteger(baseCredits) ||
    !nonNegativeSafeInteger(finalCredits) ||
    !nonNegativeSafeInteger(mandatoryAgendaPointCost) ||
    reductionIds === undefined ||
    increaseIds === undefined ||
    !definitionIdListsDisjoint(reductionIds, increaseIds) ||
    (reductionIds.length === 0 &&
      increaseIds.length === 0 &&
      finalCredits !== baseCredits) ||
    (mandatoryAgendaPointCost > 0
      ? mandatoryKind !== "agenda_point"
      : mandatoryKind !== undefined)
  ) {
    return { status: "unknown", reason: "malformed", source };
  }
  if (mandatoryAgendaPointCost > 0) {
    return {
      status: "unknown",
      reason: "unsupported_mandatory_cost",
      source,
    };
  }
  return { status: "known", amount: finalCredits, source };
}

function hintStringArray(hint: unknown, key: string): string[] {
  const value = (hint as Record<string, unknown> | undefined)?.[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function hintEffectKindArray(hint: unknown): string[] {
  const value = (hint as { effects?: unknown } | undefined)?.effects;
  return Array.isArray(value)
    ? value
        .map((entry) =>
          typeof entry === "object" && entry !== null
            ? (entry as { kind?: unknown }).kind
            : undefined,
        )
        .filter((entry): entry is string => typeof entry === "string")
    : [];
}

function hintTargetProfileKindArray(hint: unknown): string[] {
  const value = (hint as { targetProfiles?: unknown } | undefined)
    ?.targetProfiles;
  return Array.isArray(value)
    ? value
        .map((entry) =>
          typeof entry === "object" && entry !== null
            ? (entry as { kind?: unknown }).kind
            : undefined,
        )
        .filter((entry): entry is string => typeof entry === "string")
    : [];
}

function demoSubroutines(demoDefinition: unknown): unknown[] {
  const value = (demoDefinition as { subroutines?: unknown } | undefined)
    ?.subroutines;
  return Array.isArray(value) ? value : [];
}

function subroutineType(subroutine: unknown): string | undefined {
  return typeof subroutine === "object" && subroutine !== null
    ? typeof (subroutine as { type?: unknown }).type === "string"
      ? (subroutine as { type: string }).type
      : undefined
    : undefined;
}

function subroutineLooksLikeImmediateStop(subroutine: unknown): boolean {
  const type = subroutineType(subroutine);
  if (
    type === "end_the_run" ||
    type === "end_the_run_unless_runner_pays" ||
    type === "set_run_future_end_the_run_subroutine" ||
    type === "set_runner_run_lock_actions"
  ) {
    return true;
  }
  const value = subroutine as { traceSuccessEffect?: { type?: string } };
  return (
    type === "initiate_trace" &&
    (value.traceSuccessEffect?.type === "end_run_and_run_lock" ||
      value.traceSuccessEffect?.type === "end_run_trash_program_and_run_lock")
  );
}

function subroutineLooksLikeSoftStop(subroutine: unknown): boolean {
  const type = subroutineType(subroutine);
  return type === "end_the_run_unless_runner_pays" || type === "initiate_trace";
}

function subroutineLooksLikeDamage(subroutine: unknown): boolean {
  return subroutineType(subroutine) === "do_damage";
}

function subroutineLooksLikeProgramTrash(subroutine: unknown): boolean {
  return [
    "trash_installed_program",
    "trash_installed_program_unless_runner_pays",
  ].includes(subroutineType(subroutine) ?? "");
}

function subroutineLooksLikeTraceOrTag(subroutine: unknown): boolean {
  const type = subroutineType(subroutine);
  return type === "initiate_trace" || type === "give_tag";
}

function subroutineLooksLikeTax(subroutine: unknown): boolean {
  return [
    "corp_gain_credit",
    "set_run_break_subroutine_cost_modifier",
    "set_run_encounter_tax",
    "trash_installed_program_unless_runner_pays",
    "end_the_run_unless_runner_pays",
  ].includes(subroutineType(subroutine) ?? "");
}

function subroutineHasFutureRunEffect(subroutine: unknown): boolean {
  return (
    typeof subroutine === "object" &&
    subroutine !== null &&
    "unbrokenRunEffect" in subroutine
  );
}

function corpIcePlacementTextTokens(value: string): string[] {
  return value
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function tokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some(
    (token, index) =>
      token === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function finiteNonNegativeIntegerCostFact(
  value: number | undefined,
  source: CorpIceCostFact["source"],
): CorpIceCostFact {
  if (value === undefined) {
    return { status: "unknown", reason: "missing", source };
  }
  if (!Number.isFinite(value)) {
    return { status: "unknown", reason: "non_finite", source };
  }
  if (value < 0) {
    return { status: "unknown", reason: "negative", source };
  }
  if (!Number.isSafeInteger(value)) {
    return { status: "unknown", reason: "non_integer", source };
  }
  return { status: "known", amount: value, source };
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function validTargetProjectedServerBinding(
  targetServerId: string,
  projectedServerId: unknown,
): projectedServerId is string {
  if (targetServerId === "new_remote") {
    return (
      typeof projectedServerId === "string" &&
      /^remote_[1-9]\d*$/.test(projectedServerId)
    );
  }
  return projectedServerId === targetServerId;
}

function canonicalCommaSeparatedDefinitionIds(
  value: unknown,
): string[] | undefined {
  if (value === undefined) return [];
  if (typeof value !== "string" || value.length === 0) return undefined;
  const ids = value.split(",");
  return ids.every(
    (id, index) => id.length > 0 && (index === 0 || ids[index - 1]! < id),
  )
    ? ids
    : undefined;
}

function definitionIdListsDisjoint(
  reductionIds: readonly string[],
  increaseIds: readonly string[],
): boolean {
  if (reductionIds.length === 0 || increaseIds.length === 0) return true;
  const reductions = new Set(reductionIds);
  return increaseIds.every((id) => !reductions.has(id));
}
