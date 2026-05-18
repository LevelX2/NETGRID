---
activityId: act-2026-05-17-runner-ai-remote-trash-affordability
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-18
completedAt: 2026-05-18
branch:
releaseTarget: runner AI / remote run valuation
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash.*BBS|unknown remote root|post-ICE trash"
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|visible.*run|blocked remote|remote contest"
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
---

# Runner-KI: Remote-Run nur bewerten, wenn Trash nach ICE-Kosten bezahlbar ist

## Ziel

Die Runner-KI soll sichtbare Remote-Runs auf bekannte Asset-/Node-Ziele nur dann als lohnend bewerten, wenn sie nach den sichtbaren ICE-/Breaker-Kosten noch genug Credits für den relevanten Trash- oder Zugriffsnutzen hat.
Offensichtlich sinnlose Aktionen sollen vermieden werden; bei verdeckten Karten darf die KI den Run aber nicht allein wegen unbekannter Trash-/Zugriffskosten abbrechen, sondern muss die Bewertung mindestens bis zur rechtmäßigen Aufdeckung fortführen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-17: Runner-KI lief mit `Krash` und 4 Credits auf ein Fort mit rezzed `BBS Whispering Campaign` hinter rezzed `Data Wall`.
- Lokale Kartendaten:
  - `Krash` (`onr_v1_039_krash`) hat Stärke 0, Break-Kosten 2 und Pump-Kosten 2.
  - `Data Wall` (`onr_v1_237_data-wall`) hat Stärke 0 und eine `End the run`-Subroutine.
  - `BBS Whispering Campaign` (`onr_v1_309_bbs-whispering-campaign`) ist ein rezzed Asset mit Trash-Kosten 4 und Korp-Economy-Nutzen.
- Fachliche Einordnung:
  - Gegen `Data Wall` zahlt der Runner mit `Krash` mindestens 2 Credits zum Brechen und hat danach bei 4 Startcredits nur 2 Credits übrig.
  - `BBS Whispering Campaign` kostet beim Zugriff 4 Credits zum Trashen; der Run kann das bekannte Ziel also nicht entfernen.
  - Nutzerklärung: Offensichtlich sinnlose Aktionen sollen vermieden werden. Bei verdeckten Karten muss der Run aber zumindest bis zur Aufdeckung kommen; unbekannte Karten dürfen nicht so behandelt werden, als sei ihr Trash- oder Zugriffswert schon bekannt.
- Verwandte erledigte Pakete:
  - `docs/activities/done/act-2026-05-17-ai-visible-run-runtime-card-audit.md`
  - `docs/activities/done/act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle.md`
  - `docs/activities/done/act-2026-05-17-runner-ai-post-break-access-hotfix.md`

## Scope

- Runner-KI-Remote-Bewertung um eine Post-ICE-Affordability-Prüfung für sichtbare Asset-/Node-Ziele ergänzen.
- No-Value-Guard nur für rechtmäßig sichtbare oder bekannte Zielinformationen anwenden.
- Sichtbare Kostenkette modellieren:
  - aktuelle Runner-Credits,
  - minimale sichtbare Breaker-/Pump-/Break-Kosten für die rezzed ICE auf dem Fort,
  - verbleibende Credits beim Zugriff,
  - Trash-Kosten oder anderer side-sicherer Zugriffsnutzen des bekannten Ziels.
- Regression für `Krash` mit 4 Credits gegen `Data Wall` vor rezzed `BBS Whispering Campaign`: Run darf nicht als lohnender Remote-Contest gegenüber Economy-/Setup-Alternativen gewinnen, wenn kein anderer side-sicherer Nutzen existiert.
- Gegen verdeckte Remote-Karten Regression oder explizite Testvariante ergänzen: Die KI darf den Run nicht bereits vor der Aufdeckung als offensichtlich sinnlos verwerfen, wenn der relevante Zielwert noch unbekannt ist.

## Nicht im Scope

- Keine Änderung an `Krash`, `Data Wall`, `Data Wall 2.0` oder `BBS Whispering Campaign` Kartendaten.
- Keine pauschale Abschaffung von Remote-Runs auf Assets; der Runner darf laufen, wenn Trash nach ICE-Kosten bezahlbar ist oder ein anderer konkreter side-sicherer Nutzen besteht.
- Keine Hidden-Info-Erweiterung: Die KI darf keine unrezzed Root-Karten, verdeckte Karten im Fort oder verdeckte Zugriffsziele voraussetzen. Gerade deshalb darf der neue No-Value-Guard verdeckte Karten nicht vor der Aufdeckung wie bekannte Trash-Kosten behandeln.
- Keine Änderung an Engine-Regelautorität, LegalActions, Replay oder StateHash, sofern die Engine den Run korrekt anbietet und validiert.

## Akzeptanzkriterien

- [ ] Ein AI-Test reproduziert den Befund: `Krash`, 4 Runner-Credits, rezzed `Data Wall`, rezzed `BBS Whispering Campaign`; die Runner-KI bewertet den Run nicht als guten Remote-Contest, weil Trash nach dem Break nicht bezahlbar ist.
- [ ] Die Bewertung berücksichtigt den bestätigten Fall `Data Wall` ohne Pump.
- [ ] Wenn dieselbe Lage mit ausreichenden Credits erzeugt wird, bleibt der Run grundsätzlich möglich und kann sinnvoll bewertet werden.
- [ ] Ein verdeckter-Remote-Fall belegt: Unbekannte Karten werden nicht vor der Aufdeckung durch den Post-ICE-Trashkosten-Guard als sinnlos verworfen.
- [ ] Die Entscheidung nutzt nur sichtbare Boardinformationen, PlayerView, LegalActions und side-sichere PublicEvents.
- [ ] Bestehende Runner-AI-Regressionen für Krash, sichtbare Runanalyse, Post-Break-Access und sinnvolles Jack-out bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts` für Runner-Action-Scoring und Remote-Run-Wertung.
  - `packages/ai/src/visible-run-analysis.ts` für sichtbare ICE-/Breaker-Kosten.
  - `packages/ai/src/index.test.ts` für die Regression.
- Die Bewertung sollte nicht nur fragen, ob ein ICE brechbar ist, sondern ob der geplante Remote-Zweck nach den sichtbaren Kosten noch erreichbar ist.
- Bei bekannten rezzed Assets mit Trash-Kosten ist ein Run ohne verbleibende Trash-Credits normalerweise nur dann plausibel, wenn die KI einen anderen belegbaren Nutzen hat.

## Ergebnisnotiz

Erledigt am 2026-05-18. `contest_remote` bewertet bekannte sichtbare Asset-/Upgrade-Remote-Ziele jetzt nach sichtbaren ETR-Break-Kosten: `Krash` mit 4 Credits gegen rezzed `Data Wall` vor rezzed `BBS Whispering Campaign` verliert gegen Economy, weil nach dem Break nur 2 Credits für 4 Trashkosten bleiben. Mit 6 Credits bleibt der Remote-Contest möglich. Verdeckte Remote-Roots erzeugen nur eine Deferred-Evidence und keinen Trashkosten-No-Value-Guard vor der rechtmäßigen Aufdeckung.

Checks: `corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash.*BBS|unknown remote root|post-ICE trash"`, `corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|visible.*run|blocked remote|remote contest"`, `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm --filter @netgrid/ai test`.

Offene Folgepunkte: keine innerhalb dieses Pakets.
