---
activityId: act-2026-06-02-ai026-1-corp-nodes-assets-semantics-polish
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-03
completedAt: 2026-06-03
branch: codex/ai026-1-corp-node-asset-polish
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md
  - docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json
  - scripts/apply-ai026-1-corp-nodes-assets-semantics-polish.mjs
  - scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs
checks:
  - node scripts/check-ai026-corp-nodes-assets-semantics.mjs
  - node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs
  - corepack pnpm check:ai-strategy-taxonomy
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-inspector-index
  - corepack pnpm check:ai-hint-compiled-index
  - corepack pnpm check:ai-derived-facts
  - corepack pnpm check:ai-derived-facts-full
  - corepack pnpm check:ai-manual-overlays
  - corepack pnpm check:ai-approval-consistency
  - corepack pnpm check:ai-hint-quality
  - corepack pnpm check:ai-deck-doctrine-strategy
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit
  - corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit
  - git diff --check
---

# AI026-1: Corp Nodes/Assets Taktiksignale und Strategieanker nachschärfen

## Ziel

AI026 soll als begrenzte Nachkorrektur fachlich geschärft werden, ohne die gesamte Corp-Nodes-/Assets-Semantik neu zu entwerfen. Falsche oder zu grobe Taktiksignale sollen korrigiert, Damage-Typen bei Ambush-/Access-Punish-Karten präzisiert, falsche Strategy-Rollen bereinigt, unpassende Strategieanker entfernt oder begründet, Draw/Hand Size/HQ-Reveal-Economy/Recovery sauberer benannt und TargetProfiles von statischen Constraints getrennt werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI026-1: Corp Nodes/Assets Taktiksignale und Strategieanker nachschärfen`.
- Ausgangslage aus Auftrag: AI026 ist umgesetzt und prüft 54 aktive/compiled Corp-Nodes/Assets aus der Repo-Wahrheit:
  - 41 Originalset Corp-Nodes/Assets
  - 11 Proteus Corp-Nodes/Assets
  - 2 aktive Test-/V08-Assets
  - 3 inaktive/known Classic-Nodes/Assets im Inventarcheck
- AI026 bleibt als read-only Foundation-Schritt grundsätzlich gültig:
  - Node-/Asset-Typen und Subtypen wie AI, Ambush, Advertisement, Transactions, Virus und Random bleiben Kartendaten.
  - Keine neuen Strategy IDs.
  - Keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-/Default-, UI- oder Hidden-Info-Wirkung.
  - Hidden Node-/Asset-Semantik bleibt Corp-side bis rezzed/accessed/exposed/anderweitig legal bekannt.
- Leitfaden: aktueller NETGRID Taktiksignal-/Strategieanker-Guide V3.
- Relevante Artefakte:
  - `data/ai/tactic-signals-v1.json`
  - `data/ai/function-signal-derivation-v1.json`
  - `data/ai/ai-card-hints-active.json`
  - `data/ai/ai-card-hints-compiled.json`
  - `data/ai/ai-hint-inspector-index.json`
  - AI026-Review und AI026-JSON-Report
  - AI026-Check oder neuer AI026-1-Check

## Scope

- Corp Nodes/Assets aus AI026 gezielt prüfen und korrigieren.
- Damage-/Ambush-Semantik präzisieren:
  - `Setup!`
  - `TRAP!`
  - `Vacant Soulkiller`
  - `Virus Test Site`
  - `Bel-Digmo Antibody`
  - `Stereogram Antibody`
- Falsche Strategie-Rollen korrigieren:
  - `Blood Cat`
  - `Corprunner's Shattered Remains`
  - `Omniscience Foundation`
- Falsche oder zu grobe Funktionssignale korrigieren:
  - `Corporate Negotiating Center`
  - `Cowboy Sysop`
  - `Rescheduler`
  - `Syd Meyer Superstores`
- Draw und Hand Size von Economy-/Score-Kontext trennen:
  - `ESA Contract`
  - `Euromarket Consortium`
  - `Rustbelt HQ Branch`
- Installed-Economy-Signale schärfen:
  - `Information Laundering`
  - `Department of Truth Enhancement`
  - `South African Mining Corp`
- Extra-Action-Assets und Strategy-Anker prüfen:
  - `Remote Facility`
  - `Nevinyrral`
  - `Pacifica Regional AI`
