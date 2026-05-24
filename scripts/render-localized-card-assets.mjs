import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skinRoot = path.join(repoRoot, "data", "card-assets", "localized", "de");
const cardsPath = path.join(skinRoot, "cards.de.json");
const framePath = path.join(skinRoot, "frames", "project-frame-v1.json");

const cardsData = JSON.parse(await readFile(cardsPath, "utf8"));
const frame = JSON.parse(await readFile(framePath, "utf8"));

const WIDTH = frame.canvas.width;
const HEIGHT = frame.canvas.height;
const sizes = frame.derivedSizes;
const zones = frame.zones;

await Promise.all([
  mkdir(path.join(skinRoot, "rendered", "svg"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "full"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "preview"), { recursive: true }),
  mkdir(path.join(skinRoot, "rendered", "thumb"), { recursive: true })
]);

if (!Array.isArray(cardsData.cards) || cardsData.cards.length === 0) {
  throw new Error("cards.de.json contains no renderable cards.");
}

for (const card of cardsData.cards) {
  const svg = await renderCardSvg(card);
  const svgPath = path.join(skinRoot, card.rendered.svg);
  await writeFile(svgPath, stripTrailingWhitespace(svg), "utf8");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  for (const card of cardsData.cards) {
    const svgPath = path.join(skinRoot, card.rendered.svg);
    const svg = await readFile(svgPath, "utf8");
    for (const [sizeName, size] of Object.entries(sizes)) {
      const outPath = path.join(skinRoot, card.rendered[sizeName]);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.setContent(
        `<!doctype html><html><head><style>html,body{margin:0;width:${size.width}px;height:${size.height}px;background:transparent;overflow:hidden;}img{display:block;width:${size.width}px;height:${size.height}px;}</style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" /></body></html>`,
        { waitUntil: "load" }
      );
      await page.screenshot({ path: outPath, omitBackground: true });
    }
  }

  await renderContactSheet(page);
} finally {
  await browser.close();
}

