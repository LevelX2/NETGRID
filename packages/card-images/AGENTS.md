# Card image package rules

- This package owns server-side/local filesystem contracts for card-image
  storage, import preparation, normalization and runtime lookup metadata.
- It may depend on `@netgrid/catalog` for canonical `printingId` metadata, but
  never on Engine, AI, decks, React, browser state, WebSocket or databases.
- Remote fetching is forbidden in runtime paths. IMG06 permits direct HTTPS
  image sources only in the explicitly selected preparation import, with
  rights confirmation, public-target pinning, redirect revalidation and fixed
  download limits. The normal local import remains network-free.
- Every filesystem target must be derived from an explicit validated root and
  safe relative identifiers. Never expose absolute paths in browser payloads.
- Image assets are display-only and must not affect GameState, LegalActions,
  PlayerActions, replay, StateHash, deck legality or AI input.
- Imports and binding changes are fail-closed and atomic.
