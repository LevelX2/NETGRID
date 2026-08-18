# Generische KI-Remediation aus vier Detailpartien

Status: in_progress  
Quelle: Detailanalyse der Matches `match_789e1c6302b0b776`,
`match_e1d4df292e357167`, `match_103ad37601f14ca3` und
`match_deadb895971edda1`

## Zielprüfung

Der Auftrag ist für eine direkte sequenzielle Umsetzung ausreichend präzise.
Die vier vollständigen Detailtraces belegen wiederkehrende Ursachen in
bestehenden Fact-, Quote- und Planowner-Pfaden. Die Umsetzung bleibt generisch
und führt weder Karten-ID-Sonderregeln noch Resolver- oder Score-Fallbacks ein.

## Gesamtziel

Die bestätigten Fehlklassen werden an ihren fachlichen Ownern behoben:

- exakter eigener Deckrestbestand für Runner-Such- und Coverage-Pläne;
- Corp-Draw mit Hand-, Cleanup-, Agendaexpositions- und Deckout-Folgen;
- Corp-Discard als kohärente Auswahl statt unabhängiger Kartenwerte;
- Engine-zertifizierte Resource-Exchange-Grundlage für Corp-ICE-Rezzes;
- vollständige bekannte Pfadprüfung und Verbrauchswert für Run-Events;
- persistente, präemptierbare Finanzierungsziele für Corp-Scoring und
  Runner-Entwicklung;
- realistischer Payback von angreifbaren Corp-Economy-Assets.

## Verbindliches /Goal

`/Goal Arbeite Generische KI-Remediation aus vier Detailpartien vollständig
und sequenziell von P00 bis P09 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.`

