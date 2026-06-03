---
activityId: act-2026-06-02-ai027-corp-upgrades-semantics-review
status: done
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-02
startedAt: 2026-06-03
completedAt: 2026-06-03
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/ai030-corp-upgrades-semantics-review-2026-06-03.md
  - docs/reviews/ai/ai030-corp-upgrades-semantics-review-report-2026-06-03.json
  - docs/reviews/ai/README.md
checks:
  - "PASS: node scripts/check-ai030-corp-upgrades-semantics.mjs"
  - "PASS: git diff --check"
---

# AI027: Corp Upgrades Semantics Review

## Ziel

Alle aktiven/compiled Corp-Upgrade-Karten aus Classic/Originalset und Proteus sollen inventarisiert, fachlich geprüft und mit kontrollierten read-only-Taktiksignalen versehen werden. Strategieanker sollen nur dort gesetzt werden, wo ein Upgrade wirklich eine größere Corp-Decklinie trägt, wesentlich ermöglicht, einen klaren Payoff darstellt, eine Engine unterstützt oder als strategischer Schlüssel-/Remote-Defense-/Win-Condition-Baustein fungiert.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-02: `AI027 – Corp Upgrades Semantics Review`.
- Umsetzungswunsch aus Auftrag: auf `main` arbeiten, Worktree vor Beginn prüfen und sauber halten.
- Voraussetzungen:
  - AI018 / AI018c Icebreaker-Semantik ist umgesetzt und darf nicht regressieren.
  - AI019 Runner Program Semantics Review ist umgesetzt.
  - AI020 Runner Hardware Semantics Review ist umgesetzt.
  - AI021 Runner Prep Semantics Review ist umgesetzt.
  - AI022 Runner Resources Semantics Review ist umgesetzt.
  - AI023 Corp Agenda Semantics Review ist umgesetzt.
  - AI024 Corp ICE Semantics Review ist umgesetzt.
  - AI025 Corp Operations Semantics Review ist umgesetzt.
  - AI026 Corp Nodes / Assets Semantics Review ist umgesetzt.
- Wenn AI026 noch nicht umgesetzt ist, AI027 nicht mit Corp-Nodes-/Assets-Arbeit vermischen.
- Begriffsklärung aus Auftrag: Corp Upgrades inklusive Region/Sysop/Ambush; Nodes/Assets sind out of scope.
- Guide-V2-Leitplanken aus dem Auftrag:
  - Taktiksignale beschreiben Funktion, nicht Form.
  - Typ, Subtyp, Name und Thema sind Kartendaten, keine Taktiksignale.
  - Positive Effekte und Drawbacks getrennt modellieren.
  - Support ist keine Strategie.
  - Kartenfamilie ist keine Strategie.
  - Keine Strategie ohne echte Strategieanker.
  - TargetProfiles sind Zielwahlhilfen, keine Taktiksignale.
  - Taktiksignale erzeugen keine Legalität.
  - Die Engine bleibt Regelautorität.

## Scope

- Corp Upgrades aus Classic/Originalset.
- Corp Upgrades aus Proteus.
- Aktive/compiled Corp-Upgrade-Karten aus Repo-Daten ableiten, nicht Spoilerzahlen hart kodieren.
- Spoiler-Referenz aus Auftrag: Classic hat 26 Corp-Upgrades, Proteus hat 13 Corp-Upgrades.
- Abweichungen zwischen Repo-Inventar, Spoiler-Header und extrahierter Kartenliste im Report dokumentieren; maßgeblich bleibt die aktive/compiled Repo-Wahrheit.
- Zusätzlich inaktive/known Corp-Upgrade-Karten erfassen, falls sie im Spoiler oder Repo vorhanden, aber nicht active/compiled sind.
- Upgrade-Subtypen als Kartendaten/Traits im Report aufnehmen, aber nicht als Taktiksignale spiegeln.
- Upgrades in mechanische Familien einteilen, unter anderem Agenda-Steal-Tax/Delayed Score, Agenda-Difficulty-Reduction-Region, Remote-Scoring Support, Run-/Break-/Spend-Tax, Install-Capacity/Trash-Tax, ICE-Install/Rez/Temporary-Encounter, ICE-Rearrange/Concealment, Fort-Rebuild/Swap, Advancement Support, Access Reduction, Access Ambush/Punish, Trace-Credit Support, Unsuccessful-Run Economy, HQ/R&D Draw During Run und Drawback/Risk.
- Bestehende Taktiksignale aus AI018 bis AI026 zuerst prüfen und nur wiederverwenden, wenn Funktion, Wirkungsrichtung und SideScope passen.
- Neue Corp-seitige Signale nur kontrolliert ergänzen, katalogisieren, mit `sideScope: corp` versehen und korrekt als support-only oder may-anchor-fähig markieren.
- Für Strategieanker immer eindeutige `strategySupportPairs` mit `strategyId`, `role`, `evidence` und `confidence` ausgeben.
- TargetProfile V1 nur verwenden, wenn das bestehende Schema side-safe passt; sonst `candidate`, `deferred` oder `schema_gap` dokumentieren.
- Für jedes Upgrade im Report `hiddenInfoPolicy` angeben.
- Review-Dokument erzeugen: `docs/reviews/ai/ai027-corp-upgrades-semantics-review-2026-06-02.md`.
- JSON-Report erzeugen: `docs/reviews/ai/ai027-corp-upgrades-semantics-review-report-2026-06-02.json`.
- Falls vorhanden, `docs/reviews/ai/README.md` aktualisieren.

