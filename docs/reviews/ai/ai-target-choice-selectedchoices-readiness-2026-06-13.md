# AI TargetChoice SelectedChoices Readiness

Status: complete

## Ziel

Bewerten, welche TargetChoiceShadow-Fälle perspektivisch für `selectedChoices`-ähnliche Dry-Runs reif wären, ohne produktive `selectedChoices` oder `selectedTargets` zu erzeugen.

## Kategorien

```text
ready_for_shadow_only
ready_for_local_dry_run
blocked_engine_only
blocked_hidden_info
blocked_no_side_safe_options
blocked_scorecard_unclear
```

## Ergebnis

Ein neuer interner Readiness-Report klassifiziert bestehende TargetChoiceShadow-Reports anhand der Scorecard:

- eindeutige Top-Optionen mit ausreichendem Abstand: `ready_for_local_dry_run`
- gedeckte, aber nicht eindeutige Fälle: `ready_for_shadow_only`
- Engine-only-Ziele: `blocked_engine_only`
- fehlende side-safe Optionen: `blocked_no_side_safe_options`
- unklare/leer geblockte Scorecards: `blocked_scorecard_unclear`

## Sicherheitsvertrag

```text
productiveUseAllowed: false
selectedChoicesCreated: false
selectedTargetsCreated: false
runtimeConsumerStatus: none
noRuntimeEffect: true
```

## Check

```text
target-choice-shadow-readiness.test.ts: grün
target-choice-shadow.test.ts: grün
@netgrid/ai typecheck: grün
```
