# AI Decision Checkpoint – Kandidatenregister 2026-07-12

## Status

Vorbereitet. Capture und fachliche Erwartung des ersten Kandidaten erfolgen
erst nach Abschluss der laufenden Partie.

## Priorität 1 – Aktuelles Planportfolio-/BBS-Match

- Match: `match_7bfe82501d0fdcb8`.
- Status bei Vorbereitung: aktiv.
- KI: Corp, `hard`.
- Beobachtung: `corp.develop_finite_economy` bleibt Vordergrundplan;
  `corp.establish_scoring_remote` bleibt Hintergrund und wird wiederholt
  dormant/blocked. BBS wird in mehreren Zügen zwei- bis dreimal verwendet,
  obwohl zentrale ICE-Installationen fast gleich hoch bewertet sind.
- Vorgesehener Capture: Sequenz ab Beginn eines Corp-Zugs mit legaler
  BBS-Nutzung, hoher Reserve, mindestens einer sinnvollen Central-ICE-Aktion
  und wiederhergestelltem Planportfolio.
- Erwartung: BBS-Nutzung bleibt situativ erlaubt, darf aber einen fälligen
  Schutz-/Scoreline-Schritt nicht über das gesamte Aktionsbudget verhungern
  lassen.
- Strenge: Sequenzinvariante plus verbotene dritte Nutzung unter erfüllten
  Schutzbedingungen; keine pauschale Kartenname-Sperre.
- Memory-Bedarf: PlanPortfolio, TacticalPlan, StrategicIntent, Cadence.
- Companion Contract: finite Economy gegen fälligen Hintergrundplan.

## Priorität 2 – Runner-Event-Run ohne post-cost Pfadbudget

- Match: `match_3bb2232dccc0a1da`.
- Entscheidungen: historische Decisions 44 und 63.
- Beobachtung: Rush Hour verbrauchte alle drei Credits, obwohl der bekannte
  R&D-Pfad danach drei weitere Credits erforderte.
- Erwartung: kostenloser Basis-Run oder Aufbau; kein Event-Run mit nach Kosten
  unfinanzierbarem bekannten Pfad.
- Strenge: verbotene Event-Run-Aktion plus finanzierbare Multiaccess-
  Gegenprobe.
- Memory-Bedarf: TacticalPlan/RunnerRunPlan und Run-Target-Evaluation.

## Priorität 3 – Corp-Opening und Trace-Follow-up

- Match: `match_a199d04c94d5a906`.
- Opening: historische nicht ausführbare Manhunt-Hand muss mulliganen.
- Trace: Basis 5 gegen 11 Runner-Credits mit sichtbarem bezahlbarem
  Tag-Punish-Follow-up muss `bid_7` wählen.
- Erwartung: exakte Choice-Optionen.
- Strenge: genaue Auswahl und negative Gegenproben ohne Payoff/Budget.
- Memory-Bedarf: Opening ohne Memory; Trace mit aktuellem Choice-Kontext.

## Priorität 4 – Forced Decision und Rohdiagnose

- Quelle: gespeicherte alternativlose Zugenden sowie bestehende
  Runtime-Regression.
- Erwartung: `forced_terminal` oder `forced_choice`, vollständiger Rohscore,
  kein `clearly_dominated_plan_choice`.
- Strenge: Klassifikations- und Diagnoseinvariante statt Aktionsoptimierung.
- Memory-Bedarf: keiner oder explizit leerer Runtime-Checkpoint.

## Priorität 5 – Runner-Mulligan mit realem Classic-Breaker

- Match: `match_3bb2232dccc0a1da`, Setup-Decision 1.
- Hand: Psychic Friend, zweimal All-Hands, Promises, Promises und Gypsy™
  Schedule Analyzer.
- Beobachtung: Psychic Friend wird trotz aktivem `icebreaker`-/
  `code_gate_breaker`-Hint als `opening_breakers:0` gezählt.
- Erwartung: reale Breakersemantik erreicht die Opening-Bewertung; Entscheidung
  und Opening-Evidence sind nachvollziehbar.
- Strenge: genaue Keep-/Mulligan-Erwartung erst nach fachlicher Freigabe;
  Breakerzählung ist exakte Invariante.

## Aufnahmevertrag

Ein Kandidat wird erst versioniertes Fixture, wenn dokumentiert sind:

- konkrete Fehlentscheidung und damalige sichtbare bessere Alternative;
- Entscheidung, StateVersion und side-sicherer Kontext;
- erwartete, akzeptable oder verbotene Aktion;
- benötigte Memory-Bestandteile;
- negative Gegenprobe;
- Mutation Witness;
- Hidden-Info-/Redaction-Prüfung;
- Companion Contract oder begründete Ausnahme.
