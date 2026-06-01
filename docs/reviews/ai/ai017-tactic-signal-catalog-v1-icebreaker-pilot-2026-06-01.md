# AI017 Taktiksignal-Katalog V1 und Icebreaker-Kartenpilot

Aufgabe-ID: AI017

## Kurzfazit

AI017 führt mit `data/ai/tactic-signals-v1.json` einen kontrollierten Taktiksignal-Katalog V1 ein. Der Katalog umfasst 68 eindeutige Signale in 29 Gruppen und deckt alle aktuell ableitbaren Function-/Taktiksignale aus `data/ai/function-signal-derivation-v1.json` ab.

Als erster Kartenklassen-Pilot wurden fünf Runner-Programme mit ICE-/Breaker-Bezug bearbeitet: `Black Widow`, `Bartmoss Memorial Icebreaker`, `Morphing Tool`, `Clown` und `Airport Locker`. Die Änderungen ergänzen fehlende Taktiksignale und eindeutige `strategicRole`-Werte, erzwingen aber keine neuen Strategieanker, keine unsicheren TargetProfiles und keine Plannerwirkung.

Keine Engine-Regeln, LegalActions, Action Scores, PlanWeights, Profile, Defaults, Catalog-/Proteus-Baselines oder UI-Derivationslogik wurden geändert.

## Ebenentrennung

AI017 trennt drei Ebenen ausdrücklich:

- Taktiksignal: funktionale Leistung einer Karte, zum Beispiel `breaker.sentry`, `breaker.risky`, `ice.strength_reduction` oder `setup.install_support`.
- Strategieanker: große Decklinie, die eine Karte belegt oder trägt, zum Beispiel `runner.breaker_search` oder `corp.remote_scoring`.
- TargetProfile / ChoiceProfile: sinnvolle Ziel- oder Choice-Auswahl bei Nutzung einer Karte, zum Beispiel welches installierte ICE `Black Widow` wählen sollte.

Taktiksignale dürfen Strategy Anchors nur über explizit katalogisierte, restriktive Regeln auslösen. Support-only-Signale bleiben reine Diagnose-/Funktionssignale.

## Katalog V1

Neue Datei:

- `data/ai/tactic-signals-v1.json`

Katalogumfang:

| Kennzahl | Wert |
| --- | ---: |
| Taktiksignale | 68 |
| Signalgruppen | 29 |
| StrategyAnchor-fähige Signale | 31 |
| Support-only-Signale | 37 |
| `anti.ice.*`-Signale | 0 |

Definierte Signalgruppen:

- `access_multiaccess`
- `ambush_access_punish`
- `breaker_coverage`
- `breaker_flexible_coverage`
- `breaker_risk`
- `breaker_search_install`
- `breaker_support`
- `breaker_targeted_bonus`
- `corp_ice_modifier`
- `corp_ice_tax`
- `corp_remote_ambush`
- `corp_remote_economy`
- `corp_remote_scoring`
- `corp_score_acceleration`
- `corp_scored_utility`
- `corp_tag_trace_punish`
- `damage_kill`
- `economy`
- `economy_rez_support`
- `economy_trace_support`
- `information`
- `information_central`
- `remote_tax`
- `remote_trash_economy`
- `runner_defense`
- `runner_ice_efficiency_support`
- `runner_run_tempo`
- `setup_draw_search`
- `setup_install`

Neue oder für AI017 präzisierte Signale:

- `breaker.configurable_coverage`
- `breaker.reconfigurable_type`
- `breaker.emergency_coverage`
- `breaker.targeted_ice_bonus`
- `breaker.strength_bonus_vs_chosen_ice`
- `breaker.risky`
- `breaker.self_trash_risk`
- `breaker.support`
- `breaker.search_during_encounter`
- `breaker.emergency_search`
- `setup.install_support`
- `ice.strength_reduction`
- `run.break_cost_support`

`anti.ice.sentry`, `anti.ice.wall` und `anti.ice.code_gate` werden bewusst nicht eingeführt. Der Katalog trennt stattdessen Breaker-Coverage, Search/Install, Risiko, Strength-Reduction, Breakkosten-Support und ICE-Modifikatoren.

## Ableitungsregeln

`data/ai/function-signal-derivation-v1.json` wurde auf AI017 aktualisiert und um generische, side-/scope-aware Quellen erweitert:

- `breakerProfile`
- `breakerProfile.sideEffects`

Neue oder erweiterte Derivationen:

