import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "./role-match";
import { createAiHintsByCard } from "../ai-hints";
import { buildCorpIceCardPlacementProfile } from "./corp-ice-placement/corp-ice-placement";
import { visibleCardDefinition } from "./card-definition-lookup";
import {
  semanticRuntimeCorpScoringWindowAssessment,
  type CorpScoringWindowAssessment,
} from "./semantic-runtime-corp-scoring-window";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
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
    if (
      serverId === "new_remote" &&
      semanticRuntimeCorpHasActiveRemoteScoreline(input)
    ) {
      return -2400;
    }
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
    if (
      !hasRoot &&
      semanticRuntimeCorpShouldMaintainPrimaryScoreRemote(
        input,
        action,
        server,
        dependencies,
        actionSemanticCandidate,
      )
    ) {
      const sourceCard = dependencies.actionSourceCard(input, action);
      if (
        semanticRuntimeCorpRemoteInstallHasDynamicProtectionRisk(sourceCard)
      ) {
        return 350;
      }
      return 850;
    }
    let score = serverId === "new_remote" ? -1600 : -900;
    if (!hasRoot) score -= Math.min(1200, emptyRemoteCount * 350);
    if (hasStabilizingAlternative) score -= 500;
    return score;
  }

  if (
    serverId === "new_remote" &&
    semanticRuntimeCorpHasActiveRemoteScoreline(input)
  ) {
    return -2600;
  }

  if (targetIsScoreLine) {
    const scoreWindowValue =
      semanticRuntimeCorpScoreLineWindowValue(scoringWindow);
    if (scoreWindowValue !== 0) return scoreWindowValue;
    if (protectedRemote) return 950;
    return hasStabilizingAlternative ? -2700 : -1700;
  }

  const supportSourceCard =
    placement !== "ice"
      ? dependencies.actionSourceCard(input, action)
      : undefined;
  const remoteSupportNeedsScorelineContext =
    placement !== "ice" &&
    semanticRuntimeCorpRemoteSupportNeedsScorelineContext(
      supportSourceCard,
      roles,
      actionSemanticCandidate,
    );

  if (
    remoteSupportNeedsScorelineContext &&
    !semanticRuntimeCorpRemoteHasAdvancementContext(server)
  ) {
    return protectedRemote ? -900 : -1300;
  }

  if (
    remoteSupportNeedsScorelineContext &&
    semanticRuntimeCorpRemoteHasAdvancementContext(server) &&
    semanticRuntimeCorpRemoteSupportInstallIsContestable(
      input,
      server,
      supportSourceCard,
    )
  ) {
    return -1400;
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
  const tokens = semanticRuntimeCorpTextTokens([card?.title, card?.rulesText]);
  return (
    (semanticRuntimeCorpTokensIncludePhrase(tokens, [
      "advancement",
      "counter",
    ]) ||
      semanticRuntimeCorpTokensIncludePhrase(tokens, [
        "advancement",
        "counters",
      ])) &&
    semanticRuntimeCorpTokensIncludeAny(tokens, ["remove", "spend"])
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

function semanticRuntimeCorpRemoteSupportInstallIsContestable(
  input: AiDecisionInput,
  server: CorpServerLike | undefined,
  sourceCard: VisibleCard | undefined,
): boolean {
  if (!server) return false;
  const visibleRunnerContestCredits =
    input.playerView.opponent.credits +
    visibleRunnerRunCreditPool(input.playerView.opponent.rig ?? []) +
    semanticRuntimeCorpRunnerExposureCredits(input);
  const trashCost = semanticRuntimeCorpVisibleTrashCost(sourceCard);
  if (server.ice.length === 0) {
    return visibleRunnerContestCredits >= trashCost;
  }
  const projectedIce = server.ice.map((ice) => ({
    ...ice,
    known: ice.known !== false,
    rezzed: true,
  }));
  const assessment = assessKnownRezzedIcePath(
    projectedIce,
    input.playerView.opponent.rig ?? [],
    visibleRunnerContestCredits,
    sourceCard ? [...server.root, sourceCard] : [...server.root],
  );
  return (
    assessment.canReachAccess &&
    assessment.creditsAfterPath >= Math.max(0, trashCost)
  );
}

function semanticRuntimeCorpRunnerExposureCredits(
  input: AiDecisionInput,
): number {
  const visibleClicks = input.playerView.opponent.clicks;
  const availableRunnerClicks =
    typeof visibleClicks === "number" && Number.isFinite(visibleClicks)
      ? Math.max(0, Math.floor(visibleClicks))
      : 4;
  return Math.max(3, availableRunnerClicks - 1);
}

function semanticRuntimeCorpVisibleTrashCost(
  card: VisibleCard | undefined,
): number {
  if (!card) return 0;
  const definition = visibleCardDefinition(card);
  const trashCost = card.trashCost ?? definition?.trashCost;
  return typeof trashCost === "number" && Number.isFinite(trashCost)
    ? Math.max(0, Math.floor(trashCost))
    : 0;
}

function visibleRunnerRunCreditPool(rig: readonly VisibleCard[]): number {
  return rig.reduce((sum, card) => {
    if (card.known === false) return sum;
    return (
      sum +
      (card.counterDisplays ?? []).reduce((cardSum, display) => {
        const uses = display.creditPool?.uses ?? [];
        if (
          uses.includes("using_icebreaker_during_run") ||
          uses.includes("using_icebreaker_during_run_non_noisy") ||
          uses.includes("using_killer_during_run")
        ) {
          return cardSum + Math.max(0, Math.floor(display.amount));
        }
        return cardSum;
      }, 0)
    );
  }, 0);
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
    if (iceCount === 0) return acuteHqOrRd || agendaInHq ? 350 : 550;
    return acuteHqOrRd || agendaInHq ? -700 : -350;
  }

  const archivesRunPressure =
    semanticRuntimeCorpArchivesRunOrAccessEventCount(input);
  if (archivesRunPressure >= 2) {
    return acuteHqOrRd || agendaInHq ? -900 : -650;
  }

  if (acuteHqOrRd || agendaInHq) return -950;

  return -650;
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
  return buildCorpIceCardPlacementProfile(card).positionDependent;
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
  const yieldsToActiveScoreline =
    semanticRuntimeCorpCentralInstallYieldsToActiveScoreline(
      input,
      serverId,
      server,
    );

  if (yieldsToActiveScoreline) {
    if (!canRez) return -350;
    if (profile.hasAccessStop && !visibleCoverage) {
      return centralThreat ? 250 : 100;
    }
    if (profile.hasAccessStop && visibleCoverage) {
      return centralThreat ? 100 : 50;
    }
    if (profile.hasTaxOrDamage) return centralThreat ? 50 : 0;
    return 0;
  }

  if (!canRez) {
    if (
      semanticRuntimeCorpHasActiveRemoteScoreline(input) &&
      creditsAfterInstall <= 0
    ) {
      return -1500;
    }
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

function semanticRuntimeCorpCentralInstallYieldsToActiveScoreline<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
  server: TServer | undefined,
): boolean {
  if (!semanticRuntimeCorpHasActiveRemoteScoreline(input)) return false;
  if ((server?.ice.length ?? 0) === 0) return false;
  const pressure = semanticRuntimeCorpCentralPressureAssessment(
    input,
    serverId,
  );
  return !semanticRuntimeCorpCentralInstallPressureIsCritical(input, pressure);
}

function semanticRuntimeCorpCentralInstallPressureIsCritical(
  input: AiDecisionInput,
  pressure: ReturnType<typeof semanticRuntimeCorpCentralPressureAssessment>,
): boolean {
  if (
    pressure.serverId === "rd" &&
    pressure.successfulAccessEvents >= 2 &&
    (pressure.visibleVirusPressure ||
      pressure.visibleMultiaccess ||
      pressure.eventMultiaccess ||
      pressure.runOrAccessEvents >= 6)
  ) {
    return true;
  }
  const runnerAgendaPoints = input.playerView.opponent?.agendaPoints ?? 0;
  return (
    runnerAgendaPoints >= 5 &&
    (pressure.hqAgendaExposure ||
      pressure.visibleMultiaccess ||
      pressure.visibleVirusPressure ||
      pressure.eventMultiaccess ||
      pressure.successfulAccessEvents > 0)
  );
}

export function semanticRuntimeCorpCentralIceProfile(
  card: VisibleCard | undefined,
): {
  hasAccessStop: boolean;
  hasTaxOrDamage: boolean;
  positionDependent: boolean;
  modeChoice: boolean;
  definitionId?: string;
} {
  const profile = buildCorpIceCardPlacementProfile(card);
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
    ...(profile.iceDefinitionId
      ? { definitionId: profile.iceDefinitionId }
      : {}),
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

function semanticRuntimeCorpTextTokens(values: readonly unknown[]): string[] {
  return values.flatMap((value) =>
    typeof value === "string"
      ? value
          .toLocaleLowerCase("en-US")
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
      : [],
  );
}

function semanticRuntimeCorpTokensIncludeAny(
  tokens: readonly string[],
  accepted: readonly string[],
): boolean {
  const acceptedSet = new Set(accepted);
  return tokens.some((token) => acceptedSet.has(token));
}

function semanticRuntimeCorpTokensIncludePhrase(
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

function semanticRuntimeCorpShouldMaintainPrimaryScoreRemote<
  TServer extends CorpServerLike,
>(
  input: AiDecisionInput,
  action: LegalAction,
  server: TServer | undefined,
  dependencies: SemanticRuntimeCorpRemoteScoreDependencies<TServer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): boolean {
  if (input.side !== "corp") return false;
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return false;
  }
  const serverId = dependencies.actionServerId(input, action);
  if (
    !dependencies.isRemoteServerTarget(serverId) ||
    serverId === "new_remote"
  ) {
    return false;
  }
  if (!server || server.root.length > 0) return false;
  const iceCount = server.ice.length;
  if (iceCount <= 0 || iceCount >= 3) return false;
  if (!semanticRuntimeCorpHasAgendaInHq(input)) return false;
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
  return true;
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

function semanticRuntimeCorpHasActiveRemoteScoreline(
  input: AiDecisionInput,
): boolean {
  return input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      server.root.some(
        (card) =>
          card.known !== false &&
          (card.type === "agenda" ||
            visibleCardDefinition(card)?.type === "agenda"),
      ),
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
