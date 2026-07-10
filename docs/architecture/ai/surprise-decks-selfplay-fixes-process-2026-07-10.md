# Überraschungsdecks-Selfplay-Fixes 2026-07-10

## Status

`in_progress`

## Quelle

- Nutzerauftrag: vier freigegebene Findings der 20-Partien-Selfplay-Analyse umsetzen und denselben Testlauf wiederholen.
- Evidence: `docs/reviews/ai/surprise-decks-20-game-selfplay-analysis-2026-07-10.md`
- Lokale Baseline: `data/local/ai-selfplay-surprise-decks-20x480-2026-07-10.json`

## Gesamtziel

Die vier freigegebenen Findings werden sequenziell, side-sicher und ohne
kartennamenspezifische Runtime-Sonderpfade behoben. Jedes Paket erhält
fokussierte Regressionen und einen eigenen Commit. Anschließend wird derselbe
deterministische 20-mal-480-Selfplay-Lauf mit denselben Decks und Seeds
wiederholt, verglichen und der fertige Branch lokal nach `main` integriert.

## Arbeitsraum

- Worktree: `C:\Projekte\NETGRID_AI_SURPRISE_DECKS_SELFPLAY_FIXES`
- Branch: `codex/surprise-decks-selfplay-fixes`
- Integrationsbranch: lokaler `main`

## In Scope

1. Budgetierte optionale Mehrfach-Rez-Choice nach `Data Fort Reclamation`.
2. Side-sicherer Audit der behaupteten zugübergreifenden Archives-Wiederholung;
   bei widerlegtem Runtime-Fehler Reclassification in den Detektor-Scope.
3. Bindende negative Duplicate-/Bank-Install-Evidence gegen Planübersteuerung.
4. Stabile, idempotente Selfplay-Safety-Findings und weniger
   Run-Mikroschritt-Fehlklassifikationen.
5. Identischer 20-mal-480-Wiederholungslauf und Baselinevergleich.

## Nicht-Ziele

- Keine Änderung der Engine-Regelautorität oder von `applyAction` als Guardrail.
- Keine Nutzung von FullState oder gegnerischen Hidden-Zone-Daten in der KI.
- Keine Anpassung der beiden persönlichen Decklisten.
- Keine allgemeine Balance-Aussage aus nur einem Deckpaar.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die KI wählt ausschließlich vorhandene `LegalActions`.
- Choice-Parameter werden ausschließlich aus side-sichtbaren
  PlayerView-/Choice-/LegalAction-Daten abgeleitet.
- Archives-Wissen wird nur aus sichtbaren Ereignissen aufgebaut und bei einer
  sichtbaren Inhaltsänderung invalidiert.
- Additive und ausdrücklich stackbare Installationen bleiben erlaubt.
- Leak-Detektoren werden nicht abgeschwächt; nur ihre Eingabestabilität und
  Fehlklassifikation werden korrigiert.

## Automatische Fehlerbehandlung

- Roter fokussierter Test: innerhalb des aktiven Pakets debuggen.
- Fachlich angrenzende Regression: Paket nicht abschließen.
- Fehlende side-sichere Information: als Blocker dokumentieren, nicht über
  FullState umgehen.
- Baseline- oder Wiederholungslauf mit Replay-, IllegalAction- oder
  Redaction-Fehler: Abschluss blockieren.

## Sicherheitsblocker

- Lösung benötigt gegnerische verdeckte Karten oder Deckreihenfolge.
- Engine erzeugt keine ausdrückbare legale Choice und eine korrekte Lösung
  wäre nur durch Umgehung von `applyAction` möglich.
- Fremde Änderungen auf `main` überschneiden sich beim Integrationspunkt
  fachlich mit denselben Verträgen.

## State Machine

`preflight -> p1_choice_budget -> p2_archives_memory -> p3_duplicate_fit -> p4_detector_stability -> p5_selfplay_rerun -> final_verify -> integration -> complete`

Es ist immer genau ein Paket aktiv. Kein Paket wird übersprungen.

## Paketfolge

### P0 – Preflight und Evidence

- Prozessartefakt und Evidence in den Worktree übernehmen.
- Ausgangsbranch, Worktree und fremde Hauptworkspace-Änderungen dokumentieren.
- Check: `git diff --check`.
- Done-Gate: isolierter sauberer Arbeitsstand mit ausschließlich P0-Artefakten.
- Commit: `docs(ai): add surprise deck selfplay fix process`

### P1 – Budgetierte Mehrfach-Rez-Choice

