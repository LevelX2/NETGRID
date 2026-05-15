# Originalset-Karten-Nachtest-Register

Zweck: Dieses Register hält fest, welche Originalset-Karten bereits in einer vertieften Stichprobe geprüft wurden. Neue zufällige Nachtest-Runden sollen diese Karten standardmäßig ausschließen, außer es gibt einen konkreten Regressionsverdacht oder eine Nacharbeitsprüfung.

Maschinenlesbare Begleitdatei: `data/reports/originalset-card-spotcheck-register.json`

## Runde 2026-05-15-trace-cache-ambush

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TRACE_CACHE_AMBUSH_IMPLEMENTATION.md`

Jobstatus: `blocked`; grüne Teilfixes wurden umgesetzt, mehrere Vollresolver bleiben als Removal Condition offen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Signpost | `onr_v1_063_signpost` | Blockiert: post-bid Trace-Link-Fenster nach offengelegten Bids fehlt | Eigenen Trace-Link-Choice-Scope umsetzen |
| Deal with Militech | `onr_v1_082_deal-with-militech` | Blockiert: Research-Bedingung und Militech-Counter auf Icebreakern fehlen | Eigenen Research-/Counter-Resolver umsetzen |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Blockiert: Multi-Expose-Choice ohne Zielidentitäts-Leak fehlt | Eigenen Expose-Choice-Resolver umsetzen |
| Sneak Preview | `onr_v1_110_sneak-preview` | Blockiert: temporärer Heap-/Stack-Programminstall mit End-of-turn-Return fehlt | Eigenen Temporary-Install-Resolver umsetzen |
| Code Viral Cache | `onr_v1_155_code-viral-cache` | Blockiert: Purge-Replacement und Korp-Trash-Aktion fehlen | Eigenen Purge-Replacement-Resolver umsetzen |
| The Springboard | `onr_v1_181_the-springboard` | Blockiert: post-bid Trace-Link-Fenster nach offengelegten Bids fehlt | Eigenen Trace-Link-Choice-Scope umsetzen |
| Cerberus | `onr_v1_227_cerberus` | Teilfix umgesetzt: 3 Net Damage und kein falscher Trace-Tag; Counter-Loop bleibt offen | Cerberus-Counter-/Runstart-Damage-Resolver umsetzen |
| Ice Pick Willie | `onr_v1_250_ice-pick-willie` | Teilfix umgesetzt: Program-Trash plus End-the-run statt R&D-Reveal | Teilfix grün |
| TRAP! | `onr_v1_345_trap` | Teilfix umgesetzt: 3 Net Damage plus Tag aus legalem Access; Archives-No-op bleibt | Teilfix grün |
| Paris City Grid | `onr_v1_365_paris-city-grid` | Blockiert: servergebundener Trace-Bit-Pool und Refresh fehlen | Eigenen Trace-Pool-Payment-Resolver umsetzen |

## Runde 2026-05-15-virus-link-archives

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_VIRUS_LINK_ARCHIVES_IMPLEMENTATION.md`

Jobstatus: `blocked`; grüne Teilfixes wurden umgesetzt, `Pile Driver` und `Full Body Conversion` brauchen eigene Resolver-Verträge.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Cockroach | `onr_v1_013_cockroach` | Counter-Schwelle, Multi-Copy und Discard-Choice-Revalidation gehärtet | Teilfix grün |
| Pile Driver | `onr_v1_047_pile-driver` | Blockiert: Multi-Wall-Break plus exakt 3 Stealth-Verlust braucht eigenen Resolver | Eigenen Resolver-Scope umsetzen |
| Replicator | `onr_v1_056_replicator` | Nacharbeit umgesetzt: Trace-Subroutine-Breaker mit Pump und Nicht-Trace-Negativfall | Teilfix grün |
| Scatter Shot | `onr_v1_057_scatter-shot` | Nacharbeit umgesetzt: restricted Recurring Credits für accessed Upgrade-Trashkosten plus Refresh | Teilfix grün |
| Full Body Conversion | `onr_v1_127_full-body-conversion` | Blockiert: Meat-Damage-Prevention und Korp-Bypass driften vom Runtime-Stub | Eigenen Resolver-Scope umsetzen |
| Access through Alpha | `onr_v1_148_access-through-alpha` | Nacharbeit umgesetzt: Base Link 9 und genau eine Base-Link-Quelle pro Trace | Teilfix grün |
| Detroit Police Contract | `onr_v1_198_detroit-police-contract` | Bestehender Counterpfad durch wrong-side/stale/0-Counter-Revalidation gehärtet | Teilfix grün |
| Off-Site Backups | `onr_v1_296_off-site-backups` | Bestehender Archives-Choice-Pfad durch No-target-Fall gehärtet | Teilfix grün |
| Urban Renewal | `onr_v1_307_urban-renewal` | Bestehender tagged-only Damage-Pfad durch Tag-Drift-Revalidation gehärtet | Teilfix grün |
| Red Herrings | `onr_v1_366_red-herrings` | Nacharbeit umgesetzt: Tax bleibt nach Trash im selben Run aktiv | Teilfix grün |

