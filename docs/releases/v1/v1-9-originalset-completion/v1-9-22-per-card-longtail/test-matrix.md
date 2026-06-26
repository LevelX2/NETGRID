# V1.9.22 Test Matrix

Stand: 2026-05-14
Status: planned

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 47 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.22-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Resolver | Jede Karte hat Adapter oder Blocker | Runtime-Definitionen fuer 9 Runner-Hardware-, 10 Runner-Event-, 14 Runner-Programm- und 14 Corp-Longtail-Zielkarten; neu: `Viral 15` Jack-out-Tax und Program-trash-Choice |
| Runner-Programme | Programminstallation, MU und Breaker-Werte nur mit lokaler Wertbasis | Sieben nicht-Breaker-Programme sind install-only umgesetzt; `Zetatech Software Installer` hat 2 restricted Recurring Credits fuer Programminstallationen plus Refresh und Overwrite per Trash-vor-Install; `Newsgroup Filter` ist mit Installation plus `[A]: Gain 2 Credits` umgesetzt; `Shield` ist als enger Install-/Net-Damage-Prevention-WIP umgesetzt; `Flak`, `Hammer`, `Japanese Water Torture` und `Reflector` haben enge Breaker-Smokes; offene Punkte sind AI-, Catalog- und Release-Promotion-Gates |
| Corp-Longtail | Agenda-, ICE- und Operationskarten nur mit konkreten Resolvern | `Corporate Retreat`, `Corporate War`, `Data Fort Reclamation`, `Marine Arcology`, `Political Overthrow`, `Security Purge`, `Haunting Inquisition`, `Zombie`, `Tutor`, `Viral 15`, `Virizz`, `Edgerunner, Inc., Temps`, `Off-Site Backups` und `Planning Consultants` haben enge Runtime-WIP-Resolver; Release-Promotion bleibt bis Final-Gates geschlossen |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Choices revalidiert | 9/9 Runner-Hardware-Install-LegalActions, sieben install-only Runner-Programme, `Zetatech Software Installer` Recurring-Installationskosten, `Shield`, `Flak`, `Hammer`, `Japanese Water Torture`, `Reflector`, alle 10 Runner-Event-Resolver und alle 14 Corp-Longtail-Resolver inkl. `Viral 15` Jack-out-Kosten und Runner-privater Program-trash-Choice gruen |
| Visibility | Keine Hidden-Info-Leaks ueber PlayerViews/PublicEvents/Reconnect/Undo | 9/9 Runner-Hardware-Install-PublicPayloads/PlayerViews, sieben install-only Runner-Programme, `Zetatech Software Installer`, `Shield`-Prevention-Choice, `Flak`-/`Hammer`-/`Japanese Water Torture`-/`Reflector`-PublicPayloads sowie alle 10 Runner-Event-Resolver- und 14 Corp-Longtail-PublicPayloads gruen; `Viral 15` zeigt dem Public-Payload nur Count-/Kontextdaten |
| Replay/StateHash | Neue Effekte sind deterministisch replaybar | 9/9 Runner-Hardware-Install-Replay/StateHash, sieben install-only Runner-Programm-Replay/StateHash-Pfade, `Zetatech Software Installer` Recurring-Credit-Replay/StateHash, `Shield`-Prevention-Replay/StateHash, `Flak`-/`Hammer`-/`Japanese Water Torture`-/`Reflector`-Replay/StateHash sowie alle 10 Runner-Event-Resolver- und 14 Corp-Longtail-Replay/StateHash-Pfade gruen |
| AI | Hints, Smokes und side-sichere Fallbacks fuer alle `ai_supported` Karten | No-Promotion-Guard fuer 47/47 WIP-Karten gruen; finale V1.9.22-AI-Promotion-Artefakte muessen bis zum Completion-Gate fehlen |
| WIP-Artefakte | Manifest, Mechanics-Coverage und WIP-Szenario bleiben exakt zur 47er-Zielmenge und behaupten keine Promotion | Catalog-Artefakt-Alignment-Guard gruen |
| Resolver-Verträge | Fehlende lokale Vertragsfelder sind sichtbar, keine Cluster- oder Per-card-Promotion ohne Vollvertrag | Resolver-Contract-Inventar fuer 6/6 Cluster gruen; Per-card-Resolververtragsmatrix fuer 47/47 Karten gruen; lokale Kartenfaktenbasis fuer 47/47 Karten angelegt; lokal bestaetigte Teilnotizen sind scope-geprueft und nicht-promotend |
| Completion Gate | Offene Abschlussgates bleiben maschinenlesbar und verhindern Cursor-Fortschritt | `data/reports/v1922-completion-gate-status.json` gruen; Release bleibt `blocked_open` |

