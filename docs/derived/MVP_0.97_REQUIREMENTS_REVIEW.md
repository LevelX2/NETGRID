# MVP 0.97 Requirements Review - Run, Jack-out, Breach und Multiaccess

Status: bestanden
Stand: 2026-05-04

## Review-Basis

- `docs/derived/MECHANICS_COMPLETION_PLAN.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.96.json`
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`
- `docs/derived/MVP_0.97_DETAILED_PLAN.md` aus dem ursprünglichen Arbeitsbaum als read-only Arbeitsbasis
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md` aus dem ursprünglichen Arbeitsbaum als read-only Arbeitsbasis
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`, gezielt für CR 6.1.5, 6.6, 6.7, 7.3, 7.4 und 7.5

## Prüfergebnis

Die Anforderungen sind konsistent mit der Mechanik-Coverage nach V0.96: `mechanic.runs.jackout_multiaccess_breach` ist das nächste geplante Gate, während Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention weiter gesperrt bleiben.

CR-Abgleich:

- Runner hat nach passiertem ICE und vor dem Server eine Jack-out-Gelegenheit.
- Movement-Phase entscheidet, ob Runner jack-outet oder zur nächsten Position weitergeht.
- Ein erfolgreicher Run führt zum Breach des angegriffenen Servers.
- Breach ist der Prozess, eine Menge serverassoziierter Karten zu accessen.
- HQ/R&D haben einen Random Access Limit, das zu Beginn des Breach bestimmt wird.
- Zusätzliche Accesses werden vor Bestimmung des Random Access Limit berücksichtigt.

## Scope-Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| Access-Queue leakt künftige Hidden-Zone-Karten. | Hoch | Queue bleibt intern; PlayerView und PublicEvents zeigen nur aktuellen Access. |
| Jack-out verändert alte Regressionen. | Mittel | Movement-/Jack-out-Fenster wird nur für V0.97-Baselines aktiviert. |
| HQ-Multiaccess ist nicht deterministisch. | Hoch | Auswahl ohne Replacement über RandomDrawRecords und Replay-Test. |
| Breach öffnet Replacement-/Prevention-Scope. | Hoch | Keine neuen Replacement-/Prevention-Actions; No-Scope-Test verpflichtend. |
| Archives-facedown ist unklar. | Mittel | V0.97 dokumentiert enges lokales Archives-Modell; vollständiger facedown-Ausbau bleibt später. |

## Abnahmekriterien vor Implementierung

- Requirements, Spezifikation und Testmatrix enthalten alle Must IDs.
- Jack-out-Fenster ist eng dokumentiert.
- Breach-Queue-Sichtbarkeit ist explizit.
- R&D/HQ-Multiaccess sind deterministisch und testbar.
- No-Scope-Grenzen sind hart dokumentiert.

## Gate-Ergebnis

`MVP_0.97_requirements_review_passed: true`

`ready_for_MVP_0.97_implementation: true`

`ready_for_MVP_0.98_implementation: false`
