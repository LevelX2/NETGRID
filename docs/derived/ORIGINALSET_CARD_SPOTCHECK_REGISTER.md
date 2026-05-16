# Originalset-Karten-Nachtest-Register

Zweck: Dieses Register hält fest, welche Originalset-Karten bereits in einer vertieften Stichprobe geprüft wurden. Neue zufällige Nachtest-Runden sollen diese Karten standardmäßig ausschließen, außer es gibt einen konkreten Regressionsverdacht oder eine Nacharbeitsprüfung.

Maschinenlesbare Begleitdatei: `data/reports/originalset-card-spotcheck-register.json`

## Runde 2026-05-15-hosting-damage-multiaccess

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_HOSTING_DAMAGE_MULTIACCESS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Pflichtchecks sind grün, lokaler Commit wurde erstellt.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Microtech AI Interface | `onr_v1_041_microtech-ai-interface` | Bestehende Multiaccess-Abdeckung bleibt leakfrei | Bestehende Tests/Verträge geprüft |
| Poltergeist | `onr_v1_048_poltergeist` | Node-Trash-Recurring-Credits sind implementiert | Zahlungs-/Refresh-/Replay-Test ergänzt |
| Succubus | `onr_v1_069_succubus` | Bestehende Hosting-Kaskade bleibt stabil | Bestehende Tests/Verträge geprüft |
| Mantis, Fixer-at-Large | `onr_v1_099_mantis-fixer-at-large` | Hidden-Zone-Search bleibt public-safe | Bestehende Tests/Verträge geprüft |
| Priority Wreck | `onr_v1_105_priority-wreck` | R&D-Multiaccess-Queue bleibt ohne Future-Leak | Bestehende Tests/Verträge geprüft |
| Lifesaver Nanosurgeons | `onr_v1_130_lifesaver-nanosurgeons` | Damage-Prevention-Fenster bleibt source-bound | Bestehende Tests/Verträge geprüft |
| PK-6089a | `onr_v1_138_pk-6089a` | Deck-MU und Trace-Link-Recurring-Credits sind implementiert | Install-/Trace-/Refresh-/Replay-Test ergänzt |
| Data Darts | `onr_v1_234_data-darts` | Next-ICE-No-Break-Modifier ist implementiert | Modifier-/Damage-/Replay-Test ergänzt |
| New Blood | `onr_v1_294_new-blood` | Vorzug-Run-History-Gate bleibt stabil | Bestehende Tests/Verträge geprüft |
| Holovid Campaign | `onr_v1_326_holovid-campaign` | 12-Bit-Lifecycle mit Zugstart-Drain und Selftrash ist implementiert | Counter-/Selftrash-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-resource-contacts

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_RESOURCE_CONTACTS_IMPLEMENTATION.md`

Jobstatus: `commit_pending`; Umsetzung und Pflichtchecks sind grün, lokales Staging/Commit ist durch eine `.git`-ACL-Sperre blockiert.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Crash Everett, Inventive Fixer | `onr_v1_157_crash-everett-inventive-fixer` | Resource-Installation bleibt source-bound und replaybar | Install-/Leak-/Replay-Test ergänzt |
| Danshi's Second ID | `onr_v1_158_danshis-second-id` | Tag-Removal veröffentlicht entfernte Tags und Resttags | Payload-/Removed-source-/Replay-Test ergänzt |
| Databroker | `onr_v1_159_databroker` | Agenda-Punkt-Kosten und Creditgewinn bleiben source-bound | Cost-/Payload-/Replay-Test ergänzt |
| Field Reporter for Ice and Data | `onr_v1_162_field-reporter-for-ice-and-data` | Resource-Installation bleibt source-bound und replaybar | Install-/Leak-/Replay-Test ergänzt |
| Floating Runner BBS | `onr_v1_163_floating-runner-bbs` | Start-of-turn-Credit bleibt replaybar | Turn-/Replay-Test ergänzt |
| Junkyard BBS | `onr_v1_165_junkyard-bbs` | Resource-Installation bleibt source-bound und replaybar | Install-/Leak-/Replay-Test ergänzt |
| Karl de Veres, Corporate Stooge | `onr_v1_166_karl-de-veres-corporate-stooge` | Resource-Installation bleibt source-bound und replaybar | Install-/Leak-/Replay-Test ergänzt |
| Leland, Corporate Bodyguard | `onr_v1_167_leland-corporate-bodyguard` | Resource-Installation bleibt source-bound und replaybar | Install-/Leak-/Replay-Test ergänzt |
| Loan from Chiba | `onr_v1_168_loan-from-chiba` | Recurring-Credits refreshen turn-sicher | Counter-/Turn-/Replay-Test ergänzt |
| The Shell Traders | `onr_v1_176_the-shell-traders` | Recurring-Credit refresh't turn-sicher | Counter-/Turn-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-program-prevention-tools

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_PROGRAM_PREVENTION_TOOLS_IMPLEMENTATION.md`

