# S01 Result Modal Spec

Status: frozen_for_implementation
Stand: 2026-05-03

## Zweck

Das Ergebnisfenster macht das Spielende sichtbar, ohne neue Regelautorität zu erzeugen.

## Trigger

Das Fenster darf nur aus autoritativen Daten erscheinen:

- `PlayerView.winner`,
- `match_finished`,
- Bootstrap/Reconnect-Payload mit beendetem Match und `GameResultSummary`.

## Texte

- Sieg: `Du hast das Spiel gewonnen.`
- Niederlage: `Du hast das Spiel verloren.`
- Draw: `Das Spiel endet unentschieden.`

## Statistik

Das Fenster zeigt:

- Runner- und Corp-Agenda-Punkte,
- Agenda-Zielwert,
- Aktionen,
- Runs,
- erfolgreiche Runs,
- gestohlene Agendas,
- gescorte Agendas,
- gekürzten finalen StateHash.

Bei `two_game_side_swap` zeigt das Fenster zusätzlich:

- aktuelles Serienspiel,
- geplante Spielanzahl,
- eigene Serien-Siege,
- Gegenseite-Siege,
- Draws,
- Status oder Verfügbarkeit des nächsten Serienspiels.

## Datenregeln

Das Modal darf keine FullState-Daten, `cardInstances`, privaten Payloads, Tokens, verdeckten Kartentitel oder privaten Decklisten lesen oder anzeigen.

## Grafik

Der Hintergrund ist eine lokale, abstrakte UI-Grafik per CSS. Er nutzt keine offiziellen NETGRID-Artworks, Logos, Frames oder Backs.
