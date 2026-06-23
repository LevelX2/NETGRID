# AI Player Semantic Controller Final Report 2026-06-23

## Status

`complete`

Arbeitsbranch: `codex/ai-player-semantic-controller`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAYER_SEMANTIC_CONTROLLER`

## Ergebnis

Der Prozess hat den AI-Spieler im Scope `packages/ai` strukturell näher an die Zielkette gebracht:

```text
CardImplementation / Kartensemantik
-> Taktiksignale
-> Strategieanker / Rollen
-> DeckDoctrine
-> taktische Zwischenziele
-> semantisch verstandene LegalActions
-> Auswahl einer legalen Aktion
```

Die Umsetzung bleibt AI-intern und legalitätsneutral. Es wurden keine Engine-Regeln, keine LegalAction-Erzeugung, kein `applyAction`, kein Replay, kein StateHash, keine Randomness und kein Hidden-Info-Vertrag geändert.

## Strukturverbesserungen

- Legacy-Planer und Public-Fassade sind als Kompatibilitäts- und Fallback-Grenzen markiert. Neue Fachlogik soll nicht weiter in `index.ts` oder die Legacy-Planer wachsen.
- Die alte `DeckDoctrine` erzeugt für ankerlose Decks keine künstlichen Fallback-Archetypen mehr. Neutrale und unvollständige Deckprofile bleiben damit sichtbarer von echten Strategieankern getrennt.
- Corp-Zielbildung liegt in einem eigenen side-sicheren Modul und erzeugt `TacticalGoalLike`-Signale mit Evidence, Priority, Urgency und optionalem `targetServerId`.
- `ActionGoalFit` berücksichtigt TargetContext-/TargetProfile-/Constraint-Blocker härter. Strategischer Score kann solche side-sicher erkannten Zielprobleme nicht überstimmen.
- Capability-Signale tragen eine Quellenpriorität. Strukturierte Signale, Rollen/Subtypes und sichtbarer Boardstate sind vor Text-/Label-Fallbacks eingeordnet; Textfallbacks sind als Übergangsdiagnose markiert.
- `TacticalPlans` ist als Mapping-Schicht abgegrenzt. Kartensemantik soll in Action-/Card-Semantikmodulen entstehen, nicht in der Plan-Mapping-Datei.
- Ein kleiner Runtime-Score-Helper für echte Action-Type-Tiebreaks ist vorbereitet und getestet. Die produktive Runtime nutzt aber weiter die bisherige volle `semanticRuntimeTypePriority`, weil eine sofortige Reduktion mehrere Runtime-Cutover- und Benchmark-Regressionen ausgelöst hat.
- Nach dem Sync mit dem aktuellen `main` erkennt der AI-Derived-Facts-Scanner zusätzlich die neuen Engine-Descriptor-Namen `delayed_install_with_counter_countdown`, `conceal_and_reorder_installed_ice`, `gain_credits_from_stolen_agenda_advancement_history` und `end_turn_tag_if_runner_received_tag`. Das hält die AI-Gates streng, ohne Pilot-Erwartungen zu entfernen.

## Geänderte Hauptmodule

- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/legacy/runner-plans.ts`
- `packages/ai/src/legacy/corp-plans.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/deck-capabilities.ts`
- `packages/ai/src/decision/corp-tactical-goals.ts`
- `packages/ai/src/decision/neutral-goal-synthesis.ts`
- `packages/ai/src/decision/hard-gates.ts`
- `packages/ai/src/decision/semantic-decision-frame.ts`
- `packages/ai/src/runtime/semantic-runtime-score-components.ts`
- `scripts/check-ai-derived-facts.mjs`
- `docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json`
- `docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json`
- zugehörige AI-Tests unter `packages/ai/src/**`

## Praktische Spielwirkung

