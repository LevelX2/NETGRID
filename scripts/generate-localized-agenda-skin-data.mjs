import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skinRoot = path.join(repoRoot, "data", "card-assets", "localized", "de");
const artRoot = path.join(skinRoot, "art");
const tmpArtRoot = path.join(repoRoot, "tmp", "localized-card-art-svg");
const originalCardsPath = path.join(repoRoot, "data", "cards", "originalset-v1-cards.json");
const cardsOutPath = path.join(skinRoot, "cards.de.json");

const source = JSON.parse(await readFile(originalCardsPath, "utf8"));
const agendas = source.cards
  .filter((card) => card.type === "agenda")
  .sort((a, b) => Number(a.collectorNumber) - Number(b.collectorNumber));

if (agendas.length !== 33) {
  throw new Error(`Expected 33 originalset agenda cards, found ${agendas.length}.`);
}

const projectClassLabels = {
  "gray-ops": "Graue Operation",
  "black-ops": "Schwarze Operation",
  research: "Forschung",
  asset: "Anlage"
};

const text = (value) => ({ type: "text", text: value });
const action = (amount = 1) => ({ type: "symbol", symbol: "action", amount });
const gridmark = (amount) => ({ type: "symbol", symbol: "gridmark", amount });
const paragraph = (...segments) => ({ type: "paragraph", segments });

