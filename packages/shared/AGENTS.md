# Shared package rules

- Shared types and schemas must not import engine internals, UI components, server storage, or AI logic.
- Keep schemas stable and versioned.
- Prefer explicit discriminated unions for actions, events, phases, sides, zones, messages, and errors.
- Any schema change must be reflected in derived docs and tests.
