import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skinRoot = path.join(repoRoot, "data", "card-assets", "localized", "de");
const cardsData = JSON.parse(await readFile(path.join(skinRoot, "cards.de.json"), "utf8"));
const frame = JSON.parse(await readFile(path.join(skinRoot, "frames", "project-frame-v1.json"), "utf8"));

const WIDTH = frame.canvas.width;
const HEIGHT = frame.canvas.height;
const zones = frame.zones;
const outRoot = path.join(skinRoot, "rendered", "style-variants");
const card = cardsData.cards.find((item) => item.cardId === "onr_v1_213_private-cybernet-police") ?? cardsData.cards[0];

const compactTextStyle = {
  titleFont: "Arial Narrow, Bahnschrift Condensed, Arial, sans-serif",
  titleSize: 66,
  titleWeight: 900,
  titleFill: "#ffffff",
  titleStroke: "#0b2945",
  titleStrokeWidth: 8,
  titleTransform: "uppercase",
  titleDy: -2,
  rulesFont: "Arial, Helvetica, sans-serif",
  rulesSize: 54,
  rulesWeight: 800,
  rulesLineHeight: 65,
  rulesFill: "#04111d",
  rulesStroke: "#ffffff",
  rulesStrokeWidth: 2,
  badgeFill: "#ffffff",
  badgeStroke: "#07243e",
  badgeStrokeWidth: 6
};

const variants = [
  { ...compactTextStyle, id: "01-left-stack", label: "1 Linksleiste", decoration: "left-stack", rulesX: 350, wrapChars: 24 },
  { ...compactTextStyle, id: "02-right-stack", label: "2 Rechtsleiste", decoration: "right-stack", rulesX: 138, wrapChars: 29 },
  { ...compactTextStyle, id: "03-dual-stack", label: "3 Doppelleiste", decoration: "dual-stack", rulesX: 280, wrapChars: 24 },
  { ...compactTextStyle, id: "04-corner-rack", label: "4 Eckmodule", decoration: "corner-rack", rulesX: 210, wrapChars: 28 }
];

await Promise.all([
  mkdir(path.join(outRoot, "svg"), { recursive: true }),
  mkdir(path.join(outRoot, "preview"), { recursive: true })
]);

const svgs = [];
for (const variant of variants) {
  const svg = stripTrailingWhitespace(await renderVariantSvg(card, variant));
  const svgPath = path.join(outRoot, "svg", `${variant.id}.svg`);
  await writeFile(svgPath, svg, "utf8");
  svgs.push({ ...variant, svg });
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 372, height: 520 }, deviceScaleFactor: 1 });
  for (const variant of svgs) {
    const outPath = path.join(outRoot, "preview", `${variant.id}.png`);
    await page.setViewportSize({ width: 372, height: 520 });
    await page.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;width:372px;height:520px;background:transparent;overflow:hidden;}img{display:block;width:372px;height:520px;}</style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(variant.svg).toString("base64")}" /></body></html>`,
      { waitUntil: "load" }
    );
    await page.screenshot({ path: outPath, omitBackground: true });
  }

  await page.setViewportSize({ width: 860, height: 1160 });
  const sheetHtml = contactSheetHtml();
  await page.setContent(sheetHtml, { waitUntil: "load" });
  await page.screenshot({
    path: path.join(outRoot, "project-frame-v1-text-style-variants.png"),
    omitBackground: false
  });
} finally {
  await browser.close();
}

