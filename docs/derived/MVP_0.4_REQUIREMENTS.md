# MVP 0.4 Requirements

Status: frozen_for_implementation  
Stand: 2026-05-03  
Scope: kontrollierte Kartenpool- und Regelbreite-Erweiterung

## Scope-Entscheidung

MVP 0.4 baut auf dem bestandenen MVP-0.3-Gate auf. Der Scope wird gegenüber dem detaillierten Plan bewusst enger gefasst:

- In Scope: versionierte 0.4-Artefakte, kleine interne Kartencharge, eingeschränkte Deckvalidierung, Hardware, Upgrade als einfache Root-Karte, Tags und `remove_tag`.
- Deferred: Damage, Resources, Trace, Viren, Hosting, Multiaccess, Bypass, Prevention, Replacement, freier Deckbuilder.
- Weiterhin verboten: offizielle Kartenpools, externe Kartendatenbank, offizielle Artworks, Logos, Frames, Card Backs und öffentliche Plattformfunktionen.

## Must Requirements

| ID | Requirement | Akzeptanzkriterium | Test-/Szenario-Abdeckung |
|---|---|---|---|
| V04-REQ-001 | V0.4-Baseline | `rules-baseline-0.4.json` trennt Versionen sichtbar von 0.1-0.3. | T-V04-DATA-001 |
| V04-REQ-002 | Versionierte Kartenartefakte | 0.4-Karten, Decks, Manifest und Deviation-Datei existieren separat. | T-V04-DATA-001 |
| V04-REQ-003 | Manifestpflicht | Jede neue `playable_mvp` Karte hat Unit-, Szenario-, Visibility- und Replay-Zuordnung. | T-V04-DATA-002 |
| V04-REQ-004 | Eingeschränkte Deckvalidierung | Kuratierte Decks werden gegen Side, Identity, erlaubte Karten, Mengen und Agenda Points geprüft. | T-V04-DECK-001 |
| V04-REQ-005 | Safe Card Batch | Neue einfache Karten ohne Damage funktionieren über LegalActions und `applyAction`. | T-V04-CARD-001, SCN-V04-001 |
| V04-REQ-006 | Hardware | Runner-Hardware kann installiert werden und erhöht das Memory Limit. | T-V04-CARD-002 |
| V04-REQ-007 | Upgrade | Einfache Corp-Upgrades können verdeckt installiert, gerezzt, accessed und getrasht werden. | T-V04-CARD-003 |
| V04-REQ-008 | Tags | Corp-Karten können Runner-Tags geben; Tags sind öffentlich sichtbar. | T-V04-TAG-001, SCN-V04-002 |
| V04-REQ-009 | Remove Tag | Runner kann mit 1 Click und 2 Credits genau 1 Tag entfernen. | T-V04-TAG-002 |
| V04-REQ-010 | Tag-Punishment-Bedingung | Tag-Punishment-Operation ist nur legal, wenn Runner getaggt ist. | T-V04-TAG-003, SCN-V04-003 |
| V04-REQ-011 | AI-/Simulation-Regression | KI-vs-KI-Smoke läuft mit 0.4-Decks ohne illegale Aktion und mit Replay-StateHash. | T-V04-AI-001, SCN-V04-004 |
| V04-REQ-012 | Existing Gates bleiben grün | MVP-0.1-, 0.2- und 0.3-Checks bestehen weiterhin. | Full check suite |

## Karten in Scope

| ID | Side | Type | Mechanik |
|---|---|---|---|
| `simple_draw_event` | Runner | event | Ziehe 2 Karten. |
| `simple_setup_hardware` | Runner | hardware | +1 Memory Limit. |
| `efficient_fracter` | Runner | program | Alternative Barrier-Lösung. |
| `simple_priority_agenda` | Corp | agenda | 3 Agenda Points, 4 Advancements. |
| `simple_draw_operation` | Corp | operation | Ziehe 2 Karten. |
| `simple_taxing_barrier_ice` | Corp | ice | Runner verliert 1 Credit; End the run. |
| `simple_upgrade` | Corp | upgrade | Verdeckte Root-Karte, rez- und trashbar. |
| `simple_tag_ice` | Corp | ice | Gibt 1 Tag; End the run. |
| `simple_tag_punishment_operation` | Corp | operation | Nur legal bei getaggtem Runner; Runner verliert Credits. |

## Gate

`ready_for_implementation: true`

Begründung: Der Umfang ist klein, jede neue Karte ist testbar, Damage ist explizit zurückgestellt und V0.3 liefert den notwendigen Simulationsharness.