## Runde 2026-05-15-hidden-access-trace

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_HIDDEN_ACCESS_TRACE_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Checks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Fortress Respecification | `onr_v1_088_fortress-respecification` | V1.9.11-Expose-Pfad bleibt absichtlich öffentlich, aber Hidden-Zone-Barriere und Serverquelle sind payloadfähig | Wrong-side-/Stale-, Payload-Leakscan- und Replay-Test ergänzt |
| Ice and Data's Guide to the Net | `onr_v1_092_ice-and-datas-guide-to-the-net` | Korrigiert auf Expose der äußersten ICE aller Data Forts mit ICE statt Stack-Top-Reveal | Wrong-Side-/Stale-, Keine-ICE-, Nicht-äußerstes-ICE-/Stack-Leakscan- und Replay-Test ergänzt |
| Private LDL Access | `onr_v1_106_private-ldl-access` | HQ-Run accessed R&D statt HQ und lässt HQ-Karten ungeöffnet | Source-bound Run-/Access-Test, PublicPayload-Leakscan und Replay ergänzt |
| HQ Interface | `onr_v1_129_hq-interface` | HQ-Multiaccess mit mehreren Kopien bleibt auf HQ beschränkt und payloadfähig | Bonus-/Effektiv-Access-Payload und Replay-Test ergänzt |
| Restrictive Net Zoning | `onr_v1_173_restrictive-net-zoning` | Mehrere Kopien stacken servergebunden auf Corp-ICE-Installkosten | Zwei-Kopien-Tax-Test ergänzt |
| Polymer Breakthrough | `onr_v1_211_polymer-breakthrough` | Mehrere gescorte Kopien geben exakt je 1 Credit am Corp-Zugstart | Mehrkopien- und Replay-Test ergänzt |
| Private Cybernet Police | `onr_v1_213_private-cybernet-police` | Gescorte Agenda startet Trace 5 und gibt bei Erfolg exakt 1 Tag | Wrong-side-, Trace- und Replay-Test ergänzt |
| Data Naga | `onr_v1_235_data-naga` | Ungebrochene Subroutine trasht deterministisch ein installiertes Runner-Programm und endet den Run | PublicPayload-Leakscan und Replay-Test ergänzt |
| Vacuum Link | `onr_v1_275_vacuum-link` | Rewind/No-Rewind-Würfe bleiben deterministisch und payloadfähig | Rewind-/No-Rewind-Seedschleife und Replay-Test ergänzt |
| Pacifica Regional AI | `onr_v1_334_pacifica-regional-ai` | Rezzed Pacifica-Aktion bleibt source-bound, kostet 1 Click und gibt exakt 2 Clicks | 0-Click-Grenze, PublicPayload und Replay-Test ergänzt |

