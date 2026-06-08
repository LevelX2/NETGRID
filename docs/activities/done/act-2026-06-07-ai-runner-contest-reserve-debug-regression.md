---
activityId: act-2026-06-07-ai-runner-contest-reserve-debug-regression
status: done
kind: fix
area: ai
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-runner-contest-reserve-implementation
resultArtifacts:
  - packages/ai/src/tactical-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/runner-tactical-goals.test.ts
  - packages/ai/src/runner-golden-deck-debug.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- src/runner-tactical-goals.test.ts src/runner-golden-deck-debug.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# Runner-Contest-Reserve debuggen und gegen Regressionen absichern

## Ziel

Die neue Contest-Reserve-Logik soll in AI-Debugfacts nachvollziehbar und durch fokussierte Regressionen gegen Rückfälle abgesichert sein. Spätere Playtests sollen erkennen können, ob die Runner-KI Credits aufbaut, weil sie eine Reserve halten muss, oder ob sie einen Reservebruch wegen hohem Payoff bewusst erlaubt.

## Kontext und Quellen

- Nutzerbemerkung vom 2026-06-07: Aus Runner-Sicht muss im fortgeschrittenen Spielstatus eine Reserve bleiben, damit die Korp nach einem teuren Runner-Zug nicht ungefährdet scoren kann.
- Zusatzgedanke vom 2026-06-07: Die Reserve darf nicht als hartes "immer Credits nehmen"-Schema debuggt oder getestet werden; sie muss erklärbar machen, wann ein guter Payoff Reservebrüche erlaubt.
- Umsetzungspaket: `act-2026-06-07-ai-runner-contest-reserve-implementation`.
- Folgepaket für Probe-/Pressure-Fenster: `act-2026-06-07-ai-runner-pressure-budget-variation`.
- Bestehendes Debug-/Regression-Vorgängerpaket: `docs/activities/done/act-2026-06-07-runner-development-debug-regression.md`.
- Voraussichtliche Testanker:
  - `packages/ai/src/runner-run-target-evaluation.test.ts`
  - `packages/ai/src/runner-tactical-goals.test.ts`
  - `packages/ai/src/tactical-plans.test.ts`
  - `packages/ai/src/runner-golden-deck-debug.test.ts`

## Scope

- Redigierte Debugfacts für die Reserve-Entscheidung ergänzen oder vorhandene Facts prüfen:
  - `currentCredits`,
  - `desiredCreditReserve`,
  - `contestReserve`,
  - `reserveReasons`,
  - `spendingWouldDropBelowReserve`,
  - `creditReservePenalty`,
  - `why_economy_over_run_or_install`,
  - `why_spend_allowed_despite_reserve`.
- Debug prüfen, dass Reserveentscheidungen nicht als harte Sperre erscheinen, sondern als Malus/Tradeoff mit möglichen Overrides.
- Regressionen für die wichtigsten Reserve-Situationen ergänzen:
  - Midgame Remote-Score-Threat, Installation würde unter `contestReserve` fallen.
  - Gute Setupkarte bleibt erlaubt, wenn Reserve nach Zahlung gehalten wird.
  - 0 bis 2 Credits ohne starken Payoff bevorzugt Creditbase.
  - Bekannte Agenda oder akuter Contest darf Reserve verletzen.
  - Low-Value-Run unter Reserve wird abgewertet.
  - Finale Action bleibt LegalAction-only.
- Sicherstellen, dass Debugfacts nur redigierte Counts, Gründe, Rollen und Reservewerte enthalten.

## Nicht im Scope

- Keine neue Bewertungslogik außer minimal nötiger Debug-Anbindung.
- Keine Änderung von Engine, `LegalActions`, `applyAction`, Replay, StateHash oder Zufallspfaden.
- Keine vollständige Browser-E2E- oder Playtest-Automation.
- Keine Ausgabe verdeckter Korp-Karten, vollständiger Hand-/Decklisten, `cardInstances`, privater Snapshot-IDs, `privatePayload`, FullState oder lokaler Pfade.

## Akzeptanzkriterien

- [ ] DecisionDebug oder gleichwertige AI-Debugfacts erklären, warum Economy/Reserve-Aufbau eine Ausgabe, Installation oder einen Run schlägt.
- [ ] Debugfacts erklären auch, warum ein hoher Payoff eine Reserveverletzung erlauben durfte.
- [ ] Debugfacts machen sichtbar, dass Reserve-Unterschreitung keine pauschale Run-Sperre ist.
- [ ] Regressionen decken Remote-Score-Threat, Low-Credit, Setup-Allowed, High-Payoff-Override und Low-Value-Run-Reservebruch ab.
- [ ] Redaction-Checks bestätigen, dass keine Hidden-Info oder privaten Daten in Debugfacts landen.
- [ ] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Wenn die Implementation bereits alle Regressionen enthält, dieses Paket darf als Review-/Nachhärtungspaket abgeschlossen werden und muss nur fehlende Debug-/Redaction-Tests ergänzen.
- Golden-Debug-Tests sind besonders wertvoll, weil die Reserve-Entscheidung sonst in Playtests schwer sichtbar ist.
- Keine neue öffentliche UI-Fläche bauen; vorhandene DecisionDebug-/AI-Debug-Pfade reichen.

## Ergebnisnotiz

Abgeschlossen. Die redigierte Runner-Economy-Posture-Debugfläche enthält jetzt konkrete Reservewerte, Reservegründe, abgeleiteten Reserve-Malus sowie Erklärfacts für `why_economy_over_run_or_install` und `why_spend_allowed_despite_reserve`. Der Debugausschnitt für Economy-Posture wurde begrenzt erweitert, damit diese Facts im DecisionDebug sichtbar bleiben. Regressionen sichern Remote-Score-Threat-Reserve, erlaubten Setup-Spend, PressureBudget-Probe-Override und Redaction ab; es wurde keine Reservebewertung oder Action-Auswahl absichtlich geändert.
