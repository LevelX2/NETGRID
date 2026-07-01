# Classic AI Hint Semantics Process

Status: `active`

Quelle/Vorgabe: Nutzerauftrag vom 2026-07-01 im Codex-Thread, Review `docs/reviews/ai/classic-ai-semantic-gap-review-2026-07-01.md`, Classic-Freigabe `docs/releases/classic/final-review.md`, aktive Kartendaten `data/cards/classic-cards.json`, aktive Hints `data/ai/ai-card-hints-active.json`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

- Gesamtziel: Alle 52 Classic-Karten erhalten sinnvolle, wertvolle und side-sichere Hint-Angaben für KI-Spielbarkeit.
- Endzustand: Classic-Karten sind nicht nur formal `ai_supported`, sondern haben geprüfte mechanische Hint-Felder, geeignete Taktiksignal-Ableitung, sparsame Strategieanker, aktualisierte generierte AI-Artefakte und grüne relevante Gates.
- Reihenfolge: logisch nach Kartengruppen und Risiko ableitbar.
- In Scope: AI-Hints, generierte AI-Hint-Artefakte, Inspector-/Signal-Reports, gezielte AI-Gates, Dokumentation und Paketcommits.
- Nicht in Scope: Engine-Regeländerungen, neue LegalActions, neue CardImplementations, neue Strategy IDs ohne harten Bedarf, UI-/Server-/Matchstart-Änderungen, Push oder PR.
- Sicherheitsgrenzen: LegalActions-only, Hidden-Info-Schutz, Engine als Regelautorität, keine Runtime- oder Planner-Erweiterung ohne explizites Gate.

Kleine Lücken werden konservativ geschlossen: Wenn eine Karte nur generische Economy, Draw, ETR oder Setup-Unterstützung liefert, erhält sie mechanische Fakten und `quality`, aber keinen Strategieanker. Strategieanker werden nur gesetzt, wenn die Karte eine echte Decklinie ankert oder materiell stützt.

## Gesamtziel

`/Goal Arbeite den Classic-AI-Hint-Semantikprozess vollständig und sequenziell von CLASSIC-AI-00 bis CLASSIC-AI-07 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.`

Alle Classic-Karten sollen nach Abschluss:

- `quality.hintReviewed: true`, `quality.needsHumanReview: false`, sinnvolle `confidence` und `reviewedDate: "2026-07-01"` haben;
- strukturierte mechanische Hint-Felder tragen, soweit fachlich sinnvoll: `effects`, `conditions`, `costProfile`, `breakerProfile`, `remoteRole`, `targetProfiles`;
- über Compiled Hints und Inspector-Index verwertbare Funktionssignale liefern;
- nur bei echter Decklinienrelevanz `lineSupport` erhalten;
- in den Classic-AI-Snapshots nicht mehr als komplett ankerlos erscheinen;
- keine Hidden-Info-, Runtime-, Legalitäts- oder StateHash-Grenze ausweiten.

## Annahmen

- Classic bleibt optionales Zusatzset additiv zum Originalset.
- `ai_supported` bleibt als Freigabe-Flag bestehen; die semantische Qualität wird über Hint-Felder und Gates nachgezogen.
- Die bestehende Strategy-Goal-Taxonomie in `data/ai/strategy-goals-v1.json` reicht aus; neue Strategy IDs sind zunächst nicht nötig.
- Die bestehende Tactic-Signal-Taxonomie reicht für die meisten Karten über `effects`-Ableitung; neue direkte `tacticSignals` sind nur zulässig, wenn eine Karte sonst fachlich nicht ausdrückbar ist.
- Die bestehenden Classic-Engine-Implementierungen und Szenarien sind Regelquelle für die Hint-Semantik.
- Der Prozess darf bestehende stale Reports aktualisieren, wenn sie aus den Hint-Änderungen folgen.

## Nicht-Ziele

- Keine Engine-, Server-, Web- oder Multiplayer-Verhaltensänderung.
- Keine freie Aktionskonstruktion durch die KI; jede Entscheidung bleibt auf Engine-`LegalActions`.
- Keine Hidden-Info-Projektion in AI-Input, PublicEvents, PlayerViews, Reconnect, Replay, Logs oder Clientfehler.
- Keine offizielle Artwork-, Card-Frame-, Logo-, Card-Back- oder externe Kartendatenbank-Arbeit.
- Keine Classic-only-Freigabe.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst nach bestandenen Paketchecks committed.
- Änderungen bleiben auf AI-Hints, AI-generierte Artefakte, AI-Tests und Dokumentation begrenzt.
- Strategieanker sind sparsam: generische Economy, Draw, Vanilla-ETR, reine Setup-Hilfe und reine Tag-Entfernung bleiben support-only.
- Hidden-Info-Karten erhalten explizite Target-/Condition-/Risk- oder Manual-Notes, aber keine verborgenen Zoneninhalte in Tests, Reports oder Runtime-Daten.
- Generierte JSON-Artefakte werden über vorhandene Scripts erstellt, nicht von Hand gepflegt.

