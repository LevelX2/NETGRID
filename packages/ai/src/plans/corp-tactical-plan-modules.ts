import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { ambushModule } from "../corp/ambush/ambush-plan-module";

import { handModule } from "../corp/hand-management/hand-management-plan-module";

import { punishCampaignModule } from "../corp/punish/punish-campaign-plan-module";

import { corpPunishCampaignOwnsCandidate } from "../corp/punish/punish-plan-support";

import { punishSequenceModule } from "../corp/punish/punish-sequence-plan-module";

import { createCorpVirusPressureModule } from "../corp/virus-pressure/virus-pressure-plan-module";

import { CorpPlanDomain } from "./corp-tactical-plan-contracts";

import type { PlanModule } from "./plan-scheduler";

export function createCorpTacticalPlanModules(): PlanModule[] {
  return [
    createCorpVirusPressureModule(),
    punishCampaignModule(),
    punishSequenceModule(),
    ambushModule(),
    handModule(),
  ];
}

export function corpTacticalActionFamilyOwner(
  candidate: ActionSemanticCandidate,
  planDomain: CorpPlanDomain,
): PlanModule["moduleId"] | undefined {
  const punishCampaign = planDomain.punishCampaigns.find((signal) =>
    corpPunishCampaignOwnsCandidate(signal, candidate),
  );
  if (punishCampaign)
    return punishCampaign.routeContract
      ? "corp.execute_punish_sequence"
      : "corp.punish_campaign";
  if (
    candidate.semanticActionType === "counter.purge_virus" ||
    candidate.semanticActionType === "counter.purge_runner_virus"
  )
    return planDomain.virusPressure.some((signal) => signal.purgeUseful)
      ? "corp.respond_to_virus_pressure"
      : undefined;
  if (
    planDomain.ambushes.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    )
  )
    return "corp.ambush_and_bluff";
  const allowedHandPlans = planDomain.handManagement.filter(
    (signal) => signal.routeAllowed !== false,
  );
  if (candidate.semanticActionType === "choice.resolve")
    return allowedHandPlans.length > 0
      ? "corp.hand_and_agenda_management"
      : undefined;
  if (
    allowedHandPlans.some(
      (signal) => signal.actionIds?.includes(candidate.actionId) === true,
    )
  )
    return "corp.hand_and_agenda_management";
  return undefined;
}
