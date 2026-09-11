import {
  corpTacticalAssessment as assessment,
  domain,
  corpTacticalProposal as proposal,
  state,
} from "../../plans/corp-tactical-module-support";
import type { ResourceGap } from "../../plans/plan-assessment";
import type { PlanModule } from "../../plans/plan-scheduler";
import { punishCandidates, punishMaterialization } from "./punish-plan-support";
import { CorpPunishCampaignSignal, PunishState } from "./punish-types";

export function punishCampaignModule(): PlanModule {
  return {
    moduleId: "corp.punish_campaign",
    side: "corp",
    discover: (context) =>
      domain(context).punishCampaigns.map((signal) =>
        proposal(
          "corp.punish_campaign",
          signal.campaignId,
          { kind: "punish_campaign", signal } satisfies PunishState,
          punishCampaignPriority(signal),
          signal.routeContract ? [] : punishCandidates(context, signal),
          signal.evidenceCodes ?? signal.evidenceCode,
          { kind: "player", id: "runner" },
          "sticky_goal",
          undefined,
          undefined,
          signal.routeContract?.quoteStatus === "unknown"
            ? "corp_punish_route_quote_unknown"
            : "no_current_tactical_route",
          punishRootResourceGaps(signal).length > 0,
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<PunishState>(instance);
      const routeExists =
        !current.signal.routeContract &&
        current.signal.feasible &&
        punishCandidates(context, current.signal).length > 0;
      return assessment(
        instance,
        punishCampaignPriority(current.signal),
        routeExists,
        current.signal.value,
        portfolio.executorInstanceId,
        current.signal.guarantee,
        current.signal.visibleTerminalProjection,
        punishRootResourceGaps(current.signal),
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PunishState>(instance);
      return current.signal.routeContract
        ? {
            step: {
              stepId: `${instance.instanceId}:${current.signal.phase}`,
              capability: {
                capabilityId: "hold_punish_campaign",
                semanticActionTypes: [],
              },
              purpose:
                "Hold the quoted punish opportunity while its exact support or execution child acts.",
            },
            candidates: [],
          }
        : punishMaterialization(instance, context);
    },
  };
}

function punishCampaignPriority(
  signal: CorpPunishCampaignSignal,
): "P1" | "P3" | "P4" | "P5" {
  if (
    signal.routeContract &&
    signal.terminalCondition === "runner_flatline" &&
    signal.visibleTerminalProjection &&
    (signal.guarantee === "visible_state_forced" ||
      signal.guarantee === "robust_but_reactive") &&
    signal.routeContract.quoteStatus === "complete" &&
    signal.routeContract.horizon !== "wait"
  ) {
    return "P1";
  }
  return signal.priorityClass ?? "P4";
}

function punishRootResourceGaps(
  signal: CorpPunishCampaignSignal,
): ResourceGap[] {
  const route = signal.routeContract;
  if (!route || route.quoteStatus !== "complete") return [];
  if (route.horizon === "fund" && route.fundingGap > 0) {
    return [
      {
        needId: route.fundingNeedId,
        capability: "credits",
        minimum: route.fundingGap,
        available: 0,
        deadline: "current_turn",
      },
    ];
  }
  if (route.horizon === "execute" && route.currentHeadActionId) {
    return [
      {
        needId: route.executionNeedId,
        capability: "execute_complete_punish_route",
        minimum: 1,
        available: 0,
        deadline: "current_turn",
      },
    ];
  }
  return [];
}