## Runde 2026-05-15-breaker-modifier-random

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_BREAKER_MODIFIER_RANDOM_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Blink | `onr_v1_007_blink` | Bestehender deterministischer Random-/Damage-Break-Pfad blieb replay-stabil | Bestehende Engine-Abdeckung blieb grün |
| Grubb | `onr_v1_030_grubb` | Bestehender runweiter Strength-Bonus blieb korrekt auf die Grubb-Instanz beschränkt | Bestehende Engine-Abdeckung blieb grün |
| Incubator | `onr_v1_034_incubator` | Bestehender Virus-Counter-/Transform-Choice-Pfad blieb hidden-info-sicher | Bestehende Engine-Abdeckung blieb grün |
| Rabbit | `onr_v1_051_rabbit` | Nacharbeit umgesetzt: installierter Rabbit reduziert Corp-Bid-Limit bei ICE-Traces um 1 | Trace-State, PublicPayload und Revalidation ergänzt |
| Forgotten Backup Chip | `onr_v1_087_forgotten-backup-chip` | Bestehender privater Stack-Programmsuchpfad blieb redigiert | Bestehende Hidden-Zone-Abdeckung blieb grün |
| Stumble through Wilderspace | `onr_v1_112_stumble-through-wilderspace` | Bestehender trace-aware Run-/Access-Vertrag blieb unverändert | Bestehende Run-Abdeckung blieb grün |
| Artemis 2020 | `onr_v1_122_artemis-2020` | Nacharbeit umgesetzt: +2 MU, 2 recurring Icebreaker-Credits und Deck-Einzigartigkeit | Shared-Definition, Payment-Filter und Install-Test korrigiert |
| Corporate Downsizing | `onr_v1_194_corporate-downsizing` | Bestehender gescorter R&D-Top-Reveal-Pfad blieb source-bound | Bestehende Reveal-Abdeckung blieb grün |
| Strike Force Kali | `onr_v1_217_strike-force-kali` | Bestehender tagged-only Meat-Damage-Pfad blieb redigiert | Bestehende Agenda-Abdeckung blieb grün |
| Superior Net Barriers | `onr_v1_219_superior-net-barriers` | Bestehender gescorter Wall-Strength-Modifier blieb unverändert | Bestehende Modifier-Abdeckung blieb grün |
| TKO 2.0 | `onr_v1_271_tko-2-0` | Bestehender Forgo-next-action-ICE-Pfad blieb stabil | Bestehende ICE-Abdeckung blieb grün |
| Zombie | `onr_v1_280_zombie` | Bestehender Core-Damage-/End-the-run-ICE-Pfad blieb stabil | Bestehende ICE-Abdeckung blieb grün |
| City Surveillance | `onr_v1_313_city-surveillance` | Nacharbeit umgesetzt: rezzed Draw-Tax bezahlt Credits oder gibt Tags | PublicPayload, rezzed-only-Vertrag und Replay-Test ergänzt |
| South African Mining Corp | `onr_v1_343_south-african-mining-corp` | Nacharbeit umgesetzt: rezzed `[A], trash: Gain 8 credits.` | LegalAction-Revalidation, Selftrash und Payload ergänzt |
| Jerusalem City Grid | `onr_v1_360_jerusalem-city-grid` | Nacharbeit umgesetzt: servergebundene Wall-Rez-Kostenreduktion und +1 Stärke | Same-server-/other-server-Test und Source-Attribution ergänzt |

