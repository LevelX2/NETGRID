# Deck Strategy Runtime Process 2026-06-25

Status: `active: DSR-07 next`

Quelle/Vorgabe: `C:\Users\Lui\Downloads\NETGRID_Codex_Goal_Deckstrategie_Runtime_Stufenplan.md`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Stufenfolge, Sicherheitsgrenzen, relevante Startartefakte, Verifikationsregeln und Definition of Done sind definiert. Kleine Lücken werden konservativ geschlossen: Dateischnitte folgen vorhandenen `packages/ai/src/**`-Mustern, neue Logik bleibt AI-intern, und produktive Wirkung wird nur über bereits angebotene `LegalActions` erzielt.

## Gesamtziel

Die aus dem Deck abgeleitete Strategie wird für Runner und Corp zu einer produktiven, persistenten und begrenzten Steuerungsebene. Sie erzeugt einen side-sicheren `StrategicIntentState`, speist TacticalGoals und TacticalPlans, beeinflusst die semantische LegalAction-Auswahl nachvollziehbar und bleibt jederzeit durch HardGates, akute Gefahren, sichere Closeouts, Kosten, Reachability und Boardstate übersteuerbar.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Arbeitsbranch: `codex/deck-strategy-runtime`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_deck_strategy_runtime`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für Preflight und finalen lokalen Merge genutzt.
- Verifikationsbasis ist mindestens `corepack pnpm --filter @netgrid/ai test`, `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check`.
- Repo-weite Checks werden ergänzt, wenn gemeinsame Typen, Engine, Server oder Web geändert werden.

## Nicht-Ziele

- Keine neue Engine-Regelautorität.
- Keine Erzeugung neuer Actions außerhalb bestehender `LegalActions`.
- Keine neue Hidden-Info-Projektion.
- Keine Produkt-, Public-, Canary- oder Rollout-Kaskade.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
- Keine breite UI-, Server- oder Engine-Änderung ohne direkte Notwendigkeit.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein Blocker dokumentiert ist.
- TacticalPlans bleiben Mapping- und Ausführungsschicht, nicht Kartensemantikquelle.
- Strategische Wirkung liegt auf der höchsten passenden Ebene: Doctrine, IntentState, TacticalGoal, TacticalPlan oder ActionGoalFit.
- Bestehende gute Mechanismen, Replay-Fixes, HardGates und NeutralDoctrine bleiben erhalten.
- `packages/ai/src/index.ts` bleibt Fassade.

## Automatische Fehlerbehandlung

- Rote Tests werden eng auf das aktive Paket zurückgeführt.
- Unklare Altdaten oder nicht benötigte Legacy-Pfade werden erst nach Consumer-Audit entfernt.
- Bei Konflikten mit `main` werden beide Intentionen gelesen und, wenn fachlich kompatibel, erhalten.
- Sicherheitsblocker stoppen den Prozess ohne Rückfrage und erhalten einen Blocker-Report mit Removal Condition.

## Sicherheitsblocker

- Produktive Auswahl nutzt nicht mehr ausschließlich Engine-`LegalActions`.
- Neue verdeckte gegnerische Karteninformation wird in AIInput, Debug, Trace, Replay, Log oder Public Payload sichtbar oder entscheidungswirksam.
- Determinismus, Replayfähigkeit oder StateHash-Vertrag werden durch AI-Memory verletzt.
- HardGates, Kosten-, Timing-, Target- oder Reachability-Prüfungen werden vor strategischer Gewichtung abgeschwächt.
- Opening-Hand-/Mulligan-Funktion geht beim Legacy-Abbau verloren.

## State Machine

```text
preflight
-> P0 inventory
-> P1 runtime-contract
-> P2 doctrine-hardening
-> P3 strategic-intent
-> P4 goal-merge
-> P5 persistence
-> P6 tactical-plans
-> P7 bounded-overrides
-> P8 vertical-slices
-> P9 diagnostics
-> P10 legacy-cleanup
-> P11 final-validation
-> integration-preflight
-> merged-to-main
-> complete
```

## Paketfolge

1. `DSR-00` Ist-Zustand und Consumer verifizieren. Status: `done`, Commit: `77ebf459`.
2. `DSR-01` Einheitlichen strategischen Laufzeitvertrag festlegen. Status: `done`, Commit: `79decae4`.
3. `DSR-02` DeckStrategyProfile und Doctrine fachlich härten. Status: `done`, Commit: `c5a1b920`.
4. `DSR-03` Runner- und Corp-StrategicIntent produktiv machen. Status: `done`, Commit: `8a0e9e55`.
5. `DSR-04` Doctrine-, Boardstate-, Neutral- und Threat-Ziele zusammenführen. Status: `done`, Commit: `30506fea`.
6. `DSR-05` Persistenten StrategicIntentState und Phasenfortschritt einführen. Status: `done`, Commit: `16a70206`.
7. `DSR-06` StrategicIntent in TacticalPlans übersetzen. Status: `done`, Commit: pending.
8. `DSR-07` Begrenzte strategische Übersteuerung der Einzelaktionswertung. Status: `next`.
9. `DSR-08` Vertikale Spielstärke-Slices implementieren und kalibrieren.
10. `DSR-09` Diagnose und Kommentare auf neue Entscheidungsabsicht ausrichten.
11. `DSR-10` Legacy-Abhängigkeiten abbauen und unnötigen Code entfernen.
12. `DSR-11` Gesamtvalidierung, Review, Wissenspflege und Integration.

## Paketdetails

### DSR-00 Ist-Zustand und Consumer verifizieren

Ziel: Alle produktiven, diagnostischen, Shadow-, Legacy- und ungenutzten Doctrine-/Intent-/Goal-/Plan-Pfade identifizieren.

Arbeit:

- Consumer von `DeckDoctrine`, `planWeights`, `buildDeckStrategyProfile`, `DeckDoctrineV2Diagnostic`, `RunnerStrategicIntentProfile`, Doctrine-Goal-Synthese und TacticalGoals suchen.
- Produktive Runtime-Verkabelung, Tests und unverzichtbare Fallbacks dokumentieren.
- Bestehenden AI-Teststand prüfen.

Done-Gate:

- Review-Artefakt mit Pfadklassifikation und Legacy-Kandidaten liegt vor.
- `@netgrid/ai`-Tests, Typecheck und `git diff --check` sind grün oder Blocker ist dokumentiert.

Commit: `docs(ai): audit deck strategy runtime consumers`

### DSR-01 Einheitlichen strategischen Laufzeitvertrag festlegen

Ziel: Gemeinsamer side-sicherer Vertrag für `StrategicIntentState` mit Phasen, Rollenstatus, Evidence, Blockern, Switch-/Pause-Gründen und begrenzter Commitment-Information.

Arbeit:

- Typen und Hilfsfunktionen in fokussierten AI-Modulen anlegen.
- Runner- und Corp-Nutzung ohne fachliche Vermischung vorbereiten.
- Neutrale, partielle und vollständige Strategien testen.

Done-Gate:

- Vertrag ist kommentiert, side-sicher und ohne Action-Erzeugung.
- Zuständigkeiten zu Doctrine, Capabilities, Goals, Plans und Runtime sind im Source klar.

Commit: `feat(ai): define strategic intent runtime contract`

### DSR-02 DeckStrategyProfile und Doctrine fachlich härten

Ziel: Nur belegte Strategieanker erzeugen produktive Linien; Support-only-Signale werden nicht zu Strategien.

Arbeit:

- `strategy-goals-v1.json`, AI-Hints, Tactic Signals und CardImplementations gegen vorhandene Taxonomie prüfen.
- Confidence, Completeness, Support-Lücken, Rollen und PlayerView-Rollenstatus härten.
- Golden-Deck- und ankerlose Fixtures ergänzen.

Done-Gate:

- Keine Strategie entsteht allein aus generischem Support.
- Alle produktiven Strategy IDs sind angebunden oder begründet nicht produktiv.

Commit: `feat(ai): harden deck strategy profile taxonomy`

### DSR-03 Runner- und Corp-StrategicIntent produktiv machen

Ziel: Runner und Corp erhalten konkrete produktive Intent-Projektionen aus Deckprofil, Capabilities und Boardstate.

Arbeit:

- Bestehenden Runner-Intent bewahren und präzisieren.
- Corp-Gegenstück ergänzen.
- Rejected Intents und neutrale Decks explizit halten.

Done-Gate:

- Mindestens zwei konkurrierende Strategien pro Seite und neutrale Decks sind getestet.
- Bestehende Runner-Setup-, Economy-, Coverage- und Run-Logik bleibt erhalten.

Umsetzung:

- `StrategicIntentState` wird beim AI-Input-Aufbau aus DeckStrategyProfile, DeckCapabilities und PlayerView-Credits für beide Seiten erzeugt.
- Runner-Projektion bleibt erhalten und nutzt das einmal aufgebaute StrategyProfile weiter.
- Corp-Projektion bildet Scoreline, Defense, Economy, Punish, Risiken und Rejected Intents side-sicher aus StrategyProfile, Capabilities und StrategicIntentState ab.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/corp-strategic-intent.test.ts src/strategic-intent-state.test.ts --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "projects side-safe deck strategy runtime fields" --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`

