---
activityId: act-2026-08-09-runner-turn-plan-sequence-commitment
status: inbox
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt:
completedAt:
branch:
releaseTarget: post-card-semantics-restructuring
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-Züge bis zu echten Erkenntnisgrenzen verbindlich planen

## Ziel

Der TurnPlanner soll einen Runner-Zug nicht nach jeder ausgeführten Aktion
faktisch neu unter konkurrierenden Root-Plänen vergeben. Soweit die
Entscheidungsgrundlage unverändert bleibt, wird eine fachlich zusammenhängende
Folge eigener deterministischer Aktionen als gebundene Restzugsequenz geplant
und ausgeführt. Neu geplant wird erst an einer typisierten Erkenntnis-,
Unterbrechungs-, Unmöglichkeits- oder Abschlussgrenze.

Das Paket stellt damit die ursprünglich beabsichtigte Planebene her: Ein Plan
besitzt nicht bloß die gerade nächste Aktion, sondern darf seine begründete
Folgeaktion gegen gleichrangige, bereits bekannte Alternativen behaupten.
Planbindung ist dabei keine starre Skriptausführung. Neue Informationen und
echte höherwertige Situationen müssen weiterhin eine nachvollziehbare
Replanung auslösen können.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, erster Runner-Zug, Entscheidungen
  2 bis 9.
- Der Zug wechselte nacheinander zwischen eigenständigen Root-Plänen:
  `runner.contest_remote`, `runner.develop_board_and_hand`,
  `runner.recurring_economy` und `runner.pressure_central:rd`.
- Entscheidung 6 installierte `Top Runners' Conference` als mehrzügiges
  Investment über `runner.recurring_economy`. HQ- und R&D-Run-Pläne waren zu
  diesem Zeitpunkt bereits bekannt.
- Entscheidung 7 startete unmittelbar danach über eine separate
  `runner.pressure_central:rd`-Instanz einen R&D-Run. Der regelgebundene
  Run-Start trashte die Conference, bevor sie auch nur einmal 2 Credits am
  Zuganfang erzeugen konnte. Keeper wurde anschließend rezzed und beendete
  den Run; der Runner hatte keinen installierten Icebreaker.
- Zwischen Installation und Run lag weder ein Draw, eine Suche, eine
  Zufallsauflösung, eine gegnerische Aktion noch neu aufgedeckte Information.
  Der Planwechsel entstand daher nicht an einer fachlichen
  Erkenntnisgrenze.
- Derselbe Bindungsverlust zeigt sich später in Runner-Zug 34,
  Entscheidungen 124 bis 126: `runner.develop_board_and_hand` nahm zweimal
  einen Credit, um eine konkrete `R&D Interface`-Instanz zu finanzieren, und
  meldete anschließend `development_funding_route_gap:0` sowie
  `development_funding_route_ready:true`. Sobald die Installation legal war
  und noch zwei Klicks zur Verfügung standen, verlor der Entwicklungsplan
  ohne neue Information die Ausführung an `runner.economy`; zugleich verwarf
  `runner.pressure_central` die Installation wegen eines fehlenden bereits
  gebundenen R&D-Zugriffsplans.
- Die fachliche Frage, ob und wann eine Access-Payoff-Karte installiert
  werden soll, gehört in
  `act-2026-08-10-runner-access-payoff-campaign-binding`. Für dieses Paket ist
  Zug 34 ein zweiter Architekturzeuge: Eine gebundene Funding-Folge darf
  ihren vorgesehenen nächsten Meilenstein nicht allein durch erneutes
  Ranking bereits bekannter Pläne verlieren.
- Zugriffe und aufgedeckte Karten früher im Zug können legitime
  Replan-Grenzen darstellen. Der Befund verlangt deshalb keine einzige starre
  Vier-Klick-Linie vom Zuganfang bis zum Zugende.
