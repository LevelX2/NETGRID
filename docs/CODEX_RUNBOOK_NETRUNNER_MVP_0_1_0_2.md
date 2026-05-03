# Codex-Runbook für Netrunner MVP 0.1 und MVP 0.2

**Zweck:** Dieses Dokument erklärt Codex, wie das Repository vorbereitet, `AGENTS.md` eingerichtet, die Verzeichnisstruktur erzeugt und die Umsetzung von MVP 0.1 und MVP 0.2 mit `/goal` und Multiagent-Workflows gesteuert werden soll.

**Stand:** 03.05.2026  
**Primäre Zielgruppe:** Codex Root Agent, Subagents und menschlicher Projektverantwortlicher  
**Wichtig:** Dieses Dokument ist ein Runbook. Es ersetzt nicht die Fachkonzepte, sondern übersetzt sie in eine Codex-taugliche Arbeitsweise.

---

## 1. Verbindliche Quellen

Codex soll die Quellen im Repository unter `/docs/source` erwarten. Falls sie noch nicht dort liegen, sind sie vor Beginn dorthin zu kopieren.

```txt
/docs/source/
  Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
  Netrunner_MVP_0.2_Plan.md
  Erstes Testdeck.txt
  Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf
```

Quellenpriorität:

1. `Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` ist die verbindliche Arbeitsfassung für MVP 0.1. Sie ersetzt ältere Konzeptzwischenstände.
2. `Netrunner_MVP_0.2_Plan.md` ist die verbindliche Planungsgrundlage für MVP 0.2. MVP 0.2 darf erst nach einem bestandenen MVP-0.1-Gate begonnen werden.
3. `Erstes Testdeck.txt` ist verbindlich für interne Demo-Karten und feste Demo-Decks, soweit diese nicht bereits in der konsolidierten 0.1-Fassung übernommen wurden.
4. `Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf` ist Regelreferenz, aber nicht Scope-Erweiterung. Jede MVP-Abweichung wird dokumentiert.

Alte Konzeptdateien, Zwischenstände oder frühere Prompts dürfen nicht als gleichrangige Spezifikation verwendet werden. Falls sie noch im Repository liegen, sind sie als Archiv zu behandeln.

---

## 2. Zielbild der Versionen

### MVP 0.1

MVP 0.1 ist ein eng abgegrenzter, testbarer und deterministischer Regelausschnitt: Ein Mensch spielt als Runner über eine private Weboberfläche gegen eine einfache Corp-KI. Beide Seiten verwenden feste Demo-Decks. Die Rules Engine ist die alleinige Regelautorität. UI, Mensch und KI wählen nur aus `LegalActions`; jede eingereichte `PlayerAction` wird erneut durch `applyAction` validiert.

MVP 0.1 beweist:

- GameState-Erzeugung, Validierung und deterministische Transitionen.
- LegalAction- und PlayerAction-Modell.
- Grundaktionen, Installationen, Runs, ICE, Breaker, Breach, Access, Agenda-Steal, Agenda-Score und Agenda-Sieg für den Demo-Kartenpool.
- Corp-KI ohne Zugriff auf vollständigen GameState.
- EventLog, Replay, StateHash, Seed, RandomCounter und RandomDrawRecords.
- Hidden-Info-Schutz für PlayerViews, PublicEvents, KI-Input, Fehlerausgaben und Replays.

### MVP 0.2

MVP 0.2 ist keine Erweiterung des Kartenpools und kein Ausbau komplexer Netrunner-Regeln. MVP 0.2 ist die private Multiplayer-Schicht über der stabilen 0.1-Engine: zwei Menschen spielen über privaten Link, serverautoritative WebSocket-Synchronisation, getrennte PlayerViews, Reconnect, kontrolliertes Undo, Persistenz, Concurrency-Schutz und Multiplayer-Visibility-Tests.

MVP 0.2 beweist:

- Private Match-Erstellung mit Host-/Joiner-Seitenlogik.
- Einladungslink und sichere Tokens.
- WebSocket-Protokoll für StateUpdates, LegalActions, ChoiceRequests, EventLogUpdates und ActionReceipts.
- Serielle serverseitige Action-Pipeline mit Locking, Idempotency und stale StateVersion Handling.
- Reconnect in Action Phase, Run, Encounter und Access.
- Undo vor Hidden-Info-Barrier; Block nach relevanter Informationsgewinnung.
- Persistenz für Match, GameState, EventLog, Snapshots, Sessions und ActionReceipts.

---

## 3. Bedeutung von `/goal` für dieses Projekt

`/goal` soll als persistenter Workflow-Rahmen verwendet werden. Der Zweck ist nicht, einzelne Prompts zu ersetzen, sondern den übergeordneten Arbeitsauftrag über mehrere Phasen hinweg stabil zu halten.

Für dieses Projekt bedeutet das:

- Ein Goal hält die jeweilige Hauptphase zusammen: Setup, 0.1 Requirements, 0.1 Implementation, 0.1 Hardening, 0.2 Requirements, 0.2 Implementation.
- Der Root Agent arbeitet als Orchestrator.
- Subagents liefern begrenzte Analyse-, Review- oder Testbefunde.
- Der Root Agent konsolidiert Ergebnisse und besitzt die finalen Schreibrechte.
- Zwischen Phasen werden Gates geprüft. Ein Goal darf nicht einfach in die nächste Version weiterlaufen, wenn das Gate nicht bestanden ist.

Empfohlene Goal-Struktur:

