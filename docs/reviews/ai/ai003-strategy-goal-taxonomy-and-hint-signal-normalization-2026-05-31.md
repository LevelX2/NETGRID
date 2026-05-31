# AI003 Strategy Goal Taxonomy and Hint Signal Normalization Contract

Aufgabe-ID: AI003

Datum: 2026-05-31

Arbeitsart: Vertrags- und Gate-Schnitt für Strategieziele, strategische Rollen und abgeleitete Function-Signals

## Kurzfazit

AI003 definiert eine erste stabile V1-Taxonomie für Strategieziele und strategische Kartenrollen, ohne bestehende Hints zu migrieren und ohne Plannerwirkung einzuführen.

Der neue Vertrag trennt künftig:

- strukturierte Hints als vorhandene Kartenfacts,
- daraus abgeleitete Function-Signals als Analyse-/Doctrine-Signale,
- `lineSupport` als engen Strategieanker statt als allgemeines Nützlichkeitslabel,
- optionales `strategicRole` als kontrolliertes Zielfeld,
- Strategy-Goal-Definitionen mit Ankern und Support-Anforderungen,
- spätere DeckDoctrine-Aggregation als separaten Folgeschnitt.

Der neue Check `corepack pnpm check:ai-strategy-taxonomy` validiert die Taxonomie hart, behandelt aktuelle Legacy-`lineSupport`-Werte aber bewusst nur als Warning.

## Warum nicht Karte -> Strategie

Eine Karte unterstützt nicht automatisch direkt eine Strategie. Die meisten Karten liefern zunächst nur Funktionen:

- Economy erzeugt `economy.*`-Function-Signale, aber nicht automatisch `runner.rnd_pressure`.
- Normale Breaker erzeugen Breaker-Coverage-Signale, aber nicht automatisch `runner.rig_first`.
- R&D-Multiaccess erzeugt `access.rnd_multiaccess` und kann dadurch ein Anker für `runner.rnd_pressure` und `runner.interface_closeout` sein.
- Tag-/Punish-Payoffs erzeugen `tag.payoff` und können Anker für `corp.tag_trace_punish` oder `corp.damage_kill` sein.

Die künftige Lesart ist deshalb:

```text
structured hints -> abgeleitete Function-Signals
lineSupport -> Strategieanker / klare Strategiebelege
strategicRole -> kontrollierte Kartenrolle
strategy definitions -> Anker + Support-Anforderungen
DeckDoctrine -> spätere Aggregation
```

## Strategie-Ziele Runner

AI003 definiert 10 Runner-Ziele:

- `runner.rig_first`
- `runner.economy_first`
- `runner.breaker_search`
- `runner.rnd_pressure`
- `runner.hq_pressure`
- `runner.remote_contest`
- `runner.remote_trash`
- `runner.interface_closeout`
- `runner.survival_defense`
- `runner.run_event_tempo`

Bewertung der Grenzfälle:

- `runner.interface_closeout` bleibt eigenständig, weil Interface-/Multiaccess-Dichte ein Payoff-Paket ist und nicht nur ein Synonym für R&D- oder HQ-Druck.
- `runner.economy_first` bleibt als Structural-Density-/Support-Ziel erhalten. Einzelne Economy-Karten sind dadurch aber keine direkten Strategieanker.
- `runner.breaker_search` ist ein Setup-/Engine-Ziel, kein Label für jeden normalen Breaker.

## Strategie-Ziele Corp

AI003 definiert 10 Corp-Ziele:

- `corp.remote_scoring`
- `corp.fast_advance`
- `corp.ice_tax_glacier`
- `corp.central_stabilize`
- `corp.asset_economy`
- `corp.tag_trace_punish`
- `corp.damage_kill`
- `corp.ambush_bluff`
- `corp.economy_rez_reserve`
- `corp.rush_score`

Bewertung der Grenzfälle:

- `corp.central_stabilize` bleibt eigenständig, weil HQ-/R&D-Schutz auch ohne Glacier-Remote ein Deckziel oder Pflichtprofil sein kann.
- `corp.economy_rez_reserve` bleibt als Support-/Reserve-Ziel erhalten. Generische Corp-Economy wird dadurch nicht automatisch zu `corp.remote_scoring`.
- `corp.rush_score` ersetzt den breiten Legacy-Begriff `score_closeout` als enges frühes Score-Ziel.

