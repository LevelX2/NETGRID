import type { RuntimeDeps } from "./runtime-shared";
import { createCardStrengthCostRuntimeServices } from "./card-strength-cost-runtime-services";
import { createCounterTurnRuntimeServices } from "./counter-turn-runtime-services";
import { createEconomyRuntimeServices } from "./economy-runtime-services";
import { createLookupRuntimeServices } from "./lookup-runtime-services";
import { createZoneRuntimeServices } from "./zone-runtime-services";
import type { EconomyRuntimePort } from "./economy-runtime-port";
import type { LookupRuntimePort } from "./lookup-runtime-port";
import type { CardStrengthCostRuntimePort } from "./card-strength-cost-runtime-port";
import type { CounterTurnRuntimePort } from "./counter-turn-runtime-port";
import type { ZoneRuntimePort } from "./zone-runtime-port";

export type StateRuntimeServices = EconomyRuntimePort &
  LookupRuntimePort &
  CardStrengthCostRuntimePort &
  CounterTurnRuntimePort &
  ZoneRuntimePort;

export function createStateRuntimeServices(
  deps: RuntimeDeps,
): StateRuntimeServices {
  const runtime = {} as StateRuntimeServices;
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
