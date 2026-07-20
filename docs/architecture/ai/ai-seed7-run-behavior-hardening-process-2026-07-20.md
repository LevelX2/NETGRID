# Seed-7-Run-Verhalten der KI härten

Status: abgeschlossen – Final Verify grün, lokal in `main` integriert und Cleanup verifiziert

## Quelle und Zielprüfung

Quelle ist die vollständige Analyse der Seed-7-Partie aus der AI Behavior
Baseline v1 am reproduzierbaren Kandidatenstand `19d8375ed`. Die auffälligen
Runner-Entscheidungen liegen insbesondere an den Zuständen 168/171, 210,
225/229 sowie 313/339. Die Vorgabe ist zur direkten Umsetzung freigegeben.

Das Problem ist kein pauschales „Run wird vor Kostenprüfung gewählt“. Im
produktiven Pfad existieren vielmehr zwei nicht deckungsgleiche Bewertungen:
Die frühe Run-Zielbewertung berücksichtigt sichtbare Trace-Vermeidung, während
die spätere Plan- und Encounter-Bewertung bekannte ICE fast nur über
Breaker-Aktionen kalkuliert. Zusätzlich kann hoher erwarteter Access-Payoff
eine nicht gesicherte Route zu stark aufwerten. Dadurch entstehen sowohl
Start-und-sofort-Jack-out-Schleifen als auch falsche Ablehnungen tatsächlich
bezahlbarer Trace-Routen.

## Gesamtziel

Die Runner-KI trifft vor einem Run eine gemeinsame, ziel- und
effektabhängige Routenentscheidung und führt genau diese Entscheidung bis zum
Access konsistent aus. Bekannte Kosten werden vollständig kalkuliert;
Unbekanntes bleibt ausdrücklich konditional. Trace-Effekte werden nach
Zeitpunkt und Folge bewertet, nicht pauschal blockiert. Eine materiell neue
sichtbare Situation löst eine Neuberechnung aus, bloße StateVersion- oder
Aktionsfortschreibung dagegen nicht.

## Annahmen

- Der Runner-Pfad nutzt ausschließlich Runner-PlayerView, LegalActions,
  side-sichere PublicEvents und erlaubte Metadaten.
- Die Engine bleibt einzige Regelautorität; die KI wählt ausschließlich
  vorhandene LegalActions.
- Bekannte Agenda-, Root-, ICE- und Kosteninformationen dürfen vollständig
  verwendet werden; unbekannte Kartenidentitäten werden weder erraten noch
  aus Debug- oder Replaydaten übernommen.
- Ein Run kann trotz möglicher Tags oder anderer Nachteile richtig sein, wenn
  sein Ziel den Nachteil überwiegt, insbesondere bei einem terminalen
  Agenda-Access. Effekte vor dem Access wie End-the-run oder Flatline bleiben
  dagegen entscheidungsrelevant.
- Die günstigste zulässige Route zählt. Breaken, Trace gewinnen, bezahlen,
  umgehen, umleiten oder ein akzeptierter Effekt sind Alternativen und werden
  nicht fälschlich aufsummiert.

## Nicht-Ziele

- kein pauschales Trace-, Tag-, Remote- oder Wiederholungsrun-Verbot;
- kein Cooldown als Ersatz für korrekte Kalkulation;
- keine Änderung der Engine-Legalität, Kartentexte oder Trace-Regeln;
- keine FullState-, Hidden-Info- oder Gegnerdeck-Abkürzung;
- keine globale Score-Neukalibrierung außerhalb der Run-Entscheidung;
- keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

1. Eine Access-orientierte Run-Freigabe stützt sich auf genau eine
   `RunRouteQuote` mit `guaranteed_access`, `conditional_access` oder
   `no_access`.
2. Die Quote führt Ziel, Weg, bekannte Kosten, unbekannte Bestandteile,
   effektabhängige Risiken und den Zeitpunkt der Effekte.
