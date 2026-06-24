import type { RuntimeDeps } from "./runtime-shared";
import { createActivatedCardRuntimeHosts } from "./activated-card-runtime-hosts";
import { createCardLifecycleRuntimeHosts } from "./card-lifecycle-runtime-hosts";
import { createCardRuntimeDepsHosts } from "./card-runtime-deps-hosts";
import { createTriggerAbilityRuntimeHosts } from "./trigger-ability-runtime-hosts";

export function createCardRuntimeHosts(deps: RuntimeDeps) {
  const runtime = {} as RuntimeDeps;
  Object.assign(
    runtime,
    createCardRuntimeDepsHosts(deps, runtime),
    createTriggerAbilityRuntimeHosts(deps, runtime),
    createCardLifecycleRuntimeHosts(deps, runtime),
    createActivatedCardRuntimeHosts(deps, runtime),
  );
  return runtime;
}
