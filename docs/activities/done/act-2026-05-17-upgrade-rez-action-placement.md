---
activityId: act-2026-05-17-upgrade-rez-action-placement
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
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Rez-Aktionen für installierte Upgrades direkt an der Karte anzeigen

## Ziel

Rez-Aktionen für installierte Upgrades sollen direkt an der jeweiligen Upgrade-Karte erscheinen, nicht nur als allgemeine Aktion in der linken Aktionsleiste. Die räumliche Nähe muss klar machen, welches Upgrade gerezzed wird.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Im Korp-Zug liegt in Fort 1 ein installiertes unrezzed Upgrade (`Tesseract Fort Construction`). Die LegalAction `Karte in Fort 1 rezzen` erscheint links in der Aktionsleiste, aber nicht direkt am Upgrade.
- Bei installiertem ICE/Node-/Board-Kontext gibt es bereits Fälle, in denen Kartenaktionen direkt an der Karte hängen. Upgrades sollen konsistent denselben Interaktionsort nutzen.
- Zusätzlich überlagert der Button/Status im unrezzed Zustand Teile der Karte bzw. benachbarte ICE-Informationen. Das unrezzed Upgrade sollte im Server-Root etwas höher bzw. mit stabilerem Layout stehen, damit Rez-Button, Unrezzed-Status und ICE-Stärke-/Counteranzeigen nicht kollidieren.

## Scope

- Systematisch prüfen, wo Rez-LegalActions für installierte Upgrades angezeigt werden.
- Rez-Aktionen für installierte Upgrades direkt an der jeweiligen Upgrade-Karte im Server-Root darstellen.
- Die linke Aktionsleiste für diese Fälle reduzieren oder so belassen, dass sie nicht die einzige primäre Bedienfläche ist; das konkrete Ziel muss am Upgrade selbst ausführbar sein.
- Layout für unrezzed Upgrades im Root-Bereich prüfen und so anpassen, dass Status-/Button-Flächen keine Kartengrafik, ICE-Stärke oder Counter-Anzeigen überdecken.
- Vergleichbare installierte Karten prüfen, insbesondere Nodes/Assets, die gerezzed werden müssen, um sicherzustellen, dass Rez-Aktionen konsistent am Kartenort erscheinen.
- `Tesseract Fort Construction` in Fort 1 als konkreten Startfall abdecken.

## Nicht im Scope

- Keine Änderung an Engine-Regeln, Rez-Kosten, Timingfenstern, `LegalActions`, `actionId`, Replay, StateHash oder KI.
- Keine Änderung daran, wann eine Karte gerezzed werden darf.
- Kein Redesign des gesamten Serverboards.
- Keine Umstellung von Aktionen, deren Kartenkontext nicht sichtbar oder nicht eindeutig ist.

## Akzeptanzkriterien

- [x] Ein installiertes unrezzed Upgrade wie `Tesseract Fort Construction` zeigt seine Rez-Aktion direkt an der Karte.
- [x] Der Button benennt die konkrete Aktion knapp, ohne unnötig nur den Serverplatz zu beschreiben.
- [x] Die linke Aktionsleiste ist nicht mehr die einzige Stelle, an der diese Upgrade-Rez-Aktion ausgelöst werden kann.
- [x] Unrezzed-Status, Rez-Button, ICE-Stärke und Counter-Anzeigen überlagern sich im Fort-Root-/ICE-Bereich nicht mehr störend.
- [x] Vergleichbare rezbare Upgrades wurden systematisch geprüft und bei Bedarf angepasst.
- [x] Rezbare Nodes/Assets wurden mindestens stichprobenartig geprüft, damit keine inkonsistente Sonderlogik entsteht.
- [x] Fokussierte Web-/Rendering- oder Komponenten-Regression deckt mindestens den Upgrade-Startfall ab, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind die Board-Renderingpfade in `apps/web/app/page.tsx` und die kontextuelle Action-Ableitung in `apps/web/app/action-board-ui.ts`.
- Die Korrektur sollte in der UI-Zuordnung von `LegalActions` zu sichtbaren installierten Karten bleiben. Engine-Verträge und Action-Validierung bleiben unverändert.
- Für direkt sichtbare installierte Karten gilt als Leitregel: Zielgebundene Rez-/Kartenaktionen erscheinen primär am Kartenort; zentrale Aktionslisten dürfen ergänzend bleiben, sollen aber nicht die einzige Bedienfläche sein.
- Für Layout-Härtung sollten stabile Höhen/Offsets genutzt werden, damit Hover, Statusbadges und Buttons die Root-/ICE-Zonen nicht verschieben oder verdecken.

## Ergebnisnotiz

Erledigt am 2026-05-17. Main-Phase-`rez_ice`-LegalActions mit sichtbarer Kartenreferenz werden jetzt als kontextuelle Kartenaktionen einsortiert, sodass installierte unrezzed Upgrades wie `Tesseract Fort Construction` ihre `Rezzen`-Aktion direkt am Kartenort anbieten. Run-gebundene ICE-Rez-Entscheidungen bleiben in der Hauptentscheidung. Für ungerezzte installierte Karten mit Aktionsmarker wird der Statusbadge im Lane-Layout nach oben versetzt, damit Status und Aktionsmarker nicht kollidieren. Checks: `corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts`, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.
