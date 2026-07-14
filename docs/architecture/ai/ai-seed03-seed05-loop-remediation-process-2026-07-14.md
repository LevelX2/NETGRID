# KI-Remediation für Baseline-Seed 03 und Seed 05 (2026-07-14)

Status: Aktiv; P0 bis P2 erfüllt, P3 in Vorbereitung

## Quelle und Zielprüfung

Quelle sind die beiden Action-Limit-Partien des standardisierten
AI-Behavior-Baseline-v1-Laufs auf Git-Head `4dfe4b80a`:

- Slot: `strategy_panel_hybrid_score_punish_cheap_bag`;
- Runner: `Blink Pressure Rig`;
- Korp: `Cheap Bag of Tricks`;
- Seeds: `ai-behavior-baseline-v1-03` und
  `ai-behavior-baseline-v1-05`;
- Vertrag: beidseitig `current_candidate`, maximal 480 Aktionen;
- lokale Evidence:
  `data/local/ai-behavior-baseline-v1-match-e676-remediation-2026-07-14-raw.json`.

Die Vorgabe ist für die automatische Umsetzung präzise genug. Die
chronologische Analyse, Fehlerzustände, gewünschten Gegenverträge und
Schichtzuordnung stehen in
`docs/reviews/ai/ai-behavior-baseline-v1-seeds-03-05-deep-dive-2026-07-14.md`.

## Gesamtziel und `/Goal`

`/Goal`: Die aus Seed 03 und Seed 05 abgeleiteten KI-Schleifen sequenziell im
eigenen Worktree zuerst als rote spielgleiche beziehungsweise sequenzielle
Correctness-Verträge sichern, danach die allgemeinen Ursachen in
Fähigkeitssemantik, marginaler Creditbewertung, Planfortschreibung,
Trace-Sequenznutzen und Blink-Deckkonversion side-safe beheben, vollständig
verifizieren, beide Seeds unter unverändertem Baseline-Vertrag erneut prüfen,
lokal nach `main` integrieren und Worktree sowie Arbeitsbranch verifiziert
entfernen.

- Arbeitsbranch: `codex/ai-seed03-seed05-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_SEED03_SEED05_REMEDIATION`
- Ausgangs-`main`: `4dfe4b80ad41048edc76eaee5de2d572bb090832`
- Hauptworkspace: ausschließlich Prozessbasis und finaler lokaler Merge
- Push oder Pull Request: nicht Teil dieses Prozesses

## Annahmen und Nicht-Ziele

- Wiederholte Nutzung von `Newsgroup Filter` oder `Netwatch Operations Office`
  wird nicht pauschal begrenzt. Drei oder vier Aktivierungen bleiben zulässig,
  wenn ihr marginaler beziehungsweise sequenzieller Nutzen positiv ist.
- Die neue Langfrist- und Iterationsplanung bleibt führend. Dieser Prozess
  ergänzt side-sichere Schritt-Postconditions und Fortschrittsnachweise; er
  erzeugt keine konkurrierende Zielhierarchie.
- Rules Engine und `LegalActions` bleiben alleinige Regelautorität. Die KI
  verändert keine Kosten, Karteneffekte, Trace-Auflösung oder Zufallsregeln.
- Produktive Sonderfälle nach Match-ID, Seed oder Kartenname sind verboten.
  Kartenhints dürfen konkrete Quellen benennen; Runtime-Logik arbeitet mit
  strukturierten Effekten und Fähigkeiten.
- Gegnerische Hidden-Zonen, zukünftige Events und der unredigierte GameState
  sind keine zulässigen Eingaben.
- Korp-Remote-Übervorsicht aus Seed 03 bleibt ein dokumentiertes sekundäres
  Follow-up. Ein pauschaler Score-, Install- oder Advance-Bonus gehört nicht in
  diesen Prozess.
