# KI-Planebene – modulares Zielkonzept

Status: **Produktiver Kern umgesetzt; Work in Progress für Modulverfeinerung**
Dokumentversion: `1.2`
Stand: 2026-08-02
Verantwortlicher Architekturprozess:
`ai-plan-layer-target-concept-process-2026-07-23.md`

Umsetzungsstand:
Der gemeinsame TurnPlanner-, TurnPlanCommitment- und Kampagnenvertrag ist
für Corp und Runner produktiv umgesetzt und mit ZK00 bis ZK14 abgenommen.
Führende Evidence:
`docs/reviews/ai/ai-turn-and-campaign-planner-final-review-2026-07-30.md`.
Das Dokument bleibt WIP für spätere Modulverfeinerungen; der produktive
Cutover selbst ist kein offener Zielzustand mehr.

## 1. Zweck und Führungsanspruch

Dieses Dokument beschreibt den angestrebten Zielzustand der produktiven
NETGRID-KI-Planebene. Es führt die bislang verteilten Verträge für
Deckstrategie, Strategic Intent, kurzlebige Goal-/Threat-Signale, Tactical
Goals und Tactical Plans, produktive Planmodule und -instanzen,
PlanPortfolio, Ressourcenrouten, Follow-up-Budgets und LegalAction-Auswahl
zu einem gemeinsamen Modell zusammen. `TacticalGoal` und `TacticalPlan`
bezeichnen dabei ausschließlich die abgelöste Legacy-Runtime; im
produktiven Zielvertrag existiert kein persistentes oder autoritatives
`TacticalGoal`-Objekt mehr.

Die Leitentscheidung lautet:

> Nur Pläne handeln. Eine Action ist niemals ein unabhängiger
> Entscheidungskandidat, sondern ausschließlich der aktuelle Route Head eines
> konkreten Plan-Steps. Vor der Executorwahl melden alle relevanten
> Planinstanzen nichtautoritative, aktuell ausführbar belegte Planning Heads.
> Der Scheduler vergleicht daraus kohärente Restzuglinien, wählt genau eine
> Linie sowie ihren aktuellen Leaf-Executor und lässt ausschließlich den
> ersten Step durch dessen Modul erneut gegen aktuelle `LegalActions`
> materialisieren. Nur bei einem ausdrücklich zertifizierten planlokalen
> Nahgleichstand darf derselbe Step mehrere vollständig materialisierte Route
> Heads an die Engine geben; die Engine wählt und vollzieht daraus atomar
> genau einen.

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
- genau ein aktueller Route Head beziehungsweise die eng begrenzte
  Engine-Auswahl aus Same-Step-Nahgleichständen, niemals zukünftige
  Action-IDs;
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

### 2.2 Abgleich mit dem abgeschlossenen Runtime-Cutover

Version 0.9 war der fachliche Cutover-Vertrag; Version 1.2 ist der aktuelle
fortgeschriebene Zielvertrag. PF00 bis PF16 sind committed; PF15 wurde mit
Commit `4b0c459f6` und vollständig grünem Done-Gate abgeschlossen. PF16 wurde
mit Commit `ec18fcb8f` abgeschlossen, lokal nach `main` integriert und der
frühere Worktree
`C:\Projekte\NETGRID_AI_PLAN_FIRST_RUNTIME_CUTOVER` samt Arbeitsbranch
entfernt. Die nachfolgende First-Turn-/EndTurn-Regressionshärtung wurde bis
zum Integrationsstand `c64a14f8f` ebenfalls lokal nach `main` übernommen.

Für PF15 und PF16 erreicht und vollständig verifiziert sind insbesondere die
folgenden Punkte:

- Die produktive Live- und Simulationsentscheidung läuft ausschließlich
  Plan-first. Für jede freiwillige aktuelle LegalAction existiert entweder
  eine ausführbare Planroute oder genau eine konkrete Disposition als
  `explicitly_nonproductive` beziehungsweise `assessment_unknown`;
  unklassifizierte Actions bleiben ein Abdeckungsfehler. Unknown darf keine
  Routenausschöpfung und kein EndTurn beweisen, verhindert aber nicht die
  Ausführung einer unabhängig exakt gebundenen produktiven Route.
  Action-over-Plan- und andere kaschierende Fallbacks sind entfernt.
- Das residente PlanPortfolio bewertet alle relevanten Planinstanzen neu und
  wählt genau einen Leaf-Executor. Parent, Child, Priority Claim, Evidence,
  Assessment, Step und aktuelle Action-ID bleiben durchgängig gebunden.
- Der globale Plan `corp.defend_servers` ist die einzige
  serverübergreifende ICE-Allokationsautorität. Das frühere
  ICE-Platzierungsmodul liefert nur noch Facts. Score-Schutz wird
  Parent-first ausgewählt, erbt P1 bis P4 vom exakten Score-Parent und trennt
  nachgewiesenen Schutzeffekt, Finanzierung und Reserve.
- Installations-, aktuelle Rez- und Post-Install-Rez-Kosten stammen nur aus
  vollständigen, an `stateVersion`, Karteninstanz, Server und Action
  gebundenen Engine-Quotes. Gedruckte `rezCost`, Schutzlayer, numerische
  Scoreboni und die frühere produktive Zentralreserve sind keine
  Entscheidungsautorität mehr. `funding_only` erzeugt Economy-Support
  desselben Parents und niemals Targeted Draw.
- Die HQ-/R&D-Allokation konsumiert vollständige, Corp-bekannte
  Agendaanzahl/-punkte, wichtige trashbare Karten, serverspezifischen
  Multiaccess und Zugriffsfakten. Der einmalige belegte HQ-Hold-/Blufffall
  sowie ein echter Same-Step-Nahgleichstand werden explizit modelliert; nur
  der vollständig vorvalidierte Nahgleichstand wird atomar durch die Engine
  randomisiert und als `RandomDrawRecord` replaybar festgehalten.
- Runner-Run-, Access-, Jack-out-, Pump-, Break- und zusätzliche
  Zugriffsschritte benötigen exakte planlokale Assessments. Mehrstufige
  Engine-Runfolgen wie Pirate Broadcast, All-Nighter und Wilson bleiben an
  ihren `runner.convert_run_window`-Parent gebunden und werden nicht durch
  normale Cadence- oder isolierte Nutzenprüfungen überstimmt.
- Agenda-Install, Advance und Score sind Phasen derselben exakten
  `corp.score_agenda`-Instanz. Vollständige aktuelle Engine-Kosten werden
  dimensionsgenau gelesen; ein nur mit Klickkosten ausgewiesener Advance-
  Step kostet exakt null Credits und bleibt eine reguläre
  Planfortentwicklung.
- Loan from Chiba besitzt keinen globalen Sonderplan: Erwerb und
  Kartenentwicklung nutzen Economy-Support, während Halten, Verlassen und die
  Engine-gequotete End-of-turn-Zahlung ein instanzgenauer Child-Step von
  `runner.resource_lifecycle` sind.
- Goal-/Threat-Signale sind als kurzlebiger, side- und exakt
  `stateVersion`-gebundener Evidence-Vertrag formalisiert. Sie besitzen keine
  Step-, Capability- oder Action-Autorität und werden nicht persistent
  gespeichert. Stale/future Signale und Autoritätsfelder wie `actionIds`
  scheitern fail-closed. Die Live-Runtime erzeugt solche Signale derzeit für
  Runner-Remote-Contest, Runner-Survival, Terminal Wins und
  Corp-Scoreprojekte. Der
  Scheduler bindet sie ausschließlich an die exakte Kombination aus
  Planmodul, residentem `dedupeKey` und Ziel; ein Planmodul darf sich die
  Evidence nicht selbst geben.
- P1 bis P3 dürfen den aktuellen Strategic Intent nur mit belastbarer
  aktueller Evidence übergehen. P4/P5 benötigen Intent-Fit oder ein
  explizites aktuelles taktisches Signal. Ein Override mutiert den Intent
  nicht automatisch; normale Action- und Score-Schwankungen lösen keinen
  Wechsel aus. Intent-Wechsel erfolgen nur an belegten Revalidierungsgrenzen
  wie Phasenwechsel, neuer Information, Planabschluss oder
  Planinvalidierung. Produktiv wird gegenwärtig der öffentliche Abschluss
  der Setup-/Mulliganphase als exakter aktueller `phase_change`-Trigger
  erzeugt. Die übrigen typisierten Gründe sind im Intent-Vertrag
  fail-closed vorbereitet, benötigen aber jeweils noch einen eigenen
  produktiven, side-sicheren Evidence-Produzenten und werden nicht aus einer
  bloßen Planbewertung oder Action-Score-Schwankung abgeleitet.

Der PF15-Code-Freeze wurde durch alle Workspace-Typechecks, drei vollständige
AI-Shards, `207/207` Engine-Dateien mit `1.795/1.795` Tests, vollständige
Decision Checkpoints, Hidden-Info-Äquivalenz, Authority-, Replay-, EndTurn-
und Planabdeckungsverträge sowie statische Source-/Package-/Hint-/Doctrine-/
Proteus-/Economy-/Action-Capacity-Gates freigegeben. Die akzeptierte finale
Standard-Baseline umfasst `60` Spiele und `11.012` Entscheidungen ohne
IllegalAction, Runtime-, Replay-, Hidden-Info-, Fallback-, Timeout-,
Action-Limit- oder No-LegalAction-Fehler. Die `175` qualitativen Findings,
darunter drei HIGH-Corp-never-scores-Fälle und zwei
`gameEndReason=unknown`-Anomalien, bleiben sichtbare Review-Evidence, sind
aber kein kaschierter technischer Gatefehler.

Der PF16-Importgraph-Cleanup ist umgesetzt: Der öffentliche transitive
Livegraph enthält keine alten TacticalGoal-, SemanticChoice-,
PracticalMicro-, TacticalPlan-Memory- oder TacticalPlan-Override-
Abhängigkeiten mehr. Live und Simulation verwenden denselben
Plan-first-Einstieg. Historische TacticalGoal-/Semantic-Runtime-Verträge
bleiben nur als isolierte Test-/Evaluationsdiagnostik erhalten und werden
durch Authority-/Module-Boundarytests vom produktiven Graphen ausgeschlossen.

PF16-Implementierung, Final Review, Dokumentations-/Statusabgleich, Commit,
Main-Integration und Cleanup sind abgeschlossen. Der anschließende
Regressionsprozess ist im historischen Ausführungsartefakt
`ai-first-turn-end-turn-regression-process-2026-07-26.md` dokumentiert.

### 2.3 Post-Cutover-Regressionshärtung vom 26.07.2026

Der menschliche Playtest nach dem Cutover belegte keinen Bedarf an einer
neuen Action-over-Plan-Schicht, sondern mehrere zu enge beziehungsweise
falsch gebundene aktuelle Route-Head-Verträge. Der bis `c64a14f8f` nach
`main` integrierte Nachlauf präzisiert deshalb:

- Eine residente Planinstanz darf mehrzügig, hypothesenbasiert und in späteren
  Schritten offen sein. Vollständig exakt sein müssen nur der aktuelle Route
  Head, seine Legalität, Kosten, Ziele, Choices und seine unmittelbar
  behauptete Wirkung. Ein unbekannter aktueller Head löscht oder entwertet
  den Parent nicht.
- `productive`, `explicitly_nonproductive` und `assessment_unknown`
  klassifizieren ausschließlich aktuelle Actionpfade. Unknown blockiert den
  eigenen unbewiesenen Pfad, aber weder eine fremde exakt materialisierte
  Route noch die fortbestehende Planinstanz. Es beweist insbesondere niemals
  Routenausschöpfung oder EndTurn.
- Ein Standard-EndTurn bleibt bei normaler verbleibender Klickkapazität hart
  gesperrt. Die vollständige Disposition anderer Actions kann diese Sperre
  nicht aufheben.
- Jede ICE-Installation bleibt Eigentum von `corp.defend_servers`, auch wenn
  Handüberlauf vorliegt. Handmanagement darf eine ICE-Server-Auswahl nicht als
  eigene Overflow-Konversion beanspruchen.
- Fehlende aktuelle Rez-Finanzierung macht eine ICE-Installation nicht
  automatisch unproduktiv. Ein vollständiger Engine-Quote mit
  Post-Install-Funding-Gap erzeugt Economy-Support des exakten
  Defense-Parents; dessen Priority-Band bleibt für die Parent-first-Auswahl
  maßgeblich.
- Mehrere aktuelle Engine-Rezvarianten für dasselbe ICE, etwa reguläres
  Rezzen und eine Olivia-artige Discount-Action, bleiben getrennte exakte
  Routen. Sie dürfen weder über die Karteninstanz zusammengeführt noch aus
  gedruckten `rezCost` rekonstruiert werden.
