# Central Defense Credit-Pool and Rez Regression Process

Status: in progress

## Quelle

Live-Debugging des Matches `match_ec735a96b0695d93` auf Build 6225.
Die Corp-KI ließ R&D trotz legaler ICE-Installationen ungeschützt und lehnte
das Rezzen von `Filter` vor HQ wiederholt ab.

## Gesamtziel

Die Corp-KI muss zentrale ICE-Installationen und Rez-Aktionen aus vollständigen,
side-sicheren Fakten bewerten. Ein sichtbarer, aber ohne passenden Breaker
nicht nutzbarer Runner-Credit-Pool sowie ein unbekanntes, als nicht-programm-
förmig bekanntes Rig-Objekt dürfen die gesamte zentrale Verteidigungsbewertung
nicht auf `unknown` setzen. Produktive ICE-Aktionen dürfen deshalb nicht hart
ausgeschlossen und von neutraler Economy verdrängt werden.

## /Goal

Arbeite die Pakete P1 bis P5 sequenziell im Worktree
`C:\Projekte\NETGRID_AI_CENTRAL_DEFENSE_CREDIT_POOL_REZ_FIX` auf Branch
`codex/ai-central-defense-credit-pool-rez-fix` ab. Sichere die historischen
Entscheidungen zuerst unverändert rot, implementiere ausschließlich generische
side-sichere Korrekturen, verifiziere die unveränderten Erwartungen grün,
committe jedes abgeschlossene Paket, merge den fertigen Branch lokal nach
`main` und entferne Worktree sowie Branch erst nach verifiziertem Abschluss.

## Nachgewiesene Fehler

### F1: Ungebundener Breaker-Credit-Pool vergiftet zentrale Verteidigung

- StateVersion 39, Decision 23: `Shock.r` vor R&D war legal.
- Die Action wurde als
  `assessment_unknown:...:central_defense_allocation_unknown` ausgeschlossen.
- `assessCorpScoreProtection` meldete
  `unsupported_runner_credit_pools`, weil `Invisibility` einen sichtbaren
  eingeschränkten Credit-Pool bereitstellte, aber kein Icebreaker installiert
  war.
- Derselbe Fehler machte in StateVersion 50 das Rezzen von `Filter` vor HQ zu
  `corp_ice_rez_resource_exchange_unknown`; `decline_rez` wurde gewählt.

### F2: Irrelevantes unbekanntes Rig-Objekt vergiftet alle ICE-Bewertungen

- In späteren Zuständen führte ein unbekanntes, aber als Runner-Resource
  typisiertes Rig-Objekt zu `unknown_runner_rig_card`.
- Dadurch fiel die zentrale Allocation erneut vollständig auf `unknown`,
  obwohl dieses Objekt kein Icebreaker sein konnte.

### F3: Nicht-ETR-Verteidigung wird zu eng als wirkungslos behandelt

- `Hunter` vor R&D wurde als
  `corp_ice_install_has_no_engine_certified_access_probability_reduction`
  ausdrücklich unproduktiv ausgeschlossen.
- Tag-, Trace-, Damage-, Tax- und sonstige belegte Encounter-Wirkung muss als
  eigene produktive Verteidigungswirkung geprüft werden; sie darf nicht
  ausschließlich an direkter Access-Probability-Reduktion hängen.

## In Scope

- `packages/ai/src/runtime/corp-score-protection-assessment.ts`
- zentrale Defense-Facts-/Install-/Rez-Consumer in
  `packages/ai/src/runtime/`
- spielgleiche Decision-Checkpoints und enge Unit-/Runtime-Gegenproben
- fokussierte und breite KI-Gates
- Evidence-, Final- und Wissenspflegeartefakte

## Nicht-Ziele

- keine Änderung der Engine-LegalActions oder Kartenregeln ohne nachgewiesene
  Engine-Lücke
- keine Kartennamen-Sonderregeln
- keine Nutzung verdeckter Runner-Hand- oder Stackinformationen
- keine Veränderung der laufenden Hauptinstanz oder ihrer Ports/Datenbank
- keine allgemeine Neugewichtung aller Corp-Pläne

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Aktionsautorität.
- Der Fix arbeitet ausschließlich mit Corp-PlayerView, sichtbaren
  Engine-Quotes, LegalActions und erlaubtem Deck-Snapshot.
- Unbekannte Fakten bleiben fail-closed, aber nur in der semantisch betroffenen
  Teilbewertung; irrelevante, typisierte Objekte dürfen keine globale
  Unsicherheit erzeugen.
- Historische Erwartungen werden nach dem Fix nicht abgeschwächt.

## Paketfolge

### P1 – Preflight und Prozess

- Worktree/Branch anlegen, Paralleländerungen klassifizieren.
- Prozessartefakt und verbindliches Ziel sichern.
- Done: Worktree sauber isoliert; Prozess committed.
- Commit: `docs(ai): start central defense regression process`

### P2 – Rote historische Checkpoints

- Decision 23 / StateVersion 39: R&D-ICE darf nicht wegen des ungebundenen
  Invisibility-Pools ausgeschlossen werden.
- Decision 28 / StateVersion 50: `Filter` muss im HQ-Run gegenüber
  `decline_rez` akzeptabel sein.
- Enge Gegenproben: tatsächlich gebundene eingeschränkte Breaker-Credits sowie
  wirklich unbekanntes potentielles Programm bleiben konservativ.
- Done: Zieltests `behavior_regression`, Gegenproben grün.
- Commit: `test(ai): capture central defense credit-pool regressions`

### P3 – Generische Runtime-Korrektur

- Restricted Credit-Pools an tatsächlich sichtbare, passende Breaker binden;
  ohne Breaker sind sie für den Pfad nicht nutzbar, aber nicht unbekannt.
- Unbekannte Rig-Karten nach bekanntem Typ und möglicher Relevanz eingrenzen.
- Belegte Tax-/Damage-/Trace-Verteidigung in den Install-Consumer übernehmen,
  ohne Access-Reduktion zu erfinden.
- Done: fokussierte Tests und unveränderte Checkpoints grün.
- Commit: `fix(ai): keep central defense assessment actionable`

### P4 – Breite Verifikation

- Checkpoints, Gegenproben und angrenzende Tests.
- AI-Typecheck, relevante Shards/Vollsuite, Deck-Hint-Consumer-Audit und
  `git diff --check`.
- Done: keine neue Regression; bekannte Baseline-Abweichungen separat belegt.
- Commit nur bei erforderlichen Test-/Fixture-Nacharbeiten.

### P5 – Review, Wissen und Integration

- Evidence-/Final-Report und dauerhaften Vertrag dokumentieren.
- Arbeitsbranch gegen aktuelles `main` prüfen und lokal integrieren.
- Main verifizieren, Worktree entfernen, Entfernung prüfen, Branch löschen.
- Done: `main` enthält den Fix; fremde Änderungen bleiben erhalten.
- Commit: `docs(ai): close central defense regression fix`

## Sicherheitsblocker

Stoppen, wenn der Fix verdeckte Runner-Information benötigt, LegalActions
inkorrekt sind, ein historischer Checkpoint nicht als `behavior_regression`
reproduzierbar ist oder der Main-Merge fremde Änderungen nicht sicher erhalten
kann.

