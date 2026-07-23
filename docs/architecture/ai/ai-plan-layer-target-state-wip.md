# KI-Planebene – modulares Zielkonzept

Status: **Work in Progress**
Dokumentversion: `0.3`
Stand: 2026-07-23
Verantwortlicher Architekturprozess:
`ai-plan-layer-target-concept-process-2026-07-23.md`

## 1. Zweck und Führungsanspruch

Dieses Dokument beschreibt den angestrebten Zielzustand der produktiven
NETGRID-KI-Planebene. Es führt die bislang verteilten Verträge für
Deckstrategie, Strategic Intent, kurzlebige Goal-/Threat-Signale, Tactical
Plans, PlanPortfolio, Ressourcenrouten, Follow-up-Budgets und
LegalAction-Auswahl zu einem gemeinsamen Modell zusammen.

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

### 2.1 Disposition des Architekturreviews zu Version 0.3

Das Review wird nicht pauschal übernommen:

**Übernommen, weil der Vertrag sonst widersprüchlich oder technisch nicht
erfüllbar wäre:**

- Tactical Goals als kurzlebige Signale statt zweite Autorität;
- PlanAssessment vor Executorwahl;
- genau ein aktueller Route Head, keine zukünftigen Action-IDs;
- getrennte Achsen für Viability, Portfolio-Rolle und Execution State;
- validierte Priority Claims;
- First-class `PlanNeed`, typisierte Ressourcen und Garantiegrade;
- differenzierte Entscheidungsfenster und `PlanExecutionOrigin`;
- Hidden-Info-Äquivalenz-, Capability-/Target- und Fallback-Audit-Tests.

**Präzisiert statt unverändert übernommen:**

- `PlanAssessment` darf Machbarkeit und nächsten semantischen Step
  vorbewerten, aber keinen verdeckten globalen Action-Wettbewerb vorziehen.
- Kartenbezogene Planinstanzen bleiben möglich, benötigen aber ein
  Admission-Gate. Das Reviewrisiko ist real; ein vollständiges Verbot würde
  eigenständige mehrstufige Kartenentwicklungen wieder unsichtbar machen.
- Ein allgemeiner Corp-Midgame-Plan wird nicht vorsorglich als breites Modul
  eingeführt. Erst konkrete wiederkehrende Evidence rechtfertigt einen engen
  Domainzuschnitt.
- P1 verlangt nicht in jedem Fall mathematische Gewissheit. Ein starker
  Lethalversuch darf P1 sein, muss aber Garantiegrad und gegnerische
  Eingriffsmöglichkeit ausweisen.

**Nicht als Architekturentscheidung übernommen:**

- Das Comprehensive Rules PDF macht `end_turn` nicht automatisch illegal,
  solange die primäre NETGRID-Konzeption und die Engine das Gegenteil
  ausdrücken. Festgestellt ist ein blockierender Quellenkonflikt.
- Terminalprojektion erhält keinen Zugriff auf vollständige gegnerische
  Hidden-Zonen. Sie bleibt engine-semantisch, aber strikt side-safe.

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
- geschützte, StateVersion-weise neu materialisierte Fortsetzungen;
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

### Goal-/Threat-Signal

Kurzlebige, StateVersion-gebundene Beschreibung eines aktuellen Bedarfs,
einer Opportunity oder einer Bedrohung. Diese Signale:

- beeinflussen Planerkennung und Planbewertung;
- können einen Intent-Wechsel anregen;
- besitzen weder Plan-Memory noch Ausführungsautorität;
- referenzieren keine zukünftigen Action-IDs;
- verfallen oder werden bei jeder neuen StateVersion neu erzeugt.

Damit bleiben Tactical Goals als semantische Brücke erhalten, ohne neben dem
PlanPortfolio eine zweite Handlungsautorität zu bilden.

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

## 7. Gesamtarchitektur

```text
eigene Kartensemantik und Deckfähigkeiten
                    |
            Deckstrategieprofil
                    |
              Strategic Intent
                    |
       kurzlebige Goal-/Threat-Signale
                    |
        side-spezifische Planerkennung
                    |
      persistentes Runner-/Corp-Portfolio
                    |
      leichtgewichtige PlanAssessments
                    |
       side-spezifischer PlanScheduler
          /          |           \
 Responses      Vordergrund    Backgrounds
          \          |           /
    Root-Foreground und Leaf-Executor
                    |
 ActionSemanticCandidates der LegalActions
                    |
 aktueller Route Head + semantische Fortsetzung
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
- Validierung von Prioritätsansprüchen und Hysterese;
- typisierte, zyklenfreie Parent-/Need-/Support-Beziehungen;
- typisierte Ressourcenclaims und Reservierungen;
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

### 8.3 Ausführungsursprung und Receipt

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
  expectedOutcome: OutcomeEnvelope;
  observedEvents: SideSafeEvent[];
};
```

Der Ursprung verändert weder Engine-Regeln noch LegalActions. Er bindet
optionale Ability-, Run-, Access- und Trace-Entscheidungen an das auslösende
Vorhaben und ermöglicht Outcome-basierte Fortschrittsprüfung.

## 9. Gemeinsamer Planmodul-Vertrag

Der folgende Typ ist konzeptionell. Die endgültigen TypeScript-Namen werden im
Implementierungsplan festgelegt.

```ts
type PlanModule = {
  moduleId: string;
  moduleVersion: string;
  side: "runner" | "corp";
  executionClass:
    | "urgent_response"
    | "bounded_sequence"
    | "recurring_cycle"
    | "development_project"
    | "strategic_campaign";

  discover(context): PlanProposal[];
  instantiate(proposal, context): PlanInstance;
  reconcile(instance, context): PlanReconciliation;
  assessPlan(instance, context): PlanAssessment;
  proposeStep(instance, context): PlanStepProposal;
  materializeRoutes(
    instance,
    step,
    semanticActions,
    context,
  ): PlanRoute[];
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
erzeugen. Jedes Proposal liefert einen modulstabilen `dedupeKey`; der Kernel
entscheidet über Aufnahme, Reaktivierung oder Zusammenführung.

### 9.2 `reconcile`

Prüft eine bestehende Instanz gegen den aktuellen Zustand:

- ist das Ziel noch vorhanden?
- wurde ein Blocker entfernt?
- ist die Strategie noch gestützt?
- wurde ein Meilenstein erreicht?
- ist der Plan abgeschlossen, präemptiert oder aufzugeben?
- haben fremde Aktionen oder neue Informationen seine Phase verändert?

### 9.3 `assessPlan`

Erzeugt für jede relevante Instanz vor der Executorwahl ein
leichtgewichtiges `PlanAssessment`:

```ts
type PlanAssessment = {
  instanceId: string;
  priorityClaim: PriorityClaim;
  readiness: PlanReadiness;
  nextStepPreview?: PlanStepSpec;
  feasibility: FeasibilityEnvelope;
  resourceGaps: ResourceGap[];
  expectedOutcome: OutcomeEnvelope;
  continuity: ContinuityAssessment;
  blockers: PlanBlocker[];
};
```

Die Vorschau darf nur planlokal prüfen, ob eine aktuelle oder absehbar
herstellbare Route existiert. Sie führt keinen globalen LegalAction-Wettbewerb
durch. So kennt die Planwahl Readiness und Ressourcenlücke, ohne nach der Wahl
erst blind in einen nicht ausführbaren Step zu laufen.

Das Modul liefert nur einen `PriorityClaim`. Die side-spezifische
Scheduler-Policy validiert Klasse, Reason Code, Horizon, Witness und
Garantiegrad. Ein Modul darf sich nicht selbst unbelegt zu P1 oder P2 erklären.

### 9.4 `proposeStep`

Bestimmt den fachlich nächsten Step. Ein Step kann beispielsweise verlangen:

- Liquidität aufbauen;
- eine bestimmte Coverage beschaffen;
- eine Engine installieren;
- einen Server angreifen;
- eine Agenda advancen;
- ein Tag erzeugen;
- Handpuffer herstellen.

### 9.5 `materializeRoutes`

Übersetzt den Step nach der Executorwahl aus verbindlichen
`ActionSemanticCandidates` in aktuell mögliche Route Heads. Diese Funktion
verwendet Action-Semantik, Kartenfähigkeiten, Kosten, Ziele und aktuelle
LegalActions.

```ts
type PlanRoute = {
  routeId: string;
  head: LegalActionInvocation;
  continuation: SemanticStepSpec[];
  assumptions: RouteAssumption[];
  expectedOutcome: OutcomeEnvelope;
};
```

Nur `head` verweist auf eine LegalAction der aktuellen StateVersion. Nach
deren Anwendung wird die Fortsetzung gegen die neue LegalAction-Menge erneut
materialisiert.

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
  dedupeKey: string;
  moduleId: string;
  moduleVersion: string;
  side: "runner" | "corp";
  strategyLineIds: string[];

  executionClass: PlanExecutionClass;
  viability: PlanViability;
  portfolioRole: PlanPortfolioRole;
  executionState: PlanExecutionState;
  persistencePolicy: PlanPersistencePolicy;

  target?: PlanTarget;
  parentInstanceId?: string;
  openNeedIds: string[];

  phase: string;
  milestone: string;
  moduleState: unknown;

  blockers: PlanBlocker[];
  resumeConditions: PlanCondition[];
  completionConditions: PlanCondition[];
  abandonmentConditions: PlanCondition[];

  resourceClaims: PlanResourceClaim[];
  acceptedReservations: PlanReservation[];
  commitment?: PlanCommitment;
  cadence?: PlanCadence;

  progress: PlanProgress;

  createdAtStateVersion: number;
  updatedAtStateVersion: number;
  lastProductiveAtStateVersion?: number;
  evidenceRefs: PlanEvidenceRef[];
};
```

