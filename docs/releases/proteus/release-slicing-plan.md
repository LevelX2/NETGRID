# Proteus Release-Slicing-Plan

Datum: 2026-05-17
Aktualisiert: 2026-05-24
Status: Planungs-Handoff mit abgeschlossenen Detail-Implementierungsslices 1a, 1b und 1d; keine Decklegalität, keine Formatlegalität, keine AI-Hints

## Ziel und Ausgangslage

Dieser Plan schneidet die 154 importierten Proteus-Karten in kleine bis mittlere Release-Slices. Er ist ein Handoff für spätere Umsetzungspakete und erweitert selbst keinen Runtime-, Decklegalitäts-, Formatlegalitäts- oder KI-Support.

Führende Quellen:

- `docs/releases/proteus/spoiler-import-report.md`
- `docs/releases/proteus/mechanics-coverage-analysis.md`
- `data/card-import/proteus-card-basis-2026-05-17.json`
- `docs/releases/proteus/variable-ice-contract.md`
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`
- `docs/releases/proteus/virus-antibody-counter-contract.md`
- `docs/releases/proteus/purge-action-debt-contract.md`
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`

Aktuelle Basis:

- 154 Proteus-Karten sind importiert, validiert und catalog-ready, bleiben aber blockiert.
- Statusverteilung: 17 `covered`, 56 `resolver`, 80 `deepen`, 1 `blocked`.
- Proteus Phase 1a ist umgesetzt: fünf Reuse-only-Baseline-Karten sind `implemented`, `engine_supported`, `playable` und `human_playable` (`Toughonium™ Wall`, `Networked Center`, `Research Bunker`, `Weapons Depot`, `Streetware Distributor`).
- Proteus Phase 1b ist umgesetzt: `Minotaur` und `Riddler` sind über eigene CardImplementation-Dateien, generische öffentliche Additional-Subroutine-Bausteine und ein generisches `corp_encounter`-Aktivierungsfenster `implemented`, `engine_supported`, `playable` und `human_playable`. Es wurden keine neuen Proteus-ID-Branches in `packages/engine/src/index.ts`, UI, Catalog oder KI ergänzt; der vorbestehende Digiconda-/Food-Fight-Harness bleibt als Phase-3-Schuld gesondert zu migrieren.
- Proteus Phase 1c ist blockiert: `Emergency Rig` verlangt laut lokaler Quelle eine positive, aber unbegrenzte `X`-Auswahl für Kludge-Counter ohne Kosten- oder Wertbezug. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` dokumentiert; `Rent-to-Own Contract` wird nicht separat aus dem gemeinsamen Slice promotet.
- Proteus Phase 1d ist umgesetzt: `Lesley Major` und `Rasmin Bridger` sind über eigene CardImplementation-Dateien, generische öffentliche Fort-Pass-Window-Bausteine, Manifest-/Szenario-Spur und Replay-/StateHash-Tests `implemented`, `engine_supported`, `playable` und `human_playable`. Es wurden keine neuen Proteus-ID-Branches in Runtime, UI, Catalog oder KI ergänzt.
- Proteus Phase 1e ist blockiert: `Pavit Bharat` und `Simon Francisco` brauchen vor vollständiger Promotion zusätzliche Hidden-Fort-/Central-Access-Verträge für HQ-to-Fort-Installation, Typ-/Slot-/Kostenfilter, Redaction sowie Access-Queue-Reihenfolge. Der Blocker ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` dokumentiert; `Herman Revista` und `Marcel DeSoleil` werden nicht separat aus dem gemeinsamen Slice promotet.
- Alle übrigen Proteus-Karten bleiben blockiert. Keine Proteus-Karte ist `deck_legal`, `format_legal` oder `ai_supported`.
- Proteus wird nicht als Großrelease freigegeben. Jede Karte braucht einen eigenen Resolver-/Manifest-/Szenario-/Visibility-/Replay-/StateHash-Nachweis.

## Implementierungsarchitektur für spätere Karten

Die Slices und Cluster sind Planungs- und Handoff-Einheiten, keine Dateigruppen für Runtime-Code. Bei späterer Umsetzung bekommt jede Proteus-Karte eine eigene TypeScript-Datei unter `packages/engine/src/card-implementations/`, zum Beispiel `packages/engine/src/card-implementations/onr_proteus_020_digiconda.ts`.

Verbindlich:

- Pro Proteus-Karte wird eine eigene CardImplementation-Datei mit eigenem Registry-/Coverage-Nachweis geplant.
- Cluster dienen dazu, Mechanikfamilien, Foundation-/Helper-/Resolver-Bausteine, Testpakete und Release-Slices zu schneiden.
- Cluster erzeugen keine große Proteus-Sammeldatei und keine gemeinsame Kartendatei für mehrere konkrete Karten.
- Gemeinsame Helper entstehen nur dort, wo sie echte mechanische Wiederverwendung schaffen; kartenspezifische Regelentscheidungen bleiben in der jeweiligen CardImplementation oder in eng benannten Engine-Resolvern.
- Hidden-Info- und Regelentscheidungen bleiben in der Rules Engine. UI, Catalog und KI konsumieren nur `LegalActions`, `PlayerViews`, `PublicEvents`, Manifeste und freigegebene AI-Hints.

## CardImplementation- und Ability-Bedarfsanalyse

Der aktuelle Engine-Code zeigt das Zielmuster fuer spaetere Proteus-Umsetzung:

- Eine konkrete Karte exportiert eine `CardImplementationDefinition` mit `cardDefinitionId`, Kartenkommentar und deklarativen Feldern wie `abilities`, `printedSubroutines`, `modifiers`, `accessEffects`, `virusCounter`, `scoredAgenda` oder Prevention-/Run-/Access-Hooks.
- `packages/engine/src/card-implementations/registry.ts` ist nur Registry/Katalog. Es importiert konkrete CardImplementation-Dateien und baut Lookup-Tabellen; dort gehoeren keine Regelresolver, Coverage-Semantik oder Proteus-Sonderbranches hin.
- `packages/engine/src/card-implementations/coverage.ts` klassifiziert Coverage aus den deklarativen Feldern; es darf keine Runtime-Legalitaet erzeugen.
- Runtime-Resolver interpretieren abstrakte `kind`-/Modifier-/Hook-Familien. Neue Proteus-Karten duerfen nicht dadurch spielbar werden, dass Engine-Code `if (definition.id === "onr_proteus_...")` abfragt.

Beobachtete wiederverwendbare Muster:

