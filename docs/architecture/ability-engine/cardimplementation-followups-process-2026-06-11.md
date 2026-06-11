# CardImplementation Follow-ups Prozess 2026-06-11

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerauftrag: Den eingefügten Reviewtext zur CardImplementation-Struktur lesen, verstehen und die dort genannten Folgepakete direkt im Chat mit `paketprozess-worktree-goal` umsetzen.

## Zielprüfung

Die Vorgabe ist automatisch umsetzbar. Sie benennt sieben Folgepakete mit Ziel, Umsetzungsschritten und Abnahmebefehlen. Kleine Lücken werden konservativ behandelt: keine neue KI-Runtime-Wirkung, keine Hidden-Info-Ausweitung, keine Legacy-Payload-Umbenennung ohne Kompatibilitätsgrund und keine Testlockerung ohne konkreten side-safe Vertrag.

## Gesamtziel

Die CardImplementation-Primitive-Folgearbeit soll die erste Strukturkonsolidierung absichern: Data Fort Reclamation wird state-atomar und hinterlässt bei Nullauswahl kein leeres Remote; Primitive-Actions erhalten eine stabilere Ability-Key-Identität; interne Runtime-Namen werden primitive-näher; Hidden-Info-/PublicEvent-/Replay-Invarianten werden gezielt getestet; der AI-Deriver erkennt auch Hidden-Successful-Run-Factorys; Format- und Source-Polish werden nachgezogen; abschließend laufen AI-, Typecheck-, Test- und Format-Gates grün und der Arbeitsbranch wird lokal nach `main` integriert.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Arbeitsbranch: `codex/cardimplementation-followups`.
- Worktree: `C:\Projekte\NETGRID_CARDIMPLEMENTATION_FOLLOWUPS`.
- Bestehende Legacy-Marker bleiben lesbar.
- Neue Primitive-/Ability-Metadaten bleiben read-only und dürfen keine Legalität erzeugen.
- Interne Umbenennungen ändern keine öffentlichen Legacy-Action-, Event- oder HiddenZoneAction-Werte.

## Nicht-Ziele

- Keine neue KI-Runtime-Wirkung.
- Keine produktive TargetProfile-, DeckDoctrine- oder Planner-Gewicht-Anbindung.
- Keine Änderung an Legalität aus Payload-Metadaten.
- Keine Kartenfreischaltung, keine neuen Kartenmechaniken und kein neuer Release-Scope.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- `applyAction`/Resolver revalidieren Seite, Quelle, Timing, Ziele, Kosten und Choices.
- Hidden-Info darf nicht in PlayerViews, PublicEvents, Reconnect-Payloads, öffentliche Replays, Logs oder Client-Fehler leaken.
- Deterministisches Replay und StateHash dürfen nicht geschwächt werden.
- LegalActions bleiben aus `getLegalActions` ableitbar.
- Tests werden nicht per `skip`, pauschalem Assertion-Lockern oder Hidden-Info-Allowlist-Ausweitung grün gemacht.

## Automatische Fehlerbehandlung

- Rote Tests werden analysiert und repariert, bevor ein Paket abgeschlossen wird.
- Falls `main` weiterläuft, wird `main` defensiv in den Arbeitsbranch integriert und danach erneut verifiziert.
- AI-Reports werden nur geändert, wenn ein Check oder deterministischer Diff es verlangt.
- Bei fachlichem Sicherheitsblocker wird die Codeänderung gestoppt und eine Removal Condition dokumentiert.

## Sicherheitsblocker

- Teilmutierter State nach ungültiger Data-Fort-Reclamation-Auswahl.
- Leeres Remote durch Nullauswahl.
- Hidden-Info-Leak durch neue Primitive-/Ability-Felder.
- Neue KI-Entscheidungswirkung durch AI-Deriver-Facts.
- Nicht eindeutig auflösbare Ability-Identität bei mehreren gleichartigen Primitives.

## State Machine

1. `preflight`
2. `data_fort_atomicity`
3. `ability_identity`
4. `primitive_handler_naming`
5. `visibility_invariants`
6. `ai_deriver_hidden_successful_run`
7. `format_source_polish`
8. `final_verification`
9. `main_integration`
10. `complete`

## Paketfolge

### P0 - Preflight und Prozessartefakt

Ziel: Reviewtext, Projektvorgaben, Worktree, Branch und betroffene Codepfade festhalten.

Arbeit:

- Pflicht-Wissensbasis, Agentenvorgabe und Skill lesen.
- Reviewtext verstehen und Folgepakete übernehmen.
- Git-Ausgangslage und Worktree prüfen.
- Prozessartefakt anlegen.

