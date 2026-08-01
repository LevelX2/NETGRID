# Corp-Findings d249/9475 – checkpoint-getriebener Umsetzungsprozess

Stand: 2026-08-01  
Status: freigegeben, Umsetzung läuft  
Branch: `codex/ai-d249-9475-remediation`  
Worktree: `C:\Projekte\NETGRID_AI_D249_9475_REMEDIATION`

## /Goal

Die fünf freigegebenen Findings aus den vollständig analysierten Matches
`match_d249f7fb9f8c1150` und `match_94753a9d0503e91d` werden zunächst als
spielgleiche historische Decision-Checkpoints gegen den aktuellen Code
geprüft. Nur weiterhin rote Verhaltensverträge werden im bereits zuständigen
Plan-Owner generisch korrigiert. Grüne Checkpoints erzeugen ausdrücklich
keine zusätzliche Regel. Alle Änderungen werden paketweise verifiziert und
committed und anschließend lokal nach `main` integriert.

Führende Evidence:
`docs/reviews/ai/two-followup-corp-ai-full-analysis-2026-08-01.md`.

## Architektur-Preflight und Ownership

Verbindlich gelesen wurden `packages/ai/AGENTS.md`,
`docs/architecture/ai/README.md`, die relevanten Abschnitte aus
`docs/architecture/ai/ai-plan-layer-target-state-wip.md` sowie
`docs/architecture/ai/ai-plan-first-runtime-cutover-process-2026-07-23.md`.

- `corp.defend_servers` besitzt ICE-Allokation, ICE-Installation,
  Schutzprojektion und jede Rez-Entscheidung.
- `corp.score_agenda` besitzt Agenda, Zielserver, Action-Capacity sowie
  Install-/Advance-/Score-Fortsetzung.
- `corp.economy` besitzt nur semantisch qualifizierte, endliche
  Entwicklungs- und Cashout-Routen oder typisierte Parent-Finanzierung.
- Der TurnPlanner vergleicht die vollständigen Restzuglinien und bleibt die
  einzige globale Auswahlinstanz.
- Choice-Resolver vervollständigen nur die Payload einer bereits gewählten,
  exakt gebundenen `LegalAction`; sie treffen keine Domainentscheidung.

Konkrete Karteninstanz-IDs und Kartennamen dürfen in Planbindung, Diagnose und
Tests verwendet werden. Sie dürfen weder Kartenfilter noch kartenspezifische
Runtime-Sonderregeln ersetzen.

## Generischer Vertrag und Nicht-Ziele

- Ein sichtbar wertvolles Remote, Central-Multiaccess, Matchpointnähe und
  aktuelle Runner-Liquidität sind generische Defense-Facts. Asp und Data Wall
  sind nur historische Beispielfälle.
- Zusätzliche ICE-Schichten werden nach marginalem Stop-, Tax-, Trace-, Tag-,
  Damage- oder anderem Run-Effekt, vollständigen Engine-Quotes, Runner-Rig,
  Liquidität, Reserve und alternativer ICE-Verwendung bewertet. Weder
  Layerzahl noch sofortige Rezbarkeit sind allein Gebot oder Verbot.
- Zusätzliche Action Capacity wird nur als Teil einer vollständig
  materialisierten Restzuglinie gewertet. Overtime Incentives ist lediglich
  der historische Beispielfall einer generischen Same-Turn-Score-Fortsetzung.
- Counterbasierte Economy qualifiziert sich über strukturierte
  Effektsemantik, endliches Entwicklungsziel, Cashoutwert, Kosten und
  Parentbedarf. Information Laundering erhält keine Titel- oder ID-Ausnahme.
- Kein neuer Scheduler, kein globaler Actionscore, kein Override, kein
  Kartenfilter und kein Credit-, Draw-, ICE- oder EndTurn-Fallback.
- Keine Änderung der Rules-Engine-Autorität, kein Eingriff in Standardports
  oder die Runtime-Datenbank durch einen Worktree-Server.

## Fehler- und Sicherheitsvertrag

- Vor jedem Verhaltensfix wird der exakte historische Zustand einschließlich
  vollständigem Warmup erfasst und mit dem produktiven Chooser ausgeführt.
- Nur `behavior_regression` ist rot. Ein grüner Fachvertrag wird dokumentiert,
  aber nicht durch zusätzliche Tests oder Logik künstlich verengt.
- Unvollständige Quote, Semantik oder Bindung bleibt `assessment_unknown` und
  wird nicht durch gedruckte Kosten oder Kartenidentität kaschiert.
- Tests sichern neben dem Ergebnis den fachlichen Owner, Step, Route,
  `actionId` und – bei Fortsetzungen – `PlanExecutionOrigin`.
- SQLite-Captures erfolgen read-only nach Health-Prüfung und Risikohinweis.

## Paketfolge

### P0 – Prozessvertrag und isolierter Arbeitsstand

- Architektur-Preflight, Branch, Worktree, Paket- und Gatevertrag festhalten.
- Gate: `git diff --check` und sauberer Status.
- Commit: `docs(ai): plan d249 and 9475 remediation`.

### P1 – Historische Checkpoints und Rot-/Grün-Entscheid

- D7 aus d249: produktives Rezzen vor sichtbar wertvollem Remote.
- D9 aus 9475: gebundene Overtime-Same-Turn-Score-Fortsetzung.
- D43/D47 aus 9475: zusätzliche wirksame R&D-Schicht unter sichtbarem
  Multiaccess-/Terminaldruck sowie konkurrierende Assetentwicklung.
