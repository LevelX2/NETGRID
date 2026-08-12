---
activityId: act-2026-08-09-risky-strategic-exchange-parent-binding
status: done
kind: architecture
area: ai-data
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt: 2026-08-12T23:34:04+02:00
completedAt: 2026-08-12T23:49:30+02:00
branch: codex/activities-ai-20260812
releaseTarget: post-card-semantics-restructuring
blockedBy:
  - laufende Kartenrestrukturierung und Konsolidierung der kanonischen Kartensemantik
resultArtifacts:
  - packages/ai/src/runtime/runner-canonical-card-facts.ts
  - packages/ai/src/runtime/runner-strategic-exchange.ts
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/engine/src/ability-engine/card-implementation-runtime-shared.ts
  - packages/engine/src/game/turn/runner-install-actions.ts
checks:
  - focused AI debt, parent-binding and lifecycle regressions
  - focused Engine Runner install LegalAction projection tests
  - AI typecheck checked with unrelated worktree/report baseline errors separated
  - Engine typecheck
  - git diff --check
---

# Risikobehaftete Austauschkarten nur an lohnende Parent-Pläne binden

## Ziel

Nach Abschluss der laufenden Kartenrestrukturierung dürfen Karten mit hohem
strategischem Vorteil und erheblicher Gegenleistung nicht als allgemein
positive Hand- oder Boardentwicklung gespielt werden. Ihre AI-Hints sollen
nur die nicht aus Kartendefinition und CardImplementation ableitbare
strategische Einordnung tragen. Ein generischer Planvertrag bindet ihren
Einsatz an einen konkreten, ausreichend lohnenden Parent-Plan.

`Loan from Chiba` ist der erste Regressionsträger: Die Karte darf nicht mehr
als eigenständige `runner.develop_board_and_hand`-Instanz mit dem Zweck
`economy_engine:acute` installiert werden. Sie soll nur eine konkret
begründete Finanzierungslücke eines aussichtsreichen Run-Plans schließen.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, Human Corp gegen Runner-KI,
  beendet am 09.08.2026.
- Entscheidung 5 installiert die erste Loan-Instanz über
  `runner.develop_board_and_hand` mit
  `source:own_runner_hand:card_specific_purpose:economy_engine:acute`.
  HQ- und R&D-Run-Pläne waren zu diesem Zeitpunkt blockiert; der danach
  gestartete R&D-Run gehörte zu einer separaten
  `runner.pressure_central`-Instanz und endete an Keeper.
- Entscheidung 60 installiert die zweite Loan-Instanz erneut über
  `runner.develop_board_and_hand` mit demselben Economy-Zweck. Der unmittelbar
  folgende erfolgreiche Run auf Remote 2 und der Diebstahl von
  `Marine Arcology` gehörten zu einer separaten
  `runner.contest_remote`-Instanz; die Loan-Nutzung war nicht an diesen
  Payoff gebunden.
- An 24 Runner-Zugenden verwarf `runner.complete_turn` die angebotene
  kartengebundene Aktion `Loan from Chiba trashen und Zug beenden` mit
  `runner_card_scoped_end_turn_missing_bound_lifecycle_contract` und wählte
  das normale Zugende. Beide Loans blieben dadurch bis zum Matchende liegen.
- In der späten Partie verschärfte dieser Lifecycle-Fehler die strategische
  Stagnation messbar: Zwei Loans entzogen zu Beginn jedes Runner-Zugs
  zusammen 2 Credits. Vier reine Credit-Aktionen erzeugten dadurch über einen
  vollständigen Zugzyklus nur 2 Credits Nettofortschritt.
- Nach dem gescheiterten R&D-Run in Zug 30 musste der Runner für den nun
  vollständig bekannten Pfad über `Cortical Scrub` und `Keeper` mit `Krash`
  ungefähr 20 Credits aufbauen. Trotz 38 späterer Economy-Entscheidungen
  erreichte er bis Zug 48 nur ungefähr 17 Credits, installierte kein
  `R&D Interface` und baute keine gebundene Exit-/Recovery-Linie für die
  beiden Loans auf.
