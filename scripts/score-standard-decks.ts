import { readFileSync, writeFileSync } from "node:fs";
import { importDeck } from "../packages/decks/src/index";
import catalog from "../data/decks/standard-deck-catalog-1.0.0.json";
import {
  axes,
  scoreDecks,
  type DeckToScore,
} from "./lib/standard-deck-scoring";

const [output, ...trialPaths] = process.argv.slice(2);
if (!output)
  throw new Error(
    "Aufruf: node --import tsx scripts/score-standard-decks.ts <Bericht.html> [Deckimport.json ...]",
  );

const standard = catalog.decks
  .filter((deck) => deck.status === "active")
  .map((deck): DeckToScore => {
    if (deck.side !== "runner" && deck.side !== "corp")
      throw new Error(`Unbekannte Deckseite: ${deck.standardDeckId}`);
    return {
      id: deck.standardDeckId,
      name: deck.name,
      version: deck.version,
      side: deck.side,
      cards: deck.cards,
    };
  });
const trials = trialPaths.map((path): DeckToScore => {
  const result = importDeck(readFileSync(path, "utf8"));
  if (!result.ok) throw new Error(`${path}: ${result.errors.join(", ")}`);
  const { deck } = result;
  return {
    id: deck.deckId,
    version: deck.deckVersion,
    name: deck.name,
    side: deck.side,
    cards: deck.cards,
    trial: true,
  };
});
const decks = scoreDecks([...standard, ...trials]);
if (new Set(decks.map(({ deck }) => deck.id)).size !== decks.length)
  throw new Error("Doppelte Deck-ID im Deckvergleich");

