# AI Plan-first Runtime Cutover – Final Review

Status: **abgeschlossen; lokal auf `main` integriert**

Stand: 2026-07-25

Abschlussintegration: `main` über `94051e77e` (historischer Arbeitsbranch
`codex/ai-plan-first-runtime-cutover` entfernt)

PF15-Code-Freeze: `4b0c459f6`

## 1. Reviewurteil

Der produktive NETGRID-KI-Live- und Simulationspfad ist auf Plan-first
umgestellt. Persistente Handlungsautorität besitzen ausschließlich residente
`PlanInstance`s. Die Auswahlkette bleibt durchgängig an Plan, Phase, Step,
Capability, Target und vorhandenen aktuellen Route Head gebunden.

Die frühere Action-over-Plan-Arbitration, neutrale Credit- und
Kaschierungsfallbacks, produktive TacticalGoal-/TacticalPlan-Memory- und
SemanticChoice-Override-Pfade sowie die globale Corp-Zentralreserve sind aus
der Handlungsautorität entfernt. Unvollständige Identität, Kosten,
Engine-Quotes, Hidden-Info-Fakten oder Planabdeckung scheitern fail-closed.

PF15 ist vollständig verifiziert und committed. PF16 hat den Legacy-Livegraph
bereinigt, den kurzlebigen Goal-/Threat-Signalvertrag und die
Strategic-Intent-Revalidierung präzisiert sowie Wissen und Status an den
erreichten Stand angeglichen. Alle PF16-Pre-Commit-Gates einschließlich der
finalen Behavior-Baseline sind grün. PF16 wurde als `ec18fcb8f` committed,
der aktuelle lokale `main` defensiv abgeglichen und die geprüfte Integration
als `94051e77e` lokal auf `main` abgeschlossen. Der zugehörige Worktree und
der gemergte Arbeitsbranch sind anschließend verifiziert entfernt worden.

## 2. Autoritativer Endvertrag

```text
Deckstrategie
→ Strategic Intent
→ aktuelle side-sichere Goal-/Threat-Signale
→ Planproposals und residente Planinstanzen
→ PlanAssessment und validierter Priority Claim
→ Root-Foreground und genau ein Leaf-Executor
→ Step
→ aktuelle semantische Route
→ vorhandene LegalAction
→ applyAction
```

Dabei gelten folgende Grenzen:

- `TransientPlanSignal` ist kurzlebige, an Seite und aktuelle
  `stateVersion` gebundene Evidence ohne Memory-, Step-, Capability-, Route-
  oder Action-Autorität.
- Assessment- oder Override-Einfluss setzt die exakte Bindung aus
  Planmodul, residentem `dedupeKey` und Ziel voraus. Targetlose,
  modul-, instanz- oder zielfremde Signale geben keine taktische Evidence.
- Der Scheduler bindet Signale aus dem aktuellen Runtimekontext; ein
  Planmodul darf sie nicht selbst in sein Assessment injizieren.
- Produktive Signalquellen bestehen für Runner-Remote-Contest,
  Runner-Survival, Terminal Wins und Corp-Scoreprojekte. Produktiv belegt ist
  insbesondere die exakt gebundene taktische P4-Zulassung für Remote-Contest.
- P1–P3 dürfen einen abweichenden Strategic Intent nur mit belastbarer
  aktueller Evidence übergehen. P4/P5 benötigen Intent-Fit oder ein exaktes
  aktuelles taktisches Signal.
- Plan-Override und Intent-Mutation sind getrennt. Intent-Revalidierung kennt
  ausschließlich `phase_change`, `new_information`, `plan_completed` und
  `plan_invalidated`. Normale Action-/Assessmentwerte und ein hochklassiger
  Claim sind keine zusätzlichen Wechselgründe.
- Produktiv angeschlossen ist aktuell der öffentliche Abschluss der
  Setup-/Mulliganphase als stateVersion-genauer `phase_change` für beide
  Seiten. Die übrigen typisierten Gründe benötigen jeweils einen eigenen
  side-sicheren Live-Evidence-Produzenten.

## 3. Fachliche Akzeptanzmatrix

