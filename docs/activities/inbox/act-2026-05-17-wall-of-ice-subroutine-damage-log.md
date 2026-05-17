---
activityId: act-2026-05-17-wall-of-ice-subroutine-damage-log
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
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

# Wall of Ice: Subroutinen und Damage einzeln protokollieren

## Ziel

`Wall of Ice` soll Subroutinen, Damage-Folgen, Kartenbewegungen und `End the Run` schrittweise in UI und Chronik nachvollziehbar darstellen.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Karten landen offenbar im Heap, aber UI/Chronik machen nicht klar, welche Subroutine was ausgelöst hat.
- Lokaler Kartenanker: `onr_v1_278_wall-of-ice`.

## Scope

- Prüfen, ob Subroutinen intern einzeln oder als Block resolved werden.
- Für jede Subroutine einen eigenen sichtbaren Resolution-/Chronikschritt erzeugen.
- Damage und durch Damage abgeworfene Karten side-sicher dokumentieren.
- `End the Run` als eigenen Schritt protokollieren.

## Nicht im Scope

- Keine Änderung an Damage-Regeln, falls die Engine bereits korrekt resolved.
- Kein pauschaler Umbau aller ICE-Resolver außerhalb der nötigen gemeinsamen Hilfslogik.

## Akzeptanzkriterien

- [ ] Die Chronik zeigt `200 Damage`, `200 Damage`, `End the Run` als getrennte Schritte.
- [ ] Kartenbewegungen in den Heap sind nachvollziehbar und Hidden-Info-konform.
- [ ] UI macht sichtbar, welche Subroutine gerade resolved wurde.
- [ ] Regression deckt Wall-of-Ice-Encounter mit ungebrochenen Subroutinen ab.

## Umsetzungshinweise

- Wenn eine generische `Subroutine resolved -> effect result -> log entry`-Schicht fehlt, nur einen kleinen wiederverwendbaren Schnitt anlegen.

## Ergebnisnotiz

Noch offen.
