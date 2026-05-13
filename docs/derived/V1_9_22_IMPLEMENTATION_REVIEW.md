# V1.9.22 Implementation Review

Stand: 2026-05-13
Status: runtime WIP, no release/catalog/AI promotion

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 47 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_22_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.22 noch nicht im Runtime-Releasepool steht.
- WIP-Datenartefakte ohne Promotion sind angelegt: `data/scenarios/v1922-per-card-longtail-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.22.json` und `data/rules/mechanics-coverage-1.9.22.json`.
- Neun Runner-Hardware-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten, ohne Release- oder AI-Promotion: Arasaka Portable Prototype, Artemis 2020, Bodyweight Data Creche, Corolla Speed Chip, Microtech Backup Drive, Pandora's Deck, Parraline 5750, PK-6089a und ZZ22 Speed Chip.
- Alle neun Runner-Hardware-Zielkarten haben Install-LegalAction-Smokes mit Wrong-Side-/Stale-Revalidation, side-sicheren PublicPayload-/PlayerView-Assertions und Replay-/StateHash-Stabilitaet.
- Zehn Runner-Event-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten und konkrete Resolver-Smokes. `Anonymous Tip` hat einen public Choice zum Derezzen einer gerezzten Black ICE; `Core Command: Jettison Ice` setzt einen erfolgreichen HQ-Run im selben Zug voraus, zahlt die Rez-Kosten einer public gewaehlten gerezzten ICE und trasht sie; `Forged Activation Orders` hat einen public ICE-Positions-Target-Choice und anschliessend eine public Korp-Choice zum Rezzen gegen Rez-Kosten oder Trashen der ICE; `If You Want It Done Right...` hat einen privaten Stack-Top-5-Choice, der eine Karte in die Grip nimmt und die restlichen Topkarten anordnet; `misc.for-sale` hat einen privaten Installed-Trash-Choice fuer eigene installierte Karten und gewinnt 1 Credit pro getrashter Karte; `Open-Ended Mileage Program` entfernt einen Tag kostenlos und oeffnet bei Runner-Credits einen public optionalen Return-to-Grip-Choice fuer 1 Credit; `Organ Donor` hat einen privaten Grip-Trash-Choice fuer bis zu fuenf Karten und gewinnt 1 Credit pro getrashter Karte; `Security Code WORM Chip` setzt einen erfolgreichen HQ-Run im selben Zug voraus und trasht eine public gewaehlte unrezzte ICE-Position; `Synchronized Attack on HQ` setzt einen erfolgreichen HQ-Run im selben Zug voraus und oeffnet eine private Korp-HQ-Retain-Choice, bei der die Korp 2 Credits pro behaltener HQ-Karte zahlt und den Rest verdeckt discarded; `Valu-Pak Software Bundle` gibt fuenf direkt anschliessende programminstallationsgebundene Runner-Aktionen und einen temporaeren Programminstallations-Credit. Alle zehn Smokes decken Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash ab.
- `Corporate Retreat` hat eine Runtime-Definition und eine scored-agenda LegalAction: `[A]: Gain 6`. Die Aktion bleibt nur bis zur nächsten Korp-Installation oder zum nächsten Korp-Rez verfügbar; der Marker ist replay-/StateHash-stabil. Der Smoke deckt Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads, Install-/Rez-Verlust und Replay/StateHash ab.
- `Corporate War` hat eine Runtime-Definition und einen engen On-score-Credit-Schwellenresolver: bei mindestens 12 Korp-Credits werden beim Scoren 12 Credits gewonnen, sonst verliert die Korp alle Credits. Der Smoke deckt Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash ab.
- `Marine Arcology` hat eine Runtime-Definition und eine aktive scored-agenda LegalAction: `[A]: Gain 1`. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Kostenabzug, side-sichere PublicPayloads und Replay/StateHash ab.
- `Political Overthrow` hat eine Runtime-Definition und eine aktive scored-agenda LegalAction: `[A]: Gain 3`. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Kostenabzug, side-sichere PublicPayloads und Replay/StateHash ab.
- `Zombie` hat eine Runtime-ICE-Definition mit zwei Core-Damage-Subroutinen und End-the-run. Der Smoke deckt Rez-LegalAction, Wrong-Side-/Stale-Revalidation, side-sichere Run-Auflösung und Replay/StateHash ab.
- `Edgerunner, Inc., Temps` hat eine Runtime-Definition und einen korpseitigen Install-only-Aktionsbundle-Resolver. Die Operation gibt drei direkt anschliessende Install-Aktionen, sperrt waehrend der Sequenz alle Nicht-Install-Aktionen ausser Zugende und dokumentiert Restaktionen side-sicher. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Sequenz-Restriktion, PublicPayload und Replay/StateHash ab.
- `Off-Site Backups` hat eine Runtime-Definition und einen privaten Archives-to-HQ-Choice. Der Smoke deckt Wrong-Side-/Stale-Revalidation, verdeckte Archives-Auswahl, side-sichere PublicPayloads und Replay/StateHash ab; die gerade gespielte Operation ist nicht selbst auswählbar.
- `Planning Consultants` hat eine Runtime-Definition und einen privaten R&D-Top-5-Reorder-Choice. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Hidden-Zone-Choice, side-sichere PublicPayloads und Replay/StateHash ab.
- `docs/derived/V1_9_22_RUNNER_PROGRAM_READINESS_REVIEW.md` dokumentiert, dass die 14 Runner-Programm-Zielkarten ohne lokal bestätigte Kosten-/MU-/Breakerwerte nicht als `install_card`, `pump_breaker` oder `break_subroutine` promotet werden duerfen.
- Ein Engine-Guard bestaetigt fuer 14/14 Runner-Programm-Zielkarten, dass sie bis zur lokalen Wertbestaetigung nicht `playable_mvp` sind.
- Ein weiterer Engine-Guard bestaetigt fuer 14/14 Runner-Programm-Zielkarten, dass keine `install_card`-, `pump_breaker`- oder `break_subroutine`-LegalActions geoeffnet werden, solange lokale Kosten-/MU-/Breakerwerte fehlen.
- `docs/derived/V1_9_22_RUNNER_EVENT_READINESS_REVIEW.md` bleibt als historischer Readiness-Stand erhalten; alle zehn Runner-Event-Zielkarten haben inzwischen enge Runtime-Resolver-Smokes, bleiben aber ohne Catalog-/AI-/Release-Promotion.
- Ein Engine-Guard bestaetigt fuer die verbleibenden 6/14 Corp-Agenda-/ICE-/Operations-Zielkarten, dass sie bis zu konkreten Resolvern nicht `playable_mvp` sind. `Corporate Retreat`, `Corporate War`, `Marine Arcology`, `Political Overthrow`, `Zombie`, `Edgerunner, Inc., Temps`, `Off-Site Backups` und `Planning Consultants` sind die acht bewusst eng umgesetzten Ausnahmen dieses WIP-Schnitts.
- `docs/derived/V1_9_22_CORP_LONGTAIL_READINESS_REVIEW.md` bleibt als historischer Readiness-Stand erhalten; die spaeter erstellte lokale Kartenfaktenbasis hebt den fehlenden Vollvertragsbefund fuer `Corporate War` und `Political Overthrow` auf, nicht fuer die restlichen Corp-Longtailkarten.
- Ein Catalog-Artefakt-Gate bestaetigt, dass V1.9.22-WIP-Manifest, WIP-Szenario und Mechanics-Coverage exakt zur 47er-Zielmenge passen, neun Hardwarekarten mit Install-Smokes, zehn Runner-Event-Resolverkarten, acht Corp-Longtail-Resolverkarten, 20 geplante No-Promotion-Karten und keine Catalog- oder AI-Promotion ausweisen.
- Ein AI-Paket-Guard bestaetigt, dass alle 47 V1.9.22-WIP-Karten bis zum Completion-Gate ausserhalb von `ai_supported`, `human_playable` und `deck_legal` bleiben.
- Ein Web-Catalog-API-Guard bestaetigt, dass V1.9.22-WIP-Karten nicht im `ai_supported`-Filter erscheinen und Detailantworten fuer sichtbare WIP-Karten keine `ai_supported`-, `human_playable`- oder `deck_legal`-Promotion anzeigen.
- Ein Webclient-Version-Guard bestaetigt, dass die sichtbare Client-Version bis zum V1.9.22-Completion-Gate auf `V1.9.21` bleibt.
- `data/rules/v1922-resolver-contract-inventory.json` dokumentiert die fehlenden Resolver-Vertragsfelder fuer Runner-Programme, Runner-Events, Runner-Hardware, Corp-Agendas, Corp-ICE und Corp-Operations maschinenlesbar. Der Catalog-Test gleicht das Inventar gegen 47/47 WIP-Karten ab und verbietet `ready_for_promotion`-Status in allen Clustern.
- Das Resolver-Contract-Inventar fuehrt lokal bestaetigte Teilnotizen aus `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md` fuer Runner-Programme, Runner-Events, Runner-Hardware und Corp-Agendas als `partialLocalNotes`; der Catalog-Test prueft, dass diese Notizen im jeweiligen Cluster und V1.9.22-WIP-Scope bleiben und keine Promotion-Aussagen enthalten.
- Ein Catalog-Guard bestaetigt, dass finale V1.9.22-AI-Promotion-Artefakte (`ai-card-hints-deck-legal-v1922.json`, `deck-legal-ai-approval-v1922-manifest.json`, `ai-deck-legal-v1922-smokes.json`) bis zum Completion-Gate nicht existieren.
- `data/reports/v1922-completion-gate-status.json` dokumentiert maschinenlesbar den offenen V1.9.22-Gate-Stand, die gruene Verify-Basis, die lokale Quellensuche ohne vollstaendigen Resolververtrag und die vier blockierenden Gates `resolver_contracts`, `ai_promotion_artifacts`, `webclient_version` und `final_review` mit Removal Conditions.
- `docs/derived/V1_9_22_SOURCE_SCAN_REVIEW.md` dokumentiert eine erneute lokale Quellensuche auf blockierte Runner-Event- und Corp-Longtailkarten. Der Scan bestaetigt, dass weiter nur Teilnotizen, Typoberflaechen und display-only WIP-Runtimes vorliegen; daraus folgt keine Runtime-, Catalog- oder AI-Promotion.
- `docs/derived/V1_9_22_RESOLVER_CONTRACT_MATRIX.md` und `data/rules/v1922-resolver-contracts.json` erfassen alle 47 Zielkarten einzeln mit bestaetigter Teilbasis, fehlenden Vertragsfeldern und Removal Conditions. Der historische Matrixstand 0/47 wurde durch die lokale Resolver-/Kartenfaktenbasis fuer zwei enge Implementierungskandidaten fortgeschrieben; daraus folgt noch keine Release- oder AI-Promotion.
- Keine V1.9.22-Karte wurde Catalog- oder AI-promotet; die sichtbare Webclient-Version bleibt bis zum Completion-Gate auf `V1.9.21`.

