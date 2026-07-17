# KI-Runner-Remediation für Match 20EB mit Eurocorpse-Fokus (2026-07-17)

Status: P4 abgeschlossen, P5 zur lokalen Integration bereit

## Quelle und Zielprüfung

Quelle ist das zuletzt abgeschlossene Match `match_20eb121f1a2b3b1b` aus der
lokalen SQLite-Runtime. Die vollständige Analyse ordnete alle 146 von 146
Runner-KI-Entscheidungen einer AI-Trace zu. Sie belegte fünf voneinander
trennbare Verhaltensverträge:

1. Eine bezahlbare Run-Sperre wird trotz installiertem Breaker und
   verbleibenden Folgeclicks bis zur unmittelbaren Matchpoint-Gefahr nicht
   entfernt.
2. Eurocorpse™ Spin Chip wird ohne aktuell hostbaren Icebreaker installiert;
   ein anschließend verfügbarer Hosting-Schritt wird wiederholt von Draw
   verdrängt. Die zwei Bits bleiben das ganze Match ungenutzt.
3. Basic Draw wird bei vollem oder überfülltem effektiven Grip wiederholt
   gewählt und erzeugt vermeidbare End-of-turn-Discards.
4. Die als `background` definierte Streetware-Bankaktion wird in demselben
   Zug mehrfach voll priorisiert, während der Portfoliozähler bei 0 bleibt
   und eine wirklich sinnvolle Alternative vorhanden ist.
5. Streetware wird am gegnerischen Matchpoint ohne konkreten
   Finanzierungsbedarf und ohne realistische Amortisationszeit weiter
   beladen.

Der Nutzer hat die sequenzielle Umsetzung ausdrücklich freigegeben.

## Gesamtziel und `/Goal`

`/Goal`: Die fünf freigegebenen Findings aus Match 20EB vollständig und
sequenziell als NETGRID-AI-Spielanalyse-Paketprozess abarbeiten:
Prozess- und Evidence-Artefakte erstellen, jeden Fehler spielgleich auf
aktuellem Code mit roten `behavior_regression`-Checkpoints und grünen
Gegenproben sichern, nur reproduzierbare Fehler generisch beheben, fokussiert
und breit verifizieren, jeden Paketschritt committen, den Arbeitsbranch lokal
nach `main` integrieren und anschließend Worktree sowie gemergten Branch
verifiziert entfernen.

