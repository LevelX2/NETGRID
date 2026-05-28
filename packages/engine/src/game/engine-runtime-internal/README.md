# Engine Runtime Internal

`runtime-implementation.ts` has been removed.

`public-api.ts` is the explicit internal public API barrel used by `game/engine-runtime.ts` and the package entrypoint. `runtime-bootstrap.ts` owns the import-time configuration order, and `runtime-delegates.ts` owns the mechanical delegate bindings into the ARCH-104 through ARCH-106 domain modules.

Do not add new features permanently to `runtime-bootstrap.ts` or `runtime-delegates.ts`. New runtime domain logic belongs in the appropriate `game/*` module or in a focused internal runtime module.

The target architecture is now a small package facade, a small runtime facade, and private runtime domain modules protected by size and import gates. Future work should improve specific internal domain modules instead of growing the facades.
