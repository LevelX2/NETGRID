# AI-PLAN-3 bis AI-PLAN-8 DeckCapabilityProfile und capability-aware TacticalPlans

Status: in Umsetzung

## Quelle/Vorgabe

Ausgangspunkt ist der eingefügte Nutzertext vom 2026-06-06. Die Vorgabe bündelt die Folgearbeit nach AI-PLAN-1/2: TacticalPlans existieren live, sind aber noch zu stark aus aktuellen `LegalActions`, sichtbarem Boardstate und lokalen Heuristiken abgeleitet. Der neue Prozess schließt die Lücke zwischen eigenem Deck als Fähigkeitsraum, DeckDoctrine/Deckstrategieprofil und konkretem `PlanStep`.

Führende Vorartefakte:

- `docs/architecture/ai/ai-plan-1-tactical-plan-layer-automation-process-2026-06-05.md`
- `docs/architecture/ai/ai-plan-2-plan-memory-capability-selection-2026-06-05.md`

## Zielprüfung

Die Vorgabe ist präzise genug für direkte Umsetzung:

- Gesamtziel: Die KI nutzt ein AI-internes `DeckCapabilityProfile`, um TacticalPlans capability-aware zu bauen, fortzuführen und auf konkrete `LegalActions` zu mappen.
- Sequenz: AI-PLAN-3 bis AI-PLAN-8 ist fachlich geordnet, weil DeckCapabilityProfile und Context-Einspeisung vor Runner-/Bank-/Corp-Plänen und Debug-/Memory-Härtung kommen müssen.
- In Scope: AI-Paket, TacticalPlan-Modelle, DecisionInput-/BuildContext-Erweiterungen, fokussierte AI-Tests und kurze Review-Artefakte.
- Nicht-Ziele: keine neue Kartensemantik, keine neuen Taktiksignale, keine Engine-/Legalitätsänderung, keine öffentliche Deckliste, keine Hidden-Info-Ausweitung.
- Abnahme: final gewählte Aktion bleibt aus `input.legalActions`; `applyAction` bleibt Regelautorität; Debug zeigt nur redigierte eigene Deckfähigkeitsfacts.

## Gesamtziel

Die AI-Runtime soll nicht mehr nur sagen: Diese `LegalAction` ist gerade gut. Sie soll AI-intern erklären können: Mein Deck kann X, mein aktueller Plan braucht Y, mir fehlt Z, diese legale Aktion ist der beste nächste Schritt, um Z zu beschaffen und den Plan fortzusetzen.

## Annahmen

- `ownDeckSnapshot` und bestehende Doctrine-/Inspector-Signale reichen für ein konservatives, confidence-basiertes Profil.
- Unsichere oder unvollständige Kartendaten werden als `confidence: "low"` oder `costProfile: "unknown"` geführt, nicht geraten.
- Gegnerische verdeckte Informationen bleiben außerhalb des Profils und der Debug-Ausgabe.
- Match-spezifische PlanMemory-Isolation kann über vorhandene Decision-/Match-/State-Kontextfelder oder einen stabilen, side-sicheren Fallback-Key erreicht werden.
- Die relevanten Checks bleiben auf `@netgrid/ai` fokussiert, solange keine anderen Pakete geändert werden.

## Nicht-Ziele

- Keine neuen Kartenresolver.
- Keine neue Kartensemantik oder Taktiksignal-Ontologie.
- Keine Engine-, Shared-LegalAction- oder `applyAction`-Änderung.
- Keine öffentliche Debug-Ausgabe der Deckliste, Deckreihenfolge, privaten Snapshot-ID oder gegnerischer Hidden-Info.
- Keine vollständige Agenda- oder ICE-Planungs-KI.
- Kein Remote-Push und keine PR-Erstellung.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist oder ein Sicherheitsblocker dokumentiert wurde.
- Jede gewählte Action muss aus `input.legalActions` stammen.
- TacticalPlans dürfen nur planen, priorisieren und mappen; sie erzeugen keine Legalität.
- Alle DeckCapability-Debugfacts sind redigiert und AI-intern abgeleitet.

