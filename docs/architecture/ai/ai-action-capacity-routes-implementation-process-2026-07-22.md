# KI-Aktionsökonomie, Aktionskapazität und Tempo-Routen – Umsetzungsprozess

Status: in Umsetzung

Datum: 2026-07-22

Arbeitsbranch: `codex/ai-action-capacity-routes`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ACTION_CAPACITY_ROUTES`

## Quelle und Vorgabe

Dieser Prozess setzt den am 2026-07-22 im Projektchat freigegebenen Plan zur
Vereinheitlichung der NETGRID-Aktionsökonomie um. Ausgangspunkt ist die
Beobachtung, dass die Corp zusätzliche Aktionen bereits in konkreten
Same-turn-Scoresequenzen verwenden kann, die zugrunde liegende Ressource aber
außerhalb dieses Sonderpfads nicht allgemein projiziert, reserviert und nach
ihrem tatsächlich möglichen Folgeergebnis bewertet wird.

Der Zielvertrag umfasst Runner und Corp sowie sofortige, eingeschränkte,
gespeicherte, wiederkehrende, zukünftige, zufällige, verpflichtende und
geschuldete Aktionen. Die Rules Engine und ihre LegalActions bleiben die
einzige Autorität für aktuelle Aktionsstände, Kosten und unmittelbar
garantierte Effekte.

## Zielprüfung

Die Vorgabe ist für die automatische sequenzielle Umsetzung ausreichend
präzise:

- Der erwartete Endzustand ist durch die bestätigten Aktionsinvarianten und
  die Overtime-/Corporate-Boon-/Pacifica-Vergleichsfälle bestimmt.
- Die fachliche Reihenfolge ist von Inventur und LegalAction-Projektion über
  Demand-/Routenplanung bis zu Planintegration und Scoring ableitbar.
- Engine, AI, Hints, Diagnostik, Tests, Baseline und Wissenspflege sind im
  Scope.
- Der vorhandene Corp-Same-turn-Scorepfad bleibt fachlich erhalten und wird
  auf den gemeinsamen Vertrag migriert.
- Main-Integration und Worktree-Cleanup sind durch den aktivierten
  `paketprozess-worktree-goal` verbindlich.

Noch zu kalibrierende Scoringwerte sind keine Ziellücke. Die Aktionsbewertung
wird vorrangig aus garantierter Folgekonversion abgeleitet und anschließend
mit fokussierten Tests und einer gezielten AI Behavior Baseline geprüft.

## Gesamtziel

NETGRID besitzt nach Abschluss einen gemeinsamen side-sicheren
Aktionskapazitätsvertrag. Jede relevante LegalAction beschreibt ihre
tatsächlichen Aktionskosten, den erzeugten Aktionsbetrag, Nettoaktionsdelta,
Zeitpunkt, Einschränkung, Verfall, Zuverlässigkeit und sichtbare
Zusatzressourcenkosten. Typisierte `ActionDemand`s und begrenzte
`ActionCapacityRoute`s machen erklärbar, welcher konkrete Plan durch eine
zusätzliche Aktion ermöglicht wird.

Eine Aktionsquelle erhält keinen pauschalen hohen Wert. Ihr Wert folgt der
besten garantierten kompatiblen Folgeaktion beziehungsweise einer konkreten
Plan-Konversion. Overtime Incentives darf eine ansonsten unmögliche
Install-plus-drei-Advances-Scoreline ermöglichen, soll aber nicht ohne
produktive Folge nur wegen des Rohbetrags gespielt werden. Bereits im
PlayerView vorhandene vier, fünf oder mehr Aktionen bleiben direkt
autoritativ.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Interne AI-Verträge, Diagnostikschemas und lokale Baseline-Artefakte haben
  in Version 0 keine Rückwärtskompatibilitätspflicht.
- Aktuelle Aktionen kommen ausschließlich aus `PlayerView.own.clicks`.
- Unmittelbare Aktionsgewinne und Kosten kommen aus LegalActions; Hints
  klassifizieren strategische Familie, Dauer, Einschränkung und Risiko.
- Same-turn-Routen werden exakt und geordnet behandelt. Der nächste eigene
  Zug und wiederkehrende Engines werden begrenzt projiziert; es entsteht kein
  unbeschränkter Spielbaum.
- Freie, Install-only-, Run-only-, zufällige und verpflichtende Aktionen sind
  nicht fungibel.
- Eine verbrauchte Handkarte, Credits, Counter, Selbstschaden und
  Aktionsschuld werden genau einmal als Kosten berücksichtigt.
- Eine endende Aktion ohne Folgekonversion besitzt höchstens den Wert der
  besten tatsächlich legalen Standard- oder Planfolge, nicht zusätzlich
  einen unabhängigen vollen Aktionsbonus.
- Corporate Boon ist eine finite Aktionsbank mit möglichem Haltewert;
  Overtime Incentives ist ein sofortiger Burst; wiederkehrende Engines bilden
  eine eigene Amortisationsklasse.

## Nicht-Ziele

- Keine Änderung von Spielregeln oder Kartenlegalität zugunsten der KI.
- Kein vollständiger Minimax- oder unbeschränkter Sequenzsucher.
- Keine Gleichsetzung aller Aktionsarten mit einem einzigen festen Punktwert.
- Keine Ablösung des TacticalPlan-/Planportfolio-Controllers.
- Keine automatische Bewertung verdeckter gegnerischer Karten.
- Keine Vermischung von aktuellem Aktionsbestand mit erwarteten zukünftigen
  Aktionen.
- Kein Push, Pull Request oder Remote-Merge.
- Draw-/Handqualitäts-Neuentwurf bleibt außerhalb dieses Prozesses; der
  vorhandene Handentwicklungsvertrag wird nur als Folgeaktionsnutzen genutzt.

## Controller-Invarianten

1. Die Rules Engine ist die einzige Regelautorität.
2. Die KI wählt ausschließlich aus LegalActions und side-sicheren
   PlayerViews/PublicEvents.
3. `PlayerView.own.clicks` ist der aktuelle, bereits aufgelöste
   Aktionsbestand; die KI erfindet keinen Basiswert von drei oder vier.
4. Für unmittelbare Quellen gilt
   `netActionDelta = actionsGained - actionCost`.
5. Eingeschränkte Aktionen erfüllen nur kompatible Folgeaktionen und
   `ActionDemand`s.
6. Eine harte Planlücke gilt nur durch eine vollständig garantierte Route als
   geschlossen.
7. Kontingente, zufällige oder zukünftige Routen dürfen geplant, aber nicht
   als bereits verfügbare Aktionskapazität ausgegeben werden.
8. Folgeaktionsnutzen, Planbeitrag und Grundwert werden nicht doppelt gezählt.
9. Dieselbe Aktion, derselbe Counter und dieselben Credits dürfen nicht in
   inkompatiblen Routen doppelt reserviert werden.
10. Aktionsbanken dürfen gehalten werden, wenn ein konkreter gebundener
    Folgezugsbedarf ihren aktuellen besten Einsatz übersteigt.
11. Wiederkehrende Engines erhalten nur Wert für plausibel nutzbare eigene
    Züge innerhalb des begrenzten Horizonts und unter sichtbarem Risiko.
12. Ein größerer Rohaktionsgewinn dominiert einen kleineren nur bei gleichen
    Kosten, Einschränkungen, Risiken, Verfallsregeln und Folgeoptionen.
13. Nach jeder Action werden LegalActions, Demand, Route und Planbindung neu
    bewertet.
14. Replay, StateHash, stale-action validation und Hidden-Info-Grenzen
    bleiben unverändert bindend.

## Automatische Fehlerbehandlung

- Bei einem roten Paketcheck wird nur das aktive Paket eng diagnostiziert.
- Kein Folgepaket beginnt, solange das Done-Gate des aktuellen Pakets nicht
  erfüllt oder ein Sicherheitsblocker dokumentiert ist.
- Fehlende Engine-Fakten werden nicht aus Rules Text geraten.
- Eine fehlende Hintklassifizierung bleibt ein Auditfinding, bis Engine- und
  Kartenvertrag abgeglichen sind.
- Scheitert eine kontingente Route zur Laufzeit, wird sie invalidiert und aus
  den aktuellen LegalActions neu geplant.
- Neue kompatible `main`-Änderungen werden vor dem finalen Merge inhaltlich
  erhalten.

## Sicherheitsblocker

Die Arbeit stoppt mit Blocker-Report und Removal Condition, wenn:

- eine notwendige Projektion nur über verdeckte gegnerische Daten möglich
  wäre;
- Engine und führender Kartenvertrag fachlich unauflösbar widersprechen;
- ein harter Planblocker nur durch erfundene oder illegale Folgeactions als
  gelöst markiert werden könnte;
- Replay-, StateHash-, stale-action- oder Hidden-Info-Gates nach enger
  Diagnose nicht wiederherstellbar sind;
- der finale Merge oder Cleanup relevante fremde Änderungen verwerfen würde.

## State Machine

```text
prepared
  -> P0_active -> P0_committed
  -> P1_active -> P1_committed
  -> P2_active -> P2_committed
  -> P3_active -> P3_committed
  -> P4_active -> P4_committed
  -> P5_active -> P5_committed
  -> P6_active -> P6_committed
  -> P7_active -> final_verified
  -> main_merged -> worktree_removed -> branch_removed -> complete
