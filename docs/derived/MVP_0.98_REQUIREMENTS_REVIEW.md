# MVP 0.98 Requirements Review - Identities und Hidden-Zone-Tools

Status: bestanden
Stand: 2026-05-04

## Review-Ergebnis

Die V0.98-Anforderungen sind für eine vorsichtige, zweistufige Umsetzung ausreichend eingefroren.

V0.98a darf mit Identity-/Modifier-Piloten beginnen. V0.98b darf erst beginnen, wenn V0.98a grün ist.

## Geprüfte Quellen

- `docs/derived/MVP_0.98_DETAILED_PLAN.md` aus dem lokalen Planungsstand.
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md` aus dem lokalen Planungsstand.
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- CR v26.03 Abschnitte 1.6, 1.21, 8.7, 8.8, 9.4 und 10.2.

## Risikoentscheidungen

| Risiko | Entscheidung |
|---|---|
| V0.98 wird zu breit. | Interne Staffelung: V0.98a vor V0.98b; keine V0.99-Mechanik. |
| Identity-Fähigkeiten greifen auf Hidden-Zones zu. | Startscope nutzt nur sichtbare Setup-/Static-Effekte. |
| Search/Arrange leakt Optionslisten. | Optionslabels nur im PlayerView der berechtigten Side; PublicEvents redacted. |
| Shuffle ist nicht replaybar. | RandomDrawRecords sind Pflicht. |
| Swap löst Hosting/Ownership-Sonderfälle aus. | V0.98-Swap ist eng, ohne Ownership-/Control-Wechsel und ohne Hosting. |

## Gate

`MVP_0.98_requirements_freeze_done: true`

`ready_for_MVP_0.98a_implementation: true`
