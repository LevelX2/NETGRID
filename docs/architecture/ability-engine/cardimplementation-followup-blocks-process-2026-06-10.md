# CardImplementation Follow-up Blocks Process 2026-06-10

Status: Finale Verify vor Integration abgeschlossen
Arbeitsbranch: `codex/cardimplementation-followup-blocks`
Worktree: `C:\Projekte\NETGRID_CARDIMPL_FOLLOWUP_BLOCKS`

## Quelle/Vorgabe

Folgeprozess zum Audit `docs/architecture/ability-engine/cardimplementation-longtail-audit-2026-06-10.md`.

Der Nutzerauftrag lautet, alle dort als Folgeblöcke erkannten Optimierungsblöcke sorgfältig direkt im Chat mit dem Paketprozess-Worktree-Goal umzusetzen.

## Zielprüfung

Der Auftrag ist ausreichend präzise für automatische Abarbeitung, wenn "umsetzen" konservativ gelesen wird:

- Wiederholte deklarative CardImplementation-Strukturen werden direkt in Helper oder generische Definitionen überführt, wenn vorhandene Runtime-Verträge das ohne Regeländerung tragen.
- Kartenbenannte Runtime-`kind`s werden nur dann ersetzt, wenn der neue Name und die neue Struktur denselben vorhandenen Vertrag ausdrücken und Tests die Kompatibilität absichern.
- Blöcke, die neue LegalActions, Choices, Hidden-Zone-Payloads, Cleanup-Regeln, Successful-Run-Timing oder Agenda-Score-Verträge brauchen, werden nicht halb implementiert. Sie erhalten einen dokumentierten Blocker mit Removal Condition.

## Gesamtziel

Alle Follow-up-Blöcke aus dem Longtail-Audit werden sequenziell verarbeitet. Am Ende gibt es entweder:

- risikoarme Code-Umsetzungen mit Paket-Commits und grünen paketbezogenen Checks; oder
- begründete Blocker/Follow-ups mit konkreter Removal Condition, falls eine sichere Umsetzung einen neuen Regelvertrag erfordert.

Der abgeschlossene Arbeitsbranch wird lokal nach `main` integriert, sofern `main` am Integrationspunkt keinen fachlichen Konflikt oder fremde uncommitted Kollisionen enthält.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Remote-Push oder Pull Request sind nicht Teil dieses Prozesses.
- Bestehende Baseline-Fehlschläge aus dem vorherigen Prozess bleiben eigenständige Restpunkte, sofern sie unverändert reproduzierbar sind.
- Keine Karte erhält neue Regeln oder erweiterte Spielbarkeit nur aus Refaktorgründen.

## Nicht-Ziele

- Keine Erweiterung des Kartenpools.
- Keine Hidden-Info-, Replay-, StateHash-, LegalAction- oder `applyAction`-Vertragsänderung ohne Tests.
- Keine UI-/Server-/AI-Arbeit.
- Keine Migration historischer Replays oder Runtime-Daten.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- CardImplementation-Dateien bleiben deklarativ.
- PlayerViews, PublicEvents, AI-Inputs, Logs, Reconnect-Payloads und Hidden-Zone-Choices dürfen keine verdeckten Informationen leaken.
- `applyAction`-Validierung und LegalActions bleiben bindend.
- Randomness läuft ausschließlich über bestehende Seed-/RandomCounter-/RandomDrawRecord-Pfade.

## Automatische Fehlerbehandlung

- Bei rotem paketbezogenem Check wird das aktive Paket eng debuggt.
- Bei fehlendem generischem Vertrag wird kein Ersatz simuliert; der Blocker wird dokumentiert.
- Bei Merge-Konflikten werden beide Intentionen gelesen und kompatibel zusammengeführt.
- Bei fachlichem Vertragskonflikt stoppt der Prozess mit Blocker-Report.

## Sicherheitsblocker

Ein Paket stoppt ohne verdeckte Codeänderung, wenn es eines dieser Dinge braucht:

- neue Hidden-Zone-Auswahlquelle oder anderes Choice-Source-Format ohne Tests;
- neue PublicEvent- oder PlayerView-Payload-Semantik;
- neue Successful-Run-before-access-Reihenfolge;
- neue Agenda-Score-Queue- oder Scored-Area-Semantik;
- neue Leave-Play-Cleanup- oder Hosted-Recovery-Regel;
- Änderung an Zufall, StateHash oder Replay-Determinismus.

## State Machine

1. Preflight: Worktree/Branch prüfen, Hauptworkspace sauber oder fremde Änderungen klassifizieren.
2. Paket aktivieren: Nur ein Paket ist aktiv.
3. Scope prüfen: Karte, Definitionstyp, Runtime und Tests lesen.
4. Umsetzen oder blockieren: Nur sichere Änderungen landen in Code.
5. Paket verifizieren: Pakettests, Typecheck soweit sinnvoll, `git diff --check`.
6. Paket committen.
7. Nächstes Paket starten.
8. Abschluss: Arbeitsbranch sauber, finale Checks, lokaler Merge nach `main`, Worktree entfernen, Goal schließen.

## Paketfolge

## Scope-Matrix nach Code-Sichtung

| Block | Entscheidung | Begründung |
| --- | --- | --- |
| Hosted-/Credit-Bank | Code-Scope als Definition-Helper | `add_hosted_credits`, `take_hosted_credits` und `trash_source_when_empty` sind bereits generische Effekte. Helper dürfen nur bestehende Objektliteral-Strukturen erzeugen. |
| Search-/Recovery-/Install | Code-Scope als Definition-Helper | `search_stack_to_grip`, `search_stack_install`, `choose_stack_or_trash_program_install` und `look_top_stack_*` sind vorhandene Effektverträge. Keine Änderung an Choice-Source oder Hidden-Zone-Handlern. |
| Microtech Trash Replacement | Code-Scope nur als Definition-`kind`-Generalisierung | Der vorhandene Runtime-Pfad kann dieselbe Semantik unter einem generischen `kind` erkennen. Hosted-Recovery- und Cleanup-Payloads bleiben unverändert. |
| Move/Uninstall/Shuffle-Draw | Code-Scope nur als Definition-`kind`-Generalisierung | Rescheduler und Cowboy Sysop nutzen vorhandene Runtime- und LegalAction-Payloads. Der CardImplementation-`kind` kann generischer werden, ohne PlayerAction-Verträge zu ändern. |
| Successful-Run-Followups | Blocker-Scope | Die Hidden-Resource-Followups koppeln vor Access ausgeführtes Timing, Reveal-and-Tap, Kosten und Access-Fortsetzung. Ein generischer Vertrag braucht eigene Design- und Hidden-Info-Tests. |
| Agenda-Score-Longtails | Gemischt | AI CFO, Priority Requisition, Corporate Downsizing und Security Purge sind als Definition-`kind` generisch beschreibbar. Ice Transmutation und Data Fort Reclamation bleiben wegen komplexer markierter ICE-Modifier bzw. Install-/Rez-Sequenzen Blocker-Scope. |

### Paket F1 - Follow-up-Scope und Prozessanker

Ziel: Folgeblöcke aus dem Audit in eine abarbeitbare Matrix überführen.

Arbeit:

- Prozessartefakt erstellen.
- Betroffene Definitionstypen, Runtime-Pfade und Tests inventarisieren.
- Code-Scope, Dokumentations-Scope und Blocker-Scope festlegen.

Done-Gate:

- Prozessartefakt und Scope-Matrix sind versioniert.
- Keine Codeänderung ohne Scope-Entscheidung.

Commit: `docs(engine): plan cardimplementation follow-up blocks`

### Paket F2 - Hosted-/Credit-Bank-Definition-Helper

Ziel: Wiederholte `add_hosted_credits`-/`take_hosted_credits`-Objekte nur dort vereinheitlichen, wo der bestehende generische Effektvertrag exakt erhalten bleibt.

Arbeit:

- Kleine Helper für Hosted-Credit-Start, Start-of-Turn-Refresh, Take-Credit und Trash-When-Empty prüfen.
- Karten mit identischer Struktur migrieren.
- Differenzierte RestrictedHostedCredit- oder Liability-Karten nicht vermischen.

Checks:

- CardImplementation-Descriptor-/Coverage-Tests mit den betroffenen Karten.
- Relevante Hosted-Credit-Regressionen.

Commit: `refactor(engine): consolidate hosted credit definitions`

### Paket F3 - Search-/Recovery-/Install-Profilprüfung

Ziel: Search-/Hidden-Zone-Profile sorgfältig prüfen und nur rein deklarative Duplikation reduzieren.

Arbeit:

- Bestehende Search-Kinds und Hidden-Zone-Choice-Builder lesen.
- Eventuell Helper für exakt bestehende Effektobjekte einführen.
- Keine neue Install-Magie, kein neues Choice-Source-Format.

Checks:

- Search-/Hidden-Zone-Tests für betroffene P3.37/P3.38/V1911-Karten.

Commit: `refactor(engine): consolidate search profile definitions`

### Paket F4 - Trash Replacement und Hosted Recovery

Ziel: Microtech Backup Drive auf einen generischen Ersatzvertrag prüfen.

Arbeit:

- Prüfen, ob der bestehende Runtime-Pfad ohne neue Semantik mit einem generischen `kind` auskommt.
- Wenn ja: kartenbenannten Definition-`kind` ersetzen und Runtime/Testreferenzen anpassen.
- Wenn nein: Blocker mit benötigtem Vertrag dokumentieren.

Checks:

- Microtech-spezifische Runtime- und Main-Action-Tests.

Commit: `refactor(engine): generalize program trash replacement definition`

### Paket F5 - Move/Uninstall/Shuffle-Draw

Ziel: Cowboy Sysop und Rescheduler von kartenbenannten `kind`s lösen, soweit der vorhandene Vertrag bereits generisch genug ist.

Arbeit:

- Runtime-Kopplung, hidden choice actions und PublicPayloads prüfen.
- Generische Namen nur übernehmen, wenn Tests dieselbe Semantik sichern.

Checks:

- Corp-Main-Action-, Credit-Economy- und relevante Index-Tests.

Commit: `refactor(engine): generalize corp zone move utilities`

### Paket F6 - Successful-Run-Followups

Ziel: Hidden-Resource-Followups prüfen.

Arbeit:

- Vor-Access-Timing, Kosten und Hidden-Info-Verträge lesen.
- Nur mechanisch sichere Definition-Generalisierung übernehmen.
- Sonst Blocker mit benötigtem `successful_run_before_access_effect`-Vertrag dokumentieren.

Checks:

- Hidden-access-run-Regressionen und Proteus-Hidden-Resource-Fälle.

Commit: `docs(engine): document successful run follow-up blocker`

### Paket F7 - Agenda-Score-Longtails

Ziel: Agenda-Score-Longtails prüfen und sinnvolle kartenbenannte `kind`s ersetzen oder begründet belassen.

Arbeit:

- AI CFO, Priority Requisition, Ice Transmutation, Corporate Downsizing, Security Purge und Data Fort Reclamation gegen vorhandene Runtime-Verträge lesen.
- Mehrfach nutzbare generische Verträge nur bei identischer Semantik übernehmen.

Checks:

- Agenda-scorearea-, hidden-zone- und mechanic-smoke-Tests für die betroffenen Karten.

Commit: `docs(engine): classify agenda score longtail contracts`

### Paket F8 - Finaler Verify und Integration

Ziel: Arbeitsbranch abschließen und lokal nach `main` integrieren.

Arbeit:

- Paketbezogene Tests erneut ausführen.
- `git diff --check`.
- Arbeitsbranch sauberstellen.
- `main` einbinden, final prüfen, lokal fast-forward mergen.
- Worktree entfernen.

Done-Gate:

- `main` enthält alle Paketcommits.
- Bekannte Baseline-Fehlschläge sind von neuen Fehlern getrennt dokumentiert.

Commit: keiner, außer Merge-Commit ist technisch nötig.