- Engine-Choices hinter einer bereits gewählten Action sind keine neuen
  strategischen Pläne. Der Employee-Empowerment-Resolver bindet Agendaquelle,
  StateVersion, `resolve_choice`-Action und `draw`/`skip` vollständig; er
  zieht bei mindestens zwei sichtbaren R&D-Karten und überspringt sonst.

Der integrierte Nachlauf ist mit vollständigem AI-Typecheck, `4.152/4.152`
AI-Tests, fokussierten Integrationsläufen und einer akzeptierten
60-Spiele-Baseline mit `13.309` Entscheidungen ohne harte Fehler belegt.
Diese technische Evidence ersetzt nicht den menschlichen Playtest; sie macht
den integrierten Stand wieder zu einem bewusst prüfbaren Inkrement.

### 2.4 Konsolidierung aus Spielanalysen und Remediation bis 02.08.2026

Die nachfolgenden vollständigen Spielaudits bestätigen den gemeinsamen
Kernel, präzisieren aber mehrere Modul- und Linienverträge. Sie rechtfertigen
keine neue Auswahlschicht:

- **Kompositionsabhängige Doctrine:** Deckstrategie darf nicht aus einem
  einzelnen Anker, Beschleuniger oder Payoff entstehen. Eine primäre Linie
  verlangt die gemeinsam ausführbaren Rollen ihrer Komposition. Doctrine
  liefert strategische Evidence; die konkrete Karten- oder Lifecycle-Sequenz
  bleibt im zuständigen Planmodul.
- **Planowner statt Resolver-Shortcut:** Kartenfähigkeiten werden über aktive
  Hints, actiongebundene Funktionseffekte, TargetProfiles und Engine-Quotes
  generisch erkannt. Ein Choice-Resolver darf ausschließlich die Payload des
  bereits ausgewählten Steps vervollständigen. Benötigt die Choice eine
  Server-, Ziel-, Quellen- oder Ressourcenentscheidung, muss diese vorher im
  Plan getroffen und durch `PlanExecutionOrigin` gebunden sein.
- **Known und Unknown getrennt aggregieren:** Ein unbekannter Geschwisterpfad
  darf eine unabhängig exakt belegte Schutz- oder Rezroute nicht löschen.
  Der unbekannte Pfad selbst bleibt fail-closed und darf weder Wirkung noch
  Routenausschöpfung behaupten.
- **Draw braucht einen materialisierbaren Horizont:** Ein Defense- oder
  Scorematerial-Draw ist nur produktiv, wenn die gewonnenen Informationen
  beziehungsweise Karten vor der relevanten Deadline noch durch einen
  konkreten Step nutzbar werden können. Ein letzter-Klick-Draw vor dem
  Runnerzug darf keinen nicht mehr ausführbaren Schutz vortäuschen.
- **Globale ICE-Opportunitätskosten:** Unrezzte zweite und dritte Schichten
  dürfen Staffelung, Bluff, Handentlastung oder vorbereitete Investition sein.
  Sie werden jedoch gegen andere Server, bereits unrealisierte ICE-Schichten,
  aktuelle Rezfinanzierung, Runner-Rig, Schutzwirkung und Scorefortschritt
  verglichen. Es gibt weder ein hartes Layer-Limit noch einen blinden
  Schichtbonus.
- **Score-/Defense-Kohärenz:** `corp.score_agenda` besitzt Agenda,
  Zielremote, Install/Advance/Score und Rush-Risiko. `corp.defend_servers`
  besitzt jede ICE-Installation, globale Serverallokation und Rezroute. Ein
  Scoreprojekt kann einen typisierten Schutzbedarf delegieren; der
  Defense-Child darf weder Agenda noch Scoreentscheidung übernehmen.
- **Rush als vollständige Linie:** Reiner Rush, kombinierter Rush und sicherer
  Aufbau vergleichen Agenda-/Matchpointwert, Klick- und Creditdauer,
  sichtbare Runnerressourcen, vorhandene Remoteinvestition, Zentralpflichten
  und bis zur Deadline finanzierbare Schutzwirkung. Eine akute Zentrale
  blockiert Rush nicht pauschal, wohl aber eine konkrete unfinanzierbare
  P1-/P2-Pflicht.
- **Geschwisterdrift vermeiden:** Eine resident ausgewählte und ausführbare
  Score-/Defense-Route darf nicht durch ein technisch nahes, aber aktuell
  unmaterialisierbares Geschwisterprojekt ersetzt werden. Technische IDs
  bleiben nur stabiler letzter Tiebreak.
- **Deterministische Instanzwahl:** Semantisch gleichwertige Kartenkopien
  werden zustandsgebunden stabil gewählt. Zufall bleibt auf zertifizierte
  planlokale Nahgleichstände oder die ausdrücklich erlaubte Rush-Neigung
  begrenzt und wird atomar durch die Engine aufgezeichnet.
- **Betreiberdiagnostik:** Die private Buganzeige zeigt bewusst die
  vollständige Hand der aktiven KI und ihre gesamte Zugplanung. Sie zeigt
  nicht die Menschenhand und erweitert keinen normalen side-sicheren Datenweg.

Führende Evidence sind
`docs/reviews/ai/ai-generic-capability-migration-final-review-2026-08-01.md`,
`docs/reviews/ai/series-82b2-remediation-final-review-2026-08-01.md` und
`docs/reviews/ai/ai-match-978d-remediation-final-review-2026-08-01.md`.

## 3. Ausgangsproblem

Die vor dem Cutover produktive Runtime besaß parallel:

- Deckstrategie und Strategic Intent;
- persistente Tactical Goals und Tactical Plans;
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

Nur tatsächlich automatische, durch die Engine auf genau eine Auflösung
verengte Fenster dürfen durch einen gemeinsamen `window_resolution`-
Mechanismus abgewickelt werden. Freiwillige Run-Fortsetzungen, Jack-out,
Breaker-Pump, Subroutine-Break und Access-Auflösungen gehören dagegen zum
auslösenden Run-/Access-Plan und benötigen eine explizite planlokale
Assessment. Sie bilden keinen konkurrierenden strategischen Plan und keine
automatische Sonderlane.

Ein Run mit unbekanntem verbleibendem ICE bindet die beim Start akzeptierte
side-sichere Risiko- und Reservequote an seine Root-Planinstanz. Das gebundene
`runner.convert_run_window`-Leaf quotiert denselben Vertrag an jedem
Jack-out-Fenster mit dem verbleibenden ICE, aktuellem Credit- und Handpuffer
sowie dem aktuell sichtbaren Corp-Rez-Potenzial neu. Erst eine materielle
Verschlechterung gegenüber dem akzeptierten Startvertrag begründet eine
Jack-out-Präferenz; ein unveränderter Grenzfall erzeugt weder einen neuen Plan
noch eine zweite Entscheidungsautorität.

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

## 7. Gesamtarchitektur

