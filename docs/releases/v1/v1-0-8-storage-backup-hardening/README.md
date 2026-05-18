# V1.0.8 Storage/Backup-Härtung

Status: migrated-release-family
Moved: 2026-05-18

## Zweck

Diese Familie bündelt den V1.0.8-Betriebs- und Storage-Härtungsrelease. SQLite wird als privater lokaler Standard-Storage eingeführt, inklusive Legacy-Import, Backup, Restore, Recovery, Redaction und E2E-Isolation.

## Artefakte

| Datei | Rolle |
| --- | --- |
| `plan.md` | kanonischer Detailplan |
| `requirements.md` | eingefrorene Anforderungen |
| `storage-sqlite-spec.md` | Spezifikation für SQLite-Storage und Migration |
| `backup-recovery-spec.md` | Spezifikation für Backup, Restore und Recovery |
| `test-matrix.md` | Testmatrix |
| `requirements-review.md` | Requirements Review |
| `implementation-review.md` | Implementation Review |
| `final-review.md` | Final Review und Gate-Ergebnis |

## Grenze

Runtime-Dateien, SQLite-WAL/SHM-Dateien, Backups und temporäre E2E-Daten bleiben nicht versioniert.
