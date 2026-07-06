# Runner Plan Binding Economy Final Report 2026-07-06

Status: Paketabschluss vor lokalem Main-Merge

## Ergebnis

Der Arbeitsbranch `codex/ai-runner-plan-binding-economy` haertet die Runner-Planebene fuer zwei im Playtest sichtbare Fehlerklassen:

- Economy wird jetzt als konkrete Route aus Deckstrategie, LegalActions und Handentwicklung abgeleitet. Die Runtime kann dadurch eine passende Action-Economy- oder Bankkarte installieren, bevor sie dauerhaft auf `gain_credit` zurueckfaellt.
- Ein akuter Score-Remote-Contest bleibt gegen billige Off-Plan-Runs gebunden, solange der Remote-Plan noch konkret score-relevant und bezahlbar vorbereitbar ist.

Die Aenderung bleibt auf `packages/ai`-Runner-Semantik, TacticalPlan-Mapping, Debug-Evidence und fokussierte Regressionen begrenzt. Es gibt keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-, Kartenpool- oder Hidden-Info-Vertragsaenderung.

## Umgesetzte Anpassungen

### Deckstrategieabhaengige Economy-Route

`buildRunnerEconomyPosture` gibt jetzt `preferredEconomyRoute` aus. Die Route unterscheidet unter anderem Bank-Cashout, Bank-Aufbau, installierte Action-Economy, Hand-Banktool, Hand-Economy-Engine, Burst-Event und Basic-Credit-Fallback.

Die Route wird nur aus side-sicheren Inputs gebildet: aktueller `PlayerView`, aktuelle `LegalActions`, Deck-Capabilities und bereits ermittelte Hand-Development-Evaluations. Die Route erscheint als `economy_route:<route>` in Debug-/Plan-Evidence.

### Hand-Development vor Basic-Credit

Runner-Hand-Development erkennt persistente Action-Economy jetzt als funktionale Economy-Coverage. TacticalPlan-Scoring erhoeht legale Bank-/Economy-Installationen, wenn die Economy-Posture genau diese Route verlangt. Dadurch kann eine Karte mit wiederholbarem besseren Credit-Ertrag den Basic-Credit-Plan schlagen.

### Remote-Contest-Planbindung

`tacticalPlanMappedChoice` blockiert jetzt einen Off-Plan-Run-Override, wenn der gemappte Plan ein `runner.contest_remote` auf ein score-relevantes Remote ist und der Scoreabstand in der definierten Planbindung bleibt. Der Block ist eng begrenzt auf fremde `start_run`-Targets und Remote-Plans mit `runner_run_target_payoff:score_threat`.

### Opportunitaetsgrenzen

Die neue Bindung verhindert nicht jeden Interrupt. Hohe Semantic-Gaps, nicht score-relevante Remotes, nicht mehr passende Targets, zu schlechte gemappte Actions oder nicht-Run-Overrides koennen weiter die Semantic-Auswahl gewinnen.

## Neue Regressionen

Ergaenzte oder angepasste Tests:

- `packages/ai/src/index.test.ts`: installiert eine deckgeroutete Action-Economy-Karte vor Basic-Credit.
- `packages/ai/src/index.test.ts`: haelt Score-Remote-Contest vor verstecktem Archives-Poke.
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`: blockiert Off-Plan-Archives-Run gegen score-relevantes Remote-Funding.
- Bestehender Remote-Root-Test wurde auf die aktuelle `runner.contest_remote`-Plan-Evidence angepasst.

## Verifikation

Gruen im Worktree `C:\Projekte\NETGRID_AI_RUNNER_PLAN_BINDING_ECONOMY`:

- `corepack pnpm exec vitest run --maxWorkers=1 --testTimeout=30000 packages/ai/src/runtime/semantic-choice-ranking.test.ts packages/ai/src/index.test.ts -t "installs deck-routed action economy|score-threat remote contest ahead|multiple remote root cards|score-threat remote contest"`
  - Ergebnis: 2 Dateien, 4 relevante Tests gruen.
- `corepack pnpm exec vitest run --maxWorkers=1 --testTimeout=30000 packages/ai/src/runner-hand-development.test.ts packages/ai/src/tactical-plans.test.ts`
  - Ergebnis: 2 Dateien, 67 Tests gruen.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - Ergebnis: gruen.

Rot / nicht als Slice-Gate verwendbar:

- `corepack pnpm --filter @netgrid/ai test`
  - Ergebnis im Arbeitsbranch: rot, 4 Testdateien mit historischen AI-Regressionen.
  - Gegenprobe auf lokalem `main`: der Einzeltest `breaks a visible Tutor run-duration subroutine when it would add an unaffordable future ETR` ist dort ebenfalls rot und waehlt `continue_run` statt `break_subroutine`.

Damit ist der volle AI-Testlauf aktuell ein bekannter Alt-Gate-Schuldpunkt und kein belastbarer Abschlussgate fuer diesen begrenzten Slice. Die neuen und direkt angrenzenden Regressionen sind gruen.

## Grenzen und Nicht-Ziele

- Keine neue Legacy-Fallback-Systemik.
- Keine kartenspezifische Sonderregel fuer einzelne Remotes oder Economy-Karten.
- Keine globale Garantie, dass die Runner-KI schon alle mittelfristigen Plaene sauber verfolgt; dieser Slice haertet die erkannten Economy- und Remote-Contest-Faelle.
- Keine Aenderung an offiziellen Regeln, Kartenpool-Freischaltung oder Runtime-Datenformaten.

## Integrationsstatus

Der Arbeitsbranch ist nach Paketabschluss fuer den lokalen Merge nach `main` vorgesehen. Der finale Merge und erneute Kurzchecks erfolgen nach dem letzten Paket-Commit.