3. Eine hohe Belohnung darf `no_access` nicht in einen angeblich erreichbaren
   Run verwandeln.
4. Ein konditionaler Run braucht ein explizites Ziel, ein akzeptiertes Risiko
   und einen Ausstiegspunkt; die Ausführung darf dasselbe bekannte Risiko
   danach nicht als neuen Abbruchgrund behandeln.
5. Revalidiert wird bei entscheidungsrelevanten sichtbaren Änderungen, nicht
   allein wegen einer neuen `stateVersion`.
6. Access-Absicht und Economy-Finanzierung sind Teil derselben Verpflichtung:
   Ein als bezahlbarer Trash begründeter Run reserviert und nutzt den
   Trash-Preis, sofern seine Annahmen unverändert bleiben.
7. Wiederholungsdiagnostik unterscheidet unveränderten Stillstand von
   Ressourcenzuwachs, neuem sichtbarem Wissen, Rez und produktivem Access.

## Sicherheitsblocker und automatische Fehlerbehandlung

Der Prozess stoppt bei benötigten verdeckten Gegnerinformationen, einer
Auswahl außerhalb der LegalActions, einer erforderlichen Engine-Regeländerung
oder einem Leak in PlayerView, Debug, Replay oder Testartefakten. Rote
paketnahe Tests werden innerhalb des aktiven Pakets an der gemeinsamen
fachlichen Quelle behoben. Eine bloße Kennzahlverbesserung ohne semantisch
belegtes Verhalten ist kein zulässiger Fix.

## State Machine

`preflight -> paket_1_run_route_quote -> paket_2_run_commitment -> paket_3_run_freigabe -> paket_4_execution_access_economy -> final_verify -> main_merge -> cleanup -> complete`

Genau ein Zustand ist aktiv. Jeder Paketzustand endet mit den fokussierten
Tests, `git diff --check`, dokumentiertem Ergebnis und einem eigenen Commit.

## Paketfolge

### Paket 1: Gemeinsame ziel- und effektabhängige RunRouteQuote

Problem A: Frühe Zielbewertung und spätere Plan-/Encounter-Quote berechnen
bekannte ICE-Routen unterschiedlich. Trace-Bezahlung fehlt in der exakten
Planroute; hoher Payoff kann fehlende Erreichbarkeit überstimmen.

Maßnahme B: Eine side-sichere gemeinsame `RunRouteQuote` modelliert Break/
Pump, garantierte Trace-Gebote, bewusst konditionale Trace-Routen, Pay,
Bypass, Deflect und akzeptierbare Effekte. Sie führt einen Effektvektor für
End-the-run/Deflect, Tags, Damage, Trash, Credits, Run-Lock und spätere
Modifier samt Zeitpunkt vor, bei oder nach Access. Ergebnis ist genau eine
der Klassen `guaranteed_access`, `conditional_access`, `no_access`. Terminale
Gewinne ignorieren erst nach dem Gewinn irrelevante Folgen; vor dem Access
wirkende ETR- und Flatline-Risiken bleiben erhalten.

Nebenwirkungen C: Keine pauschale Trace-Sperre. Vorhandene sinnvolle
Tag-Akzeptanz und unbekannte ICE-Probes bleiben möglich. Die Quote wählt die
günstigste Alternative statt mehrere Alternativen zu addieren.

Seed-7-Gegenproben: Zustand 168 benötigt gegen Corp 1 eine Garantie von 5
Credits und ist mit Runner 4 nicht garantiert; Zustand 210 erkennt gegen
Corp 0 die bezahlbare Route von 4 Credits; Zustand 225 benötigt gegen Corp 3
eine Garantie von 7 Credits und ist mit Runner 6 nicht garantiert.

Commit: `fix(ai): unify runner route quotes`

### Paket 2: Zustandsgebundene Run-Verpflichtung

Problem A: Zielauswahl, Plan und Encounter halten keine gemeinsame fachliche
Entscheidung fest. Ein pauschales „kürzlich abgebrochen“ würde nur das Symptom
verdecken und neue, nun bessere Situationen zu Unrecht sperren.

