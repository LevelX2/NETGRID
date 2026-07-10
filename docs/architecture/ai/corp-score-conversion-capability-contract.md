# Corp-Score-Conversion-Capability-Vertrag

## Zweck

Dieser Vertrag erweitert den bestehenden Tactical Plan
`corp.create_score_window` um einen alternativen Same-Turn-Conversion-Pfad.
Der Pfad beschreibt, wie eine konkrete Corp-Agenda aus HQ oder einem Server
mit einer zulässigen Kombination aus Installation, Aktionsgewinn,
Advancement-Platzierung, Advancement-Transfer und Basic Advances in einen
legalen `score_agenda`-Zustand überführt wird.

Es entsteht kein zweiter Scorecontroller. Geschütztes Remote-Scoring,
normales Advancen und Fast Advance bleiben alternative Pfade desselben
Scoreziels.

## Verantwortungsgrenzen

### Engine und LegalActions

Die Engine ist die einzige Autorität für:

- Legalität und Timing;
- Klick-, Credit-, Counter- und sonstige Kosten;
- erzeugte oder bewegte Mengen;
- Quell- und Zielbeschränkungen;
- Auswahlmodi und Wiederholbarkeit;
- Rez- und Zustandsvoraussetzungen;
- tatsächliche Auflösung und Revalidierung.

Eine LegalAction darf zusätzliche side-sichere Capability-Felder tragen. Der
Plan darf daraus eine zukünftige Sequenz projizieren, erzeugt aber keine
LegalAction und ersetzt keine `applyAction`-Validierung.

### ActionSemanticCandidate

Der ActionSemanticCandidate normalisiert eine aktuelle LegalAction für den
Plan. Er darf Capability-Felder transportieren und strategische Signale
ergänzen, aber keine fehlenden Beträge oder Zielregeln aus Kartentexten
erraten.

### AI-Hints

Hints beschreiben:

- strategische Rollen;
- Taktiksignale;
- Strategieanker und Line Support;
- Risiko-, Condition- und Constraint-Klassen;
- erwartete Test- und Benchmarkfamilien.

Hints beschreiben keine verbindlichen Kosten, Countermengen oder legalen
Ziele. Bei Widerspruch gewinnt immer die Engine.

### Tactical Plan

Der Tactical Plan:

- wählt eine konkrete Agenda und einen Zielserver;
- berechnet aus standardisierten Capabilities einen vollständigen Pfad;
- führt ein Klick-, Credit-, Counter- und Kartenbudget;
- bindet Folgeaktionen an dasselbe Ziel;
- reserviert benötigte Ressourcen;
- revalidiert nach jeder Zustandsänderung;
- hebt das ungeschützte Remote-Safety-Gate nur bei garantiertem
  Same-Turn-Closeout auf.

## Capability-Taxonomie

### `install_score_target`

- Quelle: aktuelle `install_card`-LegalAction einer Corp-Agenda.
- Effekt: Agenda wird in den angegebenen Server installiert.
- Ressourcen: aktuelle Aktions- und Installationskosten.
- Zielbindung: Agenda-Instance-ID und Server-ID.

### `gain_action_capacity`

- Quelle: aktuelle LegalAction mit Engine-semantischem Aktionsgewinn.
- Effekt: erhöht das noch verfügbare Klickbudget um den ausgewiesenen Betrag.
- Nettoeffekt: gewonnene Aktionen abzüglich der Kosten der auslösenden Aktion.
- Sofortiger Aktionsgewinn ist ein Same-Turn-Schritt. Start-of-turn- oder
  wiederkehrender Aktionsgewinn ist nur Vorbereitung für einen späteren Zug.

### `place_advancement`

- Quelle: aktuelle LegalAction mit
  `distribute_advancement_counters` oder gleichwertigem standardisiertem
  Enginevertrag.
- Effekt: legt eine bekannte Menge Advancement-Counter nach einem bekannten
  Verteilungsmodus.
- Zielbindung: nur Engine-zulässige installierte advancebare Karten.

### `move_advancement`

- Quelle: aktuelle LegalAction mit `move_advancement_counters`.
- Effekt: bewegt eine bekannte maximale oder verfügbare Countermenge von
  einer zulässigen Quelle auf ein zulässiges Ziel.
- Die Zielermittlung darf nicht von einer bezahlbaren Basic-Advance-Aktion
  abhängen.
- Ein Transfer darf exact-fit verwenden; „all“ bedeutet nicht, dass der Plan
  alle Counter bewegen muss.

### `basic_advance`