Priorität wird absichtlich nicht als autoritativer Instanzzustand gespeichert.
Sie gehört zum Assessment der aktuellen StateVersion.

### 10.1 Modulzustand

`moduleState` ist planintern versioniert. Nur das Modul interpretiert ihn.

Beispiele:

- R&D-Plan: Highlighter-Zähler, bekannte Zugriffstiefe, Topkartenfrische;
- Economy-Plan: Zielreserve, verfügbare Quellen, Auszahlungsfenster;
- Corp-Killplan: verfügbare Tagquelle, Damage-Summe, sichtbare
  Trace-Projektion und Garantiegrad;
- Remote-Projekt: Zielserver, Schutzband, Rez-Reserve, nächste Härtungsstufe.

Der Scheduler darf daraus keine kartenspezifischen Sonderregeln ableiten.

## 11. Orthogonale Plan-Zustandsachsen

Lebensfähigkeit, Portfoliorolle und Ausführung werden nicht in einem
mehrdeutigen `active`-/`suspended`-Zustand vermischt:

```ts
type PlanViability =
  | "dormant"
  | "ready"
  | "blocked"
  | "completed"
  | "abandoned";

type PlanPortfolioRole =
  | "foreground"
  | "background"
  | "unassigned";

type PlanExecutionState =
  | "idle"
  | "executor"
  | "preempted";
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

### 11.1 Identität und Retention

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

## 12. Portfolio und Ausführungsrollen

### 12.1 Rollen

Das Portfolio unterscheidet:

- mehrere mögliche `urgent_response`-Kandidaten;
- höchstens einen ausführenden `foreground`;
- mehrere persistente `background`-Projekte;
- beliebig viele fachlich relevante `dormant`, `blocked` oder `preempted`
  Instanzen innerhalb eines technisch begrenzten Speichers.

Die heutige Grenze von höchstens zwei Background-Projekten entfällt im
Zielzustand als fachliche Invariante. Alle weiterhin relevanten
Planinstanzen bleiben resident, damit Fortschritt, Blocker und
Wiederaufnahmebedingungen nicht bei jeder Entscheidung neu aufgebaut werden
müssen.

Eine spätere rein technische Speicherbegrenzung muss:

- ausreichend hoch sein;
- deterministisch sein;
- Verdrängung sichtbar diagnostizieren;
- strategisch gebundene oder fortgeschrittene Projekte schützen.

### 12.2 Genau ein Executor

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

### 12.3 Wechselnde aktive Pläne

Mehrere Pläne dürfen über einen Zug oder mehrere Züge hinweg abwechselnd
handeln. Beispiel:

- eine R&D-Kampagne ist Vordergrund;
- die R&D-Kampagne erlaubt einen günstigen Portfolio-Slice für Broker oder
  delegiert einen Fundingbedarf;
- der Broker-Bankplan darf gemäß Cadence einmal laden;
- danach kehrt die R&D-Kampagne zurück.

Dieser Wechsel ist eine explizite Schedulerentscheidung. Die R&D-Kampagne
bleibt gespeichert und wird nicht neu entdeckt.

## 13. Scheduler-Zyklus

Der Scheduler läuft bei jeder neuen Entscheidung vollständig, aber nicht
gedächtnislos.

### Phase 0 – Engine-Fenster klassifizieren

- automatische Pflichtauflösung;
- Pflichtauswahl;
- optionale Trigger-/Paid-Ability-Entscheidung;
- freiwilliges Hauptaktionsfenster;
- Run-/Access-/Trace-Fortsetzung;
- legitimes Pass/Decline in einem passenden Fenster;
- aktuelle StateVersion und Seite prüfen;
- LegalActions übernehmen;
- veraltete geschützte Fortsetzungen invalidieren.

Nicht jedes Fenster startet den vollen Scheduler. Pflichtauswahlen und
Fortsetzungsfenster behalten den `PlanExecutionOrigin` des auslösenden Plans.

### Phase 1 – Side-sicheres Weltmodell aktualisieren

- sichtbare Boardänderungen;
- Credits, Klicks, Karten und Agenda-Punkte;
- neue Runs, Zugriffe, Tags, Damage und Rez-Ereignisse;
- bekannte Serverpfade;
- eigene neue Karten und Fähigkeiten;
- Plan-Memory und Fortschritt.

### Phase 2 – Goal-/Threat-Signale und Strategic Intent revalidieren

- trägt die Deckstrategie die aktuelle Linie weiterhin?
- hat sich die Spielphase verändert?
- existiert ein Matchpoint- oder Survival-Kontext?
- ist eine Nebenlinie vorübergehend sinnvoller?

Deckstrategie bleibt Prior, aber kein Autopilot. P1–P3-Pläne dürfen einen
bestehenden Intent mit belegter akuter Evidence übergehen. P4-/P5-Pläne
benötigen Intent-Fit oder eine explizite taktische Evidence. Intent-Wechsel
entstehen nur aus Phasenwechsel, belastbarer neuer Information,
Planabschluss/-invalidierung oder einem validierten hochklassigen Claim, nie
aus normalen Action-Score-Schwankungen.

### Phase 3 – Planinstanzen reconciliieren

Für jede bestehende Instanz:

- Fortschritt prüfen;
- Phase aktualisieren;
- Blocker und Resume Conditions prüfen;
- Abschluss oder Aufgabe feststellen;
- Ressourcen und Cadence aktualisieren.

### Phase 4 – Neue Kandidaten entdecken

Runner- oder Corp-Registry fragt ihre Module nach neuen Planvorschlägen.
Duplikate mit gleichem `dedupeKey` werden zusammengeführt oder abgelehnt.

### Phase 5 – Alle relevanten Pläne assessen

Für jede relevante Instanz erzeugt das Modul eine leichte Step- und
Machbarkeitsvorschau. Dabei werden noch keine vollständigen Routen gebaut und
keine zukünftigen LegalActions angenommen.

### Phase 6 – Priority Claims validieren und Ressourcen arbitrieren

Die side-spezifische Policy validiert für jede Instanz:

- angeforderte Prioritätsklasse und Reason Code;
- Terminal-/Threat-Witness und Garantiegrad;
- Intent-Fit oder taktische Evidence;
- Readiness, Ressourcenlücke und erwartete Konversion;
- Hard-/Soft-/Forecast-Claims;
- Risiken, Opportunity Cost und Kontinuitätskosten.

### Phase 7 – Root-Foreground und Leaf-Executor wählen oder fortsetzen

Der bisherige Vordergrund bleibt bevorzugt, solange:

- sein nächster Step fachlich gültig ist;
- kein höherer Prioritätsrang eingreift;
- kein ausreichend starker Challenger den Wechsel rechtfertigt;
- kein Commitment einen Wechsel verbietet.

### Phase 8 – Step bestimmen

Das gewählte Planmodul liefert genau einen aktuellen Step sowie erlaubte
Alternativ-Steps.

### Phase 9 – aktuelle Route Heads materialisieren

Nur `ActionSemanticCandidates` vorhandener LegalActions werden verwendet.
Nicht abbildbare Steps werden als Blocker oder `PlanNeed` zurückgegeben.
Semantische Fortsetzungen enthalten keine zukünftigen Action-IDs.

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
- geschützte Fortsetzung;
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

Terminalität wird über eine engine-nahe, side-sichere
`evaluateTerminalConditions`-Projektion bestimmt. Sie umfasst neben Agenda
und Flatline auch Deckout, Bad-Publicity- oder andere im normativen
NETGRID-Regelvertrag tatsächlich freigeschaltete Niederlagen- und
Siegbedingungen.

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

Die Prioritätsklassen sind hart lexikografisch. Kein Zahlenwert eines
niedrigeren Rangs kann einen ausführbaren Plan einer höheren Klasse
überstimmen. Zahlenwerte und normalisierte Merkmale entscheiden nur zwischen
Plänen derselben Klasse.

Cadence ist ausschließlich eine Nutzungsschranke. Ein niedriger klassifizierter
Background erhält dadurch kein Recht, einen höheren Vordergrund zu verdrängen.
Er handelt nur in einem freigegebenen Portfolio-Slice, als planverträgliche
Route oder mit delegierter Priorität eines offenen Parentbedarfs.

### 14.5 Entstehung strategischer und taktischer Pläne

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

Ein neutraler Fallback benötigt weder einen Strategieanker noch eine
Spezialkarte, aber einen sicheren kurzfristigen Zweck.

Planmodule erhalten die side-sichere eigene Deckstrategie, DeckCapabilities
und bekannte Rollen ihres Decks. Eine R&D-Kampagne darf deshalb wissen, dass
noch eigene Multiaccess-, Search- oder Druckwerkzeuge im Deck vorhanden sind,
und Draw oder Search als planinterne Steps erwägen. Sie kennt dadurch weder
die verdeckte Kartenreihenfolge noch gegnerische Hidden-Zonen.

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

### 16.2 Kindpläne

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

### 16.3 Mehrplannutzen

Eine Aktion darf mehreren Plänen helfen. Beispiel: Eine Economy-Karte
finanziert den Vordergrund und lädt zugleich eine Strategie-Engine.

Mehrplannutzen:

- ist ein begrenzter Tiebreaker zwischen bereits planverträglichen Routen;
- darf keine Urgent Response, keinen Closeout oder notwendigen Vordergrund-Step
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

```text
hard      – nur für Leaf-Executor oder laufende geschützte Fortsetzung
soft      – gewünschte Reserve eines residenten Plans
forecast  – erwartete zukünftige Ressource, nicht garantiert
```

Höherklassige Pläne dürfen Soft Claims präemptieren; jede Präemption wird
diagnostiziert. Background-Pläne dürfen keine dauerhaften Hard Reservations
halten.

### 17.3 Freie Ressourcen

Ressourcen oberhalb akzeptierter Reservierungen dürfen andere Pläne nutzen.
Der Scheduler muss sichtbar diagnostizieren, welche Reserve einen ansonsten
legalen Step blockiert.

## 18. Geschützte Fortsetzungen

Zeitlich oder sequenziell gebundene Effekte benötigen vor der ersten Aktion
eine belastbare Machbarkeitsprüfung. Die Engine führt trotzdem jede Aktion und
jede Zwischenentscheidung einzeln aus; der Vertrag ist keine Transaktion.

### 18.1 Commitment-Vertrag

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

### 18.2 Startbedingung

Eine Vorbereitung darf nur begonnen werden, wenn:

- alle zwingenden Folge-Steps und relevanten Verzweigungen semantisch bekannt
  sind;
- genügend Action Capacity vorhanden oder sicher erzeugbar ist;
- Ressourcen und Ziel erreichbar sind;
- kein bekannter harter Blocker die Konversion verhindert.

### 18.3 Bindung

Nach Beginn bleibt die geschützte Fortsetzung führend. Ein Wechsel ist nur
erlaubt bei:

- neuer validierter höherpriorisierter Response;
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

Ein Verzweigungsergebnis materialisiert den nächsten Step neu. Tag scheitert,
Prävention verändert Lethalität oder ein Runpfad wird unpassierbar: Dann wird
der passende Graphzweig gewählt oder die Fortsetzung mit Grund invalidiert.

Nur `rules_proven`, `visible_state_forced` und ausdrücklich definierte robuste
Sequenzen dürfen vollständig sperren. Belief-gestützte oder spekulative Pfade
dürfen Ressourcen vorplanen, aber keine konkurrierende terminale Response
blockieren.

### 18.5 Bindungsstärken außerhalb geschützter Fortsetzungen

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

### 20.1 Noch ungelöster normativer Quellenkonflikt

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

Vor Kernel-Freigabe muss ein ausdrücklich normativer NETGRID-Regelvertrag
festlegen:

- ob freiwilliges Zugende mit verbleibender Action Capacity regeltechnisch
  existiert;
- ob `end_turn` nur ein Engine-Komfortkommando bei null nutzbarer Kapazität
  ist;
- wie eingeschränkte Zusatzaktionen und Kartenfähigkeiten zum Phasenende
  wirken;
- welche Timingverträge für Score, Rez, Trace, Access und Pass gelten.

### 20.2 Vorläufiger KI-Sicherheitsvertrag

Solange die Engine `end_turn` anbietet, darf der PlanScheduler diese Action
bei verbleibender sicher nutzbarer Action Capacity nicht auswählen. Die
Sperre ist strukturell; ein Wert von `−10000` wäre weiterhin nur ein
zusätzlicher Guard und keine Lösung.

Wenn der normative Regelvertrag bestätigt, dass ein Zug nicht freiwillig
beendet werden darf, gehört die endgültige Lösung in
Engine/LegalAction-Generierung. Dann darf `end_turn` bei verbleibender
nutzbarer Kapazität überhaupt keine LegalAction sein.

Bestätigt der Regelvertrag stattdessen das NETGRID-Hybridmodell, muss die
Engine exakt definieren, in welchen Zuständen freiwilliges EndTurn legal ist.
Der Planner darf diese Legalität nicht selbst erfinden.

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
- zwingenden Handpuffer gegen sichtbare Gefahr herstellen;
- zwingenden Overflow-/Cleanup-Bedarf erfüllen;
- einen eng katalogisierten, monoton sicheren Supportbedarf bedienen.

Ein Draw bei voller Hand und erwartetem wertvollem Überlauf ist kein sicherer
Fallback, solange eine sinnvolle Credit-Aktion verfügbar ist.

„Allgemein Board verbessern“, freier Draw und Probe-Run sind keine neutralen
Fallbacks. Sie benötigen einen fachlichen Plan oder einen konkreten
Parentbedarf. Jeder Fallback trägt einen `fallbackReason` aus einem geschlossenen
Katalog:

```text
no_strategic_candidate
all_candidates_blocked
missing_module_coverage
semantic_mapping_failed
resource_conflict
scheduler_failure
```

Die letzten vier Gründe sind Diagnose- oder Fehlerzustände und dürfen nicht
durch wiederholte sichere Entwicklung unsichtbar gemacht werden.

## 22. Globale Invarianten

1. Keine freiwillige Hauptaktion ohne Plan, Phase und Step.
2. Kein globaler Actionscore darf den Executor planlos ersetzen.
3. Genau ein Executor pro Entscheidung.
4. Urgent Responses präemptieren; sie löschen keine fremden Pläne.
5. Planwechsel benötigen einen dokumentierten fachlichen Grund.
6. Geschützte Fortsetzungen reservieren typisierte Ressourcen, aber keine
   zukünftigen Action-IDs.
7. Blockierte Pläne benennen Blocker und Resume Condition.
8. Fortschritt wird aus Zustandsänderung abgeleitet.
9. Background-Beiträge sind begrenzt und nicht autoritativ.
10. Bis zur normativen Regelklärung ist `EndTurn` bei verbleibender sicher
    nutzbarer Action Capacity als KI-Sicherheitsvertrag gesperrt.
11. Nur aktuelle vorhandene LegalActions sind ausführbar.
12. Alle Planinformationen bleiben side-safe und deterministisch.
13. Karten- und Deckstrategie-Semantik beeinflusst Pläne, erzeugt aber keine
    Legalität.
14. Moduldetails dürfen den gemeinsamen Scheduler nicht mit kartenspezifischen
    Sonderfällen erweitern.
15. Jede Planinstanz besitzt einen expliziten Abschluss- oder Abbruchvertrag.
16. Priority Claims werden zentral validiert; Module vergeben sich keine
    autoritative Klasse.
17. Ausgewählte Actions erfüllen Capability und Target ihres Steps
    semantisch.

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

- **Kernentscheidung:** Alle relevanten Pläne bleiben resident. Es gibt genau
  einen Executor, aber keine fachliche Grenze von zwei Background-Plänen.
  Eine rein technische Höchstzahl wird nur mit deterministischer,
  diagnostizierter Verdrängung eingeführt.
- **Kernentscheidung:** Prioritätsklassen sind hart lexikografisch.
  Zahlenwerte oder geordnete Merkmale entscheiden nur innerhalb derselben
  Klasse.
- **Offen:** Ob die Bewertung innerhalb einer Klasse als normalisierte
  Zahlen, geordnete Merkmalsvektoren oder beides implementiert wird.
- **Blockierend offen:** Welcher ausdrücklich benannte NETGRID-Regelvertrag
  den Widerspruch zwischen konsolidiertem MVP-Konzept, aktueller Engine und
  Comprehensive Rules für EndTurn und Timingfenster auflöst.
- **Arbeitsannahme:** Strategic Intent bleibt eine eigene Ebene oberhalb der
  Planmodule und wird nicht in jedem Modul dupliziert.
- **Kernentscheidung:** Tactical Goals bleiben als kurzlebige
  Goal-/Threat-Signale ohne Ausführungsautorität erhalten.
- **Arbeitsannahme:** Pflichtauswahl und window-spezifische Fortsetzung
  bleiben gemeinsame Untermechanismen und keine normalen strategischen
  Planmodule; optionale Fenster behalten jedoch den PlanExecutionOrigin.
- **Arbeitsannahme:** Pro Karte entsteht nur dann eine residente Planinstanz,
  wenn die Admission-Kriterien aus Abschnitt 27.5 erfüllt sind. Einfache
  One-shot-Opportunities bleiben Route oder kurzlebiges Proposal.

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
| `corp.rez_defense` | aktuelles Rez-Fenster beantworten | Urgent Response von `corp.defend_servers` |
| `corp.apply_punish_pressure` | Tag-/Damage-/Punish-Fenster nutzen | in Kampagne und geschützte Ausführung trennen |

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

- erste strategische Linie aktivieren;
- notwendige Basis-Coverage, Economy oder Engine priorisieren;
- nach erfolgreichem Opening in normale Kampagnen übergeben.

Die Mulligan-Entscheidung selbst gehört nicht in dieses normale Planmodul.
Sie wird durch einen einmaligen, deckstrategischen Opening-Resolver mit
eigenen LegalActions und Abschlussbedingungen getroffen. Dessen Ergebnis
initialisiert anschließend Portfolio und Opening-Plan.

Der Plan endet, sobald:

- die deckstrategisch notwendige Startfähigkeit vorhanden ist;
- eine dringende Response übernimmt;
- oder die Opening-Phase ausdrücklich abgebrochen wird.

### 27.2 `runner.pressure_central`

**Klasse:** `strategic_campaign`
**Rolle:** Vordergrund, zeitweise präemptierbar
**Status:** neu aufzubauen; ersetzt den rein opportunistischen Ein-Zug-Plan

Parameter:

- Ziel `hq`, `rd`, `archives` oder eine typisierte Multi-Server-Sequenz;
- Druckmodus `probe`, `sustained`, `engine_growth` oder `closeout`;
- deckstrategische Linie;
- relevante Access-Engine;
- bekannte Zugriffshistorie und Sättigung;
- Serverpfad und Finanzierungsbedarf.

Das Modul kennt aus der eigenen Deckstrategie und den eigenen
DeckCapabilities, welche R&D-Druck-, Multiaccess-, Search- und
Pfadwerkzeuge grundsätzlich vorhanden sind. Es darf daraus gezielte Draw-,
Search-, Funding- oder Installations-Steps ableiten, statt nur aktuell
angebotene Runs zu bewerten.

Reine Virus- oder Bad-Publicity-Kampagnen sind nicht automatisch Modi dieses
Moduls. Für Version 0.3 gilt:

- serverbezogener Virusfortschritt kann planinterner Enginezustand sein;
- Archives- und Multi-Server-Sequenzen gehören in dieses Modul, wenn ihr
  Hauptzweck Zugriff oder Druck ist;
- Bad-Publicity- oder alternative Loss-Condition-Linien benötigen vor
  produktiver Freigabe einen eigenen Domainvertrag oder einen ausdrücklich
  definierten Modus;
- fehlende Abdeckung wird als `missing_module_coverage` diagnostiziert und
  nicht in den neutralen Fallback gedrückt.

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
**Status:** Arbeitsannahme mit Admission-Gate für `develop_hand_card`;
`play_best_hand_card` entfällt

Verantwortung:

- eine strategisch nützliche Karte spielbar machen;
- ein Deck- oder Board-Engine-Stück entwickeln;
- sinnvollen Draw, Search, Install oder Eventeinsatz koordinieren;
- generische Karten ohne eigenen Spezialplan verwertbar machen.

Alle eigenen Handkarten werden bei der Planerkennung klassifiziert:

```text
1. Beitrag zu einem bereits vorhandenen Plan
2. eigenständige kartenbezogene Planinstanz
3. derzeit nicht sinnvoll entwickelbar
```

Eine Karte der ersten Gruppe wird als Route oder Beitrag des vorhandenen
Plans behandelt. Eine Economy-Karte kann beispielsweise den Funding-Step
eines R&D-Plans erfüllen; eine Multiaccess-Hardware kann unmittelbar zum
R&D-Plan gehören.

Für eine Karte der zweiten Gruppe erzeugt das gemeinsame Modul eine eigene,
an die konkrete Karteninstanz gebundene Planinstanz, aber nur wenn mindestens
ein Admission-Kriterium erfüllt ist:

- mehrere vorbereitende oder konvertierende Steps;
- persistenter Engine- oder Boardzustand;
- relevantes Verfallsfenster;
- eigene geschützte Fortsetzung;
- nachhaltige Transformation von Board oder Strategie;
- kein bestehender Domainplan kann den Zweck als Route oder `PlanNeed`
  aufnehmen.

```text
runner.develop_board_and_hand:<cardInstanceId>
```

Damit entstehen nicht für jede Karte neue Plantypen. Es entstehen mehrere
Instanzen desselben Moduls nur für fachlich persistenzwürdige Vorhaben.
Einfache One-shot-Karten bleiben planlokale Routen oder kurzlebige
Opportunity-Proposals. Damit wird der alte globale Kartenwettbewerb nicht als
globaler Wettbewerb vieler Kleinstpläne reproduziert.

Der Zweck einer kartenbezogenen Instanz darf die eigenständige sinnvolle
Nutzung der Karte selbst sein. Sie muss nicht künstlich einem bereits
existierenden strategischen Plan zugerechnet werden. Der Modulzustand
beschreibt mindestens:

- Zielkarteninstanz und Kartensemantik;
- erwarteten eigenständigen oder unterstützenden Nutzen;
- Kosten, benötigte Slots und Ressourcen;
- notwendige Vorbereitungs- und Folgeaktionen;
- Timing und Verfallsfenster;
- Completion- und Abandonment-Bedingung.

Beispiel:

```text
Eine spezielle Karte wie Delta passt in keinen vorhandenen Domainplan
→ eigene kartenbezogene Planinstanz
→ Funding oder Setup als Steps
→ Karte spielen/installieren
→ erwarteten Effekt konvertieren
→ Plan completed
```

Das Modul priorisiert zugelassene Instanzen auf Planebene. Wo mehrere
One-shot-Karten denselben Domain-Step erfüllen, entscheidet dagegen die
planlokale Routenauswahl. Dadurch bleiben persistenzwürdige Wechselgründe
sichtbar, ohne jede Handkarte künstlich zum strategischen Vorhaben zu machen.

Eine Karte darf mehreren bestehenden Plänen helfen. Eine zusätzliche
eigenständige Instanz wird aber nur erzeugt, wenn sie darüber hinaus einen
eigenen belastbaren Entwicklungszweck besitzt. So entstehen keine
wertgleichen Duplikatpläne für dieselbe Nutzung.

Die dritte Gruppe bleibt diagnostiziert, aber nicht ausführbar. Sie kann nach
neuen Credits, Slots, Boardzuständen oder Strategiebedingungen später eine
Planinstanz erhalten.

Nicht zulässig bleiben:

- Karte spielen, nur weil sie legal und roh positiv bewertet ist;
- turn-limitierte Vorbereitung ohne Commitment;
- Installation ohne absehbaren Nutzen oder mit kritischem Ressourcenbruch;
- Draw bei voller Hand ohne Überlaufbehandlung.

`play_best_hand_card` entfällt als pauschaler strategischer Fallback. Seine
berechtigten Funktionen werden entweder durch Domainrouten oder durch
Admission-geprüfte kartenbezogene Planinstanzen ersetzt.

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

**Klasse:** `urgent_response`, `bounded_sequence` oder
`development_project`
**Rolle:** Urgent Response/Vordergrund
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
return_to_preempted_plan
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

Wenn eine notwendige Prävention oder Recovery nicht auf der Hand liegt, darf
das Modul planintern Draw-, Search-, Funding- und Installations-Steps
erzeugen. „Abwehr“ bezeichnet damit das Ziel, nicht nur eine aktuell
verfügbare Abwehraktion.

### 27.8 `runner.convert_run_window`

**Klasse:** `urgent_response` oder gebundener Kindplan
**Rolle:** Urgent Response
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
- `runner.defense_and_recovery:restore_hand_buffer` bei sichtbarer Gefahr;
- Admission-geprüfter monotoner Supportbedarf.

Die Auswahl bleibt eine Planentscheidung mit Zweck und Abschlussbedingung.
Ein Probe-Run ist nie neutraler Fallback. Er benötigt einen ausführbaren
Pressure-/Informationsplan mit Target, Risiko und erwarteter Konversion.

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

Ein nach sichtbarem Zustand erzwungener Same-Turn-Score ist ein Commitment.
Einzelne Economy- oder
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
Central-Responses erhalten. Fast-Advance-Decks erhalten nicht automatisch
dieses dauerhafte Projekt.

### 28.4 `corp.defend_servers`

**Klasse:** `development_project` mit `urgent_response`-Kindern
**Rolle:** Background/Vordergrund/Urgent Response
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

Eine Rez-Entscheidung ist eine fenstergebundene Urgent Response. Sie darf den
Parent-Scoring- oder Remoteplan präemptieren, aber nicht vergessen.

#### Ownership zwischen Score, Remote und Defense

| Verantwortung | fachlicher Owner |
| --- | --- |
| Agendaquelle, Install/Advance/Score und Scoredeadline | `corp.score_agenda` |
| langfristige Nutzbarkeit und Wiederverwendung eines Remotes | `corp.establish_scoring_remote` |
| Schutzbewertung, Rez-Entscheidung und allgemeine Central-Floors | `corp.defend_servers` |
| konkrete Härtung für einen Score- oder Remote-Parent | typisierter Defense-Supportbedarf des Parents |
| einmalige Opening-Basis ohne bestehendes Zielprojekt | `corp.opening_and_board_foundation` |

Eine ICE-Installation kann mehreren Plänen nutzen, besitzt aber genau einen
Root-Owner und genau einen Leaf-Executor. Mehrplannutzen bleibt Tiebreaker.

### 28.5 `corp.respond_to_virus_pressure`

**Klasse:** `urgent_response` oder `bounded_sequence`
**Rolle:** Vordergrund/Urgent Response
**Status:** explizite Zielmodul-Lücke

Verantwortung:

- sichtbare Virusbedrohung und erwartete nächste Konversion bewerten;
- Regelkosten und Opportunity Cost eines Purges bestimmen;
- eingeschränkte oder aufgegebene Action Capacity korrekt reservieren;
- Purge gegen Score, Remote-Härtung, Economy und Terminalpfade vergleichen;
- nach Wirkung zum vorherigen Root-Foreground zurückkehren.

Ob der Purge in NETGRID exakt drei Aktionen aufgibt oder anders modelliert
wird, folgt ausschließlich dem noch festzulegenden normativen Regelvertrag.
Das Modul erzeugt keine eigene Purge-Legalität.

### 28.6 `corp.economy`

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

### 28.7 `corp.punish_campaign`

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
viability: dormant
```

