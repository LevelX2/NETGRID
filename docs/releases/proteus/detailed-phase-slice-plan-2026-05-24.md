# Proteus Detail-Slice-Plan

Stand: 2026-05-24  
Status: Planungs-Handoff mit abgeschlossenen Detail-Implementierungsslices 1a, 1b und 1d; keine Decklegalität, keine Formatlegalität, keine AI-Hints.

## Ziel

Dieses Dokument verfeinert die bestehenden Proteus-Phasen aus `release-slicing-plan.md` in kleinere, umsetzbare Slices. Es ersetzt nicht die bestehenden Mechanikverträge, sondern ergänzt sie als Handoff für spätere `release-implementation-agent`-Arbeit.

Leitplanken:

- Jede spätere Proteus-Karte bekommt eine eigene CardImplementation-Datei unter `packages/engine/src/card-implementations/`.
- Gemeinsame Logik entsteht als generischer, kartenunabhängiger Helper oder Ability-Baustein.
- Runtime, UI, Catalog, Server und KI dürfen keine Proteus-Kartennamen oder `onr_proteus_*`-IDs als Regelzweig abfragen.
- `LegalActions` und `applyAction` bleiben die einzigen Aktions- und Revalidierungsautoritäten.
- Hidden-Info, Replay, StateHash, stale-action und illegal-action Gates gelten je Slice erneut.

## Gemeinsame Umsetzungsgates je Slice

Jeder Implementierungsslice braucht vor Promotion:

- Requirements-/Scope-Notiz oder Activity mit exakter Zielkartenliste.
- Per-card CardImplementation-Dateien, Registry-/Coverage-/Manifestnachweis.
- Engine-Tests für LegalAction-Projektion, `applyAction`-Revalidierung, Wrong-Side, stale `stateVersion`, Kosten, Ziele und Choices.
- PlayerView-/PublicEvent-Redaction-Checks, wenn verdeckte Karten, private Choices, Hidden Zones oder Reconnect betroffen sind.
- Replay-/StateHash-Nachweis für neue dauerhafte Zustände, Counter, Random Records, Action Debt oder Zug-/Run-Gedächtnis.
- Keine Catalog-, Format-, Decklegalitäts- oder AI-Freigabe im selben Slice, außer ein späterer Releaseplan ordnet das ausdrücklich an.

## Phase 1: Visible Baseline Cards

Führend für Phase 1 bleibt `phase-1-slice-handoff-2026-05-24.md`. Die Phase war zu breit und ist bereits in sieben Slices geschnitten.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 1a Reuse-only Baseline | `Toughonium™ Wall`, drei Region-Agenda-Difficulty-Karten, `Streetware Distributor` | Vorhandene `printedSubroutines`, Agenda-Difficulty-/Region-Modifier, einfache installierte Runner-Resource-Aktion, keine neue Helper-Familie. |
| 1b Dynamic Public ETR ICE | `Minotaur`, `Riddler` | Öffentliche dynamische ETR-Subroutinen, effektive Run-Quote, Break-Projektion aus öffentlichen Zuständen. |
| 1c Free-Rez ICE Counter Lifecycle | `Emergency Rig`, `Rent-to-Own Contract` | Temporäre Free-Rez-/Kostenmodifikatoren, ICE-Counter-Lifecycle, StateHash-relevante Rez-Erinnerung. |
| 1d Public Fort-Pass Windows | `Lesley Major`, `Rasmin Bridger` | Öffentliche Fort-Pass-Folgefenster, same-fort Advancement-Ziele, Runner-Pay-or-End-run-Fenster, Kosten-/Timing-Revalidierung. |
| 1e Hidden Fort Manipulation and Central Access | `Herman Revista`, `Marcel DeSoleil`, `Pavit Bharat`, `Simon Francisco` | Hidden-Zone-/Central-Access-Folgefenster, private Korp-Choices, redigierte PublicPayloads. |
| 1f Run Spend Cap | `Obfuscated Fortress` | Run-gebundene Ausgabenobergrenze, LegalAction-Kostenprojektion, `applyAction`-Revalidierung. |
| 1g Post-Pass Derez Utility | `Disintegrator` | Post-Pass-/Run-Folgefenster, Derez-Zielwahl, side-sichere öffentliche Auflösung. |

