---
activityId: act-2026-05-17-docs-codex-status-chronicle-split
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

- [ ] Der aktuelle Projektstand ist nach dem Schnitt schneller auffindbar.
- [ ] Ältere Statusblöcke bleiben über Chronik oder Archiv erreichbar.
- [ ] Führende Wissensbasis und `CODEX_STATUS` widersprechen sich nicht.
- [ ] Linkziele aus bestehenden docs-Dateien sind geprüft oder als Risiko benannt.

## Umsetzungshinweise

- Sehr vorsichtig arbeiten: `CODEX_STATUS.md` wird häufig als Einstieg gelesen.
- Erst Strukturvorschlag und kleine Probe, dann größere Verdichtung.

## Ergebnisnotiz

Noch offen.
