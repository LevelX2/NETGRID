import {
  assessment,
  domain,
  proposal,
  state,
} from "../../plans/corp-core-module-support";
import { RemoteState } from "../../plans/corp-core-plan-contracts";
import type { ResourceGap } from "../../plans/plan-assessment";
import type { PlanModule } from "../../plans/plan-scheduler";
import type { CorpRemoteProjectSignal } from "./scoring-remote-types";
export function remoteModule(): PlanModule {
  return {
    moduleId: "corp.establish_scoring_remote",
    side: "corp",
    discover: (context) =>
      domain(context).remoteProjects.map((signal) =>
        proposal({
          moduleId: "corp.establish_scoring_remote",
          dedupeKey: signal.projectId,
          moduleState: { kind: "remote", signal } satisfies RemoteState,
          priorityClass: "P6",
          target: { kind: "server", id: signal.serverId },
          routeExists: false,
          supportable: signal.feasible && signal.need !== undefined,
          evidenceCode: signal.evidenceCode,
          blockerCode:
            signal.phase === "assessment_unknown"
              ? "remote_protection_assessment_unknown"
              : "remote_support_route_unavailable",
          abandonWhenTargetMissing: false,
          persistencePolicy: "recurring_cadence",
          moduleVersion: "2",
          cadence: {
            turnKey: signal.cadence.turnKey,
            maxExecutionsPerTurn: signal.cadence.maximumActions,
            executionsUsed: signal.cadence.actionsUsed,
          },
        }),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      const resourceGaps = remoteResourceGaps(current.signal);
      return assessment(
        instance,
        "P6",
        false,
        current.signal.value,
        portfolio.executorInstanceId,
        resourceGaps,
      );
    },
    materialize: (instance) => {
      const current = state<RemoteState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: "maintain_strategic_scoring_remote",
            semanticActionTypes: [],
          },
          target: { kind: "server", id: current.signal.serverId },
          purpose: `Maintain resident scoring-remote objective ${current.signal.serverId}; concrete actions belong to bound support providers.`,
        },
        candidates: [],
      };
    },
  };
}

function remoteResourceGaps(signal: CorpRemoteProjectSignal): ResourceGap[] {
  if (!signal.need) return [];
  return [
    {
      needId: signal.need.needId,
      capability: signal.need.capability,
      minimum: signal.need.minimum,
      available: 0,
      deadline: "multi_turn",
    },
  ];
}
