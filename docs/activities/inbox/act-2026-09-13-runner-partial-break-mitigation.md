---
activityId: act-2026-09-13-runner-partial-break-mitigation
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-09-13
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Runner: bezahlbare Teilbreaks zur Schadensbegrenzung

## Ziel

Der bestehende Owner `runner.convert_run_window` berücksichtigt bezahlbare
Pump-/Breakfolgen, die aktuelle sichtbare Schäden verringern, auch wenn der
Run anschließend endet. Pump-Zulassung, konkrete Break-Auswahl und
Fortsetzung müssen dieselbe begrenzte Abwehrlinie tragen. Es entsteht kein
neuer Plan und keine pauschale Pflicht, alle Credits für jeden Schaden auszugeben.

## Kontext und Quellen

- Nutzerauftrag: Fix planen; Umsetzung ist noch nicht beauftragt.
- Match `match_d0f6f630980ebfc4`, menschliche Corp gegen Runner-KI,
  8:2 Agendapunkte, Corp-Deckversion 1.1.0. Der Matchlauf ist kein Test der
  inzwischen aktualisierten Deckversion 1.3.0.
- Read-only Maintenance-API: vollständiges Bundle mit 353 Events und 179
  Runner-Entscheidungen; gezielte Detailantworten für D77 und D156 einschließlich
  HistoricalAudit, CheckpointCapture/Replay, LegalActions und Runtime-Provenance.
  Die bereits geladenen API-Antworten liegen lokal unter
  `data/local/dreff-user-match-bundle.json`,
  `data/local/dreff-user-decision-77.json` und
  `data/local/dreff-user-decision-156.json`. Diese ignorierten Dateien sind
  Arbeitsmaterial, keine dauerhaften Testfixtures.
- API-Pfade: `/api/storage/maintenance/analysis/matches/match_d0f6f630980ebfc4/bundle`
  und darunter `/decisions/77` beziehungsweise `/decisions/156`.
  Falls Arbeitsmaterial fehlt, nur die Maintenance-API verwenden; kein Zugriff
  auf SQLite oder lokale Replay-Dateien als Ersatz.
