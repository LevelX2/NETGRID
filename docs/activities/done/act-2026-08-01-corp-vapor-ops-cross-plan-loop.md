---
activityId: act-2026-08-01-corp-vapor-ops-cross-plan-loop
status: done
kind: fix
area: ai
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt: 2026-08-01
completedAt: 2026-08-01
branch: codex/ai-series-82b2-final-remediation
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/runtime/corp-ambush-plan-signals.ts
  - packages/ai/src/runtime/corp-ambush-plan-signals.test.ts
  - data/scenarios/ai-decision-checkpoints/cp-82b2-05-vapor-no-readvance-d137.json
  - data/scenarios/ai-decision-checkpoints/cp-82b2-06-vapor-no-repeat-readvance-d161.json
checks:
  - focused Vapor/score/ambush/counter-bank tests: 34 passed
  - AI typecheck with explicit 6144 MB Node heap: passed
  - check:ai-source-structure: passed
  - git diff --check: passed
---

# Korp-KI: Vapor-Ops-Counterbank vor planübergreifender Nullsummen-Schleife schützen

## Ziel

Die Korp-KI soll eine installierte `Vapor Ops`-Instanz unter genau einem
kohärenten fachlichen Plan führen. Sie darf nicht abwechselnd von einem
Decoy-/Ambush-Plan für einen Credit aufgeladen und unmittelbar danach von
einem Score-/Liquidationsplan für denselben einen Credit geleert werden, ohne
Credits, Scorefortschritt, Schutz oder anderen messbaren Nutzen zu erzeugen.

## Kontext und Quellen

- Nutzer-Playtest vom 01.08.2026, Spiel 2 der aktuellen Hin-und-Rückspiel-Serie:
  `match_1bad991988b099b8` (`human_runner_vs_corp_ai`). Der Nutzer bewertet die
  Handhabung von Vapor Ops als vollständig misslungen und die Karte in diesem
  Zustand als unbrauchbar.
- Der detaillierte Trace bestätigt eine planübergreifende Schleife derselben
  Instanz `corp_onr_v1_347_vapor-ops_1`:
  - D133 / SV327: `corp.ambush_and_bluff` installiert Vapor Ops in Remote 1
    als `score-decoy` für `Marine Arcology`.
  - D134 / SV328: Der Decoy-Plan advanced Vapor Ops auf einen Counter.
  - D135–D136 / SV329–330: `corp.score_agenda` rezzt die Counterbank wegen
    angeblich verlorener Remote-Sicherheit und gibt den Counter für einen
    Credit aus.
  - D137 / SV331: Der Decoy-Plan advanced dieselbe Karte sofort erneut.
  - D142–D146 / SV355–359: Die Folge `Counter für 1 Credit ausgeben -> wieder
    advancen -> Economy-Operation -> wieder ausgeben -> wieder advancen`
    wiederholt sich im nächsten Corp-Zug.
  - D149/D151, D156/D157 und D159/D161: Dasselbe Cashout-/Re-Advance-Pendel
    setzt sich bis zum letzten Corp-Zug fort; insgesamt betrifft der Befund
    fünf Corp-Züge und dieselbe Karteninstanz.
- Jeder direkte Zyklus `advancen -> Counter für 1 Credit ausgeben` kostet
  einen Credit und einen Klick für das Advance und gewinnt einen Credit bei
  einem weiteren Klick zurück. Ohne weiteren Payoff ist das ökonomisch null
  und verbraucht zwei Aktionen.
- Die legale Transferaktion `Vapor Ops: Advancement-Counter bewegen` wird
  gleichzeitig mit
  `corp_score_acceleration_support_has_no_bound_score_project` ausgeschlossen,
  obwohl der konkurrierende Decoy-Plan ausdrücklich `Marine Arcology` als
  Folgekarte in seiner Plan-ID führt.
- Führende und verwandte Artefakte:
  - `docs/architecture/ai/ai-vapor-ops-score-counter-bank-pilot-process-2026-07-27.md`
  - `docs/reviews/ai/corp-asset-node-domain-pilot-review-2026-07-28.md`
  - `docs/architecture/ai/match-a36a9664-corp-plan-remediation-process-2026-07-30.md`
  - `docs/reviews/ai/match-a36a9664-corp-plan-remediation-final-review-2026-07-30.md`
  - `docs/reviews/ai/series-82b2-final-full-decision-audit-2026-08-01.md`, F4
    und Decision-Coverage D133–D161

## Scope

- Die zusammenhängenden Sequenzen D133–D137, D142–D151 und D156–D161 als
  aktuellen
  Plan-first-Checkpoint reproduzieren und die jeweilige
  `PlanExecutionOrigin`, Karteninstanz, Remote-Bindung und beabsichtigte
  Zielagenda sichtbar machen.
- Vor der Änderung den fachlichen Owner festlegen: Der vorhandene
  Vapor-Ops-Counterbank-/Scorevertrag in `corp.score_agenda` soll Aufbau,
  Halten, Transfer und notfalls Liquidation der konkreten Instanz koordinieren.
  `corp.ambush_and_bluff` darf dieselbe Instanz nicht parallel mit einer
  widersprüchlichen Advance-Schleife besitzen.
- Eine kohärente endliche Linie auswählen und resident halten:
  - Counter für ein konkret gebundenes, installiertes oder planseitig
    garantiert erreichbares Scoreprojekt aufbauen und übertragen;
  - bei tatsächlich verlorener Sicherheit vorhandene Counter einmalig
    liquidieren und die Instanz anschließend nicht ohne neuen positiven
    Gesamtplan sofort wieder aufladen;
  - einen echten Decoy nur dann verfolgen, wenn sein messbarer Bluff-/Schutz-
    Nutzen die Kosten trägt und kein Counterbank-Owner widerspricht.