```

Zu jedem Zeitpunkt ist genau ein Paket aktiv.

## Paketfolge

| Paket | Titel                      | Primäres Ergebnis                                    |
| ----- | -------------------------- | ---------------------------------------------------- |
| P0    | Prozess und Inventur       | Akzeptanzvertrag und reproduzierbarer Action-Audit   |
| P1    | Ressourcenprojektion       | kanonische side-safe `ActionCapacityProjection`      |
| P2    | Hints und Kartenverträge   | normalisierte Action-Tempo-Familien                  |
| P3    | Bedarfe und Routen         | `ActionDemand` und begrenzte Routensuche             |
| P4    | Planintegration            | gemeinsame Projektion im Scorepfad und Planportfolio |
| P5    | Scoring und Spezialklassen | Folgeaktionsnutzen, Dominanz, Banken, Amortisation   |
| P6    | Migration und Diagnostik   | alte Sonderpfade entfernt, Evidence vollständig      |
| P7    | Abschluss                  | Gesamtchecks, Baseline, Wissen, Merge und Cleanup    |

## Paketdetails

### P0 – Prozessartefakt, Akzeptanzvertrag und Aktionsinventur

Ziel:

- Prozess, Invarianten und reproduzierbare Bestandsaufnahme festschreiben.

Konkrete Arbeit:

- dieses Prozessartefakt anlegen;
- Action-Hints, direkte Engine-Clickmutationen, schmale
  `scoreConversionActionGainAmount`-Consumer und Rules-Text-Parser erfassen;
- Zielverträge für Overtime, Corporate Boon, Subsidiary Branch, Nevinyrral
  und Pacifica definieren;
- Akzeptanzfälle für freie, eingeschränkte, gespeicherte, wiederkehrende,
  zufällige und geschuldete Aktionen festlegen.

Kernartefakte:

- dieses Dokument;
- `scripts/audit-ai-action-capacity-contracts.mjs`;
- Root-Script `audit:ai-action-capacity`.

Checks:

- Audit ausführen;
- Script-Syntax prüfen;
- `git diff --check`.

Done-Gate:

- jede gefundene Action-Familie ist klassifiziert oder als Finding erfasst;
- der Ist-Stand ist reproduzierbar;
- Prozess und Audit sind committed.

Commit: `docs(ai): define action capacity route process`

### P1 – Kanonische LegalAction-Aktionsprojektion

Ziel:

- aktuelle Kosten und unmittelbar erzeugte Aktionskapazität aller relevanten
  LegalActions über einen gemeinsamen Vertrag bereitstellen.

Konkrete Arbeit:

- `ActionCapacityProjection` typisieren und an
  `ActionSemanticCandidate` anbinden;
- `actionCost`, `actionsGained`, `netActionDelta`, Timing, Restriktion,
  Zuverlässigkeit, Verfall und sichtbare Zusatzkosten projizieren;
- generische Engine-Payloads für `gain_actions` bereitstellen;
- Spezialpfade für Run-only-, Install-only- und Counteraktionen anbinden;
- Aktionsschuld getrennt von sofortiger Kapazität abbilden.

Checks:

- Engine-/AI-Unit-Tests für Overtime, Corporate Boon, Pacifica, Wilson,
  Edgerunner Temps und `forgo_action`;
- PlayerView-Werte oberhalb des normalen Zugstarts;
- Typechecks und `git diff --check`.

Done-Gate:

- unmittelbare Aktionsgewinne werden ohne Kartentextparser erkannt;
- Einschränkungen und Unsicherheit bleiben explizit;
- Kosten werden genau einmal projiziert.

Commit: `feat(ai): project legal action capacity`

### P2 – Action-Hints und Kartenverträge

Ziel:

- jede Action-Tempo-Familie besitzt einen eindeutigen Hintvertrag, der keine
  zweite Regelautorität erzeugt.

Konkrete Arbeit:

- fehlende Beträge, Ressourcen, Timing-, Restriktions-, Bank- und
  Risikoklassifizierungen normalisieren;
- Pacifica und weitere Auditfindings schließen;
- sofortige Bursts, Counterbanken, recurring/future, restricted,
  random/mandatory und debt unterscheiden;
- `check:ai-action-capacity` als hartes Gate aktivieren.

Checks:

- Hint-Metadaten-/Ontologiechecks;
- Action-Audit ohne Zielvertragsverletzung;
- Kartenfamilien-Vertragstests;
- `git diff --check`.

Done-Gate:

- alle Audit-Zielverträge sind eindeutig;
- dynamische oder zufällige Werte werden nicht als garantierter Betrag
  ausgegeben.

Commit: `fix(ai): normalize action capacity card contracts`

### P3 – Typisierte ActionDemands und begrenzte ActionCapacityRoutes

Ziel:

- konkrete Aktionslücken mit Deadline, Restriktion und Garantiegrad
  modellieren.

Konkrete Arbeit:

- `ActionDemand`, Priorität, Hardness, Deadline und akzeptierte
  Restriktionen einführen;
- aktuelle Planlücken aus Corp-Score-/Schutzsequenzen und Runner-
  Install-/Run-/Survivalsequenzen ableiten;
- geordnete Same-turn-Routen deterministisch suchen;
- zukünftige/recurring Routen begrenzt und als kontingent behandeln;
- Counter-, Credit-, Karten-, Risiko- und Actionkosten reservieren;
- dominierte Routen beschneiden.

Checks:

- Unit-Tests für Prioritäten und Restriktionskompatibilität;
- Overtime-Closeout, Corporate-Boon-Counter, Pacifica-Doppelbelegung,
  Run-only und Install-only;
- kontingente Route löst harten Blocker nicht vorzeitig;
- `git diff --check`.

Done-Gate:

- eine Route besteht nur aus legalen aktuellen Actions oder ausdrücklich
  markierten zukünftigen Projektionen;
- Same-turn-Reihenfolge und Aktionssaldo sind korrekt.

Commit: `feat(ai): plan typed action capacity routes`

### P4 – Scorekonversion und Planportfolio-Integration

Ziel:

- den vorhandenen funktionierenden Scorepfad auf den gemeinsamen Vertrag
  migrieren und ActionDemands planweit nutzbar machen.

Konkrete Arbeit:

- `scoreConversionActionGainAmount`-Sonderconsumer ersetzen;
- bestehende Same-turn-Scorepfade verhaltensgleich über Projektion/Routen
  ausführen;
- TacticalPlans veröffentlichen ActionDemands;
- Planportfolio reserviert Actions und Quellressourcen ohne Doppelbelegung;
- Route in PlanMemory führen und nach Zustandsänderung revalidieren.

Checks:

- bestehende Scorekonversionssuite unverändert grün;
- Install plus drei Advances nach Overtime;
- Aktionsquelle bleibt ungenutzt, wenn die Scoreline bereits passt;
- Vordergrund- gegen Hintergrundplan und Routeninvalidierung;
- `git diff --check`.

Done-Gate:

- es existiert kein zweiter Action-Controller;
- der bewährte Scorefall bleibt erhalten und ist allgemeiner Consumer.

Commit: `feat(ai): integrate action routes into plan portfolio`

### P5 – Gemeinsame Bewertung, Folgeaktion, Banken und Amortisation

Ziel:

- Runner und Corp bewerten Aktionskapazität aus tatsächlicher
  Folgekonversion statt aus Rohaktionsmenge.

Konkrete Arbeit:

- unmittelbaren Floor aus bester garantierter Folgeaction ableiten;
- Planbeitrag genau einmal addieren;
- Karten-, Credit-, Counter-, Risiko- und Schuld-Kosten berücksichtigen;
- Dominanz für wirklich vergleichbare Quellen durchsetzen;
- finite Aktionsbanken mit Reservevertrag modellieren;
- wiederkehrende Engines begrenzt amortisieren;
- random/mandatory/restricted Actions risikogerecht behandeln.

Checks:

- Overtime mit Scorefolge > Overtime nur für Basic Credit;
- +2 > +1 bei gleichen Folgen, Kosten und Einschränkungen;
- Corporate Boon jetzt nutzen versus gebundene spätere Scoreline;
- wiederkehrende Engine mit und ohne nutzbaren Horizont;
- Runner-Selbstschaden, Run-only und Install-only;
- `git diff --check`.

Done-Gate:

- keine Aktionsquelle erhält doppelten Roh- plus Folgenutzen;
- vergleichbare Entscheidungen sind monoton und diagnostisch erklärbar.

Commit: `feat(ai): unify action capacity scoring`

### P6 – Altlogik, Diagnostik und Regression

Ziel:

- produktive Aktionsökonomie vollständig auf Projektion, Demand, Route und
  gemeinsamen Scorevertrag umstellen.

Konkrete Arbeit:

- Rules-Text-Aktionsmengenerkennung entfernen;
- schmale Feld- und Kartenfamilien-Sonderpfade klassifiziert migrieren;
- Annahmen über normale Aktionszahlen prüfen;
- DecisionDebug um Projektion, Demand, Route, Konversion und Dominanz
  erweitern;
- Baseline-Metriken für Chancen, Nutzung, Verfall und Fehlkonversion ergänzen.

Checks:

- fokussierte Runner-/Corp-Regressionssuiten;
- Diagnose-Snapshots und side-safe Redaction;
- AI-/Engine-Typecheck, `check:ai`, Action-Audit und relevante Vollsuiten;
- `git diff --check`.

Done-Gate:

- kein produktiver Consumer ermittelt Aktionsmengen aus Rules Text;
- Debug erklärt Auswahl und Nichtauswahl einer Aktionsquelle;
- keine normale Drei-/Vier-Aktionsannahme überschreibt den Engine-Wert.

Commit: `refactor(ai): retire legacy action capacity paths`

### P7 – Gesamtverifikation, Baseline, Wissen, Merge und Cleanup

Ziel:

- den Gesamtvertrag technisch und verhaltensbezogen abnehmen und lokal
  vollständig integrieren.

Konkrete Arbeit:

- fokussierte und vollständige Checks ausführen;
- gezielte Action-Tempo-Slots mit Overtime, Corporate Boon, recurring,
  restricted und risk/reward gegen kompatible Referenz vergleichen;
- AI Behavior Baseline und Hard Gates prüfen;
- Prozess, Review, Projektstatus und Monatslog aktualisieren;
- aktuelles `main` integrieren und finale Checks wiederholen;
- lokal nach `main` mergen;
- Worktree und Branch nach Skillvertrag entfernen und doppelt verifizieren.

Checks:

- keine illegalen Actions, Replay-/StateHash-/Action-Limit-/Fallback-/
  Timeout-/Runtime-/Hidden-Info-/Redaction-Fehler;
- keine klar dominierte Action-Tempo-Planwahl;
- keine neue No-progress- oder Extra-Action-Verfallsschleife;
- vollständige risikoadäquate Projektchecks;
- `git status --short` und `git diff --check` auf Branch und `main`.

Done-Gate:

- alle Paketcommits liegen auf `main`;
- Worktree ist in Git und Dateisystem entfernt;
- Arbeitsbranch ist gelöscht;
- erst danach wird das Goal abgeschlossen.

Commit: `docs(ai): verify action capacity route rollout`

## Verifikationsregeln

- Jeder Paketcheck läuft im Arbeits-Worktree.
- Vor jedem Paketcommit läuft `git diff --check`.
- Nur paketzugehörige Änderungen werden gestaged.
- Tests laufen zunächst fokussiert, dann paketweit und in P7 vollständig.
- Snapshot- und Baselineänderungen werden nicht blind akzeptiert.
- Ein `n/a` ist kein Nullwert; Siegquote ist Kontext, kein alleiniges Gate.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_ACTION_CAPACITY_ROUTES`.
- Arbeitsbranch ausschließlich `codex/ai-action-capacity-routes`.
- Hauptworkspace nur für finalen lokalen Merge und Cleanup verwenden.
- Kein `git reset --hard`, kein pauschales Revert, kein Force-Cleanup.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren.
- Fast-forward-Merge nach `main` bevorzugen.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