Status 2026-05-24: Phase 1a ist umgesetzt und dokumentiert in `docs/activities/done/act-2026-05-24-proteus-phase-1a-reuse-only-baseline.md`. Phase 1b ist umgesetzt und dokumentiert in `docs/activities/done/act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice.md`. Phase 1d ist umgesetzt und dokumentiert in `docs/activities/done/act-2026-05-24-proteus-phase-1d-public-fort-pass-windows.md`. Die neun Zielkarten aus 1a, 1b und 1d sind `human_playable`; Decklegalität, Formatlegalität und AI-Support bleiben unverändert aus. Phase 1b hat generische öffentliche Additional-Subroutine-Modifier und ein generisches `corp_encounter`-Aktivierungsfenster ergänzt. Phase 1d hat generische öffentliche Fort-Pass-Window-Bausteine für same-fort Advancement-Counter und Runner-Pay-or-End-run-Folgefenster ergänzt. Beide Slices führen keine neuen Proteus-ID-Branches ein.

Blocker 2026-05-24: Phase 1c ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle.md` blockiert. `Emergency Rig` hat im lokalen Proteus-Text eine positive, aber unbegrenzte `X`-Auswahl für Kludge-Counter ohne Kosten- oder Wertbezug. Bis zur Quellen-/Regelentscheidung wird auch `Rent-to-Own Contract` nicht isoliert aus diesem gemeinsamen Slice promotet.

Blocker 2026-05-24: Phase 1e ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1e-hidden-fort-manipulation-access.md` blockiert. `Pavit Bharat` braucht einen Hidden-HQ-to-Fort-Installationsvertrag für Typfilter, Slots, Kosten und öffentliche Count-/Positionsredaction; `Simon Francisco` braucht einen Central-Access-Reihenfolge-/Queue-Vertrag für Access-Count-Reduktion nach Access. Bis zur Quellen-/Scope-Entscheidung werden `Herman Revista` und `Marcel DeSoleil` nicht isoliert aus diesem gemeinsamen Slice promotet.

Blocker 2026-05-24: Phase 1f ist in `docs/activities/in-progress/act-2026-05-24-proteus-phase-1f-run-spend-cap.md` blockiert. `Obfuscated Fortress` braucht einen verbindlichen Run-Payment-Source-Vertrag, bevor Ansage, Spend-Cap, Ledger und End-of-run-Shortfall in `spendRunnerRunCredits` und RunState umgesetzt werden können.

Activity-Zuschnitt: Die bestehenden Phase-1a bis Phase-1g Activities sind die kleinsten Umsetzungseinheiten. Das alte Phase-1-Sammelpaket bleibt blockiert/ersetzt.

## Phase 2: Bad Publicity

Phase 2 muss wie Phase 1 weiter geschnitten werden, aber nach anderen Grenzen. Der vorhandene `bad_publicity_7`-Harness deckt nur das Game-End-Gate ab; es fehlt ein generischer CardImplementation-Effekt für Bad Publicity.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 2a Bad-Publicity Foundation | keine Zielkartenpromotion | Generischer `add_bad_publicity`-Effekt, PublicPayload mit Vorher/Nachher-Zähler, redigierbarer Source, Game-End-Prüfung nach Effektsequenzen. |
| 2b Scored-Agenda Bad Publicity | `Charity Takeover` | `scoredAgenda`-Effektsequenz mit Credits plus Bad Publicity, Priorität gleichzeitiger Korp-Sieg vs. Bad-Publicity-Verlust. |
| 2c Direct Runner Event BP + Damage | `Faked Hit` | Runner-Event-Sequenz Bad Publicity plus unpreventable Brain/Core Damage, Flatline-vs.-Bad-Publicity-Priorität. |
| 2d Installed-Card Cost BP | `Poisoned Water Supply` | Runner-Event mit Bedingung auf zwei installierte Connections, Trash eigener installierter Karten als Kosten-/Effektteil, danach Bad Publicity. |
| 2e Run-/Access-History BP | `Frame-Up`, `Live News Feed`, `Subliminal Corruption` | Zug-/Run-Gedächtnis für HQ/R&D-Runs, liberated/trashed Black Ops, encountered black ICE, rezzed Black Ops, trashed Advertisements und verzögerte Post-Run-Auswertung. |
| 2f Replacement-/Choice BP | `Identity Donor`, `Senatorial Field Trip` | Damage-Prevention-Replacement außerhalb normaler Runner-Aktionen, Last-/Rezzed-Black-ICE-Turn-Memory, Korp-Choice Derez oder Bad Publicity. |

