// @ts-nocheck
import type { RuntimeDeps } from "./runtime-shared";
import { createCardStrengthCostRuntimeServices } from "./card-strength-cost-runtime-services";
import { createCounterTurnRuntimeServices } from "./counter-turn-runtime-services";
import { createEconomyRuntimeServices } from "./economy-runtime-services";
import { createLookupRuntimeServices } from "./lookup-runtime-services";
import { createZoneRuntimeServices } from "./zone-runtime-services";

export function createStateRuntimeServices(deps: RuntimeDeps) {
  const runtime: Record<string, any> = {};
  Object.assign(
    runtime,
    createEconomyRuntimeServices(deps),
    createLookupRuntimeServices(deps),
    createCardStrengthCostRuntimeServices(deps, runtime),
    createCounterTurnRuntimeServices(deps, runtime),
    createZoneRuntimeServices(deps),
  );
  return runtime;
}
