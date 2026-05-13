# V1.9.22 Test Matrix

Stand: 2026-05-13
Status: planned

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 47 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.22-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Resolver | Jede Karte hat Adapter oder Blocker | Runtime-Definitionen fuer 9 Runner-Hardware-, 10 Runner-Event- und 6 Corp-Longtail-Zielkarten; `If You Want It Done Right...` hat einen privaten Stack-Top-5-Resolver, `misc.for-sale` einen privaten Installed-Trash-Resolver, `Open-Ended Mileage Program` einen Tag-Removal-/Return-Resolver, `Organ Donor` einen privaten Grip-Trash-Resolver, die uebrigen Events behalten No-`play_event`-Promotion-Guards |
| Runner-Programme | Programminstallation, MU und Breaker-Werte nur mit lokaler Wertbasis | Readiness Review und Engine-Guards halten 14/14 Programmkarten aus `playable_mvp` und ohne `install_card`-/`pump_breaker`-/`break_subroutine`-LegalActions, bis Werte bestaetigt sind |
| Corp-Longtail | Agenda-, ICE- und Operationskarten nur mit konkreten Resolvern | `Corporate Retreat`, `Corporate War`, `Marine Arcology`, `Political Overthrow`, `Off-Site Backups` und `Planning Consultants` haben enge Runtime-Resolver; Engine-Guard haelt die verbleibenden 8/14 Corp-Longtailkarten aus `playable_mvp`, bis vollstaendige Zahlen-/Timing-/Kostenvertraege vorliegen |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Choices revalidiert | 9/9 Runner-Hardware-Install-LegalActions sowie `If You Want It Done Right...`, `misc.for-sale`, `Open-Ended Mileage Program`, `Organ Donor`, `Corporate Retreat`, `Corporate War`, `Marine Arcology`, `Political Overthrow`, `Off-Site Backups` und `Planning Consultants` inkl. Wrong-Side-/Stale-Revalidation gruen |
| Visibility | Keine Hidden-Info-Leaks ueber PlayerViews/PublicEvents/Reconnect/Undo | 9/9 Runner-Hardware-Install-PublicPayloads/PlayerViews sowie If-You-Want-It-Done-Right-/misc-for-sale-/Open-Ended-Mileage-Program-/Organ-Donor-/Corporate-Retreat-/Corporate-War-/Marine-Arcology-/Political-Overthrow-/Off-Site-Backups-/Planning-Consultants-PublicPayloads gruen |
| Replay/StateHash | Neue Effekte sind deterministisch replaybar | 9/9 Runner-Hardware-Install-Replay/StateHash sowie If-You-Want-It-Done-Right-/misc-for-sale-/Open-Ended-Mileage-Program-/Organ-Donor-/Corporate-Retreat-/Corporate-War-/Marine-Arcology-/Political-Overthrow-/Off-Site-Backups-/Planning-Consultants-Replay/StateHash gruen |
| AI | Hints, Smokes und side-sichere Fallbacks fuer alle `ai_supported` Karten | No-Promotion-Guard fuer 47/47 WIP-Karten gruen; finale V1.9.22-AI-Promotion-Artefakte muessen bis zum Completion-Gate fehlen |
| WIP-Artefakte | Manifest, Mechanics-Coverage und WIP-Szenario bleiben exakt zur 47er-Zielmenge und behaupten keine Promotion | Catalog-Artefakt-Alignment-Guard gruen |
| Resolver-Verträge | Fehlende lokale Vertragsfelder sind sichtbar, keine Cluster- oder Per-card-Promotion ohne Vollvertrag | Resolver-Contract-Inventar fuer 6/6 Cluster gruen; Per-card-Resolververtragsmatrix fuer 47/47 Karten gruen; lokale Kartenfaktenbasis fuer 47/47 Karten angelegt; lokal bestaetigte Teilnotizen sind scope-geprueft und nicht-promotend |
| Completion Gate | Offene Abschlussgates bleiben maschinenlesbar und verhindern Cursor-Fortschritt | `data/reports/v1922-completion-gate-status.json` gruen; Release bleibt `blocked_open` |
| Server/Web | Webclient-Version erst bei Abschluss | Web-Catalog-No-Promotion- und Webclient-Version-Guard gruen; Webclient-Version bleibt Folgearbeit fuer Abschluss |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Gruen nach Runtime-Resolver-WIP: engine 288, catalog 44, ai 86, server 72, web 79, typecheck, test, lint und build; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung |

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`

## Breiter WIP-Verify 2026-05-13 17:35 CEST

- JSON-Validation fuer `data/**/*.json`: pass, 302 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests nach Runner-Programm-No-Playable-/No-LegalAction- und Corp-Longtail-No-Playable-Runtime-Guards.

## Runner-Programm-No-LegalAction-Guard 2026-05-13 18:00 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests.
- Zusatzabdeckung: 14/14 V1.9.22-Runner-Programmkarten oeffnen ohne lokal bestaetigte Kosten-/MU-/Breakerwerte keine `install_card`-, `pump_breaker`- oder `break_subroutine`-LegalActions.
- Runner-Event-Readiness ist dokumentiert; kein `play_event`-Resolver wurde ohne vollstaendigen lokalen Vertrag erfunden.
- Corp-Longtail-Readiness ist dokumentiert; kein Agenda-, ICE- oder Operations-Resolver wurde ohne vollstaendigen lokalen Vertrag erfunden.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 77 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Zusatzschnitt: `Planning Consultants` privater R&D-Top-5-Reorder-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 281 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- Zusatzschnitt: `Off-Site Backups` privater Archives-to-HQ-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 282 Tests.
- Zusatzschnitt: `Corporate Retreat` scored-agenda Gain 6 bis Korp-Install/-Rez.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 283 Tests.
- Zusatzschnitt: `Marine Arcology` scored-agenda Gain 1.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 284 Tests.
- Zusatzschnitt: `If You Want It Done Right...` privater Stack-Top-5-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 285 Tests.
- Zusatzschnitt: `Organ Donor` privater Grip-Trash-Economy-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender PublicPayload-Zaehlung, danach pass, 286 Tests.
- Breiter Verify nach `Organ Donor`: `catalog` 44, `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Zusatzschnitt: `misc.for-sale` privater Installed-Trash-Economy-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Testzugriff auf eine interne Hilfsfunktion, danach pass, 287 Tests.
- Breiter Verify nach `misc.for-sale`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Zusatzschnitt: `Open-Ended Mileage Program` entfernt einen Tag kostenlos und oeffnet bei Runner-Credits einen public optionalen Return-to-Grip-Choice fuer 1 Credit.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 288 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen fehlender Resolver-Family-Erwartung, danach pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: initial rot wegen zu breiter Choice-Auswahl-Typisierung, danach pass.
- Breiter Verify nach `Open-Ended Mileage Program`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## WIP-Artefakt-Alignment-Guard 2026-05-13 18:10 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 37 Tests.
- Zusatzabdeckung: `data/manifests/card-implementation-manifest-1.9.22.json`, `data/scenarios/v1922-per-card-longtail-wip-smoke.json` und `data/rules/mechanics-coverage-1.9.22.json` muessen exakt die 47 Karten aus `ONR_V1_9_22_WIP_CARD_IDS` abdecken.
- Zusatzabdeckung: neun Hardwarekarten muessen Install-Smokes, zehn Eventkarten den No-`play_event`-Guard und 28 Program-/Corp-Karten `planned_no_promotion` ausweisen.
- Zusatzabdeckung: Catalog-/AI-Promotion bleibt in Manifest, Szenario, Coverage und Runtime-Catalog fuer alle 47 Karten false.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests inkl. Guard, dass 47/47 V1.9.22-WIP-Karten nicht `ai_supported`, `human_playable` oder `deck_legal` sind.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests inkl. Guard, dass 47/47 V1.9.22-WIP-Karten nicht im `ai_supported`-Filter erscheinen, sichtbare Detailantworten nicht promotet sind und der Webclient vor Abschluss weiter `V1.9.21` zeigt.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.

