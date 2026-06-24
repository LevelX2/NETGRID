# AI Corp Tag-Punish Endgame Prozess

## Status

`review_ready_for_main_integration` seit 2026-06-24.

## Quelle/Vorgabe

- Nutzerauftrag vom 2026-06-24: das aktuellste gespeicherte Human-Runner-vs-Corp-AI-Spiel zugweise analysieren, Fehlentscheidungen gruppieren und die erkannten Fehlersituationen direkt in passende KI-Anpassungen überführen.
- Analysebasis: lokales SQLite-Match `match_d3b4e1a8e415d15a`, Modus `human_runner_vs_corp_ai`, Runner-Sieg durch Agenda-Punkte bei `stateVersion 521`.
- Vorarbeiten auf `main`: `corp-ai-diplomatic-immunity-trash-activity-process-2026-06-24.md` und `corp-ai-tagged-meat-damage-payoff-process-2026-06-24.md`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

- Gesamtziel: Korp-KI behandelt die im Spiel sichtbaren Tag-Punish-/Endgame-Fehler zukünftig strategisch kohärenter.
- Erwarteter Endzustand: KI-Hints und Semantic-Runtime-Scoring priorisieren legale Payoff-, Trash- und Endgame-Aktionen side-safe; fokussierte Regressionen belegen die Fehlergruppen.
- Relevante Artefakte: `packages/ai/src/index.ts`, fokussierte AI-Tests, `data/ai/*` bei nachweislich falschen Hint-Informationen, Prozess-/Review-Dokumentation.
- Branch-/Worktree-Erwartung: Umsetzung im Worktree `C:\Projekte\NETGRID_AI_CORP_TAG_PUNISH_ENDGAME` auf Branch `codex/ai-corp-tag-punish-endgame`, finaler lokaler Merge nach `main`.
- Sicherheitsgrenzen: keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.

## Gesamtziel

Die Korp-KI soll bei einem stark getaggten Runner und sichtbarem Agenda-Druck nicht weiter nach generischer Economy-/Setup-Priorität spielen, sondern in einen side-safe Korp-Tag-Punish-Endgame-Modus wechseln:

- legale Tag-/Meat-Damage-Payoffs wie `Schlaghund`, `Scorched Earth`, `Punitive Counterstrike` und `Urban Renewal` werden nur aus vorhandenen `LegalActions` gewählt und gegen sichtbare Meat-Damage-Prävention bewertet;
- sichtbare Runner-Ressourcen, die Korp-Payoffs neutralisieren oder Runner-Zentraldruck ermöglichen, werden früher und differenziert getrasht;
- Economy wird nicht pauschal verdrängt, sondern nur dann hoch bewertet, wenn sie ein konkretes Damage-/Bypass-Ziel oder akuten Endgame-Schutz vorbereitet;
- langsamer Remote-/Archives-Aufbau wird bei Runner-Agenda-Druck und vorhandenen Payoff-/Trash-Fenstern gedämpft.

## Annahmen

- Sichtbare Runner-Rig-Karten, Tags, Credits, Handcount, Agenda-ScoreArea-Count und Korp-Credits sind side-safe PlayerView-Daten.
- Die KI kennt keine verdeckten Runner-Hand-, Stack- oder Zugriffsinformationen.
- Bestehende Vorgängerfixes für `Diplomatic Immunity` und `Schlaghund` bleiben gültig und werden nicht zurückgebaut.
- Falls vollständige mehrzügige Kill-Planung zu groß wird, ist eine konservative Semantic-Runtime-Heuristik mit Debug-Evidence zulässig.

## Nicht-Ziele

- Keine Änderung der Kartenmechanik oder Kartentexte.
- Keine neue LegalAction-Erzeugung und kein Bypass von Engine-Kosten, Timing, Targets oder Choices.
- Keine offizielle Kartenpool-Erweiterung.
- Kein UI-Redesign, kein Serverstart, kein Push und keine Pull-Request-Erstellung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Nach jedem Paket: fokussierte Checks, `git diff --check`, Commit.
- Fremde Änderungen im Hauptworkspace bleiben unberührt.
- Erkenntnisse mit dauerhaftem Nutzen werden in Review-/Wissensartefakte zurückgeführt.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden eng im Paket-Scope debuggt.
- Ein Engine- oder PlayerView-Gap außerhalb des KI-Scope wird als Blocker oder Follow-up dokumentiert.
- Wenn der Hauptworkspace wegen fremder Änderungen nicht sicher lokal mergebar ist, bleibt der Arbeitsbranch committed und der Integrationsblocker wird benannt.

## Sicherheitsblocker

Stoppe ohne Workaround, wenn eine Umsetzung erfordern würde:

- verdeckte Runner-Informationen für Korp-Entscheidungen zu nutzen;
- Aktionen außerhalb der Engine-`LegalActions` zu erzeugen;
- `applyAction`, Replay, StateHash oder Randomness zu verändern;
- fremde Hauptworkspace-Änderungen zu überschreiben.

## State Machine

`process_prepared` -> `evidence_committed` -> `hint_audit_committed` -> `behavior_committed` -> `review_committed`

Der nachgelagerte Controller-Schritt ist die lokale Integration des Arbeitsbranches nach `main` oder die Dokumentation eines Integrationsblockers.

## Paketfolge

### CTPE-0 Prozess-Preflight

Ziel: Worktree, Branch, Ziel, Paketfolge und `/Goal`-Kern festlegen.

Kernartefakte:

- `docs/architecture/ai/ai-corp-tag-punish-endgame-process-2026-06-24.md`

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate:

- Prozessartefakt committed.

Commit-Message:

- `Add Corp tag-punish endgame process`

