---
activityId: act-2026-07-03-finders-keepers-dice-chronicle
status: done
kind: fix
area: web
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-03
startedAt: 2026-07-04
completedAt: 2026-07-04
branch: codex/activities-worktree-20260704-090854
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - packages/engine/src/index-tests/mechanics/classic-runner-rest-cards.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/classic-runner-rest-cards.test.ts -t "Finders Keepers"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "Finders Keepers"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm format:changed
  - git diff --check
---

# Finders Keepers: Würfelwerte in der Spielchronik sichtbar machen

## Ziel

Die Spielchronik soll bei `Finders Keepers` nach dem Ausspielen die drei tatsächlich gewürfelten Werte und den daraus gewonnenen Creditbetrag sichtbar nennen.

## Kontext und Quellen

- Nutzerfund vom 2026-07-03 aus einem Playtest: `Finders Keepers` wurde gespielt, aber in der Chronik stand nicht, welche Werte gewürfelt wurden.
- Regelentscheid `docs/releases/classic/classic-rule-decisions-2026-06-30.md`: `Finders Keepers` wirft drei deterministische Würfel über `v1921.die.*`-RandomRecords; der öffentliche Payload enthält nur Wurfergebnisse, Summe und Counterstand, keine verdeckten Zoneninformationen.
- Kartenimplementation `packages/engine/src/card-implementations/classic/runner/events/finders-keepers.ts`: `runnerEventLongtail.kind = "three_dice_gain_credits"`.
- Resolver-Hinweis `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts`: der Resolve setzt `v1921RunnerEventAbility: "three_dice_gain_credits"`, `randomDiceLoopRolls`, `randomDiceLoopRolledDice`, `randomDiceLoopComplete`, `gainedCredits`, `runnerCreditsAfter` und `randomCounterAfter`.
- Wahrscheinlicher UI-Einstiegspunkt: `apps/web/app/chronicle.ts` behandelt bereits andere Würfelereignisse, aber offenbar nicht diesen drei-Würfel-Runner-Event lesbar genug.

## Scope

- Einen echten oder minimalen reproduzierbaren `Finders Keepers`-Resolve prüfen: Engine-Event, PublicEvent/PublicContext und Web-Chronik.
- Falls die öffentlichen Payloadfelder vorhanden sind, die Web-Chronik gezielt so erweitern, dass sie `Finders Keepers` mit allen drei Würfelwerten und Creditgewinn darstellt.
- Falls die Payloadfelder im öffentlichen Clientkontext fehlen, die bestehende PublicPayload-Brücke minimal für diesen bereits beschlossenen öffentlichen Dice-Pfad korrigieren.
- Fokussierte Regression ergänzen, die mindestens einen `three_dice_gain_credits`-Payloadfall durch die Chronikformatierung abdeckt.

## Nicht im Scope

- Keine Änderung an Würfellogik, Seed, RandomCounter, RandomDrawRecords, Replay oder StateHash.
- Keine neue Kartenregel oder Änderung des Creditgewinns von `Finders Keepers`.
- Kein Redesign der gesamten Spielchronik.
- Keine Veröffentlichung verdeckter Karten-, Deck-, Hand- oder Choice-Daten.
- Keine breitere Vereinheitlichung aller Dice-Events, außer sie ist als kleine Hilfsfunktion direkt nötig.

## Akzeptanzkriterien

- [x] Ein `Finders Keepers`-Resolve mit drei Würfeln erzeugt in der Spielchronik eine konkrete Zeile mit allen drei Werten, z. B. sinngemäß `Würfe 2, 5, 6`.
- [x] Dieselbe Chronikzeile nennt den gewonnenen Gesamtbetrag, der der Summe der drei Würfel entspricht.
- [x] Runner- und Korp-Ansicht erhalten dieselben öffentlichen Würfelwerte ohne verdeckte Kartendaten.
- [x] Falls `randomCounterAfter` oder ähnliche Diagnosefelder angezeigt werden, bleiben sie untergeordnet; die lesbaren Würfelwerte stehen im Vordergrund.
- [x] Fokussierte Web- oder PublicContext-Regression deckt den echten Feldnamenpfad `v1921RunnerEventAbility: "three_dice_gain_credits"` plus `randomDiceLoopRolls` ab.
- [x] Relevante Checks laufen oder werden begründet eingegrenzt; mindestens `git diff --check` nach Umsetzung.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil ein kartenbezogener Resolver-/PublicPayload-/Chronikpfad betroffen ist.
- Naheliegender erster Fixpunkt ist `apps/web/app/chronicle.ts`: Der vorhandene `Playful AI`-Dice-Loop darf nicht versehentlich alleiniger Verbraucher von `randomDiceLoopRolls` bleiben.
- Falls eine generische Hilfsfunktion für drei sichtbare Würfel entsteht, klar auf öffentliche Payloadfelder begrenzen und keine privaten RandomDrawRecords oder Engine-Interna in die UI geben.
- Die Engine-Implementation wirkt nach erster Sichtung regelkonform; zuerst die Anzeige- und PublicContext-Brücke prüfen, bevor der Resolver geändert wird.

## Ergebnisnotiz

Abgeschlossen. Die Chronik erkennt `v1921RunnerEventAbility: "three_dice_gain_credits"` und zeigt `Finders Keepers` mit allen drei öffentlichen Würfeln sowie dem daraus gewonnenen Creditbetrag an. Die bestehende Engine-/PublicContext-Payload war bereits ausreichend; ergänzt wurden eine echte Engine-Regression für PublicEvents/PlayerViews und eine Web-Chronik-Regression für die lesbare Darstellung.
