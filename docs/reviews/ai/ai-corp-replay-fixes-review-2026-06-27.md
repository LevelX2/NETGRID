# AI Corp Replay Fixes Review 2026-06-27

## Status

`completed`

## Quelle und Ziel

Quelle ist die Analyse der beendeten Corp-KI-Spiele:

- `match_ab44ac886c5dbf49`, `human_runner_vs_corp_ai`, Runner-Sieg durch Agenda-Punkte, StateVersion 511.
- `match_c1c3ef29eb313f0e`, `human_runner_vs_corp_ai`, Runner-Sieg durch Agenda-Punkte, StateVersion 112.

Ziel ist ein kompaktes, generisches KI-Fixpaket für die beobachteten Corp-Fehler:

- wirksame Verteidigung statt bloßer ICE-Präsenz;
- Remote-Scoreline-Viability inklusive Score-Closeout-Kandidaten;
- Central-Threat-/Rez-Funding-Kopplung für HQ und R&D;
- zielgebundene Economy;
- sichtbare Payoffs vor generischer Economy.

## Invarianten

- Die KI wählt ausschließlich aus `LegalActions`.
- Die KI nutzt nur Corp-PlayerView, side-gefilterte PublicEvents, LegalActions und explizit erlaubte Metadaten.
- Keine FullState-Nutzung, keine verdeckten Runner-Daten und keine Hidden-Info-Leaks in Debug, Reports oder Tests.
- Keine Kartennamen-Sonderlogik für produktives Verhalten; Kartenbeispiele dienen nur als Regressionsevidence.
- Engine, `applyAction`, Replay, StateHash und Randomness-Verträge bleiben unverändert.

## Evidence

### `match_c1c3ef29eb313f0e`

- SV8: `Homing Missile` wird mit `X=0` gerezzt. Trace-Basis und Bid-Limit bleiben 0, der Run geht weiter und `Charity Takeover` wird aus R&D gestohlen.
- SV25/SV26: Die Corp installiert `Project Venice` in Remote 1. Direkt danach bewertet die KI Advance als riskant wegen Remote-Rez-Floor, hat die riskante Install-Entscheidung aber bereits getroffen. Runner stiehlt die Agenda im folgenden Run.
- SV56 bis SV112: R&D-Druck steigt bis `rndPressure=1`. Die Corp installiert `Credit Blocks` und `Lesser Arcana`, bleibt aber bei 2 Credits und kann sie in den entscheidenden Runs nicht rezzen. Runner stiehlt `Marked Accounts` aus R&D zum Spielende.
- SV30: `Riddler` wird gerezzt, aber der Schutzwert berücksichtigt nicht ausreichend, ob nach dem Rez ein bezahlbarer Encounter-Stop verfügbar ist.

### `match_ab44ac886c5dbf49`

- SV165/SV166: `Corporate War` wird in Remote 1 installiert und nur langsam entwickelt, obwohl Runner-Druck sichtbar ist. Runner stiehlt die Agenda.
- SV500 bis SV502: Wieder riskante `Corporate War`-Remote-Scoreline bei Runner-Endgame-Druck. Legale Score-Closeout-/Burst-Kandidaten werden nicht stark genug gegen die riskante Linie abgewogen.
- SV326/SV327: Runner ist sichtbar getaggt; `Closed Accounts` und `Power Grid Overload` sind legale Payoff-Kandidaten, werden aber von generischer Economy verdrängt.

## Paketfolge

### Paket A: Evidence und Regression-Fixtures

- Review-/Evidence-Dokument anlegen.
- Relevante Match-/SV-Fälle als Testbasis benennen.
- Done-Gate: Dokument existiert, Scope und Invarianten sind festgehalten.
- Commit: `docs(ai): record corp replay fix evidence`

### Paket B: Effective Defense / Rez-Wirkung

- Einen kleinen Helper `semantic-runtime-corp-effective-defense.ts` einführen.
- Rezzbarkeit, Post-Rez-Credits, unmittelbares Stop-/Tax-/Damage-Potenzial, Post-Rez-Fähigkeitsbudget, sinnvolle X-Werte und Zero-Effect-Risiko bewerten.
- In Rez-Scoring und relevante Schutzbewertungen integrieren.
- Positive Tests: Homing-Missile-X=0 wird abgewertet; ein wirksamer X-Wert wird bevorzugt; Riddler ohne Fähigkeitspuffer erhält keinen robusten Schutzwert.
- Negative Tests: keine künstliche Rez-Priorität, wenn keine relevante Wirkung oder kein LegalAction-Kandidat existiert.
- Commit: `fix(ai): score effective corp defense`

### Paket C: Remote-Scoreline-Viability und Score-Closeout