Commit: `feat(ai): project strategic intent for both sides`

### DSR-04 Doctrine-, Boardstate-, Neutral- und Threat-Ziele zusammenführen

Ziel: Eine geordnete TacticalGoal-Menge aus reaktiven, Boardstate-, StrategicIntent-, Capability-, Neutral-, Economy-, RunTarget- und Memory-Zielen erzeugen.

Arbeit:

- Produktiven Nachfolger in `SemanticDecisionFrame` und Runtime verkabeln.
- Semantische Deduplizierung mit Evidence-Erhalt ergänzen.
- Prioritätsordnung gegen akute Gefahren sichern.

Done-Gate:

- Doctrine-Ziele und bestehende TacticalGoals werden gleichzeitig berücksichtigt.
- Debug zeigt Quelle, Priorität, Blocker und Evidence.

Umsetzung:

- `buildAiDecisionInput` trägt bei Decksnapshot-Inputs zusätzlich eine side-sichere `DeckDoctrineV2Diagnostic` als interne Runtime-Metadaten.
- `decision/tactical-goal-merge.ts` führt bestehende Runner-TacticalGoals, StrategicIntentState-Ziele, CorpStrategicIntent-Ziele, Neutral-Ziele, Corp-Boardstate-Ziele und Doctrine-v2-Ziele dedupliziert zusammen.
- `chooseSemanticRuntimeAction` baut einen `SemanticDecisionFrame` für die Zielzusammenführung und übergibt die gemergte Zielmenge an `evaluateTacticalPlans`.
- `TacticalPlanRuntimeResult` und `semanticRuntimeDebugTacticalPlanItems` zeigen StrategicIntentState-, CorpIntent- und gemergte TacticalGoal-Facts redaction-safe an.
- Lokale Play-Strength-Pilot-Scope-Frames bleiben beim bisherigen Runner-Zielkontext, damit DSR-04 keine Pilot-Auswahlregeln verschiebt.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts src/decision/tactical-goal-merge.test.ts src/decision/neutral-goal-synthesis.test.ts src/decision/doctrine-goal-synthesis.test.ts src/diagnostics/semantic-runtime-debug.test.ts --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "projects side-safe deck strategy runtime fields" --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`

Commit: `feat(ai): merge strategic and tactical goals`

### DSR-05 Persistenten StrategicIntentState und Phasenfortschritt einführen

Ziel: Strategischen Zustand deterministisch über Entscheidungen und Züge fortschreiben.

Arbeit:

- Memory-Integration oder klar abgegrenzte AI-interne Komponente schaffen.
- Phasenübergänge, Switch-/Pause-/Abort-Gründe und Hysterese implementieren.
- Game-/Deck-/Side-Isolation testen.

Done-Gate:

- Strategie wird replayfähig fortgeschrieben, pausiert, gewechselt und aufgegeben.
- Keine Memory-Leaks zwischen Spielen, Seiten oder Decks.

Umsetzung:

- `strategic-intent-memory.ts` speichert `StrategicIntentState` AI-intern nach Match-/DecisionScope, Seite, Profil und Decksnapshot-ID.
- `buildAiDecisionInput` liest vorhandene StrategicIntent-Memory und reicht sie als `previousState` an `buildStrategicIntentState` weiter.
- `chooseSemanticRuntimeAction` persistiert StrategicIntent-Memory zusammen mit dem bestehenden Memory-Flag; bei `persistTacticalPlanMemory: false` bleibt der Zustand Preview-only.
- `resetTacticalPlanMemory` leert auch StrategicIntent-Memory, damit bestehende Test- und Replay-Resetpfade vollständig bleiben.
- Memory-Snapshots enthalten nur side-sichere strategische Facts, Phasen, Transition, Commitment, Blocker-IDs und den gespeicherten State.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/tactical-plans.test.ts src/strategic-intent-memory.test.ts --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "projects side-safe deck strategy runtime fields" --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`