## Automatische Fehlerbehandlung

- Wenn ein Hint-Feld vom Ontology-Validator abgelehnt wird, wird die Karte eng auf erlaubte V1-Felder zurückgeführt.
- Wenn ein Strategieanker zu breit wirkt, wird er entfernt und als support-only dokumentiert.
- Wenn bestehende Gates unabhängig vom Paket rot sind, wird die Ursache dokumentiert und nur dann behoben, wenn sie den Classic-Hint-Prozess blockiert.
- Wenn ein generierter Report stale ist, wird er mit dem vorgesehenen Script aktualisiert.
- Wenn eine Karte semantisch nicht eindeutig abbildbar ist, erhält sie mechanische Mindestfakten, `manualNotes` und bleibt ohne Strategieanker.

## Sicherheitsblocker

Der Prozess stoppt ohne weitere Umsetzung, wenn eine Änderung:

- verdeckte Kartendaten in öffentliche oder gegnerische Sicht bringt;
- LegalActions erzeugt oder verändert;
- `applyAction`-Revalidierung berührt;
- nichtdeterministische Runtime-Entscheidungen einführt;
- Replay, StateHash oder Randomness-Verträge verändert;
- neue produktive Planner-Gewichte oder Runtime-Flags ohne eigenes Gate einführt.

## State Machine

1. `preflight`: Worktree, Branch, Ausgangsbefund, Paketplan und Gate-Status prüfen.
2. `package_active`: genau ein CLASSIC-AI-Paket ist aktiv.
3. `package_semantics`: Hints und ggf. begleitende Tests/Reports werden geändert.
4. `package_generate`: Compiled Hints, Inspector und Reports werden aktualisiert.
5. `package_verify`: Paketchecks und `git diff --check` laufen.
6. `package_commit`: nur paketbezogene Änderungen werden committed.
7. `final_gate`: Gesamtstatus und Classic-AI-Snapshots werden geprüft.
8. `main_integrated`: Arbeitsbranch ist lokal nach `main` integriert und Worktree entfernt.

## Paketfolge

| Paket | Titel | Commit-Message |
| --- | --- | --- |
| CLASSIC-AI-00 | Prozess, Preflight und Baseline-Gates | `docs: plan classic ai hint semantics process` |
| CLASSIC-AI-01 | Runner Programme und Breaker-Hints | `feat(ai): add classic runner program hint semantics` |
| CLASSIC-AI-02 | Runner Events und Run-Tempo-Hints | `feat(ai): add classic runner event hint semantics` |
| CLASSIC-AI-03 | Runner Resources/Hardware und Survival-/Economy-Hints | `feat(ai): add classic runner persistent hint semantics` |
| CLASSIC-AI-04 | Corp Agendas/Operations und Scoring-/Punish-Hints | `feat(ai): add classic corp agenda operation hint semantics` |
| CLASSIC-AI-05 | Corp ICE und Run-Defense-Hints | `feat(ai): add classic corp ice hint semantics` |
| CLASSIC-AI-06 | Corp Assets/Upgrades und Remote-/Ambush-Hints | `feat(ai): add classic corp asset upgrade hint semantics` |
| CLASSIC-AI-07 | Generierte Artefakte, Gates, Tests und Abschlussreview | `docs: finalize classic ai hint semantics` |

## Paketdetails

### CLASSIC-AI-00: Prozess, Preflight und Baseline-Gates

Ziel: Prozessartefakt, Ausgangszahlen und Worktree-Vertrag festlegen.

Eingangsvoraussetzungen:

- Worktree `C:\Projekte\NETGRID_CLASSIC_AI_HINT_SEMANTICS` auf Branch `codex/classic-ai-hint-semantics`.
- Hauptworkspace bleibt unangetastet bis zum finalen Merge.

Konkrete Arbeit:

- Prozessartefakt schreiben.
- Ausgangszahlen aus Active/Compiled Hints, Inspector und Classic-AI-Snapshots dokumentieren.
- Relevante rote Ausgangsgates als Baseline klassifizieren.

Kernartefakte:

- `docs/architecture/ai/classic-ai-hint-semantics-process-2026-07-01.md`
- optionaler Preflight-Report unter `docs/reviews/ai/`

Checks:

- `git diff --check`

Done-Gate:

- Prozess ist vollständig dokumentiert.
- Worktree ist auf dem richtigen Branch.
- Paketcommit existiert.