```text
/Goal Arbeite den NETGRID-Prozess Aktionsökonomie, Aktionskapazität und
Tempo-Routen vollständig und sequenziell von P0 bis P7 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, den Pflicht-Einstieg der Wissensbasis,
agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_AI_ACTION_CAPACITY_ROUTES auf
Branch codex/ai-action-capacity-routes. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket. Führe Paketchecks und
git diff --check aus, dokumentiere nicht ausgeführte Checks und committe jedes
abgeschlossene Paket einzeln. Bei Sicherheitsblocker stoppe mit
Blocker-Report und Removal Condition. Integriere nach P7 aktuelles main,
verifiziere final, merge lokal nach main, prüfe main, entferne den sauberen
Arbeits-Worktree, verifiziere die Entfernung in Git und Dateisystem und lösche
den vollständig gemergten Arbeitsbranch. Markiere das Goal erst danach als
complete.
```

## Abschlusskriterien

Der Prozess ist nur abgeschlossen, wenn:

- P0 bis P7 jeweils ihr Done-Gate erfüllen und committed sind;
- aktuelle zusätzliche Aktionen aus dem PlayerView korrekt weiterverwendet
  werden;
- zukünftige Aktionsgewinne aus LegalActions projiziert werden;
- Overtime eine garantierte vollständige Scoreline erzeugen kann;
- unnötige oder nicht konvertierbare Bursts nicht pauschal bevorzugt werden;
- eingeschränkte, gespeicherte, wiederkehrende, zufällige und geschuldete
  Aktionen eigene korrekte Verträge besitzen;