Commit: `feat(ai): persist strategic intent state`

### DSR-06 StrategicIntent in TacticalPlans übersetzen

Ziel: Wenige wiederverwendbare strategische Planfamilien über bestehende TacticalPlans ausdrücken.

Arbeit:

- Setup/Coverage, Economy/Reserve, Pressure, Remote, Scoreline, Defense, Punish, Damage und Recovery als Planfamilien prüfen oder ergänzen.
- Planfortsetzungsbonus an Confidence, Fortschritt, Erfüllbarkeit und Gelegenheit binden.
- Mapping bleibt LegalActions-only.

Done-Gate:

- Produktive Strategien besitzen sinnvolle Pfade von Setup/Enable zu Pressure/Convert/Closeout oder neutrale Behandlung.
- Fehlende Fähigkeiten erzeugen Blocker oder Vorbereitung, keine falschen Action-Matches.

Umsetzung:

- Gemergte `TacticalGoalLike`-Ziele aus StrategicIntent und Boardstate geben vorhandenen Runner-Remote- und Runner-Central-Plänen einen begrenzten Prioritätsbonus mit Evidence und ScoreBreakdown.
- Corp-Scoreline-, Advance-, Rez-Defense- und Economy-Pläne berücksichtigen passende strategische Ziel-Familien, bleiben aber weiter auf vorhandene `LegalActions` gemappt.
- Eine neue Corp-Planfamilie `corp.apply_punish_pressure` bildet Tag-/Trace-/Damage-/Punish-Intent auf vorhandene Operationen oder Kartenfähigkeiten ab.
- Punish-Pläne werden nur aus side-safe ActionSemanticCandidates mit semantischen Taktik- oder Kartensignalen erzeugt; neue Actions werden nicht konstruiert.

