# V1.0.4 Private Match Lifecycle und Session Recovery

Status: requirements_ready
Stand: 2026-05-05

## Ziel

V1.0.4 macht private Matches kontrollierbar: erstellte Lobbys können sauber abgebrochen, aktive Spiele aufgegeben, Sessions sicher wiederaufgenommen und Gegner als Personen statt nur als Seite erkannt werden.

Der Release bleibt Match-/Server-/UI-Lifecycle. Er fügt keine Karten, keine Engine-Regeln und keine öffentlichen Plattformfunktionen hinzu.

## Konsolidierungsentscheidung 2026-05-05

Dieses Dokument ist der kanonische Detailplan für V1.0.4. `docs/releases/v1/v1-0-4-private-match-lifecycle/next-release-candidates.md` bleibt als Kandidaten- und Herkunftsdokument erhalten, überschreibt aber diesen Scope nicht.

Deutsche UI-Begriffe, Serverlayout/ICE-Ausrichtung und allgemeine Spieloberflächen-Politur sind V1.0.5 zugeordnet, sofern sie nicht direkt für Cancel, Leave, Forfeit, Reconnect, Recreate oder side-sichere Gegnernamen gebraucht werden.

## Requirements-Freeze-Ergänzung 2026-05-05

Die Umsetzung darf erst starten, wenn die folgenden Entscheidungen als verbindlich übernommen sind. Das ausführliche Requirements-Dokument liegt in `docs/releases/v1/v1-0-4-private-match-lifecycle/requirements.md`.

### Terminales Statusmodell

V1.0.4 unterscheidet Matchstatus bewusst statt alles über `finished` abzuwickeln:

| Status | Bedeutung | Winner | Engine-StateHash/Replays |
| --- | --- | --- | --- |
| `pending` | Match ist erstellt, aber noch nicht startbereit. | keiner | kein neuer Engine-State |
| `ready_check` | Beide Seiten sind bekannt, warten aber auf Ready. | keiner | GameState noch nicht aktiv gestartet |
| `countdown` | Start-Countdown läuft. | keiner | GameState noch nicht aktiv gestartet |
| `active` | Engine-Spiel läuft. | keiner, solange nicht beendet | Engine ist autoritativ |
| `cancelled` | Host/erstellende Seite beendet ein nicht aktives Match bewusst. | keiner | kein Engine-Sieg, kein Replay-Zwang |
| `abandoned` | Joiner verlässt nach serverseitiger Teilnahme ein nicht aktives Match. | keiner | kein Engine-Sieg, kein Replay-Zwang |
| `forfeited` | Menschlicher Spieler gibt ein aktives Spiel auf. | Gegenseite | letzter echter Engine-StateHash bleibt finaler Engine-StateHash; Replay läuft nur bis zum letzten Engine-Event |
| `finished` | Engine beendet das Spiel regelgerecht. | aus Engine-/ResultSummary | normaler Engine-Endzustand |

`expired` bleibt ein späterer Betriebs-/Cleanup-Status und ist kein Muss für V1.0.4.

### Joiner-Leave-Matrix

| Ausgangszustand | V1.0.4-Verhalten |
| --- | --- |
| Joiner öffnet Link, hat aber noch keine Decks eingereicht | Falls noch keine serverseitige Joiner-Session existiert, bleibt das Match `pending`. Falls eine Session existiert, wird nur diese Session invalidiert. Der Host-Link bleibt gültig. |
| `ready_check` | Joiner-Leave setzt das Match terminal auf `abandoned`, invalidiert Join-/Session-/Reconnect-Tokens dieses Matchs und bietet dem Host Recreate an. |
| `countdown` | Countdown wird sofort gestoppt; danach terminal `abandoned`. Es darf kein GameState mehr gestartet werden. |
| Reconnect nach Leave | Die verlassende Seite sieht einen side-sicheren terminalen Status oder eine sichere Ablehnung, aber keinen Rücksprung in `ready_check` oder `countdown`. |

Host-Cancel ist in `pending`, `ready_check` und `countdown` erlaubt und führt immer terminal zu `cancelled`.

### Forfeit-Ergebnismodell

Forfeit ist kein Engine-Sieg und keine verdeckte Engine-Action. Der Server modelliert es als Match-Lifecycle-Ergebnis:

