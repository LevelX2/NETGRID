---
activityId: act-2026-06-02-ai024-1-corp-ice-semantics-polish
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
  - docs/reviews/ai/ai024-1-corp-ice-semantics-polish-2026-06-02.md
  - docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json
  - scripts/apply-ai024-1-corp-ice-semantics-polish.mjs
  - scripts/check-ai024-1-corp-ice-semantics-polish.mjs
checks:
  - node scripts/check-ai024-corp-ice-semantics.mjs
  - node scripts/check-ai024-1-corp-ice-semantics-polish.mjs
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

# AI024-1: Corp-ICE-Taktiksignale und Strategieanker nachschärfen

## Ziel

AI024 soll als begrenzte Nachkorrektur fachlich geschärft werden, ohne die gesamte Corp-ICE-Semantik neu zu entwerfen. Konkrete Kartentext-Abweichungen sollen korrigiert, fehlende Funktionssignale ergänzt, falsche Signale entfernt, zu generische `corp_ice.other_utility`-Zuordnungen präzisiert und zu breite Strategieanker bei einfachen Program-Trash-ICE begrenzt werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI024-1: Corp-ICE-Taktiksignale und Strategieanker nachschärfen`.
- Ausgangslage aus Auftrag: AI024 ist umgesetzt und lokal committed.
- AI024 prüft laut Auftrag 95 aktive/compiled Corp-ICE aus Originalset und Proteus sowie 11 bekannte inaktive Classic-ICE.
- AI024 bleibt als Foundation-Schritt grundsätzlich gültig:
  - Subtypen werden nicht als Taktiksignale gespiegelt.
  - Neue `corp_ice.*`-Signale sind read-only.
  - Keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-, UI- oder Hidden-Info-Wirkung.
  - Hidden-Info-Grenzen für unrezzed ICE bleiben gewahrt.
- Leitfaden: aktueller NETGRID Taktiksignal-/Strategieanker-Guide V2.
- Relevante Artefakte:
  - `data/ai/tactic-signals-v1.json`
  - `data/ai/function-signal-derivation-v1.json`
  - `data/ai/ai-card-hints-active.json`
  - `data/ai/ai-card-hints-compiled.json`
  - `data/ai/ai-hint-inspector-index.json`
  - AI024-Review und AI024-JSON-Report
  - AI024-Check oder neuer AI024-1-Check

## Scope

- Corp ICE aus AI024 gezielt prüfen und korrigieren.
- Offensichtliche Kartentext-Abweichungen nachprüfen und korrigieren:
  - `Zombie`
  - `Colonel Failure`
  - `Fragmentation Storm`
  - `Asp`
  - `Fang`
  - `Fang 2.0`
  - `Rex`
  - `Hunter`
  - `Fetch 4.0.1`
  - `TKO 2.0`
  - `Shock.r`
  - `Jack Attack`
  - `Too Many Doors`
- Proteus-ICE mit untererfasster Funktion prüfen:
  - `Chihuahua`
  - `Coyote`
  - `Washed-Up Solo Construct`
  - `Marionette`
  - `Datacomb`
  - `Twisty Passages`
  - `Scaffolding`
  - `Tumblers`
  - `Death Yo-Yo`
  - `Snowbank`
  - `Misleading Access Menus`
  - `Riddler`
  - `Iceberg`
  - `Homing Missile`
- Multi-End-Run-Zuordnungen gegen Kartentext prüfen, mindestens `Cortical Scanner`, `Endless Corridor`, `Reinforced Wall`, `Wall of Ice`, `Toughonium™ Wall`, `Colonel Failure` und `Data Wall 2.0`.
- Program-Trash-Strategieanker begrenzen, mindestens bei `Banpei`, `D'Arc Knight`, `Data Naga`, `Ice Pick Willie`, `Sentinels Prime`, `Triggerman`, `Marionette`, `Washed-Up Solo Construct`, `Colonel Failure`, `Viral 15`, `Cortical Scrub` und `Fragmentation Storm`.
- Damage-Kill-Anker prüfen, besonders bei `Bolter Cluster`, `Cerberus`, `Cinderella`, `Homewrecker`, `Wall of Ice`, `Mastermind`, `Mobile Barricade`, `Chihuahua`, `Iceberg`, `Laser Wire`, `Razor Wire`, `Shotgun Wire`, `Nerve Labyrinth` und `Neural Blade`.
- Alle Karten mit `corp_ice.other_utility` prüfen und präzisere Funktionssignale verwenden, wenn vorhanden.
- Kleine kontrollierte neue Signale nur ergänzen, wenn bestehende Signale nicht ausreichen und mehrere Karten oder wiederkehrende Situationen profitieren.
- TargetProfile-Kandidaten nur bestätigen oder korrigieren, nicht aktivieren.
- Review-Dokument erstellen: `docs/reviews/ai/ai024-1-corp-ice-semantics-polish-2026-06-02.md` oder aktuelles Datum.
- JSON-Report erstellen: `docs/reviews/ai/ai024-1-corp-ice-semantics-polish-report-2026-06-02.json`.

