# Match e653f50a: Corp-KI-Remediation – Abschlussreview

Stand: 2026-07-19

## Ergebnis

Das zuletzt abgeschlossene KI-Spiel `match_e653f50ac25eed22` wurde mit
128/128 vorhandenen KI-Entscheidungstraces vollständig geprüft. Die vier
bestätigten Fehlerklassen sind generisch behoben und durch sechs
spielgleiche Decision-Checkpoints einschließlich zweier positiver
Gegenproben geschützt.

Die Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness- und
Hidden-Info-Verträge wurden nicht verändert.

## Bestätigte Ursachen und Korrekturen

- `Team Restructuring` projizierte bisher zwei Advancement-Counter auf ein
  einzelnes Ziel. Der aktive Hint beschreibt nun den tatsächlichen Ertrag
  von höchstens einem Counter pro Ziel. Dadurch behauptet der
  Score-Conversion-Plan für Tycho Extension keinen unmöglichen
  Same-Turn-Abschluss mehr.
- Die absolute Same-Turn-Planbindung gibt eine riskante
  Agenda-Installation an eine positive Alternative frei, wenn die
  Installation selbst eine negative game-ending oder verzögert unsichere
  Scoreline trägt. Bereits installierte Agenden dürfen dagegen weiterhin
  korrekt weiter advanced werden.
- Die HQ-Retain-Choice von `Synchronized Attack` wählt Karten nach dem
  bestehenden Handwert und hält eine feste Fünf-Credit-Reserve, statt
  generisch die maximal mögliche Kartenanzahl zu bezahlen.
- Leere Scoring-Remote-Projekte bleiben zulässige Hintergrundentwicklung,
  erhalten aber einen Opportunity Cost, solange R&D noch keine
  Grundabsicherung besitzt oder das leere Remote bereits mehr ICE als R&D
  trägt. Kritischer unmittelbarer Scoring-Remote-Schutz bleibt davon
  ausgenommen. ICE auf Archives ohne sichtbaren Bedarf erhält ebenfalls
  einen Opportunity Cost.

Damit gilt die mit dem Nutzer bestätigte Priorität: Ein für die Deckstrategie
notwendiges Remote darf früh vorbereitet und langfristig weitergeführt
werden, läuft ohne konkreten unmittelbaren Scorepfad aber nur als
Low-Priority-Hintergrundplan; R&D-Schutz und konkrete kritische
Scoreline-Sicherheit gehen vor.

## Spielgleiche Verträge

- D124: falsche Tycho-Same-Turn-Konversion wird verworfen.
- D7: Synchronized Attack behält wertvolle Karten ohne blinde
  Maximalzahlung.
- D54: ICE wird nicht auf Archives ohne Bedarf gelegt.
- positive Gegenprobe: die reale Hostile-Takeover-Same-Turn-Konversion bleibt
  erhalten.
- Match `match_74e236955b3208a1`, D4: R&D-Schutz oder Economy geht einem
  neuen leeren Hintergrund-Remote vor.
- Match `match_74e236955b3208a1`, D43: zentrale Absicherung geht einer
  dritten ICE-Schicht auf dem leeren Remote vor.

Alle Zielcheckpoints waren vor der Produktionsänderung ausschließlich als
`behavior_regression` rot. Die positive Same-Turn-Gegenprobe war bereits
grün und blieb grün.

## Deck- und Hint-Audit

Der im Checkpoint gesicherte Corp-Decksnapshot enthält 55 Karten und 26
eindeutige Karten. Jede Deckkarte besitzt eine aktive, side-korrekte
Hint-Zeile und eine Runtime-Definition. Capability- und Strategy-Ableitung
melden keine fehlenden Fähigkeiten und keine Warnungen.

Primärstrategien bleiben:

1. `corp.ice_tax_glacier`
2. `corp.fast_advance`
3. `corp.remote_scoring`

Die beiden Advancement-Effekte von Team Restructuring liefern im Audit
jeweils den korrekten Einzelzielwert `1`.

## Verifikation

- sechs spielgleiche Match-Checkpoints grün;
- 203 angrenzende Runtime-, Board-Triage-, Scoring-Window- und
  Tactical-Plan-Tests grün;
- vollständige `@netgrid/ai`-Suite nach dem Abgleich mit dem aktuellen
  `main`: 413 Testdateien, 2.832 Tests grün;
- `@netgrid/ai`-Typecheck grün;
- `check:ai` mit Hint-Metadaten- und Source-Structure-Gate grün;
- DeckDoctrine-/Strategy-Aggregationscheck grün;
- konkreter Match-Decksnapshot-Audit ohne Blocker oder Warnung;
- `format:changed` und `git diff --check` grün.
