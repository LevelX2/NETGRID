---
activityId: act-2026-05-17-docs-spotcheck-evidence-rollup
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/originalset-spotchecks/README.md
  - docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_14_A.md
  - docs/reviews/originalset-spotchecks/register.md
  - data/reports/originalset-card-spotcheck-register.json
checks:
  - git diff --check
  - Spotcheck-register path validation via PowerShell
outcome: done
---

# Originalset-Spotcheck-Nachweise verdichten

## Ziel

Die Originalset-Spotcheck-Nachweise sollen so verdichtet werden, dass Register, Detailberichte und erledigte Jobdateien nicht dauerhaft dreifach dieselbe Evidenz im aktiven `docs/derived/`-Arbeitsraum halten.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/reviews/originalset-spotchecks/register.md`
  - `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_*.md`
  - `docs/archive/originalset-spotcheck-jobs/2026-05/*.md`
- Das Register ist ein nützlicher aktiver Einstieg, die Detailberichte sind historische Evidence, die Jobdateien wirken nach Abschluss eher wie Arbeitsboard-Reste.

## Scope

- Spotcheck-Artefakte inventarisieren und pro Runde verknüpfen.
- Prüfen, ob `ORIGINALSET_CARD_SPOTCHECK_REGISTER.md` alle wesentlichen Ergebnisdaten enthält.
- Fehlende Links oder Prüfnachweise im Register ergänzen oder als Folgepaket benennen.
- Danach klassifizieren:
  - Register als `keep-active` oder `keep-evidence`,
  - Detailberichte als `keep-evidence` oder `archive`,
  - erledigte Jobdateien als `archive` oder `git-remove-after-condense`.
- Einen Link-sicheren Archivierungsplan erstellen.

## Nicht im Scope

- Keine Spotcheck-Ergebnisse fachlich umdeuten.
- Keine Kartenstatus-, Runtime-, AI- oder Deck-Legal-Promotion ändern.
- Keine Jobdateien löschen, bevor Register/Rollup vollständig genug ist.
- Keine neuen Kartenprüfungen ausführen.

## Akzeptanzkriterien

- [x] Jede Spotcheck-Runde ist genau einem Registereintrag, Detailbericht und ggf. Jobfile zugeordnet.
- [x] Fehlende Evidence-Links sind dokumentiert.
- [x] Es gibt eine klare Retention-Regel für künftige Spotcheck-Jobs.
- [x] Historische Nachweise bleiben auffindbar.

## Umsetzungshinweise

- Dieses Paket ist Dokumentationspflege, keine Kartenarbeit.
- Bei Unsicherheit eher `archive` statt `git-remove-after-condense` empfehlen.

## Ergebnisnotiz

Erledigt. `docs/reviews/originalset-spotchecks/README.md` inventarisiert 41 Registerrunden, 41 Detailbericht-Zuordnungen, 40 eindeutige Detailbericht-Dateien, 39 erledigte Jobfiles und die zwei historischen Zufallsrunden ohne Jobfile. Der fehlende Detailbericht für `2026-05-14-A` wurde als historisches Evidence-Artefakt angelegt, der veraltete Reorder-Jobpfad wurde auf `done/` korrigiert, und Register/JSON verweisen jetzt auf die vollständige Evidence. Die Retention-Regel hält Register/JSON als `keep-active`, Detailberichte als `keep-evidence` und erledigte Jobfiles als `archive`; Jobfiles wurden nicht gelöscht.

Nachtrag 2026-05-18: Register, Rollup und Detailberichte wurden aus `docs/derived/` nach `docs/reviews/originalset-spotchecks/` migriert. Die 39 erledigten Jobfiles wurden link-sicher nach `docs/archive/originalset-spotcheck-jobs/2026-05/` verschoben.
