# NETGRID: aktueller Stand des Fachreviews

Stand: 2026-10-18 · P1/P2 umgesetzt und gezielt abgenommen.
F6 bleibt als P3 offen.

Quellbasis: lokaler `main`-Commit `5bb57ad0a2e23a0f41c8e4d0872c8480aa58caae`.
Umsetzung: eigener Worktree, Branch `codex/fachreview-p1-p2-20261018`.

Dieses Dokument führt noch offene Abnahmen, den verbleibenden UI-Befund
und die am Ausgangsstand bestätigten Gateabweichungen.
Die gültigen Implementierungsverträge liegen im
[Controllervertrag](../architecture/ai/controller-contract.md),
[Planvertrag](../architecture/ai/planning-architecture.md),
[UI-Strukturvertrag](../architecture/ui/ui-structure-guide.md) und
[Maintenance-Runbook](../runbooks/maintenance-control-plane.md).
Nach Klärung der offenen Befunde und Rückführung noch benötigter Nachweise
wird dieses Review nach Referenzprüfung entfernt.

## Umgesetzte P1- und P2-Punkte

| ID      | Ergebnis                                                                                                                                                                                                    | Dauerhafter Nachweis                                                                                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 · P1 | Idempotenz erhält Annahme und Ablehnung einschließlich terminaler Aktionen. Unvollständige Ablehnungen scheitern strukturiert.                                                                              | [Action-Tests](../../apps/server/src/action-idempotency.test.ts), [WebSocket-Vertrag](../../apps/server/src/match-join-contract.test.ts)                                                                                                                            |
| F2 · P1 | KI-Batches geben zwischen Aktionen an den Ereignisloop ab; Match-Lock, Update-Admission und Commitgrenze bleiben erhalten. Manuelle Löschung ist mit dem Batch serialisiert.                                | [Batch-/Replay-Prüfung](../../apps/server/src/ai-batch-runtime.test.ts), [Lifecycle und Löschkonkurrenz](../../apps/server/src/ai-runtime-lifecycle.test.ts)                                                                                                        |
| F3 · P1 | Hosted-Bank-Cycle verwendet den vorhandenen Parser aus der erlaubten Planning-Schnittstelle.                                                                                                                | [Import](../../packages/ai/src/corp/economy/hosted-credit-bank-cycle.ts), Paketgrenzen-Gate                                                                                                                                                                         |
| F4 · P2 | Erst eine explizite Beitrittsquittung für Match und Seite setzt den Client auf online. Ablehnung, fehlende Quittung und alte Socketgenerationen bleiben fail-closed.                                        | [Transportcontroller](../../apps/web/features/match-session/match-transport-connection.ts), [Verhaltenstests](../../apps/web/features/match-session/match-transport-connection.test.ts), [echter WebSocket-Test](../../apps/server/src/match-join-contract.test.ts) |
| F5 · P2 | Vier KI-Speicher und vorbereitete Entscheidungen werden matchbezogen nach terminalem Commit, Löschung, Undo oder Runtimeende freigegeben. Fremde Liveportfolios und persistierte Evidence bleiben erhalten. | [Speicherzuständigkeit](../../packages/ai/src/runtime/match-runtime-memory.ts), [Lifecycle-Tests](../../apps/server/src/ai-runtime-lifecycle.test.ts)                                                                                                               |

Die Fehler wurden an ihren jeweiligen Ownern korrigiert. Es gibt keine neue
Regel- oder Auswahlautorität, keine Ersatzaktion, keinen globalen Speicherreset
und keine Aufweichung der Import- oder Persistenzgates. F6 gehört nicht zum
beauftragten Umsetzungsscope.

## Lokale Messungen und ihre Grenzen

Gemessen wurde auf Windows 11 Pro, Intel i5-14500, Node 24.20.0, im isolierten
Worktree. Die Fachzeit der Testmatches war kontrolliert; Laufzeiten wurden mit
der monotonen Prozessuhr gemessen. Andere Entwicklungsprozesse waren aktiv.

