# AI-Match-9FEF-Decision-Audit

Status: Red-Evidence auf aktuellem Code gesichert

## Match und technische Evidence

- Match: `match_9fef30abd4b16341`
- Modus: `human_corp_vs_runner_ai`
- KI: Runner, Schwierigkeit `hard`
- Seed: `match-mrooxm5v-1dhlzuw`
- Ergebnis: Corp-Sieg durch Agenda-Punkte
- Endzustand: StateVersion 273, StateHash `fnv1a:232a7f4d`
- Runtimequelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
  read-only
- Replay: 274 Events, keine Indexlücke und keine Snapshot-Hash-Abweichung
- Decision-Coverage: 161 erwartet, 161 klassifiziert, keine fehlenden,
  verwaisten, doppelten oder typabweichenden Traces

Klassifikation aller 161 Einzelaufgaben:

- 43 erzwungen oder im Wesentlichen erzwungen
- 94 plausibel oder fachlich vertretbar
- 19 konkrete Fehlentscheidungen in acht Fehlergruppen
- 5 nicht freigabereif

Trace-Vollständigkeit belegt die Nachvollziehbarkeit, nicht die semantische
Richtigkeit.

## Freigegebene Fehlergruppen und Akzeptanzverträge

### Punkt 1 – Priority Wreck ohne wirksame Folgechoice

D48/SV84 und D75/SV128 spielten Priority Wreck; D49/SV85 und D76/SV129
wählten jeweils `pay_0`. Erwartet wird entweder ein positiver,
reserveverträglicher Betrag oder die Wahl einer produktiveren Elternaktion.
Die Child-Choice muss den Parent-Score beeinflussen.

### Punkt 2 – Jettison-Ice-Fenster und Discard

D26/SV49, D31/SV55 und D34/SV58 verbrauchten das geeignete Erfolgsfenster
ohne Folgeaktion und warfen die einzige Jettison-Kopie ab. Erwartet wird ein
sichtbar ausführbarer HQ-Erfolg-plus-Jettison-Plan oder wenigstens der Erhalt
der konkreten ICE-Control-Option gegenüber weniger kritischem Discard.

### Punkt 3 – Restrictive Net Zoning auf Archives

D66/SV108 und D159/SV265 bewerteten sämtliche Ziele gleich und wählten
Archives nur durch Action-Reihenfolge. Erwartet wird ein Ranking nach
sichtbarer zukünftiger ICE-Installationswahrscheinlichkeit und strategischem
Serverwert. Archives ist ohne konkrete Evidence kein Default; eine späte
Installation ohne Zukunftshorizont darf unterbleiben. Der fehlerhafte
Corp-`install_discount` im Hint ist zu entfernen.

### Punkt 4 – Remote-1-Prüfrun versus unbezahlbarer Vollrun

D88 bis D91 bereiteten drei Klicks lang einen vermeintlich erreichbaren
Remote-1-Run vor, obwohl mehrere öffentliche ICE, öffentliche
Stärkemodifikatoren und zwei unrezzte ICE bekannt waren. D92 brach nach dem
Rez von Fire Wall korrekt vor dem Bezahlen ab.

Ein sofortiger Prüfrun kann dagegen fachlich sinnvoll sein: Das äußere ICE
aufdecken, Corp-Rez-Credits binden und vor dem ersten nicht sinnvoll
bezahlbaren ICE auschecken. Der Fix darf diesen Runstart nicht pauschal
unterdrücken. Er muss die falsche Vollrun-Vorbereitung und insbesondere das
Brechen eines ICE ohne finanzierbaren Restpfad verhindern.

### Punkt 5 – Wiederholte teure R&D-Runs

D95/SV161 und D115/SV192 zahlten erneut acht Credits für bekannte R&D-Pfade,
obwohl HQ beziehungsweise Draw billiger und höher bewertet waren. Erwartet
wird Arbitration anhand der aktionsspezifischen Vollkosten, jüngster
Serverkosten und der notwendigen Contest-Reserve.

