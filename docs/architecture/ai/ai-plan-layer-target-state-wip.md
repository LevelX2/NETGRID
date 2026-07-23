# KI-Planebene – modulares Zielkonzept

Status: **Work in Progress**
Dokumentversion: `0.1`
Stand: 2026-07-23
Verantwortlicher Architekturprozess:
`ai-plan-layer-target-concept-process-2026-07-23.md`

## 1. Zweck und Führungsanspruch

Dieses Dokument beschreibt den angestrebten Zielzustand der produktiven
NETGRID-KI-Planebene. Es führt die bislang verteilten Verträge für
Deckstrategie, Strategic Intent, Tactical Goals, Tactical Plans,
PlanPortfolio, Ressourcenrouten, Follow-up-Budgets und LegalAction-Auswahl zu
einem gemeinsamen Modell zusammen.

Die Leitentscheidung lautet:

> Freiwillige KI-Aktionen werden von Plänen ausgeführt. Der Scheduler wählt
> zuerst einen Plan und dessen nächsten Step. Erst danach wird innerhalb dieses
> Steps die beste vorhandene LegalAction ausgewählt.

Das Dokument ist ausdrücklich ein WIP. Der gemeinsame Planrahmen soll früh
stabil werden. Einzelne Planmodule dürfen danach schrittweise verfeinert
werden, ohne Lebenszyklus, Scheduler oder Action-Vertrag erneut grundsätzlich
zu verändern.

Dieses Dokument ist:

- Zielarchitektur, nicht Beschreibung des vollständig erreichten Ist-Stands;
- spätere Quelle für einen separaten sequenziellen Implementierungsplan;
- fortlaufend zu aktualisieren, wenn Spielanalysen neue Plananforderungen
  belastbar belegen;
- kein Ersatz für die Engine-, Hidden-Info- oder LegalAction-Verträge.

## 2. Entscheidungsstatus im WIP

Festlegungen werden in drei Reifegrade getrennt:

- **Kernentscheidung**: Teil des stabilen gemeinsamen Rahmens. Änderungen
  verlangen eine ausdrückliche Architekturentscheidung.
- **Arbeitsannahme**: belastbare aktuelle Zielrichtung, aber noch durch
  Implementierung oder weitere Spielanalysen zu prüfen.
- **Offen**: Detail ist noch nicht entschieden und darf nicht stillschweigend
  in der Implementierung festgeschrieben werden.

Der Änderungsverlauf steht am Ende dieses Dokuments. Neue Detailregeln sollen
immer angeben, ob sie den gemeinsamen Kernel oder nur ein Planmodul betreffen.

## 3. Ausgangsproblem

Die aktuelle Runtime besitzt bereits:

- Deckstrategie und Strategic Intent;
- Tactical Goals und Tactical Plans;
- Plan-Memory und PlanPortfolio;
- Foreground-, Background- und Interrupt-Rollen;
- Credit- und Action-Demands;
- Funding- und Action-Capacity-Routen;
- Follow-up-Budgets;
- Action-Semantik und eine detaillierte Decision Chain.

In gespeicherten Spielen ist dennoch sichtbar, dass der ausgewählte Plan
teilweise nur diagnostisch wirkt. Globale Einzelaktionswerte,
Plan-Mapping-Anpassungen und nachgelagerte Override-Regeln können eine andere
Aktion wählen als die vom Plan verlangte.

Dadurch entstehen insbesondere:

- zeitlich begrenzte Vorbereitung ohne anschließende Konversion;
- planfremde Aktionen, weil sie als einzige einen positiven Rohscore besitzen;
- Aktionen mit erkanntem negativem Ergebnis, weil alle Alternativen noch
  negativer bewertet wurden;
- Planwechsel ohne fachliche Zustandsänderung;
- pauschale Wiederholungsstrafen trotz realen Kampagnenfortschritts;
- Background-Projekte, die den Vordergrund durch viele kleine Beiträge
  überstimmen können;
- `EndTurn` als normal bewertete Alternative statt als streng begrenzte
  Abschlussaktion.

Das Ziel ist nicht, diese Symptome durch weitere Scorekorrekturen zu
überdecken. Die Auswahlautorität muss strukturell auf die Planebene wechseln.

## 4. Kernziele

### 4.1 Plan-first

Der produktive Auswahlweg ist:

```text
Spielzustand verstehen
→ Planbestand aktualisieren
→ ausführenden Plan wählen oder fortsetzen
→ nächsten Plan-Step bestimmen
→ Step auf vorhandene LegalActions abbilden
→ beste Step-Aktion wählen
→ Aktion anwenden lassen
→ Ergebnis und Planfortschritt revalidieren
```

Es gibt keinen zweiten globalen Action-Wettbewerb, der den ausgewählten Plan
nachträglich ohne Planentscheidung ersetzen darf.

### 4.2 Stabiler gemeinsamer Rahmen

Alle Planmodule verwenden denselben Vertrag für:

- Erzeugung und Identität;
- Lebenszyklus;
- Rolle im Portfolio;
- Prioritätsklasse;
- Blocker;
- Steps und Fähigkeiten;
- Ressourcenbedarf und Reservierung;
- atomare Folgeaktionsketten;
- Fortschritt und Abschluss;
- Unterbrechung und Wiederaufnahme;
- Diagnostik, Redaction und Determinismus.

### 4.3 Modular verfeinerbare Fachlogik

Ein Planmodul besitzt seine fachliche Binnenlogik selbst. Beispielsweise darf
das R&D-Druckmodul später:

- bessere Highlighter-Fortschrittsmodelle;
- bekannte R&D-Sequenzen;
- neue Multiaccess-Karten;
- unterschiedliche Run-Routen;
- Siegdistanz und Zugriffsgrenznutzen

ergänzen, ohne dass der Scheduler einen neuen Sonderfall kennen muss.

Dasselbe gilt für Economy, Corp-Scoring, Tag-and-Bag, Remote-Aufbau,
Runner-Abwehr und andere Module.

### 4.4 Side-spezifische Intelligenz

Runner und Corp nutzen:

- einen gemeinsamen technischen Planrahmen;
- getrennte Scheduler-Policies;
- getrennte Planregistries;
- getrennte Planmodule;
- getrennte Prioritätskalibrierungen und Fortschrittsmodelle.

Ein generischer Mega-Scheduler mit einer gemeinsamen fachlichen Bewertung für
beide Seiten ist nicht Zielzustand.

### 4.5 Vollständige Handlungsabdeckung

Jede freiwillige Hauptaktion muss auf Folgendes zurückführbar sein:

```text
Planinstanz
→ Phase
→ Step
→ benötigte Fähigkeit oder Konversion
→ gewählte LegalAction
```

Erzwungene Engine-Fenster, Pflichtauswahlen, Run-Fortsetzungen,
Access-Auflösungen und Cleanup-Entscheidungen werden entweder:

- dem auslösenden Plan-Step zugeordnet oder
- durch einen gemeinsamen `window_resolution`-Mechanismus abgewickelt.

Sie bilden keinen konkurrierenden strategischen Plan.

## 5. Nicht-Ziele

- Die KI erzeugt keine LegalActions.
- Die Planebene setzt keine Regeln, Kosten, Ziele oder Timingfenster.
- Der Scheduler kennt keine gegnerischen Hidden-Zone-Daten.
- Karten-Sonderfälle werden nicht im Scheduler fest verdrahtet.
- Ein Planmodul darf keine globale Sonderpriorität außerhalb seines Vertrags
  installieren.
- Ein Planname ist kein nachträglich vergebbares Debugetikett.
- Feste Zahlenwerte dieses WIP sind keine endgültige Balancefreigabe.

## 6. Begriffe

### Deckstrategie

Stabiler, aus dem eigenen Deck abgeleiteter Prior. Sie beschreibt, welche
langfristigen Linien das Deck unterstützt, welche Rollen und Werkzeuge
vorhanden sind und wie vollständig eine Linie ist.

### Strategic Intent

Aktuell führende strategische Ausrichtung innerhalb der vom Deck gestützten
Möglichkeiten. Der Intent darf phasenabhängig wechseln, ist aber keine
konkrete Aktion.

### Planmodul

Wiederverwendbare fachliche Implementierung eines Plantyps, beispielsweise
`runner.pressure_central` oder `corp.score_agenda`.

### Planinstanz

Konkretes Vorhaben in einem Match, beispielsweise:

```text
runner.pressure_central
target: R&D
engine: Highlighter
phase: compound_access
```

Ein Planmodul kann mehrere Instanzen mit unterschiedlichen Zielen erzeugen,
wenn sein Vertrag dies erlaubt.

### Portfolio

Persistenter Bestand relevanter Planinstanzen der eigenen Seite. Er enthält
nicht nur den momentan ausführenden Plan.

### Executor

