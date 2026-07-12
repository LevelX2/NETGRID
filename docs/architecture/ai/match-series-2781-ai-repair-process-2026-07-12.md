# Matchserie 2781: KI-Reparaturprozess

Status: abgeschlossen

## Quelle und Gesamtziel

Quelle ist die freigegebene Analyse der Matchserie
`series_2781b26755923764` mit den Matches
`match_0919a905d2772f18` und `match_95a8416194bb9ac4`.

Ziel ist, sechs belegte Ursachen generisch zu beseitigen:

1. effektive dynamische ICE-Subtypen muessen die Breaker-Abdeckung bestimmen;
2. ungeschuetzte oder noch wirkungslose Upgrades duerfen nicht leichtfertig
   exponiert werden;
3. nicht stapelbare Regionen duerfen nicht ohne nachgewiesenen Mehrwert
   unmittelbar ersetzt werden;
4. Suchplaene muessen eine Aktion zur Verwendung eines gefundenen Ergebnisses
   reservieren;
5. Broker muss bereits vor der Installation anhand des projizierten
   Folgezugriffs auf seine Ladefaehigkeit bewertet werden;
6. alle Installations- und Vorbereitungsvarianten muessen dieselbe
   deck- und boardsensitive Breaker-Grenznutzenbewertung verwenden.

## Nicht-Ziele

- keine Rohscore-Kalibrierung ohne fachlichen Zustandsvertrag;
- keine FullState- oder Hidden-Info-Abkuerzung im KI-Code;
- keine kartennamenspezifische Live-Sonderregel, wenn Typ-, Rollen- oder
  LegalAction-Semantik ausreicht;
- keine erneute Reparatur des bereits separat behobenen AI-Boon-Wuerfelpfads;
- kein Push und kein Pull Request.

## Controller-Invarianten

- LegalActions bleiben die einzige Aktionsquelle.
- Effektive, durch eine konkrete LegalAction gewaehlte Karteneigenschaften
  schlagen unverbindliche Woerter aus dem Regeltext.
- Ein Plan darf Support-Aktionen nur waehlen, wenn sein Ziel danach noch im
  selben Zug oder in einer expliziten mehrzuegigen Fortsetzung erreichbar ist.
- Direkte und indirekte Kartenentwicklung teilen dieselbe Nutzenbewertung.
- Deckstrategie kann Mehrfach-Breaker rechtfertigen; blosse Rollenidentitaet
  reicht dafuer nicht.
- Debug-Komponenten muessen die fachliche Ursache sichtbar machen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Bei roten Tests wird nur im aktiven Paket weiter debuggt. Wenn eine Reparatur
verdeckte Informationen oder eine nicht vorhandene LegalAction benoetigt, wird
ohne KI-Workaround gestoppt und ein Blocker mit Removal Condition dokumentiert.

## State Machine

`preflight -> corp_defense -> corp_plan_followup -> runner_economy ->
runner_breaker_utility -> final_verification -> main_merge -> complete`

Genau ein Zustand ist aktiv. Jeder Zustand endet mit Checks, `git diff --check`
und einem eigenen Commit.

## Paketfolge

### Paket 1: Preflight und Evidence

- Prozess- und Evidence-Artefakte anlegen.
- Scope, Matchanker und Akzeptanzkriterien sichern.
- Done-Gate: Dokumente vollstaendig, Worktree sauber strukturiert.
- Commit: `docs(ai): define match series 2781 repair process`

### Paket 2: Corp-Verteidigung

- Dynamische ICE-Subtypen in Breaker- und Rezbewertung autoritativ machen.
- Ungeschuetzte, nicht finanzierte oder ohne ICE wirkungslose Root-Upgrades
  boardsensitiv abwerten.
- Tests: Credit Blocks als Sentry gegen reinen Wall-Breaker; Gegenprobe Wall;
  ungeschuetztes Rasmin-aehnliches Upgrade und geschuetzte Gegenprobe.
- Commit: `fix(ai): harden corp effective defense choices`

### Paket 3: Corp-Planfortschreibung

- Unmittelbare Ersetzung nicht stapelbarer Regionen bewerten.
- Such-/Draw-Schritte mit Folgeaktionsbudget versehen und nach jedem Fund neu
  planen.
- Tests: zweite Region ersetzt erste nicht ohne Mehrwert; gefundene
  Schutzkarte wird mit letzter Aktion verwendet statt erneut zu ziehen.
- Commit: `fix(ai): preserve corp plan follow-through`

### Paket 4: Runner-Oekonomie

- Broker-Installation als projizierten Zustand inklusive anschliessender
  Ladung bewerten.
- Mehrzuegige Bankverpflichtung und Economy-Transition konsistent halten.
- Tests: Installation plus Ladung bei ausreichenden Credits/Aktionen;
  Gegenproben bei fehlender Liquiditaet oder akutem Run-/Survival-Zwang.
- Commit: `fix(ai): project broker economy setup`

### Paket 5: Breaker-Grenznutzen

- Direkte Installation, Vorab-Programmtrash und Shell-Traders-Vorbereitung
  durch denselben Grenznutzenpfad fuehren.
- Bestehende Abdeckung und Deckstrategie gemeinsam beruecksichtigen.
- Tests: redundanter Dwarf und zweiter Cyfermaster verlieren; komplementaerer
  oder deckstrategisch begruendeter Zweit-Breaker bleibt moeglich.
- Commit: `fix(ai): unify breaker marginal utility`

### Paket 6: Abschluss und Integration

- Fokussierte Tests, angrenzende Tests, AI-Typecheck und `git diff --check`.
- Final Review und Juli-Projektlog aktualisieren.
- Aktuelles `main` integrieren, erneut pruefen und lokal nach `main` mergen.
- Commit: `docs(ai): close match series 2781 repairs`

## /Goal

`/Goal Arbeite den Prozess Matchserie 2781 vollstaendig und sequenziell von
Paket 1 bis Paket 6 im Worktree
C:\Projekte\NETGRID_AI_SERIES_2781_FIXES auf Branch
codex/ai-series-2781-fixes ab. Committe jedes abgeschlossene Paket. Nutze den
Hauptworkspace nur fuer den finalen lokalen Merge. Stoppe bei Side-Safety-,
LegalAction- oder Engine-Korrektheitsblockern. Markiere das Goal erst nach
erfolgreicher Main-Integration als complete.`

## Abschlussnachweis

- Paket 1: Evidence und Prozessvertrag mit Match-, Turn- und Decision-Ankern
  festgeschrieben.
- Paket 2: effektive ICE-Subtypen und ICE-abhaengige Upgrade-Platzierung teilen
  jetzt die tatsaechliche Boardsemantik.
- Paket 3: Regionsersatz hat einen eigenen Mehrwertvertrag; Schutzsuche
  reserviert die letzte Aktion fuer ein bezahlbares gefundenes ICE.
- Paket 4: Broker wird vor der Installation mit verbleibenden Credits,
  Aktionen, Ladefaehigkeit und akutem Runfenster projiziert.
- Paket 5: direkte Installation, Programmtrash-Variante und Shell Traders
  verwenden dieselbe Zielkarten- und Grenznutzenbewertung. Reine
  Breaker-Zahlkosten erzeugen keine falsche Economy-Faehigkeit.
- Paket 6: 292 AI-Testdateien mit 1.923 Tests, AI-Typecheck und
  `git diff --check` sind gruen.
