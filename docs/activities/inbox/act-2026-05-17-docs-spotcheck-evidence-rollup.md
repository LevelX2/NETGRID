---
activityId: act-2026-05-17-docs-spotcheck-evidence-rollup
status: inbox
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Originalset-Spotcheck-Nachweise verdichten

## Ziel

Die Originalset-Spotcheck-Nachweise sollen so verdichtet werden, dass Register, Detailberichte und erledigte Jobdateien nicht dauerhaft dreifach dieselbe Evidenz im aktiven `docs/derived/`-Arbeitsraum halten.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
  - `docs/derived/ORIGINALSET_CARD_SPOTCHECK_*.md`
  - `docs/derived/originalset-spotcheck-jobs/done/*.md`
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

- [ ] Jede Spotcheck-Runde ist genau einem Registereintrag, Detailbericht und ggf. Jobfile zugeordnet.
- [ ] Fehlende Evidence-Links sind dokumentiert.
- [ ] Es gibt eine klare Retention-Regel für künftige Spotcheck-Jobs.
- [ ] Historische Nachweise bleiben auffindbar.

## Umsetzungshinweise

- Dieses Paket ist Dokumentationspflege, keine Kartenarbeit.
- Bei Unsicherheit eher `archive` statt `git-remove-after-condense` empfehlen.

## Ergebnisnotiz

Noch offen.