Die eine Planinstanz, die die aktuelle freiwillige Entscheidung besitzt.
Normalerweise ist dies der Vordergrundplan, bei einem zeitkritischen Fenster
der Interrupt.

### Phase

Fachlicher Abschnitt eines Plans, beispielsweise `fund_engine`,
`install_engine`, `compound_access` oder `closeout`.

### Step

Nächste konkrete Zielannäherung innerhalb einer Phase. Ein Step verlangt eine
Fähigkeit oder Konversion, aber zunächst keine bestimmte Action-ID.

### Route

Eine ausführbare Folge vorhandener LegalActions, mit der ein Step erfüllt
werden kann.

### Commitment

Verbindliche, vor Beginn auf Machbarkeit geprüfte Mehraktionsfolge. Credits,
Klicks, Quellen und Ziel werden dafür reserviert.

## 7. Gesamtarchitektur

```text
eigene Kartensemantik und Deckfähigkeiten
                    |
            Deckstrategieprofil
                    |
              Strategic Intent
                    |
        side-spezifische Planerkennung
                    |
      persistentes Runner-/Corp-Portfolio
                    |
       side-spezifischer PlanScheduler
          /          |           \
   Interrupt     Vordergrund    Backgrounds
          \          |           /
         ausführender Plan und Step
                    |
       Step-Routen aus LegalActions
                    |
        planlokale Action-Auswahl
                    |
               applyAction
                    |
      Ergebnis-/Fortschritts-Revalidierung
```

### 7.1 Gemeinsamer Plan-Kernel

Der Kernel ist zuständig für:

- Schema und Identität von Planinstanzen;
- StateVersion- und Side-Isolation;
- Lebenszyklusübergänge;
- Portfoliohaltung und deterministische Sortierung;
- Executor-Exklusivität;
- Prioritätsklassen und Hysterese;
- Parent-/Support-Beziehungen;
- Ressourcenreservierungen;
- Commitment-Schutz;
- globale Safety- und LegalAction-Invarianten;
- Ergebnisrückführung;
- redigierte Diagnostik.

Der Kernel ist nicht zuständig für:

- den fachlichen Wert eines R&D-Runs;
- die Auswahl eines Scoring-Remotes;
- die Reihenfolge einer Tag-/Damage-Kette;
- die beste Economy-Karte;
- Breaker-, ICE- oder Kartenfamilienwissen;
- planinterne Phasen oder Fortschrittsformeln.

### 7.2 Runner-Scheduler

Der Runner-Scheduler kennt runner-spezifisch:

- Agenda-Siegdistanz;
- Serverzugang und Run-Risiko;
- Breaker- und Rig-Abhängigkeiten;
- erfolgreiche Run- und Access-Fenster;
- Tags, Damage-Risiko und Handpuffer;
- zentrale und Remote-Drucklinien;
- Runner-Economy und Run-Credit-Pools.

### 7.3 Corp-Scheduler

Der Corp-Scheduler kennt corp-spezifisch:

- Scorefenster und Advancement-Pfade;
- Agendaexposition und Zentralserver-Schutzböden;
- Rez-Fenster und Rez-Reserve;
- Remote-Doktrin;
- Tag-, Trace-, Punish- und Damage-Sequenzen;
- ICE-Investition und Pfadkosten;
- Corp-Economy, Asset-Lebenszyklen und Agenda-Flood.

Runner- und Corp-Scheduler implementieren dieselben Kernel-Hooks, verwenden
aber keine gemeinsame fachliche Prioritätsfunktion.

## 8. Eingabe- und Ausgabegrenze

### 8.1 Zulässige Eingaben

Der Planer darf ausschließlich verwenden:

- aktuelle side-sichere `PlayerView`;
- aktuelle `LegalActions`;
- erlaubte `PublicEvents`;
- eigene bekannte Karten und eigene Deckmetadaten;
- eigene Deckstrategie und DeckCapabilities;
- side-sicheres Plan-, Access- und Belief-Memory;
- deterministische Match-, Turn- und StateVersion-Kontexte.

### 8.2 Ausgabe

Der produktive Scheduler liefert:

- genau eine vorhandene `actionId`;
- gegebenenfalls zulässige Choice-Werte;
- interne, redigierbare Plan- und Entscheidungsdiagnostik.

Er liefert niemals:

- eine neu erzeugte Aktion;
- eine ungeprüfte Alternative zur Engine-Aktion;
- einen veralteten Planbefehl gegen eine neue StateVersion.

## 9. Gemeinsamer Planmodul-Vertrag

Der folgende Typ ist konzeptionell. Die endgültigen TypeScript-Namen werden im
Implementierungsplan festgelegt.

```ts
type PlanModule = {
  moduleId: string;
  side: "runner" | "corp";
  executionClass:
    | "reactive_interrupt"
    | "bounded_sequence"
    | "recurring_cycle"
    | "development_project"
    | "strategic_campaign";

  discover(context): PlanProposal[];
  instantiate(proposal, context): PlanInstance;
  reconcile(instance, context): PlanReconciliation;
  evaluatePriority(instance, context): PlanPriority;
  proposeStep(instance, context): PlanStepProposal;
  buildRoutes(instance, step, legalActions, context): PlanRoute[];
  evaluateRoute(instance, step, route, context): RouteEvaluation;
  assessOutcome(instance, previousState, currentState): PlanOutcome;
  redact(instance, diagnostics): RedactedPlanDiagnostics;
};
```

### 9.1 `discover`

Erkennt, ob im aktuellen Zustand eine neue Planinstanz sinnvoll ist.

Beispiele:

- Highlighter plus R&D-Deckstrategie erzeugt eine R&D-Kampagne;
- ein mögliches Matchpoint-Remote erzeugt einen Contest-Plan;
- Corp-Hand plus Boardzustand erzeugt eine Scoreline;
- sichtbarer Tag-/Damage-Punish erzeugt einen Runner-Abwehrplan.

`discover` darf nicht bei jeder Entscheidung Duplikate desselben Plans
erzeugen.

### 9.2 `reconcile`

Prüft eine bestehende Instanz gegen den aktuellen Zustand:

- ist das Ziel noch vorhanden?
- wurde ein Blocker entfernt?
- ist die Strategie noch gestützt?
- wurde ein Meilenstein erreicht?
- ist der Plan abgeschlossen, suspendiert oder aufzugeben?
- haben fremde Aktionen oder neue Informationen seine Phase verändert?

### 9.3 `evaluatePriority`

Bewertet die Planinstanz, nicht ihre einzelnen LegalActions. Die Bewertung
liefert eine Prioritätsklasse und innerhalb dieser Klasse einen relativen
Planwert.

### 9.4 `proposeStep`

Bestimmt den fachlich nächsten Step. Ein Step kann beispielsweise verlangen:

- Liquidität aufbauen;
- eine bestimmte Coverage beschaffen;
- eine Engine installieren;
- einen Server angreifen;
- eine Agenda advancen;
- ein Tag erzeugen;
- Handpuffer herstellen.

### 9.5 `buildRoutes`

Übersetzt den Step in aktuell mögliche LegalAction-Routen. Diese Funktion
verwendet Action-Semantik, Kartenfähigkeiten, Kosten, Ziele und aktuelle
LegalActions.

### 9.6 `evaluateRoute`

Vergleicht nur Routen, die denselben Step erfüllen oder eine fachlich
zugelassene Step-Alternative darstellen.

### 9.7 `assessOutcome`

Fortschritt entsteht aus einer sichtbaren Zustandsänderung, nicht aus der
bloßen Ausführung einer Action-ID.

## 10. Planinstanz-Vertrag

Eine Planinstanz benötigt mindestens:

```ts
type PlanInstance = {
  instanceId: string;
  moduleId: string;
  side: "runner" | "corp";
  strategyLineIds: string[];

  executionClass: PlanExecutionClass;
  lifecycle: PlanLifecycle;
  portfolioRole?: PlanPortfolioRole;

  target?: PlanTarget;
  parentInstanceId?: string;
  supportsInstanceIds: string[];

  phase: string;
  milestone: string;
  moduleState: unknown;

  blockers: PlanBlocker[];
  resumeConditions: PlanCondition[];
  completionConditions: PlanCondition[];
  abandonmentConditions: PlanCondition[];

  resourceDemand: PlanResourceDemand;
  resourceReservation: PlanResourceReservation;
  commitment?: PlanCommitment;
  cadence?: PlanCadence;

  priority: PlanPriority;
  progress: PlanProgress;

  createdAtStateVersion: number;
  updatedAtStateVersion: number;
  evidence: string[];
};
```

### 10.1 Modulzustand

`moduleState` ist planintern versioniert. Nur das Modul interpretiert ihn.

Beispiele:

- R&D-Plan: Highlighter-Zähler, bekannte Zugriffstiefe, Topkartenfrische;
- Economy-Plan: Zielreserve, verfügbare Quellen, Auszahlungsfenster;
- Corp-Killplan: verfügbare Tagquelle, Damage-Summe, garantierte Trace-Stärke;
- Remote-Projekt: Zielserver, Schutzband, Rez-Reserve, nächste Härtungsstufe.