```text
eigene Kartensemantik und Deckfähigkeiten
                    |
            Deckstrategieprofil
                    |
              Strategic Intent
                    |\
                    | \  aktuelles side-sicheres Weltmodell
                    |  \             |
                    |   kurzlebige Goal-/Threat-Signale
                    |              /
                    |             /
        side-spezifische Planerkennung
                    |
      persistentes Runner-/Corp-Portfolio
                    |
      leichtgewichtige PlanAssessments
                    |
  nichtautoritative Planning Heads aller relevanten Pläne
                    |
 side-sichere, mehrphasige Restzuglinien + Kampagnenquotes
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
  randomDrawRecord?: RandomDrawRecord;
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

Der Vertrag ist die stabile Außenschnittstelle, nicht die Grenze fachlicher
Intelligenz. Ein Planmodul darf intern beliebig viele spezialisierte
Unterfunktionen für Deckstrategie, Opportunity-Erkennung, Komponentenbestand,
Routenbildung, Engine-Quotes, Risiko, Finanzierung und Continuation verwenden
und schrittweise verbessern. Diese Details bleiben modulowned. Der Scheduler
sieht ausschließlich Proposal, persistente Instanz, Assessment, Needs, Step,
Planning Head, Projektion, Route und Outcome. Neue fachliche Bedingungen
dürfen daher kein
kartenspezifisches Scheduler-Sonderrecht und keinen zweiten globalen
Actionscore erzeugen.

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
  horizonCapability:
    | "current_turn_only"
    | "campaign_capable"
    | "context_dependent";

  discover(context): PlanProposal[];
  instantiate(proposal, context): PlanInstance;
  reconcile(instance, context): PlanReconciliation;
  assessPlan(instance, context): PlanAssessment;
  enumerateCurrentPlanningHeads(
    instance,
    assessment,
    semanticActions,
    context,
  ): TurnPlanningHeadCandidate[];
  projectSemanticContinuations(
    instance,
    frame,
    rootBinding,
    context,
  ): ProjectedTurnStepOption[];
  proposeStep(instance, context): PlanStepProposal;
  materializeRoutes(instance, step, semanticActions, context): PlanRoute[];
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

### 9.4.1 Planning Heads und Zukunftsprojektion

`enumerateCurrentPlanningHeads` erzeugt vor der Executorwahl konkrete
aktuelle Varianten mit getrenntem `CurrentLegalActionBinding` und
ausführbarem Witness. Diese Heads besitzen keine Ausführungsautorität.
`projectSemanticContinuations` beschreibt ausschließlich planmodul-eigene
zukünftige Semantik und enthält keine zukünftige `actionId`.

Zukünftige Rootphasen dürfen in V1 nur residente Planinstanzen oder bereits
admission-geprüfte Child-/Supportbeziehungen referenzieren. Eine erst durch
die Projektion entstehende Planinstanz beendet den Ast mit
`projected_plan_discovery_required`; der reale erreichte Zustand durchläuft
anschließend normale Discovery und Restzug-Neuplanung.

### 9.5 `materializeRoutes`

Übersetzt den nach der Linienwahl gewählten ersten Step erneut und
autoritativ aus verbindlichen
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

### 9.5.1 Certainty-Grenze zwischen Plan und aktuellem Step

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
Planabschluss oder Planinvalidierung, nie aus normalen
Action-Score-Schwankungen. Ein validierter hochklassiger Claim kann mit
belastbarer Evidence den bestehenden Intent übergehen oder Evidence für
einen dieser vier Revalidierungsgründe liefern, ist aber kein fünfter
Intent-Wechselgrund.

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

### Phase 7 – Planning Heads aller relevanten Pläne enumerieren

Jede viable Instanz meldet ihre aktuellen, aus `LegalActions` belegten
Varianten als nichtautoritative Planning Heads. P1–P3 werden als konkrete
Pflichtobjekte mit Deadline validiert. Ein aktuelles `PlanCommitment` bildet
einen harten Prefix.

### Phase 8 – Restzuglinien projizieren und vergleichen

Der Scheduler kombiniert fachlokale Projektionen zu geordneten
Ein-Root-Phasen bis Zugende, Informationsgrenze,
`projection_not_supported` oder `projected_plan_discovery_required`.
Kampagnenwerte sind prefixgebundene inkrementelle Claims. Spätere
Phasenroots müssen resident oder admission-geprüft sein.

### Phase 9 – Linie, Root-Foreground und Leaf-Executor wählen

Die beste zulässige vollständige Linie bestimmt die Phasenfolge und den
aktuellen Leaf-Executor. Der bisherige Vordergrund und gültige Commitments
wirken über die festgelegte Hierarchie, dürfen aber keine verletzte Pflicht
oder materiell bessere zulässige Linie verdecken.

### Phase 10 – gewählten ersten Step autoritativ rematerialisieren

Nur das zuständige Modul des gewählten Executors übersetzt dessen ersten
Planning Head erneut aus den unveränderten aktuellen
`ActionSemanticCandidates` und `LegalActions`. Invocation, Witness, Quote,
Targets und routendefinierende Choices müssen exakt übereinstimmen.
Abweichung ist ein fail-closed Bindungsfehler.

Im Normalfall wird genau die rematerialisierte Route gewählt. Nur der
zertifizierte Nahgleichstandsvertrag aus Abschnitt 33.2 darf stattdessen eine
kanonische Same-Step-Routenmenge bis zur atomaren Engine-Auswahl offenhalten.
Globale Safety-Gates dürfen Aktionen ausschließen, aber keine planfremde
Aktion als Gewinner einsetzen.

### Phase 11 – Aktion anwenden lassen

`applyAction` bleibt alleinige Regelautorität und revalidiert den
vollständigen Action-Vertrag. Bei einem zertifizierten Nahgleichstand
revalidiert der entsprechende atomare Engine-Einstiegspunkt zunächst alle
vollständigen Invocations, verbraucht erst danach genau einen Selection-Draw
und führt die ausgewählte Invocation durch denselben Regelpfad aus.

### Phase 12 – Ergebnis zurückführen

Nach der neuen StateVersion werden Receipt und TurnPlan-Cursor revalidiert.
Bei erwartetem Fortschritt wird ohne freie Challenger-Suche zum nächsten Node
oder zur gebundenen Phase fortgeschritten; an einer echten Boundary wird der
Restzug neu geplant. Das Modul bewertet:

- erwartete und tatsächliche Zustandsänderung;
- Planfortschritt;
- neue Blocker;
- geschützte Fortsetzung;
- Phasenwechsel oder Abschluss.

## 14. Planpriorisierung

### 14.1 Lexikografische Prioritätsklassen

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

Ein generischer kurzfristiger Plan benötigt keinen langfristigen
Strategieanker, aber immer einen positiv definierten, endlichen fachlichen
Zweck. Er darf nicht deshalb entstehen, weil Planabdeckung, Mapping oder
Bewertung einer anderen Action fehlt.

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
P6-Route.

„Credit ist immer nützlich“, ein allgemeiner Überschuss oder fehlende
Attraktivität anderer Actions genügt außerhalb dieses eng typisierten
Zugkapazitätsplans weiterhin nicht als Planfortschritt.

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

#### 18.1.1 Exakte Bindung der aktuellen Action-Variante

Ein ausführbarer Plan-Step besitzt pro StateVersion im Normalfall einen exakt
gebundenen Route Head. Die einzige Ausnahme vor der Engine-Anwendung ist eine
nach Abschnitt 33.2 zertifizierte, kanonische Nahgleichstandsmenge aus
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

#### 18.1.2 Numerischer Fail-closed-Vertrag

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
- Basic Credit innerhalb des pro Zug fixierten befristeten
  P6-Übergangsziels:
  Fortschritt;
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
Alternative. In der produktiven Plan-first-Runtime wird der freiwillige
Zugabschluss dennoch durch ein enges Systemplanmodul
`runner.complete_turn` beziehungsweise `corp.complete_turn` attribuiert.
Damit bleibt die Invariante „keine freiwillige Hauptaktion ohne Plan, Phase
und Step“ auch für den Zugabschluss erhalten.

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
LegalActions darf diese Kapazität als verbraucht umdeuten.

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

Wenn der normative Regelvertrag bestätigt, dass ein Zug nicht freiwillig
beendet werden darf, gehört die endgültige Lösung in
Engine/LegalAction-Generierung. Dann darf `end_turn` bei verbleibender
nutzbarer Kapazität überhaupt keine LegalAction sein.

Bestätigt der Regelvertrag stattdessen das NETGRID-Hybridmodell, muss die
Engine exakt definieren, in welchen Zuständen freiwilliges EndTurn legal ist.
Der Planner darf diese Legalität nicht selbst erfinden.

## 21. Endliche Grund- und Supportpläne – kein Fehler-Fallback

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
18. Basic Credit verkleinert ausschließlich einen exakten
    Parent-Fundingbedarf oder verfolgt ein eigenständig admission-geprüftes
    Economy-Ziel mit endlichem Zielwert. Der befristete P6-Übergangsvertrag
    darf ausschließlich die aktuelle Basic-Credit-Action innerhalb seines
    fixierten Zugziels binden und weder fehlende Planabdeckung noch unbekannte
    Assessments kaschieren. Im Zielzustand entfällt auch diese Ausnahme. Draw
    besitzt nie eine neutrale Route.
19. Run-, Access-, Jack-out-, Pump- und Break-Actions benötigen explizit
    positive planlokale Assessments; ein fehlender Eintrag bedeutet
    `Default-Deny`.
20. Choice-Payload-Auflösung erfolgt nach der Actionwahl und kann weder
    `actionId` noch Executor oder Planpriorität ändern.

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
- **Kernentscheidung:** P1 bis P3 werden als validierte lexikografische
  Pflichten behandelt. Innerhalb zulässiger Linien werden P4 bis P6 über das
  versionierte, begrenzte Bewertungsregister für terminalen Ausgang,
  Agendafortschritt, Defense, Economy, Handqualität, Flexibilität,
  Kontinuität und Risiko verglichen. Äquivalenz, Dominanz und technische
  Tiebreaks bleiben davon getrennt.
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

## 25. Historisches TacticalPlan-Inventar vor dem Cutover

Der vor dem Cutover produktive Typvertrag enthielt 20 TacticalPlan-Typen.
Diese Liste bleibt historische Migrations-Evidence und beschreibt weder den
aktuellen produktiven Livegraphen noch Basisklassen des neuen Kernels.

### 25.1 Runner: damalige Typen

| Damals produktiver Typ             | Damaliger Zweck                         | Zielrichtung                                                                 |
| ---------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| `runner.obtain_breaker_coverage`   | fehlende ICE-Coverage beschaffen        | in `runner.rig_and_coverage` weiterführen                                    |
| `runner.contest_remote`            | aktuelles Remote prüfen oder angreifen  | als eigenes Zielmodul weiterführen                                           |
| `runner.opportunistic_central_run` | kurzfristige HQ-/R&D-Probe              | durch dauerfähiges `runner.pressure_central` ablösen                         |
| `runner.clear_tags_or_survive`     | Tags oder akute Gefahr beseitigen       | in `runner.defense_and_recovery` zusammenführen                              |
| `runner.convert_success_window`    | aktuelles Successful-Run-Fenster nutzen | als reaktiven Kindplan weiterführen                                          |
| `runner.survival_defense`          | Damage-/Flatline-Risiko behandeln       | in `runner.defense_and_recovery` zusammenführen                              |
| `runner.restore_hand_buffer`       | Handpuffer wiederherstellen             | Step/Fachbereich von `runner.defense_and_recovery`                           |
| `runner.develop_hand_card`         | bestimmte Handkarte spielbar machen     | in `runner.develop_board_and_hand` überführen                                |
| `runner.play_best_hand_card`       | generischer Handkarten-Fallback         | nicht unverändert behalten; zweckgebunden in `runner.develop_board_and_hand` |
| `runner.build_credit_base`         | konkreten Funding-Gap schließen         | Modus von `runner.economy`                                                   |
| `runner.build_credit_bank`         | wiederkehrende Bank laden               | Recurring-Instanz von `runner.economy`                                       |
| `runner.cash_out_credit_bank`      | Bank für Bedarf auszahlen               | gebundener Kindplan von `runner.economy`                                     |

### 25.2 Corp: damalige Typen

| Damals produktiver Typ             | Damaliger Zweck                           | Zielrichtung                                                 |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `corp.create_score_window`         | konkrete Agenda-Scorefolge herstellen     | in `corp.score_agenda` weiterführen                          |
| `corp.develop_finite_economy`      | begrenzte Economy installieren und nutzen | Modus von `corp.economy`                                     |
| `corp.activate_persistent_economy` | dauerhafte Economy aktivieren             | Modus von `corp.economy`                                     |
| `corp.build_credit_bank`           | Corp-Bank aufbauen                        | Recurring-Instanz von `corp.economy`                         |
| `corp.fund_strategy_reserve`       | exakten endlichen Parent-Need finanzieren | Supportmodus von `corp.economy`; keine eigene Zentralreserve |
| `corp.establish_scoring_remote`    | strategisches Zielremote aufbauen         | als eigenes Development-Projekt weiterführen                 |
| `corp.rez_defense`                 | aktuelles Rez-Fenster beantworten         | Urgent Response von `corp.defend_servers`                    |
| `corp.apply_punish_pressure`       | Tag-/Damage-/Punish-Fenster nutzen        | in Kampagne und geschützte Ausführung trennen                |

### 25.3 Historische strukturelle Bewertung

Das Inventar besaß wichtige Bausteine, aber noch keine vollständige Welt, in
der alle freiwilligen Aktionen zuverlässig aus Plänen entstanden.

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
- der damalige aktuelle Plan konnte im Live-Auswahlweg diagnostisch bleiben,
  während globale Action-Arbitration eine andere Aktion auswählte.

## 26. Zielstruktur der Planregistries

### 26.1 Gemeinsamer Registry-Vertrag

Der Kernel kennt zwei Registries:

```ts
RunnerPlanModuleRegistry;
CorpPlanModuleRegistry;
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
  nicht durch einen generischen Grund- oder Supportplan kaschiert.

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
build_finite_reserve
develop_economy_engine
load_bank
cash_out_bank
maintain_run_budget
```

Das Modul unterscheidet:

- konkreten Finanzierungsbedarf eines Parentplans;
- allgemeine Sicherheits- oder Runreserve;
- eigenständige langfristige Economy-Engine;
- Bankaufbau mit Cadence;
- Auszahlung zu einem konkreten Konversionszweck;
- Basic Credit als endliche Reserve-, Parent-Funding- oder eng typisierte
  befristete P6-Zugkapazitätsroute während des Übergangs.

Die Schwelle „genug Geld“ ist kontextabhängig. Sie berücksichtigt:

- nächste Planroute;
- Survival- und Trace-Reserve;
- erwartete Run- und Breakkosten;
- mögliche alternative Kartenentwicklung;
- Deckphase und Bankkonversion.

Mehr Geld wird bei vorhandener Reserve nicht automatisch wertlos. Es verliert
aber gegenüber konkret ausführbaren strategischen Plänen an Priorität.

Run-Funding entsteht nur aus einer echten, berechneten Lücke des gebundenen
Runplans. Der Bedarf ist das Maximum aus dem noch offenen Route-Gap und der
Unterschreitung des nach dem Run zu schützenden Credit-Floors; ein künstliches
Mindest-Gap ist unzulässig. Ist das Ziel bereits direkt positiv konvertierbar,
entsteht kein Funding-Step. Existiert ein anderes direkt ausführbares,
positiv bewertetes Runziel, gibt ein nicht dringlicher Funding-Step diesem
Run den Vorrang. Nur eine belegte akute Score-Bedrohung darf diese
Alternativsperre überstimmen.

Eine direkt konvertierbare Geschwisterroute auf demselben Server blockiert
Funding auch bei akuter Score-Bedrohung: Finanziert wird nicht die teurere
Variante, wenn dieselbe Serverkonversion bereits exakt ausführbar ist. Der
akute Floor-Override gilt nur für die konkrete Terminalroute. Er erlaubt
eine positive, direkt ausführbare Route mit nichtnegativem Restguthaben unter
dem normalen Credit-Floor, beseitigt aber weder ein reales Route-Gap noch
negative Credits nach dem Run. Diese Fälle bleiben echte Fundingbedarfe.

Ein Bank-Cashout wie Broker ist ebenfalls kein allgemein positiver
Economy-Step. Er wird an eine konkrete, planfähige Kartenentwicklung mit
echtem Credit-Gap gebunden und muss dieses Gap mit verbleibendem
Same-Turn-Konversionsfenster vollständig schließen. Nach Cashout und
Entwicklung muss der erforderliche Handpuffer erhalten bleiben. Eine
Unterschreitung ist nur mit einem expliziten, an dieselbe Zielkarteninstanz
gebundenen akuten Survival- oder Coverage-Nachweis zulässig. Fehlt eine
solche konvertierbare Zielroute, bleibt der Cashout nicht produktiv; die
Runtime darf ihn nicht mit allgemeinem „später nützlich“-Wert rechtfertigen.

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

- freiwillige Run-Fortsetzung und Jack-out;
- Breaker-Pump und Subroutine-Break im aktuellen Encounter;
- Successful-Run-Trigger;
- Access-Modifikationen;
- Multiaccess-Aktivierungen;
- Credit-, Trash- oder Folge-Run-Payoffs;
- Ziel- und Choice-Auflösung innerhalb des begonnenen Runplans.

Das Modul besitzt kein unabhängiges langfristiges Ziel. Es gehört logisch zum
auslösenden Run-/Contest-Plan und kehrt anschließend dorthin zurück.

Jede aktuell legale Run-/Access-/Jack-out-/Pump-/Break-Action erhält eine
planlokale `RunnerRunWindowActionAssessment`. Nur
`admissible === true` darf materialisiert werden. Eine fehlende Assessment
ist kein implizites Allow, sondern `Default-Deny`. Access-Fenster können auch
ohne noch vorhandenen `playerView.run`-Snapshot planbezogen aufgelöst werden,
wenn LegalAction, Fenstersemantik und auslösender Planursprung vollständig
gebunden sind.

### 27.9 Kein Runner-Fallbackplan

Der Runner-Scheduler erzeugt keinen „do something“-Plan. Economy,
Handpuffer oder anderer generischer Support handeln nur mit eigener positiver
Admission, endlichem Ziel und Abschlussbedingung. Ein Probe-Run benötigt
einen ausführbaren Pressure-/Informationsplan mit Target, Risiko und
erwarteter Konversion. Fehlt eine solche Planroute, wird die Lücke sichtbar
fail-closed behandelt.

## 28. Corp-Zielmodule

### 28.1 `corp.opening_and_board_foundation`

**Klasse:** `bounded_sequence`
**Rolle:** Opening-/Setup-Vordergrund
**Status:** Arbeitsannahme, bislang kein entsprechender TacticalPlan-Typ

Verantwortung:

- erste Zentralserver-Schutzbedarfe als typisierte Needs an
  `corp.defend_servers`;
- deckstrategisch erforderliches Remote oder Economy-Fundament;
- Rezreserve als Funding-Support für den exakten Defense-Need;
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

Installieren, Advancen und Scoren sind Phasen derselben exakten
`corp.score_agenda`-Instanz. Eine aktuell legale Advance-Action ist deshalb
kein unbekannter Score-Schutz und kein unabhängiger Entwicklungskandidat,
sondern die Fortentwicklung des gebundenen Agenda-Parents. Sie behält dessen
exakte Planinstanz, Agenda-Instanz, Ziel, aktuell revalidierte
Prioritätsklasse P1 bis P4 und Evidence. Ein von ihr angeforderter Defense-
oder Economy-Support bindet seinerseits exakt diese Score-Planinstanz als
`parentInstanceId`.

Die Kosten des aktuellen Advance-Steps stammen aus der konkreten
Engine-LegalAction beziehungsweise einem exakt an StateVersion,
Agenda-Instanz und Action gebundenen Engine-Quote. Die vollständigen
Restkosten bis zum Scoren stammen aus einer Engine-zertifizierten
Advancement-/Score-Projektion. Gedruckte Standardkosten,
Kartendefinitions-Fallbacks oder aus dem Kartentext rekonstruierte Summen sind
nicht autoritativ.

Fehlt ausnahmsweise der Quote für den aktuellen LegalAction-Step, ist dies
eine sichtbare Engine-/Projektionslücke und blockiert genau diesen Step
fail-closed; der Score-Parent bleibt resident. Fehlt nur eine belastbare Quote
für spätere, noch nicht materialisierte Steps, darf der Plan weder
Same-Turn-Ausführbarkeit noch ein geschütztes vollständiges Commitment
behaupten. Ein aktuell vollständig gequoteter Advance-Step bleibt aber eine
reguläre Fortentwicklung des Score-Plans, sofern sein eigener Planfortschritt
und Ressourcenvertrag positiv sind. Die unvollständige Zukunftsprojektion
darf ihn nicht als „unbekannten, nicht ausführbaren Score-Schutz“
umklassifizieren.

Ist ein Advance-Step bereits fälschlich `executable_now`, aber nicht exakt
materialisierbar, gilt der harte Vertragsfehler aus Abschnitt 33.1. Ist der
Parent dagegen schon in Discovery oder Assessment sauber als blockiert
klassifiziert, darf ein anderer regulär ausführbarer Plan entscheiden. Das
ist normale Planwahl und kein Action-Fallback.

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

`fund_rez_reserve` veröffentlicht beziehungsweise finanziert hier einen
typisierten Defense-Need des exakten Remote-Parents. Der Remote-Plan berechnet
keine ICE-Kosten selbst und besitzt keine parallele Zentralreserve.

Fortschritt wird über effektiven Schutz und Nutzbarkeit gemessen, nicht über
ICE-Anzahl allein.

Ein vorbereitetes Zielremote bleibt über Economy-, Draw-, Punish- und
Central-Responses erhalten. Fast-Advance-Decks erhalten nicht automatisch
dieses dauerhafte Projekt.

### 28.4 `corp.defend_servers`

**Klasse:** `development_project` mit internem Urgent-Response-Modus
**Rolle:** Background/Vordergrund/Urgent Response
**Status:** erweitert `corp.rez_defense`

`corp.defend_servers` ist genau ein globaler Verteidigungsplan im
Corp-Portfolio. HQ, R&D, Archives und Remotes erzeugen keine konkurrierenden
Root-Pläne. Sie liefern eine interne, nach jeder Aktion neu berechnete
Bedarfsliste. Der Plan entscheidet aus dieser Liste gemeinsam:

- welcher Server als Nächstes Schutz benötigt;
- welches verfügbare ICE für welchen Server den höchsten Grenznutzen hat;
- ob Installation, Finanzierung, Ziehen nach Schutz oder Rezzen der nächste
  Step ist;
- welche Schutzlücke bewusst vorerst offenbleibt;
- wie ICE, Credits und Klicks über mehrere Server verteilt werden.

Damit wird nicht zuerst ein Serverplan ausgewählt und danach das beste ICE
gesucht. Der fachliche Auswahlgegenstand ist das Paar aus
`Schutzressource × Zielserver` innerhalb desselben Plans. Nach jeder
Installation oder Zustandsänderung wird das gesamte Serverportfolio neu
bewertet.

Das frühere ICE-Platzierungsmodul ist im Zielzustand ausschließlich ein
Sensor-/Facts-Modul. Es ist keine Entscheidungsinstanz und besitzt keine
Installations-Ownership. Es darf nur fachliche Facts für konkrete Paare
`ICE × Server` liefern, etwa Regelzulässigkeit, Subtypen, Rig-Eignung,
serverspezifische Synergien und positionsabhängige Fit-Beiträge. Kosten sind
nur dann Facts, wenn sie als Engine-zertifizierte, an StateVersion,
Karteninstanz, Zielserver und konkrete LegalAction gebundene Quotes
vorliegen. Das Modul liefert keine `recommendation`, kein `veto`, kein
`hold`, keine eigene Platzierungs-`policy` und keinen numerischen
Entscheidungsbonus. Die globale Auswahl, das bewusste Zurückhalten und die
Opportunitätskostenentscheidung liegen ausschließlich bei
`corp.defend_servers`.

Tote oder nur aus einer bestimmten Position abgeleitete ICE-Werte sind
weiche Fit-Werte. Sie dürfen ein Paar weder allein empfehlen noch
ausschließen und keine Allokationsentscheidung vorwegnehmen. Harte
Ausschlüsse stammen ausschließlich aus Engine-Legalität oder vollständig
belegten Planverträgen. Fehlende Fachfacts bleiben sichtbar; sie werden nicht
durch pauschale Empfehlungen oder Vetos ersetzt.

Die Bewertung darf dabei nicht bei einem isoliert besten Sofortpaar stehen
bleiben. Der Plan betrachtet eine Zielallokation über den gesamten sichtbaren
ICE-Bestand: bereits installiertes ICE, ICE auf HQ, bezahlbare Rez-Kosten,
Installationskosten und die Option, ein ICE bewusst zurückzuhalten. Dadurch
wird auch die Opportunitätskostenfrage sichtbar: Ein universell gutes ICE
darf nicht auf einem wenig wichtigen Server verbraucht werden, wenn nur dieses
ICE eine kritische Lücke an einem anderen Server schließen kann. Aus der
besten erreichbaren Zielallokation wird anschließend genau der nächste
ausführbare Delta-Step materialisiert; danach erfolgt eine Neubewertung.
Auch der Plan selbst wird mit dem Wert dieser globalen Zielallokation
bewertet, nicht mit dem höchsten isolierten Serverbedarf. Sonst könnte die
korrekt berechnete Verteilung im Scheduler gegen einen schwächeren Draw- oder
Economy-Plan verlieren, obwohl ihr gemeinsamer Schutzgewinn höher ist.

Die Materialisierung bindet dabei genau eine ICE-Instanz an genau einen
Zielserver. Alle anderen aktuell legalen ICE-Server-Kombinationen, die nicht
Teil eines eigenen weiterhin echten Defense-Steps sind, werden vom globalen
`corp.defend_servers`-Modul mit ihrem konkreten Allokationsgrund
dispositioniert. Weder „ICE-Installation“ als Actionfamilie noch eine
allgemeine Defense-Rolle deckt diese Geschwistervarianten ab.
Auch ein HQ-Overflow macht Handmanagement nicht zum ICE-Owner:
`corp.hand_and_agenda_management` darf ICE weder als Discard-Konversion
installieren noch die Serverwahl treffen. Es meldet nur den Overflow-Bedarf;
jede ICE-Installation bleibt eine Route von `corp.defend_servers`.

Ziehen nach ICE ist damit kein allgemeiner Handkarten-Fallback. Der Plan
unterscheidet mindestens drei Zustände: eine ausführbare produktive
ICE-Route, eine echte Effektlücke und eine reine Finanzierungslücke. Nur die
belegte Effektlücke darf den zielgerichteten Step `draw_for_ice`
materialisieren. Liegt bereits ein ICE oder eine Installation vor, die den
geforderten Schutzeffekt nach Rezzen erreichen würde, aber den exakten
Funding-/Reservevertrag verfehlt, ist das `funding_only`: Der Parent fordert
Economy-Support an; weiterer gezielter Draw ist unzulässig. Unbekannte oder
unvollständige Quotes werden nicht als Effektlücke umgedeutet.

Ein typisierter Schutzbedarf eines Score- oder Remoteplans erzeugt eine
explizite Parent-Kind-Delegation. Nur die konkret gebundene
Defense-Supportroute erbt `parentInstanceId` und Prioritätsklasse des
Parents. Der allgemeine Defense-Plan und seine übrigen Serverbedarfe werden
nicht pauschal hochgestuft. Die vererbte Klasse gilt nur, wenn mindestens
eine aktuell sichtbare ICE-Server-Kombination den Bedarf nach dem
Effekt-/Funding-Vertrag tatsächlich erfüllt oder messbar in Richtung des
Schutzziels fortschreibt. Ein unbrauchbares ICE für ein leeres Zielremote
darf nicht unter dem Etikett „Score-Support“ eine sachfremde HQ-Installation
priorisieren. Nicht erfüllbarer Support bleibt als Blocker des Parents
sichtbar; andere Serverbedarfe behalten ihre eigene Dringlichkeit. Auswahl,
Evidence und Assessment müssen aus derselben ausgewählten Prioritätsklasse
und Parentbindung stammen; ein planfremder Action-Score darf diese Delegation
nicht nachträglich verändern.

Die Zielallokation ist keine reine Eins-zu-eins-Zuordnung von ICE zu Servern.
Ein wichtiger Server darf mehrere ICE erhalten. Produktivität entsteht aber
nicht durch die Anzahl von ICE, „Schutzschichten“ oder einen pauschalen
Contestability- beziehungsweise Scorebonus. Der Parent formuliert einen
prüfbaren Schutzeffekt, etwa eine maximal zulässige exakte
Zugriffswahrscheinlichkeit unter dem sichtbaren Runner-Rig. Jede mögliche
Installation wird gegen Vorher/Nachher dieses Effekts und gegen den
vollständigen Funding-/Reservevertrag projiziert. Eine Route ist nur
produktiv, wenn sie das Schutzziel erfüllt oder nachweisbar in dessen Richtung
fortschreibt; ein zweites ICE ohne zusätzlichen Effekt ist kein Fortschritt.

Die Allokationswertung berücksichtigt mindestens:

- strategischen Serverwert sowie sichtbare, erwartete und jüngst beobachtete
  Angriffshäufigkeit;
- für HQ die der Corp bekannte Anzahl und Punktesumme der Agendas, die
  gesamte HQ-Größe sowie wichtige trashbare Nicht-Agenda-Karten, deren
  Verlust den aktuellen Corp-Plan materiell schwächen würde;
- für HQ und R&D getrennt die aktuell sichtbare Multiaccess-Tiefe sowie
  Karten-, Counter-, Virus-, Run-Event- und andere Sondereffekte, die Zugriff,
  Zugriffsqualität oder Folgewirkung gerade für diesen Server verändern;
- Agendaexposition, Matchpoint und das exakt gebundene Scoring-Remote;
- den exakten Vorher-/Nachher-Effekt auf den geforderten Schutzvertrag;
- ICE-Eignung gegen das sichtbare Runner-Rig und serverspezifische Synergien;
- Engine-zertifizierte Installations-, aktuelle Rez- und Post-Install-Rez-
  Quotes einschließlich vollständiger gemeinsamer Reserve;
- Knappheit und alternative Einsatzorte desselben ICE;
- den Wert des bewussten Zurückhaltens statt einer sofortigen Installation.

Diese Facts wirken serverspezifisch und lexikografisch innerhalb der
Planverträge; sie werden nicht zu einem pauschalen numerischen
„HQ-gegen-R&D-Bonus“ geglättet. Eine hohe Agenda- oder Verlustexposition in HQ
ist starke HQ-Evidence, aber kein absolutes Gebot, ungeachtet der aktuellen
Runnerlinie sofort HQ-ICE zu installieren.

Zeigt die side-sichere Runhistorie eine belastbare Konzentration auf R&D und
liegen keine terminale HQ-Gefahr, kein höherklassiger Score-Parent und keine
andere harte HQ-Evidence vor, darf `corp.defend_servers` HQ bewusst ohne
zusätzliches ICE lassen. Das gilt auch bei einer nicht leeren
HQ-Agendaexposition, wenn die Alternativen fachlich nahe beieinanderliegen.
Dieser Bluff-/Hold-Fall installiert weder ein nach exakter Projektion
wirkungsloses ICE auf R&D noch erfindet er eine No-op-Action. Der
Defense-Plan dispositioniert seine aktuell unterlegenen
Installationsvarianten, bleibt resident und bietet für diese Entscheidung
keinen ausführbaren Defense-Step an. Dadurch konkurriert eine andere reguläre
Planaktion und das ICE bleibt in HQ.

Ein wirkungsloses R&D-ICE wird also nicht installiert, um
R&D-Aufmerksamkeit vorzutäuschen. Umgekehrt darf der Hold-Fall niemals einen
nach P1 bis P4 lexikografisch höherrangigen exakten Score-Schutzbedarf, eine
terminale HQ-Zugriffsgefahr, ein laufendes Commitment oder eine klar bessere
Schutzprojektion überstimmen. Nur wenn mehrere verbleibende
`ICE × Server`-Alternativen nach allen harten Verträgen und der fachlichen
Allokationswertung nahezu gleichwertig sind, darf die in Abschnitt 33.2
definierte Engine-Randomisierung ihre Reihenfolge variieren.

Gedruckte `rezCost`-Werte, Layerzählung oder feste numerische Scoreboni dürfen
Engine-Quotes und Effektprojektion nicht ersetzen. Fehlen für ein sichtbares
ICE belastbare Eigenschaften oder ist ein erforderlicher Quote unbekannt,
unvollständig, veraltet oder nicht exakt an Karteninstanz, Server,
StateVersion und Action gebunden, bleibt der betroffene Defense-Step
diagnostisch blockiert und schlägt fail-closed fehl. Die Lücke wird in Engine,
Planmodul oder Kartenwissen geschlossen, nicht durch einen Ersatzwert,
Targeted Draw, Basic Credit oder Action-Fallback kaschiert.

Liefert die Engine für dieselbe ICE-Instanz mehrere aktuelle LegalActions,
etwa reguläres Rezzen und eine Olivia-artige Discount-Variante, bleiben diese
Actions getrennte Route Heads. Jedes Receipt bindet mindestens Quelle,
Server, StateVersion, Basiskosten, tatsächlich bezahlten Betrag,
Reduktions-/Aufschlagsquellen und gegebenenfalls das temporäre Derez. Eine
gemeinsame Karteninstanz ist kein Grund, Action-Identitäten oder Quotes
zusammenzuführen. Ein unvollständiges Receipt bleibt
`assessment_unknown`.

Verantwortung:

- dynamische HQ- und R&D-Schutzböden;
- Schutz des Zielremotes;
- ICE-Installations- und Rezreserve;
- Rez-Entscheidungen im aktuellen Run;
- Glacier-/Tax-Fortschritt;
- Reaktion auf sichtbare Runner-Rig- und Economy-Änderungen.

Interne Bedarfe und Steps:

- `rez_current_ice`;
- `raise_hq_floor`;
- `raise_rd_floor`;
- `harden_target_remote`;
- `restore_rez_reserve`.

`restore_rez_reserve` ist kein eigener Plan und keine dauerhafte pauschale
„Zentralreserve“. Es ist ausschließlich ein interner, endlicher
Ressourcenbedarf von `corp.defend_servers`. Score- und Remote-Parents können
ihn mit exaktem `parentInstanceId` und geerbter Prioritätsklasse anfordern,
delegieren damit aber die Verteidigungsreserve an `corp.defend_servers` und
besitzen keine parallele Reserve-Ownership. Die Höhe entsteht ausschließlich
aus den vollständigen Engine-Quotes der konkret betrachteten
Install-/Rez-Fortsetzung. `corp.economy` kann diesen typisierten
Defense-Parent-Need finanzieren, besitzt aber weder die Defense-Priorität noch
die ICE-/Serverauswahl. Ein Reserve-Service darf Facts und Konflikte
projizieren, aber keinen Executor wählen und keine Credit-, Draw-, ICE- oder
EndTurn-Action besitzen.

Ein Legacy-Helfer wie `corpCentralRezReserveNeeds`, der Reserve aus
`source.rezCost`, Kartendefinitionen oder allgemeinen Central-Floors ableitet,
hat im Zielzustand keine eigene Architekturrolle. Er wird entweder in den
quotierten Need des globalen Defense-Plans überführt oder entfernt. Ein
unvollständiger Quote erzeugt keinen geschätzten Reservewert; der betroffene
Need bleibt sichtbar blockiert.

Eine Rez-Entscheidung ist ein fenstergebundener Urgent-Response-Modus
desselben Verteidigungsplans. Solange dieses Fenster offen ist, beschränkt es
die ausführbaren Defense-Steps auf passende Rez-Aktionen. Es erzeugt keinen
zweiten, gegen HQ-, R&D- oder Remote-Schutz konkurrierenden Verteidigungsplan.
Der Verteidigungsplan darf einen Scoring- oder Remoteplan präemptieren, aber
deren Zustand nicht vergessen.

`decline_rez` wird nur dann als unproduktiv zurückgewiesen, wenn derselbe
Defense-Modus eine exakte, aktuell produktive Rez-Action als Route
materialisiert. Gibt es keine solche Rez-Route, ist Decline die regelkonforme
fenstergebundene Entscheidung und darf nicht durch eine bloße
Rez-Kartenfamilie oder einen allgemeinen Defensebedarf verdrängt werden.

Konditionale Rez-Supportkarten benötigen einen kartenspezifischen
Folgevertrag. Chester Mix darf nur gerezzt werden, wenn bereits vor dem Rezzen
genau eine produktive ICE-Installation am selben Fort feststeht, der Discount
tatsächlich Kosten spart und die globale Placement-/Rezreserve-Bewertung
positiv bleibt. Rez und Installation bilden eine `locked_sequence`. Nach dem
State-Wechsel wird die neue LegalAction über gebundene ICE-Instanz und Fort
erneut exakt materialisiert; verschwindet diese Fortsetzung, entsteht
`commitment_invalidated` statt einer anderen ICE- oder Serverroute.

Gemeinsame Hint-Begriffe rechtfertigen keine gemeinsame Rez-Heuristik.
Dr. Dreff wird nur im letzten relevanten Begegnungsfenster desselben Forts
produktiv, wenn sichtbares HQ-ICE unter seinem eigenen Halb-Rez-Kostenvertrag
bezahlbar ist. Jenny Jett besitzt einen getrennten Vertrag: aktueller Run am
eigenen Fort sowie Finanzierung ihrer Rez-Kosten und der aktuellen
fortabhängigen ICE-Installationskosten. Dr.-Dreff-Kostenregeln dürfen nicht
auf Jenny übertragen werden; weitere Karten derselben groben Effektfamilie
benötigen ebenfalls ein eigenes Modell.

#### Ownership zwischen Score, Remote und Defense

| Verantwortung                                                                                             | fachlicher Owner                              |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Agendaquelle, Install/Advance/Score und Scoredeadline                                                     | `corp.score_agenda`                           |
| langfristige Nutzbarkeit und Wiederverwendung eines Remotes                                               | `corp.establish_scoring_remote`               |
| globale ICE-Allokation, ICE-Installation, Schutzbewertung, Rez-Entscheidung und allgemeine Central-Floors | `corp.defend_servers`                         |
| konkrete Härtung für einen Score- oder Remote-Parent                                                      | typisierter Defense-Supportbedarf des Parents |
| einmalige Opening-Basis ohne bestehendes Zielprojekt                                                      | `corp.opening_and_board_foundation`           |

Eine ICE-Installation kann mehreren Plänen nutzen, besitzt aber immer
`corp.defend_servers` als ausführenden fachlichen Owner. Score-, Remote- und
Opening-Pläne veröffentlichen dafür typisierte Schutzbedarfe; sie
installieren ICE nicht selbst. Mehrplannutzen bleibt ein weicher
Allokationsbeitrag innerhalb des globalen Verteidigungsplans und kein
separates Ownership- oder Override-Recht.

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
```

