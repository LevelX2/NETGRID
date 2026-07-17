# Finalreview: Match 414365 Run-Sicherheit (2026-07-17)

Status: abgeschlossen und lokal nach `main` integriert

## Entscheidung

Der vollständige Audit von `match_414365c726112bf4` ist in vier eng
begrenzten Consumer-Korrekturen umgesetzt:

1. `Running Interference` erhält in der Handentwicklung vor seinem
   Kredittext die Rolle eines Run-Events.
2. Eine legale Entfernung eines persistenten Trace-Markierungszählers erhält
   im letzten Klick die nötige Priorität.
3. Ein Start-Run wird im letzten Klick ausgeschlossen, wenn ausschließlich
   sichtbare Pfadinformationen einen unvermeidbaren Trace-Markierungszähler
   belegen und die legale Zählerentfernung verfügbar ist.
4. Die Suchfähigkeit von `Schematics Search Engine` wird ausschließlich aus
   Regeltext, Typ und Subtypen abgeleitet, nie aus Titel oder Card-ID.

Die Lösung konsumiert nur actor-sichere PlayerView-, LegalAction- und
Run-Risk-Semantik. Sie ergänzt keine Engine-Regel und liest keine verdeckten
Corp-Karten.

## Bewusst erhaltene Grenzen

Der Ausschluss ist keine pauschale Run-Sperre. Ein Prüfrun in unbekanntes
erstes ICE bleibt legal, ebenso bekannte bezahlbare oder payoff-starke Wege.
Er greift nur beim letzten Klick, mit sichtbarem unvermeidbarem
Trace-Markierungszähler und gleichzeitig vorhandener legaler Entfernung. Das
verhindert den D59-Fehler, ohne den Informationswert früher Proberuns zu
verlieren.

`Eurocorpse` war im 45-Karten-Deck dieses Matches nicht enthalten und ist
daher kein Matchbefund. Die vorhandene Eurocorpse-Checkpoint-Suite ist dennoch
Teil der Abschlussregression. Auch die weiche Portfolio-Kadenz bleibt grün:
`bankPortfolioActionsThisTurn` ist weiterhin kein absolutes Einmal-Limit,
sondern nur ein gegen sinnlose Wiederholung gewichteter Kontextwert.

## Evidence und Verifikation

- Die drei historischen Fehlentscheidungen D32, D54 und D59 sind als
  spielgleiche Decision-Checkpoints abgesichert; die D52-Entmarkierung bleibt
  eine grüne Gegenprobe. Die frühere D2-Warmup-Drift ist separat dokumentiert
  und wurde nicht als neuer Befund behandelt.
- 12 fokussierte und angrenzende Testdateien mit 210 Tests, darunter
  Eurocorpse- und Portfolio-Verträge, sind grün.
- `corepack pnpm --filter @netgrid/ai typecheck` und `corepack pnpm check:ai`
  sind grün. Die bekannten Hint-/Derived-Facts-Warnungen bleiben unverändert
  und nicht blockierend.
- Die drei AI-Shards sind mit 371 Dateien und 2.557 Tests grün. `git diff
  --check` bildet die mechanische Abschlussprüfung dieses Pakets.
- Der breite Lauf deckte außerdem eine Hint-Signal-Überlagerung auf:
  `program_preserves_run_goal` darf eine reine Programmsuche nicht als
  Run-Event umklassifizieren. Die Priorität verwendet deshalb den sichtbaren
  Kartentext selbst; der Match-03575-R&D-Gegenvertrag bleibt grün.

Führende Vorstufe: `docs/reviews/ai/ai-match-414365-run-safety-red-evidence-2026-07-17.md`.

Die geprüften Paketcommits wurden ausschließlich lokal nach `main`
integriert. Es gab keinen Push und keinen Pull Request.
