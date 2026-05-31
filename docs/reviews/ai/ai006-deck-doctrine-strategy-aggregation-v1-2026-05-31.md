# AI006 DeckDoctrine Strategy Aggregation V1

## Aufgabe-ID

AI006

## Kurzfazit

AI006 ergänzt eine erste diagnostische Strategy-Aggregation neben der bestehenden DeckDoctrine. Der neue Builder `buildDeckStrategyProfile` berechnet pro eigenem Deck Strategy Scores, Anchor-/Support-Evidence, Support-Gaps sowie Runner- und Corp-spezifische Profile. Der Output wird nur in Tests und im neuen Gate-Report erzeugt. Planner, Action Scores, PlanWeights, Engine, LegalActions und aktive Hints bleiben unverändert.

## Bezug zu AI003 bis AI005

- AI003 liefert die 20 normierten Strategy Goals, `requiredSupport`, `supportWeights` und die Function-Signal-Derivation.
- AI003-1 härtet die Function-Signal-Ableitung side-aware; AI006 nutzt die daraus erzeugten `derivedStrategyAnchors` aus dem Inspector Index.
- AI004 klassifiziert Legacy-`lineSupport`, Rollen und Planrollen; AI006 zählt Rollen/Planrollen nur als Legacy-Signale und nutzt sie nicht allein als StrategyAnchor.
- AI005 erzeugt `data/ai/ai-hint-inspector-index.json`; AI006 liest dieses read-only Artefakt für Function-Signals, StrategyAnchors und Warnungen.

## Bestehender DeckDoctrine-Iststand

`packages/ai/src/deck-doctrine.ts` erzeugt bisher `AiDeckDoctrineProfile` aus einem eigenen `AiDeckDoctrineDeckSnapshot`. Das Profil zählt Rollen, berechnet Rollendichten, Archetype-Tags, PlanWeights, MulliganWeights, RiskFlags, Confidence und Evidenz.

Genutzte Daten heute:

- `data/ai/card-role-manifest-0.9.json`
- `data/ai/ai-card-hints-compiled.json`
- Runtime-Katalog über `createRuntimeCardsById()`
- eigener Decksnapshot mit `deckSnapshotId`, `side`, optionaler Public Metadata und Kartenmengen

DeckDoctrine zählt heute `roles` und `planRoles` direkt: `rolesForCard` kombiniert Card-Role-Manifest, compiled Hint `roles`, compiled Hint `planRoles` und einfache Runtime-Inferenzen. `lineSupport` wird im bisherigen `buildDeckDoctrineProfile` nicht genutzt.

Die bestehende Ausgabe ist `AiDeckDoctrineProfile` mit `roleCounts`, `roleDensity`, `archetypeTags`, `planWeights`, `mulliganWeights`, `riskFlags` und `evidence`.

Runtime-/Plannerwirkung heute:

- `buildAiDecisionInput` kann aus `ownDeckSnapshot` ein `ownDeckDoctrine` erzeugen.
- Runner- und Corp-Plans lesen `ownDeckDoctrine.planWeights` und skalieren sie confidence-bounded als `doctrinePlanWeight`.
- Mulligan- und Discard-Auswertungen nutzen bestehende Doctrine-Tags/PlanWeights.
- DecisionDebug zeigt nur redigierte Doctrine-Zusammenfassungen.

AI006 knüpft daneben an: `buildDeckStrategyProfile` ist ein separater Diagnose-Builder und wird nicht von `buildAiDecisionInput`, Runner-Plans oder Corp-Plans konsumiert.

## Neue diagnostische Strategy-Aggregation

Neuer Output: `AiDeckStrategyProfile` mit:

- `deckId`, `side`, `cardCount`
- `strategyScores` für alle 10 Side-Strategien
- `primaryStrategies`, `secondaryStrategies`
- `functionSignalCounts`
- `legacySignalCounts`
- `warnings`
- Runner-spezifischem oder Corp-spezifischem Profil

Anchor-Evidence kommt nur aus stabilen Quellen:

- `derivedStrategyAnchors` aus `ai-hint-inspector-index.json`
- validem, side-passendem `lineSupport` mit normierter Strategy-ID oder AI004-safe Alias
- zukünftigem `strategicRole`, aber nur als Verstärkung eines bereits vorhandenen gültigen Strategiebezugs

Legacy-`roles` und `planRoles` werden gezählt, erzeugen aber keinen Anchor.

## Scoringformel

`anchorScore` ist ein capped Score aus Anchor-Evidence:

- `derivedStrategyAnchor`: 32 Punkte pro Kopie
- `lineSupport`: 28 Punkte pro Kopie
- `strategicRole`: 12 Punkte pro Kopie als Verstärkung
- Maximum: 100

`supportScore` ist der gewichtete Durchschnitt der Strategy-`supportWeights`. Jede Support-Dimension wird aus Function-Signal-Counts, Kartentypen und klaren compiled Hint-Feldern berechnet. Beispiele: Breaker-Coverage, Economy, Search/Draw, ICE, AgendaDensity, RemoteProtection, TagSource, PunishPayoff, RezReserve.

`finalScore` ist diagnostisch:

- Standard: `anchorScore * 0.6 + supportScore * 0.4`
- `structural_density`: `anchorScore * 0.35 + supportScore * 0.65`
- `support_requirement`: `anchorScore * 0.45 + supportScore * 0.55`

Diese Werte werden nicht in PlanWeights oder Action Scores übernommen.

## Runner-Aggregation

