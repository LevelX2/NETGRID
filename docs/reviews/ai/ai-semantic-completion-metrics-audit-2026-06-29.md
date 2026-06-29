# AI Semantic Completion Metrics Audit 2026-06-29

## Scope

Dieses Audit zieht die offenen Kopftabellen-Messwerte aus dem AI Semantic Architecture Completion Ledger nach. Es ist ein statischer Source- und Artefaktabgleich gegen den aktuellen Branch `codex/ai-semantic-architecture-completion`.

Keine Runtime-Entscheidung, kein Engine-Vertrag, keine LegalAction-Erzeugung und keine Hidden-Info-Grenze wurde geändert.

## Source-Scan

```text
rg --files packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "LegacyDecision|legacyDecision" packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "action\\.label" packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "\\.label\\.(includes|match|toLowerCase|startsWith|endsWith)" packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "new RegExp|RegExp\\(" packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "targetProfileMatches|TargetProfileMatch" packages/ai/src -g "*.ts" -g "!*.test.ts"
rg -o "targetConstraintResults" packages/ai/src -g "*.ts" -g "!*.test.ts"
```

| Messpunkt | Ergebnis |
| --- | ---: |
| Produktive TypeScript-Quelldateien unter `packages/ai/src` ohne `*.test.ts` | 596 |
| `LegacyDecision`-/`legacyDecision`-Treffer in produktiven Quellen | 106 Treffer in 11 Dateien |
| `LegacyDecision`-/`legacyDecision`-Treffer im semantischen Runtime-Bereich `runtime`/`decision`/`actions`/`plans` | 42 Treffer in 6 Dateien |
| `action.label`-Treffer in produktiven Quellen | 11 Treffer in 6 Dateien |
| freie produktive `.label.includes`-/`.label.match`-/`.label.toLowerCase`-/Prefix-/Suffix-Parser | 0 |
| produktive `RegExp`-Konstrukte im AI-Source | 0 |
| `TargetProfileMatch`-/`targetProfileMatches`-Treffer | 33 Treffer in 11 Dateien |
| `targetConstraintResults`-Treffer | 8 Treffer in 4 Dateien |

## Klassifikation

- Die verbleibenden `LegacyDecision`-Treffer sind in Shadow-/Readiness-Artefakten, `legacy/*`, gekapselten Runtime-Provider-Schnittstellen, Forced-Legacy-Notaus, opt-in Practical-Micro-Vergleich oder Runner-Baseline-Support-Komposition gebunden.
- Der normale Semantic-Runtime-No-Candidate-Pfad nutzt `semantic_coverage_fallback`, nicht Legacy. Dieser Fallback wählt deterministisch aus vorhandenen Engine-`LegalActions`.
- Die verbleibenden `action.label`-Treffer sind Werttransport, Debug-/Report-Ausgabe oder gekapselte Legacy-Planerstellen; freie produktive Label-Parser und produktive Regex-Konstrukte sind im Scan nicht vorhanden.
- `TargetProfileMatch` und `targetConstraintResults` sind produktive, side-safe Datenstrukturen im ActionSemanticCandidate-/TargetContext-Pfad. Sie erzeugen keine Ziele und keine LegalActions.

## Coverage-Evidence

`docs/reviews/ai/action-semantic-candidate-coverage-2026-06-12.json` bleibt die letzte maschinenlesbare Coverage-Basis für den Candidate-Fixture-Report:

| Feld | Wert |
| --- | ---: |
| `sourceResolvedRate` | 1 |
| `abilityResolvedRate` | 0.0455 |
| `targetContextRate` | 0.4091 |
| `costKnownRate` | 1 |
| `timingKnownRate` | 1 |
| `hiddenInfoLeaks` | 0 |
| `runtimeBehaviorChanges` | 0 |
| `actionSelectionChanges` | 0 |
| `legalActionGenerationChanges` | 0 |

Der aktuelle fokussierte Coverage-Test ist grün:

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts

Test Files  1 passed (1)
Tests       6 passed (6)
```

## Ergebnis

Die zuvor offenen Kopftabellenwerte im Completion Ledger sind auditierbar nachgezogen. Der Abschlussstatus des Gesamtledgers bleibt trotzdem `IN_PROGRESS`, weil der finale Gesamtabschluss weiterhin ein eigenes Ende-zu-Ende-Audit gegen Zielartefakte, Gate-Stand und mögliche neue In-Scope-Findings braucht.
