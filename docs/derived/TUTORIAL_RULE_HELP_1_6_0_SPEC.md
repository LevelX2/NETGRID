# Tutorial und Regelhilfe 1.6.0 Spec

Stand: 2026-05-08
Status: eingefroren

## Grundsatz

Tutorial und Regelhilfe erklären erlaubte Entscheidungen. Sie sind keine Regelautorität.

```txt
TutorialScenario -> Engine State -> LegalActions -> TutorialHint -> PlayerAction -> applyAction
```

## Tutorial-Szenario

```ts
type TutorialScenario = {
  scenarioId: string
  title: string
  rulesBaseline: string
  allowedMechanics: string[]
  deckSnapshotRefs: string[]
  steps: TutorialStep[]
}

type TutorialStep = {
  stepId: string
  expectedTimingPoint: string
  legalActionRefs: string[]
  hintRefs: string[]
  successCondition: string
}
```

## Hinweise

Hinweise dürfen:

- aktuelle LegalActions erklären,
- sichtbare Kosten und Folgen beschreiben,
- Begriffe aus dem NETGRID-Glossar nutzen,
- Hidden-Info-Barrieren erklären,
- auf Replay-Schritte verweisen.

Hinweise dürfen nicht:

- verdeckte Gegnerkarten nennen,
- illegale Aktionen vorschlagen,
- `applyAction` umgehen,
- offizielle Regelvollständigkeit behaupten,
- LLM-Ausgaben als Regelentscheidung ausgeben.

## Erste Lektionen

1. Setup und Mulligan.
2. Klicks, Credits und Draw.
3. Run auf HQ oder R&D.
4. ICE rezzen, Encounter und Breaker.
5. Access und Agenda Steal.
6. Corp Score.
7. Damage und Flatline.
8. Tags und Resource-Trash nur mit freigegebenem Szenario.

## Glossar

Das Glossar enthält mindestens:

- Korp.
- Runner.
- Klick.
- Credit.
- HQ.
- F&E (R&D).
- Archive.
- Außenserver.
- Run.
- Begegnung.
- Zugriff.
- Agenda.
- Tag.
- Schaden.
- LegalAction.

UI-Texte verwenden deutsches, direktes Deutsch.

## KI-Sparring

Tutorial-KI:

- nutzt vorhandene KI-Profile,
- darf einfachere Gewichtungen nutzen,
- bleibt an PlayerView, LegalActions und side-gefilterte Events gebunden,
- liefert Erklärungen nur aus erlaubtem DecisionDebug.

## Persistenz

Tutorialfortschritt ist lokal. Kein Account oder Cloud-Sync wird benötigt.

## No-Scope

- Keine vollständige Regelschule.
- Keine Public-Onboarding-Plattform.
- Keine offizielle Assetnutzung.
- Kein LLM-Regelakteur.
- Keine neue Karte oder Mechanik.
