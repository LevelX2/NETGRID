# Trace-Regelprofile – Umsetzungsprozess

Status: P0 abgeschlossen, P1 bereit

Quelle: Nutzerauftrag vom 2026-08-15

Arbeitsbranch: `codex/trace-rule-profiles`

Worktree: `C:\Projekte\NETGRID_TRACE_RULE_PROFILES`

## Zielprüfung

Der Auftrag ist für eine automatische sequenzielle Umsetzung ausreichend
präzise. Gesamtziel, drei freigegebene Profile, Default, Nicht-Ziele,
Sicherheitsgrenzen, Abnahmefälle, Testumfang, Worktree und Commit-Erwartung
sind bestimmt.

## Gesamtziel

NETGRID bietet beim Matchstart genau drei autoritative und für die gesamte
Partie stabile Trace-Regelprofile an. Engine, Persistenz, Replay, Simulation,
PlayerViews, UI und KI verwenden denselben typisierten Rules-Kontext. Blind
Bidding besitzt einen echten side-sicheren Commit-/Reveal-Lifecycle. Die KI
bewertet den bereits planseitig ausgelösten Trace rational und variiert nur
innerhalb legaler, wirtschaftlich plausibler Kandidaten über den
autoritativen Match-RNG.

## Iststand

- `TraceState` und `trace-orchestration.ts` bilden bereits einen gemeinsamen
  Lifecycle mit Corp-Bid, Base-Link, Runner-Bid, Post-Bid-Link und
  Trace-Erfolg-Folgefenstern.
- Der aktuelle Vertrag ist offen, Corp-sequenziell und auf das effektive
  Trace-Limit begrenzt: `traceValue = corpBid`; Gleichstand gewinnt aktuell
  die Corp. Er entspricht damit keinem der neu verlangten Profile vollständig.
- Corp- und Runner-Payments besitzen generische Quotes und explizite
  Source-Auswahl. Temporäre und wiederkehrende Trace-/Link-Quellen sowie
  Post-Bid-Link-Fähigkeiten sind bereits als generische Mechaniken vorhanden.
- Matchsettings und kompletter `GameState` werden serverseitig in SQLite
  persistiert; State-Snapshots sind Replay-Ausgangspunkt. Ein Trace-Profil
  existiert bisher weder in `MatchSettings` noch im `GameState`.
- `PlayerView` redigiert Pending Choices side-spezifisch. Öffentliche
  Trace-Payloads veröffentlichen das Corp-Gebot derzeit sofort.
- Die KI löst Bid-Choices nach Plan-/Actionwahl in
  `selected-choices-for-decision.ts` auf. Corp-Bewertung liegt in
  `corp-trace-bid-assessment.ts`; Runner reagiert deterministisch auf den
  sichtbaren Trace-Wert. Eine replaybare Bid-Varianz existiert noch nicht.
- Die Engine besitzt atomare, vorvalidierte RNG-Command-Verträge für
  planlokale Auswahl. Trace-Varianz muss dieses Muster erweitern und darf
  weder `Math.random()` noch einen lokalen KI-Hash verwenden.
- Das frühere Dokument
  `docs/architecture/ai/ai-plan-layer-target-state-wip.md` existiert nicht
  mehr. Führend sind `change-compass.md`, `target-architecture.md`,
  `planning-architecture.md` und `turn-campaign-planner.md`.
- Der bisher führende Trace-Policy-Text beschreibt nur die alte offene,
  limitierte Corp-tie-freundliche Variante und wird im Abschluss auf den neuen
  Profilvertrag synchronisiert.

## Annahmen

- `modern_open` ist der Default und bedeutet entsprechend dem Auftrag:
  kostenlose Basisstärke N, offenes Corp-Payment ohne künstliches N-Limit,
  Runner-Reaktion und Runner-Sieg bei Gleichstand.
- Fehlende Felder in Version-0-Test-/Fixture-Zuständen werden nur an der
  autoritativen Erzeugungs-/Normalisierungsgrenze als `modern_open`
  normalisiert. Im laufenden Trace wird nicht aus UI-State oder Eventtext
  geraten.
- Eine kleine kurzfristige Behavioral-Persistenz wird nur umgesetzt, wenn sie
  ohne neue Personality-Engine in bestehendem Match-/AI-Runtime-State sauber
  gebunden werden kann. Replaybare per-Trace-Varianz ist das Mindestziel.

## Nicht-Ziele

