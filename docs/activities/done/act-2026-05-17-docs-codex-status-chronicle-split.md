---
activityId: act-2026-05-17-docs-codex-status-chronicle-split
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/codex/CODEX_STATUS.md
  - docs/codex/CODEX_STATUS_CHRONICLE.md
checks:
  - "historical block preservation check for Latest rollup and ## Status history against HEAD: pass"
  - "checked key link targets for CODEX_STATUS_CHRONICLE.md, GOAL_HISTORY.md, NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md and Aktueller Projektstatus.md: pass"
  - "rg for CODEX_STATUS_CHRONICLE, legacy Status/Goal headings and former Current selected next scope placement: pass"
  - "git diff --check: pass"
---

# CODEX_STATUS in aktuellen Status und Chronik trennen

## Ziel

`docs/codex/CODEX_STATUS.md` soll als schneller aktueller Betriebsstatus nutzbar bleiben, während ältere Chronik-, Release- und Arbeitsnotizen in eine klar abgegrenzte Historie oder Rollups wandern.

## Kontext und Quellen

- Strukturreview vom 2026-05-17: `docs/codex/CODEX_STATUS.md` ist zugleich aktueller Status, langer Verlauf, Release-Nachweisindex und Arbeitsnotizsammlung.
- Führende Wissensseiten:
  - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
  - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
  - `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`
- Bestehende Codex-Dateien:
  - `docs/codex/CODEX_STATUS.md`
  - `docs/codex/CODEX_RUNBOOK_NETGRID_MVP_0_1_0_2.md`
  - `docs/codex/GOAL_HISTORY.md`

## Scope

- Strukturvorschlag erstellen für:
  - aktuellen Status,
  - aktive Blocker und nächste Schritte,
  - abgeschlossene Release-/Check-Historie,
  - ältere Codex-Arbeitsnotizen.
- Prüfen, welche Informationen in `KI-Wissen-NETGRID/` bereits führend vorliegen.
- Einen kleinen ersten Split planen oder durchführen, ohne Statuswissen zu verlieren.

## Nicht im Scope

- Keine Löschung historischer Statusabschnitte ohne vorheriges Rollup.
- Keine Änderung an Release-Gates oder Roadmap-Autorität.
- Keine Umsortierung der Wissensbasis ohne separaten Wissenspflege-Auftrag.
- Keine Codeänderung.

## Akzeptanzkriterien

- [x] Der aktuelle Projektstand ist nach dem Schnitt schneller auffindbar.
- [x] Ältere Statusblöcke bleiben über Chronik oder Archiv erreichbar.
- [x] Führende Wissensbasis und `CODEX_STATUS` widersprechen sich nicht.
- [x] Linkziele aus bestehenden docs-Dateien sind geprüft oder als Risiko benannt.

## Umsetzungshinweise

- Sehr vorsichtig arbeiten: `CODEX_STATUS.md` wird häufig als Einstieg gelesen.
- Erst Strukturvorschlag und kleine Probe, dann größere Verdichtung.

## Ergebnisnotiz

Abgeschlossen. `docs/codex/CODEX_STATUS.md` ist jetzt ein schnellerer Einstieg mit Entry-Point-Hinweisen auf aktuellen Projektstatus, Roadmap/Gate-Autorität, `GOAL_HISTORY.md` und die neue Chronik. Der alte Block ab `## Status` sowie der alte `Latest`-/`Current selected next scope`-Rollup wurden ohne Löschung nach `docs/codex/CODEX_STATUS_CHRONICLE.md` ausgelagert. Ein Vergleich gegen `HEAD:docs/codex/CODEX_STATUS.md` bestätigt, dass beide historischen Blöcke in der Chronik erhalten blieben. Die veraltete Next-Scope-Zeile zu V1.9.5 bis V1.9.8 steht nicht mehr im aktuellen Schnellstatus, sondern nur noch in der Chronik.

Offen bleibt als bewusst nicht erweiterter Scope: Eine spätere zweite Verdichtung kann den noch langen `Current phase`-Block nach Datum oder Releasefamilie weiter schneiden.