### CLASSIC-AI-01: Runner Programme und Breaker-Hints

Ziel: `Early Worm`, `Matador`, `MS-todon`, `Psychic Friend`, `Rent-I-Con`, `Schematics Search Engine` und `Superglue` mit präzisen Breaker-, Access-Info- und Derez-Hints versorgen.

Konkrete Arbeit:

- `breakerProfile` für Coverage, Pump, Break-Kosten und Nebenwirkungen ergänzen.
- `effects`, `conditions`, `costProfile`, `targetProfiles` und `lineSupport` sparsam setzen.
- Noisy-/Stealth-/Run-End-Trash-/Post-Break-Derez-Risiken ausdrücken.

Checks:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `corepack pnpm check:ai-compiled-hints`
- gezielte AI-Tests für ActionCardSemanticProfiles/DeckStrategyProfile, soweit hinzugefügt
- `git diff --check`

Done-Gate:

- 7/7 Runner-Programme sind `hintReviewed`.
- Sie liefern verwertbare Breaker-/Access-/Setup-Signale.
- Strategieanker sind nur bei HQ-Pressure/Search-Breaker gesetzt.

### CLASSIC-AI-02: Runner Events und Run-Tempo-Hints

Ziel: Runner-Events semantisch abdecken: `Boostergang Connections`, `Corruption`, `Do the 'Drine`, `Finders Keepers`, `Gypsy Schedule Analyzer`, `Library Search`, `Meat Upgrade`, `Networking`, `Panzer Run`, `Running Interference`.

Konkrete Arbeit:

- Economy-/Draw-/Search-/R&D-/HQ-/Run-Tax-/Damage-/Tag-Remove-Effekte ergänzen.
- Double-Action-Kosten und Risiko-Tags korrekt halten.
- `lineSupport` nur für echte Search-/R&D-/HQ-/Run-Tempo- oder Survival-Linien.

Checks:

- Build/Inspector/Compiled-Hints.
- `git diff --check`

Done-Gate:

- 10/10 Runner-Events sind reviewt.
- Generische Economy bleibt support-only.
- Riskante Self-Damage- und Hidden-Zone-Karten haben passende Conditions/Risks.

### CLASSIC-AI-03: Runner Resources/Hardware und Survival-/Economy-Hints

Ziel: `Crash Space`, `Elena Laskova`, `Executive File Clerk`, `Little Black Box`, `Omnitech "Spinal Tap" Cybermodem`, `Omnitech Wet Drive`, `Sandbox Dig`, `Vintage Camaro`, `Zetatech Portastation` semantisch abdecken.

Konkrete Arbeit:

- Recurring-/restricted-credit-, link-, memory-, hand-size-, prevention-, trace-defense- und hidden-look-Hints ergänzen.
- Hidden-Resource-Look-Pfade mit `targetProfiles.hiddenInfoPolicy` absichern.
- Survival-/HQ-/R&D- und Economy-Anker sparsam setzen.

Checks:

- Build/Inspector/Compiled-Hints.
- `git diff --check`

Done-Gate:

- 9/9 persistente Runner-Karten sind reviewt.
- Hidden-Info-Hints bleiben controller-/public-known-only.
- Deck-/Hardware-Rollen geben KI-relevante Economy-/Survival-/Memory-Signale.

### CLASSIC-AI-04: Corp Agendas/Operations und Scoring-/Punish-Hints

Ziel: Classic-Agendas und Corp-Operations semantisch abdecken.

Konkrete Arbeit:

- Agendas: Scored Actions, Virus-Counter-Prevention, Extra-Draw, Access-Replacement und Remote-Scoring-Anker prüfen.
- Operations: Double-Draw/Shuffle, Archives-Recursion und tagged-only MU-Punish abbilden.
- `lineSupport` für Remote Scoring, Economy Reserve, Damage/Tag-Punish oder Central Stabilize nur bei echter Linie.

Checks:

- Build/Inspector/Compiled-Hints.
- `git diff --check`

Done-Gate:

- 4/4 Agendas und 3/3 Operations sind reviewt.
- Hidden-Zone-Operationen leaken keine CardInstance-/Zonenordnung.

### CLASSIC-AI-05: Corp ICE und Run-Defense-Hints

Ziel: 11 Corp-ICE mit ETR-, Damage-, Trace-, Program-Trash-, Deflector-, Rez-Discount- und ICE-Tax-Hints versorgen.

Konkrete Arbeit:

- `effects` für ETR, Damage, Trace, Program Trash, Future Encounter, Run Lock und Remote/Central Protection ergänzen.
- `costProfile` für Rez-Reserve und Agenda-Point-Rez-Kosten.
- Deflector-ICE als run-path/target-change support-only oder protection signal abbilden, ohne neue Legalität.

