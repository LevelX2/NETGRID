# Card-Asset-Retention

Stand: 2026-07-10

## Current-State-Vertrag

Die Web-Runtime liefert für den deutschen Display-Skin ausschließlich
`data/card-assets/localized/de/rendered/full/*.png` aus. Diese Full-PNGs sind
zusammen mit den Art-Rohbildern, dem Frame und `cards.de.json` versioniert.
Sie sind keine Regelautorität und verändern weder LegalActions noch Replay,
StateHash, KI oder Decklegalität.

Der Renderer `scripts/render-localized-card-assets.mjs` erzeugt deshalb nur
noch die benötigten Full-PNGs direkt aus Art, Frame und Kartendaten. SVG-
Zwischenstände, Previews, Thumbnails, Kontaktbögen und Style-Varianten sind
lokale Review-Derivate und werden nicht versioniert.

Einzelne Karten können ohne einen vollständigen Binär-Rewrite mit
`node scripts/render-localized-card-assets.mjs --card <cardId>` regeneriert
werden. Der Cleanup hat damit die zuvor veraltete Babylon-PNG gezielt mit
ihren aktuellen Lokalisierungsdaten synchronisiert.

`corepack pnpm check:card-asset-retention` prüft fail-closed, dass jede Karte
genau eine vorhandene Art-Quelle und Full-PNG besitzt und Git keine weiteren
Renderformate führt.

## Bereinigungsmatrix

| Bestand vor Cleanup           |    Größe | Entscheidung                                   |
| ----------------------------- | -------: | ---------------------------------------------- |
| Art-Rohbilder                 |  93,0 MB | behalten; Quelle für reproduzierbare Full-PNGs |
| Full-PNGs                     | 113,3 MB | behalten; einziger Runtime-Consumer            |
| SVG-Zwischenstände            | 124,5 MB | entfernen                                      |
| Preview-PNGs                  |  10,1 MB | entfernen                                      |
| Thumb-PNGs                    |   2,9 MB | entfernen                                      |
| Kontaktbögen und Einzelchecks |  17,9 MB | entfernen                                      |
| Style-Varianten               |  27,1 MB | entfernen; abgeschlossener visueller Prototyp  |
| Generierte Basis-Kartenbilder |  49,2 MB | behalten; aktiver Manifest-/Fallback-Consumer  |

Damit sinkt der versionierte Kartenasset-Bestand von rund 438,1 MB auf rund
255,5 MB. Die Git-Historie wird nicht umgeschrieben; die Reduktion wirkt auf
aktuelle Checkouts und künftige Änderungen.

## Worktrees

Fremde Worktrees werden nicht anhand ihres Namens oder Alters gelöscht. Ein
Worktree darf erst entfernt werden, wenn sein Arbeitsstatus sauber ist und
sein Eigentümer beziehungsweise der zugehörige Prozess nachweislich beendet
ist. Am 2026-07-10 existieren mehrere Worktrees mit uncommittetem oder nicht
normal auflösbarem HEAD sowie ein aktiver paralleler Teststand auf `main`.
Sie bleiben deshalb unangetastet. Nur der diesem Cleanup gehörende Worktree
wird nach erfolgreicher Main-Integration entfernt.
