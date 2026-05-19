---
activityId: act-2026-05-18-runner-ai-shell-traders-unused
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget: V1.9.12 follow-up / Runner AI card usage
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/input-dto.ts
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "Shell Traders"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
relatedActivities:
  - act-2026-05-18-runner-ai-resource-economy-plan
  - act-2026-05-17-runner-two-turn-rig-economy-plan
  - act-2026-05-19-shell-traders-missing-prepare-action
---

# Runner-KI: The Shell Traders nach Installation tatsächlich nutzen

## Ziel

Die Runner-KI soll installierte `The Shell Traders` nicht nur ausspielen, sondern die legalen Shell-Traders-Aktionen sinnvoll nutzen: Programm-/Hardwareziel vorbereiten, Shell-Counter reduzieren und die verzögerte kostenlose Installation als Setup-/Rig-Plan verstehen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-18: Die Runner-KI hat seit längerer Zeit zwei `The Shell Traders` ausgespielt, aber keine der beiden Kopien je verwendet. Vermutung: Die KI versteht den Effekt nicht oder priorisiert ihn nie.
- Folgebeobachtung vom 2026-05-19: Im menschlichen Spiel erschien nach Installation von `The Shell Traders` trotz Programm-/Hardwarekarten in der Hand kein Aktionsbutton. Das ist als vorgelagerter Karten-/LegalAction-/UI-Hotfix in `act-2026-05-19-shell-traders-missing-prepare-action` geschnitten; diese KI-Activity soll erst danach bewertet werden.
- Gemeinter Kartentitel im Workspace: `The Shell Traders` (`onr_v1_176_the-shell-traders`).
- `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/shell-traders-completion-review.md` dokumentiert eigentlich: Runner-KI bevorzugt Shell-Traders-Set-Aside-LegalActions und beantwortet verpflichtende Shell-Counter-Choices deterministisch.
- `packages/ai/src/index.ts` enthält Shell-Traders-Sonderbewertung für `trigger_ability` mit `shellTradersAbility: "set_aside_from_grip"` und `"remove_shell_counter"`.
- `packages/ai/src/index.test.ts` deckt einen synthetischen LegalAction-Fall ab, in dem `The Shell Traders` gegenüber Basic Credit gewählt wird, aber nicht zwingend einen längeren realen Spielzustand mit zwei installierten Shell-Traders-Kopien, Handzielen, konkurrierenden Plänen und späterer Counter-Nutzung.
- Verwandte erledigte Activity: `act-2026-05-18-runner-ai-resource-economy-plan` hat installierte Economy-`trigger_ability`-Aktionen generisch in `recover_economy` gehoben, Shell Traders ist aber kein normaler Economy-Pool und braucht einen Setup-/Rig-Plan.

## Scope

- Reproduzieren oder per fokussiertem AI-Fixture modellieren: Runner hat zwei installierte `The Shell Traders` und mindestens ein sinnvolles Programm-/Hardwareziel in der Grip; eine Shell-Traders-Prepare-LegalAction ist legal, wird aber nicht gewählt.
- Nach Abschluss von `act-2026-05-19-shell-traders-missing-prepare-action` voraussetzen beziehungsweise prüfen, dass passende Shell-Traders-LegalActions und UI-Aktionsbuttons existieren.
- Falls LegalActions vorhanden sind: Runner-KI so anpassen, dass Shell-Traders-Prepare als `build_rig`-/Setup-Investment bewertet wird und nicht dauerhaft gegen Draw, Basic Credit, Runs oder weitere Installationen verliert.
- Mehrere installierte Shell-Traders-Kopien berücksichtigen, ohne mehrere sinnlose Vorbereitungen ohne Zielnutzen zu erzwingen.
- Bereits beiseitegelegte Shell-Karten und `remove_shell_counter`-Aktionen so bewerten, dass die KI die vorbereitete Installation auch aktiv beschleunigt, wenn genug Credits und kein höherwertiger Sofortplan anliegen.
- Debug-/Evidence-Ausgabe ergänzen oder prüfen, damit sichtbar wird, warum Shell Traders gewählt oder abgelehnt wurde.

