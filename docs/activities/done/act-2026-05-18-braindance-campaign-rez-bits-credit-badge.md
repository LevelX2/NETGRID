---
activityId: act-2026-05-18-braindance-campaign-rez-bits-credit-badge
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt: 2026-05-18
completedAt: 2026-05-18
branch:
releaseTarget: V1.9.17 follow-up / Campaign recurring credit pools
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine test -- -t "Braindance Campaign|recurring assets"
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts -t "campaign stored bit"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-17-bbs-whispering-campaign-credit-badge
  - act-2026-05-17-generic-counter-credit-pool-resolver
---

# Braindance Campaign: 12 Credits beim Rezzen und sichtbare Karten-Credits

## Ziel

`Braindance Campaign` soll beim Rezzen exakt 12 Credits/Bits aus der Bank auf die Karte legen, diese Credits öffentlich auf der rezzed Karte im bestehenden Goldstückchen-Format anzeigen und am Start jedes Korp-Zugs korrekt 2 Credits von der Karte nehmen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-18: Bei `Braindance Campain` werden beim Rezzen nur 6 statt 12 Credits auf die Karte gelegt. Außerdem werden die Credits nicht als Symbole auf der Karte gezeigt.
- Gemeinter Kartentitel im Workspace: `Braindance Campaign` (`onr_v1_311_braindance-campaign`).
- Lokaler Kartentext in `data/cards/originalset-v1-cards.json`: Beim Rezzen 12 aus der Bank auf `Braindance Campaign` legen; am Start jedes eigenen Zugs 2 von `Braindance Campaign` nehmen; bei leerem Pool trashen.
- `packages/shared/src/index.ts` führt `Braindance Campaign` als rezzbares Korp-Asset mit `rezCost: 6`, `trashCost: 7`, `campaign_economy`, `recurring_credit` und `recurring_start_turn`.
- `packages/engine/src/index.ts` hat für `BBS Whispering Campaign` und `Holovid Campaign` bereits explizite Start-Bit-Konstanten/Pfade; für `Braindance Campaign` wurde im Spotcheck kein entsprechender sichtbarer 12-Bit-Pfad gefunden.
- `packages/engine/src/index.test.ts` deckt `Holovid Campaign` bereits mit 12 öffentlichen Bits und Self-Trash beim letzten Drain ab, aber kein gleichwertiger Braindance-Smoke ist sichtbar.
- `apps/web/app/action-board-ui.ts` mappt gespeicherte Karten-Credits aktuell für `Broker`, `Short-Term Contract` und `BBS Whispering Campaign`, aber nicht für `Braindance Campaign`.
- Relevante erledigte Vorläufer:
  - `act-2026-05-17-bbs-whispering-campaign-credit-badge`: sichtbare Campaign-Bits direkt auf installierter/rezzed Karte anzeigen.
  - `act-2026-05-17-generic-counter-credit-pool-resolver`: gemeinsame Helfer für sichtbare Counter-/Credit-Pools.

## Scope

- Regelvertrag für `Braindance Campaign` lokal bestätigen und als 12-Bit-Startpool plus 2-Bit/2-Credit-Turnstart-Drain umsetzen oder korrigieren.
- Sicherstellen, dass beim Rezzen nicht versehentlich `rezCost: 6` als Kartenpool verwendet wird.
- Sichtbare Karten-Credits/Bits im `PlayerView` nur für bekannte/rezzed `Braindance Campaign` projizieren.
- Web-Darstellung so ergänzen, dass `Braindance Campaign` denselben `CardCreditCounter`-/Goldstückchen-Pfad wie BBS und andere sichtbare Credit-Pools nutzt.
- Self-Trash bei leerem Pool deterministisch prüfen.
- Fokussierte Regressionen für Rez-Pool, Turnstart-Drain, PublicPayload, PlayerView, Replay und StateHash ergänzen.

## Nicht im Scope

- Keine breite Neugestaltung der Kartenanzeige.
- Keine Änderung an `rezCost`, `trashCost`, Titel, Definition-ID, Release-/Decklegal-Status oder AI-Support, außer ein expliziter Quellkonflikt zwingt dazu.
- Keine Anzeige von Countern oder Kartendaten auf unrezzed oder verdeckten Korp-Karten.
- Keine generelle Migration aller Campaign-/Recurring-Karten über `Braindance Campaign` hinaus; wenn eine systemische Lücke bei weiteren Karten sichtbar wird, ein eigenes Folgepaket schneiden.
- Keine Abschwächung von LegalAction-, applyAction-, Replay-, StateHash- oder Hidden-Info-Gates.