- Arbeitsbranch: `codex/ai-match-20eb-eurocorpse`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_20EB_EUROCORPSE`
- Ausgangs-`main`: `e98ae976a7285b1eff37f42cbd4360cd48c7665b`
- Runtime-Datenbank: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Hauptworkspace: nur lesend für Runtime-Evidence und später für den lokalen
  Merge; vorhandene fremde Änderungen bleiben unangetastet
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Erwartungen verwenden ausschließlich damalige Runner-PlayerViews,
  LegalActions, öffentliche Eventpräfixe und erlaubte Runtime-Metadaten.
- Eurocorpse wird kartengenerisch über Hosting-, wiederkehrende
  Breaker-Finanzierungs- und Zielprofilsemantik behandelt; es entsteht keine
  Karten-ID-, Match-, Seed- oder Instanz-Sonderregel.
- Eine Run-Lock-Freigabe wird nur aufgewertet, wenn nach Zahlung und Click ein
  glaubwürdiger, sichtbarer und bezahlbarer Folgepfad verbleibt.
- Draw-Überlauf darf bei akutem Defense-, Search- oder Handqualitätsbedarf
  weiterhin sinnvoll sein; bestraft wird nur vermeidbarer erwarteter
  End-of-turn-Überlauf relativ zu produktiven Alternativen.
- `maxActionsPerTurn: 1` beschreibt für Hintergrundbanken eine weiche
  Normalfrequenz, kein unumstößliches Verbot. Mehrere Ladungen im selben Zug
  bleiben erlaubt, wenn keine wirklich sinnvolle Alternative existiert.
  Späte Investitionen bleiben außerdem erlaubt, wenn ein konkreter oder
  terminaler Finanzierungsbedarf die kurze Amortisationszeit rechtfertigt.
- Engine-Kartentexte, LegalAction-Erzeugung, Replay, StateHash und
  Hidden-Info-Grenzen werden nicht verändert, sofern kein reproduzierbarer
  Engine-Blocker entsteht.
- Bereits grüne historische Funde werden dokumentiert und nicht künstlich
  repariert.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Die KI verwendet nur side-sichere PlayerViews und öffentliche Events.
- Produktionscode wird erst nach einem roten `behavior_regression`-Nachweis
  geändert.
- `engine_legality_drift`, `runtime_state_drift`, Fixture-/Warmup-Drift oder
  Redaction-Fehler gelten nicht als bestätigter Verhaltensfehler.
- Checkpoint-Erwartungen werden nach dem Red-Nachweis nicht abgeschwächt.
- Jede positive Regel erhält mindestens eine eng variierte Gegenprobe.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen Commit.
- Die bereits offenen Änderungen im Hauptworkspace werden weder verändert
  noch überschrieben.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Ist ein historischer Zielvertrag auf aktuellem Code grün, endet sein
  Produktionspaket mit dokumentiertem `no_fix`.
- Erfordert eine Lösung Hidden Info oder eine Aktion außerhalb der
  LegalActions, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler
  blockieren den Abschluss.
- Überschneidet sich eine nötige Dokumentationsänderung mit einer fremden
  uncommitteten Änderung auf `main`, wird ein neues, kollisionsfreies
  Artefakt verwendet oder die Änderung als Restpunkt ausgewiesen.
- Vor Cleanup werden Worktree-Pfad, Branchzuordnung, Cleanliness und
  erfolgreicher Merge einzeln verifiziert.

## State Machine

`preflight -> process_committed -> red_evidence_committed -> runner_development_fixed -> bank_policy_fixed -> verified -> documented -> [merged] -> [cleaned]`

## Paketfolge

### P0 – Prozessbasis, Evidence und isolierter Worktree

- Ziel: Scope, vollständige Decision-Coverage, Eurocorpse-Nutzung, `/Goal`,
  Invarianten, Branch und Worktree dauerhaft dokumentieren.
- Artefakte: dieses Prozessdokument und der Match-Evidence-Bericht.
- Check: `git diff --check`.
- Done-Gate: beide Artefakte sind auf dem Arbeitsbranch committed.
- Commit: `docs(ai): plan match 20eb runner remediation`

### P1 – Spielgleiche rote Decision-Checkpoints

- Ziel: historische Anker vor jeder Produktionsänderung strikt capturen und
  auf unverändertem aktuellem Code validieren.
- Zielverträge:
  - D54: bezahlbare Run-Sperre mit installiertem Breaker, drei Clicks und
    finanzierbarem sichtbarem Folgepfad wird vor einem Low-Need-Draw gelöst.
  - D55: Eurocorpse ohne aktuell hostbaren Breaker wird nicht durch einen
    abstrakten Economy-Plan erzwungen.
  - D59: bei vollem effektiven Grip wird der konkrete Hosting-Schritt oder
    eine andere produktive Aktion dem Basic Draw vorgezogen.
  - D39: eine `background`-Bank wird im selben Zug nicht erneut voll
    priorisiert, wenn ein wertvoller Draw oder eine andere wirklich sinnvolle
    Aktion verfügbar ist.
  - D129: am gegnerischen Matchpoint wird ohne konkreten
    Finanzierungsbedarf keine verzögerte Bankinvestition begonnen oder
    fortgesetzt.
- Gegenproben:
  - keine Run-Lock-Aufwertung ohne Click, Finanzierung oder glaubwürdigen
    Folgepfad;
  - Eurocorpse-Installation bleibt mit sofort hostbarem Breaker plausibel;
  - Draw bleibt unterhalb des erwarteten Handlimits beziehungsweise bei
    akutem Such-/Defensebedarf zulässig;
  - erste frühe Hintergrundbank-Aktion eines Zugs bleibt zulässig;
  - auch eine weitere Hintergrundbank-Aktion bleibt zulässig, wenn keine
    wirklich sinnvolle Alternative verfügbar ist;
  - Bankladung bleibt bei konkretem kurzfristigem Finanzierungsbedarf
    zulässig.
- Done-Gate: historische Zieltests sind ausschließlich als
  `behavior_regression` rot oder ausdrücklich `no_fix`; Gegenproben sind
  grün; separater Commit.
- Commit: `test(ai): capture match 20eb runner regressions`

### P2 – Run-Lock, Eurocorpse-Hosting und Draw-Überlauf härten

- Ziel: nur die in P1 noch roten Verträge in der allgemeinen
  Runner-Handentwicklung, Run-Lock-Bewertung und Action-Arbitration beheben.
- Done-Gate: unveränderte historische Erwartungen und alle Gegenproben sind
  grün; angrenzende Runner-Runtime-/Plan-/Choice-Tests bleiben grün.
- Commit: `fix(ai): improve runner development action timing`

### P3 – Bankkadenz und Amortisationshorizont härten

- Ziel: die vorhandene weiche `background`-Kadenz zuverlässig erkennen,
  Wiederholungen relativ zu wirklich sinnvollen Alternativen abwerten und
  späte Investitionen gegen sichtbare Matchpoint-/Amortisationssignale
  abwägen. Die Kadenz wird nicht als hartes Aktionsverbot umgesetzt.
- Done-Gate: D39/D129 und Gegenproben sind unverändert grün; bestehende
  Bank-, Portfolio- und Economy-Verträge bleiben grün.
- Commit: `fix(ai): soften runner bank cadence and horizon`

### P4 – Verifikation, Final-Report und Wissenspflege

- Pflichtchecks: neue Checkpoints und Gegenproben, angrenzende
  Runtime-/Plan-/Handentwicklungs-/Choice-Tests, AI-Typecheck,
  `check:ai`, realistisch vollständige AI-Testshards und `git diff --check`.
- Artefakte: Red-Evidence, Final-Report und ein kollisionsfreier dauerhafter
  Wissenseintrag unter `docs/architecture/ai/` oder `docs/reviews/ai/`.
- Done-Gate: Checks, Grenzen und bewusst nicht gelaufene Gates dokumentiert;
  Arbeitsbranch sauber.
- Commit: `docs(ai): close match 20eb runner remediation`

P4 wurde zusätzlich durch drei während der Vollverifikation abgegrenzte
Folgecommits stabilisiert:

- `fix(ai): preserve broker portfolio arbitration`
- `fix(ai): preserve established runner decision boundaries`
- `test(ai): align R&D pressure role contract`

Der Final-Report liegt unter
`docs/reviews/ai/ai-match-20eb-eurocorpse-remediation-final-2026-07-17.md`.
Alle drei AI-Shards, der AI-Typecheck, `check:ai`, das Hint-Qualitätsgate und
die fokussierten Match-/Gegenproben sind auf dem dokumentierten Endstand grün.

### P5 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, erneut verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: lokales `main` enthält alle Paketcommits; fremde Änderungen sind
  erhalten; Status und Diff-Hygiene sind grün; Worktree-Pfad und
  Arbeitsbranch existieren nicht mehr.

## Verifikationsregeln

- Historische Expectations bleiben nach ihrem Red-Nachweis unverändert.
- Fokussierte Vitest-Dateien werden direkt aufgerufen.
- Bei fehlendem `node_modules` im Worktree wird der dokumentierte
  Hauptworkspace-Binary-Fallback verwendet oder ein eingefrorener
  Install-Lauf ausgeführt.
- Ein breiter Testfund wird eingegrenzt und auf demselben finalen Code erneut
  geprüft; kein grüner Einzeltest kaschiert einen roten Gesamtvertrag.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_20EB_EUROCORPSE` auf Branch
`codex/ai-match-20eb-eurocorpse`. Arbeite immer nur am aktuellen Paket,
stelle historische Verhaltensverträge vor dem jeweiligen Fix fachlich rot,
ändere ihre Expectations danach nicht und committe jedes abgeschlossene Paket
separat. Nutze den Hauptworkspace erst für Runtime-Evidence und den finalen
Merge. Verändere keine dort bereits offenen Nutzeränderungen.

## Abschlusskriterien

- Alle weiterhin reproduzierbaren Fehler besitzen dauerhafte spielgleiche
  Checkpoints und enge Gegenproben.
- Zieltests waren vor dem Fix rot und sind danach unverändert grün.
- Produktionsänderungen sind generisch, side-safe und kartennamenfrei.
- Eurocorpse wird nicht nur installiert, sondern hinsichtlich tatsächlicher
  Hosting- und Bit-Nutzung überprüft.
- Pflichtchecks und bewusst nicht ausgeführte Checks sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
