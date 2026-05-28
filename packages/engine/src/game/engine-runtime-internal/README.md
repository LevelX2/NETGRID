# Engine Runtime Internal

`runtime-implementation.ts` has been removed.

`public-api.ts` is the explicit internal public API barrel used by `game/engine-runtime.ts` and the package entrypoint. `runtime-bootstrap.ts` owns the import-time configuration order, and `runtime-delegates.ts` owns the mechanical delegate bindings into the ARCH-104 through ARCH-106 domain modules.

`choice-hidden-zone-runtime.ts` is now only the small aggregator for the choice and hidden-zone runtime bridges. ARCH-109 split the previous broad module into:

- `pending-choice-runtime-hosts.ts`
- `hidden-zone-search-runtime.ts`
- `hidden-zone-arrange-runtime.ts`
- `hidden-zone-nonsearch-runtime.ts`
- `hidden-zone-nonsearch-playful-ai-runtime.ts`
- `corp-zone-runtime-hosts.ts`

These files are runtime bridge modules. They wire existing choice and hidden-zone behavior; they must not define new PendingChoice values, change `hiddenZoneAction` or `specialZoneReason` values, or grow into a second hidden-zone engine. New hidden-zone domain logic belongs in `game/hidden-zone/*`, and new choice domain logic belongs in the existing choice modules.

Do not add new features permanently to `runtime-bootstrap.ts` or `runtime-delegates.ts`. New runtime domain logic belongs in the appropriate `game/*` module or in a focused internal runtime module.

The target architecture is now a small package facade, a small runtime facade, and private runtime domain modules protected by size and import gates. Future work should improve specific internal domain modules instead of growing the facades.