`fund_rez_reserve` ist ausschließlich Economy-Support für einen exakten,
Engine-gequoteten Defense-/Score-/Remote-Parent-Need. Der Modus erzeugt weder
eine allgemeine Central-Reserve noch eigene Defense-Ownership.

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

Der Normalzustand dieser Kampagne ist ein lauerndes `watch_window`, kein aktiv
abzuarbeitender Komponentenaufbau. Fehlende Damage-, Tag- oder
Trace-Komponenten sind beobachtete Kampagnenfakten, aber noch keine offenen
Action-Needs. Insbesondere erzeugt die Kampagne keinen wiederholten
Targeted-Basic-Draw. Sie wird bei relevanten Änderungen an eigener Hand,
öffentlichem Runnerzustand, Triggern, Credits oder Klicks neu bewertet und
übernimmt erst dann den Vordergrund, wenn eine ausreichend vollständige Route
das Opportunity-Gate erreicht.

Die ausgewählte Route ist variabel. Sie verwendet nur so viele aktuell
vorhandene Komponenten, wie nach Runner-Handzahl und sichtbarer Prävention
notwendig sind. Vier sicher wirksame Damage sind bei drei Runner-Handkarten
lethal; bei vier Handkarten sind exakt vier Damage noch keine Flatline. Ein
zusätzlicher Damage-Step darf daher weder pauschal verlangt noch unnötig
ausgeführt werden.

