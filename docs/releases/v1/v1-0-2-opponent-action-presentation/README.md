# V1.0.2 Gegner-Aktionsdarstellung

Status: migrated-release-index
Stand: 2026-05-18
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Zweck

Dieser Ordner bündelt V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz. Die Phase machte gegnerische Aktionen und KI-Züge sichtbarer, ohne Engine-Regelautorität, Replay, StateHash, Kartenpool oder Mechanikbreite zu verändern.

## Dateien

| Datei | Rolle | Retention |
| --- | --- | --- |
| `final-review.md` | Final Review und Gate-Ergebnis | `keep-evidence` |
| `implementation-review.md` | Umsetzungsergebnis und Checknachweis | `keep-evidence` |
| `requirements-review.md` | Requirements Review und Implementierungsfreigabe | `keep-evidence` |
| `requirements.md` | Requirements Freeze | `keep-evidence` |
| `spec.md` | technische Spezifikation für OpponentActionCue, Redaction, Queue, KI-Pacing und Audio | `keep-evidence` |
| `test-matrix.md` | Testmatrix | `keep-evidence` |
| `plan.md` | historischer Detailplan | `archive-candidate-after-condense` |

## Kurzstand

- `OpponentActionCue` wird aus side-sicheren PublicEvents, PlayerViews und Chronicle-Kontext abgeleitet.
- KI-Pacing läuft über `fast`, `paced` und `manual`.
- Board-Highlights, Cue-Queue und Audio bleiben reine Präsentation.
- Keine neuen Karten, Mechaniken, offiziellen Assets, Public-Plattformfunktionen oder StateHash-/Replay-Änderungen.

## Migrationsnotiz

Die Familie lag vorher unter `docs/derived/` als `V1_0_2_*` plus `OPPONENT_ACTION_PRESENTATION_SPEC.md`. Der Move nach `docs/releases/v1/v1-0-2-opponent-action-presentation/` wurde am 2026-05-18 als begrenzter V1.0.x-Schnitt durchgeführt.
