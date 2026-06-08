---
activityId: act-2026-06-08-ai-stabilize-golden-deck-tests
status: done
kind: fix
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-golden-deck-debug.test.ts
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# AI-STABILIZE-1: Golden-Deck-Fails vor Strukturarbeit klären

## Ziel

Der aktuelle rote `@netgrid/ai`-Teststatus soll vor jeder größeren Strukturverschiebung fachlich geklärt und stabilisiert werden. Danach muss klar sein, ob die beobachteten `run-hq`-Entscheidungen korrekt sind oder eine Run-Zentrierungs-Regression in Runner-Semantic-/TacticalPlan-Pfaden zeigen.

## Kontext und Quellen

- `docs/reviews/ai/ai-player-code-structure-analysis-2026-06-07.md`
- Nutzerbewertung vom 2026-06-08 aus dem eingefügten Text: Erst rote Golden-Deck-Tests klären, dann Strukturpfad beginnen.
- Aktueller Analysebefund: `corepack pnpm --filter @netgrid/ai typecheck` war grün, `corepack pnpm --filter @netgrid/ai test` war rot.
- Betroffene Testdatei: `packages/ai/src/runner-golden-deck-debug.test.ts`
- Fehlfälle aus dem Review:
  - Erwartet `install-access-card`, erhalten `run-hq`.
  - Erwartet `gain-credit`, erhalten `run-hq`.
- Nahe bestehende Pakete:
  - `docs/activities/done/act-2026-06-07-runner-development-debug-regression.md`
  - `docs/activities/inbox/act-2026-06-07-ai-runner-contest-reserve-debug-regression.md`

## Scope

- Die zwei fehlschlagenden Golden-Deck-Tests reproduzieren und pro Fall fachlich entscheiden:
  - Testfixture oder Erwartung ist veraltet.
  - Oder `run-hq` ist eine echte Run-Zentrierungs-Regression.
- Bei echter Regression gezielt RunnerHandDevelopment, EconomyPosture, TacticalGoals oder Mapping so kalibrieren, dass Low-Value-/nicht priorisierte HQ-Probes Setup oder Creditbase nicht ohne Payoff schlagen.
- Bei veralteter Erwartung den Test begründet anpassen und im Ergebnis dokumentieren.
- Bestehende Debugfacts nutzen oder minimal ergänzen, wenn die Entscheidung sonst nicht nachvollziehbar ist.

## Nicht im Scope

- Keine Strukturverschiebung aus `packages/ai/src/index.ts` oder `packages/ai/src/index.test.ts`.
- Keine neue Strategy-ID, keine neuen Taktiksignale und keine neue Kartensemantik.
- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.
- Keine breite Runner-KI-Rekalibrierung außerhalb der zwei Golden-Deck-Fails.
- Keine Web-UI- oder Browser-E2E-Arbeit.

## Akzeptanzkriterien

- [x] Die zwei im Review genannten Golden-Deck-Fails sind reproduziert oder als bereits behoben belegt.
- [x] Pro Fail ist dokumentiert, ob `run-hq` fachlich korrekt war oder korrigiert wurde.
- [x] `packages/ai/src/runner-golden-deck-debug.test.ts` ist grün.
- [x] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [x] `corepack pnpm --filter @netgrid/ai typecheck` ist grün.
- [x] `git diff --check` ist grün.

## Umsetzungshinweise

- Dieses Paket ist absichtlich vorgelagert: Refactorings dürfen nicht auf einem unklar roten Ausgangszustand aufsetzen.
- Wenn die Analyse weitere konkrete Run-Zentrierungs-Fälle zeigt, kleine Folge-Activities anlegen statt dieses Paket zu vergrößern.
- Bestehende offene Contest-/Reserve- und Self-Damage-Pakete nicht nebenbei miterledigen, außer sie sind direkt Ursache eines der zwei Golden-Deck-Fails.

## Ergebnisnotiz

Reproduziert: Die zwei bekannten Fails in `packages/ai/src/runner-golden-deck-debug.test.ts` traten weiterhin auf (`run-hq` statt `install-access-card`, `run-hq` statt `gain-credit`).

Befund: `run-hq` war in beiden Fixtures fachlich nicht korrekt. Es handelte sich um eine Semantic-Run-Zentrierungs-Regression: generische `start_run`-Priorität plus HQ-/Free-Server-Komponenten überstimmten gemappte TacticalPlans für Handentwicklung beziehungsweise Creditbase, obwohl `evaluateRunnerRunTargets` den HQ-Run nur als `run_if_free` oder `gain_credits_first` bewertete.

Korrektur in `packages/ai/src/index.ts`: Semantic Runtime berücksichtigt für `start_run` jetzt eine negative `runner_run_target_semantic_guidance`-Komponente aus `evaluateRunnerRunTargets`, wenn der Run nicht `run_now` ist. Dadurch bleiben echte Payoff-Runs ungedämpft, während `run_if_free`, `setup_first`, `gain_credits_first`, `find_breaker_first` und `do_not_run_now` nicht mehr klare Setup-/Economy-Pläne überstimmen.

Ergebnis: `runner-golden-deck-debug.test.ts`, Typecheck, `@netgrid/ai test` und `git diff --check` sind grün.
