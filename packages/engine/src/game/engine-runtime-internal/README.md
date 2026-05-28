# Engine Runtime Internal

`runtime-implementation.ts` has been removed.

`public-api.ts` is the explicit internal public API barrel used by `game/engine-runtime.ts` and the package entrypoint. `runtime-bootstrap.ts` owns the import-time configuration order, and `runtime-delegates.ts` is now only the small initializer/barrel for mechanical delegate bindings into the ARCH-104 through ARCH-110 domain modules.

`choice-hidden-zone-runtime.ts` is now only the small aggregator for the choice and hidden-zone runtime bridges. ARCH-109 split the previous broad module into:

- `pending-choice-runtime-hosts.ts`
- `hidden-zone-search-runtime.ts`
- `hidden-zone-arrange-runtime.ts`
- `hidden-zone-nonsearch-runtime.ts`
- `hidden-zone-nonsearch-playful-ai-runtime.ts`
- `corp-zone-runtime-hosts.ts`

These files are runtime bridge modules. They wire existing choice and hidden-zone behavior; they must not define new PendingChoice values, change `hiddenZoneAction` or `specialZoneReason` values, or grow into a second hidden-zone engine. New hidden-zone domain logic belongs in `game/hidden-zone/*`, and new choice domain logic belongs in the existing choice modules.

`card-runtime-hosts.ts` is now only the small aggregator for CardImplementation-related runtime host bridges. ARCH-110 split the previous broad module into:

- `card-runtime-deps-hosts.ts`
- `activated-card-runtime-hosts.ts`
- `trigger-ability-runtime-hosts.ts`
- `card-lifecycle-runtime-hosts.ts`

These files wire existing CardImplementation, trigger, install, rez and lifecycle behavior. They must not define a second CardImplementationRuntime, change RuntimeDeps keys, or move EffectInterpreter semantics. New card-domain logic belongs in `game/card-implementation`, `ability-engine` or the relevant domain module.

`runtime-delegates.ts` delegates are split by ownership:

- `action-runtime-delegates.ts`
- `flow-runtime-delegates.ts`
- `card-runtime-delegates.ts`
- `state-runtime-delegates.ts`
- `choice-runtime-delegates.ts`
- `runtime-delegate-store.ts`

Delegate modules are mechanical forwarders. Do not add new features permanently to `runtime-bootstrap.ts`, `runtime-delegates.ts` or delegate modules. New runtime domain logic belongs in the appropriate `game/*` module or in a focused internal runtime module.

`runtime-bootstrap.ts` is now only the import-time bootstrap orchestrator. ARCH-111 split the previous broad bootstrap file into explicit phases:

- `card-runtime-bootstrap.ts`
- `flow-runtime-bootstrap.ts`
- `action-runtime-bootstrap.ts`
- `state-runtime-bootstrap.ts`
- `public-event-runtime-bootstrap.ts`
- `runtime-bootstrap-support.ts`

The orchestrator owns the global bootstrap order. Phase modules expose configure/initialize functions and must not configure each other at import time. Preserve the import-time side effect from `public-api.ts`: importing the public runtime must still execute the bootstrap exactly once through `runtime-bootstrap.ts`. New gameplay logic does not belong in bootstrap modules; put it in the owning game/domain module and wire it through a focused runtime bridge only when necessary.

`action-runtime-hosts.ts`, `flow-runtime-hosts.ts` and `state-runtime-services.ts` are now aggregators for smaller host/service families. ARCH-112 split them into:

- `apply-action-runtime-hosts.ts`
- `legal-action-runtime-hosts.ts`
- `play-board-runtime-hosts.ts`
- `scored-economy-runtime-hosts.ts`
- `run-flow-runtime-hosts.ts`
- `access-flow-runtime-hosts.ts`
- `damage-trace-runtime-hosts.ts`
- `install-rez-runtime-hosts.ts`
- `encounter-movement-runtime-hosts.ts`
- `lookup-runtime-services.ts`
- `zone-runtime-services.ts`
- `economy-runtime-services.ts`
- `draw-random-runtime-services.ts` is intentionally not present yet because draw/random-specific services still live in the broader state/flow families.
- `counter-turn-runtime-services.ts`
- `card-strength-cost-runtime-services.ts`

These files are runtime wiring and adapter families. Aggregators must not grow new domain behavior; new gameplay, state, run/access, payment, damage, trace or action semantics belong in the owning `game/*` or `ability-engine/*` module first.

The target architecture is now a small package facade, a small runtime facade, and private runtime domain modules protected by size and import gates. Future work should improve specific internal domain modules instead of growing the facades.
