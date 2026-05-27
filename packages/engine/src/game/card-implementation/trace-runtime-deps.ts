import type { CardInstanceId, TraceSuccessEffect } from "@netgrid/shared";
import { traceSuccessEffectForCardImplementation } from "../../ability-engine/trace-implementations";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import type { CardTraceSuccessEffectImplementation } from "../../ability-engine/definition-types";
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
    resolveRunnerLastTurnInstalledResourceTargetId: (
      state: RuntimeState,
      targetRef: string,
    ) => CardInstanceId | undefined;
  };
};

function successEffectWithSelectedTarget(
  host: TraceRuntimeDepsHost,
  state: RuntimeState,
  successEffects: readonly CardTraceSuccessEffectImplementation[],
  targetCardId: string,
): TraceSuccessEffect {
  const needsResourceTarget = successEffects.some(
    (effect) => effect.kind === "trash_runner_resource_and_add_tag",
  );
  if (!needsResourceTarget)
    return traceSuccessEffectForCardImplementation(successEffects);
  const resolvedTargetCardId =
    host.trace.resolveRunnerLastTurnInstalledResourceTargetId(state, targetCardId);
  if (!resolvedTargetCardId)
    throw new Error("Die gewaehlte Runner-Resource ist fuer diesen Trace nicht legal.");
  return traceSuccessEffectForCardImplementation(successEffects, {
    targetCardInstanceId: resolvedTargetCardId,
  });
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
