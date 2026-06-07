---
activityId: act-2026-06-07-ai-runner-pressure-budget-variation
status: done
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
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
  - packages/ai/src/runner-tactical-goals.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/runner-tactical-goals.test.ts src/tactical-plans.test.ts
  - git diff --check
---

# Runner-Pressure-Budget und kontrollierte Variation

## Ziel

Die Runner-KI soll durch die neue Creditreserve nicht in ein starres Credit-Stapeln kippen. Wenn Economy-Aufbau wichtig ist, aber ein günstiges, side-sicher plausibles Druckfenster offen ist, darf sie begrenzt Probe-/Pressure-Aktionen einschieben. Zusätzlich darf sie zwischen ähnlich guten sicheren Kandidaten kontrolliert und deterministisch variieren.

## Kontext und Quellen

- Zusatzgedanke vom 2026-06-07: Reserve ist Kostenbewusstsein, keine harte Regel. Unter Reserve sollen Runs und Installationen stärkere Gründe brauchen, aber günstige HQ-/F&E-/Archiv-Probe-Runs ohne known-low-Befund dürfen nicht komplett verschwinden.
- Vorgängerpakete:
  - `act-2026-06-07-ai-runner-contest-reserve-contract`
  - `act-2026-06-07-ai-runner-contest-reserve-implementation`
  - `act-2026-06-07-ai-runner-contest-reserve-debug-regression`
- Voraussichtliche Codeanker:
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-tactical-goals.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/index.ts`

## Scope

- Eine kleine `RunnerPressureBudget`-/`ProbeAllowance`-Logik oder gleichwertige Erweiterung ergänzen:
  - `canSpendActionOnPressure`,
  - `pressureActionBudgetThisTurn`,
  - `maxCreditLossForProbe`,
  - `allowedProbeTargets`,
  - `blockedReasons`,
  - redigierte Evidence.
- Bei aktivem Economy-/Reserve-Aufbau günstige Pressure-Aktionen erlauben, wenn:
  - der Run kostenlos oder sehr billig ist,
  - das Ziel nicht known-low ist,
  - ein plausibler Access-/Informations-/Druckwert besteht,
  - keine akute Remote-Contest-Reserve zerstört wird,
  - keine Survival-, Tag-, Damage-, Trace-, Handlimit- oder MU-Pflicht verdrängt wird.
- Economy/Pressure-Balance abbilden:
  - Unter Reserve, F&E offen, Top unbekannt, kein Remote-Threat -> Creditbase bleibt hoch, aber ein F&E-Probe-Run darf als plausibler Druckslot erhalten bleiben.
  - Unter Reserve, F&E known-low -> kein Probe-Run; Economy, Install oder Draw/Search gewinnt.
  - Remote-Score-Threat mit Contest-FundingNeed -> kein opportunistischer Central-Probe-Run.
- Kontrollierte Variation nur zwischen plausiblen, sicheren und ähnlich guten Kandidaten ermöglichen:
  - optional bounded seeded jitter oder near-tie selection,
  - nur innerhalb eines engen Score-Korridors,
  - keine Variation bei reaktiven Pflichtfenstern,
  - keine Variation zu offensichtlich schlechter oder unsafe Action,
  - deterministisch/reproduzierbar und ohne Engine-Zufalls-/Replay-Vertragsänderung.
- Redigierte Debugfacts ergänzen:
  - `pressureBudget`,
  - `pressureProbeAllowed`,
  - `pressureProbeTarget`,
  - `blockedPressureReasons`,
  - `economyPressureTradeoff`,
  - `boundedVariationApplied`,
  - `variationReason`.

## Nicht im Scope

- Keine Engine-, LegalAction- oder `applyAction`-Änderung.
- Keine neue Kartensemantik und keine neuen Taktiksignale.
- Kein chaotischer Zufall und keine nicht reproduzierbare KI-Entscheidung.
- Kein Pauschalbonus für Runs.
- Keine Variation, die Hidden-Info-, LegalAction-, Reserve-, Replay- oder StateHash-Grenzen verletzt.
- Keine Variation bei offensichtlich schlechter, unsafe oder reaktiv zwingender Action.

## Akzeptanzkriterien

- [x] Runner unter Reserve, F&E frei/top unbekannt, kein Remote-Threat -> Credit/Economy bleibt hoch, aber F&E-Probe kann als plausible Action gewinnen oder im oberen Korridor bleiben.
- [x] Runner unter Reserve, F&E known-low -> kein Pressure-Probe; Economy, Install oder Draw/Search gewinnt.
- [x] Remote-Score-Threat plus ContestFundingNeed -> kein opportunistischer F&E-/HQ-Probe-Run verdrängt den Contest-Funding-Plan.
- [x] Zwei nahe gute Runs, zum Beispiel HQ und F&E, dürfen kontrolliert variieren, sofern beide safe und plausibel sind.
- [x] Ein deutlich schlechter Run kann durch Variation nicht gewinnen.
- [x] Variation ist deterministisch/reproduzierbar und ändert keine Engine-Random-, Replay- oder StateHash-Verträge.
- [x] Finale Action stammt aus `input.legalActions`.

## Umsetzungshinweise

- PressureBudget ist ein begrenzter Druckslot, kein Rückfall in "alle Aktionen verrennen".
- Ein guter Startpunkt ist maximal eine Pressure-Aktion pro Runner-Zug, solange Economy-Aufbau aktiv ist und kein akuter Contest-/Survival-Blocker besteht.
- Variation soll klein bleiben, zum Beispiel nur bei near-ties und mit engem bounded jitter. Wenn deterministische Einbindung nicht sauber möglich ist, lieber nur eine transparente near-tie-Regel ohne Zufall implementieren.
- Passende Checks nach Umsetzung:
  - `corepack pnpm --filter @netgrid/ai exec tsc --noEmit`
  - fokussierte Vitest-Dateien für `runner-run-target-evaluation`, `runner-tactical-goals` und `tactical-plans`
  - `git diff --check`

## Ergebnisnotiz

Umgesetzt in `packages/ai/src/tactical-plans.ts`: Runner erhalten bei aktivem Credit-Reserve-Aufbau einen begrenzten `RunnerPressureBudget` für kostenlose HQ-/F&E-Probes. Die Freigabe wird blockiert, wenn Remote-Contest-Funding nötig ist, keine sicheren Probe-Ziele existieren oder eine nützliche Hand-Development-Aktion aktuell legal ist. Near-Tie-Probes erhalten eine kleine deterministische Variation über `stateVersion`; sie nutzt keinen Engine-Random und ändert keine Replay-/StateHash-Verträge.

Abgesichert in `packages/ai/src/runner-tactical-goals.test.ts`: freier F&E-Probe unter Reserve, Remote-Contest-Funding blockiert Central-Probes, deterministische Near-Tie-Variation, keine Variation für nicht nahe liegende Central-Probes. Bestehende known-low-Abdeckung bleibt über RunTarget-/TacticalPlan-Tests erhalten.
