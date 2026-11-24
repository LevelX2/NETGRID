import type { RuntimeDeps } from "./runtime-shared";
import { createActivatedCardRuntimeHosts } from "./activated-card-runtime-hosts";
import { createCardLifecycleRuntimeHosts } from "./card-lifecycle-runtime-hosts";
import { createCardRuntimeDepsHosts } from "./card-runtime-deps-hosts";
import { createTriggerAbilityRuntimeHosts } from "./trigger-ability-runtime-hosts";

export function createCardRuntimeHosts(
  deps: RuntimeDeps,
): import("./card-runtime-host-port").CardRuntimeHostPort {
  return {
    ...createCardRuntimeDepsHosts(deps),
    ...createTriggerAbilityRuntimeHosts(deps),
    ...createCardLifecycleRuntimeHosts(deps),
    ...createActivatedCardRuntimeHosts(deps),
  };
}
