# Engine Sequence Host Registry Policy Process 2026-06-12

## Status

`in_progress`

## Paketfortschritt

- P0 abgeschlossen mit Commit `916659ef`: Prozessartefakt, Worktree und Preflight.
- P1 abgeschlossen: `scored-agenda-sequence-host.ts` enthält Host-, Result- und Payload-Typen. `install-rez-sequence-handlers.ts` re-exportiert die Typen stabil, während DFR, Security Purge und Priority Requisition direkt aus dem neuen Host-Typmodul importieren. P1-Tests, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P2 abgeschlossen: `priority-requisition-sequence.test.ts` prüft neben Source-Routing nun actor-private/public option labels und den Free-Rez-Payload-Vertrag mit `rezCostPaid: 0` ohne Credit-Abzug. Modul- und Integrationstest für Priority Requisition, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P3 abgeschlossen: `scored-agenda-sequence-registry.ts` registriert Priority Requisition, DFR-Install, DFR-Rez und Security-Purge-Target als Choice-Resolver mit eindeutigen IDs. Der Dispatcher ruft nur noch `resolveScoredAgendaSequenceChoice` auf. Registry-/Sequenztests, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P4 abgeschlossen: `surface-policy.ts` unterscheidet `actor_private`, `opponent_view`, `public_event`, `replay_public` und `developer_trace`. `surface-sanitizer.ts` bleibt als Kompatibilitäts-Re-Export erhalten. Policy-Tests decken actor-private Erlaubnis sowie Public-/Opponent-/Replay-Blockaden für Hidden-Card-Listen und private Labels ab. Tests, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P5 abgeschlossen: `scored-agenda-sequence-types.ts` enthält `SequencePayloadPatch`, `SequenceDeveloperTrace`, `SequenceResolution` und `applySequencePayloadPatch`. DFR und Security Purge nutzen den Patch-Helper exemplarisch an repräsentativen Payload-Pfaden. Sequenztests, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P6 abgeschlossen: Data Fort Reclamation definiert `DataFortReclamationStep` und nutzt interne Step-Konstanten für HQ-Auswahl, Install-Batch, optionalen Rez-Batch und Credit-Rückgabe. Die aktuelle Batch-UX bleibt unverändert. DFR-Integrationstest, DFR-Modultest, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P7 abgeschlossen: Security Purge definiert `SecurityPurgeStep` und nutzt interne Step-Konstanten für Top-R&D-Reveal, TargetChoice, Install/Rez, Trash und Complete. Verhalten und Payload-Felder bleiben unverändert. Security-Purge-Integrationstest, Modultest, Engine-Typecheck, Format- und Whitespace-Gates sind grün.

## Quelle/Vorgabe

Eingefügter Statusbericht vom 2026-06-12 nach dem Merge `4292dc5c0c08f614c100b14a65db12f6e72f509d` mit Folgeempfehlungen zur Engine-Codeoptimierung.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Sie benennt konkrete Folgeschritte, betroffene Module, Akzeptanzkriterien und Sicherheitsgrenzen.

Konservative Annahmen:

- Dieser Prozess ist ein Engine-Strukturprozess. Er erweitert keine produktive KI-Entscheidung und schaltet keine neue Karte produktiv frei.
- Pavit Bharat wird nur als Sequenzvertrag-/Pilotstruktur vorbereitet, nicht als spielbare Promotion.
- Große DSLs bleiben out-of-scope; erlaubt sind kleine Registry-, Host-, Policy-, Step- und Vertragsmodule.
- Wo ein Paket fachlich zu groß wird, wird es in einen kleineren, verifizierbaren Strukturteil reduziert und der Rest als Folgepunkt dokumentiert.

## Gesamtziel

Die neu angelegten scored-agenda Sequenzmodule werden weiter entkoppelt: Host-/Result-Typen wandern aus dem Dispatcher, Choice-Resolver werden registrierbar, Surface-Grenzen werden expliziter, DFR/Security Purge erhalten bessere interne Step-Grenzen, Scored-Agenda-Flow wird um Ice-Transmutation entlastet und eine wiederverwendbare Sequenzvertragsmatrix entsteht.

## Nicht-Ziele

