# Scored Agenda Direct Effects And Run Window Sequences Process

Status: completed

Quelle/Vorgabe: Nutzerauftrag vom 2026-06-13 auf Basis des Prüfbefunds zu `engine/scored-agenda-flow-orchestrator-cleanup`.

## Zielprüfung

Die Vorgabe ist für direkte automatische Abarbeitung ausreichend präzise, aber breit. Der Prozess wird deshalb sequenziell und konservativ geschnitten. Pavit Bharat wird als enger Vertical Slice auf der vorhandenen Run-Root-Rez-Infrastruktur umgesetzt; kein allgemeines Run-/Encounter-Framework und keine KI-Wirkung werden freigeschaltet.

## Gesamtziel

`scored-agenda-flow.ts` soll nur noch Basis-Scoring, Score-Area-Mutation, Registry-Aufrufe und Ergebnisaufbau enthalten. Host-/Result-Typen wandern aus dem Orchestrator, direkte Score-Effekte laufen über eine Registry, Payload-/Surface-Grenzen werden weiter zentralisiert, und eine erste Run-Window-Registry bereitet On-Rez-/After-Last-ICE-Sequenzen vor. Pavit Bharat nutzt diesen Pfad hidden-info-sicher und ohne KI-Ausweitung.

## Annahmen

- Arbeitsbranch: `codex/engine-scored-agenda-direct-effects-run-windows`.
- Worktree: `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_DIRECT_EFFECTS_RUN_WINDOWS`.
- `main` ist der lokale Integrationsbranch.
- Bestehende Pavit-spezifische Runtime-Hilfen dürfen übernommen oder eingekapselt werden, wenn sie fachlich kompatibel und testbar sind.
- Wenn ein neuer fachlicher Runtime-Vertrag für vollständige Pavit-Produktreife fehlt, wird der Vertical Slice eng begrenzt und der Rest als Follow-up dokumentiert.

## Nicht-Ziele

- Keine produktive KI-/Planner-/Semantikänderung.
- Keine generische Run-Window-Megaarchitektur.
- Keine offiziellen Assets oder externen Kartendatenabhängigkeiten.
- Keine breiten Rename-Wellen kartennaher Module.
- Keine großen AI-Reports oder Benchmark-Artefakte.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- UI, Server, Spieler und KI reichen nur `PlayerActions` ein, die aus `LegalActions` abgeleitet sind.
- `applyAction` validiert Seite, ActionId, StateVersion, Timing, Kosten, Ziele und Choices erneut.
- Öffentliche, opponent- und replayfähige Payloads dürfen keine Hidden-Card-Listen oder actor-private Labels enthalten.
- Pavit-HQ-Auswahl bleibt actor-private; öffentliche Payloads enthalten nur Counts, ServerId und SourceDefinitionId.

## Automatische Fehlerbehandlung

Bei roten Tests wird innerhalb des aktiven Pakets debuggt. Kein Folgepaket startet, solange das aktuelle Done-Gate nicht erfüllt ist. Wenn Pavit oder Run-Window-Timing einen nicht vorhandenen fachlichen Runtime-Vertrag benötigt, wird ein Blocker mit Removal Condition dokumentiert statt ein unsicherer Workaround gebaut.

## Paketfolge

- P0: Prozessartefakt, Worktree-Basis und Preflight.
- P1: `ScoredAgendaFlowHost`, `ScoredAgendaFlowResult` und Payload-Typ in ein Host-Modul verschieben.
- P2: Direct-Effect-Registry für sofortige Score-Effekte einführen.
- P3: Fixed-Bonus, Economy, Counter und Overadvance in Direct-Effect-Resolver verschieben.
- P4: Corporate War und Corporate Retreat an Direct-Effect-Registry hängen.
- P5: `applySimpleScoreEffects` aus `scored-agenda-flow.ts` entfernen.
- P6: SequenceResolution/PayloadPatch in bestehenden Scored-Agenda-Sequenzen verpflichtender nutzen.
- P7: SurfacePolicy um erlaubnisbasierte Payload-Familien erweitern.
- P8: Run-/Encounter-Window-Registry vorbereiten.
- P9: Pavit Bharat als `ordered_fort_rebuild_sequence` Vertical Slice anbinden.
- P10: Contract-Matrix auf DirectEffect-, FlowChoice-, ScoreTime- und RunWindow-Resolver erweitern; finaler Testblock.

## Verifikationsregeln

Je Paket mindestens:

- gezielte Engine-Tests für betroffene Module,
- `git diff --check`,
- Paketcommit mit klarer Message.

Final:

- `corepack pnpm --filter @netgrid/engine typecheck`
- gezielte Engine-Testmatrix für Scored-Agenda, Run-Rez-/Run-Window-, View-/Surface- und Pavit-Verträge
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

## Abschlusskriterien

- `scored-agenda-flow.ts` enthält keine konkreten Karten-/Mechanikzweige außer Basis-Scoring.
- Alle bearbeiteten Score-Time-, Direct-Effect- und Flow-Choice-Pfade laufen über Registry.
- Fachmodule importieren nicht aus `scored-agenda-flow.ts`.
- Public/opponent/replay surfaces laufen über SurfacePolicy.
- Pavit Bharat nutzt Engine-Legalität und hidden-info-sichere HQ-Auswahl.
- Keine neue KI-Wirkung, keine Legalität außerhalb der Engine und keine Hidden-Info-Leaks.

## Abschluss 2026-06-13

- `ScoredAgendaFlowHost`/Result/Payload liegen in einem eigenen Host-Modul.
- Sofortige Score-Effekte laufen über `SCORED_AGENDA_DIRECT_EFFECT_RESOLVERS`; der alte Simple-Effect-Wrapper ist entfernt.
- Scored-Agenda-Payload-Patches laufen zentral über `applySequencePayloadPatch`.
- SurfacePolicy unterscheidet Payload-Familien für Scored-Agenda-Sequenzen, Hidden-Zone-Choices, Access Events, Public Reveal, AI Debug und Replay.
- Run-Window-Action-Builder sind in `RUN_WINDOW_ACTION_RESOLVERS` registriert.
- Pavit Bharat nutzt für seine öffentliche Runtime-Payload den generischen `ordered_fort_rebuild_sequence`-Vertrag; HQ-Auswahl bleibt hidden-info-sicher.
- Contract-Tests prüfen DirectEffect-, FlowChoice-, ScoreTime- und RunWindow-Resolver.

Finale Gates:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda/direct-score-effects.test.ts src/game/corp/scored-agenda/sequence-contract.test.ts src/game/corp/scored-agenda/priority-requisition-sequence.test.ts src/game/corp/scored-agenda/ordered-fort-rebuild-sequence.test.ts src/game/view/surface-policy.test.ts src/game/view/surface-sanitizer.test.ts src/game/run/run-rez-window.test.ts src/game/run/fort-pass-window.test.ts src/game/run/run-window-registry.test.ts src/index-tests/proteus/rule-contract-baseline-utilities.test.ts`
- `corepack pnpm check:ai` mit bestehenden Warnungen, ohne Fehler
- `corepack pnpm format:changed -- main`
- `git diff --check`
