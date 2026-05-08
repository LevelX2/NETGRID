# V1.0.4 Implementation Review

Stand: 2026-05-05

Status: implemented_pending_final_gate

## Grundlage

Maßgeblich für die Umsetzung sind:

- `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`
- `docs/derived/V1_0_4_REQUIREMENTS.md`

`docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md` bleibt Kandidaten- und Herkunftsdokument, ist aber keine gleichrangige Implementierungsspezifikation.

## Umgesetzter Scope

- Server-Lifecycle-Status `pending`, `cancelled`, `abandoned` und `forfeited` wurden in den bestehenden Multiplayer-Service integriert.
- Host-Cancel ist aus `pending`, `ready_check` und `countdown` über REST möglich und endet terminal mit `cancelled`.
- Joiner-Leave bleibt vor serverseitiger Teilnahme ohne Lifecycle-Event sicher; aus `ready_check` und `countdown` endet es terminal mit `abandoned`.
- Forfeit ist ein Match-Lifecycle-Ergebnis über dem letzten echten Engine-State, keine Engine-`PlayerAction` und kein gefälschter Engine-Sieg.
- Human-vs-KI-Forfeit erlaubt nur die menschliche Seite; KI-Pacing und `advance_ai` stoppen nach `forfeited`.
- Recreate erzeugt neue MatchId, neuen Join-Link, neuen Seed sowie neue Session-/Reconnect-Tokens und lässt die alte Lobby terminal.
- Alte Join-, Session- und Reconnect-Tokens werden für Bootstrap, Join, Reconnect und weitere Aktionen ungültig; terminale Recreate-Autorisierung nutzt nur den serverseitig bekannten Host-Kontext.
- `netgrid.recentSessions` ist auf nicht-sensitive Komfortmetadaten begrenzt; Tokens, Decklisten, Deckhashes und Hidden Info bleiben im Browser-`localStorage` ausgeschlossen.
- Die Web-UI trennt Fortsetzen, Reconnect über Link/Eingabe und Verwerfen.
- Gegnernamen aus `displayName` werden side-sicher in Lobby, Header, Result Modal, Reconnect Panel, OpponentPanel und `opponent_status` angezeigt.

## Nicht umgesetzt

Nicht Teil von V1.0.4 und nicht umgesetzt:

- neue Karten oder Engine-Regeln
- offizielle Assets, Card Frames, Card Backs oder externe Kartendatenbank-Abhängigkeiten
- Accounts, Matchmaking, Rankings, Turnierfunktionen oder öffentliche Plattformfunktionen
- deutsche UI-Regelglossar-Politur und Board-Klarheit außerhalb der Lifecycle-Oberflächen; diese bleiben V1.0.5

## Testabdeckung

- Server-Tests für Host-Cancel aus `pending`, `ready_check` und `countdown`.
- Server-Tests für Joiner-Leave vor Deckeinreichung, aus `ready_check` und aus `countdown`.
- Server-Tests für Runner-/Corp-/Human-vs-KI-Forfeit.
- Server-Tests für finalen Engine-StateHash und Replay bis zum letzten echten Engine-State.
- Server-Tests für Token-Rotation, Token-Invalidierung, terminale Payloads und Recreate.
- Visibility-Contract-Test für Recent-Session-Sanitizing, REST-Lifecycle-Pfade, Reconnect/Fortsetzen/Verwerfen und Gegnernamen.
- Wiederholbarer Zwei-Tab-Smoke dokumentiert in `docs/derived/V1_0_4_TWO_TAB_SMOKE.md`.

## Ergebnis

Die Implementierung erfüllt den V1.0.4 Requirements Freeze auf Code- und Testebene. Das finale Gate bleibt an den vollständigen Pflichtcheck-Lauf gebunden.