Maßnahme B: Ein `RunCommitment` bindet Ziel, Run-Zweck, gewählte Route,
Garantie/Konditionalität, Kosten, Reserven, unbekannte Bestandteile,
akzeptierte Risiken, erwarteten Nutzen und terminale Bedingungen an einen
entscheidungsrelevanten Fingerprint. Dieser enthält sichtbare Server-/ICE-
Struktur, Rez-/Kenntnisstand, Root, verfügbare Credits und Sonderpools,
Corp-Credits, Link, Breaker, Tags, Grip/Prevention, Agenda-/Matchpoint-Lage
und Access-Ziel/-Preis.

Nebenwirkungen C: Kein Cooldown und kein „einmal gescheitert, immer
gesperrt“. Neue Credits, neue Karte, neue sichtbare ICE-/Root-Information oder
veränderte Corp-Ressourcen invalidieren korrekt. Reine Aktionsfortschreibung
bei gleicher Entscheidungslage tut es nicht. Bestehendes AccessOutcomeMemory
bleibt legitime Wissensquelle, nicht Ersatz für die aktuelle Kalkulation.

Commit: `feat(ai): bind runner runs to visible state`

### Paket 3: Verbindliche Run-Freigabe und Planarbitration

Problem A: Ein Tactical-Plan-Bonus kann einen fachlich nicht erreichbaren Run
erneut hochziehen; der Plan startet zunächst als gültig und entdeckt den
Widerspruch erst während der Ausführung. Geblockte Runs können außerdem
korrektive Economy-, Install-, Tutor-, Draw-, Link- oder Prevention-Aktionen
verdrängen.

Maßnahme B: Access-Runs werden nur mit garantiertem Access oder ausdrücklich
akzeptierter konditionaler Route freigegeben. Ein Probe-Run braucht ein
eigenes Informationsziel, Risikobudget und Jack-out-Fenster. `no_access`
bleibt auch nach Planbonus ungültig. Target, Ziel und Verpflichtung müssen
übereinstimmen. Korrektive Alternativen bleiben auswählbar. Ein akzeptiertes
bekanntes Risiko wird in den aktiven Plan übernommen; nur eine materielle
Verschlechterung rechtfertigt den späteren Abbruch.

Nebenwirkungen C: Informationsruns auf wirklich unbekannte Server werden
nicht global unterdrückt. Gute Economy- und Entwicklungszüge gewinnen nur,
wenn der konkrete Run seine Freigabe nicht erfüllt; sie erhalten keinen
pauschalen Scorebonus.

Commit: `fix(ai): enforce runner run release gates`

### Paket 4: Encounter-, Access- und Economy-Ausführung plus Regression

Problem A: Selbst eine korrekte Vorentscheidung kann noch auseinanderfallen,
wenn Encounter-Policy, Trace-Gebot, Access-Trash-Entscheidung oder Banking
andere Annahmen verwenden. Die bisherige Wiederholungsdiagnostik markiert
außerdem unterschiedliche Zustände zu grob gleich.

Maßnahme B: Der aktive Plan führt die gewählte Break/Pump/Trace-/Accept-/
Bypass-/Jack-Route aus und revalidiert nur geänderte Fakten. Access-Absicht
reserviert einen begründeten Trash-Preis und konvertiert den Access, sofern
die Annahmen gelten; wer nicht trashen will, startet keinen dadurch
begründeten Run. Economy-Aktionen benennen ihren Finanzierungszweck.
`repeated_no_progress` wird state-aware und trennt Stillstand von Ressourcen,
neuem Wissen, Rez und produktivem Access.

Nebenwirkungen C: Produktive Wiederholungsruns bleiben möglich. Banking,
Draw und Installation werden nicht allgemein erzwungen; sie werden nur als
konkrete Verbraucher einer blockierten oder vorbereiteten Route begründet.

