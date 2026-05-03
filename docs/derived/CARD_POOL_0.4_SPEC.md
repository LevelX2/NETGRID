# Card Pool 0.4 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Prinzipien

- Nur interne fiktive Demo-Karten.
- Kein offizieller Kartentext als Regelquelle.
- Keine offiziellen Assets.
- Jede Karte hat eine stabile ID, Manifest-Eintrag, Engine-Resolver und Testspur.
- Legacy-Decks `demo_runner_001` und `demo_corp_001` bleiben unverändert nutzbar.

## Neue Decks

- `demo_runner_004`: Runner Demo Deck 04 - Setup & Pressure.
- `demo_corp_004`: Corp Demo Deck 04 - Build, Tax & Tag.

V0.4-Decks verwenden `agendaPointsToWin = 7`. Legacy-Decks bleiben bei 6.

## Neue Karten

Die neuen Karten sind in `data/cards/demo-cards-0.4.json` beschrieben und im Code als interne Definitionen verfügbar. Ihr Text ist Dokumentation, nicht Parser-Input; die Engine nutzt explizite Mechanik-IDs.

## Nicht in Scope

- Damage.
- Resources.
- Traces.
- Viren.
- Hosting.
- Multiaccess.
- Freier Deckbuilder.
