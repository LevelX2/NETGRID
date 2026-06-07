---
activityId: act-2026-06-07-ai-run-payoff-hints-consumer
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt: 2026-06-07
completedAt: 2026-06-07
branch: codex/activities-inbox-ai-run-mu
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-run-payoff-signal-inventory
resultArtifacts:
  - packages/ai/src/runner-run-target-evaluation.ts
  - packages/ai/src/runner-run-target-evaluation.test.ts
checks:
  - corepack pnpm install
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-tactical-goals.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts
  - git diff --check
---

# AI-Run-Payoff-Hints und Consumer

## Ziel

`RunnerRunTargetEvaluation` soll installierte Runner-Karten mit serverbezogenen Run-/Access-Payoff-Signalen side-safe auswerten und HQ, F&E, Archive, Außenserver oder beliebige Run-Ziele moderat auf- oder abwerten, ohne Legalität zu erzeugen.

## Kontext und Quellen

- Vorarbeit: `act-2026-06-07-ai-run-payoff-signal-inventory`.
- Nutzerhinweis vom 2026-06-07: Karten wie `Crumble`, `Highlighter` und `Vienna 22` sollten nicht nur über CardId-Fallbacks, sondern über wiederverwendbare AI-Hints/Taktiksignale in Run-Zielbewertungen wirken.
- `packages/ai/src/runner-run-target-evaluation.ts`: aktueller `targetHasMultiaccess`-Pfad prüft einige bekannte Karten direkt per `definitionId`.
- `docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md`: Known-Remote-Payoff bleibt side-safe und darf keine verdeckten Daten projizieren.
- `docs/architecture/ai/runner-hand-development-creditbase-contract-2026-06-07.md`: Access-Payoff ist als Runner-Entwicklungsrolle bereits relevant.

## Scope

- Nach dem Inventar nur fehlende, wiederverwendbare Signale oder Hints ergänzen.
- Einen engen Consumer ergänzen, zum Beispiel `InstalledRunPayoff`, der installierte Runner-Karten aus der eigenen PlayerView auswertet.
- Signale bevorzugt konsumieren; CardId-Fallbacks nur konservativ für bekannte Karten, solange die Hint-Lage noch lückenhaft ist.
- Payoffs serverbezogen aggregieren:
  - HQ,
  - F&E/R&D,
  - Archive,
  - Außenserver/Remote,
  - beliebiger Run.
- Bewertungsbeiträge getrennt halten:
  - immediate access value,
  - future/counter setup value,
  - purge-tax value,
  - economy value,
  - risk/malus.
- Boni mit Diminishing Returns und Cap stapeln.
- Bonus dämpfen, wenn `known_no_current_payoff`, known-low, unbezahlbarer Pfad, fehlende Coverage, relevante Remote-Score-Threat oder Economy-Posture dagegen sprechen.
- Evidence in `RunnerRunTargetEvaluation.evidence` redigiert und knapp ausgeben, zum Beispiel `installed_run_payoff:hq:access_hq_multiaccess`.

## Nicht im Scope

- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine Action-Erzeugung aus Signalen.
- Keine Hidden-Info-Projektion über die eigene PlayerView hinaus.
- Keine neue Strategy-ID und keine pauschale Run-Bonus-Logik.
- Keine Protheus-AI-Freigabe als Nebeneffekt.
- Keine Änderung an Decklegalität, Formatlegalität oder Kartenpool-Gates.

## Akzeptanzkriterien

- [ ] `RunnerRunTargetEvaluation` kann installierte serverbezogene Payoff-Karten über AI-Hints/Taktiksignale berücksichtigen.
- [ ] HQ bekommt bei passenden HQ-Payoffs einen nachvollziehbaren Bonus, F&E bei passenden F&E-Payoffs entsprechend.
- [ ] Bekannte Low-Value-/No-Current-Payoff-Ziele bleiben gedämpft und werden nicht durch generische Boni erzwungen.
- [ ] Unbezahlbare oder nicht erreichbare Pfade erzeugen keine Run-Auswahl, sondern bleiben bei `gain_credits_first` oder `find_breaker_first`.
- [ ] Evidence nennt nur side-safe Signal-/Kategorieinformationen, keine verdeckten Karten.
- [ ] Bestehende Central-/Remote-Payoff- und Economy-Posture-Tests bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte: `packages/ai/src/runner-run-target-evaluation.ts`, `packages/ai/src/runner-run-target-evaluation.test.ts`, `packages/ai/src/ai-hints.ts`, `packages/ai/src/hint-ontology.ts`, `data/ai/tactic-signals-v1.json`, `data/ai/ai-card-hints-active.json`.
- Die Scoring-Wirkung sollte moderat bleiben. Konkrete known-agenda-, score-threat- oder trash-affordable-Payoffs müssen weiterhin stärker sein als bloßer Setup-Wert.
- Falls das Inventar eine neue Hint-Struktur empfiehlt, diese zuerst eng dokumentieren und nur für belegte Karten anwenden.

## Ergebnisnotiz

Abgeschlossen. `RunnerRunTargetEvaluation` aggregiert jetzt installierte Runner-Run-Payoffs side-safe aus strukturierten AI-Hints der eigenen PlayerView-Rig-Karten. Der neue `RunnerInstalledRunPayoff` trennt immediate access value, future/counter setup value, purge-tax value, economy value, risk penalty, Score-Bonus, echten Multiaccess und redigierte Evidence.

Umgesetzt:

- HQ-/F&E-Multiaccess wird über `effects.kind=multiaccess` statt über enge CardId-Sonderfälle erkannt.
- Weitere Payoffs wie `hq_info`, `topdeck_info`, `access_replacement`, on-access free-trash/access-trash-pressure, successful-run Counter, `remote_tax`, ICE-Break-Cost-Support, Purge-Tax und Economy werden moderat und gedeckelt bewertet.
- Known-low-/known-no-current-payoff, fehlende Coverage, unpayable paths und Economy-FundingNeed bleiben stärkere Dämpfer.
- Evidence bleibt kategoriebasiert, z. B. `installed_run_payoff:hq:multiaccess`, ohne Hidden-Info- oder FullState-Daten.

Checks: `corepack pnpm install` war nötig, weil der neue Worktree keine `node_modules` hatte. Danach liefen AI-Typecheck, RunTargetEvaluation-Test, angrenzende TacticalGoal-/TacticalPlan-/Runtime-Cutover-Tests und `git diff --check` erfolgreich.
