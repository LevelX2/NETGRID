# Card Function Rest Families Process - 2026-06-21

## Status

Umsetzung abgeschlossen auf Branch `codex/card-function-rest-families` im Worktree `C:\Projekte\NETGRID_CARD_FUNCTION_REST_FAMILIES`.

Der Branch wurde paketweise umgesetzt und ist bereit für die lokale Integration nach `main`.

## Quelle/Vorgabe

Geprüfte Rückmeldung vom 2026-06-21 zum aktuellen Card-Function-Abstraction-Strang.

Die Rückmeldung ist plausibel:

- Der Review `docs/reviews/engine/card-function-abstraction-2026-06-12.md/json` steht auf 271 Known-Findings.
- Die früheren Slices Preying Mantis, Quest for Cattekin, Code Viral Cache, Krumz, Startup Immolator, Siren, Bizarre Encryption Scheme und Pirate Broadcast sind als abgeschlossen geführt.
- Explizit `deferred_refactor_required` bleibt in der Abstraktionsplan-Tabelle `Corporate War / Project Babylon`.
- Weitere sichtbare Restfamilien sind Newsgroup Taunting, Disinfectant, Hidden-Zone-Operationen, Recovery-/Operation-Payouts und Compatibility-Konstanten.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel und Endzustand sind bestimmt: Reststellen priorisieren, drei enge technische Familien refaktorieren, Hidden-Zone-Familie separat planen und Guard/Tests aktualisieren.
- In Scope sind Review-/Prozessartefakte, Scored-Agenda-Familien, Run-Start-Tax, Counter-Prevention-Replacement und fokussierte Tests.
- Nicht in Scope sind Hidden-Zone-Codeänderungen, Silver-Lining-/Omniscience-Refactor, Code-Viral-Cache-Bootstrap-Restbereinigung, Produkt-/Release-Versionierung und Push.
- Sicherheitsgrenzen sind bestimmbar: keine Scoring-Legalitätsänderung, keine Run-Legalitätsänderung, keine Hidden-Info-Ausweitung, deterministische Replay-/StateHash-Erhaltung.

## Gesamtziel

Der Card-Function-Abstraction-Strang wird nach den abgeschlossenen Run-/Access-/Sequenz-Slices auf die nächsten Restfamilien gehoben:

- Reststellen werden als Funktionsfamilien priorisiert.
- Corporate War und Project Babylon nutzen generische Scored-Agenda-Familien statt kartennamenspezifischer funktionaler Kinds.
- Newsgroup Taunting nutzt eine generische Run-Start-Tax-Familie mit neutralen Runtime-/Payload-Namen.
- Disinfectant nutzt eine generische Counter-Prevention-Replacement-Familie mit neutralem Usage-Ledger.
- Hidden-Zone-Reststellen werden nur als separater Folgeprozess geplant.

## Annahmen

- Kartentitel und CardDefinitionIds bleiben in CardImplementation-, Registry-, Coverage-, Katalog-, Test- und Review-Kontexten erlaubt.
- Funktionsfamilien sollen nach Regelwirkung benannt werden, nicht nach erster Beispielkarte.
- Bestehende Tests dürfen kartenspezifische Szenarienamen behalten, solange Runtime-/Payload-Verträge neutral sind.
- Wenn eine Familie im aktuellen Code bereits teilweise generisch modelliert ist, wird der Slice eng auf die verbleibenden kartenspezifischen Runtime-/Payload-/Kind-Funde begrenzt.

## Nicht-Ziele

- Keine Umsetzung der Hidden-Zone-Familie in diesem Prozess.
- Keine Änderung an Scoring-, Run-, Counter- oder Access-Legalität.
- Keine breite Umbenennung aller historischen Testdaten.
- Keine Entfernung erlaubter Katalogreferenzen.
- Keine Produkt-/Release-Versionserhöhung.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, Mensch und KI reichen nur `PlayerActions` aus `LegalActions` ein.
- `applyAction` revalidiert Timing, Kosten, Ziele, Choices und Ability-Art.
- Keine verdeckten Kartendaten dürfen in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, Replays, Logs oder Client-Fehlern leaken.
- Replay und StateHash bleiben deterministisch.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eng debuggt.
- Guard-Drift wird nur akzeptiert, wenn sie durch den jeweiligen Slice erklärbar ist.
- Wenn eine Zielabstraktion bestehendes Verhalten nicht deckungsgleich abbilden kann, wird ein Blocker mit Removal Condition dokumentiert.
- Wenn `main` während der Arbeit weiterläuft, wird `main` vor der finalen Integration in den Arbeitsbranch gemerged und erneut verifiziert.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- Corporate War oder Project Babylon andere Scoring-Voraussetzungen bekommen;
- Newsgroup Taunting Runs beendet oder fortsetzt, ohne die bisherige Zusatzkostenregel abzubilden;
- Disinfectant Virus-Counter außerhalb des bisherigen Fensters oder Limits verhindert;
- Hidden-Info über neue PublicPayloads, PlayerViews, Fehlertexte oder KI-Inputs sichtbar wird;
- finaler Merge fachlich unklare Konflikte erzeugt.

