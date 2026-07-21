# AI-Economy, Finanzierungsrouten und Creditbewertung – Umsetzungsprozess

Status: aktiv

Datum: 2026-07-21

Arbeitsbranch: `codex/ai-economy-funding-routes`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ECONOMY_FUNDING_ROUTES`

## Quelle und Vorgabe

Dieser Prozess setzt den am 2026-07-21 im Projektchat freigegebenen Plan zur
Vereinheitlichung der NETGRID-Economy-KI um. Ausgangspunkt ist die beobachtete
Fehlentscheidung, dass die Corp trotz gescorter Corporate Coup mit 15
gespeicherten Credits und legaler Auszahlung von 3 Credits die
Standardaktion für 1 Credit gewählt hat.

Die Umsetzung umfasst nicht nur diese Einzelentscheidung, sondern den
gemeinsamen Vertrag für unmittelbare Credits, gemischte Economy-Aktionen,
Finanzierungsbedarfe, mehrschrittige Finanzierungsrouten und die
Planportfolio-Integration für Runner und Corp.

## Zielprüfung

Die Vorgabe ist für die automatische sequenzielle Umsetzung ausreichend
präzise:

- Der erwartete Endzustand ist durch die freigegebenen Invarianten und
  Vergleichsfälle bestimmt.
- Die fachliche Reihenfolge ist von LegalAction-Projektion über Demand- und
  Routenplanung bis zur Scoremigration ableitbar.
- Engine, AI, Hints, Tests, Diagnostik und Wissenspflege sind im Scope.
- LegalActions und PlayerViews bleiben die einzige KI-Eingangsautorität.
- Main-Integration und Worktree-Cleanup sind durch den aktivierten
  Paketprozess verbindlich.

Noch zu kalibrierende Zahlenwerte sind keine Ziellücke. Sie werden zunächst
mit den freigegebenen Startwerten implementiert und durch fokussierte Tests
und die AI Behavior Baseline geprüft.

## Gesamtziel

NETGRID besitzt nach Abschluss einen gemeinsamen, side-safe Economy-Vertrag,
der jede legale Action anhand ihrer tatsächlichen Ressourcenänderung
klassifiziert, unterschiedlich dringende Creditbedarfe typisiert,
Finanzierungsrouten begrenzt vorausplant und vergleichbare Geldaktionen
monoton und nachvollziehbar bewertet.

Corporate Coup für 3 Credits und eine aktive BBS Whispering Campaign für 2
Credits müssen gegenüber der Standardaktion für 1 Credit gewinnen, sofern
Kosten, Timing, Risiko und sonstige unmittelbare Folgen vergleichbar sind.
Broker bleibt davon getrennt als strategische Bank mit Aufbau- und
Cashout-Vertrag erhalten.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Es besteht keine Rückwärtskompatibilitätspflicht für interne AI-Verträge,
  Diagnostikschemas oder lokale Baseline-Artefakte.
- Exakte unmittelbare Beträge und Kosten kommen aus LegalAction, Actionkosten
  und sichtbarem PlayerView-Zustand. Hints klassifizieren Strategie, Timing,
  Einschränkung und Risiko, ersetzen aber keine Engine-Fakten.
- Der Same-turn-Horizont wird exakt und deterministisch behandelt. Der
  nächste eigene Zug wird als begrenzte Makroroute betrachtet; spätere
  Economy wird höchstens grob bis zu drei eigenen Zügen bewertet.
- Die Startkurve für unmittelbare Nettocredits lautet 100, 150, 200, 240,
  275 und 305 für 1 bis 6 Credits; jeder weitere Credit beginnt mit +25.
- Die Startboni für Creditbedarfe lauten 600, 400, 220, 100 und 50 für
  akuten harten Bedarf, aktuellen Vordergrundplan, nächsten eigenen Zug,
  konkrete taktische Reserve und allgemeine Phasenreserve.
- Ein Netto-Handdelta von +1 beziehungsweise -1 erhält zunächst einen
  gedeckelten Sekundärwert von +40 beziehungsweise -40.

## Nicht-Ziele

- Keine Änderung der Spielregeln oder Kartenlegalität zugunsten der KI.
- Kein vollständiger, unbeschränkter Spielbaum.
- Keine vollständige monetäre Bewertung jedes denkbaren Karteneffekts.
- Keine Ablösung des bestehenden TacticalPlan-/Planportfolio-Controllers.
- Keine pauschale Gleichbehandlung eingeschränkter Credits, Rabatte,
  Economy-Denial und liquider Credits.
- Keine automatische Remote-Integration, kein Push und kein Pull Request.
- Keine Optimierung auf Siegquote allein.

## Controller-Invarianten

1. Die Rules Engine ist die einzige Regelautorität.
2. Die KI wählt ausschließlich aus LegalActions.
3. Alle Projektionen bleiben observer-side-safe und dürfen keine verdeckten
   Karten oder privaten Zielinformationen ableiten.
4. Bei gleichen Kosten, Risiken und Nebeneffekten gilt strikt:
   `+3 liquide Credits > +2 liquide Credits > +1 liquider Credit`.
5. Ein passender Creditbedarfsbonus gilt für jede kompatible Creditquelle,
   nicht nur für `action.type === "gain_credit"`.
6. Setup-Aktionen ohne unmittelbaren Creditgewinn erhalten keinen
   Sofortgeldbonus. Sie können als Schritt einer ausgewählten FundingRoute
   Planbeitrag erhalten.
7. Creditkosten werden genau einmal berücksichtigt.
8. Bei einer aus der Hand gespielten Action werden gespielte und gezogene
   Karte zum Netto-Handdelta verrechnet.
9. Eine riskante Route darf ausgewählt werden, löst einen harten Blocker aber
   nicht vorzeitig.
10. Dieselben Credits dürfen nicht gleichzeitig für mehrere inkompatible
    Pläne reserviert werden.
11. Corporate Coup und BBS sind feste Auszahlungspools ohne strategischen
    Haltevertrag. Broker ist eine freiwillige Bank und behält seinen
    Reife-/Cashout-Vertrag.
12. Nach jeder ausgeführten Action werden Demand, Route und LegalActions neu
    bewertet.
13. Replay, StateHash, stale-action validation und Hidden-Info-Grenzen bleiben
    unverändert bindend.

## Automatische Fehlerbehandlung

- Bei einem roten Paketcheck wird nur das aktive Paket eng diagnostiziert.
- Kein Folgepaket beginnt, solange das Done-Gate des aktuellen Pakets nicht
  erfüllt oder ein Sicherheitsblocker dokumentiert ist.
- Nicht verwandte bestehende Änderungen werden nicht verändert oder
  zurückgesetzt.
- Neue `main`-Änderungen werden vor dem finalen Merge in den Arbeitsbranch
  integriert. Konflikte werden inhaltlich gelöst; beide kompatiblen
  Intentionen bleiben erhalten.
- Eine fehlende Hintklassifizierung wird als Auditfinding behandelt. Eine
  fehlende oder unsichere Engine-Zahl wird nicht durch erratenen Regelntext
  ersetzt.
- Scheitert eine riskante Route zur Laufzeit, wird sie invalidiert und die KI
  plant aus den aktuellen LegalActions neu.

## Sicherheitsblocker

Die Arbeit stoppt mit Blocker-Report und Removal Condition, wenn:

- eine notwendige Economy-Projektion nur durch verdeckte gegnerische Daten
  berechnet werden könnte;
- Engine und Hint denselben Kartenvertrag fachlich widersprüchlich
  definieren und keine führende Regelquelle bestimmbar ist;
- ein harter Planblocker nur durch erfundene oder illegale Folgeactions als
  gelöst markiert werden könnte;
- Replay-, StateHash-, stale-action- oder Hidden-Info-Gates nach enger
  Diagnose nicht wiederhergestellt werden können;
- der finale Merge oder Worktree-Cleanup relevante fremde Änderungen
  verwerfen würde.

## State Machine

```text
prepared
  -> P0_active
  -> P0_committed
  -> P1_active
  -> P1_committed
  -> P2_active
  -> P2_committed
  -> P3_active
  -> P3_committed
  -> P4_active
  -> P4_committed
  -> P5_active
  -> P5_committed
  -> P6_active
  -> P6_committed
  -> P7_active
  -> final_verified
  -> main_merged
  -> worktree_removed
  -> branch_removed
  -> complete
