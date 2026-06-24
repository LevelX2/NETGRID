import type { RuntimeDeps } from "./runtime-shared";
import { createPendingChoiceRuntimeHosts } from "./pending-choice-runtime-hosts";
import { createHiddenZoneSearchRuntime } from "./hidden-zone-search-runtime";
import { createHiddenZoneArrangeRuntime } from "./hidden-zone-arrange-runtime";
import { createHiddenZoneNonSearchRuntime } from "./hidden-zone-nonsearch-runtime";
import { createHiddenZoneNonSearchDiceLoopRuntime } from "./hidden-zone-nonsearch-dice-loop-runtime";
import { createCorpZoneRuntimeHosts } from "./corp-zone-runtime-hosts";

export function createChoiceHiddenZoneRuntime(deps: RuntimeDeps) {
  const runtime: Record<string, unknown> = {};
  Object.assign(
    runtime,
    createHiddenZoneSearchRuntime(deps, runtime),
    createHiddenZoneArrangeRuntime(deps, runtime),
    createHiddenZoneNonSearchRuntime(deps, runtime),
    createHiddenZoneNonSearchDiceLoopRuntime(deps),
    createCorpZoneRuntimeHosts(deps, runtime),
    createPendingChoiceRuntimeHosts(deps, runtime),
  );
  return runtime;
}
