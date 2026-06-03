# AI027 Derivation-/Inspector-Abgleich nach Guide V3

## Kurzfazit

AI027 ist im aktuellen Post-Commit-Stand auf `main` verifiziert. Taktiksignal-Katalog, Function-Signal-Derivation, Active/Compiled Hints und Inspector entsprechen den Guide-V3-Review-Aussagen. Es gibt keine neue Strategy ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Scope / Out-of-Scope

Scope war ein Verifikations- und Datenabgleich der bereits committed AI027-Semantik. Geprüft wurden Review-Aussagen gegen lokale Repo-Daten, generierte AI-Artefakte und Inspector-Struktur.

Out-of-Scope: neuer Kartenreview, neue Strategie-IDs, neue Runtime-/Planner-/Engine-/Legalitäts-/Targeting-/UI-Wirkung, Chronicle-Dateien und Chronicle-Skripte.

## Verwendete Quellen

- Guide V3: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`
- AI024-1, AI025-1 und AI026-1 Review- und JSON-Reports
- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`

## Post-Commit-Datenstand

- Branch: `main`
- HEAD: `ba749c64 ai: align derivations with guide v3 semantics`
- Prompt-Referenz `61cf530a` ist in der Historie enthalten, aber nicht der AI027-Commit; AI027 selbst ist `ba749c64`.
- Keine offenen Chronicle-Änderungen im Arbeitsbaum.

## Geprüfte Katalogsignale

- `damage.payoff` ist jetzt Legacy-/Aggregation-/supporting-evidence-only und deriviert nicht mehr automatisch `corp.damage_kill`.
- `access.corp_net_damage_ambush` deriviert nur noch `corp.ambush_bluff`; Damage-Kill bei Net-Damage-Ambushes bleibt card-level Review-Evidence.
- `access.corp_brain_damage_ambush` darf `corp.ambush_bluff` und `corp.damage_kill` stützen, weil es explizit Brain-Damage-Kill-Druck modelliert.
- `action.corp_repeatable_extra_action` ist support/deferred und erzeugt keine generischen Fast-Advance- oder Remote-Scoring-Anker.
- `action.corp_counter_to_action` stützt weiterhin `corp.fast_advance` für Pacifica Regional AI.
- `access.corp_hardware_trash` stützt nur noch `corp.ambush_bluff`, nicht mehr `corp.tag_trace_punish`.
- `draw.corp_draw` ist das primäre Corp-Draw-Signal; `economy.corp_draw` bleibt Legacy-/Aggregation-/support-only.
- `remote.asset_economy` bleibt für echte Economy-Assets anchorfähig, überspringt aber `remoteRole`-Einträge mit `strategyDerivation: not_for_strategy_derivation`.

## Geprüfte Derivation-Regeln

- `damage.payoff`: alle Regeln haben `strategyAnchorFor: []`.
- `access.corp_net_damage_ambush`: `strategyAnchorFor: ["corp.ambush_bluff"]`.
- `access.corp_brain_damage_ambush`: `strategyAnchorFor: ["corp.ambush_bluff", "corp.damage_kill"]`.
- `access.corp_hardware_trash`: `strategyAnchorFor: ["corp.ambush_bluff"]`.
- `action.corp_repeatable_extra_action`: `strategyAnchorFor: []`.
- `action.corp_counter_to_action`: `strategyAnchorFor: ["corp.fast_advance"]`.
- `remote.asset_economy`: respektiert `remoteRoleStrategyDerivationAbsent: ["legacy_only", "not_for_strategy_derivation"]`.
- `draw.corp_draw` und `economy.corp_draw`: keine Strategieanker.

## Geprüfte Inspector-Felder

Der Inspector trennt nun:

- `cardLevelStrategyAnchors`: geprüfte card-level Anchors aus normalisiertem `lineSupport`
- `derivedPossibleStrategyAnchors`: mögliche Anchors aus Derivation-Regeln
- `reviewedStrategySupportPairs`: lineSupport-basierte, geprüfte Strategiezuordnung
- `supportingEvidenceOnly`: support-only, Legacy-, Aggregations- und not-for-direct-scoring-Signale

Damit erscheint ein derived possible anchor nicht mehr als geprüfter StrategySupportPair. Support-only- und Legacy-Signale bleiben sichtbar, aber klar nicht primär anchornd.

Legacy-Aliase wie `etr_ice`, `protect_hq`, `protect_rnd` und `corp_score_agenda` werden klassifiziert, aber nicht als `reviewedStrategySupportPairs` verwendet. Reviewed Pairs kommen nur aus normalisiertem `lineSupport`.

## Count-Klarstellung AI025-1

AI025-1 verwendet jetzt dieselbe Metrik in Markdown und JSON: `addedSignalCount=9` besteht aus 8 lokalen AI025-1-Signalen plus dem shared Guide-V3-Signal `draw.corp_draw`.

## Beispielkarten-Ergebnisse

- Setup! hat keinen derived `corp.damage_kill`; `damage.payoff` bleibt support-only.
- Virus Test Site behält `corp.damage_kill` card-level, aber nicht durch generisches `damage.payoff`.
- Vacant Soulkiller behält `corp.damage_kill` über Brain-Damage-Evidence, nicht über Meat-Damage.
- TRAP! stützt `corp.tag_trace_punish` über Access-Tag-Ambush/Tag-Quelle, nicht über Persistent Tag.
- Remote Facility und Nevinyrral erzeugen keine derived `corp.fast_advance`- oder `corp.remote_scoring`-Anker aus generischer Extra-Action.
- Corprunner's Shattered Remains erhält keinen derived `corp.tag_trace_punish`.
- ESA Contract, Euromarket Consortium und Rustbelt HQ Branch erzeugen keinen derived `corp.asset_economy`.
- Pacifica Regional AI behält card-level `corp.fast_advance` und verliert den falschen derived `corp.asset_economy`.
- Syd Meyer Superstores, Information Laundering, Department of Truth Enhancement und South African Mining Corp behalten echte reviewed `corp.asset_economy`-Anchors.

## Stale-Snapshot-Abweichungen

Der neue Post-Commit-Prompt nennt `61cf530a` auf `codex/ai026-1-corp-node-asset-polish` als Ausgangspunkt und schreibt diesem Stand zusätzlich AI027 zu. Lokale Repo-Wahrheit: `61cf530a` ist enthalten, AI027 liegt aber im Nachfolgecommit `ba749c64` und ist nach `main` integriert.

## No-Effect-Bestätigung

AI027 bleibt read-only für AI-Daten/Inspector/Reports. Die No-Effect-Flags im JSON-Report stehen auf `false` für Planner, ActionScore, PlanWeight, Targeting-KI, Engine, Legalität, Profil-/Default-Umschaltung, UI-Derivation und Hidden-Info-Projektion.

## Verifikation

Die vollständige Verifikationsliste steht im JSON-Report `ai027-derivation-inspector-guide-v3-alignment-report-2026-06-03.json`. Der Post-Commit-Check `scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs` enthält die harten Assertions für Katalog, Derivation, Beispielkarten, Inspector-Felder, Legacy-Aliase und No-Effect-Flags.

## Risiken / Deferred

Card-spezifische Net-Damage-Kill-Derivation bleibt bewusst card-level Review-Evidence. Eine spätere feinere Derivation bräuchte zusätzliche geprüfte Signale oder sichere card-level Gates; AI027 führt dafür keine neue Strategy ID und keine Planner-Wirkung ein.
