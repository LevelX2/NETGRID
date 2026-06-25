# Deck Strategy Runtime Hardening Audit 2026-06-25

Status: `DSR-H00_done`

Arbeitsbranch: `codex/deck-strategy-runtime-hardening`

Worktree: `C:\Projekte\NETGRID_deck_strategy_runtime_hardening`

Ausgangsstand: `main` bei `d3cde218 refactor(ai): move source advancement payout helper`

## Zweck

Dieser Audit fixiert die reproduzierbare Baseline für den Hardening-Lauf `DSR-H00` bis `DSR-H09`. Er ersetzt keine Abschlussbewertung, sondern grenzt den Ist-Zustand, die produktiven Consumer und die bekannten Hardening-Punkte ab.

## Produktive Runtime-Kette

- `packages/ai/src/runtime/ai-decision-input.ts` baut bei vorhandenem `ownDeckSnapshot` `ownDeckCapabilities`, `AiDeckStrategyProfile`, `ownStrategicIntentState`, side-spezifische Runner-/Corp-StrategicIntent-Profile und aktuell auch `ownDeckDoctrineV2Diagnostic`.
- `AiDeckStrategyProfile.source.mode` ist `ai_internal_strategy_profile`; `source.plannerEffect` ist `strategic_intent_input`.
- `packages/ai/src/runtime/semantic-runtime.ts` liest `ownStrategicIntentState`, `ownCorpStrategicIntent` und Deck-Capabilities, baut einen `SemanticDecisionFrame`, merged `TacticalGoals`, evaluiert `TacticalPlans`, wählt eine LegalAction und persistiert Plan-/StrategicIntent-Memory.
- `packages/ai/src/decision/tactical-goal-merge.ts` produziert produktive Ziele aus expliziten Runner-Zielen, `StrategicIntentState`, `CorpStrategicIntentProfile` und neutralen Zielen.
- `packages/ai/src/runtime/strategic-action-fit.ts` bewertet Actions nur gegen vorhandene `LegalActions`, ignoriert neutrale oder hart geblockte Strategie und liefert `semantic_strategic_action_fit:*`-Evidence.
- `packages/ai/src/runtime/semantic-choice-ranking.ts` kann Plan-Mapping gegen aktuelle Scores abwägen; strategische Fit-Evidence beeinflusst Override-Schwellen.

## Report-only- und Diagnostic-Kette

- `DeckDoctrineV2Diagnostic` deklariert `scope: "diagnostic_only"`, `productiveUseAllowed: false`, `source.mode: "report_only"` und `source.plannerEffect: "none"`.
- `controlled-shadow-mode`, `semantic-shadow-*`, `target-choice-shadow` und Action-Doctrine-Diagnostic-Reports deklarieren ebenfalls no-effect oder report-only Consumer-Verträge.
- Diese Artefakte dürfen weiterhin für Audit, Review, Shadow-Berichte und Debug-Einordnung existieren, solange sie keine produktive Action-Auswahl treiben.

## Gefundene Hardening-Punkte

- H01: `ownDeckDoctrineV2Diagnostic` wird trotz `productiveUseAllowed: false` in `semantic-runtime.ts` als `doctrineDiagnostic` in `buildSemanticDecisionFrame` gegeben. `neutral-goal-synthesis.ts` ruft daraus `synthesizeDoctrineTacticalGoals`, und `tactical-goal-merge.ts` klassifiziert solche Ziele als `deck_doctrine_v2`. Das widerspricht dem no-effect-Vertrag und muss getrennt werden.
- H02: `buildDeckStrategyProfile` filtert produktive Primär- und Sekundärstrategien über `runtimeStatus === "productive"`. Zu prüfen bleibt, dass Capabilities ohne echte Strategy-Anker keinen produktiven Intent erzeugen.
- H03: `buildStrategicIntentState` akzeptiert `roleStatuses`, `targetVector` und `reserveRequirement`, der Defaultpfad in `buildAiDecisionInput` liefert aktuell aber nur `availableCredits`. Rollenstatus, konkrete Targets und Reservebedarf müssen aus PlayerView, Capabilities und LegalActions abgeleitet werden.
- H04: `StrategicIntentState` hat Phasen, Transitionen und Commitment-Felder, aber Wechselmarge und Mindestbindung wirken im aktuellen `transitionFor` noch nicht als echte Hysterese gegen Strategie-Flattern.
- H05: Plan-Mapping nutzt statische Score-Gaps (`600`, `360`, `900`) und feste Continuity-Priorität (`120`). Die Balance zwischen Planbindung, strategischem Fit und harten aktuellen Board-Scores muss präzisiert werden.
- H06: DecisionDebug enthält `planMatchDisplayBoost` und `finalSelectionScore` als display-only Planerklärung. Der produktive Rohscore, display-only Score und die echte Auswahlursache müssen sichtbarer getrennt werden.
- H07: Es gibt viele Modul- und Vertical-Slice-Tests. Akzeptanzfälle müssen ausdrücklich über realitätsnahe `GameState`- und `buildAiDecisionInput`-Pfade laufen, nicht über manuell injizierte StrategyProfiles oder TargetVectors.
- H08: Nach produktiver Trennung müssen tote Doctrine-v2-Produktivpfade, doppelte Verantwortung und veraltete Statusaussagen entfernt oder klar als report-only markiert werden.

## Baseline-Checks