Der erste produktive Stand muss nicht jede Punish-Kartenfamilie optimal
beherrschen. Abnahmeziel ist ein repräsentativer vertikaler Slice, der
Opportunity-Root, variable Route, Engine-Quote, Parent-Support,
Schedulerübergabe und Requote-Continuation vollständig durchläuft. Noch nicht
unterstützte Capabilities bleiben explizit unknown und fail-closed. Weitere
Karten, Reaktionszweige und Bewertungsbedingungen werden iterativ über
konkrete Spielsituationen und Szenarioverträge innerhalb des Moduls ergänzt,
ohne den gemeinsamen Planmodul- oder Schedulervertrag zu verändern.

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

Ein Funding-Step wird nur geöffnet, wenn sein Klick und die gesamte
verbleibende Route noch in dasselbe gültige Punish-Fenster passen. Ein
langfristig fehlender Credit oder eine fehlende Karte rechtfertigt für sich
noch keine aktive Verfolgung der lauernden Kampagne.

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

Auch eine Ambush-Rolle, ein Hint oder eine legale Installation allein erzeugt
keine Planinstanz. Discovery verlangt einen expliziten aktuellen CorpIntent,
der `corp.ambush_bluff` trägt, sowie die konkrete Vorausplanung von
Karteninstanz, Zielserver und Sequenz. Ist eine Ambush-Installationsaktion
sichtbar, aber der erforderliche Intent-/Signalvertrag fehlt, schlägt die
Runtime als fehlende Planmodulabdeckung fail-closed fehl; sie erfindet weder
einen Rollenplan noch eine generische Entwicklung.

Jede ausführbare Ambush-Instanz bindet die konkrete sichtbare
Karteninstanz und die aktuellen `actionIds`. Owner und Materializer prüfen
bei vorhandenen IDs ausschließlich diese Route; eine zweite Kopie derselben
Definition am selben Server ist ein eigener Plan und keine austauschbare
Geschwisteraktion. Install-, Advance- und Trigger-Phasen behalten dieselbe
Instanzidentität. Nach jedem State-Wechsel werden nur die dann legalen
Action-IDs neu entdeckt; eine fehlende kartenspezifische Phasensemantik darf
nicht durch Definition-, Server- oder Rollenfallbacks ersetzt werden.

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

### 28.11 Kein Corp-Fallbackplan

Wie beim Runner wird weder ein freier globaler Actionsieger noch ein
generischer Ersatzplan verwendet. `corp.economy` handelt nur für eine endliche
Reserve, einen konkreten Parent-Fundingbedarf oder eine vollständig
entwickelte Economy-Engine. `corp.hand_and_agenda_management` handelt nur für
einen belegten Draw-, Refresh-, Agenda- oder Overflow-Zweck.

`raise_visible_floor` benötigt Defense-Evidence; allgemeine Boardentwicklung
benötigt ein Domainmodul. Fehlt die Planabdeckung, wird dies nicht durch
Credit, Draw oder Boardentwicklung verdeckt.

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