Für Runner werden alle 10 Runner-Ziele bewertet:

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

Zusätzlich berechnet AI006:

- CoverageProfile: Wall, Code Gate, Sentry, Universal, Special, Searchable-Status
- EconomyProfile: generic, burst, recurring, finite, risky, action-based
- SetupProfile: search, draw, recovery, install support, memory/hand-size soweit belegt
- PressureProfile: R&D, HQ, remote, archives als unbekannt wenn nicht ableitbar
- DefenseProfile: tag, trace, damage, program trash soweit belegt

## Corp-Aggregation

Für Corp werden alle 10 Corp-Ziele bewertet:

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

Zusätzlich berechnet AI006:

- ICEProfile: ETR, trace, tag, damage, program trash, future encounter, tax/run cost
- ScoreProfile: score acceleration, agenda install/advance/score support, remote scoring protection, steal tax
- EconomyProfile: operation economy, asset economy, rez support, recurring, finite
- PunishProfile: tag sources, tag payoff, damage payoff, trace density
- RemoteProfile: scoring protection, ambush, asset economy, region/city-grid/upgrade support soweit ableitbar

## Beispieldeck-Befunde

Der Report analysiert fünf bestehende Snapshot-Decks:

- `king_of_the_road_runner_ai_snapshot_v1`
- `onr_origin_runner_ai_snapshot_v1`
- `onr_origin_runner_ai_event_pressure_snapshot_v1`
- `onr_origin_corp_ai_snapshot_v1`
- `onr_origin_corp_ai_tag_ops_snapshot_v1`

Wichtige Befunde:

- `onr_origin_runner_ai_snapshot_v1`: primär `runner.interface_closeout`, `runner.rnd_pressure`, `runner.hq_pressure`; R&D-/HQ-Multiaccess liefert Anchor-Evidence.
- `onr_origin_runner_ai_event_pressure_snapshot_v1`: primär `runner.rig_first`, `runner.economy_first`, `runner.hq_pressure`; starkes Supportprofil, weniger direkte R&D-Anker.
- `king_of_the_road_runner_ai_snapshot_v1`: primär Rig/Economy; Gap `missing_wall_coverage`.
- `onr_origin_corp_ai_snapshot_v1`: primär `corp.central_stabilize`, `corp.ice_tax_glacier`, `corp.tag_trace_punish`; Remote-Scoring bleibt sekundär mit Evidence aus Data Masons und Antiquated Interface Routines.
- `onr_origin_corp_ai_tag_ops_snapshot_v1`: primär `corp.tag_trace_punish`, `corp.central_stabilize`, `corp.ice_tax_glacier`; Tag-Source plus Payoff ist vollständig gestützt.

## SupportGaps

AI006 erzeugt erste diagnostische Gaps, unter anderem:

- Runner: `missing_wall_coverage`, `weak_sentry_coverage`, `low_economy_support`, `no_search_support`, `weak_tag_damage_defense`
- Corp: `low_rez_economy`, `insufficient_etr_ice`, `weak_remote_protection`, `low_tag_sources`, `payoff_without_enablers`

Die Gaps bewerten nur Deckstruktur, keine Boardstate-Reachability.

## Legacy-Nutzung

Legacy-`roles`, `planRoles` und `lineSupport` werden in `legacySignalCounts` sichtbar gezählt. `roles` und `planRoles` erzeugen nicht allein StrategyAnchors. Legacy-/safe-klassifiziertes `lineSupport` wird nur verwendet, wenn es side-passend auf ein gültiges StrategyGoal abbildet; normale ICE werden dabei nicht automatisch zu `corp.remote_scoring`-Ankern.

## Tests und Gate

Ergänzt:

- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/deck-doctrine-strategy.test.ts`
- `scripts/check-ai-deck-doctrine-strategy.ts`
- Root-Script `corepack pnpm check:ai-deck-doctrine-strategy`
- Report `docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json`

Das Gate prüft:

- Beispieldecks werden analysiert.
- 10 Side-Strategien pro Deck werden erzeugt.
- Output ist deterministisch.
- Forbidden Hidden-/Runtime-Keys fehlen.
- Legacy-`roles`/`planRoles` erzeugen keinen Anchor.
- Anchor-Evidence nutzt nur stabile Quellen.
- Runner-/Corp-Planner und `buildAiDecisionInput` konsumieren den neuen Profiltyp nicht.

## Bewusst nicht geändert

- keine Plannerwirkung
- keine Action Scores
- keine PlanWeight-Änderung
- keine Engine- oder Legalitätswirkung
- keine Hintmigration
- keine Änderung an `ai-card-hints-active.json`
- keine Änderung an `ai-card-hints-compiled.json`
- keine UI in AI006
- keine Catalog-/Proteus-Baseline-Korrektur

## Bekannte Grenzen

- keine Boardstate-Bewertung
- keine Reachability
- keine Runtime-Taktik
- keine UI
- SupportScores sind V1-Diagnosewerte und noch keine Balancing- oder Planner-Quelle
- einzelne Descriptor-Gaps bleiben sichtbar, statt durch Heuristik geraten zu werden

## Nächster sachlicher Schritt

Ein Viewer oder eine kontrollierte Runtime-Nutzung kann später auf diesem Diagnoseprofil aufsetzen. Ein Cutover müsste dann getrennt gegatet werden: erst ViewModel/Trace-Verbrauch, danach optional profile-gated Planner-Experimente mit separaten Action-Score- und Safety-Gates.