Jobstatus: `commit_pending`; Umsetzung und Pflichtchecks sind grün, lokales Staging/Commit ist durch eine `.git`-ACL-Sperre blockiert.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Dwarf | `onr_v1_021_dwarf` | Wall-Breaker-Aktion bleibt an installierte Quelle gebunden | Breaker-/Removed-source-/Replay-Test ergänzt |
| Expert Schedule Analyzer | `onr_v1_024_expert-schedule-analyzer` | Access-Pfad bleibt hidden-info-sicher | Install-/Access-/Replay-Test ergänzt |
| Force Shield | `onr_v1_028_force-shield` | Core-/Net-Damage-Prevention bleibt source-bound | Prevention-/Replay-Test ergänzt |
| Imp | `onr_v1_033_imp` | Daemon-Hosting revalidiert die Host-Quelle | Host-/Removed-source-/Replay-Test ergänzt |
| Jackhammer | `onr_v1_036_jackhammer` | Wall-Breaker und gehostete Installation bleiben source-bound | Host-/Breaker-/Replay-Test ergänzt |
| Joan of Arc | `onr_v1_038_joan-of-arc` | Core-/Net-Damage-Prevention bleibt source-bound | Prevention-/Replay-Test ergänzt |
| Krash | `onr_v1_039_krash` | Universeller Breaker bleibt source-bound und stateVersion-sicher | Breaker-/Removed-source-/Replay-Test ergänzt |
| Loony Goon | `onr_v1_040_loony-goon` | Sentry-Breaker bleibt an installierte Quelle gebunden | Breaker-/Removed-source-/Replay-Test ergänzt |
| Mouse | `onr_v1_042_mouse` | Expose-Tool nennt sichere Source und bleibt hidden-info-sicher | Hidden-Zone-/Removed-source-/Replay-Test ergänzt |
| R&D-Protocol Files | `onr_v1_050_r-and-d-protocol-files` | Recurring-Stealth-Installation bleibt payload- und replay-sicher | Counter-/Install-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-program-core

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_PROGRAM_CORE_IMPLEMENTATION.md`

Jobstatus: `commit_pending`; Umsetzung und Pflichtchecks sind grün, lokales Staging/Commit ist durch eine `.git`-ACL-Sperre blockiert.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Afreet | `onr_v1_001_afreet` | Daemon-Install und Bakdoor-Hosting bleiben source-bound und replaybar | Install-/Host-/Replay-Test ergänzt |
| Baedeker's Net Map | `onr_v1_003_baedekers-net-map` | Link-Programm-Installation bleibt side-, stateVersion- und source-sicher | Install-/Leak-/Replay-Test ergänzt |
| Bakdoor | `onr_v1_004_bakdoor` | Installation und Afreet-Hosting bleiben öffentlich und replay-sicher | Install-/Host-/Replay-Test ergänzt |
| Black Dahlia | `onr_v1_006_black-dahlia` | Killer-Breaker-Aktion bleibt an installierte Quelle gebunden | Breaker-/Removed-source-/Replay-Test ergänzt |
| Cascade | `onr_v1_010_cascade` | Virus-/Recurring-Counter werden beim Install stabil gesetzt | Counter-/Install-/Replay-Test ergänzt |
| Clown | `onr_v1_012_clown` | Encounter-Stärkemodifier bleibt im Run-Fenster replaybar | Modifier-/Run-Replay-Test ergänzt |
| Codeslinger | `onr_v1_015_codeslinger` | Sentry-Break bleibt an installierte Quelle gebunden | Breaker-/Removed-source-/Replay-Test ergänzt |
| Cyfermaster | `onr_v1_016_cyfermaster` | Code-Gate-Break bleibt an installierte Quelle gebunden | Breaker-/Removed-source-/Replay-Test ergänzt |
| Dogcatcher | `onr_v1_018_dogcatcher` | Universeller Breaker bleibt source-bound und stateVersion-sicher | Breaker-/Removed-source-/Replay-Test ergänzt |
| Dropp | `onr_v1_019_dropp` | Universeller Breaker bleibt source-bound und stateVersion-sicher | Breaker-/Removed-source-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-hardware-link-resources

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_HARDWARE_LINK_RESOURCES_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Green Knight Surge Buffers | `onr_v1_128_green-knight-surge-buffers` | Net-Damage-Prevention bleibt source-bound und public-safe | Prevention-/Replay-Test ergänzt |
| Militech MRAM Chip | `onr_v1_133_militech-mram-chip` | Hardware-Installation bleibt öffentlich ohne private Zonenleaks | Install-/Leak-/Replay-Test ergänzt |
| Raven Microcyb Owl | `onr_v1_141_raven-microcyb-owl` | Link-Hardware-Installation bleibt payload- und replay-sicher | Install-/Leak-/Replay-Test ergänzt |
| Techtronica Utility Suit | `onr_v1_143_techtronica-utility-suit` | Meat-Damage-Prevention bleibt source-bound und public-safe | Prevention-/Replay-Test ergänzt |
| Tycho Mem Chip | `onr_v1_144_tycho-mem-chip` | Memory-Hardware-Installation bleibt payload- und replay-sicher | Install-/Leak-/Replay-Test ergänzt |
| WuTech Mem Chip | `onr_v1_145_wutech-mem-chip` | Memory-Hardware-Installation bleibt payload- und replay-sicher | Install-/Leak-/Replay-Test ergänzt |
| Zetatech Mem Chip | `onr_v1_146_zetatech-mem-chip` | Memory-Hardware-Installation bleibt payload- und replay-sicher | Install-/Leak-/Replay-Test ergänzt |
| Back Door to Hilliard | `onr_v1_152_back-door-to-hilliard` | Resource-Installation bleibt öffentlich ohne private Zonenleaks | Install-/Leak-/Replay-Test ergänzt |
| Back Door to Orbital Air | `onr_v1_153_back-door-to-orbital-air` | Resource-Installation bleibt öffentlich ohne private Zonenleaks | Install-/Leak-/Replay-Test ergänzt |
| Broker | `onr_v1_154_broker` | Load-/Take-Credits-Aktionen bleiben source-bound und einmal pro Zug begrenzt | Removed-source-/Counter-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-event-run-access

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_EVENT_RUN_ACCESS_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| All-Nighter | `onr_v1_076_all-nighter` | Bonusrun-Markierung bleibt source-bound und replay-sicher | Wrong-Side-/Removed-source-/Replay-Test ergänzt |
| Custodial Position | `onr_v1_081_custodial-position` | R&D-Multiaccess veröffentlicht nur Access-Anzahl | Run-Payload-/Replay-Test ergänzt |
| Desperate Competitor | `onr_v1_083_desperate-competitor` | Same-turn-Gray-Ops-Gate score't nur die Eventkarte | Gate-/Payload-/Replay-Test ergänzt |
| Executive Wiretaps | `onr_v1_085_executive-wiretaps` | HQ-Multiaccess veröffentlicht nur Access-Anzahl | Run-Payload-/Replay-Test ergänzt |
| Gideon's Pawnshop | `onr_v1_089_gideons-pawnshop` | Stack-Suche bleibt Hidden-Zone-geschützt | Choice-/Replay-Test ergänzt |
| Hot Tip for WNS | `onr_v1_090_hot-tip-for-wns` | Same-turn-Black-Ops-Gate score't nur die Eventkarte | Gate-/Payload-/Replay-Test ergänzt |
| Inside Job | `onr_v1_094_inside-job` | First-ICE-Bypass bleibt payload- und replay-sicher | Run-Payload-/Replay-Test ergänzt |
| Jack 'n' Joe | `onr_v1_095_jack-n-joe` | Draw-3-Ergebnis bleibt payloadfähig | Draw-/Replay-Test ergänzt |
| Kilroy Was Here | `onr_v1_096_kilroy-was-here` | Access-Trash bleibt kostenlos und replay-sicher | Access-Trash-/Replay-Test ergänzt |
| Lucidrine Booster Drug | `onr_v1_098_lucidrine-booster-drug` | Sonderlauf beendet stabil ohne offenen Run-State | Run-End-/Replay-Test ergänzt |

## Runde 2026-05-16-runner-event-hardware-prevention

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_EVENT_HARDWARE_PREVENTION_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| MIT West Tier | `onr_v1_101_mit-west-tier` | Hidden-Zone-Shuffle und Removed-from-game-Bewegung bleiben source- und replay-sicher | Removed-source-/Replay-Test ergänzt |
| Open-Ended Mileage Program | `onr_v1_102_open-ended-mileage-program` | Tag-Removal und optionale Return-Choice bleiben source-bound | Removed-source-/Choice-Replay-Test ergänzt |
| Score! | `onr_v1_108_score` | Brutto-Creditgewinn und Runner-Creditstand sind payloadfähig | PublicPayload-Härtung ergänzt |
| Social Engineering | `onr_v1_111_social-engineering` | Run-Event bleibt side-safe und nennt nur öffentliche Run-Daten | Wrong-Side-/Replay-Test ergänzt |
| Temple Microcode Outlet | `onr_v1_114_temple-microcode-outlet` | Stack-Suche bleibt Hidden-Zone-geschützt und replay-sicher | Choice-/Replay-Test ergänzt |
| Terrorist Reprisal | `onr_v1_115_terrorist-reprisal` | HQ-Random-Discard veröffentlicht nur die Anzahl | PublicPayload-Härtung und Replay-Test ergänzt |
| Total Genetic Retrofit | `onr_v1_116_total-genetic-retrofit` | Tag-Removal-Ergebnis ist payloadfähig | PublicPayload-/Replay-Test ergänzt |
| Armadillo Armored Road Home | `onr_v1_120_armadillo-armored-road-home` | Hardware-Installation bleibt öffentlich ohne private Leaks | Install-/Leak-Test ergänzt |
| Dermatech Bodyplating | `onr_v1_125_dermatech-bodyplating` | Meat-Prevention-Choice bleibt source-bound und replay-sicher | Prevention-/Replay-Test ergänzt |
| Drifter Mobile Environment | `onr_v1_126_drifter-mobile-environment` | Hardware-Installation bleibt öffentlich ohne private Leaks | Install-/Leak-Test ergänzt |

## Runde 2026-05-16-resource-agenda-scorearea

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RESOURCE_AGENDA_SCOREAREA_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Short-Term Contract | `onr_v1_178_short-term-contract` | Resource-Counter-Aktion bleibt source-bound und replay-sicher | Wrong-Side/Stale-/Removed-source-Test ergänzt |
| Silicon Saloon Franchise | `onr_v1_179_silicon-saloon-franchise` | Gain-1/Draw-1-Ergebnis ist payloadfähig und definitionsgebunden | Payload-Härtung und Drift-Test ergänzt |
| Technician Lover | `onr_v1_183_technician-lover` | Sichtbare Resource-Installation bleibt ohne private Zonenleaks chronikfähig | Install-/Leak-Test ergänzt |
| Top Runners' Conference | `onr_v1_184_top-runners-conference` | Start-of-turn-Credits und Run-Start-Trash bleiben replay-sicher | Turn-/Run-Replay-Test ergänzt |
| Trauma Team | `onr_v1_185_trauma-team` | Meat-Prevention-Choice bleibt source-bound und public-safe | Prevention-/Replay-Test ergänzt |
| Umbrella Policy | `onr_v1_186_umbrella-policy` | Damage-Prevention-Choice bleibt source-bound und public-safe | Prevention-/Replay-Test ergänzt |
| Employee Empowerment | `onr_v1_199_employee-empowerment` | ScoreArea-Start-of-Corp-turn-Credit bleibt aktiv | ScoreArea-Turn-Test ergänzt |
| Marine Arcology | `onr_v1_206_marine-arcology` | ScoreArea-Aktion bleibt source-bound und payloadfähig | Removed-source-/Replay-Test ergänzt |
| Project Babylon | `onr_v1_214_project-babylon` | Overadvance-Bonuspunkte werden öffentlich payloadfähig | PublicPayload-Härtung ergänzt |
| Tycho Extension | `onr_v1_220_tycho-extension` | Score-Pfad bleibt stateVersion- und replay-sicher | Score-/Replay-Test ergänzt |

## Runde 2026-05-16-corp-operation-asset-node

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_CORP_OPERATION_ASSET_NODE_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Night Shift | `onr_v1_295_night-shift` | Gain-2/Draw-1-Ergebnis ist public payloadfähig ohne HQ-Leak | Operation-Payload-Test ergänzt |
| Overtime Incentives | `onr_v1_297_overtime-incentives` | Aktionsgewinn bleibt LegalAction-only und payloadfähig | Replay-/Payload-Test ergänzt |
| Trojan Horse | `onr_v1_306_trojan-horse` | Agenda-Theft-Gate bleibt stabil; Tag-Ergebnis ist payloadfähig | Gate-/Replay-Test ergänzt |
| Blood Cat | `onr_v1_310_blood-cat` | Rezzed Asset startet Trace 5 source-bound | Trace-/Replay-Test ergänzt |
| Braindance Campaign | `onr_v1_311_braindance-campaign` | Rezzed Economy-Asset-Aktion bleibt source- und replay-sicher | Asset-Action-Test ergänzt |
| Cowboy Sysop | `onr_v1_316_cowboy-sysop` | Installed-card-Ziel wird beim Resolve erneut geprüft | Target-Drift-Test ergänzt |
| Department of Truth Enhancement | `onr_v1_318_department-of-truth-enhancement` | Generischer Asset-Access/Trash bleibt payload- und replay-safe | Access-/Trash-Test ergänzt |
| Encoder, Inc. | `onr_v1_320_encoder-inc` | Code-Gate-Rez-Kostenmodifier bleibt rezzed-source-bound | Rez-Kosten-Test ergänzt |
| ESA Contract | `onr_v1_321_esa-contract` | Rezzed Economy-Asset-Aktion bleibt source- und replay-sicher | Asset-Action-Test ergänzt |
| Remote Facility | `onr_v1_335_remote-facility` | Action-Asset-Aktion nennt sichtbare öffentliche Quelle | PublicPayload-Source-Test ergänzt |

## Runde 2026-05-16-corp-ice-trace-barriers

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_CORP_ICE_TRACE_BARRIERS_IMPLEMENTATION.md`

