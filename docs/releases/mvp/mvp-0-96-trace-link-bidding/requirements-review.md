# MVP 0.96 Requirements Review - Trace, Link und Bidding

Status: bestanden
Stand: 2026-05-04

## Review-Basis

- `docs/releases/mvp/roadmaps/mechanics-completion-plan.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.95.json`
- `docs/releases/mvp/mvp-0-92-mechanics-inventory/mechanic-m1-effect-timing-spec.md`
- `docs/releases/mvp/mvp-0-93-m1-engine-foundation/setup-game-end-spec.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/final-review.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/plan.md` aus dem ursprünglichen Arbeitsbaum als read-only Arbeitsbasis
- `docs/releases/mvp/roadmaps/mvp-0-94-to-0-99-planning-review.md` aus dem ursprünglichen Arbeitsbaum als read-only Arbeitsbasis
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`, gezielt für CR 2.9, 10.7 und 10.8

## Prüfergebnis

Die Anforderungen sind konsistent mit der vorhandenen Mechanik-Coverage: V0.95 ist abgeschlossen, `mechanic.trace.link_bidding` ist der nächste geplante begrenzte Gate-Scope, und spätere Mechaniken bleiben gesperrt.

Die CR-Regelreferenz ist für diesen Slice ausreichend eindeutig:

- Base Link stammt vom Runner-Identity-Vertrag und trägt zum Link-Wert bei.
- Link-Wert ist Base Link plus Link von installierten öffentlichen Quellen.
- Trace beginnt mit einer Base-Trace-Strength.
- Corp erhöht zuerst offen die Trace-Strength durch Credit-Ausgaben.
- Runner erhöht danach offen die Link-Strength durch Credit-Ausgaben.
- Trace ist erfolgreich, wenn Trace-Strength größer als Runner-Link-Strength ist.
- Gleichstand oder höherer Runner-Wert ist Fehlschlag.

## Scope-Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| Trace könnte versehentlich generische Effektketten öffnen. | Mittel | V0.96 erlaubt als Erfolgseffekt nur `add_tag`; kein generischer Effektparser. |
| Choice-Auswertung könnte private Auswahlrohdaten leaken. | Mittel | Bid-Choices sind öffentliche Beträge, aber PendingChoice bleibt in PlayerViews side-gefiltert; PublicEvents enthalten nur öffentliche Trace-Daten. |
| Run-Fortsetzung könnte Trace-Subroutine erneut auslösen. | Mittel | V0.96 markiert resolved Subroutines im Encounter deterministisch. |
| AI könnte ohne ausgewählte Bid-Option submitten. | Mittel | AI-Smoke muss Bid-Optionen aus PlayerView/LegalActions prüfen; Server-AI darf keine FullState-Daten nutzen. |
| V0.97+ könnte über Run-Änderungen versehentlich freigeschaltet werden. | Hoch | Keine Jack-out-, Breach- oder Multiaccess-Erweiterung; nur Trace-Harness-Minimum. |

## Abnahmekriterien vor Implementierung

- Requirements, Spezifikation und Testmatrix enthalten alle Must IDs.
- Die Trace-Sequenz ist als schrittweise Choice-Engine-Semantik festgelegt.
- Erfolgs- und Fehlschlagsbedingung sind CR-konform und testbar.
- Hidden-Info- und Replay-/StateHash-Verträge sind explizit.
- No-Scope-Grenzen sind hart dokumentiert.

## Gate-Ergebnis

`MVP_0.96_requirements_review_passed: true`

`ready_for_MVP_0.96_implementation: true`

`ready_for_MVP_0.97_implementation: false`
