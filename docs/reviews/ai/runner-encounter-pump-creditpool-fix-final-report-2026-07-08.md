# Runner Encounter Pump Creditpool Fix Final Report 2026-07-08

## Analysiertes Spiel

- Match: `match_17ac410bb31694c5`
- Status beim Fund: aktiv
- Modus: `human_corp_vs_runner_ai`
- Relevanter Zustand: StateVersion 137, Runner-Encounter auf R&D gegen `Keeper`

## Befund

Die Runner-KI begann den Run auf R&D, obwohl sie ihn laut eigener Run-Start-Pfadbewertung mit 2 Pool-Credits plus 2 `Vewy Vewy Quiet` Run-Bits erreichen konnte. Im Encounter schloss sie dann `Codecracker: Stärke +1` mit `pump_cannot_reach_break_strength:true|pump_required_count:4` aus.

Die Engine-Gegenprobe auf dem gespeicherten Snapshot zeigte: vier Pump-Schritte sind legal; die ersten zwei werden aus `Vewy Vewy Quiet` bezahlt, danach zwei aus dem Runner-Pool. Anschließend ist `Codecracker: Subroutine brechen` legal.

## Ursache

`packages/ai/src/runtime/runner-pump-viability-context.ts` rechnete Pump-Folgen nur gegen `input.playerView.own.credits`. Sichtbare `counterDisplays[].creditPool.uses` wurden dort nicht berücksichtigt, obwohl sie in der PlayerView korrekt vorlagen und die Run-Start-Pfadbewertung sie bereits verwendet.

## Umsetzung

- Pump-Viability baut jetzt aus sichtbarer Runner-Rig-PlayerView ein Encounter-Creditbudget.
- Pump- und geschätzte Break-Kosten verbrauchen passende sichtbare Restricted-Creditpools:
  - generische Icebreaker-Credits,
  - non-noisy Icebreaker-Credits nur für nicht-noisy Breaker,
  - Killer-Credits nur für Killer.
- Die Lösung ist generisch und enthält keine Sonderregel für `Keeper`, `Codecracker` oder `Vewy Vewy Quiet`.

## Tests und Checks

Erfolgreich:

- `corepack pnpm exec vitest run packages/ai/src/semantic-ai-runtime-cutover.test.ts -t "uses visible non-noisy run credits"`
- `corepack pnpm exec vitest run packages/ai/src/visible-run-analysis.test.ts packages/ai/src/runner-run-target-evaluation.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Zusatzhinweis:

Der vollständige Lauf von `packages/ai/src/semantic-ai-runtime-cutover.test.ts` wurde probeweise gestartet und zeigt bestehende Plan-Memory-/Plan-Type-Erwartungsfehler außerhalb dieses Fixes. Der neue fokussierte Regressionstest in derselben Datei besteht.

## Grenzen

Die nachgelagerte Future-Path-Prüfung erhält weiterhin nur den verbleibenden Runner-Pool-Creditwert. Diese Änderung behebt den aktuellen Encounter-Pump-Fehler ohne den breiteren Future-Path-Kontrakt zu erweitern.