- D52 aus 9475: Data-Wall-Rez im terminalen R&D-Zugriff.
- Jeden Vertrag gegen eine nahe negative Kontrolle abgrenzen.
- Commit: `test(ai): capture d249 and 9475 decision regressions`.

Aktueller Nachweis auf dem unveränderten Code vor dem ersten Fix:

- alle fünf Captures wurden mit `warmup-policy=strict` ab Entscheidung 1
  erstellt; `warmupDriftCount=0` in allen Fällen;
- **bereits grün:** 9475 D9 setzt den bestehenden
  `corp.score_agenda`-Plan mit der Installation von Executive Extraction
  fort. F2 erhält deshalb weder neue Logik noch einen zusätzlichen
  Ausnahmepfad;
- **behavior_regression:** d249 D7 wählt `decline_rez` statt Asp-Rez;
- **behavior_regression:** 9475 D43 und D47 wählen ungebundene Grundkredite
  statt R&D-Härtung oder einer qualifizierten Folgeentwicklung des bereits
  installierten Counter-Assets;
- **behavior_regression:** 9475 D52 wählt `decline_rez` statt Data-Wall-Rez;
- vier bestehende enge Gegenproben-Dateien für wirkungslose Rezfenster,
  bereits qualifizierte Rezrouten, Defense-Restzugplanung und endliche
  Corp-Economy bleiben mit `35/35` Tests grün.

### P2 – Rote Defense-Verträge

- Ausschließlich rote Rez- oder Allokationsverträge in
  `corp.defend_servers` korrigieren.
- Historische Karten bleiben Testdaten; die produktive Bewertung verwendet
  nur Schutz-, Effekt-, Quote-, Rig-, Exposure- und Ressourcenfacts.
- Commit: `fix(ai): improve quoted defense conversion`.

Umgesetzt und fokussiert verifiziert:

- ein erstes bis drittes Central-ICE kann bei einer engine-zertifizierten
  terminalen Zugriffsexposition als zusätzliche Schicht gestaged werden;
  tiefere Schichten, normale nichtterminale Situationen und fehlende
  Effekt-/Kostenquotes bleiben ausgeschlossen;
- ein exakter aktueller Breaker-Creditbedarf kann getrennt von einem
  bekannten zufälligen Post-Encounter-Nachteil quotiert werden. Die Quote
  stammt aus der deklarativen Breaker-Effektsemantik der Engine und enthält
  Wahrscheinlichkeit und betroffene sichtbare Instanz;
- ein marginaler exakter Reztausch wird nur für ein aktuell angegriffenes
  sichtbares Agenda-Remote oder terminal exponiertes HQ/R&D aufgewertet.
  Der bestehende Gegenfall mit verbleibenden Runner-Credits außerhalb dieser
  Threats bleibt abgelehnt;
- d249 D7, 9475 D43/D47 und 9475 D52 sind unverändert grün; der ausgewählte
  Owner bleibt `corp.defend_servers` mit `allocate_server_defense`;
- fokussiert grün: `68/68` Tests sowie Shared-, Engine- und AI-Typecheck.

### P3 – Rote Score-Fortsetzung

- Ausschließlich bei rotem D9-Vertrag die vorhandene
  `corp.score_agenda`-/TurnPlanner-Fortsetzung für zusätzlich erzeugte
  Action Capacity bis zum Same-Turn-Score erhalten.
- Keine Overtime-spezifische Auswahl und keine zukünftigen Action-IDs.
- Commit: `fix(ai): preserve action-capacity score continuation`.

Abgeschlossen ohne Verhaltensänderung:

- der strikte historische D9-Checkpoint wählt auf dem Ausgangsstand und nach
  P2 weiterhin Executive Extraction unter `corp.score_agenda` und
  `install_score_agenda`;
- die residente Overtime-Continuation bindet bereits Agenda-Instanz,
  `new_remote`, aktuelle Installationsaction und verbleibende
  Same-Turn-Scorelinie;
- gemäß Grün-Gate entsteht weder eine Overtime-Sonderregel noch eine weitere
  TurnPlanner- oder Schedulerlogik.

### P4 – Rote counterbasierte Economy-Lücke

- Nur wenn der historische/nachbarschaftliche Vertrag weiterhin rot bleibt,
  strukturiert qualifizierte Advance-/Cashout-Routen in `corp.economy`
  schließen.
- Negative Kontrollen: fehlender Cashoutwert, unprofitables Entwicklungsziel,
  vorrangiger Parentbedarf und Karten ohne passende Effektsemantik.
- Commit: `fix(ai): plan finite counter economy routes`.

### P5 – Gesamtverifikation, Review und Integration

- Alle neuen Checkpoints und Gegenproben, paketnahe Tests, AI-Typecheck,
  Source-/Package-Gates und `corepack pnpm test:ai:shards` ausführen.
- Evidence-Bericht und Prozessstatus mit Rot-/Grün-Entscheiden aktualisieren.
- Aktuelles `main` integrieren, Gates wiederholen, lokal nach `main` mergen.
- Worktree und Branch nach grünem Main-Gate entfernen.

## Abschlusskriterien

- jeder historische Befund besitzt einen aktuellen Rot-/Grün-Nachweis;
- nur rote Verträge wurden geändert;
- keine neue Entscheidungsautorität und keine kartenspezifische Runtime-Regel;
- Owner-, Route-, Choice-, Hidden-Info-, Determinismus- und Replayverträge
  bleiben grün;
- vollständige AI-Shards sind grün;
- Änderungen sind lokal in `main` integriert und Arbeitsartefakte bereinigt.