```

Zu jedem Zeitpunkt ist genau ein Paket aktiv. `blocked` ist aus jedem aktiven
Paket nur bei einem dokumentierten Sicherheitsblocker erreichbar.

## Paketfolge

| Paket | Titel                    | Primäres Ergebnis                                      |
| ----- | ------------------------ | ------------------------------------------------------ |
| P0    | Prozess und Inventur     | Akzeptanzvertrag und reproduzierbares Economy-Audit    |
| P1    | Ressourcenprojektion     | kanonisches side-safe EconomyActionProjection          |
| P2    | Hints und Kartenverträge | normalisierte Economy-Hints und Familienverträge       |
| P3    | Bedarfe und Routen       | CreditDemand und begrenzte FundingRoute-Suche          |
| P4    | Planintegration          | Demands, Routen und Reservierungen im Planportfolio    |
| P5    | Gemeinsames Scoring      | monotone Economy-Scores, Nebeneffekte und Dominanz     |
| P6    | Migration und Diagnostik | alte Runner-/Corp-Pfade entfernt, Evidence vollständig |
| P7    | Abschluss                | Gesamtchecks, Baseline, Wissen, Main-Merge und Cleanup |

## Paketdetails

### P0 – Prozessartefakt, Akzeptanzvertrag und Economy-Inventur

Ziel:

- Prozess, Invarianten und reproduzierbare Bestandsaufnahme festschreiben.

Eingangsvoraussetzungen:

- sauberer Hauptworkspace;
- eigener Worktree und Branch;
- freigegebener fachlicher Plan.

Konkrete Arbeit:

- dieses Prozessartefakt anlegen;
- Audit für Economy-Hints, direkte `gain_credit`-Consumer und zentrale
  Scoringskalen reproduzierbar machen;
- Akzeptanzfälle für Corporate Coup, BBS, Broker, gemischte Actions,
  eingeschränkte Credits und Bedarfsprioritäten festlegen.

Kernartefakte:

- dieses Dokument;
- Audit-Script und fokussierte Audit-Tests.

Checks:

- Audit ausführen;
- betroffene AI-Vertragstests;
- `git diff --check`.

Done-Gate:

- jede gefundene Economy-Familie ist klassifiziert oder als prüfpflichtiges
  Finding ausgewiesen;
- Paketartefakte sind versionierbar und reproduzierbar.

Commit-Vorschlag:

`docs(ai): define economy funding route process`

### P1 – Kanonische LegalAction-Ressourcenprojektion

Ziel:

- unmittelbare und eingeschränkte Ressourcenänderungen aller relevanten
  LegalActions über einen gemeinsamen side-safe Vertrag bereitstellen.

Konkrete Arbeit:

- `EconomyActionProjection` typisieren;
- feste, dynamische, eingeschränkte, gespeicherte und automatische Credits
  unterscheiden;
- Click-, Credit- und Handdelta genau einmal berechnen;
- Engine-Payloads für deterministische Auszahlungen vervollständigen, wo der
  kanonische Betrag fehlt;
- ActionSemanticCandidate anbinden.

Checks:

- Engine- und AI-Unit-Tests für Standard +1, Corporate Coup, BBS, Broker,
  Operation/Event, Restricted Credits und No-credit-Wrapper;
- Replay-/StateHash-Vertragstests betroffener Karten;
- Typecheck der betroffenen Pakete;
- `git diff --check`.

Done-Gate:

- die drei Vergleichsquellen Standard +1, BBS +2 und Corporate Coup +3 werden
  unabhängig vom Action-Typ als unmittelbare liquide Auszahlung erkannt;
- unsichere Zahlen bleiben explizit unbekannt.

Commit-Vorschlag:

`feat(ai): project legal action economy resources`

### P2 – Economy-Hints und Kartenverträge

Ziel:

- Economy-Hints beschreiben pro Ability genau einen semantischen Modus und
  keine doppelte Auszahlung.

Konkrete Arbeit:

- Hint-Ontologie um notwendige Ability-/Economy-Klassifizierung ergänzen;
- Corporate Coup: Auszahlung 3, Pool 15;
- BBS: Auszahlung 2, Pool 16, Trashrisiko;
- Broker: Load 3 und dynamischer Cashout-all als getrennte Modi;
- gleiche Agenda-Economy-Familien normalisieren;
- eingeschränkte Credits, Rabatte und Economy-Denial trennen;
- Hint-/Engine-Audit als Gate ergänzen.

Checks:

- Hint-Ontologie- und Metadatenchecks;
- Kartenfamilien-Vertragstests;
- Audit ohne blockierende Dubletten;
- `git diff --check`.

Done-Gate:

- Corporate Coup, BBS und Broker besitzen eindeutige, nicht doppelt zählbare
  Hints;
- dynamische Beträge werden nicht als feste Zahl erfunden.

Commit-Vorschlag:

`fix(ai): normalize economy card hints`

### P3 – Typisierte CreditDemands und begrenzte FundingRoutes

Ziel:

- konkrete Finanzierungsbedarfe und ausführbare oder projizierte Routen mit
  Deadline, Gap und Risiko abbilden.

Konkrete Arbeit:

- `CreditDemand`, Priorität, Hardness und Deadline einführen;
- Runner- und Corp-Bedarfserzeuger auf gemeinsamen Vertrag abbilden;
- Same-turn-Routen deterministisch suchen;
- Next-turn-/Setup-Routen begrenzt projizieren;
- `uncovered`, `covered_contingent`, `covered_guaranteed`, `funded` und
  `invalidated` unterscheiden;
- Routen dominanzbasiert beschneiden.

Checks:

- Unit-Tests für Bedarfsprioritäten;
- Routen für Basic, Corporate Coup, BBS, Burst, Broker und Restricted Credits;
- riskante Route löst Blocker nicht vorzeitig;
- `git diff --check`.

Done-Gate:

- akuter Breakerbedarf ist höher als eine allgemeine Phasenreserve;
- eine Route enthält nur legale aktuelle Actions oder klar markierte
  zukünftige Projektionen.

Commit-Vorschlag:

`feat(ai): plan typed credit demands and funding routes`

### P4 – TacticalPlan- und Planportfolio-Integration

Ziel:

- FundingRoutes als Bestandteil des bestehenden Plancontrollers verwenden.

Konkrete Arbeit:

- TacticalPlans veröffentlichen CreditDemands;
- Planportfolio priorisiert und reserviert Credits ohne Doppelbelegung;
- ausgewählte Route und Status in PlanMemory führen;
- Setup-Schritte erhalten Routenbeitrag, aber keinen Sofortgeldbonus;
- nach Action oder Quellenverlust Route invalidieren und neu planen;
- altes `gain_credits`-Mapping auf den neuen Vertrag umstellen.

Checks:

- Planportfolio-/PlanMemory-Tests;
- Vordergrund- gegen Hintergrundbedarf;
- Route wird nach zerstörter BBS verworfen;
- Broker-Commitment bleibt stabil;
- `git diff --check`.

Done-Gate:

- es existiert kein zweiter Economy-Controller;
- dieselben Credits werden nicht für inkompatible Pläne doppelt reserviert.

Commit-Vorschlag:

`feat(ai): integrate funding routes into plan portfolio`

### P5 – Gemeinsame Economy-Scoringlogik und Dominanz

Ziel:

- Runner und Corp verwenden dieselbe kleine, monotone Creditgrundkurve und
  dieselben Bedarfsbeiträge.

Konkrete Arbeit:

- zentrale Economy-Scorekomponenten einführen;
- Startkurve und Bedarfsstufen implementieren;
- Netto-Handdelta und gedeckelte Nebeneffekte berücksichtigen;
- Creditkosten genau einmal verrechnen;
- Dominanz vergleichbarer Geldactions durchsetzen;
- Fixed-pool und Strategic-bank voneinander trennen.

Checks:

- Monotonietests für +1 bis mindestens +10;
- Corporate Coup +3 > BBS +2 > Basic +1 bei vergleichbaren Folgen;
- Operation +2/Draw 1 hat Netto-Handdelta 0;
- installierte +2/Draw-1-Fähigkeit hat Netto-Handdelta +1;
- Broker ist von Fixed-pool-Dominanz ausgenommen;
- `git diff --check`.

Done-Gate:

- Standard +1 kann keine vergleichbare +2- oder +3-Auszahlung schlagen;
- Bedarfsbonus wird pro Action nur einmal vergeben.

Commit-Vorschlag:

`feat(ai): unify economy scoring and dominance`

### P6 – Runner-/Corp-Migration, Altlogik und Diagnostik

Ziel:

- alle produktiven Economy-Entscheidungen laufen über Projektion, Demand,
  Route und gemeinsame Scorekomponenten.

Konkrete Arbeit:

- Runner `netGain * 600`, pauschale Need-Boni und doppelte Recoverypfade
  ersetzen;
- Corp-Burstformel `netGain + drawCards` und raw-gain-Creditboni ersetzen;
- `netGain * 100` im Planmapping entfernen;
- direkte `gain_credit`-Checks klassifiziert migrieren;
- echte Basic-action-Regeln auf `isBasicCreditAction` vereinheitlichen;
- Regelntext-Zahlenerkennung aus produktiven Entscheidungen entfernen oder
  auf Diagnosefallback begrenzen;
- DecisionDebug um Demand-, Route-, Ressourcen- und Dominanzevidence ergänzen.

Checks:

- fokussierte Runner-/Corp-Scoretests;
- Choice-ranking- und TacticalPlan-Regressionen;
- Diagnose-Snapshottests;
- AI-Typecheck, `check:ai` und relevante Vollsuite;
- `git diff --check`.

Done-Gate:

- kein produktiver Consumer interpretiert raw `gain_credit` noch
  versehentlich als sämtliche Economy;
- alte Doppelwertungen sind entfernt;
- Scorebreakdown erklärt die ausgewählte Finanzierung.

Commit-Vorschlag:

`refactor(ai): retire legacy credit scoring paths`

### P7 – Gesamtverifikation, Baseline, Wissen, Merge und Cleanup

Ziel:

- den Gesamtvertrag technisch und verhaltensbezogen abnehmen und vollständig
  lokal integrieren.

Konkrete Arbeit:

- alle fokussierten und erweiterten Checks ausführen;
- AI Behavior Baseline mit sechs festen Slots, zehn Seeds und 480 Actions
  gegen eine kompatible Referenz vergleichen;
- Hard Gates und Economy-Evidence prüfen;
- Architektur-, Prozess- und Monatslogwissen aktualisieren;
- aktuelles `main` in den Arbeitsbranch integrieren;
- finale Checks wiederholen;
- lokal per Fast-forward nach `main` mergen;
- Main-Status prüfen;
- sauberen Arbeits-Worktree entfernen und doppelt verifizieren;
- gemergten Arbeitsbranch mit `git branch -d` löschen.

Checks:

- keine illegalen Actions, Replayfehler, Action-Limits, Fallbacks, Timeouts,
  Runtimefehler, Hidden-Info-Findings oder Redaction-Verstöße;
- `clearly_dominated_plan_choice` bleibt 0;
- keine neue Economy-No-progress-Schleife;
- vollständiger Projektcheck in risikoadäquatem Umfang;
- `git status --short` und `git diff --check` auf Branch und `main`.

Done-Gate:

- alle Paketcommits liegen auf `main`;
- Worktree-Pfad ist weder in `git worktree list --porcelain` noch im
  Dateisystem vorhanden;
- Arbeitsbranch ist gelöscht;
- das `/Goal` kann erst dann auf complete gesetzt werden.

Commit-Vorschlag:

`docs(ai): verify economy funding route rollout`

## Verifikationsregeln

- Jeder Paketcheck läuft im Arbeits-Worktree.
- Vor jedem Paketcommit wird `git diff --check` ausgeführt.
- Nur paketzugehörige Dateien werden gestaged.
- Jeder Paketcommit erhält eine eindeutige Message aus dem Paketvertrag.
- Tests werden zunächst fokussiert, dann paketweit und im Abschluss
  projektweit ausgeführt.
- Snapshot- oder Baselineänderungen werden nicht blind akzeptiert. Jede
  relevante Verhaltensänderung wird gegen LegalActions und side-safe Evidence
  geprüft.
- Ein `n/a` in der Baseline ist kein Nullwert.
- Siegquote und Agenda-Punkte sind Kontext, kein alleiniger Erfolgsnachweis.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_AI_ECONOMY_FUNDING_ROUTES`.
- Arbeitsbranch ausschließlich `codex/ai-economy-funding-routes`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge und
  Cleanup verwenden.
