# V1.9.21 Detailed Plan - Deterministischer Zufall und Wuerfelkarten

Status: planned
Stand: 2026-05-13

## Ziel

V1.9.21 schliesst den Zufalls-/Wuerfel-Slice fuer genau sechs Karten aus der V1.9.10-bis-V1.9.xx-Matrix. Der Release darf keine V1.9.22-Karte promoten.

## Zielkarten

- Runner: AI Boon, Boardwalk, Playful AI, Quest for Cattekin.
- Korp: Schlaghund, Rio de Janeiro City Grid.

## Resolverfamilien

- `deterministic_random_card_resolver`
- Wiederverwendete Randfamilien: Run-Flow, Hidden-Zone, Counter/Virus/Purge, Recurring, Event-Modification, Persistent-State, Damage, Asset/Node und Upgrade/Root/Server.

## Umsetzungsschnitt

1. Catalog-WIP-Zielmenge `ONR_V1_9_21_WIP_CARD_IDS` ergaenzen, ohne Release- oder AI-Promotion.
2. WIP-Runtime-Definitionen mit finalen display-only Texten ohne `WIP`-Praefix anlegen.
3. Engine-Basisschnitt fuer deterministische Karten-Zufallsauflösung definieren: Seed, RandomCounter, RandomDrawRecords, PublicEvent-Kontext und StateHash.
4. Erste Smokes fuer Runner-Zufallskarten und Korp-Asset/Upgrade-Zufallspfade schreiben.
5. Danach Daten-/AI-Draft-Artefakte, volle Gates, Final Review und Promotion nachziehen.

## No-Scope

- Keine V1.9.22-Per-card-Longtail-Freigabe.
- Kein undeterministischer Host-Zufall ausserhalb von Seed, RandomCounter und RandomDrawRecords.
- Keine Hidden-Zone- oder Kartentextparser-Autoritaet aus Anzeige-Text.
