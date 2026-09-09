import type { AiDecisionInput } from "@netgrid/shared";
import { assessCorpScoreProtection } from "../runtime/corp-score-protection-assessment";
import { readExactCurrentInstalledCorpIceRezQuote } from "../runtime/corp-exact-ice-rez-route";

import type { CorpBluffDefenseNeed } from "./corp-bluff-defense-types";

/**
 * Existing corp.defend_servers target service. It values one optional layer,
 * not the simultaneous rez of the entire server, and never installs a root.
 * A staged route is bounded to one ordinary Corp turn of credit funding.
 */
export function corpBluffDefenseNeed(
  input: AiDecisionInput,
  serverId: string,
  sourceInstanceId: string,
  reserveCredits: number,
): CorpBluffDefenseNeed | undefined {
  const server = input.playerView.servers.find((s) => s.id === serverId);
  if (
    !server ||
    !serverId.startsWith("remote_") ||
    !Number.isSafeInteger(reserveCredits) ||
    reserveCredits < 0
  )
    return undefined;
  const routes = server.ice.flatMap((ice): CorpBluffDefenseNeed[] => {
    if (!ice.known || !ice.definitionId) return [];
    const rez =
      ice.rezzed === true
        ? undefined
        : readExactCurrentInstalledCorpIceRezQuote({
            input,
            sourceCard: ice,
            targetServerId: serverId,
          });
    if (
      ice.rezzed !== true &&
      (!rez ||
        rez.quote.costKind !== "fixed" ||
        rez.quote.mandatoryAdditionalCosts.agendaPoints !== 0)
    )
      return [];
    const post = ice.effectivePostRezRunQuote;
    const quote =
      ice.rezzed === true
        ? ice.effectiveRunQuote
        : post?.complete &&
            post.cardId === ice.instanceId &&
            post.iceDefinitionId === ice.definitionId &&
            post.targetServerId === serverId &&
            post.projectedServerId === serverId &&
            post.expiresAtStateVersion === input.playerView.stateVersion
          ? post.effectiveRunQuote
          : undefined;
    if (!quote) return [];
    const paid = quote.conditionalEncounterEffects?.flatMap((e) =>
      e.kind === "corp_paid_add_end_the_run_subroutine" &&
      Number.isSafeInteger(e.creditCost) &&
      e.creditCost >= 0
        ? [e.creditCost]
        : [],
    );
    const encounterCredits = paid?.length ? Math.min(...paid) : 0;
    const requiredCredits =
      reserveCredits + (rez?.totalRezCredits ?? 0) + encounterCredits;
    const fundingGap = Math.max(
      0,
      requiredCredits - input.playerView.own.credits,
    );
    if (fundingGap > 3) return [];
    const protection = assessCorpScoreProtection({
      serverIce: [{ ...ice, rezzed: true, effectiveRunQuote: quote }],
      runnerRig: input.playerView.opponent.rig ?? [],
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability: { numerator: 1, denominator: 2 },
    });
    const tax =
      protection.knowledge === "known" &&
      protection.runnerAccessSuccessProbability.numerator > 0
        ? input.playerView.opponent.credits -
          protection.runnerCreditsRemainingOnBestAccessPath
        : undefined;
    const paidExchange = post?.complete ? post.paidEncounterDefense : undefined;
    const productivePaid =
      paidExchange?.creditCost === encounterCredits &&
      paidExchange.exchange.complete &&
      (paidExchange.exchange.runnerBreakUnavailable ||
        !paidExchange.exchange.runnerBreak.canPayFromCurrentCredits ||
        paidExchange.exchange.runnerBreak.normalCreditsRequired >=
          encounterCredits ||
        paidExchange.exchange.runnerBreak.consumedCards.length > 0);
    const outcome =
      typeof tax === "number" && tax > 0
        ? "access_cost"
        : protection.knowledge === "known" &&
            protection.runnerAccessSuccessProbability.numerator === 0
          ? "visible_stop"
          : productivePaid
            ? "paid_encounter_opportunity"
            : undefined;
    if (!outcome) return [];
    return [
      {
        serverId,
        sourceInstanceId,
        iceInstanceId: ice.instanceId,
        observedAtStateVersion: input.playerView.stateVersion,
        requiredCredits,
        fundingGap,
        encounterCredits,
        outcome,
        ...(outcome === "access_cost" && tax !== undefined
          ? { runnerCreditTax: tax }
          : {}),
      },
    ];
  });
  // A contestable, paid path is the preferred bait. A stop is useful pressure,
  // but is never recorded as credits the Runner actually spent.
  return routes.sort(
    (a, b) =>
      Number(b.outcome === "access_cost") -
        Number(a.outcome === "access_cost") ||
      a.fundingGap - b.fundingGap ||
      a.requiredCredits - b.requiredCredits ||
      a.iceInstanceId.localeCompare(b.iceInstanceId),
  )[0];
}
