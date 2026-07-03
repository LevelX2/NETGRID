import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type AiDecisionScoreComponent,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { createAiHintsByCard, RUNTIME_CARDS } from "../../ai-hints";
import { rolesMatch } from "../role-match";

export type CorpIcePlacementRecommendation =
  | "install_now"
  | "hold_for_later"
  | "prefer_economy"
  | "prefer_scoreline";

export type CorpIcePlacementResultingPosition =
  | "outermost"
  | "known_engine_position"
  | "unknown";

export type CorpIcePlacementServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpServerNeedProfile = {
  serverId: string;
  serverKind: "hq" | "rd" | "archives" | "remote" | "new_remote" | "unknown";
  serverNeed: number;
  iceCount: number;
  existingRezzedIceCount: number;
  rootHasAgendaOrScoreline: boolean;
  agendaRisk: boolean;
  pressureActive: boolean;
  evidence: string[];
};

export type CorpIceCardPlacementProfile = {
  iceInstanceId?: string;
  iceDefinitionId?: string;
  title?: string;
  rezCost: number;
  immediateStop: boolean;
  softStop: boolean;
  tax: boolean;
  damage: boolean;
  programTrash: boolean;
  tagTrace: boolean;
  runLock: boolean;
  nextIceModifier: boolean;
  futureIceModifier: boolean;
  outsideIceScaling: boolean;
  innerIceScaling: boolean;
  variableRez: boolean;
  modeChoice: boolean;
  mobileReposition: boolean;
  maintenanceOrBounceRisk: boolean;
  positionDependent: boolean;
  deadAsFirstIce: boolean;
  wantsOuter: boolean;
  wantsInner: boolean;
  wantsFollowupIce: boolean;
  evidence: string[];
};

export type CorpIceDensityProfile = {
  knownCorpCardCount: number;
  knownIceSeen: number;
  iceInHq: number;
  installedIce: number;
  remainingDeckCount: number;
  remainingIceEstimate: number;
  iceDensityClass: "low" | "normal" | "high" | "unknown";
  handIceQuality: "none" | "weak" | "mixed" | "strong";
  evidence: string[];
};

export type CorpIcePlacementCandidate = {
  actionId: string;
  iceInstanceId?: string;
  iceDefinitionId?: string;
  serverId: string;
  resultingPosition: CorpIcePlacementResultingPosition;
  score: number;
  recommendation: CorpIcePlacementRecommendation;
  components: {
    serverNeed: number;
    immediateStopValue: number;
    futureRunSynergy: number;
    positionFit: number;
    rezAffordability: number;
    deckDensityAdjustment: number;
    opportunityCost: number;
  };
  evidence: string[];
};

export type CorpIcePlacementEvaluation = {
  bestInstall?: CorpIcePlacementCandidate;
  bestDeferReason?: string | undefined;
  candidates: CorpIcePlacementCandidate[];
  serverNeeds: CorpServerNeedProfile[];
  handIceProfiles: CorpIceCardPlacementProfile[];
  deckDensity: CorpIceDensityProfile;
  evidence: string[];
};

export type CorpIcePlacementCandidateParams<
  TServer extends CorpIcePlacementServerLike = CorpIcePlacementServerLike,
> = {
  input: AiDecisionInput;
  action: LegalAction;
  serverId?: string | undefined;
  server?: TServer | undefined;
  sourceCard?: VisibleCard | undefined;
  actionCreditCost?: number | undefined;
  iceRezCost?: number | undefined;
  immediateServerNeedBonus?: number | undefined;
  hasUrgentScoreline?: boolean | undefined;
  hasBetterImmediateIceAlternative?: boolean | undefined;
};

const AI_HINTS_BY_CARD = createAiHintsByCard();

export function corpIcePlacementCandidateForAction<
  TServer extends CorpIcePlacementServerLike,