Update 2026-05-14 20:15 CEST: V1.9.22 ist final promotet. Completion-Gate-Status ist `complete`; alle 47 Zielkarten sind `human_playable`, `deck_legal` und `ai_supported`. Neue Abschlussartefakte: `data/scenarios/v1922-per-card-longtail-release-smoke.json`, `data/ai/ai-card-hints-deck-legal-v1922.json`, `data/manifests/deck-legal-ai-approval-v1922-manifest.json`, `data/scenarios/ai-deck-legal-v1922-smokes.json` und `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/final-review.md`. Checks: JSON 312, catalog 44, engine 309, ai 86, server 72, web 80, typecheck, test, lint und build gruen; Build nur mit bekannter Turbopack-NFT-Warnung. Der erste breite `test`-Lauf hatte einen nicht reproduzierbaren Server-Vitest-Worker-Exit; isolierter `server` und der wiederholte breite `test` waren gruen.

Update 2026-05-14 17:06 CEST: `Security Purge` ist als nicht-promotender WIP in der Engine-Matrix. Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::scores Security Purge as a side-safe R&D top-three install and trash resolver`; `engine` gruen mit 303 Tests, `catalog` gruen mit 44 Tests.
Update 2026-05-14 17:25 CEST: `Hammer` hat die offene Mehrfach-Stealth-Verteilungschoice als nicht-promotenden WIP erhalten. Neuer Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::opens a private Hammer Stealth-loss distribution choice for multiple sources`; erster `engine`-Lauf rot wegen fehlender `postBreakStealthLoss`-Spiegelung im Choice-PublicPayload, danach `engine` gruen mit 304 Tests und `catalog` gruen mit 44 Tests.
Update 2026-05-14 17:35 CEST: `Haunting Inquisition` ist als nicht-promotender Corp-ICE-WIP in der Engine-Matrix. Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::rezzes Haunting Inquisition and locks normal runs for the next six Runner actions`; `engine` gruen mit 305 Tests, `catalog` nach Manifest-Korrektur gruen mit 44 Tests.
Update 2026-05-14 17:43 CEST: `Zetatech Software Installer` hat restricted Recurring Credits fuer Programminstallationen und Runner-Zugstart-Refresh als nicht-promotenden WIP erhalten. Neuer Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::uses Zetatech Software Installer recurring credits for program installs and refreshes`; erster `engine`-Lauf rot wegen fehlender V0.99-Baseline im Refresh-Smoke, danach `engine` gruen mit 306 Tests.
Update 2026-05-14 18:01 CEST: `Data Fort Reclamation` hat eine Korp-private HQ-Install-Sequence als nicht-promotenden WIP erhalten. Neuer Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::scores Data Fort Reclamation as a private HQ install sequence`; erster `engine`-Lauf rot wegen fehlender Runtime-Definition und Guards, danach `engine` gruen mit 307 Tests, `catalog` 44 und `typecheck` gruen.
Update 2026-05-14 19:27 CEST: `Viral 15` hat einen nicht-promotenden Corp-ICE-Runtime-WIP mit run-weitem 1-Credit-Jack-out-Tax und Runner-privater Programmtrash-Choice nach dem Passieren gerezzter ICE erhalten. Neuer Test: `packages/engine/src/index.test.ts::V1.9.22 Per-card Longtail WIP::rezzes Viral 15 and gates pass-ice program trash behind a paid jack-out window`; erster `engine`-Lauf rot wegen fehlender V0.99-Jack-out-Window-Baseline im Smoke, danach `engine` gruen mit 308 Tests. `catalog` war initial rot wegen ueberholter geplanter-Karte-Erwartung, danach gruen mit 44 Tests; `typecheck` gruen.
Update 2026-05-14 19:43 CEST: `Data Fort Reclamation` hat den Rez-/Credit-Follow-up erhalten. Der bestehende Smoke deckt jetzt nach der privaten HQ-Install-Sequence ein zweites Korp-privates Rez-Fenster, temporaeren Creditverbrauch zuerst, Korp-Credit-Fallback, Wrong-Side-Revalidation, side-sichere PublicPayloads und Replay/StateHash ab; `typecheck`, `engine` 308 und `catalog` 44 gruen.
Update 2026-06-26: `Zetatech Software Installer` hat einen korrigierten Overwrite-Runtime-WIP nach `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/zetatech-overwrite-runtime-contract.md`. Der Smoke deckt Trash-vor-Install, Wrong-Side/Stale, Recurring-Credit-Zahlung vor dem Trash, normale ungehostete Installation, PublicPayload und Replay/StateHash ab.
| Server/Web | Webclient-Version erst bei Abschluss | Web-Catalog-No-Promotion- und Webclient-Version-Guard gruen; Webclient-Version bleibt Folgearbeit fuer Abschluss |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | Historisch gruen nach V1.9.22-Abschluss: engine 309, catalog 44, ai 86, server 72, web 79, typecheck, test, lint und build; Build nur mit bekannter Turbopack-NFT-Warnung |

## Tutor 2026-05-14 16:51 CEST

- Zusatzschnitt: `Tutor` ist als Corp-ICE-Runtime-WIP mit Rez-Kosten 4, Stärke 5 und future-encounter End-the-run-Subroutine-Modifier umgesetzt.
- Zusatzabdeckung: Rez, Subroutine-Auflösung, spätere synthetische Zusatz-ETR-Subroutine, Breakbarkeit, Wrong-Side-/Stale-Revalidation, PublicPayload/PlayerViews und Replay/StateHash. Keine Catalog-/AI-/Release-Promotion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 302 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- Breiter Verify nach `Tutor`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen. Build nur mit bekannter Turbopack-NFT-Warnung.

## Viral 15 2026-05-14 19:27 CEST

- Zusatzschnitt: `Viral 15` ist als Corp-ICE-Runtime-WIP mit Rez-Kosten 5, Stärke 3, run-weitem +1-Credit-Jack-out-Tax und Runner-privater Programmtrash-Choice nach dem Passieren gerezzter ICE umgesetzt.
- Zusatzabdeckung: Rez, Subroutine-Auflösung, Jack-out-Kostenprojektion, Program-trash-Choice nur beim Weiterlaufen, Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash. Keine Catalog-/AI-/Release-Promotion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender V0.99-Baseline im Jack-out-Smoke, danach pass, 308 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen ueberholter geplanter-Karte-Erwartung, danach pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.

## Data Fort Reclamation Rez/Credits 2026-05-14 19:43 CEST

- Zusatzschnitt: `Data Fort Reclamation` oeffnet nach der privaten HQ-Install-Sequence ein zweites Korp-privates Rez-Fenster fuer neu installierte ICE/Root-Karten.
- Zusatzabdeckung: temporaere Rez-Credits werden zuerst verbraucht, Korp-Credits dienen als Fallback, PublicPayloads bleiben count-/credit-only und Replay/StateHash-stabil. Keine Catalog-/AI-/Release-Promotion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 308 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.

## Virizz 2026-05-14 16:40 CEST

- Zusatzschnitt: `Virizz` ist als Corp-ICE-Runtime-WIP mit Rez-Kosten 2, Stärke 4 und rest-of-run Break-Kostenmodifier umgesetzt.
- Zusatzabdeckung: Rez, Subroutine-Auflösung, +1-Credit-Projektion auf nachfolgende `break_subroutine`-LegalActions, Wrong-Side-/Stale-Revalidation, PublicPayload/PlayerViews und Replay/StateHash. Keine Catalog-/AI-/Release-Promotion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Test-Phasenannahmen, danach pass, 301 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- Breiter Verify nach `Virizz`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; erster breiter `test`-Lauf war nur wegen parallel laufendem Lint/Server-Vitest-Worker rot und wurde isoliert gruen wiederholt. Build nur mit bekannter Turbopack-NFT-Warnung.

## Japanese Water Torture 2026-05-14 16:35 CEST

- Zusatzschnitt: `Japanese Water Torture` ist als Runner-Programm-Wall-Breaker-Runtime-WIP mit Installkosten 7, MU 1, Staerke 2, Pump fuer 1 Credit, Wall-Subroutine-Break fuer 0 Credits und Future-Action-Debt umgesetzt.
- Zusatzabdeckung: Install, Pump, Wall-Break, Wrong-Side-/Stale-Revalidation, Debt-Abtrag nach Run-Ende und im naechsten Runner-Zug, PublicPayload/PlayerViews und Replay/StateHash. Keine Catalog-/AI-/Release-Promotion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender Runtime-Definition und ueberholter Guards, danach pass, 300 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter Turbopack-NFT-Warnung.

## Hammer 2026-05-14 15:54 CEST

- Zusatzschnitt: `Hammer` ist als Runner-Programm-Wall-Breaker-Runtime-WIP mit Installkosten 2, MU 1, Staerke 2, Pump fuer 1 Credit, Wall-Subroutine-Break fuer 1 Credit, deterministischem Stealth-Counter-Verlust bei einzelner Quelle und Runner-privater Verteilungschoice bei mehreren Stealth-Quellen umgesetzt.
- Zusatzabdeckung: Install, Pump, Break, Wrong-Side-/Stale-Revalidation, Stealth-Counter-Wirkung, Choice-Visibility, PublicPayload/PlayerViews und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 301 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter Turbopack-NFT-Warnung.
- Follow-up 2026-05-14 17:25 CEST: `engine` initial rot wegen fehlender Choice-PublicPayload-Spiegelung, danach pass mit 304 Tests; `catalog` pass mit 44 Tests.

## Nicht-Breaker-Programme 2026-05-14 01:00 CEST

- Zusatzschnitt: `Poltergeist`, `Rabbit`, `Scatter Shot`, `Speed Trap` und `Startup Immolator` sind als install-only Runner-Programm-Runtime-WIPs umgesetzt.
- Zusatzabdeckung: Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, keine Kartenfaehigkeit ohne spezifischen Vertrag, PublicPayload/PlayerViews und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## False Echo und Netspace Inverter 2026-05-14 00:55 CEST

- Zusatzschnitt: `False Echo` und `Netspace Inverter` sind als install-only Runner-Programm-Runtime-WIPs mit Installkosten 0 und MU 1 umgesetzt.
- Zusatzabdeckung: Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, keine Successful-Run-Faehigkeit ohne Trigger-/Sequenzvertrag, PublicPayload/PlayerViews und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Newsgroup Filter 2026-05-14 00:45 CEST

- Zusatzschnitt: `Newsgroup Filter` ist als Runner-Programm-Runtime-WIP mit Installkosten 5, MU 2 und `[A]: Gain 2 Credits` umgesetzt.
- Zusatzabdeckung: Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, keine Credit-Gain-Ability-LegalAction ohne Aktivierungsvertrag, PublicPayload/PlayerViews und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Flak / Reflector 2026-05-14 15:30 CEST

- Zusatzschnitt: `Flak` ist als AP-Breaker-Runtime-WIP mit Installkosten 4, MU 1, Staerke 2, Pump fuer 1 Credit und AP-Subroutine-Break fuer 1 Credit umgesetzt.
- Zusatzschnitt: `Reflector` ist als tagged-subroutine-Breaker-Runtime-WIP mit Installkosten 2, MU 1, Staerke 4 und 0-Credit-Break fuer `stun`, `hellbolt` oder `knockout` umgesetzt.
- Zusatzabdeckung: Install, Pump/Break bzw. tagged Break, Wrong-Side-/Stale-Revalidation, PublicPayload/PlayerViews und Replay/StateHash. Der erste `engine`-Lauf war rot wegen `Marine Arcology`-Klickkosten und wurde durch zweiten Klickabzug fuer `[A], [A]: Gain 3` behoben.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 300 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify: `ai` 86, `server` 72, `web` 79, `test` Exit 0, `lint` pass und `build` pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Zetatech Software Installer 2026-05-14 15:36 CEST

- Zusatzschnitt: `Zetatech Software Installer` ist als install-only Runner-Programm-Runtime-WIP mit Installkosten 0 und MU 1 umgesetzt.
- Zusatzabdeckung: Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, keine Restricted-Credit-/Overwrite-Faehigkeit ohne Vertrag, PublicPayload/PlayerViews und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 300 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Follow-up 2026-05-14 17:43 CEST: 2 restricted Recurring Credits fuer Programminstallationen und Runner-Zugstart-Refresh umgesetzt; Overwrite bleibt gated. `engine` initial rot wegen fehlender V0.99-Baseline im Refresh-Smoke, danach pass mit 306 Tests.

## Shield 2026-05-14 00:27 CEST

- Zusatzschnitt: `Shield` ist als Runner-Programm-Runtime-WIP mit Installkosten 0, MU 1 und bis zu 2 Net-Damage-Prevention pro Runner-Zug umgesetzt.
- Zusatzabdeckung: Install-LegalAction, Wrong-Side-Revalidation, side-sichere Prevention-Choice, PublicPayload und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 296 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`

