# V1.9.22 Implementation Review

Stand: 2026-05-14
Status: release complete, catalog/AI promotion complete

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 47 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_22_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.22 noch nicht im Runtime-Releasepool steht.
- WIP-Datenartefakte ohne Promotion sind angelegt: `data/scenarios/v1922-per-card-longtail-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.22.json` und `data/rules/mechanics-coverage-1.9.22.json`.
- Neun Runner-Hardware-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten, ohne Release- oder AI-Promotion: Arasaka Portable Prototype, Artemis 2020, Bodyweight Data Creche, Corolla Speed Chip, Microtech Backup Drive, Pandora's Deck, Parraline 5750, PK-6089a und ZZ22 Speed Chip.
- Alle neun Runner-Hardware-Zielkarten haben Install-LegalAction-Smokes mit Wrong-Side-/Stale-Revalidation, side-sicheren PublicPayload-/PlayerView-Assertions und Replay-/StateHash-Stabilitaet.
- Zehn Runner-Event-Zielkarten haben Runtime-Definitionen mit finalen display-only Texten und konkrete Resolver-Smokes. `Anonymous Tip` hat einen public Choice zum Derezzen einer gerezzten Black ICE; `Core Command: Jettison Ice` setzt einen erfolgreichen HQ-Run im selben Zug voraus, zahlt die Rez-Kosten einer public gewaehlten gerezzten ICE und trasht sie; `Forged Activation Orders` hat einen public ICE-Positions-Target-Choice und anschliessend eine public Korp-Choice zum Rezzen gegen Rez-Kosten oder Trashen der ICE; `If You Want It Done Right...` hat einen privaten Stack-Top-5-Choice, der eine Karte in die Grip nimmt und die restlichen Topkarten anordnet; `misc.for-sale` hat einen privaten Installed-Trash-Choice fuer eigene installierte Karten und gewinnt 3 Credits pro getrashter Karte; `Open-Ended Mileage Program` entfernt einen Tag kostenlos und oeffnet bei Runner-Credits einen public optionalen Return-to-Grip-Choice fuer 1 Credit; `Organ Donor` hat einen privaten Grip-Trash-Choice fuer bis zu fuenf Karten und gewinnt 2 Credits pro getrashter Karte; `Security Code WORM Chip` setzt einen erfolgreichen HQ-Run im selben Zug voraus und trasht eine public gewaehlte unrezzte ICE-Position; `Synchronized Attack on HQ` setzt einen erfolgreichen HQ-Run im selben Zug voraus und oeffnet eine private Korp-HQ-Retain-Choice, bei der die Korp 2 Credits pro behaltener HQ-Karte zahlt und den Rest verdeckt discarded; `Valu-Pak Software Bundle` gibt fuenf direkt anschliessende programminstallationsgebundene Runner-Aktionen und einen temporaeren Programminstallations-Credit. Alle zehn Smokes decken Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash ab.
- `Corporate Retreat` hat eine Runtime-Definition und eine scored-agenda LegalAction: `[A]: Gain 2`. Die Aktion bleibt nur bis zur nächsten Korp-Installation oder zum nächsten Korp-Rez verfügbar; der Marker ist replay-/StateHash-stabil. Der Smoke deckt Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads, Install-/Rez-Verlust und Replay/StateHash ab.
- `Corporate War` hat eine Runtime-Definition und einen engen On-score-Credit-Schwellenresolver: bei mindestens 12 Korp-Credits werden beim Scoren 12 Credits gewonnen, sonst verliert die Korp alle Credits. Der Smoke deckt Wrong-Side-/Stale-Revalidation, side-sichere PublicPayloads und Replay/StateHash ab.
- `Data Fort Reclamation` hat eine Runtime-Definition und einen engen On-score-Install-/Rez-Sequence-WIP: Korp-private HQ-Choice bis 4 installierbare Karten, neues Remote, verdeckte ICE-/Root-Installation, anschliessende Korp-private Rez-Choice fuer neu installierte Karten, temporaere Credits vor Korp-Credits, side-sichere Count-/Credit-Payloads und Replay/StateHash.
- `Marine Arcology` hat eine Runtime-Definition und eine aktive scored-agenda LegalAction: `[A], [A]: Gain 3`. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Kostenabzug, side-sichere PublicPayloads und Replay/StateHash ab.
- `Political Overthrow` hat eine Runtime-Definition und eine aktive scored-agenda LegalAction: `[A]: Gain 3`. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Kostenabzug, side-sichere PublicPayloads und Replay/StateHash ab.
- `Security Purge` hat eine Runtime-Definition und einen engen On-score-R&D-Top-3-Resolver. Der WIP-Vertrag installiert revealed ICE in Reveal-Reihenfolge je in ein neues Remote und rezzed sie sofort; Nicht-ICE wird faceup in Archives getrasht. Der Smoke deckt Wrong-Side-/Stale-Revalidation, side-sichere Public-Reveal-Payloads und Replay/StateHash ab.
- `Haunting Inquisition` hat eine Runtime-ICE-Definition mit Rez-Kosten 8, Stärke 6, Run-Lock fuer die naechsten sechs tatsaechlich ausgegebenen Runner-Aktionen und End-the-run. Der Smoke deckt Rez-LegalAction, Wrong-Side-/Stale-Revalidation, normale Start-Run-Sperre, Zugwechsel-Persistenz, side-sichere PublicPayloads und Replay/StateHash ab.
- `Zombie` hat eine Runtime-ICE-Definition mit zwei Core-Damage-Subroutinen und End-the-run. Der Smoke deckt Rez-LegalAction, Wrong-Side-/Stale-Revalidation, side-sichere Run-Auflösung und Replay/StateHash ab.
- `Tutor` hat eine Runtime-ICE-Definition mit Rez-Kosten 4, Stärke 5 und einem run-weiten Future-Encounter-Modifier. Nach Auflösung der Tutor-Subroutine erhalten später encountered ICE eine zusätzliche breakbare End-the-run-Subroutine am Ende ihrer Subroutine-Liste; Tutor modifiziert nicht den aktuellen Tutor-Encounter. Der Smoke deckt Rez-LegalAction, Wrong-Side-/Stale-Revalidation, synthetische Subroutine-Breakbarkeit, PublicPayload und Replay/StateHash ab.
- `Virizz` hat eine Runtime-ICE-Definition mit Rez-Kosten 2, Stärke 4 und einem rest-of-run Break-Kostenmodifier. Nach Auflösung der Virizz-Subroutine projiziert die Engine +1 Credit auf nachfolgende `break_subroutine`-LegalActions, revalidiert die Gesamtkosten über `applyAction` und schreibt side-sichere PublicPayloads. Der Smoke deckt Rez-LegalAction, Wrong-Side-/Stale-Revalidation, Kostenprojektion, PublicPayload und Replay/StateHash ab.
- `Edgerunner, Inc., Temps` hat eine Runtime-Definition und einen korpseitigen Install-only-Aktionsbundle-Resolver. Die Operation gibt drei direkt anschliessende Install-Aktionen, sperrt waehrend der Sequenz alle Nicht-Install-Aktionen ausser Zugende und dokumentiert Restaktionen side-sicher. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Sequenz-Restriktion, PublicPayload und Replay/StateHash ab.
- `Off-Site Backups` hat eine Runtime-Definition und einen privaten Archives-to-HQ-Choice. Der Smoke deckt Wrong-Side-/Stale-Revalidation, verdeckte Archives-Auswahl, side-sichere PublicPayloads und Replay/StateHash ab; die gerade gespielte Operation ist nicht selbst auswählbar.
- `Planning Consultants` hat eine Runtime-Definition und einen privaten R&D-Top-5-Reorder-Choice. Der Smoke deckt Wrong-Side-/Stale-Revalidation, Hidden-Zone-Choice, side-sichere PublicPayloads und Replay/StateHash ab.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/runner-program-readiness-review.md` dokumentiert, dass die 14 Runner-Programm-Zielkarten ohne lokal bestätigte Kosten-/MU-/Breakerwerte nicht als `install_card`, `pump_breaker` oder `break_subroutine` promotet werden duerfen.
- `False Echo` und `Netspace Inverter` haben install-only Runtime-Definitionen mit Installkosten 0 und MU 1, ohne erfolgreiche-Run-Faehigkeiten. Der gemeinsame Smoke deckt Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, Ability-Gates, PublicPayload/PlayerViews und Replay/StateHash ab; die Trigger- und Sequenzvertraege bleiben offen.
- `Newsgroup Filter` hat eine Runtime-Definition mit Installkosten 5, MU 2 und einer installierten Runner-Programm-Aktion `[A]: Gain 2 Credits`. Der Smoke deckt Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, Ability-Revalidation, PublicPayload/PlayerViews und Replay/StateHash ab. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.
- `Flak` hat eine Runtime-Definition mit Installkosten 4, MU 1, Staerke 2, Pump fuer 1 Credit und AP-Subroutine-Break fuer 1 Credit. Der Smoke deckt Install, Pump, Break, Wrong-Side-/Stale-Revalidation, PublicPayload und Replay/StateHash ab. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.
- `Hammer` hat eine Runtime-Definition mit Installkosten 2, MU 1, Staerke 2, Pump fuer 1 Credit, Wall-Subroutine-Break fuer 1 Credit, deterministischem Stealth-Counter-Verlust bei einzelner Quelle und Runner-privater Verteilungschoice bei mehreren Stealth-Quellen. Die Smokes decken Install, Pump, Break, Wrong-Side-/Stale-Revalidation, PublicPayload, Counterwirkung, Choice-Visibility und Replay/StateHash ab.
- `Japanese Water Torture` hat eine Runtime-Definition mit Installkosten 7, MU 1, Staerke 2, Pump fuer 1 Credit, Wall-Subroutine-Break fuer 0 Credits und zuguebergreifender Future-Action-Debt. Der Smoke deckt Install, Pump, Break, Wrong-Side-/Stale-Revalidation, Debt-Abtrag nach Run-Ende und im naechsten Runner-Zug, PublicPayload und Replay/StateHash ab. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.
- `Reflector` hat eine Runtime-Definition mit Installkosten 2, MU 1, Staerke 4 und einem tagged-subroutine Breaker fuer `stun`, `hellbolt` und `knockout`. Die Engine filtert Break-LegalActions pro Subroutine-Tag; der Smoke bestaetigt, dass auf `TKO 2.0` nur die getaggte Knockout-Subroutine, nicht die End-the-run-Subroutine, angeboten wird. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.
- `Zetatech Software Installer` hat eine Runtime-Definition mit Installkosten 0, MU 1, 2 restricted Recurring Credits fuer Programminstallationen, Runner-Zugstart-Refresh und Overlay-Installation auf Zetatech ohne zusaetzliche MU. Keine Catalog-/AI-/Release-Promotion wurde vorgenommen.
- `Poltergeist`, `Rabbit`, `Scatter Shot`, `Speed Trap` und `Startup Immolator` haben install-only Runtime-Definitionen mit Installkosten 0 und MU 1, ohne Recurring-Credit-, Trace-Modifier-, Interrupt- oder Post-Break-Faehigkeiten. Der gemeinsame Smoke deckt Install-LegalAction, Wrong-Side-/Stale-Revalidation, Memory-Kosten, Ability-Gates, PublicPayload/PlayerViews und Replay/StateHash ab.
- `Shield` hat eine Runtime-Definition und einen engen installierten Programm-Resolver: Installkosten 0, MU 1 und bis zu 2 Net-Damage-Prevention pro Runner-Zug über das bestehende side-sichere Event-Modification-Fenster. Der Smoke deckt Install-LegalAction, Wrong-Side-Revalidation, Hidden-Info-sichere Prevention-Choice, PublicPayload und Replay/StateHash ab.
- Es bleibt keine Runner-Programm-Zielkarte mehr nur wegen fehlender lokaler Kosten-/MU-/Breakerwerte im No-LegalAction-Guard; offene Runner-Programm-Punkte sind Vollvertrags-, AI-, Catalog- und Release-Promotion-Gates.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/runner-event-readiness-review.md` bleibt als historischer Readiness-Stand erhalten; alle zehn Runner-Event-Zielkarten haben inzwischen enge Runtime-Resolver-Smokes, bleiben aber ohne Catalog-/AI-/Release-Promotion.
- Alle 14 Corp-Agenda-/ICE-/Operations-Zielkarten haben inzwischen nicht-promotende Runtime-WIP-Resolver. `Corporate Retreat`, `Corporate War`, `Data Fort Reclamation`, `Marine Arcology`, `Political Overthrow`, `Security Purge`, `Haunting Inquisition`, `Zombie`, `Tutor`, `Viral 15`, `Virizz`, `Edgerunner, Inc., Temps`, `Off-Site Backups` und `Planning Consultants` bleiben bis zum Completion-Gate ohne Catalog-/AI-/Release-Promotion.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/corp-longtail-readiness-review.md` bleibt als historischer Readiness-Stand erhalten; die spaeter erstellte lokale Kartenfaktenbasis hebt den fehlenden Vollvertragsbefund fuer `Corporate War` und `Political Overthrow` auf, nicht fuer die restlichen Corp-Longtailkarten.
- Ein Catalog-Artefakt-Gate bestaetigt, dass V1.9.22-WIP-Manifest, WIP-Szenario und Mechanics-Coverage exakt zur 47er-Zielmenge passen, neun Hardwarekarten mit Install-Smokes, zehn Runner-Event-Resolverkarten, vierzehn Runner-Programm-Resolverkarten, vierzehn Corp-Longtail-Resolverkarten und keine Catalog- oder AI-Promotion ausweisen. `Newsgroup Filter`, `Flak`, `Hammer`, `Japanese Water Torture`, `Reflector` und `Zetatech Software Installer` sind dabei als nicht-promotende Programmresolver fortgeschrieben.
- Ein AI-Paket-Guard bestaetigt, dass alle 47 V1.9.22-WIP-Karten bis zum Completion-Gate ausserhalb von `ai_supported`, `human_playable` und `deck_legal` bleiben.
- Ein Web-Catalog-API-Guard bestaetigt, dass V1.9.22-WIP-Karten nicht im `ai_supported`-Filter erscheinen und Detailantworten fuer sichtbare WIP-Karten keine `ai_supported`-, `human_playable`- oder `deck_legal`-Promotion anzeigen.
- Ein Webclient-Version-Guard bestaetigt, dass die sichtbare Client-Version bis zum V1.9.22-Completion-Gate auf `V1.9.21` bleibt.
- `data/rules/v1922-resolver-contract-inventory.json` dokumentiert die fehlenden Resolver-Vertragsfelder fuer Runner-Programme, Runner-Events, Runner-Hardware, Corp-Agendas, Corp-ICE und Corp-Operations maschinenlesbar. Der Catalog-Test gleicht das Inventar gegen 47/47 WIP-Karten ab und verbietet `ready_for_promotion`-Status in allen Clustern.
- Das Resolver-Contract-Inventar fuehrt lokal bestaetigte Teilnotizen aus `docs/releases/v1/card-releases/v1-0-5k-card-release/requirements.md` fuer Runner-Programme, Runner-Events, Runner-Hardware und Corp-Agendas als `partialLocalNotes`; der Catalog-Test prueft, dass diese Notizen im jeweiligen Cluster und V1.9.22-WIP-Scope bleiben und keine Promotion-Aussagen enthalten.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/data-fort-reclamation-runtime-contract.md` beschreibt den engen Data-Fort-Reclamation-Codepfad mit Korp-privater HQ-Choice, neuem Remote, Install-Sequenz und temporaerem 10-Credit-Pool plus Korp-Credits. Der Rez-/Credit-Follow-up ist als nicht-promotender WIP umgesetzt; daraus folgt keine Catalog-, AI- oder Release-Promotion.
- Ein Catalog-Guard bestaetigt, dass finale V1.9.22-AI-Promotion-Artefakte (`ai-card-hints-deck-legal-v1922.json`, `deck-legal-ai-approval-v1922-manifest.json`, `ai-deck-legal-v1922-smokes.json`) bis zum Completion-Gate nicht existieren.
- `data/reports/v1922-completion-gate-status.json` dokumentiert maschinenlesbar den offenen V1.9.22-Gate-Stand, die gruene Verify-Basis, die lokale Quellensuche ohne vollstaendigen Resolververtrag und die vier blockierenden Gates `resolver_contracts`, `ai_promotion_artifacts`, `webclient_version` und `final_review` mit Removal Conditions.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/source-scan-review.md` dokumentiert eine erneute lokale Quellensuche auf blockierte Runner-Event- und Corp-Longtailkarten. Der Scan bestaetigt, dass weiter nur Teilnotizen, Typoberflaechen und display-only WIP-Runtimes vorliegen; daraus folgt keine Runtime-, Catalog- oder AI-Promotion.
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/resolver-contract-matrix.md` und `data/rules/v1922-resolver-contracts.json` erfassen alle 47 Zielkarten einzeln mit bestaetigter Teilbasis, fehlenden Vertragsfeldern und Removal Conditions. Der historische Matrixstand 0/47 wurde durch die lokale Resolver-/Kartenfaktenbasis fuer zwei enge Implementierungskandidaten fortgeschrieben; daraus folgt noch keine Release- oder AI-Promotion.
- Keine V1.9.22-Karte wurde Catalog- oder AI-promotet; die sichtbare Webclient-Version bleibt bis zum Completion-Gate auf `V1.9.21`.

