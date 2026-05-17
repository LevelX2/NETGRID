---
activityId: act-2026-05-17-docs-derived-automation-archive
status: in_progress
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Abgeschlossene Automationsartefakte archivieren

## Ziel

Abgeschlossene Automationspläne, Prompts, Watchdog-Berichte und State-Dateien unter `docs/derived/` sollen aus dem aktiven Arbeitsraum herausgelöst oder klar als historische Betriebsnachweise markiert werden.

## Kontext und Quellen

- Strukturreview vom 2026-05-17:
  - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_CONTROLLER_PLAN.md`
  - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_PROMPT.md`
  - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`
  - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_WATCHDOG_PROMPT.md`
  - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_WATCHDOG_REPORT.md`
- `V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md` steht auf `Status: complete`.

## Scope

- Alle Automationsartefakte in `docs/derived/` identifizieren.
- Prüfen, welche noch aktiv gebraucht werden und welche nur historischer Nachweis sind.
- Vorschlag erstellen für:
  - `keep-evidence`,
  - `archive`,
  - `git-remove-after-condense`.
- Falls sinnvoll, ein kurzes Rollup erstellen, das Automation-ID, Zeitraum, Ergebnis, Branch, Worktree und Abschlussstatus zusammenfasst.

## Nicht im Scope

- Keine Änderung an bestehenden Automationen.
- Keine Cron-/Heartbeat-Konfiguration ändern.
- Keine Löschung von Gate-Nachweisen.
- Keine Änderung am V1.9.10-bis-V1.9.22-Completion-Status.

## Akzeptanzkriterien

- [ ] Aktive und abgeschlossene Automationsartefakte sind getrennt.
- [ ] Historische Betriebsnachweise bleiben nachvollziehbar.
- [ ] Prompts und State-Dateien sind nicht mehr versehentlich als aktuelle operative Vorgabe lesbar.
- [ ] Linkbruchrisiken sind vor jedem Move dokumentiert.

## Umsetzungshinweise

- Completed-Automation-State ist Evidence, aber nicht notwendigerweise aktives Arbeitswissen.
- Bei Unsicherheit lieber ins Archiv verschieben als entfernen.

## Ergebnisnotiz

Noch offen.