const localizations = {
  "onr_v1_188_ai-chief-financial-officer": {
    localizedTitle: "KI-Finanzvorstand",
    artTheme: "finance-ai",
    palette: ["#10233c", "#00d4ff", "#39f4a2", "#f7d35a"],
    artPrompt:
      "Cyberpunk corporate finance command room with an abstract AI executive presence, holographic ledgers, secure vault geometry, no readable text.",
    localizedRules: [
      paragraph(
        action(),
        text("Mische Karten aus Hauptquartier und Archiv in F&E; ziehe dann 5 Karten.")
      )
    ]
  },
  "onr_v1_189_artificial-security-directors": {
    localizedTitle: "Künstliche Sicherheitsdirektion",
    artTheme: "security-board",
    palette: ["#211333", "#46f7ff", "#a58cff", "#ffdf73"],
    artPrompt:
      "Cyberpunk security boardroom run by abstract machine directors, surveillance panes and access-control glass, no readable text.",
    localizedRules: [
      paragraph(text("Entwicklungskosten von Projekten der Klasse Schwarze Operation sind um 1 reduziert."))
    ]
  },
  "onr_v1_190_bioweapons-engineering": {
    localizedTitle: "Biowaffen-Engineering",
    artTheme: "bio-lab",
    palette: ["#102820", "#77ff88", "#18b6ff", "#f05a8a"],
    artPrompt:
      "Corporate cyberpunk bioengineering lab with sealed vats, gene helix lights and hazard-glass architecture, no readable text.",
    localizedRules: [paragraph(text("Jede Quelle von Fleischschaden verursacht +1 Fleischschaden."))]
  },
  "onr_v1_191_black-ice-quality-assurance": {
    localizedTitle: "Qualitätssicherung für Schwarzes ICE",
    artTheme: "black-ice",
    palette: ["#090b18", "#27e2ff", "#7158ff", "#d7f7ff"],
    artPrompt:
      "Dark cyberpunk black ICE quality lab, crystalline defensive code structures under diagnostic light, no readable text.",
    localizedRules: [paragraph(text("Alles schwarze ICE hat +2 Stärke."))]
  },
  "onr_v1_192_corporate-boon": {
    localizedTitle: "Konzernbonus",
    artTheme: "corporate-boon",
    palette: ["#1f2630", "#39f4a2", "#ffd166", "#43b6ff"],
    artPrompt:
      "Prestige corporate benefit vault, executive reward circuitry and stacked luminous counters, no readable text.",
    localizedRules: [
      paragraph(text("Lege 4 Bonus-Zähler auf dieses Projekt.")),
      paragraph(text("Bonus-Zähler: Erhalte 1 Aktion. Nur 1x pro Zug in deinem Zug."))
    ]
  },
  "onr_v1_193_corporate-coup": {
    localizedTitle: "Konzernputsch",
    artTheme: "coup",
    palette: ["#250f18", "#ff4d6d", "#ffd166", "#2be4ff"],
    artPrompt:
      "Cyberpunk hostile boardroom coup, corporate towers fractured by red security light and encrypted takeover lines, no readable text.",
    localizedRules: [
      paragraph(text("Lege "), gridmark(15), text(" aus der Bank auf dieses Projekt.")),
      paragraph(action(), text("Nimm "), gridmark(3), text(" davon."))
    ]
  },
  "onr_v1_194_corporate-downsizing": {
    localizedTitle: "Konzernabbau",
    artTheme: "downsizing",
    palette: ["#23151d", "#ff8a3d", "#f6e05e", "#33d6ff"],
    artPrompt:
      "Corporate downsizing in a neon operations floor, empty workstations and severed network lines, no readable text.",
    localizedRules: [
      paragraph(
        text("Zeige dem Runner Agendas aus dem Hauptquartier. Erhalte das Doppelte ihrer Projektpunkte als Gridmark; mische sie in F&E.")
      )
    ]
  },
  "onr_v1_195_corporate-retreat": {
    localizedTitle: "Konzernrückzug",
    artTheme: "retreat",
    palette: ["#10243a", "#4fd1ff", "#8ee35d", "#f8c35d"],
    artPrompt:
      "Corporate evacuation from a sealed headquarters, mobile command pods and retreating light trails, no readable text.",
    localizedRules: [
      paragraph(text("Bis du eine Karte installierst oder aktivierst:")),
      paragraph(action(), text("Erhalte "), gridmark(2), text("."))
    ]
  },
  "onr_v1_196_corporate-war": {
    localizedTitle: "Konzernkrieg",
    artTheme: "war",
    palette: ["#1d0d13", "#ff394f", "#ffb84a", "#37c7ff"],
    artPrompt:
      "Corporate cyberwar command map with competing megacorp towers, red-orange alert grids and data salvos, no readable text.",
    localizedRules: [
      paragraph(text("Mit 12+ Gridmark im Vorrat: erhalte "), gridmark(12), text(". Sonst verlierst du alle Gridmark."))
    ]
  },
  "onr_v1_197_data-fort-reclamation": {
    localizedTitle: "Datenfestung-Rückgewinnung",
    artTheme: "data-fort",
    palette: ["#101d2c", "#45e8ff", "#7bffae", "#ffd166"],
    artPrompt:
      "Cyberpunk data fortress reclamation, rebuilt server bastion and corporate installation rigs, no readable text.",
    localizedRules: [
      paragraph(
        text("Erhalte "),
        gridmark(10),
        text(" für bis zu 4 Karten aus dem Hauptquartier: installiere sie einzeln in einer neuen Datenfestung; Rest zurück.")
      )
    ]
  },
  "onr_v1_198_detroit-police-contract": {
    localizedTitle: "Detroit-Polizeivertrag",
    artTheme: "police-contract",
    palette: ["#101826", "#2b8dff", "#ff4d6d", "#dce8ff"],
    artPrompt:
      "Private cyberpunk police contract in Detroit, armored drones, rain, city grid and corporate badges without logos or text.",
    localizedRules: [
      paragraph(text("Lege "), gridmark(12), text(" aus der Bank auf dieses Projekt.")),
      paragraph(text("Zu Beginn deines Zugs nimm "), gridmark(2), text(" davon."))
    ]
  },
  "onr_v1_199_employee-empowerment": {
    localizedTitle: "Mitarbeiterermächtigung",
    artTheme: "empowerment",
    palette: ["#192336", "#2ce7ff", "#ffd166", "#8ef06b"],
    artPrompt:
      "Cyberpunk corporate workforce empowerment, employees at luminous terminals connected by green-blue network lanes, no readable text.",
    localizedRules: [
      paragraph(text("Du darfst zu Zugbeginn 1 zusätzliche Karte ziehen.")),
      paragraph(action(), text("Ziehe 2 Karten."))
    ]
  },
  "onr_v1_200_encryption-breakthrough": {
    localizedTitle: "Verschlüsselungsdurchbruch",
    artTheme: "encryption",
    palette: ["#07192b", "#21d4ff", "#b96cff", "#f8e16c"],
    artPrompt:
      "Cyberpunk encryption breakthrough, code-gate lattice cracking open into clean corporate light, no readable text.",
    localizedRules: [
      paragraph(text("Alle Code-Gates haben +1 Stärke.")),
      paragraph(text("Zeige beliebig viele Code-Gates; erhalte "), gridmark(1), text(" je gezeigtem oder aktiviertem Code-Gate."))
    ]
  },
  "onr_v1_201_executive-extraction": {
    localizedTitle: "Führungskräfte-Extraktion",
    artTheme: "extraction",
    palette: ["#1b1727", "#ff5f7e", "#4de2ff", "#f6c85f"],
    artPrompt:
      "Cyberpunk executive extraction from a corporate tower, stealth VTOL silhouettes and encrypted escape corridors, no readable text.",
    localizedRules: [
      paragraph(text("Entwicklungskosten von Projekten der Klasse Graue Operation sind um 1 reduziert."))
    ]
  },
  "onr_v1_202_genetics-visionary-acquisition": {
    localizedTitle: "Übernahme von Genetics-Visionary",
    artTheme: "acquisition-bio",
    palette: ["#17233a", "#64f2c8", "#f76fb2", "#f4d35e"],
    artPrompt:
      "Corporate acquisition of a futuristic genetics company, clean biotech tower and merger network streams, no readable text.",
    localizedRules: [
      paragraph(text("Entwicklungskosten von Projekten der Klasse Forschung sind um 1 reduziert."))
    ]
  },
  "onr_v1_203_hostile-takeover": {
    localizedTitle: "Feindliche Übernahme",
    artTheme: "hostile-takeover",
    palette: ["#171d2b", "#ff4d6d", "#ffd166", "#2ce7ff"],
    artPrompt:
      "Cyberpunk hostile takeover, corporate skyscraper seized by red acquisition lines and cold blue network grids, no readable text.",
    localizedRules: [paragraph(text("Erhalte "), gridmark(5), text("."))]
  },
  "onr_v1_204_ice-transmutation": {
    localizedTitle: "ICE-Transmutation",
    artTheme: "ice-transmutation",
    palette: ["#081426", "#45e8ff", "#9b5cff", "#d7f7ff"],
    artPrompt:
      "Cyberpunk ICE transmutation, crystalline code defense morphing into repeated subroutine prisms, no readable text.",
    localizedRules: [
      paragraph(text("Wähle ein aktiviertes ICE: Es erhält +1 Stärke; jede Subroutine darauf wird einmal direkt wiederholt."))
    ]
  },
  "onr_v1_205_main-office-relocation": {
    localizedTitle: "Hauptquartier-Verlegung",
    artTheme: "relocation",
    palette: ["#12243a", "#37d8ff", "#f9c74f", "#90f06a"],
    artPrompt:
      "Corporate headquarters relocation, mobile tower modules and secure transit corridors over a neon city, no readable text.",
    localizedRules: [paragraph(text("Handlimit +2."))]
  },
  "onr_v1_206_marine-arcology": {
    localizedTitle: "Meeres-Arkologie",
    artTheme: "arcology",
    palette: ["#062033", "#24c6dc", "#5fffa2", "#ffd166"],
    artPrompt:
      "Marine cyberpunk arcology above dark water, corporate habitat domes and undersea fiber-optic networks, no readable text.",
    localizedRules: [paragraph(action(2), text("Erhalte "), gridmark(3), text("."))]
  },
  "onr_v1_207_netwatch-operations-office": {
    localizedTitle: "Netwatch-Einsatzzentrale",
    artTheme: "netwatch",
    palette: ["#101a2a", "#2ce7ff", "#ff4d6d", "#e4f8ff"],
    artPrompt:
      "Cyberpunk network operations office, trace consoles, signal triangulation beams and corporate security glass, no readable text.",
    localizedRules: [
      paragraph(action(), text("Ortung 2 - bei Erfolg erhält der Runner 1 Markierung."))
    ]
  },
  "onr_v1_208_on-call-solo-team": {
    localizedTitle: "Solo-Einsatzteam",
    artTheme: "solo-team",
    palette: ["#15141c", "#ff6b35", "#ffd166", "#42d9ff"],
    artPrompt:
      "On-call cyberpunk solo response team in a corporate armory, tactical silhouettes and amber alert lighting, no readable text.",
    localizedRules: [
      paragraph(action(), text("Verursache 1 Fleischschaden. Nur wenn der Runner markiert ist."))
    ]
  },
  "onr_v1_209_political-coup": {
    localizedTitle: "Politischer Putsch",
    artTheme: "political-coup",
    palette: ["#211320", "#ff4d6d", "#ffd166", "#43d8ff"],
    artPrompt:
      "Cyberpunk political coup, corporate influence over a government chamber with neon red control lines, no readable text.",
    localizedRules: [
      paragraph(text("Lege "), gridmark(12), text(" aus der Bank auf dieses Projekt.")),
      paragraph(action(), text("Nimm "), gridmark(3), text(" davon."))
    ]
  },
  "onr_v1_210_political-overthrow": {
    localizedTitle: "Politischer Umsturz",
    artTheme: "overthrow",
    palette: ["#1d1225", "#e84dff", "#ffb84a", "#29d8ff"],
    artPrompt:
      "Cyberpunk political overthrow, shattered public authority architecture replaced by corporate network control, no readable text.",
    localizedRules: [paragraph(action(), text("Erhalte "), gridmark(3), text("."))]
  },
  "onr_v1_211_polymer-breakthrough": {
    localizedTitle: "Polymer-Durchbruch",
    artTheme: "polymer",
    palette: ["#14212c", "#8ef06a", "#29d8ff", "#f4d35e"],
    artPrompt:
      "Futuristic polymer breakthrough lab, smart material sheets flowing through corporate fabrication rigs, no readable text.",
    localizedRules: [paragraph(text("Erhalte zu Beginn jedes deiner Züge "), gridmark(1), text("."))]
  },
  "onr_v1_212_priority-requisition": {
    localizedTitle: "Priorisierte Anforderung",
    artTheme: "requisition",
    palette: ["#152033", "#29d8ff", "#ffd166", "#8ef06a"],
    artPrompt:
      "Priority corporate requisition, heavy ICE hardware deployed from a secure logistics bay into a network corridor, no readable text.",
    localizedRules: [paragraph(text("Du darfst 1 ICE kostenlos aktivieren."))]
  },
  "onr_v1_213_private-cybernet-police": {
    localizedTitle: "Private Cybernet-Polizei",
    artTheme: "cybernet-police",
    palette: ["#0f1724", "#2b8dff", "#ff4d6d", "#d8f8ff"],
    artPrompt:
      "Private cybernet police unit, synthetic officers and trace drones in a corporate surveillance district, no readable text.",
    localizedRules: [
      paragraph(action(), text("Ortung 5 - bei Erfolg erhält der Runner 1 Markierung."))
    ]
  },
  "onr_v1_214_project-babylon": {
    localizedTitle: "Projekt Babylon",
    artTheme: "babylon",
    palette: ["#17142d", "#b86cff", "#ffd166", "#38d8ff"],
    artPrompt:
      "Project Babylon as a towering cyberpunk megastructure rising through network clouds and corporate scaffolds, no readable text.",
    localizedRules: [
      paragraph(text("Erhalte 1 zusätzlichen Projektpunkt für je 2 Advancement-Counter über der Entwicklungskosten-Schwelle."))
    ]
  },
  "onr_v1_215_security-net-optimization": {
    localizedTitle: "Sicherheitsnetz-Optimierung",
    artTheme: "security-net",
    palette: ["#091b2f", "#21d4ff", "#8ef06a", "#ffd166"],
    artPrompt:
      "Optimized security net over a corporate data fort, reinforced ICE lines and luminous defensive mesh, no readable text.",
    localizedRules: [
      paragraph(text("Wähle eine Datenfestung. ICE auf dieser Datenfestung erhält +1 Stärke."))
    ]
  },
  "onr_v1_216_security-purge": {
    localizedTitle: "Sicherheitssäuberung",
    artTheme: "purge",
    palette: ["#111827", "#ff6b35", "#f9c74f", "#33d6ff"],
    artPrompt:
      "Cyberpunk security purge, corporate firewall sweep burning through a network archive and exposing ICE shapes, no readable text.",
    localizedRules: [
      paragraph(text("Zeige dem Runner die obersten 3 F&E-Karten. Installiere und aktiviere ICE daraus kostenlos; wirf den Rest ab."))
    ]
  },
  "onr_v1_217_strike-force-kali": {
    localizedTitle: "Einsatzgruppe Kali",
    artTheme: "strike-force",
    palette: ["#1a1016", "#ff3b5c", "#ffb84a", "#35d6ff"],
    artPrompt:
      "Cyberpunk strike force Kali, elite corporate tactical squad with crimson network targeting and no insignia text.",
    localizedRules: [
      paragraph(action(), text("Verursache 2 Fleischschaden. Nur wenn der Runner markiert ist."))
    ]
  },
  "onr_v1_218_subsidiary-branch": {
    localizedTitle: "Tochterfiliale",
    artTheme: "subsidiary",
    palette: ["#152033", "#42d9ff", "#8ef06a", "#ffd166"],
    artPrompt:
      "Corporate subsidiary branch office expanding through a city network, modular tower nodes and workflow channels, no readable text.",
    localizedRules: [paragraph(text("Erhalte in jedem deiner Züge 1 zusätzliche Aktion."))]
  },
  "onr_v1_219_superior-net-barriers": {
    localizedTitle: "Überlegene Netzbarrieren",
    artTheme: "net-barriers",
    palette: ["#071426", "#29d8ff", "#8ef06a", "#d7f7ff"],
    artPrompt:
      "Superior cyberpunk net barriers, layered luminous wall ICE plates protecting a corporate server horizon, no readable text.",
    localizedRules: [
      paragraph(text("Alle Barriere-ICE haben +1 Stärke.")),
      paragraph(text("Zeige beliebig viele Barriere-ICE; erhalte "), gridmark(1), text(" je gezeigtem oder aktiviertem Barriere-ICE."))
    ]
  },
  "onr_v1_220_tycho-extension": {
    localizedTitle: "Tycho-Erweiterung",
    artTheme: "tycho",
    palette: ["#10172b", "#b86cff", "#29d8ff", "#f4d35e"],
    artPrompt:
      "Tycho space extension as a corporate lunar network facility, orbital infrastructure and violet-blue data beams, no readable text.",
    localizedRules: []
  }
};