- alte Rules-Text- und Doppelwertungspfade entfernt sind;
- Replay-, StateHash-, stale-action-, Illegal-action- und Hidden-Info-Gates
  bestehen;
- Baseline und gezielte Action-Tempo-Evidence keine harten Gates verletzen;
- Wissen und Diagnostik den neuen Vertrag wiedergeben;
- `main` den vollständigen Stand enthält;
- Worktree und Arbeitsbranch verifiziert entfernt sind.

## P0-Inventurstand

Der reproduzierbare Startaudit über 618 aktive Hintprofile meldet:

- 50 Karten mit Action-Capacity-, Action-Restriction- oder Action-Debt-
  Signalen;
- 4 eindeutig feste unmittelbare Action-Gain-Hints;
- 33 recurring/future Action-Familien;
- 4 restricted/random/mandatory Familien;
- 10 Action-Debt-/Action-Loss-Familien;
- 10 produktive Engine-Dateien mit direkten Clickmutationen;
- 2 produktive Consumer des schmalen
  `scoreConversionActionGainAmount`-Vertrags;
- 2 produktive Rules-Text-Aktionsparser;
- 1 Zielvertragsfinding: Pacifica Regional AI besitzt noch keinen
  vollständigen Betrag-/Ressourcenvertrag im Hint.

