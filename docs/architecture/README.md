# Architektur-Dokumentation

`docs/architecture/` ist der Zielbereich für releaseübergreifendes Architekturwissen: technische Zielbilder, Schichtgrenzen, Engine-Konzepte und länger gültige Refactoring-Pläne.

## Bereiche

- `ability-engine/`: Kartenlogik, CardDefinition-/Ability-DSL-Zielbild und inkrementeller Refactoring-Plan für die Engine-Migration.
- `ai/`: KI-Controller, Simulationstestmatrix, AI-Hints-Struktur und side-sichere Coaching-Grenzen.

## Regeln

- Architekturartefakte beschreiben Zielbilder und Migrationspfade, aber geben keine Releasefreigabe.
- Konkrete Release-Gates, Requirements, Testmatrizen, Implementation Reviews und Final Reviews bleiben in der jeweiligen Releasefamilie.
- Moves in diesen Bereich erfolgen nur mit Linkaudit und ohne Masselöschung.