| Muster | Beispiele im aktuellen Code | Proteus-Nutzen |
| --- | --- | --- |
| `abilities` mit `on_play`/`activated` und Effektsequenzen | `Accounts Receivable`, `Newsgroup Filter`, `Aujourd'Oui` | einfache Operationen/Events, Economy, Draw, Tags, Damage, Hidden-Zone-Take/Shuffle, Main-Action-Resources |
| `printedSubroutines` und Runner-Counter-Folgen | `Data Wall`, `Data Raven` | einfache Proteus-ICE und Trace-/Damage-/ETR-Subroutinen |
| statische/dynamische `modifiers` | `Encoder, Inc.`, `Red Herrings`, `MRAM Chip`, `Tycho Mem Chip` | Rez-/Install-/Steal-/Trash-/Break-Kosten, ICE-Staerke, zusaetzliche Subroutinen, Handgroesse, MU, Access-Count, Agenda-Difficulty |
| Access-/Run-Hooks | `accessEffects`, `accessHooks`, `successfulRunFollowups`, `fortRunWindows`, `runEncounterInterventions` | Ambushes, Multiaccess, Run-Events, Root-/Server-Faehigkeiten, Encounter-Interventionen |
| Prevention-/Replacement-Familien | `damagePreventionSources`, `tagPreventionSources`, `trashPreventionSources`, `flatlineReplacementSources` | Proteus-Prevention, Hidden-Resource-Prevention, Cybernetics-Schutz |
| Hardware/Hosting/zweckgebundene Credits | `hardwareDeck`, `hostedProgramCapacity`, `restrictedHostedCreditSource`, `unique` | Deck-Hardware, MU-/Handgroessenbonus, source-bound Bits, no-noisy-Bit-Einschraenkungen |
| Virus-/Counter-/Agenda-Familien | `virusCounter`, `runnerCounterEffects`, `scoredAgenda` | O:NR-v1-Virusmuster, scored Agendas, Start-of-turn-Effekte; fuer Proteus nur teilweise ausreichend |
| eng benannte Longtail-Familien | `corpUtility`, `runnerUtilityLongtail`, `runnerEventLongtail`, `hiddenReplacementLongtail`, `remainingReplacementLongtail` | nur fuer echte Einzelfaelle nach Review; wiederholte Proteus-Mechaniken muessen generische Familien bekommen |

Aktueller Proteus-nahe Codebestand, der bei spaeterer Umsetzung beruecksichtigt werden muss:

- `bad_publicity_7` existiert bereits als Engine-Game-End-Reason und in Shared/API-Typen. Es fehlt aber ein generischer CardImplementation-Effekt wie `add_bad_publicity`; vorhandene V0.99-Harnesslogik ist keine Proteus-Kartenfamilie.
- Hidden-Runner-Resource-Redaction existiert bereits fuer PlayerView/PublicContext/Install-/Trash-Ziele als Foundation. Es fehlen noch CardImplementation-Aktivierungsfamilien je Timingfenster und Reveal-/Trash-Kostenresolver fuer konkrete Proteus-Karten.
- Variable Proteus-ICE haben bereits einen engen Harness in `packages/engine/src/index.ts` fuer `Digiconda` und `Food Fight`. Dieser Harness ist ID-spezifische technische Schuld fuer die Planung: vor echter Proteus-Promotion muss daraus eine generische CardImplementation-Familie werden, z. B. `variableRez`/`variableIceState`, die von `onr_proteus_020_digiconda.ts`, `onr_proteus_022_food-fight.ts` usw. deklarativ genutzt wird.
- Es gibt aktuell Proteus-CardImplementation-Dateien nur für die abgeschlossenen Phase-1a-, 1b- und 1d-Karten unter `packages/engine/src/card-implementations/proteus/`. Jede weitere Proteus-Karte braucht weiterhin eine eigene Datei und einen Registry-/Coverage-/Manifest-/Testnachweis.

Verbindliche No-ID-Branching-Regel fuer Proteus:

- Keine neue Proteus-Mechanik wird als `definition.id === "onr_proteus_..."`-Branch in `packages/engine/src/index.ts`, UI, Catalog oder KI implementiert.
- Wenn eine Karte nicht mit bestehenden CardImplementation-Feldern ausdrueckbar ist, wird zuerst ein generischer Engine-`kind`, Helper oder Resolver fuer die Mechanikfamilie geschaffen.
- Ein eng benannter Longtail-`kind` ist nur zulaessig, wenn die Mechanik wirklich einmalig ist und trotzdem Engine-local, replay-/StateHash-stabil und hidden-info-sicher aufgeloest wird.
- Pro Umsetzungspaket muss jede Karte als `reuse only`, `reuse plus small generic extension` oder `new generic family first` klassifiziert werden.

### Ability-Bedarf nach Phase

