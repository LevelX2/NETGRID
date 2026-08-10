---
activityId: act-2026-08-09-runner-information-probe-reassessment
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt:
completedAt:
branch:
releaseTarget: ai-plan-layer-hardening
blockedBy: []
resultArtifacts: []
checks: []
---

# Informations-Runs nach Reveals neu bewerten und in echte Runs überführen

## Ziel

Ein als Informations-Run begonnener Run soll nach jeder wesentlichen
Aufdeckung nicht unverändert an seinem ursprünglichen Probe-Budget
festhalten. Reveal, Rez oder eine andere neue side-sichere Erkenntnis über
den Runpfad bilden eine typisierte Planungsgrenze. Danach entscheidet der
zuständige Run-Parent erneut, ob der aktive Run eine günstige Probe bleibt
oder als aussichtsreicher `contest`-/`access`-Run mit neu quotiertem Budget
fortgesetzt wird.

Der Probe-Run ist dabei nicht zwingend die letzte Aktion des Zuges. Aktionen
für den Restzug dürfen als bedingte Absicht oder offener Bedarf erhalten
bleiben. Sie dürfen hinter der Informationsgrenze aber nur ausgeführt werden,
wenn Klicks, Credits, Karten und übrige Voraussetzungen nach dem tatsächlichen
Runverlauf noch vorhanden sind und die reguläre Neuplanung sie weiterhin
auswählt.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, Runner-Zug 6,
  Entscheidungen 21 und 22.
- Entscheidung 21 startete über `runner.contest_remote` einen Run auf
  Remote 1. Die Run-Origin war als `information` mit einem
  `encounterCreditSpendLimit` von 1 gebunden.
- `Data Wall 2.0` wurde aufgedeckt und rezzed. Der Runner hatte 10 Credits
  und den gerade installierten universellen Icebreaker `Krash`.
- Am Encounter bot die Engine als exakte aktuelle LegalActions
  `Krash: Stärke +1` für 2 Credits sowie das Auslösen der ungebrochenen
  End-the-run-Subroutine an.
- Data Wall 2.0 hatte Stärke 1. Krash hatte Basisstärke 0 und benötigte
  insgesamt 2 Credits zum Pumpen sowie 2 Credits zum Brechen. Der vollständig
  bekannte Durchbruch kostete somit 4 Credits und war mit 10 Credits
  finanzierbar.
- Entscheidung 22 schloss bereits den ersten Pump aus:
  `runner_run_window_action_excluded:run_plan_information_budget_exceeded`.
  `runner.convert_run_window` erbte unverändert
  `run_plan_step:information_probe` und das alte Ein-Credit-Limit, ließ die
  Subroutine auslösen und beendete den Run.
- Der Trace weist den Reveal bereits als
  `scheduled_information_boundary` und die nachfolgende Entscheidung als
  Replanning aus. Die Infrastruktur erkennt die Grenze, aber der aktive
  Run-Parent kann seinen Purpose und sein Budget danach nicht fachlich
  hochstufen.
- Current-State-Code vergleicht im Informationspfad die Kosten der einzelnen
  gerade angebotenen Pump-/Break-LegalAction mit dem unveränderten
  `encounterCreditSpendLimit`. Eine neue vollständige Encounter-Route und
  ihr Payoff werden an dieser Grenze nicht gebunden.
- Verwandte, aber getrennte Activity:
  `act-2026-08-09-runner-turn-plan-sequence-commitment` behandelt die
  allgemeine Restzugbindung bis zu echten Erkenntnisgrenzen. Dieses Paket
  behandelt die fachliche Neuentscheidung innerhalb eines bereits laufenden
  Informations-Runs.

## Scope

- Den aktiven Run-Vertrag um eine typisierte Probe-Neubewertung an
  wesentlichen Run-Erkenntnisgrenzen ergänzen, mindestens bei:
  - erstmaligem Reveal oder Rez bislang unbekannter ICE;
  - Aufdeckung weiterer ICE oder materialer ICE-Eigenschaften;
  - neu sichtbaren Kosten, Subroutinen, Schäden, Programm-Trashs,
    Bypass-Möglichkeiten oder Zugriffshindernissen;
  - materialer Abweichung vom vor dem Run angenommenen Kostenkorridor.
- Nach der Grenze den vollständigen aktuell bekannten Begegnungs- und
  Zugriffspfad side-sicher neu quotieren. Die Bewertung umfasst nicht nur die
  nächste Pump-Aktion, sondern die notwendige Folge aus Pumpen, Brechen,
  Bypass, Schadensannahme, Bewegung und bekannten weiteren ICE.
