---
activityId: act-2026-05-18-runner-ai-resource-economy-plan
status: done
kind: concept
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-18
startedAt: 2026-05-18
completedAt: 2026-05-18
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/input-dto.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "installed Runner economy"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Runner-KI: Installierte Resource-Economy allgemein planen

## Ziel

Die Runner-KI soll installierte Economy-Karten allgemein besser nutzen, statt nur Handkarten-Events oder die normale 1-Credit-Aktion als Economy zu verstehen. Die Logik soll generisch über sichtbare LegalActions, Payloads, Kosten, unmittelbaren Creditgewinn, gespeicherte Counter und zukünftigen Nutzen arbeiten. `Short-Term Contract` und `Broker` sind konkrete Regressionsbeispiele, aber keine Sonderlogik als alleiniger Zielzustand.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-18: Die Runner-KI hat Broker und Short-Term Contract länger installiert liegen, zieht danach aber nur Karten oder nimmt normale 1-Credit-Aktionen, statt die installierten Economy-Karten zu nutzen.
- Beobachtete Lage: Zwei `Short-Term Contract`, ein `Broker` und später zusätzlich `Smith's Pawnshop` liegen im Runner-Rig. Die KI nimmt trotzdem die normale 1-Credit-Aktion.
- Voranalyse vom 2026-05-18:
  - Engine stellt Broker- und Short-Term-Contract-Aktionen als `trigger_ability`-LegalActions bereit.
  - Die Runner-Plan-KI baut `recover_economy` aktuell nur aus `gain_credit` und Economy-Events.
  - Generische `trigger_ability` erhält in der Baseline nur niedrigen Pauschalwert und wird nicht als spezifische Economy verstanden.
- Nutzerpräzisierung vom 2026-05-18: Die Lösung soll nicht nur Broker und Short-Term Contract hartkodieren, sondern ein allgemeineres Muster für installierte Economy-Aktionen schaffen. Broker bleibt komplizierter, weil Load und Take unterschiedliche Planqualitäten haben.
- Verwandte erledigte Activities:
  - `docs/activities/done/act-2026-05-17-runner-two-turn-rig-economy-plan.md`
  - `docs/activities/done/act-2026-05-17-runner-ai-breaker-acquisition-strategy.md`

## Scope

- Runner-KI-Analyse und begrenzte Umsetzung für installierte sichtbare Economy-Aktionen, insbesondere `trigger_ability`-LegalActions mit Economy-Payloads.
- Eine generische Klassifikation für Economy-Aktionen ergänzen, z. B.:
  - direkte Auszahlung: Aktion erhöht Runner-Credits unmittelbar.
  - Pool-Aufbau: Aktion legt sichtbare Credits/Counter auf eine installierte Karte, ohne sofort Runner-Credits zu erhöhen.
  - Pool-Auszahlung: Aktion transferiert sichtbare gespeicherte Credits/Counter von einer installierten Karte zum Runner.
  - Neben-Economy: Aktion kombiniert Credits mit Draw, Install, Trash, Counter-Management oder Selbst-Trash.
- Direkte Auszahlung und Pool-Auszahlung nach Netto-Creditwert, Kosten, Klickkosten und aktuellem Creditbedarf bewerten.
- Pool-Aufbau nicht als Sofort-Economy behandeln, sondern als Plan-/Investment-Aktion mit zukünftigem Nutzen.
- Einen kleinen side-sicheren Economy-Intent oder vergleichbaren Planpfad ergänzen, der Aufbau und spätere Auszahlung installierter Economy-Quellen begründet.
- `Short-Term Contract` als Regression für direkte Resource-Auszahlung aufnehmen.
- `Broker` als Regression für getrennte Pool-Aufbau-/Pool-Auszahlungsentscheidung aufnehmen.
- Debug-/Evidence-Felder oder Reason-Codes so ergänzen, dass Entscheidungen nachvollziehbar bleiben, z. B. `installed_economy`, `economy_action_kind`, `stored_credits`, `immediate_gain`, `future_pool_after`, `economy_need`.
- AI-Regressionen für mindestens zwei unterschiedliche Economy-Muster ergänzen.

## Nicht im Scope

- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung, `applyAction`, Replay oder StateHash.
- Keine Hidden-Info-Auswertung, keine Corp-Hand, keine Corp-Deckliste, kein FullState für KI-Entscheidungen.
- Keine vollständige Economy-KI für alle denkbaren Ressourcen in einem Schritt.
- Keine pauschale Regel, dass Broker immer geladen oder immer sofort ausgezahlt wird.
- Keine Änderung am Kartenpool oder an Kartenfreigaben.
- Keine vollständige Implementierung jeder existierenden Economy-Karte. Weitere Karten wie `Smith's Pawnshop` dürfen nur als Klassifikations- oder Folgepaket-Hinweis auftauchen, wenn der generische Ansatz sie klar anschlussfähig macht.

## Akzeptanzkriterien