>(
  params: CorpIcePlacementCandidateParams<TServer>,
): CorpIcePlacementCandidate | undefined {
  const { input, action } = params;
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "install_card" ||
    action.payload?.placement !== "ice"
  ) {
    return undefined;
  }
  const serverId = params.serverId ?? corpIcePlacementServerId(action);
  if (!serverId) return undefined;
  const sourceCard =
    params.sourceCard ?? visibleSourceCardForCorpIcePlacement(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;

  const serverNeed = buildCorpServerNeedProfile(input, serverId, params.server, {
    immediateServerNeedBonus: params.immediateServerNeedBonus,
    hasUrgentScoreline: params.hasUrgentScoreline,
  });
  const profile = buildCorpIceCardPlacementProfile(sourceCard, {
    rezCost: params.iceRezCost,
  });
  const deckDensity = buildCorpIceDensityProfile(input);
  const actionCreditCost =
    params.actionCreditCost ?? corpIcePlacementActionCreditCost(action);
  const creditsAfterInstall = input.playerView.own.credits - actionCreditCost;
  const affordable = profile.rezCost <= Math.max(0, creditsAfterInstall);
  const firstIce = serverNeed.iceCount === 0;
  const hasOutsideRezzedIce = serverNeed.existingRezzedIceCount > 0;

  const components = {
    serverNeed: serverNeed.serverNeed,
    immediateStopValue: corpImmediateStopValue(
      profile,
      serverNeed,
      affordable,
    ),
    futureRunSynergy: corpFutureRunSynergyValue(
      profile,
      firstIce,
      hasOutsideRezzedIce,
    ),
    positionFit: corpPositionFitValue(profile, firstIce, hasOutsideRezzedIce),
    rezAffordability: corpRezAffordabilityValue(profile, affordable),
    deckDensityAdjustment: corpDeckDensityAdjustmentValue(
      profile,
      deckDensity,
      firstIce,
      serverNeed,
    ),
    opportunityCost: corpPlacementOpportunityCostValue({
      profile,
      serverNeed,
      affordable,
      creditsAfterInstall,
      hasBetterImmediateIceAlternative:
        params.hasBetterImmediateIceAlternative === true,
    }),
  };
  const score = Object.values(components).reduce((sum, value) => sum + value, 0);
  const recommendation = corpIcePlacementRecommendationForScore(
    score,
    components,
    params.hasUrgentScoreline === true,
  );
  return {
    actionId: action.actionId,
    iceInstanceId: sourceCard.instanceId,
    ...(sourceCard.definitionId
      ? { iceDefinitionId: sourceCard.definitionId }
      : {}),
    serverId,
    resultingPosition: corpIcePlacementResultingPosition(action),
    score,
    recommendation,
    components,
    evidence: [
      `server:${serverId}`,
      `first_ice:${firstIce}`,
      `credits_after_install:${creditsAfterInstall}`,
      `rez_cost:${profile.rezCost}`,
      `rez_affordable:${affordable}`,
      `recommendation:${recommendation}`,
      ...serverNeed.evidence,
      ...profile.evidence,
      ...deckDensity.evidence,
    ],
  };
}

export function corpIcePlacementScoreComponent<
  TServer extends CorpIcePlacementServerLike,
>(
  params: CorpIcePlacementCandidateParams<TServer>,
): AiDecisionScoreComponent | undefined {
  const candidate = corpIcePlacementCandidateForAction(params);
  if (!candidate) return undefined;
  return {
    key: "corp_ice_placement_evaluator",
    label: "ICE-Platzierung",
    value: candidate.score,
    reason: candidate.evidence.join("|"),
  };
}

export function buildCorpServerNeedProfile<
  TServer extends CorpIcePlacementServerLike,
