# V1.9.19 Detailed Plan - Agenda Difficulty, Scored Agenda Abilities und Overadvance

Status: frozen for implementation
Stand: 2026-05-13

## Ziel

V1.9.19 schließt den Agenda-Difficulty-/Scored-Agenda-/Overadvance-Slice für genau 20 Karten aus der V1.9.10-bis-V1.9.xx-Matrix. Der Release darf keine V1.9.20+-Karten promoten.

## Karten

`Fait Accompli`, `Arasaka Owns You`, `Artificial Security Directors`, `Genetics-Visionary Acquisition`, `Falsified-Transactions Expert`, `Management Shake-Up`, `Project Consultants`, `Silver Lining Recovery Protocol`, `Systematic Layoffs`, `Team Restructuring`, `Chicago Branch`, `Corprunner's Shattered Remains`, `Experimental AI`, `Information Laundering`, `Vacant Soulkiller`, `Vapor Ops`, `Virus Test Site`, `Olivia Salazar`, `Roving Submarine`, `Washington, D.C., City Grid`.

## Leitfamilien

- `scored_agenda_static_active_resolver`
- `agenda_difficulty_overadvance_resolver`
- `typed_counter_virus_purge_resolver`
- `generic_asset_node_ability_resolver`
- `generic_upgrade_root_server_resolver`
- `access_ambush_resolver`
- `hidden_zone_search_reveal_reorder_resolver`
- `damage_event_prevention_resolver`

## Umsetzungsschnitte

1. Runtime-/Catalog-WIP: 20 Zielkarten als WIP-Definitionen mit finalen display-only Texten, No-Promotion-Guard und Engine-Definitionssmoke.
2. Agenda-Kern: Score-/Steal-/Overadvance-/Agenda-Punkt-Pfade mit LegalAction/applyAction-Revalidierung.
3. Corp-Operation-/Asset-Randpfade: Counter-, Economy-, Ambush-, Hidden-Zone- und Damage-Anbindungen.
4. AI-/Daten-/Finalisierung: Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints, AI-Smokes, AI-Approval, Webclient-Version und Final Review.

## Grenzen

- Keine generische `trigger_ability`-Freischaltung.
- Keine V1.9.20+-Karten.
- Keine offiziellen Assets oder externen Kartendatenbank-Abhängigkeiten.
- Kartentexte bleiben display-only und nicht regelautoritativ.
