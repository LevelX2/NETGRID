# MVP 0.99 Requirements Review - Hosting, Viren, Purge und Counter-Familien

Status: bestanden
Stand: 2026-05-04

## Review-Ergebnis

Die V0.99-Anforderungen sind für eine vorsichtige, vierstufige Umsetzung ausreichend eingefroren.

V0.99a darf mit der generischen Counter-Basis beginnen. V0.99b, V0.99c und V0.99d dürfen jeweils erst beginnen, wenn das vorherige Subgate grün ist.

## Geprüfte Quellen

- `docs/derived/MVP_0.99_DETAILED_PLAN.md` aus dem lokalen Planungsstand.
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md` aus dem lokalen Planungsstand.
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`
- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.98.json`
- CR v26.03 Abschnitte 1.9, 1.10.4, 1.10.5, 1.13, 5.2.6, 10.1.2 und 10.6.

## Risikoentscheidungen

| Risiko | Entscheidung |
|---|---|
| V0.99 wird zu breit. | Interne Staffelung V0.99a bis V0.99d; V0.99e nur bei konkretem Kartenbedarf. |
| Hosting öffnet Ownership-/Control-Sonderfälle. | V0.99-Hosting bleibt auf direkte, offene Runner-Rig-Beziehungen beschränkt. |
| Private Hosting-Kandidaten leaken. | Hosting-Auswahl nutzt private `PendingChoice`; PublicEvents werden redacted. |
| Purge entfernt zu viel. | Purge entfernt ausschließlich `virus`-Counter auf Karten. |
| Bad Publicity verändert Trace/Bids unkontrolliert. | V0.99 nutzt Bad Publicity nur für Runner-Run-Kosten, nicht für Trace-Bids. |
| Recurring Credits umgehen Kostenrevalidierung. | LegalActions und `applyAction` verwenden denselben Zahlungshelfer. |

## Gate

`MVP_0.99_requirements_freeze_done: true`

`ready_for_MVP_0.99a_implementation: true`

`ready_for_MVP_0.99b_implementation: false`