>(
  input: AiDecisionInput,
  serverId: string,
  server?: TServer,
  options: {
    immediateServerNeedBonus?: number | undefined;
    hasUrgentScoreline?: boolean | undefined;
  } = {},
): CorpServerNeedProfile {
  const serverKind = corpServerKind(serverId);
  const iceCount = serverId === "new_remote" ? 0 : (server?.ice.length ?? 0);
  const existingRezzedIceCount = (server?.ice ?? []).filter(
    (ice) => ice.known !== false && ice.rezzed === true,
  ).length;
  const rootHasAgendaOrScoreline =
    server?.root.some(
      (card) =>
        card.known !== false &&
        (card.type === "agenda" ||
          typeof card.advancementRequirement === "number" ||
          (card.advancementCounters ?? 0) > 0),
    ) === true;
  const hqAgendaRisk = semanticCorpHasAgendaInHq(input);
  const archivesAgendaRisk = semanticCorpHasAgendaInArchives(input);
  const centralPressure = corpCentralPressureFromVisibleInput(input, serverId);
  const remotePressure =
    serverKind === "remote" || serverKind === "new_remote"
      ? rootHasAgendaOrScoreline || options.hasUrgentScoreline === true
      : false;

  let serverNeed = 0;
  const evidence: string[] = [`server_kind:${serverKind}`, `ice_count:${iceCount}`];
  if (serverKind === "hq") {
    if (hqAgendaRisk) {
      serverNeed += 900;
      evidence.push("hq_agenda_risk:true");
    }
    if (centralPressure) {
      serverNeed += 450;
      evidence.push("hq_pressure:true");
    }
  } else if (serverKind === "rd") {
    if (centralPressure) {
      serverNeed += 1150;
      evidence.push("rd_pressure:true");
    } else if ((input.playerView.opponent?.agendaPoints ?? 0) >= 5) {
      serverNeed += 650;
      evidence.push("runner_score_pressure:true");
    }
  } else if (serverKind === "archives") {
    if (archivesAgendaRisk) {
      serverNeed += 550;
      evidence.push("archives_agenda_risk:true");
    }
    if (corpArchivesPressureFromVisibleInput(input)) {
      serverNeed += 250;
      evidence.push("archives_pressure:true");
    }
  } else if (serverKind === "remote" || serverKind === "new_remote") {
    if (rootHasAgendaOrScoreline) {
      serverNeed += 1100;
      evidence.push("remote_scoreline_root:true");
    }
    if (options.hasUrgentScoreline === true) {
      serverNeed += 650;
      evidence.push("urgent_scoreline:true");
    }
    if (!rootHasAgendaOrScoreline && hqAgendaRisk) {
      serverNeed += serverKind === "new_remote" ? 450 : 550;
      evidence.push("score_remote_setup_need:true");
    }
  }
  if (options.immediateServerNeedBonus) {
    serverNeed += options.immediateServerNeedBonus;
    evidence.push(`server_need_bonus:${options.immediateServerNeedBonus}`);
  }

  return {
    serverId,
    serverKind,
    serverNeed,
    iceCount,
    existingRezzedIceCount,
    rootHasAgendaOrScoreline,
    agendaRisk:
      (serverKind === "hq" && hqAgendaRisk) ||
      (serverKind === "archives" && archivesAgendaRisk),
    pressureActive: centralPressure || remotePressure,
    evidence,
  };
}

