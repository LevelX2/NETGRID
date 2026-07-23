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

## 25. Änderungsverlauf

### 0.1 – 2026-07-23

- gemeinsamer Plan-first-Rahmen angelegt;
- Kernel und side-spezifische Scheduler getrennt;
- Planmodul- und Planinstanzvertrag skizziert;
- Lebenszyklus, Portfolio, Prioritätsklassen und Scheduler-Zyklus definiert;
- Parent-/Support-Beziehungen, Ressourcen und Commitments festgelegt;
- Outcome-basierter Fortschritt und EndTurn-Invariante aufgenommen.
