# Match CE2B Runner-Suche und Economy: Final Review

Datum: 2026-07-11

Quellmatch: `match_ce2b72a6bf4d4e80`

Status: umgesetzt und verifiziert

## Ergebnis

Die Ergänzung schließt drei nach der ersten Matchkorrektur verbliebene Lücken:

1. Breaker-Suche unterscheidet jetzt Mindestabdeckung und Deckarchitektur. Das
   konkrete Krash-Deck besitzt trotz mehrerer Krash-Kopien nur einen
   hochsicher erkannten universellen Breaker-Typ. Nach dessen Installation
   entstehen weder ein primäres Breaker-Ziel noch eine optionale
   Spezialistensuche.
2. Echte Multi-Breaker-Decks bleiben differenziert. Ein vom Universalbreaker
   verschiedener, hochsicher erkannter Spezialist kann als niedrig priorisierte
   Weiterentwicklung bestehen. Dasselbe gilt umgekehrt für einen späteren
   Universalbreaker nach einer bereits funktionierenden Spezialistensuite.
   Supportprogramme mit bloßem `special`-Fallback und Duplikate derselben
   Definition öffnen keine solche Suche.
3. Der matchnahe Streetware-Zustand ist mit fortgeschriebenem
   `runner.search.breaker`-Intent abgesichert: Streetware Distributor besitzt
   weiterhin einen höheren Keep-Score als eine von zwei redundanten
   Krash-Kopien bei bereits installiertem Krash.

Zusätzlich beschreibt die Chronik die aktuelle Short-Circuit-Aktivierung als
Stack-Suche nach einem Programm. Beim öffentlichen Ergebnis verbindet sie
Suchquelle und gefundene Karte. Private Stack-Suchen bleiben vollständig
redigiert.

## Prioritätsvertrag

- Erfüllte Mindestabdeckung gibt erreichbare Runs frei.
- Optionale Breaker-Entwicklung hat Priorität 620 und blockiert keinen
  bezahlbaren Run als harte Voraussetzung.
- Primärer Breaker-Bedarf bleibt nur aktiv, solange Wall-, Code-Gate- oder
  Sentry-Abdeckung tatsächlich nicht installiert ist.
- Ein optionaler Suchbonus gilt nur, wenn ein eigenständiger hochsicherer
  Breaker noch im Deck, nicht bereits auf der Hand und aktuell suchbar ist.

## Regressionen

- Universeller Einzelbreaker mit mehreren Kopien und Low-Confidence-Support.
- Hybrid aus installiertem Universalbreaker und suchbarem Wall-Spezialisten.
- Spezialist bereits in der Hand: Entwicklung bleibt sichtbar, erneute Suche
  wird nicht belohnt.
- Installierte Spezialistensuite mit später suchbarem Universal-Upgrade.
- Reales Krash-/Short-Circuit-Deckprofil mit installiertem Krash.
- Persistierter Breaker-Such-Intent beim Streetware-/Doppel-Krash-Discard.
- Aktuelle `activated_card_ability`-Payload von Short Circuit sowie öffentliche
  und private Stack-Suchergebnisse.

## Verifikation

- Vollständige `@netgrid/ai`-Suite: 285 Testdateien, 1.867 Tests grün.
- `@netgrid/ai` Typecheck: grün.
- `@netgrid/web` Typecheck: grün.
- Chronik-, Gruppierungs-, Interaktions- und Action-Cue-Suite: 193 Tests grün.
- `git diff --check`: grün.

## Vertragsgrenzen

- Keine Änderung an Engine-Regeln, LegalActions, PlayerView, Replay,
  StateHash, Randomness oder Kartenimplementierungen.
- Keine Nutzung verdeckter Corp-Daten. Die Breaker-Klassifikation verwendet
  ausschließlich eigene Deck-, Grip- und Rig-Metadaten.
- Keine kartennamensgebundene Runtime-Sonderregel. Die Klassifikation arbeitet
  mit strukturierter Coverage, Confidence, Definition und Location.
- Kein Decktausch, kein Push und kein Pull Request.

## Führende Artefakte

- `docs/architecture/ai/match-ce2b-runner-search-economy-process-2026-07-11.md`
- `docs/reviews/ai/match-ce2b-runner-search-economy-final-review-2026-07-11.md`