- Runner-Programme mit `breakerProfile.configurableCoverage` erhalten `breaker.configurable_coverage`.
- Runner-Programme mit `breakerProfile.reconfigurableType` erhalten `breaker.reconfigurable_type`.
- Runner-Programme mit `breakerProfile.emergencyCoverage` erhalten `breaker.emergency_coverage`.
- Runner-Programme mit `breakerProfile.targetedIceBonus` erhalten `breaker.targeted_ice_bonus`.
- Runner-Programme mit `breakerProfile.strengthBonusVsChosenIce` erhalten `breaker.strength_bonus_vs_chosen_ice`.
- Breaker mit `random_failure` erhalten `breaker.risky`.
- Breaker mit `program_trash_risk` erhalten `breaker.self_trash_risk`.
- Runner-Programme mit Search während eines ICE-Encounters erhalten `breaker.search_during_encounter` und `breaker.emergency_search`.
- Runner-Programme mit Install-Support für Programme erhalten `setup.install_support`.
- Runner-Programme mit ICE-Stärkereduktion erhalten `ice.strength_reduction`, `run.break_cost_support` und `breaker.support`.

Die Derivationsdatei enthält jetzt 79 Regeln und 68 kontrollierte Signal-IDs.

## Icebreaker-Pilot

### Black Widow

Mechanik: Sentry-Breaker mit Bonus gegen ein beim Installieren gewähltes ICE.

| Feld | Vor AI017 | Nach AI017 |
| --- | --- | --- |
| Taktiksignale | `breaker.sentry` | `breaker.sentry`, `breaker.targeted_ice_bonus`, `breaker.strength_bonus_vs_chosen_ice` |
| Strategieanker | keiner | keiner |
| `strategicRole` | keiner | keiner |
| TargetProfile | nötig, Schema nicht passend | Vorschlag im Report, keine Runtime-Struktur |
| Human Review | beibehalten | beibehalten |

TargetProfile-Vorschlag: `install_target` auf installiertes ICE, bevorzugt bekannte oder rezte relevante Sentries, hohe Stärke oder hohe Breakkosten ohne Bonus. Hidden-Info-Policy: nur sichtbare oder bekannte ICE.

### Bartmoss Memorial Icebreaker

Mechanik: Universal-Breaker mit zufallsbasierter Fehlschlag-/Trash-Gefahr.

| Feld | Vor AI017 | Nach AI017 |
| --- | --- | --- |
| Taktiksignale | `breaker.universal` | `breaker.universal`, `breaker.risky`, `breaker.self_trash_risk` |
| Strategieanker | keiner | keiner |
| `strategicRole` | keiner | `emergency_tool` |
| TargetProfile | nicht nötig | nicht nötig |
| Human Review | bereits nicht nötig | unverändert |

`breaker.emergency_coverage` wurde als Katalogsignal definiert, für diese Karte aber nicht gesetzt. Bartmoss ist riskante Universal-Coverage, nicht automatisch ein dediziertes Emergency-Coverage-Fact.

### Morphing Tool

Mechanik: Reconfigurable Breaker, der ICE-Typen flexibel abdecken kann, aber nicht gleichzeitig alle Typen als Universal-Breaker deckt.

| Feld | Vor AI017 | Nach AI017 |
| --- | --- | --- |
| Taktiksignale | `breaker.unknown_special` | `breaker.unknown_special`, `breaker.configurable_coverage`, `breaker.reconfigurable_type` |
| Strategieanker | keiner | keiner |
| `strategicRole` | keiner | keiner |
| TargetProfile / ChoiceProfile | nötig, Schema nicht passend | Vorschlag im Report, keine Runtime-Struktur |
| Human Review | beibehalten | beibehalten |

`breaker.unknown_special` bleibt als generierter Descriptor erhalten, weil die Generated-Fact-Quelle noch `coverage=["unknown_special"]` liefert. AI017 ergänzt die präziseren Signale, entfernt aber keine Baseline- oder Generated-Fact-Historie.

ChoiceProfile-Vorschlag: `mode_choice` für ICE-Typ, bevorzugt Typen, die den aktuellen relevanten Runpath blockieren, bekannte Problem-ICE betreffen oder in der aktuellen Rig fehlen. Hidden-Info-Policy: nur sichtbare oder bekannte ICE.

### Clown

Mechanik: Runner-Programm, das ICE-Stärke reduziert und damit Breakkosten indirekt senkt.

| Feld | Vor AI017 | Nach AI017 |
| --- | --- | --- |
| Taktiksignale | keine | `ice.strength_reduction`, `run.break_cost_support`, `breaker.support` |
| Strategieanker | keiner | keiner |
| `strategicRole` | keiner | `support_tool` |
| TargetProfile | nicht nötig | nicht nötig |
| Human Review | beibehalten | beibehalten |

Clown bleibt bewusst ein Support-Tool ohne Strategieanker, weil die Karte keine eigene große Decklinie belegt.

### Airport Locker

Mechanik: Runner-Tool, das während eines ICE-Encounters ein Programm sucht und installiert.

| Feld | Vor AI017 | Nach AI017 |
| --- | --- | --- |
| Taktiksignale | `setup.search` | `setup.search`, `setup.install_support`, `breaker.search_during_encounter`, `breaker.emergency_search` |
| Strategieanker | `runner.breaker_search` | `runner.breaker_search` |
| `strategicRole` | `engine_anchor` | `engine_anchor` |
| TargetProfile | vorhandenes Basic-TargetProfile für Stack/Program/Install | beibehalten, zusätzlicher Vorschlag im Report |
| Human Review | beibehalten | beibehalten |

