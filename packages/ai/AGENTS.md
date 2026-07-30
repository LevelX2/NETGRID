# AI-Regeln

## Pflichtquellen vor Änderungen

Vor dem ersten Patch an produktivem KI-Verhalten vollständig lesen:

1. `docs/architecture/ai/README.md`
2. die einschlägigen Abschnitte in
   `docs/architecture/ai/ai-plan-layer-target-state-wip.md`
3. bei Plan-first-, Choice- oder Ownership-Arbeit zusätzlich
   `docs/architecture/ai/ai-plan-first-runtime-cutover-process-2026-07-23.md`

Die führenden Architekturverträge gehen lokalen Reparaturideen, der ersten
auffindbaren Hilfsfunktion und einem kurzfristig grünen Einzeltest vor.

## Entscheidungsautorität und Ownership

- Die produktive KI ist Plan-first. Eine Action besitzt außerhalb der
  gewählten Planinstanz, ihres Steps und ihrer Route keine eigene
  Handlungsautorität.
- Vor jeder Verhaltensänderung den fachlichen Owner benennen und im Codepfad
  nachweisen. Bestehende Owner werden erweitert; daneben entsteht kein zweiter
  Chooser, Override, Fallback, Sensor mit Empfehlung oder paralleler Plan.
- `corp.defend_servers` ist alleiniger Owner für globale ICE-Allokation,
  ICE-Installation, Schutzbewertung und Rez-Entscheidung. Score-, Remote-,
  Economy-, Handmanagement- und Kartenresolver dürfen nur typisierte Bedarfe
  oder Engine-Facts liefern.
- Choice-Payload-Auflösung erfolgt erst nach Plan-, Step-, Routen- und
  Actionwahl. Ein Resolver darf nur die exakt gebundenen Optionswerte dieser
  Action vervollständigen; er darf weder die Planwahl neu öffnen noch eigene
  Domainlogik anstelle des zuständigen Plans einführen.
- Benötigt eine Engine-Choice eine neue Ziel-, Karten-, Server-, Ressourcen-
  oder Strategiebewertung, wird diese im zuständigen Planmodul modelliert und
  über Continuation beziehungsweise `PlanExecutionOrigin` an die Choice
  gebunden. Ohne diese Bindung gilt fail-closed.

## Daten- und Engine-Grenzen

- Die KI konsumiert nur side-sichere `PlayerView`, side-gefilterte
  `PublicEvents`, vorhandene `LegalActions` und ausdrücklich erlaubte
  Metadaten.
- Die KI erhält niemals den vollständigen `GameState` und leitet nichts aus
  verdeckter gegnerischer Hand oder verdecktem gegnerischem Stack ab.
- Die Engine bleibt alleinige Regelautorität. Die KI erzeugt keine
  `LegalActions`, verändert keine Legalität und führt keine Ersatzaction
  außerhalb der gewählten Action-ID aus.
- Timeout- oder ungültige Entscheidungen müssen sicher und sichtbar
  fail-closed behandelt werden; ein generischer Verhaltensfallback darf keine
  fehlende Plan- oder Domainlogik kaschieren.

## Pflichtnachweis für KI-Fixes

- Test mit realistischem `PlayerView` und echten beziehungsweise exakt
  nachgebildeten `LegalActions`.
- Nachweis des zuständigen Plans, Steps und der Route.
- Bei Choices: unveränderte `actionId`, Planinstanz und Executor sowie exakte
  StateVersion-/Optionsbindung.
- Keine zweite Entscheidungsautorität, keine illegalen Actions und kein
  Hidden-Info-Leak.
- Passende fokussierte Tests, AI-Typecheck und aktive AI-Strukturgates.
