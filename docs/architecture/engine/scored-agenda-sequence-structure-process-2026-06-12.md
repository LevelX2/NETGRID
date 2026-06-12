# Engine Scored Agenda Sequence Structure Process 2026-06-12

## Status

`in_progress`

## Paketfortschritt

- P0 abgeschlossen mit Commit `0350f599`: Prozessartefakt und Worktree-Preflight.
- P1 abgeschlossen: `hidden-zone-choice.ts` zentralisiert actor-private Hidden-Card-Choice-Optionen, Hidden-Card-Auswahlauflösung und Hidden-Zone-Payload-Marker. `install-rez-sequence-handlers.ts` nutzt diese Helper für Priority Requisition, Security Purge und Data Fort Reclamation ohne fachliche Verhaltensänderung.
- P2 abgeschlossen: Data Fort Reclamation liegt in `packages/engine/src/game/corp/scored-agenda/data-fort-reclamation-sequence.ts`; der alte Install-/Rez-Handler dispatcht und re-exportiert nur noch die stabile Startfunktion. DFR-Testausschnitt, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P3 abgeschlossen: Security Purge liegt in `packages/engine/src/game/corp/scored-agenda/security-purge-sequence.ts`; der alte Handler dispatcht die offene Zielserver-Choice und re-exportiert den Agenda-Resolver. Security-Purge-Testausschnitt, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P4 abgeschlossen: Priority Requisition liegt in `packages/engine/src/game/corp/scored-agenda/priority-requisition-sequence.ts`; der alte Handler dispatcht die Choice und re-exportiert den Start-Resolver. Priority-Requisition-Testausschnitt, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P5 abgeschlossen: `scored-agenda-sequence-types.ts` führt `CorpSequenceContext` und `corpSequenceContextPayload` ein. DFR und Security Purge bauen bestehende Count-/Credit-/Reveal-Payloadteile darüber, wobei der interne Step nicht in Runtime-Payloads ausgegeben wird. Integrationstest, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P6 abgeschlossen: `game/view/surface-sanitizer.ts` ergänzt eine testbare Public-Surface-Grenze für CardImplementation-/Hidden-Zone-Payloads. Der `CorpSequenceContext`-Builder nutzt sie, und ein direkter Test deckt erlaubte Public-Felder sowie blockierte Hidden-Card-ID-Listen ab. Vorgesehener Testblock, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P7 abgeschlossen: `install-rez-sequence-handlers.ts` ist auf Host-/Result-Typen, stabile Re-Exports und Choice-Dispatcher reduziert. Ein Dispatcher-Kontrakt beschreibt, dass Legalität und Mutation in den Sequenzmodulen unter Rules-Engine-Vertrag bleiben. Handler-Test, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P8 abgeschlossen: Neben den neuen Sequenzmodulen liegen schlanke Routing-Modultests für Data Fort Reclamation, Security Purge und Priority Requisition. Der bestehende `install-rez-sequence-handlers.test.ts` bleibt als Integrationstest erhalten. P8-Testblock, Engine-Typecheck, Format- und Whitespace-Gates sind grün.
- P9 abgeschlossen: Die neuen Sequenzmodule tragen lokale Contract-/Authority-/Visibility-Kommentare. Der primitive Contract und das checked-in Manifest referenzieren Data Fort Reclamation nun auf `scored-agenda/data-fort-reclamation-sequence` statt auf den alten Dispatcher. Primitive-Contract-Test, Engine-Typecheck, Format- und Whitespace-Gates sind grün.

## Quelle/Vorgabe

Eingefügter Statusbericht vom 2026-06-12 mit dem nächsten konkreten Umsetzungsauftrag `engine/scored-agenda-sequence-structure`.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung hinreichend präzise. Sie beschreibt Ziel, Modulgrenzen, Paketfolge, Akzeptanzkriterien und relevante Checks.

Konservative Annahmen:

- Dieser Prozess ist ein Engine-Strukturprozess. Er ändert keine produktive KI-Auswahl, keine AI-Reports und keine Semantikdaten.
- Verhalten von Data Fort Reclamation, Security Purge, Priority Requisition und Ice Transmutation bleibt unverändert.
- Strukturänderungen werden in kleinen Paketen vorgenommen. Moves und Logikänderungen werden getrennt, soweit sinnvoll.
- Große generische DSLs bleiben out-of-scope; erlaubt sind kleine Helper, Typen, Sanitizer und Resolvermodule.

## Gesamtziel

Scored-agenda- und hidden-zone Sequenzen werden aus breiten Runtime-Monolithen herausgezogen, Hidden-Info-Choice-Grenzen zentralisiert, Payload-/Surface-Grenzen expliziter gemacht und die Engine-Teststruktur an die neuen Module gespiegelt.

## Nicht-Ziele