Jobstatus: `committed`; Umsetzung und Pflichtchecks sind grün, der lokale Commit-Blocker ist im Abschlusslauf nicht mehr aufgetreten.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Asp | `onr_v1_221_asp` | Trace-5-Subroutine bleibt source-bound, taggt bei Erfolg und replayt stabil | Trace-/Rez-Test ergänzt |
| Banpei | `onr_v1_223_banpei` | Programm-Trash veröffentlicht Definition statt Instanz-ID | Payload-Härtung und Replay-Test ergänzt |
| Cortical Scrub | `onr_v1_231_cortical-scrub` | Core-Damage und Runende bleiben payload- und replay-safe | Damage-/Rez-Test ergänzt |
| Crystal Wall | `onr_v1_232_crystal-wall` | ETR-Barriere bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |
| Fire Wall | `onr_v1_245_fire-wall` | ETR-Barriere bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |
| Hunter | `onr_v1_249_hunter` | Trace-5-Subroutine bleibt source-bound, taggt bei Erfolg und replayt stabil | Trace-/Rez-Test ergänzt |
| Keeper | `onr_v1_252_keeper` | ETR-Code-Gate bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |
| Mazer | `onr_v1_256_mazer` | ETR-Code-Gate bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |
| Quandary | `onr_v1_261_quandary` | ETR-Code-Gate bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |
| Scramble | `onr_v1_266_scramble` | ETR-Code-Gate bleibt hidden-until-rez und replay-safe | Rez-/Continue-Test ergänzt |

## Runde 2026-05-16-corp-ice-operation-economy

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_CORP_ICE_OPERATION_ECONOMY_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Sentinels Prime | `onr_v1_267_sentinels-prime` | Rez-/Encounter-Pfad und Programm-Trash bleiben sichtbarkeits- und replay-sicher | ICE-Visibility-/Unbroken-Test ergänzt |
| Sleeper | `onr_v1_270_sleeper` | End-the-run-ICE bleibt rez-, side- und stateVersion-sicher | ICE-Visibility-/Replay-Test ergänzt |
| Wall of Static | `onr_v1_279_wall-of-static` | End-the-run-ICE bleibt rez-, side- und stateVersion-sicher | ICE-Visibility-/Replay-Test ergänzt |
| Accounts Receivable | `onr_v1_281_accounts-receivable` | Gain-9-Ergebnis ist public payloadfähig ohne HQ-Leak | Operation-Payload-Test ergänzt |
| Annual Reviews | `onr_v1_282_annual-reviews` | Draw-3-Ergebnis ist public payloadfähig ohne HQ-Leak | Operation-Payload-Test ergänzt |
| Audit of Call Records | `onr_v1_283_audit-of-call-records` | Trace 5 bleibt an zwei Runner-Run-Attempts des Vorzugs gebunden | Trace-/Replay-Test ergänzt |
| Chance Observation | `onr_v1_284_chance-observation` | Trace 5 bleibt an mindestens einen Runner-Run-Attempt des Vorzugs gebunden | Trace-/Replay-Test ergänzt |
| Corporate Detective Agency | `onr_v1_286_corporate-detective-agency` | Resource-Trash veröffentlicht Definitionen statt Instanz-IDs | Redaction-/Replay-Test ergänzt |
| Day Shift | `onr_v1_288_day-shift` | Draw-2/Gain-1-Ergebnis ist public payloadfähig ohne HQ-Leak | Operation-Payload-Test ergänzt |
| Falsified-Transactions Expert | `onr_v1_291_falsified-transactions-expert` | Power-Counter-Operation bleibt ziel- und payload-sicher | V1.9.19-Counter-Test ergänzt |

