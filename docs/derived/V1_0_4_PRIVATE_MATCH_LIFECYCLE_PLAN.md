# V1.0.4 Private Match Lifecycle und Session Recovery

Status: detailed_plan
Stand: 2026-05-05

## Ziel

V1.0.4 macht private Matches kontrollierbar: erstellte Lobbys können sauber abgebrochen, aktive Spiele aufgegeben, Sessions sicher wiederaufgenommen und Gegner als Personen statt nur als Seite erkannt werden.

Der Release bleibt Match-/Server-/UI-Lifecycle. Er fügt keine Karten, keine Engine-Regeln und keine öffentlichen Plattformfunktionen hinzu.

## Muss-Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V104-MUST-001 | Host kann eine pending Lobby serverseitig abbrechen. |
| V104-MUST-002 | Joiner kann eine Lobby verlassen, ohne ein aktives Match zu beschädigen. |
| V104-MUST-003 | Ein aktives Spiel kann durch einen menschlichen Spieler aufgegeben werden. Die Gegenseite erhält ein side-sicheres Ergebnis. |
| V104-MUST-004 | Abbruch und Aufgabe laufen nicht als verdeckte Engine-Regelaktion, sondern als dokumentierter Match-Lifecycle-Vorgang. Replay/StateHash des bis dahin gespielten Zustands bleiben deterministisch. |
| V104-MUST-005 | Ein erstelltes Match kann aus UI-Sicht mit denselben lokalen Einstellungen und Deckauswahlen neu erstellt werden. Das alte Match wird dabei nicht stillschweigend aktiv gelassen. |
| V104-MUST-006 | Reconnect bleibt tokenbasiert, rotiert Session-/Reconnect-Token und liefert nur side-sichere Payloads. |
| V104-MUST-007 | Die UI zeigt eine aktuell gemerkte lokale Sitzung verständlich an und bietet Fortsetzen, Reconnect und Verwerfen an. |
| V104-MUST-008 | Die mit V1.0.3 eingeführte lokale Merkliste `netrunner.recentSessions` bleibt ein reiner lokaler Komfortpfad; sie darf keine Decklisten, Deckhashes, Session-Tokens, Reconnect-Tokens oder verdeckten Kartendaten enthalten. |
| V104-MUST-009 | Gegnernamen aus `displayName` werden side-sicher in Lobby und aktivem Spiel angezeigt. |
| V104-MUST-010 | Pending-Lobby-Zustände zeigen klar: wartet auf Joiner, wartet auf Decks, abgebrochen, gestartet oder nicht mehr verfügbar. |
| V104-MUST-011 | Hidden-Info-, Token-, Decklisten-, Reconnect-, Undo-, PublicEvent-, AI-Input- und Fehlerpayload-Verträge bleiben grün. |

## Nicht-Ziele

- Keine Erweiterung des bestehenden privaten Lobbychats.
- Kein Matchmaking.
- Keine Accounts, Cloud-Sessions oder öffentlichen Spielerprofile.
- Kein Ranking, keine Turniere.
- Keine neue Netrunner-Regelmechanik.
- Keine Änderung der Engine-Regelautorität.
- Kein persistentes Session-Merken ohne ausdrückliches lokales Opt-in.
- Kein vollständiger Spectator- oder Replay-Browser.

## Betroffene Codebereiche

- `packages/shared/src/index.ts`
  - optionale shared Typen für Match-Lifecycle-Ergebnis, sichere Gegneridentität oder Statuscodes.
- `apps/server/src/multiplayer.ts`
  - neue Service-Methoden für Cancel/Leave/Forfeit/Recreate-Grunddaten.
  - `MatchStatus` erweitern oder sauberere Match-Lifecycle-Felder ergänzen.
  - `SidePayload.opponentStatus` um safe `displayName` ergänzen.
  - ResultSummary für Aufgabe/Abbruch side-sicher modellieren.
- `apps/server/src/http-server.ts`
  - REST-Endpunkte für Cancel, Leave, Forfeit und ggf. Recreate/Resume-Info.
  - optional WebSocket-Nachrichten für Lifecycle-Events.
- `apps/server/src/multiplayer.test.ts`
  - serverseitige Lifecycle-, Payload- und Race-Tests.
- `apps/web/app/page.tsx`
  - serverseitige Lobby-Aktionen, Reconnect-/Session-Recovery-Panel mit Verwerfen, Gegnernamen, Recreate-Flow.
- `apps/web/app/globals.css`
  - einfache, klare Lobby- und Statuszustände.
- `tests/specs/visibility-contract.test.ts`
  - Session-/Lifecycle-Leak-Checks.

## Risiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| Aufgabe wird fälschlich als Engine-Winner modelliert und verfälscht Replay/StateHash. | Aufgabe als Match-Lifecycle-Event dokumentieren; finalen Spiel-StateHash des letzten Engine-Zustands beibehalten; Tests für Replay bis letztem Engine-Event. |
| Reconnect-Tokens landen dauerhaft unsicher im Browser. | `sessionStorage` bleibt Token-Speicher; `netrunner.recentSessions` darf nur nicht-sensitive Sitzungsmetadaten enthalten und bekommt explizite Leak-Tests. |
| Cancel/Leave verrät, welche Seite oder welche Decks existierten. | Payloads nur mit safe Status, Side, Anzeigename und public Deckmetadaten; keine Decklisten, keine Tokens. |
| Zwei parallele Join-/Cancel-Aktionen erzeugen inkonsistenten Status. | Match-Lock für Lifecycle-Operationen verwenden; Race-Tests ergänzen. |
| Recreate erzeugt versehentlich zwei aktive Matches. | Recreate aus UI erst nach erfolgreichem Cancel oder bewusst als neues Match mit deutlichem Hinweis. |

## Testszenarien

### Server/Unit

- Host cancel pending lobby: Status wird abgebrochen, Join-Link danach ungültig.
- Joiner leave pending lobby: Host sieht side-sicheren Lobby-Status, Match bleibt abhängig vom Modell offen oder abgebrochen.
- Join nach Cancel wird sicher abgelehnt.
- Forfeit durch Runner: Match wird beendet, Corp erhält Sieggrund Aufgabe, StateHash bleibt letzter Engine-StateHash.
- Forfeit durch Corp: analog Runner-Sieg.
- Forfeit nach Matchende ist idempotent oder sicher abgelehnt.
- Cancel/Forfeit mit falscher Session, falscher Seite, altem Token oder falschem Match wird side-sicher abgelehnt.
- Reconnect nach Tokenrotation akzeptiert nur den neuen Reconnect-Token.
- Gegnername erscheint in safe Payloads, Tokens und Decklisten nicht.
- PublicEvents und AI-Inputs enthalten keine neuen Session- oder Lifecycle-Tokens.

### Web/Unit oder Contract

- `leaveMatch` bzw. der neue Lifecycle-Flow ist nicht mehr nur lokales Löschen, wenn eine serverseitige Lobby/Partie existiert.
- Pending-Lobby zeigt Abbrechen und Recreate.
- Aktives Spiel zeigt Aufgabe mit Bestätigung.
- Session-Recovery zeigt Fortsetzen, Reconnect und Verwerfen.
- Gegnername erscheint im OpponentPanel.
- Sichtbare Texte verwenden deutsche Begriffe.

## Manuelle Playtests

1. Host erstellt Human-vs-Human-Lobby, kopiert Link, bricht ab, Joiner-Link danach prüfen.
2. Host erstellt Lobby, Joiner öffnet Link, verlässt vor Deckauswahl, Hoststatus prüfen.
3. Host erstellt Lobby, verwirft und erstellt mit denselben Decks neu; alter Link darf nicht starten.
4. Zwei Tabs treten bei, einer lädt neu, Reconnect fortsetzen.
5. Aktives Human-vs-Human-Spiel: Runner gibt auf, Corp sieht Ergebnis, Runner sieht Verlust, keine Decklisten im Payload.
6. Human-vs-KI-Spiel: Mensch gibt auf, KI-Status bleibt side-sicher.
7. Token-/Leak-Stichprobe im Browser: keine Session-/Reconnect-Tokens in `netrunner.recentSessions`, sichtbaren Logs oder Diagnostics.

## Dokumentationsbedarf

- `docs/derived/V1_0_4_REQUIREMENTS.md`
- `docs/derived/MATCH_LIFECYCLE_1_0_4_SPEC.md`
- `docs/derived/V1_0_4_TEST_MATRIX.md`
- `docs/derived/V1_0_4_REQUIREMENTS_REVIEW.md`
- nach Umsetzung: Implementation Review und Final Review.
- `docs/codex/CODEX_STATUS.md` und Wissensbasis aktualisieren.

## Akzeptanzkriterien

V1.0.4 ist done, wenn:

- pending Lobbys serverseitig abbrechbar sind,
- aktive Spiele side-sicher aufgegeben werden können,
- Recreate keine stale aktive Lobby zurücklässt,
- Reconnect und tab-lokale Session-Recovery verständlich funktionieren,
- Gegnernamen angezeigt werden,
- Zwei-Tab-Smoke für Host/Join/Cancel/Recreate/Reconnect/Forfeit bestanden ist,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` grün sind,
- Hidden-Info-, Replay-/StateHash-, PublicEvent- und AI-Input-Verträge grün bleiben.
