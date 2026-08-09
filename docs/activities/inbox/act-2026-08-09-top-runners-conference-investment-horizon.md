---
activityId: act-2026-08-09-top-runners-conference-investment-horizon
status: inbox
kind: fix
area: ai-data
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-09
startedAt:
completedAt:
branch:
releaseTarget: post-card-semantics-restructuring
blockedBy:
  - act-2026-08-09-runner-turn-plan-sequence-commitment
  - laufende Kartenrestrukturierung und Konsolidierung der kanonischen Kartensemantik
resultArtifacts: []
checks: []
---

# Verzögerte Investments gegen selbstentwertende Folgeaktionen planen

## Ziel

Karten wie `Top Runners' Conference` sollen als verzögertes Investment mit
einem notwendigen Realisierungshorizont verstanden werden. Die KI installiert
eine solche Karte nur, wenn der gebundene Plan ihr voraussichtlich wenigstens
eine sinnvolle Auszahlung ermöglicht. Eine bereits bekannte Aktion, welche
die Investition vor der ersten Auszahlung zerstört, darf nicht unmittelbar
danach aus einem konkurrierenden Plan folgen.

Nach der ersten Auszahlung ist die Karte nicht pauschal zu schützen. In jedem
folgenden Zug soll der Runner bewusst abwägen, ob der konkrete Nutzen eines
Runs jetzt höher ist als der aufgegebene künftige Ertrag. Die Karte passt
damit besonders in eine Wiederaufbauphase, in der Runs gerade nicht sinnvoll
oder nicht finanzierbar sind und Credits für spätere erfolgreiche Runs
aufgebaut werden.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, erster Runner-Zug,
  Entscheidungen 6 und 7.
- Entscheidung 6 installierte `Top Runners' Conference` als Aktion 3 über
  `runner.recurring_economy`. Der Plan war als mehrzügige strategische
  Kampagne eingeordnet.
- Entscheidung 7 startete als Aktion 4 über eine separate
  `runner.pressure_central:rd`-Instanz einen R&D-Run. Die Conference wurde
  beim Run-Start regelgemäß getrasht und hatte zuvor keinen einzigen
  Start-of-Turn-Ertrag erzeugt.
- Der Run traf auf unrezztes Keeper, wurde nach dessen Rez beendet und hatte
  ohne installierten Icebreaker schon anhand der sichtbaren Runner-Mittel
  eine schwache Erfolgsgrundlage.
- Kartentext: `Gain 2 credits at the start of each of your turns. Trash Top
  Runners' Conference when you make a run.` Die Regelwerte und Trigger müssen
  aus der kanonischen Kartensemantik stammen und dürfen nicht im AI-Hint
  wiederholt werden.
- Der unmittelbar widersprüchliche Planwechsel ist zusätzlich ein
  TurnPlanner-Befund und wird in
  `act-2026-08-09-runner-turn-plan-sequence-commitment` ursächlich behandelt.

## Scope

- Nach Abschluss der Kartenrestrukturierung einen kleinen generischen
  Strategiehinweis für Investments festlegen, deren Ertrag verzögert anfällt
  und die durch eine eigene bekannte Aktionsklasse beendet oder stark
  entwertet werden.
- Der Hint soll nur die nicht aus Kartendefinition und CardImplementation
  ableitbare strategische Aussage tragen: Wiederaufbau-/Investmentkarte,
  benötigt einen positiven Realisierungshorizont und muss gegen den Wert der
  selbstentwertenden Folgeaktion abgewogen werden.
- `runner.recurring_economy` darf die Installation nur anbieten, wenn eine
  Restzug- und Kurzfristprojektion mindestens die erste Auszahlung plausibel
  schützt und erwarteter Ertrag die Installations-, Klick-, Karten- und
  Alternativkosten rechtfertigt.
- Bereits bekannte und im selben Zug ausführbare Run-Pläne müssen bei der
  Installation berücksichtigt werden. Wird einer davon gewählt, darf nicht
  zuvor ein Investment installiert werden, das dieser Run wertlos macht.
- Nach Installation bleibt die Karte als Resident-/Lifecycle-Evidence in der
  Planung sichtbar. Zu Beginn späterer Züge vergleichen Run-Pläne ihren
  konkreten Payoff mit dem durch Run-Start aufgegebenen zukünftigen Ertrag.
- Die Abwägung muss zwischen mindestens diesen Situationen unterscheiden:
  - keine aussichtsreichen Runs und sinnvoller Economy-Aufbau;
  - attraktiver Run erst nach wenigstens einer Auszahlung;
  - derzeit schwacher Run, für den ein weiterer Auszahlungszyklus wertvoller
    ist;
  - akuter Agenda-, Matchpoint- oder sonstiger hoher Run-Payoff, der die
    künftige Economy rechtfertigt aufzugeben.