| Phase | Kartenfamilie | Vorhandene Abstraktionen, die zuerst geprueft werden | Neu oder zu haerten vor Promotion |
| ---: | --- | --- | --- |
| 1 | 17 sichtbare Baseline-Karten, z. B. `Minotaur`, `Riddler`, `Toughonium™ Wall`, einfache Korp-Upgrades, `Disintegrator`, `Streetware Distributor` | `printedSubroutines`, einfache `abilities`, bestehende Install-/Rez-/Access-Basis, einfache Modifier | nur per-card Dateien und Tests, wenn der Text voll mit vorhandenen `kind`s ausdrueckbar ist; sonst Karte nicht in Phase 1 ziehen |
| 2 | 8 Bad-Publicity-Karten, z. B. `Charity Takeover`, `Faked Hit`, `Frame-Up`, `Senatorial Field Trip` | vorhandener `bad_publicity_7` Game-End-Grund, Bad-Publicity-Counter im State/PublicPayload | generischer `add_bad_publicity`-/Bad-Publicity-Effect fuer CardImplementation; Prioritaetsmatrix und redacted source handling, keine UI-/KI-Heuristik |
| 3 | 23 variable/relative/pass-/repositionierende ICE, Start mit `Digiconda` und `Food Fight` | vorhandener variable-ICE-Harness, `printedSubroutines`, ICE-Staerkeanzeige, Rez-Kostenquote | Harness in generische CardImplementation-Familie ueberfuehren: `variableRez` fuer X-Staerke, bezahlte ETR-Subroutinen und Subtypwahl; danach relative ICE-Zaehler, Pass-Trigger, Repositionierung |
| 4 | 16 Hidden Runner Resources, z. B. `Airport Locker`, `Back Door to Netwatch`, `HQ Mole`, `R&D Mole` | Hidden-Resource-Redaction, installierte Resource-Slots, Korp-Tag-Trash-Zielredaktion, Prevention-/Access-/Trace-/Damage-Bausteine | generische Hidden-Resource-Aktivierungsfamilien mit Reveal-and-trash-Kosten, redacted LegalActions, timing-spezifischen Resolvern und Leak-Scans |
| 5 | 30 sichtbare Runner-Breaker/Event/Economy-Karten | `icebreakerAbilities`, `on_play`, `activated`, `make_run`, `trace`, Damage-/Tag-/Trash-/Prevention-Familien, Hidden-Zone-Effekte ohne Hidden Resource | kleine generische Erweiterungen nur fuer neue Breaker-Matcher, Run-Event-Followups oder installierte Modifier; keine Virus-/Random-/Hidden-Resource-Mitnahme |
| 6 | 29 Agenda-, Ambush-, Access- und Korp-Resolver-Karten | `scoredAgenda`, `accessEffects`, `accessHooks`, `steal_cost`, `trash_cost`, `agenda_difficulty`, `corpUtility`, `printedSubroutines` | generische Overadvance-/Agenda-Point- und Access-Origin-Helfer haerten; Ambushes duerfen nur aktuelle legal bekannte Access-Karten offenlegen |
| 7 | 4 Cybernetics-/Deck-Hardware-Karten | `hardwareDeck`, `modifiers` fuer MU/Handgroesse, `restrictedHostedCreditSource`, `damagePreventionSources`, `unique` | Deck-Einzigkeit, altes-Deck-Trash-Kaskade, source-bound Bits, no-noisy-Ausschluss und MU-Ueberzug nach Trash im Runtime-Gate belegen |
| 8 | 13 Virus-/Antibody-/Purge-Karten | vorhandene O:NR-v1-`virusCounter`, `runnerCounterEffects`, `accessEffects`, Counteranzeigen, V0.99-Purge-Basis | Proteus-spezifische purgefaehige Counter-Registry mit Scopes `corp`/`server`/`card`/`effect`, Antibody-Abgrenzung, Action-Debt, Spezialfenster und RandomDrawRecords |
| 9 | 14 Random-, Hidden-Zone-Search-, Action-Economy- und Blocker-Longtail-Karten | vorhandene Hidden-Zone-Effekte, einzelne Random-/Dice-Longtails, `gain_actions`, `make_run`, Run-/Access-Familien | generische Random-/Wuerfelresolver, Hidden-Zone-Search/Install/Tutor, Action-Debt/Future-Forgo-Actions, Data-Fort-Creation-Lock und Blocker-Review; `Ice and Data Special Report` bleibt bis Kostenklaerung blockiert |

## Priorisierte Releasefolge

| Reihenfolge | Slice | Ziel | Ergebnis |
| ---: | --- | --- | --- |
| 0 | Proteus Planning Freeze | Import, Coverage und Verträge versioniert halten. | Keine Runtime-Promotion; bereits erfuellt. |
| 1 | Visible Baseline Cards | Kleine sichtbare Karten ohne Hidden-, Random-, Variable-, Purge- oder Bad-Publicity-Sonderpfad. | Erste eng begrenzte Human-Spielbarkeit. |
| 2 | Bad-Publicity-7+-Harness | Engine-Game-End-Grund und Priorität gegen gleichzeitige Siege/Flatline absichern. | Foundation vor Bad-Publicity-Karten. |
| 3 | Variable/komplexe ICE Foundation | Digiconda/Food Fight als nicht-promotender Harness für variable Rez-Werte; danach relative ICE, Pass-Trigger und Repositionierung. | Persistentes Variable-/Complex-ICE-Modell. |
| 4 | Hidden Runner Resource Foundation | Generischer verdeckter Runner-Resource-Zustand ohne Kartenfähigkeiten. | Hidden-Info-Basis für 16 Hidden Resources. |
| 5 | Simple Runner Breaker/Event/Economy | Kleine Runner-Resolver auf sichtbarer Basis. | Breiterer Spielwert ohne Hidden-/Virus-Familien. |
| 6 | Agenda, Ambush, Access und öffentliche Korp-Resolver | Agenda-/Access-/Damage-/Tag-Resolver mit enger Matrix. | Korp-/Runner-Mix nach stabilen Basisslices. |
| 7 | Cybernetics/Deck Hardware | Deck-Einzigkeit, MU-/Handgrößenmodifier und zweckgebundene Bits. | Hardware-Foundation vor AI-Support. |
| 8 | Virus/Antibody/Purge | Counter-Registry, Antibody-Access, Runner-Virus-Counter, Proteus-Purge/Action-Debt. | Riskanter Counter-/Timing-Komplex, keine frühe Promotion. |
| 9 | Random, Hidden-Zone-Search, Action-Economy und Blocker-Longtail | Würfel-/Random-Familien, Hidden-Zone-Search, Action-Economy, Ice and Data Special Report und übrige Deepen-Karten. | Späte gezielte Freigabe nach Verträgen. |

## Detaillierter Karten-Zuschnitt nach Phase

Diese Liste ist die primäre Zielphase je Karte. Sie ersetzt keine spätere Requirements-Prüfung pro Umsetzungspaket, verhindert aber, dass eine Phase nur eine Mechaniküberschrift ohne konkrete Karten bleibt. Jede genannte `onr_proteus_*`-ID impliziert eine eigene spätere Datei nach dem Muster `packages/engine/src/card-implementations/<cardId>.ts`.

Die Zuordnung ist bewusst konservativ: Karten mit Hidden Resource, Virus/Purge, Random, Hidden-Zone-Search oder Action-Economy werden in spätere Phasen gezogen, auch wenn sie zusätzlich einfache Economy-, Access- oder Bad-Publicity-Cluster berühren. Insgesamt sind 154/154 Proteus-Karten genau einer primären Phase zugeordnet.

### Phase 1: Visible Baseline Cards (17 Karten)

Erster spielbarer Karten-Slice nach Planning Freeze; keine neuen Hidden-, Random-, Variable-, Purge- oder Bad-Publicity-Pfade.

