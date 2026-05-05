# V1.0.4 Final Review

Stand: 2026-05-05

Status: complete

## Ergebnis

V1.0.4 Private Match Lifecycle und Session Recovery ist funktional umgesetzt. Der Release bleibt ein Match-/Server-/UI-Lifecycle-Release und erweitert weder Kartenpool noch Engine-Regeln noch öffentliche Plattformfunktionen.

## Abdeckung der Must-Anforderungen

- `cancelled`, `abandoned` und `forfeited` sind eindeutige terminale Match-Lifecycle-Status.
- Cancel, Leave, Forfeit und Recreate laufen als explizite REST-Lifecycle-Kommandos; WebSocket bleibt Broadcast- und Statuskanal.
- Forfeit erzeugt keinen Engine-Sieg, keine Engine-Action und keinen zusätzlichen Engine-Replay-Eintrag.
- `result.reason: "forfeit"`, Gewinner-/Verliererseite und `finalEngineStateHash` werden side-sicher geliefert.
- Recreate erzeugt neue MatchId, neuen Join-Link, neuen Seed und neue Tokens.
- Alte Join-/Session-/Reconnect-Tokens werden für Join, Bootstrap, Reconnect und Live-Aktionen ungültig.
- `netrunner.recentSessions` bleibt token-, decklisten-, deckhash- und hidden-info-frei.
- Fortsetzen, Reconnect und Verwerfen sind in der UI getrennte Pfade.
- Gegnernamen erscheinen in den freigegebenen UI- und Payload-Stellen ohne neue sensible Anhänge.

## Checks

Die finalen Pflichtchecks für diesen Stand sind bestanden:

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass, 153 Package-Tests plus 39 Root-Spec-Tests
- `corepack pnpm build`: pass
- `git diff --check`: pass, nur LF/CRLF-Hinweise für Web-Dateien

## Restpunkte

- V1.0.5 bleibt der nächste geplante Scope für Action Board UX, Board-Klarheit, deutsche UI-Regelbegriffe und visuelle Browser-Smokes.
- Keine V1.0.4-spezifischen Blocker sind bekannt.
