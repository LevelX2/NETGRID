# Action Semantics Ordered Sequence Foundation 2026-06-12

## Status

`in_progress`

## Quelle/Vorgabe

Eingefügter Prüfbefund vom 2026-06-12 zum auf GitHub sichtbaren CardImplementation-Review-Follow-up-Stand. Der Befund bestätigt die Kernänderungen, trennt lokale Verifikation von nicht vorhandenem GitHub-CI-Nachweis und schlägt als nächsten größeren Schnitt eine kombinierte Action-Semantics- und Ordered-Sequence-Foundation vor.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung hinreichend präzise, wenn folgende konservative Grenzen gelten:

- Die KI-Arbeit bleibt read-only und erzeugt keine LegalActions.
- Die Rules Engine bleibt einzige Regelautorität.
- Action-Semantik-, Target-, Kosten-, Timing-, Signal-, Doctrine- und Trace-Arbeit ist Diagnose- oder Projektionsarbeit, bis ein späterer Cutover gesondert freigegeben wird.
- Data Fort Reclamation darf regeltechnisch gehärtet werden, aber ohne Hidden-Info-Leaks, instabile Replay-Daten oder StateHash-Abweichungen.
- Repo-weites `format:check` bleibt kein harter Gate, solange die Format-Baseline nicht separat bereinigt ist.

## Gesamtziel

Der Prozess führt die CardImplementation-Primitive-Arbeit in eine belastbare Action-Semantics-Foundation über: Format-Gates sind eindeutig dokumentiert, Contract-Kommentare markieren Architekturgrenzen, Primitive-Payload-Felder bleiben vor Public-/Opponent-Surfaces geschützt, Data Fort Reclamation erhält eine regelgetreue ordered install/rez-Grundlage oder dokumentierte Removal Conditions, und AI-Diagnostik kann LegalActions systematisch nach Quelle, Ability, Target, Kosten, Timing und Basissignalen auswerten.

## Annahmen

- `main` und `origin/main` sind zum Prozessstart deckungsgleich.
- Der Arbeitsbranch nutzt `main` als interne Paketvergleichsbasis; nach lokalem Merge auf `main` wird gegen `origin/main` geprüft.
- Neue Reports dürfen als Momentaufnahme unter `docs/reviews/` erzeugt werden, wenn sie keine Runtime-Autorität beanspruchen.
- Maschinell erzeugte Diagnoseartefakte dürfen klein und deterministisch gehalten werden.
- P5 darf die P4-Sofort-Guards wieder lockern oder entfernen, wenn die ordered sequence die Grenzfälle vollständig abdeckt und Tests das belegen.

## Nicht-Ziele

- Kein produktiver KI-Cutover.
- Keine Strategiegewichte, Planner-Scoring-Wirkung oder DeckDoctrine-Runtime-Wirkung.
- Keine Legalitätsentscheidung außerhalb der Engine.
- Keine öffentliche oder gegnerische Sicht auf verdeckte HQ-/Hidden-Resource-Quellen.
- Kein repo-weiter Prettier-Massencommit.
- Kein Push oder PR ohne gesonderte Nutzerfreigabe.

## Controller-Invarianten

- `applyAction` validiert Seite, actionId, stateVersion, Timing, Kosten, Ziele und Choices weiter selbst.
- PublicEvents, PlayerViews, Reconnect, Undo, Replay, Logs und AI-Inputs dürfen keine Hidden-Info aus fremden verdeckten Zonen erhalten.
- Zufall, Replay und StateHash bleiben deterministisch.
- AI-Projektion darf vorhandene Engine-Informationen beschreiben, aber keine Aktionen erzeugen oder legal machen.
- Source-Kommentare sind Reviewhilfe, nicht zweite Wahrheit neben Typen, Tests und strukturierten Daten.

## Automatische Fehlerbehandlung

- Rote Tests werden auf den aktuellen Paketdiff zurückgeführt und vor Paketabschluss behoben.
- Bestehende Warnungen werden dokumentiert, wenn sie nicht durch den Branch verursacht sind.
- Wenn ein Paket einen neuen fachlichen Vertrag benötigt, der nicht ohne Hidden-Info-/Replay-/StateHash-Risiko umsetzbar ist, wird ein Blocker mit Removal Conditions dokumentiert.
- Ein Paket wird nicht still erweitert; Follow-ups werden separat notiert.

## Sicherheitsblocker

Sofort stoppen und dokumentieren, wenn:

- verdeckte Karten-IDs oder DefinitionIds in PublicEvents, gegnerischen Views, Reconnect-Payloads, Logs oder öffentlichen Reports auftauchen;
- Data Fort Reclamation nur mit teilmutierendem Fehlerpfad oder nondeterministischer Sequenz umsetzbar wäre;
- ActionSemanticCandidate-Felder produktive Auswahlgewichte, Legalitätsentscheidungen oder neue LegalActions beeinflussen würden;
- `main`-Integration fachlich inkompatible parallele Änderungen zeigt.

