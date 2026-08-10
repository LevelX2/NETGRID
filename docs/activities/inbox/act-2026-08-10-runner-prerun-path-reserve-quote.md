---
activityId: act-2026-08-10-runner-prerun-path-reserve-quote
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-10
startedAt:
completedAt:
branch:
releaseTarget: ai-plan-layer-hardening
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner-Runs nur mit vollständiger Pfad- und Reservequote zulassen

## Ziel

Ein strategischer Run-Parent darf einen Run nicht allein aufgrund einer
legalen Startaktion und eines positiven Serverwerts als `executable_now`
zulassen. Vor dem Run müssen die kumulierten Kosten des bekannten Pfads und
ein side-sicherer Reservevertrag für rezbares unbekanntes ICE in die
Zulassung eingehen.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, Runner-Zug 30, Entscheidung 112.
- Der Runner hatte 10 Credits, `Krash` mit Basisstärke 0 sowie nur noch einen
  Klick. R&D zeigte einen gerezzten `Keeper` mit Stärke 4 und einem
  End-the-run; davor lag weiteres unrezztes ICE. Die Corp hatte 12 Credits.
- Der bekannte Keeper-Pfad kostete mit Krash bereits 10 Credits: vier Pumps
  zu je 2 Credits und ein Break zu 2 Credits.
- `runner.pressure_central` erklärte den `R&D-Protocol Files`-Run trotzdem
  mit `readiness: executable_now` zum Gewinner. Der Trace meldete
  `engineQuoteEvidence.status: not_reported`, `AI036 neutral projection` und
  `source: LegalAction only`.
- Das unrezzte ICE wurde als `Cortical Scrub` mit Stärke 3 und zwei
  Subroutinen rezzed. Der Runner gab 8 Credits aus, um den Core Damage zu
  vermeiden, ließ anschließend End-the-run auslösen und erreichte weder
  Keeper noch den R&D-Payoff.
- Nach der Aufdeckung kostete der vollständig bekannte Pfad mit Krash etwa
  20 Credits: 10 für Cortical Scrub und 10 für Keeper. Spätere R&D-Runs
  wurden deshalb nachvollziehbar als `blocked_unpayable` verworfen.
- Verwandte Activity
  `act-2026-08-09-runner-information-probe-reassessment` behandelt die
  verpflichtende Neubewertung nach Reveal. Dieses Paket behandelt die
  vorgelagerte Run-Zulassung.

## Scope

- Den zuständigen Run-Parent vor jeder strategischen Run-Zulassung eine
  strukturierte, side-sichere Pfadquote konsumieren lassen.
- Für bekannte/rezzte ICE die Engine-zertifizierten effektiven Stärken,
  Subroutinen, vorhandenen Breaker-/Bypass-/Mitigation-Pfad und kumulierten
  Kosten bis zum geplanten Meilenstein verwenden.
- Für unrezztes unbekanntes ICE keine Definition erraten. Stattdessen einen
  konservativen Reserve- oder Unsicherheitsvertrag aus ausschließlich
  sichtbarer Evidence bilden, mindestens Anzahl/Position, Corp-Credits,
  vorhandene universelle oder typisierte Coverage, verbleibende Runner-
  Credits, Hand-/Damage-Puffer und Wert des Run-Ziels.
- Zwischen mindestens folgenden Ergebnissen unterscheiden:
  - bekannter Pfad vollständig bezahlbar;
  - bezahlbar mit begründeter Unknown-ICE-Reserve;
  - nur als begrenzter Informations-Run vertretbar;
  - unpayable beziehungsweise kein ausreichender Sicherheitskorridor.
- Information-, Contest-, Access- und Matchpoint-Purpose dürfen
  unterschiedliche Reserven und Risikotoleranzen haben; der Purpose muss
  explizit gebunden sein.
- Der Run-Parent bleibt Owner von Server, Purpose, Payoff und Zulassung.
  Sichtbare Runanalyse beziehungsweise Engine-Quote liefert Fakten, aber
  trifft keine zweite Strategieentscheidung.
