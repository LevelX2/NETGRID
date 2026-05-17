---
activityId: act-2026-05-17-docs-root-source-duplicates-cleanup
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

# Root-/Source-Duplikate in docs sicher bereinigen

## Ziel

Bitgleiche oder nahezu gleiche Dokumente im `docs/`-Root und in Unterordnern sollen link-sicher eingeordnet werden, damit es nur noch einen klaren führenden Pfad pro Quelle oder Runbook gibt.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` ist bitgleich zu `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`.
  - `docs/NETGRID_MVP_0.2_Plan.md` ist bitgleich zu `docs/source/NETGRID_MVP_0.2_Plan.md`.
  - `docs/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf` ist bitgleich zu `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`.
  - `docs/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` und `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md` unterscheiden sich nur geringfügig.
- Projektregel: Rohquellen liegen primär unter `docs/source/`, Codex-Runbooks unter `docs/codex/`.

## Scope

- Alle Root-Duplikate per Hash oder Diff erneut prüfen.
- Alle Repo-Links und Wissensbasis-Referenzen auf die betroffenen Pfade suchen.
- Einen sicheren Zielzustand dokumentieren:
  - Rohquellen nur unter `docs/source/`,
  - Codex-Runbook nur unter `docs/codex/`,
  - Root-Dateien höchstens als kurze Weiterleitungs-/Indexhinweise, falls nötig.
- Erst nach Linkprüfung konkrete Remove- oder Archivkandidaten benennen.

## Nicht im Scope

- Keine sofortige Entfernung ohne Linkprüfung.
- Keine Änderung an den Rohquelleninhalten.
- Keine Entfernung rechtlich oder fachlich wichtiger Quellen aus der Git-Historie.
- Keine Änderung an der Activity-Inbox-Tracking-Vereinfachung.

## Akzeptanzkriterien

- [ ] Duplikate sind mit Hash oder Diff belegt.
- [ ] Alle internen Referenzen auf betroffene Pfade sind gefunden.
- [ ] Es gibt eine klare Empfehlung pro Datei: `keep-source`, `archive` oder `git-remove-after-condense`.
- [ ] Wenn Dateien entfernt werden sollen, ist vorher ein Link-Migrationsplan dokumentiert.

## Umsetzungshinweise

- Bei PDFs nur Pfad- und Hashentscheidung treffen; keine PDF-Inhalte verändern.
- Bei Runbooks die 7-Zeilen-Differenz zuerst in den führenden Pfad übernehmen oder bewusst verwerfen.

## Ergebnisnotiz

Noch offen.