- `onr_proteus_031_minotaur` Minotaur (corp, ice)
- `onr_proteus_034_riddler` Riddler (corp, ice)
- `onr_proteus_041_toughoniumtm-wall` Toughonium™ Wall (corp, ice)
- `onr_proteus_049_emergency-rig` Emergency Rig (corp, operation)
- `onr_proteus_051_rent-to-own-contract` Rent-to-Own Contract (corp, operation)
- `onr_proteus_060_herman-revista` Herman Revista (corp, upgrade)
- `onr_proteus_062_lesley-major` Lesley Major (corp, upgrade)
- `onr_proteus_064_marcel-desoleil` Marcel DeSoleil (corp, upgrade)
- `onr_proteus_065_networked-center` Networked Center (corp, upgrade)
- `onr_proteus_066_obfuscated-fortress` Obfuscated Fortress (corp, upgrade)
- `onr_proteus_069_pavit-bharat` Pavit Bharat (corp, upgrade)
- `onr_proteus_070_rasmin-bridger` Rasmin Bridger (corp, upgrade)
- `onr_proteus_072_research-bunker` Research Bunker (corp, upgrade)
- `onr_proteus_073_simon-francisco` Simon Francisco (corp, upgrade)
- `onr_proteus_077_weapons-depot` Weapons Depot (corp, upgrade)
- `onr_proteus_085_disintegrator` Disintegrator (runner, program)
- `onr_proteus_150_streetware-distributor` Streetware Distributor (runner, resource)

### Phase 2: Bad-Publicity-7+-Gate und erste Bad-Publicity-Karten (8 Karten)

Engine-Game-End-Gate zuerst; Kartenpromotion erst nach bestandener `bad_publicity_7`-Prioritätsmatrix. `Scaldan` bleibt wegen Virus/Random in Phase 8, `Back Door to Netwatch` wegen Hidden Resource in Phase 4.

- `onr_proteus_002_charity-takeover` Charity Takeover (corp, agenda)
- `onr_proteus_108_faked-hit` Faked Hit (runner, event)
- `onr_proteus_109_frame-up` Frame-Up (runner, event)
- `onr_proteus_112_identity-donor` Identity Donor (runner, event)
- `onr_proteus_113_live-news-feed` Live News Feed (runner, event)
- `onr_proteus_117_poisoned-water-supply` Poisoned Water Supply (runner, event)
- `onr_proteus_123_senatorial-field-trip` Senatorial Field Trip (runner, event)
- `onr_proteus_125_subliminal-corruption` Subliminal Corruption (runner, event)

### Phase 3: Variable, relative, pass- und repositionierende ICE (23 Karten)

Foundation beginnt mit `Digiconda` und `Food Fight`; danach Subtyp-X, relative ICE-Zählung, Pass-Trigger und Repositionierung in getrennten Unterpaketen.

- `onr_proteus_012_bug-zapper` Bug Zapper (corp, ice)
- `onr_proteus_013_caryatid` Caryatid (corp, ice)
- `onr_proteus_017_credit-blocks` Credit Blocks (corp, ice)
- `onr_proteus_018_datacomb` Datacomb (corp, ice)
- `onr_proteus_019_death-yo-yo` Death Yo-Yo (corp, ice)
- `onr_proteus_020_digiconda` Digiconda (corp, ice)
- `onr_proteus_021_dog-pile` Dog Pile (corp, ice)
- `onr_proteus_022_food-fight` Food Fight (corp, ice)
- `onr_proteus_023_galatea` Galatea (corp, ice)
- `onr_proteus_024_gatekeeper` Gatekeeper (corp, ice)
- `onr_proteus_025_homing-missile` Homing Missile (corp, ice)
- `onr_proteus_026_hunting-pack` Hunting Pack (corp, ice)
- `onr_proteus_028_lesser-arcana` Lesser Arcana (corp, ice)
- `onr_proteus_029_marionette` Marionette (corp, ice)
- `onr_proteus_030_mastermind` Mastermind (corp, ice)
- `onr_proteus_033_mobile-barricade` Mobile Barricade (corp, ice)
- `onr_proteus_036_sandstorm` Sandstorm (corp, ice)
- `onr_proteus_037_scaffolding` Scaffolding (corp, ice)
- `onr_proteus_039_sphinx-2006` Sphinx 2006 (corp, ice)
- `onr_proteus_040_sumo-2008` Sumo 2008 (corp, ice)
- `onr_proteus_042_tumblers` Tumblers (corp, ice)
- `onr_proteus_043_twisty-passages` Twisty Passages (corp, ice)
- `onr_proteus_044_walking-wall` Walking Wall (corp, ice)

### Phase 4: Hidden Runner Resources (16 Karten)

Zuerst generischer verdeckter Runner-Resource-Zustand ohne Kartenfähigkeit; danach per-card Aktivierungsfenster.

