# Runner-KI: Krash nicht pumpen, wenn Keeper trotzdem nicht brechbar ist

- id: act-2026-05-18-runner-ai-useless-krash-pump-on-keeper
- status: done
- priority: high
- kind: fix
- area: ai
- primaryAgent: card-enablement-ai-knowledge-agent
- created: 2026-05-18
- startedAt: 2026-05-18
- completedAt: 2026-05-18
- requiresImplementation: true
- releaseTarget: runner-ai-encounter-valuation

## Ziel

Die Runner-KI soll einen Icebreaker nicht pumpen, wenn der Pump auch nach Zahlung der Kosten keinen sinnvollen, legalen und bezahlbaren Break gegen das aktuell begegnete ICE ermöglicht.

## Kontext

Playtest-Fund vom 2026-05-18:

- Runner-KI startet einen Run auf HQ.
- Die Corp rezzt `Keeper`; die Begegnung beginnt.
- Die Runner-KI hat `Krash` und nur 2 Credits.
- Die KI gibt 2 Credits für `Krash`-Pump aus.
- Danach kann sie `Keeper` trotzdem nicht brechen; ungebrochene Subroutinen lösen aus und der Run endet.

Das Pumpen ist in dieser Situation wirtschaftlich und taktisch sinnlos. Der Entscheidungswert muss erkennen, dass ein Pump nur dann sinnvoll ist, wenn er anschließend mindestens einen relevanten Break ermöglicht oder eine andere explizit bewertete, legale Begegnungsfolge verbessert.

Quelle: Nutzer-Screenshot und Spielchronik im Chat vom 2026-05-18.

## Bezug zu bestehenden Arbeiten

Relevante Vorarbeiten:

- `docs/activities/done/act-2026-05-17-runner-ai-krash-unnecessary-pump-chronicle.md`
- `docs/activities/done/act-2026-05-17-runner-ai-post-break-access-hotfix.md`
- `docs/activities/done/act-2026-05-17-runner-ai-remote-trash-affordability.md`

Dieses Paket ist ein Follow-up zur Pump-/Break-Bewertung in Begegnungen: Bereits gelöste Fälle dürfen nicht regressieren; zusätzlich muss die KI Fälle erkennen, in denen Pumpkosten bezahlt werden, aber danach kein bezahlbarer Break gegen das aktuelle ICE erreichbar ist.

## Scope

- Runner-AI-Bewertung von `pump_breaker`-Aktionen während einer ICE-Begegnung prüfen und korrigieren.
- Pump nur positiv bewerten, wenn nach dem Pump mit den verbleibenden Credits ein legaler, relevanter Break gegen ungebrochene Subroutinen möglich ist.
- Speziell ETR-Fälle absichern: Wenn eine `End the run`-Subroutine trotz Pump ungebrochen bleibt und keine sinnvolle Alternative entsteht, darf die KI den Pump nicht wählen.
- Regression für `Krash` mit 2 Credits gegen gerezzten `Keeper` im HQ-Run anlegen.
- Bestehende sinnvolle Pump-Fälle erhalten, in denen der Pump tatsächlich einen anschließenden Break ermöglicht.
- Decision-Debug/Evidence nur aus side-sicheren Informationen ableiten.

## Nicht im Scope

- Keine Änderung an `Keeper`-, `Krash`- oder Kartendaten.
- Keine Änderung an Engine-Regeln, `LegalActions`, `applyAction`, Replay oder StateHash, außer die Implementierung zeigt eine echte, minimal zu dokumentierende Metadatenlücke.
- Keine Nutzung verdeckter HQ-, Hand-, Deck- oder unrezzed ICE-Informationen.
- Keine breite Run-Target-Strategie oder Remote-Trash-Affordability-Änderung.

## Akzeptanzkriterien

- [x] Ein AI-Test reproduziert den Fall: HQ-Run, gerezzter `Keeper`, Runner mit `Krash` und 2 Credits; die gewählte Aktion ist nicht `pump_breaker`.
- [x] Die Bewertung erkennt, dass der Pump keinen anschließenden bezahlbaren Break ermöglicht.
- [x] Die Ableitung nutzt nur `PlayerView`, `LegalActions`, öffentliche Kartendaten und side-sichere Encounter-Informationen.
- [x] Bestehende Regressionsfälle für Krash-Pump/Break bleiben grün, insbesondere Fälle, in denen Pumpen tatsächlich einen sinnvollen Break ermöglicht.
- [x] Die Chronik zeigt nach dem Fix keinen sinnlosen Pump vor unvermeidbar ungebrochenem ETR mehr.
- [x] Keine verdeckten Kartendaten gelangen in AI-Inputs, Decision-Debug, PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Logs oder Client-Fehler.

## Umsetzungshinweise

Voraussichtliche Startpunkte:

- `packages/ai/src/index.ts`
- `packages/ai/src/visible-run-analysis.ts`
- `packages/ai/src/index.test.ts`

Beim Implementieren insbesondere prüfen, ob die bestehende Pump-Bewertung nur Breaker/ICE-Kompatibilität und ungebrochene Subroutinen betrachtet, aber nicht die verbleibende Bezahlbarkeit nach Pumpkosten und Breakkosten. Falls benötigte LegalAction-Metadaten fehlen, nur eine minimale side-sichere Ergänzung vorsehen und diese im Wissen/Log dokumentieren.

## Ergebnisnotiz

Umgesetzt. `pump_breaker` wird gegen sichtbare ETR-ICE nur noch hoch bewertet, wenn nach genau diesem Pump mit den verbleibenden Credits der sichtbare Break-Pfad bezahlbar bleibt. Der reproduzierte HQ-Fall `Krash` mit 2 Credits gegen gerezzten `Keeper` wählt keinen Pump mehr; der bestehende sinnvolle Stärke-Pump-Fall bleibt grün.

## Result Artifacts

- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

## Checks

- `corepack pnpm --filter @netgrid/ai test -- index.test.ts -t "Krash|Keeper|useful pump|Krash/Filter"`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