- `status: "forfeited"`
- `result.reason: "forfeit"`
- `result.winnerSide`: Gegenseite der aufgebenden menschlichen Seite.
- `result.loserSide`: aufgebende menschliche Seite.
- `result.finalEngineStateHash`: StateHash des letzten echten Engine-Zustands.
- Replay enthält nur Engine-Ereignisse bis zu diesem letzten Zustand.
- Ein side-sicheres Lifecycle-Event darf an Clients gesendet werden, wird aber nicht als Engine-`PublicGameEvent` in den deterministischen Engine-Replaystrom eingeschleust.

Human-vs-KI ist explizit abgedeckt: Der Mensch darf gegen die KI aufgeben; die KI gibt in V1.0.4 nicht aktiv auf. Nach Forfeit stoppen KI-Pacing, Timer und `advance_ai`; spätere KI-/Action-Aufrufe werden sicher abgelehnt.

### Recreate-Semantik

Recreate erstellt immer ein neues Match:

- neue `matchId`
- neuer Join-Link
- neuer Seed
- neue Session-/Reconnect-Tokens
- keine Übernahme alter Joiner-Session
- keine Wiederverwendung alter Countdown- oder Ready-Zustände

Wenn Recreate aus `pending`, `ready_check` oder `countdown` ausgelöst wird, wird das alte Match zuerst terminal `cancelled`. Aus `cancelled` oder `abandoned` kann direkt neu erstellt werden. Aus `active` ist Recreate erst nach terminalem `forfeited` oder `finished` zulässig und bleibt ein neues Match, kein Fortsetzen.

`netgrid.recentSessions` darf dabei nur nicht-sensitive Metadaten aktualisieren oder verwerfen: MatchId, Seite, Anzeigename, safe Gegnername, letzter bekannter Status, Zeitstempel und lokaler UI-Hinweis sind erlaubt; Decklisten, Deckhashes, Session-Tokens, Reconnect-Tokens und verdeckte Kartendaten bleiben verboten.

### Session-Recovery ohne Token-Leak

`sessionStorage` bleibt der einzige Browser-Ort für Session-/Reconnect-Tokens. `netgrid.recentSessions` ist nur eine Merkliste für nicht-sensitive Sitzungsmetadaten.

Die UI unterscheidet:

- **Fortsetzen**: Token ist in `sessionStorage` vorhanden und kann serverseitig geprüft/rotiert werden.
- **Reconnect**: Nutzer gibt einen Join-/Reconnect-Pfad erneut ein oder nutzt einen noch gültigen Link; ohne Token aus `sessionStorage` darf keine stille Wiederaufnahme erfolgen.
- **Verwerfen**: lokaler Recent-Session-Eintrag wird gelöscht; serverseitig wird dadurch kein Match verändert.

Nach erfolgreichem Reconnect rotiert der Server Tokens und die UI ersetzt nur den tab-lokalen `sessionStorage`-Wert. Terminale Matches liefern stabile terminale Payloads.

### Gegnername und Transportweg

`displayName` wird als side-sicheres Match-Metadatum behandelt und darf in Lobby, Spielkopf, Result Modal, Reconnect Panel, OpponentPanel und `opponent_status`-Updates erscheinen. Nicht erlaubt sind Decknamen, Deckhashes, Decklisten, Tokens oder verdeckte Kartendaten.

Für V1.0.4 gilt: REST-Endpunkte sind die einzige Autorität für explizite Lifecycle-Kommandos (`cancel`, `leave`, `forfeit`, `recreate`, `discard local session`). WebSocket dient für Broadcasts, `opponent_status`, Countdown-/Lifecycle-Updates und UI-Aktualisierung, aber nicht als zweiter paralleler Schreibpfad für dieselben Kommandos.

## Muss-Anforderungen

