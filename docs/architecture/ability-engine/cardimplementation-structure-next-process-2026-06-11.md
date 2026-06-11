# CardImplementation Structure Next Prozess 2026-06-11

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerauftrag: CardImplementation-Struktur konsolidieren, stabile side-safe Ability-/Primitive-Identitäten vorbereiten, drei bestehende Mechanic-Primitives weiter generisch machen, Tests härten, keine neue KI-Runtime-Wirkung aktivieren, vollständige Tests und Typechecks grün bekommen.

## Zielprüfung

Die Vorgabe ist automatisch umsetzbar. Branch, Scope, Nicht-Ziele, betroffene Primitives, Mindesttests und Abschlussbedingungen sind benannt. Kleine Lücken werden konservativ behandelt: bestehende Action-IDs und Legacy-Payload-Marker bleiben kompatibel, neue Identitätsfelder sind read-only und dienen nicht der Legalität.

## Gesamtziel

CardImplementation-basierte LegalActions sollen eine stabile, side-safe Ability-/Primitive-Identität tragen. Die drei neuen Primitives bleiben deklarativ in CardImplementation-Dateien, erhalten kleine Builder-Helfer und werden in Runtime-Handlern über Primitive-/Effect-Identität statt über kartenbenannte Payload-Strings revalidiert. KI-Entscheidungen, Planner-Gewichte und DeckDoctrine-Wirkung bleiben unverändert.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Arbeitsbranch: `codex/cardimplementation-structure-next`.
- Worktree: `C:\Projekte\NETGRID_CARDIMPLEMENTATION_STRUCTURE_NEXT`.
- Bestehende historische Payload-Marker bleiben als Legacy-Übergang lesbar.
- Neue Payload-Felder dürfen in Tests geprüft werden, solange sie keine Hidden-Info offenlegen.

## Nicht-Ziele

- Keine neue KI-Scoring-Heuristik.
- Keine produktive TargetProfile- oder DeckDoctrine-Auswertung.
- Keine Änderung an Legalitätsentscheidung aus Payload-Metadaten.
- Keine große DSL-Migration außerhalb der drei Primitive-Familien.
- Kein Push und kein PR.

## Controller-Invarianten

- Rules Engine bleibt Regelautorität.
- `applyAction` und Resolver revalidieren Quelle, Seite, Timing, Kosten, Targets und Choices.
- Hidden-Info-Barrieren bleiben erhalten.
- Deterministisches Replay und StateHash dürfen nicht geschwächt werden.
- LegalActions bleiben aus `getLegalActions` ableitbar; neue Identitätsfelder sind beschreibend.

## Automatische Fehlerbehandlung

- Rote Tests werden analysiert und repariert, bevor ein Paket abgeschlossen wird.
- AI-Reports werden nur regeneriert, wenn ein Check oder ein deterministischer Diff es verlangt.
- Bei fachlichem Sicherheitsblocker wird die Codeänderung gestoppt und eine Removal Condition dokumentiert.

## Sicherheitsblocker

- Neue Hidden-Info im falschen PlayerView-/Payload-Kontext.
- Illegal auswählbare oder nicht erneut validierte LegalAction.
- Neue AI-Runtime-Wirkung aus read-only Identitätsdaten.
- Unauflösbarer Konflikt mit aktuellen `main`-Verträgen.

## State Machine

1. `preflight`
2. `identity_factories`
3. `successful_run_generic_dispatch`
4. `scored_ice_mark_generic_dispatch`
5. `install_rez_sequence_generic_dispatch`
6. `final_verification`
7. `main_integration`
8. `complete`

## Paketfolge

### P0 - Preflight und Inventar

Ziel: Arbeitsprozess, Worktree und Primitive-Inventar festhalten.

Arbeit:

- Projekt- und Skill-Vorgaben lesen.
- Git-Ausgangslage prüfen.
- Primitive-Nutzer, Runtime-Handler, Legacy-Marker und Tests inventarisieren.
- Prozessartefakt anlegen.