```txt
Goal A: Repository setup and Codex guidance
Goal B: MVP 0.1 executable requirements and data artifacts
Goal C: MVP 0.1 implementation and hardening
Goal D: MVP 0.2 executable requirements and multiplayer design freeze
Goal E: MVP 0.2 implementation, synchronization, reconnect, undo, and hardening
```

Praktische Bedienung:

- In Codex CLI oder Codex App `/goal` öffnen und ein neues Goal mit dem jeweiligen Text anlegen.
- Wenn die Oberfläche konkrete Unterbefehle anbietet, diese verwenden.
- Wenn keine verlässliche Syntax angezeigt wird, den Goal-Text als normalen Prompt formulieren: `Create or continue a persistent goal named ...`.
- `/goal` kann pausiert und fortgesetzt werden. Nach jedem Resume muss Codex zuerst `AGENTS.md`, dieses Runbook und den aktuellen Statusbericht lesen.

`/goal` ist nicht `AGENTS.md`:

- `AGENTS.md` enthält dauerhafte Repository-Regeln.
- `/goal` enthält den aktuellen mehrstufigen Arbeitsauftrag.
- Subagents bearbeiten abgegrenzte Teilaufgaben.
- Worktrees oder Branches trennen parallele Codeänderungen.

---

## 4. Multiagent-Regeln

Codex soll Subagents explizit nur dann verwenden, wenn der Prompt dies verlangt. Für dieses Projekt gilt:

1. Der Root Agent liest `AGENTS.md`, dieses Runbook und die relevanten Quellen.
2. Der Root Agent startet Subagents für begrenzte, voneinander unabhängige Aufgaben.
3. Subagents arbeiten vorzugsweise read-only: Analyse, Extraktion, Review, Testlücken, Logauswertung.
4. Subagents dürfen nicht gleichzeitig dieselben Dateien schreiben.
5. Bei write-heavy Parallelisierung müssen Git Worktrees oder klar getrennte Branches genutzt werden.
6. Der Root Agent wartet auf alle Subagents, konsolidiert die Ergebnisse, entscheidet Konflikte anhand der Quellenpriorität und schreibt die finalen Artefakte.
7. Jeder Subagent muss mit einem kompakten, strukturierten Ergebnis zurückkehren.

Standard-Rückgabeformat für Subagents:

```txt
Subagent: <Name>
Scope: <gelesene Dateien / untersuchter Bereich>
Findings:
- ...
Proposed changes:
- ...
Risks:
- ...
Open questions:
- ...
Gate status: pass | fail | blocked
```

Subagents sind sinnvoll für:

- Quellenextraktion.
- Regel- und Abweichungsanalyse.
- Testmatrix und Szenarioabdeckung.
- Visibility-/Replay-/Security-Review.
- Protokoll- und Concurrency-Review.
- Build-/Testlog-Auswertung.

Subagents sind riskant für:

- Gleichzeitige Änderungen an Engine-Core-Dateien.
- Gleichzeitige Änderungen an Typmodellen.
- Gleichzeitige Änderungen an `AGENTS.md`.
- Gleichzeitige Änderungen an Datenmodellen, die andere Pakete importieren.

---

## 5. Erwartete Repository-Struktur

Codex soll zuerst die Struktur erzeugen, bevor Implementierung beginnt. Diese Struktur ist Zielbild; nicht alle Dateien müssen in Phase 0 vollständig befüllt sein.

```txt
/netrunner-app
  AGENTS.md
  README.md
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  vitest.config.ts
  .gitignore
  .env.example

  /docs
    /source
      Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
      Netrunner_MVP_0.2_Plan.md
      Erstes Testdeck.txt
      Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf
    /codex
      CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
      CODEX_STATUS.md
      GOAL_HISTORY.md
    /derived
      MVP_0.1_REQUIREMENTS.md
      ENGINE_API_SPEC.md
      GAME_STATE_MODEL.md
      TIMING_AND_RUN_MODEL.md
      DEVIATION_REGISTRY.md
      ACCEPTANCE_CRITERIA.md
      TEST_MATRIX.md
      OPEN_QUESTIONS.md
      CONFLICT_MATRIX.md
      REQUIREMENTS_REVIEW.md
      MVP_0.2_REQUIREMENTS.md
      MULTIPLAYER_API_SPEC.md
      WEBSOCKET_PROTOCOL_SPEC.md
      STORAGE_SCHEMA.md
      TOKEN_AND_SESSION_SECURITY.md
      RECONNECT_AND_UNDO_SPEC.md
      MULTIPLAYER_TEST_MATRIX.md
      MVP_0.2_READINESS_REVIEW.md

  /data
    /rules
      rules-baseline.json
      rules-baseline-0.2.json
    /cards
      demo-cards.json
    /decks
      demo-decks.json
    /manifests
      card-implementation-manifest.json
    /deviations
      rule-deviations.json
    /scenarios
      runner-steals-rd-agenda.json
      runner-breaks-ice-and-accesses-rd.json
      runner-fails-on-end-the-run.json
      corp-scores-remote-agenda.json
      visibility-runner-view-no-corp-leak.json
      replay-full-demo-game-statehash.json
      multiplayer-create-join-action.json
      multiplayer-reconnect-during-run.json
      multiplayer-undo-before-hidden-info.json
      multiplayer-undo-after-hidden-info-blocked.json

  /packages
    /shared
      AGENTS.md
      package.json
      /src
        /types
        /schemas
        /constants
    /engine
      AGENTS.md
      package.json
      /src
        /state
        /rules
        /actions
        /phases
        /runs
        /breach
        /cards
        /effects
        /visibility
        /random
        /replay
        /validation
        /tests
    /ai
      AGENTS.md
      package.json
      /src
        /corp
        /heuristic
        /evaluation
        /fallback
        /tests

  /apps
    /web
      AGENTS.md
      package.json
      /app
      /components
      /game
      /cards
      /replay
      /styles
    /server
      AGENTS.md
      package.json
      /src
        /api
        /ws
        /auth
        /storage
        /matches
        /sessions
        /reconnect
        /undo
        /ai-runner
        /tests

  /tests
    /specs
      acceptance-tests.todo.md
      multiplayer-acceptance-tests.todo.md
    /e2e
    /fixtures

  /scripts
    validate-derived-artifacts.ts
    check-visibility-leaks.ts
    replay-scenario.ts
```

