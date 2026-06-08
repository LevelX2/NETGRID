---
activityId: act-2026-06-08-ai-bank-investment-commitment
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/semantic-ai-runtime-cutover.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts -t bank
---

# Runner-KI: Bank-Investment-Commitment für Broker-artige Karten

## Ziel

Die Runner-KI soll `Broker` und vergleichbare Bankkarten nicht nur als einzelne installierte Economy-Aktion bewerten, sondern als mehrzügiges Investment-Commitment fortschreiben. Wenn die KI eine Bankkarte installiert, soll sie danach plausibel entscheiden, ob sie die Bank aufbaut, hält, auszahlt oder wegen eines besseren Plans bewusst abandont.

## Kontext und Quellen

- Eingefügter Nutzertext vom 2026-06-08: Die KI installierte `Broker`, nutzte die Karte danach aber nicht zum Aufladen. Der Fehler ist wahrscheinlich ein Planbruch nach der Installation, nicht fehlende Grundsemantik.
- Erledigtes Vorgängerpaket `docs/activities/done/act-2026-05-18-runner-ai-resource-economy-plan.md`: installierte Runner-Economy wird generisch klassifiziert; `Broker Load` und `Broker Take` sind als Pool-Aufbau/-Auszahlung abgedeckt.
- Erledigtes Vorgängerpaket `docs/activities/done/act-2026-05-22-runner-ai-broker-pool-horizon.md`: Broker-Pool-Aufbau nutzt bereits einen kleinen sichtbaren Planungshorizont.
- AI-PLAN-6 aus `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md` modelliert Bank-/Broker-Werkzeuge als mehrzügige Planressourcen.
- `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md` bestätigt die Umsetzung von Bank-/Broker-Werkzeugen und Candidate-Mapping, aber der aktuelle Playtest-Fund zeigt eine verbleibende Lücke bei Install-Commitment und Planfortschreibung.

## Scope

- Prüfen, wie `EconomyBankTool`, `runner.build_credit_bank`, `runner.cash_out_credit_bank`, PlanMemory und aktuelle `LegalActions` nach einer Bankkarten-Installation zusammenspielen.
- Ein `RunnerBankInvestmentCommitment` oder eine gleichwertige bestehende Planfortschreibung ergänzen bzw. schärfen.
- Install von `Broker`-artigen Karten nur hoch bewerten, wenn:
  - EconomyPosture/Creditbase-Aufbau relevant ist,
  - kein akuter Remote-Score-Threat oder bekannter High-Payoff-Run anliegt,
  - die KI voraussichtlich mindestens eine spätere Build-Bank-Action nutzen will.
- Nach Installation einer leeren Bankkarte den ersten Bankaufbau in stabiler Lage deutlich bevorzugen, ohne dringende Runs, Survival/Tag/Damage, Breaker-/MU-/Handentwicklung oder sehr hohe Access-Payoffs zu blockieren.
- Nach einer ersten Aufladung eine zweite Aufladung weiter prüfen, aber schwächer gewichten als die erste.
- Cashout nur dann bevorzugen, wenn ein konkreter aktiver Plan wegen Credits blockiert ist, Auszahlung eine Finanzierungsschwelle erreicht oder die CreditReservePolicy kritisch unterschritten ist.
- Eine länger nicht genutzte Bankkarte bewusst als `abandoned` oder vergleichbar markieren, statt weiter einen toten Plan mitzuschleppen.
- Redigierte Debug-/Evidence-Felder ergänzen, z. B. `bankCommitmentActive`, `bankSource`, `bankStoredCredits`, `desiredBankTarget`, `buildBankPriority`, `cashOutPriority`, `bankCommitmentStatus`, `why_bank_build_over_run`, `why_run_over_bank_build`, `why_broker_install_deferred`, `why_cashout_now`.
- Fokussierte AI-Regressionen für Installation, frisch installierten leeren Broker, Low-Value-Run-Konkurrenz, Cashout bei FundingNeed und Override-Situationen ergänzen.

## Nicht im Scope