- Quelle: aktuelle `advance_card`-LegalAction.
- Effekt: ein Advancement-Counter.
- Ressourcen: ein Klick und ein Credit gemäß aktuellem Enginevertrag.

### `score_ready`

- Quelle: aktuelle `score_agenda`-LegalAction oder eine sichere Projektion,
  dass nach allen vorherigen deterministischen Schritten genau diese Action
  legal wird.
- `score_agenda` kostet im aktuellen Enginevertrag keinen Klick.

## ScorelineConversionPath

Ein Pfad enthält mindestens:

- `agendaCardId`;
- `targetServerId`;
- `advancementRequirement`;
- `initialAdvancementCounters`;
- `desiredAdvancementCounters`;
- `steps` in Ausführungsreihenfolge;
- `clicksRequired` und `clicksGenerated`;
- `creditsRequired`;
- verwendete Quellkarten und Counterreserven;
- `sameTurnGuaranteed`;
- `overadvanceReason`, falls der Zielwert über der Requirement liegt;
- Evidence und Abbruchgründe.

Der gewünschte Counterstand ist standardmäßig die Advancement Requirement.
Eine höhere Zielzahl ist nur zulässig, wenn eine sichtbare, Engine-/Hint-
gestützte Overadvance-Schwelle einen konkreten Mehrwert belegt.

## Reihenfolgeregeln

1. Sofortiger Aktionsgewinn darf vor oder während des Pfads liegen, wenn sein
   Nettoeffekt positiv und bezahlbar ist.
2. Eine Agenda muss installiert sein, bevor zielgebundene Counteraktionen sie
   auswählen können.
3. Countertransfer darf nur aus einer zum Ausführungszeitpunkt vorhandenen
   sichtbaren Quelle erfolgen.
4. Basic Advances und Counteraktionen dürfen gemischt werden.
5. `score_agenda` ist der Abschluss und wird sofort gewählt, sobald die
   gewünschte Schwelle erreicht ist.
6. Kein Zwischenschritt darf den vollständigen Closeout unfinanzierbar machen.

## Safety- und Reservierungsvertrag

- Eine ungeschützte Agenda-Installation ist nur zulässig, wenn der gesamte
  verbleibende Same-Turn-Pfad einschließlich Choices und Kosten garantiert
  erreichbar ist.
- Ohne vollständigen Pfad bleibt der bestehende Schutz-/Contestability-Blocker
  aktiv.
- Reservierte Advancement-Counter dürfen nicht für Credits oder andere
  Nebeneffekte ausgegeben werden.
- Reservierte Credits und Aktionen dürfen nicht für schwächere Alternativen
  verbraucht werden.
- Planbindung ist weich gegenüber Legalität: Wird ein Schritt illegal, wird
  neu geplant; es wird niemals eine alte Action-ID erzwungen.

## Aktuelles Karteninventar

Das Inventar basiert auf aktiven CardImplementations und aktiven AI-Hints.
Es beschreibt Planrelevanz, nicht Kartenfreischaltung.

### Direkte Advancement-Platzierung

| Karte | Enginefähigkeit | Planrolle | Aktueller Hintstatus |
| --- | --- | --- | --- |
| Management Shake-Up | 3, beliebig verteilt | Burst | Fast-Advance-Signale vorhanden; Benchmark fehlt |
| Project Consultants | 4, beliebig verteilt | großer Burst | Fast-Advance-Signale vorhanden; Benchmark fehlt |
| Systematic Layoffs | 2, beliebig verteilt | kleiner Burst | Signale und Benchmark vorhanden |
| Team Restructuring | je 1 auf bis zu 2 verschiedene Ziele | verteilte Unterstützung | Signale vorhanden; Benchmark fehlt |
| Chicago Branch | 2 auf ein Ziel, aktivierte Fähigkeit | wiederholbarer Burst | Fast-Advance-/Remote-Signale vorhanden; Benchmark fehlt |

### Advancement-Transfer

| Karte | Enginefähigkeit | Planrolle | Aktueller Hintstatus |
| --- | --- | --- | --- |
| Vapor Ops | beliebige Menge von der eigenen Karte | Counterbank und Transfer | starke Transfer-/Fast-Advance-Signale; grober PlanRole noch Economy; Benchmark fehlt |
| Falsified-Transactions Expert | bis zu 3 von gewählter Karte | Counter-Repositionierung | starke Transfer-/Fast-Advance-Signale; Benchmark fehlt |

### Sofortiger Aktionsgewinn