---

## 6. Root `AGENTS.md`

Codex soll im ersten Setup-Schritt ein Root-`AGENTS.md` erzeugen. Es muss kurz bleiben. Lange Spezifikationen gehören in `/docs/source`, `/docs/derived` und dieses Runbook, nicht in `AGENTS.md`.

Empfohlener Inhalt:

```md
# AGENTS.md

## Project
Private Netrunner web application. MVP 0.1 is Human Runner vs simple Corp AI with fixed demo decks. MVP 0.2 is private Human-vs-Human multiplayer over the same engine.

## Source priority
1. `/docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md` for MVP 0.1.
2. `/docs/source/Netrunner_MVP_0.2_Plan.md` for MVP 0.2 after MVP 0.1 gates pass.
3. `/docs/source/Erstes Testdeck.txt` for demo cards and demo decks.
4. `/docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf` as rules reference only.
5. `/docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md` for Codex workflow.

## Mandatory principles
- Engine correctness first.
- The Rules Engine is the only rule authority.
- UI, server, human players, and AI may only submit PlayerActions selected from LegalActions.
- `applyAction` must validate side, actionId, stateVersion, timing point, costs, targets, and choices again.
- No hidden card data may leak into PlayerViews, PublicEvents, AI inputs, WebSocket payloads, reconnect payloads, undo previews, public replays, logs, or client errors.
- Deterministic replay and StateHash are mandatory.
- Use seeded randomness, RandomCounter, and RandomDrawRecords.
- Do not expand card pool or official mechanics beyond the declared MVP scope.
- No official art, card frames, logos, card backs, or external card database dependencies.
- No public platform features, matchmaking, rankings, deckbuilder, account system, tournament features, or broad card pool in MVP 0.1 or 0.2.

## Stack defaults
- Node 24 LTS.
- pnpm workspaces.
- TypeScript strict.
- Vitest.
- Next.js + React for the web UI.
- Pure TypeScript engine package with no React, network, database, or AI dependencies.
- JSON or SQLite storage for early MVP; SQLite preferred for MVP 0.2.

## Workflow
- Derive requirements, data, scenarios, and test matrix before implementation.
- Use subagents only when explicitly requested.
- Root agent owns final writes unless worktrees or non-overlapping file scopes are used.
- Do not proceed from MVP 0.1 to MVP 0.2 until MVP 0.1 acceptance gates pass or blockers are explicitly documented.

## Commands
Use the repository scripts once created:
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Done means
- Required derived docs exist.
- Every Must requirement has test or scenario coverage.
- Every `playable_mvp` card has unit and scenario coverage.
- Visibility, replay, StateHash, stale action, and illegal action tests pass.
- Build and test commands pass.
- Known deviations and open questions are documented.
```

---

## 7. Bereichsspezifische `AGENTS.md`-Dateien

Optional, aber empfohlen. Sie halten lokale Regeln kurz und verhindern Fehlannahmen.

### `/packages/engine/AGENTS.md`

```md
# Engine rules

- This package is a pure TypeScript rules engine.
- No React, browser, WebSocket, database, file-system, or AI dependencies.
- Engine functions must be deterministic for the same initial state, seed, and event log.
- Never trust UI, server, AI, or client input.
- Validate every PlayerAction inside `applyAction`.
- Run `validateGameState` after every successful transition.
- Every successful transition emits GameEvent with stateVersionBefore, stateVersionAfter, timingPoint, publicPayload, privatePayload, and resultingStateHash.
- Public payloads must not contain hidden card identities or private target data.
- Use CardInstanceRef for zones; do not duplicate card instances.
- Add tests for every new mechanic and every playable card effect.
```

### `/packages/ai/AGENTS.md`

```md
# AI rules

- MVP 0.1 AI controls only Corp.
- AI may consume only Corp PlayerView, side-filtered PublicEvents, LegalActions, and explicit allowed metadata.
- AI must never receive full GameState.
- AI must never infer from hidden Runner grip or stack data.
- AI must pick only LegalActions.
- Add fallback behavior for timeout or invalid AI choice.
- AI tests must check no illegal action and no hidden-info input leak.
```

### `/apps/web/AGENTS.md`

```md
# Web UI rules

- UI is not a rule authority.
- UI renders PlayerView, LegalActions, ChoiceRequests, public/side-filtered events, and local client state only.
- UI must never receive or display full GameState in normal player mode.
- Debug views must not leak opponent hidden information.
- MVP 0.1 UI may be minimal and desktop-oriented.
- MVP 0.2 UI must support two browser windows/devices, join link, connection status, waiting states, reconnect state, and undo prompts.
```

### `/apps/server/AGENTS.md`

```md
# Server rules

- Server owns authoritative Match and full GameState.
- Clients cannot set GameState or bypass Engine.
- Every action goes through token/session validation, match status validation, stateVersion validation, idempotency handling, and `applyAction`.
- MVP 0.2 must process one transition per match at a time.
- Tokens are high entropy, stored only as hashes, and never logged.
- WebSocket, reconnect, undo, errors, and logs must be side-filtered.
- SQLite or a stable JSON adapter is acceptable early; SQLite is preferred for MVP 0.2.
```

