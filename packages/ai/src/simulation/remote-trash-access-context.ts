import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { projectAccessWindowChoice } from "../access/access-window-choice";
import {
  remoteTrashActionTotalCost,
  remoteTrashDedicatedCreditsForMetrics,
} from "../runtime/remote-trash-cost";
import {
  remoteTrashTargetTypeForVisibleCard,
  type RemoteTrashTargetType,
} from "../runtime/remote-trash-target";
import { isRemoteServerTarget } from "../runtime/server-target";
import { getStructuredRemoteRoleForCard } from "../remote-role-ontology-consumer";
import { remoteTrashAccessProtectsAcuteThreatForMetrics } from "./remote-server-threat";
import { remoteTrashCostForVisibleCard } from "./card-metric-lookup";
import {
  remoteTrashCardIsBbsWhisperingCampaign,
  remoteTrashCardLooksLikeFinitePoolForMetrics,
  remoteTrashRoleForAccessedVisibleCard,
  remoteTrashVisibleCorpValueRemaining,
  type RemoteTrashRole,
} from "./remote-trash-role";

export type RunnerRemoteTrashAccessContext = {
  trashable: boolean;
  relevant: boolean;
  affordableRelevant: boolean;
  relevantTaken: boolean;
  skippedAffordableRelevant: boolean;
  expensive: boolean;
  highImpact: boolean;
  acuteThreat: boolean;
  trashCost: number;
  generalCreditCost: number;
  dedicatedTrashCredits: number;
  creditsAfterGeneralTrash: number;
  reserveTarget: number;
  dropsBelowReserve: boolean;
  deferredByBudget: boolean;
  finitePoolEconomy: boolean;
  bbsWhisperingCampaign: boolean;
  corpValueRemaining: number;
  legalTrashActionCount: number;
  centralAccess: boolean;
  allInGeneralTrash: boolean;
  accessServerId?: string;
  evidence: string[];
  targetType?: RemoteTrashTargetType;
  role?: RemoteTrashRole;
};