Quelle: `data/ai/strategy-goals-v1.json`.

## StrategicRole-Taxonomie

AI003 definiert 11 optionale `strategicRole`-Zielwerte:

- `payoff_anchor`
- `engine_anchor`
- `enabler`
- `support_tool`
- `utility`
- `defensive_tool`
- `emergency_tool`
- `win_condition`
- `tax_tool`
- `punish_payoff`
- `scoring_tool`

`strategicRole` ist in AI003 optional. Bestehende Hints müssen das Feld nicht tragen. Wenn spätere Migrationen echtes normiertes `lineSupport` setzen, sollte eine passende Rolle normalerweise mitgeführt werden.

Quelle: `data/ai/strategic-roles-v1.json`.

## Function-Signal-Derivation

AI003 führt kein manuelles `functionTags`-Feld ein. Function-Signals werden aus bestehenden strukturierten Hint-Feldern abgeleitet:

- `effects.kind`
- `effects.scope`
- `conditions.kind`
- `breakerProfile.coverage`
- `remoteRole.kind`

Nicht als Function-Truth genutzt werden:

- `valueHints`,
- `roles`,
- `planRoles`,
- Legacy-`lineSupport`,
- Gegner-Hidden-Info oder Runtime-Aktionsfelder.

Der V1-Contract enthält 57 Ableitungsregeln und 51 eindeutige Function-Signals. Im aktuellen compiled Stand erhalten 343 Karten mindestens ein abgeleitetes Function-Signal.

Beispiele aus dem Gate:

- Economy-Smoke: `economy.generic`, keine Strategieanker.
- R&D-Multiaccess-Smoke: `access.rnd_multiaccess`, Anker für `runner.rnd_pressure` und `runner.interface_closeout`.
- Normaler Wall-Breaker-Smoke: `breaker.wall`, kein Anker für `runner.rig_first`.
- Tag-Punish-Payoff-Smoke: `tag.payoff`, Anker für `corp.tag_trace_punish` und `corp.damage_kill`.

Bewusst offen bleiben drei Descriptor-Gaps:

- `remote_contest_pressure_not_first_class`
- `cheap_ice_and_rush_shape_partial`
- `interface_closeout_density_requires_aggregation`

Quelle: `data/ai/function-signal-derivation-v1.json`.

## Alias- und Migrationsbefund

Der Aliasreport wertet die aktuellen `roles`, `planRoles` und `lineSupport` aus dem compiled Hint-Stand aus:

- 251 unterschiedliche `roles`
- 102 unterschiedliche `planRoles`
- 15 unterschiedliche `lineSupport`-Werte
- 368 Werte insgesamt

Mapping-Kategorien:

- `exact_strategy_goal`: 4
- `alias_to_strategy_goal`: 86
- `function_signal_only`: 190
- `legacy_role_only`: 36
- `unknown_unmapped`: 52
- `should_be_removed_from_lineSupport`: 0 im aktuellen Bestand

Damit sind 280 Werte direkt als normiertes Strategieziel, Alias oder Function-Signal einordenbar. 36 Werte bleiben bewusster Legacy-/Review-Kontext. 52 Werte bleiben `unknown_unmapped` und sind Warnungen für spätere Normalisierung, keine AI003-Blocker.

Quelle: `docs/reviews/ai/ai003-strategy-taxonomy-alias-report-2026-05-31.json`.

## Legacy-Status von lineSupport

Alle bestehenden `lineSupport`-Werte gelten in AI003 als Legacy-`lineSupport`. Sie werden im Report gemappt, aber nicht hart migriert und nicht hart gegated.

Aktuelle Legacy-Mappings:

- `rig_first` -> `runner.rig_first`
- `economy_first` -> `runner.economy_first`
- `breaker_search_first` -> `runner.breaker_search`
- `early_rnd_pressure` -> `runner.rnd_pressure`
- `early_hq_pressure` -> `runner.hq_pressure`
- `remote_contest` -> `runner.remote_contest`
- `interface_pressure` / `closeout_pressure` -> `runner.interface_closeout`
- `central_stabilize` -> `corp.central_stabilize`
- `remote_scoring_build` -> `corp.remote_scoring`
- `ice_tax_glacier` -> `corp.ice_tax_glacier`
- `economy_rez_reserve` -> `corp.economy_rez_reserve`
- `fast_advance_or_counter_ops` -> `corp.fast_advance`
- `tag_trace_punish` -> `corp.tag_trace_punish`
- `score_closeout` -> `corp.rush_score`