- TargetProfiles von statischen Constraints trennen:
  - `Data Masons`
  - `Encoder, Inc.`
  - `Skälderviken SA Beta Test Site`
  - `Fortress Architects`
- Counter-Punish-Signale differenzieren:
  - `Doppelganger Antibody`
  - `Pattel Antibody`
- Test-/V08-Assets getrennt halten:
  - `simple_economy_asset`
  - `v08_cashout_asset`
- Review-Dokument erstellen: `docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-2026-06-02.md` oder aktuelles Datum.
- JSON-Report erstellen: `docs/reviews/ai/ai026-1-corp-nodes-assets-semantics-polish-report-2026-06-02.json`.

## Nicht im Scope

- Keine neuen Strategy IDs.
- Keine Planner-, ActionScore-, PlanWeight- oder DeckDoctrine-Wirkung.
- Keine Engine- oder Legalitätsänderung.
- Keine Targeting-KI.
- Keine UI-Änderung.
- Keine Runner-Karten.
- Keine Corp Agendas, ICE, Operations oder Upgrades.
- Keine Hidden-Info-Projektion.
- Keine großflächige Taxonomie-Umbenennung ohne Kompatibilitätsprüfung.
- Keine halb riskanten Änderungen; technisch unsichere Punkte als Deferred Item dokumentieren.

## Akzeptanzkriterien

- [x] 54 aktive/compiled Corp-Nodes/Assets bleiben abgedeckt.
- [x] Keine neuen Strategy IDs wurden eingeführt.
- [x] Keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung wurde erzeugt.
- [x] Verbotene Typ-/Subtyp-Signale aus AI026 bleiben entfernt, darunter `corp.asset`, `corp.node`, `node.ambush`, `node.virus`, `node.ai`, `asset.campaign` und vergleichbare Typ-/Subtyp-only-Signale.
- [x] `Setup!`, `TRAP!`, `Bel-Digmo Antibody` und `Stereogram Antibody` haben präzise Net-Damage-/Access-Punish-Semantik.
- [x] `Vacant Soulkiller` hat kein `meat_damage_payoff`, wenn der Kartentext Brain Damage sagt.
- [x] `Virus Test Site` hat kein `meat_damage_payoff`, wenn der Kartentext Net Damage sagt.
- [x] `TRAP!` ist keine `persistent_tag_source`; die Access-Tagquelle ist korrekt benannt.
- [x] `Blood Cat` ist keine `trace_credit_enabler`, sondern Trace-/Tag-Quelle.
- [x] `Corprunner's Shattered Remains` hat keinen `corp.tag_trace_punish`-Anker, sofern keine Tag-/Tagged-Condition existiert.
- [x] `Omniscience Foundation` ist als Tag-Snowball/Tag-Amplifier geprüft, nicht blind als initiale persistente Tag-Quelle.
- [x] `Corporate Negotiating Center` trägt kein `risk.high_difficulty_agenda`; HQ-Agenda-Reveal-/Informationsrisiko ist präzise modelliert oder als Deferred Item dokumentiert.
- [x] `Cowboy Sysop` trägt kein `archives.corp_recovery`; Uninstall-/Bounce-to-HQ-Semantik ist präzisiert.
- [x] `Rescheduler` trägt kein Topdeck-Setup-Signal, sofern keine kontrollierte Topdeck-Reorder-Wirkung existiert.
- [x] `Syd Meyer Superstores` trägt kein `ice.corp_install_discount` und kein `risk.temporary_rez_liability`; Cashout durch Trash eigener rezzed ICE ist modelliert.
- [x] Draw-/Hand-size-Signale werden nicht fälschlich als Economy-/Score-Kontext modelliert, sofern präzisere Signale verfügbar sind.
- [x] `Information Laundering`, `Department of Truth Enhancement` und `South African Mining Corp` unterscheiden Drip, Counter-Cashout, Charge-Bank und action-heavy Economy sauber oder dokumentieren Legacy-Aggregation.
- [x] `Remote Facility`, `Nevinyrral` und `Pacifica Regional AI` haben eine klare Extra-Action-/Fast-Advance-/Remote-Scoring-Strategieentscheidung; keine neue Corp-Tempo-Strategy-ID wird eingeführt.
- [x] `risk.leaves_play_loss` bei `Nevinyrral` bleibt zwingend sichtbar.
- [x] Statische ICE-Scope-Karten wie `Data Masons`, `Encoder, Inc.` und `Skälderviken SA Beta Test Site` haben keine TargetProfiles, wenn keine echte Zielwahl existiert; Subtyp-/Scope-Regeln bleiben Constraints/Kartensemantik.
- [x] `Fortress Architects` ist auf echte Zielwahl versus zukünftige Installkosten-Constraint geprüft.
- [x] `Doppelganger Antibody` und `Pattel Antibody` behalten Counter-Punish-Oberklasse nur bei Bedarf und erhalten präzisere Funktionssignale, wenn sinnvoll.
- [x] Test-/V08-Assets sind in Reports getrennt als Test/V08 erkennbar und verfälschen keine Produktions-StrategySupportPair-Aggregationen.
- [x] Hidden-Info-Sicherheit ist bestätigt.
- [x] Review-Dokument und JSON-Report sind erstellt und verlinkbar.

