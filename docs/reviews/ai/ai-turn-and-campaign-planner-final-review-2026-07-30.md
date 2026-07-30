# KI-Zug- und Kampagnenplaner – Abschlussreview

Stand: 2026-07-30

Pakete: ZK00 bis ZK14 einschließlich ZK10a

Status: **angenommen**

## Ergebnis

Corp und Runner führen freiwillige produktive Entscheidungen jetzt über
einen validierten `TurnPlan` aus. Planmodule melden ausführbare Planning
Heads und ihren fachlichen Wert; der TurnPlanner entscheidet über eine
kohärente Restzuglinie. Nur der aktuelle, erneut gegen die aktuellen
`LegalActions` rematerialisierte Head erhält Ausführungsautorität.

Der erreichte Vertrag umfasst:

- deterministisch begrenzte Restzuglinien mit mehreren geordneten Phasen;
- `TurnPlanCommitment`, aktuelle Execution Lease und typisierte
  Replangründe;
- Informations-, Gegnerreaktions-, Engine-Fortsetzungs- und
  Zufallsgrenzen;
- zugübergreifende Agenda-, Defense- und Opening-Rush-Kampagnen;
- gegnerzugübergreifende öffentliche Outcomes, Interrupts und
  Wiederaufnahme;
- getrennte vollständige Corp- und Runner-Coverage ohne stilles
  Produktivfallback;
- aktuelle Zugabschlusszertifikate statt projizierter
  EndTurn-Erlaubnisse.

Konkrete bekannte Karteninstanzen, Server, Fähigkeiten, Targets und Choices
dürfen in einem Plan gebunden werden. Zukünftige Action-IDs werden nicht
gespeichert. Draw, Suche, öffentlicher Zufall oder gegnerische Reaktion
beenden den konkreten Plan an der passenden Grenze und lösen danach eine
Neuplanung aus.

## Architekturprüfung

- **Engine-Autorität:** Der Planner erzeugt keine LegalActions. Die aktuelle
  Action und ihre Choices werden vor Ausführung rematerialisiert; die Engine
  revalidiert und vollzieht sie weiterhin allein.
- **Ownership:** Jede freiwillige aktuelle Action besitzt genau einen
  ausführbaren Modul-Owner oder eine explizite Disposition. Der im
  Runner-Baselinelauf gefundene Night-Shift-Konflikt zwischen Defense-Draw
  und Economy wurde als modulübergreifender Dispositionsfehler behoben und
  regressionsgebunden.
- **Determinismus:** Suchbudget, Partitionen, Pareto-Fronten, Reihenfolge,
  Planner-RNG und Game-Effect-RNG sind deterministisch getrennt. Gleiche
  Inputs und Seeds ergeben gleiche Linie, Choices, Records und Replay.
- **Persistenz:** Zugcommitments bleiben serverprivat. Kampagnen überleben
  Zug- und Gegnerwechsel; ein Runtime-Neustart stellt das residente
  Portfolio wieder her und erzeugt den Restzugplan aus dem aktuellen Zustand
  neu.
- **Cutover:** Corp und Runner verwenden standardmäßig `cutover`.
  `legacy_compare` ist ausschließlich ein expliziter Test- und
  Diagnosemodus und kein stiller Fallback.

## Private Buganzeige

Die privilegierte private Betreiber-Buganzeige zeigt absichtlich:

- vollständige Karten und Hände beider Seiten;
- Planning Heads, Varianten, Phasen und ausgewählte Linie;
- Commitment, Lease, Rematerialisierung und Replangrund;
- Coverage, Suchbudget, Kampagnenstatus und öffentliche Outcomes;
- Live-/Vergleichsdaten.

Für diese private Buganzeige gilt keine seitensichere
Informationsbeschränkung. Der Server-Restarttest prüft sowohl den aktuellen
`turn_plan_commitment`-Vertrag als auch vollständige Karteninstanz,
Definition und Titel für Corp und Runner. Normale PlayerViews, PublicEvents,
öffentliche Replays, Zuschauerpayloads und gewöhnliche Logs bleiben von
dieser Betreiberansicht getrennt.

## Testmatrix

Die vollständige Matrix aus Konzeptabschnitt 23 ist durch fokussierte
Vertragstests und den abschließenden Gesamtlauf abgedeckt:

- Zugkohärenz, D3–D5, Funding/Parent-Rückkehr, Phasenübergänge und
  Interrupts;