- [x] Analyse dokumentiert, wo installierte `trigger_ability`-Economy aktuell aus `recover_economy` herausfällt.
- [x] Es gibt eine generische Klassifikation installierter Economy-LegalActions nach direkter Auszahlung, Pool-Aufbau, Pool-Auszahlung und Neben-Economy.
- [x] Direkte Economy-Aktionen werden nach sichtbarem Netto-Creditgewinn und Kosten gegenüber normalem `gain_credit` bewertet.
- [x] Pool-Aufbau-Aktionen werden nicht als Sofort-Creditgewinn bewertet und verdrängen bei akutem Creditbedarf keine direkte Economy.
- [x] Pool-Auszahlung wird nach sichtbarem gespeicherten Wert bewertet; bei ausreichend hohem Auszahlungwert schlägt sie in einem Economy-Fixture normales `gain_credit`.
- [x] `Short-Term Contract` wird als konkrete Regression für direkte Resource-Auszahlung abgedeckt.
- [x] `Broker take` wird als konkrete Regression für Pool-Auszahlung abgedeckt; bei 3 oder mehr gespeicherten Credits schlägt es in einem Economy-Fixture normales `gain_credit`.
- [x] `Broker load` wird als konkrete Regression für Pool-Aufbau abgedeckt; die KI lädt Broker nur, wenn kein akuter Creditbedarf besteht oder ein klarer zukünftiger Economy-Plan greift.
- [x] Source-Bindung bleibt über vorhandene LegalActions gewahrt; die KI nutzt keine nicht legale zweite Aktion derselben Quelle im selben Timingfenster.
- [x] Debug/Evidence ist side-sicher und nennt keine versteckten Zoneninhalte.
- [x] Bestehende Runner-KI-Regressionsfälle für Breaker-/Zwei-Zug-Economy, R&D-Repeat und Krash-Pump bleiben grün.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `packages/ai/src/runner-plans.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/src/index.test.ts`
- In `runner-plans.ts` prüfen, ob `trigger_ability` gezielt in `PLAN_ACTION_TYPES` aufgenommen werden kann, ohne generische Kartenfähigkeiten unkontrolliert in alle Pläne zu ziehen.
- Für Resource-Economy besser über strukturierte Payloads, Kosten und sichtbare Resultatfelder arbeiten als über UI-Labels:
  - `gainCreditsAmount`, `gainedCredits`, `removePowerCounterAmount`, `addCounterAmount`, `counterType`, `cardId`
  - `resourceAbility: "short_term_contract_take_credits"`
  - `resourceAbility: "broker_take_credits"`
  - `resourceAbility: "broker_load_credits"`
- Karten-IDs dürfen für Regressionen und enge Sonderfälle verwendet werden, die generische Primärlogik sollte aber nicht nur aus einer Liste einzelner Kartennamen bestehen.
- Broker-Bewertung als Spezialfall innerhalb der generischen Pool-Kategorie:
  - Take mit `gainCreditsAmount` oder sichtbarem gespeicherten Counter als unmittelbarer Gewinn.
  - Load mit künftigem Poolwert, aber 0 unmittelbarem Creditgewinn.
  - Load stärker, wenn Credits bereits ausreichend sind, Clicks übrig sind und kein wertvoller Run/Install/Trash anliegt.
  - Load schwächer, wenn sichtbare Break-/Install-/Trash-Schwellen in diesem Zug Credits erfordern.
- Short-Term Contract ist nur der einfache Regressionsanker: legale Take-Aktion ist in der Regel bessere Economy als Basic Credit.
- Die Implementierung soll weiter ausschließlich `PlayerView`, `LegalActions`, side-sichere PublicEvents und eigene sichtbare/known Informationen nutzen.

## Ergebnisnotiz

Umgesetzt in `packages/ai/src/runner-plans.ts`: `recover_economy` berücksichtigt jetzt installierte, sichtbare Runner-`trigger_ability`-LegalActions mit Economy-Payloads. Die bisherige Lücke war, dass der Runner-Planfilter nur `gain_credit` und Economy-/Tempo-Events in den Economy-Plan aufnahm; generische installierte Kartenfähigkeiten blieben dadurch nur niedrig bewertete Baseline-Trigger. Die neue Klassifikation unterscheidet direkte Auszahlung, Pool-Aufbau, Pool-Auszahlung und Neben-Economy anhand von LegalAction-Payload, Kosten und sichtbaren Countern aus dem eigenen Rig.

`packages/ai/src/input-dto.ts` erlaubt die bereits öffentlichen Economy-Payload-Felder auch im AI-LegalAction-DTO, damit die KI nicht über Labels raten muss. `packages/ai/src/index.test.ts` deckt Short-Term Contract als direkte Auszahlung, Broker Take als Pool-Auszahlung ab 3 gespeicherten Credits und Broker Load als Pool-Aufbau ab. Bei akutem Creditbedarf verdrängt Broker Load die normale 1-Credit-Aktion nicht; bei stabiler Economy kann Broker Load als Investment-Aktion gewählt werden. Debug/Evidence bleibt abstrakt (`installed_economy_*`, `economy_need`) und enthält keine versteckten Zoneninhalte.

Checks: `corepack pnpm --filter @netgrid/ai test -- -t "installed Runner economy"` lief grün und führte lokal die komplette `@netgrid/ai`-Testsuite mit 154 Tests aus; `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` waren ebenfalls grün.
