import {
  corpTacticalAssessment as assessment,
  domain,
  corpTacticalProposal as proposal,
  state,
} from "../../plans/corp-tactical-module-support";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import type { PlanModule } from "../../plans/plan-scheduler";
import { punishCandidates, punishMaterialization } from "./punish-plan-support";
import { PunishState } from "./punish-types";

export function punishSequenceModule(): PlanModule {
  return {
    moduleId: "corp.execute_punish_sequence",
    side: "corp",
    discover: (context) =>
      domain(context)
        .punishCampaigns.filter(
          (signal) =>
            signal.routeContract?.quoteStatus === "complete" &&
            signal.routeContract.horizon === "execute" &&
            signal.routeContract.currentHeadActionId !== undefined,
        )
        .map((signal) => {
          const executionProposal = proposal(
            "corp.execute_punish_sequence",
            `${signal.campaignId}:${signal.routeContract!.routeId}`,
            { kind: "punish_sequence", signal } satisfies PunishState,
            "P5",
            punishCandidates(context, signal),
            signal.evidenceCodes ?? signal.evidenceCode,
            { kind: "player", id: "runner" },
            "locked_sequence",
            planInstanceIdForProposal({
              moduleId: "corp.punish_campaign",
              dedupeKey: signal.campaignId,
            }),
            signal.routeContract!.executionNeedId,
          );
          executionProposal.retentionPolicy = {
            ...executionProposal.retentionPolicy,
            abandonWhenTargetMissing: true,
            protectedWhileNeedOpen: false,
            protectedWhileCommitted: false,
          };
          return executionProposal;
        }),
    assess: (instance, context, portfolio) => {
      const current = state<PunishState>(instance);
      return assessment(
        instance,
        "P5",
        current.signal.feasible &&
          punishCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
        current.signal.guarantee,
        current.signal.visibleTerminalProjection,
      );
    },
    materialize: (instance, _assessment, context) =>
      punishMaterialization(instance, context),
  };
}