- `onr_proteus_128_airport-locker` Airport Locker (runner, resource)
- `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch (runner, resource)
- `onr_proteus_132_bolt-hole` Bolt-Hole (runner, resource)
- `onr_proteus_133_chiba-bank-account` Chiba Bank Account (runner, resource)
- `onr_proteus_136_credit-subversion` Credit Subversion (runner, resource)
- `onr_proteus_137_death-from-above` Death from Above (runner, resource)
- `onr_proteus_140_expendable-family-member` Expendable Family Member (runner, resource)
- `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble (runner, resource)
- `onr_proteus_142_hq-mole` HQ Mole (runner, resource)
- `onr_proteus_143_liberated-savings-account` Liberated Savings Account (runner, resource)
- `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract (runner, resource)
- `onr_proteus_147_r-and-d-mole` R&D Mole (runner, resource)
- `onr_proteus_149_simulacrum` Simulacrum (runner, resource)
- `onr_proteus_152_swiss-bank-account` Swiss Bank Account (runner, resource)
- `onr_proteus_153_time-to-collect` Time to Collect (runner, resource)
- `onr_proteus_154_wired-switchboard` Wired Switchboard (runner, resource)

### Phase 5: Sichtbare Runner-Breaker, Events, Economy und kleine Ressourcen (30 Karten)

Nur sichtbare Runner-Pfade ohne Hidden Resource, Virus, Random oder neues Proteus-Purge-Modell.

- `onr_proteus_079_big-frackin-gun` Big Frackin' Gun (runner, program)
- `onr_proteus_080_black-widow` Black Widow (runner, program)
- `onr_proteus_081_boring-bit` Boring Bit (runner, program)
- `onr_proteus_082_bulldozer` Bulldozer (runner, program)
- `onr_proteus_083_corrosion` Corrosion (runner, program)
- `onr_proteus_086_enterprise-inc-shields` Enterprise, Inc., Shields (runner, program)
- `onr_proteus_088_fubar` Fubar (runner, program)
- `onr_proteus_091_lockjaw` Lockjaw (runner, program)
- `onr_proteus_092_morphing-tool` Morphing Tool (runner, program)
- `onr_proteus_093_redecorator` Redecorator (runner, program)
- `onr_proteus_095_skeleton-passkeys` Skeleton Passkeys (runner, program)
- `onr_proteus_096_skullcap` Skullcap (runner, program)
- `onr_proteus_100_wrecking-ball` Wrecking Ball (runner, program)
- `onr_proteus_101_all-hands` All-Hands (runner, event)
- `onr_proteus_103_cruising-for-netwatch` Cruising for Netwatch (runner, event)
- `onr_proteus_104_decoy-signal` Decoy Signal (runner, event)
- `onr_proteus_105_demolition-run` Demolition Run (runner, event)
- `onr_proteus_106_disgruntled-ice-technician` Disgruntled Ice Technician (runner, event)
- `onr_proteus_107_drone-for-a-day` Drone for a Day (runner, event)
- `onr_proteus_114_on-the-fast-track` On the Fast Track (runner, event)
- `onr_proteus_115_personal-touch-the` Personal Touch, The (runner, event)
- `onr_proteus_118_prearranged-drop` Prearranged Drop (runner, event)
- `onr_proteus_120_reconnaissance` Reconnaissance (runner, event)
- `onr_proteus_121_remote-detonator` Remote Detonator (runner, event)
- `onr_proteus_122_rush-hour` Rush Hour (runner, event)
- `onr_proteus_124_stakeout` Stakeout (runner, event)
- `onr_proteus_127_weefle-initiation` Weefle Initiation (runner, event)
- `onr_proteus_130_back-door-to-rivals` Back Door to Rivals (runner, resource)
- `onr_proteus_139_eurocorpse-tm-spin-chip` Eurocorpse (TM) Spin Chip (runner, hardware)
- `onr_proteus_148_runner-sensei` Runner Sensei (runner, resource)

### Phase 6: Agenda, Ambush, Access und öffentliche Korp-Resolver (29 Karten)

Korp-/Agenda-/Access-Karten und öffentliche Korp-Resolver nach stabilen Basis-, Damage-, Tag-, Trace- und Access-Gates.

- `onr_proteus_003_corporate-headhunters` Corporate Headhunters (corp, agenda)
- `onr_proteus_004_fetal-ai` Fetal AI (corp, agenda)
- `onr_proteus_005_marked-accounts` Marked Accounts (corp, agenda)
- `onr_proteus_008_project-zurich` Project Zurich (corp, agenda)
- `onr_proteus_010_world-domination` World Domination (corp, agenda)
- `onr_proteus_011_brain-wash` Brain Wash (corp, ice)
- `onr_proteus_014_chihuahua` Chihuahua (corp, ice)
- `onr_proteus_015_colonel-failure` Colonel Failure (corp, ice)
- `onr_proteus_016_coyote` Coyote (corp, ice)
- `onr_proteus_027_iceberg` Iceberg (corp, ice)
- `onr_proteus_032_misleading-access-menus` Misleading Access Menus (corp, ice)
- `onr_proteus_038_snowbank` Snowbank (corp, ice)
- `onr_proteus_045_washed-up-solo-construct` Washed-Up Solo Construct (corp, ice)
- `onr_proteus_047_credit-consolidation` Credit Consolidation (corp, operation)
- `onr_proteus_048_data-sifters` Data Sifters (corp, operation)
- `onr_proteus_050_manhunt` Manhunt (corp, operation)
- `onr_proteus_052_schlaghund-pointers` Schlaghund Pointers (corp, operation)
- `onr_proteus_053_underworld-mole` Underworld Mole (corp, operation)
- `onr_proteus_055_cybertech-think-tank` Cybertech Think Tank (corp, asset)
- `onr_proteus_056_department-of-misinformation` Department of Misinformation (corp, asset)
- `onr_proteus_059_government-contract` Government Contract (corp, asset)
- `onr_proteus_061_ldl-traffic-analyzers` LDL Traffic Analyzers (corp, asset)
- `onr_proteus_067_panic-button` Panic Button (corp, upgrade)
- `onr_proteus_071_raymond-ellison` Raymond Ellison (corp, upgrade)
- `onr_proteus_074_siren` Siren (corp, asset)
- `onr_proteus_076_syd-meyer-superstores` Syd Meyer Superstores (corp, asset)
- `onr_proteus_102_blackmail` Blackmail (runner, event)
- `onr_proteus_116_pirate-broadcast` Pirate Broadcast (runner, event)
- `onr_proteus_119_promises-promises` Promises, Promises (runner, event)

### Phase 7: Cybernetics/Deck Hardware (4 Karten)

Deck-Einzigkeit, MU-/Handgrößenmodifier und zweckgebundene Bits vor AI-Support.

- `onr_proteus_134_cortical-cybermodem` Cortical Cybermodem (runner, hardware)
- `onr_proteus_135_cortical-stimulators` Cortical Stimulators (runner, hardware)
- `onr_proteus_138_deck-the` Deck, The (runner, hardware)
- `onr_proteus_151_sunburst-cranial-interface` Sunburst Cranial Interface (runner, hardware)

### Phase 8: Virus/Antibody/Purge (13 Karten)

Counter-Registry, Antibody-Access, Runner-Virus-Counter und Proteus-Purge/Action-Debt vor Promotion.

- `onr_proteus_009_viral-breeding-ground` Viral Breeding Ground (corp, agenda)
- `onr_proteus_054_bel-digmo-antibody` Bel-Digmo Antibody (corp, asset)
- `onr_proteus_057_doppelganger-antibody` Doppelganger Antibody (corp, asset)
- `onr_proteus_068_pattel-antibody` Pattel Antibody (corp, asset)
- `onr_proteus_075_stereogram-antibody` Stereogram Antibody (corp, asset)
- `onr_proteus_078_armageddon` Armageddon (runner, program)
- `onr_proteus_084_crumble` Crumble (runner, program)
- `onr_proteus_089_garbage-in` Garbage In (runner, program)
- `onr_proteus_090_highlighter` Highlighter (runner, program)
- `onr_proteus_094_scaldan` Scaldan (runner, program)
- `onr_proteus_097_taxman` Taxman (runner, program)
- `onr_proteus_098_vienna-22` Vienna 22 (runner, program)
- `onr_proteus_099_viral-pipeline` Viral Pipeline (runner, program)

### Phase 9: Random, Hidden-Zone-Search, Action-Economy und Blocker-Longtail (14 Karten)

Sammelbecken nur als späte Longtail-Planungsphase; vor Umsetzung in kleinere Unterpakete zerlegen.

- `onr_proteus_001_ai-board-member` AI Board Member (corp, agenda)
- `onr_proteus_006_please-dont-choke-anyone` Please Don't Choke Anyone (corp, agenda)
- `onr_proteus_007_project-venice` Project Venice (corp, agenda)
- `onr_proteus_035_roadblock` Roadblock (corp, ice)
- `onr_proteus_046_corporate-guard-r-temps` Corporate Guard(R) Temps (corp, operation)
- `onr_proteus_058_executive-boot-camp` Executive Boot Camp (corp, asset)
- `onr_proteus_063_lisa-blight` Lisa Blight (corp, upgrade)
- `onr_proteus_087_forwards-legacy` Forward's Legacy (runner, program)
- `onr_proteus_110_hijack` Hijack (runner, event)
- `onr_proteus_111_ice-and-data-special-report` Ice and Data Special Report (runner, event)
- `onr_proteus_126_test-spin` Test Spin (runner, event)
- `onr_proteus_131_bargain-with-viacox` Bargain with Viacox (runner, resource)
- `onr_proteus_144_lucidrinetm-drip-feed` Lucidrine™ Drip Feed (runner, hardware)
- `onr_proteus_146_precision-bribery` Precision Bribery (runner, resource)

## Slice 1: Visible Baseline Cards

Scope:

- Karten aus `covered` und sehr einfachen `resolver`-Faellen mit ausschließlich öffentlichen Board-, Install-, Rez-, Play- oder Economy-Pfaden.
- Kandidaten aus `covered`: `Minotaur`, `Riddler`, `Toughonium (TM) Wall`, `Emergency Rig`, `Rent-to-Own Contract`, einfache Corp-Upgrades (`Herman Revista`, `Lesley Major`, `Marcel DeSoleil`, `Networked Center`, `Obfuscated Fortress`, `Pavit Bharat`, `Rasmin Bridger`, `Research Bunker`, `Simon Francisco`, `Weapons Depot`), `Disintegrator`, `Streetware Distributor`.
- Optional nur nach Kartenvertrag: einfache `resolver`-Karten wie `Credit Consolidation`, `Government Contract`, `Syd Meyer Superstores` und einfache Icebreaker-Pump/Break-Programme.

Nicht-Scope:

- Keine Hidden Resources, keine variable Rez-ICE, keine Random-/Würfelkarten, keine Proteus-Virus-Counter, keine Bad-Publicity-7+-Karten, keine `Ice and Data Special Report`-Klärung.
- Keine Gesamtfreigabe für Proteus-Decks.

Abhaengigkeiten und Gate:

- Catalog-/Manifest-Guard muss Proteus weiter default-blocked halten.
- Jede aufzunehmende Karte braucht lokale Regelbasis, Runtime-Definition, Manifest, Mechanics-Coverage, Szenario und Web-Catalog-Abgleich.
- `applyAction` revalidiert Side, Action-ID, `stateVersion`, Timingpunkt, Kosten, Ziele und Choices.
- PlayerViews, PublicEvents, WebSocket, Reconnect, Undo-Preview, Replay, Logs und AIInput enthalten keine verdeckten Karteninformationen.
- Replay reproduziert StateHash.

Stop-Kriterien:

- Eine Karte benoetigt Hidden-Choice, RandomDrawRecords, neue Timingfenster, kartenübergreifende Game-End-Priorität oder ungeklärten Quellwert.
- Eine Karte würde Proteus pauschal decklegal machen.

Testspur:

- Enger Engine-Smoke pro Karte oder Kartenfamilie.
- Manifest-/Coverage-Paritaet.
- Visibility-/Replay-/StateHash-Regressionsfall.
- Web-Catalog- und Decklegalitäts-No-Broad-Promotion-Guard.

AI-Grenze:

- Human-Spielbarkeit ist kein AI-Support.
- `ai_supported` erst in separatem AI-Slice mit AI-Hints, scenarioRefs, side-sicherem AIInput und AI-Smoke.

## Slice 2: Bad-Publicity-7+-Harness

Scope:

- Synthetischer oder Harness-basierter Game-End-Grund `bad_publicity_7`.
- Priorität gegen Korp-Agenda-Sieg, Runner-Agenda-Sieg, Flatline und Korp-Deckout.
- PublicPayload-/PlayerView-/Reconnect-/Replay-/StateHash-Projektion.
- Danach die in Phase 2 gelisteten acht Bad-Publicity-Karten als getrennte per-card Implementierungen.

Nicht-Scope:

- Keine Kartenpromotion vor bestandenem `bad_publicity_7`-Harness.
- `Scaldan` wird wegen Virus/Random in Phase 8 geplant; `Back Door to Netwatch` wegen Hidden Resource in Phase 4.

Abhaengigkeiten, Gate und Stop:

- Grundlage ist `docs/releases/proteus/bad-publicity-loss-gate-contract.md`.
- Game-End ist Engine-Regel, nicht UI- oder KI-Heuristik.
- Kein neues LegalAction-Fenster nach erreichtem Game-Over.
- Stop, wenn der Ergebnisgrund nicht durch API, UI-Ergebnisanzeige, Replay und StateHash konsistent gefuehrt werden kann.
- Stop, wenn Hidden-Resource-Auslöser ohne Redaction-Vertrag Kartennamen leaken würden.

Testspur:

- Matrix P-BP-T001 bis P-BP-T010 aus dem Vertrag.

AI-Grenze:

- AI darf den öffentlichen Bad-Publicity-Stand sehen, erhält aber keine private Auslöseridentität und keine neuen Strategiehints.

## Slice 3: Variable/komplexe ICE Foundation

Scope:

- Nicht-promotender Engine-Harness zuerst für `Digiconda` und `Food Fight`.
- Variable `rez_ice`-LegalActions mit gebundenem Zusatzbetrag.
- Persistenter, StateHash-relevanter variabler ICE-State für Stärke oder zusätzliche Subroutinen.
- Danach die Phase-3-Kartenfamilien für Subtyp-X, relative ICE-Zählung, Pass-Trigger und ICE-Repositionierung in getrennten Unterpaketen.

Nicht-Scope:

- Keine Homing-Missile-Trace-Sperre im ersten Harness.
- Keine Subtyp-Wechsler, relative ICE-Zähler, Pass-Trigger oder Repositionierung im ersten Harness.
- Keine Proteus-Decklegalität und keine AI-Hints.

Abhaengigkeiten, Gate und Stop:

- Grundlage ist `docs/releases/proteus/variable-ice-contract.md`.
- `applyAction` akzeptiert keine frei gelieferten Clientwerte.
- Runner-View sieht vor dem Rezzen keine private ICE-Identität oder abgelehnte Varianten.
- Stop, wenn variable Werte nicht replaystabil aus Engine-State/Eventlog rekonstruierbar sind.
- Stop, wenn Encounter-, Break- und PublicEvent-Projektion unterschiedliche Subroutinen-/Stärkewerte nutzen.

Testspur:

- P-VICE-T001 bis P-VICE-T009 für ersten Slice.

AI-Grenze:

- Keine Bewertung variabler Proteus-ICE, bis LegalActions und AIInput nur öffentliche Rez-Werte transportieren.

## Slice 4: Hidden Runner Resource Foundation

Scope:

- Generischer verdeckter Runner-Resource-Installationszustand im Rig.
- Runner-View vollständig, Korp-View nur redigierter Slot.
- Korp-Tag-Trash gegen redigierte Slots; erfolgreicher Trash revealet erst im Heap.
- Reconnect, AIInput, Replay und StateHash.

Nicht-Scope:

- Keine Aktivierungsfähigkeiten einzelner Proteus-Hidden-Resources.
- Keine Trace-, Damage-, Access- oder Cost-/Penalty-Fenster.
- Keine Proteus-Kartenfreigabe.

Abhaengigkeiten, Gate und Stop:

- Grundlage ist `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- Öffentliche Slot-IDs dürfen keine echte Instance-ID, DefinitionId oder Kartenwert ableitbar machen.
- PublicEvents nennen vor Reveal keine Hidden-Resource-Titel.
- Stop, wenn Korp-PlayerView, AIInput, Reconnect, Undo-Preview oder Logs verdeckte Resource-Identität enthalten.
- Stop, wenn Targeting redigierter Slots nicht stale-/side-sicher revalidierbar ist.