- Kein produktiver KI-Cutover.
- Keine LegalAction-Erzeugung außerhalb der Engine.
- Keine neue Kartenfreischaltung.
- Keine neue Data-Fort-Reclamation-UX für echte per-card optionale Rez-Choices.
- Keine großen AI-Benchmark- oder Report-Artefakte.
- Kein Push oder PR aus diesem Prozess.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Jedes Paket bekommt einen eigenen Commit.
- Die Rules Engine bleibt einzige Regelautorität.
- Öffentliche Payloads enthalten keine privaten HQ-/R&D-/Handkartenlisten.
- Refactors erhalten vorhandenes Verhalten und bestehende Tests.
- `install-rez-sequence-handlers.ts` und `scored-agenda-flow.ts` werden kleiner oder klarer, nicht komplexer.

## Automatische Fehlerbehandlung

- Rote Tests werden zuerst auf den aktuellen Paketdiff zurückgeführt.
- Wenn ein gewünschter struktureller Move zu groß für ein sicheres Paket ist, wird er in einen kleineren Move aufgeteilt.
- Wenn eine Hidden-Info-Grenze unklar ist, bleibt die bestehende Runtime-Semantik erhalten und die Grenze wird als Blocker/Folgepunkt dokumentiert.

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn:

- private Karten-IDs oder Hidden-Zone-Listen in öffentliche Events, PlayerViews, Replays oder KI-Inputs gelangen;
- ein Modul Legalität außerhalb von `LegalActions`/`applyAction` definiert;
- DFR, Security Purge, Priority Requisition oder Ice Transmutation ihr Verhalten ändern;
- ein Refactor StateHash-, Replay- oder stale-action-Verträge verändert.

## State Machine

- `P0_PROCESS_ARTIFACT`
- `P1_HIDDEN_ZONE_CHOICE_HELPERS`
- `P2_DATA_FORT_RECLAMATION_MODULE`
- `P3_SECURITY_PURGE_MODULE`
- `P4_PRIORITY_REQUISITION_MODULE`
- `P5_CORP_SEQUENCE_CONTEXT`
- `P6_SURFACE_SANITIZER`
- `P7_INSTALL_REZ_DISPATCHER_TRIM`
- `P8_TEST_STRUCTURE_SPLIT`
- `P9_CONTRACT_COMMENTS`
- `P10_FINAL_VERIFY_AND_MERGE`

## Paketfolge

1. P0 Prozessartefakt und Worktree-Preflight.
2. P1 gemeinsame Hidden-Zone-Choice-Helper extrahieren.
3. P2 Data Fort Reclamation in `scored-agenda/data-fort-reclamation-sequence.ts` verschieben.
4. P3 Security Purge in `scored-agenda/security-purge-sequence.ts` verschieben.
5. P4 Priority Requisition in `scored-agenda/priority-requisition-sequence.ts` verschieben.
6. P5 `CorpSequenceContext` einführen und bei DFR/Security Purge verwenden.
7. P6 Surface-Sanitizer für `cardImplementation*`-/Hidden-Zone-Payload-Grenzen ergänzen.
8. P7 `install-rez-sequence-handlers.ts` auf Dispatcher-/Orchestratorrolle trimmen.
9. P8 Tests neben neue Module spiegeln, Integrationstests erhalten.
10. P9 Contract-Kommentare und Primitive-Resolver-Refs aktualisieren.
11. P10 relevante Engine-/AI-Checks ausführen, rote Tests reparieren, lokal nach `main` integrieren.

## Paketdetails

### P0 Prozessartefakt und Preflight

Ziel: Prozess kontrolliert starten.

Arbeit:

- Worktree `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_SEQUENCE_STRUCTURE` auf Branch `codex/engine-scored-agenda-sequence-structure` anlegen.
- Prozessartefakt erstellen.
- Betroffene Monolithen und Tests identifizieren.

Checks:

- `git status --short --branch`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Worktree und Prozess sind bereit.

Commit: `docs(engine): define scored agenda sequence structure process`

### P1 Hidden-Zone-Choice-Helper

Ziel: Wiederkehrende Hidden-Zone-Choice-Muster zentralisieren.

Arbeit:

- Neues Modul `packages/engine/src/game/choices/hidden-zone-choice.ts`.
- Helper für actor-private Hidden-Card-Choices, ausgewählte Hidden-Card-IDs, öffentliche Count-/Label-Payloads und Actor-Private-Assertions.
- Bestehendes Verhalten zunächst nur an Security Purge/DFR-Choice-Erzeugung anbinden, wo risikoarm.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Helper existiert, Hidden-Info-Verhalten bleibt unverändert.

Commit: `refactor(engine): extract hidden zone choice helpers`

### P2 Data Fort Reclamation Module

Ziel: DFR aus `install-rez-sequence-handlers.ts` ausziehen.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/data-fort-reclamation-sequence.ts`.
- DFR-Start, Install-Resolve, Rez-Resolve, Prevalidation, temporary credits und Region-/required-rez-on-install-Handling verschieben.
- Public API aus altem Handler stabil re-exportieren oder Importpfade gezielt aktualisieren.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Data Fort Reclamation"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: DFR-Tests grün, Verhalten unverändert.

Commit: `refactor(engine): move data fort reclamation sequence`

### P3 Security Purge Module

Ziel: Security Purge aus `install-rez-sequence-handlers.ts` ausziehen.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/security-purge-sequence.ts`.
- Reveal, Target Choice, Install/Rez und Trash-Rest-Logik verschieben.
- Hidden-Info-Barrieren und Public Counts beibehalten.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Security Purge"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Security-Purge-Tests grün, Verhalten unverändert.