| Karte | Enginefähigkeit | Planrolle | Aktueller Hintstatus |
| --- | --- | --- | --- |
| Overtime Incentives | 2 Aktionen beim Spielen | Burst-Enabler | Action-Burst-Signale vorhanden; PlanRole noch Economy; kein Fast-Advance-Line-Support |
| Pacifica Regional AI | 1 Advancement-Counter gegen 1 Aktion | Counter-zu-Aktion | Fast-Advance-Engine-Anker vorhanden; Benchmark fehlt |
| Corporate Boon | 1 Boon-Counter gegen 1 Aktion, einmal pro Zug | situativer Enabler | Action-Tempo-Anker und Benchmark vorhanden |

### Wiederkehrender oder zukünftiger Aktionsgewinn

Diese Karten erhöhen ein späteres Startbudget oder erzeugen wiederkehrendes
Tempo. Sie sind keine während desselben Pfads neu spielbaren Sofortschritte,
wenn der Gewinn erst am nächsten Zugbeginn entsteht.

| Karte | Enginefähigkeit | Planrolle | Aktueller Hintstatus |
| --- | --- | --- | --- |
| Subsidiary Branch | +1 Aktion am Corp-Zugbeginn | nächster Zug | Action-Tempo-Anker und Benchmark vorhanden |
| Remote Facility | +1 Aktion am Corp-Zugbeginn | nächster Zug | Repeatable-Action-Signal; Benchmark fehlt |
| Nevinyrral | +1 Aktion am Corp-Zugbeginn mit Risiko | nächster Zug | Repeatable-Action-/Risikohints; Benchmark fehlt |
| Project Venice | Overadvance-basierter wiederkehrender Aktionsgewinn | Ziel und nächster Zug | Overadvance-/Action-Signale; Benchmark fehlt |

### Potenzielle Advancement-Counterquellen

Bei einem `chosen_card`-Transfer kann jede legal wählbare installierte Karte
mit sichtbaren Advancement-Countern Quelle sein. Der Plan darf die Quelle
nicht auf Fast-Advance-Karten begrenzen. Aktive Hints markieren derzeit unter
anderem folgende Counterbanken:

- CorpRunners' Shattered Remains;
- Experimental AI;
- Information Laundering;
- Pacifica Regional AI;
- Vacant Soulkiller;
- Vapor Ops;
- Virus Test Site;
- Cybertech Think Tank;
- Government Contract;
- LDL Traffic Analyzers;
- Raymond Ellison.

Die tatsächliche Transferzulässigkeit und Countermenge liefert ausschließlich
die Engine-Choice beziehungsweise Capability-Payload.

### Overadvance-Ziele

| Karte | Zielwert | Aktueller Hintstatus |
| --- | --- | --- |
| Project Babylon | zusätzliche Agendapunkte an Schwellen | Signale und Benchmark vorhanden |
| Project Venice | wiederkehrende Aktionen an Schwellen | Signale vorhanden; Benchmark fehlt |
| Project Zurich | wiederkehrende Credits an Schwellen | Signale vorhanden; Benchmark fehlt |

## Ausgeschlossene oder nur indirekte Karten

- Reine Counter-Cashout-Karten sind keine Advancement-Erzeuger. Sie können
  Ressourcenquelle eines separaten Transfers sein, dürfen aber nicht allein
  einen Scorepfad begründen.
- Reine Economyaktionen zählen nur, wenn ein konkreter Pfad durch Credits
  blockiert ist; sie sind keine Conversion-Capability.
- Start-of-turn-Aktionsquellen können ein zukünftiges Planbudget verbessern,
  aber keinen bereits laufenden Same-Turn-Pfad verlängern.
- Overadvance-Unterstützung ohne sichtbaren Zielnutzen hebt keine
  Exact-Fit-Präferenz auf.

## Audit-Invarianten

1. Jede aktuelle LegalAction mit Advancement-Platzierung, -Transfer oder
   Aktionsgewinn besitzt eine standardisierte Capability-Payload.
2. Jede aktive Karte mit entsprechender Enginefähigkeit besitzt mindestens
   das passende Taktiksignal.
3. Ein Hint darf keine Capability behaupten, die weder Enginevertrag noch
   zulässige abgeleitete Facts belegen.
4. Jede Capability ist mindestens einem PlanStep-Mapping zugeordnet.
5. Sofortiger und zukünftiger Aktionsgewinn sind unterscheidbar.
6. Transferquelle und -ziel werden aus Engineoptionen, nicht aus
   Basic-Advance-Aktionen abgeleitet.
7. Jede Kartenfamilie besitzt einen positiven und einen negativen Test.
8. Benchmarkabdeckung ist für alle unmittelbar ausführbaren
   Score-Conversion-Werkzeuge Pflicht.