Testspur:

- Installation, Reconnect, Korp-AIInput, Korp-Tag-Trash, Reveal-on-trash, Replay/StateHash, Leak-Scan.

AI-Grenze:

- Korp-AI kennt nur Anzahl und redigierte Slots. Runner-AI darf eigene Karten erst nach separatem Kartenhint nutzen.

## Slice 5: Simple Runner Breaker/Event/Economy

Scope:

- Sichtbare Runner-Programme, Events, kleine Ressourcen und einfache Hardware mit vorhandenen Install-, Pump/Break-, Draw-/Credit-, Trace-, Prevention- oder Run-Event-Pfaden.
- Kandidaten: einfache Icebreaker wie `Big Frackin' Gun`, `Black Widow`, `Boring Bit`, `Bulldozer`, `Corrosion`, `Fubar`, `Lockjaw`, `Morphing Tool`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball`; einfache Events wie `Cruising for Netwatch`, `On the Fast Track`, `Prearranged Drop`, `Stakeout`.

Nicht-Scope:

- Keine Virusprogramme, keine Hidden-Zone-Search-Installer, keine Bad-Publicity- oder Random-Effekte, keine Multiaccess-Hidden-Queue-Erweiterung.

Abhaengigkeiten, Gate und Stop:

- Slice 1 abgeschlossen oder bewusst getrennt, damit Manifest-/No-Promotion-Guards stehen.
- Kosten-, MU-, Subtyp- und Encounter-Revalidierung.
- Keine Stack-/Grip-Leaks bei Eventauswertung.
- Stop, wenn Karten neue Timingfenster oder Hidden-Zone-Auswahl benoetigen.

Testspur:

- Pro Breaker-Familie Pump/Break-Smoke mit Wrong-Side-/Stale-Revalidation.
- Fuer Events Economy-/Run-Smoke plus Replay/StateHash.

AI-Grenze:

- AI-Support erst nach getrennten Rollenhints und SzenarioRefs; Breaker-Rollen nicht aus Kartentext erraten.

## Slice 6: Agenda, Ambush, Access und öffentliche Korp-Resolver

Scope:

- Kleine Agenda-/Access-/Damage-/Tag-Resolver nach vorhandenen M2/Multiaccess-Grundlagen.
- Kandidaten mit `resolver`: `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, ausgewählte simple Ambush-/Access-Faelle.
- Öffentliche Korp-Operationen, Assets, Upgrades und einfache ICE-Resolver aus Phase 6, sofern sie ohne Hidden Resource, Virus/Purge, Random, variable ICE oder neue Action-Economy auskommen.

