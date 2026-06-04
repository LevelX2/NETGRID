---
activityId: act-2026-06-04-corp-semantic-naked-remote-agenda-guard
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-04
startedAt: 2026-06-04
completedAt: 2026-06-04
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/semantic-ai-runtime-cutover.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- src/semantic-ai-runtime-cutover.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Korp Semantic Runtime: nackte Remote-Agenda und Remote-Spam verhindern

## Ziel

Die neue Semantic-KI soll frühe Korp-Entscheidungen nicht in viele ungenutzte Remotes und nackte Agenda-Advances treiben. Sie soll sichtbares Risiko gegen Runner-Runs berücksichtigen und stattdessen Economy, Draw oder sinnvolle ICE-Verstärkung auf HQ, R&D oder eine bereits relevante Remote bevorzugen.

## Kontext und Quellen

- Nutzerfund vom 2026-06-04 nach Semantic-Runtime-Cutover: Die Korp erzeugte im zweiten Zug mehrere Remotes mit jeweils leerem Root und ICE, ohne sie sinnvoll zu nutzen.
- Nutzerfund vom 2026-06-04 direkt danach: Die Korp installierte eine Agenda in ein weiteres ungeschütztes Remote, advancete zweimal, und der Runner konnte anschließend auf das ungeschützte Remote laufen.
- Betroffener Livepfad: `chooseCorpAction` nutzt seit `semantic-ai-runtime-cutover-2026-06-04` die Semantic Runtime als Default.
- Vermutete Ursache: `install_card` und `advance_card` erhalten im Semantic Runtime Scoring zu pauschal hohe Priorität, während nackte Remote-Risiken, vorhandene leere Remotes, zentrale ICE-Verstärkung, Economy und Draw zu schwach gewichtet sind.

## Scope

- Korp-Semantic-Runtime-Scoring für frühe Remote-Build-, Agenda-Install-, Advance-, ICE-Install-, Draw- und Credit-Entscheidungen prüfen und korrigieren.
- Ein Risiko-/Nutzenmodell für Remotes ergänzen, das mindestens unterscheidet:
  - neues leeres Remote ohne unmittelbaren Zweck,
  - nackte installierte Agenda oder advancebare Root-Karte,
  - bereits geschützte Remote,
  - HQ/R&D/Archives-Schutzbedarf,
  - Economy-/Draw-Bedarf.
- Verhindern, dass die Korp eine Agenda in ein ungeschütztes neues Remote installiert und dort mehrfach advanced, wenn der Runner danach offensichtlich laufen kann.
- Regressionstests mit minimalen LegalAction-Fixtures für:
  - keine weitere leere Remote bauen, wenn Economy/Draw oder zentrale ICE-Verstärkung legal ist,
  - keine nackte Agenda advancen, wenn Schutz fehlt,
  - geschützte oder unmittelbar scorebare Agenda-Linie bleibt möglich.
- Bestehenden KI-Trace so weit nutzbar halten, dass die Entscheidung anhand von Reason/Evidence nachvollziehbar ist.

## Nicht im Scope

- Keine Engine-Regeländerung: LegalActions bleiben die einzige Aktionsbasis, `applyAction` bleibt finaler Guard.
- Keine Hidden-Info-Erweiterung für Runner- oder Public-Sichten.
- Keine Änderung am Kartenpool, an Decklegalität oder an Agenda-Regeln.
- Kein vollständiger Korp-Planner-Umbau und keine Rückkehr zum Legacy-Default.
- Kein UI-Redesign der Spieloberfläche.

## Akzeptanzkriterien

- [x] Eine Korp mit legalen Credit-/Draw-/ICE-Verstärkungsaktionen baut nicht wiederholt zwecklose neue Remotes.
- [x] Eine Korp installiert und advanced keine offensichtlich nackte Agenda-Linie, wenn sie vor dem Runner-Zug ungeschützt bleibt und sichere Alternativen legal sind.
- [x] Eine geschützte oder unmittelbar scorebare Agenda-Linie bleibt weiterhin auswählbar.
- [x] Semantic-Reason/Evidence benennt remote-risk beziehungsweise protection/economy/draw nachvollziehbar und side-safe.
- [x] Regressionstests decken die beiden Nutzerbeobachtungen ab.
- [x] Verifikation umfasst mindestens `corepack pnpm --filter @netgrid/ai test -- src/semantic-ai-runtime-cutover.test.ts` oder eine neue fokussierte AI-Testdatei, `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check`.

## Umsetzungshinweise

- Startpunkt ist `packages/ai/src/index.ts`, insbesondere `semanticRuntimeCorpScore`, `semanticRuntimeTypePriority` und die Behandlung von `install_card`, `advance_card`, `gain_credit`, `draw_card` sowie ICE-Installations-LegalActions.
- Bestehende ältere Korp-Planlogik darf als Vergleich/Evidence dienen, aber nicht wieder zum Default werden.
- Für Agenda-/Remote-Risiko nur side-sichere und für die Korp erlaubte Daten aus `AiDecisionInput.playerView`, `LegalActions`, Aktionspayloads und eigenen sichtbaren/privaten Korp-Informationen nutzen. Keine Runner-Hidden-Info erraten.
- Falls der aktuelle Semantic-Livepfad fuer Maintenance-Traces zu wenig native Debugdaten liefert, eine kleine side-safe Semantic-Debug-Erweiterung als Teil des Fixes oder als direktes Folgepaket dokumentieren.

## Ergebnisnotiz

Umgesetzt. `chooseCorpAction` bewertet im Semantic-Runtime-Pfad Korp-Remote-Risiken jetzt side-safe aus LegalActions und Korp-PlayerView: leere neue/weitere Remote-Shells und ungeschützte Score-Linien werden abgewertet, Economy/Draw und zentrale ICE-Verstärkung werden bei instabiler Remote-Lage stärker berücksichtigt, geschützte beziehungsweise scorebare Remote-Linien bleiben positiv. Regressionen in `semantic-ai-runtime-cutover.test.ts` decken leere Remote-Überbauung, nackte Agenda-Installation, nacktes Advance und geschütztes Advance ab. Checks grün: `corepack pnpm --filter @netgrid/ai test -- src/semantic-ai-runtime-cutover.test.ts`, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`. Keine offenen Folgepunkte.