Der Scheduler darf daraus keine kartenspezifischen Sonderregeln ableiten.

## 11. Lebenszyklus

Der Zielvertrag verwendet einen einheitlichen Lebenszyklus:

```text
proposed
   |
   +--> dormant ----+
   |                |
   +--> ready ------+--> active --> completed
                        |   |
                        |   +--> blocked ----+
                        |                    |
                        +--> suspended ------+--> ready
                        |
                        +--> abandoned
```

### `proposed`

Das Modul hat einen Kandidaten erkannt. Er ist noch nicht in das Portfolio
aufgenommen.

### `dormant`

Strategisch relevanter Plan, dessen Aktivierungsbedingungen noch nicht
vorliegen. Beispiel: Corp-Killplan ohne aktuelle Tagmöglichkeit.

### `ready`

Plan kann jetzt einen fachlich gültigen Step ausführen.

### `active`

Plan befindet sich im Portfolio und arbeitet als Interrupt, Vordergrund oder
bewusst eingeplantes Background-Projekt.

### `blocked`

Plan ist relevant, kann aber wegen eines konkreten beseitigbaren Blockers
nicht fortfahren. Er benennt eine Resume Condition oder erzeugt einen
Supportbedarf.

### `suspended`

Plan wäre grundsätzlich ausführbar, wurde aber durch einen höherpriorisierten
Interrupt oder eine bewusst gewählte andere Linie zeitweise angehalten.

### `completed`

Abschlussbedingung erreicht. Der Plan wird nicht reaktiviert; ein späteres
gleichartiges Vorhaben erhält eine neue Instanz.

### `abandoned`

Ziel dauerhaft ungültig, Strategie verworfen oder Erfolg nicht mehr
realistisch. Der Grund ist verpflichtend zu diagnostizieren.

`progressing` ist kein eigener Lebenszykluszustand. Fortschritt ist ein
Ergebnis zwischen zwei StateVersions.

## 12. Portfolio und Ausführungsrollen

### 12.1 Rollen

Das Portfolio unterscheidet:

- höchstens einen `reactive_interrupt`;
- höchstens einen ausführenden `foreground`;
- mehrere persistente `background`-Projekte;
- beliebig viele fachlich relevante `dormant`, `blocked` oder `suspended`
  Instanzen innerhalb eines technisch begrenzten Speichers.

Die heutige Grenze von höchstens zwei Background-Projekten ist keine
fachliche Zielinvariante. Eine spätere technische Begrenzung muss:

- ausreichend hoch sein;
- deterministisch sein;
- Verdrängung sichtbar diagnostizieren;
- strategisch gebundene oder fortgeschrittene Projekte schützen.

### 12.2 Genau ein Executor

Bei jeder freiwilligen Entscheidung besitzt genau ein Plan die
Ausführungsautorität:

```text
Interrupt vorhanden?
  ja  → Interrupt ist Executor
  nein → Vordergrund ist Executor
```

Ein Background-Projekt darf:

- bei der Planwahl für einen zeitlich begrenzten Step in den Vordergrund
  wechseln;
- von einer Vordergrundaktion nebenbei profitieren;
- Ressourcen reservieren, wenn der Scheduler dies akzeptiert.

Es darf nicht durch die Addition vieler kleiner Beiträge den ausführenden
Vordergrundplan umgehen.

### 12.3 Wechselnde aktive Pläne

Mehrere Pläne dürfen über einen Zug oder mehrere Züge hinweg abwechselnd
handeln. Beispiel:

- eine R&D-Kampagne ist Vordergrund;
- ein Broker-Bankplan darf gemäß Cadence einmal laden;
- danach kehrt die R&D-Kampagne zurück.

Dieser Wechsel ist eine explizite Schedulerentscheidung. Die R&D-Kampagne
bleibt gespeichert und wird nicht neu entdeckt.

## 13. Scheduler-Zyklus

Der Scheduler läuft bei jeder neuen Entscheidung vollständig, aber nicht
gedächtnislos.

### Phase 0 – Engine-Fenster klassifizieren

- Pflichtentscheidung oder freiwillige Hauptaktion?
- aktuelle StateVersion und Seite prüfen;
- LegalActions übernehmen;
- veraltete Commitments invalidieren.

### Phase 1 – Side-sicheres Weltmodell aktualisieren

- sichtbare Boardänderungen;
- Credits, Klicks, Karten und Agenda-Punkte;
- neue Runs, Zugriffe, Tags, Damage und Rez-Ereignisse;
- bekannte Serverpfade;
- eigene neue Karten und Fähigkeiten;
- Plan-Memory und Fortschritt.

### Phase 2 – Strategic Intent revalidieren

- trägt die Deckstrategie die aktuelle Linie weiterhin?
- hat sich die Spielphase verändert?
- existiert ein Matchpoint- oder Survival-Kontext?
- ist eine Nebenlinie vorübergehend sinnvoller?

Deckstrategie bleibt Prior, aber kein Autopilot.

### Phase 3 – Planinstanzen reconciliieren

Für jede bestehende Instanz:

- Fortschritt prüfen;
- Phase aktualisieren;
- Blocker und Resume Conditions prüfen;
- Abschluss oder Aufgabe feststellen;
- Ressourcen und Cadence aktualisieren.

### Phase 4 – Neue Kandidaten entdecken

Runner- oder Corp-Registry fragt ihre Module nach neuen Planvorschlägen.
Duplikate mit gleichem Typ und Ziel werden zusammengeführt oder abgelehnt.

### Phase 5 – Interrupts prüfen

Zeitkritische Regel- oder Überlebensfenster werden vor normaler Planwahl
behandelt. Ein Interrupt suspendiert den Vordergrund, löscht ihn aber nicht.

### Phase 6 – Planprioritäten bestimmen

Alle ausführbaren Instanzen erhalten:

- Prioritätsklasse;
- Readiness;
- erwartete Konversion;
- Risiken und Opportunity Cost;
- Kontinuitäts- oder Wechselkosten.

### Phase 7 – Executor wählen oder fortsetzen

Der bisherige Vordergrund bleibt bevorzugt, solange:

- sein nächster Step fachlich gültig ist;
- kein höherer Prioritätsrang eingreift;
- kein ausreichend starker Challenger den Wechsel rechtfertigt;
- kein Commitment einen Wechsel verbietet.

### Phase 8 – Step bestimmen

Das gewählte Planmodul liefert genau einen aktuellen Step sowie erlaubte
Alternativ-Steps.

### Phase 9 – Step-Routen auf LegalActions abbilden

Nur vorhandene LegalActions werden verwendet. Nicht abbildbare Steps werden
als Blocker oder Supportbedarf zurückgegeben.

### Phase 10 – Planlokal Aktion wählen

Die beste Route des Steps wird gewählt. Globale Safety-Gates dürfen Aktionen
ausschließen, aber keine planfremde Aktion als Gewinner einsetzen.

### Phase 11 – Aktion anwenden lassen

`applyAction` bleibt alleinige Regelautorität und revalidiert den vollständigen
Action-Vertrag.

### Phase 12 – Ergebnis zurückführen

Nach der neuen StateVersion beginnt der Zyklus erneut. Das Modul bewertet:

- erwartete und tatsächliche Zustandsänderung;
- Planfortschritt;
- neue Blocker;
- Commitment-Fortsetzung;
- Phasenwechsel oder Abschluss.

## 14. Planpriorisierung

### 14.1 Lexikografische Prioritätsklassen

Nicht alle Pläne werden in einen einzigen beliebigen Zahlenraum geworfen.
Zuerst gilt eine fachliche Prioritätsklasse:

| Klasse | Bedeutung |
| --- | --- |
| P0 | erzwungenes Engine-/Auflösungsfenster |
| P1 | unmittelbar terminaler Sieg oder notwendige Verhinderung einer unmittelbar terminalen Niederlage |
| P2 | akutes Überleben, kritische Score-Threat oder irreversible Gefahr |
| P3 | auslaufende, stark konvertierbare Gelegenheit |
| P4 | aktiver strategischer Hauptplan |
| P5 | Setup-, Entwicklungs- und Supportplan mit konkretem Bedarf |
| P6 | neutraler Fallbackplan |

Ein P5-Plan darf keinen ausführbaren P2-Plan durch einen hohen lokalen
Actionscore verdrängen.

Bei mehreren P1-Plänen bewertet ein side-spezifischer Terminalsolver:

- Garantiegrad;
- benötigte Aktionen und Ressourcen;
- Reihenfolge;
- gegnerische Eingriffsmöglichkeit;
- eigene Sieg- gegenüber Niederlagenverhinderung.

### 14.2 Wert innerhalb einer Klasse

Innerhalb derselben Klasse darf ein relativer Planwert verwendet werden:

```text
Deckstrategie-Fit
+ aktuelle Readiness
+ erwartete Zielkonversion
+ Dringlichkeit
+ bereits erzielter Fortschritt
+ Informationswert
+ Kontinuitätswert
- harte und weiche Blocker
- Ressourcenlücke
- Risiko
- Opportunity Cost
- Wechselkosten
```

Die Komponenten sind planbezogen. Der Wert einer einzelnen Credit-Aktion
bestimmt nicht, ob der Economy-Plan strategisch wichtiger als ein Runplan ist.

### 14.3 Readiness

Readiness trennt:

- `executable_now`;
- `executable_with_support`;
- `waiting_for_condition`;
- `blocked`;
- `nonviable`.

Ein langfristig sehr attraktiver, aber noch wartender Killplan verdrängt
keinen aktuell ausführbaren Scoring-Plan. Er bleibt dennoch im Portfolio.

### 14.4 Hysterese

Ein Challenger ersetzt den aktuellen Vordergrund nur, wenn mindestens eine
Bedingung gilt:

- höhere Prioritätsklasse;
- aktueller Plan abgeschlossen oder aufgegeben;
- aktueller Plan hart blockiert und Challenger ausführbar;
- neue Information invalidiert das Ziel;
- Challenger überschreitet innerhalb derselben Klasse eine definierte
  Wechselmarge;
- aktueller Plan hat seine zugbezogene Cadence ausgeschöpft und gibt bewusst
  ab.

Ein bloßer Einzelaktionsscore ist kein Wechselgrund.

## 15. Steps, Fähigkeiten und LegalActions

### 15.1 Capability-first

Steps verlangen zunächst semantische Fähigkeiten:

```text
credits beschaffen
Karte ziehen
gezielt suchen
Breaker-Coverage herstellen
Handpuffer erhöhen
Serverzugriff beginnen
Run-Pfad modifizieren
Agenda installieren
Advancement erzeugen
Tag erzeugen
Damage konvertieren
ICE rezzen
```

Das Planmodul bestimmt, welche Fähigkeiten seinen Step erfüllen. Gemeinsame
Resolver finden dafür mögliche LegalActions.

### 15.2 Planlokale Routenauswahl

Beispiel: Ein R&D-Plan braucht 3 zusätzliche Credits.

Mögliche Routen:

- Livewire’s Contacts;
- drei Basic Credits;
- Bank-Cashout;
- eine verfügbare Economy-Ability.

Der Economy-Resolver bewertet diese Routen im Kontext des angefragten
R&D-Steps. Er startet nicht automatisch eine neue langfristige
Wirtschaftsstrategie.

### 15.3 Keine planfremde Rohscore-Rettung

Wenn ein Plan-Step keine gültige Route besitzt:

- wird der Plan blockiert;
- wird ein Supportplan angefordert;
- oder der Scheduler wählt einen anderen Plan.

Die Runtime darf nicht einfach die global am höchsten bewertete planfremde
LegalAction ausführen.

## 16. Parent-, Kind- und Supportpläne

### 16.1 Bedarf statt Zielverlust

Ein Vordergrundplan kann einen konkreten Bedarf veröffentlichen:

```text
need:
  capability: credits
  amount: 5
  deadline: next_runner_turn
  preserves: R&D campaign
```

Ein Economy-Plan oder Economy-Service erfüllt diesen Bedarf. Der übergeordnete
R&D-Plan bleibt als Parent erhalten.

### 16.2 Kindpläne

Kindpläne sind sinnvoll, wenn eine abgegrenzte Folge selbst Lebenszyklus und
Commitment benötigt:

- Bank auszahlen;
- bestimmte Coverage suchen und installieren;
- erfolgreiche Run-Konversion;
- Corp-Killsequenz ausführen.

Nach Abschluss kehrt die Autorität zum Parent zurück.

### 16.3 Mehrplannutzen

Eine Aktion darf mehreren Plänen helfen. Beispiel: Eine Economy-Karte
finanziert den Vordergrund und lädt zugleich eine Strategie-Engine.

Mehrplannutzen:

- ist ein begrenzter Tiebreaker zwischen bereits planverträglichen Routen;
- darf keinen Interrupt, Closeout oder notwendigen Vordergrund-Step
  überstimmen;
- wird nur bei realer Zustandsannäherung vergeben.

## 17. Ressourcen und Reservierungen

Der Scheduler verwaltet mindestens:

- Credits;
- Klicks oder zusätzliche Action Capacity;
- wiederkehrende und eingeschränkte Credit-Pools;
- Kartenquellen und Karteninstanzen;
- Counter und Bankbestände;
- Memory und Installationsslots;
- planrelevante Timingfenster.

### 17.1 Bedarf

Ein Plan gibt gewünschte und zwingende Bedarfe getrennt an:

```text
minimum: für ausführbare Route zwingend
reserve: nach dem Step zu bewahrender Puffer
target: wirtschaftlich gewünschter Stand
deadline: Same Turn, Next Turn oder langfristig
```

### 17.2 Reservierung

Reservierungen werden zentral auf Konflikte geprüft. Zwei Pläne dürfen nicht
denselben Credit, Klick oder Counter gleichzeitig als garantiert behandeln.

### 17.3 Freie Ressourcen

Ressourcen oberhalb akzeptierter Reservierungen dürfen andere Pläne nutzen.
Der Scheduler muss sichtbar diagnostizieren, welche Reserve einen ansonsten
legalen Step blockiert.

## 18. Atomare Commitments

Zeitlich oder sequenziell gebundene Effekte benötigen vor der ersten Aktion
eine vollständige Machbarkeitsprüfung.

### 18.1 Commitment-Vertrag

```ts
type PlanCommitment = {
  commitmentId: string;
  routeId: string;
  requiredSteps: string[];
  nextStepIndex: number;
  reservedClicks: number;
  reservedCredits: number;
  reservedSourceIds: string[];
  fixedTarget?: PlanTarget;
  expiresAt: "same_turn" | "window_end" | "next_turn";
  breakConditions: PlanCondition[];
};
```

### 18.2 Startbedingung

Eine Vorbereitung darf nur begonnen werden, wenn:

- alle zwingenden Folge-Steps semantisch bekannt sind;
- genügend Action Capacity vorhanden oder sicher erzeugbar ist;
- Ressourcen und Ziel erreichbar sind;
- kein bekannter harter Blocker die Konversion verhindert.

### 18.3 Bindung

Nach Beginn bleibt das Commitment führend. Ein Wechsel ist nur erlaubt bei:

- neuem höherpriorisiertem Interrupt;
- Engine- oder Gegnerereignis, das die Route invalidiert;
- erkanntem Regel-/Safety-Fehler;
- bereits erreichtem terminalem Zustand.

Ein neuer positiver Rohscore ist kein Abbruchgrund.

### 18.4 Beispiele

- Prearranged Drop → Agenda-Zugriff im selben Zug;
- Promises, Promises → Agenda-Zugriff im selben Zug;
- Run-Event → tatsächlicher Run und erforderliche Zielkonversion;
- Corp Chance Observation → Tag → Urban Renewal → Scorched Earth;
- Agenda installieren → dreimal advancen → im selben Zug scoren.

## 19. Fortschritt und Wiederholung

### 19.1 Outcome statt Action-ID

Fortschritt wird durch sichtbare Zielannäherung gemessen:

- Credits näher an Zielreserve;
- Coverage hergestellt;
- Engine installiert;
- Serverpfad günstiger oder zugänglich;
- Zugriffstiefe vergrößert;
- Agenda-Punkte gewonnen;
- Remote-Schutzband erreicht;
- Tag erzeugt;
- Damage-Lethalität erhöht;
- Blocker entfernt.

### 19.2 Wiederholung

Eine wiederholte Action-ID ist nicht automatisch Wiederholung im fachlichen
Sinn.

Beispiele:

- Highlighter-Runs mit wachsender Zugriffstiefe: echter Fortschritt;
- BBS mit verbleibenden Countern und konkretem Fundingziel: Fortschritt;
- Basic Credit bis zur nachgewiesenen Zielreserve: Fortschritt;
- derselbe HQ-Run ohne neue Information, Payoff oder Strategienutzen:
  möglicherweise Sättigung.

### 19.3 Marginaler Nutzen

Planmodule definieren selbst, wann der nächste gleichartige Step keinen
ausreichenden Grenznutzen mehr besitzt. Der Scheduler kennt nur das
standardisierte Ergebnis:

```text
progress
no_progress
regression
completed
invalidated
```

## 20. EndTurn-Vertrag

`EndTurn` ist kein strategischer Plan und keine normale wirtschaftliche
Alternative.

### 20.1 Kernregel

In einem freiwilligen Hauptfenster ist `EndTurn` bei verbleibender
Action Capacity grundsätzlich nicht zulässig, solange mindestens eine sichere
neutrale Fortschrittsaktion vorhanden ist. Im normalen NETGRID-Grundsystem
erfüllt der Basic Credit diese Bedingung.

