// @ts-nocheck
import type { RuntimeDeps } from "./runtime-shared";
import { createAccessFlowRuntimeHosts } from "./access-flow-runtime-hosts";
import { createDamageTraceRuntimeHosts } from "./damage-trace-runtime-hosts";
import { createEncounterMovementRuntimeHosts } from "./encounter-movement-runtime-hosts";
import { createInstallRezRuntimeHosts } from "./install-rez-runtime-hosts";
import { createRunFlowRuntimeHosts } from "./run-flow-runtime-hosts";

export function createFlowRuntimeHosts(deps: RuntimeDeps) {
  const runtime: Record<string, any> = {};
  Object.assign(
    runtime,
    createInstallRezRuntimeHosts(deps),
    createDamageTraceRuntimeHosts(deps),
    createRunFlowRuntimeHosts(deps, runtime),
    createEncounterMovementRuntimeHosts(deps, runtime),
    createAccessFlowRuntimeHosts(deps),
  );
  return runtime;
}
