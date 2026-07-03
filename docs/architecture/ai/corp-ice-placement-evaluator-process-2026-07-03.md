# Corp-ICE-Placement-Evaluator Prozess

Status: in Umsetzung

Datum: 2026-07-03

Arbeitsbranch: `codex/corp-ice-placement-evaluator`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ICE_PLACEMENT_EVALUATOR`

## Quelle und Vorgabe

Quelle ist die Nutzeranlage vom 2026-07-03 zur Kapselung eines Corp-ICE-Placement-Evaluators. Die Vorgabe verlangt keinen weiteren Einbau in den alten Corp-Planner, sondern ein eigenes Semantic-Runtime-Modul, das vorhandene legale ICE-Install-/Rez-/spaetere Reorder-Actions bewertet, ohne Legalitaet zu erzeugen.

Die wichtigste fachliche Frage lautet:

Welche legale ICE-Install-/Rez-/Reorder-Action verbessert die Verteidigung dieses Servers in dieser Position jetzt am meisten, und wann ist Nicht-Installieren besser?

## Zielpruefung

Die Vorgabe ist ausreichend praezise fuer automatische Umsetzung:

- Gesamtziel: gekapselter Corp-ICE-Placement-Evaluator in der normalen Semantic Runtime.
- Endzustand: Install-ICE-Scoring nutzt eine gemeinsame Profil-/Score-Komponente statt verstreuter Central-/Remote-Einzelheuristik.
- Reihenfolge: Profilierung, Score-Komponente, Runtime-Integration, Positions-/Deckdichte-/Defer-Regeln, Legacy-/Doppelheuristik-Audit.
- Artefakte: `packages/ai/src/runtime/`, fokussierte AI-Tests, Abschlussreview unter `docs/reviews/ai/`.
- Gates: AI-Typecheck, fokussierte Vitest-Dateien, `git diff --check`; breitere Checks nur bei relevantem Scope oder Regression.
- Sicherheitsgrenzen: LegalActions-only, PlayerView-only, keine Hidden-Info-Erweiterung, keine Engine-/Replay-/StateHash-Aenderung.

## Gesamtziel

Die Corp-KI bewertet ICE-Platzierungen ueber ein explizites, testbares Portfolio aus Serverbedarf, ICE-Profil, Position, Rez-Finanzierbarkeit, Deck-ICE-Dichte und Opportunity-Cost. Positionabhaengige ICE sollen nicht mehr als erstes/alleiniges ICE bevorzugt werden, wenn sie dort keinen wirksamen Stop oder nur spaeteren Combo-Wert liefern. Economy, Draw, Advance oder Score duerfen ICE-Installationen ueberstimmen, wenn alle ICE-Kandidaten aktuell schlecht sind.

## Annahmen

- `chooseCorpAction` nutzt die Semantic Runtime als normalen Livepfad.
- Der globale Force-Legacy-Pfad per `NETGRID_SEMANTIC_AI_RUNTIME=legacy` bleibt bis zu einem separaten, projektweiten Legacy-Cutover als Notaus bestehen.
- Entfernt oder abgeloest werden in diesem Prozess nur ersetzbare normale Runtime-Doppelheuristiken und Legacy-nahe ICE-Placement-Metriken, die nach der Integration keinen aktuellen Consumer mehr haben.
- Reorder-/Move-/Swap-Spezialfaelle werden in diesem Schnitt nur strukturell vorbereitet, nicht als vollstaendige Spielstaerke-Funktion freigeschaltet.

## Nicht-Ziele

- Keine Engine-Regel- oder LegalAction-Aenderung.
- Keine neue `PlayerAction`-Erzeugung.
- Keine Nutzung verdeckter Runnerdaten.
- Keine Aenderung an Replay, StateHash, Randomness, PublicEvents, PlayerViews oder WebSocket-Payloads.
- Kein pauschales Entfernen des gesamten Legacy-Notaus, solange er projektweit absichtlich als expliziter Fallback dokumentiert ist.
- Keine breite KI-Tuningrunde ausserhalb von ICE-Platzierung.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautoritaet.
- Die KI waehlt ausschliesslich vorhandene `LegalActions`.
- Der Evaluator bewertet nur side-sichere Daten aus Corp-PlayerView, LegalActions, redigierten PublicEvents, sichtbaren Karten- und Hintdaten.
- Jede Score-Komponente liefert Evidence ohne rohe Hidden-Info, ohne vollstaendige Action-ID-Listen und ohne verdeckte Gegnerkarten.
- Normale Runtime-Pfade duerfen nicht auf `packages/ai/src/legacy/corp-plans.ts` fuer neue Placement-Entscheidungen zurueckfallen.

## Automatische Fehlerbehandlung

- Rote Tests werden eng im aktiven Paket debuggt.
- Wenn ein vorhandener Test eine berechtigte alte Erwartung schuetzt, wird die Erwartung nur nach Code- und Fachkontext angepasst.
- Wenn eine Legacy-Entfernung einen aktiven expliziten Notaus oder Benchmark bricht, wird sie nicht still erzwungen, sondern als blockiert mit Removal Condition dokumentiert.
- Wenn eine Hidden-Info-Frage unklar ist, wird der betroffene Score-Bestandteil konservativ weggelassen.

## Sicherheitsblocker

Der Prozess stoppt ohne Zwischenfrage bei:

- Verwendung von FullState oder verdeckten Runnerzonen in Runtime-Scoring.
- Erzeugung neuer LegalActions ausserhalb der Engine.
- Evidence, Debugdaten oder Tests, die verdeckte Gegnerkarten, rohe private Payloads oder nicht freigegebene Action-Listen offenlegen.
- fachlichem Konflikt zwischen neuer Score-Komponente und aktivem Engine-/LegalActions-Vertrag.

## State Machine

1. `preflight`: Worktree und relevante Runtime-/Legacy-Stellen pruefen.
2. `process_artifact`: dieses Artefakt erstellen und committen.
3. `profile_component`: ICE-Profile, Serverbedarf und Score-Komponenten isoliert einfuehren.
4. `runtime_integration`: Central-/Remote-Install-ICE-Scoring auf die Komponente umstellen.
5. `behavior_rules`: Positions-, Deckdichte- und Defer-Regeln mit Regressionen absichern.
6. `legacy_removal_audit`: ersetzte Heuristiken entfernen oder Removal-Blocker dokumentieren.
7. `final_review`: Abschlussbericht, finale Checks, lokaler Merge nach `main`, Worktree entfernen.

## Paketfolge

### ICE-P0 Prozessartefakt

Ziel: Paketprozess und `/Goal` verbindlich dokumentieren.

Arbeit:

- Prozessdatei unter `docs/architecture/ai/` anlegen.
- Annahmen, Nicht-Ziele, Safety-Gates, Paketfolge und Legacy-Regel festhalten.

Checks:

- `git diff --check`

Done-Gate:

- Artefakt ist versioniert und beschreibt die komplette Umsetzung.

Commit:

- `docs(ai): add corp ice placement evaluator process`

### ICE-P1 Profile und Score-Komponente

Ziel: Wiederverwendbare Runtime-Komponente fuer ICE-Placement-Profilierung einfuehren.

Arbeit:

- Neues Modul unter `packages/ai/src/runtime/corp-ice-placement/`.
- Typen fuer `CorpIcePlacementCandidate`, `CorpIcePlacementEvaluation`, `CorpServerNeedProfile`, `CorpIceCardPlacementProfile` und Score-Komponenten.
- Profil aus sichtbarer Karte, Runtime-Hints, Subroutinen, Server-ICE und LegalAction-Payload ableiten.
- Evidence fuer Stop, Tax/Damage, Positionabhaengigkeit, Future-Run-Synergy, Rez-Kosten und resultierende Position liefern.
- Fokussierte Unit-Tests fuer Profilklassifizierung und Basisscore.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-ice-placement/*.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Neue Komponente ist ohne Runtime-Verhalten nutzbar und testbar.

Commit:

- `feat(ai): add corp ice placement profile component`

### ICE-P2 Runtime-Integration

Ziel: Bestehendes Install-ICE-Scoring auf den Evaluator umstellen.

Arbeit:

- `semantic-runtime-corp-score.ts` und `semantic-runtime-corp-remote-score.ts` nutzen die neue Komponente.
- `corpCentralIceInstallQualityComponent` und `semanticRuntimeCorpCentralIceInstallScore` werden in die gemeinsame Komponente ueberfuehrt oder auf duenne Adapter reduziert.
- Remote-Dynamic-Protection-Logik speist dieselbe Score-Komponenten-Evidence.

Checks:

- Fokussierte bestehende Tests fuer `semantic-runtime-corp-score` und `semantic-runtime-corp-remote-score`.
- Neue/angepasste Tests fuer Central/Remote-Paritaet.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Normale Semantic Runtime nutzt den neuen Evaluator fuer ICE-Installationen.
- Scores bleiben fuer nicht positionsabhaengige Baseline-Faelle stabil oder fachlich begruendet angepasst.

Commit:

- `feat(ai): route corp ice install scoring through placement evaluator`

### ICE-P3 Positions-, Deckdichte- und Defer-Regeln

Ziel: Die in der Anlage genannten Spielstaerke-Regeln wirksam machen.

Arbeit:

- Regeln fuer erste ICE, Folge-ICE, `nextIceModifier`, `futureIceModifier`, `outsideIceScaling`, `innerIceScaling`, `mobileReposition`, `immediateStop`, Rez-Finanzierbarkeit und Servernotfall.
- `CorpIceDensityProfile` aus eigener side-sicherer Korp-Sicht ableiten: gesamtes eigenes Deck soweit sichtbar/bekannt, HQ-ICE, bereits gesehene eigene ICE und Rest-ICE-Schaetzung.
- `bestDeferReason` und Opportunity-Cost-Komponente erzeugen, ohne neue Nicht-Installieren-Aktion zu erfinden.
- Regressionen fuer die acht Testfamilien aus der Anlage, soweit mit vorhandenen Testhelfern und Karten-/Hintdaten darstellbar.

Checks:

- Neue corp-ice-placement Tests.
- Fokussierte Semantic-Corp-Score-Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Positionabhaengige ICE verlieren als erstes/alleiniges ICE deutlich an Wert, ausser Notfall oder niedrige ICE-Dichte.
- Bezahlbares Stop-ICE wird bei hoher Servernot klar bevorzugt.
- Economy/Draw kann unrezzable oder schlecht platzierte ICE ueberstimmen.

Commit:

- `feat(ai): score corp ice placement position and density`

### ICE-P4 Legacy- und Doppelheuristik-Audit

Ziel: Korrespondierenden ersetzbaren Legacy-/Doppelcode entfernen oder explizit blockieren.

Arbeit:

- Suchen nach aktiven Consumern von Future-Run-ICE-Placement-Metriken und alten Central-/Remote-ICE-Heuristiken.
- Entfernen von normalen Runtime-Doppelheuristiken, die nach ICE-P2/P3 vollstaendig ersetzt sind.
- Legacy-Planer-Code nur entfernen, wenn keine expliziten Legacy-/Fixture-/Benchmark-Consumer mehr existieren.
- Wenn globaler Legacy-Notaus oder Benchmark-Consumer weiter existieren, Abschlussreview mit konkreter Removal Condition statt Scheinloeschung.

Checks:

- `rg`-Audit fuer ersetzte Funktionsnamen und Legacy-Consumer.
- Betroffene AI-Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Kein normaler Semantic-Runtime-Pfad benutzt die ersetzten alten ICE-Placement-Heuristiken.
- Jeder verbleibende Legacy-Teil ist entweder expliziter Notaus/Benchmark/Fixture oder hat eine dokumentierte Removal Condition.

Commit:

- `refactor(ai): remove replaced corp ice placement heuristics`

### ICE-P5 Final Review und Integration

Ziel: Abschluss, Wissensrueckfuehrung und lokaler Merge nach `main`.

Arbeit:

- Abschlussreview unter `docs/reviews/ai/`.
- Relevantes Statuswissen in `KI-Wissen-NETGRID` und/oder `docs/codex/CODEX_STATUS.md` nur dann verdichten, wenn der Stand wiederverwendbar ist.
- Finale Checks.
- Arbeitsbranch in `main` integrieren und Worktree entfernen.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte AI-Vitest-Suite
- `git diff --check`
- `git status --short --branch` auf Arbeitsbranch und `main`

Done-Gate:

- Alle Paketcommits liegen auf dem Branch.
- Branch ist lokal nach `main` integriert.
- Worktree ist entfernt.
- Keine relevanten offenen Aenderungen bleiben im Hauptworkspace.

Commit:

- `docs(ai): review corp ice placement evaluator`

## Verifikationsregeln

- Paketchecks sind Pflicht vor jedem Paketcommit.
- `git diff --check` ist Pflicht vor jedem Commit.
- Typecheck ist Pflicht fuer jedes Codepaket.
- Breiter `@netgrid/ai test` wird ausgefuehrt, wenn fokussierte Tests oder Integration auf Score-/Decision-Ranking breiter streuen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung nur im Worktree `C:\Projekte\NETGRID_AI_ICE_PLACEMENT_EVALUATOR`.
- Hauptworkspace `C:\Projekte\NETGRID` nur fuer finalen lokalen Merge nach `main`.
- Ein Commit pro abgeschlossenem Paket.
- Kein Push und kein Pull Request ohne ausdruecklichen Nutzerwunsch.
- Keine fremden Worktrees oder Branches veraendern.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Corp-ICE-Placement-Evaluator-Prozess vollstaendig und sequenziell von ICE-P0 bis ICE-P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md und docs/architecture/ai/corp-ice-placement-evaluator-process-2026-07-03.md.
Arbeite ausschliesslich im Worktree C:\Projekte\NETGRID_AI_ICE_PLACEMENT_EVALUATOR auf Branch codex/corp-ice-placement-evaluator.
Nutze den Hauptworkspace nur fuer den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Fuehre Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rueckfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main pruefen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Neuer Evaluator ist produktiv im normalen Semantic-Corp-Install-ICE-Scoring angebunden.
- Die acht fachlichen Testfamilien aus der Anlage sind abgedeckt oder begruendet als Follow-up/Spezialfall dokumentiert.
- Korrespondierende alte Doppelheuristik ist entfernt oder aus normaler Runtime herausgenommen.
- Verbleibender Legacy-Code ist auf expliziten Notaus, Fixture oder Benchmark begrenzt und mit Removal Condition dokumentiert.
- AI-Typecheck, fokussierte Tests und `git diff --check` sind gruen.
- Arbeitsbranch ist lokal nach `main` integriert.
