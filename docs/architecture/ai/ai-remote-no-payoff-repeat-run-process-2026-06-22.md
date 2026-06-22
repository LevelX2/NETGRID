# AI Remote No-Payoff Repeat Run Fix

Status: abgeschlossen

## Quelle/Vorgabe

Ausgangspunkt ist der Nutzerbefund vom 2026-06-22: Die Runner-KI führt einen Run auf ein ungeictes Remote aus, der Access endet ohne Trash, Steal oder sonstigen Fortschritt, und die nächste Runner-Entscheidung wählt direkt wieder denselben unveränderten Remote-Run. Das ist ein Planungs- und Memory-/Payoff-Problem, keine Engine-Regellogik.

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Unveränderte bekannte Remote-Ziele nach beobachtetem Access ohne aktuellen Payoff nicht unmittelbar erneut positiv bewerten.
- Reihenfolge: AIRR-0 bis AIRR-6 mit Analyse, Vertrag, Outcome-Memory, Bewertungsfix, Evidence, Regressionen und Abschluss.
- In Scope: AI-Payoff-/Outcome-Memory, Runner-RunTargetEvaluation, TacticalPlans, fokussierte Tests, kurzer Review-/Logeintrag.
- Nicht-Ziele: keine Engine-, LegalAction-, applyAction-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Abnahme: Der konkrete Repeat-Run-Fall ist testabgedeckt; sinnvolle Remote-Runs bleiben möglich; relevante AI-Checks sind grün.
- Arbeitsmodell: Worktree `C:\Projekte\NETGRID_AI_REMOTE_NO_PAYOFF_REPEAT_RUN`, Branch `codex/ai-remote-no-payoff-repeat-run`, finaler lokaler Merge nach `main`.

## Gesamtziel

Die Runner-KI soll einen bekannten unveränderten Remote-Server nach einem beobachteten Access ohne Trash, Steal oder sonstigen Fortschritt nicht direkt erneut anlaufen. Ein erneuter Run darf erst wieder sinnvoll werden, wenn side-sicher ein neuer Payoff oder eine relevante Zustandsänderung sichtbar ist.

## Annahmen

- Aktuelle PlayerView gewinnt bei Widerspruch gegen Memory.
- Ein No-Payoff-Outcome darf nur aus side-sicher sichtbaren Access-/Decision-Signalen entstehen.
- No-Payoff-Memory darf keine verdeckten Karten, privaten Payloads oder Decklisten speichern.
- Allgemeine Remote-Runs bleiben erlaubt; nur der unveränderte wiederholte No-Payoff-Fall wird abgewertet.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine Engine-Regeländerung.
- Keine Hidden-Info-Ausweitung.
- Kein globales Verbot von Remote-Runs.
- Kein Block sinnvoller Wiederholungsruns nach neuer Root, Score Threat, bezahlbarem Trash, Agenda oder neuer Access-Unterstützung.

## Controller-Invarianten

- KI nutzt nur PlayerView, LegalActions, side-sichere PublicEvents und bestehende AIInput-Felder.
- Jede KI-Auswahl bleibt eine vorhandene LegalAction.
- `applyAction`, Replay, StateHash und Randomness bleiben unverändert.
- Debug-/Evidence-Felder bleiben side-sicher und redigiert.

## Paketfolge

- AIRR-0: Analyse und rote Reproduktion des direkten Repeat-Run-Problems.
- AIRR-1: No-Current-Payoff-Vertrag und Invalidation-Regeln schärfen.
- AIRR-2: Outcome-Memory für Access ohne Fortschritt nutzen oder minimal ergänzen.
- AIRR-3: Bewertungslogik gegen direkte Wiederholung desselben unveränderten Remotes härten.
- AIRR-4: Debug-/Evidence-Oberfläche side-sicher prüfen.
- AIRR-5: Breitere Regressionen für sinnvolle Remote-Runs und Invalidationsfälle.
- AIRR-6: Abschlussdokumentation, finale Checks, lokaler Merge nach `main`.

## Verifikationsregeln

Pakete führen fokussierte Vitest-Dateien, `corepack pnpm --filter @netgrid/ai typecheck` soweit passend und immer `git diff --check` aus. Der finale Abschluss wiederholt die relevanten AI-Checks.

## Sicherheitsblocker

Blocker sind jede Nutzung verdeckter gegnerischer Kartendaten, eine Auswahl außerhalb von `input.legalActions`, eine Änderung an Engine-/StateHash-/Randomness-Verträgen oder ein Debug-/Payload-Leak privater Karteninformationen.

## Umsetzungsergebnis

- `memory/remote-access-outcome` leitet aus side-sicheren PublicEvents einen No-Progress-Remote-Access-Status ab, wenn derselbe bekannte Remote-Root seit `start_run`/`access_card` unverändert blieb und weder `trash_accessed_card` noch `steal_agenda` folgte.
- `RunnerRunTargetEvaluation` nutzt diesen Status pro Remote-Ziel als Fallback-Memory, stuft den Run als `declined_trash_memory_active` ein und gibt eine harte Score-Penalty.
- `TacticalPlans` übernehmen die side-sicheren Marker `known_remote_no_current_payoff` und `repeated_remote_no_progress_suppressed`, sodass Plan-Fortschreibung Remote 1 nicht mehr über bessere zentrale Ziele hebt.
- Bekannte Remote-Agendas, neu veränderte Remotes und aktuell unbekannte Roots bleiben nicht durch den Repeat-Run-Guard blockiert.
- Keine Engine-Regeländerung, keine neue LegalAction-Erzeugung und keine Änderung an `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Verträgen.