const esc = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const fmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const sections = (["runner", "corp"] as const)
  .map((side) => {
    const name = side === "runner" ? "Runner" : "Corporation";
    const criteria = axes[side];
    const rows = decks
      .filter(({ deck }) => deck.side === side)
      .sort((a, b) => a.deck.name.localeCompare(b.deck.name, "de"));
    const standardCount = rows.filter(({ deck }) => !deck.trial).length;
    const table = rows
      .map(
        ({ deck, size, metrics }) => `<tr>
    <th scope="row" data-value="${esc(deck.name)}"><a href="#${esc(deck.id)}">${esc(deck.name)}</a>${deck.trial ? " <small>Test</small>" : ""}</th>
    <td data-value="${size}">${size}</td>
    ${criteria
      .map(([key]) => {
        const value = metrics[key]!.score;
        return `<td data-value="${value}" class="score" style="--shade:${value * 5}%">${value}</td>`;
      })
      .join("")}
  </tr>`,
      )
      .join("\n");
    const details = rows
      .map(
        ({ deck, size, metrics }) => `<details id="${esc(deck.id)}">
    <summary>${esc(deck.name)} <small>${deck.trial ? "Importierte Testfassung" : esc(deck.version)} · ${size} Karten</small></summary>
    <dl class="profile">${criteria
      .map(([key, label]) => {
        const { score, detail, evidence } = metrics[key]!;
        return `<div><dt>${esc(label)} <strong>${score}/10</strong></dt><dd><p>${esc(detail)}</p>
        ${evidence.length ? `<p>${evidence.map((e) => `${e.quantity}× ${esc(e.title)} <small>(${fmt.format(e.weight)})</small>`).join(" · ")}</p>` : "<p>Keine anrechenbare Kartenkopie.</p>"}</dd></div>`;
      })
      .join("")}</dl>
  </details>`,
      )
      .join("\n");
    return `<section id="${side}" aria-labelledby="${side}-title">
    <h2 id="${side}-title">${name}</h2>
    <p>${standardCount} Standarddecks${rows.length > standardCount ? ` · ${rows.length - standardCount} Testfassung(en)` : ""}</p>
    <div class="scroll"><table><thead><tr>
      ${["Deck", "Karten", ...criteria.map(([, label]) => label)]
        .map(
          (label, index) =>
            `<th scope="col"${index === 0 ? ' aria-sort="ascending"' : ""}><button type="button" data-column="${index}">${esc(label)}</button></th>`,
        )
        .join("")}</tr></thead><tbody>${table}</tbody></table></div>
    <details class="criteria"><summary>Kriterien für ${name}</summary>
      <dl>${criteria.map(([, label, description]) => `<dt>${esc(label)}</dt><dd>${esc(description)}</dd>`).join("")}</dl>
    </details>
    <h3>Deckprofile und Kartenbeiträge</h3>${details}
  </section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NETGRID Standarddeck-Scoring</title>
<style>
:root{color-scheme:light;--ink:#182b2d;--paper:#f8faf7;--accent:#076556;--line:#d2ded9}
*{box-sizing:border-box}
body{font:1rem/1.55 system-ui,sans-serif;color:var(--ink);background:var(--paper);margin:0}
main{max-width:92rem;margin:auto;padding:clamp(1rem,4vw,3.5rem)}
h1{font-size:clamp(1.85rem,4vw,3rem);line-height:1.15;margin:0}
h2{font-size:1.6rem;margin:0}
section{margin-block:2.5rem;scroll-margin:1rem}
a{color:var(--accent);text-underline-offset:.17em}
nav{display:flex;gap:1rem;margin-block:1rem;font-weight:700}
details{border-bottom:1px solid var(--line);padding:.6rem 0;scroll-margin:1rem}
summary{cursor:pointer;font-weight:650}
summary small{font-weight:400;margin-left:.4rem}
dt{font-weight:650}dd{margin:0 0 .6rem}
.scroll{overflow:auto;border:1px solid var(--line);border-radius:.5rem}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;background:white}
th,td{padding:.55rem .6rem;border-bottom:1px solid var(--line)}
th[scope=row]{min-width:13rem;text-align:left;font-weight:650}
td{text-align:center}
thead th{min-width:5rem;background:#e9f1ed;vertical-align:bottom}
thead button{font:inherit;font-weight:660;background:none;color:inherit;border:0;cursor:pointer}
thead th[aria-sort=ascending] button::after{content:" ↑"}
thead th[aria-sort=descending] button::after{content:" ↓"}
.score{color:#142e29;background:color-mix(in srgb,#91cabb var(--shade),white);font-weight:600}
.criteria{margin-top:1rem}
.profile{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))}
.profile div{min-width:0;background:white;border:1px solid var(--line);border-radius:.35rem;padding:.75rem}
.profile strong{color:var(--accent);margin-left:.4rem}
.profile p{margin:.3rem 0}
.intro{max-width:72ch}
</style>
</head>
<body><main>
<h1>NETGRID Standarddeck-Scoring</h1>
<p class="intro">Je zehn Eigenschaften für Runner und Corporation. Die Skala reicht von <strong>1</strong> (fehlt oder sehr schwach ausgeprägt) bis <strong>10</strong> (Zielwert erreicht). Die Spalten lassen sich sortieren. Ein Klick auf den Decknamen öffnet die Messwerte und Kartenbeiträge.</p>
<nav aria-label="Deckseiten"><a href="#runner">Runner</a><a href="#corp">Corporation</a><a href="#methode">Methode</a></nav>
${sections}
<section id="methode"><h2>Methode</h2>
<p class="intro">Das Profil bewertet die Kartenliste. Gewichte sind redaktionelle Annahmen für Version 0.1. Die Werte sind weder Siegquoten noch eine Bewertung der KI. Das ist besonders bei Combo-, Kontroll- und Spezialdecks wichtig.</p>
<ul class="intro">
<li>Kopien und Kartenbeiträge werden in den Dichtewerten auf 45 Karten normiert. Die Blockwerte neben den Kartennamen zeigen die Beiträge vor dieser Normierung.</li>
<li>Die Startchancen bei Wirtschaft und frühem Run-Stopp verwenden fünf zufällig gezogene Karten ohne Mulligan oder Pflichtziehung.</li>
<li>Eine 10 entspricht einem festen Zielwert je Kriterium. Der Höchstwert kann mehrfach erreicht werden. Bei Sondermechaniken gilt eine Mechanikfamilie als selten, wenn sie in höchstens einem Fünftel der aktiven Standarddecks derselben Seite steckt. Der Score nutzt zu 60 % die Kopiendichte (Ziel 10) und zu 40 % die Zahl solcher Familien (Ziel 5). Testfassungen verändern die Referenz nicht.</li>
<li>Der Breaker-Vergleich nutzt als Kostenprobe ICE mit Stärke 3 und zwei Subroutinen. Situative oder einmalige Breaker tragen weniger bei. Programmsuche erhöht die Abdeckung nur für ICE-Typen, für die das Deck bereits einen Breaker führt.</li>
<li>Die Kartenbeiträge stammen aus den strukturierten Regeldaten und ausgewählten Planungshinweisen. Mehrteilige Combos, konkrete Gegner und Spielentscheidungen brauchen zusätzlich eine Spielanalyse. Für das Sonderprofil gibt es eine kuratierte Liste von Mechanikfamilien.</li>
</ul>
</section>
</main>
<script>
const collator = new Intl.Collator('de', {numeric:true});
document.querySelectorAll('button[data-column]').forEach(button => {
  button.addEventListener('click', () => {
    const heading = button.closest('th');
    const table = button.closest('table');
    const tbody = table.tBodies[0];
    const column = Number(button.dataset.column);
    const direction = heading.getAttribute('aria-sort') === 'descending' ? 1 :
      heading.getAttribute('aria-sort') === 'ascending' || column !== 0 ? -1 : 1;
    table.querySelectorAll('[aria-sort]').forEach(other => other.removeAttribute('aria-sort'));
    heading.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
    [...tbody.rows].sort((a,b) => direction * collator.compare(a.cells[column].dataset.value,b.cells[column].dataset.value) ||
      collator.compare(a.cells[0].dataset.value,b.cells[0].dataset.value)).forEach(row => tbody.append(row));
  });
});
document.querySelectorAll('tbody a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById(link.getAttribute('href').slice(1)).open = true;
  });
});
</script>
</body></html>
`;
writeFileSync(output, html, "utf8");
console.log(
  `${standard.length} Standarddeck-Profile und ${trials.length} Testprofile gespeichert. ${output}`,
);
