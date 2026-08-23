import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { CorpFundedRemoteAccessRiskNeed } from "./corp-funded-score-protection";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { compareExactProbabilities } from "./corp-score-protection-assessment";

export const CORP_OPENING_RUSH_SCHEMA_VERSION = "corp-opening-rush-v1";
export const CORP_OPENING_LAST_TURN_SERIAL = 4;

export function isCorpOpeningTurnSerial(
  turnSerial: number | undefined,
): turnSerial is number {
  return (
    Number.isSafeInteger(turnSerial) &&
    turnSerial !== undefined &&
    turnSerial >= 0 &&
    turnSerial <= CORP_OPENING_LAST_TURN_SERIAL
  );
}

export type CorpOpeningRushQuote = Readonly<{
  schemaVersion: typeof CORP_OPENING_RUSH_SCHEMA_VERSION;
  opportunityKey: string;
  agendaInstanceId: string;
  agendaDefinitionId: string;
  targetServerId: string;
  observedAtTurnSerial: number;
  firstContestTurnSerial: number;
  actionId: string;
  installClickCost: number;
  installCreditCost: number;
  scoreReserveCredits: number;
  rezReserveCredits: number;
  clicksAfterDefense: number;
  creditsAfterDefense: number;
  runnerAccessSuccessProbability: Readonly<{
    numerator: number;
    denominator: number;
  }>;
  maximumOpeningRushAccessProbability: Readonly<{
    numerator: 1;
    denominator: 2;
  }>;
  publicRandomBreakerInstanceIds: readonly string[];
  publicStagedBreakerInstanceIds: readonly string[];
  centralThreatStatus: "known_nonacute" | "unknown";
}>;

export type CorpOpeningRushDecision =
  | Readonly<{
      status: "qualified";
      admission: "engine_randomized";
      acceptancePercent: 50;
      quote: CorpOpeningRushQuote;
      evidence: readonly string[];
    }>
  | Readonly<{
      status: "blocked";
      reason:
        | "outside_opening_window"
        | "not_uncertain_p4_install"
        | "missing_exact_action"
        | "missing_existing_remote"
        | "remote_has_no_ice"
        | "unknown_protection_projection"
        | "score_reserve_not_preserved"
        | "risk_above_opening_ceiling"
        | "no_moderate_uncertainty"
        | "public_staged_breaker"
        | "acute_central_threat";
      evidence: readonly string[];
    }>;

type OpeningRushProject = Readonly<{
  projectId: string;
  agendaInstanceId?: string;
  agendaDefinitionId?: string;
  serverId?: string;
  actionIds?: readonly string[];
  phase: string;
  sameTurnCloseout: boolean;
  deadlinePressure?: boolean;
  terminalScore: boolean;
  feasible: boolean;
  protectionNeed?: CorpFundedRemoteAccessRiskNeed;
}>;

