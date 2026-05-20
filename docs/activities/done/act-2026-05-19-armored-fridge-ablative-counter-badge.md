---
activityId: act-2026-05-19-armored-fridge-ablative-counter-badge
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web test -- apps/web/app/action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine test -- src/index.test.ts -t "spends Armored Fridge counters"
  - git diff --check
---

# Armored Fridge: Ablative Counter auf installierter Karte anzeigen

## Ziel

`Armored Fridge` soll nach der Installation die vorhandenen Ablative Counter sichtbar auf der installierten Hardwarekarte anzeigen. Wenn die Engine 7 Counter auflegt, darf die UI diese nicht verschlucken.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19: `Armored Fridge` wurde installiert, aber es wurden keine Ablative Counter auf der Karte angezeigt.
- Bestätigte lokale Textquelle:
  - `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`: `Put seven Ablative counters on Armored Fridge when it is installed. ... Ablative counter: Prevent 1 meat damage.`
- Aktueller Shared-Katalog:
  - `packages/shared/src/index.ts` enthält `onr_v1_121_armored-fridge` mit Text `Install with 7 Ablative counters...`.
- Aktueller Engine-Test:
  - `packages/engine/src/index.test.ts` prüft beim Installieren `cardCounterAmount(state, armoredFridgeId, "power") === 7`.
  - Der PublicPayload enthält `counterType: "power"`, `addedCounterAmount: 7`, `remainingCounters: 7`.
- Aktuelle Web-Sichtung:
  - `apps/web/app/page.tsx` rendert sichtbare Spezialbadges für gespeicherte Credits, Recurring Credits, Shell Counter und Data-Raven-Counter.
  - `DataRavenCounterBadge` nutzt ebenfalls `power`, ist aber ausdrücklich auf `onr_v1_236_data-raven` begrenzt.
  - Für `Armored Fridge` gibt es nach erster Sichtung keinen eigenen Ablative-Counter-Badge.

## Scope

- Webanzeige für `Armored Fridge` ergänzen:
  - installierte Hardware mit `definitionId: "onr_v1_121_armored-fridge"` und `counters.power > 0` zeigt Ablative Counter sichtbar auf der Karte.
  - Label/Tooltip/ARIA z. B. `7 Ablative Counter`.
- Bestehendes Karten-Counter-Layout wiederverwenden, aber semantisch korrekt beschriften:
  - nicht als Data-Raven-Counter,
  - nicht als Credits,
  - nicht als Shell-Counter.
- Prüfen, ob die Counter nach Verwendung der Damage-Prevention sichtbar herunterzählen.
- Prüfen, ob die Karte bei 0 Countern getrasht wird und dann kein Badge mehr im Rig bleibt.
- Web-Test ergänzen:
  - `Armored Fridge` mit `counters.power: 7` zeigt Ablative-Counter-Label/Badge.
  - unbekannte `power`-Counter-Karten erhalten dadurch nicht versehentlich ein falsches Ablative-Label.
  - Data Raven bleibt weiter Data-Raven-Counter.

## Nicht im Scope

- Keine Änderung an `Armored Fridge`-Regeltext, Installkosten oder Damage-Prevention-Regel, sofern der Engine-Pfad bereits korrekt ist.
- Keine Änderung an der Engine-Counter-Repräsentation von `power`, außer die Umsetzung weist nach, dass eine typisierte Counter-Quelle nötig ist.
- Keine allgemeine UI für alle möglichen `power`-Counter in einem großen Refactor.
- Keine Änderung an Damage-, Flatline-, Prevention-, Replay- oder StateHash-Regeln.
- Keine Hidden-Info-Ausweitung; installierte Hardware und ihre Counter sind sichtbar, aber es dürfen keine verdeckten Karteninfos abgeleitet werden.

## Akzeptanzkriterien

- [ ] Direkt nach Installation zeigt `Armored Fridge` 7 Ablative Counter sichtbar auf der Karte.
- [ ] Nach ausgegebener Damage-Prevention sinkt die sichtbare Counterzahl korrekt.
- [ ] Bei 0 Countern wird `Armored Fridge` wie bisher getrasht; es bleibt kein veraltetes Badge sichtbar.
- [ ] `Armored Fridge`-Counter werden als `Ablative Counter` bezeichnet, nicht generisch oder als falscher Countertyp.
- [ ] Data-Raven-, Shell- und Credit-Badges bleiben unverändert.
- [ ] Ein fokussierter Web-Test deckt das Badge und die Beschriftung ab.
- [ ] Falls Engine-Payload/PlayerView die Counter wider Erwarten nicht enthält, wird der kleinste Engine-/PlayerView-Fix ergänzt und mit Test abgesichert.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx`
  - `apps/web/app/globals.css`
  - `apps/web/app/action-board-ui.test.ts` oder ein passender Web-UI-Test
  - bei fehlender Projektion: `packages/engine/src/index.ts` / PlayerView-Aufbau
- Nicht nur auf `counters.power` gehen, sondern an die Karten-ID binden, damit andere Power-Counter-Karten nicht falsch als Ablative Counter erscheinen.
- Bestehende Badge-Komponenten können als Muster dienen:
  - `DataRavenCounterBadge`
  - `ShellCounterBadge`
  - `cardDetailLines`/Counter-Labels, falls dort Details angezeigt werden.

## Ergebnisnotiz

Erledigt am 2026-05-19. Die Webanzeige erkennt `onr_v1_121_armored-fridge` kartengebunden und zeigt vorhandene `power`-Counter als `Ablative Counter`-Badge mit ARIA-/Tooltip-Beschriftung und Detailzeile. Unbekannte `power`-Counter-Karten und Data Raven werden nicht als Ablative Counter gelabelt. Die bestehende Engine-Regression bestätigt Installation mit 7 Countern, Reduktion nach Prevention und Trash bei 0 Countern.
