# V1.4.2 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-4-2-belief-state-opponent-model/plan.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/requirements.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/spec.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/test-matrix.md`
- `docs/releases/v1/v1-4-2-belief-state-opponent-model/planning-review-to-v1-6-0.md`
- `docs/derived/RUNNER_AI_RND_REPEAT_ACCESS_OBSERVATION_2026_05_08.md`

## Ergebnis

`V1_4_2_requirements_freeze_done: true`

`ready_for_implementation_after_V1_4_1: true`

V1.4.2 ist als nächster Release nach V1.4.1 sinnvoll und ausreichend abgegrenzt.

## Geklärte Entscheidungen

- Belief State ist abgeleitete KI-Arbeitssicht, kein Engine-State.
- Belief State darf nicht in Replay/StateHash echter Spiele eingehen.
- `R&D access freshness` wird aufgenommen, weil es side-sicher aus Runner-Access-Historie ableitbar ist.
- Simulation und Selfplay bleiben V1.4.3.
- Deck-Legal AI Approval Batch B-G bleiben eigene Kartenfreigabe-Gates.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Hidden-State-Cheating durch Memory. | Sehr hoch | Inputvertrag, Invariance-Tests, Debug-Redaction. |
| Stale Memory nach Undo/Reconnect. | Hoch | Rekonstruktion aus Historie statt blinder Weiterverwendung. |
| Hypothesen werden als Fakten dargestellt. | Hoch | Wissenstypen und DecisionDebug-Gate. |
| R&D Freshness behauptet falsche Topkarte. | Mittel | Nur Runner-gesehene Fakten plus klare Invalidation. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Confidence-Skalen können konservativ starten.
- Belief-State-Versionierung muss nur so weit reichen, dass V1.5.0 Replay-Analyse vorbereitet ist.

## Gate

V1.4.2 ist bereit für spätere Umsetzung.
