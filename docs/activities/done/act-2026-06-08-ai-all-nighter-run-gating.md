---
activityId: act-2026-06-08-ai-all-nighter-run-gating
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "All-Nighter"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts -t "All-Nighter"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts
  - git diff --check
---

# All-Nighter-Run-Gating für Runner-KI

## Ziel

Die Runner-KI soll `All-Nighter` nur spielen und den optionalen Folge-Run nur wählen, wenn die dadurch ausgelösten Runs nach den normalen Run-Payoff-, Coverage- und Creditreserve-Regeln plausibel sind. Wenn kein sinnvoller Run-Kandidat existiert, soll die Karte deutlich abgewertet und der optionale Zusatzlauf abgelehnt werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-06-08: Runner beziehungsweise Runner-KI spielte `All-Nighter`, machte danach Runs, wählte aber Ziele, bei denen kein Eisbrecher, zu wenig Geld oder kein erkennbarer Payoff vorhanden war.
- `packages/shared/src/index.ts`: `onr_v1_076_all-nighter` kostet 0 und hat den Text `Make a run; whether or not that run is successful, you may then make another run.`
- `packages/engine/src/card-implementations/onr-v1/runner/preps/all-nighter.ts`: Engine-Resolver nutzt `make_run` mit `followupRunOnEnd: "optional"`.
- `data/ai/ai-card-hints-active.json`: `All-Nighter` ist `ai_supported`, hat `roles` wie `bonus_run`/`run_event` und Effekte `make_run`, `followup_run`, `multi_run_sequence`.
- Verwandte offene Pakete:
  - `act-2026-06-07-ai-run-payoff-hints-consumer`
  - `act-2026-06-07-ai-runner-contest-reserve-implementation`
  - `act-2026-06-07-ai-runner-pressure-budget-variation`
  - `act-2026-06-07-ai-run-payoff-regression-coverage`

## Scope

- `All-Nighter`-Ausspielen aus der Hand gegen die normale Runner-Run-Zielbewertung prüfen statt nur den 0-Credit-Event-Tempo-Wert zu sehen.
- Für karteninduzierte Runs eine enge Gate-/Scoring-Schicht ergänzen oder wiederverwenden:
  - mindestens ein plausibler erster Run-Kandidat,
  - Kosten-/Creditreserve-Prüfung,
  - Breaker-/Coverage-Einschätzung aus side-sicheren Runner-Informationen,
  - Payoff gegen bekannte Agenda, Remote-Contest, HQ/F&E/Archiv-Druck oder Unknown-Probe,
  - Dämpfung bei known-low, known-no-current-payoff, fehlender Coverage oder unbezahlbarem Pfad.
- Den optionalen Folge-Run nach dem ersten Run erneut bewerten; wenn kein sinnvoller Kandidat übrig ist, soll die KI die optionale Folgeaktion ablehnen.
- Das Muster so schneiden, dass ähnliche Multi-Run-Events später mit derselben Logik angeschlossen werden können, ohne Protheus- oder weitere Kartenfreigaben mitzunehmen.
- Redigierte DecisionDebug-/Evidence-Hinweise ergänzen, zum Beispiel `multiRunEvent:no_plausible_first_run`, `multiRunEvent:followup_declined_no_payoff` oder `multiRunEvent:allowed_high_payoff`.

## Nicht im Scope

- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Zufallspfad-Änderung.
- Keine Erzeugung neuer Run-Aktionen; finale Aktionen müssen weiter aus `input.legalActions` stammen.
- Keine Hidden-Info-Ausweitung über die eigene Runner-PlayerView und bestehende side-sichere Kenntnisse hinaus.
- Keine pauschale Runner-KI-Neugewichtung und kein globales Run-Verbot bei wenig Credits.
- Keine Protheus-AI-Freigabe und keine neue Deck-/Formatlegalität.
- Keine UI- oder Browser-E2E-Pflicht, solange die Änderung AI-intern bleibt.

## Akzeptanzkriterien

