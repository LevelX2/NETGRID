# MU-Checkpoint nach Memory-Verlust: Final Review

Datum: 2026-07-19

Ergebnis: fachlich abgeschlossen

## Ergebnis

Wenn der Runner durch einen aufgelösten Effekt nachträglich über sein
Memory-Limit gerät, hält die Engine den Ablauf jetzt am nächsten Checkpoint an
und öffnet eine verpflichtende, nur für den Runner sichtbare Programmauswahl.
Der Runner muss eine ausreichende einschlussminimale Menge installierter
Programme trashen. Erst danach wird der unterbrochene Ablauf fortgesetzt.

Damit lässt sich der gemeldete Ablauf mit `Corprunner's Shattered Remains` und
`WuTech Mem Chip` regelkonform fortsetzen: Der Access wird nicht mehr von der
globalen Memory-Invariante abgelehnt. Zugleich entfällt nach dem letzten Rez im
Root das zusätzliche, inhaltlich leere „Nichts rezzen“.

## Engine-Vertrag

- Der Checkpoint wird zentral nach PlayerActions geprüft und erzeugt eine
  Runner-private `select_cards`-Choice mit StateVersion-Bindung.
- Der Resolver revalidiert Seite, Choice, StateVersion, installierte Programme,
  MU-Werte, ausreichende Freigabe und Einschlussminimalität.
- Der sonst illegale Über-MU-Zustand ist nur erlaubt, solange exakt diese
  gültige Checkpoint-Choice offen ist.
- Falsche Seite, stale Choice, unbekannte oder doppelte Ziele, ungenügende
  Freigabe und nicht minimale Auswahl werden abgelehnt.
- PublicEvents enthalten nur Mengen und MU-Werte; die Corp-PlayerView sieht
  weder Choice noch Zielidentitäten.
- Replay und StateHash bleiben deterministisch.

## Rez-Fenster und KI

- Nach einem Root-Rez wird geprüft, ob noch eine echte Corp-Rez-/Runfenster-
  Aktion existiert. Ohne solche Aktion schließt das Bewegungsfenster sofort.
- Sind weitere Root-Karten legal rezzbar, bleibt das Fenster offen und mehrere
  Rez-Aktionen sind weiterhin möglich.
- Die Runner-KI erkennt die neue Choice vor dem generischen Kartenfallback.
  Sie ermittelt deterministisch eine ausreichende einschlussminimale
  Programmkombination anhand der bestehenden Programmsacrifice-Bewertung.
- Die Auswahl bleibt zwingend auflösbar, wenn ausschließlich als kritisch
  bewertete Programme verfügbar sind; sie trasht nicht pauschal alle Optionen.

## Livefall-Prüfung

Der gespeicherte Matchzustand `match_c34a3b1bd4f5e697` wurde read-only mit dem
neuen Engine-Code ausgeführt. Der Zugriff wechselt von StateVersion 317 auf
318 und öffnet bei 5 verwendeten von 4 erlaubten MU die private Choice
`runner.checkpoint_memory_cleanup:1:318` mit vier legalen Programmoptionen.
Die State-Validierung ist grün und die Corp-PlayerView enthält keine Choice.

## Verifikation

- Test-first-Reproduktion: 35 bestehende fokussierte Tests grün; genau zwei
  neue Verträge vor dem Fix rot.
- Fokussierter Engine-Abschluss: 3 Testdateien, 47 Tests grün; verwandte
  Regressionen: 6 Testdateien, 71 Tests grün.
- Vollständige Engine-Suite: 202 Testdateien, 1.757 Tests grün.
- Fokussierter KI-Abschluss: 3 Testdateien, 28 Tests grün.
- Vollständige KI-Suite über die drei offiziellen Shards: 411 Testdateien,
  nach dem Abgleich mit dem weitergelaufenen `main` 2.818 Tests grün.
- Engine- und KI-Typecheck: grün.
- `check:package-boundaries`: grün, 1.893 geprüfte Dateien.
- `format:changed`: grün, 17 geänderte Dateien geprüft.
- `git diff --check`: grün.

## Restpunkte

Keine fachlichen Restpunkte. Alte Runtime-Daten werden in der
Version-0-Umgebung nicht migriert; der gespeicherte Zustand diente ausschließlich
als read-only Regressionsevidence.
