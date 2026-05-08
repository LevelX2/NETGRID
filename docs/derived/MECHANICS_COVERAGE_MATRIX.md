# Mechanics Coverage Matrix 1.1.3

Status: V1.1.3 Normalisierung nach V1.1.2K
Stand: 2026-05-08
Maschinenlesbar: `data/rules/mechanics-coverage-0.99.json` bleibt der letzte versionierte JSON-Stand; V1.1.3 normalisiert zunächst das menschliche Planungsartefakt.

## Zweck

Diese Matrix normalisiert den aktuellen Mechanikstand nach V1.1.2K/V1.1.3. Sie ersetzt keine Regelreferenz, sondern ist das Gate-Artefakt, das spätere Mechanikarbeit vor verdeckten Alt-Deviations schützt.

Hinweis nach Bestandsaufnahme 2026-05-04: Der lokale private O:NR-v1-Testzugang nutzt vorhandene Mechaniken in einem Engine-Harness und über lokale ignorierte Web-Overlay-Daten. Er erweitert diese Matrix nicht automatisch zu einem vollständigen offiziellen Kartenpool. Für reguläre Matchstart-Spielbarkeit braucht O:NR einen eigenen Gate- oder Stabilisierungsscope.

Statuswerte:

- `implemented`: umgesetzt und regressionsgeschützt.
- `implemented_limited`: umgesetzt, aber bewusst eng oder demo-/slice-bezogen.
- `specified_not_implemented`: spezifiziert, aber noch nicht spielbar.
- `open`: bekannt, aber noch nicht ausreichend spezifiziert.
- `blocked`: braucht eigene Produkt-, Rechte- oder Sicherheitsentscheidung.
- `out_of_scope`: bewusst nicht Teil der privaten MVP/V1.x-Roadmap.

## Aktuelle Matrix

