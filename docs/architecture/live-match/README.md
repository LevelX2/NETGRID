# Live-Match-Systeme

`docs/architecture/live-match/` bündelt releaseübergreifende Konzepte für sichtbare Matchsysteme wie Timer, Audio-Cues und serverseitige Synchronisation.

## Enthaltene Artefakte

- `audio-cue-sound-matrix-2026-05-17.md`
- `player-clock-grace-period-contract-2026-05-19.md`
- `timer-server-sync-contract-2026-05-17.md`
- `visible-match-timer-system-concept-2026-05-17.md`

## Spielupdates und Aktionsbindung

Jedes aktive oder abgeschlossene Spielupdate enthält den vollständigen
side-sicheren `ApiSidePayload`. Im WebSocket ist `state_update` seine
Nachricht. LegalActions, der begrenzte öffentliche Ereignisausschnitt und
die angebotene Choice stehen in der PlayerView. Undo, KI-Zugzustand,
Gegnerstatus und Spielende stehen im selben Update. Verbindungsstatus kann
auch eigenständig übermittelt werden.

Aktionsanfragen tragen StateVersion und MatchVersion aus demselben
Update. Undo-Anfragen binden die Ziel-Ereignis-ID an die MatchVersion.
Der Server prüft diese Versionen unter dem Match-Lock. Nach einer
Zurücknahme kann die StateVersion erneut vorkommen. Die fortlaufende
MatchVersion bindet neue Anfragen an den aktuellen Verlauf.

## Wiederaufnahme zwischen Serienspiel und Folgespiel

Der Server speichert das abgeschlossene Serienspiel und dessen Ergebnis.
Sind weitere Spiele geplant, bleibt die Serie im Zustand `between_games`.
Der Client erhält die lokale Matchsitzung, solange das Ergebnis ein weiteres
Serienspiel anbietet. Ein Reload öffnet denselben Ergebnisstand. Über
„Startbildschirm“ und „Fortsetzen“ lässt sich die Sitzung auch innerhalb
des Browsers wieder öffnen. „Serie verlassen“ entfernt nach Bestätigung
die Browser-Sitzung. Sobald der Client das Folgespiel übernimmt, ersetzt
dessen Sitzung die vorherige. Nach dem letzten Spiel entfernt der Client
die gespeicherten Zugangsdaten.

Dieser Weg verwendet die vorhandenen Match-Zugangsdaten im Browser.
Die kontogebundene Wiederaufnahme erfasst aktive öffentliche Spiele mit
eigener Teilnehmerbindung.

## Regel

Diese Konzepte beschreiben UI-/Server-Verträge und geben keine zusätzlichen Multiplayer-, Replay- oder KI-Funktionen frei.
