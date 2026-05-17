---
activityId: act-2026-05-17-runner-ai-jack-out-after-passing-ice
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: runner AI / run UX
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|last ICE|strength is the missing"
  - corepack pnpm --filter @netgrid/web test -- chronicle.test.ts -t "jack-out|fully broken|breaker pump"
  - corepack pnpm --filter @netgrid/engine test -- index.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
relatedActivities:
  - act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle
---

# Runner-KI: Jack-out nach passiertem ICE und Chroniktext prüfen

## Ziel

Nach einem erfolgreichen Run-Encounter soll die Runner-KI nicht ohne erkennbaren Grund vor dem Zugriff auschecken. Falls ein Jack-out legal und tatsächlich gewählt wird, muss die Chronik klar anzeigen, dass der Run abgebrochen wurde und kein Zugriff stattgefunden hat.

## Kontext und Quellen

- Folgebeobachtung vom 2026-05-17 nach dem erledigten Krash/Filter-Paket `act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle`.
- Nutzer-Screenshot: Die Runner-KI startet einen Run auf R&D, bricht mit `Krash` eine `Filter`-Subroutine, passiert danach das ICE und die oberste Chronikmeldung lautet generisch `Die Runner-KI hat eine legale Aktion ausgeführt.` mit `Hinweis: Jack-out`.
- Code-Indiz: `apps/web/app/chronicle.ts` behandelt `access_card` spezifisch als `auf ... zugegriffen`, hat aber offenbar keinen spezifischen `jack_out`-Fall. Dadurch fällt `jack_out` in den generischen Fallback `eine legale Aktion ausgeführt` mit Label-Hinweis.
- Fachliche Einordnung: Wenn die Chronik newest-first sortiert ist, deutet der Screenshot auf die Reihenfolge `Run gestartet` -> `Subroutine gebrochen` -> `ICE passiert` -> `Jack-out` hin. Das ist kein Zugriff auf die oberste R&D-Karte, sondern ein Run-Abbruch vor dem Zugriff.
- Falls dieser Jack-out nach dem letzten ICE vor R&D/HQ wirklich von der KI gewählt wird, ist das strategisch auffällig: Nach bezahltem Break und passiertem ICE wäre der Zugriff normalerweise der Zweck des Runs.

## Scope

- Reproduzierbaren Testfall für Runner-KI gegen ein einzelnes ICE vor R&D oder HQ anlegen oder bestehenden Test erweitern.
- Prüfen, ob nach `continue_run`/passiertem letztem ICE vor dem Zielserver eine `jack_out`-LegalAction angeboten wird und wie die Runner-KI sie gegenüber Zugriff/Weiterlaufen bewertet.
- Runner-KI-Scoring korrigieren, falls sie nach bereits investierten Credits und passiertem letzten ICE ohne konkreten Nutzen `jack_out` statt Zugriff wählt.
- Chronikdarstellung für `jack_out` ergänzen:
  - spezifischer Titel, z. B. `Die Runner-KI hat den Run abgebrochen`;
  - Beschreibung/Chips sollen klar machen, dass kein Zugriff erfolgt ist;
  - nicht mehr über den generischen System-Fallback `eine legale Aktion ausgeführt`.
- Prüfen, ob die sichtbare Reihenfolge durch newest-first-Sortierung korrekt, aber missverständlich ist. In diesem Fall nur Text/Chronik-Klarheit verbessern, nicht die Sortierung umbauen.

## Nicht im Scope

- Keine erneute Änderung an `Krash`-, `Filter`- oder Breaker-Pump-Logik, sofern das erledigte Paket weiter grün bleibt.
- Keine generelle Runner-KI-Neugewichtung außerhalb der konkreten Jack-out-/Access-Entscheidung nach einem erfolgreichen Encounter.
- Keine Hidden-Info-Erweiterung: Die Runner-KI darf weiterhin nur PlayerView, LegalActions und side-sichere PublicEvents nutzen.
- Kein Redesign der gesamten Chronik.

## Akzeptanzkriterien

- [x] Ein AI-Test deckt den Fall ab, dass die Runner-KI nach passiertem letztem ICE vor R&D/HQ bei sinnvoller Zugriffslage nicht ohne Grund `jack_out` wählt.
- [x] Falls es legitime Gründe für Jack-out gibt, sind diese im Scoring klar abgegrenzt und mit einem Regressionstest abgesichert.
- [x] Die Chronik zeigt `jack_out` als eigenen Run-Abbruch und nicht als generische `legale Aktion`.
- [x] Die Chronik macht erkennbar, dass nach `jack_out` kein Zugriff auf die oberste R&D-Karte bzw. keine HQ-/Serverkarte erfolgt ist.
- [x] Bestehende Krash/Filter-, Runner-AI-, Engine- und Web-Chronik-Regressionen bleiben grün.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`; falls sich der Befund als reine Chronikdarstellung ohne AI-Fehler herausstellt, kann ein kleiner `small-adjustments-agent`-Zuschnitt reichen.
- Wahrscheinliche Startpunkte:
  - `packages/ai/src/index.ts` für Runner-Action-Scoring von `jack_out`, `continue_run` und `access_card`.
  - `packages/ai/src/index.test.ts` für den reproduzierbaren AI-Test.
  - `packages/engine/src/index.ts` für LegalAction-Timingpunkte nur prüfen, nicht ohne Befund umbauen.
  - `apps/web/app/chronicle.ts` und `apps/web/app/chronicle.test.ts` für den spezifischen `jack_out`-Chronikeintrag.
- Im UI-Screenshot ist `access_card` nicht sichtbar. Ein tatsächlicher Zugriff müsste als eigener Zugriffseintrag erscheinen; die generische `Jack-out`-Meldung ist deshalb als Run-Abbruch vor dem Zugriff zu behandeln, bis ein Test das Gegenteil zeigt.

## Ergebnisnotiz

Die Runner-KI wählt nach gebrochenem `Filter` und passiertem letztem ICE vor R&D nun `continue_run` in den Zugriff statt `jack_out`. Dafür wird die side-sichere Run-Position in der PlayerView bereitgestellt, die Runner-Planpriorität im Server-Movement-Fenster angepasst und Jack-out im Baseline-Scoring getrennt als niedriger Nutzen vor Zugriff bzw. sicherer Ausstieg vor weiterer Run-Gefahr beschrieben. Die Chronik rendert `jack_out` als Run-Abbruch mit `Kein Zugriff`; die Reihenfolge bleibt unverändert.