export function assessCorpOpeningRush(params: {
  input: AiDecisionInput;
  project: OpeningRushProject;
  candidate: ActionSemanticCandidate | undefined;
  centralDefenseAllocation: CorpCentralDefenseAllocation;
}): CorpOpeningRushDecision | undefined {
  const { input, project, candidate, centralDefenseAllocation } = params;
  const turnSerial = input.playerView.turnSerial;
  if (!isCorpOpeningTurnSerial(turnSerial)) {
    if (turnSerial === undefined || !Number.isSafeInteger(turnSerial)) {
      return undefined;
    }
    return blocked("outside_opening_window", [
      `turn_serial:${turnSerial}`,
      `opening_corp_turn_ceiling:${CORP_OPENING_LAST_TURN_SERIAL}`,
    ]);
  }
  if (
    project.phase !== "install_agenda" ||
    project.sameTurnCloseout ||
    project.deadlinePressure === true ||
    project.terminalScore ||
    project.feasible
  ) {
    return undefined;
  }
  const agendaInstanceId = project.agendaInstanceId;
  const agendaDefinitionId = project.agendaDefinitionId;
  const targetServerId = project.serverId;
  if (
    !candidate ||
    !agendaInstanceId ||
    !agendaDefinitionId ||
    project.actionIds?.length !== 1 ||
    project.actionIds[0] !== candidate.actionId ||
    candidate.sourceCardInstanceId !== agendaInstanceId ||
    candidate.semanticActionType !== "install.card" ||
    !exactActionCost(candidate)
  ) {
    return blocked("missing_exact_action", [
      `project:${project.projectId}`,
      `action:${candidate?.actionId ?? "missing"}`,
    ]);
  }
  const targetServer =
    targetServerId && targetServerId !== "new_remote"
      ? input.playerView.servers.find((server) => server.id === targetServerId)
      : undefined;
  if (!targetServer || !targetServer.id.startsWith("remote_")) {
    return blocked("missing_existing_remote", [
      `target_server:${targetServerId ?? "missing"}`,
    ]);
  }
  if (targetServer.ice.length === 0) {
    return blocked("remote_has_no_ice", [`target_server:${targetServer.id}`]);
  }
  const protectionNeed = project.protectionNeed;
  const baseline = protectionNeed?.baseline;
  if (
    !protectionNeed ||
    protectionNeed.parentProjectId !== project.projectId ||
    protectionNeed.targetServerId !== targetServer.id ||
    protectionNeed.observedAtStateVersion !== input.playerView.stateVersion ||
    baseline?.knowledge !== "known"
  ) {
    return blocked("unknown_protection_projection", [
      `target_server:${targetServer.id}`,
      `knowledge:${baseline?.knowledge ?? "missing"}`,
    ]);
  }
  if (
    !baseline.preservesScoreCreditReserve ||
    !baseline.preservesHardClickReserve ||
    baseline.creditsAfterDefense < 0 ||
    baseline.clicksAfterDefense < 0
  ) {
    return blocked("score_reserve_not_preserved", [
      `preserves_credit_reserve:${baseline.preservesScoreCreditReserve}`,
      `preserves_click_reserve:${baseline.preservesHardClickReserve}`,
      `credits_after_defense:${baseline.creditsAfterDefense}`,
      `clicks_after_defense:${baseline.clicksAfterDefense}`,
    ]);
  }
  const publicStagedBreakerInstanceIds = visiblePublicStagedBreakers(input);
  if (publicStagedBreakerInstanceIds.length > 0) {
    return blocked("public_staged_breaker", [
      `public_staged_breakers:${publicStagedBreakerInstanceIds.join(",")}`,
    ]);
  }
  if (
    acuteCentralDefenseIsUnfunded(
      input,
      centralDefenseAllocation,
      baseline.creditsAfterDefense,
    )
  ) {
    return blocked("acute_central_threat", [
      "central_threat:acute_or_terminal",
    ]);
  }
  const probability = baseline.protection.runnerAccessSuccessProbability;
  const openingCeiling = { numerator: 1, denominator: 2 } as const;
  const aboveOpeningCeiling = compareExactProbabilities(
    probability,
    openingCeiling,
  );
  if (aboveOpeningCeiling === undefined || aboveOpeningCeiling > 0) {
    return blocked("risk_above_opening_ceiling", [
      `runner_access_probability:${probability.numerator}/${probability.denominator}`,
    ]);
  }
  const aboveStrictPolicy = compareExactProbabilities(
    probability,
    protectionNeed.objective.maximumRunnerAccessSuccessProbability,
  );
  if (
    aboveStrictPolicy === undefined ||
    aboveStrictPolicy <= 0 ||
    baseline.protection.protectsScore ||
    baseline.protection.randomBreaks.length === 0
  ) {
    return blocked("no_moderate_uncertainty", [
      `runner_access_probability:${probability.numerator}/${probability.denominator}`,
      `strict_policy:${protectionNeed.objective.maximumRunnerAccessSuccessProbability.numerator}/${protectionNeed.objective.maximumRunnerAccessSuccessProbability.denominator}`,
      `random_breaks:${baseline.protection.randomBreaks.length}`,
    ]);
  }
  const opportunityKey = [
    "opening-rush",
    turnSerial,
    agendaInstanceId,
    targetServer.id,
  ].join(":");
  const quote: CorpOpeningRushQuote = {
    schemaVersion: CORP_OPENING_RUSH_SCHEMA_VERSION,
    opportunityKey,
    agendaInstanceId,
    agendaDefinitionId,
    targetServerId: targetServer.id,
    observedAtTurnSerial: turnSerial,
    firstContestTurnSerial: turnSerial + 1,
    actionId: candidate.actionId,
    installClickCost: candidate.costProfile.clickCost!,
    installCreditCost: candidate.costProfile.creditCost!,
    scoreReserveCredits: baseline.totalScoreReserveCredits,
    rezReserveCredits: baseline.totalSelectedRezCost,
    clicksAfterDefense: baseline.clicksAfterDefense,
    creditsAfterDefense: baseline.creditsAfterDefense,
    runnerAccessSuccessProbability: probability,
    maximumOpeningRushAccessProbability: openingCeiling,
    publicRandomBreakerInstanceIds: baseline.protection.randomBreaks
      .map((entry) => entry.breakerInstanceId)
      .sort(),
    publicStagedBreakerInstanceIds,
    centralThreatStatus:
      centralDefenseAllocation.status === "known"
        ? "known_nonacute"
        : "unknown",
  };
  return {
    status: "qualified",
    admission: "engine_randomized",
    acceptancePercent: 50,
    quote,
    evidence: [
      "opening_rush_admission:engine_randomized",
      "opening_rush_acceptance_percent:50",
      `opening_rush_opportunity:${opportunityKey}`,
      `runner_access_probability:${probability.numerator}/${probability.denominator}`,
    ],
  };
}