Der Plan darf über mehrere Züge bestehen, während Scoring oder Economy den
Vordergrund übernimmt.

Tag-Druck, Credit-Denial und Damage bleiben zunächst Modi dieser gemeinsamen
Kampagne. Das Modul priorisiert seine internen Linien selbst. Eine spätere
Trennung ist nur nötig, wenn Spiel-Evidence zeigt, dass ihre Lebenszyklen und
Fortschrittsbegriffe nicht mehr sinnvoll gemeinsam modellierbar sind.

### 28.8 `corp.execute_punish_sequence`

**Klasse:** `bounded_sequence`
**Rolle:** P1-/P3-Vordergrund; Kind von `corp.punish_campaign`
**Status:** Ziel für die geschützte Ausführung des heutigen Punish-Plans

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

Eine planfremde Aktion wie Closed Accounts darf eine weiterhin lethal
Drei-Aktionen-Flatline-Sequenz nicht aufbrechen.

### 28.9 `corp.ambush_and_bluff`

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

### 28.10 `corp.hand_and_agenda_management`

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

Ungewöhnliche Midgame-Utility-, Action-Engine- oder Boardtransformationskarten
werden zuerst bestehenden Domainplänen als Route oder Admission-geprüfte
kartenbezogene Instanz zugeordnet. Ein breiter
`corp.safe_generic_development`-Plan ist kein akzeptierter Dauerauffang. Falls
diese Zuordnung wiederholt scheitert, wird daraus anhand konkreter
Spielevidence ein enger Corp-Entwicklungsdomainvertrag geschnitten.