export function buildCorpIceCardPlacementProfile(
  card: VisibleCard | undefined,
  options: { rezCost?: number | undefined } = {},
): CorpIceCardPlacementProfile {
  const definitionId = card?.definitionId;
  const runtimeDefinition = definitionId
    ? RUNTIME_CARDS[definitionId]
    : undefined;
  const demoDefinition = definitionId
    ? (DEMO_CARDS_BY_ID[definitionId] ??
      (runtimeDefinition?.engineCardId
        ? DEMO_CARDS_BY_ID[runtimeDefinition.engineCardId]
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
    rolesMatch([...hintRoles, ...hintEffectKinds], [
      "etr_ice",
      "end_run",
      "run_lock",
      "etr",
    ]) ||
    tokensIncludePhrase(tokens, ["end", "the", "run"]);
  const softStop =
    structuredSubroutines.some(subroutineLooksLikeSoftStop) ||
    (tokenSet.has("unless") &&
      (tokenSet.has("pay") || tokenSet.has("pays") || tokenSet.has("trace")));
  const damage =
    structuredSubroutines.some(subroutineLooksLikeDamage) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["damage_ice", "damage"]) ||
    tokenSet.has("damage");
  const programTrash =
    structuredSubroutines.some(subroutineLooksLikeProgramTrash) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], [
      "program_trash",
      "program_trash_ice",
    ]) ||
    (tokenSet.has("trash") && tokenSet.has("program"));
  const tagTrace =
    structuredSubroutines.some(subroutineLooksLikeTraceOrTag) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["trace", "tag"]) ||
    tokenSet.has("trace") ||
    tokenSet.has("tag");
  const tax =
    structuredSubroutines.some(subroutineLooksLikeTax) ||
    rolesMatch([...hintRoles, ...hintEffectKinds], ["tax", "run_tax"]) ||
    tokenSet.has("tax") ||
    (tokenSet.has("pay") && tokenSet.has("credits"));
  const runLock =
    rolesMatch([...hintRoles, ...hintEffectKinds], ["run_lock"]) ||
    tokensIncludePhrase(tokens, ["cannot", "jack", "out"]) ||
    tokensIncludePhrase(tokens, ["may", "not", "jack", "out"]);
  const nextIceModifier =
    rolesMatch([...hintTacticSignals, ...hintEffectKinds], [
      "next_ice_lock",
      "future_encounter_effect",
    ]) ||
    tokensIncludePhrase(tokens, ["next", "ice"]) ||
    tokensIncludePhrase(tokens, ["next", "piece", "of", "ice"]);
  const futureIceModifier =
    rolesMatch([...hintEffectKinds], [
      "future_run_effect",
      "future_encounter_effect",
    ]) ||
    structuredSubroutines.some(subroutineHasFutureRunEffect) ||
    tokensIncludePhrase(tokens, ["remainder", "of", "this", "run"]) ||
    tokensIncludePhrase(tokens, ["for", "the", "rest", "of", "the", "run"]);
  const outsideIceScaling =
    rolesMatch([...hintRiskTags, ...hintTacticSignals], [
      "outer_ice_scaling",
      "outside_ice_scaling",
      "position_scaling",
    ]) ||
    (tokenSet.has("outside") && tokenSet.has("rezzed") && tokenSet.has("ice"));
  const innerIceScaling =
    rolesMatch([...hintRiskTags, ...hintTacticSignals], [
      "inner_ice_scaling",
      "inside_ice_scaling",
    ]) ||
    tokenSet.has("inside") ||
    tokenSet.has("inner");
  const variableRez =
    tokenSet.has("x") ||
    rolesMatch([...hintRiskTags, ...hintTacticSignals], ["variable_rez"]);
  const modeChoice =
    rolesMatch([...hintTacticSignals, ...targetProfileKinds], [
      "type_choice_or_mode_choice",
      "mode_choice",
    ]);
  const mobileReposition =
    rolesMatch([...hintRiskTags, ...hintTacticSignals, ...hintEffectKinds], [
      "same_fort_reposition",
      "mobile_position_change",
      "move_self_to_outermost_position_on_other_fort",
    ]) ||
    (tokenSet.has("move") && tokenSet.has("ice")) ||
    tokenSet.has("reposition");
  const maintenanceOrBounceRisk =
    tokenSet.has("return") ||
    tokenSet.has("bounce") ||
    tokenSet.has("maintenance");
  const positionDependent =
    outsideIceScaling ||
    innerIceScaling ||
    nextIceModifier ||
    futureIceModifier ||
    mobileReposition ||
    rolesMatch([...hintRiskTags, ...hintTacticSignals], [
      "position_dependent_ice",
      "position_scaling",
    ]);
  const wantsInner = outsideIceScaling || innerIceScaling;
  const wantsOuter = nextIceModifier || futureIceModifier;
  const wantsFollowupIce = wantsInner || wantsOuter;
  const deadAsFirstIce = wantsFollowupIce && !immediateStop;
  const evidence = [
    ...(definitionId ? [`definition:${definitionId}`] : []),
    `immediate_stop:${immediateStop}`,
    `tax_or_damage:${tax || damage || programTrash || tagTrace}`,
    `position_dependent:${positionDependent}`,
    `wants_inner:${wantsInner}`,
    `wants_outer:${wantsOuter}`,
    `dead_as_first_ice:${deadAsFirstIce}`,
  ];
  return {
    ...(card?.instanceId ? { iceInstanceId: card.instanceId } : {}),
    ...(definitionId ? { iceDefinitionId: definitionId } : {}),
    ...(card?.title ? { title: card.title } : {}),
    rezCost: safeNonNegativeInteger(options.rezCost ?? card?.rezCost),
    immediateStop,
    softStop,
    tax,
    damage,
    programTrash,
    tagTrace,
    runLock,
    nextIceModifier,
    futureIceModifier,
    outsideIceScaling,
    innerIceScaling,
    variableRez,
    modeChoice,
    mobileReposition,
    maintenanceOrBounceRisk,
    positionDependent,
    deadAsFirstIce,
    wantsOuter,
    wantsInner,
    wantsFollowupIce,
    evidence,
  };
}

