---
activityId: act-2026-06-09-ai-remote-prerun-access-commitment
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget: runner-ai-known-remote-payoff-follow-up
blockedBy: []
resultArtifacts: []
checks: []
relatedActivities:
  - act-2026-05-17-runner-ai-remote-trash-affordability
  - act-2026-06-07-runner-ai-encounter-payoff-reevaluation
relatedReviews:
  - docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md
---

# Runner-KI: Pre-Run Access Commitment für bekannte Remotes

## Ziel

Die Runner-KI soll vor einem Run auf ein bekanntes Remote-Root-Ziel bewerten, ob sie den beim Zugriff bekannten Payoff wirklich nehmen würde. Wenn der bekannte Inhalt nicht gestohlen, getrasht oder anderweitig sinnvoll genutzt werden soll, darf der Run nicht als lohnender `runner.contest_remote` gewinnen und darf keinen Remote-Root-Threat- oder Planfortschreibungsbonus erhalten.

Der Kern ist eine Vorabfrage:

```text
Wenn ich diesen bekannten Remote-Root erreiche:
nehme ich den Zugriffspayoff wirklich?

Wenn nein:
ist der Run aktuell kein Remote-Contest, sondern ein bekannter No-Payoff-Run.
```

## Kontext und Quellen

- Nutzeranalyse vom 2026-06-09: Die Runner-KI wählte wiederholt `Run auf Remote 2` mit `planKind: runner.contest_remote`, obwohl der relevante Remote-Root-Inhalt bereits bekannt war und der Runner beim Zugriff den Trash wegen Creditreserve ablehnte.
- Beispielbefund: `Euromarket Consortium` ist ein bekannter Remote-Root-Node mit Trashkosten 4. Der Runner hat vor dem Run 4 Credits und könnte technisch trashen, würde danach aber auf 0 Credits fallen. Wenn die eigene Creditreserve diesen Trash ablehnt, hat der Run vorab keinen aktuellen Payoff.
- Zusätzlicher Kontext: `Vacuum Link` kann Repeat-Runs weiter verschlechtern, weil der Runner bei 1-3 zurückgesetzt beziehungsweise zum ersten ICE zurückgebracht wird. Das soll kein kartenspezifischer Sonderfall werden, sondern als zusätzlicher sichtbarer Run-Kosten-/No-Progress-Kontext in die Evidence einfließen.
- Verwandter Abschluss: `docs/reviews/ai/ai-fix-remote-known-access-payoff-final-report-2026-06-06.md` entwertet bekannte Remotes ohne aktuellen Payoff, wenn Trash unbezahlbar ist oder der Inhalt keinen Nutzen hat.
- Diese Activity ist ein Follow-up zum fehlenden Commitment-Fall: "Trash technisch bezahlbar, aber wegen Reserve oder Zielwert bewusst nicht gewollt" muss vor dem Run genauso wirken wie ein aktuell nicht nutzbarer Payoff.
- Verwandte erledigte Activities:
  - `docs/activities/done/act-2026-05-17-runner-ai-remote-trash-affordability.md`
  - `docs/activities/done/act-2026-06-07-runner-ai-encounter-payoff-reevaluation.md`

## Scope

- Für bekannte Remote-Root-Inhalte eine Pre-Run-Commitment-Auswertung einführen oder in die vorhandene `KnownRemoteAccessPayoff`-Logik integrieren.
- Bewertungsfluss fachlich abbilden:

```text
KnownRemoteRoot
-> AccessOutcomeProjection
-> IntendedAccessDecision
-> RunTargetEvaluation
```