Checks:

- `git status --short --branch`
- `git worktree list`
- `git diff --check`

Commit: `docs(engine): plan card implementation follow-ups`

### P1 - Data Fort Reclamation State-Atomicity und Nullauswahl

Ziel: Der Install-/Rez-Sequenzhandler mutiert bei ungültiger Auswahl nicht teilweise und erzeugt bei `0` gewählten Karten kein leeres Remote.

Arbeit:

- Vor jeder State-Mutation vollständige Prevalidation für Auswahl, Eindeutigkeit, Limit, HQ-Zone, Installierbarkeit, deterministische Reihenfolge und Root-Kapazität.
- Bei `selectedIds.length === 0`: kein `createRemote()`, keine Zone-Mutation, `pendingChoice` löschen, Payload mit `selectedCount: 0`, `installedCount: 0`, `temporaryCreditsReturned: 10`.
- Erst nach erfolgreicher Prevalidation Remote erzeugen und Karten bewegen.
- Tests für Nullauswahl und atomare Fehlerfälle ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts -t "Data Fort Reclamation"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `fix(engine): make data fort reclamation install atomic`

### P2 - Ability-ID Eindeutigkeit für Primitive-Actions

Ziel: Primitive-Payloads erhalten eine stabile Ability-Key-Identität, die später mehrere gleichartige Primitives pro Karte unterscheiden kann.

Arbeit:

- Factorys optional um `abilityKey` erweitern.
- `cardImplementationPrimitivePayload` um `cardImplementationAbilityKey` ergänzen.
- Defaults für bestehende Builder setzen.
- Resolver bevorzugen bei neuen Payloads `abilityKey`, Legacy-Payloads ohne Key bleiben funktionsfähig.
- Tests für Payload, Resolver-Präferenz und Legacy-Fallback ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/successful-run-interventions.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `refactor(engine): add stable primitive ability keys`

### P3 - Primitive-Handler intern generisch benennen

Ziel: Interne Runtime-Funktionen benennen die Primitive-Familien statt der ersten konkreten Karte.

Arbeit:

- `iceTransmutationTargetIds` zu `rezzedInstalledIceMarkModifierTargetIds`.
- `resolveIceTransmutationChoice` zu `resolveScoredRezzedIceMarkModifierChoice`.
- `resolveDataFortReclamationChoice` zu `resolveHqToNewRemoteInstallRezChoice`.
- `resolveDataFortReclamationRezChoice` zu `resolveHqToNewRemoteInstallRezRezChoice`.
- Fehlertexte primitive-neutraler formulieren, kartenfreundliche Prompts und Legacy-Werte erhalten.

Checks:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts`
- `git diff --check`

Commit: `refactor(engine): rename primitive sequence handlers`

### P4 - Hidden-Info- und PublicEvent-Invarianten

Ziel: Neue Identity-Felder tragen keine unzulässige Hidden-Info in PlayerViews, PublicEvents oder Replay-Surfaces.

Arbeit:

- PlayerView-/Hidden-Resource-Tests für Credit Subversion und Death from Above ergänzen.
- Data-Fort-Reclamation-View-Test: Corp darf HQ-Optionen sehen, Runner nicht.
- PublicEvent-/Replay-Tests für erlaubte Primitive-Felder und Hidden-Choice-Barrieren ergänzen.
- Scored-ICE-Mark-Test: öffentliche Choice auf rezzed ICE bleibt sichtbar.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/choice-view.test.ts src/game/events src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/index-tests/proteus/hidden-resource-hardening.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `test(engine): guard primitive identity visibility`

### P5 - AI-Deriver für Hidden-Successful-Run-Factory

Ziel: Der AI-Deriver erkennt auch `hiddenSuccessfulRunBeforeAccessEffect(...)` side-safe und ohne Runtime-Wirkung.

Arbeit:

- `scripts/check-ai-derived-facts.mjs` um Scanner für HQ-Credit-Loss und Remote-Fort-Trash-Factorys erweitern.
- Nur Funktionsklasse, Timing, Scope und Conditions ableiten; keine verdeckten Kartenidentitäten.
- Report-/Derived-Facts nur ändern, wenn Checks dies verlangen.

Checks:

- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai`
- `git diff --check`

Commit: `test(ai): derive hidden successful run primitive facts`

### P6 - Format- und Source-Polish

Ziel: Format- und kleine Source-Rückstände ohne Runtime-Verhaltensänderung entfernen.

Arbeit:

- Betroffene Dateien formatieren oder manuell Prettier-konform machen.
- Sichtbare Einrückung in `scored-agenda-flow.ts` korrigieren.
- Primitive-Payload-Feldnamen auf Konsistenz prüfen.
- Keine öffentliche Legacy-Payload-Umbenennung.

Checks:

- `corepack pnpm format:check`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `style(engine): polish card implementation primitive sources`

### P7 - Vollständiger Testblock und Integration

Ziel: Keine roten Tests, keine Typecheck-Fehler, keine AI-Gate-Drift, keine Formatfehler, lokaler Merge nach `main`.

Arbeit:

- Vollständigen Testblock ausführen.
- Rote Tests analysieren und minimal reparieren.
- Prozessartefakt mit Ergebnissen aktualisieren.
- Arbeitsbranch mit aktuellem `main` abgleichen.
- Lokal nach `main` mergen.
- Worktree entfernen und Goal abschließen.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm -r --if-present typecheck`
- `corepack pnpm -r --if-present --no-bail test`
- `corepack pnpm test`
- `corepack pnpm format:check`
- `git diff --check`

Commit: `test(engine): verify card implementation follow-ups`

## P0 Inventar

- Data Fort Reclamation:
  - Runtime: `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`.
  - Tests: `packages/engine/src/game/corp/install-rez-sequence-handlers.test.ts`.
  - Aktuelle Schwäche: `resolveDataFortReclamationChoice` erzeugt vor Mutation keine vollständige Prevalidation und erzeugt auch bei leerer Auswahl ein Remote.
- Primitive-Payload:
  - Helper: `packages/engine/src/ability-engine/card-implementation-primitives.ts`.
  - Nutzer: Successful-Run-Followups, Scored-ICE-Mark, HQ-to-New-Remote-Install-Rez.
  - Aktuelle Schwäche: `cardImplementationAbilityId` enthält noch keinen separaten Ability-Key.
- Interne Handlernamen:
  - `iceTransmutationTargetIds`, `resolveIceTransmutationChoice`, `resolveDataFortReclamationChoice`, `resolveDataFortReclamationRezChoice`.
  - Aktuelle Schwäche: interne Namen sind noch karten- statt primitive-orientiert.
- Hidden-Info/Visibility:
  - Relevante Tests: `hidden-resource-hardening.test.ts`, `card-view.test.ts`, vorhandene Event-/Replay-Tests und Install-/Rez-Sequenztests.
- AI-Deriver:
  - Script: `scripts/check-ai-derived-facts.mjs`.
  - Aktuelle Schwäche: Factory-Erkennung fokussiert ScoredAgenda-Factorys; Hidden-Successful-Run-Factory braucht side-safe Erkennung.

## P1 Ergebnis

Umgesetzt:

- `resolveDataFortReclamationChoice` validiert Auswahl, Limit, Eindeutigkeit, HQ-Zone, Installierbarkeit und Root-Kapazität vollständig vor der ersten State-Mutation.
- Bei `0` gewählten HQ-Karten wird kein Remote erzeugt; die Choice wird sauber geschlossen und ungenutzte temporäre Credits werden vollständig zurückgemeldet.
- Die eigentliche Install-Mutation läuft erst nach erfolgreicher Prevalidation.
- Tests decken Nullauswahl ohne Remote sowie ungültige Mehrfach-Root-Auswahl ohne teilweise Mutation von HQ, Serverliste, CardInstances oder PendingChoice ab.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts -t "Data Fort Reclamation"`
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`

## P2 Ergebnis

Umgesetzt:

- Relevante Primitive-Definitionen tragen optional `abilityKey`.
- `cardImplementationPrimitivePayload` schreibt `cardImplementationAbilityKey` und baut `cardImplementationAbilityId` aus `sourceDefinitionId` plus Ability-Key.
- Factory-Defaults:
  - `successful_run_before_access:0`
  - `scored_ice_mark:0`
  - `hq_to_new_remote_install_rez:0`
- Successful-Run-Resolver bevorzugt bei neuen Payloads den Ability-Key; falsche neue Keys fallen nicht auf `effectKind` zurück.
- Legacy-Payloads ohne Ability-Key bleiben funktionsfähig.
- Scored-ICE-Mark- und HQ-to-New-Remote-Install-Rez-Payloads tragen den neuen Key.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/successful-run-interventions.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`

## P3 Ergebnis

Umgesetzt:

- `iceTransmutationTargetIds` wurde zu `rezzedInstalledIceMarkModifierTargetIds`.
- `resolveIceTransmutationChoice` wurde zu `resolveScoredRezzedIceMarkModifierChoice`.
- `resolveDataFortReclamationChoice` wurde zu `resolveHqToNewRemoteInstallRezChoice`.
- `resolveDataFortReclamationRezChoice` wurde zu `resolveHqToNewRemoteInstallRezRezChoice`.
- Fehlertexte in den umbenannten Resolve-Pfaden sind primitive-neutraler; Prompts und Legacy-Payload-/Source-Werte bleiben kompatibel.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts`
- Grün: Code-Suche nach alten internen Funktionsnamen in `packages/engine/src`

## P4 Ergebnis

Umgesetzt:

- Choice-Projektionstest für Data Fort Reclamation ergänzt: Corp sieht HQ-Auswahloptionen, Runner sieht weder PendingChoice noch HQ-Optionen, Labels oder DefinitionIds.
- Choice-Projektionstest für öffentliche Scored-ICE-Mark-Ziele ergänzt: rezzed ICE bleibt in der Runner-View öffentlich, die Corp-Choice trägt `visibility: "public"` und PublicLabels.
- Hidden-Resource-Hardening für Credit Subversion und Death from Above erweitert:
  - Runner sieht die eigene Primitive-LegalAction mit Ability-Key.
  - Corp sieht vor Reveal keine verdeckte Hidden-Resource-Definition oder Primitive-Identität.
  - PublicEvents nach Reveal tragen öffentliche Source-/Reveal-Felder, aber keine `cardImplementationPrimitiveKind`- oder `cardImplementationAbilityId`-Felder.
  - Replay ab dem Resolve bleibt deterministisch und StateHash-stabil.
- Scored-ICE-Mark-Unit-Test pinnt die öffentliche Choice-Option auf bereits rezzed ICE.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/choice-view.test.ts src/game/corp/scored-agenda-flow.test.ts src/index-tests/proteus/hidden-resource-hardening.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/choice-view.test.ts src/game/events src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/index-tests/proteus/hidden-resource-hardening.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `git diff --check`

## P5 Ergebnis

Umgesetzt:

- `scripts/check-ai-derived-facts.mjs` erkennt `hiddenSuccessfulRunBeforeAccessEffect(...)` für HQ-Credit-Loss und Remote-Fort-Trash.
- Abgeleitet werden nur side-safe Facts: Effektklasse, Timing, Scope, Ressource/Zielklasse und Conditions.
- Credit Subversion erzeugt einen `counter_economy`-Fact für erfolgreiche HQ-Runs mit Credit-Verlust.
- Death from Above erzeugt `installed_card_trash`- und `ice_trash`-Facts für erfolgreiche Remote-Runs.
- Der AI-Gate-Test nutzt ein temporäres Pilot-Set für beide Hidden-Resource-Karten und prüft, dass die serialisierten Facts keine verdeckten Karten-, Stapel- oder Board-Identitäten enthalten.
- Die bekannte AI-Warnlage bleibt Warnungslage; rote Gates entstehen dadurch nicht.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/derived-basic-facts-gate.test.ts`
- Grün: `corepack pnpm --filter @netgrid/ai typecheck`
- Grün: `corepack pnpm check:ai-derived-facts`
- Grün: `corepack pnpm check:ai`
- Grün: `git diff --check`

## Verifikationsregeln

- Nach jedem Paket mindestens Typecheck plus passende Focustests.
- Vor jedem Commit `git diff --check`.
- Keine roten Tests als known red akzeptieren.
- Keine `test.skip`-Einführung und keine pauschale Hidden-Info-Allowlist-Ausweitung.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_CARDIMPLEMENTATION_FOLLOWUPS`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push, kein PR.
- Andere Worktrees und Branches nicht verändern.

## Controller-Prompt-Kern

`/Goal Arbeite CardImplementation Follow-ups vollständig und sequenziell von P0 bis P7 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARDIMPLEMENTATION_FOLLOWUPS auf Branch codex/cardimplementation-followups. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Im finalen Testblock alle Tests, Typechecks, AI-Checks und Formatchecks laufen lassen, rote Tests analysieren und beheben. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Data Fort Reclamation ist bei Nullauswahl remote-neutral und bei Fehlern state-atomar.
- Primitive-Payloads tragen stabile Ability-Key-Identität.
- Interne Handlernamen sind primitive-näher.
- Hidden-Info-/PublicEvent-/Replay-Invarianten sind gezielt abgesichert.
- AI-Deriver erkennt Hidden-Successful-Run-Factorys side-safe.
- `format:check`, AI-Checks, Typechecks und Tests sind grün.
- Lokaler `main` enthält alle Paketcommits.
