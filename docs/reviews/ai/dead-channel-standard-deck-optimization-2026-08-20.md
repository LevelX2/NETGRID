# Dead Channel – Standarddeck-Optimierung

Stand: 2026-08-20

## Ergebnis

`Dead Channel` wird in der getesteten v0.2-Liste als aktives Standarddeck
geführt. Das Deck besitzt 45 Karten, neun Agenda-Punkte und drei Agendakarten.
Sein primärer Abschluss ist die Flatline durch kumulierten Zugriffs-, ICE- und
Tag-Schaden; Remote Scoring bleibt der Ausweichplan.

## Vergleich

Alle Varianten liefen mit harter aktueller KI gegen dieselben drei
Runner-Archetypen:

- `R&D Express – Switchyard`
- `Classic Runner – Prep Economy Pressure`
- `Skivviss Mill Pressure`

Je Variante wurden neun feste Vergleichsseeds und neun unabhängige
Holdout-Seeds ausgewertet. Technische Abbrüche wurden ursachenbezogen behoben
und danach exakt reproduziert; nur reguläre Endzustände zählen.

| Variante | Änderung gegenüber v0.2 | Vergleich | Holdout | Gesamt | Corp-Abschlüsse |
| --- | --- | ---: | ---: | ---: | --- |
| v0.2 | Basiskandidat | 9:0 | 5:4 | **14:4** | 11 Flatlines, 3 Agenda-Siege |
| v0.3 | 3 Cybertech Think Tank → 3 Marked Accounts | 8:1 | 4:5 | 12:6 | 7 Flatlines, 5 Agenda-Siege |
| v0.4 | 1 Think Tank → 1 Marked Accounts | 6:3 | 6:3 | 12:6 | 11 Flatlines, 1 Agenda-Sieg |
| v0.5 | 3 Manhunt → 3 Punitive Counterstrike | 8:1 | 4:5 | 12:6 | 11 Flatlines, 1 Agenda-Sieg |

Die v0.1-Vorversion mit sieben Agendakarten und ausschließlich Sentry-ICE
verlor sieben von neun Partien und erzielte keine Flatline. Sie wurde vor der
18er-Variantenmatrix verworfen.

## Warum v0.2 gewinnt

- Die geringe Agendadichte zwingt den Runner häufiger in echte Ambush- und
  Schadensentscheidungen. Mehr Marked Accounts verbesserten zwar die
  Score-Redundanz, wurden aber zu oft früh gestohlen.
- Setup!, Virus Test Site, TRAP! und Fetal AI komprimieren die Runner-Hand aus
  verschiedenen Zonen und Timings. Brain Wash, Fatal Attractor, Data Darts,
  Hunting Pack, Laser Wire und Nerve Labyrinth setzen den Druck während Runs
  fort.
- City Surveillance und Manhunt liefern Tagfenster; Scorched Earth bleibt der
  aktive Abschluss. Der billigere Punitive-Counterstrike-Tausch sah lokal
  attraktiv aus, verschlechterte aber die vollständige Holdout-Matrix.
- Cybertech Think Tank wurde in den ersten Vergleichsspielen selten aktiv,
  doch seine vollständige Entfernung schwächte den Gesamtmix stärker als die
  zusätzliche Agenda-Redundanz half.

## Finale Liste

### Agenden – 3

- 1× Corporate Headhunters
- 2× Fetal AI

### Assets – 13

- 2× TRAP!
- 3× Virus Test Site
- 3× Setup!
- 3× Cybertech Think Tank
- 2× City Surveillance

### Operationen – 14

- 3× Accounts Receivable
- 3× Efficiency Experts
- 2× Night Shift
- 3× Manhunt
- 3× Scorched Earth

### ICE – 15

- 3× Brain Wash
- 3× Fatal Attractor
- 2× Data Darts
- 1× Hunting Pack
- 3× Laser Wire
- 3× Nerve Labyrinth

## Technische Befunde aus der Matrix

- `SP-087`: Ein alter Ambush-Plan beanspruchte den Advance-Schritt einer
  inzwischen exakt gebundenen Scorelinie. Der Ambush wird nun beim Übergang
  an `corp.score_agenda` beendet.
- `SP-089`: Eine Engine-zertifizierte Mehrzug-Scorefortsetzung veröffentlichte
  eine Kreditreserve, klassifizierte den dadurch vorübergehend blockierten
  Advance aber nicht. Der Score-Owner weist diesen Advance nun explizit bis
  zur Finanzierung zurück.
- `SP-090`: Jack-out reichte seine LegalAction nicht an die Run-End-Bereinigung
  weiter. Dadurch konnte verpflichtender Programmtrash nicht prevention- und
  replay-sicher aufgelöst werden. Die LegalAction bleibt jetzt vollständig
  erhalten.

Nach den Fixes sind alle gewerteten Replays deterministisch und frei von
Illegal Actions, Fallbacks und Timeouts.
