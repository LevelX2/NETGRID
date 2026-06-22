# AI Activated Card Tag Semantics Process 2026-06-22

## Status

`tag_sem_3_projection_implementation_done`

Arbeitsbranch: `codex/ai-activated-card-tag-semantics`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_ACTIVATED_CARD_TAG_SEMANTICS`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Ausgangspunkt ist der Playtest-Befund vom 2026-06-22: Die Runner-KI hatte 4 Tags und ein installiertes `Danshi's Second ID`, nutzte die Karte aber nicht. Die anschließende Analyse zeigte:

- `Danshi's Second ID` war als LegalAction vorhanden.
- Die LegalAction war `activated_card_ability`, nicht `remove_tag`.
- `ActionSemanticCandidate` projizierte die Aktion als `card_ability.unknown` mit `ability_unresolved`.
- Die Semantic Runtime erkennt `tag_removal` aktuell vor allem über `action.type === "remove_tag"`.
- Die KI wählte stattdessen `gain_credit` im Scope `basic_economy_draw`.

Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Alle vergleichbaren legalen Runner-Kartenaktionen mit Tag-Entfernungs- oder Tag-Vermeidungswirkung sollen generisch erkannt, semantisch korrekt projiziert und in der KI-Auswahl angemessen bewertet werden.
- Reihenfolge: Preflight, Inventur vergleichbarer Effekte, generischer Semantikvertrag, Implementierung der Projektion, Runtime-Scoring/Plan-Mapping, Regressionen, Review/Wissenspflege, finaler Green-Lauf und lokaler Merge.
- In Scope: `packages/ai/src/action-semantic-candidate.ts`, `packages/ai/src/actions/**`, `packages/ai/src/index.ts`, Runtime-/Decision-Tests, relevante AI-Hints nur falls Drift oder fehlende Rollen gefunden werden, Review-Artefakte.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Karten-Sonderlogik nur für Danish, keine UI-Änderung, kein neuer Kartenpool.
- Abnahme: `Danshi's Second ID` wird bei sichtbaren Tags als `tag.remove`/`tag_removal` erkannt und gewinnt gegen einfache Economy-Aktionen; weitere vorhandene Tag-Cleanup-Karten werden geprüft und entweder abgedeckt oder als begründeter Follow-up-Gap dokumentiert.
- Branch-/Worktree-Erwartung: eigener Branch `codex/ai-activated-card-tag-semantics`, final lokal nach `main`.

Konservative Annahme: Die Lösung darf nur aus `LegalActions`, sichtbarer PlayerView, öffentlichen CardImplementation-/Hint-Daten und side-safe Kartenmetadaten ableiten. Sie darf keine verdeckten Gegnerinformationen lesen und keine Legalität erzeugen.

## Gesamtziel

Die KI soll aktivierte oder ausgelöste Kartenfähigkeiten nicht als `card_ability.unknown` behandeln, wenn ihre Wirkung aus side-safe Engine-/Kartenmetadaten klar als Tag-Entfernung, Tag-Cleanup oder Tag-Vermeidung erkennbar ist.

Der Fix ist grundsätzlich:

```text
LegalAction bleibt einzige Aktionsquelle.
CardImplementation-/Hint-/Payload-Metadaten werden read-only zur semantischen Projektion genutzt.
Runner-Kartenaktionen mit remove_tags/remove_tag/clear_tags/tag_clear_support werden in ActionSemanticCandidate als tag.remove beziehungsweise tag-prevention-support klassifiziert.
Die Semantic Runtime behandelt diese Kandidaten im Scope tag_removal, nicht als basic_install oder card_ability.unknown.
Scoring und TacticalGoal-Fit bewerten echte Tag-Entfernung proportional zu sichtbarer Tag-Gefahr und erwarteter Tag-Reduktion.
```

## Annahmen

