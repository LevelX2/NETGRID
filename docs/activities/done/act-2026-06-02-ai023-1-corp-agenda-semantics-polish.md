---
activityId: act-2026-06-02-ai023-1-corp-agenda-semantics-polish
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-02
completedAt: 2026-06-02
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - data/ai/tactic-signals-v1.json
  - data/ai/function-signal-derivation-v1.json
  - data/ai/ai-card-hints-active.json
  - data/ai/ai-card-hints-compiled.json
  - data/ai/ai-hint-inspector-index.json
  - docs/reviews/ai/ai023-corp-agendas-semantics-review-2026-06-02.md
  - docs/reviews/ai/ai023-corp-agendas-semantics-review-report-2026-06-02.json
  - docs/reviews/ai/ai023-1-corp-agendas-semantics-polish-2026-06-02.md
  - docs/reviews/ai/ai023-1-corp-agendas-semantics-polish-report-2026-06-02.json
  - docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-alias-report-2026-05-31.json
  - docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json
  - docs/reviews/ai/ai006-deck-doctrine-strategy-aggregation-v1-report-2026-05-31.json
  - docs/reviews/ai/aufgabe-042-full-compiled-hint-coverage-report-2026-05-25.json
  - scripts/apply-ai023-corp-agendas-semantics.mjs
  - scripts/check-ai023-corp-agendas-semantics.mjs
  - scripts/check-ai023-1-corp-agendas-semantics-polish.mjs
checks:
  - node scripts/apply-ai023-corp-agendas-semantics.mjs
  - corepack pnpm build:ai-compiled-hints
  - corepack pnpm build:ai-hint-inspector-index
  - node scripts/check-ai-hint-compiled-index.mjs --write
  - node scripts/check-ai023-corp-agendas-semantics.mjs
  - node scripts/check-ai023-1-corp-agendas-semantics-polish.mjs
  - corepack pnpm check:ai-strategy-taxonomy
  - corepack pnpm check:ai-hint-quality
  - corepack pnpm check:ai-approval-consistency
  - corepack pnpm check:ai-deck-doctrine-strategy
  - corepack pnpm check:ai-compiled-hints
  - corepack pnpm check:ai-hint-inspector-index
  - corepack pnpm check:ai-hint-compiled-index
  - corepack pnpm check:ai-manual-overlays
  - corepack pnpm --filter @netgrid/ai test
  - corepack pnpm check:ai-derived-facts
  - node scripts/check-ai-derived-facts-full.mjs --write
  - corepack pnpm check:ai-derived-facts-full
  - corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit
  - corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit
---

# AI023-1: Corp-Agenda-Semantik fachlich nachschärfen

## Ziel

