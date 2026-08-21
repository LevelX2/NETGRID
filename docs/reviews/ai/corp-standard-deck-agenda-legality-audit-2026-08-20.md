# Agenda-Legalitätsaudit der Corp-Standarddecks

Stand: 2026-08-20

## Maßstab

Geprüft wurden alle 24 aktiven Corp-Decks aus dem Standarddeck-Katalog gegen
[Regel 1.4.6](https://rules.nullsignal.games/?r=rule_agenda_points):

- 40–44 Karten: 18 oder 19 Agenda-Punkte
- 45–49 Karten: 20 oder 21 Agenda-Punkte
- 50–54 Karten: 22 oder 23 Agenda-Punkte
- mehr als 54 Karten: 22 oder 23 Punkte plus zwei Punkte je volle fünf Karten
  über 50

Kartenzahl und Agenda-Punkte wurden aus dem aktiven Katalog und den lokalen
Runtime-Kartendefinitionen berechnet. Kopien zählen mit ihrem jeweiligen
Agenda-Punktwert.

## Ergebnis

Alle 24 aktiven Corp-Standarddecks erfüllen jetzt die offizielle
Agenda-Punktspanne. `Dead Channel` war bereits separat korrigiert; die übrigen
20 zuvor offenen Listen wurden auf Version 1.1.0 angehoben und bei unveränderter
Deckgröße strategisch neu zugeschnitten. Der Katalogtest berechnet für jedes
aktive Corp-Deck die offizielle Spanne und verhindert eine erneute stille
Abweichung.

| Deck | Karten | Punkte | Zulässig |
| --- | ---: | ---: | ---: |
| Cheap Bag of Tricks | 58 | 24 | 24–25 |
| Chrome Rush Bureau | 64 | 26 | 26–27 |
| Classic Corp – Remote Lab Deflection | 45 | 20 | 20–21 |
| Classic Corp – Superserum Control Grid | 45 | 20 | 20–21 |
| CODE ROT: Bitte eintreten v2 | 45 | 20 | 20–21 |
| Fast Advance, Baby | 45 | 20 | 20–21 |
| Ivory Bastion | 52 | 22 | 22–23 |
| Manhunt Pressure Bureau | 45 | 21 | 20–21 |
| Mumie | 45 | 20 | 20–21 |
| Neon Guillotine | 45 | 20 | 20–21 |
| Neon Escrow | 45 | 20 | 20–21 |
| Original Speed v1.0 | 55 | 25 | 24–25 |
| Proteus Korp – Hidden Node & Region Trap | 45 | 21 | 20–21 |
| Proteus Korp – Variable ICE Gauntlet | 45 | 20 | 20–21 |
| Rent to Own War Engine | 47 | 21 | 20–21 |
| Shadoe Tag & Bag | 48 | 20 | 20–21 |
| Salazar Toll Road | 45 | 20 | 20–21 |
| Siren Fortress | 45 | 21 | 20–21 |
| Syds ICE-Pfandhaus | 45 | 20 | 20–21 |
| The Korp Master | 45 | 20 | 20–21 |
| Tycho Ice Stack | 45 | 20 | 20–21 |
| Vom Tablet | 45 | 20 | 20–21 |
| Universal Fast Advance | 45 | 20 | 20–21 |
| Dead Channel v1.1 | 45 | 21 | 20–21 |

## Strategischer Zuschnitt

Die Umbauten ersetzen nicht einfach Nicht-Agenda-Karten durch beliebige
Agenden. Die neuen Agenda-Pakete erhalten oder verstärken den jeweiligen
Spielplan:

- Rush, Fast Advance und Score-Conversion erhalten kleine Agenden und
  Tempo-Auszahlungen wie `Project Venice`, `Project Zurich`, `Corporate Coup`
  und `Security Net Optimization`.
- Tag-/Trace-/Flatline-Listen erhalten mit `Bioweapons Engineering`,
  `Netwatch Operations Office`, `On-Call` und `Marked Accounts` Agenden, die
  Druck, Schaden oder ökonomische Bestrafung weitertragen.
- ICE-, Glacier- und Remote-Listen erhalten mit `Tycho Extension`,
  `Data Fort Reclamation`, `Political Coup` oder `Olivia Salazar` passende
  Defense-, Fort- und Rez-Auszahlungen.
- Überladene Listen wurden nicht nur auf das Maximum gekürzt: `Rent to Own`
  behält seinen War-/Downsizing-Kern und tauscht einen Tycho-Punkt gegen
  `On-Call`; `Siren Fortress` konzentriert sich stärker auf Olivia; `The Korp
  Master` entfernt drei fremde Agenda-Module und investiert die freien Slots
  in `Scorched Earth` und `City Surveillance` für die eigentliche Kill-Linie.
- Die extrem unterpunkteten Listen `Chrome Rush Bureau`, `Manhunt Pressure
  Bureau`, `Neon Escrow`, `Syds ICE-Pfandhaus` und `Tycho Ice Stack` wurden als
  vollständige Agenda-Module neu balanciert, statt einzelne Slots wahllos zu
  füllen.

Die zugehörigen Standarddeck-Guides wurden auf die neuen Deck- und
Analyse-Hashes aktualisiert. Alle 48 Guides sind aktuell.

## Verifikation und Spielbild

- Deckpaket: 25/25 Tests bestanden.
- Guide- und Analyseabgleich: 48/48 Guides aktuell.
- Zielmatrix: 20 geänderte Corp-Decks gegen drei unterschiedliche
  Runner-Archetypen, zwei deterministische Seeds, insgesamt 120 Partien.
- Alle zunächst gefundenen sieben technischen Abbruchzustände wurden
  ursächlich behoben und über ihre exakten Seeds erneut bis zum regulären Ende
  gespielt. Dazu gehören planseitige Fortsetzungen für Vapor Ops,
  Trace-Base-Link, Dr. Dreff, Encryption Breakthrough und Ice Transmutation
  sowie die exakte Bewertung der temporären Executive-Boot-Camp-Run-Credits.
- Alle geprüften Pfade sind deterministisch replaybar; die frische zweite
  60er-Matrix endet mit 60/60 regulären Partien und 60/60 erfolgreichen
  Replays.
- Ergebnis der zweiten Matrix: Corp 12 Siege, Runner 48 Siege. Zwei Corp-Siege
  waren Flatlines (`Mumie` und `Neon Guillotine`). Das ist kein balancierter
  Turnier-Benchmark, bestätigt aber unter den drei gewählten Runner-Archetypen
  deutlich die beobachtete Runner-Überlegenheit und zeigt zugleich, dass die
  spezialisierten Kill-Linien tatsächlich konvertieren können.
- Der vollständige AI-Shard-Lauf besteht nach Korrektur des veralteten
  Deckzählers rechnerisch 4.479 von 4.489 Tests. Die verbleibenden
  zehn Fehler in sechs älteren Decision-Checkpoint-Dateien wurden mit
  identischem Befehl auf dem unveränderten lokalen `main` reproduziert; dort
  schlagen dieselben zehn sowie ein weiterer Runner-Checkpoint fehl. Ein
  zusätzlicher veralteter Erwartungswert von 47 statt 48 aktiven Decks wurde
  im Branch korrigiert und besteht 4/4 fokussierte Tests. Die zehn bekannten
  Baseline-Fehler wurden nicht als Teil der Agenda-Legalisierung umgedeutet.
- Der AI-Paket-Typecheck meldet zwölf bereits vorhandene Typfehler. Der
  Parallelvergleich auf dem unveränderten lokalen `main` liefert dieselben
  zwölf Fehler; durch diese Änderung ist kein zusätzlicher Typfehler
  hinzugekommen.

## Verbleibende Grenze

Der allgemeine Formatprofil-Validator bildet die offizielle Regel-1.4.6-Spanne
noch nicht als universellen Vertrag für beliebige Legacy- und interne
Testdecks ab. Für den aktiven Standarddeck-Katalog ist die exakte Regel jetzt
hart getestet. Eine spätere allgemeine Umstellung muss die betroffenen
Legacy-Fixtures bewusst migrieren und darf die schwächeren Dichtewerte nicht
als gleichwertige Ersatzregel behandeln.
