# Prozess: Realitätsaudit der KI-Tests

## Status

Aktiv seit 2026-07-12.

## Quelle und Vorgabe

Nutzerauftrag vom 2026-07-12: Sämtliche KI-Tests darauf prüfen, ob sie ihren
Prüfgegenstand realistisch abbilden und die jeweilige Fehlfunktion auch unter
echten Spielsituationen sichtbar machen würden. Notwendige Verbesserungen
werden direkt als sequenzieller Worktree-Prozess umgesetzt.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise. Der aktuelle
KI-Vertrag, die produktive Semantic Runtime, die Testgruppen und die aktiven
Gates sind im Repository bestimmbar. Eine vollständige Mutation jedes einzelnen
Produktionszweigs ist nicht praktikabel; deshalb verbindet der Audit eine
vollständige dateiweise Inventur mit gezielten Negativproben an den produktiven
Entscheidungswegen und realen Engine-Fixtures.

## Gesamtziel

Alle 289 primären KI-Testdateien mit 1.968 statisch registrierten Testfällen
werden gruppiert und nach ihrem tatsächlichen Prüfniveau klassifiziert. Tests,
die eine reale Fehlfunktion wegen zu enger Fixtures, fehlender Konkurrenzaktionen,
direkter Helper-Aufrufe oder übermäßiger Festsetzungen nicht erkennen würden,
werden priorisiert gehärtet. Der Abschluss belegt sowohl isolierte Fachlogik als
auch Verhalten über den produktiven KI-Einstieg mit Engine-nahen Spielsituationen.

## Annahmen

- Primärer Scope ist `packages/ai/src/**/*.test.ts`.
- KI-nahe Server-, Web- und Shared-Tests sind Randverträge und werden separat
  geprüft; sie ersetzen keine KI-Verhaltensprüfung.
- Ein Unit-Test darf eng sein, wenn eine zusätzliche Integrations- oder
  Szenarioprüfung denselben realen Fehlerpfad abdeckt.
- Realistisch bedeutet nicht zufällig oder instabil: Engine-erzeugte Zustände,
  echte `PlayerView`-/`LegalActions`-Verträge und mehrere plausible Alternativen
  bleiben deterministisch reproduzierbar.

## Nicht-Ziele

- Kein Umbau von Vitest oder des allgemeinen Testframeworks.
- Keine neue KI-Strategie und keine Änderung der fachlichen Bewertungslogik,
  außer eine Testlücke deckt einen bereits bestehenden produktiven Defekt auf.
- Keine Behauptung globaler Spielstärke allein aus grünen Regressionstests.
- Keine Pflege historischer Legacy-Runtimes oder entfernter Testpfade.

## Controller-Invarianten

- Die produktive Fassade `@netgrid/ai` und die Semantic Runtime bleiben der
  maßgebliche Live-Entscheidungsweg.
- Engine-`LegalActions` und side-sichere `PlayerView` sind die einzigen
  zulässigen Entscheidungsinputs.
- Isolierte Helper-Erwartungen gelten nur als lokale Verträge; eine Aussage
  über das Spielverhalten benötigt einen Live-Entrypoint- oder Szenariobeleg.
- Verhaltensprüfungen enthalten eine realistische, plausible Gegenalternative,
  sofern die Entscheidung zwischen Aktionen Gegenstand des Tests ist.
- Fixtures fixieren nur Voraussetzungen, nicht das zu beweisende Ergebnis.

## Automatische Fehlerbehandlung

- Ein roter vorhandener Test wird zuerst als Baseline-Abweichung klassifiziert.
- Ein durch die Härtung sichtbar werdender Produktdefekt wird eng reproduziert,
  dokumentiert und nur dann im selben Paket behoben, wenn der bestehende Vertrag
  eindeutig ist.
- Nicht reproduzierbare oder flakey Szenarien werden nicht als Gate übernommen.
- Umfangreiche Rohdaten werden ausschließlich unter `data/local/` abgelegt.