### CTPE-1 Repro-Evidence und Fehlergruppen

Ziel: Die aus dem gespeicherten Spiel erkannten Fehlergruppen als side-safe Repro-/Review-Evidence dokumentieren.

Konkrete Arbeit:

- Match-, Turn- und Decision-IDs mit Fehlermuster verdichten.
- Trennen zwischen bereits durch Vorgängerfixes adressierten Punkten und offenen Endgame-/Sequencing-Gaps.
- Akzeptanzkriterien für Codepakete daraus ableiten.

Kernartefakte:

- `docs/reviews/ai/ai-corp-tag-punish-endgame-evidence-2026-06-24.md`

Checks:

- Markdown-/Diff-Review
- `git diff --check`

Done-Gate:

- Evidence benennt konkrete Decision-Fenster und keine Hidden-Info-Annahmen.

Commit-Message:

- `Document Corp tag-punish endgame evidence`

### CTPE-2 Hint-/Semantik-Audit

Ziel: Falsche oder unzureichende KI-Hint-Informationen für die betroffenen Karten korrigieren oder als bereits korrekt belegen.

Konkrete Arbeit:

- `Schlaghund`, `Scorched Earth`, `Punitive Counterstrike`, `Urban Renewal`, `Closed Accounts`, `Datapool`, `Netwatch Credit Voucher`, `Chance Observation`, `Trojan Horse`, `Diplomatic Immunity`, `Full Body Conversion`, `Dermatech Bodyplating`, `Techtronica Utility Suit`, `Submarine Uplink`, `The Springboard`, `Nomad Allies`, `Databroker`, `Technician Lover` prüfen.
- Nur tatsächlich falsche aktive Hint-Daten ändern.
- Generische Funktionssignale bevorzugen; keine neue Sonderlogik, wenn vorhandene Ontologie ausreicht.

Kernartefakte:

- `data/ai/*` nur bei nachweislicher Korrektur.
- fokussierte Hint-/Ontology-Tests, falls Daten geändert werden.
- Evidence-Abschnitt im Review.

Checks:

- passende AI-Hint-/Ontology-Tests
- `git diff --check`

Done-Gate:

- Kein bekannter falscher Hint bleibt und keine neue Hidden-Info-Projektion entsteht.

Commit-Message:

- `Audit Corp tag-punish AI hints`

### CTPE-3 Generische Endgame-/Sequencing-Heuristik

Ziel: Semantic Runtime ergänzt einen generischen Korp-Tag-Punish-Endgame-Druck, der die im Spiel schlechten Entscheidungen künftig anders rankt.

Konkrete Arbeit:

- Endgame-Kontext aus sichtbaren Tags, Agenda-Druck, Credits, Klicks, Runner-Ressourcen und legalen Payoffs ableiten.
- Resource-Trash differenziert bewerten: Meat-Damage-Prävention, Tag-Removal/-Avoid, Trace-Link, R&D-Topdeck-Wissen und Deferred-Economy.
- Langsame Setup-/Remote-/Archives-Aktionen bei akutem Endgame-Druck dämpfen.
- Economy nur als Payoff-Funding hochziehen, wenn ein sichtbarer Payoff und ein plausibler Credit-Zielwert existieren.
- Debug-Evidence für gewählte und verworfene Alternativen ergänzen.

Kernartefakte:

- `packages/ai/src/index.ts`
- fokussierte Regressionen in `packages/ai/src/index.test.ts` oder engeren AI-Testdateien

Checks:

- fokussierte Vitest-Tests für die neuen Fälle
- `git diff --check`

Done-Gate:

- Regressionsfälle wählen nicht mehr generische Credits/Setup, wenn legale bessere Payoff-/Trash-Aktionen verfügbar sind.
- Gegenproben ohne Tags, ohne Agenda-Druck oder ohne Payoff bleiben konservativ.

Commit-Message:

- `Add Corp tag-punish endgame scoring`

### CTPE-4 Review, Wissenspflege und Integration

Ziel: Abschlussreview, Checks, Wissenslog und finaler lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/ai-corp-tag-punish-endgame-final-report-2026-06-24.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Checks:

- fokussierte AI-Tests
- `git diff --check`
- `git status --short --branch`
- finaler Merge-Check auf `main`

Done-Gate:

- Branch ist sauber und lokal nach `main` integriert oder ein klarer Integrationsblocker ist dokumentiert.

Commit-Message:

- `Complete Corp tag-punish endgame process`

## Verifikationsregeln

- Fokussierte Tests haben Vorrang.
- Breite Testläufe werden versucht, wenn sie realistisch in den Scope passen.
- Nicht ausgeführte oder durch Baseline blockierte Checks werden im Final Report benannt.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_CORP_TAG_PUNISH_ENDGAME`
- Arbeitsbranch: `codex/ai-corp-tag-punish-endgame`
- Hauptworkspace: `C:\Projekte\NETGRID`
- `main` ist lokaler Integrationsbranch.
- Pushes und PRs nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den AI Corp Tag-Punish Endgame Prozess vollständig und sequenziell von CTPE-0 bis CTPE-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, die AI-AGENTS-Regeln und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_CORP_TAG_PUNISH_ENDGAME auf Branch codex/ai-corp-tag-punish-endgame.
Nutze den Hauptworkspace C:\Projekte\NETGRID nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete CTPE-0 bis CTPE-4 sind abgeschlossen und committed.
- Die Korp-KI behandelt die analysierten Fehlergruppen über generische, side-safe Bewertungslogik besser.
- Fokussierte Regressionen sind grün.
- Relevante Erkenntnisse sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` integriert oder ein Integrationsblocker ist belastbar dokumentiert.