- Diagnose mindestens für bekannte Gesamtkosten, Unknown-ICE-Korridor,
  Corp-Rezfähigkeit, Runner-Reserve, Funding Gap, Payoff und
  Zulassungsentscheidung ausgeben.

## Nicht im Scope

- Keine Kenntnis oder Wahrscheinlichkeitsbehauptung über die Definition
  unrezzter ICE.
- Kein pauschales Verbot von Runs auf Server mit unrezztem ICE.
- Keine feste kartenspezifische Reserve für Keeper, Cortical Scrub, Krash
  oder `R&D-Protocol Files`.
- Keine Änderung von ICE-, Breaker-, Rez-, Run- oder Access-Regeln der Engine.
- Keine nachgelagerte Reparatur im Encounter-Resolver oder Choice-Resolver.
- Keine allgemeine Neuentwicklung der Probe-Reassessment-Logik; diese bleibt
  in der verwandten Activity.
- Keine Abschwächung von LegalAction-, Hidden-Info-, Replay-, StateHash- oder
  Determinismusverträgen.

## Akzeptanzkriterien

- [ ] Ein Run mit positivem Payoff, aber nicht bezahlbarem bekanntem Pfad
      wird nicht als `executable_now` zugelassen.
- [ ] Die Quote summiert Pump-, Break-, Bypass-, Mitigation- und bekannte
      Folgekosten über alle bekannten ICE bis zum geplanten Meilenstein.
- [ ] Unrezztes ICE wird ausschließlich als side-sichere Unsicherheit mit
      sichtbarer Corp-Rezfähigkeit und Runner-Coverage behandelt; keine
      verdeckte Definition fließt ein.
- [ ] Entscheidung 112 startet den R&D-Run mit 10 Credits nicht als normalen
      ausführbaren Access-/Informationspfad ohne begründete Reserve. Eine
      abweichende zulässige Probe muss Purpose, Budget und Abbruchvertrag
      ausdrücklich tragen.
- [ ] Ein gleichwertiger Zustand ohne unrezztes ICE und mit exakt
      bezahlbarem Keeper bleibt ausführbar.
- [ ] Ein hochwertiger Agenda-/Matchpoint-Payoff kann einen höheren, aber
      weiterhin explizit begründeten Risikokorridor erhalten.
- [ ] Nach einem Reveal bleibt die verwandte Reassessment-Logik zuständig;
      der Encounter-Executor erfindet keine neue Server- oder Purposewahl.
- [ ] Tests sichern bekannte Einzel- und Mehrfach-ICE-Pfade, Unknown-ICE mit
      und ohne Reserve, universelle versus unvollständige Coverage sowie
      Informations- und Matchpoint-Purpose.
- [ ] Ownership-Tests sichern Run-Parent, Step, Route,
      `PlanExecutionOrigin`, exakte Start-Run-Action und Executor.
- [ ] Hidden-Info-Schutz, Replay, StateHash und Determinismus bleiben erhalten.
- [ ] Fokussierte AI-Tests, erforderlicher AI-Typecheck, relevante
      Runanalyse-/Architekturgates und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Zuerst prüfen, warum der ausgewählte Plan trotz vorheriger
  `blocked_unpayable`-Evidence bei exakt 10 Credits ohne Engine-Quote auf
  `ready` wechselte. Der Ursachen-Fix gehört an diese Zulassungsgrenze.
- Bestehende strukturierte Engine- und Visible-Run-Quotes erweitern oder
  korrekt konsumieren; keine Kosten aus Labels oder `actionId` rekonstruieren.
- Matchdaten ausschließlich über die read-only Maintenance-Analyse-API als
  Regressionsevidence verwenden.

## Ergebnisnotiz

Noch offen. Das Paket trennt die vorgelagerte Run-Zulassung von der späteren
Encounter-Neubewertung.