### 28.11 Corp-neutraler Fallback

Wie beim Runner wird kein freier globaler Actionsieger verwendet.

Mögliche sichere Instanzen:

- `corp.economy:neutral_credit_fallback`;
- `corp.hand_and_agenda_management:safe_draw_or_refresh`;
- zwingender sichtbarer Hand-/Overflow-Schutz.

`raise_visible_floor` benötigt Defense-Evidence; allgemeine Boardentwicklung
benötigt ein Domainmodul. Beides ist kein neutraler Fallback.

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
| ICE/Asset rezzen | aktuelle Defense-/Economy-/Ambush-Response |
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
- **Kernentscheidung:** Alle relevanten Planinstanzen bleiben resident; nach
  jeder Aktion werden sie neu bewertet, ohne sie neu aufbauen zu müssen.
- **Kernentscheidung:** Economy ist sowohl selbständiges Planmodul als auch
  Supportlieferant für Parentpläne.
- **Kernentscheidung:** Prioritätsklassen entscheiden vor Zahlenwerten.
  Zahlenwerte gelten nur innerhalb derselben Klasse; Module liefern
  validierbare Claims statt autoritativer Klassen.
- **Kernentscheidung:** Strategische Kampagnen benötigen Deckunterstützung;
  taktische Pläne benötigen eine aktuelle Situation. Planmodule dürfen die
  eigenen DeckCapabilities für Draw-, Search- und Entwicklungs-Steps nutzen.
