# V1.0.4 Requirements Freeze

Stand: 2026-05-05
Status: frozen_for_implementation

## Zweck

Dieses Dokument friert die V1.0.4-Anforderungen für Private Match Lifecycle und Session Recovery ein. Es ergänzt den kanonischen Plan `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md` und ist vor der Umsetzung verbindlich zu beachten.

V1.0.4 bleibt ein Match-/Server-/UI-Lifecycle-Release. Es gibt keine neuen Karten, keine neuen Engine-Regeln, keine offiziellen Assets, keine Accounts, kein Matchmaking, keine Rankings und keine öffentlichen Plattformfunktionen.

## Verbindliches Statusmodell

| Status | Bedeutung | Terminal | Winner | Engine-/Replay-Regel |
| --- | --- | --- | --- | --- |
| `pending` | Match ist erstellt, wartet aber noch auf Joiner oder Decks. | nein | keiner | kein neuer Engine-State |
| `ready_check` | Beide Seiten sind bekannt und warten auf Bereitschaft. | nein | keiner | GameState noch nicht aktiv gestartet |
| `countdown` | Start-Countdown läuft. | nein | keiner | GameState noch nicht aktiv gestartet |
| `active` | Engine-Spiel läuft. | nein | keiner, solange nicht beendet | Engine ist autoritativ |
| `cancelled` | Host/erstellende Seite beendet ein nicht aktives Match bewusst. | ja | keiner | kein Engine-Sieg |
| `abandoned` | Joiner verlässt nach serverseitiger Teilnahme ein nicht aktives Match. | ja | keiner | kein Engine-Sieg |
| `forfeited` | Menschlicher Spieler gibt ein aktives Spiel auf. | ja | Gegenseite | letzter echter Engine-StateHash bleibt finaler Engine-StateHash |
| `finished` | Engine beendet das Spiel regelgerecht. | ja | aus Engine-/ResultSummary | normaler Engine-Endzustand |

`expired` ist kein V1.0.4-Muss. Ein späterer Cleanup-/Betriebsrelease darf den Status ergänzen.

## Cancel und Leave

Host-Cancel ist in `pending`, `ready_check` und `countdown` erlaubt. Ergebnis ist immer terminal `cancelled`; alte Join-Links, Session-Tokens und Reconnect-Tokens werden ungültig.

Joiner-Leave ist phasenabhängig:

| Ausgangszustand | Ergebnis |
| --- | --- |
| Link geöffnet, keine Decks eingereicht, keine serverseitige Joiner-Session | Match bleibt `pending`; kein Engine-/Lifecycle-Ereignis nötig. |
| Serverseitige Joiner-Session existiert, aber Deckeinreichung ist nicht abgeschlossen | Joiner-Session wird invalidiert; Host bleibt in sicherem Pending-Zustand. |
| `ready_check` | Match wird terminal `abandoned`; Host erhält Recreate-Möglichkeit. |
| `countdown` | Countdown stoppt; Match wird terminal `abandoned`; GameState darf nicht starten. |

Reconnect nach Leave darf nicht in `ready_check` oder `countdown` zurückführen. Die verlassende Seite sieht einen side-sicheren terminalen Status oder eine sichere Ablehnung.

## Forfeit

Forfeit ist kein Engine-Game-Ende und keine Engine-`PlayerAction`. Forfeit ist ein Match-Lifecycle-Ergebnis über dem letzten echten Engine-Zustand.

Ergebnisanforderungen:

- `status: "forfeited"`
- `result.reason: "forfeit"`
- `result.winnerSide`: Gegenseite der aufgebenden menschlichen Seite.
- `result.loserSide`: aufgebende menschliche Seite.
- `result.finalEngineStateHash`: StateHash des letzten echten Engine-Zustands.
- Replay enthält nur Engine-Ereignisse bis zum letzten echten Engine-Zustand.
- Lifecycle-Broadcasts bleiben side-sicher und werden nicht in den deterministischen Engine-Replaystrom eingeschleust.

Human-vs-KI ist explizit enthalten: Der Mensch kann gegen die KI aufgeben. Die KI gibt in V1.0.4 nicht aktiv auf. Nach Forfeit stoppen KI-Pacing, Timer und `advance_ai`; spätere KI-/Action-Aufrufe werden sicher abgelehnt.

