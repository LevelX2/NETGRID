import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "./role-match";
import { createAiHintsByCard, RUNTIME_CARDS } from "../ai-hints";
import {
  semanticRuntimeCorpScoringWindowAssessment,
  type CorpScoringWindowAssessment,
} from "./semantic-runtime-corp-scoring-window";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "./runner-visible-breaker-coverage";

type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type SemanticRuntimeCorpRemoteScoreDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  hasStabilizingAlternative: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  emptyRemoteCount: (input: AiDecisionInput) => number;
  remoteIsProtected: (server: TServer | undefined) => boolean;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  actionCreditCost: (action: LegalAction) => number;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
  actionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
};

export function semanticRuntimeCorpInstallRemoteScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  roles: string[],
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): number {
  const serverId = dependencies.actionServerId(input, action);
  const server = dependencies.server(input, serverId);
  const placement = action.payload?.placement;
  const installsIce = placement === "ice";
  const hasStabilizingAlternative = dependencies.hasStabilizingAlternative(
    input,
    action,
  );

  if (installsIce && (serverId === "hq" || serverId === "rd")) {
    return semanticRuntimeCorpCentralIceInstallScore(
      input,
      action,
      serverId,
      server,
      dependencies,
    );
  }
  if (installsIce && serverId === "archives") {
    return semanticRuntimeCorpArchivesIceInstallScore(input, server);
  }
  if (!dependencies.isRemoteServerTarget(serverId)) return 0;

  const emptyRemoteCount = dependencies.emptyRemoteCount(input);
  const protectedRemote = dependencies.remoteIsProtected(server);
  const hasRoot = (server?.root.length ?? 0) > 0;
  const targetIsScoreLine = dependencies.actionIsScoreLine(
    input,
    action,
    roles,
  );
  const scoringWindow = semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
    roles,
  );

  if (installsIce) {
    if (scoringWindow?.recommendedNextStep === "build_remote_ice") {
      if (semanticRuntimeCorpDynamicOnlyRemoteIce(scoringWindow)) return 450;
      if ((scoringWindow.dynamicProtectionWeaknessCount ?? 0) > 0) return 800;
      if (scoringWindow.windowKind === "durable") return 1350;
      if (scoringWindow.windowKind === "temporary_safe") return 1150;
    }
    if (dependencies.remoteHasScoreLine(server)) {
      return protectedRemote ? 950 : 1150;
    }
    if (
      !hasRoot &&
      semanticRuntimeCorpShouldBuildProtectedScoreRemote(
        input,
        action,
        dependencies,
        actionSemanticCandidate,
      )
    ) {
      const sourceCard = dependencies.actionSourceCard(input, action);
      if (
        semanticRuntimeCorpRemoteInstallHasDynamicProtectionRisk(sourceCard)
      ) {
        return 450;
      }
      return serverId === "new_remote" ? 1050 : 900;
    }
    let score = serverId === "new_remote" ? -1600 : -900;
    if (!hasRoot) score -= Math.min(1200, emptyRemoteCount * 350);
    if (hasStabilizingAlternative) score -= 500;
    return score;
  }

  if (targetIsScoreLine) {
    const scoreWindowValue =
      semanticRuntimeCorpScoreLineWindowValue(scoringWindow);
    if (scoreWindowValue !== 0) return scoreWindowValue;
    if (protectedRemote) return 950;
    return hasStabilizingAlternative ? -2700 : -1700;
  }

  if (
    placement !== "ice" &&
    semanticRuntimeCorpRemoteSupportNeedsScorelineContext(
      dependencies.actionSourceCard(input, action),
      roles,
      actionSemanticCandidate,
    ) &&
    !semanticRuntimeCorpRemoteHasAdvancementContext(server)
  ) {
    return protectedRemote ? -900 : -1300;
  }

  if (serverId === "new_remote" && emptyRemoteCount > 0) {
    return hasStabilizingAlternative ? -900 : -350;
  }
  return protectedRemote ? 250 : -150;
}