- Keine produktive KI-Änderung.
- Keine LegalAction-Erzeugung außerhalb der Engine.
- Keine Pavit-Bharat-Kartenfreischaltung.
- Keine neue interaktive Data-Fort-Reclamation-UX.
- Keine breite Mechanik-DSL.
- Kein Push oder PR aus diesem Prozess.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jedes abgeschlossene Paket bekommt einen eigenen Commit.
- Die Rules Engine bleibt einzige Regelautorität.
- Public-/Opponent-Surfaces dürfen keine Hidden-Zone-CardInstance-Listen oder actor-private Labels enthalten.
- Refactors erhalten bestehendes Verhalten von Data Fort Reclamation, Security Purge, Priority Requisition und Ice Transmutation.
- Tests dürfen ergänzt oder verschoben werden, aber nicht stillschweigend abgeschwächt werden.

## Automatische Fehlerbehandlung

- Rote Tests werden zuerst auf den aktuellen Paketdiff zurückgeführt.
- Wenn ein Strukturmove zu breit wird, wird zuerst ein kleiner, typ- oder registry-sicherer Zwischenschritt abgeschlossen.
- Wenn eine Surface-Policy-Regel bestehende öffentliche Vertragsfelder fälschlich blockiert, wird die Regel enger gefasst statt produktive Payloads umzubenennen.
- Wenn Pavit Bharat produktive Runtime-Verträge verlangen würde, bleibt das Paket bei Vertrags-/Pilotstruktur und dokumentiert die Removal Condition.

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn:

- Hidden-Zone-CardInstance-Listen in PublicEvents, PlayerViews, Replays, KI-Inputs oder Logs geraten;
- ein Sequenzmodul Legalität außerhalb von LegalActions/applyAction definiert;
- DFR, Security Purge, Priority Requisition oder Ice Transmutation ihr Verhalten ändern;
- Replay-/StateHash-/Randomness-Verträge verändert werden;
- Pavit Bharat produktiv freigeschaltet werden müsste, um ein Paket abzuschließen.

## State Machine

- `P0_PROCESS_ARTIFACT`
- `P1_SEQUENCE_HOST_TYPES`
- `P2_PRIORITY_REQUISITION_HARDENING`
- `P3_SCORED_AGENDA_SEQUENCE_REGISTRY`
- `P4_SURFACE_POLICY`
- `P5_SEQUENCE_RESOLUTION_BOUNDARY`
- `P6_DFR_STEP_MODEL_PREP`
- `P7_SECURITY_PURGE_STEP_MODEL_PREP`
- `P8_ICE_TRANSMUTATION_MODULE`
- `P9_ORDERED_FORT_REBUILD_PILOT`
- `P10_SEQUENCE_CONTRACT_MATRIX`
- `P11_FINAL_VERIFY_AND_MERGE`

## Paketfolge

1. P0 Prozessartefakt und Worktree-Preflight.
2. P1 Host-/Result-Typen aus `install-rez-sequence-handlers.ts` lösen.
3. P2 Priority Requisition als eigenständiges Modul prüfen und härten.
4. P3 Minimale `ScoredAgendaSequenceRegistry` für Choice-Resolver einführen.
5. P4 `surface-sanitizer.ts` zu expliziter `surface-policy.ts` ausbauen.
6. P5 Sequenz-Result und Payload-Patch-Grenze vorbereiten.
7. P6 Data Fort Reclamation intern step-orientiert benennen.
8. P7 Security Purge intern step-orientiert benennen.
9. P8 Ice Transmutation aus `scored-agenda-flow.ts` in ein eigenes Modul verschieben.
10. P9 `ordered_fort_rebuild_sequence` als Pavit-Bharat-Pilotvertrag vorbereiten.
11. P10 Sequenzvertragsmatrix für scored-agenda/hidden-zone Sequenzen ergänzen.
12. P11 final verifizieren und lokal nach `main` integrieren.

## Paketdetails

### P0 Prozessartefakt und Preflight

Ziel: Prozess kontrolliert starten.

Arbeit:

- Worktree `C:\Projekte\NETGRID_ENGINE_SEQUENCE_HOST_REGISTRY_POLICY` auf Branch `codex/engine-sequence-host-registry-policy` anlegen.
- Prozessartefakt erstellen.
- Ausgangsstand mit schnellen Engine-Checks prüfen.

