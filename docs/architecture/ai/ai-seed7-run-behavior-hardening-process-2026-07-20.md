# Seed-7-Run-Verhalten der KI härten

Status: aktiv – Preflight

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

- Preflight: aktiv
- Paket 1: ausstehend
- Paket 2: ausstehend
- Paket 3: ausstehend
- Paket 4: ausstehend
- Final Verify, Merge und Cleanup: ausstehend