- **Kernentscheidung:** Same-Turn-Payoffs werden durch geschützte,
  StateVersion-weise neu materialisierte Fortsetzungen abgesichert, nicht
  lediglich durch positive Action-Scores.
- **Arbeitsannahme:** Nicht zugeordnete Handkarten erzeugen nur nach
  Admission-Gate eine residente kartenbezogene Instanz. Einfache One-shots
  bleiben Routen oder kurzlebige Proposals.
- **Kernentscheidung:** Die drei heutigen Runner-Survival-Typen gehen
  zunächst in einem
  gemeinsamen `runner.defense_and_recovery`-Modul auf.
- **Arbeitsannahme:** Die heutigen Economy-Typen bleiben als interne Modi oder
  Instanzvarianten erhalten, nicht als unabhängige Scheduler-Sonderfälle.
- **Kernentscheidung:** `runner.play_best_hand_card` wird als pauschaler Plan
  entfernt und durch Domainrouten plus Admission-geprüfte kartenbezogene
  Instanzen ersetzt.
- **Kernentscheidung:** Corp-Punish startet als gemeinsame langlebige
  Kampagne mit internen Modi und geschütztem Ausführungs-Kindplan.
- **Kernentscheidung:** Planbindung verwendet `locked_sequence`,
  `sticky_goal`, `flexible_support` und `recurring_cadence`. Ein höherer
  Prioritätsrang unterbricht gewöhnliche Pläne; geschützte Fortsetzungen
  besitzen den engeren Terminal-/Survival-Vertrag.
- **Kernentscheidung:** Tactical Goals bleiben kurzlebige Goal-/Threat-Signale
  ohne eigene Handlungsautorität.
- **Kernentscheidung:** PlanAssessments werden vor der Executorwahl erzeugt;
  vollständige Route Heads erst danach.
- **Kernentscheidung:** Viability, Portfolio-Rolle und Execution State sind
  orthogonale Achsen.
- **Kernentscheidung:** `PlanNeed`, typisierte Ressourcenclaims und
  Root-/Leaf-Executorpfad sind gemeinsame Kernelverträge.
- **Offen:** Ob `corp.ambush_and_bluff` und
  `corp.hand_and_agenda_management` bereits in der ersten
  Implementierungsstufe eigene Module werden oder zunächst als Phasen
  vorhandener Module starten.
- **Offen:** Ob Opening-Pläne nach der ersten Spielphase vollständig
  abgeschlossen oder als diagnostische Deckphaseninstanz behalten werden.

## 33. Konkreter Entscheidungsalgorithmus

Der folgende Ablauf ist konzeptioneller Zielpseudocode:

```ts
function choosePlannedAction(context): PlannedDecision {
  assertCurrentStateVersion(context);
  assertSideSafeInput(context);

  const window = classifyDecisionWindow(context);
  if (window.kind === "automatic_resolution") {
    return continueEngineResolution(window, context);
  }
  if (window.kind === "mandatory_choice") {
    return resolveMandatoryChoice(window, context);
  }
  if (window.kind === "run_access_trace_continuation") {
    return resolvePlanBoundContinuation(window, context.executionOrigin);
  }

  const semanticActions = projectActionSemanticCandidates(
    context.legalActions,
    context,
  );
  let portfolio = reconcileAndDiscoverPortfolio(context);

  for (let attempt = 0; attempt < MAX_REPLAN_ATTEMPTS; attempt += 1) {
    const assessments = assessAllRelevantPlans(
      portfolio,
      semanticActions,
      context,
    );
    const validated = validatePriorityClaimsAndArbitrateResources(
      assessments,
      portfolio,
      context,
    );
    const { rootForeground, leafExecutor } =
      continueOrSelectExecutionPath(validated, portfolio, context);

    if (!leafExecutor) {
      portfolio = activateNeutralFallback(portfolio, context);
      continue;
    }

    const module = registry.moduleFor(leafExecutor.moduleId);
    const step = module.proposeStep(leafExecutor, context);
    const routes = module.materializeRoutes(
      leafExecutor,
      step,
      semanticActions,
      context,
    );

    const viableRoutes = applyGlobalSafetyGates(routes, context);

    if (viableRoutes.length === 0) {
      portfolio = blockOrReplan(executor, step, portfolio, context);
      continue;
    }

    const route = selectPlanLocalRoute(
      module,
      leafExecutor,
      step,
      viableRoutes,
      context,
    );

    const commitment = maybeCreateCommitment(route, context);
    const action = route.head;

    assertLegalActionExists(action, context.legalActions);
    assertNoFutureActionIds(route, context.stateVersion);
    assertActionAttributedToPlan(
      action,
      rootForeground,
      leafExecutor,
      step,
      route,
    );
    assertSemanticCapabilityAndTargetMatch(action, step, semanticActions);
    assertEndTurnContract(action, context);

    return buildPlannedDecision(
      rootForeground,
      leafExecutor,
      step,
      route,
      commitment,
      action,
    );
  }

  throw new PlanResolutionFailure(currentStateVersion, diagnostics);
}
```

### 33.1 Begrenztes Replanning

Ist ein ausgewählter Step nicht auf LegalActions abbildbar, wird nicht sofort
eine beliebige Aktion gewählt. Der Scheduler darf innerhalb derselben
Entscheidung begrenzt neu planen:

1. Step als blockiert markieren;
2. Supportbedarf prüfen;
3. Viability, Need oder Preemption-Grund aktualisieren;
4. nächsten ausführbaren Plan wählen;
5. spätestens nach einer festen Anzahl deterministischer Versuche mit
   Diagnosefehler stoppen.

Ein stiller freier Action-Fallback ist nicht erlaubt.

### 33.2 Deterministische Tie-Breaks

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

## 34. Arbeit während eines Zuges

### 34.1 Zugbeginn

Am Zugbeginn:

- per-turn Cadence zurücksetzen;
- abgelaufene Opportunities und Commitments schließen;
- dauerhafte Kampagnen und Background-Projekte behalten;
- Mandatory-Draw- oder Start-of-Turn-Fenster auflösen;
- neue eigene Karten und sichtbare gegnerische Änderungen einarbeiten;
- Strategic Intent und Spielphase revalidieren;
- Portfolio-Rollen neu vergeben.

Ein Zugbeginn startet nicht mit einem leeren Planbestand.

### 34.2 Vor der ersten freiwilligen Aktion

Der Scheduler erstellt ein Planranking. Es enthält:

- alle relevanten residenten Instanzen;
- neue Kandidaten;
- Readiness und Prioritätsklasse;
- aktuellen Vordergrund;
- Challenger;
- wartende und blockierte Pläne;
- Ressourcen- und Commitment-Konflikte.

Danach wird genau ein Executor festgelegt.

### 34.3 Nach jeder eigenen Aktion

Nach der neuen StateVersion:

1. tatsächliches Ergebnis gegen Planerwartung prüfen;
2. Commitment fortsetzen oder mit Grund invalidieren;
3. Planfortschritt aktualisieren;
4. aktuellen Step abschließen oder wiederholen;
5. neue Urgent Responses und Terminalpfade prüfen;
6. Planwechsel nur nach Hysteresevertrag zulassen;
7. nächste Aktion erneut plan-first bestimmen.

