# CardImplementation Review Follow-ups Prozess 2026-06-11

## Status

`complete`

## Quelle/Vorgabe

Eingefügter Reviewtext vom 2026-06-11 zu den abgeschlossenen CardImplementation-Folgepaketen auf Stand `dc756f6a` beziehungsweise späterem `main`.

Der Review bewertet die Runtime-Arbeit als fachlich überwiegend abgeschlossen und nennt neue Nachpflegepakete:

- Prozessdokument und Format-Gate widerspruchsfrei machen.
- Optional ein changed-file-Format-Gate ergänzen.
- Ability-Key-Eindeutigkeit für CardImplementation-Primitives absichern.
- Read-only ActionSemanticCandidate-Smoke für die neuen Primitive-Payload-Felder ergänzen.
- Data Fort Reclamation als Regeltreue-Review prüfen, bevor ein größerer Sequenzumbau entsteht.
- Repo-weite Format-Baseline als separates Thema behandeln.
- Abschließend AI-, Typecheck-, Test- und Diff-Gates ausführen.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Nachpflege der Reviewpunkte ohne neue Runtime-Scope-Ausweitung.
- Sequenz: Dokumentationskonsistenz, Gate-Script, Invariant, AI-Smoke, Review, finaler Testblock.
- In-Scope: Dokumente, kleines Script, Engine-/AI-Tests, kein produktiver KI-Cutover.
- Nicht-Ziele: repo-weite Format-Baseline-Bereinigung, Data-Fort-Sequenzumbau ohne belegten Regelbruch, Remote-Push.
- Abnahme: gezielte Paketchecks plus finaler Testblock.
- Sicherheitsgrenzen: keine Hidden-Info-Leaks, keine LegalAction-Erzeugung durch AI, keine Engine-Autoritätsverschiebung.

## Gesamtziel

Die CardImplementation-Review-Folgepunkte sollen klein, prüfbar und lokal integriert umgesetzt werden. Danach ist die vorherige Prozessdokumentation konsistent, das Format-Gate für Folgepakete verwendbar, Ability-Keys sind gegen Kollisionen abgesichert, die neuen Primitive-Payload-Felder sind in der read-only Action-Semantik sichtbar, Data Fort Reclamation ist als MVP-Regelgrenze bewertet und alle relevanten Checks sind dokumentiert.

## Annahmen

- Option A aus dem Review gilt als konservative Format-Entscheidung: repo-weites `format:check` bleibt kein hartes Paket-Gate, solange die Baseline nicht separat bereinigt wurde.
- `changed-file-format-check` wird als kleines Script ergänzt, weil es die dokumentierte Gate-Entscheidung ausführbar macht.
- Data Fort Reclamation wird zunächst geprüft und dokumentiert. Ein Sequenzumbau erfolgt nur, wenn die aktuelle Karten-/Engine-Lage einen konkreten Regelbruch zeigt.
- Für ActionSemanticCandidate gilt: read-only Projektion und Tests sind erlaubt; keine PlanWeights, Scoring-Wirkung oder Action-Erzeugung.

## Nicht-Ziele

- Kein repo-weiter Prettier-Massencommit.
- Kein Remote-Push und kein Pull Request.
- Keine produktive KI-Aktivierung.
- Keine Erweiterung verdeckter Informationen in PlayerViews, PublicEvents, Replays, Logs oder AI-Inputs.
- Kein Umbau von Data Fort Reclamation auf eine vollständige ordered install/rez sequence ohne belegten Bedarf.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- AI liest nur side-safe `LegalActions`/Projektionen und erzeugt keine LegalActions.
- Hidden-Info bleibt gesperrt.
- `applyAction`, Replay, StateHash und Randomness-Verträge bleiben unberührt.
- Jedes Paket endet mit Check, Dokumentation und Commit.

## Automatische Fehlerbehandlung

- Rote Tests werden eng auf Paketänderungen zurückgeführt und vor Paketabschluss repariert.
- Bestehende Baseline-Warnungen werden dokumentiert, wenn sie nicht durch den Branch verursacht sind.
- Wenn ein Paket eine neue fachliche Runtime-Regel verlangen würde, wird ein Blocker-/Follow-up-Vermerk geschrieben statt still zu erweitern.

## Sicherheitsblocker