## Automatische Fehlerbehandlung

- Bei TypeScript- oder Testfehlern wird eng im aktuellen Paket debuggt.
- Bei fehlenden Deckdaten wird eine konservative `missingCapabilities`-/`confidence`-Einordnung ergänzt.
- Bei Konflikten mit bestehender PlanMemory- oder Semantic-Runtime-Safety werden die bestehenden Safety-Gates bevorzugt.
- Bei Mergekonflikten werden beide fachlichen Intentionen gelesen und kompatibel zusammengeführt.

## Sicherheitsblocker

- Auswahl einer nicht legalen oder nicht in `input.legalActions` enthaltenen Action.
- Nutzung verdeckter gegnerischer Kartendaten.
- Offenlegung vollständiger eigener Deckliste, Deckreihenfolge, privater Snapshot-ID oder gegnerischer Hidden-Info in öffentlichen Debug-/Payload-Flächen.
- Änderung an `applyAction`, LegalAction-Erzeugung oder Engine-Regelvalidierung.
- Nicht auflösbarer Konflikt zwischen DeckCapability-Profil und bestehenden Semantic-Runtime-Safety-Gates.

## State Machine

`preflight` -> `ai_plan_3_deck_capability_profile` -> `ai_plan_4_context_integration` -> `ai_plan_5_runner_plans` -> `ai_plan_6_bank_corp_score` -> `ai_plan_7_candidate_mapping` -> `ai_plan_8_memory_debug` -> `final_verify` -> `merge_main` -> `complete`

## Paketfolge

### AI-PLAN-3: DeckCapabilityProfile

Ziel: Die KI baut aus dem eigenen Decksnapshot ein nutzbares, AI-internes Fähigkeitsprofil.

Done-Gate:

- `DeckCapabilityProfile`, Runner-/Corp-Teilprofile, BreakerInventory, CoverageMatrix, SearchAccess, EconomyBankTools und MissingCapabilities sind typisiert.
- Ein Builder erzeugt aus side-sicheren eigenen Deck-/Hand-/Installationsdaten ein konservatives Profil.
- Debug- oder Summary-Helfer zeigen nur redigierte Facts.
- Fokussierte Tests decken Breaker-Coverage, Suchbarkeit, Bank-Tools und Redaction ab.
- `corepack pnpm --filter @netgrid/ai typecheck`, fokussierte Vitest-Dateien und `git diff --check` sind grün.

Commit-Vorschlag: `AI-PLAN-3: DeckCapabilityProfile einführen`

### AI-PLAN-4: DeckCapabilities in TacticalPlans einspeisen

Ziel: `evaluateTacticalPlans` und der Livepfad sehen optional `deckCapabilities`.

Done-Gate:

- `TacticalPlanBuildContext` oder ein AI-interner DecisionInput-Pfad trägt `deckCapabilities`.
- PlanBlocker werden um fehlende Coverage, unerreichbare Ziele, MU-/Credit-/Bank-/Rez-Reserve-Blocker ergänzt.
- Bestehende Plan-Tests bleiben grün; neue Tests zeigen DeckCapability-Nutzung als Evidence/Blocker.
- Keine öffentliche Payload-Ausweitung und keine Engine-Änderung.

Commit-Vorschlag: `AI-PLAN-4: DeckCapabilities in TacticalPlans einspeisen`

### AI-PLAN-5: Capability-aware Runner-Pläne

Ziel: `runner.obtain_breaker_coverage`, `runner.contest_remote` und `runner.opportunistic_central_run` werden capability-aware.

Done-Gate:

- `obtain_breaker_coverage` unterscheidet installiert, in Hand installierbar, über Suche erreichbar, nur ziehbar und im Deck fehlend.
- `contest_remote` kann Blocker und Subplan für fehlende Coverage ausdrücken.
- `opportunistic_central_run` behält TTL und Rückkehr zum Hauptplan.
- Tests decken mindestens Suchzugriff, Draw-only, fehlende Coverage und TTL-Grenze ab.