function semanticRuntimeCorpRemoteSupportNeedsScorelineContext(
  card: VisibleCard | undefined,
  roles: readonly string[],
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  const hint = card?.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  const signals = [
    ...roles,
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
    ...semanticRuntimeCorpHintRiskTags(hint),
    ...semanticRuntimeCorpHintTacticSignals(hint),
    ...(actionSemanticCandidate?.cardContextSignals ?? []),
    ...(actionSemanticCandidate?.actionTacticSignals ?? []),
    ...(actionSemanticCandidate?.evidence ?? []),
  ];
  if (
    rolesMatch(signals, [
      "requires_advancement_counter",
      "advancement_counter",
      "scoreline_support",
      "remote_score_support",
    ])
  ) {
    return true;
  }
  const text =
    `${card?.title ?? ""} ${card?.rulesText ?? ""}`.toLocaleLowerCase("en-US");
  return (
    text.includes("advancement counter") &&
    (text.includes("remove") || text.includes("spend"))
  );
}

function semanticRuntimeCorpRemoteHasAdvancementContext(
  server: CorpServerLike | undefined,
): boolean {
  return (
    server?.root.some(
      (card) =>
        card.type === "agenda" ||
        (card.advancementCounters ?? 0) > 0 ||
        typeof card.advancementRequirement === "number",
    ) === true
  );
}

function semanticRuntimeCorpArchivesIceInstallScore<
  TServer extends CorpServerLike,
>(input: AiDecisionInput, server: TServer | undefined): number {
  const iceCount = server?.ice.length ?? 0;
  const acuteHqOrRd =
    semanticRuntimeCorpCentralPressureAssessment(input, "hq").active ||
    semanticRuntimeCorpCentralPressureAssessment(input, "rd").active;
  const agendaInHq = semanticRuntimeCorpHasAgendaInHq(input);
  const archivesAgendaRisk = (input.playerView.own.heapOrArchives ?? []).some(
    (card) => card.known !== false && card.type === "agenda",
  );
  if (archivesAgendaRisk) {
    if (iceCount === 0) return 900;
    if (iceCount === 1) return acuteHqOrRd || agendaInHq ? 450 : 650;
    if (acuteHqOrRd || agendaInHq) return -350;
    return 150;
  }

  const archivesRunPressure =
    semanticRuntimeCorpArchivesRunOrAccessEventCount(input);
  if (archivesRunPressure >= 2) {
    if (iceCount === 0) return 450;
    return acuteHqOrRd || agendaInHq ? -250 : 250;
  }

  if (acuteHqOrRd || agendaInHq) return -450;

  return 75;
}

function semanticRuntimeCorpDynamicOnlyRemoteIce(
  scoringWindow: CorpScoringWindowAssessment,
): boolean {
  return (
    (scoringWindow.dynamicProtectionWeaknessCount ?? 0) > 0 &&
    (scoringWindow.affordableDurableRelevantIceCount ?? 0) === 0
  );
}

function semanticRuntimeCorpRemoteInstallHasDynamicProtectionRisk(
  card: VisibleCard | undefined,
): boolean {
  if (!card?.definitionId) return false;
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  const signals = [
    ...semanticRuntimeCorpHintRiskTags(hint),
    ...semanticRuntimeCorpHintTacticSignals(hint),
  ];
  return rolesMatch(signals, [
    "position_dependent_ice",
    "position_scaling",
    "outer_ice_scaling",
    "same_fort_reposition",
    "mobile_position_change",
  ]);
}

function semanticRuntimeCorpCentralIceInstallScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  serverId: "hq" | "rd",
  server: TServer | undefined,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): number {
  const sourceCard = dependencies.actionSourceCard(input, action);
  const profile = semanticRuntimeCorpCentralIceProfile(sourceCard);
  const firstCentralIce = (server?.ice.length ?? 0) === 0;
  const centralThreat = semanticRuntimeCorpCentralInstallThreat(
    input,
    serverId,
  );
  const rezCost = sourceCard
    ? (dependencies.visibleIceRezCost(sourceCard) ?? sourceCard.rezCost ?? 0)
    : 0;
  const creditsAfterInstall =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const canRez = rezCost <= creditsAfterInstall;
  const visibleCoverage = sourceCard
    ? semanticRuntimeCorpVisibleRunnerCoverageCanBreakIce(
        input,
        sourceCard,
        profile,
        creditsAfterInstall,
        rezCost,
      )
    : false;
  const positionDependentWeakSolo =
    profile.positionDependent && firstCentralIce;

  if (!canRez) {
    if (centralThreat) return firstCentralIce ? 250 : 150;
    return firstCentralIce ? 100 : 50;
  }
  if (profile.hasAccessStop && !visibleCoverage) {
    if (centralThreat) return firstCentralIce ? 1350 : 950;
    return firstCentralIce ? 1050 : 750;
  }
  if (profile.hasAccessStop && visibleCoverage) {
    if (positionDependentWeakSolo) {
      if (centralThreat) return firstCentralIce ? 250 : 150;
      return firstCentralIce ? 150 : 100;
    }
    if (centralThreat) return firstCentralIce ? 650 : 450;
    return firstCentralIce ? 500 : 350;
  }
  if (positionDependentWeakSolo) {
    if (centralThreat) return firstCentralIce ? 200 : 125;
    return firstCentralIce ? 100 : 75;
  }
  if (profile.hasTaxOrDamage) {
    if (centralThreat) return firstCentralIce ? 450 : 250;
    return firstCentralIce ? 250 : 150;
  }
  if (centralThreat) return firstCentralIce ? 700 : 450;
  return firstCentralIce ? 450 : 250;
}

function semanticRuntimeCorpCentralIceProfile(card: VisibleCard | undefined): {
  hasAccessStop: boolean;
  hasTaxOrDamage: boolean;
  positionDependent: boolean;
  modeChoice: boolean;
  definitionId?: string;
} {
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
  const visibleSubroutines = [
    ...(card?.effectiveRunQuote?.subroutines ?? []),
    ...(demoDefinition?.subroutines ?? []),
  ];
  const hasStructuredStop = visibleSubroutines.some((subroutine) => {
    if (
      subroutine.type === "end_the_run" ||
      subroutine.type === "end_the_run_unless_runner_pays" ||
      subroutine.type === "set_run_future_end_the_run_subroutine" ||
      subroutine.type === "set_runner_run_lock_actions"
    ) {
      return true;
    }
    return (
      subroutine.type === "initiate_trace" &&
      (subroutine.traceSuccessEffect?.type === "end_run_and_run_lock" ||
        subroutine.traceSuccessEffect?.type ===
          "end_run_trash_program_and_run_lock")
    );
  });
  const hasHintStop =
    hint?.roles.some((role) =>
      roleMatchesAny(role, ["etr_ice", "end_run", "run_lock"]),
    ) === true ||
    hint?.effects?.some(
      (effect) => effect.kind === "etr" || effect.kind === "run_lock",
    ) === true;
  const hasStructuredTaxOrDamage = visibleSubroutines.some((subroutine) =>
    [
      "do_damage",
      "trash_installed_program",
      "trash_installed_program_unless_runner_pays",
      "initiate_trace",
      "corp_gain_credit",
      "set_run_break_subroutine_cost_modifier",
      "set_run_encounter_tax",
    ].includes(subroutine.type),
  );
  const hasHintTaxOrDamage =
    hint?.roles.some((role) =>
      roleMatchesAny(role, [
        "damage_ice",
        "trace",
        "tax",
        "program_trash",
        "hardware_trash",
      ]),
    ) === true ||
    hint?.effects?.some((effect) =>
      [
        "damage",
        "trace",
        "run_tax",
        "program_trash",
        "hardware_trash",
        "tag",
      ].includes(effect.kind),
    ) === true;
  const hintTacticSignals = semanticRuntimeCorpHintTacticSignals(hint);
  const positionDependent =
    semanticRuntimeCorpHintRiskTags(hint).includes("position_dependent_ice") ||
    hintTacticSignals.some((signal) =>
      roleMatchesAny(signal, ["position_scaling", "outer_ice_scaling"]),
    ) ||
    visibleSubroutines.some((subroutine) =>
      semanticRuntimeCorpRecordHasToken(subroutine, "outside"),
    );
  const modeChoice =
    hintTacticSignals.some((signal) =>
      roleMatchesAny(signal, ["type_choice_or_mode_choice"]),
    ) ||
    semanticRuntimeCorpHintTargetProfiles(hint).some(
      (profile) => profile.kind === "mode_choice",
    );
  return {
    hasAccessStop: hasStructuredStop || hasHintStop,
    hasTaxOrDamage: hasStructuredTaxOrDamage || hasHintTaxOrDamage,
    positionDependent,
    modeChoice,
    ...(definitionId ? { definitionId } : {}),
  };
}

