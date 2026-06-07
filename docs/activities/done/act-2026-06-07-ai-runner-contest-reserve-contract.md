---
activityId: act-2026-06-07-ai-runner-contest-reserve-contract
status: done
kind: concept
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-06-07
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/architecture/ai/runner-hand-development-creditbase-contract-2026-06-07.md
checks:
  - git diff --check
---

# Runner-Contest-Reserve und Credit-Floor fachlich kalibrieren

## Ziel

Die Runner-KI soll fachlich präziser unterscheiden, ob sie eine Aktion gerade bezahlen kann und ob sie nach dieser Aktion noch handlungsfähig bleibt. Der vorhandene Runner-Handentwicklung-/Creditbase-Vertrag soll um eine dynamische Contest-Reserve geschärft werden, damit die KI im Midgame und Late Game keine unnötigen Score-Fenster für die Korp öffnet.

## Kontext und Quellen

- Nutzerbemerkung vom 2026-06-07: Der Runner darf nicht nur sechs bis sieben Credits aufbauen, sie für eine Aktion ausgeben und danach schutzlos bei null stehen. Wenn Remotes mit Agenda-Gefahr existieren und Eisbrecher grundsätzlich vorhanden sind, soll der Runner tendenziell genug Credits halten, um einen relevanten Run bezahlen zu können.
- Eingefügter Analyse-Text vom 2026-06-07: vorgeschlagen sind eine dynamische `RunnerCreditReservePolicy`, `contestReserve`, `breakerUseReserve`, `developmentReserve`, `emergencyReserve`, `desiredCreditReserve`, Phasen wie Opening/Midgame/Late Contest und Malusregeln für Ausgaben unter Reserve.
- Zusatzgedanke vom 2026-06-07: Die Reserve darf kein starres Sparprogramm werden. Wenn keine akute Remote-Score-Gefahr besteht und ein günstiges, nicht known-low Druckfenster offen ist, soll der Runner trotz Economy-Aufbau gelegentlich Probe-/Pressure-Runs einschieben können.
- Bestehender Vertrag: `docs/architecture/ai/runner-hand-development-creditbase-contract-2026-06-07.md`.
- Erledigte Vorgängerpakete:
  - `docs/activities/done/act-2026-06-07-runner-hand-development-creditbase-contract.md`
  - `docs/activities/done/act-2026-06-07-runner-credit-base-planning.md`
  - `docs/activities/done/act-2026-06-07-runner-development-tactical-mapping.md`
  - `docs/activities/done/act-2026-06-07-runner-development-debug-regression.md`

## Scope

- Den vorhandenen Creditbase-Vertrag prüfen und als kleines Architektur-/Review-Artefakt oder Vertragsnachtrag präzisieren.
- Entscheiden, ob ein eigener Typ wie `RunnerCreditReservePolicy` nötig ist oder ob `RunnerCreditBasePlan`/`RunnerEconomyPosture` erweitert reicht.
- Mindestfelder fachlich festlegen:
  - `phase`: `opening`, `midgame`, `late_contest` oder gleichwertige Einordnung,
  - `currentCredits`,
  - `minimumCreditFloor`,
  - `breakerUseReserve`,
  - `contestReserve`,
  - `developmentReserve`,
  - `emergencyReserve`,
  - `desiredCreditReserve`,
  - `remoteScoreThreat`,
  - `canContestIfFunded`,
  - `belowReserveNow`,
  - `spendingWouldDropBelowReserve`,
  - redigierte Gründe/Evidence.
- Kalibrierungsregeln definieren:
  - Opening darf Setup-Ausgaben eher zulassen.
  - Midgame soll eine echte Creditbasis halten, wenn installierte Breaker oder nützliche Handkarten an Credits hängen.
  - Late Game und sichtbare Remote-Score-Gefahr erhöhen `contestReserve`.
  - Unbekannte Pfadkosten werden konservativ, aber nicht hidden-info-basiert geschätzt.
