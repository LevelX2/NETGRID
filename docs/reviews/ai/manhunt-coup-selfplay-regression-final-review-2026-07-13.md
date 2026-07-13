# Manhunt-vs.-Coup-Selfplays: Decision-Checkpoint Final Review

## Ergebnis

Drei freigegebene Fehlentscheidungen aus den fünf deterministischen Selfplays
mit den Decks aus `match_606a546d0ba02826` sind zuerst als spielgleiche rote
Decision-Checkpoints konserviert und danach generisch geschlossen worden. Der
separat versionierte Vorher-Lauf bestand aus genau drei roten Zielverträgen und
drei grünen Gegenproben. Nach den Korrekturen sind alle sechs unveränderten
Manhunt-vs.-Coup-Erwartungen grün.

Die neuen Checkpoints stellen den exakten `GameState`, Engine-`LegalActions`,
den side-sicheren Public-Event-Präfix, Deckstrategie, TacticalPlan,
PlanPortfolio und StrategicIntent unmittelbar vor der Entscheidung wieder her.
Der Capture-Pfad ist test-/diagnosespezifisch und greift nicht in den normalen
Server- oder KI-Lauf ein.

## Geschlossene Verträge

| Checkpoint                 | Roter Vorher-Befund                                                                                                               | Generischer Vertrag nach Fix                                                                                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed 001, StateVersion 137 | Corporate War wurde mit zwei Klicks in eine vor dem Score erreichbare unsichere Remote gelegt                                     | Eine verzögerte Punish-Scoreline wird deutlich stärker gedämpft, wenn die Runnerin sie vor dem Score erreichen oder contesten kann; eine finanzierte und rechtzeitig abschließbare Linie bleibt erlaubt                       |
| Seed 003, StateVersion 282 | Der letzte Klick ging allein wegen einer unbekannten Karte in Archives in einen weiteren Archives-Run                             | Verdeckte Archives-Karten erhalten nur mit bekanntem Payoff, Corp-/Matchdruck, noch nicht aufgelöstem Zufallsabwurf oder fehlender brauchbarer Alternative positiven Kontext; eine sichtbare Agenda bleibt ein starker Payoff |
| Seed 005, StateVersion 429 | Die Corp nahm bei sechs Punkten, einer Karte in R&D und Corporate War in HQ einen Credit statt die letzte Gewinnlinie zu eröffnen | Die Board-Triage erkennt eine sichtbare Matchpoint-Agenda im letzten Deckout-Fenster. Nur für diese konkrete legale Scoreline dürfen Sicherheits- und Punish-Dämpfer der sonst sicheren Niederlage nach Deckout weichen       |

Die Regeln verwenden weder Match-, Seed-, Deck- noch Kartennamen. Sie wirken
als Bewertungs- und Triage-Signale unterhalb der bestehenden Planebene und
ersetzen weder StrategicIntent noch TacticalPlan oder PlanPortfolio.

## Archives-Vertrag und älterer MRGSG-Checkpoint

Die vollständige AI-Suite fand als einzige Wechselwirkung den älteren
spielgleichen Checkpoint `CP-MRGSG-01`. Dessen damalige Erwartung verlangte
einen Archives-Run auf zwei unbekannte Karten. Im exakten Zustand existieren
aber weder Deckout-/Matchdruck noch ein Zufallsabwurf; Draw und
Credit-Recovery sind mit 1.293 beziehungsweise 1.254 Rohpunkten konkrete
interessantere Alternativen.

Die spätere ausdrückliche Archives-Anforderung ersetzt deshalb den damaligen
Zielvertrag. Das Fixture bleibt spielgleich erhalten und verbietet nun den
unbegründeten Archives-Run, ohne den vollständig besteuerten R&D-Run als einzig
richtige Folge festzuschreiben. Der historische Red-Evidence-Bericht bleibt als
damaliger Nachweis unverändert; der führende MRGSG-Final-Review enthält einen
transparenten Nachtrag. MRGSG, Archives-Units und Manhunt-vs.-Coup laufen
gemeinsam mit 13/13 Tests grün.

## Sicherheits- und Architekturgrenzen

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Der Checkpoint-Runner meldet Legality-, Runtime-, Fixture- und
  Redaktionsdrift getrennt von einer Verhaltensregression; keiner dieser
  Fehler trat in den sechs neuen Checks auf.
- Die Fixture-Eventpräfixe sind auf die handelnde Seite redigiert. Es wird
  keine spätere Kartenreihenfolge oder gegnerische Hidden-Zone in den
  KI-Runtimezustand übernommen.
- Engine-Regeln, PlayerView-Vertrag, Replay, StateHash, Zufall und Kartenpool
  wurden nicht verändert.
- Wiederholte finite Economy und Broker-Nutzung sind nicht Gegenstand dieses
  Strangs.

## Verifikation

