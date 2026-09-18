import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpExactIceRezRouteProjection } from "../../runtime/corp-exact-ice-rez-route";
import { assessBestFundedCorpScoreProtection } from "../../runtime/corp-funded-score-protection";
import { readCorpCentralAgendaExposure } from "./corp-central-defense-facts-adapter";

export type CorpServerProtectionClaim = Readonly<{
  serverId: string;
  observedAtStateVersion: number;
  expectedPoints: number;
  terminal: boolean;
  credits: number;
  iceIds: readonly string[];
}>;

export function corpServerAgendaExposure(
  input: AiDecisionInput,
  serverId: string,
  leavingHqCardId?: string,
) {
  if (serverId === "hq" || serverId === "rd") {
    return readCorpCentralAgendaExposure(input, serverId, leavingHqCardId);
  }
  const server = input.playerView.servers.find((s) => s.id === serverId);
  if (!server) return undefined;
  const cards =
    serverId === "archives" ? input.playerView.own.heapOrArchives : server.root;
  if (
    cards.some(
      (c) =>
        !c.known ||
        !c.type ||
        (c.type === "agenda" && !Number.isSafeInteger(c.agendaPoints)),
    )
  )
    return undefined;
  const points = cards.reduce(
    (sum, c) => sum + (c.type === "agenda" ? c.agendaPoints! : 0),
    0,
  );
  return { expectedPoints: points, maximumPoints: points };
}

