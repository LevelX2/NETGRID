# Follow-up-Prozess zu den KI-Spielen f450 und 10311

Status: In Arbeit

## Quelle und Gesamtziel

Die vollständige Entscheidungsprüfung der gespeicherten Spiele
`match_4f450c0586f6f450` und `match_10311b60ca1364f6` hat drei weitere
freigegebene Punkte ergeben. Ziel ist, diese zunächst als spielgleiche rote
Decision- beziehungsweise LegalAction-Checkpoints zu sichern und anschließend
generisch, side-safe und ohne kartennamenspezifische KI-Sonderfälle zu beheben.

1. Die Runner-KI erkennt das sofortige Scoren einer installierten Agenda über
   eine aktivierte Kartenfähigkeit nicht als Scorefortschritt.
2. Die Runner-KI verwirft eine Suchkarte für Icebreaker, obwohl ihr installierter
   Rig noch keinen Icebreaker enthält.
3. Die LegalAction-Metadaten der Puzzle-Begegnung bilden weder das tatsächliche
   Ende-des-Runs-Risiko noch das spätere Selbst-Trashen der ICE-Quelle ab. Die
   beobachtete Entscheidung, die Subroutinen auszulösen, war trotzdem taktisch
   richtig und muss als grüne Verhaltenskontrolle erhalten bleiben.

## Arbeitskontext

- Worktree: `C:\Projekte\NETGRID_AI_F450_10311_FOLLOWUP_20260714`
- Branch: `codex/ai-f450-10311-followup-remediation`
- Ausgangsstand von `main`: `b0f9fb476c71d645244f273ef0d9161f64b5a777`
- Die bereits offenen Nutzeränderungen auf `main` in
  `encounter-printed-nontrace-effects.ts` und dem zugehörigen Test gehören nicht
  zu diesem Arbeitsstrang und werden weder verändert noch übernommen.

## Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Die KI entscheidet ausschließlich aus PlayerView, side-safe PublicEvents und
  LegalActions; verdeckte Informationen dürfen nicht in Bewertung oder Tests
  einfließen.
- Jeder freigegebene Fehler wird vor dem Fix auf aktuellem Code reproduziert.
- Positive Gegenproben verhindern eine globale Bevorzugung einzelner Karten oder
  Aktionsarten.
- Die Puzzle-Korrektur ändert den Informationsvertrag, nicht rückwirkend die als
  richtig bewertete Runner-Entscheidung.
- Replay-Determinismus und StateHash bleiben unverändert.

## Nicht-Ziele

- Keine erneute Bearbeitung historischer Entscheidungen, deren Zustände durch
  bereits integrierte Fixes entfallen oder die der aktuelle Entscheider korrekt
  bewertet.
- Keine allgemeine Bevorzugung aktivierter Fähigkeiten, Agenden oder Suchkarten.
- Keine Kartenname-Abfrage für Theorem Proof, Temple Microcode Outlet oder
  Puzzle in der KI.
- Keine Änderung an den offenen Nutzerdateien auf `main`.

## Paketfolge

### P0: Preflight und Prozessvertrag

- Worktree, Branch, Ausgangsstand, Nutzeränderungen und Scope festhalten.
- Done-Gate: Prozessartefakt vorhanden und `git diff --check` grün.
- Commit: `docs(ai): plan f450 10311 followup remediation`

### P1: Spielgleiche rote Evidence

- Die drei historischen Theorem-Proof-Fenster als Decision-Checkpoints sichern.
- Den Temple-Discard als Decision-Checkpoint sichern.
- Die Puzzle-Entscheidung als grüne Verhaltenskontrolle und die fehlerhaften
  LegalAction-Metadaten als rote Vertragsprüfung sichern.
- Mindestens je eine passende Gegenprobe für die neuen Bewertungsregeln ergänzen.
- Done-Gate: Erwartete Verhalten- und Vertragsregressionen sind auf dem
  Ausgangscode rot klassifiziert; Kontrollen sind grün.
- Commit: `test(ai): capture f450 10311 followup regressions`

### P2: Aktiviertes Agenda-Scoring

- Scoren über eine aktivierte Kartenfähigkeit mit generischen, enginegelieferten
  LegalAction-Metadaten als unmittelbaren Punktfortschritt bewerten.
- Done-Gate: alle drei historischen Checkpoints und eine Nicht-Score-Gegenprobe
  grün.
- Commit: `fix(ai): value activated agenda scoring`

### P3: Breaker-Suchkarte im Discard

- Beim Handkartenabwurf eine sichtbare Suchoption für fehlende Rig-Funktionalität
  kontextuell erhalten, ohne Suchkarten generell unabwählbar zu machen.
- Done-Gate: historischer Temple-Checkpoint und Gegenprobe bei bereits
  vorhandener Abdeckung grün.
- Commit: `fix(ai): retain missing breaker search access`

### P4: Puzzle-Begegnungsmetadaten

- Das tatsächliche Ende-des-Runs-Risiko und den sichtbaren
  Ende-des-Zugs-Selbst-Trash der Begegnungsquelle generisch in LegalActions
  abbilden und side-safe in den KI-Eingabevertrag übernehmen.
- Done-Gate: roter Vertragscheck und grüne Puzzle-Entscheidungskontrolle sowie
  angrenzende Encounter-Tests grün.
- Commit: `fix(engine): expose encounter source self trash`

### P5: Breite Verifikation und Wissenspflege

- Fokussierte Checkpoints, angrenzende AI-/Engine-Tests, Typechecks und
  `git diff --check` ausführen.
- Evidence, Review und dauerhaftes Wissensartefakt aktualisieren.
- Commit: `docs(ai): close f450 10311 followup remediation`

### P6: Lokale Integration und Cleanup

- Aktuelles lokales `main` defensiv in den Arbeitsbranch integrieren.
- Relevante Gates nach der Integration wiederholen.
- Arbeitsbranch lokal nach `main` mergen und Worktree entfernen.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Automatische Fehlerbehandlung

Ein unerwartet roter Check wird innerhalb seines Pakets ursächlich untersucht.
Das nächste Paket beginnt erst nach erfülltem Done-Gate. Ein Side-Safety-Leak,
eine Abweichung von der Rules Engine oder eine Kollision mit Nutzeränderungen ist
ein Stop-Blocker und wird nicht durch Ranking-Heuristik umgangen.

## /Goal

Sichere die drei freigegebenen Follow-up-Funde aus den gespeicherten Spielen
`match_4f450c0586f6f450` und `match_10311b60ca1364f6` vor jedem Fix als
spielgleiche rote Checkpoints mit grünen Kontrollen. Behebe aktiviertes
Agenda-Scoring, die Erhaltung einer Suchoption für fehlende Breaker-Abdeckung und
die Puzzle-Encounter-Metadaten generisch sowie side-safe. Verifiziere jedes Paket,
dokumentiere den dauerhaften Vertrag, integriere den Branch lokal nach `main` und
entferne den Worktree. Markiere das Ziel erst nach erfolgreicher Main-Verifikation
als abgeschlossen.
