---
activityId: act-2026-07-19-mobile-barricade-target-position-labels
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt: 2026-07-19
completedAt: 2026-07-19
branch: codex/act-2026-07-19-mobile-barricade-target-labels
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-24-proteus-phase-3e-ice-repositioning
resultArtifacts:
  - packages/engine/src/game/run/fort-pass-window.ts
  - packages/engine/src/game/run/fort-pass-window.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/fort-pass-window.test.ts
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Zielpositionen bei Mobile-Barricade-Bewegungen eindeutig beschriften

## Ziel

Mehrere gleichzeitig angebotene Bewegungsaktionen von `Mobile Barricade` im
Start-of-run-Fenster müssen bereits anhand ihres sichtbaren Labels eindeutig
unterscheidbar sein. Jede Aktion nennt die konkrete öffentliche Zielposition,
damit die Corp die kostenpflichtige Bewegung bewusst auswählen kann.

## Kontext und Quellen

- Nutzerbeobachtung und Screenshot vom 2026-07-19:
  - Ein Run auf `Remote 1` startet gegen vier ICE.
  - Die äußerste `Mobile Barricade` kann für 1 Credit an drei andere Positionen
    desselben Forts bewegt werden.
  - Die zentrale Run-Aktionsliste zeigt dafür dreimal wortgleich
    `Mobile Barricade: ICE in Remote 1 bewegen`.
  - Aus den Labels ist nicht erkennbar, welcher Button Position 1, 2 oder 3
    auswählt; die Wahl ist dadurch praktisch blind.
- Screenshot-Evidence aus dem Nutzerbericht:
  `codex-clipboard-f57518bb-2297-4b54-b5f2-e7e20aa9484b.png`.
- Erledigtes Ursprungspaket
  `docs/activities/done/act-2026-05-24-proteus-phase-3e-ice-repositioning.md`:
  Die LegalActions enthalten bereits getrennte Quell- und Zielpositionen in
  Payload und Action-ID. Das neue Paket ist ein Darstellungs-Follow-up, kein
  Regel- oder Resolver-Fix.
- Wahrscheinlicher Startpunkt:
  `packages/engine/src/game/run/fort-pass-window.ts` erzeugt derzeit für alle
  `targetIceIndex`-Varianten dasselbe sichtbare Label.

## Scope

- Das Label jeder LegalAction der Fähigkeit
  `move_self_to_different_position_on_same_fort` um die konkrete öffentliche
  Zielposition ergänzen.
- Im beobachteten Vier-ICE-Fall müssen drei eindeutig unterscheidbare Labels
  entstehen, zum Beispiel `... an Position 1 bewegen`, `... an Position 2
  bewegen` und `... an Position 3 bewegen`.
- Die Formulierung in der zentralen Run-Aktionsliste kompakt und auf Deutsch
  halten; Kartenname, Server und Zielposition müssen erkennbar bleiben.
- Dieselbe generische Fähigkeit auch für `Walking Wall` und weitere künftige
  Nutzer des Ability-Kinds prüfen, damit der Fix nicht hart auf den Kartennamen
  `Mobile Barricade` zugeschnitten wird.
- Fokussierten Regressionstest für mindestens drei verschiedene Zielpositionen
  derselben Quellkarte ergänzen; dabei sowohl unterschiedliche Payload-Ziele
  als auch unterschiedliche sichtbare Labels prüfen.

## Nicht im Scope

- Keine Änderung an Kartenregel, Kosten, Timingfenster oder erlaubten
  Zielpositionen.
- Keine Änderung an `actionId`, LegalAction-Validierung, Reordering-Resolver,
  Replay, StateHash oder KI-Verhalten.
- Kein Redesign des Run-Panels und keine allgemeine Überarbeitung anderer
  Aktionslabels.
- Keine Offenlegung von Kartenidentitäten verdeckter ICE. Für die
  Unterscheidung genügt die bereits öffentliche ordinale ICE-Position.

## Akzeptanzkriterien

- [x] Bei vier ICE mit äußerster `Mobile Barricade` werden die drei legalen
      Zielaktionen im Start-of-run-Fenster mit den Zielpositionen 1, 2 und 3
      eindeutig beschriftet.
- [x] Kein Paar gleichzeitig sichtbarer Bewegungsaktionen derselben Quellkarte
      besitzt bei unterschiedlichen `targetIceIndex`-Werten dasselbe Label.
- [x] Kartenname, angegriffener Server, Zielposition und Credit-Kosten bleiben
      in der zentralen Aktionsliste gemeinsam verständlich; die Kostenanzeige
      darf weiterhin über das bestehende Kosten-Badge erfolgen.
- [x] Die gewählte Beschriftung verwendet dieselbe Positionszählung wie die
      sichtbaren ICE-Positionsmarker und bildet den internen nullbasierten
      `targetIceIndex` korrekt auf die einsbasierte Anzeige ab.
- [x] `Walking Wall` und weitere Nutzer desselben Ability-Kinds erhalten ohne
      kartenspezifischen Sonderfall ebenfalls eindeutige Zielpositionslabels.
- [x] Hidden-Info-, LegalAction-, Replay- und StateHash-Verträge bleiben
      unverändert.
- [x] Ein fokussierter automatisierter Test deckt mehrere gleichzeitig
      angebotene Zielpositionen und deren Labels ab.

## Umsetzungshinweise

- Bevorzugt die vorhandene öffentliche Information `targetIceIndex` nur in der
  Label-Erzeugung als `targetIceIndex + 1` darstellen. Keine Identität des ICE
  an der Zielposition in den Text aufnehmen.
- Falls das Engine-Label die kanonische Quelle für zentrale Aktionslisten ist,
  den kleinen Textfix dort zusammen mit dem bestehenden
  `fort-pass-window`-Test umsetzen. Nur dann in der Web-Label-Schicht ansetzen,
  wenn dort bereits ein passendes generisches Pattern für Run-Aktionslabels
  existiert.
- Die Auswahl muss ohne Tooltip eindeutig sein. Tooltip und `aria-label`
  dürfen ergänzen, aber nicht die einzige Trägerfläche der Zielposition sein.
- Wegen der bereits vorhandenen fremden Änderungen im Arbeitsbaum beim
  Vorsortieren nur die für dieses Paket tatsächlich benötigten Dateien
  anfassen.

## Ergebnisnotiz

Erledigt am 2026-07-19. Die generische Erzeugung der Start-of-run-Aktionen für
`move_self_to_different_position_on_same_fort` ergänzt nun die öffentliche,
einsbasierte Zielposition im kanonischen Label. Im beobachteten Vier-ICE-Fall
entstehen dadurch drei unterscheidbare Aktionen für Position 1, 2 und 3. Die
Änderung ist nicht auf `Mobile Barricade` zugeschnitten und gilt damit ebenso
für `Walking Wall` sowie künftige Nutzer desselben Ability-Kinds.

Der fokussierte Regressionstest modelliert vier ICE und prüft getrennte
Payload-Ziele, Labels und Action-IDs, unveränderte Kosten sowie den Schutz der
Identitäten der verdeckten Ziel-ICE. Der Web-Label-Pfad wurde geprüft und reicht
das kanonische Trigger-Ability-Label in der zentralen Run-Aktionsliste ohne eine
positionsentfernende Sonderkürzung durch. Alle Engine-Tests (202 Testdateien,
1753 Tests), Engine-Typecheck und `git diff --check` bestehen. Der neue
Testblock wurde mit dem Workspace-Formatter formatiert; sachfremde
Bestandsformatierungen blieben bewusst unverändert.
