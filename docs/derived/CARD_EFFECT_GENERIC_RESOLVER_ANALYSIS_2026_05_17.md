# Card-Effect Generic Resolver Analysis 2026-05-17

## Befund Hoch: Kartenspezifische Dispatch-Dichte in der Engine

`packages/engine/src/index.ts` enthält aktuell grob 244 direkte `definition.id`-/`sourceDefinition.id`-Abfragen. Besonders dicht ist der Bereich der LegalAction-Erzeugung für installierte Corp-Root-Karten und Score-Area-Aktionen: u. a. Trace-Assets, Hidden-Zone-Assets, Counter-Assets, Economy-Assets, Action-Assets und einzelne scored Agenda-Aktionen werden dort nacheinander über ID-Sets oder Einzel-IDs verzweigt.

Risiko: Neue Karten mit ähnlichem Verhalten werden leicht als weitere Einzelroutinen ergänzt. Dadurch wachsen `getLegalActions`, `performAction`, PublicPayload-Allowlisting und Tests parallel, obwohl sich viele Fähigkeiten nur in Kosten, Betrag, Countertyp, Timing oder Zielmenge unterscheiden.

Konkrete Anker:

- `packages/engine/src/index.ts:3200` bis `packages/engine/src/index.ts:3517`: rezzed Corp Asset/Node LegalActions.
- `packages/engine/src/index.ts:6886` bis `packages/engine/src/index.ts:7040`: `gain_credit`-Resolverzweige für mehrere Ability-Familien.
- `packages/engine/src/index.ts:14994`: generischer Ansatz für Agenda-Counter-Operations ist bereits vorhanden.
- `packages/engine/src/index.ts:16024`: neue Investment-Firm-Choice ist korrekt, aber noch als Einzelresolver umgesetzt.
- `packages/engine/src/index.ts:20513` bis `packages/engine/src/index.ts:20535`: Ability-Payload-Schlüssel werden einzeln in Action-IDs aufgenommen.

Empfehlung: Nicht pauschal umbauen. Zuerst kleine Familien generalisieren, bei denen Kosten, Menge und Zieltyp klar parametrisierbar sind.

## Befund Hoch: Economy-/Action-Fähigkeiten sind die beste erste Resolverfamilie

Es gibt bereits gute Vorläufer: `CORP_ECONOMY_ASSET_CARD_IDS` und `CORP_RECURRING_ASSET_CARD_IDS` in `packages/engine/src/mechanics/payment-costs.ts`, `ACTION_ASSET_CARD_IDS` in `packages/engine/src/mechanics/agenda-scoring.ts` und der neue Investment-Firm-Pfad. Diese Familien sind aber noch Set-basiert oder einzelkartenbasiert, nicht als gemeinsame Ability-Definition mit Kosten, Betrag und Timing modelliert.

Risiko: Karten wie `South African Mining Corp`, einfache Economy Nodes, scored Agenda-Aktionen und Basic-Credit-Replacements werden weiter als einzelne Sonderfälle wachsen. Das ist besonders problematisch, weil sie alle dieselben harten Grenzen brauchen: LegalAction-Ableitung, `applyAction`-Revalidation, PublicPayload, PlayerView-Counter und Replay/StateHash.

Empfehlung: Eine kleine `EconomyActionProfile`-Familie einführen, nicht als freie Skriptsprache. Profilfelder reichen zunächst: `sourceDefinitionId`, `actionType`, `side`, `timing`, `clickCost`, `creditCost`, `creditGain`, optional `counterAdd`, optional `trashSource`, optional `replacementOfBasicCredit`.

## Befund Mittel: Counter-/Credit-Pools sind schon verstreut generisch

Die Engine hat stabile Counter-Helfer (`cardCounter`, `setCardCounter`, `addCardCounter`, `spendCardCounter`) und mehrere wiederkehrende Spezialnutzer: recurring credits, Krumz bits, Paris City Grid pool, Hacker Tracker counters, Spinn Public Relations bits, Investment Firm recurring credits.

Risiko: Counter werden korrekt gespeichert, aber die Zahlungs-/Ausgabequellen sind je Familie verteilt. Dadurch muss jede neue Karte selbst entscheiden, ob Counter sichtbar sind, wie sie ausgegeben werden und welche PublicPayload-Felder gesetzt werden.

Konkrete Anker:

- `packages/engine/src/index.ts:19582` bis `packages/engine/src/index.ts:19641`: Krumz und Paris City Grid als eigene Trace-Pools.
- `packages/engine/src/index.ts:22318` bis `packages/engine/src/index.ts:22334`: generische Counter-Helfer.
- `packages/engine/src/index.ts:22656` bis `packages/engine/src/index.ts:22977`: mehrere Runner-Recurring-/Stealth-Credit-Quellen.
- `apps/web/app/page.tsx:11314` bis `apps/web/app/page.tsx:11337`: sichtbare `recurring_credit`-Darstellung.

Empfehlung: Counter-Pools nicht vollständig vereinheitlichen, aber eine gemeinsame Profil- und Payload-Hilfe für "Counter auf Karte legen", "Counter ausgeben" und "Counter refreshen" schneiden.

## Befund Mittel: Gute generische Muster existieren bereits

Es gibt bereits belastbare Muster, die als Zielmodell dienen können:

- `RUNTIME_DAMAGE_PREVENTION_PROFILES` in `packages/engine/src/mechanics/damage-prevention.ts` parametrisiert mehrere Prevention-Karten.
- `openReplacementWindow`, `collectReplacementCandidates` und `resolveReplacementChoice` in `packages/engine/src/index.ts:13901` bis `packages/engine/src/index.ts:14313` trennen Fenster, Kandidaten und Entscheidung.
- `resolveAgendaCounterOperation` in `packages/engine/src/index.ts:14994` nutzt eine begrenzte generische Operation-Familie.
- Mechanics-Module unter `packages/engine/src/mechanics/` sammeln ID-Sets und Konstanten bereits nach Effektfamilien.

Empfehlung: Diese Muster formal als "Profile + generischer Resolver + fokussierter Test pro Familie" dokumentieren und neue Karten nach diesem Muster schneiden.

## Zielmodell

Parametrisierte generische Effekte sollen explizite, typisierte Profile sein. Sie ersetzen keine Rules Engine und keine Runtime-Validierung.

Pflichtgrenzen:

- LegalActions bleiben die einzige Aktionsbasis für UI, Server, KI und menschliche Spieler.
- `applyAction` revalidiert Side, Timing, Quelle, Kosten, Ziele, Choice und aktuellen Install-/Rez-/Zone-Zustand.
- Hidden-Info-Daten bleiben aus PlayerViews, PublicEvents, Server-Payloads, Replays und KI-Inputs heraus.
- Replay und StateHash bleiben deterministisch; Zufall läuft weiter nur über Seed, RandomCounter und RandomDrawRecords.
- Generische Profile dürfen nur deklarative Parameter enthalten, keine freie Skriptlogik.

Echte Sonderfälle bleiben erlaubt, müssen aber als Ausnahme erkennbar sein: komplexe Multi-Step-Hidden-Zone-Aktionen, einzigartige Run-State-Manipulationen, Replacement-Konflikte oder Effekte mit spezieller UI-/Choice-Struktur.

## Priorisierte Folgepakete

1. Generic Economy Action Resolver
   - Ziel: einfache installierte/scored Economy-Aktionen und Basic-Credit-Replacements über Profile abbilden.
   - Musterkarten: einfache Corp Economy Assets, `South African Mining Corp`, `Investment Firm`.

2. Generic Counter/Credit Pool Resolver
   - Ziel: Counter auf Karten legen, refreshen und ausgeben über gemeinsame Profil-/Payload-Helfer.
   - Musterkarten: `Investment Firm`, `Spinn Public Relations`, Krumz/Paris-City-Grid-Pools als Analysegrenze.

3. Generic Scored Agenda Action Resolver
   - Ziel: scored Agenda-Aktionen mit Click-/Credit-/Counterkosten und einfachen Effekten als Familie modellieren.
   - Musterkarten: `Detroit Police Contract`, `Netwatch Operations Office`, `Private Cybernet Police`, vorhandene Counter-Agenda-Familien.

4. Ability Payload Metadata Consolidation
   - Ziel: Ability-Payload-Schlüssel und PublicPayload-Allowlisting nicht pro Releasefamilie duplizieren.
   - Muster: `v1917AssetAbility`, `v1918UpgradeAbility`, `v1919AssetAbility`, `v1920AssetAbility` usw.

## Entscheidung

Umsetzungsbedarf ist bestätigt. Die wichtigste Grenze ist nicht fehlende Abstraktion an sich, sondern die wachsende Doppelpflege zwischen LegalAction-Erzeugung, Resolver, PublicPayload, Tests und UI-Aktionsdarstellung. Die nächsten Schritte sollen klein bleiben und jeweils eine Effektfamilie mit wenigen Musterkarten generalisieren.