Ein echter 40-Aktionen-Batch mit Standarddecks und Seed
`fachreview-event-loop` benötigte nach der Änderung 3.547 ms.
Die unabhängige Matchaktion begann nach der ersten KI-Entscheidung und war
vor dem Batchende abgeschlossen. Fünf parallel abgewickelte lokale HTTP-
Healthabrufe benötigten 209, 224, 128, 69 und 45 ms. p95 dieser kleinen
Stichprobe beträgt 224 ms und liegt unter dem vorgeschlagenen 250-ms-Ziel.
Der vorherige In-Memory-Reviewlauf hatte den Ereignisloop für vollständige
40er-Batches über rund 3,0–4,1 Sekunden blockiert. Wegen unterschiedlicher
Quellstände und Hintergrundlast ist daraus kein kontrollierter
Durchsatzvergleich abzuleiten. Einzelentscheidungen bleiben synchron;
dies ist kein Kapazitäts- oder LAN-Latenzversprechen.

Der zusätzliche SQLite-Lauf verwendete echte, unveränderte KI- und
Enginepfade bis 120 Aktionen. Replay und finaler StateHash stimmen.
Je Stand wurde ein Aktionsload gemessen:

| Aktionen |    Load | Engineevents | Enginehistorie als JSON | Öffentlicher Kontext und Tail als JSON | Aktueller State ohne Historie als JSON |
| -------- | ------: | -----------: | ----------------------: | -------------------------------------: | -------------------------------------: |
| 0        | 1,97 ms |            1 |                 1.267 B |                                1.475 B |                               45.760 B |
| 40       | 6,30 ms |           41 |                65.652 B |                               43.800 B |                               50.891 B |
| 80       | 8,41 ms |           81 |               121.037 B |                               81.753 B |                               51.404 B |
| 120      | 8,64 ms |          121 |               182.648 B |                               96.575 B |                               51.461 B |

Die Bytezahlen bezeichnen UTF-8-JSON der geladenen Projektionen. Sie sind weder
RAMverbrauch noch komprimierte Übertragung, SQLite-Dateigröße, Indizes oder WAL.
Es handelt sich um Einzelmessungen, keine Latenzverteilung. Der normale
Aktionsload behält weiterhin die vollständige regelrelevante Enginehistorie;
Snapshots bleiben im Aktionsload leer und nur die letzten 80 öffentlichen
Payloads werden vollständig hydratisiert. Eine unbegrenzte Skalierbarkeit
folgt daraus nicht; ein pauschales Kappen der Historie wäre ohne
Consumertrennung unzulässig.

## Integrationsprüfung

Die gezielten Prüfungen umfassen akzeptierte und abgewiesene Retries mit
Memory und SQLite, echte WebSocket-Fehler und Beitrittsquittungen, parallele
Matchaktionen und HTTP, Matchserialisierung, Löschkonkurrenz, Commitfehler,
Engine-Spielende, Runtimefreigabe sowie Replay und StateHash.

Bestanden sind:

- 21 Serverprüfungen in den vier neuen Regressionsdateien;
- 36 Webprüfungen für Matchtransport, Session und Fehlerübersetzung
  sowie zwei Shared-Prüfungen für die Präsentationsverträge;
- neun gezielte bestehende Multiplayer-Regressionen, darunter reguläres
  KI-vs-KI-Spielende mit Replay, Spielerzeit, Reconnect, Undo,
  Persistenzfehler und abgewiesene KI-Aktionen;
- die Firefox-Szenarien Human-vs-KI am Desktop und Lifecycle/Reconnect;
  Lifecycle/Reconnect wurde nach dem Schutz gegen verspätete Quittungen
  erneut erfolgreich geprüft;
- die strikten Server- und Shared-Typechecks.

Paketgrenzen, KI-Hint-Verträge, KI-Struktur, Source-Reachability und generische
Karten-ID-Grenzen sind grün. Test-Discovery erfasst alle Pakettestdateien;
das i18n-Gate bestätigt 2.748 übereinstimmende Nachrichten in drei Sprachen.
Format, Markdown-Verweise und Diffprüfung sind ebenfalls grün.

Der vollständige KI-Typecheck ist mit einem
ausschließlich für diesen Prozess auf 12 GB erhöhten Prüfheap grün.
Die unveränderte Standardgrenze von 8 GB reichte für diesen Lauf nicht aus;
der erfolgreiche strikte Check meldete rund 9,6 GB Compiler-Speicher bei
3.734 Dateien einschließlich rund 7,4 Millionen JSON-Zeilen.
Das betrifft den Prüfvorgang, nicht eine gemessene Produkt-RAM-Anforderung.

