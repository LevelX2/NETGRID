# Final Review: Corp-KI und vorbereitete Shell-Traders-Breaker

**Activity:** `act-2026-07-27-corp-ai-shell-traders-prepared-breaker-threat`

**Stand:** abgeschlossen am 27.07.2026
**Entscheidungsnachweis:** `match_0c77a1fb8540644a`, D9, StateVersion 14

## Ergebnis

Die Corp-KI behandelt einen öffentlich vorbereiteten, im nächsten Runner-Zug
ohne Klick installierbaren Breaker jetzt als konkrete Score-Protection-
Gegenroute. Reicht die öffentlich sichtbare Runner-Ressource einschließlich
der verpflichtenden Shell-Counter-Entfernung, darf ein reines ETR-ICE keine
geschützte Agenda-Install-/Advance-Route begründen. Im historischen Checkpoint
verwirft die KI deshalb `Corporate Retreat` auf `remote_1` und wählt legal
`draw_card` im Plan `corp.defend_servers`.

## Nachweis und Modellgrenzen

- Der side-sichere Checkpoint enthält nur das öffentliche Event-Präfix, die
  Corp-PlayerView, LegalActions und Runtime-Zustand. Mit dem unveränderten
  Verhalten reproduzierte er die fehlerhafte Agenda-Installation als
  `behavior_regression`.
- Die neue Projektion nutzt ausschließlich die öffentliche Shell-Traders-
  Sonderzone, öffentliche Rig-/Memory-/Credit-Fakten und Kartendefinitions-
  Mechaniken (`shell_counter`, `delayed_install`). Es gibt keine Karten-ID-
  oder Kartennamen-Sonderregel.
- Die Rechnung entfernt erst die automatisch zu Beginn des nächsten
  Runner-Zugs verlorenen Shell-Counter, berechnet nur den verbleibenden
  bezahlten Entfernen-/Installationsaufwand und übergibt anschließend den
  verbleibenden Betrag an die vorhandene kanonische Pump-/Break-Projektion.
- Verdeckte, unvollständige, nicht kompatible oder nicht finanzierbare Fakten
  bleiben fail-closed. Die AI-DTO erhält dafür nur bereits in der Corp-
  PlayerView vorhandene öffentliche gegnerische Memory-Werte.
- Die frühere Score-Install-Ausnahme für unsichere vorbereitete ETR-Hinweise
  wurde entfernt; eine unbekannte Score-Protection-Quote kann die Route nicht
  mehr freigeben.

Ein vollständiger Capture ab dem Matchanfang scheiterte bereits an einer
unabhängigen historischen `invalid_support_graph`-Drift bei D3. Der Capture
ab Decision-Index 7 reproduziert den zwei Entscheidungen später liegenden
historischen D9-Zustand deterministisch und ist der verwendete Nachweis.

## Prüfungen

- `pnpm --filter @netgrid/ai typecheck` — grün.
- Fokussierte Checkpoint-, Score-Protection-, DTO- und Shell-Traders-Tests —
  76 Tests grün.
- Erweiterte betroffene Runtime-/Checkpoint-Suite — 146 Tests grün.
- `pnpm --filter @netgrid/ai test` wurde angestoßen; der Tool-Wrapper lief in
  sein Zeitlimit, ohne einen verwertbaren Abschlussstatus zurückzuliefern.
  Der Prozess war anschließend nicht mehr aktiv. Die vollständige Suite ist
  daher als nicht abschließend verifiziert dokumentiert, nicht als grün.

Der Deck-Hint-/Consumer-Audit zum Checkpoint erzeugte
`ai-match-0c77a1fb-prepared-shell-traders-breaker-hint-consumer-audit-2026-07-27.json`.
Er meldet zwei vorhandene, unabhängige Blocker für `BBS Whispering Campaign`
und `Red Herrings`; diese Änderung ergänzt keine Hintdaten oder
Consumer-Verträge und erzeugt keine neuen Audit-Findings.
