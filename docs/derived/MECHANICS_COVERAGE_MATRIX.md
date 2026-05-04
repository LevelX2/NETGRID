# Mechanics Coverage Matrix 0.96

Status: V0.96 Trace, Link und Bidding umgesetzt
Stand: 2026-05-04
Maschinenlesbar: `data/rules/mechanics-coverage-0.96.json`

## Zweck

Diese Matrix normalisiert den aktuellen Mechanikstand nach V0.96. Sie ersetzt keine Regelreferenz, sondern ist das Gate-Artefakt, das spätere Mechanikarbeit vor verdeckten Alt-Deviations schützt.

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
| `mechanic.turns.basic_actions` | Clicks, Credits, Draw, Install, Play, Advance, Score, End Turn | `implemented_limited` | P0 | mittel | erledigt | Für den aktuellen lokalen Slice ausreichend; Discard/Handlimit bleibt offen. |
| `mechanic.card_types.core` | Identity, Event, Program, Hardware, Resource, Agenda, Operation, Asset, Upgrade, ICE | `implemented_limited` | P0 | mittel | erledigt/weiterführend | Kartentypen existieren inklusive Resource; echte Identity-Abilities fehlen. |
| `mechanic.runs.basic_run` | Run, Approach, Rez, Encounter, Continue, Access | `implemented_limited` | P0 | hoch | erledigt/V0.97 | Grundrun spielbar; Jack-out, Breach-Queue und Multiaccess bleiben spätere Gates. |
| `mechanic.abilities.breaker_paid` | Breaker Pump und Break | `implemented_limited` | P0 | hoch | V0.93 | Spielbar als direkte Actions; V0.93 migriert intern auf Ability-Pilot. |
| `mechanic.effects.general_kernel` | Allgemeiner Effect-/Command-Kernel | `implemented_limited` | P0 | hoch | erledigt/V0.94 | V0.93 lieferte den additiven EffectCommand-Pfad; V0.94 nutzt ihn für Damage. |
| `mechanic.timing.paid_ability_windows` | Allgemeine Timing-/Paid-Ability-Fenster | `implemented_limited` | P0 | hoch | erledigt/weiterführend | Freigegebene Timingpunkte existieren; keine vollständige Prioritätsmaschine. |
| `mechanic.choices.pending_choice` | PendingChoice/ChoiceRequest | `implemented_limited` | P0 | sehr hoch | erledigt/weiterführend | Grundlage existiert side-sicher und trägt in V0.96 echte `bid_amount`-Trace-Choices; Mulligan bleibt nicht spielbar. |
| `mechanic.events.visibility_classification` | public/private/hidden_info_barrier/replay_only | `implemented_limited` | P0 | sehr hoch | erledigt/V0.94 | PublicEvents tragen Visibility-Klassen; V0.94 nutzt `hidden_info_barrier` für Damage. |
| `mechanic.tags.basic` | Tags, Remove Tag, einfache Tag-Punishment, Resource-Trash, Trace-Tag | `implemented_limited` | P1 | mittel | erledigt/V0.96 | Grundtags existieren; V0.95 ergänzt Resource-Trash, V0.96 ergänzt `add_tag` als engen Trace-Erfolgseffekt. |
| `mechanic.setup.game_end` | 7 Punkte, Legacy-Siegwert, Deckout/Flatline-Vorbereitung, Identity-Setup, Archives Review | `specified_not_implemented` | P1 | mittel | V0.93 Requirements | V0.93 plant M2 nur als Requirements. Keine Mulligan-Implementierung. |
| `mechanic.setup.mulligan` | Mulligan | `open` | P1 | hoch | nach V0.93 | Muss als Choice-Schritt spezifiziert und später separat implementiert werden. |
| `mechanic.damage.flatline` | Net/Meat/Core Damage und Flatline | `implemented_limited` | P1 | sehr hoch | erledigt/V0.94 | Net/Meat-Damage und Flatline-Grund sind spielbar; Core-Damage und Prevention bleiben gesperrt. |
| `mechanic.resources` | Runner Resources und Tag-Resource-Interaktion | `implemented_limited` | P1 | mittel | erledigt/V0.95 | Runner-Resources sind public installierte Boardkarten; Corp darf bei getaggtem Runner für 1 Klick und 2 Credits eine installierte Resource trashen. Hosting und komplexe Resource-Abilities fehlen. |
| `mechanic.trace.link_bidding` | Trace, Link, Bidding | `implemented_limited` | P1 | sehr hoch | erledigt/V0.96 | Trace ist als öffentliche Corp-/Runner-Bid-Sequenz spielbar. Erfolg ist `traceStrength > runnerStrength`; einziger Erfolgseffekt ist `add_tag`. |
| `mechanic.runs.jackout_multiaccess_breach` | Jack-out, Breach-Objekt, Multiaccess, Archives-Ausbau | `open` | P1 | sehr hoch | V0.97+ | Run-Herzstück, aber erst nach M1/M2 sicher. |
| `mechanic.identities.abilities` | Setup-, passive und ausgelöste Identity-Fähigkeiten | `open` | P1 | hoch | V0.98+ | Identities existieren als Karten, aber ohne aktive Fähigkeit. |
| `mechanic.hidden_zone_tools` | Search, Reveal, Expose, Arrange, Shuffle, Swap | `open` | P2 | sehr hoch | V0.98+ | Braucht Choice- und Visibility-Fundament. |
| `mechanic.hosting.viruses.counters` | Hosting, Hosted Cards, Viren, Purge, Counter-Familien | `open` | P2 | hoch | V0.99+ | Objektbeziehungen und Counter-API fehlen. |
| `mechanic.event_modification` | Prevention, Avoid, Interrupts, Replacement | `open` | P2 | sehr hoch | V1.x | Erst nach stabilem Effect-/Choice-/Hidden-Info-Fundament. |
| `mechanic.deckbuilding.formats` | Faction, Influence, Agenda-Dichte, Kopien, Rotation | `implemented_limited` | P2 | mittel | V1.x | Deck-Snapshots und lokale Profile existieren; offizielle Formatregeln sind nicht umgesetzt. |
| `mechanic.special_cases` | Extra Cards, Set Aside, Remove from Game, Ownership/Control | `open` | P3 | hoch | post-V1.x | Spezialfälle erst nach Kernmechaniken. |
| `product.public_platform` | Matchmaking, Rankings, Accounts, Turniere | `out_of_scope` | P4 | hoch | keines | Produktfeature, keine Engine-Mechanik im privaten Scope. |

