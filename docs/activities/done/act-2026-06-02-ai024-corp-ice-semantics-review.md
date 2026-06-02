---
activityId: act-2026-06-02-ai024-corp-ice-semantics-review
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-02
completedAt: 2026-06-02
branch: codex/ai022-1-tactic-signal-cleanup
releaseTarget:
blockedBy:
  - AI023 must be complete before AI024 starts
resultArtifacts:
  - data/ai/tactic-signals-v1.json
  - data/ai/function-signal-derivation-v1.json
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
  - data/ai/ai-derived-basic-facts-full-cards-2026-05-25.json
  - docs/reviews/ai/ai024-corp-ice-semantics-review-2026-06-02.md
  - docs/reviews/ai/ai024-corp-ice-semantics-review-report-2026-06-02.json
  - docs/reviews/ai/README.md
  - docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json
  - docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json
  - docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-alias-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json
  - docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json
  - docs/reviews/ai/aufgabe-042-compiled-hint-runtime-full-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json
  - scripts/apply-ai024-corp-ice-semantics.mjs
  - scripts/check-ai024-corp-ice-semantics.mjs
  - packages/ai/src/hint-ontology-doctrine.test.ts
  - packages/ai/src/hint-ontology.test.ts
  - packages/ai/src/strategy-taxonomy.test.ts
checks:
  - node scripts/apply-ai024-corp-ice-semantics.mjs
  - node scripts/check-ai024-corp-ice-semantics.mjs
  - node scripts/check-ai-derived-facts.mjs --write
  - node scripts/check-ai-derived-facts-full.mjs --write
  - corepack pnpm build:ai-compiled-hints
  - corepack pnpm build:ai-hint-inspector-index
  - node scripts/check-ai-hint-compiled-index.mjs --write
  - corepack pnpm check:ai-strategy-taxonomy
  - corepack pnpm check:ai-hint-quality
  - corepack pnpm check:ai-approval-consistency
  - corepack pnpm check:ai-deck-doctrine-strategy
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-inspector-index
  - corepack pnpm check:ai-hint-compiled-index
  - corepack pnpm check:ai-manual-overlays
  - corepack pnpm check:ai-derived-facts
  - corepack pnpm check:ai-derived-facts-full
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit
  - corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit
  - git diff --check
---

# AI024: Corp ICE Semantics Review

## Ziel