### 30.2 Corp

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
- **Kernentscheidung:** Nur Pläne handeln. Jede freiwillige Action ist der
  konkrete Route Head eines Steps und muss individuell gegen dessen
  Capability-, Target- und Fortsetzungsvertrag bindbar sein.
- **Kernentscheidung:** `corp.defend_servers` ist der einzige globale
  serverübergreifende ICE-Allokator. Andere Pläne liefern Schutzbedarfe; das
  frühere ICE-Platzierungsmodul liefert ausschließlich Sensor-Facts und
  weiche Fit-Werte, aber keine Entscheidung.
- **Kernentscheidung:** Score-/Remote-Schutz wird über Parent-Delegation,
  geerbte Prioritätsklasse, exakten Schutzeffekt und Engine-zertifizierte
  Funding-/Reservequotes bewertet. Layerzählung, Scoreboni und gedruckte
  Rez-Kosten sind kein Ersatzvertrag.
- **Kernentscheidung:** Installieren, Advancen und Scoren sind Phasen derselben
  exakten `corp.score_agenda`-Instanz. Eine unvollständige
  Zukunftsprojektion begrenzt Commitment- und Terminalclaims, macht einen
  vollständig Engine-gequoteten aktuellen Advance-Step aber nicht zu
  unbekanntem Score-Schutz.
- **Kernentscheidung:** HQ-/R&D-Allokation verwendet serverspezifische
  Agenda-, Kartenverlust-, Multiaccess-, Sondereffekt- und Runhistorienfacts.
  Bei belastbarem R&D-Fokus darf der Defense-Plan ohne höherrangige HQ-Evidence
  bewusst HQ-ICE zurückhalten und eine andere reguläre Planaktion konkurrieren
  lassen.
- **Kernentscheidung:** Es gibt keine autonome Zentral-Rezreserve. Ein
  Finanzierungsgap entsteht ausschließlich aus einer konkreten,
  Engine-gequoteten Route von `corp.defend_servers` und wird als Economy-Child
  an genau diesen Parent gebunden. Score- und Remote-Parents dürfen den
  Schutzbedarf und ihre Klasse delegieren, aber weder einen parallelen
  Reserveplan noch einen zweiten Action-Owner bilden.
- **Kernentscheidung:** Randomisierung ist nur für ausdrücklich zugelassene,
  fachlich nahezu gleichwertige Routen desselben Steps erlaubt. Auswahl,
  RNG-Verbrauch, `RandomDrawRecord` und Anwendung erfolgen atomar in der
  Engine.
- **Kernentscheidung:** Eine reine Finanzierungslücke ist kein Grund für
  zielgerichteten Defense-Draw. Unbekannte oder unvollständige Defense-Facts
  enden fail-closed.
- **Befristeter Übergangs-/Sicherheitsvertrag, kein Zielzustand:** Basic Credit
  ist vorübergehend auch über den eng typisierten, pro Zug endlichen
  P6-Liquiditätsplan produktiv. Seine Removal Condition ist die vollständige
  fachliche Abdeckung verbleibender normaler Zugkapazität durch Economy-Pläne
  und exakte Parentbedarfe. Die Zielarchitektur kennt keine neutrale
  Basic-Credit- oder Draw-Route. Unknown blockiert den eigenen unbewiesenen
  Pfad und jeden Exhaustion-/EndTurn-Beweis, aber nicht eine unabhängig
  exakte produktive Route.
- **Kernentscheidung:** Run-/Access-/Jack-out-/Pump-/Break-Routen verlangen
  explizit positive planlokale Assessments; fehlende Assessments sind
  `Default-Deny`.
- **Kernentscheidung:** Choice-Payload-Auflösung folgt der Plan- und
  Actionwahl, kann diese nicht ändern und scheitert ohne vollständige
  Domainlogik fail-closed.
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
- **Kernentscheidung:** PlanAssessments und nichtautoritative, aktuell
  ausführbar belegte Planning Heads werden vor der Executorwahl erzeugt;
  autoritative Route Heads ausschließlich für den gewählten ersten Step
  danach rematerialisiert.
- **Kernentscheidung:** Der Scheduler dirigiert kohärente, mehrphasige
  Restzuglinien; Planmodule liefern Fachprojektionen und Kampagnenclaims,
  übernehmen aber nie die globale Kommandoebene.
- **Kernentscheidung:** Zukünftige Phasenroots sind in V1 resident oder
  bereits admission-geprüft. Neue Planentdeckung ist eine typisierte
  Replangrenze, keine hypothetische Portfolioinstanz.
