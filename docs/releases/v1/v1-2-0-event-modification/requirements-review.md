# V1.2.0 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-2-0-event-modification/plan.md`
- `docs/releases/v1/v1-2-0-event-modification/requirements.md`
- `docs/releases/v1/v1-2-0-event-modification/spec.md`
- `docs/releases/v1/v1-2-0-event-modification/test-matrix.md`
- `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/plan.md`

## Ergebnis

`V1_2_0_requirements_freeze_done: true`

`ready_for_implementation: true`

V1.2.0 ist ausreichend geplant, um als enger Mechanik-/Timing-/Choice-Slice umgesetzt zu werden. Der Release hat einen bevorzugten Pilotfall, klare No-Scope-Grenzen und testbare Verträge für Engine, Server, Web, KI, Replay, StateHash und Hidden Info.

## Geklärte Entscheidungen

- Damage Prevention ist der bevorzugte Pilot.
- Tag-Avoid ist der bevorzugte Alternativpilot, falls Damage Prevention blockiert.
- Run-Avoid ist nur test-only und nur ohne Access-/Breach-/Replacement-Ausweitung zulässig.
- Replacement Effects sind komplett aus V1.2.0 ausgeschlossen.
- Es gibt keine Runtime-Karten- oder KI-Deckfreigabe.
- Mehrere Kandidaten müssen deterministisch konfliktfrei sein oder sichtbar blockieren.

## Stärken

- Pipeline ist klein genug für harte Gates.
- Damage Prevention testet Hidden-Info-, Randomness-, Replay- und Flatline-Nähe.
- EventLog-Vertrag erzwingt nachvollziehbare Modifikationen statt stiller State-Mutation.
- KI-Fallback ist für neue PendingChoice-Fenster eingeplant.
- V1.2.1 kann auf die Eventgrundlage aufbauen, ohne Replacement schon in V1.2.0 zu vermischen.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Random Damage wird zu früh materialisiert. | Hoch | Test V120-T004/V120-T006. |
| Private Kandidaten leaken in PublicEvents oder Reconnect. | Sehr hoch | Tests V120-T013 bis V120-T020 und V120-T029. |
| Candidate-Konflikte erzeugen unklare Priorität. | Hoch | V1.2.0 blockiert mehrdeutige Konflikte. |
| KI hängt an unbekannten Fensterarten. | Mittel | Pass-/No-op-Fallback und AI-Smoke. |
| Replacement schleicht ein. | Hoch | V120-MUST-004, V120-T002, V120-T030. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die konkrete technische Form des Damage-Prevention-Fixtures kann der Umsetzungsthread wählen, solange keine Karte promoted wird.
- Wenn Damage Prevention unerwartet blockiert, muss der Wechsel auf Tag-Avoid im Implementation Review begründet werden.

## Gate

V1.2.0 ist bereit für Umsetzung nach V1.1.3-Planungsabschluss.