/** A reserve exists only for a fully quoted stopping path, not for ICE count. */
export function corpServerProtectionClaims(
  input: AiDecisionInput,
  leavingHqCardId?: string,
): {
  claims: CorpServerProtectionClaim[];
  unknownServerIds: string[];
} {
  const claims: CorpServerProtectionClaim[] = [];
  const unknownServerIds: string[] = [];
  for (const server of input.playerView.servers) {
    const exposure = corpServerAgendaExposure(
      input,
      server.id,
      leavingHqCardId,
    );
    if (!exposure) {
      unknownServerIds.push(server.id);
      continue;
    }
    if (exposure.maximumPoints === 0) continue;
    const protection = assessBestFundedCorpScoreProtection({
      serverIce: server.ice,
      runnerRig: input.playerView.opponent.rig ?? [],
      runnerSetAside: input.playerView.specialZones?.setAside ?? [],
      runnerCredits: input.playerView.opponent.credits,
      ...(input.playerView.phase === "run"
        ? {
            runnerPreparationCreditClicks: Math.max(
              0,
              input.playerView.opponent.clicks - 1,
            ),
          }
        : {}),
      ...(input.playerView.phase !== "run" &&
      input.playerView.runnerNextTurnCreditClicks !== undefined
        ? {
            runnerPreparationCreditClicks:
              input.playerView.runnerNextTurnCreditClicks,
          }
        : {}),
      ...(input.playerView.opponent.memoryUsed !== undefined
        ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
        : {}),
      ...(input.playerView.opponent.memoryLimit !== undefined
        ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
        : {}),
      targetServerId: server.id,
      observedAtStateVersion: input.playerView.stateVersion,
      availableCorpCredits: input.playerView.own.credits,
      availableCorpClicks: input.playerView.own.clicks,
      availableCorpAgendaPoints: input.playerView.own.agendaPoints,
      scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
    if (protection.knowledge !== "known") {
      unknownServerIds.push(server.id);
      continue;
    }
    const credits = protection.minimumSatisfyingRezCost;
    const costs = protection.minimumSatisfyingRezCosts;
    if (
      credits === undefined ||
      !costs ||
      credits === 0 ||
      costs.some((c) => (c.agendaPoints ?? 0) !== 0)
    )
      continue;
    claims.push({
      serverId: server.id,
      observedAtStateVersion: input.playerView.stateVersion,
      expectedPoints: exposure.expectedPoints,
      terminal:
        exposure.maximumPoints >=
        input.playerView.agendaPointsToWin -
          input.playerView.opponent.agendaPoints,
      credits,
      iceIds: costs.map((c) => c.iceInstanceId),
    });
  }
  claims.sort(
    (a, b) =>
      Number(b.terminal) - Number(a.terminal) ||
      b.expectedPoints - a.expectedPoints ||
      a.credits - b.credits ||
      a.serverId.localeCompare(b.serverId),
  );
  return { claims, unknownServerIds };
}

export type CorpRezOpportunityAssessment = Readonly<{
  preservesReserve: boolean;
  requiredCredits: number;
  claims: readonly CorpServerProtectionClaim[];
  reason:
    | "no_followup_click_run"
    | "current_terminal_access"
    | "current_access_preferred"
    | "no_certified_alternative"
    | "all_alternatives_funded"
    | "funded_alternative_protection"
    | "assessment_unknown";
  unknownServerIds: readonly string[];
}>;

/**
 * Compare the current access reduction with known later opportunities before
 * labelling this rez productive. No opponent target probability is invented.
 * One later run shares the same cash across alternative targets; multiple
 * attacks require the sum of the most expensive distinct reserved paths.
 */
export function assessCorpRezOpportunityCost(
  input: AiDecisionInput,
  route: Omit<CorpExactIceRezRouteProjection, "actionId">,
  creditsAfterRez: number,
): CorpRezOpportunityAssessment {
  const clicks = input.playerView.opponent.clicks;
  const result = (
    reason: CorpRezOpportunityAssessment["reason"],
    claims: readonly CorpServerProtectionClaim[] = [],
    requiredCredits = 0,
    unknownServerIds: readonly string[] = [],
  ): CorpRezOpportunityAssessment => ({
    reason,
    claims,
    requiredCredits,
    unknownServerIds,
    preservesReserve: creditsAfterRez >= requiredCredits,
  });
  if (!Number.isSafeInteger(clicks) || clicks < 0)
    return { ...result("assessment_unknown"), preservesReserve: false };
  const current = corpServerAgendaExposure(input, route.targetServerId);
  const stops =
    route.accessBlock !== undefined ||
    route.traceAccessBlock !== undefined ||
    route.after?.runnerAccessSuccessProbability.numerator === 0;
  const followupRuns =
    clicks +
    (input.playerView.run?.pendingSequenceRunCount ?? 0) +
    Number(
      input.playerView.run?.followupRunOpportunity === "after_run" ||
        (!stops &&
          input.playerView.run?.followupRunOpportunity ===
            "after_successful_run"),
    );
  const accessReduction =
    route.before && route.after
      ? Math.max(
          0,
          route.before.runnerAccessSuccessProbability.numerator /
            route.before.runnerAccessSuccessProbability.denominator -
            route.after.runnerAccessSuccessProbability.numerator /
              route.after.runnerAccessSuccessProbability.denominator,
        )
      : Number(stops);
  if (
    current &&
    current.maximumPoints >=
      input.playerView.agendaPointsToWin -
        input.playerView.opponent.agendaPoints &&
    stops &&
    accessReduction > 0
  ) {
    return result("current_terminal_access");
  }
  if (followupRuns === 0) return result("no_followup_click_run");
  const { claims, unknownServerIds } = corpServerProtectionClaims(input);
  const alternatives = claims.filter(
    (claim) =>
      claim.serverId !== route.targetServerId &&
      claim.credits <= input.playerView.own.credits,
  );
  // This comparison owns only certified competing protection. An independent
  // exact current-run route needs no agenda comparison when there is no such
  // alternative. Unknown servers remain explicit, never invented reserves.
  if (alternatives.length === 0)
    return result("no_certified_alternative", [], 0, unknownServerIds);
  if (!current) {
    const allAlternativeCredits = reserveForRunCount(
      alternatives,
      followupRuns,
    );
    // No ranking is needed when the action preserves every certified claim.
    if (creditsAfterRez >= allAlternativeCredits)
      return result(
        "all_alternatives_funded",
        alternatives,
        allAlternativeCredits,
        unknownServerIds,
      );
    return {
      ...result("assessment_unknown", [], 0, unknownServerIds),
      preservesReserve: false,
    };
  }
  const currentLossReduction = current.expectedPoints * accessReduction;
  const retained: CorpServerProtectionClaim[] = [];
  for (const claim of alternatives) {
    if (!claim.terminal && claim.expectedPoints <= currentLossReduction)
      continue;
    const reserve = reserveForRunCount([...retained, claim], followupRuns);
    // An impossible portfolio never creates a hard floor or a hoarding loop.
    if (reserve <= input.playerView.own.credits) retained.push(claim);
  }
  return result(
    retained.length
      ? "funded_alternative_protection"
      : "current_access_preferred",
    retained,
    reserveForRunCount(retained, followupRuns),
    unknownServerIds,
  );
}

export function reserveForRunCount(
  claims: readonly CorpServerProtectionClaim[],
  runs: number,
): number {
  return claims
    .map((c) => c.credits)
    .sort((a, b) => b - a)
    .slice(0, runs)
    .reduce((sum, c) => sum + c, 0);
}

/** Main-phase consumer budget; only currently fundable protection is reserved. */
export function corpFundedCentralProtectionReserve(
  input: AiDecisionInput,
  leavingHqCardId?: string,
  competingAgendaPoints?: number,
): number {
  const { claims } = corpServerProtectionClaims(input, leavingHqCardId);
  const durableCredits =
    input.playerView.own.credits -
    (input.playerView.own.installRezOnlyCredits ?? 0);
  const competingTerminal =
    competingAgendaPoints !== undefined &&
    competingAgendaPoints >=
      input.playerView.agendaPointsToWin -
        input.playerView.opponent.agendaPoints;
  let reserve = 0;
  for (const claim of claims) {
    if (claim.serverId !== "hq" && claim.serverId !== "rd") continue;
    // Preparing an agenda's exact protected scoring route must not subordinate
    // that agenda to a lower-risk central. Score supplies facts, Defense ranks.
    if (
      competingAgendaPoints !== undefined &&
      ((competingTerminal && !claim.terminal) ||
        (competingTerminal === claim.terminal &&
          claim.expectedPoints <= competingAgendaPoints))
    )
      continue;
    if (reserve + claim.credits <= durableCredits) reserve += claim.credits;
  }
  return reserve;
}
