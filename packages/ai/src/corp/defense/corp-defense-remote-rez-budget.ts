import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
export function corpAvailableRemoteRezCredits(
  input: AiDecisionInput,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
): number {
  if (centralAllocation?.status !== "known") {
    return input.playerView.own.credits;
  }
  const selectedServerId = centralAllocation.selectedServerId;
  if (centralAllocation.evidence[selectedServerId].threat === "none") {
    return input.playerView.own.credits;
  }
  const centralServer = input.playerView.servers.find(
    (server) => server.id === selectedServerId,
  );
  const centralRezCosts =
    centralServer?.ice
      .filter((ice) => ice.rezzed !== true)
      .flatMap((ice) => {
        const quote = ice.effectiveRezCostQuote;
        return quote?.context === "installed" &&
          quote.complete === true &&
          quote.cardId === ice.instanceId &&
          quote.targetServerId === selectedServerId &&
          quote.projectedServerId === selectedServerId &&
          quote.expiresAtStateVersion === input.playerView.stateVersion &&
          quote.mandatoryAdditionalCosts.agendaPoints === 0 &&
          Number.isSafeInteger(quote.finalCredits) &&
          quote.finalCredits >= 0
          ? [quote.finalCredits]
          : [];
      }) ?? [];
  const reserve = centralRezCosts.length > 0 ? Math.min(...centralRezCosts) : 0;
  return Math.max(0, input.playerView.own.credits - reserve);
}