Activity-Zuschnitt: Das existierende Phase-2-Paket sollte vor Codearbeit in 2a bis 2f zerlegt werden. 2a ist Pflichtvorlauf für alle Karten.

## Phase 3: Variable and Complex ICE

Phase 3 ist zu groß für einen Implementierungsslice. Der vorhandene Digiconda/Food-Fight-Harness ist ID-spezifische technische Schuld und muss zuerst in CardImplementation-kompatible Abstraktionen überführt werden.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 3a Variable ICE Foundation | `Digiconda`, `Food Fight` als Harness-Migration | Generische `variableRez`-/`variableIceState`-Familie, X-Rez-Werte, dauerhafte effektive Stärke/Subroutinen, PublicPayload, Replay/StateHash. |
| 3b Variable Cost/Strength/Subtype ICE | `Caryatid`, `Credit Blocks`, `Galatea`, `Gatekeeper`, `Homing Missile`, `Lesser Arcana`, `Sandstorm`, `Sphinx 2006`, `Sumo 2008` | Variable Stärke, variable ETR-/Trace-Subroutinen, alternative Subtypen, Trace-Erweiterung für ICE-Subroutinen, effektive Break-Projektion. |
| 3c Relative/Board-Count ICE | `Bug Zapper`, `Dog Pile`, `Hunting Pack`, `Mastermind` | Öffentliche Zählfunktionen für installierte/gerezzte ICE und relative Boardzustände, StateHash-stabile Effektwerte, keine Leaks unrezzter Identitäten. |
| 3d Pass-Trigger/Uninstall/Trash ICE | `Datacomb`, `Death Yo-Yo`, `Marionette`, `Scaffolding`, `Tumblers`, `Twisty Passages` | Pass-Trigger-Fenster, HQ-Rückführung, Uninstall-/Trash-/Sabotage-Effekte, Server-/ICE-Positionslabels in PublicPayloads. |
| 3e ICE Repositioning | `Mobile Barricade`, `Walking Wall` | ICE-Bewegung und Reordering in Servern, Positions-Revalidierung, öffentliche Ziel-/Bewegungsdaten ohne Hidden-Info-Leak. |

Activity-Zuschnitt: Phase 3 sollte mindestens in 3a bis 3e zerlegt werden. 3a ist architektonischer Vorlauf; 3b bis 3e können danach nur bei Konfliktarmut getrennt parallelisiert werden.

## Phase 4: Hidden Runner Resources

Phase 4 braucht zuerst eine verdeckte Resource-Aktivierungsfamilie. Ohne diese Grundlage würden spätere Karten wieder individuelle Hidden-Info-Pfade erzwingen.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 4a Hidden Resource Activation Foundation | keine Zielkartenpromotion | Verdeckte Runner-Resource-Installation/Aktivierung, Reveal-and-trash-Kosten, private LegalActions, redigierte Gegner-Views, Timingfenster für Trace, Damage, Access und Kosten. |
| 4b Hidden Economy/Bank Resources | `Airport Locker`, `Chiba Bank Account`, `Liberated Savings Account`, `Swiss Bank Account`, `Time to Collect` | Hidden-Reveal-Economy, hosted/gespeicherte Credits, Runner-Choice-Fenster, öffentliche Ergebnisdaten ohne vorherige verdeckte Identität. |
| 4c Hidden Access/Mole Resources | `HQ Mole`, `R&D Mole`, `Simulacrum` | Access-Modifikatoren, zusätzliche oder ersetzte Zugriffsinformationen, private Queues, zentrale Server-Redaction. |
| 4d Hidden Prevention/Damage/Tag Resources | `Bolt-Hole`, `Expendable Family Member`, `Get Ready to Rumble`, `Back Door to Netwatch`, `Wired Switchboard` | Damage-/Trace-/Tag-Prevention, Replacement-Integration, Bad-Publicity-Effekt-Reuse, source-redacted PublicPayloads. |
| 4e Hidden Trash/Sabotage/Cost Penalty | `Credit Subversion`, `Death from Above`, `Mercenary Subcontract` | Trash-/Forfeit-/Sabotage-Kosten, Zielwahl gegen installierte Karten, deterministische Kostenabwicklung und öffentliche Ergebnislabels. |

