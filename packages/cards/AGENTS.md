# Cards package rules

- This package is the pure, canonical CardSpec contract boundary.
- Production code may import only neutral leaf types from `@netgrid/shared`.
- Do not import Engine, AI, Catalog, Decks, Server, Web, Node APIs, browser APIs,
  databases, filesystems, networking, clocks, randomness, or environment state.
- `engine` is the only mechanical CardSpec section. `rules` is provenance only,
  and `planningAnnotations` is a closed interpretation schema with no mechanics.
- Final CardSpecs must pass the serializability, planning-boundary, capability-
  identity, and deep-freeze guards before use.
- Registry construction, projections and fingerprints remain pure, derived and
  deterministic. Runtime execution, GameState, LegalActions and AI decisions
  stay with their owning packages.