### 20.2 Zulässige Fälle

- keine verbleibende Action Capacity;
- Engine erzwingt oder beendet den Zug;
- terminaler Spielzustand;
- später ausdrücklich definierte regel- oder schadensbedingte Ausnahme, bei
  der jede verbleibende Aktion nachweislich schlechter als Nichtstun wäre.

Die letzte Ausnahme ist derzeit offen und benötigt einen konkreten
Regelbeleg.

### 20.3 Defense in Depth

Zusätzlich zum Admissibility-Gate darf `EndTurn` bei verbleibenden Aktionen
einen extrem negativen Sicherheitswert erhalten. Die strukturelle Sperre ist
jedoch führend; `−10000` allein wäre weiterhin nur ein Score-Hack.

## 21. Neutraler Fallback

Wenn kein strategischer oder taktischer Plan ausführbar ist, muss mindestens
ein neutraler Plan entstehen.

Der neutrale Fallback:

- gewinnt nicht durch globale Scoremanipulation;
- erzeugt einen legitimen kurzfristigen Zweck;
- berücksichtigt Handüberlauf, Sicherheitsreserve und nächste bekannte
  Bedarfe;
- endet nach dem Step oder wird bei neuer Planbereitschaft verdrängt.

Typische Fallback-Zwecke:

- sichere Liquidität erhöhen;
- Handpuffer herstellen;
- eine nachweislich nützliche Karte ziehen;
- Boardzustand mit einer allgemein nutzbaren Karte verbessern;
- risikoarme Information gewinnen.

Ein Draw bei voller Hand und erwartetem wertvollem Überlauf ist kein sicherer
Fallback, solange eine sinnvolle Credit-Aktion verfügbar ist.

## 22. Globale Invarianten

1. Keine freiwillige Hauptaktion ohne Plan, Phase und Step.
2. Kein globaler Actionscore darf den Executor planlos ersetzen.
3. Genau ein Executor pro Entscheidung.
4. Interrupts suspendieren; sie löschen keine fremden Pläne.
5. Planwechsel benötigen einen dokumentierten fachlichen Grund.
6. Commitments reservieren ihre zwingenden Folgeaktionen.
7. Blockierte Pläne benennen Blocker und Resume Condition.
8. Fortschritt wird aus Zustandsänderung abgeleitet.
9. Background-Beiträge sind begrenzt und nicht autoritativ.
10. `EndTurn` ist bei verbleibender sicher nutzbarer Action Capacity gesperrt.
11. Nur aktuelle vorhandene LegalActions sind ausführbar.
12. Alle Planinformationen bleiben side-safe und deterministisch.
13. Karten- und Deckstrategie-Semantik beeinflusst Pläne, erzeugt aber keine
    Legalität.
14. Moduldetails dürfen den gemeinsamen Scheduler nicht mit kartenspezifischen
    Sonderfällen erweitern.
15. Jede Planinstanz besitzt einen expliziten Abschluss- oder Abbruchvertrag.

## 23. Kriterien für Änderungen am gemeinsamen Rahmen

Eine neue Fähigkeit gehört nur dann in den Kernel, wenn sie:

- von mehreren fachlich unterschiedlichen Planmodulen benötigt wird;
- nicht sinnvoll als planinterner Zustand ausdrückbar ist;
- Lebenszyklus, Ressourcen, Commitment, Sicherheit oder Diagnostik betrifft;
- side-neutral definierbar ist.

Eine Änderung bleibt innerhalb eines Planmoduls, wenn sie:

- nur dessen Phasen oder Steps verfeinert;
- nur dessen Zielbewertung verändert;
- neue Karten oder Decklinien desselben Plans integriert;
- einen planinternen Fortschrittswert ergänzt;
- zusätzliche Routen für einen bereits bekannten Capability-Bedarf einführt.

Beispiel:

```text
Neue Highlighter-Zugriffstiefenlogik
→ R&D-Planmodul.

Allgemeine Same-Turn-Commitment-Reservierung
→ gemeinsamer Kernel.
```

## 24. Offene Kernfragen

- **Arbeitsannahme:** Die fachliche Background-Anzahl wird nicht auf zwei
  begrenzt; eine technische Höchstzahl wird erst mit realen
  Performance-Daten festgelegt.
- **Offen:** Ob Planprioritäten innerhalb einer Klasse als normalisierte
  Zahlen, geordnete Merkmalsvektoren oder beides implementiert werden.
- **Offen:** Wie ein später belegter echter „Nichtstun ist besser“-Fall für
  `EndTurn` formal nachgewiesen werden müsste.
- **Arbeitsannahme:** Strategic Intent bleibt eine eigene Ebene oberhalb der
  Planmodule und wird nicht in jedem Modul dupliziert.
- **Arbeitsannahme:** Forced-Window-Resolution bleibt ein gemeinsamer
  Untermechanismus und kein normales strategisches Planmodul.

## 25. Aktuelles TacticalPlan-Inventar

Der produktive Typvertrag enthält derzeit 20 TacticalPlan-Typen. Diese Liste
ist Ist-Evidence, nicht automatisch das endgültige Moduldesign.

### 25.1 Runner: aktuelle Typen

| Aktueller Typ | Heutiger Zweck | Zielrichtung |
| --- | --- | --- |
| `runner.obtain_breaker_coverage` | fehlende ICE-Coverage beschaffen | in `runner.rig_and_coverage` weiterführen |
| `runner.contest_remote` | aktuelles Remote prüfen oder angreifen | als eigenes Zielmodul weiterführen |
| `runner.opportunistic_central_run` | kurzfristige HQ-/R&D-Probe | durch dauerfähiges `runner.pressure_central` ablösen |
| `runner.clear_tags_or_survive` | Tags oder akute Gefahr beseitigen | in `runner.defense_and_recovery` zusammenführen |
| `runner.convert_success_window` | aktuelles Successful-Run-Fenster nutzen | als reaktiven Kindplan weiterführen |
| `runner.survival_defense` | Damage-/Flatline-Risiko behandeln | in `runner.defense_and_recovery` zusammenführen |
| `runner.restore_hand_buffer` | Handpuffer wiederherstellen | Step/Fachbereich von `runner.defense_and_recovery` |
| `runner.develop_hand_card` | bestimmte Handkarte spielbar machen | in `runner.develop_board_and_hand` überführen |
| `runner.play_best_hand_card` | generischer Handkarten-Fallback | nicht unverändert behalten; zweckgebunden in `runner.develop_board_and_hand` |
| `runner.build_credit_base` | konkreten Funding-Gap schließen | Modus von `runner.economy` |
| `runner.build_credit_bank` | wiederkehrende Bank laden | Recurring-Instanz von `runner.economy` |
| `runner.cash_out_credit_bank` | Bank für Bedarf auszahlen | gebundener Kindplan von `runner.economy` |

### 25.2 Corp: aktuelle Typen

| Aktueller Typ | Heutiger Zweck | Zielrichtung |
| --- | --- | --- |
| `corp.create_score_window` | konkrete Agenda-Scorefolge herstellen | in `corp.score_agenda` weiterführen |
| `corp.develop_finite_economy` | begrenzte Economy installieren und nutzen | Modus von `corp.economy` |
| `corp.activate_persistent_economy` | dauerhafte Economy aktivieren | Modus von `corp.economy` |
| `corp.build_credit_bank` | Corp-Bank aufbauen | Recurring-Instanz von `corp.economy` |
| `corp.fund_strategy_reserve` | Strategie- oder Rezreserve finanzieren | Supportmodus von `corp.economy` |
| `corp.establish_scoring_remote` | strategisches Zielremote aufbauen | als eigenes Development-Projekt weiterführen |
| `corp.rez_defense` | aktuelles Rez-Fenster beantworten | Interrupt von `corp.defend_servers` |
| `corp.apply_punish_pressure` | Tag-/Damage-/Punish-Fenster nutzen | in Kampagne und atomare Ausführung trennen |

### 25.3 Strukturelle Bewertung des Ist-Inventars

Das Inventar besitzt bereits wichtige Bausteine, aber noch keine vollständige
Welt, in der alle freiwilligen Aktionen zuverlässig aus Plänen entstehen.

Wesentliche Lücken:

- zentraler Runner-Druck ist als kurzfristige Opportunity statt als
  persistente Kampagne modelliert;
- Runner-Abwehr ist über drei überschneidende Typen verteilt;
- Handentwicklung und „beste Karte“ besitzen keinen zwingenden strategischen
  Zweck- und Folgeaktionsvertrag;
- Economy ist in mehrere Plantypen aufgeteilt, ohne dass Parentbedarf,
  unabhängiger Wirtschaftsplan und konkrete Route immer sauber getrennt sind;