- [x] Low-Credit-/No-Coverage-Fall: Runner hat `All-Nighter`, aber keinen plausiblen erreichbaren Run und zu wenig Credits oder keine passende Coverage -> `All-Nighter` verliert gegen Economy, Draw, Search, Install oder gleichwertige Setup-Aktion.
- [x] High-Payoff-Fall: Ein side-sicher bekannter oder stark plausibler Payoff, etwa bekannte Agenda, akuter Remote-Contest oder starker HQ/F&E-Payoff, darf `All-Nighter` trotz Kosten-/Reservebelastung erlauben.
- [x] Folge-Run-Fall: Nach dem ersten Run wird die optionale All-Nighter-Folgeaktion neu bewertet; ohne sinnvollen zweiten Run wählt die KI keinen schlechten Zusatzlauf.
- [x] Normale Run-Regeln bleiben führend: All-Nighter-Runs verwenden dieselbe LegalAction- und Zielbewertungsbasis wie reguläre Runner-Runs.
- [x] Known-low, known-no-current-payoff, unbezahlbare Pfade und fehlende Coverage dämpfen sowohl den ersten als auch den optionalen zweiten Run.
- [x] Debug-/Evidence-Daten erklären die Abwertung oder Erlaubnis redigiert und ohne verdeckte Korp-Karten, private Payloads oder FullState-Leaks.
- [x] Bestehende All-Nighter-Engine-Smokes bleiben unverändert grün.
- [x] Fokussierte AI-Regressionen decken mindestens Ausspielen-abwerten, Ausspielen-erlauben und Folge-Run-ablehnen ab.

## Umsetzungshinweise

- Voraussichtliche Startpunkte: `packages/ai/src/runner-run-target-evaluation.ts`, `packages/ai/src/runner-tactical-goals.ts`, `packages/ai/src/tactical-plans.ts`, `packages/ai/src/index.ts` und passende AI-Testdateien.
- Wenn `act-2026-06-07-ai-run-payoff-hints-consumer` oder `act-2026-06-07-ai-runner-contest-reserve-implementation` vorher umgesetzt werden, deren Bewertungsbausteine wiederverwenden statt eine zweite Run-Wertlogik aufzubauen.
- Wenn diese Activity zuerst umgesetzt wird, den Fix eng auf karteninduzierte Run-Aktionen begrenzen und größere Reserve-/Payoff-Kalibrierung in den bestehenden Paketen lassen.
- Passende Checks nach Umsetzung:
  - `corepack pnpm --filter @netgrid/ai exec tsc --noEmit`
  - fokussierte Vitest-Dateien für Run-Zielbewertung, TacticalGoals, TacticalPlans und All-Nighter-Entscheidungen
  - bestehende Engine-Smokes für All-Nighter, sofern der Umsetzungspfad sie berührt
  - `git diff --check`

## Ergebnisnotiz

Umgesetzt in `packages/ai/src/index.ts`: All-Nighter-`play_event`-Aktionen und `bonusRunNoClick`-Folgeruns werden über ein `RunnerMultiRunEventAssessment` gegen `evaluateRunnerRunTargets` bewertet. Die Gate-Logik nutzt dieselbe side-sichere Ziel-, Payoff-, Coverage-, Pfad- und Creditreserve-Basis wie reguläre Runner-Runs. No-Coverage/No-Payoff-Ziele werden ausgeschlossen; hohe Payoffs oder plausible Unknown-Probes bleiben erlaubt. Debug/Evidence enthält redigierte `multiRunEvent:*`-Fakten, zum Beispiel `multiRunEvent:no_plausible_first_run`, `multiRunEvent:allowed_high_payoff` und `multiRunEvent:followup_declined_no_payoff`.

Abgesichert in `packages/ai/src/index.test.ts`: All-Nighter verliert bei blockiertem Ziel gegen Economy, All-Nighter ist bei akutem Remote-Payoff erlaubt, und ein schlechter Bonus-Run wird nicht gewählt. Der bestehende Engine-Smoke für All-Nighter bleibt grün.
