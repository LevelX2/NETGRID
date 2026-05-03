# Deck rules

- This package contains pure TypeScript deck model, validation, snapshot, import and export logic.
- No React, browser, WebSocket, database, file-system or engine dependencies.
- Deck validation may consume catalog/status data passed in by callers, but must not infer rules from card text.
- Match-start data must use immutable deck snapshots, not editable deck drafts.
- Public opponent metadata must never include full private decklists by default.
