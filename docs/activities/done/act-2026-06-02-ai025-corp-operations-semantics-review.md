---
activityId: act-2026-06-02-ai025-corp-operations-semantics-review
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
  - AI023 Corp Agenda Semantics Review must be complete
  - AI024 Corp ICE Semantics Review must be complete
resultArtifacts:
  - data/ai/tactic-signals-v1.json
  - data/ai/function-signal-derivation-v1.json
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
  - docs/reviews/ai/ai025-corp-operations-semantics-review-2026-06-02.md
  - docs/reviews/ai/ai025-corp-operations-semantics-review-report-2026-06-02.json
  - docs/reviews/ai/README.md
  - docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json
  - docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json
  - docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json
  - docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-alias-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json
  - docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json
  - docs/reviews/ai/aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-011-batch2-generated-facts-rollup-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-019-corp-economy-advance-burst-closeout-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-020-corp-nodes-assets-ambush-closeout-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-022-corp-tag-punish-funnel-closeout-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-042-compiled-hint-runtime-full-report-2026-05-25.json
  - docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json
  - scripts/apply-ai025-corp-operations-semantics.mjs
  - scripts/check-ai025-corp-operations-semantics.mjs
  - packages/ai/src/compiled-index-gate.test.ts
  - packages/ai/src/derived-basic-facts-gate.test.ts
  - packages/ai/src/generated-fact-batch11-tag-punish-closeout.test.ts
  - packages/ai/src/generated-fact-batch8-corp-economy-closeout.test.ts
  - packages/ai/src/generated-fact-batch9-corp-nodes-closeout.test.ts
  - packages/ai/src/hint-ontology.test.ts
  - packages/ai/src/strategy-taxonomy.test.ts
checks:
  - node scripts/apply-ai025-corp-operations-semantics.mjs
  - node scripts/check-ai025-corp-operations-semantics.mjs
  - corepack pnpm build:ai-compiled-hints
  - corepack pnpm build:ai-hint-inspector-index
  - node scripts/check-ai-derived-facts.mjs --write
  - node scripts/check-ai-derived-facts-full.mjs --write
  - node scripts/check-ai-hint-compiled-index.mjs --write
  - node scripts/check-ai-generated-fact-batch1-rollup.mjs --write
  - node scripts/check-ai-generated-fact-batch2-rollup.mjs --write
  - node scripts/check-ai-generated-fact-batch8-corp-economy-closeout.mjs --write
  - node scripts/check-ai-generated-fact-batch9-corp-nodes-closeout.mjs --write
  - node scripts/check-ai-generated-fact-batch11-tag-punish-closeout.mjs --write
  - node scripts/check-ai-generated-fact-migration-priority.mjs --write
  - node scripts/check-ai-generated-fact-migration-dry-run.mjs --write
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

# AI025: Corp Operations Semantics Review

## Ziel

