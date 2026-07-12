# AI-Planportfolio und Remote-Doktrin – Prozess 2026-07-12

## Status

Direkte Umsetzung im Worktree
`C:\Projekte\NETGRID_AI_PLANPORTFOLIO_REMOTE_DOCTRINE` auf Branch
`codex/ai-planportfolio-remote-doctrine`.

Aktiver Agent: `release-implementation-agent`.

## Quelle und Vorgabe

Die bestehende Planebene kann kurze, geschlossene Sequenzen und einzelne
wiederholbare Aktionen bereits sinnvoll bewerten. Sie kann aber nicht mehrere
verschiedenartige Vorhaben gleichzeitig halten und nach Unterbrechungen wieder
aufnehmen. Insbesondere fehlen:

- ein langfristiges, servergebundenes Corp-Projekt zum Aufbau eines
  Scoring-Remotes;
- die Ableitung des tatsächlichen Remote-Bedarfs aus der Deckstrategie;
- die Trennung zwischen reaktivem Interrupt, kurzfristigem Vordergrundplan und
  wiederaufnehmbarem Hintergrundprojekt;
- ein gemeinsamer Fortschrittsbeitrag, wenn eine LegalAction mehrere Pläne
  gleichzeitig unterstützt.

Fast-Advance-, Rush-, Remote-Scoring-, Glacier-, Asset-Economy-, Ambush- und
Hybriddecks dürfen deshalb nicht denselben Remote-Aufbauvertrag erhalten.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise.

Bestimmbarer Endzustand:

1. Alle aktuellen TacticalPlan-Typen besitzen eine dokumentierte
   Ausführungsklasse.
2. Ein side-sicheres `RemoteDoctrineProfile` leitet Remote-Abhängigkeit,
   Remote-Zweck, Schutzziel, Aufbauzeitpunkt und Investitionsrahmen aus der
   bestehenden Deckstrategie und den eigenen Deckfähigkeiten ab.
3. Ein Planportfolio hält genau einen reaktiven Interrupt, höchstens einen
   Vordergrundplan und höchstens zwei Hintergrundprojekte.
4. Broker-/Bank-Economy beweist als Pilot wiederaufnehmbaren, begrenzten
   Hintergrundfortschritt.
5. Die Corp kann ein strategieabhängiges Zielremote über mehrere Züge
   aufbauen, unterbrechen, wiederaufnehmen und anhand sichtbarer Runner-
   Belastung neu bewerten.
6. Fast Advance, Rush, Remote Scoring, Glacier, Asset Economy, Ambush und
   Hybridverhalten bleiben voneinander unterscheidbar.
7. Alle Änderungen sind lokal committed, nach `main` integriert und der
   Prozess-Worktree sowie der gemergte Arbeitsbranch sind entfernt.

## Gesamtziel

Die produktive Semantic Runtime erhält eine generische, deterministische und
side-sichere Mehrplanebene. Die Ebene erzeugt keine Aktionen, sondern ordnet
bestehende TacticalPlans und LegalActions so, dass kurzfristige Konversionen,
reaktive Fenster, wiederholbare Economy und langfristige deckstrategische
Projekte kontrolliert ineinandergreifen.

## Annahmen

- Die bestehende Semantic Runtime bleibt der einzige produktive
  Entscheidungsweg.
- Bestehende TacticalPlans werden inkrementell angebunden; es gibt keinen
  Big-Bang-Ersatz aller Plantypen.
- Ein Planportfolio darf höchstens zwei Hintergrundprojekte halten, um
  unkontrollierte Konkurrenz und Debug-Unübersichtlichkeit zu vermeiden.
- Remote-Sicherheit wird nicht nur anhand der ICE-Anzahl bewertet, sondern über
  side-sichere sichtbare Pfadkosten, Runner-Ressourcen, Rez-Reserve und eine
  konservative Erholungsbelastung.
- Eine unklare oder widersprüchliche Deckstrategie führt zu einem
  konservativen Remoteprofil und nicht vorsorglich zu einer teuren
  Glacier-Investition.
- Die bestehenden aktuellen AI-Gates und die AI Behavior Baseline v1 bleiben
  Vergleichsgrundlage.

## Nicht-Ziele

- keine Änderung der Rules Engine oder LegalAction-Erzeugung;
- keine neuen Karten, Kartenfreischaltungen oder Kartenregeln;
- keine Rückschlüsse auf verdeckte gegnerische Hand- oder Deckdaten;
- keine Migration sämtlicher Runner-Pläne auf das Planportfolio;
- kein UI-Redesign der Plananzeige;
- kein Machine Learning und keine probabilistische Selbstanpassung;
- kein Push, Pull Request oder Remote-Merge;
- keine künstliche Rückwärtskompatibilität zu historischen Planern.