- `activated_card_ability` enthält bei CardImplementation-Aktionen genug source binding (`cardId`, `sourceDefinitionId` oder sichtbare Source Card) für side-safe Zuordnung.
- CardImplementation-Definitionen sind öffentliche Regelmetadaten und dürfen für Semantikprojektion gelesen werden.
- AI-Hints sind unterstützend, aber nicht alleinige Autorität, weil der Engine-Effektvertrag führend ist.
- Tag-Vermeidungs-Effekte ohne aktuell vorhandene Tags sind support-only und dürfen nicht blind gegenüber akuten Economy-/Run-Plänen priorisiert werden.
- Falls ein Effekt mehrere Wirkungen kombiniert, wird nur der sichere Tag-Cleanup-Anteil bewertet; unbekannte Zusatzwirkungen bleiben konservativ.

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`, außer ein enger Test beweist, dass side-safe Metadaten für vorhandene LegalActions fehlen und die Änderung ausdrücklich im Prozess dokumentiert wird.
- Keine neue LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, AI-Inputs, Debug, Logs, Reports, Reconnect-Payloads oder Simulationstraces.
- Keine konkrete Danish-Sonderregel als Endzustand.
- Keine produktive Spezialgewichtung einzelner CardIds.
- Keine UI-Änderung.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- AI wählt weiterhin ausschließlich Actions aus `input.legalActions`.
- Action-Semantik ist Projektion, nicht Regelautorität.
- Engine/CardImplementation bleiben die Regelquelle.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert.
- Karten mit vergleichbaren Effekten werden systematisch gesucht; Findings werden klassifiziert als abgedeckt, nicht betroffen, Blocker oder Follow-up.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktiven Paket eingegrenzt und eng behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Wenn CardImplementation-Metadaten für eine generische Projektion nicht zuverlässig zugänglich sind, wird zuerst eine read-only Adapter-/Descriptor-Schicht geprüft.
- Wenn eine Karte nur über Hidden-Info oder unklare Zielwahl klassifizierbar ist, bleibt sie `unknown` und wird dokumentiert.
- Wenn ein Fix mit bestehenden Semantic-Runtime-Safety-Gates kollidiert, stoppt der Prozess mit Blocker-Report.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus `input.legalActions` stammt;
- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Replay, StateHash oder Randomness beeinflusst würden;
- Debug-/Trace-/Reportdaten verdeckte Gegnerinformationen leaken;
- die Lösung nur per CardId-Sonderfall für `Danshi's Second ID` möglich wäre;
- ein Multi-Effect ohne sichere Projektion produktiv überbewertet werden müsste.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> tag_sem_0_process_preflight
  -> tag_sem_1_effect_inventory
  -> tag_sem_2_semantic_contract
  -> tag_sem_3_projection_implementation
  -> tag_sem_4_runtime_scoring_and_mapping
  -> tag_sem_5_regression_matrix
  -> tag_sem_6_review_and_knowledge
  -> final_green
  -> merge_to_main
  -> complete
```

## Ausführungsstand

### AI-TAG-SEM-0 abgeschlossen

Datum: 2026-06-22

- Arbeits-Worktree angelegt: `C:\Projekte\NETGRID_AI_ACTIVATED_CARD_TAG_SEMANTICS`
- Arbeitsbranch angelegt: `codex/ai-activated-card-tag-semantics`
- Prozessartefakt aus dem Hauptworkspace in den Arbeitsbranch übernommen.
- Hauptworkspace-Status klassifiziert:
  - `packages/ai/src/belief-state.ts`, `packages/ai/src/belief-state.test.ts` und `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md` enthalten vorbestehende HQ-Root-/HQ-Hand-Memory-Änderungen und bleiben fremd/unberührt.
  - `docs/architecture/ai/ai-activated-card-tag-semantics-process-2026-06-22.md` war vorbereitendes Prozessartefakt und wurde in diesen Arbeitsbranch übernommen.
- `AGENTS.md`, lokale Agent-Ergänzung aus dem Hauptworkspace, NETGRID-Wissensbasis, `release-implementation-agent`, `card-enablement-ai-knowledge-agent` und dieses Prozessartefakt wurden gelesen.
- Checks:
  - `git status --short --branch`: nur das neue Prozessartefakt im Arbeits-Worktree vor Commit.
  - `git diff --check`: grün.

### AI-TAG-SEM-1 abgeschlossen

Datum: 2026-06-22

- Inventar angelegt: `docs/reviews/ai/ai-activated-card-tag-semantics-inventory-2026-06-22.md`
- Vergleichbare aktive `remove_tags`-Fälle:
  - `Danshi's Second ID`: `activated_card_ability`, bis zu 3 Tags, Source-Trash-Kosten.
  - `Nomad Allies`: `activated_card_ability`, 1 Tag, 1 Credit, zusätzlich Tag-Vermeidung.
  - `Open-Ended Mileage Program`: `play_event`, 1 Tag, optionale Rücknahme-Choice.
  - `Total Genetic Retrofit`: `play_event`, alle Tags, zusätzliche nächste-Tag-Vermeidung.
- Support-only-Fälle:
  - `Armadillo` und `Drifter`: Hosted Credits mit `usableFor: ["remove_tags"]`, keine eigene Tag-Entfernungsaktion.
  - `Fall Guy`, `Nasuko Cycle`, `Leland`, `Wilson` und `Expendable Family Member`: Tag-Vermeidung, keine akute Tag-Entfernung.