### `/packages/shared/AGENTS.md`

```md
# Shared package rules

- Shared types and schemas must not import engine internals, UI components, server storage, or AI logic.
- Keep schemas stable and versioned.
- Prefer explicit discriminated unions for actions, events, phases, sides, zones, messages, and errors.
- Any schema change must be reflected in derived docs and tests.
```

---

## 8. Environment-Setup durch Codex

Codex soll mit einem Setup-Goal starten und nur die Umgebung vorbereiten. Noch keine Engine implementieren.

### Setup-Prompt

```text
Create or continue a persistent goal named "Netrunner repository setup and Codex guidance".

Read:
- /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
- /docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
- /docs/source/Netrunner_MVP_0.2_Plan.md
- /docs/source/Erstes Testdeck.txt

Task:
Set up the repository structure and Codex guidance files only. Do not implement the engine, UI, server, AI, or tests yet.

Create or verify:
- root AGENTS.md
- package-specific AGENTS.md files
- /docs/source
- /docs/codex
- /docs/derived
- /data/rules
- /data/cards
- /data/decks
- /data/manifests
- /data/deviations
- /data/scenarios
- /packages/shared
- /packages/engine
- /packages/ai
- /apps/web
- /apps/server
- /tests/specs
- /tests/e2e
- /scripts

If package files do not exist yet, create minimal placeholders only when needed for later setup. Do not install dependencies in this phase unless package manifests are created and you can explain why installation is necessary.

Write /docs/codex/CODEX_STATUS.md with:
- current phase
- files created
- missing source files, if any
- blockers
- next recommended prompt

Done when:
- directory structure exists,
- AGENTS.md files exist,
- no implementation code has been written,
- /docs/codex/CODEX_STATUS.md summarizes the setup.
```

---

## 9. MVP 0.1 Workflow

MVP 0.1 wird in vier Phasen umgesetzt:

1. Anforderungen und ausführbare Artefakte ableiten.
2. Ableitungen reviewen und einfrieren.
3. Engine, KI, UI und Tests implementieren.
4. 0.1 hart validieren und Readiness für 0.2 prüfen.

### 9.1 Goal für MVP 0.1 Requirements Freeze

```text
Create or continue a persistent goal named "MVP 0.1 executable requirements".

Read AGENTS.md and /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md first.

Primary sources:
- /docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
- /docs/source/Erstes Testdeck.txt
- /docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf

Secondary source:
- /docs/source/Netrunner_MVP_0.2_Plan.md only for future-compatibility awareness. Do not expand MVP 0.1 scope.

Task:
Turn the MVP 0.1 sources into executable requirements, data artifacts, scenario fixtures, and a test matrix. Do not implement code.

Use subagents for bounded read-heavy work. Root agent must consolidate and write final files.

Spawn these subagents and wait for all:

Subagent A – Product scope and non-goals:
Read the 0.1 concept. Extract goals, non-goals, user journeys, acceptance criteria, definition of done, and scope boundaries. Return candidate requirements with stable IDs.

Subagent B – Engine API, state, actions, timing:
Read the 0.1 concept. Extract Engine API, GameState, zones, servers, LegalActions, PlayerActions, phases, timing points, resolver pipeline, invariants, run model, breach/access, and win conditions.

Subagent C – Cards, decks, card manifest:
Read the 0.1 concept and Erstes Testdeck.txt. Extract demo cards, demo decks, implementation statuses, card effects, required mechanics, and card-specific tests.

Subagent D – Visibility, replay, randomness, StateHash:
Read the 0.1 concept. Extract PlayerView filtering, hidden-info rules, PublicEvents, privatePayload, AI input restrictions, EventLog, seeded randomness, RandomCounter, RandomDrawRecords, replay, and StateHash requirements.

Subagent E – Rules deviations:
Read the 0.1 concept and rules reference if needed. Identify official-rule areas simplified, deferred, or unsupported in MVP 0.1. Return deviation entries with risk and removal condition.

Subagent F – Test strategy:
Read the 0.1 concept. Extract unit, integration, scenario, visibility, replay, AI, card, and regression test requirements. Return a test matrix proposal.

After all subagents return, create or update:
- /docs/derived/MVP_0.1_REQUIREMENTS.md
- /docs/derived/ENGINE_API_SPEC.md
- /docs/derived/GAME_STATE_MODEL.md
- /docs/derived/TIMING_AND_RUN_MODEL.md
- /docs/derived/DEVIATION_REGISTRY.md
- /docs/derived/ACCEPTANCE_CRITERIA.md
- /docs/derived/TEST_MATRIX.md
- /docs/derived/OPEN_QUESTIONS.md
- /docs/derived/CONFLICT_MATRIX.md
- /data/rules/rules-baseline.json
- /data/cards/demo-cards.json
- /data/decks/demo-decks.json
- /data/manifests/card-implementation-manifest.json
- /data/deviations/rule-deviations.json
- /data/scenarios/runner-steals-rd-agenda.json
- /data/scenarios/runner-breaks-ice-and-accesses-rd.json
- /data/scenarios/runner-fails-on-end-the-run.json
- /data/scenarios/corp-scores-remote-agenda.json
- /data/scenarios/visibility-runner-view-no-corp-leak.json
- /data/scenarios/replay-full-demo-game-statehash.json
- /tests/specs/acceptance-tests.todo.md

Rules:
- Every concrete requirement needs a stable ID.
- Every Must requirement must map to at least one test or scenario.
- Every playable_mvp card must map to at least one unit test and one integration/scenario test.
- Every MVP simplification or official-rules deviation must appear in the deviation registry.
- Every ambiguity must appear in OPEN_QUESTIONS.md with a deterministic MVP assumption.
- Do not implement code.
- Do not add external APIs or official assets.

Final response:
- files created or updated,
- main requirements,
- assumptions,
- deviations,
- unresolved risks,
- whether the artifacts are ready for review.
```

