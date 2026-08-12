# KI-Änderungen: Architektur-Preflight

## Zweck

Diese Seite ist die kurze Einstiegsschranke für Änderungen am produktiven
KI-Verhalten. Sie ersetzt keine Detailarchitektur, sondern sorgt dafür, dass
vor einem Codepatch die vorhandene Entscheidungsautorität gefunden wird.

Führende Detailquellen:

- verbindliches Agenten-Konzentrat:
  `docs/architecture/ai/change-compass.md`
- allgemeines KI-Gesamtkonzept:
  `docs/architecture/ai/target-architecture.md`
- `docs/architecture/ai/README.md`
- `docs/architecture/ai/planning-architecture.md`
- bei Plan-first-, Choice- und Ownership-Arbeit:
  `docs/architecture/ai/turn-campaign-planner.md`
- package-lokale Pflichtregeln: `packages/ai/AGENTS.md`

Der Änderungskompass wird vor jedem KI-Codepatch vollständig gelesen. Die
beiden Gesamtkonzepte werden zusätzlich herangezogen, wenn Owner,
Schichtgrenze, Kernelvertrag oder langfristige Zielrichtung nicht bereits
eindeutig sind.

## Pflichtfragen vor dem ersten Patch

1. Welche fachliche Entscheidung soll sich ändern?
2. Welcher bestehende Plan oder Controller besitzt diese Entscheidung?
3. Ist der beobachtete Pfad eine Planwahl, eine planinterne Route, eine
   Engine-Fortsetzung oder nur die Payload einer bereits gewählten Action?
4. Welche Planinstanz, welcher Step, welche Route und welcher
   `PlanExecutionOrigin` müssen erhalten oder erweitert werden?
5. Welche bestehende Facts-, Sensor- oder Projektionsschicht liefert nur
   Eingaben und darf selbst keine Empfehlung oder Auswahl treffen?
6. Welche Parallelentscheidung würde ein lokaler Resolver, Override oder
   Fallback versehentlich neu einführen?
7. Welcher Test beweist nicht nur das Ergebnis, sondern auch die unveränderte
   Ownership?

Kann eine dieser Fragen nicht belastbar beantwortet werden, beginnt noch keine
Verhaltensimplementierung. Zuerst wird die relevante Architektur und der
laufende Ownerpfad geklärt.

## Choice-Regel

Ein Choice-Resolver ist kein Ersatzplan. Er vervollständigt ausschließlich die
Optionswerte einer bereits von Plan, Step und Route gewählten, aktuellen
`LegalAction`.

Die Auflösung darf:

- exakte Choice-, Options-, StateVersion- und Action-Bindungen revalidieren;
- eine bereits planseitig festgelegte Auswahl in Engine-Options-IDs
  materialisieren;
- bei fehlender oder veralteter Bindung sichtbar fail-closed abbrechen.

Die Auflösung darf nicht:

- eine neue Server-, Ziel-, Karten-, Ressourcen- oder Strategieentscheidung
  treffen;
- Plan, Executor, Step, Route oder `actionId` wechseln;
- fehlende Domainlogik durch „erste legale Option“, lokale Heuristik oder
  generischen Fallback ersetzen;
- eine Ownership duplizieren, die bereits einem Planmodul gehört.

Benötigt die Choice eine fachliche Auswahl, wird zuerst der zuständige Plan
erweitert und die Auswahl über eine typisierte Continuation beziehungsweise
einen `PlanExecutionOrigin` gebunden.

## Zentrale Corp-Ownership

Für Corp gilt insbesondere:

- Agendaquelle, Install/Advance/Score und Scoredeadline:
  `corp.score_agenda`
- langfristige Remote-Nutzbarkeit:
  `corp.establish_scoring_remote`
- globale ICE-Allokation, ICE-Installation, Schutzbewertung und Rez:
  `corp.defend_servers`
- Finanzierung als exakt gebundener Support:
  `corp.economy`

Eine Kartenfähigkeit kann kostenlose ICE-Installation und Rez auslösen. Die
Engine besitzt weiterhin Legalität und Auflösung; die fachliche Wahl
`ICE × Zielserver` bleibt jedoch bei `corp.defend_servers`. Ein
kartenspezifischer Resolver darf diese Allokation nicht daneben neu erfinden.

## Abnahmenachweis

Ein KI-Verhaltensfix ist erst belastbar, wenn Tests zeigen:

- zuständiger Plan, Executor, Step und Route;
- vollständige LegalAction-, Choice- und StateVersion-Bindung;
- unveränderte `actionId` und keine neu geöffnete Planwahl;
- keine zweite Entscheidungsautorität;
- side-sichere Eingaben, legale Action und fail-closed bei fehlender Bindung.