| Bereich | Verifizierter Endstand |
| --- | --- |
| Corp-Verteidigung | `corp.defend_servers` ist die einzige serverübergreifende ICE-Allokationsautorität. Das frühere Platzierungsmodul liefert nur Fakten. |
| HQ/R&D-Priorisierung | Vollständige Corp-bekannte Agenda-/Punktwerte, wichtige trashbare HQ-Karten, serverspezifischer Multiaccess und Zugriffseffekte fließen ein; belegter HQ-Hold-/Blufffall und Engine-zertifizierter Same-Step-Nahgleichstand sind abgedeckt. |
| Score-Schutz | Child-Step des exakten `corp.score_agenda`-Parents; Parent-first-Auswahl und P1–P4-Vererbung; Effekt, Finanzierung und Reserve getrennt. |
| Defense-Kosten | Ausschließlich vollständige, aktuelle, an Karteninstanz, Server, Action und `stateVersion` gebundene Engine-Quotes; keine gedruckten `rezCost`-Fallbacks. |
| Agenda-Fortentwicklung | Install, Advance und Score bleiben Phasen derselben Instanz. Ein nur mit Klickkosten ausgewiesener Advance kostet exakt null Credits und ist ausführbare Planfortentwicklung. |
| Funding | `funding_only` erzeugt Economy-Support desselben Parents und keinen Targeted Draw. Fremde feasible Projekte unterdrücken den Funding-Need nicht. |
| Runner-Runs | Run, Access, Pump, Break, Jack-out und zusätzliche Zugriffsschritte benötigen exakte planlokale Assessments; mehrstufige Fenster behalten ihren Parent. |
| Loan from Chiba | Erwerb und Entwicklung über Economy; Halten, Verlassen und Engine-gequotete End-of-turn-Zahlung über einen instanzgenauen `runner.resource_lifecycle`-Child. |
| Choice/Continuation | Ungebundene Choice-Aktionen werden vor Ausführung ausgeschlossen; strukturierte Engine-Continuation-Identität bleibt als Folgepunkt sichtbar. |
| Hidden Info | Plan-, Quote-, Signal-, Revalidation-, Checkpoint- und Baselinepfade bleiben side-safe und redigiert. |
| Replay/RNG | Same-Step-Nahgleichstände werden erst nach vollständiger Engine-Revalidation atomar gezogen und über `RandomDrawRecord` replaybar gehalten. |
| EndTurn | Fail-closed Planabdeckung und aktuelle Guards sind verifiziert; der normative Quellenkonflikt zwischen MVP-Konzept, Engine und Comprehensive Rules bleibt separat blockierend dokumentiert. |

## 4. PF16-Legacy- und Importgraph-Cleanup

Der öffentliche transitive Live-Aktionsgraph enthält keine alten
TacticalGoal-, SemanticChoice-, PracticalMicro-, TacticalPlan-Memory- oder
TacticalPlan-Override-Abhängigkeiten. Öffentliche TacticalGoal-Exporte und
`ownRunnerTacticalGoals` sind entfernt. Live und Simulation verwenden
denselben Plan-first-Einstieg. Der öffentliche Simulationsadapter importiert
keinen Legacy-TacticalPlan-Memory-Snapshot mehr und setzt diese alte Memory
auch nicht zurück.

`semantic-runtime.ts` bleibt ausschließlich als isolierter historischer
Test-/Evaluationsharness erhalten. Authority- und Module-Boundarytests
verhindern eine produktive Rückkopplung. Diese Quarantäne ist Diagnosebestand
und keine parallele Runtime.

## 5. Gate-Evidence vor Main-Abgleich

| Gate | Ergebnis |
| --- | --- |
| Vollständige AI-Vitest-Shards | grün: 496/496 Testdateien, 3.966/3.966 Tests |
| Vollständige Engine-Tests | grün: 207/207 Testdateien, 1.795/1.795 Tests |
| Manhunt-Checkpoint-Regressionsschutz | grün: 3/3 Dateien, 29/29 Tests |
| Workspace-Typecheck | grün: Shared, Catalog, Engine, Decks, AI, Server und Web |
| Contract-Gate | grün: Shared 14/14, Specs 8/8, vollständige Testdateierkennung |
| Package Boundaries | grün: 1.948 Dateien |
| AI Source Structure | grün: 726 Produktionsdateien, 0 Runtime-Zyklen, 0 Typzyklen |
| `check:ai` | grün: Hint-Metadata `pass`, 0 harte Fehler |
| Deck Doctrine | grün: 5 Deckprofile |
| Proteus AI Readiness | grün: 154 Karten, 154 Hints, `default_pool_ready` |
| PF16 Behavior Baseline | grün: 60 Spiele, 11.012 Entscheidungen, 0 harte Fehler |
| WIP-Autoritätsaudit | grün: Legacy-Ist/Zieltrennung, Signalbindung, vier Intent-Revalidierungsgründe, Producer-Scope, Domain-Fact-Abgrenzung und Statussprache geprüft |
| `git diff --check` | grün |

Abgebrochene oder nur durch Tooltimeout beendete Prozesse gelten nicht als
Gate-Evidence. Sämtliche hier aufgeführten Läufe wurden mit regulärem
Exitcode 0 abgeschlossen.