- Agenda-Install, Advance und Score über denselben Viability-Kontext bewerten.
- Prüffaktoren: Corp-Klicks, Advancement Requirement, vorhandene Counter, legale Advance-/Score-/Burst-Kandidaten, Remote-Contest-Risiko, Rez-Floor nach Install und nach geplantem Advance.
- Advancement-Burst-Operationen als Score-Closeout-Kandidaten einbeziehen.
- Positive Tests: `Project Venice`-Install/Advance-Konsistenz, `Corporate War`-Remote-Fälle, `Systematic Layoffs` als Closeout-Kandidat.
- Negative Tests: Scoreline wird nicht blockiert, wenn sie geschützt oder sofort schließbar ist.
- Commit: `fix(ai): score remote closeout viability`

### Paket D: Central-Threat und Rez-Funding

- HQ/R&D-Druck in einem Central-Threat-Kontext bündeln oder den bestehenden Central-Rez-Kontext entsprechend erweitern.
- Unrezbare Central-ICE nicht als erledigte Verteidigung zählen.
- Funding nur boosten, wenn ein konkreter HQ-/R&D-Rez-Floor erreichbar wird.
- Positive Tests: hoher R&D-Druck mit unrezbarem ICE bevorzugt Funding oder bezahlbare Verteidigung; HQ-Agenda-Risiko erzeugt sinnvolle Schutz-/Funding-Priorität.
- Negative Tests: kein R&D-Funding-Bias ohne sichtbaren R&D-Druck oder ohne relevantes unrezbares ICE.
- Commit: `fix(ai): connect central pressure to rez funding`

### Paket E: Zielgebundene Economy und sichtbare Payoffs

- Economy-Aktionen nach `currentCredits`, `costToPlay`, `netCreditDelta`, `creditsAfterAction` und erreichtem Ziel-Floor bewerten.
- Sichtbare Tag-/Trash-/Credit-Payoffs vor generische Economy stellen, aber nur bei sichtbarem Tag, konkreter LegalAction und sichtbarer Wirkung.
- Positive Tests: bezahlbare Economy-Operation erreicht Central-/Remote-/Scoreline-Floor; `Closed Accounts`/`Power Grid Overload` schlagen BBS-/Basic-Economy bei sichtbarem Tag und relevantem Ziel.
- Negative Tests: keine Payoff-Priorität ohne sichtbaren Tag, ohne Ziel oder ohne relevanten Effekt; Basic-Credit bleibt korrekt, wenn er denselben Floor effizient erreicht.
- Commit: `fix(ai): prefer targeted corp payoffs`

### Paket F: Verifikation und Final Review

- Fokussierte Regressionen ausführen.
- `corepack pnpm --filter @netgrid/ai test` ausführen, wenn realistisch.
- `corepack pnpm --filter @netgrid/ai typecheck` ausführen.
- `git diff --check` ausführen.
- Final-Review aktualisieren und lokalen Merge nach `main` vorbereiten.
- Zusatzbefund aus dem Gate: `src/index.test.ts` teilte persistenten Tactical-Plan-Memory zwischen Tests. Die Loan-from-Chiba-Gruppe fiel dadurch order-abhängig, isoliert aber nicht. Der globale Test-Reset in `index.test.ts` isoliert den Store analog zu den spezialisierten Tactical-Plan-Tests.
- Commits: `test(ai): isolate tactical plan memory in index tests`, `docs(ai): finalize corp replay fixes`

## Umsetzung und Verifikation

### Umgesetzte Commits

- `596c4754` `docs(ai): record corp replay fix evidence`
- `4390e2f5` `fix(ai): score effective corp defense`
- `06bbc391` `fix(ai): score remote closeout viability`
- `06386381` `fix(ai): connect central pressure to rez funding`
- `7f57e3b1` `fix(ai): prefer targeted corp payoffs`
- `9fe3e5f3` `test(ai): isolate tactical plan memory in index tests`
- `docs(ai): finalize corp replay fixes`
- `499db43d` `test(ai): reconcile tactical memory reset import`

### Verifikation 2026-06-27

- Fokussierte Corp-/Cutover-Regressionen: 7 Dateien, 93 Tests, grün.
- Loan-from-Chiba-Isolationsreproduktion nach Test-Reset: 6 Tests, grün.
- `corepack pnpm exec vitest run src/index.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=verbose`: 534 Tests, grün.
- `corepack pnpm --filter @netgrid/ai test`: 165 Testdateien, 1709 Tests, grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.

## /Goal

Arbeite den Prozess `AI Corp Replay Fixes 2026-06-27` vollständig und sequenziell von Paket A bis Paket F im Worktree `C:\Projekte\NETGRID_AI_CORP_REPLAY_FIXES` auf Branch `codex/ai-corp-replay-fixes` ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Arbeite immer nur am aktuellen Paket. Nutze den Hauptworkspace nur für finalen Git-Abgleich und lokalen Merge. Stoppe ohne Workaround, wenn eine Lösung verdeckte Informationen bräuchte, LegalActions fehlen, Tests eine Engine-/Side-Safety-/Replay-Regression zeigen oder der lokale Merge fachlich kollidiert.
