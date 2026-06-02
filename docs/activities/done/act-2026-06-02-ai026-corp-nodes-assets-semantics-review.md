---
activityId: act-2026-06-02-ai026-corp-nodes-assets-semantics-review
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
  - AI025 Corp Operations Semantics Review must be complete
resultArtifacts:
  - scripts/apply-ai026-corp-nodes-assets-semantics.mjs
  - scripts/check-ai026-corp-nodes-assets-semantics.mjs
  - docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-2026-06-02.md
  - docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json
  - data/ai/tactic-signals-v1.json
  - data/ai/function-signal-derivation-v1.json
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
checks:
  - node scripts/check-ai026-corp-nodes-assets-semantics.mjs
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit
  - corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit
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
  - git diff --check
---

# AI026: Corp Nodes / Assets Semantics Review

## Ziel

Alle aktiven/compiled Corp-Node-Karten aus Classic/Originalset und Proteus sollen fachlich als Corp Assets/Nodes analysiert, inventarisiert und mit kontrollierten read-only-Taktiksignalen versehen werden. Strategieanker sollen nur dort gesetzt werden, wo ein Node wirklich eine größere Corp-Decklinie trägt, wesentlich ermöglicht, einen wiederholbaren Engine-Effekt liefert, einen klaren Payoff darstellt oder als strategischer Schlüssel-/Win-Condition-Baustein fungiert.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI026 – Corp Nodes / Assets Semantics Review`.
- Umsetzungswunsch aus Auftrag: auf `main` arbeiten, Worktree vor Beginn prüfen und sauber halten.
- Begriffsklärung aus Auftrag: Original-Netrunner verwendet `Node`; moderne Terminologie kann diese Karten als Corp Assets verstehen. Corp Upgrades bleiben out of scope.
- Voraussetzungen:
  - AI018 / AI018c Icebreaker-Semantik ist umgesetzt und darf nicht regressieren.
  - AI019 Runner Program Semantics Review ist umgesetzt.
  - AI020 Runner Hardware Semantics Review ist umgesetzt.
  - AI021 Runner Prep Semantics Review ist umgesetzt.
  - AI022 Runner Resources Semantics Review ist umgesetzt.
  - AI023 Corp Agenda Semantics Review ist umgesetzt.
  - AI024 Corp ICE Semantics Review ist umgesetzt.
  - AI025 Corp Operations Semantics Review ist umgesetzt.
- Wenn AI025 noch nicht umgesetzt ist, AI026 nicht mit Corp-Operations-Arbeit vermischen.
- Bestehende ältere Review-Artefakte zu Corp Nodes/Assets können als Kontext dienen, ersetzen aber nicht den AI026-Review gegen den aktuellen AI018-bis-AI025-Stand.

## Scope

- Corp Nodes aus Classic/Originalset.
- Corp Nodes aus Proteus.
- Aktive/compiled Corp-Node-Karten aus Repo-Daten ableiten, nicht Spoilerzahlen hart kodieren.
- Spoiler-Referenz aus Auftrag: Classic hat 41 Corp Nodes, Proteus hat 11 Corp Nodes.
- Abweichungen zwischen Repo-Inventar, Spoiler-Header und extrahierter Kartenliste im Report dokumentieren; maßgeblich bleibt die aktive/compiled Repo-Wahrheit.
- Zusätzlich inaktive/known Corp-Node-Karten erfassen, falls sie im Spoiler oder Repo vorhanden, aber nicht active/compiled sind.
- Node-Subtypen als Kartendaten/Traits im Report aufnehmen, aber nicht als Taktiksignale spiegeln.
- Nodes in mechanische Familien einteilen, unter anderem Campaign/installed Economy, high-risk Economy, Draw/Hand-size, Action Engine, Advancement/Fast-Advance Support, ICE-Rez-/Install-Discount, ICE-Strength-/Subroutine-Support, Trace/Tag, Tagged-Runner-Payoff, Damage/Kill, Access Ambush/Punish, Virus-Counter-Defense, Expose Prevention, Run Tax/Redirect, HQ/R&D/Archives Manipulation und Drawback/Risk.
- Bestehende Taktiksignale aus AI018 bis AI025 zuerst prüfen und nur wiederverwenden, wenn Funktion, Wirkungsrichtung und SideScope passen.
- Neue Corp-seitige Signale nur kontrolliert ergänzen, katalogisieren, mit `sideScope: corp` versehen und korrekt als support-only oder may-anchor-fähig markieren.
- Für Strategieanker immer eindeutige `strategySupportPairs` mit `strategyId`, `role`, `evidence` und `confidence` ausgeben.
- TargetProfile V1 nur verwenden, wenn das bestehende Schema side-safe passt; sonst `candidate`, `deferred` oder `schema_gap` dokumentieren.
- Für jeden Node im Report `hiddenInfoPolicy` angeben.
- Review-Dokument erzeugen: `docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-2026-06-02.md`.
- JSON-Report erzeugen: `docs/reviews/ai/ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json`.
- Falls vorhanden, `docs/reviews/ai/README.md` aktualisieren.

## Besonders zu prüfende Karten

- Classic: `ACME Savings and Loan`, `BBS Whispering Campaign`, `Blood Cat`, `Braindance Campaign`, `Chicago Branch`, `City Surveillance`, `Corporate Negotiating Center`, `Corprunner's Shattered Remains`, `Cowboy Sysop`, `Data Masons`, `Department of Truth Enhancement`, `Disinfectant, Inc.`, `Encoder, Inc.`, `ESA Contract`, `Euromarket Consortium`, `Experimental AI`, `Fortress Architects`, `Hacker Tracker Central`, `Holovid Campaign`, `I Got a Rock`, `Information Laundering`, `Investment Firm`, `Krumz`, `Nevinyrral`, `Newsgroup Taunting`, `Omniscience Foundation`, `Pacifica Regional AI`, `Remote Facility`, `Rescheduler`, `Rockerboy Promotion`, `Rustbelt HQ Branch`, `Schlaghund`, `Setup!`, `Skälderviken SA Beta Test Site`, `Solo Squad`, `South African Mining Corp`, `Spinn(R) Public Relations`, `TRAP!`, `Vacant Soulkiller`, `Vapor Ops`, `Virus Test Site`.
- Proteus: `Bel-Digmo Antibody`, `Cybertech Think Tank`, `Department of Misinformation`, `Doppelganger Antibody`, `Executive Boot Camp`, `Government Contract`, `LDL Traffic Analyzers`, `Pattel Antibody`, `Siren`, `Stereogram Antibody`, `Syd Meyer Superstores`.