- Es gibt keinen breiten Bewertungsrefactor und keine neue Controller-Runtime.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Fachliche Expectations werden nach roter Evidence nicht abgeschwächt.
- Eindeutige Fähigkeitsspezialisierung ist fail-closed: Nur eine side-sicher
  gebundene einzelne Fähigkeit darf `card_ability.unknown` spezialisieren.
- Creditbewertung berücksichtigt Reserve, konkreten Fundingbedarf,
  Entwicklungsoptionen und Wiederholung, ohne eine absolute Kartengrenze.
- Planfortschritt wird am nachfolgenden sichtbaren Zustand geprüft. Ein bloß
  ausgewählter gemappter Schritt ist kein ausreichender Erfolgsnachweis.
- Trace-Sequenzen dürfen nur dann als Punish-Fortschritt gelten, wenn ein Tag,
  ein unmittelbarer Payoff oder eine messbare Annäherung an ein realistisches
  Folgefenster entsteht.
- Universelle probabilistische Breaker-Coverage wird von stabiler
  typgebundener Coverage unterschieden.
- Determinismus, Replay, StateHash, Redaction und LegalAction-Validierung
  bleiben unverändert.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` beziehungsweise eine fachlich falsche Auswahl im
  sequenziellen Vertrag gilt als rote Verhaltens-Evidence.
- `engine_legality_drift`, `runtime_state_drift`, Fixture-/Capture-Fehler oder
  Redaction-Verstöße werden vor jeder Bewertungsänderung als
  Infrastrukturproblem behoben.
- Wenn der exakte Baseline-Zustand nicht als spielgleicher Checkpoint
  rekonstruierbar ist, darf ein semantisch äquivalenter Engine-erzeugter
  Decision-Checkpoint nur mit dokumentierter Abweichung verwendet werden.
- Hidden-Info-Bedarf, fehlende LegalActions oder ein Widerspruch zur führenden
  Planarchitektur stoppen das betroffene Paket mit Removal Condition.
- Rote Tests werden nicht durch weichere Erwartungen, größere Zufallstoleranz
  oder zusätzliche Legacy-Fallbacks grün gemacht.

## State Machine

`preflight -> process_committed -> red_evidence -> semantics_fixed -> plan_progress_fixed -> doctrine_fixed -> verified -> baseline_replayed -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis und isolierter Worktree

- Ziel: Analyse, `/Goal`, Invarianten, Arbeitsbranch und Worktree sichern.
- Arbeit: bestehende Review-/Logänderungen klassifizieren, Prozessartefakt
  anlegen, P0 auf `main` committen und den Arbeits-Worktree vom sauberen
  Integrationsstand erzeugen.
- Checks: Prettier für geänderte Dokumente, `git diff --check`, sauberer
  Hauptworkspace nach Commit.
- Done-Gate: Prozessartefakt ist versioniert; Zielbranch und Worktree zeigen
  auf denselben sauberen Ausgangsstand.
- Commit: `docs(ai): plan seed03 seed05 loop remediation`

### P1 – Rote spielgleiche und sequenzielle Verträge

- Ziel: Die falschen Entscheidungen vor Produktionsänderungen reproduzieren.
- Arbeit:
  1. Seed 03, Aktion 271: weitere Broker-Einzahlung trotz 21 kombinierter
     Credits und ohne Fundingbedarf;
  2. Seed 03, Aktion 282 oder 470: weiterer Basic Credit trotz hohem Pool,
     fehlender Coverage und legaler Suche, Recovery und Memory;
  3. Seed 05, Aktion 211: vierfache Newsgroup-Nutzung bei 53 Credits verdrängt
     Entwicklung und Remote-Reaktion;
  4. Low-Credit-Gegenvertrag erlaubt weiterhin mehrfache Economy-Nutzung;
  5. Seed 05, Aktion 279 oder 467: Netwatch wird trotz niedriger
     Trace-Konversion durch Plan-Mapping erzwungen;
  6. ein sequenzieller Korp-/Runner-Zyklus mit drei erfolglosen Traces, keinem
     Tag und nicht sinkendem Runner-Pool löst Neuplanung aus;
  7. ein Trace-Mining-Vertrag erkennt wiederholbare Credit-/Trace-Schleifen
     ohne Boardfortschritt.