- Schlussfolgerung: Der Folgefix muss generisch an side-safe CardImplementation-/Payload-Metadaten ansetzen; AI-Hints sind unterstützend, aber nicht alleinige Autorität.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`: grün, 1 Datei / 5 Tests.
  - `git diff --check`: grün.

### AI-TAG-SEM-2 abgeschlossen

Datum: 2026-06-22

- Semantikvertrag angelegt: `docs/architecture/ai/ai-activated-card-tag-semantics-contract-2026-06-22.md`
- Vertragliche Kernentscheidung:
  - `ActionSemanticCandidate` darf eine side-safe `ActionTagEffectProfile`-Struktur tragen.
  - `remove_tags` auf Runner wird bei sicher gebundener LegalAction/CardImplementation-Quelle als `tag.remove` und akutes `tag_removal` projiziert.
  - `avoid_tag`, `avoid_next_tag` und Hosted-Credits für `remove_tags` bleiben support-only, solange keine aktuelle Tag-Entfernungs-LegalAction sichtbar ist.
  - AI-Hints sind Evidence, nicht Autorität.
  - Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Checks:
  - `git diff --check`: grün.

### AI-TAG-SEM-3 abgeschlossen

Datum: 2026-06-22

- `ActionSemanticCandidate` erweitert:
  - optionale `tagEffectProfile`-Projektion.
  - optionale `visibleSourceDefinitionsByInstanceId`-Build-Map für side-safe SourceDefinition-Bindung aus eigener PlayerView.
- Neue Projektion: `packages/ai/src/actions/tag-effect-semantics.ts`
  - BasicAction `remove_tag` erhält ein Tag-Cleanup-Profil.
  - `activated_card_ability`/`play_event` mit sicherem `remove_tags`-Descriptor werden als `tag.remove` projiziert.
  - Tag-Vermeidung und Tag-Clear-Credit-Support bleiben support-only.
- Runtime-Bridge erweitert `buildActionSemanticCandidates` mit eigenen sichtbaren Karten aus `playerView.own`.
- Regressionen ergänzt in `packages/ai/src/action-semantic-candidate.test.ts`.
- Checks:
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts`: grün, 1 Datei / 5 Tests.
  - `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`: grün, 1 Datei / 16 Tests.
  - `corepack pnpm --filter @netgrid/ai typecheck`: grün.
  - `git diff --check`: grün.

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `AI-TAG-SEM-0` | Prozessartefakt und Preflight | Worktree/Branch sauber; bestehende fremde Änderungen klassifiziert; Prozessartefakt committed; `git diff --check` grün | `docs(ai): define activated card tag semantics process` |
| `AI-TAG-SEM-1` | Inventur vergleichbarer Karten/Effekte | Liste aller relevanten `remove_tags`, `remove_tag`, `clear_tags`, `avoid_tags`, `defense.tag_clear_support` Karten und LegalAction-Formen liegt vor | `docs(ai): inventory tag cleanup card actions` |
| `AI-TAG-SEM-2` | Generischer Semantikvertrag | Vertrag definiert, wie CardImplementation-/Hint-/Payload-Metadaten `tag.remove`/Tag-Support-Projektionen erzeugen | `docs(ai): specify tag cleanup action semantics` |
| `AI-TAG-SEM-3` | Projektion implementieren | `activated_card_ability`/`trigger_ability` mit sicherem Tag-Cleanup werden generisch als Tag-Semantik projiziert; Danish-Repro ist semantisch kein `card_ability.unknown` mehr | `feat(ai): project tag cleanup card abilities` |
| `AI-TAG-SEM-4` | Runtime-Scoring und Plan-Mapping | Semantic Runtime routet passende Kandidaten in `tag_removal`; Scoring berücksichtigt sichtbare Tags und erwartete Reduktion | `fix(ai): rank activated tag cleanup actions` |
| `AI-TAG-SEM-5` | Regression-Matrix | Danish und weitere betroffene Karten/LegalAction-Formen haben fokussierte Tests; nicht betroffene Karten bleiben neutral | `test(ai): cover activated tag cleanup decisions` |
| `AI-TAG-SEM-6` | Review und Wissenspflege | Final Review, Prozessabschluss, Wissens-/Log-Update bei dauerhaftem Vertrag | `docs(ai): review activated card tag semantics` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf und lokaler Merge | relevante AI- und Engine-Checks, Typecheck, `git diff --check`, lokal nach `main` integriert, Worktree entfernt | `docs(ai): record activated card tag semantics final green` |

## Paketdetails