Verifikation:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts --maxWorkers=1`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`

Commit: `feat(ai): translate strategic intent into tactical plans`

### DSR-07 Begrenzte strategische Übersteuerung der Einzelaktionswertung

Ziel: Strategie darf lokale Gleichstände und mittelfristige Vorbereitung steuern, aber keine HardGates oder terminale Chancen verdrängen.

Arbeit:

- StrategicIntent an Override-/Score-Gap-Mechanismus anbinden.
- Evidence für erlaubte und verweigerte Plan-Overrides in DecisionTrace aufnehmen.
- Bestehende Comparator-/Overlay-Fixes konfliktfrei einordnen.

Done-Gate:

- Tests für erlaubte und verweigerte Plan-Overrides bestehen.
- Debug erklärt Overrule oder Nicht-Overrule.

Commit: `feat(ai): bound strategic action overrides`

### DSR-08 Vertikale Spielstärke-Slices implementieren und kalibrieren

Ziel: Fünf repräsentative Decklinien end-to-end nachweislich verbessern.

Slices:

- Runner Central Pressure.
- Corp Tag/Trace/Punish und Damage/Kill.
- Corp Remote-Scoring, Rush und Fast Advance.
- ICE-Tax/Glacier, Central Stabilize und Asset-Economy.
- Runner Remote-Contest, Remote-Trash, Setup/Search und Run-Tempo.

Done-Gate je Slice:

- Golden-Deck-/Fixture-Erkennung korrekt.
- Same-State-Entscheidungen mit erwarteter Phase und Action.
- Planfortschritt über mindestens zwei Entscheidungen oder Züge geprüft.
- Gegenbeispiel mit Boardstate-Override vorhanden.
- Keine Regression in bestehenden Replay-Fixes.

Commit: `test(ai): calibrate strategic vertical slices`

### DSR-09 Diagnose und Kommentare ausrichten

Ziel: Source-Kommentare und DecisionTrace erklären produktive Strategie, Phase, Ziele, Plan, Override und Wechsel redaction-safe.