## Runde 2026-05-15-ambush-hidden-trace

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AMBUSH_HIDDEN_TRACE_IMPLEMENTATION.md`

Jobstatus: `blocked`; grüne Teilfixes wurden umgesetzt, vier größere Vollresolver bleiben als Removal Condition offen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Virus Test Site | `onr_v1_348_virus-test-site` | Teilfix umgesetzt: Advancement-skalierter Access-Schaden, Archives-No-op, R&D-Reveal-Payload | Volljob bleibt blockiert durch andere Kartenverträge |
| Setup! | `onr_v1_340_setup` | Teilfix umgesetzt: 2 Net Damage, Archives-No-op, R&D-Reveal-Payload | Volljob bleibt blockiert durch andere Kartenverträge |
| Fragmentation Storm | `onr_v1_246_fragmentation-storm` | Teilfix umgesetzt: PublicPayload für installierten Programtrash plus Damage-Zusammenfassung | Zusätzliche Revalidation bleibt im größeren Resolver-Nachtest zu prüfen |
| Deep Thought | `onr_v1_017_deep-thought` | Bestehender Recurring-/Virus-/Purge-Pfad blieb unverändert grün | Kein blockierender Codefix in diesem Lauf |
| Information Laundering | `onr_v1_328_information-laundering` | Teilfix umgesetzt: Advancement-skalierter Creditgewinn mit Selftrash und Payload | Volljob bleibt blockiert durch andere Kartenverträge |
| Edited Shipping Manifests | `onr_v1_084_edited-shipping-manifests` | Teilfix umgesetzt: redigierter `corpDrawnCount` im Access-Replacement | Kein offener Punkt aus diesem Teilpfad |
| Self-Modifying Code | `onr_v1_059_self-modifying-code` | Blockiert: Vollresolver für Run-gebundenen Stack-Programminstall fehlt | Eigenen Resolver-Scope umsetzen |
| Aujourd'Oui | `onr_v1_151_aujourdoui` | Bestehender Hidden-Zone-Search/Reveal-Pfad blieb unverändert | Fokussierte Einzelabdeckung in Folgejob empfohlen |
| N.E.T.O. | `onr_v1_169_n-e-t-o` | Bestehender Search-only-Pfad blieb unverändert | Fokussierte Einzelabdeckung in Folgejob empfohlen |
| Crystal Palace Station Grid | `onr_v1_355_crystal-palace-station-grid` | Blockiert: Counter-Wirkungsvertrag nicht finalisiert; Rez-Kostenpayload für Skälderviken separat umgesetzt | Lokalen Countervertrag finalisieren |
| Emergency Self-Construct | `onr_v1_022_emergency-self-construct` | Blockiert: Flatline-/Damage-Replacement und persistente Restzustände fehlen als enger Resolver | Eigenen Resolver-Scope umsetzen |
| Fait Accompli | `onr_v1_025_fait-accompli` | Blockiert: fortgebundene Fait-Counter und Agenda-Difficulty fehlen | Eigenen Resolver-Scope umsetzen |
| Pocket Virtual Reality | `onr_v1_260_pocket-virtual-reality` | Bestehender Trace-6/Tag-Pfad blieb unverändert | Kein Codefix in diesem Lauf |
| Romp through HQ | `onr_v1_107_romp-through-hq` | Bestehender HQ-Free-Trash-Pfad blieb unverändert | Kein Codefix in diesem Lauf |
| Skälderviken SA Beta Test Site | `onr_v1_341_skalderviken-sa-beta-test-site` | Teilfix umgesetzt: Black-ICE-only Rez-Kostenquelle und Zahlung payloadfähig | Kein offener Punkt aus diesem Teilpfad |

## Runde 2026-05-15-contacts-datapool

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_CONTACTS_DATAPOOL_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Livewire's Contacts | `onr_v1_097_livewires-contacts` | Engine-Pfad funktioniert mit Creditgain 3 und öffentlichem Credit-Payload | Fokussierte Side-/Stale-/Replay-Abdeckung ergänzt |
| Nerve Labyrinth | `onr_v1_257_nerve-labyrinth` | Engine-Pfad funktioniert mit 2 Net Damage plus End-the-run | Damage-Redaction, Continue-Revalidation und Replay ergänzt |
| Punitive Counterstrike | `onr_v1_301_punitive-counterstrike` | Engine-Pfad funktioniert tagged-only mit 2 Meat Damage | No-tag-, Side-/Stale-, Hidden-Info- und Replay-Test ergänzt |
| Efficiency Experts | `onr_v1_290_efficiency-experts` | Engine-Pfad funktioniert mit Creditgain 3 und öffentlichem Credit-Payload | Fokussierte Side-/Stale-/Replay-Abdeckung ergänzt |
| Bodyweight Synthetic Blood | `onr_v1_079_bodyweight-synthetic-blood` | Engine-Pfad funktioniert mit Draw 5 und kurzem Stack ohne Draw-Content-Leak | Draw-Count-, Corp-View- und Replay-Test ergänzt |
| Pi in the 'Face | `onr_v1_259_in-the-face` | Engine-Pfad funktioniert mit rezzed Sichtbarkeit, brechbarer ETR-Subroutine und unbroken Run-Ende | Visibility-, Break-Revalidation- und Replay-Test ergänzt |
| Antiquated Interface Routines | `onr_v1_350_antiquated-interface-routines` | Engine-Pfad funktioniert als rezzed +1-Stärkemodifier nur im eigenen Fort | Rez-Revalidation, Fremdfort-Check und Replay ergänzt |
| Endless Corridor | `onr_v1_239_endless-corridor` | Engine-Pfad funktioniert mit zwei indexstabilen End-the-run-Subroutinen | Index-, Side-/Stale-, Unbroken-ETR- und Replay-Test ergänzt |
| Closed Accounts | `onr_v1_285_closed-accounts` | Engine-Pfad funktioniert tagged-only und setzt Runner-Credits auf 0 | No-tag-, Tag-drift-, Side-/Stale- und Payload-Test ergänzt |
| Datapool by Zetatech | `onr_v1_287_datapool-by-zetatech` | Engine-Pfad funktioniert tagged-only und gibt exakt 2 Tags | No-tag-, Tag-drift-, Side-/Stale- und Payload-Test ergänzt |

## Runde 2026-05-15-immunity-cinderella

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_IMMUNITY_CINDERELLA_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Diplomatic Immunity | `onr_v1_160_diplomatic-immunity` | Nacharbeit umgesetzt: installiertes Resource-Profil verhindert Meat Damage; Korp kann per Agenda-Punkt-Forfeit canceln | Prevention-/Cancel-Payload, Agenda-Kosten und Replay ergänzt |
| AI Chief Financial Officer | `onr_v1_188_ai-chief-financial-officer` | Engine-Pfad bleibt Hidden-Zone-sicher und zieht hart maximal 5 Karten | Sourcebindung, kurze R&D, wrong-side/stale und Replay ergänzt |
| Corporate War | `onr_v1_196_corporate-war` | Engine-Pfad funktioniert an der exakt-12-Credits-Schwelle | Grenzwert-, Payload- und Replay-Test ergänzt |
| Political Coup | `onr_v1_209_political-coup` | Engine-Pfad bleibt source-bound bei mehreren gescorten Kopien | Power-Counter-Kosten, Payload und Replay ergänzt |
| Ball and Chain | `onr_v1_222_ball-and-chain` | Nacharbeit umgesetzt: Future-Encounter-Tax bezahlt oder beendet Run am nächsten ICE | Taxquelle, Zahlung/Nichtzahlung und Replay ergänzt |
| Cinderella | `onr_v1_228_cinderella` | Nacharbeit umgesetzt: Trace-Erfolg beendet Run, trasht Hardware und verursacht 2 nicht verhinderbares Meat Damage ohne Tag | Shared-/Manifest-/AI-Vertrag und Replay-Test korrigiert |
| Homewrecker | `onr_v1_248_homewrecker` | Nacharbeit umgesetzt: Trace-Erfolg analog Cinderella mit Trace 5 | Shared-/Manifest-/AI-Vertrag und Replay-Test korrigiert |
| Management Shake-Up | `onr_v1_292_management-shake-up` | Nacharbeit umgesetzt: drei Advancement-Counter auf advancebare installierte Korp-Karten | Manifest-/AI-Vertrag, Payload und Replay ergänzt |
| Corprunner's Shattered Remains | `onr_v1_315_corprunners-shattered-remains` | Nacharbeit umgesetzt: Hardwaretrash skaliert mit Advancement-Countern | Mehrhardware-Test und Count-Payload ergänzt |
| Tokyo-Chiba Infighting | `onr_v1_371_tokyo-chiba-infighting` | Engine-Pfad funktioniert servergebunden mit 2 Credits nach erfolglosem Run | Source-/Server-/Credit-Payload und Replay ergänzt |

## Runde 2026-05-15-hammer-rio

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_HAMMER_RIO_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Hammer | `onr_v1_031_hammer` | Nacharbeit umgesetzt: Stealth-Verteilungschoice revalidiert installierte Quellen, eindeutige Optionen und verfügbare Counter | Race-Härtung und bestehende Breaker-/Replay-Abdeckung grün |
| misc.for-sale | `onr_v1_100_misc-for-sale` | Engine-Pfad funktioniert mit privater Installed-Trash-Choice und Creditgain 3 pro gewähltem Top-Level-Ziel | Bestehende Dedupe-/Zone-Revalidation bleibt grün |
| Organ Donor | `onr_v1_103_organ-donor` | Engine-Pfad funktioniert mit privater Grip-Trash-Choice, Max-5-Grenze und count-basiertem Payload | Bestehende Hidden-Info-/Replay-Abdeckung bleibt grün |
| Playful AI | `onr_v1_104_playful-ai` | Nacharbeit umgesetzt: echter Playful-AI-Dice-Loop mit Runner-Choice statt einmaliger Probe | Engine- und Chroniktest ergänzt |
| Record Reconstructor | `onr_v1_142_record-reconstructor` | Engine-Pfad funktioniert als installierter Archives-Access-Helfer mit source-bound Helper-Liste | Bestehende Archives-/Visibility-Abdeckung bleibt grün |
| Haunting Inquisition | `onr_v1_247_haunting-inquisition` | Engine-Pfad funktioniert mit sechs Aktionen Run-Sperre aus ungebrochener Subroutine | Bestehende Run-Lock-/Replay-Abdeckung bleibt grün |
| Viral 15 | `onr_v1_276_viral-15` | Engine-Pfad funktioniert mit runweitem Jack-out-Tax und Runner-privater Program-Trash-Choice | Bestehende Jack-out-/Choice-/Replay-Abdeckung bleibt grün |
| Planning Consultants | `onr_v1_298_planning-consultants` | Engine-Pfad funktioniert mit privater R&D-Top-X-Reorder-Choice und vollständiger Permutation | Bestehende Hidden-Info-/Race-Abdeckung bleibt grün |
| Schlaghund | `onr_v1_339_schlaghund` | Nacharbeit umgesetzt: Tag-vs-Wurf-Vergleich verursacht 10 Meat Damage und Selbsttrash statt Probe-Stub | Engine- und Chroniktest ergänzt |
| Rio de Janeiro City Grid | `onr_v1_367_rio-de-janeiro-city-grid` | Nacharbeit umgesetzt: automatischer after-pass-rezzed-ICE-Trigger am eigenen Fort beendet Run bei Wurf 1 | Engine- und Chroniktest ergänzt |

## Runde 2026-05-15-ai-boon-virizz

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AI_BOON_VIRIZZ_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| AI Boon | `onr_v1_002_ai-boon` | Nacharbeit umgesetzt: automatischer Run-Start-Wurf setzt run-lokale Stärke | Manuelle Probe entfernt; PublicPayload, Replay und Cleanup-Test ergänzt |
| Security Code WORM Chip | `onr_v1_109_security-code-worm-chip` | Engine-Pfad funktioniert mit erfolgreichem HQ-Run und unrezzed-ICE-Choice | Bestehende Choice-Revalidation bleibt grün |
| Synchronized Attack on HQ | `onr_v1_113_synchronized-attack-on-hq` | Engine-Pfad funktioniert mit privater Korp-HQ-Retain-Choice | Bestehende Kosten-/Hidden-Info-Revalidation bleibt grün |
| Triggerman | `onr_v1_273_triggerman` | Engine-Pfad funktioniert mit deterministischem installed-program Trash | Bestehende V1.6.3-Abdeckung bleibt grün |
| ZZ22 Speed Chip | `onr_v1_147_zz22-speed-chip` | Nacharbeit umgesetzt: Installkosten 5 und 2 Killer-restricted Recurring Credits | Shared-Definition, Payment-Filter und Engine-Test korrigiert |
| Cortical Scanner | `onr_v1_230_cortical-scanner` | Engine-Pfad funktioniert mit drei indexstabilen End-the-run-Subroutinen | Bestehende ICE-/Replay-Abdeckung bleibt grün |
| Virizz | `onr_v1_277_virizz` | Engine-Pfad funktioniert mit rest-of-run Break-Kostenmodifier | Bestehende V1.9.22-Abdeckung bleibt grün |
| Anonymous Tip | `onr_v1_077_anonymous-tip` | Engine-Pfad funktioniert mit public Black-ICE-Derez-Choice | Bestehende Ziel-Revalidation bleibt grün |
| Canis Minor | `onr_v1_226_canis-minor` | Engine-Pfad funktioniert mit Future-Encounter-Strength-Bonus | Bestehende V1.8.1-Abdeckung bleibt grün |
| Newsgroup Taunting | `onr_v1_332_newsgroup-taunting` | Nacharbeit umgesetzt: rezzed globaler Run-Start-Tax von 1 Credit | Engine-Test und AI-Hint korrigiert |

## Runde 2026-05-15-turbeau-tutor

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TURBEAU_TUTOR_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Turbeau Delacroix | `onr_v1_372_turbeau-delacroix` | Nacharbeit umgesetzt: Access-Trace 4, einmal pro Run auf dem Fort, keine Run-Start-Tax | Engine-Test und AI-/Manifest-Vertrag korrigiert |
| Dieter Esslin | `onr_v1_357_dieter-esslin` | Nacharbeit umgesetzt: einfacher 1-Net-Damage-Access-Ambush ohne Hidden-Zone-Stub | PublicPayload und Tests präzisiert |
| Corporate Negotiating Center | `onr_v1_314_corporate-negotiating-center` | Nacharbeit umgesetzt: Start-of-turn-HQ-Agenda-Reveal mit Creditgewinn | Hidden-Info-Choice, Replay und AI-Hint korrigiert |
| Krumz | `onr_v1_330_krumz` | Nacharbeit umgesetzt: Trace-Bid-Bit mit Corp-Start-Refresh statt eigener Trace | Trace-Kostenlogik und PublicPayload ergänzt |
| I Got a Rock | `onr_v1_327_i-got-a-rock` | Nacharbeit umgesetzt: doppelt getaggter Runner, 3 Agenda-Punkte Kosten, 15 Meat Damage | Engine-Test und AI-/Manifest-Vertrag ergänzt |
| Dedicated Response Team | `onr_v1_356_dedicated-response-team` | Nacharbeit umgesetzt: 3 Meat Damage nur bei bereits getaggtem Runner, kein Tag-Gain | Damage-/No-op-Test und AI-Hint korrigiert |
| Systematic Layoffs | `onr_v1_304_systematic-layoffs` | Nacharbeit umgesetzt: explizite Forfeit-Choice bei mehreren Corp-Agenden | Choice-Revalidation und Registervertrag ergänzt |
| Rescheduler | `onr_v1_336_rescheduler` | Nacharbeit umgesetzt: HQ in R&D mischen und gleiche Anzahl ziehen | Hidden-Info-/RandomDrawRecord-Test ergänzt |
| Tutor | `onr_v1_274_tutor` | Nachtest bestätigt: bestehender V1.9.22-Resolver bleibt replay-stabil | Kein Codefix nötig |
| Ice Transmutation | `onr_v1_204_ice-transmutation` | Nacharbeit umgesetzt: Score-Choice auf rezzed ICE, +1 Stärke und Subroutine-Duplikation | Engine-Test und V1.9.20 Artefakte korrigiert |

## Runde 2026-05-15-ramming-galveston

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_RAMMING_GALVESTON_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Ramming Piston | `onr_v1_053_ramming-piston` | Nacharbeit umgesetzt: echter Wall-Breaker mit Pump und exakt 2 Stealth-Folgekosten | Engine-Test und AI-/Manifest-Vertrag korrigiert |
| Skivviss | `onr_v1_064_skivviss` | Nacharbeit umgesetzt: erfolgreiche R&D-Runs legen Virus-Counter, Corp-Zugstart zieht Zusatzkarten | Recurring-Stub entfernt; V1.9.12 Artefakte korrigiert |
| Core Command: Jettison Ice | `onr_v1_080_core-command-jettison-ice` | Engine-Pfad funktioniert: erfolgreicher HQ-Run, Rez-Kosten-Zahlung und öffentlicher ICE-Trash | Bestehende V1.9.22-Abdeckung bleibt grün |
| Weather-to-Finance Pipe | `onr_v1_118_weather-to-finance-pipe` | Engine-Pfad funktioniert; Access-Replacement-Payload ist chronikfähiger | Hidden-Zone-Barriere und Creditverlust-Payload präzisiert |
| Bodyweight Data Creche | `onr_v1_123_bodyweight-data-creche` | Nacharbeit umgesetzt: Installkosten 3, +1 MU, Deck-Einzigartigkeit und Bonus-Run | Engine-Test, AI-Hint und V1.9.22 Contract ergänzt |
| Rigged Investments | `onr_v1_174_rigged-investments` | Nacharbeit umgesetzt: sechs Bit-Counter, Start-of-turn-Credit und Auto-Trash | Recurring-Stub entfernt; V1.9.12 Artefakte korrigiert |
| The Short Circuit | `onr_v1_177_the-short-circuit` | Nacharbeit umgesetzt: private Stack-Programm-Suche, Reveal, Shuffle und Trash-on-use | Engine-Test und V1.9.11 Artefakte korrigiert |
| Data Raven | `onr_v1_236_data-raven` | Nacharbeit umgesetzt: Runner kann Counter für `[A]` und 1 Credit entfernen | Engine-Test und AI-Hint ergänzt |
| Experimental AI | `onr_v1_323_experimental-ai` | Nacharbeit umgesetzt: Advancement-Counter steuern Programm-Trash-Anzahl | Engine-Test und V1.9.19 Artefakte korrigiert |
| New Galveston City Grid | `onr_v1_362_new-galveston-city-grid` | Nacharbeit umgesetzt: servergebundener +2-Trashkosten-Modifikator statt R&D-Reveal | Engine-Test und V1.9.18 Artefakte korrigiert |

## Runde 2026-05-15-netwatch-spinn

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_NETWATCH_SPINN_IMPLEMENTATION.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Netwatch Operations Office | `onr_v1_207_netwatch-operations-office` | Engine-Pfad funktioniert mit Trace 2; Chronik/ApplyAction-Härtung ergänzt | Wrong-Side/Stale- und PublicPayload-Test ergänzt |
| Encryption Breakthrough | `onr_v1_200_encryption-breakthrough` | Nacharbeit umgesetzt: Code-Gate-Stärkebonus und Score-Reveal/Credit-Pfad | Engine-Test und AI-Hint ergänzt |
| Bartmoss Memorial Icebreaker | `onr_v1_005_bartmoss-memorial-icebreaker` | Engine-Pfad funktioniert; Bartmoss-Post-Encounter-Ausgang wird öffentlich payloadfähig | PublicPayload ergänzt; bestehende RandomDrawRecord-Tests bleiben grün |
| Dr. Dreff | `onr_v1_358_dr-dreff` | Engine-Pfad funktioniert: Power-Counter und Run-Start-Tax bleiben source-bound | Bestehende V1.9.18-Abdeckung bleibt grün |
| Data Masons | `onr_v1_317_data-masons` | Engine-Pfad funktioniert mit rezzed Wall-Rez-/Stärke-Modifikator | Bestehende Tests auf Security-Net-Drift angepasst |
| Washington, D.C., City Grid | `onr_v1_374_washington-d-c-city-grid` | Engine-Pfad funktioniert als rezzed servergebundener Difficulty-Modifier | Bestehende V1.9.19-Abdeckung bleibt grün |
| Crybaby | `onr_v1_354_crybaby` | Nacharbeit umgesetzt: Access-Crying-Counter, Trace-Link-Reduktion und Runner-Removal | Engine-Test und AI-Hint ergänzt |
| Security Net Optimization | `onr_v1_215_security-net-optimization` | Nacharbeit umgesetzt: scored Agenda speichert gewählten Fort und bufft nur dortige ICE | Engine-/Katalogtext angepasst |
| Japanese Water Torture | `onr_v1_037_japanese-water-torture` | Engine-Pfad funktioniert mit Future-Action-Debt und Wall-Break | Bestehende V1.9.22-Abdeckung bleibt grün |
| Spinn Public Relations | `onr_v1_344_spinn-public-relations` | Nacharbeit umgesetzt: öffentlicher Bit-Pool statt generischer Sofortcredits | Engine-Test und AI-Hint ergänzt |

## Runde 2026-05-14-B

Auswahlart: zufällige 10er-Stichprobe aus komplexeren bereits decklegalen Originalset-Karten, unter Ausschluss der Runde 2026-05-14-A.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_14_B.md`

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Butcher Boy | `onr_v1_009_butcher-boy` | Nacharbeit umgesetzt: HQ-Erfolgsrun-Counter und Start-of-turn-Credit je 2 Counter funktionieren | Fokussierter Engine-Test ergänzt |
| Dupré | `onr_v1_020_dupre` | Nacharbeit umgesetzt: echter Code-Gate-Breaker mit Strength-Countern und Fortwechsel-Reset | Fokussierter Engine-Test ergänzt |
| Invisibility | `onr_v1_035_invisibility` | Engine-Pfad funktioniert; Recurring-Credit-Install wird in der Chronik sichtbar | Chroniktest ergänzt |
| Pattel’s Virus | `onr_v1_046_pattels-virus` | Nacharbeit umgesetzt: Mehr-ICE-Zielwahl und Counterplatzierung funktionieren | Engine- und Chroniktests ergänzt |
| Pox | `onr_v1_049_pox` | Engine-Pfad funktioniert; Counterplatzierung und Install-Tax werden in der Chronik sichtbar | Chroniktest ergänzt |
| Arasaka Owns You | `onr_v1_078_arasaka-owns-you` | Nacharbeit umgesetzt: Flatline-Replacement verhindert Schaden, refreshed Hand, entfernt Tags/Core Damage und setzt Aktions-/Agenda-Schuld | Engine- und Chroniktests ergänzt |
| Data Fort Reclamation | `onr_v1_197_data-fort-reclamation` | Engine-Pfad funktioniert mit Hidden-Info-Schutz; Install-/Rez-Sequenz wird in der Chronik sichtbar | Chroniktest ergänzt |
| Fang 2.0 | `onr_v1_241_fang-2-0` | Nacharbeit umgesetzt: erfolgreicher Trace beendet den Run und setzt eine bezahlbare Run-Sperre | Engine- und Chroniktests ergänzt |
| Hacker Tracker Central | `onr_v1_325_hacker-tracker-central` | Nacharbeit umgesetzt: Trace-Counter werden nach Traces gelegt und können für Corp-Bids ausgegeben werden | Engine- und Chroniktests ergänzt |
| Aardvark | `onr_v1_349_aardvark` | Engine-Pfad funktioniert mit Choice und Replay/StateHash; Rez-/Trash-Worm-Choice wird in der Chronik sichtbar | Chroniktest ergänzt |

