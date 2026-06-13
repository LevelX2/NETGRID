# AI Runner Safe Access Local-Default Dry-Run

Status: complete

## Ziel

Prüfen, ob `runner_safe_access` lokal default-on werden könnte, ohne die Runtime zu ändern.

## Ergebnis

`runner_safe_access` bleibt ein lokaler Dry-Run-Kandidat, aber nicht automatisch default-on. Im aktuellen Corpus sind keine Bad-Override-Risiken sichtbar; die Aktivierung bleibt trotzdem eine separate Codeentscheidung.

| Metrik | Wert |
| --- | ---: |
| scenarioCount | 54 |
| eligible | 18 |
| wouldOverride | 18 |
| badOverrideRisk | 0 |
| structuredAlignmentCases | 18 |
| falsePositiveCandidates | 0 |

Zusätzliche RunnerSafeAccess-Metriken werden im Report geführt:

```text
centralOnlyCases: vorhanden
riskBlockedCases: maschinell geführt
evidenceOnlyBlockedCases: maschinell geführt
structuredAlignmentCases: 18
falsePositiveCandidates: 0
```

Blocked Reasons:

```text
runner_safe_access_wrong_side: 27
```

## Empfehlung

`recommendation: local_default_dry_run_candidate`

Das ist ausdrücklich keine Runtime-Aktivierung. Die Empfehlung bedeutet nur: Der Scope ist im aktuellen ShadowLeague-Corpus besser für eine spätere lokale Default-Entscheidung vorbereitet als `basic_setup` und `corp_score_window`.

## Nicht geändert

- Keine Runtime-Aktivierung.
- Keine Änderung am Env-Vertrag.
- Keine produktive Run-Auswahl außerhalb bestehender LegalActions.
- Evidence-only-Alignment bleibt blockierbar; strukturierte Alignment-Quellen bleiben Voraussetzung.

## Check

```text
semantic-shadow-league.test.ts: grün
@netgrid/ai typecheck: grün
git diff --check: grün
```
