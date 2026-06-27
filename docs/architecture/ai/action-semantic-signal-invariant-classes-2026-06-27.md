# Action-Semantic Signal Invariant Classes, 2026-06-27

Status: active diagnostic guard

Scope: `ActionSemanticInvariantReport`

## Zweck

Action-Semantic-Signale beschreiben die funktionale Wirkung einer vorhandenen `LegalAction`. Sie erzeugen keine Legalität, keine Engine-Aktionen, keine Planner-Gewichte und keine Hidden-Info-Projektion. Der Invariant-Report bleibt `diagnostic_only` und ist nicht Teil der Runtime-Action-Auswahl.

## Handlungswirksame Primärsignale

Primärsignale dürfen in `tacticSignals` stehen, wenn sie eine konkrete taktische Wirkung beschreiben, zum Beispiel `access.hq_multiaccess`, `access.rnd_multiaccess`, `damage.corp_tagged_meat_payoff`, `coverage.search_program`, `advance.counter_placement` oder `tag.payoff.meat_damage`.

`StrategySupportPair`s dürfen nur auf vollständiger Evidence beruhen: `strategyId`, `role`, `confidence` und `evidence` sind Pflicht. Broad-/Legacy-Signale dürfen nicht selbst StrategySupport-Anker sein.

## Broad-/Legacy-Signale

Breite Aggregationssignale wie `access.payoff`, `damage.payoff`, `economy.generic`, `setup.search`, `setup.recovery`, `setup.draw`, `defense.damage_prevention` und `run.make_run` bleiben als Aggregation oder Legacy-Kontext erlaubt, aber nicht als alleinige Primär-Evidence.

Wenn ein präziser Peer vorhanden ist, darf das breite Signal als Kontext nebenlaufen, zum Beispiel `access.payoff` zusammen mit `access.hq_multiaccess`. Ohne präzisen Peer meldet der Invariant-Report `broad_primary_signal_without_precise_peer`.

## Compatibility-Evidence

Kompatibilitätsfelder wie `compatibilitySignals`, `role:*`, `plan_role:*`, `line_support:*` und `strategic_role:*` dürfen historische oder beschreibende Hint-Kontexte tragen. Sie dürfen keine Action-Fit-, StrategySupport- oder Punish-Fit-Primärquelle sein.

## Verbotene statische Signale

Statische Karten- oder Themenlabels wie `hardware.chip`, `setup.vehicle`, `operation.black_ops` und `corp.operation` gehören in Kartendaten oder Compatibility-Evidence, nicht in `tacticSignals`. Der Invariant-Report meldet sie als `forbidden_static_signal`.

Typ-, Subtyp- und Name-only-Signale bleiben zusätzlich durch `pure_type_subtype_name_signal` verboten.

## Target und Hidden Info

TargetProfile-Evidence muss side-safe bleiben. Hidden-Info-Hinweise in gematchten TargetProfiles bleiben ein harter Invariant-Fehler (`target_profile_hidden_info`).