async function renderCardSvg(card) {
  const artPath = path.join(skinRoot, card.art);
  const artBase64 = (await readFile(artPath)).toString("base64");
  const titleLayout = fitTitle(card.localizedTitle.toLocaleUpperCase("de-DE"));
  const rulesLayout = layoutRules(card);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="outerFrame" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#071424"/>
      <stop offset="0.45" stop-color="#0b1c35"/>
      <stop offset="1" stop-color="#03101e"/>
    </linearGradient>
    <linearGradient id="titleFill" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#12385d" stop-opacity="0.98"/>
      <stop offset="1" stop-color="#07192d" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="rulesFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f0f8ff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#cbdcea" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="badgeFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#175987"/>
      <stop offset="1" stop-color="#08233e"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#78f5ff" stop-opacity="0.18"/>
      <stop offset="0.52" stop-color="#7cf7ff" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#78f5ff" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="cornerFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#15517d" stop-opacity="0.98"/>
      <stop offset="1" stop-color="#041323" stop-opacity="0.98"/>
    </linearGradient>
    <linearGradient id="circuitPanel" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#06264a" stop-opacity="0.98"/>
      <stop offset="0.55" stop-color="#0a1833" stop-opacity="0.98"/>
      <stop offset="1" stop-color="#02101f" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="cardClip"><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="70" ry="70"/></clipPath>
    <clipPath id="artClip"><rect x="${zones.art.x}" y="${zones.art.y}" width="${zones.art.width}" height="${zones.art.height}" rx="18" ry="18"/></clipPath>
  </defs>
  <g clip-path="url(#cardClip)">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#outerFrame)"/>
    <image href="data:image/png;base64,${artBase64}" x="${zones.art.x}" y="${zones.art.y}" width="${zones.art.width}" height="${zones.art.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)"/>
    ${frameSvg()}
    ${projectTextFieldDecorationSvg()}
    ${textSvg(card, titleLayout, rulesLayout)}
  </g>
</svg>`;
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
      <circle cx="66" cy="780" r="16"/>
      <circle cx="132" cy="818" r="13"/>
      <circle cx="95" cy="552" r="12"/>
      <circle cx="95" cy="1240" r="12"/>
      <circle cx="66" cy="1448" r="16"/>
      <circle cx="95" cy="1870" r="12"/>
      <circle cx="1422" cy="780" r="16"/>
      <circle cx="1356" cy="818" r="13"/>
      <circle cx="1393" cy="552" r="12"/>
      <circle cx="1393" cy="1240" r="12"/>
      <circle cx="1422" cy="1448" r="16"/>
      <circle cx="1393" cy="1870" r="12"/>
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
      <path d="M132 196 H214 V150 H302"/>
      <path d="M1332 298 H1262 V354 H1180"/>
      <path d="M128 1320 H188 V1266 H286"/>
      <path d="M1355 1320 H1285 V1260 H1198"/>
      <path d="M170 1938 H250 V1878 H324"/>
      <path d="M1318 1936 H1238 V1878 H1168"/>
    </g>
    <g opacity="0.9" fill="#0b1e34" stroke="#8cf8ff" stroke-width="4">
      <circle cx="214" cy="150" r="10"/>
      <circle cx="302" cy="150" r="10"/>
      <circle cx="1262" cy="354" r="10"/>
      <circle cx="1180" cy="354" r="10"/>
      <circle cx="188" cy="1266" r="9"/>
      <circle cx="286" cy="1266" r="9"/>
      <circle cx="1285" cy="1260" r="9"/>
      <circle cx="1198" cy="1260" r="9"/>
      <circle cx="250" cy="1878" r="9"/>
      <circle cx="1238" cy="1878" r="9"/>
    </g>
    <path d="M1244 60 L1350 114 L1350 194 L1244 248 L1138 194 L1138 114 Z" fill="#081a2f" stroke="#7bf7ff" stroke-width="9" filter="url(#softGlow)"/>
    <path d="M1244 42 L1379 108 L1379 200 L1244 266 L1109 200 L1109 108 Z" fill="none" stroke="#1ba6d8" stroke-width="4" opacity="0.76"/>
    <path d="M1244 83 L1325 125 L1325 183 L1244 225 L1163 183 L1163 125 Z" fill="url(#badgeFill)" stroke="#d8fdff" stroke-width="4"/>
    <path d="M1172 171 H1204 M1284 171 H1316 M1228 115 V147 M1228 195 V227" stroke="#e6feff" stroke-width="4" opacity="0.38"/>
    <path d="M1208 1688 H1394 V1874 H1208 Z" fill="#081a2f" stroke="#7bf7ff" stroke-width="9" filter="url(#softGlow)"/>
    <path d="M1190 1670 H1412 V1892 H1190 Z" fill="none" stroke="#1ba6d8" stroke-width="4" opacity="0.78"/>
    <path d="M1229 1709 H1373 V1853 H1229 Z" fill="url(#badgeFill)" stroke="#d8fdff" stroke-width="4"/>
    <path d="M1242 1722 H1360 M1242 1840 H1360" stroke="#e6feff" stroke-width="4" opacity="0.42"/>
    <path d="M102 2031 H1386" stroke="#47e8ff" stroke-width="5" opacity="0.48"/>
  `;
}