## Runde 2026-05-14-A

Auswahlart: zufällige 10er-Stichprobe aus komplexeren bereits decklegalen Originalset-Karten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Security Purge | `onr_v1_216_security-purge` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Mastiff | `onr_v1_255_mastiff` | Funktioniert komplett | Kein offener Punkt |
| Edgerunner, Inc., Temps | `onr_v1_289_edgerunner-inc-temps` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Valu-Pak Software Bundle | `onr_v1_117_valu-pak-software-bundle` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Flak | `onr_v1_027_flak` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Boardwalk | `onr_v1_008_boardwalk` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Bioweapons Engineering | `onr_v1_190_bioweapons-engineering` | Nachtest hat fehlenden fokussierten Pfad gefunden; Engine-Fix und Einzeltest ergänzt | +1 Meat-Damage-Modifier nachprogrammiert |
| Shield | `onr_v1_061_shield` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |
| Reflector | `onr_v1_055_reflector` | Engine funktioniert; Chronik nachgeschärft | Breaker-Chronik nachgeschärft |
| Quest for Cattekin | `onr_v1_172_quest-for-cattekin` | Engine funktioniert; Chronik nachgeschärft | Chronik-spezifischer Test ergänzt |

## Auswahlregel für Folgerunden

- Standardmäßig Karten mit `spotcheckStatus = "completed"` aus der Zufallsauswahl ausschließen.
- Karten mit `followUpStatus = "fixed_and_tested"` dürfen erst wieder gewählt werden, wenn gezielt Regressionen geprüft werden.
- Karten mit `followUpStatus = "open"` in einer Folgerunde priorisieren, nicht zufällig doppelt ziehen.
