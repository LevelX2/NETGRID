# Proteus Spoiler Import Report

Datum: 2026-05-17

## Ergebnis

`docs/source/Proteusspoiler.txt` ist als versionierte, reviewbare Kartenbasis importiert.

- Snapshot: `data/card-import/proteus-card-basis-2026-05-17.json`
- Source Registry: `data/card-import/source-registry-proteus-2026-05-17.json`
- Maschinenlesbarer Report: `data/reports/proteus-spoiler-import-report-2026-05-17.json`
- Parser: `packages/catalog/src/proteus-spoiler.ts`

## Zählungen

| Zählung | Ergebnis |
| --- | ---: |
| Karten gesamt | 154 |
| Korp | 77 |
| Runner | 77 |
| Häufig | 66 |
| Ungewöhnlich | 44 |
| Selten | 44 |
| Vital | 0 |

## Typverteilung

| Typ | Anzahl |
| --- | ---: |
| Agenda | 10 |
| ICE | 35 |
| Operation | 8 |
| Asset/Node | 11 |
| Upgrade | 13 |
| Program | 23 |
| Event/Prep | 27 |
| Resource | 21 |
| Hardware | 6 |

Quellenhinweis: Der Spoilerkopf nennt `26 Prep`, `7 Hardware` und `28 Hardware/Resources`; die konkreten Kartenzeilen ergeben `27 Prep/Event`, `6 Hardware` und `27 Hardware/Resources`. Die Runner-Gesamtzählung bleibt 77 und die Gesamtzählung bleibt 154.

## Reviewpunkte

- `Digiconda`: `Cost/Strength` enthält variable Stärke `X`.
- `Homing Missile`: `Cost/Strength` enthält variable Stärke `X`.
- `Ice and Data Special Report`: `Cost` enthält `3 (0)` und braucht eine spätere Regel-/Resolverklärung.

## Scope-Grenzen

Alle 154 Proteus-Karten sind `imported`, `validated`, `catalog_ready` und bewusst `blocked`. Keine Karte ist `implemented`, `engine_supported`, `playable`, `human_playable`, `deck_legal`, `format_legal` oder `ai_supported`.

Der Import nutzt keine offiziellen Artworks, Frames, Logos oder Card Backs und erweitert keinen Runtime-, Replay-, LegalAction-, StateHash- oder AIInput-Pfad.
