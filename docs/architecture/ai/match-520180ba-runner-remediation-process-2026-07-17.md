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
erforderliche Breaker gegen vermeidbaren Abwurf und gegen Selbstschaden mit
unverhältnismäßigem Coverage-Risiko, sofern die historische Checkpoint-Evidence
einen roten produktiven Runtime-Fall liefert.

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

- Handlimit/Funding: D189 sowie D200 oder D207 mit positiver Credit-Alternative
  und enger Handpuffer-Gegenprobe.
- Run-Lock: D206 mit akzeptabler Freischaltungs- und Folge-Run-Menge;
  Gegenproben für unterfinanzierte und letzte-Klick-Situationen.
- HQ-Repeat: D151 oder D168 mit positiver Funding-Alternative;
  Gegenprobe für einen ersten, sinnvollen Informationsrun.
- Breaker-Erhalt: D199 nur übernehmen, falls der produktive aktuelle
  Choice-Runner eine rote, eindeutig reproduzierbare Wahl zeigt.

Done-Gate: Jede übernommene Fixture ist schema-valide; Zieltests zeigen
`behavior_regression`, Gegenproben bleiben grün. Nicht reproduzierbare
historische Kandidaten werden als solche dokumentiert und nicht gefixt.

### P2 — Generische Runtime- und Choice-Anpassungen

- Produktive Credit-Alternativen bei Handlimit und konkret finanzierbaren
  Handkarten korrekt in Überlauf-Score und Plan-Mapping einbeziehen.
- Run-Lock-Folgepfade mit einem strukturierten allgemeinen und eingeschränkten
  Creditbudget bewerten.
- Wiederholte HQ-Runs gegen sichtbare Tag-/Trace- und Selbsttagkosten sowie
  wiederholt leeren Access revalidieren; ein erster Informationsrun bleibt
  zulässig.
- Nur falls P1 rot belegt ist: sichtbare benötigte Breaker im Abwurf- und
  Selbstschaden-Risiko priorisieren.

Done-Gate: Unveränderte rote Zieltests werden grün, alle engen Gegenproben
bleiben grün, und neue Unit-Tests decken jede generische Grenze ab.

### P3 — Verifikation, Wissenspflege und Integration

- Fokussierte Tests, angrenzende Decision-Checkpoints, Typecheck,
  `git diff --check` sowie AI-Shards beziehungsweise Full-Gate ausführen.
- Evidence- und Final-Review unter `docs/reviews/ai/` schreiben.
- Relevante dauerhafte Erkenntnisse im Monatslog ergänzen.
- Nach sauberer Worktree-Verifikation lokal nach `main` mergen, den Worktree
  entfernen und den gemergten Arbeitsbranch löschen.

## Verbindliches Goal

`/Goal Arbeite den Prozess Match-520180ba-Runner-Remediation vollständig und
sequenziell von P1 bis P3 im Worktree
C:\Projekte\NETGRID_AI_MATCH_5201_RUNNER auf Branch
codex/ai-match-5201-runner-remediation ab. Capture historische Checkpoints
strict vor jedem Fix, übernimm nur rote behavior_regression-Fälle, verifiziere
Ziel- und Gegenproben, committe jedes Paket und merge den sauberen Abschluss
lokal nach main. Nutze den Hauptworkspace nur für den finalen Merge und ändere
keine fremden UI-Dateien.`