export function buildCorpIceDensityProfile(
  input: AiDecisionInput,
): CorpIceDensityProfile {
  const knownCards = visibleCorpCardsForPlacement(input);
  const knownIce = knownCards.filter(cardLooksLikeIce);
  const iceInHq = (input.playerView.own.gripOrHq ?? []).filter(
    cardLooksLikeIce,
  ).length;
  const installedIce = (input.playerView.servers ?? []).reduce(
    (count, server) => count + (server.ice?.filter(cardLooksLikeIce).length ?? 0),
    0,
  );
  const remainingDeckCount = safeNonNegativeInteger(
    input.playerView.own.stackOrRdCount,
  );
  const knownCorpCardCount = knownCards.length;
  const knownIceSeen = knownIce.length;
  const knownDensity =
    knownCorpCardCount > 0 ? knownIceSeen / knownCorpCardCount : undefined;
  const remainingIceEstimate =
    knownDensity === undefined ? 0 : Math.round(remainingDeckCount * knownDensity);
  const iceDensityClass =
    knownDensity === undefined
      ? "unknown"
      : knownDensity < 0.18 && iceInHq <= 1
        ? "low"
        : knownDensity > 0.36 || iceInHq >= 3
          ? "high"
          : "normal";
  const handProfiles = (input.playerView.own.gripOrHq ?? [])
    .filter(cardLooksLikeIce)
    .map((card) => buildCorpIceCardPlacementProfile(card));
  const strongHandIce = handProfiles.filter(
    (profile) => profile.immediateStop && !profile.deadAsFirstIce,
  ).length;
  const weakHandIce = handProfiles.filter(
    (profile) => profile.deadAsFirstIce || !profile.immediateStop,
  ).length;
  const handIceQuality =
    handProfiles.length === 0
      ? "none"
      : strongHandIce > 0 && weakHandIce === 0
        ? "strong"
        : strongHandIce > 0
          ? "mixed"
          : "weak";
  return {
    knownCorpCardCount,
    knownIceSeen,
    iceInHq,
    installedIce,
    remainingDeckCount,
    remainingIceEstimate,
    iceDensityClass,
    handIceQuality,
    evidence: [
      `known_ice_seen:${knownIceSeen}`,
      `ice_in_hq:${iceInHq}`,
      `installed_ice:${installedIce}`,
      `remaining_deck_count:${remainingDeckCount}`,
      `remaining_ice_estimate:${remainingIceEstimate}`,
      `ice_density_class:${iceDensityClass}`,
      `hand_ice_quality:${handIceQuality}`,
    ],
  };
}

export function corpIcePlacementEvaluationForActions<
  TServer extends CorpIcePlacementServerLike,
