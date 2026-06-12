# Scored Agenda Flow Registry Surface Policy Process 2026-06-13

## Status

`in_progress`

## Paketfortschritt

- P0 abgeschlossen: Prozessartefakt, Worktree und Zielabgrenzung.
- P1 abgeschlossen: `scored-agenda-score-time-types.ts` und `scored-agenda-score-time-registry.ts` definieren den Score-Time-Start-Vertrag und registrieren DFR, Ice Transmutation, Priority Requisition und Security Purge. Registry-Test, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P2 abgeschlossen: `startScoreTimeChoices` delegiert DFR, Ice Transmutation, Priority Requisition und Security Purge über `resolveScoredAgendaScoreTime`; die restlichen direkten Score-Starts bleiben unverändert. Scored-Agenda-/Install-Rez-Tests, Engine-Typecheck, Format- und Whitespace-Gates sind grün.

## Quelle/Vorgabe

Eingefügter Statusbericht vom 2026-06-13 zum remote sichtbaren Stand `20a996fc2dc6e49a682a9fba7a65e6ca1ab5486c` und Folgeauftrag `engine/scored-agenda-flow-registry-and-surface-policy`.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Sie benennt Zielmodule, Reihenfolge, Akzeptanzkriterien und Sicherheitsgrenzen. Kleine Unschärfen werden konservativ behandelt: direkte Effektmodule werden nur als Move/Delegation umgesetzt, Pavit Bharat wird in diesem Prozess nicht produktiv aktiviert, und Surface-Policy wird an mindestens einer realen Projektionsgrenze verbindlich gemacht.

## Gesamtziel

`scored-agenda-flow.ts` wird weiter entlastet: Score-Time-Starts laufen über eine Registry, direkte Score-Effekte werden in fachliche Module ausgelagert, SequenceResolution/Payload-Patch-Grenzen werden vorbereitet, und `surface-policy.ts` wird an einer echten öffentlichen Event-Projektion genutzt. Tests sichern Source-Routing, Hidden-Info-Grenzen und keine durch Änderungen verursachten roten Tests.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Umsetzung läuft im Worktree `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_FLOW_REGISTRY_SURFACE_POLICY` auf Branch `codex/engine-scored-agenda-flow-registry-surface-policy`.
- Keine neuen AI-Artefakte, keine produktive KI-Wirkung, keine Kartenfreischaltung.
- Pavit Bharat bleibt nur über den bestehenden Ordered-Fort-Rebuild-Vertrag vorbereitet.
- Große AI-Benchmark-JSONs bleiben außerhalb dieses Engine-Refactor-Prozesses.

## Nicht-Ziele

- Keine neue Sequenz-DSL.
- Keine Änderung der Rules-Engine-Autorität.
- Keine Änderung von LegalAction-Erzeugung außerhalb bestehender Engine-Pfade.
- Keine produktive Runtime-Aktivierung von Ordered-Fort-Rebuild/Pavit Bharat.
- Keine breiten View-/Replay-Umbauten, wenn ein kleiner PublicEvent-Anker reicht.

## Controller-Invarianten

- Engine-Korrektheit zuerst.
- PlayerActions bleiben aus LegalActions abgeleitet.
- `applyAction` revalidiert Timing, Seite, Kosten, Targets und Choices.
- Keine verdeckten Kartendaten in PublicEvents, PlayerViews, Replays, Logs oder KI-Inputs.
- Deterministisches Replay und StateHash bleiben unverändert.

## Automatische Fehlerbehandlung

- Rote Tests werden paketlokal analysiert und behoben.
- Wenn ein Move Verhalten ändert, wird der Move zurückgeschnitten oder durch gezielte Tests abgesichert.
- Wenn ein Surface-Policy-Anker bestehende legitime PublicPayloads blockiert, wird nur der betroffene Contract geschärft, nicht pauschal abgeschwächt.

## Sicherheitsblocker

- Hidden-Info-Leak durch PublicEvent-/Opponent-/Replay-Payloads.
- Runtime-Aktivierung eines bisher nur vorbereiteten Vertrags ohne Tests.
- Neue Legalität außerhalb der Rules Engine.
- Nicht deterministische State-Mutation in Score- oder Choice-Pfaden.

## State Machine

`preflight -> score_time_registry -> score_start_migration -> direct_effect_moves -> resolution_boundary -> surface_anchor -> contract_matrix -> final_verify -> main_merge -> complete`

## Paketfolge

- `P0_PROCESS_AND_WORKTREE`
- `P1_SCORE_TIME_TYPES_REGISTRY`
- `P2_SCORE_TIME_STARTS_TO_REGISTRY`
- `P3_SUBTYPE_REVEAL_MODULE`
- `P4_DIRECT_SCORE_EFFECT_MODULES`
- `P5_SEQUENCE_RESOLUTION_BOUNDARY`
- `P6_PUBLIC_EVENT_SURFACE_POLICY`
- `P7_SCORE_TIME_CONTRACT_MATRIX`
- `P8_FINAL_VERIFY_AND_MERGE`

## Paketdetails

### P0 Prozess und Worktree

Ziel: Prozess verbindlich dokumentieren und Arbeitsumgebung herstellen.

Checks:

- `git status --short --branch`
- `corepack pnpm install`
- `git diff --check`

Done-Gate: Prozessartefakt committed, Worktree arbeitsbereit.

Commit: `docs(engine): define scored agenda flow registry surface process`

### P1 Score-Time-Typen und Registry

Ziel: Score-Time-Start-Vertrag aus `scored-agenda-flow.ts` herausheben.

Arbeit:

