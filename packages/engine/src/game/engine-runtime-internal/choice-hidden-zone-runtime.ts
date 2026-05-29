// @ts-nocheck
import type { RuntimeDeps } from "./runtime-shared";
import { createPendingChoiceRuntimeHosts } from "./pending-choice-runtime-hosts";
import { createHiddenZoneSearchRuntime } from "./hidden-zone-search-runtime";
import { createHiddenZoneArrangeRuntime } from "./hidden-zone-arrange-runtime";
import { createHiddenZoneNonSearchRuntime } from "./hidden-zone-nonsearch-runtime";
import { createHiddenZoneNonSearchPlayfulAiRuntime } from "./hidden-zone-nonsearch-playful-ai-runtime";
import { createCorpZoneRuntimeHosts } from "./corp-zone-runtime-hosts";

export function createChoiceHiddenZoneRuntime(deps: RuntimeDeps) {
  const runtime: Record<string, any> = {};
  Object.assign(
    runtime,
    createHiddenZoneSearchRuntime(deps, runtime),
    createHiddenZoneArrangeRuntime(deps, runtime),
    createHiddenZoneNonSearchRuntime(deps, runtime),
    createHiddenZoneNonSearchPlayfulAiRuntime(deps),
    createCorpZoneRuntimeHosts(deps, runtime),
    createPendingChoiceRuntimeHosts(deps, runtime),
  );
  return runtime;
}
