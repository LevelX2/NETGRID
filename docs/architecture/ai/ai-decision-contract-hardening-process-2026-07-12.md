# KI-Entscheidungsverträge härten

Status: in Umsetzung

## Quelle und Zielprüfung

Quelle ist die logische Nachprüfung der Reparaturen aus Matchserie
`series_2781b26755923764`. Der Scope ist umsetzungsreif: Fünf konkrete
Architekturlücken, betroffene Module, Gegenbeispiele und Integrationsregeln
sind bestimmt.

## Gesamtziel

Wiederkehrende KI-Fehler dürfen nicht länger durch höhere oder niedrigere
Rohscores verdeckt werden. Placement, Kartenentwicklung, Breaker-Grenznutzen
und Suchfortschreibung erhalten gemeinsame fachliche Verträge. Reale
Engine-Inputs müssen die resultierende Auswahl des produktiven Choosers
belegen.

## Annahmen

- Effektive Karteneigenschaften aus `PlayerView` und konkrete `LegalActions`
  bleiben autoritativ.
- Ein fachlicher Defer-Vertrag ist kein absolutes Verbot: belegter unmittelbarer
  Mehrwert darf eine Ersetzung oder frühe Installation erlauben.
- Mehrfach-Breaker brauchen einen konkreten Variantenwert aus Deckdoktrin,
  sichtbarem ICE-Mix, Risiko oder Nutzungskosten; bloß verschiedene Namen
  reichen nicht.
- Such- und Vorbereitungsaktionen müssen ihr Ergebnis nicht zwingend im selben
  Zug verwenden, aber sie dürfen den erforderlichen Folgeaktionshorizont nicht
  fälschlich als erreichbar behandeln.

## Nicht-Ziele

- keine Kartenname-Sonderregeln in der Live-Auswahl;
- keine Hidden-Info- oder FullState-Abkürzungen;
- keine pauschale Neukalibrierung aller KI-Scores;
- keine Änderung der Engine-Legalität;
- kein Push oder Pull Request.

## Controller-Invarianten

1. Die Engine erzeugt alle LegalActions; die KI bewertet nur diese Aktionen.
2. Placement-Härte folgt einem typisierten Zustandsvertrag, nicht einer
   freistehenden Strafkonstante.
3. Alle Aktionen, die eine persistente Runner-Karte entwickeln, werden über
   genau eine Projektion auf Zielkarte und Entwicklungsphase klassifiziert.
4. Deckstrategie darf Breaker-Varianten nur mit nachvollziehbarer Evidence
   freigeben.
5. Jeder Suchschritt führt einen Folgeaktionsbedarf und einen Zeithorizont.
6. Mindestens ein Engine-erzeugter PlayerView-/LegalAction-Fall pro kritischem
   Vertrag läuft durch den produktiven Chooser.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Rote Tests werden im aktiven Paket an der gemeinsamen Quelle behoben. Falls
eine Entscheidung gegnerische verdeckte Informationen oder eine nicht
vorhandene LegalAction benötigt, stoppt der Prozess mit dokumentierter Removal
Condition. Fachlich inkompatible Änderungen auf einem weitergelaufenen `main`
sind ebenfalls Blocker.

## State Machine

`preflight -> corp_placement_contract -> persistent_development_route ->
breaker_variant_value -> followup_budget -> real_engine_gate -> main_merge ->
complete`

Genau ein Zustand ist aktiv. Jeder Zustand endet mit Tests, `git diff --check`
und einem eigenen Commit.

## Paketfolge

### Paket 1: Prozess und Evidence

- Reviewbefunde und Akzeptanzkriterien sichern.
- Done-Gate: Prozessartefakt vollständig, Worktree sauber.
- Commit: `docs(ai): define decision contract hardening process`

### Paket 2: Corp-Placement-Vertrag

- Upgrade ohne wirksamen Schutz als typisierte Defer-/Eligibility-Entscheidung
  modellieren.
- Regionsersatz über verlorenen und gewonnenen sichtbaren Nutzen bewerten.
- Gegenproben: ungeschütztes Upgrade verliert trotz hohem Genericscore;
  geschütztes Upgrade gewinnt; gleichwertige Region verliert; klarer
  unmittelbarer Mehrwert darf ersetzen.
- Commit: `fix(ai): replace corp placement score patches`

### Paket 3: Persistente Entwicklungsroute

- Eine zentrale Projektion für direkte Installation, Programmverdrängung,
  Shell Traders und künftige indirekte Installationswege einführen.
- Alle Handentwicklungs- und Scoreconsumer verwenden dieselbe Projektion.
- Gegenproben für Alias-Payload und nicht entwickelnde Target-Aktionen.
- Commit: `refactor(ai): centralize persistent development routes`

### Paket 4: Breaker-Variantenwert

- Reine Duplikate, Risikoersatz, Support und deckstrategisch begründete
  Alternativ-Breaker trennen.
- Deckdoktrin, sichtbare Abdeckung, MU und konkrete Zusatzfunktion als Evidence
  ausgeben.
- Gegenproben: Dwarf nach Pile Driver bleibt schwach; wirtschaftlich oder
  strategisch begründete Variante bleibt möglich.
- Commit: `fix(ai): model deck-aware breaker variants`

### Paket 5: Folgeaktionsbudget

- Gemeinsamen Planvertrag für Suche, Ziehen und Vorbereitung mit benötigten
  Folgeaktionen und Horizont ergänzen.
- Corp-Remote-Schutz und Runner-Coverage-Suche darauf umstellen.
- Gegenproben für letzten Klick, mehrzügige Fortsetzung und bereits gefundenes
  Ziel.
- Commit: `fix(ai): enforce plan followup action budgets`

### Paket 6: Real-Engine-Gate und Integration

- Matchnahe Szenarien mit Engine-erzeugten PlayerViews und LegalActions durch
  den produktiven Chooser führen.
- Vollständige AI-Suite, Typecheck, relevante Doctrine-/Readiness-Gates und
  `git diff --check` ausführen.
- Final Review und Projektlog aktualisieren, aktuelles `main` integrieren,
  erneut prüfen und lokal nach `main` mergen.
- Commit: `test(ai): gate hardened decision contracts`

## /Goal

`/Goal Arbeite den Prozess KI-Entscheidungsverträge härten vollständig und
sequenziell von Paket 1 bis Paket 6 im Worktree
C:\Projekte\NETGRID_AI_CONTRACT_HARDENING_20260712 auf Branch
codex/ai-contract-hardening ab. Nutze den Hauptworkspace nur für den finalen
lokalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus
und committe es vor dem nächsten Paket. Stoppe bei Hidden-Info-, LegalAction-
oder Engine-Korrektheitsblockern. Integriere am Ende aktuelles main, verifiziere
erneut, merge lokal nach main, entferne den Worktree und markiere das Goal erst
dann als complete.`

## Abschlusskriterien

- Keine der fünf Reviewlücken bleibt nur durch eine neue Scorekonstante
  verdeckt.
- Negative und positive Gegenbeispiele sind im produktiven Auswahlpfad grün.
- Real-Engine-Gates und vollständige AI-Gates sind grün.
- Arbeitsbranch ist lokal in `main` integriert; Worktree ist entfernt.
