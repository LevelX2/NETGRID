import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { turnKey } from "../../runtime/runtime-identifiers";
import {
  corpIceInstallHasCurrentCompleteRezQuote,
  corpGlobalDefenseInstallRouteAssessment,
  corpQualitativeIceStagingSignal,
} from "./corp-defense-domain-signals";
import {
  CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
  corpLayeredIceStagingParent,
} from "./defense-discovery-support";

/** A consumed optional search receipt preserves cadence memory, not a current
 * action claim. Every other defense signal, including incomplete receipts,
 * continues to reserve its window.
 */
export function corpDefenseSignalReservesActionWindow(
  input: AiDecisionInput,
  signal: CorpCorePlanDomain["defenseNeeds"][number],
): boolean {
  if (
    signal.kind !== "generic" ||
    signal.phase !== "draw_for_ice" ||
    signal.actionIds?.length !== 0 ||
    signal.urgent ||
    signal.value !== 0
  )
    return true;
  const receipt = signal.drawAttemptState;
  return !(
    receipt?.turnKey === turnKey(input) &&
    receipt.remainingAttempts === 0 &&
    Number.isSafeInteger(receipt.selectedAtStateVersion) &&
    receipt.selectedAtStateVersion !== undefined &&
    receipt.selectedAtStateVersion >= 0 &&
    receipt.selectedAtStateVersion < input.playerView.stateVersion
  );
}

/** Defense owns the value of an installation after an exact current payout.
 * Only its payment budget is projected. Current geometry, Engine quotes and
 * LegalActions stay bound to the observed state; this authorizes no future action.
 */
export function corpFundedDefenseContinuationWindow(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"];
  remoteProjects: CorpCorePlanDomain["remoteProjects"];
  scoreProjects: CorpCorePlanDomain["scoreProjects"];
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
      typeof serverId !== "string"
    )
      continue;
    const parent = corpLayeredIceStagingParent(
      params.scoreProjects,
      params.remoteProjects,
      serverId,
      false,
      false,
    );
    if (serverId === "new_remote") {
      // This budget-only service does not project a new server. An exact
      // offered head for a bound Remote need therefore keeps its veto until
      // that whole continuation can be assessed; a need without a head cannot.
      if (parent)
        unknown.push(`${candidate.actionId}:bound_new_remote_window_unassessed`);
      continue;
    }
    if (!params.input.playerView.servers.some((s) => s.id === serverId))
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
      parent,
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