Checks:

- Build/Inspector/Compiled-Hints.
- `git diff --check`

Done-Gate:

- 11/11 Corp-ICE sind reviewt.
- ETR-only bleibt ohne überbreiten Strategieanker.
- Taxing/Trace/Damage/Program-Trash-ICE stützen passende Korp-Linien.

### CLASSIC-AI-06: Corp Assets/Upgrades und Remote-/Ambush-Hints

Ziel: 8 Corp Assets/Upgrades mit Access-, Run-, Remote-, Ambush-, Draw-Replacement- und Tag-Tax-Semantik versorgen.

Konkrete Arbeit:

- Access-Ambushes, Region/Tax, Run-count Tags, Strength Modifier, Draw Replacement und Tag Tax als Effects/Conditions modellieren.
- Remote-/Ambush-/Tag-Punish-/Economy-Reserve-Anker prüfen.
- TargetProfiles nur für sichtbare/legale Ziele und aktuelle Access-Fenster.

Checks:

- Build/Inspector/Compiled-Hints.
- `git diff --check`

Done-Gate:

- 8/8 Corp Assets/Upgrades sind reviewt.
- Ambush-Hints sind side-safe und current-access-only.

### CLASSIC-AI-07: Generierte Artefakte, Gates, Tests und Abschlussreview

Ziel: Gesamtprozess schließen und Classic-Hint-Qualität prüfbar machen.

Konkrete Arbeit:

- `ai-card-hints-compiled.json`, `ai-hint-inspector-index.json` und Signal-Reports aktualisieren.
- Einen gezielten AI-Test ergänzen, der Classic-Hint-Semantik gegen Regression schützt.
- Abschlussreview schreiben und Wissenspflege/Log nach Relevanzregel ergänzen.

Checks:

- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-hint-inspector-index`
- `corepack pnpm check:ai-hint-compiled-index`
- `corepack pnpm check:ai-action-semantic-signal-catalog`
- `corepack pnpm --filter @netgrid/ai typecheck`
- gezielte `@netgrid/ai`-Tests
- `git diff --check`

Done-Gate:

- 52/52 Classic-Karten sind reviewt.
- Classic-AI-Snapshots haben verwertbare Funktionssignale und mindestens relevante Strategieanker, ohne künstliche Überankerung.
- Abschlussreview dokumentiert Ergebnis, Checks und Restgrenzen.

## Verifikationsregeln

- Nach jedem Paket: generierte Hints/Inspector aktualisieren, wenn Hint-Quellen geändert wurden.
- Nach jedem Paket: `git diff --check`.
- Vor jedem Commit: nur paketbezogene Dateien stagen.
- Final: alle relevanten AI-Gates aus CLASSIC-AI-07 ausführen.
- Rot bleibende externe Ausgangsgates müssen im Abschlussreview mit Ursache und Nicht-Blocker-Begründung stehen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CLASSIC_AI_HINT_SEMANTICS`
- Arbeitsbranch: `codex/classic-ai-hint-semantics`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace wird nur für finalen lokalen Merge nach `main` genutzt.
- Jeder Paketabschluss erhält einen lokalen Commit.
- Kein Push, kein PR, keine Remote-Integration.
- Vor finalem Merge wird `main` in den Arbeitsbranch integriert, falls main weitergelaufen ist.
- Finaler Merge nach `main` bevorzugt Fast-forward, sonst Merge-Commit mit Begründung.
- Worktree wird erst nach erfolgreichem Merge entfernt.

## Controller-Prompt-Kern

`/Goal Arbeite den Classic-AI-Hint-Semantikprozess vollständig und sequenziell von CLASSIC-AI-00 bis CLASSIC-AI-07 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, KI-Wissen-NETGRID/00 Projektstart.md, KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md, KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md, KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CLASSIC_AI_HINT_SEMANTICS auf Branch codex/classic-ai-hint-semantics. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe oder aktualisiere Paketartefakte, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe ohne Rückfrage, schreibe einen Blocker-Report mit Removal Condition. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- 52/52 Classic-Karten haben sinnvolle und reviewte AI-Hints.
- Classic-Karten haben verwertbare Funktionssignale in Compiled Hints und Inspector.
- Strategieanker sind gesetzt, wo sie echten Deckliniennutzen haben, und fehlen bewusst bei support-only Karten.
- Classic-AI-Snapshots sind nicht mehr komplett ankerlos.
- Relevante AI-Gates und Tests sind grün oder mit klarer externer Nicht-Blocker-Ursache dokumentiert.
- Alle Pakete sind committed.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
