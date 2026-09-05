# Shared package rules

- Shared types and schemas must not import engine internals, UI components, server storage, or AI logic.
- Keep current schemas explicit and versioned where determinism or the current
  runtime contract requires it. In the Version-0 phase, schema versioning does
  not imply backward compatibility, dual readers/writers, migration paths,
  deprecated aliases, or preservation of historical local data unless the
  user explicitly requests it.
- Prefer explicit discriminated unions for actions, events, phases, sides, zones, messages, and errors.
- Reflect a schema change in the docs and tests whose contracts or consumers it actually affects; retain determinism and visibility coverage at those boundaries.
