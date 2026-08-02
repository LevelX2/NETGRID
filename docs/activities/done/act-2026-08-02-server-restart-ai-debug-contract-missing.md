---
activityId: act-2026-08-02-server-restart-ai-debug-contract-missing
status: done
kind: fix
area: server-ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-02
startedAt: 2026-08-02
completedAt: 2026-08-02
branch: codex/activities-worktree-20260802-182521
releaseTarget: current-main
blockedBy: []
resultArtifacts:
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - packages/shared/src/index.ts
  - packages/shared/src/index.test.ts
  - docs/architecture/ai/README.md
checks:
  - focused restart and shared sanitizer tests
  - full server test suite
  - server, shared and AI typechecks
  - AI structure, card-ID and package-boundary gates
  - format and diff checks
---

# AI-Neustart: vollständigen Debug-Vertrag nach Wiederherstellung des residenten Planportfolios liefern

## Ziel

Nach einem Serverneustart muss das persistierte residente Planportfolio vor
der nächsten KI-Entscheidung wiederhergestellt werden. Die vorbereitete
Entscheidung muss anschließend denselben vollständigen und side-sicheren
AI-Debug-Vertrag liefern wie eine Entscheidung ohne Neustart.

## Kontext und Quellen

- Der vollständige Serverlauf im Abschluss der Corp-Draw-Transaktionen
  erreichte 216 von 217 Tests. Nur der Test zur Wiederherstellung des
  residenten Planportfolios vor der ersten KI-Entscheidung nach einem
  Serverneustart schlug fehl.
- Der Test liegt in `apps/server/src/multiplayer.test.ts:12631`; die erste
  vorbereitete Entscheidung nach Wiederöffnung des Servers liefert
  `ok: false` statt `ok: true`.
- Der isolierte Lauf auf dem unveränderten lokalen `main`-Stand `2b14ee427`
  reproduziert den Fehler am 02.08.2026 mit 1 fehlgeschlagenen und 148
  übersprungenen Tests. Der dokumentierte Fehlercode ist
  `ai_debug_contract_missing`.
- Review-Evidence:
  `docs/reviews/engine/corp-draw-transactions-final-review-2026-08-02.md`.
- Der Fehler ist unabhängig von Corp-Draw-Transaktionen, Strategic Planning
  Group, PlayerViews und deren Reconnect-Choice.

## Scope

- Den isolierten Neustarttest auf aktuellem `main` reproduzieren und den
  Ablauf Persistenz -> Serverneustart -> Match-Rehydrierung -> residentes
  Planportfolio -> vorbereitete KI-Entscheidung nachverfolgen.
- Bestimmen, ob Planportfolio, `PlanExecutionOrigin`, Decision-Debug-Daten
  oder deren Server-Projektion beim Wiederherstellen fehlen beziehungsweise
  in der falschen Reihenfolge aufgebaut werden.
- Den zuständigen bestehenden Owner und die Wiederherstellungsgrenze
  korrigieren, ohne eine zweite Plan-, Fallback- oder Debug-Autorität
  einzuführen.
- Einen fokussierten Regressionstest für die vollständige erste Entscheidung
  nach dem Neustart sichern und danach den vollständigen Serverlauf ausführen.
- Vor jedem Codepatch den verbindlichen KI-Architektur-Preflight aus
  `AGENTS.md` vollständig durchführen, weil residentes Planportfolio und
  Entscheidungsvorbereitung betroffen sind.

## Nicht im Scope

- Keine Änderung an Corp-Draw-Transaktionen, SPG-Choices oder Corporate
  Shuffle.
- Kein breiter Umbau des KI-Planers, keine neue Resolver-, Override- oder
  Fallbacklogik.
- Kein Abschwächen des fail-closed AI-Debug-Vertrags und kein Ersetzen
  fehlender strukturierter Daten durch erfundene oder UI-seitig abgeleitete
  Debugwerte.
- Keine Ausweitung privilegierter Debugdaten auf PlayerViews, öffentliche
  Events, Replays, WebSocket-Payloads oder Logs.

## Akzeptanzkriterien

- [x] Der isolierte Serverneustart-Test zur Wiederherstellung des residenten
      Planportfolios ist grün.
- [x] Das residente Planportfolio wird vor der ersten KI-Entscheidung nach
      dem Neustart vollständig und deterministisch wiederhergestellt.
- [x] Die vorbereitete Entscheidung enthält den vollständigen erwarteten
      AI-Debug-Vertrag; `ai_debug_contract_missing` tritt nicht mehr auf.
- [x] Planinstanz, zuständiger Plan/Step/Route, `PlanExecutionOrigin`,
      ActionId und Executor bleiben über den Neustart fachlich identisch; es
      entsteht keine zweite Entscheidungsautorität.
- [x] Die Debugprojektion bleibt side-sicher und verändert keine PlayerView-,
      PublicEvent-, Replay- oder StateHash-Verträge.
- [x] Der vollständige `@netgrid/server`-Testlauf ist grün; Server- und
      AI-Typecheck sowie `git diff --check` sind grün.

## Ergebnis

Der TurnPlanner erzeugte bereits den vollständigen Plan-first-Debugvertrag,
doch der gemeinsame side-sichere Sanitizer kannte das im Typvertrag reguläre
optionale Head-Feld `executorPlanInstanceId` noch nicht und verwarf deshalb
die gesamte Projektion. Die Allowlist und der Shared-Vertragstest führen das
Feld nun typisiert; unbekannte Felder bleiben fail-closed.

Die Servergrenze erkennt außerdem ein fehlendes prozesslokales Portfolio als
Neustart. Sie stellt die persistenten Planinstanzen wieder her, entfernt aber
das alte `TurnPlanCommitment` und die Execution Lease, sodass aus der
aktuellen StateVersion frisch geplant wird. Der Regressionstest vergleicht
vor und nach dem Neustart Root-Plan, Leaf-Executor, Planinstanz, Step, Route
und Action-ID und weist gleichzeitig die entfernte alte Commitment-/Lease-
Bindung nach. Es entsteht keine zweite Auswahl- oder Debugautorität.

## Reproduktion

```powershell
corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "restores the resident plan portfolio before preparing an AI decision after a server restart"
```

Aktueller Befund: 1 fehlgeschlagener Test, Assertion in
`apps/server/src/multiplayer.test.ts:12684`, weil `first.ok` den Wert `false`
hat.
