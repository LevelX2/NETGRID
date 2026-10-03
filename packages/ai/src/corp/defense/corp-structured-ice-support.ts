import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";

export function corpSupportRetainsFundedIce(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  servers: AiDecisionInput["playerView"]["servers"],
  minimumTargetCount: number,
  matchingIceIds?: ReadonlySet<string>,
): boolean {
  const cost = candidate.costProfile;
  if (
    cost.costKnownStatus !== "known" ||
    cost.additionalCosts.length > 0 ||
    !isFiniteNonNegativeInteger(cost.creditCost)
  )
    return false;
  const remaining = input.playerView.own.credits - cost.creditCost;
  if (remaining < 0) return false;
  const targetCosts = servers
    .flatMap((server) =>
      server.ice.flatMap((ice) => {
        if (matchingIceIds && !matchingIceIds.has(ice.instanceId)) return [];
        if (ice.rezzed) return [0];
        const quote = ice.effectiveRezCostQuote;
        if (
          quote?.complete !== true ||
          quote.context !== "installed" ||
          quote.cardId !== ice.instanceId ||
          quote.targetServerId !== server.id ||
          quote.projectedServerId !== server.id ||
          quote.expiresAtStateVersion !== input.playerView.stateVersion ||
          quote.mandatoryAdditionalCosts.agendaPoints !== 0 ||
          !isFiniteNonNegativeInteger(quote.finalCredits)
        )
          return [];
        return [quote.finalCredits];
      }),
    )
    .sort((a, b) => a - b);
  return (
    targetCosts.length >= minimumTargetCount &&
    targetCosts
      .slice(0, minimumTargetCount)
      .reduce((sum, value) => sum + value, 0) <= remaining
  );
}

export function corpStructuredIceSupportAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  sourceServerId: string,
  hint: ReturnType<(typeof AI_HINTS_BY_CARD)["get"]>,
):
  | {
      productive: boolean;
      serverId: string;
      value: number;
      evidenceCode: string;
    }
  | undefined {
  const profile = hint?.targetProfiles?.find(
    (candidateProfile) =>
      "schemaVersion" in candidateProfile &&
      candidateProfile.schemaVersion === "target-profile-v1" &&
      candidateProfile.targetType === "installed_ice" &&
      (candidateProfile.requiredSubtypes !== undefined ||
        candidateProfile.serverScope !== undefined ||
        candidateProfile.activeRunConstraint !== undefined),
  );
  if (!profile || !("schemaVersion" in profile)) return undefined;

  const sourceServer = input.playerView.servers.find(
    (server) => server.id === sourceServerId,
  );
  const servers =
    profile.serverScope === "source_fort"
      ? sourceServer
        ? [sourceServer]
        : []
      : input.playerView.servers;
  const requiredSubtypes = profile.requiredSubtypes ?? [];
  const matchingIceIds = servers.flatMap((server) =>
    server.ice.flatMap((ice) => {
      const definition = ice.definitionId
        ? CARD_DEFINITIONS_BY_ID[ice.definitionId]
        : undefined;
      const matchesSubtypes = requiredSubtypes.every((subtype) =>
        definition?.subtypes.some(
          (visibleSubtype) =>
            visibleSubtype.trim().toLowerCase().replaceAll(" ", "_") ===
            subtype,
        ),
      );
      return matchesSubtypes ? [ice.instanceId] : [];
    }),
  );
  const minimumTargetCount = Math.max(1, profile.minimumTargetCount ?? 1);
  if (matchingIceIds.length < minimumTargetCount) {
    return {
      productive: false,
      serverId: sourceServerId,
      value: 0,
      evidenceCode: `corp_rez_structured_ice_support_missing_targets:${requiredSubtypes.join("+") || "ice"}:${profile.serverScope ?? "any_visible_server"}`,
    };
  }

  if (
    !corpSupportRetainsFundedIce(
      input,
      candidate,
      servers,
      minimumTargetCount,
      new Set(matchingIceIds),
    )
  ) {
    return {
      productive: false,
      serverId: sourceServerId,
      value: 0,
      evidenceCode:
        "corp_rez_structured_ice_support_has_no_funded_targets_after_payment",
    };
  }

  if (
    profile.activeRunConstraint === "same_fort_upcoming_ice_when_active" &&
    input.playerView.run
  ) {
    const run = input.playerView.run;
    const exactUpcomingEncounter =
      run.attackedServerId === sourceServerId && run.position?.kind === "ice";
    return exactUpcomingEncounter
      ? {
          productive: true,
          serverId: sourceServerId,
          value: 160,
          evidenceCode:
            "corp_rez_structured_ice_support_current_same_fort_encounter",
        }
      : {
          productive: false,
          serverId: sourceServerId,
          value: 0,
          evidenceCode:
            run.attackedServerId === sourceServerId
              ? "corp_rez_structured_ice_support_no_upcoming_same_fort_encounter"
              : "corp_rez_structured_ice_support_current_run_on_other_fort",
        };
  }

  return {
    productive: true,
    serverId: sourceServerId,
    value: 120,
    evidenceCode: `corp_rez_structured_ice_support_matches:${matchingIceIds.join(",")}`,
  };
}