- Planungsstand: `84000cdac133596fc6c32f050e2cb5ab41a824b2`.
- [Änderungskompass](../../architecture/ai/change-compass.md),
  [Runner-Owner §8](../../architecture/ai/runner-plan-contracts.md#8-runnerconvert_run_window),
  [AI-Pflichtquellen](../../../packages/ai/AGENTS.md).

### Belegte Fehlentscheidungen und zu prüfende Gegenlinien

| Anker | Zustand und beobachtetes Verhalten | Erwartete Abwehrlinie |
| --- | --- | --- |
| D77, E143, StateVersion 142 | Zombie Stärke 4, Loony Goon Stärke 0, sechs Credits. Pump wird mit `pump_cannot_lead_to_useful_break` und `pump_required_count:4` ausgeschlossen. Zwei Hirnschaden; maximale Handgröße sinkt auf drei. | Vier Pumps zu je einem Credit, beide Schadenssubroutinen für je einen Credit brechen; Run-Ende ungebrochen lassen. |
| D156, E302, StateVersion 301 | Colonel Failure Stärke 6, Loony Goon Stärke 0, acht Credits. Derselbe Ausschluss mit `pump_required_count:6`. E303/E305/E307 zerstören Krash, Loony Goon und Cyfermaster. | Sechs Pumps zu je einem Credit und zwei Programmtrash-Subroutinen für je einen Credit brechen; nur eine Programmzerstörung und das Run-Ende zulassen. |

Kosten und Alternativen sind aus den historischen sichtbaren Zuständen und
Kartenregeln hergeleitet. Ein Engine-Gegenlauf wurde noch nicht durchgeführt.
Die erste Implementierungsaufgabe ist deshalb die Reproduktion auf aktuellem
Code und die Prüfung der vollständigen Abwehrfolgen mit echten LegalActions.
Bei D156 war Shock.r zuvor gebrochen; kein aktives Breakverbot voraussetzen.
Die Corp bestimmt das verbleibende Trashziel: zwei überlebende Programme
nachweisen, nicht die freie Wahl zweier bevorzugter Programme durch den Runner.

### Eingrenzung der Ursache

`runtime/runner-pump-viability-context.ts` bildet derzeit für
`requiredBreakSubroutines` eine gemeinsame Menge aus unmittelbaren Gefahren,
relevanten Redirects und Run-Ende-Subroutinen. Wenn deren gesamte Zahlung nach
den Pumps nicht finanzierbar ist, verwirft der Pfad die Pumpaktion. Bei Zombie
ergibt das sieben statt sechs Credits für reine Schadensabwehr; bei Colonel
Failure elf statt acht Credits für das Verhindern zweier Programmverluste.

Der vorhandene Mindestpreis für optionale Breaks greift bei dieser nichtleeren
Pflichtmenge nicht. Nur Run-Ende aus der Summe zu entfernen reicht für Colonel
Failure ebenfalls nicht: Auch alle drei Trash-Breaks zusammen wären zu teuer.

Der Runner-Vertrag erlaubt bereits Schadensabwehr trotz verlorenem Accesspfad.
Dieses Paket schließt die Lücke für bezahlbare Teilmengen und Programmverluste
innerhalb dieses Owners. Folgeprüfungen auf Reserve, Remote-Payoff und konkrete
Breakauswahl können dieselbe Linie erneut sperren und sind mitzubeobachten.

## Scope

1. Die beiden API-Captures in minimale, side-sichere Checkpoint-Fixtures mit
   Provenance überführen; historische Beobachtung von aktuellem Verhalten trennen.
2. Im bestehenden Run-Window-Pfad eine gemeinsam verwendete, typisierte
   Abwehrbewertung bilden: aktuelle ungebrochene Subroutinen, vollständige
   Pumpkosten, bezahlbare wirksame Breakmenge und verbleibende Folgen.
   Bestehende Konsequenz- und Zahlungsdienste erweitern, keine zweite Regelquote.
3. Access-Fortsetzung und aktuelle Schadensbegrenzung getrennt bewerten.
   Unbezahlbares Run-Ende-Brechen darf die Abwehr aktueller Schäden nicht
   entwerten. Teilmengen gegen unveränderte Schadensannahme vergleichen;
   wirkungslose Pumps bleiben ausgeschlossen.
4. Die gewählte Abwehrlinie an Plan, Step `convert_active_run_window`, Route
   und Encounter binden. Nach jedem Engine-Schritt mit aktuellen LegalActions,
   Restsubroutinen, Ressourcen und StateVersion neu validieren. Kein
   Pump-/Break-Pendeln und keine erneute Ausgabe bereits verbrauchter Pools.
5. Begründung im bestehenden Trace: erreichbare Schadensminderung, Kosten und
   verbleibende Folgen; Diagnosezeichenfolgen steuern keine Entscheidung.
6. Runner-Owner-Vertrag um die nachgewiesene Teilmengenbewertung ergänzen.

## Nicht im Scope

- Deckänderungen, Corp-KI, Matchup-Tuning oder allgemeine Runstart-Heuristiken.
- Kartennamen-/Match-ID-Sonderfälle, neue Chooser oder Resolver-Overrides.
- Änderung von Legalität, Kartenregeln oder Kosten zur Ermöglichung einer Linie.
- Vollständige Matchserien oder allgemeine Spielstärkeversprechen.
- Teilbreaks als Ersatz für mechanisch notwendige vollständige Breaks behandeln:
  bedingte Folgen und Full-Break-Effekte müssen vollständig mitgequotet werden.

## Akzeptanzkriterien

- [ ] Aktuelle Baseline für beide Checkpoints dokumentiert; historische
  Ausschlussursache nicht lediglich als gegenwärtiger Testfehler angenommen.
- [ ] D77: Die echte Pump-/Breakfolge verhindert beide Hirnschäden für sechs
  Credits, anschließend endet der Run. Nur die erste Pumpaktion zu testen reicht nicht.
- [ ] D156: Die echte Folge verhindert für acht Credits zwei Programmtrashes;
  zwei Programme überleben auch bei ungünstigem legalem Corp-Trashziel.
- [ ] Kontrollfälle: ausreichend Geld für vollständige Abwehr; nur für einen
  wirksamen Teilbreak; Pumps bezahlbar, aber kein folgender Break; kein aktueller
  Schaden und kein erreichbarer Accesspfad; bereits gebrochene Schadenssubroutinen.
- [ ] Zusätzliche Breakgebühren, zulässige Run-/Breaker-Pools, aktive
  Breakverbote und Full-Break-Folgeeffekte werden aus der aktuellen Quote
  berücksichtigt. Exakt auf null gequoteter Schaden erzeugt keinen Abwehrbedarf.
- [ ] Eigene Verluste durch Breakeffekte und verbleibende Subroutinen fließen
  ein; eine Teilabwehr wird nicht fälschlich als vollständige Sicherheit bewertet.
- [ ] Planinstanz, Parent, Step, Route, Executor und Action-/StateVersion-Bindung
  bleiben erhalten; keine zweite Entscheidungsautorität, keine illegalen Actions,
  kein Hidden-Info-Leak. Determinismus und Engine-StateHash bleiben intakt.
- [ ] Fehlende notwendige Quotes oder Restbindungen führen zu strukturierter
  Diagnose, nicht zu gedruckten Ersatzkosten oder einem Verhaltensfallback.

## Umsetzungshinweise und Checks

- Umsetzung nach Beauftragung in eigenem `codex/`-Worktree. Vor dem ersten
  Verhaltenspatch vollständigen AI-Preflight einschließlich Plan-/Turn-Verträgen lesen.
- Fachlicher Owner: `runner/run-window/run-window-plan-module.ts` und
  `run-window-assessment.ts`; relevante Dienste:
  `runtime/runner-pump-viability-context.ts`,
  `runtime/runner-encounter-action-exclusion.ts`,
  `runtime/current-encounter-damage.ts`, `runtime/encounter-subroutine.ts`
  sowie die vorhandene Break-/Zahlungsprojektion. Relative Pfade ab
  `packages/ai/src/`.
- Zuerst neue fokussierte Datei
  `packages/ai/src/evaluation/decision-checkpoints/match-d0f6-partial-break.test.ts`.
  Für den Engine-Folgenachweis minimale regelgleiche Zustände herstellen;
  API-PlayerViews sind kein vollständiger Engine-State. Einen konstruierten
  Mechanikfall ausdrücklich vom historischen Match-Replay unterscheiden.
- Geplanter Check:
  `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/decision-checkpoints/match-d0f6-partial-break.test.ts --maxWorkers=1`.
  Danach höchstens die angrenzende
  `src/semantic-ai-runtime-cutover-runner-safety.test.ts`.
- Mindestens 180 Sekunden äußeres Prozessfenster, laufende Sessions fortsetzen.
  Typecheck/Strukturgates bei tatsächlich berührten Typ- oder Strukturverträgen;
  kein automatischer Volltestlauf. `git diff --check` vor Paketcommit.

## Ergebnisnotiz

Planung abgeschlossen; Umsetzung und Gegenläufe noch offen. Ein Paket deckt
beide historischen Beispiele derselben Fehlerfamilie ab. Keine Codeänderung
oder Testausführung im Vorsortierauftrag.
