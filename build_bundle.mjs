import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const jsonPath = path.join(dataDir, 'exoplanets.json');
const jsBundlePath = path.join(dataDir, 'exoplanets_bundle.js');
const artBundlePath = path.join(dataDir, 'concept_art_bundle.js');
const templatePath = path.join(__dirname, 'template.html');
const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(jsonPath)) {
  console.error('Error: data/exoplanets.json not found.');
  process.exit(1);
}

let rawJson = fs.readFileSync(jsonPath, 'utf8').trim();
if (rawJson.charCodeAt(0) === 0xFEFF) {
  rawJson = rawJson.slice(1);
}
fs.writeFileSync(jsBundlePath, `window.EXOPLANET_ATLAS_DATA = ${rawJson};\n`, 'utf8');

const artMap = {};
const trappistImg = path.join(__dirname, 'assets', 'trappist1e_horizon.jpg');
const cncImg = path.join(__dirname, 'assets', '55cnc_e_lava_world.jpg');
if (fs.existsSync(trappistImg)) {
  artMap.trappist1e = 'data:image/jpeg;base64,' + fs.readFileSync(trappistImg).toString('base64');
}
if (fs.existsSync(cncImg)) {
  artMap.cnc55e = 'data:image/jpeg;base64,' + fs.readFileSync(cncImg).toString('base64');
}
const artJson = JSON.stringify(artMap);
fs.writeFileSync(artBundlePath, `window.EXOPLANET_CONCEPT_ART = ${artJson};\n`, 'utf8');

if (fs.existsSync(templatePath)) {
  const tpl = fs.readFileSync(templatePath, 'utf8');
  const htmlOut = tpl.replace(
    '/*__INLINE_JSON_PLACEHOLDER__*/ null',
    `${rawJson}; window.EXOPLANET_CONCEPT_ART = ${artJson}`
  );
  fs.writeFileSync(indexPath, htmlOut, 'utf8');
  console.log('Built index.html and data bundles from template.html + data/exoplanets.json');
}
