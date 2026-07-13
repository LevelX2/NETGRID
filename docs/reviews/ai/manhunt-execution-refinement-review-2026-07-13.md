# Manhunt-Ausführungspräzisierung – Abschlussreview (2026-07-13)

Status: abgeschlossen; lokal integriert mit `ea4ceb2b7`

## Quelle und Scope

- Gespeichertes Match: `match_fa11540b1f1e08b6`
- Corp-Deck: `Manhunt Pressure Bureau`, Hash `fnv1a:1e1a582e`
- Ausgangsstand: `8dc8ff039`
- Kandidatenstand der Behavior Baseline: `a8a27f41d`
- Ziel: konkrete Tag-/Damage-Ausführung verbessern, ohne eine zweite Planebene,
  verdeckte Runner-Informationen oder nicht-legale Aktionen einzuführen.

## Vor dem Fix gesicherte Fehler

Der separat committete Evidence-Stand `a16c71eb9` enthielt sieben
spielgleiche Decision-Checkpoints und fünf Gegenproben. Auf dem unveränderten
Runtime-Stand waren sieben Zielverträge rot und alle fünf Gegenproben grün.

1. Wiederholte erfolgreiche R&D-Zugriffe verhinderten keinen weiteren
   spekulativen, ungeschützten Agenda-Remote.
2. Eine Tagquelle wurde trotz fehlendem sichtbaren Folge-Payoff bevorzugt.
3. Eine installierte und bezahlbare City Surveillance wurde nicht rechtzeitig
   aktiviert.
4. Nach vollständiger Verteilung aller Agenda-Punkte blieb leerer
   HQ-Matchpoint-Schutz aktiv und verdrängte den Damage-Pfad.
5. Trace-Gebote wurden ohne hinreichenden Wert beziehungsweise oberhalb des
   garantierenden Minimums gewählt.

Die historische Discard-Situation behielt Scorched Earth auf dem aktuellen
Ausgangscode bereits korrekt. Sie bleibt als grüne Gegenprobe erhalten; dafür
wurde keine künstliche neue Discard-Regel eingeführt.

## Umgesetzte Verträge

### Trace-Bids und produktive Choices

- Kontextlose oder nicht verwertbare Trace-Payoffs bieten `0`.
- Bei sichtbarem, bezahlbarem Payoff gilt
  `max(0, runnerLink + runnerCredits - baseTraceStrength + 1)`.
- Das Gebot bleibt durch Corp-Credits und die notwendige Folge-Payoff-Reserve
  begrenzt.
- Sichtbarer Runner-Link wird ausschließlich aus PlayerView, Rig und
  öffentlichen Kartendefinitionen abgeleitet.

### Tag-Conversion und Enabler

- Karten in Archives zählen nicht mehr als aktuell ausführbarer
  Tag-/Damage-Payoff auf dem Board.
- Eine sofortige Tagquelle ohne sichtbares Conversion-Fenster erhält einen
  expliziten Ausführbarkeitsabschlag.
- Ein bezahlbarer persistenter Tagmotor mit sichtbarem Damage- oder
  Ökonomie-Payoff erhält einen Aktivierungsfortschritt für die bestehende
  Planfolge `deploy -> fund -> rez -> exploit`.

### R&D-Reaktion

- Central Pressure unterscheidet historische und aktuelle Zugriffe; das
  aktuelle Fenster umfasst 32 StateVersions.
- Zwei aktuelle erfolgreiche R&D-Zugriffe erzeugen eine hohe vorbereitende
  Schutzpflicht.
- Wenn ICE noch nicht bezahlbar ist, zählt echte Ökonomie als erster
  Schutzschritt und ein unsicherer spekulativer Remote wird zurückgestellt.
- Ein tatsächlicher sofortiger Scoreabschluss bleibt führend; ältere Zugriffe
  oder bereits wirksames Stop-ICE lösen keine absolute Sperre aus.

### Agenda-Inventar