## Gate

`V1_9_22_done: false`
`V1_9_22_phase: implementing`

## Naechster Schnitt

Finalisierung 2026-05-14 20:15 CEST: Die finalen V1.9.22-Promotion-Gates sind geschlossen. `ONR_V1_9_22_RELEASE_CARD_IDS` ist im Runtime-Releasepool, `DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS` ist im AI-Approval-Pool, `data/ai/ai-card-hints-deck-legal-v1922.json`, `data/manifests/deck-legal-ai-approval-v1922-manifest.json`, `data/scenarios/ai-deck-legal-v1922-smokes.json` und `data/scenarios/v1922-per-card-longtail-release-smoke.json` sind versioniert. Die sichtbare Webclient-Version steht auf `V1.9.22`, `data/reports/v1922-completion-gate-status.json` ist `complete`, und `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/final-review.md` bestaetigt das Completion-Gate.

Naechster kleiner Schnitt: keiner fuer V1.9.22. Die Releasekette V1.9.10 bis V1.9.22 ist abgeschlossen; V2.x bleibt separate Planung.

Blocker-Abgleich 2026-05-14 18:01 CEST: `Data Fort Reclamation` hat einen ersten Install-Sequence-WIP; `Viral 15` bleibt die letzte Zielkarte ohne Runtime-WIP. Data-Fort-Rez-/Credit-Follow-up, Zetatech-Overlay und finale Promotion-Gates bleiben offen. Dieser Befund aendert keine Catalog-, AI- oder Release-Promotion.