## Runde 2026-05-16-corp-asset-upgrade-rest

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_CORP_ASSET_UPGRADE_REST_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Rockerboy Promotion | `onr_v1_337_rockerboy-promotion` | Rezzed Economy-Asset bleibt side-, stateVersion- und source-sicher | Source-Removal-, PublicPayload- und Replay-Test ergänzt |
| Chester Mix | `onr_v1_352_chester-mix` | ICE-Installkostenreduktion bleibt auf den eigenen Server begrenzt | Server-Scope-Test ergänzt |
| Chimera | `onr_v1_353_chimera` | Daemon-Trash-Choice revalidiert die accessed Source beim Resolve | Source-Removal-Guard und PublicPayload-Kontext ergänzt |
| Namatoki Plaza | `onr_v1_361_namatoki-plaza` | Generischer rezzed Upgrade-Access/Trash bleibt payload- und replay-safe | Access-/Trash-Test ergänzt |

## Runde 2026-05-16-breaker-ice-subtype-mix

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_BREAKER_ICE_SUBTYPE_MIX_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Raffles | `onr_v1_052_raffles` | Code-Gate-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Raptor | `onr_v1_054_raptor` | Sentry-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| SeeYa | `onr_v1_058_seeya` | Expose-Ziel wird revalidiert und hidden-zone-redigiert | Ziel-Drift-Test ergänzt |
| Shaka | `onr_v1_060_shaka` | Sentry-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Smarteye | `onr_v1_065_smarteye` | Approach-Reveal bleibt source-bound und payload-safe | Trigger-Test ergänzt |
| Snowball | `onr_v1_066_snowball` | Sentry-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Tinweasel | `onr_v1_070_tinweasel` | Code-Gate-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Wild Card | `onr_v1_072_wild-card` | Sentry-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Wizard's Book | `onr_v1_073_wizards-book` | Code-Gate-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |
| Worm | `onr_v1_074_worm` | Wall-Breaker bleibt run- und subtype-gebunden | Breaker-Mix-Test ergänzt |

## Runde 2026-05-16-asset-upgrade-trace-modifiers

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_ASSET_UPGRADE_TRACE_MODIFIERS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| ACME Savings and Loan | `onr_v1_308_acme-savings-and-loan` | Lifecycle aus Rez, Self-Trash, Verpflichtung, Payment und Loss bleibt stabil | Bestehende ACME-Regressionen bestätigt |
| Investment Firm | `onr_v1_329_investment-firm` | Corp-Start-Recurring-Credit bleibt sourcegebunden | Bestehende V1.9.17-Regression bestätigt |
| Fortress Architects | `onr_v1_324_fortress-architects` | Rezzed ICE-Rez-Kostenmodifier bleibt public-source-bound | Bestehende Modifier-Regression bestätigt |
| Disinfectant, Inc. | `onr_v1_319_disinfectant-inc` | Virus-Counter-Ziele werden beim Resolve erneut geprüft | Target-Drift-Test ergänzt |
| Omni Kismet, Ph.D. | `onr_v1_364_omni-kismet-ph-d` | Tag-Condition wird beim Resolve erneut geprüft | Tag-Drift-Test ergänzt |
| Tesseract Fort Construction | `onr_v1_370_tesseract-fort-construction` | Servergebundene Upgrade-Runtime bleibt gate-stabil | Bestehende V1.9.18-Abdeckung bestätigt |
| Cloak | `onr_v1_011_cloak` | Stealth-/Noisy-Payment-Filter bleibt stabil | Bestehende Payment-Regression bestätigt |
| Main-Office Relocation | `onr_v1_205_main-office-relocation` | ScoreArea-Handlimit-Projektion bleibt stabil | Bestehende Handlimit-Regression bestätigt |
| Access to Kiribati | `onr_v1_150_access-to-kiribati` | Base-Link wird im Trace-Fenster aus aktueller Resource berechnet | Trace-Link-Test ergänzt |
| Priority Requisition | `onr_v1_212_priority-requisition` | Free-Rez ist private Korp-Choice mit Ziel-Revalidation | Automatik-Rez durch Choice ersetzt |

## Runde 2026-05-16-prevention-interface-agenda-actions

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_PREVENTION_INTERFACE_AGENDA_ACTIONS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Nasuko Cycle | `onr_v1_135_nasuko-cycle` | Prevention-Choice bleibt source-bound und lehnt entfernte Sources ab | Source-Removal-Drift-, PublicPayload- und Replay-Test ergänzt |
| R&D Interface | `onr_v1_139_r-and-d-interface` | Kumulativer R&D-Multiaccess ersetzt den falschen Damage-Prevention-Vertrag | Shared, Engine, AI-Hint, Manifest und Catalog-Gate korrigiert |
| Fall Guy | `onr_v1_161_fall-guy` | Resource-Prevention bleibt als installierte Source eindeutig | Multi-Source-Prevention-Test ergänzt |
| Hell's Run | `onr_v1_164_hells-run` | Restricted Recurring Credit zahlt nur Runner-Trace-Link-Bids und refreshed am Runner-Zugstart | Payment-Filter, PublicPayload und Manifest/AI-Hint ergänzt |
| Nomad Allies | `onr_v1_170_nomad-allies` | Resource-Prevention bleibt source-stabil und hidden-info-sicher | Multi-Source-Prevention-Test ergänzt |
| Ronin Around | `onr_v1_175_ronin-around` | Top-2-Stack-Reorder-Vertrag bestätigt; offene Choice hängt an installierter Source | Source-Removal-Drift-Test ergänzt |
| Hostile Takeover | `onr_v1_203_hostile-takeover` | Score-Pfad bleibt bei Gain 5 und ausreichenden Advancements | Score-Revalidation und Payload-Test ergänzt |
| Political Overthrow | `onr_v1_210_political-overthrow` | Gain-3-Aktion entsteht nur aus Korp-ScoreArea-Sources | ScoreArea-Drift-Test ergänzt |
| Nevinyrral | `onr_v1_331_nevinyrral` | Rezzed Leave-play setzt den Runner-Sieg | Trash-on-access-/GameEnd-Test ergänzt |
| Rustbelt HQ Branch | `onr_v1_338_rustbelt-hq-branch` | Rezzed Handlimit-Modifier fällt beim Trash sofort weg, ohne Sofortdiscard | Handlimit-Lifecycle-Test ergänzt |

