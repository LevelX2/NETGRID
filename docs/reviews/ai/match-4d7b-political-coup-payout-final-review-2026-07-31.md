# Match 4D7B: Political-Coup-Auszahlung – Final Review

## Ergebnis

Der Corp-Auszahlungsfehler aus `match_4d7bd0eba9138d83`, Decision 57 und
StateVersion 123 ist behoben. Bei null Credits waren sowohl Basic Credit für
einen Credit als auch die Engine-zertifizierte Political-Coup-Fähigkeit für
drei allgemeine Credits zu je einem Klick legal. Vor dem Fix band
`corp.economy` ausschließlich Basic Credit; der spielgleich erfasste
Checkpoint reproduzierte dies als `behavior_regression`.

`corp.economy` erkennt nun generisch exakt gequotete Hosted-Credit-Auszahlungen
aus eigenen sichtbaren Kartenquellen in installierten Remotes und in der Score
Area. Die Route wird nur aufgenommen, wenn LegalAction, Karteninstanz,
Quellzone, Kosten und Projektion übereinstimmen und die Auszahlung sofort,
garantiert, uneingeschränkt sowie netto pro Klick strikt besser als Basic
Credit ist. Nach genau einer gebundenen Auszahlung wird neu geplant.

## Architekturprüfung

- Fachlicher Owner bleibt `corp.economy` mit Capability
  `develop_or_convert_corp_economy`.
- Der Plan bindet die aktuelle `activated_card_ability` und konkrete
  Karteninstanz; es gibt keine Political-Coup-ID- oder Namensregel.
- Es entstand kein Resolver, Override, Fallback oder zweiter
  Aktionsentscheider.
- Engine, LegalActions, PlayerViews, Replay, StateHash und Hidden-Info-Vertrag
  wurden nicht geändert.
- Der Gegenfall mit nur einem verbleibenden auszahlbaren Credit lässt Basic
  Credit weiterhin zu. Ungequotete, eingeschränkte, zufällige oder
  nachteilige Auszahlungen werden durch diesen Vertrag nicht zugelassen.

## Regressionsevidence

- Checkpoint:
  `data/scenarios/ai-decision-checkpoints/cp-4d7bd0eb-01-political-coup-before-basic-credit-d57.json`
- Vor Fix: Zielentscheidung rot mit `behavior_regression`; Ein-Credit-Gegenfall
  grün.
- Nach Fix: Zielentscheidung und Gegenfall grün.
- Erwarteter Plan: `corp.economy`.
- Erwartete Evidence:
  `corp_engine_certified_visible_card_payout:onr_v1_209_political-coup`.

## Metadaten-Gate

`focusedDecisionTest` wird nun gegen eine vorhandene `.test.ts`-Datei und den
benannten Testtitel geprüft. Vier Verweise auf die gelöschte
`packages/ai/src/index.test.ts` wurden bereinigt: zwei besitzen aktuelle,
belegbare Ersetzungen; zwei unbelegte Altverweise wurden entfernt. Political
Coup verweist auf den neuen Live-Checkpoint.

## Verifikation

- fokussierter Checkpoint und Runtime-Nachbarschaft: 171 Tests grün;
- `test:ai:plans`: 63 Dateien, 616 Tests grün;
- `test:ai:runtime`: 177 Dateien, 1.644 Tests grün;
- `test:ai:checkpoints`: 78 Dateien, 439 Tests grün;
- `test:ai:shards`: drei parallele Shards, 544 Datei-Shards und 4.446 Tests
  grün in 236,6 Sekunden;
- AI-Typecheck mit 8-GB-Node-Heap: grün;
- AI-Hint-Metadaten, AI-Source-Struktur, Economy-Vertrag,
  Card-Function-Abstraction, Format und Diff-Hygiene: grün.

Der erste AI-Typecheck-Versuch erreichte ausschließlich das bisherige
4-GB-Node-Heaplimit. Derselbe Typecheck lief mit größerem Heap ohne Typfehler
durch.

## Offene Punkte

Keine offenen Punkte innerhalb dieses Fehlerumfangs.
