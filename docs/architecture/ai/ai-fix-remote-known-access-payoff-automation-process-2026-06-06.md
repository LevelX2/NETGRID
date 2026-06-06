# AI-FIX-REMOTE-1 Known Remote Access Payoff

Status: abgeschlossen

## Quelle/Vorgabe

Ausgangspunkt ist der eingefügte Nutzertext vom 2026-06-06 zum Playtest-Fund: Nach einem Zugriff auf `remote_1/root:0` kennt der Runner `Braindance Campaign`. Mit 5 Credits kann er die Karte wegen Trashkosten 7 nicht trashen. Trotzdem wird der TacticalPlan `runner.contest_remote:remote_1` fortgeführt und auf `start_run remote_1` gemappt, obwohl das Action-Level-Ranking bereits R&D und HQ höher bewertet.

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Bekanntes Remote-Positionswissen muss Remote-Contest-Pläne invalidieren oder stark abwerten, wenn der bekannte Inhalt aktuell keinen Nutzen bringt.
- Reihenfolge: Prozessartefakt, zentrale Payoff-Routine, Integration in Bewertung/Planvalidität, Regressionstests, Abschlussreview und Merge.
- In Scope: `packages/ai/src/runner-plans.ts`, fokussierte AI-Tests, TacticalPlan-/Mapping-Absicherung nur soweit für diesen Fehler nötig, Review- und Wissenspflegeartefakte.
- Nicht-Ziele: keine neue Kartensemantik, keine neuen Taktiksignale, keine Engine-, LegalAction- oder `applyAction`-Änderung, keine HQ/R&D-Vereinheitlichung in diesem Paket.
- Abnahme: Der bekannte Braindance-Fall wählt keinen zweiten Remote-Run, bezahlbarer Trash und bekannte Agenda bleiben Remote-positiv, und relevante Checks sind grün.

## Gesamtziel

Die Runner-KI darf einen Remote-Contest-Plan nicht weiterführen, wenn eigenes side-sicheres Positionswissen den Remote-Inhalt als bekannte Nicht-Agenda ohne aktuellen Payoff klassifiziert. Ein höher bewerteter Central-Run oder Economy-Plan muss dann gewinnen können.

## Annahmen

- `knownPositionMemory` ist side-sicher und enthält nur Informationen, die der Runner durch Zugriff oder öffentliche Information kennen darf.
- Pfadkosten können konservativ aus sichtbaren Breakkosten plus bekannten unrezzed ICE aus Positionswissen geschätzt werden.
- Remote-Memory gilt als unbrauchbar, sobald bestehende Invalidation-Mechanismen den Remote-Zustand als verändert markieren; bis dahin darf es Pläne abwerten.
- Bestehende HQ-/R&D-Freshness-Mechanismen bleiben unangetastet und werden nur regression-getestet.

## Nicht-Ziele

- Keine Änderung an Engine, `LegalAction`-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine neuen AI-Hints, Taktiksignale, Kartensemantik oder Kartenfreigaben.
- Keine breite Vereinheitlichung aller Central-/Remote-Access-Payoff-Modelle.
- Keine UI-Änderung.
- Kein Push und keine PR.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- TacticalPlans dürfen nur planen, priorisieren und mappen; sie erzeugen keine Legalität.
- Jede gewählte Aktion muss weiterhin aus `input.legalActions` stammen.
- Debug/Evidence darf keine gegnerische Hidden-Info offenlegen.

## Automatische Fehlerbehandlung

- Bei TypeScript- oder Testfehlern wird eng im aktuellen Paket debuggt.
- Wenn eine Payoff-Kategorie wegen fehlender Daten nicht sicher bestimmbar ist, bleibt sie `unknown` und blockiert nicht hart.
- Wenn Remote-Zustandsinvalidierung im vorhandenen Belief-State nicht ausreichend nachweisbar ist, wird nur vorhandene Invalidation respektiert und ein Follow-up dokumentiert.
- Mergekonflikte werden defensiv gelöst; beide fachlichen Intentionen bleiben erhalten, sofern kompatibel.

## Sicherheitsblocker

- Auswahl einer nicht legalen oder nicht in `input.legalActions` enthaltenen Action.
- Nutzung verdeckter gegnerischer Kartendaten.
- Offenlegung vollständiger Hidden-Zone- oder gegnerischer Kartendaten in öffentlichen Debug-/Payload-Flächen.
- Änderung an Engine-Regelvalidierung oder `applyAction`.
- Nicht auflösbarer Konflikt mit bestehenden Semantic-Runtime-Safety-Gates.

## State Machine