## State Machine

1. `process_defined`
2. `families_prioritized`
3. `scored_agenda_refactored`
4. `run_start_tax_refactored`
5. `counter_prevention_refactored`
6. `hidden_zone_followup_planned`
7. `guard_and_tests_verified`
8. `merged_to_main`

## Paketfolge

### P0 - Prozessartefakt

- Ziel: Scope, Reihenfolge, Gates und `/Goal` sichern.
- Arbeit: Dieses Dokument erstellen.
- Kernartefakte: `docs/architecture/engine/card-function-rest-families-process-2026-06-21.md`.
- Checks: `git diff --check`.
- Done-Gate: Artefakt committed.
- Commit: `docs: define card function rest families process`

### P1 - Reststellen nach Funktionsfamilien priorisieren

- Ziel: Die 271 Known-Findings in nächste technische Familien schneiden.
- Arbeit: Review auswerten; Priorisierungsartefakt mit Ziel-Kinds, Ziel-State, Risiko, Abhängigkeiten und Umsetzungsempfehlung erstellen.
- Kernartefakte: `docs/reviews/engine/card-function-rest-family-prioritization-2026-06-21.md`.
- Checks: `corepack pnpm check:card-function-abstraction`, `git diff --check`.
- Done-Gate: Corporate War/Project Babylon, Newsgroup Taunting, Disinfectant und Hidden-Zone-Familie sind klar getrennt; keine Engine-Logik geändert.
- Commit: `docs: prioritize card function rest families`

### P2 - Corporate War / Project Babylon

- Ziel: Scored-Agenda-Sonderpfade auf generische Familiennamen heben.
- Arbeit: CardImplementation-Kinds, Scored-Agenda-Runtime und Tests so anpassen, dass Corporate War über `score_credit_swing_if_corp_credit_threshold_met` und Project Babylon über `overadvance_bonus_agenda_points` laufen.
- Kernartefakte: Ability-/CardImplementation-Typen, Agenda-Implementierungen, Scored-Agenda-Resolver/Registry, Tests.
- Checks: fokussierte Scored-Agenda-Tests, Engine-Typecheck, Guard, `git diff --check`.
- Done-Gate: Corporate War und Project Babylon verhalten sich unverändert; keine `corporate_war`-/`project_babylon`-Runtime-Semantik außerhalb erlaubter Katalog-/Testkontexte.
- Commit: `engine: generalize scored agenda function families`

### P3 - Newsgroup Taunting Run-Start-Tax

- Ziel: Newsgroup Taunting auf neutrale Run-Start-Tax-Runtime-/Payload-Semantik ziehen.
- Arbeit: Run-Start-Tax-Quellen generisch aggregieren; Payload-Felder und Runtime-Helper neutralisieren; Tests aktualisieren.
- Kernartefakte: Newsgroup-Taunting-Implementation, Run-Start-/Runner-Main-Action-Pfade, Runtime-Hosts, PublicPayload-Allowlist, Tests.
- Checks: fokussierte Newsgroup-Taunting-/Run-Start-Tax-Tests, Engine-Typecheck, Guard, `git diff --check`.
- Done-Gate: Runner zahlt weiterhin `[1]` zusätzlich oder der Run endet; mehrere Tax-Quellen bleiben deterministisch aggregierbar; keine Newsgroup-spezifische Runtime-Semantik außerhalb erlaubter Kontexte.
- Commit: `engine: generalize run start tax payloads`

### P4 - Disinfectant Counter-Prevention-Replacement

- Ziel: Disinfectant auf generische Counter-Prevention-Replacement-Semantik mit neutralem Usage-Ledger ziehen.
- Arbeit: Counter-Prevention-Quelle und Usage-State neutralisieren; CardImplementation-Kind generisch benennen; Tests aktualisieren.
- Kernartefakte: Ability-/CardImplementation-Typen, Disinfectant-Implementation, State-/Turn-Resolver, Counter-Prevention-Tests.
- Checks: fokussierte Disinfectant-/Counter-Prevention-Tests, Engine-Typecheck, Guard, `git diff --check`.
- Done-Gate: Corp kann weiterhin einmal pro Turn pro Quelle `[1]` zahlen, um einen Virus-Counter zu vermeiden; keine Disinfectant-spezifische Runtime-Semantik außerhalb erlaubter Kontexte.
- Commit: `engine: generalize counter prevention replacement`

