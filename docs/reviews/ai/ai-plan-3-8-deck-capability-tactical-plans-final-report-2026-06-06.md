# AI-PLAN-3 bis AI-PLAN-8 DeckCapabilityProfile und capability-aware TacticalPlans - Final Report

Datum: 2026-06-06
Status: lokal umgesetzt und verifiziert
Branch: `codex/ai-plan-3-8-deck-capability-tactical-plans`
Prozessartefakt: `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md`

## Ergebnis

AI-PLAN-3 bis AI-PLAN-8 schließen die Lücke zwischen eigenem Deck als Fähigkeitsraum, TacticalPlan-Aufbau und LegalAction-Mapping. Die Semantic-AI-Runtime kann jetzt AI-intern ein redigiertes `DeckCapabilityProfile` aus eigenen, side-sicheren Deck-/Hand-/Installationsdaten bauen, dieses Profil in TacticalPlan-Builds einspeisen, Planblocker über konkrete fehlende Fähigkeiten ausdrücken und den nächsten Schritt bevorzugt über `ActionSemanticCandidate`-Semantik auf vorhandene `LegalActions` mappen.

Die gewählte Aktion bleibt unverändert eine Engine-`LegalAction`. TacticalPlans erzeugen keine Legalität, ändern keine Engine-Regeln und umgehen `applyAction` nicht.

## Paketabschluss

- AI-PLAN-3: `DeckCapabilityProfile` mit Runner-/Corp-Teilprofilen, Breaker-Inventar, Coverage-Matrix, Suchzugriff, Bank-Tools, Missing-Capabilities und redigierten Debug-Facts eingeführt.
- AI-PLAN-4: `deckCapabilities` in den TacticalPlan-Kontext und den Live-DecisionInput eingebunden; Coverage-, MU-, Credit-, Bank- und Rez-Reserve-Blocker ergänzt.
- AI-PLAN-5: Runner-Pläne unterscheiden installierte, installierbare, suchbare, nur ziehbare und im Deck fehlende Coverage und härten den sichtbaren Fallback gegen falsche Hard-Blocks.
- AI-PLAN-6: Bank-/Broker-Werkzeuge und Corp-Score-Windows als mehrzügige Planressourcen modelliert, inklusive Remote-Aufbau, Schutz, Rez-Reserve, Advance und Score.
- AI-PLAN-7: PlanStep-Mapping bevorzugt planrelevante Candidate-Semantik für Breaker Search/Install, Bank/Cashout sowie Corp Score/Rez/Protect; Label-Heuristiken bleiben konservativer Fallback.
- AI-PLAN-8: PlanMemory ist nach Decision-/Match-Kontext, Side und Profil isoliert; Runtime-Debug zeigt redigierte `deckCapabilitiesUsed`, `why_this_action` und `why_not_other_plan`.

## Sicherheitsgrenzen

- Keine Änderungen an Engine, `LegalAction`-Erzeugung, `applyAction`, Replay, StateHash oder Zufallspfad.
- Keine öffentliche Deckliste, Deckreihenfolge, Snapshot-ID oder gegnerische Hidden-Info in Debug, PlayerViews, PublicEvents oder Payloads.
- `ownDeckCapabilities` bleiben AI-intern und werden nur aus eigenen, side-sicheren Eingaben gebildet.
- Unvollständige Deck- oder Kartendaten werden konservativ als niedrige Confidence, unbekannte Kosten oder sichtbarer Fallback behandelt.
- Missing-Coverage wird nur mit vorhandenem eigenen Decksnapshot als echter Deck-Hard-Block bewertet.

## Verifikation

Arbeitsbranch-Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/deck-capabilities.test.ts src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`
- `git status --short`

Ergebnis: grün vor lokalem Merge-Vorbereitungsschritt.

## Restpunkte

- Keine neue Kartensemantik, keine neuen Taktiksignale und keine vollständige Agenda-/ICE-Planungs-KI wurden freigegeben.
- Die neuen Capability-Signale verbessern Planung und Debug, sind aber kein neues Produktiv-Gate für bislang nicht AI-abgenommene Karten.
- Weitere Qualität hängt von späteren, getrennten Semantik-/Hint- und Szenario-Paketen ab.