## Resolver-Contract-Inventar 2026-05-13 18:25 CEST

- Neues Artefakt: `data/rules/v1922-resolver-contract-inventory.json`.
- Zusatzabdeckung: sechs Cluster (`runner_programs`, `runner_events`, `runner_hardware`, `corp_agendas`, `corp_ice`, `corp_operations`) decken exakt 47/47 V1.9.22-WIP-Karten ab.
- Zusatzabdeckung: kein Cluster ist `ready_for_promotion`; alle Cluster haben bestaetigte Felder, fehlende Felder und aktuelle sichere No-Promotion-/Guard-Abdeckung.
- JSON-Validation fuer `data/**/*.json`: pass, 303 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 38 Tests.

## Resolver-Teilnotizen 2026-05-13 18:30 CEST

- `data/rules/v1922-resolver-contract-inventory.json` fuehrt lokal bestaetigte Teilnotizen aus `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md` fuer Runner-Programme, Runner-Events, Runner-Hardware und Corp-Agendas.
- Zusatzabdeckung: Jede `partialLocalNotes`-Karte muss im jeweiligen Cluster und in `ONR_V1_9_22_WIP_CARD_IDS` liegen.
- Zusatzabdeckung: Teilnotizen duerfen keine `ready_for_promotion`-, `ai_supported`-, `deck_legal`- oder `human_playable`-Aussage enthalten.
- JSON-Validation fuer `data/**/*.json`: pass, 303 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 38 Tests.

