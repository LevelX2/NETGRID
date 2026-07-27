import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../plans/corp-core-plan-modules";
import {
  assessCorpScoreProtection,
  type KnownCorpScoreProtectionAssessment,
} from "./corp-score-protection-assessment";
import {
  readExactCurrentInstalledCorpIceRezQuote,
  type CorpExactIceRezRouteProjection,
} from "./corp-exact-ice-rez-route";

export type CorpDefenseScoreReserveAssessment = Readonly<{
  preservesReserve: boolean;
  requiredCreditsAfterRez: number;
  availableCreditsAfterRez: number;
  scoreProjectIds: readonly string[];
  immediateRezIceIds: readonly string[];
  currentRunFollowupIceId?: string;
}>;

type ScoreContinuationClaim = Readonly<{
  projectId: string;
  serverId: string;
  agendaPoints: number;
  terminalScore: boolean;
  remainingAdvancementCounters: number;
  requiredCreditsBeforeNextCorpTurn: number;
}>;

type ImmediateRezClaim = Readonly<{
  scoreProjectId: string;
  serverId: string;
  iceId: string;
  credits: number;
}>;

/**
 * `corp.defend_servers` consumes, but never derives, the score continuation
 * cash request. Its only additional work is to reserve exact current ICE rez
 * quotes for score servers the Runner can still attack this turn.
 */
export function assessCorpExactIceRezAgainstScoreReserves(params: {
  input: AiDecisionInput;
  route: CorpExactIceRezRouteProjection;
  scoreProjects: readonly CorpScoreProjectSignal[];
}): CorpDefenseScoreReserveAssessment {
  const { input, route } = params;
  const scoreClaims = scoreContinuationClaims(params.scoreProjects);
  const primaryScoreClaim = scoreClaims[0];
  const activeServerScoreClaim = scoreClaims.find(
    (claim) => claim.serverId === route.targetServerId,
  );
  // A current productive rez on the attacked agenda server prevents the loss
  // that would make the score continuation meaningless. It therefore outranks
  // that same agenda's later advancement cash; the score module revalidates
  // its continuation after the protected run.
  const scoreCredits =
    activeServerScoreClaim === undefined
      ? (primaryScoreClaim?.requiredCreditsBeforeNextCorpTurn ?? 0)
      : 0;
  const activeServerId = input.playerView.run?.attackedServerId;
  const remainingRunnerRuns = safeNonNegativeInteger(
    input.playerView.opponent.clicks,
  );
  const immediateRezClaims = scoreClaims
    .filter((claim) => claim.serverId !== activeServerId)
    .flatMap((claim) => {
      const route = exactStoppingRezForServer(input, claim.serverId);
      return route
        ? [
            {
              scoreProjectId: claim.projectId,
              serverId: claim.serverId,
              iceId: route.iceId,
              credits: route.credits,
            },
          ]
        : [];
    })
    .slice(0, remainingRunnerRuns);
  const currentRunFollowup = routePreventsImmediateAccess(route)
    ? undefined
    : exactCurrentRunFollowupStoppingRez(input, route.sourceCardInstanceId);
  const requiredCreditsAfterRez =
    scoreCredits +
    immediateRezClaims.reduce((sum, claim) => sum + claim.credits, 0) +
    (currentRunFollowup?.credits ?? 0);
  const availableCreditsAfterRez =
    input.playerView.own.credits - route.totalRezCredits;
  return {
    preservesReserve: availableCreditsAfterRez >= requiredCreditsAfterRez,
    requiredCreditsAfterRez,
    availableCreditsAfterRez,
    scoreProjectIds: scoreClaims.map((claim) => claim.projectId),
    immediateRezIceIds: immediateRezClaims.map((claim) => claim.iceId),
    ...(currentRunFollowup
      ? { currentRunFollowupIceId: currentRunFollowup.iceId }
      : {}),
  };
}