function semanticRuntimeCorpVisibleRunnerCoverageCanBreakIce(
  input: AiDecisionInput,
  ice: VisibleCard,
  profile: ReturnType<typeof semanticRuntimeCorpCentralIceProfile>,
  creditsAfterInstall: number,
  rezCost: number,
): boolean {
  const rawCoverage = (input.playerView.opponent.rig ?? []).some(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      visibleBreakerCardCanAddressIce(card, ice, {
        visibleBreakerRoles,
        visibleCardText: semanticRuntimeCorpVisibleCardCoverageText,
      }),
  );
  if (!rawCoverage) return false;
  if (
    profile.definitionId === "onr_proteus_017_credit-blocks" &&
    profile.modeChoice &&
    creditsAfterInstall >= rezCost + 1 &&
    !semanticRuntimeCorpVisibleRunnerHasBreakerRole(input, "fracter")
  ) {
    return false;
  }
  return true;
}

function semanticRuntimeCorpVisibleRunnerHasBreakerRole(
  input: AiDecisionInput,
  role: "fracter" | "decoder" | "killer",
): boolean {
  return (input.playerView.opponent.rig ?? []).some(
    (card) => card.known !== false && visibleBreakerRoles(card).includes(role),
  );
}

function semanticRuntimeCorpVisibleCardCoverageText(card: VisibleCard): string {
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return [
    card.title,
    card.rulesText,
    card.definitionId,
    ...(card.subtypes ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function semanticRuntimeCorpHintTacticSignals(
  hint: ReturnType<typeof AI_HINTS_BY_CARD.get>,
): string[] {
  const value = (hint as { tacticSignals?: unknown } | undefined)
    ?.tacticSignals;
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function semanticRuntimeCorpHintRiskTags(
  hint: ReturnType<typeof AI_HINTS_BY_CARD.get>,
): string[] {
  const value = (hint as { riskTags?: unknown } | undefined)?.riskTags;
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function semanticRuntimeCorpHintTargetProfiles(
  hint: ReturnType<typeof AI_HINTS_BY_CARD.get>,
): Array<{ kind?: string }> {
  const value = (hint as { targetProfiles?: unknown } | undefined)
    ?.targetProfiles;
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is { kind?: string } =>
          typeof entry === "object" && entry !== null,
      )
    : [];
}

function semanticRuntimeCorpRecordHasToken(
  value: unknown,
  token: string,
): boolean {
  return JSON.stringify(value)
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .includes(token);
}

function semanticRuntimeCorpCentralInstallThreat(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return semanticRuntimeCorpCentralPressureAssessment(input, serverId).active;
}

function semanticRuntimeCorpArchivesRunOrAccessEventCount(
  input: AiDecisionInput,
): number {
  const eventsById = new Map(
    [...(input.playerView.publicEvents ?? []), ...(input.eventTail ?? [])].map(
      (event) => [event.eventId, event],
    ),
  );
  return [...eventsById.values()].filter((event) => {
    const payload = event.publicPayload;
    const actor = typeof payload.actor === "string" ? payload.actor : undefined;
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    return (
      actor === "runner" &&
      (actionType === "start_run" || actionType === "access_card") &&
      semanticRuntimeCorpArchivesServerIdFromPayload(payload) === "archives"
    );
  }).length;
}

function semanticRuntimeCorpArchivesServerIdFromPayload(
  payload: Record<string, unknown>,
): "archives" | undefined {
  const value =
    stringPayload(payload, "serverId") ??
    stringPayload(payload, "attackedServerId") ??
    stringPayload(payload, "targetServerId") ??
    stringPayload(payload, "server") ??
    stringPayload(payload, "serverLabel") ??
    stringPayload(payload, "serverName");
  return normalizeArchivesServerId(value);
}

function normalizeArchivesServerId(
  value: string | undefined,
): "archives" | undefined {
  if (!value) return undefined;
  return value.trim().toLocaleLowerCase("en-US") === "archives"
    ? "archives"
    : undefined;
}

function stringPayload(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function roleMatchesAny(role: string, options: readonly string[]): boolean {
  return rolesMatch([role.toLocaleLowerCase("en-US")], options);
}

export function semanticRuntimeCorpShouldBuildProtectedScoreRemote<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): boolean {
  if (input.side !== "corp") return false;
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return false;
  }
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId)) return false;
  if (
    input.playerView.own.credits <
    semanticRuntimeCorpRemoteActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ) +
      2
  ) {
    return false;
  }
  return (
    semanticRuntimeCorpHasAgendaInHq(input) &&
    !semanticRuntimeCorpHasProtectedRemoteCapacity(input, dependencies)
  );
}