`preflight_process` -> `remote_payoff_core` -> `plan_mapping_guard_and_review` -> `final_verify` -> `merge_main` -> `complete`

## Paketfolge

### AI-FIX-REMOTE-1A: Prozessartefakt und Preflight

Ziel: Prozess, Worktree, Branch und Abnahmeregeln versionieren.

Done-Gate:

- Prozessartefakt existiert.
- Worktree und Branch sind sauber.
- `git diff --check` ist grün.

Commit-Vorschlag: `AI-FIX-REMOTE-1: Prozessartefakt anlegen`

### AI-FIX-REMOTE-1B: Known Remote Access Payoff

Ziel: Eine zentrale Payoff-Routine wertet aktuelle sichtbare Root-Karten und `knownPositionMemory` konsistent aus.

Done-Gate:

- `evaluateKnownRemoteAccessPayoff` klassifiziert `agenda`, `trash_affordable`, `trash_unaffordable`, `known_low_value`, `unknown` und `changed` beziehungsweise einen konservativen Unknown-Fall.
- `evaluateKnownRemoteMemoryValue`, `knownRemoteRootTrashAffordabilityPenalty` und `runnerRemoteTargetStillContestable` nutzen die Routine oder deren Ergebnis konsistent.
- Braindance mit 5 Credits blockiert/entwertet Remote; Braindance mit 7+ Credits und bekannte Agenda bleiben sinnvoll.
- Fokussierte Tests sind ergänzt.

Commit-Vorschlag: `AI-FIX-REMOTE-1: Known Remote Payoff auswerten`

### AI-FIX-REMOTE-1C: Planmapping-Guard, Review und Wissenspflege

Ziel: Fortgeführte Remote-Pläne erhalten keinen Vorrang mehr, wenn der Payoff fehlt; Ergebnis wird dokumentiert.

Done-Gate:

- Blocked/abandoned Remote-Pläne mappen nicht auf den falschen zweiten Remote-Run.
- Debug/Evidence enthält `remote_known_no_current_payoff`, `remote_root_trash_unaffordable`, `remote_memory_payoff` und vorhandene Invalidation-Hinweise, soweit lokal verfügbar.
- Final Review und Wissenslog sind aktualisiert.
- `corepack pnpm --filter @netgrid/ai typecheck`, fokussierte Vitest-Dateien und `git diff --check` sind grün.

Commit-Vorschlag: `AI-FIX-REMOTE-1: Planfortführung gegen Remote-Payoff härten`

## Verifikationsregeln

Je Codepaket:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Dateien für `runner-plans`, `tactical-plans` und `semantic-ai-runtime-cutover`, soweit vorhanden
- `git diff --check`

Final:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`
- `git status --short`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_FIX_REMOTE_KNOWN_ACCESS_PAYOFF`
- Branch: `codex/ai-fix-remote-known-access-payoff`
- Integrationsbranch: `main`
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Push, Pull Request oder Remote-Integration erfolgen nicht ohne ausdrücklichen Nutzerwunsch.
- Nur paketzugehörige Änderungen werden gestaged.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-FIX-REMOTE-1 Known Remote Access Payoff vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_FIX_REMOTE_KNOWN_ACCESS_PAYOFF auf Branch codex/ai-fix-remote-known-access-payoff.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Paketcommits für Prozess, Payoff-Code und Planmapping-/Review liegen auf `codex/ai-fix-remote-known-access-payoff`.
- Der Braindance-Regressionstest verhindert den zweiten sinnlosen Remote-Run.
- Bezahlbarer Remote-Trash und bekannte Remote-Agenda bleiben positive Remote-Fälle.
- Finale AI-Checks und `git diff --check` sind grün oder eng begründet.
- Branch ist lokal nach `main` gemerged und der Arbeits-Worktree entfernt.

## Umsetzungsergebnis

- Paket 1A hat diesen Prozess, Worktree und Branch versioniert.
- Paket 1B hat `evaluateKnownRemoteAccessPayoff` eingeführt und `runner-plans` auf die zentrale Payoff-Auswertung umgestellt.
- Paket 1C markiert bekannte Remote-Ziele ohne aktuellen Payoff im TacticalPlan-Build als `abandoned`, sodass der PlanStep nicht mehr auf einen weiteren `start_run` für dasselbe Remote gemappt wird.
- Der konkrete Playtest-Fall `Braindance Campaign` mit 5 Credits wird entwertet; `Braindance Campaign` mit ausreichenden Credits und bekannte Agendas bleiben Remote-positive Fälle.
- Es gab keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Kartenfreigaben.