AI023 soll als begrenzte Nachkorrektur fachlich geschärft werden, ohne die gesamte Corp-Agenda-Semantik neu zu öffnen. Overadvance darf nicht vorschnell als Fast Advance modelliert werden, Damage-Amplifier sollen nicht als direkte Damage-Payoffs erscheinen, missverständliche Signalnamen sollen präzisiert oder als Deferred Items dokumentiert werden, und support-only Signale sollen sauber von Strategieanker-Evidenz getrennt bleiben.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI023-1: Corp-Agenda-Semantik fachlich nachschärfen`.
- Korrigiert den lokal committed AI023-Stand `f6fb69f8 ai: review corp agenda semantics`.
- AI023 hat 43 aktive/compiled Corp-Agendas geprüft, 69 Corp-Agenda-Taktiksignale katalogisiert, 31 `strategySupportPairs` erstellt und keine neuen Strategy IDs eingeführt.
- Aktueller Leitfaden: `docs/ai/netgrid_taktiksignal_strategieanker_guide_v2.md`.
- Relevante AI-Artefakte:
  - `data/ai/tactic-signals-v1.json`
  - `data/ai/function-signal-derivation-v1.json`
  - `data/ai/ai-card-hints-active.json`
  - `data/ai/ai-card-hints-compiled.json`
  - `data/ai/ai-hint-inspector-index.json`
  - AI023-Review und AI023-JSON-Report
  - vorhandener AI023-Check oder neuer AI023-1-Check

## Scope

- Gezielt die AI023-Corp-Agendas nachprüfen, nicht Runner-Karten, Corp ICE, Operations, Nodes oder Upgrades.
- `Project Babylon`, `Project Venice`, `Project Zurich` und ggf. `World Domination` auf Overadvance-/Fast-Advance-Abgrenzung prüfen.
- `Bioweapons Engineering` prüfen: `damage.payoff` nur behalten, wenn der Katalog Damage-Amplifier ausdrücklich umfasst; präzisere Signale `score.damage_amp` und `score.meat_damage_amp` bevorzugen.
- `Corporate Headhunters` prüfen: Brain-Damage-nahe Signalnamen nur verwenden, wenn der Kartentext tatsächlich Brain Damage trägt; sonst präzisere Hand-size-/Damage-Pressure-Signale verwenden oder ergänzen.
- Alle AI023-`strategySupportPairs` prüfen und support-only Evidenz von primärer Anker-Evidenz trennen.
- Agenda-spezifische `score.*`-Signale dokumentieren: `score.*` beschreibt Agenda-/Score-Kontext und nicht automatisch allgemeine Economy oder allgemeines Scoringverhalten.
- TargetProfile-Kandidaten aus AI023 nur plausibilisieren, nicht aktivieren.
- Hidden-Info-Sicherheit bestätigen: keine neue Runtime-Projektion, keine UI-/Inspector-Leaks, keine Runner-KI-Sicht auf verdeckte Corp-Agenda-Semantik vor Reveal/Access/Score/anderer legaler Sichtbarkeit.
- Review-Dokument erstellen: `docs/reviews/ai/ai023-1-corp-agendas-semantics-polish-2026-06-02.md` oder aktuelles Datum.
- JSON-Report erstellen: `docs/reviews/ai/ai023-1-corp-agendas-semantics-polish-report-2026-06-02.json`.

## Nicht im Scope

- Keine neuen Strategy IDs.
- Keine allgemeine Taxonomie-Neustrukturierung.
- Keine Änderung an Planner, ActionScore, PlanWeight oder DeckDoctrine.
- Keine Engine-, LegalAction-, Targeting-, Profil- oder UI-Änderung.
- Keine Änderung an Hidden-Info-, Visibility-, Reconnect-, Undo-, Replay-, Log- oder Client-Fehler-Projektionen.
- Keine neue Targeting-KI.
- Keine fachliche Migration von Corp ICE, Operations, Nodes, Upgrades oder Runner-Karten.
- Keine halb riskante technische Änderung; fachlich sinnvolle, aber zu riskante Punkte als Deferred Item dokumentieren.

## Akzeptanzkriterien

- [x] 43 aktive/compiled Corp-Agendas bleiben abgedeckt.
- [x] Keine neuen Strategy IDs wurden eingeführt.
- [x] Keine Planner-, ActionScore-, PlanWeight-, Engine-, Legalitäts-, Targeting-, Profil- oder UI-Wirkung wurde erzeugt.
- [x] Keine Hidden-Info-Leak-Wirkung wurde erzeugt.
- [x] `Project Babylon` und `Project Venice` sind entweder bewusst als Fast-Advance-Konvention dokumentiert oder nicht mehr an `corp.fast_advance` gehängt.
- [x] Die Konsistenz zwischen `Project Venice` und `Project Zurich` ist begründet.
- [x] `World Domination` bleibt nur dann `corp.remote_scoring -> win_condition`, wenn der Befund dies weiter trägt.
- [x] `Bioweapons Engineering` trägt kein unpräzises direktes Damage-Payoff-Signal, sofern `damage.payoff` direkte Schadensquelle oder direkten Damage-Payoff meint.
- [x] `Corporate Headhunters` trägt kein missverständliches Brain-Damage-Signal, sofern kein Brain-Damage-Effekt existiert.
- [x] Support-only Signale erzeugen nicht allein Strategieanker; besonders geprüft sind `score.overadvance_bonus`, `score.overadvance_scaling`, `score.bonus_agenda_points`, `risk.requires_tagged_runner` und `access.agenda_ambush`.
- [x] Der Review trennt, soweit praktikabel, `primaryAnchorEvidence` und `supportingEvidence`.
- [x] `score.economy_action` und `score.recurring_extra_action` sind als Agenda-/Score-Kontext dokumentiert und nicht als allgemeine Economy-Strategie missverstanden.
- [x] Fetal AI, Marked Accounts und Viral Breeding Ground bleiben hidden-info-safe.
- [x] TargetProfile-Kandidaten bleiben inaktiv und sind nur auf Status/Plausibilität geprüft.
- [x] Deferred Items sind dokumentiert, insbesondere eine mögliche Overadvance-/Closeout- oder Corp-Tempo-Linie ohne neue Strategy ID.
- [x] Review-Dokument und JSON-Report sind erstellt und verlinkbar.

## Umsetzungshinweise

- Konservativ arbeiten: Änderungen nur vornehmen, wenn der Repo-Befund die fachliche Vermutung bestätigt.
- Falls `corp.fast_advance` im bestehenden Modell bewusst auch Overadvance-Payoffs umfasst, diese Konvention ausdrücklich im Review und in den Rationales dokumentieren; andernfalls entsprechende Strategieanker entfernen oder als Deferred/Candidate notieren.
- Keine neuen freien oder kartenspezifischen Taktiksignale einführen; vorhandene Katalogkonventionen zuerst prüfen.
- JSON-Report soll mindestens `taskId: "AI023-1"`, `sourceCommit`/`correctsCommit`, `changedCards`, `changedSignals`, `changedStrategySupportPairs`, `retainedDeferredItems`, `hiddenInfoSafetyReview` und `verification` enthalten.
- Erwartete Mindestchecks, soweit vorhanden:
  - `node scripts/check-ai023-corp-agendas-semantics.mjs`
  - neuer oder erweiterter AI023-1-Check
  - `corepack pnpm check:ai-strategy-taxonomy`
  - AI-Compiled-/Inspector-/Manual-/Quality-/Approval-Checks
  - DeckDoctrine-Check
  - `corepack pnpm --filter @netgrid/ai test`
  - AI-Typecheck
  - Web-Typecheck
  - `git diff --check`
- Wenn alles grün ist, lokalen Commit mit einer Nachricht wie `ai: polish corp agenda semantics` erstellen, sofern der ausführende Abschluss-/Umsetzungsworkflow Committen vorsieht.

## Ergebnisnotiz

AI023-1 ist abgeschlossen. `Project Babylon`, `Project Venice` und `Project Zurich` bleiben Overadvance-/Tempo-/Economy-Support ohne `corp.fast_advance`-Anker; `World Domination` bleibt begründet `corp.remote_scoring -> win_condition`. `Bioweapons Engineering` nutzt nur noch die präzisen Damage-Amplifier-Signale `score.meat_damage_amp` und `score.damage_amp`; `Corporate Headhunters` nutzt `score.hand_size_pressure` statt Brain-Damage-Mischsignal. Der AI023-Report trennt jetzt `primaryAnchorEvidence` und `supportingEvidence`, der neue AI023-1-Report dokumentiert Delta, Deferred Items, TargetProfile-Inaktivität und Hidden-Info-Sicherheit.

Checks: fokussierte AI023-/AI023-1-Checks, AI-Compiled-/Inspector-/Manual-/Quality-/Approval-Gates, DeckDoctrine-Check, `@netgrid/ai`-Tests, Derived-Facts-Gates sowie AI- und Web-Typechecks bestanden. Der Full-Derived-Facts-Report wurde per `--write` aktualisiert und anschließend erfolgreich mit `--check` geprüft.
