# Match ECFE3CE: Broker-Portfolio-Economy-Prozess 2026-07-16

## Status

P4 zur Integration freigegeben. Die Umsetzung und die spielgleichen
Broker-Checkpoints sind grün. Die kausale Verhaltensbaseline zeigt gegenüber
dem exakten Vorher-Stand ein zusätzliches Spiel am Aktionslimit (3 statt 2).
Der Nutzer hat diese Abweichung am 16. Juli 2026 ausdrücklich akzeptiert und
die Integration für weitere Prüfung in echten Spielen freigegeben.

## Quelle und Gesamtziel

Quelle ist der vollständige 208/208-Decision-Audit von
`match_ecfe3ce373a56823` samt Broker-Census. Verzögerte Runner-Economy soll
mehrere installierte Banken als Portfolio spielen: in freien Aufbauaktionen
möglichst jede noch unbenutzte Quelle bedienen, beide Kopien in einen
normalen Reifebereich um 12 Credits entwickeln, Liquidität unter Druck
gezielt herstellen und gespeicherten Gesamtwert gegenüber einem einzelnen
Basic Credit korrekt bewerten.

## Arbeitsstrang

- Worktree: `C:\Projekte\NETGRID_AI_BROKER_PORTFOLIO_ECONOMY`
- Branch: `codex/ai-broker-portfolio-economy`
- Integrationsbranch: lokaler `main`
- kein Push und kein Pull Request

## Präzisierte fachliche Annahmen

- Es gibt keine starre Regel, immer die reifere oder immer die leerere Kopie
  zu laden. Zwei Banken dürfen bewusst parallel aufgebaut werden.
- 12 gespeicherte Credits sind ein normaler Reifebereich, kein hartes Limit.
  Aufbau auf 15 oder 18 bleibt zulässig.
- Eine zweite Kopie ist in der Aufbauphase grundsätzlich erwünscht, wenn
  Installation und zeitnaher Aufbau Reserve und akute Konvertierung nicht
  verdrängen. Sie ist nicht allein deshalb schlecht, weil eine erste Kopie
  bereits geladen ist.
- Ohne unmittelbaren Liquiditätsbedarf schlägt ein legaler 3-Credit-Load den
  einzelnen Basic Credit, insbesondere auf dem letzten Klick.
- Cashout mit 3 oder 6 bleibt für konkret finanzierte dringende Aktionen
  möglich. Unter 5 liquiden Credits entsteht zusätzlich ein legitimer
  Reaktionsreserve-Bedarf.
- Bei 12 entscheidet sichtbarer Druck und Liquidität. Bei 15 oder 18 ist ein
  Cashout in einen noch nicht komfortablen Pool regelmäßig sinnvoll. Bei
  ungefähr 20 liquiden Credits besteht ohne konkretes Ziel kein pauschaler
  Cashout-Zwang.

## Invarianten und Nicht-Ziele

- Nur side-safe `PlayerView`, `LegalActions`, Plan-, RunTarget- und
  Strategic-Intent-Signale verwenden.
- Keine Broker-Karten-ID-Sonderregel; der Vertrag gilt generisch für
  verzögerte Credit-Banken mit per-source Aktivierung.
- Engine, Kartentext, Hint und `once_per_turn_per_source` bleiben unverändert.
- Historische D179-, D180- und D191-Wahlen nicht vorab als Fehler festlegen.
  Sie werden auf aktuellem Code als Portfolio-Fälle reproduziert und nur bei
  fachlich rotem Ergebnis verändert.
- Keine versteckte Kenntnis des späteren Spielendes. Endgame und Druck nur aus
  dem damaligen sichtbaren Score-, Klick-, Plan- und Payoff-Zustand ableiten.

## Paketfolge

### P0 – Preflight und Prozessvertrag

- sauberen `main`-Stand und separaten Worktree sichern;
- freigegebene Portfolio- und Cashout-Grenzen dokumentieren;
- Prozessartefakt separat committen.

### P1 – Spielgleiche Evidence und rote Verträge

- D56 und D156 auf aktuellem Code capturen;
- D179, D180 und D191 als ergebnisoffene Mehrkopien-Fälle capturen;
- berechtigte frühe beziehungsweise taktische Cashouts aus D41, D72 und D95
  sowie den reifen Cashout D184 als positive Gegenproben sichern;
- nur `behavior_regression` als roten Beleg akzeptieren;
- Checkpoints, Erwartungen und Red-Evidence vor dem Fix committen.

### P2 – Generischer Bank-Portfolio-Consumer

- pauschalen First-Load-vs.-Continuation-Score durch per-source
  Portfoliofortschritt ersetzen;
- freie Aufbauaktionen mehrerer unbenutzter Banken fördern, ohne akute
  Konvertierung oder Reserve zu verdrängen;
- Installationsprojektion um Aufbauphase, komfortable Liquidität, sichtbaren
  Druck und vorhandene zeitnah nutzbare Quellen ergänzen;
- Load-vs.-Basic-Credit-Gesamtwert und Liquiditätsbedarf trennen;
- Cashout nach konkretem Funding, Reaktionsreserve, Reifebereich und
  komfortablem Credit-Pool bewerten;
- neue Gründe in ScoreBreakdown und DecisionChain sichtbar machen.

### P3 – Verifikation und Regression

- unveränderte roten Checkpoints und alle Gegenproben grün machen;
- direkte Bank-Consumer-, Planportfolio- und Arbitration-Tests ausführen;
- AI-Typecheck, vollständige AI-Suite und Diff-/Format-Hygiene ausführen;
- keine Hint-Gates erzwingen, solange keine Hintdaten geändert werden.

### P4 – Review, Wissen und Integration

- Broker-Audit um die Nutzerpräzisierung und aktuellen Reproduktionsstatus
  korrigieren;
- Final Review, Projektstatus und Monatslog aktualisieren;
- aktuelles `main` defensiv integrieren, Arbeitsbranch lokal nach `main`
  mergen und integriert erneut prüfen;
- sauberen Worktree und gemergten Branch entfernen und doppelt verifizieren.

## Done-Gate

- D156 bevorzugt ohne akuten Liquiditätsbedarf den legalen Load gegenüber dem
  Basic Credit.
- Mehrere Banken werden als nutzbare Quellen eines Portfolios behandelt;
  keine pauschale Mature-first- oder Empty-first-Regel ersetzt den Kontext.
- Zweitinstallation bleibt in einer echten Aufbauphase möglich und wird bei
  akutem Druck, komfortabler Liquidität oder fehlendem Aufbauhorizont
  zurückgestellt.
- Cashouts decken Notfall, Reaktionsreserve und reifen Liquiditätstransfer ab,
  ohne unreife Banken grundlos zu leeren.
- Historische rote Ziele, positive Gegenproben, fokussierte Tests und
  AI-Typecheck sind grün.
- Die Verhaltensbaseline bleibt mit 3 statt 2 Spielen am Aktionslimit als
  bekannte Abweichung dokumentiert; die Freigabe erfolgt bewusst für den
  Praxistest.
- `main` ist sauber integriert; Worktree und Branch sind entfernt.
