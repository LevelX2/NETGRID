---
activityId: act-2026-08-17-investment-firm-chronicle-payout
status: done
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-17
startedAt: 2026-08-21
completedAt: 2026-08-21
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/engine-runtime-internal/turn-corp-start-runtime-resolvers.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - apps/web/app/chronicle-localization.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts app/chronicle-localization.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/assets-nodes-upgrades.test.ts
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck (Baseline-Fehler in ice-breakers.test.ts:1239)
  - corepack pnpm --filter @netgrid/web typecheck (Baseline-Fehler in ai-turn-plan-comparison-ui.test.ts:67)
---

# Investment-Firm-Auszahlung in der Chronik zusammenhängend darstellen

## Ziel

Die automatische Auszahlung von **Investment Firm** erscheint in der
Spielchronik als ein zusammengehöriger, sprachlich korrekter Karteneffekt statt
als getrennte Credit- und Counter-Meldungen. Insbesondere darf die Chronik
nicht „1 Recurring Credits“ ausgeben.

## Kontext und Quellen

- Nutzerfund und Screenshot vom 2026-08-17, Korp-Zug 13:
  - „Du hast 1 Recurring Credits von Investment Firm entfernt.“
  - direkt danach „Investment Firm gibt Korp 1 Credit.“
- Der Kartenvertrag in
  `packages/cards/src/specs/originalset-v1/onr_v1_329_investment-firm.card-spec.ts`
  nimmt zu Beginn jedes Korp-Zugs 1 Credit von Investment Firm, sofern dort
  Credits liegen.
- `packages/engine/src/game/engine-runtime-internal/turn-corp-start-runtime-resolvers.ts`
  bildet den Vorgang strukturiert als zwei öffentliche `ResolvedGameEffect`s
  ab: `gain_credits` für die Auszahlung und `counter_change` mit
  `counterType: recurring_credit`, `removedCounterAmount: 1` und derselben
  Kartenquelle.
- `apps/web/app/chronicle.ts` formatiert beide Effekte derzeit unabhängig. Der
  generische `counterLabel` liefert immer „Recurring Credits“, auch wenn der
  Betrag 1 ist. Dadurch entsteht sowohl die falsche Singularform als auch eine
  doppelte Darstellung desselben fachlichen Kartenablaufs.
- Für automatische Recurring-Credit-Auffrischungen und andere Counterwechsel
  bestehen eigene Chronikfälle; diese dürfen durch den Investment-Firm-Schnitt
  nicht pauschal ausgeblendet werden.

## Scope

- Die reale öffentliche Effektfolge der Investment-Firm-Auszahlung vom
  Korp-Zugbeginn bis zur Chronikdarstellung nachvollziehen.
- Aus Auszahlung und zugehöriger Counter-Abnahme einen einzigen klaren
  Chronikvorgang bilden, sinngemäß beispielsweise:
  „Investment Firm gibt dir 1 Credit.“ beziehungsweise aus Gegnersicht
  „Investment Firm gibt der Korp 1 Credit.“
- Falls der verbleibende Kartenbestand für die Nachvollziehbarkeit angezeigt
  wird, ihn als Detail oder Chip desselben Vorgangs darstellen und nicht als
  zweite eigenständige Aktion.
- Singular und Plural für sichtbare Recurring-Credit-Mengen korrekt behandeln;
  insbesondere ist bei Betrag 1 „Recurring Credit“ statt „Recurring Credits“
  zu verwenden, sofern dieser Begriff überhaupt im sichtbaren Text verbleibt.
- Einen fokussierten Web-Regressionstest mit der zusammengehörigen
  `gain_credits`-/`counter_change`-Effektfolge und beiden Betrachterseiten
  ergänzen. Der Test muss absichern, dass genau ein fachlicher
  Investment-Firm-Auszahlungseintrag erscheint und die fehlerhafte Formulierung
  nicht zurückkehrt.
- Live-Chronik, Reconnect und Replay über denselben öffentlichen Eventvertrag
  konsistent halten.

## Nicht im Scope

- Änderung der Kartenregel, der Höhe oder des Timings der Auszahlung sowie der
  Investment-Firm-Credit-Umleitung.
- Änderung von Legal Actions, Choice-Auflösung, Credit- oder Counterzustand,
  Replay-Determinismus oder StateHash.
