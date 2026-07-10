# Test Spin: Evidence zum verzögerten Run

## Reproduktion

- Corp: `Universal Fast Advance`
- Runner: `proteus_runner_hq_virus_derez_2026_05_25`
- Seed: `universal-fast-advance-11`
- Controller: beidseitig `current_candidate`
- Action-Limit: 480
- Ergebnis auf Ausgangsstand `a76a916f1`: 152 Aktionen, eine IllegalAction,
  Replay stabil

Die relevante Folge ist deterministisch:

1. StateVersion 151: Der Runner spielt die legale Aktion
   `runner.play_event.archives` mit zwei Klicks und drei Credits. Die Aktion
   kostet einen Credit und öffnet die runnerprivate Stack-Programmchoice.
2. StateVersion 152: Die KI reicht die aktuelle legale
   `runner.resolve_choice`-Aktion ein.
3. `applyAction` verwirft die Auflösung mit `ERR_INVALID_TARGET` und
   `Test Spin konnte keinen Run starten.`

Der Fehler entsteht nicht durch eine illegale KI-Auswahl: Event und Choice
stammen aus aktuellen `LegalActions`; der Fehler tritt erst innerhalb der
mehrstufigen Effektauflösung nach der erfolgreichen Programminstallation auf.

## Ursachenbeleg

`resolveStackInstallRunCleanupChoice` installiert das gewählte Programm,
mischt den Stack und ruft anschließend `startRun` auf. Die für das Run-Ende
benötigten `testSpinTemporaryInstall`-Metadaten werden derzeit jedoch erst
nach der Rückkehr aus `startRun` direkt an `state.run` gehängt.

Der generische Runpfad darf einen Run vollständig synchron abwickeln:

- `startRun` betritt bei einem Server ohne ICE unmittelbar den Accesspfad.
- Der v0.9.7-Breachpfad beendet einen Run sofort, wenn die Breach-Queue leer
  ist.
- `finishRun` entfernt danach korrekt `state.run`.

Ein Run auf leere Archives kann deshalb erfolgreich gestartet und beendet
sein, bevor `startRun` zum Choice-Resolver zurückkehrt. Der Resolver deutet
das korrekte `state.run === undefined` dann fälschlich als fehlgeschlagenen
Run und wirft. Zugleich waren die Test-Spin-Cleanupdaten während des
eigentlichen Run-Endes noch nicht vorhanden, sodass das temporär installierte
Programm nicht zurückgemischt werden konnte.

## Generischer Zielvertrag

Run-bezogene Follow-up-Metadaten, die auch bei einem synchron beendeten Run
gelten müssen, werden atomar über `StartRunOptions` an den Runstart
übergeben. Aufrufer dürfen nach `startRun` nicht aus der bloßen Existenz von
`state.run` ableiten, ob der Run gestartet wurde. Das bestehende Feld
`StartRunOptions.testSpinTemporaryInstall` bildet diesen Vertrag bereits ab;
der Test-Spin-Resolver muss es rechtzeitig verwenden.

## Geplante Regression

- positive bestehende Gegenprobe: Test Spin auf einen Run mit fortbestehendem
  Runzustand behält Rückgabe und Penalty-Verhalten;
- neue Grenzprobe: Test Spin auf leere, ungeschützte Archives beendet den Run
  synchron, wirft nicht und mischt das temporär installierte Programm sofort
  zurück;
- Seed-Regression: `universal-fast-advance-11` endet ohne IllegalAction und
  bleibt replaystabil.

## Nicht freigabereif aus diesem Spiel

Keine weitere KI-Gewichts-, Plan- oder Hintänderung wird aus diesem Fund
abgeleitet. Die KI hat aktuelle LegalActions verwendet; die Abweichung liegt
im Engine-Auflösungsvertrag.