Done-Gate:

- Worktree/Branch existiert.
- Prozessartefakt ist committed.
- Keine Codeänderung vor Preflight-Commit.

Commit: `docs(engine): plan card implementation structure consolidation`

### P1 - Identität und Factorys

Ziel: Kleine, typisierte Builder-/Identity-Helfer für die drei Primitives einführen.

Arbeit:

- Gemeinsame CardImplementation-Ability-/Primitive-Payload-Felder definieren.
- Factorys für `hiddenSuccessfulRunBeforeAccessEffect`, `scoredRezzedIceMarkModifier` und `hqToNewRemoteInstallRezSequence` erstellen.
- Vier CardImplementation-Dateien auf Factorys umstellen.
- Keine Runtime-Logik in Factorys einbauen.

Checks:

- Engine-Typecheck.
- `git diff --check`.

Commit: `refactor(engine): add card implementation primitive builders`

### P2 - Successful-Run-before-access generic dispatch

Ziel: Build und Resolve nutzen stabile Primitive-/Effect-Identität und laden CardImplementation erneut.

Arbeit:

- Neue Actions mit `cardImplementationAbilityId`, `cardImplementationPrimitiveKind`, `cardImplementationEffectKind`, `sourceCardId`, `sourceDefinitionId` ausstatten.
- Resolve über sourceCardId plus Primitive-/Effect-Identität revalidieren.
- Legacy-Marker `proteusHiddenSuccessfulRunFollowup` tolerieren.
- Tests für Credit Subversion und Death from Above auf Identität und Invarianten härten.

Checks:

- Hidden-Resource-/Successful-Run-Focustests.
- Engine-Typecheck.
- `git diff --check`.

Commit: `refactor(engine): dispatch successful run primitives by identity`

### P3 - Scored ICE-Mark generic dispatch

Ziel: Ice Transmutation als ersten Nutzer eines neutraleren Scored-ICE-Mark-Primitive-Choice-Pfads behandeln.

Arbeit:

- Choice-Source und Payload zusätzlich mit neutraler Primitive-Identität ausstatten.
- Resolver nach `select_rezzed_ice_mark_modifier` dispatchen und Vertragsparameter erneut validieren.
- Legacy-`v1920.ice_transmutation` als Übergang tolerieren.
- Tests für Ziellegalität, Skip und Counter-/Subroutine-Vertrag härten.

Checks:

- Scored-Agenda-Focustests.
- Engine-Typecheck.
- `git diff --check`.

Commit: `refactor(engine): generalize scored ice mark choice identity`

### P4 - HQ-to-New-Remote Install-/Rez-Sequenz generic dispatch

Ziel: Data Fort Reclamation bleibt einziger Nutzer, aber Handler und Choice-Kontext lesen sich generisch.

Arbeit:

- Install- und Rez-Choice-Source neutraler nach Primitive benennen oder zusätzlich neutral identifizieren.
- Sequence-Kontext mit sourceAgendaId, primitiveKind, createdServerId und temporaryCreditBudget in Payload/Source sichern.
- Install- und Rez-Choice gegen ScoredAgenda-Primitive revalidieren.
- Tests für 0..4 Auswahl, Installierbarkeit, Zonen, temporäre Credits und Hidden-Info härten.

Checks:

- Install-/Rez-Sequenz-Focustests.
- Engine-Typecheck.
- `git diff --check`.

Commit: `refactor(engine): stabilize install rez sequence primitive identity`

### P5 - Architekturreview und Komplettverifikation

Ziel: Keine neuen roten Tests, keine ungewollte KI-Wirkung, lokale Integration nach `main`.

Arbeit:

- Architekturcheck aus Nutzerauftrag durchführen.
- AI-Reports nur bei tatsächlicher Drift regenerieren.
- `corepack pnpm -r --if-present --no-bail test` ausführen.
- `corepack pnpm -r --if-present typecheck` ausführen.
- Alle roten Tests reparieren.
- Arbeitsbranch mit aktuellem `main` abgleichen, final prüfen, lokal nach `main` mergen.
- Worktree entfernen und Goal abschließen.