## Besonders zu prüfende Karten

- Classic: `Aardvark`, `Antiquated Interface Routines`, `Bizarre Encryption Scheme`, `Chester Mix`, `Chimera`, `Crybaby`, `Crystal Palace Station Grid`, `Dedicated Response Team`, `Dieter Esslin`, `Dr. Dreff`, `Jenny Jett`, `Jerusalem City Grid`, `Namatoki Plaza`, `New Galveston City Grid`, `Olivia Salazar`, `Omni Kismet, Ph.D.`, `Paris City Grid`, `Red Herrings`, `Rio de Janeiro City Grid`, `Roving Submarine`, `Singapore City Grid`, `Tesseract Fort Construction`, `Tokyo-Chiba Infighting`, `Turbeau Delacroix`, `Twenty-Four-Hour Surveillance`, `Washington, D.C., City Grid`.
- Proteus: `Herman Revista`, `Lesley Major`, `Lisa Blight`, `Marcel DeSoleil`, `Networked Center`, `Obfuscated Fortress`, `Panic Button`, `Pavit Bharat`, `Rasmin Bridger`, `Raymond Ellison`, `Research Bunker`, `Simon Francisco`, `Weapons Depot`.

## Nicht im Scope

- Keine fachliche Migration von Corp Nodes/Assets; diese wurden in AI026 bearbeitet.
- Keine fachliche Migration von Corp Agendas, außer Regression gegen AI023.
- Keine fachliche Migration von Corp ICE, außer Regression gegen AI024.
- Keine fachliche Migration von Corp Operations, außer Regression gegen AI025.
- Keine Runner-Karten.
- Keine vollständige LegalAction Semantic Bridge.
- Kein Planner-/Runtime-Verbrauch neuer Upgrade-Signale.
- Keine neue generische Upgrade-/Region-/Sysop-Strategie.
- Keine Entfernung von Legacy-Feldern.
- Keine Änderung am Action-Selection-Verhalten.
- Keine Plannerwirkung, ActionScore-Änderung, PlanWeight-Änderung, Engine-Änderung, Legalitätsänderung, Targeting-KI, Profil-/Default-Umschaltung oder UI-Derivationslogik außer regenerierten Inspector-/Reviewdaten.
- Keine Hidden-Info-/Visibility-Regeländerung.

## Verbotene Typ-/Subtyp-Only-Signale

- Keine neuen Signale wie `corp.upgrade`, `corp.region`, `corp.sysop`, `corp.ambush_upgrade`, `upgrade.region`, `upgrade.sysop`, `upgrade.ambush`, `upgrade.asset`, `upgrade.random`, `upgrade.city_grid`, `upgrade.region_economy`, `upgrade.remote_defense` oder `upgrade.hq_upgrade`.
- Keine card-spezifischen Signale wie `upgrade.red_herrings`, `upgrade.dr_dreff` oder `upgrade.tesseract`.
- Keine generische Strategie `corp.upgrade`, `corp.region`, `corp.sysop` oder `corp.ambush_upgrade`.
- Subtypen wie `Upgrade`, `Region`, `Sysop`, `Ambush`, `Asset` und `Random` bleiben Kartendaten, Constraints, Targeting-Facts oder Reportfelder.

## Akzeptanzkriterien

