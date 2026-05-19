---
activityId: act-2026-05-19-corp-ai-installed-asset-economy-bbs
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-17-bbs-whispering-campaign-credit-badge
  - act-2026-05-18-runner-ai-resource-economy-plan
  - act-2026-05-17-runner-ai-remote-trash-affordability
resultArtifacts:
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "installed Corp economy|BBS|economy-recovery"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Corp-KI: Installierte Asset-Economy von BBS Whispering Campaign nutzen

## Ziel

Die Corp-KI soll sichtbare installierte/rezzed Economy-Aktionen von Korp-Assets wie `BBS Whispering Campaign` als echte Economy verstehen und gegen die normale 1-Credit-Aktion bewerten. Wenn eine legale `[A]: Take 2`-Aktion von `BBS Whispering Campaign` verfügbar ist, soll sie in typischen Economy-Lagen nicht dreimal die normale 1-Credit-Aktion wählen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-19: Die KI spielte Corp. Früh im Spiel lag eine installierte und gerezzte `BBS Whispering Campaign` mit Bits/Credits darauf. Statt die Kartenaktion zu nutzen, nahm die Corp-KI dreimal über die normale Aktion jeweils 1 Credit.
- Regel-/Kartenerwartung laut Nutzer: `BBS Whispering Campaign` bekommt beim Rezzen 16 Bits/Credits. Für eine Aktion kann die Corp 2 Credits von der Karte nehmen. Wenn alle Bits entfernt sind, wird die Karte getrasht.
- Lokale Kartendaten:
  - `packages/shared/src/index.ts` enthält `onr_v1_309_bbs-whispering-campaign`.
  - `data/cards/originalset-v1-cards.json` beschreibt die Aktion als `A: Take [2] from BBS Whispering Campaign.`
  - `apps/web/app/action-board-ui.ts` kennt `BBS Whispering Campaign` bereits als Stored-Credit-Quelle.
- Verwandte erledigte Arbeiten:
  - `act-2026-05-17-bbs-whispering-campaign-credit-badge`: sichtbare Credits/Bits auf der Karte.
  - `act-2026-05-18-runner-ai-resource-economy-plan`: Runner-KI bewertet installierte Economy-`trigger_ability`-LegalActions generischer.
  - `act-2026-05-17-runner-ai-remote-trash-affordability`: Runner-KI kennt `BBS Whispering Campaign` als sichtbares, wertvolles Korp-Economy-Asset im Remote.

## Scope

- Reproduktionsfixture für Corp-KI: Corp hat eine installierte und rezzed `BBS Whispering Campaign` mit mindestens 2 gespeicherten Bits/Credits; die legale Kartenaktion steht im Corp-Hauptfenster zur Verfügung; die normale 1-Credit-Aktion steht ebenfalls zur Verfügung.
- Prüfen, ob die Engine die Kartenaktion korrekt als LegalAction in den AI-Input projiziert:
  - Seite `corp`,
  - passende Action-Kosten/Klickkosten,
  - sichtbare Source-Card-Referenz,
  - strukturierte Economy-Payloads wie `gainCreditsAmount`, `removePowerCounterAmount`, `counterType`, `cardId` oder bestehende äquivalente Felder.
- Falls die LegalAction oder Economy-Payload für die KI fehlt: Engine-/DTO-Lücke als Teil dieses Pakets schließen oder ein enges vorgeschaltetes Hotfix-Paket anlegen, wenn der Schnitt größer wird.
- Falls die LegalAction vorhanden ist: Corp-Plan-/Scoring-Logik so ergänzen, dass installierte Korp-Economy-Aktionen nach sichtbarem Netto-Creditwert bewertet werden und eine `[A]: gain 2`-Quelle nicht gegen die normale `[A]: gain 1`-Aktion verliert.
- Die Lösung soll nicht nur den Kartennamen hardcoden. `BBS Whispering Campaign` ist der Regressionsanker; die primäre Erkennung soll über LegalAction-Typ, Kosten, Economy-Payload, gespeicherte Counter und sichtbare Source laufen.
- Bestehende Corp-Economy-Planung weiter respektieren: Kartenaktion nutzen, wenn Credits benötigt werden oder kein stärkerer Plan anliegt; nicht blind jedes Mal auslösen, wenn Scoring, Rez, Install oder Run-Abwehr klar wichtiger ist.
- Debug-/Evidence-Felder oder Reason-Codes ergänzen, z. B. `installed_corp_economy`, `economy_action_kind`, `stored_credits`, `immediate_gain`, `normal_credit_baseline`, `corp_credit_need`.