## Nicht im Scope

- Keine neuen Strategy IDs.
- Keine Planner-, ActionScore-, PlanWeight- oder DeckDoctrine-Wirkung.
- Keine Engine- oder Legalitätsänderung.
- Keine Targeting-KI.
- Keine UI-Änderung.
- Keine Runner-Karten.
- Keine Corp Agendas, Operations, Nodes oder Upgrades.
- Keine Hidden-Info-Projektion für unrezzed ICE.
- Keine großflächige Taxonomie-Umbenennung ohne Kompatibilitätsprüfung.
- Keine halb riskanten Änderungen; technisch unsichere Punkte als Deferred Item dokumentieren.

## Akzeptanzkriterien

- [x] 95 aktive/compiled Corp-ICE bleiben abgedeckt.
- [x] Keine neuen Strategy IDs wurden eingeführt.
- [x] Keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung wurde erzeugt.
- [x] Verbotene Subtyp-Signale aus AI024 bleiben verboten, darunter `corp_ice.ap`, `corp_ice.black_ice`, `corp_ice.code_gate`, `corp_ice.sentry`, `corp_ice.wall` und vergleichbare Subtyp-only-Signale.
- [x] `Zombie` hat Brain-Damage- und End-Run-Signale statt bloßem `corp_ice.other_utility`.
- [x] `Colonel Failure` hat Program-Trash- und Multi-End-Run-Signale; ein falscher Maintenance-/Self-Bounce-Drawback ist entfernt, falls kein Kartentextbezug existiert.
- [x] `Fragmentation Storm` hat keine Net-Damage-/Damage-Payoff-Signale, wenn der Kartentext keinen Net Damage enthält.
- [x] `Asp`, `Fang`, `Fang 2.0` und `Rex` haben keine Tag-Signale, wenn der Kartentext keine Tags gibt.
- [x] `Hunter` und `Fetch 4.0.1` behalten Tag-Signale und erhalten kein `conditional_end_run`, falls kein ETR-Effekt existiert.
- [x] `TKO 2.0` hat Action-Loss-/Action-Tax-Semantik.
- [x] `Shock.r` hat präzisere Lock-Semantik statt nur `corp_ice.other_utility`.
- [x] `Jack Attack` erhält Jack-out-Lock-Semantik zusätzlich zu Trace-/Tag-Signalen.
- [x] `Too Many Doors` hat kein R&D-Reorder-Signal.
- [x] `Chihuahua` enthält Trace- und Rez-Economy-Semantik.
- [x] `Coyote` enthält Future-Strength-Buff- und Rez-Economy-Semantik statt bloßem `corp_ice.other_utility`.
- [x] `Washed-Up Solo Construct` enthält Program-Trash-/Pay-or-trash- und Rez-Economy-Semantik.
- [x] `Marionette`, `Datacomb`, `Twisty Passages`, `Scaffolding`, `Tumblers` und `Death Yo-Yo` sind auf Self-Bounce-/pass-triggered gain-/Rez-Economy-Abgrenzung geprüft.
- [x] `Snowbank` und `Misleading Access Menus` sind als Pay-or-ETR plus Rez-Economy modelliert; `run_lock` wird nur genutzt, wenn fachlich passend.
- [x] `Riddler` und `Iceberg` bilden Encounter-paid-subroutine-scaling ab, nicht bloß Rez-paid-scaling oder Vanilla-ETR.
- [x] `Homing Missile` enthält Trace, Conditional-ETR und Run-Lock zusätzlich zu paid-X/rez-scaling.
- [x] `corp_ice.multi_end_run` ist nur bei tatsächlichen mehreren ETR-Subroutinen oder mehreren erzeugten ETR gesetzt.
- [x] `Data Wall 2.0` hat `corp_ice.multi_end_run` nur, wenn der Repo-Kartentext tatsächlich mehrere ETR-Subroutinen enthält.
- [x] Einfache Program-Trash-ICE erzeugen nicht automatisch `corp.ice_tax_glacier`.
- [x] `corp.damage_kill` bei ICE ist nur gesetzt, wenn das ICE eine belastbare Kill-/Damage-Drucklinie trägt.
- [x] `damage.payoff` ist nicht alleinige Anchor-Evidenz, wenn präzisere Damage-Signale fehlen.
- [x] `corp_ice.other_utility` bleibt nur für echte Restfälle und ist im Review begründet.
- [x] TargetProfile-Kandidaten sind bestätigt oder korrigiert, aber nicht aktiviert.
- [x] Hidden-Info-Sicherheit ist bestätigt: Corp-ICE-Semantik bleibt `corp_side_only_until_rezzed`, bis ICE rezzed, exposed oder anderweitig legal bekannt ist.
- [x] Review-Dokument und JSON-Report sind erstellt und verlinkbar.