### 9.2 Review-Prompt für MVP 0.1 Requirements

```text
Continue the goal "MVP 0.1 executable requirements".

Review the generated MVP 0.1 derived artifacts. Use read-only subagents. Root agent may update files only after consolidating findings.

Spawn these subagents and wait for all:

Subagent A – Rules and scope consistency reviewer:
Check whether requirements, timing model, run model, deviation registry, card data, deck data, and scenarios match MVP 0.1 and do not expand scope.

Subagent B – Engine implementation readiness reviewer:
Check whether Engine API, state model, actions, validations, invariants, and errors are precise enough to implement without product clarification.

Subagent C – Visibility and replay reviewer:
Check whether PlayerViews, PublicEvents, AI inputs, errors, public replays, RandomDrawRecords, StateHash, and deterministic replay are fully specified and testable.

Subagent D – Test coverage reviewer:
Check whether every Must requirement, every playable_mvp card, every deviation, and every critical hidden-info case has test or scenario coverage.

After all subagents return:
- Update derived artifacts if needed.
- Create or update /docs/derived/REQUIREMENTS_REVIEW.md.
- Update /docs/codex/CODEX_STATUS.md.

Final response:
- gaps found,
- gaps fixed,
- remaining risks,
- ready_for_implementation: true | false,
- exact blockers if false.
```

### 9.3 Implementation-Prompt für MVP 0.1

Nur verwenden, wenn `ready_for_implementation: true` oder wenn konkrete, dokumentierte Restlücken nicht blockierend sind.

```text
Create or continue a persistent goal named "MVP 0.1 implementation".

Read:
- AGENTS.md
- /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
- /docs/codex/CODEX_STATUS.md
- /docs/derived/MVP_0.1_REQUIREMENTS.md
- /docs/derived/ENGINE_API_SPEC.md
- /docs/derived/GAME_STATE_MODEL.md
- /docs/derived/TIMING_AND_RUN_MODEL.md
- /docs/derived/DEVIATION_REGISTRY.md
- /docs/derived/ACCEPTANCE_CRITERIA.md
- /docs/derived/TEST_MATRIX.md
- /data/rules/rules-baseline.json
- /data/cards/demo-cards.json
- /data/decks/demo-decks.json
- /data/manifests/card-implementation-manifest.json
- /data/scenarios/*.json

Task:
Implement MVP 0.1. Do not reinterpret the source documents unless a derived artifact is contradictory or incomplete. If such a problem occurs, update the derived artifact and continue with the simplest deterministic MVP assumption.

Implementation order:
1. Monorepo setup: pnpm workspace, package manifests, TypeScript strict, Vitest, lint/typecheck/build scripts.
2. /packages/shared: types, schemas, constants.
3. /packages/engine: GameState, zones, card definitions, createGame, seeded shuffle, stateVersion, hashState.
4. Engine validation: validateGameState, CardInstance uniqueness, zone consistency.
5. PlayerViews and visibility filters.
6. LegalActions and PlayerActions.
7. Basic actions: gain credit, draw card, install card, play event, play operation, advance card, end turn.
8. Corp and Runner turn flow.
9. Run flow: initiate run, server choice, approach ICE, rez choice, encounter, pump/break, subroutines, pass ICE, breach/access, cleanup.
10. Agenda steal, agenda score, win conditions.
11. EventLog, RandomDrawRecord, replayEvents, StateHash verification.
12. Demo card effects and card tests.
13. Corp AI: deterministic heuristic using only Corp PlayerView, PublicEvents, LegalActions, allowed metadata.
14. Minimal web UI for Human Runner vs Corp AI.
15. Scenario tests and acceptance tests.
16. README and documented limitations.

Use subagents only for read-only review, test-gap analysis, or log analysis unless you create isolated non-overlapping work scopes. Root agent owns final code edits.

Quality gates:
- pnpm install
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

MVP 0.1 is done when:
- all Must requirements pass,
- all required scenario fixtures pass,
- no hidden-info leaks are known,
- replay reproduces final StateHash,
- a human Runner can complete a demo game against Corp AI locally,
- known limitations and deviations are documented.

Final response:
- features implemented,
- files changed,
- tests added,
- commands run and results,
- known limitations,
- whether MVP 0.1 is playable locally.
```

### 9.4 Hardening-Prompt für MVP 0.1

```text
Continue the goal "MVP 0.1 implementation".

Perform MVP 0.1 hardening and readiness review for MVP 0.2.

Use subagents:

Subagent A – Engine invariant reviewer:
Run and inspect tests for GameState invariants, action validation, stale state handling, and replay determinism.

Subagent B – Visibility leak reviewer:
Search PlayerViews, PublicEvents, AI inputs, errors, logs, debug UI, and replay output for hidden-info leaks.

Subagent C – Scenario coverage reviewer:
Check scenario fixtures against implemented tests. Identify missing coverage for cards, runs, access, scoring, win conditions, and AI.

Subagent D – Build and DX reviewer:
Inspect package scripts, README, startup flow, and local dev commands.

Root agent must fix critical issues, update /docs/codex/CODEX_STATUS.md, and create:
- /docs/derived/MVP_0.1_FINAL_REVIEW.md
- /docs/derived/MVP_0.2_READINESS_REVIEW.md

Do not start MVP 0.2 implementation.

Final response:
- issues found,
- issues fixed,
- remaining issues,
- MVP_0.1_done: true | false,
- ready_for_MVP_0.2: true | false,
- blockers if false.
```