## Recreate

Recreate erstellt immer ein neues Match:

- neue `matchId`
- neuer Join-Link
- neuer Seed
- neue Session-/Reconnect-Tokens
- keine Übernahme alter Joiner-Session
- keine Wiederverwendung alter Ready-/Countdown-Zustände

Wenn Recreate aus `pending`, `ready_check` oder `countdown` ausgelöst wird, muss das alte Match zuerst terminal `cancelled` werden. Aus `cancelled` oder `abandoned` darf direkt neu erstellt werden. Aus `active` ist Recreate erst nach `forfeited` oder `finished` zulässig.

`netgrid.recentSessions` darf beim Recreate nur nicht-sensitive Metadaten anpassen oder entfernen. Erlaubt sind MatchId, Seite, eigener Anzeigename, safe Gegnername, letzter bekannter Status, Zeitstempel und lokale UI-Hinweise. Verboten bleiben Decklisten, Deckhashes, Session-Tokens, Reconnect-Tokens und verdeckte Kartendaten.

## Session-Recovery

`sessionStorage` bleibt der einzige Browser-Speicherort für Session-/Reconnect-Tokens. `netgrid.recentSessions` bleibt eine nicht-sensitive Komfortliste.

Die UI unterscheidet verbindlich:

- **Fortsetzen**: Token ist in `sessionStorage` vorhanden; Server prüft und rotiert ihn.
- **Reconnect**: Nutzer gibt einen Link/Pfad erneut ein; ohne Token gibt es keine stille Wiederaufnahme.
- **Verwerfen**: nur lokales Löschen eines Recent-Session-Eintrags; verändert kein serverseitiges Match.

Terminale Matches liefern stabile terminale Payloads. Erfolgreicher Reconnect rotiert Tokens und ersetzt nur tab-lokale `sessionStorage`-Werte.

## Gegnername

`displayName` ist side-sicheres Match-Metadatum. Anzeige ist erlaubt in:

- Lobby
- Spielkopf/Header
- Result Modal
- Reconnect Panel
- OpponentPanel
- `opponent_status`-Updates
- terminalen Lifecycle-Payloads

Nicht erlaubt sind Decknamen, Deckhashes, Decklisten, Session-Tokens, Reconnect-Tokens oder verdeckte Kartendaten der Gegenseite.

## Transportweg

REST ist der einzige Schreibpfad für explizite Lifecycle-Kommandos:

- cancel
- leave
- forfeit
- recreate
- local recent-session discard helpers, sofern serverseitig nötig

WebSocket dient nur für side-sichere Broadcasts, `opponent_status`, Countdown-/Lifecycle-Updates und UI-Aktualisierung. V1.0.4 darf keine parallelen WebSocket-Schreibkommandos für dieselben Lifecycle-Operationen einführen.

## Tests und Akzeptanz

Automatisierte oder reproduzierbare Tests müssen abdecken:

- Host-Cancel aus `pending`, `ready_check`, `countdown`.
- Joiner-Leave vor Deckeinreichung, aus `ready_check`, aus `countdown`.
- Reconnect nach `cancelled`, `abandoned`, `forfeited`.
- Forfeit Runner, Forfeit Corp, Human-vs-KI-Forfeit.
- Forfeit erhält letzten Engine-StateHash und fälscht keinen Engine-Sieg.
- `advance_ai` und KI-Timer stoppen nach Forfeit.
- Recreate erzeugt neue MatchId, neuen Link, neuen Seed und neue Tokens.
- `netgrid.recentSessions` enthält keine Tokens, Decklisten, Deckhashes oder Hidden Info.
- Gegnername erscheint an den freigegebenen UI-/Payload-Stellen ohne zusätzliche sensible Daten.
- REST ist Lifecycle-Schreibpfad; WebSocket ist Broadcast-Pfad.
- Mindestens ein wiederholbarer Zwei-Tab-Smoke deckt Host/Join/Cancel/Recreate/Reconnect/Forfeit mit klaren Prüfpunkten ab.

Pflichtchecks:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`