- Corp-Punish bildet aktuelle Konversion ab, aber nicht ausreichend den
  mehrere Züge wartenden Tag-/Damage-Kampagnenzustand;
- Opening, allgemeiner Boardaufbau, Agenda-Flood und mehrere
  deckstrategische Kampagnen sind nicht als vollständige Module abgedeckt;
- der aktuelle Plan kann im Live-Auswahlweg diagnostisch bleiben, während
  globale Action-Arbitration eine andere Aktion auswählt.

## 26. Zielstruktur der Planregistries

### 26.1 Gemeinsamer Registry-Vertrag

Der Kernel kennt zwei Registries:

```ts
RunnerPlanModuleRegistry
CorpPlanModuleRegistry
```

Jeder Registry-Eintrag deklariert:

```ts
type PlanModuleManifest = {
  moduleId: string;
  moduleVersion: string;
  side: "runner" | "corp";
  executionClasses: PlanExecutionClass[];
  supportedStrategyLineIds: string[];
  discoverySignals: string[];
  supportedCapabilityKinds: string[];
  allowedTargetKinds: string[];
  diagnosticSchemaVersion: string;
  invariantTestIds: string[];
};
```

### 26.2 Keine automatische Seitenfreigabe

Ein gemeinsamer Capability-Resolver bedeutet nicht, dass ein Planmodul auf
beiden Seiten automatisch verwendet werden darf. Runner- und Corp-Economy
können gemeinsame technische Hilfen nutzen, bleiben aber fachlich getrennte
Module.

### 26.3 Modulaufnahme

Ein neues Planmodul wird nur aufgenommen, wenn:

- ein eigener längerfristiger Zweck, Lebenszyklus oder Fortschrittsbegriff
  besteht;
- der Zweck nicht nur eine einzelne Karte oder Action-ID beschreibt;
- vorhandene Module den Zweck nicht als Phase oder Step aufnehmen können;
- Discovery, Completion, Abandonment und Diagnostik definiert sind;
- mindestens ein Positiv- und ein Gegenfallszenario existiert.

Eine neue Karte allein rechtfertigt kein neues Planmodul.

## 27. Runner-Zielmodule

Die folgende Liste ist das angestrebte Modulportfolio. Einzelne IDs sind noch
Arbeitsnamen; ihre fachlichen Grenzen sind führender als die konkrete
Benennung.

### 27.1 `runner.opening_strategy`

**Klasse:** `bounded_sequence`
**Rolle:** Opening-/Setup-Vordergrund
**Status:** Arbeitsannahme, bislang kein entsprechender TacticalPlan-Typ

Zweck:

- Mulligan im Kontext der Deckstrategie;
- erste strategische Linie aktivieren;
- notwendige Basis-Coverage, Economy oder Engine priorisieren;
- nach erfolgreichem Opening in normale Kampagnen übergeben.

Der Plan endet, sobald:

- die deckstrategisch notwendige Startfähigkeit vorhanden ist;
- ein dringender Interrupt übernimmt;
- oder die Opening-Phase ausdrücklich abgebrochen wird.

### 27.2 `runner.pressure_central`

**Klasse:** `strategic_campaign`
**Rolle:** Vordergrund, zeitweise suspendierbar
**Status:** neu aufzubauen; ersetzt den rein opportunistischen Ein-Zug-Plan

Parameter:

- Ziel `hq` oder `rd`;
- Druckmodus `probe`, `sustained`, `engine_growth` oder `closeout`;
- deckstrategische Linie;
- relevante Access-Engine;
- bekannte Zugriffshistorie und Sättigung;
- Serverpfad und Finanzierungsbedarf.

Mögliche Phasen:

```text
assess_target
fund_access
find_or_install_access_tool
open_path
probe
compound_access
exploit_known_payoff
closeout
recover_and_resume
```

Planinterner Fortschritt:

- neuer oder tieferer Zugriff;
- neue relevante Information;
- Agenda- oder Trash-Konversion;
- Aufbau einer Multiaccess-/Highlighter-Engine;
- Verringerung der Siegdistanz;
- Senkung realer Zugangskosten.

Eine HQ- und eine R&D-Instanz dürfen gleichzeitig Kandidaten sein. Nur eine
ist Executor. Ein Zielwechsel verlangt Planarbitration, nicht bloß eine andere
Run-Action.

### 27.3 `runner.contest_remote`

**Klasse:** `bounded_sequence` oder bei wiederkehrendem Ziel
`strategic_campaign`
**Rolle:** Vordergrund; bei unmittelbarer Score-Threat P2
**Status:** aktuellen Typ weiterentwickeln

Mögliche Phasen:

```text
classify_remote
assess_score_threat
fund_access
obtain_path_answer
run_remote
resolve_access
recontest_or_complete
```

Der Plan muss unterscheiden:

- akute Siegagenda;
- wirtschaftlich wertvolles Asset;
- leeres oder bekannt wertloses Remote;
- Ambush-/Damage-Risiko;
- deckstrategisch begründeten wiederholten Remote-Druck.

`draw_for_answer` ist nur zulässig, wenn:

- eine konkrete fehlende Antwort benannt ist;
- ein Draw diese Antwort plausibel liefern kann;
- Handüberlauf und verbleibende Folgeaktionen den Plan nicht entwerten.

### 27.4 `runner.rig_and_coverage`

**Klasse:** `development_project` oder dringender `bounded_sequence`
**Rolle:** Vordergrund/Background je Dringlichkeit
**Status:** Ausbau von `runner.obtain_breaker_coverage`

Verantwortung:

- Wall-, Code-Gate-, Sentry- und Spezial-Coverage;
- Universal- und probabilistische Coverage;
- MU-/Slot-Konflikte;
- Suche, Draw, Recovery und Installation;
- Bezahlbarkeit des anschließenden Runpfads;
- deckstrategischer Rig-first- oder Minimal-Rig-Modus.

Mögliche Phasen:

```text
identify_required_coverage
locate_answer
fund_answer
resolve_mu
install_answer
validate_run_path
```

Das Modul darf nicht bei jeder spielbaren Programminstallation wachsen. Es
arbeitet auf eine konkrete Coverage- oder Rig-Fähigkeit hin.

### 27.5 `runner.develop_board_and_hand`

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** Ziel für `develop_hand_card` und `play_best_hand_card`

Verantwortung:

- eine strategisch nützliche Karte spielbar machen;
- ein Deck- oder Board-Engine-Stück entwickeln;
- sinnvollen Draw, Search, Install oder Eventeinsatz koordinieren;
- generische Karten ohne eigenen Spezialplan verwertbar machen.

Jede Zielkarte benötigt einen Zweck:

```text
supports_plan_instance
unlocks_capability
improves_board_engine
converts_current_window
safe_generic_development
```

Nicht zulässig:

- Karte spielen, nur weil sie legal und roh positiv bewertet ist;
- turn-limitierte Vorbereitung ohne Commitment;
- Installation ohne absehbaren Nutzen oder mit kritischem Ressourcenbruch;
- Draw bei voller Hand ohne Überlaufbehandlung.

`play_best_hand_card` bleibt höchstens eine interne Routenauswahl, kein
eigenständiger strategischer Fallback.

### 27.6 `runner.economy`

**Klasse:** je Instanz `bounded_sequence`, `recurring_cycle` oder
`development_project`
**Rolle:** Support, Vordergrund oder Background
**Status:** Zusammenführung der heutigen Creditbase-/Bank-/Cashout-Typen

Interne Modi:

```text
fund_parent_need
restore_liquid_floor
build_general_reserve
develop_economy_engine
load_bank
cash_out_bank
maintain_run_budget
neutral_credit_fallback
```

Das Modul unterscheidet:

- konkreten Finanzierungsbedarf eines Parentplans;
- allgemeine Sicherheits- oder Runreserve;
- eigenständige langfristige Economy-Engine;
- Bankaufbau mit Cadence;
- Auszahlung zu einem konkreten Konversionszweck;
- Basic Credit als neutralen Fallback.

Die Schwelle „genug Geld“ ist kontextabhängig. Sie berücksichtigt:

- nächste Planroute;
- Survival- und Trace-Reserve;
- erwartete Run- und Breakkosten;
- mögliche alternative Kartenentwicklung;
- Deckphase und Bankkonversion.

Mehr Geld wird bei vorhandener Reserve nicht automatisch wertlos. Es verliert
aber gegenüber konkret ausführbaren strategischen Plänen an Priorität.

### 27.7 `runner.defense_and_recovery`

**Klasse:** `reactive_interrupt`, `bounded_sequence` oder
`development_project`
**Rolle:** Interrupt/Vordergrund
**Status:** Zielzusammenführung von Tag-, Survival- und Handpufferplänen

Das Modul besitzt eine gemeinsame Threat-Priorisierung für:

- unmittelbare Flatline-Gefahr;
- Meat-, Net- und Core-Damage-Risiko;
- Tags und sichtbare Tag-Punish-Ketten;
- zu kleinen Handpuffer;
- relevante hostile Status-, Counter- oder Viruszustände, soweit die
  Rules Engine hierfür Runner-Aktionen anbietet;
- notwendige Damage-Prävention oder Recovery.

Mögliche Phasen:

```text
assess_threats
prevent_terminal_damage
break_punish_chain
clear_tags
remove_hostile_state
restore_hand_buffer
install_prevention
return_to_suspended_plan
```

Prioritätsregeln:

1. unmittelbar terminale Gefahr verhindern;
2. eine sichtbare gegnerische Punish-Kette unterbrechen;
3. unvermeidbaren Damage durch ausreichenden Puffer überleben;
4. Tags oder hostile Zustände kosteneffizient entfernen;
5. Prävention für eine belastbar erwartete Gefahr aufbauen.

Das Modul darf auch entscheiden, nichts zu tun und dormant zu bleiben, wenn
kein materieller Threat vorliegt. „Tag vorhanden“ oder „Damage-Karte im
gegnerischen Deck möglich“ reicht nicht automatisch.

Die genaue Ordnung zwischen Tag-Clear, hostile-State-Entfernung,
Handkarten-Draw und Präventionsinstallation bleibt modulinterne
Verfeinerung.

### 27.8 `runner.convert_run_window`

**Klasse:** `reactive_interrupt` oder gebundener Kindplan
**Rolle:** Interrupt
**Status:** Weiterentwicklung von `runner.convert_success_window`

Verantwortung:

- Successful-Run-Trigger;
- Access-Modifikationen;
- Multiaccess-Aktivierungen;
- Credit-, Trash- oder Folge-Run-Payoffs;
- Ziel- und Choice-Auflösung innerhalb des begonnenen Runplans.

Das Modul besitzt kein unabhängiges langfristiges Ziel. Es gehört logisch zum
auslösenden Run-/Contest-Plan und kehrt anschließend dorthin zurück.

### 27.9 Runner-neutraler Fallback

Der Runner-Scheduler erzeugt keinen zusätzlichen undurchsichtigen
„do something“-Plan. Er aktiviert eine sichere Instanz eines vorhandenen
generischen Moduls:

- `runner.economy:neutral_credit_fallback`;
- `runner.develop_board_and_hand:safe_generic_development`;
- `runner.defense_and_recovery:restore_hand_buffer`;
- eine risikoarme `runner.pressure_central:probe`, wenn wirklich begründet.

Die Auswahl bleibt eine Planentscheidung mit Zweck und Abschlussbedingung.

## 28. Corp-Zielmodule

### 28.1 `corp.opening_and_board_foundation`

**Klasse:** `bounded_sequence`
**Rolle:** Opening-/Setup-Vordergrund
**Status:** Arbeitsannahme, bislang kein entsprechender TacticalPlan-Typ

Verantwortung:

- erste Zentralserver-Schutzböden;
- deckstrategisch erforderliches Remote oder Economy-Fundament;
- Rez-Reserve;
- Übergabe in Score-, Economy-, Punish- oder Glacier-Kampagne.

Der Plan darf nicht pauschal jedes Central mit einem ICE versehen. Er folgt
Deckstrategie, Hand, Agendaexposition und erwarteter früher Run-Gefahr.

### 28.2 `corp.score_agenda`

**Klasse:** `bounded_sequence` oder `strategic_campaign`
**Rolle:** Vordergrund, Closeout P1
**Status:** Weiterentwicklung von `corp.create_score_window`

Interne Modi:

```text
fast_advance
rush
remote_score
overadvance
counter_transfer
same_turn_closeout
```

Mögliche Phasen:

```text
select_agenda
select_score_path
fund_score_path
prepare_or_select_remote
install_agenda
generate_action_capacity
place_advancement
protect_window
score_agenda
closeout_or_repeat
```

Der Plan berechnet die vollständige Konversionsroute und reserviert:

- Agendaquelle;
- Zielserver;
- Credits;
- Klicks oder Action Capacity;
- Advancement-Counter;
- benötigte Schutz-/Rezreserve.

Ein garantierter Same-Turn-Score ist ein Commitment. Einzelne Economy- oder
ICE-Aktionen dürfen ihn nicht aufbrechen.

### 28.3 `corp.establish_scoring_remote`

**Klasse:** `development_project`
**Rolle:** Background, zeitweise Vordergrund
**Status:** vorhandenen Typ fortführen

Der Plan folgt `RemoteDoctrineProfile` und besitzt:

```text
select_target
establish_first_stop
fund_rez_reserve
harden_to_protection_target
payload_ready
convert_score_window
maintain_or_reopen
```

Fortschritt wird über effektiven Schutz und Nutzbarkeit gemessen, nicht über
ICE-Anzahl allein.

Ein vorbereitetes Zielremote bleibt über Economy-, Draw-, Punish- und
Central-Interrupts erhalten. Fast-Advance-Decks erhalten nicht automatisch
dieses dauerhafte Projekt.

### 28.4 `corp.defend_servers`

**Klasse:** `development_project` mit `reactive_interrupt`-Kindern
**Rolle:** Background/Vordergrund/Interrupt
**Status:** erweitert `corp.rez_defense`

Verantwortung:

- dynamische HQ- und R&D-Schutzböden;
- Schutz des Zielremotes;
- ICE-Installations- und Rezreserve;
- Rez-Entscheidungen im aktuellen Run;
- Glacier-/Tax-Fortschritt;
- Reaktion auf sichtbare Runner-Rig- und Economy-Änderungen.

Mögliche Kindpläne:

- `rez_current_ice`;
- `raise_hq_floor`;
- `raise_rd_floor`;
- `harden_target_remote`;
- `restore_rez_reserve`.

Eine Rez-Entscheidung ist ein Interrupt. Sie darf den Parent-Scoring- oder
Remoteplan suspendieren, aber nicht vergessen.

### 28.5 `corp.economy`

**Klasse:** `bounded_sequence`, `recurring_cycle` oder
`development_project`
**Rolle:** Support/Vordergrund/Background
**Status:** Zusammenführung von vier aktuellen Economy-Typen

Interne Modi:

```text
fund_parent_need
fund_rez_reserve
fund_score_route
fund_punish_route
develop_finite_economy
drain_finite_economy
activate_persistent_economy
build_bank
cash_out_bank
neutral_credit_fallback
```

Das Modul kennt:

- verbleibende Nutzungen und Amortisation;
- Installations- und Rez-Kosten;
- Zugcadence;
- Credits bis zur konkreten Score-, Rez- oder Punish-Konversion;
- alternative sinnvolle Boardentwicklung;
- Risiko eines wertlosen Economy-Remotes.

Wiederholte Nutzung ist zulässig, solange sie das Fundingziel real
voranbringt. Nach erreichter Zielreserve muss das Modul dem finanzierten
strategischen Plan die Ausführung überlassen.

### 28.6 `corp.punish_campaign`

**Klasse:** `strategic_campaign` oder `development_project`
**Rolle:** dormant/Background/Vordergrund
**Status:** neu aus `corp.apply_punish_pressure` herauszulösen

Verantwortung:

- aus Deckstrategie ableiten, welche Tag-, Trace-, Credit-Denial- und
  Damage-Linien belastbar getragen werden;
- benötigte Komponenten und Reihenfolge verwalten;
- gegnerische Triggerbedingungen beobachten;
- Credits und Handkartenquellen reservieren;
- zwischen bloßem Druck, wirtschaftlicher Bestrafung und Lethal unterscheiden;
- auf ein ausführbares Punish-Fenster warten.

Beispielzustand:

```text
strategy: tag_and_bag
tag_source: Chance Observation
damage_sources: Urban Renewal + Scorched Earth
required_credits: 11
required_clicks: 3
trigger: runner_attempted_run_last_turn
runner_grip: 5
projected_damage: 9
lifecycle: dormant
```

Der Plan darf über mehrere Züge bestehen, während Scoring oder Economy den
Vordergrund übernimmt.

### 28.7 `corp.execute_punish_sequence`

**Klasse:** `bounded_sequence`
**Rolle:** P1-/P3-Vordergrund; Kind von `corp.punish_campaign`
**Status:** Ziel für die atomare Ausführung des heutigen Punish-Plans

Mögliche Phasen:

```text
validate_trigger
apply_tag_or_trace
win_or_price_trace
apply_credit_denial
apply_damage
confirm_lethal_or_complete
```

Vor Beginn wird die ganze Route geprüft:

- Kosten und Klicks;
- Trace-Garantie oder erwartete Gebote;
- Tagbedingung;
- Runner-Handpuffer;
- Damage-Summe und Prävention;
- legale Reihenfolge.

Eine planfremde Aktion wie Closed Accounts darf eine garantierte
Drei-Aktionen-Flatline-Sequenz nicht aufbrechen.