export function buildRunnerRemoteTrashAccessContext(
  input: AiDecisionInput,
  action: LegalAction,
  reserveTarget: number,
): RunnerRemoteTrashAccessContext {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  const accessServerId = run?.attackedServerId;
  const centralAccess = accessServerId === "hq" || accessServerId === "rd";
  const remoteAccess = isRemoteServerTarget(accessServerId);
  if (!run || (!remoteAccess && !centralAccess) || !accessed?.known) {
    return {
      trashable: false,
      relevant: false,
      affordableRelevant: false,
      relevantTaken: false,
      skippedAffordableRelevant: false,
      expensive: false,
      highImpact: false,
      acuteThreat: false,
      trashCost: 0,
      generalCreditCost: 0,
      dedicatedTrashCredits: 0,
      creditsAfterGeneralTrash: input.playerView.own.credits,
      reserveTarget,
      dropsBelowReserve: false,
      deferredByBudget: false,
      finitePoolEconomy: false,
      bbsWhisperingCampaign: false,
      corpValueRemaining: 0,
      legalTrashActionCount: 0,
      centralAccess: false,
      allInGeneralTrash: false,
      ...(accessServerId ? { accessServerId } : {}),
      evidence: ["remote_trash_access:none"],
    };
  }
  const targetType = remoteTrashTargetTypeForVisibleCard(accessed);
  const structuredRemoteRole = getStructuredRemoteRoleForCard(
    accessed.definitionId,
  );
  const role = remoteTrashRoleForAccessedVisibleCard(input, accessed);
  const trashAction = input.legalActions.find(
    (candidate) => candidate.type === "trash_accessed_card",
  );
  const legalTrashActionCount = input.legalActions.filter(
    (candidate) => candidate.type === "trash_accessed_card",
  ).length;
  const trashCost = trashAction
    ? remoteTrashActionTotalCost(trashAction)
    : (remoteTrashCostForVisibleCard(accessed) ?? 0);
  const trashable =
    targetType !== "unknown" &&
    remoteTrashCostForVisibleCard(accessed) !== undefined;
  const bbsWhisperingCampaign =
    remoteTrashCardIsBbsWhisperingCampaign(accessed);
  const corpValueRemaining = remoteTrashVisibleCorpValueRemaining(accessed);
  const finitePoolEconomy =
    bbsWhisperingCampaign ||
    (role === "economy" &&
      (corpValueRemaining > 0 ||
        remoteTrashCardLooksLikeFinitePoolForMetrics(accessed)));
  const relevant =
    trashable &&
    ((role !== "low_value" && role !== "unknown") || finitePoolEconomy);
  const dedicatedTrashCredits =
    trashAction !== undefined
      ? remoteTrashDedicatedCreditsForMetrics(input, trashAction, accessed)
      : 0;
  const generalCreditCost = Math.max(0, trashCost - dedicatedTrashCredits);
  const creditsAfterGeneralTrash =
    input.playerView.own.credits - generalCreditCost;
  const dropsBelowReserve =
    trashable && creditsAfterGeneralTrash < Math.max(2, reserveTarget - 1);
  const allInGeneralTrash =
    trashable &&
    generalCreditCost > 0 &&
    generalCreditCost >= input.playerView.own.credits &&
    dedicatedTrashCredits <= 0;
  const expensive = trashCost >= 4 || generalCreditCost >= 4;
  const highImpact =
    relevant &&
    (role === "scoring_protection" ||
      role === "run_tax" ||
      role === "remote_capacity" ||
      role === "economy" ||
      role === "tag_punish" ||
      finitePoolEconomy);
  const acuteThreat = remoteAccess
    ? remoteTrashAccessProtectsAcuteThreatForMetrics(
        input,
        run.attackedServerId,
      )
    : false;
  const highRemainingFinitePool =
    finitePoolEconomy &&
    corpValueRemaining >= Math.max(trashCost + 2, 8) &&
    trashCost > 0;
  const centralBudgetDeferral =
    centralAccess &&
    allInGeneralTrash &&
    !acuteThreat &&
    !highRemainingFinitePool;
  const deferredByBudget =
    centralBudgetDeferral ||
    (trashable &&
      highImpact &&
      expensive &&
      dropsBelowReserve &&
      dedicatedTrashCredits <= 0 &&
      !acuteThreat &&
      !highRemainingFinitePool);
  const affordableRelevant =
    relevant && trashAction !== undefined && !deferredByBudget;
  const relevantTaken =
    affordableRelevant && action.type === "trash_accessed_card";
  const accessDecisionProjection = projectAccessWindowChoice({
    actionType: action.type,
    serverId: accessServerId,
    ...(accessed.definitionId
      ? { knownRootDefinitionId: accessed.definitionId }
      : {}),
    targetType,
    trashCost,
    generalTrashCost: generalCreditCost,
    dedicatedTrashCredits,
    reserveWouldBreak: deferredByBudget,
    finitePoolValueRemaining: corpValueRemaining,
  });
  return {
    trashable,
    relevant,
    affordableRelevant,
    relevantTaken,
    skippedAffordableRelevant:
      affordableRelevant && action.type !== "trash_accessed_card",
    expensive,
    highImpact,
    acuteThreat,
    trashCost,
    generalCreditCost,
    dedicatedTrashCredits,
    creditsAfterGeneralTrash,
    reserveTarget,
    dropsBelowReserve,
    deferredByBudget,
    finitePoolEconomy,
    bbsWhisperingCampaign,
    corpValueRemaining,
    legalTrashActionCount,
    centralAccess,
    allInGeneralTrash,
    evidence: [
      `access_trash_scope:${centralAccess ? "central" : "remote"}`,
      `access_trash_server:${accessServerId}`,
      `remote_trash_role:${role}`,
      ...(structuredRemoteRole
        ? [
            "runner_remote_role_profile_seen:true",
            `runner_remote_role_kind:${structuredRemoteRole.kind}`,
            ...(structuredRemoteRole.serverScope
              ? [
                  `runner_remote_role_server_scope:${structuredRemoteRole.serverScope}`,
                ]
              : []),
            ...(relevant
              ? ["runner_remote_role_used_for_trash_value:true"]
              : []),
            ...(deferredByBudget
              ? ["runner_remote_role_trash_budget_preserved:true"]
              : []),
          ]
        : []),
      `remote_trash_cost:${trashCost}`,
      `remote_trash_general_credit_cost:${generalCreditCost}`,
      `remote_trash_dedicated_credits:${dedicatedTrashCredits}`,
      `remote_trash_credits_after:${creditsAfterGeneralTrash}`,
      `remote_trash_reserve_target:${reserveTarget}`,
      `remote_trash_drops_below_reserve:${dropsBelowReserve}`,
      `remote_trash_acute_threat:${acuteThreat}`,
      `remote_trash_deferred_by_budget:${deferredByBudget}`,
      `central_access_trash:${centralAccess}`,
      `central_access_trash_all_in_budget_risk:${centralBudgetDeferral}`,
      `remote_trash_finite_pool_economy:${finitePoolEconomy}`,
      `remote_trash_bbs_whispering_campaign:${bbsWhisperingCampaign}`,
      `remote_trash_corp_value_remaining:${corpValueRemaining}`,
      ...accessDecisionProjection.evidence,
    ],
    ...(accessServerId ? { accessServerId } : {}),
    ...(trashable ? { targetType } : {}),
    ...(trashable ? { role } : {}),
  };
}