Diese Findings sind Arbeitsvorrat für P1, P2 und P6, keine offenen
fachlichen Blocker.

## P1-Ergebnis

P1 projiziert Aktionskapazität nun als eigenen side-sicheren Vertrag an jedem
`ActionSemanticCandidate`. Der Vertrag trennt gelistete Aktionskosten von
vorher benötigten Aktionen, Bruttogewinn von Folgekapazität und
Current-turn-Netto von zukünftigen Grants. Dadurch wird Wilsons
selbstfinanzierter Run nicht als freier Folgeklick gezählt, während Overtime,
Corporate Boon und Pacifica freie Folgekapazität sowie Edgerunner Temps und
Valu-Pak ausschließlich kompatible Installationskapazität veröffentlichen.
Aktionsschuld und mehrturnige Grants bleiben getrennte Klassen.

Die Engine veröffentlicht dafür strukturierte LegalAction-Fakten aus den
deklarativen Effekten und Utility-Verträgen; Kartentext wird nicht gelesen.
Die AI-DTO-Allowlist erhält Betrag, Timing, Restriktion, Verfall,
Zuverlässigkeit, Selbstfinanzierung und sichtbare Counterkosten.

P1-Prüfstand:

- 49/49 fokussierte Projektions-, DTO- und Engine-Vertragstests grün;
- 69/69 Longtail-/Runner-/Corp-Main-Action-Regressionstests grün;
- 18/18 Wilson-/Scorekonversionsregressionen grün;
- AI-Shard 2 mit 1.037/1.037 und Shard 3 mit 911/911 Tests grün;
- AI-Shard 1 mit 1.069/1.070 Tests; der einzige rote starre
  Deckkatalog-Zähler (`41` statt `40`) ist auf unverändertem `main`
  reproduziert;