- Pauschales Unterdrücken aller `counter_change`-Effekte oder aller
  Recurring-Credit-Auffrischungen und -Ausgaben.
- Allgemeines Redesign oder Neu-Gruppieren der Spielchronik.
- Ableitung fachlicher Semantik aus `effectId`, `actionId`, Labels oder
  Chronik-Freitext. Reichen die vorhandenen strukturierten Quellen- und
  Effektfelder nicht zur sicheren Zuordnung, ist der öffentliche Effektvertrag
  ursachenorientiert zu ergänzen.

## Akzeptanzkriterien

- [ ] Der reproduzierte Korp-Zugbeginn mit Investment Firm erzeugt genau einen
  sichtbaren, verständlichen Chronikvorgang für die Auszahlung von 1 Credit.
- [ ] Der Eintrag nennt Investment Firm und den erhaltenen Credit; er behauptet
  nicht zusätzlich eine zweite Spieleraktion für die technische
  Counter-Abnahme.
- [ ] Im sichtbaren Chroniktext kommt weder „1 Recurring Credits“ noch eine
  andere falsche Singular-/Pluralform vor.
- [ ] Ein eventuell sichtbarer Restbestand der Karte gehört als Detail zum
  Auszahlungsvorgang und stimmt mit dem öffentlichen `remainingCounters`-Wert
  überein.
- [ ] Andere automatische Counterwechsel, insbesondere
  Recurring-Credit-Auffrischungen und Shell-Traders-Counter, behalten ihre
  bisherigen fachlich notwendigen Chronikeinträge.
- [ ] Ein fokussierter Web-Test belegt die zusammengehörige reale Effektfolge,
  beide Betrachterformulierungen und den Schutz vor dem doppelten Eintrag.
- [ ] Die Lösung verwendet strukturierte öffentliche Effektsemantik und leakt
  keine privaten Karten-, Choice- oder Zustandsdaten in Live-Chronik,
  Reconnect oder Replay.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`, da der öffentliche
  Effektvertrag die benötigten Beträge, Quelle und Counterart bereits zu
  enthalten scheint und die sichtbare Lücke im gemeinsamen Chronikformatter
  liegt.
- Zuerst `formatChronicleEffectItems` und die vorhandene Gruppierungs- oder
  Suppressionslogik in `apps/web/app/chronicle.ts` prüfen. Die Zuordnung soll
  über Kartenquelle, Effektart und kanonische Reason-/Ability-Semantik erfolgen,
  nicht über Stringpräfixe der technischen `effectId`.
- Als Regressionseingang die beiden Effekte verwenden, die
  `turn-corp-start-runtime-resolvers.ts` für Investment Firm erzeugt. Ein Test
  nur für einen isolierten handgebauten `counter_change`-Effekt würde die
  beobachtete Doppelmeldung nicht absichern.
- Sollte eine eindeutige strukturierte Bindung zwischen Auszahlung und
  Counter-Abnahme fehlen, zuerst den Engine-/Public-Effect-Vertrag minimal
  ergänzen und anschließend die Chronik daran binden; keine titelbasierte
  Sondererkennung als abschließenden Fix einführen.

## Ergebnisnotiz

Die beiden öffentlichen Effekte der Auszahlung tragen nun dieselbe kanonische
Reason und die konkrete, öffentliche Quellinstanz. Die Chronik führt nur exakt
gebundene Paare aus Creditgewinn und Recurring-Credit-Abnahme zusammen; andere
Counterwechsel bleiben unverändert sichtbar. Die Auszahlung erscheint aus
beiden Betrachterperspektiven als ein Eintrag, und die lokalisierte
Singularform lautet korrekt „1 Credit“.

Die fokussierten Web-Tests liefen mit 227 bestandenen Tests, der fokussierte
Engine-Test mit 36 bestandenen Tests. Der Shared-Typecheck ist grün. Die
breiteren Engine- und Web-Typechecks erreichen weiterhin je einen bereits
unabhängig vorhandenen Fixture-Fehler in
`src/index-tests/originalset/ice-breakers.test.ts:1239` beziehungsweise
`app/ai-turn-plan-comparison-ui.test.ts:67`; beide liegen außerhalb dieses
Pakets und wurden nicht verändert.