- Ankerlose oder support-lastige Decks erhalten weniger scheinpräzise Strategien. Die KI fällt eher auf neutrale Grundziele zurück, statt aus Supportsignalen künstliche Archetypen abzuleiten.
- Corp-Entscheidungen sind besser erklärbar: Scorefenster, Advance-/Score-Closeout, Rez-Bedarf, Remote-Aufbau, Zentralserver-Schutz, Economy-Stabilisierung, sichtbare Tag-Punish- und Damage-/Ambush-Linien werden als Ziele mit Evidence modelliert.
- Side-sicher bekannte Target-Probleme können Kandidaten blockieren, bevor sie durch generische Score-Gewichte wieder hochgerankt werden.
- Debug-/Report-Evidence macht sichtbarer, ob eine Fähigkeit aus strukturierten Daten, Rollen/Subtypes, sichtbarem Boardstate oder nur Textfallback stammt.
- Die Runtime-Stabilität bleibt erhalten, weil die zu breite Umgewichtung der Action-Type-Priorität nach roten Tests zurückgenommen wurde.

## Bewusst erhaltene Legacy-Bereiche

- `packages/ai/src/index.ts` bleibt groß und enthält weiterhin zentrale Runtime-Fassade und Score-Breakdown-Integration.
- Die Legacy-Planer bleiben lauffähige Fallbacks und Regressionsträger.
- `semanticRuntimeTypePriority` bleibt im produktiven Score-Breakdown aktiv; die Reduktion auf einen echten Tie-Breaker braucht ein eigenes Kalibrierungspaket.
- `tactical-plans.ts` ist weiter eine große Mapping-Datei. Dieser Prozess hat die Grenze dokumentiert und einzelne Helfer vorbereitet, aber keinen breiten Split durchgeführt.
- Text-/Label-Fallbacks in Capability-Erkennung bleiben aktiv, sind aber als nachrangige Übergangsquelle markiert.

## Restprobleme und Folgeaufträge

- Eigenes Paket für `semanticRuntimeTypePriority`: Kalibrierung, Snapshot-Anpassung und schrittweise Reduktion auf echten Tie-Breaker ohne Runtime-Cutover-Regression.
- Weitere `index.ts`-Extraktion entlang stabiler Score-, Debug- und Runtime-Fassaden.
- `tactical-plans.ts` in kleinere Consumer-Gruppen zerlegen, sobald die Ziel-/Mapping-Grenzen genügend Tests tragen.
- TargetProfile-/TargetConstraint-Abdeckung ausbauen, besonders für komplexere Server-, Run- und Ability-Ziele.
- Corp-TacticalGoals stärker in Diagnoseberichte und spätere DeckDoctrineV2-Signale einbinden.
- Textfallbacks weiter durch strukturierte CardSemanticProfile-, ActionSemanticCandidate- und Hint-Ontology-Daten ersetzen.

## Verifikation

Ausgeführt im Arbeits-Worktree:

```text
corepack pnpm --filter @netgrid/ai test
134 Test Files passed
1541 tests passed

corepack pnpm --filter @netgrid/ai typecheck
passed

git diff --check
passed

corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/semantic-ai-runtime-cutover.test.ts
2 Test Files passed
572 tests passed

corepack pnpm --filter @netgrid/ai exec vitest run src/derived-basic-facts-gate.test.ts src/compiled-index-gate.test.ts
2 Test Files passed
17 tests passed
```

Nach dem Sync mit `main` wurde der vollständige `@netgrid/ai`-Testlauf erneut ausgeführt und blieb grün: 134 Test Files, 1541 Tests. Zusätzlich wurden pro Paket fokussierte Vitest-Läufe für Boundary-, Doctrine-, Corp-TacticalGoal-, ActionGoalFit-, Capability-, Runtime-Score-, Shadow-, Derived-Facts-, Compiled-Index- und Cutover-Pfade ausgeführt.

## Vertragsprüfung

- Keine Änderung an Engine-Regelautorität.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, AI-Inputs, Debug, Reports, Logs oder Reconnect-Payloads.
- Final ausgewählte AI-Actions bleiben an vorhandene LegalActions gebunden.
