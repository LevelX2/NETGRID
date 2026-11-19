import { cardImplementationForDefinitionId } from "@netgrid/engine";
import { isRemoteServerId, type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import { corpGenericDefensePriorityClass } from "../../plans/corp-defense-funding-contract";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  corpReservedScoreServerIds,
  corpScoreProjectReservesSlotAfterCampaign,
} from "../../runtime/corp-scoreline/score-hand-support";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
import type { CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { corpSpendConsumesKnownCentralRezReserve } from "./corp-defense-domain-signals";
import { corpRedirectServerExposure } from "./defense-choice-signals";
import { corpCardRoutePreservesScoreReserve } from "./defense-discovery-support";

function redirectToSourceFort(definitionId: number) {
  const utility = cardImplementationForDefinitionId(definitionId)?.corpUtility;
  return utility?.kind === "start_run_redirect_to_source_fort" &&
    utility.timing === "run_start" &&
    utility.redirectTarget === "source_fort"
    ? utility
    : undefined;
}

export function corpStartRunRedirectInstallSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  allocation: CorpCentralDefenseAllocation | undefined,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpGenericDefenseSignal | undefined {
  const view = input.playerView;
  if (
    input.side !== "corp" ||
    view.timingPoint !== "corp_action.main" ||
    candidate.semanticActionType !== "install.card" ||
    candidate.stateVersion !== view.stateVersion ||
    allocation?.status !== "known" ||
    candidate.sourceDefinitionId === undefined
  )
    return undefined;
  const definitionId = candidate.sourceDefinitionId;
  const utility = redirectToSourceFort(definitionId);
  if (!utility) return undefined;
  const central = allocation.selectedServerId;
  const risk = allocation.evidence[central];
  if (
    risk.threat === "none" ||
    risk.expectedAgendaLoss.numerator <= 0 ||
    !cardImplementationForDefinitionId(definitionId)?.installCapabilities?.some(
      (cap) => cap.kind === "rez_on_install" && cap.installOnlyIfRezAffordable,
    )
  )
    return undefined;

  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const source = view.own.gripOrHq.find(
    (c) => c.instanceId === candidate.sourceCardInstanceId,
  );
  const target = action?.payload?.serverId;
  if (
    !source?.known ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    source.type !== "asset" ||
    source.definitionId !== definitionId ||
    action?.type !== "install_card" ||
    action.side !== "corp" ||
    action.source !== source.instanceId ||
    action.payload?.cardId !== source.instanceId ||
    action.payload.placement !== "root" ||
    action.expiresAtStateVersion !== view.stateVersion ||
    action.timingPoint !== view.timingPoint ||
    (target !== "new_remote" && !isRemoteServerId(target)) ||
    candidate.costProfile.costKnownStatus !== "known" ||
    candidate.costProfile.additionalCosts.length > 0 ||
    !hasExactNonNegativeCostProfile(candidate)
  )
    return undefined;
  const server = view.servers.find((s) => s.id === target);
  if (
    target !== "new_remote" &&
    (!server ||
      server.root.length > 0 ||
      corpReservedScoreServerIds(
        input,
        scoreProjects.filter((p) =>
          corpScoreProjectReservesSlotAfterCampaign(input, p),
        ),
      ).has(target))
  )
    return undefined;
  if (
    view.servers.some(
      (s) =>
        isRemoteServerId(s.id) &&
        s.root.some(
          (c) =>
            c.known &&
            c.rezzed &&
            c.definitionId !== undefined &&
            redirectToSourceFort(c.definitionId),
        ),
    )
  )
    return undefined;

  // The install action already pays the mandatory rez. Reserve one actual
  // activation in addition to the existing funding claims.
  const cost = candidate.costProfile.creditCost! + utility.cost.credits;
  const after = view.own.credits - cost;
  const clicksAfter = view.own.clicks - candidate.costProfile.clickCost!;
  if (
    after < 0 ||
    clicksAfter < 0 ||
    corpSpendConsumesKnownCentralRezReserve(
      input,
      allocation,
      after,
      clicksAfter,
    ) ||
    scoreProjects.some(
      (p) =>
        (p.continuationReserve?.requiredCreditsBeforeNextCorpTurn ?? 0) > after,
    )
  )
    return undefined;

  // Both empty destinations acquire the same redirect asset. Existing
  // rezzed ICE can make the bait more expensive for the Runner to trash.
  const destinationExposure =
    target === "new_remote"
      ? 0
      : corpRedirectServerExposure(input, target, allocation);
  const signal: CorpGenericDefenseSignal = {
    kind: "generic",
    defenseId: `start-run-redirect-install:${source.instanceId}:${target}`,
    phase: "install_defense_support",
    serverId: target,
    protectedCentralServerId: central,
    centralPressure: risk.threat,
    sourceDefinitionIds: [definitionId],
    actionIds: [action.actionId],
    urgent: risk.threat === "acute" || risk.threat === "terminal",
    value:
      corpRedirectServerExposure(input, central, allocation) -
      destinationExposure,
    evidenceCode: `funded_redirect_install_for_exposed_central:${central}:${target}`,
  };
  const funding = corpCardRoutePreservesScoreReserve(
    input,
    {
      ...candidate,
      costProfile: { ...candidate.costProfile, creditCost: cost },
    },
    target,
    scoreProjects,
    corpGenericDefensePriorityClass([signal]),
  );
  return funding.preservesReserve ? signal : undefined;
}
