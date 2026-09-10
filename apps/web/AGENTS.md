# Web UI rules

- UI is not a rule authority.
- UI renders PlayerView, LegalActions, ChoiceRequests, public/side-filtered events, and local client state only.
- UI must never receive or display full GameState in normal player mode.
- Normale Spieler-, Replay-, Spectator- und öffentliche Debugansichten dürfen
  keine gegnerischen Hidden-Informationen leaken.
- Die ausdrücklich privilegierte private KI-Debuganzeige des lokalen
  Projektbetreibers ist die bekannte Ausnahme: Sie darf und soll zur
  Playtest-Kontrolle die vollständige Hand der aktiven KI sowie die Zugplanung
  anzeigen, nicht jedoch die Hand des menschlichen Spielers. Diese Daten dürfen
  nicht in PlayerView, PublicEvents, öffentliche Replays, normale
  WebSocket-/Reconnect-Payloads, Logs oder Clientfehler übernommen werden.
- Preserve the current multiplayer contract for join links, connection and waiting states, reconnect and undo prompts; validate only the UI flows affected by a change.
