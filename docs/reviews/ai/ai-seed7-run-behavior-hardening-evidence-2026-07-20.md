# Seed-7-Run-Verhalten – Umsetzungsevidence

Status: Paket 4 grün, finale Gesamtverifikation ausstehend

## Geprüfter Fehlerkorridor

Der Ausgangsstand `19d8375ed` erreichte im Slot
`strategy_panel_net_damage_black_ice` mit Seed
`ai-behavior-baseline-v1-07` das Action-Limit von 480 Aktionen. Die sechs
auffälligen Wiederholungen lagen bei StateVersion 171, 210, 225, 229, 313 und 339. Zustände 168/171 starteten einen bekannten R&D-Pfad mit vier Runner-
Credits, 210 hatte eine bezahlbare Trace-4-Route bei sechs Runner- und null
Corp-Credits, 225/229 benötigten gegen drei Corp-Credits eine nicht gedeckte
Garantie von sieben. 313/339 liefen denselben bekannten Remote 2 trotz zuvor
nicht konvertierter `trash_affordable`-Begründung.

## Umgesetzter Vertrag

- RunTarget, RunPlan und Encounter verwenden dieselbe effektabhängige
  `RunnerRunRouteQuote`.
- Eine `RunnerRunCommitment` bindet Ziel, Route, Kosten, Access-Reserve und
  akzeptierte Risiken an einen side-sicheren sichtbaren Fingerprint.
- `no_access` ist ein hartes Freigabe-Aus; konditionale Routen benötigen ein
  ausdrückliches Probe-, Breaker- oder Agenda-Risiko.
- Ein unverändert positiv und bezahlbar geplantes Trash-Ziel wird beim Access
  mit dem reservierten Betrag ausgeführt. Eine Invalidierung fällt auf die
  aktuelle semantische Bewertung zurück.
- Wiederholungsdiagnostik vergleicht vorhandene sichtbare
  Entscheidungsfingerprints und bleibt reine Diagnostik. Es gibt weder
  Cooldown noch globale Wiederholungssperre.
- Bank-Cashout benennt den konkreten Run-Server, Funding-Gap und Payoff und
  darf keine `no_access`-Route als finanzierbar umdeuten.
- Eine vollzugriffsbezogene Empfehlung zum weiteren Aufbau sperrt keinen
  eigenständig begründeten Unknown-ICE-Prüfrun, wenn dessen bekannte
  Teilroute finanziert ist. Das bewahrt den positiven 9FEF-F04-Kontrollfall:
  jetzt proben oder ziehen statt drei Klicks lang eine Vollroute zu
  finanzieren.
- Eine Route mit Restricted Breaker Credits bleibt bezahlbar, wenn die
  konkrete Pfadanalyse diese Credits tatsächlich für einen Breaker einsetzen
  kann. Die Quote rechnet nur diesen nachgewiesenen Betrag an; Trace-Gebote,
  Trash-Kosten und andere allgemeine Ausgaben erhalten keinen Zugriff auf den
  Sonderpool.

## Seed-7-Gegenprobe

Konfiguration:

- feste sechs Standard-Slots der AI Behavior Baseline v1;
- Seed `ai-behavior-baseline-v1-07`;
- 480 Aktionen;
- Runner und Corp jeweils `current_candidate`;
- unveränderte Detektoren und Redaction-Prüfung.

Ergebnis:

| Kriterium                                     |                    Ausgangsstand | Kandidat |
| --------------------------------------------- | -------------------------------: | -------: |
| Spiele in der Seed-7-Matrix                   |                                6 |        6 |
| Hard Failures                                 | Action-Limit im betroffenen Slot |        0 |
| Betroffener Slot – Aktionen                   |                              480 |      331 |
| Betroffener Slot – `repeated_no_progress_run` |                                6 |        0 |
| Replay                                        |                             grün |     grün |
| Redaction                                     |                             grün |     grün |

Im Kandidaten startet Remote 2 bei StateVersion 283 mit
`run_commitment_goal:trash_asset_or_upgrade`, reserviert sechs Credits und
führt bei StateVersion 285 `trash_accessed_card` für sechs Credits aus. Der
spätere Run bei StateVersion 325 besitzt einen anderen sichtbaren
Entscheidungsfingerprint und trash’t bei StateVersion 329 erneut. Das belegt
zugleich, dass produktive Wiederholungsruns nicht pauschal unterdrückt werden.

Die exakten Zustände 168, 210 und 225 sind zusätzlich als fokussierte
Routen-/Trace-Gegenproben abgedeckt: Garantie fünf bei vier Credits ist nur
konditional, Garantie vier bei sechs Credits ist bezahlbar und wird mit dem
kleinsten Gewinngebot ausgeführt, Garantie sieben bei sechs Credits ist nicht
garantiert.

## Lokale Rohartefakte

Die vollständigen redigierten Rohdaten bleiben gemäß Baseline-Prozess lokal
und unversioniert:

- Ausgangsstand:
  `C:\Projekte\NETGRID\data\local\ai-behavior-baseline-v1-candidate-19d8375ed-2026-07-20-raw.json`
- Paket-4-Gegenprobe:
  `C:\Projekte\NETGRID_AI_SEED7_RUN_BEHAVIOR_HARDENING\data\local\ai-behavior-baseline-v1-seed07-seed7-hardening-p4-raw.json`

Die vollständige Zehn-Seed-Standardbaseline und alle Gesamtgates werden im
anschließenden Zustand `final_verify` ausgeführt.
