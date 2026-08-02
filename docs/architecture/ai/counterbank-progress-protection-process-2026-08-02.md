# Counterbank-Fortschrittsschutz: Umsetzungsprozess

Status: in Umsetzung

Datum: 2026-08-02

Primärer Agent: `release-implementation-agent`

Worktree: `C:\Projekte\NETGRID_AI_COUNTERBANK_PROGRESS_PROTECTION`

Branch: `codex/ai-counterbank-progress-protection`

## Quelle und Vorgabe

Das neue Standarddeck `Neon Escrow` hat im Hard-vs-Hard-Selfplay mit Seed
`neon-escrow-vapor-02` einen planinternen Fortschrittsverlust reproduziert.
Der bestehende Owner `corp.score_agenda` baute eine Engine-zertifizierte
Counterbank auf zwei Advancement-Counter auf und ersetzte anschließend im
selben Remote genau diese Bank durch `Project Zurich`. Die LegalAction war
regelkonform, vernichtete aber zwei zuvor vom selben Plan aufgebaute Counter.

Führende Evidence:

- `docs/reviews/ai/neon-escrow-vapor-selfplay-review-2026-08-02.md`
- Nutzerfreigabe vom 2026-08-02 für den vorgeschlagenen generischen
  Counterbank-Fortschrittsschutz und ein Zehn-Seed-Nachtestpanel

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise. Ursache, fachlicher Owner, zulässige Ausnahme, Gegenproben,
technische Gates und das gewünschte Selfplay-Panel sind bestimmt.

## Gesamtziel

Der bestehende Planowner `corp.score_agenda` darf eine aktuelle
`rootReplacement: asset_to_agenda`-LegalAction nicht als normale
Agenda-Installationsroute zulassen, wenn sie eine sichtbare,
Engine-zertifizierte Counterbank mit positivem Fortschritt ersetzt. Die Bank
bleibt erhalten, bis ihre Counter transferiert, legal liquidiert oder in
einem eng belegten terminalen Sofortscore bewusst aufgegeben werden. Danach
wird der unveränderte Vorherstand gegen den Kandidaten mit zehn identischen
Seed-Konfigurationen verglichen.

## Annahmen

- `counterBankPreparationQuote` ist der generische Enginevertrag für die
  betroffene Kartenfamilie; keine Karten-ID ist erforderlich.
- `rootReplacement` und Zielserver stammen aus der exakten aktuellen
  LegalAction.
- Positive Advancement-Counter sind gebundener Planfortschritt. Eine Bank
  mit null Countern kann ohne Fortschrittsverlust ersetzt werden.
- Ein sicherer Remote darf weiter zum Zielwert aufgebaut werden. Ein nicht
  mehr sicherer Remote darf über die bestehende Liquidationsroute abgebaut
  werden.
- Zehn Zufallsseeds erhöhen Kartenabdeckung, garantieren aber keine
  Aktivierung jeder Nebenkarte. Nicht beobachtete Nebenideen erhalten bei
  Bedarf deterministische Szenarien statt beliebig vieler weiterer Seeds.

## Nicht-Ziele

- keine Änderung der Vapor-Ops-Regeln oder Engine-Legalität;
- keine Karten-ID-, Deck-, Match- oder Seed-Sonderlogik;
- keine globale Aufwertung von Vapor Ops oder pauschale Änderung aller
  Agenda-/Remote-Gewichte;
- keine neue Entscheidungsautorität außerhalb von `corp.score_agenda`;
- keine strategische Neuimplementierung von Bizarre Encryption Scheme,
  Chicago Branch oder Experimental AI ohne separate rote Evidence;
- kein Push und keine Pull Request-Erstellung.

## Controller-Invarianten

1. Die Rules Engine bleibt die einzige Regelautorität.
2. Jede gewählte Aktion ist eine aktuelle `LegalAction`.
3. Der Owner bleibt `corp.score_agenda`; Plan, Step, Route und
   `PlanExecutionOrigin` dürfen nicht zu einem Resolver oder globalen
   Override wechseln.
4. Ein Choice-Resolver vervollständigt höchstens die Payload einer bereits
   planseitig gebundenen Action und trifft keine Server- oder
   Strategieentscheidung.
5. Counterbank-Quelle, Zielserver und ersetzende Agenda werden ausschließlich
   aus Corp-sichtbaren Karten und der exakten LegalAction abgeleitet.
