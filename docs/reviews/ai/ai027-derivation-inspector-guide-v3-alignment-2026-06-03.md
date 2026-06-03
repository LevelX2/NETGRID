# AI027 Derivation-/Inspector-Abgleich nach Guide V3

## Kurzfazit

AI027 gleicht Taktiksignal-Katalog, Function-Signal-Derivation und AI-Hint-Inspector an Guide V3 an. Es ist kein neuer Kartenreview: Karten-Hints wurden nur dort mit Legacy-Metadaten ergänzt, wo bestehende `remoteRole.asset_economy`-Felder geprüften AI026-1-Entscheidungen widersprochen haben. Es gibt keine neue Strategy ID und keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.

## Quellen

- Guide V3: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`
- AI024-1, AI025-1 und AI026-1 Review- und JSON-Reports
- `data/ai/tactic-signals-v1.json`
- `data/ai/function-signal-derivation-v1.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`

## Korrekturen

- `damage.payoff` ist jetzt Legacy-/Aggregation-/supporting-evidence-only und deriviert nicht mehr automatisch `corp.damage_kill`.
- `access.corp_net_damage_ambush` deriviert nur noch `corp.ambush_bluff`; Damage-Kill bei Net-Damage-Ambushes bleibt card-level Review-Evidence.
- `action.corp_repeatable_extra_action` ist support/deferred und erzeugt keine generischen Fast-Advance- oder Remote-Scoring-Anker.
- `access.corp_hardware_trash` stützt nur noch `corp.ambush_bluff`, nicht mehr `corp.tag_trace_punish`.
- `remote.asset_economy` überspringt `remoteRole`-Einträge mit `strategyDerivation: not_for_strategy_derivation`.
- ESA Contract, Euromarket Consortium, Rustbelt HQ Branch und Pacifica Regional AI tragen diese Legacy-Markierung, damit Draw, Hand Size und Score-Conversion nicht als Corp-Asset-Economy-Strategie deriviert werden.

## Inspector-Trennung

Der Inspector trennt nun:

- `cardLevelStrategyAnchors`: geprüfte card-level Anchors aus normalisiertem `lineSupport`
- `derivedPossibleStrategyAnchors`: mögliche Anchors aus Derivation-Regeln
- `reviewedStrategySupportPairs`: lineSupport-basierte, geprüfte Strategiezuordnung
- `supportingEvidenceOnly`: support-only, Legacy-, Aggregations- und not-for-direct-scoring-Signale

Damit erscheint ein derived possible anchor nicht mehr als geprüfter StrategySupportPair. Support-only- und Legacy-Signale bleiben sichtbar, aber klar nicht primär anchornd.

## Count-Klarstellung AI025-1

AI025-1 verwendet jetzt dieselbe Metrik in Markdown und JSON: `addedSignalCount=9` besteht aus 8 lokalen AI025-1-Signalen plus dem shared Guide-V3-Signal `draw.corp_draw`.

## Ergebnisbeispiele

- Setup! hat keinen derived `corp.damage_kill`; `damage.payoff` bleibt support-only.
- Virus Test Site behält `corp.damage_kill` card-level, aber nicht durch generisches `damage.payoff`.
- Remote Facility und Nevinyrral erzeugen keine derived `corp.fast_advance`- oder `corp.remote_scoring`-Anker aus generischer Extra-Action.
- Corprunner's Shattered Remains erhält keinen derived `corp.tag_trace_punish`.
- ESA Contract, Euromarket Consortium und Rustbelt HQ Branch erzeugen keinen derived `corp.asset_economy`.
- Pacifica Regional AI behält card-level `corp.fast_advance` und verliert den falschen derived `corp.asset_economy`.

## Verifikation

Die vollständige Verifikationsliste steht im JSON-Report `ai027-derivation-inspector-guide-v3-alignment-report-2026-06-03.json`.

## Risiken / Deferred

Card-spezifische Net-Damage-Kill-Derivation bleibt bewusst card-level Review-Evidence. Eine spätere feinere Derivation bräuchte zusätzliche geprüfte Signale oder sichere card-level Gates; AI027 führt dafür keine neue Strategy ID und keine Planner-Wirkung ein.