Abnahme: keine 168/171-Start-Jack-Schleife; Zustand 210 erkennt und führt die
Trace-Route konsistent; 225/229 wird korrekt garantiert oder ausdrücklich
konditional behandelt; Remote 2 wird ohne Trash-Absicht nicht wiederholt und
konvertiert bei unverändertem `trash_affordable`; alle sechs Seed-7-Stellen
werden semantisch aufgelöst; Seed 7 endet ohne Action-Limit. Zusätzlich sind
paketnahe Tests, AI-Typecheck, AI-Shards, Source-Structure, Hidden-Info-
Verträge und die stabile Baseline-Vergleichskonfiguration grün.

Commit: `test(ai): harden seed7 run execution regressions`

## /Goal

`/Goal Arbeite den freigegebenen NETGRID-Seed-7-KI-Härtungsprozess vollständig und sequenziell von Paket 1 bis Paket 4 ab: gemeinsame ziel- und effektabhängige RunRouteQuote, zustandsgebundene Run-Verpflichtung, verbindliche Run-Freigabe und Planarbitration sowie konsistente Encounter-/Access-/Economy-Ausführung mit state-aware Regressionsevidence. Erstelle zuerst das Prozessartefakt, arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SEED7_RUN_BEHAVIOR_HARDENING auf Branch codex/ai-seed7-run-behavior-hardening mit genau einem aktiven Paket, verifiziere und committe jedes Paket einzeln, integriere nach Abschluss aktuelles main defensiv, führe finale Checks aus, merge den Arbeitsbranch lokal nach main und entferne/verifiziere anschließend Worktree und gemergten Branch. Keine pauschale Trace- oder Wiederholungssperre; keine Hidden-Info-Leaks; keine Remote-Integration.`

## Verifikationsregeln

- Paketnah: fokussierte Vitest-Dateien und AI-Typecheck soweit vom Paket
  berührt.
- Pro Paket: `git diff --check`, gezieltes Staging ausschließlich der
  Paketdateien, eigener Commit und sauberer Worktree.
- Finale Verifikation: vollständige AI-Shards, AI-Typecheck,
  `check:ai-source-structure`, relevante Contract-/Hidden-Info-Gates sowie
  Seed-7-Baselinevergleich mit unveränderter Baseline-Konfiguration.
- Nach Integration des dann aktuellen `main` werden die finalen Prüfungen
  wiederholt. Danach erfolgt der lokale Merge nach `main` und eine angemessene
  Hauptbranch-Prüfung.

## Abschlusskriterien

- Alle vier Pakete besitzen eigenen Commit und dokumentierten Nachweis.
- Bekannte und unbekannte Routenteile werden nicht vermischt oder erfunden.
- Trace-Folgen werden effekt- und zeitpunktabhängig bewertet.
- Run-Auswahl, Plan, Encounter und Access verwenden dieselbe Verpflichtung.
- Die genannten Seed-7-Situationen und positive Gegenbeispiele sind grün.
- Baseline-Redaktion und Hidden-Info-Verträge bleiben intakt.
- Arbeitsbranch ist lokal in `main` integriert; Worktree und gemergter Branch
  sind in Git und Dateisystem nachweislich entfernt.

## Fortschritt

- Preflight: abgeschlossen (`e51431570`)
- Paket 1: abgeschlossen
- Paket 2: abgeschlossen
- Paket 3: abgeschlossen
- Paket 4: abgeschlossen
- Final Verify: abgeschlossen
- Main-Merge und Cleanup: abgeschlossen; Branch-Tip `de491c434` ist Bestandteil
  von `main`, Umsetzungs-Worktree und gemergter Branch sind entfernt.

## Paketnachweis

### Paket 1

- `RunnerRunRouteQuote` klassifiziert bekannte und unbekannte Pfade als
  `guaranteed_access`, `conditional_access` oder `no_access` und führt
  garantierte bekannte Kosten, Funding-Gap sowie sichtbare Effekte mit
  Zeitpunkt und Access-/Flatline-Relevanz.