## State Machine

- `P0_SCOPE_AUDIT`
- `P1_FORMAT_GATE`
- `P2_CONTRACT_COMMENTS`
- `P3_SURFACE_INVARIANTS`
- `P4_DFR_GUARD`
- `P5_ORDERED_SEQUENCE`
- `P6_PRIMITIVE_MANIFEST`
- `P7_ACTION_SEMANTIC_COVERAGE`
- `P8_TARGET_CONTEXT`
- `P9_COST_TIMING`
- `P10_BASIC_ACTION_SEMANTICS`
- `P11_CONTRACT_COMMENT_EXTRACTION`
- `P12_SIGNAL_CATALOG_GATE`
- `P13_DECK_DOCTRINE_V2_DIAGNOSTIC`
- `P14_SEMANTIC_TRACE`
- `P15_FINAL_VERIFY_AND_MERGE`

## Paketfolge

1. P0 Scope-Audit und Prozessartefakt.
2. P1 Format-Gate sauber finalisieren.
3. P2 Source-Kommentar-Konvention für Contracts einführen.
4. P3 Public-/Opponent-Surface-Invariant für Primitive-Felder.
5. P4 Data Fort Reclamation Sofort-Guard für Regionen und rez-on-install.
6. P5 Ordered Install/Rez Sequence Engine für Data Fort Reclamation.
7. P6 Primitive Contract Manifest.
8. P7 ActionSemanticCandidate Coverage Report.
9. P8 TargetContext für konkrete legale Zieloptionen.
10. P9 Kosten- und Timing-Projektion härten.
11. P10 Basic-Action-Semantik vollständig machen.
12. P11 Semantik-Kommentar-Extraktion als Review-Hilfe.
13. P12 Semantik- und Signal-Katalog-Gate vorbereiten.
14. P13 DeckDoctrine v2 diagnostisch starten.
15. P14 Semantic Shadow Decision Trace vorbereiten.
16. P15 Finaler Volltest und lokale Main-Integration.

## Paketdetails

### P0 Scope-Audit und Prozessartefakt

Ziel: Startlage und Scope sauber abgrenzen.

Arbeit:

- `git status`, `git log origin/main..main`, `git diff --name-status origin/main..main` prüfen.
- Prozessartefakt anlegen.
- Worktree- und Branchregeln dokumentieren.

Checks:

- `git diff --check origin/main..HEAD`
- `corepack pnpm format:changed -- origin/main`

Done-Gate: Prozessartefakt liegt vor und P0-Audit ist dokumentiert.

Commit: `docs(ai): plan action semantics ordered sequence foundation`

### P1 Format-Gate sauber finalisieren

Ziel: `format:changed` eindeutig als Arbeitsbranch- und Main-Integrationsgate nutzbar machen.

Arbeit:

- Prozessdokumente auf die Konvention bringen: im Arbeitsbranch gegen `main`, nach Merge auf `main` gegen `origin/main`.
- `scripts/check-format-changed.mjs` um eine klare No-Diff-Warnung bei `baseRef == HEAD` und optionales `--list` erweitern.
- Test oder Script-Smoke für `--`-Argumenttrenner ergänzen.

Checks:

- `node scripts/check-format-changed.mjs origin/main --list`
- `corepack pnpm format:changed -- origin/main`
- `git diff --check origin/main..HEAD`

Done-Gate: Gate-Ausgabe ist eindeutig und Argumenttrenner ist abgesichert.

Commit: `tooling: clarify changed-file format gate`

### P2 Source-Kommentar-Konvention für Contracts

Ziel: Kontrollierte Contract-Kommentare an Architekturgrenzen einführen.

Arbeit:

- Kommentare an ausgewählten Grenzdateien ergänzen:
  - `packages/engine/src/ability-engine/card-implementation-primitives.ts`
  - `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`
  - `packages/ai/src/actions/action-source-binding.ts`
  - `packages/ai/src/action-semantic-candidate.ts`
  - `scripts/check-format-changed.mjs`
- Keine strategischen Empfehlungen oder Kartenflächentexte als Kommentarwahrheit einführen.

Checks:

- `corepack pnpm format:changed -- main`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`

Done-Gate: Contract-/Authority-/Visibility-Grenzen sind lokal kommentiert.

Commit: `docs(code): annotate action semantics contracts`

### P3 Public-/Opponent-Surface-Invariant

Ziel: Primitive-Felder bleiben actor-private oder public nur dort, wo Ziele bereits public sind.

Arbeit:

- Tests für Hidden-Resource-Primitive, Data-Fort-HQ-Choice und scored ICE Mark ergänzen oder härten.
- Explizit absichern, dass PublicEvents und gegnerische Views keine verdeckten Quellen/DefinitionIds tragen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/choice-view.test.ts src/index-tests/proteus/hidden-resource-hardening.test.ts src/game/corp/install-rez-sequence-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`

