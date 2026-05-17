---
activityId: act-2026-05-17-docs-activities-retention-policy
status: in_progress
kind: cleanup
area: docs
priority: low
primaryAgent: activity-triage-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Retention-Regel für docs/activities festlegen

## Ziel

`docs/activities/` soll als leichtes Arbeitsboard erhalten bleiben, ohne dass `done/` dauerhaft zu einem zweiten Dokumentationsarchiv anwächst.

## Kontext und Quellen

- `docs/activities/README.md` definiert `inbox/`, `in-progress/`, `done/` und `templates/`.
- Nutzerentscheidung vom 2026-05-17: Ungetrackte Inbox-Elemente sind bewusst eine Vereinfachung. Sie sollen erst beim Verschieben nach Active/In-Progress oder Done in Git getrackt werden, um Git-Blockaden zu vermeiden.
- Strukturreview vom 2026-05-17: `done/` enthält bereits viele abgeschlossene Pakete; ohne Rollup-Regel wächst das Board wieder in Richtung Dokumentationsmüll.

## Scope

- Eine einfache Retention-Regel für Activities formulieren:
  - Inbox darf untracked bleiben.
  - In-Progress/Done werden beim Bearbeiten versioniert.
  - Done-Pakete werden periodisch in Monats- oder Themenrollups verdichtet.
  - Dauerhafte Erkenntnisse wandern in `KI-Wissen-NETGRID/`, `docs/codex/` oder formale `docs/derived/`-Artefakte.
- Kriterien definieren, wann ein Done-Paket im Board bleibt und wann Git-Historie plus Rollup genügt.
- `docs/activities/README.md` oder ein kleines Runbook als Zielartefakt vorschlagen.

## Nicht im Scope

- Keine Änderung an der bewussten untracked-Inbox-Regel.
- Keine sofortige Löschung erledigter Activities.
- Keine Massenbewegung von Activities.
- Keine Codeänderung.

## Akzeptanzkriterien

- [ ] Die Inbox-Tracking-Vereinfachung ist ausdrücklich als gültig beschrieben.
- [ ] Es gibt eine klare Done-Retention-Regel.
- [ ] Es gibt Kriterien für Rollup, Archivierung und Git-Historie.
- [ ] Activity-Pakete bleiben klein und bearbeitbar.
- [ ] Hidden-Info-, LegalAction-, Replay- und StateHash-Gates bleiben als harte Nicht-Scope-Grenzen erhalten, wenn Activities technische Arbeit betreffen.

## Umsetzungshinweise

- Dieses Paket sollte zuerst nur Prozess-/Board-Regeln formulieren.
- Keine bestehenden Activities anfassen, außer die Regel nennt konkrete Folgepakete.

## Ergebnisnotiz

Noch offen.