- Neues Modul `scored-agenda-score-time-types.ts`.
- Neues Modul `scored-agenda-score-time-registry.ts`.
- Registry testet eindeutige Resolver-IDs und kind-basiertes Matching.
- Noch keine Runtime-Migration außer optionaler No-op-Registry-Verwendung.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda/scored-agenda-score-time-registry.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Registry existiert und ist getestet.

Commit: `refactor(engine): add scored agenda score time registry`

### P2 Score-Time-Starts an Registry anschließen

Ziel: `startScoreTimeChoices` delegiert Score-Time-Starts über Registry.

Arbeit:

- Ice Transmutation, DFR, Priority Requisition und Security Purge über Registry-Resolver anbinden.
- `startScoreTimeChoices` wird zur Registry-Delegation.
- Verhaltenstests für betroffene Score-Starts laufen unverändert.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Start-Registry ist Runtime-Pfad für die genannten Score-Time-Starts.

Commit: `refactor(engine): route scored agenda score starts through registry`

### P3 Subtype-Reveal-Economy-Modul

Ziel: `reveal_installed_ice_subtype_for_credits` aus dem Flow-Monolithen lösen.

Arbeit:

- Neues Modul `subtype-reveal-economy-sequence.ts`.
- Start und Resolve der Subtype-Reveal-Choice in das Modul verschieben.
- Flow delegiert Choice-Handling und Score-Start über Registry/Modul.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts -t "Superior Net Barriers|Encryption Breakthrough"`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda/subtype-reveal-economy-sequence.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Subtype-Reveal-Code liegt außerhalb von `scored-agenda-flow.ts`.

Commit: `refactor(engine): move subtype reveal economy sequence`

### P4 Direkte Score-Effektmodule

Ziel: konkrete direkte Score-Effekte aus `applySimpleScoreEffects` lösen.

Arbeit:

- `corporate-war-sequence.ts`
- `corporate-retreat-sequence.ts`
- `employee-empowerment-sequence.ts`
- Corporate Downsizing bleibt als vorhandener Choice-Start angebunden; falls ohne großen Scope möglich, kleines Start-Modul.
- Keine neue Logik, nur Move/Delegation und Tests.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Flow enthält keine kartenspezifischen Corporate-War/Retreat/Employee-Empowerment-Implementierungsfunktionen mehr.

Commit: `refactor(engine): move direct scored agenda effects`

### P5 SequenceResolution Boundary

Ziel: bestehendes Payload-Patch-Modell enger an Resolution-Verträge anbinden.

Arbeit:

- `SequenceResolution` so erweitern oder ergänzen, dass stateChanged/payloadPatch/result zentral testbar sind.
- Mindestens ein bestehender Sequenzpfad nutzt den Boundary-Helper ohne Verhalten zu ändern.
- Tests für atomare Payload-Anwendung und Redaction.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda/sequence-contract.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Boundary ist nutzbar und getestet, ohne breite Migration zu erzwingen.

Commit: `refactor(engine): strengthen sequence resolution boundary`

### P6 PublicEvent Surface-Policy

Ziel: `surface-policy.ts` an einer echten PublicEvent-Grenze nutzen.

Arbeit:

- `toPublicEvent`/`toPublicEventForSide` sanitizen `publicPayload` mit `SurfaceKind`.
- Bestehende side-private Projektion bleibt erhalten, aber läuft durch passende Surface-Policy.
- Tests decken Hidden-Card-Listen und actor-private Labels in PublicEvent/Replayed-Public-Kontext ab.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/public-event-view.test.ts src/game/view/surface-policy.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: SurfacePolicy schützt eine echte öffentliche Event-Projektion.

Commit: `refactor(engine): enforce surface policy on public events`

### P7 Score-Time-Contract-Matrix

Ziel: Matrix um Score-Time-Resolver erweitern.

Arbeit:

- `sequence-contract.test.ts` oder neue Matrix testet Score-Time-Resolver-Kinds, Source-/Start-Disjointness und No-Hidden-Payloads.
- Keine Duplizierung großer Host-Doubles.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda src/game/view`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Start- und Resolve-Verträge sind matrixartig geschützt.

Commit: `test(engine): extend scored agenda sequence contract matrix`

### P8 Final Verify und Merge

Ziel: Gesamtprozess abschließen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda src/game/view`
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Keine durch diesen Prozess verursachten roten Tests. Branch ist lokal nach `main` integriert, Worktree entfernt, Goal complete.

Commit: `test(engine): verify scored agenda flow registry surface policy`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Keine `test.skip`-Einführung.
- Keine produktive KI-/Kartenfreischaltung.
- Keine großen AI-Report-Artefakte in diesem Prozess.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_FLOW_REGISTRY_SURFACE_POLICY`.
- Arbeitsbranch: `codex/engine-scored-agenda-flow-registry-surface-policy`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push in diesem Prozess.

## Controller-Prompt-Kern

`/Goal Arbeite engine/scored-agenda-flow-registry-and-surface-policy vollständig und sequenziell von P0 bis P8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_FLOW_REGISTRY_SURFACE_POLICY auf Branch codex/engine-scored-agenda-flow-registry-surface-policy. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Score-Time-Starts sind registry-basiert.
- `scored-agenda-flow.ts` ist sichtbar kleiner und enthält weniger konkrete Kartenmechanik.
- Subtype-Reveal-Economy und direkte Score-Effekte sind fachlich gekapselt.
- SequenceResolution/Payload-Patch-Grenzen sind testbar vorbereitet.
- SurfacePolicy schützt mindestens eine echte PublicEvent-Projektion.
- Relevante Engine- und AI-Checks sind grün oder ehrlich dokumentiert.