6. Ein positiver Counterbestand wird nicht durch bloße Bewertungsgewichte
   geschützt, sondern durch die Zulässigkeit der Route im zuständigen Plan.
7. Null-Counter-, gewöhnliche Asset- und echte Terminalfälle bleiben als
   enge Gegenproben zulässig.
8. Hidden-Info-, Replay-, StateHash-, Redaction- und Determinismusverträge
   bleiben unverändert.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden eng im aktiven Paket diagnostiziert; das
  nächste Paket beginnt erst nach grünem Done-Gate.
- Fehlt `rootReplacement` oder eine aktuelle Counterbank-Quote, wird keine
  Schutzannahme erfunden.
- Zeigt die spielgleiche Reproduktion eine andere Owner- oder
  LegalAction-Ursache, wird P1 aktualisiert, bevor produktiver Code geändert
  wird.
- Neue Beobachtungen zu Nebenideen werden als Evidence oder Follow-up
  klassifiziert und erweitern den Fixscope nicht stillschweigend.
- Konflikte mit neuem `main` werden unter Erhalt beider Intentionen gelöst;
  widersprüchliche Ownerverträge sind ein Sicherheitsblocker.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn:

- der Schutz gegnerische oder sonstige Hidden Information benötigen würde;
- die gewünschte Route nicht aus aktuellen LegalActions ableitbar ist;
- die Lösung einen zweiten Scorecontroller oder einen strategischen
  Choice-Resolver erfordern würde;
- ein Enginevertrag zugunsten der KI abgeschwächt werden müsste;
- Main-Konflikte denselben AI-Owner fachlich unvereinbar definieren.

## State Machine

```text
P0 Prozessvertrag
  -> P1 spielgleiche Red Evidence und Vorherpanel
  -> P2 generischer Counterbank-Fortschrittsschutz
  -> P3 fokussierte und breite Verifikation
  -> P4 identisches Zehn-Seed-Nachpanel und Nebenideen-Audit
  -> P5 Dokumentation, Main-Abgleich, Merge und Cleanup
  -> abgeschlossen
```

## Paketfolge

| Paket | Titel                        | Done-Gate                                                                                  | Commit                                                     |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| P0    | Prozessvertrag               | Scope, Invarianten, Pakete und `/Goal` versioniert                                         | `docs(ai): define counterbank progress protection process` |
| P1    | Red Evidence und Vorherpanel | beobachtete Route fokussiert rot; zehn Vorherkonfigurationen lokal erfasst                 | `test(ai): capture counterbank replacement regression`     |
| P2    | Plan-first-Fix               | positive Counterbank wird generisch geschützt; Gegenproben grün                            | `fix(ai): preserve productive counterbank progress`        |
| P3    | Gesamtverifikation           | fokussierte Tests, AI-Typecheck, Gates und drei AI-Shards grün                             | `test(ai): verify counterbank progress protection`         |
| P4    | Nachpanel und Review         | identische zehn Konfigurationen ausgewertet; harte Gates und Kartenereignisse dokumentiert | `docs(ai): review counterbank ten-seed comparison`         |
| P5    | Integration und Cleanup      | aktuelles `main` integriert, final geprüft, lokal gemergt, Worktree und Branch entfernt    | `docs(ai): close counterbank progress protection process`  |

Aktiver Paketstand: P0 ist mit `b7bdbbfdc` abgeschlossen. P1 hat die
spielgleiche Solver- und Runtime-Regression rot bestätigt und das feste
Zehn-Seed-Vorherpanel unter `data/local/` erfasst. Die versionierte Evidence
liegt in
`docs/reviews/ai/counterbank-progress-protection-red-evidence-2026-08-02.md`.

## Paketdetails

### P0 – Prozessvertrag

Ziel: Den verbindlichen Arbeits-, Sicherheits-, Test- und Abschlussvertrag
vor dem ersten produktiven Patch festlegen.

Kernartefakt: dieses Dokument.

Checks: `git diff --check`, Worktree- und Branchstatus.

Done-Gate: eigener sauberer Paketcommit.

### P1 – Spielgleiche Red Evidence und Vorherpanel

Ziel: Den Selfplay-Fund mit dem produktiven Chooser und exakten
LegalAction-Metadaten als fokussierte Regression sichern.

Arbeit:

- Engine-zertifizierte Counterbank mit zwei Countern in einem sicheren
  Remote;