## Runde 2026-05-15-tagged-wall-breaker

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TAGGED_WALL_BREAKER_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, gezielter Engine-Lauf und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Codecracker | `onr_v1_014_codecracker` | 0-Credit-Break bleibt encounter- und subtype-gebunden; Wall-Negativfall scheitert | Filter-/Wall-Break-Test ergänzt |
| Filter | `onr_v1_244_filter` | Hidden-until-rez und RezCost 0 bleiben payload- und replay-stabil | 0-Rez-/Codecracker-Test ergänzt |
| Netwatch Credit Voucher | `onr_v1_293_netwatch-credit-voucher` | Führender Vertrag bleibt `gain 1`; Tag-Drift wird revalidiert | Quellenentscheidung und Tagged-Test ergänzt |
| Laser Wire | `onr_v1_253_laser-wire` | Damage/ETR-Wall-Pfad bleibt getrennt und redigiert | Durch Wall-/Damage-Regression abgesichert |
| Rock Is Strong | `onr_v1_265_rock-is-strong` | RezCost 6, Stärke 5 und Hidden-until-rez bleiben stabil | Rez-/Stärke-Test ergänzt |
| Scorched Earth | `onr_v1_302_scorched-earth` | Tagged-only Meat-Damage bleibt redigiert und replay-stabil | Tag-Drift-/Damage-Test ergänzt |
| Data Wall 2.0 | `onr_v1_238_data-wall-2-0` | RezCost 2, Stärke 1 und Source-Trennung bleiben stabil | Data-Wall-Paartest ergänzt |
| Wall of Ice | `onr_v1_278_wall-of-ice` | Zwei Net-Damage-Subroutinen plus ETR bleiben deterministic und redigiert | Mehrfachdamage-/Replay-Test ergänzt |
| Reinforced Wall | `onr_v1_263_reinforced-wall` | Doppel-ETR-Pfad bleibt indexstabil | Bestehende V1.1.2K-Abdeckung bestätigt |
| Data Wall | `onr_v1_237_data-wall` | RezCost 1 und Stärke 0 bleiben gültige öffentliche Werte nach Rez | Data-Wall-Paartest ergänzt |

## Runde 2026-05-15-modifier-agenda-risk

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_MODIFIER_AGENDA_RISK_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, gezielter Engine-Lauf und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Gremlins | `onr_v1_029_gremlins` | Shell-/Counter-Oberfläche bleibt legal-action-gated und leakt keine privaten Zonen | No-unimplemented-action-Guard ergänzt |
| MRAM Chip | `onr_v1_134_mram-chip` | Handlimit-Projektion wird aus aktiver Rig-Hardware recomputed und nach Zonewechsel entfernt | Stale-Install-, PlayerView- und Replay-Test ergänzt |
| Preying Mantis | `onr_v1_171_preying-mantis` | Shell-/Prevention-Oberfläche bleibt legal-action-gated ohne ungeprüfte Zusatzaktion | No-unimplemented-action-Guard ergänzt |
| Corporate Boon | `onr_v1_192_corporate-boon` | Gescorte Shell-Agenda erzeugt keine nicht implementierte Action-Economy-Aktion | ScoreArea-Shell-Guard ergänzt |
| Corporate Coup | `onr_v1_193_corporate-coup` | Counter-Aktion bleibt source-bound und scheitert bei 0-Counter oder Runner-ScoreArea-Drift | Counter-/Drift-Revalidation ergänzt |
| Executive Extraction | `onr_v1_201_executive-extraction` | Modifierquelle bleibt an Korp-ScoreArea gebunden | ScoreArea-Drift-Test ergänzt |
| On-Call Solo Team | `onr_v1_208_on-call-solo-team` | Tagged-only Meat-Damage-Aktion revalidiert Tag-Drift und bleibt redigiert | Tag-Drift-, Payload- und Replay-Test ergänzt |
| Subsidiary Branch | `onr_v1_218_subsidiary-branch` | Gescorte Shell-Agenda erzeugt keine nicht implementierte Action-Economy-Aktion | ScoreArea-Shell-Guard ergänzt |
| Canis Major | `onr_v1_225_canis-major` | Future-Encounter-Strength-Bonus wirkt runlokal auf das nächste ICE und wird am Run-Ende abgeräumt | Lifetime-/Replay-Test ergänzt |
| Euromarket Consortium | `onr_v1_322_euromarket-consortium` | Rezzed Shell-Asset erzeugt keine nicht implementierte globale Aktion | Rezzed-/Removed-source-Guard ergänzt |

## Runde 2026-05-15-trace-prevention-assets

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TRACE_PREVENTION_ASSETS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Härtungen, Pflichtchecks und lokaler Commit sind abgeschlossen.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Evil Twin | `onr_v1_023_evil-twin` | Prevention-Pfad verhindert Core-Damage instanz- und turnbegrenzt ohne Hidden-Info-Leak | Damage-Prevention-, PublicPayload- und Replay-Härtung ergänzt |
| Forged Activation Orders | `onr_v1_086_forged-activation-orders` | Öffentliche ICE-Zielwahl bleibt redigiert; stale Ziel-Drift vor der Korp-Choice wird abgelehnt | Multi-ICE-, Drift- und Trash-Branch-Test ergänzt |
| Parraline 5750 | `onr_v1_137_parraline-5750` | Nacharbeit umgesetzt: Installkosten 5, +1 MU, 1 Icebreaker-Run-Credit und Deck-Einzigartigkeit | Shared-Vertrag, AI-Hint, Contract-Matrix und Engine-Test korrigiert |
| Access to Arasaka | `onr_v1_149_access-to-arasaka` | Installierter Base-Link wirkt genau im Trace und fällt nach Entfernen sofort weg | Fetch/Rex-Trace-Regression ergänzt |
| Wilson, Weeflerunner Apprentice | `onr_v1_187_wilson-weeflerunner-apprentice` | Meat-Prevention bleibt auf 1 pro Turn und installierte Quelle begrenzt | Stale-Choice-, Turn-Limit- und PublicPayload-Test ergänzt |
| Black Ice Quality Assurance | `onr_v1_191_black-ice-quality-assurance` | Nacharbeit umgesetzt: gescorte Agenda bufft nur Black ICE; Runner-ScoreArea aktiviert keinen Corp-Modifier | Scored-only-Modifier-Test ergänzt |
| Fetch 4.0.1 | `onr_v1_243_fetch-4-0-1` | RezCost 0 und Trace-3-Tag-Pfad bleiben LegalAction- und replay-stabil | Trace-/Payload-Test mit Access to Arasaka ergänzt |
| Rex | `onr_v1_264_rex` | RezCost 4 und Trace-3-Tag-Pfad bleiben cardId-spezifisch stabil | Vergleichs-Trace zu Fetch ergänzt |
| BBS Whispering Campaign | `onr_v1_309_bbs-whispering-campaign` | Rezzed-only Economy-Aktion bleibt source-bound; entfernte Quelle wird abgelehnt | Removed-source- und Redaction-Test ergänzt |
| Omniscience Foundation | `onr_v1_333_omniscience-foundation` | Rezzed Shell-Asset erzeugt keine nicht implementierte verdeckte Fähigkeit | No-op-/LegalAction-Guard ergänzt |