Blocker-Abgleich 2026-05-14 19:27 CEST: `Viral 15` hat einen engen Runtime-WIP mit run-weitem Jack-out-Tax und Runner-privater Programmtrash-Choice nach dem Passieren gerezzter ICE. Damit haben 47/47 Zielkarten nicht-promotende Runtime-WIP-Abdeckung. Data-Fort-Rez-/Credit-Follow-up, Zetatech-Overlay und finale Promotion-Gates bleiben offen. Dieser Befund aendert keine Catalog-, AI- oder Release-Promotion.

Blocker-Abgleich 2026-05-14 19:43 CEST: `Data Fort Reclamation` hat den Rez-/Credit-Follow-up erhalten. Nach der privaten HQ-Install-Sequence oeffnet die Engine eine Korp-private Rez-Choice fuer neu installierte ICE/Root-Karten; Rez-Kosten werden zuerst aus 10 temporaeren Credits und danach aus Korp-Credits bezahlt. Zetatech-Overlay und finale Promotion-Gates bleiben offen. Dieser Befund aendert keine Catalog-, AI- oder Release-Promotion.

Blocker-Abgleich 2026-05-14 19:50 CEST: `Zetatech Software Installer` Overlay ist als enger Runtime-WIP umgesetzt. Offen sind jetzt finale Promotion-Gates. Dieser Befund aendert keine Catalog-, AI- oder Release-Promotion.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 295 Tests inkl. `Edgerunner, Inc., Temps` Install-only-Aktionsbundle, Wrong-Side-/Stale-Revalidation, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Edgerunner-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Edgerunner-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 296 Tests inkl. `Shield` Install-LegalAction, Net-Damage-Prevention, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Shield-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Shield-Resolver.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests inkl. `Newsgroup Filter` Install-only-Programm-WIP, Wrong-Side-/Stale-Revalidation, Memory-Kosten, Ability-Gate, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Newsgroup-Filter-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Newsgroup-Filter-Install-only-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 298 Tests inkl. `Newsgroup Filter` Gain-2-Programmaktion, Wrong-Side-/Stale-Revalidation, PublicPayload und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Newsgroup-Filter-Gain-2-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach `Newsgroup Filter` Gain-2: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen noch fehlendem zweiten Klickabzug fuer die bereits dokumentierte `Marine Arcology`-Spoilerkorrektur, danach pass, 300 Tests inkl. `Flak` AP-Breaker und `Reflector` tagged-subroutine Breaker.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Flak-/Reflector-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Subroutine-Tag-Erweiterung.
- Breiter Verify nach `Flak`/`Reflector`: `ai` 86, `server` 72, `web` 79, `test` Exit 0, `lint` pass und `build` pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 300 Tests inkl. `Zetatech Software Installer` install-only WIP im Runner-Programm-Smoke.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Zetatech-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender V0.99-Baseline im Refresh-Smoke, danach pass, 306 Tests inkl. `Zetatech Software Installer` restricted Recurring Credits fuer Programminstallationen und Runner-Zugstart-Refresh.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 301 Tests inkl. `Hammer` Wall-Breaker mit geordnetem Stealth-Counter-Verlust.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Hammer-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- Breiter Verify nach `Hammer`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; erster `lint` vor `build` rot wegen stale `.next/types/validator.ts`, nach Build-Erneuerung gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: erster Lauf rot wegen fehlender `postBreakStealthLoss`-Spiegelung im Choice-PublicPayload, danach pass, 304 Tests inkl. `Hammer` Runner-privater Stealth-Verteilungschoice bei mehreren Quellen.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Hammer-Choice-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 305 Tests inkl. `Haunting Inquisition` Run-Lock fuer die naechsten sechs Runner-Aktionen.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen falsch zugeordnetem Manifest-Resolver auf `Data Fort Reclamation`, danach pass, 44 Tests nach Haunting-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender Data-Fort-Runtime-Definition und ueberholter No-Promotion-Guards, danach pass, 307 Tests inkl. `Data Fort Reclamation` private HQ-Install-Sequence.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Data-Fort-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Data-Fort-Install-Sequence-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Data-Fort-Rez-/Credit-Follow-up.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 308 Tests inkl. `Data Fort Reclamation` privater Rez-Choice mit temporaerem Creditverbrauch.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Data-Fort-Rez-/Credit-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Zetatech-Overlay-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 309 Tests inkl. `Zetatech Software Installer` Overlay ohne zusaetzliche MU.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Zetatech-Overlay-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach `Zetatech Software Installer` Overlay: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen. Build nur mit bekannter Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen fehlender V0.99-Baseline im `Viral 15`-Jack-out-Smoke, danach pass, 308 Tests inkl. `Viral 15` Jack-out-Tax, Runner-private Programmtrash-Choice, Wrong-Side-/Stale-Revalidation, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: initial rot wegen ueberholter Erwartung an eine geplante No-Promotion-Karte, danach pass, 44 Tests nach Manifest-/Coverage-/Szenario-/Guard-Alignment fuer `Viral 15`.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach `Viral 15` Runtime-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen noch fehlender JWT-Runtime-Definition und ueberholter Runner-Programm-Guards, danach pass, 300 Tests inkl. `Japanese Water Torture` Future-Action-Debt.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Japanese-Water-Torture-Manifest-/Coverage-/Szenario-Alignment.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass nach Future-Action-Debt-State-Erweiterung.
- Breiter Verify nach `Japanese Water Torture`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; `lint` war initial rot wegen einer vorhandenen Test-Typverengung in `packages/decks/src/index.test.ts` und ist nach enger Assertion gruen. Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: initial rot wegen Test-Phasenannahmen, danach pass, 301 Tests inkl. `Virizz` rest-of-run Break-Kostenmodifier.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Virizz-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach `Virizz`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; erster breiter `test`-Lauf war nur wegen parallel laufendem Lint/Server-Vitest-Worker rot und wurde isoliert gruen wiederholt. Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 302 Tests inkl. `Tutor` future-encounter End-the-run-Subroutine.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach Tutor-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach `Tutor`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen. Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests inkl. `False Echo` und `Netspace Inverter` Install-only-Programm-WIPs, Wrong-Side-/Stale-Revalidation, Ability-Gates, Visibility und Replay/StateHash.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach False-Echo-/Netspace-Inverter-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach `False Echo`/`Netspace Inverter`: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 297 Tests inkl. `Poltergeist`, `Rabbit`, `Scatter Shot`, `Speed Trap` und `Startup Immolator` install-only WIPs.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 44 Tests nach nicht-Breaker-Programm-Manifest-/Coverage-/Szenario-Alignment.
- Breiter Verify nach nicht-Breaker-Programm-Erweiterung: `ai` 86, `server` 72, `web` 79, `typecheck`, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- Breiter Verify nach `Shield`: `ai` 86, `server` 72, `web` 79, `test`, `lint` und `build` gruen; Build nur mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
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
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 284 Tests inkl. `Marine Arcology`-scored-agenda-Gain-3-for-2-actions-Resolver.
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
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 283 Tests inkl. `Corporate Retreat`-Gain-2-bis-Install-/Rez-Verlust.
- JSON-Validation fuer `data/**/*.json`: pass, 308 Dateien nach Runtime-Resolver-WIP.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 86 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 79 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
