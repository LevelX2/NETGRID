# V1.5.0 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_5_0_PRIVATE_REPLAY_ANALYSIS_LEARNING_DETAILED_PLAN.md`
- `docs/derived/V1_5_0_REQUIREMENTS.md`
- `docs/derived/PRIVATE_REPLAY_ANALYSIS_LEARNING_1_5_0_SPEC.md`
- `docs/derived/V1_5_0_TEST_MATRIX.md`
- `docs/derived/V1_4_2_TO_V1_6_0_PLANNING_REVIEW.md`

## Ergebnis

`V1_5_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_4_3: true`

V1.5.0 ist als erster schmaler V1.5.x-Slice sinnvoll. Es bleibt lokal, privat und side-sicher.

## Geklärte Entscheidungen

- V1.5.x wird nicht als ganzes Paket umgesetzt; V1.5.0 ist der Replay-/Analyse-Grundslice.
- Public Replay und Spectator sind ausgeschlossen.
- Local Analysis darf nicht in öffentliche Payloads oder Exporte leaken.
- Exploit-Export erzeugt nur Review-Kandidaten.
- Lernhilfe bleibt erklärend, nicht regelentscheidend.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Replay leakt Hidden Info über falsche Perspektive. | Sehr hoch | Perspektivtests und Redaction. |
| Export enthält Tokens oder Pfade. | Hoch | Export-Redaction-Test. |
| Local Analysis wird mit Public Replay verwechselt. | Hoch | klare UI-/Payload-Trennung. |
| Replay alter RulesBaselines wird falsch validiert. | Mittel | Versionierung und Inkompatibilitätsmarkierung. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die genaue Replay-Listenfilterung kann in V1.5.0 minimal starten.
- Alte inkompatible Replays dürfen zunächst klar als inkompatibel markiert werden.

## Gate

V1.5.0 ist nach V1.4.3 bereit für spätere Umsetzung.
