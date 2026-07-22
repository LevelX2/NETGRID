# Corp-Scoreline: sichtbarer Contest – Final Review

Status: abgeschlossen

## Ergebnis

Eine Corp darf eine Agenda nun in ein Remote hinter einem rezzbaren,
relevanten ICE installieren, obwohl der Runner viele Credits besitzt, solange
der Corp-PlayerView keinen installierten oder öffentlich vorbereiteten
Breaker-/Zugangspfad zeigt. Hohe Credits allein werden nicht mehr als Wissen
über die verdeckte Runner-Hand behandelt.

Die Änderung gilt ausschließlich für `install_card`-Actions mit
`payload.cardType === "agenda"` und sichtbarerer Agendaquelle. Sie erweitert
keine Informationen und verändert weder Engine-LegalActions noch
Hidden-Info-Grenzen.

## Erhaltene Schutzgrenzen

- Sichtbarer, bezahlbarer Fracter gegen ein Wall-ICE markiert die Scoreline
  weiterhin als `unsafe`.
- Fehlende Rezreserve, Zentraldruck, Multiaccess, sichtbare Zugänge und
  Advancement-/Funding-Verträge bleiben unverändert priorisiert.
- Assets, Upgrades und andere nicht-Agenda-Roots nehmen weiterhin den alten
  verzögerten Expositionspfad; die Rent-I-Con-/CODE-ROT-Checkpoint-Familie
  bleibt grün.

## Verifikation

- fokussierte Scoring-Window- und Decision-Checkpoint-Tests: 38/38 grün;
- `corepack pnpm --filter @netgrid/ai typecheck`: grün;
- `corepack pnpm check:ai`: grün;
- `corepack pnpm check:ai-deck-doctrine-strategy`: grün;
- `test:shard:1`: 141 Dateien, 1.040 Tests grün;
- `test:shard:2`: 141 Dateien, 1.014 Tests grün;
- `test:shard:3`: 140 Dateien, 877 Tests grün.

Der ungeshardete Einzelworker-Lauf erreichte vor der später erfolgreichen
Shard-Verifikation die externe Fünf-Minuten-Zeitgrenze und wird nicht als
bestanden gewertet.
