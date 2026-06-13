# AI Selfplay Mining Promotion Queue

Status: complete

## Ziel

Selfplay-Mining-Cluster in konkrete Regression-Candidates überführen, ohne automatisch neue Szenarien oder Runtime-Verhalten zu erzeugen.

## Kategorien

```text
promote_to_real_engine_corpus
promote_to_snapshot_suite
defer_missing_engine_state
defer_target_choice_gap
defer_doctrine_gap
```

## Ergebnis

`SelfplayDecisionSnapshotMiningReport` enthält jetzt eine `promotionQueue`. Jeder Kandidat erhält:

- `snapshotId`
- `category`
- `scenarioHint`
- side-safe Evidence

## Sicherheitsvertrag

```text
productiveUseAllowed: false
semanticExecutionAllowed: false
runtimeConsumerStatus: none
noRuntimeEffect: true
```

Die Queue ist eine Arbeitsliste, kein automatischer Corpus-Importer.
