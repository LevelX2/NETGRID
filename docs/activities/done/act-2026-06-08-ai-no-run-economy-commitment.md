---
activityId: act-2026-06-08-ai-no-run-economy-commitment
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
  - corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
---

# Runner-KI: No-Run-Economy-Commitment für Top Runners' Conference

## Ziel

Die Runner-KI soll `Top Runners' Conference` und vergleichbare Karten mit Start-of-turn-Economy plus Run-Drawback als mehrzügiges Economy-Commitment verstehen. Nach der Installation sollen normale Low-Value-Runs abgewertet werden, bis der Economy-Wert teilweise realisiert wurde; bekannte Agendas, Remote-Score-Threats und echte Notfälle dürfen das Commitment brechen.

## Kontext und Quellen

- Eingefügter Nutzertext vom 2026-06-08: Die KI installierte `Top Runners' Conference` und lief direkt danach, wodurch der Kartenwert praktisch zerstört wurde.
- `Top Runners' Conference` ist in den AI-Hints bereits mit `economy.turn_start_credit` und `risk.ends_on_run` beschrieben; die Lücke liegt wahrscheinlich in der Übersetzung dieser Signale in einen fortgeführten Plan.
- `docs/reviews/originalset-spotchecks/register.md` hält die Runtime-Prüfung für Start-of-turn-Credits und Run-Start-Trash fest.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-2-mechanikpaket-k/implementation-review.md` und `final-review.md` belegen die Engine-/Kartenumsetzung.
- Verwandte AI-Plan-Artefakte: `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md` und `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`.

## Scope

- Vorhandene Signale/Hints konservativ auswerten:
  - `economy.turn_start_credit`
  - `risk.ends_on_run`
  - `run.ends_run_after_effect`
  - `requiredMechanics: trash_on_run`
- Ein `RunnerNoRunEconomyCommitment` oder eine gleichwertige bestehende Planfortschreibung ergänzen bzw. schärfen.
- Installation solcher Karten nur dann hoch bewerten, wenn eine Economy-/Setup-Phase plausibel ist und kein akuter High-Payoff-Run oder Remote-Score-Threat anliegt.
- Nach aktiver Commitment-Karte Low-Value-HQ-/R&D-/Archives-/Remote-Probe-Runs abwerten.
- Setup-, Draw-, Install- und Credit-Actions während des Commitments leicht bevorzugen, ohne eine pauschale Run-Sperre einzuführen.
- Den Run-Malus mit bereits realisiertem Start-of-turn-Wert reduzieren.
- Overrides für bekannte Agenda, Remote-Score-Threat, Survival/Tag/Damage-Notfall, sehr hohen Access-Payoff und unmittelbare Score-/Game-Win-Verhinderung modellieren.
- Redigierte Debug-/Evidence-Felder ergänzen, z. B. `noRunEconomyCommitmentActive`, `noRunEconomySource`, `commitmentStrength`, `realizedValueEstimate`, `expectedFutureValue`, `runBreaksCommitment`, `noRunCommitmentPenalty`, `why_run_deferred_for_conference`, `why_run_allowed_despite_conference`.
- Fokussierte AI-Regressionen für Top Runners' Conference und mindestens eine Nicht-Fehlklassifikation ergänzen.

## Nicht im Scope

- Keine Engine-Änderung, keine LegalAction-Erzeugungsänderung, keine Änderung an `applyAction`, Replay, StateHash oder Zufallspfad.
- Keine neuen Strategy-IDs, sofern vorhandene TacticalGoals/Plan-IDs sauber erweitert werden können.
- Keine neue Kartensemantik, solange vorhandene Signale ausreichen.
- Keine pauschale Run-Sperre und keine Pflicht, nach Installation immer mehrere Züge nicht zu laufen.
- Keine Hidden-Info-Ausweitung und keine Nutzung verdeckter gegnerischer Karten.
- Keine Freigabe weiterer Karten oder Änderung am Kartenpool.

## Akzeptanzkriterien

- [x] Die KI erkennt Karten mit `economy.turn_start_credit` plus Run-Drawback als No-Run-Economy-Commitment oder dokumentiert eng, warum ein bestehendes Modell dafür genutzt wird.
- [x] `Top Runners' Conference` wird in stabiler Economy-/Setup-Lage nicht installiert, wenn die KI unmittelbar danach nur einen normalen Low-Value-Run plant.
- [x] Nach aktiver `Top Runners' Conference` werden Low-Value-Runs gegenüber Credit/Draw/Install/Setup nachvollziehbar abgewertet.
- [x] Bekannte Agenda, Remote-Score-Threat oder ein klarer Notfall dürfen das Commitment brechen; Debug/Evidence zeigt den Override-Grund.
- [x] Der Commitment-Malus sinkt, wenn Start-of-turn-Credits bereits realisiert wurden.
- [x] Andere Start-of-turn-Economy-Karten ohne Run-ending-Drawback werden nicht fälschlich als No-Run-Commitment behandelt.
- [x] Die gewählte finale Action stammt weiterhin aus `input.legalActions`.
- [x] Debug/Evidence bleibt redigiert und enthält keine Hidden-Info.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/deck-capabilities.ts`
  - `packages/ai/src/semantic-ai-runtime-cutover.ts`
  - fokussierte Tests in `packages/ai/src/*test.ts`
- Bestehende TacticalGoal-Namen bevorzugt schärfen, z. B. `runner.hold_for_economy`, `runner.build_credit_base`, `runner.develop_board_without_run` und einen klaren Reason-Code für erlaubtes Brechen des Commitments.
- Nicht über Kartennamen allein lösen. `Top Runners' Conference` ist der Regressionsanker, die Primärlogik soll die Signalkombination nutzen.
- Wenn die Analyse zeigt, dass die Runtime die Signalkombination nicht zuverlässig sieht, zuerst einen kleinen Matcher ergänzen und Folgepakete nur bei größerem Semantikbedarf anlegen.

## Ergebnisnotiz

Umgesetzt in der semantischen Runner-Runtime:

- Neue side-sichere No-Run-Economy-Commitment-Erkennung aus AI-Hints (`economy.turn_start_credit` plus `risk.ends_on_run`) und Mechanics-Fallback (`start_of_turn_credit_gain` plus `trash_on_run`).
- Aktive Karten wie `Top Runners' Conference` senken Low-Value-Run-Scoring, solange Start-of-turn-Wert offen ist, und geben Credit/Draw/Setup-Actions leichten Haltebonus.
- Install solcher Karten wird abgewertet, wenn nur ein unmittelbarer Low-Value-Run als Folgesituation plausibel ist und kein Setup-Fenster besteht.
- Bekannte Agenda-/Remote-Score-/High-Payoff-Runs dürfen das Commitment brechen.
- Der Run-Malus sinkt nach öffentlich sichtbarer Start-of-turn-Credit-Realisierung.
- Redigierte Debug-/Evidence-Felder ergänzt: `noRunEconomyCommitmentActive`, `noRunEconomySource`, `commitmentStrength`, `realizedValueEstimate`, `expectedFutureValue`, `runBreaksCommitment`, `noRunCommitmentPenalty`, `why_run_deferred_for_conference`, `why_run_allowed_despite_conference`.
- Regressionen decken aktive `Top Runners' Conference`, Install-Defer, Agenda-Override, realisierten Wert und eine Nicht-Fehlklassifikation für Start-of-turn-Economy ohne Run-Drawback ab.

Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Zufalls- oder UI-Änderung.