## Valu-Pak Software Bundle 2026-05-13 23:45 CEST

- Zusatzschnitt: `Valu-Pak Software Bundle` gibt fuenf direkt anschliessende programminstallationsgebundene Runner-Aktionen und einen temporaeren Programminstallations-Credit.
- Zusatzabdeckung: Wrong-Side-/Stale-Revalidation, Sequenz-Restriktion auf Programminstallationen plus Zugende, temporaerer Credit-Verbrauch, side-sichere PublicPayloads und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 293 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Zombie 2026-05-13 23:55 CEST

- Zusatzschnitt: `Zombie` ist als Corp-ICE-Runtime-WIP mit Rez-Kosten 9, Stärke 4, zwei Core-Damage-Subroutinen und End-the-run umgesetzt.
- Zusatzabdeckung: Rez-LegalAction, Wrong-Side-/Stale-Revalidation, side-sichere öffentliche Run-Auflösung und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 294 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Edgerunner, Inc., Temps 2026-05-13 23:59 CEST

- Zusatzschnitt: `Edgerunner, Inc., Temps` gibt drei direkt anschliessende korpseitige Install-only-Aktionen.
- Zusatzabdeckung: Wrong-Side-/Stale-Revalidation, Sequenz-Restriktion auf Installationen plus Zugende, side-sichere PublicPayloads und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 295 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify danach: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

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
- Zusatzschnitt: `Corporate Retreat` scored-agenda Gain 2 bis Korp-Install/-Rez.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 283 Tests.
- Zusatzschnitt: `Marine Arcology` scored-agenda 2 Aktionen fuer Gain 3.
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
- Zusatzschnitt: `Anonymous Tip` public Choice zum Derezzen einer gerezzten Black ICE.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 289 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify nach `Anonymous Tip`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Zusatzschnitt: `Forged Activation Orders` public ICE-Positions-Target-Choice plus Korp-Rez-/Trash-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Testassertion auf interne CardInstance-ID im sichtbaren Choice-Objekt; nach PlayerView-Redaktion fuer public Choice-Optionen mit `publicLabel` pass, 290 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Zusatzschnitt: `Security Code WORM Chip` erfolgreicher-HQ-Run-Flag plus public unrezzte-ICE-Trash-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen dupliziertem Testdeck-Eintrag und danach wegen schon beendetem HQ-Run ohne `continue_run`; nach Testkorrektur pass, 291 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Zusatzschnitt: `Core Command: Jettison Ice` erfolgreicher-HQ-Run-Flag plus bezahlte public gerezzte-ICE-Trash-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 292 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify nach Runner-Event-Ice-Pressure-WIP: `ai` initial rot wegen zu breiter PlayerView-Redaktion fuer public Choice-Values; nach Begrenzung auf neue `ice_*`-Positionsoptionen pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Zusatzschnitt: `Synchronized Attack on HQ` erfolgreicher-HQ-Run-Flag plus private Korp-HQ-Retain-Choice mit 2-Credit-Kosten pro behaltener HQ-Karte.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Testhelper-Duplikat fuer gleiche HQ-Kartendefinition und fehlender PublicPayload-Weitergabe fuer `retainedCount`/`discardedCount`, danach pass, 293 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen unveraenderter `planned_no_promotion`-Zaehllogik, danach pass, 44 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify nach `Synchronized Attack on HQ`: `ai` pass (86), `server` pass (72), `web` pass (79), `test` pass (Exit 0), `lint` pass, `build` pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## WIP-Artefakt-Alignment-Guard 2026-05-13 18:10 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 37 Tests.
- Zusatzabdeckung: `data/manifests/card-implementation-manifest-1.9.22.json`, `data/scenarios/v1922-per-card-longtail-wip-smoke.json` und `data/rules/mechanics-coverage-1.9.22.json` muessen exakt die 47 Karten aus `ONR_V1_9_22_WIP_CARD_IDS` abdecken.
- Zusatzabdeckung: neun Hardwarekarten muessen Install-Smokes, zehn Runner-Event-Resolverkarten, zwei Runner-Programm-WIP-Karten, acht Corp-Longtail-Resolverkarten und 18 Program-/Corp-Restkarten `planned_no_promotion` ausweisen.
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