- Festlegen, dass Reserve-Unterschreitung ein Kostenbewusstsein und Bewertungsmalus ist, keine absolute Sperre. Runs oder Installationen dürfen weiter gewinnen, wenn sie side-sicher hohen Payoff haben oder ein günstiges Druckfenster sinnvoll nutzt.
- Das Folgekonzept `RunnerPressureBudget`/`ProbeAllowance` als getrennte Entscheidungsebene abgrenzen:
  - Reserve schützt vor schlechten Ausgaben und Score-Fenstern.
  - PressureBudget erlaubt begrenzte, günstige Druckaktionen trotz aktivem Economy-Aufbau.
  - Kontrollierte Variation darf nur zwischen sicheren, plausiblen und ähnlich guten Kandidaten greifen.
- Übersteuerungen festlegen:
  - bekannte Agenda oder sehr hoher unmittelbarer Payoff,
  - akuter Remote-Contest,
  - Survival-, Tag-, Damage- oder Trace-Notfall,
  - Aktion beseitigt den aktiven Blocker direkt.

## Nicht im Scope

- Keine Codeänderung.
- Keine neue Strategy-ID und keine neue globale Taktiksignaldatei.
- Keine LegalAction-, Engine-, `applyAction`-, Replay-, StateHash- oder Zufallspfadänderung.
- Keine verdeckten Korp-Karten, keine FullState-/Storage-Interna, keine `privatePayload`s und keine gegnerischen Decklisten.
- Keine starre Regel "immer X Credits behalten" und kein pauschaler Economy-only-Spielstil.
- Keine Umsetzung von `RunnerPressureBudget` oder seeded Variation in diesem Vertragspaket; dafür gibt es ein separates Folgepaket.

## Akzeptanzkriterien

- [x] Der Vertragsnachtrag beschreibt, wie `contestReserve`, `breakerUseReserve`, `developmentReserve`, `emergencyReserve` und `desiredCreditReserve` berechnet oder eingegrenzt werden.
- [x] Die Regeln unterscheiden ausdrücklich zwischen "Run/Aktion bezahlbar" und "nach der Aktion noch handlungsfähig".
- [x] Der Vertrag stellt klar, dass Reservebrüche nicht hart blockiert werden, sondern stärkere Gründe benötigen.
- [x] Das Folgepaket für `RunnerPressureBudget`/ProbeAllowance ist referenziert oder als bewusst separater Scope bestätigt.
- [x] Remote-Score-Threat, Corp-Siegnahe, installierte Breaker und nützliche eigene Handkarten sind als Reserve-Treiber beschrieben.
- [x] Ausnahmen für bekannte Agenda, akuten Contest, Survival und blocker-lösende Aktionen sind enthalten.
- [x] Hidden-Info-, LegalAction-, Engine-, Replay- und StateHash-Grenzen sind als harte Grenzen enthalten.
- [x] Folgepakete für Umsetzung und Regression bleiben passend oder werden konkret angepasst.

## Umsetzungshinweise

- Der bestehende Vertrag soll bevorzugt erweitert werden, statt eine parallele AI-Economy-Welt aufzubauen.
- Werte können Startwerte sein, zum Beispiel Normalreserve 4, Midgame 5 bis 6, Late-/Remote-Threat konservativ 6 bis 8, müssen aber als kalibrierbare Heuristik beschrieben werden.
- Wenn die Analyse zeigt, dass die Implementierung direkt in `RunnerEconomyPosture` genügt, soll kein neuer öffentlicher Typ erzwungen werden.

## Ergebnisnotiz

Abgeschlossen. Der bestehende Creditbase-Vertrag enthält jetzt den Abschnitt `RunnerCreditReservePolicy` mit Phasen, Mindestfeldern, Startwerten, Reserve-Treibern, Malus-/Override-Regeln und der expliziten Abgrenzung zu `RunnerPressureBudget`/ProbeAllowance. Die spätere Umsetzung soll die Policy als Erweiterung von `RunnerEconomyPosture`/`RunnerCreditBasePlan` behandeln, ohne neue Strategy-ID oder parallele Economy-Welt.
