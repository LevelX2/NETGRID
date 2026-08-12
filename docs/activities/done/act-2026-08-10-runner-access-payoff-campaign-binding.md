---
activityId: act-2026-08-10-runner-access-payoff-campaign-binding
status: done
kind: architecture
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-10
startedAt: 2026-08-12
completedAt: 2026-08-12
branch: codex/activities-ai-20260812
releaseTarget: current
blockedBy: []
resultArtifacts:
  - packages/ai/src/plans/runner-tactical-plan-modules.ts
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/runtime/plan-first-live-runtime.test.ts
checks:
  - focused access-payoff runtime regressions (5 passed)
  - full plan-first-live-runtime test file (204 passed, 1 pre-existing Corp baseline failure reproduced on main)
  - AI typecheck changed-file audit (no changed-file errors; full gate blocked by four pre-existing missing migration-report imports reproduced on main)
  - git diff --check
---

# Access-Payoff-Karten an eine ausführbare Runner-Kampagne binden

## Ziel

Karten, deren Nutzen erst bei einem späteren erfolgreichen Zugriff entsteht,
dürfen weder als isolierte Handentwicklung installiert noch bis zum bereits
ausführbaren Run vollständig blockiert werden. Der zuständige strategische
Parent soll eine mehrzügige Kampagne aus Ziel, Payoff-Karte, Finanzierung,
Installation, Run-Finanzierung und Zugriff führen.

`R&D Interface` ist der erste Regressionsträger. Die Lösung muss generisch für
Access-Payoff-Karten und darf nicht über Kartenname oder Karten-ID erfolgen.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, Runner-Züge 28 bis 48.
- Bei Entscheidung 104 hatte der Runner 5 Credits und drei legal für je
  4 Credits installierbare `R&D Interface` auf der Hand. Alle drei Aktionen
  wurden mit
  `runner_access_payoff_install_waits_for_bound_access_route:rd` verworfen.
- In Runner-Zug 34 finanzierte `runner.develop_board_and_hand` eine konkrete
  Interface-Instanz in Entscheidungen 124 und 125 mit zwei Credit-Aktionen.
  Der Plan meldete `development_funding_route_ready:true`,
  `development_funding_route_gap:0` und
  `development_funding_route_status:covered_guaranteed`.
- Ab Entscheidung 126 war die Installation legal und mit zwei verbleibenden
  Klicks ausführbar. Trotzdem verwarf `runner.pressure_central` alle drei
  Installationen erneut wegen des fehlenden gebundenen R&D-Zugriffsplans;
  `runner.economy` nahm stattdessen zwei weitere Credits.
- Bei Entscheidung 112 wählte der Runner mit dem letzten Klick einen
  `R&D-Protocol Files`-Run. In genau diesem Moment wurden die drei legalen
  Interface-Installationen als `runner_hand_development_rejected:duplicate`
  ausgeschlossen, obwohl kein Interface installiert war.
- Von Zug 28 bis 48 wählte die Runtime 38 Economy-Entscheidungen, aber keine
  Interface-Installation und keinen zusammenhängenden Aufbau eines normalen
  R&D-Multiaccess-Runs.
- Verwandte Activities:
  - `act-2026-08-09-runner-turn-plan-sequence-commitment` behandelt die
    allgemeine Restzugbindung;
  - `act-2026-08-10-runner-prerun-path-reserve-quote` behandelt die
    Run-Erreichbarkeit;
  - `act-2026-08-09-risky-strategic-exchange-parent-binding` behandelt
    risikobehaftete Finanzierungskarten.

## Scope

- Nach Abschluss der Kartenrestrukturierung den kanonischen generischen
  Semantik-/Hint-Vertrag für Access-Payoff-Karten verwenden oder um die
  kleinste fehlende strategische Einordnung ergänzen; Regeltext, Kosten und
  Effektmengen nicht im Hint duplizieren.
- `runner.pressure_central` beziehungsweise der passende strategische
  Access-Parent entscheidet, ob Server, erwarteter Zugriffswert und
  erreichbarer Ausbauhorizont eine Payoff-Kampagne rechtfertigen.
- Eine Kampagne mindestens in folgende typisierte Bedarfe gliedern:
  - Zielserver und erwarteter Access-Payoff;
  - gewünschte Payoff-Karte und sinnvolle Kopienzahl;
  - Installationskosten und Klickbedarf;
  - vollständige Run-Finanzierung einschließlich Reserve;
  - Installation und späterer Zugriff als messbare Meilensteine.
- `runner.develop_board_and_hand` und `runner.economy` nur als gebundene
  Support-Routen derselben Kampagne materialisieren. Sie dürfen weder einen
  konkurrierenden strategischen Parent erzeugen noch den Kampagnenzweck nach
  dem Funding verlieren.
- Eine noch nicht im selben Zug ausführbare Run-Route darf die vorbereitende
  Installation nicht pauschal verbieten, wenn die Kampagne einen realistischen
  mehrzügigen Finanzierungshorizont und Abbruchbedingungen besitzt.
- Umgekehrt darf ein bloßer Kartenbesitz keine Kampagne rechtfertigen. Ohne
  ausreichenden Access-Payoff oder realistische Erreichbarkeit bleibt die
  Installation strukturiert zurückgestellt.
- Gleichnamige Kopien instanzsicher behandeln: eine fachlich gewählte Kopie
  darf materialisiert werden; weitere Kopien werden anhand Grenznutzen,
  Kosten und bereits gebundener Kopien bewertet, nicht pauschal alle als
  Duplikat verworfen.