- Kein `git reset --hard`, kein pauschales Revert und kein Force-Cleanup.
- Vor dem finalen Merge aktuelles `main` in den Arbeitsbranch integrieren,
  falls der Branch weitergelaufen ist.
- Fast-forward-Merge nach `main` bevorzugen.
- Push und Pull Request sind nicht autorisiert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den NETGRID-Prozess AI-Economy, Finanzierungsrouten und
Creditbewertung vollständig und sequenziell von P0 bis P7 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, den Pflicht-Einstieg der Wissensbasis,
agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_AI_ECONOMY_FUNDING_ROUTES auf
Branch codex/ai-economy-funding-routes. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket. Führe Paketchecks und
git diff --check aus, dokumentiere nicht ausgeführte Checks und committe jedes
abgeschlossene Paket einzeln. Bei einem Sicherheitsblocker stoppe mit
Blocker-Report und Removal Condition. Integriere nach P7 aktuelles main,
verifiziere final, merge lokal nach main, prüfe main, entferne den sauberen
Arbeits-Worktree, verifiziere die Entfernung in Git und Dateisystem und lösche
den vollständig gemergten Arbeitsbranch. Markiere das Goal erst danach als
complete.
```

## Abschlusskriterien

Der Prozess ist nur abgeschlossen, wenn:

- alle Pakete P0 bis P7 ihr Done-Gate erfüllen und jeweils committed sind;
- Corporate Coup +3 und BBS +2 die Standardaktion +1 in den definierten
  Vergleichsfällen dominieren;
- Bedarfspriorität, Routenrisiko, gemischte Ressourcen und Broker-Sondervertrag
  getestet sind;
- alte doppelte Economy-Scorepfade entfernt sind;
- Replay-, StateHash-, stale-action-, Illegal-action- und Hidden-Info-Gates
  bestehen;
- die kompatible AI Behavior Baseline keine harten Gates verletzt;
- Wissen und Diagnostik den neuen Vertrag wiedergeben;
- `main` den vollständigen Arbeitsstand enthält;
- Arbeits-Worktree und Arbeitsbranch verifiziert entfernt sind.
