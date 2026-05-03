# Web UI rules

- UI is not a rule authority.
- UI renders PlayerView, LegalActions, ChoiceRequests, public/side-filtered events, and local client state only.
- UI must never receive or display full GameState in normal player mode.
- Debug views must not leak opponent hidden information.
- MVP 0.1 UI may be minimal and desktop-oriented.
- MVP 0.2 UI must support two browser windows/devices, join link, connection status, waiting states, reconnect state, and undo prompts.
