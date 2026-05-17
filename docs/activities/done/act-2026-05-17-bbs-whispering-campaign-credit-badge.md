---
activityId: act-2026-05-17-bbs-whispering-campaign-credit-badge
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: board UX / installed card counters
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/engine/src/mechanics/payment-costs.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "BBS|economy asset"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "BBS"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-17-installed-card-action-label-cleanup
  - act-2026-05-17-generic-counter-credit-pool-resolver
  - act-2026-05-17-investment-firm-credit-replacement
---

# BBS Whispering Campaign: Credits auf installierter Karte sichtbar machen

## Ziel

Credits, die auf `BBS Whispering Campaign` liegen, sollen im Fort direkt auf der installierten Karte im üblichen Karten-Credit-Format sichtbar sein: bis 9 Credits als einzelne Goldstücke, ab 10 als Zahl plus Goldstück.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-17: `BBS Whispering Campaign` wurde als Node/Asset in einem Fort installiert. Die Funktion hat regel-/aktionsseitig funktioniert, aber die Credits auf der Karte wurden im Board nicht in der üblichen Form angezeigt.
- Erwartete UI-Konvention: sichtbare Karten-Credits werden wie bei bestehenden Credit-Badges dargestellt: einzelne Credit-Icons bis 9; ab 10 eine Zahl mit Credit-Icon.
- Relevante erledigte Vorläufer:
  - `act-2026-05-17-installed-card-action-label-cleanup`: BBS-Aktionslabel direkt an installierter Karte wurde bereits bereinigt.
  - `act-2026-05-17-generic-counter-credit-pool-resolver`: sichtbare Counter-/Credit-Pools wurden engine-seitig generischer gemacht.
  - `act-2026-05-17-investment-firm-credit-replacement`: sichtbare Credits auf installierter `Investment Firm` wurden als Regression behandelt.
- Code-Spotcheck:
  - `apps/web/app/page.tsx` enthält bereits `CardCreditCounter`, `BrokerStoredCreditsBadge`, `RecurringCreditBadge` und `ScoredAgendaCreditsBadge`.
  - `CardCreditCounter` rendert genau das gewünschte Muster: bis 9 Icons, ab 10 Count plus Icon.
  - `storedCreditSourceLabel` erkennt aktuell nur `Broker` und `Short-Term Contract`; `BBS Whispering Campaign` ist dort nicht enthalten.
  - `packages/shared/src/index.ts` führt `onr_v1_309_bbs-whispering-campaign` als installierbares Korp-Asset mit Kampagnen-/Economy-Mechanik.

## Scope

- Prüfen, wie `BBS Whispering Campaign` Credits aktuell im Runtime-State/`PlayerView` repräsentiert:
  - vorhandener öffentlicher Counter/Credit-Pool auf der Karte,
  - `recurring_credit`-Counter,
  - `power`-Counter,
  - oder aktuell nur direkter Credit-Gain ohne gespeicherten Kartenpool.
- Wenn die Credits bereits öffentlich im `PlayerView` auf der installierten/rezzed Karte vorhanden sind: Web-Darstellung ergänzen, sodass BBS das bestehende `CardCreditCounter`-Muster nutzt.
- Falls die Credits fachlich auf der Karte liegen sollen, aber im State/`PlayerView` fehlen: Befund im Paket um eine kleine Karten-/Engine-Projektionskorrektur erweitern oder ein direktes Folgepaket für `card-enablement-ai-knowledge-agent` schneiden.
- Die Anzeige im Fort/Root-Bereich platzieren, ohne Aktionsbutton, Rez-Status, ICE-Stärke, Advancement-Counter oder Kartenbild störend zu überdecken.
- BBS als konkreten Startfall umsetzen; wenn die gleiche generische Credit-Badge-Lücke bei anderen sichtbaren installierten Credit-Pool-Karten offensichtlich ist, das Rendering über eine kleine gemeinsame Helper-Liste statt über einen BBS-Einzelfall lösen.
- Tooltip-/Accessible-Label ergänzen, z. B. `N Credits auf BBS Whispering Campaign`.

## Nicht im Scope

