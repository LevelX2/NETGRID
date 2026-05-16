---
activityId: act-2026-05-17-card-action-menu-outside-click
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/card-action-menu-ui.ts
  - apps/web/app/card-action-menu-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- card-action-menu-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Kartenaktionsmenü bei Außenklick schließen

## Ziel

Das Aktionsmenü unter einer Karte soll sich schließen, wenn der Nutzer außerhalb des Menüs oder des zugehörigen Aktionsknopfs klickt. Aktuell bleibt es offen, bis derselbe Knopf erneut gedrückt wird.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Beim Klick auf einen Aktionsknopf unter einer Karte öffnet sich ein Menü mit möglichen Aktionen. Dieses Menü schließt nur durch erneuten Klick auf denselben Knopf.
- Erwartetes UI-Verhalten: Ein Klick an eine andere Stelle im Spielfeld oder in die Oberfläche schließt das offene Kartenaktionsmenü.

## Scope

- Offene Kartenaktionsmenüs bei Pointer-/Mausklick außerhalb des Menüs und außerhalb des zugehörigen Buttons schließen.
- Klicks innerhalb des Menüs dürfen das Menü nicht unbeabsichtigt schließen, bevor eine Aktion gewählt werden kann.
- Klicks auf denselben Aktionsknopf behalten das bisherige Toggle-Verhalten.
- Prüfen, ob mehrere Kartenaktionsmenüs gleichzeitig offen sein können; falls ja, Außenklick soll alle schließen oder nur das aktive Menü, konsistent mit bestehender Logik.
- Verhalten mit anderen Overlays/Popups wie Karten-Tooltip, Run-Overlay oder Optionen-Dialog kurz abgleichen.

## Nicht im Scope

- Keine Änderung an LegalActions, Engine-Regeln, Action-Ausführung, Replay, StateHash oder KI.
- Keine Änderung an der eigentlichen Aktionsauswahl oder Reihenfolge der Menüeinträge.
- Kein Redesign der Kartenaktionsmenüs.
- Keine globale Änderung an allen Dialogen, nur am Kartenaktionsmenü-Verhalten.

## Akzeptanzkriterien

- [x] Ein geöffnetes Kartenaktionsmenü schließt sich bei Klick außerhalb von Menü und zugehörigem Button.
- [x] Klicks innerhalb des Menüs bleiben bedienbar und lösen weiterhin die gewählte Aktion korrekt aus.
- [x] Erneuter Klick auf den zugehörigen Aktionsknopf toggelt das Menü wie bisher.
- [x] Das Verhalten stört keine anderen Overlays oder Dialoge.
- [x] Fokussierte Web-/Komponenten-Regression deckt Außenklick und Innenklick ab, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind die Kartenaktionsmenü-Komponenten in `apps/web/app/page.tsx` und die Action-/Kontext-Helfer in `apps/web/app/action-board-ui.ts`.
- Eine robuste Lösung nutzt Pointer-Down-/Click-Listener mit `ref` auf Menü und Trigger oder eine bestehende lokale Outside-Click-Pattern-Implementierung.
- Event-Propagation sorgfältig prüfen, damit ein Außenklick nur schließt und nicht versehentlich eine Kartenaktion ausführt.

## Ergebnisnotiz

Erledigt am 2026-05-17. Bei aktivem Kartenaktionskontext registriert der Webclient einen capture-Phase-`pointerdown`-Listener. Klicks auf Trigger oder Menü bleiben über `data-card-action-surface="true"` innen und erhalten das bisherige Toggle-/Auswahlverhalten; Klicks außerhalb setzen `selectedActionContext` zurück und schließen das Kartenaktionsmenü. Da der State weiterhin nur einen aktiven Kartenkontext hält, wird konsistent nur das aktive Menü geschlossen. Checks: `corepack pnpm --filter @netgrid/web test -- card-action-menu-ui.test.ts`, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.