Vor dem ersten Check fehlten im neuen Worktree `node_modules`; `corepack pnpm install --frozen-lockfile` richtete die Abhängigkeiten ohne Lockfile-Änderung ein.

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai test`: grün, 146 Testdateien und 1628 Tests bestanden.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.

## DSR-H02-Ergebnis

Status: `done`

Die Capability-Grenze ist gehärtet: Capabilities beschreiben Werkzeuge, Coverage, Support und Pflichten, erzeugen aber ohne produktiven Strategy-Anker keine Runtime-Strategie mehr.

Umgesetzt:

- Runner-Intent gibt bei fehlendem produktivem Anker `runner.unknown`, leere `setupEngine`/`pressureVectors`, Low-Confidence und `productive_strategy_anchor:false` zurück.
- Corp-Intent gibt bei fehlendem produktivem Anker `corp.unknown`, leere Score-/Defense-/Economy-/Punish-Pläne, Low-Confidence und `corp.no_productive_anchor` zurück.
- Capability-only Tests sichern ab, dass Search-, Economy-, Remote-, Score- oder Defense-Support allein keine produktive Strategie erzeugt.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- Fokussierte Tests `runner-strategic-intent`, `corp-strategic-intent`, `strategic-intent-state`, `deck-doctrine-strategy`, `strategic-vertical-slices`, `runner-golden-deck-debug`: grün.
- `corepack pnpm --filter @netgrid/ai test`: grün, 146 Testdateien und 1631 Tests bestanden.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.

## DSR-H03-Ergebnis

Status: `done`

Der Default-Input-Pfad leitet strategische Rollen, Zielvektor und Reservebedarf jetzt aus echter Runtime-Sicht ab.

Umgesetzt:

- Neues Modul `runtime/strategic-runtime-context.ts` baut `roleStatuses`, `targetVector` und `reserveRequirement` aus `PlayerView`, `LegalActions`, produktivem StrategyProfile und Deck-Capabilities.
- Runner-Kontext erkennt Coverage-Rollen, konkrete legale Zentral-/Remote-Run-Ziele und Reservebedarf aus relevanten Action-Kosten plus Strategiefamilie.
- Corp-Kontext erkennt Score-, Defense-, Economy- und Punish-Fenster aus sichtbarem Board, legalen Actions und Capabilities.
- `buildAiDecisionInput` übergibt diesen Kontext an `buildStrategicIntentState`.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- Fokussierte Tests `runtime/strategic-runtime-context`, `index`, `strategic-intent-state`, `semantic-ai-runtime-cutover`, `strategic-vertical-slices`: grün, 609 Tests.
- `corepack pnpm --filter @netgrid/ai test`: grün, 147 Testdateien und 1633 Tests bestanden.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.

## DSR-H04-Ergebnis

Status: `done`

Die StrategicIntent-State-Machine nutzt jetzt echte Bindungslogik und macht alle Transitionen produktiv erreichbar.

Umgesetzt:

- Mindestbindung hält eine vorherige Strategie, bis `minCommitmentDecisions` erreicht ist.
- `switchMargin` verhindert Strategie-Flattern bei zu kleinem Score-Vorsprung.
- Bei ausreichend gebundener vorheriger Strategie und großem Score-Vorsprung wechselt der State mit `transition.status: "switched"`.
- Fehlt nach einer vorherigen Strategie ein produktiver Anker, wird `transition.status: "abandoned"` gesetzt.
- StrategicIntent-Memory lässt `abandoned`-States mit TTL `0` sofort auslaufen.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- Fokussierte Tests `strategic-intent-state`, `strategic-intent-memory`, `semantic-ai-runtime-cutover`, `runtime/strategic-runtime-context`: grün, 78 Tests.
- `corepack pnpm --filter @netgrid/ai test`: grün, 147 Testdateien und 1637 Tests bestanden.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.

## DSR-H00-Ergebnis

Der Ausgangszustand ist reproduzierbar, testgrün und ausreichend eingegrenzt. Es wurde kein Code geändert. DSR-H01 kann den gefundenen no-effect-Vertragsbruch zwischen `DeckDoctrineV2Diagnostic` und produktivem TacticalGoal-Merge beheben.

## DSR-H01-Ergebnis

Status: `done`

Die produktive Strategy Runtime nutzt `AiDeckStrategyProfile` und `StrategicIntentState` als produktiven Vertrag. `DeckDoctrineV2Diagnostic` bleibt für Audit, Report und optionalen Trace-Bereich verfügbar, ist aber aus produktiven Goal-, Plan-, Runtime- und Memory-Consumern entfernt.

Umgesetzt:

- `buildAiDecisionInput` gibt `ownDeckStrategyProfile` als produktive Strategiequelle aus.
- `chooseSemanticRuntimeAction` baut produktive `SemanticDecisionFrame`s ohne `doctrineDiagnostic`.
- `synthesizeNeutralTacticalGoals` mischt keine Doctrine-v2-Diagnostic-Ziele mehr ein.
- `buildMergedTacticalGoals` verwirft report-only Doctrine-Ziele defensiv auch bei expliziter Übergabe.
- `StrategicIntentMemory` nutzt keine Diagnostic-Deck-ID mehr als produktiven Memory-Key.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- Fokussierte Tests `neutral-goal-synthesis`, `tactical-goal-merge`, `semantic-shadow-decision`, `semantic-ai-runtime-cutover`, `strategic-intent-memory`, `index`: grün, 621 Tests.
- `corepack pnpm --filter @netgrid/ai test`: grün, 146 Testdateien und 1629 Tests bestanden.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.