- Varianten, Dominanz, kanonische Reihenfolge, deterministische Budgets und
  getrennte RNG-Streams;
- Agenda, Opening Rush, Defense, ICE-Staging, Bluff und
  parentgebundene Economy;
- Draw-/Informationsgrenzen, Handkapazität, Retention und Cleanup;
- Kampagnenpersistenz, Gegnerzugreaktionen, Restart und Requote;
- LegalAction-/Choice-Rematerialisierung, Rules Context, Replay, StateHash
  und öffentliche Redaction;
- 100-Prozent-Coverage beider Seiten und getrennter Cutover.

## Performance

Auf zwei realen Corp- und zwei realen Runner-Decision-Checkpoints wurden
nach je 20 Warmups jeweils 400 alternierende Messungen pro Modus ausgeführt.
Gemessen wurde der vollständige `chooseAiAction`-Pfad einschließlich
Fachplanung, TurnPlanner und Debugaufbereitung:

| Seite  | Modus            |      p50 |      p95 |      p99 |   Maximum |
| ------ | ---------------- | -------: | -------: | -------: | --------: |
| Corp   | `legacy_compare` | 40,95 ms | 54,95 ms | 65,08 ms |  67,76 ms |
| Corp   | `cutover`        | 42,36 ms | 55,69 ms | 64,16 ms |  71,72 ms |
| Runner | `legacy_compare` | 59,58 ms | 75,51 ms | 94,64 ms | 100,49 ms |
| Runner | `cutover`        | 59,50 ms | 69,79 ms | 95,20 ms | 103,50 ms |

Das verbindliche Corp-Gate von p95 höchstens 75 ms ist erfüllt. Auf den
Runner-Endgame-Checkpoints ist der produktive Cutover im p95 nicht langsamer
als der Vergleichspfad. Die Wanduhr ist kein Suchbudget und beeinflusst
weder Suchende noch Rangfolge.

## Behavior Baseline

Der Runner-Cutover-Standardlauf umfasst 60 Spiele und 13.641
KI-Entscheidungen:

- null illegale Aktionen;
- null Runtime-, Replay-, Fallback-, Timeout-, Hidden-Info- oder
  No-LegalAction-Fehler;
- Plan-Conversion `0,667`;
- strategische No-Progress-Wiederholungen `3,827` je 100 Entscheidungen;
- keine klar dominierten Planentscheidungen.

Das einzige klassifizierte Action-Limit gehört zur bekannten
Runner-Spätspielklasse `runner_late_gain_credit_real_reserve`. Derselbe
Slot/Seed endet mit `maxActions=650` nach 501 Aktionen regulär durch
Corp-Agenda-Punkte. Es liegt kein technischer Plannerfehler vor; die
Play-Strength-Feinjustierung bleibt sichtbar.

Führende Baseline-Evidence:
`docs/reviews/ai/ai-behavior-baseline-v1-runner-turn-planner-cutover-2026-07-30.md`.
Vollständige Rohdaten bleiben unversioniert unter `data/local/`.

## Abschlussverifikation

- AI: 531 Testdateien, 4.338 Tests grün;
- Engine: 210 Testdateien, 1.822 Tests grün;
- Server: 23 Testdateien, 214 Tests grün;
- Shared: 1 Testdatei, 16 Tests grün;
- Web: 71 Testdateien, 725 Tests grün;
- gesamter Workspace-Typecheck: grün;
- `check:ai`: null Hard Errors,
  `production=748`, null Runtime- und Typzyklen;
- Engine-Source-Structure und Package Boundaries: grün;
- Proteus-Readiness: 154/154;
- Deck-Doctrine-Strategie-Gate: grün;
- Format- und Diff-Hygiene: grün.

## Verbleibende Punkte

- Die bekannte Runner-Spätspielklasse mit realer Reserve, aber sehr langer
  Creditfolge bleibt ein Play-Strength-Thema. Ihre Ursache ist klassifiziert;
  eine pauschale TurnPlanner-Sonderregel wäre nicht gerechtfertigt.
- `legacy_compare` bleibt vorerst als ausdrücklich gesetztes
  Diagnosewerkzeug erhalten. Es besitzt keine produktive
  Fallbackautorität.
- Neue Planmodule oder Kartenlinien müssen den bestehenden Owner-, Horizon-,
  Boundary- und Coverage-Vertrag erfüllen; sie rechtfertigen keine zweite
  Scheduler- oder Zugplanerschicht.
