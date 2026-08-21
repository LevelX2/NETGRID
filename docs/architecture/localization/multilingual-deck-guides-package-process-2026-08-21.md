# Paketprozess: mehrsprachige Deckguides im laufenden Spiel

Stand: 2026-08-21

## Verbindliches Ziel

NETGRID verwaltet Standarddeck-Guides in einem erweiterbaren mehrsprachigen
Format. Englisch ist für jeden gültigen Guide verpflichtend; existiert für die
gewählte Oberflächensprache kein Guide-Inhalt, wird ausdrücklich auf Englisch
zurückgefallen. Der eigene verfügbare Standarddeck-Guide kann während einer
laufenden Partie erneut geöffnet werden, ohne Guide-Informationen des Gegners
oder der gegnerischen KI offenzulegen.

## Produktvertrag

- Jeder gültige Standarddeck-Guide enthält einen vollständigen englischen
  Inhalt.
- Weitere Guide-Sprachen sind optional. Für den ersten Stand werden Deutsch und
  Englisch gepflegt; Französisch nutzt den fachlich gewünschten
  Englisch-Fallback.
- Die Auflösung erfolgt mit der normalisierten Oberflächensprache und danach
  mit Englisch. Fehlt Englisch, ist der Guide ungültig und wird nicht angezeigt.
- Der tatsächlich gerenderte Inhalt trägt das passende HTML-`lang`-Attribut.
- Karten-IDs und Kartentitel werden nicht übersetzt.
- In der laufenden Partie erscheint eine Schaltfläche mit Buchsymbol nur dann,
  wenn für das eigene Deck ein gültiger Guide verfügbar ist.
- Das Öffnen des Guides pausiert weder Partie noch Timer.
- Ein Guide-Verweis wird nur für direkt verwendete oder zufällig zugewiesene
  kuratierte Standarddecks gesetzt. Eigene, kopierte oder veränderte Decks
  erhalten keinen Standarddeck-Guide durch Namens- oder ID-Heuristiken.
- Die PlayerView transportiert höchstens einen strukturierten Verweis auf den
  eigenen Guide. Der gegnerische Guide-Verweis und vollständige Guide-Inhalte
  sind nicht Bestandteil der Match-Payload.

## Pakete

1. Guide-Schema und Locale-Auflösung: verpflichtendes Englisch, optionale
   Sprachinhalte, deterministischer Englisch-Fallback und Validierungstests.
2. Guide-Daten: alle Standarddeck-Guides erhalten vollständige englische und
   deutsche Inhalte; Kartentitel und IDs bleiben unverändert.
3. Guide-Dialog: localeabhängige Inhaltsauflösung und semantisch korrektes
   `lang`-Attribut.
4. Match-Projektion: eigener Guide-Verweis wird beim Deck-Setup strukturiert
   festgelegt und side-sicher in die jeweilige PlayerView projiziert.
5. Spieloberfläche: Buchschaltfläche in der aktiven Topbar, Wiederverwendung
   des vorhandenen Guide-Dialogs, lokalisierte Beschriftungen und fokussierte
   Regressionstests.

## Abnahme

- Ein deutscher Client sieht deutsche Guide-Inhalte.
- Ein englischer Client sieht englische Guide-Inhalte.
- Ein französischer oder künftig nicht übersetzter Client sieht englische
  Guide-Inhalte mit `lang="en"`.
- Ein Guide ohne Englisch wird durch die Datenvalidierung abgelehnt.
- Zwei Spieler können unabhängig voneinander unterschiedliche UI-Sprachen
  verwenden; Guide-Sprache und UI-Sprache bleiben rein clientseitig.
- Jeder Spieler kann ausschließlich den Guide seines eigenen qualifizierten
  Standarddecks öffnen.
- Zufällig zugewiesene Standarddecks behalten ihren strukturierten
  Guide-Verweis; eigene Decks und Standarddeck-Kopien erhalten keinen.
- Reconnect und normale PlayerView-Aktualisierungen bewahren den eigenen
  Verweis, ohne den gegnerischen Verweis oder Guide-Inhalte zu übertragen.
- Fokussierte Paket-, Server- und Webtests sowie `git diff --check` bestehen.

## Nicht-Ziele

- Keine Übersetzung von Kartentiteln oder technischen IDs.
- Keine französische Vollübersetzung der Deckguides in diesem Paketprozess.
- Keine Pausefunktion für den Guide-Dialog.
- Keine Anzeige oder Übertragung gegnerischer Deckstrategien.
- Keine heuristische Zuordnung eigener Decks zu Standarddecks.
