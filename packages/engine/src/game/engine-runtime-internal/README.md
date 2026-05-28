# Engine Runtime Internal

`runtime-implementation.ts` is now a small runtime facade residue.

Its purpose is to keep the public runtime surface connected to import-time bootstrap while the private engine runtime implementation lives in focused internal modules. `runtime-bootstrap.ts` owns the import-time configuration order, and `runtime-delegates.ts` owns the mechanical delegate bindings into the ARCH-104 through ARCH-106 domain modules.

Do not add new features permanently to `runtime-implementation.ts`, `runtime-bootstrap.ts`, or `runtime-delegates.ts`. New runtime domain logic belongs in the appropriate `game/*` module or in a focused internal runtime module.

The target architecture is a small runtime facade plus domain modules, not a new monolith. ARCH-108 should make the public API export list final and keep the size/import gates in place.