- Diagnose für Parent, Server, Payoff, Kopienziel, Kostenhülle, Funding Gap,
  Meilenstein, Blocker, Abbruchgrund und nächste Support-Route ausgeben.

## Nicht im Scope

- Keine R&D-Interface-spezifische Auswahl-, Score-, Resolver- oder
  ActionId-Parsing-Logik.
- Kein pauschales Gebot, jedes Access-Payoff-Hardware sofort zu installieren
  oder alle verfügbaren Kopien auszuspielen.
- Keine Änderung der Kartenregel, Installationskosten, R&D-Access-Regeln,
  Multiaccess-Auflösung oder `R&D-Protocol Files`.
- Kein vollständiger Umbau aller Runner-Kampagnen, Economy-Pläne oder
  Handentwicklungsheuristiken.
- Keine Nutzung verdeckter Corp-Informationen oder der unbekannten
  Stack-Reihenfolge.
- Keine zweite Entscheidungsautorität in Choice-Resolvern, Fallbacks oder
  nachgelagerten Aktionsfiltern.
- Keine Abschwächung von LegalAction-, Hidden-Info-, Replay-, StateHash- oder
  Determinismusverträgen.

## Akzeptanzkriterien

- [x] Der Vertrag ist generisch und enthält weder Karten-ID noch Namenscheck
      für `R&D Interface`.
- [x] Ohne begründeten Access-Parent entsteht keine isolierte
      Payoff-Installation allein aufgrund verfügbarer Credits.
- [x] Mit realistischem Parent bleiben Zielserver, Root-Plan,
      Planinstanz, Meilensteine und `PlanExecutionOrigin` über Funding,
      Installation und Run-Finanzierung nachvollziehbar gebunden.
- [x] Der Match-Checkpoint zu Entscheidungen 124 bis 126 verliert den
      Interface-Plan nicht nach Erreichen der Installationskosten. Entweder
      wird die legal gebundene Installation ausgeführt oder die Kampagne
      nennt einen neuen materiellen Blocker; ein konkurrierender pauschaler
      Access-Veto-Grund genügt nicht.
- [x] Eine vorbereitende Installation kann bei realistischem mehrzügigem
      Horizont zulässig sein, obwohl der vollständige Run noch nicht im selben
      Zug bezahlt werden kann.
- [x] Ein unprofitabler oder dauerhaft unerreichbarer Server erzeugt keine
      endlose Funding-Schleife; die Kampagne wird sichtbar blockiert,
      zurückgestellt oder beendet.
- [x] Bei drei gleichen Kopien wird mindestens eine fachlich gewählte
      Instanz korrekt bewertet; es werden nicht alle drei ohne installierte
      Kopie als Duplikat ausgeschlossen.
- [x] Tests sichern mindestens: kein Payoff, realistischer Ein-Kopien-Plan,
      mehrere Kopien mit abnehmendem Grenznutzen, Funding über mehrere Züge,
      Abbruch bei neuer ICE-Evidence und erfolgreicher normaler R&D-Zugriff.
- [x] Ownership-Tests sichern Parent, Step, Support-Bindung, exakte
      LegalAction und Executor; Resolver und Fallback treffen keine eigene
      Strategieentscheidung.
- [x] Hidden-Info-Schutz, Replay, StateHash und Determinismus bleiben erhalten.
- [x] Fokussierte AI-Tests, erforderlicher AI-Typecheck, relevante
      Semantik-/Architekturgates und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Beim Claim zuerst den nach der Kartenrestrukturierung führenden Semantikweg
  bestimmen. Keine zweite Access-Payoff-Struktur neben der kanonischen
  Kartensemantik aufbauen.
- `runner.develop_board_and_hand` bewertet und materialisiert den gebundenen
  Entwicklungsschritt; der strategische Nutzen und die Serverwahl bleiben
  beim Access-Parent.
- Die Matchdaten nur über die read-only Maintenance-Analyse-API als Evidence
  verwenden; kein direkter SQLite-Zugriff.

## Ergebnisnotiz

`runner.pressure_central` erzeugt nun aus der kanonischen generischen
Access-Payoff-Semantik eine server- und karteninstanzgebundene Kampagne. Sie
führt Kopienziel, Installationskosten, Run-Finanzierungsziel, Gesamthülle,
Funding Gap, Horizont und Meilenstein. Eine legal gewählte Kopie wird direkt
vom Parent materialisiert; weitere gleichwertige Kopien erhalten eine
explizite Grenznutzen-Disposition. Fehlende Installationscredits werden über
einen exakt parentgebundenen `runner.economy`-Need finanziert.

Der frühere pauschale Sofort-Run-Veto greift nicht mehr gegen diese residente
Kampagne. Bekannter Null-Payoff, dauerhaft unpassierbare Pfade und nicht
realistisch finanzierbare Pfade erzeugen dagegen weiterhin keinen Aufbau.
Die Lösung enthält im Produktivcode weder Karten-ID noch Kartennamen und
öffnet keinen Resolver- oder Fallback-Chooser.

Die fünf fokussierten Regressionen sind grün. Der vollständige Test der
betroffenen Runtime-Datei hat 204 grüne Tests und einen bereits auf `main`
identisch reproduzierbaren Corp-Score-Funding-Baselinefehler. Der
Paket-Typecheck meldet in den geänderten Dateien keinen Fehler; sein voller
Lauf scheitert auf `main` bereits an vier Imports inzwischen entfernter
CardSpec-Migrationsreports. Diese beiden unabhängigen Baselinepunkte wurden
nicht in den Activity-Scope gezogen.
