/** Composition port for run, access, damage, trace and encounter flows. */
import type { AccessFlowRuntimePort } from "./access-flow-runtime-port";
import type { DamageTraceRuntimePort } from "./damage-trace-runtime-port";
import type { EncounterMovementRuntimePort } from "./encounter-movement-runtime-port";
import type { InstallRezRuntimePort } from "./install-rez-runtime-port";
import type { RunFlowRuntimePort } from "./run-flow-runtime-port";

export type FlowRuntimePort = InstallRezRuntimePort &
  DamageTraceRuntimePort &
  RunFlowRuntimePort &
  EncounterMovementRuntimePort &
  AccessFlowRuntimePort;
