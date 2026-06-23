# AI Player Semantic Controller Process 2026-06-23

## Status

`complete`

Arbeitsbranch: `codex/ai-player-semantic-controller`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAYER_SEMANTIC_CONTROLLER`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Vorgabe vom 2026-06-23: Der KI-Spieler-Code soll pragmatisch weiter in Richtung semantischer Zielarchitektur gebracht werden:

```text
CardImplementation / Kartensemantik
-> Taktiksignale
-> Strategieanker / Rollen
-> DeckDoctrine
-> taktische Zwischenziele
-> semantisch verstandene LegalActions
-> Auswahl einer legalen Aktion
```

Der Scope liegt auf `packages/ai` und nur unmittelbar notwendigen Semantik-/Shared-Schnittstellen. Die Engine bleibt Regelautorität; die KI erzeugt keine LegalActions.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: strukturell bessere semantische KI, weniger Legacy-Vermischung und klarere Aktionsauswahl.
- Reihenfolge: erst Baseline und Grenzen, dann Doctrine/Goals, danach Action-/Target-/Scoring-Härtung, anschließend Fallback-/Plan-/Debug-Schnitt und Final-Green.
- Scope: primär `packages/ai/src/**`, AI-Tests und AI-Dokumentation.
- Nicht-Ziele: keine breite Engine-/CardImplementation-Refaktorierung, keine neue Legalität, keine neuen kartennamenspezifischen Produktiv-Sonderregeln, keine Enterprise-/Canary-/Rollback-Rhetorik.
- Abnahme: pro Paket fokussierte Vitest-Läufe, Typecheck und `git diff --check`; am Ende vollständiger `@netgrid/ai`-Testlauf.
- Branch-/Worktree-Erwartung: eigener `codex/`-Branch, final lokal nach `main`.

Konservative Annahme: Wo ein vollständiger Umbau zu groß oder zu riskant wäre, wird ein tragfähiger kleiner Schnitt mit Tests umgesetzt und der Rest konkret im Final-Report benannt.

## Gesamtziel

Der Prozess verbessert den AI-Spieler als semantischen Controller:

- Legacy-Pfade sind klar eingefrorene Fallbacks und nicht Zielmodell.
- `index.ts` bleibt Public-Fassade und gewinnt keine neue Fachlogik.
- alte Doctrine erzeugt in neuen semantischen Pfaden keine künstlichen Strategien aus Supportsignalen.
- Corp-Ziele werden sichtbarer, side-safe und mit Evidence gebildet.
- ActionSemanticCandidate, TargetContext, HardGates, Kosten, Timing, Reachability und DecisionDebug werden Runtime-relevant, aber legalitätsneutral behandelt.
- Text-/Regex-/Label-Fallbacks bleiben erkennbare Übergangsdiagnose statt Fundament.
- TacticalPlans mappen Ziele auf vorhandene LegalActions und erfinden keine Kartensemantik.

## Annahmen

- Der Ausgangsstand auf `main` ist sauber.
- Bestehende öffentliche Exporte bleiben kompatibel.
- Änderungen an `packages/shared` oder Engine-Typen sind nur erlaubt, wenn `packages/ai` ohne sie keinen sauberen Vertrag ausdrücken kann; Default ist keine Änderung außerhalb `packages/ai`.
- Tests dürfen ergänzt oder verschoben werden, aber nicht gelockert, um echte Regressionen zu verdecken.
- Bestehende lokale Pilot-Flags bleiben unverändert; neue lokale Pilot-Rhetorik wird vermieden.

## Nicht-Ziele

- Keine Änderung an LegalAction-Erzeugung oder `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness.
- Keine neue Hidden-Info-Fläche in PlayerViews, PublicEvents, AI-Inputs, Debug, Reports, Logs oder Reconnect-Payloads.
- Keine breite CardImplementation-Neuschreibung.
- Keine neue dauerhafte Parallelwahrheit aus Legacy Doctrine und neuer Semantik.
- Keine reinen Datei-Verschiebungen ohne fachliche Verantwortungsgrenze.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein Blocker dokumentiert ist.
- Jede finale AI-Action stammt aus `input.legalActions`.
- Hard Gates gehen vor strategischem Scoring.
- Target-Auswahl nutzt nur engine-provided und side-safe sichtbare Zieloptionen.
- Strategieanker sind keine Befehle; Supportsignale erzeugen keine Strategie.
- Taktikziele sind keine Aktionen.
- Legacy bleibt lauffähig, wächst aber nicht als Zielarchitektur.

## Automatische Fehlerbehandlung

- Rote Tests werden zuerst auf Paketbezug geprüft und eng behoben.
- Ausgangsrote oder fremde Fehler werden reproduzierbar dokumentiert, aber nicht stillschweigend wegdefiniert.
- Wenn eine Verbesserung nur über Hidden Info, Engine-Vertragsänderung oder neue LegalAction-Erzeugung möglich wäre, stoppt der Prozess mit Blocker-Report.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide fachlichen Intentionen bleiben erhalten, wenn kompatibel.
- Kein `git reset --hard`, kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht auf eine aktuelle LegalAction zurückgeführt werden kann;
- eine Änderung Hidden Info für Scoring, Target-Auswahl oder Debug braucht;
- Engine, `applyAction`, Replay, StateHash oder Randomness geändert werden müssten;
- Legacy-Notaus oder No-Candidate-Fallback nicht erhalten werden kann;
- TargetProfile-Logik Legalität erzeugen müsste;
- Debug-/WhyNot-/Evidence-Ausgaben verdeckte Gegnerinformationen leaken würden.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> semctrl_0_preflight
  -> semctrl_1_legacy_and_public_boundaries
  -> semctrl_2_doctrine_anchor_neutrality
  -> semctrl_3_corp_tactical_goals
  -> semctrl_4_action_target_gate_scoring
  -> semctrl_5_capability_fallback_isolation
  -> semctrl_6_tactical_plan_debug_boundaries
  -> semctrl_7_final_report
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define semantic controller process` |
| `SEMCTRL-0` | Preflight und Inventar | AI-Typecheck/Teststatus, Strukturinventar und Ausgangsrisiken dokumentiert | `docs(ai): record semantic controller preflight` |
| `SEMCTRL-1` | Legacy- und Public-Grenzen | Legacy-Planer, Re-Exports und Public-Fassade haben klare Leitplanken; keine Verhaltenänderung | `refactor(ai): mark legacy and public AI boundaries` |
| `SEMCTRL-2` | Doctrine-Ankerneutralität | neue semantische Pfade behandeln ankerlose Decks neutral; alte Doctrine ist Legacy/Fallback markiert | `refactor(ai): keep anchorless doctrine neutral` |
| `SEMCTRL-3` | Corp TacticalGoals | Corp-Zielbildung ist eigenständig, side-safe, evidence-basiert und getestet | `feat(ai): strengthen corp tactical goal synthesis` |
| `SEMCTRL-4` | Action-/Target-/Gate-Scoring | HardGates, TargetContext, Kosten/Timing/Reachability und WhyNot wirken sichtbar im Ranking | `feat(ai): apply gates and target context in semantic scoring` |
| `SEMCTRL-5` | Capability-Fallback-Isolation | Text-/Regex-/Label-Fallbacks sind als letzte Diagnose gekapselt und strukturierten Quellen nachgeordnet | `refactor(ai): isolate capability fallback signals` |
| `SEMCTRL-6` | TacticalPlans und Debug-Grenzen | TacticalPlans-Grenze, DecisionDebug und Score-Komponenten sind klarer und redaction-safe | `refactor(ai): clarify tactical plan and debug boundaries` |
| `SEMCTRL-7` | Abschlussbericht | Ergebnis, Spielwirkung, bewusste Legacy-Reste, Restprobleme und Checks dokumentiert | `docs(ai): record semantic controller final report` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf | vollständiger `@netgrid/ai` Test, Typecheck, fokussierte Runtime-Tests und Diffcheck grün | optionaler Fix-/Docs-Commit |

## Paketdetails

### SEMCTRL-0: Preflight und Inventar

Ziel: Baseline und aktuelle Struktur sichtbar machen.

Kernartefakte:

- `docs/reviews/ai/ai-player-semantic-controller-preflight-2026-06-23.md`

Checks:

```bash
git status --short
git rev-parse HEAD
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Inventar:

```bash
wc -l packages/ai/src/index.ts packages/ai/src/tactical-plans.ts packages/ai/src/legacy/runner-plans.ts packages/ai/src/legacy/corp-plans.ts packages/ai/src/deck-doctrine.ts packages/ai/src/deck-capabilities.ts
rg "semanticRuntimeTypePriority|fallback|Legacy|TargetProfile|targetProfileMatches|hardGate|WhyNot|whyNot|regex|RegExp|label" packages/ai/src
```

### SEMCTRL-1: Legacy- und Public-Grenzen

Ziel: Neue Arbeit wird sichtbar weg von Legacy und `index.ts` gelenkt.

Betroffene Dateien:

- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/legacy/runner-plans.ts`
- `packages/ai/src/legacy/corp-plans.ts`
- vorhandene Boundary-/Public-Export-Tests

Done-Gate:

- Legacy-Dateien sind Fallback-/Regression-Pfade und nicht Zielarchitektur.
- Re-Exports sind als Legacy-Kompatibilität markiert.
- `index.ts` erhält keine neue Fachlogik und verweist auf passende Module.
- Tests belegen Import-/Public-Export-Vertrag.

### SEMCTRL-2: Doctrine-Ankerneutralität

Ziel: Ankerlose Decks bleiben neutral; Supportsignale erzeugen keine Strategie.

Betroffene Dateien:

- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/decision/doctrine-goal-synthesis.ts`
- `packages/ai/src/decision/neutral-goal-synthesis.ts`
- zugehörige Tests

Done-Gate:

- alte Doctrine ist klar Legacy/Fallback.
- DeckDoctrineV2/StrategyProfile unterscheiden anchorless, partial und complete.
- Tests zeigen: ankerlose Decks bekommen neutrale Grundprioritäten statt erfundener Archetypen.

### SEMCTRL-3: Corp TacticalGoals

Ziel: Corp-Zielbildung wird ähnlich nachvollziehbar wie Runner-Ziele.

Betroffene Dateien:

- `packages/ai/src/decision/corp-tempo-goals.ts`
- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/decision/tactical-goal-utility.ts`
- `packages/ai/src/decision/doctrine-goal-synthesis.ts`
- zugehörige Tests

Zielgruppen:

- Economy stabilisieren.
- HQ/R&D schützen.
- Remote vorbereiten.
- Scorefenster nutzen.
- Advance/Score-Closeout erkennen.
- ICE rezzen oder Rez-Reserve sichern.
- Tag/Punish, Damage/Kill und Bait/Ambush nur mit sichtbarer Grundlage.

Done-Gate:

- Corp-Ziele tragen Evidence, Priority, Urgency/Reason und ggf. TargetServer.
- Keine Hidden-Info-Nutzung.
- Keine Strategie aus bloßen Supportsignalen.

### SEMCTRL-4: Action-/Target-/Gate-Scoring

Ziel: LegalActions werden besser verstanden, bevor sie bewertet werden.

Betroffene Dateien:

- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-source-binding.ts`
- `packages/ai/src/actions/action-target-context.ts`
- `packages/ai/src/actions/action-cost-timing.ts`
- `packages/ai/src/decision/action-goal-fit.ts`
- `packages/ai/src/decision/hard-gates.ts`
- `packages/ai/src/decision/semantic-shadow-decision.ts`
- `packages/ai/src/decision/target-choice-shadow.ts`
- zugehörige Tests

Done-Gate:

- Projektionen sind korrekt als legalitätsneutral, aber Runtime-relevant kommentiert.
- HardGate-/Target-/Cost-/Timing-/Reachability-Issues können strategischen Score nicht überstimmen.
- konkrete TargetProfile-/TargetContext-Wirkung ist in Tests und Debug sichtbar.
- Action-Type-Priority ist nur Fallback/Tie-Breaker.

### SEMCTRL-5: Capability-Fallback-Isolation

Ziel: strukturierte Quellen haben Vorrang; TextFallback ist erkennbare Übergangsdiagnose.

Betroffene Dateien:

- `packages/ai/src/deck-capabilities.ts`
- `packages/ai/src/hint-ontology.ts`
- `packages/ai/src/hint-ontology-doctrine.ts`
- `packages/ai/src/deck-capabilities.test.ts`
- relevante Doctrine-/Capability-Tests

Done-Gate:

- Fallbacks sind gekapselt und mit Evidence markiert.
- Priorität ist: ActionSemanticCandidate, CardSemanticProfile/compiled data, Ontology-/Hint-Consumer, sichtbarer Boardstate, Text-/Label-Fallback.
- Keine neuen labelbasierten Produktiv-Sonderfälle.

### SEMCTRL-6: TacticalPlans und Debug-Grenzen

Ziel: TacticalPlans und Debug führen neue Arbeit in kleinere Consumer-Gruppen.

Betroffene Dateien:

- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/plans/tactical-plan-types.ts`
- `packages/ai/src/plans/plan-memory.ts`
- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/runtime/semantic-runtime-score-components.ts`
- zugehörige Tests

Done-Gate:

- Kommentare grenzen Planbau, Planprogression, Mapping, Memory und Debug ab.
- TacticalPlans erfinden keine Kartensemantik.
- DecisionDebug/WhyNot zeigt Top Goals, Candidate Source/Ability/Target/Cost/Timing, HardGate-Ergebnis, Score-Komponenten und redaction-safe Evidence kompakt.

### SEMCTRL-7: Abschlussbericht

Kernartefakt:

- `docs/reviews/ai/ai-player-semantic-controller-final-report-2026-06-23.md`

Inhalt:

- strukturelle Verbesserungen;
- wesentliche Dateien/Module;
- erwartete praktische Spielverbesserungen;
- bewusst erhaltene Legacy-Bereiche;
- Restprobleme;
- ausgeführte Tests/Typechecks;
- sinnvolle Folgeaufträge.

## Verifikationsregeln

- Nach jedem Paket mindestens fokussierte Vitest-Dateien, `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check`.
- Vor `FINAL-GREEN` vollständiger `corepack pnpm --filter @netgrid/ai test`.
- Bei Änderungen außerhalb `packages/ai` müssen betroffene Paketchecks ergänzt werden.
- Keine Testlockerung ohne dokumentierten fachlichen Grund.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree `C:\Projekte\NETGRID_AI_PLAYER_SEMANTIC_CONTROLLER`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für den finalen lokalen Merge nach `main`.
- Branch: `codex/ai-player-semantic-controller`.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den AI Player Semantic Controller Process vollständig und sequenziell von SEMCTRL-0 bis SEMCTRL-7 plus FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und docs/architecture/ai/ai-player-semantic-controller-process-2026-06-23.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAYER_SEMANTIC_CONTROLLER auf Branch codex/ai-player-semantic-controller.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- SEMCTRL-0 bis SEMCTRL-7 und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-player-semantic-controller`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- vollständiger `@netgrid/ai` Testlauf, Typecheck und `git diff --check` sind grün oder ein konkreter Ausgangs-/Fremdblocker ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
