# Final Review: City Surveillance, Chronik und Runner-KI

- Datum: 02.08.2026
- Match: `match_b0b0bffec6715028`
- Ergebnis: **bestanden**

## Ausgangsbefund

Das letzte gespeicherte Spiel wurde vollständig aus der lokalen SQLite-
Runtime rekonstruiert. Alle 65 KI-Entscheidungen besitzen Trace-,
LegalAction-, PlayerView- und PublicEvent-Evidence. Für den hier freigegebenen
City-Surveillance-Umfang war Entscheidung 57 das Verhaltensfinding. Der
vollständige Match-Audit dokumentiert daneben zwei unabhängige KI-Follow-ups,
die nicht Teil dieses Pakets sind.

Die Runner-KI spielte bei 2 Credits und einem verbleibenden Klick
`Bodyweight Synthetic Blood`: 2 Credits bezahlen und fünf Karten ziehen. Eine
sichtbare gerezzte City Surveillance erzeugte anschließend fünf einzelne
Draw-Tax-Choices. Fall Guy verhinderte den ersten Tag; vier Tags blieben. Die
darauffolgenden Scorched-Earth-Aktionen führten zur Flatline. Die Engine löste
Draw, Prävention, Tags und Flatline regelkonform auf.

## Behobene Darstellung

- Die Chronik fasst den suspendierten Mehrkarten-Draw wieder mit seiner
  angeforderten Gesamtmenge zusammen.
- Jede City-Surveillance-Choice benennt eindeutig, ob der Runner 1 Credit
  bezahlt oder 1 Tag genommen hat.
- Dieselbe Choice erzeugt weder eine doppelte Chronik-Wirkung noch einen
  dritten Aktionshinweis.
- Die Präventionschronik nennt Fall Guy als getrashte Präventionskarte und
  City Surveillance als Tagquelle.
- Tödlicher Schaden wird als Flatline statt als gewöhnlicher Schaden
  dargestellt.
- Die PlayerView veröffentlicht dabei nur bereits öffentliche
  `drawCardsAmount`-Information; verdeckte Kartenidentitäten bleiben geschützt.

## Behobene KI-Entscheidung

Der Owner bleibt die residente Instanz
`plan:runner.rig_and_coverage:coverage%3Abreaker_sentry`, Phase
`draw_for_answer`, Step `draw_for_answer_breaker_sentry`. Der Fix ergänzt
keinen Resolver, Override oder kartenspezifischen Controller.

Vor der Draw-Grenze projiziert der bestehende Plan generisch:

1. wie viele Karten die aktuelle LegalAction höchstens zieht;
2. wie viele sichtbare gerezzte Draw-Tax-Quellen reagieren;
3. welche Credits nach den Aktionskosten verfügbar bleiben;
4. wie viele Tags bei optimaler Bezahlung mindestens verbleiben.

Im historischen Zustand wird die Fünf-Karten-Route dadurch verworfen und die
exakt gebundene LegalAction `runner.draw_card` gewählt. Action-ID, Executor,
Planinstanz und Step bleiben im Checkpoint festgeschrieben. Die späteren
City-Surveillance- und Fall-Guy-Fenster bleiben ausschließlich Engine-
Fortsetzungen.

## Regressionsevidence

- Checkpoint:
  `data/scenarios/ai-decision-checkpoints/cp-b0b0-city-surveillance-bodyweight-d57.json`
- Strict-Warmup: 56 vorherige Runner-Entscheidungen, 0 Drifts.
- Rot vor dem Fix: `behavior_regression`, Bodyweight war verbotene und nicht
  akzeptable Action.
- Grün nach dem Fix: `runner.draw_card`, identischer Planowner und Step.
- Deck-Hint-Consumer-Audit: 20 eindeutige Karten, 45 Karten insgesamt,
  0 Blocker, 0 Warnungen.
- Produktiver KI-Pfad enthält keine neue Karten-ID- oder Kartenname-
  Entscheidung; das Generic-Card-ID-Gate bleibt bei drei bestehenden,
  freigegebenen Vorkommen.

## Verifikation

| Gate                          |                            Ergebnis |
| ----------------------------- | ----------------------------------: |
| Webtests                      |    77 Dateien / 769 Tests bestanden |
| Enginetests                   | 212 Dateien / 1.862 Tests bestanden |
| AI-Shards                     | 556 Dateien / 4.565 Tests bestanden |
| Web-, Engine-, AI-Typecheck   |                           bestanden |
| AI-Hint-Metadaten             |                       0 Hard Errors |
| AI-Source-Structure           |          0 Runtime- und 0 Typzyklen |
| Generic-Card-ID-Guard         |                          0 Verstöße |
| Deck-Doktrin                  |                           bestanden |
| Format und `git diff --check` |                           bestanden |

## Restpunkte

Keine offenen fachlichen oder technischen Restpunkte für den freigegebenen
City-Surveillance-Befund. Die unabhängigen Audit-Findings F1
(Run-only-Economy) und F3 (Emergency-Keep beim Abwurf) bleiben als eigene,
noch nicht freigegebene Folgepakete im vollständigen Match-Audit dokumentiert.
Alte lokale Replays werden gemäß Version-0-Vertrag nicht migriert.