- Engine-Typecheck grün;
- der AI-Typecheck besitzt auf Branch und unverändertem `main` dieselben drei
  bereits vorhandenen Nullability-Befunde in
  `run-access-decision-model.ts`.

## P2-Ergebnis

P2 ersetzt die grobe Signalheuristik durch typisierte
`actionCapacityProfiles`. Die Profile unterscheiden unmittelbaren Gewinn,
finite Banken, wiederkehrenden und zukünftigen Gewinn, eingeschränkte,
zufällige und verpflichtende Aktionen, Aktionsschuld und -verlust sowie
Aktionskosten und Run-Locks. Betragstyp, Empfänger, Restriktion,
Zuverlässigkeit, Quellenressource, Verfall, Bankfähigkeit, Wiederholbarkeit
und kompatible Action-Typen sind explizit. Diese Angaben klassifizieren die
strategische Familie; LegalActions bleiben Autorität für die gerade legale
Menge und Auflösung.

Der normalisierte Audit korrigiert dabei die P0-Grobschätzung: 46 statt 50
Karten besitzen tatsächlich einen Aktionskapazitäts-, Kosten- oder
Lock-Vertrag. Credit- und Agenda-Point-Effekte mit historisch ungenauem
`action_penalty`-Label werden nicht mehr als Actions gezählt. Die 46 Profile
teilen sich in acht feste unmittelbare Quellen, sieben recurring/future,
sechs restricted/random/mandatory, fünf debt/loss und 25 cost/lock Karten;
Mehrfachzuordnung ist bei Karten mit mehreren Wirkungen beabsichtigt.

