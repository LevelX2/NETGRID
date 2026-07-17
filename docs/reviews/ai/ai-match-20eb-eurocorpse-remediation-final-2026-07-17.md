# Abschluss: KI-Runner-Remediation für Match 20EB mit Eurocorpse-Fokus (2026-07-17)

Status: Implementierung und vollständige Verifikation abgeschlossen

## Ergebnis

Die fünf vor der Produktionsänderung reproduzierten
`behavior_regression`-Verträge aus Match `match_20eb121f1a2b3b1b` sind auf
dem finalen Arbeitsstand unverändert grün. Die Korrekturen sind
kartennamenfrei, verwenden ausschließlich LegalActions, PlayerViews und
öffentliche Eventdaten und verändern weder Engine-Regeln noch Replay-,
StateHash- oder Hidden-Info-Grenzen.

Die Nutzerklärung zur Bankkadenz ist ausdrücklich umgesetzt:
`maxActionsPerTurn: 1` ist eine weiche Normalfrequenz für
Hintergrundaktionen. Eine zweite oder weitere Bankladung im selben Zug ist
weiter legal und kann gewählt werden, wenn keine wirklich sinnvolle
Alternative vorhanden ist. Nur die unerkannte Wiederholung mit einer
wertvollen Alternative oder ohne ausreichenden Zeithorizont wird
abgewertet.

## Eurocorpse-Nutzung im analysierten Spiel

Im Match wurde Eurocorpse™ Spin Chip an D55 leer installiert. Der danach im
Grip verfügbare zweite Krash wurde an D59 bis D61 trotz legaler
Hosting-Aktion nicht gehostet. Beide Bits blieben bis Spielende auf der
Karte; der normal installierte Krash bezahlte alle Pump-/Break-Kosten aus
normalen Credits. Eurocorpse leistete damit im gesamten Spiel weder einen
Hosting- noch einen Creditbeitrag.

Die Engine- und LegalAction-Seite war dabei korrekt. Die Remediation greift
deshalb im Consumer- und Timingverhalten:

- Eine Hosting-Hardware wird nicht mehr allein wegen einer abstrakten
  Economy-Rolle erzwungen, wenn kein passender Breaker unmittelbar hostbar
  ist.
- Ein konkreter legaler Hosting-Schritt erhält Wert aus Breaker-Relevanz,
  wiederkehrender Finanzierung und Zielprofil.
- Vermeidbarer Basic-Draw-Überlauf verdrängt einen produktiven
  Hosting-Schritt nicht mehr.
- Die vorhandene Engine-Semantik zum Einsatz der Bits für den gehosteten
  Breaker blieb unverändert; das Match zeigte hier keinen Enginefehler.

## Geschlossene Verhaltensverträge

### F1 – Run-Sperre mit realem Folgepfad

D54 löst die bezahlbare Sperre nun, wenn nach Zahlung noch Clicks, Credits,
installierte Breakerabdeckung und ein sichtbarer erreichbarer Folgepfad
verbleiben. Gegenproben verhindern eine letzte-Click-Freigabe und begrenzen
teurere spekulative Freigaben unterhalb des eigenen Matchpoints. Eine
unmittelbare Terminalbedrohung bleibt ein eigener harter Grund.

### F2 – Eurocorpse installieren und tatsächlich vorbereiten

D55 installiert Eurocorpse nicht mehr leer gegen eine bessere Aktion. D59
bevorzugt das konkrete Krash-Hosting gegenüber weiterem Überlauf-Draw. Eine
enge Gegenprobe erhält die Installation, sobald ein passender Breaker sofort
hostbar ist.

### F3 – Erwarteten Draw-Überlauf berücksichtigen

Basic Draw berücksichtigt nun effektives Handlimit, verbleibende Aktionen,
erwarteten End-of-turn-Überlauf und produktive Alternativen. Draw bleibt
unterhalb des Limits sowie bei echtem Defense-, Such- oder Handpufferbedarf
zulässig.

### F4 – Hintergrundbank weich takten