await Promise.all([
  mkdir(artRoot, { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "svg"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "full"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "preview"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "thumb"), { recursive: true }),
  mkdir(tmpArtRoot, { recursive: true })
]);

const cards = [];
for (const sourceCard of agendas) {
  const localization = localizations[sourceCard.cardId];
  if (!localization) {
    throw new Error(`Missing German localization for ${sourceCard.cardId}.`);
  }

  const classes = sourceCard.subtypes.filter((subtype) => projectClassLabels[subtype]);
  const localizedClass = classes.length
    ? `Projekt - ${classes.map((subtype) => projectClassLabels[subtype]).join(" / ")}`
    : "Projekt";

  const artFileName = `${sourceCard.cardId}.png`;
  const artPath = path.join(artRoot, artFileName);
  if (!existsSync(artPath)) {
    await generateProceduralArt(sourceCard, localization, artPath);
  }

  cards.push({
    cardId: sourceCard.cardId,
    sourceTitle: sourceCard.title,
    localizedTitle: localization.localizedTitle,
    frameId: "project-frame-v1",
    type: "project",
    displayOnly: true,
    sourceProjectClass: classes.join("/"),
    sourceProjectClasses: classes,
    sourceSubtypes: sourceCard.subtypes,
    localizedProjectClass: localizedClass,
    advancementRequirement: sourceCard.numeric.advancementRequirement,
    projectPoints: sourceCard.numeric.agendaPoints,
    sourceText: sourceCard.text,
    localizedRules: localization.localizedRules,
    localizedRulesText: plainText(localization.localizedRules),
    artPrompt: localization.artPrompt,
    artGeneration: {
      method: "project-local generated or preserved raster draft",
      status: existsSync(artPath) ? "present" : "generated",
      constraints: ["no official artwork", "no official frame", "no logos", "no readable text in image"]
    },
    art: `art/${artFileName}`,
    rendered: {
      svg: `rendered/svg/${sourceCard.cardId}.svg`,
      full: `rendered/full/${sourceCard.cardId}.png`,
      preview: `rendered/preview/${sourceCard.cardId}.png`,
      thumb: `rendered/thumb/${sourceCard.cardId}.png`
    }
  });
}