- `data/rules/v1922-resolver-contract-inventory.json` fuehrt lokal bestaetigte Teilnotizen aus `docs/releases/v1/card-releases/v1-0-5k-card-release/requirements.md` fuer Runner-Programme, Runner-Events, Runner-Hardware und Corp-Agendas.
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

- Neue Artefakte: `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/resolver-contract-matrix.md` und `data/rules/v1922-resolver-contracts.json`.
- Zusatzabdeckung: 47/47 V1.9.22-WIP-Karten sind einzeln mit `confirmedLocalFacts`, `safeCurrentCoverage`, `missingInformation` und `removalCondition` erfasst.
- Zusatzabdeckung: `readyForPromotionCount` bleibt 0, `readyForNewResolverImplementationCount` bleibt 2; neun Hardwarekarten sind nur als Installations-Basisvertrag abgedeckt.
- Zusatzabdeckung: `data/reports/v1922-completion-gate-status.json` verweist per `latestContractMatrix` auf die Matrix, ohne Runtime-, Catalog- oder AI-Promotion zu behaupten.
- JSON-Validation fuer `data/**/*.json`: pass, 305 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 41 Tests.

## Statusalignment 2026-05-13 19:41 CEST

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 41 Tests.
- Keine neue Karte wurde promotet; der offene V1.9.22-Blocker bleibt unverändert.