- Das vollständig bekannte eigene Deck-Snapshot liefert die Gesamtpunkte.
- Öffentliche Corp- und Runner-Score-Areas sowie bekannte aus dem Spiel
  entfernte Agendas werden abgezogen.
- Bei `remainingStealableAgendaPoints = 0` entfallen HQ-Matchpoint- und
  Agenda-Suchdruck; eine Gegenprobe mit wieder stehlbaren Punkten aktiviert
  die HQ-Komponente erneut.

## Verifikation

- Exakte Ziel- und Gegenproben plus Inventar-/Zeitfenster-Unit-Tests:
  17 von 17 grün.
- Betroffene breite Regressionstests nach Vertragsangleichung:
  60 von 60 grün.
- Vollständige AI-Suite: 313 Testdateien, 2.072 Tests, alle grün.
- AI-Typecheck: grün.
- `check:ai`-Gates für Compiled Hints, Derived Facts, Hint-Index, manuelle
  Overlays und Action-Semantic-Signal-Katalog: grün, Fehler jeweils `0`.
- Changed-File-Format und `git diff --check`: grün.
- Decision-Checkpoints rekonstruieren LegalActions, PlayerViews, side-sichere
  Events und Runtime-Planstand; produktive Erwartungen laufen über denselben
  Chooser wie die Live-KI.

## Behavior Baseline v1

Vergleich gegen `5083ec265`, identische sechs Slots, zehn Seeds und maximal
480 Aktionen je Spiel; beide Seiten `current_candidate`.

| Gate oder Kennzahl                   | Referenz | Kandidat |       Delta |
| ------------------------------------ | -------: | -------: | ----------: |
| Illegale Aktionen                    |        0 |        0 |           0 |
| Replay-Fehler                        |        0 |        0 |           0 |
| Action-Limit-Spiele                  |        6 |        4 |          -2 |
| Fallbacks / Timeouts / Runtimefehler |        0 |        0 |           0 |
| Hidden-Info / No-Legal-Action        |        0 |        0 |           0 |
| Redaction-safe                       |       ja |       ja | unverändert |
| Missed Score Window Rate             |    0,000 |    0,000 |       0,000 |
| Advanced Remote Contest Skip Rate    |    0,904 |    0,860 |      -0,044 |
| Plan Conversion Rate                 |    0,775 |    0,774 |      -0,001 |
| No-Progress je 100 Entscheidungen    |    2,568 |    2,557 |      -0,011 |
| Findings je 100 Entscheidungen       |    3,591 |    3,231 |      -0,360 |
| Durchschnittliche Aktionen           |  213,517 |  202,700 |     -10,817 |

Es kam keine neue Action-Limit-Partie hinzu. Nicht mehr im Limit enden
`strategy_panel_net_damage_black_ice/04` und
`strategy_panel_hybrid_score_punish_cheap_bag/07`. Verbleibend und bereits in
der Referenz rot sind nur die Hybrid-Seeds `02`, `03`, `05` und `10`.

Das Gesamtergebnis bleibt formal `attention_required`, weil vier geerbte
Action-Limits ein hartes Projekt-Gate verletzen. Gegenüber dem unmittelbar
vergleichbaren Ausgangsstand gibt es jedoch keine neue technische
Fehlerklasse und zwei rote Seeds weniger. Verhaltensdeltas sind Evidence, kein
isolierter Stärke-Beweis.

## Restgrenzen

- Der neue Agenda-Pivot kennt keine verdeckten Runner-Zonen; unbekannte
  entfernte Karten werden nicht als Agenda behauptet.
- Das R&D-Zeitfenster ist eine Ausführungspriorität innerhalb der bestehenden
  StrategicIntent-/PlanPortfolio-/TacticalPlan-Hierarchie, keine neue
  Langfristplanung.
- Die vier verbleibenden Hybrid-Action-Limits sind eigenständige spätere
  Analyseanker und wurden in diesem Scope nicht durch metrisches Tuning
  kaschiert.
