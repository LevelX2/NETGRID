# Semantic Runtime Precision & Legacy-Residual-Cleanup Process

Status: active

Quelle/Vorgabe: `docs/source/NETGRID_Codex_Folgepaket_Semantic_Runtime_Precision_Legacy_Cleanup_2026-06-27.md`

Start-Commit: `19b7fe11947dd19588de25b1df7eafcd3cf998d8`

Arbeitsbranch: `codex/semantic-runtime-precision-legacy-cleanup`

Arbeits-Worktree: `C:\Projekte\NETGRID_Semantic_Runtime_Precision_Legacy_Cleanup`

## Zielprüfung

Die Vorgabe ist für automatische sequenzielle Abarbeitung ausreichend präzise. Gesamtziel, Paketfolge, Kernartefakte, Stopper, Nicht-Ziele, erwartete Tests und Integrationsregel sind benannt. Kleine Lücken werden konservativ behandelt:

- Wenn ein Punkt auf `main` bereits erledigt ist, wird er im Folgeinventar als erledigt markiert und nicht erneut implementiert.
- Wenn vorhandene Tests einen engeren Zuschnitt nahelegen, haben fokussierte Regressionen Vorrang vor breiten Refactorings.
- Wenn ein gewünschter Präzisionsgewinn eine Engine-, LegalAction-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung erfordern würde, wird dieser Teil als Blocker oder Follow-up dokumentiert.

## Gesamtziel

Die Semantic Runtime bleibt der normale AI-Entscheidungspfad. Dieses Paket erhöht Präzision und Nachvollziehbarkeit der Semantik, begrenzt Legacy- und opt-in-Altpfade, verhindert StrategySupport aus bloßem Support-Kontext, verbessert TargetContext und Debug-Sichtbarkeit und hält den LegalActions-only-/Hidden-Info-Vertrag unverändert.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Remote-Push und Pull Request sind nicht Teil dieses Prozesses.
- Der normale Semantic-Runtime-Pfad wird nicht neu gecutovert.
- Produktive Entscheidungen dürfen weiter nur vorhandene Engine-`LegalActions` auswählen.
- Version-0 erlaubt lokale API-/Datenformatbereinigung, sofern keine aktuelle Evidence dagegen spricht.

## Nicht-Ziele

- Kein Proteus-Flächenausbau.
- Keine neuen Strategy IDs aus Kartenfamilien.
- Kein Reaktivieren von Legacy als No-Candidate-Fallback oder Debug-Wahrheit im Normalpfad.
- Keine große Kartendatenmigration ohne enges Invariant-Gate.
- Keine Engine-Regelerweiterung, keine neue LegalAction-Erzeugung und keine Hidden-Info-Projektion.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI-Module erzeugen keine Legalität.
- `applyAction`-Verträge, Replay, StateHash und Randomness bleiben unverändert.
- Semantiksignale sind Taktik-/Kontextbausteine, keine Aktionen.
- Strategieanker entstehen nur aus echten Anchor-/Payoff-/Engine-/Enabler-/Win-Condition-Evidence.
- Support-only bleibt Support-only.
- Fehlende oder unklare Semantik wird als Coverage-Gap sichtbar, nicht geraten.

## Automatische Fehlerbehandlung

- Tests rot: aktuellen Paket-Scope eng debuggen; nicht zum nächsten Paket wechseln.
- Typecheck rot: Ursache im aktuellen Paket oder in bewusst berührten Verträgen beheben.
- Unerwartete Fremdänderung: lesen, klassifizieren, nicht überschreiben.
- Fachlicher Zielkonflikt: Blocker-Report mit Removal Condition im Folgeinventar dokumentieren.
- Sicherheitsblocker: Umsetzung stoppen, keine Zwischenfrage, Blocker dokumentieren.

## Sicherheitsblocker

Der Prozess stoppt, wenn eine Änderung:

- illegale Actions auswählbar macht,
- Engine-/LegalAction-/`applyAction`-Verträge verletzt,
- verdeckte Karten- oder Gegnerinformationen in KI-Inputs, Debug, Logs, PlayerViews oder öffentliche Artefakte leakt,
- StateHash-/Replay-Determinismus bricht,
- Legacy wieder als fachliche Wahrheit des Normalpfads einführt.

## State Machine

`preflight` -> `P0_inventory` -> `P1_strategy_portfolio` -> `P2_card_ability_semantics` -> `P3_strategy_support` -> `P4_signal_invariants` -> `P5_target_context` -> `P6_doctrine_legacy` -> `P7_practical_overlay` -> `P8_tactical_plan_modularization` -> `P9_debug_reports` -> `P10_final_verify` -> `integration_preflight` -> `merged_to_main` -> `complete`

