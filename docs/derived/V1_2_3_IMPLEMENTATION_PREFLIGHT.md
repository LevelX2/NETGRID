# V1.2.3 Implementation Preflight - Mechanic Unlock Card Release 1

Stand: 2026-05-08
Status: final card list fixed

## Gate

V1.2.2 ist abgeschlossen und verifiziert. V1.2.3 beginnt erst danach und nutzt die in V1.2.2 freigegebene Spezialzone `removed_from_game` fuer MIT West Tier.

## Finale Kartenliste

V1.2.3 gibt exakt 8 Karten frei. Die Obergrenze von 20 Karten wird nicht ausgeschoepft.

| Karte | Seite | Status | KI |
| --- | --- | --- | --- |
| `onr_v1_021_dwarf` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_039_krash` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_066_snowball` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_074_worm` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_081_custodial-position` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_085_executive-wiretaps` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_101_mit-west-tier` | Runner | human_playable, deck_legal | nicht ai_supported |
| `onr_v1_297_overtime-incentives` | Corp | human_playable, deck_legal | nicht ai_supported |

## Scope-Entscheidung

- Keine KI-Deckfreigabe und kein AI-Hinting.
- Keine Format- oder Public-Plattformfunktion.
- Kein Card-Text-Parser.
- Keine offiziellen Assets, Logos, Frames oder externen Kartendatenbank-Abhaengigkeiten.
- Nicht gelistete lokale O:NR-Karten bleiben runtime- und deck-illegal.

## Pflichtartefakte

- `data/manifests/card-implementation-manifest-1.2.3.json`
- `data/scenarios/v123-card-release-smoke.json`
- `data/decks/deck-snapshots-0.8.json` mit V1.2.3 Runner- und Corp-Snapshot
- `docs/derived/V1_2_3_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_2_3_FINAL_REVIEW.md`
