# Standarddeck-Anleitungen – Analyse-Review

Status: vollständig  
Stand: 2026-08-02

## Ergebnis

Der aktive Katalog umfasst 43 Standarddecks: 22 Korp- und 21 Runner-Decks.
Für jedes Deck liegt genau eine deutsche Anleitung in
`data/decks/standard-deck-guides-1.0.0.json` vor. Die Texte wurden aus der
deterministischen DeckDoctrine-Ableitung, den Strategy-Evidences und der
tatsächlichen Kartenzusammensetzung abgeleitet und anschließend auf
Plausibilität, verständliche Sprache und gültige Schlüsselkarten geprüft.

## Inhaltsvertrag

Jede Anleitung enthält:

- eine Kurzbeschreibung und die zentrale Deckidee;
- einen Spielplan für Eröffnung, Mittelspiel und Endphase;
- bis zu fünf analysegestützte Schlüsselkarten mit ihrer strategischen Rolle;
- zwei praktische Hinweise;
- zwei erkennbare Schwächen oder typische Fehlsteuerungen.

Falls die Analyse keine stabilen einzelnen Anker erkennt, wird dies ausdrücklich
begründet. Ein fehlender Schlüsselkartenabschnitt bleibt nie unkommentiert.

## Analysebefund

- 41 Decks besitzen eine plausible Primärstrategie und mindestens einen
  konkreten Strategieanker.
- `Vom Tablet` besitzt die Primärlinien Remote Scoring und Rush Scoring, aber
  derzeit keine einzelnen stabilen Anchor-Evidences. Die Anleitung beschreibt
  deshalb die Gesamtkomposition und markiert das Deck mit `observe`.
- `Ghost Circuit` besitzt weiterhin weder eine produktive Primär- noch
  Sekundärstrategie und keine stabilen Anchor-Evidences. Die Anleitung nennt
  diese Unsicherheit offen, empfiehlt flexible Linienwahl und markiert das Deck
  mit `observe`.
- Der aktuelle Vollbestand liefert keine ausreichende Evidence, um ein Deck
  allein aus der Kompositionsanalyse belastbar als `weak_candidate`
  einzustufen. Eine solche Bewertung erfordert zusätzliche Playtest- oder
  Matchup-Evidence und darf nicht aus niedriger Strategy-Konfidenz erfunden
  werden.

## Wartungsvertrag

`corepack pnpm analyze:standard-deck-guides` gibt die aktuelle read-only
Bestandsanalyse mit Primär-/Sekundärstrategien, Evidences, Kandidaten und
Warnungen aus. `corepack pnpm check:standard-deck-guides` vergleicht den
versionierten Guidebestand mit Katalog, Deckhash, Analysehash,
Strategielisten und Schlüsselkartentiteln.

Der Pflegecheck darf fehlschlagen, wenn ein Guide fehlt oder veraltet ist. Er
ist absichtlich nicht Teil von `build` oder Serverstart. Die Anwendung und das
betroffene Standarddeck bleiben in diesen Zuständen lauffähig.

## Verifikation

- Exakt 43 Guides für 43 aktive Standards.
- Keine verwaisten Guides.
- Alle Schlüsselkarten liegen im jeweiligen Deck und ihre Titel entsprechen
  dem aktuellen Kartenkatalog.
- Alle gespeicherten Deck- und Analysehashes entsprechen dem aktuellen Stand.
- Ergebnis `corepack pnpm check:standard-deck-guides`: grün, 43/43.

## Follow-ups

- `Ghost Circuit` und `Vom Tablet` bleiben Beobachtungsfälle für spätere
  Playtests oder eigenständige Deck-/KI-Analysepakete.
- Dieser Guide-Prozess verändert weder Decklisten noch KI-Verhalten.