Activity-Zuschnitt: 4a ist Pflichtvorlauf. Danach sollten Economy, Access, Prevention und Trash/Sabotage getrennte Activities sein, weil sie verschiedene Timing- und Redaction-Gates berühren.

## Phase 5: Visible Runner Breaker, Event, Economy

Phase 5 enthält viele sichtbare Runner-Karten. Sie ist einfacher als Phase 4, aber wegen der Kartenmenge und unterschiedlicher LegalAction-Familien nicht als ein Paket sinnvoll.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 5a Icebreaker Core Matchers/Pump/Break | `Big Frackin' Gun`, `Black Widow`, `Boring Bit`, `Bulldozer`, `Corrosion`, `Fubar`, `Lockjaw`, `Morphing Tool`, `Redecorator`, `Skeleton Passkeys`, `Wrecking Ball` | Declarative Breaker-Profile, Subroutine-/Subtype-Matcher, Pump-/Break-Kosten, effektive Stärke, Illegal-Pump-Guards, Noisy-/Nebenbedingungen falls benötigt. |
| 5b Runner Protection Programs | `Enterprise, Inc., Shields`, `Skullcap` | Damage-Prevention-/Replacement-Fenster, Source-/Turn-Limits, private Choice und öffentliche Outcome-Projektion. |
| 5c Simple Runner Economy/Draw/Setup | `Cruising for Netwatch`, `On the Fast Track`, `Prearranged Drop`, `Stakeout`, `Back Door to Rivals`, `Runner Sensei` | Sichtbare Runner-Event-/Resource-Aktionen, Credit-/Draw-/Trace-/Setup-Effekte, einfache Ziel- und Kostenrevalidierung. |
| 5d Visible Runner Run Events | `All-Hands`, `Decoy Signal`, `Demolition Run`, `Disgruntled Ice Technician`, `Drone for a Day`, `Reconnaissance`, `Remote Detonator`, `Rush Hour`, `Weefle Initiation` | `make_run`-Erweiterungen, rungebundene Follow-up-Flags, Expose-/Trash-/Tag-/Damage-/Access-Folgefenster, Run-End-Cleanup. |
| 5e Icebreaker Modifier/Support Hardware | `Personal Touch, The`, `Eurocorpse (TM) Spin Chip` | Installierte Modifier auf Breaker, source-bound Credits oder temporäre Boosts, Zielbindung an installierte Programme, StateHash-stabile Attach-/Modifierdaten. |

Activity-Zuschnitt: 5a sollte vor 5e laufen, weil Supportkarten auf Breaker-Projektion aufsetzen. 5b, 5c und 5d sind getrennte Activities.

## Phase 6: Agenda, Ambush, Access, Public Corp Resolvers

