# V1.6.0 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_6_0_TUTORIAL_RULE_HELP_DETAILED_PLAN.md`
- `docs/derived/V1_6_0_REQUIREMENTS.md`
- `docs/derived/TUTORIAL_RULE_HELP_1_6_0_SPEC.md`
- `docs/derived/V1_6_0_TEST_MATRIX.md`
- `docs/derived/V1_4_2_TO_V1_6_0_PLANNING_REVIEW.md`

## Ergebnis

`V1_6_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_5_0: true`

V1.6.0 ist als erster schmaler Tutorial-/Regelhilfe-Slice sinnvoll. Die Planung nutzt V1.5.0-Replay-Grundlagen und bleibt von normalen Matches getrennt.

## Geklärte Entscheidungen

- Tutorial ist kein neues Regelmodell.
- Hilfe referenziert LegalActions und sichtbare Projektionen.
- Tutorial-Szenarien müssen freigegebene Karten und Mechaniken verwenden.
- Tutorialfortschritt bleibt lokal.
- LLM-/Coach-Pfade erzeugen keine Live-Actions.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Tutorial empfiehlt illegale Aktionen. | Hoch | LegalAction-Referenztest. |
| Hilfe leakt Hidden Info. | Hoch | Redaction- und Perspektivtests. |
| Tutorials werden zu breit. | Mittel | erster Slice nur Kernlektionen. |
| Regelhilfe behauptet Vollständigkeit. | Mittel | NETGRID-Scope-Abweichungen sichtbar markieren. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Konkrete UI-Textausarbeitung kann in der Umsetzung erfolgen, solange Glossar und Hidden-Info-Regeln eingehalten werden.
- Weitere Lektionen können spätere V1.6.x-Slices werden.

## Gate

V1.6.0 ist nach V1.5.0 bereit für spätere Umsetzung.