## Nicht im Scope

- Keine Corp Upgrades; diese werden später separat bearbeitet.
- Keine fachliche Migration von Corp Agendas, außer Regression gegen AI023.
- Keine fachliche Migration von Corp ICE, außer Regression gegen AI024.
- Keine fachliche Migration von Corp Operations, außer Regression gegen AI025.
- Keine Runner-Karten.
- Keine vollständige LegalAction Semantic Bridge.
- Kein Planner-/Runtime-Verbrauch neuer Node-Signale.
- Keine neue generische Node-/Asset-Strategie.
- Keine Entfernung von Legacy-Feldern.
- Keine Änderung am Action-Selection-Verhalten.
- Keine Plannerwirkung, ActionScore-Änderung, PlanWeight-Änderung, Engine-Änderung, Legalitätsänderung, Targeting-KI, Profil-/Default-Umschaltung oder UI-Derivationslogik außer regenerierten Inspector-/Reviewdaten.
- Keine Hidden-Info-/Visibility-Regeländerung.

## Verbotene Typ-/Subtyp-Only-Signale

- Keine neuen Signale wie `corp.node`, `corp.asset`, `node.asset`, `node.ai`, `node.unique`, `node.advertisement`, `node.transactions`, `node.gray_ops`, `node.black_ops`, `node.ambush`, `node.virus`, `node.random`, `corp.asset_economy` als Taktiksignal oder `asset.campaign` nur als Typbeschreibung.
- Keine card-spezifischen Signale wie `node.schlaghund`, `asset.acme` oder `node.virus_test_site`.
- Keine generische Strategie `corp.node`, `corp.asset`, `corp.ai`, `corp.advertisement`, `corp.transactions` oder `corp.ambush`.
- Subtypen wie `Node`, `Asset`, `AI`, `Ambush`, `Advertisement`, `Transactions`, `Gray Ops`, `Black Ops`, `Unique` und `Virus` bleiben Kartendaten, Constraints, Targeting-Facts oder Reportfelder.