## Controller-Invarianten

- Die Engine bleibt einzige Regelautorität.
- Die KI wählt ausschließlich vorhandene `LegalActions`.
- `applyAction` bleibt finaler Guardrail.
- Planportfolio, Debug, Traces und Tests verwenden nur PlayerView,
  side-gefilterte PublicEvents, eigene erlaubte Deckmetadaten und
  LegalActions.
- Ein reaktiver oder garantierter Closeout darf Hintergrundprojekte
  unterbrechen, aber nicht ohne Abbruchgrund löschen.
- Ein Hintergrundprojekt darf akute Score-, Survival-, Access-, Trace- oder
  Rez-Fenster nicht blind übersteuern.
- Fast Advance erhält kein dauerhaftes Glacier-Projekt allein aufgrund einer
  sichtbaren Agenda.
- Ambush-Remotes dürfen nicht durch einen generischen Schutzvertrag
  unbeabsichtigt unattraktiv werden.
- Gleicher Input, gleicher Portfoliozustand und gleicher Seed müssen dieselbe
  Auswahl ergeben.

## Automatische Fehlerbehandlung

- Rote Pakettests werden im aktiven Paket eng debuggt; das Folgepaket startet
  erst nach grünem Done-Gate.
- Fehlende Semantik wird als konkrete Mapping- oder Hint-Lücke dokumentiert;
  die KI erzeugt keine Ersatzlegalität.
- Widerspricht eine neue Heuristik einem bestehenden Gegenfall, wird sie enger
  an Deckstrategie, Zielserver, sichtbaren Fortschritt oder Dringlichkeit
  gebunden.
- Neue `main`-Änderungen werden vor dem finalen Merge defensiv in den
  Arbeitsbranch integriert.
- Nicht zum Scope gehörende Änderungen werden nicht gestaged oder bereinigt.

## Sicherheitsblocker

Die Umsetzung stoppt mit Blocker-Report und Removal Condition, wenn:

- gegnerische Hidden-Info für Remote-Doktrin oder Schutzbewertung erforderlich
  wäre;
- eine gewünschte Aktion nicht als LegalAction existiert und nur durch
  AI-seitige Aktionserzeugung erreichbar wäre;
- Replay-, StateHash-, Visibility-, stale-action- oder illegal-action-Gates
  verletzt werden;
- ein Mergekonflikt denselben aktiven Vertrag fachlich unvereinbar definiert;
- Worktree-Cleanup relevante offene Änderungen verwerfen würde.

## State Machine

1. `preflight`
2. `process_contract`
3. `remote_doctrine`
4. `plan_portfolio`
5. `broker_pilot`
6. `corp_remote_project`
7. `plan_integration`
8. `verify_and_review`
9. `merge_main`
10. `cleanup`
11. `complete`

## Paketfolge

### P0 – Prozess- und Architekturvertrag

Ziel: Plantypen, Remote-Doktrin, Mehrplanrollen und Abnahmefälle verbindlich
festlegen.

Eingangsvoraussetzungen:

- sauberer Hauptworkspace auf `main`;
- eigener sauberer Worktree und Branch;
- aktueller AI-Architektur- und Statusstand gelesen.

Arbeit:

- dieses Prozessartefakt erstellen;
- separaten Architekturvertrag für Plantypen, Portfolio und
  `RemoteDoctrineProfile` erstellen;
- aktuelle TacticalPlan-Typen vollständig klassifizieren;
- Strategie- und Akzeptanzmatrix festhalten.

Kernartefakte:

- `docs/architecture/ai/ai-planportfolio-remote-doctrine-process-2026-07-12.md`
- `docs/architecture/ai/ai-planportfolio-remote-doctrine-contract.md`

Checks:

- Dokumentstruktur und Links prüfen;
- `git diff --check`.

Done-Gate:

- Vertrag deckt alle aktuellen Plantypen und alle sieben Strategieklassen ab;
- keine Runtimeänderung im Paket.

Commit: `docs(ai): define plan portfolio remote doctrine process`

### P1 – RemoteDoctrineProfile

Ziel: Deckstrategie und eigene Deckfähigkeiten in einen ausführbaren,
redigierten Remotevertrag übersetzen.

Eingangsvoraussetzung: P0 abgeschlossen.

Arbeit:

- `RemoteDoctrineProfile` und Ableitung implementieren;
- Remote-Abhängigkeit, Zweck, Schutzziel, Aufbauzeitpunkt,
  Investitionsrahmen, Confidence und Evidence modellieren;
- Fast Advance, Rush, Remote Scoring, Glacier, Asset Economy, Ambush und
  Hybridfälle testen;
- redigierte Diagnoseausgabe ergänzen;
- zunächst keinen produktiven Action-Score verändern.