- Keine Engine-Änderung, keine LegalAction-Erzeugungsänderung, keine Änderung an `applyAction`, Replay, StateHash oder Zufallspfad.
- Keine neue Strategy-ID, sofern vorhandene Bank-/Economy-Pläne erweitert werden können.
- Keine pauschale Pflicht, `Broker` immer zu installieren, immer aufzuladen oder nach Aufbau sofort auszuzahlen.
- Keine Hidden-Info-Ausweitung und keine Nutzung verdeckter gegnerischer Karten.
- Keine UI-Änderung an der Wartungs-/Trace-Anzeige, außer bestehende Debugdaten müssen für Tests redigiert zugänglich sein.
- Keine Kartenfreigabe oder Änderung am Kartenpool.

## Akzeptanzkriterien

- [x] Die KI kann nach einer Bankkarten-Installation side-sicher ein aktives Bank-Investment-Commitment ableiten oder dokumentiert eng, welcher bestehende Planstatus diese Rolle übernimmt.
- [x] `Broker`-Install wird abgewertet, wenn die KI keinen plausiblen Folgeplan zum Aufladen/Bankaufbau hat.
- [x] Frisch installierter leerer `Broker` bevorzugt in stabiler Lage eine Build-Bank-Action gegenüber Low-Value-Runs, generischem Draw oder irrelevanten Installs.
- [x] Bei akutem Remote-Score-Threat, bekannter Agenda, Survival/Tag/Damage-Notfall, dringender Breaker-/MU-/Handentwicklung oder sehr hohem Run-Payoff darf der Bankaufbau übersteuert werden.
- [x] `cash_out_credit_bank` wird nur bei konkretem FundingNeed, kritischer Reserve oder klarer Finanzierungsschwelle bevorzugt.
- [x] Kein sinnloses Cashout direkt nach Aufbau ohne FundingNeed.
- [x] Die gewählte finale Action stammt weiterhin aus `input.legalActions`.
- [x] Debug/Evidence bleibt redigiert und enthält keine Hidden-Info.
- [x] Die neuen Tests bauen auf den bestehenden Broker-/DecisionDebug-/TacticalPlan-Regressionen auf, statt sie zu duplizieren.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/deck-capabilities.ts`
  - `packages/ai/src/semantic-ai-runtime-cutover.ts`
  - `packages/ai/src/tactical-plans.test.ts`
  - `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- Bestehende erledigte Broker-Pakete nicht zurückdrehen. Dieses Paket ist ein Follow-up auf Install-Commitment und Planfortschreibung, nicht auf die reine LegalAction-Bewertung von `Broker Load`/`Broker Take`.
- Bevorzugt vorhandene `EconomyBankTool`- und Candidate-Semantik nutzen. Label-Heuristiken sollen nur konservativer Fallback bleiben.
- Wenn sich bei der Analyse zeigt, dass das Problem nur in einem Test- oder Profil-Fixture liegt, klein fixen und keine breite Bank-Architektur neu schneiden.

## Ergebnisnotiz

Umgesetzt in der semantischen Runner-Runtime:

- Neue side-sichere Bank-Commitment-Bewertung aus `input.legalActions`, eigener sichtbarer Rig-/Hand-View und vorhandener TacticalPlan-Memory.
- Build-, Cashout-, Install- und Run-Konkurrenz bekommen redigierte Debug-/Score-Evidence mit `bankCommitmentActive`, `bankSource`, `bankStoredCredits`, `desiredBankTarget`, `buildBankPriority`, `cashOutPriority`, `bankCommitmentStatus`, `why_bank_build_over_run`, `why_run_over_bank_build`, `why_broker_install_deferred` und `why_cashout_now`.
- Erster Broker-Load wird in stabiler Lage vor Low-Value-Run/generischem Draw priorisiert; zweite Aufladung bleibt schwächer.
- Broker-Install ohne plausiblen späteren Load wird abgewertet.
- Cashout ohne FundingNeed, kritische Reserve oder Bank-Schwelle wird semantisch ausgeschlossen; vorhandener Direkt-nach-Build-Schutz bleibt erhalten.
- Bekannte Agenda-/Remote-Score-/High-Payoff-Runs dürfen ein aktives Bank-Build-Commitment übersteuern.

Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Zufalls- oder UI-Änderung.
