---
activityId: act-2026-06-07-runner-development-debug-regression
status: done
kind: fix
area: ai
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-runner-development-tactical-mapping
resultArtifacts:
  - packages/ai/src/tactical-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/runner-golden-deck-debug.test.ts
checks:
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-golden-deck-debug.test.ts'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec tsc --noEmit'
  - 'PASS: corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/runner-golden-deck-debug.test.ts'
  - 'PASS: git diff --check'
---

# Runner-Handentwicklung und Creditbase redigiert debuggen und absichern

## Ziel

Die neue Runner-Entwicklungslogik soll über redigierte Debugfacts nachvollziehbar und durch fokussierte Regressionen gegen Rückfälle abgesichert werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-07: Ohne Sichtbarkeit auf Zwischenziele bleibt schwer erkennbar, ob die KI Handkarten, Creditaufbau und Runs sinnvoll abwägt.
- Vorgängerpaket: `act-2026-06-07-runner-development-tactical-mapping`.
- Bestehende AI-STRAT-Debugfacts zeigen bereits StrategicIntent, RunTargetEvaluation, EconomyPosture und TacticalGoals.
- Relevante Codeanker:
  - `packages/ai/src/index.ts`
  - `packages/ai/src/runner-golden-deck-debug.test.ts`
  - `packages/ai/src/runner-tactical-goals.test.ts`
  - `packages/ai/src/tactical-plans.test.ts`

## Scope

- Redigierte Debugfacts ergänzen, sofern durch Vorgängerpakete verfügbar:
  - `handDevelopmentTopCandidates`,
  - `creditBasePlan`,
  - `usefulHandCardsBlockedByCredits`,
  - `selectedDevelopmentGoal`,
  - Defer-/Override-Gründe.
- Debugausgabe knapp halten und nur side-sichere Runner-Information zeigen.
- Fokussierte Regressionen bündeln:
  - 0 Credits, gute teure Handkarte, kein hoher Run-Payoff -> Credit/Economy.
  - 5 Credits, Access-Payoff in Hand, kein Notfall -> Install-/Setupziel.
  - MU-Druck plus Memory-Hardware -> Memory-Support.
  - Defensekarte ohne Bedrohung -> zurückstellen.
  - Remote Score Threat oder bekannter Agenda-Zugriff darf Installplan übersteuern.
  - Finale Entscheidung immer aus `input.legalActions`.
- Falls passende Golden-Deck-Fixtures existieren, ein Blink- oder alternatives Runner-Golden-Deck um HandDevelopment-/Creditbase-Fälle ergänzen.

## Nicht im Scope

- Keine neue Bewertungslogik außer minimaler Debug-Anbindung.
- Keine normale Web-UI-Politur.
- Keine vollständige Playtest-Automation oder neuer Browser-E2E-Gate.
- Keine vollständige Decklisten-, Snapshot- oder Gegner-Hidden-Info-Ausgabe.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.

## Akzeptanzkriterien

- [x] DecisionDebug oder AI-Debugfacts erklären die ausgewählte Development-/Creditbase-Entscheidung redigiert.
- [x] Debugfacts enthalten keine vollständige Deckliste, Deckreihenfolge, private Snapshot-ID, `cardInstances`, `privatePayload`, gegnerische Hidden-Info, FullState oder lokale Pfade.
- [x] Die wichtigsten Playtest-Beobachtungen aus dem Nutzerbefund sind als fokussierte Regressionen abgedeckt.
- [x] Existing AI-STRAT-Golden-Deck-Tests bleiben grün.
- [x] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Dieses Paket soll nicht heimlich die Scoringlogik nachkalibrieren. Wenn Tests eine fachliche Lücke zeigen, kleine Folgeactivity anlegen.
- Debug soll erklären, warum eine Handkarte gespielt, finanziert oder zurückgestellt wurde.
- Für öffentliche Payloads und Logs gelten die bestehenden Redaction-Grenzen.

## Ergebnisnotiz

Abgeschlossen. `evaluateTacticalPlans` liefert jetzt redigierte `runnerHandDevelopmentEvaluationsUsed` aus `redactedRunnerHandDevelopmentFacts`. Die DecisionDebug-TacticalPlan-Sektion zeigt diese Facts als `runner_hand_development_used:*` und ergänzt bei ausgewählten Development-Plänen `selected_development_goal:*` aus bereits redigierter Plan-Evidence. Creditbase-Facts waren durch `runnerEconomyPostureUsed` vorhanden und werden im Golden-Debug-Test mitgeprüft.

Die Debugfacts nennen Rollen, Availability, Need, Fit, Priority, MissingCredits und Defer-Gründe, aber keine Deckliste, Deckreihenfolge, privaten Snapshots, `cardInstances`, `privatePayload`, FullState oder lokale Pfade. Der neue Golden-Debug-Test prüft eine Access-Payoff-Handkarte, die ausgewählte Install-Aktion, HandDevelopment-Facts, `allow_setup_spend` im Creditbase-Plan und Redaction. Die vorher ergänzten fokussierten Regressionen decken Credit/Economy, Access-Payoff, Memory-Support, Defense-Defer, Remote-Score-Threat-Override und LegalAction-Herkunft weiter ab.