function exactActionCost(candidate: ActionSemanticCandidate): boolean {
  return (
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    Number.isSafeInteger(candidate.costProfile.clickCost) &&
    (candidate.costProfile.clickCost ?? -1) >= 1 &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    (candidate.costProfile.creditCost ?? -1) >= 0
  );
}

function visiblePublicStagedBreakers(input: AiDecisionInput): string[] {
  return (input.playerView.specialZones?.setAside ?? [])
    .filter((card) => {
      if (!card.known || !card.definitionId) return false;
      const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
      return definition?.subtypes.some(
        (subtype) => subtype.toLocaleLowerCase("en-US") === "icebreaker",
      );
    })
    .map((card) => card.instanceId)
    .sort();
}

function acuteCentralDefenseIsUnfunded(
  input: AiDecisionInput,
  allocation: CorpCentralDefenseAllocation,
  availableCredits: number,
): boolean {
  if (allocation.status !== "known") return false;
  let requiredCredits = 0;
  for (const serverId of ["hq", "rd"] as const) {
    const threat = allocation.evidence[serverId].threat;
    if (threat !== "acute" && threat !== "terminal") continue;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) return true;
    if (server.ice.some((ice) => ice.rezzed === true)) continue;
    const exactRezCosts = server.ice.flatMap((ice) => {
      const quote = ice.effectiveRezCostQuote;
      return quote?.complete === true &&
        quote.cardId === ice.instanceId &&
        quote.targetServerId === serverId &&
        quote.expiresAtStateVersion === input.playerView.stateVersion &&
        Number.isSafeInteger(quote.finalCredits) &&
        quote.finalCredits >= 0
        ? [quote.finalCredits]
        : [];
    });
    if (exactRezCosts.length === 0) return true;
    requiredCredits += Math.min(...exactRezCosts);
  }
  return requiredCredits > availableCredits;
}

function blocked(
  reason: Extract<CorpOpeningRushDecision, { status: "blocked" }>["reason"],
  evidence: readonly string[],
): CorpOpeningRushDecision {
  return { status: "blocked", reason, evidence };
}
