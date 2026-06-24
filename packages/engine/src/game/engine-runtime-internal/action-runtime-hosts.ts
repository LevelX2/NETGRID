import type { RuntimeDeps } from "./runtime-shared";
import { createApplyActionRuntimeHosts } from "./apply-action-runtime-hosts";
import { createLegalActionRuntimeHosts } from "./legal-action-runtime-hosts";
import { createPlayBoardRuntimeHosts } from "./play-board-runtime-hosts";
import { createScoredEconomyRuntimeHosts } from "./scored-economy-runtime-hosts";

export function createActionRuntimeHosts(deps: RuntimeDeps) {
  const runtime = {} as RuntimeDeps;
  Object.assign(
    runtime,
    createScoredEconomyRuntimeHosts(deps, runtime),
    createApplyActionRuntimeHosts(deps, runtime),
    createPlayBoardRuntimeHosts(deps, runtime),
    createLegalActionRuntimeHosts(deps, runtime),
  );
  return runtime;
}