## Nicht im Scope

- Keine Änderung an den Kartendaten von `BBS Whispering Campaign`, sofern die Engine-Regeln bereits korrekt sind.
- Keine UI-Änderung an Credit-Badges oder Kartenanzeige; das ist durch ein eigenes erledigtes Paket abgedeckt.
- Keine vollständige allgemeine Corp-KI-Neuschreibung.
- Keine Hidden-Info-Auswertung: Die KI darf nur PlayerView, LegalActions, sichtbare installierte Karten, side-sichere PublicEvents und eigene zulässige Informationen nutzen.
- Keine Änderung an Replay, StateHash oder Engine-Regelautorität außer dort, wo eine fehlende LegalAction-/Payload-Projektion tatsächlich nachgewiesen wird.

## Akzeptanzkriterien

- [x] Ein AI-Test reproduziert den Befund: rezzed `BBS Whispering Campaign` mit gespeicherten Bits/Credits, verfügbare Kartenaktion und normale 1-Credit-Aktion; die Corp-KI wählt in einer klaren Economy-Lage die BBS-Aktion.
- [x] Die KI bewertet die BBS-Aktion als unmittelbaren sichtbaren Economy-Gewinn von 2 Credits und damit besser als eine einzelne normale 1-Credit-Aktion, solange keine wichtigere legale Aktion höher priorisiert werden muss.
- [x] Die Aktion wird nur gewählt, wenn sie legal ist und die Source noch installiert/rezzed sowie mit ausreichenden gespeicherten Bits/Credits versehen ist.
- [x] Die Bewertung nutzt strukturierte LegalAction-/Payload-Daten statt UI-Labels als Primärquelle.
- [x] Debug/Evidence bleibt side-sicher und enthält keine verdeckten Karteninformationen.
- [x] Bestehende Corp-KI-Regressionen für Economy, Remote-Scoring, Rez-Entscheidungen und Agenda-Schutz bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/corp-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/input-dto.ts`
  - `packages/ai/src/index.test.ts`
  - bei fehlender LegalAction-/Payload-Projektion zusätzlich `packages/engine/src/index.ts`
- Der Runner-Fix `act-2026-05-18-runner-ai-resource-economy-plan` kann als Muster dienen: installierte Economy-Aktionen über sichtbare `trigger_ability`-LegalActions, Payloads, Kosten und gespeicherte Counter klassifizieren.
- Für Corp sollte die Gewichtung in einen bestehenden Economy-/Recovery-Plan eingebunden werden, nicht als pauschaler Bonus für beliebige `trigger_ability`.
- `BBS Whispering Campaign` sollte als Regression auftauchen, die generische Logik aber auch für ähnliche Korp-Asset-Economy anschlussfähig machen.

## Ergebnisnotiz

Abgeschlossen. Die Korp-Plan-KI erkennt installierte, gerezzte Corp-Economy-Aktionen anhand strukturierter LegalAction-/Payload-Daten, sichtbarer Source und gespeicherter Counter. BBS Whispering Campaign wird als `installed_corp_economy`-Pool-Payout mit 2 Credits bewertet und im `recover_economy`-Plan gegenüber Basic Credit priorisiert. Die Regression nutzt eine echte Engine+AI-Fixture mit rezzed BBS, 16 Bits, BBS-Aktion und Basic Credit nebeneinander; Debug/Evidence bleibt ohne FullState-/PrivatePayload-Daten.