async function renderVariantSvg(item, variant) {
  const artBase64 = (await readFile(path.join(skinRoot, item.art))).toString("base64");
  const titleLines = fitTitle(formatTitle(item.localizedTitle, variant), variant.titleTransform ? 21 : 22);
  const rulesLines = wrapText(item.localizedRulesText, variant.wrapChars, 5);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  ${defsSvg()}
  <g clip-path="url(#cardClip)">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#outerFrame)"/>
    <image href="data:image/png;base64,${artBase64}" x="${zones.art.x}" y="${zones.art.y}" width="${zones.art.width}" height="${zones.art.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>
    ${frameSvg()}
    ${styleOverlaySvg(variant)}
    ${textSvg(item, variant, titleLines, rulesLines)}
  </g>
</svg>`;
}

function defsSvg() {
  return `<defs>
    <linearGradient id="outerFrame" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#071424"/><stop offset="0.45" stop-color="#0b1c35"/><stop offset="1" stop-color="#03101e"/>
    </linearGradient>
    <linearGradient id="titleFill" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#12385d" stop-opacity="0.98"/><stop offset="1" stop-color="#07192d" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="rulesFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f0f8ff" stop-opacity="0.96"/><stop offset="1" stop-color="#cbdcea" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="badgeFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#175987"/><stop offset="1" stop-color="#08233e"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#78f5ff" stop-opacity="0.18"/><stop offset="0.52" stop-color="#7cf7ff" stop-opacity="0.92"/><stop offset="1" stop-color="#78f5ff" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="cornerFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#15517d" stop-opacity="0.98"/><stop offset="1" stop-color="#041323" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="circuitPanel" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#06264a" stop-opacity="0.98"/><stop offset="0.55" stop-color="#0a1833" stop-opacity="0.98"/><stop offset="1" stop-color="#02101f" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="smallShadow" x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="3" flood-color="#00101f" flood-opacity="0.65"/></filter>
    <clipPath id="cardClip"><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="70" ry="70"/></clipPath>
    <clipPath id="artClip"><rect x="${zones.art.x}" y="${zones.art.y}" width="${zones.art.width}" height="${zones.art.height}" rx="18" ry="18"/></clipPath>
  </defs>`;
}

function styleOverlaySvg(variant) {
  const base = `<path d="M118 1408 H1374 V1460 H118 Z" fill="#ffffff" opacity="0.16"/>
    <path d="M130 1458 H1110" stroke="#0b6e94" stroke-width="6" opacity="0.46"/>
    <g opacity="0.18" fill="none" stroke="#06243b" stroke-width="3">
      <path d="M142 1496 H1180 M142 1534 H1180 M142 1572 H1180 M142 1610 H1180 M142 1648 H1180 M142 1686 H1180 M142 1724 H1180 M142 1762 H1180 M142 1800 H1180 M142 1838 H1180"/>
      <path d="M174 1476 V1848 M252 1476 V1848 M330 1476 V1848 M408 1476 V1848 M486 1476 V1848 M564 1476 V1848 M642 1476 V1848 M720 1476 V1848 M798 1476 V1848 M876 1476 V1848 M954 1476 V1848 M1032 1476 V1848 M1110 1476 V1848"/>
    </g>
    <g opacity="0.24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M156 1810 H520 M700 1810 H1130" stroke="#12bfe8" stroke-width="5"/>
      <path d="M210 1768 H340 V1718 H470 M820 1768 H990 V1718 H1120" stroke="#7e58c8" stroke-width="5"/>
    </g>`;

  if (variant.decoration === "left-stack") {
    return `${base}
      <rect x="130" y="1494" width="180" height="254" rx="14" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
      <g opacity="1">${techModule(150, 1512, 136, 44, "#087fa7")}${techModule(150, 1572, 136, 44, "#2e70b8")}${techModule(150, 1632, 136, 44, "#118f78")}${techModule(150, 1692, 136, 44, "#895ac2")}</g>
      <g opacity="0.72" fill="none" stroke-linecap="round"><path d="M286 1534 H330 M286 1594 H330 M286 1654 H330 M286 1714 H330" stroke="#12dfff" stroke-width="9"/><path d="M182 1772 H308 V1822 H472" stroke="#0b6e94" stroke-width="6"/></g>`;
  }
  if (variant.decoration === "right-stack") {
    return `${base}
      <rect x="1020" y="1494" width="180" height="254" rx="14" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
      <g opacity="1">${techModule(1042, 1512, 136, 44, "#087fa7")}${techModule(1042, 1572, 136, 44, "#2e70b8")}${techModule(1042, 1632, 136, 44, "#118f78")}${techModule(1042, 1692, 136, 44, "#895ac2")}</g>
      <g opacity="0.72" fill="none" stroke-linecap="round"><path d="M994 1534 H1042 M994 1594 H1042 M994 1654 H1042 M994 1714 H1042" stroke="#12dfff" stroke-width="9"/><path d="M710 1822 H1020 V1772 H1168" stroke="#0b6e94" stroke-width="6"/></g>`;
  }
  if (variant.decoration === "dual-stack") {
    return `${base}
      <rect x="128" y="1504" width="112" height="186" rx="12" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
      <rect x="1098" y="1504" width="112" height="186" rx="12" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
      <g opacity="1">${techModule(146, 1518, 76, 38, "#087fa7")}${techModule(146, 1576, 76, 38, "#2e70b8")}${techModule(146, 1634, 76, 38, "#118f78")}${techModule(1116, 1518, 76, 38, "#087fa7")}${techModule(1116, 1576, 76, 38, "#2e70b8")}${techModule(1116, 1634, 76, 38, "#895ac2")}</g>
      <g opacity="0.72" fill="none" stroke-linecap="round"><path d="M222 1537 H264 M222 1595 H264 M222 1653 H264 M1074 1537 H1116 M1074 1595 H1116 M1074 1653 H1116" stroke="#12dfff" stroke-width="8"/><path d="M172 1768 H342 V1820 H590 M780 1820 H1138 V1768" stroke="#0b6e94" stroke-width="6"/></g>`;
  }
  return `${base}
    <rect x="132" y="1496" width="146" height="72" rx="13" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <rect x="132" y="1746" width="146" height="72" rx="13" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <rect x="1018" y="1496" width="146" height="72" rx="13" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <rect x="1018" y="1746" width="146" height="72" rx="13" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <g opacity="1">${techModule(150, 1512, 108, 40, "#087fa7")}${techModule(150, 1762, 108, 40, "#118f78")}${techModule(1036, 1512, 108, 40, "#2e70b8")}${techModule(1036, 1762, 108, 40, "#895ac2")}</g>
    <g opacity="0.68" fill="none" stroke-linecap="round"><path d="M258 1532 H350 V1596 H430 M1036 1532 H940 V1596 H850" stroke="#12dfff" stroke-width="8"/><path d="M258 1782 H430 V1738 H560 M1036 1782 H874 V1738 H720" stroke="#0b6e94" stroke-width="6"/></g>`;
}

function techModule(x, y, width, height, color) {
  const midY = y + height / 2;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="7" fill="${color}" opacity="0.66" stroke="#063451" stroke-width="4"/>
    <rect x="${x + 10}" y="${y + 9}" width="${width - 20}" height="${height - 18}" rx="3" fill="#eef8ff" opacity="0.34"/>
    <path d="M${x + 14} ${midY} H${x + width - 16}" stroke="#e9feff" stroke-width="5" opacity="0.62"/>
    <circle cx="${x + 20}" cy="${midY}" r="6" fill="#e9feff" opacity="0.72"/>
    <circle cx="${x + width - 22}" cy="${midY}" r="6" fill="#e9feff" opacity="0.62"/>
  </g>`;
}

