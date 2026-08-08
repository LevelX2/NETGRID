# Shared package rules

- Shared types and schemas must not import engine internals, UI components, server storage, or AI logic.
- Keep current schemas explicit and versioned where determinism or the current
  runtime contract requires it. In the Version-0 phase, schema versioning does
  not imply backward compatibility, dual readers/writers, migration paths,
  deprecated aliases, or preservation of historical local data unless the
  user explicitly requests it.
- Prefer explicit discriminated unions for actions, events, phases, sides, zones, messages, and errors.
- Any schema change must be reflected in derived docs and tests.