- Planabbruch und Replanning so definieren, dass die Karte nach einer
  Liquidation entweder einen neuen vollständig bewerteten Zweck erhält oder
  vorerst nicht advanced wird.
- Debug-/Evidence-Codes für Owner, Phase, Zielagenda, erwarteten Counterbedarf,
  Transferbereitschaft, Liquidationsgrund und Cooldown beziehungsweise
  Re-entry-Bedingung ergänzen oder schärfen.
- Gegenproben für produktive Counterübertragung, berechtigte einmalige
  Notliquidation und einen tatsächlich sinnvollen Decoy ergänzen.

## Nicht im Scope

- Keine Änderung am Kartentext, an Advance-, Rez-, Transfer- oder
  Cashout-LegalActions, an Kosten, Replay oder StateHash.
- Keine pauschale Sperre gegen Vapor-Ops-Cashout oder Decoy-Nutzung.
- Keine Karten-ID-Sonderentscheidung als zweiter Runtimepfad; die bestehende
  strukturierte Effekt-/Capability-Semantik bleibt Grundlage.
- Kein Choice-Resolver darf Zielagenda, Countermenge, Server, Liquidation oder
  Strategie neu entscheiden. Er vervollständigt nur die Payload einer vom
  zuständigen Plan exakt gebundenen LegalAction.
- Keine breite Neuordnung aller Ambush-, Bluff-, Economy- oder Scorepläne
  außerhalb der nachgewiesenen Ownership-Grenze.
- Keine Nutzung verdeckter Runner-Hand-, Stack- oder Deckinformationen.

## Akzeptanzkriterien

- [x] Der Checkpoint reproduziert die aktuelle Abfolge aus Decoy-Advance,
      Score-Liquidation und sofortigem Re-Advance mit beiden konkurrierenden
      Planinstanzen und belegt die Wiederholung bis D161.
- [x] Eine Vapor-Ops-Instanz besitzt zu jedem Zeitpunkt genau einen
      autoritativen Domainplan für Aufbau, Halten, Transfer oder Liquidation;
      konkurrierende Pläne können sie nicht widersprüchlich ausführen.
- [x] Die Sequenz `1 Credit advancen -> für 1 Credit cashen -> erneut
      advancen` wird ohne zusätzlichen positiven Gesamtwert nicht gewählt,
      weder im selben noch im unmittelbar folgenden Corp-Zug.
- [x] Bei gebundenem und erreichbarem Scoreprojekt kann die KI Counter gezielt
      aufbauen und über die exakte LegalAction übertragen; `actionId`, Ziel und
      Countermenge stammen aus demselben Plan und seiner Continuation.
- [x] Bei real verlorener Remote-Sicherheit darf eine einmalige Liquidation
      stattfinden, danach verhindert eine klare Re-entry-Bedingung die
      Nullsummen-Schleife.
- [x] Ein positiver Decoy-Gegenfall bleibt möglich, wird aber nicht durch
      sofortiges Rezzen/Cashen selbst entwertet und verdrängt keine gebundene
      Score-Counterbank.
- [x] Ownership-Tests sichern Plan, Instanz, Step/Route,
      `PlanExecutionOrigin`, Executor und unveränderte `actionId`; es entsteht
      keine zweite Entscheidungsautorität.
- [x] Fokussierte Vapor-Ops-/Score-/Ambush-Regressionen, AI-Typecheck und die
      relevanten AI-Shards sind grün; Hidden-Info-, LegalAction-, Replay- und
      StateHash-Verträge bleiben unverändert.

## Umsetzungshinweise

- Vor dem ersten KI-Codepatch den verbindlichen KI-Architektur-Preflight aus
  `AGENTS.md` vollständig durchführen und die Owner-Abschnitte für
  `corp.score_agenda` sowie `corp.ambush_and_bluff` gemeinsam abgleichen.
- Der Trace ist bereits diagnostisch eindeutig: Die Engine stellt korrekte
  Advance-, Rez-, Cashout- und Transferaktionen bereit. Der Fehler liegt in
  widersprüchlichem Planbesitz und fehlender Fortsetzungskoordination.
- Den bestehenden Vapor-Ops-Pilotvertrag erweitern; keinen dritten Spezialplan
  und keinen lokalen Resolver-Shortcut hinzufügen.
- Die Kosten-Nutzen-Regression soll den vollständigen Zyklus bilanzieren,
  nicht jede einzelne LegalAction isoliert als zulässig bewerten.

## Ergebnisnotiz

Erledigt. `corp.score_agenda` darf eine unsichere, bereits aufgebaute
Counterbank weiterhin einmalig rezzen und liquidieren. Sobald der als
`score_decoy` gebundene Root dadurch öffentlich gerezzed ist, beendet
`corp.ambush_and_bluff` genau dieses alte Commitment und kann dieselbe Instanz
nicht erneut advancen. Normale rezzed Ambush-Trigger und ein noch unrezzed
Score-Decoy bleiben als Gegenproben erhalten. Die historischen Zustände D137
und D161 wählen den verbotenen Re-Advance nicht mehr.

Der reguläre Typecheck erreichte nach grünen Tests das Node-Heaplimit von
4 GB. Derselbe unveränderte Typecheck lief mit explizit 6144 MB Heap grün;
Typregeln oder Scope wurden nicht reduziert.
