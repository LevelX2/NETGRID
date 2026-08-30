# Dead Channel – Standarddeck-Optimierung

Stand: 2026-08-20

## Ergebnis

`Dead Channel` wird in der getesteten legalen v1.1-Liste als aktives
Standarddeck geführt. Das Deck besitzt 45 Karten, 21 Agenda-Punkte und acht
Agendakarten. Es erfüllt damit Regel 1.4.6(b). Sein primärer Abschluss bleibt
die Flatline durch kumulierten Zugriffs-, ICE- und Tag-Schaden; die eng mit
dem Schadensplan verzahnte Agenda-Linie ist ein belastbarer zweiter Weg.

## Vergleich

Alle Varianten liefen mit harter aktueller KI gegen dieselben drei
Runner-Archetypen:

- `R&D Express – Switchyard`
- `Classic Runner – Prep Economy Pressure`
- `Skivviss Mill Pressure`

Je Variante wurden neun feste Vergleichsseeds und neun unabhängige
Holdout-Seeds ausgewertet. Technische Abbrüche wurden ursachenbezogen behoben
und danach exakt reproduziert; nur reguläre Endzustände zählen.

| Variante                  | Agenda-Paket und strukturelle Kürzung                                              |   Gesamt | Corp-Abschlüsse                 |       Technisch gültig |
| ------------------------- | ---------------------------------------------------------------------------------- | -------: | ------------------------------- | ---------------------: |
| v1 Access Grid            | 3 Fetal / 3 Marked / 1 Headhunters / 1 Bioweapons; ohne Think Tank und Night Shift |     13:5 | 6 Flatlines, 7 Agenda-Siege     | 18/18 nach Ursachenfix |
| v2 Tag Hunt               | 3 Fetal / 3 Marked / 2 Headhunters; ohne Think Tank und Night Shift                |     13:5 | 9 Flatlines, 4 Agenda-Siege     |                  18/18 |
| v3 Sparse Tycho           | 3 Fetal / 3 Tycho; ohne Think Tank                                                 |      9:9 | 4 Flatlines, 5 Agenda-Siege     |                  18/18 |
| v4 Sparse Overthrow       | 3 Political Overthrow / 1 Marked; ein Think Tank weniger                           |     12:6 | 4 Flatlines, 8 Agenda-Siege     | 18/18 nach Ursachenfix |
| **v5 Damage Engine**      | **3 Fetal / 3 Marked / 2 Bioweapons; ohne Think Tank und Night Shift**             | **15:3** | **8 Flatlines, 7 Agenda-Siege** |              **18/18** |
| v6 Sparse Tycho ohne Draw | 3 Fetal / 3 Tycho; ein Think Tank und beide Night Shift weniger                    |      9:9 | 6 Flatlines, 3 Agenda-Siege     |                  18/18 |

Die frühere 9-Punkte-Liste und ihre Ergebnisse sind nur Diagnoseevidence. Sie
war nach Regel 1.4.6(b) kein legales 45-Karten-Standarddeck und wird nicht als
Leistungsnachweis für die finale Auswahl verwendet.

## Warum v1.1 gewinnt

- Das Paket aus Fetal AI, Marked Accounts und Bioweapons Engineering erfüllt
  die Agenda-Vorgabe, ohne einen fremden dritten Deckplan einzuführen. Alle
  drei Agenden unterstützen Remote-Bluffs, Zugriffsschaden oder den
  sekundären Scoreabschluss.
- Setup!, Virus Test Site, TRAP! und Fetal AI komprimieren die Runner-Hand aus
  verschiedenen Zonen und Timings. Brain Wash, Fatal Attractor, Data Darts,
  Hunting Pack, Laser Wire und Nerve Labyrinth setzen den Druck während Runs
  fort.
- City Surveillance und Manhunt liefern Tagfenster; Scorched Earth bleibt der
  aktive Abschluss. Diese Linie blieb in allen starken legalen Varianten
  vollständig erhalten.
- Cybertech Think Tank und Night Shift waren die schwächsten Slots unter der
  gesetzlichen Agenda-Erweiterung. Ihre vollständige Kürzung hält das Deck bei
  45 Karten und bewahrt die aktive Flatline-Economy.

## Finale Liste

### Agenden – 8 / 21 Punkte

- 3× Fetal AI
- 3× Marked Accounts
- 2× Bioweapons Engineering

### Assets – 10

- 2× TRAP!
- 3× Virus Test Site
- 3× Setup!
- 2× City Surveillance

### Operationen – 12

- 3× Accounts Receivable
- 3× Efficiency Experts
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
- `SP-092`: Ein terminaler Remote-Contest mit `blocked_unbreakable` erzeugte
  zwar den korrekten Coverage-Need, veröffentlichte ihn aber nicht am
  Remote-Parent. Der gebundene Draw blieb dadurch produktiv, jedoch ohne
  ausführbaren Owner. Matchpoint-Remote und Coverage-Plan verwenden jetzt
  denselben exakten Need; der reproduzierte Seed endet regulär statt mit
  `missing_plan_module_coverage`.

Nach dem Ursachenfix wurde die gewählte v1.1-Liste auf allen 18 Seeds erneut
ausgeführt: 15 Corp-Siege, drei Runner-Siege, acht Flatlines, sieben
Agenda-Siege, 18 deterministische Replays und kein Runtime-Abbruch.

Der gesonderte Katalogaudit steht in
`docs/reviews/ai/corp-standard-deck-agenda-legality-audit-2026-08-20.md`.
