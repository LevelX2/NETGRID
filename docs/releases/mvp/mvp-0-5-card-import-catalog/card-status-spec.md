# Card Status 0.5 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Statusmodell

V0.5 verwendet getrennte Statusfelder. Statuswerte sind keine lineare Fortschrittsleiste, sondern getrennte Gates.

| Status | Bedeutung | Wer darf ihn setzen? |
|---|---|---|
| `imported` | Karte ist im lokalen Snapshot enthalten. | Importpipeline |
| `validated` | Karte erfüllt das lokale Katalogschema. | Importvalidierung |
| `catalog_ready` | Karte darf im Katalog erscheinen. | Importvalidierung |
| `implemented` | Engine/Manifest kennen eine passende Karte. | Manifest-Abgleich |
| `playable` | Resolver, Unit-/Szenariotests, Visibility, Replay/StateHash und KI-Smoke sind erfüllt. | Implementierungsmanifest und Tests |
| `deck_legal` | Karte ist für ein konkretes lokales Format freigegeben. | Statusmanifest oder später V0.6-Formatprofil |
| `blocked` | Karte ist bewusst gesperrt. | Statusmanifest, Importvalidierung oder Review |

## Invarianten

- `catalog_ready` setzt `validated` voraus.
- `playable` setzt `implemented` voraus.
- `deck_legal` setzt `playable` voraus.
- `blocked` verhindert `deck_legal`.
- `imported` allein hat keine Auswirkung auf Engine, KI, Deckvalidierung oder Matchstart.
- Karten mit `engineCardId: null` dürfen nicht in `DEMO_CARDS_BY_ID` oder Engine-Decks auftauchen.

## Manifest-Abgleich

Der Abgleich liest:

- Katalog-Snapshot,
- `data/manifests/card-implementation-manifest.json`,
- `data/manifests/card-implementation-manifest-0.4.json`,
- V0.5-Statusmanifest.

Eine Karte gilt nur als `implemented`, wenn sie eine Manifestreferenz und eine Engine-Karten-ID besitzt.

Eine Karte gilt nur als `playable`, wenn das Manifest Unit-, Szenario-, Visibility-, Replay- und KI-Smoke-Abdeckung für die jeweilige Spielbarkeit dokumentiert oder die bestehende ältere Manifestabdeckung projektkonform weitergeführt wird.

## Decklegalität

V0.5 bereitet `deck_legal` nur für den lokalen Demo-Kontext vor. V0.6 wird daraus Formatprofile und Deckvalidierung v2 ableiten.

Regel:

`deck_legal` darf niemals durch Import gesetzt werden, wenn `playable` fehlt.

## Blocked

Ein Blockgrund ist Pflicht, wenn `blocked: true`.

Beispiele:

- Typ im Engine-Scope nicht unterstützt,
- Mechanik explizit deferred,
- Quelle oder Nutzung unklar,
- Statuskonflikt mit Manifest.