- Die sichtbare Trace-Hazard-Projektion kennzeichnet End-the-run-Effekte
  ausdrücklich. Der Pfad berücksichtigt dabei die maximale sichtbare
  Corp-Gebotskapazität; die vorherige reine Base-Trace-Prüfung kann einen
  bekannten Corp-Boost nicht mehr übersehen.
- Die Plan-/Encounter-Quote vergleicht Breaker- und garantierte Trace-Route
  und kann am Encounter über `continue_run` in die geplante Trace-Auflösung
  gehen. Run-Credits werden dabei als während des Runs verfügbare allgemeine
  Credits berücksichtigt.
- Gegenproben: Seed-7-Zustand 168 = konditional, Garantie 5 bei 4 Credits;
  Zustand 210 = bekannte Garantie 4 bei 6 Credits; Zustand 225 = konditional,
  Garantie 7 bei 6 Credits. Unbekanntes äußeres ICE bleibt ausdrücklich
  konditional; unvermeidbare Tags blockieren Access nicht pauschal; tödlicher
  Trace-Schaden bleibt vor Access konditional.
- Verifikation: vier fokussierte Testdateien mit 132 Tests, AI-Typecheck und
  `git diff --check` grün.

### Paket 2

- Jeder neu erzeugte Runner-Run-Plan besitzt ein `RunCommitment` mit Ziel,
  Zweck, Route, garantierten bekannten Kosten, unbekannten ICE-Anteilen,
  Access-Reserve, akzeptierten konditionalen Risiken, Nutzen und sichtbarer
  terminaler Agenda-Lage.
- Der kompakte `RunDecisionFingerprint` wird ausschließlich aus
  entscheidungsrelevanten side-sicheren Fakten aufgebaut: sichtbare
  Server-/ICE-/Root-Struktur, Credits und Run-Pools, Corp-Credits, Runner-Hand,
  Rig/Breaker/Link-/Prevention-Counter, Tags, Agenda-Lage und Access-Absicht.
  `stateVersion`, Run-Phase und Position sind ausdrücklich kein Bestandteil.
- Unbekannte gegnerische Karten tragen nur Instanz-, Known- und Rez-Status bei;
  versehentlich vorhandene verdeckte Definitionen beeinflussen den
  Fingerprint nicht.
- Revalidation vergleicht strukturelle Encounter-Referenzen feldweise statt
  über JSON-Property-Reihenfolge. Reine Zustandsfortschreibung hält die
  Verpflichtung gültig; Credits, Corp-Ressourcen, neue Runner-Karten, Rez,
  Tags und vergleichbare materielle Änderungen lösen eine Neuberechnung aus.
- Es wurde kein Abbruch-Cooldown oder Repeat-Run-Memory ergänzt. Rebasierte
  Verpflichtungen übernehmen die aktuelle Route und bewahren die bewusst
  akzeptierten Risiken.
- Verifikation: fünf fokussierte Testdateien mit 70 Tests, AI-Typecheck und
  `git diff --check` grün.

### Paket 3

- `RunnerRunReleaseDecision` ist jetzt das verbindliche Gate vor der
  semantischen Rangfolge. `no_access` wird hart ausgeschlossen und kann durch
  Tactical-Plan-, Matchpoint- oder Deckstrategie-Boni nicht wiederbelebt
  werden. Garantierter Access bleibt zulässig; seine Downside wird weiterhin
  differenziert über Guidance und Nutzen gewichtet.
- Konditionale Routen werden nur als finanzierter Unknown-ICE-Probe, als
  bereits risikogeprüfte probabilistische Breaker-Route oder als ausdrücklich
  akzeptiertes Agenda-/Score-Threat-Risiko freigegeben. Sichtbare
  Flatline-Gefahr vor Access bleibt auch bei Agenda-Payoff gesperrt.
