# Web UI rules

- UI is not a rule authority.
- UI renders PlayerView, LegalActions, ChoiceRequests, public/side-filtered events, and local client state only.
- UI must never receive or display full GameState in normal player mode.
- Normale Spieler-, Replay-, Spectator- und öffentliche Debugansichten dürfen
  keine gegnerischen Hidden-Informationen leaken.
- Die ausdrücklich privilegierte private KI-Debuganzeige des lokalen
  Projektbetreibers ist die bekannte Ausnahme: Sie darf und soll zur
  Playtest-Kontrolle die vollständigen Karten beider Seiten sowie die
  Zugplanung anzeigen. Diese Daten dürfen nicht in PlayerView, PublicEvents,
  öffentliche Replays, normale WebSocket-/Reconnect-Payloads, Logs oder
  Clientfehler übernommen werden.
- MVP 0.1 UI may be minimal and desktop-oriented.
- MVP 0.2 UI must support two browser windows/devices, join link, connection status, waiting states, reconnect state, and undo prompts.