- Der strategische Run-Parent entscheidet anhand der neuen Quote zwischen:
  - `information` beibehalten und den Run mit geringstem vertretbarem Aufwand
    auslaufen lassen beziehungsweise jacken;
  - in `contest` oder `access` übergehen und ein neues, fachlich begründetes
    Encounter-Budget binden;
  - bei einer echten bekannten Agenda-/Matchpoint-Lage den passenden höheren
    Run-Purpose binden.
- Für Remote-Probes bleibt `runner.contest_remote` Owner der strategischen
  Konvertierung. Für Central-Probes gilt derselbe generische Vertrag beim
  zuständigen Central-Run-Parent. `runner.convert_run_window` konsumiert die
  gebundene Entscheidung und materialisiert ausschließlich aktuelle
  LegalActions des aktiven Runfensters.
- Bei der Entscheidung mindestens berücksichtigen:
  - vollständige bekannte Runpfadkosten und Funding Gap;
  - vorhandene Breaker-/Mitigation-Abdeckung;
  - verbleibende Creditreserve und bereits gebundene akute Bedarfe;
  - sichtbare Advancement-, Agenda-, Node-, Upgrade- oder Access-Payoff-
    Evidence;
  - bekannte Schäden, Tags, Programmverluste und andere Run-Risiken;
  - verbleibende Klicks und den Wert realistischer Restzugoptionen.
- Den Purpose-Übergang als explizite Planphase oder typisierte Continuation
  modellieren. Derselbe aktive Engine-Run und seine Herkunft bleiben
  nachvollziehbar; es entsteht weder ein zweiter Run noch eine parallele
  Auswahlautorität.
- Restzugplanung hinter der Informationsgrenze als bedingt behandeln:
  - Ein späteres Ziel wie Broker bestücken, eine kostenlose Karte spielen
    oder eine andere Aktion darf als Resident Goal, offener Bedarf oder
    konditionale Suffix-Option bereits vor dem Probe-Run als voraussichtlich
    sinnvoll bewertet und erhalten bleiben.
  - Diese Vorbewertung beschreibt eine Präferenz, keine Pflichtfortsetzung
    und keine Garantie, dass genau diese Aktion nach dem Run noch gewinnt.
  - Eine ressourcenabhängige konkrete LegalAction darf nicht über die Grenze
    hinweg als sicher ausführbar geleast werden.
  - Nach dem Run wird der Suffix gegen tatsächlich verbliebene Klicks,
    Credits, Karten und den neuen Boardzustand regulär neu materialisiert.
- Strukturierte Diagnose für Start-Purpose, Grenztyp, neue Route-Quote,
  Payoff, Reserve, Konvertierungsentscheidung und neues Budget ausgeben.

## Nicht im Scope

- Kein pauschales Gebot, einen Informations-Run nach einem Reveal immer
  durchzuziehen. Die Neubewertung ist verpflichtend; die Konvertierung hängt
  von Kosten, Risiko und Payoff ab.
- Kein pauschales Gebot, einen Informations-Run als letzte Zugaktion zu
  planen oder sämtliche Restzugabsichten zu löschen.
- Keine Garantie, dass vor der Aufdeckung konkret eingeplante Folgeaktionen
  nach einem teureren oder anders verlaufenen Run noch ausgeführt werden.
- Keine Karten-ID- oder Namenslogik für Data Wall 2.0 oder Krash und keine
  fest codierte Vier-Credit-Regel.
- Keine Nutzung verdeckter ICE-, Root-, Hand- oder Deckinformationen bei der
  Neubewertung.
- Keine strategische Auswahl in Choice-Resolvern und kein nachgelagerter
  Override des Run-Parents.
- Keine Änderung von ICE-, Breaker-, Run-, Access- oder LegalAction-Regeln der
  Engine.
- Kein allgemeiner Umbau der gesamten Zugplanung; weitergehende
  Sequenzbindung bleibt Scope der verwandten TurnPlanner-Activity.

## Akzeptanzkriterien

- [ ] Reveal oder Rez bislang unbekannter ICE erzeugt im Informations-Run
      eine echte `scheduled_information_boundary` mit anschließender
      fachlicher Neuquote des aktiven Runs.
- [ ] Der Run-Purpose kann nach der Grenze typisiert von `information` zu
      `contest` oder `access` wechseln; das ursprüngliche Probe-Limit wird
      dann durch ein neu begründetes Encounter-Budget ersetzt.
- [ ] Die Route-Quote erfasst die kumulierten Kosten bis zum vorgesehenen
      Run-Meilenstein und entscheidet nicht nur anhand der Kosten der gerade
      nächsten Pump- oder Break-LegalAction.