- Ein Unknown-ICE-Probe erhält im RunPlan ein echtes `probe_unknown_ice`-Ziel
  mit Kreditverlustbudget. Eine akzeptierte konditionale Route wird im
  Commitment persistiert und von Revalidation sowie Encounter-Quote wieder
  erkannt; dasselbe bekannte Risiko erzeugt deshalb keinen sofortigen
  Jack-out.
- Action-Ziel und RunTargetEvaluation müssen übereinstimmen. Die harte
  Freigabe betrifft ausschließlich die konkrete Run-Aktion; Economy-, Draw-,
  Install-, Tutor-, Link- und Prevention-Alternativen bleiben von diesem Gate
  unberührt.
- Probabilistische Universal-Breaker-Pfade bleiben als explizit konditionaler
  Sonderfall erhalten, sofern ihre vorhandene Handbuffer-/Encounter-Prüfung
  bestanden ist. Dadurch entsteht keine negative globale Blink-Regression.
- Verifikation: neun fokussierte Testdateien mit 167 Tests, AI-Typecheck und
  `git diff --check` grün.

### Paket 4

- Eine unverändert positive `trash_asset_or_upgrade`-Verpflichtung kann beim
  Access nicht mehr durch einen abweichenden lokalen Trash-Score auf
  `decline_trash` zurückfallen. Sie konvertiert den reservierten Trash-Preis,
  solange Revalidation, Preis und Sicherheitsreserve weiterhin passen. Ein
  nichtpositives oder invalidiertes Ziel bleibt dagegen frei bewertbar.
- Der Seed-7-Trace-Gegenfall bietet als Runner bei Trace 4, Link 0, sechs
  Credits und Corp 0 exakt vier Credits. Die vorhandene Encounter-Route führt
  weiterhin die im Plan gewählte Break-/Pump-/Trace-Sequenz aus; es wurde
  keine pauschale Trace- oder Tag-Regel ergänzt.
- Start-Run-Entscheidungen tragen den kompakten side-sicheren
  `runner_run_decision_fingerprint` in der redigierten Evidence. Der
  Diagnose-Detektor `repeated_no_progress_run` meldet bei vorhandenen
  Fingerprints nur materiell gleiche Entscheidungslagen; Ressourcen-, Rez-,
  Wissens-, Rig-, Tag-, Root- oder Access-Zieländerungen erzeugen einen neuen
  Fingerprint. Alte Traces ohne Fingerprint bleiben weiterhin auswertbar.
- Bank-Cashout für eine blockierte Run-Route benennt Server, Funding-Gap und
  Payoff als konkreten Verbraucher. Eine `no_access`-Route wird nicht als
  durch Banking reparierbar klassifiziert; generische Install-/Aktionskosten
  bleiben als eigener konkreter LegalAction-Verbraucher erkennbar.
- Der projektweite Checkpoint 9FEF-F04 deckte im Final-Verify eine zu enge
  Probe-Freigabe auf: Eine vollzugriffsbezogene Empfehlung
  `gain_credits_first` darf einen unmittelbar legalen Unknown-ICE-Prüfrun
  nicht sperren, wenn die bekannte Teilroute finanziert ist und der Probe vor
  dem unbekannten Risiko auschecken kann. Der Unknown-only-Probe bleibt daher
  freigegeben, ohne daraus eine Access-Garantie abzuleiten; alle 15
  Match-9FEF-Kontrollen sind wieder grün.
- Der positive Trapdoor-/Dumpster-Kontrollfall deckte im Final-Verify eine
  zweite Integrationskante auf: Die Pfadanalyse bezahlte acht Breaker-Kosten
  korrekt mit sechs allgemeinen und zwei eingeschränkten Credits, während die
  RouteQuote die acht anschließend nur mit dem Bargeld verglich. Sie rechnet
  nun ausschließlich die von der konkreten Pfadanalyse nachweislich
  verwendbaren Restricted Breaker Credits an. Eine Gegenprobe hält dieselben
  Credits für ein Trace-Gebot gesperrt; der unterfinanzierte Kontrollzustand
  bleibt ebenfalls gesperrt.