Genau ein Paket ist aktiv. Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt oder ein Blocker dokumentiert ist.

## Paketfolge

### P0. Aktuellen Stand verifizieren und Folgeinventar schreiben

Ziel: Betroffene AI-Runtime-, Semantik-, Doctrine-, Overlay-, TacticalPlan- und Doku-Dateien prüfen und ein kompaktes Folgeinventar unter `docs/reviews/ai/semantic-runtime-precision-followup-2026-06-27.md` erstellen.

Kernartefakte: Folgeinventar, geprüfter Commit, offene/erledigte Punkte, Risiken, geplante Reihenfolge.

Checks: `git diff --check`.

Done-Gate: Normalpfad, Legacy-/Fixture-/Benchmark-Pfade und opt-in-Vergleichspfade sind klar unterschieden.

Commit: `docs(ai): inventory semantic runtime precision cleanup`

### P1. Strategy-Portfolio statt erste produktive Primary gewinnt

Ziel: Produktive Strategieoptionen als Portfolio erhalten, aktive Strategie nachvollziehbar wählen und Hysterese/Blocker/Alternativen debugbar machen.

Kernartefakte: `StrategicRuntimeContext`/`StrategicIntentState`, Debug-Ausgabe, fokussierte Tests.

Checks: fokussierte AI-Tests für Strategieprofil/-runtime, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.

Done-Gate: Portfolio, Hysterese, Boardstate-Dringlichkeit und blocked/non-productive-Ausschluss sind getestet.

Commit: `feat(ai): retain semantic strategy portfolio`

### P2. CardSemanticProfile-Präzision

Ziel: card-level, ability-level, compatibility und unresolved Semantik sauber trennen.

Kernartefakte: `action-card-semantic-profiles.ts`, `action-card-semantic-join.ts`, `action-semantic-candidate.ts`, Tests.

Checks: fokussierte Action-Semantics-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Gebundene Ability erhält nur passende Fähigkeitssignale; unresolved Ability erzeugt Coverage-Gap statt starker falscher Signale.

Commit: `feat(ai): separate card and ability semantics`

### P3. StrategySupport-Ableitung härten

Ziel: StrategySupportPair nur aus qualifizierter Anchor-/Payoff-/Engine-/Enabler-/Win-Condition-Evidence erzeugen.

Kernartefakte: CardSemanticProfile-Brücke, DeckStrategyProfile-Tests, Support-/Anchor-Evidence.

Checks: fokussierte StrategySupport-/DeckProfile-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Economy/Draw/Search-Support erzeugt keine Strategie; klare Payoffs können weiter qualifizierte StrategySupportPairs erzeugen.

Commit: `fix(ai): require qualified strategy support evidence`

### P4. Signal-Katalog und Invariant-Checks

Ziel: Zu breite, verbotene oder richtungsfalsche Primärsignale lokal erkennbar machen.

Kernartefakte: lokaler Check/Report oder Vitest-Invariant, Dokumentation der erlaubten Signalklassen.

Checks: neuer/fokussierter Invariant-Test, AI-Typecheck, `git diff --check`.

Done-Gate: Verbotene alleinige Primärsignale schlagen an; compatibility/aggregation bleibt erlaubt, wenn präzise Primärsignale vorhanden sind.

Commit: `test(ai): add semantic signal invariants`

### P5. TargetProfile- und TargetContext-Qualität

Ziel: Zielaktionen erhalten konkrete side-safe TargetContext-Daten oder klare Coverage-Gaps.

Kernartefakte: `action-target-context.ts`, Candidate-Projektion, TargetProfile-Tests.

Checks: fokussierte TargetContext-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Hardware-/Resource-/Program-/Server-Zielkontexte sind side-safe; Missing Context wird nicht geraten.

Commit: `feat(ai): expose precise side-safe target context`

### P6. Doctrine-v1-Reste bereinigen und begrenzen

Ziel: Doctrine v1 bleibt nur expliziter Legacy-/Fixture-/Benchmark-Pfad und wird nicht als produktive Opening-/Runtime-Wahrheit beschrieben.

Kernartefakte: `deck-doctrine.ts`, Import-/Nutzungssuche, Tests/Doku.

Checks: Nutzungssuche, fokussierte Opening/Mulligan/Discard-Tests falls vorhanden, AI-Typecheck, `git diff --check`.

Done-Gate: produktive PlanWeight-/MulliganWeight-Nutzungen sind entfernt oder als Legacy/Benchmark klassifiziert.

Commit: `docs(ai): mark doctrine v1 as legacy benchmark path`

### P7. PracticalTacticOverlay und PracticalMicro begrenzen oder absorbieren

Ziel: Opt-in-Altpfade bleiben default-off und eindeutig Benchmark/Comparator oder werden in normale Semantic Runtime überführt.

