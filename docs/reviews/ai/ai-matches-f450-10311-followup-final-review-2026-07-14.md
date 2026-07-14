# Final Review: Follow-up zu den KI-Spielen f450 und 10311

Status: Fachlich und technisch abgeschlossen; lokal in `main` integriert

## Ergebnis

Die drei freigegebenen Follow-up-Befunde aus den zuletzt analysierten Spielen
sind vor den Fixes auf aktuellem Code als fünf rote spielgleiche Verträge
gesichert und danach generisch geschlossen worden. Die historische
Puzzle-Entscheidung bleibt bewusst unverändert, erhält nun aber den vollständigen
Engine- und KI-Informationsvertrag.

| Decision | StateVersion | Vorherige Entscheidung beziehungsweise Vertrag | Prüfung                                                                                                                                    | Finaler Stand                                                 |
| -------: | -----------: | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
|      167 |          279 | Basis-Credit statt `Theorem Proof scoren`      | unpassend: zwei sofortige Agendapunkte wurden ausgelassen                                                                                  | aktivierte Score-Fähigkeit wird gewählt                       |
|      173 |          291 | `Score!` statt `Theorem Proof scoren`          | unpassend: Handentwicklung war dem sicheren Scorefenster unterlegen                                                                        | aktivierte Score-Fähigkeit wird gewählt                       |
|      183 |          309 | Basis-Credit statt `Theorem Proof scoren`      | unpassend: erneut sicherer unmittelbarer Scorefortschritt ausgelassen                                                                      | aktivierte Score-Fähigkeit wird gewählt                       |
|       69 |          113 | `Temple Microcode Outlet` im Discard verworfen | unpassend: kein Breaker installiert, bekannte Breaker-Abdeckung nur im eigenen Stack                                                       | Temple bleibt als Suchzugriff erhalten                        |
|      120 |          209 | Puzzle-Subroutinen auslösen                    | taktisch passend: vollständiges Brechen kostete 18 Credits; das Akzeptieren beendet zwar den Run, entfernt Puzzle aber sichtbar am Zugende | Entscheidung bleibt grün; Payload meldet beide Folgen korrekt |

Die zugehörigen StateHashes sind unverändert in der roten Evidence und den
Fixtures dokumentiert:

- DI167/SV279: `fnv1a:1e4cfe3c`
- DI173/SV291: `fnv1a:0ba3590f`
- DI183/SV309: `fnv1a:a06ea847`
- DI69/SV113: `fnv1a:77208449`
- DI120/SV209: `fnv1a:164ae7c1`

## Ursachenkorrekturen

### Aktiviertes Agenda-Scoring

Die Engine kennzeichnet eine aktivierte Fähigkeit mit dem generischen
LegalAction-Signal `cardImplementationScoresSourceAsAgenda`, wenn ihr
Implementierungseffekt die Quelle als Agenda wertet. Die KI übernimmt dieses
Primitive über die positive DTO-Allowlist und bewertet es nur dann als
unmittelbaren Scorefortschritt, wenn die sichtbare eigene Quelle tatsächlich
eine Agenda ist. Kartenname, Match-ID, Seed und Labeltext sind nicht Teil der
Entscheidung.

### Breaker-Suchzugriff im Discard

Der Runner-Discard erkennt über `ownDeckCapabilities.runner.breakerCoverageMatrix`,
ob bekannte Wall-, Code-Gate- oder Sentry-Abdeckung noch im eigenen Stack liegt,
aber weder im Grip noch installiert ist. Eine sichtbare `program_search`- oder
`breaker_search`-Option erhält nur in diesem Zustand zusätzlichen
Aufbewahrungswert. Die Gegenprobe mit installiertem Krash erlaubt den
Temple-Abwurf weiterhin.

### Puzzle-Vertrag