- [x] Alle aktiven/compiled Corp-Upgrade-Karten sind inventarisiert.
- [x] Alle aktiven/compiled Corp-Upgrade-Karten sind fachlich geprüft.
- [x] Vollständige Post-Review-Liste ist im JSON-Report vorhanden, nicht nur ein Delta.
- [x] Inaktive oder zusätzlich bekannte Corp-Upgrade-Karten sind, soweit vorhanden, separat erfasst.
- [x] Upgrade-Subtypen sind als Kartendaten/Traits sichtbar, aber nicht als Taktiksignale dupliziert.
- [x] Keine Runner-Karten, Corp Agendas, Corp ICE, Corp Operations oder Corp Nodes/Assets wurden fachlich migriert.
- [x] Keine neuen freien, unkatalogisierten, card-spezifischen oder Typ-/Subtyp-only-Taktiksignale existieren.
- [x] Alle neuen Taktiksignale sind im Katalog und korrekt als support-only oder may-anchor-fähig markiert.
- [x] Keine generische `corp.upgrade`-, `corp.region`-, `corp.sysop`- oder `corp.ambush_upgrade`-Strategie.
- [x] Keine Strategie aus bloßen Supportsignalen.
- [x] Keine Strategy Anchors für einfache Sysop-/Region-/Utility-Upgrades ohne klare Decklinie.
- [x] Keine kanonische strategische Rolle ohne Strategieanker.
- [x] Bei mehreren Strategieankern ist die Rollenzuordnung eindeutig.
- [x] Legacy-Felder wie `lineSupport[]` und `strategicRole[]` bleiben kompatibel, ersetzen aber nicht `strategySupportPairs`.
- [x] Keine Planner-, Engine-, Legalitäts-, Targeting-, ActionScore-, PlanWeight-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
- [x] Keine Hidden-Info-TargetProfiles.
- [x] Runner-seitig wird keine verdeckte Corp-Upgrade-Semantik offengelegt.
- [x] Region-/Sysop-/Ambush-/Asset-/Random-Subtypen bleiben Kartendaten, keine Signale.
- [x] `Red Herrings` und `Bizarre Encryption Scheme` sind als Agenda-Steal-Tax/Score-Delay geprüft.
- [x] `Washington, D.C., City Grid`, `Networked Center`, `Research Bunker` und `Weapons Depot` sind als Agenda-Difficulty-Reduction geprüft, ohne Subtyp-Signale.
- [x] `Namatoki Plaza` ist als remote capacity support mit leave-play risk geprüft.
- [x] `Crystal Palace Station Grid`, `Rasmin Bridger`, `Tesseract Fort Construction` und `Obfuscated Fortress` sind als Run-/Break-/Spend-Tax geprüft.
- [x] `New Galveston City Grid` ist als Node-/Upgrade-trash-cost tax geprüft.
- [x] `Paris City Grid` ist als trace-credit support geprüft.
- [x] `Tokyo-Chiba Infighting` ist als unsuccessful-run economy geprüft.
- [x] `Roving Submarine` ist als remote-lock/runability condition geprüft.
- [x] `Jerusalem City Grid` unterstützt Walls über Funktion: rez discount + strength bonus; `Wall` bleibt Constraint/Subtyp.
- [x] `Lisa Blight` und `Marcel DeSoleil` wiederholen Subroutinen, erzeugen aber keine direkten Damage-/Tag-Signale ohne Boardstate.
- [x] `Dr. Dreff`, `Jenny Jett` und `Pavit Bharat` modellieren successful-run or after-last-ice surprise/fort-rebuild effects.
- [x] `Omni Kismet, Ph.D.`, `Singapore City Grid` und `Herman Revista` modellieren ICE rearrange/swap/concealment.
- [x] `Lesley Major` modelliert advancement support; `Raymond Ellison` modelliert counter-to-temporary-credit conversion.
- [x] `Dedicated Response Team` modelliert tagged access meat damage.
- [x] `Dieter Esslin` modelliert access net damage.
- [x] `Turbeau Delacroix` modelliert access trace/tag.
- [x] `Crybaby` modelliert persistent link penalty, nicht trace-credit.
- [x] `Chimera` modelliert daemon trash/rig pressure.
- [x] `Simon Francisco` modelliert HQ/R&D access reduction.
- [x] `Panic Button` modelliert draw during HQ run.
- [x] `Twenty-Four-Hour Surveillance` modelliert stealth denial, nicht generic run tax.
- [x] Access-window-, successful-run-, after-last-ice-, start-of-run- und during-run-Conditions sind als Conditions dokumentiert, nicht als LegalAction-Generatoren.

## Umsetzungshinweise