Pacifica veröffentlicht nun den fehlenden festen Betrag `1`, die Ressource
`actions` und ihren Advancement-Counter-Bankvertrag. Valu-Pak, Wilson,
Edgerunner, Corporate Guard, Quest for Cattekin, Bargain with Viacox und
Arasaka besitzen ebenfalls explizite Zielverträge. Der reproduzierbare
Normalizer und `check:ai-action-capacity` sind harte Gates.

P2-Prüfstand:

- Action-Capacity-Audit mit null Zielvertragsverletzungen und null
  unprofilierten strukturierten Action-Effekten grün;
- Normalizer-Idempotenzcheck grün;
- 43/43 fokussierte Hint-, Ontologie-, Metadaten- und Semantiktests grün;
- `check:ai` grün;
- der AI-Typecheck zeigt weiterhin ausschließlich die drei auf `main`
  reproduzierten Nullability-Befunde.

## P3-Ergebnis

P3 führt typisierte `ActionDemand`s mit Zweck, Priorität, Härte, Deadline,
aktuellem und benötigtem Aktionsstand, akzeptierten Restriktionen und
benötigten Action-Typen ein. Ein Adapter leitet diese Bedarfe aus Corp-
Score-/Remote-Schutzplänen sowie Runner-Breaker-, Run- und
Survival-Sequenzen ab. Bereits von der Engine gemeldete vier, fünf oder mehr
Actions erzeugen entsprechend keinen künstlichen Gap.