- Führendes Zielbild:
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md`, insbesondere
  TurnPlanner, Commitments, Resident Plans, Route Heads,
  `PlanExecutionOrigin` und typisierte Replan-Grenzen.

## Scope

- Current State von TurnPlanner, Commitment-/Lease-Vertrag,
  Restzugprojektion, Plan-Rematerialisierung und Preemption gegen das
  Planebenen-Zielbild prüfen und die konkrete Bindungslücke dokumentieren.
- Einen zentralen Vertrag festlegen, nach dem ein ausgewählter Root-Plan alle
  bereits begründbaren eigenen Folgeschritte bis zur nächsten typisierten
  Grenze materialisieren oder reservieren kann.
- Mindestens folgende Replan-Gründe explizit unterscheiden:
  - neue side-sichere Information nach Draw, Access, Search, Reveal,
    Zufallsauflösung oder gegnerischer Reaktion;
  - gewählte Route erfolgreich abgeschlossen oder nach Engine-Zustand
    unmöglich geworden;
  - eine neu entstandene, nachweislich höher priorisierte Notfall-,
    Matchpoint- oder Pflichtsituation;
  - Verbrauch oder Änderung einer Ressource, auf die die gebundene Route
    tatsächlich angewiesen war;
  - ausdrückliche planinterne Entscheidungsgrenze.
- Gleichrangige oder bereits vor Auswahl bekannte Alternativpläne dürfen eine
  bestehende Route nicht allein deshalb übernehmen, weil nach jeder Aktion
  erneut alle Planangebote gerankt werden.
- Planfortsetzung über Root, Planinstanz, Step, Route Head, Commitment und
  `PlanExecutionOrigin` nachvollziehbar machen. Eine Fortsetzung bindet immer
  die aktuelle Engine-LegalAction; sie speichert keine veraltete Action als
  Regelautorität.
- Für abgebrochene oder überstimmte Commitments strukturierte Diagnose
  ausgeben: bisheriger Owner, vorgesehener nächster Schritt, exakter
  Grenztyp, neue Evidence und übernehmender Owner.
- Den ersten Runner-Zug des Matches als fokussierte Regression verwenden,
  dabei die separate fachliche Conference-Bewertung nicht in den TurnPlanner
  hineinziehen.
- Runner-Zug 34 als zweite, fachlich getrennte Sequenzregression verwenden:
  Wenn ein Karten-Parent eine Funding-Folge rechtmäßig gebunden hat und der
  geplante nächste Meilenstein legal wird, muss die Sequenz entweder beim
  selben Root fortgesetzt oder an einer typisierten Grenze mit genauer
  Evidence beendet werden. Der TurnPlanner entscheidet dabei nicht selbst,
  ob `R&D Interface` strategisch installiert werden sollte.

## Nicht im Scope

- Kein Verbot von Replanning und keine starre Vorauswahl aller vier Klicks.
- Keine Annahme verdeckter Karten, unrezzter ICE-Fähigkeiten oder zukünftiger
  Zufallsergebnisse.
- Keine Karten-ID- oder Kartennamen-Sonderbehandlung für Loan from Chiba,
  Top Runners' Conference oder BBS Whispering Campaign.
- Keine zweite Strategieentscheidung in Choice-Resolvern, Action-Selektoren
  oder einem nachgelagerten Override.
- Keine Regeländerung an LegalActions, Run-Start, Access oder Zugende.
- Keine Umsetzung der eigenständigen Activities zur Trash-Bewertung oder zum
  Investitionshorizont von Top Runners' Conference.

## Akzeptanzkriterien

- [ ] Das Review benennt die aktuelle Schicht, die nach einer ausgeführten
      Aktion die bestehende Restzugbindung verliert, und belegt die Ursache
      anhand der Entscheidungen 6 und 7.
- [ ] Der Zielvertrag definiert positive Replan-Grenzen und behandelt
      „eine Aktion wurde ausgeführt“ nicht als hinreichenden Replan-Grund.
- [ ] Eine deterministische Folge eigener Aktionen ohne neue Evidence behält
      Root-Plan, Planinstanz, Route und `PlanExecutionOrigin`.
- [ ] Ein bereits bekannter gleichrangiger Plan kann die Folgeaktion nicht
      ohne typisierte Preemption und strukturierte Begründung übernehmen.
- [ ] Draw, Access, Search, Reveal, Zufall und gegnerische Reaktionen können
      an der passenden Stelle weiterhin regulär replannen.
- [ ] Planabschluss, nachgewiesene Unmöglichkeit sowie neu entstandene echte
      Matchpoint-, Pflicht- oder Notfallsituationen können eine Bindung
      sichtbar und deterministisch beenden.
- [ ] Die Regression verhindert im beobachteten unveränderten Zustand die
      widersprüchliche Folge `Conference installieren -> sofort Run starten`;
      die Karte wird dabei nicht im TurnPlanner namentlich erkannt.
- [ ] Die Regression zu Entscheidungen 124 bis 126 belegt, dass eine
      gebundene Funding-Sequenz nach Erreichen ihres Kostenmeilensteins nicht
      ohne neue Evidence still an einen allgemeinen Economy-Plan fällt. Ein
      fachlich begründeter Abbruch nennt Grenztyp, bisherigen Owner,
      vorgesehenen nächsten Schritt und übernehmenden Owner.
- [ ] Ein positiver Test belegt, dass ein neu entstandener höherwertiger
      Interrupt einen bestehenden Plan regelkonform übernehmen darf.
- [ ] Ein Grenztest belegt, dass nach einem Draw oder Access mit neuer
      side-sicherer Information neu geplant wird.
- [ ] Ownership-Tests sichern Plan, Step, Route, Action-ID und Executor;
      Resolver und Auswahl-Fallback werden nicht zur zweiten Autorität.
- [ ] Determinismus, Replay, StateHash, LegalAction-Bindung und Hidden-Info-
      Schutz bleiben erhalten.
- [ ] Fokussierte AI-Tests, erforderlicher AI-Typecheck, relevante
      Architekturgates und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Zuerst prüfen, ob die Linie bereits korrekt geplant, aber bei
  Rematerialisierung verloren wird, oder ob der TurnPlanner nur den ersten
  Schritt materialisiert. Der Ursachen-Fix gehört an diese Owner-Grenze.
- Eine Ausführungsbindung darf Engine-Quotes und aktuelle LegalActions nicht
  ersetzen. Nach jedem Zustandswechsel wird die vorgesehene Route gegen die
  neue Engine-Version erneut legal gebunden.
- Die Conference-Regression ist ein besonders sichtbarer Zeuge für den
  Architekturfehler, aber nicht seine fachliche Implementierung.

## Ergebnisnotiz

Noch offen. Das Paket beschreibt den systemischen Befund hinter dem
Planwechsel im ersten Runner-Zug.