- [ ] Im Match-Checkpoint zu Entscheidung 22 erkennt die KI den mit Krash für
      4 Credits überwindbaren Data-Wall-Pfad bei 10 Credits, konvertiert den
      verdächtigen Remote-Probe-Run und beginnt die gebundene Pump-/Break-
      Route.
- [ ] Ein zu teurer, nicht abgedeckter oder erkennbar unattraktiver Pfad kann
      im Probe-Modus bleiben und den Run ohne unnötige Ausgabe beenden.
- [ ] Ein bekannter hoher Schaden, Programmverlust oder notwendiger
      Reserveverbrauch kann trotz nominell ausreichender Credits gegen die
      Konvertierung sprechen und wird in der Evidence ausgewiesen.
- [ ] Bei mehreren nacheinander aufgedeckten ICE wird an jeder material neuen
      Erkenntnis erneut quotiert; bereits ausgegebene Credits und verbleibende
      Ressourcen fließen in die nächste Entscheidung ein.
- [ ] Remote- und Central-Probe verwenden denselben generischen
      Übergangsvertrag, aber behalten ihren jeweils zuständigen strategischen
      Parent.
- [ ] `runner.convert_run_window` führt nur die vom Parent gebundene
      Runfensterroute aus und erzeugt weder Serverziel noch strategischen
      Purpose oder Budget als zweite Autorität.
- [ ] Ein bedingtes Restzugziel kann die Grenze überleben und wird nach dem
      Run ausgeführt, wenn seine Voraussetzungen noch erfüllt sind und es
      weiterhin gewinnt.
- [ ] Der TurnPlanner darf einen Suffix schon vor dem Probe-Run als
      voraussichtlich sinnvoll ausweisen, kennzeichnet ihn aber ausdrücklich
      als konditional statt als zwingenden Teil der Ausführungsbindung.
- [ ] Ein ressourcenabhängiges Restzugziel wird nach höheren tatsächlichen
      Run-Ausgaben korrekt verworfen oder neu finanziert; seine alte konkrete
      Action wird nicht blind rematerialisiert.
- [ ] Ein ressourcenunabhängiger, weiterhin sinnvoller Suffix kann nach dem
      Informations-Run erneut gewählt werden. Daraus entsteht keine starre
      Regel, Probe-Runs nur als letzte Aktion zuzulassen.
- [ ] Diagnose-Evidence nennt mindestens vorherigen und neuen Purpose,
      Reveal-/Grenzgrund, bekannte Gesamtroutenkosten, Funding Gap, Reserve,
      Payoff, Entscheidung und neues Ausgabenbudget.
- [ ] Tests sichern Root-/Parent-Ownership, aktiven Run, Planphase,
      `PlanExecutionOrigin`, exakte Action-ID und Executor. Resolver,
      Fallback und parallele Run-Autorität bleiben ausgeschlossen.
- [ ] Hidden-Info-Schutz, LegalAction-Bindung, Determinismus, Replay und
      StateHash bleiben erhalten.
- [ ] Fokussierter Match-Checkpoint, angrenzende Run-Plan-Tests,
      erforderlicher AI-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Die vorhandene Informationsgrenze nicht durch einen zusätzlichen Reveal-
  Sonderpfad duplizieren. Der Ursachen-Fix soll den bestehenden Replan-Pfad
  um die fehlende fachliche Run-Origin-Neubewertung ergänzen.
- Zuerst klären, ob der bestehende Parent seine Modulstate-Phase aktualisiert
  oder eine typisierte, lineage-gebundene Continuation erzeugen soll. In
  beiden Fällen muss genau ein Owner für Purpose, Payoff und Budget bestehen.
- Das alte Probe-Budget ist eine Zulassungsgrenze vor neuer Information. Es
  darf nicht als unveränderliche Obergrenze für einen nach dem Reveal neu
  bewerteten Contest-Run dienen.
- Konditionale Restzugabsichten sind keine vorab gebundenen Engine-Aktionen.
  Sie beschreiben Ziele oder Ressourcenhüllen, die nach der Grenze gegen den
  tatsächlichen Zustand neu materialisiert werden.
- Matchdaten für den Regressionstest ausschließlich über die read-only
  Maintenance-Analyse-API und deren capture-fähigen Snapshot verwenden.

## Ergebnisnotiz

Noch offen. Das Paket trennt die verpflichtende Probe-Neubewertung von der
nicht zwingenden Frage, ob und welche Aktionen nach dem Run folgen können.
