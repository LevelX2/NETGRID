# Manhunt-Killplan: Decision-Checkpoint Final Review

## Ergebnis

Das letzte abgeschlossene Spiel `match_606a546d0ba02826` ist als vollständiger
Corp-Decision-Checkpoint-Satz konserviert. Vor dem Fix waren genau vier der elf
Prüfungen als `behavior_regression` rot; sieben historische Fälle und
Gegenproben waren grün. Nach der Korrektur sind alle elf unveränderten
Erwartungen grün.

Der Fehler war nicht eine einzelne falsch bewertete Karte. Das sehr agenda-arme
Manhunt-Deck wurde strategisch weiterhin als Fast-Advance-Deck geführt, obwohl
seine tiefe Tag-/Schadenslinie die eigentliche Siegbedingung bildet. Diese
Fehlklassifikation setzte sich bis in Planbindung, Economy und konkrete
Aktionswahl fort.

## Generische Korrekturen

1. Die DeckDoctrine dämpft Fast Advance nur bei einer Kombination aus sehr
   niedriger Agendadichte, mehreren Tagquellen, mehreren Schadenspayoffs und
   einer tieferen vollständigen Killlinie als Agendaanzahl. Normale
   Score-Decks und Decks ohne dieses gekoppelte Profil behalten ihre bisherige
   Wertung.
2. StrategicIntent berechnet die maximal noch erreichbaren Corp-Agendapunkte
   aus Decksnapshot, eigener Score und öffentlich bekannten gestohlenen
   Punkten. Ist das Spielziel nicht mehr erreichbar, wird die Scoreline hart
   blockiert und eine produktive alternative Siegbedingung kann übernehmen.
3. Tag- und Schadensziele bleiben deckweit erreichbar, auch wenn aktuell noch
   kein legaler Payoff vorliegt. Damit kann die KI erst den Tag vorbereiten und
   danach den Schaden ausführen, statt jeden Schritt isoliert zu verwerfen.
4. Ein strategisch passender Semantikzug darf einen Economy-Plan unterbrechen,
   wenn er den normalen Bewertungsabstand überschreitet und selbst positiv
   bewertet ist. So schlägt ein echtes Chance-Observation-Fenster BBS, während
   eine negative, unsichere Agenda-Installation keinen vernünftigen
   Economy-Schritt verdrängt.
5. Finite Economy gilt nur auf einem Remote als installiert; eine abgelegte
   BBS-Kopie in Archives erzeugt keinen falschen aktiven Economy-Plan. Bei sehr
   niedrigen Credits wird die Installation nur dann als strategische
   Finanzierung behandelt, wenn ein sichtbares Tagquellen-/Schadenspayoff-Paar
   erhalten und finanziert werden muss.
6. Die sichtbare Killlinien-Erkennung verwendet ausschließlich Rollen-,
   Ontologie- und Hint-Signale. Es gibt keine Manhunt- oder
   Kartennamen-Sonderregel und keine zusätzliche Planautorität neben
   StrategicIntent und PlanPortfolio.

## Checkpoint-Ergebnis

| Checkpoint    | Vertrag                                                    | Ergebnis nach Fix            |
| ------------- | ---------------------------------------------------------- | ---------------------------- |
| CP01          | Tag-/Schadensdoctrine statt Fast Advance                   | grün                         |
| CP02          | Chance Observation vor BBS-Economy                         | grün                         |
| CP03          | I Got a Rock behalten                                      | grün, ohne neuen Discard-Fix |
| CP04          | nach ausgeschöpften Agendas Scoreline verlassen            | grün                         |
| CP05          | BBS als Finanzierung des sichtbaren Killpaars installieren | grün                         |
| CP06          | Audit und Urban Renewal behalten                           | grün, ohne neuen Discard-Fix |
| 5 Gegenproben | normale Scoreline, Economy und Discard-Grenzen             | grün                         |

Die Erwartungen und historischen Zustände wurden nach dem Fix nicht
abgeschwächt. PlayerView und LegalActions werden weiterhin aus dem gespeicherten
State über die Engine erzeugt; FullState und gegnerische Hidden-Zonen gelangen
nicht in produktive KI-Inputs.

## Gefundener Seiteneffekt

Der erste vollständige AI-Lauf fand einen roten älteren Checkpoint:
`CP-7BFE-02a` schützt davor, Corporate War bei fünf Credits in ein unsicheres
Remote zu legen. Ursache war die zunächst zu breite neue Regel, nach der jeder
strategisch passende Zug einen nicht passenden Plan überstimmen konnte. Der
Zug war relativ besser als die gemappte Wahl, hatte aber weiterhin einen
negativen Gesamtscore.

Die Regel verlangt deshalb zusätzlich einen positiven Gesamtscore. Danach sind
sowohl der Fünf-Credit-Schutz als auch die Sechs-Credit-Gegenprobe und alle
Manhunt-Checkpoints grün. Dieser Fund bestätigt den Wert der spielgleichen
Checkpoint-Sammlung über die gerade bearbeitete Partie hinaus.

## Verifikation

```text
Roter Vorher-Lauf: 4 Zieltests rot, 7 Kontrollen grün
Manhunt-Checkpoint nach Fix: 11/11 grün
Kombinierter Manhunt-/7BFE-/Ranking-Lauf: 67/67 grün
Fokussierte Doctrine-/Intent-/Plan-/Runtime-Gruppe: 179/179 grün
Vollständige AI-Suite: 308 Dateien, 2039/2039 Tests grün
AI-Typecheck: grün
Card-Name-Leakage-Inventar: grün, 140 bekannte Baseline-Funde
Changed-Files-Prettier und git diff --check: grün
```

Das Card-Name-Inventar wurde beim Gate auf den bereits vorhandenen Engine-Stand
nachgeführt. Der neue Killlinien-Helfer selbst fügt keinen Kartennamenfund
hinzu.

## Grenzen

- Banpei wurde nicht pauschal gegen sichtbare Matador-Breaker erzwungen; der
  exakte Matchzustand belegt dafür keinen stabilen universellen Vertrag.
- Dreifache finite Economy bleibt erlaubt, wenn kein höherwertiges positives
  Zeitfenster vorliegt.
- Die Änderung bewertet die Siegbedingung und sichtbare Bausteine; sie erzeugt
  keine neuen LegalActions und ändert keine Engine-, Replay- oder
  StateHash-Regel.

## Integration

Der Arbeitsbranch `codex/ai-manhunt-kill-plan` wurde nach den grünen Gates lokal
per Fast-Forward nach `main` integriert. Die beiden entscheidenden
Checkpoint-Dateien liefen auf `main` erneut mit 20/20 Tests grün. Worktree und
gemergter Branch wurden anschließend verifiziert entfernt. Es erfolgte kein
Push und kein Pull Request.