## Runde 2026-05-15-agenda-run-recurring

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AGENDA_RUN_RECURRING_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Härtungen und Pflichtchecks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Artificial Security Directors | `onr_v1_189_artificial-security-directors` | Engine-Pfad bleibt stabil; V1.9.19-Agenda-/Operation-Zielinfrastruktur fokussiert nachgetestet | Replay-, Wrong-Side/Stale- und PublicPayload-Härtung ergänzt |
| Submarine Uplink | `onr_v1_182_submarine-uplink` | Base-Link wirkt als einzelne Trace-Link-Quelle und kumuliert nicht mit stärkerer Base-Link-Quelle | Trace-Fenster-Nachtest ergänzt |
| Genetics-Visionary Acquisition | `onr_v1_202_genetics-visionary-acquisition` | Engine-Pfad bleibt stabil; Agenda-/Overadvance-Zielinfrastruktur fokussiert nachgetestet | Replay- und Payload-Härtung ergänzt |
| Team Restructuring | `onr_v1_305_team-restructuring` | Power-Counter-Zielwahl auf Korp-Agenda deterministisch und öffentlich nachvollziehbar | Operation-Zieltest ergänzt |
| Silver Lining Recovery Protocol | `onr_v1_303_silver-lining-recovery-protocol` | Credit-Gain-Pfad karten-ID-spezifisch geprüft | Ziel-/Choice-freier PublicPayload-Test ergänzt |
| Shredder Uplink Protocol | `onr_v1_062_shredder-uplink-protocol` | R&D/HQ-Access-Bonus weist Shredder als Quelle aus und leakt keine Folgekarte | Access-Queue- und Payload-Härtung ergänzt |
| Corolla Speed Chip | `onr_v1_124_corolla-speed-chip` | Nacharbeit umgesetzt: 1 recurring credit nur für Killer-Nutzung während Runs, mit Refresh | Shared-Vertrag, Engine-Pfad und Tests ergänzt |
| Mystery Box | `onr_v1_043_mystery-box` | Nacharbeit umgesetzt: Top-5-Reveal, Programmauswahl, Free-Install, Self-Trash und Shuffle | LegalAction-/Choice-/Replay-Härtung ergänzt |
| Newsgroup Filter | `onr_v1_045_newsgroup-filter` | Bestehende Gain-2-Aktion bleibt main-window- und source-gebunden | Removed-source- und Timing-Negativtest ergänzt |
| Project Consultants | `onr_v1_300_project-consultants` | Installierte Agenda-Zielwahl deterministisch und payloadfähig | Wrong-Side/Stale-/Zielpayload-Test ergänzt |

## Runde 2026-05-15-stealth-ap-citygrid

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_STEALTH_AP_CITYGRID_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung, Härtungen und Pflichtchecks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Vewy Vewy Quiet | `onr_v1_071_vewy-vewy-quiet` | Teilfix umgesetzt: zwei Recurring-Counter für Icebreaker-Runkosten | Teilfix grün |
| Microtech 'Trode Set | `onr_v1_132_microtech-trode-set` | Teilfix umgesetzt: +1 Break-Kosten und AP-Net-Damage-Reduktion auf 1 | Teilfix grün |
| Corporate Ally | `onr_v1_156_corporate-ally` | Härtung umgesetzt: deterministischer Mehragenda-Forfeit, No-agenda-Gate, Payload-Leakscan und Replay | Härtung grün |
| Smith's Pawnshop | `onr_v1_180_smiths-pawnshop` | Härtung umgesetzt: Pass-Replay, wrong-side/stale und Removed-target-Revalidation | Härtung grün |
| Bolter Cluster | `onr_v1_224_bolter-cluster` | Teilfix umgesetzt: 4 Net Damage plus Next-ICE-No-Break-Modifier | Teilfix grün |
| Fang | `onr_v1_240_fang` | Teilfix umgesetzt: Trace-Erfolg beendet Run und setzt 2-Credit-Run-Sperre statt Tag | Teilfix grün |
| Jack Attack | `onr_v1_251_jack-attack` | Härtung umgesetzt: Jack-out-Lock plus Trace-Tag payload-, cleanup- und replay-stabil | Härtung grün |
| Neural Blade | `onr_v1_258_neural-blade` | Teilfix umgesetzt: 1 Net Damage plus Next-ICE-No-Break-Modifier | Teilfix grün |
| Vacant Soulkiller | `onr_v1_346_vacant-soulkiller` | Teilfix umgesetzt: Core/Brain Damage skaliert mit Advancement-Countern | Teilfix grün |
| Singapore City Grid | `onr_v1_369_singapore-city-grid` | Nacharbeit umgesetzt: einmal-pro-Run HQ-ICE-Swap mit Corp-privater Hidden-Info-Choice | Resolver-, Redaction-, Once-per-run- und Replay-Test ergänzt |

## Runde 2026-05-15-prevention-upgrade-access

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_PREVENTION_UPGRADE_ACCESS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Checks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| If You Want It Done Right... | `onr_v1_093_if-you-want-it-done-right` | Bestehender privater Stack-Top-5-Choice blieb Hidden-Info- und replay-stabil | Bestehende V1.9.22-Abdeckung bestätigt |
| Armored Fridge | `onr_v1_121_armored-fridge` | Nacharbeit umgesetzt: sieben öffentliche Counter, Meat-Prevention mit Counterverbrauch und Auto-Trash bei leerer Quelle | Install-, Prevention-, Payload- und Replay-Test ergänzt |
| Code Corpse | `onr_v1_229_code-corpse` | Bestehender Core-Damage-/End-the-run-ICE-Pfad blieb stabil | Bestehende V1.6.1-Abdeckung bestätigt |
| Shotgun Wire | `onr_v1_269_shotgun-wire` | Bestehender Net-Damage-/End-the-run-Wall-Pfad blieb stabil | Bestehende ICE-Abdeckung bestätigt |
| Power Grid Overload | `onr_v1_299_power-grid-overload` | Bestehender tagged-only-Hardwaretrash blieb LegalAction- und Payload-seitig stabil | Bestehende V1.9.14-Abdeckung bestätigt |
| Solo Squad | `onr_v1_342_solo-squad` | Nacharbeit umgesetzt: Meat-Damage-Fähigkeit nur bei getaggtem Runner und Tag-Drift-Revalidation | No-tag- und Revalidation-Test ergänzt |
| Bizarre Encryption Scheme | `onr_v1_351_bizarre-encryption-scheme` | Bestehender Access-Replacement-/Delayed-Agenda-Pfad blieb stabil | Bestehende V1.9.9-Abdeckung bestätigt |
| Jenny Jett | `onr_v1_359_jenny-jett` | Bestehender generischer Upgrade-/Root-Server-Pfad blieb stabil | Bestehende V1.9.18-Abdeckung bestätigt |
| Olivia Salazar | `onr_v1_363_olivia-salazar` | Bestehender Agenda-Steal-Kostenpfad blieb servergebunden stabil | Bestehende V1.9.19-Abdeckung bestätigt |
| Twenty-Four-Hour Surveillance | `onr_v1_373_twenty-four-hour-surveillance` | Bestehender servergebundener Run-Start-Tax blieb zahlungs- und replay-stabil | Bestehende V1.9.18-Abdeckung bestätigt |