## Umsetzungshinweise

- Konservativ arbeiten: Kartentext schlägt Cluster, Name und frühere Hints.
- Damage-Typen präzise halten: Net, Meat und Brain nicht vermischen.
- `damage.payoff` höchstens als Oberklasse/Legacy verwenden und präzise Damage-Signale nicht ersetzen.
- Access-Ambush ist nicht automatisch Damage/Kill; der konkrete Access-Effekt entscheidet.
- Tag/Punish braucht Tag-Erzeugung, Tag-Ausnutzung oder tagged Runner Condition.
- TargetProfiles sind Zielwahlhilfen, keine statischen Subtyp-Constraints.
- Draw, Economy, Recovery und Hand Size sind getrennte Funktionen.
- Keine großflächige Signalumbenennung, wenn Consumer oder Checks betroffen wären; missverständliche Präfixe sonst als Deferred Item dokumentieren.
- JSON-Report soll mindestens `taskId: "AI026-1"`, `sourceCommit`/`correctsCommit`, `countsBefore`, `countsAfter`, `changedCards`, `changedSignals`, `removedSignals`, `addedSignals`, `changedStrategySupportPairs`, `changedTargetProfiles`, `retainedDeferredItems`, `hiddenInfoSafetyReview` und `verification` enthalten.

## Empfohlene Checks

- [x] `node scripts/check-ai026-corp-nodes-assets-semantics.mjs`
- [x] Neuer oder erweiterter AI026-1-Check
- [x] `corepack pnpm check:ai-strategy-taxonomy`
- [x] AI-Compiled-/Inspector-/Manual-/Quality-/Approval-Checks
- [x] DeckDoctrine-Check
- [x] `corepack pnpm --filter @netgrid/ai test`
- [x] AI-Typecheck
- [x] Web-Typecheck
- [x] `git diff --check`

## Ergebnisnotiz

AI026-1 wurde nach Guide V3 umgesetzt. Die 54 aktiven/compiled Corp-Nodes/Assets bleiben abgedeckt; 28 Node-/Asset-Hints wurden geschärft und 23 neue read-only Funktionssignale für präzise Access-Damage-/Tag-Ambushes, Draw, Hand Size, HQ-Reveal-Economy, Bounce/Uninstall, Counter-/Charge-Banks und eigene-ICE-Trash-Kosten ergänzt.

Korrigiert wurden unter anderem Net/Brain-Damage-Verwechslungen bei Setup!, TRAP!, Vacant Soulkiller, Virus Test Site und den Proteus-Antibodies, falsche Tag-/Trace-Rollen bei Blood Cat und Corprunner's Shattered Remains, Corporate Negotiating Center als HQ-Agenda-Reveal-Risiko statt High-Difficulty-Agenda, Cowboy Sysop ohne Archives-Recovery, Rescheduler ohne Topdeck-Setup, Syd Meyer ohne Install-/Temporary-Rez-Discount sowie Draw-/Hand-Size-Signale als `draw.corp_draw` und `setup.corp_hand_size` statt Economy-/Score-Ersatz.

Die Änderung erzeugt keine neuen Strategy IDs und keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung. Paketchecks, AI-Checks, `@netgrid/ai`-Tests, AI/Web-Typechecks und `git diff --check` sind erfolgreich gelaufen.