- Kein viertes Profil mit Basis N plus Blind-Bid bis N.
- Kein pauschales `+1` für Corp-Traces.
- Keine globale Action-Chooser-, Personality- oder Poker-Solver-Schicht.
- Keine Karten-ID-Strategieheuristik und keine parallele Trace-State-Machine.
- Keine Rückwärtskompatibilitätsarchitektur oder Datenmigration für lokale
  Version-0-Daten.

## Controller-Invarianten

- Engine und aktuelle `LegalActions` bleiben einzige Regelautorität.
- Trace-Bidding bleibt Resolution des bereits gewählten Plans und behält
  `PlanExecutionOrigin`, Executor, Step, Route und `actionId`.
- Ein Choice-Resolver wählt nur eine aktuelle, gebundene Option.
- Blind-Bid-Wert und gewählte Payment-Quellen bleiben bis zum gemeinsamen
  Reveal aus gegnerischen PlayerViews, PublicEvents und normalen Payloads
  entfernt.
- Zufall wird erst nach rationaler Kandidatenbildung durch einen atomaren,
  stateVersion-gebundenen Engine-RNG-Übergang verbraucht und aufgezeichnet.
- Trace-Limit und Trace-Stärke bleiben getrennte Größen.

## Automatische Fehlerbehandlung

Unvollständige Quotes, veraltete Choice-Bindungen, illegale Payment-Allokation,
fehlender Rules-Kontext oder RNG-Revalidierungsfehler scheitern fail-closed.
Es gibt keinen First-Legal-, Nullwert-, Legacy- oder Catch-and-continue-
Fallback. Fokussierte Tests werden vor dem nächsten Paket repariert.

## Sicherheitsblocker

Ein Paket stoppt nur bei einem nicht konservativ auflösbaren Widerspruch der
autoritativen Engine-/Hidden-Info-/Plan-Ownership-Verträge oder bei fremden
Änderungen, die denselben Integrationsvertrag inkompatibel verändern. Die
Removal Condition wird dann konkret dokumentiert.

## State Machine

```text
P0 Iststand/Vertrag
→ P1 Rules-Kontext und Engine-Lifecycle
→ P2 Setup/UI/Payment/Visibility
→ P3 KI/RNG/Diagnostik
→ P4 Tests/Simulation
→ P5 Dokumentation/Review
→ P6 Main-Abgleich/Merge/Cleanup
```

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Nach jedem Paket
folgen fokussierte Checks, `git diff --check`, paketbezogenes Staging und ein
eigener Commit.

## Paketfolge und Done-Gates

### P0 – Iststand und Prozessvertrag

- Projekt-, Paket- und KI-Architekturvorgaben lesen.
- Trace, Setup, Persistenz, Replay, UI, KI, Payment, CardSpecs und Tests
  inventarisieren.
- Dieses Artefakt und die Abnahmematrix committen.

Done: Owner, Engstellen, bestehende Wiederverwendung und offene Vertragslücken
sind benannt; Worktree ist sauber und isoliert.

Commit: `docs(trace): define rule profile implementation process`

### P1 – Autoritativer Rules-Kontext und Trace-Lifecycle

- Typisiertes Profil mit `modern_open`, `classic_blind` und
  `classic_blind_corp_ties` im engsten Rules-Kontext ergänzen.
- Default und Match-/GameState-Persistenz anbinden.
- Gemeinsamen Lifecycle profilgesteuert auf Modern-Open oder Hidden-Commit /
  gemeinsames Reveal führen.
- Strength-, Limit- und Tie-Vertrag in einem Resolver halten.

Done: Engine-Regeltests für alle drei Profile, Limits, Tie-Regeln und Reveal
sind grün; StateHash/Replay bleibt deterministisch.

Commit: `feat(engine): add authoritative trace rule profiles`

### P2 – Setup, Sichtbarkeit und generische Ressourcen

- Matchsettings, Lobby-/API-Verträge, Accountpräferenzen und Start-UI anbinden.
- PlayerView/PublicEvents/Chronik für Blind Commit und Reveal side-sicher
  projizieren.
- Corp-/Runner-Paymentquellen, temporäre Pools, Trace-Limit-Modifikatoren und
  Post-Reveal-Fenster profilübergreifend absichern.

Done: Server-/Web-/Engine-Fokustests belegen Default, Persistenz, Source-Wahl,
Hidden Info, Reveal und Post-Reveal.

Commit: `feat(trace): wire profiles through setup and hidden views`

