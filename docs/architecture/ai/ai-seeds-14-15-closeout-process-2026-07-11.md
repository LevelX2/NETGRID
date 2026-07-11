# AI Seeds 14/15 Closeout Process

## Status

`MERGED`

## Quelle und Vorgabe

Freigegebene zugweise Analyse der deterministisch reproduzierten Benchmark-Seeds 14 und 15 von `Krash-Clown` gegen `Fast Advance, Baby` vom 11. Juli 2026.

## Zielprüfung

Die Vorgabe ist für die direkte automatische Umsetzung ausreichend präzise. Vier Fehlerverträge, side-safe Evidence, Zielmodule, Nicht-Ziele, Gegenproben, Worktree und lokaler Merge sind bestimmbar.

## Gesamtziel

Die Runner-KI verlässt einen erledigten Breaker-Suchzustand, finanziert Runs nur für das tatsächlich gebundene Ziel, und die Corp-KI bindet Score-Window-Installationen zielbewusst und erkennt stagnierendes Credit-Sammeln. Alle Anpassungen bleiben generisch, LegalAction-basiert und hidden-info-sicher.

## Annahmen

- Die bestehenden Semantic Scores bleiben fachliche Rohbewertung; Plan-Mapping darf sie nur mit nachweisbarem Planzusammenhang überstimmen.
- Matchpoint- und Fortschrittssignale werden ausschließlich aus der jeweiligen PlayerView, LegalActions und bestehender side-safe Plan-Memory abgeleitet.
- Lokale Benchmark-Rohdaten unter `data/local/` bleiben unversioniert; der Evidence-Report enthält nur verdichtete, side-safe Fakten.

## Nicht-Ziele

- Keine Engine-, Kartenregel- oder Deckänderung.
- Keine pauschale Abwertung legitimer Archives-Runs nach neuen Discards.
- Keine Sonderregeln für konkrete Kartennamen, Seeds oder Deck-IDs.
- Keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

- Die KI wählt ausschließlich aus `LegalActions`.
- Kein Zugriff auf `GameState` oder gegnerische Hidden Information.
- Plan- und Intent-Wechsel müssen im DecisionDebug sichtbar begründet werden.
- Gegenproben schützen legitimes Ansparen, echte Coverage-Lücken und sinnvolle Scoring-Remote-Installationen.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden nur im aktiven Paket debuggt.
- Eine notwendige Engine-/PlayerView-Erweiterung wird nicht im KI-Code umgangen, sondern als Blocker dokumentiert.
- Fremde Änderungen auf `main`, insbesondere `apps/web/next-env.d.ts`, bleiben unangetastet.

## Sicherheitsblocker

- Eine Lösung benötigt gegnerische Hidden Information.
- Eine benötigte Aktion fehlt in `LegalActions`.
- Engine-, Side-Safety- oder Replay-Gates regressieren.
- Der finale Merge überschneidet sich unauflösbar mit fremden Änderungen.

## State Machine

`P1_ACTIVE -> P1_DONE -> P2_ACTIVE -> P2_DONE -> P3_ACTIVE -> P3_DONE -> P4_ACTIVE -> P4_DONE -> P5_ACTIVE -> FINAL_GREEN -> MERGED`

Genau ein Paket ist aktiv. Ein Übergang erfolgt erst nach Done-Gate und eigenem Commit.

## Paketfolge

1. P1 – Preflight, Worktree und Prozessvertrag
2. P2 – Seed-Evidence und Fehlerverträge
3. P3 – Runner-Intent-Lifecycle und zielgebundene Run-Finanzierung
4. P4 – Corp-Score-Window-Zielbindung und Stagnation
5. P5 – Regressionen, breite Gates, Final-Review, Wissenspflege und Integration

## Paketdetails

### P1 – Preflight, Worktree und Prozessvertrag

- Ziel: Isolierten Arbeitsstrang und verbindlichen Controller-Vertrag herstellen.
- Eingang: Nutzerfreigabe und reproduzierte Seeds.
- Arbeit: Hauptworkspace klassifizieren, Branch/Worktree anlegen, dieses Artefakt schreiben.
- Kernartefakt: diese Prozessseite.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: Worktree zeigt auf den freigegebenen Main-Stand; Fremdänderungen sind klassifiziert.
- Commit: `docs(ai): define seeds 14 15 closeout process`

### P2 – Seed-Evidence und Fehlerverträge

- Ziel: Die vier freigegebenen Punkte versioniert und side-safe festhalten.
- Eingang: P1 abgeschlossen.
- Arbeit: Evidence-Report mit Aktionsankern, Alternativen, Akzeptanzkriterien und Nicht-Zielen.
- Kernartefakt: `docs/reviews/ai/ai-seeds-14-15-closeout-evidence-2026-07-11.md`.
- Checks: Evidence gegen deterministische Kontrollläufe prüfen; `git diff --check`.
- Done-Gate: Jeder Fehler besitzt Beispiel, bessere sichtbare Alternative und Regressionstest-Vertrag.
- Commit: `docs(ai): record seeds 14 15 closeout evidence`