- Dedizierte generische Auswahl für optionale Install-/Rez-Folgechoices.
- Sichtbare Einzelkosten gegen temporäres und reguläres Budget rechnen.
- Bezahlbare Teilmenge beziehungsweise leere Auswahl liefern.
- Tests: Mischkosten, unbezahlbare Hochkostenkarte, Nullkostenkarten,
  vorhandene Data-Fort-Reclamation-Auswahlregressionen.
- Done-Gate: keine unbezahlbare `selectedOptionIds`-Kombination.
- Commit: `fix(ai): budget optional multi-rez choices`

### P2 – Archives-No-Payoff-Audit

- Aktuellen Archives-Wissens-/Run-Scoring-Pfad lokalisieren.
- Die vier stärksten Replay-Beispiele mit PlayerView-Counts und bekannten
  Kartentypen side-sicher reproduzieren.
- Wenn sich die Archives sichtbar geändert haben oder unbekannte Karten einen
  möglichen Payoff bilden, keinen produktiven Runtime-Fix vornehmen und das
  Finding in P4 reklassifizieren.
- Done-Gate: Runtime-Fehler bestätigt und getestet oder nachvollziehbar
  widerlegt und als Detektor-Follow-up dokumentiert.
- Commit: `docs(ai): reclassify archives selfplay finding`

### P3 – Negative Duplicate-/Bank-Install-Fits

- Negative Defer-/Grenznutzen-Evidence in die produktive Kandidatenwahl
  überführen.
- Planbindung darf einen positiven Alternativkandidaten nicht durch eine
  negative Duplicate-Installation verdrängen.
- Gegenprobe für additive/stackbare Kopien.
- Done-Gate: fokussierter Broker-Fall wählt positive Alternative; additive
  Kopie bleibt wählbar.
- Commit: `fix(ai): honor negative duplicate install fit`

### P4 – Selfplay-Finding-Stabilität

- Detektion auf finaler unveränderlicher redigierter Trace-Repräsentation.
- Idempotenz zwischen Erstlauf und erneuter Detektion aus persistierten
  Summaries.
- Verpflichtende `continue_run`-, Access- und Choice-Mikroschritte nicht als
  Recovery-/Plan-Mismatch-Hauptentscheidung klassifizieren.
- `repeated_low_value_archives` nur melden, wenn keine sichtbare
  Inhaltsänderung und keine unbekannte Archives-Karte einen frischen Payoff
  begründen.
- Leak-Positivtest bleibt rot beziehungsweise wird weiterhin erkannt.
- Done-Gate: identische Safety-Findings bei Wiederholung und keine bekannten
  Mikroschritt-Fehlklassifikationen.
- Commit: `fix(ai): stabilize selfplay finding detection`

### P5 – Identischer 20-mal-480-Wiederholungslauf

- Dieselben Benutzerdecks, Seeds, Controller und Aktionsgrenzen verwenden.
- Ergebnis unter `data/local/` speichern.
- IllegalActions, Replay, Fallback, Timeout, Findings, Outcomes und
  Spieldauer mit der Baseline vergleichen.
- Evidence-/Final-Report aktualisieren.
- Done-Gate: 20 Partien vorhanden; 0 Replay-Fehler; 0 illegale Aktionen aus
  dem behobenen Choice-Pfad; Vergleich vollständig dokumentiert.
- Commit: `docs(ai): review surprise deck selfplay rerun`

### P6 – Finalisierung und Integration

- Fokussierte Tests und angrenzende AI-Tests ausführen.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- Wenn realistisch `corepack pnpm --filter @netgrid/ai test`.
- `git diff --check` und sauberer Worktree.
- Aktuelles `main` defensiv integrieren, finale Checks wiederholen und Branch
  lokal nach `main` mergen.
- Done-Gate: lokaler Merge erfolgreich, Hauptworkspace ohne neue
  uncommitted Prozessänderungen, kein Push.

## /Goal

`/Goal Arbeite den Prozess surprise-decks-selfplay-fixes vollständig und sequenziell von P0 bis P6 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, dieses Prozessartefakt und den Evidence-Report. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SURPRISE_DECKS_SELFPLAY_FIXES auf Branch codex/surprise-decks-selfplay-fixes. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe jedes abgeschlossene Paket einzeln. Stoppe bei einem Safety-Blocker ohne Workaround. Wiederhole nach P1 bis P4 denselben 20-mal-480-Selfplay-Lauf, dokumentiere den Vergleich, verifiziere final, integriere aktuelles main defensiv und merge lokal. Kein Push und kein PR.`