## Deviation-Normalisierung

| Alte Deviation | V0.92-Status | Kommentar |
|---|---|---|
| DEV-001 Deckbuilding | partial | Snapshot-/Deckvalidierung existiert; offizielle Formatregeln fehlen. |
| DEV-002 Kartenpool | partial | Lokaler/fiktiver Starter-Slice ist spielbar; breiter/offizieller Kartenpool bleibt gegatet. |
| DEV-003 Identitäten | open | Identitätskarten existieren, aktive Fähigkeiten nicht. |
| DEV-004 Mulligan | open | M2 wird spezifiziert, nicht in V0.93 implementiert. |
| DEV-005 Timingfenster | partial | TimingPointIds existieren; allgemeines M1-Fundament fehlt bis V0.93. |
| DEV-006 Paid Abilities | partial | Breaker-Paid-Abilities spielbar, allgemeine Registry fehlt bis V0.93. |
| DEV-007 Tags/Trace/Damage/Viren | partial | Tags, V0.94 Damage, V0.95 Resources und V0.96 Trace/Link/Bidding sind in engen Gates umgesetzt; Viren bleiben offen. |
| DEV-008 Prevention/Replacement/Interrupt | open | Bewusst spätes Hochrisiko-Gate. |
| DEV-009 Hosting/Hosted Cards | open | Keine Engine-Beziehungen oder Karten. |
| DEV-010 Siegpunktwert | partial | 7 Punkte für neue Formate vorhanden, Legacy 6 bleibt dokumentiert. |
| DEV-011 Jack Out | open | Nicht spielbar. |
| DEV-012 Multiaccess | open | Nicht spielbar. |
| DEV-013 Archives | partial | Einfaches Modell vorhanden, facedown/Access-Ausbau offen. |
| DEV-014 Public Replay | out_of_scope | Öffentliche Replay-Plattform bleibt Produkt-Nichtziel. |
| DEV-015 UI | partial | V0.7/S01 umgesetzt; UI bleibt nicht regelautoritativer Client. |

## Gate-Regeln für spätere Karten

Keine Karte darf `playable`, `deck_legal` oder matchstartfähig sein, wenn ihre benötigte Mechanik in dieser Matrix nicht mindestens `implemented` oder `implemented_limited` mit akzeptierter Abweichung ist.

Import-, Katalog- und Assetstatus erzeugen keine Spielbarkeit. Jede neue spielbare Karte braucht weiterhin Resolver/Ability, Manifest, Unit-Test, Szenario, Visibility-, Replay/StateHash-, KI- und Multiplayer-Smoke.
