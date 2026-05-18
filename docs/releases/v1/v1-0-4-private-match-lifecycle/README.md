# V1.0.4 Private Match Lifecycle

Status: migrated-release-index
Stand: 2026-05-18
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Zweck

Dieser Ordner bündelt V1.0.4 Private Match Lifecycle und Session Recovery. Die Phase betrifft Match-/Server-/UI-Orchestrierung: Cancel, Leave, Forfeit, Recreate, Session Recovery, Gegnernamen und sichere Lifecycle-Payloads.

## Dateien

| Datei | Rolle | Retention |
| --- | --- | --- |
| `final-review.md` | Final Review und Gate-Ergebnis | `keep-evidence` |
| `implementation-review.md` | Umsetzungsergebnis und Checknachweis | `keep-evidence` |
| `requirements.md` | Requirements Freeze | `keep-evidence` |
| `two-tab-smoke.md` | wiederholbarer Zwei-Tab-Smoke und Testnachweis | `keep-evidence` |
| `plan.md` | kanonischer Detailplan | `keep-evidence` |
| `next-release-candidates.md` | Herkunfts- und Kandidatendokument | `archive-candidate-after-condense` |

## Historische Lücken

Für V1.0.4 gab es historisch keine separate `V1_0_4_TEST_MATRIX.md`, keine separate `V1_0_4_REQUIREMENTS_REVIEW.md` und keine separate `MATCH_LIFECYCLE_1_0_4_SPEC.md`. Dieses README rekonstruiert diese Artefakte nicht nachträglich.

## Kurzstand

- `cancelled`, `abandoned` und `forfeited` sind terminale Match-Lifecycle-Status.
- Cancel, Leave, Forfeit und Recreate laufen als REST-Lifecycle-Kommandos; WebSocket bleibt Broadcast- und Statuskanal.
- Forfeit ist kein Engine-Sieg und erzeugt keine Engine-Action.
- Recreate erzeugt neue MatchId, neuen Join-Link, neuen Seed und neue Tokens.
- Recent-Session-Metadaten bleiben token-, decklisten-, deckhash- und hidden-info-frei.

## Migrationsnotiz

Die Familie lag vorher unter `docs/derived/` als `V1_0_4_*`. Der Move nach `docs/releases/v1/v1-0-4-private-match-lifecycle/` wurde am 2026-05-18 als begrenzter V1.0.x-Schnitt durchgeführt.