- Kernartefakte: Decision-Checkpoint-Fixtures und fokussierte Tests unter
  `packages/ai/src/evaluation/decision-checkpoints/`; bei Bedarf ein enger
  sequenzieller Runtime- oder Baseline-Detector-Test.
- Checks: Fixture-Validierung, fokussierter Vitest-Lauf, Fehlerklassen einzeln
  prüfen, Gegenverträge grün, `git diff --check`.
- Done-Gate: Alle Zielverträge sind aus fachlichem Grund rot; kein Legality-,
  State-, Fixture- oder Redaction-Drift.
- Commit: `test(ai): capture seed03 seed05 loop regressions`

### P2 – Fähigkeitssemantik und marginale Creditbewertung

- Ziel: Eindeutige Economy-Fähigkeiten korrekt klassifizieren und ihren
  Grenznutzen kontextabhängig bewerten.
- Arbeit: side-sichere Einzelfähigkeitsspezialisierung, gesättigter
  Credit-Yield und Wiederholungs-/Fundingkontext; keine feste Nutzungsgrenze.
- Kernartefakte:
  `packages/ai/src/actions/basic-action-semantics.ts`,
  `packages/ai/src/actions/action-card-semantic-join.ts`,
  `packages/ai/src/runtime/runner-credit-yield-score.ts` sowie fokussierte
  Semantik- und Scoringtests.
- Checks: P1-Runner-Verträge, Low-Credit-Gegenvertrag, angrenzende Action-
  Semantik- und Runner-Economy-Tests, AI-Typecheck, `git diff --check`.
- Done-Gate: Newsgroup wird eindeutig als Economy interpretiert; reiche
  Schleifenzustände konvertieren, notwendige Mehrfachnutzung bleibt erlaubt.
- Commit: `fix(ai): saturate repeatable runner economy`

### P3 – Erfolgsbasierter Planfortschritt und Trace-Sequenznutzen

- Ziel: Punish- und Creditpläne nur bei sichtbarer Zielannäherung fortschreiben.
- Arbeit: side-sichere Postconditions, begrenzte erfolglose Wiederholung,
  Trace-Sequenzquote aus Basis, nötigem Bid, Pools, Klicks, Wiederholungen,
  unmittelbarem Payoff und sichtbarem Credittrend.
- Kernartefakte:
  `packages/ai/src/plans/plan-memory.ts`,
  `packages/ai/src/runtime/trace-tag-success-estimate.ts`,
  `packages/ai/src/plans/tactical-plan-corp-plans.ts` sowie fokussierte Plan-
  und Trace-Tests.
- Checks: P1-Korp-Einzel- und Sequenzverträge, positive Low-Credit-/Payoff-
  Gegenverträge, bestehende Plan-Memory- und Trace-Tests, AI-Typecheck,
  `git diff --check`.
- Done-Gate: erfolglose Tax-Schleifen laufen aus; realistische mehrfache
  Trace-Konversion bleibt priorisierbar; Langfristziele bleiben unverändert.
- Commit: `fix(ai): require observable plan conversion`

### P4 – Blink-Deckkonversion

- Ziel: Universelle probabilistische Coverage in konkrete Run-, Draw-,
  Handschutz-, Such- und Recovery-Entscheidungen übersetzen.
- Arbeit: stabile und probabilistische Coverage getrennt modellieren;
  Handpuffer und tatsächlich im Deck erreichbare Alternativen berücksichtigen.
- Checks: fokussierte Runner-Coverage-/Run-Viability-Tests, positiver
  Blink-Run-Gegenvertrag, AI-Typecheck, `git diff --check`.