| ID | Muss-Anforderung |
| --- | --- |
| V104-MUST-001 | Host kann ein nicht aktives Match in `pending`, `ready_check` oder `countdown` serverseitig abbrechen; Ergebnis ist terminal `cancelled`. |
| V104-MUST-002 | Joiner-Leave ist pro Phase fest definiert: vor Deckeinreichung bleibt Host-Pending möglich; aus `ready_check` oder `countdown` wird terminal `abandoned`. |
| V104-MUST-003 | Ein aktives Spiel kann durch einen menschlichen Spieler aufgegeben werden. Die Gegenseite erhält ein side-sicheres Ergebnis. |
| V104-MUST-004 | Abbruch, Leave und Aufgabe laufen nicht als verdeckte Engine-Regelaktion, sondern als dokumentierte Match-Lifecycle-Vorgänge. Replay/StateHash des bis dahin gespielten Zustands bleiben deterministisch. |
| V104-MUST-005 | Ein Match kann aus UI-Sicht mit denselben lokalen Einstellungen und Deckauswahlen neu erstellt werden; Recreate erzeugt immer neue MatchId, neuen Join-Link, neuen Seed und neue Tokens. |
| V104-MUST-006 | Reconnect bleibt tokenbasiert, rotiert Session-/Reconnect-Token und liefert nur side-sichere Payloads. |
| V104-MUST-007 | Die UI zeigt eine aktuell gemerkte lokale Sitzung verständlich an und trennt Fortsetzen mit vorhandenem Token, Reconnect über Link/Eingabe und rein lokales Verwerfen. |
| V104-MUST-008 | Die mit V1.0.3 eingeführte lokale Merkliste `netgrid.recentSessions` bleibt ein reiner lokaler Komfortpfad; sie darf keine Decklisten, Deckhashes, Session-Tokens, Reconnect-Tokens oder verdeckten Kartendaten enthalten. |
| V104-MUST-009 | Gegnernamen aus `displayName` werden side-sicher in Lobby, aktivem Spiel, Result Modal, Reconnect Panel, OpponentPanel und `opponent_status`-Updates angezeigt. |
| V104-MUST-010 | Nicht aktive Lobby-Zustände zeigen klar: wartet auf Joiner, wartet auf Decks, ready_check, countdown, cancelled, abandoned, gestartet oder nicht mehr verfügbar. |
| V104-MUST-011 | Hidden-Info-, Token-, Decklisten-, Reconnect-, Undo-, PublicEvent-, AI-Input- und Fehlerpayload-Verträge bleiben grün. |
| V104-MUST-012 | Explizite Lifecycle-Kommandos laufen über REST als einzigen Schreibpfad; WebSocket verteilt nur side-sichere Statusupdates. |
| V104-MUST-013 | Human-vs-KI-Forfeit ist abgedeckt: Mensch kann aufgeben, KI nicht; KI-Pacing, Timer und `advance_ai` stoppen danach sicher. |
| V104-MUST-014 | Mindestens ein wiederholbarer Zwei-Tab-Smoke deckt Host/Join/Cancel/Recreate/Reconnect/Forfeit ab; wenn Browser-Automation noch fehlt, muss ein reproduzierbares Smoke-Skript oder ein dokumentierter manueller Ablauf mit klaren Prüfpunkten entstehen. |

## Nicht-Ziele

- Keine Erweiterung des bestehenden privaten Lobbychats.
- Kein Matchmaking.
- Keine Accounts, Cloud-Sessions oder öffentlichen Spielerprofile.
- Kein Ranking, keine Turniere.
- Keine neue NETGRID-Regelmechanik.
- Keine Änderung der Engine-Regelautorität.
- Kein persistentes Session-Merken ohne ausdrückliches lokales Opt-in.
- Kein vollständiger Spectator- oder Replay-Browser.

## Betroffene Codebereiche

- `packages/shared/src/index.ts`
  - optionale shared Typen für Match-Lifecycle-Ergebnis, sichere Gegneridentität oder Statuscodes.
- `apps/server/src/multiplayer.ts`
  - neue Service-Methoden für Cancel/Leave/Forfeit/Recreate-Grunddaten.
  - `MatchStatus` um `cancelled`, `abandoned` und `forfeited` erweitern oder sauberere Match-Lifecycle-Felder ergänzen.
  - `SidePayload.opponentStatus` um safe `displayName` ergänzen.
  - ResultSummary/LifecycleResult für Aufgabe/Abbruch side-sicher modellieren.
- `apps/server/src/http-server.ts`
  - REST-Endpunkte als autoritativer Schreibpfad für Cancel, Leave, Forfeit, Recreate und lokale Session-Verwerfen-Hilfen.
  - WebSocket-Nachrichten nur für Lifecycle-, Countdown- und Opponent-Status-Broadcasts.
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
| Reconnect-Tokens landen dauerhaft unsicher im Browser. | `sessionStorage` bleibt Token-Speicher; `netgrid.recentSessions` darf nur nicht-sensitive Sitzungsmetadaten enthalten und bekommt explizite Leak-Tests. |
| Cancel/Leave verrät, welche Seite oder welche Decks existierten. | Payloads nur mit safe Status, Side und Anzeigename; keine Decklisten, Deckhashes oder Tokens. |
| Zwei parallele Join-/Cancel-Aktionen erzeugen inkonsistenten Status. | Match-Lock für Lifecycle-Operationen verwenden; Race-Tests ergänzen. |
| Recreate erzeugt versehentlich zwei aktive Matches. | Recreate atomar als Cancel-alt-plus-Create-neu oder erst nach terminalem Status; neue MatchId, neuer Link, neuer Seed, neue Tokens. |
| WebSocket und REST driften auseinander. | REST bleibt einziger Schreibpfad; WebSocket nur Broadcast. |
| KI handelt nach Forfeit weiter. | KI-Timer und `advance_ai` prüfen terminalen Status und werden nach Forfeit sicher abgelehnt. |