const out = {
  schemaVersion: "localized-card-skin-v1",
  locale: "de",
  skinId: "de-project-frame-v1-originalset-agendas",
  status: "draft_complete_originalset_agendas_display_only",
  generatedAt: "2026-05-24",
  sourceSetId: source.setId,
  sourceCardFile: "data/cards/originalset-v1-cards.json",
  scope: {
    cardType: "agenda",
    expectedCount: 33,
    actualCount: cards.length,
    displayOnly: true,
    engineRuleAuthority: false
  },
  fallbackPolicy:
    "Wenn eine deutsche Skin-Karte vorhanden ist, kann sie als Anzeigeersatz dienen; fehlt sie, bleibt die Originalanzeige Fallback.",
  notes: [
    "Die internen cardIds bleiben die Originalkarten-IDs.",
    "Diese Skin-Schicht ist keine Regelautorität und ändert keine LegalActions, Replay-, StateHash-, KI- oder Decklegalitätsdaten.",
    "sourceText ist Originaltext für Nachvollziehbarkeit; lokalisiert gerendert werden nur localizedTitle, localizedProjectClass und localizedRules.",
    "Projektklassen sind strukturiert als sourceProjectClasses und sichtbar als localizedProjectClass hinterlegt."
  ],
  cards
};

await writeFile(cardsOutPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(repoRoot, cardsOutPath)} with ${cards.length} cards.`);

async function generateProceduralArt(sourceCard, localization, outPath) {
  const svgPath = path.join(tmpArtRoot, `${sourceCard.cardId}.svg`);
  await writeFile(svgPath, artSvg(sourceCard, localization), "utf8");
  execFileSync("magick", [svgPath, outPath], { stdio: "inherit" });
}

function plainText(blocks) {
  return blocks
    .map((block) =>
      block.segments
        .map((segment) => {
          if (segment.type === "text") return segment.text;
          if (segment.symbol === "action") return segment.amount === 1 ? "1 Aktion " : `${segment.amount} Aktionen `;
          if (segment.symbol === "gridmark") return segment.amount == null ? "Gridmark" : `${segment.amount} Gridmark`;
          return "";
        })
        .join("")
        .replace(/\s+([.;,:])/g, "$1")
        .replace(/\s+/g, " ")
        .replace(/^(\d+ Aktionen?)\s+/, "$1: ")
        .trim()
    )
    .join("\n");
}

function artSvg(sourceCard, localization) {
  const [dark, primary, secondary, accent] = localization.palette;
  const seed = hashString(sourceCard.cardId);
  const nodes = Array.from({ length: 34 }, (_, index) => {
    const localSeed = seed + index * 7919;
    return {
      x: 80 + (pseudo(localSeed) * 1090),
      y: 70 + (pseudo(localSeed + 17) * 990),
      r: 4 + Math.round(pseudo(localSeed + 31) * 11),
      opacity: 0.24 + pseudo(localSeed + 47) * 0.46
    };
  });
  const lines = nodes
    .slice(0, 24)
    .map((node, index) => {
      const other = nodes[(index * 7 + 5) % nodes.length];
      return `<path d="M${node.x.toFixed(1)} ${node.y.toFixed(1)} L${other.x.toFixed(1)} ${other.y.toFixed(1)}" stroke="${index % 3 === 0 ? secondary : primary}" stroke-width="${1.2 + (index % 4)}" opacity="${0.13 + (index % 5) * 0.035}"/>`;
    })
    .join("\n");
  const nodeSvg = nodes
    .map(
      (node, index) =>
        `<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${node.r}" fill="${index % 2 ? primary : accent}" opacity="${node.opacity.toFixed(2)}"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1252" height="1140" viewBox="0 0 1252 1140">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="0.56" stop-color="${mix(dark, primary, 0.18)}"/>
      <stop offset="1" stop-color="${mix(dark, secondary, 0.22)}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="32%" cy="28%" r="56%">
      <stop offset="0" stop-color="${primary}" stop-opacity="0.68"/>
      <stop offset="0.42" stop-color="${primary}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="76%" cy="70%" r="58%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.44"/>
      <stop offset="0.45" stop-color="${accent}" stop-opacity="0.13"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect width="1252" height="1140" fill="url(#bg)"/>
  <rect width="1252" height="1140" fill="url(#glowA)"/>
  <rect width="1252" height="1140" fill="url(#glowB)"/>
  <g opacity="0.19" stroke="${primary}" stroke-width="1">
    ${gridLines(1252, 1140, 54)}
  </g>
  <g opacity="0.62">${lines}</g>
  <g filter="url(#soft)">${nodeSvg}</g>
  ${motifSvg(localization.artTheme, localization.palette, seed)}
  <g opacity="0.24" fill="none" stroke="${secondary}" stroke-width="5">
    <path d="M86 952 C244 858 372 1004 538 902 S850 794 1124 876"/>
    <path d="M108 250 C298 336 418 190 610 278 S936 430 1140 304"/>
  </g>
  <rect x="0" y="0" width="1252" height="1140" fill="none" stroke="${mix(primary, "#ffffff", 0.35)}" stroke-width="12" opacity="0.32"/>
