# Runner-Planbindung und Economy-Route Evidence 2026-07-06

Status: paketierte Umsetzung freigegeben

## Match

- Match-ID: `match_779a04a679f02d14`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: read-only über Node 24 `node:sqlite` / `DatabaseSync`
- Modus: `human_corp_vs_runner_ai`
- Analysierte KI-Seite: Runner
- Status: `finished`
- Gewinner: Corp
- Endgrund: `agenda_points`
- Seed: `match-mr9h561n-1wernbq`
- Finaler StateVersion: `266`
- Finaler StateHash: `fnv1a:ced5c0c8`
- Zeitfenster: erstellt `2026-07-06T19:52:24.710Z`, aktualisiert `2026-07-06T20:10:54.392Z`
- Umfang: 267 Events, 267 StateSnapshots, 149 AI-Decision-Traces, Detailed Trace Mode

## Side-Safety-Grenze

Die Befunde unten verwenden nur PublicEvents, PlayerView-nahe Snapshots, LegalActions und redigierte AI-Decision-Traces. Später sichtbar gewordene Karteninhalte werden nur als Folgebeobachtung beschrieben und nicht als damalige Entscheidungsgrundlage vorausgesetzt.

## Spielentscheidende Sequenz

- Event 26: Runner stiehlt früh `Project Zurich`.
- Event 77: Corp scored `Security Purge`.
- Event 239: `Vapor Ops` bewegt Counter in Remote 1.
- Event 240: 9 Counter werden auf `Project Babylon` bewegt.
- Event 241: Corp scored `Project Babylon`; Corp steht bei 4 Agenda-Punkten.
- Events 250-252: Corp advanced Remote 1 dreimal.
- Decision 144 / StateVersion 254: Runner hat 7 Credits und 4 Klicks. `runner.start_run.remote_1` ist legal und in den Alternativen sichtbar, verliert aber gegen `runner.start_run.archives`.
- Events 261-266: Corp zieht/installiert/advanced, bewegt mit `Vapor Ops` 4 Counter auf `Corporate Retreat`, scored und gewinnt.

## Trace-Evidence

### Fehlende Planbindung

Relevante Trace-Zähler im Match:

- `tactical_plan_memory`: 0
- `runner.contest_remote_if_score_threat`: 0
- `runner.obtain_breaker_coverage`: 46
- `runner.build_credit_base`: 14
- `runner.build_economy_base`: 20
- `semantic_strategic_action_fit`: 59
- `runner.start_run.remote_1`: 80

Interpretation:

Die Runner-KI sah Remote 1 oft als mögliche Aktion, bildete aber im Trace keinen belastbaren Remote-Contest-Plan mit PlanMemory. Coverage- und Economy-Ziele liefen sichtbar, wurden aber nicht stabil an das akute Remote-Ziel zurückgebunden.

### Decision 144 / StateVersion 254

Aus den AI-Traces:

- Gewählte Aktion: `runner.start_run.archives`
- Bessere sichtbare Alternative: `runner.start_run.remote_1`
- Remote 1 war legal anwählbar und akut, weil die Corp unmittelbar zuvor Remote 1 mehrfach advanced hatte und schon 4 Agenda-Punkte hielt.
- `runner.start_run.remote_1` erhielt starke positive Komponente `runner_remote_root_threat=1250`.
- Dieselbe Alternative wurde durch `runner_visible_ice_path_cost=-1670` auf einen negativen Gesamtscore gedrückt.
- Archives gewann unter anderem durch `runner_archives_hidden_cards=700` und `runner_free_server_path=350`.

Bewertung:

Ein opportunistischer Archives-Run darf ein akut scorebares Remote nicht verdrängen. Wenn der Remote-Pfad erreichbar ist, muss der Plan Remote contesten. Wenn der Pfad nicht sinnvoll bezahlbar ist, muss der Plan ein Funding- oder Coverage-Subziel wählen und danach zum Remote-Contest zurückkehren.

### Economy- und Coverage-Schleife

In mehreren Entscheidungen wurde `runner.obtain_breaker_coverage` mit hohem festen Fit bewertet. Beispielhafte Komponente:

- `runner_goal_fit_coverage_search=1400`

Die KI suchte oder spielte wiederholt in Richtung Breaker/Coverage und fiel danach wieder in allgemeine Economy-/Credit- oder zentrale Runs zurück. Der fehlende Plananker ist nicht die einzelne Coverage-Aktion, sondern die fehlende Rückbindung:

- benötigter Server: Remote 1;
- benötigte Zugänglichkeit: sichtbarer ICE-Pfad;
- benötigtes Funding: Run-Kosten und Reserve;
- nächster Plan-Schritt: nicht beliebiger Credit, sondern Deckroute oder Remote-Contest.

### Deckstrategie und Economy

Die aktuelle Economy-Behandlung ist zu flach:

- Generisches `gain_credit` darf nur kurzfristiger Fallback sein.
- Wenn die Deckstrategie bessere Economyquellen kennt, muss der Plan diese Route bevorzugen:
  - Burst-/Prep-Economy, wenn sie legal verfügbar ist;
  - Bank-/Broker-Werkzeuge, wenn sie installierbar oder nutzbar sind;
  - installierte oder installierbare Economy-Engine, insbesondere Aktionen mit besserem Gegenwert als 1 Credit pro Klick;
  - recurring oder action-based Economy, soweit sie side-safe aus Deck-/Hand-/Rig-/LegalAction-Signalen ableitbar ist.

## Fehlergruppen

### Punkt 1: Remote-Contest-Plan wird nicht gesetzt

Beschreibung:

Bei Decision 144 / StateVersion 254 lag ein akut scorebares Remote 1 vor. Die KI wählte dennoch Archives. Die bessere sichtbare Alternative war ein Run auf Remote 1 oder, falls unfinanzierbar, ein unmittelbar darauf bezogenes Funding-/Coverage-Ziel.

Betroffene Schicht:

- Tactical Planer
- Semantic Runtime
- Score-Komponenten für Run-Targets
- Regressionstests

Akzeptanzkriterium:

Bei fortgeschrittenem Remote mit Score-Gefahr und legalem Remote-Run darf Archives/HQ den Remote-Contest nicht verdrängen, nur weil der Server billig oder frei ist.

### Punkt 2: PlanMemory/Planfortsetzung ist nicht wirksam

Beschreibung:

Der Trace enthält keine `tactical_plan_memory`-Treffer. Subziele wie Coverage und Economy werden zwar erzeugt, aber nicht als Fortsetzung eines Remote-Plans sichtbar priorisiert.

Betroffene Schicht:

- Tactical Plan Memory
- Plan Candidate Mapping
- Semantic Choice Ranking

Akzeptanzkriterium:

Ein Remote-Contest-Plan muss über mehrere Runner-Klicks stabil bleiben: erst Funding/Coverage, dann Remote-Run, solange der Remote nicht invalidiert ist.

### Punkt 3: Economy-Plan ist nicht deckstrategieabhängig

Beschreibung:

Die Economy-Entscheidung arbeitet zu stark mit allgemeinem Credit-Aufbau. Die Deckstrategie muss vorgeben, ob die KI Burst-Preps, Broker/Bank, Recurring-Economy oder eine installierbare Economy-Engine sucht und verwendet.

Betroffene Schicht:

- Deck Capability Profile
- Runner Strategic Intent
- Runner Hand Development
- Tactical Credit/Economy Plans

Akzeptanzkriterium:

Wenn eine sichtbare legale Economy-Engine oder Bank-/Broker-Route zur Deckstrategie passt, wird sie gegenüber einfachem `gain_credit` bevorzugt, solange kein dringender Run sofort gewonnen werden muss.

### Punkt 4: Opportunitäts-Interrupts brauchen Grenzen

Beschreibung:

Zentrale oder billige Runs sind grundsätzlich sinnvoll, besonders bei R&D-Druck-Decks. Sie dürfen aber keinen akut scorebaren Remote-Plan brechen. HQ hat niedrigere Priorität als ein Remote, über das die Corp sofort gewinnen oder stark vorlegen kann.

Betroffene Schicht:

- Strategic Intent
- Tactical Plan Override
- Semantic Choice Ranking

Akzeptanzkriterium:

R&D-/HQ-Runs bleiben erlaubt, wenn kein akuter Remote-Contest-Plan aktiv ist oder der Remote-Plan sichtbar invalidiert wurde. Bei akutem Remote-Druck blockiert der Plan opportunistische zentrale Runs.

## Regression-Scope

Fokussierte Tests sollen mindestens abdecken:

1. Runtime-Aktionswahl: legaler Remote-1-Run bei scorebarem Remote gewinnt gegen freien Archives-Run.
2. Runtime-Aktionswahl: wenn Remote-Run aktuell zu teuer oder Coverage unvollständig ist, wählt die KI ein Remote-bezogenes Funding-/Coverage-Ziel statt Archives/HQ.
3. Economy-Route: installierbare oder nutzbare Economy-Engine/Bank-Route wird gegenüber einfachem `gain_credit` bevorzugt, wenn sie zur Deckstrategie passt.
4. Gegenfall: Ohne Remote-Score-Gefahr darf eine zentrale R&D-/HQ-Strategie weiterhin opportunistische Runs wählen.

## Nicht-Ziele und Folgepunkte

- Keine Änderung an verdeckten Kartendaten oder PlayerView-Sichtbarkeit.
- Keine vollständige Neubewertung aller Runner-Deckstrategien in diesem Paket.
- Falls eine konkrete Economyquelle keine LegalAction oder keine Semantik liefert, entsteht ein separates Hint-/Engine-Folgepaket.