- Keine Änderung an BBS-Regeltext, Kartentitel, Definition-ID oder Release-/Decklegal-Status ohne separaten Kartenbefund.
- Keine Anzeige verdeckter Informationen auf unrezzed oder unbekannten Korp-Karten.
- Keine generelle Neugestaltung der Kartendarstellung.
- Keine Änderung an LegalActions, Replay, StateHash oder KI-Entscheidungen, sofern der bestehende Runtime-State die Credits bereits korrekt führt.
- Keine breite Migration aller Countertypen; dieses Paket betrifft sichtbare Credit-Pools auf installierten Karten.

## Akzeptanzkriterien

- [x] `BBS Whispering Campaign` zeigt sichtbare Credits im Fort direkt auf der Karte im bestehenden Goldstückchen-Format.
- [x] Bei 1 bis 9 Credits erscheinen einzelne Credit-Icons; ab 10 erscheint Zahl plus Credit-Icon.
- [x] Die Anzeige nutzt das bestehende `CardCreditCounter`-Muster oder ein daraus sauber abgeleitetes gemeinsames Muster.
- [x] Die Anzeige überlappt nicht störend mit Kartenbild, Aktionsbutton, Rez-Status, Advancement-Countern oder anderen Badges.
- [x] Für BBS ist geklärt und dokumentiert, ob die Credits aus `power`, `recurring_credit` oder einem anderen sichtbaren Karten-Counter kommen.
- [x] Unrezzed/verdeckte Korp-Karten leaken durch die neue Anzeige keine Kartendaten oder verdeckten Counter.
- [x] Mindestens ein fokussierter Web-/Rendering-Test oder Snapshot deckt BBS mit unter 10 und nach Möglichkeit mit 10+ Credits ab, oder die Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`; bei fehlender State-/PlayerView-Grundlage an `card-enablement-ai-knowledge-agent` übergeben oder ein kleines Folgepaket schneiden.
- Wahrscheinliche Startpunkte:
  - `apps/web/app/page.tsx`: `CardCreditCounter`, `BrokerStoredCreditsBadge`, `RecurringCreditBadge`, `brokerStoredCreditsAmount`, `recurringCreditAmount`, `storedCreditSourceLabel`, `cardDetailLines`.
  - `apps/web/app/globals.css`: `.cardCreditCounterBadge`, `.brokerStoredCreditsBadge`, `.recurringCreditBadge`, `.cardCreditCounterIcon`, `.cardCreditCounterAmount`.
  - Web-Tests rund um Karten-/Action-Board-Rendering, z. B. vorhandene `action-board-ui`- oder Board-Snapshot-Tests.
- Wenn BBS fachlich denselben Countertyp wie `Investment Firm` oder `Spinn Public Relations` nutzt, keine neue BBS-only CSS-Variante bauen; den bestehenden Credit-Badge-Pfad erweitern.

## Ergebnis

- BBS ist fachlich kein direkter generischer Economy-Gain mehr: Beim Rezzen legt die Engine 16 sichtbare `bit`-Counter auf die Karte, die Korp-Aktion nimmt 2 Credits, entfernt 2 Bits und trasht BBS bei 0 Bits.
- `PlayerView` projiziert die sichtbaren Counter nur auf bekannte/rezzed Karten; unrezzed oder verdeckte Korp-Karten erhalten durch die Anzeige keinen neuen Informationspfad.
- Die Web-Helfer mappen gespeicherte Credit-Pools jetzt pro Karte auf den passenden Countertyp: Broker und Short-Term Contract auf `power`, BBS auf `bit`.
- `CardCreditCounter` bleibt der gemeinsame Darstellungsweg: 1-9 Credits als einzelne Icons, ab 10 als Zahl plus Icon. Der fokussierte Web-Helper-Test deckt diese Badge-Logik für BBS mit 8 und 10 Bits ab; ein eigener DOM-Snapshot wurde nicht ergänzt, weil die Komponente denselben bestehenden Badge-Pfad und dieselbe CSS-Geometrie wie die vorhandenen Karten-Credit-Badges nutzt.
- Die Engine-Regression deckt BBS-Rez-Counter, Aktion, PublicPayload, `PlayerView`-Counter, Self-Trash bei leerem Pool, Replay und StateHash ab.
