# V1.0.6K Card Release Requirements

Stand: 2026-05-06
Status: done

## Zweck

V1.0.6K ist ein kleines Kartenfreigabe-Release nach V1.0.6. Es aktiviert 20 weitere lokal geprüfte O:NR-v1-Karten, deren Texte und Bilder im lokalen privaten Katalog bereinigt sind und deren Mechaniken bereits durch die Engine abgebildet werden.

V1.0.6K erweitert keine neue große Mechanikfamilie. Die vorherige V1.0.5K-Freigabe mit 12 Karten bleibt aktiv; V1.0.6K fügt 20 Karten hinzu.

## Freigaberegel

Eine Karte wird für V1.0.6K nur `implemented`, `playable` und `deck_legal`, wenn:

- der lokale Text bestätigt und sauber normalisiert ist,
- die Karte eine konkrete Engine-Definition besitzt,
- der benötigte Resolver bereits vorhanden ist,
- Deckvalidierung und Matchstart die Karte akzeptieren,
- Tests für Katalog-Gate, Deckvalidierung, Engine-Verhalten, Visibility und Multiplayer-Smoke vorhanden sind,
- keine privaten lokalen Bild- oder Textartefakte versioniert werden.

## Finale V1.0.6K-Karten

| Karte | Seite | Typ | Mechanik |
|---|---|---|---|
| Bodyweight™ Synthetic Blood | Runner | Prep/Event | 5 Karten ziehen |
| Jack 'n' Joe | Runner | Prep/Event | 3 Karten ziehen |
| Livewire's Contacts | Runner | Prep/Event | Runner-Economy |
| Score! | Runner | Prep/Event | Runner-Economy |
| Wild Card | Runner | Program/Icebreaker/Killer | Sentry brechen, pumpen |
| WuTech Mem Chip | Runner | Hardware/Chip | +1 MU |
| Tycho Extension | Corp | Agenda/Asset | normale Agenda ohne Zusatztext |
| Accounts Receivable | Corp | Operation | Corp-Economy |
| Annual Reviews | Corp | Operation | 3 Karten ziehen |
| Closed Accounts | Corp | Operation | getaggter Runner verliert alle Bits |
| Datapool® by Zetatech | Corp | Operation | getaggtem Runner 2 Tags geben |
| Day Shift | Corp | Operation | 2 Karten ziehen und 1 Bit |
| Efficiency Experts | Corp | Operation | Corp-Economy |
| Punitive Counterstrike | Corp | Operation | getaggter Runner, 2 Meat Damage |
| Scorched Earth | Corp | Operation | getaggter Runner, 4 Meat Damage |
| Urban Renewal | Corp | Operation | getaggter Runner, 5 Meat Damage |
| Filter | Corp | ICE/Code Gate | End the run |
| Fire Wall | Corp | ICE/Wall | End the run |
| Keeper | Corp | ICE/Code Gate | End the run |
| Mazer | Corp | ICE/Code Gate | End the run |

## Bewusst nicht aufgenommen

Karten wie Black Dahlia, Codecracker, Cyfermaster™, Loony Goon, Shaka, Wizard's Book, Hostile-Takeover-Korrekturvarianten, Netwatch Credit Voucher und Night Shift bleiben trotz vorhandener Mechaniknähe zurückgestellt, solange Engine-Werte oder Effekte noch vom zuletzt bestätigten sauberen Text abweichen.

## Gate

V1.0.6K ist fertig, wenn:

- `ONR_V1_0_6K_RELEASE_CARD_IDS` genau 20 Karten enthält,
- der Runtime-Katalog zusammen mit V1.0.5K 32 lokale O:NR-Releasekarten freigibt,
- `data/manifests/card-implementation-manifest-1.0.6k.json` und `data/scenarios/v106k-card-release-smoke.json` existieren,
- Pakettests für Catalog, Decks, Engine und Server bestehen.