Sofort stoppen und dokumentieren, wenn:

- ein Hidden-Info-Feld in AI-Smoke, PublicEvent, PlayerView oder Replay sichtbar würde;
- Ability-Key-Eindeutigkeit nur durch öffentliche Leaks oder instabile IDs herstellbar wäre;
- Data Fort Reclamation ohne neue Engine-Sequenzverträge nicht regeltreu modellierbar wäre;
- `main`-Integration fachliche Konflikte mit parallelen Änderungen erzeugt.

## State Machine

- `P0_PROCESS`
- `P1_DOC_GATE_CONSISTENCY`
- `P2_CHANGED_FILE_FORMAT_GATE`
- `P3_ABILITY_KEY_INVARIANT`
- `P4_ACTION_SEMANTIC_SMOKE`
- `P5_DATA_FORT_RULE_REVIEW`
- `P6_FINAL_VERIFY_AND_INTEGRATE`
- `COMPLETE`

## Paketfolge

### P0 - Prozessartefakt

Ziel: Paketprozess, Worktree-Regeln und `/Goal` festhalten.

Arbeit:

- Dieses Prozessartefakt erstellen.
- Worktree/Branch dokumentieren.

Checks:

- `git diff --check`

Commit: `docs(engine): plan card implementation review follow-ups`

### P1 - Prozessdokument und Format-Gate bereinigen

Ziel: Das vorherige Prozessdokument ist formal abgeschlossen und widerspricht der dokumentierten Format-Baseline nicht.

Arbeit:

- `docs/architecture/ability-engine/cardimplementation-followups-process-2026-06-11.md`:
  - Status auf `complete` setzen.
  - Abschlusskriterien korrigieren.
  - P6/P7 und Abschlusskriterien auf changed-file-Format-Gate statt repo-weitem Format-Grün ausrichten.

Checks:

- `corepack pnpm exec prettier --check -- docs/architecture/ability-engine/cardimplementation-followups-process-2026-06-11.md`
- `git diff --check`

Commit: `docs(engine): close card implementation follow-up process`

### P2 - Changed-file-Format-Gate

Ziel: Folgepakete bekommen ein ausführbares Format-Gate, das nur Branch-Änderungen prüft.

Arbeit:

- `scripts/check-format-changed.mjs` ergänzen.
- Basis-Ref per Argument oder Default `main` unterstützen.
- Nur versionierte geänderte Dateien mit Prettier-unterstützten Endungen prüfen.
- Saubere Ausgabe für "keine passenden Dateien".
- Script in `package.json` als `format:changed` eintragen.

Checks:

- `corepack pnpm format:changed -- main`
- `node scripts/check-format-changed.mjs main`
- `git diff --check`

Commit: `tooling: add changed-file format check`

### P3 - Ability-Key-Invariant

Ziel: Pro `cardDefinitionId` dürfen primitive-nahe CardImplementation-Fähigkeiten keine kollidierenden `abilityKey`s verwenden.

Arbeit:

- Engine-Test für Registry-/Implementation-Scan ergänzen.
- Relevante Bereiche prüfen: `successfulRunFollowups`, `scoredAgenda` und weitere primitive-nahe Definitionen, soweit im Typmodell vorhanden.
- Defaults aus Buildern berücksichtigen, damit fehlende `abilityKey`s nicht als leere Werte kollidieren.
- Fehler nennt `cardDefinitionId`, Scope und duplicate `abilityKey`.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/card-implementation-primitives.test.ts`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Commit: `test(engine): guard card implementation ability keys`

### P4 - Read-only ActionSemanticCandidate-Smoke

Ziel: Neue Primitive-Payload-Felder werden side-safe in ActionSemanticCandidate sichtbar, ohne AI-Wirkung.

Arbeit:

- Bestehende ActionSemanticCandidate-Projektion prüfen und minimal erweitern, falls Felder noch nicht übernommen werden.
- Smoke-Test ergänzen:
  - `sourceKind = card`
  - `sourceCardId`/`sourceDefinitionId` übernommen
  - `abilityId`/`abilityKey` gesetzt
  - `primitiveKind`/`effectKind` read-only sichtbar
  - keine Hidden-Info-Felder
  - keine Action-Erzeugung, keine PlanWeight-/Scoring-Wirkung

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm check:ai`
- `git diff --check`

