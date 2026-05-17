---
activityId: act-2026-05-17-undo-request-clears-after-response
status: inbox
kind: fix
area: server
priority: high
primaryAgent: release-implementation-agent
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

# Rücknahme-Anfrage nach Zustimmung oder Ablehnung bereinigen

## Ziel

Eine angefragte Rücknahme darf nach Zustimmung, Ablehnung, Ungültigkeit oder Ablauf nicht dauerhaft im UI hängen bleiben.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Hinweis `Rücknahme angefragt` mit `Zustimmen`/`Ablehnen` bleibt dauerhaft sichtbar.

## Scope

- Server- und Client-Pending-State für Undo-Requests prüfen.
- Antwort-Klicks auf Zustimmung/Ablehnung bis zur State-Bereinigung verfolgen.
- Request-ID, StateVersion und Multiplayer-Sync absichern.
- UI-State nach State-Update bereinigen.

## Nicht im Scope

- Keine Änderung an der fachlichen Undo-Regel oder Hidden-Info-Barriere.
- Kein Redesign des Undo-Panels.

## Akzeptanzkriterien

- [ ] Zustimmung führt die Rücknahme aus und entfernt die Anfrage aus beiden Sichten.
- [ ] Ablehnung entfernt die Anfrage aus beiden Sichten ohne State-Rollback.
- [ ] Erledigte, ungültige oder abgelaufene Requests bleiben nicht sichtbar.
- [ ] Multiplayer-/Reconnect-Test deckt Pending-Undo-Cleanup ab.
- [ ] Hidden-Info-Barrieren für Undo bleiben unverändert.

## Umsetzungshinweise

- Bestehende Multiplayer-/Undo-Tests als Anker verwenden.

## Ergebnisnotiz

Noch offen.