Done-Gate: Negative Surface-Invariants sind testseitig sichtbar.

Commit: `test(engine): guard primitive metadata surfaces`

### P4 Data Fort Reclamation Sofort-Guard

Ziel: Dokumentierte DFR-MVP-Grenze technisch absichern.

Arbeit:

- Region-Upgrades und Root-Karten mit required rez-on-install/install-on-install-Sondervertrag in der DFR-Prevalidation erkennen.
- Diese Auswahl vor P5 atomar ablehnen, ohne State-Mutation.
- Tests für atomare Ablehnung ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate: Bekannte Grenzkarten können den zweistufigen MVP-Pfad nicht mehr falsch nutzen.

Commit: `fix(engine): guard data fort region sequence boundary`

### P5 Ordered Install/Rez Sequence

Ziel: DFR-Regelgrenze durch eine generische ordered hidden-zone install/rez sequence auflösen.

Arbeit:

- Sequenzkontext mit Quelle HQ, Ziel neues Remote, expliziter Auswahlreihenfolge und temporärem 10-Credit-Pool modellieren.
- Pro Karte installieren, required rez-on-install ausführen oder Auswahl illegal machen, optionale Rez-Choice pro Karte anbieten und Creditpool fortschreiben.
- Region-Replacement, `rootInstallRezzesOnInstall`, Root-Kapazität, Hidden-Info und Replay/StateHash absichern.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts src/index-tests/mechanics/per-card-longtail.test.ts -t "Data Fort Reclamation|Region|install rez sequence"`
- `corepack pnpm --filter @netgrid/engine typecheck`

Done-Gate: DFR ist für Regionen/rez-on-install nicht mehr auf den P4-Guard angewiesen oder der verbleibende Blocker ist explizit dokumentiert.

Commit: `feat(engine): add data fort ordered install rez sequence`

### P6 Primitive Contract Manifest

Ziel: CardImplementation-Primitives als read-only Inventar für Reviews und AI-Projektion verfügbar machen.

Arbeit:

- Deterministisches Manifest `data/ai/card-implementation-primitive-contracts.json` erzeugen.
- Check auf Ability-Key-Eindeutigkeit, Visibility und Hidden-Info-Klassifikation ergänzen.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/card-implementation-primitives.test.ts`

Done-Gate: Manifest ist maschinenlesbar und eindeutig als Diagnose-/Reviewartefakt klassifiziert.

Commit: `test(engine): publish primitive contract manifest`

### P7 ActionSemanticCandidate Coverage Report

Ziel: Systematisch messen, welche LegalActions semantisch projizierbar sind.

Arbeit:

- Report `docs/reviews/ai/action-semantic-candidate-coverage-2026-06-12.json` erzeugen.
- Metriken zu Quelle, Ability, Primitive, Kosten, Timing, TargetContext, Hidden-Info-Blockern und Schema-Gaps ausgeben.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm check:ai`

Done-Gate: Coverage-Report ist deterministisch und no-effect.

Commit: `test(ai): report action semantic candidate coverage`

### P8 TargetContext

Ziel: Legale Zieloptionen read-only in ActionSemanticCandidate projizieren.

Arbeit:

- `LegalAction.targetRequirements` und `ChoiceRequest.options` side-safe in `targetContext` abbilden.
- Hidden-Info-Barrieren statt fremder verdeckter Zielinfos ausgeben.
- Keine TargetProfile-Scoring-Wirkung.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/choice-view.test.ts`

Done-Gate: TargetContext beschreibt nur bereits legale, side-safe Zieloptionen.

Commit: `feat(ai): project legal action target context`

### P9 Kosten- und Timing-Projektion

Ziel: Kosten und Timing belastbarer ausdrücken.

Arbeit:

- Kostenstatus und Timingklassifikation in ActionSemanticCandidate ergänzen.
- CardImplementation-Primitive-Smokes für temporären Pool, Score Window und Tap/Reveal-Kosten ergänzen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`

Done-Gate: Kosten/Timing sind read-only und testseitig für Basisfälle abgedeckt.

Commit: `feat(ai): project action cost and timing semantics`

### P10 Basic-Action-Semantik

Ziel: Nichtkartenaktionen erhalten kontrollierte Semantik.

Arbeit:

- Mapping für grundlegende ActionTypes ergänzen.
- Keine Strategieanker oder DeckDoctrine-Wirkung einführen.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm check:ai`

Done-Gate: Basisaktionen sind als read-only Kandidatenfelder erkennbar.

Commit: `feat(ai): classify basic action semantics`

