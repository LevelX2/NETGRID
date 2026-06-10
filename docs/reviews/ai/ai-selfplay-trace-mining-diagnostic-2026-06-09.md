# AI Selfplay Trace Mining Diagnosepfad 2026-06-09

Status: implementierter Simulation-only Diagnosepfad.

## Anlass

Die vorhandenen Selfplay- und Matchprogression-Benchmarks zeigen Safety-stabile, aber teilweise stagnierende Spiele. Der neue Pfad soll solche Partien nicht automatisch reparieren, sondern verdächtige Entscheidungsfenster reproduzierbar priorisieren.

## Vertrag

- `runAiSelfplayTraceMining` führt deterministische AI-Selfplay-Partien mit konfigurierbaren Seeds, Decks, Profilen und Action-Limit aus.
- `detectAiSelfplaySuspiciousDecisions` wertet vorhandene `AiSimulationSummary`-Traces aus und kann dadurch auch synthetische oder spätere gespeicherte Repro-Traces prüfen.
- `formatAiSelfplayTraceMiningReport` rendert einen Markdown-Report mit Aggregat, Detektorverteilung, Severity-Verteilung und Top-Findings.
- Der Pfad ist explizit `diagnostic_only`, `noTraining: true` und `noAutofix: true`.
- Die Entscheidungsfakten werden aus `sanitizeAiDecisionDebug` abgeleitet und auf kurze `debugFacts` begrenzt. Rohdaten wie `AIInput`, `DecisionDebug`, `fullGameState`, private Payloads oder Token dürfen nicht in Findings oder Reports erscheinen.

## Detektorgruppen

- Safety: illegale Aktionen, Replay-Fehler, Hidden-Info-Marker und No-Legal-Action-Fehler.
- Fortschritt: Action-Limit, lange Spiele ohne Corp-Score und lange Spiele ohne Runner-Access.
- Runner-Payoff: wiederholte Runs ohne Fortschritt, bekannte Remote-No-Payoff-Runs, niedrigwertige Archives-Runs und Recovery-Loops.
- Setup/Economy: Credit-Bank ohne erkennbaren Funding-Bedarf, riskante Self-Damage-Aktionen, niedriger Handbuffer vor Blink-Pressure-Runs, doppelte Low-Delta-Installs und Overdraw ohne Dringlichkeit.
- Plan/Trace: Planstep-Action-Mismatch und verdächtige Semantic-Override-Signale.

## Ablauf

1. Seed- und Deckmatrix auswählen, standardmäßig aus den bestehenden V1.4.3-Tuning-Seeds.
2. Selfplay über die bestehende Simulation laufen lassen; nur gewählte LegalActions werden aufgezeichnet.
3. Pro Entscheidung side-safe Trace-Fakten aus dem sanitisierten Debug-Kern ergänzen.
4. Detektoren über Einzelentscheidungen und Matchzusammenfassungen laufen lassen.
5. Findings nach Severity und Reproduzierbarkeit gruppieren, mit `replaySafeReference` und optionalem `suggestedFixtureName` ausgeben.
6. Report erzeugen und Findings manuell triagieren. Erst daraus entstehen kleine Activities oder gezielte Regressionstests.

## Grenzen

- Es wird noch kein physisches Fixture-Dateiformat erzeugt; der Pfad liefert aktuell reproduzierbare Referenzen und vorgeschlagene Fixture-Namen.
- Es gibt keine Runtime-Wirkung auf Live-AI, Planner-Gewichte, Engine-Regeln, LegalActions oder UI.
- Detektoren sind Review-Hinweise, keine Wahrheit. Ein Finding bedeutet: menschlich sichten und bei Bedarf als kleines Fix- oder Testpaket schneiden.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`
- `git diff --check -- packages/ai/src/index.ts packages/ai/src/simulation/benchmark-reports.ts packages/ai/src/simulation/benchmark-reports.test.ts`