## Sicherheitsblocker

Stoppen, wenn eine realistische Prüfung verdeckte Kartendaten in KI-Inputs,
Logs oder versionierte Fixtures übernehmen müsste, oder wenn aktuelle parallele
Änderungen denselben produktiven Vertrag widersprüchlich verändern. Removal
Condition ist jeweils ein side-sicheres Fixture beziehungsweise ein geklärter
aktueller Vertrag.

## State Machine

`INVENTORY -> AUDIT -> HARDEN_UNIT_SEAMS -> HARDEN_LIVE_RUNTIME -> HARDEN_ENGINE_SCENARIOS -> FINAL_VERIFY -> MERGED`

Genau ein Zustand und ein Paket sind aktiv. Ein Übergang erfolgt nur nach
erfülltem Done-Gate und Paketcommit.

## Paketfolge

### ATR-01 – Vollständige Inventur und Risikomatrix

- Ziel: Jede primäre KI-Testdatei einer Gruppe, einem Prüfniveau und
  Realitätsrisiko zuordnen.
- Arbeit: Automatisierte Inventur, statische Risikosignale, gezielte Prüfung
  repräsentativer und hochriskanter Tests, dauerhafter Auditbericht.
- Kernartefakte: dieser Prozess, Auditbericht und gegebenenfalls ein
  wiederholbarer Check-Helfer.
- Checks: Inventursummen, Stichproben gegen Vitest-Sammlung, `git diff --check`.
- Done-Gate: 289 Dateien und 1.968 Fälle sind vollständig erfasst; kritische
  Lücken sind mit konkretem Fehlermodus und Zieltest priorisiert.
- Commit: `docs(ai): audit AI test realism`

### ATR-02 – Isolierte Entscheidungs- und Planverträge härten

- Ziel: Zu enge Action-, Access-, Decision- und Plan-Tests um plausible
  Konkurrenzaktionen und kontrollierte Störvarianten ergänzen.
- Eingang: ATR-01 abgeschlossen.
- Arbeit: Kritische Unit-Verträge so erweitern, dass sie bei falscher Auswahl,
  verlorenem Kontext oder irreführenden Festsetzungen rot werden.
- Kernartefakte: Tests unter `access/`, `actions/`, `decision/` und `plans/`.
- Checks: betroffene Vitest-Dateien, AI-Typecheck, `git diff --check`.
- Done-Gate: Jede priorisierte lokale Lücke hat eine Negativprobe oder einen
  bewusst dokumentierten Integrationsbeleg.
- Commit: `test(ai): harden decision and plan realism`

### ATR-03 – Produktiven Semantic-Runtime-Pfad härten

- Ziel: Kritische Verhaltensregressionen über denselben Einstieg erkennen, den
  das echte Spiel nutzt.
- Eingang: ATR-02 abgeschlossen.
- Arbeit: Runtime-Tests mit vollständigem Entscheidungskontext, plausiblen
  Alternativen, Choice-Weiterführung und relevanten Memory-/History-Varianten.
- Kernartefakte: `runtime/` sowie öffentliche Entrypoint-Vertragstests.
- Checks: fokussierte Runtime-Suite, AI-Typecheck, `git diff --check`.
- Done-Gate: Priorisierte Fehlermodi scheitern bei einer falschen Live-Auswahl,
  nicht nur bei falschen Helper-Zwischenwerten.
- Commit: `test(ai): cover realistic semantic runtime decisions`

### ATR-04 – Engine-nahe Szenarien und Varianten härten

- Ziel: Abweichungen zwischen handgebauten Testobjekten und echten
  Engine-Spielsituationen sichtbar machen.
- Eingang: ATR-03 abgeschlossen.
- Arbeit: Evaluation-/Simulationstests mit Engine-erzeugten Zuständen,
  mindestens einer relevanten Zustandsvariation und Replay-/Side-Safety-Gates.