Kernartefakte: `practical-tactic-overlay.ts`, `practical-micro-runtime.ts`, Tests.

Checks: fokussierte Overlay/Micro-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Default-Entscheidungen hängen nicht an Overlay/Micro; opt-in-Verhalten ist dokumentiert.

Commit: `docs(ai): bound practical overlay comparator paths`

### P8. TacticalPlans modularisieren

Ziel: `tactical-plans.ts` an einer echten Verantwortungsgrenze weiter reduzieren, ohne semantischen Groß-Rewrite.

Kernartefakte: neuer oder erweiterter Plan-Modulzuschnitt, bestehende TacticalPlan-Tests.

Checks: TacticalPlan-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: klare Verantwortungsgrenze, keine unbeabsichtigte Behavior-Änderung.

Commit: `refactor(ai): extract tactical plan responsibility`

### P9. Debug/Reports für Semantikpräzision

Ziel: Debug zeigt Herkunft, Binding, TargetContext, Strategieportfolio, Compatibility und Coverage-Gaps.

Kernartefakte: Debug-Builder/DetailSections, Tests.

Checks: fokussierte Debug-Tests, AI-Typecheck, `git diff --check`.

Done-Gate: Debug kann precise vs compatibility/fallback Semantik unterscheiden, ohne Hidden-Info zu leaken.

Commit: `feat(ai): report semantic precision debug details`

### P10. Tests, Typecheck und Abschlussdoku

Ziel: Paket abschließend verifizieren und Folgeinventar mit Ergebnissen, Grenzen, Tests und Replay-/Kalibrierungsfolgepunkten aktualisieren.

Kernartefakte: Folgeinventar final, ggf. CODEX_STATUS/Log nur bei relevanter Statusänderung.

Checks: `corepack pnpm --filter @netgrid/ai typecheck`, fokussierte Vitest-Läufe, bei breiter Änderung `corepack pnpm --filter @netgrid/ai test`, `git diff --check`.

Done-Gate: Tests grün oder Blocker dokumentiert, keine Engine-/LegalAction-/Hidden-Info-Vertragsänderung.

Commit: `docs(ai): finalize semantic runtime precision cleanup`

## Verifikationsregeln

- Nach jedem Paket: relevante Tests, `git diff --check`, nur paketzugehörige Dateien stagen, Commit erstellen.
- AI-Änderungen: mindestens `corepack pnpm --filter @netgrid/ai typecheck`.
- Breite Runtime-/Semantik-Änderungen: zusätzlich `corepack pnpm --filter @netgrid/ai test` oder begründeter fokussierter Ersatz.
- Final: vollständiger AI-Typecheck, relevante Testläufe, `git diff --check`, Statusprüfung im Arbeitsbranch und nach Merge auf `main`.

## Worktree-, Git- und Integrationsregeln

- Alle Paketänderungen erfolgen ausschließlich im Arbeits-Worktree.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge nach `main` genutzt.
- Kein Push, kein PR.
- Kein `git reset --hard`, kein pauschales Revert fremder Änderungen.
- Vor finalem Merge wird aktuelles `main` in den Arbeitsbranch integriert, falls `main` weitergelaufen ist.
- Der Merge nach `main` erfolgt bevorzugt per Fast-Forward; abweichender Merge-Commit nur mit dokumentierter Begründung.
- Worktree-Entfernung erst nach erfolgreichem lokalen Merge und main-Checks.

## Controller-Prompt-Kern

`/Goal Arbeite Semantic Runtime Precision & Legacy-Residual-Cleanup vollständig und sequenziell von P0 bis P10 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis-Pflichtseiten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_Semantic_Runtime_Precision_Legacy_Cleanup auf Branch codex/semantic-runtime-precision-legacy-cleanup. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung erlaubt ist. Arbeite immer nur am aktuellen Paket. Aktualisiere Paketartefakte. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Strategy-Portfolio verliert produktive Kandidaten nicht.
- ActionSemantics trennen card-level, ability-level, target-level, compatibility und unresolved sichtbar.
- StrategySupport entsteht nicht pauschal aus Support-/LineSupport-Feldern.
- Breite/legacy Signale sind nicht alleinige Primärgründe für Strategien.
- TargetContext enthält side-safe konkrete Zielinformationen oder klare Coverage-Gaps.
- Doctrine-v1 ist Legacy/Fixture/Benchmark, nicht produktives Zielmodell.
- Practical-Overlays sind default-off und klar begrenzt oder absorbiert.
- TacticalPlans sind an mindestens einer sinnvollen Grenze weiter modularisiert.
- Debug erklärt Präzision und Coverage-Gaps.
- Tests und Typecheck sind grün oder ein echter Blocker ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
