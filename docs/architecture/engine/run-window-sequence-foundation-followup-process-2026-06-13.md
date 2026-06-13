# Run Window Sequence Foundation Follow-up Process

Status: in_progress

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-13 auf Basis des Statusberichts zu Paketcommit `f3d11ce5a409d984b78c38f6d066f56ed9e74492`.

## Zielprüfung

Die Vorgabe ist grundsätzlich präzise, aber teilweise durch den aktuellen `main`-Stand überholt. `ScoredAgendaFlowHost`, Direct-Effect-Registry, zentrale Scored-Agenda-Payload-Patches, Surface-Payload-Familien, Run-Window-Registry und Pavit-Basis-Slice existieren bereits. Dieser Folgeprozess wiederholt diese abgeschlossenen Schnitte nicht, sondern setzt die noch sinnvollen Restpakete konservativ um.

## Gesamtziel

Die Run-/On-Rez-Sequenzarchitektur soll die nächste explizite Schicht erhalten: eine eigene `run_window_sequence`-Surface-Familie, ein kleines `game/run/windows`-Fundament mit Host- und After-Last-ICE-Timingvertrag, stärkere Pavit-Bharat-Regressionen für Stale Choice, No-Partial-Mutation und Hidden-Info-Sicherheit sowie erweiterte Contract-Tests für RunWindow-/OnRez-Sequenzen.

## Annahmen

- Arbeitsbranch: `codex/engine-run-window-sequence-foundation-followup`.
- Worktree: `C:\Projekte\NETGRID_ENGINE_RUN_WINDOW_SEQUENCE_FOUNDATION_FOLLOWUP`.
- `main` ist lokaler Integrationsbranch.
- Der bestehende Pavit-Runtime-Pfad bleibt fachlich führend; dieser Prozess härtet und strukturiert ihn, ohne eine generische Run-DSL einzuführen.
- Bereits erledigte Scored-Agenda-Basisschritte bleiben unverändert, außer ein Test oder Typfehler erzwingt eine kleine Anpassung.

## Nicht-Ziele

- Keine KI-Wirkung, keine Planner-Gewichtung, keine AI-Freigabe.
- Keine breite Run-/Encounter-Megaarchitektur.
- Keine erneute Migration bereits erledigter Scored-Agenda-Registries.
- Keine Umbenennungswelle bestehender Mechanikmodule.
- Keine offiziellen Assets oder externen Kartendaten-Abhängigkeiten.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- UI, Server, Spieler und KI reichen nur `PlayerActions` ein, die aus `LegalActions` abgeleitet sind.
- `applyAction` validiert Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices erneut.
- Pavit-HQ-Auswahl bleibt actor-private; Public/Opponent/Replay-Payloads enthalten keine HQ-Card-IDs.
- Run-Window- und On-Rez-Sequenzen dürfen keine Legalität außerhalb der Engine erzeugen.

## Automatische Fehlerbehandlung

Rote Tests werden im aktiven Paket analysiert und behoben. Wenn ein Paket einen neuen fachlichen Runtime-Vertrag bräuchte, der nicht aus dem aktuellen Bestand ableitbar ist, wird ein Blocker mit Removal Condition dokumentiert statt ein unsicherer Workaround gebaut.

## Paketfolge

- P0: Prozessartefakt, Worktree-Basis und Preflight.
- P1: SurfacePolicy um `run_window_sequence` und `developer_trace`-Payload-Familien ergänzen.
- P2: `game/run/windows`-Fundament mit `RunWindowHost` und `after-passing-last-ice-window` einführen.
- P3: Pavit Bharat Ordered-Fort-Rebuild um Stale-Choice-, No-Partial-Mutation- und Leak-Regressionen härten.
- P4: Contract-Matrix auf RunWindow-/OnRez-Sequenzen erweitern.
- P5: Finalen Testblock ausführen, rote Tests beheben, lokal nach `main` integrieren.

## Verifikationsregeln

Je Paket:

- gezielte Engine-Tests für betroffene Module,
- `git diff --check`,
- Paketcommit mit klarer Message.

Final:

- `corepack pnpm --filter @netgrid/engine typecheck`
- gezielte Engine-Testmatrix für SurfacePolicy, RunWindow, Pavit und Contract-Matrix
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

## Abschlusskriterien

- `PayloadFamily` enthält eine explizite `run_window_sequence`-Familie.
- Run-Window-Timing für "after passing last ICE" ist als eigenes Modul testbar.
- Pavit Bharat hat Regressionen für falsche/stale Choice, No-Partial-Mutation und Public-Payload-Redaction.
- Contract-Tests decken RunWindow-/OnRez-Resolver oder Sequenzverträge explizit ab.
- Der abgeschlossene Arbeitsbranch ist lokal nach `main` integriert und der Worktree entfernt.
