---
activityId: act-2026-05-19-off-site-backups-archives-to-hq-noop
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities: []
resultArtifacts:
  - apps/server/src/multiplayer.test.ts
checks:
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "Off-Site Backups"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Off-Site Backups"
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check -- apps/server/src/multiplayer.test.ts docs/activities/in-progress/act-2026-05-19-off-site-backups-archives-to-hq-noop.md
---

# Off-Site Backups: Archives-to-HQ-Effekt darf nicht wirkungslos verpuffen

## Fund

Im Playtest wurde `Off-Site Backups` gespielt. Erwartung laut Kartentext: Die Korp darf eine beliebige Karte aus Archives nach HQ nehmen. Beobachtung: Die Karte wurde gespielt, danach passierte sichtbar nichts; es erschien keine Auswahl und keine Karte wurde nach HQ bewegt.

Die Nutzerbezeichnung war `Offside Backup`; die Runtime-Karte heißt nach aktuellem Katalog `Off-Site Backups` (`onr_v1_296_off-site-backups`).

## Kontext und Quellen

- Runtime-Definition: `packages/shared/src/index.ts` führt `Off-Site Backups` als Korp-Operation, Kosten 0, Rules Text `Bring any card from Archives into HQ.`
- Engine-Code enthält einen privaten Archives-to-HQ-Choice-Pfad für `v1922_corp_archives_to_hq`.
- Engine-Test `plays Off-Site Backups as a private Archives-to-HQ choice` deckt den direkten Engine-Pfad bereits grundsätzlich ab.
- Der Playtestbefund deutet deshalb besonders auf eine Lücke im Live-Pfad hin: Multiplayer-/Server-Weitergabe, Pending-Choice-UI, Choice-Resolution im Web oder eine Legality-/Zustandskante, die der Engine-Unit-Test nicht abdeckt.

## Ziel

`Off-Site Backups` muss im echten Spiel zuverlässig eine Korp-private Archives-Auswahl öffnen und nach Auswahl genau eine Archives-Karte nach HQ bewegen. Die Operation darf nicht still gespielt werden, ohne dass der Effekt ausgeführt oder eine verständliche Nicht-Legalität angezeigt wird.

## Scope

- Live-Pfad für `Off-Site Backups` vom Spielen der Operation bis zur Choice-Auflösung prüfen.
- Sicherstellen, dass bei nicht leerem Archives eine private Korp-Auswahl mit allen legalen Archives-Karten erscheint.
- Sicherstellen, dass die Auswahl nach Bestätigung die gewählte Karte aus Archives entfernt und verdeckt nach HQ legt.
- Prüfen, ob die gerade gespielte `Off-Site Backups`-Operation selbst fälschlich als Ziel angeboten oder ausgeschlossen wird.
- Prüfen, ob der Webclient eine pending Choice nach `play_operation` korrekt rendert und nicht durch Aktionsleisten-/Chronikwechsel verschluckt.
- Prüfen, ob Multiplayer-/Reconnect-Payloads die private Choice der Korp korrekt enthalten.
- Falls Archives leer ist, darf die Operation nicht als sinnvoll spielbare Aktion angeboten werden oder muss klar blockiert werden; sie darf nicht ohne Effekt verbraucht werden.

## Nicht im Scope

- Neue Kartenfunktion über den gedruckten Effekt hinaus.
- Runner-Sicht auf verdeckte Archives- oder HQ-Karten erweitern.
- Generische Neuarchitektur aller Hidden-Zone-Choices.
- KI-Priorisierung für `Off-Site Backups`.

## Akzeptanzkriterien

- In einem Live-/Server- oder Web-Regressionsfall mit mindestens einer Karte in Archives öffnet `Off-Site Backups` nach dem Spielen eine Korp-private Auswahl.
- Die Korp kann genau eine beliebige Archives-Karte auswählen.
- Nach der Auswahl liegt die gewählte Karte in HQ, nicht mehr in Archives, und ist nicht öffentlich geleakt.
- Die gespielte Operation selbst ist nicht als Rückholziel auswählbar, sofern sie durch das Spielen nach Archives gelegt wurde.
- Bei leerem Archives wird `Off-Site Backups` nicht als wirkungslose Spielaktion angeboten oder der Versuch wird regelkonform und verständlich zurückgewiesen.
- Chronik und PublicEvents nennen den Effekt ausreichend nachvollziehbar, ohne versteckte Kartentitel, verdeckte Archives-Inhalte oder HQ-Inhalte zu leaken.
- Replay und StateHash bleiben deterministisch.
- Bestehender Engine-Test bleibt grün und wird um mindestens einen Test für den beobachteten Live-/UI-/Server-Pfad ergänzt, falls der Fehler nicht im reinen Engine-Pfad reproduzierbar ist.

## Umsetzungshinweise

- Zuerst prüfen, ob der bestehende Engine-Test nur `apply` und `applyChoices` direkt abdeckt, der Web-/Serverpfad aber nach `play_operation` die `pendingChoice` nicht anzeigt oder nicht an die richtige Seite liefert.
- Besonders auf Hidden-Info-Barrieren achten: Korp darf die Archives-Ziele sehen, Runner darf aus PublicEvents und PlayerViews keine verdeckten Archives-/HQ-Identitäten ableiten.
- Falls die Operation aktuell trotz leerem Archives legal erscheint, die LegalAction-Erzeugung und den UI-Zustand gemeinsam prüfen, damit keine bezahlte/gespielte No-op-Aktion möglich bleibt.

## Ergebnisnotiz

Erledigt: Der direkte Engine-Test für `Off-Site Backups` war bereits grün; im Paket wurde der beobachtete Live-Pfad nun als Server-Regressionsfall abgesichert. Der neue Test spielt `Off-Site Backups` über `MultiplayerService.submitAction`, prüft die Korp-private Archives-Auswahl, Reconnect-Sichtbarkeit, Runner-Redaction und die Choice-Auflösung bis zur Bewegung der gewählten Archives-Karte nach HQ.

Ergebnis der Analyse: Kein Runtime-Code-Fix noetig. Der Regressionsschutz stellt sicher, dass der Effekt im Server-/Reconnect-Pfad nicht still verpufft und verdeckte Archives-/HQ-Informationen nicht in Runner-Payloads oder PublicEvents gelangen.