### Bestätigte Fehler des Ausgangsstands

Der vollständige Lauf `corepack pnpm test:ai:shards` hat alle 918
Testdateien mit drei parallelen Shards und je einem Vitest-Worker beendet:
7.314 Tests bestanden, 137 Tests in 85 Dateien schlugen fehl
(833 Dateien bestanden). Laufzeit: rund 19 Minuten.

Alle 85 fehlgeschlagenen Dateien wurden zusätzlich im unveränderten
Ausgangscommit in einem getrennten Diagnose-Worktree mit jeweils einem
Vitest-Worker geprüft. Diese begrenzten Gegenläufe umfassen zusammen
1.228 Tests: 1.091 bestanden, dieselben 137 schlugen fehl.
Der Vergleich aller vollständigen Testnamen und Fehlerausgaben einschließlich
Expected-/Received-Diffs ergab 137 identische Fehlerbilder.
Stackpositionen und Laufzeiten waren nicht Teil dieses Inhaltsvergleichs.

Der Bestand betrifft unter anderem Compiler-Goldens, Run-Target-Bewertung,
Score-/Defense-Bindungen, Bankfinanzierung und gespeicherte
Entscheidungscheckpoints. Auch der bestehende Bankzyklus-Test
`runtime/meta-472-hosted-bank-cycle.test.ts` scheitert am Ausgangsstand
an derselben Rootplan-Erwartung. Die in F3 korrigierte Importgrenze ist grün;
beide Exportpfade reichen dieselbe Funktion aus `capability-identity.ts`
weiter.

Der Web-Typecheck meldet drei identische `TS2345`-Fehler im unveränderten
`features/debug/AiDecisionDebugOverlay.tsx` (Zeilen 908, 931 und 1289):
Der bestehende Modus `score_continuation` fehlt in einer engeren
Präsentationssignatur. Auch diese drei Meldungen wurden am Ausgangscommit
identisch reproduziert.

Die breiten KI- und Web-Typgates sind damit weiterhin rot. Die nachgewiesenen
Ausgangsfehler bleiben als eigener Arbeitsumfang offen; die fokussierte
Abnahme von F1–F5 ist grün. Daraus folgt keine vollständige Releasefreigabe.

## Offen: F6 · P3 – Kartenmenüs mit Escape schließen

Im In-App-Browser bei 390 × 844 Pixeln im aktiven Runnerzug lässt sich das
Kartenmenü von Loan from Chiba per Escape weder am ausdrücklich fokussierten
Auslöser noch auf „Normal installieren“ schließen. Tab erreicht den
Menüeintrag; ein erneuter Klick auf den Auslöser schließt das Menü.

Betroffen sind der [Auslöser](../../apps/web/features/cards/CardView.tsx)
und das [Menü](../../apps/web/features/cards/CardActionsPopover.tsx).
Das ist eine reproduzierte kleine Bedienungsreibung, kein nachgewiesener
vollständiger Tastaturblocker oder Normverstoß.

Vorgeschlagene Abnahme für den späteren UI-Auftrag: Escape schließt nur das
aktuelle Kartenmenü und führt den Fokus zum Auslöser zurück. Keine Action
wird gesendet und kein notwendiges Choice-/Run-Fenster verworfen. Klick,
Tab und Touchauswahl bleiben benutzbar. Aufwandsschätzung: 0,25–0,5 Tag.

Spielspaß, längere beobachtete Partien, echte Touchgeräte und Audio bleiben
Nutzer-/Geräteabnahmen. Aus diesem Review entsteht keine neue Siegquote
oder Empfehlung zusätzlicher Belohnungssysteme.

## Lokale Artefakte der Vorprüfung

Die früheren Diagnoseprozesse aus dem primären Checkout sind beendet.
Die dortigen Restbestände `tmp/fachreview-20261018/` und
`apps/web/.next-fachreview-20261018/` blieben nach einer Ablehnung der
automatischen Freigabeprüfung für rekursives Löschen lokal liegen.
Sie wurden für diese Umsetzung nicht verwendet und werden nicht versioniert.
