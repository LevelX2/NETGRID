# V1.0.8 Requirements Review - Storage/Backup-Härtung

Stand: 2026-05-06
Status: reviewed

## Ergebnis

V1.0.8 ist als Storage-/Backup-Härtungsrelease sinnvoll, konsistent und umsetzungsbereit vorbereitet.

Der Freeze setzt SQLite als bevorzugten privaten lokalen Storage-Pfad fest und begrenzt den Scope auf migrationsfähige Match-Persistenz, kontrollierten JSON-Legacy-Import aus `data/runtime/multiplayer/matches.json`, Backup/Restore, Recovery-Verhalten, Token-/Hidden-Info-Redaktion und E2E-kompatible Runtime-Isolation.

## Geprüfte Artefakte

- `docs/releases/v1/v1-0-8-storage-backup-hardening/plan.md`
- `docs/releases/v1/v1-0-8-storage-backup-hardening/requirements.md`
- `docs/releases/v1/v1-0-8-storage-backup-hardening/storage-sqlite-spec.md`
- `docs/releases/v1/v1-0-8-storage-backup-hardening/backup-recovery-spec.md`
- `docs/releases/v1/v1-0-8-storage-backup-hardening/test-matrix.md`
- `docs/releases/v1/v1-0-7-browser-e2e-visual-qa/final-review.md`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `scripts/run-e2e.mjs`
- `tests/e2e/`

## Konsistenzprüfung

| Bereich | Ergebnis | Begründung |
| --- | --- | --- |
| Scope | pass | V1.0.8 bleibt Betriebs-/Storage-Härtung und erweitert keine Karten, Mechaniken, Accounts, Plattformfunktionen, Replay- oder StateHash-Verträge. |
| Reihenfolge | pass | Nach V1.0.7 ist Persistenz der nächste Engpass: Der Browser-Gate ist grün, der Runtime-Storage ist noch einfacher JSON-Dateispeicher. |
| Architekturgrenze | pass | `MultiplayerStorage` bleibt die Grenze; `MultiplayerService` arbeitet weiter mit `StoredMatch`. |
| SQLite-Entscheidung | pass | SQLite passt zum privaten lokalen Produktmodus. Node 24 ist Projektziel; `node:sqlite` ist lokal verfügbar und wird als Primärpfad eingefroren. |
| Migration | pass | Legacy-Import ist kontrolliert, gesichert, validiert und transaktional spezifiziert. |
| Backup/Restore | pass | Backup, Manifest, Prüfsumme, Pre-Migration-Backup und Pre-Restore-Sicherung sind testbar beschrieben. |
| Hidden Info | pass | Token-, Decklisten-, Hidden-Zone-, Health-, Log-, Manifest- und Recovery-Leak-Grenzen sind explizit aufgenommen. |
| E2E-Isolation | pass | Die vorhandene V1.0.7-Isolation wird nicht verworfen, sondern auf temporäre SQLite-Dateien übertragen. |
| Testbarkeit | pass | Alle Must-Anforderungen haben eine Testspur in `V1_0_8_TEST_MATRIX.md`. |

## Offene technische Entscheidungen

Keine blockierende Produktentscheidung bleibt offen.

Diese technischen Details dürfen in der Umsetzung entschieden werden und müssen im Implementation Review dokumentiert werden:

- exakte Tabellenform, solange der `StoredMatch`-Roundtrip vollständig bleibt,
- ob `matches.record_json` als vollständiger Roundtrip-Anker genutzt wird oder eine stärker relationale Speicherung umgesetzt wird,
- ob Backups per SQLite-Backup-API, Dump oder exklusivem Kopierpfad erzeugt werden,
- exakte Scriptnamen für Backup, Restore, Import und Inspect,
- ob Health nur `{ ok: true }` plus Storage-Basissignale liefert oder Storage-Signale hinter einer lokalen Debug-Option bleiben,
- konkrete Fehlercode-Namen für Storage-/Recovery-Fehler,
- optionale Backup-Rotation.

## Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Migration beschädigt private lokale Matchdaten. | hoch | Pre-Migration-Backup, transaktionaler Import, Legacy-Datei unverändert lassen, Strukturvalidierung. |
| SQLite-Adapter bildet `StoredMatch` unvollständig ab. | hoch | Roundtrip-Tests für vollständige Records inklusive Snapshots, Receipts, Lobby, Lifecycle und Decksnapshots. |
| Storage-Fehler wird als erfolgreicher Spielzug sichtbar. | hoch | Test für persistenzfehlgeschlagene Actions/Lifecycle/Lobby/KI-Schritte. |
| Diagnose leakt Tokens oder Hidden Info. | hoch | Redaction-Anforderungen für Health, Logs, Fehler, Manifest, Recovery, DOM, Storage und Payloads. |
| E2E verschmutzt lokale Runtime-Daten. | hoch | Temporäre SQLite-Datei und Runtime-Isolationstest. |
| `node:sqlite` passt nicht sauber in Test-/Build-Umgebung. | mittel | Fallback auf dokumentierte Node-24-kompatible SQLite-Bibliothek erlaubt, aber nur mit Review-Begründung. |
| Backup/Restore wird zu breit. | mittel | V1.0.8 verlangt einen lokalen reproduzierbaren Drill, keine öffentliche UI, kein Cloud-Backup und kein Key-Management. |

## Gate

`V1_0_8_requirements_freeze_done: true`

`ready_for_V1_0_8_implementation: true`

## Blocker

Keine Blocker.

## Empfohlener nächster Umsetzungsprompt

```txt
Setze V1.0.8 Storage/Backup-Härtung um.

Lies zuerst:
- AGENTS.md
- AGENTS.local.md, falls vorhanden
- KI-Wissen-NETGRID/00 Projektstart.md
- KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
- docs/codex/CODEX_STATUS.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/plan.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/requirements.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/storage-sqlite-spec.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/backup-recovery-spec.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/test-matrix.md
- docs/releases/v1/v1-0-8-storage-backup-hardening/requirements-review.md
- docs/releases/v1/v1-0-7-browser-e2e-visual-qa/final-review.md

Aufgabe:
Implementiere V1.0.8 Storage/Backup-Härtung ohne neue Karten, Mechaniken, Accounts, Postgres, öffentliche Plattformfunktionen, Replay-/StateHash-/Engine-Autoritätsänderungen oder Klartext-Token-Speicherung. Führe SQLite als privaten lokalen Standard-Storage ein, halte JSON nur als kontrollierten Legacy-/Test-/Migrationseingang, implementiere validierten Legacy-Import aus data/runtime/multiplayer/matches.json, Backup/Restore mit Manifest und Prüfsummen, Recovery-Verhalten für fehlende/beschädigte/alte/neue Storage-Zustände, Token-/Hidden-Info-Redaktion und E2E-Isolation mit temporärer SQLite-Datenbank. Dokumentiere Umsetzung und Verifikation in V1_0_8_IMPLEMENTATION_REVIEW.md und V1_0_8_FINAL_REVIEW.md.
```
