# Ability-Engine-Architektur

Status: migrated-architecture-area
Stand: 2026-05-18
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Zweck

Dieser Bereich bündelt die releaseübergreifenden Architekturartefakte zur Kartenlogik und zur langfristigen Ability-/Effect-Engine. Die Dokumente sind kein Release-Gate, sondern Zielbild und Refactoring-Handoff für spätere Engine-Arbeiten.

## Dateien

| Datei | Rolle |
| --- | --- |
| `card-logic-architecture-analysis-2026-05-17.md` | Ist-Analyse der Kartenlogik, verteilten Sonderfälle, EffectCommand-/ResolvedEffect-Basis und strukturellen Schwächen. |
| `card-definition-ability-dsl-target-architecture.md` | Zielarchitektur für CardDefinition-nahe Ability-, Modifier-, Trigger-, Kosten-, Ziel- und Effect-Strukturen. |
| `incremental-card-effect-refactoring-plan-2026-05-17.md` | Inkrementeller Migrationsplan mit P0-Tests, P1-Cost-Pipeline, ActiveModifier-System, Target Binding und Trigger Registry. |

## Migrationsnotiz

Die drei Dateien lagen vorher unter `docs/abilityEngine/` und wurden am 2026-05-18 nach der Zielstrukturentscheidung `docs/decisions/docs-structure-target-decision-2026-05-18.md` nach `docs/architecture/ability-engine/` verschoben.

Der Linkaudit war eng begrenzt: Es gab einen internen Dokumentlink auf den alten Ordner, der aktualisiert wurde. Die übrigen Treffer auf `packages/engine/src/ability-engine/*` sind technische Zielpfade im Code und bleiben unverändert.
