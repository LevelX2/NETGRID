---
activityId: act-2026-06-07-ai-runner-contest-reserve-implementation
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-runner-contest-reserve-contract
resultArtifacts: []
checks: []
---

# Runner-Contest-Reserve in EconomyPosture und TacticalPlans anwenden

## Ziel

Die Runner-KI soll Aktionen, Runs und Installationen gegen eine dynamische Creditreserve bewerten. Sie soll im Midgame und bei Remote-Score-Gefahr häufiger Credits halten oder aufbauen, wenn eine Ausgabe sie unter eine relevante Contest-, Breaker- oder Development-Reserve drücken würde.

## Kontext und Quellen

- Nutzerbemerkung vom 2026-06-07: Ein Runner, der nach teuren Aktionen bei null Credits steht, ist aus Korp-Sicht verwundbar; dadurch kann die Korp eine Agenda in einem Remote durchbringen, bevor der Runner wieder genug Geld für Eisbrecher und Run-Kosten hat.
- Eingefügter Analyse-Text vom 2026-06-07: `RunnerCreditReservePolicy` soll `creditsAfterAction`, `fallsBelowContestReserve`, `fallsBelowBreakerReserve`, `createsCorpScoreWindow` und Reserve-Übersteuerungen bewerten.
- Zusatzgedanke vom 2026-06-07: Die Reserve darf nicht dazu führen, dass der Runner unter Reserve schematisch nur Credits nimmt. Günstige, nicht known-low Druckfenster müssen als Folgefrage erhalten bleiben.
- Vertrags-/Kalibrierungspaket: `act-2026-06-07-ai-runner-contest-reserve-contract`.
- Folgepaket für Pressure/Variation: `act-2026-06-07-ai-runner-pressure-budget-variation`.
- Relevante erledigte Pakete:
  - `docs/activities/done/act-2026-06-07-runner-credit-base-planning.md`
  - `docs/activities/done/act-2026-06-07-runner-development-tactical-mapping.md`
- Voraussichtliche Codeanker:
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/index.ts`

## Scope

- `RunnerEconomyPosture`, `RunnerCreditBasePlan` oder ein enges Hilfsmodul um die im Vertrag festgelegte Contest-Reserve erweitern.
- `contestReserve` erhöhen, wenn ein sichtbarer Remote-Score-Threat besteht, die Korp siegnah ist oder die Runner-Coverage grundsätzlich vorhanden ist, aber Credits fehlen.
- `breakerUseReserve` berücksichtigen, wenn installierte Breaker relevante Runs nur bei ausreichender Creditbasis ermöglichen.
- `developmentReserve` berücksichtigen, wenn nützliche eigene Handkarten wegen Credits blockiert sind oder eine teure Aktion weitere Handentwicklung verhindert.
- Runs, Installationen und teure Aktionen mit einem Malus versehen, wenn `creditsAfterAction` unter `desiredCreditReserve` fällt.
- Bei Remote-Score-Gefahr und Unterschreiten von `contestReserve` einen stärkeren Malus anwenden.
- Malus reduzieren oder aufheben, wenn die Aktion selbst hohen unmittelbaren Payoff hat:
  - bekannte Agenda,
  - akuter Remote-Contest,
  - Survival-/Tag-/Damage-/Trace-Notfall,
  - Aktion löst den aktiven Blocker direkt.
- TacticalGoals/Plans so kalibrieren, dass `runner.build_economy_base`, `runner.maintain_credit_and_hand_buffer` oder gleichwertige vorhandene Ziele steigen, wenn der Runner unter Reserve ist oder eine geplante Ausgabe die Reserve brechen würde.
- Reserve-Malus als weiche Bewertung implementieren: Eine Action unter Reserve braucht stärkeren Payoff, wird aber nicht allein wegen der Reserve automatisch ausgeschlossen.
- Keine bestehende günstige, nicht known-low Central-Pressure-Bewertung pauschal entfernen; genaue ProbeAllowance und Variation bleiben dem Folgepaket vorbehalten.
- Finale Aktion bleibt immer aus `input.legalActions`.

## Nicht im Scope

- Keine Engine-Änderung.
- Keine LegalAction-Änderung oder synthetische Aktionserzeugung.
- Keine neue Kartensemantik, keine neue Kartenfreigabe und keine Taktiksignal-Migration.
- Keine Hidden-Info-Ausweitung.
- Keine pauschale Run-Vermeidung und keine starre Mindestcredit-Regel.
- Keine vollständige `RunnerPressureBudget`-/ProbeAllowance-Logik und keine seeded Variation; dafür gibt es `act-2026-06-07-ai-runner-pressure-budget-variation`.
- Keine Browser-/Web-UI-Arbeit außer bereits vorhandenen AI-Debugfacts, falls sie für die Implementierung nötig sind.

## Akzeptanzkriterien

- [ ] Midgame-Fall: Runner hat 6 Credits, Remote-Score-Threat ist sichtbar, bekannter oder konservativ geschätzter Contest-Pfad kostet etwa 5, eine Installation würde auf 2 Credits fallen -> Installation wird abgewertet und Economy/Reserve-Aufbau bevorzugt.
- [ ] Setup-Fall: Runner hat 8 Credits, nützliche Handkarte kostet 3, Reserve bleibt bei etwa 5 -> Installation bleibt erlaubt.
- [ ] Low-Credit-Fall: Runner hat 0 bis 2 Credits und kein hoher Run-Payoff liegt vor -> `build_economy_base`/`gain_credit` oder gleichwertige Economy-Aktion wird bevorzugt.
- [ ] High-Payoff-Fall: Bekannte Agenda auf F&E oder vergleichbarer unmittelbarer Payoff darf die Reserve verletzen.
- [ ] Soft-Reserve-Fall: Eine Reserve-Unterschreitung wirkt als Malus, erzeugt aber keine harte Sperre für side-sicher gute Runs oder blocker-lösende Aktionen.
- [ ] Remote-Contest-Fall: Runner kann mit mehr Credits einen sichtbaren Remote-Score-Threat contesten -> `gain_credits_first` oder gleichwertige Creditbase-Entscheidung steigt.
- [ ] Low-Value-Run-Fall: Ein Run ohne hohen Payoff, der den Runner unter Reserve drücken würde, wird abgewertet.
- [ ] Jede finale Runner-Action stammt aus `input.legalActions`.

## Umsetzungshinweise

- Vor Codeänderung prüfen, welche Felder aus `RunnerEconomyPosture` und `RunnerCreditBasePlan` bereits vorhanden sind; bevorzugt bestehende Strukturen erweitern.
- `spendingWouldDropBelowReserve` sollte nicht nur für Runs, sondern auch für Install-/Play-/Ability-Aktionen nutzbar sein.
- Debug-Evidence soll knapp und redigiert bleiben, zum Beispiel `contestReserve`, `desiredCreditReserve`, `reserveReasons`, `creditReservePenalty`, `why_economy_over_run_or_install` und `why_spend_allowed_despite_reserve`.
- Passende Checks nach Umsetzung:
  - `corepack pnpm --filter @netgrid/ai exec tsc --noEmit`
  - fokussierte Vitest-Dateien für `runner-run-target-evaluation`, `runner-tactical-goals`, `tactical-plans` und betroffene Golden-Debug-Tests
  - `git diff --check`

## Ergebnisnotiz

Noch offen.