---

## 10. MVP 0.2 Workflow

MVP 0.2 beginnt erst, wenn MVP 0.1 ausreichend stabil ist. Falls 0.1-Gates fehlen, werden sie als 0.2-pre-Arbeitspaket geführt und zuerst erledigt.

### 10.1 Vorbedingungen für MVP 0.2

Mindestens erforderlich:

- `applyAction` ist rein, deterministisch und validiert Actions erneut.
- `getPlayerView(gameState, side)` ist getestet und leakfrei.
- LegalActions enthalten Side, ActionId, TimingPoint, Costs, TargetRequirements und Ablauf-StateVersion.
- PlayerActions enthalten MatchId, Side, ActionId, Targets/Choices, ClientKnownStateVersion und IdempotencyKey.
- EventLog enthält StateVersion vorher/nachher und StateHash.
- StateHash ist über kanonische Serialisierung reproduzierbar.
- Demo-Decks sind spielbar genug für Multiplayer-Beispielpartien.
- Visibility-Basistests bestehen.
- Storage-Adapter für Match, State, EventLog und Snapshots ist vorhanden oder wird zuerst gebaut.
- UI kann PlayerView, LegalActions und ChoiceRequests anzeigen.

### 10.2 Goal für MVP 0.2 Requirements Freeze

```text
Create or continue a persistent goal named "MVP 0.2 multiplayer requirements".

Read:
- AGENTS.md
- /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
- /docs/derived/MVP_0.2_READINESS_REVIEW.md
- /docs/source/Netrunner_MVP_0.2_Plan.md
- relevant MVP 0.1 derived artifacts and implementation files

Task:
Turn the MVP 0.2 plan into executable multiplayer requirements, API specs, WebSocket specs, storage schema, token/session security rules, reconnect/undo specs, scenario fixtures, and a test matrix. Do not implement yet unless required to repair a blocking 0.1 readiness gap.

Use read-only subagents and wait for all:

Subagent A – Product and lifecycle:
Extract product scope, non-goals, match lifecycle, match status transitions, host/join flows, side selection, lobby, and acceptance criteria.

Subagent B – REST, tokens, sessions, security:
Extract match creation, join, reconnect, session/token model, token hashing, expiry, logging constraints, rate limits, CORS/origin, and private deployment requirements.

Subagent C – WebSocket protocol and action pipeline:
Extract join_match, state_update, legal_actions, choice_request, event_log_update, submit_action, action_receipt, opponent_status, match_finished, stale state handling, idempotency, and per-match locking.

Subagent D – Visibility, reconnect, undo:
Extract side-filtered payload rules, reconnect bootstrap, pending choices, undo request/accept/decline, snapshot restore, hidden-info barrier, and leak tests.

Subagent E – Storage, migration, replay:
Extract match/session/event/snapshot/actionReceipt schema, SQLite/JSON adapter needs, migration rules, replay and StateHash requirements.

Subagent F – UI and E2E tests:
Extract create-match UI, join UI, two-player board, waiting states, connection state, undo UI, debug state, and E2E scenario coverage.

After all subagents return, create or update:
- /docs/derived/MVP_0.2_REQUIREMENTS.md
- /docs/derived/MULTIPLAYER_API_SPEC.md
- /docs/derived/WEBSOCKET_PROTOCOL_SPEC.md
- /docs/derived/STORAGE_SCHEMA.md
- /docs/derived/TOKEN_AND_SESSION_SECURITY.md
- /docs/derived/RECONNECT_AND_UNDO_SPEC.md
- /docs/derived/MULTIPLAYER_TEST_MATRIX.md
- /docs/derived/MVP_0.2_REQUIREMENTS_REVIEW.md
- /data/rules/rules-baseline-0.2.json
- /data/scenarios/multiplayer-create-join-action.json
- /data/scenarios/multiplayer-reconnect-during-run.json
- /data/scenarios/multiplayer-undo-before-hidden-info.json
- /data/scenarios/multiplayer-undo-after-hidden-info-blocked.json
- /tests/specs/multiplayer-acceptance-tests.todo.md

Rules:
- Do not expand card pool.
- Do not implement account system, public matchmaking, rankings, lobby directory, tournaments, spectator mode, broad chat, or deckbuilder.
- Keep demo decks from MVP 0.1.
- Every Must requirement must map to tests.
- Every WebSocket payload must have visibility rules.
- Every token/session flow must have security tests.
- Every concurrency-sensitive action must have idempotency or stale-state behavior.

Final response:
- files created or updated,
- main requirements,
- assumptions,
- risks,
- ready_for_implementation: true | false.
```

### 10.3 Implementation-Prompt für MVP 0.2

Nur verwenden, wenn MVP 0.2 Requirements Review `ready_for_implementation: true` meldet.