- Für bekannte Remote-Root-Karten mindestens folgende Fakten aus side-sicheren Quellen auswerten oder konservativ als unbekannt behandeln:
  - `serverId`
  - bekannte Root-Definition oder bekannte Root-Klassifikation
  - `knownRootType`: `agenda`, `asset`, `upgrade`, `node`, `unknown`
  - Trashkosten, soweit rechtmäßig bekannt
  - Credits vor dem Run
  - sichtbare Pfadkosten oder konservativ bekannte Run-Kosten
  - Credits beim Zugriff
  - Credits nach einem möglichen Trash
  - aktuelle `CreditReserve` oder `ContestReserve`
  - erwarteter Score-, Trash-, Nutzungs- oder Setup-Payoff
- Für bekannte Agendas bleibt der Remote-Run hoch bewertbar, wenn keine andere bestehende Safety-Regel dagegen spricht.
- Für bekannte Assets, Upgrades oder Nodes wird der Remote-Run nur hoch bewertet, wenn die KI vorab wirklich trashen oder einen anderen konkreten Payoff nehmen würde.
- Wenn Trash technisch bezahlbar ist, aber die KI wegen Reserve, Zielwert oder anderem bekannten Kontext nicht trashen würde:
  - `knownNoCurrentPayoff=true`
  - kein `Remote-Root-Threat`-Bonus
  - kein `runner.contest_remote`-Plan-Mapping auf diesen Server
  - kein `previous_plan_continuity`-Bonus für denselben Remote
  - alternative Pläne wie `build_credit_base`, Central Pressure, Setup oder Handentwicklung dürfen gewinnen.
- Remote-Run wieder sinnvoll werden lassen, wenn sich der Zustand ändert:
  - genug Credits für Trashkosten plus Reserve
  - Free-Trash- oder Trash-Credit-Effekt verfügbar
  - Remote-Root geändert, neu installiert, revealed oder invalidiert
  - bekannte oder plausible Agenda-/Score-Threat-Lage
  - anderer klarer Immediate-Payoff entsteht.
- Debug-/Evidence-Felder redigiert ergänzen, damit die Entscheidung nachvollziehbar ist, ohne Hidden-Info auszugeben.

## Nicht im Scope