### P5 - Hidden-Zone-Folgeprozess planen

- Ziel: Hidden-Zone-Reststellen bewusst aus dem Code-Scope herauslösen und als separaten Prozess vorbereiten.
- Arbeit: Planartefakt für Fortress Respecification, Social Engineering, New Blood und Shell Traders erstellen; Side-/Hidden-Info-Gates definieren.
- Kernartefakte: `docs/architecture/engine/card-function-hidden-zone-family-plan-2026-06-21.md`.
- Checks: `git diff --check`.
- Done-Gate: Hidden-Zone-Kandidaten sind mit Ziel-Kinds, Risiken und Folgepaketen dokumentiert; keine Hidden-Zone-Codeänderung.
- Commit: `docs: plan hidden zone card function family`

### P6 - Guard, Abschluss und Integration

- Ziel: Review-/Guard-Stand nach allen Slices kalibrieren und lokal nach `main` integrieren.
- Arbeit: Guard ausführen, Review JSON/Markdown bei erwarteter Drift regenerieren, Prozessabschluss dokumentieren, finale Checks, `main` integrieren, Worktree entfernen.
- Kernartefakte: Review JSON/Markdown, Prozessartefakt.
- Checks: `corepack pnpm check:card-function-abstraction`, fokussierte Engine-Tests, Engine-Typecheck, `git diff --check`, `git status --short`.
- Done-Gate: `main` enthält alle Paketcommits, ist sauber, und der Arbeits-Worktree ist entfernt.
- Commit: `docs: calibrate card function guard after rest families`

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Engine-Code: fokussierter Vitest-Slice und `corepack pnpm --filter @netgrid/engine typecheck`.
- Guard-Artefakte: `corepack pnpm check:card-function-abstraction`.
- Tests werden mit `corepack pnpm --filter @netgrid/engine exec vitest run ...` fokussiert, damit Vitest nicht versehentlich die ganze Suite ausführt.
- Nicht ausgeführte Checks werden im Abschluss benannt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/card-function-rest-families`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_CARD_FUNCTION_REST_FAMILIES`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen Merge genutzt.
- Jedes Paket wird separat committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Card-Function-Rest-Families-Prozess vollständig und sequenziell von P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARD_FUNCTION_REST_FAMILIES auf Branch codex/card-function-rest-families. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- P0 bis P6 sind committed.
- Finaler Merge nach `main` ist lokal erfolgt.
- Arbeits-Worktree ist entfernt.
- Corporate War/Project Babylon, Newsgroup Taunting und Disinfectant sind neutralisiert oder ein Blocker ist dokumentiert.
- Hidden-Zone-Familie ist als eigener Folgeprozess geplant, aber nicht vermischt.

## Abschlussstand vor Integration

Stand nach P5 und vor lokalem Merge:

- Guard-Baseline: `Card function abstraction inventory matches 199 baseline findings`.
- Corporate War / Project Babylon: generische Scored-Agenda-Familien `score_credit_swing_if_corp_credit_threshold_met` und `overadvance_bonus_agenda_points`.
- Newsgroup Taunting: generische `run_start_tax`-Familie mit neutralen `runStartTaxCredits` / `runStartTaxSourceDefinitionIds`.
- Disinfectant: generische `counter_prevention_replacement`-Familie mit neutralem `counterPreventionUsedSourceIdsThisTurn` / `counterPreventionCreditsPaid`.
- Hidden-Zone-Familie: separates Planartefakt `docs/architecture/engine/card-function-hidden-zone-family-plan-2026-06-21.md`.

Ausgeführte Checks:

- `corepack pnpm check:card-function-abstraction`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda/sequence-contract.test.ts src/game/turn/runner-main-actions.test.ts src/game/turn/main-action-hosts.test.ts src/game/run/start-run-action-execution.test.ts src/game/run/run-duration-payment.test.ts src/game/run/run-end-cleanup.test.ts src/game/run/run-flow-hosts.test.ts src/game/run/run-access-legal-action-hosts.test.ts src/game/state/turn-flags-counters.test.ts src/game/turn/corp-main-actions.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/per-card-longtail.test.ts -t "Corporate War"`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/agenda-global-random.test.ts -t "Newsgroup Taunting"`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/agenda-scorearea-recurring.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/assets-nodes-upgrades.test.ts src/index-tests/releases/card-release-smokes.test.ts src/index-tests/originalset/trace-prevention-assets.test.ts -t "Disinfectant"`
