# S01 Release Index

Status: migrated-release-index
Stand: 2026-05-18
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Zweck

Dieser Ordner bündelt die abgeschlossene S01-Sonderphase für Spielende, Ergebnisfenster, Spielziel-Auswahl, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Audio. S01 bleibt getrennt von V1.x-Mechanik-/Kartenreleases und V2-Plattformplanung.

S01 ist kein öffentliches Turnier-, Ranking-, Matchmaking-, Asset- oder Plattformrelease. Es erweitert keine Karten, keine Regelmechaniken, keine KI-Inputs und keine StateHash-/Replay-Verträge.

## Dateien

| Datei | Rolle | Retention |
| --- | --- | --- |
| `requirements-review.md` | Requirements Review und Implementierungsfreigabe | `keep-evidence` |
| `requirements.md` | Requirements Freeze und S01-Vertrag | `keep-evidence` |
| `test-matrix.md` | Testmatrix für Result, UI, Audio, Matchserie, Visibility und Regression | `keep-evidence` |
| `match-series-spec.md` | Spezifikation der privaten Zwei-Spiel-Serie | `keep-evidence` |
| `result-modal-spec.md` | Ergebnisfenster- und ResultSummary-Anzeigevertrag | `keep-evidence` |
| `audio-spec.md` | lokaler opt-in Audiovertrag | `keep-evidence` |
| `detailed-plan.md` | historischer Detailplan / Vorplanung | `archive-candidate-after-condense` |

## Kurzstand

- Die Engine bleibt Regelautorität für das Einzelspielende.
- Der Server veröffentlicht nur side-sichere `GameResultSummary`-Daten.
- Ergebnisfenster, Hintergrundgrafik und Audio sind reine UI-Präsentation.
- Die private Zwei-Spiel-Serie ist eine Hülle über getrennte Einzelspiele und verändert Replay oder StateHash nicht.
- Ergebnis-, Reconnect-, Serien- und UI-Payloads dürfen keine FullState-Daten, `cardInstances`, Tokens, privaten Decklisten oder verdeckten Kartendaten enthalten.
- Audio ist opt-in, lokal, reconnect-sicher und nutzt keine offiziellen oder externen Audiodateien.

## Migrationsnotiz

Die S01-Familie lag vorher flach unter `docs/derived/`:

- `DOCS_DERIVED_RELEASE_ROLLUP_S01.md`
- `S01_REQUIREMENTS_REVIEW.md`
- `S01_REQUIREMENTS.md`
- `S01_TEST_MATRIX.md`
- `S01_MATCH_SERIES_SPEC.md`
- `S01_RESULT_MODAL_SPEC.md`
- `S01_AUDIO_SPEC.md`
- `S01_DETAILED_PLAN.md`

Der Move nach `docs/releases/special/s01/` wurde am 2026-05-18 nach der Zielstrukturentscheidung `docs/decisions/docs-structure-target-decision-2026-05-18.md` durchgeführt. Grundlage war das frühere S01-Rollup mit Linkbruchrisiken; die Move-Variante ist vollständige Linkmigration ohne Redirect-Stubs.

## Regeln aus dem Pilot

- S01-Sonderphasen bleiben unter `docs/releases/special/`, nicht in der Haupt-V1.x-Releasekette.
- Requirements Review, Requirements, Testmatrix und Match-Series-Spec bleiben als Audit-Trail erhalten.
- Result-Modal- und Audio-Spezifikation bleiben als präzise Anzeige- und Präsentationsverträge erhalten, solange keine spätere Verdichtung sie vollständig abdeckt.
- Detailpläne werden höchstens archiviert, nicht gelöscht.
- Jede weitere Umstrukturierung erfolgt familienweise, nicht über `docs/derived/` als Ganzes.