Die KI commitet sich nicht blind für einen ganzen Zug. Sie revalidiert nach
jeder Aktion, behält aber Ziel und Commitment.

### 34.4 Während des gegnerischen Zuges

Plan-Memory darf durch erlaubte öffentliche Ereignisse aktualisiert werden:

- neue Remotes und Advancements;
- Runs und erfolgreiche Zugriffe;
- Rez- und Trash-Ereignisse;
- sichtbare Tags, Damage und Agenda-Punkte;
- Draw-, Shuffle- oder Reorder-Ereignisse, soweit öffentlich.

Corp-Rez- und andere echte Entscheidungsfenster können eine Urgent Response
aktivieren. Ansonsten handelt kein Plan außerhalb eines legalen Fensters.

### 34.5 Zugende

Vor `EndTurn` prüft der Scheduler:

- verbleibende Action Capacity;
- offene Commitments;
- ungenutzte zwingende Follow-ups;
- sofort ausführbare P1- bis P5-Pläne;
- neutralen sicheren Fallback.

Nur wenn der EndTurn-Vertrag erfüllt ist, wird die LegalAction gewählt.

## 35. Planwechsel, Unterbrechung und Rückkehr

Jeder Wechsel besitzt einen standardisierten Grund:

```text
completed
hard_blocked
target_invalidated
higher_priority_interrupt
terminal_challenger
expiring_opportunity
cadence_yield
same_class_margin
strategy_phase_changed
```

Nicht zulässig:

```text
raw_action_score_positive
mapped_action_nonpositive
semantic_override
arbitrary_repetition_penalty
```

### 35.1 Suspendieren statt Vergessen

Beispiel Runner:

```text
R&D-Kampagne aktiv
→ Corp installiert unpassierbares Code Gate
→ R&D-Kampagne blocked: missing_code_gate_coverage
→ Rig-and-Coverage wird Vordergrund
→ Decoder installiert
→ R&D-Kampagne ready
→ nach Hysterese wieder Vordergrund
```

Beispiel Corp:

```text
Scoring-Remote-Projekt aktiv
→ Runner startet R&D-Run
→ Rez-Defense-Response übernimmt
→ Run endet
→ Remote-Projekt kehrt unverändert zurück
```

### 35.2 Bewusste Abwechslung

Ein Background-Plan darf eine begrenzte Aktion erhalten:

```text
R&D-Kampagne foreground
Broker-Bank background, cadence 1
→ Scheduler lässt Broker einmal laden
→ Broker cadence exhausted
→ R&D-Kampagne wird wieder Executor
```

Der Wechselgrund lautet `cadence_yield`. Er ist kein zufälliger Wechsel durch
Action-Score-Nähe.

### 35.3 Höherklassiger Plan während einer laufenden Bindung

Bei `sticky_goal`, `flexible_support` und `recurring_cadence` übernimmt ein
ausführbarer höherklassiger Plan. Der bisherige Plan wird je nach Zustand
präemptiert, neu gebunden oder gibt nach Cadence ab.

Bei `locked_sequence` gilt:

1. P0-Pflichtfenster werden immer aufgelöst.
2. Eine nachweislich notwendige höherklassige Terminal- oder
   Survival-Reaktion darf die Sequenz brechen.
3. Zwei konkurrierende P1-Pfade werden durch den Terminalsolver nach
   Garantiegrad und Reihenfolge entschieden.
4. Ein bloß höherer Wert innerhalb derselben oder einer niedrigeren Klasse
   bricht die Sequenz nicht.
5. Wird die Sequenz objektiv unmöglich, wird sie invalidiert statt künstlich
   fortgeführt.

Ein flexibler Geldplan kann dagegen ohne Verlust das Ziel wechseln:

```text
allgemeine Reserve wird aufgebaut
→ neuer höherklassiger Plan entsteht
→ vorhandene Liquidität wird dessen Funding zugeordnet
→ Economy-Fortschritt bleibt erhalten
```

Damit sind Planpersistenz und Commitments nicht identisch. Die genaue
Kalibrierung von Sticky-Margen bleibt empirisch; die vier
Bindungskategorien sind Teil des Rahmenvertrags.

## 36. Akzeptanzszenario A – Highlighter-R&D

Quelle: gespeichertes Spiel `match_85f8dc10007f057d`.

### 36.1 Erwartete Planinstanzen am ersten Runnerzug

| Plan | Zustand | Rolle |
| --- | --- | --- |
| `runner.pressure_central:rd` | ready | Vordergrund |
| `runner.economy:fund_parent_need` | bei Bedarf erzeugbar | Support |
| `runner.rig_and_coverage` | dormant | resident |
| `runner.develop_board_and_hand` | ready, aber niedriger | Challenger |
| `runner.pressure_central:hq` | ready, aber niedriger | Challenger |

R&D ist durch Deckstrategie, Highlighter auf der Hand, offenen Pfad und
ausreichende Anfangsressourcen die führende Kampagne.

### 36.2 Erwartete Stepfolge im ersten Zug

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

### 36.3 Erwartete Stepfolge im zweiten Zug

| Klick | Zugriffstiefe | Planfortschritt |
| --- | --- | --- |
| 1 | 2 Karten | neue Information, Highlighter wächst |
| 2 | 3 Karten | Corporate War gestohlen, 3 AP |
| 3 | 4 Karten | weitere Information und Corp-Trash |
| 4 | 5 Karten | Corporate Downsizing gestohlen, 5 AP |

Die vier R&D-Runs dürfen keine pauschale Same-Server-Strafe erhalten, weil:

- Zugriffstiefe wächst;
- neue Karten erreicht werden;
- Agenda-Punkte gewonnen werden;
- die Siegdistanz sinkt.

### 36.4 Closeout

Im dritten Runnerzug:

```text
phase closeout
→ erster R&D-Run mit sechs Zugriffen
→ Revalidierung
→ zweiter R&D-Run mit sieben Zugriffen
→ Agenda für 7 AP
→ terminaler Sieg
```

### 36.5 Abnahmebedingungen

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

## 37. Akzeptanzszenario B – Manhunt-Flatline

Quelle: gespeichertes Spiel `match_639d02fcac91f90f`.

### 37.1 Anfangsportfolio der Corp

| Plan | Zustand | Rolle |
| --- | --- | --- |
| `corp.opening_and_board_foundation` | ready | Vordergrund |
| `corp.punish_campaign:tag_and_bag` | dormant | resident |
| `corp.score_agenda` | dormant, noch keine Agenda gewählt | resident |
| `corp.economy` | ready, aber niedriger | Support/Challenger |

Die Eröffnung:

```text
Credit beschaffen
→ Keeper vor R&D installieren
→ Quandary vor neues Remote installieren
```

ist eine zusammenhängende Board-Foundation, nicht drei unverbundene
Einzelaktionen.

### 37.2 Scoring-Übergabe

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

### 37.3 Economy als zeitweiliger Vordergrund

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

### 37.4 Wartender Killplan

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

### 37.5 Geschützte, verzweigte Killfortsetzung

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

### 37.6 Abnahmebedingungen

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

## 38. Regressionsszenarien aus der aktuellen Action-Arbitration

### 38.1 Turn-limitierte Vorbereitung

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

### 38.2 Alles negativ

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
4. neutralen Economy-Fallback aktivieren;
5. Basic Credit als Step dieses Plans wählen;
6. EndTurn sperren.

Der Credit braucht dafür keinen künstlichen globalen Bonus.

### 38.3 Falsche Capability-Erfüllung

Eine Karte darf einen Step nur erfüllen, wenn ihre Semantik die benötigte
Fähigkeit tatsächlich trägt.

Verbindlicher Gegenfall:

- Psychic Friends oder eine andere Nicht-Breaker-Karte darf nicht als
  Icebreaker-Coverage installiert oder gezählt werden;
- Kartentyp, Subtyp, Taktiksignale und konkrete LegalAction-Ziele müssen den
  Capability-Vertrag gemeinsam erfüllen;
- mehrere unpassende Installationen dürfen keinen scheinbaren
  Rig-Fortschritt erzeugen.

### 38.4 Background-Pingpong

- Bankplan lädt höchstens gemäß seiner Cadence;
- Cashout nur bei konkretem Bedarf oder Zielschwelle;
- kein Load/Cashout-Wechsel ohne neue Zustandsgrundlage;
- Vordergrundplan kehrt nach der Background-Aktion zurück.

### 38.5 Planwechsel ohne Grund

Bei unverändertem Zustand und unveränderten Kandidaten muss die nächste
Entscheidung denselben Vordergrund behalten. Ein anderer stabiler Tie-Break
oder eine kleine Scoreverschiebung darf kein Churn erzeugen.

## 39. Diagnostikvertrag

Die Decision Chain soll den echten Auswahlweg abbilden, nicht lediglich eine
nachträgliche Erklärung.

### 39.1 Planportfolio

Mindestens sichtbar:

```text
portfolio
  urgent response candidates
  root foreground
  leaf executor
  backgrounds
  dormant
  blocked
  preempted
  rejected proposals
```

Je Instanz:

- Modul und Instanz-ID;
- dedupeKey und Modulversion;
- Ziel;
- Viability, Portfolio-Rolle und Execution State;
- beantragte und validierte Prioritätsklasse samt Witness/Garantiegrad;
- Phase und Step;
- Fortschritt und letzter Fortschrittsgrund;
- Blocker und Resume Conditions;
- offene Needs, Ressourcenclaims und akzeptierte Reservierungen;
- geschützte Fortsetzung und aktueller semantischer Graphknoten;
- Completion-/Abandonment-Grund.

