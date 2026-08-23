---
activityId: act-2026-08-23-empty-mechanics-surfaces-audit
status: inbox
kind: cleanup
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Verbraucher und aktive CardSpec-Verträge geprüft
---

# Leere Mechanics-Oberflächen auditieren

## Ziel

Prüfen, ob `agenda-scoring.ts`, `payment-costs.ts` und `hosting-counters.ts`
vollständig entfernt werden können, weil kein aktiver Kartenvertrag mehr von
ihren leeren Profiloberflächen abhängt.

## Kontext und Quellen

- Regel-Engine-Review Batch 8 vom 2026-08-23.
- NETGRID V0 verlangt keine Kompatibilitätsoberfläche ohne aktuellen Nutzen.

## Scope

- Sämtliche Imports, Exports, Tests und dynamischen Verbraucher inventarisieren.
- Bei belegter Wirkungslosigkeit kleine Removal-Folgepakete pro Oberfläche anlegen.

## Nicht im Scope

- Neue Kartenprofile in die alten Tabellen aufnehmen.
- `@deprecated`-Adapter ohne nachgewiesenen aktuellen Verbraucher.

## Akzeptanzkriterien

- [ ] Für jede Oberfläche ist aktive Nutzung oder Wirkungslosigkeit belegt.
- [ ] Tote Oberflächen werden ohne Alias oder Dual-Read entfernt.
- [ ] CardSpec-, Engine-, Replay- und Public-Verträge bleiben unverändert.

## Ergebnisnotiz

Noch nicht bearbeitet.
