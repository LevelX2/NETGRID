# Engine Runtime Internal

`runtime-implementation.ts` is a temporary staging container.

Its purpose is to separate the public runtime facade from the private engine runtime implementation without changing gameplay semantics. ARCH-104 and ARCH-105 must break this file down into focused runtime domain modules.

Do not add new features permanently to `runtime-implementation.ts`. New runtime domain logic belongs in the appropriate `game/*` module or in a focused internal runtime module created by the follow-up split.

The target architecture is a small runtime facade plus domain modules, not a new monolith.