- Präfixkonvention im Report dokumentieren. Bevorzugt funktionale Präfixe wie `agenda.*`, `score.*`, `remote.*`, `fort.*`, `run.*`, `access.*`, `ambush.*`, `ice.*`, `trace.*`, `tag.*`, `damage.*`, `economy.*`, `advance.*`, `setup.*`, `hq.*`, `rnd.*`, `risk.*` und `condition.*`.
- `upgrade.*` nur verwenden, wenn der bestehende Katalog diesen Präfix bereits funktional, nicht typbeschreibend, nutzt.
- Nicht wiederverwenden, wenn die Wirkungsrichtung falsch wäre, zum Beispiel runnerseitige Access-Free-Trash-, ICE-Derez- oder Trace-Defense-Signale.
- Positive Effekte und Drawbacks getrennt modellieren, besonders bei Regions, temporären ICE-/Credit-Effekten, random discard, R&D trash, temporary bits, region exclusivity und leave-play side effects.
- Remote Scoring, ICE-Tax/Glacier, Fast-Advance/Advancement, Tag/Trace/Punish, Damage/Kill/Ambush, Rig-/Daemon-/Stealth-Disruption und ICE-Rearrange/Install/Rez/Subroutine-Repeat nur als Strategieanker setzen, wenn eine passende bestehende Strategy-ID und echte Anker-Evidence vorliegen; sonst candidate/deferred dokumentieren.
- JSON-Report soll mindestens die Struktur `ai027-corp-upgrades-semantics-review-report-v1` mit `summary`, `inventory`, `clusterOverview`, `newTacticSignals`, `changedExistingTacticSignals`, `removedOrAvoidedSubtypeSignals`, `strategySupportPairs`, `targetProfileCandidates`, `hiddenInfoSafetyReview`, `deferredItems`, `postReviewAssignments` und `verification` enthalten.
- `postReviewAssignments` pro Karte soll mindestens `cardId`, `title`, `cardType`, `subtypes`, `mechanicalFamily`, `functionalEffects`, `conditions`, `risks`, `constraints`, `tacticSignals`, `strategyAnchors`, `legacyStrategicRole`, `strategySupportPairs`, `targetProfileStatus`, `targetProfileKinds`, `hiddenInfoPolicy`, `needsHumanReview`, `confidence`, `postReviewStatus` und `rationale` enthalten.
- Erwartete Hidden-Info-Policies: `corp_side_only_until_rezzed_or_accessed`, `public_when_rezzed`, `public_when_accessed`, `public_when_exposed`, `archives_access_exception` oder `schema_gap`.

## Empfohlene Checks

- [ ] `node scripts/check-ai-derived-facts.mjs --write`
- [ ] `node scripts/check-ai-derived-facts-full.mjs --write`
- [ ] `corepack pnpm build:ai-compiled-hints`
- [ ] `corepack pnpm build:ai-hint-inspector-index`
- [ ] `node scripts/check-ai-hint-compiled-index.mjs --write`
- [ ] `corepack pnpm check:ai-strategy-taxonomy`
- [ ] `corepack pnpm check:ai-compiled-hints`
- [ ] `corepack pnpm check:ai-hint-inspector-index`
- [ ] `corepack pnpm check:ai-hint-compiled-index`
- [ ] `corepack pnpm check:ai-manual-overlays`
- [ ] `corepack pnpm check:ai-hint-quality`
- [ ] `corepack pnpm check:ai-approval-consistency`
- [ ] `corepack pnpm check:ai-deck-doctrine-strategy`
- [ ] `corepack pnpm --filter @netgrid/ai test`
- [ ] `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- [ ] `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`
- [ ] Neuer oder erweiterter AI027-Invariant-Check
- [ ] `git diff --check`

## Ergebnisnotiz

Abgeschlossen am 2026-06-03 als Superseded-/Board-Cleanup.

Dieses Inbox-Paket wurde nicht erneut unter den historischen AI027-Dateinamen umgesetzt. Der Scope ist im aktuelleren `AI030 Corp-Upgrades Semantics Review` bereits erfüllt und präziser dokumentiert: 26 Originalset-Corp-Upgrades, 13 Proteus-Corp-Upgrades und 1 Testfixture sind dort inventarisiert, fachlich geprüft und zwischen Active Hints, Compiled Hints und Inspector synchronisiert.

AI030 ist der führende Artefaktstand für diesen Upgrade-Scope nach Guide V3. Der AI030-Report enthält die vollständige Post-Review-Liste, Signal-/Strategie-/TargetProfile-Prüfung, Hidden-Info-No-Effect-Flags und die kartenspezifischen Entscheidungen zu den im Paket genannten Upgrades. Eine zweite AI027-Neuausführung würde den neueren AI030-Stand duplizieren oder riskieren, ihn zu überschreiben.

Aktueller Verify-Check: `node scripts/check-ai030-corp-upgrades-semantics.mjs` ist grün mit `originalset=26`, `proteus=13`, `test=1`, `signals=17`, `inspectorCards=40`.
