# V1.2.1 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-2-1-replacement-effects/plan.md`
- `docs/releases/v1/v1-2-1-replacement-effects/requirements.md`
- `docs/releases/v1/v1-2-1-replacement-effects/spec.md`
- `docs/releases/v1/v1-2-1-replacement-effects/test-matrix.md`
- `docs/releases/v1/v1-2-0-event-modification/requirements.md`
- `docs/releases/v1/v1-2-0-event-modification/spec.md`

## Ergebnis

`V1_2_1_requirements_freeze_done: true`

`ready_for_implementation: true`

V1.2.1 ist ausreichend geplant, um nach erfolgreichem V1.2.0-Gate umgesetzt zu werden. Replacement ist sauber von Prevention/Avoid/Interrupt getrennt, hat einen bevorzugten test-only Pilotpfad und blockiert konfliktbehaftete Access-/Trash-/Steal-Fälle konservativ.

## Geklärte Entscheidungen

- V1.2.1 hängt hart von grünem V1.2.0 ab.
- Replacement wird als Originalevent-plus-Replacementevent modelliert.
- Damage Replacement ist der bevorzugte test-only Pilot.
- Access-, Trash- und Steal-Replacement werden geprüft, aber nicht automatisch freigegeben.
- Einmal-pro-Fenster-Regel ist Pflicht.
- Konflikte blockieren sichtbar statt stiller Prioritätsannahme.
- Keine Karten- oder KI-Deckfreigabe in V1.2.1.

## Stärken

- Replay/StateHash-Frage ist zentral adressiert.
- Hidden-Info-Risiken für Access/Trash/Steal werden nicht unterschätzt.
- KI-Support bleibt konservativ: LegalAction-Fallback ja, strategische Bewertung erst mit AI-Hints.
- MechanicSupport-Granularität bereitet spätere Kartenfreigaben vor, ohne sie auszulösen.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Replacement wendet Originalevent versehentlich doppelt an. | Sehr hoch | Tests V121-T005, V121-T006, V121-T014, V121-T015. |
| Konflikte werden still in Board-Reihenfolge entschieden. | Hoch | Tests V121-T008, V121-T009. |
| Damage Replacement verhält sich wie Prevention. | Hoch | Pipeline-Trennung V121-T002 und EventLog-Paar. |
| Access-Replacement leakt künftige Hidden-Info. | Sehr hoch | Nicht Primärpilot; blockierende Tests und No-Scope. |
| KI bewertet Replacement ohne Hints. | Mittel | V121-MUST-024/V121-MUST-025 und KI-Tests. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Der konkrete test-only Damage-Replacement-Effekt wird im Umsetzungsthread festgelegt.
- Access-, Trash- und Steal-Replacement bleiben Kandidaten für spätere Karten-/Mechanikgates.

## Gate

V1.2.1 ist nach V1.2.0 bereit für Umsetzung.
