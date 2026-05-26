# AI-Hint Quality Gates und Ontology Roadmap

Datum: 2026-05-25

## Kurzfazit

Ein kleines maschinenlesbares Hint-Quality-Gate wurde ergänzt. Es nutzt den bestehenden Consumer-Contract-Audit als Rollen-/Planrollen-Vertrag und failt nur eng belegte P0-Zustände. Bekannte Altlasten wie seltene Rollen, uneinheitliche Synonyme und nicht direkt konsumierte Rollen werden als Warning-Report ausgegeben, nicht als harter Fehler.

Der aktuelle 410-Hint-Satz besteht das Gate:

- Harte Fehler: 0
- Warnings: 150
- Eindeutige Benchmark-Deckkarten im Coverage-Schnitt: 190
- Benchmark-Deckkarten ohne Hint: 0

Die Crystal-Palace-Regressionsklasse ist geschützt: `Crystal Palace Station Grid` darf nicht wieder `economy`, `counter`, `power_counter` oder `remote_upgrade_economy` tragen.

## Implementierte Gates

Script:

- `scripts/check-ai-hint-quality.mjs`

Package-Script:

- `corepack pnpm check:ai-hint-quality`

Output:

- Konsolen-Kurzsummary
- JSON-Report: `docs/reviews/ai/ai-hint-quality-gate-report-2026-05-25.json`

Harte Gates:

1. Aktive Hint-`roles` müssen im aktuellen Role-Contract-Inventar bekannt sein.
2. Aktive Hint-`planRoles` müssen im aktuellen PlanRole-Contract-Inventar bekannt sein.
3. Direkt konsumierte Code-Rollen müssen im Contract-Inventar vorkommen oder bewusst `code-only` sein.
4. Alle Benchmark-Deckkarten aus Snapshot-, Local-Realistic- und Real-Scene-Snapshots müssen einen aktiven Hint haben.
5. `Crystal Palace Station Grid` darf keine semantisch falschen Economy-/Counter-Rollen tragen.

Warn-Gates:

1. `ai_supported` Karten ohne konsumierte oder strategisch dokumentierte Rolle werden reportet.
2. Rollen, die nur einmal vorkommen und keinen Code-Referenzindikator haben, werden als suspicious singleton reportet.
3. Planrollen, die nur einmal vorkommen und keinen Code-Referenzindikator haben, werden als suspicious singleton reportet.
4. Synonymgruppen werden als Konsolidierungskandidaten reportet.
5. Benchmark-Deckkarten mit nur generischen oder suspicious-only Rollen werden reportet.

## Bewusst nicht hart gefailt

Nicht hart gefailt werden:

- bestehende rare roles wie `rd_reorder`, `tag_damage_agenda`, `remote_asset_run_start_tax`
- Synonyme wie `rd_pressure` / `pressure_rnd`, `hq_run` / `pressure_hq`, `wall_breaker` / `breaker_fracter`
- Per-Card-Longtail-Rollen
- Ontologielücken bei scored-agenda abilities, Future-Run-ICE oder Tag/Punish

Grund: Diese Altlasten sind real, aber bekannt und teilweise bewusst dokumentarisch. Ein harter CI-Bruch würde die aktuelle Suite blockieren, ohne sofort eine bessere Ontologie bereitzustellen.

## Aktueller Gate-Befund

Aus `corepack pnpm check:ai-hint-quality`:

- `AI_HINT_QUALITY OK`
- `hints=410`
- `roles=251`
- `planRoles=102`
- `errors=0`
- `warnings=150`
- `benchmarkCards=190`

Warning-Verteilung:

- `suspicious_singleton_roles`: 96
- `suspicious_singleton_plan_roles`: 45
- `role_synonym_candidates`: 9

Keine fehlenden Benchmark-Hints wurden gefunden.

## Benchmark-Deck-Hint-Coverage

Geprüfte Deckquellen:

- `data/decks/deck-snapshots-0.8.json`
- `data/ai/ai-local-realistic-benchmark-deck-snapshots-2026-05-23.json`
- `data/ai/ai-real-scene-benchmark-deck-snapshots-2026-05-24.json`

Befund:

- 190 eindeutige Karten in den geprüften Benchmark-Snapshots.
- Alle 190 Karten haben aktive Hints.
- Real-Scene-Holdouts werden nur berichtet; das Gate optimiert nicht auf sie.

## Ontology-Roadmap

Die Roadmap liegt separat in:

- `docs/reviews/ai/ai-hint-ontology-roadmap-2026-05-25.md`

Empfohlene optionale Felder:

- `effects`
- `conditions`
- `costProfile`
- `strategicTags`
- `remoteRole`
- `lineSupport`
- `qualityReviewed`

Die Roadmap enthält Beispiele für:

- scored-agenda economy
- scored-agenda tag/punish
- future-run ICE
- breaker cost profile
- search/tutor
- dedicated trash credits
- remote scoring protection
- HQ-density/dilution support

## Empfohlene nächste Schritte

1. Gate in regelmäßige lokale AI-Checks aufnehmen, aber zunächst nicht als breite CI-Blockade für Warnings.
2. Kleine Ontologie zuerst für scored-agenda activated abilities einführen.
3. Danach Future-Run-/Future-Encounter-ICE als strukturierte Effekte beschreiben.
4. Danach Tag/Punish Source/Payoff/Condition trennen.
5. Erst danach größere Rollenbereinigung oder Synonymkonsolidierung starten.

## Nicht geändert

- Keine AI-Hint-Massenänderung.
- Keine Engine-Regeln.
- Keine LegalActions.
- Keine Decks.
- Keine Profile.
- Keine Strategy-Heuristik.