Nicht-Scope:

- Keine Proteus-Bad-Publicity-7+-Auslöser vor Slice 2.
- Keine Hidden Resource Access-Modifikatoren.
- Keine Runner-Virus-Zusatzaccesses.

Abhaengigkeiten, Gate und Stop:

- Slice 2 für jede Bad-Publicity-relevante Karte.
- Bestehende Damage-, Tag-, Access- und Archives-Verträge.
- Access-Queue zeigt nur aktuelle legal revealte Karten.
- HQ/R&D-Multiaccess nutzt RandomDrawRecords und leakt keine künftigen Karten.
- Stop, wenn ein Ambush-/Access-Fall kuenftige Queue-Titel, private Choices oder ungeklärte gleichzeitige Game-End-Priorität braucht.

Testspur:

- Agenda-score/steal, access, damage/tag, visibility, replay/statehash.

AI-Grenze:

- Kein Ambush-Gefahrenwissen aus verdeckter R&D-/HQ-Karte; AI nur über side-sichere Known-Position- oder öffentliche History-Daten.

## Slice 7: Cybernetics/Deck Hardware

Scope:

- Nicht-promotender Harness zuerst für `Cortical Cybermodem` und `Sunburst Cranial Interface`.
- Deck-Einzigkeit, ältere Decks deterministisch trashen, MU-/Handgrößenmodifier, zweckgebundene Icebreaker-Bits und Runner-Start-of-turn-Refresh.

Nicht-Scope:

- `Deck, The` bis Base-Link-Auswahlvertrag steht.
- `Cortical Stimulators` bis Damage-/Prevention-Slice.
- Keine AI-Hints und keine Decklegalität.

Abhaengigkeiten, Gate und Stop:

