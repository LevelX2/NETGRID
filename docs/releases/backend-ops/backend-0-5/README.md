# Backend 0.5 Release Index

Status: migrated-release-index
Stand: 2026-05-18
Primärer Agent für Folgearbeiten: `architecture-review-agent`

## Zweck

Dieser Ordner ist der Pilotbereich für `docs/releases/`. Er bündelt die abgeschlossene Backend-/Ops-Familie Backend 0.5, ohne Gate-Nachweise zu löschen oder inhaltlich umzuschreiben.

Backend 0.5 ist ein privater Storage-Maintenance-Schnitt. Er ist fachlich von der V1.9.x-Karten-/Mechaniklinie getrennt und promotet keine Karten, Mechaniken, KI-Hints oder Webclient-Releaseversion.

## Dateien

| Datei | Rolle | Retention |
| --- | --- | --- |
| `final-review.md` | Final Review und Gate-Ergebnis | `keep-evidence` |
| `implementation-review.md` | Umsetzungsergebnis, Sicherheitsgrenzen, Endpunkte, UI und Checks | `keep-evidence` |
| `requirements.md` | eingefrorener Backend-0.5-Vertrag | `keep-evidence` |
| `test-matrix.md` | Testabdeckung für Requirements, Server, Web, Redaction und Cleanup | `keep-evidence` |
| `plan.md` | historischer Detailplan / Vorplanung | `archive-candidate-after-condense` |

## Kurzstand

- Private Wartungsseite: `/maintenance`
- Maintenance-APIs: `/api/storage/maintenance/*`
- Sicherheitsgrenzen: lokal/private-only, keine Tokens, keine Decklisten, keine FullState-/Snapshot-Inhalte, keine Event-PrivatePayloads, keine Hidden-Zone-Daten.
- Cleanup-Vertrag: Preview vor Apply, Whole-Match-Delete per FK-Cascade, optionale Backups, optionales `VACUUM`, Löschschutz und Auto-Cleanup-Policy.
- Nicht promotet: Karten-, Mechanik-, KI- oder Webclient-Release-Linie.

## Migrationsnotiz

Diese Familie lag vorher flach unter `docs/derived/`:

- `DOCS_DERIVED_RELEASE_ROLLUP_BACKEND_0_5.md`
- `BACKEND_0_5_FINAL_REVIEW.md`
- `BACKEND_0_5_IMPLEMENTATION_REVIEW.md`
- `BACKEND_0_5_REQUIREMENTS.md`
- `BACKEND_0_5_TEST_MATRIX.md`
- `BACKEND_0_5_PRIVATE_STORAGE_MAINTENANCE_PLAN.md`

Der Move nach `docs/releases/backend-ops/backend-0-5/` wurde am 2026-05-18 nach der Zielstrukturentscheidung `docs/derived/DOCS_STRUCTURE_TARGET_DECISION_2026_05_18.md` durchgeführt. Die Linkaudit-Vorarbeit liegt in `docs/derived/DOCS_DERIVED_BACKEND_0_5_LINK_AUDIT_MOVE_PLAN.md`.

## Regeln aus dem Pilot

- Final Reviews bleiben `keep-evidence`.
- Implementation Reviews bleiben `keep-evidence`.
- Requirements und Testmatrizen bleiben auch nach Rollup auffindbar.
- Detailpläne und Vorplanungen werden nur Archivkandidaten, wenn Requirements, Implementation Review und Final Review den führenden Stand vollständig abdecken.
- Jede weitere Umstrukturierung erfolgt familienweise, nicht über `docs/derived/` als Ganzes.