## Runde 2026-05-15-reactive-decks-grid

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_REACTIVE_DECKS_GRID_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Checks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| False Echo | `onr_v1_026_false-echo` | Teilfix umgesetzt: Successful-Run-Rezfähigkeit mit deterministischer ICE-Reihenfolge, Kostenprüfung, PublicPayload und Replay | Teilfix grün |
| Netspace Inverter | `onr_v1_044_netspace-inverter` | Teilfix umgesetzt: Successful-Run-Reversal der Server-ICE-Liste ohne unrezzed Definition-Leak | Teilfix grün |
| Speed Trap | `onr_v1_067_speed-trap` | Rez-Interrupt-Fenster nach Root-Rez im Run, Runner-Choice und erfolgreicher Run ohne Access nach letztem ICE umgesetzt | Choice-, Pass-, No-Access- und Replay-Test ergänzt |
| Startup Immolator | `onr_v1_068_startup-immolator` | Post-Pass-ICE-Trash nach vollständig gebrochenem ICE mit Rez-Kosten-Zahlung umgesetzt | Kosten-, Trash-, Payload- und Replay-Test ergänzt |
| Zetatech Software Installer | `onr_v1_075_zetatech-software-installer` | Bestehender Overlay-/Programminstallationspfad blieb regressionsgrün | Host-Trash-Kaskade in eigenem Folgejob härten |
| Arasaka Portable Prototype | `onr_v1_119_arasaka-portable-prototype` | Teilfix umgesetzt: Agenda-Punkt-Installkosten, +3 MU, Icebreaker-Recurring-Credits und generisches Deck-Replacement | Teilfix grün |
| Microtech Backup Drive | `onr_v1_131_microtech-backup-drive` | Hosted-Program-Kaskaden werden auf Microtech gesichert; Top-Hosted-Aktion nimmt ein Programm in die Grip | Hosted-Kaskaden-, Return- und Replay-Test ergänzt |
| Pandora's Deck | `onr_v1_136_pandoras-deck` | Teilfix umgesetzt: +2 MU, Link-Recurring-Credits und generisches Deck-Replacement mit korrektem MU-Rückbau | Teilfix grün |
| Raven Microcyb Eagle | `onr_v1_140_raven-microcyb-eagle` | Bestehender Hardware-/Recurring-Pfad blieb regressionsgrün | Net-Damage-Prevention in eigenem Folgejob härten |
| Roving Submarine | `onr_v1_368_roving-submarine` | Teilfix umgesetzt: Region-/Run-Gate über vorherige Corp-Aktivität im geschützten Fort | Teilfix grün |

## Runde 2026-05-15-reorder-counter-runlock

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_REORDER_COUNTER_RUNLOCK_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Checks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Too Many Doors | `onr_v1_272_too-many-doors` | Private R&D-Top-2-Choice gehärtet; kurze R&D ist stabiler No-op ohne Hidden-Info-Leak | Choice-Revalidation, Broken-Subroutine-, Short-R&D- und Replay-Test ergänzt |
| Chicago Branch | `onr_v1_312_chicago-branch` | Rezzed-only Counter-Aktion bleibt source-bound und payloadfähig | SourceDefinition-Payload und Rezzed-Gate-Test ergänzt |
| Fatal Attractor | `onr_v1_242_fatal-attractor` | Next-Encounter-Damage-Flag bleibt rungebunden und wird bei Break/Run-Ende sauber begrenzt | Broken-Subroutine- und Run-End-Cleanup-Test ergänzt |
| I Spy | `onr_v1_032_i-spy` | Revealt nur die Stackspitze; darunterliegende Stackkarte bleibt aus PublicPayload und Korp-View heraus | Source-, Empty-Stack-, Leakscan- und Replay-Test ergänzt |
| Shock.r | `onr_v1_268_shock-r` | No-Break-/Jack-out-Lock gilt nur für den nächsten Encounter und räumt danach auf | Lock-Projektion- und Cleanup-Test ergänzt |
| D'Arc Knight | `onr_v1_233_d-arc-knight` | Program-Trash und End-the-run bleiben subroutinegenau getrennt | Teilbreak-Test ergänzt |
| Corporate Retreat | `onr_v1_195_corporate-retreat` | Gescorte Korp-Quelle bleibt source-bound; Runner-ScoreArea-Drift scheitert | Source-Drift-Test ergänzt |
| Liche | `onr_v1_254_liche` | Core-Damage-Subroutinen bleiben einzeln brechbar und redigiert aggregiert | Teilbreak-/DamageSummary-Test ergänzt |
| Razor Wire | `onr_v1_262_razor-wire` | Net-Damage und End-the-run bleiben subroutinegenau getrennt und replay-stabil | Teilbreak-, Redaction- und Replay-Test ergänzt |
| Vapor Ops | `onr_v1_347_vapor-ops` | Rezzed-only Counter-Aktion bleibt source-bound und payloadfähig | SourceDefinition-Payload und Rezzed-Gate-Test ergänzt |

## Runde 2026-05-16-persistent-counter-pool-resolvers

Auswahlart: sequenzieller Follow-up-Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/`.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_PERSISTENT_COUNTER_POOL_RESOLVERS_IMPLEMENTATION.md`

Jobbericht: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-16-persistent-counter-pool-resolvers.md`

Jobstatus: `done`; die drei persistenten Counter-/Purge-/Trace-Pool-Removal-Conditions aus dem blockierten Trace-Cache-Ambush-Sammeljob sind umgesetzt und grün geprüft.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Code Viral Cache | `onr_v1_155_code-viral-cache` | HQ-Run-Gate, Purge-Replacement-Choice und Korp-Trash-Aktion umgesetzt | Erledigt; Damage-Prevention-Stub entfernt |
| Cerberus | `onr_v1_227_cerberus` | Trace-Erfolg legt Cerberus-Counter; Run-Start-Damage und Runner-Removal sind replaybar | Erledigt; falscher Trace-Tag bleibt entfernt |
| Paris City Grid | `onr_v1_365_paris-city-grid` | Servergebundener 6-Bit-Trace-Pool mit Poolverbrauch und Corp-Turnstart-Refresh umgesetzt | Erledigt; Trace-2-Tag-Stub entfernt |

## Runde 2026-05-16-hidden-zone-temporary-install-resolvers

Auswahlart: sequenzieller Follow-up-Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/`.