## 6. Behavior-Baseline

Die verifizierte PF15-Code-Freeze-Baseline wurde im vollständigen damaligen
PF15-Arbeitsbaum auf Parent `527833085` erzeugt; genau dieser Arbeitsstand
wurde anschließend mit `4b0c459f6` committed. Sie umfasst:

- 60 Spiele;
- 11.012 Entscheidungen;
- 0 Illegal Actions;
- 0 Replay-, Runtime-, Hidden-Info-, Fallback-, Timeout-,
  Action-Limit- oder No-LegalAction-Fehler;
- 175 qualitative Findings, darunter drei HIGH-Fälle
  `corp_never_scores` und zwei `gameEndReason=unknown`-Anomalien.

Die qualitativen Findings bleiben Review- und Play-Strength-Evidence. Sie
werden nicht als technische Gatefehler kaschiert, solange alle harten
Verträge grün bleiben.

Die finale PF16-Pre-Commit-Baseline misst den vollständigen dirty
PF16-Arbeitsbaum auf HEAD `4b0c459f6`. Der Report kann uncommittete
Arbeitsbaumänderungen nicht in seinem `gitHead` ausdrücken; der spätere
PF16-Commit bindet exakt diesen geprüften Inhalt. Nach dem Commit wird
derselbe Lauf commitgenau wiederholt. Nach Entfernung der letzten
Legacy-TacticalPlan-Memory-Referenzen aus dem öffentlichen
Simulationsadapter wurde der Pre-Commit-Lauf erneut ausgeführt und bestätigte
dieselben Werte.

| Metrik | PF16 final |
| --- | ---: |
| Spiele | 60 |
| Entscheidungen | 11.012 |
| Findings | 175 |
| Findings / 100 Entscheidungen | 1,589 |
| Illegal Actions | 0 |
| Replay-Fehler | 0 |
| Action-Limit-Spiele | 0 |
| Fallback-Aktionen | 0 |
| Timeout-Aktionen | 0 |
| Runtime-Fehler | 0 |
| Hidden-Info-Findings | 0 |
| No-LegalAction-Fehler | 0 |
| Missed Score Windows | 0 |
| Clearly Dominated Plan Choices | 0 |
| Premature Runner End Turns | 0 |
| Redaction safe | ja |

Weitere Diagnosewerte: Plan Conversion Rate `0,670`, Strategic No-progress
`802` beziehungsweise `7,283/100`, Advanced Remote Contest Skip `98/129`
beziehungsweise `0,760`. Diese Werte entsprechen dem verifizierten
PF15-Code-Freeze-Verhalten; PF16 verändert Autoritäts-, Signal- und
Kompositionsverträge, nicht die akzeptierte Play-Strength-Schwelle.

## 7. Sichtbare Restpunkte

Diese Punkte blockieren den technischen Plan-first-Cutover nicht, bleiben
aber ausdrücklich sichtbar:

1. `ChoiceRequest` und LegalAction benötigen langfristig eine gemeinsame
   strukturierte `originActionId` oder `continuationId`, damit mehrstufige
   Planaktionen nicht dauerhaft `choice.source` parsen müssen.
2. Der normative EndTurn-/Timingquellenkonflikt muss durch einen ausdrücklich
   benannten führenden NETGRID-Regelvertrag aufgelöst werden.
3. Die PF15-/PF16-Baselinefindings zu Corp-Scoringstärke,
   Remote-Contest-Selektivität, No-progress-Clustern und unbekannten
   Spielendgründen bleiben Eingang für getrennte Play-Strength-Pakete.
4. Zusätzliche Live-Produzenten für `new_information`, `plan_completed` und
   `plan_invalidated` dürfen nur mit side-sicherer, aktueller Evidence
   ergänzt werden; der Typvertrag allein simuliert keinen Trigger.

## 8. Abschlussentscheidung

Alle PF16-Pre-Commit-Gates einschließlich des finalen
Behavior-Baseline-Laufs sind grün; dieses Review enthält den exakten
Laufstand. Der Paketprozess wurde vollständig abgeschlossen:

1. PF16 wurde als `ec18fcb8f` committed;
2. der aktuelle lokale `main` wurde defensiv in den Arbeitsbranch abgeglichen;
3. die relevanten integrierten Abschlussgates wurden erneut ausgeführt;
4. die lokale Integration nach `main` liegt als `94051e77e` vor;
5. der Main-Stand wurde sauber geprüft;
6. der Cutover-Worktree wurde verifiziert entfernt;
7. der gemergte Arbeitsbranch wurde gelöscht.

Das übergeordnete `/Goal` ist damit abgeschlossen. Remote-Push oder
Pull-Request waren nicht Teil dieses Abschlusses.