Die begrenzte `ActionCapacityRoute`-Suche verwendet nur vorhandene
ActionSemanticCandidates beziehungsweise ausdrücklich markierte
Future-Projections. Sie führt Brutto-/Nettoaktionen, selbstfinanzierte
Inline-Konversion, freie und eingeschränkte Pools, Credits, verbrauchte
Karten und sichtbare Source-Counter. Overtime, Corporate Boon/Pacifica,
Wilson und Edgerunner werden dadurch verschieden, aber über denselben
Vertrag behandelt. Future-/recurring- und risikobehaftete Schritte bleiben
kontingent und lösen einen harten Blocker nicht.

Dominanz wird nur zwischen Routen mit gleichem Restriktionsprofil geprüft.
Eine größere ansonsten gleiche Quelle dominiert eine kleinere; Install-only
und unrestricted bleiben dagegen getrennte Alternativen. Nach Verlust einer
LegalAction invalidiert der Revalidator die Route.

P3-Prüfstand:

- 27/27 fokussierte Demand-, Action-Route-, Planableitungs- und bestehende
  Funding-Route-Tests grün;
- Overtime-Closeout, bereits ausreichende Actions, Wilson-Inline-Run,
  Edgerunner-Restriktion, Pacifica-Counterreservierung, Creditreservierung,
  Future-Kontingenz, Risikokontingenz und Dominanz explizit abgedeckt;
- `check:ai` und `git diff --check` grün;
- der AI-Typecheck zeigt keine neuen Befunde neben der dokumentierten
  `main`-Baseline.

## P4-Ergebnis

P4 veröffentlicht `ActionDemand`s direkt an TacticalPlans und führt sie in
Planportfolio und PlanMemory weiter. Der Portfolio-Allocator arbeitet nach
der Credit-Allokation mit den tatsächlich verbleibenden Actions und Credits.
Er reserviert die vollständige geplante Folgekapazität, verbrauchte Karten
und sichtbare Quellcounter in der Reihenfolge Interrupt, Vordergrund und
Hintergrund. Dadurch kann ein Hintergrundprojekt weder die vom Vordergrund
gebundenen Actions noch denselben Corporate-Boon-/Pacifica-Counter oder
dieselbe einmalige LegalAction erneut verplanen.

`already_sufficient` verbraucht keine Aktionsquelle. Kontingente Routen
können einen sinnvollen Setup-Schritt liefern, lösen aber keinen harten
Blocker. Ausgeführte Routenschritte werden in Portfolio und Memory
fortgeschrieben; verschwundene LegalActions invalidieren die gespeicherte
Route und erzwingen eine Neuplanung.

Die Corp-Scorekonversion liest weder
`scoreConversionActionGainAmount` noch Kartentext. Sie bezieht Overtime,
Corporate Boon, Pacifica und weitere unmittelbare Quellen aus der
kanonischen `ActionCapacityProjection` und lässt Kombination und
Counter-/Credit-/Action-Saldo durch dieselbe begrenzte
`ActionCapacityRoute`-Suche bestimmen. Die Scorelogik selbst plant nur noch
Install-, Advancement- und Score-Folge. Advancement-Counter-Kosten werden in
den gemeinsamen Source-Counter-Vertrag normalisiert; Wilsons
selbstfinanzierter Inline-Beitrag bleibt von gewöhnlicher Folgekapazität
getrennt.

P4-Prüfstand:

- 62/62 fokussierte Projektions-, Demand-, Route-, Score-, Portfolio- und
  Memory-Tests grün;
- 126/126 kombinierte Scoreplan-, Portfolio-, Memory- und TacticalPlan-
  Regressionstests grün;
- Install plus drei Basic Advances nach Overtime, Nichtverbrauch bei bereits
  ausreichenden Actions, Corporate Boon, Pacifica-Doppelreservierung,
  Vordergrund-vor-Hintergrund und Routeninvalidierung explizit abgedeckt;
- `check:ai`, Action-Capacity-Audit mit null Zielvertragsverletzungen und
  `git diff --check` grün;
- der schmale produktive Action-Gain-Consumer ist von zwei auf den einzigen
  verbleibenden DTO-Kompatibilitätseintrag reduziert;
- der AI-Typecheck zeigt weiterhin ausschließlich die drei auf `main`
  reproduzierten Nullability-Befunde.
