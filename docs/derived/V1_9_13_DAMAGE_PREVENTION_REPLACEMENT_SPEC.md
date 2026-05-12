# V1.9.13 Damage/Prevention/Replacement Spec

Stand: 2026-05-13
Status: draft-implementing

## Engine-Vertrag

- Damage-Erzeugung bleibt ein Rules-Engine-Ereignis mit deterministischen Payloads.
- Prevention-/Avoid-/Replacement-Fenster werden aus bestehenden Event-Modification- und Replacement-Strukturen abgeleitet.
- Jede optionale Runner-Entscheidung braucht eine explizite Pass-/Accept-Option.
- Kosten, Counter-Verbrauch und Kartentrash werden vor Aufloesung und in `applyAction` erneut validiert.
- Flatline-Pruefung laeuft erst nach vollstaendig aufgeloesten Damage-/Prevention-Schritten.

## Sichtbarkeit

- PublicEvents duerfen nur Damage-Art, Anzahl, sichtbare Quelle und oeffentlich bekannte Ergebnisse enthalten.
- Random-Trash aus verdeckten Zonen bleibt fuer den Gegner redigiert, solange keine regelkonforme Offenlegung vorliegt.
- Hidden-Zone-Auswahloptionen sind nur fuer die berechtigte Seite sichtbar.

## Determinismus

- Random-Trash nutzt Seed, RandomCounter und RandomDrawRecords.
- Replay rekonstruiert dieselben Prevention-/Avoid-Entscheidungen und denselben StateHash.
- Stale Actions, falsche Choices, falsche Seite und unpassende Kosten brechen kontrolliert ab.

## Katalog- und AI-Vertrag

- Kartentext ist display-only und keine Regelautoritaet.
- `human_playable`, `deck_legal` und `ai_supported` werden erst nach Engine-, Daten-, KI- und Testgate gesetzt.
- AI-Entscheidungen duerfen nur aus PlayerView, LegalActions, side-sicheren Choices und versionierten AI-Hints entstehen.