- Sobald mindestens 10 Credits verfügbar waren, hätte der Lifecycle-Owner
  außerdem instanzbezogen prüfen müssen, ob das Bezahlen und Entfernen einer
  Loan die langfristige Nettoökonomie gegenüber weiterem Halten verbessert.
  Die fehlende Bindung verhinderte bereits diese fachliche Abwägung.
- Kartentext: `data/cards/originalset-v1-cards.json`,
  `onr_v1_168_loan-from-chiba`. Regelrelevante Fakten sind 12 Credits bei
  Installation, 1 Credit Verlust zu Beginn jedes eigenen Zugs sowie beim
  Verlassen 10 Credits zahlen oder das Spiel verlieren.
- Aktiver Hint: `data/ai/ai-card-hints-active.json`. Vorhandene strategische
  Einordnung unter anderem `strategicExchangeKinds: [debt_financing]`,
  `economy.high_risk_burst_credit` und `opportunityCost: high`.
- Aktueller Runtime-Bestand:
  `packages/ai/src/simulation/runner-economy-setup-types.ts` erkennt Loan noch
  direkt über `LOAN_FROM_CHIBA_CARD_ID`; dieser Einzelkartenpfad ist kein
  zulässiger Zielvertrag.
- Führende Planarchitektur:
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md`, insbesondere
  `runner.pressure_central`, `runner.contest_remote`,
  `runner.develop_board_and_hand` und `runner.economy`.
- Current-State-Vertrag: `docs/architecture/ai/README.md` ordnet Erwerb und
  Entwicklung von Loan dem Economy-Modul und Halten, Verlassen sowie
  Zahlungs-/Verlustrisiko einem instanzgebundenen
  `runner.resource_lifecycle`-Child zu.

## Scope

- Nach Abschluss der Kartenrestrukturierung den dann kanonischen Datenweg aus
  Kartendefinition, CardImplementation, Manifest und AI-Hints bestimmen und
  ausschließlich diesen Zielvertrag erweitern.
- Einen kleinen generischen Hint-/Semantikvertrag für risikobehaftete
  strategische Austauschkarten festlegen. Der Hint beschreibt nur die
  zusätzliche strategische Aussage, beispielsweise:
  - kann einen Plan finanzieren oder einen erheblichen Vorteil ermöglichen;
  - besitzt hohe Opportunitätskosten beziehungsweise eine erhebliche
    Gegenleistung;
  - ist nur mit einem konkret gebundenen, ausreichend lohnenden Parent-Plan
    zulässig.
- Regelwerte, Effektmengen, Timing, Zahlungsfolgen und Verlustbedingungen aus
  der kanonischen Kartensemantik beziehen; diese Fakten nicht im Hint
  duplizieren.
- Den generischen Consumer so anbinden, dass
  `runner.develop_board_and_hand` eine entsprechend markierte Karte ohne
  passenden Parent ausdrücklich als derzeit nicht sinnvoll entwickelbar
  klassifiziert und keine eigenständige Kartenplaninstanz erzeugt.
- Für Loan einen vorhandenen `runner.pressure_central`- oder
  `runner.contest_remote`-Plan zuerst einen side-sicheren Run-Payoff, einen
  plausibel erfolgreichen Runpfad und eine konkrete Finanzierungslücke
  feststellen lassen. Economy darf die Loan-Installation danach nur als
  gebundene Support-/Funding-Route dieses Parents materialisieren.
- Bekannte ICE mit Engine-zertifizierten Kosten und Breaker-Pfaden bewerten.
  Bei unbekannten ICE ausschließlich side-sichere Evidence verwenden, etwa
  sichtbare Breaker-Abdeckung, konservativen Kostenkorridor, verbleibende
  Aktionen und sichtbare Run-Hindernisse; keine Hidden-Info zur Begründung
  der Erfolgschance verwenden.
- Vor der Installation die vollständige Loan-Folge aus Run, erwarteter
  Restliquidität, 10-Credit-Leave-Play-Zahlung, laufender Belastung und
  Exit- oder Recovery-Plan projizieren. Nach Installation muss der bestehende
  instanzgebundene `runner.resource_lifecycle`-Owner Halten oder Verlassen
  entscheiden und die exakte aktuelle LegalAction binden.
- Während des Haltens die tatsächliche laufende Belastung jeder Instanz in
  quantifizierte Funding-Ziele und Kampagnenhorizonte einrechnen. Ein
  allgemeiner Credit-Reserve-Plan darf den Brutto-Creditgewinn nicht als
  Fortschritt ausweisen, ohne den nächsten Start-of-turn-Verlust und den
  gebundenen Exit-Bedarf zu berücksichtigen.
- Bei mehreren Loan-Instanzen Halten und Verlassen instanzbezogen quotieren:
  aktuelle Zahlungsfähigkeit, verbleibende Start-of-turn-Belastung,
  strategischer Fundingbedarf und Folgefähigkeit der übrigen Instanzen
  müssen zu einer deterministischen Reihenfolge führen.
- Die verbleibende direkte Loan-Karten-ID-Erkennung im produktiven
  Entscheidungsweg entfernen, sobald der kanonische generische Vertrag sie
  ersetzt.
- Matchnahe fokussierte Regressionen für die beiden beobachteten
  Installationsentscheidungen und den End-of-Turn-Lifecycle ergänzen.

## Nicht im Scope

- Keine vorgezogene Anpassung der alten Hint-, Manifest- oder
  CardImplementation-Strukturen vor Abschluss ihrer laufenden
  Restrukturierung.
- Keine redundante zweite Beschreibung von 12-Credit-Gewinn,
  Start-of-Turn-Verlust, 10-Credit-Zahlung oder Lose-Game-Folge im AI-Hint.
- Keine Loan-spezifische Auswahl-, Score-, Resolver-, Choice- oder
  ActionId-Parsing-Logik.
- Kein pauschaler Umbau aller Economy-, Risiko- oder Austauschkarten. Wenn
  der Musterschnitt weitere konkrete Familienfunde ergibt, entstehen kleine
  Folge-Activities.
- Keine Änderung des Kartentexts, der Engine-LegalActions oder der
  Regelauflösung von Loan from Chiba.
- Keine Abschwächung von LegalAction-, Hidden-Info-, Replay-, StateHash-
  oder deterministischen Planbindungsverträgen.
- Keine Maintenance-API-, Serverstart- oder Persistenzänderung.

## Akzeptanzkriterien

- [x] Die Activity wird erst nach Abschluss der Kartenrestrukturierung auf
      Basis des dann kanonischen Datenmodells umgesetzt; es entsteht kein
      paralleler Legacy-Vertrag.
- [x] Der Hint enthält nur die strategische Zusatzinformation zur riskanten,
      parentgebundenen Nutzung. Regel- und Effektfakten stammen aus der
      kanonischen Kartenbeschreibung und werden nicht dupliziert.
- [x] Der Zulassungs- und Bewertungsvertrag ist generisch und enthält weder
      die Loan-Karten-ID noch einen Loan-Namensvergleich.
- [x] Ohne konkreten lohnenden Parent-Plan erzeugt Loan keine
      `runner.develop_board_and_hand`-Instanz und wird mit einem strukturierten
      Grund wie `strategic_exchange_requires_bound_parent` abgelehnt.
- [x] Allgemeiner Creditmangel, ein hoher roher Creditgewinn oder eine nur
      legal installierbare Karte genügen nicht als Planbegründung.
- [x] Mit einem konkreten Run-Parent sind Zielserver, erwarteter
      Agenda-/Matchpoint-Payoff, Runpfad, Breaker-/Unknown-ICE-Evidence,
      Finanzierungslücke, verbleibende Aktionen und Exit-/Recovery-Plan
      side-sicher und strukturiert belegt.
- [x] Loan wird als Support desselben Root-Plans installiert; der folgende
      Run behält Parent, Zielserver, Planinstanz und
      `PlanExecutionOrigin`. Keine planfremde Zwischenaktion übernimmt die
      Auswahl ohne eine reguläre Replanung.
- [x] Nach Installation besitzt jede Loan-Instanz genau einen eigenen
      `runner.resource_lifecycle`-Child. Die kartengebundene EndTurn-Action
      wird nur bei erfülltem Zahlungs-/Verlustvertrag ausgewählt; andernfalls
      entsteht ein exakter Recovery-Bedarf statt eines Fallbacks.
- [x] Die laufende Belastung einer oder mehrerer Instanzen erscheint in der
      Funding- und Kampagnenquote als Nettokosten. Vier Credit-Aktionen bei
      zwei folgenden Loan-Zahlungen gelten nicht als vier Credits dauerhafter
      Fortschritt.
- [x] Bei zwei installierten Loans und mindestens 10 Credits bewertet der
      Lifecycle-Owner das instanzweise Entfernen gegen weiteres Halten und
      bindet bei positiver Exit-Entscheidung die exakte kartengebundene
      EndTurn-Action; das normale Zugende darf sie nicht ohne fachlichen
      Vertrag verdrängen.
- [x] Eine zweite, nicht als Loan benannte Testkarte oder generische Fixture
      mit demselben Austauschvertrag belegt, dass die Lösung nicht
      kartenspezifisch ist.
- [x] Fokussierte Tests sichern mindestens: kein Parent, unzureichender
      Payoff, bekannter bezahlbarer Run, unbekannte ICE mit und ohne
      ausreichende sichtbare Breaker-Abdeckung, erfolgreicher Run mit
      sofortigem Exit, fehlende 10-Credit-Zahlungsfähigkeit und zwei
      gleichzeitig installierte Loan-Instanzen.
- [x] Zuständiger Plan, Step, Route, exakte Action-ID und Executor bleiben in
      den positiven Fällen gebunden; es entsteht keine zweite
      Entscheidungsautorität.
- [x] Relevante kanonische Semantik-/Hint-Gates, fokussierte AI-Tests,
      erforderlicher AI-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Die laufende Kartenrestrukturierung ist eine echte Reihenfolgeabhängigkeit.
  Beim Claim zuerst den aktuellen Zielvertrag und dessen neue Eigentümer
  lesen; keine alten Felder aus `ai-card-hints-active.json` ungeprüft als
  neue Autorität fortschreiben.
- Der Hint sagt, dass eine riskante Austauschkarte einen lohnenden Parent
  verlangt. Der Parent beweist den konkreten Nutzen. Die kanonische
  Kartensemantik liefert Vorteil, Kosten, Timing und Risiken.
- `runner.economy` ist Support für den exakten Parent-Fundingbedarf.
  `runner.develop_board_and_hand` darf diese Lücke nicht durch eine generische
  Kartenentwicklung kaschieren.
- Bei der späteren Umsetzung das Match nur über die read-only
  Maintenance-Analyse-API als Regressionsevidence verwenden; kein direkter
  SQLite-Zugriff.

## Ergebnisnotiz

Die Kartenrestrukturierung stellt inzwischen den kanonischen CardSpec-Vertrag
für `strategic_exchange: debt_financing` sowie die vollständige Lifecycle-
Semantik bereit. Der produktive Zulassungspfad erkennt Debt-Finanzierung nun
generisch über diesen Vertrag und bezieht Installationsgewinn,
Start-of-turn-Verlust sowie Leave-play-Zahlung direkt aus der CardSpec.

Debt-Installationen sind keine eigenständige Boardentwicklung mehr. Sie werden
nur als exakte Economy-Support-Route eines bereits gewählten
`runner.pressure_central`- oder `runner.contest_remote`-Parents zugelassen,
wenn ein wertiger Run, ein side-sicher tragfähiger Pfad und die anschließende
Exit-Reserve belegt sind. Unbekanntes ICE ohne sichtbare universelle Abdeckung
schließt diese Route aus. Die bestehende instanzbezogene
`runner.resource_lifecycle`-Steuerung bleibt Owner des späteren Haltens oder
Verlassens; mehrere installierte Debt-Instanzen erhöhen die Reserve um ihre
summierte nächste Start-of-turn-Belastung.

Die Engine projiziert den garantierten kanonischen On-install-Creditgewinn auf
die Install-LegalAction, sodass der Funding-Sucher keine Kartentext- oder
ID-Heuristik benötigt. Die letzte Loan-ID-Sonderbehandlung in den
Economy-Diagnostiken wurde entfernt.

Die fokussierten Tests und der Engine-Typecheck sind grün. Der vollständige
AI-Typecheck bleibt ausschließlich an bereits reproduzierten, unabhängigen
Worktree-Doppeltyp- und fehlenden CardSpec-Migrationsreport-Fehlern hängen;
für die geänderten Produktionsdateien wurden keine verbleibenden Fehler
festgestellt.
