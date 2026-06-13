# AI181-AI190 Signature Proof Process

Status: in Umsetzung

Quelle/Vorgabe: Ergebnisanalyse zu AI170-AI180 vom 2026-06-13.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Paketfolge, Nicht-Ziele, Sicherheitsgrenzen, Artefakte und Abnahmekriterien sind bestimmt. Kleine Lücken werden konservativ behandelt: Wo ein Runtime-Harness zu groß wäre, bleibt die Replay-Probe zunächst ein redigierter Proof-/Dry-Run-Nachweis ohne Runtime-Entscheidungsänderung.

## Gesamtziel

AI181 bis AI190 schließen die technische Beweislücke zwischen Opportunity-Snapshot und konkreter PlayerAction: stabile SemanticActionSignature, side-safe TargetIdentity, Candidate-Gate v2, PlayerAction-Replay-Probe, Punish-/Coverage-Reviews, Scorecard v4, Web-Timeout-Guard und finaler Sweep.

## Annahmen

- Vorhandene AI170-AI180-Artefakte sind führende Eingabedaten.
- Signaturen und Zielidentitäten bleiben read-only Diagnose- und Review-Daten.
- Ein Micro-Cutover ist nur erlaubt, wenn Signature, TargetIdentity und Replay-Proof positiv sind und x5/x10 nicht schlechter werden.
- Wenn kein Kandidat diese Bedingungen erfüllt, dokumentiert AI187 ein No-Go.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine Hidden-Info-Ausweitung.
- Keine generischen Credit-, Draw-, Run- oder Corp-Economy-Strafen.
- Kein produktiver Runtime-Cutover ohne Proof-Kette.
- Keine Änderung an Engine-, Replay-, StateHash- oder Randomness-Verträgen.

## Controller-Invarianten

- Rules Engine bleibt alleinige Regelautorität.
- KI, UI, Server und Spieler reichen nur PlayerActions ein, die aus LegalActions abgeleitet sind.
- Diagnosedaten dürfen keine gegnerischen Hidden-Zonen, CardInstance-Dumps, private Payloads, Tokens oder Deckreihenfolgen enthalten.
- Redaction-Gates bleiben Teil jedes Artefakts, das Snapshot- oder Signaturdaten enthält.

## Automatische Fehlerbehandlung

- Rote Paketchecks werden vor dem nächsten Paket eng behoben.
- Unklare Kandidaten werden als Blocker oder No-Go klassifiziert, nicht still promoted.
- Wenn ein Builder nur Metadaten aktualisiert, wird der Diff geprüft und begründet.
- Bei Merge-Konflikten werden beide Intentionen gelesen und kompatibel zusammengeführt.

## Sicherheitsblocker

- Hidden-Info-Leak in Signatur, TargetIdentity, Replay-Probe oder Trace.
- Runtime-Entscheidungsänderung ohne vollständige Proof-Kette.
- IllegalAction, Replay-Failure oder schlechterer x5/x10-Safety-Sweep.
- Unklare untracked Dateien oder fremde Änderungen im Integrationspunkt.

## State Machine

1. `prepared`: Prozessartefakt committed.
2. `package_active`: genau ein AI181-AI190-Paket wird bearbeitet.
3. `package_verified`: Paketartefakte und Checks sind grün.
4. `package_committed`: Paket ist committed.
5. `integration_preflight`: alle Pakete committed, Worktree sauber, main-Abgleich läuft.
6. `integrated`: Arbeitsbranch lokal nach main gemerged.
7. `cleaned`: Worktree entfernt, Goal abschließbar.

## Paketfolge

| Paket | Titel | Commit |
| --- | --- | --- |
| AI181 | Stable Semantic Action Signature | `feat(ai): add stable semantic action signatures` |
| AI182 | Target Identity Resolver v1 | `feat(ai): resolve side-safe target identities` |
| AI183 | Candidate Gate v2 mit Signature + TargetIdentity | `docs(ai): rerun candidate gate with signatures` |
| AI184 | PlayerAction Replay Probe | `test(ai): probe candidate playeraction replay` |
| AI185 | Stale Punish Intent Decomposition | `docs(ai): decompose stale corp punish intents` |
| AI186 | Coverage Candidate Signature Review | `docs(ai): review coverage candidates with signatures` |
| AI187 | One Signature-Proven Micro Candidate oder No-Go | `fix(ai): test one signature-proven opportunity candidate` |
| AI188 | Scorecard v4 Signature Proof Metrics | `docs(ai): add signature proof metrics to scorecard` |
| AI189 | Web Catalog Test Timeout Guard | `test(web): guard catalog data timeout stability` |
| AI190 | Full Sweep | `test(ai): complete signature opportunity sweep` |

## Paketdetails

Jedes Paket erzeugt das in der Vorgabe genannte Markdown-Artefakt; datengetriebene Pakete erzeugen zusätzlich JSON. Builder liegen unter `scripts/`, wiederverwendbare Typen und Tests im AI-Paket. AI189 bleibt auf Web-Teststabilität begrenzt.

## Verifikationsregeln

- Nach jedem Paket: passender Builder/Test, `git diff --check`, commit.
- Bei AI-Code: mindestens gezielter AI-Test und Typecheck, soweit Paketumfang betroffen.
- Bei Web-Testpaket: fokussierter Catalog-Test und unveränderte Assertions prüfen.
- AI190: vollständige Pflichtliste aus der Vorgabe inklusive x5/x10 Trace.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI181_AI190_SIGNATURE_PROOF`.
- Arbeitsbranch: `codex/ai181-ai190-signature-proof`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Jeder Paketabschluss ist ein eigener Commit.
- Push erfolgt nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite AI181 bis AI190 sequenziell ab. Nutze ausschließlich den Arbeits-Worktree. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Ändere keine Runtime-Auswahl ohne Signature, TargetIdentity, Replay-Proof und nicht schlechtere x5/x10-Sweeps. Stoppe bei Hidden-Info-, Replay-, IllegalAction- oder Merge-Sicherheitsblockern.

## Abschlusskriterien

- AI181-AI190-Artefakte existieren und sind verifiziert.
- Scorecard v4 zeigt die neue Blockadelage.
- Kein Runtime-Fix ohne vollständige Proof-Kette.
- Finaler Sweep ist grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