### P3 – Plan-first KI, Behavioral Variance und Diagnostik

- Side-sichere rationale Corp-/Runner-Bewertung mit Stakes, Konsequenz,
  Reserve, Link, sichtbaren Pools und Tie-Regel implementieren.
- Legale Kandidaten deterministisch gewichten; Varianz nach Stakes begrenzen.
- Aktuellen `resolve_choice`-Step über einen atomaren Engine-RNG-Command
  auswählen und den Draw im Replay/Decision Trace belegen.
- Private Diagnostik um Profil, Rational Range, Stakes, Bias, Gewichte,
  Auswahl, Payment und Ergebnis ergänzen, soweit der bestehende Vertrag trägt.

Done: Ownership-, Hidden-Info-, Seed-Reproduktions-, Legalitäts- und
Stakes-Tests sind grün; `actionId`/Executor/Step bleiben unverändert.

Commit: `feat(ai): assess and vary trace bids replayably`

### P4 – Regression und Variantenvergleich

- Gezielte Regel-, Payment-, Hidden-, Replay- und KI-Tests vervollständigen.
- Reproduzierbaren Szenariovergleich der drei Profile mit Erfolgsquote,
  Durchschnittsgeboten, 0-/Max-Bids, Varianz und terminalen Fällen ergänzen.

Done: fokussierte Suiten und relevante Typechecks sind grün; Vergleich zeigt
keine offensichtlich destruktive Varianz.

Commit: `test(trace): cover profiles ai and scenario balance`

### P5 – Führende Dokumentation und Code-Review

- Aktuelle Trace-Policy, AI-Verträge, Status/Wissen und Projektlog nur dort
  synchronisieren, wo der Vertrag tatsächlich betroffen ist.
- Konkreten Diff-Review auf Hidden Leaks, doppelte Autorität, Limit-/Strength-
  Drift, RNG-Verbrauch, Persistenz und ungetestete Cardspec-Familien ausführen.
- Dieses Prozessartefakt nach Übertragung dauerhafter Erkenntnisse entfernen.

Done: Dokumentation widerspricht dem Code nicht; Reviewfindings sind behoben
oder als echte Risiken benannt; Abschlusschecks sind grün.

Commit: `docs(trace): document selectable rule profiles`

### P6 – Integration und Cleanup

- Aktuelles `main` defensiv in den Arbeitsbranch integrieren.
- Finale relevante Checks wiederholen.
- Arbeitsbranch lokal bevorzugt per Fast-forward nach `main` integrieren.
- Exakten Worktree sauber entfernen und in Git sowie Dateisystem verifizieren;
  gemergten Branch mit `git branch -d` löschen.

Done: `main` enthält alle Commits, fremde Hauptcheckout-Änderungen sind
erhalten, Worktree und Arbeitsbranch existieren nicht mehr.

## Verifikationsregeln

- Iterativ nur engste Fokustests; Engine-/Shared-/Server-/Web-/AI-Typechecks
  bei berührten Typoberflächen.
- Vollständige AI-Shards und breite Workspace-Gates nur am bewussten finalen
  Integrationscheckpoint mit mindestens 600 Sekunden äußerem Zeitfenster.
- Für fokussierte AI-Tests mindestens 180 Sekunden äußeres Zeitfenster.
- Jeder Testfehler wird ursachenorientiert getrennt vom Baselinezustand
  analysiert.

## /Goal

`/Goal Arbeite Trace-Regelprofile vollständig und sequenziell von P0 bis P6
ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst
AGENTS.md, AGENTS.local.md, die verpflichtenden KI-Dokumente und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_TRACE_RULE_PROFILES auf Branch
codex/trace-rule-profiles; nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket, führe Paketchecks und git diff --check
aus und committe jedes abgeschlossene Paket. Stoppe nur bei einem echten
Sicherheitsblocker mit Removal Condition. Integriere abschließend aktuelles
main, verifiziere, merge lokal nach main, prüfe main, entferne Worktree und
Branch verifiziert und markiere das Goal erst danach als complete.`

## Abschlusskriterien

Alle drei Profile sind auswählbar und autoritativ gespeichert, Blind Bidding
ist wirklich verborgen, Payment-/Limit-/Post-Reveal-Verträge bleiben
generisch, KI-Varianz ist rational/legal/replaybar, Tests und Typechecks sind
grün, ein Szenariovergleich ist dokumentiert, der Diff ist reviewed und die
lokale Main-Integration samt Cleanup ist nachgewiesen.