Phase 6 ist eine Mischphase aus Korp-Agendas, ICE, Operations, Assets/Upgrades und drei Runner-Events. Sie braucht nach Effektfamilien geschnittene Slices.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 6a Agenda Scoring/Steal Baseline | `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, `Project Zurich`, `World Domination` | `scoredAgenda`-/`stolenAgenda`-Effekte, Access-Ambush, Overadvance-/Agenda-Point-Modifikatoren, Siegpriorität und PublicPayload. |
| 6b Corp ICE Simple Resolver | `Brain Wash`, `Chihuahua`, `Colonel Failure`, `Coyote`, `Iceberg`, `Misleading Access Menus`, `Snowbank`, `Washed-Up Solo Construct` | Printed Subroutines für Trace, Tags, Damage, Trash/Forfeit, Credits und ETR; Break-Projektion und öffentliche Subroutine-Ergebnisse. |
| 6c Corp Operation Trace/Tag/Economy | `Credit Consolidation`, `Data Sifters`, `Manhunt`, `Schlaghund Pointers`, `Underworld Mole` | Corp-Operation-`on_play`, Trace-Fenster, Tag-/Credit-/Trash-Effekte, Wrong-Side/Stale/Kostenrevalidierung. |
| 6d Corp Asset/Upgrade Utility | `Cybertech Think Tank`, `Department of Misinformation`, `Government Contract`, `LDL Traffic Analyzers`, `Panic Button`, `Raymond Ellison`, `Siren`, `Syd Meyer Superstores` | Asset-/Upgrade-Rez- und Aktivierungsfähigkeiten, Access-Trash-/Prevent-Fenster, Run- oder Server-gebundene Trigger, öffentliche Ergebnislabels. |
| 6e Runner Agenda/Overadvance Events | `Blackmail`, `Pirate Broadcast`, `Promises, Promises` | Runner-Events gegen Agenda-/Advancement-Zustände, agenda-point-/overadvance-bezogene Kosten und Effekte, Run-/Access-History falls benötigt. |

Activity-Zuschnitt: 6a sollte vor 6e laufen. 6b, 6c und 6d sind eigenständige Activities mit unterschiedlichen Testharnesses.

## Phase 7: Cybernetics/Deck Hardware

Phase 7 ist klein, aber schneidet tief in Hardware-, Deck- und Credit-Restriktionen. Sie sollte nicht als "vier Karten schnell" umgesetzt werden.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 7a Hardware/Deck Foundation | `Deck, The` oder foundation-only | Deck-Hardware-Einzigartigkeit, Trash alter Deck-Hardware, MU-/Hand-/Link-Modifier, source-bound Zustand. |
| 7b Icebreaker-Credit Decks | `Cortical Cybermodem`, `Sunburst Cranial Interface` | Restricted Credits nur für Icebreaker/Program-Nutzung, Kostenprojektion in LegalActions, `applyAction`-Revalidierung, keine Noisy-Seiteneffekte falls nicht explizit. |
| 7c Damage/Prevention Hardware | `Cortical Stimulators` | Damage-/Prevention-/Replacement-Hardware, Turn-/Source-Limits, redigierte Choice-Fenster. |
| 7d Base-Link/Trace Deck | `Deck, The` falls nicht schon in 7a vollständig | Base-Link-/Trace-Modifier, PlayerView-Projektion, AIInput nur side-sichere öffentliche Werte. |

Activity-Zuschnitt: 7a ist Pflichtvorlauf. Bei `Deck, The` kann 7a und 7d zusammenfallen, wenn der Scope klein bleibt; sonst getrennt halten.

## Phase 8: Virus/Antibody/Purge

Phase 8 braucht eine klare Counter-Taxonomie vor Kartenarbeit. Der Virus-/Antibody-Vertrag und der Purge-/Action-Debt-Vertrag sind führend.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 8a Counter Taxonomy/Purge Foundation | keine Zielkartenpromotion | Purgeable Runner-Virus-Counter vs. Antibody-/Advancement-Counter, Proteus-Purge, Action Debt/Forgo Actions, CounterDisplay-Projektion. |
| 8b Corp Antibody/Access | `Bel-Digmo Antibody`, `Doppelganger Antibody`, `Pattel Antibody`, `Stereogram Antibody` | Access- und scored/installed Counter-Effekte, Antibody-Counter, öffentliche Counter-Displays, Purge-Unberührbarkeit wo nötig. |
| 8c Viral Breeding Ground Agenda | `Viral Breeding Ground` | Agenda-basierte Virus-/Counter-Erzeugung, Scored-/Access-Fenster, Interaktion mit Purge und Runner-Virus-Zählung. |
| 8d Runner Virus Run Counters | `Highlighter`, `Taxman`, `Vienna 22`, `Viral Pipeline` | Successful-run-Trigger, zentrale Server-Scopes, Virus-Counter-Erzeugung, Cleanup und Purge-Interaktion. |
| 8e Virus Access/Trash/Program Effects | `Crumble`, `Garbage In` | Access-Modifikatoren, Trash-Rechte, programgebundene Counter, öffentliche Zugriffsergebnisse ohne private Queue-Leaks. |
| 8f Random/Bad-Publicity Virus Longtail | `Armageddon`, `Scaldan` | RandomDrawRecords, Bad-Publicity-Reuse aus Phase 2, Virus-/Purge-Interaktion, Replay-/StateHash-stabile Zufallsfolgen. |

Activity-Zuschnitt: 8a ist Pflichtvorlauf. 8b bis 8f sollten getrennte Activities sein, weil Antibody, Agenda, erfolgreiche Runs, Access und Random unterschiedliche Gates berühren.

## Phase 9: Random, Hidden-Zone Search, Action Economy, Longtail

Phase 9 ist explizit keine Implementierungseinheit. Sie enthält mehrere tiefe Regel- und Engine-Familien sowie einen bekannten Regelklärungsblocker.

| Slice | Zielkarten | Benötigte Funktionsbausteine |
| --- | --- | --- |
| 9a Random/Dice Foundation | `Roadblock`, `Executive Boot Camp`, `Lisa Blight`, `Forward's Legacy` | Generische Würfel-/Random-Resolver, Seed/RandomCounter/RandomDrawRecords, öffentliche Ergebnisprojektion, keine Seed- oder Kandidatenleaks. |
| 9b Action Economy/Action Debt | `AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox`, `Lucidrine™ Drip Feed` | Zusätzliche/entzogene Aktionen, Action Debt/Forgo Actions, turnübergreifende StateHash-relevante Pflichten, LegalAction-Filterung. |
| 9c Hidden-Zone Search/Install/Tutor | `Hijack`, `Test Spin` | Side-private Hidden-Zone-Suche, Install-/Tutor-Folgeaktionen, deterministisches Shuffle/Reorder, redigierte PublicEvents. |
| 9d Data-Fort Creation Lock | `Precision Bribery` | Lock auf Data-Fort-Erstellung, Kosten-/Trash-/Sabotage-Revalidierung, turngebundener Lock-Cleanup. |
| 9e Rule-Blocked Preflight | `Ice and Data Special Report` | Klärung der Kostenangabe `Cost 3 (0)`, danach Entscheidung, ob Hidden-Zone-Search, expose/reveal oder anderer Resolver betroffen ist. |

