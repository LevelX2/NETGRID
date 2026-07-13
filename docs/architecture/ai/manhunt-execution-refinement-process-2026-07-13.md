# Manhunt-Ausführungspräzisierung (2026-07-13)

Status: P0 bis P6 abgeschlossen; lokal integriert mit `ea4ceb2b7`

## Quelle und Gesamtziel

Quelle ist das gespeicherte Match `match_fa11540b1f1e08b6` aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`. Die Corp-KI
erkannte im detaillierten Trace `corp.tag_trace_punish` und
`corp.damage_kill` als führende Deckstrategien, setzte deren Hand-, Choice-,
Tag-, Enabler- und Verteidigungssequenzen aber nicht stringent um.

`/Goal`: Die fünf freigegebenen KI-Fehler aus
`match_fa11540b1f1e08b6` einschließlich minimaler wertabhängiger Trace-Bids
sequenziell im eigenen Worktree zuerst als spielgleiche rote
Decision-Checkpoints mit grünen Gegenproben sichern, danach generisch und
planebenenverträglich beheben, vollständig verifizieren, lokal nach `main`
integrieren und Worktree sowie Arbeitsbranch sauber entfernen.

- Arbeitsbranch: `codex/ai-manhunt-execution-refinement`
- Worktree:
  `C:\Projekte\NETGRID_AI_MANHUNT_EXECUTION_REFINEMENT_20260713`
- Ausgangs-`main`: `8dc8ff039`
- Matchmodus: `human_runner_vs_corp_ai`
- KI-Seite und Schwierigkeit: Corp, `hard`
- Endzustand: Runner-Sieg durch leeres R&D bei StateVersion 438
- Deck: `Manhunt Pressure Bureau`, Hash `fnv1a:1e1a582e`

## Freigegebene Fehlerverträge

1. Produktive Choice-Auswahl: Discard- und Trace-Bid-Optionen dürfen nicht
   nur als Shadow gerankt werden. Kernteile der aktiven Tag-/Damage-Strategie
   werden erhalten; ein Trace-Bid überschreitet nie das zur garantierten
   Erfolgsstärke erforderliche Minimum und wird nur bei ausreichendem Wert
   bezahlt.
2. Payoff-gebundene Tags: Eine Tagquelle erhält keinen dominierenden
   Punish-Bonus allein wegen abstrakter Damage-Unterstützung im Deck. Benötigt
   werden eine konkrete ausführbare Folgesequenz, belastbare Tagpersistenz oder
   ein angemessener Tempozweck.
3. Tagmotor-Ausführung: Ein für die aktive Strategie installierter und
   bezahlbarer Enabler wie City Surveillance wird rechtzeitig aktiviert. Die
   Planebene bleibt führend; der Enabler wird als iterativer Schritt
   `deploy -> fund -> rez -> exploit` konkretisiert.
4. Frühe Central-Reaktion: Wiederholte erfolgreiche Zugriffe erzeugen eine
   abklingende Verteidigungsverpflichtung. Knappe ICE-Ressourcen werden nicht
   zugunsten eines nur spekulativen Remotes am betroffenen Central
   vorbeigeplant.
5. Agenda-Inventar: Matchpoint-Schutz richtet sich nach tatsächlich noch
   stehlbaren, der Corp vollständig bekannten Agenda-Punkten. Sind alle
   Agendas verteilt, verdrängt kein leerer HQ-Schutzbonus den letzten
   verbleibenden Damage-Pfad.

## Trace-Bid-Vertrag

Für eine garantierte erfolgreiche Trace gilt:

```text
minimumGuaranteeBid = max(
  0,
  runnerLink + runnerCredits - baseTraceStrength + 1,
)
```

Das Gebot wird durch verfügbare Corp-Credits begrenzt. Bei Base Trace 5 und
Runner-Link 0 gilt: unter 5 Runner-Credits ist das Mindestgebot 0, bei 5
Credits 1 und bei 6 Credits 2. Die Garantie ist kein Selbstzweck: Ohne
ausreichenden Tagwert wird 0 geboten oder die Tagoperation vorher verworfen.
Credits für einen unmittelbar folgenden Payoff bleiben reserviert.

## Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Choices werden ausschließlich aus Engine-Optionen erzeugt und erneut durch
  `applyAction` validiert.
- Verwendet werden nur Corp-PlayerView, side-sichere PublicEvents, eigene
  Hand-/Deckinformationen und ausdrücklich erlaubte Deckstrategie-Metadaten.
- Die Planebene mit StrategicIntent, PlanPortfolio und TacticalPlan bleibt
  führend. Neue Logik liefert Ausführbarkeits-, Reserve-, Inventar- und
  Sequenzsignale; sie baut keine konkurrierende Planhierarchie auf.
- Kein Match-, Seed-, Deck- oder Kartenname wird in Runtime-Logik hart
  codiert. Kartensemantik kommt aus vorhandenen Rollen, Hints und
  LegalActions.
- Jeder Fix benötigt vorher einen separat committeten spielgleichen roten
  Checkpoint und mindestens eine grüne Gegenprobe.
- Nur `behavior_regression` legitimiert einen Verhaltensfix. Legality-,
  Runtime-, Fixture- oder Redaktionsdrift ist zuerst Infrastrukturarbeit.

## Paketfolge

### P0 – Preflight und Prozess

- Fremde Hauptworkspace-Änderungen klassifizieren und unangetastet lassen.
- Worktree, Branch, Quelle, Ziel und Gates festschreiben.
- Done-Gate: sauberer Arbeitsbranch und eigener Prozesscommit.
- Commit: `docs(ai): plan Manhunt execution refinement`

### P1 – Spielgleiche rote Evidence

- Checkpoints für StateVersions 31, 99, 234, 362 und 363 capturen.
- Die Trace-Bid-Choice aus StateVersion 17 oder 235 zusätzlich sichern, falls
  das Fixture dieselbe produktive Choice-Pipeline belastbar ausübt.
- Historische Erwartungen und Gegenproben formulieren.
- Auf unverändertem Code rote Zielverträge und grüne Gegenproben nachweisen.
- Done-Gate: eigener Red-Evidence-Commit vor jeder Runtimeänderung.
- Commit: `test(ai): capture red Manhunt execution decisions`

### P2 – Produktive Choices und Trace-Bids

- Target-Choice-Scoring für Discard und Corp-Trace-Bid produktiv anbinden.
- Strategische Handrollen, Redundanz, Conversion-Paare und Payoff-Reserve in
  Discards berücksichtigen.
- Trace-Bids auf wertabhängiges Mindestgebot begrenzen.
- P1-Choice-Checkpoints und Gegenproben grün machen.
- Commit: `fix(ai): make punish choices value aware`

### P3 – Tag-Conversion und Enabler-Sequenz

- Sofortigen, vorbereiteten und reinen Tempo-Tagwert unterscheiden.
- Falsch-positive abstrakte Damage-Payoffs entfernen.
- Installierte bezahlbare Enabler als konkreten Planfortschritt priorisieren.
- Checkpoints 234 und 362 samt Gegenproben grün machen.
- Commit: `fix(ai): execute tag punish sequences`

### P4 – Central-Reaktion und Agenda-Inventar

- Beobachteten erfolgreichen Central-Zugriff in ICE-Triage einbinden.
- Matchpoint-Schutz an verbleibende stehlbare Agenda-Punkte binden.
- Checkpoints 31 und 363 samt Gegenproben grün machen.
- Commit: `fix(ai): align defense with access and agenda risk`

### P5 – Breite Verifikation und Review

- Alle neuen Checkpoints und Gegenproben ausführen.
- Angrenzende Choice-, Tag-, Punish-, ICE-, Board-Triage- und Planer-Tests
  ausführen.
- AI-Typecheck, `check:ai`, vollständige AI-Suite und passende Behavior-
  Evidence ausführen, soweit technisch realistisch.
- `git diff --check`, Redaktionsschutz und Replay-/LegalAction-Gates prüfen.
- Review und Juli-Projektlog aktualisieren.
- Commit: `docs(ai): finalize Manhunt execution refinement`

### P6 – Lokale Integration und Cleanup

- Fortschritt von `main` defensiv in den Arbeitsbranch übernehmen.
- Konflikte mit fremder Arbeit fachlich lösen; bei uncommittetem
  Hauptworkspace nicht mergen.
- Finale Gates auf dem Integrationsstand wiederholen.
- Arbeitsbranch lokal nach `main` integrieren.
- Worktree in Git und Dateisystem entfernen und den gemergten Branch löschen.
- Done-Gate: sauberer `main`, verifizierte Entfernung und kein Push/PR.

## Abschlusskriterien

- Alle freigegebenen historischen Zielverträge wurden vor dem Fix als rot
  nachgewiesen und laufen unverändert grün.
- Gegenproben verhindern absolute Trace-, Discard-, Tag-, Enabler- oder
  Verteidigungsregeln.
- Keine neue Illegalität, Hidden-Info-, Replay-, Runtime- oder
  Choice-Validierungsregression.
- Review benennt Match, Schichten, Fixes, Grenzen, Gates und Integrationsstand.
- Lokaler Main-Merge und Worktree-/Branch-Cleanup sind vollständig geprüft.
