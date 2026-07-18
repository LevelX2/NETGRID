# Match 74e2369: Corp-KI-Regressions- und Consumer-Evidence

Datum: 2026-07-18  
Match: `match_74e236955b3208a1`  
Ausgangsstand: `fe86a82e2751201a711cb05d451f48acf2ef6bb4`

## Ergebnis vor Umsetzung

Das Spiel enthält keine LegalAction-, Trace- oder Runtime-Lücke. Alle 136
gespeicherten Corp-KI-Entscheidungen sind vorhanden, eindeutig zugeordnet und
mit detaillierter Decision-Chain auswertbar. Die auffälligen Entscheidungen
sind auf unverändertem aktuellem Code reproduzierbar. Bestehende Tests zeigen
zugleich, dass Night Shift, zentrale ICE-Arbitration, Tycho-Konvertierung und
Corporate-War-Closeouts in anderen Zuständen weiterhin funktionieren.

Die Befunde sind deshalb weder ein vollständiger Ausfall dieser Fähigkeiten
noch ein frei verschobenes Soll. Es handelt sich um konkrete Integrationslücken
zwischen Rohscore, Plan-Mapping, Override-Kandidat und finaler Arbitration
sowie um ältere Compiled-Hint-Überlappungen, die von den globalen
Strukturgates nicht als Fehler erkannt wurden.

## Match- und Coverage-Evidence

- Modus: `human_runner_vs_corp_ai`
- Corp-Profil: `corp-ai-v0.9-hard`
- Ergebnis: Runner gewinnt durch Agendapunkte.
- Seed: `match-mrqaqrr6-aoiatz`
- Endzustand: StateVersion 349, StateHash `fnv1a:f5534ce3`
- Events: 350
- State-Snapshots: 350
- AI-Traces erwartet/gefunden/zugeordnet: 136/136/136
- Fehlende, verwaiste, doppelte oder typabweichende Traces: 0

Vollständige Klassifikation:

- 21 bestätigte Schwächen:
  D19, D23, D26-D28, D31-D33, D37, D82-D84, D89-D90,
  D125-D127, D131-D133 und D135;
- 4 nicht eigenständig umzustimmende Prüffälle:
  D101, D104, D117 und D120;
- 111 lokal regelkonforme beziehungsweise ohne belastbare bessere Alternative
  nachvollziehbare Entscheidungen: alle übrigen Decisions.

## Bestätigte Fehlergruppen

### Project Consultants wählt das punktärmere Ziel

D19 installiert `Hostile Takeover`, obwohl `Tycho Extension` mit denselben
vier Project-Consultants-Countern im selben Zug vier statt einen Agendapunkt
liefert. Beide Konvertierungspfade erhalten Planpriorität 1079; der
tatsächliche Agenda-Punktwert löst den Gleichstand nicht auf. Der spielgleiche
Checkpoint erwartet deshalb die Tycho-Installation und ist auf aktuellem Code
als `behavior_regression` rot.

### Scorefenster verdrängt kritische R&D-Verteidigung

D23 sowie D26-D28, D31-D33 und D37 wählen Credits, obwohl die Rohbewertung
ICE vor R&D jeweils um ungefähr 3.963 bis 4.949 Punkte vorzieht. Bereits vor
D23 hatte der Runner R&D wiederholt erfolgreich angegriffen; weitere
Zugriffe führten zu Trashs und gestohlenen Agenden.

Die vorhandenen Schichttests sind grün, wenn das R&D-ICE direkt als
`overrideChoice` an die Arbitration übergeben wird. Im produktiven Matchpfad
mappt `corp.create_score_window` jedoch Remote-ICE und führt zunächst einen
Basic Credit als Override-Kandidaten. Das globale Rohscore-ICE erreicht diese
Zweier-Arbitration nicht. Der exakte D23-Checkpoint bleibt daher rot, obwohl
der engere Unit-Vertrag grün ist.

### Night Shift verliert gegen einen Basic Credit

In D82-D84, D89-D90, D125-D127 und D131-D133 ist `Night Shift` legal und mit
2001 Punkten der Rohscore-Sieger. Der Basic Credit liegt je nach Zustand bei
908 bis 1876. Kein Agenda-Draw-Risikomalus ist vorhanden.

Zwei produktive Unterpfade erklären den Rückschritt:

- Bei D82/D125 mappt das Scorefenster zunächst Draw oder Remote-Support und
  arbitriert danach gegen Basic Credit; Night Shift bleibt trotz Rohscore-Sieg
  außerhalb dieses Vergleichs.
- Bei D132 mappt das Scorefenster den Basic Credit direkt. Night Shift verliert
  mit nur 125 Punkten Abstand an der geschützten Mapping-Schwelle 720.

Der bereits vorhandene Match-e676-Checkpoint „Night Shift statt inferiorer
Reserve-Credit“ ist grün, ebenso seine Gegenprobe bei leerem R&D. Der neue
Checkpoint belegt daher eine fehlende produktive Komposition, nicht das Fehlen
der Kartenbewertung.

### Discard behandelt Agenda-Duplikate pauschal als wertvoll

D135 verwirft Night Shift und hält zwei Tycho Extension. Die generische
Discard-Logik wendet ihre Duplikatstrafe ausdrücklich nur auf Nicht-Agenden an,
während Agenden einen hohen Grundwert behalten. Im konkreten Stand hat die
Corp vier Agendapunkte und benötigt nur eine Tycho zum Sieg. Der spielgleiche
Checkpoint verlangt deshalb, Night Shift zu halten und eine überzählige Tycho
abzuwerfen; er ist als `behavior_regression` rot.

