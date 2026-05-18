# V1.2.3 Implementation Review - Mechanic Unlock Card Release 1

Stand: 2026-05-08
Status: implemented

## Ergebnis

V1.2.3 ist als kleiner, explizit erlaubter Karten-Release umgesetzt. Acht lokale O:NR-Karten sind in der Engine, im Runtime-Katalog und in validierbaren Deck-Snapshots freigegeben. Alle acht Karten sind `human_playable` und `deck_legal`; keine Karte ist `ai_supported`.

## Umgesetzter Scope

- Vier Runner-Icebreaker: Dwarf, Krash, Snowball und Worm.
- Zwei Runner-Multiaccess-Events: Custodial Position fuer R&D und Executive Wiretaps fuer HQ.
- MIT West Tier als Hidden-Zone-Shuffle mit Draw 5 und anschliessender Bewegung nach Removed from Game.
- Overtime Incentives als Corp-Operation mit zwei zusaetzlichen Aktionen.
- Runtime-Katalog mit Status-Trennung `engine_supported`, `human_playable`, `ai_supported` und exakter V1.2.3-Allowlist.
- Deck-Snapshots `demo_runner_123_snapshot_v1_2_3` und `demo_corp_123_snapshot_v1_2_3`.
- Deckvalidierung verhindert `deck_legal` mit explizit falschem `human_playable`.
- Multiplayer-Matchstart revalidiert V1.2.3-Snapshots.
- KI-Deckpool bleibt unveraendert und enthaelt keine V1.2.3-Snapshots.

## Geaenderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`
- `packages/decks/src/index.ts`
- `packages/decks/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `data/decks/deck-snapshots-0.8.json`
- `data/manifests/card-implementation-manifest-1.2.3.json`
- `data/scenarios/v123-card-release-smoke.json`

## Architekturentscheidungen

- Krash nutzt eine generische Breaker-Ability ohne ICE-Subtype, die jede ICE-Subroutine brechen darf.
- MIT West Tier verwendet die V1.2.2-Spezialzone `removed_from_game` und setzt eine Hidden-Info-Barriere fuer Shuffle/Draw.
- PublicEvents zeigen bei Overtime Incentives nur den oeffentlichen Aktionsgewinn, keine versteckten Hand- oder Deckdaten.
- V1.2.3 fuehrt keine KI-Freigabe ein; die KI darf die Karten nur sehen, wenn sie in einem LegalActions-Input vorkommen, und handelt dann mit generischer Logik.

## Bekannte Grenzen

- Keine V1.2.3-Karte ist AI-supported.
- Keine neue Formatregel und kein Deckbuilder-Verhalten.
- Keine Erweiterung des Kartenpools ausserhalb der acht explizit gelisteten Karten.
