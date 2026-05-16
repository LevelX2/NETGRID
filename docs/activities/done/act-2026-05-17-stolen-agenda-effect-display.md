---
activityId: act-2026-05-17-stolen-agenda-effect-display
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
  - apps/web/app/score-area-ui.ts
  - apps/web/app/score-area-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- score-area-ui.test.ts action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Gestohlene Agendas ohne aktive Korp-Score-Effekte anzeigen

## Ziel

Die Agenda-Anzeige soll zwischen von der Korp gescorten und vom Runner gestohlenen Agendas unterscheiden. Korp-Score-Effekte dürfen bei gestohlenen Agendas nicht als `Aktiv` dargestellt werden, weil diese Effekte für den Runner nicht wirken.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Im Runner-Fenster `Gestohlen` wird bei `Superior Net Barriers` die Statuszeile `Aktiv - Wall-ICE hat +1 Stärke` angezeigt.
- Diese Darstellung ist missverständlich: Der Runner hat die Agenda gestohlen, nicht gescored. Der Effekt darf dort nicht wie ein aktiver Korp-Effekt wirken.
- Die Anzeige kann für Korp-gescorte Agendas fachlich sinnvoll sein, muss dann aber abhängig vom Bereich oder Besitzer unterschiedlich gerendert werden.

## Scope

- Prüfen, wie die Scored-/Stolen-Agenda-Overlay-Ansicht Agenda-Statuszeilen ableitet.
- Bei gestohlenen Agendas Korp-Score-Effektzeilen wie `Aktiv - Wall-ICE hat +1 Stärke` ausblenden oder eindeutig als nicht wirksam markieren.
- Bei Korp-gescorten Agendas die bestehende aktive Effektanzeige beibehalten, sofern sie fachlich korrekt ist.
- `Superior Net Barriers` als konkreten Startfall abdecken.
- Vergleichbare Agenda-Effekte prüfen, die nur beim Scoren durch die Korp wirken und bei Diebstahl nicht aktiv sein dürfen.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine Änderung an Agenda-Punkten, Steal-/Score-Logik, Replay, StateHash oder KI.
- Kein Redesign des gesamten Agenda-Overlays.
- Keine Entfernung neutraler Anzeigen wie Agenda-Punkte oder Kartendaten, die unabhängig vom Wirksamkeitsstatus korrekt sind.

## Akzeptanzkriterien

- [x] Gestohlene `Superior Net Barriers` zeigt keinen aktiven `Wall-ICE hat +1 Stärke`-Effekt mehr.
- [x] Korp-gescorte `Superior Net Barriers` kann den aktiven Effekt weiterhin anzeigen.
- [x] Die Logik unterscheidet den Agenda-Bereich oder Kontext sauber zwischen `Gestohlen` und `Entwickelt`/gescored.
- [x] Vergleichbare Agenda-Effektanzeigen sind geprüft und bei Bedarf angepasst.
- [x] Fokussierte Web-/Komponenten- oder Snapshot-Regression deckt mindestens den gestohlenen Startfall ab, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Wahrscheinlicher Startpunkt ist die Agenda-Overlay-Anzeige in `apps/web/app/page.tsx`, insbesondere die Ableitung von Statuszeilen für scored/stolen Agenda-Karten.
- Die Korrektur sollte in der UI-Rendering-/Label-Schicht bleiben. Stabile Kartendaten, Definition-IDs und Engine-Events sollen unverändert bleiben.
- Falls derselbe Komponentenpfad für beide Seiten genutzt wird, braucht die Statuszeilenfunktion vermutlich den Kontext `side` oder `area`, damit Effekte nur im Korp-Score-Kontext aktiv erscheinen.

## Ergebnisnotiz

Erledigt am 2026-05-17. Die Agenda-Overlay-Statuszeilen erhalten jetzt den Score-Area-Kontext; score-/ability-bezogene Agenda-Effektzeilen werden nur im Korp-Bereich `Entwickelt` angezeigt und im Runner-Bereich `Gestohlen` ausgeblendet. `Superior Net Barriers` behält im Korp-Scorebereich `Aktiv - Wall-ICE hat +1 Stärke`, zeigt diese aktive Korp-Wirkung aber bei gestohlener Runner-Agenda nicht mehr. Neutrale Counter-/Agenda-Punkte-Zeilen bleiben unverändert. Checks: `corepack pnpm --filter @netgrid/web test -- score-area-ui.test.ts action-board-ui.test.ts`, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.