### AI-TAG-SEM-0: Prozessartefakt und Preflight

Ziel: Prozess, Worktree, Branch und Abnahmeregeln versionieren.

Arbeit:

- Hauptworkspace-Status prüfen.
- Falls `packages/ai/src/belief-state.ts` oder andere Dateien bereits geändert sind, diese als fremde/unrelated Änderungen klassifizieren und nicht anfassen.
- Worktree `C:\Projekte\NETGRID_AI_ACTIVATED_CARD_TAG_SEMANTICS` auf Branch `codex/ai-activated-card-tag-semantics` anlegen.
- Prozessartefakt in den Arbeitsbranch übernehmen.
- Relevante Agenten- und Wissensvorgaben lesen.

Checks:

```bash
git status --short
git diff --check
```

### AI-TAG-SEM-1: Inventur vergleichbarer Karten/Effekte

Ziel: Nicht nur `Danshi's Second ID` fixen, sondern alle vergleichbaren Fälle erfassen.

Arbeit:

- Suche in `packages/engine/src/card-implementations/**` nach:
  - `kind: "remove_tags"`
  - `remove_tag`
  - `usableFor: ["remove_tags"]`
  - Tag-Vermeidungs-/Tag-Cleanup-Effekten.
- Suche in `data/ai/ai-card-hints-active.json` und `data/ai/ai-card-hints-compiled.json` nach:
  - `tag_removal`
  - `clear_tags`
  - `remove_tags`
  - `avoid_tags`
  - `defense.tag_clear_support`.
- Für jede Karte dokumentieren:
  - CardId/Titel
  - Effektfamilie
  - LegalAction-Typen im aktuellen Engine-Pfad
  - ob aktuell semantisch als `tag.remove`, support-only oder unknown projiziert
  - ob produktive Runtime-Entscheidung betroffen ist.
- Muss mindestens prüfen: `Danshi's Second ID`, `Total Genetic Retrofit`, `Open-Ended Mileage Program`, `Armadillo Armored Road Home`, `Drifter Mobile Environment`, weitere gefundene Karten.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts
git diff --check
```

### AI-TAG-SEM-2: Generischer Semantikvertrag

Ziel: Vor Codeänderung festlegen, welche Metadaten die AI lesen darf und wie sie klassifiziert.

Vertrag:

- `remove_tags`-Effekt auf Runner in einer legalen Runner-Aktion wird als `tag.remove` projiziert, wenn Quelle und Timing side-safe gebunden sind.
- `remove_tag`-LegalAction bleibt der bestehende einfachste Pfad.
- Karten, die nur zukünftige Tags vermeiden, werden nicht automatisch als akutes `tag_removal` gewertet, können aber Tag-Support-Signale behalten.
- Mehrfachwirkung wird nicht überschätzt: Tag-Cleanup-Bonus hängt an sichtbaren aktuellen Tags und sicherem erwarteten Reduktionswert.
- Projektion darf `ActionSemanticCandidate.semanticActionType`, `strategySupport`, `conditions`, `constraints` oder eine geeignete neue side-safe Zusatzstruktur nutzen; sie darf keine Runtime-Action erzeugen.

Kernartefakte:

- Prozessartefakt aktualisieren.
- Bei Bedarf eine kleine Dokumentation unter `docs/reviews/ai/` oder `docs/architecture/ai/`.

Checks:

```bash
git diff --check
```

### AI-TAG-SEM-3: Projektion implementieren

Ziel: `activated_card_ability` und `trigger_ability` mit sicherem Tag-Cleanup werden semantisch korrekt.

Arbeit:

- Bestehende Action-Semantic-Pipeline lesen:
  - `packages/ai/src/action-semantic-candidate.ts`
  - `packages/ai/src/actions/basic-action-semantics.ts`
  - `packages/ai/src/actions/action-card-semantic-join.ts`
  - `packages/ai/src/actions/action-source-binding.ts`
  - `packages/ai/src/actions/action-cost-timing.ts`
- Einen generischen Adapter bauen oder erweitern, der aus LegalAction-Source und CardImplementation-/Hint-Metadaten Tag-Cleanup erkennt.
- `Danshi's Second ID` darf nur als Testfall auftauchen, nicht als hartcodierte Bewertungsregel.
- `ActionSemanticCandidate` für Danish muss danach sinngemäß `tag.remove` oder einen eindeutig auf Tag-Cleanup gemappten Typ haben und nicht mehr `card_ability.unknown`.
- Bei bestehenden `remove_tag`-Actions darf kein Verhalten brechen.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-TAG-SEM-4: Runtime-Scoring und Plan-Mapping

