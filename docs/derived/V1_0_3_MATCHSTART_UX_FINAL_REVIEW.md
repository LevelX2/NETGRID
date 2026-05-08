# V1.0.3 Matchstart-UX Final Review

Stand: 2026-05-04

## Ergebnis

V1.0.3 ist lokal umgesetzt und verifiziert. Der Startscreen trennt nun Spielart, Seitenzuteilung bzw. eigene Seite und Spielziel. `Mensch gegen Mensch · privater Link`, `Mensch gegen KI` und `KI gegen KI · Simulation` sind sichtbar getrennte Einstiegspfade. `Auslosen` ist für Mensch gegen Mensch und Mensch gegen KI verfügbar und jeweils Default.

Für normale Mensch-gegen-Mensch-Matches mit Joiner-Deck-Handshake erzeugt der Server nach der Joiner-Deckvalidierung keinen `GameState` mehr. Stattdessen entsteht eine side-sichere Startbereitschaftslobby mit Ready-Flags, Countdown 3/5/10 Sekunden, Abbruch und privatem Lobbychat. Erst nach erfolgreichem serverseitigem Countdown wird der `GameState` erzeugt und das Match aktiv.

## Umgesetzter Scope

- Startscreen mit getrennten Entscheidungen für Spielart, Seitenwahl und Spielziel.
- Web-Helfer `apps/web/app/match-start.ts` für testbare Matchstart-Ableitung.
- Serverseitige deterministische Auslosung für Mensch-gegen-KI über `playMode: "human_vs_ai"` und `humanSide: "random"`.
- Host/Join sichtbar als `Match erstellen` und `Beitreten`.
- Tatsächlich zugeteilte eigene Seite wird nach Erstellen oder Beitritt angezeigt.
- Anzeigename wird lokal unter `netgrid.displayName` gespeichert und wieder vorbefüllt.
- Startbereitschaftslobby mit `ready_check`, `countdown`, Ready-Flags, Countdown-Abbruch, Reconnect-Payloads und grobem Verbindungsstatus.
- Privater Lobbychat nur für die zwei Sessions; Chattexte berühren nicht Engine, Replay, StateHash, AI-Inputs oder PublicGameEvents.
- Lobby-Payloads enthalten keine gegnerischen Decknamen, Deckhashes, Decklisten, Tokens oder verdeckten Kartendaten.
- `single_game`/`Einzelspiel · Deckziel` wird bei Pending-Lobbys aus dem finalen Corp-DeckSetup nach dem Joiner-Handshake abgeleitet.
- V1.0.2-KI-Pacing bleibt über die bestehenden technischen AI-MatchModes erhalten.

## Verifikation

- `corepack pnpm --filter @netgrid/web test`: pass, 14 Tests.
- `corepack pnpm --filter @netgrid/server test`: pass, 28 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 11 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 186 Pakettests plus 39 Root-Spec-Tests.
- `corepack pnpm build`: pass.

Nachtrag 2026-05-05: Ein manueller Zwei-Tab-Test zeigte zunächst altes Laufzeitverhalten, weil der lokale Serverprozess noch mit vorigem Code lief. Der Server wurde neu gestartet, der Dev-Start läuft nun im Watch-Modus, und ein zusätzlicher Server-Test deckt den konkreten Ablauf Host wartet auf Joiner-Decks -> Joiner sendet Decks -> beide Tabs bleiben in `ready_check` ab. Die Lobby-UI wurde nachgeschärft: einheitliche Breite, keine Start-/Beitreten-Maske während einer bestehenden Lobby, klar getrennte Ready-Status-/Aktionsbeschriftung, erklärter Zielwert mit Agenda-Punkten, Zurück-Knopf ohne Browser-Refresh und automatischer Chat-Scroll ans Nachrichtenende. Weitere UX-Nachschärfungen: Run-Zeitstrahl normalisiert zentrale Serverlabels wie `HQ`, Audio wird beim Einschalten per Testton entsperrt und bleibt im Spiel über ein aufklappbares Audio-Menü erreichbar, das `Runner-Rig` wird im Boardbereich direkt oberhalb des Run-Zeitstrahls mit Run-Icon angezeigt, und lokale Sessions werden für eine manuelle Wiederverbindung als letzte Sitzung gemerkt. `corepack pnpm --filter @netgrid/server test`: pass, 29 Tests.

## Bekannte Grenzen

- Kein Accountsystem, kein Matchmaking, keine Rankings, keine öffentlichen Plattformfunktionen.
- Lobbychat ist bewusst nur private Zwei-Personen-Lobby und verschwindet nach Matchstart.
- Verbindungsqualität bleibt grob (`online`, `instabil`, `offline`) und ist keine echte Netzwerkdiagnostik.
- Browser-Smokes für Zwei-Fenster-Lobby/Countdown/Chat wurden in diesem Abschluss nicht zusätzlich automatisiert ausgeführt; die verifizierte Abdeckung liegt in Server-, Web- und Visibility-Tests.
- Spiel/Lobby abbrechen, aktives Aufgeben und sichtbarere Gegnernamen sind bewusst nicht Teil von V1.0.3; sie sind als V1.0.4-Kandidaten in `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md` gesammelt.

## Gate-Ergebnis

`V1_0_3_matchstart_ux_done: true`