| Mechanic ID | Mechanik | Status | Priorität | Risiko | Zielgate | Einordnung |
|---|---|---|---|---|---|---|
| `mechanic.core.determinism` | Seed, RandomCounter, RandomDrawRecords, Replay, StateHash | `implemented` | P0 | hoch | erledigt | Zentrales Engine-Fundament ist vorhanden und muss bei jeder Mechanik grün bleiben. |
| `mechanic.actions.legal_action_pipeline` | LegalActions/PlayerActions/applyAction | `implemented` | P0 | hoch | erledigt | Actions werden aus LegalActions gewählt und in `applyAction` erneut validiert. |
| `mechanic.visibility.hidden_info_contract` | PlayerViews, PublicEvents, KI, WebSocket, Reconnect, Undo | `implemented` | P0 | sehr hoch | Dauer-Gate | Sichtbarkeit ist Gate, nicht Komfort. Jede neue Mechanik braucht negative Leaktests. |
| `mechanic.turns.basic_actions` | Clicks, Credits, Draw, Install, Play, Advance, Score, End Turn | `implemented_limited` | P0 | mittel | erledigt | Für den aktuellen lokalen Slice ausreichend; V1.1.1 ergänzt Discard-/Handlimit-Phasen. |
| `mechanic.card_types.core` | Identity, Event, Program, Hardware, Resource, Agenda, Operation, Asset, Upgrade, ICE | `implemented_limited` | P0 | mittel | erledigt/weiterführend | Kartentypen existieren inklusive Resource; V0.98 ergänzt enge Identity-Setup-/Static-Piloten. |
| `mechanic.runs.basic_run` | Run, Approach, Rez, Encounter, Movement, Access | `implemented_limited` | P0 | hoch | erledigt/V0.97 | Grundrun spielbar; V0.97 ergänzt gated Movement vor dem nächsten ICE oder Server. |
| `mechanic.abilities.breaker_paid` | Breaker Pump und Break | `implemented_limited` | P0 | hoch | V0.93 | Spielbar als direkte Actions; V0.93 migriert intern auf Ability-Pilot. |
| `mechanic.effects.general_kernel` | Allgemeiner Effect-/Command-Kernel | `implemented_limited` | P0 | hoch | erledigt/V0.94 | V0.93 lieferte den additiven EffectCommand-Pfad; V0.94 nutzt ihn für Damage. |
| `mechanic.timing.paid_ability_windows` | Allgemeine Timing-/Paid-Ability-Fenster | `implemented_limited` | P0 | hoch | erledigt/weiterführend | Freigegebene Timingpunkte existieren; keine vollständige Prioritätsmaschine. |
| `mechanic.choices.pending_choice` | PendingChoice/ChoiceRequest | `implemented_limited` | P0 | sehr hoch | erledigt/weiterführend | Grundlage existiert side-sicher und trägt Trace-Bids, Mulligan, Discard, Hidden-Zone-Tools und künftige Event-Modification-Fenster. |
| `mechanic.events.visibility_classification` | public/private/hidden_info_barrier/replay_only | `implemented_limited` | P0 | sehr hoch | erledigt/V0.94 | PublicEvents tragen Visibility-Klassen; V0.94 nutzt `hidden_info_barrier` für Damage. |
| `mechanic.tags.basic` | Tags, Remove Tag, einfache Tag-Punishment, Resource-Trash, Trace-Tag | `implemented_limited` | P1 | mittel | erledigt/V0.96 | Grundtags existieren; V0.95 ergänzt Resource-Trash, V0.96 ergänzt `add_tag` als engen Trace-Erfolgseffekt. |
| `mechanic.setup.game_end` | 7 Punkte, Game-End-Vertrag, Deckout/Flatline, Identity-Setup, Archives-facedown-Grundlage | `implemented_limited` | P1 | mittel | erledigt/V1.1.0 | V1.1.0 setzt explizites Setup, 7-Punkte-Ziel, Agenda-Sieg, Korp-Deckout, Flatline-Vertrag und Identity-PlayerViews eng um. |
| `mechanic.setup.mulligan` | Mulligan | `implemented_limited` | P1 | hoch | erledigt/V1.1.0 | Private Runner-/Korp-Mulligans laufen als side-sichere Choices über LegalActions/PlayerActions. |
| `mechanic.turns.discard_handlimit` | Discard-Phasen und dynamische Handlimits | `implemented_limited` | P1 | hoch | erledigt/V1.1.1 | V1.1.1 setzt Korp-/Runner-Discard, private Discard-Choices, Korp-Discard facedown nach Archives und Runner-Discard in Heap um. |
| `mechanic.damage.flatline` | Net/Meat/Core Damage und Flatline | `implemented_limited` | P1 | sehr hoch | erledigt/V1.1.1 | Net-/Meat-Damage, Core Damage und Flatline-Grund sind spielbar; Prevention bleibt V1.2.0. |
| `mechanic.resources` | Runner Resources und Tag-Resource-Interaktion | `implemented_limited` | P1 | mittel | erledigt/V0.95 | Runner-Resources sind public installierte Boardkarten; Corp darf bei getaggtem Runner für 1 Klick und 2 Credits eine installierte Resource trashen. Hosting und komplexe Resource-Abilities fehlen. |
| `mechanic.trace.link_bidding` | Trace, Link, Bidding | `implemented_limited` | P1 | sehr hoch | erledigt/V0.96 | Trace ist als öffentliche Corp-/Runner-Bid-Sequenz spielbar. Erfolg ist `traceStrength > runnerStrength`; V0.98 nutzt den Runner-Link der aktiven Identity. |
| `mechanic.runs.jackout_multiaccess_breach` | Jack-out, Breach-Objekt, Multiaccess, Archives-Ausbau | `implemented_limited` | P1 | sehr hoch | erledigt/V1.1.2 | Jack-out ist im V0.97-Movement-Fenster spielbar. Successful Runs nutzen eine interne Breach-Queue; V1.1.2 ergänzt vollständigen Runner-Access auf gemischte Korp-Archives. |
| `mechanic.identities.abilities` | Setup-, passive und ausgelöste Identity-Fähigkeiten | `implemented_limited` | P1 | hoch | erledigt/V0.98 | V0.98a setzt lokale Runner-/Corp-Identities mit Setup-Credits, Usage-Markern, Runner-Base-Link und statischem Memory-Modifier um. Paid/triggered Identity-Fenster bleiben offen. |
| `mechanic.hidden_zone_tools` | Search, Reveal, Expose, Arrange, Shuffle, Swap | `implemented_limited` | P2 | sehr hoch | erledigt/V0.98 | V0.98b setzt enge Harnesses fuer eigene Stack-Search, Top-2-Arrange, Public Reveal, Expose und HQ/R&D-Swap um. Breite offizielle Kandidatenmatrix bleibt offen. |
| `mechanic.hosting.viruses.counters` | Hosting, Hosted Cards, Viren, Purge, Counter-Familien | `implemented_limited` | P2 | hoch | erledigt/V0.99 | V0.99 setzt Karten-Counter, direkte Runner-Hosting-Harness, Virus-Counter, Corp-Purge, Recurring Credits und Bad Publicity eng um. Breite offizielle Hosting-/Counter-Matrix bleibt offen. |
| `mechanic.event_modification.prevent_avoid_interrupt` | Prevention, Avoid, Interrupts | `open` | P0 | sehr hoch | V1.2.0 | Nächstes Mechanikgate; Damage Prevention ist bevorzugter Pilot, Tag-/Run-Avoid nur Alternativpilot. |
| `mechanic.event_modification.replacement` | Replacement Effects | `open` | P0 | sehr hoch | V1.2.1 | Eigenes Gate nach V1.2.0; Originalevent und Replacementevent müssen getrennt geloggt werden. |
| `mechanic.deckbuilding.formats` | Faction, Influence, Agenda-Dichte, Kopien, Rotation | `implemented_limited` | P2 | mittel | V1.x | Deck-Snapshots und lokale Profile existieren; offizielle Formatregeln sind nicht umgesetzt. |
| `mechanic.special_cases` | Extra Cards, Set Aside, Remove from Game, Ownership/Control | `open` | P2 | hoch | nach V1.2.1 | Spezialfälle erst nach Event Modification und Replacement; nicht Teil von V1.1.3 bis V1.2.1. |
| `product.public_platform` | Matchmaking, Rankings, Accounts, Turniere | `out_of_scope` | P4 | hoch | keines | Produktfeature, keine Engine-Mechanik im privaten Scope. |