Die Zahl beobachteter Bankaktionen wird aus PlanMemory und dem öffentlichen
Counter-Zuwachs der Aktivierung fortgeschrieben. Das Portfolio verwendet die
Normalfrequenz als Ranking-Schwelle statt als Eligibility-Verbot. Nach der
Schwelle sinkt der Beitrag, wenn eine sinnvolle Alternative existiert; ohne
solche Alternative bleibt wiederholtes Laden wählbar. D39 und die
synthetische Wiederholungs-Gegenprobe sichern beide Seiten dieses Vertrags.

### F5 – Amortisationshorizont beachten

D129 beginnt oder verlängert am gegnerischen Matchpoint keine verzögerte
Bankinvestition ohne konkreten oder terminalen Finanzierungsbedarf. Frühe
erste Ladungen und kurzfristig notwendige Finanzierung bleiben positiv
abgesichert.

## Durch die Vollverifikation geschlossene Nachbargrenzen

Die drei vollständigen AI-Shards deckten zusätzliche Wechselwirkungen auf,
die vor Abschluss mit eigenen Tests eingegrenzt wurden:

- Broker darf bei alleiniger sinnvoller Economy-Option weiter bis zum
  Zielwert geladen werden, soll bei komfortablem Gesamtpool und produktiver
  Handentwicklung aber halten.
- Eine teure Run-Lock-Freigabe bleibt unterhalb des eigenen Matchpoints
  spekulativ; günstige oder terminal relevante Freigaben bleiben erhalten.
- Auf einem offenen Server wird der kostenlose Basis-Run gegenüber einem
  bezahlten Run-Event bevorzugt.
- SeeYa erhält Schadens-Aufklärungswert nur für eine tatsächlich verdeckte
  Remote-Rootkarte, nicht allein für verdecktes Remote-ICE.
- Ein schwach kumulatives Entwicklungs-Duplikat darf einem klar besseren
  Basis-Draw weichen; der historische MRAM-Vertrag bleibt damit erhalten.
- Der R&D-Interface-Hint verwendet den gültigen Rollenbegriff
  `rd_pressure`; aktive und kompilierte Vertragsassertionen sind synchron.

## Verifikation auf dem finalen Arbeitsstand

| Gate                                   | Ergebnis                                    |
| -------------------------------------- | ------------------------------------------- |
| Match-20EB-Checkpointdatei             | 10/10 Tests grün                            |
| Fokussierte Match- und Grenzsuite      | 12 Dateien, 249/249 Tests grün              |
| AI-Shard 1                             | 120 Dateien, 811/811 Tests grün             |
| AI-Shard 2                             | 119 Dateien, 869/869 Tests grün             |
| AI-Shard 3                             | 119 Dateien, 834/834 Tests grün             |
| AI-Typecheck                           | grün                                        |
| `check:ai`                             | grün                                        |
| AI-Hint-Qualitätsgate                  | grün, 0 Fehler; 156 bestehende Warnhinweise |
| Compiled-Hints-/Inspector-Regeneration | grün                                        |
| `git diff --check`                     | grün                                        |

In Summe liefen die drei vollständigen AI-Shards mit 2.514 Tests in 358
Testdateien grün. Die Warnhinweise der Hint-Analyse sind nicht blockierend;
der im Lauf entdeckte unbekannte R&D-Rollenalias wurde behoben.

## Paketcommits

1. `15a3f64b1` – `docs(ai): plan match 20eb runner remediation`
2. `bdeba14ce` – `test(ai): capture match 20eb runner regressions`
3. `ba2c873c2` – `fix(ai): improve runner development action timing`
4. `0f2cf620b` – `fix(ai): soften runner bank cadence and horizon`
5. `8ab975679` – `fix(ai): preserve broker portfolio arbitration`
6. `e9743048a` – `fix(ai): preserve established runner decision boundaries`
7. `74e852e6e` – `test(ai): align R&D pressure role contract`

## Bewusste Grenzen

- Es wurde kein kompletter neuer Selfplay-Durchlauf als Abnahmebedingung
  eingeführt; die spielgleichen Strict-Warmup-Checkpoints und alle AI-Shards
  bilden den deterministischen Verhaltensvertrag.
- Die historischen Expectations wurden nach dem roten Nachweis nicht
  abgeschwächt.
- Es gibt keine Match-, Seed-, Decision-, Instanz- oder Eurocorpse-ID-
  Sonderregel im Produktionscode.
- Push und Pull Request sind nicht Bestandteil dieses lokalen Prozesses.