### Corporate War besitzt Signale, aber keinen Score-Consumer

Der aktive und kompilierte Hint enthalten
`economy.corp_threshold_burst`,
`score.economy_conditional_burst`,
`risk.requires_corp_credit_threshold` und
`risk.economy_crash_on_score`. Die Score-Aktion konsumiert diese Signale nicht
und protokolliert den Tradeoff daher nicht. D106 bleibt bewusst eine erlaubte
dringende Drei-Punkte-Scoreaktion bei zwei Credits; der rote Checkpoint fordert
nur einen produktiven, beobachtbaren Conditional-Economy-Component. Die
vorhandene Sechs-Credit-Closeout-Gegenprobe bleibt grün.

## Vollständiger Deck-Hint-/Consumer-Audit

Deck: `Rent to Own War Engine`, 47 Karten, 22 unterschiedliche Definitionen.  
Auditmenge: 22/22, Ausschlussmenge: 0.  
Resultat: `failed`, 3 Blocker, 0 Warnungen.

Ermittelte Strategie-Consumer:

- primär: `corp.tag_trace_punish`, `corp.fast_advance`,
  `corp.economy_rez_reserve`;
- sekundär: `corp.damage_kill`, `corp.rush_score`;
- Search- und Remote-Contest-Tools: keine.

Die drei Blocker bedeuten nicht, dass die aktuell aktiven Kartenhints
inhaltlich komplett falsch sind. Der Fehler entsteht zwischen Active Hint und
Compiled Hint:

| Karte | Active Hint | zusätzlich kompilierter Effekt | Überlappung |
| --- | --- | --- | --- |
| Corporate War | einmal Economy +12 bei Score | noch einmal Economy +12 | gleicher Effektkern |
| Ball and Chain | einmal Run Tax 2 beim Encounter | noch einmal Run Tax 2 | gleicher Effektkern |
| Wall of Ice | Damage 4 beim Encounter | zusätzlich Damage 2 | gleicher Damage-Kern mit widersprüchlichem Betrag |

Die jeweils anderen kompilierten Wirkungen bleiben legitim:
`counter_economy` bei Corporate War, zukünftiger Encounter-Effekt bei Ball and
Chain sowie `remote_protection` und `etr` bei Wall of Ice.

Git-Blame zeigt, dass die problematischen Compiled-Effekte überwiegend seit
`41a0d8f1c` vom 29.05.2026 bestehen; der zusätzliche Wall-of-Ice-Damagewert
stammt aus `30e2df5c2` desselben Tages. Die später überarbeiteten aktiven Hints
sind korrekt und haben diese Duplikate nicht neu eingeführt. Die globale
Hint-Generierung meldet trotz der Überlappungen `OK`, weil ihr bisheriger
Vertrag Struktur und Ableitbarkeit, nicht jeden semantisch überlappenden
Effektkern prüft. Der deckbezogene Audit schließt genau diese Gate-Lücke.

## Unveränderte Baseline

Auf dem Ausgangsstand vor jedem Produktionsfix:

- AI-Testshard 1: 132 Dateien, 952 Tests, grün;
- AI-Testshard 2: 132 Dateien, 1014 Tests, grün;
- AI-Testshard 3: 132 Dateien, 851 Tests, grün;
- gesamt: 396 Testdateien, 2817 Tests, grün;
- AI-Typecheck: grün;
- Hint-Compiled-, Derived-Facts-, Inspector-, Overlay-, Signal-, Metadata- und
  Normalization-Gates: grün;
- AI-Source-Structure: bereits auf unverändertem Ausgangsstand rot wegen vier
  bekannter Dateigrößenüberschreitungen; kein Match-74e2369-Fehler.

Angrenzende Gegenverträge vor dem Fix: 43/43 grün. Darunter:

- früherer echter Night-Shift-Matchcheckpoint und leerer-R&D-Gegenprobe;
- Tycho nur bei Same-Turn-Project-Consultants-Konvertierung;
- R&D-ICE darf einen schlechten Remote-Supportpfad unterbrechen;
- sichere Scorefenster bleiben geschützt;
- Corporate War darf bei sechs Credits dringend geschlossen werden;
- bereits normalisierte Compiled-Hint-Mehrfacheffekte bleiben getrennt.

## Rote Evidence vor Produktionsänderungen

Alle fünf Captures verwenden Strict-Warmup ab D1, haben null Warmup-Drifts und
enthalten TacticalPlan, PlanPortfolio sowie StrategicIntent:

1. D19: Hostile Takeover statt Tycho Extension;
2. D23: Basic Credit statt Wall of Static vor R&D;
3. D82: Basic Credit statt Night Shift;
4. D135: Night Shift statt überzähliger Tycho abgeworfen;
5. D106: dringender Corporate-War-Score ohne Conditional-Economy-Consumer.

Alle fünf scheitern ausschließlich mit `behavior_regression`. Die drei
Compiled-Hint-Überlappungen sind zusätzlich als rote Schichtverträge gesichert;
drei Erhaltungsproben für die jeweils legitimen unterschiedlichen Wirkungen
sind grün.

## Nicht eigenständig umzustimmende Entscheidungen

D101/D104 treiben Corporate War unter die Zwölf-Credit-Schwelle, können bei
Runner-Matchpoint und Drei-Punkte-Druck aber strategisch richtig sein.
D117/D120 installieren beziehungsweise rezzen BBS in einer geschützten
Remote; Tax-, Bluff- und Trash-Kosten machen den Gegenwert ohne Simulation
nicht eindeutig. Diese Entscheidungen erhalten keinen eigenen Auswahlfix.