Alle aktiven/compiled Corp-Operation-Karten aus Classic/Originalset und Proteus sollen inventarisiert, fachlich geprüft und mit kontrollierten read-only-Taktiksignalen versehen werden. Strategieanker sollen nur dort gesetzt werden, wo eine Operation wirklich eine größere Corp-Decklinie trägt, wesentlich ermöglicht, einen klaren Payoff darstellt, eine Engine unterstützt oder als strategischer Schlüssel-/Win-Condition-Zug fungiert.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI025 – Corp Operations Semantics Review`.
- Umsetzungswunsch aus Auftrag: auf `main` arbeiten, Worktree vor Beginn prüfen und sauber halten.
- Voraussetzungen:
  - AI018 / AI018c Icebreaker-Semantik ist umgesetzt und darf nicht regressieren.
  - AI019 Runner Program Semantics Review ist umgesetzt.
  - AI020 Runner Hardware Semantics Review ist umgesetzt.
  - AI021 Runner Prep Semantics Review ist umgesetzt.
  - AI022 Runner Resources Semantics Review ist umgesetzt.
  - AI023 Corp Agenda Semantics Review ist umgesetzt.
  - AI024 Corp ICE Semantics Review ist umgesetzt.
- Wenn AI023 oder AI024 noch nicht umgesetzt ist, AI025 nicht mit Agenda- oder ICE-Arbeit vermischen.
- Guide-V2-Leitplanken aus dem Auftrag:
  - Taktiksignale beschreiben Funktion, nicht Form.
  - Typ, Subtyp, Name und Thema sind Kartendaten, keine Taktiksignale.
  - Positive Effekte und Drawbacks getrennt modellieren.
  - Support ist keine Strategie.
  - Kartenfamilie ist keine Strategie.
  - Keine Strategie ohne echte Strategieanker.
  - TargetProfiles sind Zielwahlhilfen, keine Taktiksignale.
  - Taktiksignale erzeugen keine Legalität.
  - Die Engine bleibt Regelautorität.

## Scope

- Corp Operations aus Classic/Originalset.
- Corp Operations aus Proteus.
- Aktive/compiled Corp-Operation-Karten aus Repo-Daten ableiten, nicht Spoilerzahlen hart kodieren.
- Spoiler-Referenz aus Auftrag: Classic hat 27 Corp-Operations, Proteus hat 8 Corp-Operations.
- Abweichungen zwischen Repo-Inventar, Spoiler-Header und extrahierter Kartenliste im Report dokumentieren; maßgeblich bleibt die aktive/compiled Repo-Wahrheit.
- Inaktive oder bekannte Corp-Operation-Karten zusätzlich erfassen, falls sie im Spoiler oder Repo vorhanden, aber nicht active/compiled sind.
- Operation-Subtypen wie `Transactions`, `Gray Ops` und `Black Ops` als Kartendaten/Traits im Report aufnehmen, aber nicht als Taktiksignale spiegeln.
- Operations in mechanische Familien einteilen, unter anderem Economy, Draw, Extra Actions, Install-Only Actions, Advancement, Trace/Tag, Tagged Runner Payoff, Meat Damage/Kill, Hardware/Resource Trash, ICE-Rez/Tempo, ICE-Rearrange/Conceal, Archives Recovery, R&D Topdeck Setup, Agenda-Stolen Recovery sowie Drawbacks/Conditions/Risks.
- Bestehende Taktiksignale aus AI018 bis AI024 zuerst prüfen und nur wiederverwenden, wenn Funktion, Wirkungsrichtung und SideScope passen.
- Neue Corp-seitige Signale nur kontrolliert ergänzen, katalogisieren, mit `sideScope: corp` versehen und korrekt als support-only oder may-anchor-fähig markieren.
- Für Strategieanker immer eindeutige `strategySupportPairs` mit `strategyId`, `role`, `evidence` und `confidence` ausgeben.
- TargetProfile V1 nur verwenden, wenn das bestehende Schema side-safe passt; sonst `candidate`, `deferred` oder `schema_gap` dokumentieren.
- Für jede Operation im Report `hiddenInfoPolicy` angeben.
- Review-Dokument erzeugen: `docs/reviews/ai/ai025-corp-operations-semantics-review-2026-06-02.md`.
- JSON-Report erzeugen: `docs/reviews/ai/ai025-corp-operations-semantics-review-report-2026-06-02.json`.
- Falls vorhanden, `docs/reviews/ai/README.md` aktualisieren.

## Besonders zu prüfende Karten

- Classic: `Accounts Receivable`, `Annual Reviews`, `Audit of Call Records`, `Chance Observation`, `Closed Accounts`, `Corporate Detective Agency`, `Datapool(R) by Zetatech`, `Day Shift`, `Edgerunner, Inc., Temps`, `Efficiency Experts`, `Falsified-Transactions Expert`, `Management Shake-Up`, `Netwatch Credit Voucher`, `New Blood`, `Night Shift`, `Off-Site Backups`, `Overtime Incentives`, `Planning Consultants`, `Power Grid Overload`, `Project Consultants`, `Punitive Counterstrike`, `Scorched Earth`, `Silver Lining Recovery Protocol`, `Systematic Layoffs`, `Team Restructuring`, `Trojan Horse`, `Urban Renewal`.
- Proteus: `Corporate Guard(R) Temps`, `Credit Consolidation`, `Data Sifters`, `Emergency Rig`, `Manhunt`, `Rent-to-Own Contract`, `Schlaghund Pointers`, `Underworld Mole`.

## Nicht im Scope

- Keine fachliche Migration von Corp Agendas, außer Regression gegen AI023.
- Keine fachliche Migration von Corp ICE, außer Regression gegen AI024.
- Keine Corp Nodes oder Corp Upgrades.
- Keine Runner-Karten.
- Keine vollständige LegalAction Semantic Bridge.
- Kein Planner-/Runtime-Verbrauch neuer Operation-Signale.
- Keine neue generische Operation-Strategie.
- Keine Entfernung von Legacy-Feldern.
- Keine Änderung am Action-Selection-Verhalten.
- Keine Plannerwirkung, ActionScore-Änderung, PlanWeight-Änderung, Engine-Änderung, Legalitätsänderung, Targeting-KI, Profil-/Default-Umschaltung oder UI-Derivationslogik außer regenerierten Inspector-/Reviewdaten.
- Keine Hidden-Info-/Visibility-Regeländerung.

## Verbotene Typ-/Subtyp-Only-Signale

- Keine neuen Signale wie `corp.operation`, `operation.transaction`, `operation.transactions`, `operation.gray_ops`, `operation.black_ops`, `corp.gray_ops`, `corp.black_ops`, `corp.transactions`, `corp.operation_damage`, `corp.operation_economy`, `corp.operation_tag`, `operation.power_grid` oder `operation.scorched_earth`.
- Keine card-spezifischen Signale wie `operation.power_grid_overload`, `operation.scorched_earth` oder `operation.management_shakeup`.
- Keine generische Strategie `corp.operation`, `corp.transactions`, `corp.gray_ops` oder `corp.black_ops`.

## Akzeptanzkriterien

- [x] Alle aktiven/compiled Corp-Operation-Karten sind inventarisiert.
- [x] Alle aktiven/compiled Corp-Operation-Karten sind fachlich geprüft.
- [x] Vollständige Post-Review-Liste ist im JSON-Report vorhanden, nicht nur ein Delta.
- [x] Inaktive oder zusätzlich bekannte Corp-Operation-Karten sind, soweit vorhanden, separat erfasst.
- [x] Operation-Subtypen sind als Kartendaten/Traits sichtbar, aber nicht als Taktiksignale dupliziert.
- [x] Keine Runner-Karten, Corp Agendas, Corp ICE, Corp Nodes oder Corp Upgrades wurden fachlich migriert.
- [x] Keine neuen freien, unkatalogisierten, card-spezifischen oder Typ-/Subtyp-only-Taktiksignale existieren.
- [x] Alle neuen Taktiksignale sind im Katalog und korrekt als support-only oder may-anchor-fähig markiert.
- [x] Keine generische `corp.operation`-Strategie und keine generische Strategy-ID aus Operation-Subtyp.
- [x] Keine Strategie aus bloßen Supportsignalen.
- [x] Keine Strategy Anchors für einfache Economy-/Draw-/Recovery-/R&D-Reorder-Operations ohne explizite Begründung.
- [x] Keine kanonische strategische Rolle ohne Strategieanker.
- [x] Bei mehreren Strategieankern ist die Rollenzuordnung eindeutig.
- [x] Legacy-Felder wie `lineSupport[]` und `strategicRole[]` bleiben kompatibel, ersetzen aber nicht `strategySupportPairs`.
- [x] Keine Planner-, Engine-, Legalitäts-, Targeting-, ActionScore-, PlanWeight-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
- [x] Keine Hidden-Info-TargetProfiles.
- [x] Runner-seitig wird keine verdeckte Corp-Operation-Semantik offengelegt.
- [x] Scorched Earth und Urban Renewal sind als tagged Meat-Damage-Kill-Payoffs geprüft.
- [x] Punitive Counterstrike ist als kleinerer tagged Meat-Damage-Payoff geprüft.
- [x] Closed Accounts, Corporate Detective Agency und Power Grid Overload sind als Tag-Punish-Payoffs geprüft.
- [x] Datapool(R) by Zetatech und Netwatch Credit Voucher sind als Tag-Snowball/Tag-followup geprüft, nicht als Damage/Kill.
- [x] Audit of Call Records, Chance Observation, Manhunt, Schlaghund Pointers, Trojan Horse, Data Sifters und Underworld Mole sind als Tag-Quellen/Enabler geprüft, nicht automatisch als Payoffs.
- [x] Management Shake-Up, Project Consultants, Systematic Layoffs, Team Restructuring und Falsified-Transactions Expert sind als Fast-Advance-/Advancement-Kandidaten geprüft.
- [x] Edgerunner, Inc., Temps und Overtime Incentives sind als Tempo/Action-Support geprüft, nicht automatisch als Fast-Advance-Anker.
- [x] Corporate Guard(R) Temps modelliert zukünftige Extra Actions plus Agenda-Forfeit-Drawback.
- [x] Emergency Rig und Rent-to-Own Contract modellieren free/temporary/deferred ICE rez plus Risiken.
- [x] New Blood modelliert ICE-Rearrange/Concealment plus Hidden-Info-Risiko.
- [x] Power Grid Overload behandelt Cybernetics als Subtyp/Constraint, nicht als Taktiksignal.
- [x] Planning Consultants und Off-Site Backups bleiben voraussichtlich support-only, sofern kein stärkerer Repo-Befund dagegen spricht.
- [x] Conditions wie Runner tagged, last turn run oder agenda stolen erzeugen keine Legalität und werden nur als Semantik/Condition dokumentiert.

## Umsetzungshinweise

- Präfixkonvention im Report dokumentieren. Bevorzugt funktionale Präfixe wie `economy.*`, `setup.*`, `action.*`, `advance.*`, `tag.*`, `trace.*`, `damage.*`, `ice.*`, `hardware.*`, `resource.*`, `archives.*`, `rnd.*`, `risk.*` und `condition.*`; `operation.*` oder `corp_op.*` nur verwenden, wenn die bestehende Katalogsprache sonst falsche Wirkungsrichtung oder Mehrdeutigkeit erzeugt.
- Nicht wiederverwenden, wenn die Wirkungsrichtung falsch wäre, zum Beispiel runnerseitige Economy-Pressure-, ICE-Trash- oder Defense-Signale.
- Economy/Draw/Recovery sind im Regelfall Support und keine Strategieanker.
- Advancement-Operations sind die wichtigsten Fast-Advance-Kandidaten in diesem Scope, aber auch hier keine neue Strategy-ID erzwingen.
- Tagged Runner Payoff klar von Tag-Quellen/Enablern trennen.
- Positive Effekte und Drawbacks getrennt modellieren, besonders bei Corporate Guard(R) Temps, Emergency Rig, Rent-to-Own Contract und New Blood.
- JSON-Report soll mindestens die Struktur `ai025-corp-operations-semantics-review-report-v1` mit `summary`, `inventory`, `clusterOverview`, `newTacticSignals`, `changedExistingTacticSignals`, `removedOrAvoidedSubtypeSignals`, `strategySupportPairs`, `targetProfileCandidates`, `hiddenInfoSafetyReview`, `deferredItems`, `postReviewAssignments` und `verification` enthalten.
- `postReviewAssignments` pro Karte soll mindestens `cardId`, `title`, `cardType`, `subtypes`, `mechanicalFamily`, `functionalEffects`, `conditions`, `risks`, `tacticSignals`, `strategyAnchors`, `legacyStrategicRole`, `strategySupportPairs`, `targetProfileStatus`, `targetProfileKinds`, `hiddenInfoPolicy`, `needsHumanReview`, `confidence`, `postReviewStatus` und `rationale` enthalten.

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
- [ ] Neuer oder erweiterter AI025-Invariant-Check
- [ ] `git diff --check`

## Ergebnisnotiz

AI025 ist umgesetzt. Der Review inventarisiert 40 aktive/compiled Corp-Operation-Hints aus der Repo-Wahrheit: 27 Originalset-Operations, 8 Proteus-Operations und 5 aktive Test-/V08-Operations; zusätzlich sind 4 inaktive bekannte Operationen separat erfasst. Es wurden 22 kontrollierte Corp-side Funktionssignale ergänzt, 25 `strategySupportPairs` erzeugt und 15 TargetProfile-Kandidaten dokumentiert. Typ-/Subtyp-only- und kartenspezifische Operation-Signale wurden vermieden. Economy-, Draw-, Recovery-, R&D-Reorder-, Tempo- und einfache Rez-Supportkarten bleiben ohne Strategieanker; Advancement-Operations ankern Fast Advance, Tag-Quellen bleiben Enabler und tagged Meat-Damage-/Trash-Payoffs trennen Tag/Punish von Damage/Kill. Alle Runtime-/Planner-/Engine-/Legalitäts-/Targeting-/Hidden-Info-Wirkungsflags bleiben `false`.
