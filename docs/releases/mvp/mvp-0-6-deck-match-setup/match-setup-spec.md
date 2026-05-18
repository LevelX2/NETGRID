# Match Setup 0.6 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Zweck

Match Setup verbindet Spielmodus, Controller, Seed, RulesBaseline und validierte Deck-Snapshots.

## Matchstart-Eingaben

Pflichtfelder:

- Modus: Human-vs-Human, Human-vs-KI oder KI-vs-KI,
- Runner-Deck-Snapshot,
- Corp-Deck-Snapshot,
- Seed,
- `agendaPointsToWin`,
- RulesBaseline,
- Kartenpool-Snapshot,
- Formatprofil.

## Serverautorität

Der Client darf Validierung anzeigen. Der Server validiert beim Matchstart erneut:

- Snapshot existiert,
- Snapshot-Hash stimmt,
- Snapshot ist gültig,
- Side passt,
- Karten sind spielbar und decklegal,
- Decklisten bleiben privat.

## Öffentlich erlaubte Deckmetadaten

Gegner darf standardmäßig nur sehen:

- Side,
- Identity,
- Deckname,
- Kartenpool-Snapshot,
- Formatprofil,
- Deck-Snapshot-Hash.

Vollständige gegnerische Decklisten bleiben privat und dürfen nicht in Bootstrap, WebSocket, Reconnect, Errors, Logs, PublicEvents oder Replays als öffentliche Daten erscheinen.

## Replay/StateHash

Ein Match speichert oder referenziert die unveränderlichen Snapshots eindeutig. Replay nutzt Snapshotdaten, nicht aktuelle Deckentwürfe.
