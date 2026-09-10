# Gemeinsamer KI-Planvertrag

Status: **aktueller produktiver Architekturvertrag**  
Stand: 2026-09-10

## 1. Zweck und maßgebliche Verträge

Dies ist der aktuelle gemeinsame Planvertrag. Er beschreibt keine noch
auszuführende Migration. Der produktive Kern ist Plan-first; ausdrücklich
offene Fähigkeiten stehen in Abschnitt 2 und in den Ownerverträgen.

Die [Architekturkarte](README.md) liefert Aufrufpfad, tatsächliche Modul-IDs
und Codeverweise. Das [Zielbild](target-architecture.md) begründet die
Autoritätsgrenzen; der [Änderungskompass](change-compass.md) führt durch die
Prüfung einer Änderung. Fachregeln liegen bei den
[Runner-](runner-plan-contracts.md) und [Corp-Ownern](corp-plan-contracts.md).
Suche, Zugcommitment und Revalidierung sind im
[Zug-/Kampagnenvertrag](turn-campaign-planner.md) maßgeblich definiert.

Die folgenden Typblöcke sind, soweit nicht ausdrücklich als reale API
gekennzeichnet, fachliche Strukturbeispiele. Feldnamen und Pflichtfelder
werden ausschließlich durch die verlinkten TypeScript-Verträge bestimmt.
Ein konzeptioneller Funktionsname begründet keine zusätzliche Modul-Methode.

## 2. Implementierungsstand und offene Grenzen

