import type { CardInstanceId, TraceSuccessEffect } from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import {
  startTraceFromOperation,
  type TraceOrchestrationHost,
} from "../trace/trace-orchestration";

export type TraceRuntimeDepsKey = "startTrace";

export type TraceCardImplementationRuntimeDeps = Pick<
  CardImplementationRuntimeDependencies,
  TraceRuntimeDepsKey
>;

type RuntimeState = Parameters<TraceCardImplementationRuntimeDeps["startTrace"]>[0];

export type TraceRuntimeDepsHost = {
  trace: {
    orchestrationHost: (state: RuntimeState) => TraceOrchestrationHost;
    runnerLastTurnInstalledResourceIds: (state: RuntimeState) => CardInstanceId[];
  };
};

function successEffectWithSelectedTarget(
  host: TraceRuntimeDepsHost,
  state: RuntimeState,
  successEffect: TraceSuccessEffect,
  targetCardId: string,
): TraceSuccessEffect {
  if (successEffect.type !== "trash_runner_resource_and_add_tag")
    return successEffect;
  const eligible = host.trace.runnerLastTurnInstalledResourceIds(state);
  if (!eligible.includes(targetCardId as CardInstanceId))
    throw new Error("Die gewaehlte Runner-Resource ist fuer diesen Trace nicht legal.");
  return {
    ...successEffect,
    targetCardInstanceId: targetCardId as CardInstanceId,
  };
}

export function createTraceCardImplementationRuntimeDeps(
  host: TraceRuntimeDepsHost,
): TraceCardImplementationRuntimeDeps {
  return {
    startTrace: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      baseTraceStrength,
      successEffect,
    ) => {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        cardId: sourceCardId,
      };
      const targetedSuccessEffect = successEffectWithSelectedTarget(
        host,
        state,
        successEffect,
        String(legalAction.payload?.traceSuccessTargetCardId ?? ""),
      );
      return startTraceFromOperation(
        host.trace.orchestrationHost(state),
        sourceDefinitionId,
        baseTraceStrength,
        legalAction,
        targetedSuccessEffect,
      );
    },
  };
}