Alle aktiven/compiled Korp-ICE-Karten aus Classic/Originalset und Proteus sollen inventarisiert, fachlich geprüft und mit kontrollierten read-only-Taktiksignalen versehen werden. Strategieanker werden nur gesetzt, wenn ein ICE eine echte Decklinie trägt, wesentlich ermöglicht, einen klaren Payoff darstellt oder als Schlüsselkarten-/Survival-Baustein fungiert.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI024 – Corp ICE Semantics Review`.
- Voraussetzung: AI018/AI018c Icebreaker-Semantik, AI019 Runner Program Semantics Review, AI020 Runner Hardware Semantics Review, AI021 Runner Prep Semantics Review, AI022 Runner Resources Semantics Review und AI023 Corp Agenda Semantics Review sind umgesetzt.
- Falls AI023 noch nicht umgesetzt ist, AI024 nicht mit Agenda-Arbeit vermischen, sondern zuerst AI023 abschließen.
- Arbeitswunsch aus Auftrag: auf `main` arbeiten, vorher Worktree prüfen und sauber halten.
- Relevante Artefakte:
  - `data/ai/tactic-signals-v1.json`
  - `data/ai/function-signal-derivation-v1.json`
  - `data/ai/ai-card-hints-active.json`
  - relevante manual overlays
  - `data/ai/ai-card-hints-compiled.json`
  - `data/ai/ai-hint-inspector-index.json`
  - `docs/reviews/ai/README.md`, falls vorhanden
  - bestehende AI018- bis AI023-Review- und Check-Artefakte

## Scope

- Alle aktiven/compiled Korp-ICE-Karten aus Classic/Originalset und Proteus aus Repo-Daten ableiten; keine Spoilerzahlen hart kodieren.
- Zusätzlich inaktive oder bekannte Korp-ICE-Karten erfassen, falls sie im Spoiler oder Repo vorhanden, aber nicht active/compiled sind.
- Classic-Spoiler-Referenz: 60 Korp-ICE. Proteus-Spoiler-Referenz: 35 Korp-ICE. Bei Abweichungen zwischen Repo-Inventar, Spoiler-Header und extrahierter Kartenliste die Abweichung im Report dokumentieren und die aktive/compiled Repo-Wahrheit als maßgeblich verwenden.
- ICE in mechanische Familien einteilen, unter anderem:
  - `vanilla_end_run`
  - `multi_end_run`
  - `conditional_end_run_or_trace_end_run`
  - `net_damage_ice`
  - `brain_damage_ice`
  - `meat_damage_ice`
  - `access_or_encounter_punish`
  - `tag_source_or_trace_tag`
  - `tag_counter_or_persistent_tag`
  - `program_trash`
  - `hardware_trash`
  - `run_lock_or_action_tax`
  - `jackout_lock_or_jackout_tax`
  - `encounter_tax_or_break_cost_tax`
  - `future_ice_strength_buff`
  - `future_ice_subroutine_or_break_restriction`
  - `position_or_outer_ice_scaling`
  - `rez_paid_scaling`
  - `rez_economy`
  - `type_choice_or_mode_choice`
  - `mobile_or_position_changing_ice`
  - `self_bounce_or_maintenance_drawback`
  - `random_or_guessing_game`
  - `other_ice_utility`
- ICE-Subtypen als Kartendaten, Traits, Constraints oder Targeting-Fakten im Report sichtbar halten, aber nicht als Taktiksignale spiegeln.
- Bestehende Taktiksignale aus AI018 bis AI023 zuerst prüfen und nur wiederverwenden, wenn Funktion, Wirkungsrichtung und SideScope passen.
- Falls neue Korp-ICE-Signale nötig sind, bevorzugt die Signalgruppe `corp_ice.*` verwenden, sofern die bestehende Katalogkonvention nicht eindeutig etwas anderes vorgibt.
- Neue Signale im Katalog erfassen, mit sideScope `corp`, korrektem `supportOnly`/`mayAnchorStrategy` und ohne Planner-, Targeting- oder Legalitätswirkung.
- Vollständige Post-Review-Liste für alle aktiven/compiled Korp-ICE-Karten erzeugen, nicht nur Deltas.
- Markdown-Review erzeugen: `docs/reviews/ai/ai024-corp-ice-semantics-review-2026-06-02.md`.
- JSON-Report erzeugen: `docs/reviews/ai/ai024-corp-ice-semantics-review-report-2026-06-02.json`.
- Falls `docs/reviews/ai/README.md` existiert, den AI024-Eintrag ergänzen.

## Leitplanken

- Die Engine bleibt Regelautorität; die KI erzeugt keine Legalität.
- Neue Semantik bleibt read-only, bis die Action-Semantik-Brücke zuverlässig vorhanden ist.
- Keine Plannerwirkung, keine ActionScore-Änderung, keine PlanWeight-Änderung, keine Engine-Änderung, keine Legalitätsänderung, keine Targeting-KI und keine Profil-/Default-Umschaltung.
- Keine UI-Derivationslogik außer regenerierten Inspector-/Reviewdaten.
- Keine großen Runtime- oder Schema-Migrationen.
- Keine freien, unkatalogisierten oder kartenspezifischen Taktiksignale wie `ice.data_raven` oder `ice.wall_of_ice`.
- Keine generische `corp.ice`-, `corp.sentry`-, `corp.code_gate`-, `corp.wall`-, `corp.ap`- oder `corp.black_ice`-Strategie.
- Keine Runner-Strategie aus Korp-ICE ableiten.
- Keine Hidden-Info-Leaks: Runner-KI darf keine konkrete Semantik von unrezzed/unknown Korp-ICE erhalten.
- Positive Effekte und Drawbacks getrennt modellieren.
- Support ist keine Strategie, Kartenfamilie ist keine Strategie und Cluster ersetzt kein Signal.
- Kartentext schlägt Name, Subtyp und Cluster.

## Nicht im Scope

- Keine fachliche Migration von Korp-Agenden, Korp-Operationen, Korp-Nodes, Korp-Upgrades oder Runner-Karten.
- Keine Runner-Icebreaker-Coverage-Migration und kein Umbau der AI018/AI018c-Icebreaker-Semantik.
- Keine vollständige LegalAction Semantic Bridge.
- Kein Planner- oder Runtime-Verbrauch neuer ICE-Signale.
- Keine neue generische ICE-Strategie.
- Keine Entfernung von Legacy-Feldern.
- Keine Änderung am Action-Selection-Verhalten.
- Keine Änderung an Hidden-Info-, Visibility-, Engine-, Replay-, StateHash- oder LegalAction-Regeln.

## Verbotene Subtyp-only-Signale

Folgende Eigenschaften bleiben Kartendaten, Subtypen, Constraints, Targeting-Fakten oder Breaker-Matching-Fakten, aber keine Taktiksignale:

- `Sentry`
- `Code Gate`
- `Wall`
- `AP`
- `Killer`
- `Black Ice`
- `Hellbolt`
- `Brainwipe`
- `Watchdog`
- `Pit Bull`
- `Bloodhound`
- `Worm`
- `Zombie`
- `Sword`
- `Hellhound`
- `Firestarter`
- `Knockout`
- `Stun`

Nicht einführen:

- `corp_ice.sentry`
- `corp_ice.code_gate`
- `corp_ice.wall`
- `corp_ice.ap`
- `corp_ice.black_ice`
- `corp_ice.killer`
- `corp_ice.watchdog`
- `corp_ice.pit_bull`
- `corp_ice.bloodhound`
- `corp_ice.hellhound`
- `corp_ice.hellbolt`
- `corp_ice.brainwipe`
- `corp_ice.zombie`
- `corp_ice.firestarter`
- `corp_ice.sword`
- `corp_ice.knockout`
- `corp_ice.stun`
- `corp_ice.random`
- `corp_ice.flatline`
- `corp_ice.dec_krash`

## Erwartete Signal- und Entscheidungsfamilien

- Basic/vanilla ETR-ICE erhalten funktionale ETR-Signale wie `corp_ice.end_run`, aber keine Strategieanker.
- Conditional/pay ETR-ICE erhalten bei passendem Kartentext zusätzliche Signale wie `corp_ice.conditional_end_run` oder `corp_ice.runner_pay_or_end_run`.
- Multi-ETR und Heavy Stopper erhalten `corp_ice.multi_end_run` und werden als ICE-Tax-/Glacier- oder Remote-Defense-Kandidaten geprüft, aber nicht automatisch geankert.
- Net-/Brain-/Meat-Damage-ICE erhalten passende Damage-Signale; Damage/Kill-Strategieanker nur für starke, skalierende, persistente oder deckprägende Quellen.
- Tag-source, trace-source und tag-payoff getrennt modellieren; normales Tag-/Trace-ICE ist nicht automatisch Tag/Punish-Strategie.
- Program-/Hardware-Trash-ICE als Rig-/Trash-Pressure modellieren; nur ankern, wenn eine passende Corp-Strategy-ID existiert.
- Run-Lock, Jack-out-Lock, Encounter-/Breakkosten-Tax, Future-ICE-Buffs, Next-ICE-Unbreakable, Position-/Outer-ICE-Skalierung, Paid-Rez-Skalierung, Rez-Economy, Self-bounce/Maintenance-Drawbacks und Random/Guessing jeweils funktional trennen.
- Normale Rez-Credit-ICE erzeugen keine Economy-Strategieanker.
- Randomness nur als Funktions-/Risikosignal, nicht als Strategieanker.
- `strategySupportPairs` immer eindeutig ausgeben, wenn Strategieanker gesetzt werden.

## Besonders zu prüfende Karten

- Data Raven: persistent-tag-source-Semantik.
- Ball and Chain, Tutor, Virizz, Viral 15: run-wide tax/lock semantics.
- Bug Zapper, Dog Pile, Mastermind, Hunting Pack, Minotaur: outer-/position-scaling semantics.
- Mobile Barricade und Walking Wall: mobile/position-changing ICE semantics.
- Too Many Doors, Vacuum Link und Roadblock: random/mindgame/risk semantics.
- Classic-Kandidatenliste aus Auftrag vollständig prüfen, unter anderem: Asp, Ball and Chain, Banpei, Bolter Cluster, Canis Major, Canis Minor, Cerberus, Cinderella, Code Corpse, Cortical Scanner, Cortical Scrub, Crystal Wall, D' Arc Knight, Data Darts, Data Naga, Data Raven, Data Wall, Data Wall 2.0, Endless Corridor, Fang, Fang 2.0, Fatal Attractor, Fetch 4.0.1, Filter, Fire Wall, Fragmentation Storm, Haunting Inquisition, Homewrecker (TM), Hunter, Ice Pick Willie, Jack Attack, Keeper, Laser Wire, Liche, Mastiff, Mazer, Nerve Labyrinth, Neural Blade, Pi in the Face, Pocket Virtual Reality, Quandary, Razor Wire, Reinforced Wall, Rex, Rock Is Strong, Scramble, Sentinels Prime, Shock.r, Shotgun Wire, Sleeper, TKO 2.0, Too Many Doors, Triggerman, Tutor, Vacuum Link, Viral 15, Virizz, Wall of Ice, Wall of Static und Zombie.
- Proteus-Kandidatenliste aus Auftrag vollständig prüfen: Brain Wash, Bug Zapper, Caryatid, Chihuahua, Colonel Failure, Coyote, Credit Blocks, Datacomb, Death Yo-Yo, Digiconda, Dog Pile, Food Fight, Galatea, Gatekeeper, Homing Missile, Hunting Pack, Iceberg, Lesser Arcana, Marionette, Mastermind, Minotaur, Misleading Access Menus, Mobile Barricade, Riddler, Roadblock, Sandstorm, Scaffolding, Snowbank, Sphinx 2006, Sumo 2008, Toughonium Wall, Tumblers, Twisty Passages, Walking Wall und Washed-Up Solo Construct.

## TargetProfiles

- TargetProfile V1 nur verwenden, wenn das bestehende Schema side-sicher passt.
- Type-/mode-choice on rez für Caryatid, Credit Blocks, Galatea, Lesser Arcana, Sphinx 2006 und Sumo 2008 prüfen; falls V1 `on_rez`/`mode_choice` für Korp-ICE nicht sauber darstellen kann, als `schema_gap` oder `deferred` dokumentieren.
- Paid-X-/overpay-/strength- oder subroutine-scaling-Karten wie Digiconda, Homing Missile, Food Fight, Gatekeeper und Sandstorm als Kandidaten prüfen; bei unpassendem Schema als Gap dokumentieren.
- Mobile position change für Mobile Barricade und Walking Wall als Kandidat prüfen; bei fehlender Fort-Position-Abbildung als Gap dokumentieren.
- Secret bid für Too Many Doors nur abbilden, wenn ein passendes cost-/bid-choice-Profil existiert.
- Trace-Werte bleiben Engine-/LegalAction-Details und sind nicht automatisch TargetProfiles.
- Keine neue Targeting-KI und keine Hidden-Info-TargetProfiles.

## Hidden-Info-Grenzen

- Für jedes ICE im Report `hiddenInfoPolicy` angeben: `corp_side_only_until_rezzed`, `public_when_rezzed`, `public_when_exposed` oder `schema_gap`.
- Korp-KI darf eigene unrezzed ICE nur soweit kennen, wie bestehende AI-Inputs side-safe sind.
- Runner-KI darf konkrete ICE-Semantik nur sehen, wenn das ICE rezzed, exposed, bekannt oder anderweitig side-safe sichtbar ist.
- Inspector, Debug, WebSocket, Reconnect, Undo-Preview, PublicEvents, Replay, Logs und Client-Fehler dürfen keine unrezzed Korp-ICE-Semantik in Runner-Perspektive leaken.

## Akzeptanzkriterien

- [x] Alle aktiven/compiled Korp-ICE-Karten sind inventarisiert.
- [x] Alle aktiven/compiled Korp-ICE-Karten sind fachlich geprüft.
- [x] Inaktive oder zusätzlich bekannte Korp-ICE-Karten sind, soweit vorhanden, separat erfasst.
- [x] Vollständige Post-Review-Liste für alle geprüften aktiven/compiled Korp-ICE-Karten ist im JSON-Report vorhanden.
- [x] Inventarcounts, Clusterübersicht, neue/wiederverwendete Signale, geänderte bestehende Signale, vermiedene Subtyp-Signale, Strategy-Entscheidungen, TargetProfile-Kandidaten, Schema-Gaps, Deferred Items und Verifikation sind im Markdown-Report dokumentiert.
- [x] `strategySupportPairs` sind eindeutig und enthalten je Eintrag `strategyId`, `role`, `evidence` und `confidence`.
- [x] ICE ohne Strategieanker haben keine kanonische strategische Rolle.
- [x] ICE mit mehreren Strategieankern haben je Strategieanker eine explizite Rolle.
- [x] Legacy-Felder wie `lineSupport[]` und `strategicRole[]` bleiben kompatibel, werden aber nicht als Ersatz für `strategySupportPairs` verwendet.
- [x] Keine Runner-Karten und keine Korp-Agenden/Operationen/Nodes/Upgrades wurden fachlich migriert.
- [x] Keine neuen freien, unkatalogisierten, kartenspezifischen oder Subtyp-only-Taktiksignale existieren.
- [x] Alle neuen Taktiksignale sind im Katalog und korrekt als support-only oder may-anchor-fähig markiert.
- [x] Keine generische `corp.ice`-Strategie oder Strategy-ID aus ICE-Typ/Subtyp allein.
- [x] Keine Strategieanker für einfache ETR-/Damage-/Tag-/Program-Trash-/Rez-Economy-ICE ohne explizit begründete Decklinie.
- [x] Keine Planner-, Engine-, Legalitäts-, Targeting-, ActionScore-, PlanWeight-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
- [x] Regression gegen AI018 bis AI023 ist dokumentiert.

## Review-Artefakte

Der JSON-Report muss mindestens folgende Struktur abdecken:

```json
{
  "schemaVersion": "ai024-corp-ice-semantics-review-report-v1",
  "taskId": "AI024",
  "generatedAt": "2026-06-02",
  "status": "complete",
  "scope": "corp_ice",
  "sourceCommit": "<HEAD before changes>",
  "summary": {
    "activeCorpIceCount": 0,
    "reviewedIceCount": 0,
    "inactiveCheckedIceCount": 0,
    "changedIceCount": 0,
    "unchangedCheckedIceCount": 0,
    "newTacticSignalCount": 0,
    "changedExistingTacticSignalCount": 0,
    "removedOrAvoidedSubtypeSignalCount": 0,
    "newStrategyIdCount": 0,
    "strategySupportPairCount": 0,
    "targetProfileCandidateCount": 0,
    "schemaGapCount": 0,
    "plannerEffect": false,
    "actionScoreEffect": false,
    "planWeightEffect": false,
    "targetingAiEffect": false,
    "engineEffect": false,
    "legalEffect": false,
    "profileOrDefaultSwitch": false,
    "uiDerivationEffect": false,
    "hiddenInfoLeakEffect": false
  },
  "inventory": {
    "activeCompiledIceCardIds": [],
    "inactiveCheckedIceCardIds": [],
    "countDiscrepancies": []
  },
  "clusterOverview": [],
  "newTacticSignals": [],
  "changedExistingTacticSignals": [],
  "forbiddenSubtypeSignals": [],
  "removedOrAvoidedSubtypeSignals": [],
  "newStrategyIds": [],
  "strategySupportPairs": [],
  "targetProfileCandidates": [],
  "hiddenInfoSafetyReview": [],
  "deferredItems": [],
  "postReviewAssignments": [],
  "verification": []
}
```

Jeder `postReviewAssignments`-Eintrag soll mindestens `cardId`, `title`, `cardType`, `subtypes`, `mechanicalFamily`, `functionalEffects`, `tacticSignals`, `strategyAnchors`, `legacyStrategicRole`, `strategySupportPairs`, `targetProfileStatus`, `targetProfileKinds`, `hiddenInfoPolicy`, `needsHumanReview`, `confidence`, `postReviewStatus` und `rationale` enthalten.

## Empfohlene Checks

- [ ] `node scripts/check-ai-derived-facts.mjs --write`
- [ ] `node scripts/check-ai-derived-facts-full.mjs --write`
- [ ] `corepack pnpm build:ai-compiled-hints`
- [ ] `corepack pnpm build:ai-hint-inspector-index`
- [ ] `node scripts/check-ai-hint-compiled-index.mjs --write`
- [ ] `corepack pnpm check:ai-strategy-taxonomy`
- [ ] `corepack pnpm check:ai-compiled-hints`
- [ ] `corepack pnpm check:ai-hint-inspector-index`
- [ ] `corepack pnpm check:ai-hint-compiled-index`
- [ ] `corepack pnpm check:ai-manual-overlays`
- [ ] `corepack pnpm check:ai-hint-quality`
- [ ] `corepack pnpm check:ai-approval-consistency`
- [ ] `corepack pnpm check:ai-deck-doctrine-strategy`
- [ ] `corepack pnpm --filter @netgrid/ai test`
- [ ] `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- [ ] `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- [ ] `git diff --check`

Zusätzlich einen AI024-Invariant-Check ergänzen oder ausführen, der mindestens prüft:

- `postReviewAssignments.length === activeCorpIceCount`
- keine ICE-Karte mit freien, unkatalogisierten Taktiksignalen
- keine verbotenen Subtyp-only-Signale
- alle ICE mit ETR-, Damage-, Trace-/Tag-, Program-/Hardware-Trash- oder Drawback-Wirkung haben passende funktionale Signale
- keine `strategySupportPairs` ohne `strategyId` oder `role`
- keine kanonische Rolle bei Karten ohne Strategieanker
- keine generische `corp.ice`-Strategie
- keine Strategieanker nur aus ICE-Typ/Subtyp
- `plannerEffect`, `engineEffect`, `legalEffect`, `targetingAiEffect` und `hiddenInfoLeakEffect` sind `false`
- Runner-seitig keine unrezzed ICE-Semantik sichtbar
- alle neuen Signale sind support-only oder may-anchor korrekt markiert

## Ergebnisnotiz

AI024 ist umgesetzt. Der Review inventarisiert 95 aktive/compiled Corp-ICE-Karten und 11 inaktive Classic-ICE-Karten, ergänzt 29 kontrollierte `corp_ice.*`-Taktiksignale, erzeugt 46 eindeutige `strategySupportPairs`, dokumentiert 14 TargetProfile-Kandidaten und 9 Schema-Gaps und hält alle Runtime-/Planner-/Engine-/Legalitäts-/Hidden-Info-Wirkungsflags auf `false`. Ein False-Positive aus substring-basierter `tag`-Erkennung wurde vermieden, sodass z. B. `taxing_ice` keine Tag-Semantik ableitet. Einfache ETR-, Damage-, Tag-/Trace-, Program-Trash- und Rez-Economy-ICE bleiben funktional signalisiert, aber ohne Strategieanker, sofern keine explizite Decklinie begründet ist.