### P11 Source-Contract-Kommentar-Extraktion

Ziel: Contract-Kommentare als Reviewhilfe nutzbar machen.

Arbeit:

- Konvention mit `@contract`, `@authority`, `@visibility`, `@mvpBoundary`, `@aiProjection` prüfen.
- Script `scripts/extract-source-contract-comments.mjs` ergänzen.
- Report `docs/reviews/architecture/source-contract-comments-2026-06-12.md` erzeugen.

Checks:

- `corepack pnpm format:changed -- main`
- `git diff --check`

Done-Gate: Zentrale Grenzkommentare sind auffindbar und ohne Strategie-/Scoring-Aussagen.

Commit: `tooling: extract source contract comments`

### P12 Semantik- und Signal-Katalog-Gate

Ziel: Signal-Katalog-Diagnose vorbereiten, ohne KI-Wirkung.

Arbeit:

- Report für aktuelle aktive Karten mit `covered`, `deferred`, `no_signal_reason` und `target_profile_gap` erzeugen.
- TacticSignals funktional halten; keine Subtyp-only-Signale.

Checks:

- `corepack pnpm check:ai`

Done-Gate: Signal-Gaps sind diagnosefähig und nicht runtimewirksam.

Commit: `test(ai): report semantic signal catalog gaps`

### P13 DeckDoctrine v2 diagnostisch

Ziel: Deckanalyse mit Strategieankern und NeutralDoctrine nur diagnostisch starten.

Arbeit:

- `buildDeckDoctrineV2Diagnostic(...)` oder bestehendes Äquivalent ergänzen.
- Statuswerte `anchorless`, `partial`, `complete`, `unknown_snapshot` und Rollenstatus abbilden.
- Report-only, keine Planner-Wirkung.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm check:ai`

Done-Gate: Doctrine-v2-Diagnostik ist isoliert und no-effect.

Commit: `feat(ai): add deck doctrine v2 diagnostics`

### P14 Semantic Shadow Decision Trace

Ziel: Erklärbares Ranking für Vergleichszwecke vorbereiten, ohne Action-Ausführung.

Arbeit:

- Trace-Input aus LegalActions, ActionSemanticCandidates, BasicAction-Semantik und optionaler Doctrine-Diagnostik modellieren.
- Feature-Flag `NETGRID_AI_SEMANTIC_TRACE=1` nur lokal auswerten.
- Output mit Ranking und Gate-Gründen erzeugen; keine Legacy-Ersetzung.

Checks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm check:ai`

Done-Gate: Trace ist diagnostisch, default-off und no-effect.

Commit: `feat(ai): prepare semantic shadow decision trace`

### P15 Finaler Volltest

Ziel: Alle Änderungen abschließend prüfen und lokal nach `main` integrieren.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm -r --if-present typecheck`
- `corepack pnpm -r --if-present --no-bail test`
- `corepack pnpm test`
- `corepack pnpm format:changed -- origin/main`
- `git diff --check origin/main..HEAD`

Done-Gate: Keine durch diesen Branch verursachten roten Tests. Arbeitsbranch ist lokal nach `main` integriert und Worktree entfernt.

Commit: `test(ai): verify action semantics ordered sequence foundation`

## Verifikationsregeln

- Nach jedem Paket mindestens die Paketchecks ausführen.
- Vor jedem Commit `git diff --check` ausführen.
- Keine `test.skip`-Einführung.
- Repo-weites `format:check` bleibt dokumentierte Baseline-Frage und kein Blocker dieses Prozesses.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_ACTION_SEMANTICS_ORDERED_SEQUENCE`.
- Arbeitsbranch: `codex/action-semantics-ordered-sequence-foundation`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push, kein PR.
- Andere Worktrees und Branches nicht verändern.

## Controller-Prompt-Kern

`/Goal Arbeite Action Semantics Ordered Sequence Foundation vollständig und sequenziell von P0 bis P15 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_ACTION_SEMANTICS_ORDERED_SEQUENCE auf Branch codex/action-semantics-ordered-sequence-foundation. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Format-Gate-Konvention ist eindeutig und ausführbar.
- Contract-Kommentare markieren zentrale Engine-/AI-Grenzen.
- Primitive-Payload-Felder sind gegen Public-/Opponent-Leaks abgesichert.
- Data Fort Reclamation ist für Region-/rez-on-install-Grenzen technisch gesichert oder vollständig sequenziert.
- Primitive-Manifest, ActionSemantic-Coverage, TargetContext, Kosten/Timing und BasicAction-Semantik sind read-only diagnostisch verfügbar.
- Kommentar-, Signal-, Doctrine- und Shadow-Trace-Diagnostik sind no-effect und default-off.
- AI-Checks, Typechecks, Tests, `format:changed` und `git diff --check` sind grün.
- Lokaler `main` enthält alle Paketcommits.