>(
  input: AiDecisionInput,
  actions: readonly LegalAction[],
  dependencies: {
    serverIdForAction: (action: LegalAction) => string | undefined;
    serverForId: (serverId: string | undefined) => TServer | undefined;
    actionCreditCost?: (action: LegalAction) => number;
    visibleIceRezCost?: (card: VisibleCard) => number | undefined;
  },
): CorpIcePlacementEvaluation {
  const deckDensity = buildCorpIceDensityProfile(input);
  const candidates = actions
    .map((action) => {
      const sourceCard = visibleSourceCardForCorpIcePlacement(input, action);
      return corpIcePlacementCandidateForAction({
        input,
        action,
        serverId: dependencies.serverIdForAction(action),
        server: dependencies.serverForId(dependencies.serverIdForAction(action)),
        sourceCard,
        actionCreditCost: dependencies.actionCreditCost?.(action),
        iceRezCost: sourceCard
          ? dependencies.visibleIceRezCost?.(sourceCard)
          : undefined,
      });
    })
    .filter((candidate): candidate is CorpIcePlacementCandidate =>
      Boolean(candidate),
    )
    .sort((left, right) => right.score - left.score);
  const serverNeeds = uniqueStrings(candidates.map((candidate) => candidate.serverId)).map(
    (serverId) =>
      buildCorpServerNeedProfile(
        input,
        serverId,
        dependencies.serverForId(serverId),
      ),
  );
  const handIceProfiles = (input.playerView.own.gripOrHq ?? [])
    .filter(cardLooksLikeIce)
    .map((card) => buildCorpIceCardPlacementProfile(card));
  const bestInstall = candidates[0];
  const bestDeferReason = bestInstall
    ? corpBestDeferReason(bestInstall, deckDensity)
    : "no_legal_ice_install";
  return {
    ...(bestInstall ? { bestInstall } : {}),
    bestDeferReason,
    candidates,
    serverNeeds,
    handIceProfiles,
    deckDensity,
    evidence: [
      `candidate_count:${candidates.length}`,
      ...(bestInstall
        ? [`best_action:${bestInstall.actionId}`, `best_score:${bestInstall.score}`]
        : []),
      `best_defer_reason:${bestDeferReason}`,
    ],
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

export function corpIcePlacementServerId(
  action: LegalAction,
): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

function corpImmediateStopValue(
  profile: CorpIceCardPlacementProfile,
  serverNeed: CorpServerNeedProfile,
  affordable: boolean,
): number {
  if (profile.immediateStop && affordable) {
    return serverNeed.serverNeed >= 1000 ? 900 : 650;
  }
  if (profile.immediateStop) return serverNeed.serverNeed >= 1000 ? 250 : 150;
  if (profile.tax || profile.damage || profile.programTrash || profile.tagTrace) {
    return serverNeed.serverNeed >= 1000 ? 250 : 150;
  }
  return serverNeed.serverNeed >= 900 ? -650 : -250;
}

function corpFutureRunSynergyValue(
  profile: CorpIceCardPlacementProfile,
  firstIce: boolean,
  hasOutsideRezzedIce: boolean,
): number {
  if (!profile.wantsFollowupIce) return 0;
  if (profile.outsideIceScaling) return hasOutsideRezzedIce ? 450 : -550;
  if (profile.nextIceModifier || profile.futureIceModifier) {
    return firstIce ? -350 : 350;
  }
  return 0;
}

function corpPositionFitValue(
  profile: CorpIceCardPlacementProfile,
  firstIce: boolean,
  hasOutsideRezzedIce: boolean,
): number {
  let value = 0;
  if (profile.deadAsFirstIce && firstIce) value -= 850;
  if (profile.outsideIceScaling && !hasOutsideRezzedIce) value -= 450;
  if ((profile.nextIceModifier || profile.futureIceModifier) && !firstIce) {
    value += 300;
  }
  if (profile.mobileReposition && value < 0) {
    return Math.trunc(value / 2);
  }
  return value;
}

function corpRezAffordabilityValue(
  profile: CorpIceCardPlacementProfile,
  affordable: boolean,
): number {
  if (profile.rezCost === 0) return 100;
  return affordable ? 350 : -650;
}

function corpDeckDensityAdjustmentValue(
  profile: CorpIceCardPlacementProfile,
  deckDensity: CorpIceDensityProfile,
  firstIce: boolean,
  serverNeed: CorpServerNeedProfile,
): number {
  if (!firstIce || serverNeed.serverNeed < 450) return 0;
  if (deckDensity.iceDensityClass === "low") return 250;
  if (
    deckDensity.iceDensityClass === "high" &&
    profile.positionDependent &&
    !profile.immediateStop
  ) {
    return -250;
  }
  return 0;
}

function corpPlacementOpportunityCostValue(params: {
  profile: CorpIceCardPlacementProfile;
  serverNeed: CorpServerNeedProfile;
  affordable: boolean;
  creditsAfterInstall: number;
  hasBetterImmediateIceAlternative: boolean;
}): number {
  if (params.hasBetterImmediateIceAlternative && params.profile.deadAsFirstIce) {
    return -500;
  }
  if (!params.affordable && params.creditsAfterInstall < 3) {
    return params.serverNeed.serverNeed >= 1200 ? -150 : -450;
  }
  if (params.serverNeed.serverNeed < 300 && params.profile.positionDependent) {
    return -350;
  }
  return 0;
}

function corpIcePlacementRecommendationForScore(
  score: number,
  components: CorpIcePlacementCandidate["components"],
  urgentScoreline: boolean,
): CorpIcePlacementRecommendation {
  if (urgentScoreline && score > 0) return "install_now";
  if (components.rezAffordability < 0 && score < 650) return "prefer_economy";
  if (score >= 900) return "install_now";
  if (score <= 0) return "hold_for_later";
  return "hold_for_later";
}

function corpBestDeferReason(
  candidate: CorpIcePlacementCandidate,
  deckDensity: CorpIceDensityProfile,
): string | undefined {
  if (candidate.recommendation === "install_now") return undefined;
  if (candidate.components.rezAffordability < 0) return "rez_reserve_too_low";
  if (candidate.components.positionFit < -500) {
    return "bad_first_ice_wait_for_followup";
  }
  if (
    deckDensity.iceDensityClass === "high" &&
    candidate.components.deckDensityAdjustment < 0
  ) {
    return "deck_ice_density_high_wait_reasonable";
  }
  return "ice_install_score_below_development_options";
}

function corpIcePlacementResultingPosition(
  action: LegalAction,
): CorpIcePlacementResultingPosition {
  const position = action.payload?.position ?? action.payload?.installPosition;
  if (position === "outermost") return "outermost";
  if (typeof position === "string") return "known_engine_position";
  return "outermost";
}

function corpServerKind(
  serverId: string,
): CorpServerNeedProfile["serverKind"] {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId === "new_remote") return "new_remote";
  if (serverId.startsWith("remote_")) return "remote";
  return "unknown";
}

function semanticCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return (input.playerView.own.gripOrHq ?? []).some(
    (card) => card.known !== false && card.type === "agenda",
  );
}