function projectTextFieldDecorationSvg() {
  return `
    <g opacity="0.18" fill="none" stroke="#06243b" stroke-width="3">
      <path d="M142 1496 H1180 M142 1534 H1180 M142 1572 H1180 M142 1610 H1180 M142 1648 H1180 M142 1686 H1180 M142 1724 H1180 M142 1762 H1180 M142 1800 H1180 M142 1838 H1180"/>
      <path d="M174 1476 V1848 M252 1476 V1848 M330 1476 V1848 M408 1476 V1848 M486 1476 V1848 M564 1476 V1848 M642 1476 V1848 M720 1476 V1848 M798 1476 V1848 M876 1476 V1848 M954 1476 V1848 M1032 1476 V1848 M1110 1476 V1848"/>
    </g>
    <g opacity="0.24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M156 1810 H520 M700 1810 H1130" stroke="#12bfe8" stroke-width="5"/>
      <path d="M210 1768 H340 V1718 H470 M820 1768 H990 V1718 H1120" stroke="#7e58c8" stroke-width="5"/>
    </g>
    <rect x="128" y="1504" width="112" height="186" rx="12" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <rect x="1228" y="1504" width="112" height="186" rx="12" fill="#092b43" opacity="0.34" stroke="#35e8ff" stroke-width="4"/>
    <g opacity="1">
      ${techModuleSvg(146, 1518, 76, 38, "#087fa7")}
      ${techModuleSvg(146, 1576, 76, 38, "#2e70b8")}
      ${techModuleSvg(146, 1634, 76, 38, "#118f78")}
      ${techModuleSvg(1246, 1518, 76, 38, "#087fa7")}
      ${techModuleSvg(1246, 1576, 76, 38, "#2e70b8")}
      ${techModuleSvg(1246, 1634, 76, 38, "#895ac2")}
    </g>
    <g opacity="0.72" fill="none" stroke-linecap="round">
      <path d="M222 1537 H264 M222 1595 H264 M222 1653 H264 M1204 1537 H1246 M1204 1595 H1246 M1204 1653 H1246" stroke="#12dfff" stroke-width="8"/>
      <path d="M172 1768 H342 V1820 H590 M780 1820 H1268 V1694" stroke="#0b6e94" stroke-width="6"/>
    </g>
  `;
}

function techModuleSvg(x, y, width, height, color) {
  const midY = y + height / 2;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="7" fill="${color}" opacity="0.66" stroke="#063451" stroke-width="4"/>
    <rect x="${x + 10}" y="${y + 9}" width="${width - 20}" height="${height - 18}" rx="3" fill="#eef8ff" opacity="0.34"/>
    <path d="M${x + 14} ${midY} H${x + width - 16}" stroke="#e9feff" stroke-width="5" opacity="0.62"/>
    <circle cx="${x + 20}" cy="${midY}" r="6" fill="#e9feff" opacity="0.72"/>
    <circle cx="${x + width - 22}" cy="${midY}" r="6" fill="#e9feff" opacity="0.62"/>
  </g>`;
}

function textSvg(card, titleLayout, rulesLayout) {
  const titleText = titleLayout.lines
    .map((line, index) => `<tspan x="${zones.title.x}" y="${titleLayout.startY + index * titleLayout.lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  const projectClass = card.localizedProjectClass.toLocaleUpperCase("de-DE");
  const classY = zones.rulesText.y + 76;
  const classFontSize = fitTextFontSize(projectClass, 760, 52, 30, 0.58);
  const classText = `<tspan x="280" y="${classY}">${escapeXml(projectClass)}</tspan>`;
  const rulesStroke = renderRuleTextItems(rulesLayout, "none", "#ffffff", 2);
  const rulesFill = renderRuleTextItems(rulesLayout, "#04111d", "none", 0);
  return `
    <text font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${titleLayout.fontSize}" font-weight="900" fill="none" stroke="#0b2945" stroke-width="8" stroke-linejoin="round" letter-spacing="0">${titleText}</text>
    <text font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${titleLayout.fontSize}" font-weight="900" fill="#ffffff" letter-spacing="0">${titleText}</text>
    <text x="${zones.developmentCost.cx}" y="${zones.developmentCost.cy + 34}" text-anchor="middle" font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${zones.developmentCost.fontSize}" font-weight="950" fill="#ffffff" stroke="#07243e" stroke-width="6" paint-order="stroke">${card.advancementRequirement}</text>
    <path d="M275 ${classY + 18} H1068" stroke="#0c405f" stroke-width="7" opacity="0.42"/>
    <path d="M275 ${classY + 18} H642" stroke="#20d7f2" stroke-width="5" opacity="0.72"/>
    <text font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${classFontSize}" font-weight="950" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" letter-spacing="0">${classText}</text>
    <text font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${classFontSize}" font-weight="950" fill="#063050" letter-spacing="0">${classText}</text>
    ${renderRuleSymbols(rulesLayout)}
    ${rulesStroke}
    ${rulesFill}
    <text x="${zones.projectPoints.x + zones.projectPoints.width / 2}" y="${zones.projectPoints.y + 103}" text-anchor="middle" font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${zones.projectPoints.fontSize}" font-weight="950" fill="#ffffff" stroke="#07243e" stroke-width="6" paint-order="stroke">${card.projectPoints}</text>
  `;
}