```text
Create or continue a persistent goal named "MVP 0.2 multiplayer implementation".

Read:
- AGENTS.md
- /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md
- /docs/derived/MVP_0.2_REQUIREMENTS.md
- /docs/derived/MULTIPLAYER_API_SPEC.md
- /docs/derived/WEBSOCKET_PROTOCOL_SPEC.md
- /docs/derived/STORAGE_SCHEMA.md
- /docs/derived/TOKEN_AND_SESSION_SECURITY.md
- /docs/derived/RECONNECT_AND_UNDO_SPEC.md
- /docs/derived/MULTIPLAYER_TEST_MATRIX.md
- /data/rules/rules-baseline-0.2.json
- /data/scenarios/multiplayer-*.json

Task:
Implement MVP 0.2 as private Human-vs-Human multiplayer over the existing MVP 0.1 engine. Do not expand card pool or complex rules.

Implementation order:
1. 0.2-pre gate fixes from MVP_0.2_READINESS_REVIEW.md.
2. Baseline 0.2.0 and multiplayer schema versions.
3. Match model, MatchStatus, MatchVersion, MatchSettings.
4. Storage adapter: SQLite preferred, JSON acceptable only if explicitly documented.
5. PlayerSession, InviteToken, token generation, token hashing, no token logging.
6. REST API: create match, join match, reconnect/bootstrap if specified.
7. WebSocket server: join_match, state_update, legal_actions, choice_request, event_log_update, opponent_status, action_receipt, match_finished, error.
8. Server-authoritative action pipeline: token/session validation, side validation, match status validation, stateVersion validation, idempotency, per-match lock, applyAction, storage, broadcast.
9. Side-filtered WebSocket payloads and errors.
10. Reconnect: restore side, current PlayerView, LegalActions, pending ChoiceRequest, public/side-filtered event tail.
11. Undo: request, accept, decline, snapshot restore, hidden-info barrier.
12. UI: create match, copy invite link, join screen, two-player board, waiting states, connection status, undo prompts, debug panel without leaks.
13. Multiplayer tests: REST, WebSocket, action pipeline, concurrency, idempotency, stale state, reconnect, undo, visibility, E2E.
14. Private deployment docs and optional Docker.

Use subagents only for bounded review or log analysis unless work is isolated by worktree or non-overlapping scope.

Quality gates:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- multiplayer E2E scenario passes

MVP 0.2 is done when:
- two humans can play a full private match in two browser windows or devices,
- all actions go through server and Engine,
- no client can mutate GameState directly,
- stateVersion, matchVersion, idempotency and locking prevent double transitions,
- reconnect works in Action Phase, Run, Encounter and Access,
- undo works before hidden information and is blocked after Hidden-Info-Barrier,
- no hidden-info leaks are known in WebSocket, reconnect, undo, errors, logs or debug UI,
- multiplayer replay reproduces StateHash,
- limitations are documented.

Final response:
- features implemented,
- files changed,
- tests added,
- commands run and results,
- known limitations,
- whether MVP 0.2 is playable locally.
```

### 10.4 Hardening-Prompt für MVP 0.2

```text
Continue the goal "MVP 0.2 multiplayer implementation".

Perform final hardening. Use subagents:

Subagent A – Multiplayer visibility audit:
Inspect WebSocket payloads, reconnect bootstrap, undo payloads, errors, logs, and UI debug output for hidden-info leaks.

Subagent B – Concurrency and idempotency audit:
Inspect match lock, action receipts, duplicate idempotency keys, stale state handling, rapid double-click behavior, and simultaneous actions.

Subagent C – Reconnect and undo audit:
Inspect reconnect during Action Phase, Run, Rez Choice, Encounter, Access, and undo before/after hidden information.

Subagent D – E2E and deployment audit:
Run or inspect E2E scenario, start scripts, README, environment variables, private deployment instructions, and Docker if present.

Root agent fixes critical issues and creates:
- /docs/derived/MVP_0.2_FINAL_REVIEW.md
- updated /docs/codex/CODEX_STATUS.md

Final response:
- issues found,
- issues fixed,
- remaining limitations,
- commands run and results,
- MVP_0.2_done: true | false.
```

---

## 11. Empfohlene Branch-/Worktree-Strategie

Für Requirements und Reviews reicht ein Thread/Goal ohne Worktrees.

Für Implementierung gilt:

```txt
main
  enthält stabile Baseline und reviewed derived artifacts

branch: mvp-0.1-implementation
  Engine, KI, UI, Tests für 0.1

branch: mvp-0.1-hardening
  Visibility, Replay, StateHash, E2E-Härtung

branch: mvp-0.2-requirements
  Multiplayer-Spezifikation und Szenario-Artefakte

branch: mvp-0.2-implementation
  REST, WebSocket, Storage, Reconnect, Undo, UI
```

Wenn parallele Codex-Threads Code schreiben sollen, dann:

- pro Thread ein separater Git Worktree,
- klar getrennte Dateibereiche,
- keine gleichzeitigen Änderungen an shared Types ohne Root-Agent-Koordination,
- Merge erst nach Tests und Review.

Empfohlene Aufteilung für parallele Worktrees in MVP 0.2:

```txt
worktree/server-storage
  apps/server/src/storage
  apps/server/src/matches
  apps/server/src/sessions

worktree/server-ws
  apps/server/src/ws
  apps/server/src/api

worktree/web-multiplayer
  apps/web/app
  apps/web/components

worktree/multiplayer-tests
  tests/e2e
  apps/server/src/tests
```

Nicht parallel ohne zentrale Koordination bearbeiten:

- `/packages/shared/src/types`
- `/packages/engine/src`
- `/data/scenarios`
- root `package.json`
- root `AGENTS.md`

---

## 12. Quality Gates

### MVP 0.1 Gates