- Done-Gate: Blink-Decks warten nicht auf inexistente Standardbreaker und
  laufen mit tragbarem Risiko; untragbare Handrisiken werden nicht ignoriert.
- Commit: `fix(ai): convert probabilistic universal coverage`

### P5 – Breite Verifikation und Originalseed-Rerun

- Ziel: Regressionsschutz und tatsächliche Schleifenauflösung nachweisen.
- Checks:
  - alle neuen und angrenzenden fokussierten Tests;
  - `corepack pnpm --filter @netgrid/ai typecheck`;
  - vollständige AI-Testshards beziehungsweise vollständige AI-Suite;
  - aktive AI-Architekturchecks;
  - unveränderter Baseline-v1-Rerun mindestens für Slot
    `strategy_panel_hybrid_score_punish_cheap_bag` und Seeds 03/05;
  - Replay-, IllegalAction-, Hidden-Info- und Action-Limit-Ergebnisse;
  - `git diff --check`.
- Done-Gate: fokussierte und breite Gates grün; beide Originalseeds enden
  regulär oder eine verbleibende fachlich andere Schleife ist als neuer roter
  Vertrag nachgewiesen und innerhalb des freigegebenen Scopes geschlossen.
- Commit: nur bei geänderten Test- oder Evidence-Artefakten.

### P6 – Abschlussreview und Wissenspflege

- Ziel: Ursachen, Änderungen, Gegenverträge, Baseline-Ergebnis und Grenzen
  dauerhaft dokumentieren.
- Kernartefakte: Final Review unter `docs/reviews/ai/`, AI-README bei
  dauerhaftem Architekturvertrag und Monatslog.
- Checks: Links, Prettier, `git diff --check`.
- Done-Gate: versionierte Dokumentation trennt technische Gates,
  Play-Strength-Evidence und offene Follow-ups.
- Commit: `docs(ai): close seed03 seed05 loop remediation`

### P7 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, final verifizieren, Arbeitsbranch
  lokal bevorzugt per Fast-Forward integrieren und Worktree sowie Branch
  verifiziert entfernen.
- Checks: sauberer Arbeits-Worktree, Paketcommits vollständig, relevante
  Checks nach Main-Abgleich, `git status --short` und `git diff --check` auf
  `main`, doppelte Worktree-Entfernungskontrolle, `git branch -d`.
- Done-Gate: `main` enthält den vollständigen Prozess; Worktree-Pfad und
  Arbeitsbranch existieren nicht mehr.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_SEED03_SEED05_REMEDIATION` auf Branch
`codex/ai-seed03-seed05-remediation`. Lies vor Codeänderungen dieses Artefakt,
die beiden Baseline-Reviews, `packages/ai/AGENTS.md` und die betroffenen
Current-State-Architekturverträge. Arbeite immer nur am aktiven Paket. Stelle
die fachlichen Tests zuerst rot, ändere Expectations danach nicht ab und
committe jedes abgeschlossene Paket separat. Nutze den Hauptworkspace erst für
den finalen lokalen Merge. Bei einem Sicherheitsblocker dokumentiere Ursache
und Removal Condition. Markiere das Gesamtziel erst nach Main-Prüfung,
verifizierter Worktree-Entfernung und Branch-Cleanup als abgeschlossen.

## Abschlusskriterien

- Alle P1-Verträge sind dauerhaft versioniert und nach den Fixes grün.
- Keine produktive Match-, Seed- oder Kartennamen-Sonderlogik wurde ergänzt.
- Notwendige wiederholbare Economy und Traces bleiben durch Gegenverträge
  erhalten.
- Planfortschritt ist mit der übergeordneten Planebene kompatibel und an
  sichtbare Wirkung gebunden.
- Beide Originalseeds sind unter dem unveränderten Vertrag erneut bewertet.
- Alle verpflichtenden Checks und nicht ausgeführten Checks sind dokumentiert.
- Lokales `main` enthält alle Paketcommits; Worktree und Branch sind entfernt.
