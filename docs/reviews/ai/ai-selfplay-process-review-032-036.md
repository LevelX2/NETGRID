# Prozessreview KI-Selbstspiel 032–036

Stand: 2026-08-20  
Status: fünf Paarungen vollständig analysiert; Bericht mechanisch abgeglichen;
funktionaler Fix integriert; zentrales Registry-/Backup-Gate wartet auf die
noch nicht in `main` integrierte Registry-Infrastruktur

## Ergebnis und Abschlussgates

- Fünf zufällige Paarungen mit je drei finalen Partien wurden vollständig
  ausgeführt. Der Block umfasst 4.110/4.110 Entscheidungen und Traces sowie
  4.125 getrennt geladene Events bis zum Terminalzustand; `FLAGS=0`.
- Der Runner gewann 13 Partien, die Corp zwei. Alle 15 Manifestzeilen,
  Match-/Agendapunkte, Endgründe, Gewinner und Entscheidungszahlen stimmen
  exakt mit dem HTML-Bericht überein.
- SP-085 wurde ursachenorientiert behoben: Die actor-private KI-Projektion
  erhält die exakte Zahlungsunterbrechungsbindung, und die ursprüngliche
  `runner.rig_and_coverage`-Planorigin wird ausschließlich über die gebundene
  Fortsetzungsaction wiederaufgenommen. 40 fokussierte und angrenzende Tests
  bestanden; der finale Drei-Seed-Lauf endete mit `FLAGS=0`.
- Die kumulative Matrix enthält nach dem Block 18 offene Verdachtsfälle in
  neun Clustern. Der Bericht führt genau diese neun Cluster mit Vorkommen,
  Evidenzstand, Blockänderung und fehlendem Beweis auf.
- Das vollständige Drei-Shard-Gate lief einmal für 374 Sekunden. 4.464 Tests
  bestanden; sechs fachlich unabhängige bekannte Checkpoint-/Replaytests
  blieben rot: drei `e6aca`-Corp-Remediation-Checkpoints, zwei
  `latest-two-corp-match`-Remediation-Checkpoints und eine bestehende
  `last-call-at-rd`-Sequenz. Der neue SP-085-Pfad war nicht betroffen.

## Gemessene Redundanz und fehlgeschlagene Befehle

1. Bei den Paarungen 033 und 034 wurde dem wiederverwendeten Pairing-Driver
   einmal ein bereits um die Zyklus-ID ergänztes Ausgabeverzeichnis übergeben.
   Dadurch entstanden die harmlosen doppelten Unterverzeichnisse `033/033`
   und `034/034`. Es wurde weder neu gespielt noch Evidenz doppelt geladen;
   die späteren Aufrufe verwendeten wieder die eindeutige Blockwurzel.
2. Der erste mechanische Berichtsabgleich fand genau einen kanonischen
   Attributfehler: `runner_flatline` statt Manifestwert `flatline`. Nach der
   Korrektur bestand der vollständige 15-Zeilen-Abgleich. Eine erste
   Reihenfolgeprüfung verwendete außerdem nicht die tatsächlichen Überschriften
   der inzwischen aktualisierten Vorlage; die Inhalts- und Datenprüfung war
   davon unberührt.
3. Der erste Versuch, das neue Registry-Kommando auszuführen, scheiterte
   sichtbar, weil `scripts/ai-selfplay-evidence-registry.mjs` und das
   `selfplay:evidence`-Script im aktuellen `main` noch fehlen. Ein sauberer
   paralleler Arbeitsbranch enthält die Infrastruktur, ist aber nicht in
   `main`; dieser Lauf integriert keine fremde Arbeitsbranch-Arbeit
   eigenmächtig.
4. Es gab keinen doppelten finalen Drei-Seed-Lauf. Nach dem SP-085-Fix wurde
   genau eine finale Serie ausgeführt; der Server wurde nur für die
   Codeänderung neu gestartet.

## Integration, Reporting und Cleanup

- Die Paarungsreviews 032 bis 036 und die fortgeschriebene Matrix sind lokal
  bis `b42dff3e0` in `main` integriert. Es erfolgte kein Push und keine
  E-Mail-Zustellung.
- Der Bericht wurde erst nach erneuter vollständiger Lektüre des aktualisierten
  Skills und der aktuellen HTML-Vorlage erstellt. Er folgt der festen
  Abschnittsfolge und verwendet die orange Vorher-nachher-Hervorhebung nur für
  den materiell veränderten SP-085-Verlauf.
- Der neue Skill verlangt vor dem Cleanup ein Upsert aller Paarungsbundles,
  das Speichern des exakten HTML-Berichts, einen geschlossenen Nicht-Mail-
  Reportstatus und ein Online-Backup im zentralen Registry-Werkzeug. Da dieses
  Werkzeug im aktuellen `main` noch nicht vorhanden ist, ist das Gate nicht
  erfüllt. Die sechs blockeigenen SQLite-/WAL-/SHM-Dateien mit zusammen
  1.761.548.448 Bytes (1,64 GiB) werden deshalb nicht gelöscht.
- Auch der blockeigene Server bleibt entsprechend der aktuell geltenden
  Gate-Reihenfolge bis zum Registry-/Backup-Abschluss bestehen. Er läuft nur
  auf dem isolierten Port 8911 und verwendet ausschließlich die expliziten
  Datenbankpfade dieses Worktrees; Standardports und Hauptdatenbank sind nicht
  betroffen.

## Prozessverbesserung

- Der Pairing-Driver sollte eine bereits enthaltene Zyklus-ID im
  Ausgabeverzeichnis ablehnen, statt still ein doppeltes Unterverzeichnis zu
  erzeugen.
- Der neue Registry-Branch beseitigt die bisherige manuelle Berichts- und
  Markdown-Brücke. Nach seiner regulären Integration wird dieser letzte
  Altblock per `import-legacy`, Paarungs-Upsert, Nicht-Mail-Reportabschluss und
  Online-Backup übernommen; danach kann die isolierte Runtime nach dem
  Cleanup-Gate entfernt werden.
- Am Skill selbst wurde in diesem Lauf nichts geändert. Die beobachteten
  Schwächen sind entweder bereits durch die parallel erweiterte
  Registry-/Lifecycle-Fassung adressiert oder gehören in Repository-Werkzeuge,
  nicht in eine weitere konkurrierende Skilländerung.

