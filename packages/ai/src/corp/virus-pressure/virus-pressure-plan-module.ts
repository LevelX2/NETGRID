import type {
  PlanModule,
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  corpTacticalProposal as proposal,
  corpTacticalAssessment as assessment,
  corpTacticalPlanDomain,
} from "../../plans/corp-tactical-module-support";
import type {
  CorpVirusPressureSignal,
  VirusState,
} from "./virus-pressure-types";
export function createCorpVirusPressureModule(): PlanModule {
  return {
    moduleId: "corp.respond_to_virus_pressure",
    side: "corp",
    discover: (context) =>
      corpTacticalPlanDomain<{ virusPressure: CorpVirusPressureSignal[] }>(
        context,
      )
        .virusPressure.filter(
          (signal) => signal.purgeUseful && signal.virusCounters > 0,
        )
        .map((signal) =>
          proposal(
            "corp.respond_to_virus_pressure",
            signal.pressureId,
            { kind: "virus", signal } satisfies VirusState,
            signal.critical ? "P2" : "P5",
            purgeCandidates(context),
            signal.evidenceCode,
            { kind: "capability", id: "runner_virus_pressure" },
            "recurring_cadence",
          ),
        ),
    assess: (instance, context, portfolio) => {
      const current = instance.moduleState as VirusState;
      return assessment(
        instance,
        current.signal.critical ? "P2" : "P5",
        purgeCandidates(context).length > 0,
        current.signal.strategicDamage,
        portfolio.executorInstanceId,
        "visible_state_forced",
      );
    },
    materialize: (instance, _assessment, context) => ({
      step: {
        stepId: `${instance.instanceId}:purge`,
        capability: {
          capabilityId: "purge_visible_runner_viruses",
          semanticActionTypes: [
            "counter.purge_virus",
            "counter.purge_runner_virus",
          ],
        },
        purpose: "Remove strategically material visible virus pressure.",
      },
      candidates: purgeCandidates(context),
    }),
  };
}

function purgeCandidates(
  context: PlanSchedulerContext,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType === "counter.purge_virus" ||
        candidate.semanticActionType === "counter.purge_runner_virus",
    )
    .map((candidate) => ({ candidate, stepValue: 1 }));
}