Kernartefakte:

- neue fokussierte Doctrine-Module und Tests unter `packages/ai/src/`;
- Exporte über die aktuelle AI-Fassade nur soweit intern erforderlich.

Checks:

- fokussierte Vitest-Dateien;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:

- alle Strategieklassen ergeben den erwarteten Remotevertrag;
- side-safe Redaction ist getestet;
- keine Action-Auswahl ändert sich.

Commit: `feat(ai): derive remote doctrine from deck strategy`

### P2 – Planportfolio

Ziel: Parallele Planrollen, Wiederaufnahme und gemeinsame Aktionsbeiträge
einführen.

Eingangsvoraussetzung: P1 abgeschlossen.

Arbeit:

- Portfoliovertrag und Memory-Snapshot implementieren;
- Slots für Interrupt, Vordergrundplan und maximal zwei
  Hintergrundprojekte einführen;
- Lifecycle, Zielbindung, Meilensteine, Parent-/Child-/Support-Beziehungen,
  Cadence und Ressourcenbudgets modellieren;
- deterministische Revalidierung und Wiederaufnahme implementieren;
- bestehende TacticalPlans über einen Adapter einordnen;
- Action-Beiträge mehrerer Pläne ohne LegalAction-Erzeugung aggregieren.

Checks:

- fokussierte Portfolio-, Memory-, Progressions- und Redactiontests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:

- Interrupt unterbricht und Hintergrundplan wird danach wieder aufgenommen;
- Slotgrenzen und deterministische Sortierung sind getestet;
- kein bestehender TacticalPlan muss bereits vollständig migriert sein.

Commit: `feat(ai): add resumable tactical plan portfolio`

### P3 – Broker-/Bank-Pilot

Ziel: Wiederholbare Bank-Economy als begrenztes Hintergrundprojekt führen.

Eingangsvoraussetzung: P2 abgeschlossen.

Arbeit:

- Broker-/Bank-Aufbau in ein Portfolio-Hintergrundprojekt projizieren;
- maximal eine Aufbauaktion pro Zug und sinnvolle Zielschwellen sichern;
- Run-, Survival- und Funding-Interrupts zulassen;
- Cashout als kurzfristigen Kindplan behandeln;
- Wiederaufnahme und kein Load-/Cashout-Pingpong testen.

Checks:

- fokussierte Bank-, TacticalPlan- und Semantic-Runtime-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:

- Broker bleibt über mindestens einen fremden Vordergrundplan hinweg erhalten;
- Cadence und Cashout-Hysterese bleiben grün.

Commit: `feat(ai): run broker economy as background project`

### P4 – Strategieabhängiges Corp-Remote-Projekt

Ziel: Ein deckstrategisch erlaubtes Scoring-Remote langfristig aufbauen und
an sichtbare Runner-Entwicklung anpassen.

Eingangsvoraussetzung: P3 abgeschlossen.

Arbeit:

- `corp.establish_scoring_remote` als zielgebundenes Hintergrundprojekt
  implementieren;
- Meilensteine für Zielwahl, erste Sperre, Rez-Reserve, Schutzband,
  Payload-Bereitschaft und erneute Härtung modellieren;
- sichtbare effektive Pfadkosten und konservative Erholungsbelastung
  einbeziehen;
- Fast-Advance-, Rush-, Remote-Scoring-, Glacier-, Asset-, Ambush- und
  Hybridverträge respektieren;
- ein vorbereitetes Remote wiederverwenden statt unnötig neue Remotes zu
  öffnen.

Checks:

- fokussierte Remote-Projekt-, ICE-Platzierungs-, Contestability- und
  Strategietests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:

- Fast Advance baut keine generische Burg;
- Remote Scoring und Glacier bleiben am Zielremote;
- Ambush wird nicht generisch übergeschützt;
- sichtbare Runner-Verbesserung kann ein fertiges Remote erneut öffnen.

Commit: `feat(ai): establish strategy aware scoring remotes`

### P5 – Scorefenster und Zentralserver-Schutzböden

Ziel: Kurzfristige Scorepläne, Langzeitremote und zentrale Notfälle kohärent
verbinden.

Eingangsvoraussetzung: P4 abgeschlossen.

Arbeit:

- `corp.create_score_window` als Vordergrund-/Kindplan mit dem Remote-Projekt
  verbinden;
- dynamische Mindestschutzwerte für HQ und F&E modellieren;
- marginales Zentral-ICE oberhalb des Schutzbodens gegen ein unfertiges
  Zielremote abwägen;
- zentrale Notfälle als Interrupt behandeln und das Remote danach fortsetzen;
- gemeinsame Aktionsbeiträge für ICE, Economy, Rez-Reserve und Scorefenster
  sichtbar machen.

Checks:

- fokussierte Corp-Score-, Board-Triage-, ICE-Placement-, Planportfolio- und
  Semantic-Runtime-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:

- garantierter Same-Turn-Score bleibt dominant;
- zentrale Notfälle übersteuern korrekt und löschen das Remote-Projekt nicht;
- nach erfülltem zentralen Schutzboden fließt geeignetes marginales ICE
  strategieabhängig zum Zielremote.

Commit: `feat(ai): coordinate remote projects with score windows`

### P6 – Vergleich, Final Review und Integration

Ziel: Gesamtverhalten gegen aktuelle Gates und Baseline absichern und lokal
integrieren.

Eingangsvoraussetzung: P5 abgeschlossen.

Arbeit:

- gezielte Strategie- und Wiederaufnahmeszenarien abschließen;
- neue Planportfolio- und Remote-Fortschrittsmetriken ergänzen;
- vorhandene AI Behavior Baseline mit identischen Slots und Seeds erneut
  ausführen oder eine begründete, reproduzierbare fokussierte Vergleichsbasis
  erzeugen;
- Rohdaten lokal unter `data/local/` erhalten;
- Final Review, AI-Architekturübersicht, Current State und Wissenslog
  aktualisieren;
- aktuelles `main` defensiv integrieren;
- finale Checks ausführen;
- lokal nach `main` mergen;
- Worktree und gemergten Branch entfernen und die Entfernung doppelt prüfen.

Checks:

- paketnahe neue Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `corepack pnpm check:ai`;
- `corepack pnpm test:ai:shards` oder begründeter gleichwertiger aktueller
  AI-Gesamtcheck;
- `git diff --check`;
- Main-Status und Main-Diff-Check nach Merge.

Done-Gate:

- alle Must-Szenarien sind grün;
- technische Gates sind von Play-Strength-Evidence getrennt dokumentiert;
- Arbeitsbranch ist vollständig in `main` enthalten;
- Arbeits-Worktree und Branch sind nachweislich entfernt.

Commit: `docs(ai): finalize plan portfolio remote doctrine rollout`

## Verifikationsregeln

- Jeder Paketcheck wird vor dem Paketcommit ausgeführt.
- `git diff --check` ist in jedem Paket Pflicht.
- Timeout oder abgebrochene Tests gelten nicht als bestanden.
- Fokussierte Tests werden vor breiten Gates ausgeführt.
- Generated Churn und lokale Rohlaufdaten werden nicht versehentlich
  versioniert.
- Technische Legalitäts-/Replay-Sicherheit ist keine automatische
  Play-Strength-Freigabe.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-planportfolio-remote-doctrine`
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_AI_PLANPORTFOLIO_REMOTE_DOCTRINE`
- Hauptworkspace: `C:\Projekte\NETGRID`
- `main` bleibt lokaler Integrationsbranch.
- Umsetzung ausschließlich im Arbeits-Worktree.
- Genau ein Paket aktiv; Commit je abgeschlossenem Paket.
- Hauptworkspace nur für finalen Merge und Main-Verifikation verwenden.
- Kein Push und kein PR.
- Kein `git reset --hard`, kein pauschaler Revert und kein erzwungener
  Worktree-/Branch-Cleanup.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-Planportfolio und Remote-Doktrin vollständig und sequenziell
von P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md,
agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree
C:\Projekte\NETGRID_AI_PLANPORTFOLIO_REMOTE_DOCTRINE auf Branch
codex/ai-planportfolio-remote-doctrine. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere die Paketartefakte, führe Paketchecks aus und
committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe ohne
Rückfrage und schreibe einen Blocker-Report mit Removal Condition. Nach
Abschluss integriere aktuelles main defensiv, verifiziere final, merge lokal
nach main, prüfe main, entferne den sauberen Arbeits-Worktree, verifiziere die
Entfernung in Git und Dateisystem, lösche den vollständig gemergten
Arbeitsbranch und markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- P0 bis P6 sind ohne Überspringen abgeschlossen und jeweils committed.
- Deckstrategie steuert Remote-Bedarf, Zweck, Schutzband und Investition.
- Planportfolio hält und resümiert unterschiedliche Planformen kontrolliert.
- Broker-Pilot und Corp-Remote-Projekt besitzen reproduzierbare Tests.
- Kurzfristige Scorefenster und langfristiger Remote-Aufbau greifen
  deterministisch ineinander.
- Hidden-Info-, LegalAction-, Replay- und Engine-Grenzen bleiben intakt.
- Final Review und Current-State-Wissen sind aktualisiert.
- Lokaler Merge nach `main` ist erfolgt und geprüft.
- Worktree-Pfad fehlt im Dateisystem und in `git worktree list`.
- Arbeitsbranch ist nach nachgewiesenem Merge gelöscht.
