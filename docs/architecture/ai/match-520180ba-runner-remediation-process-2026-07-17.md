# Match 520180ba Runner-Remediation

## Status

Aktiv. Freigegebene spielgleiche Runner-KI-Remediation für
`match_520180ba217781ad`.

## Quelle und Ziel

Der Runner verlor eine Partie gegen einen menschlichen Corp durch drei
verbundene, side-safe belegte Entscheidungsfamilien:

1. eine Handentwicklungs- und Funding-Arbitration zog am oder über dem
   effektiven Handlimit weiter und erzwang Abwürfe;
2. eine Run-Lock-Freischaltung am Matchpoint verlor eingeschränkte
   Breaker-Credits in einer nachgelagerten Budgetprüfung;
3. ein absoluter HQ-Druckplan wiederholte tagteure, erfolglose Runs und
   revalidierte weder sichtbare Tagkosten noch den fehlenden Access-Ertrag.

Die Untersuchung zeigte zudem zwei verlorene `Early Worm`-Kopien. Ein
Deck-Tutor existierte nicht; der aktuelle Scope schützt daher keine
kartenspezifische Ziehreihenfolge. Er schützt generisch sichtbare,
erforderliche Breaker gegen Selbstschaden mit unverhältnismäßigem
Coverage-Risiko, sofern die historische Checkpoint-Evidence einen roten
produktiven Runtime-Fall liefert.

### Ergebnis der strikten Capture-Prüfung

Die Captures für D189, D200, D206, D207, D151 und D168 stoppen bereits in
der Strict-Warmup bei D119 mit `warmup_behavior_drift`: Historisch wurde die
Run-Fortsetzung gewählt, aktuell wird eine Pump-Aktion gewählt. Die
historischen Zielzustände sind damit nicht spielgleich erreichbar. Diese
Funde werden nicht mit `rebase` verdeckt und erhalten in diesem Paket keine
Runtime-Änderung.

D118 wurde strikt erreicht, ist aber der erste HQ-Informationsrun und damit
keine valide Negativ-Fixierung. Die Fixture bleibt als grüne Gegenprobe: Ein
erster sinnvoller HQ-Run muss zulässig bleiben. Die späteren Wiederholungen
D151/D168 bleiben wegen des D119-Drifts offen.

Der Strict-Capture für D98 ist reproduzierbar rot: Die KI spielt eine
unvermeidbare Core-Damage-Ökonomieaktion, obwohl sie damit mit 50 Prozent
Wahrscheinlichkeit die einzige sichtbare Wall-Breaker-Coverage verliert.
Nur dieser Befund ist für P2 produktive Evidence.

## Annahmen und Nicht-Ziele

- Alle Entscheidungen verwenden ausschließlich Engine-erzeugte
  `LegalActions`, side-sichere `PlayerView` und das historische öffentliche
  Ereignispräfix.
- Keine Corp-Hidden-Zonen, keine Deckreihenfolge und keine kartenspezifischen
  Sonderregeln werden in die KI eingebracht.
- `Library Search` und `Schematics Search Engine` werden nicht als Tutor
  umgedeutet.
- Ein einzelner Tag ohne sichtbaren Payoff bleibt nicht pauschal verboten.
  Maßgeblich sind sichtbare Ressourcen, Bereinigungskosten, Runpfad,
  Wiederholungsertrag und Score-Druck.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Eingeschränkte Credits dürfen nur für ihre erlaubten Breakkosten zählen.
- Plan-Mapping darf einen fachlich besseren Rohscore nicht ohne aktuelle,
  konkrete Ziel- und Risikorevalidation absolut blockieren.
- Der endgültige Choice- und Action-Weg bleibt in `decisionChain` side-safe
  nachvollziehbar.

## Paketfolge

### P1 — Historische Checkpoints und Red-Evidence

Capture aus dem Match mit `--warmup-policy strict`, Fixture-Validierung und
roter `behavior_regression`-Nachweis:

- Handlimit/Funding, Run-Lock und HQ-Repeat: Strict-Captures versucht, aber
  wegen des unabhängigen D119-Warmup-Drifts nicht übernehmbar.
- Erster HQ-Informationsrun D118: strikt erfasste grüne Gegenprobe.
- Breaker-Erhalt D98: strikt erfasste rote Selbstschaden-Entscheidung.

Done-Gate: Jede übernommene Fixture ist schema-valide; Zieltests zeigen
`behavior_regression`, Gegenproben bleiben grün. Nicht reproduzierbare
historische Kandidaten werden als solche dokumentiert und nicht gefixt.

### P2 — Generische Runtime- und Choice-Anpassungen

- Sichtbare notwendige Breaker gegen unvermeidbaren Selbstschaden mit
  mindestens 50 Prozent Verlustwahrscheinlichkeit schützen, solange kein
  unmittelbarer Sieg vorliegt.
- Der Schutz bleibt generisch: Er verwendet nur sichtbare Handkarten,
  sichtbare ICE-Coverage und die semantische Selbstschaden-Kostenstruktur.
- Die erste HQ-Informationsrun-Gegenprobe bleibt grün.

Done-Gate: Unveränderte rote Zieltests werden grün, alle engen Gegenproben
bleiben grün, und neue Unit-Tests decken jede generische Grenze ab.

### P2-Ergebnis

- Die Engine legt für jede Do-the-Drine-LegalAction nun gewählte
  Damage-Menge, Damage-Typ und Nichtverhinderbarkeit offen in der
  actor-privaten Action ab.
- Der AI-Input-DTO übernimmt ausschließlich diese vier side-sicheren
  Kostenfelder (`xValue`, `damageCannotBePrevented`, `damageType`,
  `damageAmount`); unbekannte Payload-Felder bleiben gesperrt.
- Die Runtime schließt unvermeidbaren Selbstschaden aus, wenn genau eine
  sichtbare Handkarte eine aktuell blockierende Breaker-Coverage liefert und
  die Damage-Menge mindestens die Hälfte der verbleibenden Hand treffen kann.
  Ein unmittelbarer Sieg bleibt ausgenommen.
- Zielcheckpoint D98 ist grün; die D118-Gegenprobe für den ersten
  HQ-Informationsrun bleibt grün.

### P3 — Verifikation, Wissenspflege und Integration

- Fokussierte Tests, angrenzende Decision-Checkpoints, Typecheck,
  `git diff --check` sowie AI-Shards beziehungsweise Full-Gate ausführen.
- Evidence- und Final-Review unter `docs/reviews/ai/` schreiben.
- Relevante dauerhafte Erkenntnisse im Monatslog ergänzen.
- Nach sauberer Worktree-Verifikation lokal nach `main` mergen, den Worktree
  entfernen und den gemergten Arbeitsbranch löschen.

### P3-Ergebnis

- Fokussierter Lauf: 21 Tests in vier Dateien grün.
- `@netgrid/ai`- und `@netgrid/engine`-Typecheck grün.
- `check:ai` grün; die drei AI-Shards schließen 369 Dateien und 2.550 Tests
  grün.
- `git diff --check` grün.
- Finalreview und Wissenslog verweisen auf die nicht übernommenen
  Strict-Drift-Funde sowie den geschlossenen D98-Vertrag.

## Verbindliches Goal

`/Goal Arbeite den Prozess Match-520180ba-Runner-Remediation vollständig und
sequenziell von P1 bis P3 im Worktree
C:\Projekte\NETGRID_AI_MATCH_5201_RUNNER auf Branch
codex/ai-match-5201-runner-remediation ab. Capture historische Checkpoints
strict vor jedem Fix, übernimm nur rote behavior_regression-Fälle, verifiziere
Ziel- und Gegenproben, committe jedes Paket und merge den sauberen Abschluss
lokal nach main. Nutze den Hauptworkspace nur für den finalen Merge und ändere
keine fremden UI-Dateien.`
