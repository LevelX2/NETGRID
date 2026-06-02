---
activityId: act-2026-06-02-ai025-1-corp-operations-semantics-polish
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
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/ai025-1-corp-operations-semantics-polish-2026-06-02.md
  - docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json
  - scripts/apply-ai025-1-corp-operations-semantics-polish.mjs
  - scripts/check-ai025-1-corp-operations-semantics-polish.mjs
checks:
  - node scripts/check-ai025-corp-operations-semantics.mjs
  - node scripts/check-ai025-1-corp-operations-semantics-polish.mjs
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

# AI025-1: Corp-Operations-Taktiksignale und Strategieanker nachschärfen

## Ziel

AI025 soll als begrenzte Nachkorrektur fachlich geschärft werden, ohne die gesamte Corp-Operations-Semantik neu zu entwerfen. Falsche oder zu grobe Taktiksignale sollen korrigiert, Conditions präzisiert, Draw/Economy/Recovery sauber getrennt, Advancement-Counter-Erzeugung von Counter-Transfer getrennt, Tagged-Meat-Damage präziser modelliert und Test-/V08-Operations in Reports klar von Produktionskarten getrennt werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI025-1: Corp-Operations-Taktiksignale und Strategieanker nachschärfen`.
- Ausgangslage aus Auftrag: AI025 ist umgesetzt und prüft 40 aktive/compiled Corp-Operations aus der Repo-Wahrheit:
  - 27 Originalset-Operations
  - 8 Proteus-Operations
  - 5 aktive Test-/V08-Operations
  - 4 inaktive/known Classic-Operations im Inventarcheck
- AI025 bleibt als read-only Foundation-Schritt grundsätzlich gültig:
  - Operation-Typen und Subtypen wie Transactions, Gray Ops und Black Ops werden nicht als Taktiksignale gespiegelt.
  - Keine neuen Strategy IDs.
  - Keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.
  - Private Corp-Entscheidungen wie R&D-Reorder, Archives-Recovery und ICE-Rearrange bleiben side-safe.
- Leitfaden: aktueller NETGRID Taktiksignal-/Strategieanker-Guide V2.
- Relevante Artefakte:
  - `data/ai/tactic-signals-v1.json`
  - `data/ai/function-signal-derivation-v1.json`
  - `data/ai/ai-card-hints-active.json`
  - `data/ai/ai-card-hints-compiled.json`
  - `data/ai/ai-hint-inspector-index.json`
  - AI025-Review und AI025-JSON-Report
  - AI025-Check oder neuer AI025-1-Check

## Scope

- Corp Operations aus AI025 gezielt prüfen und korrigieren.
- Draw, Economy und Recovery trennen, besonders bei:
  - `Annual Reviews`
  - `Day Shift`
  - `Night Shift`
  - `Off-Site Backups`
  - `Simple Draw Operation`
  - `V08 Archive Planning Operation`
  - `Closed Accounts`
- Advancement-Signale präzisieren:
  - `Falsified-Transactions Expert` als Counter-Transfer, nicht Counter-Erzeugung
  - `Management Shake-Up`
  - `Project Consultants`
  - `Systematic Layoffs`
  - `Team Restructuring`
  - `Silver Lining Recovery Protocol`
- Conditions präzisieren:
  - `New Blood`
  - `Audit of Call Records`
  - `Chance Observation`
  - `Data Sifters`
  - `Underworld Mole`
  - `Schlaghund Pointers`
- Tag-Snowball konsistent modellieren:
  - `Datapool(R) by Zetatech`
  - `Netwatch Credit Voucher`
- Damage-Operations präzisieren:
  - `Punitive Counterstrike`
  - `Scorched Earth`
  - `Urban Renewal`
- ICE-Rez-Operations präzisieren:
  - `Emergency Rig`
  - `Rent-to-Own Contract`
- TargetProfile-Kandidaten schärfen:
  - `Corporate Detective Agency`
  - `Power Grid Overload`
  - `Falsified-Transactions Expert`
  - Advancement-Operations
  - `Emergency Rig`
  - `Rent-to-Own Contract`
  - `Underworld Mole`
- Test-/V08-Operations in Reports klar getrennt ausweisen und sicherstellen, dass sie Produktionsaggregationen nicht verfälschen.
- Signalpräfixe prüfen und Präfix-Konvention im Review dokumentieren.
- Review-Dokument erstellen: `docs/reviews/ai/ai025-1-corp-operations-semantics-polish-2026-06-02.md` oder aktuelles Datum.
- JSON-Report erstellen: `docs/reviews/ai/ai025-1-corp-operations-semantics-polish-report-2026-06-02.json`.

## Nicht im Scope

- Keine neuen Strategy IDs.
- Keine Planner-, ActionScore-, PlanWeight- oder DeckDoctrine-Wirkung.
- Keine Engine- oder Legalitätsänderung.
- Keine Targeting-KI.
- Keine UI-Änderung.
- Keine Runner-Karten.
- Keine Corp Agendas, ICE, Nodes oder Upgrades.
- Keine Hidden-Info-Projektion.
- Keine großflächige Taxonomie-Umbenennung ohne Kompatibilitätsprüfung.
- Keine halb riskanten Änderungen; technisch unsichere Punkte als Deferred Item dokumentieren.

## Akzeptanzkriterien

- [x] 40 aktive/compiled Corp-Operations bleiben abgedeckt.
- [x] Keine neuen Strategy IDs wurden eingeführt.
- [x] Keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung wurde erzeugt.
- [x] Verbotene Typ-/Subtyp-Signale aus AI025 bleiben entfernt, darunter `corp.operation`, `operation.black_ops`, `operation.gray_ops`, `operation.transaction`, `operation.scorched_earth` und vergleichbare Typ-/Subtyp-only- oder card-spezifische Signale.
- [x] Reine Draw-Operations verwenden kein missverständliches `economy.corp_draw`, sofern dieses nicht bewusst als Legacy-/Aggregation-Signal dokumentiert ist.
- [x] `Annual Reviews` trägt nur Draw-Semantik.
- [x] `Day Shift` und `Night Shift` tragen Draw plus Credit-Economy.
- [x] `Off-Site Backups` trägt kein Draw-Signal, wenn der Kartentext nur Archives-Recovery sagt.
- [x] `Closed Accounts` trägt kein Corp-Credit-Gain-Signal und modelliert Runner-Credit-Verlust als Tag-Payoff.
- [x] `Falsified-Transactions Expert` ist Counter-Transfer/Reallocation, nicht Counter-Erzeugung.
- [x] `Management Shake-Up`, `Project Consultants`, `Systematic Layoffs` und `Team Restructuring` verlangen keine vorhandenen Advancement-Counter.
- [x] `Silver Lining Recovery Protocol` trägt kein aktives Overadvance-Support-Signal.
- [x] `New Blood` trägt keine `condition.last_turn_run`.
- [x] `Audit of Call Records` hat eine präzise Multiple-Runs-last-turn-Condition.
- [x] `Chance Observation` bleibt bei Run-last-turn-Condition oder einer präziseren äquivalenten Condition.
- [x] `Data Sifters` trägt keine reine Run-Condition, sondern Node-Trash-last-turn-Condition.
- [x] `Underworld Mole` trägt Trace-, Tag- und Resource-Trash-Semantik plus TargetProfile-Kandidat für recently installed resource.
- [x] `Schlaghund Pointers` dokumentiert Run-this-game-Condition und Trace-Kosten/Risiko, soweit modellierbar.
- [x] `Datapool(R) by Zetatech` und `Netwatch Credit Voucher` werden konsistent als Tag-Snowball/Additional-Tag-Follow-up behandelt, nicht als normale initiale Tag-Quelle, wenn `tag.source` das bedeutet.
- [x] `Punitive Counterstrike`, `Scorched Earth` und `Urban Renewal` haben präzise Meat-Damage-/Tagged-Meat-Damage-Semantik und Amount/Severity als Evidence oder Metadata, soweit möglich.
- [x] `Rent-to-Own Contract` ist nicht fälschlich als Temporary-Rez modelliert, sondern als Deferred-/Installment-Rez mit passendem Risiko.
- [x] `Emergency Rig` dokumentiert Free-Rez, Temporary-Rez/Kludge-Lifetime und TargetProfile-X-/Lifetime-Choice als Candidate oder Schema-Gap.
- [x] TargetProfile-Kandidaten für Corporate Detective Agency, Power Grid Overload, Falsified-Transactions Expert, Advancement-Operations, Emergency Rig, Rent-to-Own Contract und Underworld Mole sind geschärft oder als Schema-Gap dokumentiert.
- [x] Test-/V08-Operations sind in Reports als Test/Fixture getrennt erkennbar.
- [x] Counts trennen mindestens `productionOriginalsetOperations`, `productionProteusOperations`, `activeTestOperations` und `inactiveClassicOperations`.
- [x] StrategySupportPairs für Testkarten sind entweder klar `testOnly` markiert oder aus Produktionsaggregationen ausgeschlossen.
- [x] Hidden-Info-Sicherheit ist bestätigt.
- [x] Review-Dokument und JSON-Report sind erstellt und verlinkbar.

## Umsetzungshinweise

- Konservativ arbeiten: Kartentext schlägt Cluster, Name und frühere Hints.
- Economy, Draw und Recovery sind getrennte Funktionen.
- Credit-Signale nur verwenden, wenn Credits gewonnen, bereitgestellt oder zweckgebunden verfügbar gemacht werden; Runner-Credit-Verlust ist kein Corp-Credit-Gain.
- Advancement-Counter-Erzeugung ist nicht dasselbe wie Advancement-Counter-Transfer.
- Positive Effekte und Conditions/Risiken getrennt modellieren.
- `advance.score_window_support` nur als unterstützende Evidenz nutzen, nicht als zwingende Condition.
- `advance.overadvance_support` nur setzen, wenn die Karte tatsächlich Overadvance unterstützen kann, und nicht als alleinige Strategieankerursache verwenden.
- Keine großflächige Signalumbenennung, wenn Consumer oder Checks betroffen wären; missverständliche Präfixe sonst als Deferred Item dokumentieren.
- JSON-Report soll mindestens `taskId: "AI025-1"`, `sourceCommit`/`correctsCommit`, `countsBefore`, `countsAfter`, `changedCards`, `changedSignals`, `removedSignals`, `addedSignals`, `changedStrategySupportPairs`, `changedTargetProfiles`, `retainedDeferredItems`, `hiddenInfoSafetyReview` und `verification` enthalten.

## Empfohlene Checks

- [x] `node scripts/check-ai025-corp-operations-semantics.mjs`
- [x] Neuer oder erweiterter AI025-1-Check
- [x] `corepack pnpm check:ai-strategy-taxonomy`
- [x] AI-Compiled-/Inspector-/Manual-/Quality-/Approval-Checks
- [x] DeckDoctrine-Check
- [x] `corepack pnpm --filter @netgrid/ai test`
- [x] AI-Typecheck
- [x] Web-Typecheck
- [x] `git diff --check`

## Ergebnisnotiz

AI025-1 wurde als gezielte Nachkorrektur umgesetzt. Die 40 aktiven/compiled Corp-Operations bleiben abgedeckt; 20 Operation-Hints wurden geschärft und 8 neue read-only Funktionssignale für präzisere Conditions, Tag-Snowball, Meat-Damage und Installment-Rez ergänzt.

Korrigiert wurden unter anderem Off-Site Backups ohne Draw, V08 Archive Planning Operation als Draw statt Archives-Recovery, Closed Accounts ohne Corp-Credit-Gain, Falsified-Transactions Expert als Counter-Transfer, Advancement-Burst-Operations ohne falsche vorhandene-Counter-Condition, New Blood ohne Run-last-turn-Condition, Data Sifters/Underworld Mole/Schlaghund Pointers mit präziseren Conditions, Datapool by Zetatech und Netwatch Credit Voucher als Additional-Tag-Follow-up statt initiale Tag-Quelle, tagged Meat-Damage-Operations mit präzisem Damage-Signal sowie Rent-to-Own Contract als Deferred-/Installment-Rez statt Temporary-Rez.

Die Änderung erzeugt keine neuen Strategy IDs und keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung. Batch1 Generated-Facts bleibt bewusst `needs_followup`, weil die alten Deriver die neuen präzisen Operation-Signale noch nicht vollständig bestätigen; dies ist als Report-/Test-Erwartung dokumentiert. Paketchecks, AI-Checks, `@netgrid/ai`-Tests, AI/Web-Typechecks und `git diff --check` sind erfolgreich gelaufen.