Done-Gate:

- Kompletttest grün.
- Typecheck grün.
- Keine roten Engine/Web/AI-Tests.
- `main` enthält alle Paketcommits lokal.

Commit: `test(engine): verify card implementation primitive consolidation`

## Verifikationsregeln

- Nach jedem Paket mindestens Typecheck plus passende Focustests.
- Vor jedem Commit `git diff --check`.
- Keine roten Tests als known red akzeptieren; der Auftrag verlangt Reparatur.
- Wenn `node_modules` im Worktree fehlt, vorhandene pnpm-Installation über `corepack pnpm install` herstellen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_CARDIMPLEMENTATION_STRUCTURE_NEXT`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push, kein PR.
- Andere Worktrees und Branches nicht verändern.

## Controller-Prompt-Kern

`/Goal Arbeite CardImplementation Structure Next vollständig und sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARDIMPLEMENTATION_STRUCTURE_NEXT auf Branch codex/cardimplementation-structure-next. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Im finalen Testblock alle Tests und Typechecks laufen lassen, rote Tests analysieren und beheben. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Drei Primitive-Familien sind strukturierter und generischer dispatchbar.
- CardImplementation-Dateien sind deklarativer und nutzen Builder.
- Neue Identitätsfelder sind side-safe und read-only.
- Legacy-Marker bleiben kompatibel.
- Kompletttest und Typecheck sind grün.
- Lokaler `main` enthält alle Paketcommits.

## P0 Inventar

- `successful_run_before_access_effect`
  - Nutzer: `Credit Subversion`, `Death from Above`.
  - Runtime: `packages/engine/src/game/run/successful-run-interventions.ts`.
  - Legacy-Marker: `proteusHiddenSuccessfulRunFollowup`, HiddenZoneActions `proteus_hidden_successful_hq_run_credit_subversion`, `proteus_hidden_successful_remote_run_trash_fort`.
  - Tests: `hidden-resource-hardening.test.ts`, `successful-run-interventions.test.ts`, `run-access-transition.test.ts`.
- `select_rezzed_ice_mark_modifier`
  - Nutzer: `Ice Transmutation`.
  - Runtime: `packages/engine/src/game/corp/scored-agenda-flow.ts` und Subroutine-/Strength-Auswertung in Runtime-Services.
  - Legacy-Marker: `v1920.ice_transmutation`, `v1920_ice_transmutation`.
  - Tests: `scored-agenda-flow.test.ts`, `scored-agenda-abilities.test.ts`, `agenda-global-random.test.ts`, `card-view.test.ts`.
- `score_install_hq_cards_into_new_remote_then_rez`
  - Nutzer: `Data Fort Reclamation`.
  - Runtime: `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`, Start in `scored-agenda-flow.ts`.
  - Legacy-Marker: `v1922.data_fort_reclamation`, `v1922_data_fort_reclamation_*`.
  - Tests: `install-rez-sequence-handlers.test.ts`, `scored-agenda-flow.test.ts`, `per-card-longtail.test.ts`.

## P1 Ergebnis

Umgesetzt:

- Neuer Helper `packages/engine/src/ability-engine/card-implementation-primitives.ts`.
- Read-only Payload-Identität über `cardImplementationPrimitivePayload(...)` vorbereitet.
- Factorys:
  - `hiddenSuccessfulRunBeforeAccessEffect(...)`
  - `scoredRezzedIceMarkModifier()`
  - `hqToNewRemoteInstallRezSequence(...)`
- `Credit Subversion`, `Death from Above`, `Ice Transmutation` und `Data Fort Reclamation` nutzen die Factorys.

Bewusst stabil gelassen:

- Keine Runtime-Dispatch-Änderung in P1.
- Keine LegalAction-IDs oder Legacy-Payload-Marker geändert.
- Keine AI-Runtime-Wirkung.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`

## P2 Ergebnis

Umgesetzt:

- `buildSuccessfulRunFollowupActions` versieht Credit Subversion und Death from Above mit `cardImplementationAbilityId`, `cardImplementationPrimitiveKind`, `cardImplementationEffectKind`, `sourceCardId` und `sourceDefinitionId`.
- `resolveSuccessfulRunFollowupAbility` bevorzugt die neue Primitive-/Effect-Identität und toleriert `proteusHiddenSuccessfulRunFollowup` als Legacy-Fallback.
- Resolve lädt über `sourceCardId` die CardImplementation erneut, validiert `successful_run_before_access_effect`, Server, Timing, Quelle, Reveal-/Tap-Kosten und genutzte Quelle erneut.
- Death from Above revalidiert jetzt auch, dass das Remote beim Resolve nicht leer ist.
- Proteus-Hidden-Resource-Test prüft neue Identitätsfelder, Legacy-Marker-Kompatibilität, zweite Nutzung und Death-from-Above-Negativfälle.

Bewusst stabil gelassen:

- Alte Payload-Marker bleiben in LegalActions enthalten.
- HiddenZoneAction-Werte bleiben unverändert.
- Keine KI-Runtime-Wirkung.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts src/game/run/successful-run-interventions.test.ts src/game/run/run-access-transition.test.ts`

## P3 Ergebnis

Umgesetzt:

- Scored-ICE-Mark-Choice nutzt jetzt die neutrale Source `card_implementation_primitive.select_rezzed_ice_mark_modifier`.
- `handleScoredAgendaFlowChoice` akzeptiert die neue Source und toleriert `v1920.ice_transmutation` als Legacy-Pfad.
- Start- und Resolve-Payloads enthalten `cardImplementationAbilityId`, `cardImplementationPrimitiveKind`, `cardImplementationEffectKind`, `sourceCardId`, `sourceDefinitionId` und Ziel-/Counter-Metadaten.
- Ice-Transmutation-Tests prüfen die neue Primitive-Identität und den Skip-Fall ohne rezzed ICE.
- PublicEvent-Smoke bleibt auf fachliche öffentliche Felder beschränkt; die neuen Identity-Felder sind LegalAction-/Runtime-Payload-Daten und keine zusätzliche PublicEvent-Pflicht.

Bewusst stabil gelassen:

- `agendaAbility: "v1920_ice_transmutation"` bleibt für bestehende Auswertung und Event-Kompatibilität erhalten.
- Kartenfreundliche Prompt-Texte bleiben unverändert.
- Keine KI-Runtime-Wirkung.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda-abilities.test.ts src/index-tests/mechanics/agenda-global-random.test.ts src/game/view/card-view.test.ts`

## P4 Ergebnis

Umgesetzt:

- Data-Fort-Reclamation-Install-Choice nutzt jetzt die neutrale Source `card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez`.
- Rez-Choice nutzt die neutrale Source `card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez`.
- `handleCorpInstallRezSequenceChoice` akzeptiert neue Sources und toleriert die alten `v1922.data_fort_reclamation*`-Sources als Legacy-Pfade.
- Start-, Install- und Rez-Payloads enthalten Primitive-Identität, `sourceAgendaId`, Sequence-Server-Kontext und temporäres Credit-Budget.
- Install- und Rez-Choice validieren weiterhin erneut gegen den ScoredAgenda-Primitive-Vertrag.
- Tests prüfen neue Sources, Identitätsfelder, HiddenZoneAction-Kompatibilität, Installationszonen und temporäre Credit-Zahlung.

Bewusst stabil gelassen:

- HiddenZoneAction-Werte `v1922_data_fort_reclamation_*` bleiben unverändert.
- Count-basierte Hidden-Info-Payloads bleiben ohne private HQ-Identitäten für die falsche Seite.
- Keine KI-Runtime-Wirkung.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/index-tests/mechanics/per-card-longtail.test.ts -t "Data Fort Reclamation|corp install rez sequence handlers|scored agenda flow"`