Ziel: Semantisch erkannte Tag-Cleanup-Karten werden im echten `chooseRunnerAction` angemessen gewählt.

Arbeit:

- `semanticRuntimeScopeForAction` so erweitern, dass Kandidaten mit Tag-Cleanup-Semantik in `tag_removal` fallen.
- `semanticRuntimeRunnerScoreComponents` und Legacy-/Fallback-Scoring so prüfen, dass nicht nur `action.type === "remove_tag"` den Tag-Bonus erhält.
- Erwartete Tag-Reduktion generisch bestimmen, soweit side-safe:
  - aus `removeTagAmount`
  - aus CardImplementation-Effekt `remove_tags`
  - aus Hint-/Effect-Metadaten nur konservativ.
- Kosten berücksichtigen:
  - Click-Kosten
  - Credit-Kosten
  - Trash-/Tap-/Self-trash-Kosten
  - verbleibende Tags.
- Bei 4 Tags und installiertem Danish soll die KI Danish gegenüber `gain_credit` priorisieren, wenn die Karte legal ist.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-TAG-SEM-5: Regression-Matrix

Ziel: Der Fix bleibt generisch und deckt vergleichbare Karten ab.

Pflichttests:

- Repro: Runner mit 4 Tags, 1 Credit, installiertem `Danshi's Second ID`; KI wählt die aktivierte Kartenfähigkeit.
- Kandidatentest: Danish-Kandidat ist nicht `card_ability.unknown`.
- Gegenprobe: Ohne Tags wird Danish nicht blind gegenüber klar besseren Economy-/Setup-Aktionen priorisiert.
- Bestehender `remove_tag`-Pfad bleibt unverändert und nutzt weiter `tag_removal`.
- Mindestens eine weitere gefundene vergleichbare Karte wird getestet oder mit begründeter Nicht-Betroffen-Klassifikation dokumentiert.
- Tag-Vermeidung ohne aktuelle Tags bleibt support-only, wenn keine akute Tag-Gefahr im LegalAction-Kontext sichtbar ist.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-coverage.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AI-TAG-SEM-6: Review und Wissenspflege

Ziel: Umsetzung, Grenzen und Nachweise dokumentieren.

Arbeit:

- Final Review unter `docs/reviews/ai/ai-activated-card-tag-semantics-final-report-2026-06-22.md` anlegen.
- Prozessartefakt auf realen Abschlussstand aktualisieren.
- Wissensbasis/Log ergänzen, wenn der generische Vertrag dauerhaft relevant ist.
- Inventur-Ergebnis und Rest-Gaps festhalten.

Checks:

```bash
git diff --check
```

### FINAL-GREEN

Pflichtchecks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
git status --short
```

Wenn der vollständige AI-Testlauf wegen bekannter, nicht paketbezogener Baseline rot ist, fokussierte Tests und Typecheck ausführen, Baseline-Abweichung mit konkreten Testnamen dokumentieren und nicht als grün behaupten.

## Verifikationsregeln

- Nach jedem Codepaket paketbezogene Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`, soweit Baseline dies erlaubt.
- Wenn Dateien außerhalb `packages/ai` geändert werden, betroffene Paketchecks ergänzen.
- Kein Test darf durch `skip`, `only` oder schwächere Assertions grün gemacht werden.
- Engine-Tests ergänzen nur, wenn der Prozess eine Engine-Metadatenlücke sicher feststellt.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für finalen lokalen Merge.
- Bestehende uncommitted Änderungen im Hauptworkspace vor Worktree-Anlage klassifizieren und nicht überschreiben.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und geprüft.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt; falls nicht möglich, Ursache prüfen und dokumentieren.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI-TAG-SEM-0 bis AI-TAG-SEM-6 plus FINAL-GREEN vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md, agents/card-enablement-ai-knowledge-agent.md und docs/architecture/ai/ai-activated-card-tag-semantics-process-2026-06-22.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_ACTIVATED_CARD_TAG_SEMANTICS auf Branch codex/ai-activated-card-tag-semantics.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- Alle Pakete und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Paketcommits liegen auf `codex/ai-activated-card-tag-semantics`.
- Vergleichbare Tag-Cleanup-Karten sind inventarisiert.
- `Danshi's Second ID` und vergleichbare sichere Fälle werden generisch als Tag-Cleanup semantisch erkannt.
- Der Runner wählt Danish bei sichtbaren 4 Tags und legaler Aktion gegenüber einfacher Economy.
- Bestehender `remove_tag`-Pfad bleibt intakt.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Finale AI-Checks, Typecheck und `git diff --check` sind grün oder eng als Baseline-Abweichung dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