Das vorhandene TargetProfile bleibt innerhalb des bestehenden Schemas: `zone=stack`, `targetCardType=program`, `installsTarget=true`, `installCost=normal`, `shuffleAfter=true`.

Zusätzlicher TargetProfile-Vorschlag: `search_install_target` während ICE-Encounter, bevorzugt Programme, die das aktuelle ICE beantworten, fehlende Coverage reparieren, nach Install bezahlbar bleiben und das Runziel erhalten. Hidden-Info-Policy: nur sichtbare oder für das aktuelle ICE bekannte Informationen.

## Deferred Karten

Diese Karten wurden als Vergleichsfälle eingeordnet, aber nicht im AI017-Pilot migriert:

- `False Echo`: spätere Klasse für Bypass-/Runpath-/Encounter-Interaktion.
- `Pox`: spätere Klasse für Damage-/Virus-/Runner-Pressure-Effekte.
- `Doppelganger Antibody`: spätere Klasse für Ambush-/Access-Punish-/Runner-Tax; AI016 deckt die Grundsignale bereits ab.

Weitere einfache Breaker oder Breaker-Credit-Programme wurden nicht massenhaft migriert. Vorhandene Coverage- und Economy-Signale reichen dort zunächst aus; AI017 bleibt bewusst beim engen Pilot.

## TargetProfiles

AI017 ergänzt keine neue TargetProfile-Runtime-Struktur. Das bestehende `targetProfiles`-Schema passt für einfache Stack-/Program-Search-und-Install-Fälle, aber nicht für:

- installierte ICE-Zielwahl bei `Black Widow`
- ICE-Typ-/Mode-Choice bei `Morphing Tool`
- vollständige Search-Install-Zielbewertung während eines aktuellen ICE-Encounters bei `Airport Locker`

Diese Profile sind im Report als Vorschläge dokumentiert. Es gibt keine neue Targeting-KI, keine Hidden-Info-Nutzung und keine Plannerwertung.

## Inspector und DeckDoctrine

Diagnostische Wirkung nach Neubau:

| Kennzahl | Wert |
| --- | ---: |
| Karten im Inspector | 564 |
| Karten mit mechanischen Facts | 392 |
| Karten mit Generated Facts | 314 |
| Karten mit Overlays | 6 |
| Karten mit Taktiksignalen | 345 |
| Karten mit Strategy Anchors | 236 |
| Karten mit Warnings | 353 |

Der AI Hint Inspector zeigt die neuen Taktiksignale und den Katalogpfad in den Source-Metadaten. DeckDoctrine bleibt diagnostisch und erhält keine neue Runtime- oder Planner-Verbrauchsstelle.

## Tests

Ergänzt wurden Tests für:

- Laden und Validieren des Taktiksignal-Katalogs.
- Eindeutige Taktiksignal-IDs.
- Pflichtfelder, Gruppen, Beschreibungen und `sideScope`.
- Konsistenz zwischen Derivationsregeln und Katalog.
- StrategyAnchor-fähige Signale mit erlaubten Strategy Anchors.
- Support-only-Signale ohne Strategy Anchors.
- Verbot statischer `anti.ice.*`-Signale.
- AI017-Smoke-Fälle für Black Widow, Bartmoss, Morphing Tool, Clown und Airport Locker.
- Hidden-Info-Grenzen im serialisierten Inspector-/Katalogvertrag.
- Inspector-Source-Metadaten für `data/ai/tactic-signals-v1.json`.

## Bewusst nicht geändert

- Keine Plannerwirkung.
- Keine Action-Score-Änderung.
- Keine PlanWeight-Änderung.
- Keine Engine- oder Legalitätsänderung.
- Keine Profil-/Default-Umschaltung.
- Keine Catalog-/Proteus-Baseline-Korrektur.
- Keine Massenmigration aller Breaker oder Programme.
- Keine neuen Strategy IDs.
- Keine manuellen `functionTags`.
- Keine Ableitung allein aus `roles` oder `planRoles`.
- Keine Hidden-Info-Nutzung.
- Keine React-/UI-Derivationslogik.
- Keine vollständige Targeting-KI.

## Aktualisierte Artefakte

- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `scripts/check-ai-strategy-taxonomy.mjs`
- `scripts/build-ai-hint-inspector-index.mjs`
- `packages/ai/src/hint-ontology.ts`
- `packages/ai/src/strategy-taxonomy.test.ts`
- `packages/ai/src/ai-hint-inspector-index.test.ts`
- `docs/reviews/ai/ai017-tactic-signal-catalog-v1-icebreaker-pilot-report-2026-06-01.json`
- Deterministisch aktualisierte Diagnoseberichte:
  - `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`
  - `docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json`
  - `docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json`

## Checks

Grün:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- `git diff --check`
- `git diff --cached --check`
