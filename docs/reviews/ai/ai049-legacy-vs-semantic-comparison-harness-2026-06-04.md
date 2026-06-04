# AI049 Legacy-vs-Semantic Comparison Harness

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: diagnostischer Legacy-vs-Semantic-Vergleich, keine Ausführung

## Kurzfazit

AI049 ergänzt einen Vergleichsharness zwischen dokumentierten Legacy-Action-Referenzen und den AI048-Report-only Semantic-Referenzen. Der Harness führt keine semantische Action aus und wählt keine Action. Er kategorisiert nur, ob Legacy und Semantic-Report übereinstimmen, vertretbar abweichen, riskant abweichen oder wegen fehlender Evidence nicht vergleichbar sind.

## Kategorien

| Kategorie | Bedeutung |
| --- | --- |
| `same_reference` | Legacy-Referenz und Semantic-Report-Referenz zeigen auf denselben Candidate |
| `safe_divergence` | beide Referenzen sind score-draft-available, aber unterschiedlich |
| `risky_divergence` | Legacy verweist auf einen nicht evidence-ready Candidate |
| `insufficient_evidence` | der Semantic-Report selbst ist wegen Gate/Gaps nicht belastbar |
| `not_compared` | kein Legacy-Referenzwert für das Fixture |

## Report-Ergebnis

```text
scenarioCount: 14
comparedScenarios: 6
sameReference: 2
safeDivergence: 1
riskyDivergence: 1
insufficientEvidence: 2
notCompared: 8
```

## Grenzen

Es gibt keine produktive Action-Auswahl, keine semantische Ausführung, kein Live-Scoring, keine Planner-Gewichte, keine Runtime-Anbindung, keine Engine- oder Legalitätsänderung und keine Hidden-Info-Projektion.

`risky_divergence` ist nur ein Review-Signal für spätere Shadow-Auswertung.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai049-legacy-vs-semantic-comparison-harness.mjs` | Vergleichskategorien, Grenzen und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- shadow-scoring-diagnostics.test.ts` | Diagnostiktests grün |
