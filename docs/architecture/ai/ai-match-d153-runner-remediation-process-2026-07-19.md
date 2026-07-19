# KI-Runner-Remediation für Match D153 (2026-07-19)

## Status

Umsetzung und Verifikation abgeschlossen; lokale Integration nach `main` steht
noch aus.

## Quelle und Ziel

Ausgangspunkt ist das zuletzt beendete Spiel
`match_d1532f829371a95f`. Die Runner-KI verlor trotz grundsätzlich
funktionsfähigem Rig durch wiederholten HQ-Druck, einen zu lange gebundenen
Remote-Plan, unnötige Encounter-Ausgaben und eine nicht rechtzeitig in
Liquidität umgewandelte Broker-Economy.

Ziel ist eine generische Verbesserung ohne Match-, Karteninstanz- oder
Decksonderregel. Die KI soll öffentliche Gegenindizien für leeres HQ nutzen,
schlechte Runs und stale Pläne aufgeben, Broker-Guthaben als konvertierbare
Run-Finanzierung erkennen und wertvolle Informations- und Closeout-Runs
ausdrücklich erhalten.

## Invarianten

- Die Engine bleibt alleinige Regelautorität; die KI wählt ausschließlich aus
  `LegalActions`.
- HQ-Sättigung verwendet nur PlayerView und öffentliche Events.
- Verteidigungsvernachlässigung ist ein Indiz, kein Wissen über verdeckte
  Karten.
- Bekannte Agenda, Zwei-Punkte-Closeout, neue HQ-Verteidigung und ein günstig
  konvertierbares Erfolgsfenster bleiben positive Gegenbeispiele.
- Broker-Build und -Cash-out werden an exakte strukturierte LegalAction-IDs
  gebunden; Label- oder Kartennamen-Fallbacks sind unzulässig.
- `data/ai/ai-card-hints-active.json` bleibt die einzige statische
  Hint-Semantikquelle.

## Paketfolge und Ergebnis

1. `6828a493e` – zwölf spielgleiche Entscheidungs-Checkpoints mit drei
   positiven Kontrollen.
2. `ccee3f5bb` – exakte Bank-Planbindung, bezahlte Access-Fortsetzung und
   Pump-vor-ETR-Sequenz.
3. `76b74b477` – HQ-Sättigung, stale Plan-Freigabe und Low-Value-Remote-Abbruch.
4. `868377654` – Broker-Cash-out als konvertierbare Run-Finanzierung.
5. `875dcb446` – Hint-/Consumer-Audit v2 und Entfernung der falschen
   Broker-Kapazitätsaussage.
6. `0d99a9e90` – Gegenbeispiele aus den vollständigen AI-Shards präzisiert.

## Abschlussgates

- 12/12 D153-Checkpoints grün.
- 77/77 gemeinsame Match-, Bank-, Hint- und Choice-Regressionen grün.
- drei AI-Shards mit 410 Testdateien und 2.808 Tests grün.
- AI-Typecheck, `check:ai`, Package-Boundaries, Test-Discovery und
  `git diff --check` grün.
- Deck-Hint-/Consumer-Audit: 19 eindeutige Karten, 45 Kopien, null Blocker,
  null Warnungen.

Der monolithische AI-Testaufruf überschritt zunächst die lokale
Fünf-Minuten-Grenze ohne Ergebnis. Die drei offiziellen Shards deckten danach
dieselbe Suite vollständig und erfolgreich ab.