| Thema                    | Aktueller Stand                                                                                                   | Maßgebliche Quelle / offene Grenze                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planmodule und Scheduler | Produktiv: `discover`, `assess`, `materialize`; gemeinsame Reconciliation und Receipt-Verarbeitung                | Abschnitt 6; keine zusätzliche Lifecycle-API erforderlich                                                                                                  |
| Zugplanung               | Corp und Runner verwenden den produktiven TurnPlanner; `Shadow` im Dateinamen bedeutet keine fehlende Aktivierung | [Aufrufpfad](README.md#aktueller-aufrufpfad), [Suche](turn-campaign-planner.md)                                                                            |
| Opening-Owner            | Keine registrierten `runner.opening_strategy` / `corp.opening_and_board_foundation`                               | Offene Modulideen in den Ownerverträgen; Setup/Mulligan und normale Discovery sind vorhanden                                                               |
| Strategic Intent         | Eigener nicht handelnder Strategieanker; öffentlicher Abschluss von Setup/Mulligan erzeugt `phase_change`         | Weitere typisierte Revalidierungsgründe benötigen jeweils einen produktiven side-sicheren Evidence-Produzenten; kein Wechsel aus bloßen Score-Schwankungen |
| Plan-State-Typisierung   | Kernel hält `moduleState` und Domainkontext fachneutral; lokale Auswertung liegt beim Owner                       | Die stärkere statische Bindung von Modul-ID und State ist kein bereits erreichter Vertrag und wird hier nicht implementiert                                |
| P6-Liquidität            | Enger, pro Zug endlicher Basic-Credit-Vertrag ist aktiv                                                           | Abschnitt 18: befristeter Vertrag mit Removal Condition; keine neutrale Draw-Route                                                                         |
| EndTurn                  | Engine bietet `end_turn`; KI verwendet den Completion-/Kapazitätsverzichtsvertrag                                 | Abschnitt 17 trennt gültigen KI-Vertrag und offene normative Quellenklärung                                                                                |
| Fachliche Fähigkeiten    | Existierende Owner werden schrittweise verfeinert                                                                 | [Runner](runner-plan-contracts.md), [Corp](corp-plan-contracts.md), [Capability-Review](hidden-node-capability-review.md); keine pauschale Vollabnahme     |

Diese offenen Grenzen geben weder einem Resolver noch dem Scheduler neue
Fachautorität. Historische Cutover-, Review- und Paketnachweise liegen in Git.

## 3. Begriffe

### Deckstrategie

Stabiler, aus dem eigenen Deck abgeleiteter Prior. Sie beschreibt, welche
langfristigen Linien das Deck unterstützt, welche Rollen und Werkzeuge
vorhanden sind und wie vollständig eine Linie ist.

### Strategic Intent

Aktuell führende strategische Ausrichtung innerhalb der vom Deck gestützten
Möglichkeiten. Der Intent darf phasenabhängig wechseln, ist aber keine
konkrete Aktion.

### Goal-/Threat-Signal

Kurzlebige, StateVersion-gebundene Beschreibung eines aktuellen Bedarfs,
einer Opportunity oder einer Bedrohung. Diese Signale:

- beeinflussen Planerkennung und Planbewertung;
- können einen Intent-Wechsel anregen;
- sind für jeden Assessment- oder Override-Einfluss exakt an `planModuleId`,
  residenten `dedupeKey` und ein konkretes Ziel gebunden;
- besitzen weder Plan-Memory noch Ausführungsautorität;
- referenzieren keine zukünftigen Action-IDs;
- verfallen oder werden bei jeder neuen StateVersion neu erzeugt.

Targetlose sowie modul-, instanz- oder zielfremde Signale sind keine
taktische Evidence für einen P4-/P5-Override. Ein Planmodul darf sich ein
Signal nicht selbst in sein Assessment schreiben; die Bindung erfolgt
ausschließlich durch den Scheduler aus dem aktuellen Runtimekontext.

Damit bleibt die fachliche Funktion früherer Tactical Goals als semantische
Brücke erhalten, ohne ein produktives `TacticalGoal`-Objekt und ohne neben
dem PlanPortfolio eine zweite Handlungsautorität zu bilden. Im Codevertrag
heißt diese Brücke `TransientPlanSignal`.

Ein Signal ist keine Vorstufe, die zwingend dauerhaft zwischen Intent und
Plan gespeichert wird. Es wird aus dem aktuellen side-sicheren Weltmodell
erzeugt, darf bestehenden Intent und residente Planinstanzen als Kontext
verwenden und fließt danach ausschließlich als Evidence in Discovery und
Assessment ein. Der Zielvertrag erlaubt damit Discovery-Einfluss; im
erreichten produktiven Ist ist insbesondere die exakt gebundene Zulassung
des taktischen P4-Remote-Assessments belegt. Andere Signalarten erhalten
dadurch weder eine generische Scoreverstärkung noch eigene Plan- oder
Intent-Autorität.

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

Im Live-Server wird das residente Portfolio serverprivat mit dem Match
gespeichert und vor der nächsten KI-Vorbereitung oder -Ausführung
wiederhergestellt. Ein Prozessneustart darf daher kein neues Portfolio für
denselben Matchzustand vortäuschen; ein akzeptierter Undo verwirft den
zustandsgebundenen Bestand bewusst und verlangt eine frische Revalidierung.

### Executor

Die eine Planinstanz, die die aktuelle freiwillige Entscheidung besitzt. Bei
Supportbeziehungen wird zwischen strategischem Root-Foreground und
ausführendem Leaf-Executor unterschieden. Es handelt trotzdem genau ein Leaf.

### Phase

Fachlicher Abschnitt eines Plans, beispielsweise `fund_engine`,
`install_engine`, `compound_access` oder `closeout`.

### Step

Nächste konkrete Zielannäherung innerhalb einer Phase. Ein Step verlangt eine
Fähigkeit oder Konversion, aber zunächst keine bestimmte Action-ID.

### Route

Die konkrete aktuelle LegalAction, mit der ein Step jetzt begonnen oder
fortgesetzt wird, plus ausschließlich semantische Fortsetzungsanforderungen.
Eine Route enthält nie zukünftige Action-IDs.

### Commitment

Geschützte, vor Beginn auf Machbarkeit geprüfte Fortsetzung. Sie kann
verzweigen, wird nach jeder StateVersion neu materialisiert und reserviert
typisierte Ressourcen mit einem ausgewiesenen Garantiegrad. Sie ist keine
atomare Engine-Transaktion.

## 4. Gemeinsamer Kernel und fachliche Zuständigkeit

Der [Schichtenvertrag](target-architecture.md) definiert die Autoritäten.
Die [Codekarte](README.md#aktueller-aufrufpfad) zeigt ihre heutige Verdrahtung.

Die KI-Input-Projektion erhält die von der Engine gebundene
Programminstallations-Zahlungsaufteilung und den optionalen Programmtrash.
Sie erhält außerdem die `runnerPaymentSupportAbilities` bekannter Karten im
eigenen Runner-Rig. Diese privaten Finanzierungsfakten werden feldweise durch
die Live-DTO-Grenze getragen; gegnerische und unbekannte Karten erhalten sie
nicht. Finanzierungsregressionen müssen diesen produktiven DTO-Pfad abdecken.
Die Action-Semantik prüft Quellen, Beträge und Gesamtsumme, trennt liquide
`creditCost` von `hostedCreditCost` und weist unvollständige oder widersprüchliche
Aufteilungen mit `invalid_runner_install_payment` beim Owner
`action_semantics` zurück. Der Plan bewertet damit die tatsächliche
Liquiditätsbelastung; er rekonstruiert keine Zahlung aus Action-IDs oder Labels.

Zahlungsquellen mit ihren konkreten Beträgen und optionaler Programmtrash
gehören als `route_defining`-Bindings zur kanonischen Invocation. Eine
poolbezahlte Installation ist nicht mit einer weiteren Installation frei
vertauschbar. Nach ihr verlangt der TurnPlanner die bestehende
`projected_plan_discovery_required`-Revalidierung am aktuellen Engine-Zustand,
bevor er einen weiteren Zugriff auf denselben Kartenpool plant.

Der Rückkanal zum Strategic Intent ist ebenso ausdrücklich begrenzt:

```text
öffentlicher Phasenwechsel / belastbare neue Information /
Planabschluss / Planinvalidierung
                    |
     stateVersion-gebundene Revalidation-Evidence
                    |
       Strategic Intent neu bewerten
```

Eine neu erkannte Planinstanz darf Evidence für einen solchen
Revalidierungsgrund liefern, aber weder den Intent selbst mutieren noch den
Rückkanal allein durch ihren höheren Action- oder Assessmentwert auslösen.
P1–P3 dürfen mit belastbarer aktueller Evidence trotz abweichendem Intent
konkurrieren. P4/P5 benötigen Intent-Fit oder ein exaktes aktuelles
taktisches Signal. Ein solcher Plan-Override ist kein Intent-Wechsel.

### 4.1 Gemeinsamer Plan-Kernel

Der Kernel ist zuständig für:

- Schema und Identität von Planinstanzen;
- StateVersion- und Side-Isolation;
- Lebenszyklusübergänge;
- Portfoliohaltung und deterministische Sortierung;
- Executor-Exklusivität;
- Validierung von Prioritätsansprüchen und Hysterese;
- typisierte, zyklenfreie Parent-/Need-/Support-Beziehungen;
- typisierte Ressourcenclaims und Reservierungen;
- side-sichere Planning-State-Identität;
- mehrphasige TurnPlans, Priority-Obligations und Kampagnen-Value-Claims;
- faire deterministische Suchbudgets und zentral validierte
  Linienbewertung;
- Schutz laufender Fortsetzungen;
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

### 4.2 Runner-Scheduler

Der Runner-Scheduler kennt runner-spezifisch:

- Agenda-Siegdistanz;
- Serverzugang und Run-Risiko;
- Breaker- und Rig-Abhängigkeiten;
- erfolgreiche Run- und Access-Fenster;
- Tags, Damage-Risiko und Handpuffer;
- zentrale und Remote-Drucklinien;
- Runner-Economy und Run-Credit-Pools.

### 4.3 Corp-Scheduler

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

## 5. Eingabe- und Ausgabegrenze

### 5.1 Zulässige Eingaben

Der Planer darf ausschließlich verwenden:

- aktuelle side-sichere `PlayerView`;
- aktuelle `LegalActions`;
- erlaubte `PublicEvents`;
- eigene bekannte Karten und eigene Deckmetadaten;
- eigene Deckstrategie und DeckCapabilities;
- side-sicheres Plan-, Access- und Belief-Memory;
- deterministische Match-, Turn- und StateVersion-Kontexte.

### 5.2 Ausgabe

Der produktive Scheduler liefert im Normalfall:

- genau eine vorhandene `actionId`;
- gegebenenfalls zulässige Choice-Werte;
- interne, redigierbare Plan- und Entscheidungsdiagnostik.

Eine eng begrenzte Ausnahme ist eine ausdrücklich freigegebene planlokale
Nahgleichstandsmenge. Sie enthält ausschließlich vollständig materialisierte
aktuelle LegalAction-Invocations einschließlich erforderlicher Choice-Werte
desselben Executors, desselben konkreten Steps, derselben validierten
Prioritätsklasse und derselben Parentbindung. Ihre Action-IDs sind kanonisch
sortiert und sie trägt einen festen fachlichen Randomisierungszweck. Eine
Action, die durch Commitment, exakten Schutzeffekt, Kostenquote oder andere
harte Evidence unterlegen ist, darf nicht Mitglied der Menge sein.

Der Scheduler wählt daraus nicht selbst per Hilfshash oder lokaler
Pseudozufallsfunktion. Er übergibt die Kandidatenmenge an einen atomaren
Engine-Einstiegspunkt. Die Engine revalidiert vor jedem RNG-Verbrauch für
jede vollständige Invocation Side, StateVersion, Action-ID, Timing, Expiry,
Kosten, Ziel und Choice-Werte. Scheitert eine Revalidierung, endet der
Übergang fail-closed, ohne den `RandomCounter` zu verändern. Erst danach zieht
die Engine exakt einmal aus dem Match-RNG, schreibt einen
`RandomDrawRecord` mit dem Selection-Purpose, wählt die konkrete LegalAction
und wendet sie im selben autoritativen Übergang an. Preview und reine
Bewertung verbrauchen keinen Zufall. Receipt, Replay und Decision Trace führen
die tatsächlich gewählte Action und den Draw-Nachweis.

Er liefert niemals:

- eine neu erzeugte Aktion;
- eine ungeprüfte Alternative zur Engine-Aktion;
- eine Randomisierungsmenge über verschiedene Pläne, Steps,
  Prioritätsklassen oder unterschiedlich bewertete harte Verträge;
- einen veralteten Planbefehl gegen eine neue StateVersion.

Choice-Payload-Auflösung erfolgt erst, nachdem Plan, Step, Route und
`actionId` feststehen. Sie darf ausschließlich zulässige Optionswerte für
diese bereits gewählte Action bestimmen. Sie darf weder die `actionId`
ändern noch die Planwahl neu öffnen. Fehlt für eine Choice die notwendige
Domainlogik oder eine eindeutige planbezogene Bindung, schlägt die
Entscheidung fail-closed fehl.

Bei einer Nahgleichstandsmenge muss diese Auflösung für jeden Kandidaten vor
der Übergabe vollständig abgeschlossen sein. Nach dem Engine-Draw gibt es
keinen AI-Callback und keine zweite Plan-, Action- oder Choice-Wahl.

### 5.3 Ausführungsursprung und Receipt

Öffentlich als Runner-Programm installierte Karten tragen ihre aktuelle
Installationsrolle in `VisibleCard.installedAsRunnerProgram` durch PlayerView
und KI-DTO. Gedruckter Kartentyp und Eigentümer bleiben separat erhalten.
Programm-Zielentscheidungen prüfen deshalb die aktuelle Rolle und
Runner-Kontrolle; eine übernommene Corp-Agenda darf nicht aus einem exakt
gebundenen legalen Programmzielangebot herausgefiltert werden.

Fenster- und Runfortsetzungen tragen einen stabilen, side-sicheren Ursprung:

```ts
type PlanExecutionOrigin = {
  rootPlanInstanceId: string;
  executorInstanceId: string;
  phase: string;
  stepId: string;
  routeId: string;
  commitmentId?: string;
  runPurpose?: string;
};

type PlanExecutionReceipt = {
  beforeStateVersion: number;
  afterStateVersion: number;
  origin: PlanExecutionOrigin;
  actionId: string;
  randomDrawRecord?: RandomDrawRecord;
  expectedOutcome: OutcomeEnvelope;
  observedEvents: SideSafeEvent[];
};
```

Der Ursprung verändert weder Engine-Regeln noch LegalActions. Er bindet
optionale Ability-, Run-, Access- und Trace-Entscheidungen an das auslösende
Vorhaben und ermöglicht Outcome-basierte Fortschrittsprüfung.

Eine verpflichtende Run-Fortsetzung bewahrt diesen Ursprung auch über mehrere
zusammenhängende Engine-Fenster. Die Bindung beginnt an der exakten aktuellen
Execution Lease; jeder weitere Übergang muss lückenlos, um genau eine
StateVersion fortschreitend und demselben angegriffenen Server zugeordnet
sein. Zulässig sind hier nur Runner-Runfortsetzungen und Corp-Rez-/Pass-Fenster.
Eine feste Nachbarschaftsgrenze darf diese belegte Herkunft nicht abschneiden.

Auch ein allgemeines `runner.rig_and_coverage`-Aufbauvorhaben bindet seine
konkreten Installationsaktionen über `gap.installActionIds`, unabhängig von
einem benannten Run-Ziel. Diese IDs entstehen zusammen mit den
Installationsbewertungen am Coverage-Producer. Ein anschließendes
Zahlungsfenster bewahrt den bereits gewählten Auftrag und darf fehlende
Bindungen nicht aus einer neu bewerteten Aktion rekonstruieren. Direkte
Heap-Rückholungsereignisse erhalten Effekt und Suchfilter aus der
deklarativen Engine-Implementierung; der zuständige Plan bindet das Ziel vor
dem Ausspielen, bevor das Ereignis selbst in den Heap gelangt.
Öffnet die ausgewählte Suchaktion zuvor ein Engine-Zahlungsfenster, erhält
dieselbe Suchbindung bei der exakten Fortsetzung zusätzlich
`engineContinuationAtStateVersion`. Ursprünglicher Planungs- und
Auswahlzeitpunkt sowie Quelle, Ziel und Executor bleiben erhalten. Die
anschließende Choice bindet ihre StateVersion an diese Fortsetzung; ein
übersprungenes Zahlungsfenster darf die Versionsprüfung nicht abschwächen.

Auch eine zunächst kostenlose `continue_run`-Aktion bewahrt diesen Ursprung:
Der Encounter-Eintritt kann erst danach eine Zahlung auslösen. Die exakte
Engine-Fortsetzung behält Action-ID, Root, Executor und Step; ein fehlender
Ursprung wird nicht aus der einzigen verbleibenden Bankaktion geraten.

Bekannte installierte `runnerPaymentSupportAbilities` gehen als bedingte,
einmalige Quellen in die Restpfadquote ein. Die Quote benötigt ausdrücklich
den liquiden Creditbestand für ihre Aktivierung, zählt alternative Fähigkeiten
derselben Trashquelle nur einmal und gibt sie erst an einem positiven
Zahlungsschritt frei. Die Quellen werden im fortgeschriebenen Ledger verbraucht.
Run-Credits ersetzen keine Aktivierungscredits. `runner.convert_run_window`
bindet die konkrete Bankaktion an das aktuelle Zahlungsfenster, bevor dessen
Engine-quotiertes Cash-Ziel die Aktivierungsliquidität aufbrauchen würde.
Der Fensterresolver erhält dabei ausschließlich den bestehenden Auftrag.

Eine solche Quelle in der eigenen sichtbaren Hand kann `runner.economy` als
Installationsschritt für einen exakt gebundenen Run vorbereiten. Der Compiler
[runner-payment-install-planning.ts](../../../packages/ai/src/plans/runner-payment-install-planning.ts) verlangt aktuelle Installationslegalität,
bekannte Kosten und eine bedingungsfreie einmalige Zahlungsfähigkeit aus dem
kanonischen PlanningCard-Vertrag. Der bekannte vollständige Pfad muss ein
positives Zahlungsfenster ohne ungeklärte ICE oder unvermeidbare Gefahren
belegen. Installation, Aktivierungsliquidität und der reservierte Run-Klick
müssen vollständig passen. Der zukünftige Zahlungsgewinn beendet ausschließlich
die Finanzierung dieses Runs; er finanziert keine vorherigen Setup-Aktionen
und zählt nicht als liquide Reserve. Nach jedem Engine-Schritt wird der Auftrag
mit aktuellen LegalActions erneut materialisiert. Bei mehreren Run-Aktionen
zum selben Server zählt deren konkrete Finanzierbarkeit vor ihrem bloßen
Bewertungsvorteil. Ein finanzierbarer terminaler Angriff mit vorhandenen
Breakern benötigt keine vorgeschaltete Suche nach einem günstigeren Breaker.

Die Pump-Viabilität führt vorhandene Run-Credits separat vom liquiden Pool,
verbraucht sie vor Credits aus dem Pool und reicht nur ihren verbleibenden
Betrag an die Restpfadquote weiter. Sie zählen nicht als verbleibende liquide
Reserve. Runstart, Pumpfolge und anschließender Break müssen dadurch dieselbe
bezahlbare Engine-Folge anerkennen.
Die Pfadquote trennt aktuelle Encounter-Stärke von über das ICE hinaus
gültiger Stärke. Ein bezahlter Encounter-Pump gilt für alle weiteren
Subroutinen desselben ICE, einschließlich aufeinanderfolgender Trace-Breaks,
und wird dort nicht erneut berechnet. Am nächsten ICE sowie in dessen
Vorausberechnung bleibt nur ausdrücklich länger gültige Stärke erhalten.
Bei Engine-typisiertem Schaden, der durch vollständigen Bruch des nächsten
ICE entfällt, vergleicht die bekannte Pfadbewertung den Bruch der Quelle mit
dem vollständigen Bruch des bekannten nächsten Encounters. Unbekannte,
ungerezzte oder bedingt veränderliche Folgezustände zertifizieren diese
Alternative nicht. Die gewählte vollständige Brechung bezahlt Pump und
Subroutinen genau einmal, trägt Breakerzustand und Zahlungspools weiter und
weist die vollständig gebrochenen ICE aus. Die nachgelagerte Schadensprüfung
rechnet diese bereits bezahlten Subroutinen nicht erneut als Schaden oder
optionale Zusatzzahlung. Runstart und Fortsetzung bleiben beim bestehenden
Contest-/Runwindow-Owner mit jeweils aktuellen LegalActions; eine Quote
wählt keine Action und ersetzt keine Engine-Fortsetzung.
Auch nach Auflösung der Quelle prüft der Bewegungs-Guard die typisierte
Vollbruchbedingung gegen die aktuelle Quote des nächsten bekannten,
gerezzten ICE. Ein deterministischer, mit vorhandenen Credits bezahlbarer
Vollbruch verhindert diesen bedingten Schaden; er wird nicht pauschal vom
Handpuffer abgezogen. Fehlende oder fremde Quotes, dynamische
Encounterbedingungen, Breaksperren und unzureichendes Geld zertifizieren
keine solche Fortsetzung. Weitere sichtbare Gefahren bleiben separat aktiv.
Bereits ausgelöste Zukunftsschäden werden am Ursprung des aktuellen Runs
abgegrenzt. Die Engine bindet dessen `runId` an die StateVersion der
erzeugenden Aktion; dadurch begrenzen auch Event- und Fähigkeitsstarts den
Historienausschnitt. Eine alte Quellenauflösung aus einem vorherigen Run
darf keine neue Schadenspflicht erzeugen, auch wenn beide denselben Server
angreifen. Der bloße Actiontyp `start_run` deckt diese Ursprünge nicht ab.
Ein Runstart-Choice-Ursprung entsteht nur aus einer echten Runstart-Aktion
oder einer entsprechend gebundenen Engine-Runfähigkeit. Ein projizierter
Serverkontext innerhalb eines laufenden Runs genügt nicht: Eine Bankaktivierung
oder ein anderer Fenstereffekt darf dadurch keinen neuen Runstart-Ursprung
erhalten und die anschließende Originalfortsetzung verdrängen.

Für kanonische Run-Ereignisse mit vorgeschalteter Programmsuche entsteht der
Ursprung bereits beim direkten Ausspielen, nicht erst in einem optionalen
Zahlungsfenster. Such-Choice, erforderliche MU-Freigabe und Runstart-Ordering
bleiben beim ausgewählten Entwicklungs- oder Coverage-Executor. Coverage bindet
die tatsächlich aufgelöste Such-Choice mit ID, Source und StateVersion zusätzlich
an sein bereits gewähltes Ziel und den vorab bewerteten Opfer-Satz. Eine MU-Choice
darf keinen neuen Ziel- oder Opfer-Chooser eröffnen. Der fortgesetzte Ursprung
wird erst nach erfolgreicher Payload-Materialisierung auf die aktuelle Version
fortgeschrieben; die Prüfung selbst benötigt den vorherigen gebundenen Stand.
Die Runstart-Ereigniskette besteht aus echten Zustandstransitionen. Ein
`game_created`-Snapshot ohne Versionsfortschritt ist keine Quellaktion;
fehlende, fremde oder nicht zusammenhängende Aktionstransitionen bleiben Fehler.

Ein reiner Austausch „rezzed ICE des letzten erfolgreichen Forts entfernen
und Tags erhalten“ benötigt vor der Entwicklung die aktuelle
`runner-fort-ice-trash-quote-v1` aus der Engine. Fehlende oder veraltete Quotes
und null tatsächliche Ziele erhalten am bestehenden Entwicklungs-Owner eine
explizite nichtproduktive Disposition. Die Regellegalität bleibt unverändert.

Eine Vacuum-Link-Fortsetzung akzeptiert auch einen durch Karte gestarteten
Run, wenn dessen vorhandener `resolve_runner_run_start_order`-Ursprung exakt
an die ausgeführte TurnPlanner-Action, Root und Executor gebunden ist. Die
lückenlose Ereigniskette vom Runstart über zulässige Run-/Rez-Fenster bis
zur Subroutine und der aktuelle Engine-Choice-Vertrag bleiben verpflichtend.

## 6. Gemeinsamer Planmodul-Vertrag

**Reale API:** [PlanModule](../../../packages/ai/src/plans/plan-scheduler.ts)
besitzt `moduleId`, `side` und genau drei Methoden:

```ts
type PlanModule = {
  moduleId: PlanModuleId;
  side: Side;
  discover(context: PlanSchedulerContext): PlanProposal[];
  assess(
    instance: PlanInstance,
    context: PlanSchedulerContext,
    portfolio: ResidentPlanPortfolio,
  ): PlanAssessment;
  materialize(
    instance: PlanInstance,
    assessment: ValidatedPlanAssessment,
    context: PlanSchedulerContext,
  ): PlanMaterialization;
};
```

| Konzeptionelle Fähigkeit                                             | Tatsächliche Implementierung und Verantwortung                                                                                                                                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neue Vorhaben erkennen                                               | Owner-`discover`; `PlanProposal` enthält den stabilen `dedupeKey`                                                                                                                                                                   |
| Instanziieren und reconciliieren                                     | `reconcileResidentPlanPortfolio` in [resident-plan-portfolio.ts](../../../packages/ai/src/plans/resident-plan-portfolio.ts); kein `instantiate`-/`reconcile`-Hook im Modul                                                          |
| Machbarkeit, nächsten Step, Bedarf und Prioritätsanspruch beurteilen | Owner-`assess`; [PlanAssessment](../../../packages/ai/src/plans/plan-assessment.ts); zentrale Policy validiert den Claim                                                                                                            |
| Stepvorschlag, Routen und planlokaler Vergleich                      | Owner-`materialize` liefert `PlanMaterialization` mit `step`, Kandidaten und optionaler Continuation; [plan-route.ts](../../../packages/ai/src/plans/plan-route.ts) bindet und vergleicht kompatible Routen                         |
| Planning Heads vor endgültiger Auswahl                               | `enumerateCurrentPlanSchedulerRoutes` in [plan-scheduler.ts](../../../packages/ai/src/plans/plan-scheduler.ts) verwendet Modulmaterialisierung als nichtautoritative Vorschau; die side-spezifischen TurnPlanner bauen daraus Heads |
| Zukunft projizieren                                                  | Fachliche Projektionsdienste und TurnPlanner-Adapter; [Implementierungskarte](turn-campaign-planner.md#implementierungskarte); kein zusätzlicher `projectSemanticContinuations`-Hook auf `PlanModule`                               |
| Fortschritt rückführen                                               | `PlanOutcomeReceipt`, `applyPlanSchedulerReceipt` und `applyPlanOutcomeReceipt`; neue Discovery-/Assessmentfakten revalidieren den Ownerzustand                                                                                     |
| Erklären und redigieren                                              | Schedulerdiagnostik, Runtime-Debugprojektion und [Trace-Vertrag](decision-trace-contract.md); kein `redact`-Hook auf `PlanModule`                                                                                                   |

Die Registry hält nur die gemeinsame Oberfläche. Ein Owner darf intern
Fakten, Finanzierung, Quotes, Varianten und Continuations auf mehrere
Funktionen verteilen; das begründet keine globale Action-Auswahl.
Ein ausführbarer Claim verlangt eine exakte aktuelle Route. Nichtautoritative
Vorschau und spätere autoritative Rematerialisierung erfüllen verschiedene
Aufgaben, auch wenn beide dieselbe `materialize`-Methode verwenden.

### 6.1 Planunsicherheit und exakter aktueller Step

Plan-first bedeutet nicht, dass eine vollständige mehrstufige Aktionsfolge
schon bei Discovery sicher feststehen muss. Eine Planinstanz darf eine
Hypothese, ein Erkundungsziel, alternative Fortsetzungen, offene
Informationen und revalidierbare Annahmen enthalten. Diese strategische
Unsicherheit ist ein normaler Bestandteil des Plans und kann seine Bewertung
senken oder einen Informations-, Entwicklungs- oder Sondierungsschritt
erzeugen; sie macht den Plan nicht allein deshalb unzulässig.

Exakt und fail-closed gebunden sein müssen dagegen der aktuelle `head`, seine
Legalität, Kosten, Ziele, Choices und die unmittelbar behauptete Regelwirkung.
Nach der Anwendung wird der Plan anhand der neuen side-sicheren Beobachtung
fortgesetzt, umgeplant, blockiert oder abgebrochen. Der Kernel darf deshalb
„zukünftige Planwirkung ungewiss“ niemals mit „aktuelle LegalAction
unbekannt“ gleichsetzen.

`assessment_unknown` bezeichnet nur, dass ein konkreter aktueller
Action-/Assessmentpfad keine belastbare Behauptung tragen darf. Die
Klassifikation verhindert, dass der Scheduler daraus
`productive_routes_exhausted` oder TurnCompletion ableitet. Sie ist kein
globaler Stillstandsbeweis: Eine andere aktuelle, exakt materialisierte
produktive Route darf regulär konkurrieren und ausgeführt werden. Fehlt
dagegen selbst für die auszuführende Action die unmittelbare Kosten-,
Legalitäts- oder Zielbindung, bleibt dieser Route die Ausführung verwehrt.

`productive`, `explicitly_nonproductive` und `assessment_unknown` sind
ausschließlich Klassifikationen eines aktuellen Route Heads in einer
konkreten StateVersion. Sie entscheiden weder über die Lebensberechtigung
noch über die Priorität der zugehörigen Parent-Planinstanz. Ein aktuell
abgelehnter Agenda-Install darf beispielsweise den residenten Scoreplan nicht
entfernen, wenn dessen nächster Schutz-, Entwicklungs- oder Funding-Step
weiter revalidierbar ist.

Action-Dispositionen sind Coverage- und Diagnoseevidence des jeweils
zuständigen Planmoduls. Sie sind kein negativer Action-Chooser und dürfen die
Planpriorisierung nicht dadurch ersetzen, dass zunächst fast alle
LegalActions ausgeschlossen werden. Wiederholt unowned oder ausschließlich
wegen späterer Planunsicherheit abgelehnte Action-Familien belegen eine
fehlende beziehungsweise falsch geschnittene Planfamilie. Sie werden durch
einen generischen Planvertrag geschlossen, nicht durch match-, karten- oder
StateVersion-spezifische Freischaltungen.

Für Runner-ICE-Sabotage umfasst dieser Vertrag sowohl Bypass als auch
gezieltes Entfernen beziehungsweise erzwungenes Rez-oder-Trash. Bindet die
bestehende Zentraldruck- oder Remote-Planung keine aktuelle Vorbereitungsroute,
liefert der Zentraldruck-Owner die ausdrückliche Nichtproduktivitäts-Disposition
für diese Action. Bereits gebundene Vorbereitungen behalten ihren jeweiligen
Owner und werden nicht erneut disponiert. Die Disposition wählt weder ein
anderes Ziel noch eine Ersatzaktion; die Choice bleibt an die gewählte Route
gebunden.

## 7. Planinstanz-Vertrag

Maßgebliche API: [PlanInstance](../../../packages/ai/src/plans/plan-kernel-types.ts).
Sie enthält Identität, Modulversion, Side, Ziel, drei Zustandsachsen,
Persistence-/Retention-Policy, Parent-/Need-Referenzen, Phase, Meilenstein,
Ownerzustand und Fortschritt. Ressourcen, Reservierungen und Commitment werden
über `resourceClaimIds`, `acceptedReservationIds` und `commitmentId` referenziert;
ein zweiter eingebetteter Ressourcen-/Commitmentbestand ist kein Ist-Vertrag.
Priorität gehört zum Assessment der aktuellen StateVersion, nicht zu einem
autoritativen gespeicherten Instanzrang.

### 7.1 Modulzustand

`moduleState` ist planintern versioniert. Nur das Modul interpretiert ihn.

Beispiele:

- R&D-Plan: Highlighter-Zähler, bekannte Zugriffstiefe, Topkartenfrische;
- Economy-Plan: Zielreserve, verfügbare Quellen, Auszahlungsfenster;
- Corp-Killplan: verfügbare Tagquelle, Damage-Summe, sichtbare
  Trace-Projektion und Garantiegrad;
- Remote-Projekt: Zielserver, Schutzband, Rez-Reserve, nächste Härtungsstufe.

Der Scheduler darf daraus keine kartenspezifischen Sonderregeln ableiten.

## 8. Orthogonale Plan-Zustandsachsen

Lebensfähigkeit, Portfoliorolle und Ausführung werden nicht in einem
mehrdeutigen `active`-/`suspended`-Zustand vermischt:

```ts
type PlanViability =
  | "dormant"
  | "ready"
  | "blocked"
  | "completed"
  | "abandoned";

type PlanPortfolioRole = "foreground" | "background" | "unassigned";

type PlanExecutionState = "idle" | "executor" | "preempted";
```

`proposed` liegt vor der Portfolioaufnahme und ist kein persistenter
Planstatus. Ein reaktiver Kandidat ist ein `ready`-Plan mit validiertem
Response-Claim; mehrere solcher Kandidaten dürfen gleichzeitig existieren.
Nur einer kann `executor` sein.

Beispielkombinationen:

```text
ready   + background + idle
ready   + foreground + executor
ready   + foreground + preempted
blocked + foreground + idle
```

`completed` und `abandoned` bleiben nur gemäß Retention-Vertrag kurz im
Portfolio und wechseln dann in redigierte Historie. `preempted` benötigt einen
klassifizierten Grund und eine Resume Condition.

`progressing` ist kein Status. Fortschritt ist ein Ergebnis zwischen zwei
StateVersions.

### 8.1 Identität und Retention

Der Kernel bildet die technische Instanzidentität aus Modul, Modulversion und
stabilem `dedupeKey`. Das Modul definiert, welche fachlichen Änderungen eine
bestehende Instanz fortsetzen und welche eine neue Instanz verlangen.

Jede Persistence Policy legt fest:

- wann eine Opportunity verfällt;
- wie lange `blocked` ohne neue Evidence resident bleibt;
- wann ein Zonen- oder Targetwechsel die Instanz invalidiert;
- wie lange abgeschlossene Instanzen diagnostisch gehalten werden;
- welche Bindung, offene Need oder geschützte Fortsetzung Verdrängung
  verhindert.

„Alle relevanten Pläne bleiben resident“ ist eine fachliche Aussage, keine
unbegrenzte Speicherzusage. Relevanz muss durch Retention-Regeln belegbar sein.

## 9. Portfolio und Ausführungsrollen

### 9.1 Rollen

Das Portfolio unterscheidet:

- mehrere mögliche `urgent_response`-Kandidaten;
- höchstens einen ausführenden `foreground`;
- mehrere persistente `background`-Projekte;
- beliebig viele fachlich relevante `dormant`, `blocked` oder `preempted`
  Instanzen innerhalb eines technisch begrenzten Speichers.

Eine feste Grenze von zwei Background-Projekten ist keine fachliche Invariante. Alle weiterhin relevanten
Planinstanzen bleiben resident, damit Fortschritt, Blocker und
Wiederaufnahmebedingungen nicht bei jeder Entscheidung neu aufgebaut werden
müssen.

Eine spätere rein technische Speicherbegrenzung muss:

- ausreichend hoch sein;
- deterministisch sein;
- Verdrängung sichtbar diagnostizieren;
- strategisch gebundene oder fortgeschrittene Projekte schützen.

### 9.2 Genau ein Executor

Bei jeder freiwilligen Entscheidung besitzt genau ein Plan die
Ausführungsautorität:

```text
validierte Urgent Response vorhanden?
  ja  → höchstpriorisierte Response ist Leaf-Executor
  nein → Vordergrund oder delegierter Supportplan ist Leaf-Executor
```

Ein Background-Projekt darf:

- in einen ausdrücklich vom Vordergrund freigegebenen Portfolio-Slice
  wechseln;
- einen offenen Parentbedarf mit delegierter effektiver Priorität erfüllen;
- eine planverträgliche Route des Vordergrunds liefern;
- von einer Vordergrundaktion nebenbei profitieren;
- Soft Claims für Ressourcen veröffentlichen.

Es darf nicht durch die Addition vieler kleiner Beiträge den ausführenden
Vordergrundplan umgehen. Cadence begrenzt Nutzung; sie erzeugt keine höhere
Prioritätsklasse.

### 9.3 Wechselnde aktive Pläne

Mehrere Pläne dürfen über einen Zug oder mehrere Züge hinweg abwechselnd
handeln. Beispiel:

- eine R&D-Kampagne ist Vordergrund;
- die R&D-Kampagne erlaubt einen günstigen Portfolio-Slice für Broker oder
  delegiert einen Fundingbedarf;
- der Broker-Bankplan darf gemäß Cadence einmal laden;
- danach kehrt die R&D-Kampagne zurück.

Dieser Wechsel ist eine explizite Schedulerentscheidung. Die R&D-Kampagne
bleibt gespeichert und wird nicht neu entdeckt.

## 10. Aktueller Scheduler- und Runtime-Ablauf

Der produktive Aufruf ist `choosePlanFirstLiveAction` in
[plan-first-live-runtime.ts](../../../packages/ai/src/runtime/plan-first-live-runtime.ts).
Die Runtime orchestriert folgende Schritte:

1. Aktuelle Action-Semantik und vorige residente Instanzen lesen; Engine-Fenster
   mit bestehendem Origin auflösen oder `runnerContext` / `corpContext` erzeugen.
2. `runPlanScheduler` führt Discovery, Portfolio-Reconciliation, Assessment,
   Claimvalidierung und die zunächst gebundene Route zusammen. Dieses Ergebnis
   ist im normalen Planpfad Eingabe des TurnPlanners, noch nicht die endgültige
   ungeprüfte Action-Ausgabe.
3. `buildCorpTurnPlannerShadow` beziehungsweise `buildRunnerTurnPlannerShadow`
   enumeriert die aktuellen Modulrouten und vergleicht unterstützte Linien
   im produktiven Modus `cutover`. Ein ausdrücklich gewähltes `legacy_compare`
   ist ein separater Vergleichsmodus, kein automatischer Fehlerfallback.
4. `resolveTurnPlannerCutover` revalidiert Commitment und aktuellen Step;
   `applyTurnPlannerCutoverSelection` bindet die ausgewählte Route und ihren
   Root-/Leaf-Pfad zurück an das Schedulerergebnis.
5. Die Runtime bindet Folge-Choices und `PlanExecutionOrigin`, erzeugt die
   Entscheidung und speichert den aktuellen Portfolio-/Commitmentstand.
   Die Engine revalidiert und vollzieht die eingereichte Action.

Die [Zug-/Kampagnendetails](turn-campaign-planner.md) definieren Suche,
Prioritätspflichten, Informationsgrenzen, Rematerialisierung und Fortschreibung.
Dieser Ablauf ist keine Aufforderung, eine zweite Scheduler-API einzuführen.

## 11. Planpriorisierung

Dieser Abschnitt definiert Modulclaims und die Schedulerbewertung. Den
aktuellen Linienvergleich einschließlich Prioritätsrang beschreibt allein
[Bewertung der Varianten](turn-campaign-planner.md#3-bewertung-der-varianten).

### 11.1 Lexikografische Prioritätsklassen

Nicht alle Pläne werden in einen einzigen beliebigen Zahlenraum geworfen.
Zuerst gilt eine fachliche Prioritätsklasse:

| Klasse | Bedeutung                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| P0     | erzwungenes Engine-/Auflösungsfenster                                                            |
| P1     | unmittelbar terminaler Sieg oder notwendige Verhinderung einer unmittelbar terminalen Niederlage |
| P2     | akutes Überleben, kritische Score-Threat oder irreversible Gefahr                                |
| P3     | auslaufende, stark konvertierbare Gelegenheit                                                    |
| P4     | aktiver strategischer Hauptplan                                                                  |
| P5     | Setup-, Entwicklungs- und Supportplan mit konkretem Bedarf                                       |
| P6     | endlicher Normalfortschritt oder strukturell belegter Completion-Plan                            |

Ein P5-Plan darf keinen ausführbaren P2-Plan durch einen hohen lokalen
Actionscore verdrängen.

Ein Modul vergibt diese Klasse nicht selbst. Es beantragt sie:

```ts
type PriorityClaim = {
  requestedClass: PriorityClass;
  reasonCode: PriorityReason;
  horizon: PlanHorizon;
  witness?: TerminalOrThreatWitness;
  confidence: GuaranteeLevel;
};
```

Die Scheduler-Policy kann den Claim bestätigen oder herabstufen. P1 verlangt
einen belegten terminalen Pfad oder belegte unmittelbare
Niederlagenverhinderung; P2 verlangt einen konkreten Survival- oder
Score-Threat.

Bei mehreren P1-Plänen bewertet ein side-spezifischer Terminalsolver:

- Garantiegrad;
- benötigte Aktionen und Ressourcen;
- Reihenfolge;
- gegnerische Eingriffsmöglichkeit;
- eigene Sieg- gegenüber Niederlagenverhinderung.

Terminalität wird durch die aktuellen side-sicheren Terminal-/Threat-Witnesses
der Owner und ihre Engine-Quotes belegt. `evaluateTerminalConditions` war
ein konzeptioneller Funktionsname und ist keine vorhandene gemeinsame AI-API. Sie umfasst neben Agenda
und Flatline auch Deckout, Bad-Publicity- oder andere im normativen
NETGRID-Regelvertrag tatsächlich freigeschaltete Niederlagen- und
Siegbedingungen.

### 11.2 Wert innerhalb einer Klasse

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

### 11.3 Readiness

Readiness trennt:

- `executable_now`;
- `executable_with_support`;
- `waiting_for_condition`;
- `blocked`;
- `nonviable`.

Ein langfristig sehr attraktiver, aber noch wartender Killplan verdrängt
keinen aktuell ausführbaren Scoring-Plan. Er bleibt dennoch im Portfolio.

`executable_now` und ein offener `ResourceGap` sind innerhalb derselben
aktuellen Planbewertung gegenseitig ausgeschlossen. Ein exakt gebundener
Supportbedarf beschreibt, warum der Parent noch keinen aktuellen Route-Head
besitzt, und begründet dann `executable_with_support`. Sobald derselbe Parent
einen aktuellen Route-Head materialisieren kann – auch über eine andere
zulässige Vorbereitung oder alternative Route –, darf der frühere
Supportbedarf diese Bewertung nicht zusätzlich als supportabhängig
klassifizieren. Die residente Need-/Supportbeziehung darf für spätere
Revalidierung im Portfolio erhalten bleiben; Prioritätsclaim, Readiness und
`resourceGaps` des aktuellen Assessments müssen jedoch denselben gegenwärtigen
Ausführungszustand beschreiben.

### 11.4 Hysterese

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

Die Prioritätsklassen sind hart lexikografisch. Kein Zahlenwert eines
niedrigeren Rangs kann einen ausführbaren Plan einer höheren Klasse
überstimmen. Zahlenwerte und normalisierte Merkmale entscheiden nur zwischen
Plänen derselben Klasse.

Cadence ist ausschließlich eine Nutzungsschranke. Ein niedriger klassifizierter
Background erhält dadurch kein Recht, einen höheren Vordergrund zu verdrängen.
Er handelt nur in einem freigegebenen Portfolio-Slice, als planverträgliche
Route oder mit delegierter Priorität eines offenen Parentbedarfs.

### 11.5 Entstehung strategischer und taktischer Pläne

Eine langfristige strategische Kampagne verlangt eine belastbar vom eigenen
Deck getragene Strategie oder Fähigkeit. Ein einzelner zufälliger Draw darf
keine neue langfristige Deckidentität erzeugen.

Ein taktischer Plan verlangt dagegen eine konkrete aktuelle Spielsituation:

- existierendes Remote für Remote-Contest;
- sinnvolle HQ-Kartenexposition für HQ-Druck;
- erreichbares R&D für R&D-Probe;
- sichtbare Score-Threat;
- tatsächlicher Tag-, Damage- oder Survival-Kontext;
- konkrete Funding-, Coverage- oder Schutzlücke.

Ein generischer kurzfristiger Plan benötigt keinen langfristigen
Strategieanker, aber immer einen positiv definierten, endlichen fachlichen
Zweck. Er darf nicht deshalb entstehen, weil Planabdeckung, Mapping oder
Bewertung einer anderen Action fehlt.

Planmodule erhalten die side-sichere eigene Deckstrategie, DeckCapabilities
und bekannte Rollen ihres Decks. Eine R&D-Kampagne darf deshalb wissen, dass
noch eigene Multiaccess-, Search- oder Druckwerkzeuge im Deck vorhanden sind,
und Draw oder Search als planinterne Steps erwägen. Sie kennt dadurch weder
die verdeckte Kartenreihenfolge noch gegnerische Hidden-Zonen.

## 12. Steps, Fähigkeiten und LegalActions

### 12.1 Capability-first

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
Resolver verwenden dafür ausschließlich die semantische Projektion der
aktuellen LegalActions:

```text
LegalAction
→ ActionSemanticCandidate
→ CapabilityKinds + Target + Kosten + Fensterkontext
→ Step-Match
```

Eine bloße Action-Familie oder ein positiver Taktikscore reicht nicht.
Capability und Target müssen den Stepvertrag erfüllen. Diese Semantikbrücke
bleibt verbindlicher Kernelinput und wird durch Plan-first nicht ersetzt.

### 12.2 Planlokale Routenauswahl

Beispiel: Ein R&D-Plan braucht 3 zusätzliche Credits.

Mögliche Routen:

- Livewire’s Contacts;
- bis zu drei Basic Credits innerhalb des exakt berechneten Fundingbedarfs;
- Bank-Cashout;
- eine verfügbare Economy-Ability.

Der Economy-Resolver bewertet diese Routen im Kontext des angefragten
R&D-Steps. Er startet nicht automatisch eine neue langfristige
Wirtschaftsstrategie.

Basic Credit ist in Parent-Funding- und Reserve-Routen ausschließlich
zulässig, wenn die Route eine endliche, quantifizierte Zielreserve oder einen
konkreten Parent-Fundingbedarf verkleinert.

Bis die verbleibende normale Zugkapazität vollständig durch fachliche Pläne
und exakte Parentbedarfe abgedeckt ist, existiert genau ein enger, befristeter
P6-Liquiditätsplan als Übergangs- und Sicherheitsvertrag. Er ist ausdrücklich
kein Bestandteil der Zielarchitektur, keine Reserve und kein
Defense-Support. Der Zielzustand bindet auch Basic Credit ausschließlich an
einen fachlichen Economy-Plan oder einen exakten Parentbedarf. Der
Übergangsplan bindet ausschließlich die aktuelle, vollständig projizierte
Basic-Credit-LegalAction und konvertiert höchstens die beim Erkennen noch
verbleibende normale Zugkapazität in allgemeine Liquidität. Sein Zugziel ist
endlich:
`targetCredits = currentCredits + remainingClicks`; jede Ausführung erhöht
Credits um eins und senkt verbleibende Klicks um eins, ohne das Ziel zu
verschieben. Höher priorisierte Pläne schlagen ihn. Eine
`assessment_unknown`-Action kann ihn nicht ersetzen und bleibt für ihren
eigenen Pfad fail-closed; sie verhindert seine unabhängig exakte Ausführung
aber nicht. Solange irgendeine Action unknown bleibt, darf daraus niemals
TurnCompletion entstehen. Draw, Installation, Run oder EndTurn dürfen diese
Übergangsausnahme nicht mitbenutzen. Draw besitzt niemals eine neutrale
P6-Route. Ein regelbewiesener terminaler Sieg durch Abwarten auf den
Corp-Deckout unterdrückt den P6-Liquiditätsplan vollständig; ungenutzte Klicks
sind dort kein eigenständiger Fortschritt. Der P6-Zielwert bleibt pro Zug
endlich und darf sich durch seine eigene Ausführung nicht nach hinten
verschieben.

Ein Matchpoint-, Fokus- oder anderes Metasignal ist keine ausführbare Route.
Es darf ausschließlich die Priorität des bereits zuständigen Plans ändern und
niemals dessen aktuellen actiongebundenen Route Head, Ziel oder Executor durch
einen Platzhalter ersetzen.

Bei einer optionalen Programm-Trash-Installation muss der zuständige Plan vor
der Auswahl die konkrete Quellinstanz und ein fachlich vertretbares Opfer
binden. Eine direkte oder anderweitig ressourcenschonendere aktuelle
Installationsroute wird zuerst bewertet. Der Choice-Resolver ergänzt nur die
Payload der bereits gewählten Action und wählt weder Opfer noch Variante.

„Credit ist immer nützlich“, ein allgemeiner Überschuss oder fehlende
Attraktivität anderer Actions genügt außerhalb dieses eng typisierten
Zugkapazitätsplans weiterhin nicht als Planfortschritt.

### 12.3 Keine planfremde Rohscore-Rettung

Wenn ein Plan-Step keine gültige Route besitzt:

- wird der Plan blockiert;
- wird ein Supportplan angefordert;
- oder der Scheduler wählt einen anderen Plan.

Die Runtime darf nicht einfach die global am höchsten bewertete planfremde
LegalAction ausführen.

## 13. Parent-, Kind- und Supportpläne

### Reale Bedarfs- und Ressourcenoberflächen

Die Beispiele `PlanNeed`, `ActionCapacityToken`, `CreditToken`, `PlanDeadline`
und `PlanLiability` unten beschreiben fachliche Rollen; unter diesen Namen
existieren keine allgemeinen Kerneltypen. Produktiv tragen
`parentInstanceId`, `parentNeedId` und `openNeedIds` der `PlanInstance` die
Beziehung. Konkrete Fundingbedarfe stehen in `RunnerFundingNeedSignal` und
`CorpEconomyNeedSignal` der jeweiligen Core-Module. Gemeinsame Kosten- und
Horizontdaten verwenden [CreditDemand](../../../packages/ai/src/plans/credit-demand.ts),
[ActionDemand](../../../packages/ai/src/plans/action-demand.ts),
[ActionCapacityRoute](../../../packages/ai/src/plans/action-capacity-route.ts)
und [FundingRoute](../../../packages/ai/src/plans/funding-route.ts).
Projected-Ressourcen stehen im
[ProjectedDecisionFrame](../../../packages/ai/src/plans/turn-projection.ts),
harte Fortsetzungen in [PlanCommitment](../../../packages/ai/src/plans/plan-continuation.ts).
Deadline und Verbindlichkeit bleiben am konkreten Bedarf; diese Erläuterung
fordert keine neue generische Ledger- oder Liability-API.

### 13.1 Bedarf statt Zielverlust

Ein Vordergrundplan kann einen konkreten Bedarf veröffentlichen:

```ts
type PlanNeed = {
  needId: string;
  requesterInstanceId: string;
  capability: CapabilityRequest;
  minimum: ResourceQuantity;
  target?: ResourceQuantity;
  deadline: PlanDeadline;
  criticality: "required" | "preferred";
  status:
    | "open"
    | "assigned"
    | "partially_satisfied"
    | "satisfied"
    | "cancelled";
  providerInstanceId?: string;
};
```

Ein Economy-Plan oder Economy-Service erfüllt diesen Bedarf. Der übergeordnete
R&D-Plan bleibt als Parent erhalten.

### 13.2 Kindpläne

Kindpläne sind sinnvoll, wenn eine abgegrenzte Folge selbst Lebenszyklus und
Commitment benötigt:

- Bank auszahlen;
- bestimmte Coverage suchen und installieren;
- erfolgreiche Run-Konversion;
- Corp-Killsequenz ausführen.

Nach Abschluss kehrt die Autorität zum Parent zurück.

Der Scheduler führt dabei zwei Identitäten:

```text
Root-Foreground: runner.pressure_central
└─ Leaf-Executor: runner.economy:fund_parent_need
```

Supportkanten sind typisiert und zyklenfrei. Ein Supportkind erbt höchstens
die validierte effektive Priorität seines konkreten Parentbedarfs; ein
unabhängiger Economy-Plan erhält diese Delegation nicht.

### 13.3 Mehrplannutzen

Eine Aktion darf mehreren Plänen helfen. Beispiel: Eine Economy-Karte
finanziert den Vordergrund und lädt zugleich eine Strategie-Engine.

Mehrplannutzen:

- ist ein begrenzter Tiebreaker zwischen bereits planverträglichen Routen;
- darf keine Urgent Response, keinen Closeout oder notwendigen Vordergrund-Step
  überstimmen;
- wird nur bei realer Zustandsannäherung vergeben.

## 14. Ressourcen und Reservierungen

Die Engine projiziert eine aktive verpflichtende Corp-Zahlung als
`own.corpEndTurnCreditObligation` mit Betrag, StateVersion, Deadline und
terminaler Ausfallfolge. `corp.economy` finanziert einen aktuellen Fehlbetrag
als belegte P1-Pflicht. Der Corp-TurnPlanner schützt bereits verfügbare
Zahlungscredits in jedem projizierten Prefix; anfänglich unterfinanzierte
Linien dürfen die Finanzierung schrittweise verbessern. Die Prüfung verwendet
den exakten Nettocredit-Effekt, berücksichtigt vollständige Ablösung und lässt
einen vom Score-Owner zertifizierten Sieg vor der Zahlungsdeadline zu.
Eine dadurch unzulässige Aktionsvariante darf keine Prioritätsabhängigkeit für
andere, zahlungsfähige Varianten erzeugen. Die aktuelle Corp-Deadline wird
nicht auf Rezentscheidungen während des Runnerzugs übertragen.

Ein Same-Turn-Score darf einen einzelnen aktuell legalen, garantiert liquiden
Economy-Burst vor seiner Installations-/Advancementfolge zertifizieren. Der
Score-Owner prüft Vorabkosten, verbleibende Aktionen und vollständige Konversion
und veröffentlicht die genaue aktuelle Funding-Action als Supportbedarf.
`corp.economy` führt diese aus; bis zur Finanzierung bleibt die spätere
Scoreaktion blockiert. Ein separat zulässiger Installationsschritt hebt diese
Reihenfolgebindung nicht auf. Zufallsgewinn, Draw, eingeschränkte Credits und
unbelegte Kombinationen mit zusätzlichen Action-Capacity-Präfixen gehören
nicht zu dieser Garantie.

Der Scheduler verwaltet mindestens:

- Credits;
- Klicks oder zusätzliche Action Capacity;
- wiederkehrende und eingeschränkte Credit-Pools;
- Kartenquellen und Karteninstanzen;
- Counter und Bankbestände;
- Memory und Installationsslots;
- planrelevante Timingfenster.

Action Capacity und Credits werden als typisierte Tokens modelliert:

```ts
type ActionCapacityToken = {
  sourceId: string;
  quantity: number;
  allowedCapabilityKinds: CapabilityKind[];
  mustBeConsecutive?: boolean;
  expiresAt: PlanDeadline;
  usageLimit?: UsageLimit;
};

type CreditToken = {
  sourceId: string;
  quantity: number;
  allowedUses: CreditUseConstraint[];
  expiresAt?: PlanDeadline;
};

type PlanDeadline = {
  side: "runner" | "corp";
  turnId?: string;
  windowId?: string;
  beforeEvent?: PlanEventCondition;
};

type PlanLiability = {
  sourceId: string;
  kind: "action_debt" | "credit_debt" | "damage_risk" | "forced_followup";
  quantity?: number;
  due: PlanDeadline;
  confidence: GuaranteeLevel;
};
```

Dadurch bleiben Valu-Pak-, Edgerunner-, Wilson-, Broker- und andere
eingeschränkte Kapazitäten von allgemeinen Klicks oder Credits getrennt.
Spätere Action-Schulden, Damage oder verpflichtende Folgeschritte werden als
Liability bewertet und nicht als kostenlose aktuelle Kapazität verbucht.

Valu-Pak ist dabei kein allgemeiner Action-Economy-Schritt. Das Ausspielen
öffnet ausschließlich eine vorab geplante, geordnete Programminstallation:
konkrete Programme, Reihenfolge, MU-Bedarf, Installationskosten und
Credit-Floor müssen vor dem Ausspielen feststehen. Zusätzlich muss jedes
gebundene Programm jetzt mindestens einen konkreten `acute`, `useful_now`
oder `setup`-Bedarf erfüllen; mehrere bloß irgendwann brauchbare Programme
erzeugen auch gemeinsam kein produktives Bundle. Die Projektion schützt den
aktuellen Handkartenpuffer über die gesamte Sequenz und nicht nur pro
Einzelinstallation. Die Deckstrategie darf
begründen, Valu-Pak zu halten und passende Programme zu sammeln; Programme,
die erst noch gezogen werden könnten, sind aber kein Ausführungsnachweis.
Ohne produktives Commitment bleibt die Karte liegen und ihr kartenbezogener
Plan bleibt als `prepare_restricted_sequence` mit dem sichtbaren Blocker
`productive_program_bundle_not_ready` resident. Verliert eine bereits
geöffnete Sequenz ihr Commitment, meldet die Runtime einen harten
`commitment_invalidated`-Fehler und weicht nicht auf ein anderes Programm oder
ein vorzeitiges Zugende aus.

Bei mehreren historischen oder residenten Valu-Pak-Instanzen darf nur die
genau eine aktuelle Leaf-Executor-Instanz das laufende Commitment liefern.
Eine abgeschlossene ältere Sequenz ist keine Quelle für den nächsten Step.
Fehlt die Executorbindung oder wären mehrere laufende Commitments
gleichzeitig ausführbar, ist die Sequenz mehrdeutig und wird
`commitment_invalidated`.

Die Vorprüfung bewertet das Bundle als Ganzes. Sie darf nicht mehrere jeweils
lokal zulässige Einzelinstallationen addieren, wenn deren gemeinsame
Reihenfolge den MU-Rahmen, die verfügbaren normalen und eingeschränkten
Credits, den Credit-Floor oder den Handkartenpuffer verletzt. Das Commitment
bindet deshalb mindestens die sichtbaren Programminstanzen, deren Reihenfolge,
die erwartete MU-Belegung nach jedem Prefix, die Creditquelle je Installation
und den verbleibenden Puffer nach jedem Prefix.

Temporäre Credits, Installationskosten, MU-Werte und alle daraus abgeleiteten
Prefixwerte müssen endlich sein. Nicht-endliche Preflightdaten werden nicht
zu null; nicht-endliche Zahlen in einem residenten Commitment invalidieren
die laufende Sequenz.

Zukünftige LegalAction-IDs werden trotzdem nicht gespeichert. Vor dem
Ausspielen bindet der Plan die aktuell vorhandene Valu-Pak-Action exakt. Nach
dem Engine-Übergang materialisiert er für das nächste gebundene Programm genau
die dann vorhandene LegalAction-Variante. Eine andere Programminstallation,
eine andere Trash-before-install-Variante oder das vorzeitige Beenden der
eingeschränkten Sequenz ist keine gleichwertige Ersatzroute. Solche aktuell
legalen Geschwistervarianten müssen durch dasselbe Planmodul ausdrücklich als
nicht zum Commitment gehörig dispositioniert werden.

### 14.1 Bedarf

Ein Plan gibt gewünschte und zwingende Bedarfe getrennt an:

```text
minimum: für ausführbare Route zwingend
reserve: nach dem Step zu bewahrender Puffer
target: wirtschaftlich gewünschter Stand
deadline: Same Turn, Next Turn oder langfristig
```

### 14.2 Reservierung

Reservierungen werden zentral auf Konflikte geprüft. Zwei Pläne dürfen nicht
denselben Credit, Klick oder Counter gleichzeitig als garantiert behandeln.

```text
hard      – nur für Leaf-Executor oder laufende geschützte Fortsetzung
soft      – gewünschte Reserve eines residenten Plans
forecast  – erwartete zukünftige Ressource, nicht garantiert
```

Höherklassige Pläne dürfen Soft Claims präemptieren; jede Präemption wird
diagnostiziert. Background-Pläne dürfen keine dauerhaften Hard Reservations
halten.

### 14.3 Freie Ressourcen

Ressourcen oberhalb akzeptierter Reservierungen dürfen andere Pläne nutzen.
Der Scheduler muss sichtbar diagnostizieren, welche Reserve einen ansonsten
legalen Step blockiert.

## 15. Geschützte Fortsetzungen

Zeitlich oder sequenziell gebundene Effekte benötigen vor der ersten Aktion
eine belastbare Machbarkeitsprüfung. Die Engine führt trotzdem jede Aktion und
jede Zwischenentscheidung einzeln aus; der Vertrag ist keine Transaktion.

### 15.1 Commitment-Vertrag

```ts
type PlanCommitment = {
  commitmentId: string;
  rootPlanInstanceId: string;
  executorInstanceId: string;
  entryRouteId: string;
  continuationGraph: SemanticContinuationGraph;
  currentNodeId: string;
  guarantee: GuaranteeLevel;
  reservations: PlanReservation[];
  fixedTarget?: PlanTarget;
  expiresAt: PlanDeadline;
  breakConditions: PlanCondition[];
};

type GuaranteeLevel =
  | "rules_proven"
  | "visible_state_forced"
  | "robust_but_reactive"
  | "belief_supported"
  | "speculative";
```

#### 15.1.1 Exakte Bindung der aktuellen Action-Variante

Ein ausführbarer Plan-Step besitzt pro StateVersion im Normalfall einen exakt
gebundenen Route Head. Die einzige Ausnahme vor der Engine-Anwendung ist eine
nach Abschnitt 26.2 zertifizierte, kanonische Nahgleichstandsmenge aus
vollständig materialisierten Same-Step-Route-Heads. Sobald die Engine daraus
gezogen hat, existiert für Ausführung, Receipt und Planfortschritt wieder
genau eine konkrete Invocation.

Sobald ein planmodul-internes Domain-/Route-Fact konkrete `actionIds`
ausweist, sind diese IDs der vollständige ausführbare Variantenvertrag des
Steps. Dieses Fact ist ausdrücklich kein `TransientPlanSignal`; dort sind
Action-IDs als Autoritätsfelder verboten. Eine zusätzliche Materialisierung
über breite Semantik, Kartendefinition oder nur das Ziel ist in diesem
Zustand verboten.

Für jede freiwillige aktuelle LegalAction muss deshalb genau eine der
folgenden Aussagen gelten:

1. Die Action-ID ist Route eines aktuell ausführbaren Plan-Steps.
2. Genau ein fachlich zuständiges Planmodul dispositioniert die Action-ID mit
   einem konkreten Nichtproduktivitätsgrund oder als
   `assessment_unknown`.

Eine residente, derzeit nicht ausführbare Planinstanz erklärt den Zustand
des Portfolios, aber deckt keine aktuelle freiwillige LegalAction ab. Ebenso
wenig genügt eine deklarative Zuordnung nach Rollen, Kartenfamilie, Semantik
oder ein separates `actionPlanOwnerships`-Register. Solche Informationen
dürfen Discovery und Diagnose unterstützen; Planabdeckung entsteht
ausschließlich durch eine aktuelle Route oder die konkrete Disposition genau
dieser Action-ID.

Eine `assessment_unknown`-Disposition ist dabei keine
Nichtproduktivitätsbehauptung. Sie hält die betreffende Action aus
Ausführung und Exhaustion-Beweis heraus, darf aber eine andere exakt
materialisierte produktive Route nicht blockieren. Erst wenn der Scheduler
TurnCompletion erwägt, muss jede verbleibende freiwillige Action entweder
ausgeführt beziehungsweise materialisiert oder ausdrücklich als
`explicitly_nonproductive` bewiesen sein. Unknown blockiert dann
TurnCompletion fail-closed.

Eine Action darf nie gleichzeitig materialisierte Route und Disposition sein.
Ebenso darf ein Modul nicht eine Variante als gebunden erklären und über eine
breite semantische Suche deren Geschwistervarianten mitmaterialisieren.
Mehrere fachlich echte Alternativpläne dürfen vor der Executorwahl bestehen.
Nach einer normalen Route-Wahl beziehungsweise nach dem atomaren Draw einer
zertifizierten Same-Step-Nahgleichstandsmenge muss genau die konkrete
ausgewählte Variante ausführbar bleiben. Ein laufendes Commitment darf keine
solche Menge neu öffnen, sofern sein Vertrag nicht selbst exakt dieselben
nahgleichen Fortsetzungen zulässt. Alle anderen Varianten werden neu bewertet
und entweder einem eigenen weiterhin echten Plan zugeordnet oder explizit
dispositioniert.

Bei Same-Turn-Scorelinien umfasst die Bindung insbesondere Agenda-Instanz,
Zielserver und die konkrete Installations-Action. Eine andere Kopie derselben
Agenda oder derselbe Kartentyp auf einem anderen Server ist keine Fortsetzung
desselben Commitments. Vor der Executorwahl dürfen mehrere fachlich echte
Same-Turn-Pfade als getrennte, jeweils exakt gebundene Planalternativen
bestehen. Eine Installationsvariante wird erst dann dispositioniert, wenn
keiner dieser exakten Pläne ihre Action-ID bindet, oder wenn ein bereits
gewähltes Commitment sie ausdrücklich ausschließt. Das bloße Vorhandensein
irgendeines anderen Same-Turn-Pfads derselben Agenda darf nicht jede Variante
zugleich zur Route und zur Nicht-Route erklären.

#### 15.1.2 Numerischer Fail-closed-Vertrag

Alle Zahlen, die Admission, Prioritätsklasse, Planwert, Ressourcenbedarf,
Preflight oder ein residentes Commitment beeinflussen, müssen endlich und
fachlich gültig sein. `NaN`, positive oder negative Unendlichkeit und
fehlende Pflichtwerte dürfen nicht still auf null normalisiert, geklemmt oder
als neutraler Tiebreaker weitergereicht werden.

Die Reaktion bleibt domänenspezifisch und sichtbar:

- ein nicht-endlicher `withinClassValue` verwirft das PlanAssessment;
- nicht-endliche Karten- oder Preflightwerte verhindern die Planerzeugung mit
  einem konkreten Vertragsfehler;
- nicht-endliche Werte in einer laufenden geschützten Sequenz invalidieren
  das Commitment;
- Admissions wie Broker-/Development-Cashout liefern eine konkrete
  Nichtproduktivitätsdisposition statt einer scheinbar konvertierbaren
  Null-Lücke.

Eine explizite Normalisierung ist nur zulässig, wenn der Fachvertrag gerade
diesen Eingabebereich als optional und nulläquivalent definiert. Sie darf
nicht als allgemeiner Schutz gegen unvollständige Definitionen dienen.

### 15.2 Startbedingung

Eine Vorbereitung darf nur begonnen werden, wenn:

- alle zwingenden Folge-Steps und relevanten Verzweigungen semantisch bekannt
  sind;
- genügend Action Capacity vorhanden oder sicher erzeugbar ist;
- Ressourcen und Ziel erreichbar sind;
- kein bekannter harter Blocker die Konversion verhindert.

### 15.3 Bindung

Nach Beginn bleibt die geschützte Fortsetzung führend. Ein Wechsel ist nur
erlaubt bei:

- neuer validierter höherpriorisierter Response;
- Engine- oder Gegnerereignis, das die Route invalidiert;
- erkanntem Regel-/Safety-Fehler;
- bereits erreichtem terminalem Zustand.

Ein neuer positiver Rohscore ist kein Abbruchgrund.

### 15.4 Beispiele

- Prearranged Drop → Agenda-Zugriff im selben Zug;
- Promises, Promises → Agenda-Zugriff im selben Zug;
- Run-Event → tatsächlicher Run und erforderliche Zielkonversion;
- Corp Chance Observation → Tag → Urban Renewal → Scorched Earth;
- Agenda installieren → dreimal advancen → im selben Zug scoren.

Ein Verzweigungsergebnis materialisiert den nächsten Step neu. Tag scheitert,
Prävention verändert Lethalität oder ein Runpfad wird unpassierbar: Dann wird
der passende Graphzweig gewählt oder die Fortsetzung mit Grund invalidiert.

Nur `rules_proven`, `visible_state_forced` und ausdrücklich definierte robuste
Sequenzen dürfen vollständig sperren. Belief-gestützte oder spekulative Pfade
dürfen Ressourcen vorplanen, aber keine konkurrierende terminale Response
blockieren.

### 15.5 Bindungsstärken außerhalb geschützter Fortsetzungen

Nicht jeder laufende Plan benötigt dieselbe Starrheit. Der Kernel
unterscheidet vier Persistenzpolitiken:

```ts
type PlanPersistencePolicy =
  | "locked_sequence"
  | "sticky_goal"
  | "flexible_support"
  | "recurring_cadence";
```

#### `locked_sequence`

Eine bereits begonnene, zeitlich oder ressourcenseitig irreversible
Mehraktionsfolge. Beispiele:

- turn-limitierte Vorbereitung plus Zugriff;
- nach sichtbarem Zustand erzwungene Same-Turn-Scorefolge;
- begonnene Tag-/Damage-Killroute.

Sie wird nur durch ein erzwungenes Fenster, eine echte Invalidierung oder
eine notwendige höherklassige Terminal-/Survival-Response gebrochen.
Treffen zwei P1-Pfade aufeinander, entscheidet der side-spezifische
Terminalsolver anhand von Reihenfolge und Garantiegrad.

#### `sticky_goal`

Ein wichtiges fortlaufendes Ziel wie notwendige Breaker-Coverage,
R&D-Kampagne oder Scoring-Remote. Ein höherklassiger Plan darf
unterbrechen. Innerhalb derselben Klasse verlangt ein Wechsel die definierte
Marge oder einen fachlichen Blocker.

#### `flexible_support`

Ein Supportziel wie allgemeiner Geldaufbau. Der Plan darf leicht an einen
neuen Parentbedarf gebunden oder durch einen besseren Plan ersetzt werden,
solange sein bisheriger Fortschritt nicht verloren geht.

Beispiel:

```text
Economy sammelt allgemeine Reserve
→ neuer Remote-Contest wird wichtiger
→ vorhandene Credits finanzieren nun den Contest
→ kein Rückschritt und kein verlorenes Commitment
```

#### `recurring_cadence`

Ein wiederkehrender Plan wie eine Bank, der gemäß Cadence einmal handelt und
danach bewusst an den Vordergrund zurückgibt.

Ein höherer Prioritätsrang unterbricht damit gewöhnliche und sticky Pläne.
Ein `locked_sequence` besitzt zusätzlich seinen expliziten Schutzvertrag; es
wird nicht allein wegen eines neuen Zahlenwerts aufgebrochen. Der Name
bezeichnet Schedulerbindung, nicht atomare Engine-Ausführung.

## 16. Fortschritt und Wiederholung

### 16.1 Outcome statt Action-ID

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

### 16.2 Wiederholung

Eine wiederholte Action-ID ist nicht automatisch Wiederholung im fachlichen
Sinn.

Beispiele:

- Highlighter-Runs mit wachsender Zugriffstiefe: echter Fortschritt;
- BBS mit verbleibenden Countern und konkretem Fundingziel: Fortschritt;
- Basic Credit bis zur nachgewiesenen Zielreserve: Fortschritt;
- Basic Credit innerhalb des pro Zug fixierten befristeten
  P6-Übergangsziels:
  Fortschritt;
- derselbe HQ-Run ohne neue Information, Payoff oder Strategienutzen:
  möglicherweise Sättigung.

Für Remote-Zugriffe konsumiert `access-outcome-memory` neben aktuell sichtbaren
Roots das gültige, positionsgebundene Wissen aus `BeliefState`. Eine nach dem
Zugriff wieder verdeckte Karte verliert dadurch nicht ihre beobachtete
Identität. Ein bereits abgelehnter Zugriff kann nur dann den gesamten Remote
als unverändert ohne Fortschritt kennzeichnen, wenn alle aktuellen
Root-Positionen bekannt sind und keine Agenda darunter ist. Zusätzliche
unbekannte Positionen bleiben offene Informationsziele; die bestehende
Run-Zielbewertung und ihre Planowner behalten die Entscheidungsautorität.

Der DTO erhält die von der Engine ausgegebene öffentliche
`installedPositionKey`. `BeliefState` bindet diese undurchsichtige Identität an
die beobachtete Root-Position. Verlässt eine eindeutig identifizierte Karte
den Server, wird nur ihre Beobachtung entfernt; höhere Root-Indizes rücken
nach. Ohne eindeutige Positionsbindung bleibt die Erinnerung unsicher. Der
Access-Consumer prüft die letzte Beobachtung eines noch vorhandenen Roots:
Der Steal einer benachbarten Agenda macht den bereits abgelehnten Restinhalt
nicht zu einem neuen Informationsziel.

Eine öffentliche `asset_to_agenda`-Ersetzung entfernt die bisherigen
Asset-Beobachtungen. Beobachtete Upgrades rücken nur dann sicher nach, wenn
alle niedrigeren Root-Positionen bekannt sind; andernfalls bleibt ihre neue
Position unbekannt. Das Installationsereignis offenbart keine Definition der
neuen Agenda. Diese Invalidation gehört zu `BeliefState`, nicht zur
nachgelagerten Run-Zielauswahl.

### 16.3 Marginaler Nutzen

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

## 17. EndTurn-Vertrag

`EndTurn` ist kein strategischer Plan und keine normale wirtschaftliche
Alternative. In der produktiven Plan-first-Runtime wird der freiwillige
Zugabschluss dennoch durch ein enges Systemplanmodul
`runner.complete_turn` beziehungsweise `corp.complete_turn` attribuiert.
Damit bleibt die Invariante „keine freiwillige Hauptaktion ohne Plan, Phase
und Step“ auch für den Zugabschluss erhalten.

### 17.1 Noch ungelöster normativer Quellenkonflikt

Die aktuelle NETGRID-Quellenlage ist widersprüchlich:

- Das nach der Wissensbasis primäre konsolidierte MVP-Konzept führt
  `end_turn` ausdrücklich als Basic Action und LegalAction.
- Das als Regelreferenz geführte Comprehensive Rules v26.03 verlangt in
  5.4.2 Aktionen bis zum Verbrauch der Klicks oder einem kartenseitigen Ende
  der Action Phase; 9.2.6b erlaubt im Action Window keinen Pass.
- Die aktuelle Engine erzeugt `end_turn` für Runner und Corp.

Evidence:

- [Konsolidiertes MVP-Konzept](../../source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md)
- [Comprehensive Rules v26.03](../../source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf)
- [Runner Basic Actions](../../../packages/engine/src/game/turn/runner-basic-actions.ts)
- [Corp Basic Actions](../../../packages/engine/src/game/turn/corp-basic-actions.ts)

Das Review des Regel-PDF belegt daher einen echten Regelvertragskonflikt, aber
nicht, dass die nach Projektquellenhierarchie derzeit primäre Konzeption
stillschweigend überschrieben werden darf.

Offen bleibt eine ausdrückliche normative NETGRID-Regelentscheidung über:

- ob freiwilliges Zugende mit verbleibender Action Capacity regeltechnisch
  existiert;
- ob `end_turn` nur ein Engine-Komfortkommando bei null nutzbarer Kapazität
  ist;
- wie eingeschränkte Zusatzaktionen und Kartenfähigkeiten zum Phasenende
  wirken;
- welche Timingverträge für Score, Rez, Trace, Access und Pass gelten.

### 17.2 Vorläufiger KI-Sicherheitsvertrag

Solange die Engine `end_turn` anbietet, darf der PlanScheduler diese Action
bei verbleibender sicher nutzbarer Action Capacity nicht auswählen. Der
Route-Wert des freiwilligen Standard-`EndTurn` beträgt verbindlich `−10000`.
Dieser Wert verhindert, dass der Zugabschluss innerhalb seines Steps als
gewöhnlich attraktive Route erscheint. Er ersetzt aber niemals die
strukturellen Bereitschafts- und Restkapazitätsbelege des Completion-Plans.

Der Abschlussplan besitzt deshalb die niedrigste Klasse P6 und genau eine
zulässige Route: die regelbasierte Standardaction mit
`sourceKind = game_rule`. Kartenaktionen, die technisch ebenfalls den
Actiontyp `end_turn` tragen, sind nicht äquivalent. Sie dürfen nur über einen
fachlichen Karten- oder Domainplan ausgeführt werden. Der Scheduler darf
mehrere gleich benannte EndTurn-Aktionen insbesondere nicht als
„automatisches Fenster“ zusammenfassen und die erste auswählen.

`*.complete_turn` ist für den Standard-Zugabschluss nur bereit, wenn keine
normale Klickkapazität mehr verbleibt. Ein verbleibender normaler Klick sperrt
Standard-EndTurn hart; weder `explicitly_nonproductive` noch
`assessment_unknown` noch die vollständige Disposition aller übrigen
LegalActions darf diese Kapazität als verbraucht umdeuten. Davon getrennte,
eng typisierte Kapazitätsverzichts-Routen gehören einem fachlichen Domainplan
und benötigen einen vollständigen Beweis über die exakte Menge aller
verbleibenden freiwilligen Actions.

Nur wenn ausschließlich eingeschränkte, null Klick kostende
Runner-Run-Kapazität verbleibt, darf der eng typisierte
`forgo_restricted_capacity`-Pfad deren Verfallen belegen. Ein sicher nutzbarer
Bonus-Run bleibt produktiv und muss über den gebundenen Runplan ausgeführt
werden. Ein blockierter, bekannt wertloser oder unter dem erforderlichen
Handpuffer liegender Bonus-Run darf dagegen bewusst verfallen. Bei
Sicherheitsgefahr liefert `runner.defense_and_recovery` den P2-Grund; bei
bloß fehlendem Nutzen übernimmt `runner.complete_turn` P6. Der
regelbewiesene Corp-Deckout-Zugabschluss bleibt ein eigener terminaler
P1-Plan und ist kein allgemeiner EndTurn-Sonderwert.

Vor dem Start eines eingeschränkten Zusatzruns erzeugt
`runner.convert_run_window` für jede konkrete Run-Action ein zielgenaues
Signal aus ihrer aktuellen Targetevaluation. Server, Access-Commitment und
Action-Assessment werden gemeinsam gebunden; ein Signal darf keine Route
eines anderen angebotenen Servers übernehmen. Die aktuelle Runstart-Bewertung
bleibt sowohl am Route Head als auch beim Vergleich der getrennten Instanzen
erhalten; der künftige Access-Zweck ersetzt sie nicht durch einen Pauschalwert.
Die ausgewählte Instanz bleibt
als Root ihrer nachfolgenden Runfenster erkennbar, auch wenn ein Child den
aktuellen Encounter ausführt. Ein etwaiges Ablehnungsfenster behält seinen
eigenen vollständigen Actionvertrag.

Beginnt die aktive Encounter-Phase beim Run-Executor, unterscheidet die
Bindung einer verpflichtenden Vacuum-Link-Fortsetzung diese Sequenzwurzel
vom übergeordneten residenten Run-Auftrag. Sie prüft dafür zusätzlich die
konkrete Phasenwurzel, Phase und den aktuellen Knoten gegen die Execution
Lease sowie die direkte Parent-Beziehung; fremde Phasen oder Knoten dürfen
keinen Choice-Origin erzeugen.

Ersetzt eine ausführbare gezielte Bypass-Vorbereitung eine blockierte Zentral-
oder Remote-Runroute, erbt sie deren überholte `supportNeedId` nicht. Die
bestehende Coverage-Reconciliation löst den nicht mehr angeforderten
Requester; unabhängig sinnvolle Coverage bleibt beim eigenen Coverage-Owner.

`runner.defense_and_recovery` darf außerdem normale Runner-Klickkapazität nur
in zwei vollständig belegten Zuständen verfallen lassen: bei leerem Stack
oder am Runner-Matchpoint in einem günstigen Deckrennen. Dafür müssen alle
aktuellen freiwilligen Actions von ihren registrierten Ownern konkret als
`explicitly_nonproductive` klassifiziert sein; `assessment_unknown` genügt
nicht. Das Deckrennen ist für den Runner bereits günstig, wenn der positive
Corp-Deckrest kleiner **oder gleich** dem eigenen Stackrest ist: Die Corp muss
zu Beginn ihres Zuges ziehen, der Runner besitzt keinen entsprechenden
Pflichtzug. Ein größerer Corp-Deckrest, ein bereits leerer Corp-Deckrest oder
fehlender Matchpoint sperrt diese Route weiterhin.

Wenn der normative Regelvertrag bestätigt, dass ein Zug nicht freiwillig
beendet werden darf, gehört die endgültige Lösung in
Engine/LegalAction-Generierung. Dann darf `end_turn` bei verbleibender
nutzbarer Kapazität überhaupt keine LegalAction sein.

Bestätigt der Regelvertrag stattdessen das NETGRID-Hybridmodell, muss die
Engine exakt definieren, in welchen Zuständen freiwilliges EndTurn legal ist.
Der Planner darf diese Legalität nicht selbst erfinden.

## 18. Endliche Grund- und Supportpläne – kein Fehler-Fallback

Ein generischer Grund- oder Supportplan wird wie jedes andere Planmodul
regulär entdeckt, assessed und materialisiert. Er entsteht nicht erst nach
einem Fehler und ist kein Recovery-Pfad für fehlende Planabdeckung.

Ein solcher Plan:

- gewinnt nicht durch globale Scoremanipulation;
- erzeugt einen legitimen kurzfristigen Zweck;
- berücksichtigt Handüberlauf, Sicherheitsreserve und nächste bekannte
  Bedarfe;
- endet nach dem Step oder wird bei neuer Planbereitschaft verdrängt.

Zulässige Zwecke:

- eine endliche sichtbare Zielreserve herstellen;
- einen quantifizierten Parent-Fundingbedarf erfüllen;
- zwingenden Handpuffer gegen sichtbare Gefahr herstellen;
- zwingenden Overflow-/Cleanup-Bedarf erfüllen;
- einen eng katalogisierten, monoton sicheren Supportbedarf bedienen.

Ein Draw bei voller Hand und erwartetem wertvollem Überlauf ist kein sicherer
Grundplan, solange eine sinnvolle Credit-Aktion verfügbar ist.

„Allgemein Board verbessern“, unbegrenztes Credit-Horten, freier Draw und
Probe-Run sind keine Grundpläne. Sie benötigen einen fachlichen Plan oder
einen konkreten Parentbedarf.

Vor Auswahl eines generischen Grund- oder Supportplans müssen Portfolio-Aufbau,
Semantikbindung, Modulabdeckung, Ressourcenauflösung und Scheduler-Invarianten
erfolgreich sein. `missing_module_coverage`, `semantic_mapping_failed`,
`resource_conflict` und `scheduler_failure` sind harte Fehlerzustände. Sie
dürfen weder einen generischen Plan aktivieren noch dessen Auswahl
rechtfertigen. Auch „alle anderen Kandidaten sind blockiert“ genügt nicht:
Der Plan muss seine eigene positive Admission-Bedingung erfüllen.

Fehlt ein zulässiger Plan, schlägt die Entscheidung klassifiziert fehl, statt
Credit, Draw, Probe-Run oder EndTurn als Ersatzaktion zu wählen. Ein
Fallbackvertrag ist nur zulässig, wenn er einen vollständig definierten,
regelkonformen Normalzustand abbildet. Er darf niemals fehlende
Planabdeckung, unvollständige Assessments, Mappingfehler oder
Schedulerfehler kaschieren.

## 19. Kriterien für Änderungen am gemeinsamen Rahmen

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

## 20. Registrierung und Modulaufnahme

`createSidePlanRegistry` in
[plan-scheduler.ts](../../../packages/ai/src/plans/plan-scheduler.ts) erzeugt
eine `SidePlanRegistry` aus `side`, `priorityPolicy` und `modules`.
`currentRunnerPlanModules` und `currentCorpPlanModules` in der
[Live-Runtime](../../../packages/ai/src/runtime/plan-first-live-runtime.ts)
kombinieren Core-, Tactical- und Completion-Module.

Horizont und semantische Abdeckung stehen separat in
[RUNNER_TURN_PLANNING_MODULE_COVERAGE](../../../packages/ai/src/plans/runner-turn-planning-coverage.ts)
und [CORP_TURN_PLANNING_MODULE_COVERAGE](../../../packages/ai/src/plans/corp-turn-planning-coverage.ts).
Die jeweilige Registry-Assertion prüft die registrierten IDs gegen diesen
Vertrag. Ein allgemeines `PlanModuleManifest` mit sämtlichen früher
konzeptionell genannten Feldern existiert nicht und ist kein Pflichtumbau.

### 20.1 Keine automatische Seitenfreigabe

Ein gemeinsamer Capability-Resolver bedeutet nicht, dass ein Planmodul auf
beiden Seiten automatisch verwendet werden darf. Runner- und Corp-Economy
können gemeinsame technische Hilfen nutzen, bleiben aber fachlich getrennte
Module.

### 20.2 Modulaufnahme

Ein neues Planmodul wird nur aufgenommen, wenn:

- ein eigener längerfristiger Zweck, Lebenszyklus oder Fortschrittsbegriff
  besteht;
- der Zweck nicht nur eine einzelne Karte oder Action-ID beschreibt;
- vorhandene Module den Zweck nicht als Phase oder Step aufnehmen können;
- Discovery, Completion, Abandonment und Diagnostik definiert sind;
- mindestens ein Positiv- und ein Gegenfallszenario existiert.

Eine neue Karte allein rechtfertigt kein neues Planmodul.

## 21. Runner-Owner

Die fachlichen Aufgaben, Admission-Gates, Access-Fakten und Grenzen stehen
in den [Runner-Planverträgen](runner-plan-contracts.md). Die
[Ownerkarte](README.md#planowner-und-implementierungen) führt direkt zum Code.

## 22. Corp-Owner

Die fachlichen Aufgaben, Score-/Defense-Bindungen, Finanzierung und Grenzen
stehen in den [Corp-Planverträgen](corp-plan-contracts.md). Die
[Ownerkarte](README.md#planowner-und-implementierungen) führt direkt zum Code.

## 23. Gemeinsame Resolver und Services

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

## 24. Abdeckung der Aktionsfamilien

### 24.1 Runner

| Aktionsfamilie                           | Planherkunft                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Basic Credit                             | endliche Economy-Reserve, konkreter Parent-Fundingbedarf oder befristeter P6-Übergang |
| Draw                                     | Coverage-, Defense-, Handentwicklungs- oder konkreter Support-Step                    |
| Programm/Hardware/Ressource installieren | verlangte Fähigkeit des Rig-, Defense-, Economy- oder Strategieplans                  |
| Event spielen                            | Route des aktiven Plans mit vollständigem Follow-up-Vertrag                           |
| Run starten                              | Central-, Remote- oder gebundener Run-Plan                                            |
| Run-Ability/Run-Event                    | Route des auslösenden Runplans                                                        |
| Tag entfernen                            | Defense-and-Recovery                                                                  |
| Run fortsetzen/Jack-out/Pump/Break       | explizit positiv bewerteter Step des auslösenden Runplans                             |
| Access stehlen/trashen/ablehnen          | explizit positiv bewerteter Auflösungs-Step des auslösenden Runplans                  |
| Ability aktivieren                       | Step-Route eines Plans, nicht freie Kartennutzung                                     |
| Discard                                  | Cleanup-Resolution unter Plan- und Keep-Kontext                                       |
| EndTurn                                  | `runner.complete_turn`; bei regelbewiesenem Corp-Deckout `runner.secure_terminal_win` |

Alle in dieser Tabelle genannten Run-Starts – Basic Run, Kartenaktion,
Run-Event oder servergebundene Variante – müssen bereits bei ihrer
Engine-Erzeugung dieselbe aktuelle `evaluateRunStartEligibility` bestehen.
`applyAction` revalidiert weiterhin; die KI ergänzt keine zweite
Zulässigkeitsautorität und fängt keine widersprüchliche LegalAction ab.

### 24.2 Corp

| Aktionsfamilie             | Planherkunft                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Basic Credit               | endliche Economy-/Rezreserve, konkreter Parent-Fundingbedarf oder befristeter P6-Übergang |
| Draw                       | Hand-/Agenda-Management, Economy oder konkreter Supportbedarf                             |
| ICE installieren           | ausschließlich `corp.defend_servers`; andere Pläne veröffentlichen Schutzbedarfe          |
| Asset/Upgrade installieren | Economy-, Ambush-, Remote- oder Strategieplan                                             |
| Agenda installieren        | Scoreplan mit Exposure-/Commitment-Vertrag                                                |
| Advance/Score              | Scoreplan                                                                                 |
| Operation spielen          | Economy-, Score-, Punish-, Defense- oder Handplan                                         |
| ICE/Asset rezzen           | aktuelle Defense-/Economy-/Ambush-Response                                                |
| Trace-Bid/Choice           | auslösender Punish-/Defense-/Scoreplan                                                    |
| Ability aktivieren         | Step-Route eines Plans                                                                    |
| Discard                    | Hand-/Agenda-Management oder Cleanup-Resolution                                           |
| EndTurn                    | `corp.complete_turn`                                                                      |

Trace-Bids bleiben auch in den auswählbaren Blind-Profilen reine Resolution
des bereits ausgelösten Trace-Steps. Die side-sichere Bewertung darf Folge,
Link, sichtbare Budgets, Reserve, effektives Limit und Tie-Regel bewerten und
innerhalb rationaler legaler Kandidaten replaybar variieren. Sie ändert weder
`actionId` noch Executor, Root, Route oder Step und darf keinen alternativen
Punish-, Defense-, Run- oder Scoreplan wählen. Die Engine bindet und
revalidiert den aktuellen `resolve_choice`-Step vor jedem RNG-Draw.

Bei einer öffentlich enginebestätigten automatischen Trace-Wirkung mit
gebotsunabhängiger Menge bleibt ausschließlich das kleinste legale Gebot
rational. Die aktive `VisibleTraceState.bidEffect`-Tatsache wird nur für die
Choice derselben Trace-ID verwendet; auch Blind-Varianz darf keine wirkungslos
teureren Gebote ergänzen. Variable Trace-Mengen und unbekannte Wirkungen
erhalten diese Zertifizierung nicht. Plan-, Action- und Choice-Bindung bleiben
unverändert.

### 24.3 Coverage-Gate

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
Dasselbe gilt für unvollständige Kandidatendefinitionen: Ein Plan deckt eine
Action nur dann ab, wenn genau dieser Kandidat gegen den konkreten Step
bindbar ist. Das bloße Aufführen einer Action-ID oder Actionfamilie zählt
nicht als Coverage.

Choice-Optionen liegen hinter diesem Gate. Der Resolver erhält die bereits
gewählte Action und darf nur deren Payload vervollständigen. Ein Test muss
beweisen, dass seine Ausgabe weder `actionId` noch Planinstanz oder Step
verändern kann.

Der optionale Employee-Empowerment-Start-of-turn-Draw ist ein belegter
Referenzfall: Der Resolver bindet exakte Agendaquelle, StateVersion,
`resolve_choice`-Action und ausschließlich die Engine-Optionen `draw` und
`skip`. Bei mindestens zwei sichtbaren Karten in R&D wählt er `draw`, sonst
`skip`. Fehlende oder veraltete Bindung scheitert fail-closed und erzeugt
weder einen neuen Plan noch eine andere Action-ID.

## 25. Planinterne Weiterentwicklung

### 25.1 Zulässige Verfeinerung

Ein Planmodul darf später eigenständig ergänzen:

- neue Phasen;
- präzisere Fortschrittsmetriken;
- neue Karten- und Capability-Routen;
- bessere Risiko- oder Payoff-Projektion;
- neue deckstrategische Varianten desselben Zwecks;
- modulinterne Prioritäten zwischen Steps;
- modulbezogene Regressionstests und Diagnostik.

### 25.2 Nicht zulässige Verfeinerung

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

### 25.3 Modulversionierung

Jedes Modul besitzt eine interne Schema- oder Modulversion. Änderungen an
`moduleState` müssen:

- deterministisch sein;
- alte lokale Version-0-Daten nicht zwingend migrieren;
- Tests und Diagnostik gemeinsam aktualisieren;
- keine zweite parallele Runtime erzeugen.

## 26. Ausführungsfehler und deterministische Routenwahl

Der einzige Ablaufvertrag steht in Abschnitt 10. Für die abschließende
Routenbindung gelten zusätzlich:

### 26.1 Fail-closed statt Ersatz-Replanning

Ist ein als `executable_now` bewerteter Step nicht auf seine konkreten
LegalAction-Kandidaten abbildbar, ist dies ein Vertragsfehler. Die Runtime
darf nicht innerhalb derselben Entscheidung auf einen niedrigeren Plan,
eine freie Action oder einen generischen Fallback ausweichen. Sie schlägt
klassifiziert fail-closed fehl. Erst eine neue reguläre Entscheidung nach
einer echten StateVersion-Änderung darf das Portfolio erneut bewerten.

### 26.2 Stabile Tie-Breaks und kontrollierte Variation

Bei fachlich gleichwertigen Plänen oder Routen gilt eine stabile Reihenfolge,
beispielsweise:

1. laufendes Commitment;
2. bestehender Vordergrund;
3. höherer sichtbarer Fortschritt;
4. geringere Ressourcen- und Wechselkosten;
5. stabiler Modul-, Ziel- und Instanzschlüssel.

Randomisierte Play-Style-Variation darf nur an ausdrücklich freigegebenen,
nahezu gleichwertigen Stellen und über den deterministischen Match-RNG
erfolgen.

Für `corp.defend_servers` ist eine solche Stelle ausschließlich dann gegeben,
wenn mehrere konkrete `ICE × Server`-Routen:

1. zum selben Defense-Step und derselben Parentbindung gehören;
2. dieselbe validierte Prioritätsklasse und Viability besitzen;
3. nach exakter Schutzprojektion und vollständigen Engine-Quotes in demselben
   fachlichen Nahgleichstandsband liegen;
4. durch kein Commitment, Matchpoint-, Agenda-, Multiaccess-, Kartenverlust-
   oder serverspezifisches Sondereffekt-Fact lexikografisch getrennt werden;
5. als aktuelle LegalActions vollständig revalidierbar sind.

Die AI gibt nur die kanonisch sortierte Kandidatenmenge und den festen
Randomisierungszweck aus. Die Engine zieht und wendet atomar genau eine
Variante an. Ein FNV-, Hash-, Zeit-, Prozess- oder unaufgezeichneter
Pseudozufalls-Tiebreak ist unzulässig. Gleicher Seed, gleicher
`RandomCounter`, gleiche side-sichere Eingabe und gleiche Kandidatenmenge
führen zu demselben Draw und Replay; unterschiedliche zulässige Seeds dürfen
die nahgleichen Alternativen variieren.

Transport- und Auditidentitäten dürfen diese Gleichheit nicht unbemerkt
aufbrechen. Insbesondere `matchId`, `StateHash` und daraus abgeleitete
StateHash-Felder gehören weder in einen fachlichen Randomisierungszweck noch
in den side-sicheren Planungsfingerprint oder einen stabilen Tie-Break. Sie
bleiben weiterhin verbindlicher Bestandteil von Quote-Zuordnung,
State-Version-Validierung, Receipts und Replay-Prüfung. Zwei Spiele mit
gleichem Seed, gleichen Decks und gleicher fachlicher Zustandsfolge müssen
daher dieselbe Aktions- und Planfolge wählen, auch wenn ihre Match-IDs und
folglich ihre StateHashes verschieden sind.

## 27. Akzeptanzszenario A – Highlighter-R&D

Die folgenden Szenarien sind fachliche Vertragsbeispiele. Ihre Match-IDs
bezeichnen den Ausgangsfall, keinen aktuellen Testlauf oder eine Zusage,
dass der historische Matchzustand lokal vorliegt. Ausführbare Nachweise
werden nach Abschnitt 31 am betroffenen Pfad gewählt.

Quelle: gespeichertes Spiel `match_85f8dc10007f057d`.

### 27.1 Erwartete Planinstanzen am ersten Runnerzug

| Plan                              | Zustand               | Rolle       |
| --------------------------------- | --------------------- | ----------- |
| `runner.pressure_central:rd`      | ready                 | Vordergrund |
| `runner.economy:fund_parent_need` | bei Bedarf erzeugbar  | Support     |
| `runner.rig_and_coverage`         | dormant               | resident    |
| `runner.develop_board_and_hand`   | ready, aber niedriger | Challenger  |
| `runner.pressure_central:hq`      | ready, aber niedriger | Challenger  |

R&D ist durch Deckstrategie, Highlighter auf der Hand, offenen Pfad und
ausreichende Anfangsressourcen die führende Kampagne.

### 27.2 Erwartete Stepfolge im ersten Zug

```text
runner.pressure_central:rd
phase prepare_engine

Step fund_engine
→ Livewire’s Contacts
→ Credits 5 → 8

Step install_engine
→ Highlighter installieren
→ Credits 8 → 5

Step seed_engine
→ R&D-Run
→ Highlighter-Fortschritt

Step seed_engine
→ zweiter R&D-Run
→ Highlighter auf zwei Zähler

EndTurn erst bei null Klicks
```

Livewire ist kein konkurrierender eigenständiger Geldplan. Die Karte ist die
beste Funding-Route des R&D-Plans.

### 27.3 Erwartete Stepfolge im zweiten Zug

| Klick | Zugriffstiefe | Planfortschritt                      |
| ----- | ------------- | ------------------------------------ |
| 1     | 2 Karten      | neue Information, Highlighter wächst |
| 2     | 3 Karten      | Corporate War gestohlen, 3 AP        |
| 3     | 4 Karten      | weitere Information und Corp-Trash   |
| 4     | 5 Karten      | Corporate Downsizing gestohlen, 5 AP |

Die vier R&D-Runs dürfen keine pauschale Same-Server-Strafe erhalten, weil:

- Zugriffstiefe wächst;
- neue Karten erreicht werden;
- Agenda-Punkte gewonnen werden;
- die Siegdistanz sinkt.

### 27.4 Closeout

Im dritten Runnerzug:

```text
phase closeout
→ erster R&D-Run mit sechs Zugriffen
→ Revalidierung
→ zweiter R&D-Run mit sieben Zugriffen
→ Agenda für 7 AP
→ terminaler Sieg
```

### 27.5 Abnahmebedingungen

- dieselbe R&D-Planinstanz bleibt über Zuggrenzen erhalten;
- Highlighter-Zähler und Zugriffstiefe liegen im Modulzustand;
- Economy ist als Supportbeitrag diagnostiziert;
- Wiederholungslogik erkennt wachsenden Grenznutzen;
- kein EndTurn bei verbleibenden Klicks;
- alternative Deckstrategie kann im gleichen Boardzustand eine andere
  Kampagne priorisieren;
- `corp.respond_to_virus_pressure` prüft nach jedem relevanten Fortschritt
  Purge-Machbarkeit und Opportunity Cost;
- nach Purge, Entfernung von Highlighter, unpassierbarem R&D oder sinkendem
  Grenznutzen wird die Runner-Kampagne korrekt reconciliiert;
- unterschiedliche verdeckte R&D-Reihenfolgen bei gleicher Runner-PlayerView
  erzeugen vor dem Access dieselbe Entscheidung.

## 28. Akzeptanzszenario B – Manhunt-Flatline

Quelle: gespeichertes Spiel `match_639d02fcac91f90f`.

### 28.1 Anfangsportfolio der Corp

| Plan                                | Zustand                            | Rolle              |
| ----------------------------------- | ---------------------------------- | ------------------ |
| `corp.opening_and_board_foundation` | ready                              | Vordergrund        |
| `corp.punish_campaign:tag_and_bag`  | dormant                            | resident           |
| `corp.score_agenda`                 | dormant, noch keine Agenda gewählt | resident           |
| `corp.economy`                      | ready, aber niedriger              | Support/Challenger |

Die Eröffnung:

```text
Credit beschaffen
→ Keeper vor R&D installieren
→ Quandary vor neues Remote installieren
```

ist eine zusammenhängende Board-Foundation, nicht drei unverbundene
Einzelaktionen.

### 28.2 Scoring-Übergabe

Nach Draw von Corporate War:

```text
corp.score_agenda wird ready
→ Corporate War in Remote installieren
→ zwei Credits als Funding-Step
→ Zugende

nächster Corpzug
→ dreimal advancen
→ Corporate War scoren
→ Plan completed
```

Der Punish-Plan bleibt dormant und verliert seine Kartenkomponenten nicht.

### 28.3 Economy als zeitweiliger Vordergrund

Nach dem Scoring benötigt die Punish-Kampagne 11 Credits für ihre spätere
Killroute.

```text
BBS installieren
→ verbleibende Nutzungen und Zielreserve verfolgen
→ BBS über mehrere Züge leeren
→ zweite BBS beginnen
→ Credits 20
```

Der Economy-Plan ist:

- Support für die Punish-Kampagne;
- über mehrere Züge selbst Executor;
- abgeschlossen oder zurückgestuft, sobald die Killroute bereit ist.

### 28.4 Wartender Killplan

Vor dem letzten Corpzug:

```text
Chance Observation vorhanden
Urban Renewal vorhanden
Scorched Earth vorhanden
Credits ausreichend
Runner-Hand 5
aber: Runner hat im vorherigen Zug noch nicht gerunnt
```

Der Plan bleibt `dormant` oder `blocked`, ohne seine Komponenten zu verlieren.

Nachdem der Runner einen Run unternommen hat:

```text
tag trigger true
trace base 5
runner max strength 4
damage 5 + 4
cost 2 + 6 + 3
clicks 3
```

Die Kampagne erzeugt den Kindplan
`corp.execute_punish_sequence`.

### 28.5 Geschützte, verzweigte Killfortsetzung

```text
Step apply_tag
→ Chance Observation
├─ Tag erfolgreich
│  → Damagepfad neu materialisieren
└─ Tag verhindert oder Trace verändert
   → Commitment invalidieren oder Alternativpfad bewerten

Step apply_damage
→ Urban Renewal
├─ erwartete Damagekonversion
└─ Prävention/abweichende Handlage
   → Lethalität neu bewerten

Step apply_lethal_damage
→ Scorched Earth
→ Flatline
```

Closed Accounts darf nicht zwischen diese Steps treten, obwohl es legal und
tagbezogen ist. Es würde den dritten notwendigen Klick verbrauchen.

Die historische sichtbare Lage kann den Versuch stark stützen. Sie wird
jedoch nicht pauschal als `rules_proven` bezeichnet, solange eine für die Corp
unbekannte Gegenoption Tag, Trace oder Damage beeinflussen kann. Das
Assessment trägt den tatsächlichen Garantiegrad und die gegnerische
Eingriffsmöglichkeit.

Die Engine-Quote für Trace-/Tag-Folgen verwendet dieselbe öffentliche
Semantik für automatischen Trace-Erfolg und zusätzliche Tags wie die
Trace-Ausführung. Bei einem solchen sichtbaren Effekt wird ein Corp-Gebot
von null gegen die legalen Runner-Antworten ausgeführt und zertifiziert;
Tagvermeidung und verdeckte Reaktionsmöglichkeiten bleiben Bestandteil der
Ergebnisgrenzen. Gedrucktes Trace-Limit und gedruckte Tagmenge dürfen diese
vollständige Regelwirkung nicht ersetzen. Die Auswahl der Folge bleibt bei
`corp.execute_punish_sequence` unter der Punish-Kampagne.

### 28.6 Abnahmebedingungen

- Punish-Kampagne bleibt über Scoring- und Economy-Züge resident;
- Scoring-, Economy- und Killplan wechseln explizit den Vordergrund;
- Runner-Run-Trigger reaktiviert den Killplan;
- semantischer Drei-Aktionen-Graph wird vor Chance Observation geprüft;
- Credits, Klicks und Kartenquellen werden reserviert;
- der Plan revalidiert Tag und Runner-Hand nach jedem Step;
- kein planfremder Punish-Effekt unterbricht einen weiterhin lethal
  bewerteten Pfad;
- Tag-/Damage-Vermeidung oder verlorene Lethalität verzweigt oder beendet die
  Fortsetzung regelkonform;
- gleiche Corp-PlayerView mit unterschiedlichen verdeckten Runner-Ressourcen
  erzeugt vor Enthüllung dieselbe Entscheidung.

## 29. Regressionsszenarien aus der aktuellen Action-Arbitration

### 29.1 Turn-limitierte Vorbereitung

**Prearranged Drop**

Erwartung:

- nur spielbar, wenn ein Agenda-Zugriff im selben Zug als vollständige Route
  vorhanden ist;
- nach dem Ausspielen wird der Zugriff durch Commitment reserviert;
- ein späterer Draw- oder Credit-Rohscore darf die Route nicht ersetzen.

**Promises, Promises**

Erwartung:

- gleiche Commitment-Regel;
- vorbereiteter HQ-/R&D-/Remote-Zugriff besitzt festes Ziel;
- kein `mapped_nonpositive_against_positive`-Override.

Ein reiner Test „nach der Vorbereitung bleibt ein Klick übrig“ ist nicht
ausreichend. Der Test muss die tatsächliche Folgeaktion und Konversion prüfen.

### 29.2 Alles negativ

Historischer Zustand:

- Archives-Run `−241`;
- Draw bei voller Hand `−972`;
- Basic Credit `−1021`;
- HQ-Run `−1302`;
- EndTurn `−1465`.

Zielverhalten:

1. keine globale Auswahl des kleinsten negativen Werts;
2. gesättigte und blockierte Pläne ausscheiden;
3. Draw-Plan wegen Überlauf blockieren;
4. prüfen, ob ein endlicher Reserve- oder Parent-Fundingplan einen
   Basic-Credit-Step besitzt;
5. Basic Credit nur bei positiver Zielannäherung dieses Plans wählen;
6. fehlt ein ausführbarer produktiver Plan, die Abdeckungslücke sichtbar
   fail-closed melden;
7. EndTurn nur über den expliziten Completion-Plan und dessen strukturelle
   Restkapazitätsbelege zulassen.

Der Credit braucht dafür keinen künstlichen globalen Bonus und besitzt
außerhalb eines endlichen Funding- oder Reserveziels keinen Eigenwert.

### 29.3 Falsche Capability-Erfüllung

Eine Karte darf einen Step nur erfüllen, wenn ihre Semantik die benötigte
Fähigkeit tatsächlich trägt.

Verbindlicher Gegenfall:

- Psychic Friends oder eine andere Nicht-Breaker-Karte darf nicht als
  Icebreaker-Coverage installiert oder gezählt werden;
- Kartentyp, Subtyp, Taktiksignale und konkrete LegalAction-Ziele müssen den
  Capability-Vertrag gemeinsam erfüllen;
- mehrere unpassende Installationen dürfen keinen scheinbaren
  Rig-Fortschritt erzeugen.

### 29.4 Background-Pingpong

- Bankplan lädt höchstens gemäß seiner Cadence;
- Cashout nur bei konkretem Bedarf oder Zielschwelle;
- kein Load/Cashout-Wechsel ohne neue Zustandsgrundlage;
- Vordergrundplan kehrt nach der Background-Aktion zurück.

### 29.5 Planwechsel ohne Grund

Bei unverändertem Zustand und unveränderten Kandidaten muss die nächste
Entscheidung denselben Vordergrund behalten. Ein anderer stabiler Tie-Break
oder eine kleine Scoreverschiebung darf kein Churn erzeugen.

## 30. Diagnostik

Maßgeblich sind der [Trace-Vertrag](decision-trace-contract.md) für
Datenklassen und Persistenz sowie die
[Zugplan-Diagnostik](turn-campaign-planner.md) für Plannerinhalte.
Diagnoseausgaben erklären Portfolio, Assessment, Step, Route, Claims und
Ablehnungsgründe. Sie wählen keine Action und ersetzen keine typisierten
Fakten. Die private Betreiberanzeige darf die vollständige Hand der aktiven
KI zeigen, niemals die Menschenhand; normale Spielerkanäle bleiben side-sicher.

## 31. Verifikation der Verträge

Die Prüftiefe folgt [packages/ai/AGENTS.md](../../../packages/ai/AGENTS.md)
und dem [Testtier-Vertrag](../test-tiers-and-package-boundaries-2026-07-10.md).
Ein Dokumentationspatch erfordert Link-, Symbol- und Konsistenzprüfung;
unverändertes Verhalten verlangt keinen vollständigen AI-Testlauf.

| Geänderte Grenze                        | Passende ausführbare Evidence                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemeinsames Modul / Scheduler           | [plan-scheduler.test.ts](../../../packages/ai/src/plans/plan-scheduler.test.ts), [resident-plan-portfolio.test.ts](../../../packages/ai/src/plans/resident-plan-portfolio.test.ts) |
| Typisierte entscheidungswirksame Fakten | [typed-decision-facts.test.ts](../../../packages/ai/src/runtime/typed-decision-facts.test.ts)                                                                                      |
| Suche und Projektion                    | [turn-remainder-search.test.ts](../../../packages/ai/src/plans/turn-remainder-search.test.ts), [turn-projection.test.ts](../../../packages/ai/src/plans/turn-projection.test.ts)   |
| Commitment / Revalidierung              | [turn-plan-commitment.test.ts](../../../packages/ai/src/plans/turn-plan-commitment.test.ts)                                                                                        |
| Owner und Choice-Origin                 | [plan-first-live-runtime.test.ts](../../../packages/ai/src/runtime/plan-first-live-runtime.test.ts) und betroffene Owner-/Continuation-Tests                                       |

Ein Verhaltenstest weist Action **und** Owner, Step, Route, aktuellen
StateVersion-/Optionsbezug sowie den passenden Gegenfall nach. Breite
Integrationsgates ergänzen Replay-, Hidden-Info-, Authority- und
Abdeckungsnachweise. Erfolgreiche alte Läufe sind kein Beweis für einen
ungeprüften neuen Stand; technische Gates ersetzen keine Spielstärke-Evidence.