- Kernartefakte: `evaluation/`, `simulation/` und wiederverwendbare Fixtures.
- Checks: fokussierte Szenariosuite, Replay-Akzeptanz, AI-Typecheck,
  `git diff --check`.
- Done-Gate: Die priorisierten Spielzustände werden über reale Verträge erzeugt
  und die Tests unterscheiden erwartetes Verhalten von einer plausiblen
  Fehlentscheidung.
- Commit: `test(ai): add engine-realistic AI scenarios`

### ATR-05 – Gesamtgate, Wissensrückführung und Integration

- Ziel: Gesamtsuite grün, Residualrisiken sichtbar und lokaler Main-Stand
  integriert.
- Eingang: ATR-04 abgeschlossen.
- Arbeit: Randverträge prüfen, Bericht finalisieren, Wissens-/Logpflege,
  vollständige aktive KI-Gates und defensiver Main-Abgleich.
- Checks: `corepack pnpm test:ai:shards`, `corepack pnpm check:ai`,
  `corepack pnpm check:ai:full`,
  `corepack pnpm check:ai-deck-doctrine-strategy`,
  `corepack pnpm check:proteus-ai-readiness`,
  `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: alle relevanten Gates grün, Arbeitsbranch sauber, lokal nach
  `main` integriert und Worktree entfernt.
- Commit: `docs(ai): close AI test realism audit`

## Verifikationsregeln

- Jede geänderte Testdatei muss zunächst fokussiert laufen.
- Danach läuft mindestens die betroffene Gruppe und vor Integration die gesamte
  KI-Suite in Shards.
- Ein grüner Test ist nur Evidenz für seinen dokumentierten Prüfumfang.
- Neue Verhaltensprüfungen müssen nachweislich bei einer gegenteiligen Auswahl
  oder einer entfernten relevanten Kontextinformation scheitern.
- Nach jedem Paket laufen `git diff --check`, selektives Staging und ein eigener
  Commit.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_TEST_REALISM_AUDIT`
- Arbeitsbranch: `codex/ai-test-realism-audit`
- Integrationsbranch: lokales `main`
- Hauptworkspace wird ausschließlich für den finalen Merge genutzt.
- Vor dem finalen Merge wird aktuelles `main` defensiv in den Arbeitsbranch
  integriert; Konflikte werden inhaltlich gelöst.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Realitätsaudit der NETGRID-KI-Tests vollständig und
sequenziell von ATR-01 bis ATR-05 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/test-quality-agent.md, die
Pflichtseiten in KI-Wissen-NETGRID und dieses Prozessartefakt. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_AI_TEST_REALISM_AUDIT auf Branch
codex/ai-test-realism-audit. Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket. Prüfe nicht nur Helper-Ausgaben, sondern
ob der reale Live-Pfad die Fehlentscheidung unter plausiblen Alternativen und
Engine-nahen Zuständen sichtbar macht. Führe Paketchecks aus, committe jedes
abgeschlossene Paket und dokumentiere Residualrisiken. Bei Sicherheitsblocker:
stoppe, schreibe einen Blocker-Report mit Removal Condition. Nach ATR-05 final
verifizieren, aktuelles main defensiv abgleichen, lokal nach main mergen, main
prüfen, Worktree entfernen und das Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Gruppen- und Anzahlübersicht ist ausgegeben.
- Vollständige dateiweise Auditabdeckung ist nachvollziehbar.
- Kritische zu enge Tests wurden realistisch gehärtet.
- Live-Runtime- und Engine-Szenario-Evidence deckt die priorisierten
  Fehlfunktionsklassen ab.
- Aktive KI-Gates sind grün oder ein echter Blocker ist mit Removal Condition
  dokumentiert.
- Alle Pakete sind einzeln committed und der Branch ist lokal nach `main`
  integriert.