function scoreContinuationClaims(
  projects: readonly CorpScoreProjectSignal[],
): ScoreContinuationClaim[] {
  return projects
    .flatMap((project) => {
      const reserve = project.continuationReserve;
      if (
        !reserve ||
        reserve.serverId !== project.serverId ||
        !isNonNegativeSafeInteger(reserve.requiredCreditsBeforeNextCorpTurn) ||
        !isNonNegativeSafeInteger(reserve.remainingAdvancementCounters) ||
        !isNonNegativeSafeInteger(project.agendaPoints)
      ) {
        return [];
      }
      return [
        {
          projectId: project.projectId,
          serverId: reserve.serverId,
          agendaPoints: project.agendaPoints,
          terminalScore: project.terminalScore,
          remainingAdvancementCounters: reserve.remainingAdvancementCounters,
          requiredCreditsBeforeNextCorpTurn:
            reserve.requiredCreditsBeforeNextCorpTurn,
        },
      ];
    })
    .sort(compareScoreContinuationClaims);
}

function compareScoreContinuationClaims(
  left: ScoreContinuationClaim,
  right: ScoreContinuationClaim,
): number {
  if (left.terminalScore !== right.terminalScore)
    return left.terminalScore ? -1 : 1;
  if (
    left.remainingAdvancementCounters !== right.remainingAdvancementCounters
  ) {
    return (
      left.remainingAdvancementCounters - right.remainingAdvancementCounters
    );
  }
  if (left.agendaPoints !== right.agendaPoints)
    return right.agendaPoints - left.agendaPoints;
  return left.projectId.localeCompare(right.projectId);
}

function exactStoppingRezForServer(
  input: AiDecisionInput,
  serverId: string,
): { iceId: string; credits: number } | undefined {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return undefined;
  const routes = server.ice.flatMap((ice) => {
    const quote = readExactCurrentInstalledCorpIceRezQuote({
      input,
      sourceCard: ice,
      targetServerId: server.id,
    });
    if (!quote) return [];
    const after = assessProtectionAfterRezzing(
      input,
      server.ice,
      ice.instanceId,
    );
    return after && after.runnerAccessSuccessProbability.numerator === 0
      ? [{ iceId: ice.instanceId, credits: quote.totalRezCredits }]
      : [];
  });
  return routes.sort(
    (left, right) =>
      left.credits - right.credits || left.iceId.localeCompare(right.iceId),
  )[0];
}

function exactCurrentRunFollowupStoppingRez(
  input: AiDecisionInput,
  currentIceId: string,
): { iceId: string; credits: number } | undefined {
  const position = input.playerView.run?.position;
  if (!position || position.kind !== "ice") return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === position.serverId,
  );
  if (!server) return undefined;
  const futureIce = server.ice.slice(0, Math.max(0, position.iceIndex));
  return futureIce
    .filter((ice) => ice.instanceId !== currentIceId)
    .flatMap((ice) => {
      const quote = readExactCurrentInstalledCorpIceRezQuote({
        input,
        sourceCard: ice,
        targetServerId: server.id,
      });
      if (!quote) return [];
      const after = assessProtectionAfterRezzing(
        input,
        server.ice,
        ice.instanceId,
      );
      return after && after.runnerAccessSuccessProbability.numerator === 0
        ? [{ iceId: ice.instanceId, credits: quote.totalRezCredits }]
        : [];
    })
    .sort(
      (left, right) =>
        left.credits - right.credits || left.iceId.localeCompare(right.iceId),
    )[0];
}

function assessProtectionAfterRezzing(
  input: AiDecisionInput,
  ice: readonly VisibleCard[],
  rezzedIceId: string,
): KnownCorpScoreProtectionAssessment | undefined {
  const result = assessCorpScoreProtection({
    serverIce: ice.map((card) => ({
      instanceId: card.instanceId,
      known: card.known,
      ...(card.definitionId ? { definitionId: card.definitionId } : {}),
      ...(card.rezzed !== undefined ? { rezzed: card.rezzed } : {}),
      ...(card.strength !== undefined ? { strength: card.strength } : {}),
      ...(card.subtypes ? { subtypes: card.subtypes } : {}),
      ...(card.effectiveRunQuote
        ? { effectiveRunQuote: card.effectiveRunQuote }
        : {}),
      ...(card.instanceId === rezzedIceId ? { rezzed: true } : {}),
    })),
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerCredits: input.playerView.opponent.credits,
    maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
  });
  return result.knowledge === "known" ? result : undefined;
}

function routePreventsImmediateAccess(
  route: CorpExactIceRezRouteProjection,
): boolean {
  return route.after.runnerAccessSuccessProbability.numerator === 0;
}

function safeNonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