- **Kernentscheidung:** Planner-IDs, Ranking und Cache verwenden
  ausschließlich side-sichere Planning-Fingerprints. Die privilegierte
  private KI-Debuganzeige darf unabhängig davon die vollständige Hand der
  jeweils aktiven KI und die gesamte Zugplanung anzeigen; die Hand des
  menschlichen Spielers bleibt ausgeschlossen.
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
  if (
    window.kind === "automatic_resolution" &&
    window.hasExactlyOneForcedLegalAction
  ) {
    return continueEngineResolution(window, context);
  }

  const semanticActions = projectActionSemanticCandidates(
    context.legalActions,
    context,
  );
  const portfolio = reconcileAndDiscoverPortfolio(context);
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
  const planningHeads = enumerateCurrentPlanningHeads(
    validated,
    semanticActions,
    context,
  );
  const lines = projectAndEvaluateRemainderTurnLines(
    planningHeads,
    validated,
    portfolio,
    context,
  );
  const selectedLine = selectBestValidTurnLine(lines, context);
  const { rootForeground, leafExecutor, selectedHead } =
    executionPathFromSelectedLine(selectedLine, portfolio, context);

  if (!leafExecutor || !selectedHead) {
    throw new PlanResolutionFailure("no_executable_plan", diagnostics);
  }

  const module = registry.moduleFor(leafExecutor.moduleId);
  const step = module.proposeStepFromSelectedPlanningHead(
    leafExecutor,
    selectedHead,
    context,
  );
  const routes = module.materializeRoutes(
    leafExecutor,
    step,
    semanticActions,
    context,
  );
  const viableRoutes = applyGlobalSafetyGates(routes, context);
  if (viableRoutes.length === 0) {
    throw new PlanResolutionFailure(
      "plan_step_has_no_bound_route",
      diagnostics,
    );
  }
  assertSelectedHeadRematerializedExactly(selectedHead, viableRoutes, context);

  const routeSelection = selectPlanLocalRoute(
    module,
    leafExecutor,
    step,
    viableRoutes,
    context,
  );
  const selectedRoutes =
    routeSelection.kind === "bounded_random_near_tie"
      ? routeSelection.routes
      : [routeSelection.route];

  const preparedInvocations = selectedRoutes.map((route) => {
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

    const selectedChoices =
      action.type === "resolve_choice"
        ? resolvePlanBoundChoicePayload(action, route, context)
        : undefined;
    assertChoiceResolutionDidNotChangeAction(action, selectedChoices);

    return {
      route,
      invocation: materializeLegalActionInvocation(action, selectedChoices),
      prospectiveCommitment: projectCommitment(route, context),
    };
  });

  if (routeSelection.kind === "bounded_random_near_tie") {
    assertSamePlanStepPriorityAndParent(preparedInvocations);
    assertCanonicalCurrentLegalActionIds(preparedInvocations, context);
    return buildEngineRandomizedPlannedDecision(
      rootForeground,
      leafExecutor,
      step,
      preparedInvocations,
      routeSelection.randomPurpose,
    );
  }

  return buildPlannedDecision(
    rootForeground,
    leafExecutor,
    step,
    preparedInvocations[0],
    turnPlanCommitmentFrom(selectedLine),
  );
}
```

`prospectiveCommitment` ist bis zur Auswahl nur eine nebenwirkungsfreie
Projektion. Im Einzelfall wird es mit der normalen Actionwahl aktiviert. In
der Nahgleichstandsvariante aktiviert der atomare Engine-Übergang
ausschließlich das zur gezogenen Invocation gehörende Commitment und weist
genau dieses Paket im Receipt aus.

### 33.1 Fail-closed statt Ersatz-Replanning

Ist ein als `executable_now` bewerteter Step nicht auf seine konkreten
LegalAction-Kandidaten abbildbar, ist dies ein Vertragsfehler. Die Runtime
darf nicht innerhalb derselben Entscheidung auf einen niedrigeren Plan,
eine freie Action oder einen generischen Fallback ausweichen. Sie schlägt
klassifiziert fail-closed fehl. Erst eine neue reguläre Entscheidung nach
einer echten StateVersion-Änderung darf das Portfolio erneut bewerten.

### 33.2 Stabile Tie-Breaks und kontrollierte Variation

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
- sichere und positiv bewertete Ziele eingeschränkter Zusatzkapazität;
- die Identität der konkreten EndTurn-Action.

Verbleibt normale Klickkapazität, ist Standard-EndTurn unabhängig von der
Disposition aller anderen Actions gesperrt. Nur wenn der EndTurn-Vertrag
erfüllt ist, materialisiert
`*.complete_turn` die Standardaction `sourceKind = game_rule`. Eine
kartengebundene Action mit demselben LegalAction-Typ wird dadurch niemals
automatisch ausgewählt.

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

| Plan                              | Zustand               | Rolle       |
| --------------------------------- | --------------------- | ----------- |
| `runner.pressure_central:rd`      | ready                 | Vordergrund |
| `runner.economy:fund_parent_need` | bei Bedarf erzeugbar  | Support     |
| `runner.rig_and_coverage`         | dormant               | resident    |
| `runner.develop_board_and_hand`   | ready, aber niedriger | Challenger  |
| `runner.pressure_central:hq`      | ready, aber niedriger | Challenger  |

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
4. prüfen, ob ein endlicher Reserve- oder Parent-Fundingplan einen
   Basic-Credit-Step besitzt;
5. Basic Credit nur bei positiver Zielannäherung dieses Plans wählen;
6. fehlt ein ausführbarer produktiver Plan, die Abdeckungslücke sichtbar
   fail-closed melden;
7. EndTurn nur über den expliziten Completion-Plan und dessen strukturelle
   Restkapazitätsbelege zulassen.

Der Credit braucht dafür keinen künstlichen globalen Bonus und besitzt
außerhalb eines endlichen Funding- oder Reserveziels keinen Eigenwert.

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

Der private Betreiber-Debugvertrag hält zusätzlich die erste vollständige
Restzugplanung eines KI-Zuges fest. Für jede tatsächlich vom bestehenden
TurnPlanner betrachtete Linie werden Root-Plan, semantische Schrittfolge,
Skalarwert, einzelne Bewertungskomponenten, Pflichtenbefund,
Planungsgrenze und Evidence ausgegeben. Nur der erste, aktuell gebundene
Schritt darf dabei eine `currentActionId` tragen; projizierte Folgeschritte
bleiben reine Semantik. Diese Diagnose serialisiert das Ergebnis des
zuständigen Restzug-Suchers und eröffnet weder eine zweite Linienwahl noch
eine neue Plan-, Step-, Routen- oder Action-Autorität.

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
- Score-Schutz-Support erbt exakt `parentInstanceId` und Prioritätsklasse des
  ausgewählten Score-Parents; Kandidat, Evidence und Assessment dürfen nicht
  aus verschiedenen Priority-Bands stammen;
- ein aktuell vollständig Engine-gequoteter Agenda-Advance bleibt Phase des
  exakten Score-Parents, auch wenn eine spätere Gesamtprojektion noch kein
  vollständiges Same-Turn-Commitment zertifiziert;
- Ressourcen werden nicht doppelt reserviert;
- typisierte Action Capacity wird nur für zulässige Fähigkeiten ausgegeben;
- geschützte Fortsetzung schützt Folgeaktionen;
- Route oder Commitment enthält keine zukünftige oder veraltete Action-ID;
- ein Step mit konkreten `actionIds` materialisiert keine semantisch passende
  Geschwistervariante;
- eine Action-ID kann nicht zugleich Planroute und explizite Disposition sein;
- jeder einzelne Coverage-Kandidat bindet gegen den konkreten Step; ein
  unbindbarer Geschwisterkandidat scheitert sofort;
- Run-/Access-/Jack-out-/Pump-/Break-Kandidaten benötigen
  `admissible === true`; fehlende Assessments materialisieren keine Route;
- Choice-Payload-Auflösung verändert weder `actionId` noch Executor oder
  Plan-Step und scheitert ohne vollständige Domainlogik fail-closed;
- Basic Credit besitzt ohne endliches Reserve-, Parent-Funding- oder den
  befristeten eng typisierten P6-Übergangsvertrag keine produktive Route;
- mehrere Same-Turn-Installationspfade derselben Agenda werden entweder als
  getrennte exakte Planalternativen geführt oder erst nach einer
  deterministischen Commitment-Auswahl dispositioniert;
- ein unbindbarer `executable_now`-Kandidat scheitert unmittelbar
  fail-closed;
- fehlende Planabdeckung erzeugt keinen Credit-, Draw- oder
  Action-Fallback;
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
- ein Mehrplanbeitrag bleibt Tiebreaker, nicht Override;
- `corp.defend_servers` bewertet das gesamte Serverportfolio und bindet genau
  ein Paar `ICE × Server`;
- das ICE-Fachmodul liefert nur Facts und weiche Fit-Werte; Tests verbieten
  eigene Recommendation-, Veto-, Hold-, Policy- oder Ownership-Ausgaben;
- Score-Schutz bewertet exakten Vorher-/Nachher-Effekt und
  Funding-/Reservevertrag statt ICE-Anzahl, Layer oder numerischer
  Scoreboni;
- Engine-zertifizierte aktuelle und Post-Install-Rez-Quotes bestimmen Kosten
  und Reserve; fehlende oder falsch gebundene Quotes dürfen nicht auf
  gedruckte `rezCost` zurückfallen;
- `funding_only` delegiert Economy-Support und materialisiert keinen
  zielgerichteten Defense-Draw;
- unbekannte oder unvollständige Defense-Facts enden fail-closed und werden
  weder als Effektlücke noch als unproduktive ICE-Route umklassifiziert;
- HQ-/R&D-Allokation berücksichtigt Agendaexposition, wichtige trashbare
  HQ-Karten, serverspezifischen Multiaccess, Sondereffekte und Runhistorie;
- ein belegter R&D-Fokus kann ohne höherrangige HQ-Evidence einen bewussten
  HQ-Hold erzeugen, aber niemals die Installation eines wirkungslosen
  R&D-ICE;
- HQ-Overflow delegiert jede ICE-Installation an `corp.defend_servers` und
  erzeugt keine konkurrierende Handmanagement-Ownership;
- reguläre und discountierte Engine-Rezactions derselben ICE-Instanz bleiben
  getrennte, actiongebundene Routen;
- ein vollständig gequoteter Funding-Gap erhält den exakten Defense-Parent
  und dessen Priority-Band; ein fremder niedriger priorisierter Scoreplan
  darf ihn nicht verdrängen;
- Rezreserve bleibt ausschließlich ein endlicher quotierter Need von
  `corp.defend_servers`; Score-/Remote-Parents delegieren nur Ursprung und
  Prioritätsklasse;
- Nahgleichstandsvariation bindet ausschließlich Same-Step-Routen und erzeugt
  genau einen Engine-`RandomDrawRecord` für den Selection-Purpose. Zufall der
  danach ausgeführten Kartenwirkung bleibt getrennt aufgezeichnet.

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
- Run-Funding nur bei echtem Credit-Gap und ohne vorrangige direkt
  konvertierbare Alternative;
- akute Run-Funding-Linie mit direkt konvertierbarer Same-Server-
  Geschwisterroute sowie Terminal-Floor-Override ohne reales Route-Gap;
- Broker-Cashout nur für gebundene Same-Turn-Entwicklung unter geschütztem
  Handpuffer einschließlich nicht-endlicher Gegenfälle;
- Remote-Matchpoint-Response;
- Corp-Same-Turn-Score;
- globale ICE-Allokation mit genau einer gebundenen ICE-Server-Kombination
  und konkreten Dispositionen aller Geschwistervarianten;
- HQ gegen R&D mit variierter Agendaexposition, wichtigen trashbaren
  HQ-Karten, serverspezifischem Multiaccess und besonderen Zugriffseffekten;
- starker sichtbarer R&D-Fokus bei nicht leerer HQ-Agendaexposition: bewusster
  HQ-Hold und Konkurrenz einer anderen regulären Planaktion statt
  wirkungsloser R&D-ICE-Installation;
- Gegenfälle für den HQ-Hold: Matchpoint, exakter höherrangiger Score-Parent,
  terminale HQ-Gefahr und klar überlegene HQ-Schutzprojektion;
- fachlich getrennte ICE-Allokationen bleiben seedunabhängig; nur echte
  Same-Step-Nahgleichstände variieren über einen aufgezeichneten Engine-Draw;
- Score-Schutz mit gleicher Parentbindung und geerbter Prioritätsklasse in
  Planwahl, Evidence, Assessment und Action;
- Score-Schutz-Gegenfälle für effektives, aber nur ungefundetes ICE: Economy-
  Support statt `draw_for_ice`;
- dynamisch modifizierte Rez-Kosten sowie unvollständige oder veraltete
  Engine-Quotes ohne Rückfall auf gedruckte Kartenkosten;
- zwei ICE mit unterschiedlicher Layerzahl, aber gleichem Schutzeffekt, ohne
  künstlichen Layer- oder Scorebonus;
- zwei gleiche Ambush-Kopien am selben Server mit genau einer gebundenen
  Install-Action je Planinstanz;
- Ambush-LegalAction ohne CorpIntent als fail-closed Gegenfall sowie
  legitime vorausgeplante Install-/Advance-Sequenz;
- Chester-Mix-Rez mit exakt gebundener Same-Fort-ICE-Fortsetzung sowie
  Gegenfall ohne produktive Fortsetzung;
- getrennte Dr.-Dreff- und Jenny-Jett-Rezverträge;
- `decline_rez` nur dann unproduktiv, wenn eine exakte produktive Rez-Route
  existiert;
- Tycho Extension plus Project Consultants mit mehreren Zielservervarianten;
- zwei sichtbare Corporate-War-Kopien mit jeweils mehreren
  Zielservervarianten und exakt einer widerspruchsfreien Planzuordnung je
  Action-ID;
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
- neutrales Deck verwendet nur endliche, positiv definierte Grund- und
  Supportpläne.

### 40.7 Full-Match- und Baseline-Evidence

Nach Modul- und Checkpointtests:

- deterministische Full Matches;
- feste AI Behavior Baseline;
- Seed-Serien;
- Plan-Churn-, EndTurn-, Action-Coverage- und Commitment-Metriken;
- qualitative Vollaudits ausgewählter Spiele;
- getrennte Bewertung von technischer Sicherheit und Play Strength.

Technische Gates beweisen Regelkonformität, Hidden-Info-Sicherheit,
Replaysicherheit und die Einhaltung der Architekturverträge. Sie beweisen
nicht allein, dass die resultierenden Spielentscheidungen fachlich sinnvoll
sind. Nach einer Änderung an Planerkennung, Planfortbestand,
Portfolioauswahl, Ressourcenpriorisierung oder TurnCompletion wird deshalb
zuerst ein kleines integriertes und spielbares Inkrement bereitgestellt.
Bevor der nächste breite Verhaltensumbau beginnt, folgt ein menschlicher
Playtest-Checkpoint mit mindestens einem vollständig gespeicherten Spiel und
einer qualitativen Prüfung der auffälligen Entscheidungen.

Der Checkpoint darf die Architektur nicht durch unstrukturierte
Einzelfallheuristiken ersetzen. Er ist aber die verbindliche Rückkopplung
zwischen formaler Vertragsevidence und tatsächlichem Spielbedarf. Neue
Findings werden spielgleich als Decision-Checkpoint gesichert; erst danach
wird der nächste Ausbauabschnitt begonnen. Mehrtägige, ausschließlich
theoretische Verhaltensausbauten ohne zwischenzeitlich spielbare Fassung sind
damit kein zulässiger Standardprozess.

### 40.8 Hidden-Info-Äquivalenz

Zwei vollständige Testzustände mit identischer side-sicherer `PlayerView`,
aber unterschiedlichen gegnerischen Hidden-Zonen müssen vor Enthüllung
dieselbe KI-Entscheidung erzeugen. Das umfasst insbesondere:

- gegnerische Handkarten und verdeckte Remotes;
- unbekannte ICE-Identitäten;
- verdeckte Runner-Ressourcen;
- zukünftige R&D-Reihenfolge.

Bei kontrolliertem Match-RNG gilt Gleichheit einschließlich Seed und
RandomCounter. Tests für freigegebene Nahgleichstände prüfen zusätzlich den
exakten `RandomDrawRecord`, die tatsächlich angewendete LegalAction,
StateHash/Replaysicherheit und dass Preview-/Assessment-Aufrufe den
`RandomCounter` nicht verändern.

### 40.9 Eingeschränkte Kapazität und Fail-closed-Audit

Mindestens Valu-Pak-, Edgerunner-, Wilson-, Broker- und kostenlose
Follow-up-Run-Kontexte prüfen Tokenart, Folgezwang, Usage Limit und Ablauf.
Für Valu-Pak muss der Test zusätzlich beweisen, dass nur konkrete sinnvolle
Programme aus der aktuellen sichtbaren Hand ein geordnetes Commitment öffnen;
eine bloße strategische Programmdichte im Deck oder ein späterer möglicher Draw
genügt nicht. Bei mehreren residenten Sequenzen darf nur die aktive
Executor-Instanz fortsetzen; historische, fehlende oder mehrdeutige Bindungen
und nicht-endliche Preflight-/Commitmentwerte müssen fail-closed enden.

Full Matches verlangen für freiwillige Entscheidungen `fallbackUsed = false`.
Ein verbleibender technisch so benannter Fallback muss einen vollständig
definierten regelkonformen Normalzustand abbilden und seinen Grund
klassifizieren. `missing_module_coverage`, `semantic_mapping_failed`,
`resource_conflict`, `missing_action_assessment` und `scheduler_failure` sind
sichtbare Fehlerzustände und dürfen niemals durch generische Entwicklung,
Credit, Draw oder EndTurn kaschiert werden.

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
- fail-closed Abdeckungs- und Assessmentfehler nach Ursache;
- Planabschluss, Aufgabe und Stale-TTL.

Die Metriken sind Diagnose- und Gate-Evidence, keine alleinige
Play-Strength-Freigabe.

## 42. Historische Ableitung des ausgeführten Implementierungsplans

Dieser Abschnitt dokumentiert die ursprüngliche Ableitung der
Arbeitsstränge. Die verbindliche Paketfolge PF00 bis PF16 wurde anschließend
im `ai-plan-first-runtime-cutover-process-2026-07-23.md` festgelegt und bis
PF15 vollständig ausgeführt; PF16 befindet sich in der Abschlussprüfung.

### 42.0 Verhältnis zu Ist-Architektur, Roadmap und Proteus

- Die damaligen TacticalPlan-Typen waren produktive Ist-Evidence und
  Migrationsmaterial, aber keine Basisklassen des neuen Kernels.
- Plan-first ersetzt im Zielzustand den früheren direkten
  Goal-vs-Action-Entscheider. Goal-/Threat-Signale und
  `ActionSemanticCandidates` bleiben jedoch verbindliche Vor- beziehungsweise
  Abbildungsebenen.
- Ältere Roadmap-Aussagen, Proteus erst nach Originalset-Stabilität zu öffnen,
  sind überholt: Der aktuelle Projektstatus führt den Proteus-Kartenpool im
  technischen `ai_supported`-Scope. Die Akzeptanzszenarien gehören daher zum
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

Dieses Planebenen-Konzept bildet einen verbindlichen Dreierverbund mit:

- `ki-zielbild-metaebene-2026-08-02-v6.md` als allgemeinem KI-Zielbild;
- `ai-program-logic-change-compass.md` als verbindlichem Agenten-Konzentrat.

Bei jeder inhaltlichen Änderung an einem der drei Dokumente muss geprüft
werden, ob die beiden anderen Dokumente durch neue Begriffe, Haltung,
Autoritätsgrenzen, Ownership, Planverträge, Leitplanken oder Pflichtnachweise
ebenfalls betroffen sind. Der Dokumentationsschritt ist erst abgeschlossen,
wenn alle betroffenen Stellen synchronisiert sind oder ausdrücklich
festgestellt wurde, dass die beiden anderen Dokumente unverändert gültig
bleiben. Das WIP darf keine Detailentscheidung einführen, die dem allgemeinen
Zielbild oder dem Agenten-Kompass widerspricht.

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

### 1.2 – 2026-08-02

- allgemeinen Current-State nach Turn-/Campaign-Cutover, generischer
  Fähigkeitsmigration und vollständigen Corp-Spielaudits konsolidiert;
- Doctrine auf ausführbare Strategiekomposition statt Einzelanker
  festgeschrieben;
- Known-/Unknown-Teilmengen, materialisierbaren Draw-Horizont, globale
  ICE-Opportunitätskosten und Score-/Defense-Parentkohärenz präzisiert;
- die zuvor offene In-Class-Bewertung mit dem produktiven versionierten
  Bewertungsregister, Pflichtabdeckung, Dominanz und Tiebreak-Vertrag
  abgeglichen;
- Resolvergrenze, stabile Instanzwahl und privilegierte Betreiberdiagnostik
  an den aktuellen Architekturvertrag angepasst;
- wechselseitigen Pflegevertrag mit allgemeinem Zielbild und Agenten-Kompass
  ergänzt: Änderungen müssen auf Auswirkungen auf alle drei Dokumente geprüft
  und bei Bedarf synchron nachgezogen werden.

### 1.1 – 2026-07-30

- gemeinsamen TurnPlanner für Corp und Runner produktiv umgestellt: jede
  freiwillige Aktion läuft über Planning Head, TurnPlanCommitment, Lease und
  autoritative Rematerialisierung;
- deterministische Restzuglinien, mehrphasige Roots, Informations- und
  Reaktionsgrenzen sowie serverprivate Kampagnenpersistenz bis durch
  Gegnerzug und Runtime-Neustart umgesetzt;
- vollständige Side-Coverage, getrennte Cutover-Gates, Replay/RNG,
  Hidden-Info, Restart und private Betreiberdiagnostik abgenommen;
- private Buganzeige als bewusst privilegierte Betreiberansicht bestätigt:
  die vollständige Hand der aktiven KI und der komplette Zugplan bleiben
  sichtbar; die Menschenhand bleibt ausgeschlossen;
- Abschlussverifikation und verbleibende Play-Strength-Punkte in
  `docs/reviews/ai/ai-turn-and-campaign-planner-final-review-2026-07-30.md`
  festgehalten.

### 1.0 – 2026-07-29

- zentrale Restzug-Dirigentenschicht ergänzt: nichtautoritative Planning
  Heads aller relevanten Planinstanzen konkurrieren vor der Executorwahl;
  nur der gewählte erste Step wird danach autoritativ rematerialisiert;
- mehrphasige Ein-Root-Phasen, `TurnPlanCommitment`, side-sichere
  Planning-State-Identität, konkrete Priority-Obligations und
  prefixgebundene Kampagnen-Value-Claims als gemeinsame Kernelverträge
  festgeschrieben;
- hypothetische Phasenroots in V1 auf residente oder bereits
  admission-geprüfte Beziehungen begrenzt; neue Planentdeckung bildet eine
  explizite Replangrenze;
- echte Informationsgrenzen beenden den konkreten TurnPlan; ein eng
  registrierter abstrakter Restwert bleibt zulässig, konkrete
  Recourse-Phasen nicht;
- Phase Entry, Completion, Need-/Assignment-Bindung, Transition und Cursor
  als einzige Fortschrittswahrheit ergänzt;
- privilegierte private KI-Debuganzeige ausdrücklich von normalen
  side-sicheren Datenwegen getrennt: Sie zeigt die vollständige Hand der
  aktiven KI sowie den kompletten Zugplan, nicht jedoch die Menschenhand.

### 1.0 – 2026-08-17

- Den side-sicheren Run-Risikovertrag als Root-Plan-Zustand präzisiert und die
  Revalidierung im gebundenen `runner.convert_run_window`-Leaf festgelegt;
  unveränderte Startannahmen bleiben zulässig, materielle Verschlechterungen
  von Credit-/Handreserve oder sichtbarem Rez-Potenzial können Jack-out
  priorisieren, ohne eine neue Entscheidungsautorität zu erzeugen.

### 0.9 – 2026-07-26

- Post-Cutover-Regressionshärtung bis zum lokalen Main-Integrationsstand
  `c64a14f8f` aufgenommen.
- Die Certainty-Grenze als ausführbaren Mehrzugplan mit exakt gebundenem
  aktuellem Route Head bestätigt; Unknown klassifiziert keinen gesamten
  Parent und beweist keine Routenausschöpfung.
- Standard-EndTurn bei verbleibender normaler Klickkapazität hart gesperrt;
  ausschließlich eingeschränkte null Klick kostende Runner-Kapazität und der
  terminale Deckoutpfad bleiben enge Sonderverträge.
- ICE-Ownership bei HQ-Overflow, actiongetrennte reguläre/discountierte
  Rez-Quotes, parentgebundenes Defense-Funding und den
  Employee-Empowerment-Choice-Vertrag ergänzt.
- Aktuelle Verifikation mit `4.152/4.152` AI-Tests und akzeptierter
  60-Spiele-Baseline über `13.309` Entscheidungen dokumentiert.

### 0.8 – 2026-07-26

- PF16-Status auf Commit `ec18fcb8f`, lokale Main-Integration und Cleanup
  aktualisiert.
- Neutralen P6-Liquiditätsplan als engen befristeten
  Übergangs-/Sicherheitsvertrag statt Zielarchitektur eingeordnet; Draw bleibt
  ausgeschlossen, der Zielzustand bindet Basic Credit an einen fachlichen
  Economy-Plan oder exakten Parentbedarf.

### 0.7 – 2026-07-25

- PF15 nach Commit `4b0c459f6` und vollständig grünem Code-Freeze-Gate als
  erreicht dokumentiert; veraltete Zwischenstände zu Blink, Jenny Jett,
  Central-Defense-Facts und noch ausstehenden Vollgates entfernt.
- Tactical Goals als typisierte, kurzlebige und exakt `stateVersion`-
  gebundene Goal-/Threat-Signale formalisiert. Persistente Handlungsautorität
  bleibt ausschließlich bei Planinstanzen; Signale mit stale/future
  Zustandsbindung oder Action-Autoritätsfeldern scheitern fail-closed.
- Strategic-Intent-Override und Intent-Mutation getrennt: P1–P3 benötigen
  belastbare Evidence, P4/P5 Intent-Fit oder explizite taktische Evidence;
  Intent-Wechsel bleiben auf stabile Revalidierungsgrenzen beschränkt.
- Den erreichten globalen ICE-/Score-Schutz-, HQ-/R&D-Fakten-, Hold-/Bluff-,
  Engine-Nahgleichstands-, Run-Window-, Agenda-Phasen- und
  Loan-from-Chiba-Vertrag mit dem produktiven Stand abgeglichen.
- Finale PF15-Shards, Engine-, Checkpoint-, Hidden-Info-, Authority-,
  Replay-, Source-/Package- und Standard-Baseline-Evidence aufgenommen und
  den PF16-Importgraph-Cleanup abgeschlossen: Der produktive Livegraph ist
  frei von alten TacticalGoal-, SemanticChoice-, PracticalMicro-,
  TacticalPlan-Memory- und TacticalPlan-Override-Abhängigkeiten; historische
  Verträge bleiben nur in isolierter Test-/Evaluationsdiagnostik.
- PF16-Final-Review, Wissenspflege und Pre-Commit-Gates abgeschlossen; nur
  PF16-Commit, Main-Abgleich und integrierte Abschlussgates verbleiben.

### 0.6 – 2026-07-25

- PF15-Status nach den fokussiert verifizierten SMC-, Broker-,
  Loan-from-Chiba-, Nullkosten- und Zentralreserve-Härtungen aktualisiert.
- Den Engine-seitig vollständigen Jenny-Jett-Quote-/Revalidation-Vertrag als
  umgesetzt ausgewiesen; der AI-Consumer bleibt bis zu seinem eigenen Gate
  ausdrücklich offen.
- Den realen Fast-Advance-Seed-09-Fortschritt und die verbleibende exakte
  Mehr-Blink-Wahrscheinlichkeitslücke statt der geschlossenen früheren
  Coverage-Fehler dokumentiert.
- HQ-/R&D-Faktenabwägung und atomare Nahgleichstandsrandomisierung weiterhin
  als offene PF15-Umsetzung markiert; keine vorzeitige Abschlussbehauptung.

### 0.5 – 2026-07-25

- Zielvertrag mit dem tatsächlichen PF15-Worktree abgeglichen und bereits
  implementierte, noch baseline-auffällige sowie noch offene Teile getrennt
  ausgewiesen.
- Agenda-Install/Advance/Score als Phasen derselben exakten
  `corp.score_agenda`-Instanz festgelegt; fehlende Zukunftsprojektion begrenzt
  Commitmentclaims, entwertet aber keinen vollständig Engine-gequoteten
  aktuellen Advance-Step.
- Globale HQ-/R&D-Allokation um der Corp bekannte Agendaanzahl und -punkte,
  wichtige trashbare HQ-Karten, serverspezifischen Multiaccess,
  Zugriffssondereffekte und Runhistorie präzisiert.
- Bewusstes Zurückhalten von HQ-ICE bei belastbarem R&D-Fokus als
  planinterner Hold-Vertrag beschrieben, einschließlich höherrangiger
  Gegenfälle und Verbot einer wirkungslosen R&D-Scheininstallation.
- Die frühere Zentralreserve auf einen ausschließlich von
  `corp.defend_servers` besessenen, endlichen Engine-gequoteten Need reduziert;
  Score-/Remote-Parents dürfen ihn nur exakt delegieren, gedruckte Kosten- und
  Definitionsfallbacks sind ausgeschlossen.
- Nahgleichstandsvariation auf Same-Step-Routen begrenzt und als atomarer,
  vollständig vorvalidierter Engine-RNG-Übergang mit kandidatenexakten
  Choices und Commitmentprojektionen, `RandomDrawRecord`, Replay- und
  StateHash-Vertrag festgelegt.

### 0.4 – 2026-07-25

- Kernentscheidung „nur Pläne handeln“ verschärft: Actions sind
  ausschließlich aktuelle Step-Routen; unbindbare Kandidaten zählen nicht
  als Coverage.
- `corp.defend_servers` als einziger globaler, serverübergreifender
  ICE-Allokator festgelegt; das frühere ICE-Platzierungsmodul auf
  `ICE × Server`-Sensor-Facts und weiche Fit-Werte ohne Recommendation, Veto,
  Hold, Policy oder Ownership begrenzt.
- Score-Schutz auf explizite Parent-Delegation mit geerbter Prioritätsklasse,
  exakter Effektprojektion und Engine-zertifizierten Kosten-/Reservequotes
  festgelegt; Layerzählung, Scoreboni und gedruckte Rez-Kosten als
  Entscheidungsersatz ausgeschlossen.
- `funding_only` vom echten Effektmangel getrennt: reine Finanzierungslücken
  fordern Economy-Support an und dürfen keinen zielgerichteten Defense-Draw
  erzeugen; unbekannte oder unvollständige Facts bleiben fail-closed.
- Basic Credit auf endliche Reserven, konkrete Parent-Fundingbedarfe und den
  eng typisierten, pro Zug endlichen P6-Liquiditätsplan begrenzt; freie
  Credit- und „do something“-Fallbacks bleiben entfernt.
- Run-, Access-, Jack-out-, Pump- und Break-Actions an explizite
  planlokale Assessments mit `Default-Deny` bei fehlender Bewertung gebunden.
- Choice-Payload-Auflösung als zulässige Nachbearbeitung einer bereits
  gewählten Action abgegrenzt; Änderung von `actionId` oder Planwahl
  verboten und fehlende Domainlogik fail-closed.
- Standard-`EndTurn` auf explizite Completion-Pläne, Route-Wert `−10000` und
  strukturelle Restkapazitätsbelege begrenzt.
- Fallbackverträge auf vollständig definierte regelkonforme Normalzustände
  beschränkt; Planabdeckungs-, Assessment-, Mapping- und Schedulerfehler
  dürfen nicht kaschiert werden.

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
- Laufenden Umsetzungsabgleich ergänzt: Valu-Pak als resident vorbereitete, ganzheitlich
  projizierte Commitment-Sequenz präzisiert; exakte aktuelle Action-Varianten,
  ausschließliche `actionIds`-Materialisierung und widerspruchsfreie
  Disposition als harter Route-Head-Vertrag festgehalten.
- Weitere Zielverträge für echtes Runner-Run-Funding, gebundenen Broker-Cashout mit
  Handpuffer, instanztreue Ambush-Routen, Chester Mix als
  Rez-Install-Commitment sowie getrennte Dr.-Dreff-/Jenny-Jett-Modelle
  ergänzt.
- Coverage- und Variantenvertrag weiter gehärtet: familienheuristische
  `actionPlanOwnerships`-Abdeckung entfernt; jede freiwillige LegalAction
  verlangt eine aktuelle Route oder genau eine konkrete Disposition.
  Same-Server-Funding, terminaler Floor, globale ICE-Allokation,
  `decline_rez`, expliziter Ambush-CorpIntent, aktive Valu-Pak-
  Executorbindung und nicht-endliche Vertragswerte sind als fail-closed
  Gegenfälle festgeschrieben.

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