Checks:

- `git status --short --branch`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Worktree, Prozess und Ausgangschecks sind bereit.

Commit: `docs(engine): define sequence host registry policy process`

### P1 Sequence Host Types

Ziel: Fachmodule importieren keine Typen mehr aus dem Dispatcher.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/scored-agenda-sequence-host.ts`.
- `SequencePayload`, `CorpInstallRezSequenceHandlerHost` und `CorpInstallRezSequenceHandlerResult` dorthin verschieben.
- Alte Exporte im Dispatcher stabil halten.
- Imports in DFR, Security Purge, Priority Requisition und Dispatcher aktualisieren.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Scored-agenda Fachmodule importieren keine Typen mehr aus `install-rez-sequence-handlers.ts`.

Commit: `refactor(engine): extract scored agenda sequence host types`

### P2 Priority Requisition Hardening

Ziel: Priority Requisition erhält dieselbe Modulqualität wie DFR und Security Purge.

Arbeit:

- Contract-/Authority-/Visibility-Kommentar prüfen und bei Bedarf präzisieren.
- No-cost/waived-rez-Payload-Vertrag explizit stabilisieren.
- Modultest um kostenlose Rez-Kosten-/Visibility-Grenze ergänzen, ohne Integrationstest zu duplizieren.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda/priority-requisition-sequence.test.ts src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Priority Requisition"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Priority Requisition ist als eigenes Modul fachlich gleichwertig abgesichert.

Commit: `test(engine): harden priority requisition sequence`

### P3 Scored Agenda Sequence Registry

Ziel: Dispatcher wächst nicht weiter als `if`-Kette.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/scored-agenda-sequence-registry.ts`.
- Kleine Resolver-Definition mit `id`, `matches`, `resolve`.
- DFR-Install, DFR-Rez, Security-Purge-Target und Priority-Requisition registrieren.
- Dispatcher nutzt Registry.
- Tests prüfen eindeutige IDs und Routing.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Dispatcher delegiert über Registry; Source-Matcher bleiben verhaltensgleich.

Commit: `refactor(engine): add scored agenda sequence registry`

### P4 Surface Policy

Ziel: Sichtflächen werden explizit unterschieden.

Arbeit:

- Neues oder erweitertes Modul `packages/engine/src/game/view/surface-policy.ts`.
- `SurfaceKind` für `actor_private`, `opponent_view`, `public_event`, `replay_public`, `developer_trace`.
- Sanitizer/Assertions für Hidden-Card-Listen und actor-private Labels.
- Bestehende `surface-sanitizer.ts` kompatibel weiterführen oder als dünnen Re-Export nutzen.
- Tests für erlaubte actor-private und blockierte public/opponent/replay Flächen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/surface-sanitizer.test.ts src/game/view/surface-policy.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Surface-Regeln sind nach Oberfläche unterscheidbar und testbar.

Commit: `refactor(engine): add public surface policy`

### P5 Sequence Resolution Boundary

Ziel: Resolver-Ergebnis, public payload patch und developer trace werden als Typgrenze vorbereitet.

Arbeit:

- `SequenceResolution`/`SequencePayloadPatch`/`SequenceDeveloperTrace` in scored-agenda Typmodul ergänzen.
- Helper zum Anwenden eines public-safe Payload-Patches auf `legalAction.payload`.
- DFR und Security Purge nutzen den Helper an mindestens einem repräsentativen Payload-Pfad.
- Kein vollständiger Umbau aller Resolver in diesem Paket.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Typgrenze existiert und ist exemplarisch genutzt, ohne Runtime-Verhalten zu ändern.

Commit: `refactor(engine): add sequence resolution boundary`

### P6 DFR Step Model Prep

Ziel: Data Fort Reclamation intern auf spätere Step-Machine vorbereiten.

Arbeit:

- `DataFortReclamationStep` Typ ergänzen.
- Interne Helfer und Context-Step-Strings an den fachlichen Steps ausrichten.
- Bestehender Batch-Pfad bleibt erhalten.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Data Fort Reclamation" src/game/corp/scored-agenda/data-fort-reclamation-sequence.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: DFR ist step-benannt, aber nicht interaktiv erweitert.