```txt
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Zusätzliche inhaltliche Gates:

- Deterministic createGame for same seed.
- CardInstance uniqueness.
- Zone consistency.
- LegalAction/PlayerAction validation.
- stale StateVersion rejection.
- invalid side/action/target/cost rejection.
- RunnerView leak tests.
- Corp AI input leak tests.
- PublicEvent leak tests.
- replayEvents final StateHash equality.
- Runner steals R&D agenda.
- Corp scores remote agenda.
- protected run with ETR failure.
- protected run with breaker success.
- every `playable_mvp` card covered.

### MVP 0.2 Gates

```txt
pnpm lint
pnpm typecheck
pnpm test
pnpm build
multiplayer E2E scenario
```

Zusätzliche inhaltliche Gates:

- create match.
- join via token.
- invalid token rejected without leaks.
- side-specific sessions.
- WebSocket join.
- side-filtered PlayerViews.
- side-filtered LegalActions and ChoiceRequests.
- submit_action pipeline.
- duplicate idempotency key returns stored receipt.
- simultaneous actions do not create double transition.
- stale action rejected and client resynced.
- reconnect during Action Phase.
- reconnect during Run/Encounter/Access.
- undo before Hidden-Info-Barrier.
- undo after Hidden-Info-Barrier blocked.
- tokens never logged or stored in plaintext.
- no hidden data in WebSocket, reconnect, undo, errors or debug UI.

---

## 13. Stop-Regeln

Codex muss stoppen oder einen Blocker dokumentieren, wenn:

- eine Must-Anforderung nicht testbar formuliert ist und keine sichere MVP-Annahme möglich ist,
- Hidden-Info-Leak gefunden wird,
- Replay/StateHash nicht deterministisch ist,
- `applyAction` Clientinput vertraut,
- KI oder UI Zugriff auf full GameState erhält,
- MVP 0.2 gestartet werden soll, obwohl MVP 0.1 Gates fehlen,
- der Kartenpool heimlich erweitert wird,
- offizielle Assets, Logos, Frames, Card Backs oder externe Karten-APIs eingebunden werden,
- Multiplayer-Code ohne Locking/Idempotency/Stale-State-Behandlung Actions verarbeitet,
- Token im Klartext persistiert oder geloggt werden.

Codex soll in solchen Fällen nicht pauschal abbrechen, sondern:

1. Blocker benennen.
2. Betroffene Dateien nennen.
3. Sicherste MVP-Annahme oder Fix vorschlagen.
4. Wenn möglich, den Fix sofort ausführen.
5. Wenn nicht möglich, `CODEX_STATUS.md` und passende Review-Datei aktualisieren.

---

## 14. Abschlussbericht-Template

Jede größere Phase endet mit folgendem Format:

```txt
Phase: <name>
Goal: <goal name>
Status: pass | partial | blocked

Files created:
- ...

Files changed:
- ...

Subagent results:
- <Agent A>: pass | partial | blocked – <one-line summary>
- <Agent B>: pass | partial | blocked – <one-line summary>

Commands run:
- <command>: pass | fail | not run, reason

Gates:
- <gate>: pass | fail | blocked

Important decisions:
- ...

Known limitations:
- ...

Blockers:
- ...

Next recommended prompt:
<copyable prompt>
```

---

## 15. Offizielle Codex-Hinweise, die dieses Runbook berücksichtigt

Stand 03.05.2026. Die genaue Codex-UI kann sich ändern; Codex soll bei Abweichungen die aktuelle Slash-Command-Hilfe der eigenen Umgebung verwenden.

- `AGENTS.md`: Codex liest `AGENTS.md` vor der Arbeit. Projektinstruktionen werden von Root zur aktuellen Working Directory-Kette kombiniert; nähere Dateien haben höhere Spezifität. Die kombinierte Projektinstruktionsgröße hat standardmäßig eine Begrenzung, daher müssen lange Spezifikationen in `/docs` bleiben. Quelle: https://developers.openai.com/codex/guides/agents-md
- Best Practices: Codex arbeitet zuverlässiger mit Goal, Context, Constraints und Done-When-Kriterien. `AGENTS.md` eignet sich für wiederverwendbare Repo-Regeln. Quelle: https://developers.openai.com/codex/learn/best-practices
- Subagents: Codex startet Subagents nicht automatisch; sie müssen explizit angefordert werden. Subagents eignen sich besonders für read-heavy Exploration, Tests, Triage und Zusammenfassungen; parallele Schreibarbeit ist konfliktanfälliger. Quelle: https://developers.openai.com/codex/subagents und https://developers.openai.com/codex/concepts/subagents
- `/goal`: Der Codex-Changelog vom 30.04.2026 nennt persistente `/goal`-Workflows mit App-Server APIs, Model Tools, Runtime Continuation und TUI-Kontrollen für create, pause, resume und clear. Quelle: https://developers.openai.com/codex/changelog

---

## 16. Minimaler Startablauf für den Menschen

1. Neues Repository anlegen.
2. Quellen nach `/docs/source` kopieren.
3. Dieses Runbook nach `/docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md` kopieren.
4. Codex im Repository starten.
5. Setup-Prompt aus Abschnitt 8 ausführen.
6. MVP-0.1-Requirements-Prompt aus Abschnitt 9.1 ausführen.
7. Review-Prompt aus Abschnitt 9.2 ausführen.
8. Nur bei `ready_for_implementation: true` den Implementation-Prompt aus Abschnitt 9.3 ausführen.
9. Hardening-Prompt aus Abschnitt 9.4 ausführen.
10. Nur bei `ready_for_MVP_0.2: true` mit Abschnitt 10 weitermachen.

Die wichtigste Projektregel: Erst ausführbare Anforderungen und Tests, dann Code. Erst MVP 0.1 stabil, dann MVP 0.2 Multiplayer.
