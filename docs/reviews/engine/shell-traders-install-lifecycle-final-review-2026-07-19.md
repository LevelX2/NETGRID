# The Shell Traders: Installations-Lifecycle-Final-Review

Datum: 2026-07-19

Ergebnis: fachlich abgeschlossen

## Ergebnis

Über `The Shell Traders` installierte Programme und Hardware durchlaufen nach
der erfolgreichen Bewegung in die Runner-Rig jetzt genau einmal ihren
deklarativen `on_install`-Lifecycle. Damit erhält insbesondere `Cloak`
unmittelbar bei der kostenlosen Installation die aufgedruckten drei Credits.
Die Erstbefüllung wartet nicht auf den Start des nächsten Zuges und ist vom
späteren Refresh verbrauchter Credits getrennt.

Der Fix ist nicht kartenspezifisch: Der bestehende Shell-Traders-Abschluss
ruft über einen engen Runtime-Port denselben
`executeCardImplementationLifecycleEffects(..., "on_install")`-Interpreter
auf wie normale Runner-Installationen. „At no cost“ betrifft weiterhin nur
die regulären Installations-Credits.

## Geprüfte Auflösungswege

- Zwei installierte Kopien von `The Shell Traders` entfernen zu Beginn des
  Runner-Zuges die letzten zwei Shell-Counter. Die zweite Entfernung
  installiert `Cloak`; anschließend liegen sofort drei Credits auf der Karte.
- Die bezahlte Fähigkeit entfernt den letzten Shell-Counter und führt nach der
  Installation denselben Lifecycle aus.
- Bei MU-Mangel bleiben Ziel, letzter Counter und `on_install` während der
  verpflichtenden Programmtrash-Choice unverändert. Erst nach erfolgreicher
  Choice wird installiert und der Lifecycle genau einmal ausgeführt.
- Der automatische Startzugpfad schreibt den öffentlichen
  `add_hosted_credits`-Effekt nach dem Shell-Counter-Effekt in den bestehenden
  Effect-Collector. Replay und resultierender StateHash stimmen überein.

## Architektur und Invarianten

- Der Runner-Rig-Finalizer bleibt für Rig-Liste, MU, Zone, Legacy-Recurring-
  Credits und generische Virus-Counter zuständig. Die deklarative
  Lifecycle-Ausführung bleibt in der Ability Engine.
- Der Shell-Traders-Resolver enthält keine `Cloak`-ID und keine duplizierte
  Kartenlogik.
- Paid-, automatischer Startzug- und MU-Choice-Pfad verwenden denselben
  Installationsabschluss.
- Seite, Timing, Source, Ziel, Counter, Unique-Regel, MU und Choice werden wie
  zuvor revalidiert; der Fix weicht keine LegalAction- oder
  `applyAction`-Grenze auf.
- PublicEvent-, Hidden-Info-, Replay- und StateHash-Verträge bleiben erhalten.

## Verifikation

- Test-first-Reproduktion vor dem Fix: 30 bestehende Tests grün, genau drei
  neue Lifecycle-Verträge rot mit `Cloak`-Credits `0` statt `3`.
- Fokussierter Abschlusslauf: 2 Testdateien, 43 Tests grün.
- Vollständige Engine-Suite: 201 Testdateien, 1.747 Tests grün.
- Engine-Typecheck: grün.
- `check:package-boundaries`: grün, 1.889 geprüfte Dateien.
- `format:changed`: grün.
- `git diff --check`: grün.

## Restpunkte

Keine fachlichen Restpunkte für den Shell-Traders-Installations-Lifecycle.
Alte lokale Matchzustände werden in der Version-0-Umgebung nicht migriert;
neue Auflösungen verwenden den korrigierten Vertrag.