Commit: `refactor(engine): prepare data fort reclamation steps`

### P7 Security Purge Step Model Prep

Ziel: Security Purge wird als zweite Referenzsequenz step-orientiert benannt.

Arbeit:

- `SecurityPurgeStep` Typ ergänzen.
- Reveal, TargetChoice, Install/Rez/Trash und Complete intern benennen.
- Bestehende Mutation und Payloads beibehalten.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Security Purge" src/game/corp/scored-agenda/security-purge-sequence.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Security Purge ist step-benannt, Verhalten unverändert.

Commit: `refactor(engine): prepare security purge steps`

### P8 Ice Transmutation Module

Ziel: `scored-agenda-flow.ts` wird weiter entlastet.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/ice-transmutation-sequence.ts` oder fachlich passender Name.
- Ice-Transmutation-Zielwahl/Resolver aus `scored-agenda-flow.ts` ausziehen.
- Öffentliche Visibility und bestehende Tests beibehalten.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts --testNamePattern "Ice Transmutation"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Ice Transmutation liegt außerhalb des Flow-Monolithen, Verhalten unverändert.

Commit: `refactor(engine): move ice transmutation sequence`

### P9 Ordered Fort Rebuild Pilot

Ziel: Pavit-Bharat-ähnliche Fort-Rebuild-Sequenz als Vertrag vorbereiten.

Arbeit:

- Kleines Typ-/Contract-Modul `ordered-fort-rebuild-sequence.ts`.
- Modelliert nur Vertrag/Steps/Visibility/Redaction-Invarianten für `ordered_fort_rebuild_sequence`.
- Keine konkrete Kartenpromotion, keine LegalAction-Freischaltung.
- Tests prüfen Contract-Shape und PublicPayload-Redaction.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda/ordered-fort-rebuild-sequence.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Pilotvertrag existiert ohne produktive Runtime-Aktivierung.

Commit: `refactor(engine): add ordered fort rebuild sequence contract`

### P10 Sequence Contract Matrix

Ziel: Wiederkehrende Hidden-Zone-/ScoredAgenda-Verträge werden matrixartig getestet.

Arbeit:

- Neuer Test `packages/engine/src/game/corp/scored-agenda/sequence-contract.test.ts`.
- Matrix prüft Source-Revalidation, Surface-Policy, keine Hidden-Card-Listen, keine partial mutation für repräsentative Sequenzen soweit ohne große Host-Duplizierung möglich.
- Integrationstest bleibt erhalten.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda src/game/view/surface-policy.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Sequenzvertragsmatrix ergänzt die Modul- und Integrationstests.

Commit: `test(engine): add scored agenda sequence contract matrix`

### P11 Final Verify und Merge

Ziel: Gesamtprozess abschließen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/ability-engine/card-implementation-primitives.test.ts src/game/corp/scored-agenda src/game/view`
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Keine durch diesen Prozess verursachten roten Tests. Branch ist lokal nach `main` integriert, Worktree entfernt, Goal complete.

Commit: `test(engine): verify sequence host registry policy`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Keine `test.skip`-Einführung.
- Keine produktive KI-/Kartenfreischaltung.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_ENGINE_SEQUENCE_HOST_REGISTRY_POLICY`.
- Arbeitsbranch: `codex/engine-sequence-host-registry-policy`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push in diesem Prozess.

## Controller-Prompt-Kern

`/Goal Arbeite engine-sequence-host-registry-policy vollständig und sequenziell von P0 bis P11 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ENGINE_SEQUENCE_HOST_REGISTRY_POLICY auf Branch codex/engine-sequence-host-registry-policy. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Scored-agenda Fachmodule sind vom Dispatcher-Typmodul entkoppelt.
- Choice-Resolver sind registrierbar statt hart im Dispatcher verkettet.
- Surface-Regeln unterscheiden actor-private, public, opponent, replay und developer trace.
- DFR und Security Purge sind intern besser step-orientiert.
- Ice Transmutation ist aus `scored-agenda-flow.ts` ausgelagert.
- Pavit-Bharat-artiger Fort-Rebuild ist als sicherer Pilotvertrag vorbereitet, aber nicht produktiv freigeschaltet.
- Relevante Engine- und AI-Checks sind grün oder ehrlich dokumentiert.