### Punkt 6 – Unterfinanzierte HQ-Probe

D109/SV180 startete mit sechs Credits einen HQ-Run gegen ein öffentlich
bekanntes unrezztes ICE; Draw war höher bewertet. D110 brach nach dem Rez von
Endless Corridor korrekt ab. Erwartet wird entweder ein bewusst als Probe
bewerteter Run mit passender Informations-/Rez-Tax-Begründung oder Aufbau bis
zu einem finanzierbaren Pfad, nicht die Behauptung eines erreichbaren
Vollruns.

### Punkt 7 – Funding ohne ausführbare Folgeaktion

D127/SV209 und D128/SV210 nahmen je einen Credit für einen R&D-Plan; D129 zog
trotzdem eine Karte. Erwartet wird ein Done-Gate aus Zielbudget, verbleibenden
Klicks und unmittelbar ausführbarer Folgeaktion, bevor Funding-Klicks den
Raw-Score-Sieger verdrängen.

### Punkt 8 – Remote-2-Run ohne Access- und Endspielreserve

D143/SV241 behandelte ein unrezztes ICE als kostenfreien Pfad, gab nach dem
Rez von Reinforced Wall alle zwölf Credits fürs Brechen aus und konnte
Braindance Campaign anschließend nicht trashen. Erwartet wird eine getrennte
Bewertung von Probe, Break-/Restpfad, Access-/Trash-Payoff und strategischer
Reserve. Das Brechen ist abzulehnen, wenn danach kein sinnvoller Payoff oder
dringenderer Contest mehr finanzierbar bleibt.

## Nicht freigabereif

D1, D42, D137, D158 und D160 bleiben außerhalb der Verhaltensänderung. D137
ist insbesondere eine mögliche valide Rez-Tax-Probe und darf nicht durch eine
breite Run-Abwertung als Fehler konserviert werden.

## Deck- und Kartenabgrenzung

Der Decksnapshot umfasst 45 Karten und 19 eindeutige Karten. Eurocorpse ist
nicht enthalten und bleibt Nicht-Ziel. Broker darf pro Kopie und Zug nur in
dem von der Rules Engine angebotenen Umfang benutzt werden. Eine generische
wiederholbare Hintergrundaktion darf mehrfach gewählt werden, wenn sie legal
und gegenüber den Alternativen sinnvoll ist; daraus folgt keine Aufweichung
der Broker-Kartenregel.

## Reproduktion auf aktuellem Code

Vierzehn spielgleiche Fixtures wurden mit dem produktiven Chooser und
side-sicherem Eventpräfix capturiert. Die Captures bis einschließlich D95
liefen mit `warmupPolicy: strict` ohne Drift. Ab D109 wurde der Rebase bewusst
und ausschließlich wegen einer bereits korrigierten früheren Entscheidung
verwendet:

- Historisch wählte D95 `runner.start_run.rd`.
- Der aktuelle Chooser wählt im unveränderten D95-Checkpoint
  `runner.start_run.hq`.
- Bis D159 gibt es genau diese eine Warmup-Abweichung; der kompatible Suffix
  nach D95 wird für den jeweiligen Zielzustand wiederhergestellt.

Der direkte Checkpoint-Lauf ergibt:

- 12 Zielerwartungen rot, jeweils ausschließlich `behavior_regression`;
- D95 bereits grün und deshalb kein zusätzlicher Verhaltensfix;
- D92 als historische positive Checkout-Gegenprobe grün;
- der bestehende frühe Unknown-ICE-Prüfrun aus Match E8886 grün.

Damit bleibt die fachliche Grenze explizit: Ein Informationsrun darf beginnen.
Die KI soll vor einem unbezahlbaren Break auschecken und darf nicht mehrere
Funding-Klicks als vermeintliche Vollrun-Vorbereitung verschwenden.
