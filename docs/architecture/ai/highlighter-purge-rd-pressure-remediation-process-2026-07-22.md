# Highlighter-Purge- und R&D-Druck-Remediation

## Status

In Umsetzung.

## Quelle und Ziel

Das Match `match_85f8dc10007f057d` zeigt zwei getrennte Corp-KI-Fehler:
`purge_runner_virus_counters` liest sichtbare Highlighter-Counter nicht, und
ein Fast-Advance-Plan überstimmt eine deutlich stärkere, sofortige
R&D-Verteidigung. Beide Ursachen werden generisch und ohne Hidden-Information
behoben.

## Invarianten

- Nur Corp-PlayerView, öffentliche Events und LegalActions werden konsumiert.
- Purgen bleibt bei keiner sichtbaren Wirkung unattraktiv.
- Ein Plan darf einen konkreten, dringenden Schutzschritt nicht ohne
  fachlich nachvollziehbaren Vorrang überstimmen.

## Paketfolge

### P1 – Runner-Virus-Purge sichtbar machen

Decision 8 als spielgleichen Checkpoint sichern, die sichtbaren
Runner-Virus-Counter bis zum Purge-Consumer führen und eine Null-Counter-
Gegenprobe erhalten. Commit: `fix(ai): value visible runner virus purge pressure`.

### P2 – Akuten R&D-Schutz vor ungeeignetem Fast Advance schützen

Decision 13 als spielgleichen Checkpoint sichern. Nur die Arbitration
korrigieren, die Data Wall vor R&D trotz Rohscore 5233 zugunsten einer
ungeschützten Agenda-Installation überstimmt. Eine echte Fast-Advance-
Gegenprobe bleibt grün. Commit:
`fix(ai): preserve urgent rd defense over fast advance`.

### P3 – Abschluss

Beide Checkpoints, Gegenproben, relevante Runtime-Tests, Typecheck und
`git diff --check` ausführen; Ergebnis dokumentieren, lokal nach `main`
mergen und Worktree/Branch erst danach geprüft entfernen.

## Arbeitsumgebung

- Branch: `codex/highlighter-purge-rd-pressure`
- Worktree: `C:\Projekte\NETGRID_HIGHLIGHTER_PURGE_RDPRESSURE`
- Gesamtziel: Beide Fehlverhalten mit roten und grünen spielgleichen
  Checkpoints absichern, lokal integrieren und sauber aufräumen.