Commit: `test(ai): project card primitive action semantics`

### P5 - Data-Fort-Reclamation-Regelreview

Ziel: Bewerten, ob `install all, then optional rez` für den aktuellen MVP korrekt genug bleibt.

Arbeit:

- Betroffene Data-Fort-Reclamation-Karten und installierbare HQ-Zieltypen prüfen.
- Dokumentieren, ob Reihenfolgeeffekte, Root-Kapazität, Region-/Install-on-rez-Interaktionen oder künftige Karten einen Sequenzumbau verlangen.
- Bei keinem konkreten Regelbruch: MVP-Grenze dokumentieren und Tests beibehalten.
- Bei konkretem Regelbruch: Blocker/Folgepaket mit neuem Sequenzvertrag statt stiller Umbau.

Checks:

- `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- `git diff --check`

Commit: `docs(engine): review data fort reclamation sequence boundary`

### P6 - Finaler Testblock und Integration

Ziel: Keine durch Änderungen verursachten roten Tests, lokale Integration nach `main`.

Arbeit:

- Vollständigen Testblock ausführen.
- Rote Tests analysieren und beheben.
- Prozessartefakt abschließen.
- Arbeitsbranch mit `main` abgleichen.
- Lokal nach `main` mergen.
- Worktree entfernen und Goal abschließen.

Checks:

- `corepack pnpm check:ai`
- `corepack pnpm -r --if-present typecheck`
- `corepack pnpm -r --if-present --no-bail test`
- `corepack pnpm test`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Commit: `test(engine): verify card implementation review follow-ups`

## P1 Ergebnis

Umgesetzt:

- `docs/architecture/ability-engine/cardimplementation-followups-process-2026-06-11.md` steht jetzt auf `complete`.
- Gesamtziel, P6/P7-Checks, Controller-Prompt und Abschlusskriterien nennen changed-file-Formatchecks statt repo-weitem Format-Grün.
- Der repo-weite `format:check` bleibt ausdrücklich als bekannte Baseline außerhalb des Pakets dokumentiert.

Checks:

- Grün: `corepack pnpm exec prettier --check -- docs/architecture/ability-engine/cardimplementation-followups-process-2026-06-11.md`
- Grün: `git diff --check`

## P2 Ergebnis

Umgesetzt:

- `scripts/check-format-changed.mjs` ergänzt.
- `package.json` ergänzt `format:changed`.
- Das Script prüft geänderte versionierte Prettier-Dateien aus Branch-Diff, staged Diff und Arbeitsbaum-Diff gegen einen Basis-Ref.
- Windows-robust: Prettier wird über die lokale `prettier.cjs` mit `node` gestartet.
- `pnpm`-Argumenttrenner `--` wird nicht als Basis-Ref interpretiert.

Checks:

- Grün: `corepack pnpm format:changed -- main`
- Grün: `node scripts/check-format-changed.mjs main`
- Grün: `git diff --check`

## P3 Ergebnis

Umgesetzt:

- `packages/engine/src/ability-engine/card-implementation-primitives.test.ts` ergänzt.
- Der Test scannt `CARD_IMPLEMENTATIONS` und sammelt primitive-nahe Ability-Keys aus:
  - `successfulRunFollowups` für `successful_run_before_access_effect`;
  - `scoredAgenda` für `select_rezzed_ice_mark_modifier`;
  - `scoredAgenda` für `score_install_hq_cards_into_new_remote_then_rez`.
- Fehlende `abilityKey`s werden wie die Builder-Defaults normalisiert.
- Leere Ability-Keys und doppelte Ability-Keys pro `cardDefinitionId` erzeugen harte Testfehler mit Scope.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/card-implementation-primitives.test.ts`
- Grün: `corepack pnpm --filter @netgrid/engine typecheck`
- Grün: `git diff --check`

## P4 Ergebnis

Umgesetzt:

- `ActionSemanticCandidate` trägt neue read-only Felder:
  - `abilityKey`
  - `primitiveKind`
  - `effectKind`