### 39.2 Planranking

Das Ranking erklärt:

- warum der Vordergrund fortgesetzt wurde;
- welches PlanAssessment Readiness und Machbarkeit belegte;
- welcher Challenger am nächsten lag;
- welcher Priority Claim bestätigt oder herabgestuft wurde;
- welche Wechselmarge oder Hysterese wirkte;
- warum wartende Pläne nicht ausführbar waren.

### 39.3 Step- und Routenranking

Für den Executor:

- aktueller Step;
- benötigte Fähigkeit;
- alle aktuellen viable Route Heads;
- semantische Fortsetzung ohne zukünftige Action-IDs;
- ausgeschlossene Routen mit fachlichem Grund;
- gewählte Action-ID;
- erwartetes Ergebnis;
- tatsächliches Ergebnis nach Revalidierung.

### 39.4 Verbotene Zielbegriffe

Im Zielzustand gibt es keine Auswahlbegründung:

```text
plan is diagnostic_only
semantic choice overrode plan
mapped nonpositive against positive
selected by raw action score despite plan mismatch
```

Ein Plan darf zu Diagnosezwecken zusätzlich beobachtet werden, aber der
produktive ausgewählte Plan ist immer autoritativ.

### 39.5 Redaction

Öffentliche oder gegnerseitige Diagnostik zeigt niemals:

- eigene verdeckte Kartenidentitäten der anderen Seite;
- geheime Planquellen aus gegnerischer Hand oder Deck;
- abgeleitete Hidden-Zone-Inhalte;
- unredigierte interne Evidence.

Plan-Debug bleibt nach Seite, Betrachter und Matchstatus redigiert.

## 40. Teststrategie

### 40.1 Planmodul-Vertragstests

Jedes Modul testet:

- Discovery-Positivfall;
- Discovery-Gegenfall;
- Instanzidentität und Deduplizierung;
- Phasenübergänge;
- Blocker und Resume Condition;
- Completion und Abandonment;
- Fortschritt nur bei echter Zustandsänderung;
- side-safe Diagnostik;
- deterministisches Ergebnis.

### 40.2 Scheduler-Kerntests

- genau ein Executor;
- Root-Foreground und Leaf-Executor bleiben korrekt zugeordnet;
- Urgent Response präemptiert und Rückkehr funktioniert;
- Hysterese verhindert Churn;
- höhere Prioritätsklasse gewinnt;
- Modul kann keinen unbelegten P1-/P2-Claim installieren;
- P5-Background verdrängt P4 nicht allein wegen Cadence;
- Supportkind eines P2-Parents erhält delegierte Priorität, unabhängiger
  Economy-Plan nicht;
- Ressourcen werden nicht doppelt reserviert;
- typisierte Action Capacity wird nur für zulässige Fähigkeiten ausgegeben;
- geschützte Fortsetzung schützt Folgeaktionen;
- Route oder Commitment enthält keine zukünftige oder veraltete Action-ID;
- begrenztes Replanning terminiert;
- neutraler Fallback entsteht;
- EndTurn-Gate;
- jede gewählte Action besitzt Planattribution;
- Capability- und Target-Mismatch der ausgewählten Action sind null.

### 40.3 Cross-Modul-Tests

- Parentplan fordert Economy-Support an und wird wieder aufgenommen;
- Rigplan entsperrt Central-Plan;
- Corp-Economy finanziert Score- oder Punishplan;
- Remote-Projekt überlebt Rez-Response;
- Defense-Plan unterbricht Central-Druck und gibt später zurück;
- Corp-Purge unterbricht Highlighter-Druck und gibt zum vorherigen Plan
  zurück;
- ein Mehrplanbeitrag bleibt Tiebreaker, nicht Override.

### 40.4 Decision Checkpoints

Checkpoints prüfen nicht nur die Action-ID. Sie können verlangen:

- ausgewähltes Planmodul;
- Planinstanz und Ziel;
- Phase und Step;
- vorhandenes Commitment;
- verbotenen Planwechselgrund;
- Ressourcenreservierung;
- Planattribution der gewählten Aktion.

Numerische Scores bleiben möglichst ungepinnt. Fachliche Rang- und
Invariantenverträge sind führend.

### 40.5 Historische Matchszenarien

Mindestens:

- Highlighter-R&D-Kampagne;
- Manhunt-Flatline;
- Prearranged Drop;
- Promises, Promises;
- negativer Draw bei voller Hand;
- wiederholte wertlose Archives-/HQ-Runs;
- Broker-Cadence und Cashout;
- Remote-Matchpoint-Response;
- Corp-Same-Turn-Score;
- Runner-Tag-/Damage-Abwehr;
- falsche Breaker-Coverage durch Nicht-Breaker.

Highlighter-Gegenfälle umfassen zusätzlich Corp-Purge, unpassierbares R&D,
Entfernung des Virusträgers, sinkenden Grenznutzen und
Remote-Matchpoint-Unterbrechung. Manhunt-Gegenfälle umfassen gescheiterten
Trace, Tagvermeidung, Damageprävention, fehlende Damagequelle und Abbruch einer
nach dem ersten Step nicht mehr terminalen Linie.

### 40.6 Deckstrategie-Gegenfälle

Dasselbe Board und dieselbe Hand werden mit unterschiedlichen eigenen
Deckstrategien getestet:

- R&D-Deck priorisiert nachhaltigen R&D-Druck;
- HQ-Deck priorisiert HQ-Linie;
- Rig-first-Deck investiert früher in Coverage;
- Run-Event-Tempo-Deck hält passende Eventketten;
- Fast-Advance-Corp baut keine Glacier-Burg;
- Glacier-Corp hält ein langfristiges Remote-Projekt;
- Tag-and-Bag-Corp bewahrt Killkomponenten;
- neutrales Deck erhält sichere Fallbackpläne.

### 40.7 Full-Match- und Baseline-Evidence

Nach Modul- und Checkpointtests:

- deterministische Full Matches;
- feste AI Behavior Baseline;
- Seed-Serien;
- Plan-Churn-, EndTurn-, Action-Coverage- und Commitment-Metriken;
- qualitative Vollaudits ausgewählter Spiele;
- getrennte Bewertung von technischer Sicherheit und Play Strength.

### 40.8 Hidden-Info-Äquivalenz

Zwei vollständige Testzustände mit identischer side-sicherer `PlayerView`,
aber unterschiedlichen gegnerischen Hidden-Zonen müssen vor Enthüllung
dieselbe KI-Entscheidung erzeugen. Das umfasst insbesondere:

- gegnerische Handkarten und verdeckte Remotes;
- unbekannte ICE-Identitäten;
- verdeckte Runner-Ressourcen;
- zukünftige R&D-Reihenfolge.

Bei kontrolliertem Match-RNG gilt Gleichheit einschließlich Seed und
RandomCounter.

### 40.9 Eingeschränkte Kapazität und Fallback-Audit

Mindestens Valu-Pak-, Edgerunner-, Wilson-, Broker- und kostenlose
Follow-up-Run-Kontexte prüfen Tokenart, Folgezwang, Usage Limit und Ablauf.

Full Matches zählen Fallbacks nicht nur, sondern klassifizieren ihren Grund.
`missing_module_coverage`, `semantic_mapping_failed`, `resource_conflict` und
`scheduler_failure` sind sichtbare Abweichungen und dürfen nicht dauerhaft
durch generische Entwicklung kaschiert werden.

## 41. Zielmetriken

Technische Kernmetriken:

```text
plan_attribution_rate = 100 %
selected_action_capability_mismatch = 0
selected_action_target_mismatch = 0
voluntary_action_without_executor = 0
plan_override_after_selection = 0
end_turn_with_safe_action_capacity = 0
broken_same_turn_commitment = 0
duplicate_plan_instance_same_target = 0
resource_overreservation = 0
future_or_stale_action_id_in_route = 0
hidden_info_plan_leak = 0
nondeterministic_plan_selection = 0
```

Qualitative Metriken:

- Planwechsel pro Zug mit klassifiziertem Grund;
- Anteil fortgesetzter gegenüber neu entdeckten Kampagnen;
- Anteil planloser oder nicht konvertierter Vorbereitungen;
- Background-Aktionen ohne Parent- oder Eigenfortschritt;
- wiederholte Aktionen mit und ohne echten Grenznutzen;
- neutrale Fallbacks nach Ursache;
- Planabschluss, Aufgabe und Stale-TTL.

Die Metriken sind Diagnose- und Gate-Evidence, keine alleinige
Play-Strength-Freigabe.

## 42. Ableitung eines späteren Implementierungsplans

Dieses Dokument legt noch keine endgültige Paketfolge fest. Ein späterer
Umsetzungsprozess soll mindestens folgende Arbeitsstränge schneiden:

### 42.0 Verhältnis zu Ist-Architektur, Roadmap und Proteus

- Die aktuellen TacticalPlan-Typen sind produktive Ist-Evidence und
  Migrationsmaterial, aber keine Basisklassen des neuen Kernels.
- Plan-first ersetzt im Zielzustand den früheren direkten
  Goal-vs-Action-Entscheider. Goal-/Threat-Signale und
  `ActionSemanticCandidates` bleiben jedoch verbindliche Vor- beziehungsweise
  Abbildungsebenen.