## Akzeptanzkriterien

- [x] Alle aktiven/compiled Corp-Node-Karten sind inventarisiert.
- [x] Alle aktiven/compiled Corp-Node-Karten sind fachlich geprüft.
- [x] Vollständige Post-Review-Liste ist im JSON-Report vorhanden, nicht nur ein Delta.
- [x] Inaktive oder zusätzlich bekannte Corp-Node-Karten sind, soweit vorhanden, separat erfasst.
- [x] Node-Subtypen sind als Kartendaten/Traits sichtbar, aber nicht als Taktiksignale dupliziert.
- [x] Keine Runner-Karten, Corp Agendas, Corp ICE, Corp Operations oder Corp Upgrades wurden fachlich migriert.
- [x] Keine neuen freien, unkatalogisierten, card-spezifischen oder Typ-/Subtyp-only-Taktiksignale existieren.
- [x] Alle neuen Taktiksignale sind im Katalog und korrekt als support-only oder may-anchor-fähig markiert.
- [x] Keine generische `corp.node`- oder `corp.asset`-Strategie und keine generische Strategy-ID nur aus Kartentyp/Subtyp.
- [x] Keine Strategie aus bloßen Supportsignalen.
- [x] Keine Strategy Anchors für einfache Draw-/Hand-size-/Utility-Nodes ohne explizite Begründung.
- [x] Keine kanonische strategische Rolle ohne Strategieanker.
- [x] Bei mehreren Strategieankern ist die Rollenzuordnung eindeutig.
- [x] Legacy-Felder wie `lineSupport[]` und `strategicRole[]` bleiben kompatibel, ersetzen aber nicht `strategySupportPairs`.
- [x] Keine Planner-, Engine-, Legalitäts-, Targeting-, ActionScore-, PlanWeight-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
- [x] Keine Hidden-Info-TargetProfiles.
- [x] Runner-seitig wird keine verdeckte Corp-Node-Semantik offengelegt.
- [x] Campaign-/installed-economy Nodes sind als Asset-Economy-Kandidaten geprüft, aber nicht automatisch geankert.
- [x] Simple Draw-/Hand-size-Nodes bleiben support-only.
- [x] `Chicago Branch`, `Vapor Ops` und `Pacifica Regional AI` sind als Advancement-/Fast-Advance-Kandidaten geprüft.
- [x] `Data Masons`, `Encoder, Inc.`, `Fortress Architects` und `Skälderviken SA Beta Test Site` sind als ICE-Tax-/Glacier-Support geprüft, ohne Wall/Code Gate/Black Ice als Taktiksignal zu spiegeln.
- [x] `Blood Cat`, `City Surveillance`, `Omniscience Foundation` und `LDL Traffic Analyzers` sind als Tag-/Trace-Fälle geprüft.
- [x] `I Got a Rock`, `Schlaghund` und `Solo Squad` sind als Damage/Kill- und Tag/Punish-Kandidaten geprüft.
- [x] `Setup!`, `TRAP!`, `Virus Test Site`, `Vacant Soulkiller`, `Experimental AI`, `Corprunner's Shattered Remains` und Antibody-Karten sind als Access-Punish-/Ambush-Fälle geprüft, nicht wegen Ambush-Subtyp allein.
- [x] `ACME Savings and Loan` modelliert Economy plus Agenda-Point-/Lose-Game-Risiko.
- [x] `Nevinyrral` modelliert Extra Action plus Lose-Game-if-leaves-play-Risiko.
- [x] `Department of Misinformation` modelliert Expose Prevention, nicht automatisch Remote Contest.
- [x] `Siren` modelliert Run Redirect / Run Control ohne Planner-Verbrauch.
- [x] `Syd Meyer Superstores` modelliert Trash rezzed ICE for credits plus Kosten/Risiko.
- [x] `Disinfectant, Inc.` modelliert Virus-counter prevention, aber keine generische Corp-Virus-Strategie.
- [x] Antibody-Karten modellieren ihre Access-Wirkung, nicht ihren Virus-Subtyp als Signal.

