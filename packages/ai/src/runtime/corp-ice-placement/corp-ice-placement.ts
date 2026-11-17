import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "../../ai-hints";
import { rolesMatch } from "../../role-match";

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

export function corpCentralIceProfile(card: VisibleCard | undefined): {
  hasAccessStop: boolean;
  hasTaxOrDamage: boolean;
  positionDependent: boolean;
  modeChoice: boolean;
  alternateWallMode: boolean;
  definitionId?: string;
} {
  const profile = buildCorpIceCardFacts(card);
  const hint = profile.iceDefinitionId
    ? AI_HINTS_BY_CARD.get(profile.iceDefinitionId)
    : undefined;
  return {
    hasAccessStop: profile.immediateStop,
    hasTaxOrDamage:
      profile.tax ||
      profile.damage ||
      profile.programTrash ||
      profile.tagTrace ||
      profile.runLock,
    positionDependent: profile.positionDependent,
    modeChoice: profile.modeChoice,
    alternateWallMode:
      hint?.requiredMechanics?.includes("alternate_subtype_wall") === true,
    ...(profile.iceDefinitionId
      ? { definitionId: profile.iceDefinitionId }
      : {}),
  };
}

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