- Die Restricted-Credit-Kapazität wird aus der konkreten sequenziellen
  Pfadzahlung abgeleitet. Eine zusätzliche Mischpfad-Gegenprobe bezahlt einen
  Breaker aus dem Sonderpool, lässt einen späteren Trace-Fehlbetrag aber
  vollständig offen; der Pool wird damit nicht als allgemeines Guthaben
  umgedeutet.
- Ein bekannter Remote-Payoff `trash_affordable` oder `trash_unaffordable`
  bleibt auch auf einer Unknown-ICE-Route das Run-Ziel. Dadurch konvertiert
  der positive Hybrid-Score-Punish-Kontrollfall bei StateVersion 138 den
  reservierten Vier-Credit-Trash, statt das Ziel durch
  `probe_unknown_ice` zu ersetzen; die Partie endet wie die Referenz nach 241
  Aktionen.
- Unknown-ICE-Probes binden ihr zusätzliches Kreditrisiko nun an die nach dem
  bekannten Pfad verbleibenden Credits und den modellierten Risikopuffer.
  Wird die Route nach Rez zu `no_access`, kann eine Safety-Sequenz das Budget
  nur überschreiten, wenn der sichtbare Effekt das akzeptierte Damage-Budget
  übersteigt oder eine nicht als einfacher Damage quantifizierbare Gefahr wie
  Programmverlust, Trace oder Tag vorliegt. Im Seed-7-Kontrollzustand werden
  deshalb zwei Credits des Puffers eingesetzt und die weiteren sechs Credits
  konserviert; tödliche Safety-Fälle bleiben unverändert geschützt.
- Reproduzierbare finale Seed-7-Gegenprobe mit 480 Aktionen: Der zuvor
  betroffene Slot endet nach 472 Aktionen mit Runner-Sieg statt am
  Action-Limit; `repeated_no_progress_run` sinkt von sechs auf null, Replay und
  Redaction bleiben grün. Nach neu gerezztem ICE wird die Route sichtbar als
  `no_access` revalidiert und die weitere Kredit-Eskalation beendet.
- Der unveränderte vollständige Standardvergleich über sechs Slots, zehn
  Seeds und 480 Aktionen lief auf Commit `a2791daeb` mit 60 Spielen und 12.306
  Entscheidungen. Er ist zur Referenz `19d8375ed` vergleichbar,
  `accepted: true` und ohne Hard Failures; Action-Limit-Spiele sinken von eins
  auf null, Replay-Failures und Hidden-Info-Findings bleiben null.
- Finale Verifikation: 100 fokussierte Route-, Plan-, Encounter- und
  Entscheidungspunkt-Tests grün; alle drei AI-Shards mit 138 Dateien und
  1.018, 1.000 sowie 847 Tests grün. AI-Typecheck, Source-Structure,
  Hint-Metadaten, Contract-/Test-Discovery-, Format- und Hidden-Info-/Redaction-
  Gates sind grün. Der vollständige Standard-Baselinevergleich ist akzeptiert
  und vergleichbar.
- Nach konfliktfreier Integration des aktuellen `main` auf Merge-Commit
  `d9873956e` wurden die fachlichen und technischen Gates erneut ausgeführt:
  100 fokussierte Tests, 417 AI-Testdateien mit 2.881 Tests, AI-Typecheck,
  Source-Structure, Hint-Metadaten, Contracts, Test-Discovery sowie 19
  Hidden-Info-/Redaction-Tests sind grün. Der unveränderte Standardvergleich
  umfasst 60 Spiele und 12.323 Entscheidungen, ist zur Referenz `19d8375ed`
  vergleichbar und mit `accepted: true` ohne Hard Failure abgeschlossen.
  Action-Limit-Spiele, Replay-Failures und Hidden-Info-Findings bleiben null;
  der betroffene Seed-7-Slot endet weiterhin nach 472 Aktionen mit null
  `repeated_no_progress_run`, der Seed-10-Kontrollfall weiterhin nach 241
  Aktionen.