Activity-Zuschnitt: 9a bis 9e müssen als getrennte Activities angelegt werden. `Ice and Data Special Report` bleibt blockiert, bis eine dokumentierte Quellen-/Regelentscheidung existiert.

## Abhängigkeitsmatrix

| Vorlauf | Entsperrt |
| --- | --- |
| 1a-1g | Erstes Proteus-Baseline-Vertrauen, aber keine harte technische Voraussetzung für Phase 2 außer Status-/Gate-Disziplin. |
| 2a | Alle Bad-Publicity-Karten in Phase 2, `Back Door to Netwatch` in Phase 4d und `Scaldan` in Phase 8f. |
| 3a | Alle variablen ICE-Slices 3b bis 3e. |
| 4a | Alle Hidden-Runner-Resource-Slices 4b bis 4e. |
| 5a | Breaker-Support in 5e und spätere AI-/Run-Kostenbewertung, falls diese später freigegeben wird. |
| 6a | Runner-Agenda-/Overadvance-Events in 6e. |
| 7a | Alle Deck-/Cybernetics-Hardware-Slices. |
| 8a | Alle Virus-/Antibody-/Purge-Slices 8b bis 8f und Action-Debt-Nutzung in 9b. |
| 9a | Alle Random-Karten in Phase 9 und `Armageddon`/`Scaldan`-Randomteile aus 8f. |

## Handoff-Regel

Die bestehenden groben Phase-Activities bleiben als Umbrella-/Planungsreferenz geeignet, sollen aber vor Codearbeit entlang der hier definierten Slices in kleinere Activities zerlegt oder ersetzt werden. Direkte Umsetzung einer kompletten Phase 2 bis 9 in einem Paket ist nicht empfohlen, weil sie mehrere Regelautoritäten, Timingfenster und Hidden-Info-Gates gleichzeitig berühren würde.
