---
activityId: act-2026-05-17-corp-view-runner-rig-mu-display
status: in_progress
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-Sicht: MU-Auslastung im Runner-Rig anzeigen

## Ziel

Die Korp-Sicht auf das Runner-Rig soll die öffentliche MU-Auslastung der Runner-Programme genauso verständlich anzeigen wie die Runner-Sicht.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: In der Corporation-Sicht fehlt bei Programmen die MU-Anzeige, z. B. `2 / 4 MU`.

## Scope

- Runner-eigene Rig-Komponente und Korp-Sicht vergleichen.
- MU-Berechnung und Rendering in der Korp-Perspektive ergänzen.
- Aktualisierung nach Installation/Deinstallation prüfen.

## Nicht im Scope

- Keine Änderung an MU-Regeln oder Programm-Install-Legalität.
- Keine Anzeige verdeckter Runner-Informationen.

## Akzeptanzkriterien

- [ ] Korp-Sicht zeigt öffentliche MU-Auslastung im Programmbereich.
- [ ] Anzeige aktualisiert sich nach Programm-Install/Trash.
- [ ] Runner-Sicht bleibt unverändert oder konsistent verbessert.
- [ ] UI-Test oder Browser-Smoke deckt Korp-Perspektive ab.

## Umsetzungshinweise

- MU-Auslastung ist kein Hidden-Info-Geheimnis, solange sie aus installierten öffentlichen Programmen stammt.

## Ergebnisnotiz

Noch offen.