- `applyCardActionSourceBinding(...)` übernimmt side-safe CardImplementation-Payload-Felder aus `LegalAction.payload`:
  - `cardImplementationAbilityId` als `abilityId`
  - `cardImplementationAbilityKey` als `abilityKey`
  - `cardImplementationPrimitiveKind` als `primitiveKind`
  - `cardImplementationEffectKind` als `effectKind`
  - `sourceCardId` als `sourceCardInstanceId`, wenn die LegalAction ihn explizit trägt.
- Die Erweiterung bleibt read-only: keine Action-Erzeugung, keine Planner-Gewichte, keine Scoring-Wirkung.
- Smoke-Test ergänzt, der Hidden-Info-Feldnamen, Plan-/Scoring-Gewichte und Semantik-Nebenwirkungen ausschließt.

Checks:

- Grün: `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`
- Grün: `corepack pnpm --filter @netgrid/ai typecheck`
- Grün: `corepack pnpm check:ai`
- Grün: `git diff --check`

## P5 Ergebnis

Umgesetzt:

- `docs/architecture/ability-engine/data-fort-reclamation-sequence-boundary-review-2026-06-11.md` ergänzt.
- Ergebnis: Der aktuelle MVP-Schnitt bleibt für den getesteten Hauptpfad tragfähig.
- Dokumentierte Sequenzgrenze: Regionen und andere install-on-install/rez-on-install Interaktionen benötigen einen neuen ordered-install/rez-Sequenzvertrag.
- Kein stiller Runtime-Umbau in diesem Paket, weil der Umbau neue fachliche Runtime-Schritte, Payment-Ledger-Führung und Hidden-Info-/Replay-Verträge bräuchte.

Checks:

- Grün: `corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts`
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`

## P6 Ergebnis

Umgesetzt:

- Finaler Abschlussblock ausgeführt.
- Keine durch diese Änderungen verursachten roten Tests gefunden.
- Repo-weites `format:check` bleibt bewusst kein Blocker dieses Prozesses; die aktuelle Paketgrenze nutzt das neue changed-file-Format-Gate.

Checks:

- Grün: `corepack pnpm check:ai`
  - Ergebnis: Fehler `0`; bestehende Warnbaseline bleibt Warnung.
- Grün: `corepack pnpm -r --if-present typecheck`
- Grün: `corepack pnpm -r --if-present --no-bail test`
  - Ergebnis: 264 Testdateien, 3133 Tests.
- Grün: `corepack pnpm test`
  - Ergebnis: workspace-weite Tests plus Root-Specs, 266 Testdateien, 3138 Tests.
- Grün: `corepack pnpm format:changed -- main`
- Grün: `git diff --check`
- Main-Integrationscheck: `corepack pnpm format:changed -- origin/main` deckte auf, dass `.mjs` noch nicht auf LF-Zeilenenden festgelegt war. `.gitattributes` erzwingt deshalb jetzt auch `*.mjs text eol=lf`.

## Verifikationsregeln

- Nach jedem Paket mindestens die angegebenen Checks.
- Vor jedem Commit `git diff --check`.
- Keine `test.skip`-Einführung.
- Repo-weites `format:check` nur dokumentiert ausführen, nicht als Blocker dieses Prozesses behandeln.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_CARDIMPLEMENTATION_REVIEW_FOLLOWUPS`.
- Arbeitsbranch: `codex/cardimplementation-review-followups`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Kein Push, kein PR.
- Andere Worktrees und Branches nicht verändern.

## Controller-Prompt-Kern

`/Goal Arbeite CardImplementation Review Follow-ups vollständig und sequenziell von P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARDIMPLEMENTATION_REVIEW_FOLLOWUPS auf Branch codex/cardimplementation-review-followups. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Schreibe/aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Im finalen Testblock alle Tests, Typechecks, AI-Checks und changed-file-Format-Gates laufen lassen, rote Tests analysieren und beheben. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Vorheriges CardImplementation-Prozessdokument ist `complete` und format-gate-konsistent.
- Changed-file-Format-Gate ist ausführbar.
- Ability-Key-Eindeutigkeit ist testseitig abgesichert.
- Primitive-Payload-Felder sind read-only in ActionSemanticCandidate abgedeckt.
- Data Fort Reclamation hat eine dokumentierte MVP-Sequenzgrenze oder einen expliziten Blocker.
- AI-Checks, Typechecks, Tests, `format:changed` und `git diff --check` sind grün.
- Lokaler `main` enthält alle Paketcommits.