function semanticCorpHasAgendaInArchives(input: AiDecisionInput): boolean {
  return (input.playerView.own.heapOrArchives ?? []).some(
    (card) => card.known !== false && card.type === "agenda",
  );
}

function corpCentralPressureFromVisibleInput(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  if (serverId !== "hq" && serverId !== "rd") return false;
  const runnerAgendaPoints = input.playerView.opponent?.agendaPoints ?? 0;
  const rig = input.playerView.opponent?.rig ?? [];
  const centralEvents = [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])]
    .filter((event) => eventServerId(event.publicPayload) === serverId).length;
  if (serverId === "hq") {
    return semanticCorpHasAgendaInHq(input) || centralEvents >= 2;
  }
  return (
    runnerAgendaPoints >= 5 ||
    centralEvents >= 2 ||
    rig.some((card) => visibleTextHasCentralMultiaccess(card, "rd"))
  );
}

function corpArchivesPressureFromVisibleInput(input: AiDecisionInput): boolean {
  return [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])]
    .some((event) => eventServerId(event.publicPayload) === "archives");
}

function eventServerId(payload: Record<string, unknown>): string | undefined {
  const value =
    payload.serverId ??
    payload.attackedServerId ??
    payload.targetServerId ??
    payload.server;
  return typeof value === "string" ? value : undefined;
}

function visibleTextHasCentralMultiaccess(
  card: VisibleCard,
  serverId: "hq" | "rd",
): boolean {
  const tokens = corpIcePlacementTextTokens(
    [card.title, card.rulesText, card.definitionId].filter(Boolean).join(" "),
  );
  if (serverId === "rd") {
    return (
      tokensIncludePhrase(tokens, ["r", "d"]) &&
      (tokensIncludePhrase(tokens, ["access", "1", "additional"]) ||
        tokensIncludePhrase(tokens, ["access", "additional"]))
    );
  }
  return (
    tokens.includes("hq") &&
    (tokensIncludePhrase(tokens, ["access", "1", "additional"]) ||
      tokensIncludePhrase(tokens, ["access", "additional"]))
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

function cardLooksLikeIce(card: VisibleCard): boolean {
  if (card.known === false) return false;
  if (card.type === "ice") return true;
  const definitionId = card.definitionId;
  if (!definitionId) return false;
  return (
    DEMO_CARDS_BY_ID[definitionId]?.type === "ice" ||
    RUNTIME_CARDS[definitionId]?.type === "ice"
  );
}

function corpIcePlacementActionCreditCost(action: LegalAction): number {
  return (action.costs ?? []).reduce(
    (sum, cost) =>
      sum +
      safeNonNegativeInteger((cost as { credits?: number | undefined }).credits),
    0,
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

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function safeNonNegativeInteger(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