- Ältere Roadmap-Aussagen, Proteus erst nach Originalset-Stabilität zu öffnen,
  sind überholt: Der aktuelle Projektstatus weist 154/154 Proteus-Karten als
  technisch `ai_supported` aus. Die Akzeptanzszenarien gehören daher zum
  produktiven Zielscope; Play Strength bleibt ein separates Gate.
- Temporäre reproduzierbare Vergleichsläufe und Checkpoints sind zulässig.
  Eine dauerhaft parallele Hybrid-Runtime oder ein unbefristeter
  Legacy-Fallback sind kein Ziel.

### 42.1 Vertrag und Observability

- Zieltypen und Planattribution;
- echte Plan-/Step-/Route-Decision-Chain;
- Ist-Abweichungen messbar machen;
- Checkpoints um Planinvarianten erweitern.

### 42.2 Kernel und side-spezifische Scheduler

- orthogonale Zustandsachsen und Retention-Vertrag;
- Runner-/Corp-Registry;
- Executor-Exklusivität;
- PlanAssessment, validierte Priority Claims und Hysterese;
- PlanNeed, typisierte Ressourcen und geschützte Fortsetzungen.

### 42.3 Runner-Migration

Empfohlene fachliche Reihenfolge:

1. Regelvertrag und vorläufiger EndTurn-Guard;
2. Economy-Support;
3. Central-Kampagne;
4. Remote-Contest;
5. Rig-and-Coverage;
6. Defense-and-Recovery;
7. Admission-geprüfte Hand-/Boardentwicklung;
8. Run-Window-Konversion.

### 42.4 Corp-Migration

Empfohlene fachliche Reihenfolge:

1. Economy-Support;
2. Score-Commitments;
3. Server-Defense und Rez-Response;
4. Scoring-Remote-Projekt;
5. Virusresponse/Purge;
6. Punish-Kampagne und geschützte Ausführung;
7. Opening-/Board-Foundation;
8. Hand-/Agenda-Management;
9. Ambush-/Bluff-Modul.

### 42.5 Cutover

- globale Action-over-Plan-Overrides entfernen;
- `diagnostic_only` für den produktiv ausgewählten Plan verbieten;
- freie Semantic-Runtime-Auswahl als Produktivfallback schließen;
- Action-Coverage-Gate aktivieren;
- alte überlappende Plantypen und Legacy-Memory entfernen.

NETGRID Version 0 benötigt dafür keine Rückwärtskompatibilität alter lokaler
Plan-Memory- oder Trace-Formate.

Es soll keine dauerhaft parallele zweite KI-Runtime entstehen.
Zwischenvergleiche erfolgen über reproduzierbare Checkpoints, Simulation und
klar begrenzte Diagnosepfade.

### 42.6 Vertikale Kernel-Slices

Der Kernel wird nicht zuerst vollständig abstrakt gebaut und erst danach
fachlich geprüft. Die belastbare Reihenfolge ist:

1. normativen Regelvertrag festhalten;
2. Goal-/Planhierarchie, Zustandsachsen und Retention definieren;
3. `ActionSemanticCandidate` als verbindliche Step-Bindung absichern;
4. `PlanAssessment` sowie Route Head/Fortsetzung implementieren;
5. Corp-Same-Turn-Score und einen Runner-Central-Step End-to-End ausführen;
6. daraus `PlanNeed`, Ressourcen und geschützte Fortsetzung verifizieren;
7. Highlighter plus Corp-Purge, verzweigten Manhunt-Pfad und ein echtes
   Run-/Ability-Fenster als unterschiedliche Belastungsslices ergänzen;
8. erst danach breite Modulmigration und Cutover.

## 43. Architektur-Gate vor Implementierungsplanung

Vor dem Schneiden des Umsetzungsprozesses sind mindestens zu reviewen:

- Ist der Kernel klein genug und frei von Kartenlogik?
- Sind Runner- und Corp-Grenzen eindeutig?
- Decken Zielmodule alle freiwilligen Action-Familien ab?
- Sind Economy als Plan und Economy als Support sauber getrennt?
- Sind Parent-, Kind- und Background-Beziehungen ausreichend?
- Reicht der Need-/Fortsetzungsvertrag für Prep-, Score-, Run- und
  Killketten?
- Ist die Prioritätsklassenordnung für Sieg, Überleben und Threats eindeutig?
- Kann kein Modul einen unbelegten P1-/P2-Claim installieren?
- Sind Goal-/Threat-Signale eindeutig nicht autoritativ?
- Enthalten Routen und Fortsetzungen ausschließlich eine aktuelle Action-ID?
- Sind Viability, Rolle und Execution State trennscharf?
- Ist der normative Regelvertrag einschließlich EndTurn und Fenster festgelegt?
- Sind Planwechsel und Wiederaufnahme vollständig diagnostizierbar?
- Können neue Karten innerhalb bestehender Module ergänzt werden?
- Sind alle Daten side-safe und deterministisch?
- Welche offenen Modulzuschnitte müssen vor der ersten Codephase entschieden
  werden?

## 44. Pflege dieses WIP-Dokuments

Neue Spielanalysen werden wie folgt eingearbeitet:

1. Beobachtung und Match-Evidence benennen;
2. prüfen, ob sie Kernel, Scheduler-Policy oder ein Planmodul betrifft;
3. bestehende Regel erweitern, statt einen parallelen Sondervertrag anzulegen;
4. Reifegrad als Kernentscheidung, Arbeitsannahme oder offen markieren;
5. neues Akzeptanz- oder Gegenfallszenario ergänzen;
6. Änderungsverlauf aktualisieren;
7. erst danach Umsetzungsfolgen ableiten.

Wenn eine Detailverbesserung nur ein Modul betrifft, wird der gemeinsame
Rahmen nicht verändert. Beispiele:

- genauere Credit-Dringlichkeit → Economy-Modul;
- Highlighter-Zugriffstiefe → Central-Planmodul;
- Reihenfolge Tag-Clear gegen Hand-Draw → Runner-Defense-Modul;
- Remote-Schutzband → Corp-Remote-/Defense-Modul;
- allgemeine Reservierung mehrerer Folgeaktionen → Kernel.

## 45. Änderungsverlauf

### 0.3 – 2026-07-23

- externes Architekturreview kritisch eingearbeitet; Regel-PDF-Seiten 39 und
  65 visuell gegen die angeführten Regeln geprüft;
- Tactical Goals als kurzlebige, nicht autoritative Goal-/Threat-Signale
  festgelegt;
- PlanAssessment vor Executorwahl und aktuelle Route Heads mit ausschließlich
  semantischer Fortsetzung eingeführt;
- Viability, Portfolio-Rolle und Execution State getrennt; Identitäts- und
  Retention-Vertrag ergänzt;
- validierte Priority Claims, First-class `PlanNeed`, Root-/Leaf-Executor,
  typisierte Ressourcenclaims und Hard-/Soft-/Forecast-Reservierungen
  aufgenommen;
- „atomare Commitments“ durch geschützte, verzweigte und nach jeder
  StateVersion neu materialisierte Fortsetzungen mit Garantiegrad ersetzt;
- Entscheidungsfenster und PlanExecutionOrigin präzisiert;
- EndTurn nicht vorschnell nach dem Regel-PDF entschieden, sondern den
  belegten Konflikt zwischen primärem MVP-Konzept, Engine und Regelreferenz als
  blockierende normative Regelentscheidung dokumentiert;
- per-card-Pläne gegen den alten Einzelaktionswettbewerb abgegrenzt und von
  Kernentscheidung auf Admission-geprüfte Arbeitsannahme zurückgestuft;
- Corp-Virusresponse/Purge, alternative Terminalprojektion,
  Score-/Remote-/Defense-Ownership, engere Fallbacks und Proteus-Scope ergänzt;
- Capability-/Target-, Hidden-Info-Äquivalenz-, Future-Action-ID-,
  Supportprioritäts-, Ressourcen- und Fallback-Audit-Tests ergänzt.

### 0.2 – 2026-07-23

- Nutzerreview zu Portfolio, Handkartenplänen, Abwehr, Corp-Punish,
  Prioritätsklassen, Bindungsstärken und Deckstrategie eingearbeitet;
- alle relevanten Planinstanzen bleiben resident und werden nach jeder Aktion
  neu bewertet, während genau ein Executor handelt;
- nicht zugeordnete, sinnvoll entwickelbare Handkarten erzeugen eigene
  kartenbezogene Instanzen eines gemeinsamen Moduls;
- Runner-Abwehr und Corp-Punish starten jeweils als gemeinsames Modul mit
  interner Spezialisierung;
- Prioritätsklassen sind hart lexikografisch, Zahlen gelten nur innerhalb
  derselben Klasse;
- Planbindung in `locked_sequence`, `sticky_goal`, `flexible_support` und
  `recurring_cadence` getrennt;
- strategische Kampagnen an eigene Deckunterstützung und taktische Pläne an
  aktuelle Situationsbedingungen gebunden;
- planinterne Draw-, Search-, Funding- und Installations-Steps aus eigenen
  DeckCapabilities ausdrücklich zugelassen.

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
- operativen Entscheidungsalgorithmus und vollständigen Zugzyklus ergänzt;
- Planwechsel-, Unterbrechungs- und Rückkehrgründe festgelegt;
- Highlighter-R&D und Manhunt-Flatline als Akzeptanzszenarien aufgenommen;
- historische Override-, Follow-up-, Negativwert- und Coverage-Regressionen
  beschrieben;
- Diagnostik-, Test-, Metrik- und Cutover-Vertrag ergänzt;
- Pflege- und Architektur-Gate für spätere WIP-Iterationen festgelegt.