Commit: `refactor(engine): move security purge sequence`

### P4 Priority Requisition Module

Ziel: Priority Requisition aus `install-rez-sequence-handlers.ts` ausziehen.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/priority-requisition-sequence.ts`.
- Candidate Discovery, Free-Rez-Choice und Resolver verschieben.
- Normale Rez-Kosten bleiben für diese Sequenz ausgeschlossen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts --testNamePattern "Priority Requisition"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Priority-Requisition-Tests grün, Verhalten unverändert.

Commit: `refactor(engine): move priority requisition sequence`

### P5 CorpSequenceContext

Ziel: Sequenz-Payload-Kontext einheitlicher und redaction-sicherer ausdrücken.

Arbeit:

- Neues Modul `packages/engine/src/game/corp/scored-agenda/scored-agenda-sequence-types.ts`.
- `CorpSequenceContext` mit public-safe Zähl-/Step-/Credit-Feldern.
- DFR und Security Purge nutzen den Kontext für Payload-Konstruktion, ohne private Listen zu veröffentlichen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Sequenzpayloads sind typisiert und hidden-info-safe.

Commit: `refactor(engine): add corp sequence context`

### P6 Surface Sanitizer

Ziel: Public-/Opponent-Surface-Grenzen für CardImplementation- und Hidden-Zone-Payloads zentral dokumentieren und testbar machen.

Arbeit:

- Neues Modul `packages/engine/src/game/view/surface-sanitizer.ts`.
- Kleine Sanitizer-/Assertion-Funktionen für `cardImplementation*`-Felder und Hidden-Zone-Barrier-Payloads.
- Relevante Payload-Konstruktion in scored-agenda Sequenzen nutzt Sanitizer/Guards.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Sanitizer-Grenze existiert ohne Verhaltenserweiterung.

Commit: `refactor(engine): add public surface sanitizer`

### P7 Install-Rez Dispatcher Trim

Ziel: `install-rez-sequence-handlers.ts` bleibt Orchestrator/Dispatcher statt Fachmonolith.

Arbeit:

- Handlerdatei auf Host-Typen, Dispatcher und Re-Exports reduzieren.
- Fachlogik in neuen scored-agenda Modulen halten.
- Keine neuen Runtime-Pfade.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Datei ist deutlich kleiner und Tests bleiben grün.

Commit: `refactor(engine): trim install rez sequence dispatcher`

### P8 Teststruktur splitten

Ziel: Tests spiegeln neue Module, Integrationstest bleibt erhalten.

Arbeit:

- Neue Tests neben Module:
  - `data-fort-reclamation-sequence.test.ts`
  - `security-purge-sequence.test.ts`
  - `priority-requisition-sequence.test.ts`
  - optional `sequence-shared.test.ts`
- Monolithischer Integrationstest behält End-to-End-Signal.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Tests sind besser lokalisiert und doppeln nicht unnötig.

Commit: `test(engine): split scored agenda sequence tests`

### P9 Contract-Kommentare

Ziel: Contract-/Authority-/Visibility-Kommentare passen zu neuen Modulgrenzen.

Arbeit:

- Modulkommentare in neuen scored-agenda Dateien ergänzen.
- Primitive-Manifest/ResolverRef für DFR/Security Purge/Priority Requisition auf neue Module aktualisieren.
- Keine großen AI-Reports anfassen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/card-implementation-primitives.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Dokumentierte Resolvergrenzen passen zum Code.

Commit: `docs(engine): update scored agenda sequence contracts`

### P10 Final Verify und Merge

Ziel: Gesamtprozess abschließend prüfen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/ability-engine/card-implementation-primitives.test.ts`
- `corepack pnpm check:ai`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Keine durch diesen Prozess verursachten roten Tests. Branch ist lokal nach `main` integriert, Worktree entfernt, Goal complete.

Commit: `test(engine): verify scored agenda sequence structure`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Keine `test.skip`-Einführung.
- Keine großen AI-Reports ohne ausdrücklichen Paketgrund ändern.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_SEQUENCE_STRUCTURE`.
- Arbeitsbranch: `codex/engine-scored-agenda-sequence-structure`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push in diesem Prozess.

## Controller-Prompt-Kern

`/Goal Arbeite engine/scored-agenda-sequence-structure vollständig und sequenziell von P0 bis P10 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ENGINE_SCORED_AGENDA_SEQUENCE_STRUCTURE auf Branch codex/engine-scored-agenda-sequence-structure. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Scored-agenda Sequenzen sind modularer.
- Hidden-Zone-Choice- und Surface-Grenzen sind zentraler testbar.
- Data Fort Reclamation, Security Purge, Priority Requisition und Ice Transmutation verhalten sich unverändert.
- `install-rez-sequence-handlers.ts` ist kleiner und fachlich entlastet.
- Relevante Engine- und AI-Checks sind grün oder ehrlich dokumentiert.