function renderRuleSymbols(layout) {
  return layout.lines
    .flatMap((line) => line.items.filter((item) => item.kind === "symbol"))
    .map((item) => {
      if (item.symbol === "action") return actionSymbolSvg(item.x, item.y - item.size + 10, item.size);
      if (item.symbol === "gridmark") return gridmarkSymbolSvg(item.x, item.y - item.size + 10, item.size, item.amount);
      return "";
    })
    .join("");
}

function renderRuleTextItems(layout, fill, stroke, strokeWidth) {
  const textItems = layout.lines.flatMap((line) => line.items.filter((item) => item.kind === "text" && item.text.trim().length > 0));
  if (textItems.length === 0) return "";
  const paint = stroke === "none"
    ? `fill="${fill}"`
    : `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`;
  return `<g font-family="Arial, Helvetica, sans-serif" font-size="${layout.fontSize}" font-weight="800" letter-spacing="0">
    ${textItems.map((item) => `<text x="${item.x}" y="${item.y}" ${paint}>${escapeXml(item.text)}</text>`).join("")}
  </g>`;
}

function actionSymbolSvg(x, y, size) {
  const pointX = x + size * 1.05;
  const midY = y + size / 2;
  const leftTopX = x + size * 0.18;
  const leftBottomX = x;
  const leftTopY = y + size * 0.08;
  const leftBottomY = y + size * 0.92;
  return `<g filter="url(#softGlow)">
    <path d="M${leftTopX} ${leftTopY} L${pointX} ${midY} L${leftBottomX} ${leftBottomY} Z" fill="#062238" stroke="#09243d" stroke-width="8" stroke-linejoin="round"/>
    <path d="M${leftTopX + 7} ${leftTopY + 8} L${pointX - 9} ${midY} L${leftBottomX + 10} ${leftBottomY - 8} Z" fill="#0d77a0" stroke="#effcff" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${leftTopX + 18} ${leftTopY + 18} L${pointX - 22} ${midY} L${leftBottomX + 24} ${leftBottomY - 19} Z" fill="#d9fbff" opacity="0.88"/>
    <path d="M${leftTopX + 9} ${leftTopY + 12} L${leftBottomX + 12} ${leftBottomY - 12}" stroke="#06344f" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
  </g>`;
}

function gridmarkSymbolSvg(x, y, size, amount) {
  const symbolSize = Math.round(size * 0.92);
  const numberSize = size * 0.78;
  const label = amount && amount > 1 ? String(amount) : "";
  const numberWidth = label ? measureText(label, numberSize, 0.58) : 0;
  const symbolX = label ? x + numberWidth + size * 0.42 : x;
  const symbolY = y + size * 0.06;
  const centerX = symbolX + symbolSize / 2;
  const centerY = symbolY + symbolSize / 2;
  const numberY = y + size * 0.73;
  return `<g>
    ${label ? `<text x="${x}" y="${numberY}" font-family="Arial Narrow, Bahnschrift Condensed, Arial, sans-serif" font-size="${numberSize}" font-weight="950" fill="#04111d">${escapeXml(label)}</text>` : ""}
    <circle cx="${centerX}" cy="${centerY}" r="${symbolSize * 0.5}" fill="#e8ae16"/>
    <circle cx="${centerX - symbolSize * 0.07}" cy="${centerY - symbolSize * 0.08}" r="${symbolSize * 0.38}" fill="#ffd65f"/>
    <circle cx="${centerX - symbolSize * 0.2}" cy="${centerY - symbolSize * 0.2}" r="${symbolSize * 0.11}" fill="#fff4b0" opacity="0.9"/>
  </g>`;
}