function textSvg(item, variant, titleLines, rulesLines) {
  const titleStart = titleLines.length > 1 ? zones.title.y + 58 + variant.titleDy : zones.title.y + 94 + variant.titleDy;
  const rulesX = variant.rulesX ?? zones.rulesText.x;
  const titleText = titleLines
    .map((line, index) => `<tspan x="${zones.title.x}" y="${titleStart + index * 60}">${escapeXml(line)}</tspan>`)
    .join("");
  const ruleStart = zones.rulesText.y + 78;
  const rulesText = rulesLines
    .map((line, index) => `<tspan x="${rulesX}" y="${ruleStart + index * variant.rulesLineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  const titleStroke = variant.titleStroke
    ? `<text font-family="${variant.titleFont}" font-size="${variant.titleSize}" font-weight="${variant.titleWeight}" fill="none" stroke="${variant.titleStroke}" stroke-width="${variant.titleStrokeWidth}" stroke-linejoin="round" letter-spacing="0">${titleText}</text>`
    : "";
  const rulesStroke = variant.rulesStroke !== "none"
    ? `<text font-family="${variant.rulesFont}" font-size="${variant.rulesSize}" font-weight="${variant.rulesWeight}" fill="none" stroke="${variant.rulesStroke}" stroke-width="${variant.rulesStrokeWidth}" stroke-linejoin="round" letter-spacing="0">${rulesText}</text>`
    : "";

  return `${titleStroke}
    <text font-family="${variant.titleFont}" font-size="${variant.titleSize}" font-weight="${variant.titleWeight}" fill="${variant.titleFill}" letter-spacing="0" filter="url(#smallShadow)">${titleText}</text>
    <text x="${zones.developmentCost.cx}" y="${zones.developmentCost.cy + 34}" text-anchor="middle" font-family="${variant.titleFont}" font-size="${zones.developmentCost.fontSize}" font-weight="950" fill="${variant.badgeFill}" stroke="${variant.badgeStroke}" stroke-width="${variant.badgeStrokeWidth}" paint-order="stroke">${item.advancementRequirement}</text>
    ${rulesStroke}
    <text font-family="${variant.rulesFont}" font-size="${variant.rulesSize}" font-weight="${variant.rulesWeight}" fill="${variant.rulesFill}" letter-spacing="0">${rulesText}</text>
    <text x="${zones.projectPoints.x + zones.projectPoints.width / 2}" y="${zones.projectPoints.y + 103}" text-anchor="middle" font-family="${variant.titleFont}" font-size="${zones.projectPoints.fontSize}" font-weight="950" fill="${variant.badgeFill}" stroke="${variant.badgeStroke}" stroke-width="${variant.badgeStrokeWidth}" paint-order="stroke">${item.projectPoints}</text>`;
}

function frameSvg() {
  return `
    <rect x="40" y="38" width="1408" height="2003" rx="96" fill="none" stroke="#07101f" stroke-width="28" opacity="0.95"/>
    <rect x="60" y="58" width="1368" height="1962" rx="78" fill="none" stroke="#0f4168" stroke-width="9" opacity="0.88"/>
    <rect x="82" y="82" width="1324" height="1914" rx="58" fill="none" stroke="#1bd5f0" stroke-width="3" opacity="0.38"/>
    <path d="M44 136 Q44 96 84 96 H146 V1984 H84 Q44 1984 44 1944 Z" fill="url(#circuitPanel)" stroke="#28e6ff" stroke-width="7" opacity="0.98"/>
    <path d="M1444 136 Q1444 96 1404 96 H1342 V1984 H1404 Q1444 1984 1444 1944 Z" fill="url(#circuitPanel)" stroke="#28e6ff" stroke-width="7" opacity="0.98"/>
    <g opacity="1" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)">
      <path d="M66 148 V722 M66 910 V1396 M66 1528 V1916" stroke="#72f8ff" stroke-width="12"/>
      <path d="M95 150 V492 L122 536 V668 L92 716 V1156 L124 1208 V1352 L94 1398 V1872" stroke="#24c9ee" stroke-width="8"/>
      <path d="M127 212 V430 M127 620 V1088 M127 1308 V1812" stroke="#1592c7" stroke-width="6"/>
      <path d="M66 780 H106 L132 818 M66 1448 H105 L135 1494 M95 552 H144 M95 1240 H144 M95 1870 H144" stroke="#72f8ff" stroke-width="8"/>
      <path d="M1422 148 V722 M1422 910 V1396 M1422 1528 V1916" stroke="#72f8ff" stroke-width="12"/>
      <path d="M1393 150 V492 L1366 536 V668 L1396 716 V1156 L1364 1208 V1352 L1394 1398 V1872" stroke="#24c9ee" stroke-width="8"/>
      <path d="M1361 212 V430 M1361 620 V1088 M1361 1308 V1812" stroke="#1592c7" stroke-width="6"/>
      <path d="M1422 780 H1382 L1356 818 M1422 1448 H1383 L1353 1494 M1393 552 H1344 M1393 1240 H1344 M1393 1870 H1344" stroke="#72f8ff" stroke-width="8"/>
    </g>
    <g opacity="1" fill="#061a31" stroke="#bafdff" stroke-width="6">
      <circle cx="66" cy="780" r="16"/><circle cx="132" cy="818" r="13"/><circle cx="95" cy="552" r="12"/><circle cx="95" cy="1240" r="12"/><circle cx="66" cy="1448" r="16"/><circle cx="95" cy="1870" r="12"/>
      <circle cx="1422" cy="780" r="16"/><circle cx="1356" cy="818" r="13"/><circle cx="1393" cy="552" r="12"/><circle cx="1393" cy="1240" r="12"/><circle cx="1422" cy="1448" r="16"/><circle cx="1393" cy="1870" r="12"/>
    </g>
    <path d="M75 75 H1078 L1165 154 L1078 235 H75 Z" fill="url(#titleFill)" stroke="#47e8ff" stroke-width="8"/>
    <path d="M83 226 H1070 L1138 160" fill="none" stroke="#9bfbff" stroke-width="3" opacity="0.74"/>
    <path d="M95 258 H1393 V1420 H95 Z" fill="none" stroke="#2ce7ff" stroke-width="10"/>
    <path d="M118 255 H1370 V1395 H118 Z" fill="none" stroke="#a9fbff" stroke-width="4" opacity="0.75"/>
    <path d="M130 268 H310 M118 448 V280 M1190 268 H1355 M1357 448 V280 M130 1382 H310 M118 1203 V1384 M1190 1382 H1355 M1357 1203 V1384" stroke="#d3fdff" stroke-width="5" opacity="0.62"/>
    <path d="M105 1417 H1234 L1372 1554 V1896 H105 Z" fill="url(#rulesFill)" stroke="#50e7ff" stroke-width="8"/>
    <path d="M114 1430 H1218 L1359 1569 V1881 H114 Z" fill="none" stroke="#092644" stroke-width="5" opacity="0.88"/>
    <path d="M126 1438 H1195 L1226 1468 H160" stroke="#ffffff" stroke-width="4" opacity="0.38"/>
    <path d="M112 1907 H1378" stroke="url(#accentLine)" stroke-width="5" opacity="0.86"/>
    <path d="M80 1980 H1408" stroke="#42e6ff" stroke-width="7" opacity="0.78"/>
    <path d="M82 95 V1982 M1406 95 V1982" stroke="#1ca7d6" stroke-width="5" opacity="0.42"/>
    <path d="M90 1480 H1342 M90 1564 H1342 M90 1648 H1342 M90 1732 H1342 M90 1816 H1342" stroke="#092644" stroke-width="2" opacity="0.14"/>
    <path d="M98 322 H1368 M98 492 H1368 M98 662 H1368 M98 832 H1368 M98 1002 H1368 M98 1172 H1368" stroke="#78f5ff" stroke-width="2" opacity="0.10"/>
    <path d="M195 247 V1403 M382 247 V1403 M569 247 V1403 M756 247 V1403 M943 247 V1403 M1130 247 V1403 M1317 247 V1403" stroke="#78f5ff" stroke-width="2" opacity="0.08"/>
    <path d="M58 44 H230 Q184 68 160 92 H92 Q92 160 68 184 Q44 222 44 58 Q44 44 58 44 Z" fill="url(#cornerFill)" stroke="#42e6ff" stroke-width="4" opacity="0.82"/>
    <path d="M1430 44 H1258 Q1304 68 1328 92 H1396 Q1396 160 1420 184 Q1444 222 1444 58 Q1444 44 1430 44 Z" fill="url(#cornerFill)" stroke="#42e6ff" stroke-width="4" opacity="0.82"/>
    <path d="M58 2035 H230 Q184 2011 160 1987 H92 Q92 1919 68 1895 Q44 1857 44 2021 Q44 2035 58 2035 Z" fill="url(#cornerFill)" stroke="#42e6ff" stroke-width="4" opacity="0.58"/>
    <path d="M1430 2035 H1258 Q1304 2011 1328 1987 H1396 Q1396 1919 1420 1895 Q1444 1857 1444 2021 Q1444 2035 1430 2035 Z" fill="url(#cornerFill)" stroke="#42e6ff" stroke-width="4" opacity="0.58"/>
    <g opacity="0.55" stroke="#68f0ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M132 196 H214 V150 H302"/><path d="M1332 298 H1262 V354 H1180"/><path d="M128 1320 H188 V1266 H286"/><path d="M1355 1320 H1285 V1260 H1198"/><path d="M170 1938 H250 V1878 H324"/><path d="M1318 1936 H1238 V1878 H1168"/>
    </g>
    <g opacity="0.9" fill="#0b1e34" stroke="#8cf8ff" stroke-width="4">
      <circle cx="214" cy="150" r="10"/><circle cx="302" cy="150" r="10"/><circle cx="1262" cy="354" r="10"/><circle cx="1180" cy="354" r="10"/><circle cx="188" cy="1266" r="9"/><circle cx="286" cy="1266" r="9"/><circle cx="1285" cy="1260" r="9"/><circle cx="1198" cy="1260" r="9"/><circle cx="250" cy="1878" r="9"/><circle cx="1238" cy="1878" r="9"/>
    </g>
    <path d="M1244 60 L1350 114 L1350 194 L1244 248 L1138 194 L1138 114 Z" fill="#081a2f" stroke="#7bf7ff" stroke-width="9" filter="url(#softGlow)"/>
    <path d="M1244 42 L1379 108 L1379 200 L1244 266 L1109 200 L1109 108 Z" fill="none" stroke="#1ba6d8" stroke-width="4" opacity="0.76"/>
    <path d="M1244 83 L1325 125 L1325 183 L1244 225 L1163 183 L1163 125 Z" fill="url(#badgeFill)" stroke="#d8fdff" stroke-width="4"/>
    <path d="M1172 171 H1204 M1284 171 H1316 M1228 115 V147 M1228 195 V227" stroke="#e6feff" stroke-width="4" opacity="0.38"/>
    <path d="M1208 1688 H1394 V1874 H1208 Z" fill="#081a2f" stroke="#7bf7ff" stroke-width="9" filter="url(#softGlow)"/>
    <path d="M1190 1670 H1412 V1892 H1190 Z" fill="none" stroke="#1ba6d8" stroke-width="4" opacity="0.78"/>
    <path d="M1229 1709 H1373 V1853 H1229 Z" fill="url(#badgeFill)" stroke="#d8fdff" stroke-width="4"/>
    <path d="M1242 1722 H1360 M1242 1840 H1360" stroke="#e6feff" stroke-width="4" opacity="0.42"/>
    <path d="M102 2031 H1386" stroke="#47e8ff" stroke-width="5" opacity="0.48"/>`;
}

function contactSheetHtml() {
  const cards = variants.map((variant) => {
    const imagePath = path.join(outRoot, "preview", `${variant.id}.png`).replace(/\\/g, "/");
    return `<div class="slot"><div class="label">${variant.label}</div><img src="file:///${imagePath}"></div>`;
  }).join("");
  return `<!doctype html><html><head><style>
    body{margin:0;width:860px;height:1160px;background:#181c23;font-family:Segoe UI,Arial,sans-serif;}
    .grid{display:grid;grid-template-columns:372px 372px;gap:56px 36px;padding:34px 40px;}
    .slot{width:372px;height:548px;}
    .label{height:28px;color:#dffcff;font-size:18px;font-weight:800;letter-spacing:0;text-align:left;}
    img{display:block;width:372px;height:520px;}
  </style></head><body><div class="grid">${cards}</div></body></html>`;
}

function formatTitle(title, variant) {
  return variant.titleTransform === "uppercase" ? title.toLocaleUpperCase("de-DE") : title;
}

function fitTitle(title, maxChars) {
  if (title.length <= maxChars) return [title];
  const hyphenIndex = title.indexOf("-");
  if (hyphenIndex > 0 && hyphenIndex < title.length - 1) {
    return [`${title.slice(0, hyphenIndex + 1)}`, title.slice(hyphenIndex + 1)];
  }
  return wrapText(title, maxChars, 2);
}

function wrapText(text, maxChars, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTrailingWhitespace(value) {
  return value.replace(/[ \t]+$/gm, "");
}
