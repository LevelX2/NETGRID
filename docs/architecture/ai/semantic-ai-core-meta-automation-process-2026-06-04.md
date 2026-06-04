# Semantic AI Core META 1 bis META 6 Automationsprozess

Stand: 2026-06-04
Status: Prozessdefinition für direkte sequenzielle Umsetzung
Primärer Agent: `release-implementation-agent`
Arbeitsbranch: `codex/meta1-meta6-semantic-ai-core`
Arbeits-Worktree: `C:\Projekte\NETGRID_META1_META6_SEMANTIC_AI_CORE`

## Quelle/Vorgabe

Nutzervorgabe vom 2026-06-04: Die nächsten sechs KI-Meta-Schritte sollen nicht als reine Cutover-Roadmap, sondern als eigentlicher KI-Kern umgesetzt werden:

```text
Deckanalyse
-> DeckStrategicProfile
-> DeckDoctrine / Strategiehypothese
-> mehrzügige TacticalGoalState-Verfolgung
-> semantische Bewertung von LegalActions
-> erklärbare Action-Auswahl
-> später kontrollierter Cutover
```

Führende Eingangsnachweise:

- `docs/reviews/ai/ai044-046-diagnostic-doctrine-goal-final-report-2026-06-04.md`
- `docs/reviews/ai/ai047-050-shadow-scoring-final-report-2026-06-04.md`
- `docs/reviews/ai/ai051-060-controlled-shadow-mode-final-report-2026-06-04.md`
- `docs/reviews/ai/ai061-sr-ai067-shadow-readiness-expansion-final-report-2026-06-04.md`
- `docs/reviews/ai/ai068-sr-runtime-backed-shadow-fixture-coverage-expansion-2026-06-04.md`

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

Bestimmbar sind:

- Gesamtziel: semantischen KI-Kern mit Doctrine, mehrzügigen Goals, Decision Core, Safety Envelope, Canary, testinternem Override Pilot und Stabilisierung vorbereiten.
- Sequenz: META 1 bis META 6 in dieser Reihenfolge.
- In-Scope: AI-Code-Schemas/Builder, diagnostische Fixture-/Report-Artefakte, Check-Skripte, fokussierte Tests, Wissens- und Statusrückführung.
- Nicht-Ziele: Full Replacement, produktive Flags, produktive Override-Ausführung, neue Engine-Legalität, Hidden-Info-Projektion, Public Payload Changes, Planner-Gewichte.
- Artefakte: je META Markdown-Review, JSON-Report und Check-Skript; gemeinsamer AI-Modulcode und Tests.
- Verifikation: step-spezifische Check-Skripte, AI-Test, AI-Typecheck, `git diff --check`.
- Worktree-/Git-Erwartung: separater Worktree, Branch `codex/meta1-meta6-semantic-ai-core`, Commit je abgeschlossenem Paket, finaler lokaler Merge nach `main`.

Konservative Annahme:

- Die Umsetzung bleibt zunächst report-/diagnostic-first. Dort, wo die Vorgabe "Action-Auswahl" beschreibt, wird sie als semantische, erklärbare Shadow-/testinterne Entscheidung modelliert. Produktive Runtime-Ausführung bleibt ausgeschlossen, bis spätere Gates sie explizit freigeben.

## Gesamtziel

META 1 bis META 6 bauen eine kontrollierte Semantic-AI-Core-Linie nach AI068:

1. DeckStrategicProfile, DeckDoctrine und persistente TacticalGoalState-Instanzen.
2. Semantic Decision Core mit Consumer-Gruppen, getrennten Score-Komponenten und WhyNot.
3. Cutover Safety Envelope mit default-off Flags, Rollback, Scope Matrix, Adapter- und Trace-Vertrag.
4. Agreement-only Runtime Canary als vertraglicher Harness ohne Behavior Delta.
5. Scoped Semantic Override Pilot nur test/internal und eng whitelistbasiert.
6. Stabilization, Trace Scrubber, Scope Readiness Matrix und Legacy-Freeze-Vorbereitung ohne Full Replacement.

## Nicht-Ziele

- Keine produktive Action-Auswahl.
- Keine produktive Aktivierung von Shadow, Canary, Cutover oder Override.
- Keine Planner-Gewichte und keine Gewichtung in bestehendem Legacy-Planer.
- Keine neuen LegalActions und keine Ableitung von Legalität außerhalb der Engine.
- Keine Hidden-Info-Projektion aus FullState, verdeckten Karten, gegnerischer Hand, HQ/R&D, unrezzed ICE oder privaten Choice-Optionen.
- Keine PublicEvent-, PlayerView-, WebSocket-, Reconnect-, Undo-, Replay-, Client-Fehler- oder UI-Payload-Änderungen.
- Keine Änderung an Engine, Server oder Webclient, solange die META-Berichte und AI-Tests keine eng begründete Notwendigkeit zeigen.
- Keine Legacy-Entfernung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Semantic AI referenziert nur `actionId` aus Engine-`LegalActions`.
- `actualDecision` bleibt Legacy bis META 4; META 4 bestätigt nur identische Actions; META 5 bleibt test/internal-only.
- Costs, Timing, Reachability und Hard Gates schlagen Strategie.
- Boardstate darf Doctrine überstimmen.
- `NeutralDoctrine` darf keine Strategie erfinden.
- Jede semantische Entscheidung hat Doctrine-, Goal-, Candidate-, Gate-, Score-/Evidence- und WhyNot-Spur.
- Jeder verworfene Kandidat hat WhyNot oder Gate-Grund.
- Rollback auf Legacy bleibt hart möglich.