- Grundlage ist `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- MU-Überzug nach Trash muss als Choice oder Blocker sauber gelöst sein.
- Modifier werden abgeleitet, nicht als Basiswerte dauerhaft mutiert.
- Zweckgebundene Bits sind source-bound und werden in `applyAction` erneut geprüft.
- Stop, wenn Install eines zweiten Decks still `memoryUsed > memoryLimit` erzeugen kann.

Testspur:

- Memory, Handgröße, Deck-Trash, Bit-Spend, Noisy-Ausschluss, Refresh, Visibility, Replay/StateHash.

AI-Grenze:

- AI darf zweckgebundene Bits erst nach LegalAction-/AIInput-Prüfung bewerten; keine Hidden-Zone-Daten.

## Slice 8: Virus/Antibody/Purge

Scope:

- Erst Counter-Taxonomie und purgefähige Scope-Registry.
- Danach Antibody-Access-Fixtures, erfolgreiche-Run-Counter, Access-Modifikatoren, Start-of-turn-/Random-Fixtures und Proteus-Purge-/Action-Debt-Harness.

Nicht-Scope:

- Keine frühe Promotion von Runner-Virusprogrammen.
- Kein Gleichsetzen mit V0.99-Main-Action-Purge.
- Keine Antibody-/Advancement-Counter im Proteus-Purge.

Abhaengigkeiten, Gate und Stop:

- Grundlagen sind `docs/releases/proteus/virus-antibody-counter-contract.md` und `docs/releases/proteus/purge-action-debt-contract.md`.
- Fuer `Scaldan` gilt zusätzlich Slice 2.
- Registry trennt Advancement-, Antibody- und purgefähige Runner-Virus-Counter.
- `corpActionDebt` oder äquivalentes Feld ist StateHash-relevant und kumulierbar.
- Start-of-turn-Reihenfolge ist replayfähig, nicht implizite Objektiteration.
- Stop, wenn Purge-Timingfenster nicht LegalAction-basiert ist.
- Stop, wenn PublicPayload Access-Queue-, HQ/R&D- oder Hidden-Installationsdaten enthält.

Testspur:

- P-VAC-T001 bis P-VAC-T011 und P-PAD-T001 bis P-PAD-T009, in kleinen Harness-Schritten.

AI-Grenze:

- Keine Virus-/Antibody-AI-Freigabe vor Counter-Redaction-, Purge- und Timingtests. AIInput darf nur public-safe Counter-Summaries enthalten.

## Slice 9: Random, Hidden-Zone-Search, Action-Economy und Blocker-Longtail

Scope:

- Proteus-Würfel-/Random-Familien, Hidden-Zone-Search-Installer, zusätzliche Action-Economy, `Ice and Data Special Report` nach Quellenklärung und übrige Deepen-/Blocker-Karten aus Phase 9.

Nicht-Scope:

- Kein Sammelrelease für alle übrigen Proteus-Karten.
- Keine ungeklärten Text-/Wertfaelle.

Abhaengigkeiten, Gate und Stop:

- Slice 3 für variable ICE-Grundmodell.
- RandomDrawRecords-Erweiterungen pro Karte.
- Quellen-/Regelklaerung für `Ice and Data Special Report`.
- Jeder Random-Pfad nutzt Seed, `randomCounter` und `RandomDrawRecords`.
- Kein PublicEvent nennt Seed, private Kandidatenlisten oder KI-Debugdaten.
- Stop, wenn Random-Kandidaten in verdeckten Zonen liegen und nicht side-sicher ausgewählt werden können.

Testspur:

- Per-card RandomDrawRecords, Replay/StateHash, Visibility, stale/illegal actions.

AI-Grenze:

- AI-Support nur nach separatem Szenario-Smoke pro Random-/Variable-Familie; keine Heuristik aus verborgenem FullState.

## Human- und AI-Freigabe getrennt

| Spur | Mindestgate |
| --- | --- |
| `human_playable` | Eigene CardImplementation-Datei pro Karte, Runtime-Resolver, Manifest, Mechanics-Coverage, Szenario, LegalAction-/`applyAction`-Revalidierung, Visibility, Replay/StateHash und Web-Catalog-No-Broad-Promotion. |
| `deck_legal` | Zusaetzlich formaler Release-Gate-Beschluss, Deckbuilder-/Format-Manifest und keine offenen Quellen-/Resolverblocker. |
| `ai_supported` | Zusaetzlich AI-Hints mit scenarioRefs, side-sicherer AIInput, AI-Smoke und Nachweis, dass keine verdeckten Kartendaten oder Debugdaten genutzt werden. |

`human_playable` erzeugt nie automatisch `ai_supported`.

## Erste Folgeactivities

Vorbereitete erste Umsetzungspakete:

1. `docs/activities/done/act-2026-05-17-proteus-visible-baseline-card-slice.md`
2. `docs/activities/done/act-2026-05-17-proteus-bad-publicity-engine-harness.md`
3. `docs/activities/done/act-2026-05-17-proteus-variable-ice-harness-slice.md`
4. `docs/activities/done/act-2026-05-17-proteus-hidden-resource-foundation-slice.md`

Bewusst noch nicht als erste Umsetzungspakete geschnitten:

- Virus-/Antibody-/Purge-Promotion: erst nach Counter-Registry und Action-Debt-Harness.
- Cybernetics-/Deck-Hardware: nach Baseline und Variable-/Hidden-Foundations, weil MU-Überzug und zweckgebundene Bits eigene Risiken tragen.
- Random-/Longtail-Karten: erst nach RandomDrawRecords- und Quellenklärungs-Gates.

## Handoff

Primäre Folgeagenten:

- `release-implementation-agent` für konkrete Runtime-/Manifest-/Szenario-Slices.
- `test-quality-agent` für Gate-Harnesses, insbesondere Bad-Publicity, Visibility, Replay/StateHash und Redaction.
- `card-enablement-ai-knowledge-agent` erst für getrennte AI-Hints und AI-Smokes nach Human-Gates.

Jeder spätere Proteus-Umsetzungsslice muss im eigenen Paket wiederholen:

- Scope und Nicht-Scope,
- betroffene Kartenliste,
- geplante CardImplementation-Datei pro Karte unter `packages/engine/src/card-implementations/`,
- gemeinsame Helper oder Resolver nur bei echter mechanischer Wiederverwendung,
- Release-/Manifest-/Mechanics-Coverage-Änderung,
- LegalAction-/`applyAction`-Revalidierung,
- Hidden-Info-, Replay-, StateHash- und stale-action-Tests,
- AI-Support-Grenze.