- Keine Engine-Änderung.
- Keine Änderung an `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Regelvalidierung.
- Keine Hidden-Info-Ausweitung: Verdeckte Remote-Roots, HQ, R&D, Stack, Grip, Archives-Facedown, unrezzed ICE oder nicht rechtmäßig bekannte Kosten dürfen nicht vorausgesetzt oder öffentlich geleakt werden.
- Keine neue Kartensemantik und keine Sonderregel nur für `Euromarket Consortium` oder `Vacuum Link`.
- Keine pauschale Remote-Run-Sperre für Assets, Upgrades oder Nodes.
- Keine Änderung an der Access-Trash-Entscheidung selbst, außer sie wird für die Pre-Run-Projektion wiederverwendbar oder konsistent gespiegelt.
- Keine UI- oder Chronik-Arbeit, außer bestehende AI-Debug-Ausgaben brauchen redigierte Evidence.

## Akzeptanzkriterien

- [ ] Es gibt eine zentrale oder klar wiederverwendete Auswertung für Pre-Run-Commitment bei bekannten Remote-Roots.
- [ ] Die Auswertung trennt mindestens `steal`, `trash`, `decline`, `defer_until_funded` und `unknown` oder äquivalente interne Kategorien.
- [ ] Decline-Gründe sind debugfähig und side-sicher, insbesondere `insufficient_credits`, `reserve_would_break`, `low_value_target`, `no_current_payoff` und `unknown` oder äquivalente Namen.
- [ ] Der Euromarket-Fall ist als Regression abgedeckt: bekannter Remote-Root, Trashkosten 4, Runner 4 Credits, Trash würde die Reserve brechen; die Runner-KI wählt keinen Run auf dieses Remote als besten Remote-Contest.
- [ ] Derselbe bekannte Euromarket-Fall mit genug Credits für Trash plus Reserve darf weiterhin als sinnvoller Remote-Run bewertet werden.
- [ ] Eine bekannte Remote-Agenda bleibt ein positiver Remote-Run-Fall.
- [ ] Ein bekanntes Asset/Upgrade/Node-Ziel mit unbezahlbarem Trash wird weiter abgewertet und regressiert nicht gegenüber dem bestehenden `Known Remote Access Payoff`-Fix.
- [ ] Wenn ein bekannter Remote-Root nicht getrasht wurde und der Remote-Zustand unverändert ist, erhält derselbe Remote keinen Planfortschreibungsbonus.
- [ ] Wenn sich Credits, Root-Inhalt, Free-Trash-Möglichkeit oder Score-Threat relevant ändern, kann der Remote-Run wieder erlaubt und sinnvoll bewertet werden.
- [ ] Ein rezzed/random ICE-Kontext wie `Vacuum Link` kann den bekannten No-Payoff-Run zusätzlich abwerten, ohne als kartenspezifische Sonderregel implementiert zu werden.
- [ ] Finale Action-Auswahl bleibt ausschließlich aus `input.legalActions`.
- [ ] Debug/Evidence leakt keine verdeckten Kartendaten und nennt nur side-sichere bekannte Fakten, Counts, Kosten und Entscheidungsgründe.
- [ ] Fokussierte AI-Checks laufen grün oder ausgelassene Checks sind im Ergebnis begründet.

## Umsetzungshinweise

- Primärfolgeagent: `card-enablement-ai-knowledge-agent`, weil der Fix KI-Bewertung, bekannte Karten-/Remote-Payoff-Semantik, Planfortführung und side-sichere Evidence berührt.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/known-remote-access-payoff.ts`
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/tactical-plans.ts`
  - `packages/ai/src/index.ts`
  - zugehörige Tests in `packages/ai/src/*.test.ts`
- Bevor eine neue Routine entsteht, prüfen, ob `evaluateKnownRemoteAccessPayoff` sauber erweitert werden kann. Wenn die bestehende Routine bewusst nur "bezahlbar/unbezahlbar" klassifiziert, kann eine kleine Schicht `PreRunRemoteAccessCommitment` davor oder daneben sinnvoller sein.
- Nicht nur prüfen:

```text
trashCost <= creditsAfterPath
```

sondern sinngemäß:

```text
wouldTrash =
  trashCost <= creditsAfterPath
  AND creditsAfterTrash >= requiredReserve
  AND targetValue justifies reserve break
```

- Wenn `wouldTrash=false`, muss der Remote-Run als `known_no_current_payoff` oder konkreter als `known_remote_root_trash_declined_by_reserve` behandelt werden.
- Planfortführung vor `previous_plan_continuity` für `runner.contest_remote` absichern:
  - `remoteStillContestable?`
  - `preRunAccessCommitment?`
  - `wouldTrash` oder `wouldSteal?`
  - `knownNoCurrentPayoff?`
- Debug-/Evidence-Vorschläge:
  - `knownRemoteRoot`
  - `preRunAccessCommitment`
  - `trashCost`
  - `creditsAfterPath`
  - `creditsAfterTrash`
  - `desiredCreditReserve`
  - `wouldTrashKnownRoot`
  - `wouldDeclineTrash`
  - `trashDeclineReason`
  - `remoteKnownNoCurrentPayoff`
  - `why_remote_run_deferred_before_access`
  - `why_remote_run_allowed_before_access`
  - `trash_affordable_but_declined_by_reserve`
  - `credits_after_trash_below_reserve`
  - `repeated_random_ice_no_progress`, falls der sichtbare Run-Kontext dies side-sicher hergibt.
- Erwartete Checks:
  - `corepack pnpm --filter @netgrid/ai typecheck`
  - fokussierte Vitest-Dateien, je nach tatsächlicher Lage:
    - `known-remote-access-payoff.test.ts`
    - `runner-run-target-evaluation.test.ts`
    - `tactical-plans.test.ts`
    - `semantic-ai-runtime-cutover.test.ts`
  - `git diff --check`

## Ergebnisnotiz

Noch offen.