### 28.8 `corp.ambush_and_bluff`

**Klasse:** `development_project` oder `bounded_sequence`
**Rolle:** Background/Vordergrund
**Status:** WIP-Lücke

Verantwortung:

- deckstrategisch getragene Ambush-/Bluff-Remotes;
- Contestability statt pauschaler Überhärtung;
- Kosten-/Damage-/Trash-Payoff;
- Wiederverwendung oder Aufgabe nach Expose/Access;
- Abgrenzung zu echtem Scoring-Remote.

Ein unbekanntes Remote allein erzeugt keinen Bluffplan. Das eigene Deck und
die konkrete Hand müssen die Linie tragen.

### 28.9 `corp.hand_and_agenda_management`

**Klasse:** `bounded_sequence` oder `development_project`
**Rolle:** Vordergrund/Support
**Status:** WIP-Lücke

Verantwortung:

- Agenda-Flood und HQ-Exposition;
- sinnvollen Draw, Refresh, Recovery und Discard;
- Agenda in eine Scoreline überführen;
- überzählige Karten im Cleanup zweckgebunden priorisieren;
- Deckout-Risiko und notwendige R&D-Erholung.

Das Modul darf Hidden-Info nur aus der eigenen HQ/R&D und öffentlichen
Ereignissen verwenden.

### 28.10 Corp-neutraler Fallback

Wie beim Runner wird kein freier globaler Actionsieger verwendet.

Mögliche sichere Instanzen:

- `corp.economy:neutral_credit_fallback`;
- `corp.hand_and_agenda_management:safe_draw_or_refresh`;
- `corp.defend_servers:raise_visible_floor`;
- `corp.opening_and_board_foundation:safe_generic_development`.

## 29. Gemeinsame Resolver und Services

Nicht jede wiederverwendbare Funktion ist ein eigener Plan.

Gemeinsame, side-spezifisch parametrisierte Services dürfen sein:

- Funding-Route;
- Action-Capacity-Route;
- Draw-/Search-Route;
- Installations- und Slot-Route;
- Run-/Access-Projektion;
- Damage-/Survival-Projektion;
- Advancement-/Score-Projektion;
- Trace-/Bid-Projektion;
- Discard-/Keep-Bewertung.

Ein Service:

- besitzt keine langfristige strategische Autorität;
- liefert Routen und Bewertungen an ein Planmodul;
- darf keinen Executor wählen;
- darf kein Plan-Memory ersetzen.

Beispiel:

```text
R&D-Plan fordert 5 Credits an
→ Runner-Funding-Service liefert Livewire, Bank-Cashout und Basic Credits
→ R&D-Plan oder Economy-Kindplan wählt eine Route
```

## 30. Abdeckung der Aktionsfamilien

### 30.1 Runner

| Aktionsfamilie | Planherkunft |
| --- | --- |
| Basic Credit | Economy-Plan, Supportbedarf oder neutraler Fallback |
| Draw | Coverage-, Defense-, Handentwicklungs- oder konkreter Support-Step |
| Programm/Hardware/Ressource installieren | verlangte Fähigkeit des Rig-, Defense-, Economy- oder Strategieplans |
| Event spielen | Route des aktiven Plans mit vollständigem Follow-up-Vertrag |
| Run starten | Central-, Remote- oder gebundener Run-Plan |
| Run-Ability/Run-Event | Route des auslösenden Runplans |
| Tag entfernen | Defense-and-Recovery |
| Access stehlen/trashen/ablehnen | Auflösungs-Step des auslösenden Runplans |
| Ability aktivieren | Step-Route eines Plans, nicht freie Kartennutzung |
| Discard | Cleanup-Resolution unter Plan- und Keep-Kontext |
| EndTurn | System-Gate, kein Plan |

### 30.2 Corp

| Aktionsfamilie | Planherkunft |
| --- | --- |
| Basic Credit | Economy-, Reserve- oder neutraler Fallbackplan |
| Draw | Hand-/Agenda-Management, Economy oder konkreter Supportbedarf |
| ICE installieren | Defense-, Remote-, Score- oder Opening-Plan |
| Asset/Upgrade installieren | Economy-, Ambush-, Remote- oder Strategieplan |
| Agenda installieren | Scoreplan mit Exposure-/Commitment-Vertrag |
| Advance/Score | Scoreplan |
| Operation spielen | Economy-, Score-, Punish-, Defense- oder Handplan |
| ICE/Asset rezzen | aktueller Defense-/Economy-/Ambush-Interrupt |
| Trace-Bid/Choice | auslösender Punish-/Defense-/Scoreplan |
| Ability aktivieren | Step-Route eines Plans |
| Discard | Hand-/Agenda-Management oder Cleanup-Resolution |
| EndTurn | System-Gate, kein Plan |

### 30.3 Coverage-Gate

Die Implementierung ist erst vollständig umgestellt, wenn ein automatischer
Check für jede produktiv auftretende freiwillige Action-Familie nachweist:

```text
selectedAction
→ executorPlanInstanceId
→ phase
→ stepId
→ routeId
```

Eine nicht zuordenbare Action ist ein Fehler und darf nicht über einen
alphabetischen oder freien Semantic-Runtime-Fallback ausgeführt werden.

## 31. Planinterne Weiterentwicklung

### 31.1 Zulässige Verfeinerung

Ein Planmodul darf später eigenständig ergänzen:

- neue Phasen;
- präzisere Fortschrittsmetriken;
- neue Karten- und Capability-Routen;
- bessere Risiko- oder Payoff-Projektion;
- neue deckstrategische Varianten desselben Zwecks;
- modulinterne Prioritäten zwischen Steps;
- modulbezogene Regressionstests und Diagnostik.

### 31.2 Nicht zulässige Verfeinerung

Ein Modul darf nicht:

- eine globale Override-Schicht einführen;
- fremde Pläne löschen;
- Executor-Exklusivität umgehen;
- Ressourcen doppelt reservieren;
- LegalActions erzeugen;
- side-unsafe Daten anfordern;
- `EndTurn` freischalten;
- einen allgemeinen Kernel-Sonderfall nur für eine Karte verlangen, solange
  ein generischer Commitment- oder Capability-Vertrag ausreicht.

### 31.3 Modulversionierung

Jedes Modul besitzt eine interne Schema- oder Modulversion. Änderungen an
`moduleState` müssen:

- deterministisch sein;
- alte lokale Version-0-Daten nicht zwingend migrieren;
- Tests und Diagnostik gemeinsam aktualisieren;
- keine zweite parallele Runtime erzeugen.

## 32. WIP-Entscheidungen zum Modulzuschnitt

- **Kernentscheidung:** Runner und Corp besitzen getrennte Registries und
  Scheduler-Policies.
- **Kernentscheidung:** Economy ist sowohl selbständiges Planmodul als auch
  Supportlieferant für Parentpläne.
- **Kernentscheidung:** Same-Turn-Payoffs werden durch Commitments, nicht
  lediglich durch positive Action-Scores abgesichert.
- **Arbeitsannahme:** Die drei heutigen Runner-Survival-Typen gehen in einem
  gemeinsamen `runner.defense_and_recovery`-Modul auf.
- **Arbeitsannahme:** Die heutigen Economy-Typen bleiben als interne Modi oder
  Instanzvarianten erhalten, nicht als unabhängige Scheduler-Sonderfälle.
- **Arbeitsannahme:** `runner.play_best_hand_card` wird als eigener
  strategischer Plan entfernt.
- **Arbeitsannahme:** Corp-Punish wird in langlebige Kampagne und atomare
  Ausführung getrennt.
- **Offen:** Ob `corp.ambush_and_bluff` und
  `corp.hand_and_agenda_management` bereits in der ersten
  Implementierungsstufe eigene Module werden oder zunächst als Phasen
  vorhandener Module starten.
- **Offen:** Ob Opening-Pläne nach der ersten Spielphase vollständig
  abgeschlossen oder als diagnostische Deckphaseninstanz behalten werden.

## 33. Änderungsverlauf

### 0.1 – 2026-07-23

- gemeinsamer Plan-first-Rahmen angelegt;
- Kernel und side-spezifische Scheduler getrennt;
- Planmodul- und Planinstanzvertrag skizziert;
- Lebenszyklus, Portfolio, Prioritätsklassen und Scheduler-Zyklus definiert;
- Parent-/Support-Beziehungen, Ressourcen und Commitments festgelegt;
- Outcome-basierter Fortschritt und EndTurn-Invariante aufgenommen.
- alle 20 aktuellen TacticalPlan-Typen inventarisiert und einer Zielrichtung
  zugeordnet;
- Runner- und Corp-Zielmodule einschließlich Economy, zentralem Druck,
  Abwehr, Scoring, Defense und Punish-Kampagne beschrieben;
- Action-Familien einem Planursprung zugeordnet;
- Registry-, Service- und Modulverfeinerungsvertrag ergänzt.
