import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import type { CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { candidateTargetIds } from "../../actions/action-candidate-facts";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import {
  isServerId,
  requireVisibleCandidateSource,
  serverForInstalledCard,
  visibleKnownCardType,
} from "../../runtime/visible-action-facts";
import { assessCorpExactIceRezAgainstScoreReserves } from "./corp-defense-score-reserve";
import { corpCardRoutePreservesScoreReserve } from "./defense-discovery-support";
import {
  corpExactCardRezSupportAssessment,
  corpFutureEncounterRezSupportAssessment,
  corpRezEstablishesPersistentDefenseSupport,
} from "./defense-run-response";

export function buildCorpRezDefenseSignals(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: CorpScoreProjectSignal[],
  ambushes: CorpPlanDomain["ambushes"],
): CorpDefenseSignal[] {
  const visibleSource = requireVisibleCandidateSource(input, candidate);
  const targetId = candidate.sourceCardInstanceId;
  const rezServerId =
    (targetId ? serverForInstalledCard(input, targetId) : undefined) ??
    candidateTargetIds(candidate).find(isServerId) ??
    input.playerView.run?.attackedServerId ??
    "unknown";
  const sourceType = visibleKnownCardType(input, visibleSource);
  const persistentDefenseSupport =
    sourceType === "upgrade" &&
    corpRezEstablishesPersistentDefenseSupport(input, candidate, rezServerId);
  const futureEncounterDefenseSupport =
    sourceType === "upgrade" && visibleSource
      ? corpFutureEncounterRezSupportAssessment(
          input,
          candidate,
          visibleSource,
          rezServerId,
        )
      : undefined;
  const exactCardRezSupportWithoutReserve =
    sourceType !== "ice"
      ? corpExactCardRezSupportAssessment(
          input,
          candidate,
          visibleSource,
          rezServerId,
        )
      : undefined;
  const exactCardRezReserve = exactCardRezSupportWithoutReserve
    ? corpCardRoutePreservesScoreReserve(
        input,
        candidate,
        rezServerId,
        scoreProjects,
      )
    : undefined;
  const exactCardRezSupport =
    exactCardRezSupportWithoutReserve?.productive === true &&
    exactCardRezReserve?.preservesReserve !== true
      ? {
          ...exactCardRezSupportWithoutReserve,
          productive: false,
          value: 0,
          evidenceCode: `corp_rez_exact_card_support_breaks_score_reserve:${exactCardRezReserve?.requiredCreditsAfterAction ?? "unknown"}`,
        }
      : exactCardRezSupportWithoutReserve;
  if (
    sourceType !== "ice" &&
    !persistentDefenseSupport &&
    futureEncounterDefenseSupport?.productive !== true &&
    exactCardRezSupport?.productive !== true
  ) {
    return [];
  }
  if (persistentDefenseSupport)
    return [
      {
        kind: "generic",
        defenseId: `rez-defense-support:${targetId ?? candidate.actionId}`,
        serverId: rezServerId,
        phase: "rez_response" as const,
        sourceDefinitionIds: visibleSource.definitionId
          ? [visibleSource.definitionId]
          : [],
        actionIds: [candidate.actionId],
        ...(targetId ? { targetIceInstanceId: targetId } : {}),
        urgent: false,
        rezWindowVerdict: "productive" as const,
        value: 120,
        evidenceCode: "corp_rez_persistent_server_defense_support",
      },
    ];
  if (futureEncounterDefenseSupport?.productive)
    return [
      {
        kind: "generic",
        defenseId: `rez-future-encounter-support:${targetId ?? candidate.actionId}`,
        serverId: rezServerId,
        phase: "rez_response" as const,
        sourceDefinitionIds: visibleSource.definitionId
          ? [visibleSource.definitionId]
          : [],
        actionIds: [candidate.actionId],
        ...(targetId ? { targetIceInstanceId: targetId } : {}),
        urgent: true,
        rezWindowVerdict: "productive" as const,
        value: 140,
        evidenceCode: futureEncounterDefenseSupport.evidenceCode,
      },
    ];
  if (exactCardRezSupport?.productive)
    return [
      {
        kind: "generic",
        defenseId: `rez-exact-card-support:${targetId ?? candidate.actionId}`,
        serverId: exactCardRezSupport.serverId,
        phase: "rez_response" as const,
        sourceDefinitionIds: visibleSource.definitionId
          ? [visibleSource.definitionId]
          : [],
        actionIds: [candidate.actionId],
        ...(targetId ? { targetIceInstanceId: targetId } : {}),
        urgent: input.playerView.run !== undefined,
        rezWindowVerdict: "productive" as const,
        value: exactCardRezSupport.value,
        evidenceCode: exactCardRezSupport.evidenceCode,
      },
    ];
  const exactIceRezRoute =
    sourceType === "ice"
      ? projectExactCorpIceRezRoute({
          input,
          candidate,
          sourceCard: visibleSource,
          targetServerId: rezServerId,
          bluffDefenseNeed: ambushes.find(
            (ambush) =>
              ambush.serverId === rezServerId &&
              ambush.defenseNeed?.iceInstanceId === visibleSource.instanceId,
          )?.defenseNeed,
        })
      : undefined;
  const scoreReserveAdmission = exactIceRezRoute
    ? assessCorpExactIceRezAgainstScoreReserves({
        input,
        route: exactIceRezRoute,
        scoreProjects,
      })
    : undefined;
  const productiveIceRezRoute =
    exactIceRezRoute && scoreReserveAdmission?.preservesReserve
      ? exactIceRezRoute
      : undefined;
  if (sourceType === "ice" && !productiveIceRezRoute) {
    return [
      {
        kind: "generic",
        defenseId: `rez-nonproductive:${targetId ?? candidate.actionId}`,
        serverId: rezServerId,
        phase: "rez_response" as const,
        sourceDefinitionIds: candidate.sourceDefinitionId
          ? [candidate.sourceDefinitionId]
          : [],
        actionIds: [candidate.actionId],
        ...(targetId ? { targetIceInstanceId: targetId } : {}),
        urgent: false,
        rezWindowVerdict: "nonproductive" as const,
        ...(scoreReserveAdmission
          ? { rezReserveAssessment: scoreReserveAdmission }
          : {}),
        value: 0,
        evidenceCode: exactIceRezRoute
          ? `corp_ice_rez_preserves_score_reserve_required:${scoreReserveAdmission?.requiredCreditsAfterRez ?? "unknown"}:opportunity:${scoreReserveAdmission?.opportunity.reason}:protected_servers:${scoreReserveAdmission?.opportunity.claims.map((c) => `${c.serverId}=${c.credits}`).join(",")}:unknown:${scoreReserveAdmission?.opportunity.unknownServerIds.join(",")}`
          : input.playerView.run?.pendingAutoPassIceId === targetId
            ? "corp_ice_rez_current_encounter_automatically_passed"
            : "corp_ice_rez_resource_exchange_unknown",
      },
    ];
  }
  return [
    {
      kind: "generic",
      defenseId: `rez:${targetId ?? "unknown"}:${candidate.actionId}`,
      serverId: rezServerId,
      phase: "rez_response" as const,
      sourceDefinitionIds: candidate.sourceDefinitionId
        ? [candidate.sourceDefinitionId]
        : [],
      actionIds: [candidate.actionId],
      ...(targetId ? { targetIceInstanceId: targetId } : {}),
      urgent: input.playerView.run !== undefined,
      ...(scoreReserveAdmission
        ? { rezReserveAssessment: scoreReserveAdmission }
        : {}),
      ...(productiveIceRezRoute ? { rezRoute: productiveIceRezRoute } : {}),
      rezWindowVerdict: productiveIceRezRoute
        ? ("productive" as const)
        : ("open" as const),
      value: productiveIceRezRoute ? 1 : 0,
      evidenceCode: productiveIceRezRoute
        ? productiveIceRezRoute.routeKind === "trace_access_block"
          ? `engine_certified_ice_rez_trace_access_block:${rezServerId}:${candidate.actionId}`
          : productiveIceRezRoute.routeKind === "access_reduction"
            ? `engine_certified_ice_rez_access_reduction:${rezServerId}:${candidate.actionId}`
            : productiveIceRezRoute.routeKind === "exact_resource_exchange"
              ? productiveIceRezRoute.resourceExchange
                  ?.layeredCentralPathTax === true
                ? `engine_certified_ice_rez_layered_central_path_tax:${rezServerId}:tax_${productiveIceRezRoute.resourceExchange.runnerNormalCreditsLostOnAccessPath}:other_rezzed_${productiveIceRezRoute.resourceExchange.otherRezzedIceCount ?? 0}:${candidate.actionId}`
                : `engine_certified_ice_rez_exact_resource_exchange:${rezServerId}:${candidate.actionId}`
              : productiveIceRezRoute.routeKind === "free_persistent_defense"
                ? `engine_certified_ice_rez_free_persistent_defense:${rezServerId}:${candidate.actionId}`
                : productiveIceRezRoute.routeKind === "known_access_path_tax"
                  ? `engine_certified_ice_rez_known_access_path_tax:${rezServerId}:${productiveIceRezRoute.knownAccessPathTax ?? 0}:${candidate.actionId}`
                  : productiveIceRezRoute.routeKind ===
                      "costless_immediate_credit_gain"
                    ? `engine_certified_ice_rez_costless_immediate_credit_gain:${rezServerId}:${productiveIceRezRoute.immediateCorpCreditGain}:${candidate.actionId}`
                    : `engine_certified_ice_rez_qualitative_encounter_defense:${rezServerId}:${candidate.actionId}`
        : "visible_non_ice_rez_window",
    },
  ];
}