## Akzeptanzkriterien

- [x] Beim Rezzen von `Braindance Campaign` werden exakt 12 sichtbare Bits/Credits auf die Karte gelegt, nicht 6.
- [x] Die Korp zahlt weiterhin die korrekten Rez-Kosten aus ihren Credits; Rez-Kosten und Kartenpool werden nicht vermischt.
- [x] Am Start jedes Korp-Zugs werden exakt 2 Bits/Credits von `Braindance Campaign` entfernt und die Korp erhält exakt 2 Credits.
- [x] Bei leerem Pool wird `Braindance Campaign` deterministisch getrasht.
- [x] Die sichtbaren Credits erscheinen auf der rezzed/installierten Karte im bestehenden Goldstückchen-Format: 1 bis 9 als einzelne Symbole, ab 10 als Zahl plus Symbol.
- [x] Unrezzed/verdeckte Korp-Karten leaken durch die neue Anzeige keine Kartenidentität oder Counterdaten.
- [x] PublicPayloads bleiben side-sicher und enthalten nur öffentliche IDs/Zähler/Kreditbeträge.
- [x] Replay und StateHash bleiben für Rez und Turnstart-Drain stabil.
- [x] Mindestens ein fokussierter Engine-Test deckt 12-Bit-Rez, 2-Credit-Drain, Self-Trash und Replay/StateHash ab.
- [x] Mindestens ein fokussierter Web-/Helper-Test deckt die `Braindance Campaign`-Credit-Anzeige ab, einschließlich 10+ Anzeige.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil der Startbefund ein Karten-/Resolver- und Engine-Korrektheitsfehler ist. Die UI-Anzeige ist Teil der Akzeptanz, aber nicht der alleinige Scope.
- Wahrscheinliche Startpunkte:
  - `packages/engine/src/index.ts`: Campaign-Konstanten, Rez-Zusatzwirkungen, Start-of-turn-Recurring-Pfade, sichtbare Counter-Helfer.
  - `packages/engine/src/index.test.ts`: vorhandenen Holovid-Test als Muster für Braindance adaptieren und um 2-Bit-Drain erweitern.
  - `apps/web/app/action-board-ui.ts`: `STORED_CREDIT_COUNTER_SOURCES` um `onr_v1_311_braindance-campaign` ergänzen, falls `bit` der bestätigte Countertyp bleibt.
  - `apps/web/app/action-board-ui.test.ts` oder passende Board-Tests: Anzeige-Helfer für unter 10 und 10+ Credits prüfen.
- Braindance möglichst entlang der bestehenden BBS-/Holovid-/generic-counter-credit-pool-Helfer korrigieren statt einen separaten Sonderpfad ohne gemeinsamen Payload-/PlayerView-Vertrag aufzubauen.

## Ergebnisnotiz

Hotfix umgesetzt. `Braindance Campaign` erhält beim Rezzen jetzt einen eigenen öffentlichen 12-Bit-Pool auf der rezzed Karte; die Korp zahlt weiter nur die regulären Rez-Kosten aus ihren Credits. Am Start jedes Korp-Zugs drained der neue Sonderpfad 2 Bits, gibt der Korp 2 Credits und trasht die Karte deterministisch, wenn der Pool leer ist. Die generische +1-Recurring-Asset-Logik wird für Braindance dadurch nicht zusätzlich angewendet.

Die Engine-Regression deckt verdeckte Vor-Rez-Sichtbarkeit, 12-Bit-Rez-Payload, Runner-PlayerView nach Rez, 2-Bit-Drain, Self-Trash, Replay und StateHash ab. Die bestehende V1.9.17-Recurring-Sammelregression wurde auf die Braindance-2-Bit-Semantik angepasst. Die Web-Helfer mappen `onr_v1_311_braindance-campaign` auf den bestehenden Bit-/Goldstückchen-Badge-Pfad inklusive 10+-Darstellung.

Checks grün: `@netgrid/engine` Testlauf mit `Braindance Campaign|recurring assets` (lokal 507 Tests), `@netgrid/web` Action-Board-Testlauf (lokal 179 Tests), Engine-Typecheck, Web-Typecheck und `git diff --check`.