Jobbericht: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers.md`

Jobstatus: `done`; alle drei aus dem blockierten Trace-Cache-Ambush-Sammeljob herausgezogenen Resolver sind umgesetzt und grün geprüft.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Deal with Militech | `onr_v1_082_deal-with-militech` | Research-Agenda-Turn-Flag und Militech-Counter auf installierten Icebreakern umgesetzt | Erledigt; Stack-Search-Fehlpfad entfernt |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Private Multi-Expose-Zielwahl für bis zu drei installierte verdeckte Korp-Karten umgesetzt | Erledigt; Zielidentitäten leaken vor der Choice nicht |
| Sneak Preview | `onr_v1_110_sneak-preview` | Heap-/Stack-Programminstall mit Stack-Shuffle, Memory-Revalidation und End-of-turn-Return umgesetzt | Erledigt; vorzeitig verlassene Programme kehren nicht doppelt zurück |

## Runde 2026-05-16-trace-link-post-bid-resolvers

Auswahlart: sequenzieller Follow-up-Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/`.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_TRACE_LINK_POST_BID_RESOLVERS_IMPLEMENTATION.md`

Jobbericht: `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-16-trace-link-post-bid-resolvers.md`

Jobstatus: `done`; beide aus dem blockierten Trace-Cache-Ambush-Sammeljob herausgezogenen post-bid Trace-Link-Resolver sind umgesetzt und grün geprüft.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Signpost | `onr_v1_063_signpost` | Post-bid Trace-Link-Choice nach offengelegten Bids umgesetzt: 1 Credit für +2 Link, einmal pro Trace | Erledigt; Side, StateVersion, Quelle, Kosten und Trace-Kontext werden erneut validiert |
| The Springboard | `onr_v1_181_the-springboard` | Statischer Base-Link entfernt und post-bid Trace-Link-Choice umgesetzt: 1 Credit für +1 Link, einmal pro Trace | Erledigt; Side, StateVersion, Quelle, Kosten und Trace-Kontext werden erneut validiert |

## Runde 2026-05-15-trace-cache-ambush

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TRACE_CACHE_AMBUSH_IMPLEMENTATION.md`

Jobstatus: `blocked`; grüne Teilfixes wurden umgesetzt, ausgelagerte Vollresolver sind inzwischen durch Folgejobs erledigt.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Signpost | `onr_v1_063_signpost` | Folgejob umgesetzt: post-bid Trace-Link-Fenster nach offengelegten Bids grün | Erledigt in `spotcheck-2026-05-16-trace-link-post-bid-resolvers` |
| Deal with Militech | `onr_v1_082_deal-with-militech` | Folgejob umgesetzt: Research-Bedingung und Militech-Counter auf Icebreakern grün | Erledigt in `spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers` |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Folgejob umgesetzt: Multi-Expose-Choice ohne Zielidentitäts-Leak grün | Erledigt in `spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers` |
| Sneak Preview | `onr_v1_110_sneak-preview` | Folgejob umgesetzt: temporärer Heap-/Stack-Programminstall mit End-of-turn-Return grün | Erledigt in `spotcheck-2026-05-16-hidden-zone-temporary-install-resolvers` |
| Code Viral Cache | `onr_v1_155_code-viral-cache` | Folgejob umgesetzt: HQ-Run-Gate, Purge-Replacement und Korp-Trash-Aktion grün | Erledigt in `spotcheck-2026-05-16-persistent-counter-pool-resolvers` |
| The Springboard | `onr_v1_181_the-springboard` | Folgejob umgesetzt: post-bid Trace-Link-Fenster nach offengelegten Bids grün | Erledigt in `spotcheck-2026-05-16-trace-link-post-bid-resolvers` |
| Cerberus | `onr_v1_227_cerberus` | Folgejob umgesetzt: Trace-Counter, Runstart-Damage und Runner-Removal grün | Erledigt in `spotcheck-2026-05-16-persistent-counter-pool-resolvers` |
| Ice Pick Willie | `onr_v1_250_ice-pick-willie` | Teilfix umgesetzt: Program-Trash plus End-the-run statt R&D-Reveal | Teilfix grün |
| TRAP! | `onr_v1_345_trap` | Teilfix umgesetzt: 3 Net Damage plus Tag aus legalem Access; Archives-No-op bleibt | Teilfix grün |
| Paris City Grid | `onr_v1_365_paris-city-grid` | Folgejob umgesetzt: servergebundener Trace-Bit-Pool, Poolverbrauch und Refresh grün | Erledigt in `spotcheck-2026-05-16-persistent-counter-pool-resolvers` |

## Runde 2026-05-15-virus-link-archives

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` für komplexe bereits decklegale Originalset-Karten.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_VIRUS_LINK_ARCHIVES_IMPLEMENTATION.md`

Jobstatus: `blocked`; grüne Teilfixes wurden umgesetzt. Die offenen Resolver-Verträge für `Pile Driver` und `Full Body Conversion` wurden im Folgejob `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` erledigt.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Cockroach | `onr_v1_013_cockroach` | Counter-Schwelle, Multi-Copy und Discard-Choice-Revalidation gehärtet | Teilfix grün |
| Pile Driver | `onr_v1_047_pile-driver` | Folgejob umgesetzt: Multi-Wall-Break bis vier Subroutinen plus exakt 3 Stealth-Verlust grün | Erledigt in `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` |
| Replicator | `onr_v1_056_replicator` | Nacharbeit umgesetzt: Trace-Subroutine-Breaker mit Pump und Nicht-Trace-Negativfall | Teilfix grün |
| Scatter Shot | `onr_v1_057_scatter-shot` | Nacharbeit umgesetzt: restricted Recurring Credits für accessed Upgrade-Trashkosten plus Refresh | Teilfix grün |
| Full Body Conversion | `onr_v1_127_full-body-conversion` | Folgejob umgesetzt: vollständige Meat-Prevention mit Korp-Bypass-Zahlung grün | Erledigt in `spotcheck-2026-05-16-runner-breaker-prevention-resolvers` |
| Access through Alpha | `onr_v1_148_access-through-alpha` | Nacharbeit umgesetzt: Base Link 9 und genau eine Base-Link-Quelle pro Trace | Teilfix grün |
| Detroit Police Contract | `onr_v1_198_detroit-police-contract` | Bestehender Counterpfad durch wrong-side/stale/0-Counter-Revalidation gehärtet | Teilfix grün |
| Off-Site Backups | `onr_v1_296_off-site-backups` | Bestehender Archives-Choice-Pfad durch No-target-Fall gehärtet | Teilfix grün |
| Urban Renewal | `onr_v1_307_urban-renewal` | Bestehender tagged-only Damage-Pfad durch Tag-Drift-Revalidation gehärtet | Teilfix grün |
| Red Herrings | `onr_v1_366_red-herrings` | Nacharbeit umgesetzt: Tax bleibt nach Trash im selben Run aktiv | Teilfix grün |

## Runde 2026-05-16-runner-breaker-prevention-resolvers

Auswahlart: sequenzieller Umsetzungsjob aus `docs/derived/originalset-spotcheck-jobs/inbox/` als Folgejob für offene Resolver-Verträge aus `2026-05-15-virus-link-archives`.

Detailbericht: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_16_RUNNER_BREAKER_PREVENTION_RESOLVERS_IMPLEMENTATION.md`

Jobstatus: `done`; Umsetzung und Checks sind grün.

| Karte | Card ID | Ergebnis | Nacharbeit |
|---|---|---|---|
| Pile Driver | `onr_v1_047_pile-driver` | Multi-Wall-Break mit bis zu vier Subroutinen, Source-/Target-Revalidation, Zusatzkosten und exakt 3 Stealth-Verlust umgesetzt | Abgeschlossen |
| Full Body Conversion | `onr_v1_127_full-body-conversion` | Vollständige Meat-Damage-Prevention mit Korp-Bypass-Choice und side-/credit-validierter Zahlung umgesetzt | Abgeschlossen |

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
| Playful AI | `onr_v1_104_playful-ai` | Nacharbeit nach Playtest erneut gehärtet: Choice nur bei Wurf 1-3, echte Credit/Würfel-Splits, 4-6 als No-Op-Verbrauch offener Würfel | Engine-, AI- und Chroniktests ergänzt |
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