## Automatische Fehlerbehandlung

- Kleine Lücken werden als Annahme oder Gap dokumentiert und konservativ fortgeführt.
- Unklare Semantik bleibt `blocked_by_gap`, nicht geraten.
- Hidden-Info-Risiken bleiben `blocked_by_gate`.
- Fehlende Runtime-Evidence bleibt synthetisch oder testintern, nicht produktiv.
- Tests werden eng paketlokal debuggt; kein Wechsel zum nächsten Paket bei rotem Done-Gate.

## Sicherheitsblocker

Bei einem dieser Befunde stoppt der Prozess ohne Zwischenfrage und schreibt einen Blocker-Report:

- Hidden-Info-Leak.
- Semantic selected action nicht in Engine-`LegalActions`.
- Illegale semantische Entscheidung.
- Engine Reject in einem erlaubten semantischen Pfad.
- Non-Determinism, Runtime-Mutation oder Public Payload Delta.
- `actualDecision` weicht außerhalb META-4-Same-Action-Confirmation oder META-5-test/internal-Override-Vertrag von Legacy ab.
- Produktives Flag wird default-on.
- Semantic-Code wird von Runtime-Pfaden importiert, bevor der jeweilige META-Gate das erlaubt.
- Konflikt mit neuen `main`-Änderungen, der denselben fachlichen Vertrag widersprüchlich definiert.

## State Machine

```text
worktree_preflight
-> process_defined
-> META1_in_progress
-> META1_done
-> META2_in_progress
-> META2_done
-> META3_in_progress
-> META3_done
-> META4_in_progress
-> META4_done
-> META5_in_progress
-> META5_done
-> META6_in_progress
-> META6_done
-> integration_preflight
-> merged_to_main
-> worktree_removed
-> complete
```

Blocker-Pfad:

```text
current_step -> blocked
```

## Paketfolge

| Paket | Titel | Done-Gate |
| --- | --- | --- |
| `META1` | DeckDoctrine + Multi-Turn TacticalGoal Engine v0 | Schemas, NeutralDoctrine-Regel, Boardstate-Pivots, GoalState-Lifecycle und No-Action-Selection-Gate existieren. |
| `META2` | Semantic Decision Core + Quality Calibration | Consumer-Gruppen, Score v0, WhyNot, Archetyp- und Boardstate-Override-Fixtures, Safety Counter 0, actualDecision Legacy. |
| `META3` | Cutover Safety Envelope | Flags default off, rollbackForceLegacy default true, Adapter erzeugt keine Actions, Trace developer-only, no public payload delta. |
| `META4` | Agreement-only Runtime Canary | Same-action confirmation nur bei Agreement, Behavior Delta 0, differierende Semantic Action führt zu Legacy. |
| `META5` | Scoped Semantic Override Pilot | Test/internal-only Override-Whitelist, Override > 0 in Fixtures, unsafe/illegal/hidden/engineReject 0, Produktion aus. |
| `META6` | Stabilization + Limited Rollout / Legacy-Freeze Prep | Scope Readiness Matrix, Trace Scrubber, Legacy-Freeze-Kriterien, Expansion Plan, fullProductionReady=false, legacyRemovalReady=false. |

## Paketdetails

### META1

Ziel:

- `DeckStrategicProfile`, `StrategyHypothesis`, `SupportPackage`, `DeckDoctrine`, `DoctrinePivotRule` und `TacticalGoalState` definieren.
- Runner- und Korp-Goal-Families erweitern.
- `NeutralDoctrine` korrekt behandeln.
- Boardstate-Pivots als Übersteuerung der Doctrine modellieren.

Kernartefakte:

- `packages/ai/src/semantic-ai-core-meta.ts`
- `packages/ai/src/semantic-ai-core-meta.test.ts`
- `docs/reviews/ai/meta1-deck-doctrine-tactical-goal-engine-v0-2026-06-04.md`
- `docs/reviews/ai/meta1-deck-doctrine-tactical-goal-engine-v0-report-2026-06-04.json`
- `scripts/check-meta1-deck-doctrine-tactical-goal-engine-v0.mjs`

Checks:

```text
node scripts/check-meta1-deck-doctrine-tactical-goal-engine-v0.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Commit-Vorschlag: `ai: add meta1 semantic doctrine goal engine`

### META2

Ziel:

- Consumer-Gruppen statt Signal-Einzelregeln.
- `SemanticDecisionScore` mit getrennten Komponenten und Hard-Gate-Verhalten.
- Bewertungsreihenfolge fixieren.
- WhyNot-Einträge und Review-Kategorien.
- Archetyp- und Boardstate-Override-Fixtures.

Commit-Vorschlag: `ai: add meta2 semantic decision core`

### META3

Ziel:

- Cutover-Gate, `SemanticAiControlFlags`, Rollback-Regeln, Scope Matrix.
- Adaptervertrag: Semantic darf nur `actionId` aus LegalActions referenzieren; `actualActionId = legacyActionId`.
- Developer-only Trace/Audit Contract.

Commit-Vorschlag: `ai: add meta3 cutover safety envelope`

### META4

Ziel:

- Agreement-only Canary-Harness.
- Same-action Confirmation ohne Behavior Delta.
- Differierende, illegale, hidden-info-blockierte oder rollbackende Semantic Actions führen zu Legacy.

Commit-Vorschlag: `ai: add meta4 agreement-only canary`

### META5

Ziel:

- Test/internal-only Scoped Override Pilot.
- Whitelist-Scopes, Forbidden Scopes, Override-Gates und Divergenz-Triage.
- Mindestens ein erlaubter Override in Fixture-Daten, kein Produktionsflag.

Commit-Vorschlag: `ai: add meta5 scoped override pilot`

### META6

Ziel:

- Scope Readiness Matrix.
- Production-safe Trace Scrubber Vertrag und Fixture-Prüfung.
- Legacy-Freeze-Kriterien, Expansion Plan und Go/No-Go.
- Kein Full Replacement und keine Legacy-Removal-Readiness.

Commit-Vorschlag: `ai: add meta6 stabilization legacy freeze prep`

## Verifikationsregeln

Jedes Paket muss mindestens erfüllen:

- Step-Check-Skript grün.
- Relevanter AI-Test grün.
- `corepack pnpm --filter @netgrid/ai typecheck` grün bei Codeänderung.
- `git diff --check` grün.
- JSON- und Markdown-Report stimmen mit Builder-Ausgabe überein oder das Check-Skript prüft die notwendigen invarianten Felder.
- Keine Runtime-Importe aus `apps/server`, `apps/web`, `packages/engine` oder bestehenden AI-Legacy-Planern, sofern das Paket dies nicht explizit und default-off erlaubt.

Finale Checks:

```text
node scripts/check-meta1-deck-doctrine-tactical-goal-engine-v0.mjs
node scripts/check-meta2-semantic-decision-core-quality-calibration.mjs
node scripts/check-meta3-cutover-safety-envelope.mjs
node scripts/check-meta4-agreement-only-runtime-canary.mjs
node scripts/check-meta5-scoped-semantic-override-pilot.mjs
node scripts/check-meta6-semantic-ai-stabilization-legacy-freeze-prep.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree `C:\Projekte\NETGRID_META1_META6_SEMANTIC_AI_CORE`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Genau ein META-Paket ist aktiv.
- Ein lokaler Commit je grünem META-Paket.
- Prozess-/Progress-Artefakte dürfen separat vor META1 committed werden.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.
- Vor finalem Merge aktuellen `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Bevorzugt Fast-Forward-Merge nach `main`.
- Nach erfolgreichem Merge `git status --short --branch` und `git diff --check` auf `main`.
- Worktree erst nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite Semantic AI Core META 1 bis META 6 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und docs/architecture/ai/semantic-ai-core-meta-automation-process-2026-06-04.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_META1_META6_SEMANTIC_AI_CORE auf Branch codex/meta1-meta6-semantic-ai-core.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen META-Paket.
Schreibe/aktualisiere Paketartefakte, Reports, Check-Skripte und Tests.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

Der Prozess ist abgeschlossen, wenn:

1. META 1 bis META 6 in Reihenfolge abgeschlossen sind.
2. Alle sechs Markdown-Reports, JSON-Reports und Check-Skripte vorliegen.
3. Der gemeinsame AI-Code und die Tests grün sind.
4. Alle harten Safety-Counter auf 0 stehen.
5. Produktive Flags default off bleiben.
6. Hidden-Info- und Public-Payload-Gates bestanden sind.
7. `actualDecision` bis META 4 Legacy bleibt und META 5 nur test/internal-Override erlaubt.
8. `fullProductionReady = false` und `legacyRemovalReady = false` dokumentiert sind.
9. Wissensbasis/Status nach Relevanz aktualisiert sind.
10. Der Branch lokal nach `main` gemerged ist.
11. Der separate Worktree entfernt ist.