- vollständig finanzierter Same-Turn-Pfad aus Agenda-Installation in einem
  neuen Remote, Countertransfer, Basic Advance und Score;
- konkurrierende Agenda-Installation mit
  `rootReplacement: asset_to_agenda` im Bank-Remote;
- Nachweis, dass der Solver aktuell beide Pfade trotz derselben reservierten
  Counterquelle erzeugt und die selbstzerstörende Route gewinnt;
- Plan-/Step-/Origin-Evidence festhalten;
- zehn feste Vorherkonfigurationen lokal ausführen: fünf gegen
  `Rent-I-Con: Das Shellspiel`, fünf gegen `Blink Pressure Rig`, jeweils
  Hard gegen Hard, `current_candidate`, maximal 480 Aktionen.

Lokale Artefakte unter `data/local/` werden nicht versioniert.

Checks: fokussierter Red-Test muss aus fachlichem Grund rot sein; Selfplays
müssen Replay- und Redaction-Evidence liefern.

Done-Gate: separater Red-Evidence-Commit und vollständige lokale
Vorherfingerprints.

### P2 – Generischer Counterbank-Fortschrittsschutz

Ziel: Parallele normale Agenda-Installationsprojekte dürfen produktiven
Counterbank-Fortschritt nicht zerstören.

Arbeit:

- aus exakter LegalAction Zielserver und `rootReplacement` lesen;
- aktuelle Quote und positiven Counterbestand im Zielroot validieren;
- die normale Installationsroute im Owner `corp.score_agenda` verwerfen,
  solange Fortschritt gebunden ist;
- bestehende Build-, Cross-Remote-Handoff- und Liquidationsrouten erhalten;
- engen terminalen Sofortscore nur mit vorhandener Plan-Evidence zulassen;
- keine Resolver-, Karten-ID- oder globale Bewertungslogik ergänzen.

Tests:

- zwei Counter und finanzierter Same-Turn-Handoff: Cross-Remote-Install
  gewinnt, Same-Root-Install ist nicht zugelassen;
- zwei Counter ohne vollständigen Handoff: der weitere Bankaufbau bleibt
  möglich;
- Zielschwelle: anderer Remote, Transfer und Score bleiben möglich;
- null Counter: Replacement bleibt möglich;
- gewöhnliches Asset: Replacement bleibt möglich;
- unsichere Bank: bestehender Cashout bleibt möglich;
- terminaler garantierter Score: enge Ausnahme bleibt möglich;
- Ownership: Plan, Step, Action und Origin bleiben beim Scoreplan.

Done-Gate: rote Evidence grün, alle Gegenproben grün, AI-Typecheck und
`git diff --check` grün.

### P3 – Fokussierte und breite Verifikation

Ziel: Angrenzende Score-, Conversion-, Ambush- und Runtimeverträge ohne
Regression bestätigen.

Checks:

- Counterbank-, Score-Conversion-, Scoreline- und Plan-first-Runtime-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck` mit dokumentiertem Heap,
  falls der normale 4-GB-Lauf nicht genügt;
- `corepack pnpm check:ai`;
- `corepack pnpm check:ai-deck-doctrine-strategy`;
- `corepack pnpm test:ai:shards`;
- Format-/Diff- und Redaction-Hygiene.

Done-Gate: alle berührten Gates grün; keine IllegalAction-, Replay-,
Hidden-Info- oder Ownership-Regression.

### P4 – Identisches Zehn-Seed-Nachpanel und Nebenideen-Audit

Ziel: Vorher- und Nachherstand unter identischen Fingerprints vergleichen und
die Aktivierung der Deckideen beobachten.

Konfiguration:

- Corp: `Neon Escrow`;
- fünf feste Seeds gegen `Rent-I-Con: Das Shellspiel`;
- fünf feste Seeds gegen `Blink Pressure Rig`;
- beide Seiten `current_candidate`, Schwierigkeit `hard`;
- 480 Aktionen je Spiel;
- Vorher/Nachher mit identischen Seednamen und Deck-Hashes.

Harte Gates: null Illegal Actions, Fallbacks, Timeouts, Runtime-, Replay-,
Redaction- und Hidden-Info-Fehler; kein Action-Limit.

Fachliche Auswertung:

- Counterbank-Installationen, Advances, Cashouts und Transfers;
- Same-Root-Replacements mit positivem Counterbestand, Zielwert null;
- mit transferierten Countern gescorte Agenden;
- Experimental-AI-Bluffs und Runner-Contests;
- Bizarre-Encryption-Auslösungen;
- Chicago-Branch-Aktivierungen;
- Babylon-/Zurich-Overadvance-Erträge;
- Siege und Agendapunkte nur als Kontext, nicht als isolierter
  Stärke-Nachweis.

Done-Gate: vollständiger Vergleichsreview; nicht beobachtete Nebenideen sind
als `n/a` statt als Erfolg ausgewiesen und bei Bedarf deterministisch
abgedeckt.

### P5 – Dokumentation, Main-Abgleich, Merge und Cleanup

Ziel: Wiederverwendbaren Vertrag dokumentieren und den Arbeitsbranch sicher
lokal integrieren.

Arbeit:

- Prozessstatus, Review, AI-Architekturindex und Monatslog aktualisieren;
- aktuelles `main` defensiv in den Arbeitsbranch integrieren;
- relevante finale Checks erneut ausführen;
- Arbeitsbranch bevorzugt per Fast-Forward lokal nach `main` mergen;
- fremde Änderungen im Hauptworkspace erhalten;
- exakten Worktree-Pfad validieren, sauberen Worktree entfernen, Entfernung
  in Git und Dateisystem verifizieren und gemergten Branch mit `git branch -d`
  löschen.

Done-Gate: Main enthält alle Paketcommits, relevante Checks sind grün,
Worktree und Branch sind nachweislich entfernt.

## Verifikationsregeln

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Nach jedem Paket: relevante Checks, `git diff --check`, gezieltes Staging
  und eigener Commit.
- Tests werden nicht durch Abschwächen der fachlichen Erwartung grün.
- Vorher-/Nachher-Vergleiche verwenden identische Seeds, Deckfingerprints und
  Aktionsgrenzen.
- Ein `n/a` bei Karten- oder Verhaltensaktivierung ist kein Nullwert und kein
  Freigabenachweis.
- Breite AI-Shards laufen erst nach grüner fokussierter Regression.

## Worktree-, Git- und Integrationsregeln

- Produktive Arbeit ausschließlich in
  `C:\Projekte\NETGRID_AI_COUNTERBANK_PROGRESS_PROTECTION` auf
  `codex/ai-counterbank-progress-protection`.
- Hauptworkspace nur für den finalen lokalen Merge; vorhandene fremde
  Änderungen bleiben unberührt.
- Standardports 3100 und 8787 sowie die Hauptdatenbank werden nicht aus dem
  Worktree gestartet oder verändert.
- Kein Push und kein Pull Request.
- Kein `git reset --hard`, kein pauschales Revert und kein erzwungener
  Worktree-/Branch-Cleanup.

## Verbindliches `/Goal`

```text
/Goal Arbeite den Counterbank-Fortschrittsschutz vollständig und sequenziell
von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.
Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md, den vollständigen
KI-Änderungskompass und dieses Prozessartefakt. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_AI_COUNTERBANK_PROGRESS_PROTECTION auf Branch
codex/ai-counterbank-progress-protection. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket,
aktualisiere Paketartefakte, führe Paketchecks aus und committe jedes
abgeschlossene Paket. Stoppe bei einem Sicherheitsblocker, dokumentiere ihn
mit Removal Condition und erfinde keinen Workaround. Nach Abschluss aller
Pakete aktuelles main integrieren, final verifizieren, lokal nach main mergen,
main prüfen, den sauberen Arbeits-Worktree entfernen, seine Entfernung in Git
und Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und das Goal
erst danach als complete markieren.
```

## Abschlusskriterien

- die spielgleiche Same-Root-Replacement-Regression ist grün;
- positive Counterbank-Fortschritte werden generisch geschützt;
- Build, Cross-Remote-Handoff, Liquidation und enge terminale Ausnahme bleiben
  möglich;
- Owner, Plan, Step, Action und Origin bleiben beim Scoreplan;
- fokussierte Tests, AI-Typecheck, AI-Gates und drei Shards sind grün;
- identisches Zehn-Seed-Vorher-/Nachherpanel ist ausgewertet;
- Review, Architekturindex und Wissenslog sind aktuell;
- alle Paketcommits sind lokal in `main` integriert;
- Worktree und gemergter Branch sind verifiziert entfernt.