## Umsetzungshinweise

- Präfixkonvention im Report dokumentieren. Bevorzugt funktionale Präfixe wie `economy.*`, `action.*`, `advance.*`, `tag.*`, `trace.*`, `damage.*`, `access.*`, `ambush.*`, `ice.*`, `run.*`, `remote.*`, `hardware.*`, `program.*`, `virus.*`, `hq.*`, `rnd.*`, `archives.*`, `risk.*` und `condition.*`.
- `node.*` oder `asset.*` nur verwenden, wenn der bestehende Katalog diese Präfixe bereits funktional, nicht typbeschreibend, nutzt.
- Nicht wiederverwenden, wenn die Wirkungsrichtung falsch wäre, zum Beispiel runnerseitige Economy-Pressure-, ICE-Trash- oder Defense-Signale.
- Positive Effekte und Drawbacks getrennt modellieren, besonders bei `ACME Savings and Loan`, `Nevinyrral`, `Executive Boot Camp`, `Government Contract` und riskanten Ambush-/Access-Punish-Karten.
- Asset-Economy, Fast-Advance/Advancement, Tag/Trace/Punish, Damage/Kill, ICE-Tax/Glacier, Remote Scoring/Run Control und Rig-/Hardware-/Program-Pressure nur als Strategieanker setzen, wenn eine passende bestehende Strategy-ID und echte Anker-Evidence vorliegen; sonst candidate/deferred dokumentieren.
- JSON-Report soll mindestens die Struktur `ai026-corp-nodes-assets-semantics-review-report-v1` mit `summary`, `inventory`, `clusterOverview`, `newTacticSignals`, `changedExistingTacticSignals`, `removedOrAvoidedSubtypeSignals`, `strategySupportPairs`, `targetProfileCandidates`, `hiddenInfoSafetyReview`, `deferredItems`, `postReviewAssignments` und `verification` enthalten.
- `postReviewAssignments` pro Karte soll mindestens `cardId`, `title`, `cardType`, `subtypes`, `mechanicalFamily`, `functionalEffects`, `conditions`, `risks`, `tacticSignals`, `strategyAnchors`, `legacyStrategicRole`, `strategySupportPairs`, `targetProfileStatus`, `targetProfileKinds`, `hiddenInfoPolicy`, `needsHumanReview`, `confidence`, `postReviewStatus` und `rationale` enthalten.
- Erwartete Hidden-Info-Policies: `corp_side_only_until_rezzed_or_accessed`, `public_when_rezzed`, `public_when_accessed`, `public_when_exposed`, `archives_access_exception` oder `schema_gap`.

## Empfohlene Checks

- [x] `node scripts/check-ai-derived-facts.mjs --write`
- [x] `node scripts/check-ai-derived-facts-full.mjs --write`
- [x] `corepack pnpm build:ai-compiled-hints`
- [x] `corepack pnpm build:ai-hint-inspector-index`
- [x] `node scripts/check-ai-hint-compiled-index.mjs --write`
- [x] `corepack pnpm check:ai-strategy-taxonomy`
- [x] `corepack pnpm check:ai-compiled-hints`
- [x] `corepack pnpm check:ai-hint-inspector-index`
- [x] `corepack pnpm check:ai-hint-compiled-index`
- [x] `corepack pnpm check:ai-manual-overlays`
- [x] `corepack pnpm check:ai-hint-quality`
- [x] `corepack pnpm check:ai-approval-consistency`
- [x] `corepack pnpm check:ai-deck-doctrine-strategy`
- [x] `corepack pnpm --filter @netgrid/ai test`
- [x] `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- [x] `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- [x] Neuer oder erweiterter AI026-Invariant-Check
- [x] `git diff --check`

## Ergebnisnotiz

AI026 ist umgesetzt. Inventar: 54 aktive/compiled Corp-Nodes/Assets (41 Originalset, 11 Proteus, 2 Test/V08) und 3 inaktive Classic-Nodes/Assets. Ergebnis: 32 kontrollierte Corp-side Funktionssignale, 56 `strategySupportPairs`, keine neue Strategy-ID und keine Planner-, Engine-, Legalitäts-, Targeting-, ActionScore-, PlanWeight-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.
