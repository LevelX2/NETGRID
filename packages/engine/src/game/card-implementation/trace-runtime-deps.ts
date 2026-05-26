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
  };
};

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
      return startTraceFromOperation(
        host.trace.orchestrationHost(state),
        sourceDefinitionId,
        baseTraceStrength,
        legalAction,
        successEffect,
      );
    },
  };
}