Der kombinierte Subroutinentyp
`end_the_run_and_trash_source_at_end_of_turn` setzt jetzt generisch
`encounterWillEndRun` und `encounterSourceWillTrashAtEndOfTurn`. Beide Werte
bleiben in der side-sicheren KI-Eingabe erhalten. Die gewöhnliche Strafe für
einen vermeidbaren End-the-run-Continue greift weiterhin; sie wird nur bei dem
explizit sichtbaren verzögerten Selbst-Trash nicht als reiner Zugverlust
angesetzt. Die eigentliche Subroutinenauflösung wurde nicht verändert.

## Durch den Evidence-Checker aufgedeckte Anschlussverträge

Der Checkpoint-Runner hatte verdeckte Discard-Optionen nur über
`option.card.instanceId` zugeordnet. Bei den echten privaten Optionen steht die
Instanz jedoch in `option.value`; dadurch konnten tatsächlich verworfene Karten
fälschlich als behalten gelten. Nach der Korrektur wurden fünf ältere
Checkpoint-Erwartungen erstmals real rot.

Diese Anschlussfehler wurden nicht durch Karten-Sonderfälle kaschiert:

- Der alte f450-Kontrolltest erwartet nun folgerichtig das sofortige Scoren der
  eigenen installierten Agenda auch ohne gegnerischen Matchpoint.
- Corp-Discard koppelt erreichbare Tag-Quellen und harte Damage-Payoffs aus
  eigenem Decksnapshot und sichtbaren eigenen Zonen. Der synthetische
  Archives-Zentralserver gilt dabei nicht als aktive Quelle; sind alle Quellen
  sichtbar verbraucht, bleibt der bedingte Payoff abwerfbar.
- Noch nicht aktiver reiner Credit-Punish wird nicht auf Kill-Payoff-Niveau
  geschützt.
- Mehrfachabwürfe werden schrittweise neu bewertet. Nach dem Abwurf einer
  Dublette erhält die letzte verbleibende Kopie wieder ihren Singleton-Wert.

Alle diese Auswertungen verwenden ausschließlich eigene Deckkenntnis,
PlayerView, LegalActions und freigegebene Hint-/StrategicIntent-Daten.

## Gegenproben

- Eine beliebige aktivierte Fähigkeit ohne Engine-Score-Signal erhält keinen
  Agenda-Scorebonus.
- Temple darf bei bereits installierter Breaker-Abdeckung verworfen werden.
- Die historische Puzzle-Wahl bleibt `continue_run`.
- Gewöhnliches End-the-run mit legalem Break oder Pump behält die
  `-2500`-Fehlervermeidung.
- Ein bedingter Corp-Payoff darf nach sichtbar vollständigem Verbrauch aller
  Tag-Quellen verworfen werden.
- Von zwei Economy-Dubletten darf eine gehen; die letzte Kopie wird nach dem
  ersten Abwurf neu bewertet.

## Verifikation

```text
Follow-up-Checkpoints:  8/8 grün
Fokussierte Anschlussprüfungen: 65/65 grün
AI-Suite:               321/321 Dateien, 2122/2122 Tests grün
Engine-Suite:           184/184 Dateien, 1649/1649 Tests grün
AI-Typecheck:           grün
Engine-Typecheck:       grün
git diff --check:       grün
```

Replay, StateHash, Randomness, Kartenpool und die eigentliche Rules-Engine-
Auflösung wurden nicht verändert. Es wurde kein Selfplay- oder
Behavior-Baseline-Langlauf ausgeführt; die spielgleichen Checkpoints und die
vollständigen AI-/Engine-Suites sind für diesen deterministischen
Entscheidungs- und Payload-Scope die führenden Gates.

## Commits

- `3920cfdc1` – Prozessvertrag
- `d3f8afa6d` – rote spielgleiche Evidence und Retain-Checker
- `36f4bf779` – aktiviertes Agenda-Scoring
- `bc8d77e26` – Breaker-Suchzugriff im Discard
- `e77a6eb1a` – Puzzle-Metadaten
- `6260c7c08` – erreichbare Corp-Punish-Paare
- `7c6bf822f` – schrittweise Mehrfach-Discard-Bewertung
- `b779aac75` – Abschlussreview und Wissenslog
- `74a1e50dd` – lokale Integration nach `main`