### P3 – Runner-Intent-Lifecycle und Run-Finanzierung

- Ziel: Erledigte Breaker-Suche verlassen und nutzlose Vorbereitungs-Credits verhindern.
- Eingang: P2 abgeschlossen.
- Arbeit: bestehende Intent-/Plan-Consumer auditieren, generische Lifecycle- und Zielkosten-Regeln ergänzen, fokussierte Gegenproben schreiben.
- Kernartefakte: `packages/ai/src/` und zugehörige Tests.
- Checks: fokussierte Vitest-Regressionen, AI-Typecheck, `git diff --check`.
- Done-Gate: Coverage-vollständig wechselt zu Pressure; echte Lücke bleibt Search; kostenloser Run erhält keinen Funding-Click; teurer Run darf sinnvoll ansparen.
- Commit: `fix(ai): close runner search and bind run funding`

### P4 – Corp-Score-Window-Zielbindung und Stagnation

- Ziel: Falsche Remote-ICE-Ziele und endloses Credit-Sammeln aus Score-Window-Plänen entfernen.
- Eingang: P3 abgeschlossen.
- Arbeit: target-aware Mapping, Qualitätsveto und messbare Fortschritts-/Stagnationsregeln ergänzen; Gegenproben schreiben.
- Kernartefakte: `packages/ai/src/` und zugehörige Tests.
- Checks: fokussierte Vitest-Regressionen, angrenzende Corp-Plan-Tests, AI-Typecheck, `git diff --check`.
- Done-Gate: Remote-Überbau verliert gegen passende Zielvariante; sinnvolle Scoring-Remote-Installation bleibt erlaubt; Reserve-Credits verlängern nur bei echtem Bedarf.
- Commit: `fix(ai): validate corp score window progress`

### P5 – Regressionen, breite Gates, Final-Review, Wissenspflege und Integration

- Ziel: Gesamtänderung belastbar abschließen und lokal nach `main` integrieren.
- Eingang: P4 abgeschlossen.
- Arbeit: relevante AI-Suite und Benchmark-Gegenprobe, Final-Review, Wissenslog, Main-Abgleich und lokaler Merge.
- Kernartefakte: Final-Review und aktueller Monatslog.
- Checks: fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck`, realistisch `corepack pnpm --filter @netgrid/ai test`, passende Seed-Gegenprobe, `git diff --check`; nach Merge wiederholen.
- Done-Gate: Worktree sauber, alle Pakete committed, FINAL_GREEN dokumentiert, lokaler Main-Merge und Main-Verifikation erfolgreich.
- Commit: `docs(ai): finalize seeds 14 15 closeout`

## Verifikationsregeln

- Fokussierte Tests laufen vor breiten Gates.
- Jede neue Priorität benötigt mindestens eine Gegenprobe.
- Benchmark-Ergebnisse werden als Verhaltens-Evidence, nicht als Beweis globaler Deckstärke interpretiert.
- Warnungen sind nur akzeptabel, wenn der jeweilige Gate-Status grün bleibt und keine neue Warnklasse entsteht.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_SEEDS_14_15_CLOSEOUT`
- Branch: `codex/ai-seeds-14-15-closeout`
- Basis: lokaler `main` bei Start `b651252acf0a514bdfe7cb689d9d072fec37c228`
- Hauptworkspace nur für finalen Main-Abgleich und Merge verwenden.
- Jedes Paket erhält einen eigenen Commit.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls es weitergelaufen ist.
- Kein Push und kein PR.

## Controller-Prompt-Kern

`/Goal Arbeite AI Seeds 14/15 Closeout vollständig und sequenziell von P1 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies AGENTS.md, packages/ai/AGENTS.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SEEDS_14_15_CLOSEOUT auf codex/ai-seeds-14-15-closeout; nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktiven Paket, führe dessen Checks aus und committe es vor dem nächsten Übergang. Stoppe bei Sicherheitsblockern ohne KI-Workaround. Nach FINAL_GREEN: main abgleichen, lokal mergen, main erneut prüfen, Worktree entfernen und das Goal erst dann abschließen.`

## Abschlusskriterien

- Vier freigegebene Fehlerverträge generisch umgesetzt oder mit harter Removal Condition blockiert.
- Fokussierte Gegenproben und relevante breite Gates grün.
- Evidence, Final-Review und Wissenslog aktuell.
- Arbeitsbranch lokal nach `main` integriert; fremdes `next-env.d.ts` unverändert erhalten.