function semanticRuntimeCorpRemoteActionCreditCost<
  TServer extends CorpServerLike,
>(
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const costProfile = actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) return dependencies.actionCreditCost(action);
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return dependencies.actionCreditCost(action);
}

export function semanticRuntimeCorpAdvanceRemoteScore<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): number {
  const serverId = dependencies.actionServerId(input, action);
  if (!dependencies.isRemoteServerTarget(serverId)) return 0;
  const server = dependencies.server(input, serverId);
  if (dependencies.advanceCompletesScore(input, action)) return 1250;
  const scoringWindow = semanticRuntimeCorpScoringWindowAssessment(
    input,
    action,
    dependencies,
  );
  const scoreWindowValue =
    semanticRuntimeCorpScoreLineWindowValue(scoringWindow);
  if (scoreWindowValue !== 0) return scoreWindowValue;
  if (dependencies.remoteIsProtected(server)) return 900;
  return dependencies.hasStabilizingAlternative(input, action) ? -2700 : -1700;
}

function semanticRuntimeCorpScoreLineWindowValue(
  assessment: CorpScoringWindowAssessment | undefined,
): number {
  switch (assessment?.windowKind) {
    case "durable":
      return 1450;
    case "temporary_safe":
      return 1250;
    case "unsafe":
      return -2200;
    default:
      return 0;
  }
}

function semanticRuntimeCorpHasAgendaInHq(input: AiDecisionInput): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.type === "agenda",
  );
}

function semanticRuntimeCorpHasProtectedRemoteCapacity<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
): boolean {
  return input.playerView.servers.some((server) => {
    const candidate = server as unknown as TServer;
    return (
      dependencies.isRemoteServerTarget(server.id) &&
      dependencies.remoteIsProtected(candidate) &&
      server.root.length === 0
    );
  });
}