```text
Roter Vorher-Lauf: 3 Zieltests rot, 3 Gegenproben grün
Manhunt-vs.-Coup nach Fix: 6/6 grün
Archives-/MRGSG-/Manhunt-Kombination: 13/13 grün
Corp-Score-/Board-Triage-/Checkpoint-Gruppe: 154/154 grün
AI-Typecheck: grün
check:ai: alle fünf Teilchecks grün, errors=0; bestehende Warninventare bleiben sichtbar
Vollständige AI-Suite: 310 Dateien, 2053/2053 Tests grün
AI Behavior Baseline v1: 60 Spiele; technisch side-safe, attention_required wegen 6 geerbter Action-Limits
Gezielte Main-Kontrolle der zwei gegenüber der alten Referenz neuen Limit-Seeds: beide bereits auf Start-main 5a2f9a532 rot, Hard-Gate-Delta dieses Strangs 0
Neue und gezielt geänderte Runtime-, Test- und Review-Dateien: Prettier grün
Simulator-Capture: bestehende Dateiformatierung beibehalten, um reinen Formatierungsdiff zu vermeiden
git diff --check: grün
```

## Behavior-Baseline

Der Kandidatenlauf verwendet unverändert sechs Slots, zehn Seeds,
`current_candidate` auf beiden Seiten und 480 Aktionen. Vergleichsbasis ist
`ai-behavior-baseline-v1-planportfolio-remote-doctrine-final-2026-07-12.json`
am Git-Stand `47f078f77`. Kompaktbericht und vollständige redigierte Rohtraces
des Kandidaten bleiben unter `data/local/`; nur der verdichtete Reviewbericht
unter `docs/reviews/ai/` wird versioniert.

Der vollständige Kandidat am Git-Stand `5083ec265` ist schema-, Slot-, Seed-,
Limit- und Fingerprint-kompatibel mit der Referenz. Illegalität, Replayfehler,
Fallbacks, Timeouts, Runtimefehler, Hidden-Info-Funde und
`no_legal_action_failure` bleiben bei null; die Traces sind redaction-safe.

Der Hard-Gate-Status bleibt `attention_required`, weil sechs Spiele das
480er-Aktionslimit erreichen. Vier Hybrid-Seeds waren bereits in der Referenz
rot. Die beiden gegenüber der alten Referenz zusätzlichen Fälle – Net Damage
Seed 04 und Hybrid Seed 10 – wurden auf dem sauberen Start-`main` `5a2f9a532`
ohne diesen Arbeitsbranch gezielt wiederholt und erreichen dort ebenfalls 480
Aktionen. Der Fixstrang erzeugt somit keinen neuen Action-Limit-Seed; die sechs
Limits bleiben ein geerbter Projektblocker.

| Kennzahl                                   | Referenz | Kandidat |   Delta |
| ------------------------------------------ | -------: | -------: | ------: |
| Missed score window rate                   |    0.000 |    0.000 |       0 |
| Advanced remote contest skip rate          |    0.867 |    0.904 |  +0.037 |
| Plan conversion rate                       |    0.790 |    0.775 |  -0.015 |
| No-progress / 100 Entscheidungen           |    2.387 |    2.568 |  +0.181 |
| Dominierte Planwahlen / 100 Entscheidungen |        0 |        0 |       0 |
| Findings / 100 Entscheidungen              |    5.017 |    3.591 |  -1.426 |
| Durchschnittliche Aktionen                 |  191.350 |  213.517 | +22.167 |

Die Verhaltensdeltas sind Evidence, keine isolierten Akzeptanzschwellen. Sie
sind zudem nicht kausal allein diesem Strang zurechenbar, weil zwischen
Referenz `47f078f77` und Worktree-Basis `5a2f9a532` zahlreiche weitere
KI-Änderungen liegen. Die beiden neuen harten Limitfälle wurden deshalb
gesondert gegen die Worktree-Basis kontrolliert.

## Grenzen

- Die drei Checkpoints belegen genau die freigegebenen Zustandsverträge und
  passende Gegenproben; sie beweisen keine globale Deckoptimalität.
- Ein späterer Umbau der Planebene darf intern anders priorisieren, muss aber
  dieselben fachlichen Checkpoint-Erwartungen erfüllen oder eine explizite,
  begründete Fixture-/Anforderungsmigration vornehmen.
- Der bestehende Behavior-Baseline-Referenzstand besitzt bereits bekannte
  Action-Limit-Spiele. Entscheidend ist deshalb neben dem Gesamtzähler auch,
  ob neue Slots oder Seeds betroffen sind.

## Lokale Integration und Cleanup

Der Arbeitsbranch wurde per Fast-Forward lokal nach `main` integriert. Der
anschließend erkannte reine Ganzdatei-Formatierungsdiff im Simulator wurde auf
die zwölf tatsächlich benötigten Capture-Zeilen gegenüber der Ausgangsbasis
reduziert und mit den Simulator- sowie Manhunt-vs.-Coup-Checkpoint-Tests und
dem AI-Typecheck erneut grün geprüft.

Der vollständige Baseline-Kompaktlauf, die redigierten Rohdaten und die
zugehörigen Logs liegen unter `data/local/` im Haupt-Workspace. Danach wurden
der Arbeits-Worktree im Dateisystem und in `git worktree list` entfernt sowie
der gemergte Arbeitsbranch gelöscht. Es erfolgte weder ein Push noch die
Erstellung eines Pull Requests.