## Verifikationsregeln

- Mindestens `corepack pnpm --filter @netgrid/engine typecheck` vor Abschluss.
- Für jedes Codepaket fokussierte Tests der betroffenen Runtime-/Index-Pfade.
- `git diff --check` vor jedem Commit.
- Voller Engine-Testlauf zum Abschluss, sofern Laufzeit und Baseline-Diagnose praktikabel sind.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_CARDIMPL_FOLLOWUP_BLOCKS`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push und kein PR.

## Controller-Prompt-Kern

`/Goal Arbeite CardImplementation Follow-up Blocks vollständig und sequenziell von Paket F1 bis Paket F8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARDIMPL_FOLLOWUP_BLOCKS auf Branch codex/cardimplementation-followup-blocks. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe die betroffene Codeänderung, schreibe Blocker-Report mit Removal Condition und setze mit dem nächsten Paket fort, wenn keine globale Invariante verletzt ist. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Alle Folgeblöcke F2 bis F7 sind verarbeitet.
- Umgesetzte Codeänderungen sind eng begrenzt und testgedeckt.
- Nicht umgesetzte Blöcke haben konkrete Blocker und Removal Conditions.
- Der Arbeitsbranch ist lokal in `main` integriert oder ein harter Integrationsblocker ist dokumentiert.

## Paketprotokoll

### F2 Ergebnis

Umgesetzt:

- Helper in `packages/engine/src/card-implementations/helpers.ts` für:
  - `addHostedCredits`
  - `takeHostedCredits`
  - `trashSourceWhenEmpty`
  - `takeHostedCreditsAndTrashWhenEmpty`
  - `hostedCreditTakeTurnTrigger`
  - `hostedCreditTakeAbility`
  - `hostedCreditAddAbility`
  - `restrictedHostedCreditSource`
- Credit-Bank-, Campaign- und Coup-Karten auf die Helper migriert.
- Standard-Restricted-Hosted-Credit-Quellen auf die Helper migriert.
- `Krumz` verwendet nur den Add-Hosted-Credits-Helper; der eigene Trace-Bit-Vertrag bleibt bewusst unverändert.

Nicht geändert:

- Keine Runtime-Resolver, keine LegalAction-Payloads, keine Refresh-Reihenfolge, keine PublicEvents.
- Keine Vereinheitlichung von Liability-/Debt- oder Trace-Bit-Sondersemantik.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts`
- Grün: `git diff --check`
- Bekannter Baseline-Befund: Der breitere Satz `trace-prevention-assets`, `agenda-scorearea-recurring`, `corp-assets-upgrades-operations` bleibt wegen des bereits bekannten Corolla-Speed-Chip-Tests rot. Der Descriptor-Test bestätigt, dass die betroffenen Definitionen semantisch unverändert bleiben.

### F3 Ergebnis

Umgesetzt:

- Helper in `packages/engine/src/card-implementations/helpers.ts` für die bestehenden Search-/Hidden-Zone-Effektverträge:
  - `searchStackToGripEffect`
  - `searchStackInstallEffect`
  - `chooseStackOrTrashProgramInstallEffect`
  - `lookTopStackShowToCorpThenInstallMatchingEffect`
  - `lookTopStackTakeMatchingEffect`
  - `lookTopStackTakeOneArrangeRestEffect`
- Elf CardImplementation-Dateien auf diese Helper migriert.

Nicht geändert:

- Keine Hidden-Zone-Choice-Builder.
- Keine Choice-Source-Strings.
- Keine Installkosten-, Reveal-, Shuffle- oder Rückgabe-Regel.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts src/game/hidden-zone/search-choice-builders.test.ts src/game/hidden-zone/search-choice-handlers.test.ts src/game/hidden-zone/search-choice-resolvers.test.ts src/game/hidden-zone/search-choice-move-intents.test.ts src/game/hidden-zone/topn-move-intents.test.ts src/game/card-implementation/hidden-zone-runtime-deps.test.ts`
- Grün: `git diff --check`

### F4 Ergebnis

Umgesetzt:

- `microtech_backup_drive_program_trash_replacement` als CardImplementation-Definition-`kind` durch `replace_installed_program_trash_with_host_on_source` ersetzt.
- Runtime-Erkennung in `state-runtime-resolvers.ts` und `lifecycle-runtime.ts` auf den generischen Definition-`kind` umgestellt.

Nicht geändert:

- Microtech-spezifische LegalAction-Payloads wie `microtech_backup_drive_return_top_hosted`.
- Existing Hosted-Recovery-Verhalten, top-hosted-card-Regel, Leave-Play-Cleanup und PublicPayloads.

Checks:

- Grün: keine alten `microtech_backup_drive_program_trash_replacement`-Referenzen in `packages/engine/src`.
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/abilities/run-fort-trigger-execution.test.ts src/index-tests/mechanics/per-card-longtail.test.ts -t Microtech`
- Grün: `git diff --check`

### F5 Ergebnis

Umgesetzt:

- `rescheduler_hq_shuffle_draw` als CardImplementation-Definition-`kind` durch `shuffle_hq_into_rd_then_draw_same_count` ersetzt.
- `cowboy_sysop_uninstall_corp_card_to_hq` als CardImplementation-Definition-`kind` durch `move_installed_corp_card_to_hq` ersetzt.
- Runtime-Erkennung in Main-Action-Generierung und Cowboy-Ausführung auf die generischen Definition-`kind`s umgestellt.

Nicht geändert:

- Bestehende LegalAction-Payload-Werte `rescheduler_hq_shuffle_draw` und `cowboy_sysop_uninstall_corp_card_to_hq`.
- Hidden-Zone-Actions `v1917_rescheduler_hq_shuffle_draw` und `v1951_cowboy_sysop_uninstall_to_hq`.
- Shuffle-/Draw-Randomness, Zielvalidierung und PublicPayloads.

Checks:

- Grün: keine alten Rescheduler-/Cowboy-`kind`s in `packages/engine/src/card-implementations` oder `packages/engine/src/ability-engine`.
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/assets-nodes-upgrades.test.ts src/index-tests/originalset/corp-assets-upgrades-operations.test.ts -t Rescheduler`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/assets-nodes-upgrades.test.ts src/index-tests/originalset/corp-assets-upgrades-operations.test.ts -t Cowboy`
- Grün: `git diff --check`

### F6 Ergebnis

Entscheidung: kein Code-Schnitt in diesem Paket.

Betroffene aktuelle Definition-`kind`s:

- `hidden_resource_successful_hq_run_corp_lose_credits`
- `hidden_resource_successful_remote_run_trash_fort`

Blocker:

- Beide Followups sind nicht nur "nach erfolgreichem Run" generisch. Sie hängen an Hidden-Resource-Reveal, Tap-Kosten, Run-Phase `access`, Timing `immediately_after_successful_run_before_access`, Serverklasse und anschließender Access-Fortsetzung.
- Die Runtime-Funktionen `resolveHiddenSuccessfulRunCorpLoseCredits` und `resolveHiddenSuccessfulRunTrashRemoteFort` validieren diese Kopplung explizit und schreiben Hidden-Zone-Payloads.
- Eine bloße Umbenennung des `kind`s würde die Kartenbenennung reduzieren, aber keinen tragfähigen generischen Vertrag schaffen.

Removal Condition:

- Ein neuer Definitionstyp `successful_run_before_access_effect` oder gleichwertig beschreibt mindestens:
  - erlaubte Server (`hq`, `remote`, optional zentrale Server);
  - Quelle und Kosten (`hidden_runner_resource_reveal_and_tap`, `tap_source`, `credit`, `none`);
  - Effekt (`corp_lose_credits`, `trash_remote_root_and_ice`, weitere);
  - Access-Fortsetzung oder Access-Replacement;
  - PublicPayload-/Hidden-Zone-Payload-Felder;
  - einmalige Nutzung pro Run.
- Dazu braucht es Tests für LegalAction-Erzeugung, stale source, falschen Server, bereits getappte Quelle, Hidden-Info-Payload, Replay und StateHash.

Checks:

- Kein Code geändert.
- Blocker bewusst dokumentiert; Folgepakete dürfen nicht still neue Successful-Run-Semantik einführen.

### F7 Ergebnis

Umgesetzt:

- `ai_cfo_shuffle_hq_archives_into_rd_draw` als Definition-`kind` durch `shuffle_hq_archives_into_rd_then_draw` ersetzt.
- `priority_requisition_rez_ice_at_no_cost` als Definition-`kind` durch `score_rez_installed_ice_at_no_cost` ersetzt.
- `corporate_downsizing_hq_agendas` als Definition-`kind` durch `shuffle_selected_hq_agendas_into_rd_gain_credits` ersetzt.
- `security_purge_top_rd` als Definition-`kind` durch `reveal_top_rd_install_and_rez_ice_trash_rest` ersetzt.

Nicht geändert:

- Bestehende Payload-/Choice-Namen wie `ai_chief_financial_officer`, `v162_priority_requisition_free_rez`, `corporate_downsizing_hq_agendas` als `hiddenZoneAction` und `v1922_security_purge_rd_top3`.
- `ice_transmutation_rezzed_ice_modifier`: blockiert, weil die Regel markierte ICE-Stärke und Subroutine-Duplizierung über Scored-Area-Zustand koppelt.
- `data_fort_reclamation`: blockiert, weil die Regel mehrstufige HQ-Auswahl, neues Remote, Install-/Rez-Sequenz, temporäre Credits und Hidden-Zone-Choices koppelt.

Removal Conditions:

- Ice Transmutation erst generisch ersetzen, wenn ein Score-Vertrag für "select rezzed ICE -> place persistent mark counter -> strength modifier + subroutine duplication" mit Tests für Zielvalidierung, Mehrfachmarken, Replay und Encounter-Auswertung existiert.
- Data Fort Reclamation erst generisch ersetzen, wenn ein Sequenzvertrag für "select HQ cards -> install into new remote -> optional rez with temporary credits" inklusive Choice-Source, PublicPayload, Kostenvalidierung, Remote-Cleanup und StateHash-Test existiert.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-abilities.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts src/game/hidden-zone/corp-zone-choice-handlers.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/per-card-followups.test.ts -t "AI Chief Financial Officer"`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/trace-prevention-assets.test.ts -t "Priority Requisition"`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/hidden-zone-identity.test.ts -t "Corporate Downsizing"`
- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/per-card-longtail.test.ts -t "Security Purge"`
- Grün: `git diff --check`

### F8 Verify vor Integration

Grün:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts src/game/hidden-zone/search-choice-builders.test.ts src/game/hidden-zone/search-choice-handlers.test.ts src/game/hidden-zone/search-choice-resolvers.test.ts src/game/corp/scored-agenda-abilities.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/install-rez-sequence-handlers.test.ts src/game/hidden-zone/corp-zone-choice-handlers.test.ts src/game/abilities/run-fort-trigger-execution.test.ts`
- `git diff --check`

Voller Engine-Test:

- Befehl: `corepack pnpm --filter @netgrid/engine test`
- Status: rot mit der bekannten Baseline-Verteilung aus dem vorherigen Prozess.
- Ergebnis: 5 Testdateien rot, 8 Tests rot, 152 Testdateien grün, 1441 Tests grün.

Bekannte Baseline-Failures:

- `src/card-implementations/coverage.test.ts`: Proteus `manifestAiSupportDrift: 154`
- `src/game/view/player-view-projection.test.ts`: mixed remote root order / breach queue `undefined`
- `src/index-tests/originalset/agenda-scorearea-recurring.test.ts`: Corolla Speed Chip restricted Killer credit Erwartung
- `src/index-tests/originalset/hidden-access-run-regressions.test.ts`: 3 Missing-Legal-Action-Fälle für Virus Test Site, Setup!, TRAP!
- `src/index-tests/releases/mechanic-package-smokes-v16-v199.test.ts`: 2 Missing-Legal-Action-Fälle für Bizarre Encryption Scheme und Chimera