## Testszenarien

### Server/Unit

- Host cancel pending lobby: Status wird abgebrochen, Join-Link danach ungültig.
- Host cancel aus `pending`, `ready_check` und `countdown`: Status wird `cancelled`, Join-Link danach ungültig.
- Joiner leave vor Deckeinreichung: Host bleibt in sicherem Pending-Zustand, Joiner-Session ist invalidiert.
- Joiner leave aus `ready_check`: Status wird `abandoned`, Host erhält Recreate-Angebot.
- Joiner leave aus `countdown`: Countdown stoppt, Status wird `abandoned`, GameState startet nicht.
- Join nach Cancel wird sicher abgelehnt.
- Forfeit durch Runner: Match wird `forfeited`, Corp erhält Sieggrund `forfeit`, StateHash bleibt letzter Engine-StateHash.
- Forfeit durch Corp: analog Runner-Sieg.
- Forfeit durch Mensch gegen KI: Match wird `forfeited`, KI-Timer stoppen, `advance_ai` wird danach abgelehnt.
- Forfeit nach Matchende ist idempotent oder sicher abgelehnt.
- Cancel/Forfeit mit falscher Session, falscher Seite, altem Token oder falschem Match wird side-sicher abgelehnt.
- Reconnect nach Tokenrotation akzeptiert nur den neuen Reconnect-Token.
- Gegnername erscheint in safe Payloads, Tokens und Decklisten nicht.
- PublicEvents und AI-Inputs enthalten keine neuen Session- oder Lifecycle-Tokens.
- REST ist Schreibpfad; WebSocket-Lifecycle-Kommandos werden nicht als paralleler Autoritätsweg eingeführt.

### Web/Unit oder Contract

- `leaveMatch` bzw. der neue Lifecycle-Flow ist nicht mehr nur lokales Löschen, wenn eine serverseitige Lobby/Partie existiert.
- Pending-Lobby zeigt Abbrechen und Recreate.
- `ready_check` und `countdown` zeigen Abbrechen/Leave mit korrektem terminalem Ergebnis.
- Aktives Spiel zeigt Aufgabe mit Bestätigung.
- Session-Recovery zeigt Fortsetzen nur mit vorhandenem Token, Reconnect nur über Link/Eingabe und Verwerfen als rein lokale Aktion.
- Gegnername erscheint in Lobby, Header, Result Modal, Reconnect Panel, OpponentPanel und `opponent_status`.
- Sichtbare Texte verwenden deutsche Begriffe.

## Manuelle Playtests

1. Host erstellt Human-vs-Human-Lobby, kopiert Link, bricht ab, Joiner-Link danach prüfen.
2. Host erstellt Lobby, Joiner öffnet Link, verlässt vor Deckauswahl, Hoststatus prüfen.
3. Host erstellt Lobby, verwirft und erstellt mit denselben Decks neu; alter Link darf nicht starten.
4. Zwei Tabs treten bei, einer lädt neu, Reconnect fortsetzen.
5. Aktives Human-vs-Human-Spiel: Runner gibt auf, Corp sieht Ergebnis, Runner sieht Verlust, keine Decklisten im Payload.
6. Human-vs-KI-Spiel: Mensch gibt auf, KI-Status bleibt side-sicher.
7. Token-/Leak-Stichprobe im Browser: keine Session-/Reconnect-Tokens in `netgrid.recentSessions`, sichtbaren Logs oder Diagnostics.
8. Wiederholbarer Zwei-Tab-Smoke für Host/Join/Cancel/Recreate/Reconnect/Forfeit mit festen Prüfpunkten.

## Dokumentationsbedarf

- `docs/releases/v1/v1-0-4-private-match-lifecycle/requirements.md`
- `docs/derived/MATCH_LIFECYCLE_1_0_4_SPEC.md`
- keine separate `V1_0_4_TEST_MATRIX.md`
- keine separate `V1_0_4_REQUIREMENTS_REVIEW.md`
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