## Gate

`V1_9_22_done: false`
`V1_9_22_phase: implementing`

## Naechster Schnitt

Naechster kleiner Schnitt: `Security Purge`, sobald der in `docs/derived/V1_9_22_SECURITY_PURGE_SLICE_PREFLIGHT.md` dokumentierte Installationsvertrag fuer revealed ICE lokal bestaetigt ist. Ohne diese Klaerung bleibt die naechste sichere Alternative eine lokal bestaetigte Runner-Programmkarte mit Kosten-/MU-/Breakerwerten oder ein enger Corp-ICE-Resolver mit vollstaendiger Run-weiten Semantik.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 295 Tests inkl. `Edgerunner, Inc., Temps` Install-only-Aktionsbundle, Wrong-Side-/Stale-Revalidation, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Edgerunner-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Edgerunner-Resolver.
- Breiter Verify nach `Edgerunner, Inc., Temps`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 294 Tests inkl. `Zombie` Core-Damage-ICE-Rez-/Encounter-Pfad.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Zombie-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Zombie-Resolver.
- Breiter Verify nach `Zombie`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 293 Tests inkl. `Valu-Pak Software Bundle` programminstallationsgebundener Aktionssequenz, temporaerem Programminstallations-Credit, Wrong-Side-/Stale-Revalidation, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Valu-Pak-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Valu-Pak-Resolver.
- Breiter Verify nach `Valu-Pak Software Bundle`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- JSON-Validation fuer `data/**/*.json`: pass, 302 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 278 Tests inkl. 9/9 Runner-Hardware-Install-Smokes, Runner-Event-No-Promotion-Guard, Runner-Programm-No-Playable-Runtime-Guard, Runner-Programm-No-Install-/Pump-/Break-LegalAction-Guard und Corp-Longtail-No-Playable-Runtime-Guard.
- JSON-Validation fuer `data/**/*.json`: pass, 303 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 38 Tests inkl. V1.9.22-WIP-Artefakt-Alignment- und Resolver-Contract-Inventar-Guard.
- JSON-Validation fuer `data/**/*.json`: pass, 303 Dateien nach Teilnotizen-Ergaenzung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 38 Tests inkl. `partialLocalNotes`-Scope-/No-Promotion-Guard.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 39 Tests inkl. V1.9.22-AI-Promotion-Artefakt-Abwesenheitsguard.
- JSON-Validation fuer `data/**/*.json`: pass, 304 Dateien nach Gate-Statusreport.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 40 Tests inkl. Completion-Gate-Statusreport.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests inkl. V1.9.22-AI-No-Promotion-Guard.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests inkl. V1.9.22-Web-Catalog-No-Promotion- und Webclient-Version-Guard.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: erst rot wegen Testzugriff auf eine nicht exportierte interne Hilfsfunktion, danach pass, 287 Tests inkl. `misc.for-sale` privatem Installed-Trash-Economy-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `misc.for-sale`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `misc.for-sale`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 284 Tests inkl. `Marine Arcology`-scored-agenda-Gain-1-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Marine Arcology`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 285 Tests inkl. `If You Want It Done Right...` privatem Stack-Top-5-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `If You Want It Done Right...`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `If You Want It Done Right...`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: erst rot wegen fehlender PublicPayload-Zaehlung fuer `Organ Donor`, danach pass, 286 Tests nach PublicContext-Erweiterung fuer `trashedCount`, `gainedCredits` und `runnerCreditsAfter`.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `Organ Donor`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Organ Donor`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 288 Tests inkl. `Open-Ended Mileage Program` Tag-Removal-/Return-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen fehlender Resolver-Family-Erwartung, danach pass, 44 Tests nach `Open-Ended Mileage Program`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: initial rot wegen zu breiter Choice-Auswahl-Typisierung, danach pass nach `Open-Ended Mileage Program`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 289 Tests inkl. `Anonymous Tip` public Black-ICE-Derez-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `Anonymous Tip`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Anonymous Tip`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Testassertion auf interne CardInstance-ID im sichtbaren Choice-Objekt, danach pass, 290 Tests nach PlayerView-Redaktion fuer public Choice-Optionen mit `publicLabel` und `Forged Activation Orders`-Rez-/Trash-Smoke.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `Forged Activation Orders`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Forged Activation Orders`-Resolver und Choice-Redaktion.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 291 Tests inkl. `Security Code WORM Chip` erfolgreicher-HQ-Run-Flag und unrezzte-ICE-Trash-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `Security Code WORM Chip`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Security Code WORM Chip`-Resolver und RunnerTurnFlags-Erweiterung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 292 Tests inkl. `Core Command: Jettison Ice` erfolgreicher-HQ-Run-Flag und bezahlte gerezzte-ICE-Trash-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach `Core Command: Jettison Ice`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Core Command: Jettison Ice`-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Testhelper-Duplikat fuer gleiche HQ-Kartendefinition und fehlender PublicPayload-Weitergabe fuer `retainedCount`/`discardedCount`, danach pass, 293 Tests inkl. `Synchronized Attack on HQ` erfolgreicher-HQ-Run-Flag und privater Korp-HQ-Retain-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen unveraenderter `planned_no_promotion`-Zaehllogik, danach pass, 44 Tests nach `Synchronized Attack on HQ`-Manifest-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Synchronized Attack on HQ`-Resolver.
- Breiter Verify nach `Synchronized Attack on HQ`: `ai` pass (86), `server` pass (72), `web` pass (79), `test` pass (Exit 0), `lint` pass, `build` pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Breiter Verify nach Runner-Event-Ice-Pressure-WIP: `ai` initial rot wegen zu breiter PlayerView-Redaktion fuer public Choice-Values; nach Begrenzung auf neue `ice_*`-Positionsoptionen pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- JSON-Validation fuer `data/**/*.json`: pass, 304 Dateien nach Source-Scan-Report-Aktualisierung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 40 Tests inkl. Completion-Gate-Statusreport.
- JSON-Validation fuer `data/**/*.json`: pass, 305 Dateien nach Resolververtragsmatrix.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 41 Tests inkl. aktualisiertem Completion-Gate-Statusreport-Verweis und Per-card-Guard fuer die Resolververtragsmatrix.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 280 Tests inkl. `Corporate War`-On-score-Schwellenresolver und `Political Overthrow`-scored-agenda-Gain-3-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Runtime-Resolver-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 281 Tests inkl. `Planning Consultants`-privatem R&D-Top-5-Reorder-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 282 Tests inkl. `Off-Site Backups`-privatem Archives-to-HQ-Choice.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 283 Tests inkl. `Corporate Retreat`-Gain-6-bis-Install-/Rez-Verlust.
- JSON-Validation fuer `data/**/*.json`: pass, 308 Dateien nach Runtime-Resolver-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