Arbeit:

- Kommentare in neuen oder wesentlich geänderten Fachdateien prüfen.
- Veraltete Statusfelder, `plannerEffect: none`-Missweisungen und irreführende Diagnose bereinigen.
- Public Debug auf Redaction-Grenzen prüfen.

Done-Gate:

- Runtime-Wirkung und Debug stimmen überein.
- Keine produktiv genutzte Struktur wird als diagnostics-only beschrieben.

Commit: `docs(ai): align strategic diagnostics and comments`

### DSR-10 Legacy-Abhängigkeiten abbauen

Ziel: Doppelwahrheiten und überholte feste Doctrine-PlanWeights entfernen, ohne notwendige Mulligan-/Opening-Hand-Funktion zu verlieren.

Arbeit:

- `CORP_DOCTRINE_PLAN_WEIGHTS`, `RUNNER_DOCTRINE_PLAN_WEIGHTS`, `planWeightsFor`, alte Archetype-Inferenz, alte `index.ts`-Consumer und doppelte Intent-/Goal-Projektionen auditieren.
- Nicht mehr benötigte Exporte, Imports, Flags und Tests bereinigen.
- Gebrauchte Legacy-Funktionen klar abgrenzen.

Done-Gate:

- Neue produktive Strategielogik hängt nicht mehr an festen alten PlanWeights.
- Verbleibendes Legacy ist begründet.

Commit: `refactor(ai): remove obsolete doctrine legacy paths`

### DSR-11 Gesamtvalidierung und Integration

Ziel: End-to-end beweisen, dass Strategie produktiv wirkt, Spielstärke verbessert und bestehende Mechanismen intakt bleiben.

Arbeit:

- Fokussierte Tests, vollständiger `@netgrid/ai`-Testlauf, Typecheck und `git diff --check`.
- Source-Review auf tote Pfade, Doppelzuständigkeiten, falsche Kommentare und ungenutzte Flags.
- Review-/Wissensartefakte aktualisieren.
- Arbeitsbranch lokal nach `main` integrieren und Worktree entfernen.

Done-Gate:

- Definition of Done aus der Vorgabe ist erfüllt.
- `main` ist nach Merge geprüft.

Commit: `docs(ai): finalize deck strategy runtime review`

## Verifikationsregeln

Mindestchecks nach jedem Paket:

```text
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Fokussierte Tests dürfen vor dem vollständigen Paketgate laufen. Der volle Paketabschluss erfordert die Mindestchecks oder einen dokumentierten Blocker.

## Worktree-, Git- und Integrationsregeln

- Nur im Worktree `C:\Projekte\NETGRID_deck_strategy_runtime` arbeiten.
- Pro Paket genau ein kohärenter Commit, sofern das Paket nicht als Blocker endet.
- Nur paketzugehörige Änderungen stagen.
- Kein Push und kein Pull Request ohne Nutzerwunsch.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Finaler Merge bevorzugt Fast-Forward nach `main`.
- Nach erfolgreichem Merge `git status --short` und `git diff --check` auf `main`.

## Controller-Prompt-Kern

```text
/Goal Arbeite Deck Strategy Runtime vollständig und sequenziell von DSR-00 bis DSR-11 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md soweit vorhanden, die Pflichtseiten der KI-Wissen-NETGRID-Wissensbasis, agents/release-implementation-agent.md, die Vorgabe C:\Users\Lui\Downloads\NETGRID_Codex_Goal_Deckstrategie_Runtime_Stufenplan.md und docs/architecture/ai/deck-strategy-runtime-process-2026-06-25.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_deck_strategy_runtime auf Branch codex/deck-strategy-runtime.
Nutze den Hauptworkspace nur für finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete `DSR-00` bis `DSR-11` sind abgeschlossen und committed.
- Runner und Corp nutzen eine produktive, persistente, phasenbasierte Deckstrategie.
- NeutralDoctrine, HardGates, LegalActions-only, Hidden-Info-Schutz und vorhandene Replay-Fixes bleiben erhalten.
- Legacy-Doppelsteuerung ist entfernt oder begründet abgegrenzt.
- Tests, Typecheck, Diff-Check und finaler Source-Review sind grün.
- Arbeitsbranch ist lokal nach `main` gemerged.