Commit-Vorschlag: `AI-PLAN-5: Runner-Pläne capability-aware machen`

### AI-PLAN-6: Bank-/Broker- und Corp-Score-Pläne

Ziel: Broker-/Bank-Werkzeuge und Corp-Score-Windows werden als mehrzügige Planressourcen verstanden.

Done-Gate:

- `EconomyBankTool` wird in Build-/Cashout-Plänen genutzt.
- Cashout wird bevorzugt, wenn ein aktiver Plan konkret wegen Credits blockiert ist.
- Corp-Plan `corp.create_score_window` modelliert pragmatisch Build Remote, Protect Remote, Rez Reserve, Advance und Score.
- Tests decken Bank-Aufbau, Cashout bei FundingNeed und Corp-Score-Blocker ab.

Commit-Vorschlag: `AI-PLAN-6: Bank- und Score-Pläne mehrzügig modellieren`

### AI-PLAN-7: ActionSemanticCandidate im Planmapping stärken

Ziel: PlanStep-Mapping nutzt in den planrelevanten Bereichen stärker Candidate-Semantik und weniger Labels.

Done-Gate:

- Mapping für Breaker Search/Install, Broker/Bank und Corp Score/Rez nutzt verfügbare Candidate-Felder bevorzugt.
- Label-Heuristiken bleiben nur konservativer Fallback.
- Debug/Reasoning kann erklären, warum ein Candidate zu `search_for_answer`, `install_breaker`, `cash_out_credit_bank`, `build_rez_reserve` oder Score-Schritten passt.
- Tests zeigen Candidate-priorisiertes Mapping und Fallback-Verhalten.

Commit-Vorschlag: `AI-PLAN-7: Planmapping über Candidate-Semantik stärken`

### AI-PLAN-8: PlanMemory und Debug abrunden

Ziel: PlanMemory wird match-spezifisch isoliert und Debug zeigt die neue Architektur verständlich, aber redigiert.

Done-Gate:

- PlanMemory-Key enthält Match-/Decision-/State-Kontext plus Side/Profile, soweit im AI-Paket verfügbar.
- Match- oder Context-Wechsel kann PlanMemory nicht über identische Profile/Side weiterverwenden.
- Debug enthält selectedPlan, selectedStep, planBlockers, requiredCapabilities, redigierte `deckCapabilitiesUsed`, mappedLegalActions, whyThisAction und WhyNot-Hinweise soweit lokal vorhanden.
- Tests decken Memory-Isolation und Debug-Redaction ab.

Commit-Vorschlag: `AI-PLAN-8: PlanMemory und Debug redigiert härten`

## Verifikationsregeln

Je Paket:

- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Dateien des Pakets
- `git diff --check`

Final:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/deck-capabilities.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`
- `git status --short`

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_PLAN_3_8_DECK_CAPABILITY_TACTICAL_PLANS`
- Branch: `codex/ai-plan-3-8-deck-capability-tactical-plans`
- Integrationsbranch: `main`
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Push, Pull Request oder Remote-Integration erfolgen nicht ohne ausdrücklichen Nutzerwunsch.
- Nur paketzugehörige Änderungen werden gestaged.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-PLAN-3 bis AI-PLAN-8 DeckCapabilityProfile und capability-aware TacticalPlans vollständig und sequenziell von AI-PLAN-3 bis AI-PLAN-8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAN_3_8_DECK_CAPABILITY_TACTICAL_PLANS auf Branch codex/ai-plan-3-8-deck-capability-tactical-plans.
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

- Sechs Paketcommits für AI-PLAN-3 bis AI-PLAN-8 liegen auf `codex/ai-plan-3-8-deck-capability-tactical-plans`; ein optionaler Preflight-/Artefaktcommit ist zulässig.
- Finale AI-Checks und `git diff --check` sind grün oder eng begründet.
- Review-Artefakte benennen Scope, Sicherheitsgrenzen, Checks und Restpunkte.
- Branch ist lokal nach `main` gemerged.
- Hauptworkspace ist nach Merge geprüft.
- Worktree ist entfernt.