## AI-Promotion-Artefakt-Abwesenheit 2026-05-13 18:35 CEST

- `packages/catalog/src/index.test.ts` prueft, dass `data/ai/ai-card-hints-deck-legal-v1922.json`, `data/manifests/deck-legal-ai-approval-v1922-manifest.json` und `data/scenarios/ai-deck-legal-v1922-smokes.json` vor dem Completion-Gate nicht existieren.
- Zusatzabdeckung: Eine versehentliche AI-Promotion kann dadurch nicht nur ueber Kartendaten, sondern auch ueber finale V1.9.22-AI-Artefaktnamen auffallen.

## Completion-Gate-Statusreport 2026-05-13 18:40 CEST

- Neues Artefakt: `data/reports/v1922-completion-gate-status.json`.
- Zusatzabdeckung: Status bleibt `blocked_open`, `releaseDone` bleibt false und die Scope-Promotionflags bleiben false.
- Zusatzabdeckung: Die letzte lokale Vertragsquellensuche ist als `no_complete_resolver_contract_found` dokumentiert und verweist auf die bestaetigten Teilquellen.
- Zusatzabdeckung: Vier blockierende Gates (`resolver_contracts`, `ai_promotion_artifacts`, `webclient_version`, `final_review`) haben jeweils eine Removal Condition.
- JSON-Validation fuer `data/**/*.json`: pass, 304 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 40 Tests.

## Resolververtragsmatrix 2026-05-13 19:25 CEST

- Neue Artefakte: `docs/derived/V1_9_22_RESOLVER_CONTRACT_MATRIX.md` und `data/rules/v1922-resolver-contracts.json`.
- Zusatzabdeckung: 47/47 V1.9.22-WIP-Karten sind einzeln mit `confirmedLocalFacts`, `safeCurrentCoverage`, `missingInformation` und `removalCondition` erfasst.
- Zusatzabdeckung: `readyForPromotionCount` und `readyForNewResolverImplementationCount` bleiben 0; neun Hardwarekarten sind nur als Installations-Basisvertrag abgedeckt.
- Zusatzabdeckung: `data/reports/v1922-completion-gate-status.json` verweist per `latestContractMatrix` auf die Matrix, ohne Runtime-, Catalog- oder AI-Promotion zu behaupten.
- JSON-Validation fuer `data/**/*.json`: pass, 305 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 41 Tests.