function gridmarkTokenWidth(amount, iconSize, fontSize) {
  if (amount && amount > 1) {
    return Math.ceil(measureText(String(amount), iconSize * 0.78, 0.58) + iconSize * 1.75);
  }
  return Math.ceil(iconSize * 1.35);
}

function fitTitle(title) {
  const maxWidth = 850;
  for (const fontSize of [66, 62, 58, 54, 50, 46]) {
    const lines = wrapTextByWidth(title, maxWidth, fontSize, 2, 0.56);
    if (lines.every((line) => measureText(line, fontSize, 0.56) <= maxWidth)) {
      return {
        lines,
        fontSize,
        lineHeight: Math.round(fontSize * 0.94),
        startY: lines.length > 1 ? zones.title.y + 70 : zones.title.y + 102
      };
    }
  }
  const lines = wrapTextByWidth(title, maxWidth, 44, 2, 0.54);
  return { lines, fontSize: 44, lineHeight: 48, startY: lines.length > 1 ? zones.title.y + 75 : zones.title.y + 104 };
}

function fitTextFontSize(value, maxWidth, maxFontSize, minFontSize, factor) {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    if (measureText(value, fontSize, factor) <= maxWidth) return fontSize;
  }
  return minFontSize;
}

function layoutRules(card) {
  const blocks = normalizeRuleBlocks(card);
  for (const fontSize of [46, 44, 42, 40, 38, 36, 34, 32]) {
    const layout = layoutRuleBlocks(blocks, fontSize);
    if (layout.height <= 302) return layout;
  }
  return layoutRuleBlocks(blocks, 31);
}

function normalizeRuleBlocks(card) {
  if (Array.isArray(card.localizedRules)) {
    return card.localizedRules;
  }
  if (!card.localizedRulesText) return [];
  return String(card.localizedRulesText)
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => ({ type: "paragraph", segments: [{ type: "text", text: line }] }));
}

function layoutRuleBlocks(blocks, fontSize) {
  const startX = 280;
  const maxWidth = 876;
  const startY = zones.rulesText.y + 158;
  const lineHeight = Math.round(fontSize * 1.22);
  const blockGap = Math.round(fontSize * 0.34);
  const iconSize = Math.round(fontSize * 1.1);
  const lines = [];
  let currentY = startY;

  for (const block of blocks) {
    const tokens = tokenizeRuleSegments(block.segments ?? [], fontSize, iconSize);
    let currentLine = { y: currentY, items: [], width: 0 };
    for (const token of tokens) {
      const leadingGap = token.kind === "symbol" && currentLine.items.length > 0 ? Math.round(fontSize * 0.46) : 0;
      const pendingWidth = currentLine.width + leadingGap + token.width;
      if (currentLine.items.length > 0 && pendingWidth > maxWidth) {
        finalizeLine(currentLine);
        lines.push(currentLine);
        currentY += lineHeight;
        currentLine = { y: currentY, items: [], width: 0 };
      }
      const effectiveGap = token.kind === "symbol" && currentLine.items.length > 0 ? leadingGap : 0;
      const normalized = { ...token, x: startX + currentLine.width + effectiveGap, y: currentY, size: iconSize };
      if (normalized.kind === "text" && currentLine.items.length === 0) {
        normalized.text = normalized.text.trimStart();
        normalized.width = measureText(normalized.text, fontSize);
      }
      currentLine.items.push(normalized);
      currentLine.width += effectiveGap + normalized.width;
    }
    finalizeLine(currentLine);
    if (currentLine.items.length > 0) {
      lines.push(currentLine);
      currentY += lineHeight + blockGap;
    }
  }

  const height = lines.length === 0 ? 0 : lines.at(-1).y - startY + lineHeight;
  return { lines, fontSize, lineHeight, height };
}

