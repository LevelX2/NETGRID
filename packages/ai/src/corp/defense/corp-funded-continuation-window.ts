import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import {
  corpIceInstallHasCurrentCompleteRezQuote,
  corpGlobalDefenseInstallRouteAssessment,
  corpQualitativeIceStagingSignal,
} from "./corp-defense-domain-signals";
import { CORP_DEFENSE_DOMAIN_SIGNAL_FACTS } from "./defense-discovery-support";

/** Defense owns the value of an installation after an exact current payout.
 * Only its payment budget is projected. Current geometry, Engine quotes and
 * LegalActions stay bound to the observed state; this authorizes no future action.
 */
export function corpFundedDefenseContinuationWindow(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"];
  available: Readonly<{ credits: number; clicks: number }>;
}) {
  const actionIds: string[] = [];
  const unknown: string[] = [];
  for (const candidate of params.candidates) {
    if (candidate.actionType !== "install_card") continue;
    const action = params.input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    const serverId = action?.payload?.serverId;
    if (
      action?.payload?.placement !== "ice" ||
      typeof serverId !== "string" ||
      serverId === "new_remote" ||
      !params.input.playerView.servers.some((s) => s.id === serverId)
    )
      continue;
    if (
      !CORP_DEFENSE_DOMAIN_SIGNAL_FACTS.hasExactNonNegativeCostProfile(
        candidate,
      )
    ) {
      unknown.push(`${candidate.actionId}:install_cost_unknown`);
      continue;
    }
    if (
      candidate.costProfile.clickCost! > params.available.clicks ||
      candidate.costProfile.creditCost! > params.available.credits
    )
      continue;
    if (
      !corpIceInstallHasCurrentCompleteRezQuote(
        params.input,
        action,
        action.source,
        serverId,
      )
    ) {
      unknown.push(
        `${candidate.actionId}:current_post_install_rez_quote_unknown`,
      );
      continue;
    }
    const assessment = corpGlobalDefenseInstallRouteAssessment(
      params.input,
      candidate,
      serverId,
      params.centralAllocation,
      CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
      params.available,
    );
    const staging = corpQualitativeIceStagingSignal(
      params.input,
      candidate,
      serverId,
      params.centralAllocation,
      CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
      undefined,
      params.available,
    );
    if (
      staging ||
      (assessment.knowledge === "known" &&
        assessment.disposition !== "effect_missing")
    )
      actionIds.push(candidate.actionId);
    else if (assessment.knowledge === "unknown")
      unknown.push(`${candidate.actionId}:${assessment.evidenceCode}`);
  }
  return { actionIds, unknown };
}
