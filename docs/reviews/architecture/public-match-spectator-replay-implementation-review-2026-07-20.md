# Implementation Review: öffentliche Matches, Zuschauer und Analyse-Replay

Stand: 2026-07-20
Ergebnis: bestanden

## Geprüfter Umfang

- Ein einziger persistierter Matchvertrag `isPublic: boolean` mit Standard
  `true`.
- Einmalige SQLite-Normalisierung aller vorhandenen Matches auf öffentlich.
- Öffentliche Liste für offene, aktive und beendete Matches.
- Schreibgeschützte Live-Zuschaueransicht ohne Hände, verdeckte
  Kartenidentitäten, private Choices oder LegalActions.
- Full-Information-Replay erst nach Matchende, mit StateHash-verifizierten
  Frames, Teilnehmer-A/B-Zuordnung und beiden Händen.
- Visueller Replay-Player mit A/B-Perspektive, Seek, Playback und dauerhaft
  zuschaltbarer Gegnerhand.
- Direkte Replay-Einstiege aus Ergebnisdialog und Matchhistorie.

## Architektururteil

Die Umsetzung verwendet keine zweite Veröffentlichungsregel. `isPublic`
steuert Ausschreibung, Live-Zuschauerzugriff und öffentlichen Replayzugriff.
Der Wert wird beim Erstellen festgelegt; Recreate und Serienfolgespiele
übernehmen ihn.

Der Live- und der Replaypfad sind absichtlich getrennt:

- `public_live_v1` projiziert nur allgemein sichtbaren Zustand und kann keine
  Aktion einreichen.
- Replay-Analyseframes werden ausschließlich für terminale Matches erzeugt.
  Öffentliche terminale Matches sind anonym abrufbar; private terminale
  Matches nur durch einen Matchteilnehmer.

Die öffentliche Übersicht liest aus SQLite ausschließlich kompakte
Matchdokumente. Einzelne Zuschauer- und Replayaufrufe laden erst danach das
konkrete Match. Damit wird die häufige Listenabfrage nicht durch die gesamte
Snapshot- und Eventhistorie jedes gespeicherten Matches belastet.

## Bestandsprüfung

Eine temporäre Kopie der vorhandenen SQLite-Datenbank wurde migriert und
geprüft:

- 21 Matches insgesamt,
- 21/21 nach der Normalisierung öffentlich,
- 19 terminale Matches,
- 19/19 terminale Matches über persistierte, StateHash-verifizierte Frames
  replayfähig,
- 4.218 erzeugte Replayframes.

Drei historische Matches lassen sich zusätzlich vollständig mit der
aktuellen Engine neu simulieren. Für die übrigen historischen Matches ist
keine Legacy-Regelkompatibilität nötig, weil das Lern-Replay die persistierten
und verifizierten Zustände nutzt. Die temporäre Datenbankkopie wurde danach
entfernt.

## Sicherheitsprüfung

- Private Matches fehlen in allen öffentlichen Listen.
- Aktive Matches liefern über den Replay-Requestpfad `404` und keine
  Full-Information-Frames.
- Der Live-Zuschauerpayload enthält keine Hände, privaten Karten, Choices,
  LegalActions oder Zugangstoken.
- Ein anonym angefordertes privates Replay sowie ein Aufruf mit falschem
  Teilnehmertoken liefern `404`.
- Zuschauer- und Replayoberfläche besitzen keinen mutierenden Matchpfad.

## Verifikation

- `corepack pnpm typecheck`: grün.
- `corepack pnpm test:contracts`: 20 Tests grün.
- Gezielte Serverregressionen für Default, Backfill, öffentliche Liste,
  Live-Redaktion und Replayzugriff: 7/7 grün.
- `@netgrid/web test`: 59 Dateien, 674 Tests grün.
- `corepack pnpm build`: grün, einschließlich Next-Produktionsbuild.
- `corepack pnpm format:changed`: grün.
- `git diff --check`: grün.
- Browser-Smoke: 9-Schritt-Replay, A/B-Wechsel ohne Schrittverlust,
  Gegnerhand bleibt bei Seek und 2x-Playback offen und wechselt mit der
  Perspektive; keine Browserfehler oder -warnungen.

Der breite Serverlauf enthält weiterhin genau einen fachfremden vorhandenen
Fehler in `advances Corp AI in a root-rez window even when activeSide is
runner`: Der Test erwartet keine Runner-LegalActions, die Engine liefert im
Jack-out-Fenster `jack_out` und `continue_run`. 196 weitere Servertests sind
grün; die Replayumsetzung verändert diese Regelspur nicht.
