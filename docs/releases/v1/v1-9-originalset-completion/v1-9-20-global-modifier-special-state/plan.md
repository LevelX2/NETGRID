# V1.9.20 Detailed Plan - Globale Modifier, Handgröße, Action Economy und persistente Sonderzustände

Status: planned
Stand: 2026-05-13

## Ziel

V1.9.20 schließt den Modifier-/Persistent-State-Slice für genau 26 Karten aus der V1.9.10-bis-V1.9.xx-Matrix. Der Release darf keine V1.9.21+-Karten promoten.

## Zielkarten

- Runner: Emergency Self-Construct, Gremlins, Militech MRAM Chip, MRAM Chip, Diplomatic Immunity, Loan from Chiba, Preying Mantis.
- Korp-Agendas: Bioweapons Engineering, Black Ice Quality Assurance, Corporate Boon, Encryption Breakthrough, Ice Transmutation, Main-Office Relocation, Subsidiary Branch.
- Korp-Assets: City Surveillance, Euromarket Consortium, Fortress Architects, Hacker Tracker Central, I Got a Rock, Nevinyrral, Newsgroup Taunting, Pacifica Regional AI, Remote Facility, Rustbelt HQ Branch, South African Mining Corp.
- Korp-Upgrades: Jerusalem City Grid.

## Resolverfamilien

- `persistent_special_state_resolver`
- `action_economy_handsize_modifier_resolver`
- `global_static_modifier_layer_resolver`
- Wiederverwendete Randfamilien: Event-Modification/Prevention, Damage, Hidden-Zone, Recurring, Trace, Counter, Asset/Upgrade und Agenda-Resolver aus V1.9.11 bis V1.9.19.

## Umsetzungsschnitt

1. WIP-Runtime-Definitionen mit finalen display-only Texten ohne `WIP`-Präfix anlegen.
2. Catalog-WIP-Zielmenge `ONR_V1_9_20_WIP_CARD_IDS` ergänzen, ohne Release- oder AI-Promotion.
3. Engine-Basisschnitt für installierte Handlimit-/Action-/MU-/global-statische Modifier und persistente Spezialzustände definieren.
4. Erste Smokes für Runner-Hardware/Programme und Korp-Agenda-/Asset-Modifier schreiben.
5. Danach Daten-/AI-Draft-Artefakte, volle Gates, Final Review und Promotion nachziehen.

## No-Scope

- Keine V1.9.21-Zufalls-/Würfelkarten.
- Keine V1.9.22-Per-card-Longtail-Freigabe.
- Keine UI-/Server-Sonderwege außerhalb LegalActions, PlayerViews und PublicEvents.
