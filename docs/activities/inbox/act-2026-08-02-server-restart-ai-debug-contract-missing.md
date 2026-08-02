---
activityId: act-2026-08-02-server-restart-ai-debug-contract-missing
status: inbox
kind: fix
area: server-ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-02
startedAt:
completedAt:
branch:
releaseTarget: current-main
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Der isolierte Serverneustart-Test zur Wiederherstellung des residenten
      Planportfolios ist grün.
- [ ] Das residente Planportfolio wird vor der ersten KI-Entscheidung nach
      dem Neustart vollständig und deterministisch wiederhergestellt.
- [ ] Die vorbereitete Entscheidung enthält den vollständigen erwarteten
      AI-Debug-Vertrag; `ai_debug_contract_missing` tritt nicht mehr auf.
- [ ] Planinstanz, zuständiger Plan/Step/Route, `PlanExecutionOrigin`,
      ActionId und Executor bleiben über den Neustart fachlich identisch; es
      entsteht keine zweite Entscheidungsautorität.
- [ ] Die Debugprojektion bleibt side-sicher und verändert keine PlayerView-,
      PublicEvent-, Replay- oder StateHash-Verträge.
- [ ] Der vollständige `@netgrid/server`-Testlauf ist grün; Server- und
      AI-Typecheck sowie `git diff --check` sind grün.

## Reproduktion

```powershell
corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "restores the resident plan portfolio before preparing an AI decision after a server restart"
```

Aktueller Befund: 1 fehlgeschlagener Test, Assertion in
`apps/server/src/multiplayer.test.ts:12684`, weil `first.ok` den Wert `false`
hat.