Der neue Check warnt diese Werte als Legacy, failt sie aber nicht.

## Bestehende Felder und Wirkung

Bereits vorhandene strukturierte Felder im compiled Stand:

- `effects`
- `conditions`
- `costProfile`
- `breakerProfile`
- `remoteRole`
- `targetProfiles`
- `lineSupport`
- `quality`
- `roles`
- `planRoles`
- `valueHints`
- `requiredMechanics`
- `riskTags`
- `scenarioRefs`

Mechanische Facts sind vor allem `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole` und `targetProfiles`.

Strategische oder Review-Kontextfelder sind `lineSupport`, künftig optional `strategicRole`, `roles`, `planRoles`, `strategicNotes`, `quality.strategyCovered` und `opponentSignals`.

Bereits runtimewirksam sind im AI-Pfad vor allem `roles`, `planRoles`, `valueHints`, `effects`, `conditions`, `breakerProfile`, `remoteRole` und `targetProfiles`. `lineSupport` bleibt in AI003 Legacy-/Review-/Diagnosekontext und wird nicht zur neuen Planner-Ebene.

## Drift zur alten Doku

Einige ältere AI-Review-Artefakte beschreiben historische Zwischenstände mit 410 aktiven Hints. Der aktuelle AI003-Stand nach AI046 umfasst 564 aktive und 564 compiled Hints; beide Dateien haben denselben Card-ID-Bestand und alle compiled Hints stehen auf `ai_supported`.

AI003 folgt dem aktuellen compiled Stand und ändert weder `data/ai/ai-card-hints-active.json` noch `data/ai/ai-card-hints-compiled.json`.

## Neue Gates

Neu:

```text
corepack pnpm check:ai-strategy-taxonomy
```

Der Check validiert hart:

- Strategie-JSON ist valide.
- Strategie-IDs sind eindeutig.
- Strategie-IDs sind mit `runner.` oder `corp.` side-prefixed.
- StrategicRole-Taxonomie ist valide.
- Taxonomie-/Signaldefinitionen enthalten keine Hidden-Info- oder Runtime-Aktionsfelder.
- Aktive und compiled Hints enthalten kein manuelles `functionTags`.
- `opponentSignals` bleiben `visibleEvidenceOnly: true`.

Der Check warnt in AI003:

- Legacy-`lineSupport`-Werte,
- unmapped `roles` und `planRoles`,
- Descriptor-Gaps für spätere Function-Signal-Erweiterungen.

## Bewusste Nicht-Änderungen

AI003 hat bewusst nicht geändert:

- keine Engine-Regeln,
- keine LegalActions,
- keine Plannerwirkung,
- keine Action-Scores,
- keine PlanWeights,
- keine Profil- oder Default-Umschaltung,
- keine Decks,
- keine Hint-Massenmigration,
- keine Änderung an `data/ai/ai-card-hints-active.json`,
- keine Änderung an `data/ai/ai-card-hints-compiled.json`,
- keine Catalog-/Proteus-Baseline.

## Artefakte

Neue Contract-Dateien:

- `data/ai/strategy-goals-v1.json`
- `data/ai/strategic-roles-v1.json`
- `data/ai/function-signal-derivation-v1.json`

Neue Gate-/Testdateien:

- `scripts/check-ai-strategy-taxonomy.mjs`
- `packages/ai/src/strategy-taxonomy.test.ts`

Neue Reports:

- `docs/reviews/ai/ai003-strategy-taxonomy-report-2026-05-31.json`
- `docs/reviews/ai/ai003-strategy-taxonomy-alias-report-2026-05-31.json`

## Nächster Schritt

Der sachliche Folgeschritt wäre eine separate Migration/Normalization-Aufgabe auf Basis dieses Contracts. Diese spätere Aufgabe müsste entscheiden, welche Legacy-`lineSupport`-Werte tatsächlich zu normierten Strategieankern werden, welche nur Function-Signals bleiben und welche `strategicRole`-Werte gesetzt werden.
