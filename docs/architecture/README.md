# Architektur-Dokumentation

`docs/architecture/` ist der Zielbereich für releaseübergreifendes Architekturwissen: technische Zielbilder, Schichtgrenzen, Engine-Konzepte und länger gültige Refactoring-Pläne.

## Bereiche

- `ability-engine/`: Kartenlogik, CardDefinition-/Ability-DSL-Zielbild und inkrementeller Refactoring-Plan für die Engine-Migration.
- `ai/`: KI-Controller, Simulationstestmatrix, AI-Hints-Struktur und side-sichere Coaching-Grenzen.
- `card-images/`: Kartenbild-Performance, Bildroute, Cache-/Thumbnail-Pfad und Anzeigegrenzen.
- `card-rules/`: Regel-, Resolver-, Timing-, Trace- und Coverage-Artefakte.
- `deck-library/`: lokale Deckbibliothek und Datei-/Storage-Konzept.
- `live-match/`: Timer-, Audio-Cue- und Live-Match-Synchronisationskonzepte.

## Regeln

- Architekturartefakte beschreiben Zielbilder und Migrationspfade, aber geben keine Releasefreigabe.
- Konkrete Release-Gates, Requirements, Testmatrizen, Implementation Reviews und Final Reviews bleiben in der jeweiligen Releasefamilie.
- Moves in diesen Bereich erfolgen nur mit Linkaudit und ohne Masselöschung.