## Nicht im Scope

- Keine Änderung am bestätigten Kartenvertrag von `The Shell Traders`, sofern die Engine-LegalActions korrekt sind.
- Keine Hidden-Info-Auswertung aus Korp-Sicht und kein Zugriff auf FullState jenseits der AI-Inputs.
- Keine neue allgemeine Delayed-Install-Strategie für alle künftigen Karten; dieses Paket darf aber einen kleinen wiederverwendbaren Setup-Intent vorbereiten.
- Keine Änderung an Shell-Counter-Regeln, MU-Choice, Auto-Install, Replay oder StateHash ohne konkreten Engine-Bug.
- Keine pauschale Regel, Shell Traders immer zu verwenden. Die KI soll sinnvolle Zielkarten und aktuelle Lage berücksichtigen.

## Akzeptanzkriterien

- [x] Ein AI-Test oder Engine+AI-Fixture reproduziert den Nutzerbefund mit zwei installierten `The Shell Traders`: Vor dem Fix wird keine sinnvolle Shell-Traders-Aktion gewählt oder die Lücke ist eindeutig erklärt.
- [x] Bei vorhandenem legalem Programm-/Hardwareziel wählt die Runner-KI mindestens eine Shell-Traders-Prepare-Aktion gegenüber Basic Credit/Draw, wenn kein sichtbar höherwertiger Sofortplan anliegt.
- [x] Wenn bereits eine Karte mit Shell-Countern beiseitegelegt ist, bewertet die Runner-KI `remove_shell_counter` als sinnvollen Fortschritt und kann die Installation beschleunigen.
- [x] Die Entscheidung bleibt ausschließlich LegalAction-basiert; `applyAction` muss weiterhin Side, ActionId, Timing, Kosten, Ziel und StateVersion revalidieren.
- [x] Mehrere installierte Shell-Traders-Kopien führen nicht zu nichtdeterministischem oder offensichtlich redundantem Verhalten.
- [x] Debug/Evidence nennt side-sicher, ob Shell Traders wegen fehlendem Ziel, niedrigem Zielwert, Konkurrenzplan oder legaler Aktion gewählt/abgelehnt wurde.
- [x] Bestehende Shell-Traders-AI-Tests, Runner-Economy-Tests und relevante Runner-Plan-Regressionen bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil es um kartenbezogene KI-Nutzung eines bereits implementierten Kartenvertrags geht.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts`: bestehende Shell-Traders-Sonderbewertung für `trigger_ability`.
  - `packages/ai/src/runner-plans.ts`: prüfen, ob Shell-Traders-Aktionen in `build_rig` oder einen eigenen Setup-/Delayed-Install-Plan aufgenommen werden müssen.
  - `packages/ai/src/index.test.ts`: synthetischen Test um einen realistischeren Multi-Turn-/zwei-Kopien-Fall ergänzen.
  - `packages/engine/src/index.test.ts`: nur falls LegalActions oder Payloads im echten Zustand fehlen.
- Der vorhandene Test `uses The Shell Traders LegalActions and mandatory Shell-counter choices` ist zu eng: Er beweist nur, dass eine isolierte Prepare-LegalAction Basic Credit schlagen kann.
- Erst bearbeiten, wenn `act-2026-05-19-shell-traders-missing-prepare-action` erledigt oder eindeutig als nicht blockierend widerlegt ist.

## Ergebnisnotiz

Abgeschlossen. Shell-Traders-`trigger_ability`-Aktionen werden in der Runner-Plan-KI als `build_rig`-/Delayed-Install-Fortschritt klassifiziert, statt nur im Baseline-Scoring zu existieren oder als Economy-Payout behandelt zu werden. Die AI-DTO-Allowlist enthält die benötigten side-sicheren Shell-/Target-Payloadfelder. Neue Engine+AI-Fixtures prüfen zwei installierte Shell-Traders-Kopien mit Grip-Zielen gegen Basic Credit sowie vorbereitete Karten mit `remove_shell_counter` als Finish-Schritt. Debug/Evidence enthält side-sichere Shell-Traders-Gründe und keine FullState-/PrivatePayload-Daten.