</svg>`;
}

function motifSvg(theme, palette, seed) {
  const [dark, primary, secondary, accent] = palette;
  const glow = mix(primary, "#ffffff", 0.35);
  const commonPanel = `<g opacity="0.55" fill="${mix(dark, "#ffffff", 0.08)}" stroke="${glow}" stroke-width="5">
    <path d="M312 258 H900 L1014 394 V786 L884 902 H332 L224 784 V382 Z" opacity="0.32"/>
    <path d="M394 332 H824 L908 426 V718 L812 806 H428 L346 716 V428 Z" opacity="0.22"/>
  </g>`;

  if (theme.includes("bio") || theme === "polymer") {
    return `${commonPanel}<g fill="none" stroke-linecap="round">
      ${helix(420, 210, 430, 720, primary, accent)}
      <path d="M730 290 C842 360 860 522 760 636 S678 806 838 896" stroke="${secondary}" stroke-width="10" opacity="0.52"/>
      <path d="M752 306 C832 378 830 502 742 618 S704 792 812 868" stroke="${accent}" stroke-width="5" opacity="0.72"/>
    </g>`;
  }
  if (theme.includes("ice") || theme.includes("barriers") || theme.includes("encryption")) {
    return `${commonPanel}<g fill="${mix(dark, primary, 0.24)}" stroke="${glow}" stroke-width="6" opacity="0.78">
      <path d="M274 792 L416 236 L562 792 Z"/>
      <path d="M476 828 L642 164 L812 828 Z"/>
      <path d="M742 796 L900 286 L1038 796 Z"/>
      <path d="M310 776 H1018" fill="none" opacity="0.62"/>
    </g><g opacity="0.42" stroke="${accent}" stroke-width="8"><path d="M406 418 H928"/><path d="M360 604 H974"/><path d="M520 246 L812 828"/></g>`;
  }
  if (theme.includes("police") || theme.includes("netwatch") || theme.includes("security") || theme.includes("strike") || theme.includes("solo")) {
    return `${commonPanel}<g fill="none" stroke-linejoin="round">
      <path d="M626 214 L914 344 V558 C914 746 794 868 626 940 C458 868 338 746 338 558 V344 Z" fill="${mix(dark, primary, 0.22)}" stroke="${glow}" stroke-width="8" opacity="0.72"/>
      <path d="M626 318 L808 400 V552 C808 668 736 746 626 802 C516 746 444 668 444 552 V400 Z" stroke="${accent}" stroke-width="6" opacity="0.78"/>
      <path d="M256 574 H996 M626 236 V922 M382 410 L870 790 M870 410 L382 790" stroke="${secondary}" stroke-width="5" opacity="0.34"/>
    </g>`;
  }
  if (theme.includes("coup") || theme.includes("war") || theme.includes("overthrow") || theme.includes("takeover")) {
    return `${commonPanel}<g fill="${mix(dark, accent, 0.2)}" stroke="${glow}" stroke-width="6" opacity="0.74">
      <path d="M246 884 L364 340 L496 884 Z"/>
      <path d="M522 884 L642 232 L774 884 Z"/>
      <path d="M784 884 L908 372 L1038 884 Z"/>
      <path d="M194 884 H1086" fill="none"/>
    </g><g stroke="${accent}" stroke-width="10" opacity="0.58"><path d="M276 720 C472 646 586 554 712 426 S914 274 1068 240"/><path d="M250 466 C412 534 558 594 756 652 S960 786 1090 878"/></g>`;
  }
  if (theme.includes("arcology") || theme.includes("tycho")) {
    return `${commonPanel}<g fill="${mix(dark, primary, 0.18)}" stroke="${glow}" stroke-width="7" opacity="0.76">
      <path d="M246 746 C324 484 512 328 626 328 C740 328 928 484 1006 746 Z"/>
      <path d="M366 746 C420 574 536 476 626 476 C716 476 832 574 886 746 Z"/>
      <path d="M206 828 H1046"/>
      <path d="M320 900 H932"/>
    </g><g fill="none" stroke="${secondary}" stroke-width="5" opacity="0.48"><path d="M278 760 C438 680 804 680 974 760"/><path d="M420 532 C528 580 716 580 824 532"/></g>`;
  }
  if (theme.includes("finance") || theme.includes("boon") || theme.includes("subsidiary") || theme.includes("relocation") || theme.includes("requisition")) {
    return `${commonPanel}<g fill="${mix(dark, primary, 0.18)}" stroke="${glow}" stroke-width="6" opacity="0.76">
      <rect x="286" y="412" width="138" height="454" rx="18"/>
      <rect x="474" y="302" width="160" height="564" rx="18"/>
      <rect x="688" y="358" width="146" height="508" rx="18"/>
      <rect x="884" y="470" width="122" height="396" rx="18"/>
      <path d="M226 866 H1066" fill="none"/>
    </g><g stroke="${accent}" stroke-width="5" opacity="0.45">${windowGrid(312, 456, 86, 330)}${windowGrid(510, 350, 88, 420)}${windowGrid(720, 408, 82, 376)}${windowGrid(908, 512, 74, 286)}</g>`;
  }

  const offset = Math.round(pseudo(seed + 121) * 70);
  return `${commonPanel}<g fill="none" stroke-linecap="round">
    <path d="M306 ${320 + offset} C478 180 774 196 944 ${362 - offset / 2} S964 812 744 896 S284 812 276 572" stroke="${glow}" stroke-width="10" opacity="0.62"/>
    <path d="M396 512 H866 M626 284 V886 M450 374 L812 752 M812 374 L450 752" stroke="${accent}" stroke-width="6" opacity="0.42"/>
  </g>`;
}

function helix(x, y, width, height, primary, accent) {
  const rows = 11;
  const parts = [];
  for (let i = 0; i < rows; i += 1) {
    const yy = y + (height / (rows - 1)) * i;
    const left = x + width * (0.18 + 0.14 * Math.sin(i));
    const right = x + width * (0.72 + 0.14 * Math.cos(i));
    parts.push(`<path d="M${left.toFixed(1)} ${yy.toFixed(1)} H${right.toFixed(1)}" stroke="${i % 2 ? primary : accent}" stroke-width="5" opacity="0.42"/>`);
  }
  return `${parts.join("")}<path d="M${x + width * 0.2} ${y} C${x + width * 0.9} ${y + height * 0.25} ${x - width * 0.1} ${y + height * 0.75} ${x + width * 0.72} ${y + height}" stroke="${primary}" stroke-width="11" opacity="0.62"/><path d="M${x + width * 0.72} ${y} C${x - width * 0.1} ${y + height * 0.25} ${x + width * 0.9} ${y + height * 0.75} ${x + width * 0.2} ${y + height}" stroke="${accent}" stroke-width="6" opacity="0.76"/>`;
}

function windowGrid(x, y, width, height) {
  const parts = [];
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      parts.push(`<path d="M${x + col * width * 0.34} ${y + row * height * 0.13} h${width * 0.18}"/>`);
    }
  }
  return parts.join("");
}

function gridLines(width, height, step) {
  const parts = [];
  for (let x = step; x < width; x += step) parts.push(`<path d="M${x} 0 V${height}"/>`);
  for (let y = step; y < height; y += step) parts.push(`<path d="M0 ${y} H${width}"/>`);
  return parts.join("");
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudo(seed) {
  let value = seed >>> 0;
  value += 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function mix(a, b, weight) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const mixed = ca.map((channel, index) => Math.round(channel * (1 - weight) + cb[index] * weight));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseColor(color) {
  const normalized = color.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}