## Lokale Resolver-Arbeitsgrundlage 2026-05-13 19:58 CEST

- Neue Artefakte: `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/local-resolver-working-basis.md` und `data/rules/v1922-local-resolver-working-basis.json`.
- Zusatzabdeckung: Private lokale Kontrollquellen aus dem Hauptworkspace werden als versionierte Arbeitsgrundlage referenziert, ohne Volltexte breit zu versionieren.
- Zusatzabdeckung: `Corporate War` und `Political Overthrow` sind als enge V1.9.22-Resolver-Implementierungskandidaten dokumentiert; `Political Overthrow` ist nach Nutzerbestaetigung auf `Gain 3` entschieden.
- Zusatzabdeckung: `data/reports/v1922-completion-gate-status.json` verweist per `latestLocalWorkingBasis` auf die neue Arbeitsgrundlage; Runtime-, Catalog- und AI-Promotion bleiben unveraendert false.
- Catalog-Guard: Arbeitsgrundlage prueft die zwei Kandidaten, den 0-Promotion-Status, die Political-Overthrow-Konfliktentscheidung und die fuenf bewusst vertagten Kandidaten.
- JSON-Validation fuer `data/**/*.json`: pass, 306 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 42 Tests.
- Blocker-Status: Der alte Befund "keine implementierbare lokale Grundlage fuer irgendeinen V1.9.22-Zielpfad" ist fuer zwei enge Pfade aufgehoben; V1.9.22 bleibt aber bis Engine-/Manifest-/Coverage-/AI-/Web-/Final-Gates offen.

## Lokale Kartenfaktenbasis 2026-05-13 20:20 CEST

- Neue Artefakte: `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/local-card-facts-working-basis.md` und `data/rules/v1922-local-card-facts.json`.
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