## Umsetzungshinweise

- Konservativ arbeiten: Kartentext schlägt Subtyp, Cluster und Name.
- Generische Signale wie `corp_ice.other_utility` dürfen präzise Funktionssignale nicht ersetzen.
- Positive Effekte und Risiken getrennt modellieren.
- Neue Signale nur einführen, wenn kein passendes vorhandenes Signal existiert, der Name präzise ist, `sideScope: corp` passt und keine Runtimewirkung entsteht. Mögliche Kandidaten aus Auftrag:
  - `corp_ice.jackout_lock`
  - `corp_ice.runner_action_loss`
  - `corp_ice.next_ice_break_lock`
  - `corp_ice.encounter_paid_subroutine_add`
  - `corp_ice.optional_self_bounce_gain`
  - `corp_ice.runner_pay_or_program_trash`
- `corp.ice_tax_glacier` nur bei echter Tax-/Lock-/starker Payoff-Linie setzen; einfaches Program-Trash + ETR bleibt grundsätzlich support-only.
- TargetProfile-Kandidaten nur diagnostisch/read-only behandeln, insbesondere paid-X/rez-scaling, on-rez mode/type choice, position changes und secret bidding.
- JSON-Report soll mindestens `taskId: "AI024-1"`, `sourceCommit`/`correctsCommit`, `countsBefore`, `countsAfter`, `changedCards`, `changedSignals`, `removedSignals`, `addedSignals`, `changedStrategySupportPairs`, `retainedDeferredItems`, `hiddenInfoSafetyReview` und `verification` enthalten.

## Empfohlene Checks

- [x] `node scripts/check-ai024-corp-ice-semantics.mjs`
- [x] Neuer oder erweiterter AI024-1-Check
- [x] `corepack pnpm check:ai-strategy-taxonomy`
- [x] AI-Compiled-/Inspector-/Manual-/Quality-/Approval-Checks
- [x] DeckDoctrine-Check
- [x] `corepack pnpm --filter @netgrid/ai test`
- [x] AI-Typecheck
- [x] Web-Typecheck
- [x] `git diff --check`

## Ergebnisnotiz

AI024-1 wurde als begrenzte Nachkorrektur umgesetzt: 95 aktive/compiled Corp-ICE bleiben abgedeckt, 38 ausgewählte ICE-Hints wurden fachlich nachgeschärft und 6 neue read-only `corp_ice.*`-Signale ergänzt. Die Korrektur entfernt falsche Tag-, Damage-, R&D-Reorder-, Self-Bounce- und zu breite Program-Trash-Strategieanker-Zuordnungen, präzisiert `corp_ice.other_utility`-Restfälle und bestätigt die Hidden-Info-Grenze `corp_side_only_until_rezzed`.

Die Änderung erzeugt keine neuen Strategy IDs und keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil-, UI- oder Hidden-Info-Leak-Wirkung. Review-Dokument, JSON-Report, Apply-Script und Check-Script wurden erstellt; AI024/AI024-1-Checks, AI-Qualitätschecks, AI/Web-Typechecks, `@netgrid/ai`-Tests und `git diff --check` sind erfolgreich gelaufen.