Lies zuerst `AGENTS.md`, `packages/ai/AGENTS.md`, den KI-Änderungskompass,
die relevanten Planarchitekturverträge und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_FOUR_MATCH_GENERIC_REMEDIATION` auf Branch
`codex/ai-four-match-generic-remediation`. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen
fokussierte Checks aus, aktualisiere den Paketstatus und committe jedes
abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe mit strukturierter
Removal Condition. Nach P09 integriere aktuelles `main`, verifiziere den
Gesamtstand, merge lokal nach `main`, entferne den sauberen Worktree
verifiziert und lösche den vollständig gemergten Arbeitsbranch.

## Annahmen

- Der persistierte `ownDeckSnapshot.zoneBalance` ist die führende exakte
  Quelle für noch mögliche eigene Deckkarten.
- Volle Hand ist kein pauschales Draw-Verbot. Draw bleibt zulässig, wenn eine
  konkrete Cleanup-Projektion den Informations- oder Defensewert trägt.
- Ein vollständig bekannter Runpfad wird vor Verbrauch eines Run-Events
  vollständig geprüft. Echte Informationsgrenzen erlauben weiterhin Replan.
- Ressourcenreservierungen sind präemptierbar durch belastbare P1-P3-Pfade
  und dokumentierte materielle Invalidierung, nicht durch beliebige P5-Werte.
- Fehlende Engine-Quotes werden nicht durch AI-Heuristiken ersetzt.

## Nicht-Ziele

- keine Änderung der Spielregeln oder LegalAction-Legalität;
- keine Kartenname-, Definition-ID- oder Action-ID-basierte Strategie;
- keine pauschale HQ-/R&D-Gewichtsänderung;
- kein generelles Durchlaufgebot für anfangs unbekannte Runs;
- keine Debug-API-, Trace-Packaging- oder Maintenance-Persistenz-Erweiterung;
- keine neuen parallelen Plan-, Resolver- oder Fallback-Autoritäten;
- keine breite unrelated Refaktorierung.

## Controller-Invarianten

1. Genau ein Paket ist aktiv.
2. Engine und vollständige Engine-Quotes bleiben Regel- und Kostenautorität.
3. Jede Verhaltensänderung behält Planinstanz, Step, Route und Executor beim
   zuständigen Owner.
4. Choices vervollständigen nur die Payload einer bereits gebundenen Action.
5. Unknown bleibt sichtbar und wird weder zu null noch zu einer erfundenen
   bekannten Route.
6. Tests prüfen Ergebnis und Ownership sowie mindestens einen Gegenfall.
7. Kein Paket beginnt, bevor das Done-Gate des Vorgängers erfüllt und
   committed ist.

## Automatische Fehlerbehandlung

- Ein fokussierter roter Test wird im aktuellen Paket ursachenbezogen
  diagnostiziert und behoben.
- Ein unabhängiger Baselinefehler wird getrennt dokumentiert und erweitert
  den Scope nicht still.
- Typ- oder Strukturvertragsänderungen erhalten den zugehörigen Typecheck
  beziehungsweise das aktive Strukturgate.
- Ein fachlich unvollständiger Quote- oder Ownershipvertrag stoppt fail-closed
  und wird nicht durch einen Ersatzwert kaschiert.

## Sicherheitsblocker

- erforderliche Information wäre nicht side-sicher;
- Rules-/Cost-Quote kann nur durch Nachbau der Engine in der KI entstehen;
- zwei bestehende Owner beanspruchen dieselbe Entscheidung widersprüchlich;
- ein Test kann nur durch Lockerung von LegalAction-, StateVersion- oder
  Hidden-Info-Grenzen grün werden;
- fremde uncommittete Änderungen überlappen den Paketbereich unauflösbar.

## State Machine

`prepared → active_package → package_verified → package_committed →
next_package → final_verification → main_merged → cleanup_verified → complete`

Bei einem Sicherheitsblocker: `active_package → blocked_reported`.

## Paketfolge

| Paket | Titel                                              | Status    |
| ----- | -------------------------------------------------- | --------- |
| P00   | Prozessvertrag und Worktree                        | completed |
| P01   | Exakter Deckrestbestand für Suche                  | completed |
| P02   | Corp-Draw samt Cleanup und Deckout                 | completed |
| P03   | Corp-Discard als Batchentscheidung                 | completed |
| P04   | Exakte Corp-ICE-Rez-Resource-Exchange-Quote        | completed |
| P05   | Bekannte Run-Event-Pfade und Verbrauchswert        | active    |
| P06   | Persistente Corp-Scoring-Finanzierung              | pending   |
| P07   | Persistente Runner-Entwicklungsfinanzierung        | pending   |
| P08   | Risikojustierter Corp-Economy-Asset-Payback        | pending   |
| P09   | Current-State-Dokumentation und Gesamtverifikation | pending   |

## Paketdetails

### P00 – Prozessvertrag und Worktree

- Ziel: reproduzierbaren Arbeitsrahmen schaffen.
- Kernartefakt: dieses Dokument.
- Check: Branch, Worktree, `git diff --check`.
- Done-Gate: Prozessartefakt committed, Worktree sauber.
- Commit: `docs(ai): define four-match remediation process`

### P01 – Exakter Deckrestbestand für Suche

- Owner: DeckCapabilities als Fact-Producer; `runner.rig_and_coverage` als
  Suchverbraucher.
- Arbeit: Definitionmengen gegen exakte bekannte Outside-Deck-Mengen rechnen;
  keine Zonenanzahl als Kartenanzahl verwenden; Suchziel nur bei positivem
  Restbestand binden.
- Tests: zwei Kopien beide außerhalb; eine Kopie verbleibt; Hand/Heap/Rig-
  Mischzonen; unveränderte Plan-/Choice-Bindung.
- Done-Gate: unmögliche Breaker-Suche abgelehnt, echte Restkopie suchbar.
- Commit: `fix(ai): derive runner searches from exact deck remainder`

### P02 – Corp-Draw samt Cleanup und Deckout

- Owner: `corp.defend_servers` für Defensebedarf;
  `corp.hand_and_agenda_management` für Hand-/Cleanup-Facts; TurnPlanner für
  die vollständige Linie.
- Arbeit: freiwilligen Draw gegen konkrete Cleanup-Projektion,
  Agendaexposition, verbleibende Mandatory-Draw-Horizonte und unmittelbaren
  Defense-/Score-Folgewert quoten. Volle Hand bleibt bei echtem Abwurffutter
  und hinreichendem Nutzen zulässig.
- Tests: volle Hand mit Futter erlaubt; volle agenda-lastige Hand blockiert;
  Deckrest 3 ohne terminale Konversion blockiert; terminaler Defense-Draw
  bleibt zulässig.
- Done-Gate: kein pauschales Handlimit, aber kein ungetragener
  `boundedOverflowSearch`.
- Commit: `fix(ai): price cleanup and deckout risk into corp draws`

### P03 – Corp-Discard als Batchentscheidung

- Owner: `corp.hand_and_agenda_management`.
- Arbeit: Batchquote für die gesamte Discardauswahl mit Agenda-Punktesumme,
  Runner-Siegdistanz, Archives-Erreichbarkeit und Alternativabwürfen; gebundene
  Choice bleibt reine Payload-Auflösung.
- Tests: zwei Agendas würden Matchpoint in offene Archives legen;
  unkritischer Agendaabwurf bleibt möglich; unbekannte Bewertung fail-closed;
  Action-/Plan-/Executor-Bindung unverändert.
- Done-Gate: terminale Agendaexposition schlägt lokale Duplikatabwertung.
- Commit: `fix(ai): bind corp cleanup to aggregate agenda exposure`

### P04 – Exakte Corp-ICE-Rez-Resource-Exchange-Quote

- Owner: Engine/CardImplementation erzeugt vollständige side-sichere Quote;
  `corp.defend_servers` konsumiert sie.
- Arbeit: fehlende Quote für aktuell rezzbares bekanntes ICE schließen;
  Rez-Kosten, sichtbare Runner-Breakroute, verbleibende Credits und
  Accesswirkung zertifizieren. Keine AI-Ersatzheuristik.
- Tests: günstige bekannte Tax-/ETR-Route produktiv; unvorteilhafter Tausch
  ablehnbar; Score-Reserve bleibt geschützt; Quote fehlt → sichtbar unknown.
- Done-Gate: die analysierten `resource_exchange_unknown`-Klassen besitzen
  eine echte Quote oder einen spezifischen nichtproduktiven Grund.
- Commit: `fix(engine): quote visible corp ice rez resource exchange`

### P05 – Bekannte Run-Event-Pfade und Verbrauchswert

- Owner: `runner.pressure_central`/`runner.contest_remote` und gemeinsame
  side-sichere Runprojektion.
- Arbeit: Eventconstraints über alle bekannten ICE des Zielpfads anwenden;
  bei unverändert vollständig bekanntem Pfad eine Full-Path-Continuation
  binden; Verbrauchswert auf alle semantisch konsumierbaren card-backed Runs
  generalisieren.
- Tests: bekannter späterer Blocker verhindert Eventverbrauch; unbekannter
  ICE bleibt legitime Boundary; Duplikat/volle Hand/Multiaccess senken den
  Aufhebewert; Plan, Route und Run-Origin bleiben gebunden.
- Done-Gate: kein Event-Run, dessen bekannte unveränderte Route direkt zum
  Jack-out führt.
- Commit: `fix(ai): bind consumable runs to viable known paths`

### P06 – Persistente Corp-Scoring-Finanzierung

- Owner: `corp.score_agenda` als Parent, `corp.economy` als Support-Leaf.
- Arbeit: mehrzügiges Credit-Meilensteinziel, typisierte Soft-/Hard-Reserve,
  Deadline und Freigabebedingung; untergeordnete Defense-/Economy-Linien
  dürfen beschaffte Credits nicht erneut als frei behandeln.
- Tests: Lücke 3→2 bleibt Fortschritt; P5-Ausgabe wird verdrängt; P1-P3-
  Bedrohung darf präemptieren; kompromittierte Kampagne gibt Reserve frei.
- Done-Gate: Fundingfortschritt bleibt beim Score-Parent und wird nicht
  doppelt gezählt.
- Commit: `fix(ai): preserve funded corp score milestones`

### P07 – Persistente Runner-Entwicklungsfinanzierung

- Owner: `runner.develop_board_and_hand` beziehungsweise gebundene
  `runner.pressure_central`-Kampagne; `runner.economy` als Support-Leaf.
- Arbeit: begrenztes mehrzügiges Fundingziel für strategisch gebundene
  Installationen mit Zielkosten, Credit-Floor, Meilenstein und legitimen
  Preemption-/Abbruchgründen.
- Tests: Vewy-/Interface-artige generische Entwicklung konvertiert nach
  mehreren Zügen; terminaler Remotecontest und Survival präemptieren;
  schwache teure Karte erzeugt keine Sparpflicht.
- Done-Gate: Fortschritt wird geschützt, ohne „teure Karte muss gespielt
  werden“-Zwang.
- Commit: `fix(ai): retain bounded runner development funding`

### P08 – Risikojustierter Corp-Economy-Asset-Payback

- Owner: `corp.economy`, gespeist durch Defense-/Server-Erreichbarkeitsfacts.
- Arbeit: erwartbaren Credit-Pool nur über realistischen Nutzungs- und
  Schutzzeitraum ansetzen; Trash-/Contest-Risiko, Setupaktionen und verdrängte
  Parentmeilensteine einpreisen.
- Tests: ungeschütztes angreifbares Asset verliert gegen bessere Linie;
  geschütztes Asset bleibt produktiv; sofortiger bereits sichtbarer Cashout
  bleibt korrekt; keine Karten-ID-Regel.
- Done-Gate: voller gehosteter Pool gilt nicht ohne Überlebensnachweis als
  garantierter Ertrag.
- Commit: `fix(ai): risk-adjust corp economy asset payback`

### P09 – Current-State-Dokumentation und Gesamtverifikation

- Arbeit: relevante Current-State-Verträge und Monatslog aktualisieren;
  Prozessartefakt nach Überführung der dauerhaften Erkenntnisse entfernen;
  fokussierte Suiten, AI-Typecheck, Strukturgates und vollständige AI-Shards
  als Integrationscheckpoint ausführen.
- Done-Gate: alle Checks grün oder unabhängige Baselinefehler sauber belegt;
  Branch sauber und lokal nach aktuellem `main` integrierbar.
- Commit: `docs(ai): document generic planning remediations`

## Verifikationsregeln

Nach jedem Paket:

1. kleinster realistischer Regressionstest und direkter Gegenfall;
2. Ownership-/Plan-/Step-/Route-Nachweis;
3. `git diff --check`;
4. nur Paketdateien stagen und committen.

Am Integrationscheckpoint zusätzlich:

- `corepack pnpm --filter @netgrid/ai typecheck`;
- relevante Engine-/Shared-Typechecks, falls P04 Verträge ändert;
- aktive AI-Struktur-/Hint-Gates bei betroffenen Oberflächen;
- `corepack pnpm test:ai:shards` mit mindestens 600 Sekunden äußerem
  Prozesszeitfenster.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-four-match-generic-remediation`.
- Arbeits-Worktree:
  `C:\Projekte\NETGRID_AI_FOUR_MATCH_GENERIC_REMEDIATION`.
- `main` wird nur beim finalen Integrationsschritt verwendet.
- Vor dem Merge wird aktuelles `main` defensiv in den Arbeitsbranch
  integriert und danach erneut verifiziert.
- Nach erfolgreichem Merge werden Worktree und gemergter Branch gemäß Skill
  entfernt und sowohl Git-Registrierung als auch Dateisystem geprüft.
- Kein Push ohne ausdrücklichen Nutzerauftrag.

## Abschlusskriterien

- P00 bis P09 sind committed und fachlich abgeschlossen.
- Alle bestätigten Fehlklassen besitzen generische Regressionstests.
- Keine Karten-Sonderfälle, keine zweite Entscheidungsautorität und kein
  Hidden-Info-Leak wurden eingeführt.
- Current-State-Dokumentation beschreibt die neuen Verträge.
- Arbeitsbranch ist lokal in `main` enthalten.
- Worktree und Arbeitsbranch sind verifiziert entfernt.