- Karteneffekt, Trigger, Betrag, Zone und Selbst-Trash aus der kanonischen
  Semantik lesen; keine Conference-spezifische Runtime-Verzweigung.
- Eine zweite generische Fixture mit verzögertem Ertrag und eigener
  invalidierender Aktion als Architekturtest ergänzen.

## Nicht im Scope

- Kein absolutes Verbot, im Zug nach der Installation oder nach einer ersten
  Auszahlung einen Run zu starten.
- Keine Regel „Conference muss N Züge liegen“, kein fixer Mindestgewinn und
  keine fest codierte Kartenamortisation unabhängig vom konkreten Plan.
- Keine Conference-Karten-ID oder Namensprüfung im produktiven
  Entscheidungsweg.
- Keine Wiederholung von `2 Credits`, Start-of-Turn-Timing oder Run-Start-
  Trash im AI-Hint.
- Keine Änderung der Kartendefinition, LegalActions oder Engine-Auflösung.
- Kein eigener Plan-Override neben TurnPlanner und kein strategischer
  Choice-Resolver.
- Keine vorgezogene Anpassung der Legacy-Hints vor Abschluss der laufenden
  Kartenrestrukturierung.

## Akzeptanzkriterien

- [ ] Die strategische Zusatzsemantik ist generisch formuliert; Regelwerte,
      Trigger und Effekte kommen ausschließlich aus dem kanonischen
      Kartenmodell.
- [ ] Der produktive Pfad enthält weder Conference-Karten-ID noch
      Kartennamensvergleich.
- [ ] Im beobachteten ersten Runner-Zug wird nicht die deterministische Folge
      `Conference installieren -> als nächste Aktion Run starten` gewählt.
- [ ] Ist im Restzug bereits ein attraktiver Run gebunden, wird die
      unamortisierte Installation abgelehnt oder auf eine spätere
      Wiederaufbauphase verschoben.
- [ ] Sind Runs derzeit nicht aussichtsreich und ist Economy-Aufbau sinnvoll,
      kann die Installation als gebundener `runner.recurring_economy`-Plan
      gewählt werden.
- [ ] Nach wenigstens einer Auszahlung darf ein konkret wertvoller Run die
      Karte bewusst aufgeben, wenn sein erwarteter Payoff den entgangenen
      zukünftigen Nutzen übersteigt.
- [ ] Bei einem schwachen Run und hohem Wert eines weiteren
      Auszahlungszyklus kann die KI bewusst warten und weiter aufbauen.
- [ ] Ein Agenda-, Matchpoint- oder Notfall-Run kann mit strukturierter
      Evidence regulär preempten; das System schützt die Karte nicht um ihrer
      selbst willen.
- [ ] Diagnose-Evidence nennt Investitionskosten, früheste Auszahlung,
      prognostizierte Haltedauer, invalidierende Aktion, entgangenen
      Zukunftswert und Run-Payoff.
- [ ] Eine zweite generische Fixture belegt, dass Planung und Bewertung nicht
      kartenspezifisch sind.
- [ ] Der positive Ausführungspfad behält Root-Plan, Step, Route,
      `PlanExecutionOrigin`, exakte Action-ID und Executor. Keine zweite
      Entscheidungsautorität oder Fallback-Auswahl entsteht.
- [ ] Fokussierte Tests decken Installation in Wiederaufbauphase,
      Same-Turn-Konflikt, Warten nach erster Auszahlung, wertvollen Run nach
      Auszahlung und echten Preemption-Fall ab.
- [ ] Fokussierte AI-Tests, kanonische Semantik-/Hint-Gates, erforderlicher
      AI-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Zuerst die vorgelagerte TurnPlanner-Activity umsetzen oder ihren finalen
  Commitment-Vertrag übernehmen. Eine Kartenbewertung allein kann den
  planfremden Folgeaktionswechsel nicht zuverlässig verhindern.
- Der Hint klassifiziert nur den strategischen Charakter der Karte. Die
  konkrete Amortisation ergibt sich aus Engine-Quote, Kartensemantik,
  aktuellem Board und dem gebundenen Restzug-/Run-Plan.
- Matchdaten bei der späteren Regression ausschließlich über die read-only
  Maintenance-Analyse-API lesen.

## Ergebnisnotiz

Noch offen. Die Umsetzung ist bewusst von TurnPlanner-Bindung und kanonischem
Kartenmodell abhängig.