## Deviation-Normalisierung

| Alte Deviation | V0.92-Status | Kommentar |
|---|---|---|
| DEV-001 Deckbuilding | partial | Snapshot-/Deckvalidierung existiert; offizielle Formatregeln fehlen. |
| DEV-002 Kartenpool | partial | Lokaler/fiktiver Starter-Slice ist spielbar; breiter/offizieller Kartenpool bleibt gegatet. |
| DEV-003 Identitäten | partial | V0.98 setzt Setup-/Static-Identity-Piloten um; generische paid/triggered Identity-Fenster fehlen. |
| DEV-004 Mulligan | partial | V1.1.0 setzt private Mulligan-Choices für Runner und Korp um; breitere Sonderfälle bleiben später. |
| DEV-005 Timingfenster | partial | TimingPointIds existieren; allgemeines M1-Fundament fehlt bis V0.93. |
| DEV-006 Paid Abilities | partial | Breaker-Paid-Abilities spielbar, allgemeine Registry fehlt bis V0.93. |
| DEV-007 Tags/Trace/Damage/Viren | partial | Tags, V0.94 Damage, V0.95 Resources, V0.96 Trace/Link/Bidding, V0.98 Link-Werte und V0.99 Virus/Purge sind in engen Gates umgesetzt. |
| DEV-008 Prevention/Replacement/Interrupt | open | Aufgeteilt: Prevention/Avoid/Interrupt in V1.2.0, Replacement in V1.2.1. |
| DEV-009 Hosting/Hosted Cards | partial | V0.99 setzt eine direkte Runner-Resource-Hosting-Harness um; vollständige offizielle Hosting-Matrix bleibt offen. |
| DEV-010 Siegpunktwert | partial | 7 Punkte für neue Formate vorhanden, Legacy 6 bleibt dokumentiert. |
| DEV-011 Jack Out | partial | V0.97-Movement-Jack-out spielbar; vollständige Run-Timing-Matrix bleibt spätere Härtung. |
| DEV-012 Multiaccess | partial | R&D/HQ-Multiaccess 2 über lokalen Harness spielbar; breite Access-Modifikatoren bleiben offen. |
| DEV-013 Archives | partial | V1.1.2 setzt Full Archives Access auf gemischte faceup/facedown Korp-Archives um; weitere Access-Replacement-Fälle bleiben offen. |
| DEV-014 Identity/Modifier | partial | V0.98 setzt Setup- und Static-Modifier um; weitere Identity-Timingfenster bleiben später. |
| DEV-015 Hidden-Zone-Tools | partial | V0.98 setzt Search/Reveal/Expose/Arrange/Shuffle/Swap als enge Harnesses um; vollständige offizielle Kandidatenmatrix bleibt offen. |
| DEV-016 Public Replay | out_of_scope | Öffentliche Replay-Plattform bleibt Produkt-Nichtziel. |
| DEV-017 UI | partial | V0.7/S01 umgesetzt; UI bleibt nicht regelautoritativer Client. |
| DEV-018 Counter-Familien | partial | V0.99 setzt Counter nur fuer konkrete Harness-Karten und sichtbare Anwendungsfaelle um. |
| DEV-019 Purge | partial | V0.99 setzt Corp-Basic-Purge fuer Virus-Counter um; weitere Purge-Kartenfaehigkeiten bleiben offen. |
| DEV-020 Recurring Credits | partial | V0.99 nutzt Recurring Credits nur fuer Runner-Programminstallkosten. |
| DEV-021 Bad Publicity | partial | V0.99 nutzt Bad Publicity nur fuer Runner-Run-Kosten und nicht fuer Trace-Bids. |

## Gate-Regeln für spätere Karten

Keine Karte darf `playable`, `deck_legal` oder matchstartfähig sein, wenn ihre benötigte Mechanik in dieser Matrix nicht mindestens `implemented` oder `implemented_limited` mit akzeptierter Abweichung ist.

Import-, Katalog- und Assetstatus erzeugen keine Spielbarkeit. Jede neue spielbare Karte braucht weiterhin Resolver/Ability, Manifest, Unit-Test, Szenario, Visibility-, Replay/StateHash-, KI- und Multiplayer-Smoke.
