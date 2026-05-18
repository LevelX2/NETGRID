# Proteus Release-Slicing-Plan

Datum: 2026-05-17
Status: planning-only, keine Runtime-Implementierung

## Ziel und Ausgangslage

Dieser Plan schneidet die 154 importierten Proteus-Karten in kleine bis mittlere Release-Slices. Er ist ein Handoff für spätere Umsetzungspakete und erweitert selbst keinen Runtime-, Decklegalitäts-, Formatlegalitäts- oder KI-Support.

Führende Quellen:

- `docs/releases/proteus/spoiler-import-report.md`
- `docs/releases/proteus/mechanics-coverage-analysis.md`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- `docs/releases/proteus/variable-ice-contract.md`
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`
- `docs/releases/proteus/virus-antibody-counter-contract.md`
- `docs/releases/proteus/purge-action-debt-contract.md`
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`

Aktuelle Basis:

- 154 Proteus-Karten sind importiert, validiert und catalog-ready, bleiben aber blockiert.
- Statusverteilung: 17 `covered`, 56 `resolver`, 80 `deepen`, 1 `blocked`.
- Keine Proteus-Karte ist `implemented`, `engine_supported`, `playable`, `human_playable`, `deck_legal`, `format_legal` oder `ai_supported`.
- Proteus wird nicht als Großrelease freigegeben. Jede Karte braucht einen eigenen Resolver-/Manifest-/Szenario-/Visibility-/Replay-/StateHash-Nachweis.

## Priorisierte Releasefolge

| Reihenfolge | Slice | Ziel | Ergebnis |
| ---: | --- | --- | --- |
| 0 | Proteus Planning Freeze | Import, Coverage und Verträge versioniert halten. | Keine Runtime-Promotion; bereits erfuellt. |
| 1 | Visible Baseline Cards | Kleine sichtbare Karten ohne Hidden-, Random-, Variable-, Purge- oder Bad-Publicity-Sonderpfad. | Erste eng begrenzte Human-Spielbarkeit. |
| 2 | Bad-Publicity-7+-Harness | Engine-Game-End-Grund und Priorität gegen gleichzeitige Siege/Flatline absichern. | Foundation vor Bad-Publicity-Karten. |
| 3 | Variable ICE Foundation | Digiconda/Food Fight als nicht-promotender Harness für variable Rez-Werte. | Persistentes Variable-Rez-Modell. |
| 4 | Hidden Runner Resource Foundation | Generischer verdeckter Runner-Resource-Zustand ohne Kartenfähigkeiten. | Hidden-Info-Basis für 16 Hidden Resources. |
| 5 | Simple Runner Breaker/Event/Economy | Kleine Runner-Resolver auf sichtbarer Basis. | Breiterer Spielwert ohne Hidden-/Virus-Familien. |
| 6 | Agenda, Ambush und Access-Basis | Agenda-/Access-/Damage-/Tag-Resolver mit enger Matrix. | Korp-/Runner-Mix nach stabilen Basisslices. |
| 7 | Cybernetics/Deck Hardware | Deck-Einzigkeit, MU-/Handgrößenmodifier und zweckgebundene Bits. | Hardware-Foundation vor AI-Support. |
| 8 | Virus/Antibody/Purge | Counter-Registry, Antibody-Access, Runner-Virus-Counter, Proteus-Purge/Action-Debt. | Riskanter Counter-/Timing-Komplex, keine frühe Promotion. |
| 9 | Random, Variable Longtail und Blocker | Würfel-/Random-Familien, Homing Missile, Ice and Data Special Report und übrige Deepen-Karten. | Späte gezielte Freigabe nach Verträgen. |

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

Nicht-Scope:

- Keine Proteus-Kartenpromotion.
- Keine Bad-Publicity-Kartenresolver wie `Charity Takeover`, `Scaldan`, `Faked Hit` oder `Back Door to Netwatch`.

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

## Slice 3: Variable ICE Foundation

Scope:

- Nicht-promotender Engine-Harness für `Digiconda` und `Food Fight`.
- Variable `rez_ice`-LegalActions mit gebundenem Zusatzbetrag.
- Persistenter, StateHash-relevanter variabler ICE-State für Stärke oder zusätzliche Subroutinen.

Nicht-Scope:

- Keine Homing-Missile-Trace-Sperre.
- Keine Subtyp-Wechsler, relative ICE-Zähler, Pass-Trigger oder Repositionierung.
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

- Sichtbare Runner-Programme und Events mit vorhandenen Install-, Pump/Break-, Draw-/Credit- oder Run-Event-Pfaden.
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

## Slice 6: Agenda, Ambush und Access-Basis

Scope:

- Kleine Agenda-/Access-/Damage-/Tag-Resolver nach vorhandenen M2/Multiaccess-Grundlagen.
- Kandidaten mit `resolver`: `Corporate Headhunters`, `Fetal AI`, `Marked Accounts`, ausgewählte simple Ambush-/Access-Faelle.

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

## Slice 9: Random, Variable Longtail und Blocker

Scope:

- Proteus-Würfel-/Random-Familien, Homing-Missile-Folgeeffekt, variable ICE-Folgefamilien, `Ice and Data Special Report` nach Quellenklärung, übrige Deepen-Karten.

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
| `human_playable` | Runtime-Resolver, Manifest, Mechanics-Coverage, Szenario, LegalAction-/`applyAction`-Revalidierung, Visibility, Replay/StateHash und Web-Catalog-No-Broad-Promotion. |
| `deck_legal` | Zusaetzlich formaler Release-Gate-Beschluss, Deckbuilder-/Format-Manifest und keine offenen Quellen-/Resolverblocker. |
| `ai_supported` | Zusaetzlich AI-Hints mit scenarioRefs, side-sicherer AIInput, AI-Smoke und Nachweis, dass keine verdeckten Kartendaten oder Debugdaten genutzt werden. |

`human_playable` erzeugt nie automatisch `ai_supported`.

## Erste Folgeactivities

Vorbereitete erste Umsetzungspakete:

1. `docs/activities/inbox/act-2026-05-17-proteus-visible-baseline-card-slice.md`
2. `docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-engine-harness.md`
3. `docs/activities/inbox/act-2026-05-17-proteus-variable-ice-harness-slice.md`
4. `docs/activities/inbox/act-2026-05-17-proteus-hidden-resource-foundation-slice.md`

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
- Release-/Manifest-/Mechanics-Coverage-Änderung,
- LegalAction-/`applyAction`-Revalidierung,
- Hidden-Info-, Replay-, StateHash- und stale-action-Tests,
- AI-Support-Grenze.