## Statusalignment 2026-05-13 19:41 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 41 Tests.
- Keine neue Karte wurde promotet; der offene V1.9.22-Blocker bleibt unverändert.

## Lokale Resolver-Arbeitsgrundlage 2026-05-13 19:58 CEST

- Neue Artefakte: `docs/derived/V1_9_22_LOCAL_RESOLVER_WORKING_BASIS.md` und `data/rules/v1922-local-resolver-working-basis.json`.
- Zusatzabdeckung: Private lokale Kontrollquellen aus dem Hauptworkspace werden als versionierte Arbeitsgrundlage referenziert, ohne Volltexte breit zu versionieren.
- Zusatzabdeckung: `Corporate War` und `Political Overthrow` sind als enge V1.9.22-Resolver-Implementierungskandidaten dokumentiert; `Political Overthrow` ist nach Nutzerbestaetigung auf `Gain 3` entschieden.
- Zusatzabdeckung: `data/reports/v1922-completion-gate-status.json` verweist per `latestLocalWorkingBasis` auf die neue Arbeitsgrundlage; Runtime-, Catalog- und AI-Promotion bleiben unveraendert false.
- Catalog-Guard: Arbeitsgrundlage prueft die zwei Kandidaten, den 0-Promotion-Status, die Political-Overthrow-Konfliktentscheidung und die fuenf bewusst vertagten Kandidaten.
- JSON-Validation fuer `data/**/*.json`: pass, 306 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 42 Tests.
- Blocker-Status: Der alte Befund "keine implementierbare lokale Grundlage fuer irgendeinen V1.9.22-Zielpfad" ist fuer zwei enge Pfade aufgehoben; V1.9.22 bleibt aber bis Engine-/Manifest-/Coverage-/AI-/Web-/Final-Gates offen.

## Lokale Kartenfaktenbasis 2026-05-13 20:20 CEST

- Neue Artefakte: `docs/derived/V1_9_22_LOCAL_CARD_FACTS_WORKING_BASIS.md` und `data/rules/v1922-local-card-facts.json`.
- Zusatzabdeckung: 47/47 V1.9.22-WIP-Karten haben eine versionierte lokale Faktenbasis mit knapper Effektzusammenfassung, Zahlenfeldern und noch benoetigten Implementierungsvertraegen.
- Zusatzabdeckung: 0 offene Attributkonflikte; `Political Overthrow` ist in der Faktenbasis als Nutzerkorrektur `Gain 3` festgehalten.
- Zusatzabdeckung: `Corporate War` und `Political Overthrow` sind als enge Implementierungskandidaten markiert; keine Karte wird dadurch runtime-, catalog- oder AI-promotet.
- Zusatzabdeckung: `data/reports/v1922-completion-gate-status.json` verweist per `latestLocalCardFacts` auf die neue Arbeitsgrundlage.
- JSON-Validation fuer `data/**/*.json`: pass, 308 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.

## Corp-Agenda-Runtime-Resolver 2026-05-13 20:42 CEST

- Runtime-WIP: `Corporate War` und `Political Overthrow` haben jetzt enge Engine-Resolver, ohne Catalog-, AI- oder Release-Promotion.
- Zusatzabdeckung `Corporate War`: On-score-Schwelle 12 Credits; bei Treffer Gain 12, sonst alle Credits verlieren; Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash.
- Zusatzabdeckung `Political Overthrow`: scored-agenda LegalAction `[A]: Gain 3`; Kostenabzug, Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 280 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- JSON-Validation fuer `data/**/*.json`: pass, 308 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