function tokenizeRuleSegments(segments, fontSize, iconSize) {
  const tokens = [];
  for (const segment of segments) {
    if (segment.type === "text") {
      const parts = String(segment.text).match(/\S+\s*/g) ?? [];
      for (const part of parts) {
        tokens.push({ kind: "text", text: part, width: measureText(part, fontSize) });
      }
      continue;
    }
    if (segment.type === "symbol" && segment.symbol === "action") {
      const amount = Math.max(1, Number(segment.amount ?? 1));
      for (let i = 0; i < amount; i += 1) {
        tokens.push({ kind: "symbol", symbol: "action", amount: 1, width: Math.round(iconSize * 1.22) });
      }
      continue;
    }
    if (segment.type === "symbol" && segment.symbol === "gridmark") {
      tokens.push({
        kind: "symbol",
        symbol: "gridmark",
        amount: segment.amount,
        width: gridmarkTokenWidth(segment.amount, iconSize, fontSize)
      });
    }
  }
  return tokens;
}

function finalizeLine(line) {
  const merged = [];
  for (const item of line.items) {
    const previous = merged.at(-1);
    if (item.kind === "text" && previous?.kind === "text") {
      previous.text += item.text;
      previous.width += item.width;
      continue;
    }
    merged.push(item);
  }
  line.items = merged;
  const firstText = line.items.find((item) => item.kind === "text");
  if (firstText) firstText.text = firstText.text.trimStart();
  const lastText = [...line.items].reverse().find((item) => item.kind === "text");
  if (lastText) lastText.text = lastText.text.trimEnd();
}

function wrapTextByWidth(text, maxWidth, fontSize, maxLines, factor = 0.54) {
  const words = text.replace(/-/g, "- ").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (measureText(next, fontSize, factor) <= maxWidth || !current) {
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

function measureText(value, fontSize, factor = 0.63) {
  return String(value).split("").reduce((width, char) => {
    if (char === " ") return width + fontSize * 0.29;
    if (".,;:!|".includes(char)) return width + fontSize * 0.22;
    if ("MWÄÖÜ".includes(char)) return width + fontSize * 0.72;
    if (char === "-") return width + fontSize * 0.32;
    return width + fontSize * factor;
  }, 0);
}

async function renderContactSheet(page) {
  const columns = 6;
  const cardWidth = 186;
  const cardHeight = 260;
  const labelHeight = 46;
  const gap = 20;
  const padding = 24;
  const rows = Math.ceil(cardsData.cards.length / columns);
  const width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  const height = padding * 2 + rows * (cardHeight + labelHeight) + (rows - 1) * gap;
  await page.setViewportSize({ width, height });
  const slots = (
    await Promise.all(
      cardsData.cards.map(async (card) => {
        const imagePath = path.join(skinRoot, card.rendered.preview);
        const previewBase64 = (await readFile(imagePath)).toString("base64");
        return `<div class="slot"><img src="data:image/png;base64,${previewBase64}"><div class="label">${escapeHtml(card.localizedTitle)}</div></div>`;
      })
    )
  ).join("");
  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;width:${width}px;height:${height}px;background:#111820;overflow:hidden;}
    body{font-family:Segoe UI,Arial,sans-serif;}
    .grid{display:grid;grid-template-columns:repeat(${columns},${cardWidth}px);gap:${gap}px;padding:${padding}px;}
    .slot{width:${cardWidth}px;height:${cardHeight + labelHeight}px;}
    img{display:block;width:${cardWidth}px;height:${cardHeight}px;}
    .label{height:${labelHeight}px;color:#e6fbff;font-size:14px;line-height:16px;font-weight:700;letter-spacing:0;overflow:hidden;padding-top:6px;}
  </style></head><body><div class="grid">${slots}</div></body></html>`, { waitUntil: "load" });
  await page.screenshot({ path: path.join(skinRoot, "rendered", "agenda-preview-contact-sheet.png"), omitBackground: false });
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

function escapeHtml(value) {
  return escapeXml(value).replace(/'/g, "&#39;");
}
